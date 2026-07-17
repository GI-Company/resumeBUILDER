'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Loader2, 
  Lock, 
  Copy, 
  LogOut, 
  Bot, 
  Sparkles, 
  ChevronRight, 
  Clock, 
  ArrowRight,
  Compass,
  FileCode,
  UserCheck
} from 'lucide-react';
import AuthModal from './AuthModal';
import { User } from '@supabase/supabase-js';

export default function Dashboard({ onOpenResume }: { onOpenResume: (id?: string) => void }) {
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
            fetchResumes();
        } else {
            setLoading(false);
        }
    });
  }, []);

  const fetchResumes = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/resume/list", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      const result = await response.json();
      if (result.success) {
        setResumes(result.data.filter((r: any) => r.status === 'active'));
      } else {
        toast.error("Failed to load resumes");
      }
    } catch (e) {
      toast.error("Error loading resumes");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'duplicate' | 'trash', id: string) => {
      if (action === 'duplicate') setDuplicatingId(id);
      if (action === 'trash') setDeletingId(id);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const endpoint = action === 'duplicate' ? '/api/resume/duplicate' : '/api/resume/status';
        const body = action === 'duplicate' ? { id } : { id, status: 'trash' };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 
              "Authorization": `Bearer ${session.access_token}`, 
              "Content-Type": "application/json" 
            },
            body: JSON.stringify(body)
        });
        const result = await response.json();
        if (result.success) {
            toast.success(`Resume successfully ${action === 'duplicate' ? 'duplicated' : 'archived'}`);
            fetchResumes();
        } else {
            toast.error(result.error || "Action failed");
        }
      } catch (err) {
        toast.error("Operation failed");
      } finally {
        setDuplicatingId(null);
        setDeletingId(null);
      }
  };

  const openResume = async (resume: any) => {
      localStorage.setItem("resume_autosave_content", JSON.stringify(resume.content));
      onOpenResume(resume.id);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Successfully logged out!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-600 selection:text-white">
        {/* Upper Navigation Header Skeleton */}
        <header className="border-b border-gray-200/80 bg-white sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-gray-200 h-9 w-9 rounded-xl animate-pulse" />
              <div className="h-5 bg-gray-200 rounded w-24 animate-pulse" />
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 border-r border-gray-200 pr-4">
                <div className="bg-gray-100 h-6 w-6 rounded-full animate-pulse" />
                <div className="space-y-1">
                  <div className="h-2 bg-gray-200 rounded w-12 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-28 animate-pulse" />
                </div>
              </div>
              <div className="h-8 bg-gray-200 rounded-lg w-20 animate-pulse" />
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-10">
          {/* Welcome Banner Card Skeleton */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-6 md:p-8 mb-10 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-3 max-w-xl flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                <div className="h-7 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="space-y-1.5 pt-1">
                  <div className="h-3 bg-gray-200 rounded w-full animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-5/6 animate-pulse" />
                </div>
              </div>
              <div className="h-11 bg-gray-200 rounded-xl w-44 shrink-0 animate-pulse" />
            </div>
            {/* Subtle background shimmer effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
          </div>

          {/* Resumes Header Skeleton */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-56 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-72 animate-pulse" />
            </div>
          </div>

          {/* Resumes Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className="border border-gray-200 rounded-2xl bg-white shadow-xs flex flex-col justify-between overflow-hidden h-[210px]"
              >
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-gray-100 h-10 w-10 rounded-xl animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                  </div>
                  <div className="mt-auto pt-2 border-t border-gray-100">
                    <div className="h-3 bg-gray-100 rounded w-3/4 animate-pulse" />
                  </div>
                </div>
                <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                  <div className="flex gap-3">
                    <div className="h-4 bg-gray-100 rounded-full w-4 animate-pulse" />
                    <div className="h-4 bg-gray-100 rounded-full w-4 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Aesthetic Footer Skeleton */}
        <footer className="bg-white border-t border-gray-200 mt-20 py-10">
          <div className="max-w-5xl mx-auto px-6 text-center space-y-4">
            <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto animate-pulse" />
            <div className="h-px bg-gray-100 max-w-xs mx-auto" />
            <div className="h-3 bg-gray-200 rounded w-32 mx-auto animate-pulse" />
          </div>
        </footer>
      </div>
    );
  }

  if (!user) {
    return (
        <div className="p-8 bg-gray-50 min-h-screen text-gray-900 flex flex-col items-center justify-center text-center">
            <div className="bg-white p-8 rounded-2xl border border-gray-200/80 max-w-sm w-full shadow-sm">
                <div className="bg-red-50 text-red-600 p-3.5 rounded-2xl inline-flex mb-4 border border-red-100">
                  <Lock size={24} />
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-1">Access Restricted</h1>
                <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                  You must be authenticated to access the Cloud Saves Dashboard. Guests can edit local drafts without logging in.
                </p>
                <div className='flex flex-col gap-2.5'>
                    <button 
                      onClick={() => setAuthModalOpen(true)} 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer"
                    >
                      Sign In to Account
                    </button>
                    <button 
                      onClick={() => onOpenResume('new')} 
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer"
                    >
                      Continue as Guest (Offline)
                    </button>
                </div>
            </div>
            <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Upper Navigation Header */}
      <header className="border-b border-gray-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-xl text-white shadow-xs">
              <Bot size={20} />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">
              Agent Rez <span className="text-blue-600 font-semibold text-xs bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Active User Email & Status Badge */}
            <div className="hidden sm:flex items-center gap-2 border-r border-gray-200 pr-4">
              <div className="bg-green-50 text-green-700 p-1 rounded-full border border-green-100">
                <UserCheck size={12} />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none">Active Session</p>
                <p className="text-xs font-semibold text-gray-700 leading-normal max-w-[150px] truncate">{user.email}</p>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-600 p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={16} />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Tier Welcome & Promotion Card */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-sm border border-indigo-950/40 relative overflow-hidden mb-10">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 bg-blue-500/15 border border-blue-400/20 px-3 py-1 rounded-full text-blue-300 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles size={12} className="text-blue-400 animate-pulse" />
                <span>AI Included ⚡</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight leading-tight">
                Welcome back to your Career Command Center
              </h2>
              <p className="text-xs text-indigo-200/80 leading-relaxed">
                Request capacity adjusts with demand to keep the service fast for everyone. You get full access to 6 premium templates, watermarks-free prints, and live automatic cloud synchronization for all drafts.
              </p>
            </div>

            <button 
              onClick={() => onOpenResume('new')}
              className="bg-white hover:bg-blue-50 text-indigo-950 px-5 py-3.5 rounded-xl font-extrabold text-xs shadow-md transition-all shrink-0 flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Plus size={16} className="text-blue-600" />
              <span>Create New Resume</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform text-blue-600" />
            </button>
          </div>

          {/* Glowing gradient background accents */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Resumes Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Your Saved Cloud Resumes ({resumes.length})
            </h3>
            <p className="text-[11px] text-gray-500">Auto-saves every single edit live to secure database.</p>
          </div>
        </div>

        {/* Resumes Grid / Empty State */}
        {resumes.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[280px]">
            <div className="bg-blue-50 text-blue-600 p-4 rounded-full border border-blue-100 mb-4 shadow-inner">
              <FileCode size={28} />
            </div>
            <h4 className="text-sm font-bold text-gray-900 mb-1">
              Let's craft your first masterpiece!
            </h4>
            <p className="text-xs text-gray-500 max-w-sm leading-relaxed mb-6">
              You haven't saved any cloud resumes yet. Kickstart one now using any of our premium templates or with your active conversational AI assistant!
            </p>
            <button 
              onClick={() => onOpenResume('new')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={15} />
              <span>Launch New Document</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {resumes.map((r) => (
              <div 
                key={r.id} 
                className="group relative border border-gray-200 rounded-2xl bg-white shadow-xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between overflow-hidden" 
              >
                {/* Accent indicator bar on top of card */}
                <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Main clickable body */}
                <div 
                  className="p-5 cursor-pointer flex-1 flex flex-col" 
                  onClick={() => openResume(r)}
                  title="Click to edit resume"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl border border-blue-100">
                      <FileText size={18} />
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <Clock size={11} />
                      <span>{new Date(r.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <h5 className="font-extrabold text-sm text-gray-900 group-hover:text-blue-600 transition-colors truncate mb-1">
                    {r.content.name || 'Untitled Resume'}
                  </h5>
                  <p className="text-[11px] text-gray-500 font-medium truncate leading-relaxed">
                    {r.content.basics?.label || 'General Professional'}
                  </p>
                  
                  {r.content.work && r.content.work.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-1">
                      <span className="text-[10px] text-gray-400 font-medium truncate">
                        💼 Last Position: {r.content.work[0].company || r.content.work[0].position}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <button 
                    onClick={() => openResume(r)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                  >
                    <span>Edit Draft</span>
                    <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleAction('duplicate', r.id)} 
                      disabled={duplicatingId === r.id}
                      className="text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer"
                      title="Duplicate Draft"
                    >
                      {duplicatingId === r.id ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14}/>}
                    </button>
                    <button 
                      onClick={() => handleAction('trash', r.id)} 
                      disabled={deletingId === r.id}
                      className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Move to Trash"
                    >
                      {deletingId === r.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14}/>}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Aesthetic Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20 py-10">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-4">
          <p className="text-[11px] text-gray-400 leading-relaxed max-w-sm mx-auto">
            Your career documents are securely stored inside our cloud PostgreSQL cluster under industry-standard Supabase encryption protocol.
          </p>
          <div className="h-px bg-gray-100 max-w-xs mx-auto" />
          <p className="text-[10px] text-gray-400">
            &copy; {new Date().getFullYear()} Agent Rez AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
