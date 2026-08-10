'use client';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ExitIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignupClick: () => void;
}

export default function ExitIntentModal({ isOpen, onClose, onSignupClick }: ExitIntentModalProps) {
  // Prevent hydration errors by only rendering on client
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col md:flex-row"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10 bg-white/80 rounded-full p-1"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div className="p-8 md:p-10 text-center w-full relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />
              
              <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
                Wait! Don't leave without your <span className="text-blue-600">Free ATS Resume</span>.
              </h2>
              
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                70% of resumes are rejected by ATS bots before a human ever sees them. Create your account now to unlock guaranteed ATS-friendly templates.
              </p>

              <div className="space-y-3 mb-8 text-left max-w-sm mx-auto">
                <div className="flex items-center gap-2.5 text-xs text-gray-700 font-semibold">
                  <CheckCircle size={16} className="text-emerald-500" />
                  <span>100% Free to use, no credit card required</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-gray-700 font-semibold">
                  <CheckCircle size={16} className="text-emerald-500" />
                  <span>Unlimited ATS formatting</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-gray-700 font-semibold">
                  <CheckCircle size={16} className="text-emerald-500" />
                  <span>Access to AI-powered bullet points</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onSignupClick();
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl hover:shadow-lg active:scale-95 transition-all text-sm"
              >
                Claim My Free Account
              </button>
              
              <button
                onClick={onClose}
                className="mt-4 text-xs text-gray-500 font-semibold hover:text-gray-800 transition-colors"
              >
                No thanks, I'll risk the ATS bots
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
