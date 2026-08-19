import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, AlertCircle, Users, Eye, Phone, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';

export const WebcamMonitor = ({
  sessionId,
  isActive = true,
  onStatusUpdate,
  onNewAlert,
  showHUD = true
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);

  const [streamReady, setStreamReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [status, setStatus] = useState({
    face_detected: true,
    face_count: 1,
    centered: true,
    lighting_score: 85,
    gaze_direction: 'LOOKING_CENTER',
    head_pose: 'CENTER',
    prohibited_detected: false,
    risk_score: 0,
    risk_level: 'LOW'
  });
  const [currentWarning, setCurrentWarning] = useState(null);

  // Initialize webcam
  useEffect(() => {
    let currentStream = null;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false
        });
        currentStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setStreamReady(true);
          };
        }
      } catch (err) {
        console.error('Camera access error:', err);
        setCameraError('Camera access denied or unavailable. Please allow camera permissions to continue.');
      }
    };

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Frame Capture & CV Processing Loop
  const captureAndAnalyzeFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !streamReady || !isActive || !sessionId) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    canvas.width = 320;
    canvas.height = 240;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64Frame = canvas.toDataURL('image/jpeg', 0.65);

    try {
      const res = await api.processFrame(sessionId, base64Frame);
      if (res && res.status === 'active') {
        setStatus(res);
        if (onStatusUpdate) onStatusUpdate(res);

        // Check for immediate warnings
        if (!res.face_detected) {
          setCurrentWarning({ type: 'danger', message: '⚠️ Face not detected! Please look at the camera.' });
        } else if (res.face_count > 1) {
          setCurrentWarning({ type: 'danger', message: `⚠️ Multiple faces detected (${res.face_count}) in frame!` });
        } else if (res.prohibited_detected) {
          setCurrentWarning({ type: 'danger', message: '⚠️ Prohibited device/phone detected!' });
        } else if (res.gaze_direction !== 'LOOKING_CENTER' && res.gaze_direction !== 'UNKNOWN') {
          setCurrentWarning({ type: 'warning', message: `⚠️ Attention deviation: ${res.gaze_direction.replace('_', ' ')}` });
        } else {
          setCurrentWarning(null);
        }

        if (res.new_events && res.new_events.length > 0 && onNewAlert) {
          res.new_events.forEach(ev => onNewAlert(ev));
        }

        // Draw bounding boxes on overlay canvas
        if (overlayCanvasRef.current && res.faces) {
          const oCanvas = overlayCanvasRef.current;
          const oCtx = oCanvas.getContext('2d');
          oCanvas.width = video.videoWidth || 640;
          oCanvas.height = video.videoHeight || 480;
          oCtx.clearRect(0, 0, oCanvas.width, oCanvas.height);

          const scaleX = oCanvas.width / canvas.width;
          const scaleY = oCanvas.height / canvas.height;

          // Draw face box
          res.faces.forEach(([fx, fy, fw, fh]) => {
            oCtx.strokeStyle = res.face_count > 1 ? '#ef4444' : '#10b981';
            oCtx.lineWidth = 2;
            oCtx.strokeRect(fx * scaleX, fy * scaleY, fw * scaleX, fh * scaleY);
          });
        }
      }
    } catch (err) {
      console.warn('Frame processing request error:', err);
    }
  }, [sessionId, streamReady, isActive, onStatusUpdate, onNewAlert]);

  useEffect(() => {
    if (!isActive || !streamReady) return;
    const interval = setInterval(captureAndAnalyzeFrame, 1800);
    return () => clearInterval(interval);
  }, [captureAndAnalyzeFrame, isActive, streamReady]);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Video Feed */}
      <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center">
        {cameraError ? (
          <div className="p-6 text-center text-rose-400 space-y-2">
            <AlertCircle className="w-10 h-10 mx-auto" />
            <p className="text-sm font-medium">{cameraError}</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
            {/* Overlay Canvas for Face Bounding Boxes */}
            <canvas
              ref={overlayCanvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none transform -scale-x-100"
            />
          </>
        )}

        {/* Live Proctoring Status Badge (Top-Left) */}
        <div className="absolute top-3 left-3 flex items-center space-x-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-800">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-300">
            AI Monitoring Live
          </span>
        </div>

        {/* Quick Indicators HUD (Top-Right) */}
        {showHUD && streamReady && (
          <div className="absolute top-3 right-3 flex items-center space-x-1.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-800 text-xs">
            <div title="Face Presence" className={`flex items-center space-x-1 ${status.face_detected ? 'text-emerald-400' : 'text-rose-400 font-bold'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{status.face_detected ? 'Face OK' : 'No Face'}</span>
            </div>
            <span className="text-slate-700">|</span>
            <div title="Gaze" className={`text-slate-300 ${status.gaze_direction !== 'LOOKING_CENTER' ? 'text-amber-400' : ''}`}>
              {status.gaze_direction === 'LOOKING_CENTER' ? 'Gaze Centered' : status.gaze_direction}
            </div>
          </div>
        )}

        {/* Real-time Warning Banner */}
        {currentWarning && (
          <div className={`absolute bottom-3 inset-x-3 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 backdrop-blur-md transition-all ${
            currentWarning.type === 'danger'
              ? 'bg-rose-500/90 text-white shadow-lg shadow-rose-900/50 animate-bounce'
              : 'bg-amber-500/90 text-slate-950'
          }`}>
            <ShieldAlert className="w-4 h-4" />
            <span>{currentWarning.message}</span>
          </div>
        )}
      </div>

      {/* Mini Diagnostic Footer */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-3">
          <span>Faces: <strong className="text-slate-200">{status.face_count}</strong></span>
          <span>Lighting: <strong className="text-slate-200">{status.lighting_score}%</strong></span>
        </div>
        <div className="flex items-center space-x-2">
          <span>Risk:</span>
          <span className={`font-bold ${
            status.risk_level === 'LOW' ? 'text-emerald-400' : status.risk_level === 'MEDIUM' ? 'text-amber-400' : 'text-rose-400'
          }`}>
            {status.risk_score} pts ({status.risk_level})
          </span>
        </div>
      </div>
    </div>
  );
};
