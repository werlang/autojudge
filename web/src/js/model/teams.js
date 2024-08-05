import Api from "../helpers/api.js";

export default class Team {

    constructor({ id, contest, name }) {
        this.id = id;
        this.name = name;
        this.contest = contest;
    }

    async get() {
        const team = await new Api().get(`teams/${this.id}`);
        return team;
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

}