import Model from './model.js';

export default class Problem extends Model {

    constructor(fields, token) {
        super(fields, '/problems', token);
        this.entity = 'problem';
    }

    static async getAll(token = 'valid_token') {
        return new Model({}, '/problems', token).call('/', 'GET');
    }

    static async getPdf(data) {
        return new Model({}, '/problems').call('/pdf', 'POST', data);
    }

    async insert(data) {
        const res = await this.call('/', 'POST', data);
        if (res.body[this.entity]) {
            this.updateAttributes(res.body[this.entity]);
        }
        return this;
    }

    async get() {
        const res = await this.call(`/${this.hash}`, 'GET');
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

    async addSubmission(data) {
        // send body.code and body.filename
        const res = await this.call(`/${this.id}/judge`, 'POST', data);
        if (res.body.submission) {
            this.submission = res.body.submission;
        }
        return this;
    }
}