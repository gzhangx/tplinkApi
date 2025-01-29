import { IServiceAccountCreds } from '@gzhangx/googleapi/lib/google/googleApiServiceAccount';
import * as sql from './mysql'

import * as fs from 'fs'

type Secconfig = {
    gsheet: IServiceAccountCreds;
    routerAddress: string;
    modemCheckSheetId: string;
    tplinkSecret: string;
    tplinkSecretwz: string;
    p: string;
};

export type SetupData = Awaited<ReturnType<typeof doSecSetup>>;

export async function doSecSetup() {
    const dbCfg = JSON.parse(fs.readFileSync('../../secs/tpdb.json').toString());
    const db = sql.createConn(dbCfg);
    const rows = await db.doQuery('select * from config');
    const config: Secconfig = {
    } as Secconfig;
    rows.forEach(r => {
        switch (r.name) {
            case 'gsheet':
                config.gsheet = JSON.parse(r.value);
                break;
            default:            
                config[r.name] = r.value;                        
                break;
        }        
    });

    config.p = JSON.parse(config.tplinkSecretwz).map(i => config.tplinkSecret[i]).join('');
    return {
        config,
        db,
    }
}