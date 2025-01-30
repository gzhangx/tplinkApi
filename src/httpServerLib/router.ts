import { ReqAndRsp } from "./server";
import { sqlController  } from './controllers/sql'

import { readFile } from 'fs';
import path from 'path'
const routers = {
    "/sql": sqlController
}


export async function router(rr: ReqAndRsp): Promise<boolean> {
    const url = rr.req.url;
    if (url !== '/sql') {
        var filePath = './public' + url
        if (filePath == './public/')
            filePath = './public/index.html';

        filePath = filePath.replace(/\.\.\//g, '');
        var extname = path.extname(filePath);
        var contentType = 'text/html';
        switch (extname) {
            case '.js':
                contentType = 'text/javascript';
                break;
            case '.css':
                contentType = 'text/css';
                break;
            case '.json':
                contentType = 'application/json';
                break;
            case '.png':
                contentType = 'image/png';
                break;
            case '.jpg':
                contentType = 'image/jpg';
                break;
            case '.wav':
                contentType = 'audio/wav';
                break;
        }

        return new Promise(resolve => {
            readFile(filePath, function (error, content) {
                if (error) {
                    resolve(false);
                }
                else {
                    rr.res.writeHead(200, { 'Content-Type': contentType });
                    rr.res.write(content)
                    resolve(true);
                }
            });
        })
    }
    const handler = routers[rr.req.url];
    if (!handler) return false;
    await handler(rr);
    return true;
}