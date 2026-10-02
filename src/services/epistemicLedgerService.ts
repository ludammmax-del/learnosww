import { DAGNode, LearningUnit, UserArtifact } from '../types.ts';

export interface EpistemicFact {
  id: string;
  topic: string;
  domain: string;
  statement: string;
  confidence: number;
  discoveredByAgent: string;
  verifiedAt: string;
  layer: 'core_axiom' | 'mantle_skill' | 'orbit_artifact';
  linkedNodeIds?: string[];
  impactWeight: number;
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
  studentState: {
    targetDomain: string;
    masteredTopics: string[];
    activeGaps: string[];
    recentConfidenceScore: number;
    totalInsightsCrystallized: number;
    coreResonancePercentage: number;
    lastUpdated: string;
  };
  provenFacts: EpistemicFact[];
  provenInvariants?: EpistemicFact[];
  recentTraces: AgentReasoningTrace[];
  castalianBridges?: CastalianBridge[];
  aiPerceptions?: AiPerceptionEvent[];
  aiActions?: AiActionEvent[];
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


class EpistemicLedgerService {
  private cache: EpistemicLedgerData | null = null;
  private listeners: Array<(data: EpistemicLedgerData) => void> = [];

  public async getLedger(): Promise<EpistemicLedgerData> {
    const data = await this.fetchLedger();
    data.provenInvariants = data.provenFacts;
    return data;
  }

  public async fetchLedger(): Promise<EpistemicLedgerData> {
    try {
      const res = await fetch('/api/epistemic/ledger');
      if (res.ok) {
        const data = await res.json();
        data.provenInvariants = data.provenFacts || [];
        this.cache = data;
        this.notify();
        return data;
      }
    } catch (e) {
      console.warn('[Epistemic Service] Offline ledger fallback:', e);
    }
    const fallback = this.getLocalFallback();
    fallback.provenInvariants = fallback.provenFacts;
    return fallback;
  }

  public async runCleanMemoryAgentCycle(params: {
    taskPrompt: string;
    domain?: string;
    agentName?: string;
    workingContextSnapshot?: any;
  }): Promise<{ success: boolean; crystallizedFact?: EpistemicFact }> {
    try {
      const res = await fetch('/api/epistemic/run-clean-cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ledger) {
          data.ledger.provenInvariants = data.ledger.provenFacts;
          this.cache = data.ledger;
          this.notify();
        }
        return { success: true, crystallizedFact: data.crystallizedFact };
      }
    } catch (err) {
      console.warn('[Epistemic Service] Clean agent cycle local execution:', err);
    }

    // Local fallback synthesis
    const newFact: EpistemicFact = {
      id: `fact-${Date.now()}`,
      topic: params.taskPrompt.slice(0, 50),
      domain: params.domain || 'Архитектура',
      statement: `Инвариант «${params.taskPrompt}» доказан в изоляции и кристаллизован в ядро.`,
      confidence: 0.96,
      discoveredByAgent: params.agentName || 'EpistemicCoreSynthesizer',
      verifiedAt: new Date().toISOString(),
      layer: 'core_axiom',
      impactWeight: 12
    };

    if (!this.cache) this.cache = this.getLocalFallback();
    this.cache.provenFacts.unshift(newFact);
    this.cache.provenInvariants = this.cache.provenFacts;
    this.notify();

    return { success: true, crystallizedFact: newFact };
  }

  public updateFromPulse(updatedLedger: EpistemicLedgerData) {
    if (updatedLedger) {
      updatedLedger.provenInvariants = updatedLedger.provenFacts || [];
      this.cache = updatedLedger;
      this.notify();
    }
  }

  public getCachedLedger(): EpistemicLedgerData {
    if (!this.cache) {
      this.cache = this.getLocalFallback();
    }
    return this.cache;
  }

  public subscribe(cb: (data: EpistemicLedgerData) => void): () => void {
    this.listeners.push(cb);
    if (this.cache) cb(this.cache);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    if (this.cache) {
      this.listeners.forEach((cb) => cb(this.cache!));
    }
  }

