import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Flame, 
  Zap, 
  Snowflake, 
  RotateCcw, 
  TrendingUp, 
  Sparkles, 
  Clock, 
  ChevronRight,
  Activity,
} from 'lucide-react';
import { spacedRepetition } from '../../../services/spacedRepetitionService.ts';
import { playChime } from '../../../utils/audio.ts';

interface MemoryRetentionWidgetProps {
  onOpenBlitzModal?: (nodeId?: string) => void;
  onOpenDagHeatmap?: () => void;
}

export const MemoryRetentionWidget: React.FC<MemoryRetentionWidgetProps> = ({
  onOpenBlitzModal,
  onOpenDagHeatmap,
}) => {
  const [summary, setSummary] = useState(() => spacedRepetition.getMemorySummary());

  const refresh = () => {
    setSummary(spacedRepetition.getMemorySummary());
  };

  useEffect(() => {
    const interval = setInterval(refresh, 4000);
    return () => clearInterval(interval);
  }, []);

  const {
    overallRetentionScore,
    totalTrackedNodes,
    hotNodesCount,
    warmNodesCount,
    coolingNodesCount,
    coldNodesCount,
    dueForReviewCount,
    topCoolingTopics,
  } = summary;

  return (
    <div className="h-full flex flex-col justify-between p-3.5 text-slate-800 select-none text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-1.5 font-semibold text-slate-900 text-xs">
          <Brain className="w-3.5 h-3.5 text-sky-600" />
          <span>Кривая памяти Эббингауза</span>
        </div>
        <span
          className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
            overallRetentionScore >= 80
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : overallRetentionScore >= 60
              ? 'bg-sky-50 text-sky-700 border-sky-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          {totalTrackedNodes > 0 ? `${overallRetentionScore}% Удержание` : 'Нет данных'}
        </span>
      </div>

      {/* Main Score & Retention Bar */}
      <div className="my-1.5 p-2.5 bg-slate-50/90 rounded-xl border border-slate-100 space-y-2">
        <div className="flex items-baseline justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {overallRetentionScore}%
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              ({totalTrackedNodes} тем на контроле)
            </span>
          </div>

          <div className="flex items-center space-x-1 text-[10px]">
            <span className="text-emerald-600 font-bold" title="Свежий след">{hotNodesCount}🔥</span>
            <span className="text-sky-600 font-bold" title="Теплый след">{warmNodesCount}⚡</span>
            <span className="text-amber-600 font-bold" title="Остывает">{coolingNodesCount}⏳</span>
            <span className="text-rose-600 font-bold" title="Угроза забывания">{coldNodesCount}❄️</span>
          </div>
        </div>

        {/* Segmented Retention Bar */}
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${(hotNodesCount / Math.max(1, totalTrackedNodes)) * 100}%` }}
          />
          <div
            className="h-full bg-sky-500 transition-all duration-500"
            style={{ width: `${(warmNodesCount / Math.max(1, totalTrackedNodes)) * 100}%` }}
          />
          <div
            className="h-full bg-amber-400 transition-all duration-500"
            style={{ width: `${(coolingNodesCount / Math.max(1, totalTrackedNodes)) * 100}%` }}
          />
          <div
            className="h-full bg-rose-500 transition-all duration-500"
            style={{ width: `${(coldNodesCount / Math.max(1, totalTrackedNodes)) * 100}%` }}
          />
        </div>
      </div>

      {/* Top Cooling Topics */}
      <div className="space-y-1 my-1">
        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
          <span>Срочно освежить:</span>
          {dueForReviewCount > 0 && (
            <span className="text-amber-600 font-semibold">{dueForReviewCount} требуют блица</span>
          )}
        </div>
        <div className="space-y-1">
          {topCoolingTopics.slice(0, 2).map((item) => (
            <button
              key={item.nodeId}
              type="button"
              onClick={() => {
                playChime('click');
                onOpenBlitzModal?.(item.nodeId);
              }}
              className="w-full text-left p-1.5 rounded-lg bg-white border border-slate-200/80 hover:border-sky-300 hover:bg-sky-50/40 text-[11px] flex items-center justify-between transition-colors shadow-2xs group"
            >
              <div className="flex items-center space-x-1.5 truncate max-w-[160px]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span className="font-medium text-slate-800 truncate group-hover:text-sky-700">
                  {item.topicTitle}
                </span>
              </div>
              <span className="font-mono text-[10px] font-bold text-slate-600 shrink-0 ml-1">
                {item.retentionPercentage}%
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
        <button
          type="button"
          onClick={() => {
            playChime('click');
            onOpenBlitzModal?.();
          }}
          className="flex-1 py-1.5 px-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-[11px] font-semibold flex items-center justify-center space-x-1 shadow-2xs transition-colors cursor-pointer"
        >
          <Zap className="w-3 h-3 text-amber-400" />
          <span>Экспресс-Блиц</span>
        </button>

      </div>
    </div>
  );
};
