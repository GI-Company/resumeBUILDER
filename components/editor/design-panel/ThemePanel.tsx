import React, { useState } from "react";
import toast from "react-hot-toast";

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

interface ThemePanelProps {
  design: any;
  setDesign: React.Dispatch<React.SetStateAction<any>>;
  sections: any[];
}

export function ThemePanel({ design, setDesign, sections }: ThemePanelProps) {
  return (
    <div className="space-y-6">
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
      </div>
    </div>
  );
}
