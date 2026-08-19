import React, { useState, useEffect } from 'react';
import { 
  Plus, Users, FileText, CheckCircle2, AlertTriangle, ShieldCheck, 
  ExternalLink, Copy, Check, Eye, Trash2, ArrowUpRight, Search, 
  Play, RefreshCw, BarChart3, Filter
} from 'lucide-react';
import { api } from '../services/api';

export const ExaminerDashboard = ({ onNavigate, onLaunchCandidate }) => {
  const [exams, setExams] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [examsData, reportsData] = await Promise.all([
        api.getExams(),
        api.getReports().catch(() => [])
      ]);
      setExams(examsData || []);
      setReports(reportsData || []);
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          exam.access_code?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = filterLevel === 'all' || exam.proctoring_level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  const totalCandidates = reports.length;
  const verifiedClean = reports.filter(r => r.risk_score < 25).length;
  const flaggedForReview = reports.filter(r => r.risk_score >= 25).length;
  const avgIntegrity = totalCandidates > 0 
    ? Math.round(reports.reduce((acc, r) => acc + (100 - (r.risk_score || 0)), 0) / totalCandidates) 
    : 98;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Examiner Command Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time assessment oversight, AI vision proctoring metrics, and integrity audit trails.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            title="Refresh Dashboard"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={() => onNavigate('create_exam')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition-all transform hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Assessment</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/90 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Assessments</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-white font-mono">{exams.length}</span>
            <span className="text-xs text-emerald-400 font-semibold">Live</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Configured with AI vision proctoring</p>
        </div>

        {/* Metric 2 */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/90 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sessions Monitored</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-white font-mono">{totalCandidates}</span>
            <span className="text-xs text-slate-400">candidates</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total completed & active sessions</p>
        </div>

        {/* Metric 3 */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/90 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg. Integrity Score</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-emerald-400 font-mono">{avgIntegrity}%</span>
            <span className="text-xs text-emerald-400 font-semibold">High Trust</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Clean attention & face compliance</p>
        </div>

        {/* Metric 4 */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/90 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Flagged for Audit</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-rose-400 font-mono">{flaggedForReview}</span>
            <span className="text-xs text-slate-400">requiring review</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Risk score exceeding 25 pts</p>
        </div>

      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-panel p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search assessments by title or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">Proctoring Level:</span>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50"
          >
            <option value="all">All Levels</option>
            <option value="strict">Strict (AI + YOLO + Gaze)</option>
            <option value="standard">Standard (Face + Gaze)</option>
            <option value="lenient">Lenient (Face Only)</option>
          </select>
        </div>
      </div>

      {/* Assessments Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Configured Assessments ({filteredExams.length})</span>
          </h2>
        </div>

        {filteredExams.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">No Assessments Found</h3>
              <p className="text-xs text-slate-400 mt-1">Create your first proctored exam to get started.</p>
            </div>
            <button
              onClick={() => onNavigate('create_exam')}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Create Assessment</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredExams.map((exam) => (
              <div
                key={exam.id}
                className="glass-card rounded-2xl p-5 border border-slate-800/90 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full border ${
                      exam.proctoring_level === 'strict'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {exam.proctoring_level} Proctoring
                    </span>

                    <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
                      <span>{exam.duration_minutes} mins</span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white mt-3 group-hover:text-emerald-300 transition-colors leading-snug">
                    {exam.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {exam.description || 'Standard AI proctored assessment.'}
                  </p>
                </div>

                {/* Card Access Code & Candidate Launch Actions */}
                <div className="space-y-3 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800/80">
                    <span className="text-[11px] text-slate-400">Access Code:</span>
                    <div className="flex items-center space-x-1.5 font-mono font-bold text-xs text-emerald-400">
                      <span>{exam.access_code}</span>
                      <button
                        onClick={() => handleCopyCode(exam.access_code)}
                        title="Copy Access Code"
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        {copiedCode === exam.access_code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onLaunchCandidate(exam)}
                      className="flex items-center justify-center space-x-1.5 py-2 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 rounded-xl text-xs font-bold transition-all shadow"
                    >
                      <Play className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Launch Room</span>
                    </button>

                    <button
                      onClick={() => onNavigate('reports', { examId: exam.id })}
                      className="flex items-center justify-center space-x-1.5 py-2 px-3 bg-slate-800/70 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Audit Reports</span>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Proctored Reports Section */}
      {reports.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>Recent Proctored Candidate Audits</span>
            </h2>
          </div>

          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 uppercase font-bold border-b border-slate-800 text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">Exam</th>
                    <th className="py-3 px-4">Integrity Risk</th>
                    <th className="py-3 px-4">Violations</th>
                    <th className="py-3 px-4">Verdict</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {reports.slice(0, 5).map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-white">
                        {rep.session?.candidate_name || 'Candidate'}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {rep.session?.exam?.title || 'Assessment'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-mono font-bold px-2 py-0.5 rounded-full border text-[11px] ${
                          rep.risk_score < 25 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : rep.risk_score < 60
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}>
                          {rep.risk_score} pts ({rep.risk_level})
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {rep.violation_counts?.total || 0} events
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${
                          rep.status === 'clean'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-amber-500/15 text-amber-400'
                        }`}>
                          {rep.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onNavigate('report_view', { reportId: rep.id })}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold rounded-lg transition-colors inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Audit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
