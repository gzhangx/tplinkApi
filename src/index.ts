import { gsAccount } from "@gzhangx/googleapi";
import { initGetToken, getRouterSpeed, getDeviceSpeeds } from "./lib/tplink";

export async function doAll() {
    const { opt, sec } = await initGetToken();
    const client = gsAccount.getClient(sec.config.gsheet);
    const ops = client.getSheetOps(sec.config.modemCheckSheetId);
    while (true) {
        const rs = await getRouterSpeed(opt);
        if (!rs) {
            console.log('no rs');
            break;
        }
        const dss = await getDeviceSpeeds(opt);
        if (!dss) {
            console.log('no dss');
            break;
        }
        const now = new Date();
        const dateAry = [now, now.getFullYear(), now.getMonth() + 1, now.getDate(),
        now.getHours(), now.getMinutes()];
        const vals: any[] = [rs.down_speed, rs.up_speed, rs.test_time,
            ...dateAry,
        ];
        if (rs.down_speed || rs.up_speed) {
            await sec.db.doQuery(`insert into trafficLog(down_speed, up_speed, test_time, 
            date, year, month, day, hour, min)
            values(?,?,?,
            ?,?,?,?,?,?)`, vals);
            console.log(`${rs.test_time} d=${rs.down_speed} u=${rs.up_speed}`);
        }
        
        for (const ds of dss) {
            if (ds.downloadSpeed || ds.uploadSpeed) {
                console.log(`${ds.deviceName} d=${ds.downloadSpeed} u=${ds.uploadSpeed}`);
                await sec.db.doQuery(`insert into deviceTrafficLog(deviceName, down_speed, up_speed, test_time, 
                date, year, month, day, hour, min)
            values(?,?,?,?,
            ?,?,?,?,?,?)`, [ds.deviceName, ds.downloadSpeed, ds.uploadSpeed, ds.onlineTime,
                ...dateAry])
            }
        }
    
    }
    
    sec.db.end();
        //await ops.append('ModemData', [vals])
    
}