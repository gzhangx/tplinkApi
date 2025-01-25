
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
    'content-Type': 'application/x-www-form-urlencoded',
    Cookie: 'sysauth=013bc65efd3bc20c646a9bc85e29cc60',
};

util.doHttpRequest({
    url:'http://tplinkwifi.net/cgi-bin/luci/;stok=90f717f1c559b880adf37ff07d013eb1/admin/status?form=wan_speed',
    method: 'POST',
    headers,
    data: {        
        'sign': '0bb58478c217d48be4bd402124dfabad6c33365c46fd0af56fdf8f1420b54e937851ba094cbe5f01e3c2720b4d2d5926e601b9a7a91f00dbd335abd0b7bb8404',
        'data': 'RmkSnD9Agx9pPynkg7EVLw==',
    }
}).then(r => {
    console.log('r.data',r.data)
})