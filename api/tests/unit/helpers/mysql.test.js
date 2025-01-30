import mysql from 'mysql2/promise';
import Mysql from '../../../helpers/mysql.js';
import CustomError from '../../../helpers/error.js';
import mysqldump from 'mysqldump';

jest.mock('mysql2/promise');
jest.mock('mysqldump');

describe('Mysql Class', () => {
    beforeEach(() => {
        Mysql.connected = false;
        Mysql.connection = null;
    });

    describe('Connection Management', () => {
        describe('connect()', () => {
            test('should connect to the database', async () => {
                const mockPool = { execute: jest.fn() };
                mysql.createPool.mockReturnValue(mockPool);

                await Mysql.connect();

                expect(mysql.createPool).toHaveBeenCalledWith(Mysql.config);
                expect(Mysql.connection).toBe(mockPool);
                expect(Mysql.connected).toBe(true);
            });

            test('should throw an error if connection fails', async () => {
                mysql.createPool.mockImplementation(() => {
                    throw new Error('Connection failed');
                });

                await expect(Mysql.connect()).rejects.toThrow('Connection failed');
                expect(Mysql.connected).toBe(false);
            });
        });

        describe('close()', () => {
            test('should close the database connection', async () => {
                const mockPool = { end: jest.fn() };
                Mysql.connection = mockPool;
                Mysql.connected = true;

                await Mysql.close();

                expect(mockPool.end).toHaveBeenCalled();
                expect(Mysql.connected).toBe(false);
            });

            test('should not close the connection if not connected', async () => {
                await Mysql.close();
                expect(Mysql.connection).toBeNull();
            });

            test('should handle close when not connected', async () => {
                Mysql.connected = false;
                Mysql.connection = null;

                await Mysql.close();

                expect(Mysql.connection).toBeNull();
            });
        });
    });

    describe('CRUD Operations', () => {

        describe('query()', () => {
            test('should execute a query', async () => {
                const mockPool = { execute: jest.fn().mockResolvedValue([[]]) };
                Mysql.connection = mockPool;
                Mysql.connected = true;

                const sql = 'SELECT * FROM users';
                const data = [];
                await Mysql.query(sql, data);

                expect(mockPool.execute).toHaveBeenCalledWith(sql, data);
            });

            test('should throw an error if query fails', async () => {
                const mockPool = { execute: jest.fn().mockRejectedValue(new Error('Query failed')) };
                Mysql.connection = mockPool;
                Mysql.connected = true;

                const sql = 'SELECT * FROM users';
                const data = [];

                await expect(Mysql.query(sql, data)).rejects.toThrow(CustomError);
            });

            test('should throw an error if query is malformed', async () => {
                Mysql.connection = { execute: jest.fn().mockRejectedValue(new Error('Syntax error')) };
                Mysql.connected = true;

                const sql = 'INVALID SQL QUERY';
                const data = [];

                await expect(Mysql.query(sql, data)).rejects.toThrow('Syntax error');
            });
        });

        describe('insert()', () => {
            test('should insert data into the database', async () => {
                const mockPool = { execute: jest.fn().mockResolvedValue([{ insertId: 1 }]) };
                Mysql.connection = mockPool;
                Mysql.connected = true;

                const table = 'users';
                const data = { name: 'John', age: 25 };
                await Mysql.insert(table, data);

                const expectedSql = `INSERT INTO \`${table}\` (\`name\`,\`age\`) VALUES (?,?)`;
                expect(mockPool.execute).toHaveBeenCalledWith(expectedSql, ['John', 25]);
            });

            test('should insert multiple rows into the database', async () => {
                const mockPool = { execute: jest.fn().mockResolvedValue([{ insertId: 1 }]) };
                Mysql.connection = mockPool;
                Mysql.connected = true;

                const table = 'users';
                const data = [{ name: 'John', age: 25 }, { name: 'Jane', age: 22 }];
                await Mysql.insert(table, data);

                const expectedSql = `INSERT INTO \`${table}\` (\`name\`,\`age\`) VALUES (?,?)`;
                expect(mockPool.execute).toHaveBeenCalledTimes(2);
                expect(mockPool.execute).toHaveBeenCalledWith(expectedSql, ['John', 25]);
                expect(mockPool.execute).toHaveBeenCalledWith(expectedSql, ['Jane', 22]);
            });

            test('should throw an error if data is invalid', async () => {
                Mysql.connection = { execute: jest.fn() };
                Mysql.connected = true;

                const table = 'users';
                const data = null;

                await expect(Mysql.insert(table, data)).rejects.toThrow('Invalid data for insert operation.');
            });

            test('should throw an error if table name is invalid', async () => {
                Mysql.connection = { execute: jest.fn().mockRejectedValue(new Error('Table does not exist')) };
                Mysql.connected = true;

                const table = 'invalid_table';
                const data = { name: 'John' };

                await expect(Mysql.insert(table, data)).rejects.toThrow('Table does not exist');
            });
        });

        describe('update()', () => {
            test('should update data in the database', async () => {
                const mockPool = { execute: jest.fn().mockResolvedValue() };
                Mysql.connection = mockPool;
                Mysql.connected = true;

                const table = 'users';
                const data = { name: 'John', age: 26 };
                const id = 1;
                await Mysql.update(table, data, id);

                const expectedSql = `UPDATE \`${table}\` SET \`name\` = ?, \`age\` = ? WHERE \`id\` = ?`;
                expect(mockPool.execute).toHaveBeenCalledWith(expectedSql, ['John', 26, 1]);
            });

            test('should update data in the database using increment and decrement', async () => {
                const mockPool = { execute: jest.fn().mockResolvedValue() };
                Mysql.connection = mockPool;
                Mysql.connected = true;

                const table = 'users';
                const data = { age: { inc: 1 }, score: { dec: 2 } };
                const id = 1;
                await Mysql.update(table, data, id);

                const expectedSql = `UPDATE \`${table}\` SET \`age\` = age + ?, \`score\` = score - ? WHERE \`id\` = ?`;
                expect(mockPool.execute).toHaveBeenCalledWith(expectedSql, [1, 2, 1]);
            });

            test('should update data in the database using multiple filters', async () => {
                const mockPool = { execute: jest.fn().mockResolvedValue() };
                Mysql.connection = mockPool;
                Mysql.connected = true;

                const table = 'users';
                const data = { name: 'John', age: 26 };
                const id = { id: 1, role: 'admin' };
                await Mysql.update(table, data, id);

                const expectedSql = `UPDATE \`${table}\` SET \`name\` = ?, \`age\` = ? WHERE \`id\` = ? AND \`role\` = ?`;
                expect(mockPool.execute).toHaveBeenCalledWith(expectedSql, ['John', 26, 1, 'admin']);
            });

            test('should throw an error if update operation is invalid', async () => {
                const table = 'users';
                const data = { age: { foo: 'bar' } };
                const id = 1;

                await expect(Mysql.update(table, data, id)).rejects.toThrow(CustomError);
            });

            test('should throw an error if data is empty', async () => {
                const mockPool = { execute: jest.fn().mockResolvedValue() };
                Mysql.connection = mockPool;
                Mysql.connected = true;

                const table = 'users';
                const data = {};
                const id = 1;

                await expect(Mysql.update(table, data, id)).rejects.toThrow(CustomError);
            });

            test('should throw an error if no data to update', async () => {
                const table = 'users';
                const data = {};
                const id = 1;

                await expect(Mysql.update(table, data, id)).rejects.toThrow('No data to update.');
            });

            test('should throw an error if ID is missing', async () => {
                Mysql.connection = { execute: jest.fn() };
                Mysql.connected = true;

                const table = 'users';
                const data = { name: 'John' };
                const id = null;

                await expect(Mysql.update(table, data, id)).rejects.toThrow('No identifier provided for update.');
            });
        });

        describe('delete()', () => {
            test('should delete data from the database', async () => {
                const mockPool = { execute: jest.fn().mockResolvedValue() };
                Mysql.connection = mockPool;
                Mysql.connected = true;

                const table = 'users';
                const id = 1;
                await Mysql.delete(table, id);

                const expectedSql = `DELETE FROM \`${table}\` WHERE id = ?`;
                expect(mockPool.execute).toHaveBeenCalledWith(expectedSql, [1]);
            });

            test('should delete data from the database using multiple clauses', async () => {
                const mockPool = { execute: jest.fn().mockResolvedValue() };
                Mysql.connection = mockPool;
                Mysql.connected = true;

                const table = 'users';
                const clause = { id: 1, role: 'admin' };
                await Mysql.delete(table, clause);

                const expectedSql = `DELETE FROM \`${table}\` WHERE \`id\` = ? AND \`role\` = ?`;
                expect(mockPool.execute).toHaveBeenCalledWith(expectedSql, [1, 'admin']);
            });

            test('should delete data from the database with limit', async () => {
                const mockPool = { execute: jest.fn().mockResolvedValue() };
                Mysql.connection = mockPool;
                Mysql.connected = true;

                const table = 'users';
                const clause = { id: 1 };
                const opt = { limit: 1 };
                await Mysql.delete(table, clause, opt);

                const expectedSql = `DELETE FROM \`${table}\` WHERE \`id\` = ? LIMIT 1`;
                expect(mockPool.execute).toHaveBeenCalledWith(expectedSql, [1]);
            });

            test('should throw an error if clause is invalid', async () => {
                Mysql.connection = { execute: jest.fn() };
                Mysql.connected = true;

                const table = 'users';
                const clause = null;

                await expect(Mysql.delete(table, clause)).rejects.toThrow('Invalid clause for delete operation.');
            });
        });

        describe('find()', () => {
            test('should find data in the database', async () => {
                const mockPool = { execute: jest.fn().mockResolvedValue([[]]) };
                Mysql.connection = mockPool;
                Mysql.connected = true;

                const table = 'users';
                const filter = { name: 'John' };
                await Mysql.find(table, { filter });

                const expectedSql = `SELECT * FROM \`${table}\` WHERE \`name\` = ?`;
                expect(mockPool.execute).toHaveBeenCalledWith(expectedSql, ['John']);
            });

            test('should find data in the database with multiple filters', async () => {
                const mockPool = { execute: jest.fn().mockResolvedValue([[]]) };
                Mysql.connection = mockPool;
                Mysql.connected = true;

                const table = 'users';
                const filter = {
                    name: 'John',
                    age: { between: [18, 25] },
                    array: [1, 2, 3],
                    inClause: { in: [0, 1, 2] },
                    likeClause: { like: 'John' },
                    notClause: { not: null },
                    notClause2: { not: 'Mary' },
                    gteClause: { '>=': 18 },
                };
                await Mysql.find(table, { filter });

                const expectedSql = `SELECT * FROM \`${table}\` WHERE \`name\` = ? AND \`age\` BETWEEN ? AND ? AND \`array\` IN (?,?,?) AND \`inClause\` IN (?,?,?) AND \`likeClause\` LIKE ? AND \`notClause\` IS NOT NULL AND \`notClause2\` != ? AND \`gteClause\` >= ?`;
                expect(mockPool.execute).toHaveBeenCalledWith(expectedSql, ['John', 18, 25, 1, 2, 3, 0, 1, 2, '%John%', 'Mary', 18]);
            });

            test('should find data for null clause', async () => {
                const mockPool = { execute: jest.fn().mockResolvedValue([[]]) };
                Mysql.connection = mockPool;
                Mysql.connected = true;

                const table = 'users';
                const filter = { name: null };
                await Mysql.find(table, { filter });

                const expectedSql = `SELECT * FROM \`${table}\` WHERE \`name\` IS NULL`;
                expect(mockPool.execute).toHaveBeenCalledWith(expectedSql, []);
            });

            test('should find data in the database with options', async () => {
                const mockPool = { execute: jest.fn().mockResolvedValue([[]]) };
                Mysql.connection = mockPool;
                Mysql.connected = true;

                const table = 'users';
                const filter = { name: 'John' };
                const opt = { limit: 1, order: { id: -1 }, skip: 1 };
                await Mysql.find(table, { filter, opt });

                const expectedSql = `SELECT * FROM \`${table}\` WHERE \`name\` = ? ORDER BY id DESC LIMIT 1 OFFSET 1`;
                expect(mockPool.execute).toHaveBeenCalledWith(expectedSql, ['John']);
            });

            test('should find data in the database with view options', async () => {
                const mockPool = { execute: jest.fn().mockResolvedValue([[]]) };
                Mysql.connection = mockPool;
                Mysql.connected = true;

                const table = 'users';
                const filter = { name: 'John' };
                const view = 'age';
                await Mysql.find(table, { filter, view });

                const expectedSql = `SELECT \`age\` FROM \`${table}\` WHERE \`name\` = ?`;
                expect(mockPool.execute).toHaveBeenCalledWith(expectedSql, ['John']);
            });

            test('should find data in the database with order options', async () => {
                const mockPool = { execute: jest.fn().mockResolvedValue([[]]) };
                Mysql.connection = mockPool;
                Mysql.connected = true;

                const table = 'users';
                const filter = { name: 'John' };
                const opt = { order: { id: 1 } };
                await Mysql.find(table, { filter, opt });

                const expectedSql = `SELECT * FROM \`${table}\` WHERE \`name\` = ? ORDER BY id ASC`;
                expect(mockPool.execute).toHaveBeenCalledWith(expectedSql, ['John']);
            });

            test('should find data with no filter', async () => {
                const mockPool = { execute: jest.fn().mockResolvedValue([[]]) };
                Mysql.connection = mockPool;
                Mysql.connected = true;

                const table = 'users';
                await Mysql.find(table);

                const expectedSql = `SELECT * FROM \`${table}\``;
                expect(mockPool.execute).toHaveBeenCalledWith(expectedSql, []);
            });

            test('should throw an error if filter is invalid', async () => {
                Mysql.connection = { execute: jest.fn() };
                Mysql.connected = true;

                const table = 'users';
                const filter = 'invalid_filter';

                await expect(Mysql.find(table, { filter })).rejects.toThrow('Invalid filter for find operation.');
            });

            test('should handle empty results in find()', async () => {
                Mysql.connection = { execute: jest.fn().mockResolvedValue([[]]) };
                Mysql.connected = true;

                const table = 'users';
                const filter = { name: 'NonExistentUser' };
                const results = await Mysql.find(table, { filter });

                expect(results).toEqual([]);
            });
        });

    });

    describe('Utility Functions', () => {
        test('should dump the database', async () => {
            const path = '/path/to/dump.sql';
            await Mysql.dump(path);

            expect(mysqldump).toHaveBeenCalledWith({
                connection: Mysql.config,
                dumpToFile: path,
            });
        });

        test('should throw an error if dump path is invalid', async () => {
            mysqldump.mockRejectedValue(new Error('Invalid path'));

            const path = null;

            await expect(Mysql.dump(path)).rejects.toThrow('Invalid path');
        });

        test('should format raw SQL', () => {
            const sql = 'SELECT * FROM users WHERE name = ?';
            const data = ['John'];
            const formatted = Mysql.formatRaw(sql, data);

            expect(formatted.sql).toBe('SELECT * FROM users WHERE name = ?');
            expect(formatted.data).toEqual(['John']);
        });

        test('should format SQL', () => {
            const mockPool = { format: jest.fn().mockReturnValue('SELECT * FROM users WHERE name = "John"') };
            Mysql.connection = mockPool;

            const sql = 'SELECT * FROM users WHERE name = ?';
            const data = ['John'];
            const formatted = Mysql.format(sql, data);

            expect(mockPool.format).toHaveBeenCalledWith(sql, data);
            expect(formatted).toBe('SELECT * FROM users WHERE name = "John"');
        });

        test('should throw an error if format is called without connection', () => {
            Mysql.connection = null;

            const sql = 'SELECT * FROM users WHERE name = ?';
            const data = ['John'];

            expect(() => Mysql.format(sql, data)).toThrow('Database not connected.');
        });

        test('should convert timestamp to datetime', () => {
            const timestamp = Date.now();
            const datetime = Mysql.toDateTime(timestamp);

            expect(datetime).toBe(new Date(timestamp).toISOString().replace('T', ' ').replace('Z', ''));
        });

        test('should create a like filter', () => {
            const filter = Mysql.like('John');

            expect(filter).toEqual({ like: 'John' });
        });

        test('should create a between filter', () => {
            const filter = Mysql.between(18, 25);

            expect(filter).toEqual({ between: [18, 25] });
        });

        test('should create a less than filter', () => {
            const filter = Mysql.lt(18);

            expect(filter).toEqual({ '<': 18 });
        });

        test('should create a greater than filter', () => {
            const filter = Mysql.gt(18);

            expect(filter).toEqual({ '>': 18 });
        });

        test('should create a less than or equal filter', () => {
            const filter = Mysql.lte(18);

            expect(filter).toEqual({ '<=': 18 });
        });

        test('should create a greater than or equal filter', () => {
            const filter = Mysql.gte(18);

            expect(filter).toEqual({ '>=': 18 });
        });

        test('should test getting a raw SQL string', () => {
            const str = 'SELECT * FROM users WHERE name = "John"';
            const raw = Mysql.raw(str);

            expect(raw.toSqlString()).toBe(str);
        });

        test('should query using raw values', async () => {
            const mockPool = { execute: jest.fn().mockResolvedValue([[]]) };
            Mysql.connection = mockPool;
            Mysql.connected = true;

            await Mysql.find('purchase', { filter: { time: Mysql.gte(Mysql.raw('NOW()')) } });
            
            expect(mockPool.execute).toHaveBeenCalledWith('SELECT * FROM `purchase` WHERE `time` >= NOW()', []);
        });

        test('should handle empty array in getWhereStatements', () => {
            const filter = { age: [] };
            const { statement, values } = Mysql.getWhereStatements(filter);

            expect(statement).toBe('1=0');
            expect(values).toEqual([]);
        });

        test('should handle empty in clause in getWhereStatements', () => {
            const filter = { age: { in: [] } };
            const { statement, values } = Mysql.getWhereStatements(filter);

            expect(statement).toBe('1=0');
            expect(values).toEqual([]);
        });

        test('should handle empty between clause in getWhereStatements', () => {
            const filter = { age: { between: [18, 25] } };
            const { statement, values } = Mysql.getWhereStatements(filter);

            expect(statement).toBe('`age` BETWEEN ? AND ?');
            expect(values).toEqual([18, 25]);
        });

        test('should handle like clause in getWhereStatements', () => {
            const filter = { name: { like: 'John' } };
            const { statement, values } = Mysql.getWhereStatements(filter);

            expect(statement).toBe('`name` LIKE ?');
            expect(values).toEqual(['%John%']);
        });

        test('should handle not null clause in getWhereStatements', () => {
            const filter = { name: { not: null } };
            const { statement, values } = Mysql.getWhereStatements(filter);

            expect(statement).toBe('`name` IS NOT NULL');
            expect(values).toEqual([]);
        });

        test('should handle not equal clause in getWhereStatements', () => {
            const filter = { name: { not: 'John' } };
            const { statement, values } = Mysql.getWhereStatements(filter);

            expect(statement).toBe('`name` != ?');
            expect(values).toEqual(['John']);
        });

        test('should handle comparison clause in getWhereStatements', () => {
            const filter = { age: { '>=': 18 } };
            const { statement, values } = Mysql.getWhereStatements(filter);

            expect(statement).toBe('`age` >= ?');
            expect(values).toEqual([18]);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should throw an error if update operation is invalid', async () => {
            const table = 'users';
            const data = { age: { foo: 'bar' } };
            const id = 1;

            await expect(Mysql.update(table, data, id)).rejects.toThrow(CustomError);
        });

        test('should throw an error if data is empty', async () => {
            const mockPool = { execute: jest.fn().mockResolvedValue() };
            Mysql.connection = mockPool;
            Mysql.connected = true;

            const table = 'users';
            const data = {};
            const id = 1;

            await expect(Mysql.update(table, data, id)).rejects.toThrow(CustomError);
        });

        test('should throw an error if no data to update', async () => {
            const table = 'users';
            const data = {};
            const id = 1;

            await expect(Mysql.update(table, data, id)).rejects.toThrow('No data to update.');
        });

        test('should throw an error if query is malformed', async () => {
            Mysql.connection = { execute: jest.fn().mockRejectedValue(new Error('Syntax error')) };
            Mysql.connected = true;

            const sql = 'INVALID SQL QUERY';
            const data = [];

            await expect(Mysql.query(sql, data)).rejects.toThrow('Syntax error');
        });

        test('should handle empty results in find()', async () => {
            Mysql.connection = { execute: jest.fn().mockResolvedValue([[]]) };
            Mysql.connected = true;

            const table = 'users';
            const filter = { name: 'NonExistentUser' };
            const results = await Mysql.find(table, { filter });

            expect(results).toEqual([]);
        });
    });
});
