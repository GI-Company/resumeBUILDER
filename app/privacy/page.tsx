import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - MYresume",
  description: "Privacy Policy for MYresume",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-[family:'Kalam',cursive] font-bold text-xl text-gray-900">
            MYresume
          </Link>
          <Link href="/terms" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            Terms of Service
          </Link>
        </div>
      </header>
      
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 md:py-20">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12 prose prose-blue max-w-none">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We collect information you provide directly to us, including your name, email address, and the professional content (experience, education, skills) you enter into your resume.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We use the information we collect to provide, maintain, and improve our services, to process your requests, and to communicate with you about your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">3. Data Storage & Security</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Your resume data is stored securely in our database. We use industry-standard security measures to protect your personal information from unauthorized access, disclosure, or destruction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">4. Sharing with Third Parties</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We do not sell your personal information. We may share your data with trusted third-party service providers (such as hosting or AI generation APIs) solely for the purpose of providing our services to you.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">5. Your Rights</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              You have the right to access, update, or delete your personal information at any time through your account settings or by contacting our support team.
            </p>
          </section>
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} MYresume. All rights reserved.</p>
      </footer>
    </div>
  );
}
