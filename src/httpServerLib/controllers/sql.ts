import { SetupData } from "../../lib/utils/secs";
import { ReqAndRsp } from "../server";

type GenerateSqlParam = {
    table: 'trafficLog';
    groupAt: string;
    where: string[][];
}

function generateSql(prm: GenerateSqlParam) {
    const allGroupBys = ['year', 'month', 'day', 'hour', 'min'];    
    const groups: string[] = [];
    for (const name of allGroupBys) {
        groups.push(name);
        if (name === prm.groupAt) {
            break;
        }
    }
    const groupByStr = groups.join(',')
    let whereArray: string[] = [];
    let argsArray: string[] = [];
    if (prm.where) {
        const okParams = allGroupBys.reduce((acc, name) => {
            acc[name] = true;
            return acc;
        }, {});
        prm.where.forEach(w => {
            const name = w[0];
            if (okParams[name]) {
                if (w.length === 2) {
                    whereArray.push(`${name} >= ?`);
                    argsArray.push(w[1])
                } else if (w.length === 3) {
                    whereArray.push(`(${name} >= ? and ${name} < ?)`);
                    argsArray.push(w[1])
                    argsArray.push(w[2])
                }
            }
        })
    }
    const sql = `select ${groupByStr}, sum(down_speed)/1000000 down, sum(up_speed)/1000000 up 
            from ${prm.table}
            ${whereArray.length? `Where ${whereArray.join(' and ' )}`:''}
            group by ${groupByStr};`
    return {
        sql,
        argsArray,
    };
}
export async function sqlController(rr: ReqAndRsp) {
    console.log(rr.req.url, rr.data);
    rr.res.writeHead(200, { 'Content-Type': 'application/json' });
    const setup: SetupData = rr.serverOptions.setup;
    const table: string = rr.data.table;
    //const groupAt: string = rr.data.groupAt;
    //const allGroupBys = ['year', 'month', 'day', 'hour', 'min']
    switch (table) {
        case 'trafficLog':
            const sqlAndArg = generateSql(rr.data);
            console.log(sqlAndArg);
            const res = await setup.db.doQuery(sqlAndArg.sql, sqlAndArg.argsArray);
            rr.res.write(JSON.stringify(res));
            break;
        default:
            rr.res.write(JSON.stringify({
                error: 'Bad table ' + table,
            }));
    }
    
}