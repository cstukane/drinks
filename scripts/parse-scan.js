const fs = require('fs');
const path = process.argv[2];
if (!path) {
  console.error('Usage: node scripts/parse-scan.js <file.js>');
  process.exit(2);
}
let src = fs.readFileSync(path, 'utf8');
src = src.replace(/^\s*import\b.*;\s*$/gm, '');
src = src.replace(/^\s*export\s+(?=function|const|let|var|class)/gm, '');
const lines = src.split(/\r?\n/);
let lo = 1, hi = lines.length, ok = 0;
function canParse(upto) {
  const body = lines.slice(0, upto).join('\n');
  const code = '(function(){\n' + body + '\n})();';
  try { new Function(code); return true; } catch (e) { return false; }
}
while (lo <= hi) {
  const mid = Math.floor((lo + hi) / 2);
  if (canParse(mid)) { ok = mid; lo = mid + 1; } else { hi = mid - 1; }
}
console.log('Longest parseable prefix ends at line:', ok, 'of', lines.length);
if (ok < lines.length) {
  console.log('Next line that causes failure:', ok + 1);
  const ctxStart = Math.max(0, ok - 3);
  const ctxEnd = Math.min(lines.length, ok + 4);
  for (let i = ctxStart; i < ctxEnd; i++) {
    const ln = (i + 1).toString().padStart(4, ' ');
    console.log(ln + ': ' + lines[i]);
  }
  try { new Function('(function(){\n' + lines.slice(0, ok+1).join('\n') + '\n})();'); } catch(e){ console.log('Error:', e.message); console.log(String(e.stack||'').split('\n')[1]||''); }
}
