import Request from './request.js';

const background = {
    init: async function() {
        console.log('Background script started');
        this.request = new Request({ url: `http://api:3000` });
        this.request.setHeader('Authorization', 'Bearer ' + process.env.BACKGROUND_TOKEN);

        this.watchSubmissions();
    },
    
    watchSubmissions: async function() {
        const requestInterval = 5000;
        try {
            const submissions = await this.request.get(`submissions/pending`, {});
            // console.log(submissions);
    
            if (submissions.submissions.length > 0) {
                const submission = submissions.submissions[0];
    
                const response = await this.request.post(`submissions/${submission.id}/judge`, {});
                console.log(`[${new Date().toISOString()}] ${JSON.stringify(response, null, 2)}`);
            }
            else {
                console.log(`[${new Date().toISOString()}] No pending submissions`);
            }
                
            setTimeout(() => this.watchSubmissions(), requestInterval);
        }
        catch (error) {
            console.error(error);
        }
    },
}

background.init().catch(console.error);