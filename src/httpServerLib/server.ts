import http from 'http';
import https from 'https';

type HttpResponseType = http.ServerResponse<http.IncomingMessage> & {
    req: http.IncomingMessage;
};

export type ReqAndRsp = {
    req: http.IncomingMessage;
    res: HttpResponseType;
    data: any;
    serverOptions: ServerOptions;
}
type UrlMapper = (rr: ReqAndRsp) => Promise<boolean>;

export type ServerOptions = {
    port: number;
    router: UrlMapper;
    httpsOpts?: https.ServerOptions;
    setup: any;
}

function setCrosHeader(req: http.IncomingMessage, res: HttpResponseType) {
    res.appendHeader("Access-Control-Allow-Origin", "*");
    const acrm = req.headers["Access-Control-Request-Method"];
    if (acrm) {
        res.appendHeader("Access-Control-Allow-Methods", acrm);
    }
    const acrh = req.headers["Access-Control-Request-Headers"];
    if (acrh) {
        res.appendHeader("Access-Control-Allow-Headers", acrh);
    }
}
export async function createServer(serverOptions: ServerOptions): Promise<ServerOptions> {
    return new Promise((resolve) => {
        function handler(req: http.IncomingMessage, res: HttpResponseType) {
            let payload = "";

            req.on('data', (chunk) => {
                payload += chunk;
            });

            req.on('end', async () => {                  
                setCrosHeader(req, res);                
                const contentType = req.headers['content-type'];
                if (contentType === 'application/json') {
                    payload = JSON.parse(payload);
                }
                if (! await serverOptions.router({ req, res, data: payload, serverOptions, })) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.write(`{"error":"Not Found ${req.url} "}`);
                } 
                res.end();
            });                        
        }
        const srv = serverOptions.httpsOpts ?
            https.createServer(serverOptions.httpsOpts, handler)
            : http.createServer(handler);
        srv.listen(serverOptions.port, () => resolve(serverOptions));;        
    });
}