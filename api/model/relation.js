import CustomError from '../helpers/error.js';
import Db from '../helpers/mysql.js';

// Relation class to handle many-to-many relationships
//   tableName: name of the table to store the relation: e.g. contest_problems
//   nativeObject: object containing the field values of the current object: e.g. { contest: 1 }
//   relatedField: field name of the related object: e.g. 'problem'
// Methods:
// check(fieldValue): check if the relation exists
// insert(fieldValue): insert a new relation
// delete(fieldValue): delete an existing relation
// update(fieldValue, data): update an existing relation
// get(): get all related field values

export default class Relation {
    constructor(tableName, nativeObject, relatedField) {
        this.tableName = tableName;
        this.nativeObject = nativeObject;
        this.relatedField = relatedField;
    }

    async check(fieldValue) {
        const relation = (await this.get()).find(r => parseInt(r[this.relatedField]) === parseInt(fieldValue));
        return relation ? true : false;
    }

    async insert(fieldValue) {
        if (await this.check(fieldValue)) throw new CustomError(400, 'Relation already exists.');
        return Db.insert(this.tableName, {
            ...this.nativeObject,
            [this.relatedField]: fieldValue,
        });
    }

    async delete(fieldValue) {
        if (!await this.check(fieldValue)) throw new CustomError(404, 'Relation does not exist.');
        return Db.delete(this.tableName, {
            ...this.nativeObject,
            [this.relatedField]: fieldValue,
        });
    }

    async update(fieldValue, data) {
        if (!await this.check(fieldValue)) throw new CustomError(404, 'Relation does not exist.');
        const toChange = {};
        for (const key of Object.keys(data)) {
            if (data[key] !== undefined) {
                toChange[key] = data[key];
            }
        }
        return Db.update(this.tableName, toChange, {
            ...this.nativeObject,
            [this.relatedField]: fieldValue,
        });
    }

    async get() {
        return await Db.find(this.tableName, { filter: {
            ...this.nativeObject,
        } });
    }
}