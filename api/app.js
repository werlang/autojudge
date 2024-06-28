import express from 'express';
import cors from 'cors';
import Runner from './model/runner.js';
import errorMiddleware from './middleware/error.js';
// import passkeyRouter from './route/passKey.js';
import login from './route/login.js';
import contest from './route/contest.js';
import teams from './route/team.js';
import problems from './route/problem.js';

const port = 3000;
const host = '0.0.0.0';
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.post('/judge', async (req, res, next) => {
    try {
        // console.log(req.body)
        const response = await new Runner({ ...req.body }).run();
        res.send({ message: response });
    }
    catch (err) {
        console.log(err);
        next(err);
    }
});

// app.use('/passkey', passkeyRouter);

app.use('/login', login);
app.use('/contests', contest);
app.use('/teams', teams);
app.use('/problems', problems);

// error handling
app.use(errorMiddleware);

// 404
app.use((req, res) => {
    res.status(404).send({ message: 'I am sorry, but I think you are lost.' });
});

app.listen(port, host, () => {
    console.log(`Web Server running at http://${host}:${port}/`);
});

