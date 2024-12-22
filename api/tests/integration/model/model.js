import Request from 'supertest';
import app from '../../../app.js';

export default class Model {

    fields = [];

    constructor(fields = {}, route, token) {
        this.update(fields);

        this.request = Request(app);

        this.route = route || '/';
        this.token = token || false;
    }

    async call(endpoint = '/', method = 'GET', body, token) {
        const request = this.request[method.toLowerCase()](`${this.route}/${endpoint}`).set('Content-Type', 'application/json');

        token = token !== false || this.token;
        if (token) {
            request.set('Authorization', `Bearer ${token}`);
        }
         
        return request.send(body || Object.fromEntries(this.fields.map(field => [field, this[field]])));
    }

    async update(fields) {
        for (const [key, value] of Object.entries(fields)) {
            this[key] = value;
            this.fields.push(key);
        }
        return this;
    }
}