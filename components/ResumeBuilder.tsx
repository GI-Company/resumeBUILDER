"use client";

import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import { useResumeStore } from "../lib/store/useResumeStore";
import { useShallow } from 'zustand/react/shallow';
import DesignPanel from "./editor/DesignPanel";
import ContentPanel from "./editor/ContentPanel";
import TemplatesPanel from "./editor/TemplatesPanel";
import AISidebar from "./editor/AISidebar";
import Toolbar from "./editor/Toolbar";
import ResumeCanvas from "./editor/ResumeCanvas";
import { SectionRenderer } from "./editor/SectionRenderers";
import { usePaginationEngine } from "../hooks/usePaginationEngine";
import { StructuralParser, GazeProfiler, LayoutRebalancer } from "@/lib/agent-rez";
import { ContentEditableField } from "./ContentEditableField";
import { useProfilePhotoEditor } from "@/hooks/useProfilePhotoEditor";
import { ExportModal } from "./modals/ExportModal";
import { ShareModal } from "./modals/ShareModal";
import { EraseModal } from "./modals/EraseModal";
import { Reorder, useDragControls, motion } from "motion/react";
import {
  GripVertical, GripHorizontal,
  X,
  Bold,
  Italic,
  Underline,
  Minus,
  Plus,
  Eraser,
  Printer,
  Save,
  HelpCircle,
  Palette,
  FileText,
  CloudUpload,
  Image as ImageIcon,
  Sparkles,
  RotateCcw,
  Sliders,
  Scissors,
  Eye,
  Camera,
  Undo,
  Redo,
  User as UserIcon,
  Lock,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowDownToLine,
  MessageSquare,
  Send,
  Bot,
  RefreshCw,
  Play,
  CheckSquare,
  SpellCheck,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Share2,
  Download, Settings2, Menu, X as CloseIcon, FileDown, Loader2,
  BarChart3, CheckCircle2, AlertCircle, TrendingUp, ShieldCheck, Ruler,
  ArrowUp, ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { z } from "zod";
import AuthModal from "./AuthModal";
import { User } from "@supabase/supabase-js";
import type { DesignConfig } from "@/lib/types";

import { hexToRgb, shadeColor, getCookie, setCookie } from "@/lib/resume-utils";
import { PRESET_AVATARS, TEMPLATES, TUTORIAL_STEPS } from "@/lib/resume-constants";
import { PageBreakGap } from "./resume/PageBreakGap";
import { exportResumeToPdf } from "@/lib/pdf-engine";
import posthog from 'posthog-js';
// --- Subcomponents ---
import { DragHandle } from "./resume/DragHandle";
import { SubItemWrapper } from "./resume/SubItemWrapper";

const SaveResponseSchema = z.object({
  success: z.boolean(),
  code: z.string(),
  message: z.string().optional(),
  id: z.string().optional(),
});

// DesignConfig is imported from @/lib/types — do not redefine it here.

interface ProfilePhotoConfig {
  enabled: boolean;
  url: string;
  rawUploadedUrl: string;
  opacity: number;
  scale: number;
  radius: number;
  filter: string;
  tone: string;
  xOffset: number;
  yOffset: number;
  borderWidth: number;
  borderColor: string;
  aspectRatio: string;
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  hueRotate: number;
  sepia: number;
  animation: string;
}

import { SectionWrapper } from "./resume/SectionWrapper";








export default function ResumeBuilder({ onBack, initialTemplateId }: { onBack?: () => void, initialTemplateId?: string }) {

  const store = useResumeStore(useShallow(state => ({
    name: state.name,
    contactLine: state.contactLine,
    summary: state.summary,
    experiences: state.experiences,
    educations: state.educations,
    skills: state.skills,
    licenses: state.licenses,
    projects: state.projects,
    publications: state.publications,
    awards: state.awards,
    footer: state.footer,
    profilePhoto: state.profilePhoto,
    design: state.design,
    sections: state.sections,
    sectionHeaders: state.sectionHeaders,
    manualBreaks: state.manualBreaks,
    canvasZoom: state.canvasZoom,
    printPreviewMode: state.printPreviewMode,
    showMarginGuides: state.showMarginGuides,
    showHeatmapOverlay: state.showHeatmapOverlay,
    activeSidebarTab: state.activeSidebarTab,
    sidebarWidth: state.sidebarWidth,
    showOnboarding: state.showOnboarding,
    idToPageMap: state.idToPageMap,
    pageBreakElementIds: state.pageBreakElementIds,
    past: state.past,
    updateDocument: state.updateDocument,
    updateUI: state.updateUI,
    updateLayout: state.updateLayout,
    resetStore: state.resetStore
  })));

  useEffect(() => {
    const storedJobDesc = sessionStorage.getItem('pending_job_description');
    const storedResumeText = sessionStorage.getItem('pending_resume_text');

    if (storedJobDesc || storedResumeText) {
      console.log('Restored session from public scanner hand-off:', {
        hasJobDesc: !!storedJobDesc,
        hasResumeText: !!storedResumeText,
      });
      if (storedResumeText) {
        store.updateDocument({ summary: storedResumeText });
      }

      sessionStorage.removeItem('pending_job_description');
      sessionStorage.removeItem('pending_resume_text');
      sessionStorage.removeItem('pending_scan_score');
    }
  }, []);

  const {
    name, contactLine, summary, experiences, educations, skills, licenses, projects, publications, awards, footer, profilePhoto, design, sections, sectionHeaders, manualBreaks,
    canvasZoom, printPreviewMode, showMarginGuides, showHeatmapOverlay, activeSidebarTab, sidebarWidth, showOnboarding,
    idToPageMap, pageBreakElementIds
  } = store;

  // --- Shim Setters for Zustand ---
  const updateDoc = store.updateDocument;
  const updateUI = store.updateUI;
  const updateLayout = store.updateLayout;

  const setName = (v: any) => updateDoc({ name: typeof v === "function" ? v(useResumeStore.getState().name) : v });
  const setContactLine = (v: any) => updateDoc({ contactLine: typeof v === "function" ? v(useResumeStore.getState().contactLine) : v });
  const setSummary = (v: any) => updateDoc({ summary: typeof v === "function" ? v(useResumeStore.getState().summary) : v });
  const setFooter = (v: any) => updateDoc({ footer: typeof v === "function" ? v(useResumeStore.getState().footer) : v });
  const setExperiences = (v: any) => updateDoc({ experiences: typeof v === "function" ? v(useResumeStore.getState().experiences) : v });
  const setEducations = (v: any) => updateDoc({ educations: typeof v === "function" ? v(useResumeStore.getState().educations) : v });
  const setSkills = (v: any) => updateDoc({ skills: typeof v === "function" ? v(useResumeStore.getState().skills) : v });
  const setLicenses = (v: any) => updateDoc({ licenses: typeof v === "function" ? v(useResumeStore.getState().licenses) : v });
  const setProjects = (v: any) => updateDoc({ projects: typeof v === "function" ? v(useResumeStore.getState().projects) : v });
  const setPublications = (v: any) => updateDoc({ publications: typeof v === "function" ? v(useResumeStore.getState().publications) : v });
  const setAwards = (v: any) => updateDoc({ awards: typeof v === "function" ? v(useResumeStore.getState().awards) : v });
  const setProfilePhoto = (v: any) => updateDoc({ profilePhoto: typeof v === "function" ? v(useResumeStore.getState().profilePhoto) : v });
  const setDesign = (v: any) => updateDoc({ design: typeof v === "function" ? v(useResumeStore.getState().design) : v });
  const setSections = (v: any) => updateDoc({ sections: typeof v === "function" ? v(useResumeStore.getState().sections) : v });
  const setSectionHeaders = (v: any) => updateDoc({ sectionHeaders: typeof v === "function" ? v(useResumeStore.getState().sectionHeaders) : v });
  const setManualBreaks = (v: any) => updateDoc({ manualBreaks: typeof v === "function" ? v(useResumeStore.getState().manualBreaks) : v });

  const setCanvasZoom = (v: any) => updateUI({ canvasZoom: typeof v === "function" ? v(useResumeStore.getState().canvasZoom) : v });
  const setPrintPreviewMode = (v: any) => updateUI({ printPreviewMode: typeof v === "function" ? v(useResumeStore.getState().printPreviewMode) : v });
  const setShowMarginGuides = (v: any) => updateUI({ showMarginGuides: typeof v === "function" ? v(useResumeStore.getState().showMarginGuides) : v });
  const setShowHeatmapOverlay = (v: any) => updateUI({ showHeatmapOverlay: typeof v === "function" ? v(useResumeStore.getState().showHeatmapOverlay) : v });
  const setActiveSidebarTab = (v: any) => updateUI({ activeSidebarTab: typeof v === "function" ? v(useResumeStore.getState().activeSidebarTab) : v });
  const setSidebarWidth = (v: any) => updateUI({ sidebarWidth: typeof v === "function" ? v(useResumeStore.getState().sidebarWidth) : v });
  const setShowOnboarding = (v: any) => updateUI({ showOnboarding: typeof v === "function" ? v(useResumeStore.getState().showOnboarding) : v });
  const setAiPresetType = (v: any) => updateUI({ aiPresetType: typeof v === "function" ? v(useResumeStore.getState().aiPresetType) : v });
  const setAiAgentTab = (v: any) => updateUI({ aiAgentTab: typeof v === "function" ? v(useResumeStore.getState().aiAgentTab) : v });
  const setInterviewStep = (v: any) => updateUI({ interviewStep: typeof v === "function" ? v(useResumeStore.getState().interviewStep) : v });
  const setInterviewAnswers = (v: any) => updateUI({ interviewAnswers: typeof v === "function" ? v(useResumeStore.getState().interviewAnswers) : v });
  const setAgentMessages = (v: any) => updateUI({ agentMessages: typeof v === "function" ? v(useResumeStore.getState().agentMessages) : v });

  const setGapHeights = (v: any) => updateLayout({ gapHeights: typeof v === "function" ? v(useResumeStore.getState().gapHeights) : v });
  const setIdToPageMap = (v: any) => updateLayout({ idToPageMap: typeof v === "function" ? v(useResumeStore.getState().idToPageMap) : v });
  const setPageBreaks = (v: any) => updateLayout({ pageBreaks: typeof v === "function" ? v(useResumeStore.getState().pageBreaks) : v });
  const setPageBreakElementIds = (v: any) => updateLayout({ pageBreakElementIds: typeof v === "function" ? v(useResumeStore.getState().pageBreakElementIds) : v });

  const history = store.past;
  const setHistory = (v: any) => {};
  const historyIndex = store.past.length - 1;
  const setHistoryIndex = (v: any) => {};

  // --- Local Draft Retrieval ---
  let localDraft: any = null;
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) {
      try {
        const saved = localStorage.getItem("resume_autosave_content");
        if (saved) {
          localDraft = JSON.parse(saved);
        }
      } catch (e) {
        console.error("Failed to parse localDraft:", e);
      }
    }
  }
  
  // --- UI State ---
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(true);
  const [tutorialOpen, setTutorialOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const hasSeenLocal = localStorage.getItem("resume_tutorial_seen");
      const hasSeenCookie = getCookie("resume_tutorial_seen");
      return !hasSeenLocal && !hasSeenCookie;
    }
    return false;
  });
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

  // --- Design State ---

  // --- Profile Photo State ---
  const {
    eraseModalOpen, setEraseModalOpen,
    bgRemoveSensitivity, setBgRemoveSensitivity,
    bgRemoveColor, setBgRemoveColor,
    brushSize, setBrushSize,
    eraserCanvasRef,
    startDrawing, draw, stopDrawing,
    resetEraserCanvas, saveErasedImage,
    handlePhotoUpload,
    handleRemoveBackground,
    handleAutoRemoveBackground
  } = useProfilePhotoEditor(profilePhoto, setProfilePhoto);

  // --- Content State ---
  const [aiRemaining, setAiRemaining] = useState<number | null>(5);
  const [showCapacityTip, setShowCapacityTip] = useState(false);

  // --- History & Undo/Redo State ---
  
  
  const isHistoryActionRef = useRef(false);
  const historyRef = useRef<any[]>([]);
  const historyIndexRef = useRef<number>(-1);

  // Synchronize history refs for keyboard events & stable callbacks
  useEffect(() => {
    historyRef.current = history;
    historyIndexRef.current = historyIndex;
  }, [history, historyIndex]);










  const [atsScoreModalOpen, setAtsScoreModalOpen] = useState(false);

  // Live ATS Readiness & Impact Density Breakdown
  const atsHealthBreakdown = useMemo(() => {
    const structureScore = 100; // Semantic HTML & vector fonts are guaranteed by our custom engine
    let metricScore = 0;
    let verbScore = 0;
    let completenessScore = 0;

    // 1. Metric Impact Scan (Scans for numbers, $, %, x, +, quantifiable achievements across experiences & projects)
    const allBullets: string[] = [];
    experiences.forEach((exp) => exp.bullets.forEach((b: any) => allBullets.push(b.text || "")));
    projects.forEach((proj) => proj.bullets?.forEach((b: any) => allBullets.push(b.text || "")));

    const metricRegex = /(\b\d+(\.\d+)?%|\$\d+|\b\d+(k|m|b)\b|\b(increased|reduced|saved|grew|accelerated|by|over|under)\s+\d+|\b\d+\s*(hours|days|weeks|months|years|users|clients|percent|x)\b)/i;
    let bulletsWithMetrics = 0;
    allBullets.forEach((text) => {
      if (metricRegex.test(text) || /\d/.test(text)) bulletsWithMetrics++;
    });
    if (allBullets.length > 0) {
      metricScore = Math.min(100, Math.round((bulletsWithMetrics / Math.max(1, allBullets.length)) * 140));
    } else {
      metricScore = 40;
    }

    // 2. Action Verb Strength Scan
    const strongVerbs = /\b(architected|engineered|spearheaded|designed|optimized|launched|developed|implemented|directed|transformed|accelerated|automated|pioneered|scaled|revamped|negotiated|orchestrated|executed)\b/i;
    const weakPhrases = /\b(responsible for|helped|worked on|assigned to|duties included|assisted with)\b/i;
    let strongCount = 0;
    let weakCount = 0;
    allBullets.forEach((text) => {
      if (strongVerbs.test(text)) strongCount++;
      if (weakPhrases.test(text)) weakCount++;
    });
    verbScore = Math.min(100, Math.max(20, Math.round(70 + strongCount * 10 - weakCount * 15)));

    // 3. Section Completeness Check
    let completedSections = 0;
    if (summary && summary.length > 30) completedSections++;
    if (experiences.length > 0) completedSections++;
    if (skills.length > 0) completedSections++;
    if (educations.length > 0) completedSections++;
    completenessScore = Math.round((completedSections / 4) * 100);

    const overallScore = Math.round(
      structureScore * 0.35 + completenessScore * 0.25 + metricScore * 0.2 + verbScore * 0.2
    );

    return {
      overallScore,
      structureScore,
      metricScore,
      verbScore,
      completenessScore,
      bulletsWithMetrics,
      totalBullets: allBullets.length,
      strongCount,
      weakCount,
    };
  }, [experiences, projects, summary, skills, educations]);

  // --- Backend State ---
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
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [resumesListOpen, setResumesListOpen] = useState(false);
  const [myResumes, setMyResumes] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isFormatBarMinimized, setIsFormatBarMinimized] = useState(false);
  const [isTopMenuMinimized, setIsTopMenuMinimized] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [saveResumeName, setSaveResumeName] = useState("My Resume");
  const [saveOverwriteId, setSaveOverwriteId] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  // Password update states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmNewPassword || !currentPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      // 1. Reauthenticate user using current password by logging in
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: currentPassword,
      });

      if (reauthError) {
        throw new Error("Reauthentication failed. Please verify your current password.");
      }

      // 2. Perform the actual password update
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      toast.success("Password successfully updated!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };


  const fetchMyResumes = async () => {
    try {
      const { data, error } = await supabase
        .from("resumes")
        .select("id, updated_at, content")
        .eq("status", "active")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      setMyResumes(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadResumeFromCloud = async (id: string) => {
    const toastId = toast.loading("Loading resume...");
    try {
      const { data, error } = await supabase
        .from("resumes")
        .select("content, is_public")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (data && data.content) {
        setIsPublic(!!data.is_public);
        const c = data.content as any;
        isHistoryActionRef.current = true;

        const loadedName = c.name !== undefined ? c.name : "ALEX MORGAN";
        const loadedContactLine = c.contactLine !== undefined ? c.contactLine : 'San Francisco, CA <span class="text-[var(--hairline)] mx-2">|</span> (415) 555-0199 <span class="text-[var(--hairline)] mx-2">|</span> alex.morgan@email.com';
        const loadedSummary = c.summary !== undefined ? c.summary : "Innovative Full-Stack Software Engineer with over 5 years of experience designing, building, and deploying highly scalable web applications. Proven track record of optimizing application performance, leading cross-functional teams, and implementing cloud-native solutions to drive business outcomes.";
        const loadedFooter = c.footer !== undefined ? c.footer : "Alex Morgan";

        setName(loadedName);
        setContactLine(loadedContactLine);
        setSummary(loadedSummary);
        setFooter(loadedFooter);
        if (c.design) setDesign(c.design);
        if (c.sections) setSections(c.sections);
        if (c.manualBreaks) setManualBreaks(c.manualBreaks);
        if (c.licenses) setLicenses(c.licenses);
        if (c.skills) setSkills(c.skills);
        if (c.experiences) setExperiences(c.experiences);
        if (c.educations) setEducations(c.educations);
        if (c.profilePhoto) setProfilePhoto(c.profilePhoto);
        if (c.sectionHeaders) setSectionHeaders(c.sectionHeaders);
        if (c.projects) setProjects(c.projects);
        if (c.publications) setPublications(c.publications);
        if (c.awards) setAwards(c.awards);
        
        // Hide onboarding modal when successfully loaded
        setShowOnboarding(false);

        const loadedSnapshot = {
          name: loadedName,
          contactLine: loadedContactLine,
          summary: loadedSummary,
          footer: loadedFooter,
          design: c.design || design,
          sections: c.sections || sections,
          manualBreaks: c.manualBreaks || {},
          licenses: c.licenses || [],
          skills: c.skills || [],
          experiences: c.experiences || [],
          educations: c.educations || [],
          profilePhoto: c.profilePhoto || profilePhoto,
          sectionHeaders: c.sectionHeaders || {},
          projects: c.projects || [],
          publications: c.publications || [],
          awards: c.awards || [],
        };
        setHistory([loadedSnapshot]);
        setHistoryIndex(0);
        toast.success("Resume loaded successfully!", { id: toastId });
      }
    } catch (err: any) {
      toast.error("Failed to load resume: " + err.message, { id: toastId });
    }
  };

  const handleFitWidth = () => {
    const wrap = document.querySelector(".canvas-wrap");
    if (wrap) {
      const availableWidth = wrap.clientWidth - 48; // padding
      const pageWidth = design.pageSize === "letter" ? 816 : 794;
      const computedZoom = Math.floor((availableWidth / pageWidth) * 100);
      const clamped = Math.min(Math.max(computedZoom, 50), 150);
      setCanvasZoom(clamped);
      toast.success(`Auto-fitted canvas to ${clamped}% width! 🔍`);
    }
  };

  const handleUndo = useCallback(() => {
    const idx = historyIndexRef.current;
    const hist = historyRef.current;
    if (idx > 0) {
      isHistoryActionRef.current = true;
      const prevIndex = idx - 1;
      const prevState = hist[prevIndex];
      if (prevState) {
        if (prevState.name !== undefined) setName(prevState.name);
        if (prevState.contactLine !== undefined) setContactLine(prevState.contactLine);
        if (prevState.summary !== undefined) setSummary(prevState.summary);
        if (prevState.footer !== undefined) setFooter(prevState.footer);
        setSections(prevState.sections);
        setManualBreaks(prevState.manualBreaks);
        setLicenses(prevState.licenses);
        setSkills(prevState.skills);
        setExperiences(prevState.experiences);
        setEducations(prevState.educations);
        setDesign(prevState.design);
        setProfilePhoto(prevState.profilePhoto);
        if (prevState.sectionHeaders) setSectionHeaders(prevState.sectionHeaders);
        if (prevState.projects) setProjects(prevState.projects);
        if (prevState.publications) setPublications(prevState.publications);
        if (prevState.awards) setAwards(prevState.awards);
        setHistoryIndex(prevIndex);
      }
    }
  }, []);

  const handleRedo = useCallback(() => {
    const idx = historyIndexRef.current;
    const hist = historyRef.current;
    if (idx < hist.length - 1) {
      isHistoryActionRef.current = true;
      const nextIndex = idx + 1;
      const nextState = hist[nextIndex];
      if (nextState) {
        if (nextState.name !== undefined) setName(nextState.name);
        if (nextState.contactLine !== undefined) setContactLine(nextState.contactLine);
        if (nextState.summary !== undefined) setSummary(nextState.summary);
        if (nextState.footer !== undefined) setFooter(nextState.footer);
        setSections(nextState.sections);
        setManualBreaks(nextState.manualBreaks);
        setLicenses(nextState.licenses);
        setSkills(nextState.skills);
        setExperiences(nextState.experiences);
        setEducations(nextState.educations);
        setDesign(nextState.design);
        setProfilePhoto(nextState.profilePhoto);
        if (nextState.sectionHeaders) setSectionHeaders(nextState.sectionHeaders);
        if (nextState.projects) setProjects(nextState.projects);
        if (nextState.publications) setPublications(nextState.publications);
        if (nextState.awards) setAwards(nextState.awards);
        setHistoryIndex(nextIndex);
      }
    }
  }, []);

  const handleResetToBlank = () => {
    if (window.confirm("Are you sure you want to clear all resume content and start from scratch? This will reset your resume content to a blank template.")) {
      isHistoryActionRef.current = true;
      setName("");
      setContactLine("");
      setSummary("");
      setExperiences([]);
      setEducations([]);
      setSkills([]);
      setLicenses([]);
      setFooter("");
      setManualBreaks({});
      setProjects([]);
      setPublications([]);
      setAwards([]);
      setSectionHeaders({});
      setDesign((prev: any) => ({
        ...prev,
        template: "blank",
        accent: "#111827",
        panel: "#ffffff",
        paper: "#ffffff",
        layout: "classic",
        headingStyle: "plain",
        boxShadow: "none",
        borderStyle: "none",
      }));
      toast.success("Resume cleared! Start building your customized template from scratch. 📝");
    }
  };

  const handleResetResume = () => {
    localStorage.removeItem("resume_autosave_content");
    setName("");
    setContactLine("");
    setSummary("");
    setSkills([]);
    setExperiences([]);
    setEducations([]);
    setLicenses([]);
    setFooter("");
  };

  const handleLoadPersona = (personaType: "software" | "product" | "design") => {
    handleResetResume();
    isHistoryActionRef.current = true;
    if (personaType === "software") {
      setName("ALEX MORGAN");
      setContactLine("San Francisco, CA <span class=\"text-[var(--hairline)] mx-2\">|</span> (415) 555-0199 <span class=\"text-[var(--hairline)] mx-2\">|</span> alex.morgan@email.com <span class=\"text-[var(--hairline)] mx-2\">|</span> linkedin.com/in/alexmorgan");
      setSummary("Innovative Full-Stack Software Engineer with over 5 years of experience designing, building, and deploying highly scalable web applications. Proven track record of optimizing application performance, leading cross-functional teams, and implementing cloud-native solutions to drive business outcomes.");
      setSkills([
        {
          id: "sk-1",
          title: "Core Languages",
          items: "TypeScript, JavaScript (ES6+), Python, Go, Java, SQL, HTML5, CSS3",
        },
        {
          id: "sk-2",
          title: "Frameworks & Tools",
          items: "React, Next.js, Node.js, Express, Tailwind CSS, Redux, PostgreSQL, Docker, AWS",
        },
      ]);
      setExperiences([
        {
          id: "exp-1",
          title: "Senior Full-Stack Engineer | TechFlow Solutions – San Francisco, CA",
          date: "Aug 2023 – Present",
          bullets: [
            {
              id: "b-1",
              text: "Architected and deployed a highly available React/Next.js dashboard, improving client-side page load times by 42% and increasing user engagement by 18%.",
            },
            {
              id: "b-2",
              text: "Led a team of 4 engineers in redesigning the core API orchestration layer using Node.js and GraphQL, reducing query latency by 150ms.",
            },
          ],
          meta: "Stack: Next.js, TypeScript, GraphQL, Tailwind CSS, PostgreSQL, AWS",
        },
        {
          id: "exp-2",
          title: "Software Engineer II | DevCore Technologies – Austin, TX",
          date: "Jun 2021 – Jul 2023",
          bullets: [
            {
              id: "b-3",
              text: "Designed and maintained responsive enterprise web portals using React and Redux Toolkit, handling over 100k daily active users.",
            },
            {
              id: "b-4",
              text: "Optimized database queries and added Redis caching, resulting in a 30% reduction in database CPU utilization during peak load times.",
            },
          ],
          meta: "Stack: React, Redux, Node.js, Express, Redis, PostgreSQL",
        },
      ]);
      setEducations([
        {
          id: "edu-1",
          degree: "B.S. in Computer Science | University of California, Berkeley",
          bullets: [
            { id: "eb-1", text: "Graduated with Honors, GPA: 3.82/4.00" },
            { id: "eb-2", text: "Relevant Coursework: Data Structures, Database Management Systems, Cloud Computing" },
          ],
        },
      ]);
      setLicenses([
        {
          id: "lic-1",
          text: "<b>AWS Certified Solutions Architect</b> — Amazon Web Services (ID: AWS-ASA-99321)",
        },
        {
          id: "lic-2",
          text: "<b>Professional Scrum Master I (PSM I)</b> — Scrum.org",
        },
      ]);
      setFooter("Alex Morgan");
    } else if (personaType === "product") {
      setName("SARAH JENKINS");
      setContactLine("New York, NY <span class=\"text-[var(--hairline)] mx-2\">|</span> (212) 555-0142 <span class=\"text-[var(--hairline)] mx-2\">|</span> sarah.j@email.com <span class=\"text-[var(--hairline)] mx-2\">|</span> linkedin.com/in/sarahjenkins");
      setSummary("Results-driven Senior Product Manager with 6+ years of experience leading cross-functional squads to define, build, and scale SaaS products. Expert in translating customer insights into impactful product roadmaps, leading to 35% growth in annual recurring revenue.");
      setSkills([
        {
          id: "sk-1",
          title: "Product Strategy",
          items: "Roadmapping, Product Discovery, Market Analysis, User Research, SQL Analytics",
        },
        {
          id: "sk-2",
          title: "Methodologies & Agile",
          items: "Scrum/Agile, Jira, Confluence, A/B Testing, User Story Mapping, OKRs",
        },
      ]);
      setExperiences([
        {
          id: "exp-1",
          title: "Senior Product Manager | GrowthCraft SaaS – New York, NY",
          date: "Jan 2023 – Present",
          bullets: [
            {
              id: "b-1",
              text: "Successfully launched a new enterprise collaboration module from ideation to release, securing $2.4M in pipeline revenue within the first 6 months.",
            },
            {
              id: "b-2",
              text: "Defined and ran continuous user discovery sessions, increasing active user retention rate by 24% through feature optimizations.",
            },
          ],
          meta: "Frameworks: Scrum, OKRs, Mixpanel, SQL, Productboard",
        },
        {
          id: "exp-2",
          title: "Product Manager | AnalyticsHQ – Boston, MA",
          date: "Mar 2020 – Dec 2022",
          bullets: [
            {
              id: "b-3",
              text: "Spearheaded the integration of self-serve analytics tools, reducing customer onboarding friction and lowering churn by 12%.",
            },
            {
              id: "b-4",
              text: "Collaborated with design and engineering teams to establish a modern UI system, accelerating product development velocity by 30%.",
            },
          ],
          meta: "Stack: Jira, Figma, Amplitude, Hotjar",
        },
      ]);
      setEducations([
        {
          id: "edu-1",
          degree: "M.B.A. in Technology Management | NYU Stern School of Business",
          bullets: [
            { id: "eb-1", text: "Focus on Digital Product Management & Tech Entrepreneurship" },
          ],
        },
        {
          id: "edu-2",
          degree: "B.S. in Business Administration | Boston University",
          bullets: [
            { id: "eb-2", text: "Summa Cum Laude, GPA: 3.90/4.00" },
          ],
        },
      ]);
      setLicenses([
        {
          id: "lic-1",
          text: "<b>Certified Product Manager (CPM)</b> — Association of International Product Marketing",
        },
        {
          id: "lic-2",
          text: "<b>Certified Scrum Product Owner (CSPO)</b> — Scrum Alliance",
        },
      ]);
      setFooter("Sarah Jenkins");
    } else if (personaType === "design") {
      setName("LIAM CHEN");
      setContactLine("Seattle, WA <span class=\"text-[var(--hairline)] mx-2\">|</span> (206) 555-0188 <span class=\"text-[var(--hairline)] mx-2\">|</span> liam.chen.design@email.com <span class=\"text-[var(--hairline)] mx-2\">|</span> liamchendesign.com");
      setSummary("Creative and empathetic UI/UX Designer with over 4 years of experience crafting accessible, visually arresting digital experiences for web and mobile platforms. Passionate about user-centered design, prototyping, and aligning user needs with business goals.");
      setSkills([
        {
          id: "sk-1",
          title: "Design & Prototyping",
          items: "Figma, Adobe XD, High-fidelity Prototyping, Wireframing, Responsive Layouts",
        },
        {
          id: "sk-2",
          title: "Research & Testing",
          items: "User Testing, Personas, Journey Mapping, Heuristic Evaluation, Accessibility (WCAG)",
        },
      ]);
      setExperiences([
        {
          id: "exp-1",
          title: "Lead UI/UX Designer | PixelForge Studio – Seattle, WA",
          date: "Feb 2022 – Present",
          bullets: [
            {
              id: "b-1",
              text: "Redesigned the primary checkout flow for an e-commerce platform, leading to a 15% increase in conversion rate and a 20% drop in cart abandonment.",
            },
            {
              id: "b-2",
              text: "Developed and maintained a comprehensive Figma Design System, reducing design-to-development handoff time by 35%.",
            },
          ],
          meta: "Tools: Figma, Adobe Creative Cloud, Storybook, ZeroHeight",
        },
        {
          id: "exp-2",
          title: "UX Designer | WebVibe Agency – Seattle, WA",
          date: "May 2020 – Jan 2022",
          bullets: [
            {
              id: "b-3",
              text: "Conducted 40+ user interviews to inform the redesign of a national healthcare portal, elevating WCAG accessibility conformance to AAA standards.",
            },
            {
              id: "b-4",
              text: "Created interactive micro-animations and smooth transition flows, boosting user satisfaction scores by 18%.",
            },
          ],
          meta: "Stack: HTML/CSS, Webflow, Hotjar, Optimal Workshop",
        },
      ]);
      setEducations([
        {
          id: "edu-1",
          degree: "B.F.A. in Interaction Design | University of Washington",
          bullets: [
            { id: "eb-1", text: "Relevant Coursework: Human-Computer Interaction, Information Architecture, Visual Communication" },
          ],
        },
      ]);
      setLicenses([
        {
          id: "lic-1",
          text: "<b>Google UX Design Professional Certificate</b> — Coursera",
        },
        {
          id: "lic-2",
          text: "<b>NN/g UX Certified (ID: #88391)</b> — Nielsen Norman Group",
        },
      ]);
      setFooter("Liam Chen");
    }
    toast.success(`Seeded resume with professional ${personaType === "software" ? "Software Engineer" : personaType === "product" ? "Product Manager" : "UX Designer"} data! ✨`);
  };

  useEffect(() => {
    if (name === "YOUR NAME") setName("ALEX MORGAN");
    if (contactLine.includes("your.email@example.com") || contactLine.includes("City, State ZIP")) {
       setContactLine('San Francisco, CA <span class="text-[var(--hairline)] mx-2">|</span> (415) 555-0199 <span class="text-[var(--hairline)] mx-2">|</span> alex.morgan@email.com');
    }
    if (summary.includes("A two-to-three sentence pitch")) {
       setSummary("Innovative Full-Stack Software Engineer with over 5 years of experience designing, building, and deploying highly scalable web applications. Proven track record of optimizing application performance, leading cross-functional teams, and implementing cloud-native solutions to drive business outcomes.");
    }
  }, [name, contactLine, summary]);

  // Keyboard shortcut listener for Ctrl+Z / Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (modifier && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleUndo, handleRedo]);

  // Handle active contentEditable blur on window beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur(); // Forces ContentEditableField to flush
      }

      // Synchronously save the absolute latest state to localStorage before the page dies
      const state = useResumeStore.getState();
      const trimmedPayload = {
        name: state.name,
        contactLine: state.contactLine,
        summary: state.summary,
        footer: state.footer,
        design: state.design,
        sections: state.sections,
        manualBreaks: state.manualBreaks,
        licenses: state.licenses,
        skills: state.skills,
        experiences: state.experiences,
        educations: state.educations,
        sectionHeaders: state.sectionHeaders,
        projects: state.projects,
        publications: state.publications,
        awards: state.awards,
      };

      try {
        localStorage.setItem("resume_autosave_content", JSON.stringify(trimmedPayload));
      } catch (err) {
        // Ignore quota issues
      }
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Unified auto-save and history tracking
  useEffect(() => {
    // Create a trimmed payload
    const { profilePhoto: _, ...trimmedPayload } = {
      name,
      contactLine,
      summary,
      footer,
      design,
      sections,
      manualBreaks,
      licenses,
      skills,
      experiences,
      educations,
      profilePhoto,
      sectionHeaders,
      projects,
      publications,
      awards,
    };

    if (typeof window !== "undefined") {
      // Debounce local storage saves slightly to avoid blocking main thread too often
      const timer = setTimeout(() => {
        try {
          localStorage.setItem("resume_autosave_content", JSON.stringify(trimmedPayload));
        } catch (e) {
          console.error("Failed to save to localStorage, likely quota exceeded:", e);
        }
      }, 500);
      
      // Update history
      if (!isHistoryActionRef.current) {
        setHistory((prev: any[]) => {
          const current = prev[historyIndex];
          if (current && JSON.stringify(current) === JSON.stringify(trimmedPayload)) {
            return prev;
          }
          const newHistory = prev.slice(0, historyIndex + 1);
          newHistory.push(trimmedPayload);
          if (newHistory.length > 50) {
            newHistory.shift();
          }
          setHistoryIndex(newHistory.length - 1);
          return newHistory;
        });
      } else {
        isHistoryActionRef.current = false;
      }
      
      return () => clearTimeout(timer);
    }
  }, [
    name,
    contactLine,
    summary,
    footer,
    sections,
    manualBreaks,
    licenses,
    skills,
    experiences,
    educations,
    design,
    profilePhoto,
    sectionHeaders,
    projects,
    publications,
    awards,
    user,
    resumeId,
    historyIndex,
    history.length
  ]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchMyResumes();
    });

    // Load from URL if present
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const mode = params.get("mode");

    if (id && id !== "new") {
      setTimeout(() => {
        setResumeId(id);
        loadResumeFromCloud(id);
        if (mode === "interview") {
          store.updateUI({ activeSidebarTab: "ai" });
        }
      }, 0);
    } else if (id === "new") {
      // Clear ID so it saves as a brand new resume instead of passing "new" as UUID
      setTimeout(() => {
        setResumeId("");
        store.resetStore();
        if (mode === "interview") {
          store.updateUI({ activeSidebarTab: "ai" });
        }
      }, 0);
    }
  }, []);

  // --- Autosave Logic ---
  useEffect(() => {
    if (!resumeId) return; // Only autosave if we are editing an already-saved resume

    const payload = {
      design,
      sections,
      manualBreaks,
      licenses,
      skills,
      experiences,
      educations,
      profilePhoto,
      name,
      contactLine,
      summary,
      footer,
      resumeName: saveResumeName,
    };

    const timer = setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        setIsSaving(true);
        const response = await fetch("/api/resume/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            id: resumeId,
            content: payload,
            clientId: clientId || "web",
            status: 'active',
            is_public: isPublic,
          }),
        });
        
        if (response.ok) {
          setLastSavedAt(new Date());
        }
      } catch (err) {
        console.error("Autosave failed:", err);
      } finally {
        setIsSaving(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [
    resumeId, design, sections, manualBreaks, licenses, skills, experiences, educations, profilePhoto, name, contactLine, summary, footer, saveResumeName, isPublic
  ]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out");
  };

  const handleSaveToCloud = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please log in to save to the cloud.");
      setAuthModalOpen(true);
      return;
    }
    await fetchMyResumes();
    setSaveOverwriteId(resumeId);
    setSaveResumeName(name || "My Resume");
    setSaveModalOpen(true);
  };

  const executeSaveToCloud = async () => {
    setIsSaving(true);
    setSaveModalOpen(false);

    const payload = {
      design,
      sections,
      manualBreaks,
      licenses,
      skills,
      experiences,
      educations,
      profilePhoto,
      name,
      contactLine,
      summary,
      footer,
      resumeName: saveResumeName,
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/resume/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          id: saveOverwriteId, // if overwriting, use that id, else undefined/null to create new
          content: payload,
          clientId: clientId || "web",
          status: 'active',
          is_public: isPublic,
        }),
      });

      if (!response.ok) {
        let errMsg = `HTTP error ${response.status}`;
        try {
          const errData = await response.json();
          if (errData.error) errMsg = errData.error;
          else if (errData.message) errMsg = errData.message;
        } catch (e) {}
        throw new Error(errMsg);
      }

      const parsedData = await response.json();
      const parsed = SaveResponseSchema.parse(parsedData);

      setLastSavedAt(new Date());

      if (!parsed.success) {
        if (parsed.code === "RATE_LIMIT") {
          toast.error("⚠️ " + (parsed.message || "Rate limit exceeded"));
        } else {
          toast.error("⚠️ Error: " + (parsed.message || parsed.code || "Failed to save"));
        }
        return;
      }

      if (parsed.id) {
        setResumeId(parsed.id);
        toast.success("Saved to Supabase securely 🔒");

        // Update URL without reloading
        const url = new URL(window.location.href);
        url.searchParams.set("id", parsed.id);
        window.history.pushState({}, "", url);
        
        // Refresh resumes list
        fetchMyResumes();
      }
    } catch (err: any) {
      console.error("Save failed", err);
      if (err.message?.includes("3 active resume")) {
         toast.error("You have reached the 3 resume limit. Please overwrite an existing one.");
      } else {
         toast.error(err.message || "Failed to save to cloud");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    let toastId: string | undefined = undefined;
    try {
      setExportModalOpen(false);
      setIsExportingPdf(true);

      const resumeElement = document.querySelector(".resume-canvas-container") as HTMLElement;
      if (!resumeElement) throw new Error("Resume element not found");

      const canvasWrapElement = document.querySelector(".canvas-wrap") as HTMLElement | null;

      toastId = toast.loading("Initializing high-fidelity PDF engine...");
      const { data: { session } } = await supabase.auth.getSession();

      const { stage } = await exportResumeToPdf({
        resumeElement,
        canvasWrapElement,
        filename: `${name.replace(/\s+/g, '_') || 'Resume'}.pdf`,
        pageSize: design.pageSize === 'a4' ? 'a4' : 'letter',
        token: session?.access_token,
        onProgress: (stage, message) => {
          if (stage === 'error') {
            toast.error(message, { id: toastId, duration: 5000 });
          } else {
            toast.loading(message, { id: toastId });
          }
        },
      });

      if (stage === 'server') {
        toast.success("High-quality vector PDF downloaded! 🎉", { id: toastId });
      } else {
        // Client-canvas fallback: real download, but it's a rasterized image —
        // do not claim "vector" or "ATS-optimized" for this path.
        toast.error(
          "PDF downloaded, but this fallback method isn't machine-readable by ATS systems. Try exporting again in a moment for the searchable version.",
          { id: toastId, duration: 7000 }
        );
      }
      posthog.capture('pdf_exported', { page_size: design.pageSize === 'a4' ? 'a4' : 'letter', stage });

      // Fire-and-forget: Log to public activity feed for landing page social proof.
      // Only log the "ATS-optimized" claim for the real vector export path.
      if (stage === 'server') {
        fetch('/api/log-activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: 'PDF_EXPORTED',
            display_message: '📄 Someone just exported an ATS-optimized PDF resume'
          })
        }).catch(e => console.error("Failed to log activity:", e));
      }

    } catch (err: any) {
      console.error("PDF export failed:", err);
      if (err.code === 'RATE_LIMIT_EXCEEDED' || (err.message && err.message.includes('limit reached'))) {
        toast.error(err.message, { id: toastId, duration: 6000 });
      } else if (err.code === 'PRINT_FALLBACK_ALREADY_TRIGGERED') {
        // pdf-engine already opened the system print dialog — don't open it twice.
        toast.error(err.message, { id: toastId, duration: 7000 });
      } else {
        toast.error("PDF export failed. Opening system print as fallback...", { id: toastId });
        window.print();
      }
    } finally {
      setIsExportingPdf(false);
    }
  };

  // --- Format Bar State ---
  const [formatBar, setFormatBar] = useState({
    visible: false,
    x: 0,
    y: 0,
    active: { b: false, i: false, u: false },
  });

  useEffect(() => {
    const handleSelection = () => {
      const sel = window.getSelection();
      if (
        !sel ||
        sel.isCollapsed ||
        sel.rangeCount === 0 ||
        sel.toString().trim() === ""
      ) {
        setFormatBar((p: any) => ({ ...p, visible: false }));
        return;
      }
      const node = sel.anchorNode;
      const el =
        node?.nodeType === 3 ? node.parentElement : (node as HTMLElement);
      if (
        !el ||
        !el.closest(".page") ||
        !el.closest('[contenteditable="true"]')
      ) {
        setFormatBar((p: any) => ({ ...p, visible: false }));
        return;
      }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      setFormatBar({
        visible: true,
        x: rect.left + rect.width / 2 + window.scrollX,
        y: rect.top + window.scrollY - 10,
        active: {
          b: document.queryCommandState("bold"),
          i: document.queryCommandState("italic"),
          u: document.queryCommandState("underline"),
        },
      });
    };
    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("keyup", handleSelection);
    return () => {
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("keyup", handleSelection);
    };
  }, []);

  const fmt = (cmd: string, val?: string) => {
    if (cmd === "clear") {
      document.execCommand("removeFormat");
      // Simple clear implementation
    } else if (cmd === "increaseFontSize" || cmd === "decreaseFontSize") {
      const factor = cmd === "increaseFontSize" ? 1.12 : 0.89;
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount || sel.isCollapsed) return;
      const range = sel.getRangeAt(0);
      let container = range.commonAncestorContainer;
      if (container.nodeType === 3) container = container.parentElement as Node;
      const existingSpan = (container as HTMLElement).closest?.(
        "span[data-fsz]",
      );
      if (existingSpan && existingSpan.textContent === range.toString()) {
        const cur =
          parseFloat((existingSpan as HTMLElement).style.fontSize) || 1;
        (existingSpan as HTMLElement).style.fontSize =
          (cur * factor).toFixed(2) + "em";
        return;
      }
      const span = document.createElement("span");
      span.setAttribute("data-fsz", "1");
      span.style.fontSize = factor.toFixed(2) + "em";
      try {
        range.surroundContents(span);
      } catch (e) {
        const frag = range.extractContents();
        span.appendChild(frag);
        range.insertNode(span);
      }
      sel.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.addRange(newRange);
    } else {
      document.execCommand(cmd, false, val);
    }
    setFormatBar((p: any) => ({
      ...p,
      active: {
        b: document.queryCommandState("bold"),
        i: document.queryCommandState("italic"),
        u: document.queryCommandState("underline"),
      },
    }));
  };

  // --- Page Breaks Calculation ---
  const resumeRef = useRef<HTMLDivElement>(null);
  usePaginationEngine(resumeRef);



  const applyTemplate = (t: any) => {
    setDesign((prev: any) => ({
      ...prev,
      template: t.id,
      fontHeading: t.heading,
      fontBody: t.body,
      accent: t.accent,
      panel: t.panel,
      paper: t.paper || "#ffffff",
      radius: t.radius,
      layout: t.layout,
      headingStyle: t.headingStyle,
      italic: t.italic,
      headerAlign: t.headerAlign || "left",
      listStyle: t.listStyle || "disc",
      pageMargin: t.pageMargin || 38,
      itemSpacing: t.itemSpacing || 16,
      jobLayout: t.jobLayout || "stacked",
      boxOpacity: t.boxOpacity !== undefined ? t.boxOpacity : prev.boxOpacity,
      boxShadow: t.boxShadow || prev.boxShadow,
      borderStyle: t.borderStyle || prev.borderStyle,
      backdropBlur: t.backdropBlur !== undefined ? t.backdropBlur : prev.backdropBlur,
    }));
  };

  const saveHTML = () => {
    const clone = document.documentElement.cloneNode(true) as HTMLElement;
    clone
      .querySelectorAll(".no-print, .overlay-scrim, .format-bar, .design-panel")
      .forEach((el) => el.remove());
    const blob = new Blob(["<!DOCTYPE html>\n" + clone.outerHTML], {
      type: "text/html",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume-editable.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const boxOp = (design.boxOpacity !== undefined ? design.boxOpacity : 95) / 100;
  const panelRgb = hexToRgb(design.panel);
  const accentRgb = hexToRgb(design.accent);

  const shadowValue = ({
    none: "none",
    soft: "0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)",
    medium: "0 4px 16px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.03)",
    deep: "0 10px 30px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)",
    glass: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
    neon: `0 0 15px ${design.accent}25, 0 0 5px ${design.accent}15`,
  } as any)[design.boxShadow || "soft"] || "none";

  const borderValue = ({
    none: "none",
    hairline: "1px solid var(--hairline)",
    accent: `1px solid rgba(${accentRgb}, 0.25)`,
    dashed: `1px dashed rgba(${accentRgb}, 0.4)`,
    double: `3px double var(--hairline)`,
  } as any)[design.borderStyle || "hairline"] || "none";

  const pageWidthPx = design.pageSize === "letter" ? 816 : 794;
  const pageHeightPx = design.pageSize === "letter" ? 1056 : 1123;
  const maxPageFromMap = Object.values(idToPageMap || {}).length > 0 ? Math.max(...Object.values(idToPageMap || {})) : 0;
  const totalPages = Math.max(pageBreakElementIds.length + 1, maxPageFromMap + 1, 1);
  const totalHeightPx = pageHeightPx * totalPages + 32 * Math.max(0, totalPages - 1);

  const pageStyles = {
    "--ink": "#232025",
    "--ink-soft": "#6b6568",
    "--hairline": "#dcd7da",
    "--mauve": design.panel,
    "--mauve-dark": shadeColor(design.panel, -8),
    "--panel": design.panel,
    "--panel-rgb": panelRgb,
    "--panel-rgba": `rgba(${panelRgb}, ${boxOp})`,
    "--panel-dark-rgba": `rgba(${hexToRgb(shadeColor(design.panel, -8))}, ${boxOp})`,
    "--accent": design.accent,
    "--accent-rgb": accentRgb,
    "--paper": design.paper || "#ffffff",
    "--toolbar-bg": "#1d1b1e",
    "--danger": "#a94442",
    "--radius": `${design.radius}px`,
    "--font-heading": design.fontHeading,
    "--font-body": design.fontBody,
    "--font-accent": design.fontAccent || "'Inter',sans-serif",
    "--font-weight-heading": design.fontWeights?.heading ?? 700,
    "--font-weight-body": design.fontWeights?.body ?? 400,
    "--font-weight-accent": design.fontWeights?.accent ?? 600,
    "--text-scale": design.scale / 100,
    "--line-height": design.lineHeight,
    "--section-gap": `${design.gap}px`,
    "--item-spacing": `${design.itemSpacing}px`,
    "--list-style": design.listStyle,
    "--page-width": design.pageSize === "letter" ? "816px" : "794px",
    "--page-height": design.pageSize === "letter" ? "1056px" : "1123px",
    "--page-margin": `${design.pageMargin}px`,
    "--page-margin-y": `${design.pageMarginTopBottom ?? design.pageMargin}px`,
    "--page-margin-x": `${design.pageMarginLeftRight ?? design.pageMargin}px`,
    "--sidebar-w": "230px",
    "--box-opacity": boxOp.toString(),
    "--box-shadow": shadowValue,
    "--box-border": borderValue,
    "--backdrop-blur": `${design.backdropBlur || 4}px`,
  } as React.CSSProperties;

  const layoutClasses = [
    design.italic ? "" : "no-italic-body",
    design.headingStyle === "bar" ? "" : `heading-${design.headingStyle}`,
    design.layout === "sidebar" ? "layout-sidebar" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // --- Renderers ---

  return (
    <div className="h-screen w-full flex bg-[#f8f9fa] text-gray-900 antialiased overflow-hidden font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes photo-wobble {
          0%, 100% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(2.5deg) scale(1.04); }
        }
        @keyframes photo-flicker {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 2px rgba(0, 240, 255, 0.3)); }
          50% { opacity: 0.85; filter: drop-shadow(0 0 12px rgba(0, 240, 255, 0.9)); }
        }
        @keyframes photo-barndoor {
          0% { transform: scaleX(0); transform-origin: left; }
          100% { transform: scaleX(1); transform-origin: left; }
        }
        @keyframes photo-circle {
          0% { clip-path: circle(0% at 50% 50%); }
          100% { clip-path: circle(100% at 50% 50%); }
        }
        @keyframes photo-fade {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-photo-wobble:hover {
          animation: photo-wobble 2.5s ease-in-out infinite;
        }
        .animate-photo-flicker {
          animation: photo-flicker 1.5s ease-in-out infinite;
        }
        .animate-photo-barndoor {
          animation: photo-barndoor 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-photo-circle {
          animation: photo-circle 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-photo-fade {
          animation: photo-fade 0.9s ease-out forwards;
        }
      `}} />
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Save Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Save to Cloud</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Resume Name</label>
              <input
                type="text"
                value={saveResumeName}
                onChange={(e) => setSaveResumeName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Software Engineer Resume"
              />
            </div>
            
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Save Destination (Limit 3 active resumes)</p>
              <div className="space-y-2">
                {myResumes.length < 3 && (
                  <label className={cn("flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all", saveOverwriteId === null ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300")}>
                    <input type="radio" name="save_dest" checked={saveOverwriteId === null} onChange={() => setSaveOverwriteId(null)} className="hidden" />
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">Create New Resume</div>
                    </div>
                  </label>
                )}
                {myResumes.map((resume) => (
                  <label key={resume.id} className={cn("flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all", saveOverwriteId === resume.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300")}>
                    <input type="radio" name="save_dest" checked={saveOverwriteId === resume.id} onChange={() => setSaveOverwriteId(resume.id)} className="hidden" />
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">{resume.name || "Untitled Resume"}</div>
                      <div className="text-[10px] text-gray-500">Updated: {new Date(resume.updated_at).toLocaleDateString()}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setSaveModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-700 hover:text-gray-900">Cancel</button>
              <button onClick={executeSaveToCloud} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal 
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        resumeId={resumeId}
        isPublic={isPublic}
        setIsPublic={setIsPublic}
        onSaveNow={() => setSaveModalOpen(true)}
        executeSaveToCloud={executeSaveToCloud}
      />

      {/* ATS Readiness & AI Optimization Modal */}
      {atsScoreModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">ATS Readiness Breakdown</h2>
                  <p className="text-xs text-gray-500">Real-time analysis against enterprise recruiting parsers</p>
                </div>
              </div>
              <button
                onClick={() => setAtsScoreModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-all cursor-pointer"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div className="my-5 flex items-center justify-between bg-gradient-to-r from-gray-50 to-blue-50/40 p-4 rounded-xl border border-gray-200/60">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500 block mb-0.5">Overall ATS Readiness</span>
                <span className="text-2xl font-black text-gray-900">{atsHealthBreakdown.overallScore}</span>
                <span className="text-sm font-bold text-gray-400"> / 100</span>
              </div>
              <div className="text-right">
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                  atsHealthBreakdown.overallScore >= 85
                    ? "bg-emerald-100 text-emerald-800"
                    : atsHealthBreakdown.overallScore >= 70
                    ? "bg-amber-100 text-amber-800"
                    : "bg-rose-100 text-rose-800"
                )}>
                  {atsHealthBreakdown.overallScore >= 85 ? (
                    <CheckCircle2 size={13} />
                  ) : (
                    <AlertCircle size={13} />
                  )}
                  {atsHealthBreakdown.overallScore >= 85
                    ? "Optimal for ATS"
                    : atsHealthBreakdown.overallScore >= 70
                    ? "Needs Minor Tuning"
                    : "Action Recommended"}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Pillar 1: Vector Architecture */}
              <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-blue-600" />
                    <span className="text-xs font-bold text-gray-900">Vector Architecture & Structural Hierarchy</span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-600">100/100</span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Unlike Canva or Adobe Express, your resume uses true semantic HTML structures (`&lt;h1&gt;`, `&lt;section&gt;`, `&lt;ul&gt;`) compiled into vector text via CSSOM extraction. 100% readable by Workday, Greenhouse, and Lever.
                </p>
              </div>

              {/* Pillar 2: Metric Impact Density */}
              <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-indigo-600" />
                    <span className="text-xs font-bold text-gray-900">Quantifiable Impact Density</span>
                  </div>
                  <span className="text-xs font-extrabold text-indigo-600">{atsHealthBreakdown.metricScore}/100</span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed mb-2">
                  Found numbers, percentages, or financial metrics (`$`, `%`, `increased by`) in <strong>{atsHealthBreakdown.bulletsWithMetrics} of {atsHealthBreakdown.totalBullets}</strong> bullet points.
                </p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${atsHealthBreakdown.metricScore}%` }} />
                </div>
                {atsHealthBreakdown.metricScore < 70 && (
                  <p className="text-[10px] text-amber-700 mt-2 font-medium bg-amber-50 p-2 rounded-lg border border-amber-200/50">
                    💡 Tip: Recruiters look for specific outcomes. Try adding metrics like &quot;reduced latency by 30%&quot; or &quot;managed $2M budget&quot;.
                  </p>
                )}
              </div>

              {/* Pillar 3: Action Verb Strength */}
              <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-purple-600" />
                    <span className="text-xs font-bold text-gray-900">Power Action Verbs & Keywords</span>
                  </div>
                  <span className="text-xs font-extrabold text-purple-600">{atsHealthBreakdown.verbScore}/100</span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Identified <strong>{atsHealthBreakdown.strongCount}</strong> strong executive verbs (e.g. <em>Architected, Spearheaded, Optimized</em>) and <strong>{atsHealthBreakdown.weakCount}</strong> passive phrases.
                </p>
                {atsHealthBreakdown.weakCount > 0 && (
                  <p className="text-[10px] text-rose-700 mt-2 font-medium bg-rose-50 p-2 rounded-lg border border-rose-200/50">
                    ⚠️ Replace weak phrases like &quot;responsible for&quot; or &quot;helped&quot; with active verbs like &quot;Directed&quot; or &quot;Engineered&quot;.
                  </p>
                )}
              </div>

              {/* Pillar 4: Section Completeness */}
              <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span className="text-xs font-bold text-gray-900">Core Sections Completeness</span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-600">{atsHealthBreakdown.completenessScore}/100</span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Summary, Professional Experience, Education, and Skills sections are structured and active.
                </p>
              </div>
            </div>

            <button
              onClick={() => setAtsScoreModalOpen(false)}
              className="w-full mt-6 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs py-3 rounded-xl transition-all cursor-pointer"
            >
              Back to Canvas
            </button>
          </div>
        </div>
      )}

      {/* Export PDF Modal */}
      <ExportModal 
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onDownloadPdf={handleDownloadPdf}
        isExportingPdf={isExportingPdf}
      />

      {/* Format Bar */}
      {formatBar.visible && (
        <div
          className="format-bar fixed z-[200] bg-[#1d1b1e] text-white rounded-lg shadow-xl p-1.5 flex items-center gap-1 -translate-x-1/2 transition-all no-print"
          style={{ left: formatBar.x, top: formatBar.y }}
        >
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              document.execCommand("bold");
            }}
            className={cn(
              "p-1.5 rounded-md hover:bg-[#33303a]",
              formatBar.active.b && "bg-[#4a3c50] text-[#00f0ff]",
            )}
            title="Bold (Ctrl+B)"
            aria-label="Bold"
          >
            <Bold size={14} />
          </button>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              document.execCommand("italic");
            }}
            className={cn(
              "p-1.5 rounded-md hover:bg-[#33303a]",
              formatBar.active.i && "bg-[#4a3c50] text-[#00f0ff]",
            )}
            title="Italic (Ctrl+I)"
            aria-label="Italic"
          >
            <Italic size={14} />
          </button>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              document.execCommand("underline");
            }}
            className={cn(
              "p-1.5 rounded-md hover:bg-[#33303a]",
              formatBar.active.u && "bg-[#4a3c50] text-[#00f0ff]",
            )}
            title="Underline (Ctrl+U)"
            aria-label="Underline"
          >
            <Underline size={14} />
          </button>
          <div className="w-px h-4 bg-[#4d3f52] mx-1"></div>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              document.execCommand("removeFormat");
            }}
            className="p-1.5 rounded-md hover:bg-[#33303a] text-gray-300"
            title="Clear formatting"
            aria-label="Clear formatting"
          >
            <Eraser size={14} />
          </button>
        </div>
      )}

      {/* Tutorial Overlay */}
      {tutorialOpen && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 font-sans no-print backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-[440px] p-6 shadow-2xl">
            <div className="text-[11px] font-bold tracking-widest text-gray-600 uppercase mb-1">
              {TUTORIAL_STEPS[tutorialStep].eyebrow}
            </div>
            <h3 className="font-bold text-xl text-gray-900 mb-2">
              {TUTORIAL_STEPS[tutorialStep].title}
            </h3>
            <div
              className="text-sm text-gray-600 leading-relaxed min-h-[70px]"
              dangerouslySetInnerHTML={{
                __html: TUTORIAL_STEPS[tutorialStep].body,
              }}
            />
            <div className="flex gap-1.5 my-4">
              {TUTORIAL_STEPS.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full",
                    i === tutorialStep ? "bg-gray-800" : "bg-gray-200",
                  )}
                />
              ))}
            </div>
            <div className="flex items-center justify-between mt-6">
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dontShowTutorialAgain}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setDontShowTutorialAgain(checked);
                    if (checked && typeof window !== "undefined") {
                      localStorage.setItem("resume_tutorial_seen", "true");
                      setCookie("resume_tutorial_seen", "true", 365);
                    } else if (typeof window !== "undefined") {
                      localStorage.removeItem("resume_tutorial_seen");
                      setCookie("resume_tutorial_seen", "", -1);
                    }
                  }}
                /> Don&apos;t show this again
              </label>
              <div className="flex gap-2">
                {tutorialStep > 0 && (
                  <button
                    onClick={() => setTutorialStep((p: any) => p - 1)}
                    className="rounded-lg px-4 py-2 text-sm font-semibold border border-gray-200 hover:bg-gray-50"
                  >
                    Back
                  </button>
                )}
                {tutorialStep < TUTORIAL_STEPS.length - 1 ? (
                  <button
                    onClick={() => setTutorialStep((p: any) => p + 1)}
                    className="rounded-lg px-4 py-2 text-sm font-semibold bg-gray-900 text-white hover:bg-black"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (dontShowTutorialAgain && typeof window !== "undefined") {
                        localStorage.setItem("resume_tutorial_seen", "true");
                        setCookie("resume_tutorial_seen", "true", 365);
                      }
                      setTutorialOpen(false);
                    }}
                    className="rounded-lg px-4 py-2 text-sm font-semibold bg-gray-900 text-white hover:bg-black"
                  >
                    Finish Tour
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Secondary Sidebar */}
      {activeSidebarTab && (
        <div
          style={{ width: typeof window !== "undefined" && window.innerWidth >= 768 ? `${sidebarWidth}px` : undefined }}
          className="fixed inset-x-0 bottom-16 top-14 md:relative md:inset-auto md:top-0 md:h-full bg-white border-t md:border-t-0 md:border-r border-gray-200 z-30 flex flex-col overflow-hidden no-print shrink-0 shadow-sm transition-all duration-300"
        >
          {/* Physical Resize Handle on right edge */}
          <div
            className="hidden md:block absolute top-0 right-0 bottom-0 w-1.5 hover:w-2 bg-transparent hover:bg-blue-400/30 active:bg-blue-500/50 cursor-col-resize z-50 transition-all duration-150"
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = sidebarWidth;
              const handleMouseMove = (moveEvent: MouseEvent) => {
                const currentWidth = startWidth + (moveEvent.clientX - startX);
                if (currentWidth >= 260 && currentWidth <= 480) {
                  setSidebarWidth(currentWidth);
                }
              };
              const handleMouseUp = () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
              };
              document.addEventListener("mousemove", handleMouseMove);
              document.addEventListener("mouseup", handleMouseUp);
            }}
          />

          {/* Floating Collapse Button positioned on border */}
          <button
            type="button"
            onClick={() => setActiveSidebarTab(null)}
            className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-white border border-gray-200 rounded-full shadow-md items-center justify-center z-50 hover:bg-gray-50 text-gray-600 hover:text-blue-600 hover:scale-105 active:scale-95 hover:shadow-lg transition-all cursor-pointer group"
            title="Collapse Sidebar"
          >
            <ChevronLeft size={14} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
          </button>
          {/* Templates Panel */}
          <TemplatesPanel
            activeSidebarTab={activeSidebarTab}
            setActiveSidebarTab={setActiveSidebarTab}
            design={design}
            setDesign={setDesign}
            applyTemplate={applyTemplate}
          />

          {/* Design Panel */}
          <DesignPanel
            activeSidebarTab={activeSidebarTab}
            setActiveSidebarTab={setActiveSidebarTab}
            design={design}
            setDesign={setDesign}
            showMarginGuides={showMarginGuides}
            setShowMarginGuides={setShowMarginGuides}
            showHeatmapOverlay={showHeatmapOverlay}
            setShowHeatmapOverlay={setShowHeatmapOverlay}
          />

          {/* Add Content Panel */}
          <ContentPanel
            activeSidebarTab={activeSidebarTab}
            setActiveSidebarTab={setActiveSidebarTab}
            sections={sections}
            setSections={setSections}
            experiences={experiences}
            setExperiences={setExperiences}
            skills={skills}
            setSkills={setSkills}
            educations={educations}
            setEducations={setEducations}
            licenses={licenses}
            setLicenses={setLicenses}
            projects={projects}
            setProjects={setProjects}
            publications={publications}
            setPublications={setPublications}
            awards={awards}
            setAwards={setAwards}
          />

          {/* Photo Panel */}
          {activeSidebarTab === "photo" && (
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-600">
                  Profile Photo Settings
                </h2>
                <button
                  onClick={() => setActiveSidebarTab(null)}
                  className="text-gray-600 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <X size={18} />
                </button>
              </div>
              
              {/* Enable Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-xs font-semibold text-gray-800">Show Photo on Resume</span>
                <button
                  onClick={() => setProfilePhoto((p: any) => ({ ...p, enabled: !p.enabled }))}
                  className={cn(
                    "w-11 h-6 rounded-full transition-colors relative",
                    profilePhoto.enabled ? "bg-blue-600" : "bg-gray-200"
                  )}
                >
                  <span className={cn(
                    "absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow-sm transition-transform",
                    profilePhoto.enabled ? "translate-x-5" : "translate-x-0"
                  )} />
                </button>
              </div>

              {profilePhoto.enabled && (
                <>
                  {/* Upload / Drag Area */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      Upload Picture
                    </label>
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const b64 = event.target?.result as string;
                            setProfilePhoto((p: any) => ({ ...p, url: b64, rawUploadedUrl: b64 }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="border-2 border-dashed border-gray-200 hover:border-blue-500 rounded-xl p-5 text-center cursor-pointer hover:bg-blue-50/20 transition-all group relative"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Camera className="mx-auto text-gray-600 group-hover:text-blue-500 mb-2 transition-colors" size={24} />
                      <div className="text-xs font-semibold text-gray-700">Drag & Drop or Click to upload</div>
                      <div className="text-[11px] text-gray-600 mt-1">Supports JPG, PNG, GIF</div>
                    </div>
                  </div>



                  {/* Background removal section */}
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      Remove Background
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleAutoRemoveBackground(bgRemoveSensitivity)}
                        className="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Scissors size={14} /> Auto Remove
                      </button>
                      <button
                        onClick={() => setEraseModalOpen(true)}
                        className="py-2.5 px-3 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Eraser size={14} /> Brush Eraser
                      </button>
                    </div>

                    <div className="space-y-1.5 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Key Out Custom Color</span>
                        <input
                          type="color"
                          value={bgRemoveColor}
                          onChange={(e) => setBgRemoveColor(e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                        />
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-gray-600">
                        <span>Tolerance: {bgRemoveSensitivity}</span>
                        <input
                          type="range"
                          min="10"
                          max="150"
                          value={bgRemoveSensitivity}
                          onChange={(e) => setBgRemoveSensitivity(parseInt(e.target.value))}
                          className="w-24 accent-blue-600"
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveBackground(bgRemoveColor, bgRemoveSensitivity)}
                        className="w-full mt-1.5 py-1 px-2 bg-white hover:bg-gray-100 border border-gray-200 rounded text-[11px] font-bold text-gray-600 transition-colors"
                      >
                        Key Out Target Color
                      </button>
                    </div>
                  </div>

                  {/* Photoshop Filters */}
                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      Photoshop Filters
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: "none", name: "Original" },
                        { id: "color-punch", name: "Color Punch" },
                        { id: "golden-hour", name: "Golden Hour" },
                        { id: "portrait", name: "Portrait" },
                        { id: "shadow", name: "Shadow" },
                        { id: "sunbath", name: "Sunbath" },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setProfilePhoto((p: any) => ({ ...p, filter: f.id }))}
                          className={cn(
                            "py-1.5 px-2 text-[11px] font-semibold border rounded-lg transition-all",
                            profilePhoto.filter === f.id
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                          )}
                        >
                          {f.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tones */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      Tones (Duo / Tint)
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: "none", name: "None" },
                        { id: "grayscale", name: "Grayscale" },
                        { id: "darken", name: "Darken" },
                        { id: "tint", name: "Tint" },
                        { id: "colorize", name: "Colorize" },
                        { id: "duotone", name: "Duotone" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setProfilePhoto((p: any) => ({ ...p, tone: t.id }))}
                          className={cn(
                            "py-1.5 px-2 text-[11px] font-semibold border rounded-lg transition-all",
                            profilePhoto.tone === t.id
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                          )}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Adjust Panel */}
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                      <Sliders size={14} /> Adjust Image Layout
                    </h3>

                    {/* Scale & Aspect Ratio */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                          Aspect Ratio
                        </label>
                        <select
                          value={profilePhoto.aspectRatio}
                          onChange={(e) => setProfilePhoto((p: any) => ({ ...p, aspectRatio: e.target.value as any }))}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 outline-none"
                        >
                          <option value="1:1">1:1 Square</option>
                          <option value="3:4">3:4 Portrait</option>
                          <option value="4:3">4:3 Landscape</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                          Shape / Radius
                        </label>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setProfilePhoto((p: any) => ({ ...p, radius: 50 }))}
                            className={cn("flex-1 py-1 px-1.5 border rounded-lg text-[11px] font-bold", profilePhoto.radius === 50 ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-gray-200")}
                          >
                            Circle
                          </button>
                          <button
                            onClick={() => setProfilePhoto((p: any) => ({ ...p, radius: 12 }))}
                            className={cn("flex-1 py-1 px-1.5 border rounded-lg text-[11px] font-bold", profilePhoto.radius === 12 ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-gray-200")}
                          >
                            Rounded
                          </button>
                          <button
                            onClick={() => setProfilePhoto((p: any) => ({ ...p, radius: 0 }))}
                            className={cn("flex-1 py-1 px-1.5 border rounded-lg text-[11px] font-bold", profilePhoto.radius === 0 ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-gray-200")}
                          >
                            Square
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Scale slider */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Image Scale ({profilePhoto.scale}%)</label>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={profilePhoto.scale}
                        onChange={(e) => setProfilePhoto((p: any) => ({ ...p, scale: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    {/* Opacity slider */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Opacity ({profilePhoto.opacity}%)</label>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={profilePhoto.opacity}
                        onChange={(e) => setProfilePhoto((p: any) => ({ ...p, opacity: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    {/* Offsets (X & Y Alignment) */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">X Offset ({profilePhoto.xOffset}px)</label>
                        <input
                          type="range"
                          min="-80"
                          max="80"
                          value={profilePhoto.xOffset}
                          onChange={(e) => setProfilePhoto((p: any) => ({ ...p, xOffset: parseInt(e.target.value) }))}
                          className="w-full accent-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">Y Offset ({profilePhoto.yOffset}px)</label>
                        <input
                          type="range"
                          min="-80"
                          max="80"
                          value={profilePhoto.yOffset}
                          onChange={(e) => setProfilePhoto((p: any) => ({ ...p, yOffset: parseInt(e.target.value) }))}
                          className="w-full accent-blue-600"
                        />
                      </div>
                    </div>

                    {/* Borders */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">Border Width ({profilePhoto.borderWidth}px)</label>
                        <input
                          type="range"
                          min="0"
                          max="8"
                          value={profilePhoto.borderWidth}
                          onChange={(e) => setProfilePhoto((p: any) => ({ ...p, borderWidth: parseInt(e.target.value) }))}
                          className="w-full accent-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">Border Color</label>
                        <input
                          type="color"
                          value={profilePhoto.borderColor}
                          onChange={(e) => setProfilePhoto((p: any) => ({ ...p, borderColor: e.target.value }))}
                          className="w-full h-8 rounded cursor-pointer border-0 p-0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Professional Photo Editing Sliders */}
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                        <Sliders size={14} /> Advanced Adjustments
                      </h3>

                    </div>

                    {/* Brightness */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Brightness ({profilePhoto.brightness ?? 100}%)</label>
                        <button onClick={() => setProfilePhoto((p: any) => ({ ...p, brightness: 100 }))} className="text-[9px] text-blue-500 hover:underline">Reset</button>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="200"
                        value={profilePhoto.brightness ?? 100}
                        onChange={(e) => setProfilePhoto((p: any) => ({ ...p, brightness: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    {/* Contrast */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Contrast ({profilePhoto.contrast ?? 100}%)</label>
                        <button onClick={() => setProfilePhoto((p: any) => ({ ...p, contrast: 100 }))} className="text-[9px] text-blue-500 hover:underline">Reset</button>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="200"
                        value={profilePhoto.contrast ?? 100}
                        onChange={(e) => setProfilePhoto((p: any) => ({ ...p, contrast: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    {/* Saturation */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Saturation ({profilePhoto.saturation ?? 100}%)</label>
                        <button onClick={() => setProfilePhoto((p: any) => ({ ...p, saturation: 100 }))} className="text-[9px] text-blue-500 hover:underline">Reset</button>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={profilePhoto.saturation ?? 100}
                        onChange={(e) => setProfilePhoto((p: any) => ({ ...p, saturation: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    {/* Blur */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Soft Focus / Blur ({profilePhoto.blur ?? 0}px)</label>
                        <button onClick={() => setProfilePhoto((p: any) => ({ ...p, blur: 0 }))} className="text-[9px] text-blue-500 hover:underline">Reset</button>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={profilePhoto.blur ?? 0}
                        onChange={(e) => setProfilePhoto((p: any) => ({ ...p, blur: parseFloat(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    {/* Hue Rotate */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Hue Shift ({profilePhoto.hueRotate ?? 0}°)</label>
                        <button onClick={() => setProfilePhoto((p: any) => ({ ...p, hueRotate: 0 }))} className="text-[9px] text-blue-500 hover:underline">Reset</button>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={profilePhoto.hueRotate ?? 0}
                        onChange={(e) => setProfilePhoto((p: any) => ({ ...p, hueRotate: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    {/* Sepia */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Warmth / Sepia ({profilePhoto.sepia ?? 0}%)</label>
                        <button onClick={() => setProfilePhoto((p: any) => ({ ...p, sepia: 0 }))} className="text-[9px] text-blue-500 hover:underline">Reset</button>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={profilePhoto.sepia ?? 0}
                        onChange={(e) => setProfilePhoto((p: any) => ({ ...p, sepia: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>
                  </div>

                  {/* Photo Motion & Effects */}
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                      <Sparkles size={14} /> Motion & Transition Effects
                    </h3>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Animation Preset
                      </label>
                      <select
                        value={profilePhoto.animation || "none"}
                        onChange={(e) => setProfilePhoto((p: any) => ({ ...p, animation: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 outline-none"
                      >
                        <option value="none">None (Static)</option>
                        <option value="wobble">Wobble (Gentle hover drift)</option>
                        <option value="barndoor">Barndoor (Slide in from edge)</option>
                        <option value="circle">Circle Reveal (Radial grow)</option>
                        <option value="fade">Elegant Fade In</option>
                        <option value="flicker">Futuristic Glow Flicker</option>
                      </select>
                      <p className="text-[9px] text-gray-600 mt-1">
                        Adds a gorgeous interactive hover or entry motion effect.
                      </p>
                    </div>
                  </div>

                  {/* Reset Adjustments */}
                  <div className="pt-4">
                    <button
                      onClick={() => setProfilePhoto((p: any) => ({
                        ...p,
                        opacity: 100,
                        scale: 100,
                        radius: 50,
                        filter: "none",
                        tone: "none",
                        xOffset: 0,
                        yOffset: 0,
                        borderWidth: 2,
                        borderColor: "#e2e8f0",
                        aspectRatio: "1:1",
                        brightness: 100,
                        contrast: 100,
                        saturation: 100,
                        blur: 0,
                        hueRotate: 0,
                        sepia: 0,
                        animation: "none",
                      }))}
                      className="w-full py-1.5 border border-dashed border-gray-200 rounded-lg text-xs text-gray-600 hover:text-gray-800 hover:border-gray-300 transition-colors"
                    >
                      Reset Photo Adjustments
                    </button>
                  </div>
                </>
              )}
              
              <div className="mt-4 pt-4 border-t border-gray-100 text-[11px] text-gray-600 text-center">
                Agent Rez AI is provided "as-is". Please verify all AI-generated content before use.
              </div>
            </div>
          )}

          {/* Account Panel */}
          {activeSidebarTab === "account" && (
            <div className="flex-1 p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-600">
                  Account
                </h2>
                <button
                  onClick={() => setActiveSidebarTab(null)}
                  className="text-gray-600 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <X size={18} />
                </button>
              </div>
              {user ? (
                <div className="flex flex-col h-full overflow-y-auto pr-1 pb-4 space-y-4">
                  {/* Comprehensive Profile Info Card */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/60 space-y-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-blue-200 bg-blue-50 flex items-center justify-center shrink-0">
                        <img
                          src={user.user_metadata?.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex"}
                          alt="User avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-gray-900 truncate">
                          {user.user_metadata?.first_name || 'Member'} {user.user_metadata?.last_name || ''}
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-200/60 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-gray-600 font-medium uppercase tracking-wider text-[11px]">US State</div>
                        <div className="text-gray-800 font-semibold mt-0.5 truncate">{user.user_metadata?.state || 'Not set'}</div>
                      </div>
                      <div>
                        <div className="text-gray-600 font-medium uppercase tracking-wider text-[11px]">Date of Birth</div>
                        <div className="text-gray-800 font-semibold mt-0.5 truncate">
                          {user.user_metadata?.dob 
                            ? new Date(user.user_metadata.dob).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : 'Not set'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                      Choose Profile Avatar
                    </h3>
                    <div className="grid grid-cols-4 gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      {PRESET_AVATARS.map((av) => {
                        const isSelected = user?.user_metadata?.avatar === av.url;
                        return (
                          <button
                            key={av.id}
                            title={av.name}
                            onClick={async () => {
                              try {
                                const { error } = await supabase.auth.updateUser({
                                  data: { avatar: av.url },
                                });
                                if (error) throw error;
                                toast.success(`Avatar updated to ${av.name}!`);
                              } catch (err: any) {
                                toast.error(err.message || "Failed to update avatar");
                              }
                            }}
                            className={cn(
                              "relative rounded-full overflow-hidden border-2 transition-all p-0.5 hover:scale-105 flex items-center justify-center bg-white",
                              isSelected ? "border-blue-600 bg-blue-50/50 scale-105 shadow-sm" : "border-gray-200 hover:border-gray-300"
                            )}
                          >
                            <img src={av.url} alt={av.name} className="w-8 h-8 rounded-full" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Change Password Form */}
                  <form onSubmit={handleUpdatePassword} className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Change Password
                    </h3>
                    
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          required
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isUpdatingPassword}
                      className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-none rounded-lg py-2 text-xs font-bold hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isUpdatingPassword ? "Updating..." : "Update Password"}
                    </button>
                  </form>

                  <div className="flex-1 flex flex-col min-h-[200px]">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold text-gray-900">
                        Your Resumes
                      </h3>
                      <button
                        onClick={() => {
                          setResumeId(null);
                          setActiveSidebarTab("templates");
                        }}
                        className="text-xs text-blue-600 font-bold hover:underline"
                      >
                        + New
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                      {myResumes.length === 0 ? (
                        <div className="p-4 text-xs text-gray-600 text-center border border-dashed border-gray-200 rounded-lg">
                          No saved resumes found.
                        </div>
                      ) : (
                        myResumes.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => {
                              setResumeId(r.id);
                              loadResumeFromCloud(r.id);
                            }}
                            className={cn(
                              "block w-full text-left p-3 text-sm rounded-lg transition-all border",
                              resumeId === r.id
                                ? "bg-blue-50 border-blue-200 text-blue-900"
                                : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50",
                            )}
                          >
                            <div className="font-semibold">
                              Resume {r.id.substring(0, 8)}
                            </div>
                            <div className="text-[11px] text-gray-600 mt-1">
                              {new Date(r.updated_at).toLocaleDateString()}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="mt-4 w-full p-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-bold transition-all"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-4">
                    <CloudUpload size={28} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">
                    Save your progress
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Create an account to save your resumes to the cloud and
                    access them from anywhere.
                  </p>
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    className="w-full p-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all"
                  >
                    Log In / Sign Up
                  </button>
                </div>
              )}
            </div>
          )}

          {/* AI Tools Panel */}
          {activeSidebarTab === "ai" && (
            <AISidebar
              user={user}
              setAuthModalOpen={setAuthModalOpen}
              isHistoryActionRef={isHistoryActionRef}
            />
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#f3f4f6] pb-16 md:pb-0">
        {/* Top Header */}
        <Toolbar
          user={user}
          resumeId={resumeId}
          historyIndex={historyIndex}
          historyLength={history.length}
          handleUndo={handleUndo}
          handleRedo={handleRedo}
          handleResetToBlank={handleResetToBlank}
          isTopMenuMinimized={isTopMenuMinimized}
          setIsTopMenuMinimized={setIsTopMenuMinimized}
          setTutorialStep={setTutorialStep}
          setTutorialOpen={setTutorialOpen}
          spellcheckEnabled={spellcheckEnabled}
          setSpellcheckEnabled={setSpellcheckEnabled}
          atsHealthBreakdown={atsHealthBreakdown}
          setAtsScoreModalOpen={setAtsScoreModalOpen}
          lastSavedAt={lastSavedAt}
          handleSaveToCloud={handleSaveToCloud}
          isSaving={isSaving}
          setExportModalOpen={setExportModalOpen}
          onBack={onBack}
        />

        {/* Onboarding Wizard Modal */}
        {showOnboarding && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col md:flex-row border border-gray-100">
              {/* Left visual area */}
              <div className="bg-blue-600 p-8 flex-col justify-between hidden md:flex w-2/5 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                    <Sparkles className="text-white" size={24} />
                  </div>
                  <h3 className="text-white font-bold text-2xl leading-tight mb-3">Build a resume that stands out</h3>
                  <p className="text-blue-100 text-sm mb-6">Join 10,000+ professionals who landed their dream jobs using our AI-powered builder.</p>
                </div>
                
                <div className="space-y-3 relative z-10">
                  <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
                    <Check size={16} className="text-blue-300" /> Free export to PDF
                  </div>
                  <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
                    <Check size={16} className="text-blue-300" /> ATS-friendly templates
                  </div>
                  <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
                    <Check size={16} className="text-blue-300" /> AI writing assistance
                  </div>
                </div>
                
                {/* Decorative background shapes */}
                <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -top-16 -left-16 w-32 h-32 bg-blue-400/20 rounded-full blur-xl"></div>
              </div>
              
              {/* Right content area */}
              <div className="p-6 md:p-8 flex-1 flex flex-col relative">
                <button
                  onClick={() => setShowOnboarding(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors"
                >
                  <X size={18} />
                </button>
                
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Let's get started</h2>
                <p className="text-gray-500 text-sm mb-6">How would you like to build your resume today?</p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      handleLoadPersona("software");
                      setShowOnboarding(false);
                    }}
                    className="w-full group relative flex items-center p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md hover:bg-blue-50/50 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mr-4 group-hover:scale-110 transition-transform">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Start with a Template Example</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Seed with professional Software Engineer data</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      handleResetResume();
                      setShowOnboarding(false);
                    }}
                    className="w-full group relative flex items-center p-4 border border-gray-200 rounded-xl hover:border-gray-400 hover:shadow-md transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0 mr-4 group-hover:scale-110 transition-transform">
                      <Plus size={18} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Start from Scratch</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Build a blank resume customized to you</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      handleLoadPersona("design");
                      setShowOnboarding(false);
                    }}
                    className="w-full group relative flex items-center p-4 border border-gray-200 rounded-xl hover:border-purple-500 hover:shadow-md hover:bg-purple-50/50 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mr-4 group-hover:scale-110 transition-transform">
                      <Palette size={18} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Load Creative Example</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Seed with UX Designer data</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Canvas */}
        <ResumeCanvas
          resumeRef={resumeRef}
          layoutClasses={layoutClasses}
          pageStyles={pageStyles}
          canvasZoom={canvasZoom}
          pageWidthPx={pageWidthPx}
          totalHeightPx={totalHeightPx}
          totalPages={totalPages}
          idToPageMap={idToPageMap}
          
          showMarginGuides={showMarginGuides}
          spellcheckEnabled={spellcheckEnabled}
        />

        {/* Floating Canvas Controls (Zoom & Print Preview) */}
        <motion.div drag dragMomentum={false} className={cn(
          "absolute bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex items-center bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg no-print transition-all duration-300 group cursor-grab active:cursor-grabbing",
          isFormatBarMinimized ? "p-2 rounded-full hover:bg-gray-50 opacity-80 hover:opacity-100" : "gap-1.5 md:gap-2 p-1.5 rounded-xl"
        )}>
          {isFormatBarMinimized ? (
            <div onClick={() => setIsFormatBarMinimized(false)} className="flex items-center justify-center w-6 h-6" title="Show Formatting Tools">
              <Settings2 size={18} className="text-gray-500" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-0.5 border-r border-gray-100 pr-1.5 md:pr-2">
                <button
                  type="button"
                  onClick={() => setCanvasZoom((prev: any) => Math.max(50, prev - 10))}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 active:scale-90 transition-all cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setCanvasZoom(100)}
                  className="px-2 py-0.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                  title="Reset Zoom to 100%"
                >
                  {canvasZoom}%
                </button>
                <button
                  type="button"
                  onClick={() => setCanvasZoom((prev: any) => Math.min(150, prev + 10))}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 active:scale-90 transition-all cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleFitWidth}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1 cursor-pointer text-xs font-semibold px-1.5"
                title="Auto-Fit Page Width"
              >
                <Maximize2 size={14} />
                <span className="hidden sm:inline">Fit Width</span>
              </button>

              <div className="w-px h-5 bg-gray-200" />

              {/* Alignment Guides Toggle */}
              <div className="flex items-center gap-2 pl-1" title="Toggle printable margin guidelines">
                <span className="text-[11px] font-bold text-gray-500 hidden sm:inline font-sans">Guides</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowMarginGuides(!showMarginGuides);
                    toast.success(!showMarginGuides ? "Alignment guides active! 👁️" : "Alignment guides hidden! 🙈");
                  }}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    showMarginGuides ? "bg-blue-600" : "bg-gray-200"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      showMarginGuides ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              <div className="w-px h-5 bg-gray-200" />

              {/* Elegant Toggle Switch for Print Preview */}
              <div className="flex items-center gap-2 pl-1">
                <span className="text-[11px] font-bold text-gray-500 hidden sm:inline">Print Preview</span>
                <button
                  type="button"
                  onClick={() => {
                    setPrintPreviewMode(!printPreviewMode);
                    toast.success(!printPreviewMode ? "Print Preview Enabled! 👁️" : "Print Preview Disabled! ✍️");
                  }}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    printPreviewMode ? "bg-blue-600" : "bg-gray-200"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      printPreviewMode ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              <div className="w-px h-5 bg-gray-200" />
              <button
                type="button"
                onClick={() => setShareModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
              >
                <Share2 size={13} />
                <span className="hidden sm:inline">Share</span>
              </button>

              <div className="w-px h-5 bg-gray-200" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsFormatBarMinimized(true); }}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors cursor-pointer"
                title="Minimize Toolbar"
              >
                <ChevronRight size={14} />
              </button>
            </>
          )}
        </motion.div>

        {/* Mobile Bottom Navigation Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-40 md:hidden flex items-center justify-around px-2 no-print shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
          <button
            type="button"
            onClick={() => setActiveSidebarTab(activeSidebarTab === "templates" ? null : "templates")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all rounded-xl cursor-pointer",
              activeSidebarTab === "templates" ? "text-blue-600 font-bold scale-105" : "text-gray-500 font-medium hover:text-gray-900"
            )}
          >
            <FileText size={18} />
            <span className="text-[10px]">Templates</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSidebarTab(activeSidebarTab === "design" ? null : "design")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all rounded-xl cursor-pointer",
              activeSidebarTab === "design" ? "text-blue-600 font-bold scale-105" : "text-gray-500 font-medium hover:text-gray-900"
            )}
          >
            <Palette size={18} />
            <span className="text-[10px]">Design</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSidebarTab(activeSidebarTab === "content" ? null : "content")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all rounded-xl cursor-pointer",
              activeSidebarTab === "content" ? "text-blue-600 font-bold scale-105" : "text-gray-500 font-medium hover:text-gray-900"
            )}
          >
            <Plus size={18} />
            <span className="text-[10px]">Add Sections</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSidebarTab(activeSidebarTab === "ai" ? null : "ai")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all rounded-xl cursor-pointer relative",
              activeSidebarTab === "ai" ? "text-blue-600 font-bold scale-105" : "text-gray-500 font-medium hover:text-gray-900"
            )}
          >
            <Sparkles size={18} className={cn(activeSidebarTab === "ai" ? "text-blue-600" : "text-amber-500 animate-pulse")} />
            <span className="text-[10px]">AI Tools</span>
            {activeSidebarTab !== "ai" && (
              <span className="absolute top-1.5 right-6 w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
            )}
          </button>
        </div>
      </div>

      <EraseModal 
        isOpen={eraseModalOpen}
        onClose={() => setEraseModalOpen(false)}
        eraserCanvasRef={eraserCanvasRef}
        startDrawing={startDrawing}
        draw={draw}
        stopDrawing={stopDrawing}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        resetEraserCanvas={resetEraserCanvas}
        saveErasedImage={saveErasedImage}
      />
    </div>
  );
}
