const { Project, SyntaxKind } = require("ts-morph");
const path = require("path");

const project = new Project();
const sourceFile = project.addSourceFileAtPath(path.join(__dirname, "components/ResumeBuilder.tsx"));

// The variables we want to migrate
const targetStates = new Set([
  'name', 'contactLine', 'summary', 'experiences', 'educations', 'skills', 'licenses', 
  'projects', 'publications', 'awards', 'footer', 'profilePhoto', 'design', 'sections', 
  'sectionHeaders', 'manualBreaks', 'canvasZoom', 'printPreviewMode', 'showMarginGuides', 
  'showHeatmapOverlay', 'activeSidebarTab', 'sidebarWidth', 'showOnboarding', 'aiPresetType', 
  'aiAgentTab', 'interviewStep', 'interviewAnswers', 'agentMessages', 'gapHeights', 
  'idToPageMap', 'pageBreaks', 'pageBreakElementIds', 'history', 'historyIndex'
]);

// Find the ResumeBuilder function component
const resumeBuilderFn = sourceFile.getFunction("ResumeBuilder");

if (resumeBuilderFn) {
  // Find all variable statements inside the function
  const varStatements = resumeBuilderFn.getVariableStatements();
  
  for (const varStmt of varStatements) {
    const decls = varStmt.getDeclarations();
    for (const decl of decls) {
      if (decl.getInitializer() && decl.getInitializer().getKind() === SyntaxKind.CallExpression) {
        const callExpr = decl.getInitializer();
        if (callExpr.getExpression().getText() === "useState") {
          // It's a useState call. Let's check the array binding pattern
          const nameNode = decl.getNameNode();
          if (nameNode.getKind() === SyntaxKind.ArrayBindingPattern) {
            const elements = nameNode.getElements();
            if (elements.length > 0) {
              const stateName = elements[0].getText();
              if (targetStates.has(stateName)) {
                // Remove this entire statement because we've shimmed it!
                console.log("Removing state declaration for:", stateName);
                varStmt.remove();
                break; // Move to next statement
              }
            }
          }
        }
      }
    }
  }
}

sourceFile.saveSync();
console.log("Done");
