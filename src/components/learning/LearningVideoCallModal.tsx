import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  Maximize2, 
  Minimize2,
  ExternalLink,
  Sparkles,
  GripHorizontal,
  RefreshCw,
  Award,
  Zap,
  MessageSquare,
  Bot,
  UserCheck,
  CheckCircle2,
  Volume2,
  Timer,
  Lightbulb,
  TrendingUp,
  ShieldCheck,
  Flame,
  Send,
  Play,
  Pause,
  Copy,
  Check,
  Activity
} from 'lucide-react';
import { playChime } from '../../utils/audio.ts';
import { PairWorkTask, LiveSpeechUtterance, AiOperatorLiveGrade } from '../../types.ts';

interface LearningVideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: {
    name: string;
    avatar?: string;
    role: string;
    dailyRoomUrl?: string;
    pairTask?: PairWorkTask;
  } | null;
  pairTask?: PairWorkTask;
  currentTopic?: string;
  onOpenPeerCollab?: () => void;
  onFinishedAssessment?: (assessment: any) => void;
}

export const LearningVideoCallModal: React.FC<LearningVideoCallModalProps> = ({
  isOpen,
  onClose,
  partner,
  pairTask: externalPairTask,
  currentTopic,
  onOpenPeerCollab,
  onFinishedAssessment,
}) => {
  if (!isOpen || !partner) return null;

  // 1. Call & Media States
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [audioVolumeLevel, setAudioVolumeLevel] = useState<number>(0);

  // 2. Active Pair Sparring Task & Scenario
  const effectiveTopic = currentTopic || partner.pairTask?.topic || externalPairTask?.topic || 'Парный ролевой спарринг';
  const effectiveDomain = localStorage.getItem('learning_os_target_domain') || 'Универсальное мастерство';

  const pairTask: PairWorkTask = partner.pairTask || externalPairTask || {
    id: `pair-task-${Date.now()}`,
    title: `Парный созвон: ${effectiveTopic}`,
    topic: effectiveTopic,
    domain: effectiveDomain,
    scenario: `Отработка кейса по теме «${effectiveTopic}» в реальном времени. Участники поочередно берут на себя роль Спикера и Рецензента, после чего оба получают независимую оценку от своих ИИ-Операторов.`,
    roleA: {
      title: 'Спикер & Презентер',
      badge: 'Спикер',
      description: 'Защищает позицию, объясняет логику решения, обосновывает компромиссы и отвечает на встречные вопросы.',
      talkingPoints: [
        'Начать с 1-минутной сути решения и ключевого инварианта',
        'Обосновать выбор архитектуры, инструментов и компромиссы (trade-offs)',
        'Ответить на каверзный вопрос рецензента без паники и с опорой на факты'
      ],
      starterPrompt: `Привет! По теме «${effectiveTopic}» я предлагаю следующий подход...`,
      evaluationCriteria: ['Ясность формулировок', 'Аргументация', 'Глубина понимания']
    },
    roleB: {
      title: 'Рецензент & Оппонент',
      badge: 'Рецензент',
      description: 'Внимательно слушает, ищет слабые места в логике, тестирует краевые случаи и задает критические конструктивные вопросы.',
      talkingPoints: [
        'Внимательно выслушать вводный тезис собеседника без перебивания',
        'Задать вопрос про граничные условия, нагрузку или непредвиденные сбои',
        'Дать поддерживающую и конструктивную обратную связь по архитектуре'
      ],
      starterPrompt: `Интересный тезис! Но что произойдет, если исходные условия внезапно изменятся?`,
      evaluationCriteria: ['Активное слушание', 'Точность вопросов', 'Конструктивность']
    },
    roundDurationSec: 180,
    aiAgentsNegotiationSummary: {
      partnerName: partner.name,
      partnerGoal: 'Свободная практика и спарринг',
      partnerSkillDomain: effectiveDomain,
      negotiationLog: `ИИ-Агенты синхронизировали темы: @${partner.name} изучает «${effectiveTopic}». Назначен 2-раундовый созвон со сменой ролей и двойной ИИ-оценкой.`,
      matchScore: 98,
      synchronizedNodeTitle: `[👥 Парная практика] ${effectiveTopic}`
    }
  };

  // 3. Rounds & Role Swap State
  // Round 1: User is Role A (Speaker), Partner is Role B (Reviewer)
  // Round 2: User is Role B (Reviewer), Partner is Role A (Speaker)
  const [currentRound, setCurrentRound] = useState<1 | 2>(1);
  const [roundSecondsLeft, setRoundSecondsLeft] = useState<number>(pairTask.roundDurationSec || 180);
  const [isRoundRunning, setIsRoundRunning] = useState<boolean>(true);
  const [roleSwapBanner, setRoleSwapBanner] = useState<string | null>(null);

  // Computed Roles based on current round
  const userCurrentRole = currentRound === 1 ? pairTask.roleA : pairTask.roleB;
  const partnerCurrentRole = currentRound === 1 ? pairTask.roleB : pairTask.roleA;

  // 4. Speech Recognition & Live Transcript Stream
  const [isListeningSpeech, setIsListeningSpeech] = useState(false);
  const [liveTranscripts, setLiveTranscripts] = useState<LiveSpeechUtterance[]>([
    {
      id: 'ut-init-1',
      speaker: 'partner',
      speakerName: partner.name,
      text: `Привет! Наш ИИ-Оператор назначил нам парный спарринг по теме «${pairTask.topic}». Я готов слушать твою презентацию!`,
      timestampSec: 2,
      roleAtMoment: 'Рецензент & Оппонент',
    }
  ]);
  const [customSpeechInput, setCustomSpeechInput] = useState('');
  const [copiedCertificate, setCopiedCertificate] = useState(false);
  const [isPartnerSpeaking, setIsPartnerSpeaking] = useState(false);
  const [isPartnerVoiceMuted, setIsPartnerVoiceMuted] = useState(false);
  const [copiedRoomUrl, setCopiedRoomUrl] = useState(false);

  // 5. Dual AI Operators Live Grades & View Mode
  const [viewMode, setViewMode] = useState<'sparring_hud' | 'webrtc_call'>('sparring_hud');
  const [userLiveScore, setUserLiveScore] = useState<number>(88);
  const [partnerLiveScore, setPartnerLiveScore] = useState<number>(86);
  const [userCoachNote, setUserCoachNote] = useState<string>('ИИ-Оператор слушает: говорите уверенно, начинайте с главного тезиса.');
  const [partnerCoachNote, setPartnerCoachNote] = useState<string>('ИИ-Оператор напарника активен: оценивает качество вопросов.');
  const [isEvaluatingFinal, setIsEvaluatingFinal] = useState(false);
  const [evaluationUnavailable, setEvaluationUnavailable] = useState(false);
  const [finalScorecard, setFinalScorecard] = useState<any | null>(null);

  const effectiveRoomUrl = partner.dailyRoomUrl || `https://meet.jit.si/learning-os-peer-${(partner.name || 'room').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'session'}#config.prejoinPageEnabled=false`;

  const speakPartnerMessage = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || isPartnerVoiceMuted) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#`_~]/g, '').trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'ru-RU';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsPartnerSpeaking(true);
      utterance.onend = () => setIsPartnerSpeaking(false);
      utterance.onerror = () => setIsPartnerSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.debug('SpeechSynthesis notice:', err);
    }
  };

  const handleCopyRoomUrl = () => {
    if (!effectiveRoomUrl) return;
    navigator.clipboard.writeText(effectiveRoomUrl);
    setCopiedRoomUrl(true);
    playChime('click');
    setTimeout(() => setCopiedRoomUrl(false), 2500);
  };

  // Video & Audio Streams Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localMiniVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const transcriptBottomRef = useRef<HTMLDivElement | null>(null);
  const isComponentMounted = useRef(true);

  // Floating PiP Mode
  const [isFloating, setIsFloating] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    return { x: Math.max(20, w - 380), y: Math.max(60, h - 340) };
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Initialize Call & Media
  useEffect(() => {
    isComponentMounted.current = true;
    playChime('ring');
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    async function startMedia() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          if (!isComponentMounted.current) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          mediaStreamRef.current = stream;
          setHasCameraPermission(true);
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;
          if (localMiniVideoRef.current) localMiniVideoRef.current.srcObject = stream;

          // Set up Web Audio Analyser for real-time speech visualizer
          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
              const audioCtx = new AudioCtx();
              audioContextRef.current = audioCtx;
              const source = audioCtx.createMediaStreamSource(stream);
              const analyser = audioCtx.createAnalyser();
              analyser.fftSize = 64;
              source.connect(analyser);
              analyserRef.current = analyser;

              const dataArray = new Uint8Array(analyser.frequencyBinCount);
              const checkVolume = () => {
                if (!isComponentMounted.current) return;
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                  sum += dataArray[i];
                }
                const avg = sum / dataArray.length;
                setAudioVolumeLevel(Math.min(100, Math.round((avg / 128) * 100)));
                requestAnimationFrame(checkVolume);
              };
              checkVolume();
            }
          } catch (e) {
            console.log('[WebAudio] notice:', e);
          }
        }
      } catch (err) {
        console.log('Real webcam/mic not available or permission denied:', err);
      }
    }
    startMedia();

    // Initialize Web Speech API for real-time speech parser with auto-restart watchdog
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'ru-RU';

        recognition.onresult = (event: any) => {
          const lastIndex = event.results.length - 1;
          const transcriptText = event.results[lastIndex][0].transcript.trim();
          if (transcriptText) {
            handleAddUtterance('user', 'Вы', transcriptText);
          }
        };

        recognition.onerror = (e: any) => {
          console.log('[SpeechRecognition] notice:', e.error);
        };

        recognition.onend = () => {
          // Auto-restart if modal is still open and unmuted
          if (isComponentMounted.current && !isMuted) {
            try {
              recognition.start();
            } catch {}
          }
        };

        speechRecognitionRef.current = recognition;
        try {
          recognition.start();
          setIsListeningSpeech(true);
        } catch {}
      }
    } catch (e) {
      console.log('SpeechRecognition setup notice:', e);
    }

    return () => {
      isComponentMounted.current = false;
      clearInterval(timer);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch {}
      }
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch {}
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch {}
      }
    };
  }, []);

  // Round Timer Countdown
  useEffect(() => {
    if (!isRoundRunning || finalScorecard) return;
    const interval = setInterval(() => {
      setRoundSecondsLeft((prev) => {
        if (prev <= 1) {
          playChime('pomodoro');
          if (currentRound === 1) {
            handleSwapRoles();
            return pairTask.roundDurationSec || 180;
          } else {
            handleTriggerFinalEvaluation();
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRoundRunning, currentRound, finalScorecard]);

  // Scroll transcript to bottom
  useEffect(() => {
    transcriptBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveTranscripts]);

  // Add Utterance & Trigger Live AI Operator Feedback
  const handleAddUtterance = (speaker: 'user' | 'partner', speakerName: string, text: string) => {
    const newUtterance: LiveSpeechUtterance = {
      id: `ut-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      speaker,
      speakerName,
      text,
      timestampSec: callDuration,
      roleAtMoment: speaker === 'user' ? userCurrentRole.title : partnerCurrentRole.title,
    };

    setLiveTranscripts((prev) => [...prev, newUtterance]);

    // Live AI Operator evaluation & Socratic Partner Response
    if (speaker === 'user') {
      // Immediate optimistic feedback note while Gemini responds
      setUserCoachNote('ИИ-Оператор анализирует тезис и аргументацию...');

      void (async () => {
        try {
          const res = await fetch('/api/gemini/peer-sparring-turn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              topic: effectiveTopic,
              speakerRole: userCurrentRole.title,
              reviewerRole: partnerCurrentRole.title,
              userStatement: text,
              history: liveTranscripts.slice(-5).map((t) => ({ speaker: t.speaker, text: t.text })),
            }),
          });

          if (res.ok) {
            const sparring = await res.json();
            if (isComponentMounted.current) {
              const delta = Math.min(4, Math.max(1, sparring.scoreDelta ?? 2));
              setUserLiveScore((prev) => Math.min(99, prev + delta));

              if (sparring.recommendedFocus || sparring.vulnerabilityPoint) {
                setUserCoachNote(`ИИ-Оператор: ${sparring.vulnerabilityPoint ? `внимание к «${sparring.vulnerabilityPoint}». ` : ''}${sparring.recommendedFocus || 'Тезис принят к рассмотрению.'}`);
              } else {
                setUserCoachNote('ИИ-Оператор: сильная аргументация с опорой на инварианты.');
              }

              // Real AI peer question or counter-statement
              const partnerReply = [sparring.counterStatement, sparring.challengeQuestion].filter(Boolean).join(' ') ||
                `Понял твою мысль по теме «${effectiveTopic}». А как система поведет себя при отказе зависимого узла или пиковой нагрузке?`;

              const peerUtterance: LiveSpeechUtterance = {
                id: `ut-peer-${Date.now()}`,
                speaker: 'partner',
                speakerName: partner.name,
                text: partnerReply,
                timestampSec: callDuration + 2,
                roleAtMoment: partnerCurrentRole.title,
              };

              setLiveTranscripts((prev) => [...prev, peerUtterance]);
              setPartnerLiveScore((prev) => Math.min(98, prev + 2));
              setPartnerCoachNote(`Оппонент протестировал граничное условие по теме «${effectiveTopic}»`);
              speakPartnerMessage(peerUtterance.text);
              return;
            }
          }
        } catch (e) {
          console.warn('Real AI sparring turn request failed, using contextual fallback:', e);
        }

        // Contextual fallback on network error
        if (isComponentMounted.current) {
          setUserLiveScore((prev) => Math.min(99, prev + 2));
          setUserCoachNote(`ИИ-Оператор: тезис по теме «${effectiveTopic}» зафиксирован.`);
          const fallbackUtterance: LiveSpeechUtterance = {
            id: `ut-peer-${Date.now()}`,
            speaker: 'partner',
            speakerName: partner.name,
            text: `Принято. В теме «${effectiveTopic}» ключевой вопрос — сохранение согласованности данных при сбоях. Как твое решение это гарантирует?`,
            timestampSec: callDuration + 2,
            roleAtMoment: partnerCurrentRole.title,
          };
          setLiveTranscripts((prev) => [...prev, fallbackUtterance]);
          setPartnerLiveScore((prev) => Math.min(98, prev + 2));
          speakPartnerMessage(fallbackUtterance.text);
        }
      })();
    } else {
      setPartnerLiveScore((prev) => Math.min(98, prev + 2));
      setPartnerCoachNote(`Напарник углубляет анализ темы «${effectiveTopic}».`);
    }
  };

  // Switch Roles (Смена ролей)
  const handleSwapRoles = () => {
    playChime('success');
    const nextRound = currentRound === 1 ? 2 : 1;
    setCurrentRound(nextRound);
    setRoundSecondsLeft(pairTask.roundDurationSec || 180);

    const bannerText = `Раунд ${nextRound} начался! Смена ролей: Вы — «${nextRound === 1 ? pairTask.roleA.title : pairTask.roleB.title}», ${partner.name} — «${nextRound === 1 ? pairTask.roleB.title : pairTask.roleA.title}»`;
    setRoleSwapBanner(bannerText);
    setTimeout(() => setRoleSwapBanner(null), 5000);

    const announcement: LiveSpeechUtterance = {
      id: `ut-swap-${Date.now()}`,
      speaker: 'partner',
      speakerName: '⚡ Смена ролей (Система)',
      text: `🔔 ${bannerText}`,
      timestampSec: callDuration,
      roleAtMoment: 'Системное уведомление',
    };
    setLiveTranscripts((prev) => [...prev, announcement]);
  };

  // Trigger Final AI Assessment
  const handleTriggerFinalEvaluation = async () => {
    setIsEvaluatingFinal(true);
    setEvaluationUnavailable(false);
    playChime('success');

    const userTexts = liveTranscripts.filter((u) => u.speaker === 'user').map((u) => u.text).join(' ');
    const partnerTexts = liveTranscripts
      .filter((u) => u.speaker === 'partner' && u.id !== 'ut-init-1' && !u.roleAtMoment.includes('Системное уведомление'))
      .map((u) => u.text)
      .join(' ');

    try {
      if (!userTexts.trim() || !partnerTexts.trim()) {
        throw new Error('Both participants need transcript evidence before assessment');
      }

      const res = await fetch('/api/gemini/evaluate-pair-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: pairTask.topic,
          domain: pairTask.domain,
          userRole: userCurrentRole.title,
          partnerRole: partnerCurrentRole.title,
          userTranscript: userTexts,
          partnerTranscript: partnerTexts,
          userName: 'Вы',
          partnerName: partner.name,
        }),
      });

      if (!res.ok) throw new Error(`Pair evaluation failed: ${res.status}`);
      const data = await res.json();
      if (data.evaluationStatus !== 'verified' ||
        !Number.isFinite(data.userGrade?.score) || !Number.isFinite(data.partnerGrade?.score)) {
        throw new Error('Pair evaluation returned no verified score');
      }
      setFinalScorecard(data);
      if (onFinishedAssessment) onFinishedAssessment(data);
    } catch (e) {
      console.warn('Pair evaluation unavailable:', e);
      setFinalScorecard(null);
      setEvaluationUnavailable(true);
      playChime('alert');
    } finally {
      setIsEvaluatingFinal(false);
    }
  };

  // Format Time
  const formatSec = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = !next; });
    }
  };

  const handleToggleVideo = () => {
    const next = !isVideoOff;
    setIsVideoOff(next);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((t) => { t.enabled = !next; });
    }
  };

  const handleEndCall = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch {}
    }
    playChime('alert');
    onClose();
  };

  // Draggable PiP Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isFloating) return;
    setIsDragging(true);
    dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !isFloating) return;
    const newX = Math.max(10, Math.min(window.innerWidth - 360, e.clientX - dragOffset.current.x));
    const newY = Math.max(48, Math.min(window.innerHeight - 320, e.clientY - dragOffset.current.y));
    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
    }
  };

  const copyCertificateToClipboard = () => {
    if (!finalScorecard || finalScorecard.userGrade.score < 70) return;
    const certText = `СЕРТИФИКАТ ПАРНОГО СПАРРИНГА (AI VERIFIED)\nТема: ${pairTask.topic}\nСтудент: Вы (${finalScorecard.userGrade.score}/100)\nНапарник: ${partner.name} (${finalScorecard.partnerGrade.score}/100)\nВердикт: ${finalScorecard.userGrade.verdict}\nСтатус: Зачтено ИИ-Операторами платформы`;
    navigator.clipboard.writeText(certText);
    setCopiedCertificate(true);
    playChime('click');
    setTimeout(() => setCopiedCertificate(false), 2500);
  };

  // ---------------------------------------------------------------------------
  // 1. FLOATING PIP CORNER MODE
  // ---------------------------------------------------------------------------
  if (isFloating) {
    return (
      <aside
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`fixed z-50 w-84 rounded-3xl overflow-hidden shadow-2xl border border-white/20 select-none backdrop-blur-xl bg-slate-950/95 text-white ${
          isDragging ? 'cursor-grabbing ring-2 ring-indigo-400' : 'cursor-grab'
        } animate-fade-in`}
        style={{ left: `${position.x}px`, top: `${position.y}px`, touchAction: 'none' }}
      >
        <div className="px-3.5 py-2.5 bg-white/[0.04] border-b border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <GripHorizontal className="w-3.5 h-3.5 text-white/40" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold truncate max-w-[110px] text-white">
              {partner.name}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 font-mono text-[11px] text-emerald-400">
            <span>{formatSec(roundSecondsLeft)}</span>
            <button
              type="button"
              onClick={() => { setIsFloating(false); playChime('click'); }}
              className="p-1 rounded-md hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleEndCall}
              className="p-1 rounded-md hover:bg-rose-500/30 text-rose-400 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mini Role & Score Status */}
        <div className="p-3 bg-slate-900/90 text-xs space-y-2 border-b border-white/10">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-indigo-300 font-medium">Раунд {currentRound}/2: {userCurrentRole.badge}</span>
            <span className="font-mono text-emerald-400 font-bold">ИИ: {userLiveScore}/100</span>
          </div>
          <div className="text-[11px] text-white/70 line-clamp-2 italic">
            «{userCoachNote}»
          </div>
        </div>

        {/* Controls */}
        <div className="p-2.5 bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            onClick={handleSwapRoles}
            className="px-2.5 py-1 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 text-[11px] font-medium flex items-center space-x-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Сменить роли</span>
          </button>

          <button
            type="button"
            onClick={handleEndCall}
            className="px-3 py-1 rounded-xl bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
          >
            Завершить
          </button>
        </div>
      </aside>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. FULL IMMERSIVE LIVE PAIR SPARRING VIEW (FULL-SCREEN HUD)
  // ---------------------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in select-none">
      <div className="w-full max-w-6xl h-[92vh] max-h-[850px] bg-slate-950/95 border border-white/15 rounded-3xl overflow-hidden shadow-2xl text-white flex flex-col justify-between relative">
        
        {/* Animated Role Swap Banner Notification */}
        {roleSwapBanner && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 rounded-2xl bg-amber-500/90 backdrop-blur-md text-slate-950 font-bold text-xs shadow-2xl flex items-center space-x-2 animate-bounce border border-amber-300">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>{roleSwapBanner}</span>
          </div>
        )}

        {/* Top Minimalist Header with AI-Agent Matchmaking Badge */}
        <div className="px-6 py-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 font-mono text-[11px] font-semibold uppercase">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>ИИ-Агенты согласовали парный созвон</span>
              </span>
              <span className="hidden md:inline-flex text-[11px] font-mono text-emerald-400">
                Match: {pairTask.aiAgentsNegotiationSummary?.matchScore || 98}%
              </span>
            </div>

            <div className="hidden sm:block text-xs font-medium text-white/70">
              Тема: <span className="text-white font-semibold">«{pairTask.topic}»</span>
            </div>

            {/* View Mode Switcher (Sparring HUD vs Real WebRTC video) */}
            <div className="hidden md:flex items-center bg-white/[0.06] p-0.5 rounded-xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => { setViewMode('sparring_hud'); playChime('click'); }}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  viewMode === 'sparring_hud' ? 'bg-indigo-600 text-white shadow-xs' : 'text-white/60 hover:text-white'
                }`}
              >
                🎙️ Спарринг-HUD
              </button>
              <button
                type="button"
                onClick={() => { setViewMode('webrtc_call'); playChime('click'); }}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center space-x-1 ${
                  viewMode === 'webrtc_call' ? 'bg-emerald-600 text-white shadow-xs' : 'text-white/60 hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5 text-emerald-300" />
                <span>WebRTC Звонок</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            {/* Round Indicator & Timer */}
            <div className="flex items-center space-x-2 bg-white/[0.04] border border-white/10 px-3 py-1 rounded-2xl text-xs font-mono">
              <span className="text-indigo-300 font-semibold">Раунд {currentRound}/2</span>
              <span className="text-white/20">|</span>
              <span className="flex items-center space-x-1 text-emerald-400">
                <Timer className="w-3.5 h-3.5" />
                <span>{formatSec(roundSecondsLeft)}</span>
              </span>
            </div>

            {/* PiP Button */}
            <button
              type="button"
              onClick={() => { setIsFloating(true); playChime('click'); }}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer"
              title="Свернуть в компактное плавающее окно"
            >
              <Minimize2 className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Свернуть в угол</span>
            </button>

            <button
              type="button"
              onClick={handleEndCall}
              className="p-1.5 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body: 2 Main Columns (Video/Role Arena + Live Speech & Dual AI Evaluation Stream) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* LEFT 7 COLS: Video Arena & Interactive Role Cards or WebRTC Call */}
          <div className="lg:col-span-7 flex flex-col justify-between p-4 sm:p-5 border-r border-white/10 bg-slate-900/40 space-y-4 overflow-y-auto custom-scrollbar">
            
            {viewMode === 'webrtc_call' ? (
              <div className="flex-1 flex flex-col h-full space-y-3 min-h-[420px]">
                {/* WebRTC Status and Sharing Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white/[0.04] border border-white/10 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-300">Прямой WebRTC P2P видеоканал</span>
                    <span className="text-[11px] font-mono text-white/50">({partner.name})</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleCopyRoomUrl}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer"
                      title="Скопировать ссылку для напарника"
                    >
                      {copiedRoomUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedRoomUrl ? 'Скопировано!' : 'Копировать ссылку'}</span>
                    </button>
                    <a
                      href={effectiveRoomUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 text-xs font-medium flex items-center space-x-1.5 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>В отдельной вкладке</span>
                    </a>
                  </div>
                </div>

                {/* Embedded WebRTC Frame */}
                <div className="flex-1 min-h-[380px] rounded-3xl overflow-hidden border border-white/15 bg-slate-950 relative shadow-2xl flex flex-col">
                  <iframe
                    src={effectiveRoomUrl}
                    allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                    className="w-full flex-1 min-h-[380px] border-0 rounded-3xl"
                    title="WebRTC Video Conference"
                  />
                </div>
              </div>
            ) : (
              <>
                {/* Dual Video Feeds */}
                <div className="grid grid-cols-2 gap-3 h-52 sm:h-60">
                  
                  {/* Partner Video Tile */}
                  <div className={`relative rounded-2xl overflow-hidden bg-slate-950 border transition-all duration-300 flex flex-col items-center justify-center group shadow-lg ${
                    isPartnerSpeaking ? 'border-emerald-400 ring-2 ring-emerald-400/50 shadow-emerald-950/50' : 'border-white/10'
                  }`}>
                    {partner.avatar ? (
                      <img src={partner.avatar} alt={partner.name || 'Напарник'} className="w-full h-full object-cover filter brightness-95" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-300">
                        <div className={`w-14 h-14 rounded-2xl bg-indigo-950 border text-indigo-300 font-extrabold flex items-center justify-center text-lg shadow-xl mb-2 transition-transform ${
                          isPartnerSpeaking ? 'scale-110 border-emerald-400 text-emerald-300' : 'border-indigo-400/40'
                        }`}>
                          {(partner.name || 'Напарник').substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-white">@{partner.name || 'Напарник'}</span>
                      </div>
                    )}
                    
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 border border-white/10 text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${isPartnerSpeaking ? 'bg-emerald-300 animate-ping' : 'bg-emerald-400'}`} />
                      <span>{partnerCurrentRole.badge}</span>
                    </div>

                    {/* Partner Voice Mute / Speak Indicator */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsPartnerVoiceMuted((prev) => !prev);
                        if (!isPartnerVoiceMuted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                          try { window.speechSynthesis.cancel(); } catch {}
                          setIsPartnerSpeaking(false);
                        }
                      }}
                      className={`absolute top-2 right-2 px-2 py-0.5 rounded-lg text-[10px] font-mono flex items-center space-x-1 cursor-pointer transition ${
                        isPartnerVoiceMuted
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                          : isPartnerSpeaking
                          ? 'bg-emerald-500 text-slate-950 font-bold animate-pulse'
                          : 'bg-black/60 text-white/70 border border-white/10 hover:text-white'
                      }`}
                      title={isPartnerVoiceMuted ? 'Включить голос напарника' : 'Выключить озвучку реплик'}
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>{isPartnerVoiceMuted ? 'Без звука' : isPartnerSpeaking ? 'Говорит...' : 'Голос'}</span>
                    </button>

                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/70 text-[10px] font-mono text-white/80">
                      {partner.role}
                    </div>
                  </div>

                  {/* Local User Video Tile */}
                  <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-white/10 flex flex-col items-center justify-center shadow-lg">
                    {isVideoOff ? (
                      <div className="flex flex-col items-center justify-center text-white/40 text-xs">
                        <VideoOff className="w-8 h-8 mb-1" />
                        <span>Камера выключена</span>
                      </div>
                    ) : hasCameraPermission ? (
                      <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-white/60">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-950 border border-emerald-400/40 text-emerald-300 font-extrabold flex items-center justify-center text-lg shadow-xl mb-2">
                          ВЫ
                        </div>
                        <span className="text-xs font-semibold text-white">Ваш поток</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 border border-white/10 text-[10px] font-mono text-indigo-300 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                      <span>{userCurrentRole.badge}</span>
                    </div>

                    {/* Real-time Voice Audio Visualizer Bars */}
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-black/70 flex items-center space-x-1">
                      <Activity className="w-3 h-3 text-emerald-400" />
                      <div className="flex items-end space-x-0.5 h-3">
                        <div className="w-1 bg-emerald-400 rounded-xs transition-all duration-75" style={{ height: `${Math.max(2, (audioVolumeLevel * 0.8))}%` }} />
                        <div className="w-1 bg-emerald-400 rounded-xs transition-all duration-75" style={{ height: `${Math.max(2, audioVolumeLevel)}%` }} />
                        <div className="w-1 bg-emerald-400 rounded-xs transition-all duration-75" style={{ height: `${Math.max(2, (audioVolumeLevel * 0.6))}%` }} />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Current Role Card & Switch Action */}
                <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/10 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-2.5">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono text-xs font-semibold">
                        Ваша текущая роль: {userCurrentRole.title}
                      </span>
                    </div>

                    {/* Role Switcher Button */}
                    <button
                      type="button"
                      onClick={handleSwapRoles}
                      className="px-3.5 py-1.5 rounded-xl bg-white text-slate-950 font-bold text-xs hover:bg-slate-200 transition cursor-pointer flex items-center space-x-1.5 active:scale-95 shadow-md"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-950" />
                      <span>Сменить роли (Раунд {currentRound === 1 ? 2 : 1})</span>
                    </button>
                  </div>

                  <p className="text-xs text-white/70 leading-relaxed font-light">
                    {userCurrentRole.description}
                  </p>

                  {/* Talking Points */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
                      Тезисы и цели вашей роли:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {userCurrentRole.talkingPoints.map((point, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAddUtterance('user', 'Вы', point)}
                          className="p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-left text-xs text-white/80 hover:text-white transition cursor-pointer flex items-start space-x-1.5 group"
                          title="Кликните, чтобы озвучить тезис в диалоге"
                        >
                          <MessageSquare className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                          <span className="leading-snug">{point}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>

          {/* RIGHT 5 COLS: Live Speech Parser & Dual AI Operators Assessment */}
          <div className="lg:col-span-5 flex flex-col justify-between p-4 sm:p-5 bg-slate-950 space-y-4 overflow-hidden">
            
            {/* Dual AI Operators Live Score Cards */}
            <div className="grid grid-cols-2 gap-2.5 shrink-0">
              
              {/* Your AI Operator */}
              <div className="p-3 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 flex flex-col justify-between space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-indigo-300 font-semibold flex items-center space-x-1">
                    <Bot className="w-3 h-3" />
                    <span>Ваш ИИ-Оператор</span>
                  </span>
                  <span className="font-bold text-emerald-400">{userLiveScore}/100</span>
                </div>
                <p className="text-[11px] text-white/80 line-clamp-2 leading-snug">
                  {userCoachNote}
                </p>
              </div>

              {/* Partner AI Operator */}
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10 flex flex-col justify-between space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-white/60 font-semibold flex items-center space-x-1">
                    <Bot className="w-3 h-3" />
                    <span>ИИ @{partner.name}</span>
                  </span>
                  <span className="font-bold text-sky-400">{partnerLiveScore}/100</span>
                </div>
                <p className="text-[11px] text-white/60 line-clamp-2 leading-snug">
                  {partnerCoachNote}
                </p>
              </div>

            </div>

            {/* Live Transcript / Speech Parser Feed */}
            <div className="flex-1 flex flex-col justify-between rounded-2xl bg-white/[0.02] border border-white/[0.08] p-3 overflow-hidden space-y-2">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-1.5 text-[10px] font-mono text-white/40 uppercase">
                <span className="flex items-center space-x-1.5">
                  <Volume2 className="w-3 h-3 text-emerald-400" />
                  <span>Речевой анализатор в реальном времени</span>
                </span>
                <span className="text-emerald-400 font-semibold">STT Live</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar text-xs">
                {liveTranscripts.map((ut) => (
                  <div
                    key={ut.id}
                    className={`p-2.5 rounded-2xl border text-left space-y-1 ${
                      ut.speaker === 'user'
                        ? 'bg-indigo-950/30 border-indigo-500/30 ml-4'
                        : ut.speakerName.includes('Смена ролей')
                        ? 'bg-amber-950/30 border-amber-500/30 mx-2 text-center text-amber-200'
                        : 'bg-white/[0.03] border-white/10 mr-4'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className={ut.speaker === 'user' ? 'text-indigo-300 font-bold' : 'text-white/70 font-semibold'}>
                        {ut.speakerName} ({ut.roleAtMoment})
                      </span>
                      <span className="text-white/40">{formatSec(ut.timestampSec)}</span>
                    </div>
                    <p className="text-white/90 leading-relaxed font-light">{ut.text}</p>
                  </div>
                ))}
                <div ref={transcriptBottomRef} />
              </div>

              {/* Quick Speech / Prompt Input */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  value={customSpeechInput}
                  onChange={(e) => setCustomSpeechInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customSpeechInput.trim()) {
                      handleAddUtterance('user', 'Вы', customSpeechInput.trim());
                      setCustomSpeechInput('');
                    }
                  }}
                  placeholder="Произнесите фразу или введите тезис..."
                  className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-hidden focus:border-indigo-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customSpeechInput.trim()) {
                      handleAddUtterance('user', 'Вы', customSpeechInput.trim());
                      setCustomSpeechInput('');
                    }
                  }}
                  className="p-2 rounded-xl bg-white text-slate-950 hover:bg-slate-200 transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Finish & Get Dual AI Grade Button */}
            <button
              type="button"
              onClick={handleTriggerFinalEvaluation}
              disabled={isEvaluatingFinal}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 text-white font-bold text-xs hover:opacity-95 transition cursor-pointer shadow-xl flex items-center justify-center space-x-2 active:scale-98 shrink-0"
            >
              <Award className="w-4 h-4" />
              <span>{isEvaluatingFinal ? 'ИИ-Операторы формируют оценку...' : evaluationUnavailable ? 'Оценка недоступна. Проверьте речь и повторите' : 'Завершить созвон и получить оценку'}</span>
            </button>

          </div>

        </div>

        {/* Bottom Control Bar */}
        <div className="px-6 py-3.5 border-t border-white/10 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleToggleMute}
              className={`p-2.5 rounded-2xl text-xs transition cursor-pointer ${
                isMuted ? 'bg-rose-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title={isMuted ? 'Включить микрофон' : 'Выключить микрофон'}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleToggleVideo}
              className={`p-2.5 rounded-2xl text-xs transition cursor-pointer ${
                isVideoOff ? 'bg-rose-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title={isVideoOff ? 'Включить камеру' : 'Выключить камеру'}
            >
              {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenPeerCollab && (
              <button
                type="button"
                onClick={() => {
                  setIsFloating(true);
                  onOpenPeerCollab();
                }}
                className="px-4 py-2 rounded-2xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Доска & Код</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleEndCall}
              className="px-5 py-2 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Завершить звонок</span>
            </button>
          </div>
        </div>

      </div>

      {/* FINAL DUAL AI OPERATOR ASSESSMENT SCORECARD MODAL */}
      {finalScorecard && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-fade-in">
          <div className="w-full max-w-3xl bg-slate-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-white space-y-6 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="space-y-1">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 font-mono text-[11px] font-bold uppercase">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{finalScorecard.userGrade.score >= 70 ? 'Парный спарринг проверен и зачтён' : 'Оценка проверена, требуется доработка'}</span>
                </span>
                <h2 className="text-xl sm:text-2xl font-light text-white">
                  Оценка от персональных ИИ-Операторов
                </h2>
              </div>

              <div className="text-right">
                <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                  +{finalScorecard.userGrade.score >= 70 ? Math.round(finalScorecard.userGrade.score * 1.5) : 0} XP
                </div>
                <span className="text-[10px] font-mono text-white/40 uppercase">{finalScorecard.userGrade.score >= 70 ? 'Карма за парную работу' : 'Без зачёта'}</span>
              </div>
            </div>

            {/* Dual Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* User Grade */}
              <div className="p-5 rounded-3xl bg-indigo-950/20 border border-indigo-500/30 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono uppercase text-indigo-300 font-bold">
                    {finalScorecard.userGrade.operatorName}
                  </span>
                  <span className="text-2xl font-black text-indigo-400 font-mono">
                    {finalScorecard.userGrade.score}/100
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white">
                  {finalScorecard.userGrade.verdict}
                </h4>
                <div className="space-y-1 text-xs text-white/80">
                  <span className="text-[10px] font-mono uppercase text-white/40 block">Сильные стороны:</span>
                  {finalScorecard.userGrade.strengths?.map((s: string, i: number) => (
                    <div key={i} className="flex items-center space-x-1.5 text-emerald-300">
                      <span>✓</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-indigo-200/90 italic pt-1 border-t border-white/[0.08]">
                  «{finalScorecard.userGrade.coachAdvice}»
                </p>
              </div>

              {/* Partner Grade */}
              <div className="p-5 rounded-3xl bg-slate-900/70 border border-white/10 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono uppercase text-white/60 font-bold">
                    {finalScorecard.partnerGrade.operatorName}
                  </span>
                  <span className="text-2xl font-black text-sky-400 font-mono">
                    {finalScorecard.partnerGrade.score}/100
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white">
                  {finalScorecard.partnerGrade.verdict}
                </h4>
                <div className="space-y-1 text-xs text-white/80">
                  <span className="text-[10px] font-mono uppercase text-white/40 block">Сильные стороны:</span>
                  {finalScorecard.partnerGrade.strengths?.map((s: string, i: number) => (
                    <div key={i} className="flex items-center space-x-1.5 text-sky-300">
                      <span>✓</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-white/70 italic pt-1 border-t border-white/[0.08]">
                  «{finalScorecard.partnerGrade.coachAdvice}»
                </p>
              </div>

            </div>

            {/* Final Reflection */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-xs text-white/70 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white">Итог ИИ-Агентов: </span>
                <span>{finalScorecard.matchReflection}</span>
              </div>
              {finalScorecard.userGrade.score >= 70 && <button
                type="button"
                onClick={copyCertificateToClipboard}
                className="ml-3 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center space-x-1 shrink-0 transition cursor-pointer"
                title="Скопировать верификацию спарринга"
              >
                {copiedCertificate ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCertificate ? 'Скопировано' : 'Сертификат'}</span>
              </button>}
            </div>

            <button
              type="button"
              onClick={() => {
                setFinalScorecard(null);
                handleEndCall();
              }}
              className="w-full py-4 rounded-2xl bg-white text-slate-950 font-bold text-sm hover:bg-slate-200 transition cursor-pointer shadow-xl"
            >
              {finalScorecard.userGrade.score >= 70 ? 'Закрыть и принять зачёт' : 'Закрыть оценку'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
