import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { playChime } from '../../utils/audio.ts';

interface HandwrittenHelloIntroProps {
  onStart: () => void;
  className?: string;
}

export const HandwrittenHelloIntro: React.FC<HandwrittenHelloIntroProps> = ({
  onStart,
  className = '',
}) => {
  const pathRef = useRef<SVGPathElement>(null);
  const [isDrawn, setIsDrawn] = useState<boolean>(false);
  const [penPos, setPenPos] = useState<{ x: number; y: number } | null>(null);
  const [pathLength, setPathLength] = useState<number>(1800);
  const [drawProgress, setDrawProgress] = useState<number>(0);

  // Iconic cursive single-stroke calligraphy path for "hello"
  // Designed with natural loops for h, e, l, l, o and a final graceful flourish
  const helloPath = 
    'M 40,165 ' +
    'C 60,155 88,85 105,42 C 112,22 104,18 96,44 C 84,90 76,168 74,198 ' +
    'C 86,162 108,135 132,135 C 150,135 160,148 158,168 C 155,188 150,198 166,198 ' +
    'C 182,198 200,178 206,160 C 212,142 204,136 192,146 C 174,160 176,194 198,198 ' +
    'C 218,198 238,115 248,58 C 252,30 244,26 236,52 C 224,92 218,172 234,198 ' +
    'C 252,198 272,115 282,58 C 286,30 278,26 270,52 C 258,92 252,172 268,198 ' +
    'C 284,198 304,166 318,152 C 336,134 354,146 354,166 C 354,190 334,200 316,198 ' +
    'C 302,196 300,170 318,160 C 336,150 366,156 395,158';

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    const totalLength = path.getTotalLength();
    setPathLength(totalLength);

    let startTime: number | null = null;
    const duration = 2400; // 2.4s natural handwriting speed

    let animId: number;

    const animateStroke = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth handwriting acceleration and deceleration curve
      // Cubic ease-in-out
      const ease = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      setDrawProgress(ease);

      // Update current pen tip position
      try {
        const currentLength = ease * totalLength;
        const pt = path.getPointAtLength(currentLength);
        setPenPos({ x: pt.x, y: pt.y });
      } catch {}

      if (progress < 1) {
        animId = requestAnimationFrame(animateStroke);
      } else {
        setIsDrawn(true);
        setPenPos(null);
        playChime('success');
      }
    };

    // Small delay to let the screen mount gracefully
    const timeout = setTimeout(() => {
      animId = requestAnimationFrame(animateStroke);
    }, 300);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Keyboard navigation: Enter or Space starts setup immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart]);

  return (
    <div 
      onClick={onStart}
      className={`relative z-20 flex flex-col items-center justify-center w-full max-w-xl mx-auto px-4 sm:px-6 my-auto cursor-pointer select-none text-center ${className}`}
      title="Нажмите в любом месте, чтобы начать"
    >
      {/* Animated Calligraphy "hello" SVG Canvas (100% Geometrically Centered) */}
      <div className="relative w-full max-w-[340px] sm:max-w-[420px] aspect-[405/214] mx-auto flex items-center justify-center">
        <svg
          viewBox="15 2 405 214"
          className="w-full h-full overflow-visible"
        >
          {/* Subtle background guide shadow for realistic paper/glass depth */}
          <path
            d={helloPath}
            fill="none"
            stroke="rgba(15, 23, 42, 0.05)"
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Main Handwritten Pen Stroke */}
          <path
            ref={pathRef}
            d={helloPath}
            fill="none"
            stroke="#0F172A"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: pathLength,
              strokeDashoffset: pathLength * (1 - drawProgress),
              filter: 'drop-shadow(0 4px 12px rgba(15, 23, 42, 0.12))',
            }}
          />

          {/* Active Ink Pen Tip (follows writing point with soft glow) */}
          {penPos && drawProgress < 0.99 && (
            <g transform={`translate(${penPos.x}, ${penPos.y})`}>
              {/* Outer soft glowing aura */}
              <circle r="7" fill="rgba(225, 110, 75, 0.3)" className="animate-ping" />
              {/* Core ink tip */}
              <circle r="4" fill="#E05638" />
              <circle r="1.5" fill="#FFFFFF" />
            </g>
          )}
        </svg>
      </div>

      {/* Post-drawing reveal: Subtitle & Start Action (Perfect vertical symmetry & alignment) */}
      <div 
        className={`w-full max-w-md mx-auto mt-6 sm:mt-8 space-y-4 sm:space-y-5 flex flex-col items-center justify-center text-center transition-all duration-700 ${
          isDrawn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        {/* Subtitle & Badge Block (CSS Selector 2) */}
        <div className="w-full flex flex-col items-center justify-center text-center space-y-1.5">
          {/* Upper badge (CSS Selector 3) */}
          <div className="inline-flex items-center justify-center text-xs uppercase font-bold tracking-[0.16em] mr-[-0.16em] text-slate-400 select-none text-center">
            Learning OS · Первоначальный запуск
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto text-center leading-relaxed font-normal">
            Интеллектуальная среда прикладного обучения
          </p>
        </div>

        {/* Start Action Button (CSS Selector 1) */}
        <div className="pt-1 w-full flex items-center justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStart();
            }}
            className="w-auto px-8 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs tracking-wide shadow-lg shadow-slate-900/15 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
          >
            <span>Начать настройку</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-mono pt-1 text-center">
          Нажмите в любом месте или клавишу пробел
        </div>
      </div>
    </div>
  );
};
