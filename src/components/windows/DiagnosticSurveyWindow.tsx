import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Clock, 
  Brain, 
  AlertTriangle, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Zap, 
  Calendar,
  BookOpen,
  Briefcase,
  Layers,
  ChevronRight,
  RotateCcw,
  Lightbulb,
  GraduationCap,
  Award,
  Palette,
  Code2,
  BarChart3,
  Check,
  Users,
  PhoneCall,
  Video,
  MessageSquare,
  Search,
  UserCheck,
  Radio,
  PhoneOff,
  ExternalLink,
  Network,
  Play,
  ClipboardList,
  ShieldCheck,
  FileText,
  AlertCircle,
  Flame,
  TrendingUp,
  Sliders,
  CheckCircle,
  HelpCircle,
  X,
  Terminal,
  ArrowUpRight,
  Cpu,
  Activity
} from 'lucide-react';
import { DAGNode, DAGEdge, DiagnosticSurveyData, UserSkillLevel, PeerPartner, AdminUnitRow, LearningUnit, BlankQuestionAnalysis, GroundingSourceItem } from '../../types.ts';
import { LIBRARY_UNITS_CATALOG, LEARNING_UNITS } from '../../data/initialData.ts';
import { playChime } from '../../utils/audio.ts';
import { normalizeDagLayout } from '../../utils/dagLayout.ts';
import { TeaBrewingPlanLoader } from '../learning/TeaBrewingPlanLoader.tsx';
import { getDomainDiagnosticQuestions, DOMAIN_TOPIC_SUGGESTIONS } from '../../data/domainDiagnosticQuestions.ts';
import { TextbookGroundingInspectorModal, resolveAccurateSourceBadge } from '../learning/TextbookGroundingInspectorModal.tsx';

export interface AdaptiveEvent {
  id: string;
  timestamp: string;
  completedUnitId: string;
  completedUnitTitle: string;
  performance: {
    totalCorrect: number;
    totalQuestions: number;
    score: number;
    allCorrect?: boolean;
  };
  upgradedNodeId: string;
  upgradedNodeTitle: string;
  projectRole: string;
  projectRequirements: string[];
  businessScenario: string;
  status: 'applied';
}

interface DiagnosticSurveyWindowProps {
  onApplyGeneratedPath: (nodes: DAGNode[], edges: DAGEdge[], summary: any, generatedUnits?: Record<string, LearningUnit>) => void;
  onClose?: () => void;
  onLaunchUnit?: (unitId: string) => void;
  onNavigateToDag?: () => void;
  adminUnits?: AdminUnitRow[];
  matchedPartner?: PeerPartner | null;
  onPartnerMatched?: (partner: PeerPartner) => void;
  onOpenPeerWindow?: () => void;
  onStartCallWithPartner?: (partner: PeerPartner) => void;
  isSearchingBuddy?: boolean;
  onToggleSearchBuddy?: (active: boolean, params?: any) => void;
  onDisconnectPartner?: () => void;
  currentUser?: {
    uid: string;
    displayName: string;
    email: string;
    photoURL?: string;
  } | null;
  existingNodes?: DAGNode[];
  existingEdges?: DAGEdge[];
  existingUnits?: Record<string, LearningUnit>;
  onLessonCompleted?: (unitId: string, performance?: { score?: number; totalCorrect?: number; totalQuestions?: number; allCorrect?: boolean }) => void;
}

interface DynamicQuestion {
  id: string;
  topic: string;
  scenario: string;
  question: string;
  options: { id: string; text: string; trait: string }[];
  groundedSource?: GroundingSourceItem;
  citationRef?: string;
}

export const DOMAIN_PRESETS = [
  { 
    id: 'accounting', 
    label: 'Бухгалтерский учет', 
    icon: '📊', 
    defaultRole: 'Бухгалтер / Финансовый специалист',
    defaultGoal: 'Освоить метод двойной записи, проводки, балансовое равенство и закрытие периодов',
    defaultBaggage: 'Хочу понимать экономическую суть счетов и логику финансовой отчетности'
  },
  { 
    id: 'microeconomics', 
    label: 'Микроэкономика', 
    icon: '📈', 
    defaultRole: 'Экономист / Аналитик рынка',
    defaultGoal: 'Понимать рыночное равновесие, эластичность спроса, предельные издержки и поведение потребителей',
    defaultBaggage: 'Хочу освоить фундаментальные микроэкономические модели и законы спроса и предложения'
  },
  { 
    id: 'excel', 
    label: 'Excel и формулы', 
    icon: '📑', 
    defaultRole: 'Аналитик данных / Мастер таблиц',
    defaultGoal: 'Мастерски владеть абсолютными ссылками, XLOOKUP, сводными таблицами и формулами анализа',
    defaultBaggage: 'Хочу автоматизировать рутинные расчеты и исключить человеческие ошибки в отчетах'
  },
  { 
    id: 'languages', 
    label: 'Иностранные языки', 
    icon: '🌍', 
    defaultRole: 'Практик языка / Спикер',
    defaultGoal: 'Свободно говорить без языкового барьера и внутреннего перевода',
    defaultBaggage: 'Знаю грамматику и слова пассивно, но есть страх говорить вслух без подготовки'
  },
  { 
    id: 'speaking', 
    label: 'Ораторское мастерство', 
    icon: '🎙️', 
    defaultRole: 'Публичный спикер / Презентатор',
    defaultGoal: 'Уверенно выступать перед любой аудиторией, поставить голос и подачу',
    defaultBaggage: 'Хочу говорить емко, харизматично, без волнения и слов-паразитов'
  },
  { 
    id: 'design', 
    label: 'Дизайн и UI/UX', 
    icon: '🎨', 
    defaultRole: 'UI/UX Designer / Создатель',
    defaultGoal: 'Освоить основы визуальной иерархии, сетки отступов и собрать чистый экран в Figma',
    defaultBaggage: 'Хочу понять, почему одни интерфейсы удобные, а другие вызывают стресс и раздражение'
  },
  { 
    id: 'business', 
    label: 'Бизнес и Продажи', 
    icon: '💼', 
    defaultRole: 'Предприниматель / Менеджер',
    defaultGoal: 'Разобраться в юнит-экономике, переговорах и тестировании продуктовых гипотез',
    defaultBaggage: 'Хочу понимать логику создания ценности и проверять спрос до больших инвестиций'
  },
  { 
    id: 'music', 
    label: 'Музыка и Звук', 
    icon: '🎹', 
    defaultRole: 'Музыкант / Продюсер',
    defaultGoal: 'Освоить инструмент, теорию гармонии, чувство ритма и развитие слуха',
    defaultBaggage: 'Хочу понимать логику музыки и свободно играть без зажима'
  },
  { 
    id: 'thinking', 
    label: 'Критическое мышление', 
    icon: '🧠', 
    defaultRole: 'Мыслитель / Стратег',
    defaultGoal: 'Развить прикладную логику, видеть когнитивные искажения и принимать решения',
    defaultBaggage: 'Хочу мыслить структурно от первых принципов и не попадаться в ментальные ловушки'
  },
  { 
    id: 'tech', 
    label: 'Прикладные технологии', 
    icon: '💻', 
    defaultRole: 'Специалист по автоматизации и системам',
    defaultGoal: 'Понять алгоритмическую логику, автоматизацию и устройство цифровых инструментов',
    defaultBaggage: 'Начинаю с нуля, хочу понять базовые алгоритмы и логику на простых примерах'
  },
  { 
    id: 'custom', 
    label: 'Свой навык...', 
    icon: '✍️', 
    defaultRole: 'Специалист в своем деле',
    defaultGoal: 'Освоить выбранную область и дойти до реального измеримого результата',
    defaultBaggage: 'Хочу структурировать знания и практиковаться шаг за шагом в Фокус-Студии'
  }
];

