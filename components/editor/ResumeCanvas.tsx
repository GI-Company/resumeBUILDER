import React from "react";
import { cn } from "@/lib/utils";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { useShallow } from 'zustand/react/shallow';
import { ContentEditableField } from "../ContentEditableField";
import { Reorder } from "framer-motion";
import { SectionRenderer } from "./SectionRenderers";
import { LayoutRebalancer } from "@/lib/agent-rez";
import { Ruler } from "lucide-react"; // Changed from motion/react
 // Wait, where is getCSSFilterString? Let's check!

interface ResumeCanvasProps {
  resumeRef: React.RefObject<HTMLDivElement | null>;
  layoutClasses: string;
  pageStyles: any;
  canvasZoom: number;
  pageWidthPx: number;
  totalHeightPx: number;
  totalPages: number;
  idToPageMap: Record<string, number>;
    showMarginGuides: boolean;
  spellcheckEnabled: boolean;
}


export const getCSSFilterString = (
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
  } else if (filter === "vintage") {
    f += "sepia(0.6) contrast(1.1) brightness(0.9) hue-rotate(-15deg) ";
  } else if (filter === "bw-high") {
    f += "grayscale(1) contrast(1.5) brightness(1.1) ";
  } else if (filter === "bw-soft") {
    f += "grayscale(1) contrast(0.9) brightness(1.05) ";
  } else if (filter === "fade") {
    f += "contrast(0.85) brightness(1.1) saturate(0.8) ";
  } else if (filter === "cyberpunk") {
    f += "contrast(1.2) saturate(1.5) hue-rotate(45deg) brightness(0.9) ";
  }
  if (tone === "warm") f += "sepia(0.3) hue-rotate(-10deg) ";
  else if (tone === "cool") f += "hue-rotate(15deg) saturate(0.9) ";
  else if (tone === "dramatic") f += "contrast(1.25) saturate(0.85) ";
  if (brightness !== 100) f += `brightness(${brightness / 100}) `;
  if (contrast !== 100) f += `contrast(${contrast / 100}) `;
  if (saturation !== 100) f += `saturate(${saturation / 100}) `;
  if (blurVal > 0) f += `blur(${blurVal}px) `;
  if (hueRotateVal !== 0) f += `hue-rotate(${hueRotateVal}deg) `;
  if (sepiaVal > 0) f += `sepia(${sepiaVal / 100}) `;
  return f.trim();
};

