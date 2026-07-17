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

  const handleOpenResume = (id?: string, templateId?: string) => {
    if (id && id !== 'new') {
      window.history.pushState({}, '', `?id=${id}`);
    } else {
      window.history.pushState({}, '', window.location.pathname);
    }
    setShowBuilder(true);
    setInitialTemplateId(templateId);
  };

  const handleCloseBuilder = () => {
    window.history.pushState({}, '', window.location.pathname);
    setShowBuilder(false);
    setInitialTemplateId(undefined);
  };

  const [initialTemplateId, setInitialTemplateId] = useState<string | undefined>(undefined);

  if (loading) return null;

  if (showBuilder) {
      return (
        <div className="min-h-screen bg-gray-50">
            <ResumeBuilder onBack={handleCloseBuilder} initialTemplateId={initialTemplateId} />
        </div>
      );
  }

  if (session) {
    return <Dashboard onOpenResume={handleOpenResume} />;
  }

  return <LandingPage onOpenResume={(templateId) => handleOpenResume('new', templateId)} />;
}
