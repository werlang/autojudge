// Model: Bootstrap all CRUD operations for a model

// Usage:
// class SampleModel extends Model {
//     constructor({ foo, bar }) {
//         super('sample_table', {
//             fields: {
//                 id: null,
//                 foo,
//                 bar,
//             },
//             allowUpdate: ['foo'],
//             insertFields: ['foo', 'bar'],
//         });
//     }
// }

// Then you can use the model like this:
// const sample = new SampleModel({ foo: 'foo', bar: 'bar' });
// await sample.insert();
// await sample.get();
// await sample.update({ foo: 'new_foo' }


import CustomError from '../helpers/error.js';
import Db from '../helpers/mysql.js';
import Relation from './relation.js';

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

    static async getAll(tableName, filter = {}) {
        return Db.find(tableName, { filter });
    }

    async getAll(filter = {}) {
        return Db.find(this.#tableName, { filter });
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

    async getBy(field = 'id', additionalFilters = {}) {
        if (!this[field]) {
            throw new CustomError(400, 'Invalid field');
        }

        let item = await Db.find(this.#tableName, {
            filter: { [field]: this[field], ...additionalFilters },
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
            if (this.#allowUpdate.includes(key) && fields[key] !== undefined) {
                toChange[key] = fields[key];
            }
        }
        await Db.update(this.#tableName, toChange, this.id);
        return this.get();
    }

    addRelation(relationName, tableName, nativeField, relatedField) {
        if (!this.relations) {
            this.relations = [];
        }
        this.relations[relationName] = new Relation(tableName, { [nativeField]: this.id }, relatedField);
    }

    async insertRelation(name, value) {
        if (!this.relations[name]) {
            throw new CustomError(400, 'Relation not found');
        }
        return this.relations[name].insert(value);
    }

    async deleteRelation(name, value) {
        if (!this.relations[name]) {
            throw new CustomError(400, 'Relation not found');
        }
        return this.relations[name].delete(value);
    }
    
    async getRelation(name) {
        if (!this.relations[name]) {
            throw new CustomError(400, 'Relation not found');
        }
        return this.relations[name].get();
    }

    async updateRelation(name, value, data) {
        if (!this.relations[name]) {
            throw new CustomError(400, 'Relation not found');
        }
        return this.relations[name].update(value, data);
    }
}
