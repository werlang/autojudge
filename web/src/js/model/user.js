import Api from "../helpers/api.js";
import GoogleLogin from "../helpers/google-login.js";
import LocalData from "../helpers/local-data.js";

export default class User {
    constructor({ name, lastName, email, password }={}) {
        this.name = name;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
    }

    static getToken() {
        return new LocalData({ id: 'user-credential' }).get();
    }

    static removeToken() {
        new LocalData({ id: 'user-credential' }).remove();
    }

    async get() {
        // request user data from the server
        let user;
        const googleCredential = GoogleLogin.getCredential();
        if (googleCredential) {
            user = await new Api().post('login/google');
        }
        else if (User.getToken()) {
            user = await new Api().get('login/user');
        }
        else {
            throw new Error('User not logged.');
        }
        // console.log(user);
        if (user.error) {
            throw new Error(user.message);
        }
        return user;
    }

    async login() {
        // request user data from the server
        const user = await new Api().post('login', {
            email: this.email,
            password: this.password,
        });
        // console.log(user);
        if (user.error) {
            throw new Error(user.message);
        }
        new LocalData({ id: 'user-credential' }).set({ data: user.user.token, expires: '12h' });
        return user;
    }

    async add() {
        // request user data from the server
        const user = await new Api().post('login/register', {
            name: this.name,
            lastName: this.lastName,
            email: this.email,
            password: this.password,
        });
        return user;
    }
}