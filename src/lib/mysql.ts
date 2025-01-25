import * as  mysql from 'mysql';

export function createConn(config?: mysql.PoolConfig) {
    //connectionLimit: 3,
    //host: 'localhost',
    //user: 'lluser',
    //host: process.env.DBHOST || 'localhost',
    //user,
    //password,
    //database,
    //charset: "utf8mb4_unicode_ci",
    const conn = mysql.createPool(config);

    function doQuery(sql: string, param:any[] = []): Promise<any[]> {
        return new Promise((resolve,reject) => {
                conn.query(sql, param, (err,result) => {
                    if(err) return reject(err);
                    resolve(result);
                });
        });
    }

    async function doQueryOneRow(sql: string, parm: any[]) {
        const rows = await doQuery(sql, parm);
        return rows[0];
    }

    return {
        end: ()=>conn.end(),
        conn,
        doQuery,
        doQueryOneRow,
    }
}