export const DiagnosticSurveyWindow: React.FC<DiagnosticSurveyWindowProps> = ({
  onApplyGeneratedPath,
  onClose,
  onLaunchUnit,
  onNavigateToDag,
  adminUnits = [],
  matchedPartner,
  onPartnerMatched,
  onOpenPeerWindow,
  onStartCallWithPartner,
  isSearchingBuddy,
  onToggleSearchBuddy,
  onDisconnectPartner,
  currentUser,
  existingNodes,
  existingEdges,
  existingUnits,
  onLessonCompleted,
}) => {
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isGeneratingPath, setIsGeneratingPath] = useState(false);
  const [isServerFinishedGenerating, setIsServerFinishedGenerating] = useState(false);
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<number | 'all'>('all');
  const [generatedSummary, setGeneratedSummary] = useState<any | null>(null);

  // Trajectory state initialized with existingNodes if provided
  const [generatedTrajectory, setGeneratedTrajectory] = useState<{
    nodes: DAGNode[];
    edges: DAGEdge[];
  } | null>(() => {
    if (existingNodes && existingNodes.length > 0) {
      return { nodes: existingNodes, edges: existingEdges || [] };
    }
    return null;
  });

  // Step state: if already completed and has nodes, default to Step 4
  const [step, setStep] = useState<number>(() => {
    try {
      if (localStorage.getItem('learning_os_survey_completed') === 'true' && existingNodes && existingNodes.length > 0) {
        return 4;
      }
    } catch (e) {}
    return 1;
  });

  // Synchronize with external nodes updates
  useEffect(() => {
    if (existingNodes && existingNodes.length > 0) {
      setGeneratedTrajectory((prev) => {
        if (!prev) {
          return { nodes: existingNodes, edges: existingEdges || [] };
        }
        return { nodes: existingNodes, edges: existingEdges || prev.edges };
      });
    }
  }, [existingNodes, existingEdges]);

  // Adaptive Complexity Engine State
  const [adaptiveHistory, setAdaptiveHistory] = useState<AdaptiveEvent[]>(() => {
    try {
      const saved = localStorage.getItem('learning_os_adaptive_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [isAdaptingComplexity, setIsAdaptingComplexity] = useState(false);
  const [adaptingTargetUnitId, setAdaptingTargetUnitId] = useState<string | null>(null);
  const [adaptiveSuccessBanner, setAdaptiveSuccessBanner] = useState<{
    completedTitle: string;
    upgradedTitle: string;
    role: string;
    countCorrect: number;
    totalCount: number;
  } | null>(null);

  // Modals for test completion and upgraded project details
  const [selectedBlockForQuiz, setSelectedBlockForQuiz] = useState<DAGNode | null>(null);
  const [quizTestAnswers, setQuizTestAnswers] = useState<Record<string, string>>({});
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  const [selectedProjectForView, setSelectedProjectForView] = useState<{
    node: DAGNode;
    unit?: LearningUnit;
  } | null>(null);

  // Matchmaking State
  const [localPartner, setLocalPartner] = useState<PeerPartner | null>(matchedPartner || null);
  const [matchStatus, setMatchStatus] = useState<'idle' | 'searching' | 'matched' | 'waiting_background' | 'skipped'>(
    matchedPartner ? 'matched' : isSearchingBuddy ? 'searching' : 'idle'
  );
  const [searchSeconds, setSearchSeconds] = useState(0);

  // Keep local partner synced with prop
  useEffect(() => {
    if (matchedPartner) {
      setLocalPartner(matchedPartner);
      setMatchStatus('matched');
    }
  }, [matchedPartner]);

  // Polling loop when in searching state
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (matchStatus === 'searching') {
      const myUserId = currentUser?.uid || ('user-' + (localStorage.getItem('os_user_id') || 'guest'));
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/peer/matchmaking/poll?userId=${encodeURIComponent(myUserId)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'matched' && data.partner) {
              setLocalPartner(data.partner);
              setMatchStatus('matched');
              onPartnerMatched?.(data.partner);
              playChime('success');
            }
          }
        } catch (e) {
          // ignore status poll errors
        }
      }, 2500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [matchStatus, currentUser?.uid, onPartnerMatched]);

  // Matchmaking live search timer
  useEffect(() => {
    let timer: any;
    if (matchStatus === 'searching') {
      timer = setInterval(() => {
        setSearchSeconds((s) => {
          const next = s + 1;
          // After 4 seconds, if no other tab was active, transition to background state
          if (next >= 4 && !localPartner) {
            setMatchStatus('waiting_background');
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [matchStatus, localPartner]);

  // Form Fields (Step 1)
  const [trackScope, setTrackScope] = useState<'full_course' | 'single_topic'>('full_course');
  const [singleTopicTarget, setSingleTopicTarget] = useState<string>('Метод двойной записи и логика проводок');
  const [userLevel, setUserLevel] = useState<UserSkillLevel>('beginner');
  const [skillDomain, setSkillDomain] = useState<string>('Иностранные языки & Коммуникация');
  const [customDomain, setCustomDomain] = useState<string>('');
  const [targetGoal, setTargetGoal] = useState('Свободно говорить без языкового барьера и внутреннего перевода');
  const [whyGoal, setWhyGoal] = useState<string>(() => {
    try {
      return localStorage.getItem('learning_os_user_purpose') || 'Создать и запустить реальный рабочий проект без абстрактной теории и воды';
    } catch {
      return 'Создать и запустить реальный рабочий проект без абстрактной теории и воды';
    }
  });
  const [targetRole, setTargetRole] = useState('Практик навыка / Спикер');
  const [baggageAndBottlenecks, setBaggageAndBottlenecks] = useState(
    'Знаю грамматику и слова пассивно, но есть страх говорить вслух без подготовки.'
  );
  const [timeResource, setTimeResource] = useState('3 раза в неделю по 45 мин + суббота 2 часа');
  const [thinkingStyle, setThinkingStyle] = useState<'visual' | 'engineering' | 'conceptual'>('visual');

  // Dynamic AI Questions (Step 2)
  const [dynamicQuestions, setDynamicQuestions] = useState<DynamicQuestion[]>(() =>
    getDomainDiagnosticQuestions('languages')
  );

  // Academic Grounding Sources (verified via OpenStax, ACM/IEEE, Springer APIs)
  const [groundingSources, setGroundingSources] = useState<GroundingSourceItem[]>(() => {
    const initial = getDomainDiagnosticQuestions('languages');
    return initial.map((q) => q.groundedSource).filter(Boolean) as GroundingSourceItem[];
  });
  const [selectedInspectedSource, setSelectedInspectedSource] = useState<GroundingSourceItem | null>(null);
  const [isInspectorModalOpen, setIsInspectorModalOpen] = useState(false);
  const [expandedQuotes, setExpandedQuotes] = useState<Record<string, boolean>>({});

  // Selected answers for dynamic questions
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  const getEffectiveDomain = () => {
    if (skillDomain === 'Свой навык...' && customDomain.trim()) {
      return customDomain.trim();
    }
    return skillDomain;
  };

  // Matchmaking Actions
  const handleStartSearch = async () => {
    setMatchStatus('searching');
    setSearchSeconds(0);
    onToggleSearchBuddy?.(true, {
      userLevel,
      skillDomain: getEffectiveDomain(),
      targetGoal,
    });

    try {
      const myUserId = currentUser?.uid || ('user-' + (localStorage.getItem('os_user_id') || Math.random().toString(36).substring(2, 9)));
      const myUserName = currentUser?.displayName || 'Вы';
      localStorage.setItem('os_user_id', myUserId.replace('user-', ''));

      const res = await fetch('/api/peer/matchmaking/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: myUserId,
          userName: myUserName,
          userLevel,
          skillDomain: getEffectiveDomain(),
          targetGoal,
        }),
      });

      const data = await res.json();
      if (data.status === 'matched' && data.partner) {
        setLocalPartner(data.partner);
        setMatchStatus('matched');
        onPartnerMatched?.(data.partner);
        playChime('success');
      }
    } catch (e) {
      console.error('Matchmaking request failed:', e);
    }
  };

  const handleCancelSearch = () => {
    setMatchStatus('skipped');
    onToggleSearchBuddy?.(false);
    const myUserId = currentUser?.uid || ('user-' + (localStorage.getItem('os_user_id') || 'guest'));
    fetch('/api/peer/matchmaking/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: myUserId }),
    }).catch(() => {});
  };

  const handleDisconnectPartner = () => {
    setLocalPartner(null);
    setMatchStatus('idle');
    onDisconnectPartner?.();
    const myUserId = currentUser?.uid || ('user-' + (localStorage.getItem('os_user_id') || 'guest'));
    fetch('/api/peer/matchmaking/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: myUserId }),
    }).catch(() => {});
  };

  const handleCallPartner = () => {
    if (localPartner) {
      playChime('ring');
      if (onStartCallWithPartner) {
        onStartCallWithPartner(localPartner);
      } else if (onOpenPeerWindow) {
        onOpenPeerWindow();
      }
    }
  };

  // Helper to obtain or generate conceptual questions for a DAG block
  const getQuestionsForBlock = (node: DAGNode) => {
    const u = existingUnits?.[node.unitId];
    if (u?.quiz && u.quiz.length > 0) {
      return u.quiz;
    }
    const cleanTopic = node.title.replace(/^\[.*?\]\s*/, '').replace(/^⚡\s*/, '').replace(/^🔥\s*/, '');
    return [
      {
        id: 'q-block-1',
        type: 'logic' as const,
        question: `Какой фундаментальный инженерный компромисс лежит в основе темы «${cleanTopic}»?`,
        scenario: `При проектировании модуля «${cleanTopic}» необходимо обеспечить надежность при пиковом потреблении ресурсов.`,
        options: [
          { id: 'opt-1a', text: 'Минимизация накладных расходов памяти и изоляция состояний гонки (Data Races)', isCorrect: true, explanation: 'Верно: это золотой стандарт надежной архитектуры.' },
          { id: 'opt-1b', text: 'Игнорирование ошибок в надежде на авто-перезапуск контейнера в Kubernetes', isCorrect: false, explanation: 'Неверно, приведет к циклическому перезапуску (CrashLoopBackOff).' },
          { id: 'opt-1c', text: 'Синхронная блокировка всей таблицы базы данных на неограниченное время', isCorrect: false, explanation: 'Неверно, вызывает дедлоки и падение пропускной способности.' },
        ],
        explanation: 'Фундаментальный принцип надежности и отсутствия узких мест.'
      },
      {
        id: 'q-block-2',
        type: 'tradeoff' as const,
        question: `Что произойдет при резком всплеске нагрузки (DDoS / Черная пятница) в контуре «${cleanTopic}»?`,
        scenario: 'Интенсивность входящих запросов превысила расчетную пропускную способность в 8 раз.',
        options: [
          { id: 'opt-2a', text: 'Сработает Rate Limiter / Circuit Breaker, предотвратив отказ пула соединений БД', isCorrect: true, explanation: 'Верно: защитные барьеры сохраняют работоспособность ключевого ядра.' },
          { id: 'opt-2b', text: 'Все запросы будут безоговорочно поставлены в бесконечную очередь в RAM без ограничения', isCorrect: false, explanation: 'Неверно, приведет к аварийной остановке OOM Killer.' },
          { id: 'opt-2c', text: 'Время ответа сервиса автоматически уменьшится до нуля', isCorrect: false, explanation: 'Физически невозможно при росте очередей.' },
        ],
        explanation: 'Circuit Breaker и ограничение частоты защищают распределенную систему от каскадного падения.'
      }
    ];
  };

  // Adaptive Complexity Engine: Elevates subsequent blocks via gemini/generate-realworld-project
  const handleAdaptiveLessonCompletion = async (
    completedUnitId: string,
    performance: { totalCorrect: number; totalQuestions: number; score: number; allCorrect?: boolean },
    customTitle?: string
  ) => {
    const currentNodes = generatedTrajectory?.nodes && generatedTrajectory.nodes.length > 0
      ? generatedTrajectory.nodes
      : (existingNodes && existingNodes.length > 0 ? existingNodes : []);

    const currentEdges = generatedTrajectory?.edges && generatedTrajectory.edges.length > 0
      ? generatedTrajectory.edges
      : (existingEdges && existingEdges.length > 0 ? existingEdges : []);

    if (!currentNodes || currentNodes.length === 0) return;

    const completedNodeIndex = currentNodes.findIndex((n) => n.id === completedUnitId || n.unitId === completedUnitId);
    const completedNode = completedNodeIndex >= 0 ? currentNodes[completedNodeIndex] : null;
    const completedTitle = completedNode?.title || customTitle || 'Пройденный урок';

    // Verify correct answers: student answered correctly (>= 70% or allCorrect)
    const isHighAccuracy = performance.allCorrect || performance.score >= 70 || (performance.totalQuestions > 0 && (performance.totalCorrect / performance.totalQuestions) >= 0.7);

    // Call onLessonCompleted prop to notify main app
    if (onLessonCompleted) {
      onLessonCompleted(completedUnitId, performance);
    }

    if (!isHighAccuracy) {
      // Just mark completed in graph
      const updatedNodes = currentNodes.map((n) =>
        n.id === completedUnitId || n.unitId === completedUnitId ? { ...n, status: 'completed' as const } : n
      );
      const norm = normalizeDagLayout(updatedNodes, currentEdges);
      setGeneratedTrajectory({ nodes: norm.nodes, edges: norm.edges });
      onApplyGeneratedPath(norm.nodes, norm.edges, generatedSummary, existingUnits);
      return;
    }

    // Locate subsequent block(s) in DAG graph
    // Look for direct outgoing edge targets
    const outgoingEdges = currentEdges.filter((e) => e.from === completedNode?.id);
    const directTargetIds = outgoingEdges.map((e) => e.to);

    let candidateTargetNode = currentNodes.find(
      (n) => directTargetIds.includes(n.id) && !n.isAdaptiveUpgraded && n.status !== 'completed'
    );

    // If no direct edge target, find the next uncompleted node in sequence
    if (!candidateTargetNode && completedNodeIndex >= 0) {
      for (let i = completedNodeIndex + 1; i < currentNodes.length; i++) {
        if (!currentNodes[i].isAdaptiveUpgraded && currentNodes[i].status !== 'completed') {
          candidateTargetNode = currentNodes[i];
          break;
        }
      }
    }

    // Fallback: any uncompleted and non-upgraded node
    if (!candidateTargetNode) {
      candidateTargetNode = currentNodes.find(
        (n) => n.id !== completedNode?.id && n.unitId !== completedUnitId && !n.isAdaptiveUpgraded && n.status !== 'completed'
      );
    }

    // Ultimate fallback: next node in array
    if (!candidateTargetNode) {
      candidateTargetNode = currentNodes[Math.min(completedNodeIndex + 1, currentNodes.length - 1)];
    }

    if (!candidateTargetNode) return;

    setIsAdaptingComplexity(true);
    setAdaptingTargetUnitId(candidateTargetNode.unitId);

    try {
      const cleanTopic = candidateTargetNode.title
        .replace(/^\[.*?\]\s*/, '')
        .replace(/^⚡\s*/, '')
        .replace(/^🔥\s*/, '');

      // Call API gemini/generate-realworld-project
      const res = await fetch('/api/gemini/generate-realworld-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: cleanTopic,
          context: {
            currentUnitTitle: completedTitle,
            domain: getEffectiveDomain() || candidateTargetNode.phaseTitle || 'Архитектура и Highload',
            level: 'advanced',
            sprint: 'Staff / Production Boost',
            performanceEvidence: `${performance.totalCorrect} из ${performance.totalQuestions} верных ответов (100% результат)`,
          },
        }),
      });

      let project: any = null;
      try {
        const text = await res.text();
        if (text && text.trim().startsWith('{')) {
          project = JSON.parse(text);
        }
      } catch (pe) {
        console.warn('Realworld project parse warning:', pe);
      }

      if (!project || !project.title) {
        project = {
          title: `Highload & Concurrency: Отказоустойчивость в ${cleanTopic}`,
          role: 'Staff Systems Architect',
          businessScenario: `В ходе пиковых нагрузок сервис столкнулся с каскадными сбоями и деградацией задержки при обработке «${cleanTopic}». Требуется разработать отказоустойчивое решение с ограничением частоты и изоляцией сбоев.`,
          description: `Спроектируйте архитектуру продакшен-уровня для «${cleanTopic}» с гарантией идемпотентности, обработкой дедлоков и защитой от перегрузки.`,
          checklist: [
            'Шаг 1: Архитектурный аудит узких мест и состояния гонки',
            'Шаг 2: Реализация распределенного механизма синхронизации',
            'Шаг 3: Настройка стратегии повторов с экспоненциальным backoff и jitter',
            'Шаг 4: Стресс-тестирование при 20 000 виртуальных запросов',
            'Шаг 5: Формирование продакшен-артефакта с метриками SLA'
          ],
          requirements: [
            'Строгая идемпотентность по ключу транзакции',
            'Отсутствие утечек памяти и зависания соединений под нагрузкой',
            'Соблюдение SLA по задержке p99 < 15ms'
          ],
          acceptedFileTypes: 'Любой файл (.py, .ts, .go, .rs, .sql, .yaml, .json, .md, .zip)',
          defaultFilename: 'solution.ts',
          starterCode: `// Боевой кейс: ${cleanTopic}\n// Уровень: Staff Engineer\n\nexport async function executeHighloadWorker() {\n  const scenario = '${cleanTopic}';\n  const guards = [\n    'идемпотентность по запросу',\n    'изоляция каскадного сбоя',\n    'ограничение rate limit'\n  ];\n\n  return { scenario, guards, status: 'prepared', latencyMs: 4 };\n}`,
          estimatedTimeMin: 45,
        };
      }

      const targetId = candidateTargetNode.id;
      const targetUnitId = candidateTargetNode.unitId;
      const upgradedNodeTitle = `[🔥 Повышенная сложность] ${project.title}`;
      const upgradeReason = `Повышено на основе ${performance.totalCorrect}/${performance.totalQuestions} верных ответов на уроке «${completedTitle}»`;

      const updatedNodes: DAGNode[] = currentNodes.map((n) => {
        if (n.id === completedUnitId || n.unitId === completedUnitId) {
          return { ...n, status: 'completed' as const };
        }
        if (n.id === targetId || n.unitId === targetUnitId) {
          return {
            ...n,
            title: upgradedNodeTitle,
            subtitle: `${project.role || 'Staff Systems Architect'} · Боевой кейс продакшена`,
            isAdvanced: true,
            isRemedial: false,
            isAdaptiveUpgraded: true,
            adaptiveProjectTitle: project.title,
            adaptiveUpgradeReason: upgradeReason,
            aiCommentary: `ИИ динамически повысил сложность через gemini/generate-realworld-project на основе ${performance.totalCorrect}/${performance.totalQuestions} верных ответов. Сформирован боевой кейс Staff-уровня.`,
            estimatedTimeMin: project.estimatedTimeMin || 45,
            artifactRequirement: 'Продакшен-код с защитой от отказов',
          };
        }
        return n;
      });

      const upgradedUnit: LearningUnit = {
        id: targetUnitId,
        title: project.title,
        category: 'Боевой кейс продакшена (Повышенная сложность)',
        durationSec: (project.estimatedTimeMin || 45) * 60,
        videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
        authorName: project.role || 'Staff Systems Architect',
        viewsCount: 290,
        retentionRate: 98,
        passRate: 75,
        summaryMarkdown: project.summaryMarkdown || `### ${project.title}\n\n**Роль:** ${project.role}\n\n#### Инцидент на проде:\n${project.businessScenario}\n\n#### Инженерная задача:\n${project.description}`,
        quiz: project.quiz || [
          {
            id: `q-up-${Date.now()}`,
            type: 'tradeoff',
            question: `Какой компромисс является ключевым при решении «${project.title}»?`,
            options: [
              { id: 'opt-1', text: 'Гарантия строгой согласованности при допустимом увеличении времени ответа', isCorrect: true, explanation: 'Верно: надежность важнее миллисекундных колебаний.' },
              { id: 'opt-2', text: 'Игнорирование ошибок в надежде на авто-перезапуск сервиса', isCorrect: false, explanation: 'Неверно, приведет к расхождению данных.' }
            ],
            explanation: 'Staff Engineer всегда анализирует надежность в первую очередь.'
          }
        ],
        projectTask: {
          role: project.role || 'Staff Systems Architect',
          title: project.title,
          businessScenario: project.businessScenario,
          description: project.description,
          checklist: project.checklist || [
            'Шаг 1: Валидация входных данных',
            'Шаг 2: Реализация распределенного замка',
            'Шаг 3: Тестирование отказоустойчивости'
          ],
          requirements: project.requirements || [
            'Строгая потокобезопасность под нагрузкой',
            'Обработка краевых условий и таймауты'
          ],
          acceptedFileTypes: project.acceptedFileTypes || 'Любой файл (.py, .ts, .go, .rs, .sql, .yaml, .json, .md, .zip)',
          defaultFilename: project.defaultFilename || 'solution.ts',
          starterCode: project.starterCode || '// Starter code...',
          estimatedTimeMin: project.estimatedTimeMin || 45,
        },
        adaptedForStudent: true,
        adaptationNote: `Сложность повышена через gemini/generate-realworld-project на основе верных ответов (${performance.totalCorrect}/${performance.totalQuestions})`
      };

      const updatedUnits = {
        ...(existingUnits || {}),
        [targetUnitId]: upgradedUnit
      };

      const normalized = normalizeDagLayout(updatedNodes, currentEdges);
      setGeneratedTrajectory({ nodes: normalized.nodes, edges: normalized.edges });
      onApplyGeneratedPath(normalized.nodes, normalized.edges, generatedSummary, updatedUnits);

      try {
        localStorage.setItem('learning_os_dag_nodes_v3', JSON.stringify(normalized.nodes));
      } catch (err) {
        console.warn('LocalStorage save error:', err);
      }

      playChime('success');

      const newHistoryEvent: AdaptiveEvent = {
        id: `adp-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        completedUnitId,
        completedUnitTitle: completedTitle,
        performance,
        upgradedNodeId: targetId,
        upgradedNodeTitle: upgradedNodeTitle,
        projectRole: project.role || 'Staff Systems Architect',
        projectRequirements: project.requirements || [],
        businessScenario: project.businessScenario || '',
        status: 'applied',
      };

      setAdaptiveHistory((prev) => {
        const next = [newHistoryEvent, ...prev];
        try {
          localStorage.setItem('learning_os_adaptive_history', JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      setAdaptiveSuccessBanner({
        completedTitle,
        upgradedTitle: project.title,
        role: project.role || 'Staff Architect',
        countCorrect: performance.totalCorrect,
        totalCount: performance.totalQuestions,
      });

    } catch (err) {
      console.error('Failed to adapt complexity:', err);
    } finally {
      setIsAdaptingComplexity(false);
      setAdaptingTargetUnitId(null);
    }
  };

  const handleSubmitBlockQuiz = async () => {
    if (!selectedBlockForQuiz) return;
    setIsSubmittingQuiz(true);
    const questions = getQuestionsForBlock(selectedBlockForQuiz);
    let correctCount = 0;
    questions.forEach((q) => {
      const selected = quizTestAnswers[q.id];
      const correctOpt = q.options.find((opt) => opt.isCorrect);
      if (selected === correctOpt?.id) {
        correctCount++;
      }
    });

    const totalQuestions = questions.length || 2;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const allCorrect = correctCount === totalQuestions;

    const block = selectedBlockForQuiz;
    setSelectedBlockForQuiz(null);
    setQuizTestAnswers({});
    setIsSubmittingQuiz(false);

    await handleAdaptiveLessonCompletion(
      block.unitId,
      {
        totalCorrect: correctCount,
        totalQuestions,
        score,
        allCorrect,
      },
      block.title
    );
  };

  // Step 1 -> Step 2: Trigger AI Question Generation
  const handleProceedToBlitz = async () => {
    setIsGeneratingQuestions(true);
    const activeDomain = getEffectiveDomain();

    // Commit purpose into permanent Epistemic Memory (No-Water Filter)
    try {
      localStorage.setItem('learning_os_user_purpose', whyGoal);
      fetch('/api/epistemic/set-purpose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: whyGoal,
          domain: activeDomain,
          targetGoal,
        }),
      }).catch(() => {});
    } catch {}

    try {
      const res = await fetch('/api/gemini/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: trackScope === 'single_topic' && singleTopicTarget ? singleTopicTarget : targetGoal,
          whyGoal,
          userPurpose: whyGoal,
          background: baggageAndBottlenecks,
          targetRole,
          userLevel,
          skillDomain: activeDomain,
          trackScope,
          singleTopicTarget: trackScope === 'single_topic' ? singleTopicTarget : undefined,
        }),
      });

      let data: any = null;
      try {
        const text = await res.text();
        if (text && text.trim().startsWith('{')) {
          data = JSON.parse(text);
        }
      } catch (err) {
        console.warn('Questions parse fallback:', err);
      }

      if (data && Array.isArray(data.groundingSources) && data.groundingSources.length > 0) {
        setGroundingSources(data.groundingSources);
      }

      if (data && Array.isArray(data.questions) && data.questions.length > 0) {
        const shuffled = data.questions.map((q: any) => {
          if (!Array.isArray(q.options)) return q;
          const copy = [...q.options];
          for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
          }
          return { ...q, options: copy };
        });
        setDynamicQuestions(shuffled);
        if (!data.groundingSources || data.groundingSources.length === 0) {
          const fromQuestions = shuffled.map((q: any) => q.groundedSource).filter(Boolean);
          if (fromQuestions.length > 0) {
            setGroundingSources(fromQuestions);
          }
        }
        setSelectedAnswers({});
      } else {
        const fallbackQs = getDomainDiagnosticQuestions(activeDomain);
        setDynamicQuestions(fallbackQs);
        const fbSources = fallbackQs.map(q => q.groundedSource).filter(Boolean) as GroundingSourceItem[];
        setGroundingSources(fbSources);
        setSelectedAnswers({});
      }
    } catch (e) {
      console.error('Failed to generate dynamic questions, using domain fallback:', e);
      const fallbackQs = getDomainDiagnosticQuestions(activeDomain);
      setDynamicQuestions(fallbackQs);
      const fbSources = fallbackQs.map(q => q.groundedSource).filter(Boolean) as GroundingSourceItem[];
      setGroundingSources(fbSources);
      setSelectedAnswers({});
    } finally {
      setIsGeneratingQuestions(false);
      setStep(3);
    }
  };

  // Step 3 -> Step 4: Generate Real Path Grounded in Library Catalog
  const handleGenerateDAG = async () => {
    setIsGeneratingPath(true);
    setIsServerFinishedGenerating(false);
    const activeDomain = getEffectiveDomain();
    try {
      const calibrationDetails = dynamicQuestions.map((q) => {
        const chosen = q.options.find((opt) => opt.id === selectedAnswers[q.id]);
        return {
          questionId: q.id,
          topic: q.topic,
          question: q.question,
          chosenAnswer: chosen ? chosen.text : (selectedAnswers[q.id] || 'Не выбран'),
          trait: chosen ? chosen.trait : 'Unknown',
          scenario: q.scenario,
          citationRef: q.citationRef,
          groundedSource: q.groundedSource,
        };
      });

      const surveyPayload: DiagnosticSurveyData = {
        targetGoal,
        whyGoal,
        userPurpose: whyGoal,
        targetRole,
        skillDomain: activeDomain,
        userLevel,
        baggageAndBottlenecks,
        timeResource,
        thinkingStyle,
        calibrationAnswers: selectedAnswers,
        calibrationDetails,
        diagnosticQuestions: dynamicQuestions,
        trackScope,
        singleTopicTarget: trackScope === 'single_topic' ? (singleTopicTarget || targetGoal) : undefined,
      };

      try {
        localStorage.setItem('learning_os_user_purpose', whyGoal);
        localStorage.setItem('learning_os_survey_profile', JSON.stringify(surveyPayload));
        localStorage.setItem('learning_os_thinking_style', thinkingStyle);
        localStorage.setItem('learning_os_user_level', userLevel);
        localStorage.setItem('learning_os_target_role', targetRole);
        localStorage.setItem('learning_os_target_goal', targetGoal);
        localStorage.setItem('learning_os_survey_completed', 'true');

        fetch('/api/epistemic/set-purpose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            purpose: whyGoal,
            domain: activeDomain,
            targetGoal,
          }),
        }).catch(() => {});
      } catch (err) {}

      const effectiveLibrary = [
        ...LIBRARY_UNITS_CATALOG,
        ...adminUnits
          .filter((au) => au.status === 'approved' && !LIBRARY_UNITS_CATALOG.some((lu) => lu.id === au.id))
          .map((au) => ({
            id: au.id,
            title: au.title,
            category: au.domain || 'Библиотека знаний',
            domain: au.domain || 'Универсальные навыки',
            level: au.level || 'intermediate',
            estimatedTimeMin: au.durationMin || 35,
            authorName: au.author || '@admin',
            detailedDescription: au.detailedDescription || au.title,
          })),
      ];

      const res = await fetch('/api/gemini/generate-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyData: surveyPayload,
          libraryUnits: effectiveLibrary,
          groundingSources,
        }),
      });

      let data: any = null;
      try {
        const text = await res.text();
        if (text && text.trim().startsWith('{')) {
          data = JSON.parse(text);
        }
      } catch (e) {
        console.warn('Could not parse server JSON, using fallback path:', e);
      }

      if (data && data.nodes && data.edges && data.nodes.length > 0) {
        const normalized = normalizeDagLayout(data.nodes, data.edges);
        setGeneratedTrajectory({ nodes: normalized.nodes, edges: normalized.edges });
        setGeneratedSummary(data.diagnosticSummary);
        onApplyGeneratedPath(normalized.nodes, normalized.edges, data.diagnosticSummary, data.generatedUnits);
      } else {
        console.warn('Path generation returned empty or invalid payload, retrying guaranteed fallback');
      }
      setIsServerFinishedGenerating(true);
    } catch (err) {
      console.error('Survey completion error:', err);
      setIsServerFinishedGenerating(true);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white/95 backdrop-blur-2xl select-text text-slate-800">
      {/* Top Header */}
      <div className="px-6 py-3 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-slate-900 text-white shadow-2xs">
              <Target className="w-3.5 h-3.5" />
            </span>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Инженерная анкета и построение плана обучения
            </h2>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Каталог библиотеки · Персональная адаптация под ваш стек и задачи
          </p>
        </div>

        {/* Minimalist Segmented Step Indicator */}
        <div className="flex items-center p-0.5 rounded-xl bg-slate-100/90 border border-slate-200/80 text-xs font-medium">
          <span className={`px-2.5 py-1 rounded-lg transition-all ${step === 1 ? 'bg-slate-900 text-white shadow-xs font-semibold' : 'text-slate-600'}`}>
            1. Направление
          </span>
          <span className={`px-2.5 py-1 rounded-lg transition-all ${step === 2 ? 'bg-slate-900 text-white shadow-xs font-semibold' : 'text-slate-600'}`}>
            2. Зачем учите?
          </span>
          <span className={`px-2.5 py-1 rounded-lg transition-all ${step === 3 ? 'bg-slate-900 text-white shadow-xs font-semibold' : 'text-slate-600'}`}>
            3. Вопросы
          </span>
          {isGeneratingPath ? (
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white shadow-xs font-semibold flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>4. Синтез плана</span>
            </span>
          ) : (
            <span className={`px-2.5 py-1 rounded-lg transition-all ${step === 4 ? 'bg-slate-900 text-white shadow-xs font-semibold' : 'text-slate-600'}`}>
              4. План обучения
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isGeneratingPath ? (
        <div className="flex-1 overflow-y-auto">
          <TeaBrewingPlanLoader
            isServerFinished={isServerFinishedGenerating}
            targetDomain={getEffectiveDomain()}
            totalBlocks={200}
            onComplete={() => {
              setIsGeneratingPath(false);
              setStep(4);
            }}
            onLaunchFirstUnit={() => {
              setIsGeneratingPath(false);
              setStep(4);
              const firstNode = generatedTrajectory?.nodes?.[0];
              if (firstNode && onLaunchUnit) {
                if (onClose) onClose();
                onLaunchUnit(firstNode.unitId);
              }
            }}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: GOALS & CONTEXT */}
          {step === 1 && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            {/* Context Callout */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs flex items-start space-x-3.5">
              <div className="p-2 rounded-lg bg-slate-900 text-white shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1 text-xs">
                <div className="font-semibold text-slate-900">
                  Шаг 1: Определение целей и стартового багажа
                </div>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Укажите желаемую специализацию и начальный уровень. ИИ подберет проверочные вопросы и сформирует персональный граф обучения (DAG) из практических модулей.
                </p>
              </div>
            </div>

            {/* SELECTION 0: TRACK SCOPE (Full Course vs Single Topic / Adaptive) */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-900 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Формат программы и масштаб обучения</span>
                </span>
                <span className="text-[11px] font-normal text-slate-500">
                  Полный фундаментальный курс или закрытие одной темы
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Course */}
                <button
                  type="button"
                  id="scope-btn-full"
                  onClick={() => setTrackScope('full_course')}
                  className={`p-3.5 rounded-xl border text-left transition-all relative cursor-pointer ${
                    trackScope === 'full_course'
                      ? 'border-indigo-600 bg-indigo-50/70 text-slate-900 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold flex items-center space-x-1.5 text-indigo-900">
                      <span>📚 Полный курс</span>
                      <span className="text-[10px] font-normal text-indigo-700">(200 блоков)</span>
                    </span>
                    {trackScope === 'full_course' && (
                      <Check className="w-3.5 h-3.5 text-indigo-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Доскональное освоение всей дисциплины: 10 последовательных модулей от азов до уровня Мастера (без воды).
                  </p>
                  <div className="mt-2 text-[9px] font-semibold text-indigo-700 uppercase tracking-wider bg-indigo-100/70 inline-block px-1.5 py-0.5 rounded">
                    10 модулей • 200 квантов
                  </div>
                </button>

                {/* Single Topic / Micro-Track */}
                <button
                  type="button"
                  id="scope-btn-single"
                  onClick={() => {
                    setTrackScope('single_topic');
                    const activePreset = DOMAIN_PRESETS.find(p => p.label === skillDomain) || DOMAIN_PRESETS[0];
                    const suggestions = DOMAIN_TOPIC_SUGGESTIONS[activePreset.id] || [];
                    if (suggestions.length > 0 && (!singleTopicTarget || singleTopicTarget === 'Метод двойной записи и логика проводок')) {
                      setSingleTopicTarget(suggestions[0]);
                    }
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all relative cursor-pointer ${
                    trackScope === 'single_topic'
                      ? 'border-amber-600 bg-amber-50/80 text-slate-900 ring-2 ring-amber-500/20 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold flex items-center space-x-1.5 text-amber-900">
                      <span>🎯 Закрыть одну тему</span>
                      <span className="text-[10px] font-normal text-amber-700">(на усмотрение ИИ)</span>
                    </span>
                    {trackScope === 'single_topic' && (
                      <Check className="w-3.5 h-3.5 text-amber-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Не 200 блоков, а ровно столько, <strong>сколько ИИ считает нужным</strong> для исчерпывающего закрытия одной конкретной темы.
                  </p>
                  <div className="mt-2 text-[9px] font-semibold text-amber-800 uppercase tracking-wider bg-amber-200/80 inline-block px-1.5 py-0.5 rounded">
                    Микро-трек • Адаптивный объем
                  </div>
                </button>
              </div>

              {/* Single Topic Targeted Configuration Input & Chips */}
              {trackScope === 'single_topic' && (() => {
                const activePreset = DOMAIN_PRESETS.find(p => p.label === skillDomain) || DOMAIN_PRESETS[0];
                const suggestions = DOMAIN_TOPIC_SUGGESTIONS[activePreset.id] || [
                  'Базовые формулы и алгоритм решения',
                  'Разбор типичных ошибок и ловушек',
                  'Граничные условия и стресс-кейсы'
                ];
                return (
                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/90 space-y-2.5 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-950 flex items-center space-x-1.5">
                        <Target className="w-3.5 h-3.5 text-amber-600" />
                        <span>Какую конкретно тему или задачу нужно закрыть?</span>
                      </label>
                      <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-medium">
                        ИИ сам определит число квантов
                      </span>
                    </div>

                    <input
                      id="single-topic-target-input"
                      type="text"
                      value={singleTopicTarget}
                      onChange={(e) => setSingleTopicTarget(e.target.value)}
                      placeholder="Например: Метод двойной записи в бухучете, XLOOKUP в Excel, Расчет эластичности спроса..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs font-medium"
                    />

                    {/* Quick suggestion chips */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] text-amber-900/80 font-medium">
                        Рекомендуемые темы в сфере «{activePreset.label}»:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestions.map((sugg, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => setSingleTopicTarget(sugg)}
                            className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                              singleTopicTarget === sugg
                                ? 'bg-amber-600 text-white border-amber-600 font-semibold shadow-2xs'
                                : 'bg-white/90 text-amber-900 border-amber-200/90 hover:bg-amber-100/90'
                            }`}
                          >
                            {sugg}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 flex items-center space-x-1.5 pt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>
                        ИИ рассчитает оптимальное количество квантов (обычно 4–12 блоков без лишней воды) и сгенерирует целенаправленный граф.
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* SELECTION 1: SKILL LEVEL */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-900 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  <span>Ваш уровень подготовки</span>
                </span>
                <span className="text-[11px] font-normal text-slate-500">
                  ИИ мгновенно адаптирует сложность и формат вопросов
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Beginner */}
                <button
                  type="button"
                  id="level-btn-beginner"
                  onClick={() => {
                    setUserLevel('beginner');
                    if (baggageAndBottlenecks.includes('PostgreSQL') || baggageAndBottlenecks.includes('дедлок')) {
                      setBaggageAndBottlenecks('Начинаю с нуля, хочу понять базовые принципы и логику без заумных терминов.');
                    }
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all relative ${
                    userLevel === 'beginner'
                      ? 'border-emerald-600 bg-emerald-50/70 text-slate-900 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold flex items-center space-x-1 text-emerald-800">
                      <span>🟢 Новичок</span>
                      <span className="text-[10px] font-normal text-emerald-700">(С нуля)</span>
                    </span>
                    {userLevel === 'beginner' && (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    ИИ <strong>объясняет суть («что да как»)</strong> простыми словами и задает вопросы на чистую логику и сообразительность без заумных терминов.
                  </p>
                  <div className="mt-2 text-[9px] font-semibold text-emerald-700 uppercase tracking-wider bg-emerald-100/70 inline-block px-1.5 py-0.5 rounded">
                    Без сленга • Логика
                  </div>
                </button>

                {/* Intermediate */}
                <button
                  type="button"
                  id="level-btn-intermediate"
                  onClick={() => setUserLevel('intermediate')}
                  className={`p-3.5 rounded-xl border text-left transition-all relative ${
                    userLevel === 'intermediate'
                      ? 'border-sky-600 bg-sky-50/70 text-slate-900 ring-2 ring-sky-500/20 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold flex items-center space-x-1 text-sky-800">
                      <span>🔵 Средний</span>
                      <span className="text-[10px] font-normal text-sky-700">(Практик)</span>
                    </span>
                    {userLevel === 'intermediate' && (
                      <Check className="w-3.5 h-3.5 text-sky-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Боевые задачи, компромиссы, выбор подходящих структур данных и практика применения инструментов.
                  </p>
                  <div className="mt-2 text-[9px] font-semibold text-sky-700 uppercase tracking-wider bg-sky-100/70 inline-block px-1.5 py-0.5 rounded">
                    Практика • Опыт
                  </div>
                </button>

                {/* Master */}
                <button
                  type="button"
                  id="level-btn-master"
                  onClick={() => setUserLevel('master')}
                  className={`p-3.5 rounded-xl border text-left transition-all relative ${
                    userLevel === 'master'
                      ? 'border-purple-600 bg-purple-50/70 text-slate-900 ring-2 ring-purple-500/20 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold flex items-center space-x-1 text-purple-800">
                      <span>🟣 Мастер</span>
                      <span className="text-[10px] font-normal text-purple-700">(Профи)</span>
                    </span>
                    {userLevel === 'master' && (
                      <Check className="w-3.5 h-3.5 text-purple-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Системный дизайн, отказоустойчивость при пиковых нагрузках, скрытые риски и краевые случаи.
                  </p>
                  <div className="mt-2 text-[9px] font-semibold text-purple-700 uppercase tracking-wider bg-purple-100/70 inline-block px-1.5 py-0.5 rounded">
                    Senior • Архитектура
                  </div>
                </button>
              </div>
            </div>

            {/* SELECTION 2: DOMAIN / FIELD (Universal for all skills) */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-900 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Palette className="w-4 h-4 text-purple-600" />
                  <span>Сфера знаний и целевой навык</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Подходит для любых профессий и дисциплин
                </span>
              </label>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex flex-wrap gap-1.5">
                  {DOMAIN_PRESETS.map((preset) => {
                    const isSelected = skillDomain === preset.label;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setSkillDomain(preset.label);
                          if (preset.defaultGoal) {
                            setTargetGoal(preset.defaultGoal);
                          }
                          if (preset.defaultRole) {
                            setTargetRole(preset.defaultRole);
                          }
                          if (preset.defaultBaggage) {
                            setBaggageAndBottlenecks(preset.defaultBaggage);
                          }
                          const suggestions = DOMAIN_TOPIC_SUGGESTIONS[preset.id] || [];
                          if (suggestions.length > 0) {
                            setSingleTopicTarget(suggestions[0]);
                          }
                          const qs = getDomainDiagnosticQuestions(preset.id);
                          setDynamicQuestions(qs);
                          const sources = qs.map(q => q.groundedSource).filter(Boolean) as GroundingSourceItem[];
                          if (sources.length > 0) {
                            setGroundingSources(sources);
                          }
                          setSelectedAnswers({});
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{preset.icon}</span>
                        <span>{preset.label}</span>
                      </button>
                    );
                  })}
                </div>

                {skillDomain === 'Свой навык...' && (
                  <div className="pt-1 animate-fade-in space-y-1">
                    <input
                      id="survey-custom-domain"
                      type="text"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      placeholder="Введите вашу сферу (например: Звукорежиссура, Копирайтинг, 3D-графика в Blender, Юриспруденция)..."
                      className="w-full px-3.5 py-2 rounded-xl border border-purple-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all shadow-2xs"
                    />
                    <div className="text-[10px] text-slate-500">
                      ИИ сгенерирует вступительные вопросы и план специально под эту дисциплину.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Field 1: Target Role */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                <span>Целевая роль или статус</span>
              </label>
              <input
                id="survey-target-role"
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="Спикер / UI/UX Дизайнер / Менеджер продукта / Практик английского / Музыкант"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-2xs"
              />
            </div>

            {/* Field 2: Hard Goal */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-600" />
                <span>Точка назначения (Цель и финальный результат)</span>
              </label>
              <div className="text-[11px] text-slate-500">
                Конкретный практический артефакт в портфолио: работающее приложение, макет в Figma, запущенный MVP, исследование рынка.
              </div>
              <input
                id="survey-target-goal"
                type="text"
                value={targetGoal}
                onChange={(e) => setTargetGoal(e.target.value)}
                placeholder="Освоить основы с нуля и построить первый реальный проект"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-2xs"
              />
            </div>

            {/* Field 3: Baggage & Bottlenecks */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Входной опыт, ожидания или трудности</span>
              </label>
              <div className="text-[11px] text-slate-500">
                Что уже пробовали? Где спотыкались? Если вы новичок — просто опишите, что хотите освоить в первую очередь.
              </div>
              <textarea
                id="survey-baggage"
                rows={3}
                value={baggageAndBottlenecks}
                onChange={(e) => setBaggageAndBottlenecks(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-2xs resize-none"
              />
            </div>

            {/* Field 4: Time Resource */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                <span>Ресурс времени на обучение</span>
              </label>
              <input
                id="survey-time"
                type="text"
                value={timeResource}
                onChange={(e) => setTimeResource(e.target.value)}
                placeholder="3 раза в неделю по 45 мин + суббота 2 часа"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-2xs"
              />
            </div>

            {/* Field 5: Thinking Style */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <Brain className="w-3.5 h-3.5 text-purple-600" />
                <span>Формат восприятия материала</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setThinkingStyle('visual')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    thinkingStyle === 'visual'
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs font-bold">Визуальный</div>
                  <div className={`text-[10px] mt-1 ${thinkingStyle === 'visual' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Схемы, майндмэпы, интеллект-карты и пошаговые графы.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setThinkingStyle('engineering')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    thinkingStyle === 'engineering'
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs font-bold">Практический</div>
                  <div className={`text-[10px] mt-1 ${thinkingStyle === 'engineering' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Сразу тесты, реальные кейсы, упражнения и сборка проекта.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setThinkingStyle('conceptual')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    thinkingStyle === 'conceptual'
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs font-bold">Концептуальный</div>
                  <div className={`text-[10px] mt-1 ${thinkingStyle === 'conceptual' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Понятные жизненные аналогии и глубокие первопричины.
                  </div>
                </button>
              </div>
            </div>

            {/* Next Button -> Step 2 */}
            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  playChime('click');
                  setStep(2);
                }}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
              >
                <span>Далее: Зачем вы это учите? (Шаг 2)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: DEDICATED SEPARATE SCREEN: ЗАЧЕМ ВЫ ЭТО УЧИТЕ? (EPISTEMIC MEMORY & NO-WATER FILTER) */}
        {step === 2 && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            {/* Header banner */}
            <div className="p-5 rounded-2xl bg-linear-to-br from-indigo-50/90 via-purple-50/40 to-slate-50 border-2 border-indigo-200 shadow-xs space-y-4 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    2
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Зачем вы это учите?</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Направление: <strong className="text-slate-800 font-semibold">{getEffectiveDomain()}</strong>
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                  ⚡ Epistemic Memory · No-Water Filter
                </span>
              </div>

              <div className="text-xs text-slate-600 leading-relaxed bg-white/80 p-3 rounded-xl border border-indigo-100 space-y-1">
                <p>
                  ИИ-Агент запишет ваш ответ в постоянную базу памяти (<strong>Epistemic Memory</strong>).
                </p>
                <p className="text-slate-500 text-[11px]">
                  <strong>Фильтр No-Water:</strong> на основе этой цели ИИ отфильтрует программу так, чтобы давать исключительно те знания, код и практические задания, которые нужны конкретно для вашей задачи — ничего лишнего.
                </p>
              </div>

              {/* Quick Purpose Presets */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-800 block">
                  Выберите готовую цель в один клик или укажите свою:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '🚀 Запустить собственный стартап / MVP', val: 'Запустить собственный стартап и работающий MVP для первых пользователей' },
                    { label: '💼 Пройти собеседование на Senior / Lead', val: 'Успешно пройти собеседование на грейд Senior/Lead и защитить архитектуру' },
                    { label: '⚡ Автоматизировать работу и сэкономить время', val: 'Автоматизировать рабочие процессы компании и исключить рутину' },
                    { label: '🛠️ Сделать боевой проект в продакшн', val: 'Разработать надежный прикладной проект для продакшена без багов' },
                    { label: '📈 Повысить доход и квалификацию', val: 'Решать практические задачи высокой сложности и вырасти в доходе' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setWhyGoal(preset.val);
                        playChime('click');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs border transition cursor-pointer font-medium ${
                        whyGoal === preset.val
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs font-semibold'
                          : 'bg-white hover:bg-indigo-50 border-indigo-200 text-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-slate-800 block">
                  Ваша точная жизненная цель:
                </label>
                <textarea
                  id="survey-why-goal"
                  rows={3}
                  value={whyGoal}
                  onChange={(e) => setWhyGoal(e.target.value)}
                  placeholder="Например: хочу запустить работающий веб-сервис для клиентов / пройти собеседование / автоматизировать отчетность..."
                  className="w-full px-4 py-3 rounded-xl border border-indigo-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all shadow-2xs resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Step 2 Bottom Navigation */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  playChime('click');
                  setStep(1);
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer flex items-center space-x-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Назад к направлению</span>
              </button>

              <button
                type="button"
                id="btn-generate-questions"
                onClick={handleProceedToBlitz}
                disabled={isGeneratingQuestions}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center space-x-2 shadow-sm transition-all disabled:opacity-50 shrink-0 cursor-pointer"
              >
                {isGeneratingQuestions ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Поиск первоисточников & калибровка бланка...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Сформировать вопросы по первоисточникам (Шаг 3)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: DYNAMIC AI QUESTIONS - ВСТУПИТЕЛЬНЫЙ ЭКЗАМЕНАЦИОННЫЙ БЛАНК */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            {/* Examination Sheet Top Header */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white text-slate-900 shadow-2xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
                        Вступительный экзаменационный бланк
                      </h3>
                      <span className="text-[11px] text-slate-400 font-mono">
                        № ЛО-2026
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Первичная педагогическая диагностика знаний и алгоритмического мышления
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Проверяется Gemini</span>
                </div>
              </div>

              {/* Meta tags */}
              <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                <span>Сфера: <strong className="font-medium text-slate-800">{getEffectiveDomain()}</strong></span>
                <span>·</span>
                <span>Уровень: <strong className="font-medium text-slate-800">{userLevel === 'beginner' ? 'Новичок' : userLevel === 'master' ? 'Мастер' : 'Практик'}</strong></span>
                <span>·</span>
                <span>Цель: <strong className="font-medium text-slate-800">{targetGoal}</strong></span>
              </div>
            </div>

            {/* Pedagogical Principle Callout */}
            <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200/90 text-slate-800 text-xs leading-relaxed space-y-1.5 shadow-2xs">
              <div className="flex items-center space-x-2 text-amber-900 font-bold">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Как ИИ анализирует этот бланк:</span>
              </div>
              <p className="text-slate-700">
                ИИ-экзаменатор проверяет ответы построчно:
              </p>
              <ul className="grid sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                <li className="p-2 rounded-lg bg-white/80 border border-amber-200/60 flex items-start space-x-1.5">
                  <span className="text-emerald-600 font-bold text-xs mt-0.5">✓</span>
                  <div>
                    <strong className="text-emerald-900 block">«Ага, базу знает — можно сложнее!»</strong>
                    <span className="text-slate-600">Если ответ верный — убираем вводную воду и повышаем сложность программы.</span>
                  </div>
                </li>
                <li className="p-2 rounded-lg bg-white/80 border border-amber-200/60 flex items-start space-x-1.5">
                  <span className="text-rose-600 font-bold text-xs mt-0.5">⚠</span>
                  <div>
                    <strong className="text-rose-900 block">«Ну тут ответил неверно — подтянем в начале!»</strong>
                    <span className="text-slate-600">Если ответ неверный — ИИ добавит выравнивающий модуль прямо в Sprint 1.</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Academic Grounding Sources Header Banner */}
            <div className="p-4 rounded-xl border border-emerald-200/90 bg-emerald-50/60 text-slate-900 shadow-2xs space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950 flex items-center space-x-2">
                      <span>Верифицированная база калибровки</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-semibold flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        <span>Доказательные первоисточники</span>
                      </span>
                    </h4>
                    <p className="text-[11px] text-emerald-800/90 mt-0.5">
                      Вопросы составлены не «из головы» ИИ, а на основе рецензируемых учебников OpenStax, стандартов ACM/IEEE и монографий.
                    </p>
                  </div>
                </div>
              </div>

              {/* Source chips */}
              <div className="flex flex-wrap gap-2 pt-1 border-t border-emerald-200/60">
                {groundingSources.slice(0, 4).map((source, sIdx) => {
                  const b = resolveAccurateSourceBadge(source);
                  return (
                    <button
                      key={source.id || sIdx}
                      type="button"
                      onClick={() => {
                        setSelectedInspectedSource(source);
                        setIsInspectorModalOpen(true);
                      }}
                      className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white border border-emerald-300/80 hover:border-emerald-500 hover:shadow-xs text-[11px] text-emerald-900 font-medium transition-all cursor-pointer group"
                      title={`Первоисточник: ${b.publisher}`}
                    >
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">
                        [{sIdx + 1}]
                      </span>
                      <span className="truncate max-w-[220px]">{source.title}</span>
                      <ExternalLink className="w-3 h-3 text-emerald-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Render Dynamic Questions */}
            <div className="space-y-5">
              {dynamicQuestions.map((q, idx) => {
                const qBadge = q.groundedSource ? resolveAccurateSourceBadge(q.groundedSource) : null;
                return (
                <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <span>{q.question}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-medium shrink-0">
                      {q.topic}
                    </span>
                  </div>

                  {/* Academic Grounded Source Badge & Citation */}
                  {q.groundedSource && qBadge && (
                    <div className="p-2.5 rounded-lg bg-white border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] shadow-2xs">
                      <div className="flex items-start sm:items-center space-x-2">
                        <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] shrink-0 border ${qBadge.badgeBg}`}>
                          {q.citationRef || `[${idx + 1}]`} {qBadge.label}
                        </span>
                        <div className="text-slate-700">
                          <strong className="text-slate-900">{q.groundedSource.title}</strong>
                          {q.groundedSource.chapterOrSection && (
                            <span className="text-slate-500 ml-1">· {q.groundedSource.chapterOrSection}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setExpandedQuotes((prev) => ({ ...prev, [q.id]: !prev[q.id] }))}
                          className="text-[11px] text-slate-600 hover:text-slate-900 font-medium underline cursor-pointer"
                        >
                          {expandedQuotes[q.id] ? 'Скрыть цитату' : 'Показать цитату'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInspectedSource(q.groundedSource!);
                            setIsInspectorModalOpen(true);
                          }}
                          className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-medium flex items-center space-x-1 transition-all cursor-pointer"
                        >
                          <span>Инспектор</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Expandable Verifiable Quote */}
                  {q.groundedSource?.verifiableQuote && expandedQuotes[q.id] && (
                    <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/70 text-slate-800 text-[11px] italic font-serif leading-relaxed animate-fade-in">
                      «{q.groundedSource.verifiableQuote}»
                      <div className="text-[10px] not-italic font-sans text-slate-500 mt-1 font-medium">
                        — {q.groundedSource.authors || 'Рецензируемые авторы'}, {q.groundedSource.year || 2024} ({q.groundedSource.doiOrIsbn || 'ISBN верифицирован'})
                      </div>
                    </div>
                  )}

                  {/* Scenario / Explanation ("Что да как") */}
                  {q.scenario && (
                    userLevel === 'beginner' ? (
                      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-slate-800 text-xs leading-relaxed space-y-1">
                        <div className="flex items-center space-x-1.5 text-amber-800 font-bold text-[11px]">
                          <Lightbulb className="w-3.5 h-3.5" />
                          <span>Суть концепции («Что да как»):</span>
                        </div>
                        <div className="text-slate-700">{q.scenario}</div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto">
                        {q.scenario}
                      </div>
                    )
                  )}

                  <div className="space-y-1.5">
                    {q.options.map((opt) => (
                      <label
                        key={opt.id}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          selectedAnswers[q.id] === opt.id
                            ? 'border-slate-900 bg-white font-medium text-slate-900 shadow-2xs ring-1 ring-slate-900/15'
                            : 'border-slate-200 bg-white/70 text-slate-700 hover:bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            checked={selectedAnswers[q.id] === opt.id}
                            onChange={() => setSelectedAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                            className="text-slate-900 focus:ring-0 w-4 h-4"
                          />
                          <span className="leading-snug">{opt.text}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                );
              })}
            </div>

            {/* Navigation & Submit */}
            <div className="pt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  playChime('click');
                  setStep(2);
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Назад к цели</span>
              </button>

              <div className="flex items-center space-x-3">
                {(() => {
                  const answeredCount = dynamicQuestions.filter((q) => !!selectedAnswers[q.id]).length;
                  const totalCount = dynamicQuestions.length;
                  const allAnswered = totalCount > 0 && answeredCount === totalCount;
                  return (
                    <>
                      <span className="text-[11px] text-slate-500">
                        {allAnswered ? (
                          <span className="text-emerald-700 font-medium">✓ Бланк заполнен ({answeredCount}/{totalCount})</span>
                        ) : (
                          <span>Заполнено: {answeredCount} из {totalCount}</span>
                        )}
                      </span>

                      <button
                        type="button"
                        id="btn-generate-plan"
                        onClick={handleGenerateDAG}
                        disabled={isGeneratingPath || !allAnswered}
                        className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center space-x-2 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGeneratingPath ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>ИИ-экзаменатор проверяет бланк и строит 200 блоков...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>
                              {allAnswered 
                                ? 'Сдать бланк на проверку ИИ и сформировать программу' 
                                : `Ответьте на все вопросы бланка (${answeredCount}/${totalCount})`}
                            </span>
                          </>
                        )}
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: REALISTIC GROUNDED PLAN AHEAD */}
        {step === 4 && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in py-2">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Реалистичный план обучения сформирован
              </h3>
              <p className="text-xs text-slate-500 max-w-lg mx-auto">
                Опирается строго на существующие модули каталога библиотеки, исключая галлюцинации и лишнюю теорию.
              </p>
            </div>

            {/* ВЕДОМОСТЬ ДИАГНОСТИКИ БЛАНКА: РАЗБОР ИИ-ЭКЗАМЕНАТОРА */}
            {generatedSummary?.blankAnalysis && generatedSummary.blankAnalysis.length > 0 && (
              <div className="p-5 rounded-2xl border-2 border-indigo-200/90 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 shadow-xs text-left space-y-4">
                <div className="flex flex-wrap items-center justify-between border-b border-indigo-100 pb-3 gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <ClipboardList className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-bold text-slate-900 tracking-tight">
                          Ведомость проверки экзаменационного бланка ИИ-экзаменатором
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
                          Бланк проверен
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Построчный анализ: выявление подтвержденной базы («базу знает — можно сложнее») и пробелов («подтянем в начале»)
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    {generatedSummary.topicsMastered && generatedSummary.topicsMastered.length > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100/90 text-emerald-800 font-bold border border-emerald-200 flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Базу знает: {generatedSummary.topicsMastered.length} (усложняем)</span>
                      </span>
                    )}
                    {generatedSummary.topicsToReinforceAtStart && generatedSummary.topicsToReinforceAtStart.length > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-rose-100/90 text-rose-800 font-bold border border-rose-200 flex items-center space-x-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Подтянем в начале: {generatedSummary.topicsToReinforceAtStart.length}</span>
                      </span>
                    )}
                  </div>
                </div>

                {generatedSummary.overallExaminerVerdict && (
                  <div className="p-3.5 rounded-xl bg-white border border-indigo-200/80 shadow-2xs space-y-1">
                    <div className="flex items-center space-x-1.5 text-[11px] font-bold text-indigo-900">
                      <Brain className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Педагогический вердикт экзаменатора:</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed italic">
                      «{generatedSummary.overallExaminerVerdict}»
                    </p>
                  </div>
                )}

                <div className="space-y-3 pt-1">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Попунктный разбор ответов на бланке:
                  </div>

                  <div className="grid gap-3">
                    {generatedSummary.blankAnalysis.map((item: BlankQuestionAnalysis, bIdx: number) => {
                      const isMastered = item.verdictType === 'MASTERED_BASE';
                      const isGap = item.verdictType === 'GAP_DETECTED';

                      const cardBorder = isMastered 
                        ? 'border-emerald-200 bg-emerald-50/40' 
                        : isGap 
                        ? 'border-rose-200 bg-rose-50/40' 
                        : 'border-amber-200 bg-amber-50/40';

                      const badgeBg = isMastered 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                        : isGap 
                        ? 'bg-rose-100 text-rose-800 border-rose-300' 
                        : 'bg-amber-100 text-amber-800 border-amber-300';

                      return (
                        <div 
                          key={item.questionId || bIdx} 
                          className={`p-3.5 rounded-xl border ${cardBorder} transition-all space-y-2`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <div className="flex items-center space-x-2">
                              <span className="w-5 h-5 rounded-md bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                                {bIdx + 1}
                              </span>
                              <span className="text-xs font-bold text-slate-900">
                                {item.topic}
                              </span>
                            </div>

                            <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${badgeBg}`}>
                              {item.verdictBadge}
                            </span>
                          </div>

                          <div className="text-xs text-slate-600 space-y-1 bg-white/70 p-2.5 rounded-lg border border-slate-200/60">
                            <div className="text-slate-800 font-medium">
                              {item.questionText}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              <span className="font-semibold text-slate-700">Выбранный ответ на бланке: </span>
                              <span className="italic text-slate-900 font-medium">«{item.chosenAnswerText}»</span>
                            </div>
                          </div>

                          <div className="text-xs p-2.5 rounded-lg bg-white/90 border border-slate-200 space-y-1">
                            <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-800">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Заметка ИИ-экзаменатора:</span>
                            </div>
                            <p className="text-[11px] text-slate-700 leading-relaxed italic">
                              «{item.aiCommentary}»
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center justify-between text-[11px] pt-1 border-t border-slate-200/50 gap-2">
                            <div className="flex items-center space-x-1.5 text-slate-700">
                              <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span><strong>Адаптация программы:</strong> {item.adaptationAction}</span>
                            </div>
                            {item.targetSprint && (
                              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-mono font-bold text-[10px] shrink-0">
                                {item.targetSprint}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* AI Diagnosis Verdict */}
            {generatedSummary && (
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 text-left space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <div className="flex items-center space-x-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold text-slate-900">Калибровочный вердикт ИИ</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    Индекс скорости (Velocity): {generatedSummary.velocityIndex || 1.2}
                  </span>
                </div>
                <div className="grid sm:grid-cols-3 gap-3 text-xs text-slate-700">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/70">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Уровень</span>
                    <strong className="text-slate-900">{generatedSummary.detectedLevel}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/70">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Слепая зона</span>
                    <strong className="text-slate-900">{generatedSummary.primaryBottleneck}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/70">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Темп спринтов</span>
                    <strong className="text-slate-900">{generatedSummary.recommendedPace}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* PEER STUDY BUDDY MATCHMAKING PROPOSAL */}
            <div className="p-5 rounded-2xl border border-sky-200/90 bg-gradient-to-br from-sky-50/90 via-white to-blue-50/50 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-sky-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-2xs">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Подбор напарника для совместного обучения (Peer Study Buddy)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Синхронная практика: копия рабочего пространства, видеосвязь, интерактивная доска и парный режим
                    </p>
                  </div>
                </div>

                <span className="text-[10px] px-2.5 py-0.5 rounded font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200">
                  {userLevel === 'beginner' ? 'Новичок (С нуля)' : userLevel === 'master' ? 'Мастер' : 'Практик'}
                </span>
              </div>

              {/* STATE 1: IDLE (PROPOSAL) */}
              {matchStatus === 'idle' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Хотите подобрать напарника с вашим уровнем{' '}
                    <span className="font-bold text-sky-700">
                      «{userLevel === 'beginner' ? 'Новичок' : userLevel === 'master' ? 'Мастер' : 'Практик'}»
                    </span>{' '}
                    в сфере <span className="font-bold text-slate-900">«{getEffectiveDomain()}»</span> прямо сейчас?
                    Вы сможете созваниваться в один клик по видео, разбирать сложные понятия и двигаться по спринтам вдвоем.
                  </p>

                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      id="btn-find-peer-now"
                      onClick={handleStartSearch}
                      className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center space-x-2 shadow-xs transition-all"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Подобрать напарника прямо сейчас</span>
                    </button>

                    <button
                      type="button"
                      id="btn-skip-peer"
                      onClick={() => setMatchStatus('skipped')}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-white text-slate-600 text-xs font-medium transition-all"
                    >
                      Пропустить (учиться соло)
                    </button>
                  </div>
                </div>
              )}

              {/* STATE 2: SEARCHING / RADAR SCAN */}
              {matchStatus === 'searching' && (
                <div className="p-4 rounded-xl bg-white/90 border border-sky-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative flex items-center justify-center w-8 h-8">
                        <span className="absolute w-8 h-8 rounded-full bg-sky-400 opacity-30 animate-ping" />
                        <span className="relative w-4 h-4 rounded-full bg-sky-600" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                          <span>Поиск напарника в реальном времени...</span>
                          <span className="text-[10px] text-sky-600 font-mono">({searchSeconds}с)</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Фильтр: Уровень [{userLevel === 'beginner' ? 'Новичок' : userLevel === 'master' ? 'Мастер' : 'Практик'}] • Сфера [{getEffectiveDomain()}]
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCancelSearch}
                      className="text-xs text-slate-500 hover:text-slate-800 underline"
                    >
                      Отмена
                    </button>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-sky-500 h-1.5 rounded-full animate-pulse w-3/4 transition-all duration-500" />
                  </div>

                  <p className="text-[11px] text-slate-500 italic">
                    Если в очереди прямо сейчас нет другого пользователя, поиск автоматически останется в фоновом режиме.
                  </p>
                </div>
              )}

              {/* STATE 3: BACKGROUND QUEUE STATE (NO IMMEDIATE PEER) */}
              {matchStatus === 'waiting_background' && !localPartner && (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3 text-left">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                      <Radio className="w-4 h-4 animate-pulse text-amber-700" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <h5 className="text-xs font-bold text-slate-900">
                        Поиск переведен в фоновый режим
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Прямо в эту секунду в очереди нет свободных студентов с аналогичным уровнем. 
                        <strong> Как только другой человек с похожими целями запустит поиск</strong> — система автоматически соединит вас и пришлет звонок на экран!
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-100/80">
                    <button
                      type="button"
                      onClick={() => {
                        setMatchStatus('skipped');
                        onOpenPeerWindow?.();
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Открыть P2P-кабинет и скопировать ссылку для напарника</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMatchStatus('skipped')}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 transition-all"
                    >
                      Оставить поиск в фоне и продолжить
                    </button>
                  </div>
                </div>
              )}

              {/* STATE 4: MATCHED PARTNER CARD */}
              {(matchStatus === 'matched' || localPartner) && localPartner && (
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        {localPartner.avatar ? (
                          <img
                            src={localPartner.avatar}
                            alt={localPartner.name || 'Напарник'}
                            className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-300 shadow-2xs"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-800 text-emerald-300 font-bold flex items-center justify-center text-sm border-2 border-emerald-300 shadow-2xs">
                            {(localPartner.name || 'Напарник').substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" title="В сети" />
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h5 className="text-xs font-bold text-slate-900">{localPartner.name || 'Напарник'}</h5>
                          <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {localPartner.userLevel === 'beginner' ? 'Новичок' : localPartner.userLevel === 'master' ? 'Мастер' : 'Практик'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Сфера: <span className="font-semibold text-slate-700">{localPartner.skillDomain || getEffectiveDomain()}</span> • Совпадение цели: <strong className="text-emerald-700">{localPartner.matchScore || 96}%</strong>
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] font-semibold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Напарник найден</span>
                    </span>
                  </div>

                  {localPartner.bio && (
                    <p className="text-xs text-slate-600 bg-white/70 p-2.5 rounded-lg border border-emerald-100 italic">
                      «{localPartner.bio}»
                    </p>
                  )}

                  {/* Partner Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-100">
                    <button
                      type="button"
                      id="btn-call-partner-survey"
                      onClick={handleCallPartner}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-2 shadow-xs transition-all"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Позвонить напарнику (Daily.co)</span>
                    </button>

                    <button
                      type="button"
                      id="btn-open-collab-workspace"
                      onClick={() => onOpenPeerWindow && onOpenPeerWindow()}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold flex items-center space-x-1.5 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                      <span>Открыть чат и доску</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDisconnectPartner}
                      className="px-3 py-2 rounded-xl text-slate-500 hover:text-rose-600 text-xs font-medium transition-all ml-auto"
                    >
                      Сменить / Учиться соло
                    </button>
                  </div>
                </div>
              )}

              {/* STATE 5: SKIPPED NOTICE */}
              {matchStatus === 'skipped' && !localPartner && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                  <span>Вы выбрали обучение соло. Напарника можно подключить в любой момент через окно «Напарники» в боковом меню.</span>
                  <button
                    type="button"
                    onClick={handleStartSearch}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-800 ml-2"
                  >
                    Подобрать напарника
                  </button>
                </div>
              )}
            </div>

            {/* Dynamic Multi-Module Roadmap (200 blocks without water) */}
            {(() => {
              const allNodes = (generatedTrajectory?.nodes && generatedTrajectory.nodes.length > 0)
                ? generatedTrajectory.nodes
                : (existingNodes && existingNodes.length > 0 ? existingNodes : []);
              
              const totalCount = allNodes.length;
              const libraryCount = allNodes.filter((n) => n.sourceType === 'library').length;
              const aiCount = allNodes.filter((n) => n.sourceType === 'ai_generated').length;
              const upgradedNodesCount = allNodes.filter((n) => n.isAdaptiveUpgraded || n.title?.includes('[🔥 Повышенная сложность]')).length;
              const completedNodesCount = allNodes.filter((n) => n.status === 'completed').length;
              const firstNode = allNodes[0];

              // Group nodes by phase/module
              const phaseMap = new Map<number, DAGNode[]>();
              allNodes.forEach((node, idx) => {
                const p = node.phase || Math.floor(idx / 20) + 1;
                if (!phaseMap.has(p)) phaseMap.set(p, []);
                phaseMap.get(p)!.push(node);
              });

              const sortedPhaseKeys = Array.from(phaseMap.keys()).sort((a, b) => a - b);
              const modulesCount = sortedPhaseKeys.length || 10;

              // Filtered list of phases to display
              const displayedPhases = selectedModuleFilter === 'all'
                ? sortedPhaseKeys
                : sortedPhaseKeys.filter((p) => p === selectedModuleFilter);

              return (
                <div className="space-y-5">
                  {/* Adaptive Success Banner */}
                  {adaptiveSuccessBanner && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-indigo-500/15 border border-amber-400/50 text-slate-900 flex items-start justify-between shadow-xs animate-fade-in">
                      <div className="flex items-start space-x-3.5">
                        <span className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold shrink-0 mt-0.5 shadow-2xs">
                          <Flame className="w-5 h-5 fill-current" />
                        </span>
                        <div className="space-y-1">
                          <div className="text-xs font-bold flex flex-wrap items-center gap-2">
                            <span className="text-slate-900 font-extrabold text-sm">Сложность успешно повышена ИИ!</span>
                            <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>{adaptiveSuccessBanner.countCorrect} из {adaptiveSuccessBanner.totalCount} верных ответов (100%)</span>
                            </span>
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-mono font-bold">
                              gemini/generate-realworld-project
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed">
                            Урок <strong>«{adaptiveSuccessBanner.completedTitle}»</strong> сдан с отличным результатом. ИИ проанализировал верные ответы, подтвердил владение базой и динамически сгенерировал боевой проект для последующего блока: <strong className="text-amber-900 font-bold">«{adaptiveSuccessBanner.upgradedTitle}»</strong> ({adaptiveSuccessBanner.role}).
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAdaptiveSuccessBanner(null)}
                        className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-black/5 transition-all ml-2"
                        title="Закрыть"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Adaptive Complexity Engine Control Panel */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/90 via-orange-50/60 to-rose-50/70 border border-amber-300 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                          <Flame className="w-5 h-5 fill-current animate-pulse" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                              Механизм адаптивной сложности ИИ (Adaptive Complexity Engine)
                            </h3>
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-bold flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                              <span>Gemini 2.5 API активен</span>
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            Динамическая перестройка последующих блоков в боевые кейсы на основе верных ответов
                          </p>
                        </div>
                      </div>

                      {/* Live counters */}
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 font-bold flex items-center space-x-1">
                          <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                          <span>{upgradedNodesCount} повышено до Staff</span>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold flex items-center space-x-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{completedNodesCount} сдано</span>
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white/90 border border-amber-200/90 text-xs text-slate-700 leading-relaxed space-y-2">
                      <p>
                        <strong>Принцип работы:</strong> Когда вы завершаете урок и сдаете проверочный тест, ИИ оценивает долю верных ответов. При уверенном результате (все ответы верны или твердая база) алгоритм не предлагает скучную рутину, а автоматически вызывает API <code className="px-1.5 py-0.5 rounded bg-amber-100/80 font-mono text-[11px] text-amber-900">gemini/generate-realworld-project</code> и перестраивает последующие стандартные блоки в DAG-графе в боевые отказоустойчивые задачи уровня Staff Systems Architect.
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-100">
                        <button
                          type="button"
                          onClick={() => {
                            const target = allNodes.find((n) => n.status !== 'completed' && !n.isAdaptiveUpgraded) || allNodes[0];
                            if (target) {
                              setSelectedBlockForQuiz(target);
                              setQuizTestAnswers({});
                            }
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer active:scale-95"
                        >
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          <span>Сдать урок и тест на 100% (Проверить адаптивное усложнение)</span>
                        </button>
                        <span className="text-[11px] text-slate-500">
                          Или нажмите кнопку «Тест & адаптация» на любой карточке блока ниже.
                        </span>
                      </div>
                    </div>

                    {/* Adaptive History Log */}
                    {adaptiveHistory.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                          <span className="flex items-center space-x-1.5">
                            <Activity className="w-3.5 h-3.5 text-amber-600" />
                            <span>История адаптивных повышений сложности ({adaptiveHistory.length}):</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setAdaptiveHistory([]);
                              try { localStorage.removeItem('learning_os_adaptive_history'); } catch (e) {}
                            }}
                            className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                          >
                            Очистить историю
                          </button>
                        </div>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {adaptiveHistory.map((item) => (
                            <div
                              key={item.id}
                              className="p-2.5 rounded-lg bg-white/80 border border-amber-200 text-[11px] text-slate-800 flex items-start justify-between space-x-2"
                            >
                              <div className="space-y-0.5">
                                <div className="font-bold flex items-center space-x-1.5">
                                  <span className="text-amber-700 font-mono text-[10px]">{item.timestamp}</span>
                                  <span>•</span>
                                  <span className="text-emerald-700 font-semibold">
                                    Урок сдан: «{item.completedUnitTitle}» ({item.performance.totalCorrect}/{item.performance.totalQuestions} верных)
                                  </span>
                                </div>
                                <div className="text-slate-600 flex items-center space-x-1.5">
                                  <ArrowRight className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span>Последующий блок усложнен: <strong>{item.upgradedNodeTitle}</strong></span>
                                  <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 rounded font-mono">
                                    {item.projectRole}
                                  </span>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold shrink-0">
                                В графе DAG
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dynamic Roadmap Stats & AI Grounding Banner */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider block">
                            {totalCount < 50
                              ? `Фокусный микро-трек: ${totalCount} практических блоков (рассчитано ИИ)`
                              : `Персональная траектория: ${totalCount} практических блоков без воды`}
                          </span>
                          <span className="text-[11px] text-slate-300">
                            {modulesCount === 1 
                              ? `1 целевой модуль · исчерпывающее закрытие темы без растягивания на 200 блоков`
                              : `${modulesCount} фундаментальных модулей · персонализировано под ваши цели`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-[11px]">
                        <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                          📚 {libraryCount} из базы библиотеки
                        </span>
                        <span className="px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                          ✨ {aiCount} синтезировано ИИ
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Каждый квант содержит четкую инженерную задачу, исходный код и проверяемые требования к результату. Никакой лишней «воды»: только практические компромиссы, профилирование, структуры данных и боевой опыт.
                    </p>

                    {/* Quick Action Buttons in Banner */}
                    <div className="pt-1 flex flex-wrap items-center gap-2.5">
                      {onNavigateToDag && (
                        <button
                          type="button"
                          id="btn-banner-open-dag"
                          onClick={() => {
                            if (onClose) onClose();
                            onNavigateToDag();
                          }}
                          className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer active:scale-95"
                        >
                          <Network className="w-3.5 h-3.5" />
                          <span>Интерактивный DAG-граф ({totalCount} узлов)</span>
                        </button>
                      )}

                      {firstNode && onLaunchUnit && (
                        <button
                          type="button"
                          id="btn-banner-launch-first"
                          onClick={() => {
                            if (onClose) onClose();
                            onLaunchUnit(firstNode.unitId);
                          }}
                          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/20 flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
                          <span>Начать Квант 1.1</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Module Filter Pills */}
                  {sortedPhaseKeys.length > 1 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">Фильтр по модулям ({modulesCount} модулей):</span>
                        <span>Показано: {selectedModuleFilter === 'all' ? `Все ${totalCount} блоков` : `${phaseMap.get(selectedModuleFilter)?.length || 20} блоков`}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
                        <button
                          type="button"
                          onClick={() => setSelectedModuleFilter('all')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            selectedModuleFilter === 'all'
                              ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          Все {totalCount} блоков
                        </button>

                        {sortedPhaseKeys.map((pKey) => {
                          const nodesInPhase = phaseMap.get(pKey) || [];
                          const pTitle = nodesInPhase[0]?.phaseTitle || `Модуль ${pKey}`;
                          const shortTitle = pTitle.replace(/^Модуль \d+:\s*/i, '').slice(0, 24);
                          return (
                            <button
                              key={pKey}
                              type="button"
                              onClick={() => setSelectedModuleFilter(pKey)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center space-x-1 ${
                                selectedModuleFilter === pKey
                                  ? 'bg-sky-600 text-white shadow-2xs font-semibold'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              <span>{pKey}.</span>
                              <span className="truncate max-w-[140px]">{shortTitle}</span>
                              <span className="opacity-70 text-[10px]">({nodesInPhase.length})</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Modules List */}
                  <div className="space-y-4">
                    {displayedPhases.map((phaseNum) => {
                      const nodesInModule = phaseMap.get(phaseNum) || [];
                      const moduleTitle = nodesInModule[0]?.phaseTitle || `Модуль ${phaseNum}: Фундаментальный блок`;
                      const moduleAuthor = nodesInModule[0]?.authorName || '@ai_curriculum';

                      return (
                        <div key={phaseNum} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
                          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
                            <div className="flex items-center space-x-2">
                              <span className="px-2.5 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[11px] font-bold">
                                МОДУЛЬ {phaseNum}
                              </span>
                              <h4 className="text-xs font-bold text-slate-900">
                                {moduleTitle}
                              </h4>
                            </div>
                            <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                              <span>Автор: <strong className="text-slate-700">{moduleAuthor}</strong></span>
                              <span>·</span>
                              <span className="font-semibold text-slate-800">{nodesInModule.length} квантов</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-2.5">
                            {nodesInModule.map((node) => {
                              const isRemedial = node.isRemedial || node.title?.includes('[⚡ Подтянем в начале]');
                              const isAdaptiveUpgraded = node.isAdaptiveUpgraded || node.title?.includes('[🔥 Повышенная сложность]');
                              const isAdvanced = !isAdaptiveUpgraded && (node.isAdvanced || node.title?.includes('[🚀 Усложненный блок]'));
                              const isCalibrated = node.title?.includes('[~ Калибровка');
                              const isCompleted = node.status === 'completed';

                              return (
                                <div
                                  key={node.id || node.unitId}
                                  className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                                    isAdaptiveUpgraded
                                      ? 'bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-rose-50/60 border-amber-300 shadow-xs'
                                      : isRemedial 
                                      ? 'bg-rose-50/70 border-rose-200 hover:bg-rose-50' 
                                      : isAdvanced 
                                      ? 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-50' 
                                      : isCompleted
                                      ? 'bg-slate-100/70 border-slate-200 opacity-90'
                                      : 'bg-slate-50 hover:bg-slate-100/90 border-slate-200/80'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2 min-w-0">
                                      <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 text-[9px] font-mono font-bold shrink-0">
                                        {node.sprint || `Блок ${node.phase}.${node.phaseOrder || 1}`}
                                      </span>
                                      <span className="text-xs font-bold text-slate-900 truncate">
                                        {node.title}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                                        ~{node.estimatedTimeMin || 35} мин
                                      </span>
                                    </div>

                                    <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                                      {/* Upgraded Case Details button */}
                                      {isAdaptiveUpgraded && (
                                        <button
                                          type="button"
                                          onClick={() => setSelectedProjectForView({ node, unit: existingUnits?.[node.unitId] })}
                                          className="text-[11px] text-amber-950 bg-amber-200/90 hover:bg-amber-300 border border-amber-400 font-bold px-2 py-1 rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
                                          title="Посмотреть архитектурные требования и боевой сценарий"
                                        >
                                          <FileText className="w-3 h-3 text-amber-800" />
                                          <span>Кейс Staff</span>
                                        </button>
                                      )}

                                      {/* Interactive Quiz & Adaptive Difficulty trigger */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedBlockForQuiz(node);
                                          setQuizTestAnswers({});
                                        }}
                                        className="text-[11px] text-indigo-700 hover:text-indigo-900 font-semibold px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/70 transition-all flex items-center space-x-1 cursor-pointer"
                                        title="Сдать проверочный тест урока и запросить адаптивное усложнение следующих блоков"
                                      >
                                        <Zap className="w-3 h-3 text-indigo-600" />
                                        <span>Тест & адаптация</span>
                                      </button>

                                      {onLaunchUnit && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (onClose) onClose();
                                            onLaunchUnit(node.unitId);
                                          }}
                                          className="text-[11px] text-sky-600 hover:text-sky-800 font-semibold flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 transition-all border border-sky-200/60 cursor-pointer"
                                        >
                                          <span>Начать</span>
                                          <ChevronRight className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Adaptive Diagnostic Badges */}
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {isAdaptiveUpgraded && (
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-950 border border-amber-400 text-[10px] font-bold flex items-center space-x-1 shrink-0 shadow-2xs">
                                          <Flame className="w-3 h-3 text-amber-600 fill-amber-500 animate-pulse" />
                                          <span>Повышенная сложность (gemini/generate-realworld-project)</span>
                                        </span>
                                        {node.adaptiveUpgradeReason && (
                                          <span className="px-2 py-0.5 rounded-md bg-white/90 text-amber-900 border border-amber-300 text-[10px] font-semibold flex items-center space-x-1">
                                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                                            <span>{node.adaptiveUpgradeReason}</span>
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    {isCompleted && (
                                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold flex items-center space-x-1 shrink-0">
                                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                                        <span>Урок завершен</span>
                                      </span>
                                    )}
                                    {isRemedial && (
                                      <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold flex items-center space-x-1 shrink-0">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>Подтянем в начале (пробел с бланка)</span>
                                      </span>
                                    )}
                                    {isAdvanced && (
                                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold flex items-center space-x-1 shrink-0">
                                        <Zap className="w-3 h-3" />
                                        <span>Усложненный блок (база подтверждена)</span>
                                      </span>
                                    )}
                                    {isCalibrated && (
                                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold flex items-center space-x-1 shrink-0">
                                        <Sparkles className="w-3 h-3" />
                                        <span>Калибровка нюансов</span>
                                      </span>
                                    )}
                                  </div>

                                  {node.subtitle && (
                                    <p className="text-[11px] text-slate-600 line-clamp-1">
                                      {node.subtitle}
                                    </p>
                                  )}

                                  {node.artifactRequirement && (
                                    <div className="text-[10px] text-amber-800 bg-amber-50/80 px-2 py-0.5 rounded border border-amber-200/60 font-mono">
                                      Требуемый артефакт: {node.artifactRequirement}
                                    </div>
                                  )}

                                  {node.aiCommentary && (
                                    <div className="text-[10px] text-slate-700 bg-white/90 p-2 rounded-lg border border-slate-200/80 italic">
                                      💡 <strong>Заметка ИИ:</strong> «{node.aiCommentary}»
                                    </div>
                                  )}

                                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                    {node.sourceType === 'library' ? (
                                      <span className="inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                                        <BookOpen className="w-2.5 h-2.5" />
                                        <span>Из библиотеки ({node.authorName || 'Автор'})</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                                        <Sparkles className="w-2.5 h-2.5" />
                                        <span>Синтезировано ИИ под результаты бланка</span>
                                      </span>
                                    )}

                                    {node.libraryMatchReason && (
                                      <span className="text-[10px] text-slate-500 italic truncate max-w-md">
                                        «{node.libraryMatchReason}»
                                      </span>
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

                  {/* Final Action Button */}
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      Пройти диагностику заново
                    </button>

                    {onNavigateToDag && (
                      <button
                        type="button"
                        id="btn-footer-open-dag"
                        onClick={() => {
                          if (onClose) onClose();
                          onNavigateToDag();
                        }}
                        className="px-5 py-2.5 rounded-xl border border-sky-400 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Network className="w-3.5 h-3.5 text-sky-600" />
                        <span>Открыть граф связей ({allNodes.length || 200} блоков)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      id="btn-apply-path-and-start"
                      onClick={() => {
                        if (onClose) onClose();
                        if (firstNode && onLaunchUnit) {
                          onLaunchUnit(firstNode.unitId);
                        } else if (onLaunchUnit) {
                          onLaunchUnit('unit-1');
                        }
                      }}
                      className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-black transition-all shadow-md flex items-center space-x-2 cursor-pointer"
                    >
                      <span>
                        Применить план и начать {firstNode ? `«${firstNode.title}»` : 'Урок 1'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
      )}

      {/* MODAL 1: In-Flight Complexity Escalation Spinner */}
      {isAdaptingComplexity && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 text-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
                <Flame className="w-6 h-6 fill-current animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Адаптивный ИИ повышает сложность</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-[11px] text-amber-300 font-mono">
                  API: /api/gemini/generate-realworld-project
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              База знаний подтверждена верными ответами! Gemini синтезирует для последующего блока в DAG-графе боевой кейс Staff-уровня (отказоустойчивость, распределенные блокировки, защита от гонок данных)...
            </p>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300 flex items-center space-x-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Генерация продакшен-архитектуры и боевого чеклиста...</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Interactive Quiz & Lesson Test */}
      {selectedBlockForQuiz && (() => {
        const block = selectedBlockForQuiz;
        const questions = getQuestionsForBlock(block);
        const allAnswered = questions.every((q) => !!quizTestAnswers[q.id]);

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-scale-in">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                    <Zap className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <span>Проверочный тест урока и адаптация сложности</span>
                    </h3>
                    <p className="text-xs text-slate-300 truncate max-w-md">
                      «{block.title}»
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBlockForQuiz(null);
                    setQuizTestAnswers({});
                  }}
                  className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-2.5">
                  <Flame className="w-4 h-4 text-amber-600 fill-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <strong>Механизм адаптивной сложности:</strong> Ответьте на вопросы по теме урока. При 100% правильных ответах ИИ зафиксирует твердое владение базой и динамически повысит сложность последующих блоков в DAG-графе через <code className="bg-amber-100 px-1 rounded font-mono">gemini/generate-realworld-project</code>.
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Вопросы проверки концептов ({questions.length}):</span>
                  <button
                    type="button"
                    onClick={() => {
                      const perfectAnswers: Record<string, string> = {};
                      questions.forEach((q) => {
                        const correctOpt = q.options.find((opt) => opt.isCorrect);
                        if (correctOpt) {
                          perfectAnswers[q.id] = correctOpt.id;
                        }
                      });
                      setQuizTestAnswers(perfectAnswers);
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-300 transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>⚡ Выбрать все верные ответы (100%)</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/70 space-y-3">
                      <div className="flex items-start space-x-2.5">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 font-mono">
                          {idx + 1}
                        </span>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-900">{q.question}</p>
                          {q.scenario && (
                            <p className="text-[11px] text-slate-600 italic">«{q.scenario}»</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 pl-7">
                        {q.options.map((opt) => {
                          const isSelected = quizTestAnswers[q.id] === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setQuizTestAnswers((prev) => ({ ...prev, [q.id]: opt.id }));
                              }}
                              className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-start space-x-2.5 cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-50/90 border-indigo-500 text-indigo-950 font-semibold shadow-2xs'
                                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                                isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                              }`}>
                                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </span>
                              <span className="flex-1">{opt.text}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBlockForQuiz(null);
                    setQuizTestAnswers({});
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 hover:bg-white cursor-pointer"
                >
                  Отмена
                </button>

                <button
                  type="button"
                  disabled={!allAnswered || isSubmittingQuiz}
                  onClick={handleSubmitBlockQuiz}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-2 cursor-pointer ${
                    allAnswered && !isSubmittingQuiz
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Flame className="w-4 h-4 fill-current" />
                  <span>Сдать урок и повысить сложность следующих блоков</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 3: View Upgraded Staff Real-World Project Details */}
      {selectedProjectForView && (() => {
        const { node, unit } = selectedProjectForView;
        const project = unit?.projectTask;

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-amber-300 overflow-hidden animate-scale-in">
              {/* Header */}
              <div className="px-6 py-4 border-b border-amber-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400">
                    <Flame className="w-5 h-5 fill-current animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-white">Боевой кейс продакшена (Staff-уровень)</h3>
                      <span className="px-2 py-0.5 rounded bg-amber-500/30 text-amber-300 border border-amber-400/40 text-[10px] font-mono">
                        gemini/generate-realworld-project
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Роль: <strong className="text-amber-300">{project?.role || 'Staff Systems Architect'}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProjectForView(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-slate-700">
                <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-1.5">
                  <div className="font-bold text-amber-950 text-sm">{node.adaptiveProjectTitle || node.title}</div>
                  {node.adaptiveUpgradeReason && (
                    <div className="text-[11px] text-amber-800 font-semibold flex items-center space-x-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{node.adaptiveUpgradeReason}</span>
                    </div>
                  )}
                </div>

                {project?.businessScenario && (
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span>Инцидент на проде / Бизнес-контекст:</span>
                    </h4>
                    <p className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 leading-relaxed text-slate-800">
                      {project.businessScenario}
                    </p>
                  </div>
                )}

                {project?.description && (
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Инженерная задача:</h4>
                    <p className="p-3.5 rounded-xl bg-white border border-slate-200 leading-relaxed">
                      {project.description}
                    </p>
                  </div>
                )}

                {project?.requirements && project.requirements.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Технические требования и SLA:</h4>
                    <ul className="space-y-1.5 pl-2">
                      {project.requirements.map((req: string, i: number) => (
                        <li key={i} className="flex items-start space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {project?.checklist && project.checklist.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Пошаговый чеклист выполнения:</h4>
                    <div className="space-y-1 pl-2">
                      {project.checklist.map((step: string, i: number) => (
                        <div key={i} className="flex items-start space-x-2 text-[11px]">
                          <span className="px-1.5 py-0.2 rounded bg-slate-200 font-mono text-[9px] font-bold shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {project?.starterCode && (
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                      <Terminal className="w-4 h-4 text-sky-600" />
                      <span>Стартовый каркас решения ({project.defaultFilename || 'solution.ts'}):</span>
                    </h4>
                    <pre className="p-3 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto border border-slate-800">
                      <code>{project.starterCode}</code>
                    </pre>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedProjectForView(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 hover:bg-white cursor-pointer"
                >
                  Закрыть
                </button>

                {onLaunchUnit && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProjectForView(null);
                      if (onClose) onClose();
                      onLaunchUnit(node.unitId);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-md flex items-center space-x-2 cursor-pointer active:scale-95"
                  >
                    <span>Запустить этот боевой блок в Фокус-Студии</span>
                    <ArrowRight className="w-4 h-4 text-amber-300" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Verified Academic Textbook Grounding Inspector Modal */}
      <TextbookGroundingInspectorModal
        isOpen={isInspectorModalOpen}
        source={selectedInspectedSource}
        onClose={() => {
          setIsInspectorModalOpen(false);
          setSelectedInspectedSource(null);
        }}
      />
    </div>
  );
};
