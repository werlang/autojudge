import Request from './request.js';

const background = {
    init: async function() {
        console.log('Background script started');
        this.request = new Request({ url: `http://api:3000` });

        this.watchSubmissions();
    },
    
    watchSubmissions: async function() {
        const submissions = await this.request.get(`submissions/pending`, {});
        // console.log(submissions);

        if (submissions.submissions.length > 0) {
            const submission = submissions.submissions[0];

            const response = await this.request.post(`submissions/${submission.id}/judge`, {});
            // console.log(response);
            console.log(response, response.submission.results);
        }
        else {
            console.log('No pending submissions');
        }
            
        // setTimeout(() => this.watchSubmissions(), 1000);
    },
}

background.init().catch(console.error);