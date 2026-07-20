"use client";

import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import { ContentEditableField } from "./ContentEditableField";
import { Reorder, useDragControls, motion } from "motion/react";
import {
  GripVertical, GripHorizontal,
  X,
  Bold,
  Italic,
  Underline,
  Minus,
  Plus,
  Eraser,
  Printer,
  Save,
  HelpCircle,
  Palette,
  FileText,
  CloudUpload,
  Image as ImageIcon,
  Sparkles,
  RotateCcw,
  Sliders,
  Scissors,
  Eye,
  Camera,
  Undo,
  Redo,
  User as UserIcon,
  Lock,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowDownToLine,
  MessageSquare,
  Send,
  Bot,
  RefreshCw,
  Play,
  CheckSquare,
  SpellCheck,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Share2,
  Download, Settings2, Menu, X as CloseIcon, FileDown, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { z } from "zod";
import AuthModal from "./AuthModal";
import { User } from "@supabase/supabase-js";

import { hexToRgb, shadeColor, getCookie, setCookie } from "@/lib/resume-utils";
import { PRESET_AVATARS, TEMPLATES, TUTORIAL_STEPS } from "@/lib/resume-constants";
import { PageBreakGap } from "./resume/PageBreakGap";
// --- Subcomponents ---
import { DragHandle } from "./resume/DragHandle";
import { SubItemWrapper } from "./resume/SubItemWrapper";

const SaveResponseSchema = z.object({
  success: z.boolean(),
  code: z.string(),
  message: z.string().optional(),
  id: z.string().optional(),
});

interface DesignConfig {
  template: string;
  fontHeading: string;
  fontBody: string;
  accent: string;
  panel: string;
  paper: string;
  layout: string;
  scale: number;
  radius: number;
  lineHeight: number;
  gap: number;
  headingStyle: string;
  italic: boolean;
  pageSize: string;
  headerAlign: string;
  listStyle: string;
  pageMargin: number;
  pageMarginLeftRight?: number;
  pageMarginTopBottom?: number;
  itemSpacing: number;
  jobLayout: string;
  boxOpacity: number;
  boxShadow: string;
  borderStyle: string;
  backdropBlur: number;
}

interface ProfilePhotoConfig {
  enabled: boolean;
  url: string;
  rawUploadedUrl: string;
  opacity: number;
  scale: number;
  radius: number;
  filter: string;
  tone: string;
  xOffset: number;
  yOffset: number;
  borderWidth: number;
  borderColor: string;
  aspectRatio: string;
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  hueRotate: number;
  sepia: number;
  animation: string;
}

import { SectionWrapper } from "./resume/SectionWrapper";


const SafeReorderGroup = ({ isPrint, as: Component = "div", children, ...props }: any) => {
  if (isPrint) {
    const { values, onReorder, ...rest } = props;
    return <Component {...rest}>{children}</Component>;
  }
  return <Reorder.Group as={Component} {...props}>{children}</Reorder.Group>;
};

const stripHtml = (htmlString?: string) => {
  if (!htmlString) return "";
  return htmlString.replace(/<[^>]*>?/gm, "").trim();
};

const SectionRenderer = memo(({
  section,
  summary, setSummary,
  licenses, setLicenses,
  skills, setSkills,
  experiences, setExperiences,
  educations, setEducations,
  projects, setProjects,
  publications, setPublications,
  awards, setAwards,
  sectionHeaders, setSectionHeaders,
  manualBreaks, setManualBreaks,
  pageBreakElementIds,
  idToPageMap,
  targetPageIndex,
  design, gapHeights,
  spellcheckEnabled,
  isPrint,
}: any) => {
  const getPageIndex = (id: string | null | undefined): number => {
    if (!id) return 0;
    return idToPageMap?.[id] ?? 0;
  };

  const headingPage = getPageIndex(`heading-${section.id}`);
  const hideHeading = targetPageIndex !== undefined && headingPage !== targetPageIndex;

  if (targetPageIndex !== undefined) {
    if (section.id === "summary") {
      const isOnPage = getPageIndex("summary-content") === targetPageIndex || headingPage === targetPageIndex;
      if (!isOnPage) return null;
    }
    if (section.id === "licenses") {
      const isOnPage = getPageIndex("lic-list") === targetPageIndex || headingPage === targetPageIndex;
      if (!isOnPage) return null;
    }
    if (section.id === "skills") {
      const isOnPage = getPageIndex("skills-grid") === targetPageIndex || headingPage === targetPageIndex;
      if (!isOnPage) return null;
    }
    if (section.id === "publications") {
      const isOnPage = getPageIndex("pub-list") === targetPageIndex || headingPage === targetPageIndex;
      if (!isOnPage) return null;
    }
    if (section.id === "awards") {
      const isOnPage = getPageIndex("award-list") === targetPageIndex || headingPage === targetPageIndex;
      if (!isOnPage) return null;
    }
  }

  const activeExperiences = targetPageIndex !== undefined
    ? experiences.filter((exp: any) => {
        const jobHeaderPage = getPageIndex(`exp-${exp.id}`);
        const bulletsOnPage = (exp.bullets || []).some((b: any) => getPageIndex(`bullet-${b.id}`) === targetPageIndex);
        const metaOnPage = exp.meta !== undefined && getPageIndex(`meta-${exp.id}`) === targetPageIndex;
        return jobHeaderPage === targetPageIndex || bulletsOnPage || metaOnPage;
      })
    : experiences;

  const activeEducations = targetPageIndex !== undefined
    ? educations.filter((edu: any) => {
        const eduHeaderPage = getPageIndex(`edu-${edu.id}`);
        const bulletsOnPage = (edu.bullets || []).some((b: any) => getPageIndex(`edu-bullet-${b.id}`) === targetPageIndex);
        return eduHeaderPage === targetPageIndex || bulletsOnPage;
      })
    : educations;

  const activeProjects = targetPageIndex !== undefined
    ? projects.filter((proj: any) => {
        const projHeaderPage = getPageIndex(`proj-${proj.id}`);
        const bulletsOnPage = (proj.bullets || []).some((b: any) => getPageIndex(`proj-bullet-${b.id}`) === targetPageIndex);
        return projHeaderPage === targetPageIndex || bulletsOnPage;
      })
    : projects;

  if (targetPageIndex !== undefined) {
    if (section.id === "experience" && activeExperiences.length === 0 && headingPage !== targetPageIndex) return null;
    if (section.id === "education" && activeEducations.length === 0 && headingPage !== targetPageIndex) return null;
    if (section.id === "projects" && activeProjects.length === 0 && headingPage !== targetPageIndex) return null;
  }

  return (
    <SectionWrapper isPrint={isPrint}
                  hideHeading={hideHeading}
                  key={section.id}
                  id={section.id}
                  item={section}
                  manualBreaks={manualBreaks}
                  setManualBreaks={setManualBreaks}
                  pageBreakElementIds={pageBreakElementIds}
                  gapHeights={gapHeights}
                  design={design}
                  licenses={licenses}
                  setLicenses={setLicenses}
                  skills={skills}
                  setSkills={setSkills}
                  experiences={experiences}
                  setExperiences={setExperiences}
                  educations={educations}
                  setEducations={setEducations}
                  projects={projects}
                  setProjects={setProjects}
                  publications={publications}
                  setPublications={setPublications}
                  awards={awards}
                  setAwards={setAwards}
                  sectionHeaders={sectionHeaders}
                  setSectionHeaders={setSectionHeaders}
                >
                  {/* SUMMARY */}
                  {section.id === "summary" && (
                    <>
                      <PageBreakGap id="summary-content" pageBreakElementIds={pageBreakElementIds} gapHeights={gapHeights} pageMargin={design.pageMargin} pageMarginX={design.pageMarginLeftRight ?? design.pageMargin} pageMarginY={design.pageMarginTopBottom ?? design.pageMargin} disabled={targetPageIndex !== undefined} />
                      <ContentEditableField tagName="div"
                        className="summary font-[family:var(--font-body)] italic text-sm text-[var(--ink-soft)] leading-[var(--line-height)] rounded-[var(--radius)] p-4 md:p-5 mb-[var(--section-gap)] print-avoid-break outline-none print:!shadow-none print:!border-none print:!bg-transparent transition-all duration-300"
                        data-page-break-id="summary-content"
                        style={{
                          backgroundColor: "var(--panel-rgba)",
                          border: "var(--box-border)",
                          boxShadow: "var(--box-shadow)",
                          backdropFilter: "blur(var(--backdrop-blur))",
                          WebkitBackdropFilter: "blur(var(--backdrop-blur))",
                          breakBefore: pageBreakElementIds.includes("summary-content") ? "page" : "auto",
                        }}
                        html={summary} onChange={(val) => { setSummary(val); }}
                        spellCheck={spellcheckEnabled}
                      />
                    </>
                  )}

                  {/* LICENSES */}
                  {section.id === "licenses" && (
                    <>
                      <PageBreakGap id="lic-list" pageBreakElementIds={pageBreakElementIds} gapHeights={gapHeights} pageMargin={design.pageMargin} pageMarginX={design.pageMarginLeftRight ?? design.pageMargin} pageMarginY={design.pageMarginTopBottom ?? design.pageMargin} disabled={targetPageIndex !== undefined} />
                      <SafeReorderGroup isPrint={isPrint}
                        values={licenses}
                        onReorder={setLicenses}
                        as="ul"
                        className="bullet-list m-0 p-4 md:p-5 pl-9 rounded-[var(--radius)] mb-[var(--section-gap)] print-avoid-break print:!shadow-none print:!border-none print:!bg-transparent transition-all duration-300"
                        id="lic-list"
                        data-page-break-id="lic-list"
                        style={{
                          backgroundColor: "var(--panel-rgba)",
                          border: "var(--box-border)",
                          boxShadow: "var(--box-shadow)",
                          backdropFilter: "blur(var(--backdrop-blur))",
                          WebkitBackdropFilter: "blur(var(--backdrop-blur))",
                          breakBefore: pageBreakElementIds.includes("lic-list") ? "page" : "auto",
                        }}
                      >
                        {licenses.map((lic: any) => (
<SubItemWrapper isPrint={isPrint}
                              key={lic.id}
                              value={lic}
                              id={lic.id}
                              
                              className="relative group pl-1 mb-2"
                            >
{(dc: any) => (<>

                              <div className="absolute left-[-1.8rem] top-0 no-print">
                                <DragHandle dragControls={dc} />
                              </div>
                              <ContentEditableField tagName="span"
                                className="font-[family:var(--font-body)] italic text-sm text-[var(--ink-soft)] leading-[var(--line-height)] outline-none"
                                html={lic.text} onChange={(val) => { setLicenses((prev: any[]) =>
                                    prev.map((x) =>
                                      x.id === lic.id ? { ...x, text: val } : x,
                                    ),
                                  ); }}
                                spellCheck={spellcheckEnabled}
                              />
                              <button
                                className="hidden group-hover:inline ml-2 text-[var(--danger)] text-[11px] font-bold cursor-pointer font-sans no-print"
                                onClick={() =>
                                  setLicenses((l: any[]) =>
                                    l.filter((x) => x.id !== lic.id),
                                  )
                                }
                              >
                                ✕ remove
                              </button>
                            
</>)}
</SubItemWrapper>
))}
                      </SafeReorderGroup>
                    </>
                  )}

                  {/* SKILLS */}
                  {section.id === "skills" && (
                    <>
                      <PageBreakGap id="skills-grid" pageBreakElementIds={pageBreakElementIds} gapHeights={gapHeights} pageMargin={design.pageMargin} pageMarginX={design.pageMarginLeftRight ?? design.pageMargin} pageMarginY={design.pageMarginTopBottom ?? design.pageMargin} disabled={targetPageIndex !== undefined} />
                      <SafeReorderGroup isPrint={isPrint}
                        values={skills}
                        onReorder={setSkills}
                        className="skills-grid grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 rounded-[var(--radius)] p-5 mb-[var(--section-gap)] print-avoid-break print:!shadow-none print:!border-none print:!bg-transparent transition-all duration-300"
                        id="skills-grid"
                        data-page-break-id="skills-grid"
                        style={{
                          backgroundColor: "var(--panel-rgba)",
                          border: "var(--box-border)",
                          boxShadow: "var(--box-shadow)",
                          backdropFilter: "blur(var(--backdrop-blur))",
                          WebkitBackdropFilter: "blur(var(--backdrop-blur))",
                          breakBefore: pageBreakElementIds.includes("skills-grid") ? "page" : "auto",
                        }}
                      >
                        {skills.map((sk: any) => (
                            <SubItemWrapper isPrint={isPrint}
                              key={sk.id}
                              value={sk}
                              id={sk.id}
                              className="skill-cat relative pl-6 group"
                            >
{(dc: any) => (<>

                              <div className="absolute left-0 top-0.5 no-print">
                                <DragHandle dragControls={dc} />
                              </div>
                              <div className="hidden group-hover:flex items-center gap-2 absolute right-0 top-0 no-print">
                                <button
                                  className="text-[var(--accent)] text-[10px] font-bold cursor-pointer font-sans bg-white px-1.5 py-0.5 rounded border border-gray-200 shadow-xs hover:bg-gray-50 transition-colors"
                                  onClick={() => {
                                    setSkills((prev: any[]) => prev.map(x => x.id === sk.id ? { ...x, showProgress: !x.showProgress } : x));
                                  }}
                                  title="Toggle progress bars for this category"
                                >
                                  📊 {sk.showProgress ? "Plain Text" : "Bar Levels"}
                                </button>
                                <button
                                  className="text-[var(--danger)] text-[11px] font-bold cursor-pointer font-sans"
                                  onClick={() =>
                                    setSkills((s: any[]) =>
                                      s.filter((x) => x.id !== sk.id),
                                    )
                                  }
                                >
                                  ✕
                                </button>
                              </div>
                              <ContentEditableField tagName="div"
                                className="cat-title font-[family:var(--font-heading)] font-bold text-[14px] text-[var(--ink)] mb-1 outline-none"
                                html={sk.title} onChange={(val) => { setSkills((prev: any[]) =>
                                    prev.map((x) =>
                                      x.id === sk.id ? { ...x, title: val } : x,
                                    ),
                                  ); }}
                                spellCheck={spellcheckEnabled}
                              />
                              
                              {sk.showProgress ? (
                                <div className="mt-2.5 space-y-3 pr-2">
                                  {sk.items.split(",").map((it: string) => it.trim()).filter(Boolean).map((skillName: string) => {
                                    const level = sk.levels?.[skillName] ?? 80;
                                    return (
                                      <div key={skillName} className="skill-level-row flex flex-col gap-1">
                                        <div className="flex justify-between items-center text-xs">
                                          <span className="font-semibold text-[var(--ink)] text-[12px]">{skillName}</span>
                                          <span className="text-[var(--ink-soft)] font-mono text-[10px] no-print">{level}%</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <div className="flex-1 bg-gray-200/60 rounded-full h-2 overflow-hidden relative shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] border border-gray-300/30">
                                            <div 
                                              className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-[var(--accent)] to-[var(--accent)]"
                                              style={{ 
                                                width: `${level}%`,
                                                opacity: 0.95,
                                                boxShadow: "0 1px 3px rgba(0,0,0,0.12)"
                                              }}
                                            />
                                          </div>
                                          <input 
                                            type="range"
                                            min="10"
                                            max="100"
                                            value={level}
                                            onChange={(e) => {
                                              const newLvl = parseInt(e.target.value);
                                              setSkills((prev: any[]) => prev.map(x => {
                                                if (x.id === sk.id) {
                                                  return {
                                                    ...x,
                                                    levels: {
                                                      ...(x.levels ?? {}),
                                                      [skillName]: newLvl
                                                    }
                                                  };
                                                }
                                                return x;
                                              }));
                                            }}
                                            className="w-16 h-3.5 accent-[var(--accent)] cursor-pointer no-print opacity-50 hover:opacity-100 transition-opacity"
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <ContentEditableField tagName="div"
                                  className="cat-items font-[family:var(--font-body)] italic text-sm text-[var(--ink-soft)] leading-[var(--line-height)] outline-none"
                                  html={sk.items} onChange={(val) => { setSkills((prev: any[]) =>
                                      prev.map((x) =>
                                        x.id === sk.id ? { ...x, items: val } : x,
                                      ),
                                    ); }}
                                  spellCheck={spellcheckEnabled}
                                />
                              )}
                            
</>)}
</SubItemWrapper>
))}
                      </SafeReorderGroup>
                    </>
                  )}

                  {/* EXPERIENCE */}
                  {section.id === "experience" && (
                    <SafeReorderGroup isPrint={isPrint}
                      values={activeExperiences}
                      onReorder={setExperiences}
                    >
                      {activeExperiences.map((exp: any) => {
                        const jobHeaderPage = getPageIndex(`exp-${exp.id}`);
                        const isContinuation = targetPageIndex !== undefined && jobHeaderPage < targetPageIndex;
                        const visibleBullets = targetPageIndex !== undefined
                          ? (exp.bullets || []).filter((b: any) => getPageIndex(`bullet-${b.id}`) === targetPageIndex)
                          : (exp.bullets || []);
                        const showMeta = targetPageIndex === undefined || getPageIndex(`meta-${exp.id}`) === targetPageIndex;

                        return (
                            <SubItemWrapper isPrint={isPrint}
                              key={exp.id}
                              value={exp}
                              id={`exp-${exp.id}`}
                              
                              className="exp-entry relative rounded-[var(--radius)] p-4 md:p-5 mb-[var(--section-gap)] print-avoid-break pl-9 group print:!shadow-none print:!border-none print:!bg-transparent transition-all duration-300"
                              data-page-break-id={isContinuation ? undefined : `exp-${exp.id}`}
                              style={{
                                backgroundColor: "var(--panel-rgba)",
                                border: "var(--box-border)",
                                boxShadow: "var(--box-shadow)",
                                backdropFilter: "blur(var(--backdrop-blur))",
                                WebkitBackdropFilter: "blur(var(--backdrop-blur))",
                                breakBefore: pageBreakElementIds.includes(`exp-${exp.id}`) ? "page" : "auto",
                              }}
                            >
{(dc: any) => (<>
                              <PageBreakGap id={`exp-${exp.id}`} pageBreakElementIds={pageBreakElementIds} gapHeights={gapHeights} pageMargin={design.pageMargin} pageMarginX={design.pageMarginLeftRight ?? design.pageMargin} pageMarginY={design.pageMarginTopBottom ?? design.pageMargin} disabled={targetPageIndex !== undefined} />

                              <div className="absolute left-2 top-4 no-print">
                                <DragHandle dragControls={dc} />
                              </div>
                              <button
                                onClick={() =>
                                  setExperiences((e: any[]) =>
                                    e.filter((x) => x.id !== exp.id),
                                  )
                                }
                                className="remove-entry absolute top-2 right-2 md:top-3 md:right-3 bg-transparent border-none text-[var(--danger)] text-[11px] font-bold cursor-pointer opacity-50 hover:opacity-100 font-sans no-print flex items-center gap-1 hidden group-hover:flex"
                              >
                                <X size={12} /> remove
                              </button>
                              {isContinuation ? (
                                <div className="exp-header mb-2 pb-1 border-b border-gray-200/60 flex justify-between items-baseline">
                                  <span className="font-[family:var(--font-heading)] font-bold text-base text-[var(--ink)]">
                                    {stripHtml(exp.title)} <span className="text-xs font-normal text-gray-500 italic">(Continued)</span>
                                  </span>
                                </div>
                              ) : (
                              <div
                                className={cn(
                                  "exp-header",
                                  design.jobLayout === "split"
                                    ? "flex flex-col sm:flex-row justify-between items-start sm:items-baseline"
                                    : "",
                                )}
                              >
                               <ContentEditableField tagName="div"
                                  className="exp-line1 font-[family:var(--font-heading)] font-bold text-base text-[var(--ink)] outline-none"
                                  html={exp.title} onChange={(val) => { setExperiences((prev: any[]) =>
                                      prev.map((x) =>
                                        x.id === exp.id ? { ...x, title: val } : x,
                                      ),
                                    ); }}
                                  spellCheck={spellcheckEnabled}
                                />
                                <ContentEditableField tagName="div"
                                  className={cn(
                                    "exp-line2 font-[family:var(--font-body)] italic font-semibold text-[13px] text-[var(--ink-soft)] outline-none",
                                    design.jobLayout === "split"
                                      ? "sm:ml-4 text-left sm:text-right shrink-0 mt-1 sm:my-0"
                                      : "my-1",
                                  )}
                                  html={exp.date} onChange={(val) => { setExperiences((prev: any[]) =>
                                      prev.map((x) =>
                                        x.id === exp.id ? { ...x, date: val } : x,
                                      ),
                                    ); }}
                                  spellCheck={spellcheckEnabled}
                                />
                              </div>
                              )}
                              <ul className="m-0 pl-5 exp-bullets mt-2">
                                {visibleBullets.map((b: any) => (
                                  <li
                                    key={b.id}
                                    data-page-break-id={`bullet-${b.id}`}
                                    className="relative group/bullet pl-1 mb-1.5"
                                    style={{
                                      breakBefore: pageBreakElementIds.includes(`bullet-${b.id}`) ? "page" : "auto",
                                    }}
                                  >
                                    <PageBreakGap id={`bullet-${b.id}`} pageBreakElementIds={pageBreakElementIds} gapHeights={gapHeights} pageMargin={design.pageMargin} pageMarginX={design.pageMarginLeftRight ?? design.pageMargin} pageMarginY={design.pageMarginTopBottom ?? design.pageMargin} disabled={targetPageIndex !== undefined} />
                                    <ContentEditableField tagName="span"
                                      className="font-[family:var(--font-body)] italic text-sm text-[var(--ink-soft)] leading-[var(--line-height)] block outline-none"
                                      html={b.text} onChange={(val) => { setExperiences((prev: any[]) =>
                                          prev.map((x) =>
                                            x.id === exp.id
                                              ? {
                                                  ...x,
                                                  bullets: x.bullets.map((y: any) =>
                                                    y.id === b.id ? { ...y, text: val } : y,
                                                  ),
                                                }
                                              : x,
                                          ),
                                        ); }}
                                      spellCheck={spellcheckEnabled}
                                    />
                                    <button
                                      className="hidden group-hover/bullet:inline absolute -left-4 top-1 text-[var(--danger)] text-[11px] font-bold cursor-pointer font-sans no-print"
                                      onClick={() =>
                                        setExperiences((e: any[]) =>
                                          e.map((x) =>
                                            x.id === exp.id
                                              ? {
                                                  ...x,
                                                  bullets: x.bullets.filter(
                                                    (y: any) => y.id !== b.id,
                                                  ),
                                                }
                                              : x,
                                          ),
                                        )
                                      }
                                    >
                                      ✕
                                    </button>
                                  </li>
                                ))}
                              </ul>
                              <button
                                onClick={() =>
                                  setExperiences((e: any[]) =>
                                    e.map((x) =>
                                      x.id === exp.id
                                        ? {
                                            ...x,
                                            bullets: [
                                              ...x.bullets,
                                              {
                                                id: Date.now().toString(),
                                                text: "New bullet",
                                              },
                                            ],
                                          }
                                        : x,
                                    ),
                                  )
                                }
                                className="add-bullet font-sans text-[11px] font-semibold text-[var(--accent)] bg-transparent border border-dashed border-[var(--accent)] rounded-md px-2 py-1 cursor-pointer mt-2 ml-5 no-print"
                              >
                                + bullet
                              </button>
                              {exp.meta !== undefined && showMeta && (
                                <div
                                  data-page-break-id={`meta-${exp.id}`}
                                  className="w-full"
                                  style={{
                                    breakBefore: pageBreakElementIds.includes(`meta-${exp.id}`) ? "page" : "auto",
                                  }}
                                >
                                  <PageBreakGap id={`meta-${exp.id}`} pageBreakElementIds={pageBreakElementIds} gapHeights={gapHeights} pageMargin={design.pageMargin} pageMarginX={design.pageMarginLeftRight ?? design.pageMargin} pageMarginY={design.pageMarginTopBottom ?? design.pageMargin} disabled={targetPageIndex !== undefined} />
                                  <ContentEditableField tagName="div"
                                    className="exp-meta mt-3 pt-2 border-t border-[var(--hairline)] font-sans text-xs text-[var(--ink-soft)] font-medium leading-relaxed outline-none"
                                    html={exp.meta} onChange={(val) => { setExperiences((prev: any[]) =>
                                        prev.map((x) =>
                                          x.id === exp.id ? { ...x, meta: val } : x,
                                        ),
                                      ); }}
                                    spellCheck={spellcheckEnabled}
                                  />
                                </div>
                              )}
                            
</>)}
</SubItemWrapper>
);
})}
                    </SafeReorderGroup>
                  )}
                  {/* EDUCATION */}
                  {section.id === "education" && (
                    <SafeReorderGroup isPrint={isPrint}
                      values={activeEducations}
                      onReorder={setEducations}
                    >
                      {activeEducations.map((edu: any) => {
                        const eduHeaderPage = getPageIndex(`edu-${edu.id}`);
                        const isContinuation = targetPageIndex !== undefined && eduHeaderPage < targetPageIndex;
                        const visibleBullets = targetPageIndex !== undefined
                          ? (edu.bullets || []).filter((b: any) => getPageIndex(`edu-bullet-${b.id}`) === targetPageIndex)
                          : (edu.bullets || []);

                        return (
                            <SubItemWrapper isPrint={isPrint}
                              key={edu.id}
                              value={edu}
                              id={`edu-${edu.id}`}
                              
                              className="edu-entry relative rounded-[var(--radius)] p-4 md:p-5 mb-2 print-avoid-break pl-9 group print:!shadow-none print:!border-none print:!bg-transparent transition-all duration-300"
                              data-page-break-id={isContinuation ? undefined : `edu-${edu.id}`}
                              style={{
                                backgroundColor: "var(--panel-rgba)",
                                border: "var(--box-border)",
                                boxShadow: "var(--box-shadow)",
                                backdropFilter: "blur(var(--backdrop-blur))",
                                WebkitBackdropFilter: "blur(var(--backdrop-blur))",
                                breakBefore: pageBreakElementIds.includes(`edu-${edu.id}`) ? "page" : "auto",
                              }}
                            >
{(dc: any) => (<>
                              <PageBreakGap id={`edu-${edu.id}`} pageBreakElementIds={pageBreakElementIds} gapHeights={gapHeights} pageMargin={design.pageMargin} pageMarginX={design.pageMarginLeftRight ?? design.pageMargin} pageMarginY={design.pageMarginTopBottom ?? design.pageMargin} disabled={targetPageIndex !== undefined} />

                              <div className="absolute left-2 top-4 no-print">
                                <DragHandle dragControls={dc} />
                              </div>
                              <button
                                onClick={() =>
                                  setEducations((e: any[]) =>
                                    e.filter((x) => x.id !== edu.id),
                                  )
                                }
                                className="remove-entry absolute top-2 right-2 md:top-3 md:right-3 bg-transparent border-none text-[var(--danger)] text-[11px] font-bold cursor-pointer opacity-50 hover:opacity-100 font-sans no-print flex items-center gap-1 hidden group-hover:flex"
                              >
                                <X size={12} /> remove
                              </button>
                              {isContinuation ? (
                                <div className="edu-header mb-2 pb-1 border-b border-gray-200/60 flex justify-between items-baseline">
                                  <span className="font-[family:var(--font-heading)] font-bold text-base text-[var(--ink)]">
                                    {stripHtml(edu.degree)} <span className="text-xs font-normal text-gray-500 italic">(Continued)</span>
                                  </span>
                                </div>
                              ) : (
                              <ContentEditableField tagName="div"
                                className="edu-degree font-[family:var(--font-heading)] font-bold text-base text-[var(--ink)] outline-none"
                                html={edu.degree} onChange={(val) => { setEducations((prev: any[]) =>
                                    prev.map((x) =>
                                      x.id === edu.id ? { ...x, degree: val } : x,
                                    ),
                                  ); }}
                                spellCheck={spellcheckEnabled}
                              />
                              )}
                              <ul className="m-0 pl-5 edu-bullets mt-1">
                                {visibleBullets.map((b: any) => (
                                  <li
                                    key={b.id}
                                    data-page-break-id={`edu-bullet-${b.id}`}
                                    className="relative group/bullet pl-1 mb-1"
                                    style={{
                                      breakBefore: pageBreakElementIds.includes(`edu-bullet-${b.id}`) ? "page" : "auto",
                                    }}
                                  >
                                    <PageBreakGap id={`edu-bullet-${b.id}`} pageBreakElementIds={pageBreakElementIds} gapHeights={gapHeights} pageMargin={design.pageMargin} pageMarginX={design.pageMarginLeftRight ?? design.pageMargin} pageMarginY={design.pageMarginTopBottom ?? design.pageMargin} disabled={targetPageIndex !== undefined} />
                                    <ContentEditableField tagName="span"
                                      className="font-[family:var(--font-body)] italic text-sm text-[var(--ink-soft)] leading-[var(--line-height)] block outline-none"
                                      html={b.text} onChange={(val) => { setEducations((prev: any[]) =>
                                          prev.map((x) =>
                                            x.id === edu.id
                                              ? {
                                                  ...x,
                                                  bullets: x.bullets.map((y: any) =>
                                                    y.id === b.id ? { ...y, text: val } : y,
                                                  ),
                                                }
                                              : x,
                                          ),
                                        ); }}
                                      spellCheck={spellcheckEnabled}
                                    />
                                    <button
                                      className="hidden group-hover/bullet:inline absolute -left-4 top-1 text-[var(--danger)] text-[11px] font-bold cursor-pointer font-sans no-print"
                                      onClick={() =>
                                        setEducations((e: any[]) =>
                                          e.map((x) =>
                                            x.id === edu.id
                                              ? {
                                                  ...x,
                                                  bullets: x.bullets.filter(
                                                    (y: any) => y.id !== b.id,
                                                  ),
                                                }
                                              : x,
                                          ),
                                        )
                                      }
                                    >
                                      ✕
                                    </button>
                                  </li>
                                ))}
                              </ul>
                              <button
                                onClick={() =>
                                  setEducations((e: any[]) =>
                                    e.map((x) =>
                                      x.id === edu.id
                                        ? {
                                            ...x,
                                            bullets: [
                                              ...x.bullets,
                                              {
                                                id: Date.now().toString(),
                                                text: "New bullet",
                                              },
                                            ],
                                          }
                                        : x,
                                    ),
                                  )
                                }
                                className="add-bullet font-sans text-[11px] font-semibold text-[var(--accent)] bg-transparent border border-dashed border-[var(--accent)] rounded-md px-2 py-1 cursor-pointer mt-2 ml-5 no-print"
                              >
                                + bullet
                              </button>
                            
</>)}
</SubItemWrapper>
);
})}
                    </SafeReorderGroup>
                  )}

                  {/* PROJECTS */}
                  {section.id === "projects" && (
                    <SafeReorderGroup isPrint={isPrint}
                      values={activeProjects}
                      onReorder={setProjects}
                    >
                      {activeProjects?.map((proj: any) => {
                        const projHeaderPage = getPageIndex(`proj-${proj.id}`);
                        const isContinuation = targetPageIndex !== undefined && projHeaderPage < targetPageIndex;
                        const visibleBullets = targetPageIndex !== undefined
                          ? (proj.bullets || []).filter((b: any) => getPageIndex(`proj-bullet-${b.id}`) === targetPageIndex)
                          : (proj.bullets || []);

                        return (
                            <SubItemWrapper isPrint={isPrint}
                              key={proj.id}
                              value={proj}
                              id={`proj-${proj.id}`}
                              className="proj-entry relative rounded-[var(--radius)] p-4 md:p-5 mb-2 print-avoid-break pl-9 group print:!shadow-none print:!border-none print:!bg-transparent transition-all duration-300"
                              data-page-break-id={isContinuation ? undefined : `proj-${proj.id}`}
                              style={{
                                backgroundColor: "var(--panel-rgba)",
                                border: "var(--box-border)",
                                boxShadow: "var(--box-shadow)",
                                backdropFilter: "blur(var(--backdrop-blur))",
                                WebkitBackdropFilter: "blur(var(--backdrop-blur))",
                                breakBefore: pageBreakElementIds.includes(`proj-${proj.id}`) ? "page" : "auto",
                              }}
                            >
{(dc: any) => (<>
                              <PageBreakGap id={`proj-${proj.id}`} pageBreakElementIds={pageBreakElementIds} gapHeights={gapHeights} pageMargin={design.pageMargin} pageMarginX={design.pageMarginLeftRight ?? design.pageMargin} pageMarginY={design.pageMarginTopBottom ?? design.pageMargin} disabled={targetPageIndex !== undefined} />

                              <div className="absolute left-2 top-4 no-print">
                                <DragHandle dragControls={dc} />
                              </div>
                              <button
                                onClick={() =>
                                  setProjects((p: any[]) =>
                                    p.filter((x) => x.id !== proj.id),
                                  )
                                }
                                className="remove-entry absolute top-2 right-2 md:top-3 md:right-3 bg-transparent border-none text-[var(--danger)] text-[11px] font-bold cursor-pointer opacity-50 hover:opacity-100 font-sans no-print flex items-center gap-1 hidden group-hover:flex"
                              >
                                <X size={12} /> remove
                              </button>
                              {isContinuation ? (
                                <div className="proj-header mb-2 pb-1 border-b border-gray-200/60 flex justify-between items-baseline">
                                  <span className="font-[family:var(--font-heading)] font-bold text-base text-[var(--ink)]">
                                    {stripHtml(proj.title || "Project")} <span className="text-xs font-normal text-gray-500 italic">(Continued)</span>
                                  </span>
                                </div>
                              ) : (
                              <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-1 mb-1">
                                <ContentEditableField tagName="div"
                                  className="proj-title font-[family:var(--font-heading)] font-bold text-base text-[var(--ink)] outline-none flex-1"
                                  html={proj.title} onChange={(val) => { setProjects((prev: any[]) =>
                                      prev.map((x) =>
                                        x.id === proj.id ? { ...x, title: val } : x,
                                      ),
                                    ); }}
                                  spellCheck={spellcheckEnabled}
                                />
                                <ContentEditableField tagName="div"
                                  className="proj-date font-mono text-xs text-[var(--ink-soft)] font-medium no-print md:print:block"
                                  html={proj.date} onChange={(val) => { setProjects((prev: any[]) =>
                                      prev.map((x) =>
                                        x.id === proj.id ? { ...x, date: val } : x,
                                      ),
                                    ); }}
                                  spellCheck={spellcheckEnabled}
                                />
                              </div>
                              )}

                              <ul className="m-0 pl-5 proj-bullets mt-1">
                                {visibleBullets?.map((b: any) => (
                                  <li
                                    key={b.id}
                                    data-page-break-id={`proj-bullet-${b.id}`}
                                    className="relative group/bullet pl-1 mb-1"
                                    style={{
                                      breakBefore: pageBreakElementIds.includes(`proj-bullet-${b.id}`) ? "page" : "auto",
                                    }}
                                  >
                                    <PageBreakGap id={`proj-bullet-${b.id}`} pageBreakElementIds={pageBreakElementIds} gapHeights={gapHeights} pageMargin={design.pageMargin} pageMarginX={design.pageMarginLeftRight ?? design.pageMargin} pageMarginY={design.pageMarginTopBottom ?? design.pageMargin} disabled={targetPageIndex !== undefined} />
                                    <ContentEditableField tagName="span"
                                      className="font-[family:var(--font-body)] text-sm text-[var(--ink-soft)] leading-[var(--line-height)] block outline-none"
                                      html={b.text} onChange={(val) => { setProjects((prev: any[]) =>
                                          prev.map((x) =>
                                            x.id === proj.id
                                              ? {
                                                  ...x,
                                                  bullets: x.bullets.map((y: any) =>
                                                    y.id === b.id ? { ...y, text: val } : y,
                                                  ),
                                                }
                                              : x,
                                          ),
                                        ); }}
                                      spellCheck={spellcheckEnabled}
                                    />
                                    <button
                                      className="hidden group-hover/bullet:inline absolute -left-4 top-1 text-[var(--danger)] text-[11px] font-bold cursor-pointer font-sans no-print"
                                      onClick={() =>
                                        setProjects((p: any[]) =>
                                          p.map((x) =>
                                            x.id === proj.id
                                              ? {
                                                  ...x,
                                                  bullets: x.bullets.filter(
                                                    (y: any) => y.id !== b.id,
                                                  ),
                                                }
                                              : x,
                                          ),
                                        )
                                      }
                                    >
                                      ✕
                                    </button>
                                  </li>
                                ))}
                              </ul>
                              <button
                                onClick={() =>
                                  setProjects((p: any[]) =>
                                    p.map((x) =>
                                      x.id === proj.id
                                        ? {
                                            ...x,
                                            bullets: [
                                              ...(x.bullets ?? []),
                                              {
                                                id: Date.now().toString(),
                                                text: "New bullet",
                                              },
                                            ],
                                          }
                                        : x,
                                    ),
                                  )
                                }
                                className="add-bullet font-sans text-[11px] font-semibold text-[var(--accent)] bg-transparent border border-dashed border-[var(--accent)] rounded-md px-2 py-1 cursor-pointer mt-2 ml-5 no-print"
                              >
                                + bullet
                              </button>
                            
</>)}
                            </SubItemWrapper>
);
})}
                    </SafeReorderGroup>
                  )}

                  {/* PUBLICATIONS */}
                  {section.id === "publications" && (
                    <SafeReorderGroup isPrint={isPrint}
                      values={publications}
                      onReorder={setPublications}
                      as="ul"
                      className="bullet-list m-0 p-4 md:p-5 pl-9 rounded-[var(--radius)] mb-[var(--section-gap)] print-avoid-break print:!shadow-none print:!border-none print:!bg-transparent transition-all duration-300"
                      id="pub-list"
                      data-page-break-id="pub-list"
                      style={{
                        backgroundColor: "var(--panel-rgba)",
                        border: "var(--box-border)",
                        boxShadow: "var(--box-shadow)",
                        backdropFilter: "blur(var(--backdrop-blur))",
                        WebkitBackdropFilter: "blur(var(--backdrop-blur))",
                        breakBefore: pageBreakElementIds.includes("pub-list") ? "page" : "auto",
                      }}
                    >
                      {publications?.map((pub: any) => (
                          <SubItemWrapper isPrint={isPrint}
                            key={pub.id}
                            value={pub}
                            id={pub.id}
                            className="relative group pl-1 mb-2"
                          >
{(dc: any) => (<>
                            <div className="absolute left-[-1.8rem] top-0 no-print">
                              <DragHandle dragControls={dc} />
                            </div>
                            <ContentEditableField tagName="span"
                              className="font-[family:var(--font-body)] text-sm text-[var(--ink-soft)] leading-[var(--line-height)] outline-none"
                              html={pub.text} onChange={(val) => { setPublications((prev: any[]) =>
                                  prev.map((x) =>
                                    x.id === pub.id ? { ...x, text: val } : x,
                                  ),
                                ); }}
                              spellCheck={spellcheckEnabled}
                            />
                            <button
                              className="hidden group-hover:inline ml-2 text-[var(--danger)] text-[11px] font-bold cursor-pointer font-sans no-print"
                              onClick={() =>
                                setPublications((p: any[]) =>
                                  p.filter((x) => x.id !== pub.id),
                                )
                              }
                            >
                              ✕ remove
                            </button>
                          
</>)}
                          </SubItemWrapper>
                      ))}
                    </SafeReorderGroup>
                  )}

                  {/* AWARDS */}
                  {section.id === "awards" && (
                    <SafeReorderGroup isPrint={isPrint}
                      values={awards}
                      onReorder={setAwards}
                      as="ul"
                      className="bullet-list m-0 p-4 md:p-5 pl-9 rounded-[var(--radius)] mb-[var(--section-gap)] print-avoid-break print:!shadow-none print:!border-none print:!bg-transparent transition-all duration-300"
                      id="award-list"
                      data-page-break-id="award-list"
                      style={{
                        backgroundColor: "var(--panel-rgba)",
                        border: "var(--box-border)",
                        boxShadow: "var(--box-shadow)",
                        backdropFilter: "blur(var(--backdrop-blur))",
                        WebkitBackdropFilter: "blur(var(--backdrop-blur))",
                        breakBefore: pageBreakElementIds.includes("award-list") ? "page" : "auto",
                      }}
                    >
                      {awards?.map((aw: any) => (
                          <SubItemWrapper isPrint={isPrint}
                            key={aw.id}
                            value={aw}
                            id={aw.id}
                            className="relative group pl-1 mb-2"
                          >
{(dc: any) => (<>
                            <div className="absolute left-[-1.8rem] top-0 no-print">
                              <DragHandle dragControls={dc} />
                            </div>
                            <ContentEditableField tagName="span"
                              className="font-[family:var(--font-body)] text-sm text-[var(--ink-soft)] leading-[var(--line-height)] outline-none"
                              html={aw.text} onChange={(val) => { setAwards((prev: any[]) =>
                                  prev.map((x) =>
                                    x.id === aw.id ? { ...x, text: val } : x,
                                  ),
                                ); }}
                              spellCheck={spellcheckEnabled}
                            />
                            <button
                              className="hidden group-hover:inline ml-2 text-[var(--danger)] text-[11px] font-bold cursor-pointer font-sans no-print"
                              onClick={() =>
                                setAwards((a: any[]) =>
                                  a.filter((x) => x.id !== aw.id),
                                )
                              }
                            >
                              ✕ remove
                            </button>
                          
</>)}
                          </SubItemWrapper>
                      ))}
                    </SafeReorderGroup>
                  )}
                </SectionWrapper>
  );
}, (prev, next) => {
  if (prev.targetPageIndex !== next.targetPageIndex) return false;
  if (prev.idToPageMap !== next.idToPageMap) return false;
  if (prev.section !== next.section) return false;
  if (prev.design !== next.design) return false;
  if (prev.gapHeights !== next.gapHeights) return false;
  if (prev.pageBreakElementIds !== next.pageBreakElementIds) return false;
  if (prev.manualBreaks !== next.manualBreaks) return false;
  if (prev.spellcheckEnabled !== next.spellcheckEnabled) return false;
  if (prev.sectionHeaders?.[next.section.id] !== next.sectionHeaders?.[next.section.id]) return false;
  
  if (next.section.id === "summary") return prev.summary === next.summary;
  if (next.section.id === "licenses") return prev.licenses === next.licenses;
  if (next.section.id === "skills") return prev.skills === next.skills;
  if (next.section.id === "experience") return prev.experiences === next.experiences;
  if (next.section.id === "education") return prev.educations === next.educations;
  if (next.section.id === "projects") return prev.projects === next.projects;
  if (next.section.id === "publications") return prev.publications === next.publications;
  if (next.section.id === "awards") return prev.awards === next.awards;
  
  return true;
});

export default function ResumeBuilder({ onBack, initialTemplateId }: { onBack?: () => void, initialTemplateId?: string }) {
  // --- Local Draft Retrieval ---
  let localDraft: any = null;
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) {
      try {
        const saved = localStorage.getItem("resume_autosave_content");
        if (saved) {
          localDraft = JSON.parse(saved);
        }
      } catch (e) {
        console.error("Failed to parse localDraft:", e);
      }
    }
  }

  // --- UI State ---
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(true);
  const [tutorialOpen, setTutorialOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const hasSeenLocal = localStorage.getItem("resume_tutorial_seen");
      const hasSeenCookie = getCookie("resume_tutorial_seen");
      return !hasSeenLocal && !hasSeenCookie;
    }
    return false;
  });
  const [dontShowTutorialAgain, setDontShowTutorialAgain] = useState(() => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem("resume_tutorial_seen") || !!getCookie("resume_tutorial_seen");
    }
    return false;
  });
  const [tutorialStep, setTutorialStep] = useState(0);
  const [designPanelOpen, setDesignPanelOpen] = useState(false);
  const [pageDrawerOpen, setPageDrawerOpen] = useState(false);
  const [spellcheckEnabled, setSpellcheckEnabled] = useState(true);
  const [canvasZoom, setCanvasZoom] = useState<number>(100);
  const [printPreviewMode, setPrintPreviewMode] = useState<boolean>(false);
  const [showMarginGuides, setShowMarginGuides] = useState<boolean>(true);

  // --- Design State ---
  const [design, setDesign] = useState<DesignConfig>(() => {
    const initialTemplate = initialTemplateId ? TEMPLATES.find(t => t.id === initialTemplateId) : null;
    return initialTemplate ?? localDraft?.design ?? {
    template: "classic",
    fontHeading: "'Kalam',cursive",
    fontBody: "'Lora',serif",
    accent: "#3a353a",
    panel: "#ffffff",
    paper: "#ffffff",
    layout: "classic",
    scale: 100,
    radius: 10,
    lineHeight: 1.55,
    gap: 14,
    headingStyle: "bar",
    italic: true,
    pageSize: "letter",
    headerAlign: "left",
    listStyle: "disc",
    pageMargin: 38,
    itemSpacing: 16,
    jobLayout: "stacked",
    boxOpacity: 95,
    boxShadow: "none",
    borderStyle: "none",
    backdropBlur: 4,
    };
  });

  // --- Profile Photo State ---
  const [profilePhoto, setProfilePhoto] = useState<ProfilePhotoConfig>(() => localDraft?.profilePhoto ?? {
    enabled: false,
    url: "https://picsum.photos/seed/portrait/150/150",
    rawUploadedUrl: "",
    opacity: 100,
    scale: 100,
    radius: 50,
    filter: "none",
    tone: "none",
    xOffset: 0,
    yOffset: 0,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    aspectRatio: "1:1",
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    hueRotate: 0,
    sepia: 0,
    animation: "none",
  });

  const [eraseModalOpen, setEraseModalOpen] = useState(false);
  const [bgRemoveSensitivity, setBgRemoveSensitivity] = useState(40);
  const [bgRemoveColor, setBgRemoveColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(20);
  const isDrawingRef = useRef(false);
  const eraserCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load image onto eraser canvas when modal opens
  useEffect(() => {
    if (eraseModalOpen) {
      setTimeout(() => {
        const canvas = eraserCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = profilePhoto.rawUploadedUrl || profilePhoto.url;
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
        };
      }, 100);
    }
  }, [eraseModalOpen, profilePhoto.url, profilePhoto.rawUploadedUrl]);

  const getCoordinates = (e: any) => {
    const canvas = eraserCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: any) => {
    e.preventDefault();
    isDrawingRef.current = true;
    const coords = getCoordinates(e);
    if (!coords) return;
    const canvas = eraserCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.globalCompositeOperation = "destination-out";
    ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const draw = (e: any) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;
    const canvas = eraserCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalCompositeOperation = "destination-out";
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    const canvas = eraserCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.beginPath();
  };

  const resetEraserCanvas = () => {
    const canvas = eraserCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = profilePhoto.rawUploadedUrl || "https://picsum.photos/seed/portrait/150/150";
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(img, 0, 0);
    };
  };

  const saveErasedImage = () => {
    const canvas = eraserCanvasRef.current;
    if (!canvas) return;
    const resultUrl = canvas.toDataURL("image/png");
    setProfilePhoto((p: any) => ({
      ...p,
      url: resultUrl
    }));
    setEraseModalOpen(false);
    toast.success("Erase touch-up applied! 🎨");
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result as string;
      setProfilePhoto((p: any) => ({
        ...p,
        enabled: true,
        url: b64,
        rawUploadedUrl: b64,
      }));
      toast.success("Profile photo uploaded successfully!");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBackground = (targetColorHex: string, sensitivity: number) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = profilePhoto.rawUploadedUrl || profilePhoto.url;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      const rTarget = parseInt(targetColorHex.slice(1, 3), 16);
      const gTarget = parseInt(targetColorHex.slice(3, 5), 16);
      const bTarget = parseInt(targetColorHex.slice(5, 7), 16);
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        const a = data[i+3];
        if (a === 0) continue;
        const distance = Math.sqrt(
          Math.pow(r - rTarget, 2) +
          Math.pow(g - gTarget, 2) +
          Math.pow(b - bTarget, 2)
        );
        if (distance < sensitivity) {
          data[i+3] = 0;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      const resultUrl = canvas.toDataURL("image/png");
      setProfilePhoto((p: any) => ({
        ...p,
        url: resultUrl
      }));
      toast.success("Background color removed! 🪄");
    };
    img.onerror = () => {
      toast.error("Could not load image.");
    };
  };

  const handleAutoRemoveBackground = (sensitivity: number) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = profilePhoto.rawUploadedUrl || profilePhoto.url;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      const rTarget = data[0];
      const gTarget = data[1];
      const bTarget = data[2];
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        const a = data[i+3];
        if (a === 0) continue;
        const distance = Math.sqrt(
          Math.pow(r - rTarget, 2) +
          Math.pow(g - gTarget, 2) +
          Math.pow(b - bTarget, 2)
        );
        if (distance < sensitivity) {
          data[i+3] = 0;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      const resultUrl = canvas.toDataURL("image/png");
      setProfilePhoto((p: any) => ({
        ...p,
        url: resultUrl
      }));
      toast.success("Background auto-removed! ✨");
    };
    img.onerror = () => {
      toast.error("Could not load image.");
    };
  };



  const getCSSFilterString = (
    filter: string,
    tone: string,
    brightness: number = 100,
    contrast: number = 100,
    saturation: number = 100,
    blurVal: number = 0,
    hueRotateVal: number = 0,
    sepiaVal: number = 0
  ) => {
    let f = "";
    if (filter === "color-punch") {
      f += "contrast(1.35) saturate(1.4) brightness(1.05) ";
    } else if (filter === "golden-hour") {
      f += "sepia(0.25) saturate(1.2) brightness(1.1) hue-rotate(-5deg) ";
    } else if (filter === "portrait") {
      f += "contrast(0.92) saturate(1.05) brightness(1.05) blur(0.2px) ";
    } else if (filter === "shadow") {
      f += "brightness(0.85) contrast(1.15) saturate(0.95) ";
    } else if (filter === "sunbath") {
      f += "sepia(0.18) saturate(1.5) brightness(1.18) hue-rotate(5deg) ";
    }
    if (tone === "grayscale") {
      f += "grayscale(1) ";
    } else if (tone === "darken") {
      f += "brightness(0.7) contrast(1.1) ";
    } else if (tone === "tint") {
      f += "sepia(0.35) hue-rotate(140deg) saturate(1.2) ";
    } else if (tone === "colorize") {
      f += "sepia(0.5) hue-rotate(320deg) saturate(1.8) brightness(0.95) ";
    } else if (tone === "duotone") {
      f += "grayscale(1) contrast(1.2) brightness(0.9) sepia(0.5) hue-rotate(180deg) saturate(2) ";
    }

    if (brightness !== 100) f += `brightness(${brightness}%) `;
    if (contrast !== 100) f += `contrast(${contrast}%) `;
    if (saturation !== 100) f += `saturate(${saturation}%) `;
    if (blurVal > 0) f += `blur(${blurVal}px) `;
    if (hueRotateVal > 0) f += `hue-rotate(${hueRotateVal}deg) `;
    if (sepiaVal > 0) f += `sepia(${sepiaVal}%) `;

    return f.trim() || undefined;
  };

  // --- Content State ---
  const [name, setName] = useState(() => localDraft?.name ?? "ALEX MORGAN");
  const [contactLine, setContactLine] = useState(() => localDraft?.contactLine ??
    "San Francisco, CA <span class=\"text-[var(--hairline)] mx-2\">|</span> (415) 555-0199 <span class=\"text-[var(--hairline)] mx-2\">|</span> alex.morgan@email.com <span class=\"text-[var(--hairline)] mx-2\">|</span> linkedin.com/in/alexmorgan"
  );
  const [summary, setSummary] = useState(() => localDraft?.summary ??
    "Innovative Full-Stack Software Engineer with over 5 years of experience designing, building, and deploying highly scalable web applications. Proven track record of optimizing application performance, leading cross-functional teams, and implementing cloud-native solutions to drive business outcomes."
  );
  const [footer, setFooter] = useState(() => localDraft?.footer ?? "Alex Morgan");
  const [aiRemaining, setAiRemaining] = useState<number | null>(5);
  const [showCapacityTip, setShowCapacityTip] = useState(false);

  // --- History & Undo/Redo State ---
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isHistoryActionRef = useRef(false);
  const historyRef = useRef<any[]>([]);
  const historyIndexRef = useRef<number>(-1);

  // Synchronize history refs for keyboard events & stable callbacks
  useEffect(() => {
    historyRef.current = history;
    historyIndexRef.current = historyIndex;
  }, [history, historyIndex]);

  const [sections, setSections] = useState<any[]>(() => localDraft?.sections ?? [
    { id: "summary" },
    { id: "licenses" },
    { id: "skills" },
    { id: "experience" },
    { id: "education" },
  ]);
  const [manualBreaks, setManualBreaks] = useState<Record<string, boolean>>(() => localDraft?.manualBreaks ?? {});

  const [sectionHeaders, setSectionHeaders] = useState<Record<string, string>>(() => localDraft?.sectionHeaders ?? {
    summary: "Professional Summary",
    licenses: "Certifications & Licenses",
    skills: "Skills",
    experience: "Professional Experience",
    education: "Education",
    projects: "Projects",
    publications: "Publications",
    awards: "Awards & Honors"
  });

  const [projects, setProjects] = useState<any[]>(() => localDraft?.projects ?? [
    {
      id: "proj-1",
      title: "<b>Personal Portfolio Website</b> — Next.js & Tailwind",
      date: "2024",
      bullets: [
        { id: "pb-1", text: "Built with Next.js, Tailwind CSS, and Framer Motion for premium portfolio presentation." },
      ]
    }
  ]);

  const [publications, setPublications] = useState<any[]>(() => localDraft?.publications ?? [
    {
      id: "pub-1",
      text: "<b>Real-time Collaborative Platforms</b> — Technical Journal, 2024"
    }
  ]);

  const [awards, setAwards] = useState<any[]>(() => localDraft?.awards ?? [
    {
      id: "aw-1",
      text: "<b>First Place Hackathon</b> — Developer Coalition, 2023"
    }
  ]);

  const [licenses, setLicenses] = useState<any[]>(() => localDraft?.licenses ?? [
    {
      id: "lic-1",
      text: "<b>AWS Certified Solutions Architect</b> — Amazon Web Services (ID: AWS-ASA-99321)",
    },
    {
      id: "lic-2",
      text: "<b>Professional Scrum Master I (PSM I)</b> — Scrum.org",
    },
  ]);

  const [skills, setSkills] = useState<any[]>(() => localDraft?.skills ?? [
    {
      id: "sk-1",
      title: "Core Languages",
      items: "TypeScript, JavaScript (ES6+), Python, Go, Java, SQL, HTML5, CSS3",
    },
    {
      id: "sk-2",
      title: "Frameworks & Tools",
      items: "React, Next.js, Node.js, Express, Tailwind CSS, Redux, PostgreSQL, Docker, AWS",
    },
  ]);

  const [experiences, setExperiences] = useState<any[]>(() => localDraft?.experiences ?? [
    {
      id: "exp-1",
      title: "Senior Full-Stack Engineer | TechFlow Solutions – San Francisco, CA",
      date: "Aug 2023 – Present",
      bullets: [
        {
          id: "b-1",
          text: "Architected and deployed a highly available React/Next.js dashboard, improving client-side page load times by 42% and increasing user engagement by 18%.",
        },
        {
          id: "b-2",
          text: "Led a team of 4 engineers in redesigning the core API orchestration layer using Node.js and GraphQL, reducing query latency by 150ms.",
        },
      ],
      meta: "Stack: Next.js, TypeScript, GraphQL, Tailwind CSS, PostgreSQL, AWS",
    },
    {
      id: "exp-2",
      title: "Software Engineer II | DevCore Technologies – Austin, TX",
      date: "Jun 2021 – Jul 2023",
      bullets: [
        {
          id: "b-3",
          text: "Designed and maintained responsive enterprise web portals using React and Redux Toolkit, handling over 100k daily active users.",
        },
        {
          id: "b-4",
          text: "Optimized database queries and added Redis caching, resulting in a 30% reduction in database CPU utilization during peak load times.",
        },
      ],
      meta: "Stack: React, Redux, Node.js, Express, Redis, PostgreSQL",
    },
  ]);

  const [educations, setEducations] = useState<any[]>(() => localDraft?.educations ?? [
    {
      id: "edu-1",
      degree: "B.S. in Computer Science | University of California, Berkeley",
      bullets: [
        { id: "eb-1", text: "Graduated with Honors, GPA: 3.82/4.00" },
        { id: "eb-2", text: "Relevant Coursework: Data Structures, Database Management Systems, Cloud Computing" },
      ],
    },
  ]);

  // --- Backend State ---
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      let cid = localStorage.getItem("resume_client_id");
      if (!cid) {
        cid = "client_" + Math.random().toString(36).substring(2, 15);
        localStorage.setItem("resume_client_id", cid);
      }
      return cid;
    }
    return "";
  });
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [resumesListOpen, setResumesListOpen] = useState(false);
  const [myResumes, setMyResumes] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormatBarMinimized, setIsFormatBarMinimized] = useState(false);
  const [isTopMenuMinimized, setIsTopMenuMinimized] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [saveResumeName, setSaveResumeName] = useState("My Resume");
  const [saveOverwriteId, setSaveOverwriteId] = useState<string | null>(null);
  const [activeSidebarTab, setActiveSidebarTab] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState<number>(320);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return !params.has("id") && !initialTemplateId;
    }
    return true;
  });

  // Password update states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmNewPassword || !currentPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      // 1. Reauthenticate user using current password by logging in
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: currentPassword,
      });

      if (reauthError) {
        throw new Error("Reauthentication failed. Please verify your current password.");
      }

      // 2. Perform the actual password update
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      toast.success("Password successfully updated!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // --- Groq AI Assistant State & Methods ---
  const [aiInput, setAiInput] = useState("");
  const [aiOutput, setAiOutput] = useState("");
  const [aiIsGenerating, setAiIsGenerating] = useState(false);
  const [aiPresetType, setAiPresetType] = useState<"summary" | "bullets" | "custom" | "parser" | "linkedin">("summary");
  
  // Custom states for document parser and cover letter generator
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [coverLetterJobDesc, setCoverLetterJobDesc] = useState("");
  const [coverLetterCompany, setCoverLetterCompany] = useState("");
  const [coverLetterRole, setCoverLetterRole] = useState("");
  const [coverLetterOutput, setCoverLetterOutput] = useState("");
  const [coverLetterIsGenerating, setCoverLetterIsGenerating] = useState(false);

  // Agentic Interactive Chat & Interview state
  const [aiAgentTab, setAiAgentTab] = useState<"presets" | "agent" | "coverletter">("agent");
  const [interviewStep, setInterviewStep] = useState<number>(-1); // -1 means inactive, 0 to 4 means active step
  const [interviewAnswers, setInterviewAnswers] = useState<Record<string, string>>({});
  const [agentChatInput, setAgentChatInput] = useState("");
  const [isAgentResponding, setIsAgentResponding] = useState(false);
  const [agentMessages, setAgentMessages] = useState<Array<{ role: "user" | "assistant" | "system", content: string, actionExecuted?: string }>>([
    {
      role: "assistant",
      content: "👋 Hello! I am **Agent Rez**, your personal AI Career Agent. I can build or refine your entire resume in real-time.\n\nChoose an option below to get started:",
    }
  ]);

  const applyParsedResumeToState = (data: any) => {
    isHistoryActionRef.current = true;
    
    if (data.name) setName(data.name);
    if (data.contactLine) setContactLine(data.contactLine);
    if (data.summary) setSummary(data.summary);
    
    if (data.experiences && Array.isArray(data.experiences)) {
      const sanitizedExps = data.experiences.map((exp: any, i: number) => ({
        id: exp.id || `exp-ai-${i}-${Date.now()}`,
        title: exp.title || "",
        date: exp.date || "",
        bullets: Array.isArray(exp.bullets)
          ? exp.bullets.map((b: any, j: number) => ({
              id: b.id || `b-ai-${i}-${j}-${Date.now()}`,
              text: typeof b === "string" ? b : (b.text || ""),
            }))
          : [],
        meta: exp.meta || "",
      }));
      setExperiences(sanitizedExps);
    }
    
    if (data.educations && Array.isArray(data.educations)) {
      const sanitizedEdus = data.educations.map((edu: any, i: number) => ({
        id: edu.id || `edu-ai-${i}-${Date.now()}`,
        degree: edu.degree || "",
        bullets: Array.isArray(edu.bullets)
          ? edu.bullets.map((b: any, j: number) => ({
              id: b.id || `eb-ai-${i}-${j}-${Date.now()}`,
              text: typeof b === "string" ? b : (b.text || ""),
            }))
          : [],
      }));
      setEducations(sanitizedEdus);
    }
    
    if (data.skills) {
      const skillArray = Array.isArray(data.skills) ? data.skills : [data.skills];
      const sanitizedSkills = skillArray.map((sk: any, i: number) => ({
        id: sk.id || `sk-ai-${i}-${Date.now()}`,
        title: sk.title || "Skills",
        items: sk.items || "",
      }));
      setSkills(sanitizedSkills);
    }
  };

  const handleStartInterview = () => {
    setInterviewStep(0);
    setInterviewAnswers({});
    setAgentMessages([
      {
        role: "assistant",
        content: "🚀 **Let's start your Guided Career Interview!** I'll ask you a series of 5 quick questions to capture everything we need to build your perfect resume.\n\n**Step 1/5:** What is your **Full Name** and **Target Job Title**? (e.g., 'Jane Doe, Senior Product Manager')",
      }
    ]);
    toast.success("Guided Interview started! 🎙️");
  };

  const handleSendAgentMessage = async (textToSend?: string) => {
    const rawInput = textToSend !== undefined ? textToSend : agentChatInput;
    if (!rawInput.trim()) return;

    const userMsg = { role: "user" as const, content: rawInput };
    const updatedMessages = [...agentMessages, userMsg];
    setAgentMessages(updatedMessages);
    setAgentChatInput("");
    setIsAgentResponding(true);

    try {
      // 1. If in Interview Mode
      if (interviewStep >= 0) {
        const currentAnswers = { ...interviewAnswers };
        currentAnswers[`step${interviewStep}`] = rawInput;
        setInterviewAnswers(currentAnswers);
        
        const nextStepNum = interviewStep + 1;
        setInterviewStep(nextStepNum);

        if (nextStepNum === 1) {
          const assistantMsg = {
            role: "assistant" as const,
            content: "Great! 📬 **Step 2/5:** What are your preferred **contact details**? (e.g., city/state, phone, email, LinkedIn link)"
          };
          setAgentMessages([...updatedMessages, assistantMsg]);
          setIsAgentResponding(false);
          return;
        } else if (nextStepNum === 2) {
          const assistantMsg = {
            role: "assistant" as const,
            content: "Excellent. 💼 **Step 3/5:** Tell me about your **Work Experience**. Mention your recent job titles, company names, dates, and what you achieved or did there. (Feel free to write informal notes or paste bullet points!)"
          };
          setAgentMessages([...updatedMessages, assistantMsg]);
          setIsAgentResponding(false);
          return;
        } else if (nextStepNum === 3) {
          const assistantMsg = {
            role: "assistant" as const,
            content: "Got it. 🎓 **Step 4/5:** What about your **Education & Certifications**? (e.g., B.S. in CS from UC Berkeley, Certifications from AWS/Scrum)"
          };
          setAgentMessages([...updatedMessages, assistantMsg]);
          setIsAgentResponding(false);
          return;
        } else if (nextStepNum === 4) {
          const assistantMsg = {
            role: "assistant" as const,
            content: "Wonderful! 🛠️ **Step 5/5:** What are your **Core Skills & Technologies**? (e.g., React, Node.js, Python, Project Management, Agile)"
          };
          setAgentMessages([...updatedMessages, assistantMsg]);
          setIsAgentResponding(false);
          return;
        } else {
          // Interview completed!
          setInterviewStep(-1);
          
          const generatingMsg = {
            role: "assistant" as const,
            content: "⚙️ **All answers collected!** I am compiling your details and drafting a complete, professional, impact-driven resume in the editor using our high-speed Groq AI model. This will take a few seconds..."
          };
          setAgentMessages([...updatedMessages, generatingMsg]);

          const compilePrompt = `Please compile a complete, highly professional, impact-driven resume based on these career interview answers:
          - Name & Target Role: ${currentAnswers.step0}
          - Contact Details: ${currentAnswers.step1}
          - Work Experience: ${currentAnswers.step2}
          - Education & Certifications: ${currentAnswers.step3}
          - Skills & Competencies: ${rawInput}
          
          Generate the professional experience with high-impact STAR method bullet points. Return the full resume in our specialized JSON format.`;

          const systemPrompt = `You are an elite, world-class resume-writing expert. Based on the user's answers, write an exceptional resume.
          
          You MUST wrap the complete resume JSON inside <UPDATE_RESUME> and </UPDATE_RESUME> XML tags.
          
          The structure MUST EXACTLY be:
          <UPDATE_RESUME>
          {
            "name": "Jane Doe",
            "contactLine": "City, ST | (123) 456-7890 | email@domain.com | linkedin.com/in/username",
            "summary": "Professional summary...",
            "experiences": [
              {
                "title": "Senior Frontend Engineer | Tech Company",
                "date": "Jan 2022 - Present",
                "bullets": [
                  { "text": "Designed and deployed..." },
                  { "text": "Collaborated with..." }
                ],
                "meta": "Stack: React, TypeScript, Tailwind"
              }
            ],
            "educations": [
              {
                "degree": "B.S. in Computer Science | University Name",
                "bullets": [
                  { "text": "GPA 3.8, Honors" }
                ]
              }
            ],
            "skills": [
              {
                "title": "Programming Languages",
                "items": "TypeScript, JavaScript, Python"
              },
              {
                "title": "Frameworks & Databases",
                "items": "React, Next.js, PostgreSQL"
              }
            ]
          }
          </UPDATE_RESUME>
          
          Provide a friendly, conversational message before the XML block congratulating the user on finishing their career interview and explaining how their resume was crafted.`;

          const headers: Record<string, string> = { "Content-Type": "application/json" };
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            headers["Authorization"] = `Bearer ${session.access_token}`;
          }

          const response = await fetch("/api/groq", {
            method: "POST",
            headers,
            body: JSON.stringify({
              prompt: compilePrompt,
              systemPrompt,
              temperature: 0.3,
              aiAction: "general"
            })
          });

          const resData = await response.json();
          if (!response.ok || !resData.success) {
            throw new Error(resData.error || "Failed to compile resume.");
          }

          const textResponse = resData.text;
          const updatedHistory = [...updatedMessages, generatingMsg];
          const updateMatch = textResponse.match(/<UPDATE_RESUME>([\s\S]*?)<\/UPDATE_RESUME>/);
          let actionExecuted = undefined;

          if (updateMatch) {
            try {
              const parsed = JSON.parse(updateMatch[1].trim());
              applyParsedResumeToState(parsed);
              actionExecuted = "updated_resume";
              toast.success("Resume compiled and loaded! ✨");
            } catch (err) {
              console.error("Failed to parse compile JSON:", err);
            }
          }

          setAgentMessages([
            ...updatedHistory,
            {
              role: "assistant" as const,
              content: textResponse,
              actionExecuted
            }
          ]);
          setIsAgentResponding(false);
          return;
        }
      }

      // 2. Chat / Refinement Mode (Not in Interview)
      const systemPrompt = `You are Agent Rez, an elite AI Career Agent who has direct access to update the user's active resume draft in real-time.
      
      The user's current resume state is:
      ${JSON.stringify({ name, contactLine, summary, experiences, educations, skills })}
      
      The user is talking to you or instructing you to make changes.
      You must respond to the user in a friendly, professional, and encouraging tone.
      
      CRITICAL DIRECTIVE: If the user asks you to edit, change, rewrite, add, or delete anything in their resume, you MUST embed a complete, updated resume JSON block within <UPDATE_RESUME> and </UPDATE_RESUME> XML tags in your response. 
      
      Examples of your responses:
      
      User: "Add Kubernetes to my skills"
      Agent Rez: "I have updated your skills section to include Kubernetes. Here is the updated draft in the editor:
      <UPDATE_RESUME>
      {
        "name": "Alex Morgan",
        "contactLine": "...",
        "summary": "...",
        "experiences": [...],
        "educations": [...],
        "skills": [
          { "id": "sk-1", "title": "Technologies", "items": "React, Node.js, Kubernetes" }
        ]
      }
      </UPDATE_RESUME>"
      
      User: "Rewrite my summary to be more leadership focused"
      Agent Rez: "I've rewritten your summary to highlight your executive leadership and strategic vision. How does this look?
      <UPDATE_RESUME>
      {
        "name": "Alex Morgan",
        "contactLine": "...",
        "summary": "Visionary executive leader with 15+ years driving digital transformation and managing cross-functional teams to deliver scalable enterprise solutions. Proven track record of aligning technology initiatives with core business objectives to accelerate revenue growth.",
        "experiences": [...],
        "educations": [...],
        "skills": [...]
      }
      </UPDATE_RESUME>"
      
      Make sure the JSON matches the schema exactly:
      - name: string
      - contactLine: string
      - summary: string
      - experiences: [{ id, title, date, bullets: [{ id, text }], meta }]
      - educations: [{ id, degree, bullets: [{ id, text }] }]
      - skills: [{ id, title, items }]
      
      Ensure each object in experiences, educations, and skills has a unique 'id' string (e.g., 'exp-X', 'edu-X', 'sk-X').
      If the user is just asking a question and no resume changes are needed, do not include the <UPDATE_RESUME> tags. Just reply conversationally.`;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch("/api/groq", {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt: rawInput,
          systemPrompt,
          temperature: 0.4,
          aiAction: "general"
        })
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "Failed to generate response.");
      }

      const textResponse = resData.text;
      const updateMatch = textResponse.match(/<UPDATE_RESUME>([\s\S]*?)<\/UPDATE_RESUME>/);
      let actionExecuted = undefined;

      if (updateMatch) {
        try {
          const parsed = JSON.parse(updateMatch[1].trim());
          applyParsedResumeToState(parsed);
          actionExecuted = "updated_resume";
          toast.success("Resume updated live! ✨");
        } catch (err) {
          console.error("Failed to parse update JSON:", err);
          toast.error("Failed to apply active edits automatically.");
        }
      }

      setAgentMessages([
        ...updatedMessages,
        {
          role: "assistant" as const,
          content: textResponse,
          actionExecuted
        }
      ]);
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
      setAgentMessages([
        ...updatedMessages,
        {
          role: "assistant" as const,
          content: `❌ **Error:** ${err.message || "An error occurred while communicating with Groq."}`
        }
      ]);
    } finally {
      setIsAgentResponding(false);
    }
  };

  const handleApplyAI = () => {
    if (aiPresetType === "summary") {
      setSummary(aiOutput);
      toast.success("Applied to Professional Summary! ✨");
    } else {
      toast("Please use the 'Apply to...' options below to choose which part of your resume to update.");
    }
  };

  const handleApplyToTarget = (targetType: string, targetId?: string) => {
    if (!aiOutput) return;
    
    isHistoryActionRef.current = true;
    
    if (targetType === "summary") {
      setSummary(aiOutput);
      toast.success("Applied to Professional Summary! ✨");
    } else if (targetType === "experience-bullets" && targetId) {
      setExperiences((prev: any[]) => prev.map(exp => {
        if (exp.id === targetId) {
          // Parse lines starting with •, -, *, or normal lines
          const lines = aiOutput.split(/[\n•\-*]/).map(l => l.trim()).filter(Boolean);
          const newBullets = lines.map((text, idx) => ({
            id: `b-ai-${Date.now()}-${idx}`,
            text
          }));
          return {
            ...exp,
            bullets: [...exp.bullets, ...newBullets]
          };
        }
        return exp;
      }));
      toast.success("Appended bullet points to job entry! ✨");
    } else if (targetType === "experience-title" && targetId) {
      setExperiences((prev: any[]) => prev.map(exp => {
        if (exp.id === targetId) {
          return { ...exp, title: aiOutput };
        }
        return exp;
      }));
      toast.success("Updated Job Title & Company! ✨");
    } else if (targetType === "skills-add") {
      setSkills((prev: any[]) => [
        ...prev,
        { id: `sk-ai-${Date.now()}`, title: "AI Recommended Skills", items: aiOutput }
      ]);
      toast.success("Added new Skill Category Group! ✨");
    } else if (targetType === "licenses-add") {
      setLicenses((prev: any[]) => [
        ...prev,
        { id: `lic-ai-${Date.now()}`, text: aiOutput }
      ]);
      toast.success("Added new Certification/License! ✨");
    } else if (targetType === "education-add") {
      setEducations((prev: any[]) => [
        ...prev,
        {
          id: `edu-ai-${Date.now()}`,
          degree: aiOutput,
          bullets: []
        }
      ]);
      toast.success("Added new Education entry! ✨");
    }
  };

  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!aiInput.trim()) {
      toast.error("Please enter some text or context for the AI.");
      return;
    }

    setAiIsGenerating(true);
    setAiOutput("");

    try {
      // 1. Get optional supabase session to obtain JWT
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // 2. Formulate prompts based on active preset
      let systemPrompt = "You are a professional resume writer.";
      if (aiPresetType === "summary") {
        systemPrompt = `You are an elite, professional resume-writing assistant. Refine, improve, or suggest professional phrasing for the user's summary. Make it impact-driven, professional, and clear. Do NOT use generic buzzwords or fluff. Return ONLY the polished summary text. Do not include any introduction, conversational chat, greeting, or outer quotes.

Examples of rewriting:
Input: "I am a software engineer who likes coding and working on teams. I know react and node."
Output: "Results-driven Software Engineer with expertise in full-stack development using React and Node.js. Proven ability to collaborate within cross-functional agile teams to deliver scalable, user-centric web applications while maintaining high code quality."

Input: "marketing person who did ads and got more sales"
Output: "Data-driven Marketing Specialist with a proven track record of designing and executing high-ROI digital advertising campaigns. Adept at leveraging market analytics to drive user acquisition and increase revenue."`;
      } else if (aiPresetType === "bullets") {
        systemPrompt = `You are an elite resume editor. Rewrite the user's raw experience or bullet points into highly professional, action-oriented bullet points using the STAR method (Situation, Task, Action, Result). Use strong, metric-focused active verbs. Start each line with a bullet symbol (•) or a clean list format. Return ONLY the updated bullet points. Do not write introductory or conversational text.

Examples of rewriting:
Input: "helped with the database and made it faster"
Output: 
• Optimized database query performance by 40% through index restructuring, reducing average load times for critical endpoints.

Input: "talked to customers to figure out what they want"
Output:
• Conducted over 50 user discovery interviews to synthesize product requirements, directly influencing the Q3 product roadmap.

Input: "fixed bugs in the app"
Output:
• Resolved 100+ critical software defects, increasing application stability by 25% and significantly improving end-user satisfaction.`;
      } else {
        systemPrompt = "You are an expert resume writer. Help the user with their custom request regarding their resume content. Be concise, impact-oriented, and return ONLY the relevant rewritten resume text or direct suggestions without any conversational chat.";
      }

      // 3. Make fetch request to our server proxy
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Determine aiAction from the current preset type
      const aiActionForMode = aiPresetType === "bullets" ? "rewrite_bullet" as const
        : aiPresetType === "summary" ? "generate_summary" as const
        : aiPresetType === "custom" ? "general" as const
        : "general" as const;

      const response = await fetch("/api/groq", {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt: aiInput,
          systemPrompt,
          temperature: 0.4,
          aiAction: aiActionForMode
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error((errData as any).error || "Failed to generate text from Groq API.");
      }

      // Consume the SSE stream for real-time word-by-word output
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (!reader) throw new Error("No response stream received.");

      setAiOutput(""); // Clear previous output
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // Parse SSE lines: "data: {...}" or ": meta {...}"
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith(": meta ")) {
            try {
              const meta = JSON.parse(line.slice(7));
              if (meta.remaining !== undefined) setAiRemaining(meta.remaining);
            } catch { /* ignore parse errors */ }
          } else if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              const token = parsed.choices?.[0]?.delta?.content ?? "";
              if (token) {
                accumulated += token;
                setAiOutput(accumulated);
              }
            } catch { /* incomplete JSON chunk, skip */ }
          }
        }
      }

      if (!accumulated.trim()) throw new Error("AI returned an empty response.");
      toast.success("AI suggestion ready! Click 'Apply' to update. ✨");
    } catch (err: any) {
      toast.error(err.message || "An error occurred during AI generation");
    } finally {
      setAiIsGenerating(false);
    }
  };

  const handleParseResume = async (rawText: string) => {
    if (!user) {
      toast.error("Please log in to use AI assistant features.");
      setAuthModalOpen(true);
      return;
    }

    setAiIsGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Unauthorized");

      const apiUrl = aiPresetType === "linkedin" ? "/api/resume/parse-linkedin" : "/api/resume/parse";
      const payload = aiPresetType === "linkedin" ? { input: rawText } : { rawText };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) throw new Error(resData.error || "Failed to parse");

      const { data } = resData;
      if (data.name) setName(data.name);
      if (data.summary) setSummary(data.summary);
      if (data.experiences) setExperiences(data.experiences);
      if (data.educations) setEducations(data.educations);
      if (data.skills) setSkills(Array.isArray(data.skills) ? data.skills : [data.skills]);
      
      toast.success("Resume built and applied! ✨");
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setAiIsGenerating(false);
    }
  };

  const handleDocumentUpload = async (file: File) => {
    if (!user) {
      toast.error("Please log in to upload and parse resume files.");
      setAuthModalOpen(true);
      return;
    }

    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = () => {
        setAiInput(reader.result as string);
        toast.success("Text resume loaded! Press 'Build Resume' to generate your draft. 🚀");
      };
      reader.readAsText(file);
      return;
    }

    if (file.type === "application/pdf" || file.name.endsWith(".pdf") || file.name.endsWith(".docx")) {
      const toastId = toast.loading("Uploading and parsing document with Gemini... ⚡");
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64Data = (reader.result as string).split(",")[1];
            const response = await fetch("/api/resume/parse-doc", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                base64Data,
                mimeType: file.type || "application/pdf",
                filename: file.name,
              }),
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
              throw new Error(result.error || "Failed to parse document.");
            }

            applyParsedResumeToState(result.data);
            setAiPresetType("summary"); // reset
            toast.success("Resume imported and formatted successfully! 🎉", { id: toastId });
          } catch (err: any) {
            toast.error(err.message || "Could not parse document.", { id: toastId });
          }
        };
        reader.readAsDataURL(file);
      } catch (err: any) {
        toast.error(err.message || "An error occurred.", { id: toastId });
      }
      return;
    }

    toast.error("Unsupported file type. Please upload a .pdf, .txt, or .docx file.");
  };

  const handleGenerateCoverLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to use AI cover letter generation.");
      setAuthModalOpen(true);
      return;
    }

    setCoverLetterIsGenerating(true);
    const toastId = toast.loading("Generating your tailored cover letter... ✍️");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const resumeState = {
        name,
        contactLine,
        summary,
        experiences,
        educations,
        skills,
      };

      const response = await fetch("/api/cover-letter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          resumeState,
          jobDescription: coverLetterJobDesc,
          role: coverLetterRole,
          company: coverLetterCompany,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) throw new Error(resData.error || "Failed to generate cover letter.");

      setCoverLetterOutput(resData.text);
      toast.success("Cover letter generated! ✨", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "An error occurred", { id: toastId });
    } finally {
      setCoverLetterIsGenerating(false);
    }
  };

  const fetchMyResumes = async () => {
    try {
      const { data, error } = await supabase
        .from("resumes")
        .select("id, updated_at, content")
        .eq("status", "active")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      setMyResumes(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadResumeFromCloud = async (id: string) => {
    const toastId = toast.loading("Loading resume...");
    try {
      const { data, error } = await supabase
        .from("resumes")
        .select("content")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (data && data.content) {
        const c = data.content as any;
        isHistoryActionRef.current = true;

        const loadedName = c.name !== undefined ? c.name : "ALEX MORGAN";
        const loadedContactLine = c.contactLine !== undefined ? c.contactLine : 'San Francisco, CA <span class="text-[var(--hairline)] mx-2">|</span> (415) 555-0199 <span class="text-[var(--hairline)] mx-2">|</span> alex.morgan@email.com';
        const loadedSummary = c.summary !== undefined ? c.summary : "Innovative Full-Stack Software Engineer with over 5 years of experience designing, building, and deploying highly scalable web applications. Proven track record of optimizing application performance, leading cross-functional teams, and implementing cloud-native solutions to drive business outcomes.";
        const loadedFooter = c.footer !== undefined ? c.footer : "Alex Morgan";

        if (c.name !== undefined) setName(c.name);
        if (c.contactLine !== undefined) setContactLine(c.contactLine);
        if (c.summary !== undefined) setSummary(c.summary);
        if (c.footer !== undefined) setFooter(c.footer);
        if (c.design) setDesign(c.design);
        if (c.sections) setSections(c.sections);
        if (c.manualBreaks) setManualBreaks(c.manualBreaks);
        if (c.licenses) setLicenses(c.licenses);
        if (c.skills) setSkills(c.skills);
        if (c.experiences) setExperiences(c.experiences);
        if (c.educations) setEducations(c.educations);
        if (c.profilePhoto) setProfilePhoto(c.profilePhoto);
        if (c.sectionHeaders) setSectionHeaders(c.sectionHeaders);
        if (c.projects) setProjects(c.projects);
        if (c.publications) setPublications(c.publications);
        if (c.awards) setAwards(c.awards);
        
        // Hide onboarding modal when successfully loaded
        setShowOnboarding(false);

        const loadedSnapshot = {
          name: loadedName,
          contactLine: loadedContactLine,
          summary: loadedSummary,
          footer: loadedFooter,
          design: c.design || design,
          sections: c.sections || sections,
          manualBreaks: c.manualBreaks || {},
          licenses: c.licenses || [],
          skills: c.skills || [],
          experiences: c.experiences || [],
          educations: c.educations || [],
          profilePhoto: c.profilePhoto || profilePhoto,
          sectionHeaders: c.sectionHeaders || {},
          projects: c.projects || [],
          publications: c.publications || [],
          awards: c.awards || [],
        };
        setHistory([loadedSnapshot]);
        setHistoryIndex(0);
        toast.success("Resume loaded successfully!", { id: toastId });
      }
    } catch (err: any) {
      toast.error("Failed to load resume: " + err.message, { id: toastId });
    }
  };

  const handleFitWidth = () => {
    const wrap = document.querySelector(".canvas-wrap");
    if (wrap) {
      const availableWidth = wrap.clientWidth - 48; // padding
      const pageWidth = design.pageSize === "letter" ? 816 : 794;
      const computedZoom = Math.floor((availableWidth / pageWidth) * 100);
      const clamped = Math.min(Math.max(computedZoom, 50), 150);
      setCanvasZoom(clamped);
      toast.success(`Auto-fitted canvas to ${clamped}% width! 🔍`);
    }
  };

  const handleUndo = useCallback(() => {
    const idx = historyIndexRef.current;
    const hist = historyRef.current;
    if (idx > 0) {
      isHistoryActionRef.current = true;
      const prevIndex = idx - 1;
      const prevState = hist[prevIndex];
      if (prevState) {
        if (prevState.name !== undefined) setName(prevState.name);
        if (prevState.contactLine !== undefined) setContactLine(prevState.contactLine);
        if (prevState.summary !== undefined) setSummary(prevState.summary);
        if (prevState.footer !== undefined) setFooter(prevState.footer);
        setSections(prevState.sections);
        setManualBreaks(prevState.manualBreaks);
        setLicenses(prevState.licenses);
        setSkills(prevState.skills);
        setExperiences(prevState.experiences);
        setEducations(prevState.educations);
        setDesign(prevState.design);
        setProfilePhoto(prevState.profilePhoto);
        if (prevState.sectionHeaders) setSectionHeaders(prevState.sectionHeaders);
        if (prevState.projects) setProjects(prevState.projects);
        if (prevState.publications) setPublications(prevState.publications);
        if (prevState.awards) setAwards(prevState.awards);
        setHistoryIndex(prevIndex);
      }
    }
  }, []);

  const handleRedo = useCallback(() => {
    const idx = historyIndexRef.current;
    const hist = historyRef.current;
    if (idx < hist.length - 1) {
      isHistoryActionRef.current = true;
      const nextIndex = idx + 1;
      const nextState = hist[nextIndex];
      if (nextState) {
        if (nextState.name !== undefined) setName(nextState.name);
        if (nextState.contactLine !== undefined) setContactLine(nextState.contactLine);
        if (nextState.summary !== undefined) setSummary(nextState.summary);
        if (nextState.footer !== undefined) setFooter(nextState.footer);
        setSections(nextState.sections);
        setManualBreaks(nextState.manualBreaks);
        setLicenses(nextState.licenses);
        setSkills(nextState.skills);
        setExperiences(nextState.experiences);
        setEducations(nextState.educations);
        setDesign(nextState.design);
        setProfilePhoto(nextState.profilePhoto);
        if (nextState.sectionHeaders) setSectionHeaders(nextState.sectionHeaders);
        if (nextState.projects) setProjects(nextState.projects);
        if (nextState.publications) setPublications(nextState.publications);
        if (nextState.awards) setAwards(nextState.awards);
        setHistoryIndex(nextIndex);
      }
    }
  }, []);

  const handleResetToBlank = () => {
    if (window.confirm("Are you sure you want to clear all resume content and start from scratch? This will reset your resume content to a blank template.")) {
      isHistoryActionRef.current = true;
      setName("");
      setContactLine("");
      setSummary("");
      setExperiences([]);
      setEducations([]);
      setSkills([]);
      setLicenses([]);
      setFooter("");
      setManualBreaks({});
      setDesign((prev: any) => ({
        ...prev,
        template: "blank",
        accent: "#111827",
        panel: "#ffffff",
        paper: "#ffffff",
        layout: "classic",
        headingStyle: "plain",
        boxShadow: "none",
        borderStyle: "none",
      }));
      toast.success("Resume cleared! Start building your customized template from scratch. 📝");
    }
  };

  const handleResetResume = () => {
    localStorage.removeItem("resume_autosave_content");
    setName("");
    setContactLine("");
    setSummary("");
    setSkills([]);
    setExperiences([]);
    setEducations([]);
    setLicenses([]);
    setFooter("");
  };

  const handleLoadPersona = (personaType: "software" | "product" | "design") => {
    handleResetResume();
    isHistoryActionRef.current = true;
    if (personaType === "software") {
      setName("ALEX MORGAN");
      setContactLine("San Francisco, CA <span class=\"text-[var(--hairline)] mx-2\">|</span> (415) 555-0199 <span class=\"text-[var(--hairline)] mx-2\">|</span> alex.morgan@email.com <span class=\"text-[var(--hairline)] mx-2\">|</span> linkedin.com/in/alexmorgan");
      setSummary("Innovative Full-Stack Software Engineer with over 5 years of experience designing, building, and deploying highly scalable web applications. Proven track record of optimizing application performance, leading cross-functional teams, and implementing cloud-native solutions to drive business outcomes.");
      setSkills([
        {
          id: "sk-1",
          title: "Core Languages",
          items: "TypeScript, JavaScript (ES6+), Python, Go, Java, SQL, HTML5, CSS3",
        },
        {
          id: "sk-2",
          title: "Frameworks & Tools",
          items: "React, Next.js, Node.js, Express, Tailwind CSS, Redux, PostgreSQL, Docker, AWS",
        },
      ]);
      setExperiences([
        {
          id: "exp-1",
          title: "Senior Full-Stack Engineer | TechFlow Solutions – San Francisco, CA",
          date: "Aug 2023 – Present",
          bullets: [
            {
              id: "b-1",
              text: "Architected and deployed a highly available React/Next.js dashboard, improving client-side page load times by 42% and increasing user engagement by 18%.",
            },
            {
              id: "b-2",
              text: "Led a team of 4 engineers in redesigning the core API orchestration layer using Node.js and GraphQL, reducing query latency by 150ms.",
            },
          ],
          meta: "Stack: Next.js, TypeScript, GraphQL, Tailwind CSS, PostgreSQL, AWS",
        },
        {
          id: "exp-2",
          title: "Software Engineer II | DevCore Technologies – Austin, TX",
          date: "Jun 2021 – Jul 2023",
          bullets: [
            {
              id: "b-3",
              text: "Designed and maintained responsive enterprise web portals using React and Redux Toolkit, handling over 100k daily active users.",
            },
            {
              id: "b-4",
              text: "Optimized database queries and added Redis caching, resulting in a 30% reduction in database CPU utilization during peak load times.",
            },
          ],
          meta: "Stack: React, Redux, Node.js, Express, Redis, PostgreSQL",
        },
      ]);
      setEducations([
        {
          id: "edu-1",
          degree: "B.S. in Computer Science | University of California, Berkeley",
          bullets: [
            { id: "eb-1", text: "Graduated with Honors, GPA: 3.82/4.00" },
            { id: "eb-2", text: "Relevant Coursework: Data Structures, Database Management Systems, Cloud Computing" },
          ],
        },
      ]);
      setLicenses([
        {
          id: "lic-1",
          text: "<b>AWS Certified Solutions Architect</b> — Amazon Web Services (ID: AWS-ASA-99321)",
        },
        {
          id: "lic-2",
          text: "<b>Professional Scrum Master I (PSM I)</b> — Scrum.org",
        },
      ]);
      setFooter("Alex Morgan");
    } else if (personaType === "product") {
      setName("SARAH JENKINS");
      setContactLine("New York, NY <span class=\"text-[var(--hairline)] mx-2\">|</span> (212) 555-0142 <span class=\"text-[var(--hairline)] mx-2\">|</span> sarah.j@email.com <span class=\"text-[var(--hairline)] mx-2\">|</span> linkedin.com/in/sarahjenkins");
      setSummary("Results-driven Senior Product Manager with 6+ years of experience leading cross-functional squads to define, build, and scale SaaS products. Expert in translating customer insights into impactful product roadmaps, leading to 35% growth in annual recurring revenue.");
      setSkills([
        {
          id: "sk-1",
          title: "Product Strategy",
          items: "Roadmapping, Product Discovery, Market Analysis, User Research, SQL Analytics",
        },
        {
          id: "sk-2",
          title: "Methodologies & Agile",
          items: "Scrum/Agile, Jira, Confluence, A/B Testing, User Story Mapping, OKRs",
        },
      ]);
      setExperiences([
        {
          id: "exp-1",
          title: "Senior Product Manager | GrowthCraft SaaS – New York, NY",
          date: "Jan 2023 – Present",
          bullets: [
            {
              id: "b-1",
              text: "Successfully launched a new enterprise collaboration module from ideation to release, securing $2.4M in pipeline revenue within the first 6 months.",
            },
            {
              id: "b-2",
              text: "Defined and ran continuous user discovery sessions, increasing active user retention rate by 24% through feature optimizations.",
            },
          ],
          meta: "Frameworks: Scrum, OKRs, Mixpanel, SQL, Productboard",
        },
        {
          id: "exp-2",
          title: "Product Manager | AnalyticsHQ – Boston, MA",
          date: "Mar 2020 – Dec 2022",
          bullets: [
            {
              id: "b-3",
              text: "Spearheaded the integration of self-serve analytics tools, reducing customer onboarding friction and lowering churn by 12%.",
            },
            {
              id: "b-4",
              text: "Collaborated with design and engineering teams to establish a modern UI system, accelerating product development velocity by 30%.",
            },
          ],
          meta: "Stack: Jira, Figma, Amplitude, Hotjar",
        },
      ]);
      setEducations([
        {
          id: "edu-1",
          degree: "M.B.A. in Technology Management | NYU Stern School of Business",
          bullets: [
            { id: "eb-1", text: "Focus on Digital Product Management & Tech Entrepreneurship" },
          ],
        },
        {
          id: "edu-2",
          degree: "B.S. in Business Administration | Boston University",
          bullets: [
            { id: "eb-2", text: "Summa Cum Laude, GPA: 3.90/4.00" },
          ],
        },
      ]);
      setLicenses([
        {
          id: "lic-1",
          text: "<b>Certified Product Manager (CPM)</b> — Association of International Product Marketing",
        },
        {
          id: "lic-2",
          text: "<b>Certified Scrum Product Owner (CSPO)</b> — Scrum Alliance",
        },
      ]);
      setFooter("Sarah Jenkins");
    } else if (personaType === "design") {
      setName("LIAM CHEN");
      setContactLine("Seattle, WA <span class=\"text-[var(--hairline)] mx-2\">|</span> (206) 555-0188 <span class=\"text-[var(--hairline)] mx-2\">|</span> liam.chen.design@email.com <span class=\"text-[var(--hairline)] mx-2\">|</span> liamchendesign.com");
      setSummary("Creative and empathetic UI/UX Designer with over 4 years of experience crafting accessible, visually arresting digital experiences for web and mobile platforms. Passionate about user-centered design, prototyping, and aligning user needs with business goals.");
      setSkills([
        {
          id: "sk-1",
          title: "Design & Prototyping",
          items: "Figma, Adobe XD, High-fidelity Prototyping, Wireframing, Responsive Layouts",
        },
        {
          id: "sk-2",
          title: "Research & Testing",
          items: "User Testing, Personas, Journey Mapping, Heuristic Evaluation, Accessibility (WCAG)",
        },
      ]);
      setExperiences([
        {
          id: "exp-1",
          title: "Lead UI/UX Designer | PixelForge Studio – Seattle, WA",
          date: "Feb 2022 – Present",
          bullets: [
            {
              id: "b-1",
              text: "Redesigned the primary checkout flow for an e-commerce platform, leading to a 15% increase in conversion rate and a 20% drop in cart abandonment.",
            },
            {
              id: "b-2",
              text: "Developed and maintained a comprehensive Figma Design System, reducing design-to-development handoff time by 35%.",
            },
          ],
          meta: "Tools: Figma, Adobe Creative Cloud, Storybook, ZeroHeight",
        },
        {
          id: "exp-2",
          title: "UX Designer | WebVibe Agency – Seattle, WA",
          date: "May 2020 – Jan 2022",
          bullets: [
            {
              id: "b-3",
              text: "Conducted 40+ user interviews to inform the redesign of a national healthcare portal, elevating WCAG accessibility conformance to AAA standards.",
            },
            {
              id: "b-4",
              text: "Created interactive micro-animations and smooth transition flows, boosting user satisfaction scores by 18%.",
            },
          ],
          meta: "Stack: HTML/CSS, Webflow, Hotjar, Optimal Workshop",
        },
      ]);
      setEducations([
        {
          id: "edu-1",
          degree: "B.F.A. in Interaction Design | University of Washington",
          bullets: [
            { id: "eb-1", text: "Relevant Coursework: Human-Computer Interaction, Information Architecture, Visual Communication" },
          ],
        },
      ]);
      setLicenses([
        {
          id: "lic-1",
          text: "<b>Google UX Design Professional Certificate</b> — Coursera",
        },
        {
          id: "lic-2",
          text: "<b>NN/g UX Certified (ID: #88391)</b> — Nielsen Norman Group",
        },
      ]);
      setFooter("Liam Chen");
    }
    toast.success(`Seeded resume with professional ${personaType === "software" ? "Software Engineer" : personaType === "product" ? "Product Manager" : "UX Designer"} data! ✨`);
  };

  useEffect(() => {
    if (name === "YOUR NAME") setName("ALEX MORGAN");
    if (contactLine.includes("your.email@example.com") || contactLine.includes("City, State ZIP")) {
       setContactLine('San Francisco, CA <span class="text-[var(--hairline)] mx-2">|</span> (415) 555-0199 <span class="text-[var(--hairline)] mx-2">|</span> alex.morgan@email.com');
    }
    if (summary.includes("A two-to-three sentence pitch")) {
       setSummary("Innovative Full-Stack Software Engineer with over 5 years of experience designing, building, and deploying highly scalable web applications. Proven track record of optimizing application performance, leading cross-functional teams, and implementing cloud-native solutions to drive business outcomes.");
    }
  }, [name, contactLine, summary]);

  // Keyboard shortcut listener for Ctrl+Z / Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (modifier && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleUndo, handleRedo]);

  // Handle active contentEditable blur on window beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Unified auto-save and history tracking
  useEffect(() => {
    // Create a trimmed payload
    const { profilePhoto: _, ...trimmedPayload } = {
      name,
      contactLine,
      summary,
      footer,
      design,
      sections,
      manualBreaks,
      licenses,
      skills,
      experiences,
      educations,
      profilePhoto,
      sectionHeaders,
      projects,
      publications,
      awards,
    };

    if (typeof window !== "undefined") {
      // Debounce local storage saves slightly to avoid blocking main thread too often
      const timer = setTimeout(() => {
        try {
          localStorage.setItem("resume_autosave_content", JSON.stringify(trimmedPayload));
        } catch (e) {
          console.error("Failed to save to localStorage, likely quota exceeded:", e);
        }
      }, 500);
      
      // Update history
      if (!isHistoryActionRef.current) {
        setHistory((prev) => {
          const current = prev[historyIndex];
          if (current && JSON.stringify(current) === JSON.stringify(trimmedPayload)) {
            return prev;
          }
          const newHistory = prev.slice(0, historyIndex + 1);
          newHistory.push(trimmedPayload);
          if (newHistory.length > 50) {
            newHistory.shift();
          }
          setHistoryIndex(newHistory.length - 1);
          return newHistory;
        });
      } else {
        isHistoryActionRef.current = false;
      }
      
      return () => clearTimeout(timer);
    }
  }, [
    name,
    contactLine,
    summary,
    footer,
    sections,
    manualBreaks,
    licenses,
    skills,
    experiences,
    educations,
    design,
    profilePhoto,
    sectionHeaders,
    projects,
    publications,
    awards,
    user,
    resumeId,
    historyIndex,
    history.length
  ]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchMyResumes();
    });

    // Load from URL if present
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      setTimeout(() => {
        setResumeId(id);
        loadResumeFromCloud(id);
      }, 0);
    }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out");
  };

  const handleSaveToCloud = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please log in to save to the cloud.");
      setAuthModalOpen(true);
      return;
    }
    await fetchMyResumes();
    setSaveOverwriteId(resumeId);
    setSaveResumeName(name || "My Resume");
    setSaveModalOpen(true);
  };

  const executeSaveToCloud = async () => {
    setIsSaving(true);
    setSaveModalOpen(false);

    const payload = {
      design,
      sections,
      manualBreaks,
      licenses,
      skills,
      experiences,
      educations,
      profilePhoto,
      name,
      contactLine,
      summary,
      footer,
      resumeName: saveResumeName,
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/resume/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          id: saveOverwriteId, // if overwriting, use that id, else undefined/null to create new
          content: payload,
          clientId: clientId || "web",
          status: 'active',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const parsedData = await response.json();
      const parsed = SaveResponseSchema.parse(parsedData);

      if (!parsed.success) {
        if (parsed.code === "RATE_LIMIT") {
          toast.error("⚠️ " + (parsed.message || "Rate limit exceeded"));
        } else {
          toast.error("⚠️ Error: " + (parsed.message || parsed.code || "Failed to save"));
        }
        return;
      }

      if (parsed.id) {
        setResumeId(parsed.id);
        toast.success("Saved to Supabase securely 🔒");

        // Update URL without reloading
        const url = new URL(window.location.href);
        url.searchParams.set("id", parsed.id);
        window.history.pushState({}, "", url);
        
        // Refresh resumes list
        fetchMyResumes();
      }
    } catch (err: any) {
      console.error("Save failed", err);
      if (err.message?.includes("3 active resumes")) {
         toast.error("You have reached the 3 resume limit. Please overwrite an existing one.");
      } else {
         toast.error("Failed to save to cloud");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setExportModalOpen(false);
      setIsExportingPdf(true);

      const resumeElement = document.querySelector(".resume-canvas-container") as HTMLElement;
      if (!resumeElement) throw new Error("Resume element not found");

      // Dynamically extract all existing styles from the document to ensure 1:1 rendering on the server
      const styleNodes = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"));
      const extractedStyles = styleNodes.map(node => node.outerHTML).join("\n");

      // Inject the exact inline CSS variables applied to the canvas wrapper
      const pageStylesElement = document.querySelector(".canvas-wrap") as HTMLElement;
      const inlineVars = pageStylesElement?.getAttribute("style") || "";

      // Create the clean HTML payload
      const cleanHtml = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            ${extractedStyles}
            <style>
              :root {
                ${inlineVars}
              }
              @media print {
                @page {
                  size: ${design.pageSize === 'letter' ? 'letter' : 'A4'} portrait;
                  margin: 0 !important;
                }
                body {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  background-color: transparent !important;
                }
                .no-print, .format-bar, .design-panel {
                  display: none !important;
                }
                .resume-canvas-container {
                  transform: none !important;
                  width: 100% !important;
                }
                .physical-page-container {
                  box-shadow: none !important;
                  border: none !important;
                  margin: 0 !important;
                  page-break-after: always;
                }
              }
            </style>
          </head>
          <body style="margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
            ${resumeElement.outerHTML}
          </body>
        </html>
      `;

      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: cleanHtml,
          filename: `${(name || "Resume").replace(/[^a-z0-9]/gi, '_')}_Resume.pdf`,
          pageSize: design.pageSize,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF on the server');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(name || "Resume").replace(/[^a-z0-9]/gi, '_')}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("High-quality PDF downloaded! 🎉");
    } catch (err: any) {
      console.error("PDF export failed:", err);
      toast.error("PDF export failed. Opening system print as fallback...");
      // Fallback directly to the system print dialog if the server-side generation fails
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  // --- Format Bar State ---
  const [formatBar, setFormatBar] = useState({
    visible: false,
    x: 0,
    y: 0,
    active: { b: false, i: false, u: false },
  });

  useEffect(() => {
    const handleSelection = () => {
      const sel = window.getSelection();
      if (
        !sel ||
        sel.isCollapsed ||
        sel.rangeCount === 0 ||
        sel.toString().trim() === ""
      ) {
        setFormatBar((p) => ({ ...p, visible: false }));
        return;
      }
      const node = sel.anchorNode;
      const el =
        node?.nodeType === 3 ? node.parentElement : (node as HTMLElement);
      if (
        !el ||
        !el.closest(".page") ||
        !el.closest('[contenteditable="true"]')
      ) {
        setFormatBar((p) => ({ ...p, visible: false }));
        return;
      }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      setFormatBar({
        visible: true,
        x: rect.left + rect.width / 2 + window.scrollX,
        y: rect.top + window.scrollY - 10,
        active: {
          b: document.queryCommandState("bold"),
          i: document.queryCommandState("italic"),
          u: document.queryCommandState("underline"),
        },
      });
    };
    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("keyup", handleSelection);
    return () => {
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("keyup", handleSelection);
    };
  }, []);

  const fmt = (cmd: string, val?: string) => {
    if (cmd === "clear") {
      document.execCommand("removeFormat");
      // Simple clear implementation
    } else if (cmd === "increaseFontSize" || cmd === "decreaseFontSize") {
      const factor = cmd === "increaseFontSize" ? 1.12 : 0.89;
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount || sel.isCollapsed) return;
      const range = sel.getRangeAt(0);
      let container = range.commonAncestorContainer;
      if (container.nodeType === 3) container = container.parentElement as Node;
      const existingSpan = (container as HTMLElement).closest?.(
        "span[data-fsz]",
      );
      if (existingSpan && existingSpan.textContent === range.toString()) {
        const cur =
          parseFloat((existingSpan as HTMLElement).style.fontSize) || 1;
        (existingSpan as HTMLElement).style.fontSize =
          (cur * factor).toFixed(2) + "em";
        return;
      }
      const span = document.createElement("span");
      span.setAttribute("data-fsz", "1");
      span.style.fontSize = factor.toFixed(2) + "em";
      try {
        range.surroundContents(span);
      } catch (e) {
        const frag = range.extractContents();
        span.appendChild(frag);
        range.insertNode(span);
      }
      sel.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.addRange(newRange);
    } else {
      document.execCommand(cmd, false, val);
    }
    setFormatBar((p) => ({
      ...p,
      active: {
        b: document.queryCommandState("bold"),
        i: document.queryCommandState("italic"),
        u: document.queryCommandState("underline"),
      },
    }));
  };

  // --- Page Breaks Calculation ---
  const [gapHeights, setGapHeights] = useState<Record<string, { total: number; top: number }>>({});
  const [idToPageMap, setIdToPageMap] = useState<Record<string, number>>({});
  const [pageBreaks, setPageBreaks] = useState<number[]>([]);
  const [pageBreakElementIds, setPageBreakElementIds] = useState<string[]>([]);
  const pageBreakElementIdsRef = useRef<string[]>([]);

  useEffect(() => {
    pageBreakElementIdsRef.current = pageBreakElementIds;
  }, [pageBreakElementIds]);

  const resumeRef = useRef<HTMLDivElement>(null);

  const calcPages = useCallback(() => {
    if (!resumeRef.current) return;
    const resume = resumeRef.current;
    const pageHeightPx = design.pageSize === "letter" ? 1056 : 1123;
    const marginPx = design.pageMarginTopBottom ?? design.pageMargin;
    const contentHeightPx = pageHeightPx - marginPx * 2;
    const resumeRect = resume.getBoundingClientRect();
    const scale = resumeRect.width / (design.pageSize === "letter" ? 816 : 794) || 1;
    const units = Array.from(
      resume.querySelectorAll(".block.print\\:hidden [data-page-break-id]"),
    ) as HTMLElement[];

    if (units.length === 0) {
      setPageBreaks([]);
      setPageBreakElementIds([]);
      setIdToPageMap({});
      setGapHeights({});
      return;
    }

    const gaps = Array.from(resume.querySelectorAll(".block.print\\:hidden .page-break-gap")) as HTMLElement[];
    const currentIds = pageBreakElementIdsRef.current;

    const shiftMap: Record<string, number> = { default: 0 };
    const prevElMap: Record<string, HTMLElement | null> = { default: null };
    let gapIdx = 0;
    const resumeTop = resumeRect.top / scale;

    const naturalCoords = units.map((el, i) => {
      const colKey = el.closest("[data-column]")?.getAttribute("data-column") || "default";
      if (!(colKey in shiftMap)) {
        shiftMap[colKey] = 0;
        prevElMap[colKey] = null;
      }
      let prevEl = prevElMap[colKey];
      if (!prevEl && colKey !== "default") {
        prevEl = prevElMap["default"] || null;
      }
      const currentPageIdxAttr = el.closest(".physical-page-container")?.getAttribute("data-page-index");
      const prevPageIdxAttr = prevEl?.closest(".physical-page-container")?.getAttribute("data-page-index") ?? null;

      if (prevEl && currentPageIdxAttr !== prevPageIdxAttr && currentPageIdxAttr !== null && prevPageIdxAttr !== null) {
        const gap = (el.getBoundingClientRect().top - prevEl.getBoundingClientRect().bottom) / scale;
        shiftMap[colKey] += Math.max(0, gap);
      } else if (!prevEl && currentPageIdxAttr && currentPageIdxAttr !== "0") {
        const containerEl = el.closest(".physical-page-container") as HTMLElement | null;
        if (containerEl) {
          const gapFromSheetTop = (el.getBoundingClientRect().top - containerEl.getBoundingClientRect().top) / scale;
          shiftMap[colKey] += (el.getBoundingClientRect().top / scale - resumeTop) - gapFromSheetTop;
        }
      }

      const id = el.getAttribute("data-page-break-id");
      if (id && currentIds.includes(id)) {
        const gapEl = gaps[gapIdx];
        const height = gapEl ? gapEl.getBoundingClientRect().height / scale : (2 * marginPx + 32);
        if (currentPageIdxAttr === prevPageIdxAttr || !currentPageIdxAttr) {
          shiftMap[colKey] += height;
        }
        gapIdx++;
      }

      const rect = el.getBoundingClientRect();
      const elTop = rect.top / scale - resumeTop - shiftMap[colKey];
      const elBottom = rect.bottom / scale - resumeTop - shiftMap[colKey];
      prevElMap[colKey] = el;

      return {
        el,
        id,
        colKey,
        rect,
        elTop,
        elBottom,
      };
    });

    const pageStartYMap: Record<string, number | null> = {};
    const pageStartYInitialMap: Record<string, number> = {};
    const currentPIdxTracker: Record<string, number> = {};
    const prevItemPerCol: Record<string, typeof naturalCoords[0] | null> = {};
    const breakStarts: { el: HTMLElement; id: string | null; colKey: string; elTop: number; elBottom: number }[] = [];

    naturalCoords.forEach((item, i) => {
      const { el, id, colKey, elTop, elBottom } = item;

      if (pageStartYMap[colKey] === undefined || pageStartYMap[colKey] === null) {
        pageStartYMap[colKey] = elTop;
        pageStartYInitialMap[colKey] = elTop;
        currentPIdxTracker[colKey] = 0;
        prevItemPerCol[colKey] = item;
        return;
      }

      const section = el.closest(".section");
      const isHeading = el.classList.contains("section-heading");
      const manualBreakHere =
        isHeading && section && section.classList.contains("manual-break");
      const prevItem = prevItemPerCol[colKey] ?? null;
      const coupledWithHeading =
        !isHeading &&
        prevItem &&
        prevItem.el.classList.contains("section-heading") &&
        prevItem.el.closest(".section") === section;

      const breakItem = coupledWithHeading ? prevItem : item;
      const checkTop = coupledWithHeading ? prevItem.elTop : elTop;
      const maxSafeBottom = currentPIdxTracker[colKey] === 0
        ? pageHeightPx - marginPx
        : pageStartYMap[colKey]! + contentHeightPx;
        
      const isCurrentlyBroken = breakItem.id && currentIds.includes(breakItem.id);
      const hysteresisBuffer = isCurrentlyBroken ? 85 : 0;
      const wouldOverflow = elBottom > (maxSafeBottom - hysteresisBuffer);

      if ((manualBreakHere || wouldOverflow) && checkTop !== pageStartYMap[colKey]) {
        pageStartYMap[colKey] = checkTop;
        currentPIdxTracker[colKey] = (currentPIdxTracker[colKey] || 0) + 1;
        
        if (breakStarts.length === 0 || breakStarts[breakStarts.length - 1].el !== breakItem.el) {
          breakStarts.push({
            el: breakItem.el,
            id: breakItem.id,
            colKey: breakItem.colKey,
            elTop: breakItem.elTop,
            elBottom: breakItem.elBottom,
          });
        }
      }
      prevItemPerCol[colKey] = item;
    });

    const newBreakIds = breakStarts
      .map((item) => item.id)
      .filter(Boolean) as string[];

    const newIdToPageMap: Record<string, number> = {};
    const currentPIdxMap: Record<string, number> = {};
    units.forEach((el) => {
      const colKey = el.closest("[data-column]")?.getAttribute("data-column") || "default";
      if (currentPIdxMap[colKey] === undefined) {
        currentPIdxMap[colKey] = 0;
      }
      const id = el.getAttribute("data-page-break-id");
      if (!id) return;
      if (newBreakIds.includes(id)) {
        currentPIdxMap[colKey]++;
      }
      if (newIdToPageMap[id] === undefined) {
        newIdToPageMap[id] = currentPIdxMap[colKey];
      }
    });

    setIdToPageMap((prev) => {
      const keys = Object.keys(newIdToPageMap);
      const prevKeys = Object.keys(prev);
      if (keys.length !== prevKeys.length) return newIdToPageMap;
      if (keys.some((k) => prev[k] !== newIdToPageMap[k])) return newIdToPageMap;
      return prev;
    });

    const newGapHeights: Record<string, { total: number; top: number }> = {};
    breakStarts.forEach((br, idx) => {
      const brId = br.id;
      if (!brId) return;

      const brIndex = naturalCoords.findIndex((item) => item.el === br.el);
      const prevItem = brIndex > 0 ? naturalCoords[brIndex - 1] : null;

      const prevActualBottomInPage = prevItem 
        ? (prevItem.rect.bottom / scale - resumeTop) 
        : marginPx;

      const sheetBottom = (idx + 1) * pageHeightPx + idx * 32;
      const topSpacer = Math.max(0, Math.round(sheetBottom - prevActualBottomInPage));
      const total = Math.round(topSpacer + 32 + marginPx);

      newGapHeights[brId] = { total, top: topSpacer };
    });

    const newBreaks = breakStarts.map((item) => {
      return Math.round(item.elTop - (pageStartYInitialMap[item.colKey ?? "default"] ?? 0));
    });

    setPageBreaks((prev) => {
      if (
        prev.length === newBreaks.length &&
        prev.every((v, i) => Math.abs(v - newBreaks[i]) <= 2)
      ) {
        return prev;
      }
      return newBreaks;
    });

    setPageBreakElementIds((prev) => {
      if (
        prev.length === newBreakIds.length &&
        prev.every((v, i) => v === newBreakIds[i])
      ) {
        return prev;
      }
      return newBreakIds;
    });

    setGapHeights((prev) => {
      const keys = Object.keys(newGapHeights);
      const prevKeys = Object.keys(prev);
      if (keys.length !== prevKeys.length) {
        return newGapHeights;
      }
      const isDifferent = keys.some(
        (k) =>
          prev[k] === undefined ||
          Math.abs((prev[k]?.total ?? 0) - (newGapHeights[k]?.total ?? 0)) > 2 ||
          Math.abs((prev[k]?.top ?? 0) - (newGapHeights[k]?.top ?? 0)) > 2
      );
      if (isDifferent) {
        return newGapHeights;
      }
      return prev;
    });
  }, [design.pageSize, design.pageMargin, design.pageMarginLeftRight, design.pageMarginTopBottom]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const runCalc = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        calcPages();
      }, 300); // 300ms debounce to prevent layout thrashing
    };

    runCalc();
    const observer = new MutationObserver(runCalc);
    if (resumeRef.current)
      observer.observe(resumeRef.current, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    window.addEventListener("resize", runCalc);
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
      window.removeEventListener("resize", runCalc);
    };
  }, [calcPages]);

  const applyTemplate = (t: any) => {
    setDesign((prev: any) => ({
      ...prev,
      template: t.id,
      fontHeading: t.heading,
      fontBody: t.body,
      accent: t.accent,
      panel: t.panel,
      paper: t.paper || "#ffffff",
      radius: t.radius,
      layout: t.layout,
      headingStyle: t.headingStyle,
      italic: t.italic,
      headerAlign: t.headerAlign || "left",
      listStyle: t.listStyle || "disc",
      pageMargin: t.pageMargin || 38,
      itemSpacing: t.itemSpacing || 16,
      jobLayout: t.jobLayout || "stacked",
      boxOpacity: t.boxOpacity !== undefined ? t.boxOpacity : prev.boxOpacity,
      boxShadow: t.boxShadow || prev.boxShadow,
      borderStyle: t.borderStyle || prev.borderStyle,
      backdropBlur: t.backdropBlur !== undefined ? t.backdropBlur : prev.backdropBlur,
    }));
  };

  const saveHTML = () => {
    const clone = document.documentElement.cloneNode(true) as HTMLElement;
    clone
      .querySelectorAll(".no-print, .overlay-scrim, .format-bar, .design-panel")
      .forEach((el) => el.remove());
    const blob = new Blob(["<!DOCTYPE html>\n" + clone.outerHTML], {
      type: "text/html",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume-editable.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const boxOp = (design.boxOpacity !== undefined ? design.boxOpacity : 95) / 100;
  const panelRgb = hexToRgb(design.panel);
  const accentRgb = hexToRgb(design.accent);

  const shadowValue = ({
    none: "none",
    soft: "0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)",
    medium: "0 4px 16px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.03)",
    deep: "0 10px 30px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)",
    glass: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
    neon: `0 0 15px ${design.accent}25, 0 0 5px ${design.accent}15`,
  } as any)[design.boxShadow || "soft"] || "none";

  const borderValue = ({
    none: "none",
    hairline: "1px solid var(--hairline)",
    accent: `1px solid rgba(${accentRgb}, 0.25)`,
    dashed: `1px dashed rgba(${accentRgb}, 0.4)`,
    double: `3px double var(--hairline)`,
  } as any)[design.borderStyle || "hairline"] || "none";

  const pageWidthPx = design.pageSize === "letter" ? 816 : 794;
  const pageHeightPx = design.pageSize === "letter" ? 1056 : 1123;
  const maxPageFromMap = Object.values(idToPageMap || {}).length > 0 ? Math.max(...Object.values(idToPageMap || {})) : 0;
  const totalPages = Math.max(pageBreakElementIds.length + 1, maxPageFromMap + 1, 1);
  const totalHeightPx = pageHeightPx * totalPages + 32 * Math.max(0, totalPages - 1);

  const pageStyles = {
    "--ink": "#232025",
    "--ink-soft": "#6b6568",
    "--hairline": "#dcd7da",
    "--mauve": design.panel,
    "--mauve-dark": shadeColor(design.panel, -8),
    "--panel": design.panel,
    "--panel-rgb": panelRgb,
    "--panel-rgba": `rgba(${panelRgb}, ${boxOp})`,
    "--panel-dark-rgba": `rgba(${hexToRgb(shadeColor(design.panel, -8))}, ${boxOp})`,
    "--accent": design.accent,
    "--accent-rgb": accentRgb,
    "--paper": design.paper || "#ffffff",
    "--toolbar-bg": "#1d1b1e",
    "--danger": "#a94442",
    "--radius": `${design.radius}px`,
    "--font-heading": design.fontHeading,
    "--font-body": design.fontBody,
    "--text-scale": design.scale / 100,
    "--line-height": design.lineHeight,
    "--section-gap": `${design.gap}px`,
    "--item-spacing": `${design.itemSpacing}px`,
    "--list-style": design.listStyle,
    "--page-width": design.pageSize === "letter" ? "816px" : "794px",
    "--page-height": design.pageSize === "letter" ? "1056px" : "1123px",
    "--page-margin": `${design.pageMargin}px`,
    "--page-margin-y": `${design.pageMarginTopBottom ?? design.pageMargin}px`,
    "--page-margin-x": `${design.pageMarginLeftRight ?? design.pageMargin}px`,
    "--sidebar-w": "230px",
    "--box-opacity": boxOp.toString(),
    "--box-shadow": shadowValue,
    "--box-border": borderValue,
    "--backdrop-blur": `${design.backdropBlur || 4}px`,
  } as React.CSSProperties;

  const layoutClasses = [
    design.italic ? "" : "no-italic-body",
    design.headingStyle === "bar" ? "" : `heading-${design.headingStyle}`,
    design.layout === "sidebar" ? "layout-sidebar" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // --- Renderers ---

  return (
    <div className="h-screen w-full flex bg-[#f8f9fa] text-gray-900 antialiased overflow-hidden font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes photo-wobble {
          0%, 100% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(2.5deg) scale(1.04); }
        }
        @keyframes photo-flicker {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 2px rgba(0, 240, 255, 0.3)); }
          50% { opacity: 0.85; filter: drop-shadow(0 0 12px rgba(0, 240, 255, 0.9)); }
        }
        @keyframes photo-barndoor {
          0% { transform: scaleX(0); transform-origin: left; }
          100% { transform: scaleX(1); transform-origin: left; }
        }
        @keyframes photo-circle {
          0% { clip-path: circle(0% at 50% 50%); }
          100% { clip-path: circle(100% at 50% 50%); }
        }
        @keyframes photo-fade {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-photo-wobble:hover {
          animation: photo-wobble 2.5s ease-in-out infinite;
        }
        .animate-photo-flicker {
          animation: photo-flicker 1.5s ease-in-out infinite;
        }
        .animate-photo-barndoor {
          animation: photo-barndoor 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-photo-circle {
          animation: photo-circle 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-photo-fade {
          animation: photo-fade 0.9s ease-out forwards;
        }
      `}} />
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Save Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Save to Cloud</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Resume Name</label>
              <input
                type="text"
                value={saveResumeName}
                onChange={(e) => setSaveResumeName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Software Engineer Resume"
              />
            </div>
            
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Save Destination (Limit 3 active resumes)</p>
              <div className="space-y-2">
                {myResumes.length < 3 && (
                  <label className={cn("flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all", saveOverwriteId === null ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300")}>
                    <input type="radio" name="save_dest" checked={saveOverwriteId === null} onChange={() => setSaveOverwriteId(null)} className="hidden" />
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">Create New Resume</div>
                    </div>
                  </label>
                )}
                {myResumes.map((resume) => (
                  <label key={resume.id} className={cn("flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all", saveOverwriteId === resume.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300")}>
                    <input type="radio" name="save_dest" checked={saveOverwriteId === resume.id} onChange={() => setSaveOverwriteId(resume.id)} className="hidden" />
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">{resume.name || "Untitled Resume"}</div>
                      <div className="text-[10px] text-gray-500">Updated: {new Date(resume.updated_at).toLocaleDateString()}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setSaveModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-700 hover:text-gray-900">Cancel</button>
              <button onClick={handleSaveToCloud} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Share Resume</h2>
            <p className="text-sm text-gray-500 mb-4">
              {resumeId ? "Anyone with this link can view your resume." : "Please save your resume to the cloud first to generate a shareable link."}
            </p>
            {resumeId ? (
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/share/${resumeId}`}
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-600 focus:outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/share/${resumeId}`);
                    toast.success("Link copied to clipboard! 📋");
                  }}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all"
                >
                  Copy
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setShareModalOpen(false);
                  setSaveModalOpen(true);
                }}
                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all"
              >
                Save Resume Now
              </button>
            )}
            <button
              onClick={() => setShareModalOpen(false)}
              className="w-full mt-2 px-3 py-2 text-gray-500 hover:text-gray-900 text-xs font-bold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Export PDF Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <FileDown size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">Export Resume to PDF</h2>
                  <p className="text-xs text-gray-500">Choose the format that best fits your needs</p>
                </div>
              </div>
              <button
                onClick={() => setExportModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-all cursor-pointer"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div className="space-y-3 my-5">
              <button
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="w-full text-left p-4 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300 transition-all group flex items-start gap-3 cursor-pointer disabled:opacity-60"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-all">
                  {isExportingPdf ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-gray-900 flex items-center justify-between">
                    <span>Direct Download (.pdf)</span>
                    <span className="text-[10px] uppercase tracking-wider bg-blue-100 text-blue-700 font-extrabold px-2 py-0.5 rounded-full">Recommended</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    Instantly downloads a WYSIWYG multi-page PDF directly to your device. No system print margins or dialogs required.
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  setExportModalOpen(false);
                  setTimeout(() => window.print(), 150);
                }}
                disabled={isExportingPdf}
                className="w-full text-left p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all group flex items-start gap-3 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-all">
                  <Printer size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-gray-900 flex items-center justify-between">
                    <span>System Print / ATS Vector</span>
                    <span className="text-[10px] uppercase tracking-wider bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full">ATS Selectable</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Opens system print dialog (`Save as PDF`). Essential for ATS text parsers. Note: Set Margins to `None` and uncheck Headers/Footers.
                  </p>
                </div>
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                onClick={() => setExportModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Format Bar */}
      {formatBar.visible && (
        <div
          className="format-bar fixed z-[200] bg-[#1d1b1e] text-white rounded-lg shadow-xl p-1.5 flex items-center gap-1 -translate-x-1/2 transition-all no-print"
          style={{ left: formatBar.x, top: formatBar.y }}
        >
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              document.execCommand("bold");
            }}
            className={cn(
              "p-1.5 rounded-md hover:bg-[#33303a]",
              formatBar.active.b && "bg-[#4a3c50] text-[#00f0ff]",
            )}
            title="Bold (Ctrl+B)"
            aria-label="Bold"
          >
            <Bold size={14} />
          </button>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              document.execCommand("italic");
            }}
            className={cn(
              "p-1.5 rounded-md hover:bg-[#33303a]",
              formatBar.active.i && "bg-[#4a3c50] text-[#00f0ff]",
            )}
            title="Italic (Ctrl+I)"
            aria-label="Italic"
          >
            <Italic size={14} />
          </button>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              document.execCommand("underline");
            }}
            className={cn(
              "p-1.5 rounded-md hover:bg-[#33303a]",
              formatBar.active.u && "bg-[#4a3c50] text-[#00f0ff]",
            )}
            title="Underline (Ctrl+U)"
            aria-label="Underline"
          >
            <Underline size={14} />
          </button>
          <div className="w-px h-4 bg-[#4d3f52] mx-1"></div>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              document.execCommand("removeFormat");
            }}
            className="p-1.5 rounded-md hover:bg-[#33303a] text-gray-300"
            title="Clear formatting"
            aria-label="Clear formatting"
          >
            <Eraser size={14} />
          </button>
        </div>
      )}

      {/* Tutorial Overlay */}
      {tutorialOpen && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 font-sans no-print backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-[440px] p-6 shadow-2xl">
            <div className="text-[11px] font-bold tracking-widest text-gray-600 uppercase mb-1">
              {TUTORIAL_STEPS[tutorialStep].eyebrow}
            </div>
            <h3 className="font-bold text-xl text-gray-900 mb-2">
              {TUTORIAL_STEPS[tutorialStep].title}
            </h3>
            <div
              className="text-sm text-gray-600 leading-relaxed min-h-[70px]"
              dangerouslySetInnerHTML={{
                __html: TUTORIAL_STEPS[tutorialStep].body,
              }}
            />
            <div className="flex gap-1.5 my-4">
              {TUTORIAL_STEPS.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full",
                    i === tutorialStep ? "bg-gray-800" : "bg-gray-200",
                  )}
                />
              ))}
            </div>
            <div className="flex items-center justify-between mt-6">
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dontShowTutorialAgain}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setDontShowTutorialAgain(checked);
                    if (checked && typeof window !== "undefined") {
                      localStorage.setItem("resume_tutorial_seen", "true");
                      setCookie("resume_tutorial_seen", "true", 365);
                    } else if (typeof window !== "undefined") {
                      localStorage.removeItem("resume_tutorial_seen");
                      setCookie("resume_tutorial_seen", "", -1);
                    }
                  }}
                /> Don&apos;t show this again
              </label>
              <div className="flex gap-2">
                {tutorialStep > 0 && (
                  <button
                    onClick={() => setTutorialStep((p) => p - 1)}
                    className="rounded-lg px-4 py-2 text-sm font-semibold border border-gray-200 hover:bg-gray-50"
                  >
                    Back
                  </button>
                )}
                {tutorialStep < TUTORIAL_STEPS.length - 1 ? (
                  <button
                    onClick={() => setTutorialStep((p) => p + 1)}
                    className="rounded-lg px-4 py-2 text-sm font-semibold bg-gray-900 text-white hover:bg-black"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (dontShowTutorialAgain && typeof window !== "undefined") {
                        localStorage.setItem("resume_tutorial_seen", "true");
                        setCookie("resume_tutorial_seen", "true", 365);
                      }
                      setTutorialOpen(false);
                    }}
                    className="rounded-lg px-4 py-2 text-sm font-semibold bg-gray-900 text-white hover:bg-black"
                  >
                    Finish Tour
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Secondary Sidebar */}
      {activeSidebarTab && (
        <div
          style={{ width: typeof window !== "undefined" && window.innerWidth >= 768 ? `${sidebarWidth}px` : undefined }}
          className="fixed inset-x-0 bottom-16 top-14 md:relative md:inset-auto md:top-0 md:h-full bg-white border-t md:border-t-0 md:border-r border-gray-200 z-30 flex flex-col overflow-hidden no-print shrink-0 shadow-sm transition-all duration-300"
        >
          {/* Physical Resize Handle on right edge */}
          <div
            className="hidden md:block absolute top-0 right-0 bottom-0 w-1.5 hover:w-2 bg-transparent hover:bg-blue-400/30 active:bg-blue-500/50 cursor-col-resize z-50 transition-all duration-150"
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = sidebarWidth;
              const handleMouseMove = (moveEvent: MouseEvent) => {
                const currentWidth = startWidth + (moveEvent.clientX - startX);
                if (currentWidth >= 260 && currentWidth <= 480) {
                  setSidebarWidth(currentWidth);
                }
              };
              const handleMouseUp = () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
              };
              document.addEventListener("mousemove", handleMouseMove);
              document.addEventListener("mouseup", handleMouseUp);
            }}
          />

          {/* Floating Collapse Button positioned on border */}
          <button
            type="button"
            onClick={() => setActiveSidebarTab(null)}
            className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-white border border-gray-200 rounded-full shadow-md items-center justify-center z-50 hover:bg-gray-50 text-gray-600 hover:text-blue-600 hover:scale-105 active:scale-95 hover:shadow-lg transition-all cursor-pointer group"
            title="Collapse Sidebar"
          >
            <ChevronLeft size={14} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
          </button>
          {/* Templates Panel */}
          {activeSidebarTab === "templates" && (
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

              {/* Trust Showcase Card */}
              <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-widest">Trust Metrics & Reviews</span>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-xs text-gray-600 space-y-3">
                  <div className="flex items-center gap-1.5 text-blue-600 font-bold text-[11px]">
                    <Sparkles size={12} className="text-blue-500 animate-pulse" />
                    <span>Average 22% salary increase</span>
                  </div>
                  <p className="leading-relaxed italic text-gray-600 text-[11px]">
                    "This tool completely transformed my job search. The formatting engine is flawless, and the real-time layout guidelines saved me hours."
                    <span className="block font-bold text-gray-700 not-italic mt-1 text-[11px]">— Dan K., Lead Engineer at Meta</span>
                  </p>
                  <p className="leading-relaxed italic text-gray-600 text-[11px] border-t border-gray-200/50 pt-2">
                    "The single-click PDF export layout is gorgeous. Hiring managers immediately commented on the clean typography."
                    <span className="block font-bold text-gray-700 not-italic mt-1 text-[11px]">— Priya S., Senior PM</span>
                  </p>
                  <div className="border-t border-gray-200/50 pt-2 flex items-center justify-between text-[9px] text-gray-600 font-semibold uppercase tracking-wider">
                    <span>⭐⭐⭐⭐⭐ Rated 4.9/5</span>
                    <span>10,000+ happy devs</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Design Panel */}
          {activeSidebarTab === "design" && (
            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-600">
                  Design Settings
                </h2>
                <button
                  onClick={() => setActiveSidebarTab(null)}
                  className="text-gray-600 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-900">
                    Typography
                  </h3>
                  
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
                        setDesign((p) => ({
                          ...p,
                          fontHeading: e.target.value,
                        }))
                      }
                    >
                      <option value="'Kalam',cursive">Kalam</option>
                      <option value="'Playfair Display',serif">Playfair</option>
                      <option value="'Poppins',sans-serif">Poppins</option>
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
                        setDesign((p) => ({ ...p, fontBody: e.target.value }))
                      }
                    >
                      <option value="'Lora',serif">Lora</option>
                      <option value="'Inter',sans-serif">Inter</option>
                      <option value="'Source Serif 4',serif">
                        Source Serif 4
                      </option>
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
                        setDesign((p) => ({
                          ...p,
                          scale: parseInt(e.target.value),
                        }))
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
                        setDesign((p) => ({
                          ...p,
                          lineHeight: parseFloat(e.target.value),
                        }))
                      }
                    />
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

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Accent
                      </label>
                      <input
                        type="color"
                        className="w-full h-8 rounded cursor-pointer border-0 p-0"
                        value={design.accent}
                        onChange={(e) =>
                          setDesign((p) => ({ ...p, accent: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Panel
                      </label>
                      <input
                        type="color"
                        className="w-full h-8 rounded cursor-pointer border-0 p-0"
                        value={design.panel}
                        onChange={(e) =>
                          setDesign((p) => ({ ...p, panel: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Paper
                      </label>
                      <input
                        type="color"
                        className="w-full h-8 rounded cursor-pointer border-0 p-0"
                        value={design.paper}
                        onChange={(e) =>
                          setDesign((p) => ({ ...p, paper: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-900">
                    Layout & Spacing
                  </h3>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Layout Style
                    </label>
                    <select
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={design.layout}
                      onChange={(e) =>
                        setDesign((p) => ({ ...p, layout: e.target.value }))
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
                        setDesign((p) => ({ ...p, jobLayout: e.target.value }))
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
                        setDesign((p) => ({
                          ...p,
                          headingStyle: e.target.value,
                        }))
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
                        setDesign((p) => ({
                          ...p,
                          radius: parseInt(e.target.value),
                        }))
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
                        setDesign((p) => ({
                          ...p,
                          gap: parseInt(e.target.value),
                        }))
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
                        setDesign((p) => ({
                          ...p,
                          itemSpacing: parseInt(e.target.value),
                        }))
                      }
                    />
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
                          setDesign((p) => ({
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
                          setDesign((p) => ({
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
                          setDesign((p) => ({
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
                        setDesign((p) => ({
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
                        setDesign((p) => ({
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
                        setDesign((p) => ({
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
                        setDesign((p) => ({
                          ...p,
                          boxOpacity: parseInt(e.target.value),
                        }))
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
                        setDesign((p) => ({ ...p, boxShadow: e.target.value }))
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
                        setDesign((p) => ({ ...p, borderStyle: e.target.value }))
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
                        setDesign((p) => ({
                          ...p,
                          backdropBlur: parseInt(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Content Panel */}
          {activeSidebarTab === "content" && (
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
                      ...experiences,
                      {
                        id: Date.now().toString(),
                        title: "Job Title",
                        date: "Date",
                        bullets: [
                          { id: Date.now().toString(), text: "New bullet" },
                        ],
                        meta: "",
                      },
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
                      ...skills,
                      {
                        id: Date.now().toString(),
                        title: "New Category",
                        items: "Skills",
                      },
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
                      ...educations,
                      {
                        id: Date.now().toString(),
                        degree: "Degree",
                        bullets: [
                          { id: Date.now().toString(), text: "New bullet" },
                        ],
                      },
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
                      ...licenses,
                      {
                        id: Date.now().toString(),
                        text: "New License or Certification",
                      },
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
          )}

          {/* Photo Panel */}
          {activeSidebarTab === "photo" && (
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-600">
                  Profile Photo Settings
                </h2>
                <button
                  onClick={() => setActiveSidebarTab(null)}
                  className="text-gray-600 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <X size={18} />
                </button>
              </div>
              
              {/* Enable Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-xs font-semibold text-gray-800">Show Photo on Resume</span>
                <button
                  onClick={() => setProfilePhoto(p => ({ ...p, enabled: !p.enabled }))}
                  className={cn(
                    "w-11 h-6 rounded-full transition-colors relative",
                    profilePhoto.enabled ? "bg-blue-600" : "bg-gray-200"
                  )}
                >
                  <span className={cn(
                    "absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow-sm transition-transform",
                    profilePhoto.enabled ? "translate-x-5" : "translate-x-0"
                  )} />
                </button>
              </div>

              {profilePhoto.enabled && (
                <>
                  {/* Upload / Drag Area */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      Upload Picture
                    </label>
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const b64 = event.target?.result as string;
                            setProfilePhoto(p => ({ ...p, url: b64, rawUploadedUrl: b64 }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="border-2 border-dashed border-gray-200 hover:border-blue-500 rounded-xl p-5 text-center cursor-pointer hover:bg-blue-50/20 transition-all group relative"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Camera className="mx-auto text-gray-600 group-hover:text-blue-500 mb-2 transition-colors" size={24} />
                      <div className="text-xs font-semibold text-gray-700">Drag & Drop or Click to upload</div>
                      <div className="text-[11px] text-gray-600 mt-1">Supports JPG, PNG, GIF</div>
                    </div>
                  </div>



                  {/* Background removal section */}
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      Remove Background
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleAutoRemoveBackground(bgRemoveSensitivity)}
                        className="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Scissors size={14} /> Auto Remove
                      </button>
                      <button
                        onClick={() => setEraseModalOpen(true)}
                        className="py-2.5 px-3 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Eraser size={14} /> Brush Eraser
                      </button>
                    </div>

                    <div className="space-y-1.5 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Key Out Custom Color</span>
                        <input
                          type="color"
                          value={bgRemoveColor}
                          onChange={(e) => setBgRemoveColor(e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                        />
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-gray-600">
                        <span>Tolerance: {bgRemoveSensitivity}</span>
                        <input
                          type="range"
                          min="10"
                          max="150"
                          value={bgRemoveSensitivity}
                          onChange={(e) => setBgRemoveSensitivity(parseInt(e.target.value))}
                          className="w-24 accent-blue-600"
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveBackground(bgRemoveColor, bgRemoveSensitivity)}
                        className="w-full mt-1.5 py-1 px-2 bg-white hover:bg-gray-100 border border-gray-200 rounded text-[11px] font-bold text-gray-600 transition-colors"
                      >
                        Key Out Target Color
                      </button>
                    </div>
                  </div>

                  {/* Photoshop Filters */}
                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      Photoshop Filters
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: "none", name: "Original" },
                        { id: "color-punch", name: "Color Punch" },
                        { id: "golden-hour", name: "Golden Hour" },
                        { id: "portrait", name: "Portrait" },
                        { id: "shadow", name: "Shadow" },
                        { id: "sunbath", name: "Sunbath" },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setProfilePhoto(p => ({ ...p, filter: f.id }))}
                          className={cn(
                            "py-1.5 px-2 text-[11px] font-semibold border rounded-lg transition-all",
                            profilePhoto.filter === f.id
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                          )}
                        >
                          {f.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tones */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      Tones (Duo / Tint)
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: "none", name: "None" },
                        { id: "grayscale", name: "Grayscale" },
                        { id: "darken", name: "Darken" },
                        { id: "tint", name: "Tint" },
                        { id: "colorize", name: "Colorize" },
                        { id: "duotone", name: "Duotone" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setProfilePhoto(p => ({ ...p, tone: t.id }))}
                          className={cn(
                            "py-1.5 px-2 text-[11px] font-semibold border rounded-lg transition-all",
                            profilePhoto.tone === t.id
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                          )}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Adjust Panel */}
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                      <Sliders size={14} /> Adjust Image Layout
                    </h3>

                    {/* Scale & Aspect Ratio */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                          Aspect Ratio
                        </label>
                        <select
                          value={profilePhoto.aspectRatio}
                          onChange={(e) => setProfilePhoto(p => ({ ...p, aspectRatio: e.target.value as any }))}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 outline-none"
                        >
                          <option value="1:1">1:1 Square</option>
                          <option value="3:4">3:4 Portrait</option>
                          <option value="4:3">4:3 Landscape</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                          Shape / Radius
                        </label>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setProfilePhoto(p => ({ ...p, radius: 50 }))}
                            className={cn("flex-1 py-1 px-1.5 border rounded-lg text-[11px] font-bold", profilePhoto.radius === 50 ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-gray-200")}
                          >
                            Circle
                          </button>
                          <button
                            onClick={() => setProfilePhoto(p => ({ ...p, radius: 12 }))}
                            className={cn("flex-1 py-1 px-1.5 border rounded-lg text-[11px] font-bold", profilePhoto.radius === 12 ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-gray-200")}
                          >
                            Rounded
                          </button>
                          <button
                            onClick={() => setProfilePhoto(p => ({ ...p, radius: 0 }))}
                            className={cn("flex-1 py-1 px-1.5 border rounded-lg text-[11px] font-bold", profilePhoto.radius === 0 ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-gray-200")}
                          >
                            Square
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Scale slider */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Image Scale ({profilePhoto.scale}%)</label>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={profilePhoto.scale}
                        onChange={(e) => setProfilePhoto(p => ({ ...p, scale: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    {/* Opacity slider */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Opacity ({profilePhoto.opacity}%)</label>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={profilePhoto.opacity}
                        onChange={(e) => setProfilePhoto(p => ({ ...p, opacity: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    {/* Offsets (X & Y Alignment) */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">X Offset ({profilePhoto.xOffset}px)</label>
                        <input
                          type="range"
                          min="-80"
                          max="80"
                          value={profilePhoto.xOffset}
                          onChange={(e) => setProfilePhoto(p => ({ ...p, xOffset: parseInt(e.target.value) }))}
                          className="w-full accent-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">Y Offset ({profilePhoto.yOffset}px)</label>
                        <input
                          type="range"
                          min="-80"
                          max="80"
                          value={profilePhoto.yOffset}
                          onChange={(e) => setProfilePhoto(p => ({ ...p, yOffset: parseInt(e.target.value) }))}
                          className="w-full accent-blue-600"
                        />
                      </div>
                    </div>

                    {/* Borders */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">Border Width ({profilePhoto.borderWidth}px)</label>
                        <input
                          type="range"
                          min="0"
                          max="8"
                          value={profilePhoto.borderWidth}
                          onChange={(e) => setProfilePhoto(p => ({ ...p, borderWidth: parseInt(e.target.value) }))}
                          className="w-full accent-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">Border Color</label>
                        <input
                          type="color"
                          value={profilePhoto.borderColor}
                          onChange={(e) => setProfilePhoto(p => ({ ...p, borderColor: e.target.value }))}
                          className="w-full h-8 rounded cursor-pointer border-0 p-0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Professional Photo Editing Sliders */}
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                        <Sliders size={14} /> Advanced Adjustments
                      </h3>

                    </div>

                    {/* Brightness */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Brightness ({profilePhoto.brightness ?? 100}%)</label>
                        <button onClick={() => setProfilePhoto(p => ({ ...p, brightness: 100 }))} className="text-[9px] text-blue-500 hover:underline">Reset</button>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="200"
                        value={profilePhoto.brightness ?? 100}
                        onChange={(e) => setProfilePhoto(p => ({ ...p, brightness: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    {/* Contrast */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Contrast ({profilePhoto.contrast ?? 100}%)</label>
                        <button onClick={() => setProfilePhoto(p => ({ ...p, contrast: 100 }))} className="text-[9px] text-blue-500 hover:underline">Reset</button>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="200"
                        value={profilePhoto.contrast ?? 100}
                        onChange={(e) => setProfilePhoto(p => ({ ...p, contrast: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    {/* Saturation */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Saturation ({profilePhoto.saturation ?? 100}%)</label>
                        <button onClick={() => setProfilePhoto(p => ({ ...p, saturation: 100 }))} className="text-[9px] text-blue-500 hover:underline">Reset</button>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={profilePhoto.saturation ?? 100}
                        onChange={(e) => setProfilePhoto(p => ({ ...p, saturation: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    {/* Blur */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Soft Focus / Blur ({profilePhoto.blur ?? 0}px)</label>
                        <button onClick={() => setProfilePhoto(p => ({ ...p, blur: 0 }))} className="text-[9px] text-blue-500 hover:underline">Reset</button>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={profilePhoto.blur ?? 0}
                        onChange={(e) => setProfilePhoto(p => ({ ...p, blur: parseFloat(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    {/* Hue Rotate */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Hue Shift ({profilePhoto.hueRotate ?? 0}°)</label>
                        <button onClick={() => setProfilePhoto(p => ({ ...p, hueRotate: 0 }))} className="text-[9px] text-blue-500 hover:underline">Reset</button>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={profilePhoto.hueRotate ?? 0}
                        onChange={(e) => setProfilePhoto(p => ({ ...p, hueRotate: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>

                    {/* Sepia */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Warmth / Sepia ({profilePhoto.sepia ?? 0}%)</label>
                        <button onClick={() => setProfilePhoto(p => ({ ...p, sepia: 0 }))} className="text-[9px] text-blue-500 hover:underline">Reset</button>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={profilePhoto.sepia ?? 0}
                        onChange={(e) => setProfilePhoto(p => ({ ...p, sepia: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>
                  </div>

                  {/* Photo Motion & Effects */}
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                      <Sparkles size={14} /> Motion & Transition Effects
                    </h3>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Animation Preset
                      </label>
                      <select
                        value={profilePhoto.animation || "none"}
                        onChange={(e) => setProfilePhoto(p => ({ ...p, animation: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 outline-none"
                      >
                        <option value="none">None (Static)</option>
                        <option value="wobble">Wobble (Gentle hover drift)</option>
                        <option value="barndoor">Barndoor (Slide in from edge)</option>
                        <option value="circle">Circle Reveal (Radial grow)</option>
                        <option value="fade">Elegant Fade In</option>
                        <option value="flicker">Futuristic Glow Flicker</option>
                      </select>
                      <p className="text-[9px] text-gray-600 mt-1">
                        Adds a gorgeous interactive hover or entry motion effect.
                      </p>
                    </div>
                  </div>

                  {/* Reset Adjustments */}
                  <div className="pt-4">
                    <button
                      onClick={() => setProfilePhoto(p => ({
                        ...p,
                        opacity: 100,
                        scale: 100,
                        radius: 50,
                        filter: "none",
                        tone: "none",
                        xOffset: 0,
                        yOffset: 0,
                        borderWidth: 2,
                        borderColor: "#e2e8f0",
                        aspectRatio: "1:1",
                        brightness: 100,
                        contrast: 100,
                        saturation: 100,
                        blur: 0,
                        hueRotate: 0,
                        sepia: 0,
                        animation: "none",
                      }))}
                      className="w-full py-1.5 border border-dashed border-gray-200 rounded-lg text-xs text-gray-600 hover:text-gray-800 hover:border-gray-300 transition-colors"
                    >
                      Reset Photo Adjustments
                    </button>
                  </div>
                </>
              )}
              
              <div className="mt-4 pt-4 border-t border-gray-100 text-[11px] text-gray-600 text-center">
                Agent Rez AI is provided "as-is". Please verify all AI-generated content before use.
              </div>
            </div>
          )}

          {/* Account Panel */}
          {activeSidebarTab === "account" && (
            <div className="flex-1 p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-600">
                  Account
                </h2>
                <button
                  onClick={() => setActiveSidebarTab(null)}
                  className="text-gray-600 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <X size={18} />
                </button>
              </div>
              {user ? (
                <div className="flex flex-col h-full overflow-y-auto pr-1 pb-4 space-y-4">
                  {/* Comprehensive Profile Info Card */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/60 space-y-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-blue-200 bg-blue-50 flex items-center justify-center shrink-0">
                        <img
                          src={user.user_metadata?.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex"}
                          alt="User avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-gray-900 truncate">
                          {user.user_metadata?.first_name || 'Member'} {user.user_metadata?.last_name || ''}
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-200/60 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-gray-600 font-medium uppercase tracking-wider text-[11px]">US State</div>
                        <div className="text-gray-800 font-semibold mt-0.5 truncate">{user.user_metadata?.state || 'Not set'}</div>
                      </div>
                      <div>
                        <div className="text-gray-600 font-medium uppercase tracking-wider text-[11px]">Date of Birth</div>
                        <div className="text-gray-800 font-semibold mt-0.5 truncate">
                          {user.user_metadata?.dob 
                            ? new Date(user.user_metadata.dob).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : 'Not set'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                      Choose Profile Avatar
                    </h3>
                    <div className="grid grid-cols-4 gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      {PRESET_AVATARS.map((av) => {
                        const isSelected = user?.user_metadata?.avatar === av.url;
                        return (
                          <button
                            key={av.id}
                            title={av.name}
                            onClick={async () => {
                              try {
                                const { error } = await supabase.auth.updateUser({
                                  data: { avatar: av.url },
                                });
                                if (error) throw error;
                                toast.success(`Avatar updated to ${av.name}!`);
                              } catch (err: any) {
                                toast.error(err.message || "Failed to update avatar");
                              }
                            }}
                            className={cn(
                              "relative rounded-full overflow-hidden border-2 transition-all p-0.5 hover:scale-105 flex items-center justify-center bg-white",
                              isSelected ? "border-blue-600 bg-blue-50/50 scale-105 shadow-sm" : "border-gray-200 hover:border-gray-300"
                            )}
                          >
                            <img src={av.url} alt={av.name} className="w-8 h-8 rounded-full" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Change Password Form */}
                  <form onSubmit={handleUpdatePassword} className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Change Password
                    </h3>
                    
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          required
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isUpdatingPassword}
                      className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-none rounded-lg py-2 text-xs font-bold hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isUpdatingPassword ? "Updating..." : "Update Password"}
                    </button>
                  </form>

                  <div className="flex-1 flex flex-col min-h-[200px]">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold text-gray-900">
                        Your Resumes
                      </h3>
                      <button
                        onClick={() => {
                          setResumeId(null);
                          setActiveSidebarTab("templates");
                        }}
                        className="text-xs text-blue-600 font-bold hover:underline"
                      >
                        + New
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                      {myResumes.length === 0 ? (
                        <div className="p-4 text-xs text-gray-600 text-center border border-dashed border-gray-200 rounded-lg">
                          No saved resumes found.
                        </div>
                      ) : (
                        myResumes.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => {
                              setResumeId(r.id);
                              loadResumeFromCloud(r.id);
                            }}
                            className={cn(
                              "block w-full text-left p-3 text-sm rounded-lg transition-all border",
                              resumeId === r.id
                                ? "bg-blue-50 border-blue-200 text-blue-900"
                                : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50",
                            )}
                          >
                            <div className="font-semibold">
                              Resume {r.id.substring(0, 8)}
                            </div>
                            <div className="text-[11px] text-gray-600 mt-1">
                              {new Date(r.updated_at).toLocaleDateString()}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="mt-4 w-full p-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-bold transition-all"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-4">
                    <CloudUpload size={28} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">
                    Save your progress
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Create an account to save your resumes to the cloud and
                    access them from anywhere.
                  </p>
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    className="w-full p-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all"
                  >
                    Log In / Sign Up
                  </button>
                </div>
              )}
            </div>
          )}

          {/* AI Tools Panel */}
          {activeSidebarTab === "ai" && (
            <div className="flex-1 p-4 flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between mb-3 shrink-0">
                <div className="flex items-center gap-1.5 text-amber-500">
                  <Sparkles size={18} className="animate-pulse" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">
                    Agent Rez
                  </h2>
                </div>
                <button
                  onClick={() => setActiveSidebarTab(null)}
                  className="text-gray-600 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Rate Limit Status Banner */}
              <div className="bg-blue-50/60 border border-blue-200/50 rounded-xl p-3.5 text-left mb-3 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-blue-800 font-bold text-[10px] uppercase tracking-wider">
                    <Sparkles size={11} className="text-blue-500 shrink-0 animate-pulse" />
                    <span>{user ? "AI Included ⚡" : "Rate Limit Status"}</span>
                  </div>
                  {user && (
                    <span className="text-[9px] bg-blue-100 text-blue-700 font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-blue-200/50">
                      Active
                    </span>
                  )}
                </div>
                
                <p className="text-[11px] text-gray-600 mt-1.5 leading-relaxed">
                  {user 
                    ? "Request capacity adjusts with demand to keep the service fast for everyone." 
                    : `Daily Limit: ${aiRemaining !== null ? aiRemaining : 5} / 5 requests remaining today.`
                  }
                </p>

                {user ? (
                  <div className="mt-2.5">
                    <button
                      onClick={() => setShowCapacityTip(!showCapacityTip)}
                      className="text-[10px] font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 border border-blue-200/60 rounded-lg px-2.5 py-1.5 cursor-pointer flex items-center gap-1 transition-all"
                    >
                      <span>Get More AI Requests</span>
                    </button>
                    {showCapacityTip && (
                      <div className="mt-2 p-2 bg-white border border-blue-200/60 text-[10px] text-gray-600 rounded-lg leading-relaxed shadow-xs">
                        💡 <b>Maximum speed allocated!</b> Because Agent Rez AI is 100% free with no paywalls or credit cards, request capacity is balanced dynamically in real-time. Your account already receives premium high-speed queue priority!
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    className="text-[10px] font-bold text-blue-600 hover:underline mt-2 flex items-center gap-0.5 cursor-pointer"
                  >
                    Log In / Sign Up to save drafts & unlock more features 🔑
                  </button>
                )}
              </div>

              {/* Agent Mode Selector Tabs */}
              <div className="flex border border-gray-200 rounded-xl p-1 bg-gray-50/50 shrink-0 mb-3 overflow-x-auto gap-0.5 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setAiAgentTab("agent")}
                  className={cn(
                    "flex-1 py-1.5 px-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap",
                    aiAgentTab === "agent"
                      ? "bg-white text-blue-600 shadow-sm border border-gray-100"
                      : "text-gray-600 hover:text-gray-800"
                  )}
                >
                  <Bot size={13} />
                  <span>AI Agent</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAiAgentTab("presets")}
                  className={cn(
                    "flex-1 py-1.5 px-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap",
                    aiAgentTab === "presets"
                      ? "bg-white text-blue-600 shadow-sm border border-gray-100"
                      : "text-gray-600 hover:text-gray-800"
                  )}
                >
                  <Sparkles size={13} />
                  <span>Quick Tools</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAiAgentTab("coverletter")}
                  className={cn(
                    "flex-1 py-1.5 px-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap",
                    aiAgentTab === "coverletter"
                      ? "bg-white text-blue-600 shadow-sm border border-gray-100"
                      : "text-gray-600 hover:text-gray-800"
                  )}
                >
                  <FileText size={13} />
                  <span>Cover Letter</span>
                </button>
              </div>

              {/* Full AI Assistant Panel content */}
              <div className="flex-1 flex flex-col min-h-0">
                {aiAgentTab === "agent" ? (
                  <div className="flex-1 flex flex-col min-h-0 h-full">
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-3 mb-3 bg-gray-50/50 rounded-xl p-3 border border-gray-200/60 max-h-[calc(100vh-290px)] min-h-[150px] flex flex-col">
                      {agentMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "flex flex-col max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm",
                            msg.role === "user"
                              ? "bg-blue-600 text-white rounded-tr-none self-end text-left"
                              : "bg-white text-gray-800 border border-gray-200 rounded-tl-none self-start text-left"
                          )}
                        >
                          <div className="whitespace-pre-wrap font-sans">
                            {msg.content.split("\n").map((line, lIdx) => {
                              let rendered = line;
                              
                              if (rendered.includes("<UPDATE_RESUME>")) {
                                rendered = rendered.split("<UPDATE_RESUME>")[0] + "\n*(Resume loaded in editor!)*";
                              }
                              if (rendered.includes("</UPDATE_RESUME>")) {
                                return null;
                              }
                              
                              const isBullet = rendered.startsWith("•") || rendered.startsWith("- ") || rendered.startsWith("* ");
                              
                              const parts = rendered.split(/\*\*(.*?)\*\*/g);
                              const element = parts.map((part, pIdx) => {
                                if (pIdx % 2 === 1) {
                                  return <strong key={pIdx} className="font-bold">{part}</strong>;
                                }
                                return part;
                              });

                              return (
                                <div key={lIdx} className={cn(isBullet ? "pl-2 py-0.5" : "py-0.5")}>
                                  {element}
                                </div>
                              );
                            })}
                          </div>
                          {msg.actionExecuted === "updated_resume" && (
                            <div className="mt-2 pt-1.5 border-t border-gray-100 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                              <CheckSquare size={11} />
                              <span>Applied changes to resume editor live!</span>
                            </div>
                          )}
                        </div>
                      ))}
                      {isAgentResponding && (
                        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none p-3 max-w-[85%] self-start flex items-center gap-1.5 text-xs text-gray-500 shadow-sm">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                          <span>Agent Rez is thinking...</span>
                        </div>
                      )}
                    </div>

                    {/* Interactive Interview HUD */}
                    {interviewStep >= 0 ? (
                      <div className="bg-indigo-50 border border-indigo-200/60 rounded-xl p-3 mb-3 shrink-0">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                          <span>🎙️ Guided Interview</span>
                          <span>Step {interviewStep + 1} of 5</span>
                        </div>
                        <div className="w-full bg-indigo-200/55 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full transition-all duration-300"
                            style={{ width: `${((interviewStep + 1) / 5) * 100}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-600 mt-2 leading-relaxed">
                          Provide your details below to feed the AI resume engine.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setInterviewStep(-1);
                            setAgentMessages(prev => [
                              ...prev,
                              { role: "assistant", content: "Interview cancelled. You are now in conversational chat mode! Ask me to edit any parts of your resume or paste career details directly." }
                            ]);
                            toast("Interview cancelled.");
                          }}
                          className="text-[10px] font-bold text-red-600 hover:underline mt-1.5 cursor-pointer block"
                        >
                          Cancel & Switch to General Chat
                        </button>
                      </div>
                    ) : (
                      agentMessages.length <= 1 && (
                        <div className="grid grid-cols-1 gap-2 mb-3 shrink-0">
                          <button
                            type="button"
                            onClick={handleStartInterview}
                            className="p-3 text-left bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 rounded-xl transition-all cursor-pointer shadow-sm group"
                          >
                            <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
                              <Bot size={15} className="animate-pulse text-indigo-600" />
                              <span>🎙️ Start Guided Career Interview</span>
                            </div>
                            <p className="text-[10px] text-gray-600 mt-1 leading-relaxed">
                              We'll ask you 5 quick questions step-by-step and draft a high-impact professional resume automatically.
                            </p>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => {
                              setAgentMessages(prev => [
                                ...prev,
                                { role: "user", content: "Paste my old resume to rebuild" },
                                { role: "assistant", content: "Go ahead and paste your old resume text or unstructured prompt right here in the chat, and I'll analyze it, optimize it using modern ATS keywords, and rebuild it in the editor for you!" }
                              ]);
                            }}
                            className="p-3 text-left bg-white border border-gray-200 hover:border-blue-300 rounded-xl transition-all cursor-pointer shadow-sm group"
                          >
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 group-hover:text-blue-700">
                              <FileText size={15} className="text-gray-500 group-hover:text-blue-500" />
                              <span>📝 Paste Old Resume to Rebuild</span>
                            </div>
                            <p className="text-[10px] text-gray-600 mt-1 leading-relaxed">
                              Analyze, rewrite, and format your outdated resume in seconds using Groq.
                            </p>
                          </button>
                        </div>
                      )
                    )}

                    {/* Chat Input Bar */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendAgentMessage();
                      }}
                      className="flex items-center gap-2 mt-auto shrink-0 pt-2 border-t border-gray-100"
                    >
                      <input
                        type="text"
                        value={agentChatInput}
                        onChange={(e) => setAgentChatInput(e.target.value)}
                        disabled={isAgentResponding}
                        placeholder={
                          interviewStep >= 0
                            ? `Step ${interviewStep + 1} answer...`
                            : "Ask Agent Rez to update your resume..."
                        }
                        className="flex-1 p-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={isAgentResponding || !agentChatInput.trim()}
                        className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-40"
                      >
                        <Send size={14} />
                      </button>
                      {agentMessages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setAgentMessages([
                              {
                                role: "assistant",
                                content: "👋 Hello! I am **Agent Rez**, your personal AI Career Agent. I can build or refine your entire resume in real-time.\n\nChoose an option below to get started:",
                              }
                            ]);
                            setInterviewStep(-1);
                            toast.success("Conversation cleared.");
                          }}
                          title="Reset Conversation"
                          className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors cursor-pointer"
                        >
                          <RefreshCw size={14} />
                        </button>
                      )}
                    </form>
                  </div>
                ) : aiAgentTab === "presets" ? (
                  <div className="flex-1 flex flex-col min-h-0 space-y-3">
                    {/* Category select buttons */}
                    <div className="flex border border-gray-200 rounded-xl p-1 bg-gray-50/50 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setAiPresetType("summary");
                          setAiOutput("");
                        }}
                        className={cn(
                          "flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer",
                          aiPresetType === "summary"
                            ? "bg-white text-blue-600 shadow-sm border border-gray-100"
                            : "text-gray-600 hover:text-gray-800"
                        )}
                      >
                        Summary
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAiPresetType("bullets");
                          setAiOutput("");
                        }}
                        className={cn(
                          "flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer",
                          aiPresetType === "bullets"
                            ? "bg-white text-blue-600 shadow-sm border border-gray-100"
                            : "text-gray-600 hover:text-gray-800"
                        )}
                      >
                        Bullet Points
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAiPresetType("parser");
                          setAiOutput("");
                        }}
                        className={cn(
                          "flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer",
                          aiPresetType === "parser"
                            ? "bg-white text-blue-600 shadow-sm border border-gray-100"
                            : "text-gray-600 hover:text-gray-800"
                        )}
                      >
                        Builder
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAiPresetType("custom");
                          setAiOutput("");
                        }}
                        className={cn(
                          "flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer",
                          aiPresetType === "custom"
                            ? "bg-white text-blue-600 shadow-sm border border-gray-100"
                            : "text-gray-600 hover:text-gray-800"
                        )}
                      >
                        Custom
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAiPresetType("linkedin");
                          setAiOutput("");
                        }}
                        className={cn(
                          "flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer",
                          aiPresetType === "linkedin"
                            ? "bg-white text-blue-600 shadow-sm border border-gray-100"
                            : "text-gray-600 hover:text-gray-800"
                        )}
                      >
                        LinkedIn
                      </button>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (aiPresetType === "parser" || aiPresetType === "linkedin") handleParseResume(aiInput);
                        else handleGenerateAI(e);
                      }}
                      className="shrink-0 flex flex-col space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                          {aiPresetType === "summary" && "Polish Professional Summary"}
                          {aiPresetType === "bullets" && "Optimize Experience Bullet Points"}
                          {aiPresetType === "parser" && "Build Resume from Prompt / Text"}
                          {aiPresetType === "custom" && "Custom AI Prompt / Query"}
                          {aiPresetType === "linkedin" && "Import from LinkedIn"}
                        </label>
                        {aiPresetType === "summary" && (
                          <button
                            type="button"
                            onClick={() => {
                              setAiInput(summary);
                              toast.success("Current summary imported! 📥");
                            }}
                            className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                          >
                            📥 Load current
                          </button>
                        )}
                      </div>

                      {aiPresetType === "parser" && (
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDraggingFile(true);
                          }}
                          onDragLeave={() => setIsDraggingFile(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingFile(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              handleDocumentUpload(e.dataTransfer.files[0]);
                            }
                          }}
                          className={cn(
                            "border-2 border-dashed rounded-xl p-3.5 text-center transition-all cursor-pointer",
                            isDraggingFile
                              ? "border-blue-500 bg-blue-50/50"
                              : "border-gray-200 hover:border-blue-400 bg-white"
                          )}
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = ".pdf,.docx,.txt";
                            input.onchange = (e) => {
                              const files = (e.target as HTMLInputElement).files;
                              if (files && files[0]) {
                                handleDocumentUpload(files[0]);
                              }
                            };
                            input.click();
                          }}
                        >
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <CloudUpload className={cn("h-6 w-6", isDraggingFile ? "text-blue-600 animate-bounce" : "text-gray-400")} />
                            <div>
                              <p className="text-[11px] font-bold text-gray-700">Import PDF, Word, or Text Resume</p>
                              <p className="text-[9px] text-gray-500 mt-0.5">Drag & drop your file, or click to browse</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <textarea
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        required
                        className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none"
                        placeholder={
                          aiPresetType === "summary"
                            ? "Enter your current summary draft, background, or goals."
                            : aiPresetType === "bullets"
                            ? "Paste experience bullet points to rewrite... (using STAR methodology)"
                            : aiPresetType === "parser"
                            ? "Describe your experience, paste an old resume, or provide unstructured notes..."
                            : aiPresetType === "linkedin"
                            ? "Paste your public LinkedIn Profile URL or LinkedIn Data Export JSON..."
                            : "How can the AI assistant help you today? (e.g. 'Suggest some high-demand technical keywords')"
                        }
                        rows={3}
                      />

                      <button
                        type="submit"
                        disabled={aiIsGenerating || !aiInput.trim()}
                        className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl py-2 text-xs font-bold hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {aiIsGenerating ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>{(aiPresetType === "parser" || aiPresetType === "linkedin") ? "Building Resume..." : "Generating suggestions..."}</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} />
                            <span>{(aiPresetType === "parser" || aiPresetType === "linkedin") ? "Build Resume" : "Generate AI suggestions"}</span>
                          </>
                        )}
                      </button>
                    </form>

                    {/* AI Output Result Box with targets list */}
                    <div className="flex-1 flex flex-col min-h-0 bg-gray-50 border border-gray-200 rounded-xl p-3 overflow-hidden">
                      <div className="flex items-center justify-between mb-2 shrink-0">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                          AI Output Suggestions
                        </span>
                        {aiOutput && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(aiOutput);
                              toast.success("Copied to clipboard! 📋");
                            }}
                            className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                            title="Copy to Clipboard"
                          >
                            <Copy size={12} />
                            <span>Copy</span>
                          </button>
                        )}
                      </div>
                      <div className="flex-1 overflow-y-auto text-xs text-gray-800 leading-relaxed font-sans whitespace-pre-wrap select-text pr-1 bg-white border border-gray-100 rounded-lg p-2.5 mb-2.5">
                        {aiIsGenerating ? (
                          <div className="h-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          </div>
                        ) : aiOutput ? (
                          aiOutput
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-center text-gray-600 p-4">
                            <Sparkles size={24} className="opacity-30 mb-2 text-amber-500" />
                            <p className="text-[11px]">Your professional suggestions will appear here.</p>
                          </div>
                        )}
                      </div>

                      {aiOutput && (
                        <div className="shrink-0 border-t border-gray-200 pt-2.5 space-y-2">
                          <span className="block text-[9px] font-bold uppercase tracking-wider text-gray-600">
                            ⚡ Quick Apply to Resume Sections:
                          </span>
                          <div className="grid grid-cols-1 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                            <button
                              onClick={() => handleApplyToTarget("summary")}
                              className="w-full text-left p-1.5 text-[11px] bg-blue-50 border border-blue-200 hover:border-blue-300 hover:bg-blue-100 text-blue-900 font-bold rounded transition-all cursor-pointer"
                            >
                              ✨ Apply to Professional Summary
                            </button>
                            
                            {experiences.length > 0 && (
                              <div className="space-y-1">
                                <span className="block text-[8px] font-bold uppercase tracking-widest text-gray-600 pl-1 mt-1">
                                  Append Bullets to Professional Job:
                                </span>
                                {experiences.map((exp) => (
                                  <button
                                    key={exp.id}
                                    onClick={() => handleApplyToTarget("experience-bullets", exp.id)}
                                    className="w-full text-left p-1.5 text-[11px] bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 font-semibold rounded transition-all truncate block cursor-pointer"
                                    title={`Append as bullet points to ${exp.title}`}
                                  >
                                    + Append to: {exp.title.split("|")[0].trim()}
                                  </button>
                                ))}
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-gray-100">
                              <button
                                onClick={() => handleApplyToTarget("skills-add")}
                                className="text-left p-1.5 text-[9px] bg-gray-100 border border-gray-200 hover:border-gray-300 hover:bg-gray-200 text-gray-700 font-semibold rounded transition-all truncate cursor-pointer"
                              >
                                + Add as Skills Group
                              </button>
                              <button
                                onClick={() => handleApplyToTarget("licenses-add")}
                                className="text-left p-1.5 text-[9px] bg-gray-100 border border-gray-200 hover:border-gray-300 hover:bg-gray-200 text-gray-700 font-semibold rounded transition-all truncate cursor-pointer"
                              >
                                + Add to Certifications
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Cover Letter Panel
                  <div className="flex-1 flex flex-col min-h-0 space-y-3 overflow-y-auto pr-1">
                    <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-3 text-left shrink-0">
                      <h3 className="text-xs font-bold text-amber-800 flex items-center gap-1">
                        <Sparkles size={13} className="animate-pulse" />
                        AI Cover Letter Generator
                      </h3>
                      <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                        Instantly write a personalized, 100% tailored cover letter using the exact achievements, technical skills, and background loaded in your active resume.
                      </p>
                    </div>

                    <form onSubmit={handleGenerateCoverLetter} className="space-y-3 shrink-0">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                          Target Role / Title
                        </label>
                        <input
                          type="text"
                          required
                          value={coverLetterRole}
                          onChange={(e) => setCoverLetterRole(e.target.value)}
                          placeholder="e.g. Senior Frontend Engineer"
                          className="w-full p-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                          Company Name
                        </label>
                        <input
                          type="text"
                          required
                          value={coverLetterCompany}
                          onChange={(e) => setCoverLetterCompany(e.target.value)}
                          placeholder="e.g. Vercel"
                          className="w-full p-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                          Job Description / Target Keywords (Optional)
                        </label>
                        <textarea
                          value={coverLetterJobDesc}
                          onChange={(e) => setCoverLetterJobDesc(e.target.value)}
                          placeholder="Paste details of the role here to auto-align target keywords..."
                          className="w-full p-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white resize-none"
                          rows={3}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={coverLetterIsGenerating}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg py-2 text-xs font-bold hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {coverLetterIsGenerating ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Writing cover letter...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} />
                            <span>Generate Cover Letter</span>
                          </>
                        )}
                      </button>
                    </form>

                    {/* Result Card */}
                    <div className="flex-1 flex flex-col min-h-[160px] bg-gray-50 border border-gray-200 rounded-xl p-3 overflow-hidden">
                      <div className="flex items-center justify-between mb-2 shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                          Tailored Letter Draft
                        </span>
                        {coverLetterOutput && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(coverLetterOutput);
                                toast.success("Copied cover letter to clipboard! 📋");
                              }}
                              className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                              title="Copy to Clipboard"
                            >
                              <Copy size={11} />
                              <span>Copy</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const element = document.createElement("a");
                                const file = new Blob([coverLetterOutput], { type: "text/plain" });
                                element.href = URL.createObjectURL(file);
                                element.download = `Cover_Letter_${coverLetterCompany.replace(/\s+/g, "_")}.txt`;
                                document.body.appendChild(element);
                                element.click();
                                toast.success("Cover letter downloaded! 📥");
                              }}
                              className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                              title="Download Cover Letter"
                            >
                              <Download size={11} />
                              <span>Download</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 overflow-y-auto text-[11px] text-gray-800 leading-relaxed font-mono whitespace-pre-wrap select-text pr-1 bg-white border border-gray-100 rounded-lg p-2.5">
                        {coverLetterIsGenerating ? (
                          <div className="h-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          </div>
                        ) : coverLetterOutput ? (
                          coverLetterOutput
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-4">
                            <FileText size={22} className="opacity-40 mb-1.5" />
                            <p className="text-[10px]">Your matching cover letter will be generated here.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#f3f4f6] pb-16 md:pb-0">
        {/* Top Header */}
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
              MYresume
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
              >
                <Undo size={15} />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                title="Redo (Ctrl+Y)"
              >
                <Redo size={15} />
              </button>
              <div className="w-px h-4 bg-gray-200 mx-0.5 md:mx-1"></div>
              <button
                onClick={handleResetToBlank}
                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors flex items-center justify-center cursor-pointer"
                title="Reset/Clear to Blank Custom Template"
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
                <button onClick={() => setIsTopMenuMinimized(true)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors cursor-pointer" title="Collapse Menu">
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
              title="Take an optional interactive tour of MYresume"
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

        {/* Onboarding Wizard Modal */}
        {showOnboarding && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col md:flex-row border border-gray-100">
              {/* Left visual area */}
              <div className="bg-blue-600 p-8 flex-col justify-between hidden md:flex w-2/5 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                    <Sparkles className="text-white" size={24} />
                  </div>
                  <h3 className="text-white font-bold text-2xl leading-tight mb-3">Build a resume that stands out</h3>
                  <p className="text-blue-100 text-sm mb-6">Join 10,000+ professionals who landed their dream jobs using our AI-powered builder.</p>
                </div>
                
                <div className="space-y-3 relative z-10">
                  <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
                    <Check size={16} className="text-blue-300" /> Free export to PDF
                  </div>
                  <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
                    <Check size={16} className="text-blue-300" /> ATS-friendly templates
                  </div>
                  <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
                    <Check size={16} className="text-blue-300" /> AI writing assistance
                  </div>
                </div>
                
                {/* Decorative background shapes */}
                <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -top-16 -left-16 w-32 h-32 bg-blue-400/20 rounded-full blur-xl"></div>
              </div>
              
              {/* Right content area */}
              <div className="p-6 md:p-8 flex-1 flex flex-col relative">
                <button
                  onClick={() => setShowOnboarding(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors"
                >
                  <X size={18} />
                </button>
                
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Let's get started</h2>
                <p className="text-gray-500 text-sm mb-6">How would you like to build your resume today?</p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      handleLoadPersona("software");
                      setShowOnboarding(false);
                    }}
                    className="w-full group relative flex items-center p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md hover:bg-blue-50/50 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mr-4 group-hover:scale-110 transition-transform">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Start with a Template Example</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Seed with professional Software Engineer data</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      handleResetResume();
                      setShowOnboarding(false);
                    }}
                    className="w-full group relative flex items-center p-4 border border-gray-200 rounded-xl hover:border-gray-400 hover:shadow-md transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0 mr-4 group-hover:scale-110 transition-transform">
                      <Plus size={18} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Start from Scratch</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Build a blank resume customized to you</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      handleLoadPersona("design");
                      setShowOnboarding(false);
                    }}
                    className="w-full group relative flex items-center p-4 border border-gray-200 rounded-xl hover:border-purple-500 hover:shadow-md hover:bg-purple-50/50 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mr-4 group-hover:scale-110 transition-transform">
                      <Palette size={18} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Load Creative Example</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Seed with UX Designer data</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Canvas */}
        <div
          className={cn(
            "flex-1 overflow-y-auto overflow-x-auto px-2 py-4 md:px-4 md:py-10 flex justify-start md:justify-center canvas-wrap",
            layoutClasses,
            printPreviewMode && "print-preview-active"
          )}
          style={pageStyles}
        >
          {/* Zoom & Centering Container */}
          <div
            className="relative flex items-start justify-center transition-all duration-200 mx-auto"
            style={{
              width: `${pageWidthPx * (canvasZoom / 100)}px`,
              height: `${(totalHeightPx + 40) * (canvasZoom / 100)}px`,
              minWidth: `${pageWidthPx * (canvasZoom / 100)}px`,
              minHeight: `${(totalHeightPx + 40) * (canvasZoom / 100)}px`,
              overflow: "visible",
            }}
          >
            <style dangerouslySetInnerHTML={{
              __html: `@media print { @page { size: ${design.pageSize === "letter" ? "letter" : "A4"} portrait; margin: 0; } }`
            }} />
            <div
              ref={resumeRef}
              className={cn(
                "resume-canvas-container relative origin-top transition-all duration-200 flex flex-col items-center gap-8 print:!gap-0 print:!block",
                printPreviewMode && "print-preview-active"
              )}
              style={{
                width: `${pageWidthPx}px`,
                transform: `scale(${canvasZoom / 100})`,
                transformOrigin: "top center",
              }}
            >
              {Array.from({ length: totalPages }).map((_, pageIndex) => {
                const renderSection = (section: any, keyPrefix: string = "", isPrint: boolean = false) => (
                  <SectionRenderer
                    key={`${keyPrefix}${section.id}-page-${pageIndex}`}
                    section={section}
                    isPrint={isPrint}
                    targetPageIndex={pageIndex}
                    idToPageMap={idToPageMap}
                    summary={summary}
                    setSummary={setSummary}
                    licenses={licenses}
                    setLicenses={setLicenses}
                    skills={skills}
                    setSkills={setSkills}
                    experiences={experiences}
                    setExperiences={setExperiences}
                    educations={educations}
                    setEducations={setEducations}
                    projects={projects}
                    setProjects={setProjects}
                    publications={publications}
                    setPublications={setPublications}
                    awards={awards}
                    setAwards={setAwards}
                    sectionHeaders={sectionHeaders}
                    setSectionHeaders={setSectionHeaders}
                    manualBreaks={manualBreaks}
                    setManualBreaks={setManualBreaks}
                    pageBreakElementIds={pageBreakElementIds}
                    spellcheckEnabled={spellcheckEnabled}
                    design={design}
                    gapHeights={gapHeights}
                  />
                );

                return (
                  <div
                    key={`page-${pageIndex}`}
                    data-page-index={pageIndex}
                    className="physical-page-container page relative shadow-[0_10px_35px_rgba(0,0,0,0.12)] border border-gray-200/50 rounded-[4px] page-sheet transition-all duration-300 print:!shadow-none print:!border-none print:!m-0 print:!p-[var(--page-margin-y)_var(--page-margin-x)] print:break-after-page"
                    style={{
                      width: `${pageWidthPx}px`,
                      height: "var(--page-height)",
                      backgroundColor: "var(--paper)",
                      padding: "var(--page-margin-y) var(--page-margin-x)",
                      overflow: "hidden",
                    }}
                  >
                    {/* Visual Margin Alignment Guides (Dashed safe area border) */}
                    {showMarginGuides && !printPreviewMode && (
                      <div
                        className="absolute border border-dashed border-blue-400/35 pointer-events-none no-print transition-all duration-300 rounded"
                        style={{
                          top: "var(--page-margin-y)",
                          left: "var(--page-margin-x)",
                          right: "var(--page-margin-x)",
                          bottom: "var(--page-margin-y)",
                          zIndex: 40,
                        }}
                      >
                        <div className="absolute -top-4 left-0 text-[9px] font-sans font-extrabold tracking-wider text-blue-400/60 select-none uppercase">
                          Print Safe Area (Page {pageIndex + 1})
                        </div>
                      </div>
                    )}

                    {/* Header (Only on designated page, typically page 0) */}
                    {(idToPageMap?.["header"] ?? 0) === pageIndex && (
                      <div
                        className={cn(
                          "header rounded-[var(--radius)] py-6 px-6 mb-[var(--section-gap)] print-avoid-break print:!shadow-none print:!border-none print:!bg-transparent transition-all duration-300",
                          `text-${design.headerAlign}`,
                        )}
                        data-page-break-id="header"
                        style={{
                          backgroundColor: "var(--panel-rgba)",
                          border: "var(--box-border)",
                          boxShadow: "var(--box-shadow)",
                          backdropFilter: "blur(var(--backdrop-blur))",
                          WebkitBackdropFilter: "blur(var(--backdrop-blur))",
                        }}
                      >
                        <div className={cn(
                          "flex gap-4 md:gap-6",
                          design.headerAlign === "center"
                            ? "flex-col text-center justify-center items-center"
                            : "flex-col sm:flex-row text-center sm:text-left justify-start items-center sm:items-start"
                        )}>
                          {profilePhoto.enabled && (
                            <div
                              className={cn(
                                "relative group shrink-0",
                                profilePhoto.animation === "wobble" && "animate-photo-wobble",
                                profilePhoto.animation === "flicker" && "animate-photo-flicker",
                                profilePhoto.animation === "barndoor" && "animate-photo-barndoor",
                                profilePhoto.animation === "circle" && "animate-photo-circle",
                                profilePhoto.animation === "fade" && "animate-photo-fade"
                              )}
                              style={{
                                transform: `translate(${profilePhoto.xOffset}px, ${profilePhoto.yOffset}px)`,
                              }}
                            >
                              <div
                                className="overflow-hidden transition-all duration-300"
                                style={{
                                  width: `${110 * (profilePhoto.scale / 100)}px`,
                                  height: `${110 * (profilePhoto.scale / 100) * (profilePhoto.aspectRatio === "3:4" ? 4/3 : profilePhoto.aspectRatio === "4:3" ? 3/4 : 1)}px`,
                                  borderRadius: `${profilePhoto.radius}%`,
                                  opacity: profilePhoto.opacity / 100,
                                  border: `${profilePhoto.borderWidth}px solid ${profilePhoto.borderColor}`,
                                  boxShadow: "var(--box-shadow)",
                                }}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={profilePhoto.url}
                                  alt="Profile"
                                  className="w-full h-full object-cover select-none pointer-events-none"
                                  style={{
                                    filter: getCSSFilterString(
                                      profilePhoto.filter,
                                      profilePhoto.tone,
                                      profilePhoto.brightness,
                                      profilePhoto.contrast,
                                      profilePhoto.saturation,
                                      profilePhoto.blur,
                                      profilePhoto.hueRotate,
                                      profilePhoto.sepia
                                    ),
                                  }}
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              {/* Hover Click overlay */}
                              <button
                                onClick={() => setActiveSidebarTab("photo")}
                                className="absolute inset-0 bg-black/40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-bold font-sans no-print"
                                style={{ borderRadius: `${profilePhoto.radius}%` }}
                              >
                                Edit
                              </button>
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <ContentEditableField tagName="div"
                              className="name font-[family:var(--font-heading)] font-bold text-3xl text-[var(--ink)] m-0 mb-1.5 tracking-wide outline-none"
                              html={name} onChange={(val) => { setName(val); }}
                              spellCheck={spellcheckEnabled}
                            />
                            <ContentEditableField tagName="div"
                              className="contact-line font-[family:var(--font-body)] italic text-sm text-[var(--ink-soft)] outline-none"
                              html={contactLine} onChange={(val) => { setContactLine(val); }}
                              spellCheck={spellcheckEnabled}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sections */}
                    <div className="block print:hidden w-full">
                      {design.layout === "sidebar" ? (
                        <div className="flex w-full gap-[1.1rem] items-start">
                          <div data-column="sidebar" className="w-[var(--sidebar-w)] shrink-0 flex flex-col">
                            <Reorder.Group
                              values={sections.filter((s: any) => ["licenses", "skills", "education"].includes(s.id))}
                              onReorder={(newOrder) => {
                                const mainSecs = sections.filter((s: any) => !["licenses", "skills", "education"].includes(s.id));
                                setSections([...newOrder, ...mainSecs]);
                              }}
                              id={`sections-sidebar-${pageIndex}`}
                              className="w-full flex flex-col"
                            >
                              {sections
                                .filter((s: any) => ["licenses", "skills", "education"].includes(s.id))
                                .map((s: any) => renderSection(s, "screen-sidebar-"))}
                            </Reorder.Group>
                          </div>
                          <div data-column="main" className="flex-1 flex flex-col min-w-0">
                            <Reorder.Group
                              values={sections.filter((s: any) => !["licenses", "skills", "education"].includes(s.id))}
                              onReorder={(newOrder) => {
                                const sidebarSecs = sections.filter((s: any) => ["licenses", "skills", "education"].includes(s.id));
                                setSections([...sidebarSecs, ...newOrder]);
                              }}
                              id={`sections-main-${pageIndex}`}
                              className="w-full flex flex-col"
                            >
                              {sections
                                .filter((s: any) => !["licenses", "skills", "education"].includes(s.id))
                                .map((s: any) => renderSection(s, "screen-main-"))}
                            </Reorder.Group>
                          </div>
                        </div>
                      ) : (
                        <Reorder.Group
                          values={sections}
                          onReorder={setSections}
                          id={`sections-container-${pageIndex}`}
                          className="w-full"
                        >
                          {sections.map((section: any) => renderSection(section))}
                        </Reorder.Group>
                      )}
                    </div>
                    
                    <div className="hidden print:block w-full">
                      {design.layout === "sidebar" ? (
                        <div className="flex w-full gap-[1.1rem] items-start">
                          <div className="w-[var(--sidebar-w)] shrink-0 flex flex-col">
                            {sections
                              .filter((s: any) => ["licenses", "skills", "education"].includes(s.id))
                              .map((s: any) => renderSection(s, "print-", true))}
                          </div>
                          <div className="flex-1 flex flex-col min-w-0">
                            {sections
                              .filter((s: any) => !["licenses", "skills", "education"].includes(s.id))
                              .map((s: any) => renderSection(s, "print-", true))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col w-full">
                          {sections.map((s: any) => renderSection(s, "print-", true))}
                        </div>
                      )}
                    </div>

                    {pageIndex === totalPages - 1 && (
                      <ContentEditableField tagName="div"
                        className="page-footer text-center font-sans text-[11px] text-[#a19b9d] mt-4 outline-none"
                        html={footer} onChange={(val) => { setFooter(val); }}
                        spellCheck={spellcheckEnabled}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Floating Canvas Controls (Zoom & Print Preview) */}
        <motion.div drag dragMomentum={false} className={cn(
          "absolute bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex items-center bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg no-print transition-all duration-300 group cursor-grab active:cursor-grabbing",
          isFormatBarMinimized ? "p-2 rounded-full hover:bg-gray-50 opacity-80 hover:opacity-100" : "gap-1.5 md:gap-2 p-1.5 rounded-xl"
        )}>
          {isFormatBarMinimized ? (
            <div onClick={() => setIsFormatBarMinimized(false)} className="flex items-center justify-center w-6 h-6" title="Show Formatting Tools">
              <Settings2 size={18} className="text-gray-500" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-0.5 border-r border-gray-100 pr-1.5 md:pr-2">
                <button
                  type="button"
                  onClick={() => setCanvasZoom(prev => Math.max(50, prev - 10))}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 active:scale-90 transition-all cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setCanvasZoom(100)}
                  className="px-2 py-0.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                  title="Reset Zoom to 100%"
                >
                  {canvasZoom}%
                </button>
                <button
                  type="button"
                  onClick={() => setCanvasZoom(prev => Math.min(150, prev + 10))}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 active:scale-90 transition-all cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleFitWidth}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1 cursor-pointer text-xs font-semibold px-1.5"
                title="Auto-Fit Page Width"
              >
                <Maximize2 size={14} />
                <span className="hidden sm:inline">Fit Width</span>
              </button>

              <div className="w-px h-5 bg-gray-200" />

              {/* Alignment Guides Toggle */}
              <div className="flex items-center gap-2 pl-1" title="Toggle printable margin guidelines">
                <span className="text-[11px] font-bold text-gray-500 hidden sm:inline font-sans">Guides</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowMarginGuides(!showMarginGuides);
                    toast.success(!showMarginGuides ? "Alignment guides active! 👁️" : "Alignment guides hidden! 🙈");
                  }}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    showMarginGuides ? "bg-blue-600" : "bg-gray-200"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      showMarginGuides ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              <div className="w-px h-5 bg-gray-200" />

              {/* Elegant Toggle Switch for Print Preview */}
              <div className="flex items-center gap-2 pl-1">
                <span className="text-[11px] font-bold text-gray-500 hidden sm:inline">Print Preview</span>
                <button
                  type="button"
                  onClick={() => {
                    setPrintPreviewMode(!printPreviewMode);
                    toast.success(!printPreviewMode ? "Print Preview Enabled! 👁️" : "Print Preview Disabled! ✍️");
                  }}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    printPreviewMode ? "bg-blue-600" : "bg-gray-200"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      printPreviewMode ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              <div className="w-px h-5 bg-gray-200" />
              <button
                type="button"
                onClick={() => setShareModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
              >
                <Share2 size={13} />
                <span className="hidden sm:inline">Share</span>
              </button>

              <div className="w-px h-5 bg-gray-200" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsFormatBarMinimized(true); }}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors cursor-pointer"
                title="Minimize Toolbar"
              >
                <ChevronRight size={14} />
              </button>
            </>
          )}
        </motion.div>

        {/* Mobile Bottom Navigation Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-40 md:hidden flex items-center justify-around px-2 no-print shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
          <button
            type="button"
            onClick={() => setActiveSidebarTab(activeSidebarTab === "templates" ? null : "templates")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all rounded-xl cursor-pointer",
              activeSidebarTab === "templates" ? "text-blue-600 font-bold scale-105" : "text-gray-500 font-medium hover:text-gray-900"
            )}
          >
            <FileText size={18} />
            <span className="text-[10px]">Templates</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSidebarTab(activeSidebarTab === "design" ? null : "design")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all rounded-xl cursor-pointer",
              activeSidebarTab === "design" ? "text-blue-600 font-bold scale-105" : "text-gray-500 font-medium hover:text-gray-900"
            )}
          >
            <Palette size={18} />
            <span className="text-[10px]">Design</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSidebarTab(activeSidebarTab === "content" ? null : "content")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all rounded-xl cursor-pointer",
              activeSidebarTab === "content" ? "text-blue-600 font-bold scale-105" : "text-gray-500 font-medium hover:text-gray-900"
            )}
          >
            <Plus size={18} />
            <span className="text-[10px]">Add Sections</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSidebarTab(activeSidebarTab === "ai" ? null : "ai")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all rounded-xl cursor-pointer relative",
              activeSidebarTab === "ai" ? "text-blue-600 font-bold scale-105" : "text-gray-500 font-medium hover:text-gray-900"
            )}
          >
            <Sparkles size={18} className={cn(activeSidebarTab === "ai" ? "text-blue-600" : "text-amber-500 animate-pulse")} />
            <span className="text-[10px]">AI Tools</span>
            {activeSidebarTab !== "ai" && (
              <span className="absolute top-1.5 right-6 w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
            )}
          </button>
        </div>
      </div>

      {/* Manual Touch Up Eraser Modal */}
      {eraseModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex flex-col items-center justify-center p-4 font-sans no-print backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 text-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Eraser className="text-[#00f0ff] animate-pulse" size={18} />
                <h3 className="font-bold text-lg">Erase & Touch Up Brush</h3>
              </div>
              <button onClick={() => setEraseModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            {/* Workspace */}
            <div className="flex-1 bg-black/50 p-6 flex flex-col items-center justify-center min-h-[350px]">
              <p className="text-xs text-neutral-400 mb-4 flex items-center gap-1">
                <span className="text-[#00f0ff] font-bold">💡 Tip:</span> Click and drag directly on the image below to erase backgrounds or unwanted objects manually.
              </p>
              <div className="relative border-2 border-dashed border-neutral-700/50 rounded-xl p-2 bg-neutral-950 flex items-center justify-center">
                <canvas
                  ref={eraserCanvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="cursor-crosshair max-w-full max-h-[400px] object-contain rounded-lg"
                />
              </div>
            </div>
            
            {/* Controls */}
            <div className="px-6 py-4 bg-neutral-950 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                <span className="text-xs text-neutral-300 font-medium whitespace-nowrap">Brush Size: {brushSize}px</span>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="accent-[#00f0ff] flex-1"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={resetEraserCanvas}
                  className="px-4 py-2 text-xs font-semibold border border-neutral-700 rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  Reset Original
                </button>
                <button
                  onClick={saveErasedImage}
                  className="px-5 py-2 text-xs font-bold bg-[#00f0ff] text-neutral-950 rounded-lg hover:bg-[#33f5ff] transition-colors flex items-center gap-1.5"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
