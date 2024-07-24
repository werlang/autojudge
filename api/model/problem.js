import Model from './model.js';

export default class Problem extends Model {
    constructor({
        id,
        title,
        description,
        input_public,
        output_public,
        input_hidden,
        output_hidden,
        solution,
        author,
    }) {
        super('problems', {
            fields: {
                id,
                created_at: null,
                title,
                description,
                input_public,
                output_public,
                input_hidden,
                output_hidden,
                solution,
                author,
            },
            allowUpdate: ['title', 'description', 'input_public', 'output_public', 'input_hidden', 'output_hidden', 'solution'],
            insertFields: ['title', 'description', 'author'],
        });
    }
    
    static async getAll(filter) {
        return Model.getAll('problems', filter);
    }
}