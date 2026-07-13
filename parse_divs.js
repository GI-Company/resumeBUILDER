const fs = require('fs');
const content = fs.readFileSync('patch_layout.js', 'utf8');
const newShell = content.split('const newShell = `')[1].split('`;')[0];
let stack = [];
let lines = newShell.split('\n');
for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let m;
    let openRegex = /<div/g;
    while((m = openRegex.exec(line)) !== null) { stack.push(`Line ${i + 1}: ${line.trim()}`); }
    let closeRegex = /<\/div>/g;
    while((m = closeRegex.exec(line)) !== null) { stack.pop(); }
}
console.log(stack);
