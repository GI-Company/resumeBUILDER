const fs = require('fs');
let content = fs.readFileSync('components/ResumeBuilder.tsx', 'utf8');

content = content.replace(
  "import { z } from 'zod';",
  "import { z } from 'zod';\nimport AuthModal from './AuthModal';\nimport { User } from '@supabase/supabase-js';"
);

content = content.replace(
  "  const [clientId, setClientId] = useState<string>('');",
  "  const [clientId, setClientId] = useState<string>('');\n  const [user, setUser] = useState<User | null>(null);\n  const [authModalOpen, setAuthModalOpen] = useState(false);\n  const [resumesListOpen, setResumesListOpen] = useState(false);\n  const [myResumes, setMyResumes] = useState<any[]>([]);"
);

content = content.replace(
  "    // Load from URL if present",
  `    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchMyResumes();
    });

    // Load from URL if present`
);

content = content.replace(
  "  const loadResumeFromCloud = async (id: string) => {",
  `  const fetchMyResumes = async () => {
    try {
      const { data, error } = await supabase.from('resumes').select('id, updated_at').order('updated_at', { ascending: false });
      if (error) throw error;
      setMyResumes(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out');
  };

  const loadResumeFromCloud = async (id: string) => {`
);

content = content.replace(
  `<button onClick={() => setTutorialOpen(true)} className="bg-[#372c3b] text-[#f2ecef] border border-[#4d3f52] px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-[#4a3c50] inline-flex items-center gap-1.5"><HelpCircle size={16}/> Help</button>`,
  `<button onClick={() => setTutorialOpen(true)} className="bg-[#372c3b] text-[#f2ecef] border border-[#4d3f52] px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-[#4a3c50] inline-flex items-center gap-1.5"><HelpCircle size={16}/> Help</button>
        {user ? (
          <div className="relative">
            <button onClick={() => setResumesListOpen(!resumesListOpen)} className="bg-[#372c3b] text-[#f2ecef] border border-[var(--accent)] px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-[#4a3c50] inline-flex items-center gap-1.5">My Account</button>
            {resumesListOpen && (
              <div className="absolute top-full mt-2 right-0 w-64 bg-[#241f26] border border-[#443f47] rounded-md shadow-xl p-2 z-[100] no-print">
                <div className="text-xs text-[#a19b9d] mb-2 px-2 py-1">{user.email}</div>
                <div className="max-h-48 overflow-y-auto mb-2 border-t border-b border-[#33303a]">
                  {myResumes.length === 0 ? (
                    <div className="p-3 text-xs text-[#6b6568] text-center">No saved resumes found.</div>
                  ) : (
                    myResumes.map(r => (
                      <button key={r.id} onClick={() => { setResumeId(r.id); loadResumeFromCloud(r.id); setResumesListOpen(false); }} className="block w-full text-left px-2 py-2 text-sm text-[#f2ecef] hover:bg-[#33303a] rounded-md truncate">
                        Resume {r.id.substring(0, 8)}...
                      </button>
                    ))
                  )}
                </div>
                <button onClick={() => { setResumeId(null); setResumesListOpen(false); }} className="w-full text-left px-2 py-1.5 text-sm text-[#f2ecef] hover:bg-[#33303a] rounded-md mb-1">+ New Resume</button>
                <button onClick={handleLogout} className="w-full text-left px-2 py-1.5 text-sm text-[var(--danger)] hover:bg-black/20 rounded-md">Log Out</button>
              </div>
            )}
          </div>
        ) : (
          <button onClick={() => setAuthModalOpen(true)} className="bg-[#372c3b] text-[#f2ecef] border border-[#4d3f52] px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-[#4a3c50] inline-flex items-center gap-1.5">Log In / Sign Up</button>
        )}`
);

content = content.replace(
  `{/* Design Panel */}`,
  `<AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      {/* Design Panel */}`
);

fs.writeFileSync('components/ResumeBuilder.tsx', content);
