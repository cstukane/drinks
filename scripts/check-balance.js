const fs = require('fs');
const code = fs.readFileSync(process.argv[2] || 'js/app.js', 'utf8');

const stack = [];
let i = 0;
let line = 1, col = 0;
let mode = 'code'; // code | s_quote | d_quote | template | block_comment | line_comment
let tplDepth = 0; // number of nested ${...} inside template

function pos() { return { line, col }; }

while (i < code.length) {
  const ch = code[i];
  const next = code[i+1];
  if (ch === '\n') { line++; col = 0; i++; continue; } else { col++; }

  if (mode === 'code' || (mode === 'template' && tplDepth > 0)) {
    // handle comments
    if (ch === '/' && next === '*') { mode = 'block_comment'; i += 2; col++; continue; }
    if (ch === '/' && next === '/') { mode = 'line_comment'; i += 2; col++; continue; }
    // handle strings
    if (ch === '\'' && mode === 'code') { mode = 's_quote'; i++; continue; }
    if (ch === '"' && mode === 'code') { mode = 'd_quote'; i++; continue; }
    if (ch === '`' && mode === 'code') { mode = 'template'; tplDepth = 0; i++; continue; }
    // template expression starts
    if (mode === 'template' && ch === '$' && next === '{') { tplDepth++; i += 2; col++; continue; }
    // braces/paren/brackets
    if (ch === '{' || ch === '(' || ch === '[') stack.push({ ch, at: pos() });
    else if (ch === '}' || ch === ')' || ch === ']') {
      const top = stack.pop();
      const pairs = { '}': '{', ')': '(', ']': '[' };
      if (!top || top.ch !== pairs[ch]) {
        console.log('MISMATCH closing', ch, 'at', pos(), 'top was', top);
        process.exit(1);
      }
      if (mode === 'template' && ch === '}' && tplDepth > 0) {
        tplDepth--; // end of a ${...}
      }
    }
    i++;
    continue;
  }
  if (mode === 's_quote') {
    if (ch === '\\') { i += 2; col++; continue; }
    if (ch === '\'') { mode = 'code'; i++; continue; }
    i++;
    continue;
  }
  if (mode === 'd_quote') {
    if (ch === '\\') { i += 2; col++; continue; }
    if (ch === '"') { mode = 'code'; i++; continue; }
    i++;
    continue;
  }
  if (mode === 'template') {
    if (ch === '\\') { i += 2; col++; continue; }
    if (ch === '`' && tplDepth === 0) { mode = 'code'; i++; continue; }
    // ${ handled in code branch when tplDepth>0
    i++;
    continue;
  }
  if (mode === 'block_comment') {
    if (ch === '*' && next === '/') { mode = 'code'; i += 2; col++; continue; }
    i++;
    continue;
  }
  if (mode === 'line_comment') {
    if (ch === '\n') { mode = 'code'; }
    // newline already handled at loop top
    continue;
  }
}

if (stack.length) {
  console.log('UNCLOSED delimiters:', stack);
} else {
  console.log('Delimiters balanced');
}

