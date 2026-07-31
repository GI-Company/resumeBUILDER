'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, ArrowLeft, Mail, ShieldAlert, CheckCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import posthog from 'posthog-js';

const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' }
];

export default function AuthModal({ isOpen, onClose, defaultView = 'signin' }: { isOpen: boolean; onClose: () => void; defaultView?: 'signin' | 'signup' }) {
  const [isSignUp, setIsSignUp] = useState(defaultView === 'signup');

  useEffect(() => {
    if (isOpen) {
      setIsSignUp(defaultView === 'signup');
      setSignUpStep(1);
      setStep('auth');
    }
  }, [isOpen, defaultView]);
  const [signUpStep, setSignUpStep] = useState(1); // 1: Credentials, 2: Profile
  const [step, setStep] = useState<'auth' | 'verify'>('auth');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [stateName, setStateName] = useState('');
  const [dob, setDob] = useState('');
  
  // OTP field
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match. Please verify your confirmation password.');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setSignUpStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSignUp) {
        // Final validation
        if (!firstName.trim() || !lastName.trim() || !stateName || !dob) {
          throw new Error('All profile fields are mandatory for security clearance.');
        }
        
        const birthDate = new Date(dob);
        const today = new Date();
        if (isNaN(birthDate.getTime()) || birthDate >= today) {
          throw new Error('Valid Date of Birth required for identity verification.');
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              state: stateName,
              dob: dob,
            }
          }
        });
        
        if (error) {
          if (error.status === 429) throw new Error('Too many attempts. Please wait 60 seconds.');
          throw error;
        }
        
        toast.success('Verification code sent. Please check your email.');
        setStep('verify');
      } else {
        const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (signInData.user) {
          posthog.identify(signInData.user.id, { email: signInData.user.email });
          posthog.capture('user_signed_in', { auth_provider: 'email' });
        }
        toast.success('Welcome back.');
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('6-digit verification code required.');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup'
      });
      
      if (error) {
        if (error.message.includes('expired')) throw new Error('Code expired. Please request a new one.');
        throw error;
      }

      const { data: { user: verifiedUser } } = await supabase.auth.getUser();
      if (verifiedUser) {
        posthog.identify(verifiedUser.id, { email: verifiedUser.email });
        posthog.capture('user_signed_up', { auth_provider: 'email' });
      }

      toast.success('Account verified successfully.');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      if (error) throw error;
      toast.success('A new verification code has been sent.');
    } catch (err: any) {
      toast.error(err.message || 'Resend failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-modal-overlay" className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 font-sans">
      <div id="auth-modal-card" className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Progress Indicator */}
        {isSignUp && step === 'auth' && (
          <div className="h-1 w-full bg-gray-100">
            <div 
              className="h-full bg-blue-600 transition-all duration-700 ease-out"
              style={{ width: `${(signUpStep / 2) * 100}%` }}
            />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-10 pb-6">
          <div className="flex items-center gap-4">
            {(step === 'verify' || (isSignUp && signUpStep === 2)) && (
              <button 
                onClick={() => step === 'verify' ? setStep('auth') : setSignUpStep(1)} 
                className="text-gray-400 hover:text-gray-900 transition-colors p-2 -ml-2 rounded-xl hover:bg-gray-100"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                {step === 'verify' ? 'Verify Email' : (isSignUp ? 'Create Account' : 'Sign In')}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                  {isSignUp ? `Step ${signUpStep} of 2` : 'Welcome back'}
                </p>
              </div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close authentication modal" className="text-gray-400 hover:text-gray-900 transition-colors p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="px-8 pb-10 pt-2">
          {step === 'auth' ? (
            <div className="space-y-8">
              {/* Credentials Phase */}
              {(!isSignUp || signUpStep === 1) && (
                <form onSubmit={isSignUp ? handleNextStep : handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold text-gray-700 ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-400"
                        placeholder="name@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[12px] font-bold text-gray-700">Password</label>
                      {!isSignUp && (
                        <Link 
                          href="/forgot-password"
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-500"
                        >
                          Forgot password?
                        </Link>
                      )}
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-xl pl-12 pr-12 py-3.5 text-sm focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-400"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {isSignUp && (
                    <div className="space-y-2 relative">
                      <label className="text-[12px] font-bold text-gray-700 ml-1">Confirm Password</label>
                      <div className="relative group">
                        <ShieldAlert className={cn("absolute left-4 top-1/2 -translate-y-1/2 transition-colors", confirmPassword && password !== confirmPassword ? "text-red-500" : "text-gray-400 group-focus-within:text-blue-600")} size={16} />
                        <input 
                          type={showPassword ? "text" : "password"} 
                          required
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className={cn(
                            "w-full bg-gray-50 text-gray-900 border rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none transition-all placeholder:text-gray-400",
                            confirmPassword && password !== confirmPassword 
                              ? "border-red-500/20 focus:border-red-500" 
                              : "border-gray-200 focus:border-blue-500"
                          )}
                          placeholder="••••••••"
                        />
                      </div>
                      {confirmPassword && password !== confirmPassword && (
                        <p className="absolute -bottom-5 left-1 text-[9px] font-bold text-red-500">
                          Passwords do not match
                        </p>
                      )}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full mt-8 bg-gray-900 hover:bg-black text-white rounded-xl py-4 text-sm font-bold shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-3">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (isSignUp ? 'Next: Profile Details' : 'Sign In')}
                  </button>
                </form>
              )}

              {/* Profile Phase */}
              {isSignUp && signUpStep === 2 && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[12px] font-bold text-gray-700 ml-1">First Name</label>
                      <input 
                        type="text" 
                        required
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-400"
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[12px] font-bold text-gray-700 ml-1">Last Name</label>
                      <input 
                        type="text" 
                        required
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-400"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[12px] font-bold text-gray-700 ml-1">State</label>
                      <select 
                        required
                        value={stateName}
                        onChange={e => setStateName(e.target.value)}
                        className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                      >
                        <option value="" disabled>Select state</option>
                        {US_STATES.map(st => (
                          <option key={st.code} value={st.name}>
                            {st.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[12px] font-bold text-gray-700 ml-1">Birth Date</label>
                      <input 
                        type="date" 
                        required
                        value={dob}
                        onChange={e => setDob(e.target.value)}
                        className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full mt-4 bg-gray-900 hover:bg-black text-white rounded-xl py-4 text-sm font-bold shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-3">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Finishing up...
                      </span>
                    ) : 'Complete Sign Up'}
                  </button>
                </form>
              )}
              
              <div className="text-center pt-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setSignUpStep(1);
                    setPassword('');
                    setConfirmPassword('');
                  }}
                  className="text-gray-500 text-[11px] font-bold uppercase tracking-wider hover:text-gray-900 transition-colors"
                >
                  {isSignUp ? 'Already have an account? Sign In' : 'Don\'t have an account? Create one'}
                </button>
              </div>
            </div>
          ) : (
            /* OTP Verification Step */
            <form onSubmit={handleVerifyOtp} className="space-y-10">
              <div className="flex flex-col items-center text-center space-y-5">
                <div className="w-20 h-20 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm animate-pulse">
                  <ShieldAlert size={36} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Verification code sent to:
                  </p>
                  <p className="text-sm font-bold text-gray-900 tracking-tight">
                    {email}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 text-center">
                  6-Digit Verification Code
                </label>
                <input 
                  type="text" 
                  required
                  maxLength={6}
                  pattern="\d{6}"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-2xl px-4 py-5 text-center text-4xl font-mono tracking-[0.6em] focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-200"
                  placeholder="000000"
                />
              </div>

              <div className="space-y-5">
                <button 
                  type="submit" 
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-gray-900 hover:bg-black text-white rounded-xl py-4.5 text-sm font-bold shadow-xl active:scale-[0.98] transition-all disabled:opacity-20"
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </button>

                <div className="flex items-center justify-between px-2">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-[10px] font-bold text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors"
                  >
                    Resend Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('auth')}
                    className="text-[10px] font-bold text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors"
                  >
                    Change Email
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
