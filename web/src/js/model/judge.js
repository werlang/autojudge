import Request from "../helpers/request";

export default class Judge {
    request = new Request({ url: `https://api.${ window.location.hostname }` });

    constructor({ tests, code }) {
        this.tests = tests;
        this.code = code;
    }

    async run() {
        return await this.request.post('judge', {
            tests: this.tests,
            code: this.code
        });
    }
}