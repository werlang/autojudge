import Model from './model.js';

export default class Contest extends Model {

    constructor(fields, token = 'valid_token') {
        super(fields, '/contests', token);
        this.entity = 'contest';
    }

    static async getAll(token = 'valid_token') {
        return new Model({}, '/contests', token).call('/', 'GET');
    }

    async insert(data) {
        const res = await this.call('/', 'POST', data);
        if (res.body[this.entity]) {
            this.updateAttributes(res.body[this.entity]);
        }
        return this;
    }

    async get() {
        const res = await this.call(`/${this.id}`, 'GET');
        if (res.body[this.entity]) {
            this.updateAttributes(res.body[this.entity]);
        }
        return this;
    }

    async update(data) {
        const res = await this.call(`/${this.id}`, 'PUT', data);
        if (res.body[this.entity]) {
            this.updateAttributes(res.body[this.entity]);
        }
        return this;
    }

    async updateLogo(data) {
        const res = await this.call(`/${this.id}/logo`, 'POST', { logo: data});
        return this;
    }

    async start() {
        const res = await this.call(`/${this.id}/start`, 'PUT');
        return this;
    }

}