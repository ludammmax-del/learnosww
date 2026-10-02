import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  NotebookPen,
  RefreshCcw,
  Sparkles,
  CheckSquare,
  ExternalLink,
  Search,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Tv,
  HelpCircle,
  Lightbulb,
  Award,
} from 'lucide-react';
import { LearningUnit } from '../../types.ts';
import { playChime } from '../../utils/audio.ts';

type TextbookLibraryEntry = {
  id: string;
  title: string;
  summary: string;
  domain: string;
  unitId?: string;
  phase?: number;
};

type DistilledBlock = {
  topic: string;
  domain?: string;
  sourceCitation?: string;
  academicTheoryMarkdown?: string;
  whyItMattersInRealWorld?: string;
  invariants?: string[];
  visualExamples?: Array<{ id: string; title: string; description: string; prompt: string; illustrationStyle?: string; visualization?: string }>;
  pageSections?: Array<{ id: string; heading: string; content: string; type?: 'concept' | 'example' | 'visual' | 'exercise' | 'check' }>;
  exercises?: Array<{ id: string; title: string; instruction: string; starterSnippet?: string; expectedOutputOrSolution?: string; verificationCriteria?: string[] }>;
  expressQuiz?: Array<{ id: string; question: string; scenario?: string; options: string[]; correctIndex?: number; explanation?: string; gapRemediationTip?: string }>;
  blankPagePrompt?: { question?: string; keyInvariantsRequired?: string[]; samplePassingAnswer?: string };
  groundingSources?: Array<{ sourceLabel?: string; title?: string; url?: string; snippet?: string }>;
};

const mapNodesToChapters = (nodes: Array<{ id: string; title: string; unitId?: string; summary?: string; phase?: number; phaseTitle?: string }> = []): TextbookLibraryEntry[] => {
  if (nodes.length > 0) {
    return nodes.map((node) => ({
      id: node.id,
      title: node.title,
      summary: node.summary || node.phaseTitle || 'Академический блок, адаптированный под траекторию курса.',
      domain: node.phaseTitle || (node.phase ? `Фаза ${node.phase}` : 'Учебный модуль'),
      unitId: node.unitId || node.id,
      phase: node.phase,
    }));
  }

  return [
    { id: 'intro-1', title: 'Глубокое понимание систем', summary: 'Фундаментальные принципы, инварианты и базовые модели.', domain: 'Системы' },
    { id: 'intro-2', title: 'Дизайн и архитектура', summary: 'Как превращать знания в устойчивую упорядоченную систему.', domain: 'Архитектура' },
    { id: 'intro-3', title: 'Методы доказательства и решения', summary: 'Логика, тестирование и объяснение решений.', domain: 'Аналитика' },
  ];
};

const buildTopicFallbackQuiz = (topic: string, domain?: string) => {
  const cleanTopic = (topic || 'Инженерия систем').trim();
  const domainLabel = domain || 'Учебный блок';
  return [
    {
      id: `quiz-${cleanTopic.toLowerCase().replace(/[^a-zа-я0-9]/gi, '-')}-1`,
      question: `Каково фундаментальное назначение и базовый инвариант темы «${cleanTopic}»?`,
      scenario: `Проектирование и закрепление знаний в рамках раздела «${domainLabel}».`,
      options: [
        `Обеспечение устойчивости, детерминированности и соблюдения ключевых инвариантов «${cleanTopic}»`,
        `Отказ от проверок корректности и тестов ради ускорения первичного написания`,
        `Искусственное усложнение архитектуры и раздувание теоретического конспекта`,
        `Случайная маршрутизация операций без сохранения контекста состояния`
      ],
      correctIndex: 0,
      explanation: `Фундаментальный принцип «${cleanTopic}» состоит в обеспечении предсказуемости, надежности и сохранении ключевых инвариантов при любых изменениях среды.`,
      gapRemediationTip: `Сфокусируйтесь на том, какую базовую проблему решает механизм «${cleanTopic}».`
    },
    {
      id: `quiz-${cleanTopic.toLowerCase().replace(/[^a-zа-я0-9]/gi, '-')}-2`,
      question: `С каким практическим компромиссом сопряжено применение «${cleanTopic}» в реальных системах?`,
      scenario: `Оптимизация надежности и скорости в условиях повышенной нагрузки.`,
      options: [
        `Баланс между накладными расходами на координацию/структурирование и скоростью/надежностью операций`,
        `Гарантированное увеличение времени отклика системы ровно в 10 раз при каждом вызове`,
        `Несовместимость с любыми промышленными протоколами и библиотеками`,
        `Строгое ограничение на использование только одного потока выполнения`
      ],
      correctIndex: 0,
      explanation: `В реальной практике «${cleanTopic}» требует осознанного баланса между вычислительными накладными расходами и надежностью решения.`,
      gapRemediationTip: `Всегда анализируйте компромиссы и стоимость применения того или иного архитектурного паттерна.`
    },
    {
      id: `quiz-${cleanTopic.toLowerCase().replace(/[^a-zа-я0-9]/gi, '-')}-3`,
      question: `Какое граничное условие или фактор риска наиболее критично контролировать при работе с «${cleanTopic}»?`,
      scenario: `Нештатные сценарии, пиковые всплески нагрузки или сбои зависимостей.`,
      options: [
        `Нарушение инвариантов при рассинхронизации состояния, потере ресурсов или исчерпании лимитов`,
        `Наличие полного покрытия модульными тестами и статического анализа типов`,
        `Четкое соблюдение контрактов интерфейсов и идемпотентности операций`,
        `Кэширование исключительно неизменяемых детерминированных результатов`
      ],
      correctIndex: 0,
      explanation: `Критические инциденты чаще всего возникают при нарушении граничных условий или непредвиденной деградации связанных компонентов «${cleanTopic}».`,
      gapRemediationTip: `Моделируйте граничные сценарии и проверяйте поведение системы при отказе ресурсов.`
    }
  ];
};

