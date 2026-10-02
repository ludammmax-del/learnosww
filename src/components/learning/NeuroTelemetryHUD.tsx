import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Brain, 
  Zap, 
  Clock, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle,
  Eye,
  Sliders
} from 'lucide-react';
import { telemetryEngine } from '../../services/telemetryEngine.ts';
import { CognitiveTelemetryState, TelemetrySignal } from '../../types.ts';
import { playChime } from '../../utils/audio.ts';

interface NeuroTelemetryHUDProps {
  onTriggerManualGapClosure?: (subtopicHint?: string) => void;
  activeSubtopic?: string;
}

export const NeuroTelemetryHUD: React.FC<NeuroTelemetryHUDProps> = ({
  onTriggerManualGapClosure,
  activeSubtopic,
}) => {
  const [telemetry, setTelemetry] = useState<CognitiveTelemetryState>(telemetryEngine.getState());
  const [isExpanded, setIsExpanded] = useState(false);
  const [customConfusionText, setCustomConfusionText] = useState('');
  const [showConfusionPrompt, setShowConfusionPrompt] = useState(false);

  useEffect(() => {
    const unsub = telemetryEngine.subscribe((updated) => {
      setTelemetry(updated);
    });
    return unsub;
  }, []);

  const getLoadColor = (val: number) => {
    if (val < 40) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (val < 70) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const getLoadBarColor = (val: number) => {
    if (val < 40) return 'bg-emerald-500';
    if (val < 70) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const handleQuickConfusion = (concept: string) => {
    playChime('alert');
    telemetryEngine.trackExplicitConfusion(concept);
    if (onTriggerManualGapClosure) {
      onTriggerManualGapClosure(concept);
    }
  };

  const handleSubmitCustomConfusion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customConfusionText.trim()) return;
    playChime('alert');
    telemetryEngine.trackExplicitConfusion(customConfusionText.trim());
    if (onTriggerManualGapClosure) {
      onTriggerManualGapClosure(customConfusionText.trim());
    }
    setCustomConfusionText('');
    setShowConfusionPrompt(false);
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-md shadow-sm transition-all">
      {/* Compact Top Bar */}
      <div className="p-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Sensor status & Title */}
        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block animate-ping absolute inset-0 opacity-75" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block relative" />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-900 flex items-center space-x-1">
              <Brain className="w-3.5 h-3.5 text-indigo-600" />
              <span>Нейро-Телеметрия ИИ</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              v4.2 Live
            </span>
          </div>
        </div>

        {/* Center: Live Gauges */}
        <div className="flex items-center space-x-3 text-xs">
          {/* Cognitive Load */}
          <div className="flex items-center space-x-1.5" title="Уровень когнитивной нагрузки: расчет по времени задержек, смене ответов и структуре чтения">
            <span className="text-[11px] text-slate-500">Нагрузка:</span>
            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div 
                className={`h-full transition-all duration-500 ${getLoadBarColor(telemetry.overallCognitiveLoad)}`}
                style={{ width: `${telemetry.overallCognitiveLoad}%` }}
              />
            </div>
            <span className={`font-mono font-bold text-[11px] px-1.5 py-0.2 rounded border ${getLoadColor(telemetry.overallCognitiveLoad)}`}>
              {telemetry.overallCognitiveLoad}%
            </span>
          </div>

          {/* Indecision Index */}
          <div className="flex items-center space-x-1.5" title="Индекс сомнений: расчет по колебаниям при выборе вариантов теста">
            <span className="text-[11px] text-slate-500">Сомнения:</span>
            <span className={`font-mono font-bold text-[11px] px-1.5 py-0.2 rounded border ${getLoadColor(telemetry.indecisionIndex)}`}>
              {telemetry.indecisionIndex}%
            </span>
          </div>

          {/* Active Gap Status Badge */}
          {telemetry.activeGapBlock ? (
            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 font-bold text-[10px] uppercase flex items-center space-x-1 animate-pulse">
              <ShieldAlert className="w-3 h-3 text-rose-600" />
              <span>Ликвидация пробела</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Поток стабилен</span>
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            id="btn-quick-confusion"
            onClick={() => setShowConfusionPrompt(!showConfusionPrompt)}
            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
            title="Зафиксировать, что этот блок или мысль вам не понятна"
          >
            <Zap className="w-3 h-3 text-amber-600" />
            <span>Не понял этот момент</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title={isExpanded ? 'Свернуть журнал сигналов' : 'Развернуть журнал сигналов телеметрии'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Manual Confusion Prompt Drawer */}
      {showConfusionPrompt && (
        <form onSubmit={handleSubmitCustomConfusion} className="p-3 bg-amber-50/80 border-t border-amber-200 flex items-center space-x-2 animate-fade-in">
          <HelpCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <input
            type="text"
            value={customConfusionText}
            onChange={(e) => setCustomConfusionText(e.target.value)}
            placeholder="Что именно вызвало затык? (напр: почему B-Tree не ищет по второму ключу?)"
            className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
            autoFocus
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition"
          >
            Встроить блок закрытия
          </button>
          <button
            type="button"
            onClick={() => setShowConfusionPrompt(false)}
            className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-800"
          >
            Отмена
          </button>
        </form>
      )}

      {/* Expanded Signal Stream */}
      {isExpanded && (
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 rounded-b-2xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-500" />
              <span>Поток поведенческих сигналов (Live Behavioral Telemetry Stream)</span>
            </span>

            <span className="text-[10px] text-slate-400 font-mono">
              Событий в буфере: {telemetry.signals.length}
            </span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {telemetry.signals.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Сигналы появятся при взаимодействии с курсом...</p>
            ) : (
              telemetry.signals.map((sig) => {
                let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                if (sig.severity === 'critical') badgeColor = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
                else if (sig.severity === 'high') badgeColor = 'bg-orange-100 text-orange-800 border-orange-300';
                else if (sig.severity === 'medium') badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
                else if (sig.type === 'remediation_success') badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';

                return (
                  <div 
                    key={sig.id}
                    className="p-2 rounded-xl bg-white border border-slate-200/80 text-xs flex items-start justify-between space-x-2 shadow-2xs"
                  >
                    <div className="flex items-start space-x-2">
                      <span className={`text-[10px] px-1.5 py-0.2 rounded border font-mono shrink-0 mt-0.5 ${badgeColor}`}>
                        {sig.type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-slate-700 leading-snug">{sig.details}</span>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {new Date(sig.timestamp).toLocaleTimeString('ru-RU', { minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
