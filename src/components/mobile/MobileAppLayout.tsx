import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  BookOpenText,
  Target,
  Flame,
  CheckSquare,
  Clock,
  Users,
  Sparkles,
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Play,
  Pause,
  Plus,
  Tv,
  Monitor,
  ChevronRight,
  ExternalLink,
  Code2,
  FileText,
  HelpCircle,
  NotebookPen,
  PhoneCall,
  UserCheck,
  Send,
  SlidersHorizontal,
  Check,
  Trash2,
} from 'lucide-react';
import { DAGNode, LearningUnit, NoteItem, TaskItem, HabitItem, UserArtifact } from '../../types.ts';
import { User } from '../../firebase.ts';
import { playChime } from '../../utils/audio.ts';

interface MobileAppLayoutProps {
  currentUser: User | { uid: string; displayName?: string | null; email?: string | null; photoURL?: string | null } | null;
  nodes: DAGNode[];
  units: Record<string, LearningUnit>;
  activeUnitId: string;
  onSelectUnit: (unitId: string) => void;
  onUpdateUnit?: (unit: LearningUnit) => void;
  tasks: TaskItem[];
  onToggleTask: (id: string) => void;
  onAddTask: (title: string) => void;
  habits: HabitItem[];
  onToggleHabit: (id: string) => void;
  notes: NoteItem[];
  onAddNote: (note: NoteItem) => void;
  onDeleteNote: (id: string) => void;
  artifacts: UserArtifact[];
  pomodoroMinutes: number;
  pomodoroSecondsLeft: number;
  isPomodoroRunning: boolean;
  onTogglePomodoro: () => void;
  onResetPomodoro: () => void;
  onSetPomodoroMinutes: (mins: number) => void;
  partner: any;
  onPartnerMatched: (p: any) => void;
  onDisconnectPartner: () => void;
  onStartCallWithPartner: (p: any) => void;
  onSwitchToDesktop: () => void;
  onLessonCompleted?: (unitId: string, performance?: { totalCorrect?: number; totalQuestions?: number; score?: number }) => void;
  onOpenBlitzModal?: () => void;
  onMatchBuddy?: () => void;
}

export type MobileTab = 'modules' | 'textbook' | 'focus' | 'tracker' | 'community' | 'tutor';

