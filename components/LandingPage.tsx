import React from 'react';
import { PublicATSScanner } from './landing/PublicATSScanner';
import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-md sticky top-0 z-50 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Sparkles className="w-6 h-6 text-primary" />
            <span>AgentRez</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            <span>AI-Powered Resume Optimization & ATS Scanner</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
            Land Your Dream Job With <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">AI-Optimized</span> Resumes
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Stop getting rejected by applicant tracking systems. AgentRez instantly analyzes, rewrites, and tailors your resume for every job application.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
            >
              Start Building Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#scanner"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-card border border-border text-foreground font-semibold hover:bg-card/80 transition-all flex items-center justify-center gap-2"
            >
              Test ATS Scanner Below
            </a>
          </div>
        </section>

        {/* Public ATS Scanner Section */}
        <div id="scanner">
          <PublicATSScanner />
        </div>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-border/40">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Why Job Seekers Choose AgentRez
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to beat the ATS and impress hiring managers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-card border border-border/50 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Instant AI Tailoring</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Tailor your experience bullet points to match target job descriptions in seconds using advanced LLMs.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-card border border-border/50 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">ATS Compatibility Check</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Ensure your resume passes robotic screeners with deep formatting and keyword optimization checks.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-card border border-border/50 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">One-Click Export</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Download clean, professional PDF resumes ready for submission to top employers worldwide.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} AgentRez. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
