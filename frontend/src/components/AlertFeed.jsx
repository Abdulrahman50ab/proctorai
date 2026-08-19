import React from 'react';
import { AlertCircle, Eye, Users, Phone, Maximize2, Mic, Clock } from 'lucide-react';

export const AlertFeed = ({ events = [] }) => {
  const getEventIcon = (type) => {
    switch (type) {
      case 'FACE_NOT_DETECTED':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      case 'MULTIPLE_FACES_DETECTED':
        return <Users className="w-4 h-4 text-orange-400" />;
      case 'PHONE_DETECTED':
        return <Phone className="w-4 h-4 text-red-500" />;
      case 'GAZE_DEVIATION':
      case 'HEAD_POSE_ANOMALY':
        return <Eye className="w-4 h-4 text-amber-400" />;
      case 'FULLSCREEN_EXITED':
        return <Maximize2 className="w-4 h-4 text-yellow-400" />;
      case 'VOICE_DETECTED':
        return <Mic className="w-4 h-4 text-blue-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
          <span>Suspicious Events Feed</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-400">
            {events.length}
          </span>
        </h3>
        <span className="text-[11px] text-slate-500 font-mono">Live Timeline</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 mt-3 pr-1 max-h-[340px]">
        {events.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center text-emerald-400">
              ✓
            </div>
            <p className="text-xs">No suspicious events logged yet.<br/>Candidate behavior is clean.</p>
          </div>
        ) : (
          events.map((ev, idx) => (
            <div
              key={ev.id || idx}
              className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-start space-x-3 hover:border-slate-700 transition-colors"
            >
              <div className="p-2 rounded-lg bg-slate-800/60 mt-0.5">
                {getEventIcon(ev.event_type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 truncate">
                    {ev.event_type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] font-mono text-rose-400 font-semibold bg-rose-500/10 px-1.5 py-0.5 rounded">
                    +{ev.risk_score_impact || 10} pts
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-400">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{formatTime(ev.timestamp)}</span>
                  {ev.confidence && (
                    <>
                      <span>•</span>
                      <span>Conf: {Math.round(ev.confidence * 100)}%</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
