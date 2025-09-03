const fs = require('fs');
const path = process.argv[2] || 'js/app.js';
const line = parseInt(process.argv[3] || '1', 10);
const context = parseInt(process.argv[4] || '10', 10);
const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);
const start = Math.max(1, line - context);
const end = Math.min(lines.length, line + context);
for (let i = start; i <= end; i++) {
  const l = String(i).padStart(5, ' ');
  console.log(l + ': ' + lines[i - 1]);
}

