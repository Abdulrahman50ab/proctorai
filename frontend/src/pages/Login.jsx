import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = ({ onSwitchToRegister, onCandidateAccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('examiner@test.com');
  const [password, setPassword] = useState('SecretPassword123!');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full glass-panel-glow rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        
        {/* Glow Accent */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-2 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Examiner Portal</h2>
          <p className="text-sm text-slate-400">Sign in to manage AI proctored exams and reports</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-3 text-rose-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="examiner@organization.com"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all transform active:scale-95 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In as Examiner'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-col space-y-3 text-center text-xs text-slate-400">
          <p>
            Don't have an examiner account?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4"
            >
              Register here
            </button>
          </p>

          <div className="py-2">
            <span className="text-slate-600">——— OR ———</span>
          </div>

          {/* Direct Candidate Entry button */}
          <button
            type="button"
            onClick={onCandidateAccess}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-200 font-medium flex items-center justify-center space-x-2 transition-all"
          >
            <UserCheck className="w-4 h-4 text-teal-400" />
            <span>Take Exam as Candidate</span>
          </button>
        </div>

      </div>
    </div>
  );
};
