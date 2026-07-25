'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error for server-side observability (Vercel logs, etc.)
    console.error('[Global Error Boundary]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 py-16 font-sans">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-rose-50 text-rose-500 border border-rose-100 mb-8">
          <AlertTriangle className="w-10 h-10" />
        </div>

        {/* Status */}
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-400 mb-3">
          Runtime Error
        </p>

        {/* Heading */}
        <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-3">
          Something Went Wrong
        </h1>

        {/* Description */}
        <p className="text-sm text-gray-500 leading-relaxed mb-4 max-w-sm mx-auto">
          An unexpected error occurred. Your resume data is safe — this is a temporary application issue.
        </p>

        {/* Error details (non-sensitive digest only) */}
        {error.digest && (
          <p className="text-[10px] font-mono text-gray-400 bg-gray-100 rounded-lg px-3 py-2 mb-8 inline-block">
            Error ID: {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-sm font-bold transition-all shadow-sm"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-16 text-[10px] text-gray-400 font-medium">
        &copy; {new Date().getFullYear()} Agent Rez AI
      </p>
    </div>
  );
}
