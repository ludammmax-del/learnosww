export type WindowId = 
  | 'desktop'
  | 'dag' 
  | 'knowledge_sphere'
  | 'knowledge_git'
  | 'textbook_library'
  | 'focus' 
  | 'calendar'
  | 'chat' 
  | 'peer' 
  | 'partner_search'
  | 'white_screen'
  | 'survey'
  | 'admin' 
  | 'widgets' 
  | 'portfolio' 
  | 'notes' 
  | 'settings'
  | (string & {});

export type DesktopWidgetType = 
  | 'pomodoro'
  | 'sticky_note'
  | 'task_list'
  | 'system_monitor'
  | 'ai_insight'
  | 'habits'
  | 'current_unit'
  | 'karma_progress'
  | 'ambient_audio'
  | 'clock_calendar'
  | 'byte_converter'
  | 'quick_links'
  | 'memory_retention';

export interface DesktopWidgetInstance {
  id: string;
  type: DesktopWidgetType;
  title: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  isCollapsed?: boolean;
  color?: string; // For sticky notes: 'amber', 'emerald', 'sky', 'rose', 'purple'
  customData?: any;
}

export type UserSkillLevel = 'beginner' | 'intermediate' | 'master';

export type DiagnosticVerdictType = 'MASTERED_BASE' | 'GAP_DETECTED' | 'NEEDS_CALIBRATION';

export interface BlankQuestionAnalysis {
  questionId: string;
  topic: string;
  questionText: string;
  chosenAnswerText: string;
  verdictType: DiagnosticVerdictType;
  verdictBadge: string;
  aiCommentary: string; // "Ага, базу знает — можно сложнее" or "Тут ответил неверно — подтянем в начале"
  adaptationAction: string; // What changed in curriculum
  targetSprint?: string;
  statusColor?: 'emerald' | 'rose' | 'amber';
}

export interface SkillRealityBriefing {
  skillTitle: string;
  whatWillBeHard: {
    headline: string;
    coreDifficulty: string;
    whyPeopleStruggle: string;
    focusAreas: string[];
  };
  expectedProblems: Array<{
    phase: string;
    problem: string;
    consequence: string;
    antidote: string;
  }>;
  realWorldUtility: {
    everydayBenefit: string;
    careerSuperpower: string;
    personalTransformation: string;
    tangibleOutcomes: string[];
  };
  honestMentorVerdict: string;
}

export interface DiagnosticSummary {
  detectedLevel: string;
  primaryBottleneck: string;
  recommendedPace: string;
  velocityIndex: number;
  totalBlocksCount: number;
  modulesCount: number;
  libraryMaterialsUsed: number;
  aiSynthesizedMaterials: number;
  blankAnalysis?: BlankQuestionAnalysis[];
  topicsMastered?: string[];
  topicsToReinforceAtStart?: string[];
  overallExaminerVerdict?: string;
  adaptationSummary?: string;
  realityBriefing?: SkillRealityBriefing;
  trackScope?: 'full_course' | 'single_topic';
  singleTopicTarget?: string;
}

export interface DiagnosticSurveyData {
  targetGoal: string;
  targetRole?: string;
  skillDomain?: string;
  whyGoal?: string; // Explicit user purpose: "А для чего?" (e.g. startup MVP, senior interview, automation)
  userPurpose?: string;
  userAge?: number | string;
  ageCategory?: string;
  userLevel: UserSkillLevel;
  baggageAndBottlenecks: string;
  timeResource: string;
  thinkingStyle: 'visual' | 'engineering' | 'conceptual';
  calibrationAnswers: Record<string, string>;
  calibrationDetails?: Array<{
    topic: string;
    question: string;
    chosenAnswer: string;
    trait: string;
    questionId?: string;
    scenario?: string;
  }>;
  diagnosticQuestions?: Array<{
    id: string;
    topic: string;
    scenario?: string;
    question: string;
    options: Array<{ id: string; text: string; trait?: string; isCorrect?: boolean }>;
    groundedSource?: GroundingSourceItem;
    citationRef?: string;
  }>;
  trackScope?: 'full_course' | 'single_topic';
  singleTopicTarget?: string;
  customBlocksCount?: number;
}

