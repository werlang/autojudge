import LocalData from '../helpers/localData';

export default class Problem {

    static storageKey = 'problems';

    constructor({ id, file }) {
        this.id = id;
        this.file = file;
    }

    static get() {
        return new LocalData({ id: Problem.storageKey }).get() || {};
    }

    set() {
        const problems = this.get();
        problems[this.id] = this.file;
        new LocalData({
            id: Problem.storageKey,
            data: problems,
        }).set();
    }


    get() {
        const problems = Problem.get();
        
        if (!this.id || !problems[this.id]) {
            return false;
        }

        this.file = problems[this.id];
        return this;
    }
}