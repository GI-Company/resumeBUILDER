import Link from 'next/link';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 py-16 font-sans">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-indigo-50 text-indigo-500 border border-indigo-100 mb-8">
          <FileQuestion className="w-10 h-10" />
        </div>

        {/* Status */}
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-400 mb-3">
          Error 404
        </p>

        {/* Heading */}
        <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-3">
          Page Not Found
        </h1>

        {/* Description */}
        <p className="text-sm text-gray-500 leading-relaxed mb-10 max-w-sm mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          If you followed a link, it might be outdated.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-bold transition-all shadow-sm"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-sm font-bold transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
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
