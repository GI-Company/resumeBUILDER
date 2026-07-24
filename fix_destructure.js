const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components/ResumeBuilder.tsx');
let code = fs.readFileSync(filePath, 'utf8');

const destructure = `
  const {
    name, contactLine, summary, experiences, educations, skills, licenses, projects, publications, awards, footer, profilePhoto, design, sections, sectionHeaders, manualBreaks,
    canvasZoom, printPreviewMode, showMarginGuides, showHeatmapOverlay, activeSidebarTab, sidebarWidth, showOnboarding, aiPresetType, aiAgentTab, interviewStep, interviewAnswers, agentMessages,
    gapHeights, idToPageMap, pageBreaks, pageBreakElementIds
  } = store;
`;

if (!code.includes("const { name, contactLine, summary")) {
  code = code.replace(
    'const store = useResumeStore();',
    'const store = useResumeStore();\n' + destructure
  );
}

fs.writeFileSync(filePath, code);
console.log("Destructure injected.");
