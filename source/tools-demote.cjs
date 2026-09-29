/* one-off: move a question from the first pass to the refinement pass (tier 1 -> tier 2).
   Line based, because a registry entry is one line and its tier sits on that line. */
const fs = require('fs');
const path = process.argv[2] || 'questions.js';
const ids = process.argv.slice(3);
const lines = fs.readFileSync(path, 'utf8').split('\n');
let done = [];
for (const id of ids) {
  const head = "{ id: '" + id + "',";
  let hit = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trimStart().startsWith(head) && lines[i].includes('tier: 1')) { hit = i; break; }
  }
  if (hit < 0) { console.log('MISS', id); continue; }
  lines[hit] = lines[hit].replace('tier: 1', 'tier: 2');
  done.push(id);
}
fs.writeFileSync(path, lines.join('\n'));
console.log('demoted ' + done.length + ' of ' + ids.length + ': ' + done.join(', '));
