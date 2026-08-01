import React from "react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface AdvancedPanelProps {
  design: any;
  setDesign: React.Dispatch<React.SetStateAction<any>>;
  showMarginGuides: boolean;
  setShowMarginGuides: React.Dispatch<React.SetStateAction<boolean>>;
  showHeatmapOverlay: boolean;
  setShowHeatmapOverlay: React.Dispatch<React.SetStateAction<boolean>>;
}

export function AdvancedPanel({
  design,
  setDesign,
  showMarginGuides,
  setShowMarginGuides,
  showHeatmapOverlay,
  setShowHeatmapOverlay,
}: AdvancedPanelProps) {
  return (
    <div className="space-y-6">
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
      
      {/* Custom CSS Injection */}
      <div className="space-y-3 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center mb-1">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600">
            Custom CSS <span className="text-blue-500 font-normal">(Beta)</span>
          </label>
        </div>
        <p className="text-[10px] text-gray-500 leading-snug">
          Inject custom CSS into the resume renderer. Use <code>.canvas-wrap</code> to scope your styles. 
        </p>
        <textarea
          className="w-full bg-gray-900 text-gray-100 font-mono text-[10px] p-2 rounded-lg min-h-[120px] focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder=".canvas-wrap .section-heading {\n  text-transform: uppercase;\n}"
          value={design.customCss || ""}
          onChange={(e) => setDesign((p: any) => ({ ...p, customCss: e.target.value }))}
        />
      </div>
    </div>
  );
}
