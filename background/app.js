import Request from './request.js';

const background = {
    init: async function() {
        this.request = new Request({ url: `http://api:3000` });

        this.watchSubmissions();
    },
    
    watchSubmissions: async function() {
        const id = 1;
        const resp = await this.request.get(`submissions/${id}`, {});
        console.log(resp);
            
        setTimeout(() => this.watchSubmissions(), 1000);
    },
}

background.init().catch(console.error);