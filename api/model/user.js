import Model from './model.js';

export default class User extends Model {

    constructor({
        google_id,
        email,
        name,
        last_name,
        picture,
    }) {
        super('users', {
            fields: {
                id: null,
                google_id,
                email,
                name,
                last_name,
                picture,
                created_at: null,
            },
            insertFields: ['google_id', 'email', 'name', 'last_name', 'picture'],
            allowUpdate: ['email', 'name', 'last_name', 'picture'],
        });
    }

    async get() {
        return this.getBy('google_id');
    }
}