import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Clock, Shield, ChevronLeft, 
  ChevronRight, Send, AlertOctagon, Flag, Check, Maximize2
} from 'lucide-react';
import { WebcamMonitor } from '../components/WebcamMonitor';
import { RiskGauge } from '../components/RiskGauge';
import { AlertFeed } from '../components/AlertFeed';
import { api } from '../services/api';

const INTEGRITY_WEIGHTS = {
  FULLSCREEN_EXITED: 15,
  TAB_SWITCHED: 10,
  WINDOW_BLURRED: 10,
  COPY_ATTEMPTED: 5,
};

const EVENT_MESSAGES = {
  FULLSCREEN_EXITED: 'Fullscreen exited. Re-enter fullscreen to continue.',
  TAB_SWITCHED: 'Tab switch / window minimize detected',
  WINDOW_BLURRED: 'Exam window lost focus (Alt-Tab / minimize)',
  COPY_ATTEMPTED: 'Copy / paste / cut is disabled during the exam',
};

const isFullscreen = () =>
  Boolean(document.fullscreenElement || document.webkitFullscreenElement);

const requestExamFullscreen = async () => {
  const el = document.documentElement;
  try {
    if (isFullscreen()) return true;
    if (el.requestFullscreen) await el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    return true;
  } catch {
    return false;
  }
};

