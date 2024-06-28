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
        owner,
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
                owner,
            },
            allowUpdate: ['title', 'description', 'input_public', 'output_public', 'input_hidden', 'output_hidden', 'solution'],
            insertFields: ['title', 'description', 'owner'],
        });
    }

}