const buildFallbackBlock = (topic: string, domain?: string): DistilledBlock => ({
  topic,
  domain: domain || 'Системы и обучение',
  sourceCitation: 'Академический конспект платформы с верификацией по инвариантам',
  academicTheoryMarkdown: `### 1. Фундаментальный принцип\nВ теме «${topic}» важно выделить не просто термины, а строгое правило: инвариант, который сохраняется в любых прикладных сценариях.\n\n### 2. Логика и устройство\nКогда концепция объясняется от первого лица и проверяется через конкретное действие, вероятность ошибки снижается в разы. Любая сложная система состоит из простых устойчивых блоков.\n\n### 3. Применение на практике\nЗнание становится рабочим навыком только тогда, когда студент может объяснить логику без шпаргалок и проверить её на минимальном тесте.`,
  whyItMattersInRealWorld: 'Понимание инвариантов защищает от ошибок при масштабировании и позволяет решать нестандартные задачи в боевых условиях.',
  invariants: [
    `Правило темы «${topic}» сохраняется неизменным при смене инструментов или фреймворков.`,
    'Качественное объяснение понятно без избыточного профессионального жаргона.',
    'Понимание подтверждается решением задачи на чистом листе без подсказок.',
  ],
  exercises: [
    {
      id: 'ex-1',
      title: 'Сформулировать инвариант простыми словами',
      instruction: 'Опишите ключевое правило темы «' + topic + '» в 2-3 предложениях для человека без опыта.',
      starterSnippet: '# Опишите инвариант своими словами:\n',
      expectedOutputOrSolution: 'Чёткая формулировка главного принципа и 1 реальный пример применения.',
      verificationCriteria: ['Понятно без терминов', 'Есть реальный пример', 'Выделена суть'],
    },
    {
      id: 'ex-2',
      title: 'Анализ граничного случая',
      instruction: 'Определите, в каком случае это правило может дать сбой или потребовать дополнительной проверки.',
      starterSnippet: '# Граничные условия и исключения:\n',
      expectedOutputOrSolution: 'Указаны ограничения метода и критерии применимости.',
      verificationCriteria: ['Выделены ограничения', 'Есть способ устранения ошибки'],
    },
  ],
  expressQuiz: buildTopicFallbackQuiz(topic, domain),
  blankPagePrompt: {
    question: `Объясните тему «${topic}» коллеге за 3 минуты с нуля.`,
    keyInvariantsRequired: ['Главный принцип', 'Контекст применения', 'Пример из практики'],
    samplePassingAnswer: 'Суть заключается в том, что базовый закон определяет результат. На практике мы применяем его в задаче X, избегая ошибки Y.',
  },
  groundingSources: [
    {
      sourceLabel: 'Academic synthesis',
      title: `Learning OS Foundation: ${topic}`,
      url: '#',
      snippet: 'Материал адаптирован под траекторию курса и подкреплён практическими тестами.',
    },
  ],
});

interface TextbookLibraryWindowProps {
  nodes: Array<{ id: string; title: string; unitId?: string; summary?: string; phase?: number; phaseTitle?: string; status?: string; passingScore?: number; score?: number }>;
  activeUnitId: string;
  units: Record<string, LearningUnit>;
  onLaunchUnit?: (unitId: string) => void;
  onUpdateUnit?: (unit: LearningUnit) => void;
}

