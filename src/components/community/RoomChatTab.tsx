import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, 
  MessageSquare, 
  Check, 
  Copy, 
  Trash2, 
  Users, 
  Sparkles, 
  FileText, 
  Clock, 
  Pin, 
  X, 
  AtSign, 
  BookOpen, 
  ExternalLink, 
  Search, 
  Tag, 
  Layers, 
  StickyNote, 
  Paperclip,
  Zap,
  Camera,
  LayoutGrid,
  UserCircle2,
  Briefcase,
  Gauge,
  Flame,
  ShieldCheck,
  MessageCircleMore,
  Globe
} from 'lucide-react';
import { playChime } from '../../utils/audio.ts';
import { peerCollabSync } from '../../services/peerCollabSync.ts';
import { communityRoomService, RoomChatMessage } from '../../services/communityRoomService.ts';
import { CommunityRoom, LearningUnit, NoteItem, DAGNode, BlockGraphicSnapshot, UserProfile, ProfileWallPost, PartnerRequest, ProfileNodeSnapshot } from '../../types.ts';
import { INITIAL_NOTES } from '../../data/initialData.ts';
import { BlockGraphicSnapshotCard } from '../learning/BlockGraphicSnapshotCard.tsx';
import { auth } from '../../firebase.ts';
import { socialProfileService } from '../../services/socialProfileService.ts';

export interface NoteAttachment {
  id: string;
  title: string;
  content: string;
  tag: string;
  createdAt?: string;
}

interface RoomChatTabProps {
  room: CommunityRoom;
  currentUser?: { uid: string; displayName: string; email: string; photoURL?: string } | null;
  activeUnit?: LearningUnit;
  onSelectUnit?: (unitId: string) => void;
  onAdoptProfileNode?: (snapshot: ProfileNodeSnapshot) => void;
  nodes?: DAGNode[];
  defaultChannel?: 'general' | 'room';
}

