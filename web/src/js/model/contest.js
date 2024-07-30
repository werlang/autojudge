import Api from "../helpers/api.js";

export default class Contest {
    
        constructor({ id, name, description, duration }) {
            this.id = id;
            this.name = name;
            this.description = description;
            this.duration = duration;
        }
    
        static async getAll() {
            const contests = await new Api().get('contests');
            return contests;
        }
    
        async get() {
            const contest = await new Api().get(`contests/${this.id}`);
            return contest;
        }
    
        async create() {
            const contest = await new Api().post('contests', {
                name: this.name,
                description: this.description,
                duration: this.duration,
            });
            return contest;
        }
}