const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components/ResumeBuilder.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// Replace any `setX(prev =>` or `setX((prev) =>` with `setX((prev: any) =>`
// It only applies to set functions for state
code = code.replace(/set([A-Z][a-zA-Z0-9]+)\(\s*\(?prev\)?\s*=>/g, 'set$1((prev: any) =>');
// And also `p =>` which is commonly used
code = code.replace(/set([A-Z][a-zA-Z0-9]+)\(\s*\(?p\)?\s*=>/g, 'set$1((p: any) =>');

fs.writeFileSync(filePath, code);
console.log("Replaced prev arguments with typed arguments");
