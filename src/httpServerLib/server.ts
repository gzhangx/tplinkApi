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

function setCrosHeader(req: http.IncomingMessage, rsp: HttpResponseType) {    
    const res: { [name: string]: any; }= {};
    res['Access-Control-Allow-Origin'] = req.headers.origin || "*";
    rsp.setHeader('Access-Control-Allow-Origin', '*');
    const acrm = req.headers["Access-Control-Request-Method"];
    rsp.setHeader('Access-Control-Allow-Methods',acrm as string || 'GET,POST,OPTIONS');
    
    //const acrh = req.headers["Access-Control-Request-Headers"];    
    rsp.setHeader("Access-Control-Allow-Headers",  '*');    
    return res;
}
export async function createServer(serverOptions: ServerOptions): Promise<ServerOptions> {
    return new Promise((resolve) => {
        function handler(req: http.IncomingMessage, res: HttpResponseType) {
            let payload = "";

            req.on('data', (chunk) => {
                payload += chunk;
            });

            req.on('end', async () => {
                setCrosHeader(req, res)
                if (req.method === 'OPTIONS') {
                    res.writeHead(200,'OK');
                    res.end();
                    return;
                }    
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