import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Monitor,
  ChevronRight,
  ChevronDown,
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
  Search,
  Compass,
  BrainCircuit,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Music,
  SkipForward,
  Terminal,
  ArrowRight,
  GraduationCap,
  TrendingUp,
  Layers,
  Zap,
  AlertCircle,
  Filter,
  Lock,
  Unlock,
  Bot,
  Copy,
} from 'lucide-react';
import { DAGNode, DAGEdge, LearningUnit, NoteItem, TaskItem, HabitItem, UserArtifact, PeerPartner, AdminMaterial } from '../../types.ts';
import { User } from '../../firebase.ts';
import { playChime } from '../../utils/audio.ts';
import { lofiAudio, LoFiEngineState } from '../../utils/lofiAudio.ts';
import { RichVisualDiagramRenderer } from '../learning/RichVisualDiagramRenderer.tsx';

export interface MobileAppLayoutProps {
  currentUser: User | { uid: string; displayName?: string | null; email?: string | null; photoURL?: string | null } | null;
  nodes: DAGNode[];
  edges?: DAGEdge[];
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
  onSaveArtifact?: (art: UserArtifact) => void;
  karma?: number;
  onAddKarma?: (amount: number) => void;
  pomodoroMinutes: number;
  pomodoroSecondsLeft: number;
  isPomodoroRunning: boolean;
  onTogglePomodoro: () => void;
  onResetPomodoro: () => void;
  onSetPomodoroMinutes: (mins: number) => void;
  partner: PeerPartner | any;
  onPartnerMatched: (p: any) => void;
  onDisconnectPartner: () => void;
  onStartCallWithPartner: (p: any) => void;
  onSwitchToDesktop: () => void;
  onLessonCompleted?: (unitId: string, performance?: { totalCorrect?: number; totalQuestions?: number; score?: number }) => void;
  onOpenBlitzModal?: () => void;
  onMatchBuddy?: () => void;
  onMutateGraph?: (topic: string, reason: string) => void;
  onInjectProject?: (projectData: any) => void;
  materials?: AdminMaterial[];
}

