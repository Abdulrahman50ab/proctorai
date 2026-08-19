import React from 'react';
import { Shield, User as UserIcon, LogOut, PlusCircle, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ currentTab, setCurrentTab }) => {
  const { user, logout } = useAuth();

  return (
    <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-200">
                ProctorAI
              </span>
              <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                AI Vision
              </span>
            </div>
          </div>

          {/* Navigation Links for Authenticated Users */}
          {user && (
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentTab === 'dashboard'
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Examiner Dashboard</span>
              </button>

              <button
                onClick={() => setCurrentTab('create-exam')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentTab === 'create-exam'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'bg-emerald-600/90 text-white hover:bg-emerald-500'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Exam</span>
              </button>
            </div>
          )}

          {/* User Profile & Logout */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3 pl-4 border-l border-slate-800">
                <div className="flex flex-col text-right">
                  <span className="text-sm font-medium text-slate-200">{user.name}</span>
                  <span className="text-xs text-emerald-400 capitalize">{user.role}</span>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-400 font-mono">
                Secure Proctoring v1.0
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};
