import mysql from 'mysql2/promise';
import CustomError from './error.js';
import mysqldump from 'mysqldump';

export default class Mysql {
        
    static connected = false;
    static connection = null;
    static config = {
        host: 'mysql',
        user: 'root',
        password: process.env.MYSQL_ROOT_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        port: process.env.MYSQL_PORT,
    }

    // this is the connection pool
    static async connect() {
        if (Mysql.connected) return this;
        Mysql.connection = mysql.createPool(Mysql.config);
        Mysql.connected = true;
        return this;
    }

    static async close() {
        if (!Mysql.connected) return this;
        Mysql.connection.end();
        Mysql.connected = false;
    }

    // this is a wrapper for mysql2's query function
    // should not be used directly
    static async query(sql, data) {
        // console.log(sql, data);
        await Mysql.connect();

        const raw = Mysql.formatRaw(sql, data);
        // console.log(raw);
        // console.log(Mysql.format(sql, data));
        try {
            const result = await Mysql.connection.execute(raw.sql.trim(), raw.data);
            if (result) return result[0];
            return result;
        }
        catch (error) {
            throw new CustomError(500, error.message, error);
        }
    }

    // db.insert('users', { name: 'John', age: 25 });
    // db.insert('users', [{ name: 'John', age: 25 }, { name: 'Jane', age: 22 }]);
    static async insert(table, data) {
        if (!data) {
            throw new CustomError(400, 'Invalid data for insert operation.');
        }
        if (!Array.isArray(data)) data = [ data ];

        return Promise.all(data.map(row => {
            const values = Object.values(row);
            const fields = Object.keys(row).map(k => `\`${k}\``);
            let sql = `INSERT INTO \`${table}\` (${fields.join(',')}) VALUES (${values.map(() => '?').join(',')})`;
            return Mysql.query(sql, values);
        }));
    }

    // db.update('users', { name: 'John', age: 11 }, id);
    static async update(table, data, id) {
        if (!id) {
            throw new CustomError(400, 'No identifier provided for update.');
        }
        if (!Object.keys(data).length) {
            throw new CustomError(400, 'No data to update.');
        }

        // remove undefined values
        data = Object.fromEntries(Object.entries(data).filter(([k,v]) => v !== undefined));

        const values = Object.values(data);
        const fielsdSql = Object.entries(data).map(([k,v],i) => {
            if (v !== null && typeof v === 'object') {
                if (Object.keys(v)[0] === 'inc'){
                    values[i] = v.inc;
                    return `\`${k}\` = ${k} + ?`;
                }
                else if (Object.keys(v)[0] === 'dec'){
                    values[i] = v.dec;
                    return `\`${k}\` = ${k} - ?`;
                }
                else {
                    throw new CustomError(400, 'Invalid update operation.');
                }
            }

            return `\`${k}\` = ?`;
        }).join(', ');

        if (typeof id === 'object') {
            values.push(...Object.values(id));
            id = Object.keys(id).map(k => `\`${k}\` = ?`).join(' AND ');
        }
        else {
            values.push(id);
            id = '\`id\` = ?';
        }

        const sql = `UPDATE \`${table}\` SET ${fielsdSql} WHERE ${id}`;
        // console.log(Mysql.format(sql, data));
        // replicateDB.saveUpdate(table, sql, data, this);
        return Mysql.query(sql, values);
    }

    static async delete(table, clause, opt={}) {
        if (!clause) {
            throw new CustomError(400, 'Invalid clause for delete operation.');
        }

        const limit = opt.limit ? `LIMIT ${ opt.limit }` : '';

        let sql = '';
        const data = [];

        // check if clause is an object
        if (typeof clause === 'object'){
            const { statement, values } = Mysql.getWhereStatements(clause);
            sql = `DELETE FROM \`${table}\` WHERE ${statement} ${limit}`;
            data.push(...values);
        }
        else {
            sql = `DELETE FROM \`${table}\` WHERE id = ?`;
            data.push(clause);
        }
        
        return Mysql.query(sql, data);
    }

