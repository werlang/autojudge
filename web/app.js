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
    apiurl: process.env.API,
    liveReload: process.env.LIVE_RELOAD,
}));

app.get('/', (req, res) => {
    res.templateRender('index', {
        googleClientId: process.env.GOOGLE_CLIENT_ID,
    });
});

const dashboardRoute = (req, res) => {
    res.templateRender('dashboard', {
        googleCredential: req.body.credential,
        problemHash: req.params.problem,
        contestId: req.params.contest,
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

const teamRoute = async (req, res) => {
    res.templateRender('team', {
        teamId: req.params.team,
        problemHash: req.params.problem,
    });
}
// route for team. ask for team id and password
app.get([
    '/teams',
    '/teams/submissions',
    '/teams/contest',
    '/teams/problems',
    '/teams/problems/:problem',
    '/teams/:team',
], teamRoute);

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

// TODO: add manual judge page
