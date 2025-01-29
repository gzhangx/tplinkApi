import { ReqAndRsp } from "./server";
import { sqlController  } from './controllers/sql'

const routers = {
    "/sql": sqlController
}


export async function router(rr: ReqAndRsp): Promise<boolean> {
    const handler = routers[rr.req.url];    
    if (!handler) return false;
    await handler(rr);
    return true;
}