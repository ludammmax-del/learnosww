import { TelemetrySignal, CognitiveTelemetryState, TargetedGapClosureBlock, LearningUnit, DAGNode } from '../types.ts';
import { epistemicLedgerService } from './epistemicLedgerService.ts';

type TelemetryListener = (state: CognitiveTelemetryState) => void;

class TelemetryEngine {
  private state: CognitiveTelemetryState = {
    dwellTimePerSection: {},
    sectionRereadCount: {},
    questionHesitations: {},
    activeConfidenceRating: 'confident',
    rageClickCount: 0,
    codeRunAttempts: 0,
    codeErrorHistory: [],
    explicitConfusionFlags: [],
    overallCognitiveLoad: 18,
    indecisionIndex: 12,
    signals: [],
    activeGapBlock: null,
    resolvedGaps: [],
    conceptHealth: {},
    topicTimeline: [],
    eventCounts: {},
    sessionMetrics: {
      sessionStartedAt: Date.now(),
      activeSeconds: 0,
      trackedActions: 0,
      distinctTopics: 0,
      completionCount: 0,
      recallAttempts: 0,
      recallAverage: 0,
      codeSuccessfulRuns: 0,
      codeFailedRuns: 0,
      lastActivityAt: Date.now(),
    },
    attentionDrift: {
      contextSwitches: 0,
      abandonedTopics: [],
      longestStuckTopic: undefined,
      avgSessionDepth: 0,
      lastTopicFocus: null,
    },
    aiContextSummary: '',
    aiContextSnapshot: {},
    coreResonancePercentage: 86,
    autoCrystallizedAxiomCount: 0,
    lastAutoCrystallizedTopic: null,
    telemetryDrivenCoreFillStatus: 'active',
    totalLearningPushes: 0,
  };

  private listeners: Set<TelemetryListener> = new Set();
  private lastClickTime: number = 0;
  private rapidClickCounter: number = 0;
  private crystallizedTopicsSet: Set<string> = new Set();
  private isReconciling: boolean = false;
  private syncTimeoutId: any = null;
  private sessionStartTime: number = Date.now();

  constructor() {
    // Initial welcome telemetry pulse
    this.recordSignal({
      type: 'hesitation',
      severity: 'low',
      details: 'Нейро-телеметрия активна. Отслеживание когнитивной нагрузки и темпа усвоения.',
      subtopic: 'Системный монитор',
    });
  }

  public getState(): CognitiveTelemetryState {
    return {
      ...this.state,
      dwellTimePerSection: { ...this.state.dwellTimePerSection },
      sectionRereadCount: { ...this.state.sectionRereadCount },
      questionHesitations: Object.fromEntries(Object.entries(this.state.questionHesitations).map(([key, value]) => [key, { ...value, flippedOptions: [...value.flippedOptions] }])),
      codeErrorHistory: [...this.state.codeErrorHistory],
      explicitConfusionFlags: [...this.state.explicitConfusionFlags],
      signals: this.state.signals.map((signal) => ({ ...signal, metadata: signal.metadata ? { ...signal.metadata } : undefined })),
      resolvedGaps: [...this.state.resolvedGaps],
      conceptHealth: Object.fromEntries(Object.entries(this.state.conceptHealth || {}).map(([key, value]) => [key, { ...value }])),
      topicTimeline: (this.state.topicTimeline || []).map((event) => ({ ...event })),
      eventCounts: { ...(this.state.eventCounts || {}) },
      sessionMetrics: this.state.sessionMetrics ? { ...this.state.sessionMetrics } : undefined,
      attentionDrift: this.state.attentionDrift ? { ...this.state.attentionDrift, abandonedTopics: [...this.state.attentionDrift.abandonedTopics] } : undefined,
      aiContextSnapshot: JSON.parse(JSON.stringify(this.state.aiContextSnapshot || {})),
    };
  }

