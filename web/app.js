import express from 'express';
import mustacheExpress from 'mustache-express';
import langMiddleware from './middleware/language.js';
import renderMiddleware from './middleware/render.js';

const port = 3000;
const host = '0.0.0.0';
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', import.meta.dirname + '/view/');

// language middleware
app.use(langMiddleware);

// render middleware
app.use(renderMiddleware);

app.get('/', (req, res) => {
    res.templateRender('index', {
        apiurl: process.env.API,
        googleClientId: process.env.GOOGLE_CLIENT_ID,
    },
    ['index']);
});

const dashboardRoute = (req, res) => {
    res.templateRender('dashboard', {
        apiurl: process.env.API,
        googleCredential: req.body.credential
    });
}
app.post('/dashboard', dashboardRoute);
app.get([
    '/dashboard',
    '/problems',
    '/contests',
    '/teams',
], dashboardRoute);


// static assets
app.use(express.static(import.meta.dirname + '/public/'));

// 404
app.use((req, res) => {
    res.status(404).render('notfound', {});
});

app.listen(port, host, () => {
    console.log(`Web Server running at http://${host}:${port}/`);
});
