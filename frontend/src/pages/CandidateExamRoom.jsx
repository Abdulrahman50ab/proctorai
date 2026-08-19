import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Shield, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Send, AlertOctagon } from 'lucide-react';
import { WebcamMonitor } from '../components/WebcamMonitor';
import { RiskGauge } from '../components/RiskGauge';
import { AlertFeed } from '../components/AlertFeed';
import { api } from '../services/api';

export const CandidateExamRoom = ({ session, onExamCompleted }) => {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState((session.exam?.duration_minutes || 20) * 60);
  const [events, setEvents] = useState([]);
  const [latestStatus, setLatestStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);

  const questions = session.exam?.questions || [];
  const currentQuestion = questions[currentQIndex];

  // Auto-Submit Handler
  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await api.submitSession(session.id, answers);
      onExamCompleted(session.id);
    } catch (err) {
      alert(err.message || 'Submission error');
      setSubmitting(false);
    }
  }, [session.id, answers, submitting, onExamCompleted]);

  // Timer Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleSubmit]);

  // Browser Focus / Fullscreen Integrity Event Tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        api.logEvent(session.id, 'FULLSCREEN_EXITED');
        setShowExitWarning(true);
        setEvents(prev => [{
          event_type: 'FULLSCREEN_EXITED',
          timestamp: new Date().toISOString(),
          risk_score_impact: 10
        }, ...prev]);
        setTimeout(() => setShowExitWarning(false), 4000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [session.id]);

  const selectOption = (option) => {
    if (!currentQuestion) return;
    setAnswers({
      ...answers,
      [currentQuestion.id]: option
    });
  };

  const handleNewAlert = (alert) => {
    setEvents(prev => [alert, ...prev]);
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      
      {/* Top Exam Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 py-3 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">
              {session.exam?.title || 'Assessment'}
            </h1>
            <p className="text-xs text-slate-400">
              Candidate: <span className="text-slate-200">{session.candidate_name}</span>
            </p>
          </div>
        </div>

        {/* Center Countdown Timer */}
        <div className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl border font-mono ${
          timeLeftSeconds < 180
            ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 animate-pulse'
            : 'bg-slate-800 border-slate-700 text-emerald-400'
        }`}>
          <Clock className="w-4 h-4" />
          <span className="text-base font-extrabold tracking-wider">{formatTimer(timeLeftSeconds)}</span>
        </div>

        {/* Submit Button */}
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to finish and submit your exam?')) {
              handleSubmit();
            }
          }}
          disabled={submitting}
          className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{submitting ? 'Submitting...' : 'Finish & Submit'}</span>
        </button>
      </header>

      {/* Fullscreen Warning Toast */}
      {showExitWarning && (
        <div className="bg-rose-600 text-white px-4 py-2.5 text-center text-xs font-bold flex items-center justify-center space-x-2 shadow-lg animate-bounce">
          <AlertOctagon className="w-4 h-4" />
          <span>Warning: Tab switch / Window focus lost detected! This event has been logged to the proctor report.</span>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Proctoring Video Stream & Live Risk Gauge */}
        <div className="lg:col-span-4 space-y-5">
          <WebcamMonitor
            sessionId={session.id}
            isActive={!submitting}
            onStatusUpdate={setLatestStatus}
            onNewAlert={handleNewAlert}
          />

          <RiskGauge
            score={latestStatus?.risk_score || 0}
            level={latestStatus?.risk_level || 'LOW'}
          />

          <AlertFeed events={events} />
        </div>

        {/* Right Column: Question Panel */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          
          {/* Question Stepper Header */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Progress</span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {Object.keys(answers).length} / {questions.length} Answered
              </span>
            </div>

            {/* Quick jump circles */}
            <div className="flex items-center space-x-1.5 overflow-x-auto">
              {questions.map((q, idx) => (
                <button
                  key={q.id || idx}
                  onClick={() => setCurrentQIndex(idx)}
                  className={`w-7 h-7 rounded-lg text-xs font-mono font-semibold transition-all ${
                    currentQIndex === idx
                      ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400'
                      : answers[q.id]
                      ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-900 text-slate-500 border border-slate-800'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Current Question Card */}
          {currentQuestion ? (
            <div className="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col justify-between min-h-[420px] space-y-6">
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Question {currentQIndex + 1} of {questions.length}
                  </span>
                  <span className="text-xs text-slate-400">
                    Points: <strong className="text-white">{currentQuestion.points || 1}</strong>
                  </span>
                </div>

                <h2 className="text-xl font-bold text-white leading-relaxed">
                  {currentQuestion.question_text}
                </h2>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options && currentQuestion.options.map((opt, optIdx) => {
                  const isSelected = answers[currentQuestion.id] === opt;
                  return (
                    <div
                      key={optIdx}
                      onClick={() => selectOption(opt)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center space-x-3.5 ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected ? 'border-emerald-400 bg-emerald-500 text-slate-950' : 'border-slate-600'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-slate-950" />}
                      </div>
                      <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {opt}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Nav: Previous & Next */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                <button
                  onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQIndex === 0}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {currentQIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    className="flex items-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    <span>Next Question</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (window.confirm('Submit assessment now?')) handleSubmit();
                    }}
                    className="flex items-center space-x-1.5 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all"
                  >
                    <span>Finish Exam</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

            </div>
          ) : (
            <div className="p-8 text-center text-slate-400">No questions found in this assessment.</div>
          )}

        </div>

      </div>

    </div>
  );
};