export interface WindowState {
  id: WindowId;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export type NodeStatus = 'completed' | 'active' | 'locked' | 'stuck_injected';
export type NodeType = 'theory' | 'practice' | 'project' | 'injection' | 'exam' | 'pair';

export interface PairWorkRole {
  title: string;
  badge: string;
  description: string;
  talkingPoints: string[];
  starterPrompt: string;
  evaluationCriteria: string[];
}

export interface PairWorkTask {
  id: string;
  title: string;
  topic: string;
  domain: string;
  scenario: string;
  roleA: PairWorkRole;
  roleB: PairWorkRole;
  roundDurationSec: number;
  aiAgentsNegotiationSummary?: {
    partnerName: string;
    partnerGoal: string;
    partnerSkillDomain: string;
    negotiationLog: string;
    matchScore: number;
    synchronizedNodeTitle: string;
  };
}

export interface LiveSpeechUtterance {
  id: string;
  speaker: 'user' | 'partner';
  speakerName: string;
  text: string;
  timestampSec: number;
  roleAtMoment: string;
  clarityScore?: number;
}

export interface AiOperatorLiveGrade {
  score: number;
  verdict: string;
  strengths: string[];
  recommendations: string[];
  coachAdvice: string;
  operatorName: string;
  evaluatedStudent: string;
}

export interface DAGNode {
  id: string;
  title: string;
  subtitle: string;
  phase: number;
  phaseTitle: string;
  sprint: string;
  type: NodeType;
  status: NodeStatus;
  x: number;
  y: number;
  dependencies: string[];
  unitId: string;
  estimatedTimeMin: number;
  score?: number;
  passingScore?: number;
  artifactRequirement?: string;
  authorName?: string;
  stuckReason?: string;
  sourceType?: 'library' | 'synthesized' | 'ai_generated';
  libraryMatchReason?: string;
  phaseOrder?: number;
  isRemedial?: boolean;
  isAdvanced?: boolean;
  isCalibrated?: boolean;
  isPairWork?: boolean;
  pairTask?: PairWorkTask;
  aiCommentary?: string;
  isAdaptiveUpgraded?: boolean;
  adaptiveUpgradeReason?: string;
  adaptiveProjectTitle?: string;
}

export interface DAGEdge {
  id: string;
  from: string;
  to: string;
  isAlternate?: boolean;
}

export interface QuizQuestion {
  id: string;
  type: 'spot_bug' | 'tradeoff' | 'ordering' | 'logic';
  question: string;
  codeSnippet?: string;
  scenario?: string;
  options: { id: string; text: string; isCorrect: boolean; explanation: string }[];
  explanation: string;
  difficulty?: 'junior' | 'middle' | 'senior' | 'staff';
  adaptiveInsight?: string;
  category?: string;
}

export type AdminMaterialType = 'video' | 'presentation' | 'file' | 'text';

export interface AdminMaterial {
  id: string;
  title: string;
  type: AdminMaterialType;
  author: string;
  domain: string;
  level: UserSkillLevel;
  contentUrl?: string; // Video URL, presentation slides URL, or file link
  textContent?: string; // Markdown text theory or starter code
  fileName?: string; // e.g. "postgres_page_layout.c", "schema.sql"
  durationMin?: number;
  aiEssence: string; // Суть видео/материала, которую записывает администратор, чтоб ИИ понимал когда и кому это вставить
  aiPracticeGuidelines?: string; // Инструкция для ИИ: какую практику и тесты составить по этой теории
  viewsCount?: number;
  createdAt?: string;
  status?: 'approved' | 'review' | 'archived';
}

export interface LearningUnit {
  id: string;
  title: string;
  category: string;
  durationSec: number;
  videoUrl: string;
  videoDescription?: string;
  authorName: string;
  viewsCount: number;
  retentionRate: number;
  passRate: number;
  summaryMarkdown: string;
  // Admin Store Material linkage
  originMaterialId?: string;
  materialType?: AdminMaterialType;
  aiEssence?: string; // Суть видео/материала для ИИ от администратора
  aiPracticeGuidelines?: string;
  // Student AI Adaptation fields (не кардинально, не упрощая)
  adaptedForStudent?: boolean;
  adaptationPrompt?: string;
  adaptationNote?: string;
  originalSummaryMarkdown?: string;
  originalProjectTask?: {
    title: string;
    role: string;
    description: string;
    requirements: string[];
    starterCode: string;
    defaultFilename: string;
  };
  // Stage 1 & Stage 3 double viewing support
  secondVideoUrl?: string;
  secondVideoTitle?: string;
  secondSummaryMarkdown?: string;
  sourceType?: 'library' | 'ai_generated';
  libraryMatchReason?: string;
  activeGapClosure?: TargetedGapClosureBlock | null;
  isPairWork?: boolean;
  pairTask?: PairWorkTask;
  quiz: QuizQuestion[];
  // Grounded Textbook & AI Adapted Learning Block
  groundingSources?: GroundingSourceItem[];
  practicalExercises?: PracticalExercise[];
  is10BlockMilestone?: boolean;
  blockIndex?: number;
  capstone10Project?: Capstone10Project;
  adaptedThinkingStyle?: 'visual' | 'engineering' | 'conceptual' | 'practical';
  adaptedUserLevel?: UserSkillLevel;
  adaptedTargetGoal?: string;
  adaptedTargetRole?: string;
  isEnriched?: boolean;
  glossaryTerms?: GlossaryTerm[];
  projectTask: {
    title: string;
    role: string;
    description: string;
    requirements: string[];
    starterCode: string;
    defaultFilename: string;
    businessScenario?: string;
    checklist?: string[];
    acceptedFileTypes?: string;
    estimatedTimeMin?: number;
  };
}

export interface GlossaryTerm {
  id?: string;
  term: string;
  definition: string;
  simpleAnalogy?: string; // Понятная аналогия / объяснение "на пальцах"
  whyItMatters?: string; // Зачем это нужно знать и где применяется
}

export interface PracticalExercise {
  id: string;
  title: string;
  type: 'experiment' | 'defect_hunt' | 'tradeoff' | 'hands_on';
  scenario: string;
  taskPrompt: string;
  starterSnippet?: string;
  hint?: string;
  solutionExplanation: string;
  isCompleted?: boolean;
  userDraft?: string;
}

export interface Capstone10Project {
  id: string;
  title: string;
  milestoneNumber: number; // e.g. 10, 20, 30
  coveredTopics: string[]; // List of 10 synthesized topics
  role: string;
  businessScenario: string;
  architecturalChallenge: string;
  checklist: string[];
  requirements: string[];
  starterCode: string;
  defaultFilename: string;
  estimatedTimeMin: number;
  passed?: boolean;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  tag: string;
  timestampSec?: number;
  unitId?: string;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  title: string;
  done: boolean;
  priority: 'high' | 'medium' | 'low';
  milestone?: string;
}

export interface HabitItem {
  id: string;
  title: string;
  streak: number;
  completedToday: boolean;
  bestStreak?: number;
  category?: 'focus' | 'code' | 'reading' | 'practice' | 'review' | 'custom' | string;
  targetDaysPerWeek?: number;
  history?: string[]; // list of completed ISO dates (e.g. ['2026-09-26', ...])
  color?: string; // 'amber' | 'emerald' | 'sky' | 'purple' | 'rose'
  createdAt?: string;
}

export interface WhiteboardStroke {
  id: string;
  tool: 'pen' | 'line' | 'rect' | 'circle';
  color: string;
  strokeWidth: number;
  points: number[];
}

export interface PeerSessionState {
  isConnected: boolean;
  buddyName: string;
  buddyAvatar: string;
  buddyRole: 'Driver' | 'Navigator';
  userRole: 'Driver' | 'Navigator';
  velocityIndex: number;
  pingMs: number;
  userAReady: boolean;
  userBReady: boolean;
  selectedOption: string | null;
  videoTimestamp: number;
  isPlaying: boolean;
  whiteboardStrokes: WhiteboardStroke[];
  messages: Array<{ sender: string; text: string; time: string }>;
}

export interface UserArtifact {
  id: string;
  unitId: string;
  unitTitle: string;
  filename: string;
  fileContent: string;
  score: number;
  passed: boolean;
  strongPoints: string[];
  vulnerabilities: string[];
  productionAdvice: string;
  submittedAt: string;
  fileSize?: string;
  fileFormat?: string;
}

export interface AdminUnitRow {
  id: string;
  title: string;
  author: string;
  views: number;
  retention: number;
  passRate: number;
  boostFactor: number;
  status: 'approved' | 'flagged' | 'sunset' | 'review';
  screeningFlags: string[];
  termDensity: number;
  waterPercentage: number;
  detailedDescription?: string;
  videoUrl?: string;
  domain?: string;
  level?: UserSkillLevel;
  durationMin?: number;
}

export interface PeerPartner {
  id: string;
  name: string;
  avatar?: string;
  userLevel: UserSkillLevel;
  skillDomain: string;
  targetGoal: string;
  matchScore: number;
  onlineStatus: 'online' | 'in_call' | 'studying' | 'offline';
  joinedAt?: string;
  dailyRoomUrl?: string;
  bio?: string;
  currentUnitId?: string;
  role?: 'Driver' | 'Navigator';
  progressPercent?: number;
  roomCode?: string;
  pairTask?: any;
}

export interface MatchmakingState {
  isSearching: boolean;
  searchStartedAt?: number;
  partner: PeerPartner | null;
  mode: 'instant' | 'background' | 'idle';
  queueStatus?: string;
}

// ==========================================
// DEEP COGNITIVE TELEMETRY & GAP CLOSURE
// ==========================================

export interface TelemetrySignal {
  id: string;
  timestamp: number;
  type: 
    | 'hesitation' 
    | 'option_flip' 
    | 'dwell_anomaly' 
    | 'reread_loop' 
    | 'test_error' 
    | 'code_friction' 
    | 'explicit_ping' 
    | 'rage_click'
    | 'remediation_success';
  severity: 'low' | 'medium' | 'high' | 'critical';
  subtopic?: string;
  details: string;
  metadata?: Record<string, any>;
}

export interface TargetedGapClosureBlock {
  id: string;
  targetSubtopic: string;
  triggerReason: string;
  telemetryEvidenceSummary: string;
  confusionDiagnosis: {
    rootCause: string;
    mentalModelTrap: string;
    whyItHappens: string;
  };
  visualModel: {
    type: 'comparison_matrix' | 'flow_diagram' | 'step_by_step' | 'counter_example';
    title: string;
    description: string;
    badApproach: {
      label: string;
      codeOrConcept: string;
      consequence: string;
    };
    goodApproach: {
      label: string;
      codeOrConcept: string;
      consequence: string;
    };
    ruleOfThumb: string;
  };
  surgicalChallenge: {
    id: string;
    scenario: string;
    question: string;
    options: Array<{
      id: string;
      text: string;
      isCorrect: boolean;
      explanation: string;
    }>;
  };
  remediationSummary: string;
  karmaBonus: number;
  generatedByAi?: boolean;
}

export interface CognitiveTelemetryState {
  dwellTimePerSection: Record<string, number>; // sectionId -> seconds
  sectionRereadCount: Record<string, number>; // sectionId -> count
  questionHesitations: Record<string, { startTime: number; durationSec: number; flipCount: number; flippedOptions: string[] }>;
  activeConfidenceRating?: 'confident' | 'hesitant' | 'lost';
  rageClickCount: number;
  codeRunAttempts: number;
  codeErrorHistory: string[];
  explicitConfusionFlags: string[];
  overallCognitiveLoad: number; // 0 to 100
  indecisionIndex: number; // 0 to 100
  signals: TelemetrySignal[];
  activeGapBlock: TargetedGapClosureBlock | null;
  resolvedGaps: string[];
  // Rich AI context payloads for deeper synthesis
  conceptHealth?: Record<string, {
    topic: string;
    mastery: number;
    confusion: number;
    attempts: number;
    dwellSec: number;
    rereads: number;
    successRate: number;
    correctAttempts?: number;
    incorrectAttempts?: number;
    lastSeen: number;
    confidence: 'confident' | 'hesitant' | 'lost';
  }>;
  topicTimeline?: Array<{
    timestamp: number;
    topic: string;
    metric: 'dwell' | 'hesitation' | 'error' | 'success' | 'confusion' | 'recall';
    value: number;
    note: string;
  }>;
  eventCounts?: Record<string, number>;
  sessionMetrics?: {
    sessionStartedAt: number;
    activeSeconds: number;
    trackedActions: number;
    distinctTopics: number;
    completionCount: number;
    recallAttempts: number;
    recallAverage: number;
    codeSuccessfulRuns: number;
    codeFailedRuns: number;
    lastActivityAt: number;
  };
  attentionDrift?: {
    contextSwitches: number;
    abandonedTopics: string[];
    longestStuckTopic?: string;
    avgSessionDepth: number;
    lastTopicFocus: string | null;
  };
  aiContextSummary?: string;
  aiContextSnapshot?: Record<string, any>;
  // Telemetry-driven AI Core Filling fields:
  coreResonancePercentage?: number;
  autoCrystallizedAxiomCount?: number;
  lastAutoCrystallizedTopic?: string | null;
  telemetryDrivenCoreFillStatus?: 'active' | 'syncing' | 'idle';
  totalLearningPushes?: number;
}

export interface GroundingSourceItem {
  id: string;
  sourceType: 'openstax' | 'academic_paper' | 'djvu_conspect' | 'academic_book' | 'wikibooks';
  sourceLabel: string;
  title: string;
  authors?: string;
  year?: string | number;
  url?: string;
  chapterOrSection?: string;
  pageNumber?: number | string;
  snippet: string;
  verifiableQuote: string;
  doiOrIsbn?: string;
  badgeColor: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'operator';
  text: string;
  timestamp: string;
  isActionExecuted?: boolean;
  actionPayload?: any;
  actionType?: string;
  groundingSources?: GroundingSourceItem[];
  isGroundedOnTextbooks?: boolean;
}

export interface ScheduledLessonSlot {
  id: string;
  unitId: string;
  nodeId: string;
  title: string;
  subtitle: string;
  type: NodeType;
  sprint: string;
  phase: number;
  phaseTitle: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  durationMin: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue' | 'rescheduled';
  isPairWork?: boolean;
  pairPartnerName?: string;
  aiRecommendation?: string;
  location: 'Фокус-Студия' | 'P2P Видеокомната' | 'IDE Практика' | 'DAG Граф';
  completedAt?: string;
}

export interface WeeklyResourceConfig {
  rawInput: string;
  hoursPerWeek: number;
  sessionsPerWeek: number;
  preferredDays: number[]; // 1=Mon, 2=Tue, ..., 7=Sun
  preferredTimeOfDay: 'morning' | 'day' | 'evening' | 'flexible';
  intensity: 'light' | 'standard' | 'accelerated' | 'hardcore';
  targetWeeksCount: number;
  targetCompletionDate: string;
}

export type SphereLayerType = 'core' | 'mantle' | 'orbit';

export interface KnowledgeSphereNode {
  id: string;
  title: string;
  subtitle?: string;
  layer: SphereLayerType; // 'core' (Теория) | 'mantle' (Навык) | 'orbit' (Проект)
  domain: string; // 'Программирование', 'Архитектура', 'Системы', 'Безопасность', 'Мета-обучение', etc.
  domainColor: string;
  status: 'locked' | 'active' | 'completed' | 'stuck_injected';
  unitId?: string;
  dagNodeId?: string;
  // 3D coordinates on spherical shell
  x: number;
  y: number;
  z: number;
  radius: number; // Radial shell distance (e.g. 50, 110, 180)
  size: number; // Visual sphere mass (grows with practical links)
  weight: number; // Gravitational mass calculated from links count & usage
  impactProjectIds: string[]; // Projects nourished by this theory/skill node
  underlyingTheoryIds?: string[]; // If project or skill, links back to core lessons
  practiceCount?: number;
  lastPracticed?: string;
  description?: string;
  codeSnippet?: string;
  // Castalian AI Patch: Real Data, Invariants, and AI Perception
  formula?: string; // Математический инвариант / закон
  castalianBeadId?: string; // Номер бисера Касталии
  firstPrinciplesCitation?: string; // Первоисточник (напр. C. Shannon, E. Dijkstra)
  aiPerception?: {
    observedFriction: string; // Что видит ИИ по этому узлу
    masteryConfidence: number; // 0..100%
    retentionState: 'firm' | 'decaying' | 'untested';
    liveVector: string; // Наблюдаемый когнитивный вектор
  };
  aiAction?: {
    activeIntervention: string; // Что делает ИИ с этим узлом
    projectedRaysCount: number;
    groundedInArtifact: boolean;
    lastPurgedReasoningTrace?: string;
  };
}

export interface KnowledgeSphereLink {
  id: string;
  source: string; // node id
  target: string; // node id
  type: 'theory_to_skill' | 'skill_to_project' | 'direct_impact_ray' | 'castalian_resonance' | 'castalian_bridge' | 'castalian_geodesic' | 'core_to_core_invariant';
  strength: number; // 0..1
  isActiveTrace?: boolean;
  castalianExplanation?: string;
  mathematicalBridge?: string;
}

export interface KnowledgeSphereTelemetry {
  totalNodes: number;
  coreNodesCount: number; // Теория
  mantleNodesCount: number; // Навыки
  orbitNodesCount: number; // Проекты
  totalImpactRays: number; // Связи теория -> проекты
  coreStabilityPercent: number;
  coreStatus: 'harmonic' | 'harmonious' | 'balanced' | 'overheated' | 'unstable';
  coreStabilityStatus: 'harmonic' | 'balanced' | 'overheated' | 'unstable';
  coreResonancePercentage: number;
  totalAxiomsCount: number;
  activeSkillsCount: number;
  realProjectsCount: number;
  directImpactRaysCount: number;
  energyLevel: number;
  recommendedAction: string;
  unlinkedTheoryCount: number;
  heaviestNodeTitle: string;
  heaviestNodeMass: number;
  averageRetentionPct: number;
  autoCoreFillingActive: boolean;
  telemetrySignalsProcessed: number;
  lastTelemetryTrigger: string;
  castalianResonanceScore?: number;
  castalianBridgesCount?: number;
  aiPerceptionLog?: string[];
  aiActionLog?: string[];
}

export interface CommunityRoomMember {
  userId: string;
  userName: string;
  name?: string;
  avatar?: string;
  role: 'owner' | 'moderator' | 'member' | 'architect' | 'auditor';
  joinedAt: string;
  isOnline?: boolean;
}

export interface CommunityRoomBan {
  userId: string;
  userName: string;
  avatar?: string;
  bannedAt: string;
}

export interface CommunityRoomPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt: string;
  likes?: number;
  attachments?: Array<{ name: string; url?: string; type: string }>;
  learningNode?: {
    nodeId: string;
    title: string;
    subtitle?: string;
    unitId?: string;
    status?: NodeStatus;
  };
  attachedNotes?: Array<Pick<NoteItem, 'id' | 'title' | 'content' | 'tag' | 'createdAt'>>;
}

