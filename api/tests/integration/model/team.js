import Model from './model.js';

export default class Team extends Model {

    constructor(fields, token) {
        super(fields, '/teams', token);
        this.entity = 'team';
    }

    async login() {
        // console.log(this.password);
        const res = await this.call(`/${this.id}/login`, 'POST', {}, this.password);
        return res.body;
    }

    async insert() {
        const res = await this.contest.insertTeam({
            name: this.name,
            contest: this.contest.id,
        });
        if (res.lastCall) {
            if (res.lastCall.team) {
                this.updateAttributes(res.lastCall.team);
            }
            this.lastCall = res.lastCall;
        }
        return this;
    }

}