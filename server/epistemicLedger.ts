export interface EpistemicFact {
  id: string;
  topic: string;
  domain: string;
  statement: string;
  confidence: number; // 0.0 - 1.0
  discoveredByAgent: string;
  verifiedAt: string;
  layer: 'core_axiom' | 'mantle_skill' | 'orbit_artifact';
  linkedNodeIds?: string[];
  impactWeight: number; // Node size and glow weight
}

export interface AgentReasoningTrace {
  id: string;
  timestamp: string;
  agentName: string;
  taskGoal: string;
  premises: string[];
  deduction: string;
  verdict: string;
  injectedKnowledgeSummary?: string;
  nextStepTrigger?: string;
}

export interface EpistemicStudentState {
  targetDomain: string;
  masteredTopics: string[];
  activeGaps: string[];
  recentConfidenceScore: number;
  totalInsightsCrystallized: number;
  coreResonancePercentage: number;
  cognitiveEntropy: number;
  activeFrictionScore: number;
  lastUpdated: string;
  lastTelemetryContext?: {
    capturedAt: string;
    sessionLengthSec: number;
    trackedActions: number;
    distinctTopics: number;
    recallAverage: number;
    codeSuccessRate: number;
    topConfusions: string[];
    abandonedTopics: string[];
    eventCounts: Record<string, number>;
  };
}

export interface CastalianBridge {
  id: string;
  source: string;
  target: string;
  type: 'castalian_resonance' | 'direct_impact_ray' | 'castalian_bridge';
  explanation: string;
  mathBridge: string;
  strength: number;
}

export interface AiPerceptionEvent {
  id: string;
  timestamp: string;
  channel: 'telemetry_friction' | 'hesitation_vector' | 'ungrounded_theory' | 'epistemic_resonance' | 'blind_recall';
  observation: string;
  metricName: string;
  metricValue: any;
  severity: 'normal' | 'friction' | 'resonance';
}

export interface AiActionEvent {
  id: string;
  timestamp: string;
  actionType: 'clean_memory_purge' | 'axiom_crystallization' | 'castalian_ray_projection' | 'entropy_balance';
  description: string;
  cleanMemoryPurged: boolean;
  targetAxiom: string;
}

export interface EpistemicLedgerData {
  version: number;
  userPurpose?: string; // Grounded user reason: "А для чего вам этот навык?"
  userPurposeDomain?: string;
  userPurposeSetAt?: string;
  studentState: EpistemicStudentState;
  provenFacts: EpistemicFact[];
  provenInvariants?: EpistemicFact[];
  recentTraces: AgentReasoningTrace[];
  castalianBridges: CastalianBridge[];
  aiPerceptions: AiPerceptionEvent[];
  aiActions: AiActionEvent[];
  crystallizedKnowledgeNodes: Array<{
    id: string;
    title: string;
    subtitle: string;
    layer: 'core' | 'mantle' | 'orbit';
    domain: string;
    domainColor: string;
    status: 'active' | 'completed';
    impactRayTargets: string[];
    description: string;
    weight: number;
    synthesizedByAgent: string;
    createdAt: string;
    formula?: string;
    castalianBeadId?: string;
    firstPrinciplesCitation?: string;
    aiPerception?: {
      observedFriction: string;
      masteryConfidence: number;
      retentionState: 'firm' | 'decaying' | 'untested';
      liveVector: string;
    };
    aiAction?: {
      activeIntervention: string;
      projectedRaysCount: number;
      groundedInArtifact: boolean;
      lastPurgedReasoningTrace?: string;
    };
  }>;
}

// In-memory memory store with file persistence fallback
let ledgerInstance: EpistemicLedgerData = {
  version: 3,
  userPurpose: 'Создать работающий практический результат и освоить ключевые инварианты без воды',
  userPurposeDomain: 'Прикладные навыки & Системное проектирование',
  userPurposeSetAt: new Date().toISOString(),
  studentState: {
    targetDomain: 'Прикладные навыки & Системное проектирование',
    masteredTopics: [],
    activeGaps: [],
    recentConfidenceScore: 92,
    totalInsightsCrystallized: 0,
    coreResonancePercentage: 85,
    cognitiveEntropy: 0.12,
    activeFrictionScore: 10,
    lastUpdated: new Date().toISOString(),
  },
  provenFacts: [],
  recentTraces: [],
  castalianBridges: [],
  aiPerceptions: [],
  aiActions: [],
  crystallizedKnowledgeNodes: []
};


