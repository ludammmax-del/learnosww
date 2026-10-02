import React, { useState } from 'react';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles, 
  Volume2, 
  Mic, 
  MicOff, 
  Terminal, 
  FileCode, 
  Layers, 
  Flame, 
  Check, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { executionSandbox, ExecutionOutput } from '../../services/executionSandbox.ts';
import { speechPracticeEngine, SpeechAnalysisResult } from '../../services/speechPracticeEngine.ts';
import { playChime } from '../../utils/audio.ts';

interface InteractiveVisualSandboxProps {
  unitTitle: string;
  category: string;
  summaryMarkdown?: string;
  starterCode?: string;
  defaultFilename?: string;
  onCodeSuccess?: (result: ExecutionOutput) => void;
}

export const InteractiveVisualSandbox: React.FC<InteractiveVisualSandboxProps> = ({
  unitTitle,
  category,
  summaryMarkdown,
  starterCode = '// Практический код или логика...\nconsole.log("Запуск модуля: ' + unitTitle + '");',
  defaultFilename = 'solution.ts',
  onCodeSuccess,
}) => {
  const [activeMode, setActiveMode] = useState<'interactive_code' | 'speech_practice' | 'concept_diagram'>('interactive_code');
  const [code, setCode] = useState<string>(starterCode);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [output, setOutput] = useState<ExecutionOutput | null>(null);

  // Speech practice state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [speechAnalysis, setSpeechAnalysis] = useState<SpeechAnalysisResult | null>(null);

  const isLanguageOrSpeech = category.toLowerCase().includes('язык') || 
    category.toLowerCase().includes('речь') || 
    category.toLowerCase().includes('оратор') ||
    category.toLowerCase().includes('english') ||
    category.toLowerCase().includes('speaking');

  const handleRunCode = async () => {
    setIsRunning(true);
    playChime('click');

    const result = await executionSandbox.executeCode(code);

    setOutput(result);
    setIsRunning(false);

    if (result.success) {
      playChime('success');
      if (onCodeSuccess) onCodeSuccess(result);
    } else {
      playChime('alert');
    }
  };

  const handleToggleSpeechRecording = () => {
    if (!isRecording) {
      setSpeechAnalysis(null);
      setLiveTranscript('');
      setIsRecording(true);
      playChime('click');

      const langCode = unitTitle.toLowerCase().includes('english') || category.toLowerCase().includes('english')
        ? 'en-US'
        : 'ru-RU';

      speechPracticeEngine.startListening(
        langCode,
        (text) => setLiveTranscript(text),
        (err) => {
          console.warn(err);
          setIsRecording(false);
        }
      );
    } else {
      setIsRecording(false);
      const analysis = speechPracticeEngine.stopListening();
      setSpeechAnalysis(analysis);
      playChime('success');
    }
  };

  const handleListenNativeAudio = () => {
    const textToSpeak = unitTitle || 'Пример правильного произношения и интонации';
    const langCode = unitTitle.toLowerCase().includes('english') || category.toLowerCase().includes('english')
      ? 'en-US'
      : 'ru-RU';
    speechPracticeEngine.speakReference(textToSpeak, langCode);
    playChime('click');
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 text-white overflow-hidden shadow-xl select-none flex flex-col my-3">
      {/* Top Interactive Mode Tabs */}
      <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
            Интерактивный тренажер темы
          </span>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveMode('interactive_code')}
            className={`px-3 py-1 rounded-md font-medium transition cursor-pointer flex items-center space-x-1.5 ${
              activeMode === 'interactive_code' ? 'bg-sky-500 text-white shadow-xs font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Песочница & Код</span>
          </button>

          {isLanguageOrSpeech && (
            <button
              type="button"
              onClick={() => setActiveMode('speech_practice')}
              className={`px-3 py-1 rounded-md font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                activeMode === 'speech_practice' ? 'bg-purple-600 text-white shadow-xs font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Речевой тренажер</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveMode('concept_diagram')}
            className={`px-3 py-1 rounded-md font-medium transition cursor-pointer flex items-center space-x-1.5 ${
              activeMode === 'concept_diagram' ? 'bg-amber-600 text-white shadow-xs font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Инвариант темы</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 flex-1 select-text">
        {activeMode === 'interactive_code' && (
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono flex items-center space-x-1.5">
                <FileCode className="w-3.5 h-3.5 text-sky-400" />
                <span>{defaultFilename}</span>
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setCode(starterCode)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-[11px] cursor-pointer flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Сбросить</span>
                </button>
                <button
                  type="button"
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition text-xs shadow-md cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {isRunning ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  <span>Запустить код (JS / Sandbox)</span>
                </button>
              </div>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={8}
              spellCheck={false}
              className="w-full bg-slate-950 font-mono text-xs text-sky-200 p-3 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 leading-relaxed resize-y"
              placeholder="// Напишите ваш код решения здесь..."
            />

            {/* Execution Console Output */}
            {output && (
              <div className="bg-black/60 rounded-xl p-3 border border-slate-800 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1.5">
                  <span className="flex items-center space-x-1.5">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Консоль вывода (stdout / stderr)</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Время: {output.durationMs} мс</span>
                </div>

                {output.logs.length === 0 && !output.runtimeError && (
                  <div className="text-slate-500 italic">Код выполнен успешно, вывод пуст.</div>
                )}

                {output.logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`leading-relaxed ${
                      log.type === 'error' ? 'text-rose-400' : log.type === 'warn' ? 'text-amber-300' : 'text-emerald-300'
                    }`}
                  >
                    {log.text}
                  </div>
                ))}

                {output.runtimeError && (
                  <div className="text-rose-400 bg-rose-950/40 p-2 rounded border border-rose-800/60">
                    ❌ {output.runtimeError}
                  </div>
                )}

                {output.testResults.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 space-y-1">
                    <div className="text-[11px] font-bold text-slate-300">
                      Результаты тестов: {output.testsPassed} / {output.totalTests} пройдено
                    </div>
                    {output.testResults.map((t, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px]">
                        <span className={t.passed ? 'text-emerald-400' : 'text-rose-400'}>
                          {t.passed ? '✓' : '✗'} {t.name}
                        </span>
                        {t.error && <span className="text-rose-400 text-[10px]">{t.error}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeMode === 'speech_practice' && (
          <div className="flex flex-col space-y-4">
            <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-800/50 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-purple-200 mb-0.5">Практика устной речи & Спонтанный спикинг</h4>
                <p className="text-[11px] text-purple-300/80">
                  Нажмите запись и проговорите ключевой тезис своими словами. ИИ замерит темп (WPM), паузы и чистоту речи.
                </p>
              </div>
              <button
                type="button"
                onClick={handleListenNativeAudio}
                className="px-3 py-1.5 rounded-lg bg-purple-800 hover:bg-purple-700 text-white text-xs font-medium transition cursor-pointer flex items-center space-x-1.5 shrink-0"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Озвучить эталон</span>
              </button>
            </div>

            <div className="flex items-center justify-center py-4">
              <button
                type="button"
                onClick={handleToggleSpeechRecording}
                className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-xl flex items-center space-x-2.5 cursor-pointer ${
                  isRecording
                    ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse ring-4 ring-rose-500/30'
                    : 'bg-gradient-to-r from-purple-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 text-white'
                }`}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                <span>{isRecording ? 'Остановить и анализировать' : 'Начать запись голоса'}</span>
              </button>
            </div>

            {liveTranscript && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
                <span className="text-[10px] text-purple-400 block mb-1">Распознанный текст:</span>
                «{liveTranscript}»
              </div>
            )}

            {speechAnalysis && (
              <div className="bg-slate-950 p-3.5 rounded-xl border border-purple-800/40 space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-200">Метрики вашей речи:</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold font-mono">
                    Оценка чистоты: {speechAnalysis.clarityScore} / 100
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <div className="text-lg font-bold text-sky-400">{speechAnalysis.wpm}</div>
                    <div className="text-[10px] text-slate-400">Слов в минуту (WPM)</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <div className="text-lg font-bold text-amber-400">{speechAnalysis.fillerWordsCount}</div>
                    <div className="text-[10px] text-slate-400">Слов-паразитов</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <div className="text-lg font-bold text-purple-400">{speechAnalysis.hesitationPausesCount}</div>
                    <div className="text-[10px] text-slate-400">Пауз-заминок</div>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  {speechAnalysis.feedback.map((f, idx) => (
                    <div key={idx} className="text-slate-300 leading-snug">
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeMode === 'concept_diagram' && (
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-amber-300 text-xs font-bold">
              <Zap className="w-4 h-4" />
              <span>Ключевой инвариант и архитектурный принцип</span>
            </div>

            <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 text-xs leading-relaxed text-slate-200 space-y-2">
              <p>
                <strong>Принцип надежности:</strong> Любое действие в рамках темы «{unitTitle}» должно сохранять предсказуемость состояния даже при непредвиденных отказах.
              </p>
              <div className="flex items-center justify-around py-3 bg-black/40 rounded border border-slate-800 text-center font-mono text-[11px]">
                <div className="p-2 bg-slate-800/80 rounded border border-slate-700">
                  <div className="text-sky-400 font-bold">1. Входные данные</div>
                  <div className="text-slate-400 text-[10px]">Валидация контракта</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500" />
                <div className="p-2 bg-slate-800/80 rounded border border-slate-700">
                  <div className="text-amber-400 font-bold">2. Инвариант</div>
                  <div className="text-slate-400 text-[10px]">Атомарное исполнение</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500" />
                <div className="p-2 bg-slate-800/80 rounded border border-slate-700">
                  <div className="text-emerald-400 font-bold">3. Артефакт</div>
                  <div className="text-slate-400 text-[10px]">Проверенный результат</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
