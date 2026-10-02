import React from 'react';
import { Award, Zap, ShieldCheck, TrendingUp } from 'lucide-react';

interface KarmaWidgetProps {
  karma: number;
}

export const KarmaWidget: React.FC<KarmaWidgetProps> = ({ karma }) => {
  // Level threshold calculation
  const level = Math.floor(karma / 5000) + 1;
  const currentLevelBase = (level - 1) * 5000;
  const nextLevelBase = level * 5000;
  const xpInLevel = karma - currentLevelBase;
  const percent = Math.min(100, Math.max(0, Math.round((xpInLevel / 5000) * 100)));

  return (
    <div className="h-full flex flex-col justify-between p-3.5 text-slate-800 select-none text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-1.5 font-semibold text-slate-900 text-xs">
          <Award className="w-3.5 h-3.5 text-amber-500" />
          <span>Карма & Инженерный Уровень</span>
        </div>
        <span className="font-mono text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
          LVL {level}
        </span>
      </div>

      {/* Main Stats */}
      <div className="my-2 p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
        <div className="flex items-baseline justify-between mb-1.5">
          <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
            {karma.toLocaleString('ru-RU')}
            <span className="text-xs font-sans text-slate-400 font-medium ml-1">XP</span>
          </div>
          <span className="text-[10px] text-slate-500">До LVL {level + 1}: {5000 - xpInLevel} XP</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-amber-400 to-amber-500 transition-all duration-700 rounded-full"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Rank Label */}
      <div className="pt-1 flex items-center justify-between text-[11px]">
        <span className="text-slate-500 flex items-center space-x-1">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          <span>Ранг:</span>
        </span>
        <span className="font-semibold text-slate-800 truncate">
          {level >= 5 ? 'Staff Systems Architect' : level >= 3 ? 'Senior Engineer' : 'Middle Engineer'}
        </span>
      </div>
    </div>
  );
};
