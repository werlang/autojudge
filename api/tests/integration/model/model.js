import Request from 'supertest';
import app from '../../../app.js';

export default class Model {

    fields = [];

    constructor(fields = {}, route, token, url) {
        this.updateAttributes(fields);

        this.request = Request(url || app);

        this.route = route || '/';
        this.token = token || false;
    }

    async call(endpoint, method = 'GET', body, token) {
        const request = this.request[method.toLowerCase()](`${this.route}${endpoint}`).set('Content-Type', 'application/json');

        if (token) {
            this.token = token;
        }
        if (this.token || this.token === false) {
            request.set('Authorization', `Bearer ${token}`);
        }
        
        const res = await request.send(body || Object.fromEntries(this.fields.map(field => [field, this[field]])));
        this.updateAttributes({ lastCall: {
            ...res.body,
            status: res.status,
            header: res.header,
        }});
        app.emit('close');
        return res;
    }

    async updateAttributes(fields) {
        for (const [key, value] of Object.entries(fields)) {
            this[key] = value;
            this.fields.push(key);
        }
        return this;
    }
}