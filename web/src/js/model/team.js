import Api from "../helpers/api.js";

export default class Team {

    constructor({ id, contest, name, password, token }) {
        this.id = id;
        this.name = name;
        this.contest = contest;
        this.password = password;
        this.token = token
    }

    async get() {
        const team = await new Api({ token: this.token }).get(`teams/${this.id}`);
        return team;
    }

    async login() {
        const token = await new Api({ token: this.password }).post(`teams/${this.id}/login`);
        return token;
    }

    async add() {
        const {team} = await new Api().post(`contests/${this.contest}/teams`, { name: this.name, });
        return team;
    }

    async remove() {
        const resp = await new Api().delete(`teams/${this.id}`);
        return resp;
    }

    async resetPassword() {
        const {team} = await new Api().put(`teams/${this.id}/reset`);
        return team;
    }

    async update(fields) {
        await new Api().put(`teams/${this.id}`, fields);
        const team = await this.get();
        return team;
    }

    async getContest() {
        const {team} = await this.get();
        const contest = await new Api({ token: this.token }).get(`contests/${team.contest.id}`);
        return contest;
    }

}