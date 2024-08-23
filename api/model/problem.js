import CustomError from '../helpers/error.js';
import Model from './model.js';
import { v4 as uuidv4 } from 'uuid';

export default class Problem extends Model {
    constructor({
        id,
        hash,
        title,
        description,
        input_public,
        output_public,
        input_hidden,
        output_hidden,
        solution,
        author,
        language,
    }) {
        super('problems', {
            fields: {
                id,
                hash,
                created_at: null,
                title,
                description,
                input_public,
                output_public,
                input_hidden,
                output_hidden,
                solution,
                author,
                language,
            },
            allowUpdate: ['title', 'description', 'input_public', 'output_public', 'input_hidden', 'output_hidden', 'solution', 'language'],
            insertFields: ['title', 'description', 'author', 'language', 'hash'],
        });
    }
    
    static async getAll(filter) {
        return Model.getAll('problems', filter);
    }

    async get() {
        if (this.id) {
            return super.get();
        }
        else if (this.hash) {
            return super.getBy('hash');
        }

        throw new CustomError(400, 'ID or hash is required');
    }

    async insert() {
        this.hash = uuidv4().replace(/-/g, '');
        return super.insert();
    }
}