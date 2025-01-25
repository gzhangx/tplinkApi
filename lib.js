const { util } = require('@gzhangx/googleapi');
const crypto = require('crypto');

//https://github.com/marcomow/home-assistant-tp-link-router-addon/blob/7af13b3351047bfc2e29729488bc449f3eaef3c7/src/index.ts

function getAes() {
    const AES_KEY_BYTES = 16;
    const MIN_AES_KEY = 10 ** (AES_KEY_BYTES - 1);
    const MAX_AES_KEY = (10 ** AES_KEY_BYTES) - 1;
    const randomAK = () => Math.floor(Math.random() * (MAX_AES_KEY - MIN_AES_KEY)) + MIN_AES_KEY;
    //# TPLink requires key and IV to be a 16 digit number(no leading 0s)
    //const key = 1728043569335086;  //randomAK();
    //const iv = 1728043569335086;  //randomAK();
    const key = randomAK();
    const iv = randomAK();

    
    const keyBuf = Buffer.from(key.toString());
    const ivBuf = Buffer.from(iv.toString());
    return {
        key,
        iv,
        encrypt: text => {
            console.log('key', key, 'iv', iv, 'keybuf', keyBuf.toString('hex'), ivBuf.toString('hex'));
            const cipher = crypto.createCipheriv('aes-128-cbc', keyBuf, ivBuf);
            let encrypted = cipher.update(text, undefined, 'hex');
            encrypted += cipher.final('hex');
            return Buffer.from(encrypted, 'hex').toString('base64');
        },
        decrypt: text => {
            const decipher = crypto.createDecipheriv('aes-128-cbc', keyBuf, ivBuf);
            let decryted = decipher.update(text, 'base64', 'utf8');
            decryted += decipher.final('utf8');
            return decryted;
        }
    }
}


function padPKCS7(dataStr, blockSize = 128 / 8) {
    const data = Buffer.from(dataStr);
    const padding = blockSize - (data.length % blockSize);
    const paddingBuffer = Buffer.alloc(padding, padding);
    return Buffer.concat([data, paddingBuffer]);
}


function getRSAEncryptor(modulusExpAry) {
    const modu = Buffer.from(modulusExpAry[0], 'hex');
    const modulusBuffer = modu.toString('base64');
    const exponentBuffer = Buffer.from(modulusExpAry[1], 'hex').toString('base64');



    // Create the public key object
    const keyObject = {
        key: {
            kty: 'RSA',
            n: modulusBuffer,
            e: exponentBuffer
        },
        format: 'jwk'
    };

    // Convert the public key object to PEM format
    const publicKey = crypto.createPublicKey(keyObject); //.export({ type: 'spki', format: 'pem' });
    const MAX = modu.length - 11;
    return data => {
        let res = '';        
        while (data.length) {
            res += crypto.publicEncrypt({
                key: publicKey,
                padding: crypto.constants.RSA_PKCS1_PADDING
            }, data.substring(0, MAX)).toString('hex');            
            data = data.substring(MAX);
        }
        return res;
    }
}

