'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Bot, 
  Zap, 
  Check, 
  FileText, 
  Sliders, 
  Layout, 
  Download, 
  Cloud, 
  ArrowRight, 
  HelpCircle, 
  RefreshCw, 
  Copy, 
  Coins, 
  ChevronRight, 
  Play, 
  Users, 
  CheckCircle,
  Clock,
  Printer,
  UploadCloud
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import AuthModal from './AuthModal';
import LiveActivityFeed from './LiveActivityFeed';
import { PublicATSScanner } from './landing/PublicATSScanner';

// Templates details for interactive preview
const TEMPLATES_INFO = [
  {
    id: "sidebar-executive",
    name: "Sidebar Executive",
    desc: "A stunning two-column layout optimal for senior candidates. Key skills, certifications, and education are prioritized in a sidebar, leaving the main canvas for achievements.",
    target: "Product Managers, Executives, tech leads, and 5+ years experienced hires."
  },
  {
    id: "modern",
    name: "Modern Chic",
    desc: "Clean, elegant lines with a premium tech-focused accent color. Highly scannable, balanced negative space, and modern typographic hierarchy.",
    target: "Software Engineers, designers, marketers, and creative professionals."
  },
  {
    id: "classic",
    name: "Harvard Classic",
    desc: "The gold standard of investment banking and elite professional resumes. Timeless, single-column alignment with centered dividers.",
    target: "Consultants, investment bankers, lawyers, and traditional industries."
  },
  {
    id: "traditional",
    name: "Traditional Professional",
    desc: "A reliable, highly structured grid-based layout. Left-aligned dates and elegant typography ensure automatic parsing through legacy ATS systems.",
    target: "Academic fields, operations managers, and corporate roles."
  },
  {
    id: "minimal",
    name: "Minimalist Slate",
    desc: "Zero clutter, premium spacing. Pushes content density without sacrificing readability. Perfect for showing off high-impact career statements.",
    target: "General professionals, freelancers, and early-career grads."
  },
  {
    id: "sidebar-fresh",
    name: "Sidebar Fresh",
    desc: "A modern spin on the executive template. Highlight sections are framed in a soft left-column container, creating immediate visual interest.",
    target: "Start-up founders, developer-advocates, and marketing specialists."
  }
];

const SANDBOX_PRESETS = {
  bullets: {
    title: "STAR Bullet Point Optimizer",
    label: "Plain work bullet (e.g. what you did):",
    placeholder: "e.g. Managed a team of engineers to launch a mobile app and saw some download growth.",
    sample: "Managed cross-functional team of 6 developers to launch our iOS/Android mobile app on a tight timeline, resulting in 15,000 downloads within the first 30 days and a 4.8-star App Store rating.",
    systemPrompt: "You are an elite professional career coach. Convert the user's plain work description into 2-3 high-impact, results-focused STAR methodology bullet points. Begin each bullet with a powerful action verb and include a realistic metric or outcome. Output ONLY the polished bullet points without intro or outro."
  },
  summary: {
    title: "Executive Summary Polisher",
    label: "Your background or career notes:",
    placeholder: "e.g. Product Manager with 8 years of experience. Good at agile, team leading, and roadmap planning. Want to transition to fintech.",
    sample: "Results-driven Senior Product Manager with 8+ years of experience leading agile teams and orchestrating complex digital roadmaps. Proven track record of scaling high-transaction cloud platforms and aligning cross-functional teams to exceed revenue targets. Transitioning expertise into the fintech sector to drive high-concurrency payment products.",
    systemPrompt: "You are an elite executive resume writer. Polish the user's background notes into a compelling, 3-line professional profile summary. It should be punchy, focus on core value propositions, and use a modern technical tone. Output ONLY the polished summary paragraph."
  },
  keywords: {
    title: "ATS Keyword Generator",
    label: "Target Job Title and key technologies:",
    placeholder: "e.g. Senior Frontend Engineer (React, TypeScript, Node)",
    sample: "🎯 Target Core Competencies: Frontend System Architecture, Client-side Performance Optimization, Design Systems (Tailwind/CSS), State Management (Redux/Zustand), Automated Testing (Jest/Cypress), CI/CD Web Pipelines, Semantic SEO & Web Accessibility (WCAG).",
    systemPrompt: "You are an ATS compliance expert. Analyze the user's target job title and skills, and suggest 6-8 high-demand technical keywords, competencies, or tools that they should integrate into their resume to pass ATS filters. Format as a clean list of bullet points. Output ONLY the list."
  }
};

