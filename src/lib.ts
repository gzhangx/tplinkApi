import { util } from '@gzhangx/googleapi';
import crypto from 'crypto';
import http from 'http';

//https://github.com/marcomow/home-assistant-tp-link-router-addon/blob/7af13b3351047bfc2e29729488bc449f3eaef3c7/src/index.ts

function getAes() {
    const AES_KEY_BYTES = 16;
    const MIN_AES_KEY = 10 ** (AES_KEY_BYTES - 1);
    const MAX_AES_KEY = (10 ** AES_KEY_BYTES) - 1;
    const randomAK = () => Math.floor(Math.random() * (MAX_AES_KEY - MIN_AES_KEY)) + MIN_AES_KEY;
    //# TPLink requires key and IV to be a 16 digit number(no leading 0s)    
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

function padPKCS7(dataStr: string, blockSize = 128 / 8) {
    const data = Buffer.from(dataStr);
    const padding = blockSize - (data.length % blockSize);
    const paddingBuffer = Buffer.alloc(padding, padding);
    return Buffer.concat([data, paddingBuffer]);
}

function getRSAEncryptor(modulusExpAry: string[]) {
    const modu = Buffer.from(modulusExpAry[0], 'hex');
    const modulusBuffer = modu.toString('base64');
    const exponentBuffer = Buffer.from(modulusExpAry[1], 'hex').toString('base64');



    // Create the public key object
    const keyObject: crypto.JsonWebKeyInput = {
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

const headers = Object.freeze({
    'content-Type': 'application/x-www-form-urlencoded'
}) as http.OutgoingHttpHeaders;

//https://gist.github.com/rosmo/29200c1aedb991ce55942c4ae8b54edd
async function getToken(host, password) {
    
    let data = {
        operation: 'read',
    };
    const loginUrl = form => `http://${host}/cgi-bin/luci/;stok=/login?form=${form}`
    const pwdKeyRes = await util.doHttpRequest({
        method: 'POST',
        url: loginUrl('keys'),
        data,
        headers: {...headers}
    });
    const passwordRsaKey: {
        data: {
            password: string[];
            mode: 'router';
            username: '';
        }
    } = pwdKeyRes.data as any;
    const password_rsa_public_key = passwordRsaKey.data.password;
    console.log('pwdKeyRes.data', pwdKeyRes.data)
    if (!password_rsa_public_key) throw new Error('Cant fetch RSA keys for password ' + JSON.stringify(pwdKeyRes.data));


    const res2 = await util.doHttpRequest({
        method: 'POST',
        url: loginUrl('auth'),
        data,
        headers: { ...headers }
    });
    const encryptRsa = res2.data as unknown as {
        data: {
            seq: number;
            key: string[];
        }
    }
    console.log('------------------------ auth rsa n ', res2.data)
    const rsaSeq: number = encryptRsa.data.seq;
    const passwordHex = getRSAEncryptor(password_rsa_public_key)(password);
    
    const aesEnc = getAes();


    const md5 = crypto.createHash('MD5');
    const passwordHash = md5.update(password).digest('hex');
    // for "sign" parameter
    
    const encr = getRSAEncryptor(encryptRsa.data.key);
    //console.log('create encr for ', encryptRsa.data.key, encryptRsa.data.key[0].length)
    

    function createDataReq(data: string) {
        const sdata = aesEnc.encrypt(data);
        const encryptStr = `k=${aesEnc.key}&i=${aesEnc.iv}&h=${passwordHash}&s=${rsaSeq + sdata.length}`;
        const sign = encr(encryptStr);
        return Buffer.from(`sign=${sign}&data=${encodeURIComponent(sdata)}`);
    }


    const doDataRequestCaches = {
        cookie: '',
    }
    async function doDataRequest(url: string, reqStr:string, showDebug=false) {
        console.log('doDataRequest', url, reqStr)
        const header = {
            ...headers,
        };
        if (doDataRequestCaches.cookie) {
            header.Cookie = doDataRequestCaches.cookie;
        }
        const res = (await util.doHttpRequest({
            method: 'POST',
            url,
            data: createDataReq(reqStr),
            headers: { ...headers },
        })) as unknown as  {
            statusMessage: string;
            headers: http.IncomingHttpHeaders;
            data: {
                data: any;
            }
        };
        console.log('doDataRequest', url, reqStr, res.statusMessage)
        if (showDebug) {
            console.log('header', header, 'res', res);
        }
        const setCookie = res.headers['set-cookie'];
        if (setCookie) {
            doDataRequestCaches.cookie = setCookie[0].split(';')[0];
            console.log('set cookie', doDataRequestCaches.cookie);
        }
        if (!res.data.data) return res;
        const decrypted = aesEnc.decrypt(res.data.data);
        if (Buffer.isBuffer(decrypted)) return '';
        return JSON.parse(decrypted);
    }

    const authres = await doDataRequest(loginUrl('login'), `password=${passwordHex}&operation=login`);


    console.log('authRes', authres);

    if (authres === '') {
        console.log('BAD')
        return;
    }

    const stok = authres.data.stok;
    console.log('stok', stok)
    await getWanReq(stok, doDataRequest);
}

type DoDataRequestType = (url: string, reqStr: string, showDebug: boolean) => Promise<any>;
async function getAdminStatus(stok: string, doDataRequest: DoDataRequestType, form: string) {
    const url = `http://192.168.0.1/cgi-bin/luci/;stok=${stok}/admin/status?form=${form}`;
    const res = await doDataRequest(url, 'operation=read', false);
    if (res.statusMessage) console.log(res.statusMessage);
    else {
        console.log('getwan res', res);
    }
}
async function getWanReq(stok: string, doDataRequest: DoDataRequestType) {
    await getAdminStatus(stok, doDataRequest, 'wan_speed');
    await getAdminStatus(stok, doDataRequest, 'internet');
    await getAdminStatus(stok, doDataRequest, 'all');
}



getToken('192.168.0.1', process.argv[2])
console.log('pwd=', process.argv[2])