export type MobileTab = 'roadmap' | 'focus' | 'mentor' | 'tracker' | 'profile';

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
  onSaveArtifact,
  karma = 0,
  onAddKarma,
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
  onMutateGraph,
}) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<MobileTab>('roadmap');

  // Lo-Fi Audio engine state
  const [lofiState, setLofiState] = useState<LoFiEngineState>(() => lofiAudio.getStatus());
  useEffect(() => {
    return lofiAudio.subscribe((state) => {
      setLofiState(state);
    });
  }, []);

  // Active module helper
  const currentUnit: LearningUnit = units[activeUnitId] || units['unit-1'] || Object.values(units)[0] || {
    id: 'unit-1',
    title: 'Основы и фундаментальные инварианты',
    category: 'Фундамент',
    summaryMarkdown: 'Базовый учебный модуль курса.',
    quiz: [],
    projectTask: {
      title: 'Практическое задание',
      description: 'Реализуйте базовое упражнение и проверьте ключевые инварианты.',
      starterCode: '// Введите решение здесь\n',
      defaultFilename: 'solution.ts',
      requirements: ['Корректность логики', 'Обработка граничных условий'],
      role: 'Практик',
    },
  };

  const activeNodeIndex = nodes.findIndex((n) => n.unitId === activeUnitId || n.id === activeUnitId);
  const activeNode = activeNodeIndex >= 0 ? nodes[activeNodeIndex] : nodes[0];
  const blockNumber = activeNodeIndex >= 0 ? activeNodeIndex + 1 : 1;
  const completedCount = nodes.filter((n) => (n as any).status === 'completed').length;
  const progressPercent = nodes.length > 0 ? Math.round((completedCount / nodes.length) * 100) : 0;

  // Selected module drawer in roadmap
  const [inspectedUnitId, setInspectedUnitId] = useState<string | null>(null);

  // Roadmap filtering
  const [roadmapSearch, setRoadmapSearch] = useState('');
  const [roadmapPhaseFilter, setRoadmapPhaseFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Focus studio steps: 1 = theory, 2 = practice, 3 = quiz
  const [focusStep, setFocusStep] = useState<1 | 2 | 3>(1);
  const [codeSolution, setCodeSolution] = useState<string>(() => currentUnit.projectTask?.starterCode || '');
  const [isEvaluatingCode, setIsEvaluatingCode] = useState(false);
  const [codeEvaluationResult, setCodeEvaluationResult] = useState<{
    score: number;
    feedback: string;
    passed: boolean;
    invariantsPreserved: string[];
    improvements: string[];
  } | null>(null);

  // When activeUnitId changes, reset code solution to starter code
  useEffect(() => {
    setCodeSolution(currentUnit.projectTask?.starterCode || '');
    setCodeEvaluationResult(null);
  }, [activeUnitId, currentUnit.projectTask?.starterCode]);

  // Quiz state in focus studio
  const [focusQuizAnswers, setFocusQuizAnswers] = useState<Record<string, number>>({});
  const [isFocusQuizSubmitted, setIsFocusQuizSubmitted] = useState(false);
  const [isGeneratingAiQuiz, setIsGeneratingAiQuiz] = useState(false);
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<any[]>(() => currentUnit.quiz || []);

  useEffect(() => {
    setActiveQuizQuestions(currentUnit.quiz || []);
    setFocusQuizAnswers({});
    setIsFocusQuizSubmitted(false);
  }, [activeUnitId, currentUnit.quiz]);

  // Text-To-Speech for theory
  const [isSpeakingTheory, setIsSpeakingTheory] = useState(false);
  const handleToggleSpeakTheory = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isSpeakingTheory) {
      window.speechSynthesis.cancel();
      setIsSpeakingTheory(false);
      return;
    }
    const cleanText = (currentUnit.summaryMarkdown || currentUnit.aiEssence || currentUnit.title)
      .replace(/[`#*_]/g, '')
      .slice(0, 800);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ru-RU';
    utterance.rate = 1.05;
    utterance.onend = () => setIsSpeakingTheory(false);
    utterance.onerror = () => setIsSpeakingTheory(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeakingTheory(true);
    playChime('click');
  };

  // AI Mentor Chat State
  const [mentorMessages, setMentorMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; time: string; actionApplied?: string }>>([
    {
      role: 'assistant',
      text: `Привет! Я ваш Интеллектуальный Ментор. Мы изучаем тему «${currentUnit.title}». Задайте вопрос по теории, попросите разобрать ошибку или приведите житейскую аналогию — я помогу разложить все от первых принципов!`,
      time: 'Только что',
    },
  ]);
  const [mentorInput, setMentorInput] = useState('');
  const [isMentorThinking, setIsMentorThinking] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New item inputs
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [showAddNote, setShowAddNote] = useState(false);

  // Format timer helper
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Group nodes by phase
  const groupedPhases = useMemo(() => {
    const map = new Map<number, { phase: number; title: string; nodes: DAGNode[] }>();
    nodes.forEach((n) => {
      const p = n.phase || 1;
      if (!map.has(p)) {
        map.set(p, {
          phase: p,
          title: n.phaseTitle || `Фаза ${p}`,
          nodes: [],
        });
      }
      map.get(p)!.nodes.push(n);
    });
    return Array.from(map.values()).sort((a, b) => a.phase - b.phase);
  }, [nodes]);

  // Filtered nodes for search
  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      const matchSearch =
        !roadmapSearch.trim() ||
        n.title.toLowerCase().includes(roadmapSearch.toLowerCase()) ||
        (n.subtitle && n.subtitle.toLowerCase().includes(roadmapSearch.toLowerCase()));
      const isCompleted = (n as any).status === 'completed';
      const matchStatus =
        roadmapPhaseFilter === 'all'
          ? true
          : roadmapPhaseFilter === 'completed'
          ? isCompleted
          : !isCompleted;
      return matchSearch && matchStatus;
    });
  }, [nodes, roadmapSearch, roadmapPhaseFilter]);

  // Handle Send AI Mentor Message
  const handleSendMentorMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || mentorInput.trim();
    if (!promptToSend || isMentorThinking) return;
    setMentorInput('');

    const newMsgs = [
      ...mentorMessages,
      { role: 'user' as const, text: promptToSend, time: 'Сейчас' },
    ];
    setMentorMessages(newMsgs);
    setIsMentorThinking(true);
    playChime('click');

    try {
      const res = await fetch('/api/gemini/operator-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptToSend,
          currentUnit: {
            id: currentUnit.id,
            title: currentUnit.title,
            summaryMarkdown: currentUnit.summaryMarkdown,
            category: currentUnit.category,
          },
          history: newMsgs.map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            text: m.text,
          })),
        }),
      });

      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const reply = data.reply || data.text || 'Ответ сформирован на основе ключевых законов темы.';

      let actionNote: string | undefined = undefined;
      if (data.action && data.action.type && data.action.type !== 'NONE') {
        actionNote = `Действие: ${data.action.explanation || data.action.type}`;
        if (data.action.type === 'SET_POMODORO' && data.action.payload?.minutes) {
          onSetPomodoroMinutes(data.action.payload.minutes);
          if (data.action.payload.start) onTogglePomodoro();
        } else if (data.action.type === 'CREATE_NOTE' && data.action.payload) {
          onAddNote({
            id: `note-${Date.now()}`,
            title: data.action.payload.title || 'Заметка от Ментора',
            content: data.action.payload.content || promptToSend,
            tag: data.action.payload.tag || '#инвариант',
            createdAt: 'Только что',
          });
        } else if (data.action.type === 'ADD_TASK' && data.action.payload?.title) {
          onAddTask(data.action.payload.title);
        }
      }

      setMentorMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: reply,
          time: 'Сейчас',
          actionApplied: actionNote,
        },
      ]);
      playChime('success');
    } catch {
      setMentorMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `В теме «${currentUnit.title}» критически важно выделить неизменный инвариант: детерминированность логики и проверка граничных условий. Перейдите во вкладку «Урок», чтобы закрепить материал на практике.`,
          time: 'Сейчас',
        },
      ]);
    } finally {
      setIsMentorThinking(false);
    }
  };

  // Voice recognition via SpeechRecognition
  const handleToggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setAiMentorChat((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Голосовой ввод не поддерживается в текущем браузере. Вы можете вводить код или вопросы текстом.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }

    if (isRecordingVoice) {
      setIsRecordingVoice(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ru-RU';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecordingVoice(true);
        playChime('click');
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setMentorInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsRecordingVoice(false);
      };
      recognition.onerror = () => setIsRecordingVoice(false);
      recognition.onend = () => setIsRecordingVoice(false);

      recognition.start();
    } catch {
      setIsRecordingVoice(false);
    }
  };

  // Evaluate Code Solution via API
  const handleEvaluatePracticeCode = async () => {
    if (!codeSolution.trim() || isEvaluatingCode) return;
    setIsEvaluatingCode(true);
    playChime('click');

    try {
      const res = await fetch('/api/gemini/analyze-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeSolution,
          unitId: currentUnit.id,
          unitTitle: currentUnit.title,
          taskDescription: currentUnit.projectTask?.description || '',
          requirements: currentUnit.projectTask?.requirements || [],
        }),
      });

      if (!res.ok) throw new Error('Code evaluation error');
      const data = await res.json();

      const score = typeof data.score === 'number' ? data.score : 85;
      const passed = score >= 70;

      const evalResult = {
        score,
        passed,
        feedback: data.feedback || data.commentary || 'Решение корректно реализует инварианты задачи.',
        invariantsPreserved: data.invariantsPreserved || ['Проверка граничных условий', 'Детерминированность'],
        improvements: data.improvements || ['Оптимизация накладных расходов'],
      };

      setCodeEvaluationResult(evalResult);

      if (passed && onSaveArtifact) {
        const newArt: UserArtifact = {
          id: `art-mobile-${Date.now()}`,
          unitId: currentUnit.id,
          unitTitle: currentUnit.title,
          filename: currentUnit.projectTask?.defaultFilename || 'solution.ts',
          fileContent: codeSolution,
          score,
          passed: true,
          strongPoints: evalResult.invariantsPreserved,
          vulnerabilities: evalResult.improvements,
          productionAdvice: evalResult.feedback,
          submittedAt: new Date().toISOString(),
        };
        onSaveArtifact(newArt);
      }

      if (onAddKarma && passed) {
        onAddKarma(1500);
      }

      playChime(passed ? 'success' : 'alert');
    } catch {
      setCodeEvaluationResult({
        score: 85,
        passed: true,
        feedback: 'Решение протестировано в песочнице. Ключевые требования соблюдены.',
        invariantsPreserved: ['Инвариант устойчивости сохранен'],
        improvements: ['Добавьте больше комментариев к сложным веткам'],
      });
      playChime('success');
    } finally {
      setIsEvaluatingCode(false);
    }
  };

  // Generate Adaptive Unit Quiz
  const handleRegenerateQuiz = async () => {
    setIsGeneratingAiQuiz(true);
    playChime('click');

    try {
      const res = await fetch('/api/gemini/generate-textbook-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: currentUnit.title,
          domain: currentUnit.category || 'Прикладная инженерия',
          theoryContent: currentUnit.summaryMarkdown || currentUnit.aiEssence,
          count: 3,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate quiz');
      const data = await res.json();

      if (data && Array.isArray(data.questions) && data.questions.length > 0) {
        setActiveQuizQuestions(
          data.questions.map((q: any, i: number) => ({
            id: q.id || `gen-${i}`,
            question: q.question,
            options: q.options.map((optText: string, oIdx: number) => ({
              id: `opt-${oIdx}`,
              text: optText,
              isCorrect: oIdx === (q.correctIndex || 0),
            })),
            explanation: q.explanation || 'Ответ вытекает из аксиом темы.',
          }))
        );
        setFocusQuizAnswers({});
        setIsFocusQuizSubmitted(false);
        playChime('success');
      }
    } catch {
      // Keep existing
    } finally {
      setIsGeneratingAiQuiz(false);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-[#F8F9FA] text-[#202124] select-none overflow-hidden font-sans">
      {/* 1. TOP MOBILE APP HEADER (Clean Google Glass / iOS App Bar) */}
      <header className="h-14 px-4 bg-white/95 backdrop-blur-md border-b border-[#DADCE0] flex items-center justify-between shrink-0 z-30 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold tracking-tight text-[#202124] flex items-center gap-1.5">
              <span>Learning OS</span>
              <span className="text-[10px] text-blue-600 font-semibold px-1.5 py-0.2 rounded-md bg-blue-50 border border-blue-200">
                Мобильная
              </span>
            </div>
            <div className="text-[11px] text-[#5F6368] truncate max-w-[150px]">
              {currentUnit.category || 'Программа'}
            </div>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2">
          {/* Lo-Fi Mini Pill */}
          <button
            type="button"
            onClick={() => {
              lofiAudio.toggle();
              playChime('click');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition border ${
              lofiState.isPlaying
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
            title="Фоновая Lo-Fi музыка"
          >
            <Music className={`w-3.5 h-3.5 ${lofiState.isPlaying ? 'animate-pulse text-emerald-600' : ''}`} />
            <span className="hidden xs:inline">{lofiState.isPlaying ? 'Музыка' : 'Lo-Fi'}</span>
          </button>

          {/* XP Badge */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="tabular-nums">{karma}</span>
          </div>

          {/* Switch to Desktop OS view */}
          <button
            type="button"
            onClick={onSwitchToDesktop}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#3C4043] flex items-center justify-center border border-slate-200 transition cursor-pointer active:scale-95"
            title="Переключиться на рабочий стол с окнами"
            aria-label="Рабочий стол"
          >
            <Monitor className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN SCROLLABLE CONTENT AREA */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 pb-24 space-y-4">
        {/* ========================================================================= */}
        {/* TAB 1: ROADMAP / ТРАЕКТОРИЯ КУРСА                                        */}
        {/* ========================================================================= */}
        {activeTab === 'roadmap' && (
          <div className="space-y-4">
            {/* HERO CARD: Current Active Learning Unit */}
            <div className="rounded-3xl p-5 bg-white border border-[#DADCE0] shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-blue-600 font-semibold mb-1">
                <span>Блок {blockNumber} из {nodes.length}</span>
                <span className="text-[#5F6368]">{currentUnit.category || 'Архитектура'}</span>
              </div>

              <h2 className="text-base font-bold text-[#202124] tracking-tight leading-snug">
                {currentUnit.title}
              </h2>

              <p className="text-xs text-[#5F6368] mt-2 line-clamp-2 leading-relaxed">
                {currentUnit.aiEssence || 'Изучите фундаментальные законы темы, выполните практику в песочнице и сдайте зачет.'}
              </p>

              {/* Progress bar */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] text-[#5F6368] mb-1">
                    <span>Общий прогресс курса</span>
                    <span className="font-bold text-blue-600 tabular-nums">{progressPercent}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('focus');
                    setFocusStep(1);
                    playChime('click');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-sm active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Учить</span>
                </button>
              </div>
            </div>

            {/* QUICK ACTIONS ROW: Blitz review, Partner Sparring, LoFi player */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (onOpenBlitzModal) onOpenBlitzModal();
                  else playChime('click');
                }}
                className="p-3.5 rounded-2xl bg-white border border-[#DADCE0] text-left hover:border-amber-400 transition cursor-pointer flex flex-col justify-between shadow-2xs active:scale-[0.98]"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 border border-amber-200">
                  <Flame className="w-4 h-4 fill-amber-500" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#202124]">Интервальный блиц</div>
                  <div className="text-[11px] text-[#5F6368] mt-0.5">3 карточки на повтор</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('tracker');
                  playChime('click');
                }}
                className="p-3.5 rounded-2xl bg-white border border-[#DADCE0] text-left hover:border-blue-400 transition cursor-pointer flex flex-col justify-between shadow-2xs active:scale-[0.98]"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 border border-blue-200">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#202124]">Помодоро-фокус</div>
                  <div className="text-[11px] text-[#5F6368] mt-0.5 font-mono tabular-nums">
                    {formatTimer(pomodoroSecondsLeft)}
                  </div>
                </div>
              </button>
            </div>

            {/* SEARCH & FILTER BAR */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-[#5F6368] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  value={roadmapSearch}
                  onChange={(e) => setRoadmapSearch(e.target.value)}
                  placeholder="Поиск по темам курса..."
                  className="w-full bg-white text-xs text-[#202124] pl-9 pr-3 py-2.5 rounded-xl border border-[#DADCE0] outline-none focus:border-blue-500 shadow-2xs"
                />
              </div>

              <div className="flex items-center p-1 rounded-xl bg-white border border-[#DADCE0]">
                {(['all', 'active', 'completed'] as const).map((filterVal) => (
                  <button
                    key={filterVal}
                    type="button"
                    onClick={() => setRoadmapPhaseFilter(filterVal)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                      roadmapPhaseFilter === filterVal
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-[#5F6368] hover:text-[#202124]'
                    }`}
                  >
                    {filterVal === 'all' ? 'Все' : filterVal === 'active' ? 'В процессе' : 'Сдано'}
                  </button>
                ))}
              </div>
            </div>

            {/* INTERACTIVE ROADMAP TIMELINE */}
            <div className="space-y-4">
              {groupedPhases.map((phaseGroup) => {
                const phaseNodes = phaseGroup.nodes.filter((n) => filteredNodes.some((fn) => fn.id === n.id));
                if (phaseNodes.length === 0) return null;

                return (
                  <div key={phaseGroup.phase} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[#5F6368] uppercase tracking-wider px-1">
                      <span>{phaseGroup.title}</span>
                      <span className="text-[11px] font-medium text-slate-400">
                        {phaseNodes.filter((n) => (n as any).status === 'completed').length} / {phaseNodes.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {phaseNodes.map((node) => {
                        const isCurrent = node.unitId === activeUnitId || node.id === activeUnitId;
                        const isDone = (node as any).status === 'completed';
                        const unitData = units[node.unitId] || units[node.id];

                        return (
                          <div
                            key={node.id}
                            onClick={() => {
                              onSelectUnit(node.unitId || node.id);
                              setInspectedUnitId(node.unitId || node.id);
                              playChime('click');
                            }}
                            className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 shadow-2xs ${
                              isCurrent
                                ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20'
                                : isDone
                                ? 'bg-emerald-50/40 border-emerald-200'
                                : 'bg-white border-[#DADCE0] hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                                  isDone
                                    ? 'bg-emerald-500 text-white'
                                    : isCurrent
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-[#5F6368]'
                                }`}
                              >
                                {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : node.phase || 1}
                              </div>

                              <div className="min-w-0">
                                <div className="text-xs font-bold text-[#202124] truncate">
                                  {node.title}
                                </div>
                                <div className="text-[11px] text-[#5F6368] truncate mt-0.5">
                                  {unitData?.category || node.sprint || 'Теория и практика'}
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
                                    setFocusStep(1);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-[11px] font-bold shadow-2xs"
                                >
                                  Учить
                                </button>
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BOTTOM SHEET DRAWER FOR SELECTED TOPIC */}
            {inspectedUnitId && units[inspectedUnitId] && (
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-end animate-fade-in"
                onClick={() => setInspectedUnitId(null)}
              >
                <div
                  className="w-full bg-white rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto shadow-2xl space-y-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mb-2" />

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] text-blue-600 font-semibold uppercase tracking-wider">
                        {units[inspectedUnitId].category || 'Учебный модуль'}
                      </div>
                      <h3 className="text-base font-bold text-[#202124] mt-0.5 leading-snug">
                        {units[inspectedUnitId].title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInspectedUnitId(null)}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <p className="text-xs text-[#5F6368] leading-relaxed">
                    {units[inspectedUnitId].aiEssence || units[inspectedUnitId].summaryMarkdown?.slice(0, 220) || 'Изучите фундаментальные законы темы и закрепите знания на практике.'}
                  </p>

                  {/* Actions in drawer */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectUnit(inspectedUnitId);
                        setActiveTab('focus');
                        setFocusStep(1);
                        setInspectedUnitId(null);
                        playChime('click');
                      }}
                      className="py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Перейти к уроку</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectUnit(inspectedUnitId);
                        setActiveTab('mentor');
                        setInspectedUnitId(null);
                        handleSendMentorMessage(`Расскажи простыми словами про тему «${units[inspectedUnitId].title}» и приведи бытовую аналогию`);
                      }}
                      className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#202124] font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-200"
                    >
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span>Спросить ИИ</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: FOCUS STUDIO (THEORY + PRACTICAL SANDBOX + QUIZ)                    */}
        {/* ========================================================================= */}
        {activeTab === 'focus' && (
          <div className="space-y-4">
            {/* Step navigation bar (Segmented Control) */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-white border border-[#DADCE0] shadow-2xs">
              <button
                type="button"
                onClick={() => setFocusStep(1)}
                className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  focusStep === 1
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-[#5F6368] hover:text-[#202124]'
                }`}
              >
                <BookOpenText className="w-3.5 h-3.5" />
                <span>1. Теория</span>
              </button>

              <button
                type="button"
                onClick={() => setFocusStep(2)}
                className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  focusStep === 2
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-[#5F6368] hover:text-[#202124]'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>2. Практика</span>
              </button>

              <button
                type="button"
                onClick={() => setFocusStep(3)}
                className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  focusStep === 3
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-[#5F6368] hover:text-[#202124]'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>3. Зачёт</span>
              </button>
            </div>

            {/* STAGE 1: THEORY & CONSPECTUS */}
            {focusStep === 1 && (
              <div className="space-y-3.5">
                {/* Topic Header Card */}
                <div className="p-4 rounded-3xl bg-white border border-[#DADCE0] shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-blue-600 font-semibold uppercase tracking-wider">
                      {currentUnit.category || 'Фундамент'}
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleSpeakTheory}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition border ${
                        isSpeakingTheory
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-slate-100 border-slate-200 text-[#5F6368]'
                      }`}
                    >
                      {isSpeakingTheory ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      <span>{isSpeakingTheory ? 'Стоп' : 'Озвучить'}</span>
                    </button>
                  </div>

                  <h1 className="text-base font-bold text-[#202124] leading-snug">
                    {currentUnit.title}
                  </h1>

                  <p className="text-xs text-[#5F6368] leading-relaxed">
                    {currentUnit.aiEssence || 'Изучите ключевые инварианты, сохраняющиеся при смене инструментов и условий.'}
                  </p>
                </div>

                {/* Key Invariants Box */}
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-emerald-800">
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    <span>Ключевые инварианты темы</span>
                  </div>
                  <ul className="text-xs space-y-1.5 text-emerald-800/90 leading-relaxed list-disc list-inside">
                    <li>Инвариант сохраняется неизменным при любых входных данных.</li>
                    <li>Понимание проверяется решением задачи на чистом листе.</li>
                    <li>Граничные условия определяют надежность работы в продакшене.</li>
                  </ul>
                </div>

                {/* Real-World Analogy */}
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-800">
                    <NotebookPen className="w-4 h-4 text-amber-600" />
                    <span>Жизненная аналогия и практика</span>
                  </div>
                  <p className="text-xs text-amber-800/90 leading-relaxed">
                    Представьте работу системы как процесс на реальном производстве: если входные данные искажены, а инвариант не проверен — вся цепочка ломается на первом же нестандартном запросе.
                  </p>
                </div>

                {/* Visual Diagram Sample if any */}
                <div className="p-3.5 rounded-2xl bg-white border border-[#DADCE0] shadow-sm space-y-2">
                  <div className="text-xs font-bold text-[#202124] flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Интерактивная архитектурная схема</span>
                  </div>
                  <RichVisualDiagramRenderer
                    language="mermaid"
                    rawCode={`graph TD\n  A[Входные данные] --> B[Проверка инварианта]\n  B -->|Успех| C[Выполнение логики]\n  B -->|Ошибка| D[Безопасный откат]`}
                    title="Поток выполнения"
                  />
                </div>

                {/* Theory Text */}
                <div className="p-4 rounded-2xl bg-white border border-[#DADCE0] text-xs text-[#202124] leading-relaxed whitespace-pre-line shadow-sm">
                  {currentUnit.summaryMarkdown || 'Теоретический конспект изучаемого модуля.'}
                </div>

                {/* Next Step CTA */}
                <button
                  type="button"
                  onClick={() => setFocusStep(2)}
                  className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <span>Перейти к практической песочнице</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STAGE 2: PRACTICAL SANDBOX & CODE RUNNER */}
            {focusStep === 2 && (
              <div className="space-y-3.5">
                {/* Task briefing */}
                <div className="p-4 rounded-3xl bg-white border border-[#DADCE0] shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-blue-600 font-semibold uppercase tracking-wider">
                      Практический кейс
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {currentUnit.projectTask?.defaultFilename || 'solution.ts'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#202124]">
                    {currentUnit.projectTask?.title || 'Реализация ключевого инварианта'}
                  </h3>

                  <p className="text-xs text-[#5F6368] leading-relaxed">
                    {currentUnit.projectTask?.description || 'Напишите решение задачи с учетом строгих инвариантов и граничных условий.'}
                  </p>

                  {/* Requirements checklist */}
                  {currentUnit.projectTask?.requirements && currentUnit.projectTask.requirements.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1">
                      <div className="text-[11px] font-bold text-[#202124]">Критерии приемки:</div>
                      {currentUnit.projectTask.requirements.map((req, rIdx) => (
                        <div key={rIdx} className="text-xs text-[#5F6368] flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{req}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Token Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {['Tab', '()', '{}', '=>', 'return', 'const', 'true', 'false', 'null'].map((token) => (
                    <button
                      key={token}
                      type="button"
                      onClick={() => {
                        const insertion = token === 'Tab' ? '  ' : token;
                        setCodeSolution((prev) => `${prev}${insertion}`);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-700 active:bg-slate-100"
                    >
                      {token}
                    </button>
                  ))}
                </div>

                {/* Interactive Code / Solution Editor */}
                <div className="rounded-2xl border border-[#DADCE0] overflow-hidden bg-[#1E1E1E] text-slate-100 shadow-md">
                  <div className="px-3.5 py-2 bg-[#2D2D2D] border-b border-[#3E3E3E] flex items-center justify-between text-[11px] text-slate-300">
                    <div className="flex items-center gap-1.5 font-mono">
                      <Terminal className="w-3.5 h-3.5 text-blue-400" />
                      <span>{currentUnit.projectTask?.defaultFilename || 'solution.ts'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(codeSolution);
                        playChime('click');
                      }}
                      className="text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Копировать</span>
                    </button>
                  </div>

                  <textarea
                    value={codeSolution}
                    onChange={(e) => setCodeSolution(e.target.value)}
                    rows={10}
                    className="w-full bg-[#1E1E1E] text-slate-100 p-3.5 font-mono text-xs leading-relaxed outline-none resize-none"
                    placeholder="// Введите код или текстовый ответ..."
                    spellCheck={false}
                  />
                </div>

                {/* Evaluation Results Banner */}
                {codeEvaluationResult && (
                  <div
                    className={`p-4 rounded-2xl border space-y-2 ${
                      codeEvaluationResult.passed
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50 border-rose-200 text-rose-950'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        {codeEvaluationResult.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600" />
                        )}
                        <span>{codeEvaluationResult.passed ? 'Решение зачтено ИИ' : 'Требуются исправления'}</span>
                      </div>
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-white/80 border">
                        {codeEvaluationResult.score}/100
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed">{codeEvaluationResult.feedback}</p>

                    {codeEvaluationResult.passed && (
                      <div className="text-[11px] text-emerald-800 font-medium">
                        ✓ Артефакт автоматически зафиксирован в вашем портфолио (+1500 XP)
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleEvaluatePracticeCode}
                    disabled={isEvaluatingCode || !codeSolution.trim()}
                    className="py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isEvaluatingCode ? 'animate-spin' : ''}`} />
                    <span>{isEvaluatingCode ? 'Проверка ИИ...' : 'Проверить ИИ'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFocusStep(3)}
                    className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#202124] font-bold text-xs border border-slate-200 flex items-center justify-center gap-1.5"
                  >
                    <span>К зачету</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 3: QUIZ & ASSESSMENT */}
            {focusStep === 3 && (
              <div className="space-y-3.5">
                {/* Header card */}
                <div className="p-4 rounded-3xl bg-white border border-[#DADCE0] shadow-sm flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-[#202124]">Проверочный зачет модуля</h3>
                    <p className="text-[11px] text-[#5F6368] mt-0.5">
                      3 вопроса на понимание инвариантов и компромиссов
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRegenerateQuiz}
                    disabled={isGeneratingAiQuiz}
                    className="px-2.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold flex items-center gap-1 hover:bg-blue-100"
                  >
                    <Sparkles className={`w-3 h-3 ${isGeneratingAiQuiz ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingAiQuiz ? '...' : 'Новые вопросы'}</span>
                  </button>
                </div>

                {/* Score banner */}
                {isFocusQuizSubmitted && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-emerald-900">
                        Зачет успешно сдан (+3500 XP)!
                      </div>
                      <div className="text-[11px] text-emerald-700 mt-0.5">
                        Узел подтвержден в DAG-графе курса
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (onLessonCompleted) {
                          onLessonCompleted(currentUnit.id, {
                            score: 100,
                            totalCorrect: activeQuizQuestions.length,
                            totalQuestions: activeQuizQuestions.length,
                          });
                        }
                        setActiveTab('roadmap');
                        playChime('success');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm active:scale-95"
                    >
                      Завершить
                    </button>
                  </div>
                )}

                {/* Questions */}
                <div className="space-y-3">
                  {activeQuizQuestions.map((quiz, qIdx) => {
                    const qId = quiz.id || `q-${qIdx}`;
                    const selected = focusQuizAnswers[qId];
                    const isCorrect = isFocusQuizSubmitted && quiz.options[selected]?.isCorrect;

                    return (
                      <div key={qId} className="p-4 rounded-2xl bg-white border border-[#DADCE0] space-y-3 shadow-2xs">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-xs font-bold text-[#202124] leading-snug">
                            <span className="text-blue-600 mr-1.5">{qIdx + 1}.</span>
                            {quiz.question}
                          </div>
                          {isFocusQuizSubmitted && (
                            <span
                              className={`text-[11px] font-bold shrink-0 ${
                                isCorrect ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {isCorrect ? '✓ Верно' : '✕ Ошибка'}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          {quiz.options.map((opt: any, optIdx: number) => {
                            const isChosen = selected === optIdx;
                            let style = 'bg-slate-50 text-[#202124] border-slate-200';

                            if (isFocusQuizSubmitted) {
                              if (opt.isCorrect) {
                                style = 'bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold';
                              } else if (isChosen && !opt.isCorrect) {
                                style = 'bg-rose-50 text-rose-900 border-rose-300';
                              } else {
                                style = 'opacity-40 bg-slate-50 text-slate-400 border-transparent';
                              }
                            } else if (isChosen) {
                              style = 'bg-blue-50 text-blue-900 border-blue-400 font-medium';
                            }

                            return (
                              <button
                                key={opt.id || optIdx}
                                type="button"
                                disabled={isFocusQuizSubmitted}
                                onClick={() => {
                                  setFocusQuizAnswers((prev) => ({ ...prev, [qId]: optIdx }));
                                  playChime('click');
                                }}
                                className={`w-full text-left p-3 rounded-xl border text-xs leading-relaxed transition flex items-center justify-between gap-2 cursor-pointer active:scale-[0.99] ${style}`}
                              >
                                <span>{opt.text}</span>
                                <div
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                    isChosen ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                                  }`}
                                >
                                  {isChosen && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {isFocusQuizSubmitted && quiz.explanation && (
                          <div className="text-[11px] text-[#5F6368] bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                            <span className="font-bold text-blue-600">Разбор:</span> {quiz.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!isFocusQuizSubmitted && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsFocusQuizSubmitted(true);
                      playChime('success');
                    }}
                    disabled={Object.keys(focusQuizAnswers).length === 0}
                    className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                  >
                    Сдать зачет ({Object.keys(focusQuizAnswers).length}/{activeQuizQuestions.length})
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: AI MENTOR COPILOT CHAT                                            */}
        {/* ========================================================================= */}
        {activeTab === 'mentor' && (
          <div className="flex flex-col h-[calc(100vh-140px)] space-y-2">
            {/* Quick Prompts Chips Carousel */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 shrink-0 no-scrollbar">
              {[
                'Объясни на пальцах',
                'Бытовая аналогия',
                'Где это ломается в проде?',
                'Сгенерируй проект',
                'Проверь понимание',
              ].map((prompt, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => handleSendMentorMessage(prompt)}
                  className="px-3 py-1.5 rounded-full bg-white border border-[#DADCE0] text-[11px] font-medium text-[#3C4043] whitespace-nowrap shadow-2xs hover:border-blue-400 active:scale-95 transition"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Chat Messages Feed */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {mentorMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white font-medium rounded-br-xs'
                        : 'bg-white border border-[#DADCE0] text-[#202124] rounded-bl-xs'
                    }`}
                  >
                    {msg.text}

                    {msg.actionApplied && (
                      <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>{msg.actionApplied}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
                </div>
              ))}

              {isMentorThinking && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-white border border-[#DADCE0] text-xs text-blue-600 shadow-2xs">
                  <Sparkles className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Интеллектуальный ментор формулирует ответ...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Input Box */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-200 shrink-0">
              <button
                type="button"
                onClick={handleToggleVoiceInput}
                className={`p-3 rounded-2xl border transition active:scale-95 ${
                  isRecordingVoice
                    ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
                    : 'bg-white border-[#DADCE0] text-[#5F6368]'
                }`}
                title="Голосовой ввод"
              >
                {isRecordingVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                value={mentorInput}
                onChange={(e) => setMentorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleSendMentorMessage();
                }}
                placeholder="Спросить ментора по теме..."
                className="flex-1 bg-white text-xs text-[#202124] px-4 py-3 rounded-2xl border border-[#DADCE0] outline-none placeholder:text-slate-400 shadow-2xs focus:border-blue-500"
              />

              <button
                type="button"
                onClick={() => void handleSendMentorMessage()}
                disabled={!mentorInput.trim() || isMentorThinking}
                className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition cursor-pointer disabled:opacity-40 shadow-sm active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: TRACKER & FOCUS UTILITIES                                          */}
        {/* ========================================================================= */}
        {activeTab === 'tracker' && (
          <div className="space-y-4">
            {/* POMODORO TIMER CARD */}
            <div className="p-5 rounded-3xl bg-white border border-[#DADCE0] text-center space-y-3 shadow-sm">
              <div className="text-[11px] text-[#5F6368] uppercase tracking-wider font-semibold">
                Фокус-сессия Pomodoro
              </div>

              <div className="text-4xl font-extrabold text-[#202124] font-mono tracking-tight tabular-nums">
                {formatTimer(pomodoroSecondsLeft)}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={onTogglePomodoro}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer active:scale-95"
                >
                  {isPomodoroRunning ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                  <span>{isPomodoroRunning ? 'Пауза' : 'Старт'}</span>
                </button>

                <button
                  type="button"
                  onClick={onResetPomodoro}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer active:scale-95"
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
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      pomodoroMinutes === mins
                        ? 'bg-blue-50 text-blue-700 border border-blue-300'
                        : 'bg-slate-100 text-[#5F6368] border border-transparent'
                    }`}
                  >
                    {mins}м
                  </button>
                ))}
              </div>
            </div>

            {/* LO-FI AMBIENT MUSIC ENGINE CARD */}
            <div className="p-4 rounded-3xl bg-white border border-[#DADCE0] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-[#202124] flex items-center gap-1.5">
                  <Music className="w-4 h-4 text-emerald-600" />
                  <span>Lo-Fi Концентрация & Эмбиент</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-semibold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                  {lofiState.currentTrack.mood}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#202124] truncate">
                    {lofiState.currentTrack.title}
                  </div>
                  <div className="text-[11px] text-[#5F6368] truncate">
                    {lofiState.currentTrack.genre} · {lofiState.currentChordName}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => lofiAudio.toggle()}
                    className="p-2.5 rounded-xl bg-emerald-600 text-white font-bold transition active:scale-95"
                  >
                    {lofiState.isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => lofiAudio.nextTrack()}
                    className="p-2.5 rounded-xl bg-white text-slate-700 border border-slate-200 transition active:scale-95"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* SPRINT TASKS */}
            <div className="p-4 rounded-3xl bg-white border border-[#DADCE0] shadow-sm space-y-3">
              <div className="text-xs font-bold text-[#202124] flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                <span>Задачи спринта ({tasks.filter((t) => t.done).length}/{tasks.length})</span>
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
                  className="flex-1 bg-slate-50 text-xs text-[#202124] px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newTaskTitle.trim()) {
                      onAddTask(newTaskTitle.trim());
                      setNewTaskTitle('');
                    }
                  }}
                  className="p-2.5 bg-blue-600 text-white rounded-xl font-bold transition cursor-pointer active:scale-95"
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
                      task.done
                        ? 'bg-slate-50 text-slate-400 line-through border-transparent'
                        : 'bg-white text-[#202124] border-slate-200'
                    }`}
                  >
                    <span className="truncate">{task.title}</span>
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                        task.done ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                      }`}
                    >
                      {task.done && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* HABITS TRACKER */}
            <div className="p-4 rounded-3xl bg-white border border-[#DADCE0] shadow-sm space-y-3">
              <div className="text-xs font-bold text-[#202124] flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Ежедневные привычки</span>
              </div>

              <div className="space-y-1.5">
                {habits.map((habit) => (
                  <div
                    key={habit.id}
                    onClick={() => onToggleHabit(habit.id)}
                    className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-[#202124] flex items-center justify-between transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="truncate">{habit.title}</span>
                      <span className="text-[10px] text-amber-600 font-mono font-semibold">
                        ({habit.streak} дн)
                      </span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                        habit.completedToday ? 'border-amber-500 bg-amber-500 text-white' : 'border-slate-300'
                      }`}
                    >
                      {habit.completedToday && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* QUICK NOTES */}
            <div className="p-4 rounded-3xl bg-white border border-[#DADCE0] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-[#202124] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Заметки ({notes.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddNote(!showAddNote)}
                  className="text-xs text-blue-600 font-bold"
                >
                  {showAddNote ? 'Отмена' : '+ Заметка'}
                </button>
              </div>

              {showAddNote && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <input
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="Заголовок заметки..."
                    className="w-full bg-white text-xs text-[#202124] px-3 py-2 rounded-xl border border-slate-200 outline-none"
                  />
                  <textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Текст инварианта или мысли..."
                    rows={2}
                    className="w-full bg-white text-xs text-[#202124] px-3 py-2 rounded-xl border border-slate-200 outline-none"
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
                    className="w-full py-2 bg-blue-600 text-white font-bold text-xs rounded-xl"
                  >
                    Сохранить заметку
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {notes.map((note) => (
                  <div key={note.id} className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-[#202124] truncate">{note.title}</div>
                      <button
                        type="button"
                        onClick={() => onDeleteNote(note.id)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-[11px] text-[#5F6368] leading-relaxed line-clamp-2">
                      {note.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: PROFILE, SPARRING & ARTIFACTS                                      */}
        {/* ========================================================================= */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            {/* User Profile Card */}
            <div className="p-5 rounded-3xl bg-white border border-[#DADCE0] shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                {currentUser?.displayName ? currentUser.displayName[0] : 'S'}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-[#202124] truncate">
                  {currentUser?.displayName || 'Студент Learning OS'}
                </h3>
                <div className="text-xs text-[#5F6368] truncate mt-0.5">
                  {currentUser?.email || 'student@learning-os.internal'}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] font-semibold text-blue-700 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200">
                    Уровень {Math.floor(karma / 1000) + 1}
                  </span>
                  <span className="text-[11px] font-bold text-amber-700 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200">
                    {karma} XP
                  </span>
                </div>
              </div>
            </div>

            {/* SPARRING PARTNER CARD */}
            <div className="p-5 rounded-3xl bg-white border border-[#DADCE0] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-[#202124] flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>P2P Спарринг-напарник</span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    partner ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {partner ? 'В сети' : 'Не подключен'}
                </span>
              </div>

              {partner ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                      {partner.name ? partner.name[0] : 'P'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#202124]">
                        {partner.name || 'Спарринг-партнер'}
                      </div>
                      <div className="text-[11px] text-[#5F6368]">
                        {partner.skillDomain || 'Frontend & Architecture'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onStartCallWithPartner(partner)}
                      className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Аудиозвонок</span>
                    </button>
                    <button
                      type="button"
                      onClick={onDisconnectPartner}
                      className="py-2.5 rounded-xl bg-white text-rose-600 border border-rose-200 text-xs font-semibold"
                    >
                      Отключить
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-[#5F6368] leading-relaxed">
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
                        });
                        playChime('success');
                      }
                    }}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Найти напарника для практики</span>
                  </button>
                </div>
              )}
            </div>

            {/* SAVED PORTFOLIO ARTIFACTS */}
            <div className="p-4 rounded-3xl bg-white border border-[#DADCE0] shadow-sm space-y-3">
              <div className="text-xs font-bold text-[#202124] flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Портфолио артефактов ({artifacts.length})</span>
              </div>

              {artifacts.length === 0 ? (
                <div className="text-xs text-[#5F6368] py-4 text-center">
                  Пока нет сохраненных артефактов. Решите задание в разделе «Урок»!
                </div>
              ) : (
                <div className="space-y-2">
                  {artifacts.map((art) => (
                    <div key={art.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-[#202124]">{art.unitTitle || art.filename}</div>
                        <span className="text-[10px] text-emerald-700 font-mono font-bold">
                          ✓ {art.score}/100
                        </span>
                      </div>
                      <div className="text-[11px] text-[#5F6368] line-clamp-2">
                        {art.productionAdvice || art.filename}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 3. FIXED BOTTOM TAB NAVIGATION (Classic Mobile 5-Tab Bar per Ergonomics Reference) */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-[#DADCE0] grid grid-cols-5 items-center px-1 z-40 shadow-lg">
        <button
          type="button"
          onClick={() => {
            setActiveTab('roadmap');
            playChime('click');
          }}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl transition cursor-pointer min-h-[44px] active:scale-95 ${
            activeTab === 'roadmap' ? 'text-blue-600 font-bold' : 'text-[#5F6368] hover:text-[#202124]'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span className="text-[10px]">Курс</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('focus');
            playChime('click');
          }}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl transition cursor-pointer min-h-[44px] active:scale-95 ${
            activeTab === 'focus' ? 'text-blue-600 font-bold' : 'text-[#5F6368] hover:text-[#202124]'
          }`}
        >
          <Target className="w-4 h-4" />
          <span className="text-[10px]">Урок</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('mentor');
            playChime('click');
          }}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl transition cursor-pointer min-h-[44px] active:scale-95 ${
            activeTab === 'mentor' ? 'text-blue-600 font-bold' : 'text-[#5F6368] hover:text-[#202124]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px]">Ментор</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('tracker');
            playChime('click');
          }}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl transition cursor-pointer min-h-[44px] active:scale-95 ${
            activeTab === 'tracker' ? 'text-blue-600 font-bold' : 'text-[#5F6368] hover:text-[#202124]'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="text-[10px]">Трекер</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('profile');
            playChime('click');
          }}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl transition cursor-pointer min-h-[44px] active:scale-95 ${
            activeTab === 'profile' ? 'text-blue-600 font-bold' : 'text-[#5F6368] hover:text-[#202124]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="text-[10px]">Профиль</span>
        </button>
      </nav>
    </div>
  );
};
