const input = require('fs').readFileSync('/dev/stdin', 'utf8').split(/\s/);

const a = parseInt(input.shift());
const b = parseInt(input.shift());

if (a > b)
    console.log(a);
else
    console.log(b);

