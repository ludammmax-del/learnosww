import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Sparkles, 
  ShieldAlert, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  TrendingUp, 
  Flame, 
  Users,
  UserCheck,
  Check
} from 'lucide-react';
import { SkillRealityBriefing } from '../../types.ts';
import { playChime } from '../../utils/audio.ts';

interface SkillRealityBriefingModalProps {
  briefing?: SkillRealityBriefing;
  domainTitle: string;
  userAge?: number | string;
  targetGoal?: string;
  wantsPartnerSearch?: boolean;
  onTogglePartnerSearch?: (val: boolean) => void;
  onConfirmAndStart: () => void;
  onClose?: () => void;
  isInlineCard?: boolean;
}

export const SkillRealityBriefingModal: React.FC<SkillRealityBriefingModalProps> = ({
  briefing,
  domainTitle,
  userAge,
  targetGoal,
  wantsPartnerSearch: externalPartnerSearch,
  onTogglePartnerSearch,
  onConfirmAndStart,
}) => {
  const [internalPartnerSearch, setInternalPartnerSearch] = useState(false);
  const isPartnerSearch = externalPartnerSearch !== undefined ? externalPartnerSearch : internalPartnerSearch;
  const setPartnerSearch = onTogglePartnerSearch || setInternalPartnerSearch;

  // Fallback briefing if not pre-populated
  const effectiveBriefing: SkillRealityBriefing = briefing || {
    skillTitle: `Практическое мастерство: ${domainTitle}`,
    whatWillBeHard: {
      headline: `Преодоление барьера старта и сопротивления в «${domainTitle}»`,
      coreDifficulty: `В направлении «${domainTitle}» главная сложность — преодолеть первоначальное ощущение неуверенности и перейти от разрозненной теории к ежедневному автоматизму без страха ошибок.`,
      whyPeopleStruggle: 'Большинство людей бросают обучение из-за завышенных ожиданий в первую неделю, отсутствия пошаговой структуры и попыток выучить всё сразу без практики.',
      focusAreas: [
        'Пошаговое закрепление каждого из 200 квантов через сдаваемые артефакты',
        'Преодоление психологического зажима и страха сделать ошибку',
        'Ежедневный фокус по 25 минут без информационного шума'
      ]
    },
    expectedProblems: [
      {
        phase: '1–3 недели (Старт)',
        problem: 'Сомнения в способностях и искушение отложить регулярную практику',
        consequence: 'Потеря начального темпа и угасание запала.',
        antidote: 'Фиксация 25-минутных сессий в Фокус-Студии: важен факт регулярности, а не идеальность на старте.'
      },
      {
        phase: '4–8 недели (Плато навыка)',
        problem: 'Кажется, что прогресс замедлился и задачи стали сложнее',
        consequence: 'Ложная мысль «это не моё».',
        antidote: 'Консультация с ИИ-Оператором и разбор реальных прикладных кейсов вместо сухой теории.'
      },
      {
        phase: '9–12 недели (Сложные проекты)',
        problem: 'Страх публичной демонстрации готового артефакта и синдром самозванца',
        consequence: 'Затягивание сдачи и бесконечный перфекционизм.',
        antidote: 'Сдача версии MVP и итеративное улучшение с поддержкой напарника.'
      }
    ],
    realWorldUtility: {
      everydayBenefit: `Свободное и уверенное применение навыка «${domainTitle}» в повседневной жизни, решении бытовых задач и общении.`,
      careerSuperpower: `Ощутимое конкурентное преимущество, рост рыночной стоимости как специалиста и новые карьерные горизонты.`,
      personalTransformation: `Уверенность в своей способности досконально освоить любую сложную сферу от первых принципов до результата.`,
      tangibleOutcomes: [
        `Портфолио из подтвержденных практических проектов по направлению «${domainTitle}»`,
        'Сформированная привычка глубокой концентрации и быстрого входа в состояние потока',
        'Кристальная ясность мышления и умение находить решения в нестандартных ситуациях'
      ]
    },
    honestMentorVerdict: 'Никаких ложных обещаний: наработка любого ценного навыка требует дисциплины и честного труда. Но с нашей 200-квантовой траекторией вы застрахованы от потери времени и хаоса.'
  };

  return (
    <div className="w-full min-h-full flex flex-col justify-between p-4 sm:p-8 lg:p-12 animate-in fade-in zoom-in-95 duration-700 text-left selection:bg-white/20">
      <div className="w-full max-w-7xl mx-auto space-y-8 flex-1 flex flex-col justify-between">
        
        {/* Minimalist Ultra-Clean Header */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-white/90 font-mono text-[11px] tracking-wider uppercase">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Честный бриф реальности</span>
              </span>
              <span className="text-[11px] font-mono text-white/40 tracking-wider uppercase">
                200 Квантов Практики
              </span>
              {userAge && (
                <span className="hidden sm:inline-block text-[11px] font-mono text-white/40">
                  · Возраст: {userAge} лет
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2 text-[11px] font-mono text-white/40">
              <ShieldAlert className="w-3.5 h-3.5 text-white/50" />
              <span>Без иллюзий и искажений</span>
            </div>
          </div>

          <div className="pt-2">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-light tracking-tight text-white leading-tight">
              {effectiveBriefing.skillTitle}
            </h1>
            {targetGoal && (
              <p className="text-sm sm:text-base text-white/50 mt-1.5 font-light">
                Целевой результат: <span className="text-white/80 font-normal">«{targetGoal}»</span>
              </p>
            )}
          </div>
        </div>

        {/* 3 Core Minimalist Full-Width Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-auto py-2">
          
          {/* COLUMN 1: ГДЕ БУДЕТ СЛОЖНО */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white/[0.02] border border-white/[0.08] hover:border-white/20 transition-all duration-300 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-rose-400 font-mono text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>01 · Где будет сложно</span>
              </div>

              <h2 className="text-base sm:text-lg font-medium text-white leading-snug">
                {effectiveBriefing.whatWillBeHard.headline}
              </h2>

              <p className="text-xs sm:text-sm text-white/60 leading-relaxed font-light">
                {effectiveBriefing.whatWillBeHard.coreDifficulty}
              </p>
            </div>

            <div className="pt-4 border-t border-white/[0.06] space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
                Точки сопротивления:
              </span>
              <ul className="space-y-2 text-xs text-white/80 font-light">
                {effectiveBriefing.whatWillBeHard.focusAreas.map((area, idx) => (
                  <li key={idx} className="flex items-start space-x-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400/80 mt-1.5 shrink-0" />
                    <span className="leading-relaxed">{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* COLUMN 2: КРИЗИСЫ И ПРОТИВОЯДИЯ */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white/[0.02] border border-white/[0.08] hover:border-white/20 transition-all duration-300 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs uppercase tracking-wider">
                <Zap className="w-4 h-4" />
                <span>02 · Кризисы и противоядия</span>
              </div>

              <h2 className="text-base sm:text-lg font-medium text-white leading-snug">
                Плато и спады на пути
              </h2>

              <div className="space-y-3">
                {effectiveBriefing.expectedProblems.map((prob, pIdx) => (
                  <div key={pIdx} className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-1.5">
                    <div className="text-[10px] font-mono text-amber-300/90 uppercase tracking-wider">
                      {prob.phase}
                    </div>
                    <div className="text-xs text-white/90 font-normal leading-snug">
                      {prob.problem}
                    </div>
                    <div className="text-[11px] text-emerald-300/90 flex items-start space-x-1.5 pt-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{prob.antidote}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMN 3: ПРИМЕНЕНИЕ В ЖИЗНИ */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white/[0.02] border border-white/[0.08] hover:border-white/20 transition-all duration-300 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-emerald-400 font-mono text-xs uppercase tracking-wider">
                <TrendingUp className="w-4 h-4" />
                <span>03 · Польза в реальной жизни</span>
              </div>

              <h2 className="text-base sm:text-lg font-medium text-white leading-snug">
                Жизненная суперсила
              </h2>

              <div className="space-y-3 text-xs text-white/80 leading-relaxed font-light">
                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-emerald-400 block tracking-wider">
                    В быту и жизни:
                  </span>
                  <p className="text-white/90">{effectiveBriefing.realWorldUtility.everydayBenefit}</p>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-sky-400 block tracking-wider">
                    В карьере и доходе:
                  </span>
                  <p className="text-white/90">{effectiveBriefing.realWorldUtility.careerSuperpower}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.06] space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
                Результаты через 200 блоков:
              </span>
              <ul className="space-y-1.5 text-xs text-white/80">
                {effectiveBriefing.realWorldUtility.tangibleOutcomes.map((outcome, oIdx) => (
                  <li key={oIdx} className="flex items-start space-x-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="leading-snug text-white/90">{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>

        {/* Minimalist Bottom Control & Action Bar */}
        <div className="pt-6 border-t border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-5">
          
          {/* Mentor Quote */}
          <div className="flex-1 text-left">
            <p className="text-xs text-white/50 font-light italic leading-relaxed max-w-2xl">
              «{effectiveBriefing.honestMentorVerdict}»
            </p>
          </div>

          {/* Partner Toggle & Action */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center p-1 rounded-2xl bg-white/[0.04] border border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => setPartnerSearch(false)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                  !isPartnerSearch 
                    ? 'bg-white text-slate-950 shadow-sm' 
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Соло</span>
              </button>
              <button
                type="button"
                onClick={() => setPartnerSearch(true)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                  isPartnerSearch 
                    ? 'bg-white text-slate-950 shadow-sm' 
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>С напарником (P2P)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                playChime('success');
                onConfirmAndStart();
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white text-slate-950 font-semibold text-xs sm:text-sm hover:bg-slate-100 transition cursor-pointer shadow-xl flex items-center justify-center space-x-2.5 active:scale-[0.98] group shrink-0"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Принимаю вызов · Начать работу</span>
              <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
