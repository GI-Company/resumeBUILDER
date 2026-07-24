import { create } from 'zustand';
import type { 
  DesignConfig, 
  Experience, 
  Education, 
  Skill, 
  License, 
  Project, 
  Publication, 
  Award, 
  SectionId,
  SectionHeaders
} from '../types';

// ============================================================
// State Shapes
// ============================================================

export interface DocumentState {
  name: string;
  contactLine: string;
  summary: string;
  footer: string;
  experiences: Experience[];
  educations: Education[];
  skills: Skill[];
  licenses: License[];
  projects: Project[];
  publications: Publication[];
  awards: Award[];
  profilePhoto: any; // Using any for now to match ProfilePhotoConfig from ResumeBuilder
  design: DesignConfig;
  sections: any[];
  sectionHeaders: SectionHeaders;
  manualBreaks: Record<string, boolean>;
}

export interface UIState {
  canvasZoom: number;
  printPreviewMode: boolean;
  showMarginGuides: boolean;
  showHeatmapOverlay: boolean;
  activeSidebarTab: string | null;
  sidebarWidth: number;
  showOnboarding: boolean;
  aiPresetType: string;
  aiAgentTab: string;
  interviewStep: number;
  interviewAnswers: Record<string, string>;
  agentMessages: Array<{ role: "user" | "assistant" | "system", content: string, actionExecuted?: string }>;
}

export interface LayoutState {
  gapHeights: Record<string, { total: number; top: number }>;
  idToPageMap: Record<string, number>;
  pageBreaks: number[];
  pageBreakElementIds: string[];
}

// The core data we want to track in our custom Undo/Redo stack
type HistorySnapshot = DocumentState;

// ============================================================
// Store Interface
// ============================================================

export interface ResumeStore extends DocumentState, UIState, LayoutState {
  // History
  past: HistorySnapshot[];
  future: HistorySnapshot[];

  // Actions - Document
  updateDocument: (partial: Partial<DocumentState>) => void;
  commitHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Actions - UI & Layout
  updateUI: (partial: Partial<UIState>) => void;
  updateLayout: (partial: Partial<LayoutState>) => void;
}

// ============================================================
// Store Implementation
// ============================================================

const initialDocumentState: DocumentState = {
  name: "",
  contactLine: "",
  summary: "",
  footer: "",
  experiences: [],
  educations: [],
  skills: [],
  licenses: [],
  projects: [],
  publications: [],
  awards: [],
  profilePhoto: {},
  design: {} as DesignConfig,
  sections: [],
  sectionHeaders: {},
  manualBreaks: {}
};

const initialUIState: UIState = {
  canvasZoom: 100,
  printPreviewMode: false,
  showMarginGuides: true,
  showHeatmapOverlay: false,
  activeSidebarTab: null,
  sidebarWidth: 320,
  showOnboarding: false,
  aiPresetType: "summary",
  aiAgentTab: "agent",
  interviewStep: -1,
  interviewAnswers: {},
  agentMessages: []
};

const initialLayoutState: LayoutState = {
  gapHeights: {},
  idToPageMap: {},
  pageBreaks: [],
  pageBreakElementIds: []
};

export const useResumeStore = create<ResumeStore>((set, get) => ({
  ...initialDocumentState,
  ...initialUIState,
  ...initialLayoutState,
  
  past: [],
  future: [],

  // Update document state WITHOUT pushing to history
  // Use this for keystrokes or streaming AI tokens
  updateDocument: (partial) => {
    set((state) => ({ ...state, ...partial }));
  },

  // Take a snapshot of the current document state and push it to `past`
  // Call this onBlur, onDragEnd, or after an AI stream completes.
  commitHistory: () => {
    set((state) => {
      const snapshot: HistorySnapshot = {
        name: state.name,
        contactLine: state.contactLine,
        summary: state.summary,
        footer: state.footer,
        experiences: state.experiences,
        educations: state.educations,
        skills: state.skills,
        licenses: state.licenses,
        projects: state.projects,
        publications: state.publications,
        awards: state.awards,
        profilePhoto: state.profilePhoto,
        design: state.design,
        sections: state.sections,
        sectionHeaders: state.sectionHeaders,
        manualBreaks: state.manualBreaks
      };

      return {
        past: [...state.past, snapshot],
        future: [] // Clear future when a new action is taken
      };
    });
  },

  undo: () => {
    set((state) => {
      if (state.past.length === 0) return state;

      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, state.past.length - 1);

      const currentSnapshot: HistorySnapshot = {
        name: state.name,
        contactLine: state.contactLine,
        summary: state.summary,
        footer: state.footer,
        experiences: state.experiences,
        educations: state.educations,
        skills: state.skills,
        licenses: state.licenses,
        projects: state.projects,
        publications: state.publications,
        awards: state.awards,
        profilePhoto: state.profilePhoto,
        design: state.design,
        sections: state.sections,
        sectionHeaders: state.sectionHeaders,
        manualBreaks: state.manualBreaks
      };

      return {
        ...previous,
        past: newPast,
        future: [currentSnapshot, ...state.future]
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.future.length === 0) return state;

      const next = state.future[0];
      const newFuture = state.future.slice(1);

      const currentSnapshot: HistorySnapshot = {
        name: state.name,
        contactLine: state.contactLine,
        summary: state.summary,
        footer: state.footer,
        experiences: state.experiences,
        educations: state.educations,
        skills: state.skills,
        licenses: state.licenses,
        projects: state.projects,
        publications: state.publications,
        awards: state.awards,
        profilePhoto: state.profilePhoto,
        design: state.design,
        sections: state.sections,
        sectionHeaders: state.sectionHeaders,
        manualBreaks: state.manualBreaks
      };

      return {
        ...next,
        past: [...state.past, currentSnapshot],
        future: newFuture
      };
    });
  },

  updateUI: (partial) => {
    set((state) => ({ ...state, ...partial }));
  },

  updateLayout: (partial) => {
    set((state) => ({ ...state, ...partial }));
  }
}));
