import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Terms of Service | Agent Rez AI",
  description: "Terms of Service for Agent Rez AI",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-semibold text-xl text-gray-900">
            Agent Rez AI
          </Link>
          <Link href="/privacy" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            Privacy Policy
          </Link>
        </div>
      </header>
      
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 md:py-20">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12 prose prose-blue max-w-none">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              By accessing and using Agent Rez AI ("we," "our," or "us"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Agent Rez AI provides a web-based resume builder, ATS scoring tools, and AI-powered text generation. The service is provided "as is" and "as available."
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">3. User Accounts & Data</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              You must provide accurate information when creating an account. You are responsible for maintaining the security of your account. You retain all rights to the content you input into your resume.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">4. AI Features & Generation</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Our AI features are provided to assist in the creation of your resume. You are solely responsible for reviewing, editing, and verifying the accuracy of any AI-generated content before using it professionally.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">5. Limitation of Liability</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Agent Rez AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or employment opportunities.
            </p>
          </section>
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Agent Rez AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
