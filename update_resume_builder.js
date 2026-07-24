const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components/ResumeBuilder.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add import
if (!code.includes("import { useResumeStore } from '../lib/store/useResumeStore';")) {
  code = code.replace(
    'import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";',
    'import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";\nimport { useResumeStore } from "../lib/store/useResumeStore";'
  );
}

// 2. We need to insert the store usage at the top of the component
// The component starts at `export default function ResumeBuilder({ initialTemplateId = null }: { initialTemplateId?: string | null }) {`
const storeInsert = `
  const store = useResumeStore();

  // --- Shim Setters for Zustand ---
  const updateDoc = store.updateDocument;
  const updateUI = store.updateUI;
  const updateLayout = store.updateLayout;

  const setName = (v: any) => updateDoc({ name: typeof v === "function" ? v(store.name) : v });
  const setContactLine = (v: any) => updateDoc({ contactLine: typeof v === "function" ? v(store.contactLine) : v });
  const setSummary = (v: any) => updateDoc({ summary: typeof v === "function" ? v(store.summary) : v });
  const setFooter = (v: any) => updateDoc({ footer: typeof v === "function" ? v(store.footer) : v });
  const setExperiences = (v: any) => updateDoc({ experiences: typeof v === "function" ? v(store.experiences) : v });
  const setEducations = (v: any) => updateDoc({ educations: typeof v === "function" ? v(store.educations) : v });
  const setSkills = (v: any) => updateDoc({ skills: typeof v === "function" ? v(store.skills) : v });
  const setLicenses = (v: any) => updateDoc({ licenses: typeof v === "function" ? v(store.licenses) : v });
  const setProjects = (v: any) => updateDoc({ projects: typeof v === "function" ? v(store.projects) : v });
  const setPublications = (v: any) => updateDoc({ publications: typeof v === "function" ? v(store.publications) : v });
  const setAwards = (v: any) => updateDoc({ awards: typeof v === "function" ? v(store.awards) : v });
  const setProfilePhoto = (v: any) => updateDoc({ profilePhoto: typeof v === "function" ? v(store.profilePhoto) : v });
  const setDesign = (v: any) => updateDoc({ design: typeof v === "function" ? v(store.design) : v });
  const setSections = (v: any) => updateDoc({ sections: typeof v === "function" ? v(store.sections) : v });
  const setSectionHeaders = (v: any) => updateDoc({ sectionHeaders: typeof v === "function" ? v(store.sectionHeaders) : v });
  const setManualBreaks = (v: any) => updateDoc({ manualBreaks: typeof v === "function" ? v(store.manualBreaks) : v });

  const setCanvasZoom = (v: any) => updateUI({ canvasZoom: typeof v === "function" ? v(store.canvasZoom) : v });
  const setPrintPreviewMode = (v: any) => updateUI({ printPreviewMode: typeof v === "function" ? v(store.printPreviewMode) : v });
  const setShowMarginGuides = (v: any) => updateUI({ showMarginGuides: typeof v === "function" ? v(store.showMarginGuides) : v });
  const setShowHeatmapOverlay = (v: any) => updateUI({ showHeatmapOverlay: typeof v === "function" ? v(store.showHeatmapOverlay) : v });
  const setActiveSidebarTab = (v: any) => updateUI({ activeSidebarTab: typeof v === "function" ? v(store.activeSidebarTab) : v });
  const setSidebarWidth = (v: any) => updateUI({ sidebarWidth: typeof v === "function" ? v(store.sidebarWidth) : v });
  const setShowOnboarding = (v: any) => updateUI({ showOnboarding: typeof v === "function" ? v(store.showOnboarding) : v });
  const setAiPresetType = (v: any) => updateUI({ aiPresetType: typeof v === "function" ? v(store.aiPresetType) : v });
  const setAiAgentTab = (v: any) => updateUI({ aiAgentTab: typeof v === "function" ? v(store.aiAgentTab) : v });
  const setInterviewStep = (v: any) => updateUI({ interviewStep: typeof v === "function" ? v(store.interviewStep) : v });
  const setInterviewAnswers = (v: any) => updateUI({ interviewAnswers: typeof v === "function" ? v(store.interviewAnswers) : v });
  const setAgentMessages = (v: any) => updateUI({ agentMessages: typeof v === "function" ? v(store.agentMessages) : v });

  const setGapHeights = (v: any) => updateLayout({ gapHeights: typeof v === "function" ? v(store.gapHeights) : v });
  const setIdToPageMap = (v: any) => updateLayout({ idToPageMap: typeof v === "function" ? v(store.idToPageMap) : v });
  const setPageBreaks = (v: any) => updateLayout({ pageBreaks: typeof v === "function" ? v(store.pageBreaks) : v });
  const setPageBreakElementIds = (v: any) => updateLayout({ pageBreakElementIds: typeof v === "function" ? v(store.pageBreakElementIds) : v });

  const history = store.past;
  const setHistory = () => {};
  const historyIndex = store.past.length - 1;
  const setHistoryIndex = () => {};
`;

