// LocalData: a class to save data to local storage, allowing to set expiration time
// new LocalData({
//     id: (string) key to save data,
//     expires: (number) expiration timestamp || false,
//     data: (object) data to save to local storage
// })
// Methods:
// get(): get data from local storage
// set({ data, expires }): save data to local storage
//   - data: (object) data to save to local storage
//   - expires: (number) expiration timestamp
// check(): check if data is expired
// delete(): delete data from local storage
// addTime(time): add time to expiration time
//   - time: (number) time to add in milliseconds
// Example:
// const localData = new LocalData({
//     id: 'myData',
//     expires: Date.now() + 1000 * 60 * 60 * 24, // 1 day
//     data: {
//         name: 'John',
//         age: 30,
//     }
// });
// localData.set(); // save data to local storage
// const data = localData.get(); // get data from local storage


class LocalData {
    constructor({ id, data, expires } = {}) {
        this.id = id;
        this.data = data;
        this.expires = expires || false;
    }

    // get data from local storage
    get() {
        let loadedData = localStorage.getItem(this.id);
        if (loadedData) {
            const { data, expires } = JSON.parse(loadedData);
            this.data = data;
            this.expires = expires;
            this.check();
        }
        return this.data;
    }

    // save data to local storage
    set({ data, expires } = {}) {
        if (!data && expires === undefined) {
            return false;
        }
        this.data = data || this.data;
        this.expires = expires === undefined ? this.expires : expires;

        localStorage.setItem(this.id, JSON.stringify({
            data: this.data,
            expires: this.expires
        }));
        return true;
    }

    // check if data is expired
    check() {
        if (!this.data) return false;

        if (this.expires === false || this.expires > Date.now()) {
            return true;
        }

        this.remove();
        return false;
    }

    // delete data from local storage
    remove() {
        this.data = null;
        localStorage.removeItem(this.id);
    }

    // add time to expiration time
    addTime(time) {
        this.expires = (this.expires === false ? Date.now() : this.expires) + time;
        this.set();
    }
}

export default LocalData;