export default function ResumeCanvas({
  resumeRef,
  layoutClasses,
  pageStyles,
  canvasZoom,
  pageWidthPx,
  totalHeightPx,
  totalPages,
  idToPageMap,
  showMarginGuides,
  spellcheckEnabled
}: ResumeCanvasProps) {
  const store = useResumeStore(useShallow(state => ({
    printPreviewMode: state.printPreviewMode,
    design: state.design,
    profilePhoto: state.profilePhoto,
    sections: state.sections,
    name: state.name,
    contactLine: state.contactLine,
    footer: state.footer,
    activeSidebarTab: state.activeSidebarTab,
    summary: state.summary,
    licenses: state.licenses,
    skills: state.skills,
    experiences: state.experiences,
    educations: state.educations,
    projects: state.projects,
    publications: state.publications,
    awards: state.awards,
    sectionHeaders: state.sectionHeaders,
    manualBreaks: state.manualBreaks,
    pageBreakElementIds: state.pageBreakElementIds,
    gapHeights: state.gapHeights,
    showHeatmapOverlay: state.showHeatmapOverlay,
    updateDocument: state.updateDocument,
    updateUI: state.updateUI
  })));
  
  const { 
    printPreviewMode, design, profilePhoto, sections, name, contactLine, footer, activeSidebarTab,
    summary, licenses, skills, experiences, educations, projects, publications, awards, sectionHeaders, manualBreaks, pageBreakElementIds, gapHeights, showHeatmapOverlay
  } = store;

  
  const updateDoc = store.updateDocument;
  const updateUI = store.updateUI;
  
  const setSections = (v: any) => updateDoc({ sections: typeof v === "function" ? v(useResumeStore.getState().sections) : v });
  const setName = (v: any) => updateDoc({ name: typeof v === "function" ? v(useResumeStore.getState().name) : v });
  const setContactLine = (v: any) => updateDoc({ contactLine: typeof v === "function" ? v(useResumeStore.getState().contactLine) : v });
  const setFooter = (v: any) => updateDoc({ footer: typeof v === "function" ? v(useResumeStore.getState().footer) : v });
  
  const setSummary = (v: any) => updateDoc({ summary: typeof v === "function" ? v(useResumeStore.getState().summary) : v });
  const setLicenses = (v: any) => updateDoc({ licenses: typeof v === "function" ? v(useResumeStore.getState().licenses) : v });
  const setSkills = (v: any) => updateDoc({ skills: typeof v === "function" ? v(useResumeStore.getState().skills) : v });
  const setExperiences = (v: any) => updateDoc({ experiences: typeof v === "function" ? v(useResumeStore.getState().experiences) : v });
  const setEducations = (v: any) => updateDoc({ educations: typeof v === "function" ? v(useResumeStore.getState().educations) : v });
  const setProjects = (v: any) => updateDoc({ projects: typeof v === "function" ? v(useResumeStore.getState().projects) : v });
  const setPublications = (v: any) => updateDoc({ publications: typeof v === "function" ? v(useResumeStore.getState().publications) : v });
  const setAwards = (v: any) => updateDoc({ awards: typeof v === "function" ? v(useResumeStore.getState().awards) : v });
  const setSectionHeaders = (v: any) => updateDoc({ sectionHeaders: typeof v === "function" ? v(useResumeStore.getState().sectionHeaders) : v });
  const setManualBreaks = (v: any) => updateDoc({ manualBreaks: typeof v === "function" ? v(useResumeStore.getState().manualBreaks) : v });
  
  const setActiveSidebarTab = (v: any) => updateUI({ activeSidebarTab: typeof v === "function" ? v(useResumeStore.getState().activeSidebarTab) : v });


  // Auto-balance Layout
  const contentVolume = React.useMemo(() => {
    let vol = 0;
    vol += (name || "").length;
    vol += (contactLine || "").length;
    vol += (summary || "").length;
    experiences?.forEach((e: any) => {
      vol += (e.title || "").length + (e.meta || "").length;
      e.bullets?.forEach((b: any) => vol += (b.text || "").length);
    });
    educations?.forEach((e: any) => {
      vol += (e.degree || "").length;
      e.bullets?.forEach((b: any) => vol += (b.text || "").length);
    });
    return vol;
  }, [name, contactLine, summary, experiences, educations]);

  const optimalLayout = React.useMemo(() => {
    if (!design.autoBalanceLayout) return null;
    return LayoutRebalancer.calculateOptimalLayout(contentVolume, totalHeightPx || 1056);
  }, [design.autoBalanceLayout, contentVolume, totalHeightPx]);

  const appliedLineHeight = optimalLayout ? optimalLayout.lineHeight : design.lineHeight;
  const appliedSectionSpacing = optimalLayout ? optimalLayout.sectionSpacing : design.gap;

  return (
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
                layoutClasses,
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

                const hasHeaderOnPage = (idToPageMap?.["header"] ?? 0) === pageIndex;
                const sidebarSecs = sections.filter((s: any) => ["licenses", "skills"].includes(s.id));
                const mainSecs = sections.filter((s: any) => !["licenses", "skills"].includes(s.id));

                const isSidebarSecOnPage = (s: any) => {
                  const hp = idToPageMap?.[`heading-${s.id}`];
                  if (s.id === "licenses") return (idToPageMap?.["lic-list"] ?? hp ?? 0) === pageIndex;
                  if (s.id === "skills") return (idToPageMap?.["skills-grid"] ?? hp ?? 0) === pageIndex;
                

  return (hp ?? 0) === pageIndex;
                };

                const isMainSecOnPage = (s: any) => {
                  const hp = idToPageMap?.[`heading-${s.id}`];
                  if (s.id === "summary") return (idToPageMap?.["summary-content"] ?? hp ?? 0) === pageIndex;
                  if (s.id === "experience") {
                    const onThisPage = experiences.some((e: any) => (idToPageMap?.[`exp-${e.id}`] === pageIndex) || (e.bullets?.some((b: any) => idToPageMap?.[`bullet-${b.id}`] === pageIndex)));
                    return onThisPage || (hp ?? 0) === pageIndex;
                  }
                  if (s.id === "projects") {
                    const onThisPage = projects.some((p: any) => (idToPageMap?.[`proj-${p.id}`] === pageIndex) || (p.bullets?.some((b: any) => idToPageMap?.[`proj-bullet-${b.id}`] === pageIndex)));
                    return onThisPage || (hp ?? 0) === pageIndex;
                  }
                  return (hp ?? 0) === pageIndex;
                };

                const hasSidebarOnPage = sidebarSecs.some(isSidebarSecOnPage);
                const hasMainOnPage = mainSecs.some(isMainSecOnPage);

                if (pageIndex > 0 && !hasHeaderOnPage && !hasSidebarOnPage && !hasMainOnPage) {
                  return null;
                }

              

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
                    {/* Visual Margin Alignment Guides, Rulers & Grid Snapping Zones */}
                    {showMarginGuides && !printPreviewMode && (
                      <>
                        {/* Top Rulers & Tick Marks */}
                        <div className="absolute top-0 left-0 right-0 h-4 bg-gray-100/80 border-b border-gray-200/60 pointer-events-none no-print flex items-end px-[var(--page-margin-x)] select-none z-50">
                          {Array.from({ length: 16 }).map((_, i) => (
                            <div key={i} className="flex-1 border-l border-gray-300/80 h-2.5 relative">
                              {i % 2 === 0 && (
                                <span className="absolute -top-2 left-0.5 text-[7px] font-mono font-bold text-gray-500">
                                  {(i * 0.5).toFixed(1)}&quot;
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Left Rulers & Tick Marks */}
                        <div className="absolute top-0 left-0 bottom-0 w-4 bg-gray-100/80 border-r border-gray-200/60 pointer-events-none no-print flex flex-col justify-between py-[var(--page-margin-y)] select-none z-50">
                          {Array.from({ length: 22 }).map((_, i) => (
                            <div key={i} className="w-full border-t border-gray-300/80 w-2.5 relative">
                              {i % 2 === 0 && (
                                <span className="absolute -top-1.5 left-0.5 text-[6px] font-mono font-bold text-gray-500">
                                  {(i * 0.5).toFixed(0)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Dashed Safe Area Box */}
                        <div
                          className="absolute border border-dashed border-blue-400/45 pointer-events-none no-print transition-all duration-300 rounded-sm"
                          style={{
                            top: "var(--page-margin-y)",
                            left: "var(--page-margin-x)",
                            right: "var(--page-margin-x)",
                            bottom: "var(--page-margin-y)",
                            zIndex: 40,
                          }}
                        >
                          <div className="absolute -top-3.5 left-0 flex items-center gap-1.5 bg-blue-600 text-white text-[8px] font-sans font-extrabold tracking-wider px-1.5 py-0.5 rounded shadow-sm select-none uppercase">
                            <Ruler size={9} />
                            <span>Print Safe Area · Page {pageIndex + 1}</span>
                          </div>
                          <div className="absolute -top-3.5 right-0 text-[8px] font-mono font-bold text-blue-500/80 bg-blue-50/90 px-1.5 py-0.5 rounded border border-blue-200/50 select-none">
                            Letter ({(design?.pageSize || "letter").toUpperCase()}) · Margins: {design?.pageMarginTopBottom ?? design?.pageMargin ?? 38}pxY / {design?.pageMarginLeftRight ?? design?.pageMargin ?? 38}pxX
                          </div>
                        </div>

                        {/* Column Split Alignment Guide (for Sidebar layout) */}
                        {design.layout === "sidebar" && (
                          <div
                            className="absolute border-r border-dashed border-indigo-400/35 pointer-events-none no-print z-40 transition-all duration-300"
                            style={{
                              top: "var(--page-margin-y)",
                              bottom: "var(--page-margin-y)",
                              left: `calc(var(--page-margin-x) + var(--sidebar-w))`,
                            }}
                          >
                            <span className="absolute top-2 -left-8 bg-indigo-50 text-indigo-600 text-[7px] font-mono font-bold px-1 py-0.5 rounded border border-indigo-200/50">
                              Sidebar
                            </span>
                            <span className="absolute top-2 left-1 bg-indigo-50 text-indigo-600 text-[7px] font-mono font-bold px-1 py-0.5 rounded border border-indigo-200/50">
                              Main
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {/* F-Pattern Visual Hierarchy Overlay (Rez-Gaze Engine) */}
                    {showHeatmapOverlay && !printPreviewMode && (
                      <div className="absolute inset-0 pointer-events-none no-print z-50 overflow-hidden mix-blend-multiply opacity-75">
                        <svg width="100%" height="100%">
                          <defs>
                            <radialGradient id="gaze-hot-spot" cx="50%" cy="50%" r="50%">
                              <stop offset="0%" stopColor="rgba(147, 51, 234, 0.55)" />
                              <stop offset="50%" stopColor="rgba(168, 85, 247, 0.25)" />
                              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
                            </radialGradient>
                          </defs>
                          {/* F-Pattern & Top 30% Focal Hotspots */}
                          <circle cx="20%" cy="12%" r="140" fill="url(#gaze-hot-spot)" />
                          <circle cx="50%" cy="14%" r="120" fill="url(#gaze-hot-spot)" />
                          <circle cx="25%" cy="28%" r="110" fill="url(#gaze-hot-spot)" />
                          <circle cx="20%" cy="45%" r="85" fill="url(#gaze-hot-spot)" />
                        </svg>
                        <div className="absolute top-2 right-4 bg-purple-600/90 text-white font-sans text-[9px] font-extrabold px-2 py-0.5 rounded shadow-sm flex items-center gap-1 uppercase tracking-wider backdrop-blur-xs">
                          👁️ F-Pattern Visual Hierarchy Active
                        </div>
                      </div>
                    )}

                    {/* Header (Always on page 0 to prevent typing glitches during pagination recalculation) */}
                    {pageIndex === 0 && (
                      <div
                        className={cn(
                          "header rounded-[var(--radius)] py-6 px-6 mb-[var(--section-gap)] print:!shadow-none print:!border-none print:!bg-transparent transition-all duration-300",
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
                              html={name} onChange={(val) => {
                                setName(val);
                                if (val && !val.toUpperCase().includes("ALEX MORGAN") && contactLine.includes("alex.morgan@email.com")) {
                                  setContactLine("San Francisco, CA <span class=\"text-[var(--hairline)] mx-2\">|</span> (415) 555-0199");
                                }
                              }}
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

                    {/* Unified Single Sections Tree (100% Editor & PDF Parity) */}
                    <div className="resume-sections-container w-full">
                      {design.layout === "sidebar" ? (
                        <div 
                          className="grid w-full items-start"
                          style={{
                            gridTemplateColumns: "var(--sidebar-w) calc(100% - var(--sidebar-w) - 1.1rem)",
                            columnGap: "1.1rem"
                          }}
                        >
                          <div data-column="main" className="contents">
                            <Reorder.Group
                              as="div"
                              values={sections.filter((s: any) => !["licenses", "skills", "education"].includes(s.id))}
                              onReorder={(newOrder) => {
                                const sidebarSecs = sections.filter((s: any) => ["licenses", "skills", "education"].includes(s.id));
                                setSections([...sidebarSecs, ...newOrder]);
                              }}
                              id={`sections-main-${pageIndex}`}
                              className="contents"
                            >
                              {sections
                                .filter((s: any) => !["licenses", "skills", "education"].includes(s.id))
                                .map((s: any) => renderSection(s, "main-"))}
                            </Reorder.Group>
                          </div>
                          <div data-column="sidebar" className="contents">
                            <Reorder.Group
                              as="div"
                              values={sections.filter((s: any) => ["licenses", "skills", "education"].includes(s.id))}
                              onReorder={(newOrder) => {
                                const mainSecs = sections.filter((s: any) => !["licenses", "skills", "education"].includes(s.id));
                                setSections([...newOrder, ...mainSecs]);
                              }}
                              id={`sections-sidebar-${pageIndex}`}
                              className="contents"
                            >
                              {sections
                                .filter((s: any) => ["licenses", "skills", "education"].includes(s.id))
                                .map((s: any) => renderSection(s, "sidebar-"))}
                            </Reorder.Group>
                          </div>
                        </div>
                      ) : (
                        <Reorder.Group
                          as="div"
                          values={sections}
                          onReorder={setSections}
                          id={`sections-container-${pageIndex}`}
                          className="w-full"
                        >
                          {sections.map((section: any) => renderSection(section))}
                        </Reorder.Group>
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
  );
}
