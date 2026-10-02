import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  RotateCw, 
  CheckCircle2, 
  Layers, 
  Terminal, 
  Users, 
  Zap, 
  Award, 
  ShieldAlert, 
  Flame, 
  Check, 
  ArrowLeft,
  Clock,
  Target,
  FileText
} from 'lucide-react';
import { playChime } from '../../utils/audio.ts';
import { DAGNode, DAGEdge, UserSkillLevel, LearningUnit, AdminUnitRow } from '../../types.ts';
import { LIBRARY_UNITS_CATALOG } from '../../data/initialData.ts';
import { normalizeDagLayout } from '../../utils/dagLayout.ts';

interface OsCourseGenerationStepProps {
  domainTitle: string;
  targetGoal: string;
  targetRole: string;
  whyGoal?: string;
  userPurpose?: string;
  skillLevel: UserSkillLevel;
  trackScope: 'full_course' | 'single_topic';
  adminUnits?: AdminUnitRow[];
  onCourseGenerated: (data: {
    nodes: DAGNode[];
    edges: DAGEdge[];
    summary: any;
    units?: Record<string, LearningUnit>;
  }) => void;
  onProceedToBoot: () => void;
  onBack: () => void;
}

export const OsCourseGenerationStep: React.FC<OsCourseGenerationStepProps> = ({
  domainTitle,
  targetGoal,
  targetRole,
  whyGoal,
  userPurpose,
  skillLevel,
  trackScope,
  adminUnits = [],
  onCourseGenerated,
  onProceedToBoot,
  onBack,
}) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [generatedNodes, setGeneratedNodes] = useState<DAGNode[] | null>(null);
  const [generatedEdges, setGeneratedEdges] = useState<DAGEdge[] | null>(null);
  const [generatedSummary, setGeneratedSummary] = useState<any>(null);
  const [generatedUnits, setGeneratedUnits] = useState<Record<string, LearningUnit> | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const effectivePurpose = whyGoal || userPurpose || targetGoal;

  const stepsList = [
    effectivePurpose ? `Фиксация в Epistemic Memory цели: «${effectivePurpose.slice(0, 35)}...»` : 'Анализ когнитивного профиля и целей по направлению',
    'Декомпозиция на кванты и отсечение абстрактной теории (No-Water)',
    'Генерация практических кейсов для Фокус-Студии и спарринга',
    'Калибровка интервальных повторений по кривой Эббингауза'
  ];

  const generateCurriculum = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    setActiveStepIndex(0);

    const timer1 = setTimeout(() => setActiveStepIndex(1), 900);
    const timer2 = setTimeout(() => setActiveStepIndex(2), 2200);
    const timer3 = setTimeout(() => setActiveStepIndex(3), 3600);

    try {
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
          surveyData: {
            skillDomain: domainTitle,
            targetRole,
            targetGoal,
            whyGoal: effectivePurpose,
            userPurpose: effectivePurpose,
            baggageAndBottlenecks: 'Ориентация на фундаментальные инварианты и решение практических кейсов без воды',
            userLevel: skillLevel,
            trackScope,
          },
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

      if (!res.ok) {
        throw new Error(data?.message || `Ошибка API генерации курса (${res.status})`);
      }

      if (data && data.nodes && Array.isArray(data.nodes) && data.nodes.length > 0) {
        const normalized = normalizeDagLayout(data.nodes, data.edges || []);
        setGeneratedNodes(normalized.nodes);
        setGeneratedEdges(normalized.edges);
        setGeneratedSummary(data.diagnosticSummary || data.summary || null);
        if (data.generatedUnits) setGeneratedUnits(data.generatedUnits);

        onCourseGenerated({
          nodes: normalized.nodes,
          edges: normalized.edges,
          summary: data.diagnosticSummary || data.summary,
          units: data.generatedUnits,
        });
      } else {
        throw new Error('Fallback needed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось подключиться к Vertex AI.';
      console.error('[Course Generation] Vertex AI request failed:', err);
      setGenerationError(message);
      playChime('alert');
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
      }, 4200);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  };

  useEffect(() => {
    generateCurriculum();
  }, [domainTitle, skillLevel, trackScope]);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col my-auto animate-fade-in select-none px-2 sm:px-4">
      {/* ======================= STATE 1: LIVE GENERATION ======================= */}
      {isGenerating ? (
        <div className="w-full max-w-xl mx-auto py-12 flex flex-col items-center justify-center text-center space-y-8 animate-fade-in">
          {/* Animated Glowing AI Core */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-slate-900/10 animate-ping" />
            <div className="w-16 h-16 rounded-3xl bg-slate-900 text-white flex items-center justify-center shadow-xl shadow-slate-900/20">
              <Sparkles className="w-8 h-8 text-sky-300 animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs uppercase font-bold tracking-widest text-slate-400">
              Google Gemini · AI Синтез Траектории
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Синтез программы: «{domainTitle}»
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Декомпозиция дисциплины на 200 квантов, калибровка зависимостей DAG и подготовка сценариев для Фокус-Студии.
            </p>
          </div>

          {/* 4 Step Generation Progress Box */}
          <div className="w-full bg-white/80 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-3 text-left">
            {stepsList.map((stepText, idx) => {
              const isDone = activeStepIndex > idx;
              const isCurrent = activeStepIndex === idx;

              return (
                <div 
                  key={stepText}
                  className={`flex items-center space-x-3 p-2.5 rounded-2xl transition-all ${
                    isCurrent 
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : isDone 
                      ? 'text-slate-800 bg-slate-50/80' 
                      : 'text-slate-400 opacity-60'
                  }`}
                >
                  <div className="shrink-0">
                    {isDone ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : isCurrent ? (
                      <RotateCw className="w-4 h-4 animate-spin text-sky-300" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300" />
                    )}
                  </div>
                  <span className="text-xs font-semibold leading-tight truncate">
                    {stepText}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Осталось несколько секунд...
          </div>
        </div>
      ) : generationError ? (
        <div className="w-full max-w-xl mx-auto py-12 space-y-5 text-center animate-fade-in">
          <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Vertex AI не создал курс</h2>
            <p className="mt-2 text-sm text-rose-700">{generationError}</p>
          </div>
          <div className="flex justify-center gap-3">
            <button type="button" onClick={onBack} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">Назад</button>
            <button type="button" onClick={generateCurriculum} className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-700">Повторить</button>
          </div>
        </div>
      ) : (
        /* ======================= STATE 2: GENERATED CURRICULUM REVIEW ======================= */
        <div className="w-full space-y-6 animate-fade-in text-left">
          {/* Top Course Meta Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                <span>Курс сформирован ИИ-Оператором</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                {domainTitle}: Полная траектория
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                {skillLevel === 'beginner' ? 'С нуля' : skillLevel === 'intermediate' ? 'Базовый опыт' : 'Профи'}
              </span>
              <span className="px-3 py-1 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xs">
                {trackScope === 'full_course' ? '200 Квантов' : 'Экспресс-трек'}
              </span>
            </div>
          </div>

          {/* 2-Column Grid: Reality Briefing & Curriculum Structure */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Honest Mentor Verdict & Pillars */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Честный вердикт ИИ-наставника</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {generatedSummary?.realityBriefing?.honestMentorVerdict || 
                    `Программа по направлению «${domainTitle}» декомпозирована на строгие взаимосвязанные блоки. Никаких пустых лекций: прогресс засчитывается только после подтверждения сданных решений.`}
                </p>
              </div>

              {/* Utility Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                    <Zap className="w-3.5 h-3.5 text-sky-600" />
                    <span>Бытовая польза</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {generatedSummary?.realityBriefing?.everydayBenefit || 'Свободное и уверенное решение практических задач без стресса.'}
                  </p>
                </div>

                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>Карьерная сила</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {generatedSummary?.realityBriefing?.careerSuperpower || 'Подтвержденные артефакты в персональном портфолио.'}
                  </p>
                </div>
              </div>

              {/* Tangible Outcomes */}
              <div className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                <div className="text-xs font-bold text-slate-800">
                  Что вы получите в итоге:
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>200 квантов с защитой от пробелов в фундаменте</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Готовые решения и артефакты в Фокус-Студии</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Отработанные аргументы в спарринге с напарником</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: 4 Phases of the Curriculum */}
            <div className="lg:col-span-6 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Фазы и структура DAG-графа
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    phase: 'Фаза 01',
                    title: 'Фундамент и Первые принципы',
                    desc: 'Инварианты, ключевые законы и преодоление барьера старта (кванты 1–50)',
                    icon: Layers,
                    badge: '50 квантов',
                  },
                  {
                    phase: 'Фаза 02',
                    title: 'Прикладные рабочие задачи',
                    desc: 'Создание реальных рабочих кейсов и расчетных моделей в Студии (кванты 51–100)',
                    icon: Terminal,
                    badge: '50 квантов',
                  },
                  {
                    phase: 'Фаза 03',
                    title: 'Граничные случаи и Спарринг',
                    desc: 'Экстремальные сценарии, поиск скрытых багов и дебаты с напарником (кванты 101–150)',
                    icon: Users,
                    badge: '50 квантов',
                  },
                  {
                    phase: 'Фаза 04',
                    title: 'Капстоун-проект и Портфолио',
                    desc: 'Сборка флагманского артефакта и подтверждение квалификации (кванты 151–200)',
                    icon: Award,
                    badge: '50 квантов',
                  },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.phase}
                      className="p-3.5 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/90 shadow-2xs flex items-start space-x-3 text-left"
                    >
                      <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                        0{idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Navigation Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200/80">
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Назад</span>
              </button>

              <button
                type="button"
                onClick={generateCurriculum}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5"
                title="Сгенерировать траекторию заново"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Перегенерировать</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onProceedToBoot}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-wide shadow-lg shadow-slate-950/20 transition cursor-pointer flex items-center justify-center space-x-2 active:scale-98"
            >
              <span>Инициализировать Learning OS и войти в систему</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
