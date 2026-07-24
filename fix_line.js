const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components/ResumeBuilder.tsx');
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(
  'const interviewStep = store.interviewStep;  const interviewAnswers = store.interviewAnswers;',
  ''
);

fs.writeFileSync(filePath, code);
console.log("Fixed duplicate on line 1613");
