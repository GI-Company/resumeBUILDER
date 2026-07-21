'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import LandingPage from '@/components/LandingPage';

export default function MarketingPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/dashboard');
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

  return <LandingPage onOpenResume={handleOpenResume} />;
}
