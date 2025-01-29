
import { doSecSetup } from "./secs";
import { getAdminStatus, getToken, GetTokenReturn, sleep, getAdminFunction } from "./tplinkLib";


export async function initGetToken() {
    const sec = await doSecSetup();
    const p = sec.config.p;
    const opt = await getToken(sec.config.routerAddress, p);
    return {
        sec,
        opt,
    }
}

// export async function doAll() {
//     const { opt, sec } = await initGetToken();
//     const client = gsAccount.getClient(sec.config.gsheet);
//     const ops = client.getSheetOps(sec.config.modemCheckSheetId);        
//     await getWanReq(opt, async rs => {
//         const now = new Date()
//         const vals: any[] = [now, rs.down_speed, rs.up_speed, rs.test_time,
//             now.getFullYear(), now.getMonth() + 1, now.getDate(),
//             now.getHours(), now.getMinutes()
//         ];
//         await sec.db.doQuery(`insert into trafficLog(date, down_speed, up_speed, test_time, year, month, day, hour, min) 
//             values(?,?,?,?,
//             ?,?,?,?,?)`, vals)

//         //await ops.append('ModemData', [vals])
//     });
// }

type DeviceSpeedRet = {
    deviceName: string;
    uploadSpeed: number;
    downloadSpeed: number;
    onlineTime: number;
}

export async function getDeviceSpeeds(opt: GetTokenReturn): Promise<DeviceSpeedRet[]> {
    const res = await getAdminFunction(opt, 'smart_network', 'game_accelerator', 'loadSpeed');
    return res as DeviceSpeedRet[];
}

export async function getRouterSpeed(opt: GetTokenReturn) {
    const res = (await getAdminStatus(opt, 'wan_speed')) as RouterSpeed;
    return res;
}
type RouterSpeed = {
    down_speed: number;
    up_speed: number;
    test_time: number;
}

// export async function getWanReq(opt: GetTokenReturn, log: (val: RouterSpeed) => Promise<void>) {
//     console.log('Stok', opt.stok);
//     while (true) {
//         const res = (await getAdminStatus(opt, 'wan_speed')) as RouterSpeed;
//         if (!res) {
//             console.log('break on no res')
//             break;
//         }

//         console.log(`down_speed ${res.down_speed.toString().padStart(7)} up_speed: ${res.up_speed.toString().padStart(7)} testtime: ${res.test_time}`)
//         await log(res);

//         const black_devices = await getAdminFunction(opt, 'smart_network', 'game_accelerator', 'loadSpeed'); //loadDevice or loadSpeed

//         //await getAdminFunction(opt, 'access_control', 'black_devices', 'load');
//         /// {
//             ///mac: 'DC-',
//             ///host: 'NON_HOST',
//             ///name: 'xxxx',
//             ///ipaddr: '192.168.0.xxx',
//             ///guest: 'NON_GUEST',
//             ///conn_type: 'wired',
//             ///raw_conn_type: 'wired'
//         ///}
//         /// 
//         ///

//         await getAdminFunction(opt, 'onemesh_network', 'mesh_sclient_list_all', 'read');
//         await sleep(1000);
//     }
//     //await getAdminStatus(stok, doDataRequest, 'internet');
//     //await getAdminStatus(stok, doDataRequest, 'all');
// }


type AdminStatusAllRet = {
    access_devices_wireless_host: {
        wire_type: string;  //'2.4G',
        macaddr: string;  //'B0-4A-xxx',
        ipaddr: string; // '192.168.0.xxx',
        hostname: string;  //'nameofclient'
    }[];
    access_devices_wired: {
        wire_type: 'wired';
        macaddr: string;  //'20-17--$$',
        ipaddr: string; '192.168.0.xxx',
        hostname: string; 'name of host'
    }[];
}


type AdminSmartNetworkGameAcceleratorRet = {
    totalTime: number;  //47020,
    trafficUsage: number; //0
    deviceType: 'pc';
    totalGameTime: number;  //6211
    deviceName: string; //clinet name
    key: string;  //'48E7XXX',
    uploadSpeed: number;  //0,
    onlineTime: number; // 12888.96->3 hours x min,
    isGaming: number;  //0,
    downloadSpeed: number; //0,
    enablePriority: boolean;  //false,
    remainTime: number; // 0,
    ip: string; '192.168.0.xxx',
    currentGameTime: number;  //0,
    signal: number; // -72,
    index: number; //20,
    txrate: number; //816660,
    mac: string; '48-55-##',
    rxrate: number;  //648520,
    timePeriod: number; //-1,
    deviceTag: '5G';
    latency: number;  //-1
}