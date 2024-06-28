import CustomError from '../helpers/error.js';
import Db from '../helpers/mysql.js';

export default class Model {
    
    #allowUpdate = [];
    #insertFields = [];
    #tableName = '';

    constructor(tableName, { fields, allowUpdate, insertFields }) {
        this.#tableName = tableName;
        this.#allowUpdate = allowUpdate;
        this.#insertFields = insertFields;
        Object.assign(this, fields);
    }

    static async getAll(tableName) {
        return Db.find(tableName, {});
    }

    async insert() {
        const insertData = {};
        for (const field of this.#insertFields) {
            insertData[field] = this[field];
        }
        const result = await Db.insert(this.#tableName, insertData);
        this.id = result[0].insertId;
        return this.get();
    }

    async getBy(field = 'id') {
        if (!this[field]) {
            throw new CustomError(400, 'Invalid field');
        }

        let item = await Db.find(this.#tableName, {
            filter: { [field]: this[field] },
        });

        if (item.length === 0) {
            throw new CustomError(404, `${this.constructor.name} not found`);
        }

        item = item[0];
        for (const key of Object.keys(item)) {
            this[key] = item[key];
        }
        
        return this;
    }

    async get() {
        return this.getBy();
    }

    async update(fields) {
        const toChange = {};
        for (const key of Object.keys(fields)) {
            if (this.#allowUpdate.includes(key)) {
                toChange[key] = fields[key];
            }
        }
        await Db.update(this.#tableName, toChange, this.id);
        return this.get();
    }
}
