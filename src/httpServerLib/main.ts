import { createServer } from './server'
import { router } from './router'
import { doSecSetup } from '../lib/utils/secs';


const port = 8001;

export async function startServer() {
    const sec = await doSecSetup();
    createServer({
        port,
        router,
        setup: sec,
    }
    ).then(opts => {
        console.log(`Server started on ${opts.port}`);
    })
}