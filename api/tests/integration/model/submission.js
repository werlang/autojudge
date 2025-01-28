import Model from './model.js';

export default class Submission extends Model {

    constructor(fields, token) {
        super(fields, '/submissions', token);
        this.entity = 'submission';
    }

    static async getAll(token = 'valid_token') {
        const res = await new Model({}, '/submissions', token).call('/', 'GET');
        return res.body;
    }

    static async getAccepted(token = 'valid_token') {
        const res = await new Model({}, '/submissions', token).call('/accepted', 'GET');
        return res.body;
    }

    async insert() {
        const res = await this.problem.addSubmission({
            code: this.code,
            filename: this.filename,
        });
        if (res.lastCall) {
            if (res.lastCall[this.entity]) {
                this.updateAttributes(res.lastCall[this.entity]);
            }
            this.lastCall = res.lastCall;
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

    async updateStatus(status) {
        const res = await this.call(`/${this.id}/status`, 'PUT', { status });
        if (res.body[this.entity]) {
            this.updateAttributes(res.body[this.entity]);
        }
        return this;
    }

    async judge() {
        const res = await this.call(`/${this.id}/judge`, 'POST', {}, process.env.BACKGROUND_TOKEN);
        // return res;
        if (res.body[this.entity]) {
            this.run = res.body[this.entity];
        }
        return this;
    }

}