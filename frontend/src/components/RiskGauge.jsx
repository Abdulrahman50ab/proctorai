import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

export const RiskGauge = ({ score = 0, level = 'LOW', size = 'normal' }) => {
  const getBadgeConfig = () => {
    if (score <= 20 || level === 'LOW') {
      return {
        label: 'LOW RISK',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        barColor: 'from-emerald-500 to-teal-400',
        icon: ShieldCheck,
        description: 'Session integrity is normal. No significant violations.'
      };
    } else if (score <= 50 || level === 'MEDIUM') {
      return {
        label: 'MEDIUM RISK',
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        barColor: 'from-amber-500 to-orange-400',
        icon: AlertTriangle,
        description: 'Moderate attention deviation or suspicious cues logged.'
      };
    } else {
      return {
        label: 'HIGH RISK',
        color: 'text-rose-400',
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/30',
        barColor: 'from-rose-500 to-red-600',
        icon: AlertOctagon,
        description: 'Multiple serious anomalies detected. Manual review required.'
      };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  if (size === 'compact') {
    return (
      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border ${config.bg} ${config.border}`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
        <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
        <span className="text-xs font-mono text-slate-400">({score}%)</span>
      </div>
    );
  }

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Proctoring Risk Index</span>
        <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border ${config.bg} ${config.border}`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
          <span className={`text-xs font-bold ${config.color}`}>{config.label}</span>
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline space-x-1">
          <span className="text-4xl font-extrabold tracking-tight text-white font-mono">{score}</span>
          <span className="text-sm font-medium text-slate-500">/100</span>
        </div>
        <span className="text-xs text-slate-400">Target: &lt; 20</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${config.barColor} transition-all duration-500`}
          style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
        />
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        {config.description}
      </p>
    </div>
  );
};