    static getWhereStatements(filter) {
        let values = [];

        const statement = Object.entries(filter).map(([k,v],i) => {
            // email: null
            if (v === null) return `\`${k}\` IS NULL`;

            if (Array.isArray(v)){
                // age: [18, 19, 20]
                if (v.length === 0) return '1=0';
                
                // add all values to the values array
                values.push(...v);
                return `\`${k}\` IN (${v.map(() => '?').join(',')})`;
            }
            else if (typeof v === 'object'){
                // age: { in: [18, 19, 20] }
                if (Object.keys(v)[0] === 'in'){
                    if (!Array.isArray(v.in) || v.in.length === 0) return '1=0';
                    
                    // add all values to the values array
                    values.push(...v.in);
                    return `\`${k}\` IN (${v.in.map(() => '?').join(',')})`;
                }

                // age: { between: [18, 20] }
                if (Object.keys(v)[0] === 'between'){
                    // add 2 values to the values array
                    values.push(v.between[0], v.between[1]);
                    return `\`${k}\` BETWEEN ? AND ?`;
                }

                // name: { like: '%John%' }
                if (Object.keys(v)[0] === 'like'){
                    // replace the value with the like value
                    values.push(`%${v.like}%`);
                    return `\`${k}\` LIKE ?`;
                }

                // name: { not: 'John' }
                if (Object.keys(v)[0] === 'not'){
                    // name: { not: null }
                    if (v.not === null) return `\`${k}\` IS NOT NULL`;
                    values.push(v.not);
                    return `\`${k}\` != ?`;
                }

                // age: { '>=': 18 }
                const e = Object.keys(v)[0];
                values.push(Object.values(v)[0]);
                return `\`${k}\` ${e} ?`;
            }

            // name: 'John'
            values.push(v);
            return `\`${k}\` = ?`;
        }).join(' AND ');

        return { statement, values };
    }

    // db.find('users', { filter: { name: 'John' }, view: ['name', 'age'], opt: { limit: 1, sort: { age: -1 }, skip: 1 } });
    static async find(table, { filter={}, view=[], opt={}} = {}) {
        view = Array.isArray(view) ? view : [ view ];
        view = view.length > 0 ? view.map(v => `\`${v}\``).join(',') : '*';

        // filter not an object
        if (typeof filter !== 'object') {
            throw new CustomError(400, 'Invalid filter for find operation.');
        }

        const filterNames = Object.keys(filter);
        let values = Object.values(filter);
        // WHERE name = ? AND age >= ?
        const {
            statement: whereStatements,
            values: whereValues,
        } = Mysql.getWhereStatements(filter);
        values = whereValues;

        const where = filterNames.length > 0 ? `WHERE ${ whereStatements }` : '';

        // ORDER BY id DESC
        const order = opt.order ? `ORDER BY ${ Object.keys(opt.order)[0] } ${ Object.values(opt.order)[0] === 1 ? 'ASC' : 'DESC' }` : '';
        
        // LIMIT 10
        const limit = opt.limit ? `LIMIT ${ opt.limit }` : '';
        
        // OFFSET 10
        const offset = opt.skip ? `OFFSET ${ opt.skip }` : '';

        const sql = `SELECT ${view} FROM \`${table}\` ${where} ${order} ${limit} ${offset}`;
        // console.log(sql, values);
        return Mysql.query(sql, values);
    }

    // db.delete('users', id);
    static raw(str) {
        return { toSqlString: () => str };
    }

    static formatRaw(sql, data) {
        const pieces = sql.split('?');

        if (pieces.length > 1){
            let join = pieces.shift();
            
            try {
                data.forEach(d => {
                    if (d && d.toSqlString){
                        join += d.toSqlString();
                    }
                    else{
                        join += '?';
                    }
                    join += pieces.shift();
                });
            }
            catch(error) {
                // console.log(data)
            }
    
            sql = join;
            data = data.filter(e => !e || !e.toSqlString);
        }
        
        return { sql, data };
    }

    static format(sql, data) {
        if (!Mysql.connection) {
            throw new CustomError(500, 'Database not connected.');
        }
        return Mysql.connection.format(sql, data);
    }

    static toDateTime(timestamp) {
        return new Date(timestamp).toISOString().replace('T', ' ').replace('Z', '');
    }

    static like(str) {
        return { like: str };
    }

    static between(a, b) {
        return { between: [ a, b ] };
    }

    static lt(value) {
        return { '<': value };
    }

    static gt(value) {
        return { '>': value };
    }

    static lte(value) {
        return { '<=': value };
    }

    static gte(value) {
        return { '>=': value };
    }

    static async dump(path, options={}) {
        return mysqldump({
            connection: Mysql.config,
            dumpToFile: path,
            ...options,
        });
    }
}
