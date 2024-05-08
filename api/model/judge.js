const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Runner = require('../helpers/runner');

class Judge {

    constructor({ code, tests, filename }) {
        this.code = code;
        this.tests = tests;
        this.filename = filename;
    }

    async run() {
        new Runner()

    }
}

module.exports = Judge;