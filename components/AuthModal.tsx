import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, ArrowLeft, Mail, ShieldAlert, CheckCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

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

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isSignUp, setIsSignUp] = useState(false);
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
    if (password.length < 6) {
      toast.error('Security Protocol: Password must be at least 6 characters.');
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
          if (error.status === 429) throw new Error('Too many attempts. System on cooldown. Wait 60 seconds.');
          throw error;
        }
        
        toast.success('Identity challenge issued. Check your email for the 6-digit code.');
        setStep('verify');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Neural link established. Welcome back.');
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication sequence failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('6-digit authentication token required.');
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
        if (error.message.includes('expired')) throw new Error('Token expired. Request a new sequence.');
        throw error;
      }
      
      toast.success('Account synchronized. Verification complete.');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Verification sequence failed.');
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
      toast.success('New 6-digit token dispatched to your terminal.');
    } catch (err: any) {
      toast.error(err.message || 'Resend protocol failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-modal-overlay" className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]/90 backdrop-blur-xl p-4 font-sans">
      <div id="auth-modal-card" className="bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(112,0,223,0.15)] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Progress Indicator */}
        {isSignUp && step === 'auth' && (
          <div className="h-1 w-full bg-white/[0.02]">
            <div 
              className="h-full bg-gradient-to-r from-[#7000df] to-[#00f0ff] transition-all duration-700 ease-out"
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
                className="text-gray-500 hover:text-white transition-colors p-2 -ml-2 rounded-xl hover:bg-white/5"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                {step === 'verify' ? 'Verify Email' : (isSignUp ? 'Create Account' : 'Sign In')}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                  {isSignUp ? `Phase 0${signUpStep} / Secure Registration` : 'Professional Access Protocol'}
                </p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5">
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
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#00f0ff] transition-colors" size={16} />
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-white/[0.02] text-gray-100 border border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:border-[#00f0ff]/30 focus:ring-1 focus:ring-[#00f0ff]/30 transition-all placeholder:text-gray-700"
                        placeholder="name@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#00f0ff] transition-colors" size={16} />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-white/[0.02] text-gray-100 border border-white/5 rounded-xl pl-12 pr-12 py-3.5 text-sm font-medium focus:outline-none focus:border-[#00f0ff]/30 focus:ring-1 focus:ring-[#00f0ff]/30 transition-all placeholder:text-gray-700"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white p-1 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {isSignUp && (
                    <div className="space-y-2 relative">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Confirm Password</label>
                      <div className="relative group">
                        <ShieldAlert className={cn("absolute left-4 top-1/2 -translate-y-1/2 transition-colors", confirmPassword && password !== confirmPassword ? "text-red-500" : "text-gray-600 group-focus-within:text-[#00f0ff]")} size={16} />
                        <input 
                          type={showPassword ? "text" : "password"} 
                          required
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className={cn(
                            "w-full bg-white/[0.02] text-gray-100 border rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium focus:outline-none transition-all placeholder:text-gray-700",
                            confirmPassword && password !== confirmPassword 
                              ? "border-red-500/20 focus:border-red-500/40" 
                              : "border-white/5 focus:border-[#00f0ff]/30 focus:ring-1 focus:ring-[#00f0ff]/30"
                          )}
                          placeholder="••••••••"
                        />
                      </div>
                      {confirmPassword && password !== confirmPassword && (
                        <p className="absolute -bottom-5 left-1 text-[9px] font-bold text-red-500 uppercase tracking-widest">
                          Passwords do not match
                        </p>
                      )}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full mt-8 bg-white text-black hover:bg-gray-200 rounded-xl py-4 text-sm font-black uppercase tracking-[0.15em] shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-3">
                        <div className="w-4 h-4 border-2 border-black/10 border-t-black rounded-full animate-spin" />
                        Authenticating...
                      </span>
                    ) : (isSignUp ? 'Next: Profile Setup' : 'Sign In')}
                  </button>
                </form>
              )}

              {/* Profile Phase */}
              {isSignUp && signUpStep === 2 && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">First Name</label>
                      <input 
                        type="text" 
                        required
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        className="w-full bg-white/[0.02] text-gray-100 border border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#00f0ff]/30 transition-all placeholder:text-gray-800"
                        placeholder="First name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Last Name</label>
                      <input 
                        type="text" 
                        required
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        className="w-full bg-white/[0.02] text-gray-100 border border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#00f0ff]/30 transition-all placeholder:text-gray-800"
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">State</label>
                      <select 
                        required
                        value={stateName}
                        onChange={e => setStateName(e.target.value)}
                        className="w-full bg-[#0a0a0a] text-gray-100 border border-white/5 rounded-xl px-3 py-3 text-sm font-medium focus:outline-none focus:border-[#00f0ff]/30 transition-all cursor-pointer"
                      >
                        <option value="" disabled>Select State</option>
                        {US_STATES.map(st => (
                          <option key={st.code} value={st.name} className="bg-[#0a0a0a]">
                            {st.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Birth Date</label>
                      <input 
                        type="date" 
                        required
                        value={dob}
                        onChange={e => setDob(e.target.value)}
                        className="w-full bg-white/[0.02] text-gray-100 border border-white/5 rounded-xl px-3 py-3 text-sm font-medium focus:outline-none focus:border-[#00f0ff]/30 transition-all cursor-pointer"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full mt-4 bg-gradient-to-r from-[#7000df] to-[#5000a0] hover:from-[#8000ff] hover:to-[#7000df] text-white rounded-xl py-4 text-sm font-black uppercase tracking-[0.15em] shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-3">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Finalizing...
                      </span>
                    ) : 'Complete Registration'}
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
                  className="text-gray-600 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-white transition-colors"
                >
                  {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Create one'}
                </button>
              </div>
            </div>
          ) : (
            /* OTP Verification Step */
            <form onSubmit={handleVerifyOtp} className="space-y-10">
              <div className="flex flex-col items-center text-center space-y-5">
                <div className="w-20 h-20 rounded-3xl bg-[#00f0ff]/5 border border-[#00f0ff]/20 flex items-center justify-center text-[#00f0ff] shadow-2xl animate-pulse">
                  <ShieldAlert size={36} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                    Verification code sent to:
                  </p>
                  <p className="text-sm font-medium text-[#00f0ff] tracking-tight">
                    {email}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 text-center">
                  6-Digit Security Token
                </label>
                <input 
                  type="text" 
                  required
                  maxLength={6}
                  pattern="\d{6}"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-white/[0.02] text-[#00f0ff] border border-white/5 rounded-2xl px-4 py-5 text-center text-4xl font-mono tracking-[0.6em] focus:outline-none focus:border-[#00f0ff]/30 focus:ring-1 focus:ring-[#00f0ff]/30 transition-all placeholder:text-gray-900"
                  placeholder="000000"
                />
              </div>

              <div className="space-y-5">
                <button 
                  type="submit" 
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-white text-black hover:bg-gray-200 rounded-xl py-4.5 text-sm font-black uppercase tracking-[0.15em] shadow-xl active:scale-[0.98] transition-all disabled:opacity-20"
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </button>

                <div className="flex items-center justify-between px-2">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-[9px] font-black text-gray-600 hover:text-white uppercase tracking-widest transition-colors"
                  >
                    Resend Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('auth')}
                    className="text-[9px] font-black text-gray-600 hover:text-white uppercase tracking-widest transition-colors"
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
