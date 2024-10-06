import User from "../model/user.js";
import GoogleLogin from "./google-login.js";
import Request from "./request.js";
import TemplateVar from "./template-var.js";

export default class Api {

    constructor({ auth, token }={}) {
        this.auth = auth || true;
        this.token = token;
        this.requestInstance = this.setInstance();
    }

    setInstance() {
        const token = this.token || User.getToken() || GoogleLogin.getCredential();
        if (!token) {
            this.auth = false;
        }

        if (!this.auth) {
            const requestInstance = new Request({ 
                url: `${location.protocol}//${TemplateVar.get('apiurl')}`,
            });
            return requestInstance;
        }

        const requestInstance = new Request({ 
            url: `${location.protocol}//${TemplateVar.get('apiurl')}`,
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return requestInstance;
    }


    async get(endpoint, data) {
        return this.requestInstance.get(endpoint, data);
    }

    async post(endpoint, data) {
        return this.requestInstance.post(endpoint, data);
    }

    async put(endpoint, data) {
        return this.requestInstance.put(endpoint, data);
    }

    async delete(endpoint, data) {
        return this.requestInstance.delete(endpoint, data);
    }
}