if (!code.includes("const store = useResumeStore();")) {
  code = code.replace(
    'export default function ResumeBuilder({ initialTemplateId = null }: { initialTemplateId?: string | null }) {',
    'export default function ResumeBuilder({ initialTemplateId = null }: { initialTemplateId?: string | null }) {\n' + storeInsert
  );
}

// We will use Regex to replace the definitions:
// e.g. `const [name, setName] = useState(...)` -> `const name = store.name;`
const mappings = [
  { key: 'name', regex: /const\s+\[name,\s+setName\]\s*=\s*useState\([^)]*\);/g },
  { key: 'contactLine', regex: /const\s+\[contactLine,\s+setContactLine\]\s*=\s*useState\([^)]*\n.*\n.*\n\s*\);/g },
  { key: 'summary', regex: /const\s+\[summary,\s+setSummary\]\s*=\s*useState\([^)]*\n.*\n\s*\);/g },
  { key: 'footer', regex: /const\s+\[footer,\s+setFooter\]\s*=\s*useState\([^)]*\);/g },
  { key: 'canvasZoom', regex: /const\s+\[canvasZoom,\s+setCanvasZoom\]\s*=\s*useState<number>\(100\);/g },
  { key: 'printPreviewMode', regex: /const\s+\[printPreviewMode,\s+setPrintPreviewMode\]\s*=\s*useState<boolean>\(false\);/g },
  { key: 'showMarginGuides', regex: /const\s+\[showMarginGuides,\s+setShowMarginGuides\]\s*=\s*useState<boolean>\(true\);/g },
  { key: 'showHeatmapOverlay', regex: /const\s+\[showHeatmapOverlay,\s+setShowHeatmapOverlay\]\s*=\s*useState<boolean>\(false\);/g },
  { key: 'design', regex: /const\s+\[design,\s+setDesign\]\s*=\s*useState<DesignConfig>\(\(\)\s*=>\s*\{[\s\S]*?\}\);/g },
  { key: 'profilePhoto', regex: /const\s+\[profilePhoto,\s+setProfilePhoto\]\s*=\s*useState<ProfilePhotoConfig>\(\(\)\s*=>\s*localDraft\?.profilePhoto\s*\?\?[\s\S]*?\}\);/g },
  { key: 'sections', regex: /const\s+\[sections,\s+setSections\]\s*=\s*useState<any\[\]>\(\(\)\s*=>\s*localDraft\?\.sections\s*\?\?[\s\S]*?\]\);/g },
  { key: 'manualBreaks', regex: /const\s+\[manualBreaks,\s+setManualBreaks\]\s*=\s*useState<Record<string,\s*boolean>>\(\(\)\s*=>\s*localDraft\?\.manualBreaks\s*\?\?\s*\{\}\);/g },
  { key: 'sectionHeaders', regex: /const\s+\[sectionHeaders,\s+setSectionHeaders\]\s*=\s*useState<Record<string,\s*string>>\(\(\)\s*=>\s*localDraft\?\.sectionHeaders\s*\?\?[\s\S]*?\}\);/g },
  { key: 'projects', regex: /const\s+\[projects,\s+setProjects\]\s*=\s*useState<any\[\]>\(\(\)\s*=>\s*localDraft\?\.projects\s*\?\?[\s\S]*?\]\);/g },
  { key: 'publications', regex: /const\s+\[publications,\s+setPublications\]\s*=\s*useState<any\[\]>\(\(\)\s*=>\s*localDraft\?\.publications\s*\?\?[\s\S]*?\]\);/g },
  { key: 'awards', regex: /const\s+\[awards,\s+setAwards\]\s*=\s*useState<any\[\]>\(\(\)\s*=>\s*localDraft\?\.awards\s*\?\?[\s\S]*?\]\);/g },
  { key: 'licenses', regex: /const\s+\[licenses,\s+setLicenses\]\s*=\s*useState<any\[\]>\(\(\)\s*=>\s*localDraft\?\.licenses\s*\?\?[\s\S]*?\]\);/g },
  { key: 'skills', regex: /const\s+\[skills,\s+setSkills\]\s*=\s*useState<any\[\]>\(\(\)\s*=>\s*localDraft\?\.skills\s*\?\?[\s\S]*?\]\);/g },
  { key: 'experiences', regex: /const\s+\[experiences,\s+setExperiences\]\s*=\s*useState<any\[\]>\(\(\)\s*=>\s*localDraft\?\.experiences\s*\?\?[\s\S]*?\]\);/g },
  { key: 'educations', regex: /const\s+\[educations,\s+setEducations\]\s*=\s*useState<any\[\]>\(\(\)\s*=>\s*localDraft\?\.educations\s*\?\?[\s\S]*?\]\);/g },
  { key: 'activeSidebarTab', regex: /const\s+\[activeSidebarTab,\s+setActiveSidebarTab\]\s*=\s*useState<string\s*\|\s*null>\(null\);/g },
  { key: 'sidebarWidth', regex: /const\s+\[sidebarWidth,\s+setSidebarWidth\]\s*=\s*useState<number>\(320\);/g },
  { key: 'showOnboarding', regex: /const\s+\[showOnboarding,\s+setShowOnboarding\]\s*=\s*useState<boolean>\(\(\)\s*=>\s*\{[\s\S]*?\}\);/g },
  { key: 'aiPresetType', regex: /const\s+\[aiPresetType,\s+setAiPresetType\]\s*=\s*useState<"summary"\s*\|\s*"bullets"\s*\|\s*"custom"\s*\|\s*"parser"\s*\|\s*"linkedin">\(.*?\);/g },
  { key: 'aiAgentTab', regex: /const\s+\[aiAgentTab,\s+setAiAgentTab\]\s*=\s*useState<"presets"\s*\|\s*"agent"\s*\|\s*"coverletter">\(.*?\);/g },
  { key: 'interviewStep', regex: /const\s+\[interviewStep,\s+setInterviewStep\]\s*=\s*useState<number>\(-1\);\s*\/\/.*?\n/g },
  { key: 'interviewAnswers', regex: /const\s+\[interviewAnswers,\s+setInterviewAnswers\]\s*=\s*useState<Record<string,\s*string>>\(\{\}\);/g },
  { key: 'agentMessages', regex: /const\s+\[agentMessages,\s+setAgentMessages\]\s*=\s*useState<Array<\{[\s\S]*?\}>>\([\s\S]*?\]\);/g },
  { key: 'gapHeights', regex: /const\s+\[gapHeights,\s+setGapHeights\]\s*=\s*useState<Record<string,\s*\{[\s\S]*?\}>>\(\{\}\);/g },
  { key: 'idToPageMap', regex: /const\s+\[idToPageMap,\s+setIdToPageMap\]\s*=\s*useState<Record<string,\s*number>>\(\{\}\);/g },
  { key: 'pageBreaks', regex: /const\s+\[pageBreaks,\s+setPageBreaks\]\s*=\s*useState<number\[\]>\(\[\]\);/g },
  { key: 'pageBreakElementIds', regex: /const\s+\[pageBreakElementIds,\s+setPageBreakElementIds\]\s*=\s*useState<string\[\]>\(\[\]\);/g },
  { key: 'history', regex: /const\s+\[history,\s+setHistory\]\s*=\s*useState<any\[\]>\(\[\]\);/g, replacement: '' },
  { key: 'historyIndex', regex: /const\s+\[historyIndex,\s+setHistoryIndex\]\s*=\s*useState<number>\(-1\);/g, replacement: '' }
];

for (const mapping of mappings) {
  if (mapping.replacement !== undefined) {
    code = code.replace(mapping.regex, mapping.replacement);
  } else {
    code = code.replace(mapping.regex, `const ${mapping.key} = store.${mapping.key};`);
  }
}

// Fix saveStateToHistory calls to use commitHistory
code = code.replace(/saveStateToHistory\(\);/g, 'store.commitHistory();');

fs.writeFileSync(filePath, code);
console.log("Migration script complete");
