import React from 'react';
import { Shield, User, LogOut, LayoutDashboard, PlusCircle, CheckCircle2, Cpu, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ currentTab, onTabChange }) => {
  const { user, logout, isExaminer } = useAuth();

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => onTabChange(isExaminer ? 'examiner_dashboard' : 'login')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all duration-300 transform group-hover:scale-105">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-black tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                Proctor<span className="text-emerald-400">AI</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                v1.0 Pro
              </span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-0.5 hidden sm:block">
              Smart Real-time Vision Proctoring
            </p>
          </div>
        </div>

        {/* Center Live AI Engine Status Pill */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300 shadow-inner">
          <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="font-medium text-slate-400">Vision Engine:</span>
          <span className="flex items-center space-x-1.5 font-semibold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Active & Calibrated</span>
          </span>
        </div>

        {/* Right Navigation & Profile Area */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {user ? (
            <>
              {isExaminer && (
                <nav className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={() => onTabChange('examiner_dashboard')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      currentTab === 'examiner_dashboard'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Dashboard</span>
                  </button>

                  <button
                    onClick={() => onTabChange('create_exam')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      currentTab === 'create_exam'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">New Exam</span>
                  </button>
                </nav>
              )}

              {/* User Profile Pill */}
              <div className="flex items-center space-x-2.5 pl-2 sm:pl-3 border-l border-slate-800">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold shadow">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-white leading-tight">{user.name}</div>
                  <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">{user.role}</div>
                </div>
                
                {/* Logout Button */}
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onTabChange('login')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentTab === 'login'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => onTabChange('register')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all"
              >
                Create Account
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
