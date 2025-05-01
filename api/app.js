import express from 'express';
import cors from 'cors';
import errorMiddleware from './middleware/error.js';
// import passkeyRouter from './route/passKey.js';
import login from './route/login.js';
import contest from './route/contest.js';
import teams from './route/team.js';
import problems from './route/problem.js';
import submissions from './route/submission.js';
import judge from './route/judge.js';

const port = 3000;
const host = '0.0.0.0';
const app = express();

app.use(express.urlencoded({ extended: true, limit: '1024kb'}));
app.use(express.json({ limit: '1024kb' }));
app.use(cors());

// app.use('/passkey', passkeyRouter);
app.use('/judge', judge);
app.use('/login', login);
app.use('/contests', contest);
app.use('/teams', teams);
app.use('/problems', problems);
app.use('/submissions', submissions);

// error handling
app.use(errorMiddleware);

app.get('/ready', (req, res) => {
    res.status(200).send({ message: 'I am ready!' });
});

// 404
app.use((req, res) => {
    res.status(404).send({ message: 'I am sorry, but I think you are lost.' });
});

app.listen(port, host, () => {
    console.log(`Web Server running at http://${host}:${port}/`);
});

