import Model from './model.js';

export default class User extends Model {

    constructor(fields, token) {
        super(fields, '/login', token);
    }

    async insert(data) {
        return this.call('/register', 'POST', data);
    }

    async googleLogin() {
        return this.call('/google', 'POST', null, this.token);
    }

    async login(data) {
        return this.call('/', 'POST', data);
    }

    async get() {
        return this.call('/user', 'GET', null, this.token);
    }
}