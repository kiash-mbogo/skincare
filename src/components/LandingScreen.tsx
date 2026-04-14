/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, User } from 'lucide-react';
import { loginWithEmail, signUpWithEmail, loginWithGoogle } from '../services/authService';

interface LandingScreenProps {
  onNext: () => void;
}

export const LandingScreen = ({ onNext }: LandingScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError('');
    try {
      await signUpWithEmail(email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-brand-400 flex flex-col items-center justify-center p-8 text-white">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-32 h-32 bg-brand-50 rounded-3xl flex items-center justify-center mb-6 shadow-xl"
      >
        <div className="flex flex-col items-center">
          <Sparkles className="text-brand-400" size={48} />
          <span className="text-brand-400 font-display font-bold text-xl mt-1">GLOW</span>
        </div>
      </motion.div>
      
      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-display font-bold text-center mb-2"
      >
        GLOW
      </motion.h1>
      
      <motion.p 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-lg font-medium text-center italic mb-12 opacity-90"
      >
        "Because Every Skin Deserves to Glow"
      </motion.p>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-xs space-y-4"
      >
        <div className="space-y-1">
          <h2 className="text-sm font-semibold ml-1 text-white/80">Welcome</h2>
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white text-slate-900 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-white/50 transition-all placeholder:text-slate-400"
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white text-slate-900 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-white/50 transition-all placeholder:text-slate-400"
          />
        </div>

        {error && <p className="text-xs text-red-200 bg-red-500/20 p-2 rounded-lg">{error}</p>}
        
        <button 
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-transform disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Login'}
        </button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-brand-400 px-2 text-white/60 font-medium">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={handleGoogleSignIn}
            className="flex items-center justify-center gap-2 bg-white text-slate-900 font-bold py-3 rounded-xl shadow-md active:scale-95 transition-transform text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
              />
            </svg>
            Google
          </button>
          <button 
            className="flex items-center justify-center gap-2 bg-white text-slate-900 font-bold py-3 rounded-xl shadow-md active:scale-95 transition-transform text-sm opacity-50 cursor-not-allowed"
          >
            <User className="w-4 h-4" />
            Apple
          </button>
        </div>
        
        <button 
          onClick={handleSignUp}
          disabled={loading}
          className="w-full text-center text-sm font-medium hover:underline text-white/80"
        >
          Don't have an account? <span className="text-white font-bold">Sign Up</span>
        </button>
      </motion.div>
    </div>
  );
};
