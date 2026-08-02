'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import posthog from 'posthog-js';
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
  UserCheck,
  Briefcase
} from 'lucide-react';
import AuthModal from './AuthModal';
import { User } from '@supabase/supabase-js';
import { JobTracker } from './JobTracker';

export default function Dashboard({ onOpenResume }: { onOpenResume: (id?: string) => void }) {
  const [allResumes, setAllResumes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'trash'>('active');
  const [currentView, setCurrentView] = useState<'resumes' | 'tracker' | 'settings'>('resumes');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [trashConfirmId, setTrashConfirmId] = useState<string | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [entitlement, setEntitlement] = useState<{ tier: string; stripe_subscription_id?: string; subscription_status?: string } | null>(null);
  const [aiLimit, setAiLimit] = useState<{ count: number; allowed: boolean; remaining: number } | null>(null);

  const resumes = allResumes.filter((r) => r.status === activeTab);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
            posthog.identify(session.user.id, { email: session.user.email });
            
            // Seamless Hand-off: if user just came from ATS Scanner, send them straight to editor
            if (typeof window !== 'undefined' && sessionStorage.getItem('pending_resume_text')) {
                onOpenResume();
                return;
            }

            fetchResumes();
            fetchEntitlements(session.user.id);
        } else {
            setLoading(false);
        }
    });
  }, []);

  const fetchEntitlements = async (userId: string) => {
    try {
      const { data: entData, error: entError } = await supabase.from('entitlements').select('*').eq('user_id', userId).maybeSingle();
      if (entError) console.error('Entitlements fetch error:', entError);
      
      const safeTier = entData?.tier || 'free';
      if (entData) setEntitlement(entData);

      const tierMax = safeTier === 'premium_founder' ? 100 : safeTier === 'founder' ? 75 : safeTier === 'premium' ? 75 : safeTier === 'free' ? 15 : 5;

      // AI Limit is returned via RPC but we don't have a direct GET RPC. 
      // Just fetch the raw table for count if needed, or we can assume limits based on tier.
      const { data: limitData } = await supabase.from('user_ai_limits').select('*').eq('user_id', userId).maybeSingle();
      if (limitData) {
        setAiLimit({ count: limitData.count, allowed: limitData.count < tierMax, remaining: Math.max(0, tierMax - limitData.count) });
      } else {
        // No row yet means user hasn't made any AI requests — show 0 used out of their full limit
        setAiLimit({ count: 0, allowed: true, remaining: tierMax });
      }
    } catch (e) {
      console.error("Error fetching entitlements", e);
    }
  };

  const fetchResumes = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/resume/list", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      const result = await response.json();
      if (result.success) {
        setAllResumes(result.data);
      } else {
        toast.error("Failed to load resumes");
      }
    } catch (e) {
      toast.error("Error loading resumes");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'duplicate' | 'trash' | 'restore', id: string) => {
      if (action === 'duplicate') setDuplicatingId(id);
      if (action === 'trash') setDeletingId(id);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const endpoint = action === 'duplicate' ? '/api/resume/duplicate' : '/api/resume/status';
        const body = action === 'duplicate' ? { id } : { id, status: action === 'restore' ? 'active' : 'trash' };

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
            if (action === 'duplicate') posthog.capture('resume_duplicated', { resume_id: id });
            if (action === 'trash') posthog.capture('resume_trashed', { resume_id: id });
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

  const handleRename = async (id: string, newName: string) => {
    if (!newName.trim()) return;
    setEditingTitleId(null);
    const target = allResumes.find(r => r.id === id);
    if (!target) return;
    if ((target.content.resumeName || target.content.name) === newName.trim()) return;

    const toastId = toast.loading("Renaming...");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const newContent = { ...target.content, resumeName: newName.trim() };
      const response = await fetch('/api/resume/save', {
        method: 'POST',
        headers: { "Authorization": `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id, content: newContent, clientId: 'web', status: target.status })
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Renamed successfully", { id: toastId });
        fetchResumes();
      } else {
        toast.error("Rename failed", { id: toastId });
      }
    } catch (e) {
      toast.error("Rename error", { id: toastId });
    }
  };

  const openResume = async (resume: any) => {
      localStorage.setItem("resume_autosave_content", JSON.stringify(resume.content));
      posthog.capture('resume_opened', { resume_id: resume.id });
      onOpenResume(resume.id);
  };

  const handleCreateNew = () => {
    posthog.capture('resume_created');
    onOpenResume('new');
  };

  const handleLogout = async () => {
    posthog.capture('user_signed_out');
    posthog.reset();
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
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-sm border border-indigo-950/40 relative overflow-hidden mb-10 flex flex-col md:flex-row justify-between gap-6">
          <div className="relative z-10 flex flex-col gap-4 max-w-xl">
            <div className="inline-flex items-center gap-1.5 bg-blue-500/15 border border-blue-400/20 w-fit px-3 py-1 rounded-full text-blue-300 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles size={12} className="text-blue-400 animate-pulse" />
              <span>Current Tier: {entitlement?.tier === 'founder' ? 'Founding Member' : entitlement?.tier === 'premium' ? 'Premium' : entitlement?.tier === 'premium_founder' ? 'Founding Premium' : 'Free'}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight leading-tight">
              Welcome back to your Career Command Center
            </h2>
            <div className="text-xs text-indigo-200/80 leading-relaxed">
              <p className="mb-2"><strong>AI Request Usage:</strong> {aiLimit ? `${aiLimit.count} used / ${aiLimit.remaining} remaining today` : 'Loading...'}</p>
              <p>You get full access to premium templates, watermarks-free prints, and live automatic cloud synchronization for all drafts.</p>
            </div>
          </div>
          
          <div className="relative z-10 flex flex-col justify-center gap-3 shrink-0">
            <button
              onClick={handleCreateNew}
              className="bg-white hover:bg-blue-50 text-indigo-950 px-5 py-3.5 rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Plus size={16} className="text-blue-600" />
              <span>Create New Resume</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform text-blue-600" />
            </button>
            <Link
              href="/interview"
              className="bg-indigo-800/50 hover:bg-indigo-800/70 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-inner transition-all flex items-center justify-center gap-2 cursor-pointer border border-indigo-700/50"
            >
              <span>Start Guided Interview</span>
            </Link>
            <Link
              href="/audit"
              className="bg-indigo-800/50 hover:bg-indigo-800/70 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-inner transition-all flex items-center justify-center gap-2 cursor-pointer border border-indigo-700/50"
            >
              <span>Instant Resume Audit</span>
            </Link>
            {entitlement?.tier === 'free' && (
               <button
                 onClick={async () => {
                    const toastId = toast.loading('Redirecting to checkout...');
                    try {
                      // Placeholder for Phase 2: Create Checkout Session
                      const res = await fetch('/api/stripe/checkout', {
                          method: 'POST',
                          headers: { 
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                          },
                          body: JSON.stringify({}) // Price ID is securely determined server-side
                      });
                      const data = await res.json();
                      if (res.ok && data.url) {
                        window.location.href = data.url;
                      } else {
                        toast.error(`Checkout failed: ${data.error || 'Server Error'}`, { id: toastId });
                      }
                    } catch (e: any) {
                      toast.error(`Checkout failed: ${e.message || 'Network error'}`, { id: toastId });
                    }
                 }}
                 className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3.5 rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
               >
                 <Sparkles size={16} className="text-white" />
                 <span>Upgrade to Premium</span>
               </button>
            )}
          </div>

          {/* Glowing gradient background accents */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Dashboard Navigation */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => setCurrentView('resumes')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${currentView === 'resumes' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
          >
            <FileText size={16} /> Cloud Resumes
          </button>
          <button 
            onClick={() => setCurrentView('tracker')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${currentView === 'tracker' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
          >
            <Briefcase size={16} /> Job Tracker
          </button>
          <button 
            onClick={() => setCurrentView('settings')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${currentView === 'settings' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
          >
            <UserCheck size={16} /> Account Settings
          </button>
        </div>

        {currentView === 'tracker' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[600px] flex flex-col">
            <JobTracker />
          </div>
        ) : currentView === 'resumes' ? (
          <>
            {/* Resumes Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <span 
                className={`cursor-pointer pb-1 ${activeTab === 'active' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('active')}
              >
                Saved Cloud Resumes
              </span>
              <span className="text-gray-300">|</span>
              <span 
                className={`cursor-pointer pb-1 ${activeTab === 'trash' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('trash')}
              >
                Trash
              </span>
              <span className="text-gray-400 font-normal">({resumes.length})</span>
            </h3>
            <p className="text-[11px] text-gray-500 mt-1">Auto-saves every single edit live to secure database.</p>
          </div>
          {activeTab === 'active' && (
            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 shadow-inner">
              <div className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Storage</div>
              <div className="text-xs font-black text-blue-600">{resumes.length} <span className="text-gray-400 font-normal">/ 3</span></div>
            </div>
          )}
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
              {activeTab === 'active' 
                ? "You haven't saved any cloud resumes yet. Kickstart one now using any of our premium templates or with your active conversational AI assistant!"
                : "Your trash is empty."}
            </p>
            {activeTab === 'active' && (
              <button
                onClick={handleCreateNew}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={15} />
                <span>Launch New Document</span>
              </button>
            )}
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

                  <div className="flex items-center gap-2 mb-1 group/title">
                    {editingTitleId === r.id ? (
                      <input 
                        type="text" 
                        autoFocus
                        value={editTitleValue}
                        onChange={(e) => setEditTitleValue(e.target.value)}
                        onBlur={() => handleRename(r.id, editTitleValue)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(r.id, editTitleValue);
                          if (e.key === 'Escape') setEditingTitleId(null);
                        }}
                        className="w-full text-sm font-extrabold text-gray-900 border-b-2 border-blue-500 focus:outline-none bg-blue-50/50 px-1 py-0.5 rounded-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <h5 
                        className="font-extrabold text-sm text-gray-900 group-hover:text-blue-600 transition-colors truncate"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTitleId(r.id);
                          setEditTitleValue(r.content.resumeName || r.content.name || 'Untitled Resume');
                        }}
                        title="Click to rename"
                      >
                        {r.content.resumeName || r.content.name || 'Untitled Resume'}
                      </h5>
                    )}
                  </div>
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
                    onClick={() => activeTab === 'active' ? openResume(r) : handleAction('restore', r.id)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                  >
                    <span>{activeTab === 'active' ? 'Edit Draft' : 'Restore'}</span>
                    {activeTab === 'active' && <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />}
                  </button>

                  <div className="flex items-center gap-3">
                    {activeTab === 'active' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleAction('duplicate', r.id); }} 
                        disabled={duplicatingId === r.id}
                        className="text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer"
                        title="Duplicate Draft"
                      >
                        {duplicatingId === r.id ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14}/>}
                      </button>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleAction('trash', r.id); }} 
                      disabled={deletingId === r.id}
                      className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                      title={activeTab === 'active' ? "Move to Trash" : "Delete Permanently (Not implemented yet)"}
                    >
                      {deletingId === r.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14}/>}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
          </>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Account Settings</h3>
            
            <div className="space-y-8">
              {/* Profile Section */}
              <div className="border-b border-gray-100 pb-8">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Profile Details</h4>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold mb-1">Email Address</p>
                      <p className="text-sm font-bold text-gray-900">{user.email}</p>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 font-semibold mb-1">User ID</p>
                    <p className="text-xs font-mono text-gray-700">{user.id}</p>
                  </div>
                </div>
              </div>

              {/* Subscription & Usage Section */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Plan & Usage</h4>
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex-1">
                      <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full text-blue-700 text-[10px] font-bold uppercase tracking-wider mb-3">
                        <Sparkles size={12} className="text-blue-600" />
                        <span>{entitlement?.tier === 'founder' ? 'Founding Member (Free)' : entitlement?.tier === 'premium_founder' ? 'Founding Premium ($3.99/mo)' : entitlement?.tier === 'premium' ? 'Premium ($9.99/mo)' : 'Free Tier'}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4 max-w-sm">
                        You have access to premium templates, offline saving, and priority AI limits based on your tier.
                      </p>
                      
                      <div className="space-y-4 max-w-sm">
                        <div>
                          <div className="flex justify-between text-xs font-bold text-gray-700 mb-1.5">
                            <span>Daily AI Requests</span>
                            <span>{aiLimit?.count || 0} / {(aiLimit?.count || 0) + (aiLimit?.remaining || 0)}</span>
                          </div>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 rounded-full" 
                              style={{ width: `${Math.min(100, ((aiLimit?.count || 0) / Math.max(1, ((aiLimit?.count || 0) + (aiLimit?.remaining || 0)))) * 100)}%` }} 
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs font-bold text-gray-700 mb-1.5">
                            <span>Cloud Storage Slots</span>
                            <span>{allResumes.filter(r => r.status !== 'trash').length} / 3</span>
                          </div>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: `${Math.min(100, (allResumes.filter(r => r.status !== 'trash').length / 3) * 100)}%` }} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-6 md:w-64 shrink-0">
                      {entitlement?.stripe_subscription_id ? (
                        <button
                          onClick={async () => {
                            const toastId = toast.loading('Opening Stripe Portal...');
                            try {
                              const res = await fetch('/api/stripe/portal', {
                                method: 'POST',
                                headers: { 
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                                }
                              });
                              const data = await res.json();
                              if (data.url) {
                                window.location.href = data.url;
                              } else {
                                toast.error('Failed to open billing portal', { id: toastId });
                              }
                            } catch (e) {
                              toast.error('Network error', { id: toastId });
                            }
                          }}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Lock size={14} />
                          Manage Subscription
                        </button>
                      ) : (!entitlement?.stripe_subscription_id && (entitlement?.tier === 'free' || entitlement?.tier === 'founder' || !entitlement?.tier)) ? (
                        <>
                          <button
                            onClick={async () => {
                              const toastId = toast.loading('Redirecting to checkout...');
                              try {
                                const res = await fetch('/api/stripe/checkout', {
                                  method: 'POST',
                                  headers: { 
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                                  },
                                  body: JSON.stringify({})
                                });
                                const data = await res.json();
                                if (res.ok && data.url) {
                                  window.location.href = data.url;
                                } else {
                                  toast.error(`Checkout failed: ${data.error || 'Server Error'}`, { id: toastId });
                                }
                              } catch (e: any) {
                                toast.error(`Checkout error: ${e.message}`, { id: toastId });
                              }
                            }}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Sparkles size={14} />
                            {entitlement?.tier === 'founder' ? 'Upgrade to Premium Founder ($3.99/mo)' : 'Upgrade to Premium'}
                          </button>
                          {entitlement?.tier === 'founder' && (
                            <p className="text-[10px] text-gray-400 text-center mt-2">You already have lifetime priority AI access (75/day). Upgrading unlocks 100/day + advanced features.</p>
                          )}
                        </>
                      ) : (
                        <div className="bg-gray-50 text-gray-500 border border-gray-200 text-xs font-semibold p-4 rounded-xl text-center shadow-inner">
                          You are on a Free for Life Founding Tier. No billing management required!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
