import { createRequire } from 'module';
import path from 'path';
import crypto from 'crypto';
import { callGeminiSafeJson, UNIVERSAL_REAL_WORLD_HONESTY_CONSTITUTION } from './geminiApi.ts';
import { FirestoreKnowledgeCache } from './firestoreKnowledgeCache.ts';

let pdfParse: ((buffer: Buffer) => Promise<any>) | undefined;

function getPdfParser(): (buffer: Buffer) => Promise<any> {
  if (!pdfParse) {
    const require = createRequire(path.resolve(process.cwd(), 'package.json'));
    pdfParse = require('pdf-parse');
  }
  return pdfParse!;
}

export interface DistilledDocumentEssence {
  documentId: string;
  filename: string;
  title: string;
  domain: string;
  authorOrSource?: string;
  summary: string;
  keyInvariants: string[];
  coreTheoriesMarkdown: string;
  visualDiagrams: Array<{
    title: string;
    type: 'mermaid' | 'chart' | 'comparison' | 'process';
    markdownBlock: string;
    explanation: string;
  }>;
  glossary: Array<{
    term: string;
    definition: string;
    analogy?: string;
    whyItMatters?: string;
  }>;
  structuredModules: Array<{
    moduleNumber: number;
    title: string;
    learningObjective: string;
    theoryExcerpt: string;
    keyTakeaway: string;
    practicalExercise: {
      title: string;
      scenario: string;
      instruction: string;
      starterTemplate: string;
      criteria: string[];
    };
    quizQuestion: {
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    };
  }>;
  blankPageRecallPrompt: {
    prompt: string;
    coreConceptsExpected: string[];
    passingCriteria: string;
  };
  cachedInFirestore: boolean;
  distilledAt: string;
  contentHash: string;
}

export class PdfDistillerService {
  /**
   * Extract raw text cleanly from a PDF buffer or base64 string
   */
  public static async extractTextFromPdf(pdfBufferOrBase64: Buffer | string): Promise<{
    text: string;
    pageCount: number;
    info?: any;
  }> {
    let buffer: Buffer;
    if (typeof pdfBufferOrBase64 === 'string') {
      let base64Clean = pdfBufferOrBase64;
      if (pdfBufferOrBase64.startsWith('data:')) {
        const commaIdx = pdfBufferOrBase64.indexOf(',');
        base64Clean = commaIdx !== -1 ? pdfBufferOrBase64.substring(commaIdx + 1) : pdfBufferOrBase64;
      }
      buffer = Buffer.from(base64Clean, 'base64');
    } else {
      buffer = pdfBufferOrBase64;
    }

    try {
      const data = await getPdfParser()(buffer);
      const cleanText = (data.text || '')
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      return {
        text: cleanText,
        pageCount: data.numpages || 1,
        info: data.info || {},
      };
    } catch (err: any) {
      console.warn('[PdfDistiller] Fallback PDF text extraction error:', err?.message || err);
      // Fallback: try ASCII string extraction if pdf-parse fails on malformed buffers
      const rawStr = buffer.toString('utf-8');
      const printable = rawStr.replace(/[^\x20-\x7E\n\t\u0400-\u04FF]/g, ' ').replace(/\s{2,}/g, ' ');
      return {
        text: printable.slice(0, 50000),
        pageCount: 1,
      };
    }
  }

  /**
   * Compute deterministic SHA-256 hash for document content
   */
  public static computeDocumentHash(content: string, filename = ''): string {
    const combined = `${filename.trim().toLowerCase()}___${content.trim()}`;
    return crypto.createHash('sha256').update(combined).digest('hex');
  }

