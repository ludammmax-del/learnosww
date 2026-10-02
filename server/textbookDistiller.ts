import { FirestoreKnowledgeCache } from './firestoreKnowledgeCache.ts';
import { callGeminiSafeJson, UNIVERSAL_REAL_WORLD_HONESTY_CONSTITUTION } from './geminiApi.ts';
import { detectDomainCategory } from './curriculumGenerator.ts';
import { retrieveMultiSourceGrounding, formatSourcesForPrompt } from './textbookKnowledgeService.ts';

export interface DistilledEducationalBlock {
  topic: string;
  domain: string;
  sourceCitation: string;
  isbnOrDoi?: string;
  invariants: string[];
  formula?: string;
  academicTheoryMarkdown: string;
  whyItMattersInRealWorld: string;
  practicalCodeSnippet: string;
  codeLanguage: string;
  visualExamples?: Array<{
    id: string;
    title: string;
    description: string;
    prompt: string;
    illustrationStyle?: string;
    visualization?: string;
  }>;
  pageSections?: Array<{
    id: string;
    heading: string;
    content: string;
    type?: 'concept' | 'example' | 'visual' | 'exercise' | 'check';
  }>;
  exercises: Array<{
    id: string;
    title: string;
    instruction: string;
    starterSnippet: string;
    expectedOutputOrSolution: string;
    verificationCriteria: string[];
  }>;
  expressQuiz: Array<{
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    gapRemediationTip: string;
  }>;
  blankPagePrompt: {
    question: string;
    keyInvariantsRequired: string[];
    samplePassingAnswer: string;
  };
  groundingSources?: Array<{
    id: string;
    sourceType: string;
    sourceLabel: string;
    title: string;
    authors?: string;
    url?: string;
    chapterOrSection?: string;
    snippet: string;
    verifiableQuote: string;
    doiOrIsbn?: string;
  }>;
}

