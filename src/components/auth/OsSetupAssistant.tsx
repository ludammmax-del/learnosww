import React, { useState } from 'react';
import { 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Search,
  X,
  Globe, 
  Palette, 
  Mic, 
  Briefcase, 
  Brain, 
  Music, 
  Target, 
  FileSpreadsheet,
  BarChart3,
  TrendingUp,
  Layers,
  Terminal,
  Users,
  Sparkles,
  Cpu,
  LogOut,
  User
} from 'lucide-react';
import { playChime } from '../../utils/audio.ts';
import { 
  DAGNode, 
  DAGEdge, 
  UserSkillLevel, 
  LearningUnit, 
  AdminUnitRow
} from '../../types.ts';
import { LIBRARY_UNITS_CATALOG } from '../../data/initialData.ts';
import { loginWithGoogle } from '../../firebase.ts';
import { GlobalWallpaperConfig } from '../../types/wallpaper.ts';
import { HandwrittenHelloIntro } from '../os/HandwrittenHelloIntro.tsx';
import { OsModulesShowcase } from './OsModulesShowcase.tsx';
import { OsCourseGenerationStep } from './OsCourseGenerationStep.tsx';

export interface OsSetupUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

interface OsSetupAssistantProps {
  currentUser: OsSetupUser | null;
  isPersonalized: boolean;
  onLoginUser: (user: OsSetupUser) => void;
  onLogout?: () => void;
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
  onCancelReconfigure?: () => void;
}

export const DOMAIN_OPTIONS = [
  { 
    id: 'languages', 
    label: 'Иностранные языки', 
    icon: Globe, 
    badge: 'Разговорная беглость',
    desc: 'Преодоление языкового барьера, идиоматическая речь и свободный диалог без внутреннего перевода',
    defaultRole: 'Практик языка / Спикер',
    defaultGoal: 'Свободно говорить без языкового барьера и внутреннего перевода'
  },
  { 
    id: 'excel', 
    label: 'Excel и аналитика данных', 
    icon: FileSpreadsheet, 
    badge: 'XLOOKUP и формулы',
    desc: 'Сводные таблицы, вложенные функции, моделирование и безошибочная обработка больших массивов',
    defaultRole: 'Аналитик данных / Мастер таблиц',
    defaultGoal: 'Свободно владеть формулами, сводными таблицами и логикой данных'
  },
  { 
    id: 'accounting', 
    label: 'Бухгалтерский учет', 
    icon: BarChart3, 
    badge: 'Баланс и проводки',
    desc: 'Двойная запись, счета, субсчета, закрытие периодов и кристальная логика финансовой отчетности',
    defaultRole: 'Бухгалтер / Финансовый специалист',
    defaultGoal: 'Освоить логику двойной записи, счета, проводки и баланс'
  },
  { 
    id: 'design', 
    label: 'Дизайн и UI/UX', 
    icon: Palette, 
    badge: 'Сетки и интерфейсы',
    desc: 'Визуальная иерархия, модульные сетки, типографика, компоненты и чистые экраны в Figma',
    defaultRole: 'UI/UX Designer',
    defaultGoal: 'Освоить визуальную иерархию, сетки и собрать чистый экран в Figma'
  },
  { 
    id: 'speaking', 
    label: 'Ораторское мастерство', 
    icon: Mic, 
    badge: 'Голос и подача',
    desc: 'Постановка голоса, структура аргументации, харизма и преодоление страха публичных выступлений',
    defaultRole: 'Публичный спикер',
    defaultGoal: 'Уверенно выступать перед публикой, поставить голос и структуру мысли'
  },
  { 
    id: 'microeconomics', 
    label: 'Микроэкономика', 
    icon: TrendingUp, 
    badge: 'Спрос и равновесие',
    desc: 'Рыночное равновесие, эластичность, предельные издержки, монополии и принятие решений',
    defaultRole: 'Экономист / Аналитик',
    defaultGoal: 'Понимать равновесие рынка, эластичность и предельные величины'
  },
  { 
    id: 'business', 
    label: 'Бизнес и Продажи', 
    icon: Briefcase, 
    badge: 'Юнит-экономика',
    desc: 'Проверка продуктовых гипотез, воронки продаж, переговоры и построение прибыльной модели',
    defaultRole: 'Предприниматель / Менеджер',
    defaultGoal: 'Разобраться в юнит-экономике, ценностном предложении и сделках'
  },
  { 
    id: 'music', 
    label: 'Музыка и Звук', 
    icon: Music, 
    badge: 'Гармония и слух',
    desc: 'Гармонические сетки, лады, интонирование, чувство метра и свободная импровизация',
    defaultRole: 'Музыкант / Продюсер',
    defaultGoal: 'Освоить инструмент, теорию гармонии, ритм и развитие слуха'
  },
  { 
    id: 'thinking', 
    label: 'Критическое мышление', 
    icon: Brain, 
    badge: 'Логика и решения',
    desc: 'Мышление от первых принципов, когнитивные ловушки, формальная логика и деконструкция мифов',
    defaultRole: 'Стратег / Аналитик',
    defaultGoal: 'Развить прикладную логику, видеть когнитивные искажения'
  },
  { 
    id: 'custom', 
    label: 'Свой навык или тема', 
    icon: Target, 
    badge: 'Любая дисциплина',
    desc: 'Сформируйте персональную учебную программу для любой интересующей вас области знаний',
    defaultRole: 'Специалист в своем деле',
    defaultGoal: 'Освоить выбранную область и дойти до реального измеримого результата'
  }
];

