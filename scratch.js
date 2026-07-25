const fs = require('fs');
const path = '/Users/hanna/Downloads/github/resumeBUILDER/components/ResumeBuilder.tsx';
let content = fs.readFileSync(path, 'utf8');

const sections = [
  { name: 'Educations', item: 'edu' },
  { name: 'Projects', item: 'proj' },
  { name: 'Publications', item: 'pub' },
  { name: 'Awards', item: 'award' },
  { name: 'Skills', item: 'sk' },
  { name: 'Licenses', item: 'lic' },
];

for (const {name, item} of sections) {
  // Replace section-level remove button
  const sectionRegex = new RegExp(`[ \\t]*<button\\s*onClick=\\{\\(\\) =>\\s*set${name}\\(\\(e: any\\[\\]\\) =>\\s*e\\.filter\\(\\(x\\) => x\\.id !== ${item}\\.id\\),\\s*\\)\\s*\\}\\s*className="remove-entry absolute top-2 right-2 md:top-3 md:right-3 bg-transparent border-none text-\\[var\\(--danger\\)\\] text-\\[11px\\] font-bold cursor-pointer opacity-50 hover:opacity-100 font-sans no-print flex items-center gap-1 hidden group-hover:flex"\\s*>\\s*<X size=\\{12\\} \\/> remove\\s*<\\/button>`, 'g');
  
  const sectionReplacement = `                              <div className="absolute top-2 right-2 md:top-3 md:right-3 flex items-center gap-1 opacity-50 hover:opacity-100 hidden group-hover:flex no-print">
                                <button
                                  onClick={() => {
                                    const idx = ${name.toLowerCase()}.findIndex((x: any) => x.id === ${item}.id);
                                    if (idx > -1) set${name}(moveItemUp(${name.toLowerCase()}, idx));
                                  }}
                                  className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-800"
                                  title="Move Up"
                                >
                                  <ArrowUp size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    const idx = ${name.toLowerCase()}.findIndex((x: any) => x.id === ${item}.id);
                                    if (idx > -1) set${name}(moveItemDown(${name.toLowerCase()}, idx));
                                  }}
                                  className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-800"
                                  title="Move Down"
                                >
                                  <ArrowDown size={14} />
                                </button>
                                <button
                                  onClick={() =>
                                    set${name}((e: any[]) =>
                                      e.filter((x) => x.id !== ${item}.id),
                                    )
                                  }
                                  className="p-1 rounded hover:bg-red-100 text-[var(--danger)] text-[11px] font-bold cursor-pointer font-sans flex items-center gap-1"
                                >
                                  <X size={12} /> remove
                                </button>
                              </div>`;
                              
  content = content.replace(sectionRegex, sectionReplacement);
  
  // Replace bullet-level remove button (only for sections with bullets)
  if (['Educations', 'Projects', 'Publications', 'Awards'].includes(name)) {
    const bulletRegex = new RegExp(`[ \\t]*<button\\s*className="hidden group-hover/bullet:inline absolute -left-4 top-1 text-\\[var\\(--danger\\)\\] text-\\[11px\\] font-bold cursor-pointer font-sans no-print"\\s*onClick=\\{\\(\\) =>\\s*set${name}\\(\\(e: any\\[\\]\\) =>\\s*e\\.map\\(\\(x\\) =>\\s*x\\.id === ${item}\\.id\\s*\\?\\s*\\{\\s*\\.\\.\\.x,\\s*bullets: x\\.bullets\\.filter\\(\\s*\\(y: any\\) => y\\.id !== b\\.id,\\s*\\),\\s*\\}\\s*: x,\\s*\\),\\s*\\)\\s*\\}\\s*>\\s*✕\\s*<\\/button>`, 'g');
    
    const bulletReplacement = `                                    <div className="hidden group-hover/bullet:flex absolute -left-14 top-0.5 items-center gap-0.5 no-print bg-white/80 rounded px-0.5 py-0.5 shadow-sm border border-gray-100">
                                      <button
                                        onClick={() =>
                                          set${name}((e: any[]) =>
                                            e.map((x) =>
                                              x.id === ${item}.id
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
                                          set${name}((e: any[]) =>
                                            e.map((x) =>
                                              x.id === ${item}.id
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
                                          set${name}((e: any[]) =>
                                            e.map((x) =>
                                              x.id === ${item}.id
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
                                    </div>`;
    content = content.replace(bulletRegex, bulletReplacement);
    
    // Also prepend bullets instead of appending for these sections
    const addBulletRegex = new RegExp(`bullets: \\[\\s*\\.\\.\\.x\\.bullets,\\s*\\{\\s*id: Date\\.now\\(\\)\\.toString\\(\\),\\s*text: "New bullet",\\s*\\},\\s*\\],`, 'g');
    const addBulletReplacement = `bullets: [
                                              {
                                                id: Date.now().toString(),
                                                text: "New bullet",
                                              },
                                              ...x.bullets,
                                            ],`;
    content = content.replace(addBulletRegex, addBulletReplacement);
  }
}

fs.writeFileSync(path, content, 'utf8');
console.log('Patch complete.');
