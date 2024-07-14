import LocalData from '../helpers/local-data.js';
import Request from '../helpers/request.js';
import TemplateVar from '../helpers/template-var.js';

export default class User {
    constructor() {

    }

    async get() {
        // check the local storage for the user data
        const user = new LocalData({ id: 'user' }).get();
        if (user) {
            return user;
        }

        // check the template variable
        const token = new LocalData({ id: 'google-credential' }).get();
        if (token) {
            // request user data from the server
            const user = await new Request({ 
                url: `https://${TemplateVar.get('apiurl')}`,
                headers: { 'Authorization': `Bearer ${token}` }
            }).post('login');
            // console.log(user);
            if (user.error) {
                throw new Error(user.message);
            }
            new LocalData({ id: 'user', data: user.user }).set();
            return user;
        }

        throw new Error('User not found');
    }
}