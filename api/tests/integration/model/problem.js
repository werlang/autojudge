import Model from './model.js';

export default class Problem extends Model {

    constructor(fields, token) {
        super(fields, '/problems', token);
    }

    static async getAll(token) {
        return new Model({}, '/problems', token).call('/', 'GET');
    }

    async insert(problem) {
        return this.call('/', 'POST', problem);
    }

    async get() {
        return this.call(`/${this.hash}`, 'GET');
    }

    async update(problem) {
        return this.call(`/${this.id}`, 'PUT', problem);
    }

    async uploadImage() {
        const data = { data: 'data:image/png;base64,base64data' }
        return this.call(`/${this.hash}/images`, 'POST', data);
    }

    async deleteImage(id) {
        return this.call(`/${this.hash}/images/${id}`, 'DELETE');
    }

    async getImage(id) {
        return this.call(`/${this.hash}/images/${id}`, 'GET');
    }
}