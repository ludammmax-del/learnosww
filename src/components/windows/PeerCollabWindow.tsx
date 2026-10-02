import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Palette, 
  MessageSquare, 
  Layers, 
  Radio, 
  Share2, 
  Check, 
  Lock, 
  Unlock, 
  Tag, 
  Plus, 
  ExternalLink,
  BookOpen,
  Info
} from 'lucide-react';
import { playChime } from '../../utils/audio.ts';
import { PeerPartner, DAGNode, LearningUnit, NoteItem, UserArtifact, CommunityRoom, ProfileNodeSnapshot } from '../../types.ts';
import { InfiniteWhiteboard } from '../whiteboard/InfiniteWhiteboard.tsx';
import { RoomChatTab } from '../community/RoomChatTab.tsx';
import { CommunityRoomsHub } from '../community/CommunityRoomsHub.tsx';
import { peerCollabSync } from '../../services/peerCollabSync.ts';
import { communityRoomService } from '../../services/communityRoomService.ts';

interface PeerCollabWindowProps {
  partner?: PeerPartner | null;
  onPartnerMatched?: (partner: PeerPartner) => void;
  isSearchingBuddy?: boolean;
  onStartMatchmaking?: () => void;
  onDisconnectPartner?: () => void;
  initialTab?: string;
  activeUnitId?: string;
  activeUnit?: LearningUnit;
  onSelectUnit?: (unitId: string) => void;
  onAdoptProfileNode?: (snapshot: ProfileNodeSnapshot) => void;
  onStartSolo?: () => void;
  onSaveNote?: (title: string, content: string, tag: string) => void;
  onSaveArtifact?: (artifact: UserArtifact) => void;
  onLessonCompleted?: (unitId: string) => void;
  onSyncWithMainPlayer?: () => void;
  nodes?: DAGNode[];
  notes?: NoteItem[];
  currentUser?: { uid: string; displayName: string; email: string; photoURL?: string } | null;
  isPreviewMode?: boolean;
}

