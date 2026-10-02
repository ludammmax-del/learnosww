import { DAGNode, DAGEdge, LearningUnit, UserArtifact, KnowledgeSphereNode, KnowledgeSphereLink, KnowledgeSphereTelemetry } from '../types.ts';
import { epistemicLedgerService, EpistemicLedgerData } from './epistemicLedgerService.ts';
import { telemetryEngine } from './telemetryEngine.ts';

// Color palette per domain
export const DOMAIN_COLORS: Record<string, string> = {
  'Архитектура': '#38bdf8', // Sky
  'Системы': '#818cf8', // Indigo
  'Программирование': '#34d399', // Emerald
  'Алгоритмы': '#fbbf24', // Amber
  'Безопасность': '#f87171', // Rose
  'Базы данных': '#a78bfa', // Purple
  'Мета-обучение': '#f472b6', // Pink
  'Инженерия': '#2dd4bf', // Teal
  'Универсальное': '#38bdf8',
};

// Layer Radii
export const SPHERE_RADII = {
  core: 52,    // 🧠 Core Theory (dense center)
  mantle: 110, // ⚡ Mantle Skills (practice)
  orbit: 175,  // 🚀 Orbit Projects & Artifacts (satellites)
};

/**
 * Domain sector angles for topological constellation clustering
 */
const DOMAIN_SECTOR_ANGLES: Record<string, number> = {
  'Архитектура': 0.0,
  'Системы': (2 * Math.PI) / 7,
  'Базы данных': (4 * Math.PI) / 7,
  'Алгоритмы': (6 * Math.PI) / 7,
  'Программирование': (8 * Math.PI) / 7,
  'Инженерия': (10 * Math.PI) / 7,
  'Мета-обучение': (12 * Math.PI) / 7,
  'Безопасность': (3 * Math.PI) / 7,
};

/**
 * Distribute points on a sphere shell using Fibonacci spiral with domain sector gravitational bias
 */
function getFibonacciSpherePoint(
  index: number, 
  total: number, 
  radius: number,
  domain?: string
): { x: number; y: number; z: number } {
  if (total <= 1) {
    return { x: 0, y: radius, z: 0 };
  }
  const phi = Math.acos(1 - 2 * (index + 0.5) / total);
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  let theta = 2 * Math.PI * index / goldenRatio;

  // Apply gentle domain gravitation sector bias if domain is specified
  if (domain && DOMAIN_SECTOR_ANGLES[domain] !== undefined) {
    const targetSector = DOMAIN_SECTOR_ANGLES[domain];
    const blendFactor = 0.35; // 35% gravitational pull towards domain constellation
    theta = theta * (1 - blendFactor) + targetSector * blendFactor;
  }

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return { x, y, z };
}

