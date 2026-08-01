import React, { useState } from "react";
import toast from "react-hot-toast";

interface TypographyPanelProps {
  design: any;
  setDesign: React.Dispatch<React.SetStateAction<any>>;
}

export function TypographyPanel({ design, setDesign }: TypographyPanelProps) {
  const [selectedSectionStyling, setSelectedSectionStyling] = useState<string>("experience");

  return (
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
    </div>
  );
}
