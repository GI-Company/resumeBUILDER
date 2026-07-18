const fs = require('fs');
const file = 'components/ResumeBuilder.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `<div className="hidden print:block w-full">`;

const replacement = `<div className="hidden print:block w-full">
                    {design.layout === "sidebar" ? (
                      <div className="flex w-full gap-[1.1rem] items-start">
                        <Reorder.Group values={sections.filter((s: any) => ["licenses", "skills", "education"].includes(s.id))} onReorder={() => {}} className="w-[var(--sidebar-w)] shrink-0 flex flex-col">
                          {sections
                            .filter((s: any) => ["licenses", "skills", "education"].includes(s.id))
                            .map((s: any) => renderSection(s, "print-"))}
                        </Reorder.Group>
                        <Reorder.Group values={sections.filter((s: any) => !["licenses", "skills", "education"].includes(s.id))} onReorder={() => {}} className="flex-1 flex flex-col min-w-0">
                          {sections
                            .filter((s: any) => !["licenses", "skills", "education"].includes(s.id))
                            .map((s: any) => renderSection(s, "print-"))}
                        </Reorder.Group>
                      </div>
                    ) : (
                      <Reorder.Group values={sections} onReorder={() => {}} className="flex flex-col w-full">
                        {sections.map((s: any) => renderSection(s, "print-"))}
                      </Reorder.Group>
                    )}
                  </div>`;

// regex to replace from <div className="hidden print:block w-full"> to the closing </div> of that block.
const startIndex = code.indexOf('<div className="hidden print:block w-full">');
const endIndexStr = `                  </div>
                </>`;
const endIndex = code.indexOf(endIndexStr, startIndex);

if (startIndex > -1 && endIndex > startIndex) {
  const newCode = code.slice(0, startIndex) + replacement + '\n                </>';
  fs.writeFileSync(file, newCode + code.slice(endIndex + endIndexStr.length));
  console.log('Patched successfully');
} else {
  console.log('Failed to find target');
}
