import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, ArrowRight, Play, Coffee } from 'lucide-react';
import { playChime } from '../../utils/audio.ts';

interface TeaBrewingPlanLoaderProps {
  onComplete: () => void;
  onLaunchFirstUnit?: () => void;
  targetDomain?: string;
  isServerFinished: boolean;
  totalBlocks?: number;
  trackScope?: 'full_course' | 'single_topic';
  singleTopicTarget?: string;
}

const STAGES = [
  { progress: 8, text: 'Проверка вводной анкеты: диагностика исходного уровня и целей...' },
  { progress: 16, text: 'Анализ ИИ: «Ага, базу понимает — ускоряем! Тут слепая зона — добавим практику в начале!»' },
  { progress: 24, text: 'Адаптация Sprint 1: выявление 20% действий, дающих 80% мастерства' },
  { progress: 32, text: 'Модуль 1: Фундамент и деконструкция навыка на микро-привычки' },
  { progress: 42, text: 'Модуль 2: Осознанная практика (Deliberate Practice) на границе возможностей' },
  { progress: 52, text: 'Модуль 3: Метод Фейнмана — кристаллизация понимания через простое объяснение' },
  { progress: 62, text: 'Модуль 4: Мгновенная калибровка восприятия и устранение когнитивных искажений' },
  { progress: 72, text: 'Модуль 5: Практические кейсы из реальной жизни и вариативность контекста' },
  { progress: 80, text: 'Модуль 6: Парный спарринг, ролевые сессии и взаимная рецензия' },
  { progress: 88, text: 'Модуль 7: Стресс-тестирование навыка под дефицитом времени и давлением' },
  { progress: 94, text: 'Модуль 8: Интервальное повторение и перенос в долгосрочную память' },
  { progress: 97, text: 'Модуль 9: Интеграция навыка в повседневную и профессиональную деятельность' },
  { progress: 99, text: 'Модуль 10: Финальный публичный проект и демонстрация мастерства' },
  { progress: 100, text: 'Линковка связей графа (DAG) и калибровка персональной траектории' },
];

