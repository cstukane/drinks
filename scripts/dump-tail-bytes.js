const fs = require('fs');
const path = process.argv[2] || 'js/app.js';
const n = parseInt(process.argv[3] || '128', 10);
const b = fs.readFileSync(path);
const len = b.length;
const start = Math.max(0, len - n);
let out = '';
for (let i = start; i < len; i++) out += b[i].toString(16).padStart(2, '0') + ' ';
console.log('len', len);
console.log(out);