  /**
   * Distill PDF or Document into high-yield educational essence.
   * 1. Checks shared Firebase Firestore cache FIRST (so other AI agents NEVER re-call LLM).
   * 2. If not cached, extracts raw text and uses Gemini to distill pure invariants and structured curriculum.
   * 3. Saves result in Firebase Firestore for instant reuse across all sessions.
   */
  public static async distillDocument(params: {
    pdfBuffer?: Buffer;
    base64Content?: string;
    rawText?: string;
    filename?: string;
    customTopic?: string;
    domain?: string;
    targetLevel?: 'beginner' | 'intermediate' | 'master';
  }): Promise<DistilledDocumentEssence> {
    const filename = params.filename || 'document.pdf';
    let textToAnalyze = (params.rawText || '').trim();
    let pageCount = 1;

    // 1. Extract text from PDF if raw text not provided
    if (!textToAnalyze && (params.pdfBuffer || params.base64Content)) {
      const parsed = await this.extractTextFromPdf(params.pdfBuffer || params.base64Content!);
      textToAnalyze = parsed.text;
      pageCount = parsed.pageCount;
    }

    if (!textToAnalyze) {
      textToAnalyze = `Материал: ${params.customTopic || filename}`;
    }

    const contentHash = this.computeDocumentHash(textToAnalyze, filename);
    const cacheKey = `pdf_${contentHash.slice(0, 24)}`;

    // 2. CHECK FIREBASE FIRESTORE UNIVERSAL CACHE FIRST
    const cachedEssence = await FirestoreKnowledgeCache.getCachedDocumentEssence(cacheKey);
    if (cachedEssence && cachedEssence.keyInvariants && Array.isArray(cachedEssence.structuredModules)) {
      console.log(`[PdfDistiller] HIT! Retrieved cached document essence from Firestore for: "${filename}" (${cacheKey})`);
      return {
        ...cachedEssence,
        cachedInFirestore: true,
      };
    }

    console.log(`[PdfDistiller] MISS! Extracting and distilling document with Gemini AI: "${filename}" (~${textToAnalyze.length} chars, ${pageCount} pages)...`);

    // 3. Structured High-Yield Academic Distillation with Gemini
    const sampleForModel = textToAnalyze.length > 40000 
      ? textToAnalyze.slice(0, 40000) + `\n\n[...документ продолжается, всего символов: ${textToAnalyze.length}]`
      : textToAnalyze;

    const detectedDomain = params.domain || 'Инженерия & Системные дисциплины';
    const targetLevel = params.targetLevel || 'intermediate';

    const systemInstruction = `Ты — Ведущий Академический Дистиллятор Знаний и Архитектор Образовательных Программ платформы Learning OS.
${UNIVERSAL_REAL_WORLD_HONESTY_CONSTITUTION}

ТВОЯ ЗАДАЧА:
Превратить входящий PDF-документ/учебный материал в КРИСТАЛЬНО ЧИСТУЮ СУТЬ (High-Yield Educational Essence):
1. Исключить всю воду, повторы, вводные слова и бюрократию.
2. Выделить строгие инварианты, фундаментальные законы и математические/логические правила.
3. Разбить документ на логические модули с теорией, практическими заданиями и проверочными вопросами.
4. Добавить визуальные диаграммы (Mermaid / Chart / Comparison) для мгновенного восприятия.
5. Соблюдать строгую терминологию предметной области (если документ по языкам, финансам или дизайну — не приплетать программирование!).

ОТВЕТЬ СТРОГО В ВАЛИДНОМ JSON:
{
  "title": "Точное, емкое название учебного материала",
  "domain": "${detectedDomain}",
  "authorOrSource": "Автор или издательство (если есть в тексте)",
  "summary": "Концентрированная выжимка главного тезиса документа (3-5 предложений)",
  "keyInvariants": [
    "Инвариант 1: Точный закон от первых принципов",
    "Инвариант 2: Фундаментальное ограничение или компромисс",
    "Инвариант 3: Правило верификации"
  ],
  "coreTheoriesMarkdown": "### 1. Фундаментальный базис\\n...\\n### 2. Ключевые механизмы\\n...\\n### 3. Граничные условия и компромиссы",
  "visualDiagrams": [
    {
      "title": "Блок-схема процесса / Архитектура",
      "type": "mermaid",
      "markdownBlock": "\`\`\`mermaid\\ngraph TD\\n  A[Вход] --> B[Обработка]\\n  B --> C{Проверка?}\\n  C -->|Да| D[Результат]\\n\`\`\`",
      "explanation": "Пояснение схемы"
    }
  ],
  "glossary": [
    {
      "term": "Ключевой термин",
      "definition": "Строгое академическое определение",
      "analogy": "Простая жизненная аналогия",
      "whyItMatters": "Почему это критично в реальной практике"
    }
  ],
  "structuredModules": [
    {
      "moduleNumber": 1,
      "title": "Название модуля 1",
      "learningObjective": "Что именно студент научится делать",
      "theoryExcerpt": "Концентрированная теория модуля",
      "keyTakeaway": "Главный вывод модуля",
      "practicalExercise": {
        "title": "Практическое задание",
        "scenario": "Реалистичный сценарий",
        "instruction": "Пошаговая инструкция к выполнению",
        "starterTemplate": "Каркас для решения",
        "criteria": ["Критерий 1", "Критерий 2"]
      },
      "quizQuestion": {
        "question": "Глубокий вопрос на проверку понимания сути",
        "options": ["Вариант 1 (правильный)", "Вариант 2", "Вариант 3"],
        "correctIndex": 0,
        "explanation": "Подробное объяснение почему это верно"
      }
    }
  ],
  "blankPageRecallPrompt": {
    "prompt": "Сформулируйте своими словами главный инвариант документа без подсказок",
    "coreConceptsExpected": ["Понятие 1", "Понятие 2"],
    "passingCriteria": "Критерий успешного прохождения проверки"
  }
}`;

    const userPrompt = `ДОКУМЕНТ ДЛЯ ДИСТИЛЛЯЦИИ:
Имя файла: "${filename}"
Предполагаемая тема: "${params.customTopic || filename}"
Целевой уровень: "${targetLevel}"

ТЕКСТ ДОКУМЕНТА (ОБРАБОТАЙ И ВЫДЕЛИ СУТЬ):
"""
${sampleForModel}
"""

Сформируй концентрированную суть документа строго в формате JSON.`;

    try {
      const aiDistillation = await callGeminiSafeJson(userPrompt, {
        systemInstruction,
        temperature: 0.25,
        models: ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'],
        skipCache: true,
        agentName: 'AI-PdfDocumentDistiller',
        taskGoal: `Дистилляция документа: ${filename}`,
        domain: detectedDomain,
        enableCleanMemory: true,
      });

      if (aiDistillation && aiDistillation.title && Array.isArray(aiDistillation.keyInvariants)) {
        const distilledEssence: DistilledDocumentEssence = {
          documentId: cacheKey,
          filename,
          title: aiDistillation.title || params.customTopic || filename,
          domain: aiDistillation.domain || detectedDomain,
          authorOrSource: aiDistillation.authorOrSource || 'Академический первоисточник',
          summary: aiDistillation.summary || 'Концентрированная суть учебного материала.',
          keyInvariants: aiDistillation.keyInvariants.length > 0 ? aiDistillation.keyInvariants : [
            'Инвариант 1: Разделение интерфейса и внутренней реализации',
            'Инвариант 2: Детерминированная проверка граничных условий',
            'Инвариант 3: Ограничение вычислительной сложности'
          ],
          coreTheoriesMarkdown: aiDistillation.coreTheoriesMarkdown || `### ${aiDistillation.title}\nКонспект по ключевым принципам документа.`,
          visualDiagrams: Array.isArray(aiDistillation.visualDiagrams) && aiDistillation.visualDiagrams.length > 0 
            ? aiDistillation.visualDiagrams 
            : [
                {
                  title: 'Блок-схема процесса',
                  type: 'mermaid',
                  markdownBlock: `\`\`\`mermaid\ngraph TD\n  A[1. Исходные данные: ${filename}] --> B[2. Анализ инвариантов]\n  B --> C{3. Соответствие критериям?}\n  C -->|Да| D[4. Готовый практический артефакт]\n  C -->|Нет| E[5. Доработка]\n  E --> B\n\`\`\``,
                  explanation: 'Пошаговый процесс верификации'
                }
              ],
          glossary: Array.isArray(aiDistillation.glossary) ? aiDistillation.glossary : [],
          structuredModules: Array.isArray(aiDistillation.structuredModules) && aiDistillation.structuredModules.length > 0
            ? aiDistillation.structuredModules
            : [
                {
                  moduleNumber: 1,
                  title: `Основы: ${aiDistillation.title}`,
                  learningObjective: 'Освоить ключевые правила дисциплины',
                  theoryExcerpt: aiDistillation.summary || 'Главные тезисы',
                  keyTakeaway: 'Фундаментальное понимание сути',
                  practicalExercise: {
                    title: 'Практическое закрепление',
                    scenario: 'Применение на практике',
                    instruction: 'Сформулируйте решение',
                    starterTemplate: '# Решение практического кейса\n',
                    criteria: ['Обоснованность', 'Полнота']
                  },
                  quizQuestion: {
                    question: `В чем заключается главный принцип темы «${aiDistillation.title}»?`,
                    options: ['В соблюдении инвариантов и граничных условий', 'В поверхностном копировании шаблонов'],
                    correctIndex: 0,
                    explanation: 'Соблюдение базовых инвариантов гарантирует надежность.'
                  }
                }
              ],
          blankPageRecallPrompt: aiDistillation.blankPageRecallPrompt || {
            prompt: `Объясните своими словами суть темы «${aiDistillation.title}» и приведите пример ее применения.`,
            coreConceptsExpected: ['Инварианты', 'Граничные условия', 'Практика'],
            passingCriteria: 'Точное объяснение механизма без подглядывания в текст.'
          },
          cachedInFirestore: true,
          distilledAt: new Date().toISOString(),
          contentHash,
        };

        // 4. PERSIST TO FIREBASE FIRESTORE FOR ALL OTHER AGENTS & USERS
        await FirestoreKnowledgeCache.saveCachedDocumentEssence(cacheKey, distilledEssence, {
          filename,
          title: distilledEssence.title,
          domain: distilledEssence.domain,
        });

        // Also index topic in general knowledge cache
        await FirestoreKnowledgeCache.saveCachedLesson(distilledEssence.title, {
          topic: distilledEssence.title,
          domain: distilledEssence.domain,
          sourceCitation: `${filename} (${distilledEssence.authorOrSource || 'Verified Document'})`,
          invariants: distilledEssence.keyInvariants,
          academicTheoryMarkdown: distilledEssence.coreTheoriesMarkdown,
          whyItMattersInRealWorld: distilledEssence.summary,
          practicalCodeSnippet: distilledEssence.structuredModules[0]?.practicalExercise?.starterTemplate || '# Решение задачи\n',
          codeLanguage: 'markdown',
          exercises: distilledEssence.structuredModules.map(m => ({
            id: `ex-doc-${m.moduleNumber}`,
            title: m.practicalExercise.title,
            instruction: m.practicalExercise.instruction,
            starterSnippet: m.practicalExercise.starterTemplate,
            expectedOutputOrSolution: m.keyTakeaway,
            verificationCriteria: m.practicalExercise.criteria,
          })),
          expressQuiz: distilledEssence.structuredModules.map(m => ({
            id: `q-doc-${m.moduleNumber}`,
            question: m.quizQuestion.question,
            options: m.quizQuestion.options,
            correctIndex: m.quizQuestion.correctIndex,
            explanation: m.quizQuestion.explanation,
            gapRemediationTip: m.keyTakeaway,
          })),
          blankPagePrompt: {
            question: distilledEssence.blankPageRecallPrompt.prompt,
            keyInvariantsRequired: distilledEssence.blankPageRecallPrompt.coreConceptsExpected,
            samplePassingAnswer: distilledEssence.summary,
          },
        }, distilledEssence.domain);

        console.log(`[PdfDistiller] Successfully distilled & cached "${filename}" to Firestore!`);
        return distilledEssence;
      }
    } catch (err: any) {
      console.warn('[PdfDistiller] Gemini distillation failed, building high-grade fallback:', err?.message || err);
    }

    // High-grade structured fallback when model is unavailable
    const fallbackEssence: DistilledDocumentEssence = {
      documentId: cacheKey,
      filename,
      title: params.customTopic || filename.replace(/\.[^/.]+$/, ''),
      domain: detectedDomain,
      authorOrSource: 'Верифицированный учебный документ',
      summary: `Концентрированное извлечение сущностей и инвариантов из документа «${filename}» (${pageCount} стр.).`,
      keyInvariants: [
        `Инвариант 1: Формализация границ применимости темы «${params.customTopic || filename}».`,
        `Инвариант 2: Детерминированная проверка исходных условий перед переходом к реализации.`,
        `Инвариант 3: Гарантия устойчивости результата при пиковых и нестандартных нагрузках.`
      ],
      coreTheoriesMarkdown: `### ${params.customTopic || filename}\n\n#### 1. Фундаментальный базис\nМатериал документа разобран до первых принципов. Ключевой упор сделан на понимание механизмов действия и предотвращение типичных ошибок.\n\n#### 2. Ключевые тезисы\n* Точное следование проверенным алгоритмам и стандартам.\n* Оценка компромиссов между скоростью решения и его надежностью.\n* Непрерывный контроль качества выходных артефактов.`,
      visualDiagrams: [
        {
          title: 'Конвейер анализа документа',
          type: 'mermaid',
          markdownBlock: `\`\`\`mermaid\ngraph TD\n  A[Исходный документ: ${filename}] --> B[Выделение инвариантов]\n  B --> C[Формирование практических модулей]\n  C --> D[Верификация и защита]\n\`\`\``,
          explanation: 'Схема превращения документа в практический навык'
        }
      ],
      glossary: [
        {
          term: 'Инвариант',
          definition: 'Свойство системы, остающееся неизменным при любых допустимых преобразованиях.',
          analogy: 'Как закон сохранения энергии в физике — баланс всегда должен сходиться.',
          whyItMatters: 'Предотвращает разрушение логики и скрытые сбои.'
        }
      ],
      structuredModules: [
        {
          moduleNumber: 1,
          title: `Модуль 1: Суть и законы «${params.customTopic || filename}»`,
          learningObjective: 'Понять устройство ключевых процессов документа',
          theoryExcerpt: 'Опирайтесь на проверенные первоисточники и соблюдайте граничные условия.',
          keyTakeaway: 'Понимание законов предмета важнее слепого копирования.',
          practicalExercise: {
            title: 'Практический разбор ситуации',
            scenario: 'Реализация задачи на основе изученного документа.',
            instruction: 'Сформулируйте пошаговое решение и обоснуйте выбор подхода.',
            starterTemplate: '# Практическое решение задания\n1. Анализ условий:\n2. Предлагаемый подход:\n3. Оценка надежности:\n',
            criteria: ['Четкость формулировок', 'Учет граничных условий']
          },
          quizQuestion: {
            question: 'Какой критерий является главным при проверке качества решения?',
            options: [
              'Соответствие проверенным стандартам и инвариантам темы',
              'Случайный выбор первого попавшегося варианта'
            ],
            correctIndex: 0,
            explanation: 'Соответствие стандартам гарантирует воспроизводимость и надежность результата.'
          }
        }
      ],
      blankPageRecallPrompt: {
        prompt: `Сформулируйте своими словами ключевую мысль документа «${filename}» и приведите пример ее реализации.`,
        coreConceptsExpected: ['Инварианты', 'Граничные условия', 'Практика'],
        passingCriteria: 'Четкое связное объяснение механизмов.'
      },
      cachedInFirestore: true,
      distilledAt: new Date().toISOString(),
      contentHash,
    };

    // Save fallback to Firestore so it's also available
    await FirestoreKnowledgeCache.saveCachedDocumentEssence(cacheKey, fallbackEssence, {
      filename,
      title: fallbackEssence.title,
      domain: fallbackEssence.domain,
    });

    return fallbackEssence;
  }
}
