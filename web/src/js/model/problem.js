import Api from "../helpers/api.js";

export default class Problem {

    constructor({ id, hash, title, description, language, isPublic }) {
        this.id = id;
        this.hash = hash;
        this.title = title;
        this.description = description;
        this.language = language || 'en';
        this.public = isPublic || false;
    }

    static async getAll(filter) {
        const problems = await new Api().get('problems', filter);
        return problems;
    }

    async get() {
        const {problem} = await new Api().get(`problems/${this.hash}`);
        for (const key in problem) {
            this[key] = problem[key];
        }
        return this;
    }

    async create() {
        const {problem} = await new Api().post('problems', {
            title: this.title,
            description: this.description,
            language: this.language,
            public: this.public,
        });
        this.hash = problem.hash;
        return this.get();
    }

    async update(fields) {
        if (!this.id) {
            await this.get();
        }
        const resp = await new Api().put(`problems/${this.id}`, fields);
        this.hash = resp.problem.hash;
        return this.get();
    }

    async getPDF(args) {
        await this.get();
        let blob = await new Api({ options: { responseMode: 'blob' }}).post(`problems/${this.hash}/pdf`, args);
        return blob;
    }

    async saveImage(data) {
        return new Api().post(`problems/${this.hash}/images`, { data }).then(resp => resp.id);
    }

    async removeImage(id) {
        return new Api().delete(`problems/${this.hash}/images/${id}`);
    }
    
    async getImageURL(id) {
        const response = await fetch(new Api().requestInstance.url + `/problems/${this.hash}/images/${id}`);
        return response.url;
    }
}