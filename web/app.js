import express from 'express';
import mustacheExpress from 'mustache-express';
import cookieParser from 'cookie-parser';
import langMiddleware from './middleware/language.js';
import renderMiddleware from './middleware/render.js';

const port = 3000;
const host = '0.0.0.0';
const app = express();

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', import.meta.dirname + '/view/');

// language middleware
langMiddleware.init({
    languages: ['en', 'pt'],
    namespaces: [
        'index',
        'components',
        'dashboard',
        'problem',
        'common',
        'contest',
        'team',
        'notfound',
        'api',
    ],
})
app.use(langMiddleware.listen());

// render middleware, setting some variables to be used in all views
app.use(renderMiddleware({
    apiurl: process.env.LOCAL_SERVER === 'false' ? process.env.API : `${process.env.LOCAL_SERVER}:3030`,
    localServer: process.env.LOCAL_SERVER !== 'false',
    liveReload: process.env.LIVE_RELOAD,
}));

app.get('/', (req, res) => {
    res.templateRender('index', {
        googleClientId: process.env.GOOGLE_CLIENT_ID,
    });
});


// route for pdf generation (single problem)
// Params for generating custom header
//   header.title: title of the header
//   header.subtitle: subtitle of the header
//   custom-logo: custom logo to be used in the header. Can be a URL or base64 image
app.get('/problems/:hash/pdf', async (req, res) => {
    const blob = await fetch(`http://api:3000/problems/${req.params.hash}/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify({
            input: res.locals.t('input_samples', { ns: 'problem' }),
            output: res.locals.t('output_samples', { ns: 'problem' }),
            'header.title': req.query.t || '',
            'header.subtitle': req.query.s || '',
            'custom-logo': req.query.l || '',
            ...req.query,
        }),
    }).then(response => response.blob());
    const buffer = await blob.arrayBuffer();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(buffer));
});

// route for pdf generation (multiple problems)
// Params for generating custom header are the same as the single problem route
app.get('/problems/pdf', async (req, res) => {
    const problems = req.query.p.split(',');
    const blob = await fetch(`http://api:3000/problems/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify({
            problems,
            input: res.locals.t('input_samples', { ns: 'problem' }),
            output: res.locals.t('output_samples', { ns: 'problem' }),
            'header.title': req.query.t || '',
            'header.subtitle': req.query.s || '',
            'custom-logo': req.query.l || '',
            ...req.query,
        }),
    }).then(response => response.blob());
    const buffer = await blob.arrayBuffer();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(buffer));
});


const dashboardRoute = (req, res) => {
    res.templateRender('dashboard', {
        googleCredential: req.body.credential,
        problemHash: req.params.problem,
        contestId: req.params.contest,
        hashLength: process.env.HASH_LENGTH,
    });
}
// routes for dashboard (menu)
app.post('/dashboard', dashboardRoute);
app.get([
    '/dashboard',
    '/problems',
    '/problems/:problem',
    '/contests',
    '/contests/:contest',
], dashboardRoute);

// route for team. ask for team id and password
app.get([
    '/teams',
    '/teams/submissions',
    '/teams/contest',
    '/teams/problems',
    '/teams/problems/:problem',
    '/teams/:team',
], (req, res) => {
    res.templateRender('team', {
        teamId: req.params.team,
        problemHash: req.params.problem,
    });
});

// route for contest admin
app.get([
    '/contests/:contest/dashboard',
    '/contests/:contest/submissions',
    '/contests/:contest/problems',
    '/contests/:contest/teams',
], (req, res) => {
    res.templateRender('contest', {
        contestId: req.params.contest,
    });
});

// static assets
app.use(express.static(import.meta.dirname + '/public/'));

// 404
app.use((req, res) => {
    res.status(404).templateRender('notfound');
});

app.listen(port, host, () => {
    console.log(`Web Server running at http://${host}:${port}/`);
});