export const RoomChatTab: React.FC<RoomChatTabProps> = ({
  room,
  currentUser,
  activeUnit,
  onSelectUnit,
  onAdoptProfileNode,
  nodes = [],
  defaultChannel,
}) => {
  // Channel state: toggle between Global Community Chat and Room Chat
  const [channel, setChannel] = useState<'general' | 'room'>(
    defaultChannel || (room.id === 'community_general' ? 'general' : 'room')
  );

  const effectiveRoomId = channel === 'general' ? 'community_general' : room.id;
  const effectiveRoomName = channel === 'general' ? 'Общий чат сообщества' : room.name;
  const effectiveCategory = channel === 'general' ? 'Все направления & Обсуждения' : room.category;

  // Capture only material and project details that belong to this learning unit.
  const buildUnitSnapshot = (unit?: LearningUnit): BlockGraphicSnapshot | undefined => {
    if (!unit) return undefined;
    return {
      unitId: unit.id,
      blockIndex: unit.blockIndex,
      title: unit.title,
      category: unit.category,
      authorName: unit.authorName,
      durationMin: unit.durationSec ? Math.round(unit.durationSec / 60) : undefined,
      summaryMarkdown: unit.summaryMarkdown?.slice(0, 6000),
      projectTitle: unit.projectTask?.title,
      projectDescription: unit.projectTask?.description,
      projectRequirements: unit.projectTask?.requirements,
      projectFilename: unit.projectTask?.defaultFilename,
      starterCode: unit.projectTask?.starterCode,
      capturedAt: new Date().toISOString()
    };
  };

  const getInitialMessages = (targetRoomId: string): RoomChatMessage[] => {
    try {
      const saved = localStorage.getItem(`room_chat_messages_${targetRoomId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error loading chat from localStorage', e);
    }
    if (targetRoomId === 'community_general') {
      return [
        {
          id: 'msg-general-welcome-1',
          senderId: 'system',
          senderName: 'Сообщество LearningOS',
          text: `Добро пожаловать в Общий чат сообщества! 🌍\nЗдесь собираются все студенты и инженеры платформы. Обсуждайте архитектуру, делитесь идеями, задавайте вопросы по любым блокам и находите напарников для парного спарринга.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          pinned: true,
        },
        {
          id: 'msg-general-welcome-2',
          senderId: 'system',
          senderName: 'Бот сообщества',
          text: `💡 Вы можете прикреплять конспекты через кнопку «Конспект» (@note) или делиться снимком текущего изучаемого блока через «Снимок блока» (@block).`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          attachedBlockSnapshot: buildUnitSnapshot(activeUnit)
        }
      ];
    }
    return [
      {
        id: 'msg-welcome-1',
        senderId: room.creatorId || 'system',
        senderName: room.creatorName || 'Организатор комнаты',
        senderAvatar: room.creatorAvatar,
        text: `Добро пожаловать в учебную комнату «${room.name}»! 🚀\nЗдесь можно задавать вопросы по теме комнаты, прикреплять конспекты через @note и делиться снимком текущего блока.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        pinned: true,
      },
      {
        id: 'msg-welcome-2',
        senderId: 'system',
        senderName: 'Бот комнаты',
        text: `💡 Посмотрите текущий изучаемый блок в этой группе:`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        attachedBlockSnapshot: buildUnitSnapshot(activeUnit)
      }
    ];
  };

  // 1. Messages State
  const [messages, setMessages] = useState<RoomChatMessage[]>(() => getInitialMessages(effectiveRoomId));

  // Sync messages when channel changes
  useEffect(() => {
    setMessages(getInitialMessages(effectiveRoomId));
  }, [effectiveRoomId]);

  const [inputMessage, setInputMessage] = useState('');
  const [pendingNotes, setPendingNotes] = useState<NoteAttachment[]>([]);
  const [pendingBlockSnapshot, setPendingBlockSnapshot] = useState<BlockGraphicSnapshot | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  
  // Note / Block mention popover state
  const [showMentionPopover, setShowMentionPopover] = useState(false);
  const [mentionType, setMentionType] = useState<'note' | 'block' | 'all'>('all');
  const [mentionFilter, setMentionFilter] = useState('');
  
  const [isNotePickerModalOpen, setIsNotePickerModalOpen] = useState(false);
  const [notePickerSearch, setNotePickerSearch] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [wallDraftText, setWallDraftText] = useState('');
  const [wallDraftKind, setWallDraftKind] = useState<ProfileWallPost['kind']>('debug');
  const [wallDraftNodeId, setWallDraftNodeId] = useState<string>('');
  const [wallDraftTaskId, setWallDraftTaskId] = useState<string>('');
  const [wallDraftSnippet, setWallDraftSnippet] = useState('');
  const [wallDraftLogs, setWallDraftLogs] = useState('');
  const [partnerRequests, setPartnerRequests] = useState<PartnerRequest[]>([]);
  const [profileSyncStatus, setProfileSyncStatus] = useState<'local' | 'syncing' | 'synced' | 'error'>('local');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [viewingNodeSnapshot, setViewingNodeSnapshot] = useState<ProfileNodeSnapshot | null>(null);
  
  // Active reading modal for opened note
  const [activeViewingNote, setActiveViewingNote] = useState<NoteAttachment | null>(null);
  const [copiedNoteContent, setCopiedNoteContent] = useState(false);
  const [showParticipantsSidebar, setShowParticipantsSidebar] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const myUserId = currentUser?.uid || 'user-' + (localStorage.getItem('os_user_id') || 'guest');
  const myUserName = currentUser?.displayName || 'Студент';
  const myUserAvatar = currentUser?.photoURL || '';
  const canSync = Boolean(currentUser?.uid && auth.currentUser?.uid === currentUser.uid);

  const participants = useMemo(() => {
    const map = new Map<string, { uid: string; displayName: string; avatar?: string; role: string; specialty: string; bio: string; status: 'focus' | 'idle' | 'break'; currentNodeIds: string[]; }>();

    if (currentUser) {
      map.set(myUserId, {
        uid: myUserId,
        displayName: myUserName,
        avatar: myUserAvatar,
        role: 'Учащийся',
        specialty: 'Не указана',
        bio: '',
        status: 'idle',
        currentNodeIds: nodes.filter((node) => node.status === 'active').map((node) => node.id),
      });
    }

    (room.members || []).forEach((member) => {
      if (!member.userId) return;
      map.set(member.userId, {
        uid: member.userId,
        displayName: member.userName || member.name || 'Участник',
        avatar: member.avatar,
        role: member.role || 'Member',
        specialty: 'Не указана',
        bio: '',
        status: 'idle',
        currentNodeIds: [],
      });
    });

    messages.forEach((msg) => {
      if (!msg.senderId || map.has(msg.senderId)) return;
      map.set(msg.senderId, {
        uid: msg.senderId,
        displayName: msg.senderName,
        avatar: msg.senderAvatar,
        role: 'Learner',
        specialty: 'Не указана',
        bio: '',
        status: 'idle',
        currentNodeIds: [],
      });
    });

    if (!map.has(myUserId) && currentUser) {
      map.set(myUserId, {
        uid: myUserId,
        displayName: myUserName,
        avatar: myUserAvatar,
        role: 'Учащийся',
        specialty: 'Не указана',
        bio: '',
        status: 'idle',
        currentNodeIds: nodes.filter((node) => node.status === 'active').map((node) => node.id),
      });
    }

    return Array.from(map.values());
  }, [room.members, messages, currentUser, myUserId, myUserName, myUserAvatar, activeUnit?.id, nodes]);

  const makeProfile = (seed: { uid: string; displayName: string; avatar?: string; role: string; specialty: string; bio: string; status: 'focus' | 'idle' | 'break'; currentNodeIds: string[] }): UserProfile => {
    const completedCount = seed.uid === myUserId ? nodes.filter((node) => node.status === 'completed').length : 0;
    return {
      uid: seed.uid,
      displayName: seed.displayName,
      avatar: seed.avatar,
      title: seed.role,
      specialty: seed.specialty,
      bio: seed.bio,
      status: seed.status,
      ringProgress: seed.uid === myUserId && nodes.length > 0 ? Math.round((completedCount / nodes.length) * 100) : 0,
      currentNodeIds: seed.currentNodeIds,
      currentNodes: [],
      partnerRequestStatus: 'none',
      wallPosts: [],
    };
  };

  const [profileMap, setProfileMap] = useState<Record<string, UserProfile>>(() => {
    const baseMap: Record<string, UserProfile> = {};
    participants.forEach((participant) => {
      baseMap[participant.uid] = makeProfile(participant);
    });

    try {
      const saved = localStorage.getItem(`learnos_public_profile_${myUserId}`);
      if (saved && baseMap[myUserId]) {
        const parsed = JSON.parse(saved) as Partial<UserProfile>;
        baseMap[myUserId] = { ...baseMap[myUserId], ...parsed, wallPosts: [], pairTask: undefined, partnerUid: undefined };
      }
    } catch (e) {
      console.warn('Failed to load local profile draft', e);
    }

    return baseMap;
  });

  useEffect(() => {
    try {
      const ownProfile = profileMap[myUserId];
      if (ownProfile) {
        localStorage.setItem(`learnos_public_profile_${myUserId}`, JSON.stringify({
          displayName: ownProfile.displayName,
          title: ownProfile.title,
          specialty: ownProfile.specialty,
          bio: ownProfile.bio,
        }));
      }
    } catch (e) {
      console.warn('Failed to save local profile draft', e);
    }
  }, [profileMap, myUserId]);

  const selectedProfile = selectedProfileId ? profileMap[selectedProfileId] || null : null;

  const currentProfile = profileMap[myUserId] || makeProfile({
    uid: myUserId,
    displayName: myUserName,
    avatar: myUserAvatar,
    role: 'Учащийся',
    specialty: 'Не указана',
    bio: '',
    status: nodes.some((node) => node.status === 'active') ? 'focus' : 'idle',
    currentNodeIds: nodes.filter((node) => node.status === 'active').map((node) => node.id),
  });

  const activePartnerRequest = partnerRequests.find((request) =>
    request.status === 'accepted' && (request.fromUserId === myUserId || request.toUserId === myUserId)
  );
  const activePartnerUid = activePartnerRequest
    ? activePartnerRequest.fromUserId === myUserId ? activePartnerRequest.toUserId : activePartnerRequest.fromUserId
    : null;
  const activePartnerProfile = activePartnerUid ? profileMap[activePartnerUid] || null : null;
  const selectedPartnerRequest = selectedProfileId
    ? partnerRequests.find((request) =>
      request.fromUserId === myUserId && request.toUserId === selectedProfileId ||
      request.toUserId === myUserId && request.fromUserId === selectedProfileId
    )
    : undefined;
  const incomingPartnerRequests = partnerRequests.filter((request) => request.toUserId === myUserId && request.status === 'pending');

  const participantIds = participants.map((participant) => participant.uid).filter((uid) => uid && uid !== 'system');
  const participantKey = Array.from(new Set([
    ...participantIds,
    ...partnerRequests.flatMap((request) => [request.fromUserId, request.toUserId]),
    myUserId,
  ])).sort().join('|');

  const selectedNodeCards: ProfileNodeSnapshot[] = selectedProfile
    ? selectedProfile.currentNodes?.length
      ? selectedProfile.currentNodes
      : selectedProfile.currentNodeIds.map((nodeId) => {
        const localNode = nodes.find((node) => node.id === nodeId);
        return {
          nodeId,
          title: localNode?.title || 'Активный учебный узел',
          subtitle: localNode?.subtitle,
          unitId: localNode?.unitId,
        };
      })
    : [];

  useEffect(() => {
    setProfileMap((previous) => {
      let updated = previous;
      participants.forEach((participant) => {
        if (updated[participant.uid]) return;
        if (updated === previous) updated = { ...previous };
        updated[participant.uid] = makeProfile(participant);
      });
      if (!updated[myUserId]) {
        if (updated === previous) updated = { ...previous };
        updated[myUserId] = makeProfile({
          uid: myUserId,
          displayName: myUserName,
          avatar: myUserAvatar,
          role: 'Учащийся',
          specialty: 'Не указана',
          bio: '',
          status: 'idle',
          currentNodeIds: nodes.filter((node) => node.status === 'active').map((node) => node.id),
        });
      }
      return updated;
    });
  }, [participants, myUserId, myUserName, myUserAvatar, nodes]);

  useEffect(() => {
    if (!canSync) {
      setProfileSyncStatus('local');
      return;
    }

    const unsubscribeRequests = socialProfileService.subscribePartnerRequests(myUserId, (requests) => {
      setPartnerRequests(requests);
    });
    return unsubscribeRequests;
  }, [canSync, myUserId]);

  useEffect(() => {
    if (!canSync) return;
    const unsubscribeProfiles = participantKey.split('|').filter(Boolean).map((uid) =>
      socialProfileService.subscribeProfile(uid, (cloudProfile) => {
        if (!cloudProfile) return;
        setProfileMap((previous) => {
          const fallback = participants.find((participant) => participant.uid === uid);
          const base = previous[uid] || makeProfile(fallback || {
            uid,
            displayName: 'Участник',
            role: 'Учащийся',
            specialty: 'Не указана',
            bio: '',
            status: 'idle',
            currentNodeIds: [],
          });
          if (!base) return previous;
          const merged: UserProfile = {
            ...base,
            ...cloudProfile,
            displayName: cloudProfile.displayName || base.displayName,
            title: cloudProfile.title || base.title,
            specialty: cloudProfile.specialty || base.specialty,
            bio: cloudProfile.bio ?? base.bio,
            ringProgress: typeof cloudProfile.ringProgress === 'number' ? cloudProfile.ringProgress : base.ringProgress,
            currentNodeIds: Array.isArray(cloudProfile.currentNodeIds) ? cloudProfile.currentNodeIds : base.currentNodeIds,
            currentNodes: Array.isArray(cloudProfile.currentNodes) ? cloudProfile.currentNodes : base.currentNodes,
            wallPosts: base.wallPosts || [],
          };
          if (JSON.stringify(previous[uid]) === JSON.stringify(merged)) return previous;
          return { ...previous, [uid]: merged };
        });
      })
    );
    return () => unsubscribeProfiles.forEach((unsubscribe) => unsubscribe());
  }, [canSync, participantKey]);

  useEffect(() => {
    if (!canSync || !currentUser) return;
    socialProfileService.publishIdentity({
      uid: currentUser.uid,
      displayName: myUserName,
      avatar: myUserAvatar || undefined,
    }).catch((error) => {
      console.warn('Public profile identity sync failed:', error);
      setProfileSyncStatus('error');
    });
  }, [canSync, currentUser?.uid, myUserName, myUserAvatar]);

  useEffect(() => {
    if (!canSync || !selectedProfileId) return;
    return socialProfileService.subscribeWallPosts(selectedProfileId, (wallPosts) => {
      setProfileMap((previous) => {
        const profile = previous[selectedProfileId];
        if (!profile || JSON.stringify(profile.wallPosts) === JSON.stringify(wallPosts)) return previous;
        return { ...previous, [selectedProfileId]: { ...profile, wallPosts } };
      });
    });
  }, [canSync, selectedProfileId]);

  const buildContextPairTask = (targetProfile: UserProfile) => {
    const nodeId = targetProfile.currentNodeIds[0] || currentProfile.currentNodeIds[0] || nodes.find((node) => node.status === 'active')?.id || 'root-node';
    const nodeTitle = nodes.find((node) => node.id === nodeId)?.title || activeUnit?.title || 'Ключевой узел';
    return {
      id: `pair-${Date.now()}`,
      title: `Парная ветка: ${nodeTitle}`,
      nodeId,
      nodeTitle,
      brief: `Общая задача для ${myUserName} и ${targetProfile.displayName}: по очереди объяснить узел, выполнить практику и сверить критерии результата.`,
    };
  };

  const handleProfileOpen = (uid: string) => {
    setSelectedProfileId(uid);
    playChime('click');
  };

  const handleSendPartnerRequest = async (targetProfile: UserProfile) => {
    if (!targetProfile || targetProfile.uid === myUserId || isSendingRequest) return;
    if (!canSync) {
      setProfileError('Войдите в аккаунт Firebase, чтобы отправить синхронизируемую заявку.');
      return;
    }

    const existingRequest = partnerRequests.find((request) =>
      request.fromUserId === myUserId && request.toUserId === targetProfile.uid && request.status !== 'rejected'
    );
    if (existingRequest) return;

    if (activePartnerRequest && activePartnerUid !== targetProfile.uid) {
      setProfileError('У вас уже есть активный напарник. Завершите текущую пару перед новой заявкой.');
      return;
    }

    setIsSendingRequest(true);
    setProfileError(null);
    try {
      const pairTask = buildContextPairTask(targetProfile);
      await socialProfileService.sendPartnerRequest({
        fromUserId: myUserId,
        toUserId: targetProfile.uid,
        message: `Предлагаю вместе пройти узел «${pairTask.nodeTitle}».`,
        pairTask,
      });
      setProfileSyncStatus('synced');
      playChime('success');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Не удалось отправить заявку.');
      setProfileSyncStatus('error');
      playChime('alert');
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleRespondToPartnerRequest = async (request: PartnerRequest, status: 'accepted' | 'rejected') => {
    if (!canSync) return;
    setProfileError(null);
    try {
      await socialProfileService.respondToPartnerRequest(request.id, myUserId, status);
      setProfileSyncStatus('synced');
      playChime(status === 'accepted' ? 'success' : 'click');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Не удалось обновить заявку.');
      setProfileSyncStatus('error');
      playChime('alert');
    }
  };

  const handleSaveProfileEdit = async (updatedProfile: UserProfile) => {
    if (updatedProfile.uid !== myUserId) return;
    const nextProfile = { ...updatedProfile, displayName: updatedProfile.displayName.trim() || myUserName };
    setProfileMap((previous) => ({ ...previous, [myUserId]: nextProfile }));
    setProfileError(null);

    if (!canSync) {
      setProfileSyncStatus('local');
      setProfileError('Изменения сохранены в этом браузере. Войдите в аккаунт Firebase для синхронизации между устройствами.');
      return;
    }

    setIsSavingProfile(true);
    setProfileSyncStatus('syncing');
    try {
      const currentNodes = currentProfile.currentNodes?.length
        ? currentProfile.currentNodes
        : currentProfile.currentNodeIds.map((nodeId) => {
            const node = nodes.find((item) => item.id === nodeId);
            return {
              nodeId,
              title: node?.title || 'Активный учебный узел',
              subtitle: node?.subtitle,
              unitId: node?.unitId,
            };
          });

      await socialProfileService.savePublicProfile({
        uid: myUserId,
        displayName: nextProfile.displayName,
        avatar: nextProfile.avatar,
        title: nextProfile.title,
        specialty: nextProfile.specialty,
        bio: nextProfile.bio,
        status: nextProfile.status,
        ringProgress: currentProfile.ringProgress,
        currentNodeIds: currentProfile.currentNodeIds,
        currentNodes,
      });
      setProfileSyncStatus('synced');
    } catch (error) {
      setProfileSyncStatus('error');
      setProfileError(error instanceof Error ? error.message : 'Не удалось сохранить профиль в облако.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCreateWallPost = async () => {
    if (!selectedProfile || !wallDraftText.trim() || isCreatingPost) return;
    if (!canSync) {
      setProfileError('Войдите в аккаунт Firebase, чтобы публиковать посты для других пользователей.');
      return;
    }

    setIsCreatingPost(true);
    setProfileError(null);
    try {
      await socialProfileService.createWallPost(selectedProfile.uid, {
        nodeId: wallDraftNodeId || undefined,
        taskId: wallDraftTaskId || undefined,
        kind: wallDraftKind,
        authorId: myUserId,
        authorName: myUserName,
        title: wallDraftKind === 'debug' ? 'Я застрял' : wallDraftKind === 'optimization' ? 'Оптимизация решения' : 'Заметка на полях',
        text: wallDraftText.trim(),
        snippet: wallDraftSnippet.trim() || undefined,
        logs: wallDraftLogs.trim() || undefined,
        createdAt: new Date().toISOString(),
      });
      setWallDraftText('');
      setWallDraftSnippet('');
      setWallDraftLogs('');
      setWallDraftKind('debug');
      setProfileSyncStatus('synced');
      playChime('success');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Не удалось опубликовать запись.');
      setProfileSyncStatus('error');
      playChime('alert');
    } finally {
      setIsCreatingPost(false);
    }
  };

  const nodeOptions = useMemo(() => {
    const fallback = [
      { id: activeUnit?.id || nodes[0]?.id || 'root-node', title: activeUnit?.title || nodes[0]?.title || 'Текущий узел' },
    ];
    return [...(nodes || []).map((node) => ({ id: node.id, title: node.title })), ...fallback].filter((option, idx, arr) => arr.findIndex((item) => item.id === option.id) === idx);
  }, [nodes, activeUnit]);

  const isEditingOwnProfile = selectedProfile && selectedProfile.uid === myUserId;

  // Load user's notebook notes
  const userNotes: NoteItem[] = useMemo(() => {
    try {
      const saved = localStorage.getItem('learning_os_notes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error loading notes:', e);
    }
    return INITIAL_NOTES;
  }, []);

  // Filtered notes for mention autocomplete
  const filteredMentionNotes = useMemo(() => {
    const q = mentionFilter.trim().toLowerCase();
    if (!q) return userNotes;
    return userNotes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.tag.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
    );
  }, [userNotes, mentionFilter]);

  // Realtime Firestore Chat Subscription
  useEffect(() => {
    const unsubscribeFirestore = communityRoomService.subscribeChatMessages(effectiveRoomId, (firestoreMsgs) => {
      if (firestoreMsgs.length > 0) {
        setMessages((prev) => {
          const map = new Map<string, RoomChatMessage>();
          prev.forEach(m => map.set(m.id, m));
          firestoreMsgs.forEach(m => map.set(m.id, m));
          return Array.from(map.values());
        });
      }
    });

    return () => {
      unsubscribeFirestore();
    };
  }, [effectiveRoomId]);

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`room_chat_messages_${effectiveRoomId}`, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat', e);
    }
  }, [messages, effectiveRoomId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to real-time WebRTC broadcasts from peerCollabSync
  useEffect(() => {
    const unsub = peerCollabSync.subscribeActions((action) => {
      if (action.actionType === 'room_chat_message' && action.payload?.message) {
        const incomingRoomId = action.payload.roomId || room.id;
        if (incomingRoomId === effectiveRoomId) {
          const incomingMsg = action.payload.message as RoomChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === incomingMsg.id)) return prev;
            playChime('click');
            return [...prev, incomingMsg];
          });
        }
      }
    });
    return () => unsub();
  }, [effectiveRoomId, room.id]);

  // Detect "@" / "@note" / "@block" typing in input
  const handleInputChange = (val: string) => {
    setInputMessage(val);

    const lastAtIndex = val.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const textAfterAt = val.substring(lastAtIndex + 1);
      if (!textAfterAt.includes('\n')) {
        setShowMentionPopover(true);
        const lower = textAfterAt.toLowerCase();
        if (lower.startsWith('block') || lower.startsWith('unit') || lower.startsWith('урок') || lower.startsWith('блок')) {
          setMentionType('block');
          setMentionFilter(textAfterAt.replace(/^(block|unit|урок|блок)\s*/i, '').trim());
        } else if (lower.startsWith('note') || lower.startsWith('конспект') || lower.startsWith('заметк')) {
          setMentionType('note');
          setMentionFilter(textAfterAt.replace(/^(note|конспект|заметк)\s*/i, '').trim());
        } else {
          setMentionType('all');
          setMentionFilter(textAfterAt.trim());
        }
        return;
      }
    }
    setShowMentionPopover(false);
  };

  const handleSelectMentionNote = (note: NoteItem) => {
    const attachment: NoteAttachment = {
      id: note.id,
      title: note.title,
      content: note.content,
      tag: note.tag,
      createdAt: note.createdAt,
    };

    if (!pendingNotes.some((n) => n.id === note.id)) {
      setPendingNotes((prev) => [...prev, attachment]);
    }

    const lastAtIndex = inputMessage.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const beforeAt = inputMessage.substring(0, lastAtIndex);
      setInputMessage(`${beforeAt}@note: «${note.title}» `);
    } else {
      setInputMessage((prev) => `${prev} @note: «${note.title}» `);
    }

    setShowMentionPopover(false);
    playChime('click');
    textareaRef.current?.focus();
  };

  const handleAttachCurrentBlockSnapshot = (unitToShare?: LearningUnit) => {
    const targetUnit = unitToShare || activeUnit;
    const snapshot = buildUnitSnapshot(targetUnit);
    if (!snapshot) return;
    setPendingBlockSnapshot(snapshot);

    const lastAtIndex = inputMessage.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const beforeAt = inputMessage.substring(0, lastAtIndex);
      setInputMessage(`${beforeAt}Посмотрите графический снимок блока: @block[${snapshot.title}] `);
    } else if (!inputMessage.trim()) {
      setInputMessage(`Привет! Посмотрите графический снимок блока, на котором я сейчас: @block[${snapshot.title}]`);
    }

    setShowMentionPopover(false);
    playChime('click');
    textareaRef.current?.focus();
  };

  const handleRemovePendingBlock = () => {
    setPendingBlockSnapshot(null);
    playChime('click');
  };

  const handleRemovePendingNote = (noteId: string) => {
    setPendingNotes((prev) => prev.filter((n) => n.id !== noteId));
    playChime('click');
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && pendingNotes.length === 0 && !pendingBlockSnapshot) return;

    const newMsg: RoomChatMessage = {
      id: 'msg-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      senderId: myUserId,
      senderName: myUserName,
      senderAvatar: myUserAvatar,
      text: inputMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachedNotes: pendingNotes.length > 0 ? [...pendingNotes] : undefined,
      attachedBlockSnapshot: pendingBlockSnapshot || undefined,
    };

    // Optimistically add to UI
    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');
    setPendingNotes([]);
    setPendingBlockSnapshot(null);
    setShowMentionPopover(false);
    playChime('click');

    // 1. Save to Firestore
    communityRoomService.sendChatMessage(effectiveRoomId, {
      senderId: newMsg.senderId,
      senderName: newMsg.senderName,
      senderAvatar: newMsg.senderAvatar,
      text: newMsg.text,
      timestamp: newMsg.timestamp,
      attachedNotes: newMsg.attachedNotes,
      attachedBlockSnapshot: newMsg.attachedBlockSnapshot,
    }).catch(err => console.warn('Chat Firestore save err:', err));

    // 2. Broadcast via WebRTC sync to active peers
    peerCollabSync.broadcastAction('room_chat_message', { message: newMsg, roomId: effectiveRoomId });
  };

  const handleCopyMessage = (msg: RoomChatMessage) => {
    navigator.clipboard.writeText(msg.text);
    setCopiedMsgId(msg.id);
    setTimeout(() => setCopiedMsgId(null), 2000);
    playChime('click');
  };

  const handleOpenNoteViewer = (note: NoteAttachment) => {
    setActiveViewingNote(note);
    setCopiedNoteContent(false);
    playChime('click');
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-900 select-text font-sans relative overflow-hidden">
      {/* 1. COMPACT CONTEXTUAL UTILITY TOOLBAR */}
      <div className="h-12 px-3 sm:px-4 border-b border-slate-200/90 bg-white flex items-center justify-between shrink-0 z-20 shadow-2xs gap-2">
        <div className="flex items-center space-x-2 text-xs min-w-0">
          {/* Segmented Channel Switcher */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200/90 shrink-0">
            <button
              type="button"
              onClick={() => {
                setChannel('general');
                playChime('click');
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer flex items-center space-x-1.5 ${
                channel === 'general'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>Общий чат</span>
            </button>

            {room.id !== 'community_general' && (
              <button
                type="button"
                onClick={() => {
                  setChannel('room');
                  playChime('click');
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer flex items-center space-x-1.5 ${
                  channel === 'room'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                <span className="truncate max-w-[120px] sm:max-w-[170px]">{room.name}</span>
              </button>
            )}
          </div>

          <span className="text-slate-300 hidden md:inline">·</span>
          <span className="text-slate-500 text-xs truncate hidden md:inline">
            {effectiveCategory}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Share Block Snapshot button */}
          <button
            type="button"
            onClick={() => handleAttachCurrentBlockSnapshot()}
            title="Поделиться графическим снимком текущего блока"
            className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-medium transition cursor-pointer flex items-center space-x-1.5 border border-sky-200/80"
          >
            <Camera className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden sm:inline">Снимок блока</span>
          </button>

          {/* Attach Note button */}
          <button
            type="button"
            onClick={() => {
              setIsNotePickerModalOpen(true);
              playChime('click');
            }}
            title="Прикрепить конспект из блокнота"
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition cursor-pointer flex items-center space-x-1.5 border border-slate-200"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Конспект</span>
          </button>

          {/* Participants toggle button */}
          <button
            type="button"
            onClick={() => {
              setShowParticipantsSidebar((prev) => !prev);
              playChime('click');
            }}
            title={showParticipantsSidebar ? 'Скрыть участников' : 'Показать участников'}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center space-x-1.5 border ${
              showParticipantsSidebar
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{participants.length}</span>
          </button>
        </div>
      </div>

      {/* 2. CHAT BODY WITH INTEGRATED INPUT & OPTIONAL SIDEBAR */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Main Chat Column */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50/50">
          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 space-y-4 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-400">
                <MessageSquare className="w-10 h-10 stroke-[1.5]" />
                <p className="text-xs max-w-sm leading-relaxed">
                  В этой комнате еще нет сообщений. Напишите первым или прикрепите конспект!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === myUserId;
                const isSystem = msg.senderId === 'system';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex items-start justify-center my-2">
                      <div className="max-w-xl w-full p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] text-indigo-600 font-semibold uppercase tracking-wider">
                          <span className="flex items-center space-x-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{msg.senderName}</span>
                          </span>
                          <span className="text-slate-400 font-normal font-mono text-[10px]">{msg.timestamp}</span>
                        </div>
                        {msg.text && (
                          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                            {msg.text}
                          </p>
                        )}

                        {/* Graphic Block Snapshot inside System Message */}
                        {msg.attachedBlockSnapshot && (
                          <div className="pt-1">
                            <BlockGraphicSnapshotCard
                              snapshot={msg.attachedBlockSnapshot}
                              onSelectUnit={onSelectUnit}
                            />
                          </div>
                        )}

                        {/* Attached Notes inside System Tip */}
                        {msg.attachedNotes && msg.attachedNotes.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 space-y-1.5">
                            {msg.attachedNotes.map((att) => (
                              <button
                                key={att.id}
                                type="button"
                                onClick={() => handleOpenNoteViewer(att)}
                                className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/80 transition cursor-pointer flex items-center justify-between group"
                              >
                                <div className="flex items-center space-x-2.5 min-w-0">
                                  <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                                  <div className="truncate">
                                    <span className="font-semibold text-xs text-slate-900 block truncate group-hover:text-indigo-600">
                                      {att.title}
                                    </span>
                                    <span className="text-[10px] text-slate-500">
                                      {att.tag || '#конспект'} · Открыть запись
                                    </span>
                                  </div>
                                </div>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition shrink-0" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end space-x-2.5 group ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    {msg.senderAvatar ? (
                      <button type="button" onClick={() => handleProfileOpen(msg.senderId)} className="cursor-pointer shrink-0 mb-1">
                        <img
                          src={msg.senderAvatar}
                          alt={msg.senderName}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200 shadow-2xs"
                        />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleProfileOpen(msg.senderId)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mb-1 border shadow-2xs cursor-pointer ${
                          isMe
                            ? 'bg-slate-900 text-white border-slate-800'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {msg.senderName.substring(0, 2).toUpperCase()}
                      </button>
                    )}

                    {/* Message Bubble Container */}
                    <div className={`flex flex-col max-w-[85%] sm:max-w-[76%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`flex items-center space-x-2 text-[10px] text-slate-400 px-1 ${isMe ? 'justify-end' : ''}`}>
                        {!isMe && (
                          <button type="button" onClick={() => handleProfileOpen(msg.senderId)} className="font-semibold text-slate-700 hover:text-blue-600 cursor-pointer">
                            {msg.senderName}
                          </button>
                        )}
                        <span className="font-mono">{msg.timestamp}</span>
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs relative select-text ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-tr-sm'
                            : 'bg-white text-slate-900 border border-slate-200/90 rounded-tl-sm'
                        }`}
                      >
                        {/* Text content */}
                        {msg.text && (
                          <div className="whitespace-pre-wrap break-words font-sans">
                            {msg.text}
                          </div>
                        )}

                        {/* Graphic Block Snapshot */}
                        {msg.attachedBlockSnapshot && (
                          <div className="mt-3">
                            <BlockGraphicSnapshotCard
                              snapshot={msg.attachedBlockSnapshot}
                              onSelectUnit={onSelectUnit}
                            />
                          </div>
                        )}

                        {/* Attached Notes Cards */}
                        {msg.attachedNotes && msg.attachedNotes.length > 0 && (
                          <div className={`mt-3 pt-2.5 space-y-2 border-t ${isMe ? 'border-blue-400/40' : 'border-slate-100'}`}>
                            {msg.attachedNotes.map((note) => (
                              <div
                                key={note.id}
                                onClick={() => handleOpenNoteViewer(note)}
                                className={`p-2.5 rounded-xl transition cursor-pointer flex items-center justify-between ${
                                  isMe
                                    ? 'bg-blue-700/80 hover:bg-blue-700 text-white border border-blue-400/40'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200'
                                }`}
                              >
                                <div className="flex items-center space-x-2 min-w-0">
                                  <div className={`p-1 rounded-lg shrink-0 ${isMe ? 'bg-blue-800 text-white' : 'bg-blue-100 text-blue-700'}`}>
                                    <BookOpen className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-semibold text-xs block truncate">
                                      {note.title}
                                    </span>
                                    <span className={`text-[10px] block truncate ${isMe ? 'text-blue-100' : 'text-slate-500'}`}>
                                      {note.tag || '#конспект'} · Открыть запись
                                    </span>
                                  </div>
                                </div>
                                <ExternalLink className={`w-3.5 h-3.5 shrink-0 ml-2 ${isMe ? 'text-blue-200' : 'text-slate-400'}`} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Bubble hover tools */}
                      <div className={`flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition px-1 ${isMe ? 'justify-end' : ''}`}>
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                          title="Копировать текст"
                        >
                          {copiedMsgId === msg.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Pending Attachments Banner */}
          {(pendingNotes.length > 0 || pendingBlockSnapshot) && (
            <div className="px-4 py-2 bg-indigo-50/80 border-t border-indigo-100 flex flex-wrap gap-2 items-center shrink-0">
              <span className="text-[11px] font-semibold text-indigo-900 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Прикреплено:</span>
              </span>

              {pendingBlockSnapshot && (
                <div className="px-2.5 py-1 rounded-lg bg-slate-900 text-cyan-300 text-xs font-medium flex items-center space-x-1.5 border border-slate-700 shadow-2xs">
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="max-w-[200px] truncate">Блок: {pendingBlockSnapshot.title}</span>
                  <button
                    type="button"
                    onClick={handleRemovePendingBlock}
                    className="text-slate-400 hover:text-rose-400 p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {pendingNotes.map((note) => (
                <div
                  key={note.id}
                  className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-xs text-indigo-900 font-medium flex items-center space-x-1.5 shadow-2xs"
                >
                  <span className="max-w-[180px] truncate">📝 {note.title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePendingNote(note.id)}
                    className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Chat Input Bar with relative mention popover */}
          <div className="p-3 sm:p-4 border-t border-slate-200/90 bg-white shrink-0 relative">
            {/* Live Autocomplete Popover */}
            {showMentionPopover && (
              <div className="absolute bottom-full mb-2 left-3 right-3 sm:left-4 sm:right-4 max-h-64 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-30 flex flex-col animate-scaleUp">
                <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-700 font-semibold">
                  <span className="flex items-center space-x-1.5">
                    <AtSign className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Быстрое прикрепление (@block или @note):</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowMentionPopover(false)}
                    className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-y-auto max-h-52 divide-y divide-slate-100 p-1 custom-scrollbar">
                  {(mentionType === 'all' || mentionType === 'block') && (
                    <button
                      type="button"
                      onClick={() => handleAttachCurrentBlockSnapshot()}
                      className="w-full text-left p-2.5 hover:bg-sky-50 rounded-xl transition cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                        <div className="p-1.5 rounded-lg bg-sky-600 text-white shrink-0">
                          <Camera className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-xs text-slate-900 block truncate group-hover:text-sky-700">
                            Текущий блок: {activeUnit?.title || 'Блок не выбран'}
                          </span>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Графический снимок реального материала и задания
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-sky-100 text-[10px] text-sky-800 font-semibold shrink-0">
                        {activeUnit ? 'Текущий' : 'Не выбран'}
                      </span>
                    </button>
                  )}

                  {(mentionType === 'all' || mentionType === 'note') && filteredMentionNotes.map((note) => (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => handleSelectMentionNote(note)}
                      className="w-full text-left p-2.5 hover:bg-indigo-50/70 rounded-xl transition cursor-pointer flex items-center justify-between group"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-semibold text-xs text-slate-900 block truncate group-hover:text-indigo-700">
                          📝 {note.title}
                        </span>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {note.content.substring(0, 90)}...
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-600 shrink-0 font-medium">
                        {note.tag}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Row */}
            <div className="flex items-end gap-2 bg-slate-50 border border-slate-200/90 rounded-2xl p-1.5 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition shadow-2xs">
              <button
                type="button"
                onClick={() => handleAttachCurrentBlockSnapshot()}
                title="Прикрепить графический снимок текущего блока (@block)"
                className="p-2 rounded-xl text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition cursor-pointer shrink-0"
              >
                <Camera className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsNotePickerModalOpen(true);
                  playChime('click');
                }}
                title="Прикрепить запись из блокнота (@note)"
                className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer shrink-0"
              >
                <AtSign className="w-4 h-4" />
              </button>

              <textarea
                ref={textareaRef}
                rows={1}
                placeholder={
                  channel === 'general'
                    ? "Напишите в общий чат сообщества... (@block / @note)"
                    : `Напишите в чат комнаты «${room.name}»... (@block / @note)`
                }
                value={inputMessage}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1 bg-transparent px-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden resize-none min-h-[36px] max-h-32 leading-relaxed"
              />

              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() && pendingNotes.length === 0 && !pendingBlockSnapshot}
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-semibold transition cursor-pointer shrink-0 shadow-xs active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span>Введите <span className="font-mono text-slate-600">@block</span> для снимка или <span className="font-mono text-slate-600">@note</span> для конспекта</span>
              <span className="hidden sm:inline">Enter — отправить · Shift+Enter — перенос строки</span>
            </div>
          </div>
        </div>

        {/* Collapsible Participants Sidebar */}
        {showParticipantsSidebar && (
          <aside className="w-64 border-l border-slate-200/90 bg-white flex flex-col h-full overflow-hidden shrink-0">
            <div className="h-11 px-3.5 border-b border-slate-100 flex items-center justify-between text-xs shrink-0">
              <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Участники ({participants.length})</span>
              </span>
              <button
                type="button"
                onClick={() => setShowParticipantsSidebar(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                title="Скрыть панель"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
              {participants.map((participant) => {
                const profile = profileMap[participant.uid] || makeProfile(participant);
                const isChosen = selectedProfileId === participant.uid;
                return (
                  <button
                    key={participant.uid}
                    type="button"
                    onClick={() => handleProfileOpen(participant.uid)}
                    className={`w-full rounded-xl border p-2 text-left transition cursor-pointer ${
                      isChosen ? 'border-indigo-300 bg-indigo-50/60 shadow-2xs' : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      {profile.avatar ? (
                        <img src={profile.avatar} alt={profile.displayName} className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {profile.displayName.substring(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-semibold text-slate-900 truncate">{profile.displayName}</span>
                          <span className={`h-2 w-2 rounded-full shrink-0 ${profile.status === 'focus' ? 'bg-emerald-500 animate-pulse' : profile.status === 'idle' ? 'bg-amber-400' : 'bg-slate-300'}`} />
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{profile.specialty}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${profile.ringProgress}%` }} />
                          </div>
                          <span className="text-[9px] font-mono text-slate-500">{profile.ringProgress}%</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              {activePartnerProfile && (
                <div className="mt-3 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/60 to-white p-2.5 shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Парный партнёр</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <div className="text-xs font-semibold text-slate-900">{activePartnerProfile.displayName}</div>
                  <div className="text-[10px] text-slate-500 truncate">{activePartnerRequest?.pairTask.nodeTitle || 'Совместный блок'}</div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* 6. MODAL: FULL NOTE PICKER */}
      {isNotePickerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-xl w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2 text-blue-700 font-bold text-sm">
                <BookOpen className="w-4 h-4" />
                <span>Прикрепить конспект из блокнота (@note)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsNotePickerModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск по конспектам и тегам..."
                value={notePickerSearch}
                onChange={(e) => setNotePickerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:outline-none text-gray-900"
              />
            </div>

            {/* Notes List */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {userNotes.filter(n => !notePickerSearch.trim() || n.title.toLowerCase().includes(notePickerSearch.toLowerCase())).map((note) => (
                <div
                  key={note.id}
                  onClick={() => {
                    handleSelectMentionNote(note);
                    setIsNotePickerModalOpen(false);
                  }}
                  className="p-3.5 rounded-xl bg-[#f8f9fa] hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition cursor-pointer flex flex-col justify-between group space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-900 group-hover:text-blue-700">
                      📝 {note.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-[10px] text-gray-600 font-medium">
                      {note.tag}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsNotePickerModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: VIEW ATTACHED NOTE DETAILS */}
      {activeViewingNote && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-start justify-between pb-3 border-b border-gray-100">
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                  {activeViewingNote.tag || '#конспект'}
                </span>
                <h3 className="font-bold text-base text-gray-900">
                  📝 {activeViewingNote.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveViewingNote(null)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Note Full Content */}
            <div className="max-h-96 overflow-y-auto bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs text-gray-800 leading-relaxed font-sans whitespace-pre-line select-text">
              {activeViewingNote.content}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-gray-400">
                Запись сохранена в вашем цифровом блокноте
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(activeViewingNote.content);
                    setCopiedNoteContent(true);
                    setTimeout(() => setCopiedNoteContent(false), 2000);
                    playChime('click');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs cursor-pointer flex items-center space-x-1.5 transition"
                >
                  {copiedNoteContent ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-600" />}
                  <span>{copiedNoteContent ? 'Скопировано' : 'Копировать'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveViewingNote(null)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer"
                >
                  Понятно
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedProfile && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-2xl">
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-sky-500 p-6 text-white">
              <div className="absolute -right-12 -top-10 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
              <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-cyan-300/25 blur-2xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  {selectedProfile.avatar ? (
                    <img src={selectedProfile.avatar} alt={selectedProfile.displayName} className="h-20 w-20 rounded-[22px] object-cover border-4 border-white/25 shadow-lg" />
                  ) : (
                    <div className="h-20 w-20 rounded-[22px] flex items-center justify-center text-xl font-bold bg-white/15 border-4 border-white/25">
                      {selectedProfile.displayName.substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]">
                      <Sparkles className="w-3 h-3" />
                      {selectedProfile.specialty}
                    </div>
                    <h3 className="mt-3 text-2xl font-bold">{selectedProfile.displayName}</h3>
                    <p className="mt-1 text-sm text-indigo-100">{selectedProfile.title}</p>
                  </div>
                </div>

                <button type="button" onClick={() => setSelectedProfileId(null)} className="rounded-full border border-white/25 bg-white/10 p-2 text-white hover:bg-white/20 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative mt-6 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/15 bg-white/8 p-3 backdrop-blur-sm">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-indigo-100">Focus</div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-12 w-12 rounded-full border-[5px] border-white/20" style={{ background: `conic-gradient(#ffffff ${selectedProfile.ringProgress * 3.6}deg, rgba(255,255,255,0.18) 0deg)` }} />
                    <div>
                      <div className="text-xl font-bold">{selectedProfile.ringProgress}%</div>
                      <div className="text-[10px] text-indigo-100">скорость поглощения</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/8 p-3 backdrop-blur-sm">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-indigo-100">Фокус · Pomodoro</div>
                  <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
                    <span className={`h-2.5 w-2.5 rounded-full ${selectedProfile.status === 'focus' ? 'bg-emerald-300 animate-pulse' : selectedProfile.status === 'idle' ? 'bg-amber-300' : 'bg-slate-300'}`} />
                    {selectedProfile.status === 'focus' ? 'Активна' : selectedProfile.status === 'idle' ? 'Не запущена' : 'Перерыв'}
                  </div>
                  <div className="mt-1 text-[10px] text-indigo-100">Статус из таймера пользователя</div>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/8 p-3 backdrop-blur-sm">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-indigo-100">Партнёрство</div>
                  <div className="mt-2 text-lg font-semibold">{selectedPartnerRequest?.status === 'accepted' ? 'Активно' : 'Свободен'}</div>
                  <div className="mt-1 text-[10px] text-indigo-100">{selectedPartnerRequest?.pairTask.nodeTitle || 'можно пригласить в пару'}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-5 md:grid-cols-[1.5fr_0.9fr] max-h-[calc(90vh-260px)] overflow-y-auto">
              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <UserCircle2 className="w-4 h-4 text-indigo-600" />
                      Биография
                    </div>
                    {selectedProfile.uid === myUserId && (
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-medium ${profileSyncStatus === 'synced' ? 'text-emerald-700' : profileSyncStatus === 'error' ? 'text-rose-700' : 'text-gray-500'}`}>
                          {profileSyncStatus === 'synced' ? 'Облако синхронизировано' : profileSyncStatus === 'syncing' ? 'Синхронизация…' : profileSyncStatus === 'error' ? 'Ошибка синхронизации' : 'Локально'}
                        </span>
                        <button type="button" onClick={() => handleSaveProfileEdit(selectedProfile)} disabled={isSavingProfile} className="rounded-xl border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-700 disabled:opacity-50 cursor-pointer">
                          {isSavingProfile ? 'Сохраняю…' : 'Сохранить'}
                        </button>
                      </div>
                    )}
                  </div>

                  {selectedProfile.uid === myUserId ? (
                    <div className="space-y-2">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          value={selectedProfile.displayName}
                          onChange={(event) => setProfileMap((prev) => ({ ...prev, [myUserId]: { ...prev[myUserId], displayName: event.target.value } }))}
                          placeholder="Имя"
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 focus:border-indigo-500 focus:outline-none"
                        />
                        <input
                          value={selectedProfile.title}
                          onChange={(event) => setProfileMap((prev) => ({ ...prev, [myUserId]: { ...prev[myUserId], title: event.target.value } }))}
                          placeholder="Роль / занятие"
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <input
                        value={selectedProfile.specialty}
                        onChange={(event) => setProfileMap((prev) => ({ ...prev, [myUserId]: { ...prev[myUserId], specialty: event.target.value } }))}
                        placeholder="Специализация"
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 focus:border-indigo-500 focus:outline-none"
                      />
                      <select
                        value={selectedProfile.status}
                        onChange={(event) => setProfileMap((prev) => ({ ...prev, [myUserId]: { ...prev[myUserId], status: event.target.value as UserProfile['status'] } }))}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 focus:border-indigo-500 focus:outline-none"
                        aria-label="Статус фокус-сессии"
                      >
                        <option value="focus">Фокус-сессия активна</option>
                        <option value="idle">Фокус-сессия не запущена</option>
                        <option value="break">Перерыв</option>
                      </select>
                      <textarea
                        value={selectedProfile.bio}
                        onChange={(event) => setProfileMap((prev) => ({ ...prev, [myUserId]: { ...prev[myUserId], bio: event.target.value } }))}
                        rows={4}
                        placeholder="О себе и над чем сейчас работаете"
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 focus:border-indigo-500 focus:outline-none resize-none"
                      />
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed text-gray-700">{selectedProfile.bio}</p>
                  )}
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <Gauge className="w-4 h-4 text-indigo-600" />
                      Узлы в работе
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.12em] text-gray-500">current nodes</span>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    {selectedProfile.currentNodeIds.map((nodeId) => {
                      const node = nodes.find((item) => item.id === nodeId) || (activeUnit && activeUnit.id === nodeId ? { id: activeUnit.id, title: activeUnit.title } as DAGNode : undefined);
                      const nodeTitle = node?.title || 'Узел без имени';
                      return (
                        <button
                          key={`${selectedProfile.uid}-${nodeId}`}
                          type="button"
                          onClick={() => onSelectUnit?.(nodeId)}
                          className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-3 text-left hover:border-indigo-300 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-700">Node</span>
                            <span className="text-[10px] text-gray-500">{selectedProfile.ringProgress}%</span>
                          </div>
                          <div className="mt-2 text-sm font-semibold text-gray-900">{nodeTitle}</div>
                          <div className="mt-2 h-2.5 rounded-full bg-indigo-100">
                            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-500" style={{ width: `${selectedProfile.ringProgress}%` }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <MessageCircleMore className="w-4 h-4 text-indigo-600" />
                    Стенка практических работ и узлов
                  </div>

                  <div className="space-y-3">
                    {selectedProfile.wallPosts?.length ? selectedProfile.wallPosts.map((post) => (
                      <div key={post.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${post.kind === 'debug' ? 'bg-rose-100 text-rose-700' : post.kind === 'optimization' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {post.kind === 'debug' ? 'debug' : post.kind === 'optimization' ? 'opt' : 'field'}
                            </span>
                            <span className="text-[10px] text-gray-500">{new Date(post.createdAt).toLocaleDateString('ru-RU')}</span>
                          </div>
                          <span className="text-[10px] text-gray-500">node: {post.nodeId || 'general'}</span>
                        </div>

                        <div className="mt-2 text-sm font-semibold text-gray-900">{post.title}</div>
                        <p className="mt-2 text-xs leading-relaxed text-gray-700">{post.text}</p>

                        {post.snippet && (
                          <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-900 p-2 text-[10px] leading-relaxed text-emerald-300">{post.snippet}</pre>
                        )}

                        {post.logs && (
                          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2 text-[10px] text-slate-700 whitespace-pre-wrap">{post.logs}</div>
                        )}
                      </div>
                    )) : <div className="rounded-xl border border-dashed border-gray-200 p-3 text-xs text-gray-500">Постов пока нет. Добавьте первый контекст по узлу.</div>}
                  </div>

                  <div className="mt-4 rounded-2xl border border-gray-200 bg-slate-50 p-3">
                    <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-600">
                      <Flame className="w-3.5 h-3.5 text-indigo-600" />
                      Новая запись на стену
                    </div>

                    <div className="grid gap-2 md:grid-cols-[120px_1fr]">
                      <select value={wallDraftKind} onChange={(event) => setWallDraftKind(event.target.value as ProfileWallPost['kind'])} className="rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs text-gray-800 focus:border-indigo-500 focus:outline-none">
                        <option value="debug">debug</option>
                        <option value="optimization">optimization</option>
                        <option value="fieldnote">fieldnote</option>
                      </select>

                      <select value={wallDraftNodeId} onChange={(event) => setWallDraftNodeId(event.target.value)} className="rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs text-gray-800 focus:border-indigo-500 focus:outline-none">
                        {nodeOptions.map((node) => (
                          <option key={node.id} value={node.id}>{node.title}</option>
                        ))}
                      </select>
                    </div>

                    <textarea
                      value={wallDraftText}
                      onChange={(event) => setWallDraftText(event.target.value)}
                      rows={4}
                      placeholder="Что именно упёрлось, как вы решили, какие логи или сниппет стоит оставить для коллег?"
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 focus:border-indigo-500 focus:outline-none resize-none"
                    />

                    <div className="mt-3 flex justify-end">
                      <button type="button" onClick={handleCreateWallPost} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer">
                        Опубликовать на стене
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-violet-50 to-sky-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Briefcase className="w-4 h-4 text-violet-600" />
                    Pair Task / граф напарника
                  </div>

                  <div className="mt-3 rounded-2xl border border-violet-200 bg-white p-3 shadow-sm">
                    <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-700">Current duo</div>
                    <div className="mt-2 text-base font-semibold text-gray-900">{selectedProfile.pairTask?.title || 'Парная ветка ещё не назначена'}</div>
                    <p className="mt-2 text-xs leading-relaxed text-gray-700">{selectedProfile.pairTask?.brief || 'Выберитеся в пару, чтобы заложить конкретный графический task с напарником.'}</p>
                  </div>

                  <div className="mt-3 flex gap-2">
                    {selectedProfile.uid !== myUserId ? (
                      <button type="button" onClick={() => handleSendPartnerRequest(selectedProfile)} className="flex-1 rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700 cursor-pointer">
                        {selectedProfile.partnerRequestStatus === 'accepted' ? 'Напарник подтверждён' : 'Кинуть заявку в напарники'}
                      </button>
                    ) : (
                      <button type="button" onClick={() => setSelectedProfileId(null)} className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">
                        Редактировать профиль
                      </button>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-sm font-semibold text-gray-900">Краткая сводка</div>
                  <div className="mt-3 space-y-2 text-xs text-gray-700">
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span>Профиль</span>
                      <strong>{selectedProfile.title}</strong>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span>Активный узел</span>
                      <strong>{selectedProfile.currentNodeIds[0] ? (nodes.find((item) => item.id === selectedProfile.currentNodeIds[0])?.title || 'Сейчас в работе') : 'Нет узла'}</strong>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span>Статус</span>
                      <strong>{selectedProfile.status}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Постов</span>
                      <strong>{selectedProfile.wallPosts?.length || 0}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
