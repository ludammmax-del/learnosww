import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Lock, 
  Unlock, 
  Radio, 
  MessageSquare, 
  Share2, 
  Check, 
  Copy, 
  X, 
  ArrowRight, 
  ArrowLeft,
  Layers, 
  Send, 
  Upload, 
  Trash2, 
  Pencil,
  Ban,
  Image as ImageIcon,
  Tag,
  Palette,
  Palette as BoardIcon,
  ShieldCheck,
  Globe,
  Sparkles,
  RefreshCw,
  BookOpen,
  FileText,
  ExternalLink
} from 'lucide-react';
import { CommunityRoom, CommunityRoomBan, CommunityRoomMember, CommunityRoomPost, DAGNode, NoteItem } from '../../types.ts';
import { 
  communityRoomService, 
  COMMUNITY_CATEGORIES, 
  POPULAR_CATEGORY_SUGGESTIONS,
  CreateRoomInput,
  UpdateCommunityRoomInput
} from '../../services/communityRoomService.ts';
import { playChime } from '../../utils/audio.ts';
import { peerCollabSync } from '../../services/peerCollabSync.ts';

interface CommunityRoomsHubProps {
  currentUser?: { uid: string; displayName: string; email: string; photoURL?: string } | null;
  onEnterRoom?: (room: CommunityRoom) => void;
  activeRoomId?: string | null;
  nodes?: DAGNode[];
  notes?: NoteItem[];
  activeUnitId?: string;
  onSelectUnit?: (unitId: string) => void;
  onSaveNote?: (title: string, content: string, tag: string) => void;
}

