'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/ErrorBoundary';
import { supabase } from '@/lib/supabase';

const ResumeBuilder = dynamic(() => import('@/components/ResumeBuilder'), { 
  ssr: false,
  loading: () => <div className="h-screen w-full flex bg-gray-50 items-center justify-center text-gray-900 font-sans">Loading Editor...</div>
});

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isReady, setIsReady] = useState(false);
  const [initialTemplateId, setInitialTemplateId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const templateId = searchParams?.get('templateId') || undefined;
    setInitialTemplateId(templateId);
    setIsReady(true);
  }, [searchParams]);

  const handleBack = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      router.push('/dashboard');
    } else {
      router.push('/');
    }
  };

  if (!isReady) return null;

  return (
    <ErrorBoundary onReset={handleBack}>
      <ResumeBuilder onBack={handleBack} initialTemplateId={initialTemplateId} />
    </ErrorBoundary>
  );
}

export default function EditorPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Suspense fallback={<div className="h-screen w-full flex bg-gray-50 items-center justify-center text-gray-900 font-sans">Loading Editor...</div>}>
        <EditorContent />
      </Suspense>
    </main>
  );
}
