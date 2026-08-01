import React from "react";
import { 
  Undo, Redo, Eraser, Menu, FileText, Palette, Plus, Sparkles, X as CloseIcon,
  HelpCircle, SpellCheck, BarChart3, Eye, EyeOff, CloudUpload, FileDown, User as UserIcon
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { useShallow } from "zustand/react/shallow";
import { motion } from "framer-motion"; // Changed from motion/react as motion/react is typically framer-motion

interface ToolbarProps {
  user: any;
  resumeId: string | null;
  historyIndex: number;
  historyLength: number;
  handleUndo: () => void;
  handleRedo: () => void;
  handleResetToBlank: () => void;
  isTopMenuMinimized: boolean;
  setIsTopMenuMinimized: (v: boolean) => void;
  setTutorialStep: (v: number) => void;
  setTutorialOpen: (v: boolean) => void;
  spellcheckEnabled: boolean;
  setSpellcheckEnabled: (v: boolean) => void;
  atsHealthBreakdown: { overallScore: number };
  setAtsScoreModalOpen: (v: boolean) => void;
  lastSavedAt: Date | null;
  handleSaveToCloud: () => void;
  isSaving: boolean;
  setExportModalOpen: (v: boolean) => void;
  onBack?: () => void;
}

export default function Toolbar({
  user, resumeId, historyIndex, historyLength, handleUndo, handleRedo, handleResetToBlank,
  isTopMenuMinimized, setIsTopMenuMinimized, setTutorialStep, setTutorialOpen,
  spellcheckEnabled, setSpellcheckEnabled, atsHealthBreakdown, setAtsScoreModalOpen,
  lastSavedAt, handleSaveToCloud, isSaving, setExportModalOpen, onBack
}: ToolbarProps) {
  const store = useResumeStore(useShallow(state => ({
    activeSidebarTab: state.activeSidebarTab,
    printPreviewMode: state.printPreviewMode,
    updateUI: state.updateUI
  })));
  const { activeSidebarTab, printPreviewMode } = store;
  const updateUI = store.updateUI;

  const setActiveSidebarTab = (v: any) => updateUI({ activeSidebarTab: typeof v === "function" ? v(useResumeStore.getState().activeSidebarTab) : v });
  const setPrintPreviewMode = (v: any) => updateUI({ printPreviewMode: typeof v === "function" ? v(useResumeStore.getState().printPreviewMode) : v });

  return (
            <div className="h-14 bg-white/90 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-4 md:px-6 z-20 no-print shrink-0 shadow-sm relative gap-2">
          <div className="flex items-center gap-2 md:gap-3 flex-1 justify-start min-w-0">
            {onBack && (
              <button
                onClick={onBack}
                className="mr-1 text-gray-900 bg-white border border-gray-200 px-2.5 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-100 shadow-sm transition-all cursor-pointer flex items-center gap-1.5 no-print shrink-0"
              >
                ← <span className="hidden lg:inline">{user ? "Back to Dashboard" : "Back"}</span><span className="lg:hidden">Back</span>
              </button>
            )}
            <span className="font-[family:'Kalam',cursive] font-bold text-base md:text-lg text-gray-800">
              Agent Rez AI
            </span>
            {resumeId && (
              <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-[11px] md:text-xs font-medium text-gray-600">
                Saved
              </span>
            )}
            <div className="flex items-center gap-0.5 md:gap-1 border-l border-gray-200 pl-2 md:pl-3 ml-1">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                title="Undo (Ctrl+Z)"
                aria-label="Undo"
              >
                <Undo size={15} />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                title="Redo (Ctrl+Y)"
                aria-label="Redo"
              >
                <Redo size={15} />
              </button>
              <div className="w-px h-4 bg-gray-200 mx-0.5 md:mx-1"></div>
              <button
                onClick={handleResetToBlank}
                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors flex items-center justify-center cursor-pointer"
                title="Reset/Clear to Blank Custom Template"
                aria-label="Reset to blank template"
              >
                <Eraser size={15} />
              </button>
            </div>
          </div>
          
          <motion.div drag dragMomentum={false} className={cn("hidden md:flex flex-none items-center bg-gray-50/80 backdrop-blur-sm p-1 rounded-xl border border-gray-200 shadow-sm shrink-0 transition-all duration-300 group cursor-grab active:cursor-grabbing", isTopMenuMinimized ? "w-auto" : "gap-1")}>
            {isTopMenuMinimized ? (
               <button onClick={() => setIsTopMenuMinimized(false)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white text-sm font-medium text-gray-600 transition-all cursor-pointer shadow-sm border border-transparent hover:border-gray-200">
                 <Menu size={16} /> Menu
               </button>
            ) : (
              <>
                <button
                  onClick={() => setActiveSidebarTab(activeSidebarTab === "templates" ? null : "templates")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:bg-white hover:shadow-sm text-sm font-medium",
                    activeSidebarTab === "templates" ? "bg-white shadow-sm text-blue-600" : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  <FileText size={16} /> Templates
                </button>
                <button
                  onClick={() => setActiveSidebarTab(activeSidebarTab === "design" ? null : "design")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:bg-white hover:shadow-sm text-sm font-medium",
                    activeSidebarTab === "design" ? "bg-white shadow-sm text-blue-600" : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  <Palette size={16} /> Design
                </button>
                <button
                  onClick={() => setActiveSidebarTab(activeSidebarTab === "content" ? null : "content")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:bg-white hover:shadow-sm text-sm font-medium",
                    activeSidebarTab === "content" ? "bg-white shadow-sm text-blue-600" : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  <Plus size={16} /> Add
                </button>
                <button
                  onClick={() => setActiveSidebarTab(activeSidebarTab === "ai" ? null : "ai")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:bg-white hover:shadow-sm text-sm font-medium",
                    activeSidebarTab === "ai" ? "bg-white shadow-sm text-blue-600" : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  <Sparkles size={16} className={cn(activeSidebarTab === "ai" ? "text-blue-600" : "text-amber-500 animate-pulse")} /> AI Tools
                </button>
                
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <button onClick={() => setIsTopMenuMinimized(true)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors cursor-pointer" title="Collapse Menu" aria-label="Collapse Menu">
                  <CloseIcon size={16} />
                </button>
              </>
            )}
          </motion.div>

          <div className="flex items-center gap-1.5 md:gap-2 flex-1 justify-end min-w-0">
            <button
              onClick={() => {
                setTutorialStep(0);
                setTutorialOpen(true);
              }}
              className="p-1.5 md:px-3 md:py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all hover:bg-amber-100 text-amber-800 bg-amber-50 border border-amber-200/40 hidden md:flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 shrink-0"
              title="Take an optional interactive tour of Agent Rez AI"
            >
              <HelpCircle size={14} className="text-amber-500 animate-pulse" /> <span className="hidden lg:inline">Take Tour</span>
            </button>
            <button
              onClick={() => setSpellcheckEnabled(!spellcheckEnabled)}
              className={cn(
                "p-1.5 md:px-3 md:py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all inline-flex items-center gap-1.5 border border-gray-200 shadow-sm shrink-0",
                spellcheckEnabled
                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                  : "bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              )}
              title={spellcheckEnabled ? "Disable spellcheck (removes red wavy lines)" : "Enable native spellcheck (adds red wavy lines to typos)"}
            >
              <SpellCheck size={14} className="md:w-4 md:h-4" />
              <span className="hidden lg:inline">Spellcheck</span>
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", spellcheckEnabled ? "bg-emerald-500 animate-pulse" : "bg-gray-400")} />
            </button>
            <button
              onClick={() => setAtsScoreModalOpen(true)}
              className={cn(
                "p-1.5 md:px-3 md:py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all inline-flex items-center gap-1.5 border shadow-sm cursor-pointer shrink-0",
                atsHealthBreakdown.overallScore >= 85
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  : atsHealthBreakdown.overallScore >= 70
                  ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
              )}
              title="Click to view full ATS & AI Optimization breakdown"
            >
              <BarChart3 size={14} className="md:w-4 md:h-4" />
              <span>ATS: <strong className="font-extrabold">{atsHealthBreakdown.overallScore}</strong>/100</span>
            </button>
            <button
              onClick={() => {
                setPrintPreviewMode(!printPreviewMode);
                toast.success(
                  !printPreviewMode
                    ? "Print Preview Enabled! (Editor overlays hidden) 👁️"
                    : "Print Preview Disabled! (Editor overlays restored) ✍️"
                );
              }}
              className={cn(
                "p-1.5 md:px-3 md:py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all inline-flex items-center gap-1.5 border border-gray-200 shadow-sm cursor-pointer shrink-0",
                printPreviewMode
                  ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                  : "bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              )}
              title={printPreviewMode ? "Exit Print Preview (Return to editing mode)" : "Enter Print Preview (Hide handles & see exact layout)"}
            >
              {printPreviewMode ? <EyeOff size={14} className="md:w-4 md:h-4" /> : <Eye size={14} className="md:w-4 md:h-4" />}
              <span className="hidden lg:inline">{printPreviewMode ? "Exit Preview" : "Print Preview"}</span>
            </button>
            {lastSavedAt && (
              <span className="text-[10px] text-gray-400 font-medium hidden lg:inline mr-2">
                Saved {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={handleSaveToCloud}
              disabled={isSaving}
              className="bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1.5 md:px-4 md:py-1.5 rounded-lg text-xs md:text-sm font-bold hover:bg-gray-200 inline-flex items-center gap-1 md:gap-1.5 transition-all disabled:opacity-50 shrink-0"
            >
              <CloudUpload size={14} className="md:w-4 md:h-4" /> <span className="hidden sm:inline">{isSaving ? "Saving..." : "Save"}</span>
            </button>
            <div className="relative group flex items-center">
              <button
                onClick={() => setExportModalOpen(true)}
                className="bg-blue-600 text-white border border-blue-600 px-2.5 py-1.5 md:px-4 md:py-1.5 rounded-lg text-xs md:text-sm font-bold inline-flex items-center gap-1 md:gap-1.5 transition-all hover:bg-blue-700 active:scale-95 shadow-sm cursor-pointer"
              >
                <FileDown size={14} className="md:w-4 md:h-4" /> <span>Export PDF</span>
              </button>
            </div>
            <div className="w-px h-5 bg-gray-200 mx-1 hidden md:block"></div>
            <button
              onClick={() => setActiveSidebarTab(activeSidebarTab === "account" ? null : "account")}
              className="relative rounded-full hover:ring-2 hover:ring-blue-100 transition-all ml-1"
              aria-label="Account Menu"
            >
              {user ? (
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden border border-blue-200 bg-blue-50 flex items-center justify-center">
                  <img
                    src={user.user_metadata?.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex"}
                    alt="User avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-100 text-gray-600 border border-gray-300 flex items-center justify-center">
                  <UserIcon size={16} className="md:w-[18px] md:h-[18px]" />
                </div>
              )}
            </button>
          </div>
        </div>
  );
}
