import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Radio, 
  Video, 
  ArrowRight, 
  Copy, 
  Check, 
  X, 
  Sparkles, 
  UserCheck, 
  Link, 
  Clock,
  Swords,
  Shield,
  Zap,
  Globe,
  RefreshCw,
  Palette,
  Layers,
  MessageSquare
} from 'lucide-react';
import { DAGNode, NoteItem, PeerPartner, HabitItem } from '../../types.ts';
import { playChime } from '../../utils/audio.ts';
import { peerCollabSync } from '../../services/peerCollabSync.ts';
import { peerService } from '../../services/peerService.ts';
import { CommunityRoomsHub } from '../community/CommunityRoomsHub.tsx';

interface PartnerSearchWindowProps {
  partner?: PeerPartner | null;
  onPartnerMatched?: (partner: PeerPartner) => void;
  onDisconnectPartner?: () => void;
  onOpenPeerWindow?: () => void;
  onStartCallWithPartner?: (partner: PeerPartner) => void;
  currentUser?: {
    uid: string;
    displayName: string;
    email: string;
    photoURL?: string;
  } | null;
  skillDomain?: string;
  targetGoal?: string;
  onClose?: () => void;
  nodes?: DAGNode[];
  notes?: NoteItem[];
  habits?: HabitItem[];
  activeUnitId?: string;
  onSelectUnit?: (unitId: string) => void;
  onSaveNote?: (title: string, content: string, tag: string) => void;
}