export const CommunityRoomsHub: React.FC<CommunityRoomsHubProps> = ({
  currentUser,
  onEnterRoom,
  activeRoomId,
  nodes = [],
  notes = [],
  activeUnitId,
  onSelectUnit,
  onSaveNote,
}) => {
  const [rooms, setRooms] = useState<CommunityRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все категории');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPrivatePinModalOpen, setIsPrivatePinModalOpen] = useState(false);
  const [selectedPrivateRoom, setSelectedPrivateRoom] = useState<CommunityRoom | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Active View Room details inside Community
  const [selectedRoomDetails, setSelectedRoomDetails] = useState<CommunityRoom | null>(null);
  const [newPostText, setNewPostText] = useState('');
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [publicJoinError, setPublicJoinError] = useState<string | null>(null);

  // Create Room Form State
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formCategory, setFormCategory] = useState('');
  
  // Custom user-uploaded files
  const [avatarDataUrl, setAvatarDataUrl] = useState<string>('');
  const [avatarFileName, setAvatarFileName] = useState<string>('');
  const [formIsPrivate, setFormIsPrivate] = useState(false);
  const [formAccessCode, setFormAccessCode] = useState('');
  const [formTags, setFormTags] = useState('Архитектура, Практика, Инварианты');
  const [formMaxMembers, setFormMaxMembers] = useState(30);
  const [formActiveTopic, setFormActiveTopic] = useState('Проектирование систем и совместное обучение');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [managingRoom, setManagingRoom] = useState<CommunityRoom | null>(null);
  const [manageForm, setManageForm] = useState<UpdateCommunityRoomInput>({
    name: '',
    description: '',
    bioMarkdown: '',
    category: '',
    activeTopic: '',
    tags: [],
  });
  const [manageTagsText, setManageTagsText] = useState('');
  const [manageError, setManageError] = useState<string | null>(null);
  const [isSavingRoom, setIsSavingRoom] = useState(false);
  const [isLoadingBans, setIsLoadingBans] = useState(false);
  const [memberActionId, setMemberActionId] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const formTopRef = useRef<HTMLDivElement | null>(null);

  const myUserId = currentUser?.uid || 'user-' + (localStorage.getItem('os_user_id') || 'guest');
  const myUserName = currentUser?.displayName || 'Студент';
  const myUserAvatar = currentUser?.photoURL || '';

  const handleOpenFeed = async (room: CommunityRoom) => {
    setFeedError(null);
    const freshRoom = await communityRoomService.getRoom(room.id);
    setSelectedRoomDetails(freshRoom || room);
  };

  const loadRooms = async () => {
    setIsLoading(true);
    try {
      const list = await communityRoomService.listRooms({
        query: searchQuery,
        category: selectedCategory,
        includePrivate: true,
      });
      setRooms(list);
    } catch (e) {
      console.warn('Error loading rooms:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, [searchQuery, selectedCategory]);

  // Real-time Firestore live rooms subscription
  useEffect(() => {
    const unsubscribe = communityRoomService.subscribeRooms((liveRooms) => {
      setRooms((previous) => {
        const liveRoomIds = new Set(liveRooms.map((room) => room.id));
        const privateRooms = previous.filter((room) => room.isPrivate && !liveRoomIds.has(room.id));
        return [...liveRooms, ...privateRooms];
      });
      const selectedLiveRoom = liveRooms.find((room) => room.id === selectedRoomDetails?.id);
      if (selectedLiveRoom) setSelectedRoomDetails(selectedLiveRoom);
    });
    return () => {
      unsubscribe();
    };
  }, [selectedRoomDetails?.id]);

  // When opening Create Room view, scroll smoothly to top
  useEffect(() => {
    if (isCreateModalOpen) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isCreateModalOpen]);

  const dynamicCategories = React.useMemo(() => {
    const catsSet = new Set<string>();
    rooms.forEach((r) => {
      if (r.category && r.category.trim()) {
        catsSet.add(r.category.trim());
      }
    });
    COMMUNITY_CATEGORIES.forEach((c) => {
      if (c !== 'Все категории') catsSet.add(c);
    });
    return ['Все категории', ...Array.from(catsSet)];
  }, [rooms]);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Пожалуйста, выберите файл изображения (.png, .jpg, .webp, .svg)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Размер файла аватарки не должен превышать 5 МБ');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarDataUrl(event.target?.result as string);
      setAvatarFileName(file.name);
      setFormError(null);
      playChime('click');
    };
    reader.readAsDataURL(file);
  };

  const handleOpenPrivatePin = (room: CommunityRoom) => {
    setSelectedPrivateRoom(room);
    setPinInput('');
    setPinError(null);
    setIsPrivatePinModalOpen(true);
    playChime('click');
  };

  const handleVerifyPinAndJoin = async () => {
    if (!selectedPrivateRoom) return;
    setPinError(null);

    const res = await communityRoomService.joinRoom(selectedPrivateRoom.id, {
      userId: myUserId,
      userName: myUserName,
      avatar: myUserAvatar,
      accessCode: pinInput.trim(),
      role: 'member',
    });

    if (res.success && res.room) {
      setIsPrivatePinModalOpen(false);
      setSelectedRoomDetails(res.room);
      peerCollabSync.setRoomId(res.room.id);
      onEnterRoom?.(res.room);
      playChime('success');
      loadRooms();
    } else {
      setPinError(res.error || 'Неверный PIN-код доступа');
      playChime('alert');
    }
  };

  const handleJoinPublicRoom = async (room: CommunityRoom) => {
    setPublicJoinError(null);
    playChime('click');
    const res = await communityRoomService.joinRoom(room.id, {
      userId: myUserId,
      userName: myUserName,
      avatar: myUserAvatar,
      role: 'member',
    });

    if (res.success && res.room) {
      setSelectedRoomDetails(res.room);
      peerCollabSync.setRoomId(res.room.id);
      onEnterRoom?.(res.room);
      playChime('success');
      loadRooms();
    } else {
      setPublicJoinError(res.error || 'Не удалось войти в группу');
      playChime('alert');
    }
  };

  const handleCreateRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Пожалуйста, укажите название комнаты');
      return;
    }

    if (!formCategory.trim()) {
      setFormError('Пожалуйста, напишите категорию или выберите подсказку');
      return;
    }

    if (formIsPrivate && !formAccessCode.trim()) {
      setFormError('Для закрытой комнаты обязательно укажите PIN-код');
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedTags = formTags
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const input: CreateRoomInput = {
        name: formName.trim(),
        description: formDescription.trim() || 'Пространство для совместной практики и проектирования на доске.',
        bioMarkdown: formBio.trim(),
        category: formCategory.trim(),
        avatarUrl: avatarDataUrl || undefined,
        isPrivate: formIsPrivate,
        accessCode: formIsPrivate ? formAccessCode.trim() : undefined,
        creatorId: myUserId,
        creatorName: myUserName,
        creatorAvatar: myUserAvatar,
        tags: parsedTags.length > 0 ? parsedTags : ['Архитектура', 'Практика'],
        maxMembers: Number(formMaxMembers) || 30,
        activeTopic: formActiveTopic.trim() || 'Совместное обучение',
        rules: ['Взаимное уважение', 'Конструктивный диалог', 'Понятные диаграммы на доске'],
        hasVoiceCall: true,
        hasWhiteboard: true,
        hasCodeEditor: true,
      };

      const res = await communityRoomService.createRoom(input);
      if (res.success && res.room) {
        const createdRoom = res.room;
        // Optimistically put at top of list
        setRooms((prev) => [createdRoom, ...prev.filter((r) => r.id !== createdRoom.id)]);
        setSelectedCategory('Все категории');
        setSearchQuery('');
        setIsCreateModalOpen(false);
        
        // Reset form fields
        setFormName('');
        setFormDescription('');
        setFormBio('');
        setFormCategory('');
        setAvatarDataUrl('');
        setAvatarFileName('');
        setFormIsPrivate(false);
        setFormAccessCode('');
        
        playChime('success');
        
        // Also refresh list in background
        loadRooms();
        
        // Enter room or highlight
        peerCollabSync.setRoomId(createdRoom.id);
        if (onEnterRoom) {
          onEnterRoom(createdRoom);
        }
      } else {
        setFormError(res.error || 'Ошибка при создании комнаты');
        playChime('alert');
      }
    } catch (err: any) {
      setFormError(err?.message || 'Не удалось создать комнату');
      playChime('alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostToFeed = async () => {
    if (!selectedRoomDetails || !newPostText.trim() || isPosting) return;
    setIsPosting(true);
    setFeedError(null);
    try {
      const currentNode = nodes.find((node) => node.status === 'active') || nodes.find(
        (node) => node.id === activeUnitId || node.unitId === activeUnitId
      );
      const attachedNotes = notes
        .filter((note) => selectedNoteIds.includes(note.id))
        .slice(0, 3)
        .map((note) => ({ ...note, content: note.content.slice(0, 4000) }));
      const res = await communityRoomService.postToFeed(selectedRoomDetails.id, {
        authorId: myUserId,
        authorName: myUserName,
        authorAvatar: myUserAvatar,
        text: newPostText.trim(),
        learningNode: currentNode ? {
          nodeId: currentNode.id,
          title: currentNode.title,
          subtitle: currentNode.subtitle,
          unitId: currentNode.unitId,
          status: currentNode.status,
        } : undefined,
        attachedNotes,
      });
      if (res.success && res.feedPosts) {
        setSelectedRoomDetails({
          ...selectedRoomDetails,
          feedPosts: res.feedPosts,
        });
        setNewPostText('');
        setSelectedNoteIds([]);
        playChime('success');
      }
    } catch (e) {
      console.warn('Error posting to feed:', e);
      setFeedError(e instanceof Error ? e.message : 'Не удалось опубликовать запись. Проверьте подключение и доступ к комнате.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleJoinFromFeed = async () => {
    if (!selectedRoomDetails) return;
    const result = await communityRoomService.joinRoom(selectedRoomDetails.id, {
      userId: myUserId,
      userName: myUserName,
      avatar: myUserAvatar,
      role: 'member',
    });
    if (result.success && result.room) {
      setSelectedRoomDetails(result.room);
      loadRooms();
      setFeedError(null);
    } else {
      setFeedError(result.error || 'Не удалось вступить в комнату.');
    }
  };

  const handleTogglePostNote = (noteId: string) => {
    setSelectedNoteIds((selected) => selected.includes(noteId)
      ? selected.filter((id) => id !== noteId)
      : selected.length < 3 ? [...selected, noteId] : selected
    );
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту комнату и её доску?')) return;
    const res = await communityRoomService.deleteRoom(roomId, myUserId);
    if (res.success) {
      playChime('click');
      if (selectedRoomDetails?.id === roomId) {
        setSelectedRoomDetails(null);
      }
      loadRooms();
    } else {
      setManageError(res.error || 'Не удалось удалить группу');
    }
  };

  const handleOpenRoomManagement = async (room: CommunityRoom) => {
    if (room.creatorId !== myUserId) return;
    const fullRoom = await communityRoomService.getRoom(room.id);
    if (!fullRoom || fullRoom.creatorId !== myUserId) return;
    setManagingRoom(fullRoom);
    setManageForm({
      name: fullRoom.name,
      description: fullRoom.description,
      bioMarkdown: fullRoom.bioMarkdown || '',
      category: fullRoom.category,
      activeTopic: fullRoom.activeTopic || '',
      tags: fullRoom.tags || [],
    });
    setManageTagsText((fullRoom.tags || []).join(', '));
    setManageError(null);
    setIsLoadingBans(true);
    const result = await communityRoomService.listBannedMembers(fullRoom.id, myUserId);
    if (result.success) {
      setManagingRoom((current) => current?.id === fullRoom.id ? { ...current, bannedMembers: result.members || [] } : current);
    } else {
      setManageError(result.error || 'Не удалось загрузить список блокировок');
    }
    setIsLoadingBans(false);
  };

  const handleSaveRoomInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingRoom || managingRoom.creatorId !== myUserId || isSavingRoom) return;
    setIsSavingRoom(true);
    setManageError(null);
    const updates: UpdateCommunityRoomInput = {
      ...manageForm,
      tags: manageTagsText.split(',').map((tag) => tag.trim().replace(/^#/, '')).filter(Boolean),
    };
    const result = await communityRoomService.updateRoom(managingRoom.id, myUserId, updates);
    if (result.success && result.room) {
      const updatedRoom = { ...result.room, bannedMembers: managingRoom.bannedMembers || [] };
      setManagingRoom(updatedRoom);
      setRooms((previous) => previous.map((room) => room.id === result.room!.id ? result.room! : room));
      if (selectedRoomDetails?.id === result.room.id) setSelectedRoomDetails(updatedRoom);
      playChime('success');
    } else {
      setManageError(result.error || 'Не удалось сохранить изменения');
      playChime('alert');
    }
    setIsSavingRoom(false);
  };

  const handleBanMember = async (member: CommunityRoomMember) => {
    if (!managingRoom || managingRoom.creatorId !== myUserId || memberActionId) return;
    if (!confirm(`Заблокировать ${member.userName} навсегда? Участник будет удалён из группы и больше не сможет вступить.`)) return;
    setMemberActionId(member.userId);
    setManageError(null);
    const result = await communityRoomService.banRoomMember(managingRoom.id, myUserId, member.userId);
    if (result.success && result.room) {
      const updatedRoom = {
        ...result.room,
        bannedMembers: [
          ...(managingRoom.bannedMembers || []).filter((item) => item.userId !== member.userId),
          { userId: member.userId, userName: member.userName || member.name || member.userId, avatar: member.avatar, bannedAt: new Date().toISOString() },
        ],
      };
      setManagingRoom(updatedRoom);
      setRooms((previous) => previous.map((room) => room.id === result.room!.id ? result.room! : room));
      if (selectedRoomDetails?.id === result.room.id) setSelectedRoomDetails(updatedRoom);
      playChime('success');
    } else {
      setManageError(result.error || 'Не удалось заблокировать участника');
      playChime('alert');
    }
    setMemberActionId(null);
  };

  // -------------------------------------------------------------
  // VIEW: CREATE ROOM (Fully responsive, no cut-offs, clean Google UI)
  // -------------------------------------------------------------
  if (isCreateModalOpen) {
    return (
      <div ref={formTopRef} className="w-full min-h-full max-w-4xl mx-auto space-y-6 bg-white text-gray-900 font-sans select-none pb-28 pt-2">
        {/* Top Breadcrumbs / Back Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <button
            type="button"
            onClick={() => {
              setIsCreateModalOpen(false);
              playChime('click');
            }}
            className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition cursor-pointer flex items-center space-x-2 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Назад ко всем комнатам</span>
          </button>

          <span className="text-xs text-gray-500 font-medium">
            Новое пространство сообщества
          </span>
        </div>

        {/* Header Title Card */}
        <div className="p-6 rounded-2xl bg-[#f8f9fa] border border-gray-200 space-y-1.5 shadow-2xs">
          <div className="flex items-center space-x-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>Создание комнаты сообщества</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            Настройте пространство для совместного обучения
          </h2>
          <p className="text-xs text-gray-600 max-w-2xl leading-relaxed">
            Для комнаты будет автоматически выделена изолированная бесконечная доска, сохраняемая в Firebase Firestore, чат с поддержкой заметок @note и лента обсуждений.
          </p>
        </div>

        {formError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center space-x-2">
            <span>⚠️</span>
            <span>{formError}</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleCreateRoomSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs space-y-5">
            {/* 1. Name & Free-form Category Input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="font-semibold text-xs text-gray-800 block mb-1.5">
                  Название комнаты *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Highload Go & Распределенные системы"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:outline-none text-xs text-gray-900 shadow-2xs"
                />
              </div>

              <div>
                <label className="font-semibold text-xs text-gray-800 block mb-1.5">
                  Категория (напишите сами) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Введите любую свою категорию (напр.: System Design, Go, ML...)"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:outline-none text-xs text-gray-900 shadow-2xs"
                />
                
                {/* Clickable category hints to quickly fill in */}
                <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-gray-400">Подсказки:</span>
                  {POPULAR_CATEGORY_SUGGESTIONS.slice(0, 6).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormCategory(cat)}
                      className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-[10px] text-gray-600 transition cursor-pointer border border-gray-200"
                    >
                      + {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Description */}
            <div>
              <label className="font-semibold text-xs text-gray-800 block mb-1.5">
                Краткое описание (цели и фокус комнаты) *
              </label>
              <textarea
                rows={2}
                required
                placeholder="Опишите, какие задачи, темы и архитектурные схемы исследуются в этой группе..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:outline-none text-xs text-gray-900 resize-none shadow-2xs"
              />
            </div>

            {/* 3. Active Topic & Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="font-semibold text-xs text-gray-800 block mb-1.5">
                  Текущая активная тема на доске
                </label>
                <input
                  type="text"
                  placeholder="Например: Идемпотентность, Circuit Breaker и Sharding"
                  value={formActiveTopic}
                  onChange={(e) => setFormActiveTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:outline-none text-xs text-gray-900 shadow-2xs"
                />
              </div>

              <div>
                <label className="font-semibold text-xs text-gray-800 block mb-1.5">
                  Теги (через запятую)
                </label>
                <input
                  type="text"
                  placeholder="Highload, Архитектура, Kafka, Go, Доска"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:outline-none text-xs text-gray-900 shadow-2xs"
                />
              </div>
            </div>

            {/* 4. Manifesto / Bio */}
            <div>
              <label className="font-semibold text-xs text-gray-800 block mb-1.5">
                Манифест и правила работы группы
              </label>
              <textarea
                rows={3}
                placeholder="Опишите регламент спаррингов, формат созвонов и принципы разбора на доске..."
                value={formBio}
                onChange={(e) => setFormBio(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:outline-none text-xs text-gray-900 resize-none font-sans shadow-2xs"
              />
            </div>

            {/* 5. Avatar Upload */}
            <div>
              <label className="font-semibold text-xs text-gray-800 block mb-1.5">
                Аватарка комнаты (загрузите свой файл или оставьте авто-иконку)
              </label>
              <div className="flex items-center space-x-3">
                {avatarDataUrl ? (
                  <img src={avatarDataUrl} alt="Avatar" className="w-12 h-12 rounded-xl object-cover border border-gray-200 shadow-2xs" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs cursor-pointer flex items-center space-x-1.5 transition shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5 text-gray-600" />
                  <span>{avatarFileName ? 'Заменить изображение' : 'Выбрать файл'}</span>
                </button>
                {avatarFileName && (
                  <span className="text-xs text-gray-500 truncate max-w-[200px]">{avatarFileName}</span>
                )}
              </div>
            </div>

            {/* 6. Privacy & PIN */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsPrivate}
                  onChange={(e) => setFormIsPrivate(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold text-gray-900 block">Закрытая комната (вход строго по PIN-коду)</span>
                  <span className="text-gray-500">Только участники с секретным кодом смогут войти на доску.</span>
                </div>
              </label>

              {formIsPrivate && (
                <div className="pt-2 border-t border-gray-200 max-w-xs">
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Секретный PIN-код доступа:
                  </label>
                  <input
                    type="text"
                    required={formIsPrivate}
                    placeholder="Например: SRE-2026"
                    value={formAccessCode}
                    onChange={(e) => setFormAccessCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 focus:border-blue-500 focus:outline-none font-mono text-xs font-bold text-gray-900"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                playChime('click');
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer transition"
            >
              Отмена
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-7 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wide transition cursor-pointer shadow-xs flex items-center space-x-2"
            >
              <BoardIcon className="w-4 h-4" />
              <span>{isSubmitting ? 'Сохранение в базу...' : 'Создать комнату и открыть доску'}</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (selectedRoomDetails) {
    const isRoomMember = selectedRoomDetails.creatorId === myUserId ||
      Boolean(selectedRoomDetails.members?.some((member) => member.userId === myUserId));
    const activeNode = nodes.find((node) => node.status === 'active') || nodes.find(
      (node) => node.id === activeUnitId || node.unitId === activeUnitId
    );
    const posts = [...(selectedRoomDetails.feedPosts || [])].sort((left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );

    return (
      <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-5 bg-white pb-24 pt-2 text-gray-900">
        <header className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setSelectedRoomDetails(null)} title="Назад к комнатам" className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold">Учебная лента · {selectedRoomDetails.name}</h1>
              <p className="mt-0.5 text-xs text-gray-500">Блоки графа, разборы и конспекты участников</p>
            </div>
          </div>
          {!isRoomMember && !selectedRoomDetails.isPrivate && (
            <button type="button" onClick={handleJoinFromFeed} className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">
              Вступить и публиковать
            </button>
          )}
        </header>

        {feedError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{feedError}</p>}

        {isRoomMember ? (
          <section className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div>
              <h2 className="text-sm font-bold">Новая учебная запись</h2>
              <p className="mt-1 text-xs text-gray-500">Текущий блок будет прикреплён автоматически. Заметки публикуются как снимок на момент отправки.</p>
            </div>
            <textarea
              value={newPostText}
              onChange={(event) => setNewPostText(event.target.value)}
              maxLength={5000}
              rows={4}
              placeholder="Что изучаете, какой вопрос возник или чем хотите поделиться?"
              className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
            />

            {activeNode && (
              <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <Layers className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase text-blue-700">Сейчас в графе</div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">{activeNode.title}</div>
                  {activeNode.subtitle && <p className="mt-1 text-xs text-gray-600">{activeNode.subtitle}</p>}
                </div>
              </div>
            )}

            {notes.length > 0 && (
              <fieldset className="space-y-2">
                <legend className="flex items-center gap-2 text-xs font-semibold text-gray-700"><BookOpen className="h-4 w-4" />Добавить конспекты · до 3</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {notes.map((note) => {
                    const checked = selectedNoteIds.includes(note.id);
                    return (
                      <label key={note.id} className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 ${checked ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                        <input type="checkbox" checked={checked} disabled={!checked && selectedNoteIds.length >= 3} onChange={() => handleTogglePostNote(note.id)} className="mt-0.5 accent-blue-600" />
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-semibold text-gray-800">{note.title}</span>
                          <span className="mt-0.5 block line-clamp-2 text-[11px] text-gray-500">{note.content}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <div className="flex justify-end">
              <button type="button" onClick={handlePostToFeed} disabled={!newPostText.trim() || isPosting} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                <Send className="h-3.5 w-3.5" />{isPosting ? 'Публикую…' : 'Опубликовать'}
              </button>
            </div>
          </section>
        ) : (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">Чтобы публиковать в этой ленте, сначала вступите в комнату.</div>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-bold">Записи · {posts.length}</h2>
          {posts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">Пока нет учебных записей.</div>
          ) : posts.map((post) => (
            <article key={post.id} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
              <header className="flex items-center gap-2">
                {post.authorAvatar ? <img src={post.authorAvatar} alt="" className="h-8 w-8 rounded-full object-cover" /> : <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">{post.authorName.slice(0, 1).toUpperCase()}</div>}
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-gray-900">{post.authorName}</div>
                  <time className="text-[10px] text-gray-500">{Number.isNaN(new Date(post.createdAt).getTime()) ? post.createdAt : new Date(post.createdAt).toLocaleString('ru-RU')}</time>
                </div>
              </header>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{post.text}</p>

              {post.learningNode && (
                <div className="flex items-start justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                  <div className="flex min-w-0 items-start gap-2">
                    <Layers className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold uppercase text-blue-700">Блок графа · {post.learningNode.status || 'без статуса'}</div>
                      <div className="mt-1 text-sm font-semibold text-gray-900">{post.learningNode.title}</div>
                      {post.learningNode.subtitle && <p className="mt-1 text-xs text-gray-600">{post.learningNode.subtitle}</p>}
                    </div>
                  </div>
                  {post.learningNode.unitId && onSelectUnit && (
                    <button type="button" onClick={() => {
                      const unitId = post.learningNode?.unitId;
                      if (!unitId) return;
                      onSelectUnit(unitId);
                      window.dispatchEvent(new CustomEvent('learning_launch_module_window', { detail: { unitId } }));
                    }} title="Открыть связанный блок" className="shrink-0 rounded-md border border-blue-200 bg-white p-2 text-blue-700 hover:bg-blue-100">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}

              {post.attachedNotes?.map((note) => (
                <details key={`${post.id}-${note.id}`} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-amber-950"><FileText className="h-4 w-4" />{note.title}<span className="ml-auto text-[10px] font-normal text-amber-800">{note.tag}</span></summary>
                  <div className="mt-3 whitespace-pre-wrap border-t border-amber-200 pt-3 text-xs leading-relaxed text-gray-800">{note.content}</div>
                  {onSaveNote && <button type="button" onClick={() => onSaveNote(note.title, note.content, note.tag)} className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-amber-950 hover:bg-amber-100"><BookOpen className="h-3.5 w-3.5" />Сохранить в мой блокнот</button>}
                </details>
              ))}
            </article>
          ))}
        </section>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: COMMUNITY ROOMS LIST & SEARCH
  // -------------------------------------------------------------
  return (
    <div className="w-full min-h-full flex flex-col space-y-6 bg-white text-gray-900 font-sans select-none pb-20">
      {/* 1. TOP HEADER & SEARCH & ACTIONS (Strict Google Minimalism) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Комнаты обучения & Комьюнити</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Каждая комната имеет собственную постоянную бесконечную доску, чат и участников с сохранением в Firebase Firestore.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск комнат по теме..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs rounded-full bg-gray-100 hover:bg-gray-150 focus:bg-white border border-transparent focus:border-blue-500 focus:outline-none w-56 sm:w-64 transition shadow-2xs text-gray-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={loadRooms}
            title="Обновить список"
            className="p-2 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition cursor-pointer border border-gray-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Create Room Button (Google Blue) */}
          <button
            type="button"
            onClick={() => {
              setIsCreateModalOpen(true);
              playChime('click');
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Создать комнату</span>
          </button>
        </div>
      </div>

      {/* 2. CATEGORIES FILTER BAR (Google Chips) */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {dynamicCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              setSelectedCategory(cat);
              playChime('click');
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === cat
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {publicJoinError && (
        <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {publicJoinError}
        </p>
      )}

      {/* 3. ROOMS GRID */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-500">Загрузка комнат сообщества из Firebase...</p>
        </div>
      ) : rooms.length === 0 ? (
        <div className="py-16 text-center bg-[#f8f9fa] border border-gray-200 rounded-2xl p-8 space-y-3">
          <Users className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="font-bold text-sm text-gray-800">Комнаты не найдены</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            По вашему запросу ничего не найдено. Создайте первую комнату по этой теме!
          </p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs cursor-pointer"
          >
            Создать комнату
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rooms.map((room) => {
            const isCurrentActive = activeRoomId === room.id;
            return (
              <div
                key={room.id}
                className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between p-5 shadow-2xs hover:shadow-md ${
                  isCurrentActive ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {room.avatarUrl ? (
                        <img
                          src={room.avatarUrl}
                          alt={room.name}
                          className="w-10 h-10 rounded-xl object-cover border border-gray-200 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-sm shrink-0">
                          {room.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <h3 className="font-bold text-sm text-gray-900 leading-snug line-clamp-1">
                            {room.name}
                          </h3>
                          {room.creatorId === myUserId && (
                            <span className="px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-700 text-[9px] font-bold shrink-0">
                              Ваша комната
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-gray-500">
                          {room.category}
                        </span>
                      </div>
                    </div>

                    {room.isPrivate ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center space-x-1 shrink-0">
                        <Lock className="w-3 h-3 text-amber-600" />
                        <span>Закрытая</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center space-x-1 shrink-0">
                        <Unlock className="w-3 h-3 text-emerald-600" />
                        <span>Открытая</span>
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                    {room.description}
                  </p>

                  {/* Active Topic */}
                  {room.activeTopic && (
                    <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-start space-x-2 text-[11px] text-gray-700">
                      <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-1"><strong>Тема:</strong> {room.activeTopic}</span>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {room.tags.slice(0, 3).map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-gray-100 text-[10px] font-medium text-gray-600">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Stats & Enter Button */}
                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-xs text-gray-500 font-medium">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    <span>{room.memberCount || 1} / {room.maxMembers || 50}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {(!room.isPrivate || room.creatorId === myUserId || room.members?.some((member) => member.userId === myUserId)) && (
                      <button
                        type="button"
                        onClick={() => handleOpenFeed(room)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        title="Открыть учебную ленту комнаты"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Лента{room.feedPosts?.length ? ` · ${room.feedPosts.length}` : ''}
                      </button>
                    )}
                    {room.creatorId === myUserId && (
                      <button
                        type="button"
                        onClick={() => handleOpenRoomManagement(room)}
                        className="p-1.5 text-gray-400 hover:text-blue-700 rounded-lg hover:bg-blue-50 cursor-pointer"
                        title="Управление группой"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {room.creatorId === myUserId && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRoom(room.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="Удалить комнату"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {room.isPrivate ? (
                      <button
                        type="button"
                        onClick={() => handleOpenPrivatePin(room)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition cursor-pointer flex items-center space-x-1 shadow-2xs"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Войти по PIN</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleJoinPublicRoom(room)}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                      >
                        <BoardIcon className="w-3.5 h-3.5" />
                        <span>{isCurrentActive ? 'Открыть доску' : 'Войти в комнату'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {managingRoom && managingRoom.creatorId === myUserId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-2xs p-4 flex items-start justify-center">
          <section className="my-auto w-full max-w-2xl rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="text-sm font-bold">Управление учебной группой</h2>
                <p className="mt-1 text-xs text-gray-500">Редактировать сведения и блокировать участников может только владелец.</p>
              </div>
              <button type="button" onClick={() => setManagingRoom(null)} title="Закрыть" className="p-1 text-gray-400 hover:text-gray-700">
                <X className="h-4 w-4" />
              </button>
            </header>

            <form onSubmit={handleSaveRoomInfo} className="space-y-5 p-5">
              {manageError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{manageError}</p>}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-gray-700">
                  Название
                  <input required value={manageForm.name} onChange={(e) => setManageForm((form) => ({ ...form, name: e.target.value }))} className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-normal text-gray-900 focus:border-blue-500 focus:outline-none" />
                </label>
                <label className="text-xs font-semibold text-gray-700">
                  Категория
                  <input required value={manageForm.category} onChange={(e) => setManageForm((form) => ({ ...form, category: e.target.value }))} className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-normal text-gray-900 focus:border-blue-500 focus:outline-none" />
                </label>
              </div>

              <label className="block text-xs font-semibold text-gray-700">
                Описание
                <textarea rows={2} value={manageForm.description} onChange={(e) => setManageForm((form) => ({ ...form, description: e.target.value }))} className="mt-1.5 w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-normal text-gray-900 focus:border-blue-500 focus:outline-none" />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-gray-700">
                  Активная тема
                  <input value={manageForm.activeTopic || ''} onChange={(e) => setManageForm((form) => ({ ...form, activeTopic: e.target.value }))} className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-normal text-gray-900 focus:border-blue-500 focus:outline-none" />
                </label>
                <label className="text-xs font-semibold text-gray-700">
                  Теги
                  <input value={manageTagsText} onChange={(e) => setManageTagsText(e.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-normal text-gray-900 focus:border-blue-500 focus:outline-none" />
                </label>
              </div>

              <label className="block text-xs font-semibold text-gray-700">
                О группе и правила
                <textarea rows={3} value={manageForm.bioMarkdown || ''} onChange={(e) => setManageForm((form) => ({ ...form, bioMarkdown: e.target.value }))} className="mt-1.5 w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-normal text-gray-900 focus:border-blue-500 focus:outline-none" />
              </label>

              <div className="flex justify-end gap-2 border-b border-gray-100 pb-5">
                <button type="button" onClick={() => setManagingRoom(null)} className="rounded-lg px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100">Отмена</button>
                <button type="submit" disabled={isSavingRoom} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                  {isSavingRoom ? 'Сохраняю…' : 'Сохранить изменения'}
                </button>
              </div>
            </form>

            <div className="space-y-5 px-5 pb-5">
              <section>
                <h3 className="mb-2 text-xs font-bold text-gray-800">Участники · {managingRoom.members?.length || 0}</h3>
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                  {(managingRoom.members || []).filter((member) => member.userId !== managingRoom.creatorId).length === 0 ? (
                    <p className="px-3 py-4 text-xs text-gray-500">Других участников пока нет.</p>
                  ) : (managingRoom.members || []).filter((member) => member.userId !== managingRoom.creatorId).map((member) => (
                    <div key={member.userId} className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        {member.avatar ? <img src={member.avatar} alt="" className="h-7 w-7 rounded-full object-cover" /> : <Users className="h-4 w-4 shrink-0 text-gray-400" />}
                        <span className="truncate text-xs font-medium text-gray-800">{member.userName || member.name || member.userId}</span>
                      </div>
                      <button type="button" onClick={() => handleBanMember(member)} disabled={memberActionId === member.userId} title="Заблокировать навсегда" className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">
                        <Ban className="h-3.5 w-3.5" />
                        {memberActionId === member.userId ? 'Блокирую…' : 'Заблокировать'}
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-xs font-bold text-gray-800">Заблокированы навсегда</h3>
                {isLoadingBans ? (
                  <p className="text-xs text-gray-500">Загружаю список…</p>
                ) : (managingRoom.bannedMembers || []).length === 0 ? (
                  <p className="text-xs text-gray-500">Заблокированных участников нет.</p>
                ) : (
                  <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                    {(managingRoom.bannedMembers || []).map((member: CommunityRoomBan) => (
                      <li key={member.userId} className="flex items-center justify-between gap-3 px-3 py-2 text-xs text-gray-600">
                        <span className="truncate">{member.userName}</span>
                        <span className="shrink-0 text-[10px] text-gray-400">{new Date(member.bannedAt).toLocaleDateString()}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </section>
        </div>
      )}

      {/* 4. MODAL: PRIVATE ROOM PIN VERIFICATION */}
      {isPrivatePinModalOpen && selectedPrivateRoom && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-sm w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Закрытая комната</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivatePinModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="font-bold text-sm text-gray-900">{selectedPrivateRoom.name}</h3>
              <p className="text-xs text-gray-500 mt-1">
                Для входа в эту группу требуется секретный PIN-код доступа от организатора.
              </p>
            </div>

            {pinError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {pinError}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 block">Введите PIN-код:</label>
              <input
                type="text"
                autoFocus
                placeholder="PIN-код"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleVerifyPinAndJoin();
                }}
                className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-300 focus:bg-white focus:border-blue-500 focus:outline-none font-mono text-center text-sm font-bold tracking-wider text-gray-900"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPrivatePinModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleVerifyPinAndJoin}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                Войти в комнату
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
