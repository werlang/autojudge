export default class Cookie {

    constructor(name) {
        this.name = name;
    }

    set(value, days) {
        const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
        document.cookie = `${this.name}=${value}; expires=${expires}; path=/`;
    }

    get() {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${this.name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    delete() {
        document.cookie = `${this.name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
}