import Api from "../helpers/api.js";

export default class User {
    constructor() {

    }

    async get() {
        // request user data from the server
        const user = await new Api().post('login');
        // console.log(user);
        if (user.error) {
            throw new Error(user.message);
        }
        return user;
    }
}