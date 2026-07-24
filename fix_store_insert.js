const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components/ResumeBuilder.tsx');
let code = fs.readFileSync(filePath, 'utf8');

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

if (!code.includes("const updateDoc = store.updateDocument;")) {
  code = code.replace(
    'export default function ResumeBuilder({ onBack, initialTemplateId }: { onBack?: () => void, initialTemplateId?: string }) {',
    'export default function ResumeBuilder({ onBack, initialTemplateId }: { onBack?: () => void, initialTemplateId?: string }) {\n' + storeInsert
  );
}

fs.writeFileSync(filePath, code);
