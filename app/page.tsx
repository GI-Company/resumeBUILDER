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
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;

  if (showBuilder) {
      return (
        <div className="min-h-screen bg-gray-50">
            <button 
                onClick={() => setShowBuilder(false)} 
                className="fixed top-4 left-4 z-50 text-gray-900 bg-white border border-gray-200 p-2 rounded-lg text-xs font-bold hover:bg-gray-100"
            >
                Dashboard
            </button>
            <ResumeBuilder />
        </div>
      );
  }

  if (session) {
    return <Dashboard onOpenResume={() => setShowBuilder(true)} />;
  }

  return <LandingPage onOpenResume={() => setShowBuilder(true)} />;
}
