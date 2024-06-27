import Db from '../helpers/mysql.js';

export default class User {

    constructor({
        googleId = null,
        email = null,
        name = null,
        lastName = null,
        picture = null,
    }) {
        this.googleId = googleId;
        this.email = email;
        this.name = name;
        this.lastName = lastName;
        this.picture = picture;
    }

    async get() {
        let user = await Db.find('users', {
            filter: { google_id: this.googleId },
        });

        if (user.length === 0) {
            return this;
        }

        this.found = true;

        user = user[0];
        this.email = user.email;
        this.name = user.name;
        this.lastName = user.last_name;
        this.picture = user.picture;
        this.googleId = user.google_id;
        this.id = user.id;
        this.createdAt = user.created_at;
        
        return this;
    }

    async insert() {
        await Db.insert('users', {
            google_id: this.googleId,
            email: this.email,
            name: this.name,
            last_name: this.lastName,
            picture: this.picture,
        });

        return this.get();
    }
}