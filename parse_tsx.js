const fs = require('fs');
const content = fs.readFileSync('components/ResumeBuilder.tsx', 'utf8');
let openCount = 0;
let closeCount = 0;
let regexOpen = /<[A-Za-z0-9_.-]+(?:\s+[^>]*?)?(?<!\/)>/g;
let regexClose = /<\/[A-Za-z0-9_.-]+>/g;

let m;
while((m = regexOpen.exec(content)) !== null) {
  openCount++;
}
while((m = regexClose.exec(content)) !== null) {
  closeCount++;
}
console.log(`Open: ${openCount}, Close: ${closeCount}`);
