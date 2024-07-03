import CustomError from '../helpers/error.js';
import Db from '../helpers/mysql.js';

export default class Relation {
    constructor(tableName, nativeObject, relatedField) {
        this.tableName = tableName;
        this.nativeObject = nativeObject;
        this.relatedField = relatedField;
    }

    async check(fieldValue) {
        const relation = (await this.get()).find(r => parseInt(r) === parseInt(fieldValue));
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

    async get() {
        const relations = await Db.find(this.tableName, { filter: {
            ...this.nativeObject,
        } });
        return relations.map(relation => relation[this.relatedField]);
    }
}