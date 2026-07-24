import re

with open('components/ResumeBuilder.tsx', 'r') as f:
    content = f.read()

# We need to find the block of state definitions from `const [dontShowTutorialAgain` 
# down to `const [pageBreakElementIds` and replace it.

start_marker = 'const [dontShowTutorialAgain, setDontShowTutorialAgain] = useState(() => {'
end_marker = 'const [pageBreakElementIds, setPageBreakElementIds] = useState<string[]>([]);'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker) + len(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find state block")
    exit(1)

shim_code = """
  const store = useResumeStore();

  // --- Map Zustand State to Local Variables ---
  const {
    name, contactLine, summary, experiences, educations, skills, licenses, projects, publications, awards, footer, profilePhoto, design, sections, sectionHeaders, manualBreaks,
    canvasZoom, printPreviewMode, showMarginGuides, showHeatmapOverlay, activeSidebarTab, sidebarWidth, showOnboarding, aiPresetType, aiAgentTab, interviewStep, interviewAnswers, agentMessages,
    gapHeights, idToPageMap, pageBreaks, pageBreakElementIds
  } = store;

  // --- Shim Setters to use Zustand ---
  const updateDoc = store.updateDocument;
  const updateUI = store.updateUI;
  const updateLayout = store.updateLayout;

  const setName = (v: any) => updateDoc({ name: typeof v === 'function' ? v(store.name) : v });
  const setContactLine = (v: any) => updateDoc({ contactLine: typeof v === 'function' ? v(store.contactLine) : v });
  const setSummary = (v: any) => updateDoc({ summary: typeof v === 'function' ? v(store.summary) : v });
  const setFooter = (v: any) => updateDoc({ footer: typeof v === 'function' ? v(store.footer) : v });
  const setExperiences = (v: any) => updateDoc({ experiences: typeof v === 'function' ? v(store.experiences) : v });
  const setEducations = (v: any) => updateDoc({ educations: typeof v === 'function' ? v(store.educations) : v });
  const setSkills = (v: any) => updateDoc({ skills: typeof v === 'function' ? v(store.skills) : v });
  const setLicenses = (v: any) => updateDoc({ licenses: typeof v === 'function' ? v(store.licenses) : v });
  const setProjects = (v: any) => updateDoc({ projects: typeof v === 'function' ? v(store.projects) : v });
  const setPublications = (v: any) => updateDoc({ publications: typeof v === 'function' ? v(store.publications) : v });
  const setAwards = (v: any) => updateDoc({ awards: typeof v === 'function' ? v(store.awards) : v });
  const setProfilePhoto = (v: any) => updateDoc({ profilePhoto: typeof v === 'function' ? v(store.profilePhoto) : v });
  const setDesign = (v: any) => updateDoc({ design: typeof v === 'function' ? v(store.design) : v });
  const setSections = (v: any) => updateDoc({ sections: typeof v === 'function' ? v(store.sections) : v });
  const setSectionHeaders = (v: any) => updateDoc({ sectionHeaders: typeof v === 'function' ? v(store.sectionHeaders) : v });
  const setManualBreaks = (v: any) => updateDoc({ manualBreaks: typeof v === 'function' ? v(store.manualBreaks) : v });

  const setCanvasZoom = (v: any) => updateUI({ canvasZoom: typeof v === 'function' ? v(store.canvasZoom) : v });
  const setPrintPreviewMode = (v: any) => updateUI({ printPreviewMode: typeof v === 'function' ? v(store.printPreviewMode) : v });
  const setShowMarginGuides = (v: any) => updateUI({ showMarginGuides: typeof v === 'function' ? v(store.showMarginGuides) : v });
  const setShowHeatmapOverlay = (v: any) => updateUI({ showHeatmapOverlay: typeof v === 'function' ? v(store.showHeatmapOverlay) : v });
  const setActiveSidebarTab = (v: any) => updateUI({ activeSidebarTab: typeof v === 'function' ? v(store.activeSidebarTab) : v });
  const setSidebarWidth = (v: any) => updateUI({ sidebarWidth: typeof v === 'function' ? v(store.sidebarWidth) : v });
  const setShowOnboarding = (v: any) => updateUI({ showOnboarding: typeof v === 'function' ? v(store.showOnboarding) : v });
  const setAiPresetType = (v: any) => updateUI({ aiPresetType: typeof v === 'function' ? v(store.aiPresetType) : v });
  const setAiAgentTab = (v: any) => updateUI({ aiAgentTab: typeof v === 'function' ? v(store.aiAgentTab) : v });
  const setInterviewStep = (v: any) => updateUI({ interviewStep: typeof v === 'function' ? v(store.interviewStep) : v });
  const setInterviewAnswers = (v: any) => updateUI({ interviewAnswers: typeof v === 'function' ? v(store.interviewAnswers) : v });
  const setAgentMessages = (v: any) => updateUI({ agentMessages: typeof v === 'function' ? v(store.agentMessages) : v });

  const setGapHeights = (v: any) => updateLayout({ gapHeights: typeof v === 'function' ? v(store.gapHeights) : v });
  const setIdToPageMap = (v: any) => updateLayout({ idToPageMap: typeof v === 'function' ? v(store.idToPageMap) : v });
  const setPageBreaks = (v: any) => updateLayout({ pageBreaks: typeof v === 'function' ? v(store.pageBreaks) : v });
  const setPageBreakElementIds = (v: any) => updateLayout({ pageBreakElementIds: typeof v === 'function' ? v(store.pageBreakElementIds) : v });

  // Expose undo/redo/commit for local functions
  const history = store.past;
  const historyIndex = store.past.length - 1;
  const undo = store.undo;
  const redo = store.redo;
  const commitHistory = store.commitHistory;

"""

# We also need to keep the non-store local state variables like `tutorialStep`, `designPanelOpen`, `pageDrawerOpen`, etc.
# Because I'm replacing the entire block, I need to append the remaining non-store state.

local_state_code = """
  // Local UI State (Not in Zustand)
  const [dontShowTutorialAgain, setDontShowTutorialAgain] = useState(() => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem("resume_tutorial_seen") || !!getCookie("resume_tutorial_seen");
    }
    return false;
  });
  const [tutorialStep, setTutorialStep] = useState(0);
  const [designPanelOpen, setDesignPanelOpen] = useState(false);
  const [pageDrawerOpen, setPageDrawerOpen] = useState(false);
  const [spellcheckEnabled, setSpellcheckEnabled] = useState(true);
  const [eraseModalOpen, setEraseModalOpen] = useState(false);
  const [bgRemoveSensitivity, setBgRemoveSensitivity] = useState(40);
  const [bgRemoveColor, setBgRemoveColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(20);
  const [aiRemaining, setAiRemaining] = useState<number | null>(5);
  const [showCapacityTip, setShowCapacityTip] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      let cid = localStorage.getItem("resume_client_id");
      if (!cid) {
        cid = "client_" + Math.random().toString(36).substring(2, 15);
        localStorage.setItem("resume_client_id", cid);
      }
      return cid;
    }
    return "";
  });
  const [user, setUser] = useState<any | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [resumesListOpen, setResumesListOpen] = useState(false);
  const [myResumes, setMyResumes] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormatBarMinimized, setIsFormatBarMinimized] = useState(false);
  const [isTopMenuMinimized, setIsTopMenuMinimized] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [saveResumeName, setSaveResumeName] = useState("My Resume");
  const [saveOverwriteId, setSaveOverwriteId] = useState<string | null>(null);
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  
  const [aiInput, setAiInput] = useState("");
  const [aiOutput, setAiOutput] = useState("");
  const [aiIsGenerating, setAiIsGenerating] = useState(false);
  
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [coverLetterJobDesc, setCoverLetterJobDesc] = useState("");
  const [coverLetterCompany, setCoverLetterCompany] = useState("");
  const [coverLetterRole, setCoverLetterRole] = useState("");
  const [coverLetterOutput, setCoverLetterOutput] = useState("");
  const [coverLetterIsGenerating, setCoverLetterIsGenerating] = useState(false);
  const [agentChatInput, setAgentChatInput] = useState("");
  const [isAgentResponding, setIsAgentResponding] = useState(false);
  
  const [atsScoreModalOpen, setAtsScoreModalOpen] = useState(false);
"""

# Wait, there's a bunch of functions inside the state block (like handlePhotoUpload, getCSSFilterString, atsHealthBreakdown, etc).
# This is too risky to replace in one giant chunk because I might delete those functions!
print("Too risky, skipping bulk replace. I will use a different strategy.")
