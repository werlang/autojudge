export default class Judge {
    constructor({ tests, code }) {
        this.tests = tests;
        this.code = code;
    }

    async run() {
        const data = new FormData();
        data.append('tests', this.tests);
        data.append('code', this.code);

        const response = await fetch('https://api.autojudge.localhost/judge', {
            method: 'POST',
            body: data,
        });

        return await response.json();
    }
}