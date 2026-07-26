import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface ContentPanelProps {
  activeSidebarTab: string | null;
  setActiveSidebarTab: (tab: string | null) => void;
  sections: any[];
  setSections: React.Dispatch<React.SetStateAction<any[]>>;
  experiences: any[];
  setExperiences: (v: any) => void;
  skills: any[];
  setSkills: (v: any) => void;
  educations: any[];
  setEducations: (v: any) => void;
  licenses: any[];
  setLicenses: (v: any) => void;
  projects: any[];
  setProjects: (v: any) => void;
  publications: any[];
  setPublications: (v: any) => void;
  awards: any[];
  setAwards: (v: any) => void;
}

export default function ContentPanel({
  activeSidebarTab,
  setActiveSidebarTab,
  sections,
  setSections,
  experiences,
  setExperiences,
  skills,
  setSkills,
  educations,
  setEducations,
  licenses,
  setLicenses,
  projects,
  setProjects,
  publications,
  setPublications,
  awards,
  setAwards,
}: ContentPanelProps) {
  if (activeSidebarTab !== "content") return null;

  return (
<div className="flex-1 overflow-y-auto p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-600">
                  Add Content
                </h2>
                <button
                  onClick={() => setActiveSidebarTab(null)}
                  className="text-gray-600 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <X size={18} />
                </button>
              </div>
              
              {/* Section Visibility Toggles */}
              <div className="bg-gray-50/70 rounded-xl p-3.5 border border-gray-100 mb-5">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2.5">
                  Toggle Resume Sections:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "summary", label: "Summary" },
                    { id: "experience", label: "Experience" },
                    { id: "skills", label: "Skills" },
                    { id: "education", label: "Education" },
                    { id: "licenses", label: "Certifications" },
                    { id: "projects", label: "Projects" },
                    { id: "publications", label: "Publications" },
                    { id: "awards", label: "Awards" },
                  ].map((s) => {
                    const isActive = sections.some((sec) => sec.id === s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          if (isActive) {
                            setSections(sections.filter((sec) => sec.id !== s.id));
                            toast.success(`Hidden "${s.label}" section 👁️`);
                          } else {
                            setSections([...sections, { id: s.id }]);
                            toast.success(`Shown "${s.label}" section 👁️`);
                          }
                        }}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                          isActive
                            ? "bg-blue-50/50 border-blue-200 text-blue-700"
                            : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                        )}
                      >
                        <span>{s.label}</span>
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          isActive ? "bg-blue-600 animate-pulse" : "bg-gray-300"
                        )} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() =>
                    setExperiences([
                      {
                        id: Date.now().toString(),
                        title: "Job Title",
                        date: "Date",
                        bullets: [
                          { id: Date.now().toString(), text: "New bullet" },
                        ],
                        meta: "",
                      },
                      ...experiences,
                    ])
                  }
                  className="w-full text-left p-2.5 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all font-semibold text-gray-800 text-xs flex items-center gap-2"
                >
                  <div className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                    +
                  </div>{" "}
                  Add Experience Entry
                </button>
                <button
                  onClick={() =>
                    setSkills([
                      {
                        id: Date.now().toString(),
                        title: "New Category",
                        items: "Skills",
                      },
                      ...skills,
                    ])
                  }
                  className="w-full text-left p-2.5 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all font-semibold text-gray-800 text-xs flex items-center gap-2"
                >
                  <div className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                    +
                  </div>{" "}
                  Add Skill Category
                </button>
                <button
                  onClick={() =>
                    setEducations([
                      {
                        id: Date.now().toString(),
                        degree: "Degree",
                        bullets: [
                          { id: Date.now().toString(), text: "New bullet" },
                        ],
                      },
                      ...educations,
                    ])
                  }
                  className="w-full text-left p-2.5 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all font-semibold text-gray-800 text-xs flex items-center gap-2"
                >
                  <div className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                    +
                  </div>{" "}
                  Add Education Entry
                </button>
                <button
                  onClick={() =>
                    setLicenses([
                      {
                        id: Date.now().toString(),
                        text: "New License or Certification",
                      },
                      ...licenses,
                    ])
                  }
                  className="w-full text-left p-2.5 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all font-semibold text-gray-800 text-xs flex items-center gap-2"
                >
                  <div className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                    +
                  </div>{" "}
                  Add Certification
                </button>
                <button
                  onClick={() => {
                    // Make sure projects is active in sections
                    if (!sections.some((sec) => sec.id === "projects")) {
                      setSections([...sections, { id: "projects" }]);
                    }
                    setProjects([
                      ...projects,
                      {
                        id: Date.now().toString(),
                        title: "<b>New Project Name</b> — Technologies",
                        date: "Date",
                        bullets: [
                          { id: Date.now().toString(), text: "New detail bullet" },
                        ],
                      },
                    ]);
                    toast.success("Added project entry! 🚀");
                  }}
                  className="w-full text-left p-2.5 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all font-semibold text-gray-800 text-xs flex items-center gap-2"
                >
                  <div className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                    +
                  </div>{" "}
                  Add Project Entry
                </button>
                <button
                  onClick={() => {
                    // Make sure publications is active
                    if (!sections.some((sec) => sec.id === "publications")) {
                      setSections([...sections, { id: "publications" }]);
                    }
                    setPublications([
                      ...publications,
                      {
                        id: Date.now().toString(),
                        text: "<b>New Publication</b> — Journal/Conference, Year",
                      },
                    ]);
                    toast.success("Added publication entry! 📚");
                  }}
                  className="w-full text-left p-2.5 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all font-semibold text-gray-800 text-xs flex items-center gap-2"
                >
                  <div className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                    +
                  </div>{" "}
                  Add Publication Entry
                </button>
                <button
                  onClick={() => {
                    // Make sure awards is active
                    if (!sections.some((sec) => sec.id === "awards")) {
                      setSections([...sections, { id: "awards" }]);
                    }
                    setAwards([
                      ...awards,
                      {
                        id: Date.now().toString(),
                        text: "<b>New Award or Honor</b> — Issuing Body, Year",
                      },
                    ]);
                    toast.success("Added award entry! 🏆");
                  }}
                  className="w-full text-left p-2.5 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all font-semibold text-gray-800 text-xs flex items-center gap-2"
                >
                  <div className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                    +
                  </div>{" "}
                  Add Award Entry
                </button>
              </div>
              <div className="mt-8">
                <h3 className="text-xs font-semibold text-gray-600 mb-2">
                  Instructions
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Click any text directly on the resume to edit it. Drag the ⠿
                  handle on sections to reorder them.
                </p>
              </div>
            </div>
  );
}
