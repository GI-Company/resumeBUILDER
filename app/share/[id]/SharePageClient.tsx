"use client";

import React, { useEffect, useState } from "react";
import { Printer, ArrowRight, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";

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

  // Extract variables with intelligent fallbacks
  const {
    name = "ALEX MORGAN",
    contactLine = "alex.morgan@email.com",
    summary = "",
    experiences = [],
    educations = [],
    skills = [],
    design = {}
  } = resumeData;

  const accentColor = design.accentColor || "#1e3a8a"; // default slate-blue
  const fontFamily = design.fontFamily || "Inter";

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
      <div className="flex-1 px-4 py-6 sm:py-10 flex justify-center">
        <div 
          className="bg-white shadow-lg border border-slate-200 rounded-xs w-full max-w-[816px] p-10 sm:p-14 print:p-0 print:shadow-none print:border-none transition-all duration-300"
          style={{
            fontFamily: fontFamily === "serif" ? "Georgia, serif" : fontFamily === "mono" ? "monospace" : "sans-serif",
            "--accent": accentColor,
          } as React.CSSProperties}
        >
          {/* Header */}
          <div className="text-center border-b border-gray-200 pb-5 mb-6">
            <h1 
              className="text-3xl font-extrabold tracking-tight mb-2 uppercase"
              style={{ color: "var(--accent)" }}
            >
              {name}
            </h1>
            <div 
              className="text-xs text-slate-600 flex flex-wrap justify-center gap-2 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: contactLine }}
            />
          </div>

          {/* Professional Summary */}
          {summary && (
            <div className="mb-6">
              <h2 
                className="text-sm font-bold uppercase tracking-wider mb-2 border-b border-gray-100 pb-1"
                style={{ color: "var(--accent)" }}
              >
                Professional Summary
              </h2>
              <p className="text-xs text-slate-700 leading-relaxed text-justify">
                {summary}
              </p>
            </div>
          )}

          {/* Experience */}
          {experiences.length > 0 && (
            <div className="mb-6">
              <h2 
                className="text-sm font-bold uppercase tracking-wider mb-3 border-b border-gray-100 pb-1"
                style={{ color: "var(--accent)" }}
              >
                Professional Experience
              </h2>
              <div className="space-y-4">
                {experiences.map((exp: any, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xs font-bold text-slate-900">{exp.title}</h3>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0 pl-4">{exp.date}</span>
                    </div>
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul className="list-disc pl-4 space-y-1 text-slate-700 text-xs">
                        {exp.bullets.map((b: any, bIdx: number) => (
                          <li key={bIdx} className="text-justify">{b.text || b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {educations.length > 0 && (
            <div className="mb-6">
              <h2 
                className="text-sm font-bold uppercase tracking-wider mb-3 border-b border-gray-100 pb-1"
                style={{ color: "var(--accent)" }}
              >
                Education
              </h2>
              <div className="space-y-3">
                {educations.map((edu: any, idx: number) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xs font-bold text-slate-900">{edu.degree}</h3>
                    </div>
                    {edu.bullets && edu.bullets.length > 0 && (
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-700 text-xs">
                        {edu.bullets.map((b: any, bIdx: number) => (
                          <li key={bIdx}>{b.text || b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <h2 
                className="text-sm font-bold uppercase tracking-wider mb-3 border-b border-gray-100 pb-1"
                style={{ color: "var(--accent)" }}
              >
                Key Skills & Expertise
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                {skills.map((sk: any, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <h3 className="text-xs font-bold text-slate-800">{sk.title}</h3>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{sk.items}</p>
                    {sk.showProgress && (
                      <div className="space-y-1.5 pt-1">
                        {sk.items.split(",").map((it: string) => it.trim()).filter(Boolean).slice(0, 3).map((skillName: string) => {
                          const level = sk.levels?.[skillName] ?? 80;
                          return (
                            <div key={skillName} className="flex items-center gap-2 text-[10px]">
                              <span className="font-semibold text-slate-700 w-24 truncate">{skillName}</span>
                              <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{ 
                                    width: `${level}%`,
                                    backgroundColor: "var(--accent)"
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global CSS style block for printing */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