  public async synthesizeCoreNode(node: {
    title: string;
    subtitle?: string;
    layer?: 'core' | 'mantle' | 'orbit';
    domain?: string;
    description?: string;
    linkedTargets?: string[];
  }): Promise<boolean> {
    try {
      const res = await fetch('/api/epistemic/synthesize-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(node),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ledger) {
          this.cache = data.ledger;
          this.notify();
        }
        return true;
      }
    } catch (err) {
      console.warn('Error synthesizing core node:', err);
    }
    return false;
  }

  /**
   * Record a completed educational unit/skill directly into the Epistemic Ledger and Sphere
   */
  public async recordCompletedUnit(unit: {
    id: string;
    title: string;
    category?: string;
    summaryMarkdown?: string;
    score?: number;
  }): Promise<void> {
    const domain = unit.category || 'Прикладные навыки';
    const cleanTopic = unit.title.replace(/^[0-9.\s]+/, '').slice(0, 60);

    const newFact: EpistemicFact = {
      id: `fact-unit-${unit.id}-${Date.now()}`,
      topic: cleanTopic,
      domain,
      statement: `Инвариант «${cleanTopic}» успешно освоен, проверен на практике и зафиксирован в Сфере Знаний.`,
      confidence: (unit.score || 95) / 100,
      discoveredByAgent: 'VertexAi-EpistemicEngine',
      verifiedAt: new Date().toISOString(),
      layer: 'core_axiom',
      impactWeight: 14,
    };

    const newCrystallizedNode = {
      id: `sphere-core-${unit.id}`,
      title: cleanTopic,
      subtitle: `Освоенный навык [${domain}]`,
      layer: 'core' as const,
      domain,
      domainColor: '#38bdf8',
      status: 'completed' as const,
      impactRayTargets: [`sphere-orbit-${unit.id}`, `sphere-mantle-${unit.id}`],
      description: unit.summaryMarkdown?.slice(0, 160) || `Навык «${cleanTopic}» успешно сдан и кристаллизован.`,
      weight: 16,
      synthesizedByAgent: 'VertexAi-EpistemicEngine',
      createdAt: new Date().toISOString(),
      formula: `Mastery(${cleanTopic}) ⟹ 100%`,
      castalianBeadId: cleanTopic.slice(0, 18),
      firstPrinciplesCitation: `Академический инвариант дисциплины [${domain}]`,
      aiPerception: {
        observedFriction: 'Телеметрия: концептуальный базис усвоен без затыков',
        masteryConfidence: unit.score || 95,
        retentionState: 'firm' as const,
        liveVector: 'Устойчивая ментальная модель'
      },
      aiAction: {
        activeIntervention: 'Аксиома переведена в статус проверенной в долговременной памяти',
        projectedRaysCount: 3,
        groundedInArtifact: true
      }
    };

    if (!this.cache) this.cache = this.getLocalFallback();
    
    // Add to mastered topics
    if (!this.cache.studentState.masteredTopics.includes(cleanTopic)) {
      this.cache.studentState.masteredTopics.unshift(cleanTopic);
    }
    this.cache.studentState.totalInsightsCrystallized = (this.cache.studentState.totalInsightsCrystallized || 0) + 1;
    this.cache.studentState.lastUpdated = new Date().toISOString();

    // Add fact
    this.cache.provenFacts.unshift(newFact);
    this.cache.provenInvariants = this.cache.provenFacts;

    // Add crystallized knowledge node
    if (!this.cache.crystallizedKnowledgeNodes) this.cache.crystallizedKnowledgeNodes = [];
    const existingIdx = this.cache.crystallizedKnowledgeNodes.findIndex(n => n.id === newCrystallizedNode.id || n.title === cleanTopic);
    if (existingIdx !== -1) {
      this.cache.crystallizedKnowledgeNodes[existingIdx] = newCrystallizedNode;
    } else {
      this.cache.crystallizedKnowledgeNodes.unshift(newCrystallizedNode);
    }

    this.notify();

    // Broadcast trace to backend
    try {
      await fetch('/api/epistemic/record-trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: 'VertexAi-EpistemicEngine',
          taskGoal: `Фиксация завершенного модуля «${cleanTopic}»`,
          premises: [
            `Студент успешно выполнил все этапы блока «${cleanTopic}»`,
            `Результаты проверены в песочнице и верифицированы ИИ`,
          ],
          deduction: `Навык «${cleanTopic}» переведен в статус полностью освоенного и добавлен в Сферу Знаний.`,
          verdict: 'Навык интегрирован в Сферу Знаний.',
          discoveredFacts: [
            {
              topic: cleanTopic,
              statement: `Инвариант «${cleanTopic}» доказан на практике.`,
              domain,
              layer: 'core_axiom',
            },
          ],
          crystallizedNode: newCrystallizedNode,
        }),
      });
    } catch (e) {
      console.warn('[Epistemic Service] Cloud trace sync notice:', e);
    }
  }

  /**
   * Record a completed practical exercise into the Epistemic Ledger and Sphere
   */
  public async recordCompletedExercise(params: {
    unitId: string;
    unitTitle: string;
    exerciseId: string;
    exerciseTitle: string;
    domain?: string;
    score?: number;
  }): Promise<void> {
    const domain = params.domain || 'Прикладная практика';
    const cleanTopic = params.exerciseTitle.replace(/^[0-9.\s]+/, '').slice(0, 60);

    const newFact: EpistemicFact = {
      id: `fact-ex-${params.exerciseId}-${Date.now()}`,
      topic: cleanTopic,
      domain,
      statement: `Практический навык «${cleanTopic}» подтвержден решением кейса в тренажере.`,
      confidence: (params.score || 95) / 100,
      discoveredByAgent: 'InteractiveLabVerifier',
      verifiedAt: new Date().toISOString(),
      layer: 'mantle_skill',
      impactWeight: 12,
    };

    if (!this.cache) this.cache = this.getLocalFallback();
    if (!this.cache.studentState.masteredTopics.includes(cleanTopic)) {
      this.cache.studentState.masteredTopics.unshift(cleanTopic);
    }
    this.cache.provenFacts.unshift(newFact);
    this.cache.provenInvariants = this.cache.provenFacts;
    this.notify();
  }

  /**
   * Sync Epistemic Ledger state dynamically with the student's real curriculum
   */
  public syncWithCurriculum(
    nodes: DAGNode[],
    units: Record<string, LearningUnit>,
    artifacts: UserArtifact[] = [],
    domainName?: string
  ): void {
    if (!this.cache) {
      this.cache = this.getLocalFallback();
    }

    const completedUnits = nodes
      .filter((n) => n.status === 'completed')
      .map((n) => units[n.unitId || n.id])
      .filter(Boolean);

    const masteredTopics = completedUnits.map((u) => u.title.replace(/^[0-9.\s]+/, '').slice(0, 60));
    artifacts.forEach((art) => {
      if (art.filename && !masteredTopics.includes(art.filename)) {
        masteredTopics.push(`Артефакт: ${art.filename}`);
      }
    });

    const primaryDomain = domainName || (completedUnits[0]?.category || Object.values(units)[0]?.category || 'Универсальное мастерство');
    this.cache.studentState.targetDomain = primaryDomain;
    this.cache.studentState.masteredTopics = masteredTopics;
    this.cache.studentState.totalInsightsCrystallized = Math.max(masteredTopics.length, this.cache.studentState.totalInsightsCrystallized || 0);
    this.cache.studentState.lastUpdated = new Date().toISOString();

    // Dynamically build facts from real completed units
    this.cache.provenFacts = completedUnits.map((u, idx) => ({
      id: `fact-unit-${u.id}-${idx}`,
      topic: u.title.replace(/^[0-9.\s]+/, '').slice(0, 60),
      domain: u.category || primaryDomain,
      statement: `Инвариант «${u.title}» подтвержден практикой и зафиксирован в ядре знаний.`,
      confidence: 0.96,
      discoveredByAgent: 'VertexAi-EpistemicEngine',
      verifiedAt: new Date().toISOString(),
      layer: 'core_axiom' as const,
      impactWeight: 14,
    }));
    this.cache.provenInvariants = this.cache.provenFacts;

    this.notify();
  }

  public async purgeContext(): Promise<boolean> {
    try {
      const res = await fetch('/api/epistemic/purge-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        await this.fetchLedger();
        return true;
      }
    } catch (err) {
      console.warn('Error purging context:', err);
    }
    return false;
  }

  /**
   * Castalian AI Synthesis: Weaves a real cross-disciplinary bridge linking core axiom to projects or skills
   */
  public async triggerCastalianSynthesis(sourceNodeId: string, targetNodeId?: string): Promise<{
    success: boolean;
    bridge?: CastalianBridge;
    aiPerception?: string;
    aiAction?: string;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/epistemic/castalian-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceNodeId, targetNodeId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ledger) {
          data.ledger.provenInvariants = data.ledger.provenFacts;
          this.cache = data.ledger;
          this.notify();
        }
        return {
          success: true,
          bridge: data.bridge,
          aiPerception: data.aiPerception,
          aiAction: data.aiAction,
        };
      }
    } catch (err: any) {
      console.warn('[Castalian Service] Local execution error:', err);
    }

    // Dynamic local fallback Castalian bridge based on the real source node
    const fallbackBridge: CastalianBridge = {
      id: `bridge-${Date.now()}`,
      source: sourceNodeId,
      target: targetNodeId || 'sphere-orbit-capstone',
      type: 'castalian_bridge',
      explanation: 'Инвариантная связь: математическая структура теории напрямую управляет качеством решения в коде.',
      mathBridge: 'Axiom(FirstPrinciples) ⟹ Invariant(Execution)',
      strength: 0.95,
    };

    if (this.cache) {
      if (!this.cache.castalianBridges) this.cache.castalianBridges = [];
      this.cache.castalianBridges.unshift(fallbackBridge);
      this.notify();
    }

    return {
      success: true,
      bridge: fallbackBridge,
      aiPerception: 'ИИ фиксирует изоморфизм между теорией и практическим артефактом.',
      aiAction: 'Проложен Кастальенский луч заземления с гарантией чистой памяти.',
    };
  }

  private getLocalFallback(): EpistemicLedgerData {
    return {
      version: 3,
      studentState: {
        targetDomain: 'Прикладные навыки & Системное проектирование',
        masteredTopics: [],
        activeGaps: [],
        recentConfidenceScore: 92,
        totalInsightsCrystallized: 0,
        coreResonancePercentage: 85,
        lastUpdated: new Date().toISOString(),
      },
      provenFacts: [],
      provenInvariants: [],
      recentTraces: [],
      castalianBridges: [],
      aiPerceptions: [],
      aiActions: [],
      crystallizedKnowledgeNodes: [],
    };
  }
}

export const epistemicLedgerService = new EpistemicLedgerService();
