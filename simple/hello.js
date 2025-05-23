const input = require('fs').readFileSync('/dev/stdin', 'utf8').split(/\s/);

const a = parseInt(input.shift());
const b = parseInt(input.shift());

console.log(`X = ${a + b}`);

// Run with:
// ./autojudge.sh hello.js
