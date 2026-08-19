import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Activity, CheckCircle2, UserCheck, Eye, Smartphone } from 'lucide-react';

export const RiskGauge = ({ score = 0, level = 'LOW', subMetrics = {} }) => {
  const normalizedScore = Math.min(100, Math.max(0, score));

  // Determine colors based on risk severity
  const getSeverityConfig = () => {
    if (normalizedScore < 25) {
      return {
        label: 'VERIFIED LOW RISK',
        textColor: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
        barColor: 'bg-gradient-to-r from-emerald-500 to-teal-400',
        glowColor: 'shadow-emerald-500/20',
        icon: ShieldCheck,
        description: 'Session integrity is normal. No significant anomalies or violations detected.'
      };
    } else if (normalizedScore < 60) {
      return {
        label: 'MODERATE SUSPICION',
        textColor: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        barColor: 'bg-gradient-to-r from-amber-500 to-orange-400',
        glowColor: 'shadow-amber-500/20',
        icon: AlertTriangle,
        description: 'Multiple minor deviations observed (e.g. gaze shift, momentary face obstruction).'
      };
    } else {
      return {
        label: 'HIGH RISK / CRITICAL',
        textColor: 'text-rose-400',
        bgColor: 'bg-rose-500/10',
        borderColor: 'border-rose-500/30',
        barColor: 'bg-gradient-to-r from-rose-600 to-red-500',
        glowColor: 'shadow-rose-500/30',
        icon: ShieldAlert,
        description: 'Critical integrity violations flagged. Human examiner review recommended.'
      };
    }
  };

  const config = getSeverityConfig();
  const IconComponent = config.icon;

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800/90 shadow-xl space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Proctoring Risk Index
          </span>
        </div>
        
        {/* Severity Badge */}
        <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-[11px] font-extrabold tracking-wide ${config.bgColor} ${config.borderColor} ${config.textColor}`}>
          <IconComponent className="w-3.5 h-3.5" />
          <span>{config.label}</span>
        </div>
      </div>

      {/* Main Score Display */}
      <div className="flex items-baseline justify-between pt-1">
        <div className="flex items-baseline space-x-1.5">
          <span className={`text-4xl font-black tracking-tight font-mono ${config.textColor}`}>
            {normalizedScore}
          </span>
          <span className="text-sm font-semibold text-slate-500">/ 100 pts</span>
        </div>
        <div className="text-right text-[11px] text-slate-400">
          Threshold: <span className="font-semibold text-slate-200">&lt; 25 pts</span>
        </div>
      </div>

      {/* Modern Multi-color Progress Bar */}
      <div className="space-y-1.5">
        <div className="h-2.5 w-full bg-slate-900/90 rounded-full overflow-hidden p-0.5 border border-slate-800 flex items-center">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${config.barColor} ${config.glowColor}`}
            style={{ width: `${Math.max(5, normalizedScore)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 font-mono px-0.5">
          <span>0 (Secure)</span>
          <span>50 (Review)</span>
          <span>100 (Disqualify)</span>
        </div>
      </div>

      {/* Mini Sub-Metric Health Badges */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/80">
        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/70 text-center">
          <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-400">
            <UserCheck className="w-3 h-3 text-emerald-400" />
            <span>Face Presence</span>
          </div>
          <div className="text-xs font-bold text-slate-200 mt-0.5 font-mono">
            {subMetrics.facePresence || (normalizedScore > 50 ? '82%' : '99%')}
          </div>
        </div>

        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/70 text-center">
          <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-400">
            <Eye className="w-3 h-3 text-cyan-400" />
            <span>Gaze Focus</span>
          </div>
          <div className="text-xs font-bold text-slate-200 mt-0.5 font-mono">
            {subMetrics.gazeFocus || (normalizedScore > 40 ? '85%' : '96%')}
          </div>
        </div>

        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/70 text-center">
          <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-400">
            <Smartphone className="w-3 h-3 text-emerald-400" />
            <span>Clean Desk</span>
          </div>
          <div className="text-xs font-bold text-slate-200 mt-0.5 font-mono">
            {subMetrics.cleanDesk || '100%'}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-400 leading-relaxed">
        {config.description}
      </p>

    </div>
  );
};