export const VERIFIED_TEXTBOOK_LIBRARY: Record<string, DistilledEducationalBlock> = {
  btree_indexing: {
    topic: 'B-Tree & indexing',
    domain: 'Базы данных',
    sourceCitation: 'Database internals and storage-engine fundamentals',
    isbnOrDoi: 'textbook-core-indexing',
    invariants: [
      'Сложность поиска в B-Tree близка к O(log_B N).',
      'Разбивка данных по страницам снижает стоимость случайного I/O.',
      'Сбалансированная структура обеспечивает предсказуемую глубину дерева.'
    ],
    formula: 'height ≈ log_{B} N',
    academicTheoryMarkdown: `### 1. Фундаментальный принцип\nB-Tree структурирует данные в страницы и глубоко выравнивает нагрузку на чтение. Это особенно важно при работе с диском, где стоимость случайного доступа выше, чем стоимость вычислений.\n\n### 2. Почему это работает\nБольшое ветвление уменьшает глубину дерева, а значит и число обращений к диску. Индекс не просто ускоряет поиск — он минимизирует случайные I/O.\n\n### 3. Практическая интерпретация\nДля систем с большими объемами данных индексы превращаются из тонкой оптимизации в фундаментальную часть архитектуры.`,
    whyItMattersInRealWorld: 'Индексы являются основой устойчивой работы систем с миллионами записей и больших аналитических запросов.',
    practicalCodeSnippet: `def btree_height(n, b):\n    import math\n    return math.ceil(math.log(n, b))\n\nprint(btree_height(1_000_000, 128))`,
    codeLanguage: 'python',
    exercises: [
      {
        id: 'ex-btree-1',
        title: 'Найти высоту дерева',
        instruction: 'Посчитайте приблизительную высоту B-Tree для 1_000_000 записей и фактор ветвления 128.',
        starterSnippet: 'def btree_height(n, b):\n    import math\n    return math.ceil(math.log(n, b))\n',
        expectedOutputOrSolution: 'Примерно 3–4 уровня.',
        verificationCriteria: ['Использована формула логарифма', 'Результат интерпретирован как глубина дерева']
      }
    ],
    expressQuiz: [
      {
        id: 'q-btree-1',
        question: 'Почему B-Tree лучше бинарного дерева для дисковых баз данных?',
        options: ['Потому что дерево меньше по размеру', 'Потому что оно содержит больше ключей на страницу и снижает число случайных I/O', 'Потому что оно всегда хранится в памяти', 'Потому что бинарное дерево не поддерживает диапазонные запросы'],
        correctIndex: 1,
        explanation: 'Большее ветвление уменьшает глубину дерева и, следовательно, количество дисковых обращений.',
        gapRemediationTip: 'Связывайте индекс с физическим уровнем хранения.'
      }
    ],
    blankPagePrompt: {
      question: 'Почему для больших баз данных важна глубина дерева, а не только скорость сравнения ключей?',
      keyInvariantsRequired: ['страницы и I/O', 'ветвление', 'глубина дерева'],
      samplePassingAnswer: 'Потому что на практике главным ограничением является доступ к диску. Чем меньше уровней дерева, тем меньше случайных чтений и выше стабильность системы.'
    }
  },
  raft_consensus: {
    topic: 'Raft & consensus',
    domain: 'Системы',
    sourceCitation: 'Consensus algorithms in distributed systems',
    isbnOrDoi: 'raft-core',
    invariants: [
      'Лидер должен получать кворум для закрепления записи.',
      'Непрерывная репликация и heartbeat необходимы для поддержания стабильности.',
      'Сетевое разделение не должно приводить к расхождению логов.'
    ],
    formula: 'quorum = floor(N / 2) + 1',
    academicTheoryMarkdown: `### 1. Введение\nRaft строит понятную модель консенсуса на основе ролей leader, follower и candidate. Его цель — обеспечить согласованное состояние в распределённой системе.\n\n### 2. Как работает кворум\nКаждая запись закрепляется после подтверждения большинством узлов. Это позволяет избежать split-brain и скрыть мелкие сбои.\n\n### 3. Практический вывод\nЕсли система достаточно большая, согласованность достигается не за счёт громоздких схем, а за счёт строгих правил голосования и журналов.`,
    whyItMattersInRealWorld: 'Консенсус используется в распределённых системах, хранилищах конфигураций и сервисах управления состоянием.',
    practicalCodeSnippet: `def quorum(total_nodes):\n    return total_nodes // 2 + 1\n\nprint(quorum(5))`,
    codeLanguage: 'python',
    exercises: [
      {
        id: 'ex-raft-1',
        title: 'Рассчитать кворум',
        instruction: 'Посчитайте кворум для кластера из 7 узлов.',
        starterSnippet: 'def quorum(total_nodes):\n    return total_nodes // 2 + 1\n',
        expectedOutputOrSolution: '4',
        verificationCriteria: ['Использована формула большинства', 'Проверен случай 7 узлов']
      }
    ],
    expressQuiz: [
      {
        id: 'q-raft-1',
        question: 'Что гарантирует кворум в Raft?',
        options: ['Быстрое завершение без логов', 'Подтверждение операции большинством узлов', 'Автоматическую синхронизацию без лидера', 'Равномерное распределение нагрузки'],
        correctIndex: 1,
        explanation: 'Кворум гарантирует, что решение принято не одной машиной, а большинством.',
        gapRemediationTip: 'Представляйте кворум как правило минимального большинства.'
      }
    ],
    blankPagePrompt: {
      question: 'Почему в распределённых системах нужен кворум, а не просто случайный лидер?',
      keyInvariantsRequired: ['большинство', 'согласованность', 'отказоустойчивость'],
      samplePassingAnswer: 'Потому что без большинства система может разделиться на несогласованные части. Кворум делает состояние единственным и проверяемым.'
    }
  }
};

