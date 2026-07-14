'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Dashboard from '@/components/Dashboard';
import LandingPage from '@/components/LandingPage';
import dynamic from 'next/dynamic';

const ResumeBuilder = dynamic(() => import('@/components/ResumeBuilder'), { 
  ssr: false,
  loading: () => <div className="h-screen w-full flex bg-gray-50 items-center justify-center text-gray-900">Loading Editor...</div>
});

export default function Page() {
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      // Automatically show the builder on page load if an ID query parameter exists in the URL
      const params = new URLSearchParams(window.location.search);
      if (params.has('id')) {
        setShowBuilder(true);
      }
      
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleOpenResume = (id?: string) => {
    if (id && id !== 'new') {
      window.history.pushState({}, '', `?id=${id}`);
    } else {
      window.history.pushState({}, '', window.location.pathname);
    }
    setShowBuilder(true);
  };

  const handleCloseBuilder = () => {
    window.history.pushState({}, '', window.location.pathname);
    setShowBuilder(false);
  };

  if (loading) return null;

  if (showBuilder) {
      return (
        <div className="min-h-screen bg-gray-50">
            <button 
                onClick={handleCloseBuilder} 
                className="fixed top-4 left-4 z-50 text-gray-900 bg-white border border-gray-200 p-2.5 rounded-xl text-xs font-bold hover:bg-gray-100 shadow-sm transition-all cursor-pointer flex items-center gap-1.5 no-print"
            >
                ← Back to Dashboard
            </button>
            <ResumeBuilder />
        </div>
      );
  }

  if (session) {
    return <Dashboard onOpenResume={handleOpenResume} />;
  }

  return <LandingPage onOpenResume={() => handleOpenResume('new')} />;
}
