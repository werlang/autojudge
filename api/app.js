const express = require('express');
const cors = require('cors');
const Judge = require('./model/judge');

const port = 3000;
const host = '0.0.0.0';
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.post('/judge', async (req, res, next) => {
    try {
        const response = await new Judge({ ...req.body }).run();
        res.send(response);
    }
    catch (err) {
        next(err);
    }
});

// error handling
app.use(require('./middleware/error'));

// 404
app.use((req, res) => {
    res.status(404).send({ message: 'I am sorry, but I think you are lost.' });
});

app.listen(port, host, () => {
    console.log(`Web Server running at http://${host}:${port}/`);
});

