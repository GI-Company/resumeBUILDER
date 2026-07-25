import React, { memo } from "react";
import { cn } from "@/lib/utils";
import { ContentEditableField } from "../ContentEditableField";
import { Reorder } from "framer-motion";
import { GripVertical, Plus, Eraser } from "lucide-react";

import { PageBreakGap } from "../resume/PageBreakGap";
import { DragHandle } from "../resume/DragHandle";
import { SubItemWrapper } from "../resume/SubItemWrapper";
import { SectionWrapper } from "../resume/SectionWrapper";
import { ArrowUp, ArrowDown, X } from "lucide-react";

const SafeReorderGroup = ({ isPrint, as: Component = "div", children, ...props }: any) => {
  if (isPrint) {
    const { values, onReorder, ...rest } = props;
    return <Component {...rest}>{children}</Component>;
  }
  return <Reorder.Group as={Component as any} {...props}>{children}</Reorder.Group>;
};

const stripHtml = (htmlString?: string) => {
  if (!htmlString) return "";
  return htmlString.replace(/<[^>]*>?/gm, "").trim();
};


export const SectionRenderer = memo(({
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

  const moveItemUp = (arr: any[], index: number) => {
    if (index <= 0) return arr;
    const newArr = [...arr];
    [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
    return newArr;
  };

  const moveItemDown = (arr: any[], index: number) => {
    if (index >= arr.length - 1) return arr;
    const newArr = [...arr];
    [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
    return newArr;
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
                        className="summary font-[family:var(--font-body)] italic text-sm text-[var(--ink-soft)] leading-[var(--line-height)] rounded-[var(--radius)] p-4 md:p-5 mb-[var(--section-gap)] outline-none transition-all duration-300"
                        data-page-break-id="summary-content"
                        style={{
                          backgroundColor: "var(--panel-rgba)",
                          border: "var(--box-border)",
                          boxShadow: "var(--box-shadow)",
                          backdropFilter: "blur(var(--backdrop-blur))",
                          WebkitBackdropFilter: "blur(var(--backdrop-blur))",
                        }}
                        html={summary} onChange={(val: string) => { setSummary(val); }}
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
                        className="bullet-list m-0 p-4 md:p-5 pl-9 rounded-[var(--radius)] mb-[var(--section-gap)] transition-all duration-300"
                        id="lic-list"
                        data-page-break-id="lic-list"
                        style={{
                          backgroundColor: "var(--panel-rgba)",
                          border: "var(--box-border)",
                          boxShadow: "var(--box-shadow)",
                          backdropFilter: "blur(var(--backdrop-blur))",
                          WebkitBackdropFilter: "blur(var(--backdrop-blur))",
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
                                html={lic.text} onChange={(val: string) => { setLicenses((prev: any[]) =>
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
                        className={`skills-grid flex flex-wrap gap-y-3 rounded-[var(--radius)] mb-[var(--section-gap)] transition-all duration-300 ${
                          design.layout === "sidebar"
                            ? "gap-x-0 p-3 [&>*]:w-full"
                            : "gap-x-6 p-5 [&>*]:w-full [&>*]:md:w-[calc(50%-12px)]"
                        }`}
                        id="skills-grid"
                        data-page-break-id="skills-grid"
                        style={{
                          backgroundColor: "var(--panel-rgba)",
                          border: "var(--box-border)",
                          boxShadow: "var(--box-shadow)",
                          backdropFilter: "blur(var(--backdrop-blur))",
                          WebkitBackdropFilter: "blur(var(--backdrop-blur))",
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
                                html={sk.title} onChange={(val: string) => { setSkills((prev: any[]) =>
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
                                  html={sk.items} onChange={(val: string) => { setSkills((prev: any[]) =>
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
                              
                              className="exp-entry relative rounded-[var(--radius)] p-4 md:p-5 mb-[var(--section-gap)] pl-9 group transition-all duration-300"
                              data-page-break-id={isContinuation ? undefined : `exp-${exp.id}`}
                              style={{
                                display: targetPageIndex !== undefined && !isContinuation && jobHeaderPage !== targetPageIndex ? "none" : undefined,
                                backgroundColor: "var(--panel-rgba)",
                                border: "var(--box-border)",
                                boxShadow: "var(--box-shadow)",
                                backdropFilter: "blur(var(--backdrop-blur))",
                                WebkitBackdropFilter: "blur(var(--backdrop-blur))",
                              }}
                            >
{(dc: any) => (<>
                              <PageBreakGap id={`exp-${exp.id}`} pageBreakElementIds={pageBreakElementIds} gapHeights={gapHeights} pageMargin={design.pageMargin} pageMarginX={design.pageMarginLeftRight ?? design.pageMargin} pageMarginY={design.pageMarginTopBottom ?? design.pageMargin} disabled={targetPageIndex !== undefined} />

                              <div className="absolute left-2 top-4 no-print">
                                <DragHandle dragControls={dc} />
                              </div>
                              <div className="absolute top-2 right-2 md:top-3 md:right-3 flex items-center gap-1 opacity-50 hover:opacity-100 hidden group-hover:flex no-print">
                                <button
                                  onClick={() => {
                                    const idx = experiences.findIndex((x: any) => x.id === exp.id);
                                    if (idx > -1) setExperiences(moveItemUp(experiences, idx));
                                  }}
                                  className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-800"
                                  title="Move Up"
                                >
                                  <ArrowUp size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    const idx = experiences.findIndex((x: any) => x.id === exp.id);
                                    if (idx > -1) setExperiences(moveItemDown(experiences, idx));
                                  }}
                                  className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-800"
                                  title="Move Down"
                                >
                                  <ArrowDown size={14} />
                                </button>
                                <button
                                  onClick={() =>
                                    setExperiences((e: any[]) =>
                                      e.filter((x) => x.id !== exp.id),
                                    )
                                  }
                                  className="p-1 rounded hover:bg-red-100 text-[var(--danger)] text-[11px] font-bold cursor-pointer font-sans flex items-center gap-1"
                                >
                                  <X size={12} /> remove
                                </button>
                              </div>
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
                                  html={exp.title} onChange={(val: string) => { setExperiences((prev: any[]) =>
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
                                  html={exp.date} onChange={(val: string) => { setExperiences((prev: any[]) =>
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
                                    }}
                                  >
                                    <PageBreakGap id={`bullet-${b.id}`} pageBreakElementIds={pageBreakElementIds} gapHeights={gapHeights} pageMargin={design.pageMargin} pageMarginX={design.pageMarginLeftRight ?? design.pageMargin} pageMarginY={design.pageMarginTopBottom ?? design.pageMargin} disabled={targetPageIndex !== undefined} />
                                    <ContentEditableField tagName="span"
                                      className="font-[family:var(--font-body)] italic text-sm text-[var(--ink-soft)] leading-[var(--line-height)] block outline-none"
                                      html={b.text} onChange={(val: string) => { setExperiences((prev: any[]) =>
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
                                    <div className="hidden group-hover/bullet:flex absolute -left-14 top-0.5 items-center gap-0.5 no-print bg-white/80 rounded px-0.5 py-0.5 shadow-sm border border-gray-100">
                                      <button
                                        onClick={() =>
                                          setExperiences((e: any[]) =>
                                            e.map((x) =>
                                              x.id === exp.id
                                                ? {
                                                    ...x,
                                                    bullets: moveItemUp(x.bullets, x.bullets.findIndex((y: any) => y.id === b.id)),
                                                  }
                                                : x,
                                            ),
                                          )
                                        }
                                        className="text-gray-400 hover:text-gray-700 cursor-pointer p-0.5 rounded hover:bg-gray-200"
                                        title="Move Up"
                                      >
                                        <ArrowUp size={11} />
                                      </button>
                                      <button
                                        onClick={() =>
                                          setExperiences((e: any[]) =>
                                            e.map((x) =>
                                              x.id === exp.id
                                                ? {
                                                    ...x,
                                                    bullets: moveItemDown(x.bullets, x.bullets.findIndex((y: any) => y.id === b.id)),
                                                  }
                                                : x,
                                            ),
                                          )
                                        }
                                        className="text-gray-400 hover:text-gray-700 cursor-pointer p-0.5 rounded hover:bg-gray-200"
                                        title="Move Down"
                                      >
                                        <ArrowDown size={11} />
                                      </button>
                                      <button
                                        className="text-[var(--danger)] text-[11px] font-bold cursor-pointer font-sans p-0.5 ml-0.5 hover:bg-red-50 rounded"
                                        title="Remove"
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
                                    </div>
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
                                              {
                                                id: Date.now().toString(),
                                                text: "New bullet",
                                              },
                                              ...x.bullets,
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
                                  }}
                                >
                                  <PageBreakGap id={`meta-${exp.id}`} pageBreakElementIds={pageBreakElementIds} gapHeights={gapHeights} pageMargin={design.pageMargin} pageMarginX={design.pageMarginLeftRight ?? design.pageMargin} pageMarginY={design.pageMarginTopBottom ?? design.pageMargin} disabled={targetPageIndex !== undefined} />
                                  <ContentEditableField tagName="div"
                                    className="exp-meta mt-3 pt-2 border-t border-[var(--hairline)] font-sans text-xs text-[var(--ink-soft)] font-medium leading-relaxed outline-none"
                                    html={exp.meta} onChange={(val: string) => { setExperiences((prev: any[]) =>
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
                              
                              className="edu-entry relative rounded-[var(--radius)] p-4 md:p-5 mb-2 pl-9 group transition-all duration-300"
                              data-page-break-id={isContinuation ? undefined : `edu-${edu.id}`}
                              style={{
                                display: targetPageIndex !== undefined && !isContinuation && eduHeaderPage !== targetPageIndex ? "none" : undefined,
                                backgroundColor: "var(--panel-rgba)",
                                border: "var(--box-border)",
                                boxShadow: "var(--box-shadow)",
                                backdropFilter: "blur(var(--backdrop-blur))",
                                WebkitBackdropFilter: "blur(var(--backdrop-blur))",
                              }}
                            >
{(dc: any) => (<>
                              <PageBreakGap id={`edu-${edu.id}`} pageBreakElementIds={pageBreakElementIds} gapHeights={gapHeights} pageMargin={design.pageMargin} pageMarginX={design.pageMarginLeftRight ?? design.pageMargin} pageMarginY={design.pageMarginTopBottom ?? design.pageMargin} disabled={targetPageIndex !== undefined} />

                              <div className="absolute left-2 top-4 no-print">
                                <DragHandle dragControls={dc} />
                              </div>
                              <div className="absolute top-2 right-2 md:top-3 md:right-3 flex items-center gap-1 opacity-50 hover:opacity-100 hidden group-hover:flex no-print">
                                <button
                                  onClick={() => {
                                    const idx = educations.findIndex((x: any) => x.id === edu.id);
                                    if (idx > -1) setEducations(moveItemUp(educations, idx));
                                  }}
                                  className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-800"
                                  title="Move Up"
                                >
                                  <ArrowUp size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    const idx = educations.findIndex((x: any) => x.id === edu.id);
                                    if (idx > -1) setEducations(moveItemDown(educations, idx));
                                  }}
                                  className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-800"
                                  title="Move Down"
                                >
                                  <ArrowDown size={14} />
                                </button>
                                <button
                                  onClick={() =>
                                    setEducations((e: any[]) =>
                                      e.filter((x) => x.id !== edu.id),
                                    )
                                  }
                                  className="p-1 rounded hover:bg-red-100 text-[var(--danger)] text-[11px] font-bold cursor-pointer font-sans flex items-center gap-1"
                                >
                                  <X size={12} /> remove
                                </button>
                              </div>
                              {isContinuation ? (
                                <div className="edu-header mb-2 pb-1 border-b border-gray-200/60 flex justify-between items-baseline">
                                  <span className="font-[family:var(--font-heading)] font-bold text-base text-[var(--ink)]">
                                    {stripHtml(edu.degree)} <span className="text-xs font-normal text-gray-500 italic">(Continued)</span>
                                  </span>
                                </div>
                              ) : (
                              <ContentEditableField tagName="div"
                                className="edu-degree font-[family:var(--font-heading)] font-bold text-base text-[var(--ink)] outline-none"
                                html={edu.degree} onChange={(val: string) => { setEducations((prev: any[]) =>
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
                                    }}
                                  >
                                    <PageBreakGap id={`edu-bullet-${b.id}`} pageBreakElementIds={pageBreakElementIds} gapHeights={gapHeights} pageMargin={design.pageMargin} pageMarginX={design.pageMarginLeftRight ?? design.pageMargin} pageMarginY={design.pageMarginTopBottom ?? design.pageMargin} disabled={targetPageIndex !== undefined} />
                                    <ContentEditableField tagName="span"
                                      className="font-[family:var(--font-body)] italic text-sm text-[var(--ink-soft)] leading-[var(--line-height)] block outline-none"
                                      html={b.text} onChange={(val: string) => { setEducations((prev: any[]) =>
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
                                    <div className="hidden group-hover/bullet:flex absolute -left-14 top-0.5 items-center gap-0.5 no-print bg-white/80 rounded px-0.5 py-0.5 shadow-sm border border-gray-100">
                                      <button
                                        onClick={() =>
                                          setEducations((e: any[]) =>
                                            e.map((x) =>
                                              x.id === edu.id
                                                ? {
                                                    ...x,
                                                    bullets: moveItemUp(x.bullets, x.bullets.findIndex((y: any) => y.id === b.id)),
                                                  }
                                                : x,
                                            ),
                                          )
                                        }
                                        className="text-gray-400 hover:text-gray-700 cursor-pointer p-0.5 rounded hover:bg-gray-200"
                                        title="Move Up"
                                      >
                                        <ArrowUp size={11} />
                                      </button>
                                      <button
                                        onClick={() =>
                                          setEducations((e: any[]) =>
                                            e.map((x) =>
                                              x.id === edu.id
                                                ? {
                                                    ...x,
                                                    bullets: moveItemDown(x.bullets, x.bullets.findIndex((y: any) => y.id === b.id)),
                                                  }
                                                : x,
                                            ),
                                          )
                                        }
                                        className="text-gray-400 hover:text-gray-700 cursor-pointer p-0.5 rounded hover:bg-gray-200"
                                        title="Move Down"
                                      >
                                        <ArrowDown size={11} />
                                      </button>
                                      <button
                                        className="text-[var(--danger)] text-[11px] font-bold cursor-pointer font-sans p-0.5 ml-0.5 hover:bg-red-50 rounded"
                                        title="Remove"
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
                                    </div>
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
                                              {
                                                id: Date.now().toString(),
                                                text: "New bullet",
                                              },
                                              ...x.bullets,
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
                              className="proj-entry relative rounded-[var(--radius)] p-4 md:p-5 mb-2 pl-9 group transition-all duration-300"
                              data-page-break-id={isContinuation ? undefined : `proj-${proj.id}`}
                              style={{
                                backgroundColor: "var(--panel-rgba)",
                                border: "var(--box-border)",
                                boxShadow: "var(--box-shadow)",
                                backdropFilter: "blur(var(--backdrop-blur))",
                                WebkitBackdropFilter: "blur(var(--backdrop-blur))",
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
                                  html={proj.title} onChange={(val: string) => { setProjects((prev: any[]) =>
                                      prev.map((x) =>
                                        x.id === proj.id ? { ...x, title: val } : x,
                                      ),
                                    ); }}
                                  spellCheck={spellcheckEnabled}
                                />
                                <ContentEditableField tagName="div"
                                  className="proj-date font-mono text-xs text-[var(--ink-soft)] font-medium no-print md:print:block"
                                  html={proj.date} onChange={(val: string) => { setProjects((prev: any[]) =>
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
                                    }}
                                  >
                                    <PageBreakGap id={`proj-bullet-${b.id}`} pageBreakElementIds={pageBreakElementIds} gapHeights={gapHeights} pageMargin={design.pageMargin} pageMarginX={design.pageMarginLeftRight ?? design.pageMargin} pageMarginY={design.pageMarginTopBottom ?? design.pageMargin} disabled={targetPageIndex !== undefined} />
                                    <ContentEditableField tagName="span"
                                      className="font-[family:var(--font-body)] text-sm text-[var(--ink-soft)] leading-[var(--line-height)] block outline-none"
                                      html={b.text} onChange={(val: string) => { setProjects((prev: any[]) =>
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
                      className="bullet-list m-0 p-4 md:p-5 pl-9 rounded-[var(--radius)] mb-[var(--section-gap)] transition-all duration-300"
                      id="pub-list"
                      data-page-break-id="pub-list"
                      style={{
                        backgroundColor: "var(--panel-rgba)",
                        border: "var(--box-border)",
                        boxShadow: "var(--box-shadow)",
                        backdropFilter: "blur(var(--backdrop-blur))",
                        WebkitBackdropFilter: "blur(var(--backdrop-blur))",
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
                              html={pub.text} onChange={(val: string) => { setPublications((prev: any[]) =>
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
                      className="bullet-list m-0 p-4 md:p-5 pl-9 rounded-[var(--radius)] mb-[var(--section-gap)] transition-all duration-300"
                      id="award-list"
                      data-page-break-id="award-list"
                      style={{
                        backgroundColor: "var(--panel-rgba)",
                        border: "var(--box-border)",
                        boxShadow: "var(--box-shadow)",
                        backdropFilter: "blur(var(--backdrop-blur))",
                        WebkitBackdropFilter: "blur(var(--backdrop-blur))",
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
                              html={aw.text} onChange={(val: string) => { setAwards((prev: any[]) =>
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
