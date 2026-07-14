"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Reorder, useDragControls } from "motion/react";
import {
  GripVertical,
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { z } from "zod";
import AuthModal from "./AuthModal";
import { User } from "@supabase/supabase-js";

// --- Utility Functions ---
function hexToRgb(hex: string) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "244, 243, 243";
}

function shadeColor(hex: string, percent: number) {
  const f = parseInt(hex.slice(1), 16),
    t = percent < 0 ? 0 : 255,
    p = Math.abs(percent);
  const R = f >> 16,
    G = (f >> 8) & 0x00ff,
    B = f & 0x0000ff;
  const nR = Math.round(((t - R) * p) / 100) + R,
    nG = Math.round(((t - G) * p) / 100) + G,
    nB = Math.round(((t - B) * p) / 100) + B;
  return (
    "#" + (0x1000000 + nR * 0x10000 + nG * 0x100 + nB).toString(16).slice(1)
  );
}

const PRESET_AVATARS = [
  { id: "avatar-1", name: "Alex", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex" },
  { id: "avatar-2", name: "Jordan", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Jordan" },
  { id: "avatar-3", name: "Taylor", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Taylor" },
  { id: "avatar-4", name: "Morgan", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Morgan" },
  { id: "avatar-5", name: "Robin", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Robin" },
  { id: "avatar-6", name: "Sam", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sam" },
  { id: "avatar-7", name: "Casey", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Casey" },
  { id: "avatar-8", name: "Riley", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Riley" },
];

interface PageBreakGapProps {
  id: string;
  pageBreakElementIds: string[];
  gapHeights?: Record<string, { total: number; top: number }>;
  pageMargin: number;
}

const PageBreakGap = ({ id, pageBreakElementIds, gapHeights, pageMargin }: PageBreakGapProps) => {
  const isBreak = pageBreakElementIds.includes(id);
  if (!isBreak) return null;

  const pageIndex = pageBreakElementIds.indexOf(id) + 2;
  const gapInfo = gapHeights?.[id];
  const totalHeight = gapInfo ? gapInfo.total : (2 * pageMargin + 32);
  const topSpacer = gapInfo ? gapInfo.top : pageMargin;
  const bottomSpacer = pageMargin;

  return (
    <div
      className="page-break-gap no-print relative w-[calc(100%+2*var(--page-margin))] flex flex-col items-center justify-center pointer-events-none select-none z-10"
      style={{
        height: `${totalHeight}px`,
        marginLeft: "calc(-1 * var(--page-margin))",
        marginRight: "calc(-1 * var(--page-margin))",
      }}
    >
      {/* Top Margin Spacer */}
      <div style={{ height: `${topSpacer}px` }} />
      
      {/* 32px Physical Page Gap with Page Label */}
      <div className="h-[32px] w-full flex items-center justify-center relative">
        <div className="absolute left-0 right-0 h-[1px] bg-gray-300/40" />
        <span className="relative z-10 bg-gray-500/85 text-white font-sans text-[10px] font-bold px-2.5 py-0.5 rounded shadow-sm tracking-wide backdrop-blur-xs">
          Page {pageIndex}
        </span>
      </div>

      {/* Bottom Margin Spacer */}
      <div style={{ height: `${bottomSpacer}px` }} />
    </div>
  );
};

const TEMPLATES = [
  {
    id: "classic",
    name: "Classic Script",
    desc: "Warm handwritten headings over a soft neutral panel. A safe, personable all-rounder.",
    layout: "classic",
    heading: "'Kalam',cursive",
    body: "'Lora',serif",
    accent: "#3a353a",
    panel: "#f4f3f3",
    radius: 10,
    headingStyle: "bar",
    italic: true,
    headerAlign: "left",
    listStyle: "disc",
    pageMargin: 38,
    itemSpacing: 16,
    jobLayout: "stacked",
    paper: "#ffffff",
    boxOpacity: 100,
    boxShadow: "soft",
    borderStyle: "hairline",
    backdropBlur: 0,
  },
  {
    id: "modern",
    name: "Modern Sans",
    desc: "Clean geometric sans with an underline rule. Good for tech and product roles.",
    layout: "classic",
    heading: "'Poppins',sans-serif",
    body: "'Inter',sans-serif",
    accent: "#2f5d62",
    panel: "#eef3f2",
    radius: 6,
    headingStyle: "underline",
    italic: false,
    headerAlign: "left",
    listStyle: "square",
    pageMargin: 48,
    itemSpacing: 24,
    jobLayout: "split",
    paper: "#ffffff",
    boxOpacity: 90,
    boxShadow: "glass",
    borderStyle: "accent",
    backdropBlur: 8,
  },
  {
    id: "traditional",
    name: "Traditional Serif",
    desc: "Editorial serif pairing with plain headings. Reads formal and established.",
    layout: "classic",
    heading: "'Playfair Display',serif",
    body: "'Source Serif 4',serif",
    accent: "#4a3324",
    panel: "#f6f1ea",
    radius: 2,
    headingStyle: "plain",
    italic: true,
    headerAlign: "center",
    listStyle: "circle",
    pageMargin: 48,
    itemSpacing: 20,
    jobLayout: "split",
    paper: "#fdfbfa",
    boxOpacity: 95,
    boxShadow: "medium",
    borderStyle: "double",
    backdropBlur: 2,
  },
  {
    id: "minimal",
    name: "Minimal ATS-Safe",
    desc: "No color, no boxes, small caps headings. Built to parse cleanly in applicant tracking systems.",
    layout: "classic",
    heading: "Georgia,serif",
    body: "Georgia,serif",
    accent: "#000000",
    panel: "#ffffff",
    radius: 0,
    headingStyle: "smallcaps",
    italic: false,
    headerAlign: "center",
    listStyle: "disc",
    pageMargin: 38,
    itemSpacing: 16,
    jobLayout: "split",
    paper: "#ffffff",
    boxOpacity: 100,
    boxShadow: "none",
    borderStyle: "none",
    backdropBlur: 0,
  },
  {
    id: "sidebar-executive",
    name: "Sidebar Executive",
    desc: "Two-column layout: certifications, skills, and education in a side rail; summary and experience take the lead column.",
    layout: "sidebar",
    heading: "'Playfair Display',serif",
    body: "'Source Serif 4',serif",
    accent: "#2c3e50",
    panel: "#eef1f4",
    radius: 4,
    headingStyle: "plain",
    italic: false,
    headerAlign: "left",
    listStyle: "square",
    pageMargin: 32,
    itemSpacing: 24,
    jobLayout: "stacked",
    paper: "#ffffff",
    boxOpacity: 95,
    boxShadow: "medium",
    borderStyle: "hairline",
    backdropBlur: 4,
  },
  {
    id: "sidebar-fresh",
    name: "Sidebar Fresh",
    desc: "Two-column layout with a teal accent and rounded panels. Approachable and modern.",
    layout: "sidebar",
    heading: "'Poppins',sans-serif",
    body: "'Nunito Sans',sans-serif",
    accent: "#0f766e",
    panel: "#eafaf7",
    radius: 12,
    headingStyle: "bar",
    italic: false,
    headerAlign: "left",
    listStyle: "disc",
    pageMargin: 38,
    itemSpacing: 16,
    jobLayout: "stacked",
    paper: "#ffffff",
    boxOpacity: 85,
    boxShadow: "deep",
    borderStyle: "dashed",
    backdropBlur: 12,
  },
];

const TUTORIAL_STEPS = [
  {
    eyebrow: "Step 1 of 5",
    title: "Welcome to MYresume",
    body: "This whole page is your resume. There's no separate form — click directly on any text (like your name, up top) and start typing.",
  },
  {
    eyebrow: "Step 2 of 5",
    title: "Change the look anytime",
    body: "Open <b>🎨 Design</b> in the toolbar to swap templates, fonts, colors, spacing, or switch between a single-column and sidebar layout.",
  },
  {
    eyebrow: "Step 3 of 5",
    title: "Drag to reorder",
    body: "Grab the ⠿ handle on any section, job, bullet, or skill category to drag it into a new position.",
  },
  {
    eyebrow: "Step 4 of 5",
    title: "Add and remove freely",
    body: "Use the small <b>+</b> buttons to add sections, jobs, certifications, or bullets. Hover an item to reveal its <b>✕ remove</b> option.",
  },
  {
    eyebrow: "Step 5 of 5",
    title: "You're ready",
    body: "When it looks right, use <b>⬇ Export / Save as PDF</b> to print or save a PDF, or <b>💾 Save editable copy</b> to download an HTML file you can reopen and keep editing later.",
  },
];

// --- Subcomponents ---
const DragHandle = ({ dragControls }: { dragControls: any }) => (
  <span
    className="drag-handle inline-flex items-center justify-center w-5 h-5 rounded-md cursor-grab text-[var(--ink-soft)] text-sm bg-black/5 hover:bg-black/10 hover:text-[var(--ink)] active:cursor-grabbing font-sans shrink-0 select-none no-print"
    onPointerDown={(e) => dragControls.start(e)}
    title="Drag to reorder"
  >
    <GripVertical size={14} />
  </span>
);

const SaveResponseSchema = z.object({
  success: z.boolean(),
  code: z.string(),
  message: z.string().optional(),
  id: z.string().optional(),
});

interface DesignConfig {
  template: string;
  fontHeading: string;
  fontBody: string;
  accent: string;
  panel: string;
  paper: string;
  layout: string;
  scale: number;
  radius: number;
  lineHeight: number;
  gap: number;
  headingStyle: string;
  italic: boolean;
  pageSize: string;
  headerAlign: string;
  listStyle: string;
  pageMargin: number;
  itemSpacing: number;
  jobLayout: string;
  boxOpacity: number;
  boxShadow: string;
  borderStyle: string;
  backdropBlur: number;
}

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

export default function ResumeBuilder() {
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
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [designPanelOpen, setDesignPanelOpen] = useState(false);
  const [pageDrawerOpen, setPageDrawerOpen] = useState(false);

  // --- Design State ---
  const [design, setDesign] = useState<DesignConfig>(() => localDraft?.design ?? {
    template: "classic",
    fontHeading: "'Kalam',cursive",
    fontBody: "'Lora',serif",
    accent: "#3a353a",
    panel: "#f4f3f3",
    paper: "#ffffff",
    layout: "classic",
    scale: 100,
    radius: 10,
    lineHeight: 1.55,
    gap: 14,
    headingStyle: "bar",
    italic: true,
    pageSize: "letter",
    headerAlign: "left",
    listStyle: "disc",
    pageMargin: 38,
    itemSpacing: 16,
    jobLayout: "stacked",
    boxOpacity: 95,
    boxShadow: "soft",
    borderStyle: "hairline",
    backdropBlur: 4,
  });

  // --- Profile Photo State ---
  const [profilePhoto, setProfilePhoto] = useState<ProfilePhotoConfig>(() => localDraft?.profilePhoto ?? {
    enabled: false,
    url: "https://picsum.photos/seed/portrait/150/150",
    rawUploadedUrl: "",
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
  });

  const [eraseModalOpen, setEraseModalOpen] = useState(false);
  const [bgRemoveSensitivity, setBgRemoveSensitivity] = useState(40);
  const [bgRemoveColor, setBgRemoveColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(20);
  const isDrawingRef = useRef(false);
  const eraserCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load image onto eraser canvas when modal opens
  useEffect(() => {
    if (eraseModalOpen) {
      setTimeout(() => {
        const canvas = eraserCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = profilePhoto.rawUploadedUrl || profilePhoto.url;
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
        };
      }, 100);
    }
  }, [eraseModalOpen, profilePhoto.url, profilePhoto.rawUploadedUrl]);

  const getCoordinates = (e: any) => {
    const canvas = eraserCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: any) => {
    e.preventDefault();
    isDrawingRef.current = true;
    const coords = getCoordinates(e);
    if (!coords) return;
    const canvas = eraserCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.globalCompositeOperation = "destination-out";
    ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const draw = (e: any) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;
    const canvas = eraserCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalCompositeOperation = "destination-out";
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    const canvas = eraserCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.beginPath();
  };

  const resetEraserCanvas = () => {
    const canvas = eraserCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = profilePhoto.rawUploadedUrl || "https://picsum.photos/seed/portrait/150/150";
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(img, 0, 0);
    };
  };

  const saveErasedImage = () => {
    const canvas = eraserCanvasRef.current;
    if (!canvas) return;
    const resultUrl = canvas.toDataURL("image/png");
    setProfilePhoto((p: any) => ({
      ...p,
      url: resultUrl
    }));
    setEraseModalOpen(false);
    toast.success("Erase touch-up applied! 🎨");
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result as string;
      setProfilePhoto((p: any) => ({
        ...p,
        enabled: true,
        url: b64,
        rawUploadedUrl: b64,
      }));
      toast.success("Profile photo uploaded successfully!");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBackground = (targetColorHex: string, sensitivity: number) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = profilePhoto.rawUploadedUrl || profilePhoto.url;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      const rTarget = parseInt(targetColorHex.slice(1, 3), 16);
      const gTarget = parseInt(targetColorHex.slice(3, 5), 16);
      const bTarget = parseInt(targetColorHex.slice(5, 7), 16);
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        const a = data[i+3];
        if (a === 0) continue;
        const distance = Math.sqrt(
          Math.pow(r - rTarget, 2) +
          Math.pow(g - gTarget, 2) +
          Math.pow(b - bTarget, 2)
        );
        if (distance < sensitivity) {
          data[i+3] = 0;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      const resultUrl = canvas.toDataURL("image/png");
      setProfilePhoto((p: any) => ({
        ...p,
        url: resultUrl
      }));
      toast.success("Background color removed! 🪄");
    };
    img.onerror = () => {
      toast.error("Could not load image.");
    };
  };

  const handleAutoRemoveBackground = (sensitivity: number) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = profilePhoto.rawUploadedUrl || profilePhoto.url;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      const rTarget = data[0];
      const gTarget = data[1];
      const bTarget = data[2];
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        const a = data[i+3];
        if (a === 0) continue;
        const distance = Math.sqrt(
          Math.pow(r - rTarget, 2) +
          Math.pow(g - gTarget, 2) +
          Math.pow(b - bTarget, 2)
        );
        if (distance < sensitivity) {
          data[i+3] = 0;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      const resultUrl = canvas.toDataURL("image/png");
      setProfilePhoto((p: any) => ({
        ...p,
        url: resultUrl
      }));
      toast.success("Background auto-removed! ✨");
    };
    img.onerror = () => {
      toast.error("Could not load image.");
    };
  };



  const getCSSFilterString = (
    filter: string,
    tone: string,
    brightness: number = 100,
    contrast: number = 100,
    saturation: number = 100,
    blurVal: number = 0,
    hueRotateVal: number = 0,
    sepiaVal: number = 0
  ) => {
    let f = "";
    if (filter === "color-punch") {
      f += "contrast(1.35) saturate(1.4) brightness(1.05) ";
    } else if (filter === "golden-hour") {
      f += "sepia(0.25) saturate(1.2) brightness(1.1) hue-rotate(-5deg) ";
    } else if (filter === "portrait") {
      f += "contrast(0.92) saturate(1.05) brightness(1.05) blur(0.2px) ";
    } else if (filter === "shadow") {
      f += "brightness(0.85) contrast(1.15) saturate(0.95) ";
    } else if (filter === "sunbath") {
      f += "sepia(0.18) saturate(1.5) brightness(1.18) hue-rotate(5deg) ";
    }
    if (tone === "grayscale") {
      f += "grayscale(1) ";
    } else if (tone === "darken") {
      f += "brightness(0.7) contrast(1.1) ";
    } else if (tone === "tint") {
      f += "sepia(0.35) hue-rotate(140deg) saturate(1.2) ";
    } else if (tone === "colorize") {
      f += "sepia(0.5) hue-rotate(320deg) saturate(1.8) brightness(0.95) ";
    } else if (tone === "duotone") {
      f += "grayscale(1) contrast(1.2) brightness(0.9) sepia(0.5) hue-rotate(180deg) saturate(2) ";
    }

    if (brightness !== 100) f += `brightness(${brightness}%) `;
    if (contrast !== 100) f += `contrast(${contrast}%) `;
    if (saturation !== 100) f += `saturate(${saturation}%) `;
    if (blurVal > 0) f += `blur(${blurVal}px) `;
    if (hueRotateVal > 0) f += `hue-rotate(${hueRotateVal}deg) `;
    if (sepiaVal > 0) f += `sepia(${sepiaVal}%) `;

    return f.trim() || undefined;
  };

  // --- Content State ---
  const [name, setName] = useState(() => localDraft?.name ?? "YOUR NAME");
  const [contactLine, setContactLine] = useState(() => localDraft?.contactLine ??
    'City, State ZIP <span class="text-[var(--hairline)] mx-2">|</span> (555) 123-4567 <span class="text-[var(--hairline)] mx-2">|</span> your.email@example.com'
  );
  const [summary, setSummary] = useState(() => localDraft?.summary ??
    "A two-to-three sentence pitch: your title/field, years of experience, and the kind of impact you make. Write it last — it's easiest once the rest of the resume is filled in."
  );
  const [footer, setFooter] = useState(() => localDraft?.footer ?? "Your Name");

  // --- History & Undo/Redo State ---
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isHistoryActionRef = useRef(false);
  const historyRef = useRef<any[]>([]);
  const historyIndexRef = useRef<number>(-1);

  // Synchronize history refs for keyboard events & stable callbacks
  useEffect(() => {
    historyRef.current = history;
    historyIndexRef.current = historyIndex;
  }, [history, historyIndex]);

  const [sections, setSections] = useState<any[]>(() => localDraft?.sections ?? [
    { id: "summary" },
    { id: "licenses" },
    { id: "skills" },
    { id: "experience" },
    { id: "education" },
  ]);
  const [manualBreaks, setManualBreaks] = useState<Record<string, boolean>>(() => localDraft?.manualBreaks ?? {});

  const [licenses, setLicenses] = useState<any[]>(() => localDraft?.licenses ?? [
    {
      id: "lic-1",
      text: "<b>Credential Name</b> — Issuing Organization (Expires: Month Year)",
    },
    {
      id: "lic-2",
      text: "<b>Second Credential</b> — Issuing Organization (Expires: Month Year)",
    },
  ]);

  const [skills, setSkills] = useState<any[]>(() => localDraft?.skills ?? [
    {
      id: "sk-1",
      title: "Core Skills",
      items: "List 4–6 of your strongest, most relevant skills here.",
    },
    {
      id: "sk-2",
      title: "Tools & Software",
      items: "List the platforms, tools, or systems you're proficient in.",
    },
  ]);

  const [experiences, setExperiences] = useState<any[]>(() => localDraft?.experiences ?? [
    {
      id: "exp-1",
      title: "Job Title | Company Name – City, State",
      date: "Month Year – Present",
      bullets: [
        {
          id: "b-1",
          text: "Describe a key responsibility or achievement, ideally with a measurable result.",
        },
        {
          id: "b-2",
          text: "Add a second bullet focused on impact rather than just duties.",
        },
      ],
      meta: "Optional details: team size, tools used, scope, or scale — delete this line if you don't need it.",
    },
    {
      id: "exp-2",
      title: "Previous Job Title | Previous Company – City, State",
      date: "Month Year – Month Year",
      bullets: [
        {
          id: "b-3",
          text: "Describe a key responsibility or achievement, ideally with a measurable result.",
        },
        {
          id: "b-4",
          text: "Add a second bullet focused on impact rather than just duties.",
        },
      ],
      meta: "",
    },
  ]);

  const [educations, setEducations] = useState<any[]>(() => localDraft?.educations ?? [
    {
      id: "edu-1",
      degree: "Degree | School Name – City, State",
      bullets: [
        { id: "eb-1", text: "Graduation: Month Year" },
        { id: "eb-2", text: "Optional: honors, GPA, or relevant coursework" },
      ],
    },
  ]);

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
  const [activeSidebarTab, setActiveSidebarTab] = useState<string | null>(
    "templates",
  );

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

  // --- Groq AI Assistant State & Methods ---
  const [aiInput, setAiInput] = useState("");
  const [aiOutput, setAiOutput] = useState("");
  const [aiIsGenerating, setAiIsGenerating] = useState(false);
  const [aiPresetType, setAiPresetType] = useState<"summary" | "bullets" | "custom" | "parser">("summary");

  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to use AI assistant features.");
      setAuthModalOpen(true);
      return;
    }

    if (!aiInput.trim()) {
      toast.error("Please enter some text or context for the AI.");
      return;
    }

    setAiIsGenerating(true);
    setAiOutput("");

    try {
      // 1. Get current supabase session to obtain JWT
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error("Unable to retrieve authentication session. Please sign in again.");
      }

      // 2. Formulate prompts based on active preset
      let systemPrompt = "You are a professional resume writer.";
      if (aiPresetType === "summary") {
        systemPrompt = "You are an elite, professional resume-writing assistant. Refine, improve, or suggest professional phrasing for the user's summary. Make it impact-driven, professional, and clear. Do NOT use generic buzzwords or fluff. Return ONLY the polished summary text. Do not include any introduction, conversational chat, greeting, or outer quotes.";
      } else if (aiPresetType === "bullets") {
        systemPrompt = "You are an elite resume editor. Rewrite the user's raw experience or bullet points into highly professional, action-oriented bullet points using the STAR method (Situation, Task, Action, Result). Use strong, metric-focused active verbs. Start each line with a bullet symbol (•) or a clean list format. Return ONLY the updated bullet points. Do not write introductory or conversational text.";
      } else {
        systemPrompt = "You are an expert resume writer. Help the user with their custom request regarding their resume content. Be concise, impact-oriented, and return ONLY the relevant rewritten resume text or direct suggestions without any conversational chat.";
      }

      // 3. Make fetch request to our server proxy
      const response = await fetch("/api/groq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: aiInput,
          systemPrompt,
          temperature: 0.4
        })
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "Failed to generate text from Groq API.");
      }

      setAiOutput(resData.text);
      toast.success("AI suggestions generated successfully! ✨");
    } catch (err: any) {
      toast.error(err.message || "An error occurred during AI generation");
    } finally {
      setAiIsGenerating(false);
    }
  };

  const handleParseResume = async (rawText: string) => {
    if (!user) {
      toast.error("Please log in to use AI assistant features.");
      setAuthModalOpen(true);
      return;
    }

    setAiIsGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Unauthorized");

      const response = await fetch("/api/resume/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ rawText })
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) throw new Error(resData.error || "Failed to parse");

      const { data } = resData;
      if (data.name) setName(data.name);
      if (data.summary) setSummary(data.summary);
      if (data.experiences) setExperiences(data.experiences);
      if (data.educations) setEducations(data.educations);
      if (data.skills) setSkills([data.skills]);
      
      toast.success("Resume parsed and applied! ✨");
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setAiIsGenerating(false);
    }
  };

  const fetchMyResumes = async () => {
    try {
      const { data, error } = await supabase
        .from("resumes")
        .select("id, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      setMyResumes(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadResumeFromCloud = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("resumes")
        .select("content")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (data && data.content) {
        const c = data.content as any;
        isHistoryActionRef.current = true;

        const loadedName = c.name !== undefined ? c.name : "YOUR NAME";
        const loadedContactLine = c.contactLine !== undefined ? c.contactLine : 'City, State ZIP <span class="text-[var(--hairline)] mx-2">|</span> (555) 123-4567 <span class="text-[var(--hairline)] mx-2">|</span> your.email@example.com';
        const loadedSummary = c.summary !== undefined ? c.summary : "A two-to-three sentence pitch: your title/field, years of experience, and the kind of impact you make. Write it last — it's easiest once the rest of the resume is filled in.";
        const loadedFooter = c.footer !== undefined ? c.footer : "Your Name";

        if (c.name !== undefined) setName(c.name);
        if (c.contactLine !== undefined) setContactLine(c.contactLine);
        if (c.summary !== undefined) setSummary(c.summary);
        if (c.footer !== undefined) setFooter(c.footer);
        if (c.design) setDesign(c.design);
        if (c.sections) setSections(c.sections);
        if (c.manualBreaks) setManualBreaks(c.manualBreaks);
        if (c.licenses) setLicenses(c.licenses);
        if (c.skills) setSkills(c.skills);
        if (c.experiences) setExperiences(c.experiences);
        if (c.educations) setEducations(c.educations);
        if (c.profilePhoto) setProfilePhoto(c.profilePhoto);

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
        };
        setHistory([loadedSnapshot]);
        setHistoryIndex(0);
      }
    } catch (err: any) {
      toast.error("Failed to load resume: " + err.message);
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
        setHistoryIndex(nextIndex);
      }
    }
  }, []);

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
    const handleBeforeUnload = () => {
      if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
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
    };

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("resume_autosave_content", JSON.stringify(trimmedPayload));
      } catch (e) {
        console.error("Failed to save to localStorage, likely quota exceeded:", e);
      }
    }
    
    // Backend autosave if logged in
    if (user) {
        const saveToBackend = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return;
            
            await fetch("/api/resume/save", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    id: resumeId, // Need to track this ID
                    content: trimmedPayload,
                    status: 'active',
                    clientId: 'web'
                })
            });
        };
        // Debounce this!
        const timer = setTimeout(saveToBackend, 2000);
        return () => clearTimeout(timer);
    }

    if (isHistoryActionRef.current) {
      isHistoryActionRef.current = false;
      return;
    }

    setHistory((prev) => {
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
    if (id) {
      setTimeout(() => {
        setResumeId(id);
        loadResumeFromCloud(id);
      }, 0);
    }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out");
  };

  const handleSaveToCloud = async () => {
    if (!clientId) return;
    setIsSaving(true);

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
    };

    try {
      const { data, error } = await supabase.rpc("save_resume", {
        p_id: resumeId || null,
        p_content: payload,
        p_client_id: clientId,
      });

      if (error) throw error;

      // Zod validation of RPC response based on Strict distributed systems constraints
      const parsed = SaveResponseSchema.parse(data);

      if (!parsed.success) {
        if (parsed.code === "RATE_LIMIT") {
          toast.error("⚠️ " + (parsed.message || "Rate limit exceeded"));
        } else {
          toast.error("⚠️ Error: " + parsed.code);
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
      }
    } catch (err: any) {
      console.error("Save failed", err);
      toast.error("Failed to save to cloud");
    } finally {
      setIsSaving(false);
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
        setFormatBar((p) => ({ ...p, visible: false }));
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
        setFormatBar((p) => ({ ...p, visible: false }));
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
    setFormatBar((p) => ({
      ...p,
      active: {
        b: document.queryCommandState("bold"),
        i: document.queryCommandState("italic"),
        u: document.queryCommandState("underline"),
      },
    }));
  };

  // --- Page Breaks Calculation ---
  const [gapHeights, setGapHeights] = useState<Record<string, { total: number; top: number }>>({});
  const [pageBreaks, setPageBreaks] = useState<number[]>([]);
  const [pageBreakElementIds, setPageBreakElementIds] = useState<string[]>([]);
  const pageBreakElementIdsRef = useRef<string[]>([]);

  useEffect(() => {
    pageBreakElementIdsRef.current = pageBreakElementIds;
  }, [pageBreakElementIds]);

  const resumeRef = useRef<HTMLDivElement>(null);

  const calcPages = useCallback(() => {
    if (!resumeRef.current) return;
    const resume = resumeRef.current;
    const pageHeightPx = design.pageSize === "letter" ? 1056 : 1123;
    const marginPx = design.pageMargin;
    const contentHeightPx = pageHeightPx - marginPx * 2;
    const resumeRect = resume.getBoundingClientRect();
    const units = Array.from(
      resume.querySelectorAll(
        ".header, .section-heading, .summary, .bullet-list, .skills-grid, .exp-entry, .edu-entry",
      ),
    ) as HTMLElement[];

    if (units.length === 0) {
      setPageBreaks([]);
      setPageBreakElementIds([]);
      setGapHeights({});
      return;
    }

    const gaps = Array.from(resume.querySelectorAll(".page-break-gap")) as HTMLElement[];
    const currentIds = pageBreakElementIdsRef.current;

    let shift = 0;
    let gapIdx = 0;

    const naturalCoords = units.map((el) => {
      const id = el.getAttribute("data-page-break-id");
      if (id && currentIds.includes(id)) {
        const gapEl = gaps[gapIdx];
        const height = gapEl ? gapEl.getBoundingClientRect().height : (2 * marginPx + 32);
        shift += height;
        gapIdx++;
      }

      const rect = el.getBoundingClientRect();
      const elTop = rect.top - shift;
      const elBottom = rect.bottom - shift;

      return {
        el,
        id,
        rect,
        elTop,
        elBottom,
      };
    });

    let pageStartY: number | null = null;
    let pageStartY_initial: number | null = null;
    const breakStarts: { el: HTMLElement; id: string | null; elTop: number; elBottom: number }[] = [];

    naturalCoords.forEach((item, i) => {
      const { el, id, elTop, elBottom } = item;

      if (pageStartY === null) {
        pageStartY = elTop;
        pageStartY_initial = elTop;
        return;
      }

      const section = el.closest(".section");
      const isHeading = el.classList.contains("section-heading");
      const manualBreakHere =
        isHeading && section && section.classList.contains("manual-break");
      const prevItem = naturalCoords[i - 1];
      const coupledWithHeading =
        !isHeading &&
        prevItem &&
        prevItem.el.classList.contains("section-heading") &&
        prevItem.el.closest(".section") === section;

      const checkTop = coupledWithHeading ? prevItem.elTop : elTop;
      const wouldOverflow = elBottom - pageStartY > contentHeightPx;

      if ((manualBreakHere || wouldOverflow) && checkTop !== pageStartY) {
        pageStartY = checkTop;
        const breakItem = coupledWithHeading ? prevItem : item;
        
        if (breakStarts.length === 0 || breakStarts[breakStarts.length - 1].el !== breakItem.el) {
          breakStarts.push({
            el: breakItem.el,
            id: breakItem.id,
            elTop: breakItem.elTop,
            elBottom: breakItem.elBottom,
          });
        }
      }
    });

    const newBreakIds = breakStarts
      .map((item) => item.id)
      .filter(Boolean) as string[];

    const newGapHeights: Record<string, { total: number; top: number }> = {};
    breakStarts.forEach((br, idx) => {
      const brId = br.id;
      if (!brId) return;

      const brIndex = naturalCoords.findIndex((item) => item.el === br.el);
      const prevItem = brIndex > 0 ? naturalCoords[brIndex - 1] : null;

      const prevActualBottomInPage = prevItem 
        ? (prevItem.rect.bottom - resumeRect.top) 
        : marginPx;

      const sheetBottom = (idx + 1) * pageHeightPx + idx * 32;
      const topSpacer = Math.max(0, sheetBottom - prevActualBottomInPage);
      const total = topSpacer + 32 + marginPx;

      newGapHeights[brId] = { total, top: topSpacer };
    });

    const newBreaks = breakStarts.map((item) => {
      return item.elTop - (pageStartY_initial ?? 0);
    });

    setPageBreaks((prev) => {
      if (
        prev.length === newBreaks.length &&
        prev.every((v, i) => v === newBreaks[i])
      ) {
        return prev;
      }
      return newBreaks;
    });

    setPageBreakElementIds((prev) => {
      if (
        prev.length === newBreakIds.length &&
        prev.every((v, i) => v === newBreakIds[i])
      ) {
        return prev;
      }
      return newBreakIds;
    });

    setGapHeights((prev) => {
      const keys = Object.keys(newGapHeights);
      const prevKeys = Object.keys(prev);
      if (keys.length !== prevKeys.length) {
        return newGapHeights;
      }
      const isDifferent = keys.some(
        (k) =>
          prev[k]?.total !== newGapHeights[k]?.total ||
          prev[k]?.top !== newGapHeights[k]?.top
      );
      if (isDifferent) {
        return newGapHeights;
      }
      return prev;
    });
  }, [design.pageSize, design.pageMargin]);

  useEffect(() => {
    calcPages();
    const observer = new MutationObserver(calcPages);
    if (resumeRef.current)
      observer.observe(resumeRef.current, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    window.addEventListener("resize", calcPages);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", calcPages);
    };
  }, [calcPages]);

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
    "--text-scale": design.scale / 100,
    "--line-height": design.lineHeight,
    "--section-gap": `${design.gap}px`,
    "--item-spacing": `${design.itemSpacing}px`,
    "--list-style": design.listStyle,
    "--page-width": design.pageSize === "letter" ? "816px" : "794px",
    "--page-height": design.pageSize === "letter" ? "1056px" : "1123px",
    "--page-margin": `${design.pageMargin}px`,
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
  const SectionWrapper = ({ id, item, children }: any) => {
    const dragControls = useDragControls();
    return (
      <Reorder.Item
        value={item}
        id={id}
        dragListener={false}
        dragControls={dragControls}
        data-section={id}
        className={cn(
          "section mt-0 relative",
          manualBreaks[id] && "manual-break",
        )}
      >
        <PageBreakGap id={`heading-${id}`} pageBreakElementIds={pageBreakElementIds} gapHeights={gapHeights} pageMargin={design.pageMargin} />
        <div
          className="section-heading font-[family:var(--font-heading)] font-bold text-base tracking-wide text-[var(--ink)] rounded-[var(--radius)] py-2 px-6 mt-3.5 mb-[var(--section-gap)] flex items-center justify-between gap-2 print:!shadow-none print:!border-none print:!bg-transparent print-break-after-avoid transition-all duration-300"
          data-page-break-id={`heading-${id}`}
          style={{
            backgroundColor: "var(--panel-dark-rgba)",
            border: "var(--box-border)",
            boxShadow: "var(--box-shadow)",
            backdropFilter: "blur(var(--backdrop-blur))",
            WebkitBackdropFilter: "blur(var(--backdrop-blur))",
            breakBefore: pageBreakElementIds.includes(`heading-${id}`) ? "page" : "auto",
          }}
        >
          <div className="heading-left flex items-center gap-2">
            <DragHandle dragControls={dragControls} />
            {id === "summary" && "Professional Summary"}
            {id === "licenses" && "Certifications & Licenses"}
            {id === "skills" && "Skills"}
            {id === "experience" && "Professional Experience"}
            {id === "education" && "Education"}
          </div>
          <div className="heading-left flex items-center gap-2">
            <button
              onClick={() => setManualBreaks((p) => ({ ...p, [id]: !p[id] }))}
              className={cn(
                "font-sans text-[10px] font-bold tracking-normal bg-transparent border border-[var(--hairline)] rounded-md px-2 py-1 cursor-pointer no-print",
                manualBreaks[id]
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                  : "text-[var(--ink-soft)]",
              )}
              title="Force this section to start a new printed page"
            >
              ⤓ break
            </button>
            {id === "licenses" && (
              <button
                className="font-sans text-[10px] font-bold bg-[var(--accent)] text-white border-none rounded-md px-2 py-1 cursor-pointer no-print"
                onClick={() =>
                  setLicenses([
                    ...licenses,
                    {
                      id: Date.now().toString(),
                      text: "<b>New Credential</b> — Issuing Organization",
                    },
                  ])
                }
              >
                + add
              </button>
            )}
            {id === "skills" && (
              <button
                className="font-sans text-[10px] font-bold bg-[var(--accent)] text-white border-none rounded-md px-2 py-1 cursor-pointer no-print"
                onClick={() =>
                  setSkills([
                    ...skills,
                    {
                      id: Date.now().toString(),
                      title: "New Category",
                      items: "List skills here",
                    },
                  ])
                }
              >
                + category
              </button>
            )}
            {id === "experience" && (
              <button
                className="font-sans text-[10px] font-bold bg-[var(--accent)] text-white border-none rounded-md px-2 py-1 cursor-pointer no-print"
                onClick={() =>
                  setExperiences([
                    ...experiences,
                    {
                      id: Date.now().toString(),
                      title: "New Job | Company",
                      date: "Date",
                      bullets: [
                        { id: Date.now().toString(), text: "New bullet" },
                      ],
                      meta: "",
                    },
                  ])
                }
              >
                + position
              </button>
            )}
            {id === "education" && (
              <button
                className="font-sans text-[10px] font-bold bg-[var(--accent)] text-white border-none rounded-md px-2 py-1 cursor-pointer no-print"
                onClick={() =>
                  setEducations([
                    ...educations,
                    {
                      id: Date.now().toString(),
                      degree: "Degree | School",
                      bullets: [
                        { id: Date.now().toString(), text: "New bullet" },
                      ],
                    },
                  ])
                }
              >
                + entry
              </button>
            )}
          </div>
        </div>
        {children}
      </Reorder.Item>
    );
  };

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
          >
            <Underline size={14} />
          </button>
          <div className="w-px h-4 bg-[#4d3f52] mx-1"></div>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              document.execCommand("removeFormat");
            }}
            className="p-1.5 rounded-md hover:bg-[#33303a] text-gray-400"
            title="Clear formatting"
          >
            <Eraser size={14} />
          </button>
        </div>
      )}

      {/* Tutorial Overlay */}
      {tutorialOpen && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 font-sans no-print backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-[440px] p-6 shadow-2xl">
            <div className="text-[11px] font-bold tracking-widest text-gray-500 uppercase mb-1">
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
              <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                <input type="checkbox" /> Don&apos;t show this again
              </label>
              <div className="flex gap-2">
                {tutorialStep > 0 && (
                  <button
                    onClick={() => setTutorialStep((p) => p - 1)}
                    className="rounded-lg px-4 py-2 text-sm font-semibold border border-gray-200 hover:bg-gray-50"
                  >
                    Back
                  </button>
                )}
                {tutorialStep < TUTORIAL_STEPS.length - 1 ? (
                  <button
                    onClick={() => setTutorialStep((p) => p + 1)}
                    className="rounded-lg px-4 py-2 text-sm font-semibold bg-gray-900 text-white hover:bg-black"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={() => setTutorialOpen(false)}
                    className="rounded-lg px-4 py-2 text-sm font-semibold bg-gray-900 text-white hover:bg-black"
                  >
                    Let&apos;s go
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Left Navigation */}
      <div className="fixed bottom-0 left-0 right-0 h-16 md:h-screen md:relative w-full md:w-20 bg-white border-t md:border-t-0 md:border-r border-gray-200 flex flex-row md:flex-col items-center justify-around md:justify-start py-1 md:py-4 z-40 no-print shrink-0 shadow-sm">
        <div className="hidden md:flex font-[family:'Kalam',cursive] font-bold text-lg mb-8 text-gray-800 w-10 h-10 items-center justify-center bg-gray-100 rounded-xl">
          M
        </div>

        <button
          onClick={() =>
            setActiveSidebarTab(
              activeSidebarTab === "templates" ? null : "templates",
            )
          }
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 w-14 h-12 md:w-16 md:h-auto md:py-3 rounded-xl md:mb-2 transition-all hover:bg-gray-100",
            activeSidebarTab === "templates" && "bg-gray-100 text-blue-600",
          )}
        >
          <FileText size={20} />
          <span className="text-[10px] font-medium">Templates</span>
        </button>
        <button
          onClick={() =>
            setActiveSidebarTab(activeSidebarTab === "design" ? null : "design")
          }
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 w-14 h-12 md:w-16 md:h-auto md:py-3 rounded-xl md:mb-2 transition-all hover:bg-gray-100",
            activeSidebarTab === "design" && "bg-gray-100 text-blue-600",
          )}
        >
          <Palette size={20} />
          <span className="text-[10px] font-medium">Design</span>
        </button>
        <button
          onClick={() =>
            setActiveSidebarTab(
              activeSidebarTab === "content" ? null : "content",
            )
          }
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 w-14 h-12 md:w-16 md:h-auto md:py-3 rounded-xl md:mb-2 transition-all hover:bg-gray-100",
            activeSidebarTab === "content" && "bg-gray-100 text-blue-600",
          )}
        >
          <Plus size={20} />
          <span className="text-[10px] font-medium">Add</span>
        </button>
        <button
          onClick={() =>
            setActiveSidebarTab(
              activeSidebarTab === "photo" ? null : "photo",
            )
          }
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 w-14 h-12 md:w-16 md:h-auto md:py-3 rounded-xl md:mb-2 transition-all hover:bg-gray-100",
            activeSidebarTab === "photo" && "bg-gray-100 text-blue-600",
          )}
        >
          <ImageIcon size={20} />
          <span className="text-[10px] font-medium">Photo</span>
        </button>
        <button
          onClick={() =>
            setActiveSidebarTab(
              activeSidebarTab === "ai" ? null : "ai",
            )
          }
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 w-14 h-12 md:w-16 md:h-auto md:py-3 rounded-xl md:mb-2 transition-all hover:bg-gray-100",
            activeSidebarTab === "ai" && "bg-gray-100 text-blue-600",
          )}
        >
          <Sparkles size={20} className={cn(activeSidebarTab === "ai" ? "text-blue-600" : "text-amber-500 animate-pulse")} />
          <span className="text-[10px] font-medium">AI Tools</span>
        </button>

        <div className="md:mt-auto flex flex-row md:flex-col items-center gap-2">
          <button
            onClick={() => setTutorialOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 w-14 h-12 md:w-16 md:h-auto md:py-2 rounded-xl transition-all hover:bg-gray-100 text-gray-500 hover:text-gray-900"
          >
            <HelpCircle size={18} />
          </button>

          <div className="relative">
            <button
              onClick={() =>
                setActiveSidebarTab(
                  activeSidebarTab === "account" ? null : "account",
                )
              }
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-14 h-12 md:w-16 md:h-auto md:py-2 rounded-xl transition-all hover:bg-gray-100",
                activeSidebarTab === "account"
                  ? "bg-gray-100 text-blue-600"
                  : "text-gray-500 hover:text-gray-900",
              )}
            >
              {user ? (
                <div className="w-8 h-8 rounded-full overflow-hidden border border-blue-200 bg-blue-50 flex items-center justify-center">
                  <img
                    src={user.user_metadata?.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex"}
                    alt="User avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 border border-gray-300 flex items-center justify-center">
                  <UserIcon size={18} />
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Sidebar */}
      {activeSidebarTab && (
        <div className="fixed inset-x-0 bottom-16 top-14 md:relative md:inset-auto md:top-0 md:h-full md:w-80 bg-white border-t md:border-t-0 md:border-r border-gray-200 z-30 flex flex-col overflow-hidden no-print shrink-0 shadow-sm transition-all duration-300">
          {/* Templates Panel */}
          {activeSidebarTab === "templates" && (
            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                  Templates
                </h2>
                <button
                  onClick={() => setActiveSidebarTab(null)}
                  className="md:hidden text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => applyTemplate(t)}
                    className={cn(
                      "text-left p-4 rounded-xl border-2 transition-all hover:border-gray-300 hover:bg-gray-50",
                      design.template === t.id
                        ? "border-blue-500 bg-blue-50/30"
                        : "border-gray-100 bg-white",
                    )}
                  >
                    <div className="font-bold text-gray-900 mb-1">{t.name}</div>
                    <div className="text-xs text-gray-500 leading-snug">
                      {t.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Design Panel */}
          {activeSidebarTab === "design" && (
            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                  Design Settings
                </h2>
                <button
                  onClick={() => setActiveSidebarTab(null)}
                  className="md:hidden text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-900">
                    Typography
                  </h3>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                      Heading Font
                    </label>
                    <select
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={design.fontHeading}
                      onChange={(e) =>
                        setDesign((p) => ({
                          ...p,
                          fontHeading: e.target.value,
                        }))
                      }
                    >
                      <option value="'Kalam',cursive">Kalam</option>
                      <option value="'Playfair Display',serif">Playfair</option>
                      <option value="'Poppins',sans-serif">Poppins</option>
                      <option value="Georgia,serif">Georgia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                      Body Font
                    </label>
                    <select
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={design.fontBody}
                      onChange={(e) =>
                        setDesign((p) => ({ ...p, fontBody: e.target.value }))
                      }
                    >
                      <option value="'Lora',serif">Lora</option>
                      <option value="'Inter',sans-serif">Inter</option>
                      <option value="'Source Serif 4',serif">
                        Source Serif 4
                      </option>
                      <option value="Georgia,serif">Georgia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                      Text Size
                    </label>
                    <input
                      type="range"
                      min="85"
                      max="130"
                      className="w-full accent-blue-600"
                      value={design.scale}
                      onChange={(e) =>
                        setDesign((p) => ({
                          ...p,
                          scale: parseInt(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-900">
                    Colors
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                        Accent
                      </label>
                      <input
                        type="color"
                        className="w-full h-8 rounded cursor-pointer border-0 p-0"
                        value={design.accent}
                        onChange={(e) =>
                          setDesign((p) => ({ ...p, accent: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                        Panel
                      </label>
                      <input
                        type="color"
                        className="w-full h-8 rounded cursor-pointer border-0 p-0"
                        value={design.panel}
                        onChange={(e) =>
                          setDesign((p) => ({ ...p, panel: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                        Paper
                      </label>
                      <input
                        type="color"
                        className="w-full h-8 rounded cursor-pointer border-0 p-0"
                        value={design.paper}
                        onChange={(e) =>
                          setDesign((p) => ({ ...p, paper: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-900">
                    Layout & Spacing
                  </h3>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                      Layout Style
                    </label>
                    <select
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={design.layout}
                      onChange={(e) =>
                        setDesign((p) => ({ ...p, layout: e.target.value }))
                      }
                    >
                      <option value="classic">Single Column</option>
                      <option value="sidebar">Sidebar Layout</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                      Job Style
                    </label>
                    <select
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={design.jobLayout}
                      onChange={(e) =>
                        setDesign((p) => ({ ...p, jobLayout: e.target.value }))
                      }
                    >
                      <option value="stacked">Stacked</option>
                      <option value="split">Split (Dates Right)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                      Heading Style
                    </label>
                    <select
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={design.headingStyle}
                      onChange={(e) =>
                        setDesign((p) => ({
                          ...p,
                          headingStyle: e.target.value,
                        }))
                      }
                    >
                      <option value="bar">Color Bar</option>
                      <option value="underline">Underlined</option>
                      <option value="plain">Plain Text</option>
                      <option value="smallcaps">Small Caps</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                      Corner Radius
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="24"
                      className="w-full accent-blue-600"
                      value={design.radius}
                      onChange={(e) =>
                        setDesign((p) => ({
                          ...p,
                          radius: parseInt(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                      Section Gap
                    </label>
                    <input
                      type="range"
                      min="4"
                      max="40"
                      step="2"
                      className="w-full accent-blue-600"
                      value={design.gap}
                      onChange={(e) =>
                        setDesign((p) => ({
                          ...p,
                          gap: parseInt(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                      Item Spacing
                    </label>
                    <input
                      type="range"
                      min="4"
                      max="40"
                      step="2"
                      className="w-full accent-blue-600"
                      value={design.itemSpacing}
                      onChange={(e) =>
                        setDesign((p) => ({
                          ...p,
                          itemSpacing: parseInt(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                      Page Margin
                    </label>
                    <input
                      type="range"
                      min="20"
                      max="80"
                      className="w-full accent-blue-600"
                      value={design.pageMargin}
                      onChange={(e) =>
                        setDesign((p) => ({
                          ...p,
                          pageMargin: parseInt(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                    Boxes & Premium Effects
                  </h3>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        Box Opacity ({design.boxOpacity}%)
                      </label>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      className="w-full accent-blue-600"
                      value={design.boxOpacity}
                      onChange={(e) =>
                        setDesign((p) => ({
                          ...p,
                          boxOpacity: parseInt(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                      Box Shadow (Depth)
                    </label>
                    <select
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={design.boxShadow}
                      onChange={(e) =>
                        setDesign((p) => ({ ...p, boxShadow: e.target.value }))
                      }
                    >
                      <option value="none">None (Flat)</option>
                      <option value="soft">Soft (Premium)</option>
                      <option value="medium">Medium Depth</option>
                      <option value="deep">Deep Accent</option>
                      <option value="glass">Glass Reflection</option>
                      <option value="neon">Neon Ambient</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                      Border Style
                    </label>
                    <select
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={design.borderStyle}
                      onChange={(e) =>
                        setDesign((p) => ({ ...p, borderStyle: e.target.value }))
                      }
                    >
                      <option value="none">No Border</option>
                      <option value="hairline">Thin Hairline</option>
                      <option value="accent">Accent Tint</option>
                      <option value="dashed">Dashed Accent</option>
                      <option value="double">Double Border</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        Backdrop Blur ({design.backdropBlur}px)
                      </label>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="24"
                      className="w-full accent-blue-600"
                      value={design.backdropBlur}
                      onChange={(e) =>
                        setDesign((p) => ({
                          ...p,
                          backdropBlur: parseInt(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Content Panel */}
          {activeSidebarTab === "content" && (
            <div className="flex-1 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                  Add Content
                </h2>
                <button
                  onClick={() => setActiveSidebarTab(null)}
                  className="md:hidden text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() =>
                    setExperiences([
                      ...experiences,
                      {
                        id: Date.now().toString(),
                        title: "Job Title",
                        date: "Date",
                        bullets: [
                          { id: Date.now().toString(), text: "New bullet" },
                        ],
                        meta: "",
                      },
                    ])
                  }
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all font-semibold text-gray-800 text-sm flex items-center gap-2"
                >
                  <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                    +
                  </div>{" "}
                  Add Experience
                </button>
                <button
                  onClick={() =>
                    setSkills([
                      ...skills,
                      {
                        id: Date.now().toString(),
                        title: "New Category",
                        items: "Skills",
                      },
                    ])
                  }
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all font-semibold text-gray-800 text-sm flex items-center gap-2"
                >
                  <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                    +
                  </div>{" "}
                  Add Skill Category
                </button>
                <button
                  onClick={() =>
                    setEducations([
                      ...educations,
                      {
                        id: Date.now().toString(),
                        degree: "Degree",
                        bullets: [
                          { id: Date.now().toString(), text: "New bullet" },
                        ],
                      },
                    ])
                  }
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all font-semibold text-gray-800 text-sm flex items-center gap-2"
                >
                  <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                    +
                  </div>{" "}
                  Add Education
                </button>
              </div>
              <div className="mt-8">
                <h3 className="text-xs font-semibold text-gray-500 mb-2">
                  Instructions
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Click any text directly on the resume to edit it. Drag the ⠿
                  handle on sections to reorder them.
                </p>
              </div>
            </div>
          )}

          {/* Photo Panel */}
          {activeSidebarTab === "photo" && (
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                  Profile Photo Settings
                </h2>
                <button
                  onClick={() => setActiveSidebarTab(null)}
                  className="md:hidden text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={18} />
                </button>
              </div>
              
              {/* Enable Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-xs font-semibold text-gray-800">Show Photo on Resume</span>
                <button
                  onClick={() => setProfilePhoto(p => ({ ...p, enabled: !p.enabled }))}
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
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
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
                            setProfilePhoto(p => ({ ...p, url: b64, rawUploadedUrl: b64 }));
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
                      <Camera className="mx-auto text-gray-400 group-hover:text-blue-500 mb-2 transition-colors" size={24} />
                      <div className="text-xs font-semibold text-gray-700">Drag & Drop or Click to upload</div>
                      <div className="text-[10px] text-gray-400 mt-1">Supports JPG, PNG, GIF</div>
                    </div>
                  </div>



                  {/* Background removal section */}
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
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
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Key Out Custom Color</span>
                        <input
                          type="color"
                          value={bgRemoveColor}
                          onChange={(e) => setBgRemoveColor(e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-gray-400">
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
                        className="w-full mt-1.5 py-1 px-2 bg-white hover:bg-gray-100 border border-gray-200 rounded text-[10px] font-bold text-gray-600 transition-colors"
                      >
                        Key Out Target Color
                      </button>
                    </div>
                  </div>

                  {/* Photoshop Filters */}
                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
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
                          onClick={() => setProfilePhoto(p => ({ ...p, filter: f.id }))}
                          className={cn(
                            "py-1.5 px-2 text-[10px] font-semibold border rounded-lg transition-all",
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
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
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
                          onClick={() => setProfilePhoto(p => ({ ...p, tone: t.id }))}
                          className={cn(
                            "py-1.5 px-2 text-[10px] font-semibold border rounded-lg transition-all",
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
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                          Aspect Ratio
                        </label>
                        <select
                          value={profilePhoto.aspectRatio}
                          onChange={(e) => setProfilePhoto(p => ({ ...p, aspectRatio: e.target.value as any }))}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 outline-none"
                        >
                          <option value="1:1">1:1 Square</option>
                          <option value="3:4">3:4 Portrait</option>
                          <option value="4:3">4:3 Landscape</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                          Shape / Radius
                        </label>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setProfilePhoto(p => ({ ...p, radius: 50 }))}
                            className={cn("flex-1 py-1 px-1.5 border rounded-lg text-[10px] font-bold", profilePhoto.radius === 50 ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-gray-200")}
                          >
                            Circle
                          </button>
                          <button
                            onClick={() => setProfilePhoto(p => ({ ...p, radius: 12 }))}
                            className={cn("flex-1 py-1 px-1.5 border rounded-lg text-[10px] font-bold", profilePhoto.radius === 12 ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-gray-200")}
                          >
                            Rounded
                          </button>
                          <button
                            onClick={() => setProfilePhoto(p => ({ ...p, radius: 0 }))}
                            className={cn("flex-1 py-1 px-1.5 border rounded-lg text-[10px] font-bold", profilePhoto.radius === 0 ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-gray-200")}
                          >
                            Square
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Scale slider */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Image Scale ({profilePhoto.scale}%)</label>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={profilePhoto.scale}
                        onChange={(e) => setProfilePhoto(p => ({ ...p, scale: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    {/* Opacity slider */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Opacity ({profilePhoto.opacity}%)</label>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={profilePhoto.opacity}
                        onChange={(e) => setProfilePhoto(p => ({ ...p, opacity: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    {/* Offsets (X & Y Alignment) */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">X Offset ({profilePhoto.xOffset}px)</label>
                        <input
                          type="range"
                          min="-80"
                          max="80"
                          value={profilePhoto.xOffset}
                          onChange={(e) => setProfilePhoto(p => ({ ...p, xOffset: parseInt(e.target.value) }))}
                          className="w-full accent-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Y Offset ({profilePhoto.yOffset}px)</label>
                        <input
                          type="range"
                          min="-80"
                          max="80"
                          value={profilePhoto.yOffset}
                          onChange={(e) => setProfilePhoto(p => ({ ...p, yOffset: parseInt(e.target.value) }))}
                          className="w-full accent-blue-600"
                        />
                      </div>
                    </div>

                    {/* Borders */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Border Width ({profilePhoto.borderWidth}px)</label>
                        <input
                          type="range"
                          min="0"
                          max="8"
                          value={profilePhoto.borderWidth}
                          onChange={(e) => setProfilePhoto(p => ({ ...p, borderWidth: parseInt(e.target.value) }))}
                          className="w-full accent-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Border Color</label>
                        <input
                          type="color"
                          value={profilePhoto.borderColor}
                          onChange={(e) => setProfilePhoto(p => ({ ...p, borderColor: e.target.value }))}
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
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Brightness ({profilePhoto.brightness ?? 100}%)</label>
                        <button onClick={() => setProfilePhoto(p => ({ ...p, brightness: 100 }))} className="text-[9px] text-blue-500 hover:underline">Reset</button>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="200"
                        value={profilePhoto.brightness ?? 100}
                        onChange={(e) => setProfilePhoto(p => ({ ...p, brightness: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    {/* Contrast */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Contrast ({profilePhoto.contrast ?? 100}%)</label>
                        <button onClick={() => setProfilePhoto(p => ({ ...p, contrast: 100 }))} className="text-[9px] text-blue-500 hover:underline">Reset</button>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="200"
                        value={profilePhoto.contrast ?? 100}
                        onChange={(e) => setProfilePhoto(p => ({ ...p, contrast: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    {/* Saturation */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Saturation ({profilePhoto.saturation ?? 100}%)</label>
                        <button onClick={() => setProfilePhoto(p => ({ ...p, saturation: 100 }))} className="text-[9px] text-blue-500 hover:underline">Reset</button>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={profilePhoto.saturation ?? 100}
                        onChange={(e) => setProfilePhoto(p => ({ ...p, saturation: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    {/* Blur */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Soft Focus / Blur ({profilePhoto.blur ?? 0}px)</label>
                        <button onClick={() => setProfilePhoto(p => ({ ...p, blur: 0 }))} className="text-[9px] text-blue-500 hover:underline">Reset</button>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={profilePhoto.blur ?? 0}
                        onChange={(e) => setProfilePhoto(p => ({ ...p, blur: parseFloat(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    {/* Hue Rotate */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Hue Shift ({profilePhoto.hueRotate ?? 0}°)</label>
                        <button onClick={() => setProfilePhoto(p => ({ ...p, hueRotate: 0 }))} className="text-[9px] text-blue-500 hover:underline">Reset</button>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={profilePhoto.hueRotate ?? 0}
                        onChange={(e) => setProfilePhoto(p => ({ ...p, hueRotate: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    {/* Sepia */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Warmth / Sepia ({profilePhoto.sepia ?? 0}%)</label>
                        <button onClick={() => setProfilePhoto(p => ({ ...p, sepia: 0 }))} className="text-[9px] text-blue-500 hover:underline">Reset</button>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={profilePhoto.sepia ?? 0}
                        onChange={(e) => setProfilePhoto(p => ({ ...p, sepia: parseInt(e.target.value) }))}
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
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                        Animation Preset
                      </label>
                      <select
                        value={profilePhoto.animation || "none"}
                        onChange={(e) => setProfilePhoto(p => ({ ...p, animation: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 outline-none"
                      >
                        <option value="none">None (Static)</option>
                        <option value="wobble">Wobble (Gentle hover drift)</option>
                        <option value="barndoor">Barndoor (Slide in from edge)</option>
                        <option value="circle">Circle Reveal (Radial grow)</option>
                        <option value="fade">Elegant Fade In</option>
                        <option value="flicker">Futuristic Glow Flicker</option>
                      </select>
                      <p className="text-[9px] text-gray-400 mt-1">
                        Adds a gorgeous interactive hover or entry motion effect.
                      </p>
                    </div>
                  </div>

                  {/* Reset Adjustments */}
                  <div className="pt-4">
                    <button
                      onClick={() => setProfilePhoto(p => ({
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
                      className="w-full py-1.5 border border-dashed border-gray-200 rounded-lg text-xs text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-colors"
                    >
                      Reset Photo Adjustments
                    </button>
                  </div>
                </>
              )}
              
              <div className="mt-4 pt-4 border-t border-gray-100 text-[10px] text-gray-400 text-center">
                Agent Rez AI is provided "as-is". Please verify all AI-generated content before use.
              </div>
            </div>
          )}

          {/* Account Panel */}
          {activeSidebarTab === "account" && (
            <div className="flex-1 p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                  Account
                </h2>
                <button
                  onClick={() => setActiveSidebarTab(null)}
                  className="md:hidden text-gray-400 hover:text-gray-600 p-1"
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
                        <div className="text-xs text-gray-500 truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-200/60 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-gray-400 font-medium uppercase tracking-wider text-[10px]">US State</div>
                        <div className="text-gray-800 font-semibold mt-0.5 truncate">{user.user_metadata?.state || 'Not set'}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 font-medium uppercase tracking-wider text-[10px]">Date of Birth</div>
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
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
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
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Change Password
                    </h3>
                    
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
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
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
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
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
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
                        <div className="p-4 text-xs text-gray-500 text-center border border-dashed border-gray-200 rounded-lg">
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
                            <div className="text-[10px] text-gray-500 mt-1">
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
                  <p className="text-sm text-gray-500 mb-6">
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
            <div className="flex-1 p-5 flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5 text-amber-500">
                  <Sparkles size={18} className="animate-pulse" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">
                    Agent Rez
                  </h2>
                </div>
                <button
                  onClick={() => setActiveSidebarTab(null)}
                  className="md:hidden text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={18} />
                </button>
              </div>

              {!user ? (
                /* Premium Lock Screen if not logged in */
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center text-amber-500 mb-4 animate-bounce">
                    <Lock size={28} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-base">
                    Premium AI Features Locked
                  </h3>
                  <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                    Unlock professional, Groq-powered AI writing helpers. Refine your summary, optimize experience bullet points using STAR methodology, and draft custom sections.
                  </p>
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    className="w-full p-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Log In / Sign Up to Unlock
                  </button>
                </div>
              ) : (
                /* Full AI Assistant Panel */
                <div className="flex-1 flex flex-col min-h-0 space-y-4">
                  {/* Category select buttons */}
                  <div className="flex border border-gray-200 rounded-xl p-1 bg-gray-50/50">
                    <button
                      type="button"
                      onClick={() => {
                        setAiPresetType("summary");
                        setAiOutput("");
                      }}
                      className={cn(
                        "flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all",
                        aiPresetType === "summary"
                          ? "bg-white text-blue-600 shadow-sm border border-gray-100"
                          : "text-gray-500 hover:text-gray-800"
                      )}
                    >
                      Summary
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAiPresetType("bullets");
                        setAiOutput("");
                      }}
                      className={cn(
                        "flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all",
                        aiPresetType === "bullets"
                          ? "bg-white text-blue-600 shadow-sm border border-gray-100"
                          : "text-gray-500 hover:text-gray-800"
                      )}
                    >
                      Bullet Points
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAiPresetType("parser");
                        setAiOutput("");
                      }}
                      className={cn(
                        "flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all",
                        aiPresetType === "parser"
                          ? "bg-white text-blue-600 shadow-sm border border-gray-100"
                          : "text-gray-500 hover:text-gray-800"
                      )}
                    >
                      Parser
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAiPresetType("custom");
                        setAiOutput("");
                      }}
                      className={cn(
                        "flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all",
                        aiPresetType === "custom"
                          ? "bg-white text-blue-600 shadow-sm border border-gray-100"
                          : "text-gray-500 hover:text-gray-800"
                      )}
                    >
                      Custom
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (aiPresetType === "parser") handleParseResume(aiInput);
                      else handleGenerateAI(e);
                    }}
                    className="flex-1 flex flex-col min-h-0 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        {aiPresetType === "summary" && "Polish Professional Summary"}
                        {aiPresetType === "bullets" && "Optimize Experience Bullet Points"}
                        {aiPresetType === "parser" && "Parse Old Resume"}
                        {aiPresetType === "custom" && "Custom AI Prompt / Query"}
                      </label>
                      {aiPresetType === "summary" && (
                        <button
                          type="button"
                          onClick={() => {
                            setAiInput(summary);
                            toast.success("Current summary imported! 📥");
                          }}
                          className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          📥 Load current
                        </button>
                      )}
                    </div>

                    <textarea
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      required
                      className="flex-1 w-full p-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                      placeholder={
                        aiPresetType === "summary"
                          ? "Enter your current summary draft, background, or goals. (e.g. 'Highly motivated developer with 2 years React experience...')"
                          : aiPresetType === "bullets"
                          ? "Paste experience bullet points to rewrite... (e.g. 'I was in charge of the database and speeded up page loading times.')"
                          : aiPresetType === "parser"
                          ? "Paste your old resume text here..."
                          : "How can the AI assistant help you today? (e.g. 'Suggest some high-demand technical keywords for a Kubernetes expert')"
                      }
                      rows={5}
                    />

                    <button
                      type="submit"
                      disabled={aiIsGenerating || !aiInput.trim()}
                      className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl py-2.5 text-xs font-bold hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {aiIsGenerating ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>{aiPresetType === "parser" ? "Parsing..." : "Generating suggestions..."}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} />
                          <span>{aiPresetType === "parser" ? "Parse Resume" : "Generate AI suggestions"}</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* AI Output Result Box */}
                  <div className="flex-1 flex flex-col min-h-0 bg-gray-50 border border-gray-200 rounded-xl p-3 overflow-hidden">
                    <div className="flex items-center justify-between mb-2 shrink-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        AI Output Suggestions
                      </span>
                      {aiOutput && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(aiOutput);
                              toast.success("Copied to clipboard! 📋");
                            }}
                            className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                            title="Copy to Clipboard"
                          >
                            <Copy size={12} />
                            <span>Copy</span>
                          </button>
                          {aiPresetType === "summary" && (
                            <button
                              type="button"
                              onClick={() => {
                                setSummary(aiOutput);
                                toast.success("Successfully applied to Summary! 🚀");
                              }}
                              className="p-1 hover:bg-green-100 bg-green-50 rounded text-green-700 transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                              title="Apply as Summary"
                            >
                              <Check size={12} />
                              <span>Apply</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto text-xs text-gray-800 leading-relaxed font-sans whitespace-pre-wrap select-text pr-1 bg-white border border-gray-100 rounded-lg p-2">
                      {aiOutput ? (
                        aiOutput
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-4">
                          <Sparkles size={24} className="opacity-30 mb-2 text-amber-500" />
                          <p className="text-[10px]">Your professional suggestions will appear here.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#f3f4f6] pb-16 md:pb-0">
        {/* Top Header */}
        <div className="h-14 bg-white/90 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-4 md:px-6 z-20 no-print shrink-0 shadow-sm">
          <div className="flex items-center gap-2 md:gap-3">
            <span className="font-[family:'Kalam',cursive] font-bold text-base md:text-lg text-gray-800">
              MYresume
            </span>
            {resumeId && (
              <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-[10px] md:text-xs font-medium text-gray-500">
                Saved
              </span>
            )}
            <div className="flex items-center gap-0.5 md:gap-1 border-l border-gray-200 pl-2 md:pl-3 ml-1">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                title="Undo (Ctrl+Z)"
              >
                <Undo size={15} />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                title="Redo (Ctrl+Y)"
              >
                <Redo size={15} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            <button
              onClick={handleSaveToCloud}
              disabled={isSaving}
              className="bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold hover:bg-gray-200 inline-flex items-center gap-1 md:gap-1.5 transition-all disabled:opacity-50"
            >
              <CloudUpload size={14} className="md:w-4 md:h-4" /> <span>{isSaving ? "Saving..." : "Save"}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="bg-blue-600 text-white border border-blue-600 px-2.5 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold inline-flex items-center gap-1 md:gap-1.5 transition-all hover:bg-blue-700 active:scale-95 shadow-sm"
            >
              <Printer size={14} className="md:w-4 md:h-4" /> <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div
          className={cn(
            "flex-1 overflow-y-auto overflow-x-auto px-2 py-4 md:px-4 md:py-10 flex justify-start md:justify-center canvas-wrap",
            layoutClasses,
          )}
          style={pageStyles}
        >
          <div
            ref={resumeRef}
            className="page relative w-[var(--page-width)] max-w-full bg-transparent print:bg-[var(--paper)] shadow-none print:shadow-none mb-8 p-[var(--page-margin)] text-[calc(1em*var(--text-scale))]"
            style={{
              minHeight: `calc(var(--page-height) * ${pageBreakElementIds.length + 1} + 32px * ${pageBreakElementIds.length})`,
            }}
          >
            {/* Absolute Page Background Sheets behind the content */}
            {Array.from({ length: pageBreakElementIds.length + 1 }).map((_, idx) => (
              <div
                key={idx}
                className="absolute left-0 right-0 shadow-[0_10px_35px_rgba(0,0,0,0.12)] border border-gray-200/50 rounded-[4px] pointer-events-none no-print transition-all duration-300"
                style={{
                  top: `calc(${idx} * (var(--page-height) + 32px))`,
                  height: "var(--page-height)",
                  backgroundColor: "var(--paper)",
                  zIndex: -1,
                }}
              />
            ))}
            {/* Header */}
            <PageBreakGap id="header" pageBreakElementIds={pageBreakElementIds} gapHeights={gapHeights} pageMargin={design.pageMargin} />
            <div
              className={cn(
                "header rounded-[var(--radius)] py-6 px-6 mb-[var(--section-gap)] print-avoid-break print:!shadow-none print:!border-none print:!bg-transparent transition-all duration-300",
                `text-${design.headerAlign}`,
              )}
              data-page-break-id="header"
              style={{
                backgroundColor: "var(--panel-rgba)",
                border: "var(--box-border)",
                boxShadow: "var(--box-shadow)",
                backdropFilter: "blur(var(--backdrop-blur))",
                WebkitBackdropFilter: "blur(var(--backdrop-blur))",
                breakBefore: pageBreakElementIds.includes("header") ? "page" : "auto",
              }}
            >
              <div className={cn(
                "flex gap-4 md:gap-6",
                design.headerAlign === "center"
                  ? "flex-col text-center justify-center items-center"
                  : "flex-col sm:flex-row text-center sm:text-left justify-start items-center sm:items-start"
              )}>
                {profilePhoto.enabled && (
                  <div
                    className={cn(
                      "relative group shrink-0",
                      profilePhoto.animation === "wobble" && "animate-photo-wobble",
                      profilePhoto.animation === "flicker" && "animate-photo-flicker",
                      profilePhoto.animation === "barndoor" && "animate-photo-barndoor",
                      profilePhoto.animation === "circle" && "animate-photo-circle",
                      profilePhoto.animation === "fade" && "animate-photo-fade"
                    )}
                    style={{
                      transform: `translate(${profilePhoto.xOffset}px, ${profilePhoto.yOffset}px)`,
                    }}
                  >
                    <div
                      className="overflow-hidden transition-all duration-300"
                      style={{
                        width: `${110 * (profilePhoto.scale / 100)}px`,
                        height: `${110 * (profilePhoto.scale / 100) * (profilePhoto.aspectRatio === "3:4" ? 4/3 : profilePhoto.aspectRatio === "4:3" ? 3/4 : 1)}px`,
                        borderRadius: `${profilePhoto.radius}%`,
                        opacity: profilePhoto.opacity / 100,
                        border: `${profilePhoto.borderWidth}px solid ${profilePhoto.borderColor}`,
                        boxShadow: "var(--box-shadow)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={profilePhoto.url}
                        alt="Profile"
                        className="w-full h-full object-cover select-none pointer-events-none"
                        style={{
                          filter: getCSSFilterString(
                            profilePhoto.filter,
                            profilePhoto.tone,
                            profilePhoto.brightness,
                            profilePhoto.contrast,
                            profilePhoto.saturation,
                            profilePhoto.blur,
                            profilePhoto.hueRotate,
                            profilePhoto.sepia
                          ),
                        }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    {/* Hover Click overlay */}
                    <button
                      onClick={() => setActiveSidebarTab("photo")}
                      className="absolute inset-0 bg-black/40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold font-sans no-print"
                      style={{ borderRadius: `${profilePhoto.radius}%` }}
                    >
                      Edit
                    </button>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div
                    className="name font-[family:var(--font-heading)] font-bold text-3xl text-[var(--ink)] m-0 mb-1.5 tracking-wide outline-none"
                    contentEditable
                    suppressContentEditableWarning
                    dangerouslySetInnerHTML={{ __html: name }}
                    onBlur={(e) => {
                      const val = e.currentTarget.innerHTML;
                      setName(val);
                    }}
                  />
                  <div
                    className="contact-line font-[family:var(--font-body)] italic text-sm text-[var(--ink-soft)] outline-none"
                    contentEditable
                    suppressContentEditableWarning
                    dangerouslySetInnerHTML={{ __html: contactLine }}
                    onBlur={(e) => {
                      const val = e.currentTarget.innerHTML;
                      setContactLine(val);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Sections */}
            <Reorder.Group
              values={sections}
              onReorder={setSections}
              id="sections-container"
              className="w-full"
            >
              {sections.map((section: any) => (
                <SectionWrapper key={section.id} id={section.id} item={section}>
                  {/* SUMMARY */}
                  {section.id === "summary" && (
                    <>
                      <PageBreakGap id="summary-content" pageBreakElementIds={pageBreakElementIds} gapHeights={gapHeights} pageMargin={design.pageMargin} />
                      <div
                        className="summary font-[family:var(--font-body)] italic text-sm text-[var(--ink-soft)] leading-[var(--line-height)] rounded-[var(--radius)] p-4 md:p-5 mb-[var(--section-gap)] print-avoid-break outline-none print:!shadow-none print:!border-none print:!bg-transparent transition-all duration-300"
                        data-page-break-id="summary-content"
                        style={{
                          backgroundColor: "var(--panel-rgba)",
                          border: "var(--box-border)",
                          boxShadow: "var(--box-shadow)",
                          backdropFilter: "blur(var(--backdrop-blur))",
                          WebkitBackdropFilter: "blur(var(--backdrop-blur))",
                          breakBefore: pageBreakElementIds.includes("summary-content") ? "page" : "auto",
                        }}
                        contentEditable
                        suppressContentEditableWarning
                        dangerouslySetInnerHTML={{ __html: summary }}
                        onBlur={(e) => {
                          const val = e.currentTarget.innerHTML;
                          setSummary(val);
                        }}
                      />
                    </>
                  )}

                  {/* LICENSES */}
                  {section.id === "licenses" && (
                    <>
                      <PageBreakGap id="lic-list" pageBreakElementIds={pageBreakElementIds} gapHeights={gapHeights} pageMargin={design.pageMargin} />
                      <Reorder.Group
                        values={licenses}
                        onReorder={setLicenses}
                        as="ul"
                        className="bullet-list m-0 p-4 md:p-5 pl-9 rounded-[var(--radius)] mb-[var(--section-gap)] print-avoid-break print:!shadow-none print:!border-none print:!bg-transparent transition-all duration-300"
                        id="lic-list"
                        data-page-break-id="lic-list"
                        style={{
                          backgroundColor: "var(--panel-rgba)",
                          border: "var(--box-border)",
                          boxShadow: "var(--box-shadow)",
                          backdropFilter: "blur(var(--backdrop-blur))",
                          WebkitBackdropFilter: "blur(var(--backdrop-blur))",
                          breakBefore: pageBreakElementIds.includes("lic-list") ? "page" : "auto",
                        }}
                      >
                        {licenses.map((lic: any) => {
                          const dc = useDragControls(); // eslint-disable-line react-hooks/rules-of-hooks
                          return (
                            <Reorder.Item
                              key={lic.id}
                              value={lic}
                              id={lic.id}
                              dragListener={false}
                              dragControls={dc}
                              className="relative group pl-1 mb-2"
                            >
                              <div className="absolute left-[-1.8rem] top-0 no-print">
                                <DragHandle dragControls={dc} />
                              </div>
                              <span
                                className="font-[family:var(--font-body)] italic text-sm text-[var(--ink-soft)] leading-[var(--line-height)] outline-none"
                                contentEditable
                                suppressContentEditableWarning
                                dangerouslySetInnerHTML={{ __html: lic.text }}
                                onBlur={(e) => {
                                  const val = e.currentTarget.innerHTML;
                                  setLicenses((prev) =>
                                    prev.map((x) =>
                                      x.id === lic.id ? { ...x, text: val } : x,
                                    ),
                                  );
                                }}
                              />
                              <button
                                className="hidden group-hover:inline ml-2 text-[var(--danger)] text-[10px] font-bold cursor-pointer font-sans no-print"
                                onClick={() =>
                                  setLicenses((l) =>
                                    l.filter((x) => x.id !== lic.id),
                                  )
                                }
                              >
                                ✕ remove
                              </button>
                            </Reorder.Item>
                          );
                        })}
                      </Reorder.Group>
                    </>
                  )}

                  {/* SKILLS */}
                  {section.id === "skills" && (
                    <>
                      <PageBreakGap id="skills-grid" pageBreakElementIds={pageBreakElementIds} gapHeights={gapHeights} pageMargin={design.pageMargin} />
                      <Reorder.Group
                        values={skills}
                        onReorder={setSkills}
                        className="skills-grid grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 rounded-[var(--radius)] p-5 mb-[var(--section-gap)] print-avoid-break print:!shadow-none print:!border-none print:!bg-transparent transition-all duration-300"
                        id="skills-grid"
                        data-page-break-id="skills-grid"
                        style={{
                          backgroundColor: "var(--panel-rgba)",
                          border: "var(--box-border)",
                          boxShadow: "var(--box-shadow)",
                          backdropFilter: "blur(var(--backdrop-blur))",
                          WebkitBackdropFilter: "blur(var(--backdrop-blur))",
                          breakBefore: pageBreakElementIds.includes("skills-grid") ? "page" : "auto",
                        }}
                      >
                        {skills.map((sk: any) => {
                          const dc = useDragControls(); // eslint-disable-line react-hooks/rules-of-hooks
                          return (
                            <Reorder.Item
                              key={sk.id}
                              value={sk}
                              dragListener={false}
                              dragControls={dc}
                              className="skill-cat relative pl-6 group"
                            >
                              <div className="absolute left-0 top-0.5 no-print">
                                <DragHandle dragControls={dc} />
                              </div>
                              <button
                                className="hidden group-hover:block absolute right-0 top-0 text-[var(--danger)] text-[10px] font-bold cursor-pointer font-sans no-print"
                                onClick={() =>
                                  setSkills((s) =>
                                    s.filter((x) => x.id !== sk.id),
                                  )
                                }
                              >
                                ✕
                              </button>
                              <div
                                className="cat-title font-[family:var(--font-heading)] font-bold text-[14px] text-[var(--ink)] mb-1 outline-none"
                                contentEditable
                                suppressContentEditableWarning
                                dangerouslySetInnerHTML={{ __html: sk.title }}
                                onBlur={(e) => {
                                  const val = e.currentTarget.innerHTML;
                                  setSkills((prev) =>
                                    prev.map((x) =>
                                      x.id === sk.id ? { ...x, title: val } : x,
                                    ),
                                  );
                                }}
                              />
                              <div
                                className="cat-items font-[family:var(--font-body)] italic text-sm text-[var(--ink-soft)] leading-[var(--line-height)] outline-none"
                                contentEditable
                                suppressContentEditableWarning
                                dangerouslySetInnerHTML={{ __html: sk.items }}
                                onBlur={(e) => {
                                  const val = e.currentTarget.innerHTML;
                                  setSkills((prev) =>
                                    prev.map((x) =>
                                      x.id === sk.id ? { ...x, items: val } : x,
                                    ),
                                  );
                                }}
                              />
                            </Reorder.Item>
                          );
                        })}
                      </Reorder.Group>
                    </>
                  )}

                  {/* EXPERIENCE */}
                  {section.id === "experience" && (
                    <Reorder.Group
                      values={experiences}
                      onReorder={setExperiences}
                    >
                      {experiences.map((exp: any) => {
                        const dc = useDragControls(); // eslint-disable-line react-hooks/rules-of-hooks
                        return (
                          <React.Fragment key={exp.id}>
                            <PageBreakGap id={`exp-${exp.id}`} pageBreakElementIds={pageBreakElementIds} gapHeights={gapHeights} pageMargin={design.pageMargin} />
                            <Reorder.Item
                              key={exp.id}
                              value={exp}
                              id={`exp-${exp.id}`}
                              dragListener={false}
                              dragControls={dc}
                              className="exp-entry relative rounded-[var(--radius)] p-4 md:p-5 mb-[var(--section-gap)] print-avoid-break pl-9 group print:!shadow-none print:!border-none print:!bg-transparent transition-all duration-300"
                              data-page-break-id={`exp-${exp.id}`}
                              style={{
                                backgroundColor: "var(--panel-rgba)",
                                border: "var(--box-border)",
                                boxShadow: "var(--box-shadow)",
                                backdropFilter: "blur(var(--backdrop-blur))",
                                WebkitBackdropFilter: "blur(var(--backdrop-blur))",
                                breakBefore: pageBreakElementIds.includes(`exp-${exp.id}`) ? "page" : "auto",
                              }}
                            >
                              <div className="absolute left-2 top-4 no-print">
                                <DragHandle dragControls={dc} />
                              </div>
                              <button
                                onClick={() =>
                                  setExperiences((e) =>
                                    e.filter((x) => x.id !== exp.id),
                                  )
                                }
                                className="remove-entry absolute top-2 right-2 md:top-3 md:right-3 bg-transparent border-none text-[var(--danger)] text-[11px] font-bold cursor-pointer opacity-50 hover:opacity-100 font-sans no-print flex items-center gap-1 hidden group-hover:flex"
                              >
                                <X size={12} /> remove
                              </button>
                              <div
                                className={cn(
                                  "exp-header",
                                  design.jobLayout === "split"
                                    ? "flex flex-col sm:flex-row justify-between items-start sm:items-baseline"
                                    : "",
                                )}
                              >
                                 <div
                                  className="exp-line1 font-[family:var(--font-heading)] font-bold text-base text-[var(--ink)] outline-none"
                                  contentEditable
                                  suppressContentEditableWarning
                                  dangerouslySetInnerHTML={{ __html: exp.title }}
                                  onBlur={(e) => {
                                    const val = e.currentTarget.innerHTML;
                                    setExperiences((prev) =>
                                      prev.map((x) =>
                                        x.id === exp.id ? { ...x, title: val } : x,
                                      ),
                                    );
                                  }}
                                />
                                <div
                                  className={cn(
                                    "exp-line2 font-[family:var(--font-body)] italic font-semibold text-[13px] text-[var(--ink-soft)] outline-none",
                                    design.jobLayout === "split"
                                      ? "sm:ml-4 text-left sm:text-right shrink-0 mt-1 sm:my-0"
                                      : "my-1",
                                  )}
                                  contentEditable
                                  suppressContentEditableWarning
                                  dangerouslySetInnerHTML={{ __html: exp.date }}
                                  onBlur={(e) => {
                                    const val = e.currentTarget.innerHTML;
                                    setExperiences((prev) =>
                                      prev.map((x) =>
                                        x.id === exp.id ? { ...x, date: val } : x,
                                      ),
                                    );
                                  }}
                                />
                              </div>
                              <ul className="m-0 pl-5 exp-bullets mt-2">
                                {exp.bullets.map((b: any) => (
                                  <li
                                    key={b.id}
                                    className="relative group/bullet pl-1 mb-1.5"
                                  >
                                    <span
                                      className="font-[family:var(--font-body)] italic text-sm text-[var(--ink-soft)] leading-[var(--line-height)] block outline-none"
                                      contentEditable
                                      suppressContentEditableWarning
                                      dangerouslySetInnerHTML={{ __html: b.text }}
                                      onBlur={(e) => {
                                        const val = e.currentTarget.innerHTML;
                                        setExperiences((prev) =>
                                          prev.map((x) =>
                                            x.id === exp.id
                                              ? {
                                                  ...x,
                                                  bullets: x.bullets.map((y: any) =>
                                                    y.id === b.id ? { ...y, text: val } : y,
                                                  ),
                                                }
                                              : x,
                                          ),
                                        );
                                      }}
                                    />
                                    <button
                                      className="hidden group-hover/bullet:inline absolute -left-4 top-1 text-[var(--danger)] text-[10px] font-bold cursor-pointer font-sans no-print"
                                      onClick={() =>
                                        setExperiences((e) =>
                                          e.map((x) =>
                                            x.id === exp.id
                                              ? {
                                                  ...x,
                                                  bullets: x.bullets.filter(
                                                    (y: any) => y.id !== b.id,
                                                  ),
                                                }
                                              : x,
                                          ),
                                        )
                                      }
                                    >
                                      ✕
                                    </button>
                                  </li>
                                ))}
                              </ul>
                              <button
                                onClick={() =>
                                  setExperiences((e) =>
                                    e.map((x) =>
                                      x.id === exp.id
                                        ? {
                                            ...x,
                                            bullets: [
                                              ...x.bullets,
                                              {
                                                id: Date.now().toString(),
                                                text: "New bullet",
                                              },
                                            ],
                                          }
                                        : x,
                                    ),
                                  )
                                }
                                className="add-bullet font-sans text-[11px] font-semibold text-[var(--accent)] bg-transparent border border-dashed border-[var(--accent)] rounded-md px-2 py-1 cursor-pointer mt-2 ml-5 no-print"
                              >
                                + bullet
                              </button>
                              {exp.meta !== undefined && (
                                <div
                                  className="exp-meta mt-3 pt-2 border-t border-[var(--hairline)] font-sans text-xs text-[var(--ink-soft)] font-medium leading-relaxed outline-none"
                                  contentEditable
                                  suppressContentEditableWarning
                                  dangerouslySetInnerHTML={{ __html: exp.meta }}
                                  onBlur={(e) => {
                                    const val = e.currentTarget.innerHTML;
                                    setExperiences((prev) =>
                                      prev.map((x) =>
                                        x.id === exp.id ? { ...x, meta: val } : x,
                                      ),
                                    );
                                  }}
                                />
                              )}
                            </Reorder.Item>
                          </React.Fragment>
                        );
                      })}
                    </Reorder.Group>
                  )}

                  {/* EDUCATION */}
                  {section.id === "education" && (
                    <Reorder.Group
                      values={educations}
                      onReorder={setEducations}
                    >
                      {educations.map((edu: any) => {
                        const dc = useDragControls(); // eslint-disable-line react-hooks/rules-of-hooks
                        return (
                          <React.Fragment key={edu.id}>
                            <PageBreakGap id={`edu-${edu.id}`} pageBreakElementIds={pageBreakElementIds} gapHeights={gapHeights} pageMargin={design.pageMargin} />
                            <Reorder.Item
                              key={edu.id}
                              value={edu}
                              id={`edu-${edu.id}`}
                              dragListener={false}
                              dragControls={dc}
                              className="edu-entry relative rounded-[var(--radius)] p-4 md:p-5 mb-2 print-avoid-break pl-9 group print:!shadow-none print:!border-none print:!bg-transparent transition-all duration-300"
                              data-page-break-id={`edu-${edu.id}`}
                              style={{
                                backgroundColor: "var(--panel-rgba)",
                                border: "var(--box-border)",
                                boxShadow: "var(--box-shadow)",
                                backdropFilter: "blur(var(--backdrop-blur))",
                                WebkitBackdropFilter: "blur(var(--backdrop-blur))",
                                breakBefore: pageBreakElementIds.includes(`edu-${edu.id}`) ? "page" : "auto",
                              }}
                            >
                              <div className="absolute left-2 top-4 no-print">
                                <DragHandle dragControls={dc} />
                              </div>
                              <button
                                onClick={() =>
                                  setEducations((e) =>
                                    e.filter((x) => x.id !== edu.id),
                                  )
                                }
                                className="remove-entry absolute top-2 right-2 md:top-3 md:right-3 bg-transparent border-none text-[var(--danger)] text-[11px] font-bold cursor-pointer opacity-50 hover:opacity-100 font-sans no-print flex items-center gap-1 hidden group-hover:flex"
                              >
                                <X size={12} /> remove
                              </button>
                              <div
                                className="edu-degree font-[family:var(--font-heading)] font-bold text-base text-[var(--ink)] outline-none"
                                contentEditable
                                suppressContentEditableWarning
                                dangerouslySetInnerHTML={{ __html: edu.degree }}
                                onBlur={(e) => {
                                  const val = e.currentTarget.innerHTML;
                                  setEducations((prev) =>
                                    prev.map((x) =>
                                      x.id === edu.id ? { ...x, degree: val } : x,
                                    ),
                                  );
                                }}
                              />
                              <ul className="m-0 pl-5 edu-bullets mt-1">
                                {edu.bullets.map((b: any) => (
                                  <li
                                    key={b.id}
                                    className="relative group/bullet pl-1 mb-1"
                                  >
                                    <span
                                      className="font-[family:var(--font-body)] italic text-sm text-[var(--ink-soft)] leading-[var(--line-height)] block outline-none"
                                      contentEditable
                                      suppressContentEditableWarning
                                      dangerouslySetInnerHTML={{ __html: b.text }}
                                      onBlur={(e) => {
                                        const val = e.currentTarget.innerHTML;
                                        setEducations((prev) =>
                                          prev.map((x) =>
                                            x.id === edu.id
                                              ? {
                                                  ...x,
                                                  bullets: x.bullets.map((y: any) =>
                                                    y.id === b.id ? { ...y, text: val } : y,
                                                  ),
                                                }
                                              : x,
                                          ),
                                        );
                                      }}
                                    />
                                    <button
                                      className="hidden group-hover/bullet:inline absolute -left-4 top-1 text-[var(--danger)] text-[10px] font-bold cursor-pointer font-sans no-print"
                                      onClick={() =>
                                        setEducations((e) =>
                                          e.map((x) =>
                                            x.id === edu.id
                                              ? {
                                                  ...x,
                                                  bullets: x.bullets.filter(
                                                    (y: any) => y.id !== b.id,
                                                  ),
                                                }
                                              : x,
                                          ),
                                        )
                                      }
                                    >
                                      ✕
                                    </button>
                                  </li>
                                ))}
                              </ul>
                              <button
                                onClick={() =>
                                  setEducations((e) =>
                                    e.map((x) =>
                                      x.id === edu.id
                                        ? {
                                            ...x,
                                            bullets: [
                                              ...x.bullets,
                                              {
                                                id: Date.now().toString(),
                                                text: "New bullet",
                                              },
                                            ],
                                          }
                                        : x,
                                    ),
                                  )
                                }
                                className="add-bullet font-sans text-[11px] font-semibold text-[var(--accent)] bg-transparent border border-dashed border-[var(--accent)] rounded-md px-2 py-1 cursor-pointer mt-2 ml-5 no-print"
                              >
                                + bullet
                              </button>
                            </Reorder.Item>
                          </React.Fragment>
                        );
                      })}
                    </Reorder.Group>
                  )}
                </SectionWrapper>
              ))}
            </Reorder.Group>

            <div
              className="page-footer text-center font-sans text-[10px] text-[#a19b9d] mt-4 outline-none"
              contentEditable
              suppressContentEditableWarning
              dangerouslySetInnerHTML={{ __html: footer }}
              onBlur={(e) => {
                const val = e.currentTarget.innerHTML;
                setFooter(val);
              }}
            />
          </div>
        </div>
      </div>

      {/* Manual Touch Up Eraser Modal */}
      {eraseModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex flex-col items-center justify-center p-4 font-sans no-print backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 text-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Eraser className="text-[#00f0ff] animate-pulse" size={18} />
                <h3 className="font-bold text-lg">Erase & Touch Up Brush</h3>
              </div>
              <button onClick={() => setEraseModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            {/* Workspace */}
            <div className="flex-1 bg-black/50 p-6 flex flex-col items-center justify-center min-h-[350px]">
              <p className="text-xs text-neutral-400 mb-4 flex items-center gap-1">
                <span className="text-[#00f0ff] font-bold">💡 Tip:</span> Click and drag directly on the image below to erase backgrounds or unwanted objects manually.
              </p>
              <div className="relative border-2 border-dashed border-neutral-700/50 rounded-xl p-2 bg-neutral-950 flex items-center justify-center">
                <canvas
                  ref={eraserCanvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="cursor-crosshair max-w-full max-h-[400px] object-contain rounded-lg"
                />
              </div>
            </div>
            
            {/* Controls */}
            <div className="px-6 py-4 bg-neutral-950 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                <span className="text-xs text-neutral-300 font-medium whitespace-nowrap">Brush Size: {brushSize}px</span>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="accent-[#00f0ff] flex-1"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={resetEraserCanvas}
                  className="px-4 py-2 text-xs font-semibold border border-neutral-700 rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  Reset Original
                </button>
                <button
                  onClick={saveErasedImage}
                  className="px-5 py-2 text-xs font-bold bg-[#00f0ff] text-neutral-950 rounded-lg hover:bg-[#33f5ff] transition-colors flex items-center gap-1.5"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
