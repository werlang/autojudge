import mysql from 'mysql2/promise';
import CustomError from '../../helpers/error.js';
import fs from 'fs';

export default class MysqlConnector {
    constructor({ sqlFilePath, sqlFile } = {}) {
        this.connection = null;
        this.config = null;

        if (sqlFilePath) {
            this.sqlFile = fs.readFileSync(sqlFilePath, 'utf8');
        }
        else if (sqlFile) {
            this.sqlFile = sqlFile;
        }
    }

    static async destroyAll() {
        return mysql.createConnection({
            host: 'mysql',
            user: 'root',
            password: process.env.MYSQL_ROOT_PASSWORD,
            charset: 'utf8mb4',
        }).then(async (connection) => {
            // drop all databases
            const dbList = await connection.query("SHOW DATABASES");
            // filter only test databases
            const testDbs = dbList[0].filter(db => db.Database.match(/_test_/));
            // drop all test databases
            for (const db of testDbs) {
                await connection.query("DROP DATABASE IF EXISTS " + db.Database);
            }
        });
    }

    async connect(config) {
        if (process.env.NODE_ENV !== 'test') {
            throw new CustomError(500, 'Database connection is only allowed in test environment.');
        }
        if (this.connection) return this.connection;

        const dbId = Math.random().toString(36).slice(2);
        process.env.NODE_ENV = 'test';
        process.env.TEST_DATABASE_ID = dbId;

        this.config = config || {
            host: 'mysql',
            user: 'root',
            password: process.env.MYSQL_ROOT_PASSWORD,
            database: process.env.MYSQL_DATABASE + '_test_' + dbId,
            charset: 'utf8mb4',
        };

        const createDbQuery = `CREATE DATABASE IF NOT EXISTS \`${this.config.database}\``;

        try {
            await mysql.createConnection({
                ...this.config,
                database: null,
            }).then(async (connection) => {
                await connection.query(createDbQuery);
                await connection.end();
            });
    
            this.connection = await mysql.createConnection(this.config);
        }
        catch (err) {
            // console.log(this.config);
            throw new CustomError(500, err.message);
        }
        return this;
    }

    async close() {
        if (!this.connection) return;
        await this.connection.end();
        this.connection = null;
    }

    async cleanup() {
        if (!this.connection) {
            throw new CustomError(500, 'Database not connected.');
        }
        const tables = await this.connection.query("SHOW TABLES");
        await this.connection.query("SET FOREIGN_KEY_CHECKS = 0");
        for (const table of tables[0]) {
            const tableName = Object.values(table)[0];
            await this.connection.query(`TRUNCATE TABLE \`${tableName}\``);
        }
        await this.connection.query("SET FOREIGN_KEY_CHECKS = 1");
    }

    async destroy() {
        if (!this.connection) {
            throw new CustomError(500, 'Database not connected.');
        }

        await this.connection.query("DROP DATABASE IF EXISTS " + this.config.database);
        await this.close();
    }

    async import() {
        if (!this.connection) {
            throw new CustomError(500, 'Database not connected.');
        }
        if (!this.sqlFile) {
            throw new CustomError(500, 'SQL file not provided.');
        }
        const statements = this.sqlFile.split(';').map(stmt => stmt.trim()).filter(stmt => stmt.length);

        await this.connection.query("SET FOREIGN_KEY_CHECKS = 0");
        for (const stmt of statements) {
            await this.connection.query(stmt);
        }
        await this.connection.query("SET FOREIGN_KEY_CHECKS = 1");

        return this;
    }

    async bootstrap() {
        await this.connect();
        await this.import();
        return this;
    }
}
