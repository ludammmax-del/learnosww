import React, { useState, useEffect } from 'react';
import { 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Image as ImageIcon, 
  Compass, 
  Users, 
  Sparkles,
  Globe,
  Palette,
  Mic,
  Briefcase,
  Brain,
  Music,
  Activity,
  Layers,
  Search,
  CheckCircle2,
  Clock,
  Target,
  Coffee,
  HelpCircle,
  Lightbulb,
  Radio,
  UserCheck,
  RotateCw,
  Loader2
} from 'lucide-react';
import { CURATED_WALLPAPERS } from '../../services/wallpaperGallery.ts';
import { GlobalWallpaperConfig } from '../../types/wallpaper.ts';
import { playChime } from '../../utils/audio.ts';
import { DAGNode, DAGEdge, UserSkillLevel, LearningUnit, AdminUnitRow, DiagnosticSurveyData } from '../../types.ts';
import { LIBRARY_UNITS_CATALOG } from '../../data/initialData.ts';
import { normalizeDagLayout } from '../../utils/dagLayout.ts';
import { getDomainDiagnosticQuestions, DOMAIN_TOPIC_SUGGESTIONS } from '../../data/domainDiagnosticQuestions.ts';
import { SkillRealityBriefingModal } from '../learning/SkillRealityBriefingModal.tsx';
import { Floating3DGlassOrbs } from '../os/Floating3DGlassOrbs.tsx';

interface OsPersonalizationModalProps {
  currentWallpaperConfig: GlobalWallpaperConfig;
  onSelectWallpaper: (config: GlobalWallpaperConfig) => void;
  onComplete: (settings: {
    targetDomain: string;
    goalTitle: string;
    buddyMode: string;
    buddyLevel: string;
    autoMatch: boolean;
  }) => void;
  onApplyGeneratedPath?: (
    nodes: DAGNode[],
    edges: DAGEdge[],
    summary: any,
    generatedUnits?: Record<string, LearningUnit>
  ) => void;
  adminUnits?: AdminUnitRow[];
}

export const DOMAIN_PRESETS = [
  { 
    id: 'accounting', 
    label: 'Бухгалтерский учет', 
    icon: Layers, 
    defaultRole: 'Бухгалтер / Финансовый специалист',
    defaultGoal: 'Освоить метод двойной записи, проводки, балансовое равенство и закрытие периодов',
    defaultBaggage: 'Хочу понимать экономическую суть счетов и логику финансовой отчетности'
  },
  { 
    id: 'microeconomics', 
    label: 'Микроэкономика', 
    icon: Activity, 
    defaultRole: 'Экономист / Аналитик рынка',
    defaultGoal: 'Понимать рыночное равновесие, эластичность спроса, предельные издержки и поведение потребителей',
    defaultBaggage: 'Хочу освоить фундаментальные микроэкономические модели и законы спроса и предложения'
  },
  { 
    id: 'excel', 
    label: 'Excel и формулы', 
    icon: Search, 
    defaultRole: 'Аналитик данных / Мастер таблиц',
    defaultGoal: 'Мастерски владеть абсолютными ссылками, XLOOKUP, сводными таблицами и формулами анализа',
    defaultBaggage: 'Хочу автоматизировать рутинные расчеты и исключить человеческие ошибки в отчетах'
  },
  { 
    id: 'languages', 
    label: 'Иностранные языки', 
    icon: Globe, 
    defaultRole: 'Практик языка / Спикер',
    defaultGoal: 'Свободно говорить без языкового барьера и внутреннего перевода',
    defaultBaggage: 'Знаю грамматику и слова пассивно, но есть страх говорить вслух без подготовки'
  },
  { 
    id: 'speaking', 
    label: 'Ораторское мастерство', 
    icon: Mic, 
    defaultRole: 'Публичный спикер / Презентатор',
    defaultGoal: 'Уверенно выступать перед любой аудиторией, поставить голос и подачу',
    defaultBaggage: 'Хочу говорить емко, харизматично, без волнения и слов-паразитов'
  },
  { 
    id: 'design', 
    label: 'Дизайн и UI/UX', 
    icon: Palette, 
    defaultRole: 'UI/UX Designer / Создатель',
    defaultGoal: 'Освоить основы визуальной иерархии, сетки отступов и собрать чистый экран в Figma',
    defaultBaggage: 'Хочу понять, почему одни интерфейсы удобные, а другие вызывают стресс и раздражение'
  },
  { 
    id: 'business', 
    label: 'Бизнес и Продажи', 
    icon: Briefcase, 
    defaultRole: 'Предприниматель / Менеджер',
    defaultGoal: 'Разобраться в юнит-экономике, переговорах и тестировании продуктовых гипотез',
    defaultBaggage: 'Хочу понимать логику создания ценности и проверять спрос до больших инвестиций'
  },
  { 
    id: 'music', 
    label: 'Музыка и Звук', 
    icon: Music, 
    defaultRole: 'Музыкант / Продюсер',
    defaultGoal: 'Освоить инструмент, теорию гармонии, чувство ритма и развитие слуха',
    defaultBaggage: 'Хочу понимать логику музыки и свободно играть без зажима'
  },
  { 
    id: 'thinking', 
    label: 'Критическое мышление', 
    icon: Brain, 
    defaultRole: 'Мыслитель / Стратег',
    defaultGoal: 'Развить прикладную логику, видеть когнитивные искажения и принимать решения',
    defaultBaggage: 'Хочу мыслить структурно от первых принципов и не попадаться в ментальные ловушки'
  },
  { 
    id: 'tech', 
    label: 'Прикладные технологии', 
    icon: Layers, 
    defaultRole: 'Специалист по автоматизации и системам',
    defaultGoal: 'Понять алгоритмическую логику, автоматизацию и устройство цифровых инструментов',
    defaultBaggage: 'Начинаю с нуля, хочу понять базовые алгоритмы и логику на простых примерах'
  },
  { 
    id: 'custom', 
    label: 'Свой навык...', 
    icon: Target, 
    defaultRole: 'Специалист в своем деле',
    defaultGoal: 'Освоить выбранную область и дойти до реального измеримого результата',
    defaultBaggage: 'Хочу структурировать знания и практиковаться шаг за шагом в Фокус-Студии'
  }
];

