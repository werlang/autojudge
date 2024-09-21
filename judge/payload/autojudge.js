import { exec, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const file = process.argv[2];
const tmpdir = process.argv[3];
let timeLimit = 3;

if (!file) {
    console.log(JSON.stringify({ error: true, message: "Usage: node script.js <script_file> <tmpdir>"}));
    process.exit(1);
}

// Check if Docker is running
try {
    execSync('docker info > /dev/null 2>&1');
} catch (error) {
    console.log(JSON.stringify({ error: true, message: "Docker is not running"}));
    process.exit(1);
}

// Extract the file extension
const extension = path.extname(file).slice(1);
// file name without extension
const fileName = path.basename(file, path.extname(file));

let pass = 0;
let fail = 0;
let results = [];

const inputDir = './input';
const outputDir = './output';

// Execute command to create network, ignore if exists
try {
    execSync('docker network create --driver bridge judge_runner 2> /dev/null');
}
catch (error) {
    // Ignore
}

// Get every file from the 'input' directory
fs.readdir(inputDir, async (error, inputFiles) => {
    if (error) {
        console.log(JSON.stringify({ error , message: "Error reading input directory"}));
        process.exit(1);
    }

    for (const inputFile of inputFiles) {
        const inputFilePath = path.join(inputDir, inputFile);
        const outputFilePath = path.join(outputDir, inputFile);

        // Read the expected output
        let outputContents;
        try {
            outputContents = fs.readFileSync(outputFilePath, 'utf8');
        } catch (error) {
            console.log(JSON.stringify({ error, message: `Error reading output file ${outputFilePath}:`}));
            process.exit(1);
        }

        // Give extra time for each language
        const extraTime = {
            c: 0.8,
            js: 0.6,
            php: 0.7,
            py: 0.6,
            java: 2,
        };
        timeLimit += extraTime[extension];

        // Create .env file and set TMPDIR, FILE, and INPUT
        const envContent = `TMPDIR=${tmpdir}\nFILE=${file}\nFILE_NAME=${fileName}\nINPUT=${inputFilePath}\nTIME_LIMIT=${timeLimit}`;
        fs.writeFileSync('.env', envContent);

        let command = `docker compose -f compilers.yaml run --rm `;
        const compilers = {
            c: 'gcc',
            js: 'node',
            php: 'php',
            py: 'python',
            java: 'java',
        };

        if (compilers[extension]) {
            command += compilers[extension];
        }
        else {
            console.log(JSON.stringify({ error: true, message: `Unsupported extension: ${extension}`}));
            process.exit(1);
        }

        // check for TLE
        let timeout;
        const timeoutPromise = new Promise(resolve => {
            timeout = setTimeout(() => {
                results.push({
                    file: inputFilePath,
                    status: "TLE"
                });
                fail += 1;
                resolve();
            }, timeLimit * 1000)
        });

        // Execute the command
        const startTime = Date.now();
        const exePromise = new Promise(resolve => exec(command, (error, stdout, stderr) => {
            if (stderr.length > 0) {
                fail += 1;
                results.push({
                    file: inputFilePath,
                    status: "RTE",
                    message: stderr,
                });
            }
            // remove the presentation error from end on both sides
            else if (stdout.trim().replace(/\s+$/, '') !== outputContents.trim().replace(/\s+$/, '')) {
                fail += 1;
                results.push({
                    file: inputFilePath,
                    status: "WA",
                    got: stdout,
                    expected: outputContents
                });
            }
            else {
                pass += 1;
                results.push({
                    file: inputFilePath,
                    status: "PASS",
                    time: Date.now() - startTime,
                });
            }

            clearTimeout(timeout);
            resolve();
        }));

        // return when either the command finishes or the timeout is reached
        await Promise.race([timeoutPromise, exePromise]);
    }

    // When all files are processed, output the results
    if (results.length !== inputFiles.length) {
        console.log(JSON.stringify({ error: true, message: "Error processing files"}));
        process.exit(1);
    }

    console.log(JSON.stringify({
        passed: pass,
        failed: fail,
        results,
    }));
});