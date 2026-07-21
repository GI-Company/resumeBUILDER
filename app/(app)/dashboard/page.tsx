'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Dashboard from '@/components/Dashboard';

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/');
      } else {
        setSession(session);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/');
      } else {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleOpenResume = (id?: string, templateId?: string) => {
    if (id && id !== 'new') {
      router.push(`/editor?id=${id}`);
    } else if (templateId) {
      router.push(`/editor?templateId=${templateId}`);
    } else {
      router.push('/editor?id=new');
    }
  };

  if (loading) {
    return <div className="h-screen w-full flex bg-gray-50 items-center justify-center text-gray-900 font-sans">Loading Dashboard...</div>;
  }

  return <Dashboard onOpenResume={handleOpenResume} />;
}
