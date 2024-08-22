import Api from "../helpers/api.js";
import LocalData from "../helpers/local-data.js";

export default class Team {

    constructor({ id, contest, name, password }) {
        this.id = id;
        this.name = name;
        this.contest = contest;
        this.password = password;
    }

    static getToken() {
        return new LocalData({ id: 'team-credential' }).get();
    }

    static removeToken() {
        new LocalData({ id: 'team-credential' }).remove();
    }

    async get() {
        const team = await new Api({ token: Team.getToken() }).get(`teams`);
        return team;
    }

    async login() {
        try {
            const token = await new Api({ token: this.password }).post(`teams/${this.id}/login`);
            new LocalData({ id: 'team-credential' }).set({ data: token.token, expires: '12h' });
            return token;
        }
        catch (error) {
            new LocalData({ id: 'team-credential' }).remove();
            throw error;
        }
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
        return await new Api().put(`teams/${this.id}`, fields);
    }

    async getContest() {
        const {team} = await this.get();
        const contest = await new Api({ token: Team.getToken() }).get(`contests/${team.contest.id}`);
        return contest;
    }

}