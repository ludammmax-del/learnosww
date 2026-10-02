import React, { useState } from 'react';
import { 
  Code2, 
  Terminal, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles, 
  ArrowRight, 
  Flame, 
  Layers, 
  Check, 
  RefreshCw, 
  Zap, 
  AlertTriangle,
  Play
} from 'lucide-react';
import { PracticalExercise } from '../../types.ts';
import { playChime } from '../../utils/audio.ts';
import { executionSandbox, ExecutionOutput } from '../../services/executionSandbox.ts';
import { epistemicLedgerService } from '../../services/epistemicLedgerService.ts';
import { telemetryEngine } from '../../services/telemetryEngine.ts';

interface PracticalExercisesPanelProps {
  exercises: PracticalExercise[];
  unitTitle: string;
  onAdvanceToQuiz?: () => void;
}

export const PracticalExercisesPanel: React.FC<PracticalExercisesPanelProps> = ({
  exercises,
  unitTitle,
  onAdvanceToQuiz,
}) => {
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});
  const [verifiedAnswers, setVerifiedAnswers] = useState<Record<string, {
    passed: boolean;
    unavailable?: boolean;
    output?: ExecutionOutput;
    feedback?: string;
  }>>({});
  const [isEvaluating, setIsEvaluating] = useState(false);

  const activeExercise = exercises[activeTabIdx] || exercises[0];

  if (!activeExercise) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
        <p className="text-slate-500 text-xs">Практические задания для этого блока подготавливаются...</p>
      </div>
    );
  }

  const handleVerify = async (exId: string) => {
    const input = userInputs[exId] || '';
    if (!input.trim()) return;

    setIsEvaluating(true);
    playChime('click');

    try {
      // 1. If input contains code or functions, execute in sandboxed environment
      const hasCode = input.includes('function') || input.includes('const ') || input.includes('let ') || input.includes('=>') || input.includes('return ') || input.includes('assert') || input.includes('def ') || input.includes('import ');
      let execOutput: ExecutionOutput | undefined = undefined;

      if (hasCode) {
        execOutput = await executionSandbox.executeCode(input);
      }

      // 2. Request deep semantic analysis from Vertex AI backend
      const res = await fetch('/api/gemini/analyze-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: activeExercise.title,
          code: input,
          filename: 'student-submission.txt',
          requirements: [
            activeExercise.taskPrompt,
            activeExercise.scenario,
            activeExercise.solutionExplanation,
          ].join('\n'),
          businessScenario: activeExercise.scenario,
          fileType: 'text',
        }),
      });

      if (!res.ok) throw new Error(`Exercise evaluation failed: ${res.status}`);
      const data = await res.json();
      const isPassed = data.passed === true && data.score >= 70;

      setVerifiedAnswers(prev => ({
        ...prev,
        [exId]: {
          passed: isPassed,
          output: execOutput,
          feedback: data.productionAdvice || data.summary || (isPassed ? 'Решение прошло проверку.' : 'Проверьте решение по замечаниям.'),
        },
      }));

      if (isPassed) {
        playChime('success');
        if (!completedIds.includes(exId)) {
          setCompletedIds(prev => [...prev, exId]);
          epistemicLedgerService.recordCompletedExercise({
            unitId: 'unit-active',
            unitTitle,
            exerciseId: exId,
            exerciseTitle: activeExercise.title,
            score: data.score,
          });
          telemetryEngine.recordSignal({
            type: 'remediation_success',
            severity: 'low',
            subtopic: activeExercise.title,
            details: `Практический тренажер «${activeExercise.title}» пройден.`,
          });
        }
      } else {
        playChime('alert');
      }
    } catch (err) {
      console.warn('Exercise verification notice:', err);
      setVerifiedAnswers(prev => ({
        ...prev,
        [exId]: {
          passed: false,
          unavailable: true,
          output: undefined,
          feedback: 'Проверка сейчас недоступна. Ответ сохранен в поле, но не засчитан; повторите отправку позже.',
        },
      }));
      playChime('alert');
    } finally {
      setIsEvaluating(false);
    }
  };

  const getExerciseBadge = (type: PracticalExercise['type']) => {
    switch (type) {
      case 'experiment':
        return { label: '🧪 Интерактивный краш-тест', color: 'bg-purple-50 text-purple-800 border-purple-200' };
      case 'defect_hunt':
        return { label: '🔍 Поиск скрытого дефекта', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'tradeoff':
        return { label: '⚖️ Инженерный компромисс', color: 'bg-sky-50 text-sky-800 border-sky-200' };
      default:
        return { label: '💻 Прикладное задание', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Exercise Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-md bg-purple-100 text-purple-700">
              <Zap className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              Интерактивный лабораторный тренажер
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            3 прикладных задания по теме «{unitTitle}» с мгновенной верификацией
          </p>
        </div>

        {/* Segmented Exercise Switcher */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {exercises.map((ex, idx) => {
            const isDone = completedIds.includes(ex.id);
            const isActive = activeTabIdx === idx;
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => {
                  setActiveTabIdx(idx);
                  playChime('click');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Задание {idx + 1}</span>
                {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Exercise Card */}
      <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-4 animate-fade-in">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-0.5 rounded-md border text-[11px] font-bold ${getExerciseBadge(activeExercise.type).color}`}>
                {getExerciseBadge(activeExercise.type).label}
              </span>
              {completedIds.includes(activeExercise.id) && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center space-x-1">
                  <Check className="w-3 h-3" />
                  <span>Выполнено</span>
                </span>
              )}
            </div>
            <h4 className="text-sm font-bold text-slate-900 mt-1.5">
              {activeExercise.title}
            </h4>
          </div>
        </div>

        {/* Real-world Scenario Callout */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/90 text-xs text-slate-700 space-y-1">
          <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
            Производственный контекст:
          </span>
          <p className="leading-relaxed font-sans">{activeExercise.scenario}</p>
        </div>

        {/* Starter Snippet / Code block if available */}
        {activeExercise.starterSnippet && (
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-700">Исходные вводные / Фрагмент кода:</span>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto select-text leading-relaxed">
              <code>{activeExercise.starterSnippet}</code>
            </pre>
          </div>
        )}

        {/* Task Prompt */}
        <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-xl text-xs text-purple-950 flex items-start space-x-2">
          <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Что требуется сделать:</span>
            <p className="leading-relaxed opacity-95">{activeExercise.taskPrompt}</p>
          </div>
        </div>

        {/* Interactive Solution Draft Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-800">
              Ваше инженерное решение или гипотеза:
            </label>
            {activeExercise.hint && (
              <button
                type="button"
                onClick={() => setRevealedHints(prev => ({ ...prev, [activeExercise.id]: !prev[activeExercise.id] }))}
                className="text-[11px] text-sky-700 hover:text-sky-900 flex items-center space-x-1 cursor-pointer font-medium"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{revealedHints[activeExercise.id] ? 'Скрыть подсказку' : 'Показать подсказку первоисточника'}</span>
              </button>
            )}
          </div>

          {revealedHints[activeExercise.id] && activeExercise.hint && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-2 animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span><strong>Подсказка:</strong> {activeExercise.hint}</span>
            </div>
          )}

          <textarea
            value={userInputs[activeExercise.id] || ''}
            onChange={(e) => setUserInputs({ ...userInputs, [activeExercise.id]: e.target.value })}
            placeholder="Опишите ваше решение, предложенный код или укажите точную причину аномалии..."
            className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-sans focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 select-text transition"
          />
        </div>

        {/* Verification & Detailed Explanation */}
        {verifiedAnswers[activeExercise.id] && (
          <div className={`p-4 rounded-xl border space-y-2.5 animate-fade-in ${
            verifiedAnswers[activeExercise.id].passed
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : 'bg-amber-50/80 border-amber-200 text-amber-950'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 font-bold">
                {verifiedAnswers[activeExercise.id].passed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-900">Решение прошло проверку</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-amber-900">
                      {verifiedAnswers[activeExercise.id].unavailable ? 'Решение не проверено' : 'Требуется корректировка решения'}
                    </span>
                  </>
                )}
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                verifiedAnswers[activeExercise.id].passed ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
              }`}>
                {verifiedAnswers[activeExercise.id].passed ? '✓ Зачёт' : verifiedAnswers[activeExercise.id].unavailable ? 'Не проверено' : 'Доработка'}
              </span>
            </div>

            {verifiedAnswers[activeExercise.id].feedback && (
              <p className="text-xs leading-relaxed opacity-95">
                <strong>Вердикт:</strong> {verifiedAnswers[activeExercise.id].feedback}
              </p>
            )}

            {verifiedAnswers[activeExercise.id].output && verifiedAnswers[activeExercise.id].output!.logs.length > 0 && (
              <div className="p-2.5 bg-slate-900 text-slate-100 rounded-lg font-mono text-[10px] space-y-1">
                <div className="text-slate-400 font-bold">Логи выполнения песочницы:</div>
                {verifiedAnswers[activeExercise.id].output!.logs.map((log, lIdx) => (
                  <div key={lIdx} className={log.type === 'error' ? 'text-rose-400' : 'text-emerald-400'}>
                    [{log.type.toUpperCase()}] {log.text}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-slate-200/60 text-xs">
              <strong>Эталонный академический разбор:</strong> {activeExercise.solutionExplanation}
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
          <span className="text-[11px] text-slate-500 font-mono">
            Прогресс тренажера: {completedIds.length} из {exercises.length} выполнено
          </span>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleVerify(activeExercise.id)}
              disabled={isEvaluating || !(userInputs[activeExercise.id] || '').trim()}
              className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs transition disabled:opacity-40 flex items-center space-x-1.5 cursor-pointer"
            >
              {isEvaluating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Верификация в песочнице...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Проверить решение (Песочница + ИИ)</span>
                </>
              )}
            </button>

            {activeTabIdx < exercises.length - 1 ? (
              <button
                type="button"
                onClick={() => {
                  setActiveTabIdx(activeTabIdx + 1);
                  playChime('click');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition cursor-pointer flex items-center space-x-1"
              >
                <span>Следующее задание</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            ) : onAdvanceToQuiz ? (
              <button
                type="button"
                onClick={onAdvanceToQuiz}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 shadow-xs"
              >
                <span>Перейти к экспресс-тесту</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