export interface CommunityRoom {
  id: string;
  name: string;
  description: string;
  bioMarkdown?: string;
  avatarUrl?: string;
  bannerCover?: string;
  bannerTheme?: 'indigo_neon' | 'emerald_matrix' | 'sunset_fire' | 'midnight_glass' | 'cyber_purple' | 'slate_minimal';
  isPrivate: boolean;
  accessCode?: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  updatedAt?: string;
  createdAt: string;
  category: string;
  tags: string[];
  memberCount: number;
  maxMembers: number;
  activeTopic?: string;
  rules?: string[];
  hasVoiceCall?: boolean;
  hasWhiteboard?: boolean;
  hasCodeEditor?: boolean;
  dailyRoomUrl?: string;
  members?: CommunityRoomMember[];
  bannedMembers?: CommunityRoomBan[];
  feedPosts?: CommunityRoomPost[];
}

export type ProfileStatus = 'focus' | 'idle' | 'break';

export interface ProfileNodeSnapshot {
  nodeId: string;
  title: string;
  subtitle?: string;
  unitId?: string;
  category?: string;
  summaryMarkdown?: string;
}

export interface ProfileWallPost {
  id: string;
  nodeId?: string;
  taskId?: string;
  kind: 'debug' | 'optimization' | 'fieldnote';
  authorId: string;
  authorName: string;
  title: string;
  text: string;
  snippet?: string;
  logs?: string;
  createdAt: string;
}

