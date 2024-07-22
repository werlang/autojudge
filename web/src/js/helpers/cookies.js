export default class Cookies {

    constructor(name) {
        this.name = name;
    }

    static set(value, days) {
        const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
        document.cookie = `${this.name}=${value}; expires=${expires}; path=/`;
    }

    static get() {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${this.name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    static delete() {
        document.cookie = `${this.name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
}