const buildTopicSpecificQuiz = (topic: string, domain: string, count: number = 3) => {
  const cleanTopic = topic.trim() || 'Инженерия систем';
  return [
    {
      id: `q-${cleanTopic.toLowerCase().replace(/[^a-z0-9]/g, '-')}-1`,
      question: `Каково основное назначение и базовый инвариант темы «${cleanTopic}»?`,
      scenario: `Проектирование и эксплуатация модуля в контексте раздела «${domain}».`,
      options: [
        `Обеспечение устойчивости, детерминированности и соблюдения ключевых инвариантов «${cleanTopic}»`,
        `Полное исключение необходимости валидации данных и архитектурных тестов`,
        `Принудительное замедление выполнения операций для протоколирования`,
        `Случайная маршрутизация запросов без сохранения контекста`
      ],
      correctIndex: 0,
      explanation: `Фундаментальный принцип «${cleanTopic}» заключается в сохранении ключевых инвариантов и предсказуемости поведения системы независимо от внешних фреймворков.`,
      gapRemediationTip: `Сфокусируйтесь на неизменном ядре логики «${cleanTopic}», а не на сиюминутных деталях синтаксиса.`
    },
    {
      id: `q-${cleanTopic.toLowerCase().replace(/[^a-z0-9]/g, '-')}-2`,
      question: `С каким ключевым инженерным компромиссом сопряжено практическое применение «${cleanTopic}»?`,
      scenario: `Оптимизация производительности и масштабируемости в реальном production-окружении.`,
      options: [
        `Баланс между накладными расходами на структурирование/синхронизацию и скоростью/надежностью операций`,
        `Увеличение потребления памяти ровно на 100% при каждом отдельном обращении`,
        `Несовместимость с любыми современными протоколами передачи данных`,
        `Жесткое требование работы исключительно в однопоточном синхронном режиме`
      ],
      correctIndex: 0,
      explanation: `В реальном проектировании внедрение «${cleanTopic}» всегда требует оценки компромисса: вычислительные накладные расходы vs гарантированная надежность.`,
      gapRemediationTip: `Анализируйте цену каждого архитектурного решения перед его внедрением в критический путь.`
    },
    {
      id: `q-${cleanTopic.toLowerCase().replace(/[^a-z0-9]/g, '-')}-3`,
      question: `Какое граничное условие или побочный эффект наиболее критично контролировать в «${cleanTopic}»?`,
      scenario: `Пограничные сценарии, пиковая нагрузка или сбои зависимостей.`,
      options: [
        `Нарушение инвариантов при деградации сети, исчерпании лимитов или рассинхронизации состояния`,
        `Наличие автоматических тестов и статических анализаторов типов`,
        `Соблюдение контрактов интерфейсов и идемпотентности вызовов`,
        `Кэширование неизменяемых детерминированных результатов`
      ],
      correctIndex: 0,
      explanation: `Критические сбои при работе с «${cleanTopic}» чаще всего вызваны несоблюдением граничных условий или непредвиденным поведением при деградации внешних ресурсов.`,
      gapRemediationTip: `Всегда моделируйте сценарии сбоя и тестируйте крайние значения входных данных.`
    }
  ].slice(0, count);
};

const normalizeQuizList = (rawList: any, topic: string, domain: string) => {
  if (!Array.isArray(rawList) || rawList.length === 0) {
    return buildTopicSpecificQuiz(topic, domain, 3);
  }

  const normalized = rawList.map((item: any, idx: number) => {
    if (!item || typeof item !== 'object') {
      return buildTopicSpecificQuiz(topic, domain, 3)[0];
    }

    const question = String(item.question || item.title || `Вопрос ${idx + 1} по теме «${topic}»`).trim();
    let options: string[] = [];
    let correctIndex = 0;

    if (Array.isArray(item.options)) {
      if (item.options.length > 0 && typeof item.options[0] === 'object' && item.options[0] !== null) {
        options = item.options.map((opt: any) => String(opt.text || opt.title || opt.label || ''));
        const foundIdx = item.options.findIndex((opt: any) => Boolean(opt.isCorrect));
        if (foundIdx >= 0) {
          correctIndex = foundIdx;
        }
      } else {
        options = item.options.map((opt: any) => String(opt ?? ''));
      }
    }

    if (options.length < 2) {
      options = [
        `Корректная реализация с соблюдением принципов «${topic}»`,
        `Игнорирование базовых инвариантов и ограничений`,
        `Избыточное усложнение без практической пользы`,
        `Случайный выбор параметров без верификации`
      ];
      correctIndex = 0;
    }

    if (typeof item.correctIndex === 'number' && item.correctIndex >= 0 && item.correctIndex < options.length) {
      correctIndex = item.correctIndex;
    }

    return {
      id: String(item.id || `quiz-${idx + 1}`),
      question,
      scenario: item.scenario ? String(item.scenario) : undefined,
      options,
      correctIndex,
      explanation: String(item.explanation || `Разбор ответа: правильный вариант строго вытекает из принципов «${topic}».`),
      gapRemediationTip: String(item.gapRemediationTip || `Обратите внимание на ключевой инвариант «${topic}».`),
    };
  });

  return normalized.length > 0 ? normalized : buildTopicSpecificQuiz(topic, domain, 3);
};

