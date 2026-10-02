import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Bot, 
  Sparkles, 
  RefreshCw, 
  MessageSquare, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Layers,
  Check,
  Copy,
  FileText,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lightbulb
} from 'lucide-react';
import { playChime } from '../../../utils/audio.ts';
import { NoteItem } from '../../../types.ts';

export interface BlockAdviceItem {
  id: string;
  focus: string;
  title: string;
  advice: string;
  prompt: string;
  tag?: string;
  elaboration?: string;
}

export interface AiInsightWidgetProps {
  blockTitle?: string;
  blockPhase?: number;
  blockTopics?: string[];
  currentTopicTitle?: string;
  domain?: string;
  studentLevel?: string;
  onOpenChatWithPrompt?: (prompt: string) => void;
  onSaveNote?: (title: string, content: string, tag: string) => void;
}

// Rich domain-aware presets for instant responsiveness
function getDomainAdvices(
  title: string = 'Месяц 1: Фундамент',
  phase: number = 1,
  topics: string[] = [],
  currentTopic: string = 'Фундаментальные основы',
  domain: string = 'Универсальное мастерство'
): BlockAdviceItem[] {
  const lowerTitle = title.toLowerCase();
  const lowerDomain = domain.toLowerCase();
  const lowerTopics = topics.join(' ').toLowerCase();

  // 1. Foreign Languages Domain
  if (
    lowerDomain.includes('язык') ||
    lowerDomain.includes('english') ||
    lowerDomain.includes('немецк') ||
    lowerDomain.includes('испан')
  ) {
    return [
      {
        id: 'adv-lang-1',
        focus: '🎯 Стратегия блока',
        title: 'Учите готовые коллокации (Lexical Chunks), а не отдельные слова',
        advice: 'Мозг быстрее извлекает устойчивые фразовые конструкции целиком, чем собирает грамматику на лету. В этом блоке отрабатывайте цельные речевые шаблоны.',
        prompt: `Составь 10 самых частотных разговорных коллокаций по теме «${currentTopic}» с примерами применения в реальном диалоге`,
        tag: '#коллокации',
      },
      {
        id: 'adv-lang-2',
        focus: '⚖️ Главный компромисс',
        title: 'Скорость речи vs Грамматическая безупречность',
        advice: 'На начальном и среднем уровне зацикленность на ошибках блокирует спонтанность речи. Тренируйте беглость через Shadowing и интервальный пересказ.',
        prompt: `Дай методику тренировки беглости речи по теме «${currentTopic}» методом Shadowing`,
        tag: '#fluency',
      },
      {
        id: 'adv-lang-3',
        focus: '⚠️ Подводный камень',
        title: 'Пассивное узнавание вместо активного воспроизведения',
        advice: 'Понимание на слух не гарантирует умение сказать самому. Применяйте Active Recall: закрывайте текст и формулируйте мысль вслух своими словами.',
        prompt: `Сгенерируй для меня мини-тест на Active Recall по теме «${currentTopic}»`,
        tag: '#active_recall',
      },
      {
        id: 'adv-lang-4',
        focus: '🛠️ Боевая практика',
        title: 'Ситуативная симуляция с ролевой моделью',
        advice: 'Используйте ИИ как языкового партнера: смоделируйте реальный сценарий (переговоры, заказ, собеседование) с разбором ошибок после диалога.',
        prompt: `Проведи со мной ролевой диалог на тему «${currentTopic}», задавай вопросы и исправляй мои грамматические неточности`,
        tag: '#практика',
      },
    ];
  }

  // 2. UI/UX Design Domain
  if (
    lowerDomain.includes('дизайн') ||
    lowerDomain.includes('ui') ||
    lowerDomain.includes('ux') ||
    lowerDomain.includes('figma')
  ) {
    return [
      {
        id: 'adv-ui-1',
        focus: '🎯 Стратегия блока',
        title: 'Визуальная иерархия и контраст плотности',
        advice: 'Сначала проектируйте распределение акцентов: пользователь должен за 3 секунды считывать главное действие (Primary CTA) и информационные уровни.',
        prompt: `Как выстроить безупречную типографическую и цветовую иерархию в интерфейсе для темы «${currentTopic}»?`,
        tag: '#иерархия',
      },
      {
        id: 'adv-ui-2',
        focus: '⚖️ Главный компромисс',
        title: 'Эстетическая чистота vs Информационная плотность',
        advice: 'Избыток свободного пространства (Whitespace) в сложных профессиональных SaaS-интерфейсах замедляет работу оператора. Держите баланс плотности компонентов.',
        prompt: `Как проектировать дизайн-системы для SaaS с высокой плотностью данных по теме «${currentTopic}»?`,
        tag: '#design_systems',
      },
      {
        id: 'adv-ui-3',
        focus: '⚠️ Подводный камень',
        title: 'Слепое копирование трендов Dribbble без учета юзабилити',
        advice: 'Неконтрастный серый текст и низкодоступные кнопки проваливают тесты доступности WCAG AA. Всегда проверяйте контрастность и размеры тач-таргетов.',
        prompt: `Покажи критерии аудита доступности (Accessibility / WCAG) для экрана «${currentTopic}»`,
        tag: '#accessibility',
      },
      {
        id: 'adv-ui-4',
        focus: '🛠️ Боевая практика',
        title: 'Сквозное тестирование на реальных пользователях (CustDev)',
        advice: 'Ни один интерфейс не готов без коридорного тестирования. Дайте кликабельный прототип 3 людям и наблюдайте за точками замешательства.',
        prompt: `Составь сценарий коридорного UX-тестирования для проверки прототипа по теме «${currentTopic}»`,
        tag: '#ux_research',
      },
    ];
  }

  // 3. Business / Management / Marketing Domain
  if (
    lowerDomain.includes('бизнес') ||
    lowerDomain.includes('маркетинг') ||
    lowerDomain.includes('управлен') ||
    lowerDomain.includes('менеджмент')
  ) {
    return [
      {
        id: 'adv-biz-1',
        focus: '🎯 Стратегия блока',
        title: 'Фокус на Unit-экономике и LTV/CAC',
        advice: 'Масштабирование убыточной модели ведет к кассовому разрыву. В этом блоке сначала выровняйте экономику одной когорты перед запуском трафика.',
        prompt: `Объясни, как рассчитать и оптимизировать сходимость Unit-экономики для направления «${currentTopic}»`,
        tag: '#юнит_экономика',
      },
      {
        id: 'adv-biz-2',
        focus: '⚖️ Главный компромисс',
        title: 'Скорость проверки гипотез vs Идеальное качество продукта',
        advice: 'Делайте быстрый MVP (Minimum Viable Product): подтвердите готовность платить деньгами до того, как инвестировать месяцы в разработку.',
        prompt: `Как сформулировать и дешево проверить ключевую гипотезу спроса по теме «${currentTopic}»?`,
        tag: '#гипотезы',
      },
      {
        id: 'adv-biz-3',
        focus: '⚠️ Подводный камень',
        title: 'Метрики тщеславия (Vanity Metrics) вместо реального Retention',
        advice: 'Количество скачиваний или просмотров не равно ценности. Главный индикатор здоровья продукта — когортный Retention Day 30 и повторные покупки.',
        prompt: `Какие North Star метрики и продуктовые дашборды критичны для оценки темы «${currentTopic}»?`,
        tag: '#аналитика',
      },
      {
        id: 'adv-biz-4',
        focus: '🛠️ Боевая практика',
        title: 'Интервью CustDev по методике «Спроси маму»',
        advice: 'Никогда не спрашивайте «Купили бы вы это?». Задавайте вопросы о прошлом опыте, реальных затратах и боли в процессе текущего решения проблемы.',
        prompt: `Напиши 5 вопросов для проблемного CustDev-интервью по теме «${currentTopic}»`,
        tag: '#custdev',
      },
    ];
  }

  // 4. Engineering / Backend / Architecture Default
  if (
    phase === 1 ||
    lowerTitle.includes('фундамент') ||
    lowerTitle.includes('ядро') ||
    lowerTitle.includes('диск') ||
    lowerTopics.includes('b-tree') ||
    lowerTopics.includes('страниц')
  ) {
    return [
      {
        id: 'adv-eng-1',
        focus: '🎯 Стратегия блока',
        title: 'Сквозная цепочка: 8KB страницы → WAL → B-Tree',
        advice: 'В этом блоке не изучайте структуры данных изолированно: размер страницы диска 8KB диктует степень ветвления B-Tree, а последовательная запись WAL спасает базу от медленного Random I/O.',
        prompt: 'Объясни подробнее, как в первом блоке связаны между собой 8KB страницы диска, WAL и дерево B-Tree',
        tag: '#хранилище',
      },
      {
        id: 'adv-eng-2',
        focus: '⚖️ Главный компромисс',
        title: 'Плата за ускорение SELECT: цена поддержания индексов',
        advice: 'Каждый B-Tree индекс ускоряет поиск за O(log N), но замедляет каждый INSERT/UPDATE и расходует память Buffer Pool. Проектируйте составные индексы строго по селективности первых колонок.',
        prompt: 'Как правильно рассчитать селективность колонок для составного B-Tree индекса в PostgreSQL?',
        tag: '#индексы',
      },
      {
        id: 'adv-eng-3',
        focus: '⚠️ Подводный камень',
        title: 'Раздувание таблиц (Bloat) из-за MVCC при частых UPDATE',
        advice: 'PostgreSQL не перезаписывает кортеж на месте, а создает новую версию (tuple). Без регулярного autovacuum глубина страниц и размер таблицы растут лавинообразно, снижая кэш-хиты.',
        prompt: 'Как работает autovacuum в PostgreSQL и как бороться с раздуванием (bloat) таблиц при частых UPDATE?',
        tag: '#bloat',
      },
      {
        id: 'adv-eng-4',
        focus: '🛠️ Боевая практика',
        title: 'Аудит эффективности через EXPLAIN (ANALYZE, BUFFERS)',
        advice: 'При сдаче задач этого блока всегда проверяйте план запроса: критично не само время выполнения, а количество прочитанных shared hit/read буферов (1 буфер = 8 KB).',
        prompt: 'Покажи на реальном примере, как читать EXPLAIN (ANALYZE, BUFFERS) и находить узкие места дискового I/O',
        tag: '#профайлинг',
      },
    ];
  }

  // 5. Universal dynamic fallback
  return [
    {
      id: 'adv-gen-1',
      focus: '🎯 Стратегия блока',
      title: `Системная цель блока: «${title}»`,
      advice: `При прохождении этого блока сконцентрируйтесь на том, как ключевые темы (${topics.slice(0, 3).join(', ') || currentTopic}) складываются в единый практический навык. Не переходите дальше без решения практического кейса.`,
      prompt: `Какие фундаментальные принципы объединяют темы блока «${title}» по направлению «${domain}»?`,
      tag: '#стратегия',
    },
    {
      id: 'adv-gen-2',
      focus: '⚖️ Главный компромисс',
      title: 'Баланс глубины теории и скорости практики',
      advice: `Ключевой трейдофф этого блока — скорость первого результата против глубины понимания первопричин. Применяйте правило 80/20: 20% фундамента дают 80% уверенности на практике.`,
      prompt: `Какой главный практический компромисс (Trade-off) необходимо учитывать при освоении «${currentTopic}»?`,
      tag: '#компромисс',
    },
    {
      id: 'adv-gen-3',
      focus: '⚠️ Подводный камень',
      title: 'Типичные ошибки начинающих при реализации темы',
      advice: `Большинство ошибок в задачах происходят из-за пропуска базовых контрактов и краевых условий. Проверяйте решение на нетипичных входных данных.`,
      prompt: `На какие подводные камни и частые ошибки чаще всего наступают студенты в теме «${currentTopic}»?`,
      tag: '#отладка',
    },
    {
      id: 'adv-gen-4',
      focus: '🛠️ Боевая практика',
      title: `Фокус на текущей теме: «${currentTopic}»`,
      advice: `Текущая тема «${currentTopic}» является ключевым связующим звеном всего модуля. Закрепите её созданием собственного реального артефакта.`,
      prompt: `Объясни на реальном примере, как тема «${currentTopic}» применяется в боевых проектах?`,
      tag: '#практика',
    },
  ];
}

