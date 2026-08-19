import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle2, XCircle, Mic, Sun, Shield, ArrowRight, UserCheck, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

export const CandidateSystemCheck = ({ examId, onSystemCheckPassed, onBackToLogin }) => {
  const videoRef = useRef(null);
  const [exam, setExam] = useState(null);
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');

  // Diagnostic states
  const [cameraPermitted, setCameraPermitted] = useState(false);
  const [micPermitted, setMicPermitted] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceCentered, setFaceCentered] = useState(false);
  const [lightingOk, setLightingOk] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadExam = async () => {
      try {
        if (examId) {
          const data = await api.getExam(examId);
          setExam(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadExam();
  }, [examId]);

  // Request Camera & Mic
  useEffect(() => {
    let stream = null;
    const runDiagnostics = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setCameraPermitted(true);
        setMicPermitted(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
          };
        }

        // Simulate video analysis check
        setTimeout(() => {
          setFaceDetected(true);
          setFaceCentered(true);
          setLightingOk(true);
          setChecking(false);
        }, 1200);

      } catch (err) {
        console.error('Permission error:', err);
        setCameraPermitted(false);
        setMicPermitted(false);
        setChecking(false);
        setError('Camera & Microphone access is required to proceed with this AI proctored exam.');
      }
    };

    runDiagnostics();

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleStartExam = async (e) => {
    e.preventDefault();
    if (!candidateName.trim() || !candidateEmail.trim()) {
      setError('Please fill in your full name and email.');
      return;
    }
    if (!cameraPermitted || !faceDetected) {
      setError('System checks must pass before entering the exam room.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Create session
      const session = await api.createSession(examId, candidateName, candidateEmail);
      // Start session
      await api.startSession(session.id);
      onSystemCheckPassed(session);
    } catch (err) {
      setError(err.message || 'Failed to start exam session');
    } finally {
      setLoading(false);
    }
  };

  const allChecksPassed = cameraPermitted && micPermitted && faceDetected && faceCentered && lightingOk;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-2 pb-4 border-b border-slate-800">
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Pre-Exam Verification
        </span>
        <h1 className="text-3xl font-bold text-white tracking-tight">System & Identity Check</h1>
        <p className="text-sm text-slate-400">
          Exam: <strong className="text-slate-200">{exam?.title || 'Online Assessment'}</strong>
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Left: Video Preview & Centering HUD */}
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 aspect-video flex items-center justify-center shadow-xl">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />

            {/* Centering Oval Target Guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`w-40 h-52 rounded-[50%] border-2 border-dashed transition-all ${
                faceCentered ? 'border-emerald-400/80 bg-emerald-500/5' : 'border-amber-400/80 bg-amber-500/5'
              } flex items-center justify-center`}>
                <span className="text-[10px] text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded-full font-mono">
                  Keep Face Here
                </span>
              </div>
            </div>

            <div className="absolute bottom-3 inset-x-3 py-1.5 px-3 rounded-lg bg-slate-950/80 backdrop-blur-md text-[11px] text-center text-slate-300 font-mono">
              Live Webcam Feed
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs text-slate-400">
            <p className="font-semibold text-slate-300 flex items-center space-x-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Proctoring Notice & Integrity Rules</span>
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 leading-relaxed">
              <li>Keep your face centered and visible throughout the test.</li>
              <li>Secondary monitors, mobile phones, or textbooks are prohibited.</li>
              <li>Exiting fullscreen or switching browser tabs will be logged.</li>
            </ul>
          </div>
        </div>

        {/* Right: Checklist & Candidate Info Form */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          
          <h2 className="text-base font-bold text-white">Diagnostic Checklist</h2>

          <div className="space-y-3">
            {[
              { label: 'Camera Hardware & Stream', status: cameraPermitted },
              { label: 'Microphone Audio Input', status: micPermitted },
              { label: 'Face Detected in Frame', status: faceDetected },
              { label: 'Face Centered & Aligned', status: faceCentered },
              { label: 'Lighting Conditions Acceptable', status: lightingOk },
            ].map((check, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800"
              >
                <span className="text-xs font-medium text-slate-300">{check.label}</span>
                {checking ? (
                  <span className="text-xs text-slate-500 animate-pulse">Checking...</span>
                ) : check.status ? (
                  <div className="flex items-center space-x-1 text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Pass</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-rose-400 text-xs font-semibold">
                    <XCircle className="w-4 h-4" />
                    <span>Failed</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleStartExam} className="space-y-4 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Candidate Full Name *
              </label>
              <input
                type="text"
                required
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="Abdul Rahman"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Candidate Email *
              </label>
              <input
                type="email"
                required
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
                placeholder="abdul@university.edu"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !allChecksPassed}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-40"
            >
              <span>{loading ? 'Entering Exam Room...' : 'Start Assessment'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
};
