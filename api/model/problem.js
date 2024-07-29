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
        language,
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
                language,
            },
            allowUpdate: ['title', 'description', 'input_public', 'output_public', 'input_hidden', 'output_hidden', 'solution', 'language'],
            insertFields: ['title', 'description', 'author', 'language'],
        });
    }
    
    static async getAll(filter) {
        return Model.getAll('problems', filter);
    }
}