
const crypto = require('crypto');
const {util} = require('@gzhangx/googleapi')

function padPKCS7(dataStr, blockSize = 128 / 8) {
    const data = Buffer.from(dataStr);
    const padding = blockSize - (data.length % blockSize);
    const paddingBuffer = Buffer.alloc(padding, padding);
    return Buffer.concat([data, paddingBuffer]);
}
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

    
    const keyBuf = Buffer.from(key.toString());
    const ivBuf = Buffer.from(iv.toString());
    return {
        key,
        iv,
        encrypt: text => {
            console.log('key', key, 'iv', iv, 'keybuf', keyBuf.toString('hex'), ivBuf.toString('HEX'));
            const cipher = crypto.createCipheriv('aes-128-cbc', keyBuf, ivBuf);
            const paded = text;  //padPKCS7(text);
            console.log('before pad', Buffer.from(text).toString('hex'),'after pad',paded.toString('hex'))
            let encrypted = cipher.update(paded, undefined, 'hex');
            console.log('before final', encrypted.toString('hex'));
            encrypted += cipher.final('hex');
            console.log('after  final', encrypted.toString('hex'));
            return Buffer.from(encrypted, 'hex').toString('base64');
        },
        decrypt: text => {
            const decipher = crypto.createDecipheriv('aes-128-cbc', keyBuf, ivBuf);
            let decryted = decipher.update(text, 'base64', 'hex');
            decryted += decipher.final('hex');
            return decryted;
        }
    }
}

const aesEnc = getAes();
console.log('emc(test)=', aesEnc.encrypt('test'));

console.log('dec(emc(test))=', aesEnc.decrypt(aesEnc.encrypt('test')));

console.log('dec(emc(53b612fefdf4aa643ee683de87a2582e))=', aesEnc.decrypt(Buffer.from('53b612fefdf4aa643ee683de87a2582e','hex')));
const headers = {
    'content-Type': 'application/x-www-form-urlencoded'
};

util.doHttpRequest({
    url:'http://192.168.0.1/cgi-bin/luci/;stok=/login?form=login',
    method: 'POST',
    headers,
    data: {
        'sign': '8b9c93e31d8c6243a1f03eb0e8f09f6f55bc73190bffa62a4b93fcdf35514b53085de52d83ef50193e8a4aaf77bb5c232e629a74946460f2de8bf42abcc32b84528e052679b43450c6b5e7b29f034f5acbae4677b4ab8f1b861b09b2228caffdac71f29a353527a581d9db47d76052924ff76da040aff2c3f1786eed2f1f146c',
        'data': 'F+II1cekqDa28GWHuWgJKTgRMnAlYD5j+O61tWPvCsJ5L6GKczi9Q/7NJOxQP6ea1VY+llTAY1+9iX9VeW8jmV0SEEIa3WmDZstlxv9BqyMv3+lU/VxNG2SxehMTPsurNTYiReHY5CsWr+XgB9G8Dk0UTNnVi7LZGYMDZOqcxL0K7bTBHSs9kDQLXov4Y4erw45dMoyjjNrsU21i/U54rssQ5ZK1KQ0eA9JPXhZEjJ438cB3DtSqPLte3aZNfCeuf1s/aLVIyeXKj3ssBFnw98cSKPQm7WHxBMYslBtbboW+diBJryhDBNiOzCK8QUHkj8/YFUzK/Ozt++baEaJ79PgiIpr/2vGBts+StO8tRWd+/1lzvCvXFvrKFr+3gmFYPAHwaQWxEV7S7jQdgxllHQ=='
    }
}).then(r => {
    console.log('r.data',r.data)
})