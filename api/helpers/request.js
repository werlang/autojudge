export default class Request {
    constructor({ url, headers, timeout = 5000 }) {
        this.url = url;
        this.headers = new Headers(headers || {});
        this.timeout = timeout;
    }

    setHeader(key, value) {
        this.headers.set(key, value);
    }

    setHeaders(headers) {
        for (const [key, value] of Object.entries(headers)) {
            this.headers.set(key, value);
        }
    }

    async get(endpoint, args) {
        return this.request('GET', endpoint, args);
    }

    async post(endpoint, args) {
        return this.request('POST', endpoint, args);
    }

    async request(method, endpoint, data = {}) {
        const options = {
            method,
            headers: this.headers,
        };

        if (method === 'POST') {
            options.body = JSON.stringify(data);
            this.headers.set('Content-Type', 'application/json');
        }
        if (method === 'GET') {
            const queryString = new URLSearchParams(data).toString();
            endpoint += '?' + queryString;
        }

        options.signal = AbortSignal.timeout(this.timeout);

        try {
            const response = await fetch(`${this.url}/${endpoint}`, options);

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text);
            }

            const text = await response.text();
            try {
                return JSON.parse(text);
            } catch (e) {
                return text;
            }
        } catch (error) {
            // console.error('Request failed', error);
            throw error;
        }
    }
}
