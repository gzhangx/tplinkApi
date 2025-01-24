const { util } = require('@gzhangx/googleapi');
const crypto = require('crypto');

//https://github.com/marcomow/home-assistant-tp-link-router-addon/blob/7af13b3351047bfc2e29729488bc449f3eaef3c7/src/index.ts

function getAes() {
    const AES_KEY_BYTES = 16;
    const MIN_AES_KEY = 10 ** (AES_KEY_BYTES - 1);
    const MAX_AES_KEY = (10 ** AES_KEY_BYTES) - 1;
    const randomAK = () => Math.floor(Math.random() * (MAX_AES_KEY - MIN_AES_KEY)) + MIN_AES_KEY;
    //# TPLink requires key and IV to be a 16 digit number(no leading 0s)
    //const key = crypto.randomBytes(32); // 256-bit key
    //const iv = crypto.randomBytes(16);
    const key = 1728043569335086;  //randomAK();
    const iv = 1728043569335086;  //randomAK();

    
    const keyBuf = Buffer.from(key.toString().padStart(32,'0'));
    const ivBuf = Buffer.from(iv.toString());
    return {
        key,
        iv,
        encrypt: text => {
            console.log('key', key, 'iv', iv, 'keybuf', keyBuf.toString('hex'), ivBuf.toString('HEX'));
            const cipher = crypto.createCipheriv('aes-256-cbc', keyBuf, ivBuf);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return Buffer.from(encrypted, 'hex').toString('base64');
        }
    }
}

function pad(data, blockSize) {
    const padding = blockSize - (data.length % blockSize);
    const paddingBuffer = Buffer.alloc(padding);
    return Buffer.concat([Buffer.from(data), paddingBuffer]);
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
            console.log('axxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx=',MAX)
            res += crypto.publicEncrypt({
                key: publicKey,
                padding: crypto.constants.RSA_PKCS1_PADDING
            }, data.substring(0, MAX)).toString('HEX');
            data = data.substring(MAX);
        }
        return res;
    }
}

//https://gist.github.com/rosmo/29200c1aedb991ce55942c4ae8b54edd
async function getToken(host, password) {
    const headers =  {
        'content-Type': 'application/x-www-form-urlencoded'
    };
    let data = {
        operation: 'read',
    };    
    const loginUrl =  form => `http://${host}/cgi-bin/luci/;stok=/login?form=${form}`
    const pwdKeyRes = await util.doHttpRequest({
        method: 'POST',
        url: loginUrl('keys'),
        data,
        headers,
    });
    const password_rsa_public_key = pwdKeyRes.data.data.password;
    console.log('pwdKeyRes.data', pwdKeyRes.data)
    if (!password_rsa_public_key) throw new Error('Cant fetch RSA keys for password ' + JSON.stringify(pwdKeyRes.data));


    const res2 = await util.doHttpRequest({
        method: 'POST',
        url: loginUrl('auth'),
        data,
        headers,
    });
    console.log('------------------------ auth rsa n ',res2.data)
    let rsaSeq = res2.data.data.seq;
    

    console.log('encrypting pwd', password)
    let passwordHex = getRSAEncryptor(password_rsa_public_key)(password);
    //console.log('forcing password hex to be C762FB52B9A847325F5EA24B1EE193DBB69BC20E97A00900E0683C4AA67E5278FBE9797FD54448711B8C3BE0428F0D93506B55D574E98B015D3431E4B06D1F9D')
    //passwordHex = 'C762FB52B9A847325F5EA24B1EE193DBB69BC20E97A00900E0683C4AA67E5278FBE9797FD54448711B8C3BE0428F0D93506B55D574E98B015D3431E4B06D1F9D'
    //rsaSeq = 903365446
    

    console.log(passwordHex, 'passwordHex nothexxxxx')
    
    console.log('------------------')

    const aesEnc = getAes();


    const md5 = crypto.createHash('MD5');
    const passwordHash = md5.update(password).digest('hex');
    console.log('password hash=', passwordHash)
    // for "sign" parameter
    
    const encr = getRSAEncryptor(res2.data.data.key);
    console.log('create encr for ', res2.data.data.key, res2.data.data.key[0].length)
    
    
    const login_payload = {
            "params": { "password": passwordHex },
        "operation": "login",
    }

    const sdata = aesEnc.encrypt(JSON.stringify(login_payload));
    const encryptStr = `k=${aesEnc.key}&i=${aesEnc.iv}&h=${passwordHash}&s=${rsaSeq + sdata.length}`;

    console.log('encryptStr is', encryptStr, encryptStr.length)
    const sign = encr(encryptStr);
    const authres = await util.doHttpRequest({
        method: 'POST',
        url: loginUrl('login'),
        data: {
            data: sdata,
            sign,
        },
        headers,
    });    

    console.log('authRes', authres.statusMessage, authres.data.toString(), 'data len', sdata.length, 'sign len', sign.length, login_payload);
    console.log(sign)


}

function bufToLong(buf) {
    let hexString = buf.toString('hex');
    return BigInt('0x' + hexString).toString();
}


function totoaltest() {
    const crypto = require('crypto');

    function encrypt(text, key, iv) {
        // Create a cipher instance
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));

        // Encrypt the text
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return encrypted;
    }

    // Example usage
    const key = '0123456789abcdef0123456789abcdef'; // 32 bytes key for AES-256
    const iv = 'abcdef9876543210abcdef9876543210'; // 16 bytes IV for AES-CBC
    const text = 'Hello, World!';
    const AES_KEY_BYTES = 16;
    const MIN_AES_KEY = 10 ** (AES_KEY_BYTES - 1);
    const MAX_AES_KEY = (10 ** AES_KEY_BYTES) - 1;
    const randomAK = () => Math.floor(Math.random() * (MAX_AES_KEY - MIN_AES_KEY)) + MIN_AES_KEY;
    //# TPLink requires key and IV to be a 16 digit number(no leading 0s)
    //const key = crypto.randomBytes(32); // 256-bit key
    //const iv = crypto.randomBytes(16);
    const rkey = randomAK();
    console.log(key, 'rkey', rkey)
    console.log(Buffer.from(rkey.toString()).toString('hex'))

    const encryptedText = encrypt(text, key, iv);
    console.log('Encrypted Text:', encryptedText);
    return 1;
}

getToken('192.168.0.1', 'test')
console.log('pwd=', process.argv[2])