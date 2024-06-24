import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import unzipper from 'unzipper';
import Pledge from '../helpers/pledge.js';

class Runner {
    constructor({ filename, code, tests }) {
        this.code = this.base64toBuffer(code);
        this.filename = filename;
        this.tests = tests;
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

        this.unzipTests();
    }

    removeTmpDir() {
        fs.rmSync(this.tmpDir, { recursive: true });
    }

    async runAutoJudge() {
        // console.log('Running autojudge...');

        const pledge = new Pledge();

        try {
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
        catch (error) {
            console.error(error);
            pledge.reject(JSON.stringify(error));
            return pledge.timeout(5000);
        }
    }

}

export default Runner;
