import Request from "../helpers/request";

export default class Judge {
    request = new Request({ url: `https://api.${ window.location.hostname }` });

    constructor({ tests, code, filename }) {
        this.tests = tests;
        this.code = code;
        this.filename = filename;
    }

    async run() {
        return await this.request.post('judge', {
            tests: this.tests,
            code: this.code,
            filename: this.filename,
        });
    }
}