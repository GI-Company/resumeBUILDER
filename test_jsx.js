const fs = require('fs');
const babel = require('@babel/core');
try {
  babel.transformSync(fs.readFileSync('components/ResumeBuilder.tsx', 'utf8'), {
    presets: ['@babel/preset-react', '@babel/preset-typescript'],
    filename: 'components/ResumeBuilder.tsx'
  });
  console.log("No syntax errors!");
} catch (e) {
  console.log(e.message);
}
