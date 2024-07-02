import CustomError from '../helpers/error.js';
import Db from '../helpers/mysql.js';

export default class Relation {
    constructor(tableName, nativeObject, relatedField) {
        this.tableName = tableName;
        this.nativeObject = nativeObject;
        this.relatedField = relatedField;
    }

    async insert(fieldValue) {
        return Db.insert(this.tableName, {
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