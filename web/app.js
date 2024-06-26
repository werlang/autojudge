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
        apiurl: process.env.API
    }));
});

// Not in use
// app.get('/passkey', (req, res) => {
//     res.render('passkey', formatTemplateVars({
//         apiurl: process.env.API,
//     }));
// });

app.get('/test', (req, res) => {
    res.render('test', formatTemplateVars({
        apiurl: process.env.API,
        googleClientId: process.env.GOOGLE_CLIENT_ID
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
