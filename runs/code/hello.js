let input = require('fs').readFileSync('/dev/stdin', 'utf8');
let lines = input.split('\n');

const a = parseInt(lines[0]);
const b = parseInt(lines[1]);
console.log(`X = ${a + b}`);