export const TextbookLibraryWindow: React.FC<TextbookLibraryWindowProps> = ({
  nodes,
  activeUnitId,
  units,
  onLaunchUnit,
  onUpdateUnit,
}) => {
  const chapterList = useMemo(() => mapNodesToChapters(nodes), [nodes]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchFilter, setSearchFilter] = useState('');
  const [page, setPage] = useState<DistilledBlock | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'textbook' | 'tests'>('textbook');
  const [draftTopic, setDraftTopic] = useState('');
  const [generationNote, setGenerationNote] = useState('Синтезировано по академической программе');

  // Quiz state for interactive testing
  const [userQuizAnswers, setUserQuizAnswers] = useState<Record<string, number>>({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizDifficulty, setQuizDifficulty] = useState<'junior' | 'middle' | 'senior' | 'staff'>('middle');
  const [quizGenerationNote, setQuizGenerationNote] = useState<string | null>(null);
  const [chapterQuizzesCache, setChapterQuizzesCache] = useState<Record<string, DistilledBlock['expressQuiz']>>({});

  // Sync selected index if active unit matches
  useEffect(() => {
    if (activeUnitId) {
      const matchIdx = chapterList.findIndex((c) => c.unitId === activeUnitId || c.id === activeUnitId);
      if (matchIdx >= 0) {
        setSelectedIndex(matchIdx);
      }
    }
  }, [activeUnitId, chapterList]);

  const selectedChapter = chapterList[selectedIndex] || chapterList[0] || {
    id: 'intro',
    title: 'Введение в системы',
    domain: 'Базовый курс',
    summary: 'Введение',
  };

  const loadChapter = async (topicTitle: string, forceApiRefresh?: boolean) => {
    setLoading(true);
    // Reset test answers on chapter change
    setUserQuizAnswers({});
    setIsQuizSubmitted(false);
    setQuizGenerationNote(null);

    const targetTopic = (topicTitle || selectedChapter.title || 'Теория систем').trim();
    const currentDomain = selectedChapter.domain || 'Инженерия';

    try {
      // 1. Check if we already have an AI generated quiz in cache for this chapter/topic
      const cachedQuiz = chapterQuizzesCache[selectedChapter.id] || chapterQuizzesCache[targetTopic];

      // 2. Check if unit has pre-baked content and we aren't forcing an AI re-synthesis
      const matchedUnit = selectedChapter.unitId ? units[selectedChapter.unitId] : undefined;
      if (matchedUnit && !forceApiRefresh) {
        let quizList = cachedQuiz;

        if (!quizList && matchedUnit.quiz && matchedUnit.quiz.length > 0) {
          quizList = matchedUnit.quiz.map((q, idx) => {
            const options = (q.options || []).map((o: any) => typeof o === 'string' ? o : (o.text || o.title || ''));
            const rawCorrect = (q as any).correctIndex;
            let correctIndex = typeof rawCorrect === 'number' ? rawCorrect : 0;
            if (Array.isArray(q.options)) {
              const foundIdx = q.options.findIndex((o: any) => typeof o === 'object' && o !== null && Boolean(o.isCorrect));
              if (foundIdx >= 0) correctIndex = foundIdx;
            }
            return {
              id: q.id || `quiz-${idx}`,
              question: q.question,
              scenario: (q as any).scenario,
              options: options.length >= 2 ? options : ['Вариант A', 'Вариант B', 'Вариант C', 'Вариант D'],
              correctIndex: Math.max(0, correctIndex),
              explanation: q.explanation || 'Правильный ответ основан на механике модуля.',
              gapRemediationTip: (q as any).adaptiveInsight || (q as any).gapRemediationTip,
            };
          });
        }

        // If unit had no quiz questions, generate topic-specific test questions right away
        if (!quizList || quizList.length === 0) {
          quizList = buildTopicFallbackQuiz(matchedUnit.title, currentDomain);
        }

        const exercisesList = (matchedUnit.practicalExercises || []).map((ex, i) => ({
          id: ex.id || `ex-${i}`,
          title: ex.title,
          instruction: ex.taskPrompt || ex.scenario || 'Выполните практическое задание по теме.',
          starterSnippet: ex.starterSnippet,
          expectedOutputOrSolution: ex.solutionExplanation,
        }));

        const glossary = matchedUnit.glossaryTerms ?? [];
        const invariantList = glossary.length > 0
          ? glossary.map((g) => `${g.term}: ${g.definition}`)
          : [
              `Базовый закон темы «${matchedUnit.title}» сохраняется при любой реализации.`,
              'Результат работы функции верифицируется тестовыми инвариантами.',
            ];

        setPage({
          topic: matchedUnit.title,
          domain: currentDomain,
          sourceCitation: `Программа курса: ${matchedUnit.title} (${matchedUnit.category || 'Архитектура'})`,
          academicTheoryMarkdown: matchedUnit.summaryMarkdown || `### 1. Основы\n${matchedUnit.aiEssence || 'Изучение ключевой темы модуля.'}\n\n### 2. Практика\n${matchedUnit.projectTask?.description || 'Прикладная разработка по модулю.'}`,
          whyItMattersInRealWorld: matchedUnit.aiEssence || 'Позволяет уверенно решать профильные задачи на производстве.',
          invariants: invariantList,
          pageSections: [
            {
              id: 's-1',
              heading: 'Введение и концепция',
              content: matchedUnit.aiEssence || 'Изучение базовой концепции модуля.',
              type: 'concept',
            },
            {
              id: 's-2',
              heading: 'Прикладная задача',
              content: matchedUnit.projectTask?.description || 'Разбор типового сценария реализации.',
              type: 'example',
            },
          ],
          exercises: exercisesList.length > 0 ? exercisesList : undefined,
          expressQuiz: quizList,
          blankPagePrompt: {
            question: `Объясните логику модуля «${matchedUnit.title}».`,
            keyInvariantsRequired: invariantList.slice(0, 3),
            samplePassingAnswer: 'Освоенный модуль позволяет строить надёжные компоненты с гарантией работоспособности.',
          },
        });
        setGenerationNote('Загружено из программы курса');
        return;
      }

      // 3. Dynamic synthesis through backend API (with topic-grounded questions)
      const res = await fetch('/api/gemini/distill-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: targetTopic,
          domain: currentDomain,
          forceRefresh: Boolean(forceApiRefresh),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.block) {
          const fetchedBlock: DistilledBlock = data.block;
          if (!fetchedBlock.expressQuiz || fetchedBlock.expressQuiz.length === 0) {
            fetchedBlock.expressQuiz = buildTopicFallbackQuiz(targetTopic, currentDomain);
          }
          setPage(fetchedBlock);
          setGenerationNote('Синтезировано ИИ на основе академических первоисточников');
          return;
        }
      }

      // 4. Fallback block strictly tailored to the requested topic
      setPage(buildFallbackBlock(targetTopic, currentDomain));
      setGenerationNote('Синтезировано от первых принципов темы');
    } catch {
      setPage(buildFallbackBlock(targetTopic, currentDomain));
      setGenerationNote('Офлайн-конспект');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChapter) {
      void loadChapter(selectedChapter.title);
    }
  }, [selectedIndex, selectedChapter.title]);

  const filteredChapters = useMemo(() => {
    if (!searchFilter.trim()) return chapterList;
    const q = searchFilter.toLowerCase();
    return chapterList.filter(
      (c) => c.title.toLowerCase().includes(q) || c.domain.toLowerCase().includes(q)
    );
  }, [chapterList, searchFilter]);

  const currentPage = page || buildFallbackBlock(selectedChapter.title, selectedChapter.domain);
  const parsedSections = currentPage.academicTheoryMarkdown
    ? currentPage.academicTheoryMarkdown.split(/\n(?=###?\s)/).filter(Boolean)
    : [];

  const visualExamples = currentPage.visualExamples || [];
  const pageSections = currentPage.pageSections || parsedSections.map((section, index) => ({
    id: `sec-${index}`,
    heading: [
      'Введение и инварианты',
      'Основы и ключевые принципы',
      'Пример применения',
      'Практика и проверка',
      'Итоги главы',
    ][index % 5] || `Раздел ${index + 1}`,
    content: section.replace(/^###\s*[\d.]*\s*/gm, ''),
    type: 'concept' as const,
  }));

  const activeQuizzes = (currentPage.expressQuiz && currentPage.expressQuiz.length > 0)
    ? currentPage.expressQuiz
    : buildTopicFallbackQuiz(selectedChapter.title, selectedChapter.domain);

  // Generate or regenerate interactive tests strictly on the topic with AI
  const handleGenerateQuizForTopic = async (diffOverride?: 'junior' | 'middle' | 'senior' | 'staff') => {
    const targetDiff = diffOverride || quizDifficulty;
    setIsGeneratingQuiz(true);
    playChime('click');

    try {
      const res = await fetch('/api/gemini/generate-textbook-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedChapter.title,
          domain: selectedChapter.domain,
          theoryContent: currentPage.academicTheoryMarkdown || currentPage.whyItMattersInRealWorld,
          difficulty: targetDiff,
          count: 4,
        }),
      });

      if (!res.ok) throw new Error('API route returned error');
      const data = await res.json();

      if (data && Array.isArray(data.questions) && data.questions.length > 0) {
        const newQuizzes = data.questions;

        setPage((prev) => {
          if (!prev) return buildFallbackBlock(selectedChapter.title, selectedChapter.domain);
          return { ...prev, expressQuiz: newQuizzes };
        });

        // Save in cache
        const cacheKey = selectedChapter.id || selectedChapter.title;
        setChapterQuizzesCache((prev) => ({
          ...prev,
          [cacheKey]: newQuizzes,
          [selectedChapter.title]: newQuizzes,
        }));

        // Sync with Learning OS unit if available
        if (selectedChapter.unitId && units[selectedChapter.unitId] && onUpdateUnit) {
          const currentUnit = units[selectedChapter.unitId];
          const updatedUnit: LearningUnit = {
            ...currentUnit,
            quiz: newQuizzes.map((q: any) => ({
              id: q.id,
              type: 'logic',
              question: q.question,
              scenario: q.scenario,
              options: (q.options || []).map((optText: string, oIdx: number) => ({
                id: `opt-${oIdx}`,
                text: typeof optText === 'string' ? optText : (optText as any)?.text || '',
                isCorrect: oIdx === q.correctIndex,
                explanation: oIdx === q.correctIndex ? q.explanation : 'Неверный вариант ответа.',
              })),
              explanation: q.explanation,
            })),
          };
          onUpdateUnit(updatedUnit);
        }

        setUserQuizAnswers({});
        setIsQuizSubmitted(false);
        setQuizGenerationNote(`ИИ сгенерировал 4 проверочных вопроса строго по теме «${selectedChapter.title}» (${targetDiff.toUpperCase()})`);
        playChime('success');
        return;
      }
    } catch (err) {
      console.warn('[TextbookLibraryWindow] Quiz generation failed, fallback to topic quiz:', err);
      const fallbackQuizzes = buildTopicFallbackQuiz(selectedChapter.title, selectedChapter.domain);
      setPage((prev) => {
        if (!prev) return buildFallbackBlock(selectedChapter.title, selectedChapter.domain);
        return { ...prev, expressQuiz: fallbackQuizzes };
      });
      setUserQuizAnswers({});
      setIsQuizSubmitted(false);
      setQuizGenerationNote(`Сформирован проверочный тест по теме «${selectedChapter.title}»`);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleSelectQuizOption = (quizId: string, optionIndex: number) => {
    if (isQuizSubmitted) return;
    setUserQuizAnswers((prev) => ({ ...prev, [quizId]: optionIndex }));
    playChime('click');
  };

  const handleSubmitQuiz = () => {
    setIsQuizSubmitted(true);
    const correctCount = activeQuizzes.filter((q, i) => {
      const selected = userQuizAnswers[q.id || `q-${i}`];
      return selected === (q.correctIndex ?? 0);
    }).length;
    if (correctCount === activeQuizzes.length) {
      playChime('success');
    } else {
      playChime('alert');
    }
  };

  const handleResetQuiz = () => {
    setUserQuizAnswers({});
    setIsQuizSubmitted(false);
    playChime('click');
  };

  const goNext = () => setSelectedIndex((prev) => (prev + 1) % chapterList.length);
  const goPrev = () => setSelectedIndex((prev) => (prev - 1 + chapterList.length) % chapterList.length);

  return (
    <div className="h-full w-full flex flex-col bg-[#F8F9FA] text-[#202124] overflow-hidden select-none">
      {/* Top Header Bar - Google Docs / Books Style */}
      <header className="flex items-center justify-between px-5 py-2.5 border-b border-[#DADCE0] bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#E8F0FE] text-[#1A73E8]">
            <BookOpenText className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#5F6368] font-medium">Учебники</div>
            <div className="text-sm font-semibold text-[#202124]">Академическая библиотека и учебный поток</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
            {/* Quick topic synthesis prompt */}
          <div className="hidden md:flex items-center gap-2 rounded-full border border-[#DADCE0] bg-[#F1F3F4] px-3 py-1 focus-within:bg-white focus-within:ring-1 focus-within:ring-[#1A73E8] focus-within:border-[#1A73E8]">
            <input
              value={draftTopic}
              onChange={(e) => setDraftTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && draftTopic.trim()) {
                  void loadChapter(draftTopic.trim(), true);
                }
              }}
              placeholder="Сгенерировать главу..."
              className="w-44 bg-transparent text-xs text-[#202124] placeholder:text-[#5F6368] outline-none"
            />
            <button
              type="button"
              onClick={() => {
                if (draftTopic.trim()) {
                  void loadChapter(draftTopic.trim(), true);
                } else {
                  void loadChapter(selectedChapter.title, true);
                }
              }}
              className="px-2 py-0.5 rounded-full bg-[#1A73E8] hover:bg-[#1765CC] text-[10px] uppercase tracking-wider text-white transition cursor-pointer font-medium"
            >
              Синтез
            </button>
          </div>

          <button
            type="button"
            onClick={() => void loadChapter(selectedChapter.title, true)}
            className="px-3 py-1.5 rounded-full border border-[#DADCE0] bg-white text-xs text-[#3C4043] flex items-center gap-1.5 hover:bg-[#F1F3F4] transition cursor-pointer font-medium"
            title="Перегенерировать главу с ИИ"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#1A73E8]' : 'text-[#5F6368]'}`} />
            <span>{loading ? 'Синтез...' : 'Обновить'}</span>
          </button>

          {selectedChapter.unitId && onLaunchUnit && (
            <button
              type="button"
              onClick={() => onLaunchUnit(selectedChapter.unitId!)}
              className="px-3 py-1.5 rounded-full bg-[#1A73E8] hover:bg-[#1765CC] text-white text-xs flex items-center gap-1.5 transition cursor-pointer font-medium shadow-xs"
              title="Открыть этот модуль в Фокус-Студии"
            >
              <Tv className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Фокус-Студия</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Split: Sidebar (Table of Contents) + Chapter Reader */}
      <div className="grid grid-cols-[280px_minmax(0,1fr)] flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar: Table of Contents (Google Drive / Docs outline style) */}
        <aside className="border-r border-[#DADCE0] bg-white p-3 overflow-y-auto flex flex-col">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-[10px] uppercase tracking-wider text-[#5F6368] font-semibold">
              Оглавление ({filteredChapters.length})
            </span>
          </div>

          {/* Search inside Table of Contents */}
          <div className="relative mb-2.5">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6368]" />
            <input
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Поиск по главам..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#F1F3F4] border border-transparent rounded-full text-xs text-[#202124] placeholder:text-[#5F6368] outline-none focus:bg-white focus:border-[#1A73E8]"
            />
          </div>

          <div className="space-y-1 overflow-y-auto pr-1 flex-1">
            {filteredChapters.map((chapter) => {
              const actualIndex = chapterList.findIndex((c) => c.id === chapter.id);
              const isSelected = actualIndex === selectedIndex;

              return (
                <button
                  key={`${chapter.id}-${chapter.title}`}
                  type="button"
                  onClick={() => {
                    if (actualIndex >= 0) {
                      setSelectedIndex(actualIndex);
                    }
                  }}
                  className={`w-full text-left rounded-lg p-2.5 border transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#E8F0FE] border-[#1A73E8]/30 text-[#1A73E8] font-medium shadow-none'
                      : 'bg-white border-transparent hover:bg-[#F8F9FA] text-[#202124]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-[#5F6368]">
                    <span className="truncate">{chapter.domain}</span>
                    {chapter.phase && <span>Блок {chapter.phase}</span>}
                  </div>
                  <div className="mt-0.5 text-xs font-semibold leading-tight line-clamp-2">
                    {chapter.title}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Area: Reader & Tests */}
        <main className="flex-1 min-h-0 overflow-y-auto flex flex-col bg-white">
          {/* Chapter Title Bar with Next/Prev */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#DADCE0] bg-white px-6 py-2.5 shrink-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#202124] truncate max-w-xl">
              <GraduationCap className="w-4 h-4 text-[#1A73E8] shrink-0" />
              <span className="truncate">{selectedChapter.title}</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-[#5F6368] mr-2 font-mono">
                {selectedIndex + 1} / {chapterList.length}
              </span>
              <button
                type="button"
                onClick={goPrev}
                className="p-1.5 rounded-full border border-[#DADCE0] bg-white hover:bg-[#F1F3F4] text-[#3C4043] transition cursor-pointer"
                title="Предыдущая глава"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="p-1.5 rounded-full border border-[#DADCE0] bg-white hover:bg-[#F1F3F4] text-[#3C4043] transition cursor-pointer"
                title="Следующая глава"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6 max-w-4xl mx-auto w-full">
            {/* View Mode Tabs (Google Segmented Buttons) */}
            <div className="flex items-center gap-1 rounded-full border border-[#DADCE0] bg-[#F1F3F4] p-1 w-fit">
              <button
                type="button"
                onClick={() => setActiveTab('textbook')}
                className={`px-4 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                  activeTab === 'textbook'
                    ? 'bg-white text-[#1A73E8] shadow-xs'
                    : 'text-[#5F6368] hover:text-[#202124]'
                }`}
              >
                Учебник & Теория
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('tests')}
                className={`px-4 py-1 rounded-full text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'tests'
                    ? 'bg-white text-[#1A73E8] shadow-xs'
                    : 'text-[#5F6368] hover:text-[#202124]'
                }`}
              >
                <span>Интерактивные тесты</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'tests' ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'bg-[#E8EAED] text-[#5F6368]'
                }`}>
                  {activeQuizzes.length}
                </span>
              </button>
            </div>

            {activeTab === 'textbook' ? (
              <>
                {/* Source & Status Banner */}
                <section className="rounded-xl border border-[#DADCE0] bg-[#F8F9FA] p-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[#1A73E8] font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-[#1A73E8]" />
                      Академический первоисточник & Инварианты
                    </div>
                    <div className="mt-1 text-sm text-[#202124] leading-relaxed font-medium">
                      {currentPage.sourceCitation || 'Академический синтез от первых принципов на базе графа обучения.'}
                    </div>
                    <div className="mt-0.5 text-xs text-[#5F6368]">{generationNote}</div>
                  </div>
                </section>

                {/* Invariants & Why it matters Grid (Google Green and Amber Callouts) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-[#CEEAD6] bg-[#E6F4EA] p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#137333] uppercase tracking-wider">
                      <CheckSquare className="w-4 h-4 text-[#1E8E3E]" />
                      Неизменные инварианты темы
                    </div>
                    <ul className="mt-2.5 space-y-2 text-xs leading-relaxed text-[#137333]">
                      {(currentPage.invariants || []).map((invariant, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#1E8E3E] shrink-0" />
                          <span>{invariant}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-[#FEEFC3] bg-[#FEF7E0] p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#B06000] uppercase tracking-wider">
                      <NotebookPen className="w-4 h-4 text-[#E37400]" />
                      Почему это важно в реальном мире
                    </div>
                    <div className="mt-2.5 text-xs leading-relaxed text-[#7A4B04]">
                      {currentPage.whyItMattersInRealWorld || 'Понимание инварианта защищает от типичных архитектурных ошибок и ускоряет решение реальных задач.'}
                    </div>
                  </div>
                </div>

                {/* Chapter Sections (Clean Google Docs Cards) */}
                <div className="space-y-4">
                  {pageSections.map((section, index) => (
                    <div key={section.id || index} className="rounded-xl border border-[#DADCE0] bg-white p-5 select-text shadow-none">
                      <div className="flex items-center justify-between gap-2 border-b border-[#F1F3F4] pb-2">
                        <span className="text-[10px] uppercase tracking-wider text-[#5F6368] font-semibold">
                          Раздел {index + 1}
                        </span>
                        <span className="rounded-full bg-[#E8F0FE] px-2 py-0.5 text-[10px] text-[#1A73E8] font-medium">
                          {section.type || 'концепт'}
                        </span>
                      </div>
                      <h3 className="mt-2 text-base font-semibold text-[#202124] tracking-tight">
                        {section.heading}
                      </h3>
                      <div className="mt-2.5 text-sm leading-relaxed text-[#3C4043] whitespace-pre-line space-y-2">
                        {section.content}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Visual Models & Illustrations */}
                {visualExamples.length > 0 && (
                  <section className="rounded-xl border border-[#DADCE0] bg-[#F8F9FA] p-5">
                    <div className="text-sm font-semibold text-[#202124] flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-[#1A73E8]" />
                      Визуальная модель и схема процессов
                    </div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {visualExamples.map((example) => (
                        <div key={example.id} className="rounded-lg border border-[#DADCE0] bg-white p-4 shadow-none">
                          <div className="text-[10px] uppercase tracking-wider text-[#5F6368] font-semibold">
                            {example.illustrationStyle || 'Схема процесса'}
                          </div>
                          <div className="mt-1 text-sm font-semibold text-[#202124]">{example.title}</div>
                          <div className="mt-2.5 rounded-lg border border-dashed border-[#DADCE0] bg-[#F8F9FA] px-4 py-3 text-center font-mono text-xs text-[#1A73E8]">
                            {example.visualization || '▣ → ▣ → ✓'}
                          </div>
                          <div className="mt-2 text-xs leading-relaxed text-[#5F6368]">{example.description}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Practical Tasks */}
                <section className="rounded-xl border border-[#DADCE0] bg-white p-5 shadow-none">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#202124]">
                    <FileText className="w-4 h-4 text-[#1A73E8]" />
                    Практические упражнения к главе
                  </div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(currentPage.exercises || []).map((exercise) => (
                      <div key={exercise.id} className="rounded-lg border border-[#DADCE0] bg-[#F8F9FA] p-4 flex flex-col justify-between">
                        <div>
                          <div className="text-sm font-semibold text-[#202124]">{exercise.title}</div>
                          <div className="mt-1.5 text-xs leading-relaxed text-[#5F6368]">{exercise.instruction}</div>
                          {exercise.starterSnippet && (
                            <pre className="mt-2 p-2.5 rounded-lg bg-white border border-[#DADCE0] font-mono text-[11px] text-[#202124] overflow-x-auto">
                              {exercise.starterSnippet}
                            </pre>
                          )}
                        </div>
                        {exercise.expectedOutputOrSolution && (
                          <div className="mt-3 pt-2 border-t border-[#DADCE0] text-[11px] text-[#137333]">
                            <span className="font-semibold">Критерий решения:</span> {exercise.expectedOutputOrSolution}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Blank Page Recall Challenge */}
                {currentPage.blankPagePrompt && (
                  <section className="rounded-xl border border-[#DADCE0] bg-[#E8F0FE] p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#1A73E8]">
                      <ExternalLink className="w-4 h-4 text-[#1A73E8]" />
                      Самопроверка на чистом листе (Blank Page Recall)
                    </div>
                    <div className="mt-2 text-xs leading-relaxed text-[#202124]">
                      <div className="font-semibold text-sm text-[#202124]">{currentPage.blankPagePrompt.question}</div>
                      {currentPage.blankPagePrompt.keyInvariantsRequired && (
                        <div className="mt-1.5 text-[#5F6368]">
                          <span className="text-[#1A73E8] font-medium">Обязательные инварианты:</span> {currentPage.blankPagePrompt.keyInvariantsRequired.join(', ')}
                        </div>
                      )}
                      {currentPage.blankPagePrompt.samplePassingAnswer && (
                        <div className="mt-2.5 p-3 rounded-lg bg-white border border-[#DADCE0] text-[#3C4043] text-xs">
                          <span className="font-semibold text-[#1A73E8]">Эталон ответа:</span> {currentPage.blankPagePrompt.samplePassingAnswer}
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </>
            ) : (
              /* Interactive Tests Mode (Google Forms style) */
              <section className="rounded-xl border border-[#DADCE0] bg-white p-6 space-y-6 shadow-none">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#DADCE0] pb-4 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#202124]">Интерактивный тест</h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#E8F0FE] text-[#1A73E8] text-[11px] font-semibold">
                        {selectedChapter.domain}
                      </span>
                    </div>
                    <p className="text-xs text-[#5F6368] mt-0.5">
                      Проверочные вопросы строго по теме: <strong className="text-[#202124]">{selectedChapter.title}</strong>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Difficulty selector */}
                    <div className="flex items-center rounded-lg border border-[#DADCE0] bg-[#F8F9FA] px-2 py-1 text-xs">
                      <span className="text-[#5F6368] mr-1.5 hidden sm:inline">Сложность:</span>
                      <select
                        value={quizDifficulty}
                        onChange={(e) => {
                          const val = e.target.value as 'junior' | 'middle' | 'senior' | 'staff';
                          setQuizDifficulty(val);
                          void handleGenerateQuizForTopic(val);
                        }}
                        disabled={isGeneratingQuiz}
                        className="bg-transparent text-xs text-[#202124] font-medium outline-none cursor-pointer"
                      >
                        <option value="junior">Junior (Базовый)</option>
                        <option value="middle">Middle (Инженерный)</option>
                        <option value="senior">Senior (Продвинутый)</option>
                        <option value="staff">Staff (Архитектурный)</option>
                      </select>
                    </div>

                    {/* AI Generation button */}
                    <button
                      type="button"
                      onClick={() => void handleGenerateQuizForTopic()}
                      disabled={isGeneratingQuiz}
                      className="px-3 py-1.5 rounded-lg bg-[#1A73E8] hover:bg-[#1765CC] text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-60"
                      title="Сгенерировать проверочные вопросы строго по текущей теме с помощью ИИ"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isGeneratingQuiz ? 'animate-spin' : ''}`} />
                      <span>{isGeneratingQuiz ? 'Генерация...' : 'Сгенерировать тест с ИИ'}</span>
                    </button>

                    {isQuizSubmitted && (
                      <button
                        type="button"
                        onClick={handleResetQuiz}
                        className="px-3 py-1.5 rounded-lg border border-[#DADCE0] bg-white hover:bg-[#F1F3F4] text-xs text-[#3C4043] flex items-center gap-1.5 transition cursor-pointer font-medium"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Пройти заново</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* AI Generator banner / notes */}
                {isGeneratingQuiz && (
                  <div className="p-3.5 rounded-xl border border-[#1A73E8]/30 bg-[#E8F0FE] text-xs text-[#1A73E8] flex items-center gap-2.5 animate-pulse">
                    <Sparkles className="w-4 h-4 shrink-0 animate-spin" />
                    <div>
                      <div className="font-semibold">ИИ составляет проверочный тест по теме «{selectedChapter.title}»...</div>
                      <div className="text-[11px] opacity-80 mt-0.5">Формирование прикладных ситуаций, вариантов ответов и научных обоснований уровня {quizDifficulty.toUpperCase()}.</div>
                    </div>
                  </div>
                )}

                {quizGenerationNote && !isGeneratingQuiz && (
                  <div className="px-3.5 py-2 rounded-lg bg-[#E6F4EA] border border-[#CEEAD6] text-xs text-[#137333] flex items-center justify-between">
                    <span className="font-medium">{quizGenerationNote}</span>
                    <span className="text-[11px] opacity-75">4 вопроса</span>
                  </div>
                )}

                {/* Quiz submission summary card */}
                {isQuizSubmitted && (
                  <div className="p-4 rounded-xl border border-[#DADCE0] bg-[#F8F9FA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {(() => {
                      const correctCount = activeQuizzes.filter((q, i) => {
                        const selected = userQuizAnswers[q.id || `q-${i}`];
                        return selected === (q.correctIndex ?? 0);
                      }).length;
                      const percent = Math.round((correctCount / activeQuizzes.length) * 100);
                      const isMastered = percent >= 75;

                      return (
                        <>
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-full ${isMastered ? 'bg-[#E6F4EA] text-[#137333]' : 'bg-[#FCE8E6] text-[#C5221F]'}`}>
                              <Award className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-[#202124]">
                                Результат: {correctCount} из {activeQuizzes.length} верно ({percent}%)
                              </div>
                              <div className="text-xs text-[#5F6368] mt-0.5">
                                {isMastered
                                  ? 'Отличный результат! Материал темы усвоен на высоком уровне.'
                                  : 'Рекомендуется изучить разборы ошибок ниже и перепройти тест.'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleResetQuiz}
                              className="px-3 py-1.5 rounded-lg border border-[#DADCE0] bg-white hover:bg-[#F1F3F4] text-xs font-medium text-[#3C4043] cursor-pointer"
                            >
                              Пройти заново
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleGenerateQuizForTopic()}
                              className="px-3 py-1.5 rounded-lg bg-[#1A73E8] hover:bg-[#1765CC] text-white text-xs font-medium cursor-pointer flex items-center gap-1.5"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Новые вопросы</span>
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Questions list */}
                <div className="space-y-4">
                  {activeQuizzes.map((quiz, quizIdx) => {
                    const quizId = quiz.id || `quiz-${quizIdx}`;
                    const selectedOption = userQuizAnswers[quizId];
                    const isCorrect = isQuizSubmitted && selectedOption === quiz.correctIndex;

                    return (
                      <div key={quizId} className="rounded-xl border border-[#DADCE0] bg-[#F8F9FA] p-5 space-y-3 shadow-none">
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-sm font-semibold text-[#202124] leading-snug">
                            <span className="text-[#1A73E8] mr-2">Вопрос {quizIdx + 1}.</span>
                            {quiz.question}
                          </div>
                          {isQuizSubmitted && (
                            <div className="shrink-0">
                              {isCorrect ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E6F4EA] text-[#137333] text-xs font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Верно
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FCE8E6] text-[#C5221F] text-xs font-semibold">
                                  <XCircle className="w-3.5 h-3.5" /> Ошибка
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Scenario context if available */}
                        {quiz.scenario && (
                          <div className="text-xs text-[#5F6368] bg-white p-2.5 rounded-lg border border-[#DADCE0] leading-relaxed">
                            <span className="font-semibold text-[#1A73E8] mr-1">Контекст:</span>
                            {quiz.scenario}
                          </div>
                        )}

                        <div className="space-y-2">
                          {quiz.options.map((optionRaw, optIdx) => {
                            const option = typeof optionRaw === 'string' ? optionRaw : (optionRaw as any)?.text || String(optionRaw);
                            const isThisSelected = selectedOption === optIdx;
                            let style = 'border-[#DADCE0] bg-white hover:bg-[#F1F3F4] text-[#202124]';

                            if (isQuizSubmitted) {
                              if (optIdx === quiz.correctIndex) {
                                style = 'border-[#1E8E3E] bg-[#E6F4EA] text-[#137333] font-semibold';
                              } else if (isThisSelected && optIdx !== quiz.correctIndex) {
                                style = 'border-[#D93025] bg-[#FCE8E6] text-[#C5221F]';
                              } else {
                                style = 'opacity-60 border-[#DADCE0] bg-white text-[#5F6368]';
                              }
                            } else if (isThisSelected) {
                              style = 'border-[#1A73E8] bg-[#E8F0FE] text-[#1A73E8] font-medium';
                            }

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => handleSelectQuizOption(quizId, optIdx)}
                                disabled={isQuizSubmitted}
                                className={`w-full text-left px-4 py-2.5 rounded-lg border text-xs transition cursor-pointer flex items-center justify-between gap-3 ${style}`}
                              >
                                <span className="leading-relaxed">{option}</span>
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                  isThisSelected ? 'border-[#1A73E8] bg-[#1A73E8] text-white' : 'border-[#DADCE0]'
                                }`}>
                                  {isThisSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {isQuizSubmitted && (
                          <div className="p-3.5 rounded-lg bg-white border border-[#DADCE0] text-xs space-y-1.5">
                            <div className="text-[#137333] font-semibold flex items-center gap-1.5">
                              <HelpCircle className="w-3.5 h-3.5 text-[#1E8E3E]" />
                              <span>Разбор ответа:</span>
                            </div>
                            <div className="text-[#3C4043] leading-relaxed">{quiz.explanation}</div>
                            {quiz.gapRemediationTip && (
                              <div className="text-[#1A73E8] pt-1.5 border-t border-[#F1F3F4]">
                                <span className="font-semibold">Совет ИИ:</span> {quiz.gapRemediationTip}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!isQuizSubmitted && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="text-xs text-[#5F6368]">
                      Отвечено: <strong className="text-[#202124]">{Object.keys(userQuizAnswers).length}</strong> из <strong>{activeQuizzes.length}</strong> вопросов
                    </div>
                    <button
                      type="button"
                      onClick={handleSubmitQuiz}
                      disabled={Object.keys(userQuizAnswers).length === 0}
                      className="px-6 py-2.5 rounded-full bg-[#1A73E8] hover:bg-[#1765CC] text-white font-medium text-xs transition cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Проверить ответы
                    </button>
                  </div>
                )}
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
