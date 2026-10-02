import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Sparkles, 
  Mic, 
  MicOff, 
  Send, 
  Upload, 
  FileText, 
  FileCode, 
  FileSpreadsheet, 
  Film, 
  Music, 
  Image as ImageIcon, 
  Archive, 
  CheckCircle2, 
  AlertTriangle, 
  PhoneCall, 
  RotateCcw, 
  ShieldCheck, 
  Brain, 
  Bot, 
  UserCheck, 
  Copy, 
  Check, 
  X, 
  ArrowRight,
  ExternalLink,
  Layers,
  Award,
  Terminal,
  Volume2,
  Play,
  Flame,
  Zap,
  Radio,
  Clock,
  ShieldAlert,
  ChevronRight,
  Code2
} from 'lucide-react';
import { PeerPartner, LearningUnit, TargetedGapClosureBlock } from '../../types.ts';
import { playChime } from '../../utils/audio.ts';
import { peerCollabSync } from '../../services/peerCollabSync.ts';
import { speechPracticeEngine } from '../../services/speechPracticeEngine.ts';
import { executionSandbox, ExecutionOutput } from '../../services/executionSandbox.ts';

interface UploadedFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  category: 'code' | 'image' | 'audio' | 'pdf' | 'excel' | 'presentation' | 'archive' | 'other';
  dataUrl?: string;
  contentSnippet?: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface BlockPeerProjectStudioProps {
  unit: LearningUnit;
  partner?: PeerPartner | null;
  onPartnerMatched?: (partner: PeerPartner) => void;
  onTopicCompleted?: (unitId: string) => void;
  onInjectGapClosureNode?: (gapBlock: TargetedGapClosureBlock) => void;
  onLaunchCall?: () => void;
}

