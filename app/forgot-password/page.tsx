'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
      } else {
        setIsSent(true);
        toast.success('Reset link sent to your email.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 py-16 font-sans">
      <div className="max-w-md w-full">
        {/* Back link */}
        <Link 
          href="/" 
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8 sm:p-10">
            {isSent ? (
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-gray-900 mb-4">
                  Check your inbox
                </h1>
                <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                  We&apos;ve sent a password reset link to <span className="font-medium text-gray-900">{email}</span>. 
                  Click the link in the email to set a new password.
                </p>
                <button
                  onClick={() => setIsSent(false)}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  Try another email
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-black tracking-tight text-gray-900 mb-2">
                  Forgot Password
                </h1>
                <p className="text-gray-500 text-sm mb-8">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 text-sm placeholder-gray-400 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
