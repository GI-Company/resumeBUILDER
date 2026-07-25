import React, { useState } from "react";
import { Sparkles, Copy, Download } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

interface CoverLetterPanelProps {
  user: any;
  setAuthModalOpen: (open: boolean) => void;
  resumeState: {
    name: string;
    contactLine: string;
    summary: string;
    experiences: any[];
    educations: any[];
    skills: any[];
  };
}

export default function CoverLetterPanel({
  user,
  setAuthModalOpen,
  resumeState,
}: CoverLetterPanelProps) {
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to use AI cover letter generation.");
      setAuthModalOpen(true);
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading("Generating your tailored cover letter... ✍️");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch("/api/cover-letter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          resumeState,
          jobDescription: jobDesc,
          role,
          company,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "Failed to generate cover letter.");
      }

      setOutput(resData.text);
      toast.success("Cover letter generated! ✨", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "An error occurred", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3 overflow-y-auto pr-1">
      <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-3 text-left shrink-0">
        <h3 className="text-xs font-bold text-amber-800 flex items-center gap-1">
          <Sparkles size={13} className="animate-pulse" />
          AI Cover Letter Generator
        </h3>
        <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
          Instantly write a personalized, 100% tailored cover letter using the exact achievements, technical skills, and background loaded in your active resume.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-3 shrink-0">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
            Target Role / Title
          </label>
          <input
            type="text"
            required
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Senior Frontend Engineer"
            className="w-full p-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
            Company Name
          </label>
          <input
            type="text"
            required
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Vercel"
            className="w-full p-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
            Job Description / Target Keywords (Optional)
          </label>
          <textarea
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
            placeholder="Paste details of the role here to auto-align target keywords..."
            className="w-full p-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white resize-none"
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg py-2 text-xs font-bold hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Writing cover letter...</span>
            </>
          ) : (
            <>
              <Sparkles size={13} />
              <span>Generate Cover Letter</span>
            </>
          )}
        </button>
      </form>

      {/* Result Card */}
      <div className="flex-1 flex flex-col min-h-[160px] bg-gray-50 border border-gray-200 rounded-xl p-3 overflow-hidden">
        <div className="flex items-center justify-between mb-2 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
            Tailored Letter Draft
          </span>
          {output && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(output);
                  toast.success("Copied cover letter to clipboard! 📋");
                }}
                className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                title="Copy to Clipboard"
              >
                <Copy size={11} />
                <span>Copy</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const element = document.createElement("a");
                  const file = new Blob([output], { type: "text/plain" });
                  element.href = URL.createObjectURL(file);
                  element.download = `Cover_Letter_${company.replace(/\s+/g, "_")}.txt`;
                  document.body.appendChild(element);
                  element.click();
                  toast.success("Cover letter downloaded! 📥");
                }}
                className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                title="Download Cover Letter"
              >
                <Download size={11} />
                <span>Download</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto text-[11px] text-gray-800 leading-relaxed font-mono whitespace-pre-wrap select-text pr-1 bg-white border border-gray-100 rounded-lg p-2.5">
          {output ? output : <span className="text-gray-400 italic">Your generated cover letter will appear here...</span>}
        </div>
      </div>
    </div>
  );
}
