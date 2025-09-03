const fs = require('fs');
const acorn = require('acorn');

try {
  const code = fs.readFileSync('js/app.js', 'utf8');
  acorn.parse(code, { ecmaVersion: 2022, sourceType: 'module', locations: true });
  console.log('PARSE_OK');
} catch (e) {
  console.log('PARSE_ERR');
  console.log(String(e && e.message || e));
  if (e && e.loc) {
    console.log('line:' + e.loc.line);
    console.log('column:' + e.loc.column);
  }
}