//https://gist.github.com/rosmo/29200c1aedb991ce55942c4ae8b54edd
async function getToken(host, password) {
    const headers = {
        'content-Type': 'application/x-www-form-urlencoded'
    };
    let data = {
        operation: 'read',
    };
    const loginUrl = form => `http://${host}/cgi-bin/luci/;stok=/login?form=${form}`
    const pwdKeyRes = await util.doHttpRequest({
        method: 'POST',
        url: loginUrl('keys'),
        data,
        headers,
    });
    const passwordRsaKey = pwdKeyRes.data;
    const password_rsa_public_key = passwordRsaKey.data.password;    
    if (!password_rsa_public_key)
        throw new Error('Cant fetch RSA keys for password ' + JSON.stringify(pwdKeyRes.data));


    const res2 = await util.doHttpRequest({
        method: 'POST',
        url: loginUrl('auth'),
        data,
        headers,
    });

    const encryptRsa = res2.data;    
    const rsaSeq = encryptRsa.data.seq;    
    const passwordHex = getRSAEncryptor(password_rsa_public_key)(password);
    const aesEnc = getAes();


    const md5 = crypto.createHash('MD5');
    const passwordHash = md5.update(password).digest('hex');    
    
    const encr = getRSAEncryptor(encryptRsa.data.key);
    
    
    const login_payload = {
        "params": { "password": passwordHex },
        "operation": "login",
    }

    const sdata = aesEnc.encrypt(JSON.stringify(login_payload));    
    const encryptStr = `k=${aesEnc.key}&i=${aesEnc.iv}&h=${passwordHash}&s=${rsaSeq + sdata.length}`;    
    const sign = encr(encryptStr);    
    
    console.log('rsaseq + sdata.length',rsaSeq, sdata.length, rsaSeq+sdata.length)
    const authres = await util.doHttpRequest({
        method: 'POST',
        url: 'http://192.168.0.1/cgi-bin/luci/;stok=/login?form=login', //loginUrl('login'),
        data: Buffer.from(`sign=${sign}&data=${encodeURIComponent(sdata)}`),
        headers,
    });

    console.log('authRes', authres.statusMessage, authres.data, 'data len', sdata.length, 'sign len', sign.length);

    if (authres.data.toString() === '')console.log('BAD')
 
    //console.log('try decrypt', aesEnc.decrypt('uHTss4NSQXBoPbgBcQ+B41STNCjfQrmweT7RkOzQWB9lDTkf5L6A9T5oN/3keXfAci52oVLpKushl6Ucn1ygXA=='))
}




