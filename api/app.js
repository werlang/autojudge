const express = require('express');
const cors = require('cors');

const port = 3000;
const host = '0.0.0.0';
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.post('/judge', (req, res) => {
    res.send({
        status: 'accepted',
        tests: req.body.tests,
        code: req.body.code,
    });
});

// 404
app.use((req, res) => {
    res.status(404).send({ message: 'I am sorry, but I think you are lost.' });
});

app.listen(port, host, () => {
    console.log(`Web Server running at http://${host}:${port}/`);
});

