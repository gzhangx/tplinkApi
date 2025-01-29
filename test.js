const lib = require('./out/backGroundProcess')
//const { getAdminStatus, getAdminFunction, sleep } = require('./out/backGroundProcess')

lib.doAll();
//lib.doAll();

// lib.initGetToken().then(async ({ opt, sec }) => {
//     const all = await getAdminStatus(opt, 'all');
//     //console.log(all);    
//     //const black_devices = await getAdminFunction(opt, 'access_control', 'black_devices');
//     //const black_devices = await getAdminFunction(opt, 'onemesh_network', 'mesh_sclient_list_all', 'loadDevice');
        

//     pt = 0;
//     pr = 0;
//     while (true) {
//         //const internet = await getAdminFunction(opt, 'status', 'internet');
//         //console.log(internet)
//         //const res = await getAdminFunction(opt, 'status', 'wan_speed');
//         //console.log(res)
//         //await getAdminFunction(opt, 'access_control', 'black_devices', 'load');
//         //await getAdminFunction(opt, 'onemesh_network', 'mesh_sclient_list_all', 'read');    
//         const black_devices = await getAdminFunction(opt, 'smart_network', 'game_accelerator', 'loadSpeed');    
//         //await sleep(1000);
//         //const black_devices = await getAdminFunction(opt, 'onemesh_network', 'mesh_sclient_list_all', 'read');
//         //console.log('black_devices', black_devices)
//         //continue;
//         black_devices.forEach(dev => {            
            
//             try {
//                 if (dev.deviceName.indexOf('gg') >= 0 || dev.deviceName.indexOf('Sam') >= 0) {
//                     console.log(`${dev.deviceName.padEnd(30)} uploadSpeed=${dev.uploadSpeed}/${dev.downloadSpeed} ${dev.onlineTime.toFixed(0).padStart(10)} ${(dev.txrate || 0).toString().padStart(10)} ${(dev.rxrate || 0).toString().padStart(10)}`)
                    
//                     //console.log(dev)
//                 }
//             } catch (err) {
//                 //console.log(dev)
//             }
            
//         })
        
//         //const black_devices = await getAdminFunction(opt, 'access_control', 'black_devices', 'load');   
//         //console.log(black_devices)
//         await sleep(1000);
//     }
//     sec.db.end()
// })