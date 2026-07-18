import React, { memo } from "react";
import { Reorder, useDragControls } from "motion/react";
import { ArrowDownToLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageBreakGap } from "./PageBreakGap";
import { DragHandle } from "./DragHandle";
import { ContentEditableField } from "../ContentEditableField";

export const SectionWrapper = memo(({
  id,
  item,
  children,
  manualBreaks,
  setManualBreaks,
  pageBreakElementIds,
  gapHeights,
  design,
  licenses,
  setLicenses,
  skills,
  setSkills,
  experiences,
  setExperiences,
  educations,
  setEducations,
  projects,
  setProjects,
  publications,
  setPublications,
  awards,
  setAwards,
  sectionHeaders,
  setSectionHeaders,
}: any) => {
  const dragControls = useDragControls();
  return (
    <Reorder.Item
      key={id}
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
      <PageBreakGap id={`heading-${id}`} pageBreakElementIds={pageBreakElementIds} gapHeights={gapHeights} pageMargin={design.pageMargin} pageMarginX={design.pageMarginLeftRight ?? design.pageMargin} pageMarginY={design.pageMarginTopBottom ?? design.pageMargin} />
      <div
        className="section-heading font-[family:var(--font-heading)] font-bold text-base tracking-wide text-[var(--ink)] rounded-[var(--radius)] py-2 px-6 mt-3.5 mb-[var(--section-gap)] flex flex-wrap items-center justify-between gap-x-2 gap-y-2 print:!shadow-none print:!border-none print:!bg-transparent print-break-after-avoid transition-all duration-300"
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
          <ContentEditableField tagName="span"
            className="outline-none hover:bg-white/15 px-1 rounded transition-all cursor-text min-w-[120px]"
            html={sectionHeaders?.[id] || (
              id === "summary" ? "Professional Summary" :
              id === "licenses" ? "Certifications & Licenses" :
              id === "skills" ? "Skills" :
              id === "experience" ? "Professional Experience" :
              id === "education" ? "Education" :
              id === "projects" ? "Projects" :
              id === "publications" ? "Publications" :
              id === "awards" ? "Awards & Honors" : id
            )}
            onChange={(val: string) => {
              setSectionHeaders?.((prev: any) => ({
                ...prev,
                [id]: val
              }));
            }}
          />
        </div>
        <div className="heading-actions flex flex-wrap items-center gap-1.5 ml-auto">
          <button
            onClick={() => setManualBreaks((p: any) => ({ ...p, [id]: !p[id] }))}
            className={cn(
              "font-sans text-[11px] font-bold tracking-normal bg-transparent border border-[var(--hairline)] rounded-md px-2 py-1 cursor-pointer no-print flex items-center gap-1 transition-colors hover:bg-gray-100",
              manualBreaks[id]
                ? "bg-[var(--accent)] text-white border-[var(--accent)] hover:bg-[var(--accent)] hover:brightness-110"
                : "text-[var(--ink-soft)]",
            )}
            title="Force this section to start a new printed page"
          >
            <ArrowDownToLine size={12} />
            <span>Page Break</span>
          </button>
          {id === "licenses" && (
            <button
              className="font-sans text-[11px] font-semibold text-[var(--ink-soft)] bg-transparent border border-[var(--hairline)] hover:bg-gray-100 hover:text-[var(--ink)] active:scale-95 rounded-md px-2 py-1 transition-all cursor-pointer no-print flex items-center gap-1"
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
              <span>+ Add Credential</span>
            </button>
          )}
          {id === "skills" && (
            <button
              className="font-sans text-[11px] font-semibold text-[var(--ink-soft)] bg-transparent border border-[var(--hairline)] hover:bg-gray-100 hover:text-[var(--ink)] active:scale-95 rounded-md px-2 py-1 transition-all cursor-pointer no-print flex items-center gap-1"
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
              <span>+ Add Category</span>
            </button>
          )}
          {id === "experience" && (
            <button
              className="font-sans text-[11px] font-semibold text-[var(--ink-soft)] bg-transparent border border-[var(--hairline)] hover:bg-gray-100 hover:text-[var(--ink)] active:scale-95 rounded-md px-2 py-1 transition-all cursor-pointer no-print flex items-center gap-1"
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
              <span>+ Add Position</span>
            </button>
          )}
          {id === "education" && (
            <button
              className="font-sans text-[11px] font-semibold text-[var(--ink-soft)] bg-transparent border border-[var(--hairline)] hover:bg-gray-100 hover:text-[var(--ink)] active:scale-95 rounded-md px-2 py-1 transition-all cursor-pointer no-print flex items-center gap-1"
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
              <span>+ Add Education</span>
            </button>
          )}
          {id === "projects" && (
            <button
              className="font-sans text-[11px] font-semibold text-[var(--ink-soft)] bg-transparent border border-[var(--hairline)] hover:bg-gray-100 hover:text-[var(--ink)] active:scale-95 rounded-md px-2 py-1 transition-all cursor-pointer no-print flex items-center gap-1"
              onClick={() =>
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
                ])
              }
            >
              <span>+ Add Project</span>
            </button>
          )}
          {id === "publications" && (
            <button
              className="font-sans text-[11px] font-semibold text-[var(--ink-soft)] bg-transparent border border-[var(--hairline)] hover:bg-gray-100 hover:text-[var(--ink)] active:scale-95 rounded-md px-2 py-1 transition-all cursor-pointer no-print flex items-center gap-1"
              onClick={() =>
                setPublications([
                  ...publications,
                  {
                    id: Date.now().toString(),
                    text: "<b>New Publication</b> — Journal/Conference, Year",
                  },
                ])
              }
            >
              <span>+ Add Publication</span>
            </button>
          )}
          {id === "awards" && (
            <button
              className="font-sans text-[11px] font-semibold text-[var(--ink-soft)] bg-transparent border border-[var(--hairline)] hover:bg-gray-100 hover:text-[var(--ink)] active:scale-95 rounded-md px-2 py-1 transition-all cursor-pointer no-print flex items-center gap-1"
              onClick={() =>
                setAwards([
                  ...awards,
                  {
                    id: Date.now().toString(),
                    text: "<b>New Award or Honor</b> — Issuing Body, Year",
                  },
                ])
              }
            >
              <span>+ Add Award</span>
            </button>
          )}
        </div>
      </div>
      {children}
    </Reorder.Item>
  );
});
