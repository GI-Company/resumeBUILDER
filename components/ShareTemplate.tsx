import React from 'react';
import { Mail, Phone, MapPin, Globe, Linkedin, Github } from 'lucide-react';

interface ShareTemplateProps {
  resumeData: any;
}

export default function ShareTemplate({ resumeData }: ShareTemplateProps) {
  const {
    name = "ALEX MORGAN",
    contactLine = "alex.morgan@email.com",
    summary = "",
    experiences = [],
    educations = [],
    skills = [],
    licenses = [],
    projects = [],
    publications = [],
    awards = [],
    sections = [
      { id: "summary", visible: true },
      { id: "experience", visible: true },
      { id: "education", visible: true },
      { id: "skills", visible: true },
      { id: "projects", visible: true },
      { id: "licenses", visible: true },
      { id: "awards", visible: true },
      { id: "publications", visible: true }
    ],
    sectionHeaders = {
      summary: "Professional Summary",
      experience: "Experience",
      education: "Education",
      skills: "Skills",
      projects: "Projects",
      licenses: "Licenses & Certifications",
      awards: "Awards",
      publications: "Publications"
    },
    design = {}
  } = resumeData;

  // Graceful fallbacks for legacy resumes missing design data
  const layout = design.layout || "classic";
  const accentColor = design.accentColor || design.accent || "#1e3a8a";
  const panelColor = design.panel || "#ffffff";
  const paperColor = design.paper || "#ffffff";
  const fontHeading = design.fontHeading || design.fontFamily || "Inter";
  const fontBody = design.fontBody || design.fontFamily || "Inter";
  const radius = design.radius ?? 6;
  const gap = design.gap ?? 24;
  const itemSpacing = design.itemSpacing ?? 16;
  const headingStyle = design.headingStyle || "plain";
  const headerAlign = design.headerAlign || "left";
  const listStyle = design.listStyle || "disc";

  const renderSectionHeader = (title: string) => {
    return (
      <h2 
        className={`text-lg font-bold tracking-wider mb-4 ${headingStyle === 'smallcaps' ? 'uppercase' : ''}`}
        style={{
          fontFamily: "var(--font-heading)",
          borderBottom: headingStyle === "underline" || headingStyle === "plain" ? "2px solid var(--accent)" : "none",
          paddingBottom: headingStyle === "underline" || headingStyle === "plain" ? "4px" : "0",
          backgroundColor: headingStyle === "bar" ? "var(--accent)" : "transparent",
          color: headingStyle === "bar" ? "#fff" : "var(--accent)",
          padding: headingStyle === "bar" ? "4px 12px" : "0",
          borderRadius: headingStyle === "bar" ? "4px" : "0",
        }}
      >
        {title}
      </h2>
    );
  };

  const renderBulletList = (bullets: string[]) => {
    if (!bullets || bullets.length === 0) return null;
    return (
      <ul 
        className="pl-5 space-y-1.5 mt-2 text-sm text-gray-700 leading-relaxed"
        style={{ listStyleType: listStyle }}
      >
        {bullets.map((b: any, idx: number) => (
          <li key={idx} dangerouslySetInnerHTML={{ __html: b.text || b }} />
        ))}
      </ul>
    );
  };

  const renderSectionContent = (sectionId: string) => {
    const isVisible = sections.find((s: any) => s.id === sectionId)?.visible ?? true;
    if (!isVisible) return null;

    const title = sectionHeaders[sectionId] || sectionId;

    switch (sectionId) {
      case "summary":
        if (!summary) return null;
        return (
          <section key="summary" style={{ marginBottom: `${gap}px` }}>
            {renderSectionHeader(title)}
            <div 
              className="text-sm text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: summary }}
            />
          </section>
        );

      case "experience":
        if (!experiences?.length) return null;
        return (
          <section key="experience" style={{ marginBottom: `${gap}px` }}>
            {renderSectionHeader(title)}
            <div className="space-y-6" style={{ rowGap: `${itemSpacing}px` }}>
              {experiences.map((exp: any, idx: number) => (
                <div key={idx} className="flex flex-col">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-1">
                    <div>
                      <h3 className="font-bold text-gray-900" style={{ fontFamily: "var(--font-heading)" }}>{exp.title}</h3>
                      <div className="text-sm font-medium text-gray-700">{exp.company}</div>
                    </div>
                    <div className="text-xs font-mono text-gray-500 sm:text-right mt-1 sm:mt-0 whitespace-nowrap">
                      {exp.date}
                      {exp.location && <><br/>{exp.location}</>}
                    </div>
                  </div>
                  {renderBulletList(exp.bullets)}
                </div>
              ))}
            </div>
          </section>
        );

      case "education":
        if (!educations?.length) return null;
        return (
          <section key="education" style={{ marginBottom: `${gap}px` }}>
            {renderSectionHeader(title)}
            <div className="space-y-4" style={{ rowGap: `${itemSpacing}px` }}>
              {educations.map((edu: any, idx: number) => (
                <div key={idx}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                    <div>
                      <h3 className="font-bold text-gray-900" style={{ fontFamily: "var(--font-heading)" }}>{edu.degree}</h3>
                      <div className="text-sm font-medium text-gray-700">{edu.school}</div>
                    </div>
                    <div className="text-xs font-mono text-gray-500 sm:text-right whitespace-nowrap">
                      {edu.date}
                    </div>
                  </div>
                  {edu.gpa && <div className="text-sm text-gray-600 mt-1">GPA: {edu.gpa}</div>}
                  {renderBulletList(edu.bullets)}
                </div>
              ))}
            </div>
          </section>
        );

      case "skills":
        if (!skills?.length) return null;
        return (
          <section key="skills" style={{ marginBottom: `${gap}px` }}>
            {renderSectionHeader(title)}
            <div className="flex flex-wrap gap-2">
              {skills.map((skill: any, idx: number) => (
                <span 
                  key={idx} 
                  className="px-2.5 py-1 text-sm rounded-md font-medium"
                  style={{ 
                    backgroundColor: "var(--panel)", 
                    color: "var(--accent)",
                    border: "1px solid var(--accent)",
                    opacity: 0.8
                  }}
                >
                  {skill.name || skill}
                </span>
              ))}
            </div>
          </section>
        );

      case "projects":
        if (!projects?.length) return null;
        return (
          <section key="projects" style={{ marginBottom: `${gap}px` }}>
            {renderSectionHeader(title)}
            <div className="space-y-4" style={{ rowGap: `${itemSpacing}px` }}>
              {projects.map((proj: any, idx: number) => (
                <div key={idx}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                    <h3 className="font-bold text-gray-900" style={{ fontFamily: "var(--font-heading)" }}>{proj.name}</h3>
                    <div className="text-xs font-mono text-gray-500 whitespace-nowrap">{proj.date}</div>
                  </div>
                  {renderBulletList(proj.bullets)}
                </div>
              ))}
            </div>
          </section>
        );

      case "licenses":
        if (!licenses?.length) return null;
        return (
          <section key="licenses" style={{ marginBottom: `${gap}px` }}>
            {renderSectionHeader(title)}
            <div className="space-y-3">
              {licenses.map((lic: any, idx: number) => (
                <div key={idx} className="text-sm">
                  <span className="font-bold text-gray-900">{lic.name}</span>
                  {lic.issuer && <span className="text-gray-600"> — {lic.issuer}</span>}
                  {lic.date && <div className="text-xs font-mono text-gray-500 mt-0.5">{lic.date}</div>}
                </div>
              ))}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  const getFontFamilyStr = (fontStr: string) => {
    if (!fontStr) return "sans-serif";
    if (fontStr.includes("serif")) return fontStr;
    return fontStr;
  };

  const sidebarSections = sections.filter((s: any) => ["licenses", "skills", "education"].includes(s.id));
  const mainSections = sections.filter((s: any) => !["licenses", "skills", "education"].includes(s.id));

  return (
    <div 
      className="w-full max-w-4xl mx-auto shadow-xl overflow-hidden transition-all duration-300"
      style={{
        backgroundColor: paperColor,
        borderRadius: `${radius}px`,
        "--accent": accentColor,
        "--panel": panelColor,
        "--font-heading": getFontFamilyStr(fontHeading),
        "--font-body": getFontFamilyStr(fontBody),
        fontFamily: "var(--font-body)",
      } as React.CSSProperties}
    >
      {/* Header */}
      <header 
        className={`p-8 md:p-12 ${headerAlign === 'center' ? 'text-center' : 'text-left'}`}
        style={{ 
          backgroundColor: panelColor !== '#ffffff' && panelColor !== '#fff' ? panelColor : 'transparent',
          borderBottom: panelColor !== '#ffffff' ? `1px solid ${accentColor}20` : 'none'
        }}
      >
        <h1 
          className="text-4xl md:text-5xl font-black mb-3"
          style={{ color: "var(--accent)", fontFamily: "var(--font-heading)" }}
        >
          {name}
        </h1>
        <div 
          className={`text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-2 ${headerAlign === 'center' ? 'justify-center' : 'justify-start'}`}
          dangerouslySetInnerHTML={{ __html: contactLine }}
        />
      </header>

      {/* Body */}
      <div className="p-8 md:p-12">
        {layout === "sidebar" ? (
          <div className="flex flex-col md:flex-row gap-12">
            <div className="md:w-2/3 space-y-2">
              {mainSections.map((s: any) => renderSectionContent(s.id))}
            </div>
            <div className="md:w-1/3 space-y-2 border-t md:border-t-0 md:border-l border-gray-200 pt-8 md:pt-0 md:pl-8">
              {sidebarSections.map((s: any) => renderSectionContent(s.id))}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {sections.map((s: any) => renderSectionContent(s.id))}
          </div>
        )}
      </div>
    </div>
  );
}
