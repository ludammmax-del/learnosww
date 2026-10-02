import React, { useState, useEffect, useCallback } from 'react';
import { 
  Lock, 
  Unlock, 
  LogIn, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  User, 
  ChevronRight,
  Fingerprint
} from 'lucide-react';
import { playChime } from '../../utils/audio.ts';

interface SystemLockScreenModalProps {
  isOpen: boolean;
  onUnlock: () => void;
  userName?: string;
  userEmail?: string;
  userPhoto?: string;
}

export const SystemLockScreenModal: React.FC<SystemLockScreenModalProps> = ({
  isOpen,
  onUnlock,
  userName = 'Студент',
  userEmail,
  userPhoto,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Update clock every second
  useEffect(() => {
    if (!isOpen) return;
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleTriggerUnlock = useCallback(() => {
    if (isUnlocking) return;
    setIsUnlocking(true);
    playChime('success');

    setTimeout(() => {
      setIsUnlocking(false);
      onUnlock();
    }, 350);
  }, [isUnlocking, onUnlock]);

  // Handle keyboard shortcut: Enter, Space, Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        handleTriggerUnlock();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleTriggerUnlock]);

  if (!isOpen) return null;

  // Formatting Russian date and time
  const hours = String(currentTime.getHours()).padStart(2, '0');
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');
  const seconds = String(currentTime.getSeconds()).padStart(2, '0');

  const dateStr = currentTime.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const cleanFirstName = (userName || 'Пользователь')
    .trim()
    .split(/\s+/)[0]
    .replace(/[^\p{L}\p{N}_-]/gu, '');

  return (
    <div className="fixed inset-0 z-[99999] bg-black text-white flex flex-col justify-between p-6 sm:p-12 select-none overflow-hidden transition-all duration-300">
      {/* Subtle deep ambient glow behind the clock */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/40 via-black to-black pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between w-full max-w-5xl mx-auto text-slate-400 text-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono tracking-wider uppercase font-semibold text-slate-300">
            Learning OS · Защищенный сеанс
          </span>
        </div>

        <div className="flex items-center space-x-2 text-[11px] bg-white/5 border border-white/10 px-3 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Блокировка при неактивности 5 минут</span>
        </div>
      </div>

      {/* Center Hero: Clock & Sign In */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto space-y-8 max-w-md mx-auto text-center">
        {/* Massive Digital Clock */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-center font-mono font-bold tracking-tighter text-7xl sm:text-8xl text-white drop-shadow-[0_0_35px_rgba(255,255,255,0.15)]">
            <span>{hours}</span>
            <span className="text-slate-500 animate-pulse px-1">:</span>
            <span>{minutes}</span>
            <span className="text-2xl sm:text-3xl text-slate-500 font-normal ml-2 tabular-nums">
              :{seconds}
            </span>
          </div>

          <div className="text-sm sm:text-base font-medium text-slate-300 capitalize tracking-wide">
            {dateStr}
          </div>
        </div>

        {/* User Card & Lock Status */}
        <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md w-full space-y-4 shadow-2xl">
          <div className="flex items-center justify-center space-x-3">
            {userPhoto ? (
              <img
                src={userPhoto}
                alt={userName}
                className="w-12 h-12 rounded-full border-2 border-white/20 object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {cleanFirstName.slice(0, 1).toUpperCase()}
              </div>
            )}

            <div className="text-left">
              <h3 className="font-bold text-white text-sm sm:text-base">
                {userName || 'Студент'}
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-[200px]">
                {userEmail || 'Сеанс приостановлен'}
              </p>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-black/40 border border-white/5 rounded-xl p-2.5 flex items-center justify-center space-x-2">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Вкладка или мышь были неактивны более 5 минут</span>
          </div>

          {/* Primary "Войти в систему" Button */}
          <button
            type="button"
            id="btn-lockscreen-unlock"
            onClick={handleTriggerUnlock}
            disabled={isUnlocking}
            className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center space-x-2.5 transition-all duration-200 cursor-pointer shadow-xl ${
              isUnlocking
                ? 'bg-emerald-500 text-black scale-95'
                : 'bg-white hover:bg-slate-100 text-slate-950 hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] active:scale-95'
            }`}
          >
            {isUnlocking ? (
              <>
                <Unlock className="w-4 h-4 animate-bounce" />
                <span>Вход в систему...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Войти в систему</span>
                <ChevronRight className="w-4 h-4 opacity-60" />
              </>
            )}
          </button>
        </div>

        {/* Keyboard hint */}
        <div className="text-xs text-slate-500 flex items-center space-x-1.5 font-mono">
          <span>Нажмите</span>
          <kbd className="px-2 py-0.5 rounded bg-white/10 text-slate-300 border border-white/15 text-[11px]">Enter</kbd>
          <span>или</span>
          <kbd className="px-2 py-0.5 rounded bg-white/10 text-slate-300 border border-white/15 text-[11px]">Пробел</kbd>
          <span>для быстрого входа</span>
        </div>
      </div>

      {/* Footer / Copyright */}
      <div className="relative z-10 flex flex-wrap items-center justify-between w-full max-w-5xl mx-auto text-slate-500 text-[11px] pt-4 border-t border-white/5">
        <div>
          Конфиденциальность защищена · Все несохраненные данные сохранены в локальном кэше
        </div>

        <div className="flex items-center space-x-2">
          <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
          <span>Biometric & PIN-Ready OS Lock</span>
        </div>
      </div>
    </div>
  );
};
