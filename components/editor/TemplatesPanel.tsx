import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TEMPLATES } from "@/lib/resume-constants";

interface TemplatesPanelProps {
  activeSidebarTab: string | null;
  setActiveSidebarTab: (tab: string | null) => void;
  design: any;
  applyTemplate: (t: any) => void;
}

export default function TemplatesPanel({
  activeSidebarTab,
  setActiveSidebarTab,
  design,
  applyTemplate,
}: TemplatesPanelProps) {
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
            <div className="text-xs text-gray-600 leading-snug">
              {t.desc}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
