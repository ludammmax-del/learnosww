import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Flame, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  X, 
  ArrowRight, 
  Clock, 
  TrendingUp, 
  HelpCircle,
  Zap,
  Activity,
  Award,
  ChevronRight,
  ShieldCheck,
  Snowflake
} from 'lucide-react';
import { MemoryNodeRetention, spacedRepetition } from '../../services/spacedRepetitionService.ts';
import { playChime } from '../../utils/audio.ts';
import { LearningUnit } from '../../types.ts';

interface SpacedRepetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetNodeId?: string | null;
  units: Record<string, LearningUnit>;
  onRefreshCompleted?: (nodeId: string, newRetention: number) => void;
  onAddKarma?: (xp: number) => void;
}

interface BlitzQuestion {
  id: string;
  topicTitle: string;
  question: string;
  scenario?: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
  }>;
  coreRuleSummary: string;
}

export const SpacedRepetitionModal: React.FC<SpacedRepetitionModalProps> = ({
  isOpen,
  onClose,
  targetNodeId,
  units,
  onRefreshCompleted,
  onAddKarma,
}) => {
  const [selectedNode, setSelectedNode] = useState<MemoryNodeRetention | null>(null);
  const [dueList, setDueList] = useState<MemoryNodeRetention[]>([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<'easy' | 'good' | 'hard' | 'forgot' | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [questions, setQuestions] = useState<BlitzQuestion[]>([]);

  // Load target or urgent node
  useEffect(() => {
    if (!isOpen) return;

    const all = Array.from(spacedRepetition.getAllNodeRetentions().values());
    const sorted = [...all].sort((a, b) => a.retentionPercentage - b.retentionPercentage);
    setDueList(sorted);

    let chosen: MemoryNodeRetention | null = null;
    if (targetNodeId) {
      chosen = spacedRepetition.getNodeRetention(targetNodeId);
    }
    if (!chosen && sorted.length > 0) {
      chosen = sorted[0];
    }
    if (!chosen) {
      setSelectedNode(null);
      setQuestions([]);
      setIsFinished(false);
      return;
    }

    setSelectedNode(chosen);
    generateQuestionsForTopic(chosen);
    setActiveQuestionIndex(0);
    setSelectedOptionId(null);
    setIsAnswerSubmitted(false);
    setSelectedGrade(null);
    setIsFinished(false);
  }, [isOpen, targetNodeId, units]);

  const generateQuestionsForTopic = (node: MemoryNodeRetention) => {
    const unitQuiz = units[node.unitId]?.quiz || [];
    setQuestions(unitQuiz.map((question) => ({
      id: question.id,
      topicTitle: node.topicTitle,
      question: question.question,
      scenario: question.scenario,
      options: question.options,
      coreRuleSummary: question.explanation,
    })));
  };

  const handleSelectOption = (optId: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOptionId(optId);
    playChime('click');
  };

  const handleSubmitAnswer = () => {
    if (!selectedOptionId || isAnswerSubmitted) return;
    setIsAnswerSubmitted(true);
    const currQ = questions[activeQuestionIndex];
    const chosen = currQ.options.find((o) => o.id === selectedOptionId);
    if (chosen?.isCorrect) {
      playChime('success');
      setSelectedGrade('good');
    } else {
      playChime('alert');
      setSelectedGrade('hard');
    }
  };

  const handleCompleteGrade = (grade: 'easy' | 'good' | 'hard' | 'forgot') => {
    if (!selectedNode) return;
    playChime('success');
    const actualGrade = selectedGrade === 'hard' ? 'forgot' : grade;
    const updated = spacedRepetition.recordReview(selectedNode.nodeId, actualGrade);
    setSelectedNode(updated);

    if (activeQuestionIndex < questions.length - 1) {
      setActiveQuestionIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setIsAnswerSubmitted(false);
      setSelectedGrade(null);
    } else {
      setIsFinished(true);
      const earnedXp = selectedGrade === 'hard' ? 0 : grade === 'easy' ? 80 : grade === 'good' ? 60 : 20;
      if (earnedXp > 0) onAddKarma?.(earnedXp);
      onRefreshCompleted?.(selectedNode.nodeId, updated.retentionPercentage);
    }
  };

  if (!isOpen) return null;

  const currentQ = questions[activeQuestionIndex];
  const selectedOpt = currentQ?.options.find((o) => o.id === selectedOptionId);
  const retentionPct = selectedNode?.retentionPercentage ?? 0;
  const isCold = retentionPct < 50;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-sky-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-slate-900">
                  Интервальное повторение памяти
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Кривая Эббингауза
                </span>
              </div>
              <p className="text-xs text-slate-500">
                2-минутный экспресс-блиц для закрепления знаний в долговременной памяти
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Memory Health Metric Bar */}
        <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    {selectedNode ? (
                      <>
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Текущий уровень удержания:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded-md flex items-center space-x-1 ${
                retentionPct >= 85
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : retentionPct >= 60
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : retentionPct >= 40
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
              }`}
            >
              {retentionPct >= 85 ? (
                <Flame className="w-3.5 h-3.5 text-emerald-500" />
              ) : retentionPct < 40 ? (
                <Snowflake className="w-3.5 h-3.5 text-rose-500" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-sky-500" />
              )}
              <span>{retentionPct}%</span>
            </span>
            <span className="text-slate-400 text-[11px]">
              (Повторений: {selectedNode?.repetitionCount || 1}, Интервал: {selectedNode?.stabilityDays || 2} дн.)
            </span>
          </div>
          </>
          ) : (
            <span className="text-slate-600">Истории повторений пока нет.</span>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Topic Badge */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-500/[0.06] to-indigo-500/[0.04] border border-sky-500/15 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-600 block">
                  Тема на закрепление:
                </span>
                <span className="text-xs font-bold text-slate-900 line-clamp-1">
                  {selectedNode?.topicTitle}
                </span>
              </div>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Вопрос {activeQuestionIndex + 1} из {questions.length}
            </span>
          </div>

          {!selectedNode || questions.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">Нет подготовленных вопросов для повторения</h3>
              <p className="text-xs text-slate-500">Сначала завершите урок с проверкой знаний. Повторения будут строиться по вопросам этого урока.</p>
            </div>
          ) : !isFinished ? (
            currentQ && (
              <div className="space-y-5 animate-fade-in">
                {/* Question Box */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Концептуальный экспресс-вопрос:
                  </div>
                  <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                    {currentQ.question}
                  </div>
                  {currentQ.scenario && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 leading-relaxed italic">
                      💡 Контекст: {currentQ.scenario}
                    </div>
                  )}
                </div>

                {/* Options */}
                <div className="space-y-2.5">
                  {currentQ.options.map((opt) => {
                    const isSelected = selectedOptionId === opt.id;
                    const showCorrect = isAnswerSubmitted && opt.isCorrect;
                    const showWrong = isAnswerSubmitted && isSelected && !opt.isCorrect;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption(opt.id)}
                        disabled={isAnswerSubmitted}
                        className={`w-full text-left p-3.5 rounded-2xl text-xs font-medium transition-all duration-150 flex items-start space-x-3 border ${
                          showCorrect
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-emerald-500/10 ring-1 ring-emerald-500'
                            : showWrong
                            ? 'bg-rose-50 border-rose-400 text-rose-900 ring-1 ring-rose-400'
                            : isSelected
                            ? 'bg-sky-50 border-sky-500 text-sky-900 shadow-sm ring-1 ring-sky-500'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50/80'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold mt-0.5 border ${
                            showCorrect
                              ? 'bg-emerald-500 text-white border-emerald-500'
                              : showWrong
                              ? 'bg-rose-500 text-white border-rose-500'
                              : isSelected
                              ? 'bg-sky-500 text-white border-sky-500'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {showCorrect ? '✓' : showWrong ? '✕' : opt.id.slice(-1).toUpperCase()}
                        </span>
                        <div className="flex-1 leading-relaxed">
                          <div>{opt.text}</div>
                          {isAnswerSubmitted && (
                            <div
                              className={`mt-2 pt-2 border-t text-[11px] leading-relaxed ${
                                opt.isCorrect
                                  ? 'border-emerald-200 text-emerald-800'
                                  : 'border-rose-200 text-rose-800'
                              }`}
                            >
                              {opt.explanation}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Socratic Feedback & Action bar */}
                {!isAnswerSubmitted ? (
                  <div className="pt-2 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={handleSubmitAnswer}
                      disabled={!selectedOptionId}
                      className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center space-x-2 ${
                        selectedOptionId
                          ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-md cursor-pointer'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <span>Проверить ответ</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 pt-2 animate-fade-in">
                    {/* Summary Rule Banner */}
                    <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 flex items-start space-x-2.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <span className="font-bold block text-emerald-900">
                          Ключевое правило для долгой памяти:
                        </span>
                        <span>{currentQ.coreRuleSummary}</span>
                      </div>
                    </div>

                    {/* Self-Rating for SM-2 Algorithm */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Как дался этот вопрос? (Калибровка интервала повторения)
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                          type="button"
                          onClick={() => handleCompleteGrade('easy')}
                          className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-900 font-semibold text-xs flex flex-col items-center space-y-1 transition-colors"
                        >
                          <span>🔥 Легко</span>
                          <span className="text-[10px] text-emerald-700 font-normal">Интервал x2.4</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCompleteGrade('good')}
                          className="p-2.5 rounded-xl border border-sky-200 bg-sky-50/50 hover:bg-sky-100 text-sky-900 font-semibold text-xs flex flex-col items-center space-y-1 transition-colors"
                        >
                          <span>⚡ Вспомнил</span>
                          <span className="text-[10px] text-sky-700 font-normal">Интервал x1.8</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCompleteGrade('hard')}
                          className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100 text-amber-900 font-semibold text-xs flex flex-col items-center space-y-1 transition-colors"
                        >
                          <span>⏳ С трудом</span>
                          <span className="text-[10px] text-amber-700 font-normal">Интервал x1.2</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCompleteGrade('forgot')}
                          className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-900 font-semibold text-xs flex flex-col items-center space-y-1 transition-colors"
                        >
                          <span>❄️ Забыл</span>
                          <span className="text-[10px] text-rose-700 font-normal">Сброс на 1 день</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            /* Finished Result Screen */
            <div className="py-8 text-center space-y-4 animate-scale-up">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Память успешно обновлена!
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                  Знания по теме «{selectedNode?.topicTitle}» закреплены. Коэффициент удержания восстановлен до <strong className="text-emerald-600 font-bold">{selectedNode?.retentionPercentage}%</strong>.
                </p>
              </div>

              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs shadow-2xs">
                <Award className="w-4 h-4 text-amber-600" />
                <span>+600 XP начислено за интервальную тренировку</span>
              </div>

              <div className="pt-4 flex items-center justify-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors shadow-md"
                >
                  Вернуться в ОС
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Due Topics Footer */}
        {dueList.length > 1 && !isFinished && (
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs flex items-center justify-between">
            <span className="text-slate-500 font-medium">
              Осталось тем на повторение: <strong className="text-slate-800">{dueList.filter(d => d.isDueForReview).length}</strong>
            </span>
            <div className="flex items-center space-x-1">
              {dueList.slice(0, 4).map((d) => (
                <button
                  key={d.nodeId}
                  type="button"
                  onClick={() => {
                    setSelectedNode(d);
                    generateQuestionsForTopic(d);
                    setActiveQuestionIndex(0);
                    setSelectedOptionId(null);
                    setIsAnswerSubmitted(false);
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                    selectedNode?.nodeId === d.nodeId
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {d.retentionPercentage}% {d.topicTitle.slice(0, 12)}...
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