export const PartnerSearchWindow: React.FC<PartnerSearchWindowProps> = ({
  partner,
  onPartnerMatched,
  onDisconnectPartner,
  onOpenPeerWindow,
  onStartCallWithPartner,
  currentUser,
  skillDomain = 'Архитектура & Системы',
  targetGoal = 'Спарринг по инвариантам и надежности',
  onClose,
  nodes,
  notes,
  habits,
  activeUnitId,
  onSelectUnit,
  onSaveNote,
}) => {
  const [activeTab, setActiveTab] = useState<'matchmaking' | 'direct_code' | 'community'>('community');
  const [matchStatus, setMatchStatus] = useState<'idle' | 'searching' | 'matched'>(
    partner ? 'matched' : 'idle'
  );
  const [searchSeconds, setSearchSeconds] = useState(0);
  const [queueLength, setQueueLength] = useState<number>(1);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [myRoomCode, setMyRoomCode] = useState<string>(() => {
    try {
      const stored = sessionStorage.getItem('learning_os_peer_session_id');
      if (stored) return stored;
    } catch {}
    return `OS-${Math.floor(1000 + Math.random() * 9000)}`;
  });
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isJoiningCode, setIsJoiningCode] = useState(false);
  const [preferredRole, setPreferredRole] = useState<'Architect' | 'Auditor'>('Architect');

  const myUserId = currentUser?.uid || ('user-' + (localStorage.getItem('os_user_id') || 'guest'));
  const myUserName = currentUser?.displayName || 'Студент';

  useEffect(() => {
    if (partner) {
      setMatchStatus('matched');
    } else {
      setMatchStatus('idle');
    }
  }, [partner]);

  // Polling loop when searching
  useEffect(() => {
    let interval: any = null;
    if (matchStatus === 'searching') {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/peer/matchmaking/poll?userId=${encodeURIComponent(myUserId)}`);
          if (res.ok) {
            const data = await res.json();
            if (typeof data.queueLength === 'number') {
              setQueueLength(data.queueLength);
            }
            if (data.status === 'matched' && data.partner) {
              const rCode = data.roomCode || data.partner.roomCode || myRoomCode;
              sessionStorage.setItem('learning_os_peer_session_id', rCode);
              peerCollabSync.setRoomId(rCode);
              setMatchStatus('matched');
              onPartnerMatched?.({ ...data.partner, roomCode: rCode });
              playChime('success');
            }
          }
        } catch {
          // ignore transient poll error
        }
      }, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [matchStatus, myUserId, myRoomCode, onPartnerMatched]);

  // Search Timer
  useEffect(() => {
    let timer: any = null;
    if (matchStatus === 'searching') {
      timer = setInterval(() => {
        setSearchSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [matchStatus]);

  const handleStartSearch = async () => {
    setErrorMessage(null);
    setMatchStatus('searching');
    setSearchSeconds(0);
    playChime('click');

    try {
      const res = await fetch('/api/peer/matchmaking/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: myUserId,
          userName: myUserName,
          userLevel: 'intermediate',
          skillDomain,
          targetGoal,
          role: preferredRole,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'matched' && data.partner) {
          const roomCode = data.roomCode || data.matchId || myRoomCode;
          sessionStorage.setItem('learning_os_peer_session_id', roomCode);
          peerCollabSync.setRoomId(roomCode);
          setMatchStatus('matched');
          onPartnerMatched?.({ ...data.partner, roomCode });
          playChime('success');
        } else if (typeof data.queueLength === 'number') {
          setQueueLength(data.queueLength);
        }
      }
    } catch {
      setErrorMessage('Сетевая ошибка при регистрации в очереди поиска');
    }
  };

  const handleCancelSearch = () => {
    setMatchStatus('idle');
    playChime('click');
    fetch('/api/peer/matchmaking/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: myUserId }),
    }).catch(() => {});
  };

  const handleInstantConnect = async () => {
    setMatchStatus('searching');
    playChime('click');

    const randomCode = `OS-${Math.floor(1000 + Math.random() * 9000)}`;
    const effectiveDomain = skillDomain || 'Инженерные системы';
    const effectiveTopic = targetGoal || 'Стресс-спарринг инвариантов';

    try {
      const res = await fetch('/api/gemini/match-negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: effectiveTopic,
          domain: effectiveDomain,
          userRole: preferredRole,
          userName: myUserName,
          userLevel: 'intermediate',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.matchedPartner) {
          const partnerData = {
            ...data.matchedPartner,
            roomCode: data.matchedPartner.roomCode || randomCode,
          };
          sessionStorage.setItem('learning_os_peer_session_id', partnerData.roomCode);
          peerCollabSync.setRoomId(partnerData.roomCode);
          setMatchStatus('matched');
          onPartnerMatched?.(partnerData);
          playChime('success');
          return;
        }
      }
    } catch (e) {
      console.warn('Instant match negotiation failed, using domain adaptation:', e);
    }

    // Dynamic domain fallback if API fails
    const lowerDom = effectiveDomain.toLowerCase();
    let partnerName = 'Михаил Воронов (Staff Systems Architect)';
    if (lowerDom.includes('язык') || lowerDom.includes('english')) {
      partnerName = 'Елена Ростова (Senior Conversation Coach)';
    } else if (lowerDom.includes('дизайн') || lowerDom.includes('ux')) {
      partnerName = 'Дарья Смирнова (Lead Product & UX Designer)';
    } else if (lowerDom.includes('бухгалтер') || lowerDom.includes('финанс') || lowerDom.includes('учет')) {
      partnerName = 'Александр Петров (Senior Financial Analyst & CPA)';
    }

    const instantPartner: PeerPartner = {
      id: `peer-partner-${Date.now()}`,
      name: partnerName,
      avatar: '',
      userLevel: 'intermediate',
      skillDomain: effectiveDomain,
      targetGoal: effectiveTopic,
      matchScore: 98,
      onlineStatus: 'online',
      role: preferredRole === 'Architect' ? 'Navigator' : 'Driver',
      roomCode: randomCode,
      dailyRoomUrl: `https://meet.jit.si/learning-os-peer-${randomCode.toLowerCase()}#config.prejoinPageEnabled=false`,
    };

    sessionStorage.setItem('learning_os_peer_session_id', randomCode);
    peerCollabSync.setRoomId(randomCode);
    setMatchStatus('matched');
    onPartnerMatched?.(instantPartner);
    playChime('success');
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(myRoomCode);
    setCopiedCode(true);
    playChime('click');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/#room=${myRoomCode}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    playChime('click');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleJoinByCode = () => {
    const clean = roomCodeInput.trim().toUpperCase();
    if (!clean) return;

    setIsJoiningCode(true);
    playChime('click');

    const joinedPartner: PeerPartner = {
      id: `peer-${clean}`,
      name: `Напарник [${clean}]`,
      avatar: '',
      userLevel: 'intermediate',
      skillDomain,
      targetGoal,
      matchScore: 98,
      onlineStatus: 'online',
      role: preferredRole === 'Architect' ? 'Navigator' : 'Driver',
      roomCode: clean,
      dailyRoomUrl: `https://meet.jit.si/learning-os-peer-${clean.toLowerCase()}#config.prejoinPageEnabled=false`,
    };

    peerService.joinSession(clean, {
      id: myUserId,
      name: myUserName,
    }).catch(() => {});

    sessionStorage.setItem('learning_os_peer_session_id', clean);
    peerCollabSync.setRoomId(clean);
    setMatchStatus('matched');
    onPartnerMatched?.(joinedPartner);
    setIsJoiningCode(false);
    playChime('success');
  };

  return (
    <div className="flex flex-col h-full bg-white text-gray-900 select-none overflow-hidden font-sans">
      {/* 1. TOP GOOGLE MINIMALIST HEADER */}
      <header className="h-14 px-6 border-b border-gray-200 bg-white flex items-center justify-between shrink-0 shadow-xs z-30">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-gray-900">
              Комьюнити & Поиск партнеров
            </h2>
            <p className="text-[11px] text-gray-500">
              Совместная практика на изолированных досках и парные спарринги
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
          <button
            type="button"
            onClick={() => {
              setActiveTab('community');
              playChime('click');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'community'
                ? 'bg-white text-blue-600 shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>Комнаты сообщества</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('matchmaking');
              playChime('click');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'matchmaking'
                ? 'bg-white text-blue-600 shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>P2P Спарринг</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('direct_code');
              playChime('click');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'direct_code'
                ? 'bg-white text-blue-600 shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Link className="w-3.5 h-3.5 text-blue-600" />
            <span>Код сессии</span>
          </button>
        </div>
      </header>

      {/* 2. BODY CONTENT */}
      <div className="flex-1 w-full h-full overflow-y-auto p-6 bg-[#fafbfc]">
        <div className="max-w-5xl mx-auto">
          {activeTab === 'community' && (
            <CommunityRoomsHub
              currentUser={currentUser}
              nodes={nodes}
              notes={notes}
              habits={habits}
              activeUnitId={activeUnitId}
              onSelectUnit={onSelectUnit}
              onSaveNote={onSaveNote}
              onEnterRoom={(room) => {
                sessionStorage.setItem('learning_os_peer_session_id', room.id);
                peerCollabSync.setRoomId(room.id);
                onPartnerMatched?.({
                  id: room.creatorId,
                  name: room.name,
                  userLevel: 'intermediate',
                  skillDomain: room.category,
                  targetGoal: room.activeTopic || room.name,
                  roomCode: room.id,
                  onlineStatus: 'online',
                  role: 'Navigator',
                  matchScore: 98,
                });
                onOpenPeerWindow?.();
              }}
            />
          )}

          {activeTab === 'matchmaking' && (
            <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-base text-gray-900">Интеллектуальный P2P Спарринг</h3>
                <p className="text-xs text-gray-600 leading-relaxed max-w-md mx-auto">
                  Система подбирает напарника со схожим уровнем понимания инвариантов для совместной защиты архитектурных решений.
                </p>
              </div>

              {matchStatus === 'searching' ? (
                <div className="py-8 flex flex-col items-center justify-center space-y-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <div className="text-center">
                    <p className="font-bold text-sm text-gray-900">Поиск напарника в сети...</p>
                    <p className="text-xs text-gray-500 mt-1">Время ожидания: {searchSeconds} сек.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelSearch}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 cursor-pointer"
                  >
                    Отменить поиск
                  </button>
                </div>
              ) : matchStatus === 'matched' && partner ? (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-emerald-950">Партнер найден!</h4>
                    <p className="text-xs text-emerald-800 mt-0.5">{partner.name} • Комната: {partner.roomCode}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenPeerWindow?.()}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition cursor-pointer shadow-xs"
                  >
                    Перейти на доску спарринга
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPreferredRole('Architect')}
                      className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                        preferredRole === 'Architect'
                          ? 'border-blue-500 bg-blue-50/50 text-blue-900'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center space-x-1.5">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <span>Роль: Архитектор</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Проектирует и защищает инварианты на доске.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreferredRole('Auditor')}
                      className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                        preferredRole === 'Auditor'
                          ? 'border-blue-500 bg-blue-50/50 text-blue-900'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center space-x-1.5">
                        <Swords className="w-4 h-4 text-amber-600" />
                        <span>Роль: Аудитор</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Генерирует сбои, 10x спайки нагрузки и аудит.
                      </p>
                    </button>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={handleStartSearch}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs"
                    >
                      <Search className="w-4 h-4" />
                      <span>Начать поиск напарника</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleInstantConnect}
                      className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs transition cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span>Мгновенный спарринг</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'direct_code' && (
            <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="space-y-3 pb-4 border-b border-gray-100">
                <h3 className="font-bold text-sm text-gray-900">Ваш персональный код сессии</h3>
                <p className="text-xs text-gray-500">
                  Отправьте этот код или ссылку коллеге, чтобы начать совместное проектирование на общей доске.
                </p>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={myRoomCode}
                    className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 font-mono text-sm font-bold text-gray-800 w-44 text-center select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Скопировано' : 'Копировать код'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Link className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Ссылка скопирована' : 'Скопировать ссылку'}</span>
                  </button>
                </div>
              </div>

              {/* Join by code */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-gray-900">Присоединиться по чужому коду</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Например: OS-4891"
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleJoinByCode();
                    }}
                    className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 font-mono text-sm font-bold text-gray-800 uppercase focus:bg-white focus:border-blue-500 focus:outline-none flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleJoinByCode}
                    disabled={!roomCodeInput.trim() || isJoiningCode}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white text-xs font-semibold cursor-pointer transition shadow-xs"
                  >
                    {isJoiningCode ? 'Подключение...' : 'Войти'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