  public subscribe(listener: TelemetryListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private buildAiContextSnapshot() {
    const conceptEntries = Object.entries(this.state.conceptHealth || {});
    const topConfusions = conceptEntries
      .filter(([, value]) => value.confusion >= 40)
      .sort((a, b) => b[1].confusion - a[1].confusion)
      .slice(0, 5)
      .map(([topic, value]) => ({ topic, confusion: value.confusion, mastery: value.mastery, successRate: value.successRate }));

    const timeline = (this.state.topicTimeline || []).slice(0, 30).map(({ timestamp, topic, metric, value }) => ({ timestamp, topic, metric, value }));
    const activeConfidentTopic = conceptEntries
      .sort((a, b) => b[1].mastery - a[1].mastery)
      .map(([topic]) => topic)[0] || 'general_learning';

    return {
      sessionId: `telemetry_${this.sessionStartTime}`,
      sessionLengthSec: Math.max(0, Math.round((Date.now() - this.sessionStartTime) / 1000)),
      overallCognitiveLoad: this.state.overallCognitiveLoad,
      indecisionIndex: this.state.indecisionIndex,
      activeConfidenceRating: this.state.activeConfidenceRating,
      recentSignals: this.state.signals.slice(0, 8).map((signal) => ({
        type: signal.type,
        severity: signal.severity,
        topic: signal.subtopic || 'general',
        timestamp: signal.timestamp,
      })),
      topConfusions,
      topicHealth: conceptEntries
        .sort((a, b) => (b[1].attempts + b[1].dwellSec / 60) - (a[1].attempts + a[1].dwellSec / 60))
        .slice(0, 12)
        .map(([topic, value]) => ({ topic, mastery: value.mastery, confusion: value.confusion, successRate: value.successRate, attempts: value.attempts, dwellSec: value.dwellSec, rereads: value.rereads, confidence: value.confidence })),
      activeConfidentTopic,
      attentionDrift: this.state.attentionDrift,
      eventCounts: this.state.eventCounts,
      sessionMetrics: this.state.sessionMetrics,
      resolvedGapsCount: this.state.resolvedGaps.length,
      totalPushes: this.state.totalLearningPushes || 0,
      coreResonancePercentage: this.state.coreResonancePercentage || 0,
      timeline,
    };
  }

  private updateAiContextState() {
    this.state.aiContextSnapshot = this.buildAiContextSnapshot();
    const conceptEntries = Object.entries(this.state.conceptHealth || {});
    const strongest = conceptEntries
      .sort((a, b) => b[1].mastery - a[1].mastery)
      .slice(0, 3)
      .map(([topic, value]) => `${topic} (${value.mastery}% mastery, ${value.confusion}% confusion)`);
    const weak = conceptEntries
      .filter(([, value]) => value.confusion >= 35)
      .sort((a, b) => b[1].confusion - a[1].confusion)
      .slice(0, 3)
      .map(([topic, value]) => `${topic} (${value.confusion}% confusion)`);

    this.state.aiContextSummary = [
      `Overall load ${this.state.overallCognitiveLoad}/100`,
      `Indecision ${this.state.indecisionIndex}/100`,
      `Confidence ${this.state.activeConfidenceRating || 'confident'}`,
      strongest.length ? `Strongest topics: ${strongest.join('; ')}` : 'Strongest topics: not yet measured',
      weak.length ? `Current friction: ${weak.join('; ')}` : 'Current friction: low',
    ].join(' | ');
  }

  private markTopicHealth(topic: string, metric: 'dwell' | 'hesitation' | 'error' | 'success' | 'confusion' | 'recall', value: number, detail: string) {
    const safeTopic = (topic || 'general_learning').trim().slice(0, 120);
    if (!safeTopic) return;

    const previous = this.state.conceptHealth?.[safeTopic] || {
      topic: safeTopic,
      mastery: 50,
      confusion: 15,
      attempts: 0,
      dwellSec: 0,
      rereads: 0,
      successRate: 50,
      correctAttempts: 0,
      incorrectAttempts: 0,
      lastSeen: Date.now(),
      confidence: 'confident' as const,
    };

    const correctAttempts = (previous.correctAttempts || 0) + (metric === 'success' ? 1 : 0);
    const incorrectAttempts = (previous.incorrectAttempts || 0) + (metric === 'error' ? 1 : 0);
    const outcomeCount = correctAttempts + incorrectAttempts;

    const next = {
      ...previous,
      topic: safeTopic,
      attempts: previous.attempts + (metric === 'dwell' ? 0 : 1),
      lastSeen: Date.now(),
      dwellSec: previous.dwellSec + (metric === 'dwell' ? Math.round(value) : 0),
      rereads: previous.rereads,
      confusion: Math.min(100, Math.max(0, previous.confusion + (metric === 'confusion' ? value : metric === 'error' ? 12 : metric === 'hesitation' ? 6 : 0))),
      correctAttempts,
      incorrectAttempts,
      successRate: outcomeCount ? Math.round((correctAttempts / outcomeCount) * 100) : previous.successRate,
      mastery: Math.min(100, Math.max(0, previous.mastery + (metric === 'success' ? 7 : metric === 'error' ? -4 : metric === 'recall' ? 5 : 0))),
      confidence: this.state.activeConfidenceRating || previous.confidence,
    };

    if (metric === 'error' && next.confusion > 60) {
      next.confidence = 'lost';
    } else if (metric === 'success' && next.mastery > 75) {
      next.confidence = 'confident';
    }

    const updatedConceptHealth = {
      ...(this.state.conceptHealth || {}),
      [safeTopic]: next,
    };
    const topicEntries = Object.entries(updatedConceptHealth);
    if (topicEntries.length > 500) {
      const oldestTopic = topicEntries.reduce((oldest, entry) => entry[1].lastSeen < oldest[1].lastSeen ? entry : oldest)[0];
      delete updatedConceptHealth[oldestTopic];
    }
    this.state.conceptHealth = updatedConceptHealth;
    this.state.eventCounts = {
      ...(this.state.eventCounts || {}),
      [metric]: (this.state.eventCounts?.[metric] || 0) + 1,
    };
    if (this.state.sessionMetrics) {
      this.state.sessionMetrics.trackedActions += 1;
      this.state.sessionMetrics.distinctTopics = Object.keys(this.state.conceptHealth).length;
      this.state.sessionMetrics.activeSeconds = Object.values(this.state.dwellTimePerSection).reduce((sum, seconds) => sum + seconds, 0);
      this.state.sessionMetrics.lastActivityAt = Date.now();
      if (metric === 'recall') {
        const attempts = this.state.sessionMetrics.recallAttempts + 1;
        this.state.sessionMetrics.recallAverage = ((this.state.sessionMetrics.recallAverage * this.state.sessionMetrics.recallAttempts) + Math.max(0, Math.min(100, value))) / attempts;
        this.state.sessionMetrics.recallAttempts = attempts;
      }
      if (metric === 'success') this.state.sessionMetrics.completionCount += 1;
    }

    this.state.topicTimeline = [
      {
        timestamp: Date.now(),
        topic: safeTopic,
        metric,
        value,
        note: detail,
      },
      ...((this.state.topicTimeline || []).slice(0, 199)),
    ];

    if (this.state.attentionDrift) {
      this.state.attentionDrift.lastTopicFocus = safeTopic;
      if (metric === 'confusion' || metric === 'error') {
        this.state.attentionDrift.longestStuckTopic = safeTopic;
      }
    }
  }

  private notify() {
    this.computeCognitiveMetrics();
    this.updateAiContextState();
    const currentState = this.getState();
    this.listeners.forEach((fn) => {
      try {
        fn(currentState);
      } catch (err) {
        console.warn('[TelemetryEngine] Listener notification error:', err);
      }
    });

    // Schedule debounced backend sync
    this.scheduleBackendPulseSync();
  }

  /**
   * Non-blocking debounced pulse sync to backend
   */
  private scheduleBackendPulseSync() {
    if (this.syncTimeoutId) clearTimeout(this.syncTimeoutId);
    this.syncTimeoutId = setTimeout(() => {
      this.syncPulseToBackend();
    }, 2500);
  }

  private async syncPulseToBackend() {
    try {
      const payload = {
        dwellTimes: this.state.dwellTimePerSection,
        rereadCounts: this.state.sectionRereadCount,
        hesitationIndex: this.state.indecisionIndex,
        cognitiveLoad: this.state.overallCognitiveLoad,
        recentConfidence: this.state.activeConfidenceRating === 'confident' ? 95 : this.state.activeConfidenceRating === 'hesitant' ? 75 : 50,
        telemetryContext: this.state.aiContextSnapshot,
      };

      const res = await fetch('/api/telemetry/pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ledger) {
          epistemicLedgerService.updateFromPulse(data.ledger);
        }
        if (data.resonancePercentage) {
          this.state.coreResonancePercentage = data.resonancePercentage;
        }
      }
    } catch {
      // Non-blocking catch for offline mode
    }
  }

