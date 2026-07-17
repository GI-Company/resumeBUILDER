import re

with open("components/ResumeBuilder.tsx", "r") as f:
    content = f.read()

# We need to find the <Reorder.Group values={sections} ...> up to </Reorder.Group> that contains SectionWrapper
# Let's extract the inside of sections.map

pattern = r'\{sections\.map\(\(section: any\) => \(\s*<SectionWrapper(.*?)</SectionWrapper>\s*\)\)\}'
match = re.search(pattern, content, flags=re.DOTALL)
if not match:
    print("Could not find sections.map!")
    exit(1)

section_wrapper_content = match.group(0) # {sections.map( ... )}

# We will create the new component SectionRenderer
component_code = """
const SectionRenderer = memo(({
  section,
  summary, setSummary,
  licenses, setLicenses,
  skills, setSkills,
  experiences, setExperiences,
  educations, setEducations,
  manualBreaks, setManualBreaks,
  pageBreakElementIds,
  design, gapHeights
}: any) => {
  return (
    <SectionWrapper""" + match.group(1) + """</SectionWrapper>
  );
}, (prev, next) => {
  if (prev.section !== next.section) return false;
  if (prev.design !== next.design) return false;
  if (prev.gapHeights !== next.gapHeights) return false;
  if (prev.pageBreakElementIds !== next.pageBreakElementIds) return false;
  if (prev.manualBreaks !== next.manualBreaks) return false;
  
  if (next.section.id === "summary") return prev.summary === next.summary;
  if (next.section.id === "licenses") return prev.licenses === next.licenses;
  if (next.section.id === "skills") return prev.skills === next.skills;
  if (next.section.id === "experience") return prev.experiences === next.experiences;
  if (next.section.id === "education") return prev.educations === next.educations;
  
  return true;
});
"""

# Replace in file:
# 1. Add component_code just before `export default function ResumeBuilder`
# 2. Replace {sections.map...} with {sections.map((section: any) => <SectionRenderer key={section.id} section={section} summary={summary} setSummary={setSummary} licenses={licenses} setLicenses={setLicenses} skills={skills} setSkills={setSkills} experiences={experiences} setExperiences={setExperiences} educations={educations} setEducations={setEducations} manualBreaks={manualBreaks} setManualBreaks={setManualBreaks} pageBreakElementIds={pageBreakElementIds} design={design} gapHeights={gapHeights} />)}

new_content = content.replace("export default function ResumeBuilder", component_code + "\nexport default function ResumeBuilder")
new_content = new_content.replace(section_wrapper_content, """{sections.map((section: any) => (
  <SectionRenderer
    key={section.id}
    section={section}
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
    manualBreaks={manualBreaks}
    setManualBreaks={setManualBreaks}
    pageBreakElementIds={pageBreakElementIds}
    design={design}
    gapHeights={gapHeights}
  />
))}""")

with open("components/ResumeBuilder.tsx", "w") as f:
    f.write(new_content)
