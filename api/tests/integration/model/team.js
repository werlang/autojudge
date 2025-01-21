import Model from './model.js';

export default class Team extends Model {

    constructor(fields, token) {
        super(fields, '/teams', token);
        this.entity = 'team';
    }

    async login() {
        return this.call(`/${this.id}/login`, 'POST');
    }

    async insert() {
        const res = await this.contest.insertTeam({
            name: this.name,
            contest: this.contest.id,
        });
        if (res.lastCall && res.lastCall.team) {
            this.updateAttributes(res.lastCall.team);
            this.lastCall = res.lastCall;
        }
        return this;
    }

}