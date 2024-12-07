import Api from "../helpers/api.js";
import Team from "./team.js";

export default class Contest {
    
    constructor({ id, name, description, duration, penaltyTime, freezeTime }) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.duration = duration;
        this.penaltyTime = penaltyTime;
        this.freezeTime = freezeTime;
    }

    static async getAll() {
        const contests = await new Api().get('contests');
        return contests;
    }

    async get(logAsTeam=false, logo=false) {
        const args = {};
        if (logAsTeam) {
            args.token = Team.getToken();
        }
        const query = new URLSearchParams({
            logo: logo,
        }).toString();
        const contest = await new Api(args).get(`contests/${this.id}?${query}`);
        return contest;
    }

    async create() {
        const contest = await new Api().post('contests', {
            name: this.name,
            description: this.description,
            duration: this.duration,
            penaltyTime: this.penaltyTime,
            freezeTime: this.freezeTime,
        });
        return contest;
    }

    async update(fields) {
        const resp = await (async () => {
            if (fields.logo) {
                return new Api().post(`contests/${this.id}/logo`, fields);
            }
            return new Api().put(`contests/${this.id}`, fields);
        })();
        
        const contest = await this.get();
        return { ...resp, ...contest };
    }

    async getProblems(logAsTeam=false) {
        const args = {};
        if (logAsTeam) {
            args.token = Team.getToken();
        }
        const {problems} = await new Api(args).get(`contests/${this.id}/problems`);
        return problems;
    }

    async addProblem(id) {
        const resp = await new Api().post(`contests/${this.id}/problems/${id}`);
        return resp;
    }

    async removeProblem(id) {
        const resp = await new Api().delete(`contests/${this.id}/problems/${id}`);
        return resp;
    }

    async updateProblem(id, fields) {
        const resp = await new Api().put(`contests/${this.id}/problems/${id}`, fields);
        return resp;
    }

    async start() {
        const resp = await new Api().put(`contests/${this.id}/start`);
        return resp;
    }

    async reset() {
        const resp = await new Api().put(`contests/${this.id}/reset`);
        return resp;
    }

    async unlock() {
        const resp = await new Api().put(`contests/${this.id}/unlock`);
        return resp;
    }

    async getSubmissions() {
        const submissions = await new Api().get(`contests/${this.id}/submissions`);
        return submissions;
    }

    async getPDF(args) {
        let blob = await new Api({ options: { responseMode: 'blob' }}).post(`contests/${this.id}/pdf`, args);
        return blob;
    }
}