const buildFallbackBlock = (topic: string, domain: string): DistilledEducationalBlock => ({
  topic,
  domain,
  sourceCitation: 'Self-synthesized academic foundation with verification in the learning OS',
  isbnOrDoi: 'local-synthesized-block',
  invariants: [
    `В теме «${topic}» существует набор принципов, который не меняется при смене инструмента.`,
    `Корректность определяется не количеством текста, а качеством проверки и применимости.`,
    `Объяснение должно быть привязано к конкретному случаю использования и граничным условиям.`
  ],
  formula: 'understanding = invariant × practice × verification',
  academicTheoryMarkdown: `### 1. Фундамент\nВ теме «${topic}» важно начать не с деталей, а с инварианта: устойчивого правила, которое не меняется от контекста к контексту.\n\n### 2. Практический слой\nПонимание становится устойчивым, когда правило применяется в небольшом реальном сценарии и затем проверяется.\n\n### 3. Ответственность за качество\nКлюч к сильному знанию — не запоминание, а последовательная верификация самих решений.`,
  whyItMattersInRealWorld: 'Понимание всегда связано с возможностью объяснить правило и применить его в нужный момент без подглядывания.',
  practicalCodeSnippet: `# Target topic: ${topic}\n# Start with invariant, then test with one real scenario.\nprint('Explain the principle in simple terms and validate it with an example.')`,
  codeLanguage: 'python',
  visualExamples: [
    {
      id: 'visual-1',
      title: 'Пример на минимальном сценарии',
      description: 'Сначала формулируем инвариант, затем проверяем его на одном понятном кейсе и объясняем результат.',
      prompt: 'Показать, как правило работает в реальном жизненном контексте: вход -> действие -> проверка.',
      illustrationStyle: 'diagram',
      visualization: '▣ → ▣ → ✓'
    },
    {
      id: 'visual-2',
      title: 'Почему это важно',
      description: 'Обучение становится устойчивым, когда материал сводится к проверяемому паттерну, а не к набору слов.',
      prompt: 'Показать пузырь мыслей, в котором принцип превращается в рабочий инструмент.',
      illustrationStyle: 'flow',
      visualization: 'Принцип → Пример → Проверка → Память'
    }
  ],
  pageSections: [
    { id: 'sec-1', heading: 'Ключевой принцип', content: 'Не ищите длинный текст, ищите устойчивое правило, которое можно объяснить без терминов и проверить на одной задаче.', type: 'concept' },
    { id: 'sec-2', heading: 'Минимальный пример', content: 'Примените правило к простому кейсу, отметьте что меняется и что остаётся неизменным.', type: 'example' },
    { id: 'sec-3', heading: 'Проверка', content: 'После объяснения всегда возвращайтесь к доказуемому результату: что было ожидаемо, что подтвердилось, что ещё вызывает сомнение?', type: 'check' }
  ],
  exercises: [
    {
      id: 'ex-fallback-1',
      title: `Объяснить ключевой принцип «${topic}»`,
      instruction: 'Найдите самый важный инвариант и объясните его простыми словами без жаргона.',
      starterSnippet: '# Напишите краткое объяснение\n',
      expectedOutputOrSolution: 'Понятное объяснение и один проверяемый пример.',
      verificationCriteria: ['Есть инвариант', 'Есть пример', 'Нет воды']
    }
  ],
  expressQuiz: buildTopicSpecificQuiz(topic, domain, 3),
  blankPagePrompt: {
    question: `Объясните тему «${topic}» так, как будто учите новичка за три минуты.`,
    keyInvariantsRequired: ['основной принцип', 'практический пример', 'граничные условия'],
    samplePassingAnswer: 'Главная идея в том, что правило не меняется и может быть проверено на минимальном примере. Это и есть устойчивое понимание.'
  },
  groundingSources: [
    {
      id: 'source-local',
      sourceType: 'local_synthesis',
      sourceLabel: 'Platform synthesis',
      title: `Learning OS: ${topic}`,
      snippet: 'Материал адаптирован под текущую траекторию и телеметрию без искусственного раздувания текста.',
      verifiableQuote: 'Понимание подтверждается через объяснение, применение и проверку.'
    }
  ]
});

