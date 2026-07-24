const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components/ResumeBuilder.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// We want to delete any line that is like `const canvasZoom = store.canvasZoom;`
// Except `const store = useResumeStore();`
const lines = code.split('\n');
const newLines = lines.filter(line => {
  const trimmed = line.trim();
  if (trimmed.startsWith('const ') && trimmed.includes(' = store.') && !trimmed.includes('useResumeStore')) {
    // Only delete it if it is a pure reassignment (e.g., `const name = store.name;`)
    const match = trimmed.match(/^const\s+([a-zA-Z0-9_]+)\s*=\s*store\.([a-zA-Z0-9_]+);$/);
    if (match) {
      if (match[1] === match[2]) {
        console.log("Removing duplicate:", trimmed);
        return false;
      }
    }
  }
  return true;
});

fs.writeFileSync(filePath, newLines.join('\n'));
