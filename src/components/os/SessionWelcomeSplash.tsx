import React, { useState, useEffect, useCallback } from 'react';

interface SessionWelcomeSplashProps {
  userName: string;
  onFinished: () => void;
}

export const SessionWelcomeSplash: React.FC<SessionWelcomeSplashProps> = ({
  userName,
  onFinished,
}) => {
  const [stage, setStage] = useState<'enter' | 'visible' | 'fadeout'>('enter');

  // Extract first name for a natural friendly greeting: "Привет, Егор"
  const cleanFirstName = (userName || 'Студент')
    .trim()
    .split(/\s+/)[0]
    .replace(/[^\p{L}\p{N}_-]/gu, '');

  const handleDismiss = useCallback(() => {
    setStage('fadeout');
    const timer = setTimeout(() => {
      onFinished();
    }, 450);
    return () => clearTimeout(timer);
  }, [onFinished]);

  useEffect(() => {
    // Stage 1: Entrance animation begins
    const timer1 = setTimeout(() => {
      setStage('visible');
    }, 30);

    // Stage 2: Trigger graceful fadeout after 1.2s
    const timer2 = setTimeout(() => {
      setStage('fadeout');
    }, 1200);

    // Stage 3: Finish and unmount after 1.6s
    const timer3 = setTimeout(() => {
      onFinished();
    }, 1600);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener('keydown', handleKey);
    };
  }, [onFinished, handleDismiss]);

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-slate-950/70 backdrop-blur-2xl text-white select-none cursor-pointer transition-all duration-500 ease-out ${
        stage === 'fadeout' ? 'opacity-0 pointer-events-none scale-[1.01]' : 'opacity-100 scale-100'
      }`}
      style={{
        transitionProperty: 'opacity, transform, filter',
        transitionDuration: '500ms',
      }}
    >
      {/* Subtle top subtle system badge */}
      <div className="w-full px-8 py-6 flex items-center justify-between opacity-50">
        <div className="text-[10px] font-mono tracking-widest text-slate-300 uppercase">
          Learning OS
        </div>
        <div className="text-[10px] font-mono text-emerald-400 font-semibold flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Сессия активна</span>
        </div>
      </div>

      {/* Center Animated Greeting */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-xl">
        <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-2xl text-white mb-6 shadow-2xl">
          {(cleanFirstName || 'L')[0]}
        </div>

        <h1
          className={`text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-white transition-all duration-500 transform ${
            stage === 'enter'
              ? 'opacity-0 translate-y-4 scale-98'
              : stage === 'visible'
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-70 translate-y-[-4px] scale-[1.01]'
          }`}
          style={{
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
            letterSpacing: '-0.025em',
          }}
        >
          Привет, {cleanFirstName || 'Инженер'}
        </h1>

        <p
          className={`mt-3 text-xs sm:text-sm text-slate-300 font-normal tracking-wide transition-all duration-500 delay-100 ${
            stage === 'enter' ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
          }`}
        >
          Рабочее пространство готово
        </p>

        {/* Minimal loading indicator dots */}
        <div
          className={`mt-5 flex items-center space-x-2 transition-all duration-500 delay-200 ${
            stage === 'enter' ? 'opacity-0' : 'opacity-70'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse delay-100" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse delay-200" />
        </div>
      </div>

      {/* Subtle skip prompt at bottom */}
      <div className="w-full pb-8 text-center text-[10px] text-slate-400 font-mono tracking-wider uppercase opacity-80">
        Кликните или нажмите пробел для входа
      </div>
    </div>
  );
};
