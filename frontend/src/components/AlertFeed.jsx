import React, { useState } from 'react';
import { 
  AlertCircle, ShieldCheck, Eye, Users, Smartphone, 
  ExternalLink, Maximize2, Clock, Image as ImageIcon, X 
} from 'lucide-react';

export const AlertFeed = ({ events = [], maxItems = 6 }) => {
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  const getEventBadge = (eventType) => {
    switch (eventType) {
      case 'FACE_NOT_DETECTED':
        return {
          label: 'Face Missing',
          color: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          icon: AlertCircle
        };
      case 'MULTIPLE_FACES_DETECTED':
        return {
          label: 'Multiple Faces',
          color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          icon: Users
        };
      case 'GAZE_DEVIATION':
      case 'HEAD_POSE_ANOMALY':
        return {
          label: 'Gaze / Pose Shift',
          color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
          icon: Eye
        };
      case 'PHONE_DETECTED':
        return {
          label: 'Prohibited Phone',
          color: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
          icon: Smartphone
        };
      case 'FULLSCREEN_EXITED':
        return {
          label: 'Fullscreen Exit',
          color: 'bg-red-500/15 text-red-400 border-red-500/30',
          icon: Maximize2
        };
      case 'TAB_SWITCHED':
      case 'WINDOW_BLURRED':
        return {
          label: eventType === 'TAB_SWITCHED' ? 'Tab Switch' : 'Window Minimized',
          color: 'bg-red-500/15 text-red-400 border-red-500/30',
          icon: ExternalLink
        };
      case 'COPY_ATTEMPTED':
        return {
          label: 'Copy Blocked',
          color: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
          icon: AlertCircle
        };
      default:
        return {
          label: eventType.replace(/_/g, ' '),
          color: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
          icon: AlertCircle
        };
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  const displayEvents = events.slice(0, maxItems);

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800/90 shadow-xl space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Real-time Integrity Feed
          </h3>
        </div>
        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
          {events.length} {events.length === 1 ? 'event' : 'events'}
        </span>
      </div>

      {/* Events List */}
      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
        {displayEvents.length === 0 ? (
          <div className="py-8 text-center text-slate-500 space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-slate-400">All Clear</p>
            <p className="text-[11px] text-slate-500">No suspicious events or anomalies logged yet.</p>
          </div>
        ) : (
          displayEvents.map((ev, idx) => {
            const badge = getEventBadge(ev.event_type);
            const Icon = badge.icon;
            const impact = ev.risk_score_impact || (ev.event_type === 'FACE_NOT_DETECTED' ? 10 : 15);

            return (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700/80 transition-all flex items-start justify-between space-x-3 group"
              >
                <div className="flex items-start space-x-2.5">
                  <div className={`p-1.5 rounded-lg border flex-shrink-0 mt-0.5 ${badge.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded border ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {formatTimestamp(ev.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-snug">
                      {ev.message || ev.details?.message || `Flagged ${badge.label.toLowerCase()}`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-1 flex-shrink-0">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    +{impact} pts
                  </span>
                  {ev.evidence_path && (
                    <button
                      onClick={() => setSelectedEvidence(ev.evidence_path)}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>Evidence</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Evidence Snapshot Modal */}
      {selectedEvidence && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <span>Captured Forensic Evidence Snapshot</span>
              </h4>
              <button
                onClick={() => setSelectedEvidence(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-black border border-slate-800 aspect-video flex items-center justify-center">
              <img
                src={selectedEvidence.startsWith('http') ? selectedEvidence : `/uploads/${selectedEvidence}`}
                alt="Forensic Snapshot"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.src = 'https://placehold.co/600x400/0f172a/94a3b8?text=Forensic+Snapshot';
                }}
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedEvidence(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
              >
                Close Snapshot
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