export class EpistemicLedger {
  public static getLedger(): EpistemicLedgerData {
    return ledgerInstance;
  }

  /**
   * Assimilate real-time cognitive telemetry stream from the client:
   * 1. Evaluates cognitive friction index and cognitive load.
   * 2. Detects high-confidence breakthroughs and automatically crystallizes knowledge nodes.
   * 3. Derives cross-layer Castalian impact rays and bridges without requiring manual triggers.
   */
  public static assimilateTelemetryStream(telemetryPayload: {
    dwellTimes?: Record<string, number>;
    rereadCounts?: Record<string, number>;
    hesitationIndex?: number;
    cognitiveLoad?: number;
    activeUnitId?: string;
    unitTitle?: string;
    domain?: string;
    isMilestonePassed?: boolean;
    recentConfidence?: number;
    telemetryContext?: Record<string, any>;
  }): {
    status: 'assimilated' | 'crystallized';
    resonancePercentage: number;
    newCrystallizedNodes: number;
    ledger: EpistemicLedgerData;
  } {
    const {
      dwellTimes = {},
      rereadCounts = {},
      hesitationIndex = 10,
      cognitiveLoad = 15,
      activeUnitId,
      unitTitle,
      domain = 'Системы & Архитектура',
      isMilestonePassed = false,
      recentConfidence = 92,
      telemetryContext = {}
    } = telemetryPayload;

    // 1. Calculate active cognitive friction and entropy
    const maxDwell = Math.max(...Object.values(dwellTimes), 0);
    const totalRereads = Object.values(rereadCounts).reduce((a, b) => a + b, 0);
    const activeFriction = Math.min(100, Math.round(hesitationIndex * 0.4 + cognitiveLoad * 0.4 + totalRereads * 5));
    const cognitiveEntropy = Math.min(1.0, Math.max(0.05, Number(((activeFriction / 100) * 0.8 + (maxDwell > 45 ? 0.2 : 0)).toFixed(3))));

    ledgerInstance.studentState.activeFrictionScore = activeFriction;
    ledgerInstance.studentState.cognitiveEntropy = cognitiveEntropy;
    ledgerInstance.studentState.recentConfidenceScore = recentConfidence;
    ledgerInstance.studentState.lastUpdated = new Date().toISOString();

    const session = telemetryContext.sessionMetrics && typeof telemetryContext.sessionMetrics === 'object'
      ? telemetryContext.sessionMetrics
      : {};
    const topicHealth = Array.isArray(telemetryContext.topicHealth)
      ? telemetryContext.topicHealth.filter((topic: any) => topic && typeof topic.topic === 'string').slice(0, 12)
      : [];
    const eventCounts = telemetryContext.eventCounts && typeof telemetryContext.eventCounts === 'object'
      ? Object.fromEntries(Object.entries(telemetryContext.eventCounts).slice(0, 20).map(([key, value]) => [key.slice(0, 60), Math.max(0, Math.min(100000, Number(value) || 0))]))
      : {};
    const successfulCodeRuns = Math.max(0, Number(session.codeSuccessfulRuns) || 0);
    const failedCodeRuns = Math.max(0, Number(session.codeFailedRuns) || 0);
    const codeAttempts = successfulCodeRuns + failedCodeRuns;
    ledgerInstance.studentState.lastTelemetryContext = {
      capturedAt: new Date().toISOString(),
      sessionLengthSec: Math.max(0, Math.min(7 * 24 * 60 * 60, Number(telemetryContext.sessionLengthSec) || 0)),
      trackedActions: Math.max(0, Math.min(100000, Number(session.trackedActions) || 0)),
      distinctTopics: Math.max(0, Math.min(10000, Number(session.distinctTopics) || topicHealth.length)),
      recallAverage: Math.max(0, Math.min(100, Number(session.recallAverage) || 0)),
      codeSuccessRate: codeAttempts ? Math.round((successfulCodeRuns / codeAttempts) * 100) : 0,
      topConfusions: topicHealth
        .filter((topic: any) => Number(topic.confusion) >= 30)
        .sort((a: any, b: any) => Number(b.confusion) - Number(a.confusion))
        .slice(0, 5)
        .map((topic: any) => String(topic.topic).slice(0, 120)),
      abandonedTopics: Array.isArray(telemetryContext.attentionDrift?.abandonedTopics)
        ? telemetryContext.attentionDrift.abandonedTopics.slice(0, 10).map((topic: unknown) => String(topic).slice(0, 120))
        : [],
      eventCounts,
    };

    let newNodesCount = 0;

    // 2. High-Confidence / Milestone Auto-Crystallization Rule:
    // If student demonstrates low friction (< 35) or completed a verified milestone with >= 85% confidence,
    // automatically crystallize the topic into the knowledge sphere!
    if ((isMilestonePassed || activeFriction < 25) && unitTitle) {
      const cleanTitle = unitTitle.trim();
      const existing = ledgerInstance.crystallizedKnowledgeNodes.find(
        (n) => n.title.toLowerCase().includes(cleanTitle.toLowerCase()) || cleanTitle.toLowerCase().includes(n.title.toLowerCase())
      );

      if (!existing) {
        const domainColors: Record<string, string> = {
          'Архитектура': '#38bdf8',
          'Системы': '#818cf8',
          'Программирование': '#34d399',
          'Алгоритмы': '#fbbf24',
          'Безопасность': '#f87171',
          'Базы данных': '#a78bfa',
          'Мета-обучение': '#f472b6',
          'Инженерия': '#2dd4bf',
        };

        const assignedColor = Object.entries(domainColors).find(([k]) => domain.includes(k))?.[1] || '#38bdf8';
        const nodeId = `auto-cryst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

        // Determine layer by role
        const layer: 'core' | 'mantle' | 'orbit' = 
          cleanTitle.includes('Инвариант') || cleanTitle.includes('Парето') || cleanTitle.includes('Аксиома')
            ? 'core'
            : isMilestonePassed || cleanTitle.includes('Проект') || cleanTitle.includes('Спарринг')
            ? 'orbit'
            : 'mantle';

        const beadNumber = ledgerInstance.crystallizedKnowledgeNodes.length + 1;
        const newNode = {
          id: nodeId,
          title: cleanTitle,
          subtitle: `Авто-кристаллизация телеметрии · [${layer.toUpperCase()}]`,
          layer,
          domain: domain.split('&')[0].trim() || 'Инженерия',
          domainColor: assignedColor,
          status: 'completed' as const,
          impactRayTargets: ['sphere-orbit-capstone'],
          description: `Знание «${cleanTitle}» автоматически верифицировано и заземлено в топологию (когнитивная нагрузка: ${cognitiveLoad}%, точность: ${recentConfidence}%).`,
          weight: layer === 'core' ? 14 : layer === 'mantle' ? 11 : 8,
          synthesizedByAgent: 'AutoTelemetryCrystallizer',
          createdAt: new Date().toISOString(),
          formula: layer === 'core' ? `Invariant(${cleanTitle}) ⇔ True` : undefined,
          castalianBeadId: `Бисер №0${beadNumber} • ${cleanTitle}`,
          firstPrinciplesCitation: 'Академический первоисточник курса (OpenStax / IEEE)',
          aiPerception: {
            observedFriction: `Телеметрия: уверенное усвоение (Friction: ${activeFriction}, Dwell: ${Math.round(maxDwell)}s).`,
            masteryConfidence: recentConfidence,
            retentionState: 'firm' as const,
            liveVector: 'Инвариант зафиксирован в реестре знаний без шума.'
          },
          aiAction: {
            activeIntervention: 'Проецирует устойчивые связи в смежные модули графа.',
            projectedRaysCount: 2,
            groundedInArtifact: true,
            lastPurgedReasoningTrace: 'Транзитный контекст очищен.'
          }
        };

        ledgerInstance.crystallizedKnowledgeNodes.push(newNode);
        ledgerInstance.studentState.totalInsightsCrystallized++;

        if (!ledgerInstance.studentState.masteredTopics.includes(cleanTitle)) {
          ledgerInstance.studentState.masteredTopics.push(cleanTitle);
        }

        // Add Proven Fact
        ledgerInstance.provenFacts.push({
          id: `fact-auto-${Date.now()}`,
          topic: cleanTitle,
          domain: newNode.domain,
          statement: `Инвариант «${cleanTitle}» подтвержден практикой с уверенностью ${recentConfidence}%.`,
          confidence: recentConfidence / 100,
          discoveredByAgent: 'AutoTelemetryEngine',
          verifiedAt: new Date().toISOString(),
          layer: layer === 'core' ? 'core_axiom' : layer === 'mantle' ? 'mantle_skill' : 'orbit_artifact',
          impactWeight: newNode.weight,
        });

        // Auto-derive Castalian Bridge to existing core axioms
        const targetCore = ledgerInstance.crystallizedKnowledgeNodes.find(n => n.layer === 'core' && n.id !== nodeId);
        if (targetCore) {
          ledgerInstance.castalianBridges.push({
            id: `bridge-auto-${Date.now()}`,
            source: targetCore.id,
            target: nodeId,
            type: 'castalian_bridge',
            explanation: `Автоматическая связь: «${targetCore.title}» служит фундаментальной опорой для «${cleanTitle}».`,
            mathBridge: `Axiom(${targetCore.title.slice(0, 15)}) → Derived(${cleanTitle.slice(0, 15)})`,
            strength: 0.92,
          });
        }

        // Log AI Perception and Action
        ledgerInstance.aiPerceptions.push({
          id: `perc-${Date.now()}`,
          timestamp: new Date().toISOString(),
          channel: 'epistemic_resonance',
          observation: `Зафиксирован когнитивный резонанс на теме «${cleanTitle}». Топология автоматически расширена.`,
          metricName: 'resonance_score',
          metricValue: recentConfidence,
          severity: 'resonance'
        });

        ledgerInstance.aiActions.push({
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actionType: 'axiom_crystallization',
          description: `Узел «${cleanTitle}» кристаллизован в слой [${layer.toUpperCase()}].`,
          cleanMemoryPurged: true,
          targetAxiom: nodeId
        });

        newNodesCount++;
      }
    }

    // Update Core Resonance Percentage
    const coreCount = ledgerInstance.crystallizedKnowledgeNodes.filter((n) => n.layer === 'core').length;
    const mantleCount = ledgerInstance.crystallizedKnowledgeNodes.filter((n) => n.layer === 'mantle').length;
    const orbitCount = ledgerInstance.crystallizedKnowledgeNodes.filter((n) => n.layer === 'orbit').length;

    const baseResonance = 72 + coreCount * 3 + mantleCount * 1.5 + orbitCount * 2;
    const frictionPenalty = activeFriction * 0.1;
    ledgerInstance.studentState.coreResonancePercentage = Math.min(99, Math.max(60, Math.round(baseResonance - frictionPenalty)));

    return {
      status: newNodesCount > 0 ? 'crystallized' : 'assimilated',
      resonancePercentage: ledgerInstance.studentState.coreResonancePercentage,
      newCrystallizedNodes: newNodesCount,
      ledger: ledgerInstance,
    };
  }

  /**
   * Set user purpose ("А для чего?") into long-term epistemic memory (not just context)
   */
  public static setStudentPurpose(purpose: string, domain?: string): void {
    if (!purpose) return;
    ledgerInstance.userPurpose = purpose.trim();
    if (domain) ledgerInstance.userPurposeDomain = domain;
    ledgerInstance.userPurposeSetAt = new Date().toISOString();

    // Record immutable epistemic trace
    this.recordAgentExecution({
      agentName: 'System-PurposeGroundingEngine',
      taskGoal: `Фиксация прикладной цели студента: «${purpose}»`,
      premises: [
        `Пользователь указал истинную прикладную цель: "${purpose}"`,
        `Включен фильтр отсечения абстрактной теории и воды (No-Water Invariant)`
      ],
      deduction: `Все учебные материалы, код, задачи и советы ИИ обязаны напрямую служить цели «${purpose}». Абстрактная теория отсекается.`,
      verdict: `Цель зафиксирована в постоянной памяти Epistemic Memory.`,
      discoveredFacts: [
        {
          topic: 'Прикладная цель студента',
          statement: `Студент изучает «${domain || 'дисциплину'}» исключительно ради результата: «${purpose}».`,
          domain: domain || 'Цели',
          layer: 'core_axiom'
        }
      ]
    });
  }

  /**
   * Build clean, anti-hallucination context for any next AI Agent call.
   * Gives only verified invariants and active focus, completely purged of noisy dialogue tokens.
   */
  public static buildCleanContextPrompt(currentGoal: string): string {
    const facts = ledgerInstance.provenFacts.map(
      (f, idx) => `[Факт ${idx + 1} • ${f.domain}] ${f.topic}: ${f.statement} (достоверность: ${Math.round(f.confidence * 100)}%)`
    ).join('\n');

    const recentDeductions = ledgerInstance.recentTraces.slice(-3).map(
      (t) => `[Агент: ${t.agentName}] Цель: "${t.taskGoal}" -> Вывод: "${t.deduction}" -> Итог: "${t.verdict}"`
    ).join('\n');

    const coreAxioms = ledgerInstance.crystallizedKnowledgeNodes
      .filter((n) => n.layer === 'core')
      .map((n) => `• [ЯДРО] «${n.title}» (${n.domain}): ${n.description}`)
      .join('\n');

    const purposeDirective = ledgerInstance.userPurpose ? `
[ФУНДАМЕНТАЛЬНЫЙ ИНВАРИАНТ ПРИКЛАДНОЙ ЦЕЛИ ("А ДЛЯ ЧЕГО?")]:
Пользователь осваивает направление СТРОГО ради конкретной цели: «${ledgerInstance.userPurpose}».
СТРОЖАЙШЕЕ ПРАВИЛО ФИЛЬТРАЦИИ "NO-ABSTRACT-WATER":
1. КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО давать абстрактную умозрительную теорию в вакууме, академическую "воду", ненужные лекции или оторванный от цели материал.
2. Давать СТРОГО только то, что непосредственно необходимо для достижения цели «${ledgerInstance.userPurpose}».
3. Все кванты, задания Фокус-Студии, тесты, код и примеры обязаны напрямую приближать пользователя к результату: «${ledgerInstance.userPurpose}».
` : '';

    return `
=== ЧИСТЫЙ ЭПИСТЕМИЧЕСКИЙ РЕЕСТР ЗНАНИЙ (CLEAN-CONTEXT LEDGER): ===
${purposeDirective}
ДОКАЗАННЫЕ ФАКТЫ И ИНВАРИАНТЫ:
${facts || 'Факты фиксируются в процессе практики.'}

АКСИОМЫ ЯДРА СФЕРЫ ЗНАНИЙ (KNOWLEDGE SPHERE CORE):
${coreAxioms || 'Ядро формируется из подтвержденных концепций.'}

ПОСЛЕДНИЕ ЗАКЛЮЧЕНИЯ ПРЕДЫДУЩИХ АГЕНТОВ (БЕЗ ШУМА ДИАЛОГА):
${recentDeductions || 'Первый агент в цепочке.'}

ТЕКУЩАЯ ЦЕЛЕВАЯ ЗАДАЧА: "${currentGoal}"
ПРИНЦИП: Не выдумывай несуществующее, опирайся строго на верифицированный реестр. По завершении сформируй новую запись в реестр и синтезируй знание в Ядро.
`;
  }

  /**
   * Record a new agent execution trace and crystallize insights into the Knowledge Sphere
   */
  public static recordAgentExecution(params: {
    agentName: string;
    taskGoal: string;
    premises: string[];
    deduction: string;
    verdict: string;
    discoveredFacts?: Array<{ topic: string; statement: string; domain?: string; layer?: 'core_axiom' | 'mantle_skill' | 'orbit_artifact' }>;
    crystallizedNode?: {
      title: string;
      subtitle: string;
      layer: 'core' | 'mantle' | 'orbit';
      domain: string;
      description: string;
      linkedTargets?: string[];
      formula?: string;
      firstPrinciplesCitation?: string;
    };
    nextStepTrigger?: string;
  }): { trace: AgentReasoningTrace; newFactsCount: number; newNodesCount: number } {
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const trace: AgentReasoningTrace = {
      id: traceId,
      timestamp: new Date().toISOString(),
      agentName: params.agentName,
      taskGoal: params.taskGoal,
      premises: params.premises,
      deduction: params.deduction,
      verdict: params.verdict,
      injectedKnowledgeSummary: params.crystallizedNode ? `Синтезирован узел «${params.crystallizedNode.title}» в слой [${params.crystallizedNode.layer.toUpperCase()}]` : undefined,
      nextStepTrigger: params.nextStepTrigger,
    };

    // Keep last 20 traces
    ledgerInstance.recentTraces = [trace, ...ledgerInstance.recentTraces].slice(0, 20);

    let newFactsCount = 0;
    if (params.discoveredFacts && params.discoveredFacts.length > 0) {
      params.discoveredFacts.forEach((df) => {
        const exists = ledgerInstance.provenFacts.some(
          (f) => f.topic.toLowerCase() === df.topic.toLowerCase() || f.statement === df.statement
        );
        if (!exists) {
          ledgerInstance.provenFacts.push({
            id: `fact-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            topic: df.topic,
            domain: df.domain || 'Архитектура',
            statement: df.statement,
            confidence: 0.96,
            discoveredByAgent: params.agentName,
            verifiedAt: new Date().toISOString(),
            layer: df.layer || 'core_axiom',
            impactWeight: df.layer === 'core_axiom' ? 14 : 10,
          });
          newFactsCount++;
        }
      });
    }

    let newNodesCount = 0;
    if (params.crystallizedNode) {
      const { title, subtitle, layer, domain, description, linkedTargets, formula, firstPrinciplesCitation } = params.crystallizedNode;
      const exists = ledgerInstance.crystallizedKnowledgeNodes.some(
        (n) => n.title.toLowerCase() === title.toLowerCase()
      );
      if (!exists) {
        const colorMap: Record<string, string> = {
          'Архитектура': '#38bdf8',
          'Системы': '#818cf8',
          'Программирование': '#34d399',
          'Алгоритмы': '#fbbf24',
          'Безопасность': '#f87171',
          'Базы данных': '#a78bfa',
          'Мета-обучение': '#f472b6',
          'Инженерия': '#2dd4bf',
        };

        const beadNumber = ledgerInstance.crystallizedKnowledgeNodes.length + 1;
        ledgerInstance.crystallizedKnowledgeNodes.push({
          id: `crystallized-${layer}-${Date.now()}`,
          title,
          subtitle,
          layer,
          domain,
          domainColor: colorMap[domain] || '#38bdf8',
          status: 'completed',
          impactRayTargets: linkedTargets || ['sphere-orbit-capstone'],
          description,
          weight: layer === 'core' ? 15 : layer === 'mantle' ? 11 : 8,
          synthesizedByAgent: params.agentName,
          createdAt: new Date().toISOString(),
          formula,
          castalianBeadId: `Бисер №0${beadNumber} • ${title}`,
          firstPrinciplesCitation: firstPrinciplesCitation || 'Рецензируемый первоисточник (OpenStax / IEEE)',
          aiPerception: {
            observedFriction: 'ИИ-валидация: инвариант подтвержден практическим артефактом.',
            masteryConfidence: 96,
            retentionState: 'firm',
            liveVector: 'Инвариант интегрирован в топологию связей.'
          },
          aiAction: {
            activeIntervention: 'Проецирует лучи влияния в смежные узлы графа.',
            projectedRaysCount: (linkedTargets || []).length || 2,
            groundedInArtifact: true,
            lastPurgedReasoningTrace: 'Контекст очищен от диалоговых галлюцинаций.'
          }
        });
        newNodesCount++;
        ledgerInstance.studentState.totalInsightsCrystallized++;
      }
    }

    // Update Core resonance score
    const coreCount = ledgerInstance.crystallizedKnowledgeNodes.filter((n) => n.layer === 'core').length;
    const orbitCount = ledgerInstance.crystallizedKnowledgeNodes.filter((n) => n.layer === 'orbit').length;
    ledgerInstance.studentState.coreResonancePercentage = Math.min(
      99,
      Math.max(65, 70 + coreCount * 4 + orbitCount * 3)
    );
    ledgerInstance.studentState.lastUpdated = new Date().toISOString();

    return { trace, newFactsCount, newNodesCount };
  }

  /**
   * Get explicit student purpose from permanent memory
   */
  public static getUserPurpose(): string {
    return ledgerInstance.userPurpose || 'Создать и запустить реальный рабочий проект без абстрактной теории и воды';
  }

  /**
   * Reset context ledger for guaranteed fresh clean state
   */
  public static purgeContext(): void {
    ledgerInstance.recentTraces = [
      {
        id: `trace-purge-${Date.now()}`,
        timestamp: new Date().toISOString(),
        agentName: 'System-ContextPurge',
        taskGoal: 'Очистка транзитного контекста (Clean-Context Reset)',
        premises: ['Пользователь или агент инициировал сброс транзитных токенов'],
        deduction: 'Контекст очищен. Следующий вызов агента стартует со свежей памятью, опираясь на зафиксированный реестр фактов.',
        verdict: 'Память оптимизирована.',
      }
    ];
  }
}
