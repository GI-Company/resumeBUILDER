const fs = require('fs');
let content = fs.readFileSync('components/ResumeBuilder.tsx', 'utf8');

content = content.replace("  const [isSaving, setIsSaving] = useState(false);", "  const [isSaving, setIsSaving] = useState(false);\n  const [activeSidebarTab, setActiveSidebarTab] = useState<string | null>('templates');");

content = content.replace("  const applyTemplate = (t: any) => {", `  const applyTemplate = (t: any) => {
    setDesign(prev => ({
      ...prev, template: t.id, fontHeading: t.heading, fontBody: t.body, accent: t.accent, panel: t.panel, paper: t.paper || '#ffffff', radius: t.radius, layout: t.layout, headingStyle: t.headingStyle, italic: t.italic, headerAlign: t.headerAlign || 'left', listStyle: t.listStyle || 'disc', pageMargin: t.pageMargin || 38, itemSpacing: t.itemSpacing || 16, jobLayout: t.jobLayout || 'stacked'
    }));
  };`);

// Delete everything from return ( to {/* Canvas */}
const returnRegex = /return \(\s*<div className=\{cn\("min-h-screen[\s\S]*?\{\/\* Canvas \*\/\}/m;

const newShell = `return (
    <div className="h-screen w-full flex bg-[#f8f9fa] text-gray-900 antialiased overflow-hidden font-sans">
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      
      {/* Format Bar */}
      {formatBar.visible && (
        <div className="format-bar fixed z-[200] bg-[#1d1b1e] text-white rounded-lg shadow-xl p-1.5 flex items-center gap-1 -translate-x-1/2 transition-all no-print" style={{ left: formatBar.x, top: formatBar.y }}>
          <button onPointerDown={e => { e.preventDefault(); document.execCommand('bold'); }} className={cn("p-1.5 rounded-md hover:bg-[#33303a]", formatBar.active.b && "bg-[#4a3c50] text-[#00f0ff]")}><Bold size={14}/></button>
          <button onPointerDown={e => { e.preventDefault(); document.execCommand('italic'); }} className={cn("p-1.5 rounded-md hover:bg-[#33303a]", formatBar.active.i && "bg-[#4a3c50] text-[#00f0ff]")}><Italic size={14}/></button>
          <button onPointerDown={e => { e.preventDefault(); document.execCommand('underline'); }} className={cn("p-1.5 rounded-md hover:bg-[#33303a]", formatBar.active.u && "bg-[#4a3c50] text-[#00f0ff]")}><Underline size={14}/></button>
          <div className="w-px h-4 bg-[#4d3f52] mx-1"></div>
          <button onPointerDown={e => { e.preventDefault(); document.execCommand('removeFormat'); }} className="p-1.5 rounded-md hover:bg-[#33303a] text-gray-400" title="Clear formatting"><Eraser size={14}/></button>
        </div>
      )}

      {/* Tutorial Overlay */}
      {tutorialOpen && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 font-sans no-print backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-[440px] p-6 shadow-2xl">
            <div className="text-[11px] font-bold tracking-widest text-gray-500 uppercase mb-1">{TUTORIAL_STEPS[tutorialStep].eyebrow}</div>
            <h3 className="font-bold text-xl text-gray-900 mb-2">{TUTORIAL_STEPS[tutorialStep].title}</h3>
            <div className="text-sm text-gray-600 leading-relaxed min-h-[70px]" dangerouslySetInnerHTML={{ __html: TUTORIAL_STEPS[tutorialStep].body }} />
            <div className="flex gap-1.5 my-4">
              {TUTORIAL_STEPS.map((_, i) => <span key={i} className={cn("w-2 h-2 rounded-full", i === tutorialStep ? "bg-gray-800" : "bg-gray-200")} />)}
            </div>
            <div className="flex items-center justify-between mt-6">
              <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer"><input type="checkbox" /> Don&apos;t show this again</label>
              <div className="flex gap-2">
                {tutorialStep > 0 && <button onClick={() => setTutorialStep(p => p - 1)} className="rounded-lg px-4 py-2 text-sm font-semibold border border-gray-200 hover:bg-gray-50">Back</button>}
                {tutorialStep < TUTORIAL_STEPS.length - 1 ? (
                  <button onClick={() => setTutorialStep(p => p + 1)} className="rounded-lg px-4 py-2 text-sm font-semibold bg-gray-900 text-white hover:bg-black">Next</button>
                ) : (
                  <button onClick={() => setTutorialOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold bg-gray-900 text-white hover:bg-black">Let&apos;s go</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Left Navigation */}
      <div className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-4 z-40 no-print shrink-0 shadow-sm relative">
        <div className="font-[family:'Kalam',cursive] font-bold text-lg mb-8 text-gray-800 w-10 h-10 flex items-center justify-center bg-gray-100 rounded-xl">M</div>
        
        <button onClick={() => setActiveSidebarTab(activeSidebarTab === 'templates' ? null : 'templates')} className={cn("flex flex-col items-center gap-1 w-16 py-3 rounded-xl mb-2 transition-all hover:bg-gray-100", activeSidebarTab === 'templates' && "bg-gray-100 text-blue-600")}>
          <FileText size={20} />
          <span className="text-[10px] font-medium">Templates</span>
        </button>
        <button onClick={() => setActiveSidebarTab(activeSidebarTab === 'design' ? null : 'design')} className={cn("flex flex-col items-center gap-1 w-16 py-3 rounded-xl mb-2 transition-all hover:bg-gray-100", activeSidebarTab === 'design' && "bg-gray-100 text-blue-600")}>
          <Palette size={20} />
          <span className="text-[10px] font-medium">Design</span>
        </button>
        <button onClick={() => setActiveSidebarTab(activeSidebarTab === 'content' ? null : 'content')} className={cn("flex flex-col items-center gap-1 w-16 py-3 rounded-xl mb-2 transition-all hover:bg-gray-100", activeSidebarTab === 'content' && "bg-gray-100 text-blue-600")}>
          <Plus size={20} />
          <span className="text-[10px] font-medium">Add</span>
        </button>
        
        <div className="mt-auto flex flex-col items-center w-full gap-2">
          <button onClick={() => setTutorialOpen(true)} className="flex flex-col items-center gap-1 w-16 py-2 rounded-xl transition-all hover:bg-gray-100 text-gray-500 hover:text-gray-900">
            <HelpCircle size={18} />
          </button>
          
          <div className="relative">
            <button onClick={() => setActiveSidebarTab(activeSidebarTab === 'account' ? null : 'account')} className={cn("flex flex-col items-center gap-1 w-16 py-2 rounded-xl transition-all hover:bg-gray-100", activeSidebarTab === 'account' ? "bg-gray-100 text-blue-600" : "text-gray-500 hover:text-gray-900")}>
              {user ? (
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">{user.email?.charAt(0).toUpperCase()}</div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 border border-gray-300 font-bold flex items-center justify-center text-xs">?</div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Sidebar */}
      {activeSidebarTab && (
        <div className="w-80 bg-white border-r border-gray-200 z-30 flex flex-col overflow-hidden no-print shrink-0 shadow-sm transition-all duration-300">
          
          {/* Templates Panel */}
          {activeSidebarTab === 'templates' && (
            <div className="flex-1 overflow-y-auto p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Templates</h2>
              <div className="grid grid-cols-1 gap-4">
                {TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => applyTemplate(t)} className={cn("text-left p-4 rounded-xl border-2 transition-all hover:border-gray-300 hover:bg-gray-50", design.template === t.id ? "border-blue-500 bg-blue-50/30" : "border-gray-100 bg-white")}>
                    <div className="font-bold text-gray-900 mb-1">{t.name}</div>
                    <div className="text-xs text-gray-500 leading-snug">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Design Panel */}
          {activeSidebarTab === 'design' && (
            <div className="flex-1 overflow-y-auto p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Design Settings</h2>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-900">Typography</h3>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Heading Font</label>
                    <select className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" value={design.fontHeading} onChange={e => setDesign(p => ({ ...p, fontHeading: e.target.value }))}>
                      <option value="'Kalam',cursive">Kalam</option>
                      <option value="'Playfair Display',serif">Playfair</option>
                      <option value="'Poppins',sans-serif">Poppins</option>
                      <option value="Georgia,serif">Georgia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Body Font</label>
                    <select className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" value={design.fontBody} onChange={e => setDesign(p => ({ ...p, fontBody: e.target.value }))}>
                      <option value="'Lora',serif">Lora</option>
                      <option value="'Inter',sans-serif">Inter</option>
                      <option value="'Source Serif 4',serif">Source Serif 4</option>
                      <option value="Georgia,serif">Georgia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Text Size</label>
                    <input type="range" min="85" max="130" className="w-full accent-blue-600" value={design.scale} onChange={e => setDesign(p => ({ ...p, scale: parseInt(e.target.value) }))} />
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-900">Colors</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Accent</label>
                      <input type="color" className="w-full h-8 rounded cursor-pointer border-0 p-0" value={design.accent} onChange={e => setDesign(p => ({ ...p, accent: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Panel</label>
                      <input type="color" className="w-full h-8 rounded cursor-pointer border-0 p-0" value={design.panel} onChange={e => setDesign(p => ({ ...p, panel: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Paper</label>
                      <input type="color" className="w-full h-8 rounded cursor-pointer border-0 p-0" value={design.paper} onChange={e => setDesign(p => ({ ...p, paper: e.target.value }))} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-900">Layout & Spacing</h3>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Layout Style</label>
                    <select className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" value={design.layout} onChange={e => setDesign(p => ({ ...p, layout: e.target.value }))}>
                      <option value="classic">Single Column</option>
                      <option value="sidebar">Sidebar Layout</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Job Style</label>
                    <select className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" value={design.jobLayout} onChange={e => setDesign(p => ({ ...p, jobLayout: e.target.value }))}>
                      <option value="stacked">Stacked</option>
                      <option value="split">Split (Dates Right)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Heading Style</label>
                    <select className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" value={design.headingStyle} onChange={e => setDesign(p => ({ ...p, headingStyle: e.target.value }))}>
                      <option value="bar">Color Bar</option>
                      <option value="underline">Underlined</option>
                      <option value="plain">Plain Text</option>
                      <option value="smallcaps">Small Caps</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Corner Radius</label>
                    <input type="range" min="0" max="24" className="w-full accent-blue-600" value={design.radius} onChange={e => setDesign(p => ({ ...p, radius: parseInt(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Section Gap</label>
                    <input type="range" min="4" max="40" step="2" className="w-full accent-blue-600" value={design.gap} onChange={e => setDesign(p => ({ ...p, gap: parseInt(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Item Spacing</label>
                    <input type="range" min="4" max="40" step="2" className="w-full accent-blue-600" value={design.itemSpacing} onChange={e => setDesign(p => ({ ...p, itemSpacing: parseInt(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Page Margin</label>
                    <input type="range" min="20" max="80" className="w-full accent-blue-600" value={design.pageMargin} onChange={e => setDesign(p => ({ ...p, pageMargin: parseInt(e.target.value) }))} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Content Panel */}
          {activeSidebarTab === 'content' && (
            <div className="flex-1 p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Add Content</h2>
              <div className="space-y-3">
                <button onClick={() => setExperiences([...experiences, { id: Date.now().toString(), title: 'Job Title', date: 'Date', bullets: [{ id: Date.now().toString(), text: 'New bullet' }], meta: '' }])} className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all font-semibold text-gray-800 text-sm flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">+</div> Add Experience
                </button>
                <button onClick={() => setSkills([...skills, { id: Date.now().toString(), title: 'New Category', items: 'Skills' }])} className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all font-semibold text-gray-800 text-sm flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">+</div> Add Skill Category
                </button>
                <button onClick={() => setEducations([...educations, { id: Date.now().toString(), degree: 'Degree', bullets: [{ id: Date.now().toString(), text: 'New bullet' }] }])} className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all font-semibold text-gray-800 text-sm flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">+</div> Add Education
                </button>
              </div>
              <div className="mt-8">
                <h3 className="text-xs font-semibold text-gray-500 mb-2">Instructions</h3>
                <p className="text-xs text-gray-600 leading-relaxed">Click any text directly on the resume to edit it. Drag the ⠿ handle on sections to reorder them.</p>
              </div>
            </div>
          )}

          {/* Account Panel */}
          {activeSidebarTab === 'account' && (
            <div className="flex-1 p-5 flex flex-col">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Account</h2>
              {user ? (
                <div className="flex flex-col h-full">
                  <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
                    <div className="text-xs text-gray-500 mb-1">Signed in as</div>
                    <div className="text-sm font-bold text-gray-900 truncate">{user.email}</div>
                  </div>
                  
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold text-gray-900">Your Resumes</h3>
                      <button onClick={() => { setResumeId(null); setActiveSidebarTab('templates'); }} className="text-xs text-blue-600 font-bold hover:underline">+ New</button>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                      {myResumes.length === 0 ? (
                        <div className="p-4 text-xs text-gray-500 text-center border border-dashed border-gray-200 rounded-lg">No saved resumes found.</div>
                      ) : (
                        myResumes.map(r => (
                          <button key={r.id} onClick={() => { setResumeId(r.id); loadResumeFromCloud(r.id); }} className={cn("block w-full text-left p-3 text-sm rounded-lg transition-all border", resumeId === r.id ? "bg-blue-50 border-blue-200 text-blue-900" : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50")}>
                            <div className="font-semibold">Resume {r.id.substring(0, 8)}</div>
                            <div className="text-[10px] text-gray-500 mt-1">{new Date(r.updated_at).toLocaleDateString()}</div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                  
                  <button onClick={handleLogout} className="mt-4 w-full p-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-bold transition-all">Log Out</button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-4">
                    <CloudUpload size={28} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Save your progress</h3>
                  <p className="text-sm text-gray-500 mb-6">Create an account to save your resumes to the cloud and access them from anywhere.</p>
                  <button onClick={() => setAuthModalOpen(true)} className="w-full p-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all">Log In / Sign Up</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#f3f4f6]">
        {/* Top Header */}
        <div className="h-14 bg-white/90 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-6 z-20 no-print shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="font-[family:'Kalam',cursive] font-bold text-lg text-gray-800">MYresume</span>
            {resumeId && <span className="px-2 py-0.5 rounded-md bg-gray-100 text-xs font-medium text-gray-500">Saved</span>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSaveToCloud} disabled={isSaving} className="bg-gray-100 text-gray-700 border border-gray-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 inline-flex items-center gap-1.5 transition-all disabled:opacity-50">
              <CloudUpload size={16}/> {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => window.print()} className="bg-blue-600 text-white border border-blue-600 px-4 py-2 rounded-lg text-sm font-bold inline-flex items-center gap-1.5 transition-all hover:bg-blue-700 active:scale-95 shadow-sm">
              <Printer size={16}/> Download PDF
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className={cn("flex-1 overflow-y-auto px-4 py-10 flex justify-center canvas-wrap", layoutClasses)} style={pageStyles}>
`;

content = content.replace(returnRegex, newShell);

content = content.replace('      <div className="pt-8 pb-16 px-4 flex justify-center canvas-wrap">', '');

fs.writeFileSync('components/ResumeBuilder.tsx', content);
