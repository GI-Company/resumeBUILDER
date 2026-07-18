const fs = require('fs');
const file = 'components/ResumeBuilder.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `            {/* Sections */}
            <Reorder.Group
              values={sections}
              onReorder={setSections}
              id="sections-container"
              className="w-full"
            >
              {sections.map((section: any) => (
  <SectionRenderer`;

const renderFn = `            {/* Sections */}
            {(() => {
              const renderSection = (section: any, keyPrefix: string = "") => (
                <SectionRenderer
                  key={\`\${keyPrefix}\${section.id}\`}
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
                <>
                  <div className="block print:hidden w-full">
                    <Reorder.Group
                      values={sections}
                      onReorder={setSections}
                      id="sections-container"
                      className="w-full"
                    >
                      {sections.map((section: any) => renderSection(section))}
                    </Reorder.Group>
                  </div>
                  
                  <div className="hidden print:block w-full">
                    {design.layout === "sidebar" ? (
                      <div className="flex w-full gap-[1.1rem] items-start">
                        <div className="w-[var(--sidebar-w)] shrink-0 flex flex-col">
                          {sections
                            .filter((s: any) => ["licenses", "skills", "education"].includes(s.id))
                            .map((s: any) => renderSection(s, "print-"))}
                        </div>
                        <div className="flex-1 flex flex-col min-w-0">
                          {sections
                            .filter((s: any) => !["licenses", "skills", "education"].includes(s.id))
                            .map((s: any) => renderSection(s, "print-"))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col w-full">
                        {sections.map((s: any) => renderSection(s, "print-"))}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}`;

// Replace everything from {/* Sections */} down to </Reorder.Group>
const startIndex = code.indexOf('            {/* Sections */}');
const endIndex = code.indexOf('            </Reorder.Group>', startIndex) + '            </Reorder.Group>'.length;

if (startIndex > -1 && endIndex > startIndex) {
  const newCode = code.slice(0, startIndex) + renderFn + code.slice(endIndex);
  fs.writeFileSync(file, newCode);
  console.log('Patched successfully');
} else {
  console.log('Failed to find target');
}
