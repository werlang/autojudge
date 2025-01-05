import bcrypt from 'bcrypt';
import Model from './model.js';
import CustomError from '../helpers/error.js';

export default class User extends Model {

    constructor({
        google_id,
        email,
        password,
        name,
        last_name,
        picture,
    }) {
        super('users', {
            fields: {
                id: null,
                google_id: google_id || null,
                email,
                password: password ? bcrypt.hashSync(password, 10) : null,
                name,
                last_name,
                picture: picture || null,
                created_at: null,
            },
            insertFields: ['google_id', 'email', 'password', 'name', 'last_name', 'picture'],
            allowUpdate: ['email', 'password', 'name', 'last_name', 'picture'],
        });
    }

    async insert() {
        if (!this.email || !this.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            throw new CustomError(400, 'Invalid email');
        }

        return super.insert();
    }

    async updatePassword(password) {
        return this.update({ password: await bcrypt.hash(password, 10) });
    }
}