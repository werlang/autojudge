import express from 'express';
import mustacheExpress from 'mustache-express';

const port = 3000;
const host = '0.0.0.0';
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', import.meta.dirname + '/view/');

const formatTemplateVars = vars => ({ 'template-vars': JSON.stringify(vars) });

app.get('/', (req, res) => {
    res.render('index', formatTemplateVars({
        apiurl: process.env.API,
        googleClientId: process.env.GOOGLE_CLIENT_ID
    }));
});

app.post('/dashboard', (req, res) => {
    res.render('dashboard', formatTemplateVars({
        apiurl: process.env.API,
        authToken: req.body.credential
    }));
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
