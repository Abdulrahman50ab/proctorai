import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle2, XCircle, ArrowLeft, Clock, Eye, Users, Phone, Maximize2, Award, Printer, Shield } from 'lucide-react';
import { api } from '../services/api';
import { RiskGauge } from '../components/RiskGauge';

export const ReportView = ({ sessionId, onBackToDashboard }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const data = await api.getReport(sessionId);
        setReport(data);
      } catch (err) {
        setError(err.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };
    if (sessionId) fetchReport();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-3">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-400">Compiling AI proctoring analytics and evidence...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <p className="text-rose-400 text-sm">{error || 'Report not found'}</p>
        <button
          onClick={onBackToDashboard}
          className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-medium"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const result = report.result;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Proctoring & Assessment Audit Report
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Candidate: <strong className="text-slate-200">{report.candidate_name}</strong> ({report.candidate_email})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        
        {/* Exam Score */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Exam Score</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-3xl font-extrabold text-white font-mono">
              {result ? `${result.score}%` : 'N/A'}
            </span>
          </div>
          <div className="pt-1">
            {result ? (
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                result.passed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {result.passed ? '✓ PASSED' : '✕ FAILED'} ({result.correct_answers}/{result.total_questions} correct)
              </span>
            ) : (
              <span className="text-xs text-slate-500">In Progress</span>
            )}
          </div>
        </div>

        {/* Face Presence */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Face Presence</span>
            <Eye className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {report.face_presence_percentage}%
          </div>
          <p className="text-xs text-slate-400">
            Total Missing Events: {report.summary_metrics?.missing_face_count || 0}
          </p>
        </div>

        {/* Attention Index */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attention Index</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {report.attention_percentage}%
          </div>
          <p className="text-xs text-slate-400">
            Gaze Deviations: {report.summary_metrics?.gaze_deviation_count || 0}
          </p>
        </div>

        {/* Risk Score */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Risk Level</span>
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {report.final_risk_score} <span className="text-sm font-normal text-slate-400">/100</span>
          </div>
          <div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              report.risk_level === 'LOW'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : report.risk_level === 'MEDIUM'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              {report.risk_level} RISK
            </span>
          </div>
        </div>

      </div>

      {/* Human Review Note */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-slate-200">Reviewer Recommendation:</span>
          <p className="leading-relaxed">
            {report.risk_level === 'LOW'
              ? 'Candidate maintained excellent integrity throughout the test. No suspicious anomalies detected.'
              : report.risk_level === 'MEDIUM'
              ? 'Occasional attention or posture deviations recorded. Review the timestamped evidence below before final sign-off.'
              : 'Significant suspicious signals or prohibited device events logged. Detailed manual review of snapshot evidence is required.'}
          </p>
        </div>
      </div>

      {/* Suspicious Event Timeline & Evidence Snapshots */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <span>Suspicious Event Timeline & Evidence</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-400">
              {report.events?.length || 0} events
            </span>
          </h2>
          <span className="text-xs text-slate-500">Chronological Order</span>
        </div>

        {(!report.events || report.events.length === 0) ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
            <p className="text-sm text-slate-300">Clean Session Record</p>
            <p className="text-xs text-slate-500">No cheating flags or suspicious cues detected during this assessment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {report.events.map((ev, idx) => (
              <div
                key={ev.id || idx}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      +{ev.risk_score_impact} pts
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      {ev.event_type.replace(/_/g, ' ')}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(ev.timestamp).toLocaleTimeString()}</span>
                    </span>
                    <span>•</span>
                    <span>Confidence: {Math.round((ev.confidence || 1.0) * 100)}%</span>
                  </div>
                </div>

                {ev.evidence_path && (
                  <div className="flex items-center space-x-3">
                    <a
                      href={ev.evidence_path}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-emerald-400 font-medium border border-slate-700 flex items-center space-x-1"
                    >
                      <span>View Snapshot Evidence</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