export class KnowledgeSphereEngine {
  /**
   * Build complete 3D sphere model from real student skills + Epistemic Ledger + verified artifacts
   */
  public generateSphereModel(
    dagNodes: DAGNode[],
    _dagEdges: DAGEdge[],
    units: Record<string, LearningUnit>,
    artifacts: UserArtifact[],
    customLedger?: EpistemicLedgerData,
    options?: { onlyCompleted?: boolean }
  ): {
    nodes: KnowledgeSphereNode[];
    links: KnowledgeSphereLink[];
    telemetry: KnowledgeSphereTelemetry;
  } {
    const sphereNodes: KnowledgeSphereNode[] = [];
    const sphereLinks: KnowledgeSphereLink[] = [];
    const ledger = customLedger || epistemicLedgerService.getCachedLedger();

    // 1. Filter nodes based on user preference (Only Real Completed Skills vs Full Curriculum)
    const effectiveDagNodes = options?.onlyCompleted
      ? dagNodes.filter(n => n.status === 'completed')
      : dagNodes;

    // If onlyCompleted is chosen but nothing completed yet, fallback to at least active node so sphere is responsive
    const nodesToProcess = (options?.onlyCompleted && effectiveDagNodes.length === 0)
      ? dagNodes.filter(n => n.status === 'active' || n.status === 'completed').slice(0, 1)
      : (effectiveDagNodes.length > 0 ? effectiveDagNodes : dagNodes.slice(0, 3));

    // 1. Group & classify DAG nodes and Units into Core Theory vs Mantle Skills vs Orbit Projects
    const coreItems: Array<{ 
      id: string; 
      title: string; 
      subtitle: string; 
      domain: string; 
      status: any; 
      unitId?: string; 
      dagId: string; 
      description?: string; 
      weight?: number; 
      isAiSynthesized?: boolean; 
      formula?: string; 
      castalianBeadId?: string; 
      firstPrinciplesCitation?: string; 
      aiPerception?: any; 
      aiAction?: any 
    }> = [];

    const mantleItems: Array<{ 
      id: string; 
      title: string; 
      subtitle: string; 
      domain: string; 
      status: any; 
      unitId?: string; 
      dagId: string; 
      description?: string; 
      weight?: number; 
      isAiSynthesized?: boolean 
    }> = [];

    const orbitItems: Array<{ 
      id: string; 
      title: string; 
      subtitle: string; 
      domain: string; 
      status: any; 
      unitId?: string; 
      dagId: string; 
      artifactUrl?: string; 
      description?: string; 
      weight?: number; 
      isAiSynthesized?: boolean 
    }> = [];

    // Process every real unit and DAG node in the curriculum
    nodesToProcess.forEach((node, nodeIdx) => {
      const unit = units[node.unitId || node.id];
      const domain = unit?.category || (node.phaseTitle?.includes('Систем') ? 'Системы' : node.phaseTitle?.includes('Архитектур') ? 'Архитектура' : 'Программирование');
      const isCompleted = node.status === 'completed';

      // 1. CORE THEORY NODE: Fundamental invariants, theorems, and primary sources
      const primarySource = unit?.groundingSources?.[0];
      const primaryTerm = unit?.glossaryTerms?.[0];
      const cleanTitle = (unit?.title || node.title).replace(/^[0-9.\s]+/, '');

      coreItems.push({
        id: `sphere-core-${node.id}`,
        title: cleanTitle,
        subtitle: primaryTerm ? `Инвариант: ${primaryTerm.term}` : (isCompleted ? `Освоенный инвариант [${domain}]` : (node.subtitle || 'Теория и принципы')),
        domain,
        status: node.status,
        unitId: node.unitId,
        dagId: node.id,
        description: unit?.summaryMarkdown || primaryTerm?.definition || node.subtitle || `Ключевой фундаментальный инвариант по теме «${cleanTitle}».`,
        weight: isCompleted ? 2.8 : 1.0,
        formula: primaryTerm ? `${primaryTerm.term} ⟹ ${primaryTerm.definition.slice(0, 60)}...` : `∀x ∈ ${domain}: Mastery(${cleanTitle.slice(0, 22)}) ⟹ 100%`,
        castalianBeadId: `Бисер: ${cleanTitle.slice(0, 22)}`,
        firstPrinciplesCitation: primarySource ? `${primarySource.title} (${primarySource.authors || primarySource.sourceLabel})` : `Рецензируемый первоисточник дисциплины [${domain}]`,
        aiPerception: {
          observedFriction: isCompleted ? `Телеметрия: концептуальный базис освоен и проверен на практике (${node.score || 95}%)` : (node.status === 'active' ? 'В процессе активного освоения' : 'В плане обучения'),
          masteryConfidence: isCompleted ? (node.score || 98) : (node.status === 'active' ? 65 : 0),
          retentionState: isCompleted ? 'firm' : 'untested',
          liveVector: isCompleted ? 'Инвариант зафиксирован в долговременной памяти' : 'Формирование ментальной модели'
        },
        aiAction: {
          activeIntervention: isCompleted ? 'Аксиома соединена лучами влияния с практическими навыками и артефактами' : 'Ожидание выполнения практических тренажеров',
          projectedRaysCount: isCompleted ? 3 : 1,
          groundedInArtifact: isCompleted,
          lastPurgedReasoningTrace: 'Транзитный шум изолирован, дедукция подтверждена.'
        }
      });

      // 2. MANTLE PRACTICAL SKILL NODE: Hands-on labs, defect hunts, quizzes & code exercises
      const practicalEx = unit?.practicalExercises?.[0];
      mantleItems.push({
        id: `sphere-mantle-${node.id}`,
        title: practicalEx ? `Навык: ${practicalEx.title}` : `Практика: ${cleanTitle}`,
        subtitle: practicalEx ? `Тренажер [${practicalEx.type}]` : 'Прикладной тренажер & Экспресс-тест',
        domain,
        status: node.status,
        unitId: node.unitId,
        dagId: node.id,
        description: practicalEx ? practicalEx.taskPrompt : (unit?.summaryMarkdown || node.subtitle || `Прикладная отработка навыка «${cleanTitle}».`),
        weight: isCompleted ? 3.0 : 1.2,
      });

      // 3. ORBIT PROJECT / CAPSTONE / ARTIFACT NODE: Real-world engineering & peer outcomes
      if (unit?.projectTask || node.type === 'project' || node.type === 'pair' || (node as any).isPairWork) {
        orbitItems.push({
          id: `sphere-orbit-${node.id}`,
          title: unit?.projectTask?.title || `Боевой кейс: ${cleanTitle}`,
          subtitle: unit?.projectTask?.role ? `${unit.projectTask.role} · Проект` : (node.subtitle || 'Боевой проект'),
          domain,
          status: node.status,
          unitId: node.unitId,
          dagId: node.id,
          description: unit?.projectTask?.description || unit?.projectTask?.businessScenario || unit?.summaryMarkdown || node.subtitle,
          weight: isCompleted ? 3.6 : 2.0,
        });
      }

      // 4. Milestone Capstone 10 Project (if milestone block)
      if (unit?.is10BlockMilestone && unit?.capstone10Project) {
        orbitItems.push({
          id: `sphere-capstone-${node.id}`,
          title: `🏆 ${unit.capstone10Project.title}`,
          subtitle: `Большой сквозной проект синтеза (Milestone ${unit.capstone10Project.milestoneNumber})`,
          domain: 'Инженерия',
          status: isCompleted ? 'completed' : 'locked',
          unitId: node.unitId,
          dagId: node.id,
          description: unit.capstone10Project.businessScenario,
          weight: 4.5,
        });
      }
    });

    // Ingest live AI-crystallized nodes from the Epistemic Ledger (if any generated during sessions)
    if (ledger?.crystallizedKnowledgeNodes && ledger.crystallizedKnowledgeNodes.length > 0) {
      ledger.crystallizedKnowledgeNodes.forEach((ck) => {
        const exists = coreItems.some(c => c.id === ck.id || c.title === ck.title);
        if (!exists) {
          coreItems.push({
            id: ck.id,
            title: ck.title,
            subtitle: `[🧠 ${ck.castalianBeadId || 'Освоенный инвариант'}] · ${ck.subtitle}`,
            domain: ck.domain,
            status: ck.status,
            dagId: ck.id,
            description: `${ck.description} (Верифицировано: ${ck.synthesizedByAgent})`,
            weight: ck.weight || 16,
            isAiSynthesized: true,
            formula: ck.formula,
            castalianBeadId: ck.castalianBeadId,
            firstPrinciplesCitation: ck.firstPrinciplesCitation,
            aiPerception: ck.aiPerception,
            aiAction: ck.aiAction,
          });
        }
      });
    }

    // Add real verified user artifacts as prominent Orbit nodes
    artifacts.forEach((art, idx) => {
      const artId = `sphere-orbit-art-${art.id || idx}`;
      const exists = orbitItems.some(o => o.id === artId || o.title === art.filename);
      if (!exists) {
        orbitItems.push({
          id: artId,
          title: `📄 ${art.filename}`,
          subtitle: `Артефакт: ${art.unitTitle || 'Реализованный проект'} (${art.score || 100}%)`,
          domain: 'Инженерия',
          status: 'completed',
          dagId: 'artifact-node',
          description: art.fileContent ? art.fileContent.slice(0, 180) + '...' : 'Реализованный код и артефакт ученика',
          weight: 3.5,
        });
      }
    });

    // 2. Position nodes in 3D Spherical Shells using Fibonacci Spiral
    // Shell 1: Core Theory (R = 52)
    coreItems.forEach((item, index) => {
      const pos = getFibonacciSpherePoint(index, coreItems.length, SPHERE_RADII.core, item.domain);
      const color = DOMAIN_COLORS[item.domain] || '#38bdf8';
      sphereNodes.push({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        layer: 'core',
        domain: item.domain,
        domainColor: color,
        status: item.status,
        unitId: item.unitId,
        dagNodeId: item.dagId,
        x: pos.x,
        y: pos.y,
        z: pos.z,
        radius: SPHERE_RADII.core,
        size: item.isAiSynthesized ? 5.2 : 3.8,
        weight: item.weight || 1.0,
        impactProjectIds: [],
        underlyingTheoryIds: [],
        description: item.description,
        practiceCount: item.status === 'completed' ? 4 : 1,
        formula: (item as any).formula,
        castalianBeadId: (item as any).castalianBeadId,
        firstPrinciplesCitation: (item as any).firstPrinciplesCitation,
        aiPerception: (item as any).aiPerception,
        aiAction: (item as any).aiAction,
      });
    });


    // Shell 2: Mantle Skills (R = 110)
    mantleItems.forEach((item, index) => {
      const pos = getFibonacciSpherePoint(index, mantleItems.length, SPHERE_RADII.mantle, item.domain);
      const color = DOMAIN_COLORS[item.domain] || '#818cf8';
      sphereNodes.push({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        layer: 'mantle',
        domain: item.domain,
        domainColor: color,
        status: item.status,
        unitId: item.unitId,
        dagNodeId: item.dagId,
        x: pos.x,
        y: pos.y,
        z: pos.z,
        radius: SPHERE_RADII.mantle,
        size: item.isAiSynthesized ? 5.6 : 4.4,
        weight: item.weight || 1.2,
        impactProjectIds: [],
        underlyingTheoryIds: [],
        description: item.description,
        practiceCount: item.status === 'completed' ? 6 : 2
      });
    });

    // Shell 3: Outer Orbit Projects (R = 175)
    orbitItems.forEach((item, index) => {
      const pos = getFibonacciSpherePoint(index, orbitItems.length, SPHERE_RADII.orbit, item.domain);
      const color = DOMAIN_COLORS[item.domain] || '#34d399';
      sphereNodes.push({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        layer: 'orbit',
        domain: item.domain,
        domainColor: color,
        status: item.status,
        unitId: item.unitId,
        dagNodeId: item.dagId,
        x: pos.x,
        y: pos.y,
        z: pos.z,
        radius: SPHERE_RADII.orbit,
        size: item.isAiSynthesized ? 6.8 : 5.8,
        weight: item.weight || 2.0,
        impactProjectIds: [],
        underlyingTheoryIds: [],
        description: item.description,
        practiceCount: item.status === 'completed' ? 10 : 3
      });
    });

    // 3. Establish Multi-layered Links and Impact Rays (Core -> Mantle -> Orbit)
    const coreNodes = sphereNodes.filter(n => n.layer === 'core');
    const mantleNodes = sphereNodes.filter(n => n.layer === 'mantle');
    const orbitNodes = sphereNodes.filter(n => n.layer === 'orbit');

    // 3a. Dynamic Intra-Core Axiomatic Geodesic Links (Connecting the student's real core nodes)
    for (let i = 0; i < coreNodes.length; i++) {
      for (let j = i + 1; j < coreNodes.length; j++) {
        const c1 = coreNodes[i];
        const c2 = coreNodes[j];
        const sameDomain = c1.domain === c2.domain;
        const bothCompleted = c1.status === 'completed' && c2.status === 'completed';

        // Link if in same domain or if creating primary geodesic chain
        if (sameDomain || j === i + 1 || (bothCompleted && sphereLinks.length < 24)) {
          sphereLinks.push({
            id: `core-geodesic-${c1.id}-${c2.id}`,
            source: c1.id,
            target: c2.id,
            type: 'castalian_geodesic',
            strength: bothCompleted ? 0.98 : 0.85,
            castalianExplanation: `Инвариантная связь первоисточников: «${c1.title}» ⟷ «${c2.title}»`,
            mathematicalBridge: `Invariant(${c1.title.slice(0, 15)}) ⟷ Invariant(${c2.title.slice(0, 15)})`,
          });
        }
      }
    }

    // Ensure all core nodes form a closed connected geodesic ring
    if (coreNodes.length > 2) {
      const first = coreNodes[0];
      const last = coreNodes[coreNodes.length - 1];
      const alreadyLinked = sphereLinks.some(l => 
        (l.source === first.id && l.target === last.id) || (l.source === last.id && l.target === first.id)
      );
      if (!alreadyLinked) {
        sphereLinks.push({
          id: `core-ring-${first.id}-${last.id}`,
          source: first.id,
          target: last.id,
          type: 'core_to_core_invariant',
          strength: 0.90,
          castalianExplanation: `Аксиоматическое замыкание ядра: «${first.title}» ⟷ «${last.title}»`,
          mathematicalBridge: 'Axiom_First ⨂ Axiom_Last ⟹ Complete_Domain_Core',
        });
      }
    }

    // Link Core Theory to Mantle Skills
    coreNodes.forEach((coreNode, cIdx) => {
      // Connect to nearest 1-2 mantle skills or by domain
      const targetMantles = mantleNodes.filter(m => m.domain === coreNode.domain);
      const targetsToConnect = targetMantles.length > 0 
        ? targetMantles.slice(0, 2) 
        : [mantleNodes[cIdx % Math.max(1, mantleNodes.length)]].filter(Boolean);

      targetsToConnect.forEach((mantleNode) => {
        if (!mantleNode) return;
        sphereLinks.push({
          id: `link-${coreNode.id}-${mantleNode.id}`,
          source: coreNode.id,
          target: mantleNode.id,
          type: 'theory_to_skill',
          strength: 0.85
        });
        if (!mantleNode.underlyingTheoryIds) mantleNode.underlyingTheoryIds = [];
        mantleNode.underlyingTheoryIds.push(coreNode.id);
      });
    });

    // Link Mantle Skills to Orbit Projects
    mantleNodes.forEach((mantleNode, mIdx) => {
      const targetProjects = orbitNodes.filter(p => p.domain === mantleNode.domain);
      const projectsToConnect = targetProjects.length > 0 
        ? targetProjects.slice(0, 2) 
        : [orbitNodes[mIdx % Math.max(1, orbitNodes.length)]].filter(Boolean);

      projectsToConnect.forEach((orbitNode) => {
        if (!orbitNode) return;
        sphereLinks.push({
          id: `link-${mantleNode.id}-${orbitNode.id}`,
          source: mantleNode.id,
          target: orbitNode.id,
          type: 'skill_to_project',
          strength: 0.95
        });
        if (!orbitNode.underlyingTheoryIds) orbitNode.underlyingTheoryIds = [];
        orbitNode.underlyingTheoryIds.push(mantleNode.id);
      });
    });

    // Direct High-impact Core to Orbit Rays (when projects rely heavily on core foundations)
    orbitNodes.forEach((orbitNode, oIdx) => {
      const relatedCores = coreNodes.filter(c => c.domain === orbitNode.domain);
      const coreTarget = relatedCores[oIdx % Math.max(1, relatedCores.length)] || coreNodes[0];
      if (coreTarget) {
        sphereLinks.push({
          id: `impact-ray-${coreTarget.id}-${orbitNode.id}`,
          source: coreTarget.id,
          target: orbitNode.id,
          type: 'direct_impact_ray',
          strength: 1.0
        });
        if (!coreTarget.impactProjectIds) coreTarget.impactProjectIds = [];
        coreTarget.impactProjectIds.push(orbitNode.id);

        // Increase core weight dynamically as projects link to it!
        coreTarget.weight = (coreTarget.weight || 1.0) + 0.35;
        coreTarget.size = Math.min(8.5, coreTarget.size + 0.4);
      }
    });

    // Ingest Real Castalian Bridges & Resonances (Glass Bead Game Links)
    if (ledger?.castalianBridges && ledger.castalianBridges.length > 0) {
      ledger.castalianBridges.forEach((b) => {
        const sourceExists = sphereNodes.some(n => n.id === b.source);
        const targetExists = sphereNodes.some(n => n.id === b.target);
        // Connect even if target is mapped to orbit capstone or fallback
        const effectiveTarget = targetExists ? b.target : (orbitNodes[0]?.id || b.target);
        if (sourceExists && effectiveTarget) {
          sphereLinks.push({
            id: b.id,
            source: b.source,
            target: effectiveTarget,
            type: (b.type as any) || 'castalian_bridge',
            strength: b.strength || 1.0,
            castalianExplanation: b.explanation,
            mathematicalBridge: b.mathBridge,
          });
        }
      });
    }

    // 4. Calculate Telemetry

    const completedNodes = sphereNodes.filter(n => n.status === 'completed').length;
    const activeNodes = sphereNodes.filter(n => n.status === 'active').length;
    const coreActiveCount = coreNodes.filter(n => n.status === 'completed' || n.status === 'active').length;
    const orbitCount = orbitNodes.length;
    const coreRatio = coreNodes.length > 0 ? (coreActiveCount / coreNodes.length) : 0;
    const orbitRatio = orbitNodes.length > 0 ? (orbitNodes.filter(o => o.status === 'completed').length / orbitNodes.length) : 0;
    
    // Core Resonance is higher when theory is actively grounded in projects
    const directImpactCount = sphereLinks.filter(l => l.type === 'direct_impact_ray').length;
    const coreResonance = Math.min(99, Math.round(55 + (coreRatio * 20) + (orbitRatio * 15) + Math.min(10, directImpactCount * 2)));

    let coreStabilityStatus: KnowledgeSphereTelemetry['coreStabilityStatus'] = 'balanced';
    if (coreNodes.length > 6 && orbitCount === 0) {
      coreStabilityStatus = 'overheated'; // Too much pure theory without practice
    } else if (coreRatio < 0.25) {
      coreStabilityStatus = 'unstable'; // Not enough fundamental grounding
    } else {
      coreStabilityStatus = 'harmonic'; // Perfect theory-to-project equilibrium
    }

    const cogTelemetry = telemetryEngine.getState();
    const dynamicResonance = cogTelemetry.coreResonancePercentage 
      ? Math.round((cogTelemetry.coreResonancePercentage + (ledger?.studentState?.coreResonancePercentage || coreResonance)) / 2)
      : (ledger?.studentState?.coreResonancePercentage || coreResonance);

    const telemetry: KnowledgeSphereTelemetry = {
      totalNodes: sphereNodes.length,
      coreNodesCount: coreNodes.length,
      mantleNodesCount: mantleNodes.length,
      orbitNodesCount: orbitNodes.length,
      totalImpactRays: directImpactCount,
      coreStabilityPercent: Math.round((completedNodes / Math.max(1, sphereNodes.length)) * 100),
      coreStatus: coreStabilityStatus === 'overheated' ? 'overheated' : coreStabilityStatus === 'harmonic' ? 'harmonious' : 'balanced',
      coreStabilityStatus,
      coreResonancePercentage: dynamicResonance,
      totalAxiomsCount: coreNodes.length,
      activeSkillsCount: mantleNodes.length,
      realProjectsCount: orbitNodes.length,
      directImpactRaysCount: directImpactCount,
      energyLevel: Math.round((completedNodes * 10 + activeNodes * 5) + (cogTelemetry.autoCrystallizedAxiomCount || 0) * 8),
      recommendedAction: coreStabilityStatus === 'overheated'
        ? '⚠️ Ядро перегружено сухой теорией! Телеметрия рекомендует заземлить знания в боевой проект.'
        : coreStabilityStatus === 'unstable'
        ? '💡 Недостаточно базовых аксиом: завершите модули для автоматической кристаллизации ядра.'
        : '✨ Ядро находится в гармоническом резонансе: телеметрия фиксирует баланс фундамента и практики!',
      unlinkedTheoryCount: coreNodes.filter(c => !c.impactProjectIds || c.impactProjectIds.length === 0).length,
      heaviestNodeTitle: sphereNodes.sort((a,b) => b.weight - a.weight)[0]?.title || 'Фундамент',
      heaviestNodeMass: sphereNodes.sort((a,b) => b.weight - a.weight)[0]?.weight || 10,
      averageRetentionPct: Math.max(75, 96 - Math.round(cogTelemetry.overallCognitiveLoad * 0.15)),
      autoCoreFillingActive: true,
      telemetrySignalsProcessed: cogTelemetry.signals.length,
      lastTelemetryTrigger: cogTelemetry.lastAutoCrystallizedTopic || cogTelemetry.signals[0]?.details || 'Телеметрия в реальном времени',
      castalianResonanceScore: ledger?.studentState?.coreResonancePercentage || 91,
      castalianBridgesCount: (ledger?.castalianBridges?.length || 0),
      aiPerceptionLog: (ledger?.aiPerceptions || []).map(p => `[${p.severity.toUpperCase()}] ${p.observation}`),
      aiActionLog: (ledger?.aiActions || []).map(a => `[${a.actionType}] ${a.description}`),
    };


    return {
      nodes: sphereNodes,
      links: sphereLinks,
      telemetry
    };
  }

