'use client';
import { useState, useEffect } from 'react';
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
  Printer
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import AuthModal from './AuthModal';

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

export default function LandingPage({ onOpenResume }: { onOpenResume: () => void }) {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [activeSandboxTab, setActiveSandboxTab] = useState<"bullets" | "summary" | "keywords">("bullets");
  const [sandboxInput, setSandboxInput] = useState("");
  const [sandboxOutput, setSandboxOutput] = useState("");
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [activeTemplateIdx, setActiveTemplateIdx] = useState(0);

  // Set default sample when sandbox tab changes
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

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Sandbox evaluation limited. Guests get 5 requests daily.");
      }

      if (resData.success) {
        setSandboxOutput(resData.text);
        toast.success("AI suggestion generated! ✨");
      } else {
        throw new Error(resData.error || "Failed to generate suggestions.");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
      setSandboxOutput(`⚠️ LIMITATION NOTICE: ${err.message || "AI engine request failed. Guest tier is limited to 5 daily requests. Sign up to unlock unlimited high-speed requests."}`);
    } finally {
      setSandboxLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Banner: Transparency & Guarantee */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white text-center py-2.5 px-4 text-xs font-semibold tracking-wide flex items-center justify-center gap-2 shadow-inner">
        <Zap size={14} className="animate-bounce" />
        <span><b>100% Free Guarantee</b>: No paywalls, no watermark extortion, and absolutely no credit card required.</span>
      </div>

      {/* Main Header / Navigation */}
      <header className="border-b border-gray-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-xl text-white shadow-sm">
              <Bot size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">
              Agent Rez <span className="text-blue-600 font-semibold text-xs bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setActiveSandboxTab("bullets");
                const el = document.getElementById("sandbox-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors hidden md:block"
            >
              Try Sandbox
            </button>
            <button 
              onClick={() => {
                const el = document.getElementById("features-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors hidden md:block mr-4"
            >
              Explore Capabilities
            </button>
            <button 
              onClick={() => setAuthModalOpen(true)}
              className="text-xs font-bold text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all cursor-pointer"
            >
              Sign In
            </button>
            <button 
              onClick={() => setAuthModalOpen(true)}
              className="bg-gray-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              Create Free Account
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24 bg-white border-b border-gray-200/70">
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
            Meet <b>Agent Rez</b>—your smart career assistant. Build high-converting, ATS-optimized professional resumes live via an interactive conversational chat, or step through a 5-minute guided career interview. No payment walls, no fake limits, and zero hidden export charges.
          </motion.p>

          {/* Core Call to Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button 
              onClick={onOpenResume} 
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Play size={16} />
              <span>Launch Builder as Guest</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button 
              onClick={() => setAuthModalOpen(true)} 
              className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-900 border border-gray-200/80 px-8 py-4 rounded-xl font-bold transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Cloud size={16} className="text-blue-500" />
              <span>Sign Up for Unlimited AI</span>
            </button>
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
              <span className="text-xl md:text-2xl font-black text-gray-900">Unlimited</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mt-0.5">Saves for Users</span>
            </div>
          </motion.div>
        </div>

        {/* Ambient decorative blobs */}
        <div className="absolute top-1/4 -left-36 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="absolute bottom-1/4 -right-36 w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
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
                <div className="space-y-2">
                  {(Object.keys(SANDBOX_PRESETS) as Array<keyof typeof SANDBOX_PRESETS>).map((tab) => (
                    <button
                      key={tab}
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
            <div className="p-6 md:col-span-7 flex flex-col justify-between">
              <div className="space-y-4 flex-1 flex flex-col">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    {SANDBOX_PRESETS[activeSandboxTab].label}
                  </label>
                  <textarea
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
                  <div className="flex-1 border border-gray-200 rounded-xl bg-gray-50 p-3 text-xs leading-relaxed text-gray-800 font-sans select-text overflow-y-auto whitespace-pre-wrap max-h-[180px]">
                    {sandboxLoading ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-6">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-50/50 border border-gray-200/80 p-6 rounded-2xl shadow-inner transition-all hover:border-gray-300">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-5 border border-blue-100 shadow-xs">
                <Bot size={20} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">
                1. Conversational Career Agent (Agent Rez)
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Directly chat with <b>Agent Rez</b> in the sidebar. Command him to write summaries, insert certifications, rewrite jobs using action verbs, or completely format sections. Witness edits populate the resume canvas in real-time.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50/50 border border-gray-200/80 p-6 rounded-2xl shadow-inner transition-all hover:border-gray-300">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-5 border border-indigo-100 shadow-xs">
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
            <div className="bg-gray-50/50 border border-gray-200/80 p-6 rounded-2xl shadow-inner transition-all hover:border-gray-300">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-5 border border-purple-100 shadow-xs">
                <Sliders size={20} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">
                3. Micro-Spacing & Style Engine
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Perfect spacing makes resumes look executive. Adjust line spacing, section dividers, margins, card paddings, and theme colors with robust sliders. Keep your layout uniform across single or multiple pages effortlessly.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-50/50 border border-gray-200/80 p-6 rounded-2xl shadow-inner transition-all hover:border-gray-300">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-5 border border-emerald-100 shadow-xs">
                <Layout size={20} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">
                4. 6 ATS-Compliant Layout Templates
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Switch instantly between industry layouts: Harvard Classic, Sidebar Executive, Modern Chic, and Traditional. All layouts compile semantic HTML tags matching the strict guidelines of modern applicant tracking algorithms.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gray-50/50 border border-gray-200/80 p-6 rounded-2xl shadow-inner transition-all hover:border-gray-300">
              <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-5 border border-rose-100 shadow-xs">
                <Cloud size={20} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">
                5. Secure Cloud Dashboard & Autosaving
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Never lose an edit. Free registered users get instant auto-saving to secure Supabase Postgres DB, allowing you to manage, duplicate, rename, or restore multiple drafts across any desktop or mobile device.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gray-50/50 border border-gray-200/80 p-6 rounded-2xl shadow-inner transition-all hover:border-gray-300">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-5 border border-amber-100 shadow-xs">
                <Printer size={20} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">
                6. Precision PDF Native Prints
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
            
            <div className="w-full md:w-2/3 bg-gray-50 border border-gray-200/80 rounded-xl p-5 h-[230px] flex flex-col justify-between">
              <div className="space-y-3 opacity-65 select-none pointer-events-none">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <div className="h-4 w-28 bg-gray-300 rounded" />
                  <div className="h-3 w-36 bg-gray-200 rounded" />
                </div>
                <div className="space-y-1">
                  <div className="h-2 w-full bg-gray-200 rounded" />
                  <div className="h-2 w-4/5 bg-gray-200 rounded" />
                </div>
                {TEMPLATES_INFO[activeTemplateIdx].id.includes("sidebar") ? (
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="col-span-1 space-y-1">
                      <div className="h-3 w-10 bg-blue-200 rounded" />
                      <div className="h-2 w-full bg-gray-200 rounded" />
                      <div className="h-2 w-full bg-gray-200 rounded" />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <div className="h-3 w-20 bg-gray-300 rounded" />
                      <div className="h-2 w-full bg-gray-200 rounded" />
                      <div className="h-2 w-11/12 bg-gray-200 rounded" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 pt-2">
                    <div className="h-3.5 w-32 bg-gray-300 rounded" />
                    <div className="h-2 w-full bg-gray-200 rounded" />
                    <div className="h-2 w-5/6 bg-gray-200 rounded" />
                  </div>
                )}
              </div>
              <button
                onClick={onOpenResume}
                className="w-full sm:w-auto self-end bg-gray-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Edit template now</span>
                <ChevronRight size={13} />
              </button>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Guest Plan */}
            <div className="border border-gray-200 rounded-2xl p-6 flex flex-col justify-between bg-gray-50/20">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-base font-bold text-gray-900">Guest Tier</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Perfect for quick one-off edits</p>
                  </div>
                  <span className="text-xl font-black text-gray-900">FREE</span>
                </div>
                <div className="h-px bg-gray-200 my-4" />
                <ul className="space-y-3.5 text-xs text-gray-700">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                    <span><b>5 daily requests</b> for Sidebar AI Agent & quick tools</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                    <span>Access to all <b>6 premium templates</b></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                    <span><b>Unlimited PDF prints</b> with no watermarks</span>
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
              <button 
                onClick={onOpenResume}
                className="w-full bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 text-xs font-bold py-3 rounded-xl transition-all mt-8 cursor-pointer shadow-xs"
              >
                Start Editing Instantly (No signup)
              </button>
            </div>

            {/* Signed Up Plan */}
            <div className="border-2 border-blue-600 rounded-2xl p-6 flex flex-col justify-between bg-white relative shadow-md">
              <div className="absolute top-0 right-6 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-white">
                Highly Recommended
              </div>
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-base font-bold text-gray-900">Signed-Up Tier</h4>
                    <p className="text-xs text-blue-600 font-semibold mt-0.5">Complete digital resume suite</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-blue-600">FREE</span>
                    <span className="block text-[9px] text-gray-400 font-bold uppercase">No Card Required</span>
                  </div>
                </div>
                <div className="h-px bg-gray-200 my-4" />
                <ul className="space-y-3.5 text-xs text-gray-700">
                  <li className="flex items-start gap-2.5 font-semibold text-blue-900">
                    <CheckCircle size={14} className="text-blue-600 mt-0.5 shrink-0 animate-pulse" />
                    <span><b>100% Unlimited AI Agent</b> requests & quick tools</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                    <span>Access to all <b>6 premium templates</b></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                    <span><b>Unlimited PDF prints</b> with no watermarks</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                    <span><b>Secure Cloud Saving</b> for unlimited drafts</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                    <span>Duplicate, rename, and manage drafts dashboard</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => setAuthModalOpen(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 rounded-xl shadow-md active:scale-95 transition-all mt-8 cursor-pointer"
              >
                Sign Up 100% Free Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-1.5 rounded-lg text-white">
              <Bot size={16} />
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              Agent Rez AI
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto">
            High-speed, ATS-optimized executive resumes designed by professionals, built by artificial intelligence. Verified compliant with current industry guidelines.
          </p>
          <div className="h-px bg-gray-800 max-w-sm mx-auto my-4" />
          <p className="text-[10px] text-gray-600">
            &copy; {new Date().getFullYear()} Agent Rez AI. All rights reserved. Built using high-performance Groq AI APIs and secure Supabase cloud storage.
          </p>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
