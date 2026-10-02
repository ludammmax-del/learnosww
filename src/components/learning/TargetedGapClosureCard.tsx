import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Check, 
  HelpCircle, 
  Flame, 
  Layers, 
  Zap, 
  Activity,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { TargetedGapClosureBlock } from '../../types.ts';
import { playChime } from '../../utils/audio.ts';
import { telemetryEngine } from '../../services/telemetryEngine.ts';

interface TargetedGapClosureCardProps {
  block: TargetedGapClosureBlock;
  onResolved: (gapId: string, subtopic: string) => void;
  onClose?: () => void;
}

export const TargetedGapClosureCard: React.FC<TargetedGapClosureCardProps> = ({
  block,
  onResolved,
  onClose,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const [activeModelTab, setActiveModelTab] = useState<'bad' | 'good' | 'matrix'>('matrix');
  const [reflection, setReflection] = useState('');
  const [attempts, setAttempts] = useState(0);

  const selectedOption = block.surgicalChallenge.options.find((o) => o.id === selectedOptionId);
  const isCorrect = selectedOption?.isCorrect ?? false;
  const hasMeaningfulReflection = reflection.trim().length >= 20;

  const handleVerifyAnswer = () => {
    if (!selectedOption) return;
    setIsAnswerChecked(true);
    setAttempts((prev) => prev + 1);

    if (selectedOption.isCorrect) {
      setIsResolved(true);
      setReflection('');
      playChime('success');
    } else {
      setReflection('');
      playChime('alert');
      telemetryEngine.recordSignal({
        type: 'test_error',
        severity: 'high',
        subtopic: block.targetSubtopic,
        details: `Повторная попытка в блоке ликвидации пробела: выбран вариант «${selectedOption.text.slice(0, 40)}...»`,
      });
    }
  };

  const handleResetChallenge = () => {
    setSelectedOptionId(null);
    setIsAnswerChecked(false);
    setIsResolved(false);
    setReflection('');
    playChime('click');
  };

  const handleFinalizeGapResolution = () => {
    if (!hasMeaningfulReflection || !selectedOption?.isCorrect) return;
    telemetryEngine.markGapResolved(block.id, block.targetSubtopic);
    onResolved(block.id, block.targetSubtopic);
  };

  return (
    <div className="rounded-3xl border-2 border-amber-500/40 bg-gradient-to-b from-amber-50/50 via-white to-orange-50/30 p-6 md:p-8 shadow-xl space-y-6 relative overflow-hidden animate-fade-in">
      {/* Background Decorative Accent */}
      <div className="absolute -right-16 -top-16 w-56 h-56 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-orange-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner & Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-amber-200/70 pb-4 relative z-10">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[11px] uppercase tracking-wider flex items-center space-x-1.5 shadow-xs animate-pulse">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Адресная ликвидация пробела</span>
            </span>
            <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-300">
              +{block.karmaBonus} XP Karma
            </span>
          </div>

          <h3 className="text-lg md:text-xl font-black text-slate-900 leading-tight">
            {block.targetSubtopic}
          </h3>

          <p className="text-xs text-amber-900/80 flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span><strong>Сигнал телеметрии:</strong> {block.telemetryEvidenceSummary}</span>
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1 rounded-md transition cursor-pointer"
          >
            ✕ Свернуть
          </button>
        )}
      </div>

      {/* STEP 1: Mental Trap Deconstruction */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        {/* Trap */}
        <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200/80 space-y-2">
          <div className="flex items-center space-x-2 text-rose-900 font-bold text-xs">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Ловушка мышления (Что вам показалось)</span>
          </div>
          <p className="text-xs text-rose-950/90 font-medium leading-relaxed">
            «{block.confusionDiagnosis.mentalModelTrap}»
          </p>
          <p className="text-[11px] text-rose-800/80 leading-relaxed">
            {block.confusionDiagnosis.rootCause}
          </p>
        </div>

        {/* Reality */}
        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Как система работает в реальности</span>
          </div>
          <p className="text-xs text-emerald-950 font-medium leading-relaxed">
            {block.confusionDiagnosis.whyItHappens}
          </p>
        </div>
      </div>

      {/* STEP 2: Interactive Visual Model / Comparison Matrix */}
      <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4 shadow-md relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold">
              Микро-модель для понимания
            </span>
            <h4 className="text-sm font-bold text-slate-100">{block.visualModel.title}</h4>
          </div>

          {/* Switcher */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveModelTab('matrix')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                activeModelTab === 'matrix' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Сравнение
            </button>
            <button
              type="button"
              onClick={() => setActiveModelTab('bad')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                activeModelTab === 'bad' ? 'bg-rose-500 text-white font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Ошибочный код
            </button>
            <button
              type="button"
              onClick={() => setActiveModelTab('good')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                activeModelTab === 'good' ? 'bg-emerald-500 text-white font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Правильный код
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {block.visualModel.description}
        </p>

        {/* Matrix Grid */}
        {(activeModelTab === 'matrix' || activeModelTab === 'bad') && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between text-rose-300 font-bold">
              <span>✕ {block.visualModel.badApproach.label}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-900/60 text-rose-200">Seq Scan / Overhead</span>
            </div>
            <pre className="bg-slate-950/80 p-2.5 rounded-lg text-[11px] text-rose-200 overflow-x-auto">
              {block.visualModel.badApproach.codeOrConcept}
            </pre>
            <p className="text-[11px] text-rose-300 font-sans">
              <strong>Последствие:</strong> {block.visualModel.badApproach.consequence}
            </p>
          </div>
        )}

        {(activeModelTab === 'matrix' || activeModelTab === 'good') && (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between text-emerald-300 font-bold">
              <span>✓ {block.visualModel.goodApproach.label}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200">Index Scan / Production</span>
            </div>
            <pre className="bg-slate-950/80 p-2.5 rounded-lg text-[11px] text-emerald-200 overflow-x-auto">
              {block.visualModel.goodApproach.codeOrConcept}
            </pre>
            <p className="text-[11px] text-emerald-300 font-sans">
              <strong>Эффект:</strong> {block.visualModel.goodApproach.consequence}
            </p>
          </div>
        )}

        {/* Golden Rule Anchor */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-400/40 flex items-start space-x-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200 font-sans">
            <strong className="text-amber-300">Золотое правило инженера:</strong>{' '}
            <span>{block.visualModel.ruleOfThumb}</span>
          </div>
        </div>
      </div>

      {/* STEP 3: Surgical 1-Step Validation Challenge */}
      <div className="p-5 rounded-2xl bg-white border border-amber-200 shadow-sm space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-slate-900 text-amber-300 font-bold text-xs flex items-center justify-center">
              ?
            </span>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Хирургическая экспресс-проверка (1 вопрос)
            </h4>
          </div>
          <span className="text-[11px] text-slate-500">
            Только для подтверждения закрытия нюанса
          </span>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-800 space-y-1">
          <div className="font-bold text-slate-900">Сценарий:</div>
          <p className="leading-relaxed">{block.surgicalChallenge.scenario}</p>
        </div>

        <p className="text-xs font-bold text-slate-900">
          {block.surgicalChallenge.question}
        </p>

        {/* Options */}
        <div className="space-y-2">
          {block.surgicalChallenge.options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            let optStyle = 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800';

            if (isAnswerChecked) {
              if (opt.isCorrect) {
                optStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold shadow-xs';
              } else if (isSelected && !opt.isCorrect) {
                optStyle = 'bg-rose-50 border-rose-500 text-rose-950';
              }
            } else if (isSelected) {
              optStyle = 'bg-slate-900 text-white border-slate-900 font-medium shadow-xs';
            }

            return (
              <div
                key={opt.id}
                onClick={() => {
                  if (isResolved) return;
                  setSelectedOptionId(opt.id);
                  setIsAnswerChecked(false);
                  playChime('click');
                }}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between text-xs ${optStyle}`}
              >
                <div className="flex items-center space-x-2.5">
                  <input
                    type="radio"
                    name={`gap-challenge-${block.id}`}
                    checked={isSelected}
                    onChange={() => {
                      if (isResolved) return;
                      setSelectedOptionId(opt.id);
                      setIsAnswerChecked(false);
                    }}
                    className="text-slate-900"
                  />
                  <span>{opt.text}</span>
                </div>

                {isAnswerChecked && opt.isCorrect && (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                )}
              </div>
            );
          })}
        </div>

        {/* Explanations after check */}
        {isAnswerChecked && selectedOption && (
          <div className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-1 animate-fade-in ${
            selectedOption.isCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}>
            <div className="font-bold flex items-center space-x-1.5">
              {selectedOption.isCorrect ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Идеально! Нюанс усвоен на 100%.</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Не совсем так:</span>
                </>
              )}
            </div>
            <p>{selectedOption.explanation}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          {!isResolved ? (
            <div className="flex items-center space-x-2 w-full justify-between">
              {isAnswerChecked && !isCorrect && (
                <button
                  type="button"
                  onClick={handleResetChallenge}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Попробовать снова</span>
                </button>
              )}

              <div className="ml-auto">
                <button
                  type="button"
                  id="btn-verify-gap-challenge"
                  disabled={!selectedOptionId}
                  onClick={handleVerifyAnswer}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-sm transition disabled:opacity-40 flex items-center space-x-2 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-amber-300" />
                  <span>Проверить ответ</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-3 p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-950 animate-fade-in">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-xs flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Пробел полностью ликвидирован! (+{block.karmaBonus} XP)</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    {block.remediationSummary}
                  </p>
                </div>
              </div>

              <div className="space-y-2 rounded-xl bg-white/60 border border-emerald-200 p-3">
                <label className="block text-[11px] font-bold text-emerald-900 uppercase tracking-wide">
                  Сформулируйте правило своими словами
                </label>
                <textarea
                  value={reflection}
                  onChange={(event) => setReflection(event.target.value)}
                  rows={3}
                  placeholder="Например: В этом случае важно учитывать, что ... потому что ..." 
                  className="w-full resize-none rounded-xl border border-emerald-200 bg-white px-3 py-2 text-[11px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                />
                <div className="flex items-center justify-between gap-3 text-[10px] text-emerald-800">
                  <span>{attempts > 1 ? `Попыток: ${attempts}` : 'Нужна минимальная проверка понимания'}</span>
                  <span>{reflection.trim().length}/20 символов</span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  id="btn-complete-gap-closure"
                  onClick={handleFinalizeGapResolution}
                  disabled={!hasMeaningfulReflection}
                  className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:bg-emerald-500/60 disabled:cursor-not-allowed text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <span>Продолжить курс</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