export const INITIAL_DIAGNOSTIC_QUESTIONS = [
  {
    id: 'q1',
    topic: 'Пошаговое выполнение команд (Алгоритмы)',
    scenario: 'Компьютерная программа — это точный пошаговый рецепт. Компьютер выполняет команды строго по порядку, сверху вниз. Он не умеет читать мысли: если попытаться сложить числа в переменных до того, как они созданы, программа выдаст ошибку.',
    question: 'Логически рассуждая, почему программа выдает сбой, если обратиться к данным до их сохранения?',
    options: [
      { id: 'opt-1', text: 'Компьютер еще не выделил ячейку памяти и не знает значение, поэтому операция невозможна', trait: 'Логично / Верно' },
      { id: 'opt-2', text: 'Компьютер сам автоматически угадает любое случайное число и продолжит', trait: 'Поспешно' },
      { id: 'opt-3', text: 'Порядок строчек в коде не имеет значения, программа читает все строки одновременно', trait: 'Нелогично' },
    ],
  },
  {
    id: 'q2',
    topic: 'Условия и развилки (If / Else)',
    scenario: 'Вся логика строится на условиях: «ЕСЛИ баланс больше стоимости товара, ТО списать деньги, ИНАЧЕ показать сообщение о нехватке средств».',
    question: 'К какому логическому сбою приведет программа банкомата, если программист забыл добавить ветку проверки «ИНАЧЕ»?',
    options: [
      { id: 'opt-2a', text: 'Банкомат выдаст деньги человеку даже с пустым счетом, либо зависнет без ответа при нехватке средств', trait: 'Логично / Верно' },
      { id: 'opt-2b', text: 'Банкомат сам позвонит в полицию без всякой причины', trait: 'Поспешно' },
      { id: 'opt-2c', text: 'Банкомат мгновенно отключится от электричества', trait: 'Нелогично' },
    ],
  },
  {
    id: 'q3',
    topic: 'Повторяющиеся действия (Циклы)',
    scenario: 'Чтобы не копировать одну команду 100 раз (например, отправить уведомления 100 студентам), используют цикл. Но цикл обязательно должен знать условие своей остановки, иначе он будет повторяться вечно.',
    question: 'Что произойдет, если в условии завершения цикла допущена ошибка и оно никогда не наступает?',
    options: [
      { id: 'opt-3a', text: 'Программа зависнет в бесконечном круге, загрузит 100% процессора и перестанет отвечать на команды', trait: 'Логично / Верно' },
      { id: 'opt-3b', text: 'Программа сама догадается остановиться ровно через 5 секунд', trait: 'Поспешно' },
      { id: 'opt-3c', text: 'Компьютер немедленно выключится навсегда', trait: 'Нелогично' },
    ],
  },
];