  /**
   * Trace impact from a specific core or mantle node outwards to orbit projects
   */
  public traceImpactRay(
    nodeId: string,
    allNodes: KnowledgeSphereNode[],
    allLinks: KnowledgeSphereLink[]
  ): {
    impactedProjects: KnowledgeSphereNode[];
    connectedSkills: KnowledgeSphereNode[];
    highlightLinkIds: Set<string>;
  } {
    const highlightLinkIds = new Set<string>();
    const impactedProjects: KnowledgeSphereNode[] = [];
    const connectedSkills: KnowledgeSphereNode[] = [];

    // Find directly and indirectly connected nodes
    allLinks.forEach((link) => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;

      if (sourceId === nodeId || targetId === nodeId) {
        highlightLinkIds.add(link.id);
        const otherId = sourceId === nodeId ? targetId : sourceId;
        const otherNode = allNodes.find(n => n.id === otherId);
        if (otherNode) {
          if (otherNode.layer === 'orbit') impactedProjects.push(otherNode);
          if (otherNode.layer === 'mantle') connectedSkills.push(otherNode);
        }
      }
    });

    // Secondary cascade (skills -> projects)
    connectedSkills.forEach((skill) => {
      allLinks.forEach((link) => {
        const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
        const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;

        if (sourceId === skill.id || targetId === skill.id) {
          highlightLinkIds.add(link.id);
          const otherId = sourceId === skill.id ? targetId : sourceId;
          const otherNode = allNodes.find(n => n.id === otherId);
          if (otherNode && otherNode.layer === 'orbit' && !impactedProjects.some(p => p.id === otherNode.id)) {
            impactedProjects.push(otherNode);
          }
        }
      });
    });

