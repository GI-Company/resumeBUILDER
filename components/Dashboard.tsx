'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { FileText, Plus, Trash2, Loader2, Lock, Copy } from 'lucide-react';
import AuthModal from './AuthModal';
import { User } from '@supabase/supabase-js';

export default function Dashboard({ onOpenResume }: { onOpenResume: (id: string) => void }) {
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

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
      if (result.success) setResumes(result.data.filter((r: any) => r.status === 'active'));
      else toast.error("Failed to load resumes");
    } catch (e) {
      toast.error("Error loading resumes");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'duplicate' | 'trash', id: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const endpoint = action === 'duplicate' ? '/api/resume/duplicate' : '/api/resume/status';
      const body = action === 'duplicate' ? { id } : { id, status: 'trash' };

      const response = await fetch(endpoint, {
          method: 'POST',
          headers: { "Authorization": `Bearer ${session.access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify(body)
      });
      const result = await response.json();
      if (result.success) {
          toast.success(`Resume ${action === 'duplicate' ? 'duplicated' : 'trashed'}`);
          fetchResumes();
      } else {
          toast.error(result.error || "Action failed");
      }
  }

  const openResume = async (resume: any) => {
      localStorage.setItem("resume_autosave_content", JSON.stringify(resume.content));
      onOpenResume(resume.id);
  };

  if (loading) return <div className="h-screen w-full flex items-center justify-center text-gray-900"><Loader2 className="animate-spin" /></div>;

  if (!user) {
    return (
        <div className="p-8 bg-gray-50 min-h-screen text-gray-900 flex flex-col items-center justify-center text-center">
            <Lock size={48} className="text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Login Required</h1>
            <p className="text-sm text-gray-500 mb-6">Please sign in to access your dashboard and manage resumes.</p>
            <div className='flex gap-4'>
                <button onClick={() => setAuthModalOpen(true)} className="bg-blue-600 px-6 py-3 rounded-lg font-bold text-white">Sign In</button>
                <button onClick={() => onOpenResume('new')} className="bg-gray-200 px-6 py-3 rounded-lg font-bold text-gray-900">Continue as Guest</button>
            </div>
            <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">My Resumes</h1>
            <button onClick={() => onOpenResume('new')} className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-lg font-bold text-white">
                <Plus size={18} /> New Resume
            </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {resumes.map((r) => (
                <div key={r.id} className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm flex flex-col justify-between" >
                    <div className="cursor-pointer" onClick={() => openResume(r)}>
                        <FileText className="mb-4 text-blue-600" />
                        <p className="font-bold truncate">{r.content.name || 'Untitled Resume'}</p>
                        <p className="text-xs text-gray-500">{new Date(r.updated_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                        <button onClick={() => handleAction('duplicate', r.id)} className="text-gray-400 hover:text-blue-600"><Copy size={16}/></button>
                        <button onClick={() => handleAction('trash', r.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16}/></button>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