export const CandidateExamRoom = ({ session, onExamCompleted }) => {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState((session.exam?.duration_minutes || 20) * 60);
  const [events, setEvents] = useState([]);
  const [latestStatus, setLatestStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [warningText, setWarningText] = useState('');
  const [fullscreenLocked, setFullscreenLocked] = useState(isFullscreen());
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const submittingRef = useRef(false);
  const lastLoggedRef = useRef({});
  const hadFullscreenRef = useRef(isFullscreen());

  const questions = session.exam?.questions || [];
  const currentQuestion = questions[currentQIndex];

  const bumpRisk = useCallback((impact) => {
    setLatestStatus((prev) => {
      const nextScore = Math.min(100, (prev?.risk_score || 0) + impact);
      const risk_level = nextScore <= 20 ? 'LOW' : nextScore <= 50 ? 'MEDIUM' : 'HIGH';
      return { ...(prev || {}), risk_score: nextScore, risk_level };
    });
  }, []);

  const logIntegrityEvent = useCallback(async (eventType, cooldownMs = 4000) => {
    if (submittingRef.current) return;
    const now = Date.now();
    if (now - (lastLoggedRef.current[eventType] || 0) < cooldownMs) return;
    lastLoggedRef.current[eventType] = now;

    const impact = INTEGRITY_WEIGHTS[eventType] || 10;
    const message = EVENT_MESSAGES[eventType] || eventType;
    setEvents((prev) => [{
      event_type: eventType,
      timestamp: new Date().toISOString(),
      risk_score_impact: impact,
      message,
    }, ...prev]);
    bumpRisk(impact);
    setWarningText(message);
    setShowExitWarning(true);
    setTimeout(() => setShowExitWarning(false), 5000);
    await api.logEvent(session.id, eventType, 1.0, { message });
  }, [session.id, bumpRisk]);

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setShowSubmitConfirm(false);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen().catch(() => {});
      }
      await api.submitSession(session.id, answers);
      onExamCompleted(session.id);
    } catch (err) {
      alert(err.message || 'Submission error');
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [session.id, answers, onExamCompleted]);

  useEffect(() => {
    const score = latestStatus?.risk_score || 0;
    if (score >= 100 && !submittingRef.current) {
      handleSubmit();
    }
  }, [latestStatus?.risk_score, latestStatus?.auto_submit, handleSubmit]);

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

  // Mandatory fullscreen on exam start
  useEffect(() => {
    requestExamFullscreen().then(() => {
      const on = isFullscreen();
      setFullscreenLocked(on);
      if (on) hadFullscreenRef.current = true;
    });
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      const on = isFullscreen();
      setFullscreenLocked(on);
      if (on) {
        hadFullscreenRef.current = true;
        return;
      }
      if (hadFullscreenRef.current && !submittingRef.current) {
        logIntegrityEvent('FULLSCREEN_EXITED', 3000);
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        logIntegrityEvent('TAB_SWITCHED', 4000);
      }
    };

    let blurTimer = null;
    const onBlur = () => {
      if (submittingRef.current) return;
      blurTimer = setTimeout(() => {
        if (!document.hasFocus() && !document.hidden && !submittingRef.current) {
          logIntegrityEvent('WINDOW_BLURRED', 4000);
        }
      }, 350);
    };

    const blockCopy = (e) => {
      e.preventDefault();
      logIntegrityEvent('COPY_ATTEMPTED', 8000);
    };
    const blockMenu = (e) => e.preventDefault();

    const blockKeys = (e) => {
      const key = (e.key || '').toLowerCase();
      const blockedCombo =
        (e.ctrlKey || e.metaKey) && ['c', 'x', 'v', 'a', 's', 'p', 'u'].includes(key);
      if (blockedCombo || key === 'printscreen') {
        e.preventDefault();
        logIntegrityEvent('COPY_ATTEMPTED', 8000);
      }
      if (key === 'f11') {
        e.preventDefault();
      }
      if (key === 'escape' && isFullscreen()) {
        // Browser still exits fullscreen; fullscreenchange handler logs it.
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    document.addEventListener('copy', blockCopy);
    document.addEventListener('cut', blockCopy);
    document.addEventListener('paste', blockCopy);
    document.addEventListener('contextmenu', blockMenu);
    document.addEventListener('keydown', blockKeys, true);

    return () => {
      clearTimeout(blurTimer);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('copy', blockCopy);
      document.removeEventListener('cut', blockCopy);
      document.removeEventListener('paste', blockCopy);
      document.removeEventListener('contextmenu', blockMenu);
      document.removeEventListener('keydown', blockKeys, true);
    };
  }, [logIntegrityEvent]);

  const selectOption = (option) => {
    if (!currentQuestion) return;
    setAnswers({
      ...answers,
      [currentQuestion.id]: option
    });
  };

  const toggleFlag = (qId) => {
    setFlaggedQuestions(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const handleNewAlert = (alert) => {
    setEvents(prev => [alert, ...prev]);
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none">
      
      {/* Top Exam Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-8 py-3 sticky top-0 z-40 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight flex items-center space-x-2">
              <span>{session.exam?.title || 'ProctorAI Assessment'}</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                PROCTORING ACTIVE
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Candidate: <strong className="text-slate-200">{session.candidate_name}</strong> &bull; Token: <span className="font-mono text-slate-400">{session.session_token?.slice(0, 8)}...</span>
            </p>
          </div>
        </div>

        {/* Center Countdown Timer */}
        <div className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl border font-mono ${
          timeLeftSeconds < 180
            ? 'bg-rose-500/15 border-rose-500/50 text-rose-400 animate-pulse shadow-lg shadow-rose-900/40'
            : 'bg-slate-800/90 border-slate-700 text-emerald-400 shadow-inner'
        }`}>
          <Clock className="w-4 h-4" />
          <span className="text-base font-extrabold tracking-wider">{formatTimer(timeLeftSeconds)}</span>
        </div>

        {/* Submit Button */}
        <button
          onClick={() => setShowSubmitConfirm(true)}
          disabled={submitting}
          className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{submitting ? 'Submitting...' : 'Finish & Submit Exam'}</span>
        </button>
      </header>

      {/* Fullscreen Violation Toast Warning */}
      {submitting && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-center text-xs font-bold">
          {(latestStatus?.risk_score || 0) >= 100
            ? 'Risk reached 100%. Exam is being auto-submitted...'
            : 'Submitting exam...'}
        </div>
      )}
      {showExitWarning && !submitting && (
        <div className="bg-rose-600 text-white px-4 py-2.5 text-center text-xs font-bold flex items-center justify-center space-x-2 shadow-2xl">
          <AlertOctagon className="w-4 h-4 flex-shrink-0" />
          <span>{warningText || 'Integrity violation logged against your risk score.'}</span>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Proctoring Video Stream & Live Risk Gauge */}
        <div className="lg:col-span-4 space-y-5">
          <WebcamMonitor
            sessionId={session.id}
            isActive={!submitting}
            onStatusUpdate={(res) => {
              setLatestStatus((prev) => {
                const serverScore = res?.risk_score || 0;
                const localScore = prev?.risk_score || 0;
                const risk_score = Math.max(serverScore, localScore);
                const risk_level = risk_score <= 20 ? 'LOW' : risk_score <= 50 ? 'MEDIUM' : 'HIGH';
                return { ...prev, ...res, risk_score, risk_level };
              });
            }}
            onNewAlert={handleNewAlert}
          />

          <RiskGauge
            score={latestStatus?.risk_score || 0}
            level={latestStatus?.risk_level || 'LOW'}
          />

          <AlertFeed events={events} />
        </div>

        {/* Right Column: Question Panel & Navigator */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Question Navigation Palette */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">
                Progress: <strong className="text-emerald-400 font-mono">{answeredCount}</strong> / {questions.length} Answered
              </span>
              <div className="flex items-center space-x-3 text-[11px]">
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Answered</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>Flagged</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
                  <span>Unvisited</span>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800/80">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isFlagged = flaggedQuestions[q.id];
                const isCurrent = currentQIndex === idx;

                let btnStyle = "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700";
                if (isCurrent) {
                  btnStyle = "bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold ring-2 ring-cyan-500/30";
                } else if (isFlagged) {
                  btnStyle = "bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold";
                } else if (isAnswered) {
                  btnStyle = "bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold";
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQIndex(idx)}
                    className={`w-9 h-9 rounded-xl border text-xs font-mono transition-all flex items-center justify-center ${btnStyle}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Question Card */}
          {currentQuestion ? (
            <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
              
              {/* Question Meta Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                    Question {currentQIndex + 1} of {questions.length}
                  </span>
                  <span className="text-xs text-slate-500">({currentQuestion.points || 1} pt)</span>
                </div>

                <button
                  onClick={() => toggleFlag(currentQuestion.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    flaggedQuestions[currentQuestion.id]
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{flaggedQuestions[currentQuestion.id] ? 'Flagged for Review' : 'Flag for Review'}</span>
                </button>
              </div>

              {/* Question Text */}
              <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
                {currentQuestion.question_text}
              </h2>

              {/* Options List */}
              <div className="space-y-3">
                {currentQuestion.options?.map((option, oIdx) => {
                  const isSelected = answers[currentQuestion.id] === option;
                  const letter = String.fromCharCode(65 + oIdx); // A, B, C, D

                  return (
                    <div
                      key={oIdx}
                      onClick={() => selectOption(option)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                        isSelected
                          ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border-emerald-500/80 text-white shadow-lg shadow-emerald-500/10'
                          : 'bg-slate-900/80 border-slate-800/90 hover:border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3.5">
                        <span className={`w-7 h-7 rounded-lg font-mono text-xs font-bold flex items-center justify-center border transition-colors ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                            : 'bg-slate-800 text-slate-400 border-slate-700 group-hover:border-slate-600'
                        }`}>
                          {letter}
                        </span>
                        <span className="text-sm font-medium">{option}</span>
                      </div>

                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                          : 'border-slate-700 group-hover:border-slate-600'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-800/80">
                <button
                  onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQIndex === 0}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="text-xs text-slate-500 font-mono">
                  {currentQIndex + 1} / {questions.length}
                </div>

                {currentQIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSubmitConfirm(true)}
                    className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30"
                  >
                    <span>Finish & Submit</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

            </div>
          ) : (
            <div className="glass-card rounded-2xl p-12 text-center text-slate-500">
              No questions found for this exam.
            </div>
          )}

        </div>

      </div>

      {!fullscreenLocked && !submitting && (
        <div className="fixed inset-0 z-[90] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-rose-500/40 bg-slate-900 p-8 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-400 flex items-center justify-center">
              <Maximize2 className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-white">Fullscreen required</h2>
            <p className="text-sm text-slate-400">
              This exam must stay in fullscreen. Leaving fullscreen, minimizing, or switching tabs is logged and increases your risk score.
            </p>
            <button
              onClick={async () => {
                const ok = await requestExamFullscreen();
                setFullscreenLocked(ok || isFullscreen());
              }}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold"
            >
              Enter fullscreen to continue
            </button>
          </div>
        </div>
      )}

      {showSubmitConfirm && (
        <div className="fixed inset-0 z-[95] bg-black/70 flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Submit exam?</h3>
            <p className="text-sm text-slate-400">
              You have answered <strong className="text-white">{answeredCount}</strong> of {questions.length} questions. This cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold"
              >
                Keep answering
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                Submit now
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
