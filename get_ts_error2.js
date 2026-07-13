const ts = require("typescript");
const fs = require("fs");

const fileName = "components/ResumeBuilder.tsx";
const sourceCode = fs.readFileSync(fileName, "utf8");

const sourceFile = ts.createSourceFile(
  fileName,
  sourceCode,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX
);

function getErrors(node) {
  if (node.kind === ts.SyntaxKind.JsxElement || node.kind === ts.SyntaxKind.JsxFragment) {
    if (node.getEnd() === sourceFile.getEnd() || node.getEnd() === sourceFile.getEnd() - 1) {
       console.log(`Unclosed JSX element starting at line ${ts.getLineAndCharacterOfPosition(sourceFile, node.getStart()).line + 1}: ${node.getText().substring(0, 50)}...`);
    }
  }
  ts.forEachChild(node, getErrors);
}

getErrors(sourceFile);
