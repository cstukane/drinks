const fs = require('fs');
let s = fs.readFileSync('js/state/flows/drinkFlow.js','utf8');
s = s.replace(/^\s*import\b.*;\s*$/gm,'');
s = s.replace(/^\s*export\s+(?=function|const|let|var|class)/gm,'');
const lines = s.split(/\r?\n/);
for (let i=0; i<Math.min(lines.length, 40); i++) {
  console.log(String(i+1).padStart(4,' ')+': '+lines[i]);
}

