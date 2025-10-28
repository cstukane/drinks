// Quick JS parse check using Function constructor
const fs = require('fs');
const path = process.argv[2];
if (!path) {
  console.error('Usage: node scripts/parse-check.js <file.js>');
  process.exit(2);
}
let src = fs.readFileSync(path, 'utf8');
// Strip simple ESM syntax for parsing
src = src.replace(/^\s*import\b.*;\s*$/gm, '');
src = src.replace(/^\s*export\s+(?=function|const|let|var|class)/gm, '');
try {
  // Note: This will not handle ES module syntax like import/export.
  // For our specific use we assume the file is plain functions.
  new Function(src);
  console.log('OK');
} catch (e) {
  console.log('ParseError:', e.message);
  // Try to extract line/column if present
  const m = /<anonymous>:(\d+):(\d+)/.exec(e.stack || '');
  if (m) {
    console.log('At line', m[1], 'column', m[2]);
    const lines = src.split(/\r?\n/);
    const lineNum = parseInt(m[1], 10);
    const context = lines.slice(Math.max(0, lineNum - 3), Math.min(lines.length, lineNum + 2));
    console.log('Context:\n' + context.join('\n'));
  }
  process.exit(1);
}