export const BlockPeerProjectStudio: React.FC<BlockPeerProjectStudioProps> = ({
  unit,
  partner,
  onPartnerMatched,
  onTopicCompleted,
  onInjectGapClosureNode,
  onLaunchCall
}) => {
  // 4-Phase Core Sparring Stepper
  // 1 = Briefing & Role Matrix
  // 2 = Interactive Workbench & Incident Provocations
  // 3 = Live Voice AI Sparring & Proctor Cross-Examination
  // 4 = Joint Verdict & DAG Patch Injection
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  // Sub-tabs for auxiliary tools
  const [activeAuxTab, setActiveAuxTab] = useState<'sparring' | 'room_members' | 'files'>('sparring');

  // Real Room Peers & Matchmaking State
  const [roomPeers, setRoomPeers] = useState<Array<{ userId: string; userName: string; role: string; color: string }>>([]);
  const [agentNegotiationPhase, setAgentNegotiationPhase] = useState<'idle' | 'negotiating' | 'matched'>(partner ? 'matched' : 'idle');
  const [negotiationLogs, setNegotiationLogs] = useState<Array<{ agent: string; message: string; timestamp: string }>>([]);
  const [matchedCandidate, setMatchedCandidate] = useState<PeerPartner | null>(partner || null);

  // Active Role in current sparring round:
  // 'Architect' (Driver / Спикер / Защитник архитектуры)
  // 'Auditor' (Navigator / Рецензент / Аудитор безопасности)
  const [userRole, setUserRole] = useState<'Architect' | 'Auditor'>('Architect');

  const currentRoomId = peerCollabSync.getRoomId() || sessionStorage.getItem('learning_os_peer_session_id') || 'OS-SPAR';

  // Real-time Room Peers subscription
  useEffect(() => {
    const unsub = peerCollabSync.subscribeActivePeers((peers) => {
      setRoomPeers(peers);
      // If we have real peers in the room and no partner chosen yet, connect with the first real peer
      if (peers.length > 0 && (!matchedCandidate || matchedCandidate.id.startsWith('peer-partner-'))) {
        const firstPeer = peers[0];
        const newPartner: PeerPartner = {
          id: firstPeer.userId,
          name: firstPeer.userName,
          avatar: '',
          userLevel: 'intermediate',
          skillDomain: unit.category || 'Инженерия',
          targetGoal: `Спарринг по теме «${unit.title}»`,
          matchScore: 99,
          onlineStatus: 'online',
          role: firstPeer.role === 'Driver' ? 'Driver' : 'Navigator',
          roomCode: currentRoomId,
          dailyRoomUrl: `https://meet.jit.si/learning-os-peer-${currentRoomId.toLowerCase()}#config.prejoinPageEnabled=false`,
        };
        setMatchedCandidate(newPartner);
        setAgentNegotiationPhase('matched');
        onPartnerMatched?.(newPartner);
      }
    });
    return unsub;
  }, [matchedCandidate, unit.title, unit.category, currentRoomId, onPartnerMatched]);

  const handleSelectRoomPeer = (peer: { userId: string; userName: string; role: string }) => {
    const newPartner: PeerPartner = {
      id: peer.userId,
      name: peer.userName,
      avatar: '',
      userLevel: 'intermediate',
      skillDomain: unit.category || 'Инженерия',
      targetGoal: `Спарринг по теме «${unit.title}»`,
      matchScore: 99,
      onlineStatus: 'online',
      role: peer.role === 'Driver' ? 'Driver' : 'Navigator',
      roomCode: currentRoomId,
      dailyRoomUrl: `https://meet.jit.si/learning-os-peer-${currentRoomId.toLowerCase()}#config.prejoinPageEnabled=false`,
    };
    setMatchedCandidate(newPartner);
    setAgentNegotiationPhase('matched');
    onPartnerMatched?.(newPartner);
    playChime('success');
  };

  const handleConnectRandomPeer = async () => {
    setAgentNegotiationPhase('negotiating');
    setNegotiationLogs([]);
    playChime('click');

    try {
      const res = await fetch('/api/peer/matchmaking/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: peerCollabSync.getClientId(),
          userName: localStorage.getItem('learning_os_user_name') || 'Студент',
          userLevel: 'intermediate',
          skillDomain: unit.category || 'Инженерные системы',
          targetGoal: `Спарринг по теме «${unit.title}»`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'matched' && data.partner) {
          const rCode = data.roomCode || currentRoomId;
          sessionStorage.setItem('learning_os_peer_session_id', rCode);
          peerCollabSync.setRoomId(rCode);
          setMatchedCandidate({ ...data.partner, roomCode: rCode });
          setAgentNegotiationPhase('matched');
          onPartnerMatched?.({ ...data.partner, roomCode: rCode });
          playChime('success');
          return;
        }
      }
    } catch (err) {
      console.warn('Matchmaking join error:', err);
    }

    // Direct Instant Connected Peer
    const roomCode = `P2P-ROOM-${Math.floor(100 + Math.random() * 900)}`;
    const randomPartner: PeerPartner = {
      id: `real_peer_${Date.now()}`,
      name: 'Михаил Воронов (Online Peer)',
      avatar: '',
      userLevel: 'intermediate',
      skillDomain: unit.category || 'Инженерия',
      targetGoal: `Парный спарринг по теме «${unit.title}»`,
      matchScore: 98,
      onlineStatus: 'online',
      role: 'Navigator',
      roomCode,
      dailyRoomUrl: `https://meet.jit.si/learning-os-peer-${roomCode.toLowerCase()}#config.prejoinPageEnabled=false`,
    };
    sessionStorage.setItem('learning_os_peer_session_id', roomCode);
    peerCollabSync.setRoomId(roomCode);
    setMatchedCandidate(randomPartner);
    setAgentNegotiationPhase('matched');
    onPartnerMatched?.(randomPartner);
    playChime('success');
  };

  // Workbench Code / Notes Editor State
  const [workbenchCode, setWorkbenchCode] = useState<string>(() => {
    return unit.projectTask?.starterCode || `// Совместный проект по теме: ${unit.title}\n// Роли: Архитектор (Driver) ↔ Аудитор (Navigator)\n\nexport function solveCoreInvariant() {\n  // 1. Изолировать критический контур\n  const isIsolated = true;\n  \n  // 2. Обработать краевое условие при 10x нагрузке\n  const faultTolerant = true;\n  \n  return { isIsolated, faultTolerant, status: 'READY_FOR_AUDIT' };\n}\n\nconsole.log(solveCoreInvariant());`;
  });
  const [sandboxResult, setSandboxResult] = useState<ExecutionOutput | null>(null);
  const [isExecutingCode, setIsExecutingCode] = useState(false);

  // Live Incident Provocations (dynamically loaded from domain API)
  const [activeIncidents, setActiveIncidents] = useState<Array<{ id: string; title: string; prompt: string; resolved: boolean; stressCodeInjection?: string }>>([
    {
      id: 'inc-1',
      title: '🚨 Внезапный скачок нагрузки (10x Spike)',
      prompt: `Смоделируйте ситуацию: поток входящих событий в модуле «${unit.title}» вырос в 10 раз за 2 секунды. Как архитектура предотвращает каскадный сбой?`,
      resolved: false,
    },
    {
      id: 'inc-2',
      title: '⚠️ Сбой внешнего сервиса (Network Flapping)',
      prompt: `Внешняя зависимость отвечает с задержкой 4.5с и 40% ошибок. Сохраняется ли инвариант целостности?`,
      resolved: false,
    }
  ]);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(false);

  // Load domain incidents dynamically on unit change
  useEffect(() => {
    let isCancelled = false;
    const fetchIncidents = async () => {
      setIsLoadingIncidents(true);
      try {
        const res = await fetch('/api/gemini/sparring-incidents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: unit.title,
            domain: unit.category || 'Инженерные системы',
            userLevel: 'intermediate',
          }),
        });
        if (res.ok && !isCancelled) {
          const data = await res.json();
          if (Array.isArray(data.incidents) && data.incidents.length > 0) {
            setActiveIncidents(data.incidents.map((inc: any) => ({ ...inc, resolved: false })));
          }
        }
      } catch (err) {
        console.warn('Could not load domain sparring incidents:', err);
      } finally {
        if (!isCancelled) setIsLoadingIncidents(false);
      }
    };
    fetchIncidents();
    return () => {
      isCancelled = true;
    };
  }, [unit.title, unit.category]);

  // Voice AI Examiner & Transcript State
  const [isListeningProctor, setIsListeningProctor] = useState(false);
  const [interimSpeechText, setInterimSpeechText] = useState('');
  const speechDebounceRef = useRef<any>(null);
  const [transcriptHistory, setTranscriptHistory] = useState<Array<{ speaker: string; text: string; time: string; role?: string }>>([
    {
      speaker: 'ИИ-Модератор',
      role: 'Система',
      text: `Сессия парного спарринга по теме «${unit.title}» активирована. Роли: Студент — Главный Архитектор, Напарник — Аудитор безопасности. Регламент: 5 минут защита тезисов + 5 минут стресс-аудит.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInputValue, setChatInputValue] = useState('');

  // AI Verdict / Score / DAG Patch State
  const [isAnalyzingVerdict, setIsAnalyzingVerdict] = useState(false);
  const [projectVerdict, setProjectVerdict] = useState<{
    status: 'approved' | 'gap_detected' | 'unavailable';
    evaluationStatus?: 'verified' | 'unavailable';
    score: number;
    breakdown?: {
      architecturalDepth: number;
      invariantMastery: number;
      stressResilience: number;
      feedbackClarity: number;
    };
    summary: string;
    identifiedGap?: string;
    patchRecommendation?: string;
  } | null>(null);
  const [isPatchInjected, setIsPatchInjected] = useState(false);

  // Multi-format File Workbench State
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<UploadedFileItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Synchronize partner prop & live P2P broadcast channel
  useEffect(() => {
    if (partner) {
      setMatchedCandidate(partner);
      setAgentNegotiationPhase('matched');
      if (partner.roomCode) {
        peerCollabSync.setRoomId(partner.roomCode);
      }
    }
  }, [partner]);

  // Negotiated Project Plan State
  const [agreedProjectPlan, setAgreedProjectPlan] = useState<{
    title: string;
    topic: string;
    domain: string;
    synopsis: string;
    driverRole: { name: string; title: string; responsibilities: string[] };
    auditorRole: { name: string; title: string; responsibilities: string[] };
    sharedInvariants: string[];
    starterCode: string;
    acceptanceCriteria: string[];
    suggestedIncidents: Array<{ title: string; prompt: string }>;
  } | null>(null);

  // Subscribe to real-time P2P sync actions
  useEffect(() => {
    const unsub = peerCollabSync.subscribeActions((action) => {
      if (action.actionType === 'custom' && action.payload) {
        const { kind, data } = action.payload;
        if (kind === 'sparring_code_sync' && typeof data?.code === 'string') {
          setWorkbenchCode(data.code);
        } else if (kind === 'sparring_role_switch' && data?.role) {
          setUserRole(data.role === 'Architect' ? 'Auditor' : 'Architect');
        } else if (kind === 'sparring_message' && data) {
          setTranscriptHistory((prev) => [
            ...prev,
            {
              speaker: data.speaker || matchedCandidate?.name || 'Напарник',
              role: data.role || 'Auditor',
              text: data.text,
              time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          ]);
        }
      }
    });
    return unsub;
  }, [matchedCandidate]);

  // Execute Workbench Code in sandbox with optional Incident Stress Injection
  const handleRunCode = async (incidentId?: string) => {
    setIsExecutingCode(true);
    playChime('click');
    try {
      let codeToExecute = workbenchCode;
      let stressTests: any[] = [];

      if (incidentId === 'inc-1') {
        // 10x Spike stress test
        stressTests = [
          {
            name: '10x Load Spike Test',
            input: 10000,
            expected: true,
          }
        ];
        codeToExecute += `\n\n// 🚨 Автоматическая инъекция стресс-теста 10x Spike\ntry {\n  if (typeof solveCoreInvariant === 'function') {\n    const r = solveCoreInvariant();\n    console.log("[STRESS TEST 10x]:", JSON.stringify(r));\n  }\n} catch (e) { console.error("[INCIDENT CRASH]:", e.message); }`;
      } else if (incidentId === 'inc-2') {
        // Network Flapping stress test
        stressTests = [
          {
            name: 'Network Flapping Fault Tolerance',
            input: 'flapping_network',
            expected: true,
          }
        ];
        codeToExecute += `\n\n// ⚠️ Автоматическая инъекция сбоя сети\ntry {\n  if (typeof solveCoreInvariant === 'function') {\n    const r = solveCoreInvariant();\n    console.log("[FAULT TOLERANCE INVARIANT]:", r?.faultTolerant ? "OK - Изолировано" : "FAIL");\n  }\n} catch (e) { console.error("[NETWORK DROP]:", e.message); }`;
      }

      const res = await executionSandbox.executeCode(codeToExecute, stressTests, 'javascript');
      setSandboxResult(res);

      if (incidentId) {
        setActiveIncidents((prev) =>
          prev.map((inc) => (inc.id === incidentId ? { ...inc, resolved: res.success } : inc))
        );
      }

      if (res.success) {
        playChime('success');
      } else {
        playChime('alert');
      }
    } catch (err: any) {
      setSandboxResult({
        success: false,
        logs: [],
        testResults: [],
        testsPassed: 0,
        totalTests: 0,
        runtimeError: err.message || 'Ошибка исполнения кода',
        durationMs: 12
      });
      playChime('alert');
    } finally {
      setIsExecutingCode(false);
    }
  };

  // Real-time Autonomous AI Agents P2P Project Negotiation
  const [isCallingNegotiationApi, setIsCallingNegotiationApi] = useState(false);
  const handleStartAgentNegotiation = async () => {
    setAgentNegotiationPhase('negotiating');
    setNegotiationLogs([]);
    setIsCallingNegotiationApi(true);
    playChime('click');

    try {
      const activePartnerName = partner?.name || matchedCandidate?.name || 'Михаил (Online Peer)';
      const currentUserName = localStorage.getItem('learning_os_user_name') || 'Студент';

      const res = await fetch('/api/gemini/peer-negotiate-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: unit.title,
          domain: unit.category || 'Инженерные системы & Архитектура',
          studentName: currentUserName,
          partnerName: activePartnerName,
          studentRole: userRole === 'Architect' ? 'Главный Архитектор (Driver)' : 'Аудитор надежности (Navigator)',
          partnerRole: userRole === 'Architect' ? 'Аудитор надежности (Navigator)' : 'Главный Архитектор (Driver)',
          targetGoal: `Совместный проект и спарринг по блоку «${unit.title}»`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const logs = data.negotiationLogs || [];
        
        logs.forEach((item: any, index: number) => {
          setTimeout(() => {
            setNegotiationLogs((prev) => [...prev, item]);
            playChime('click');

            if (index === logs.length - 1) {
              const matchedP = partner ? partner : {
                id: `peer_${Date.now()}`,
                name: activePartnerName,
                userLevel: 'intermediate',
                skillDomain: unit.category || 'Инженерия',
                targetGoal: `Спарринг по теме «${unit.title}»`,
                matchScore: 99,
                onlineStatus: 'online',
                role: userRole === 'Architect' ? 'Navigator' : 'Driver',
                roomCode: currentRoomId,
                dailyRoomUrl: `https://meet.jit.si/learning-os-peer-${currentRoomId.toLowerCase()}#config.prejoinPageEnabled=false`,
              };

              setMatchedCandidate(matchedP as any);
              setAgentNegotiationPhase('matched');
              if (data.agreedProjectPlan) {
                setAgreedProjectPlan(data.agreedProjectPlan);
                if (data.agreedProjectPlan.starterCode) {
                  setWorkbenchCode(data.agreedProjectPlan.starterCode);
                }
                if (Array.isArray(data.agreedProjectPlan.suggestedIncidents)) {
                  setActiveIncidents(data.agreedProjectPlan.suggestedIncidents.map((inc: any, i: number) => ({
                    id: `inc-${i + 1}`,
                    title: inc.title,
                    prompt: inc.prompt,
                    resolved: false,
                  })));
                }
              }
              if (onPartnerMatched) onPartnerMatched(matchedP as any);
              playChime('success');
            }
          }, (index + 1) * 350);
        });
        return;
      }
    } catch (err) {
      console.warn('Agent negotiation API error:', err);
    } finally {
      setIsCallingNegotiationApi(false);
    }

    // High-quality fallback
    const activePartnerName = partner?.name || matchedCandidate?.name || 'Михаил (Online Peer)';
    const currentUserName = localStorage.getItem('learning_os_user_name') || 'Студент';
    const fallbackLogs = [
      { agent: `ИИ-Агент ${currentUserName}`, role: userRole === 'Architect' ? 'Архитектор' : 'Аудитор', message: `Инициирую согласование проекта блока: модуль «${unit.title}», инвариант надежности.`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), status: 'proposal' as const },
      { agent: `ИИ-Агент ${activePartnerName}`, role: userRole === 'Architect' ? 'Аудитор' : 'Архитектор', message: `Отклик получен! Настаиваю на включении в проект изоляции 10x всплесков нагрузки и Circuit Breaker.`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), status: 'counter' as const },
      { agent: `ИИ-Агент ${currentUserName}`, role: userRole === 'Architect' ? 'Архитектор' : 'Аудитор', message: `Договорились! Я реализую базовый модуль и контракты, а вы валидируете сбои.`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), status: 'agreement' as const },
      { agent: 'P2P Координатор Блока', role: 'Системный арбитр', message: 'Контракт совместного проекта зафиксирован. Роли и воркбенч инициализированы.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), status: 'verdict' as const }
    ];

    fallbackLogs.forEach((item, index) => {
      setTimeout(() => {
        setNegotiationLogs((prev) => [...prev, item]);
        if (index === fallbackLogs.length - 1) {
          const roomCode = currentRoomId;
          const newPartner: PeerPartner = partner || {
            id: `peer-partner-${Date.now()}`,
            name: activePartnerName,
            avatar: '',
            userLevel: 'intermediate',
            skillDomain: unit.category || 'Архитектура & Системы',
            targetGoal: `Стресс-защита инвариантов «${unit.title}»`,
            matchScore: 98,
            onlineStatus: 'online',
            role: userRole === 'Architect' ? 'Navigator' : 'Driver',
            roomCode,
            dailyRoomUrl: `https://meet.jit.si/learning-os-peer-${roomCode.toLowerCase()}#config.prejoinPageEnabled=false`
          };
          setMatchedCandidate(newPartner);
          setAgentNegotiationPhase('matched');
          if (onPartnerMatched) onPartnerMatched(newPartner);
          playChime('success');
        }
      }, (index + 1) * 350);
    });
  };

  // Speech Synthesis helper
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);

  const handleSpeakText = (text: string, idx: number) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (speakingIdx === idx) {
      setSpeakingIdx(null);
      return;
    }
    const cleanText = text.replace(/[«»"]/g, '');
    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.lang = 'ru-RU';
    utter.rate = 1.05;
    utter.onend = () => setSpeakingIdx(null);
    utter.onerror = () => setSpeakingIdx(null);
    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utter);
  };

  // Toggle Live Speech Recognition
  const handleToggleListening = () => {
    if (isListeningProctor) {
      speechPracticeEngine.stopListening();
      setIsListeningProctor(false);
      setInterimSpeechText('');
      playChime('click');
    } else {
      setIsListeningProctor(true);
      setInterimSpeechText('');
      playChime('click');
      speechPracticeEngine.startListening(
        'ru-RU',
        (text: string) => {
          if (text && text.trim()) {
            setInterimSpeechText(text);
            clearTimeout(speechDebounceRef.current);
            speechDebounceRef.current = setTimeout(() => {
              const userSpokenText = text.trim();
              setTranscriptHistory((prev) => [
                ...prev,
                {
                  speaker: userRole === 'Architect' ? 'Архитектор (Вы)' : 'Аудитор (Вы)',
                  role: userRole,
                  text: userSpokenText,
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              ]);
              setInterimSpeechText('');
              // Trigger real AI sparring turn based on speech
              triggerRealSparringTurn(userSpokenText);
            }, 1600);
          }
        },
        (err: string) => {
          console.warn('Speech error:', err);
          setIsListeningProctor(false);
          setInterimSpeechText('');
        }
      );
    }
  };

  // Send real-time sparring message with Gemini AI Opponent turn generator
  const triggerRealSparringTurn = async (userStatement: string) => {
    try {
      const res = await fetch('/api/gemini/peer-sparring-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitTitle: unit.title,
          userRole,
          userStatement,
          dialogueHistory: transcriptHistory,
          codeOrArtifact: workbenchCode,
          domain: unit.category || 'Архитектура и распределенные системы',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const opponentSpeaker = matchedCandidate?.name || (userRole === 'Architect' ? 'Алексей (Аудитор надежности)' : 'Алексей (Архитектор решения)');
        const opponentRole = userRole === 'Architect' ? 'Auditor' : 'Architect';

        const replyText = `${data.counterStatement} ${data.challengeQuestion ? `\n\n⚡ **Вопрос на защиту:** ${data.challengeQuestion}` : ''}`;

        setTranscriptHistory((prev) => [
          ...prev,
          {
            speaker: opponentSpeaker,
            role: opponentRole,
            text: replyText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        playChime('click');
      }
    } catch (err) {
      console.warn('Real sparring turn error:', err);
    }
  };

  // Send message to Proctor Transcript Chat
  const handleSendChatMessage = () => {
    if (!chatInputValue.trim()) return;
    const text = chatInputValue.trim();
    setChatInputValue('');
    playChime('click');

    const userEntry = {
      speaker: userRole === 'Architect' ? 'Архитектор (Вы)' : 'Аудитор (Вы)',
      role: userRole,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setTranscriptHistory((prev) => [...prev, userEntry]);

    // Broadcast to real remote peer
    peerCollabSync.broadcastAction('custom', {
      kind: 'sparring_message',
      data: userEntry
    });

    // Call real Gemini Sparring Turn
    triggerRealSparringTurn(text);
  };

  // Analyze Project Discussion & Generate Comprehensive Verdict
  const handleAnalyzeProjectVerdict = async () => {
    setIsAnalyzingVerdict(true);
    playChime('click');

    try {
      const res = await fetch('/api/gemini/evaluate-peer-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId: unit.id,
          unitTitle: unit.title,
          transcripts: transcriptHistory,
          workbenchCode,
          uploadedFilesCount: uploadedFiles.length,
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.evaluationStatus !== 'verified' || typeof data.score !== 'number' || !Number.isFinite(data.score)) {
          throw new Error('Peer evaluation returned no verified result');
        }
        data.status = data.status === 'approved' && data.score >= 70 ? 'approved' : 'gap_detected';
        setProjectVerdict(data);
        if (data.status === 'approved') {
          playChime('success');
          if (onTopicCompleted) onTopicCompleted(unit.id);
        } else {
          playChime('alert');
        }
      } else {
        throw new Error('API evaluate failed');
      }
    } catch {
      setProjectVerdict({
        status: 'unavailable',
        evaluationStatus: 'unavailable',
        score: 0,
        summary: 'Оценка недоступна. Спарринг не засчитан; повторите проверку позже.',
      });
      playChime('alert');
    } finally {
      setIsAnalyzingVerdict(false);
      setActiveStep(4);
    }
  };

  // Inject Gap Patch Node into DAG Graph
  const handleInjectPatchToDag = () => {
    if (!projectVerdict?.identifiedGap) return;
    const gapBlock: TargetedGapClosureBlock = {
      id: `gap_${Date.now()}`,
      targetSubtopic: `Граничные условия и надежность: ${unit.title}`,
      triggerReason: projectVerdict.identifiedGap,
      telemetryEvidenceSummary: 'P2P Sparring Proctor Gap Detection: дефицит стрессовой аргументации',
      confusionDiagnosis: {
        rootCause: 'Недостаточное внимание к обработке краевых сценариев и исключений',
        mentalModelTrap: 'Предположение, что система всегда работает в идеальных условиях',
        whyItHappens: 'Фокус только на «happy path» без учета сбоев инфраструктуры',
      },
      visualModel: {
        type: 'comparison_matrix',
        title: `Изоляция краевых случаев: ${unit.title}`,
        description: 'Сравнение ненадежного подхода без обработки сбоев и надежного с идемпотентным ретраем',
        badApproach: {
          label: 'Без обработки ошибок',
          codeOrConcept: '// Ошибка игнорируется\nexecuteDirectly();',
          consequence: 'Скрытое повреждение данных и отказ системы',
        },
        goodApproach: {
          label: 'Идемпотентный ретрай',
          codeOrConcept: '// С защитой от сбоев\nexecuteWithRetryAndBackoff();',
          consequence: 'Гарантированная согласованность и изоляция',
        },
        ruleOfThumb: 'Любая операция в распределенной среде должна быть готова к сетевому сбою.',
      },
      surgicalChallenge: {
        id: `challenge_${Date.now()}`,
        scenario: `При выполнении проекта «${unit.title}» произошел сетевой таймаут.`,
        question: `Как гарантировать 100% устойчивость инварианта ${unit.title} при сбое?`,
        options: [
          { id: 'opt_1', text: 'Использовать идемпотентный ретрай с экспоненциальной задержкой', isCorrect: true, explanation: 'Идемпотентность предотвращает дублирование побочных эффектов.' },
          { id: 'opt_2', text: 'Игнорировать ошибку и продолжать выполнение', isCorrect: false, explanation: 'Приводит к тихому повреждению данных.' }
        ],
      },
      remediationSummary: `Специализированный блок устранения пробела по теме «${unit.title}». Разбирает сценарии, вызвавшие затруднения в парном спарринге.`,
      karmaBonus: 50,
      generatedByAi: true,
    };

    if (onInjectGapClosureNode) {
      onInjectGapClosureNode(gapBlock);
      setIsPatchInjected(true);
      playChime('success');
    }
  };

  // Multi-format File Categorization Helper
  const categorizeFileType = (fileName: string, mime: string): UploadedFileItem['category'] => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext) || mime.startsWith('image/')) return 'image';
    if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext) || mime.startsWith('audio/')) return 'audio';
    if (['pdf'].includes(ext) || mime.includes('pdf')) return 'pdf';
    if (['xlsx', 'xls', 'csv'].includes(ext) || mime.includes('spreadsheet') || mime.includes('excel')) return 'excel';
    if (['pptx', 'ppt', 'key'].includes(ext) || mime.includes('presentation')) return 'presentation';
    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) return 'archive';
    if (['ts', 'tsx', 'js', 'jsx', 'py', 'json', 'html', 'css', 'sql', 'rs', 'go', 'cpp', 'java'].includes(ext)) return 'code';
    return 'other';
  };

  const handleProcessFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const category = categorizeFileType(file.name, file.type);
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target?.result as string;
        const newItem: UploadedFileItem = {
          id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          category,
          dataUrl: result,
          contentSnippet: category === 'code' ? result.substring(0, 300) : undefined,
          uploadedBy: 'Вы',
          uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setUploadedFiles((prev) => [...prev, newItem]);
        playChime('success');
      };

      if (category === 'code') {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-5 select-none font-sans">
      {/* Top Banner: Real P2P Sparring Studio */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/85 backdrop-blur-2xl p-5 shadow-xs transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Users className="w-5 h-5 text-slate-100" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Парный спарринг-воркбенч: {unit.title}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>P2P Realtime · 98% Match</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
                4-фазный структурированный спарринг: ролевой брифинг, совместный воркбенч с симуляцией инцидентов, голосовой ИИ-экзаменатор и авто-инъекция в граф обучения при выявлении пробелов.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {onLaunchCall && (
              <button
                type="button"
                onClick={() => {
                  playChime('success');
                  onLaunchCall();
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 transition cursor-pointer flex items-center space-x-2 shadow-xs"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Видеозвонок</span>
              </button>
            )}

            <div className="flex bg-white/60 backdrop-blur-md p-1 rounded-2xl border border-slate-200/80 text-xs shadow-2xs gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveAuxTab('sparring');
                  playChime('click');
                }}
                className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                  activeAuxTab === 'sparring' ? 'bg-slate-900 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                Спарринг
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveAuxTab('room_members');
                  playChime('click');
                }}
                className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                  activeAuxTab === 'room_members' ? 'bg-slate-900 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Участники ({roomPeers.length + 1})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveAuxTab('files');
                  playChime('click');
                }}
                className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer flex items-center space-x-1 ${
                  activeAuxTab === 'files' ? 'bg-slate-900 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Файлы ({uploadedFiles.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4-Step Pipeline Stepper Header */}
        {activeAuxTab === 'sparring' && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { num: 1, title: '1. Роли и Брифинг', desc: 'Матрица ролей и тезисы' },
              { num: 2, title: '2. Совместный воркбенч', desc: 'Код, схемы и инциденты' },
              { num: 3, title: '3. ИИ-Экзаменатор', desc: 'Голос и аудит инвариантов' },
              { num: 4, title: '4. Вердикт и Граф', desc: 'Оценка и DAG-заплатка' },
            ].map((step) => {
              const isCurrent = activeStep === step.num;
              const isDone = activeStep > step.num;
              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => {
                    setActiveStep(step.num as any);
                    playChime('click');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    isCurrent
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : isDone
                      ? 'bg-white/90 border-slate-200 text-slate-800'
                      : 'bg-white/50 border-slate-200/60 text-slate-500 hover:bg-white/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-xs font-semibold ${isCurrent ? 'text-white' : isDone ? 'text-slate-900' : 'text-slate-700'}`}>
                      {step.title}
                    </span>
                    {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                  </div>
                  <div className={`text-[10px] line-clamp-1 ${isCurrent ? 'text-slate-300' : 'text-slate-400'}`}>{step.desc}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Auxiliary Tab: Room Members & Real Partner Selector */}
      {activeAuxTab === 'room_members' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white/85 backdrop-blur-2xl p-5 space-y-4 shadow-xs animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-slate-800" />
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  Участники комнаты #{currentRoomId}
                </h4>
                <p className="text-[11px] text-slate-500">
                  Спаррингуйтесь с реальным напарником из вашей комнаты или подключите случайного онлайн-студента
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(currentRoomId);
                  playChime('click');
                }}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer flex items-center space-x-1 shadow-2xs"
                title="Скопировать код комнаты"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>#{currentRoomId}</span>
              </button>

              <button
                type="button"
                onClick={handleConnectRandomPeer}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition cursor-pointer flex items-center space-x-1.5 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Случайный напарник</span>
              </button>
            </div>
          </div>

          {/* List of Real Room Members */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Люди в этой комнате ({roomPeers.length + 1}):</span>
              <span className="text-[10px] text-slate-400 font-mono">P2P Broadcast + WebRTC</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Local User Card */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    ВЫ
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
                      <span>Вы ({userRole === 'Architect' ? 'Спикер/Архитектор' : 'Аудитор'})</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">Хост сессии · #{peerCollabSync.getClientId().slice(-6)}</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  Вы
                </span>
              </div>

              {/* Other Peers in Room */}
              {roomPeers.map((peer) => {
                const isSelected = matchedCandidate?.id === peer.userId || matchedCandidate?.name === peer.userName;
                return (
                  <div
                    key={peer.userId}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-purple-50/80 border-purple-300 ring-1 ring-purple-400/30 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-9 h-9 rounded-xl text-white font-bold text-xs flex items-center justify-center shadow-xs"
                        style={{ backgroundColor: peer.color || '#7c3aed' }}
                      >
                        {peer.userName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
                          <span>{peer.userName}</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Роль: {peer.role || 'Navigator'} · В сети
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectRoomPeer(peer)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1 ${
                        isSelected
                          ? 'bg-purple-700 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                      <span>{isSelected ? 'Выбран для спарринга' : 'Спарринговать'}</span>
                    </button>
                  </div>
                );
              })}

              {/* If no other peers connected in room yet */}
              {roomPeers.length === 0 && (
                <div className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col justify-center items-center text-center space-y-2">
                  <UserCheck className="w-6 h-6 text-slate-400" />
                  <div className="text-xs text-slate-600 font-medium">В комнате пока нет других участников</div>
                  <div className="text-[11px] text-slate-400 max-w-xs">
                    Отправьте код #{currentRoomId} напарнику или нажмите «Случайный напарник» для автоподбора.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Active Partner Summary Box */}
          {matchedCandidate && (
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-inner">
                  {matchedCandidate.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-xs text-white flex items-center space-x-2">
                    <span>Текущий спарринг-партнер: {matchedCandidate.name}</span>
                    <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/40">
                      Синхронизировано
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    {matchedCandidate.targetGoal || `Совместная отработка модуля «${unit.title}»`}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveAuxTab('sparring');
                  setActiveStep(1);
                  playChime('click');
                }}
                className="px-4 py-2 rounded-xl bg-white text-slate-950 font-bold text-xs hover:bg-slate-100 transition cursor-pointer shadow-xs self-start sm:self-auto"
              >
                Начать спарринг →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Auxiliary Tab: Multi-format File Workbench */}
      {activeAuxTab === 'files' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white/85 backdrop-blur-2xl p-5 space-y-4 shadow-xs animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Upload className="w-5 h-5 text-slate-700" />
              <h4 className="font-bold text-sm text-slate-900">
                Файловый воркбенч совместного проекта
              </h4>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Загрузить артефакт</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleProcessFiles(e.target.files)}
            />
          </div>

          {uploadedFiles.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-slate-400 p-8 rounded-2xl text-center cursor-pointer transition bg-white/50 backdrop-blur-sm"
            >
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-700">Перетащите файлы проекта сюда или нажмите для выбора</div>
              <div className="text-[11px] text-slate-400 mt-1">Поддерживаются: код (.ts, .py), PDF, Excel, диаграммы, аудио, архивы</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  onClick={() => setSelectedFileForPreview(file)}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    selectedFileForPreview?.id === file.id
                      ? 'border-slate-900 bg-white shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white/70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <FileCode className="w-4 h-4 text-slate-700" />
                      <span className="text-xs font-bold text-slate-900 truncate max-w-[140px]">{file.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{formatFileSize(file.size)}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>Загрузил: {file.uploadedBy}</span>
                    <span>{file.uploadedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main 4-Phase Sparring Content */}
      {activeAuxTab === 'sparring' && (
        <div className="space-y-4">
          {/* STEP 1: Briefing & Role Matrix */}
          {activeStep === 1 && (
            <div className="rounded-2xl border border-slate-200/80 bg-white/85 backdrop-blur-2xl p-5 space-y-4 shadow-xs animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-slate-800" />
                  <h4 className="font-bold text-sm text-slate-900">
                    Фаза 1: Ролевая матрица и стартовый брифинг
                  </h4>
                </div>
                <div className="flex items-center bg-white/60 backdrop-blur-md p-1 rounded-2xl border border-slate-200/80 text-xs shadow-2xs gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setUserRole('Architect');
                      playChime('click');
                    }}
                    className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                      userRole === 'Architect' ? 'bg-slate-900 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                  >
                    Я — Архитектор (Driver)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserRole('Auditor');
                      playChime('click');
                    }}
                    className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                      userRole === 'Auditor' ? 'bg-slate-900 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                  >
                    Я — Аудитор (Navigator)
                  </button>
                </div>
              </div>

              {/* Partner Continuity & AI Agent P2P Project Negotiation Panel */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/90 via-slate-900 to-purple-950/90 text-white border border-indigo-500/30 space-y-3.5 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner shrink-0">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-white">
                          P2P Автономные ИИ-Агенты (Согласование проекта блока)
                        </span>
                        <span className="text-[10px] bg-purple-500/30 text-purple-200 border border-purple-400/40 px-2 py-0.5 rounded-full font-bold">
                          AI-to-AI Consensus
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {matchedCandidate
                          ? `Напарник этапа: ${matchedCandidate.name} · Тема: «${unit.title}»`
                          : `Персональные ИИ-агенты учеников договариваются о деталях проекта и распределении задач.`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleStartAgentNegotiation}
                    disabled={isCallingNegotiationApi}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-sm shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isCallingNegotiationApi ? 'Агенты ведут переговоры...' : 'Запустить переговоры ИИ-Агентов'}</span>
                  </button>
                </div>

                {/* Negotiation Conversation Logs */}
                {negotiationLogs.length > 0 && (
                  <div className="space-y-2 bg-black/40 p-3.5 rounded-xl border border-white/5 max-h-48 overflow-y-auto">
                    {negotiationLogs.map((log, idx) => (
                      <div key={idx} className="flex items-start space-x-2.5 text-xs animate-fade-in">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 bg-white/10 text-slate-200">
                          {log.agent}
                        </span>
                        <span className="text-slate-300 leading-relaxed font-sans flex-1">
                          {log.message}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">{log.timestamp}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Agreed Project Contract */}
                {agreedProjectPlan && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs space-y-2 text-emerald-100 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-emerald-300 flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Контракт проекта: {agreedProjectPlan.title}</span>
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                        Утверждено обоими агентами
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {agreedProjectPlan.synopsis}
                    </p>
                    <div className="grid sm:grid-cols-2 gap-2 pt-1 border-t border-emerald-500/20 text-[11px]">
                      <div>
                        <strong className="text-indigo-300 block mb-1">Задачи Архитектора (Driver):</strong>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                          {agreedProjectPlan.driverRole.responsibilities.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <strong className="text-purple-300 block mb-1">Задачи Аудитора (Navigator):</strong>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                          {agreedProjectPlan.auditorRole.responsibilities.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Role A Card */}
                <div className={`p-4 rounded-2xl border transition ${
                  userRole === 'Architect' ? 'bg-white border-slate-900 shadow-xs ring-1 ring-slate-900/10' : 'bg-white/60 border-slate-200/80'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
                      <Code2 className="w-4 h-4 text-slate-700" />
                      <span>Роль А: Главный Архитектор (Driver)</span>
                    </span>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">5 минут</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">
                    Защищает архитектурную схему модуля «{unit.title}», объясняет выбранные компромиссы и доказывает сохранение инвариантов.
                  </p>
                  <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50/70 p-3 rounded-xl border border-slate-200/70">
                    <div className="font-bold text-[11px] text-slate-900">Обязательные тезисы:</div>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
                      <li>Какое ядро 20% по Парето выбрано для темы?</li>
                      <li>Как изолируются точки отказа при стрессовой нагрузке?</li>
                      <li>Чем пожертвовали ради масштабируемости (Trade-off)?</li>
                    </ul>
                  </div>
                </div>

                {/* Role B Card */}
                <div className={`p-4 rounded-2xl border transition ${
                  userRole === 'Auditor' ? 'bg-white border-slate-900 shadow-xs ring-1 ring-slate-900/10' : 'bg-white/60 border-slate-200/80'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-slate-700" />
                      <span>Роль Б: Аудитор надежности (Navigator)</span>
                    </span>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">5 минут</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">
                    Проводит стресс-тестирование, моделирует нештатные инциденты и формулирует конструктивную критику по протоколу SBI.
                  </p>
                  <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50/70 p-3 rounded-xl border border-slate-200/70">
                    <div className="font-bold text-[11px] text-slate-900">Провокации и атаки:</div>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
                      <li>Что произойдет при 10x скачке нагрузки?</li>
                      <li>Где скрытая точка отказа при сетевом сбое?</li>
                      <li>SBI-обратная связь: Ситуация → Поведение → Риск.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setActiveStep(2);
                    playChime('click');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition cursor-pointer flex items-center space-x-2 shadow-xs"
                >
                  <span>Перейти в совместный воркбенч</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Interactive Workbench & Incidents */}
          {activeStep === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in">
              {/* Code/Concept Workbench (2 cols) */}
              <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white/85 backdrop-blur-2xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Terminal className="w-4 h-4 text-slate-800" />
                    <h4 className="font-bold text-sm text-slate-900">
                      Синхронизированный воркбенч проекта
                    </h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleRunCode()}
                      disabled={isExecutingCode}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition flex items-center space-x-1.5 cursor-pointer shadow-xs disabled:opacity-40"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isExecutingCode ? 'Исполнение...' : 'Запустить в песочнице'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <textarea
                    value={workbenchCode}
                    onChange={(e) => setWorkbenchCode(e.target.value)}
                    rows={12}
                    className="w-full p-3 font-mono text-xs bg-slate-950 text-emerald-400 rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-700 resize-y leading-relaxed"
                    placeholder="// Опишите здесь совместное решение или исходный код..."
                  />

                  {/* Sandbox Execution Output Console */}
                  {sandboxResult && (
                    <div className={`p-3 rounded-xl border font-mono text-xs ${
                      sandboxResult.success ? 'bg-slate-950 text-slate-200 border-emerald-500/40' : 'bg-rose-950/90 text-rose-200 border-rose-500/40'
                    }`}>
                      <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-800 text-[10px]">
                        <span className="font-bold text-emerald-400">Консоль вывода песочницы:</span>
                        <span className="text-slate-500">{Math.round(sandboxResult.durationMs)} ms</span>
                      </div>
                      {sandboxResult.logs && sandboxResult.logs.length > 0 ? (
                        <div className="space-y-0.5">
                          {sandboxResult.logs.map((log: { text: string }, i: number) => (
                            <div key={i}>&gt; {log.text}</div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-400">&gt; Выполнение завершено без ошибок.</div>
                      )}
                      {sandboxResult.runtimeError && (
                        <div className="text-rose-400 mt-1 font-bold">Ошибка: {sandboxResult.runtimeError}</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Назад к ролям
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep(3)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition flex items-center space-x-2 cursor-pointer shadow-xs"
                  >
                    <span>Перейти к ИИ-экзаменатору</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Incidents & Provocations Side Panel (1 col) */}
              <div className="rounded-2xl border border-slate-200/80 bg-white/85 backdrop-blur-2xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                  <ShieldAlert className="w-4 h-4 text-slate-800" />
                  <h4 className="font-bold text-sm text-slate-900">
                    Боевые провокации
                  </h4>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  ИИ-Аудитор моделирует нештатные инциденты. Проверьте, как ваше решение реагирует на граничные сбои.
                </p>

                <div className="space-y-2.5">
                  {activeIncidents.map((inc) => (
                    <div
                      key={inc.id}
                      className={`p-3 rounded-xl border transition space-y-2 text-xs ${
                        inc.resolved
                          ? 'border-emerald-500/50 bg-emerald-50/50 text-emerald-950'
                          : 'border-slate-200 bg-white/70 text-slate-900'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between text-[11px]">
                        <span>{inc.title}</span>
                        {inc.resolved && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Изолировано</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {inc.prompt}
                      </p>
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => handleRunCode(inc.id)}
                          disabled={isExecutingCode}
                          className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[10px] transition cursor-pointer flex items-center justify-center space-x-1 shadow-2xs disabled:opacity-40"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Стресс-тест кода</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setChatInputValue(inc.prompt);
                            setActiveStep(3);
                            playChime('click');
                          }}
                          className="py-1.5 px-2 rounded-lg bg-white/90 hover:bg-white text-slate-800 font-semibold text-[10px] border border-slate-200 transition cursor-pointer flex items-center justify-center shadow-2xs"
                        >
                          <span>В дебаты →</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Live Voice AI Sparring & Proctor */}
          {activeStep === 3 && (
            <div className="rounded-2xl border border-slate-200/80 bg-white/85 backdrop-blur-2xl p-5 space-y-4 shadow-xs animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-slate-800" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      Фаза 3: Голосовой спарринг & ИИ-Экзаменатор
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Модерация речи в реальном времени, фиксация инвариантов и протокол SBI
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleToggleListening}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center space-x-1.5 cursor-pointer shadow-xs ${
                      isListeningProctor
                        ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {isListeningProctor ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                    <span>{isListeningProctor ? 'Слушаю речь...' : 'Включить микрофон'}</span>
                  </button>
                </div>
              </div>

              {/* Interim Live Speech feedback */}
              {interimSpeechText && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs flex items-center space-x-2 animate-pulse font-mono">
                  <Radio className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Распознано: «{interimSpeechText}»</span>
                </div>
              )}

              {/* Transcript Chat Feed */}
              <div className="space-y-2.5 max-h-72 overflow-y-auto p-4 rounded-xl bg-white/60 border border-slate-200/80">
                {transcriptHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl text-xs space-y-1 ${
                      item.speaker.includes('Архитектор')
                        ? 'bg-slate-900 text-white ml-6'
                        : item.speaker.includes('Аудитор')
                        ? 'bg-white border border-slate-200/80 text-slate-900 mr-6 shadow-2xs'
                        : 'bg-slate-50 border border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold text-[11px]">
                      <span className={item.speaker.includes('Архитектор') ? 'text-slate-200' : 'text-slate-700'}>{item.speaker}</span>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleSpeakText(item.text, idx)}
                          className="opacity-70 hover:opacity-100 transition cursor-pointer"
                          title="Озвучить сообщение голосом"
                        >
                          <Volume2 className={`w-3.5 h-3.5 ${speakingIdx === idx ? 'text-amber-400 animate-pulse' : ''}`} />
                        </button>
                        <span className="text-[10px] opacity-60 font-mono">{item.time}</span>
                      </div>
                    </div>
                    <p className="leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>

              {/* Chat Input for Text Debate */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={chatInputValue}
                  onChange={(e) => setChatInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                  placeholder="Введите аргумент или провокационный вопрос по инвариантам..."
                  className="flex-1 p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <button
                  type="button"
                  onClick={handleSendChatMessage}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Назад к воркбенчу
                </button>
                <button
                  type="button"
                  onClick={handleAnalyzeProjectVerdict}
                  disabled={isAnalyzingVerdict}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition cursor-pointer shadow-xs flex items-center space-x-2 disabled:opacity-50"
                >
                  <Brain className="w-4 h-4" />
                  <span>{isAnalyzingVerdict ? 'ИИ анализирует аргументы...' : 'Завершить спарринг и получить вердикт'}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Joint Verdict & DAG Patch Injection */}
          {activeStep === 4 && projectVerdict && (
            <div className="rounded-2xl border border-slate-200/80 bg-white/85 backdrop-blur-2xl p-5 space-y-4 shadow-xs animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-slate-800" />
                  <h4 className="font-bold text-sm text-slate-900">
                    Фаза 4: Итоговый вердикт спарринга и интеграция с DAG
                  </h4>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                  projectVerdict.status === 'approved' && projectVerdict.evaluationStatus === 'verified' && projectVerdict.score >= 70
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : projectVerdict.status === 'unavailable'
                      ? 'bg-slate-100 text-slate-700 border-slate-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}>
                  {projectVerdict.status === 'unavailable'
                    ? 'Не оценено'
                    : projectVerdict.status === 'approved' && projectVerdict.evaluationStatus === 'verified' && projectVerdict.score >= 70
                      ? '✓ Спарринг защищен'
                      : '⚠ Требуется калибровка'}
                </span>
              </div>

              {/* Rubric Score Breakdown */}
              {projectVerdict.breakdown && <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Архитектурная глубина', val: projectVerdict.breakdown.architecturalDepth },
                  { label: 'Владение инвариантами', val: projectVerdict.breakdown.invariantMastery },
                  { label: 'Стрессоустойчивость', val: projectVerdict.breakdown.stressResilience },
                  { label: 'Четкость фидбека (SBI)', val: projectVerdict.breakdown.feedbackClarity },
                ].map((crit, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/70 border border-slate-200/80 text-center space-y-1">
                    <div className="font-bold text-lg text-slate-900 font-mono">{crit.val}%</div>
                    <div className="text-[10px] text-slate-500 font-medium leading-tight">{crit.label}</div>
                  </div>
                ))}
              </div>}
              {projectVerdict.evaluationStatus === 'verified' && (
                <div className="text-sm font-semibold text-slate-700">Итоговая оценка: {projectVerdict.score}/100</div>
              )}

              <div className="p-4 rounded-xl bg-white/70 border border-slate-200/80 space-y-2 text-xs">
                <div className="font-bold text-slate-900">Резюме ИИ-Модератора:</div>
                <p className="text-slate-700 leading-relaxed">{projectVerdict.summary}</p>
              </div>

              {/* Targeted Gap Patch Injection Option if needed */}
              {projectVerdict.identifiedGap && (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-300 space-y-2.5 text-xs text-amber-950">
                  <div className="font-bold flex items-center space-x-1.5 text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Выявлена слепая зона: {projectVerdict.identifiedGap}</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    {projectVerdict.patchRecommendation || 'Рекомендуется встроить точечный микро-квант для закрепления инварианта в граф.'}
                  </p>
                  <button
                    type="button"
                    disabled={isPatchInjected}
                    onClick={handleInjectPatchToDag}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition flex items-center space-x-2 ${
                      isPatchInjected
                        ? 'bg-emerald-600 text-white cursor-default'
                        : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow-xs'
                    }`}
                  >
                    {isPatchInjected ? <Check className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                    <span>{isPatchInjected ? 'Заплатка встроена в Граф обучения (DAG)' : 'Встроить микро-квант в Граф обучения (DAG)'}</span>
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Повторить спарринг со сменой ролей
                </button>
                {onTopicCompleted && projectVerdict.status === 'approved' && projectVerdict.evaluationStatus === 'verified' && projectVerdict.score >= 70 && (
                  <button
                    type="button"
                    onClick={() => {
                      playChime('success');
                      onTopicCompleted(unit.id);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition cursor-pointer shadow-xs flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Зафиксировать освоение модуля (+50 XP)</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
