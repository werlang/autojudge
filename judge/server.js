import app from "./app.js";

const port = 3000;
const host = '0.0.0.0';

app.listen(port, host, () => {
    console.log(`Web Server running at http://${host}:${port}/`);
});