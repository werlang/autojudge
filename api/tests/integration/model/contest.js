import Model from './model.js';

export default class Contest extends Model {

    constructor(fields, token = 'valid_token') {
        super(fields, '/contests', token);
    }

    async insert(contest) {
        const res = await this.call('/', 'POST', contest);
        if (res.body.contest) {
            this.updateAttributes(res.body.contest);
        }
        return this;
    }

}