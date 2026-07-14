'use client';

import dynamic from 'next/dynamic';

const ResumeBuilder = dynamic(() => import('@/components/ResumeBuilder'), { 
  ssr: false,
  loading: () => (
    <div className="h-screen w-full flex bg-[#050505] items-center justify-center">
      <div className="animate-pulse text-gray-500 font-bold uppercase tracking-widest text-xs">Synchronizing Workspace...</div>
    </div>
  )
});

export default function Page() {
  return <ResumeBuilder />;
}
