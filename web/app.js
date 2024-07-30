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
        'contest'
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
    });
}
// routes for dashboard (menu)
app.post('/dashboard', dashboardRoute);
app.get([
    '/dashboard',
    '/problems',
    '/contests',
    '/teams',
], dashboardRoute);

// route for problem
app.get('/problems/:id', (req, res) => {
    res.templateRender('dashboard', {
        problemId: req.params.id,
    });
});

// static assets
app.use(express.static(import.meta.dirname + '/public/'));

// 404
app.use((req, res) => {
    res.status(404).render('notfound', {});
});

app.listen(port, host, () => {
    console.log(`Web Server running at http://${host}:${port}/`);
});
