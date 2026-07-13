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
  if (node.kind === ts.SyntaxKind.JsxElement) {
    const opening = node.openingElement.tagName.getText();
    const closing = node.closingElement.tagName.getText();
    if (opening !== closing) {
       console.log(`Mismatch at line ${ts.getLineAndCharacterOfPosition(sourceFile, node.getStart()).line + 1}: <${opening}> closed by </${closing}>`);
    }
  }
  ts.forEachChild(node, getErrors);
}

getErrors(sourceFile);