export default function LandingPage({ onOpenResume }: { onOpenResume: (templateId: string) => void }) {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<'signin' | 'signup'>('signin');

  const openAuth = (view: 'signin' | 'signup' = 'signin', intent?: 'upgrade') => {
    if (intent) {
      sessionStorage.setItem('authIntent', intent);
    } else {
      sessionStorage.removeItem('authIntent');
    }
    setAuthModalView(view);
    setAuthModalOpen(true);
  };
  const [activeSandboxTab, setActiveSandboxTab] = useState<"bullets" | "summary" | "keywords">("bullets");
  const [sandboxInput, setSandboxInput] = useState("");
  const [sandboxOutput, setSandboxOutput] = useState("");
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [activeTemplateIdx, setActiveTemplateIdx] = useState(0);
  const [selectedProofTemplate, setSelectedProofTemplate] = useState<"harvard" | "sidebar" | "minimal">("harvard");

  const [foundingCount, setFoundingCount] = useState<number | null>(null);
  const [paidFoundingCount, setPaidFoundingCount] = useState<number | null>(null);
  const FOUNDING_LIMIT = 50;

  // Fetch total signed-up user count for founding member counter
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/stats', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.freeFoundingCount === 'number') setFoundingCount(data.freeFoundingCount);
          if (typeof data.paidFoundingCount === 'number') setPaidFoundingCount(data.paidFoundingCount);
        }
      } catch {
        // Silently fail — counter just won't show
      }
    };
    fetchCount();
  }, []);

  useEffect(() => {
    setSandboxInput("");
    setSandboxOutput("");
  }, [activeSandboxTab]);

  const handleLoadSample = () => {
    setSandboxInput(SANDBOX_PRESETS[activeSandboxTab].sample);
  };

  const handleRunSandboxAI = async () => {
    if (!sandboxInput.trim()) {
      toast.error("Please enter some text or load a sample first!");
      return;
    }

    setSandboxLoading(true);
    setSandboxOutput("");

    try {
      const response = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: sandboxInput,
          systemPrompt: SANDBOX_PRESETS[activeSandboxTab].systemPrompt,
          temperature: 0.4
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error((errData as any).error || "Sandbox evaluation limited. Guests get 5 requests daily.");
      }

      // Consume the SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (!reader) throw new Error("No response stream received.");

      setSandboxOutput(""); // Clear before streaming
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep the last incomplete segment
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              const token = parsed.choices?.[0]?.delta?.content ?? "";
              if (token) {
                accumulated += token;
                setSandboxOutput(accumulated);
              }
            } catch { /* skip incomplete chunk */ }
          }
        }
      }

      if (!accumulated.trim()) throw new Error("Failed to generate suggestions.");
      toast.success("AI suggestion generated! ✨");
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
      setSandboxOutput(`⚠️ LIMITATION NOTICE: ${err.message || "AI engine request failed. Guest tier is limited to 5 daily requests. Sign up to unlock 100 high-speed requests per day."}`);
    } finally {
      setSandboxLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Skip to main content link for keyboard/screen reader users */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-bold">Skip to main content</a>

      {/* Main Header / Navigation */}
      <header className="border-b border-gray-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-xl text-white shadow-sm">
              <Bot size={20} className="text-white" />
            </div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-gray-900">
              Agent Rez <span className="text-blue-600 font-semibold text-[10px] sm:text-xs bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">AI</span>
            </span>
          </div>

          <nav aria-label="Main navigation" className="flex items-center gap-1 sm:gap-3">
            <Link 
              href="#sandbox-section"
              onClick={(e) => {
                e.preventDefault();
                setActiveSandboxTab("bullets");
                const el = document.getElementById("sandbox-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors hidden md:inline-block"
            >
              Try Sandbox
            </Link>
            <Link 
              href="#features-section"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById("features-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors hidden md:inline-block mr-4"
            >
              Explore Capabilities
            </Link>
            <button 
              onClick={() => openAuth('signin')}
              className="text-xs font-bold text-gray-700 hover:text-gray-900 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-all cursor-pointer"
            >
              Sign In
            </button>
            <button 
              onClick={() => openAuth('signup')}
              className="hidden sm:inline-flex bg-gray-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              Create Free Account
            </button>
          </nav>
        </div>
      </header>

      <main id="main-content">
      {/* Hero Section */}
      <section aria-labelledby="hero-heading" className="relative overflow-hidden py-16 md:py-24 bg-white border-b border-gray-200/70">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 px-3 py-1 rounded-full text-amber-800 text-[11px] font-bold uppercase tracking-wider mb-6"
          >
            <Sparkles size={12} className="text-amber-500 animate-pulse" />
            <span>Built for High-Achieving Professionals</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            id="hero-heading"
            className="text-4xl md:text-6xl font-extrabold tracking-tighter text-gray-900 leading-[1.1] mb-6"
          >
            The Ultimate AI-Agent <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Career & Resume Builder
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base md:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto mb-10"
          >
            Meet <strong>Agent Rez</strong>—your smart career assistant. Build high-converting, ATS-optimized professional resumes live via an interactive conversational chat, or use our smart career tools to refine your experience. Get started for free, with AI requests available for signed-in users, with priority access for founding members.
          </motion.p>

          {/* Founding Member Counter Banners */}
          <div className="flex flex-col gap-4 mb-8 max-w-lg mx-auto">
            {/* Free Founding Tier */}
            {foundingCount !== null && foundingCount < FOUNDING_LIMIT && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.25 }}
              >
                <div className="relative bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-300/70 rounded-2xl p-4 shadow-md overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" style={{ animation: 'shimmer 2.5s infinite' }} />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🔥</span>
                        <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">Founding Member Offer</span>
                      </div>
                      <span className="text-xs font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                        {FOUNDING_LIMIT - (foundingCount ?? 0)} spots left
                      </span>
                    </div>
                    <div className="w-full bg-amber-100 rounded-full h-2.5 mb-2.5 overflow-hidden" role="progressbar" aria-valuenow={foundingCount ?? 0} aria-valuemin={0} aria-valuemax={FOUNDING_LIMIT} aria-label={`${foundingCount ?? 0} of ${FOUNDING_LIMIT} founding member spots claimed`}>
                      <motion.div
                        className="h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, ((foundingCount ?? 0) / FOUNDING_LIMIT) * 100)}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
                      />
                    </div>
                    <p className="text-[11px] text-amber-800 font-semibold leading-snug">
                      <strong className="font-black text-amber-900">{foundingCount ?? 0}</strong> of {FOUNDING_LIMIT} founding members claimed · First {FOUNDING_LIMIT} get <span className="underline decoration-dotted">priority AI access (75/day) for life</span> <span aria-hidden="true">🎁</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Paid Founding Tier */}
            {paidFoundingCount !== null && paidFoundingCount < FOUNDING_LIMIT && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.35 }}
              >
                <div className="relative bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 border border-indigo-300/70 rounded-2xl p-4 shadow-md overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" style={{ animation: 'shimmer 2.5s infinite' }} />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⚡</span>
                        <span className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider">Founding Premium Offer</span>
                      </div>
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-full">
                        {FOUNDING_LIMIT - (paidFoundingCount ?? 0)} spots left
                      </span>
                    </div>
                    <div className="w-full bg-indigo-100 rounded-full h-2.5 mb-2.5 overflow-hidden" role="progressbar" aria-valuenow={paidFoundingCount ?? 0} aria-valuemin={0} aria-valuemax={FOUNDING_LIMIT} aria-label={`${paidFoundingCount ?? 0} of ${FOUNDING_LIMIT} paid founding spots claimed`}>
                      <motion.div
                        className="h-2.5 rounded-full bg-gradient-to-r from-indigo-400 to-blue-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, ((paidFoundingCount ?? 0) / FOUNDING_LIMIT) * 100)}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.6 }}
                      />
                    </div>
                    <p className="text-[11px] text-indigo-800 font-semibold leading-snug">
                      <strong className="font-black text-indigo-900">{paidFoundingCount ?? 0}</strong> of {FOUNDING_LIMIT} paid founding spots claimed · First {FOUNDING_LIMIT} subscribers lock in <span className="underline decoration-dotted">$3.99/mo forever + top AI priority (100/day) for life</span> <span aria-hidden="true">🎁</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center items-center"
          >
            <Link 
              href={`/editor?templateId=${TEMPLATES_INFO[activeTemplateIdx].id}`}
              onClick={(e) => {
                e.preventDefault();
                onOpenResume(TEMPLATES_INFO[activeTemplateIdx].id);
              }} 
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Play size={16} />
              <span>Launch Editor (Blank)</span>
            </Link>

            <Link 
              href="/interview"
              className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 px-8 py-4 rounded-xl font-bold transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Users size={16} className="text-indigo-600" />
              <span>Start Guided Interview</span>
            </Link>

            <Link 
              href="/audit"
              className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 px-8 py-4 rounded-xl font-bold transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText size={16} className="text-emerald-600" />
              <span>Instant Resume Audit</span>
            </Link>
          </motion.div>

          {/* Transparency Guarantee under CTAs */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200/60 py-2.5 px-4 rounded-xl max-w-xl mx-auto shadow-xs"
          >
            <span className="flex items-center gap-1.5 text-blue-600 font-extrabold text-[11px] uppercase tracking-wider">
              <Zap size={13} className="text-blue-500 animate-pulse shrink-0" />
              100% Free to Start
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 hidden sm:block" aria-hidden="true" />
            <span className="text-gray-500">Free daily limits; sign up to increase your limits.</span>
          </motion.div>
          
          {/* Live Activity Feed */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <LiveActivityFeed />
          </motion.div>

          {/* Social Proof badges */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-10 border-t border-gray-100 max-w-3xl mx-auto"
          >
            <div className="flex flex-col items-center">
              <span className="text-xl md:text-2xl font-black text-gray-900">100%</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mt-0.5">Free PDF Exports</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl md:text-2xl font-black text-gray-900">0</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mt-0.5">Hidden Fees or Cards</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl md:text-2xl font-black text-gray-900">ATS</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mt-0.5">Compliant Layouts</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl md:text-2xl font-black text-gray-900">Up to 3</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mt-0.5">Saves for Users</span>
            </div>
          </motion.div>
        </div>

        {/* Ambient decorative blobs */}
        <div className="absolute top-1/4 -left-36 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-40 pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-1/4 -right-36 w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-40 pointer-events-none" aria-hidden="true" />
      </section>

      {/* Public ATS Scanner Section */}
      <section id="scanner" className="bg-white border-b border-gray-200/80">
        <PublicATSScanner onSignupClick={() => openAuth('signup')} />
      </section>

      {/* NEW SECTION: Pristine PDF Export & ATS Proof Showcase (Aesthetic and Functional trust proof) */}
      <section className="py-16 bg-white border-b border-gray-200/80 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left text control column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-3">
                <span className="text-[10px] font-bold tracking-widest text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  Pristine Export Proof
                </span>
                <h2 className="text-3xl font-black tracking-tight text-gray-900 leading-tight">
                  Mathematical Alignment. <br />
                  ATS-Approved Grids.
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Avoid the common alignment traps of low-quality resume software. Agent Rez utilizes built-in margin controllers, relative flex systems, and page-avoid breaks to ensure your printed PDF exports are flawlessly structured for real hiring boards.
                </p>
              </div>

              {/* Selector buttons to change mock preview */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Click to inspect live layouts:
                </span>
                
                <button 
                  onClick={() => setSelectedProofTemplate("harvard")}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                    selectedProofTemplate === "harvard" 
                      ? "bg-slate-50 border-blue-300 shadow-xs text-blue-900 font-bold" 
                      : "bg-white border-gray-200/80 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                    <div className="text-xs">
                      <p className="font-bold">Harvard Classic Presets</p>
                      <p className="text-[10px] text-gray-500 font-normal">Centered headers, standard conservative margins</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className={selectedProofTemplate === "harvard" ? "text-blue-600" : "text-gray-400"} />
                </button>

                <button 
                  onClick={() => setSelectedProofTemplate("sidebar")}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                    selectedProofTemplate === "sidebar" 
                      ? "bg-slate-50 border-blue-300 shadow-xs text-blue-900 font-bold" 
                      : "bg-white border-gray-200/80 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <div className="text-xs">
                      <p className="font-bold">Sidebar Executive Presets</p>
                      <p className="text-[10px] text-gray-500 font-normal">Modern dual-column, prioritized career highlights</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className={selectedProofTemplate === "sidebar" ? "text-blue-600" : "text-gray-400"} />
                </button>

                <button 
                  onClick={() => setSelectedProofTemplate("minimal")}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                    selectedProofTemplate === "minimal" 
                      ? "bg-slate-50 border-blue-300 shadow-xs text-blue-900 font-bold" 
                      : "bg-white border-gray-200/80 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <div className="text-xs">
                      <p className="font-bold">Minimalist Slate Presets</p>
                      <p className="text-[10px] text-gray-500 font-normal">High-density text structures, clean visual dividers</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className={selectedProofTemplate === "minimal" ? "text-blue-600" : "text-gray-400"} />
                </button>
              </div>

              {/* Highlight statistics & feedback */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-blue-800">
                  <CheckCircle size={15} className="text-blue-600" />
                  <span className="text-xs font-bold">100% Recruiter & ATS Readable</span>
                </div>
                <p className="text-[11px] text-blue-900/80 leading-relaxed">
                  "The Harvard template bypassed the recruiter filters instantly and scaled perfectly onto one page. Got response back from top-tier tech firms within 48 hours." 
                  <br /><strong className="text-blue-950 font-bold block mt-1">— Alexander C., Senior Architect</strong>
                </p>
              </div>
            </div>

            {/* Right Interactive Mock PDF Frame */}
            <div className="lg:col-span-7 bg-gray-50 border border-gray-200/80 rounded-2xl p-4 md:p-6 shadow-inner relative flex flex-col items-center justify-center min-h-[580px]">
              
              {/* Perfect PDF Document Mock (Matches actual output formatting) */}
              <div aria-hidden="true" className="w-full bg-white border border-gray-200 rounded-xl shadow-lg p-6 md:p-8 flex flex-col justify-between text-left text-gray-900 font-sans relative overflow-hidden aspect-[1/1.41] max-w-md mx-auto">
                
                {/* Simulated A4/Letter margin grid borders */}
                <div className="absolute inset-0 border-[1px] border-dashed border-blue-200/25 pointer-events-none" />
                <div className="absolute top-3 left-4 text-[9px] font-mono text-blue-400 tracking-wider font-bold select-none flex items-center gap-1 bg-blue-50/75 border border-blue-100/50 px-1.5 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                  <span>ATS COMPLIANT RENDER GRID</span>
                </div>

                <div className="space-y-6 flex-1">
                  {/* Selected Preset Rendering */}
                  {selectedProofTemplate === "harvard" && (
                    <div className="space-y-4">
                      {/* Name & Contact (Centered) */}
                      <div className="text-center space-y-1">
                        <h4 className="text-lg md:text-xl font-bold tracking-tight text-slate-900">ALEXANDER CHEN</h4>
                        <p className="text-[10px] text-gray-500 font-mono">
                          San Francisco, CA &bull; alex.chen@example.com &bull; (415) 555-0192 &bull; linkedin.com/in/alexchen
                        </p>
                      </div>
                      
                      <div className="h-px bg-slate-900" aria-hidden="true" />

                      {/* Professional Summary */}
                      <div className="space-y-1">
                        <h5 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Professional Profile</h5>
                        <p className="text-[10px] text-gray-600 leading-relaxed">
                          Results-driven Software Engineer with 8+ years of enterprise experience specializing in real-time layout structures, cloud orchestration systems, and interactive UI paradigms. Proven record scaling backend throughput by 40% and deploying robust design libraries.
                        </p>
                      </div>

                      {/* Work Experience */}
                      <div className="space-y-3">
                        <h5 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                          <span>Professional Experience</span>
                          <span className="h-px bg-gray-200 flex-1 ml-3" aria-hidden="true" />
                        </h5>
                        
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between items-baseline text-[10px] font-bold text-slate-900">
                              <span>Senior Software Architect — Stripe, Inc.</span>
                              <span className="text-gray-500 font-normal">2023 &ndash; Present</span>
                            </div>
                            <ul className="list-disc pl-4 text-[9.5px] text-gray-600 space-y-1 mt-1">
                              <li>Led front-end performance rewrite, achieving a <strong className="text-blue-600 font-semibold">34% reduction in checkout latency</strong> and retaining $4.2M in annual cart recovery.</li>
                              <li>Architected high-performance relative canvas layout engine used daily across 6 core product squads.</li>
                            </ul>
                          </div>

                          <div>
                            <div className="flex justify-between items-baseline text-[10px] font-bold text-slate-900">
                              <span>Frontend Engineer — Atlassian</span>
                              <span className="text-gray-500 font-normal">2021 &ndash; 2023</span>
                            </div>
                            <ul className="list-disc pl-4 text-[9.5px] text-gray-600 space-y-1 mt-1">
                              <li>Authored reusable design library components, slashing engineering integration cycles by <strong className="text-indigo-600 font-semibold">45 days</strong>.</li>
                              <li>Overhauled data tables with custom virtualization, rendering 50,000 active nodes without UI lag.</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Education */}
                      <div className="space-y-1">
                        <h5 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                          <span>Education & Certifications</span>
                          <span className="h-px bg-gray-200 flex-1 ml-3" aria-hidden="true" />
                        </h5>
                        <div className="flex justify-between text-[10px] text-slate-900">
                          <span><strong>B.S. in Computer Science</strong> &mdash; Stanford University</span>
                          <span className="text-gray-500">GPA 3.85</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedProofTemplate === "sidebar" && (
                    <div className="grid grid-cols-12 gap-4 h-full">
                      {/* Left Sidebar Layout */}
                      <div className="col-span-4 border-r border-gray-100 pr-3 space-y-4">
                        <div className="space-y-1">
                          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">SJ</div>
                          <h4 className="text-xs font-bold text-slate-900 leading-tight">Sarah Jenkins</h4>
                          <p className="text-[9px] text-gray-500">Technical PM</p>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">Expertise</h4>
                          <div className="flex flex-wrap gap-1">
                            <span className="text-[8px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">Agile Scrums</span>
                            <span className="text-[8px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">Roadmaps</span>
                            <span className="text-[8px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">SQL Database</span>
                            <span className="text-[8px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">Figma Wire</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">Contact</h4>
                          <p className="text-[8px] text-gray-500 truncate">s.jenkins@example.com</p>
                          <p className="text-[8px] text-gray-500">Seattle, WA</p>
                        </div>
                      </div>

                      {/* Right Main Canvas */}
                      <div className="col-span-8 pl-1 space-y-4">
                        <div className="space-y-1">
                          <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">Executive Summary</h4>
                          <p className="text-[9.5px] text-gray-600 leading-relaxed">
                            Certified PMP product leader with 7+ years directing high-concurrency cloud software features. Highly skilled at engineering alignments, metric-driven roadmaps, and stakeholder consensus.
                          </p>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">Career History</h4>
                          
                          <div className="space-y-2">
                            <div>
                              <p className="text-[9.5px] font-bold text-slate-900 leading-none">Lead Product Manager &mdash; Airbnb</p>
                              <p className="text-[8.5px] text-gray-500 mt-0.5">2022 &ndash; Present | Seattle, WA</p>
                              <ul className="list-disc pl-3 text-[9px] text-gray-600 space-y-1 mt-1">
                                <li>Optimized guest booking flow widgets, boosting overall <strong className="text-blue-600 font-semibold">mobile checkout conversion by 4.2%</strong>.</li>
                                <li>Orchestrated cross-border currency payment platform API, processing $18M in ARR.</li>
                              </ul>
                            </div>

                            <div>
                              <p className="text-[9.5px] font-bold text-slate-900 leading-none">Product Manager &mdash; Microsoft</p>
                              <p className="text-[8.5px] text-gray-500 mt-0.5">2019 &ndash; 2022 | Redmond, WA</p>
                              <ul className="list-disc pl-3 text-[9px] text-gray-600 space-y-1 mt-1">
                                <li>Shipped 3 cloud enterprise database integrations, generating $14M in verified enterprise sales pipelines.</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedProofTemplate === "minimal" && (
                    <div className="space-y-4">
                      {/* Name & Title Block */}
                      <div className="flex justify-between items-baseline border-b border-gray-200 pb-2">
                        <h3 className="text-base font-black text-slate-950 uppercase tracking-tight">Elena Rostova</h3>
                        <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Director of Marketing</span>
                      </div>

                      <p className="text-[9.5px] text-gray-600 leading-relaxed italic border-l-2 border-amber-500 pl-2">
                        "Data-driven strategist specializing in hyper-growth consumer SaaS acquisition models. Architected performance campaigns driving over 2.4M active subscriptions globally."
                      </p>

                      <div className="space-y-3.5">
                        <h4 className="text-[10px] font-bold text-slate-950 uppercase tracking-wider">Key Expertise Fields</h4>
                        <div className="grid grid-cols-2 gap-2 text-[9.5px] text-gray-700 font-medium">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>Paid Search & Social Acquisition</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>Product-Led Funnel Optimization</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>CAC & LTV Modeling Systems</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>Multi-touch Campaign Attribution</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-950 uppercase tracking-wider">Selected Highlights</h4>
                        
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between items-baseline text-[9.5px] font-bold text-slate-950">
                              <span>Director of Campaign Strategy — Figma</span>
                              <span className="text-gray-500 font-normal">2023 &ndash; Present</span>
                            </div>
                            <p className="text-[9px] text-gray-600 mt-1">
                              Managed $8.5M paid acquisition budget; halved organic customer acquisition costs (CAC) while successfully <strong className="text-amber-600 font-semibold">doubling incoming B2B product demo volume</strong>.
                            </p>
                          </div>

                          <div>
                            <div className="flex justify-between items-baseline text-[9.5px] font-bold text-slate-950">
                              <span>Senior Growth Specialist — Webflow</span>
                              <span className="text-gray-500 font-normal">2020 &ndash; 2023</span>
                            </div>
                            <p className="text-[9px] text-gray-600 mt-1">
                              Orchestrated targeted seo hub campaigns, scaling global domain organic visibility from 3.0M to 7.5M monthly visitors.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Live Export Badge Footer */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[9px] text-gray-400 font-semibold font-mono">
                  <span>PAGE 1 OF 1</span>
                  <span className="flex items-center gap-1 text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded">
                    <Check size={10} />
                    ATS VERIFIED PASSED
                  </span>
                </div>
              </div>

              {/* Document Floating Badge */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold tracking-wider uppercase px-4 py-1.5 rounded-full shadow-md flex items-center gap-1.5 border border-neutral-800 select-none">
                <Printer size={12} className="text-blue-400" />
                <span>Pixel-Perfect PDF Margins</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Interactive AI Sandbox Section (Utility & Intrigue) */}
      <section id="sandbox-section" className="py-16 bg-gray-50 border-b border-gray-200/80">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-2">
              ⚡ Try the Live Career AI Sandbox
            </h2>
            <p className="text-sm text-gray-600">
              Test drive our high-performance AI engine right here before diving into the editor. Choose a professional tool below, input your notes, and see results.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[420px]">
            {/* Left Controls */}
            <div className="p-6 md:col-span-5 border-r border-gray-200 bg-gray-50/50 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-3">
                  Select AI Sandbox Tool
                </span>
                <div role="tablist" aria-label="AI Sandbox Tools" className="space-y-2">
                  {(Object.keys(SANDBOX_PRESETS) as Array<keyof typeof SANDBOX_PRESETS>).map((tab) => (
                    <button
                      key={tab}
                      role="tab"
                      id={`sandbox-tab-${tab}`}
                      aria-selected={activeSandboxTab === tab}
                      aria-controls="sandbox-tabpanel"
                      onClick={() => setActiveSandboxTab(tab)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                        activeSandboxTab === tab
                          ? "bg-white border-blue-200 shadow-xs text-blue-900"
                          : "bg-transparent border-transparent hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg mt-0.5 ${
                        activeSandboxTab === tab ? "bg-blue-50 text-blue-600" : "bg-gray-200/60 text-gray-500"
                      }`}>
                        {tab === "bullets" && <Zap size={14} />}
                        {tab === "summary" && <FileText size={14} />}
                        {tab === "keywords" && <Sparkles size={14} />}
                      </div>
                      <div>
                        <p className="text-xs font-bold leading-none mb-1">
                          {SANDBOX_PRESETS[tab].title}
                        </p>
                        <p className="text-[10px] text-gray-500 line-clamp-1">
                          {tab === "bullets" && "Convert plain text to impact STAR bullets"}
                          {tab === "summary" && "Turn basic background into elegant summary"}
                          {tab === "keywords" && "Uncover key ATS competencies instantly"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sample Loader trigger */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-[10px] text-gray-500 mb-2 leading-relaxed">
                  Stuck? Hit the sample loader to inject real, pre-written professional notes.
                </p>
                <button
                  onClick={handleLoadSample}
                  className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-[11px] font-bold text-gray-700 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={12} className="text-blue-500" />
                  <span>Load Sample Notes</span>
                </button>
              </div>
            </div>

            {/* Right Sandbox Playground */}
            <div id="sandbox-tabpanel" role="tabpanel" aria-labelledby={`sandbox-tab-${activeSandboxTab}`} className="p-6 md:col-span-7 flex flex-col justify-between">
              <div className="space-y-4 flex-1 flex flex-col">
                <div>
                  <label htmlFor="sandbox-input" className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    {SANDBOX_PRESETS[activeSandboxTab].label}
                  </label>
                  <textarea
                    id="sandbox-input"
                    value={sandboxInput}
                    onChange={(e) => setSandboxInput(e.target.value)}
                    placeholder={SANDBOX_PRESETS[activeSandboxTab].placeholder}
                    className="w-full p-3 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 resize-none h-[110px]"
                  />
                </div>

                <div className="flex-1 flex flex-col min-h-[140px]">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                      ✨ AI Generated Output suggestions
                    </label>
                    {sandboxOutput && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(sandboxOutput);
                          toast.success("Copied to clipboard! 📋");
                        }}
                        className="text-[10px] font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
                      >
                        <Copy size={11} />
                        Copy
                      </button>
                    )}
                  </div>
                  <div aria-live="polite" className="flex-1 border border-gray-200 rounded-xl bg-gray-50 p-3 text-xs leading-relaxed text-gray-800 font-sans select-text overflow-y-auto whitespace-pre-wrap max-h-[180px]">
                    {sandboxLoading ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-6">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" role="status" aria-label="Loading AI response" />
                        <span className="text-[11px]">Compiling professional phrasing...</span>
                      </div>
                    ) : sandboxOutput ? (
                      sandboxOutput
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-6">
                        <Sparkles size={20} className="mb-1 text-amber-500/70" />
                        <span className="text-[10px]">Your optimized resume details will appear here.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between gap-4">
                <span className="text-[10px] text-gray-400 hidden sm:block">
                  *Uses high-performance Groq Llama architecture.
                </span>
                <button
                  onClick={handleRunSandboxAI}
                  disabled={sandboxLoading || !sandboxInput.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer ml-auto disabled:opacity-40"
                >
                  <Sparkles size={13} />
                  <span>Execute Sandbox AI</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Presentation of EVERY feature/tool/capability */}
      <section id="features-section" className="py-16 bg-white border-b border-gray-200/80">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[10px] font-bold tracking-widest text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              App Capabilities
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 mt-4 mb-3">
              Designed For Pristine Professional Outcomes
            </h2>
            <p className="text-sm text-gray-600">
              Agent Rez equips you with structural, conversational, and styling capabilities that rival expensive human resume services. 
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-gray-50/50 border border-gray-200/80 p-5 rounded-2xl shadow-inner transition-all hover:border-gray-300">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 border border-blue-100 shadow-xs">
                <Bot size={20} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">
                1. Conversational Agent
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Directly chat with <strong>Agent Rez</strong> in the sidebar. Command him to write summaries, insert certifications, rewrite jobs using action verbs, or completely format sections. Witness edits populate the resume canvas in real-time.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50/50 border border-gray-200/80 p-5 rounded-2xl shadow-inner transition-all hover:border-gray-300">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 border border-indigo-100 shadow-xs">
                <Users size={20} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">
                2. Guided Career Interview
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Skip the blank page paralysis. Engage in a 5-step interactive voice or chat-driven interview. Agent Rez collects your background particulars step-by-step and automatically compiles an exceptional, ATS-ready resume.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50/50 border border-gray-200/80 p-5 rounded-2xl shadow-inner transition-all hover:border-gray-300">
              <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center mb-4 border border-teal-100 shadow-xs">
                <FileText size={20} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">
                3. AI Cover Letter Generator
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Instantly write a personalized, 100% tailored cover letter using the exact achievements, technical skills, and background loaded in your active resume. Match keywords directly to any target job description.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-50/50 border border-gray-200/80 p-5 rounded-2xl shadow-inner transition-all hover:border-gray-300">
              <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4 border border-orange-100 shadow-xs">
                <UploadCloud size={20} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">
                4. LinkedIn, PDF & Word Import
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Don't start from scratch. Paste a public LinkedIn URL or upload your existing resume as a PDF, Word document, or plain text file. Our AI engine accurately parses your history and formats it into our pristine templates in seconds.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gray-50/50 border border-gray-200/80 p-5 rounded-2xl shadow-inner transition-all hover:border-gray-300">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4 border border-purple-100 shadow-xs">
                <Sliders size={20} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">
                5. Micro-Spacing Engine
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Perfect spacing makes resumes look executive. Adjust line spacing, section dividers, margins, card paddings, and theme colors with robust sliders. Keep your layout uniform across multiple pages.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gray-50/50 border border-gray-200/80 p-5 rounded-2xl shadow-inner transition-all hover:border-gray-300">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 border border-emerald-100 shadow-xs">
                <Layout size={20} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">
                6. ATS-Compliant Layouts
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Switch instantly between industry layouts: Harvard Classic, Sidebar Executive, Modern Chic, and Traditional. All layouts compile semantic HTML tags matching the strict guidelines of modern ATS algorithms.
              </p>
            </div>

            {/* Feature 7 */}
            <div className="bg-gray-50/50 border border-gray-200/80 p-5 rounded-2xl shadow-inner transition-all hover:border-gray-300">
              <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-4 border border-rose-100 shadow-xs">
                <Cloud size={20} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">
                7. Secure Cloud Dashboard
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Never lose an edit. Free registered users get instant saving to a secure Postgres database, allowing you to manage, duplicate, rename, or restore multiple drafts across any device. Also includes shareable links!
              </p>
            </div>

            {/* Feature 8 */}
            <div className="bg-gray-50/50 border border-gray-200/80 p-5 rounded-2xl shadow-inner transition-all hover:border-gray-300">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4 border border-amber-100 shadow-xs">
                <Printer size={20} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">
                8. Precision PDF Native Prints
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                No third-party rendering failures or formatting shifts. Our print system utilizes direct CSS print sheets, generating perfect vector PDFs right inside your browser window. Zero latency, 100% clean layouts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Template Showcase */}
      <section className="py-16 bg-gray-50 border-b border-gray-200/80">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-2">
              Browse 6 ATS-Tested Formats
            </h2>
            <p className="text-sm text-gray-600">
              Switching templates doesn't delete your content. Explore layout options and click on any card to see who should use it.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
            {TEMPLATES_INFO.map((tpl, idx) => (
              <button
                key={tpl.id}
                onClick={() => setActiveTemplateIdx(idx)}
                className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                  activeTemplateIdx === idx
                    ? "bg-white border-blue-500 shadow-sm text-blue-900 font-bold"
                    : "bg-gray-100/55 border-gray-200 hover:bg-gray-100 text-gray-600 text-xs font-semibold"
                }`}
              >
                <div className="text-[11px] truncate leading-tight">{tpl.name}</div>
              </button>
            ))}
          </div>

          <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xs flex flex-col md:flex-row gap-6 items-center">
            <div className="w-full md:w-1/3 space-y-3">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                Aesthetic Blueprint
              </span>
              <h4 className="text-lg font-bold text-gray-900">
                {TEMPLATES_INFO[activeTemplateIdx].name}
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {TEMPLATES_INFO[activeTemplateIdx].desc}
              </p>
              <div className="pt-2">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  💡 Perfect For:
                </span>
                <p className="text-xs text-gray-800 font-semibold italic bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  {TEMPLATES_INFO[activeTemplateIdx].target}
                </p>
              </div>
            </div>
            
            <div className="w-full md:w-2/3 bg-white border border-gray-200 rounded-2xl p-5 h-[230px] flex flex-col justify-between shadow-xs relative overflow-hidden">
              <div aria-hidden="true" className="flex-1 min-h-0 select-none overflow-hidden pr-1">
                {TEMPLATES_INFO[activeTemplateIdx].id === "sidebar-executive" && (
                  <div className="grid grid-cols-3 gap-4 h-full font-sans text-left">
                    <div className="col-span-1 bg-blue-50/50 border-r border-blue-100 p-2 rounded-lg flex flex-col gap-2">
                      <div>
                        <span className="block text-[8px] font-extrabold text-blue-700 uppercase tracking-widest">Skills</span>
                        <p className="text-[7.5px] text-gray-600 leading-normal mt-0.5 font-medium">Agile, Jira, SQL, Python, Tableau, SaaS</p>
                      </div>
                      <div>
                        <span className="block text-[8px] font-extrabold text-blue-700 uppercase tracking-widest">Education</span>
                        <p className="text-[7.5px] text-gray-700 font-bold leading-tight mt-0.5">M.S. Management</p>
                        <p className="text-[7px] text-gray-500">Stanford University</p>
                      </div>
                    </div>
                    <div className="col-span-2 flex flex-col justify-center">
                      <h4 className="font-black text-sm text-gray-900 tracking-tight leading-none">Alex Morgan</h4>
                      <span className="text-[10px] text-indigo-600 font-extrabold mt-0.5">Senior Product Manager</span>
                      <div className="h-px bg-gray-200 my-1.5" aria-hidden="true" />
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Key Professional Accomplishments</span>
                      <ul className="text-[8.5px] text-gray-600 space-y-1 mt-1 leading-relaxed list-disc pl-3">
                        <li>Led 12 cross-functional teams to launch high-growth mobile applications.</li>
                        <li>Scaled platform transaction volume by <strong className="text-gray-900 font-semibold">145% YoY</strong> using real-time telemetry.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {TEMPLATES_INFO[activeTemplateIdx].id === "modern" && (
                  <div className="border-t-4 border-blue-600 pt-2 text-left font-sans flex flex-col h-full justify-center">
                    <div className="flex justify-between items-baseline">
                      <h4 className="font-black text-sm text-gray-950 uppercase tracking-tight">Alex Morgan</h4>
                      <span className="text-[8px] text-gray-400 font-semibold">San Francisco, CA</span>
                    </div>
                    <span className="text-[10px] text-blue-600 font-black mt-0.5 uppercase tracking-wide">Lead Cloud Architect</span>
                    <div className="h-px bg-gray-100 my-1.5" />
                    <span className="text-[8px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Professional Summary</span>
                    <p className="text-[8.5px] text-gray-700 leading-relaxed font-normal">
                      Pioneered microservice architecture migrations for Fortune 100 enterprise software suites. Expert in Kubernetes, AWS, Go, high-concurrency systems, and zero-downtime database schemas.
                    </p>
                  </div>
                )}

                {TEMPLATES_INFO[activeTemplateIdx].id === "classic" && (
                  <div className="text-center font-serif flex flex-col h-full justify-center">
                    <h4 className="font-bold text-sm text-gray-900 tracking-wide uppercase">Alex Morgan</h4>
                    <span className="text-[9px] text-gray-600 italic mt-0.5">Investment Banking Analyst • Morgan Stanley</span>
                    <div className="border-y border-gray-200 py-1 my-1.5 flex justify-center gap-3 text-[7.5px] text-gray-500 font-sans">
                      <span>New York, NY</span>
                      <span>•</span>
                      <span>alex@morgan.com</span>
                      <span>•</span>
                      <span>(555) 019-2834</span>
                    </div>
                    <span className="text-[8px] font-bold text-gray-800 uppercase tracking-widest block mb-1">Professional Experience</span>
                    <p className="text-[8.5px] text-gray-700 leading-relaxed max-w-xl mx-auto italic font-sans text-center">
                      "Conducted leveraged buyout (LBO) modeling for $4.2B acquisition deals. Engineered complex valuation models using discounted cash flows (DCF) with high accuracy."
                    </p>
                  </div>
                )}

                {TEMPLATES_INFO[activeTemplateIdx].id === "traditional" && (
                  <div className="text-left font-sans flex flex-col h-full justify-center">
                    <h4 className="font-extrabold text-sm text-slate-800">Alex Morgan</h4>
                    <span className="text-[10px] text-slate-600 font-semibold">Operations Director</span>
                    <div className="h-0.5 bg-slate-300 my-1.5" />
                    <div className="grid grid-cols-4 gap-2 pt-0.5">
                      <div className="col-span-1">
                        <span className="text-[8.5px] text-slate-500 font-bold block">2021 - Present</span>
                        <span className="text-[7px] text-slate-400 block">San Jose, CA</span>
                      </div>
                      <div className="col-span-3">
                        <span className="text-[9px] font-bold text-slate-900 block">Head of Operations | Logistics Inc</span>
                        <p className="text-[8.5px] text-slate-600 leading-relaxed mt-0.5">
                          Streamlined supply-chain workflows, reducing dispatch delay by 22%. Managed $14M annual budget across 4 global distribution hubs.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {TEMPLATES_INFO[activeTemplateIdx].id === "minimal" && (
                  <div className="text-left font-sans flex flex-col h-full justify-center">
                    <h4 className="font-medium text-sm text-neutral-900 tracking-tight">Alex Morgan</h4>
                    <span className="text-[9px] text-neutral-500 mt-0.5">Freelance Developer & UI Designer</span>
                    <div className="my-1.5 h-px bg-neutral-200" />
                    <span className="text-[8px] text-neutral-400 font-bold uppercase tracking-wider block mb-0.5">Core Contributions</span>
                    <ul className="text-[8.5px] text-neutral-600 space-y-0.5 leading-relaxed">
                      <li>• Shipped 35+ production-ready Next.js & Tailwind web applications.</li>
                      <li>• Audited and optimized accessibility (WCAG AA) for major ecommerce brands.</li>
                      <li>• Implemented robust database architectures utilizing Supabase and Firestore.</li>
                    </ul>
                  </div>
                )}

                {TEMPLATES_INFO[activeTemplateIdx].id === "sidebar-fresh" && (
                  <div className="grid grid-cols-3 gap-3 h-full font-sans text-left">
                    <div className="col-span-1 bg-slate-50 border border-slate-150 p-2 rounded-lg flex flex-col justify-between">
                      <div>
                        <span className="block text-[8px] font-extrabold text-slate-700 uppercase tracking-wider">Contact</span>
                        <p className="text-[7.5px] text-slate-500 leading-tight mt-0.5 break-all">ctnarrow.road@gmail.com</p>
                      </div>
                      <div>
                        <span className="block text-[8px] font-extrabold text-slate-700 uppercase tracking-wider mt-1.5">Focus</span>
                        <p className="text-[7.5px] text-slate-600 leading-tight font-medium">Developer Relations</p>
                      </div>
                    </div>
                    <div className="col-span-2 flex flex-col justify-center">
                      <h4 className="font-black text-sm text-gray-900 tracking-tight leading-none">Alex Morgan</h4>
                      <span className="text-[9.5px] text-emerald-600 font-bold mt-0.5">Developer Advocate</span>
                      <div className="h-px bg-gray-200 my-1.5" />
                      <p className="text-[8.5px] text-gray-600 leading-normal font-normal">
                        Present technical workshops, author highly ranked tutorials, and bridge communication between developer community and core engineering team.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <Link
                href={`/editor?templateId=${TEMPLATES_INFO[activeTemplateIdx].id}`}
                onClick={(e) => {
                  e.preventDefault();
                  onOpenResume(TEMPLATES_INFO[activeTemplateIdx].id);
                }}
                className="w-full sm:w-auto self-end bg-gray-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Edit template now</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Side-by-side Pricing Comparison Matrix (The Core Offer) */}
      <section className="py-16 bg-white border-b border-gray-200/80">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
              Guaranteed No Paywall. Ever.
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Unlike other platforms that wait until you've spent hours editing to ask for credit card info, we are 100% upfront. Here is our straightforward plan outline:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 max-w-5xl gap-8 mx-auto mb-16">
            {/* 1. Guest Tier */}
            <div className="border border-gray-200 rounded-2xl p-6 flex flex-col justify-between bg-gray-50/20">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Guest Tier</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Perfect for quick one-off edits</p>
                  </div>
                  <span className="text-xl font-black text-gray-900">FREE</span>
                </div>
                <div className="h-px bg-gray-200 my-4" aria-hidden="true" />
                <ul className="space-y-3.5 text-xs text-gray-700">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                    <span><strong>5 daily requests</strong> for Sidebar AI Agent & quick tools</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                    <span>Access to all <strong>6 premium templates</strong></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                    <span><strong>Unlimited PDF prints</strong> with no watermarks</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                    <span>Local storage draft autosaving</span>
                  </li>
                  <li className="flex items-start gap-2.5 opacity-40">
                    <CheckCircle size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    <span>Save multiple resumes in the cloud</span>
                  </li>
                </ul>
              </div>
              <Link 
                href="/editor?templateId=classic"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenResume("classic");
                }}
                className="w-full bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 text-xs font-bold py-3 rounded-xl transition-all mt-8 cursor-pointer shadow-xs flex items-center justify-center"
              >
                Start Editing Instantly (No signup)
              </Link>
            </div>

            {/* 2. Free Account Tier (Founding vs Standard) */}
            {foundingCount === null || foundingCount < FOUNDING_LIMIT ? (
              <div className="border-2 border-blue-600 rounded-2xl p-6 flex flex-col justify-between bg-white relative shadow-md">
                <div className="absolute top-0 right-6 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-white">
                  Founding Member
                </div>
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Founding Tier</h3>
                      <p className="text-xs text-blue-600 font-semibold mt-0.5">Free for the first {FOUNDING_LIMIT}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-blue-600">FREE</span>
                      <span className="block text-[9px] text-gray-400 font-bold uppercase">For Life</span>
                    </div>
                  </div>
                  <div className="h-px bg-gray-200 my-4" aria-hidden="true" />
                  <ul className="space-y-3.5 text-xs text-gray-700">
                    <li className="flex items-start gap-2.5 font-semibold text-blue-900">
                      <CheckCircle size={14} className="text-blue-600 mt-0.5 shrink-0 animate-pulse" />
                      <div>
                        <span><strong>75 Daily AI Requests ⚡</strong></span>
                        <p className="text-[11px] text-gray-500 font-normal mt-0.5">Free forever, priority AI access.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                      <span>Access to all <strong>6 premium templates</strong></span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                      <span><strong>Secure Cloud Saving</strong> for up to 3 drafts</span>
                    </li>
                  </ul>
                </div>
                <button 
                  onClick={() => openAuth('signup')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 rounded-xl shadow-md active:scale-95 transition-all mt-8 cursor-pointer"
                >
                  Claim Free Founding Spot
                </button>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-2xl p-6 flex flex-col justify-between bg-white relative shadow-sm">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Free Tier</h3>
                      <p className="text-xs text-gray-500 font-semibold mt-0.5">Basic cloud features</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-gray-900">FREE</span>
                    </div>
                  </div>
                  <div className="h-px bg-gray-200 my-4" aria-hidden="true" />
                  <ul className="space-y-3.5 text-xs text-gray-700">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                      <span><strong>15 Daily AI Requests</strong></span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                      <span>Access to all premium templates</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                      <span>Secure Cloud Saving</span>
                    </li>
                  </ul>
                </div>
                <button 
                  onClick={() => openAuth('signup')}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold py-3 rounded-xl transition-all mt-8 cursor-pointer"
                >
                  Sign Up Free
                </button>
              </div>
            )}

            {/* 3. Premium Tier (Founding vs Standard) */}
            {paidFoundingCount === null || paidFoundingCount < FOUNDING_LIMIT ? (
              <div className="border-2 border-indigo-600 rounded-2xl p-6 flex flex-col justify-between bg-white relative shadow-md">
                <div className="absolute top-0 right-6 -translate-y-1/2 bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-white">
                  Founding Premium
                </div>
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Premium Tier</h3>
                      <p className="text-xs text-indigo-600 font-semibold mt-0.5">First {FOUNDING_LIMIT} subscribers</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-indigo-600">$3.99</span>
                      <span className="block text-[9px] text-gray-400 font-bold uppercase">/ month</span>
                    </div>
                  </div>
                  <div className="h-px bg-gray-200 my-4" aria-hidden="true" />
                  <ul className="space-y-3.5 text-xs text-gray-700">
                    <li className="flex items-start gap-2.5 font-semibold text-indigo-900">
                      <CheckCircle size={14} className="text-indigo-600 mt-0.5 shrink-0 animate-pulse" />
                      <span><strong>100 Daily AI Requests ⚡</strong></span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                      <span>Highest priority model routing</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                      <span>All Free tier features</span>
                    </li>
                  </ul>
                </div>
                <button 
                  onClick={() => openAuth('signup', 'upgrade')}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 rounded-xl shadow-md active:scale-95 transition-all mt-8 cursor-pointer"
                >
                  Upgrade to Premium
                </button>
              </div>
            ) : (
              <div className="border-2 border-indigo-600 rounded-2xl p-6 flex flex-col justify-between bg-white relative shadow-md">
                <div className="absolute top-0 right-6 -translate-y-1/2 bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-white">
                  Premium
                </div>
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Premium Tier</h3>
                      <p className="text-xs text-indigo-600 font-semibold mt-0.5">High-speed AI priority</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-indigo-600">$9.99</span>
                      <span className="block text-[9px] text-gray-400 font-bold uppercase">/ month</span>
                    </div>
                  </div>
                  <div className="h-px bg-gray-200 my-4" aria-hidden="true" />
                  <ul className="space-y-3.5 text-xs text-gray-700">
                    <li className="flex items-start gap-2.5 font-semibold text-indigo-900">
                      <CheckCircle size={14} className="text-indigo-600 mt-0.5 shrink-0 animate-pulse" />
                      <span><strong>75 Daily AI Requests ⚡</strong></span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                      <span>Priority model routing</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                      <span>All Free tier features</span>
                    </li>
                  </ul>
                </div>
                <button 
                  onClick={() => openAuth('signup', 'upgrade')}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 rounded-xl shadow-md active:scale-95 transition-all mt-8 cursor-pointer"
                >
                  Upgrade to Premium
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* About & Trust Section (E-E-A-T Authority) */}
      <section id="about" aria-labelledby="about-heading" className="py-14 bg-gray-50 border-t border-gray-200 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 id="about-heading" className="text-xl font-bold text-gray-900 mb-3">About Agent Rez AI</h2>
          <p className="text-xs text-gray-600 leading-relaxed max-w-2xl mx-auto mb-6">
            Agent Rez AI is built by G.Intent Co (Global Intent Company) — an independent, founder-led studio combining a clear product vision with AI-accelerated development to eliminate the opaque paywalls and formatting errors of traditional online resume tools. We combine mathematical ATS-layout precision with state-of-the-art Groq AI processing to help professionals present verified, highly competitive career achievements.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-gray-700">
            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-blue-600" /> ATS Parsing Verified</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-blue-600" /> Accessibility Conscious</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-blue-600" /> Enterprise Cloud Security</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer role="contentinfo" className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-5xl mx-auto px-6 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-1.5 rounded-lg text-white">
                <Bot size={16} />
              </div>
              <span className="text-base font-bold tracking-tight text-white">
                Agent Rez AI
              </span>
            </div>
            
            {/* E-E-A-T Navigation Links */}
            <nav aria-label="Footer navigation" className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400 font-medium">
              <Link href="#about" className="hover:text-white transition-colors">About</Link>
              <Link href="mailto:support@agentrez.ai" id="contact" className="hover:text-white transition-colors">Contact</Link>
              <Link href="/privacy" id="privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" id="terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/llms.txt" className="hover:text-white transition-colors">llms.txt</Link>
              <Link href="/sitemap.xml" className="hover:text-white transition-colors">Sitemap</Link>
            </nav>
          </div>

          <div className="text-center space-y-3">
            <p className="text-xs text-gray-500 leading-relaxed max-w-lg mx-auto">
              High-speed, ATS-optimized executive resumes designed by professionals, built by artificial intelligence. Verified compliant with industry recruiting standards.
            </p>
            <p className="text-[10px] text-gray-600">
              &copy; {new Date().getFullYear()} Agent Rez AI. All rights reserved. Built using high-performance Groq AI APIs and secure Supabase cloud storage.
            </p>
          </div>
        </div>
      </footer>
      </main>

      {/* Authentication Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} defaultView={authModalView} />
    </div>
  );
}
