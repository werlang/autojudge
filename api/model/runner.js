const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');

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
        await this.runAutoJudge();
        this.removeTmpDir();
    }

    toFile(filedata) {
        filedata = filedata.replace(/^data:application\/octet-stream;base64,/, '');
        const buffer = Buffer.from(filedata, 'base64');
        return buffer;
    }

    createTmpDir() {
        // generate a random directory name under the runs directory
        const randomDirName = uuidv4().replace(/-/g, '');
        this.tmpDir = path.join(__dirname, '..', 'runs', randomDirName);
        fs.mkdirSync(this.tmpDir, { recursive: true });
    }

    writeFiles() {
        // copy code
        fs.writeFileSync(path.join(this.tmpDir, this.filename), this.code);

        // copy everything from payload dir to tmpDir
        fs.cpSync(path.join(__dirname, '..', 'payload'), this.tmpDir, { recursive: true });


        // this.tests.forEach(({ input, output }, index) => {
        //     fs.writeFileSync(path.join(this.tmpDir, `input${ index + 1 }.txt`), input);
        //     fs.writeFileSync(path.join(this.tmpDir, `output${ index + 1 }.txt`), output);
        // });
    }

    removeTmpDir() {
        // fs.rmSync(this.tmpDir, { recursive: true });
    }

    async runAutoJudge() {
        exec(`sh autojudge.sh ${this.filename}`, { cwd: this.tmpDir }, (error, stdout, stderr) => {
        // exec(`ls -la`, { cwd: this.tmpDir }, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
            }
            if (stdout) {
                console.log(`stdout: ${stdout}`);
            }
        });
    }

}

module.exports = Runner;