export class TextbookDistiller {
  public static async getOrDistillBlock(params: {
    topic: string;
    domain?: string;
    userLevel?: string;
    pageFocus?: string;
    forceRefresh?: boolean;
    sourceContext?: Array<{ title: string; sourceLabel: string; authors?: string; url?: string; chapterOrSection?: string; excerpt?: string; doiOrIsbn?: string }>;
  }): Promise<DistilledEducationalBlock> {
    const rawTopic = (params.topic || 'Фундаментальные основы').trim();
    const domain = params.domain || 'Инженерия & Системы';
    const normalizedTopic = rawTopic.toLowerCase();

    if (!params.forceRefresh) {
      const cached = await FirestoreKnowledgeCache.getCachedLesson(rawTopic, domain);
      if (cached && cached.academicTheoryMarkdown && Array.isArray(cached.invariants) && cached.invariants.length > 0) {
        return cached;
      }
    }

    const match = Object.entries(VERIFIED_TEXTBOOK_LIBRARY).find(([key, block]) => {
      const keyText = key.toLowerCase().replace(/[_-]/g, ' ');
      return normalizedTopic.includes(keyText) || keyText.includes(normalizedTopic) || block.topic.toLowerCase().includes(normalizedTopic);
    });

    if (match) {
      const [, block] = match;
      await FirestoreKnowledgeCache.saveCachedLesson(rawTopic, block, domain);
      return block;
    }

    const groundingResult = await retrieveMultiSourceGrounding(rawTopic);
    const groundedPromptText = formatSourcesForPrompt(groundingResult.sources);
    const focusPrompt = params.pageFocus || `Сделай содержательный, академически строгий учебный блок по теме «${rawTopic}» с глубокой теорией, инвариантами, наглядными примерами, практическими упражнениями и интерактивным тестом строго по теме.`;

    const systemInstruction = `Ты — академический дистиллятор Learning OS.
${UNIVERSAL_REAL_WORLD_HONESTY_CONSTITUTION}

Сформируй глубокий, правдивый учебный блок по теме: «${rawTopic}» для предметной области: «${domain}».

КРИТИЧЕСКИЕ ТРЕБОВАНИЯ К ИНТЕРАКТИВНОМУ ТЕСТУ (поле "expressQuiz"):
1. Массив "expressQuiz" ОБЯЗАН содержать 3-4 проверочных вопроса СТРОГО И ИСКЛЮЧИТЕЛЬНО по существу темы «${rawTopic}».
2. Каждый вопрос должен проверять реальные законы, свойства, механизмы, практические компромиссы, расчеты или пограничные условия темы «${rawTopic}».
3. КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНЫ шаблонные вопросы про конспекты, зубрежку или "что главное в учебе".
4. Формат каждого вопроса в "expressQuiz":
   {
     "id": "quiz-1",
     "question": "Конкретный глубокий вопрос по теме «${rawTopic}»",
     "scenario": "Реальный прикладной контекст или условие задачи",
     "options": [
       "Вариант 1",
       "Вариант 2",
       "Вариант 3",
       "Вариант 4"
     ],
     "correctIndex": 0, // число 0, 1, 2 или 3
     "explanation": "Подробный разбор почему именно этот ответ верен",
     "gapRemediationTip": "Совет студенту при ошибке"
   }

Открытые источники для опоры:
${groundedPromptText}`;

    try {
      const aiBlock = await callGeminiSafeJson(`Сформируй большой учебный блок по теме: «${rawTopic}».\n\nДополнительный фокус: ${focusPrompt}\n\nТекущий контекст: ${params.sourceContext && params.sourceContext.length ? JSON.stringify(params.sourceContext.slice(0, 4)) : 'Отсутствует'}.`, {
        systemInstruction,
        temperature: 0.25,
        models: ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'],
        skipCache: false,
        agentName: 'AI-TextbookDistiller',
        taskGoal: `Textbook distillation: ${rawTopic}`,
        domain,
        enableCleanMemory: true,
      });

      if (aiBlock && aiBlock.academicTheoryMarkdown && Array.isArray(aiBlock.invariants)) {
        const distilled: DistilledEducationalBlock = {
          topic: aiBlock.topic || rawTopic,
          domain: aiBlock.domain || domain,
          sourceCitation: aiBlock.sourceCitation || `Academic synthesis for ${rawTopic}`,
          isbnOrDoi: aiBlock.isbnOrDoi,
          invariants: Array.isArray(aiBlock.invariants) && aiBlock.invariants.length > 0 ? aiBlock.invariants : [
            `Основной инвариант темы «${rawTopic}» — устойчивость правила при смене контекста.`,
            `Проверка и применение важнее запоминания случайных формулировок.`,
            `Любую идею нужно проверять на одном минимальном, но реальном примере.`
          ],
          formula: aiBlock.formula || undefined,
          academicTheoryMarkdown: aiBlock.academicTheoryMarkdown,
          whyItMattersInRealWorld: aiBlock.whyItMattersInRealWorld || 'Это правило помогает применять знания в реальном мире и быстрее понимать истинную структуру задачи.',
          practicalCodeSnippet: aiBlock.practicalCodeSnippet || `# Практика: ${rawTopic}\nprint('Сначала формулируем инвариант, затем проверяем на примере.')`,
          codeLanguage: aiBlock.codeLanguage || 'python',
          visualExamples: Array.isArray(aiBlock.visualExamples) && aiBlock.visualExamples.length > 0 ? aiBlock.visualExamples : [
            {
              id: 'ai-visual-1',
              title: 'Кейс применения',
              description: 'Правило и пример работают вместе: сначала мысль обосновывается, потом она проверяется на минимальном сценарии.',
              prompt: 'Показать вход, действие и результат на одном простом примере.',
              illustrationStyle: 'diagram',
              visualization: 'Вход → Правило → Проверка → Результат'
            },
            {
              id: 'ai-visual-2',
              title: 'Схема понимания',
              description: 'В учебной главе важно преодолеть разрыв между абстракцией и конкретным применением на реальном кейсе.',
              prompt: 'Показать, как принцип превращается в рабочий инструмент и затем в привычный навык.',
              illustrationStyle: 'flow',
              visualization: 'Понятие → Пример → Проверка → Уверенность'
            }
          ],
          pageSections: Array.isArray(aiBlock.pageSections) && aiBlock.pageSections.length > 0 ? aiBlock.pageSections : [
            { id: 'ai-sec-1', heading: 'Введение', content: 'В этой главе объясняется, почему тема важна, какие инварианты лежат в её основе и как она выглядит в реальном приложении.', type: 'concept' },
            { id: 'ai-sec-2', heading: 'Основы и ключевые принципы', content: 'Главная идея темы — устойчивое правило, которое можно применять на небольшом кейсе и проверить. Это фундамент, на котором строится весь учебный блок.', type: 'concept' },
            { id: 'ai-sec-3', heading: 'Минимальный пример', content: 'Возьмите одну задачу, покажите как работает правило, и объясните, почему итог оказался таким. Сравните ожидаемый сценарий и фактический результат.', type: 'example' },
            { id: 'ai-sec-4', heading: 'Практика и упражнения', content: 'Планируйте небольшие задачи, которые помогают закрепить правило на разных уровнях: от формулировки до применения в проектном контексте.', type: 'exercise' },
            { id: 'ai-sec-5', heading: 'Самопроверка', content: 'Напишите коротко, что принцип гарантирует, где он может сломаться и какие сигналы говорят о слабом понимании.', type: 'check' }
          ],
          exercises: Array.isArray(aiBlock.exercises) && aiBlock.exercises.length > 0 ? aiBlock.exercises : [
            {
              id: 'ex-ai-1',
              title: `Проверить правило в теме «${rawTopic}»`,
              instruction: 'Возьмите один минимальный сценарий и объясните, как правило работает на нём.',
              starterSnippet: '# Сценарий\n',
              expectedOutputOrSolution: 'Короткое, но проверяемое объяснение и пример.',
              verificationCriteria: ['Есть правило', 'Есть пример', 'Понятно без лишней воды']
            }
          ],
          expressQuiz: normalizeQuizList(aiBlock.expressQuiz, rawTopic, domain),
          blankPagePrompt: aiBlock.blankPagePrompt || {
            question: `Объясните тему «${rawTopic}» так, чтобы это понял новичок.`,
            keyInvariantsRequired: ['краткое правило', 'один пример', 'проверка'],
            samplePassingAnswer: 'Здесь важно понять не набор терминов, а сам принцип и способ его верификации.'
          }
        };

        await FirestoreKnowledgeCache.saveCachedLesson(rawTopic, distilled, domain);
        return distilled;
      }
    } catch (err: any) {
      console.warn('[TextbookDistiller] Gemini synthesis fallback:', err?.message || err);
    }

    const fallbackBlock = buildFallbackBlock(rawTopic, domain);
    await FirestoreKnowledgeCache.saveCachedLesson(rawTopic, fallbackBlock, domain);
    return fallbackBlock;
  }

