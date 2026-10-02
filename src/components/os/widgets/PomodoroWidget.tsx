import React from 'react';
import { Play, Pause, RotateCcw, Clock, Sparkles } from 'lucide-react';
import { playChime } from '../../../utils/audio.ts';

interface PomodoroWidgetProps {
  pomodoroMinutes: number;
  pomodoroSecondsLeft?: number;
  isPomodoroRunning: boolean;
  onTogglePomodoro: () => void;
  onResetPomodoro: () => void;
  onSetPomodoroMinutes: (mins: number) => void;
}

export const PomodoroWidget: React.FC<PomodoroWidgetProps> = ({
  pomodoroMinutes,
  pomodoroSecondsLeft,
  isPomodoroRunning,
  onTogglePomodoro,
  onResetPomodoro,
  onSetPomodoroMinutes,
}) => {
  const totalSeconds = pomodoroMinutes * 60;
  const currentSeconds = pomodoroSecondsLeft !== undefined ? pomodoroSecondsLeft : totalSeconds;
  const progressPercent = Math.max(0, Math.min(100, ((totalSeconds - currentSeconds) / totalSeconds) * 100));

  const minutes = Math.floor(currentSeconds / 60);
  const seconds = currentSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="p-3.5 flex flex-col justify-between h-full select-none text-slate-800">
      {/* Top Header & Presets */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-900">
          <Clock className="w-3.5 h-3.5 text-sky-500" />
          <span>Фокус-Таймер</span>
        </div>
        <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-md text-[10px]">
          <button
            type="button"
            onClick={() => onSetPomodoroMinutes(25)}
            className={`px-1.5 py-0.5 rounded font-medium transition cursor-pointer ${
              pomodoroMinutes === 25 ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            25m
          </button>
          <button
            type="button"
            onClick={() => onSetPomodoroMinutes(50)}
            className={`px-1.5 py-0.5 rounded font-medium transition cursor-pointer ${
              pomodoroMinutes === 50 ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            50m
          </button>
        </div>
      </div>

      {/* Main Countdown Display */}
      <div className="flex flex-col items-center justify-center my-1.5 py-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
        <div className="text-3xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
          {formattedTime}
        </div>
        <div className="w-36 h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
          <div
            className="h-full bg-sky-500 transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-[10px] text-slate-400 mt-1.5 font-medium">
          {isPomodoroRunning ? 'Идет фокус-сессия (+500 XP)' : 'Готов к глубокой концентрации'}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-2 pt-1">
        <button
          type="button"
          onClick={onTogglePomodoro}
          className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs ${
            isPomodoroRunning
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-slate-900 hover:bg-slate-800 text-white'
          }`}
        >
          {isPomodoroRunning ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span>Пауза</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Старт</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onResetPomodoro}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
          title="Сброс"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