type SetupPhase = 'hello' | 'welcome' | 'identity' | 'discipline' | 'calibration' | 'purpose' | 'features' | 'course_generation' | 'booting';

export const OsSetupAssistant: React.FC<OsSetupAssistantProps> = ({
  currentUser,
  onLoginUser,
  onLogout,
  onComplete,
  onApplyGeneratedPath,
  adminUnits = [],
}) => {
  // Current step in the gradual setup (starts with handwritten Hello intro)
  const [phase, setPhase] = useState<SetupPhase>('hello');

  // Form State
  const [userName, setUserName] = useState<string>(currentUser?.displayName || '');
  const [selectedDomainId, setSelectedDomainId] = useState<string>('custom');
  const [customDomainText, setCustomDomainText] = useState<string>('');
  const [userPurpose, setUserPurpose] = useState<string>(() => {
    try {
      return localStorage.getItem('learning_os_user_purpose') || 'Создать работающий практический результат и освоить ключевые инварианты без абстрактной воды';
    } catch {
      return 'Создать работающий практический результат и освоить ключевые инварианты без абстрактной воды';
    }
  });
  const [skillLevel, setSkillLevel] = useState<UserSkillLevel>('beginner');
  const [trackScope, setTrackScope] = useState<'full_course' | 'single_topic'>('full_course');
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);

  // Generated course data from AI
  const [generatedPathData, setGeneratedPathData] = useState<{
    nodes: DAGNode[];
    edges: DAGEdge[];
    summary: any;
    units?: Record<string, LearningUnit>;
  } | null>(null);

  // Booting states
  const [bootPhaseText, setBootPhaseText] = useState<string>('');
  const [bootProgress, setBootProgress] = useState<number>(0);

  const getEffectiveDomain = () => {
    const trimmed = customDomainText.trim();
    if (trimmed) {
      return trimmed;
    }
    const found = DOMAIN_OPTIONS.find((d) => d.id === selectedDomainId && d.id !== 'custom');
    return found?.label || 'Frontend разработка на React & TypeScript';
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const user = await loginWithGoogle();
      if (user) {
        const osUser: OsSetupUser = {
          uid: user.uid,
          displayName: user.displayName || 'Пользователь Google',
          email: user.email || '',
          photoURL: user.photoURL || undefined,
        };
        playChime('success');
        onLoginUser(osUser);
        setUserName(osUser.displayName);
      }
    } catch {
      const fallbackUser: OsSetupUser = {
        uid: 'user-demo-' + Date.now().toString(36),
        displayName: userName.trim() || 'Пользователь Google',
        email: 'student@gmail.com',
      };
      playChime('success');
      onLoginUser(fallbackUser);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleStartBootSequence = (customData?: {
    nodes: DAGNode[];
    edges: DAGEdge[];
    summary: any;
    units?: Record<string, LearningUnit>;
  }) => {
    playChime('click');
    setPhase('booting');
    setBootProgress(20);
    setBootPhaseText('Создание локального профиля и конфигурации среды...');

    const cleanName = userName.trim() || 'Студент';
    const effectiveUser: OsSetupUser = currentUser || {
      uid: 'user-' + Date.now().toString(36),
      displayName: cleanName,
      email: `${cleanName.toLowerCase().replace(/\s+/g, '.')}@learning-os.internal`,
    };
    onLoginUser(effectiveUser);

    const activeDomain = getEffectiveDomain();
    const effectivePurpose = userPurpose.trim() || `Освоить «${activeDomain}» для практического применения без воды`;
    const targetGoal = `Освоение направления «${activeDomain}»`;

    // Commit user purpose into permanent Epistemic Memory (No-Water Filter)
    try {
      localStorage.setItem('learning_os_user_purpose', effectivePurpose);
      fetch('/api/epistemic/set-purpose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: effectivePurpose,
          domain: activeDomain,
          targetGoal
        })
      }).catch(e => console.warn('Epistemic set-purpose call notice:', e));
    } catch {}

    setTimeout(() => {
      setBootProgress(60);
      setBootPhaseText(`Инициализация DAG-графа знаний и квантование «${activeDomain}»...`);
    }, 400);

    const dataToApply = customData || generatedPathData;

    setTimeout(() => {
      setBootProgress(90);
      setBootPhaseText('Сборка Фокус-Студии и запуск рабочего пространства...');
    }, 800);

    setTimeout(() => {
      setBootProgress(100);
      setBootPhaseText('Готово к работе');
      playChime('success');

      try {
        localStorage.setItem('learning_os_personalized', 'true');
        localStorage.setItem('learning_os_survey_completed', 'true');
        localStorage.setItem('learning_os_user_domain', activeDomain);
      } catch {}

      if (dataToApply?.nodes && onApplyGeneratedPath) {
        onApplyGeneratedPath(dataToApply.nodes, dataToApply.edges || [], dataToApply.summary, dataToApply.units || undefined);
      }

      onComplete({
        targetDomain: activeDomain,
        goalTitle: targetGoal,
        buddyMode: 'voice_sparring',
        buddyLevel: skillLevel,
        autoMatch: true,
      });
    }, 1200);
  };

  const goNext = () => {
    playChime('click');
    if (phase === 'welcome') setPhase('identity');
    else if (phase === 'identity') setPhase('discipline');
    else if (phase === 'discipline') {
      if (!customDomainText.trim()) {
        setCustomDomainText('Frontend разработка на React & TypeScript');
      }
      setSelectedDomainId('custom');
      setPhase('calibration');
    }
    else if (phase === 'calibration') setPhase('purpose');
    else if (phase === 'purpose') setPhase('features');
    else if (phase === 'features') setPhase('course_generation');
    else if (phase === 'course_generation') handleStartBootSequence();
  };

  const goBack = () => {
    playChime('click');
    if (phase === 'welcome') setPhase('hello');
    else if (phase === 'identity') setPhase('welcome');
    else if (phase === 'discipline') setPhase('identity');
    else if (phase === 'calibration') setPhase('discipline');
    else if (phase === 'purpose') setPhase('calibration');
    else if (phase === 'features') setPhase('purpose');
    else if (phase === 'course_generation') setPhase('features');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between overflow-hidden select-none font-sans bg-[#F8F9FA] text-slate-900">
      
      {/* Clean Google Minimalist Background */}
      <div className="absolute inset-0 bg-[#F8F9FA] pointer-events-none" />

      {/* 2. Top Header Bar (Full Width, Ultra-Minimalist: Only Title + Profile/Logout) */}
      <header className="relative z-10 w-full px-4 sm:px-8 py-3.5 h-16 flex items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-xl shrink-0">
        {/* Left: OS Title */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            OS
          </div>
          <div className="flex flex-col">
            <div className="text-xs font-bold text-slate-900 tracking-tight leading-none">
              Learning OS
            </div>
            <div className="text-[10px] text-slate-500 font-medium leading-none mt-1">
              Настройка среды
            </div>
          </div>
        </div>

        {/* Right: ONLY Profile & Logout */}
        <div className="flex items-center space-x-2.5 shrink-0">
          {currentUser ? (
            <div className="flex items-center space-x-2 bg-white/80 pl-2 pr-1.5 py-1.5 rounded-xl border border-slate-200 shadow-xs">
              {/* User Avatar */}
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt={currentUser.displayName} 
                  className="w-6 h-6 rounded-full object-cover border border-slate-200" 
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                  {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                </div>
              )}
              {/* User Name */}
              <span className="text-xs font-semibold text-slate-900 max-w-[140px] truncate">
                {currentUser.displayName}
              </span>

              {/* Logout Button */}
              <button
                type="button"
                onClick={() => {
                  playChime('click');
                  setUserName('');
                  onLogout?.();
                }}
                className="ml-1 px-2 py-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition cursor-pointer flex items-center space-x-1"
                title="Выйти из аккаунта"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium hidden sm:inline">Выйти</span>
              </button>
            </div>
          ) : userName.trim() ? (
            <div className="flex items-center space-x-2 bg-white/80 pl-2 pr-1.5 py-1.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                {userName[0].toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-slate-900 max-w-[140px] truncate">
                {userName}
              </span>
              <button
                type="button"
                onClick={() => {
                  playChime('click');
                  setUserName('');
                  onLogout?.();
                }}
                className="ml-1 px-2 py-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition cursor-pointer flex items-center space-x-1"
                title="Сбросить имя"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium hidden sm:inline">Выйти</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 shadow-xs transition cursor-pointer text-xs font-semibold"
              title="Войти через Google"
            >
              <User className="w-3.5 h-3.5 text-slate-600" />
              <span>{isGoogleLoading ? 'Вход...' : 'Войти'}</span>
            </button>
          )}
        </div>
      </header>

      {/* 3. Main Centered Viewport Content (Generous Whitespace, Minimalist, Full Screen) */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 sm:px-8 py-6 overflow-y-auto max-w-5xl mx-auto w-full">
        
        {/* ===================== PHASE 0: HANDWRITTEN HELLO INTRO ===================== */}
        {phase === 'hello' && (
          <div className="w-full max-w-xl bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)] p-6 sm:p-10 my-auto ring-1 ring-slate-900/5 animate-fade-in">
            <HandwrittenHelloIntro onStart={() => setPhase('welcome')} />
          </div>
        )}

        {/* ===================== PHASE 1: WELCOME ===================== */}
        {phase === 'welcome' && (
          <div className="w-full max-w-2xl bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.07)] p-8 sm:p-12 text-center space-y-7 animate-fade-in my-auto ring-1 ring-slate-900/5">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-900 text-white flex items-center justify-center shadow-xl shadow-slate-900/10">
              <Sparkles className="w-10 h-10" />
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Добро пожаловать в Learning OS
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-lg mx-auto font-normal">
                Персональная операционная система для глубокого освоения любого навыка на практике, без информационного шума и пустых видеолекций.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={goNext}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm tracking-wide shadow-lg shadow-slate-950/15 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
              >
                <span>Начать настройку</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-4 flex items-center justify-center space-x-6 text-xs text-slate-500 font-mono">
              <span>· 200 квантов</span>
              <span>· Фокус-Студия</span>
              <span>· Спарринг с напарником</span>
            </div>
          </div>
        )}

        {/* ===================== PHASE 1: IDENTITY ===================== */}
        {phase === 'identity' && (
          <div className="w-full max-w-xl bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.07)] p-8 sm:p-10 text-center space-y-7 animate-fade-in my-auto ring-1 ring-slate-900/5">
            <div className="space-y-3">
              <div className="text-xs uppercase font-bold tracking-widest text-slate-400">
                Шаг 1 · Профиль пользователя
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Как к вам обращаться?
              </h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Система откалибрует персональную рабочую среду под ваше имя и сохранит прогресс локально.
              </p>
            </div>

            <div className="bg-white/90 p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Имя пользователя
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Например: Александр, Мария, Студент..."
                  className="w-full px-5 py-3.5 text-base bg-white rounded-2xl border border-slate-300 text-slate-900 placeholder-slate-400 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/5 transition shadow-xs"
                  autoFocus
                />
              </div>

              {!currentUser && (
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Или авторизуйтесь в один клик:
                  </span>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-900 border border-slate-200 transition cursor-pointer"
                  >
                    {isGoogleLoading ? 'Подключение...' : 'Войти через Google'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== PHASE 2: DISCIPLINE (Google-like Search Bar with Frosted Glass) ===================== */}
        {phase === 'discipline' && (
          <div className="w-full max-w-2xl bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.07)] p-8 sm:p-10 text-center space-y-7 animate-fade-in my-auto ring-1 ring-slate-900/5">
            <div className="space-y-3">
              <div className="text-xs uppercase font-bold tracking-widest text-slate-400">
                Шаг 2 · Выбор дисциплины
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Что вы хотите освоить?
              </h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Введите любую тему, стек или навык — ИИ сформирует персональный граф обучения.
              </p>
            </div>

            {/* Google-Style Search Bar */}
            <div className="w-full max-w-xl mx-auto space-y-4 pt-1">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-800 transition-colors">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={customDomainText}
                  onChange={(e) => setCustomDomainText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (!customDomainText.trim()) {
                        setCustomDomainText('Frontend разработка на React & TypeScript');
                      }
                      goNext();
                    }
                  }}
                  placeholder="Введите запрос, например: Python, React, Анализ данных, Архитектура..."
                  className="w-full pl-12 pr-11 py-3.5 sm:py-4 text-sm sm:text-base bg-white rounded-full border border-slate-200 hover:border-slate-300 focus:border-slate-400 text-slate-900 placeholder-slate-400 outline-none shadow-xs hover:shadow-md focus:shadow-lg transition-all duration-200"
                  autoFocus
                />
                {customDomainText && (
                  <button
                    type="button"
                    onClick={() => setCustomDomainText('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    title="Очистить"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Google-Style Search Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (!customDomainText.trim()) {
                      setCustomDomainText('Frontend разработка на React & TypeScript');
                    }
                    goNext();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold border border-slate-200 shadow-2xs hover:shadow-xs transition cursor-pointer flex items-center space-x-1.5"
                >
                  <span>Поиск курса</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sampleTopics = [
                      'Frontend разработка на React & TypeScript',
                      'Backend архитектура и микросервисы на Go',
                      'Системное программирование на Rust',
                      'Машинное обучение и LLM-агенты',
                      'Data Science и анализ данных на Python',
                      'Квантовые алгоритмы и вычисления',
                      'UI/UX дизайн и дизайн-системы',
                      'Кибербезопасность и этичный хакинг',
                      'Финансовый анализ и корпоративные финансы',
                      'DevOps и Kubernetes инженерия'
                    ];
                    const randomPick = sampleTopics[Math.floor(Math.random() * sampleTopics.length)];
                    setCustomDomainText(randomPick);
                    playChime('click');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold border border-slate-200 shadow-2xs hover:shadow-xs transition cursor-pointer flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Мне повезёт!</span>
                </button>
              </div>

              {/* Quick Suggestion Chips */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-500">
                <span className="text-[11px] text-slate-400 mr-1">Популярно:</span>
                {[
                  'React & TypeScript',
                  'Python & AI',
                  'Golang Backend',
                  'Rust',
                  'Системный дизайн',
                  'Data Science'
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setCustomDomainText(tag);
                      playChime('click');
                    }}
                    className="px-2.5 py-1 rounded-full bg-white/90 hover:bg-white text-slate-700 text-[11px] font-medium transition cursor-pointer border border-slate-200 shadow-2xs hover:border-slate-300"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================== PHASE 3: CALIBRATION ===================== */}
        {phase === 'calibration' && (
          <div className="w-full max-w-2xl bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.07)] p-8 sm:p-10 text-center space-y-7 animate-fade-in my-auto ring-1 ring-slate-900/5">
            <div className="space-y-3">
              <div className="text-xs uppercase font-bold tracking-widest text-slate-400">
                Шаг 3 · Калибровка маршрута
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Уровень и формат погружения
              </h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Дисциплина: <span className="font-semibold text-slate-900">«{getEffectiveDomain()}»</span>
              </p>
            </div>

            <div className="space-y-5 text-left">
              {/* Level Selector */}
              <div className="bg-white/90 p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Текущий уровень подготовки
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'beginner', title: 'С нуля', desc: 'Простые аналогии, базовые законы и отсутствие непонятных терминов' },
                    { id: 'intermediate', title: 'Базовый опыт', desc: 'Уже есть понимание основ, нужен переход к реальным задачам' },
                    { id: 'advanced', title: 'Профи / Эксперт', desc: 'Глубокие нюансы, граничные кейсы и экстремальные сценарии' },
                  ].map((lvl) => {
                    const active = skillLevel === lvl.id;
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => {
                          setSkillLevel(lvl.id as UserSkillLevel);
                          playChime('click');
                        }}
                        className={`p-3.5 rounded-2xl text-left transition cursor-pointer border ${
                          active
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white/80 hover:bg-white text-slate-900 border-slate-200'
                        }`}
                      >
                        <div className="text-xs font-bold mb-1 flex items-center justify-between">
                          <span>{lvl.title}</span>
                          {active && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div className={`text-[11px] leading-relaxed ${active ? 'text-slate-300' : 'text-slate-500'}`}>
                          {lvl.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scope Selector */}
              <div className="bg-white/90 p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Масштаб траектории
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { 
                      id: 'full_course', 
                      title: 'Полный фундаментальный трек', 
                      desc: '200 структурированных квантов от фундамента до уверенного прикладного мастерства' 
                    },
                    { 
                      id: 'single_topic', 
                      title: 'Точечный экспресс-интенсив', 
                      desc: 'Фокус на ключевом прикладном аспекте для быстрого решения рабочей задачи' 
                    },
                  ].map((scp) => {
                    const active = trackScope === scp.id;
                    return (
                      <button
                        key={scp.id}
                        type="button"
                        onClick={() => {
                          setTrackScope(scp.id as any);
                          playChime('click');
                        }}
                        className={`p-4 rounded-2xl text-left transition cursor-pointer border ${
                          active
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white/80 hover:bg-white text-slate-900 border-slate-200'
                        }`}
                      >
                        <div className="text-xs font-bold mb-1 flex items-center justify-between">
                          <span>{scp.title}</span>
                          {active && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div className={`text-[11px] leading-relaxed ${active ? 'text-slate-300' : 'text-slate-500'}`}>
                          {scp.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== PHASE 4: DEDICATED SEPARATE BLOCK / SCREEN: ЗАЧЕМ ВЫ ЭТО УЧИТЕ? ===================== */}
        {phase === 'purpose' && (
          <div className="w-full max-w-2xl bg-white/90 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.07)] p-8 sm:p-10 text-center space-y-7 animate-fade-in my-auto ring-1 ring-slate-900/5">
            <div className="space-y-3">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Шаг 4 · Долговременная память ИИ</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Зачем вы это учите?
              </h2>
              <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                Направление: <span className="font-semibold text-slate-900">«{getEffectiveDomain()}»</span>. Опишите вашу реальную цель — ИИ зафиксирует её в постоянной памяти (Epistemic Memory) и отфильтрует программу так, чтобы давать <strong>только то, что нужно для вашей цели, без абстрактной воды</strong>.
              </p>
            </div>

            <div className="space-y-5 text-left">
              {/* Grounded User Purpose Card */}
              <div className="bg-linear-to-br from-indigo-50/60 via-purple-50/30 to-white p-5 sm:p-6 rounded-2xl border-2 border-indigo-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                    <Target className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Ваша главная практическая цель</span>
                  </label>
                  <span className="text-[10px] font-mono text-indigo-700 font-semibold bg-indigo-100 px-2.5 py-0.5 rounded-full border border-indigo-200 w-fit">
                    ⚡ Epistemic Memory · No-Water Filter
                  </span>
                </div>

                {/* Quick Purpose Chips */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-500 font-medium block">
                    Выберите готовую цель в один клик или введите свой вариант:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { icon: '🚀', text: 'Запустить собственный стартап и работающий MVP для первых пользователей' },
                      { icon: '💼', text: 'Успешно пройти собеседование на грейд Senior/Lead и защитить архитектуру' },
                      { icon: '⚡', text: 'Автоматизировать рабочие процессы компании и исключить рутину' },
                      { icon: '🛠️', text: 'Разработать надежный прикладной проект для продакшена без багов' },
                      { icon: '📈', text: 'Решать практические задачи высокой сложности и вырасти в доходе' }
                    ].map((preset) => {
                      const isActive = userPurpose === preset.text;
                      return (
                        <button
                          key={preset.text}
                          type="button"
                          onClick={() => {
                            setUserPurpose(preset.text);
                            playChime('click');
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer border text-left flex items-center space-x-1.5 ${
                            isActive
                              ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm font-semibold'
                              : 'bg-white hover:bg-indigo-50 text-slate-700 border-indigo-100 hover:border-indigo-200'
                          }`}
                        >
                          <span>{preset.icon}</span>
                          <span>{preset.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-semibold text-slate-700 block">
                    Собственная формулировка цели:
                  </label>
                  <textarea
                    rows={3}
                    value={userPurpose}
                    onChange={(e) => setUserPurpose(e.target.value)}
                    placeholder="Например: хочу разработать боевой веб-сервис для клиентов, пройти технический скрининг или автоматизировать отчетность..."
                    className="w-full px-4 py-3 text-xs sm:text-sm bg-white rounded-xl border border-indigo-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 outline-none transition text-slate-900 placeholder-slate-400 resize-none leading-relaxed shadow-2xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== PHASE 5: ARCHITECTURE / MODULES SHOWCASE ===================== */}
        {phase === 'features' && (
          <div className="w-full max-w-5xl bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.07)] p-6 sm:p-8 my-auto ring-1 ring-slate-900/5 animate-fade-in">
            <OsModulesShowcase
              onComplete={() => setPhase('course_generation')}
              onBack={() => setPhase('purpose')}
            />
          </div>
        )}

        {/* ===================== PHASE 5: LIVE AI COURSE GENERATION & CURRICULUM REVIEW ===================== */}
        {phase === 'course_generation' && (
          <div className="w-full max-w-5xl bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.07)] p-6 sm:p-8 my-auto ring-1 ring-slate-900/5 animate-fade-in">
            <OsCourseGenerationStep
              domainTitle={getEffectiveDomain()}
              targetGoal={`Освоение направления «${getEffectiveDomain()}»`}
              targetRole={`Специалист (${getEffectiveDomain()})`}
              whyGoal={userPurpose}
              userPurpose={userPurpose}
              skillLevel={skillLevel}
              trackScope={trackScope}
              adminUnits={adminUnits}
              onCourseGenerated={(data) => {
                setGeneratedPathData(data);
              }}
              onProceedToBoot={() => handleStartBootSequence()}
              onBack={() => setPhase('features')}
            />
          </div>
        )}

        {/* ===================== PHASE 6: BOOTING SEQUENCE ===================== */}
        {phase === 'booting' && (
          <div className="w-full max-w-xl bg-white/85 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.07)] p-8 sm:p-10 text-center space-y-8 animate-fade-in my-auto ring-1 ring-slate-900/5">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-900 text-white flex items-center justify-center shadow-xl animate-pulse">
              <Cpu className="w-10 h-10" />
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Инициализация Learning OS
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-mono h-6 transition-all">
                {bootPhaseText}
              </p>
            </div>

            {/* Minimalist Hairline Progress Bar */}
            <div className="w-full max-w-md mx-auto h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-slate-900 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${bootProgress}%` }}
              />
            </div>

            <div className="text-xs text-slate-400 font-mono pt-4">
              Подготовка рабочего пространства и персонального графа знаний
            </div>
          </div>
        )}

      </main>

      {/* 4. Bottom Navigation Bar (Minimalist, Spacious, Elegant: Hidden on Hello, Booting, Features, and Course Generation which have their own navigation) */}
      {phase !== 'booting' && phase !== 'hello' && phase !== 'features' && phase !== 'course_generation' && (
        <footer className="relative z-10 w-full px-6 sm:px-12 py-5 flex items-center justify-between border-t border-slate-200/80 bg-white/70 backdrop-blur-xl">
          {/* Back button */}
          <div>
            <button
              type="button"
              onClick={goBack}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer flex items-center space-x-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Назад</span>
            </button>
          </div>

          {/* Right action button */}
          <div>
            {phase === 'welcome' ? (
              <button
                type="button"
                onClick={goNext}
                className="px-7 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs tracking-wide shadow-md transition cursor-pointer flex items-center space-x-2"
              >
                <span>Начать</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                className="px-7 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs tracking-wide shadow-md transition cursor-pointer flex items-center space-x-2"
              >
                <span>Продолжить</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </footer>
      )}

    </div>
  );
};