export const AiInsightWidget: React.FC<AiInsightWidgetProps> = ({
  blockTitle = 'Месяц 1: Фундамент',
  blockPhase = 1,
  blockTopics = [],
  currentTopicTitle = 'Основы мастерства',
  domain = 'Универсальное мастерство',
  studentLevel = 'intermediate',
  onOpenChatWithPrompt,
  onSaveNote,
}) => {
  const [advices, setAdvices] = useState<BlockAdviceItem[]>(() =>
    getDomainAdvices(blockTitle, blockPhase, blockTopics, currentTopicTitle, domain)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedElaboration, setExpandedElaboration] = useState(false);
  const [inlineElaborationText, setInlineElaborationText] = useState<string | null>(null);
  const [isLoadingElaboration, setIsLoadingElaboration] = useState(false);

  // Short badge for header chip
  const blockBadge = useMemo(() => {
    if (!blockTitle) return `Блок ${blockPhase}`;
    const clean = blockTitle.replace(/^(Месяц \d+:?|Блок \d+:?)\s*/i, '').trim();
    return clean.length > 18 ? clean.substring(0, 16) + '...' : clean;
  }, [blockTitle, blockPhase]);

  // When block/topic/domain changes, immediately provide domain-accurate advice
  useEffect(() => {
    const updatedAdvices = getDomainAdvices(blockTitle, blockPhase, blockTopics, currentTopicTitle, domain);
    setAdvices(updatedAdvices);
    setCurrentIndex(0);
    setIsAiGenerated(false);
    setInlineElaborationText(null);
    setExpandedElaboration(false);
  }, [blockTitle, blockPhase, blockTopics, currentTopicTitle, domain, studentLevel]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Request fresh AI advice from Gemini for the current block
  const handleRefreshFromAi = useCallback(async () => {
    setIsRefreshing(true);
    playChime('click');
    try {
      const response = await fetch('/api/gemini/block-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockTitle,
          blockPhase,
          blockTopics,
          currentTopic: currentTopicTitle,
          domain,
          studentLevel,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.advices) && data.advices.length > 0) {
          setAdvices(data.advices);
          setCurrentIndex(0);
          setIsAiGenerated(true);
          setInlineElaborationText(null);
          setExpandedElaboration(false);
          playChime('success');
          triggerToast('ИИ сформировал свежие советы по блоку');
          return;
        }
      }
    } catch (e) {
      console.warn('[AiInsightWidget] Gemini block advice refresh error, keeping domain advice:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, [blockTitle, blockPhase, blockTopics, currentTopicTitle, domain, studentLevel]);

  const handleNext = () => {
    if (advices.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % advices.length);
    setInlineElaborationText(null);
    setExpandedElaboration(false);
    playChime('click');
  };

  const handlePrev = () => {
    if (advices.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + advices.length) % advices.length);
    setInlineElaborationText(null);
    setExpandedElaboration(false);
    playChime('click');
  };

  const current = advices[currentIndex] || advices[0];

  const handleAskInChat = () => {
    playChime('click');
    if (onOpenChatWithPrompt && current?.prompt) {
      onOpenChatWithPrompt(current.prompt);
    }
  };

  // Save advice to Sticky Note & Global Notes
  const handleSaveToNotes = () => {
    if (!current) return;
    const noteTitle = `ИИ-Совет: ${current.title}`;
    const noteContent = `**${current.focus}**\n${current.title}\n\n${current.advice}\n\n💡 *Вопрос для практики:*\n${current.prompt}`;
    const noteTag = current.tag || '#ии_совет';

    if (onSaveNote) {
      onSaveNote(noteTitle, noteContent, noteTag);
    }

    // Broadcast global event
    window.dispatchEvent(
      new CustomEvent('learning_note_added', {
        detail: {
          id: `note-advice-${Date.now()}`,
          title: noteTitle,
          content: noteContent,
          tag: noteTag,
          createdAt: 'Только что',
        },
      })
    );

    playChime('success');
    triggerToast('Совет сохранен в конспект!');
  };

  // Copy advice text
  const handleCopyAdvice = () => {
    if (!current) return;
    const full = `[${current.focus}] ${current.title}\n\n${current.advice}\n\nВопрос для ИИ: ${current.prompt}`;
    navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    playChime('click');
    triggerToast('Совет скопирован');
  };

  // Expand inline breakdown right inside widget
  const handleToggleElaboration = async () => {
    if (expandedElaboration) {
      setExpandedElaboration(false);
      return;
    }

    setExpandedElaboration(true);
    if (!inlineElaborationText) {
      setIsLoadingElaboration(true);
      playChime('click');
      try {
        const response = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `Дай краткое практическое руководство (3 ключевых шага с примером) по теме: «${current.title}». Совет: «${current.advice}». Ответь емко и по делу за 3-4 предложения.`,
            history: [],
            context: {
              targetRole: domain,
              userLevel: studentLevel,
              activeNodeTitle: currentTopicTitle,
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.reply) {
            setInlineElaborationText(data.reply);
            playChime('success');
          }
        }
      } catch (err) {
        setInlineElaborationText(
          `Практическое правило: 1. Сформулируйте инвариант системы. 2. Проверьте граничные случаи на малых объемах данных. 3. Измеряйте задержку и метрики потребления ресурсов.`
        );
      } finally {
        setIsLoadingElaboration(false);
      }
    }
  };

  return (
    <div className="h-full flex flex-col justify-between p-3 text-slate-800 select-none text-xs bg-gradient-to-b from-white to-indigo-50/25 relative">
      {/* Toast feedback pill */}
      {toastMessage && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 px-3 py-1 bg-slate-900/95 text-white text-[10px] font-medium rounded-full shadow-xl flex items-center space-x-1.5 animate-fade-in pointer-events-none backdrop-blur-md">
          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="truncate max-w-[200px]">{toastMessage}</span>
        </div>
      )}

      {/* 1. Header with Block Scope Indicator */}
      <div className="flex items-center justify-between pb-1.5 border-b border-indigo-100/80 gap-1.5 min-w-0">
        <div className="flex items-center space-x-1.5 font-semibold text-slate-900 text-xs min-w-0 truncate">
          <Bot className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="truncate">ИИ-Совет по блоку</span>
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          {/* Active Block Chip */}
          <span
            className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200/70 text-[10px] font-medium text-indigo-700 max-w-[120px] truncate"
            title={`Текущий блок обучения: ${blockTitle}`}
          >
            <Layers className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
            <span className="truncate">{blockBadge}</span>
          </span>

          {/* AI Refresh Button */}
          <button
            type="button"
            onClick={handleRefreshFromAi}
            disabled={isRefreshing}
            className={`p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer ${
              isRefreshing ? 'animate-spin text-indigo-600' : ''
            }`}
            title="Сгенерировать свежий совет ИИ по этому блоку"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 2. Block Context Subtitle */}
      <div className="flex items-center justify-between px-0.5 pt-1 text-[10px] text-slate-500">
        <span className="truncate max-w-[185px]">
          Тема: <strong className="text-slate-700 font-medium">{currentTopicTitle || blockTitle}</strong>
        </span>
        {isAiGenerated ? (
          <span className="inline-flex items-center space-x-0.5 text-indigo-600 font-semibold shrink-0">
            <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
            <span>Gemini AI</span>
          </span>
        ) : (
          <span className="text-slate-400 font-mono text-[9px] shrink-0">
            {domain.length > 15 ? domain.slice(0, 13) + '...' : domain}
          </span>
        )}
      </div>

      {/* 3. Main Advice Card */}
      <div className="my-1.5 p-2.5 bg-indigo-50/70 hover:bg-indigo-50/90 rounded-xl border border-indigo-100 select-text transition flex-1 flex flex-col justify-between overflow-hidden shadow-2xs">
        <div className="overflow-y-auto pr-0.5 max-h-[125px]">
          {/* Focus & Title */}
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="inline-flex items-center text-[10px] font-semibold text-indigo-700 uppercase tracking-wider bg-white/90 px-1.5 py-0.5 rounded border border-indigo-200/60 shadow-2xs">
              {current?.focus || '🎯 Стратегия блока'}
            </span>
            <div className="flex items-center space-x-1 shrink-0">
              {current?.tag && (
                <span className="text-[10px] font-mono text-indigo-600">
                  {current.tag}
                </span>
              )}
              <button
                type="button"
                onClick={handleCopyAdvice}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-white/80 transition cursor-pointer"
                title="Копировать совет"
              >
                {copied ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
              </button>
              <button
                type="button"
                onClick={handleSaveToNotes}
                className="p-1 rounded text-slate-400 hover:text-amber-700 hover:bg-amber-100/50 transition cursor-pointer"
                title="Сохранить этот совет в конспект"
              >
                <FileText className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>

          <h4 className="text-[11px] font-bold text-slate-900 leading-tight mb-1">
            {current?.title || 'Архитектурный инсайт'}
          </h4>

          <p className="text-[11px] leading-relaxed text-slate-700 font-normal">
            {current?.advice}
          </p>

          {/* Inline Elaboration Accordion */}
          {expandedElaboration && (
            <div className="mt-2 pt-2 border-t border-indigo-200/60 text-[10px] leading-relaxed text-indigo-950 bg-white/80 p-2 rounded-lg border border-indigo-100 animate-fade-in">
              {isLoadingElaboration ? (
                <div className="flex items-center space-x-2 text-indigo-600 py-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>ИИ формирует практический разбор...</span>
                </div>
              ) : (
                <div>
                  <div className="font-semibold text-indigo-900 flex items-center space-x-1 mb-1">
                    <Lightbulb className="w-3 h-3 text-amber-500" />
                    <span>Практический разбор:</span>
                  </div>
                  <div className="text-slate-700 leading-relaxed font-sans select-text whitespace-pre-wrap">
                    {inlineElaborationText}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick inline expander button */}
        <div className="pt-1 flex items-center justify-between text-[10px] text-indigo-600 border-t border-indigo-100/60 mt-1 shrink-0">
          <button
            type="button"
            onClick={handleToggleElaboration}
            className="flex items-center space-x-1 hover:text-indigo-800 font-medium transition cursor-pointer"
          >
            <span>{expandedElaboration ? 'Свернуть разбор' : '✨ Разбор с примером'}</span>
            {expandedElaboration ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <span className="text-[9px] text-slate-400 font-mono">
            {currentIndex + 1} из {advices.length}
          </span>
        </div>
      </div>

      {/* 4. Footer & Interaction Controls */}
      <div className="pt-0.5 flex items-center justify-between gap-1.5 shrink-0">
        {/* Pager */}
        <div className="flex items-center space-x-1 shrink-0">
          <button
            type="button"
            onClick={handlePrev}
            disabled={advices.length <= 1}
            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-40 transition cursor-pointer"
            title="Предыдущий совет"
          >
            <ChevronLeft className="w-2.5 h-2.5" />
          </button>
          <span className="text-[10px] text-slate-500 font-mono min-w-[28px] text-center">
            {currentIndex + 1}/{advices.length}
          </span>
          <button
            type="button"
            onClick={handleNext}
            disabled={advices.length <= 1}
            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-40 transition cursor-pointer"
            title="Следующий совет"
          >
            <ChevronRight className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* Ask AI in Chat Button */}
        <button
          type="button"
          onClick={handleAskInChat}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-[11px] transition cursor-pointer shadow-xs shrink-0 active:scale-97"
          title="Открыть чат с ИИ и разобрать этот совет"
        >
          <MessageSquare className="w-3 h-3" />
          <span>Спросить у ИИ</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
