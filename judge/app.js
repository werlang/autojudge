import express from 'express';
import Runner from './runner.js';

const port = 3000;
const host = '0.0.0.0';
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post('/', async (req, res) => {
    try {
        const response = await new Runner({...req.body}).run();
        console.log(response);
        res.send(response);
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

// 404
app.use((req, res) => {
    res.status(404).send({ message: 'I am sorry, but I think you are lost.' });
});

app.listen(port, host, () => {
    console.log(`Web Server running at http://${host}:${port}/`);
});

