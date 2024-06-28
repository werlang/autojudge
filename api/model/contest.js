import Model from './model.js';

export default class Contest extends Model {
    constructor({
        id,
        name,
        description,
        admin,
    }) {
        super('contests', {
            fields: {
                id,
                name,
                description,
                admin,
            },
            allowUpdate: ['name', 'description'],
            insertFields: ['name', 'description', 'admin'],
        });
    }

    async getAll() {
        return Model.getAll('contests', { admin: this.admin });
    }
}