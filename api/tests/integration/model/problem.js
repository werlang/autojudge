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

}