  public static async generateTextbookQuiz(params: {
    topic: string;
    domain?: string;
    theoryContent?: string;
    difficulty?: 'junior' | 'middle' | 'senior' | 'staff' | 'adaptive';
    count?: number;
  }): Promise<{
    topic: string;
    difficulty: string;
    questions: Array<{
      id: string;
      question: string;
      scenario?: string;
      options: string[];
      correctIndex: number;
      explanation: string;
      gapRemediationTip: string;
    }>;
  }> {
    const topic = (params.topic || 'Фундаментальные основы').trim();
    const domain = params.domain || 'Инженерия & Системы';
    const difficulty = params.difficulty || 'middle';
    const count = Math.min(6, Math.max(2, params.count || 3));

    const systemInstruction = `Ты — ведущий университетский экзаменатор и эксперт предметной области по направлению «${domain}».
Твоя задача — составить проверочный интерактивный тест из ${count} вопросов строго по существу темы: «${topic}».

Требования:
1. Вопросы должны проверять глубокое понимание темы «${topic}» (термины, архитектурные свойства, ключевые компромиссы, расчеты, типовые ошибки, поведение в пограничных условиях).
2. Категорически ЗАПРЕЩЕНЫ общие абстрактные вопросы о конспектах, чтении книг или "что главное в учебе".
3. Уровень сложности строго "${difficulty}":
   - "junior": фундаментальные определения темы, базовые структуры, частые ошибки новичков.
   - "middle": архитектурные и прикладные компромиссы темы, тонкости работы механизмов, выбор решения в реальной задаче.
   - "senior": пограничные случаи, аварийные состояния, оптимизация, неявные эффекты при масштабировании.
   - "staff": системные компромиссы, системные сбои и отказоустойчивость.
4. В каждом вопросе обязательно добавь поле "scenario" с реальной задачей или контекстом применения.
5. Вариантов ответа должно быть ровно 4. Ровно один правильный (укажи число correctIndex от 0 до 3).
6. В "explanation" дай глубокий, понятный разбор правильного ответа.
7. В "gapRemediationTip" дай конкретный совет, на что обратить внимание при ошибке.
8. Ответ возвращай строго в формате JSON:
{
  "questions": [
    {
      "id": "quiz-1",
      "question": "Формулировка содержательного вопроса строго по теме «${topic}»",
      "scenario": "Контекст или прикладная ситуация",
      "options": [
        "Вариант 1",
        "Вариант 2",
        "Вариант 3",
        "Вариант 4"
      ],
      "correctIndex": 0,
      "explanation": "Подробный разбор правильного ответа",
      "gapRemediationTip": "Практический совет при ошибке"
    }
  ]
}`;

    try {
      const prompt = `Составь интерактивный проверочный тест по теме «${topic}» (${domain}).
Уровень сложности: ${difficulty}. Количество вопросов: ${count}.
${params.theoryContent ? `\nМатериал главы учебника:\n${params.theoryContent.slice(0, 3000)}` : ''}`;

      const aiResponse = await callGeminiSafeJson(prompt, {
        systemInstruction,
        temperature: 0.3,
        models: ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'],
        skipCache: false,
        agentName: 'AI-TextbookQuizGenerator',
        taskGoal: `Generate textbook quiz for: ${topic}`,
        domain,
        enableCleanMemory: true,
      });

      if (aiResponse && Array.isArray(aiResponse.questions) && aiResponse.questions.length > 0) {
        return {
          topic,
          difficulty,
          questions: normalizeQuizList(aiResponse.questions, topic, domain)
        };
      }
    } catch (err: any) {
      console.warn('[TextbookDistiller] generateTextbookQuiz error:', err?.message || err);
    }

    return {
      topic,
      difficulty,
      questions: buildTopicSpecificQuiz(topic, domain, count)
    };
  }
}
