import React, { useState } from 'react';
import { 
  Award, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Code2, 
  FileText, 
  AlertTriangle, 
  Upload, 
  Play, 
  Check, 
  CheckSquare, 
  ArrowRight, 
  Star, 
  ShieldCheck, 
  Flame, 
  Copy 
} from 'lucide-react';
import { Capstone10Project, UserArtifact } from '../../types.ts';
import { playChime } from '../../utils/audio.ts';

interface Capstone10ProjectPanelProps {
  capstone?: Capstone10Project;
  blockNumber: number;
  precedingTopics?: string[];
  onSaveArtifact: (artifact: UserArtifact) => void;
  onAdvanceNext?: () => void;
}

export const Capstone10ProjectPanel: React.FC<Capstone10ProjectPanelProps> = ({
  capstone,
  blockNumber,
  precedingTopics = [],
  onSaveArtifact,
  onAdvanceNext,
}) => {
  const milestone = Math.max(10, Math.floor(blockNumber / 10) * 10);
  const isExactMilestone = blockNumber > 0 && blockNumber % 10 === 0;

  // Synthesized default fallback capstone if not provided
  const activeCapstone: Capstone10Project = capstone || {
    id: `capstone-${milestone}`,
    title: `БОЛЬШОЙ ПРОЕКТ СИНТЕЗА: Практический контур (${milestone} блоков)`,
    milestoneNumber: milestone,
    coveredTopics: precedingTopics.length >= 5 ? precedingTopics.slice(0, 10) : [
      'Деконструкция навыка и первые принципы',
      'Системные законы и инварианты',
      'Анализ компромиссов и краевых условий',
      'Методы верификации и контроль качества',
      'Оптимизация ключевых показателей',
      'Защита от типичных сбоев и ошибок',
      'Интеграция взаимосвязанных компонентов',
      'Устранение скрытых ограничений',
      'Аудит надежности и соответствие стандартам',
      'Комплексный синтез и практическая защита',
    ],
    role: 'Ведущий специалист & Эксперт-практик',
    businessScenario: `Финальный майлстоун: комплексное применение всех изученных за предшествующие 10 блоков концепций в одном масштабном кейсе для подтверждения мастерства.`,
    architecturalChallenge: `Собрать и защитить законченный практический артефакт, демонстрирующий глубокое владение стандартами дисциплины.`,
    checklist: [
      'Этап 1: Структурирование вводных данных и целей проекта',
      'Этап 2: Практическая реализация решения с учетом краевых условий',
      'Этап 3: Проверка качества и обоснование надежности',
      'Этап 4: Подготовка артефакта и защита решения в портфолио',
    ],
    requirements: [
      'Корректность при любых граничных условиях',
      'Обоснование решений по академическим первоисточникам',
      'Полная готовность артефакта к экспертному аудиту',
    ],
    starterCode: `# БОЛЬШОЙ ПРОЕКТ СИНТЕЗА (МАЙЛСТОУН ${milestone} БЛОКОВ)
# Роль: Ведущий специалист

## 1. Паспорт проекта и ключевые цели
[Опишите цели, метрики и контекст задачи]

## 2. Структура практического решения
[Детализируйте компоненты решения и взаимосвязи]

## 3. Обоснование выбора и оценка рисков
[Обоснуйте принятые решения и компромиссы]

## 4. Верификация результатов
[Критерии качества и подтверждение надежности]
`,
    defaultFilename: `capstone_project_${milestone}.md`,
    estimatedTimeMin: 90,
  };

  const [code, setCode] = useState(activeCapstone.starterCode);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<{
    score: number;
    passed: boolean;
    evaluationStatus?: 'verified' | 'unavailable';
    verdict: string;
    highlights: string[];
    vulnerabilities?: string[];
    productionAdvice?: string;
    rubricBreakdown?: {
      synthesisCoverage: number;
      architecturalRobustness: number;
      practicalFeasibility: number;
      artifactCompleteness: number;
    };
  } | null>(null);

  const handleAudit = async () => {
    setIsAuditing(true);
    playChime('click');

    try {
      const res = await fetch('/api/gemini/evaluate-capstone-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: activeCapstone.title,
          milestoneNumber: milestone,
          coveredTopics: activeCapstone.coveredTopics,
          role: activeCapstone.role,
          businessScenario: activeCapstone.businessScenario,
          requirements: activeCapstone.requirements,
          checklist: activeCapstone.checklist,
          studentSubmission: code,
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.evaluationStatus === 'unavailable') throw new Error('Evaluation provider unavailable');
        const passed = data.passed === true && data.score >= 70;
        setAuditResult({ ...data, passed, evaluationStatus: 'verified' });

        if (passed) {
          playChime('success');
          onSaveArtifact({
            id: `capstone-${milestone}-${Date.now()}`,
            unitId: `milestone-${milestone}`,
            unitTitle: `🏆 Большой проект синтеза (${milestone} блоков)`,
            filename: activeCapstone.defaultFilename,
            fileContent: code,
            fileFormat: 'ts',
            score: data.score,
            passed,
            strongPoints: data.highlights || [
              'Комплексный синтез 10 предшествующих тем курса',
              'Высокая надежность и строгая изоляция состояний',
            ],
            vulnerabilities: data.vulnerabilities || [],
            productionAdvice: data.productionAdvice || 'Решение утверждено как эталонный образец в публичное портфолио.',
            submittedAt: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          });
        } else {
          playChime('alert');
        }
      } else {
        throw new Error('Server returned non-200');
      }
    } catch (err) {
      console.warn('Capstone evaluation unavailable:', err);
      setAuditResult({
        score: 0,
        passed: false,
        evaluationStatus: 'unavailable',
        verdict: 'Проект пока не оценен. Проверка недоступна; работа не засчитана.',
        highlights: [],
        vulnerabilities: ['Повторите проверку, когда сервис снова станет доступен.'],
        productionAdvice: 'Ваш текст сохранен в редакторе и не был добавлен в портфолио.',
      });
      playChime('alert');
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Milestone Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-slate-950 shadow-lg space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-slate-950 text-amber-400 rounded-2xl shadow-sm">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-slate-900 bg-amber-400/80 px-2.5 py-0.5 rounded-full border border-amber-300">
                Каждые 10 блоков · Майлстоун {milestone}
              </span>
              <h2 className="text-lg font-black text-slate-950 mt-1">
                {activeCapstone.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950/15 backdrop-blur-xs px-3 py-1.5 rounded-2xl border border-slate-950/20 text-xs font-bold">
            <Star className="w-4 h-4 fill-slate-950 text-slate-950" />
            <span>Золотой артефакт портфолио (+250 XP)</span>
          </div>
        </div>

        {/* Milestone Position Status */}
        <div className="text-xs text-slate-900 font-medium leading-relaxed bg-white/20 backdrop-blur-xs p-3 rounded-2xl border border-white/30">
          {isExactMilestone ? (
            <span>
              🎯 <strong>Поздравляем! Вы завершили блок #{blockNumber}</strong>. Вы подошли к контрольному майлстоуну курса: этот Большой проект объединяет все изученные знания за последние 10 блоков в единую практическую систему.
            </span>
          ) : (
            <span>
              🧭 <strong>Текущий прогресс: Блок #{blockNumber}</strong> (Майлстоун {milestone} блоков). Вы можете запустить этот комплексный проект прямо сейчас для проверки сквозных навыков или вернуться к нему на 10-м блоке!
            </span>
          )}
        </div>
      </div>

      {/* 10 Covered Topics Synthesis Matrix */}
      <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Сквозной синтез: 10 изученных тем курса
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400 font-semibold">
            {activeCapstone.coveredTopics.length} тем объединены
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {activeCapstone.coveredTopics.map((topic, idx) => (
            <div 
              key={idx} 
              className="flex items-center space-x-2 p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700"
            >
              <span className="w-5 h-5 rounded-lg bg-amber-100 text-amber-900 text-[10px] font-bold flex items-center justify-center font-mono shrink-0">
                {idx + 1}
              </span>
              <span className="truncate font-medium">{topic}</span>
              <Check className="w-3.5 h-3.5 text-emerald-600 ml-auto shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Production Incident Scenario */}
      <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950 text-white shadow-md space-y-3">
        <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Глобальный инцидент продакшена (Синтез-сценарий)</span>
        </div>
        <p className="text-xs leading-relaxed text-slate-200 font-sans">
          {activeCapstone.businessScenario}
        </p>

        <div className="pt-2 border-t border-slate-800 text-xs space-y-1">
          <span className="font-bold text-amber-300 text-[11px] uppercase tracking-wider block">
            Ваша задача как {activeCapstone.role}:
          </span>
          <p className="text-slate-300">{activeCapstone.architecturalChallenge}</p>
        </div>
      </div>

      {/* Multi-stage Checklist */}
      <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-4 h-4 text-amber-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Поэтапный архитектурный план синтеза:
            </h4>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {completedSteps.length} из {activeCapstone.checklist.length} этапов выполнено
          </span>
        </div>

        <div className="space-y-2">
          {activeCapstone.checklist.map((step, idx) => {
            const isDone = completedSteps.includes(idx);
            return (
              <div
                key={idx}
                onClick={() => {
                  setCompletedSteps(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
                  playChime('click');
                }}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition select-none flex items-start space-x-3 ${
                  isDone 
                    ? 'bg-emerald-50 text-emerald-950 border-emerald-300' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => {}}
                  className="mt-0.5 rounded text-amber-600 cursor-pointer"
                />
                <span className={`leading-relaxed ${isDone ? 'line-through opacity-75' : ''}`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* IDE Code Scaffolding */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-md">
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Code2 className="w-4 h-4 text-amber-400" />
            <span className="font-mono font-bold text-slate-200">{activeCapstone.defaultFilename}</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => {
                setCode(`# БОЛЬШОЙ ПРОЕКТ СИНТЕЗА (МАЙЛСТОУН ${milestone} БЛОКОВ)
# Роль: ${activeCapstone.role}

## 1. Паспорт проекта и ключевые цели
- Целевой продукт: Отказоустойчивый контур обработки транзакций и событий с декомпозицией на независимые микросервисы.
- Ключевые метрики (SLO): 99.99% uptime, p99 latency < 20ms при пике 10 000 rps, 0% потерь данных при отказе узла.
- Принцип Парето (20/80): 20% критических путей ядра обеспечивают 80% надежности всей системы.

## 2. Структура практического решения и архитектурный синтез
1. Входной шлюз (API Gateway): валидация контрактов, декомпозиция комплексного потока на атомарные шаги по первым принципам.
2. Ядро бизнес-инвариантов: строгая изоляция изменяемого состояния, идемпотентность через распределенные токены ключей.
3. Механизм распределенного консенсуса: двухфазная фиксация (2PC) для критических транзакций и асинхронные очереди (Outbox Pattern) для фоновых событий.
4. Отказоустойчивость: автоматический Circuit Breaker, Exponential Backoff с джиттером и репликация без единой точки отказа.

## 3. Обоснование выбора и анализ компромиссов (Trade-offs)
- Компромисс CAP: Выбрана строгая согласованность (CP) для финансового контура за счет 5% задержки при разделении сети.
- Краевые условия: обработка дубликатов сетевых пакетов, защита от гонок данных через optimistic locking с версионированием записей.
- Защита от сбоев: Fallback-стратегии при деградации внешних провайдеров и изолированные пулы потоков (Bulkhead).

## 4. Верификация результатов и критерии качества
- Контроль надежности: 140 юнит- и интеграционных тестов инвариантов, стресс-тестирование с хаотическим отключением подов (Chaos Engineering).
- Метрики и аудит: Распределенная трассировка OpenTelemetry, мониторинг очередей в Grafana/Prometheus.
- Готовность: Артефакт верифицирован, соответствует золотым стандартам Staff-инженерии и готов к публикации в портфолио.`);
                playChime('click');
              }}
              className="flex items-center space-x-1 text-amber-400 hover:text-amber-300 transition cursor-pointer text-[11px] font-medium"
              title="Заполнить образцовый 10-блочный синтез"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Вставить эталонный образец</span>
            </button>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(code);
                playChime('click');
              }}
              className="flex items-center space-x-1 text-slate-400 hover:text-white transition cursor-pointer text-[11px]"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Копировать</span>
            </button>
          </div>
        </div>

        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={14}
          className="w-full p-4 bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed focus:outline-none select-text resize-y"
        />
      </div>

      {/* Audit Result Banner (Real Rubric & Feedback) */}
      {auditResult && (
        <div className={`p-6 rounded-2xl border-2 space-y-4 animate-fade-in ${
          auditResult.passed
            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-sm'
            : 'bg-rose-50/90 border-rose-300 text-rose-950 shadow-sm'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3.5">
              <span className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shadow-xs ${
                auditResult.passed
                  ? 'bg-emerald-200 text-emerald-950 border border-emerald-300'
                  : 'bg-rose-200 text-rose-950 border border-rose-300'
              }`}>
                {auditResult.evaluationStatus === 'unavailable' ? '—' : `${auditResult.score}%`}
              </span>
              <div>
                <h4 className="font-extrabold text-base tracking-tight">
                  {auditResult.passed ? '✓ Большой проект синтеза успешно защищен!' : auditResult.evaluationStatus === 'unavailable' ? 'Проект не оценен' : '⚠ Проект требует доработки разделов'}
                </h4>
                <p className={`text-xs mt-0.5 font-medium ${auditResult.passed ? 'text-emerald-800' : 'text-rose-800'}`}>
                  {auditResult.verdict}
                </p>
              </div>
            </div>

            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs ${
              auditResult.passed
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 text-white'
            }`}>
              {auditResult.passed ? '★ Золотой артефакт в портфолио' : auditResult.evaluationStatus === 'unavailable' ? 'Не проверено' : 'Требуется ≥ 70%'}
            </span>
          </div>

          {/* Rubric Breakdown Progress Bars */}
          {auditResult.rubricBreakdown && (
            <div className="p-4 rounded-xl bg-white/80 border border-slate-200 space-y-3 text-xs">
              <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                Критерии рубежной экспертизы ИИ:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-700">
                    <span>Синтез 10 предшествующих тем курса:</span>
                    <span className="font-bold font-mono">{auditResult.rubricBreakdown.synthesisCoverage} / 30</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${auditResult.rubricBreakdown.synthesisCoverage >= 21 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${(auditResult.rubricBreakdown.synthesisCoverage / 30) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-slate-700">
                    <span>Архитектурная надежность и инварианты:</span>
                    <span className="font-bold font-mono">{auditResult.rubricBreakdown.architecturalRobustness} / 30</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${auditResult.rubricBreakdown.architecturalRobustness >= 21 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${(auditResult.rubricBreakdown.architecturalRobustness / 30) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-slate-700">
                    <span>Практическая реализуемость & компромиссы:</span>
                    <span className="font-bold font-mono">{auditResult.rubricBreakdown.practicalFeasibility} / 25</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${auditResult.rubricBreakdown.practicalFeasibility >= 18 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${(auditResult.rubricBreakdown.practicalFeasibility / 25) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-slate-700">
                    <span>Полнота проработки артефакта & верификация:</span>
                    <span className="font-bold font-mono">{auditResult.rubricBreakdown.artifactCompleteness} / 15</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${auditResult.rubricBreakdown.artifactCompleteness >= 11 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${(auditResult.rubricBreakdown.artifactCompleteness / 15) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Highlights */}
          {auditResult.highlights && auditResult.highlights.length > 0 && (
            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700">Сильные стороны решения:</span>
              {auditResult.highlights.map((h, i) => (
                <div key={i} className="flex items-start space-x-2 text-slate-800">
                  <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          )}

          {/* Vulnerabilities / Missing Points */}
          {auditResult.vulnerabilities && auditResult.vulnerabilities.length > 0 && (
            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-[11px] uppercase tracking-wider text-rose-800">Зоны внимания и пробелы:</span>
              {auditResult.vulnerabilities.map((v, i) => (
                <div key={i} className="flex items-start space-x-2 text-rose-900">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 mt-0.5 shrink-0" />
                  <span>{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Production Advice */}
          {auditResult.productionAdvice && (
            <div className="p-3 rounded-xl bg-amber-100/60 border border-amber-200/80 text-xs text-amber-950 flex items-start space-x-2.5">
              <Star className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold">Рекомендация наставника: </span>
                <span>{auditResult.productionAdvice}</span>
              </div>
            </div>
          )}

          {/* Action buttons on passed */}
          {auditResult.passed && onAdvanceNext && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onAdvanceNext}
                className="px-5 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs shadow-sm flex items-center space-x-2 cursor-pointer transition"
              >
                <span>Перейти к следующему блоку курса</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Submission Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <span className="text-xs text-slate-500">
          При защите проекта ИИ оценивает целостность архитектуры и взаимосвязь всех 10 концепций.
        </span>

        <button
          type="button"
          onClick={handleAudit}
          disabled={isAuditing}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs shadow-md transition disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
        >
          {isAuditing ? (
            <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <ShieldCheck className="w-4 h-4 fill-slate-950 text-amber-500" />
          )}
          <span>{isAuditing ? 'Синтез-аудит решения...' : 'Защитить Большой проект синтеза (+250 XP)'}</span>
        </button>
      </div>
    </div>
  );
};
