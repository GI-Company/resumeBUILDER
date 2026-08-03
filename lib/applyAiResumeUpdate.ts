import { useResumeStore } from './store/useResumeStore';

export function applyAiResumeUpdate(parsed: any) {
  const storeState = useResumeStore.getState();
  
  let newName = parsed.name || storeState.name;
  let newContactLine = parsed.contactLine;

  if (!newContactLine) {
    const parts = [
      parsed.location || parsed.cityState || parsed.address,
      parsed.phone,
      parsed.email,
      parsed.linkedin,
      parsed.website || parsed.portfolio,
    ].filter(Boolean);
    if (parts.length > 0) {
      newContactLine = parts.join(' | ');
    }
  }

  const expArray = parsed.experiences || parsed.experience || parsed.workExperience || parsed.workExperiences || parsed.jobs || [];
  const eduArray = parsed.educations || parsed.education || parsed.educationAndCertifications || [];
  const skillArray = parsed.skills || parsed.skill || parsed.skillsAndCompetencies || [];

  const newExperiences = (Array.isArray(expArray) && expArray.length > 0) ? expArray.map((exp: any, i: number) => {
    if (typeof exp === "string") {
      return { id: `exp-ai-${i}-${Date.now()}`, title: exp, date: "", bullets: [], meta: "" };
    }
    const rawBullets = exp.bullets || exp.responsibilities || exp.achievements || [];
    return {
      id: exp.id || `exp-ai-${i}-${Date.now()}`,
      title: exp.title || exp.jobTitle || exp.role || exp.company || "",
      date: exp.date || exp.duration || exp.timeframe || "",
      bullets: Array.isArray(rawBullets) ? rawBullets.map((b: any, j: number) => ({
        id: b.id || `b-ai-${i}-${j}-${Date.now()}`,
        text: typeof b === "string" ? b : (b.text || b.description || b.content || ""),
      })) : [],
      meta: exp.meta || exp.location || "",
    };
  }) : storeState.experiences;

  const newEducations = (Array.isArray(eduArray) && eduArray.length > 0) ? eduArray.map((edu: any, i: number) => {
    if (typeof edu === "string") {
      return { id: `edu-ai-${i}-${Date.now()}`, degree: edu, bullets: [] };
    }
    const rawBullets = edu.bullets || edu.details || [];
    return {
      id: edu.id || `edu-ai-${i}-${Date.now()}`,
      degree: edu.degree || edu.school || edu.institution || "",
      bullets: Array.isArray(rawBullets) ? rawBullets.map((b: any, j: number) => ({
        id: b.id || `eb-ai-${i}-${j}-${Date.now()}`,
        text: typeof b === "string" ? b : (b.text || b.description || ""),
      })) : [],
    };
  }) : storeState.educations;

  const newSkills = (Array.isArray(skillArray) && skillArray.length > 0) ? skillArray.map((s: any, i: number) => {
    if (typeof s === "string") {
      return { id: `sk-ai-${i}-${Date.now()}`, title: "", items: s };
    }
    return {
      id: s.id || `sk-ai-${i}-${Date.now()}`,
      title: s.title || s.name || s.category || "",
      items: Array.isArray(s.items) ? s.items.join(", ") : (s.items || s.details || s.skills || ""),
    };
  }) : storeState.skills;

  const projArray = parsed.projects || parsed.project || [];
  const pubArray = parsed.publications || parsed.publication || [];
  const awardArray = parsed.awards || parsed.award || [];
  const licArray = parsed.licenses || parsed.license || [];

  const newProjects = (Array.isArray(projArray) && projArray.length > 0) ? projArray.map((p: any, i: number) => {
    if (typeof p === "string") return { id: `proj-ai-${i}-${Date.now()}`, title: p, date: "", bullets: [] };
    const rawBullets = p.bullets || [];
    return {
      id: p.id || `proj-ai-${i}-${Date.now()}`,
      title: p.title || p.name || "",
      date: p.date || "",
      bullets: Array.isArray(rawBullets) ? rawBullets.map((b: any, j: number) => ({
        id: b.id || `bp-ai-${i}-${j}-${Date.now()}`,
        text: typeof b === "string" ? b : (b.text || b.description || ""),
      })) : [],
    };
  }) : storeState.projects;

  const newPublications = (Array.isArray(pubArray) && pubArray.length > 0) ? pubArray.map((p: any, i: number) => {
    if (typeof p === "string") return { id: `pub-ai-${i}-${Date.now()}`, title: p, date: "", bullets: [] };
    const rawBullets = p.bullets || [];
    return {
      id: p.id || `pub-ai-${i}-${Date.now()}`,
      title: p.title || p.name || "",
      date: p.date || "",
      bullets: Array.isArray(rawBullets) ? rawBullets.map((b: any, j: number) => ({
        id: b.id || `bpub-ai-${i}-${j}-${Date.now()}`,
        text: typeof b === "string" ? b : (b.text || b.description || ""),
      })) : [],
    };
  }) : storeState.publications;

  const newAwards = (Array.isArray(awardArray) && awardArray.length > 0) ? awardArray.map((a: any, i: number) => {
    if (typeof a === "string") return { id: `award-ai-${i}-${Date.now()}`, title: a, date: "", bullets: [] };
    const rawBullets = a.bullets || [];
    return {
      id: a.id || `award-ai-${i}-${Date.now()}`,
      title: a.title || a.name || "",
      date: a.date || "",
      bullets: Array.isArray(rawBullets) ? rawBullets.map((b: any, j: number) => ({
        id: b.id || `ba-ai-${i}-${j}-${Date.now()}`,
        text: typeof b === "string" ? b : (b.text || b.description || ""),
      })) : [],
    };
  }) : storeState.awards;

  const newLicenses = (Array.isArray(licArray) && licArray.length > 0) ? licArray.map((l: any, i: number) => {
    if (typeof l === "string") return { id: `lic-ai-${i}-${Date.now()}`, text: l };
    const nameStr = l.title || l.name || l.text || "";
    const issuerStr = l.issuer ? ` — ${l.issuer}` : "";
    const dateStr = l.date ? ` (${l.date})` : "";
    return {
      id: l.id || `lic-ai-${i}-${Date.now()}`,
      text: `${nameStr}${issuerStr}${dateStr}`.trim(),
    };
  }) : storeState.licenses;

  const eduRegex = /\b(B\.S\.|B\.A\.|Bachelor|Master|University|College|GPA|Ph\.D)\b/i;
  const finalExperiences: any[] = [];
  const extractedEducations: any[] = [];

  for (const exp of (newExperiences || [])) {
    const titleText = exp.title || "";
    const metaText = exp.meta || "";
    const firstBulletText = exp.bullets?.[0]?.text || "";
    
    // Safety net: Check if title, meta, or the first bullet strongly signals an education entry
    if (eduRegex.test(titleText) || eduRegex.test(metaText) || eduRegex.test(firstBulletText)) {
      extractedEducations.push({
        id: `edu-ai-fallback-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        degree: titleText + (metaText ? ` | ${metaText}` : ""),
        bullets: exp.bullets || []
      });
    } else {
      finalExperiences.push(exp);
    }
  }

  const finalEducations = [...(newEducations || []), ...extractedEducations];

  useResumeStore.setState({
    name: newName,
    contactLine: newContactLine || storeState.contactLine,
    summary: parsed.summary || storeState.summary,
    experiences: finalExperiences,
    educations: finalEducations,
    skills: newSkills,
    projects: newProjects,
    publications: newPublications,
    awards: newAwards,
    licenses: newLicenses,
  });
}
