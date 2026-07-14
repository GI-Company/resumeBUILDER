'use client';
import { useState } from 'react';
import AuthModal from './AuthModal';

export default function LandingPage({ onOpenResume }: { onOpenResume: () => void }) {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-extrabold tracking-tighter mb-6">Agent Rez</h1>
        <p className="text-xl text-gray-600 mb-10">Professional resume building, powered by AI.</p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={onOpenResume} className="bg-gray-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-black transition-all">
                Create Resume (Guest)
            </button>
            <button onClick={() => setAuthModalOpen(true)} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all">
                Sign In / Create Account
            </button>
        </div>
        
        <p className="mt-8 text-xs text-gray-400">
            Agent Rez AI is provided "as-is". Please verify all AI-generated content before use.
        </p>
      </div>
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