export const MobileAppLayout: React.FC<MobileAppLayoutProps> = ({
  currentUser,
  nodes,
  units,
  activeUnitId,
  onSelectUnit,
  onUpdateUnit,
  tasks,
  onToggleTask,
  onAddTask,
  habits,
  onToggleHabit,
  notes,
  onAddNote,
  onDeleteNote,
  artifacts,
  pomodoroMinutes,
  pomodoroSecondsLeft,
  isPomodoroRunning,
  onTogglePomodoro,
  onResetPomodoro,
  onSetPomodoroMinutes,
  partner,
  onPartnerMatched,
  onDisconnectPartner,
  onStartCallWithPartner,
  onSwitchToDesktop,
  onLessonCompleted,
  onOpenBlitzModal,
  onMatchBuddy,
}) => {
  const [activeTab, setActiveTab] = useState<MobileTab>('modules');

  // Active module helper
  const currentUnit = units[activeUnitId] || units['unit-1'] || Object.values(units)[0] || {
    id: 'unit-1',
    title: 'Введение в архитектуру',
    category: 'Фундамент',
    summaryMarkdown: 'Базовый учебный модуль.',
    quiz: [],
    projectTask: { title: 'Практическое задание', description: 'Выполните базовое упражнение.', starterCode: '', defaultFilename: 'task.ts', requirements: [], role: 'Разработчик' }
  };

  const activeNodeIndex = nodes.findIndex((n) => n.unitId === activeUnitId || n.id === activeUnitId);
  const blockNumber = activeNodeIndex >= 0 ? activeNodeIndex + 1 : 1;

  // New task input state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [showAddNote, setShowAddNote] = useState(false);

  // Focus studio mobile step: 1 = theory, 2 = practice, 3 = quiz
  const [focusStep, setFocusStep] = useState<1 | 2 | 3>(1);
  const [focusQuizAnswers, setFocusQuizAnswers] = useState<Record<string, number>>({});
  const [isFocusQuizSubmitted, setIsFocusQuizSubmitted] = useState(false);

  // Textbook mobile state
  const [selectedTextbookNodeId, setSelectedTextbookNodeId] = useState<string>(activeUnitId);
  const [textbookMode, setTextbookMode] = useState<'reader' | 'test'>('reader');
  const [textbookQuizAnswers, setTextbookQuizAnswers] = useState<Record<string, number>>({});
  const [isTextbookQuizSubmitted, setIsTextbookQuizSubmitted] = useState(false);
  const [isGeneratingMobileQuiz, setIsGeneratingMobileQuiz] = useState(false);
  const [textbookQuizDifficulty, setTextbookQuizDifficulty] = useState<'junior' | 'middle' | 'senior' | 'staff'>('middle');
  const [mobileTextbookQuizzes, setMobileTextbookQuizzes] = useState<Record<string, any[]>>({});

  // AI Tutor mobile state
  const [tutorMessages, setTutorMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; time: string }>>([
    {
      role: 'assistant',
      text: `Привет! Я ваш ИИ-тьютор по курсу «${currentUnit.title}». Задайте мне любой вопрос по теме, теории или разбору кода — отвечу строго по первоисточникам!`,
      time: 'Сейчас',
    }
  ]);
  const [tutorInput, setTutorInput] = useState('');
  const [isTutorThinking, setIsTutorThinking] = useState(false);

  const selectedTextbookUnit = units[selectedTextbookNodeId] || units[activeUnitId] || currentUnit;

  // Format timer
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Helper for generating topic quiz on mobile
  const handleGenerateMobileTextbookQuiz = async (difficultyOverride?: 'junior' | 'middle' | 'senior' | 'staff') => {
    const diff = difficultyOverride || textbookQuizDifficulty;
    setIsGeneratingMobileQuiz(true);
    playChime('click');

    try {
      const res = await fetch('/api/gemini/generate-textbook-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTextbookUnit.title,
          domain: selectedTextbookUnit.category || 'Инженерия',
          theoryContent: selectedTextbookUnit.summaryMarkdown || selectedTextbookUnit.aiEssence,
          difficulty: diff,
          count: 3,
        }),
      });

      if (!res.ok) throw new Error('API returned error');
      const data = await res.json();

      if (data && Array.isArray(data.questions) && data.questions.length > 0) {
        setMobileTextbookQuizzes((prev) => ({
          ...prev,
          [selectedTextbookUnit.id]: data.questions,
        }));
        setTextbookQuizAnswers({});
        setIsTextbookQuizSubmitted(false);
        playChime('success');
        return;
      }
    } catch (e) {
      console.warn('Failed to generate mobile textbook quiz:', e);
    } finally {
      setIsGeneratingMobileQuiz(false);
    }
  };

  // Active quiz for textbook
  const activeTextbookQuestions = useMemo(() => {
    if (mobileTextbookQuizzes[selectedTextbookUnit.id]?.length > 0) {
      return mobileTextbookQuizzes[selectedTextbookUnit.id];
    }
    if (selectedTextbookUnit.quiz && selectedTextbookUnit.quiz.length > 0) {
      return selectedTextbookUnit.quiz.map((q, idx) => ({
        id: q.id || `q-${idx}`,
        question: q.question,
        options: (q.options || []).map((o: any) => typeof o === 'string' ? o : o.text || ''),
        correctIndex: Math.max(0, (q.options || []).findIndex((o: any) => typeof o === 'object' && o !== null && o.isCorrect)),
        explanation: q.explanation || 'Правильный ответ основан на инвариантах темы.',
        scenario: (q as any).scenario,
      }));
    }
    // Topic-specific fallback
    return [
      {
        id: 'q-fb-1',
        question: `Каков ключевой инвариант и принцип работы в теме «${selectedTextbookUnit.title}»?`,
        options: [
          `Обеспечение устойчивости и сохранение ключевых свойств «${selectedTextbookUnit.title}»`,
          'Полное отсутствие проверок правильности ради скорости',
          'Случайное распределение параметров выполнения',
          'Искусственное увеличение сложности без пользы'
        ],
        correctIndex: 0,
        explanation: `Суть темы «${selectedTextbookUnit.title}» состоит в сохранении неизменных законов системы при любых вариациях.`,
      },
      {
        id: 'q-fb-2',
        question: `С каким практическим компромиссом сопряжено применение «${selectedTextbookUnit.title}»?`,
        options: [
          'Баланс между накладными расходами на структуру и скоростью/надежностью операций',
          'Требование полного отказа от многопоточности',
          'Невозможность работы в современных операционных системах',
          'Неизбежная потеря 50% данных при первой перезагрузке'
        ],
        correctIndex: 0,
        explanation: 'Практическая реализация всегда требует оценки компромисса между ценой координации и выигрышем в стабильности.',
      }
    ];
  }, [selectedTextbookUnit, mobileTextbookQuizzes]);

  // Handle send message to AI Tutor
  const handleSendTutorMessage = async () => {
    if (!tutorInput.trim() || isTutorThinking) return;
    const userText = tutorInput.trim();
    setTutorInput('');

    const newMsgs = [
      ...tutorMessages,
      { role: 'user' as const, text: userText, time: 'Сейчас' }
    ];
    setTutorMessages(newMsgs);
    setIsTutorThinking(true);
    playChime('click');

    try {
      const res = await fetch('/api/gemini/operator-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          currentUnit: {
            id: currentUnit.id,
            title: currentUnit.title,
            summaryMarkdown: currentUnit.summaryMarkdown,
          },
          history: newMsgs.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text })),
        }),
      });

      if (!res.ok) throw new Error('Operator error');
      const data = await res.json();
      const reply = data.reply || data.text || 'Ответ сформирован на основе программы курса.';

      setTutorMessages((prev) => [
        ...prev,
        { role: 'assistant', text: reply, time: 'Сейчас' }
      ]);
      playChime('success');
    } catch {
      setTutorMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `В теме «${currentUnit.title}» ключевой инвариант — это детерминированность логики и проверка граничных условий. Начните с минимального примера и проверьте себя тестом в разделе «Фокус».`,
          time: 'Сейчас',
        }
      ]);
    } finally {
      setIsTutorThinking(false);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-[#0D1117] text-[#FAF8F5] select-none overflow-hidden">
      {/* 1. TOP MOBILE APP HEADER */}
      <header className="h-14 px-4 bg-[#161B22] border-b border-[#30363D] flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>Learning OS</span>
              <span className="text-[10px] text-sky-400 font-mono">Mobile</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate max-w-[170px]">
              {currentUnit.category || 'Программа обучения'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Daily streak indicator */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-semibold">
            <Flame className="w-3.5 h-3.5 fill-amber-400" />
            <span>4 дн</span>
          </div>

          {/* Switch to Desktop OS view */}
          <button
            type="button"
            onClick={onSwitchToDesktop}
            className="p-2 rounded-xl bg-[#21262D] hover:bg-[#30363D] text-slate-300 hover:text-white transition cursor-pointer border border-[#30363D]"
            title="Переключиться на настольный интерфейс с окнами"
          >
            <Monitor className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN SCROLLABLE CONTENT AREA */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-20 space-y-4">
        {/* ==================== TAB 1: MODULES / FEED ==================== */}
        {activeTab === 'modules' && (
          <div className="space-y-4">
            {/* HERO CARD: Current Active Learning Unit */}
            <div className="rounded-2xl p-5 bg-gradient-to-br from-[#1C2128] to-[#161B22] border border-[#30363D] shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between text-xs text-sky-400 font-medium mb-1.5">
                <span>Модуль {blockNumber} из {nodes.length}</span>
                <span className="text-slate-400">{currentUnit.category || 'Архитектура'}</span>
              </div>

              <h2 className="text-lg font-bold text-white tracking-tight leading-snug">
                {currentUnit.title}
              </h2>

              <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                {currentUnit.aiEssence || 'Изучите фундаментальные принципы темы, решите практическую задачу и закрепите знания интерактивным тестом.'}
              </p>

              {/* Progress bar */}
              <div className="mt-4 pt-3 border-t border-[#30363D] flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Прогресс темы</span>
                    <span className="font-semibold text-sky-400">70%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#21262D] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full" style={{ width: '70%' }} />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('focus');
                    playChime('click');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Учиться</span>
                </button>
              </div>
            </div>

            {/* QUICK ACTIONS ROW: Spaced Repetition Blitz & Pomodoro */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  if (onOpenBlitzModal) onOpenBlitzModal();
                  else playChime('click');
                }}
                className="p-3.5 rounded-2xl bg-[#161B22] border border-[#30363D] text-left hover:border-amber-500/50 transition cursor-pointer flex flex-col justify-between"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Интервальный блиц</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">3 карточки на повтор</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('tracker');
                  playChime('click');
                }}
                className="p-3.5 rounded-2xl bg-[#161B22] border border-[#30363D] text-left hover:border-sky-500/50 transition cursor-pointer flex flex-col justify-between"
              >
                <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center mb-2">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Фокус-таймер</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{formatTimer(pomodoroSecondsLeft)}</div>
                </div>
              </button>
            </div>

            {/* COURSE TRAJECTORY MODULES LIST */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-semibold uppercase tracking-wider">
                <span>Траектория программы ({nodes.length})</span>
                <span>Блоки 1–{nodes.length}</span>
              </div>

              <div className="space-y-2">
                {nodes.map((node, idx) => {
                  const isCurrent = node.unitId === activeUnitId || node.id === activeUnitId;
                  const unitData = units[node.unitId] || units[node.id];
                  const isDone = (node as any).status === 'completed';

                  return (
                    <div
                      key={node.id}
                      onClick={() => {
                        onSelectUnit(node.unitId || node.id);
                        playChime('click');
                      }}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-[#1C2128] border-sky-500/60 ring-1 ring-sky-500/40'
                          : 'bg-[#161B22] border-[#30363D] hover:bg-[#21262D]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                          isDone
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : isCurrent
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : 'bg-[#21262D] text-slate-400'
                        }`}>
                          {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{node.title}</div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {unitData?.category || node.phaseTitle || `Фаза ${node.phase || 1}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isCurrent ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab('focus');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-sky-500 text-slate-950 text-[11px] font-bold"
                          >
                            Урок
                          </button>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: TEXTBOOK & TESTS ==================== */}
        {activeTab === 'textbook' && (
          <div className="space-y-4">
            {/* Chapter Selection Bar */}
            <div className="rounded-xl p-3 bg-[#161B22] border border-[#30363D] flex items-center justify-between gap-2">
              <div className="text-xs text-slate-400">Глава:</div>
              <select
                value={selectedTextbookNodeId}
                onChange={(e) => {
                  setSelectedTextbookNodeId(e.target.value);
                  onSelectUnit(e.target.value);
                  setTextbookQuizAnswers({});
                  setIsTextbookQuizSubmitted(false);
                }}
                className="flex-1 bg-[#21262D] text-xs font-semibold text-white px-3 py-1.5 rounded-lg border border-[#30363D] outline-none"
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.unitId || n.id}>
                    {n.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Mode Switcher: Reader vs Interactive Quiz */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#161B22] border border-[#30363D]">
              <button
                type="button"
                onClick={() => setTextbookMode('reader')}
                className={`py-2 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  textbookMode === 'reader' ? 'bg-[#21262D] text-white shadow-xs' : 'text-slate-400'
                }`}
              >
                <BookOpenText className="w-3.5 h-3.5" />
                <span>Конспект</span>
              </button>
              <button
                type="button"
                onClick={() => setTextbookMode('test')}
                className={`py-2 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  textbookMode === 'test' ? 'bg-[#21262D] text-sky-400 shadow-xs' : 'text-slate-400'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>Тест по теме</span>
              </button>
            </div>

            {textbookMode === 'reader' ? (
              /* Reader View */
              <div className="space-y-3.5">
                {/* Title & citation */}
                <div className="p-4 rounded-xl bg-[#161B22] border border-[#30363D]">
                  <div className="text-[11px] text-sky-400 font-semibold uppercase tracking-wider">
                    {selectedTextbookUnit.category || 'Академический материал'}
                  </div>
                  <h1 className="text-base font-bold text-white mt-1 leading-snug">
                    {selectedTextbookUnit.title}
                  </h1>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Материал составлен на основе университетских учебников и верифицированных первоисточников.
                  </p>
                </div>

                {/* Invariants card */}
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ключевые инварианты</span>
                  </div>
                  <ul className="text-xs space-y-1.5 text-emerald-200/90 leading-relaxed list-disc list-inside">
                    <li>Правило сохраняется неизменным при смене языка или фреймворка.</li>
                    <li>Понимание проверяется решением задачи на чистом листе.</li>
                    <li>Граничные условия определяют надежность решения в продакшене.</li>
                  </ul>
                </div>

                {/* Real world significance */}
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300 space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <NotebookPen className="w-3.5 h-3.5 text-amber-400" />
                    <span>Практическая ценность</span>
                  </div>
                  <p className="text-xs text-amber-200/90 leading-relaxed">
                    {selectedTextbookUnit.aiEssence || 'Позволяет избегать типовых архитектурных ошибок и масштабировать систему без деградации.'}
                  </p>
                </div>

                {/* Summary theory markdown */}
                <div className="p-4 rounded-xl bg-[#161B22] border border-[#30363D] text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {selectedTextbookUnit.summaryMarkdown || 'Теоретический конспект изучаемой главы.'}
                </div>
              </div>
            ) : (
              /* Topic Quiz View */
              <div className="space-y-3.5">
                {/* Topic Quiz Header */}
                <div className="p-4 rounded-xl bg-[#161B22] border border-[#30363D] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Интерактивный тест</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">По теме «{selectedTextbookUnit.title}»</div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      {textbookQuizDifficulty.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={textbookQuizDifficulty}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setTextbookQuizDifficulty(val);
                        void handleGenerateMobileTextbookQuiz(val);
                      }}
                      className="bg-[#21262D] text-xs text-white px-2.5 py-1.5 rounded-lg border border-[#30363D] outline-none"
                    >
                      <option value="junior">Junior (Базовый)</option>
                      <option value="middle">Middle (Инженерный)</option>
                      <option value="senior">Senior (Продвинутый)</option>
                      <option value="staff">Staff (Архитектурный)</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => void handleGenerateMobileTextbookQuiz()}
                      disabled={isGeneratingMobileQuiz}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-60"
                    >
                      <Sparkles className={`w-3 h-3 ${isGeneratingMobileQuiz ? 'animate-spin' : ''}`} />
                      <span>{isGeneratingMobileQuiz ? 'Генерация...' : 'Перегенерировать ИИ'}</span>
                    </button>
                  </div>
                </div>

                {/* Score summary */}
                {isTextbookQuizSubmitted && (
                  <div className="p-3.5 rounded-xl bg-[#161B22] border border-sky-500/40 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">
                        Результат: {activeTextbookQuestions.filter((q, i) => textbookQuizAnswers[q.id || `q-${i}`] === q.correctIndex).length} из {activeTextbookQuestions.length} верно
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Материал темы проверен</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTextbookQuizAnswers({});
                        setIsTextbookQuizSubmitted(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#21262D] text-xs text-white border border-[#30363D]"
                    >
                      Заново
                    </button>
                  </div>
                )}

                {/* Questions */}
                <div className="space-y-3">
                  {activeTextbookQuestions.map((quiz, qIdx) => {
                    const qId = quiz.id || `q-${qIdx}`;
                    const selected = textbookQuizAnswers[qId];
                    const isCorrect = isTextbookQuizSubmitted && selected === quiz.correctIndex;

                    return (
                      <div key={qId} className="p-4 rounded-xl bg-[#161B22] border border-[#30363D] space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-xs font-semibold text-white leading-snug">
                            <span className="text-sky-400 mr-1.5">{qIdx + 1}.</span>
                            {quiz.question}
                          </div>
                          {isTextbookQuizSubmitted && (
                            <span className={`text-[11px] font-bold shrink-0 ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isCorrect ? '✓ Верно' : '✕ Ошибка'}
                            </span>
                          )}
                        </div>

                        {quiz.scenario && (
                          <div className="text-[11px] text-slate-400 bg-[#0D1117] p-2 rounded-lg border border-[#30363D]">
                            {quiz.scenario}
                          </div>
                        )}

                        <div className="space-y-1.5">
                          {quiz.options.map((opt: string, optIdx: number) => {
                            const isChosen = selected === optIdx;
                            let style = 'bg-[#21262D] text-slate-300 border-[#30363D]';

                            if (isTextbookQuizSubmitted) {
                              if (optIdx === quiz.correctIndex) {
                                style = 'bg-emerald-950/30 text-emerald-300 border-emerald-500/50 font-medium';
                              } else if (isChosen && optIdx !== quiz.correctIndex) {
                                style = 'bg-rose-950/30 text-rose-300 border-rose-500/50';
                              } else {
                                style = 'opacity-50 bg-[#21262D] text-slate-500 border-transparent';
                              }
                            } else if (isChosen) {
                              style = 'bg-sky-500/20 text-sky-200 border-sky-500';
                            }

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                disabled={isTextbookQuizSubmitted}
                                onClick={() => {
                                  setTextbookQuizAnswers((prev) => ({ ...prev, [qId]: optIdx }));
                                  playChime('click');
                                }}
                                className={`w-full text-left p-3 rounded-xl border text-xs leading-relaxed transition flex items-center justify-between gap-2 cursor-pointer ${style}`}
                              >
                                <span>{opt}</span>
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                  isChosen ? 'border-sky-400 bg-sky-400' : 'border-slate-500'
                                }`}>
                                  {isChosen && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {isTextbookQuizSubmitted && quiz.explanation && (
                          <div className="text-[11px] text-slate-300 bg-[#0D1117] p-2.5 rounded-lg border border-[#30363D] leading-relaxed">
                            <span className="font-semibold text-sky-400">Разбор:</span> {quiz.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!isTextbookQuizSubmitted && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsTextbookQuizSubmitted(true);
                      playChime('success');
                    }}
                    disabled={Object.keys(textbookQuizAnswers).length === 0}
                    className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-sm transition cursor-pointer disabled:opacity-40"
                  >
                    Проверить ответы ({Object.keys(textbookQuizAnswers).length}/{activeTextbookQuestions.length})
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 3: FOCUS STUDIO ==================== */}
        {activeTab === 'focus' && (
          <div className="space-y-4">
            {/* Step navigation bar */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#161B22] border border-[#30363D]">
              <button
                type="button"
                onClick={() => setFocusStep(1)}
                className={`py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  focusStep === 1 ? 'bg-[#21262D] text-white shadow-xs' : 'text-slate-400'
                }`}
              >
                1. Теория
              </button>
              <button
                type="button"
                onClick={() => setFocusStep(2)}
                className={`py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  focusStep === 2 ? 'bg-[#21262D] text-white shadow-xs' : 'text-slate-400'
                }`}
              >
                2. Практика
              </button>
              <button
                type="button"
                onClick={() => setFocusStep(3)}
                className={`py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  focusStep === 3 ? 'bg-[#21262D] text-white shadow-xs' : 'text-slate-400'
                }`}
              >
                3. Проверка
              </button>
            </div>

            {/* STEP 1: THEORY */}
            {focusStep === 1 && (
              <div className="space-y-3.5">
                <div className="p-4 rounded-xl bg-[#161B22] border border-[#30363D]">
                  <div className="text-[11px] text-sky-400 font-semibold uppercase tracking-wider">
                    {currentUnit.category || 'Архитектура'}
                  </div>
                  <h2 className="text-base font-bold text-white mt-1 leading-snug">
                    {currentUnit.title}
                  </h2>
                  <div className="mt-3 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                    {currentUnit.summaryMarkdown || currentUnit.aiEssence}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFocusStep(2)}
                  className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Перейти к практическому заданию</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: PRACTICE */}
            {focusStep === 2 && (
              <div className="space-y-3.5">
                <div className="p-4 rounded-xl bg-[#161B22] border border-[#30363D] space-y-2.5">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-sky-400" />
                    <span>{currentUnit.projectTask?.title || 'Практический проект'}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {currentUnit.projectTask?.description || 'Реализуйте ключевой инвариант темы в соответствии с требованиями.'}
                  </p>

                  {currentUnit.projectTask?.starterCode && (
                    <div className="mt-2">
                      <div className="text-[10px] text-slate-400 font-mono mb-1">
                        Файл: {currentUnit.projectTask.defaultFilename || 'solution.ts'}
                      </div>
                      <pre className="p-3 rounded-lg bg-[#0D1117] border border-[#30363D] text-[11px] text-slate-300 font-mono overflow-x-auto">
                        {currentUnit.projectTask.starterCode.trim()}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFocusStep(1)}
                    className="py-3 rounded-xl bg-[#21262D] text-slate-300 font-semibold text-xs border border-[#30363D]"
                  >
                    ← Назад к теории
                  </button>
                  <button
                    type="button"
                    onClick={() => setFocusStep(3)}
                    className="py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs"
                  >
                    К проверочному тесту →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: CHECK / QUIZ */}
            {focusStep === 3 && (
              <div className="space-y-3.5">
                <div className="p-4 rounded-xl bg-[#161B22] border border-[#30363D]">
                  <div className="text-xs font-bold text-white">Проверочный тест модуля</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    3 вопроса на понимание механизмов и компромиссов темы «{currentUnit.title}»
                  </div>
                </div>

                {isFocusQuizSubmitted && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold">Модуль успешно сдан (+100 XP)!</div>
                      <div className="text-[11px] opacity-80 mt-0.5">Знания темы зафиксированы в графе</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (onLessonCompleted) onLessonCompleted(currentUnit.id, { score: 100, totalCorrect: 3, totalQuestions: 3 });
                        playChime('success');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs"
                    >
                      Завершить
                    </button>
                  </div>
                )}

                {/* Render Unit Quiz questions */}
                {(currentUnit.quiz || []).map((q, idx) => {
                  const selected = focusQuizAnswers[q.id];
                  const isCorrect = isFocusQuizSubmitted && q.options[selected]?.isCorrect;

                  return (
                    <div key={q.id} className="p-4 rounded-xl bg-[#161B22] border border-[#30363D] space-y-2.5">
                      <div className="text-xs font-semibold text-white">
                        <span className="text-sky-400 mr-1.5">{idx + 1}.</span>
                        {q.question}
                      </div>

                      <div className="space-y-1.5">
                        {q.options.map((opt, optIdx) => {
                          const isChosen = selected === optIdx;
                          return (
                            <button
                              key={opt.id || optIdx}
                              type="button"
                              disabled={isFocusQuizSubmitted}
                              onClick={() => {
                                setFocusQuizAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
                                playChime('click');
                              }}
                              className={`w-full text-left p-3 rounded-xl border text-xs transition flex items-center justify-between gap-2 ${
                                isChosen ? 'bg-sky-500/20 text-sky-200 border-sky-500' : 'bg-[#21262D] text-slate-300 border-[#30363D]'
                              }`}
                            >
                              <span>{opt.text}</span>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                isChosen ? 'border-sky-400 bg-sky-400' : 'border-slate-500'
                              }`}>
                                {isChosen && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {!isFocusQuizSubmitted && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsFocusQuizSubmitted(true);
                      playChime('success');
                    }}
                    disabled={Object.keys(focusQuizAnswers).length === 0}
                    className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs"
                  >
                    Завершить проверку
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 4: TRACKER & POMODORO ==================== */}
        {activeTab === 'tracker' && (
          <div className="space-y-4">
            {/* POMODORO TIMER CARD */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1C2128] to-[#161B22] border border-[#30363D] text-center space-y-3">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Фокус-сессия Pomodoro
              </div>

              <div className="text-4xl font-extrabold text-white font-mono tracking-tight">
                {formatTimer(pomodoroSecondsLeft)}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={onTogglePomodoro}
                  className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  {isPomodoroRunning ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950" />}
                  <span>{isPomodoroRunning ? 'Пауза' : 'Старт'}</span>
                </button>

                <button
                  type="button"
                  onClick={onResetPomodoro}
                  className="p-2.5 rounded-xl bg-[#21262D] hover:bg-[#30363D] text-slate-300 border border-[#30363D] transition cursor-pointer"
                  title="Сбросить таймер"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Presets */}
              <div className="flex items-center justify-center gap-1.5 pt-2">
                {[15, 25, 45, 50].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => onSetPomodoroMinutes(mins)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      pomodoroMinutes === mins
                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                        : 'bg-[#21262D] text-slate-400 border border-transparent'
                    }`}
                  >
                    {mins}м
                  </button>
                ))}
              </div>
            </div>

            {/* SPRINT TASKS */}
            <div className="p-4 rounded-2xl bg-[#161B22] border border-[#30363D] space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-sky-400" />
                  <span>Задачи спринта ({tasks.filter(t => t.done).length}/{tasks.length})</span>
                </div>
              </div>

              {/* Add task row */}
              <div className="flex items-center gap-2">
                <input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newTaskTitle.trim()) {
                      onAddTask(newTaskTitle.trim());
                      setNewTaskTitle('');
                    }
                  }}
                  placeholder="Добавить новую задачу..."
                  className="flex-1 bg-[#21262D] text-xs text-white px-3 py-2 rounded-xl border border-[#30363D] outline-none placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newTaskTitle.trim()) {
                      onAddTask(newTaskTitle.trim());
                      setNewTaskTitle('');
                    }
                  }}
                  className="p-2 bg-sky-500 text-slate-950 rounded-xl font-bold transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Tasks list */}
              <div className="space-y-1.5">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onToggleTask(task.id)}
                    className={`p-3 rounded-xl border text-xs transition cursor-pointer flex items-center justify-between gap-2.5 ${
                      task.done ? 'bg-[#1C2128]/60 text-slate-500 line-through border-transparent' : 'bg-[#21262D] text-white border-[#30363D]'
                    }`}
                  >
                    <span className="truncate">{task.title}</span>
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                      task.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-500'
                    }`}>
                      {task.done && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* HABITS TRACKER */}
            <div className="p-4 rounded-2xl bg-[#161B22] border border-[#30363D] space-y-3">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Ежедневные привычки</span>
              </div>

              <div className="space-y-1.5">
                {habits.map((habit) => (
                  <div
                    key={habit.id}
                    onClick={() => onToggleHabit(habit.id)}
                    className="p-3 rounded-xl bg-[#21262D] border border-[#30363D] text-xs text-white flex items-center justify-between transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="truncate">{habit.title}</span>
                      <span className="text-[10px] text-amber-400 font-mono">({habit.streak} дн)</span>
                    </div>
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                      habit.completedToday ? 'border-amber-500 bg-amber-500 text-slate-950' : 'border-slate-500'
                    }`}>
                      {habit.completedToday && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* QUICK NOTES */}
            <div className="p-4 rounded-2xl bg-[#161B22] border border-[#30363D] space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Заметки ({notes.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddNote(!showAddNote)}
                  className="text-xs text-sky-400 font-semibold"
                >
                  {showAddNote ? 'Отмена' : '+ Заметка'}
                </button>
              </div>

              {showAddNote && (
                <div className="p-3 rounded-xl bg-[#21262D] border border-[#30363D] space-y-2">
                  <input
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="Заголовок заметки..."
                    className="w-full bg-[#161B22] text-xs text-white px-3 py-2 rounded-lg border border-[#30363D] outline-none"
                  />
                  <textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Текст инварианта или мысли..."
                    rows={2}
                    className="w-full bg-[#161B22] text-xs text-white px-3 py-2 rounded-lg border border-[#30363D] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newNoteTitle.trim()) {
                        onAddNote({
                          id: `note-${Date.now()}`,
                          title: newNoteTitle.trim(),
                          content: newNoteContent.trim(),
                          tag: 'Быстро',
                          createdAt: 'Только что',
                        });
                        setNewNoteTitle('');
                        setNewNoteContent('');
                        setShowAddNote(false);
                      }
                    }}
                    className="w-full py-2 bg-sky-500 text-slate-950 font-bold text-xs rounded-lg"
                  >
                    Сохранить
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {notes.map((note) => (
                  <div key={note.id} className="p-3 rounded-xl bg-[#21262D] border border-[#30363D] space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-white truncate">{note.title}</div>
                      <button
                        type="button"
                        onClick={() => onDeleteNote(note.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">{note.content}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 5: COMMUNITY / BUDDY ==================== */}
        {activeTab === 'community' && (
          <div className="space-y-4">
            {/* SPARRING PARTNER CARD */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1C2128] to-[#161B22] border border-[#30363D] space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>P2P Спарринг-напарник</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  partner ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'
                }`}>
                  {partner ? 'В сети' : 'Не подключен'}
                </span>
              </div>

              {partner ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#21262D] border border-[#30363D]">
                    <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm">
                      {partner.name ? partner.name[0] : 'P'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{partner.name || 'Спарринг-партнер'}</div>
                      <div className="text-[11px] text-slate-400">{partner.skillDomain || 'Frontend & Architecture'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onStartCallWithPartner(partner)}
                      className="py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Аудиозвонок</span>
                    </button>
                    <button
                      type="button"
                      onClick={onDisconnectPartner}
                      className="py-2.5 rounded-xl bg-[#21262D] text-rose-400 border border-rose-500/30 text-xs font-semibold"
                    >
                      Отключить
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Подберите напарника со схожим темпом для взаимного код-ревью и отработки устных инвариантов.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (onMatchBuddy) onMatchBuddy();
                      else {
                        onPartnerMatched({
                          id: 'buddy-alex',
                          name: 'Алексей М.',
                          skillDomain: 'Computer Science',
                          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
                        });
                        playChime('success');
                      }
                    }}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Найти напарника для практики</span>
                  </button>
                </div>
              )}
            </div>

            {/* SAVED PORTFOLIO ARTIFACTS */}
            <div className="p-4 rounded-2xl bg-[#161B22] border border-[#30363D] space-y-3">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Портфолио артефактов ({artifacts.length})</span>
              </div>

              {artifacts.length === 0 ? (
                <div className="text-xs text-slate-400 py-3 text-center">
                  Пока нет сохраненных артефактов. Решите проект в Фокус-Студии!
                </div>
              ) : (
                <div className="space-y-2">
                  {artifacts.map((art) => (
                    <div key={art.id} className="p-3 rounded-xl bg-[#21262D] border border-[#30363D] space-y-1">
                      <div className="text-xs font-bold text-white">{art.unitTitle || art.filename}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-2">{art.productionAdvice || art.filename}</div>
                      <div className="text-[10px] text-emerald-400 font-mono mt-1">✓ Оценка: {art.score}/100</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 6: AI TUTOR ==================== */}
        {activeTab === 'tutor' && (
          <div className="flex flex-col h-[calc(100vh-140px)]">
            {/* Quick Prompts */}
            <div className="flex gap-2 overflow-x-auto pb-2 shrink-0 no-scrollbar">
              {[
                'Объясни тему простыми словами',
                'Приведи пример из продакшена',
                'Какой главный граничный случай?',
              ].map((prompt, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => {
                    setTutorInput(prompt);
                  }}
                  className="px-3 py-1.5 rounded-full bg-[#161B22] border border-[#30363D] text-[11px] text-slate-300 whitespace-nowrap hover:border-sky-500/50"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 my-2">
              {tutorMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-sky-500 text-slate-950 font-medium rounded-br-xs'
                        : 'bg-[#161B22] border border-[#30363D] text-slate-200 rounded-bl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.time}</span>
                </div>
              ))}

              {isTutorThinking && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#161B22] border border-[#30363D] text-xs text-sky-400">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>ИИ формулирует ответ по первоисточникам...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#30363D] shrink-0">
              <input
                value={tutorInput}
                onChange={(e) => setTutorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleSendTutorMessage();
                }}
                placeholder="Спросить тьютора по теме..."
                className="flex-1 bg-[#161B22] text-xs text-white px-3.5 py-3 rounded-xl border border-[#30363D] outline-none placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => void handleSendTutorMessage()}
                disabled={!tutorInput.trim() || isTutorThinking}
                className="p-3 rounded-xl bg-sky-500 text-slate-950 font-bold transition cursor-pointer disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 3. FIXED BOTTOM TAB NAVIGATION (Classic Mobile App Tab Bar) */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#161B22] border-t border-[#30363D] flex items-center justify-around px-2 z-40">
        <button
          type="button"
          onClick={() => {
            setActiveTab('modules');
            playChime('click');
          }}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition cursor-pointer min-w-[56px] min-h-[44px] ${
            activeTab === 'modules' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-[10px]">Курс</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('textbook');
            playChime('click');
          }}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition cursor-pointer min-w-[56px] min-h-[44px] ${
            activeTab === 'textbook' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpenText className="w-4 h-4" />
          <span className="text-[10px]">Учебник</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('focus');
            playChime('click');
          }}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition cursor-pointer min-w-[56px] min-h-[44px] ${
            activeTab === 'focus' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Target className="w-4 h-4" />
          <span className="text-[10px]">Фокус</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('tracker');
            playChime('click');
          }}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition cursor-pointer min-w-[56px] min-h-[44px] ${
            activeTab === 'tracker' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span className="text-[10px]">Трекер</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('community');
            playChime('click');
          }}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition cursor-pointer min-w-[56px] min-h-[44px] ${
            activeTab === 'community' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="text-[10px]">Спарринг</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('tutor');
            playChime('click');
          }}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition cursor-pointer min-w-[56px] min-h-[44px] ${
            activeTab === 'tutor' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px]">Тьютор</span>
        </button>
      </nav>
    </div>
  );
};
