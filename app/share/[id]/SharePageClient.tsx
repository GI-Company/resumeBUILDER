"use client";

import React, { useEffect, useState } from "react";
import { Printer, ArrowRight, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import ShareTemplate from "@/components/ShareTemplate";

interface SharePageClientProps {
  id: string;
}

export default function SharePageClient({ id }: SharePageClientProps) {
  const [resumeData, setResumeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResume() {
      try {
        const res = await fetch(`/api/resume/public-get?id=${id}`);
        const result = await res.json();
        if (!res.ok || !result.success) {
          throw new Error(result.error || "Could not retrieve this shared resume.");
        }
        setResumeData(result.data.content);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }
    fetchResume();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Retrieving secure shared resume...</p>
        </div>
      </div>
    );
  }

  if (error || !resumeData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mb-4">
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Resume Not Found</h2>
          <p className="text-sm text-slate-500 mb-6">
            The shared link may be incorrect, or the owner may have removed or set the resume to private.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-text pb-12">
      {/* Top action bar - Hidden in Print */}
      <div className="no-print sticky top-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-50 px-4 py-3 shadow-xs">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-[family:'Kalam',cursive] font-bold text-sm">
              R
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                Public Shared Resume
                <CheckCircle size={13} className="text-green-500 shrink-0" />
              </p>
              <p className="text-[10px] text-slate-500 font-mono">ID: {id.substring(0, 8)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Printer size={13} />
              <span>Print / Save as PDF</span>
            </button>
            <Link
              href="/"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <span>Build Mine Now</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Styled Canvas Area */}
      <div className="flex-1 px-4 py-6 sm:py-10 flex justify-center print:p-0 print:block">
        <div className="w-full max-w-4xl">
          <ShareTemplate resumeData={resumeData} />
        </div>
      </div>
    </div>
  );
}