export const PeerCollabWindow: React.FC<PeerCollabWindowProps> = ({
  partner,
  onPartnerMatched,
  onDisconnectPartner,
  activeUnitId,
  activeUnit,
  onSelectUnit,
  onAdoptProfileNode,
  nodes,
  notes,
  currentUser,
  initialTab,
  onSaveNote,
}) => {
  // Navigation inside Room & Community
  const normalizeTab = (tab?: string): 'whiteboard' | 'chat' | 'community' | 'info' => {
    if (tab === 'chat' || tab === 'debate') return 'chat';
    if (tab === 'community' || tab === 'rooms') return 'community';
    if (tab === 'info' || tab === 'manifesto') return 'info';
    return 'whiteboard'; // Default to Infinite Whiteboard
  };

  const [activeTab, setActiveTab] = useState<'whiteboard' | 'chat' | 'community' | 'info'>(
    normalizeTab(initialTab)
  );
  const [isCurrentUserBanned, setIsCurrentUserBanned] = useState(false);

  // Active Current Room
  const [currentRoom, setCurrentRoom] = useState<CommunityRoom>(() => {
    return {
      id: partner?.roomCode || 'room-open-learning-lab',
      name: partner?.targetGoal || activeUnit?.title ? `⚡ Группа: ${activeUnit?.title || 'Архитектура систем'}` : '⚡ Open Architecture & Learning Lab',
      description: 'Открытое пространство группы для совместного проектирования архитектурных диаграмм на бесконечной доске и обсуждения решений в чате.',
      bioMarkdown: '### Манифест и регламент группы\n- Свободный обмен идеями и декомпозиция сложных тем.\n- Проектирование инвариантов на общей бесконечной доске.\n- Взаимное ревью и открытые обсуждения.',
      category: partner?.skillDomain || 'Распределенные системы',
      tags: ['Архитектура', 'Практика', 'Инварианты', 'Доска'],
      isPrivate: false,
      creatorId: partner?.id || 'creator-1',
      creatorName: partner?.name || 'Организатор группы',
      createdAt: new Date().toISOString(),
      memberCount: 8,
      maxMembers: 30,
      activeTopic: activeUnit?.title || 'Проектирование надежных систем',
    };
  });

  const [copiedLink, setCopiedLink] = useState(false);

  // Sync Room with partner prop
  useEffect(() => {
    if (partner) {
      if (partner.roomCode) {
        peerCollabSync.setRoomId(partner.roomCode);
      }
      setCurrentRoom((prev) => ({
        ...prev,
        id: partner.roomCode || prev.id,
        name: partner.targetGoal || prev.name,
        category: partner.skillDomain || prev.category,
        creatorName: partner.name || prev.creatorName,
      }));
    }
  }, [partner]);

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsCurrentUserBanned(false);
      return;
    }
    return communityRoomService.subscribeRoomBan(currentRoom.id, currentUser.uid, setIsCurrentUserBanned);
  }, [currentRoom.id, currentUser?.uid]);

  const handleSelectRoomFromCommunity = (room: CommunityRoom) => {
    setIsCurrentUserBanned(false);
    setCurrentRoom(room);
    peerCollabSync.setRoomId(room.id);
    setActiveTab('whiteboard');
    playChime('success');
  };

  return (
    <div className="flex flex-col h-full bg-white text-gray-900 select-none overflow-hidden font-sans">
      {/* 1. TOP GOOGLE MINIMALIST HEADER */}
      <header className="h-14 px-5 bg-white border-b border-gray-200 flex items-center justify-between shrink-0 shadow-xs z-30">
        {/* Left: Room Badge & Title */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100">
            {currentRoom.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-sm text-gray-900 truncate">
                {currentRoom.name}
              </h2>
              {currentRoom.isPrivate ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center space-x-1 shrink-0">
                  <Lock className="w-3 h-3 text-amber-600" />
                  <span>Закрытая</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center space-x-1 shrink-0">
                  <Unlock className="w-3 h-3 text-emerald-600" />
                  <span>Комьюнити</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 truncate">
              Категория: {currentRoom.category} • Участников: {currentRoom.memberCount || 1}
            </p>
          </div>
        </div>

        {/* Center: Segmented Mode Switcher (Google Style) */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
          <button
            type="button"
            onClick={() => {
              setActiveTab('whiteboard');
              playChime('click');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'whiteboard'
                ? 'bg-white text-blue-600 shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-blue-600" />
            <span>Бесконечная Доска</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('chat');
              playChime('click');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'chat'
                ? 'bg-white text-blue-600 shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>Общий Чат</span>
          </button>

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
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Все Комнаты</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('info');
              playChime('click');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'info'
                ? 'bg-white text-blue-600 shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>Инфо & Участники</span>
          </button>
        </div>

        {/* Right: Share / Invite Link */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/#room=${currentRoom.id}`);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2000);
              playChime('click');
            }}
            className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium transition cursor-pointer flex items-center space-x-1.5 shadow-2xs"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-gray-500" />}
            <span>{copiedLink ? 'Ссылка скопирована' : 'Пригласить'}</span>
          </button>
        </div>
      </header>

      {/* 2. BODY CONTENT (Strict Google White Minimalism) */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-white">
        {activeTab === 'whiteboard' && (
          <div className="w-full h-full">
            <InfiniteWhiteboard
              key={currentRoom.id}
              roomId={currentRoom.id}
              roomName={currentRoom.name}
              currentUser={currentUser}
            />
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="w-full h-full">
            <RoomChatTab
              room={currentRoom}
              currentUser={currentUser}
              activeUnit={activeUnit}
              onSelectUnit={onSelectUnit}
              onAdoptProfileNode={onAdoptProfileNode}
              nodes={nodes}
            />
          </div>
        )}

        {activeTab === 'community' && (
          <div className="w-full h-full overflow-y-auto p-6 bg-white">
            <div className="max-w-6xl mx-auto">
              <CommunityRoomsHub
                currentUser={currentUser}
                nodes={nodes}
                notes={notes}
                activeUnitId={activeUnitId}
                onSelectUnit={onSelectUnit}
                onSaveNote={onSaveNote}
                onEnterRoom={handleSelectRoomFromCommunity}
                activeRoomId={currentRoom.id}
              />
            </div>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="w-full h-full overflow-y-auto p-6 bg-[#fafbfc]">
            <div className="max-w-4xl mx-auto space-y-5">
              {/* Header Card */}
              <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                      О пространстве комнаты
                    </span>
                    <h3 className="text-lg font-bold text-gray-900">{currentRoom.name}</h3>
                    <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
                      {currentRoom.description}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                    {currentRoom.category}
                  </span>
                </div>

                <div className="flex items-center space-x-3 pt-2 text-xs text-gray-500 border-t border-gray-100">
                  <span>Организатор: <strong className="text-gray-800">{currentRoom.creatorName}</strong></span>
                  <span>•</span>
                  <span>Лимит участников: <strong>{currentRoom.maxMembers || 30}</strong></span>
                  <span>•</span>
                  <span>Код комнаты: <strong className="font-mono text-gray-800">{currentRoom.id}</strong></span>
                </div>
              </div>

              {/* Bio & Manifesto */}
              {currentRoom.bioMarkdown && (
                <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-2">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center space-x-1.5">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Манифест и правила работы</span>
                  </h4>
                  <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-xl border border-gray-200 font-sans">
                    {currentRoom.bioMarkdown}
                  </div>
                </div>
              )}

              {/* Tags Card */}
              <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Теги комнаты:</h4>
                <div className="flex flex-wrap gap-1.5">
                  {currentRoom.tags.map((tag, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 font-medium text-xs border border-gray-200 flex items-center space-x-1">
                      <Tag className="w-3 h-3 text-gray-500" />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {isCurrentUserBanned && activeTab !== 'community' && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-white px-6 text-center">
            <Lock className="mb-3 h-7 w-7 text-rose-600" />
            <h3 className="text-sm font-bold text-gray-900">Доступ к группе заблокирован</h3>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-gray-500">Владелец удалил вас из группы и запретил повторное вступление.</p>
            <button type="button" onClick={() => setActiveTab('community')} className="mt-4 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">
              Перейти к списку групп
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
