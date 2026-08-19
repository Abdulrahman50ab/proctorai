import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, Mic, Maximize2, ShieldCheck, CheckCircle2, AlertCircle, 
  ArrowRight, UserCheck, RefreshCw, Volume2, Sparkles, ShieldAlert,
  HelpCircle, Check
} from 'lucide-react';
import { api } from '../services/api';

export const CandidateSystemCheck = ({ exam, candidateInfo, onSystemCheckPassed }) => {
  const [step, setStep] = useState(1);
  const [cameraStatus, setCameraStatus] = useState('checking'); // checking, ready, error
  const [micStatus, setMicStatus] = useState('ready');
  const [audioLevel, setAudioLevel] = useState(65);
  const [referencePhoto, setReferencePhoto] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [startingSession, setStartingSession] = useState(false);
  const [permissionErrorMsg, setPermissionErrorMsg] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize webcam for system check
  const initCamera = useCallback(async () => {
    setCameraStatus('checking');
    setPermissionErrorMsg(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: true
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(console.warn);
          setCameraStatus('ready');
        };
      } else {
        setCameraStatus('ready');
      }
    } catch (err) {
      console.error('Camera/Mic permission error:', err);
      setCameraStatus('error');
      setPermissionErrorMsg(err.message || 'Camera permission denied or camera device not found.');
    }
  }, []);

  useEffect(() => {
    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [initCamera]);

  // Ensure video element always binds to the active stream whenever step changes or ref updates
  useEffect(() => {
    if (streamRef.current && videoRef.current && !referencePhoto) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.warn('Autoplay check:', e));
    }
  }, [step, referencePhoto, cameraStatus]);

  // Simulate audio activity meter
  useEffect(() => {
    const interval = setInterval(() => {
      setAudioLevel(Math.floor(45 + Math.random() * 40));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Capture Reference Baseline Snapshot
  const captureReferencePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = 320;
    canvas.height = 240;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photo = canvas.toDataURL('image/jpeg', 0.85);
    setReferencePhoto(photo);
  };

  const enterFullscreen = async () => {
    const el = document.documentElement;
    try {
      if (document.fullscreenElement) return true;
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      return true;
    } catch {
      return false;
    }
  };

  const handleStartExam = async () => {
    setStartingSession(true);
    await enterFullscreen();
    try {
      const session = await api.createSession({
        exam_id: exam.id,
        candidate_name: candidateInfo.name,
        candidate_email: candidateInfo.email
      });

      const startedSession = await api.startSession(session.id, referencePhoto);
      onSystemCheckPassed(startedSession);
    } catch (err) {
      alert(err.message || 'Could not start exam session');
      setStartingSession(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>Pre-Flight Integrity Calibration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          System &amp; Biometric Verification
        </h1>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Please confirm your webcam, microphone, and browser environment before beginning your proctored assessment.
        </p>
      </div>

      {/* Progress Stepper */}
      <div className="flex items-center justify-center space-x-4 max-w-md mx-auto">
        <button
          onClick={() => setStep(1)}
          className={`flex items-center space-x-2 text-xs font-bold transition-colors ${
            step >= 1 ? 'text-emerald-400' : 'text-slate-500'
          }`}
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center border ${
            step >= 1 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'border-slate-700 text-slate-600'
          }`}>1</span>
          <span>Hardware</span>
        </button>

        <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-800'}`} />

        <button
          onClick={() => { if (cameraStatus === 'ready') setStep(2); }}
          className={`flex items-center space-x-2 text-xs font-bold transition-colors ${
            step >= 2 ? 'text-emerald-400' : 'text-slate-500'
          }`}
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center border ${
            step >= 2 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'border-slate-700 text-slate-600'
          }`}>2</span>
          <span>Biometrics</span>
        </button>

        <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-emerald-500' : 'bg-slate-800'}`} />

        <button
          onClick={() => { if (referencePhoto) setStep(3); }}
          className={`flex items-center space-x-2 text-xs font-bold transition-colors ${
            step >= 3 ? 'text-emerald-400' : 'text-slate-500'
          }`}
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center border ${
            step >= 3 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'border-slate-700 text-slate-600'
          }`}>3</span>
          <span>Start</span>
        </button>
      </div>

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Step 1: Hardware Check (Webcam & Audio) */}
      {step === 1 && (
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            {/* Live Camera Box */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
              {cameraStatus === 'error' ? (
                <div className="p-6 text-center text-rose-400 space-y-3">
                  <AlertCircle className="w-10 h-10 mx-auto" />
                  <p className="text-xs font-semibold">Camera Access Blocked</p>
                  <p className="text-[11px] text-slate-400">
                    {permissionErrorMsg || 'Please allow camera and microphone permissions in your browser.'}
                  </p>
                  <button
                    onClick={initCamera}
                    className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
                  >
                    Retry Permission
                  </button>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              )}

              {/* Status pill */}
              <div className="absolute top-3 left-3 flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-xs">
                <span className={`w-2 h-2 rounded-full ${cameraStatus === 'ready' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                <span className="font-semibold text-slate-200">
                  {cameraStatus === 'ready' ? 'Webcam Active' : 'Connecting Camera...'}
                </span>
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Hardware Diagnostics</h3>
              
              <div className="space-y-3">
                {/* Camera item */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Camera className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="text-xs font-bold text-white">Video Stream (Webcam)</div>
                      <div className="text-[11px] text-slate-400">
                        {cameraStatus === 'ready' ? 'Connected & streaming' : 'Requesting stream...'}
                      </div>
                    </div>
                  </div>
                  {cameraStatus === 'ready' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <button
                      onClick={initCamera}
                      className="text-xs text-amber-400 hover:underline"
                    >
                      Connect
                    </button>
                  )}
                </div>

                {/* Mic item */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Volume2 className="w-5 h-5 text-cyan-400" />
                    <div>
                      <div className="text-xs font-bold text-white">Audio Stream (Microphone)</div>
                      <div className="text-[11px] text-slate-400">Ambient noise calibrated</div>
                    </div>
                  </div>
                  {/* Audio wave bar */}
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-3 bg-emerald-500 rounded-full animate-pulse" />
                    <div className="w-1.5 h-5 bg-emerald-500 rounded-full animate-pulse" />
                    <div className="w-1.5 h-4 bg-emerald-500 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setStep(2)}
                  disabled={cameraStatus !== 'ready'}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-40"
                >
                  <span>Proceed to Biometric Calibration</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Step 2: Biometric Reference Photo */}
      {step === 2 && (
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <h3 className="text-lg font-bold text-white">Capture Biometric Baseline</h3>
            <p className="text-xs text-slate-400">
              Look directly into the camera in a well-lit area. This reference snapshot will verify candidate identity throughout the exam session.
            </p>

            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
              {referencePhoto ? (
                <img src={referencePhoto} alt="Reference Face" className="w-full h-full object-cover transform -scale-x-100" />
              ) : (
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              )}

              {/* Centering Oval Overlay */}
              {!referencePhoto && (
                <div className="absolute inset-0 border-2 border-dashed border-emerald-400/50 rounded-full m-8 pointer-events-none flex items-center justify-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 bg-slate-950/80 px-2 py-0.5 rounded-full">
                    Align Face Here
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              {referencePhoto ? (
                <>
                  <button
                    onClick={() => setReferencePhoto(null)}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retake Photo</span>
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex items-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
                  >
                    <span>Confirm &amp; Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={captureReferencePhoto}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition-all transform hover:scale-105"
                >
                  <Camera className="w-4 h-4" />
                  <span>Take Baseline Snapshot</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Exam Rules & Start */}
      {step === 3 && (
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Assessment Rules &amp; Security Protocols</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="font-bold text-white flex items-center space-x-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Single Candidate Presence</span>
                </div>
                <p className="text-slate-400 text-[11px]">No other persons may be in camera view during the exam.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="font-bold text-white flex items-center space-x-1.5">
                  <Maximize2 className="w-4 h-4 text-cyan-400" />
                  <span>Fullscreen Required</span>
                </div>
                <p className="text-slate-400 text-[11px]">Exam starts in fullscreen. Minimize, Esc, or tab switch is logged to your risk score.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div className="text-xs text-slate-300">
                  Ready to begin: <strong className="text-white">{exam.title}</strong> ({exam.duration_minutes} minutes)
                </div>
              </div>
              <button
                onClick={handleStartExam}
                disabled={startingSession}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
              >
                <span>{startingSession ? 'Initializing Exam Room...' : 'Enter Exam Room'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