export interface PartnerRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  pairTask: NonNullable<UserProfile['pairTask']>;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  avatar?: string;
  title: string;
  specialty: string;
  bio: string;
  status: ProfileStatus;
  ringProgress: number;
  currentNodeIds: string[];
  currentNodes: ProfileNodeSnapshot[];
  partnerUid?: string;
  partnerRequestStatus?: 'none' | 'pending' | 'accepted';
  pairTask?: {
    id: string;
    title: string;
    nodeId: string;
    nodeTitle: string;
    brief: string;
  };
  wallPosts: ProfileWallPost[];
}

export interface BlockGraphicSnapshot {
  unitId: string;
  blockIndex?: number;
  title: string;
  category?: string;
  authorName?: string;
  durationMin?: number;
  summaryMarkdown?: string;
  projectTitle?: string;
  projectDescription?: string;
  projectRequirements?: string[];
  projectFilename?: string;
  starterCode?: string;
  coreInvariant?: string;
  summary?: string;
  requirements?: string[];
  codeLanguage?: string;
  difficulty?: 'junior' | 'middle' | 'senior' | 'staff';
  retentionRate?: number;
  passRate?: number;
  quizQuestionsCount?: number;
  diagramFlow?: Array<{ step: string; label: string; icon?: string }>;
  capturedAt?: string;
}




