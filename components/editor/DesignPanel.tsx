import React, { useState } from "react";
import { X, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { TEMPLATES } from "@/lib/resume-constants";
import { DEFAULT_DESIGN, useResumeStore } from "@/lib/store/useResumeStore";
import { supabase } from "@/lib/supabase";
import { TypographyPanel } from "./design-panel/TypographyPanel";
import { ThemePanel } from "./design-panel/ThemePanel";
import { AdvancedPanel } from "./design-panel/AdvancedPanel";

interface DesignPanelProps {
  activeSidebarTab: string | null;
  setActiveSidebarTab: (tab: string | null) => void;
  design: any;
  setDesign: React.Dispatch<React.SetStateAction<any>>;
  showMarginGuides: boolean;
  setShowMarginGuides: React.Dispatch<React.SetStateAction<boolean>>;
  showHeatmapOverlay: boolean;
  setShowHeatmapOverlay: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function DesignPanel({
  activeSidebarTab,
  setActiveSidebarTab,
  design,
  setDesign,
  showMarginGuides,
  setShowMarginGuides,
  showHeatmapOverlay,
  setShowHeatmapOverlay,
}: DesignPanelProps) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [customTemplateName, setCustomTemplateName] = useState("");
  const [savingCustomTemplate, setSavingCustomTemplate] = useState(false);
  const sections = useResumeStore((state) => state.sections);

  const handleReset = () => {
    const activeTemplate = TEMPLATES.find((t) => t.id === design.template);
    const templateOverrides = activeTemplate
      ? {
          fontHeading: activeTemplate.heading,
          fontBody: activeTemplate.body,
          accent: activeTemplate.accent,
          panel: activeTemplate.panel,
          paper: activeTemplate.paper || "#ffffff",
          radius: activeTemplate.radius,
          layout: activeTemplate.layout,
          headingStyle: activeTemplate.headingStyle,
          italic: activeTemplate.italic,
          headerAlign: activeTemplate.headerAlign || "left",
          listStyle: activeTemplate.listStyle || "disc",
          pageMargin: activeTemplate.pageMargin || 36,
          itemSpacing: activeTemplate.itemSpacing || 8,
          jobLayout: activeTemplate.jobLayout || "stacked",
          boxOpacity: activeTemplate.boxOpacity !== undefined ? activeTemplate.boxOpacity : 100,
          boxShadow: activeTemplate.boxShadow || "none",
          borderStyle: activeTemplate.borderStyle || "none",
          backdropBlur: activeTemplate.backdropBlur !== undefined ? activeTemplate.backdropBlur : 0,
        }
      : {};

    setDesign((prev: any) => ({
      ...DEFAULT_DESIGN,
      template: prev.template,
      ...templateOverrides,
    }));

    const templateName = activeTemplate?.name ?? "Default";
    toast.success(`Reset to ${templateName} defaults! 🔄`);
    setConfirmReset(false);
  };

  const handleSaveCustomTemplate = async () => {
    if (!customTemplateName.trim()) {
      toast.error("Please enter a name for your custom template.");
      return;
    }
    
    setSavingCustomTemplate(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("You must be logged in to save custom templates.");
      setSavingCustomTemplate(false);
      return;
    }

    const { data, error } = await supabase
      .from("custom_design_presets")
      .insert({
        user_id: session.user.id,
        name: customTemplateName.trim(),
        design: design,
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes("limit of 10")) {
        toast.error("Limit reached: You can save up to 10 custom templates.");
      } else {
        toast.error("Failed to save custom template.");
      }
    } else if (data) {
      toast.success("Custom template saved! 🎉");
      setCustomTemplateName("");
      setDesign((p: any) => ({ ...p, template: `custom-${data.id}` })); // Mark as custom to deselect standard template badges
    }
    setSavingCustomTemplate(false);
  };

  if (activeSidebarTab !== "design") return null;

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-600">
          Design Settings
        </h2>
        <div className="flex items-center gap-1">
          {/* Reset to Template Default */}
          {confirmReset ? (
            <div className="flex items-center gap-1 bg-orange-50 border border-orange-200 rounded-lg px-2 py-0.5">
              <span className="text-[10px] text-orange-700 font-semibold">Reset?</span>
              <button
                onClick={handleReset}
                className="text-[10px] font-bold text-orange-700 hover:text-orange-900 px-1.5 py-0.5 rounded hover:bg-orange-100 transition-all cursor-pointer"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="text-[10px] font-bold text-gray-500 hover:text-gray-700 px-1.5 py-0.5 rounded hover:bg-gray-100 transition-all cursor-pointer"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              title="Reset to current template's defaults"
              className="text-gray-400 hover:text-orange-600 p-1 hover:bg-orange-50 rounded-lg transition-all flex items-center gap-1 text-[10px] font-semibold cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
          <button
            onClick={() => setActiveSidebarTab(null)}
            className="text-gray-600 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-all"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        
        <TypographyPanel design={design} setDesign={setDesign} />
        
        <ThemePanel design={design} setDesign={setDesign} sections={sections} />
        
        <AdvancedPanel 
          design={design} 
          setDesign={setDesign} 
          showMarginGuides={showMarginGuides}
          setShowMarginGuides={setShowMarginGuides}
          showHeatmapOverlay={showHeatmapOverlay}
          setShowHeatmapOverlay={setShowHeatmapOverlay}
        />

        {/* Save as Custom Template */}
        <div className="pt-4 border-t border-gray-200 mt-6">
          <h3 className="text-xs font-semibold text-gray-900 mb-2">Save as Custom Template</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Template name..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              value={customTemplateName}
              onChange={(e) => setCustomTemplateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveCustomTemplate();
              }}
            />
            <button
              onClick={handleSaveCustomTemplate}
              disabled={savingCustomTemplate || !customTemplateName.trim()}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingCustomTemplate ? "Saving..." : "Save"}
            </button>
          </div>
          <p className="text-[10px] text-gray-500 mt-1.5 leading-snug">
            Save your current layout, colors, and margins. Custom templates appear in the Templates tab.
          </p>
        </div>

      </div>
    </div>
  );
}
