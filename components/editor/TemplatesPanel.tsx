import React, { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { TEMPLATES } from "@/lib/resume-constants";
import { supabase } from "@/lib/supabase";

interface TemplatesPanelProps {
  activeSidebarTab: string | null;
  setActiveSidebarTab: (tab: string | null) => void;
  design: any;
  setDesign: React.Dispatch<React.SetStateAction<any>>;
  applyTemplate: (t: any) => void;
}

export default function TemplatesPanel({
  activeSidebarTab,
  setActiveSidebarTab,
  design,
  setDesign,
  applyTemplate,
}: TemplatesPanelProps) {
  const [customPresets, setCustomPresets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeSidebarTab === "templates") {
      fetchCustomPresets();
    }
  }, [activeSidebarTab]);

  const fetchCustomPresets = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("custom_design_presets")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setCustomPresets(data);
    }
    setLoading(false);
  };

  const deleteCustomPreset = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const { error } = await supabase
      .from("custom_design_presets")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Failed to delete template");
    } else {
      toast.success("Template deleted");
      setCustomPresets(prev => prev.filter(p => p.id !== id));
    }
  };

  if (activeSidebarTab !== "templates") return null;

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-600">
          Templates
        </h2>
        <button
          onClick={() => setActiveSidebarTab(null)}
          className="text-gray-600 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-all"
        >
          <X size={18} />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {customPresets.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              Your Custom Templates
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {customPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setDesign({ ...preset.design, template: `custom-${preset.id}` });
                    toast.success(`Applied ${preset.name}!`);
                  }}
                  className={cn(
                    "text-left p-3 rounded-xl border-2 transition-all hover:border-gray-300 hover:bg-gray-50 relative group flex justify-between items-start",
                    design.template === `custom-${preset.id}` // Just a check in case we mark it
                      ? "border-blue-500 bg-blue-50/30"
                      : "border-gray-200 bg-white"
                  )}
                >
                  <div>
                    <div className="font-bold text-gray-900 text-sm mb-0.5">{preset.name}</div>
                    <div className="text-[10px] text-gray-500">Custom Template</div>
                  </div>
                  <div
                    onClick={(e) => deleteCustomPreset(e, preset.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all opacity-0 group-hover:opacity-100"
                    title="Delete template"
                  >
                    <Trash2 size={14} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
          Standard Templates
        </h3>
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => applyTemplate(t)}
            className={cn(
              "text-left p-4 rounded-xl border-2 transition-all hover:border-gray-300 hover:bg-gray-50 mb-3",
              design.template === t.id
                ? "border-blue-500 bg-blue-50/30"
                : "border-gray-100 bg-white",
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="font-bold text-gray-900">{t.name}</div>
              {t.layout === "sidebar" && (
                <span
                  className="text-[9px] font-bold uppercase tracking-wide text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded"
                  title="Two-column layouts can be read out of order by some ATS parsers. Use a single-column template if you're optimizing for ATS screening."
                >
                  ATS risk
                </span>
              )}
            </div>
            <div className="text-xs text-gray-600 leading-snug">
              {t.desc}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
