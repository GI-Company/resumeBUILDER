import React, { useState } from "react";
import { X, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { TEMPLATES } from "@/lib/resume-constants";
import { DEFAULT_DESIGN, useResumeStore } from "@/lib/store/useResumeStore";
import { supabase } from "@/lib/supabase";

const isValidHex = (hex: string) => /^#[0-9A-Fa-f]{6}$/i.test(hex);

function HexColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [localValue, setLocalValue] = useState(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const commit = (hex: string) => {
    if (isValidHex(hex)) {
      onChange(hex);
    } else {
      setLocalValue(value); // revert if invalid on blur
    }
  };

  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
        {label}
      </label>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          className="w-7 h-7 rounded cursor-pointer border-0 p-0 shrink-0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          type="text"
          maxLength={7}
          className="w-full bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono"
          value={localValue}
          onChange={(e) => {
            let newVal = e.target.value;
            if (!newVal.startsWith('#')) newVal = '#' + newVal.replace(/#/g, '');
            setLocalValue(newVal);
            if (isValidHex(newVal)) onChange(newVal);
          }}
          onBlur={() => commit(localValue)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit(localValue);
          }}
        />
      </div>
    </div>
  );
}

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
  const [selectedSectionStyling, setSelectedSectionStyling] = useState<string>("experience");
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
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-900">Typography</h3>

          {/* Typography Pairing Presets */}
          <div className="space-y-1.5 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-gray-600">
              Click to apply pairing preset:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { name: "Elegant Editorial", heading: "'Playfair Display',serif", body: "'Lora',serif", scale: 95, lineHeight: 1.5 },
                { name: "Modern Minimalist", heading: "'Poppins',sans-serif", body: "'Inter',sans-serif", scale: 100, lineHeight: 1.4 },
                { name: "Contemporary Classic", heading: "Georgia,serif", body: "Georgia,serif", scale: 100, lineHeight: 1.5 },
                { name: "Playful Tech", heading: "'Kalam',cursive", body: "'Inter',sans-serif", scale: 100, lineHeight: 1.4 },
              ].map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setDesign((p: any) => ({
                      ...p,
                      fontHeading: preset.heading,
                      fontBody: preset.body,
                      scale: preset.scale,
                      lineHeight: preset.lineHeight,
                    }));
                    toast.success(`Applied ${preset.name} typography! ✍️`);
                  }}
                  className="p-1.5 hover:bg-white rounded border border-transparent hover:border-gray-200 text-[10px] font-semibold text-gray-700 transition-all text-center cursor-pointer bg-white/55"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
              Heading Font
            </label>
            <select
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              value={design.fontHeading}
              onChange={(e) =>
                setDesign((p: any) => ({ ...p, fontHeading: e.target.value }))
              }
            >
              <option value="'Kalam',cursive">Kalam</option>
              <option value="'Playfair Display',serif">Playfair</option>
              <option value="'Poppins',sans-serif">Poppins</option>
              <option value="'Montserrat',sans-serif">Montserrat</option>
              <option value="'Oswald',sans-serif">Oswald</option>
              <option value="'Merriweather',serif">Merriweather</option>
              <option value="'Roboto',sans-serif">Roboto</option>
              <option value="'Open Sans',sans-serif">Open Sans</option>
              <option value="'Lato',sans-serif">Lato</option>
              <option value="'Nunito',sans-serif">Nunito</option>
              <option value="'Raleway',sans-serif">Raleway</option>
              <option value="Georgia,serif">Georgia</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
              Body Font
            </label>
            <select
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              value={design.fontBody}
              onChange={(e) =>
                setDesign((p: any) => ({ ...p, fontBody: e.target.value }))
              }
            >
              <option value="'Lora',serif">Lora</option>
              <option value="'Inter',sans-serif">Inter</option>
              <option value="'Source Serif 4',serif">Source Serif 4</option>
              <option value="'Roboto',sans-serif">Roboto</option>
              <option value="'Open Sans',sans-serif">Open Sans</option>
              <option value="'Lato',sans-serif">Lato</option>
              <option value="'Montserrat',sans-serif">Montserrat</option>
              <option value="'Nunito',sans-serif">Nunito</option>
              <option value="'Merriweather',serif">Merriweather</option>
              <option value="Georgia,serif">Georgia</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
              Accent Font
            </label>
            <select
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              value={design.fontAccent || "'Inter',sans-serif"}
              onChange={(e) =>
                setDesign((p: any) => ({ ...p, fontAccent: e.target.value }))
              }
            >
              <option value="'Inter',sans-serif">Inter</option>
              <option value="'Poppins',sans-serif">Poppins</option>
              <option value="'Montserrat',sans-serif">Montserrat</option>
              <option value="'Roboto',sans-serif">Roboto</option>
              <option value="'Open Sans',sans-serif">Open Sans</option>
              <option value="'Lato',sans-serif">Lato</option>
              <option value="'Kalam',cursive">Kalam</option>
              <option value="'Playfair Display',serif">Playfair</option>
              <option value="'Oswald',sans-serif">Oswald</option>
              <option value="'Merriweather',serif">Merriweather</option>
              <option value="'Nunito',sans-serif">Nunito</option>
              <option value="'Raleway',sans-serif">Raleway</option>
              <option value="'Source Serif 4',serif">Source Serif 4</option>
              <option value="Georgia,serif">Georgia</option>
            </select>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                Text Size ({design.scale}%)
              </label>
            </div>
            <input
              type="range"
              min="85"
              max="130"
              className="w-full accent-blue-600"
              value={design.scale}
              onChange={(e) =>
                setDesign((p: any) => ({ ...p, scale: parseInt(e.target.value) }))
              }
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                Line Spacing ({design.lineHeight})
              </label>
            </div>
            <input
              type="range"
              min="1.1"
              max="2.0"
              step="0.05"
              className="w-full accent-blue-600"
              value={design.lineHeight}
              onChange={(e) =>
                setDesign((p: any) => ({ ...p, lineHeight: parseFloat(e.target.value) }))
              }
            />
          </div>
          
          {/* Section-Level Styling */}
          <div className="pt-2 mt-4 border-t border-gray-200">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-900 mb-3 flex items-center gap-1.5">
              Section-Level Overrides
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Target Section
                </label>
                <select
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={selectedSectionStyling}
                  onChange={(e) => setSelectedSectionStyling(e.target.value)}
                >
                  <option value="summary">Summary</option>
                  <option value="experience">Experience</option>
                  <option value="education">Education</option>
                  <option value="skills">Skills</option>
                  <option value="projects">Projects</option>
                  <option value="awards">Awards</option>
                  <option value="publications">Publications</option>
                  <option value="licenses">Licenses & Certifications</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Heading Font
                  </label>
                  <select
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={design.sectionFonts?.[selectedSectionStyling]?.heading || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDesign((p: any) => ({
                        ...p,
                        sectionFonts: {
                          ...(p.sectionFonts || {}),
                          [selectedSectionStyling]: {
                            ...(p.sectionFonts?.[selectedSectionStyling] || {}),
                            heading: val === "" ? undefined : val,
                          }
                        }
                      }));
                    }}
                  >
                    <option value="">(Inherit Global)</option>
                    <option value="'Kalam',cursive">Kalam</option>
                    <option value="'Playfair Display',serif">Playfair</option>
                    <option value="'Poppins',sans-serif">Poppins</option>
                    <option value="'Montserrat',sans-serif">Montserrat</option>
                    <option value="'Oswald',sans-serif">Oswald</option>
                    <option value="'Merriweather',serif">Merriweather</option>
                    <option value="'Roboto',sans-serif">Roboto</option>
                    <option value="'Open Sans',sans-serif">Open Sans</option>
                    <option value="'Lato',sans-serif">Lato</option>
                    <option value="'Nunito',sans-serif">Nunito</option>
                    <option value="'Raleway',sans-serif">Raleway</option>
                    <option value="Georgia,serif">Georgia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Body Font
                  </label>
                  <select
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={design.sectionFonts?.[selectedSectionStyling]?.body || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDesign((p: any) => ({
                        ...p,
                        sectionFonts: {
                          ...(p.sectionFonts || {}),
                          [selectedSectionStyling]: {
                            ...(p.sectionFonts?.[selectedSectionStyling] || {}),
                            body: val === "" ? undefined : val,
                          }
                        }
                      }));
                    }}
                  >
                    <option value="">(Inherit Global)</option>
                    <option value="'Lora',serif">Lora</option>
                    <option value="'Inter',sans-serif">Inter</option>
                    <option value="'Source Serif 4',serif">Source Serif 4</option>
                    <option value="'Roboto',sans-serif">Roboto</option>
                    <option value="'Open Sans',sans-serif">Open Sans</option>
                    <option value="'Lato',sans-serif">Lato</option>
                    <option value="'Montserrat',sans-serif">Montserrat</option>
                    <option value="'Nunito',sans-serif">Nunito</option>
                    <option value="'Merriweather',serif">Merriweather</option>
                    <option value="Georgia,serif">Georgia</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Heading Weight
                  </label>
                  <select
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={design.sectionFonts?.[selectedSectionStyling]?.weight || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDesign((p: any) => ({
                        ...p,
                        sectionFonts: {
                          ...(p.sectionFonts || {}),
                          [selectedSectionStyling]: {
                            ...(p.sectionFonts?.[selectedSectionStyling] || {}),
                            weight: val === "" ? undefined : parseInt(val, 10),
                          }
                        }
                      }));
                    }}
                  >
                    <option value="">(Inherit Global)</option>
                    <option value="400">Regular (400)</option>
                    <option value="500">Medium (500)</option>
                    <option value="600">Semibold (600)</option>
                    <option value="700">Bold (700)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Text Scale
                  </label>
                  <input
                    type="range"
                    min="85"
                    max="130"
                    className="w-full accent-blue-600 mt-1"
                    value={design.sectionFonts?.[selectedSectionStyling]?.size || 100}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setDesign((p: any) => ({
                        ...p,
                        sectionFonts: {
                          ...(p.sectionFonts || {}),
                          [selectedSectionStyling]: {
                            ...(p.sectionFonts?.[selectedSectionStyling] || {}),
                            size: val === 100 ? undefined : val,
                          }
                        }
                      }));
                    }}
                  />
                  <div className="text-right text-[10px] text-gray-500">
                    {design.sectionFonts?.[selectedSectionStyling]?.size || 100}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-900">
            Colors & Palette Presets
          </h3>

          {/* Preset Color Badges */}
          <div className="space-y-1.5 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-gray-600">
              Click to apply preset:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { name: "Navy Corporate", accent: "#1e3a8a", panel: "#f1f5f9", paper: "#ffffff" },
                { name: "Emerald Creative", accent: "#059669", panel: "#f0fdf4", paper: "#ffffff" },
                { name: "Warm Editorial", accent: "#7c2d12", panel: "#fffbeb", paper: "#fafaf9" },
                { name: "Charcoal Tech", accent: "#111827", panel: "#f3f4f6", paper: "#ffffff" },
                { name: "Plum Royal", accent: "#701a75", panel: "#fae8ff", paper: "#ffffff" },
                { name: "Ocean Breeze", accent: "#0284c7", panel: "#ecfeff", paper: "#ffffff" },
                { name: "Obsidian Gold", accent: "#b45309", panel: "#18181b", paper: "#09090b" },
                { name: "Crimson Tech", accent: "#dc2626", panel: "#fef2f2", paper: "#ffffff" },
                { name: "Sapphire Executive", accent: "#2563eb", panel: "#eff6ff", paper: "#ffffff" },
                { name: "Graphite Minimal", accent: "#3f3f46", panel: "#fafafa", paper: "#ffffff" },
                { name: "Rose Quartz", accent: "#be185d", panel: "#fdf2f8", paper: "#ffffff" },
                { name: "Amber Sunset", accent: "#d97706", panel: "#fffbeb", paper: "#ffffff" },
              ].map((pal) => (
                <button
                  key={pal.name}
                  type="button"
                  onClick={() => {
                    setDesign((p: any) => ({
                      ...p,
                      accent: pal.accent,
                      panel: pal.panel,
                      paper: pal.paper,
                    }));
                    toast.success(`Applied ${pal.name} palette! 🎨`);
                  }}
                  className="flex items-center gap-1.5 p-1 hover:bg-white rounded border border-transparent hover:border-gray-200 text-[11px] font-medium text-gray-700 transition-all text-left cursor-pointer"
                >
                  <div className="flex gap-0.5 shrink-0 rounded overflow-hidden border border-gray-200/50">
                    <span className="w-2.5 h-2.5 block" style={{ backgroundColor: pal.accent }} />
                    <span className="w-2.5 h-2.5 block" style={{ backgroundColor: pal.panel }} />
                    <span className="w-2.5 h-2.5 block" style={{ backgroundColor: pal.paper }} />
                  </div>
                  <span className="truncate">{pal.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <HexColorInput
              label="Accent"
              value={design.accent}
              onChange={(val) => setDesign((p: any) => ({ ...p, accent: val }))}
            />
            <HexColorInput
              label="Panel"
              value={design.panel}
              onChange={(val) => setDesign((p: any) => ({ ...p, panel: val }))}
            />
            <HexColorInput
              label="Paper"
              value={design.paper}
              onChange={(val) => setDesign((p: any) => ({ ...p, paper: val }))}
            />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-900">Layout & Spacing</h3>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
              Layout Style
            </label>
            <select
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              value={design.layout}
              onChange={(e) =>
                setDesign((p: any) => ({ ...p, layout: e.target.value }))
              }
            >
              <option value="classic">Single Column</option>
              <option value="sidebar">Sidebar Layout</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
              Job Style
            </label>
            <select
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              value={design.jobLayout}
              onChange={(e) =>
                setDesign((p: any) => ({ ...p, jobLayout: e.target.value }))
              }
            >
              <option value="stacked">Stacked</option>
              <option value="split">Split (Dates Right)</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
              Heading Style
            </label>
            <select
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              value={design.headingStyle}
              onChange={(e) =>
                setDesign((p: any) => ({ ...p, headingStyle: e.target.value }))
              }
            >
              <option value="bar">Color Bar</option>
              <option value="underline">Underlined</option>
              <option value="plain">Plain Text</option>
              <option value="smallcaps">Small Caps</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
              Corner Radius
            </label>
            <input
              type="range"
              min="0"
              max="24"
              className="w-full accent-blue-600"
              value={design.radius}
              onChange={(e) =>
                setDesign((p: any) => ({ ...p, radius: parseInt(e.target.value) }))
              }
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
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
                setDesign((p: any) => ({ ...p, gap: parseInt(e.target.value) }))
              }
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
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
                setDesign((p: any) => ({ ...p, itemSpacing: parseInt(e.target.value) }))
              }
            />
          </div>

          {/* Per-Section Spacing Overrides */}
          <div className="space-y-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100 mb-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Per-Section Spacing
              </span>
              {design.sectionSpacing && Object.keys(design.sectionSpacing).length > 0 && (
                <button
                  type="button"
                  onClick={() => setDesign((p: any) => ({ ...p, sectionSpacing: {} }))}
                  className="text-[10px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-1.5 py-0.5 rounded transition-all cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>
            {/* Note: When a section is deleted, its entry in sectionSpacing may become orphaned dead data. This is intentionally left as harmless clutter in the JSON rather than actively cleaned up to avoid unnecessary side effects. */}
            <div className="space-y-3 mt-2">
              {sections.map((section) => {
                const isOverridden = design.sectionSpacing?.[section.id] !== undefined;
                const value = isOverridden ? design.sectionSpacing[section.id] : design.itemSpacing;
                
                return (
                  <div key={section.id}>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold text-gray-700 truncate w-40">
                        {section.title || section.id}
                      </label>
                      {isOverridden && (
                        <button
                          type="button"
                          onClick={() => {
                            setDesign((p: any) => {
                              const newOverrides = { ...p.sectionSpacing };
                              delete newOverrides[section.id];
                              return { ...p, sectionSpacing: newOverrides };
                            });
                          }}
                          className="text-[9px] font-semibold text-gray-500 hover:text-red-500 px-1 hover:bg-gray-200 rounded cursor-pointer transition-all"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      step="2"
                      className="w-full accent-blue-600 h-1.5"
                      value={value}
                      onChange={(e) => {
                        const newVal = parseInt(e.target.value);
                        setDesign((p: any) => ({
                          ...p,
                          sectionSpacing: {
                            ...(p.sectionSpacing || {}),
                            [section.id]: newVal,
                          },
                        }));
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          {/* Preset Margins */}
          <div className="space-y-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100 mb-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Standard Margin Presets
            </span>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => {
                  setDesign((p: any) => ({
                    ...p,
                    pageMargin: 48,
                    pageMarginLeftRight: 48,
                    pageMarginTopBottom: 48,
                  }));
                  toast.success("Applied Compact Margins (0.5 in) 📏");
                }}
                className={cn(
                  "py-1.5 px-1 text-center rounded-md border text-[10px] font-bold transition-all cursor-pointer",
                  design.pageMargin === 48 &&
                    (design.pageMarginLeftRight ?? 48) === 48 &&
                    (design.pageMarginTopBottom ?? 48) === 48
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100"
                )}
              >
                0.5&quot; Compact
              </button>
              <button
                type="button"
                onClick={() => {
                  setDesign((p: any) => ({
                    ...p,
                    pageMargin: 72,
                    pageMarginLeftRight: 72,
                    pageMarginTopBottom: 72,
                  }));
                  toast.success("Applied Balanced Margins (0.75 in) 📏");
                }}
                className={cn(
                  "py-1.5 px-1 text-center rounded-md border text-[10px] font-bold transition-all cursor-pointer",
                  design.pageMargin === 72 &&
                    (design.pageMarginLeftRight ?? 72) === 72 &&
                    (design.pageMarginTopBottom ?? 72) === 72
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100"
                )}
              >
                0.75&quot; Balanced
              </button>
              <button
                type="button"
                onClick={() => {
                  setDesign((p: any) => ({
                    ...p,
                    pageMargin: 96,
                    pageMarginLeftRight: 96,
                    pageMarginTopBottom: 96,
                  }));
                  toast.success("Applied Traditional Margins (1.0 in) 📏");
                }}
                className={cn(
                  "py-1.5 px-1 text-center rounded-md border text-[10px] font-bold transition-all cursor-pointer",
                  design.pageMargin === 96 &&
                    (design.pageMarginLeftRight ?? 96) === 96 &&
                    (design.pageMarginTopBottom ?? 96) === 96
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100"
                )}
              >
                1.0&quot; Classic
              </button>
            </div>
            {/* Toggle Safe Area guides */}
            <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-gray-200/50">
              <span className="text-[10px] font-bold text-gray-600">Show Alignment Guides</span>
              <button
                type="button"
                onClick={() => {
                  setShowMarginGuides(!showMarginGuides);
                  toast.success(showMarginGuides ? "Alignment guides hidden! 🙈" : "Alignment guides active! 👁️");
                }}
                className={cn(
                  "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  showMarginGuides ? "bg-blue-500" : "bg-gray-200"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    showMarginGuides ? "translate-x-3" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {/* Toggle F-Pattern Visual Hierarchy Overlay */}
            <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-gray-200/50">
              <span className="text-[10px] font-bold text-gray-600">F-Pattern Visual Hierarchy <span className="text-orange-500 font-normal">(Coming Soon)</span></span>
              <button
                type="button"
                onClick={() => {
                  setShowHeatmapOverlay(!showHeatmapOverlay);
                  toast.success(!showHeatmapOverlay ? "Visual Hierarchy Overlay active! 👁️" : "Visual Hierarchy hidden! 🙈");
                }}
                className={cn(
                  "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  showHeatmapOverlay ? "bg-red-500" : "bg-gray-200"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    showHeatmapOverlay ? "translate-x-3" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                Global Margin ({design.pageMargin}px)
              </label>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              className="w-full accent-blue-600"
              value={design.pageMargin}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setDesign((p: any) => ({
                  ...p,
                  pageMargin: val,
                  pageMarginLeftRight: val,
                  pageMarginTopBottom: val,
                }));
              }}
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                Horizontal Margin ({design.pageMarginLeftRight ?? design.pageMargin}px)
              </label>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              className="w-full accent-blue-600"
              value={design.pageMarginLeftRight ?? design.pageMargin}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setDesign((p: any) => ({
                  ...p,
                  pageMarginLeftRight: val,
                }));
              }}
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                Vertical Margin ({design.pageMarginTopBottom ?? design.pageMargin}px)
              </label>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              className="w-full accent-blue-600"
              value={design.pageMarginTopBottom ?? design.pageMargin}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setDesign((p: any) => ({
                  ...p,
                  pageMarginTopBottom: val,
                }));
              }}
            />
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-gray-100">
          <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
            Boxes & Premium Effects
          </h3>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600">
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
                setDesign((p: any) => ({ ...p, boxOpacity: parseInt(e.target.value) }))
              }
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
              Box Shadow (Depth)
            </label>
            <select
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              value={design.boxShadow}
              onChange={(e) =>
                setDesign((p: any) => ({ ...p, boxShadow: e.target.value }))
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
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
              Border Style
            </label>
            <select
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              value={design.borderStyle}
              onChange={(e) =>
                setDesign((p: any) => ({ ...p, borderStyle: e.target.value }))
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
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600">
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
                setDesign((p: any) => ({ ...p, backdropBlur: parseInt(e.target.value) }))
              }
            />
          </div>
        </div>

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
