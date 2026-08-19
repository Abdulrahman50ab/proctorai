import React, { useState, useEffect } from 'react';
import { PlusCircle, Play, Eye, FileText, Trash2, Copy, Check, Users, Clock, ShieldAlert, Sparkles, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ExaminerDashboard = ({
  onCreateExamClick,
  onStartCandidateExam,
  onViewLiveMonitor,
  onViewReport
}) => {
  const { token } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState(null);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const data = await api.getExams(token);
      setExams(data);
    } catch (err) {
      setError(err.message || 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [token]);

  const handleDelete = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;
    try {
      await api.deleteExam(examId, token);
      setExams(exams.filter(e => e.id !== examId));
    } catch (err) {
      alert(err.message || 'Failed to delete exam');
    }
  };

  const copySessionLink = (examId) => {
    const link = `${window.location.origin}/?exam=${examId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(examId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner / Hero Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center space-x-3">
            <span>Examiner Control Center</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage online assessments, configure AI proctoring thresholds, and review candidate integrity.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onCreateExamClick}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition-all transform active:scale-95"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Create New Exam</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Exams</span>
            <div className="text-2xl font-bold text-white font-mono mt-0.5">{exams.length}</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Proctoring AI</span>
            <div className="text-2xl font-bold text-white font-mono mt-0.5">MediaPipe + CV</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Risk Sensitivity</span>
            <div className="text-2xl font-bold text-amber-300 font-mono mt-0.5">Adaptive</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Decision Logic</span>
            <div className="text-2xl font-bold text-indigo-300 font-mono mt-0.5">Human Review</div>
          </div>
        </div>
      </div>

      {/* Exams List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-200">Your Configured Exams</h2>
          <button
            onClick={fetchExams}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
          >
            Refresh List
          </button>
        </div>

        {loading ? (
          <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-400">Loading exams...</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500">
              <FileText className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-200">No exams created yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Create your first AI-proctored examination with custom questions and proctoring rules.
              </p>
            </div>
            <button
              onClick={onCreateExamClick}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Exam Now</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all hover:shadow-xl space-y-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-white leading-snug line-clamp-1">{exam.title}</h3>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      exam.proctoring_level === 'strict'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : exam.proctoring_level === 'standard'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {exam.proctoring_level}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {exam.description || 'No description provided.'}
                  </p>

                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{exam.duration_minutes} Mins</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>{exam.questions?.length || 0} Questions</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  {/* Candidate Launch & Copy Link */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onStartCandidateExam(exam.id)}
                      className="flex-1 py-2 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Launch as Candidate</span>
                    </button>

                    <button
                      onClick={() => copySessionLink(exam.id)}
                      title="Copy Candidate Link"
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
                    >
                      {copiedId === exam.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(exam.id)}
                      title="Delete Exam"
                      className="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl border border-slate-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-500 text-center font-mono">
                    Code: <span className="text-slate-300 font-semibold">{exam.access_code || exam.id.slice(0, 8)}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
