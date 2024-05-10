const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const Pledge = require('../helpers/pledge');

class Runner {

    service = 'runner';

    constructor({filename, code, tests}) {
        this.code = this.toFile(code);
        this.tests = tests;
        this.filename = filename;
    }

    async run() {
        this.createTmpDir();
        this.writeFiles();
        const response = await this.runAutoJudge();
        this.removeTmpDir();
        return response;
    }

    toFile(filedata) {
        // console.log(filedata)
        filedata = filedata.replace(/^data:.+;base64,/, '');
        const buffer = Buffer.from(filedata, 'base64');
        return buffer;
    }

    createTmpDir() {
        // generate a random directory name under the runs directory
        const randomDirName = uuidv4().replace(/-/g, '');
        this.tmpDir = path.join('/app/runs', randomDirName);
        fs.mkdirSync(this.tmpDir, { recursive: true });
    }

    writeFiles() {
        // copy code
        fs.writeFileSync(path.join(this.tmpDir, this.filename), this.code);
        // console.log(this.code.toString());

        // copy everything from payload dir to tmpDir
        fs.cpSync('/app/payload', this.tmpDir, { recursive: true });

        // this.tests.forEach(({ input, output }, index) => {
        //     fs.writeFileSync(path.join(this.tmpDir, `input${ index + 1 }.txt`), input);
        //     fs.writeFileSync(path.join(this.tmpDir, `output${ index + 1 }.txt`), output);
        // });
    }

    removeTmpDir() {
        fs.rmSync(this.tmpDir, { recursive: true });
    }

    async runAutoJudge() {
        // console.log('Running autojudge...');

        const pledge = new Pledge();

        // exec(`ls -la`, { cwd: this.tmpDir }, (error, stdout, stderr) => {
        exec(`sh autojudge.sh ${this.filename} ${this.tmpDir.split('/').slice(-1)[0]}`, { cwd: this.tmpDir }, (error, stdout, stderr) => {
            if (error) {
                // console.error(`exec error: ${error}`);
                pledge.reject(error);
            }
            if (stderr) {
                // console.error(`stderr: ${stderr}`);
                pledge.reject(stderr);
            }
            if (stdout) {
                // console.log(`stdout: ${stdout}`);
                pledge.resolve(stdout);
            }
        });

        // return pledge.get();
        return pledge.timeout(5000);
    }

}

module.exports = Runner;