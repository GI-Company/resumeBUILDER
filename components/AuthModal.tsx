import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success('Check your email for the confirmation link!');
        onClose();
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
      <div className="bg-[#241f26] border border-[#443f47] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-[#33303a]">
          <h2 className="text-lg font-bold text-[#f2ecef]">{isSignUp ? 'Create an Account' : 'Sign In'}</h2>
          <button onClick={onClose} className="text-[#a19b9d] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#b9b3b6] mb-1.5">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#181519] text-[#f2ecef] border border-[#33303a] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#b9b3b6] mb-1.5">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#181519] text-[#f2ecef] border border-[#33303a] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-6 bg-[var(--accent)] text-white border-none rounded-lg px-4 py-2.5 font-bold cursor-pointer hover:bg-opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
          
          <div className="mt-4 text-center">
            <button 
              type="button" 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[#a19b9d] text-sm hover:text-white transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
