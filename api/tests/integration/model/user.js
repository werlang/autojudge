import Model from './model.js';

export default class User extends Model {

    constructor(fields, token) {
        super(fields, '/login', token);
    }

    async insert(user) {
        return this.call('/register', 'POST', user);
    }

    async googleLogin() {
        return this.call('/google', 'POST', null, this.token);
    }

    async login(user) {
        return this.call('/', 'POST', user);
    }

    async get() {
        return this.call('/user', 'GET', null, this.token);
    }
}