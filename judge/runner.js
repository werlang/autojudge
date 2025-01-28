import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import unzipper from 'unzipper';
import Pledge from './pledge.js';

class Runner {
    constructor({ filename, code, tests, format }) {
        this.filename = filename;
        this.tests = tests;
        this.format = format || 'zip';
        this.code = this.base64toBuffer(code);
    }

    base64toBuffer(filedata) {
        // console.log(filedata)
        filedata = filedata.replace(/^data:.+;base64,/, '');
        const buffer = Buffer.from(filedata, 'base64');
        return buffer;
    }

    unzipTests() {
        const buffer = this.base64toBuffer(this.tests);

        const filename = 'problem.zip';
        fs.writeFileSync(path.join(this.tmpDir, filename), buffer);

        // unzip file to tmpDir
        fs.createReadStream(path.join(this.tmpDir, filename))
            .pipe(unzipper.Extract({ path: this.tmpDir }));
    }

    buildJsonTests() {
        // create input and output dir on tmpDir
        fs.mkdirSync(path.join(this.tmpDir, 'input'), { recursive: true });
        fs.mkdirSync(path.join(this.tmpDir, 'output'), { recursive: true });

        // write input and output files
        try {
            JSON.parse(this.tests.input).forEach((test, i) => {
                fs.writeFileSync(path.join(this.tmpDir, 'input', `test${i.toString().padStart(2, '0')}`), test);
            });
            JSON.parse(this.tests.output).forEach((test, i) => {
                fs.writeFileSync(path.join(this.tmpDir, 'output', `test${i.toString().padStart(2, '0')}`), test);
            });
        }
        catch (error) {
            console.error(error);
            throw new Error('Error parsing JSON tests');
        }
    }

    async run() {
        this.createTmpDir();
        this.writeFiles();
        const response = await this.runAutoJudge();
        this.removeTmpDir();
        return response;
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

        if (this.format === 'zip') {
            this.unzipTests();
        }
        else if (this.format === 'json') {
            this.buildJsonTests();
        }
    }

    removeTmpDir() {
        fs.rmSync(this.tmpDir, { recursive: true });
    }

    async runAutoJudge() {
        // console.log('Running autojudge...');

        const timeout = process.env.RUNNER_TIMEOUT || 30000;
        const pledge = new Pledge();

        try {
            // exec(`ls -la`, { cwd: this.tmpDir }, (error, stdout, stderr) => {
            exec(`node autojudge.js ${this.filename} ${this.tmpDir.split('/').slice(-1)[0]}`, { cwd: this.tmpDir }, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    pledge.reject(error);
                }
                if (stderr) {
                    console.error(`stderr: ${stderr}`);
                    pledge.reject(stderr);
                }
                if (stdout) {
                    console.log(`stdout: ${stdout}`);
                    pledge.resolve(stdout);
                }
            });
    
            // return pledge.get();
            const response = await pledge.timeout(timeout);
            if (response === 'Request Timeout') {
                return { error: 'TLE', message: 'Request Timeout' };
            }
            try {
                return JSON.parse(response);
            }
            catch (error) {
                return {
                    error,
                    message: 'Error parsing response',
                    response,
                }
            }
        }
        catch (error) {
            console.error(error);
            pledge.reject(JSON.stringify(error));
            return pledge.timeout(timeout);
        }
    }

}

export default Runner;
