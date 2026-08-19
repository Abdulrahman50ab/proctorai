import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertTriangle, ShieldAlert, ArrowLeft, Printer, 
  Download, CheckCircle2, XCircle, Clock, User, Calendar, 
  Eye, Smartphone, Maximize2, Users, FileText, Check, AlertOctagon 
} from 'lucide-react';
import { api } from '../services/api';

export const ReportView = ({ reportId, sessionId, onBack }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verdict, setVerdict] = useState('clean');
  const [examinerNotes, setExaminerNotes] = useState('');
  const [savedVerdict, setSavedVerdict] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        let data;
        if (sessionId) {
          data = await api.getSessionReport(sessionId);
        } else if (reportId) {
          data = await api.getReport(reportId);
        }
        setReport(data);
        if (data?.status) setVerdict(data.status);
      } catch (err) {
        console.error('Report fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId, sessionId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-400 space-y-3">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold">Generating Forensic Integrity Audit Report...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Report Not Found</h2>
        <p className="text-xs text-slate-400">The requested session report could not be loaded.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const session = report.session || {};
  const exam = session.exam || { title: report.exam_title };
  const result = session.result || report.result || {};
  const events = report.events || session.events || [];
  const riskScore = report.final_risk_score ?? report.risk_score ?? session.risk_score ?? 0;
  const riskLevel = report.risk_level || session.risk_level || 'LOW';
  const facePresence = report.face_presence_percentage ?? 0;
  const attentionIndex = report.attention_percentage ?? report.attention_index ?? 0;
  const multiFaceCount = report.violation_counts?.MULTIPLE_FACES_DETECTED || 0;
  const phoneCount = report.violation_counts?.PHONE_DETECTED || 0;

  const evidenceSrc = (path) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('/uploads')) return path;
    return `/uploads/${path}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 print:p-0 print:m-0">
      
      {/* Top Bar / Navigation */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assessments</span>
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Main Report Card */}
      <div className="glass-card rounded-2xl p-6 sm:p-10 border border-slate-800 shadow-2xl space-y-8 print:border-none print:shadow-none">
        
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black text-white">ProctorAI Integrity Audit</span>
              <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                OFFICIAL REPORT
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Automated multi-modal computer vision & behavior telemetry analysis.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`px-4 py-2 rounded-2xl border text-right ${
              riskScore < 25
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : riskScore < 60
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              <div className="text-[10px] uppercase font-bold tracking-wider">Overall Risk Score</div>
              <div className="text-2xl font-black font-mono">{riskScore} / 100</div>
              <div className="text-[10px] font-bold uppercase">{riskLevel} RISK</div>
            </div>
          </div>
        </div>

        {/* Candidate & Assessment Meta Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Candidate Name</span>
            <strong className="text-white text-sm">{session.candidate_name || report.candidate_name || 'N/A'}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Assessment Title</span>
            <strong className="text-white text-sm">{exam.title || report.exam_title || 'Assessment'}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Exam Score / Result</span>
            <strong className="text-emerald-400 text-sm font-mono">
              {result.score !== undefined ? `${result.score}%` : 'Completed'}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Session Token</span>
            <span className="text-slate-300 font-mono text-xs">{session.session_token || session.id}</span>
          </div>
        </div>

        {/* Breakdown Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Face Presence</span>
            </div>
            <div className="text-xl font-bold text-white font-mono">
              {facePresence}%
            </div>
            <p className="text-[11px] text-slate-500">Continuous in-frame tracking</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Attention Index</span>
            </div>
            <div className="text-xl font-bold text-white font-mono">
              {attentionIndex}%
            </div>
            <p className="text-[11px] text-slate-500">Screen focus & gaze stability</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Multi-Person</span>
            </div>
            <div className="text-xl font-bold text-white font-mono">
              {multiFaceCount}
            </div>
            <p className="text-[11px] text-slate-500">Secondary face anomalies</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>Devices Flagged</span>
            </div>
            <div className="text-xl font-bold text-white font-mono">
              {phoneCount}
            </div>
            <p className="text-[11px] text-slate-500">Phones or secondary screens</p>
          </div>
        </div>

        {/* Violations Timeline */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Forensic Event Timeline ({events.length} logged events)</span>
          </h3>

          {events.length === 0 ? (
            <div className="p-8 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center text-emerald-400 space-y-1">
              <CheckCircle2 className="w-6 h-6 mx-auto" />
              <p className="text-xs font-bold">Flawless Session Record</p>
              <p className="text-[11px] text-slate-400">No violations or anomalies recorded during this examination.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((ev, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 mt-0.5">
                      <AlertOctagon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <strong className="text-xs text-white font-bold">{ev.event_type}</strong>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(ev.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Confidence: {(ev.confidence * 100).toFixed(0)}% &bull; Impact: +{ev.risk_score_impact} pts
                      </p>
                    </div>
                  </div>

                  {ev.evidence_path && (
                    <div className="flex items-center space-x-2">
                      <img
                        src={evidenceSrc(ev.evidence_path)}
                        alt="Evidence"
                        className="w-16 h-12 object-cover rounded-lg border border-slate-700 bg-black cursor-pointer hover:scale-105 transition-transform"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Examiner Human Review Verdict Form */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 print:hidden">
          <h3 className="text-sm font-bold text-white">Examiner Review & Final Verdict</h3>
          <p className="text-xs text-slate-400">
            AI signals are assistive. As the official reviewer, record your final assessment verdict below.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setVerdict('clean')}
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                verdict === 'clean'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/20'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Approve / Clean</span>
            </button>

            <button
              onClick={() => setVerdict('flagged')}
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                verdict === 'flagged'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/20'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Request Retest / Review</span>
            </button>

            <button
              onClick={() => setVerdict('disqualified')}
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                verdict === 'disqualified'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500/20'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>Disqualify Candidate</span>
            </button>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                setSavedVerdict(true);
                setTimeout(() => setSavedVerdict(false), 3000);
              }}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center space-x-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{savedVerdict ? 'Verdict Saved!' : 'Save Final Verdict'}</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