function shuffleOptionsList<T>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const OsPersonalizationModal: React.FC<OsPersonalizationModalProps> = ({
  currentWallpaperConfig,
  onSelectWallpaper,
  onComplete,
  onApplyGeneratedPath,
  adminUnits = [],
}) => {
  // Stepper: 1: Направление -> 2: Зачем учите? -> 3: Экспресс-диагностика -> 4: Траектория и старт
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields (Step 1)
  const [trackScope, setTrackScope] = useState<'full_course' | 'single_topic'>('full_course');
  const [singleTopicTarget, setSingleTopicTarget] = useState<string>('');
  const [selectedDomainId, setSelectedDomainId] = useState<string>('languages');
  const [customDomainText, setCustomDomainText] = useState<string>('');
  const [userLevel, setUserLevel] = useState<UserSkillLevel>('beginner');
  const [userAge, setUserAge] = useState<string>(() => {
    try {
      return localStorage.getItem('learning_os_user_age') || '24';
    } catch {
      return '24';
    }
  });
  const [selectedAgeCategoryId, setSelectedAgeCategoryId] = useState<string>('student');
  const [targetRole, setTargetRole] = useState('Практик языка / Спикер');
  const [targetGoal, setTargetGoal] = useState('Свободно говорить без языкового барьера и внутреннего перевода');
  const [whyGoal, setWhyGoal] = useState<string>(() => {
    try {
      return localStorage.getItem('learning_os_user_purpose') || 'Создать и запустить реальный рабочий проект без абстрактной воды';
    } catch {
      return 'Создать и запустить реальный рабочий проект без абстрактной воды';
    }
  });
  const [baggageAndBottlenecks, setBaggageAndBottlenecks] = useState(
    'Знаю грамматику и слова пассивно, но есть страх говорить вслух без подготовки.'
  );
  const [timeResource, setTimeResource] = useState('3 раза в неделю по 45 мин + суббота 2 часа');
  const [thinkingStyle, setThinkingStyle] = useState<'visual' | 'engineering' | 'conceptual'>('visual');
  const [selectedWallpaperId, setSelectedWallpaperId] = useState<string>(currentWallpaperConfig.wallpaperId);

  // Diagnostic Questions (Step 2: Domain-aware & AI-Generated based on survey with shuffled options)
  const [dynamicQuestions, setDynamicQuestions] = useState<any[]>(() =>
    getDomainDiagnosticQuestions('languages')
  );
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<boolean>(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  // Step 3: Path Generation & Matchmaking Choice
  const [isGeneratingPath, setIsGeneratingPath] = useState(false);
  const [teaStep, setTeaStep] = useState(0);
  const [generatedSummary, setGeneratedSummary] = useState<any | null>(null);
  const [generatedNodes, setGeneratedNodes] = useState<DAGNode[] | null>(null);
  const [generatedEdges, setGeneratedEdges] = useState<DAGEdge[] | null>(null);
  const [generatedUnits, setGeneratedUnits] = useState<Record<string, LearningUnit> | null>(null);
  const [wantsPartnerSearch, setWantsPartnerSearch] = useState<boolean>(true);

  // Change domain handler
  const handleDomainSelect = (presetId: string) => {
    setSelectedDomainId(presetId);
    playChime('click');
    const p = DOMAIN_PRESETS.find((d) => d.id === presetId);
    if (p && presetId !== 'custom') {
      setTargetRole(p.defaultRole);
      setTargetGoal(p.defaultGoal);
      setBaggageAndBottlenecks(p.defaultBaggage);
      setDynamicQuestions(getDomainDiagnosticQuestions(presetId));
      setSelectedAnswers({});
      if (DOMAIN_TOPIC_SUGGESTIONS[presetId]?.[0]) {
        setSingleTopicTarget(DOMAIN_TOPIC_SUGGESTIONS[presetId][0]);
      }
    }
  };

  const getEffectiveDomain = () => {
    if (selectedDomainId === 'custom' && customDomainText.trim()) {
      return customDomainText.trim();
    }
    const p = DOMAIN_PRESETS.find((d) => d.id === selectedDomainId);
    return p?.label || 'Практическое мастерство';
  };

  // Step 1 -> Step 2: Dynamically generate questions through Gemini based on survey inputs
  const loadQuestionsFromAI = async () => {
    setIsGeneratingQuestions(true);
    const activeDomain = getEffectiveDomain();
    const effectiveGoal = trackScope === 'single_topic' 
      ? (singleTopicTarget.trim() || targetGoal || `Освоить тему «${activeDomain}» на практике`) 
      : targetGoal;
    const effectiveRole = trackScope === 'single_topic' && !targetRole.trim()
      ? `Практик (${activeDomain})`
      : targetRole;

    // Commit purpose into permanent Epistemic Memory (No-Water Filter)
    try {
      localStorage.setItem('learning_os_user_purpose', whyGoal);
      fetch('/api/epistemic/set-purpose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: whyGoal,
          domain: activeDomain,
          targetGoal: effectiveGoal,
        }),
      }).catch(() => {});
    } catch {}

    try {
      const res = await fetch('/api/gemini/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: effectiveGoal,
          whyGoal,
          userPurpose: whyGoal,
          background: baggageAndBottlenecks,
          targetRole: effectiveRole,
          userLevel,
          skillDomain: activeDomain,
          userAge: userAge ? parseInt(userAge, 10) || userAge : undefined,
          ageCategory: selectedAgeCategoryId,
          trackScope,
          singleTopicTarget: trackScope === 'single_topic' ? (singleTopicTarget.trim() || effectiveGoal) : undefined,
        }),
      });
      const data = await res.json();
      if (data && data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        const shuffled = data.questions.map((q: any) => ({
          ...q,
          options: shuffleOptionsList(q.options || []),
        }));
        setDynamicQuestions(shuffled);
        setSelectedAnswers({});
        playChime('success');
      } else {
        setDynamicQuestions(getDomainDiagnosticQuestions(activeDomain));
      }
    } catch (err) {
      console.warn('[Personalization] Could not generate AI questions, using domain fallback:', err);
      setDynamicQuestions(getDomainDiagnosticQuestions(activeDomain));
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleProceedToStep2 = () => {
    playChime('click');
    setStep(2);
  };

  const handleProceedToStep3 = () => {
    playChime('click');
    setStep(3);
    loadQuestionsFromAI();
  };

  // Wallpaper preview
  const handleWallpaperClick = (wpId: string) => {
    setSelectedWallpaperId(wpId);
    playChime('click');
    onSelectWallpaper({
      ...currentWallpaperConfig,
      wallpaperId: wpId,
      applyEverywhere: true,
    });
  };

  // Step 3 to Step 4: Trigger Generation
  const handleProceedToGeneration = async () => {
    setStep(4);
    setIsGeneratingPath(true);
    setTeaStep(0);
    playChime('click');

    const teaTimer1 = setTimeout(() => setTeaStep(1), 800);
    const teaTimer2 = setTimeout(() => setTeaStep(2), 1800);
    const teaTimer3 = setTimeout(() => setTeaStep(3), 2800);

    const activeDomain = getEffectiveDomain();
    const effectiveGoal = trackScope === 'single_topic' 
      ? (singleTopicTarget.trim() || targetGoal || `Освоить тему «${activeDomain}» на практике`) 
      : targetGoal;
    const effectiveRole = trackScope === 'single_topic' && !targetRole.trim()
      ? `Практик (${activeDomain})`
      : targetRole;

    try {
      const calibrationDetails = dynamicQuestions.map((q) => {
        const chosen = q.options?.find((opt: any) => opt.id === selectedAnswers[q.id]);
        return {
          questionId: q.id,
          topic: q.topic,
          question: q.question,
          chosenAnswer: chosen ? chosen.text : (selectedAnswers[q.id] || 'Не выбран'),
          trait: chosen ? chosen.trait : 'Unknown',
          scenario: q.scenario,
        };
      });

      const surveyPayload: DiagnosticSurveyData = {
        targetGoal: effectiveGoal,
        whyGoal,
        userPurpose: whyGoal,
        targetRole: effectiveRole,
        skillDomain: activeDomain,
        userLevel,
        userAge: userAge ? parseInt(userAge, 10) || userAge : undefined,
        ageCategory: selectedAgeCategoryId,
        baggageAndBottlenecks,
        timeResource,
        thinkingStyle,
        calibrationAnswers: selectedAnswers,
        calibrationDetails,
        diagnosticQuestions: dynamicQuestions,
        trackScope,
        singleTopicTarget: trackScope === 'single_topic' ? (singleTopicTarget.trim() || effectiveGoal) : undefined,
      };

      try {
        localStorage.setItem('learning_os_user_purpose', whyGoal);
        fetch('/api/epistemic/set-purpose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            purpose: whyGoal,
            domain: activeDomain,
            targetGoal: effectiveGoal,
          }),
        }).catch(() => {});
      } catch {}

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
        }),
      });

      let data: any = null;
      try {
        const text = await res.text();
        if (text && text.trim().startsWith('{')) {
          data = JSON.parse(text);
        }
      } catch (e) {
        console.warn('Fallback JSON parsing:', e);
      }

      if (data && data.nodes && data.edges && data.nodes.length > 0) {
        const normalized = normalizeDagLayout(data.nodes, data.edges);
        setGeneratedNodes(normalized.nodes);
        setGeneratedEdges(normalized.edges);
        setGeneratedSummary(data.diagnosticSummary);
        if (data.generatedUnits) setGeneratedUnits(data.generatedUnits);
      }
    } catch (err) {
      console.warn('Path generation call handled:', err);
    } finally {
      setTimeout(() => {
        setIsGeneratingPath(false);
        playChime('success');
      }, 500);
    }

    return () => {
      clearTimeout(teaTimer1);
      clearTimeout(teaTimer2);
      clearTimeout(teaTimer3);
    };
  };

  const handleFinishAndEnter = () => {
    playChime('success');
    const domainTitle = getEffectiveDomain();

    // Mark completion in storage
    try {
      localStorage.setItem('learning_os_survey_completed', 'true');
      localStorage.setItem('learning_os_personalized', 'true');
      localStorage.setItem('learning_os_target_domain', domainTitle);
      localStorage.setItem('learning_os_user_level', userLevel);
      localStorage.setItem('learning_os_target_role', targetRole);
      localStorage.setItem('learning_os_target_goal', targetGoal);
    } catch {}

    // Apply generated DAG nodes if available
    if (generatedNodes && generatedEdges && onApplyGeneratedPath) {
      onApplyGeneratedPath(generatedNodes, generatedEdges, generatedSummary, generatedUnits || undefined);
    }

    onComplete({
      targetDomain: domainTitle,
      goalTitle: targetGoal,
      buddyMode: 'pair_practice',
      buddyLevel: userLevel,
      autoMatch: wantsPartnerSearch,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-2 sm:p-6 flex items-start sm:items-center justify-center bg-slate-900/50 backdrop-blur-md animate-fade-in select-none">
      {/* Ambient 3D Glass Orbs behind modal */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-80">
        <Floating3DGlassOrbs count={55} className="w-full h-full" />
      </div>

      <div className="relative z-10 w-full max-w-3xl my-auto bg-white/90 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_25px_60px_rgba(15,23,42,0.15)] p-4 sm:p-8 flex flex-col space-y-5 text-slate-800 max-h-[95vh] overflow-y-auto ring-1 ring-slate-900/5">
        
        {/* Minimalist Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-slate-900" />
              <h2 className="text-xl sm:text-2xl font-light tracking-tight text-slate-900">
                Калибровка траектории обучения
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {step === 1 && (trackScope === 'single_topic' ? 'Шаг 1 из 4: Направление и закрываемая тема' : 'Шаг 1 из 4: Направление, масштаб и параметры')}
              {step === 2 && 'Шаг 2 из 4: Зачем вы это учите? (Фиксация в постоянную память ИИ)'}
              {step === 3 && 'Шаг 3 из 4: Экспресс-диагностика логики'}
              {step === 4 && (trackScope === 'single_topic' ? `Шаг 4 из 4: Адаптивный микро-трек (рассчитано ИИ)` : 'Шаг 4 из 4: Персональный DAG-граф на 200 блоков')}
            </p>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            {[1, 2, 3, 4].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  if (s <= step) setStep(s as any);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  s === step ? 'w-7 bg-slate-900' : s < step ? 'w-3 bg-slate-400' : 'w-2 bg-slate-200'
                }`}
                title={`Шаг ${s}`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: ОБЪЕМ, НАПРАВЛЕНИЕ, ЦЕЛИ, БАРЬЕРЫ И СТИЛЬ МЫШЛЕНИЯ */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            {/* 0. Course Scope & Mode Selection */}
            <div className="space-y-3 p-4 rounded-2xl bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-xs font-semibold text-slate-900 flex items-center space-x-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                  <span>1. Объем и формат программы обучения:</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  {trackScope === 'full_course' ? '200 блоков · 10 модулей' : 'Адаптивный объем по расчету ИИ'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Option 1: Full Course */}
                <button
                  type="button"
                  onClick={() => {
                    setTrackScope('full_course');
                    playChime('click');
                  }}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between space-y-2 ${
                    trackScope === 'full_course'
                      ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Layers className={`w-4 h-4 ${trackScope === 'full_course' ? 'text-indigo-300' : 'text-slate-500'}`} />
                      <span className="text-xs font-semibold">Полный фундаментальный курс</span>
                    </div>
                    {trackScope === 'full_course' && (
                      <div className="w-4 h-4 rounded-full bg-white text-slate-950 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <p className={`text-[11px] leading-relaxed ${trackScope === 'full_course' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Глубокая программа из 200 практических блоков (10 модулей от фундамента до уровня Lead по всей дисциплине).
                  </p>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md self-start ${trackScope === 'full_course' ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    200 квантов · Полная траектория
                  </span>
                </button>

                {/* Option 2: Single Topic / Gap Closure */}
                <button
                  type="button"
                  onClick={() => {
                    setTrackScope('single_topic');
                    playChime('click');
                    if (!singleTopicTarget && DOMAIN_TOPIC_SUGGESTIONS[selectedDomainId]?.[0]) {
                      setSingleTopicTarget(DOMAIN_TOPIC_SUGGESTIONS[selectedDomainId][0]);
                    }
                  }}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between space-y-2 ${
                    trackScope === 'single_topic'
                      ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Target className={`w-4 h-4 ${trackScope === 'single_topic' ? 'text-indigo-300' : 'text-slate-500'}`} />
                      <span className="text-xs font-semibold">Точечное закрытие темы / пробела</span>
                    </div>
                    {trackScope === 'single_topic' && (
                      <div className="w-4 h-4 rounded-full bg-white text-slate-950 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <p className={`text-[11px] leading-relaxed ${trackScope === 'single_topic' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Микро-трек под конкретную задачу. ИИ сам определит точное число квантов без 200 блоков и без лишней воды.
                  </p>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md self-start ${trackScope === 'single_topic' ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/40' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
                    🎯 Адаптивный объем по расчету ИИ
                  </span>
                </button>
              </div>

              {/* Single Topic Targeted Input & Quick Chips */}
              {trackScope === 'single_topic' && (
                <div className="mt-2 pt-3 border-t border-slate-200/80 space-y-2.5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-800 flex items-center space-x-1.5">
                      <Target className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Какую конкретную тему или задачу нужно закрыть?</span>
                    </label>
                    <span className="text-[10px] text-indigo-600 font-mono font-medium">
                      ИИ подберет 4–14 квантов
                    </span>
                  </div>

                  <input
                    type="text"
                    value={singleTopicTarget}
                    onChange={(e) => setSingleTopicTarget(e.target.value)}
                    placeholder="Например: Проводки и баланс / Формула XLOOKUP / Эластичность спроса / Спонтанная речь..."
                    className="w-full py-2.5 px-3.5 rounded-xl bg-white border border-slate-300 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs text-slate-900 placeholder:text-slate-400"
                  />

                  {/* Domain-aware Quick Clickable Topic Suggestions */}
                  {DOMAIN_TOPIC_SUGGESTIONS[selectedDomainId] && DOMAIN_TOPIC_SUGGESTIONS[selectedDomainId].length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-500 block">Быстрый выбор популярной темы:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {DOMAIN_TOPIC_SUGGESTIONS[selectedDomainId].map((topic) => {
                          const isPicked = singleTopicTarget === topic;
                          return (
                            <button
                              key={topic}
                              type="button"
                              onClick={() => {
                                setSingleTopicTarget(topic);
                                playChime('click');
                              }}
                              className={`text-[11px] py-1 px-2.5 rounded-lg border transition cursor-pointer flex items-center space-x-1 ${
                                isPicked
                                  ? 'border-slate-900 bg-slate-900 text-white font-medium shadow-2xs'
                                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                              }`}
                            >
                              <span>{topic}</span>
                              {isPicked && <Check className="w-3 h-3 text-white" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed flex items-start space-x-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Умный расчет объема:</strong> ИИ-методист Gemini создаст компактный DAG-граф с оптимальным количеством практических квантов и итоговым проектом, достаточным для полного закрытия темы.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Domain Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                2. Выберите ключевое направление:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DOMAIN_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = selectedDomainId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleDomainSelect(preset.id)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col space-y-1.5 ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                      <span className="text-xs font-medium leading-tight">{preset.label}</span>
                    </button>
                  );
                })}
              </div>

              {selectedDomainId === 'custom' && (
                <input
                  type="text"
                  placeholder="Введите ваше направление (например: Go Backend, 3D Графика, Переговоры...)"
                  value={customDomainText}
                  onChange={(e) => setCustomDomainText(e.target.value)}
                  className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              )}
            </div>

            {/* 2. Skill Level Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                2. Текущий уровень подготовки:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'beginner', title: 'Начинающий', desc: 'С нуля или отрывочные знания' },
                  { id: 'intermediate', title: 'Практикующий', desc: 'Есть база, нужен прорыв и системность' },
                  { id: 'master', title: 'Архитектор / Lead', desc: 'Углубление в сложные кейсы и системы' },
                ].map((lvl) => {
                  const isSelected = userLevel === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setUserLevel(lvl.id as any)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        isSelected
                          ? 'border-slate-900 bg-slate-50 text-slate-900 font-semibold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <div className="text-xs font-medium">{lvl.title}</div>
                      <div className="text-[11px] text-slate-400 font-normal mt-0.5">{lvl.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Age Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 block">
                  3. Ваш возраст (ИИ адаптирует примеры, темп и сложность проектов):
                </label>
                <div className="flex items-center space-x-1.5 text-xs text-slate-600">
                  <span>Возраст:</span>
                  <input
                    type="number"
                    min="10"
                    max="99"
                    value={userAge}
                    onChange={(e) => setUserAge(e.target.value)}
                    className="w-14 py-1 px-2 text-center rounded-lg bg-slate-100 border border-slate-300 text-slate-900 font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <span>лет</span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'teen', label: '12–17 лет', desc: 'Подросток / Школа', defaultAge: '16' },
                  { id: 'student', label: '18–24 года', desc: 'Студент / Старт', defaultAge: '21' },
                  { id: 'pro', label: '25–39 лет', desc: 'Практик / Смена стека', defaultAge: '29' },
                  { id: 'senior_pro', label: '40+ лет', desc: 'Опытный / Глубина', defaultAge: '45' },
                ].map((cat) => {
                  const isSelected = selectedAgeCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedAgeCategoryId(cat.id);
                        setUserAge(cat.defaultAge);
                        playChime('click');
                      }}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-medium">{cat.label}</div>
                      <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                        {cat.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Role & Goal (Only for Full Fundamental Course to avoid double input when targeting single topic) */}
            {trackScope === 'full_course' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                      5. Целевая роль:
                    </label>
                    <input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="Например: Middle UI Designer"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                      6. Измеримая цель обучения:
                    </label>
                    <input
                      type="text"
                      value={targetGoal}
                      onChange={(e) => setTargetGoal(e.target.value)}
                      placeholder="Например: Свободный диалог на 10 минут без подсказок"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>

                {/* Baggage & Bottlenecks */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">
                    7. Исходный багаж и главные затыки:
                  </label>
                  <textarea
                    rows={2}
                    value={baggageAndBottlenecks}
                    onChange={(e) => setBaggageAndBottlenecks(e.target.value)}
                    placeholder="Что сейчас дается сложнее всего? Где главный барьер?"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 resize-none"
                  />
                </div>
              </>
            ) : (
              /* Single Topic Mode: Concise context field */
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-xs font-semibold text-slate-700 block">
                  5. С какими трудностями в этой теме вы уже сталкивались? (опционально):
                </label>
                <textarea
                  rows={2}
                  value={baggageAndBottlenecks}
                  onChange={(e) => setBaggageAndBottlenecks(e.target.value)}
                  placeholder="Опишите, что именно непонятно в выбранной теме или где возникает тупик..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 resize-none"
                />
              </div>
            )}

            {/* Thinking Style & Time Resource */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  {trackScope === 'full_course' ? '8. Стиль мышления:' : '6. Стиль мышления:'}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'visual', label: 'Визуальный' },
                    { id: 'engineering', label: 'Структурный' },
                    { id: 'conceptual', label: 'Принципы' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setThinkingStyle(style.id as any)}
                      className={`py-2 px-1 text-center rounded-lg border text-xs font-medium transition cursor-pointer ${
                        thinkingStyle === style.id
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  {trackScope === 'full_course' ? '9. Ресурс времени в неделю:' : '7. Ресурс времени в неделю:'}
                </label>
                <input
                  type="text"
                  value={timeResource}
                  onChange={(e) => setTimeResource(e.target.value)}
                  placeholder="Например: 3 раза по 45 мин"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Optional Minimal Wallpaper Choice */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Эстетика рабочего стола:</span>
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {CURATED_WALLPAPERS.slice(0, 6).map((wp) => {
                  const isSelected = selectedWallpaperId === wp.id;
                  return (
                    <button
                      key={wp.id}
                      type="button"
                      onClick={() => handleWallpaperClick(wp.id)}
                      className={`relative shrink-0 w-20 h-12 rounded-lg overflow-hidden border-2 transition cursor-pointer ${
                        isSelected ? 'border-slate-900 shadow-sm' : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img src={wp.thumbnail || wp.url} alt={wp.title} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center text-white">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Next Button -> Step 2 */}
            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={handleProceedToStep2}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center space-x-2 transition cursor-pointer shadow-xs"
              >
                <span>Далее: Зачем вы это учите? (Шаг 2)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: DEDICATED SEPARATE BLOCK/SCREEN: ЗАЧЕМ ВЫ ЭТО УЧИТЕ? */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="p-5 rounded-2xl border-2 border-indigo-200 bg-linear-to-br from-indigo-50/90 via-purple-50/40 to-slate-50 space-y-4 shadow-xs">
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
                  <strong>Фильтр No-Water:</strong> на основе этой цели ИИ будет давать только тот материал, код и практические задания, которые нужны конкретно для вашей задачи — ничего лишнего.
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
                  rows={3}
                  value={whyGoal}
                  onChange={(e) => setWhyGoal(e.target.value)}
                  placeholder="Например: хочу запустить работающий веб-сервис для клиентов / пройти собеседование / автоматизировать отчетность..."
                  className="w-full px-4 py-3 rounded-xl border border-indigo-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all shadow-2xs resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Step 2 Bottom Navigation */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  playChime('click');
                  setStep(1);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer flex items-center space-x-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Назад</span>
              </button>

              <button
                type="button"
                onClick={handleProceedToStep3}
                disabled={isGeneratingQuestions}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center space-x-2 transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Далее: К проверочным вопросам (Шаг 3)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: ДИАГНОСТИЧЕСКИЕ ВОПРОСЫ (3 КЕЙСА) */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            {/* AI Calibration Banner with Regenerate Action */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between space-x-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-800">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Персональная экспресс-калибровка от Google Gemini</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Кейсы сгенерированы ИИ строго под направление «<strong>{getEffectiveDomain()}</strong>» и вашу цель. Ответьте, как бы вы поступили на практике — это определит структуру вашего DAG-графа.
                </p>
              </div>
              <button
                type="button"
                onClick={loadQuestionsFromAI}
                disabled={isGeneratingQuestions}
                className="shrink-0 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-600 hover:text-slate-900 text-xs font-medium transition cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                title="Сгенерировать другие вопросы через ИИ"
              >
                <RotateCw className={`w-3.5 h-3.5 text-slate-500 ${isGeneratingQuestions ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Перегенерировать</span>
              </button>
            </div>

            {isGeneratingQuestions ? (
              <div className="py-14 flex flex-col items-center justify-center space-y-4 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
                  <Sparkles className="w-5 h-5 text-indigo-500 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-800">
                    Google Gemini генерирует индивидуальные проверочные кейсы...
                  </div>
                  <div className="text-[11px] text-slate-500 max-w-sm">
                    Анализируем направление «{getEffectiveDomain()}», цель «{targetGoal}» и уровень «{userLevel}» для точной калибровки графа.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {dynamicQuestions.map((q, idx) => (
                  <div key={q.id || idx} className="p-4 rounded-2xl border border-slate-200/90 bg-white space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-900">{q.topic}</span>
                    </div>

                    {q.scenario && (
                      <p className="text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                        {q.scenario}
                      </p>
                    )}

                    <div className="text-xs font-medium text-slate-800">
                      {q.question}
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {q.options?.map((opt: any) => {
                        const isChosen = selectedAnswers[q.id] === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setSelectedAnswers((prev) => ({ ...prev, [q.id]: opt.id }));
                              playChime('click');
                            }}
                            className={`w-full p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                              isChosen
                                ? 'border-slate-900 bg-slate-900 text-white shadow-2xs'
                                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                            }`}
                          >
                            <span className="pr-3 leading-relaxed">{opt.text}</span>
                            <div
                              className={`shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                isChosen
                                  ? 'border-white bg-white text-slate-900'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isChosen && <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 3 Actions */}
            {(() => {
              const answeredCount = dynamicQuestions.filter((q) => Boolean(selectedAnswers[q.id])).length;
              const allAnswered = dynamicQuestions.length > 0 && answeredCount === dynamicQuestions.length;

              return (
                <div className="pt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      playChime('click');
                      setStep(2);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Назад к цели</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleProceedToGeneration}
                    disabled={isGeneratingQuestions || !allAnswered}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center space-x-2 transition cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>
                      {allAnswered
                        ? 'Сформировать траекторию обучения (Шаг 4)'
                        : `Выберите ответы (${answeredCount}/${dynamicQuestions.length})`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* STEP 4: ГЕНЕРАЦИЯ И СТАРТ СИСТЕМЫ */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in text-center py-4">
            {isGeneratingPath ? (
              <div className="space-y-6 py-8">
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-slate-100 animate-ping" />
                  <div className="relative w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                    <Coffee className="w-6 h-6 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Завариваем чай и калибруем программу...
                  </h3>
                  <p className="text-xs text-slate-500">
                    ИИ-Оператор выстраивает зависимости (DAG) для «{getEffectiveDomain()}»
                  </p>
                </div>

                {/* Progress Indicators */}
                <div className="max-w-md mx-auto space-y-2 text-left text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center space-x-2 text-slate-700">
                    <span className={`w-2 h-2 rounded-full ${teaStep >= 1 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span>Анализ ответов и когнитивного профиля</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-700">
                    <span className={`w-2 h-2 rounded-full ${teaStep >= 2 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span>Устранение барьеров и калибровка первых 20 часов</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-700">
                    <span className={`w-2 h-2 rounded-full ${teaStep >= 3 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span>Сборка 200 блоков и практических артефактов</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-5xl mx-auto space-y-6">
                {/* Minimalist Animated Skill Reality Briefing */}
                <SkillRealityBriefingModal
                  briefing={generatedSummary?.realityBriefing}
                  domainTitle={getEffectiveDomain()}
                  userAge={userAge}
                  targetGoal={targetGoal}
                  wantsPartnerSearch={wantsPartnerSearch}
                  onTogglePartnerSearch={(val) => setWantsPartnerSearch(val)}
                  onConfirmAndStart={handleFinishAndEnter}
                  isInlineCard={true}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
