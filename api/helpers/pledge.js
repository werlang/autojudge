const CustomError = require('./error');

class Pledge {

    promise = null;

    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }

    resolve(data) {
        this.resolve(data);
    }

    reject(data) {
        this.reject(data);
    }

    async get() {
        return this.promise;
    }

    async timeout(time) {

        let resolved = false;

        setTimeout(() => {
            if (resolved) return;
            this.resolve('Request Timeout');
        }, time);

        this.promise.then(data => {
            resolved = true;
            this.resolve(data);
        });
        
        return this.promise;
    }

}

module.exports = Pledge;