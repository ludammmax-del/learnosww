import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Sparkles, 
  ShieldAlert, 
  EyeOff, 
  CheckCircle2, 
  RotateCcw, 
  Check, 
  AlertTriangle,
  Lightbulb,
  FileEdit,
  Send,
  Clock,
  CheckCheck,
  Target,
  BarChart3,
  HelpCircle
} from 'lucide-react';
import { playChime } from '../../utils/audio.ts';
import { LearningUnit } from '../../types.ts';

interface BlankPageChallengePanelProps {
  unit: LearningUnit;
  onPassed: (retentionScore: number) => void;
  onNeedReview: (missingPoints: string[]) => void;
}

export const BlankPageChallengePanel: React.FC<BlankPageChallengePanelProps> = ({
  unit,
  onPassed,
  onNeedReview
}) => {
  const [submissionMode, setSubmissionMode] = useState<'text_schema' | 'code_skeleton' | 'bullet_invariants'>('text_schema');
  const [userSubmission, setUserSubmission] = useState('');
  const [secondsActive, setSecondsActive] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [inputWarning, setInputWarning] = useState<string | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<{
    score: number; // 0..100
    isPassed: boolean;
    evaluationStatus?: 'verified' | 'unavailable';
    verdict: string;
    strengths: string[];
    missedInvariants: string[];
    feedback: string;
    recommendation: string;
    rubricBreakdown?: {
      conceptualAccuracy: number;
      invariantsCoverage: number;
      causalMechanics: number;
      boundaryAwareness: number;
    };
  } | null>(null);

  // Timer to measure recall latency
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && !evaluationResult) {
      interval = setInterval(() => {
        setSecondsActive((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, evaluationResult]);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleEvaluateSubmission = async () => {
    if (!userSubmission.trim() || userSubmission.trim().length < 15) {
      setInputWarning('Пожалуйста, опишите ключевые инварианты темы своими словами или схемой (минимум 15 символов).');
      return;
    }
    setInputWarning(null);

    setIsEvaluating(true);
    setIsTimerRunning(false);
    playChime('click');

    try {
      const res = await fetch('/api/gemini/evaluate-blank-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId: unit.id,
          unitTitle: unit.title,
          category: unit.category,
          unitTheory: unit.summaryMarkdown,
          userSubmission,
          submissionMode,
          timeSpentSeconds: secondsActive
        })
      });

      if (!res.ok) throw new Error(`Blank page evaluation failed: ${res.status}`);
      const data = await res.json();
      if (data.evaluationStatus === 'unavailable') throw new Error('Evaluation provider unavailable');
      setEvaluationResult({ ...data, evaluationStatus: 'verified' });
      if (data.isPassed === true && data.score >= 70) {
        playChime('success');
        onPassed(data.score);
      } else {
        playChime('alert');
        if (data.missedInvariants && data.missedInvariants.length > 0) {
          onNeedReview(data.missedInvariants);
        }
      }
    } catch (err) {
      console.warn('Blank page evaluation unavailable:', err);
      setEvaluationResult({
        score: 0,
        isPassed: false,
        evaluationStatus: 'unavailable',
        verdict: 'Ответ пока не оценен',
        strengths: [],
        missedInvariants: [],
        feedback: 'Сервис проверки недоступен. Ответ не засчитан и не повлияет на прогресс; попробуйте позже.',
        recommendation: 'Повторите проверку, когда сервис снова станет доступен.',
      });
      playChime('alert');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleRetry = () => {
    setUserSubmission('');
    setEvaluationResult(null);
    setSecondsActive(0);
    setIsTimerRunning(true);
    playChime('click');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner: Anti-Fluency Shield */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <EyeOff className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                  Слепой тест чистого листа (Anti-Fluency Shield)
                </h3>
                <span className="text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full font-medium border border-rose-200/60">
                  Строгая ИИ-проверка
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Конспект скрыт. ИИ-экзаменатор проверяет не длину текста, а <strong>глубину понимания инвариантов, причинно-следственные связи и граничные условия</strong> без шпаргалок.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs shrink-0 self-start sm:self-auto">
            <Clock className="w-4 h-4 text-slate-400" />
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Время вспоминания</div>
              <div className="font-mono text-sm font-bold text-slate-800">{formatSeconds(secondsActive)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Test Workspace Area */}
      {!evaluationResult ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Format Selector Bar */}
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
              <FileEdit className="w-4 h-4 text-slate-500" />
              <span>Формат реконструкции по памяти:</span>
            </div>

            <div className="flex items-center bg-slate-200/70 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setSubmissionMode('text_schema')}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  submissionMode === 'text_schema'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Логическая схема / Тезисы
              </button>
              <button
                type="button"
                onClick={() => setSubmissionMode('bullet_invariants')}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  submissionMode === 'bullet_invariants'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Инварианты и правила
              </button>
              <button
                type="button"
                onClick={() => setSubmissionMode('code_skeleton')}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  submissionMode === 'code_skeleton'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Каркас кода / Формулы
              </button>
            </div>
          </div>

          {/* Prompt & Instruction */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <div className="text-xs font-medium text-slate-700 flex items-center space-x-2">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                <strong>Задание на слепое извлечение:</strong> Объясните ключевой принцип темы «{unit.title}». Опишите, из каких сущностей/шагов состоит процесс, каковы граничные условия и почему система работает именно так.
              </span>
            </div>
          </div>

          {/* Pure Blank Textarea */}
          <div className="p-5">
            {inputWarning && (
              <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center space-x-2 animate-fade-in">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{inputWarning}</span>
              </div>
            )}

            <textarea
              id="blank-page-input"
              value={userSubmission}
              onChange={(e) => {
                setUserSubmission(e.target.value);
                if (inputWarning && e.target.value.trim().length >= 15) {
                  setInputWarning(null);
                }
              }}
              placeholder={
                submissionMode === 'code_skeleton'
                  ? `// Напишите по памяти ключевую сигнатуру, структуру данных или формулу для «${unit.title}»\nfunction solveInvariant(...) {\n  // ...\n}`
                  : submissionMode === 'bullet_invariants'
                  ? `1. Главный закон темы: ...\n2. Что обязательно должно соблюдаться: ...\n3. Главный риск или ошибка новичков: ...`
                  : `Опишите своими словами без шпаргалок ключевой механизм «${unit.title}»: что это, зачем нужно, из чего состоит и как применяется на практике...`
              }
              rows={9}
              className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50/40 text-slate-900 text-sm font-mono leading-relaxed focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-hidden transition resize-y"
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-500 flex items-center space-x-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                <span>ИИ оценивает понимание сути, а не количество слов (порог сдачи: 70/100)</span>
              </div>

              <button
                type="button"
                id="btn-submit-blank-page"
                onClick={handleEvaluateSubmission}
                disabled={isEvaluating}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white transition shadow-xs hover:shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isEvaluating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>ИИ-экзаменатор проверяет инварианты...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Отправить на слепую проверку ИИ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Evaluation Results Panel */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center space-x-3.5">
              <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold text-white shadow-xs ${
                evaluationResult.isPassed ? 'bg-emerald-600' : 'bg-amber-500'
              }`}>
                <span className="text-lg leading-none">{evaluationResult.score}</span>
                <span className="text-[10px] uppercase tracking-wider font-semibold opacity-80">из 100</span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-base font-bold text-slate-900">{evaluationResult.verdict}</h4>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    evaluationResult.isPassed 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {evaluationResult.isPassed ? 'Зачет (Тест пройден)' : 'Требуется доработка'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Оценка интеллектуальной реконструкции темы без подсказок
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleRetry}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer flex items-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Повторить слепой тест</span>
              </button>
            </div>
          </div>

          {/* Rubric Breakdown Progress Indicators */}
          {evaluationResult.rubricBreakdown && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center space-x-1.5">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  <span>Критерии рубрики ИИ-экзаменатора:</span>
                </span>
                <span className="text-slate-500 font-normal text-[11px]">Порог сдачи: 70 баллов</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Концептуальная суть</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">
                    {evaluationResult.rubricBreakdown.conceptualAccuracy} / 30
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (evaluationResult.rubricBreakdown.conceptualAccuracy / 30) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Полнота инвариантов</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">
                    {evaluationResult.rubricBreakdown.invariantsCoverage} / 30
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (evaluationResult.rubricBreakdown.invariantsCoverage / 30) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Причинно-следственная связь</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">
                    {evaluationResult.rubricBreakdown.causalMechanics} / 25
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="bg-amber-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (evaluationResult.rubricBreakdown.causalMechanics / 25) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-2xs">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Границы и риски</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">
                    {evaluationResult.rubricBreakdown.boundaryAwareness} / 15
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="bg-rose-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (evaluationResult.rubricBreakdown.boundaryAwareness / 15) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feedback & Invariants Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
              <div className="text-xs font-bold text-emerald-900 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Успешно воспроизведено по памяти:</span>
              </div>
              <ul className="text-xs text-emerald-800 space-y-1 pl-5 list-disc">
                {evaluationResult.strengths.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            <div className={`p-4 rounded-xl border space-y-2 ${
              evaluationResult.missedInvariants.length > 0 
                ? 'bg-amber-50/70 border-amber-200/80 text-amber-900' 
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="text-xs font-bold flex items-center space-x-1.5">
                <AlertTriangle className={`w-4 h-4 ${evaluationResult.missedInvariants.length > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
                <span>Упущенные законы / Пробелы:</span>
              </div>
              {evaluationResult.missedInvariants.length > 0 ? (
                <ul className="text-xs space-y-1 pl-5 list-disc text-amber-800">
                  {evaluationResult.missedInvariants.map((m, idx) => (
                    <li key={idx}>{m}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">Все ключевые инварианты темы охвачены полностью.</p>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
              <Brain className="w-4 h-4 text-purple-600" />
              <span>Рецензия экзаменатора (Сократовский анализ):</span>
            </div>
            <p className="leading-relaxed text-slate-800">{evaluationResult.feedback}</p>
            
            {/* Socratic Scaffolding Prompt: effortful retrieval instead of giving away raw answer */}
            {!evaluationResult.isPassed && evaluationResult.missedInvariants.length > 0 && (
              <div className="mt-3 p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-950 space-y-2">
                <div className="font-bold text-xs flex items-center space-x-1.5 text-amber-900">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Сократовский наводящий вопрос для закрепления:</span>
                </div>
                <p className="text-xs text-amber-900/90 leading-relaxed font-medium">
                  Задумайтесь: если убрать предположение о «{evaluationResult.missedInvariants[0]}», как изменится поведение всей системы? Что произойдет в нештатной ситуации?
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEvaluationResult(null);
                      setIsTimerRunning(true);
                      playChime('click');
                    }}
                    className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs tracking-wide shadow-2xs transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Дополнить и исправить ответ (+ вторая попытка)</span>
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200/60 flex items-center space-x-2 text-slate-600">
              <Target className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="font-semibold text-slate-800">Следующий шаг:</span>
              <span>{evaluationResult.recommendation}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

