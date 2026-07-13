const fs = require('fs');
const ts = require('typescript');
const code = fs.readFileSync('components/ResumeBuilder.tsx', 'utf8');
const sourceFile = ts.createSourceFile('components/ResumeBuilder.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
// Just let TS parse it and see if it complains
const diagnostics = sourceFile.parseDiagnostics;
if (diagnostics && diagnostics.length > 0) {
    diagnostics.forEach(d => {
        const { line, character } = ts.getLineAndCharacterOfPosition(sourceFile, d.start);
        console.log(`Line ${line + 1}, char ${character + 1}: ${d.messageText}`);
    });
} else {
    console.log('No parse errors found by TS.');
}
