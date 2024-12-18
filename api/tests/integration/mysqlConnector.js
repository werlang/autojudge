import mysql from 'mysql2/promise';
import CustomError from '../../helpers/error.js';

export default class MysqlConnector {
    static connection = null;

    static async connect(config) {
        if (process.env.NODE_ENV !== 'test') {
            throw new CustomError(500, 'Database connection is only allowed in test environment.');
        }
        if (MysqlConnector.connection) return MysqlConnector.connection;

        config = config || {
            host: 'mysql',
            user: 'root',
            password: process.env.MYSQL_ROOT_PASSWORD,
            database: process.env.MYSQL_DATABASE + '_test',
        };
        MysqlConnector.connection = await mysql.createConnection(config);
        return MysqlConnector.connection;
    }

    static async close() {
        if (!MysqlConnector.connection) return;
        await MysqlConnector.connection.end();
        MysqlConnector.connection = null;
    }

    static async cleanup() {
        if (!MysqlConnector.connection) {
            throw new CustomError(500, 'Database not connected.');
        }
        const tables = await MysqlConnector.connection.query("SHOW TABLES");
        await MysqlConnector.connection.query("SET FOREIGN_KEY_CHECKS = 0");
        for (const table of tables[0]) {
            const tableName = Object.values(table)[0];
            await MysqlConnector.connection.query(`TRUNCATE TABLE \`${tableName}\``);
        }
        await MysqlConnector.connection.query("SET FOREIGN_KEY_CHECKS = 1");
    }

    static async bootstrap(sqlFilePath) {
        if (!MysqlConnector.connection) {
            throw new CustomError(500, 'Database not connected.');
        }
        const sql = await fs.promises.readFile(sqlFilePath, 'utf8');
        await MysqlConnector.connection.query(sql);
    }
}