    return {
      impactedProjects,
      connectedSkills,
      highlightLinkIds
    };
  }

  /**
   * Project Footprint: Trace inward from an orbit project down into mantle skills and core theory axioms
   */
  public traceProjectFootprint(
    orbitNodeId: string,
    allNodes: KnowledgeSphereNode[],
    allLinks: KnowledgeSphereLink[]
  ): {
    underlyingTheories: KnowledgeSphereNode[];
    requiredSkills: KnowledgeSphereNode[];
    highlightLinkIds: Set<string>;
  } {
    const highlightLinkIds = new Set<string>();
    const underlyingTheories: KnowledgeSphereNode[] = [];
    const requiredSkills: KnowledgeSphereNode[] = [];

    allLinks.forEach((link) => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;

      if (sourceId === orbitNodeId || targetId === orbitNodeId) {
        highlightLinkIds.add(link.id);
        const otherId = sourceId === orbitNodeId ? targetId : sourceId;
        const otherNode = allNodes.find(n => n.id === otherId);
        if (otherNode) {
          if (otherNode.layer === 'core') underlyingTheories.push(otherNode);
          if (otherNode.layer === 'mantle') requiredSkills.push(otherNode);
        }
      }
    });

    // Secondary inward cascade (skills -> core theory)
    requiredSkills.forEach((skill) => {
      allLinks.forEach((link) => {
        const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
        const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;

        if (sourceId === skill.id || targetId === skill.id) {
          highlightLinkIds.add(link.id);
          const otherId = sourceId === skill.id ? targetId : sourceId;
          const otherNode = allNodes.find(n => n.id === otherId);
          if (otherNode && otherNode.layer === 'core' && !underlyingTheories.some(t => t.id === otherNode.id)) {
            underlyingTheories.push(otherNode);
          }
        }
      });
    });

    return {
      underlyingTheories,
      requiredSkills,
      highlightLinkIds
    };
  }
}

export const knowledgeSphereEngine = new KnowledgeSphereEngine();
