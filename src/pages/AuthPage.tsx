import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Loader2, Lock, Mail, ArrowLeft } from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'reset';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // CONFIG: Change this to your authorized domain
  const ALLOWED_DOMAIN = 'datrixtechsolutions.com';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email);
        setMessage('Check your inbox! A reset link has been sent.');
        setMode('login');
      } else {
        // Domain Check for Sign Up
        if (mode === 'signup' && !email.endsWith(`@${ALLOWED_DOMAIN}`)) {
          throw new Error(`Registration is restricted to @${ALLOWED_DOMAIN} accounts.`);
        }

        if (mode === 'signup') {
          await createUserWithEmailAndPassword(auth, email, password);
        } else {
          await signInWithEmailAndPassword(auth, email, password);
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message.replace('Firebase:', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4">
      <div className="w-full max-w-[400px]">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-4 shadow-lg">
            <Lock className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">Project Phelo</h1>
        </div>

        <form onSubmit={handleAuth} className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            {mode !== 'login' && (
              <button type="button" onClick={() => setMode('login')} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                <ArrowLeft className="w-4 h-4 text-slate-500" />
              </button>
            )}
            <h2 className="text-xl font-semibold text-slate-900">
              {mode === 'login' && 'Welcome back'}
              {mode === 'signup' && 'Create account'}
              {mode === 'reset' && 'Reset password'}
            </h2>
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded">{error}</div>}
          {message && <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700 text-xs rounded">{message}</div>}

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Email Address</label>
              <input
                type="email"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`you@${ALLOWED_DOMAIN}`}
                value={email} onChange={e => setEmail(e.target.value)} required
              />
            </div>

            {mode !== 'reset' && (
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">Password</label>
                  {mode === 'login' && (
                    <button type="button" onClick={() => setMode('reset')} className="text-[11px] text-blue-600 font-medium">Forgot?</button>
                  )}
                </div>
                <input
                  type="password"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required={mode !== 'reset'}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white p-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'
              )}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            {mode === 'login' ? (
              <p className="text-slate-500 text-xs">
                Don't have an account? <button type="button" onClick={() => setMode('signup')} className="text-blue-600 font-semibold">Sign up here</button>
              </p>
            ) : (
              <button type="button" onClick={() => setMode('login')} className="text-slate-500 text-xs font-semibold">Back to Login</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};