export const TeaBrewingPlanLoader: React.FC<TeaBrewingPlanLoaderProps> = ({
  onComplete,
  onLaunchFirstUnit,
  targetDomain = 'Освоение навыков и мастерство',
  isServerFinished,
  totalBlocks = 200,
  trackScope = 'full_course',
  singleTopicTarget,
}) => {
  const [currentBlockCount, setCurrentBlockCount] = useState(0);
  const [currentStageText, setCurrentStageText] = useState(STAGES[0].text);
  const [isReady, setIsReady] = useState(false);
  const hasTriggeredReadyAudio = useRef(false);

  // Smooth counter progression
  useEffect(() => {
    let interval: any;
    
    interval = setInterval(() => {
      setCurrentBlockCount((prev) => {
        // If server is finished, swiftly accelerate to totalBlocks
        if (isServerFinished) {
          if (prev >= totalBlocks) {
            clearInterval(interval);
            return totalBlocks;
          }
          const step = Math.max(1, Math.ceil((totalBlocks - prev) / 3));
          return Math.min(totalBlocks, prev + step);
        }

        // Before server finishes, tick up smoothly towards 85% of totalBlocks and pause
        const pauseLimit = Math.max(1, Math.floor(totalBlocks * 0.85));
        if (prev < pauseLimit) {
          const step = totalBlocks > 50 ? (prev < 50 ? 2 : prev < 120 ? 3 : 2) : 1;
          return Math.min(pauseLimit, prev + step);
        }
        return prev;
      });
    }, 70);

    return () => clearInterval(interval);
  }, [isServerFinished, totalBlocks]);

  // Update current stage text based on counter
  useEffect(() => {
    const ratio = totalBlocks > 0 ? currentBlockCount / totalBlocks : 1;
    const stageIndex = Math.min(
      STAGES.length - 1,
      Math.floor(ratio * (STAGES.length - 1))
    );
    setCurrentStageText(STAGES[stageIndex].text);

    if (currentBlockCount >= totalBlocks && isServerFinished) {
      if (!isReady) {
        setIsReady(true);
        if (!hasTriggeredReadyAudio.current) {
          hasTriggeredReadyAudio.current = true;
          playChime('success');
        }
      }
    }
  }, [currentBlockCount, totalBlocks, isServerFinished, isReady]);

  const progressPercent = totalBlocks > 0 ? Math.min(100, Math.round((currentBlockCount / totalBlocks) * 100)) : 100;
  const strokeDashoffset = 125.6 - (125.6 * progressPercent) / 100;

  return (
    <div className="min-h-[500px] h-full flex flex-col items-center justify-center p-8 select-none bg-white text-slate-800 animate-fade-in">
      <div className="max-w-md w-full mx-auto text-center space-y-6">
        
        {/* Minimalist Circular Gauge & Icon */}
        <div className="flex justify-center pt-2">
          <div className="relative w-16 h-16 flex items-center justify-center">
            {/* SVG Hairline Circular Progress */}
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 48 48">
              <circle
                cx="24"
                cy="24"
                r="20"
                className="stroke-slate-100"
                strokeWidth="2"
                fill="none"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                className={isReady ? 'stroke-slate-900 transition-all duration-300' : 'stroke-slate-900 transition-all duration-150'}
                strokeWidth="2"
                strokeDasharray="125.6"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              {!isReady ? (
                <Coffee className="w-5 h-5 text-slate-700 stroke-[1.5] animate-pulse" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-slate-900 stroke-[1.75]" />
              )}
            </div>
          </div>
        </div>

        {/* Quiet Editorial Typography */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            {trackScope === 'single_topic' && singleTopicTarget
              ? `Микро-трек: ${singleTopicTarget}`
              : targetDomain}
          </div>
          <h2 className="text-xl font-medium tracking-tight text-slate-900">
            {!isReady ? 'Формирование персональной программы' : 'Программа обучения готова'}
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            {!isReady
              ? (trackScope === 'single_topic'
                  ? `Пока заваривается чай, ИИ рассчитывает необходимое число практических квантов для закрытия темы «${singleTopicTarget || targetDomain}».`
                  : 'Пока заваривается чай, ИИ компонует практические блоки без воды под ваш стек.')
              : (trackScope === 'single_topic'
                  ? `${totalBlocks} сфокусированных квантов объединены в персональный микро-трек (DAG-граф) по расчету ИИ.`
                  : `${totalBlocks} блоков и модулей объединены в направленный граф связей (DAG).`)}
          </p>
        </div>

        {/* Progress & Live Counter */}
        <div className="pt-2 space-y-2">
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-mono text-[11px] text-slate-400">
              {isReady ? 'Завершено' : 'Синтез блоков'}
            </span>
            <span className="font-mono text-xs font-medium text-slate-800 tabular-nums">
              {currentBlockCount} <span className="text-slate-400 font-normal">/ {totalBlocks}</span>
            </span>
          </div>

          {/* Hairline 2px progress bar */}
          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-900 transition-all duration-150 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Quiet status line */}
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 pt-0.5 truncate text-left">
            {!isReady && (
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 animate-pulse" />
            )}
            <span className="truncate">{currentStageText}</span>
          </div>
        </div>

        {/* Minimalist Action Controls on Ready */}
        {isReady && (
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-2.5 animate-fade-in">
            <button
              type="button"
              id="btn-open-dag-from-tea"
              onClick={onComplete}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-medium transition-colors shadow-2xs flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
            >
              <span>Посмотреть граф ({totalBlocks} блоков)</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {onLaunchFirstUnit && (
              <button
                type="button"
                id="btn-launch-first-unit-from-tea"
                onClick={() => {
                  onComplete();
                  onLaunchFirstUnit();
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Play className="w-3 h-3 text-slate-600 fill-current" />
                <span>Начать Квант 1.1</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

