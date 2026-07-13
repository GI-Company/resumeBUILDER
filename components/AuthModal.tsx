import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, ArrowLeft, Mail, ShieldAlert, CheckCircle } from 'lucide-react';
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSignUp) {
        // Validate passwords match
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        
        // Validate Date of Birth (must be a valid past date)
        if (new Date(dob) >= new Date()) {
          throw new Error('Please select a valid Date of Birth in the past');
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              first_name: firstName,
              last_name: lastName,
              state: stateName,
              dob: dob,
            }
          }
        });
        
        if (error) throw error;
        
        toast.success('Registration code sent to your email!');
        setStep('verify');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Successfully logged in!');
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup'
      });
      
      if (error) throw error;
      
      toast.success('Email successfully verified! Welcome aboard.');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to verify verification code');
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
        options: {
          emailRedirectTo: window.location.origin,
        }
      });
      if (error) throw error;
      toast.success('A fresh 6-digit verification code has been dispatched.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-modal-overlay" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 font-sans">
      <div id="auth-modal-card" className="bg-[#0b090c]/90 border border-purple-900/40 rounded-2xl shadow-[0_0_50px_rgba(112,0,223,0.15)] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-purple-900/20 bg-gradient-to-r from-purple-950/20 to-transparent">
          <div className="flex items-center gap-2">
            {step === 'verify' && (
              <button 
                onClick={() => setStep('auth')} 
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5 mr-1"
                title="Back to Form"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <h2 className="text-xl font-bold tracking-tight text-white">
              {step === 'verify' ? 'Confirm Registration' : (isSignUp ? 'Create Premium Account' : 'Sign In')}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
            <X size={20} />
          </button>
        </div>

        {step === 'auth' ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {isSignUp && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-purple-300 mb-1.5">First Name</label>
                  <input 
                    type="text" 
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="w-full bg-[#141116] text-[#f2ecef] border border-purple-900/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder-gray-600"
                    placeholder="Jane"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-purple-300 mb-1.5">Last Name</label>
                  <input 
                    type="text" 
                    required
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="w-full bg-[#141116] text-[#f2ecef] border border-purple-900/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder-gray-600"
                    placeholder="Doe"
                  />
                </div>
              </div>
            )}

            {isSignUp && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-purple-300 mb-1.5">US State</label>
                  <select 
                    required
                    value={stateName}
                    onChange={e => setStateName(e.target.value)}
                    className="w-full bg-[#141116] text-[#f2ecef] border border-purple-900/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all cursor-pointer"
                  >
                    <option value="" disabled className="text-gray-500">Select state</option>
                    {US_STATES.map(st => (
                      <option key={st.code} value={st.name} className="bg-[#141116]">
                        {st.name} ({st.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-purple-300 mb-1.5">Date of Birth</label>
                  <input 
                    type="date" 
                    required
                    value={dob}
                    onChange={e => setDob(e.target.value)}
                    className="w-full bg-[#141116] text-[#f2ecef] border border-purple-900/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all cursor-pointer"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-300 mb-1.5">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#141116] text-[#f2ecef] border border-purple-900/30 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder-gray-600"
                placeholder="you@example.com"
              />
            </div>

            <div className={isSignUp ? "grid grid-cols-2 gap-4" : ""}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-purple-300 mb-1.5">Password</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[#141116] text-[#f2ecef] border border-purple-900/30 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder-gray-600"
                  placeholder="••••••••"
                />
              </div>

              {isSignUp && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-purple-300 mb-1.5">Confirm Password</label>
                  <input 
                    type="password" 
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#141116] text-[#f2ecef] border border-purple-900/30 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder-gray-600"
                    placeholder="••••••••"
                  />
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white border-none rounded-lg px-4 py-2.5 font-bold cursor-pointer hover:shadow-[0_0_20px_rgba(112,0,223,0.3)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : (isSignUp ? 'Generate Verification Code' : 'Sign In')}
            </button>
            
            <div className="mt-4 text-center">
              <button 
                type="button" 
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  // Clear fields on switch
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="text-gray-400 text-sm hover:text-white transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </form>
        ) : (
          /* OTP Verification Step */
          <form onSubmit={handleVerifyOtp} className="p-6 space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-purple-950/40 border border-purple-500/30 flex items-center justify-center text-cyan-400">
                <Mail size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-300">
                  We've sent a 6-digit confirmation code to:
                </p>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {email}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-300 text-center mb-2.5">
                6-Digit Verification Code
              </label>
              <input 
                type="text" 
                required
                maxLength={6}
                pattern="\d{6}"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full max-w-xs mx-auto block bg-[#141116] text-[#f2ecef] border border-purple-900/30 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-[0.75em] focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder-gray-700"
                placeholder="000000"
              />
            </div>

            <div className="space-y-3">
              <button 
                type="submit" 
                disabled={loading || otp.length !== 6}
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white border-none rounded-lg px-4 py-2.5 font-bold cursor-pointer hover:shadow-[0_0_20px_rgba(112,0,223,0.3)] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>

              <div className="flex items-center justify-between px-2 text-xs text-gray-400">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="hover:text-white transition-colors underline"
                >
                  Resend Code
                </button>
                <button
                  type="button"
                  onClick={() => setStep('auth')}
                  className="hover:text-white transition-colors"
                >
                  Change Email
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
