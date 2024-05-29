const express = require('express');
const mustacheExpress = require('mustache-express');


const port = 3000;
const host = '0.0.0.0';
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', __dirname + '/view/');

app.get('/', (req, res) => {
    res.render('index', {
        apiurl: process.env.API
    });
});


// static assets
app.use(express.static(__dirname + '/public/'));


// 404
app.use((req, res) => {
    res.status(404).render('notfound', {});
});


app.listen(port, host, () => {
    console.log(`Web Server running at http://${host}:${port}/`);
});

