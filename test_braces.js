const fs = require('fs');
const content = fs.readFileSync('components/ResumeBuilder.tsx', 'utf8');
const lines = content.split('\n');

let depth = 0;
for (let i = 0; i < 408; i++) {
  let line = lines[i];
  let opens = (line.match(/\{/g) || []).length;
  let closes = (line.match(/\}/g) || []).length;
  // Ignore braces in strings if possible, but let's just do a naive count for now.
  // Actually a naive count is fine because most are not in strings.
  depth += opens - closes;
}
console.log('Depth at line 408:', depth);
