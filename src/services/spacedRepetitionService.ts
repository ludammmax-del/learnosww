/**
 * Spaced Repetition & Ebbinghaus Forgetting Curve Engine
 * Implements SM-2 adaptive stability factor calculation, retention percentage tracking,
 * and memory blitz question selection.
 */

export type RetentionState = 'hot' | 'warm' | 'cooling' | 'cold';

export interface MemoryNodeRetention {
  nodeId: string;
  unitId: string;
  topicTitle: string;
  domain?: string;
  completedAt: number; // timestamp
  lastReviewedAt: number; // timestamp
  repetitionCount: number;
  stabilityDays: number; // S in Ebbinghaus formula R = e^(-t/S)
  easeFactor: number; // SM-2 ease factor (default 2.5)
  retentionPercentage: number; // 0..100
  retentionState: RetentionState;
  nextReviewDate: number; // timestamp
  isDueForReview: boolean;
  blitzHistory: Array<{
    timestamp: number;
    grade: 'easy' | 'good' | 'hard' | 'forgot';
    newRetention: number;
  }>;
}

const STORAGE_KEY = 'learning_os_spaced_repetition_v1';
const TIME_OFFSET_KEY = 'learning_os_memory_time_warp_hours';

export class SpacedRepetitionService {
  private records: Map<string, MemoryNodeRetention> = new Map();

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      localStorage.removeItem(TIME_OFFSET_KEY);

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: MemoryNodeRetention) => {
            this.records.set(item.nodeId, item);
          });
        }
      }
    } catch (e) {
      console.warn('Failed to load spaced repetition data:', e);
    }
  }

  public save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(this.records.values())));
    } catch (e) {
      console.warn('Failed to save spaced repetition data:', e);
    }
  }

  /**
   * Returns the real current timestamp used for review scheduling.
   */
  public getEffectiveTime(): number {
    return Date.now();
  }

  /**
   * Record initial completion of a learning node
   */
  public recordNodeCompletion(nodeId: string, unitId: string, topicTitle: string, domain: string = 'Общие навыки'): MemoryNodeRetention {
    const now = this.getEffectiveTime();
    const existing = this.records.get(nodeId);

    if (existing) {
      // Re-completion counts as fresh review
      return this.recordReview(nodeId, 'easy');
    }

    const initialStabilityDays = 1.5; // Starts at ~36 hours stability
    const record: MemoryNodeRetention = {
      nodeId,
      unitId,
      topicTitle,
      domain,
      completedAt: now,
      lastReviewedAt: now,
      repetitionCount: 1,
      stabilityDays: initialStabilityDays,
      easeFactor: 2.5,
      retentionPercentage: 100,
      retentionState: 'hot',
      nextReviewDate: now + initialStabilityDays * 24 * 3600 * 1000,
      isDueForReview: false,
      blitzHistory: [{
        timestamp: now,
        grade: 'easy',
        newRetention: 100,
      }],
    };

    this.records.set(nodeId, record);
    this.save();
    return record;
  }

  /**
   * Calculate current retention percentage according to Ebbinghaus forgetting curve
   * R(t) = exp( - t / (S * easeFactor) ) * 100
   */
  public calculateRetention(record: MemoryNodeRetention): {
    retentionPercentage: number;
    retentionState: RetentionState;
    isDueForReview: boolean;
    daysElapsed: number;
  } {
    const now = this.getEffectiveTime();
    const elapsedMs = Math.max(0, now - record.lastReviewedAt);
    const daysElapsed = elapsedMs / (24 * 3600 * 1000);

    const effectiveStability = Math.max(0.2, record.stabilityDays * (record.easeFactor / 2.5));
    // Ebbinghaus exponential decay
    const decayFraction = Math.exp(-daysElapsed / effectiveStability);
    const retention = Math.min(100, Math.max(5, Math.round(decayFraction * 100)));

    let state: RetentionState = 'hot';
    if (retention >= 85) {
      state = 'hot';
    } else if (retention >= 65) {
      state = 'warm';
    } else if (retention >= 40) {
      state = 'cooling';
    } else {
      state = 'cold';
    }

    const isDue = retention < 75 || now >= record.nextReviewDate;

    return {
      retentionPercentage: retention,
      retentionState: state,
      isDueForReview: isDue,
      daysElapsed,
    };
  }

  /**
   * Get enriched retention data for all completed nodes
   */
  public getAllNodeRetentions(): Map<string, MemoryNodeRetention> {
    const updated = new Map<string, MemoryNodeRetention>();
    this.records.forEach((record, nodeId) => {
      const calc = this.calculateRetention(record);
      updated.set(nodeId, {
        ...record,
        retentionPercentage: calc.retentionPercentage,
        retentionState: calc.retentionState,
        isDueForReview: calc.isDueForReview,
      });
    });
    return updated;
  }

  /**
   * Get retention for a single node (with fallback if not yet completed)
   */
  public getNodeRetention(nodeId: string): MemoryNodeRetention | null {
    const record = this.records.get(nodeId);
    if (!record) return null;

    const calc = this.calculateRetention(record);
    return {
      ...record,
      retentionPercentage: calc.retentionPercentage,
      retentionState: calc.retentionState,
      isDueForReview: calc.isDueForReview,
    };
  }

  /**
   * Record a spaced repetition review / blitz result
   */
  public recordReview(nodeId: string, grade: 'easy' | 'good' | 'hard' | 'forgot'): MemoryNodeRetention {
    const now = this.getEffectiveTime();
    let record = this.records.get(nodeId);

    if (!record) {
      record = {
        nodeId,
        unitId: `unit-${nodeId}`,
        topicTitle: `Квант ${nodeId}`,
        completedAt: now,
        lastReviewedAt: now,
        repetitionCount: 1,
        stabilityDays: 2.0,
        easeFactor: 2.5,
        retentionPercentage: 100,
        retentionState: 'hot',
        nextReviewDate: now + 2 * 24 * 3600 * 1000,
        isDueForReview: false,
        blitzHistory: [],
      };
    }

    let newStability = record.stabilityDays;
    let newEase = record.easeFactor;
    const count = record.repetitionCount + 1;

    switch (grade) {
      case 'easy':
        // Big boost in memory stability
        newEase = Math.min(3.2, newEase + 0.15);
        newStability = count === 1 ? 3 : count === 2 ? 7 : count === 3 ? 16 : record.stabilityDays * 2.4;
        break;
      case 'good':
        newStability = count === 1 ? 2 : count === 2 ? 4 : count === 3 ? 10 : record.stabilityDays * 1.8;
        break;
      case 'hard':
        newEase = Math.max(1.3, newEase - 0.15);
        newStability = Math.max(1.0, record.stabilityDays * 1.2);
        break;
      case 'forgot':
        // Lapse: reset interval back to initial tier
        newEase = Math.max(1.3, newEase - 0.2);
        newStability = 1.0;
        break;
    }

    const nextIntervalMs = newStability * 24 * 3600 * 1000;
    const updatedRecord: MemoryNodeRetention = {
      ...record,
      lastReviewedAt: now,
      repetitionCount: count,
      stabilityDays: Number(newStability.toFixed(1)),
      easeFactor: Number(newEase.toFixed(2)),
      retentionPercentage: grade === 'forgot' ? 80 : 100,
      retentionState: 'hot',
      nextReviewDate: now + nextIntervalMs,
      isDueForReview: false,
      blitzHistory: [
        ...(record.blitzHistory || []),
        {
          timestamp: now,
          grade,
          newRetention: grade === 'forgot' ? 80 : 100,
        }
      ],
    };

    this.records.set(nodeId, updatedRecord);
    this.save();
    return updatedRecord;
  }

  /**
   * Calculates overall learning memory health metrics
   */
  public getMemorySummary(): {
    overallRetentionScore: number;
    totalTrackedNodes: number;
    hotNodesCount: number;
    warmNodesCount: number;
    coolingNodesCount: number;
    coldNodesCount: number;
    dueForReviewCount: number;
    topCoolingTopics: MemoryNodeRetention[];
  } {
    const retentions = Array.from(this.getAllNodeRetentions().values());
    if (retentions.length === 0) {
      return {
        overallRetentionScore: 0,
          totalTrackedNodes: 0,
        hotNodesCount: 0,
        warmNodesCount: 0,
        coolingNodesCount: 0,
        coldNodesCount: 0,
        dueForReviewCount: 0,
        topCoolingTopics: [],
      };
    }

    const totalScore = retentions.reduce((acc, r) => acc + r.retentionPercentage, 0);
    const overallScore = Math.round(totalScore / retentions.length);

    const hot = retentions.filter((r) => r.retentionState === 'hot').length;
    const warm = retentions.filter((r) => r.retentionState === 'warm').length;
    const cooling = retentions.filter((r) => r.retentionState === 'cooling').length;
    const cold = retentions.filter((r) => r.retentionState === 'cold').length;
    const due = retentions.filter((r) => r.isDueForReview).length;

    const sortedByUrgency = [...retentions].sort((a, b) => a.retentionPercentage - b.retentionPercentage);

    return {
      overallRetentionScore: overallScore,
      totalTrackedNodes: retentions.length,
      hotNodesCount: hot,
      warmNodesCount: warm,
      coolingNodesCount: cooling,
      coldNodesCount: cold,
      dueForReviewCount: due,
      topCoolingTopics: sortedByUrgency.slice(0, 5),
    };
  }

  /**
   * Generates an interleaved pair of topics for cross-conceptual synthesis retrieval (Interleaving Effect).
   * Pairs a cooling/due topic with an anchor topic from another completed domain or earlier phase.
   */
  public getInterleavedPairReview(): {
    primaryTopic: MemoryNodeRetention;
    anchorTopic?: MemoryNodeRetention;
    promptSynthesisGoal: string;
  } | null {
    const retentions = Array.from(this.getAllNodeRetentions().values());
    if (retentions.length === 0) return null;

    const dueOrCooling = retentions.filter((r) => r.isDueForReview || r.retentionState === 'cooling' || r.retentionState === 'cold');
    const primary = dueOrCooling.length > 0
      ? dueOrCooling.sort((a, b) => a.retentionPercentage - b.retentionPercentage)[0]
      : retentions.sort((a, b) => a.retentionPercentage - b.retentionPercentage)[0];

    // Find another distinct mastered topic for interleaving
    const otherTopics = retentions.filter((r) => r.nodeId !== primary.nodeId);
    const anchor = otherTopics.length > 0
      ? otherTopics[Math.floor(Math.random() * otherTopics.length)]
      : undefined;

    return {
      primaryTopic: primary,
      anchorTopic: anchor,
      promptSynthesisGoal: anchor
        ? `Сопоставь концепт «${primary.topicTitle}» с принципом «${anchor.topicTitle}»: как объединить оба подхода для решения нестандартной задачи?`
        : `Воспроизведи ключевой инвариант и граничные условия темы «${primary.topicTitle}».`,
    };
  }
}

export const spacedRepetition = new SpacedRepetitionService();
