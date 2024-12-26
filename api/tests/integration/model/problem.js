import Model from './model.js';

export default class Problem extends Model {

    constructor(fields, token) {
        super(fields, '/problems', token);
    }

    static async getAll(token) {
        return new Model({}, '/problems', token).call('/', 'GET');
    }

    static async getPdf(problems) {
        return new Model({}, '/problems').call('/pdf', 'POST', problems);
    }

    async insert(problem) {
        const res = await this.call('/', 'POST', problem);
        if (res.body.problem) {
            this.updateAttributes(res.body.problem);
        }
        return this;
    }

    async get() {
        const res = await this.call(`/${this.hash}`, 'GET');
        if (res.body.problem) {
            this.updateAttributes(res.body.problem);
        }
        return this;
    }

    async update(problem) {
        const res = await this.call(`/${this.id}`, 'PUT', problem);
        if (res.body.problem) {
            this.updateAttributes(res.body.problem);
        }
        return this;
    }

    async uploadImage(data) {
        data = data || { data: 'data:image/png;base64,base64data' };
        await this.call(`/${this.hash}/images`, 'POST', data);
        return this;
    }

    async deleteImage(id) {
        const res = await this.call(`/${this.hash}/images/${id}`, 'DELETE');
        return this;
    }

    async getImage(id) {
        const res = await this.call(`/${this.hash}/images/${id}`, 'GET');
        if (res.body) {
            this.image = res.body;
        }
        return this;
    }

    async getPdf() {
        const res = await this.call(`/${this.hash}/pdf`, 'POST');
        if (res.body) {
            this.pdf = res.body;
        }
        return this;
    }
}