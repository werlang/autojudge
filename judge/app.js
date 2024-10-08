import express from 'express';
import Runner from './runner.js';
import { exec } from 'child_process';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const port = 3000;
const host = '0.0.0.0';
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// judge problem
app.post('/', async (req, res) => {
    try {
        const response = await new Runner({...req.body}).run();
        // console.log(response);
        res.send(response);
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

// create pdf from problem
app.post('/pdf', async (req, res) => {
    const template = req.body.template;
    const tempDir = uuidv4().replace(/-/g, '');
    const path = `/app/runs/${tempDir}`;
    fs.mkdirSync(path, { recursive: true });
    fs.writeFileSync(`${path}/template.html`, template);

    exec(`TEMP_DIR=${tempDir} docker compose -f payload/pdf.yaml run --rm pdf`, (error, stdout, stderr) => {
        // send the file
        res.contentType('application/pdf');
        res.sendFile(path + '/file.pdf', () => {
            // remove dir after sending file
            fs.rmdirSync(path, { recursive: true });
        });
    });
});

// 404
app.use((req, res) => {
    res.status(404).send({ message: 'I am sorry, but I think you are lost.' });
});

app.listen(port, host, () => {
    console.log(`Web Server running at http://${host}:${port}/`);
});