  public recordSignal(params: {
    type: TelemetrySignal['type'];
    severity: TelemetrySignal['severity'];
    details: string;
    subtopic?: string;
    metadata?: Record<string, any>;
  }) {
    const newSignal: TelemetrySignal = {
      id: `sig-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      type: params.type,
      severity: params.severity,
      details: params.details,
      subtopic: params.subtopic,
      metadata: params.metadata,
    };

    // Keep last 40 signals in memory
    this.state.signals = [newSignal, ...this.state.signals.slice(0, 39)];
    const signalKey = `signal:${params.type}`;
    this.state.eventCounts = {
      ...(this.state.eventCounts || {}),
      [signalKey]: (this.state.eventCounts?.[signalKey] || 0) + 1,
    };
    if (this.state.sessionMetrics) {
      this.state.sessionMetrics.trackedActions += 1;
      this.state.sessionMetrics.lastActivityAt = Date.now();
    }
    this.notify();
  }

  // 1. Dwell Time Tracker (Time spent reading / analyzing)
  public trackDwell(sectionId: string, seconds: number, sectionTitle?: string) {
    seconds = Math.max(0, Math.min(3600, Number.isFinite(seconds) ? seconds : 0));
    const prev = this.state.dwellTimePerSection[sectionId] || 0;
    const updated = prev + seconds;
    this.state.dwellTimePerSection[sectionId] = updated;
    this.markTopicHealth(sectionTitle || sectionId, 'dwell', seconds, `Dwell time on topic: ${Math.round(updated)}s`);

    if (this.state.attentionDrift) {
      this.state.attentionDrift.avgSessionDepth = Math.round((Object.values(this.state.dwellTimePerSection).reduce((sum, value) => sum + value, 0) / Math.max(Object.keys(this.state.dwellTimePerSection).length, 1)) * 10) / 10;
    }

    // Detect abnormal dwell time (> 40s on a single block indicates cognitive friction)
    if (updated >= 40 && prev < 40) {
      this.recordSignal({
        type: 'dwell_anomaly',
        severity: 'medium',
        subtopic: sectionTitle || sectionId,
        details: `Аномальная задержка чтения: ${Math.round(updated)}с на блоке «${sectionTitle || sectionId}». Возможен когнитивный затык.`,
      });
    } else {
      this.notify();
    }
  }

  // 2. Section Reread / Revisit tracker
  public trackSectionReread(sectionId: string, sectionTitle?: string) {
    const prev = this.state.sectionRereadCount[sectionId] || 0;
    const next = prev + 1;
    this.state.sectionRereadCount[sectionId] = next;
    this.markTopicHealth(sectionTitle || sectionId, 'hesitation', 12, `Reread count increased to ${next}`);
    const topicHealth = this.state.conceptHealth?.[sectionTitle || sectionId];
    if (topicHealth) topicHealth.rereads += 1;

    if (next >= 2) {
      this.recordSignal({
        type: 'reread_loop',
        severity: 'high',
        subtopic: sectionTitle || sectionId,
        details: `Зафиксирован цикл повторного чтения (x${next}) темы «${sectionTitle || sectionId}». Студент возвращается к материалу из-за неуверенности.`,
      });
    } else {
      this.notify();
    }
  }

  // 3. Question Hesitation and Option Flipping (Indecision)
  public trackOptionFlip(questionId: string, fromOpt: string, toOpt: string, questionTitle?: string) {
    const current = this.state.questionHesitations[questionId] || {
      startTime: Date.now(),
      durationSec: 0,
      flipCount: 0,
      flippedOptions: [],
    };

    current.flipCount += 1;
    current.flippedOptions = [...current.flippedOptions, `${fromOpt} -> ${toOpt}`].slice(-30);
    this.state.questionHesitations[questionId] = current;
    this.markTopicHealth(questionTitle || `Вопрос ${questionId}`, 'hesitation', 1, `Answer changed ${current.flipCount} times`);

    if (current.flipCount >= 2) {
      this.recordSignal({
        type: 'option_flip',
        severity: current.flipCount >= 3 ? 'high' : 'medium',
        subtopic: questionTitle || `Вопрос ${questionId}`,
        details: `Колебания: студент сменил ответ ${current.flipCount} раз(а) (${fromOpt} → ${toOpt}). Индекс сомнений повышен.`,
      });
    } else {
      this.notify();
    }
  }

  public recordQuestionHesitationTime(questionId: string, durationSec: number, questionTitle?: string) {
    durationSec = Math.max(0, Math.min(3600, Number.isFinite(durationSec) ? durationSec : 0));
    const current = this.state.questionHesitations[questionId] || {
      startTime: Date.now(),
      durationSec: 0,
      flipCount: 0,
      flippedOptions: [],
    };
    current.durationSec = durationSec;
    this.state.questionHesitations[questionId] = current;
    this.markTopicHealth(questionTitle || `Вопрос ${questionId}`, 'hesitation', durationSec, `Question hesitation duration ${Math.round(durationSec)}s`);

    if (durationSec > 35) {
      this.recordSignal({
        type: 'hesitation',
        severity: durationSec > 60 ? 'high' : 'medium',
        subtopic: questionTitle || `Вопрос ${questionId}`,
        details: `Задержка обдумывания: ${Math.round(durationSec)} сек над формулировкой «${(questionTitle || '').slice(0, 50)}...»`,
      });
    }
    this.notify();
  }

  // 4. Test Error & Misconception
  public trackTestError(params: {
    questionId: string;
    question: string;
    chosen: string;
    correct: string;
    subtopic?: string;
  }) {
    this.markTopicHealth(params.subtopic || params.question, 'error', 18, `Wrong answer on ${params.question}: selected ${params.chosen}, correct ${params.correct}`);
    this.recordSignal({
      type: 'test_error',
      severity: 'critical',
      subtopic: params.subtopic || params.question,
      details: `Ошибка в тесте: выбрано «${params.chosen}», правильно «${params.correct}». Выявлен концептуальный пробел.`,
    });
  }

  // 5. Explicit "Не понял" / Confusion Ping
  public trackExplicitConfusion(subtopicOrConcept: string, note?: string) {
    subtopicOrConcept = subtopicOrConcept.trim().slice(0, 120);
    if (!subtopicOrConcept) return;
    if (!this.state.explicitConfusionFlags.includes(subtopicOrConcept)) {
      this.state.explicitConfusionFlags = [...this.state.explicitConfusionFlags, subtopicOrConcept].slice(-100);
    }
    this.markTopicHealth(subtopicOrConcept, 'confusion', 32, note || 'Explicit confusion signal from learner');
    this.recordSignal({
      type: 'explicit_ping',
      severity: 'critical',
      subtopic: subtopicOrConcept,
      details: `Прямой запрос студента: «Не понял: ${subtopicOrConcept}» ${note ? `(${note})` : ''}. Требуется деконструкция ментальной модели.`,
    });
  }

  // 6. Rapid / Rage Click Detection
  public trackClick(elementName?: string) {
    const now = Date.now();
    if (now - this.lastClickTime < 350) {
      this.rapidClickCounter++;
      if (this.rapidClickCounter >= 4) {
        this.state.rageClickCount++;
        this.recordSignal({
          type: 'rage_click',
          severity: 'medium',
          subtopic: elementName || 'Интерфейс',
          details: `Зафиксировано учащенное кликание (rage clicks x${this.rapidClickCounter}) на элементе «${elementName || 'кнопка'}». Возможна фрустрация.`,
        });
        this.rapidClickCounter = 0;
      }
    } else {
      this.rapidClickCounter = 0;
    }
    this.lastClickTime = now;
  }

  // 7. Code Editor Friction
  public trackCodeRun(success: boolean, errorSnippet?: string) {
    this.state.codeRunAttempts++;
    if (this.state.sessionMetrics) {
      if (success) this.state.sessionMetrics.codeSuccessfulRuns += 1;
      else this.state.sessionMetrics.codeFailedRuns += 1;
    }
    const codeEvent = success ? 'code_success' : 'code_failure';
    this.state.eventCounts = {
      ...(this.state.eventCounts || {}),
      [codeEvent]: (this.state.eventCounts?.[codeEvent] || 0) + 1,
    };
    if (!success && errorSnippet) {
      this.state.codeErrorHistory.push(errorSnippet.slice(0, 100));
      this.recordSignal({
        type: 'code_friction',
        severity: this.state.codeErrorHistory.length >= 3 ? 'high' : 'medium',
        subtopic: 'IDE / Практика',
        details: `Ошибка выполнения кода (#${this.state.codeRunAttempts}): ${errorSnippet.slice(0, 70)}...`,
      });
    }
    this.notify();
  }

  // 8. Confidence Self-Rating
  public setConfidenceRating(rating: 'confident' | 'hesitant' | 'lost') {
    this.state.activeConfidenceRating = rating;
    if (rating === 'lost') {
      this.recordSignal({
        type: 'hesitation',
        severity: 'critical',
        details: 'Студент отметил статус: «Запутался / Нужна помощь ИИ».',
      });
    } else if (rating === 'hesitant') {
      this.recordSignal({
        type: 'hesitation',
        severity: 'medium',
        details: 'Студент отметил статус: «Колеблюсь в ответах».',
      });
    }
    this.notify();
  }

  // 9. Blank Page Recall / Active Retrieval Tracker
  public trackRetentionRecall(unitId: string, score: number, subtopic?: string) {
    score = Math.max(0, Math.min(100, Number.isFinite(score) ? score : 0));
    const topic = subtopic || unitId;
    this.markTopicHealth(topic, 'recall', score, `Recall accuracy ${score}%`);
    this.recordSignal({
      type: 'hesitation',
      severity: score >= 70 ? 'low' : 'high',
      subtopic: topic,
      details: score >= 70
        ? `Слепой тест чистого листа успешно сдан: ${score}% точности извлечения инвариантов.`
        : `Слепой тест чистого листа выявил пробелы памяти: ${score}% (порог зачета 70%).`,
      metadata: { unitId, score }
    });

    // Automatic AI Core Filling on proven active recall
    if (score >= 70) {
      this.autoCrystallizeToCore({
        topic,
        triggerReason: 'recall_mastery',
        details: `Слепой опрос сдан на ${score}%: знание подтверждено в долговременной памяти`
      });
    }
  }

  // 10. Set Active Gap Closure Block
  public setActiveGapBlock(block: TargetedGapClosureBlock | null) {
    this.state.activeGapBlock = block;
    if (block) {
      this.recordSignal({
        type: 'test_error',
        severity: 'critical',
        subtopic: block.targetSubtopic,
        details: `🎯 ИИ активировал блок адресной ликвидации пробела: «${block.targetSubtopic}».`,
      });
    }
    this.notify();
  }

  // 11. Mark Gap as Resolved (Success) - Auto-crystallizes proven axiom into 3D Sphere Core
  public markGapResolved(gapId: string, subtopic: string) {
    if (!this.state.resolvedGaps.includes(gapId)) {
      this.state.resolvedGaps.push(gapId);
    }
    this.state.activeGapBlock = null;
    this.recordSignal({
      type: 'remediation_success',
      severity: 'low',
      subtopic,
      details: `✅ Пробел «${subtopic}» успешно закрыт на 100%! Ментальная модель восстановлена.`,
    });

    // Automatic AI Core Filling on resolved gap
    this.autoCrystallizeToCore({
      topic: subtopic,
      triggerReason: 'gap_resolved',
      details: 'Устранен концептуальный пробел, сформирован доказанный инвариант'
    });

    this.notify();
  }

  // 12. Unit Mastery / Completed Block Trigger - Auto-crystallize to Core
  public trackUnitMastery(params: {
    unitId: string;
    unitTitle: string;
    domain?: string;
    score?: number;
  }) {
    this.markTopicHealth(params.unitTitle, 'success', params.score || 100, `Unit mastery score ${params.score ?? 100}%`);
    this.recordSignal({
      type: 'remediation_success',
      severity: 'low',
      subtopic: params.unitTitle,
      details: `🏆 Модуль «${params.unitTitle}» успешно освоен! ИИ начинает авто-кристаллизацию в Ядро Сферы.`,
      metadata: params,
    });

    this.autoCrystallizeToCore({
      topic: params.unitTitle,
      domain: params.domain || 'Архитектура & Системы',
      triggerReason: 'unit_completed',
      details: params.score ? `Результат практики: ${params.score}%` : 'Блок пройден полностью'
    });
  }

  /**
   * AUTOMATIC AI CORE FILLING ENGINE
   * Dispatches clean-memory AI agent to distill fundamental invariants and insert them directly into the Core layer.
   */
  public async autoCrystallizeToCore(params: {
    topic: string;
    domain?: string;
    triggerReason: string;
    details?: string;
  }) {
    const rawTopic = params.topic.trim();
    if (!rawTopic || rawTopic.length < 3) return;

    // Deduplicate to avoid repetitive crystallization of same concept
    const normalizedKey = rawTopic.toLowerCase().slice(0, 30);
    if (this.crystallizedTopicsSet.has(normalizedKey)) {
      return;
    }
    this.crystallizedTopicsSet.add(normalizedKey);

    this.state.telemetryDrivenCoreFillStatus = 'syncing';
    this.state.lastAutoCrystallizedTopic = rawTopic;
    this.state.totalLearningPushes = (this.state.totalLearningPushes || 0) + 1;
    this.notify();

    try {
      const result = await epistemicLedgerService.runCleanMemoryAgentCycle({
        taskPrompt: `Телеметрия обучения: «${rawTopic}» (${params.details || params.triggerReason}). Сформулируй чистый инвариант для Ядра 3D Сферы Знаний.`,
        domain: params.domain || 'Архитектура & Системы',
        agentName: 'AI-TelemetryCoreSynthesizer',
        workingContextSnapshot: {
          trigger: params.triggerReason,
          topic: rawTopic,
          resolvedGapsCount: this.state.resolvedGaps.length,
          currentLoad: this.state.overallCognitiveLoad,
          telemetrySnapshot: this.buildAiContextSnapshot(),
        }
      });

      if (result.success) {
        this.state.autoCrystallizedAxiomCount = (this.state.autoCrystallizedAxiomCount || 0) + 1;
        this.state.coreResonancePercentage = Math.min(99, Math.max(70, 75 + (this.state.autoCrystallizedAxiomCount * 3)));
        
        this.recordSignal({
          type: 'remediation_success',
          severity: 'low',
          subtopic: rawTopic,
          details: `✨ Телеметрия + ИИ: в Ядро Сферы Знаний 3D автоматически добавлена аксиома «${rawTopic}». Резонанс ядра: ${this.state.coreResonancePercentage}%.`,
        });
      }
    } catch (err) {
      console.warn('[Telemetry Core Auto-Fill] Failed cycle:', err);
    } finally {
      this.state.telemetryDrivenCoreFillStatus = 'active';
      this.notify();
    }
  }

  /**
   * Reconcile completed or studied units with the 3D Sphere Core.
   * If any completed unit does not yet have a core axiom, telemetry auto-crystallizes it.
   */  public trackTopicSwitch(topic: string) {
    const currentTopic = (topic || 'general_learning').trim() || 'general_learning';
    const drift = this.state.attentionDrift;
    const previousTopic = drift?.lastTopicFocus;
    const switched = Boolean(previousTopic && previousTopic !== currentTopic);
    if (previousTopic === currentTopic) return;
    if (switched && drift) {
      const previousHealth = this.state.conceptHealth?.[previousTopic!];
      if ((previousHealth?.mastery || 0) < 70) {
        drift.abandonedTopics = [...new Set([previousTopic!, ...drift.abandonedTopics])].slice(0, 20);
      }
    }
    this.state.attentionDrift = {
      contextSwitches: (drift?.contextSwitches || 0) + (switched ? 1 : 0),
      abandonedTopics: drift?.abandonedTopics || [],
      longestStuckTopic: drift?.longestStuckTopic,
      avgSessionDepth: drift?.avgSessionDepth || 0,
      lastTopicFocus: currentTopic,
    };
    this.markTopicHealth(currentTopic, 'dwell', 0, 'Topic focus switched');
    this.notify();
  }

  public trackLearningAction(action: string, topic: string, confidence: number) {
    this.markTopicHealth(topic, confidence >= 70 ? 'success' : 'confusion', confidence, action);
    this.notify();
  }
  public async autoReconcileCoreWithProgress(
    units: Record<string, LearningUnit>,
    dagNodes?: DAGNode[]
  ) {
    if (this.isReconciling) return;
    this.isReconciling = true;

    try {
      const completedNodeUnitIds = new Set(
        (dagNodes || []).filter(n => n.status === 'completed').map(n => n.unitId || n.id)
      );
      const completedUnits = Object.values(units).filter(
        u => completedNodeUnitIds.has(u.id) || (u as any).isCompleted || (u as any).completed
      );
      const ledger = epistemicLedgerService.getCachedLedger();
      const existingTitles = new Set(
        (ledger?.crystallizedKnowledgeNodes || []).map(n => n.title.toLowerCase())
      );

      for (const unit of completedUnits.slice(0, 5)) {
        const titleKey = unit.title.toLowerCase();
        if (!existingTitles.has(titleKey) && !this.crystallizedTopicsSet.has(titleKey.slice(0, 30))) {
          await this.autoCrystallizeToCore({
            topic: unit.title,
            domain: unit.category || 'Архитектура & Системы',
            triggerReason: 'reconciliation_sync',
            details: 'Синхронизация прогресса с Ядром'
          });
          // Small pause to keep queue gentle
          await new Promise(r => setTimeout(r, 400));
        }
      }
    } catch (err) {
      console.warn('[Telemetry Reconcile] Error:', err);
    } finally {
      this.isReconciling = false;
    }
  }


  // Internal composite metrics computation
  private computeCognitiveMetrics() {
    let load = 15; // base level
    let indecision = 10;

    // Dwell time effect
    const totalDwell = Object.values(this.state.dwellTimePerSection).reduce((a, b) => a + b, 0);
    if (totalDwell > 120) load += 15;
    if (totalDwell > 240) load += 15;

    // Hesitation & option flip effect
    let totalFlips = 0;
    let highHesitations = 0;
    Object.values(this.state.questionHesitations).forEach((h) => {
      totalFlips += h.flipCount;
      if (h.durationSec > 35) highHesitations++;
    });

    indecision += totalFlips * 12;
    indecision += highHesitations * 15;
    load += totalFlips * 8 + highHesitations * 10;

    // Explicit confusion flags
    load += this.state.explicitConfusionFlags.length * 20;
    indecision += this.state.explicitConfusionFlags.length * 15;

    // Rage clicks
    if (this.state.rageClickCount > 0) {
      load += this.state.rageClickCount * 10;
    }

    // Errors
    load += this.state.codeErrorHistory.length * 8;

    // Confidence adjustment
    if (this.state.activeConfidenceRating === 'lost') {
      load += 25;
      indecision += 30;
    } else if (this.state.activeConfidenceRating === 'hesitant') {
      load += 15;
      indecision += 18;
    }

    // Active gap block active
    if (this.state.activeGapBlock) {
      load = Math.max(load, 68);
      indecision = Math.max(indecision, 60);
    }

    this.state.overallCognitiveLoad = Math.min(Math.max(load, 10), 98);
    this.state.indecisionIndex = Math.min(Math.max(indecision, 5), 98);
  }

  public resetTelemetry() {
    this.state.dwellTimePerSection = {};
    this.state.sectionRereadCount = {};
    this.state.questionHesitations = {};
    this.state.rageClickCount = 0;
    this.state.codeErrorHistory = [];
    this.state.explicitConfusionFlags = [];
    this.state.conceptHealth = {};
    this.state.topicTimeline = [];
    this.state.eventCounts = {};
    this.sessionStartTime = Date.now();
    this.state.sessionMetrics = {
      sessionStartedAt: this.sessionStartTime,
      activeSeconds: 0,
      trackedActions: 0,
      distinctTopics: 0,
      completionCount: 0,
      recallAttempts: 0,
      recallAverage: 0,
      codeSuccessfulRuns: 0,
      codeFailedRuns: 0,
      lastActivityAt: this.sessionStartTime,
    };
    this.state.attentionDrift = {
      contextSwitches: 0,
      abandonedTopics: [],
      longestStuckTopic: undefined,
      avgSessionDepth: 0,
      lastTopicFocus: null,
    };
    this.state.overallCognitiveLoad = 20;
    this.state.indecisionIndex = 15;
    this.updateAiContextState();
    this.notify();
  }
}

export const telemetryEngine = new TelemetryEngine();
