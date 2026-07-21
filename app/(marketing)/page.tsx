'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import LandingPage from '@/components/LandingPage';

export default function MarketingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/dashboard');
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleOpenResume = (templateId: string) => {
    if (templateId && templateId !== 'new' && templateId !== 'classic') {
      router.push(`/editor?templateId=${templateId}`);
    } else {
      router.push('/editor?id=new');
    }
  };

  if (loading) {
    return <div className="h-screen w-full flex bg-gray-50 items-center justify-center text-gray-900 font-sans">Loading...</div>;
  }

  return <LandingPage onOpenResume={handleOpenResume} />;
}