async function partialTest(p) {
    if (p) {
        const headers = {
            'content-Type': 'application/x-www-form-urlencoded'
        };
        const host = '192.168.0.1', password = 'test';
        const password_rsa_public_key = ['D1E79FF135D14E342D76185C23024E6DEAD4D6EC2C317A526C811E83538EA4E5ED8E1B0EEE5CE26E3C1B6A5F1FE11FA804F28B7E8821CA90AFA5B2F300DF99FDA27C9D2131E031EA11463C47944C05005EF4C1CE932D7F4A87C7563581D9F27F0C305023FCE94997EC7D790696E784357ED803A610EBB71B12A8BE5936429BFD',
            '010001'];
        const encryptRsa = {
            data: {
                seq: 502805824,
                key: [
                    'B419F9FE09ACACDBDA9F9B57F07445FDB22E742293308299BAA20F543AACEF9C2BBEAB772D3EB3591073CB5CBA3A7DC4FC3FB4E8A5078A1854B4CC1A827B295D',
                    '010001'
                ],
            }
        }
        const rsaSeq = encryptRsa.data.seq;
        console.log('encrypting pwd', password);
        let passwordHex = getRSAEncryptor(password_rsa_public_key)(password);
        //console.log('forcing password hex to be C762FB52B9A847325F5EA24B1EE193DBB69BC20E97A00900E0683C4AA67E5278FBE9797FD54448711B8C3BE0428F0D93506B55D574E98B015D3431E4B06D1F9D')
        //passwordHex = 'C762FB52B9A847325F5EA24B1EE193DBB69BC20E97A00900E0683C4AA67E5278FBE9797FD54448711B8C3BE0428F0D93506B55D574E98B015D3431E4B06D1F9D'
        //rsaSeq = 903365446        


        console.log('password fake encrypted to to ================>', passwordHex)

        console.log('------------------')

        const aesEnc = getAes();


        const md5 = crypto.createHash('MD5');
        const passwordHash = md5.update(password).digest('hex');
        console.log('password hash=', passwordHash, 'should match 098f6bcd4621d373cade4e832627b4f6')
        // for "sign" parameter

        const encr = getRSAEncryptor(encryptRsa.data.key);
        //console.log('create encr for ', res2.data.data.key, res2.data.data.key[0].length)


        const login_payload = {
            "params": { "password": passwordHex },
            "operation": "login",
        }

        const sdata = aesEnc.encrypt(JSON.stringify(login_payload));
        console.log('Encryting login_payload', login_payload, 'gotSDATA  =============>>>>>>>>>>>>>>>', sdata);
        let encryptStr = `k=${aesEnc.key}&i=${aesEnc.iv}&h=${passwordHash}&s=${rsaSeq + sdata.length}`;

        console.log('encryptStr is', encryptStr, encryptStr.length)
        console.log("encrypting with key", encryptRsa.data.key)

        const sign = encr(encryptStr);
        console.log('sdata---------------------------->')
        console.log(sdata);
        console.log(encodeURIComponent(sdata))

        console.log('rsaseq + sdata.length', rsaSeq, sdata.length, rsaSeq + sdata.length)
        const loginUrl = form => `http://${host}/cgi-bin/luci/;stok=/login?form=${form}`
        const authres = await util.doHttpRequest({
            method: 'POST',
            url: loginUrl('login'),
            data1: Buffer.from('sign=b1ceec6275d324bfd396b1f284b52a49bb674da4ea3e1d0f33221554b5d48ff4348bbc9c48fc836e606084748803607522b68fdd9586cfae0bfcf8e57c481e9f1b4463dc2ebec9d876f3d0868bf50af48e27d06bb440e19780b7f80873d0aa3259930c345e13ae1847659dcd225a1d0e56e8790cbe95fad398e33de8abc9defc&data=F%2BII1cekqDa28GWHuWgJKTgRMnAlYD5j%2BO61tWPvCsJ5L6GKczi9Q%2F7NJOxQP6ea1VY%2BllTAY1%2B9iX9VeW8jmV0SEEIa3WmDZstlxv9BqyMv3%2BlU%2FVxNG2SxehMTPsurNTYiReHY5CsWr%2BXgB9G8Dk0UTNnVi7LZGYMDZOqcxL0K7bTBHSs9kDQLXov4Y4erw45dMoyjjNrsU21i%2FU54rssQ5ZK1KQ0eA9JPXhZEjJ438cB3DtSqPLte3aZNfCeuf1s%2FaLVIyeXKj3ssBFnw98cSKPQm7WHxBMYslBtbboW%2BdiBJryhDBNiOzCK8QUHkj8%2FYFUzK%2FOzt%2B%2BbaEaJ79PgiIpr%2F2vGBts%2BStO8tRWd%2B%2F1lzvCvXFvrKFr%2B3gmFYPAHwaQWxEV7S7jQdgxllHQ%3D%3D'),
            data: Buffer.from(`data=${encodeURIComponent(sdata)}&sign=${sign}`),
            data2: {
                data: 'F+II1cekqDa28GWHuWgJKTgRMnAlYD5j+O61tWPvCsJ5L6GKczi9Q/7NJOxQP6ea1VY+llTAY1+9iX9VeW8jmV0SEEIa3WmDZstlxv9BqyMv3+lU/VxNG2SxehMTPsurNTYiReHY5CsWr+XgB9G8Dk0UTNnVi7LZGYMDZOqcxL0K7bTBHSs9kDQLXov4Y4erw45dMoyjjNrsU21i/U54rssQ5ZK1KQ0eA9JPXhZEjJ438cB3DtSqPLte3aZNfCeuf1s/aLVIyeXKj3ssBFnw98cSKPQm7WHxBMYslBtbboW+diBJryhDBNiOzCK8QUHkj8/YFUzK/Ozt++baEaJ79PgiIpr/2vGBts+StO8tRWd+/1lzvCvXFvrKFr+3gmFYPAHwaQWxEV7S7jQdgxllHQ==',
                sign: 'b1ceec6275d324bfd396b1f284b52a49bb674da4ea3e1d0f33221554b5d48ff4348bbc9c48fc836e606084748803607522b68fdd9586cfae0bfcf8e57c481e9f1b4463dc2ebec9d876f3d0868bf50af48e27d06bb440e19780b7f80873d0aa3259930c345e13ae1847659dcd225a1d0e56e8790cbe95fad398e33de8abc9defc',
            },
            headers,
        });
        console.log(`authRes ${authres.statusMessage} '${authres.data.toString()}' 'data len' ${sdata.length}, 'sign len' ${sign.length}`);

        if (authres.data.toString() === '') console.log('BAD')
    } else
    getToken('192.168.0.1', 'test')
}


partialTest(false)
//console.log('pwd=', process.argv[2])