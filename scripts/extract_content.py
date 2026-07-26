import os
import re

with open("components/ResumeBuilder.tsx", "r") as f:
    content = f.read()

start_marker = '          {/* Add Content Panel */}'
end_marker = '          {/* Photo Panel */}'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    panel_code = content[start_idx:end_idx]
    # Remove trailing paren
    panel_code = re.sub(r'\n\s*\)$', '', panel_code.rstrip())
    
    new_component = """import React from "react";
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
""" + panel_code.replace('          {/* Add Content Panel */}\n          {activeSidebarTab === "content" && (', '').strip() + """
  );
}
"""
    
    with open("components/editor/ContentPanel.tsx", "w") as f:
        f.write(new_component)
        
    new_content = content[:start_idx] + """          {/* Add Content Panel */}
          <ContentPanel
            activeSidebarTab={activeSidebarTab}
            setActiveSidebarTab={setActiveSidebarTab}
            sections={sections}
            setSections={setSections}
            experiences={experiences}
            setExperiences={setExperiences}
            skills={skills}
            setSkills={setSkills}
            educations={educations}
            setEducations={setEducations}
            licenses={licenses}
            setLicenses={setLicenses}
            projects={projects}
            setProjects={setProjects}
            publications={publications}
            setPublications={setPublications}
            awards={awards}
            setAwards={setAwards}
          />

""" + content[end_idx:]
    
    if 'import ContentPanel' not in new_content:
        new_content = new_content.replace('import TemplatesPanel from "./editor/TemplatesPanel";', 'import ContentPanel from "./editor/ContentPanel";\nimport TemplatesPanel from "./editor/TemplatesPanel";')

    with open("components/ResumeBuilder.tsx", "w") as f:
        f.write(new_content)
        
    print("ContentPanel extracted successfully.")
else:
    print("Failed to find boundaries.")
