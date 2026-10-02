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
  ExternalLink,
  Flame,
  Zap,
  Code,
  Paperclip,
  ChevronDown,
  ChevronUp,
  Maximize2,
  CheckCircle2,
  Calendar,
  Trophy,
  Clock,
  HelpCircle,
  Brain
} from 'lucide-react';
import { 
  CommunityRoom, 
  CommunityRoomBan, 
  CommunityRoomMember, 
  CommunityRoomPost, 
  DAGNode, 
  NoteItem, 
  HabitItem,
  AttachedHabitPostItem,
  AttachedMetricPostItem,
  AttachedProjectPostItem,
  AttachedMindmapPostItem,
  AttachedQuizPostItem
} from '../../types.ts';
import { 
  communityRoomService, 
  COMMUNITY_CATEGORIES, 
  POPULAR_CATEGORY_SUGGESTIONS,
  CreateRoomInput,
  UpdateCommunityRoomInput
} from '../../services/communityRoomService.ts';
import { playChime } from '../../utils/audio.ts';
import { peerCollabSync } from '../../services/peerCollabSync.ts';
import { RoomChatTab } from './RoomChatTab.tsx';

interface CommunityRoomsHubProps {
  currentUser?: { uid: string; displayName: string; email: string; photoURL?: string } | null;
  onEnterRoom?: (room: CommunityRoom) => void;
  activeRoomId?: string | null;
  nodes?: DAGNode[];
  notes?: NoteItem[];
  habits?: HabitItem[];
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
  habits = [],
  activeUnitId,
  onSelectUnit,
  onSaveNote,
}) => {
  const [hubTab, setHubTab] = useState<'rooms' | 'general_chat'>('rooms');
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
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([]);
  const [attachCurrentNode, setAttachCurrentNode] = useState(false);
  const [selectedCustomNodeId, setSelectedCustomNodeId] = useState<string | null>(null);
  const [attachedMetric, setAttachedMetric] = useState<AttachedMetricPostItem | null>(null);
  const [attachedProject, setAttachedProject] = useState<AttachedProjectPostItem | null>(null);
  const [attachedMindmap, setAttachedMindmap] = useState<AttachedMindmapPostItem | null>(null);
  const [attachedQuiz, setAttachedQuiz] = useState<AttachedQuizPostItem | null>(null);
  const [activePickerModal, setActivePickerModal] = useState<'notes' | 'habits' | 'block' | 'streak' | 'project' | 'mindmap' | 'quiz' | null>(null);
  const [viewingFullNote, setViewingFullNote] = useState<Pick<NoteItem, 'id' | 'title' | 'content' | 'tag' | 'createdAt'> | null>(null);
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const [expandedNoteIds, setExpandedNoteIds] = useState<Record<string, boolean>>({});
  const [revealedQuizIds, setRevealedQuizIds] = useState<Record<string, boolean>>({});
  const [cheeredHabits, setCheeredHabits] = useState<Record<string, number>>({});
  const [customProjectTitle, setCustomProjectTitle] = useState('Архитектурное решение');
  const [customProjectFilename, setCustomProjectFilename] = useState('solution.ts');
  const [customProjectCode, setCustomProjectCode] = useState('// Практический артефакт блока\nexport function solveProblem() {\n  return "All invariants satisfied";\n}');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);
  const [copiedCodePostId, setCopiedCodePostId] = useState<string | null>(null);

  // Memoized notes with high-quality fallback so @notes always has rich options
  const effectiveNotes: NoteItem[] = React.useMemo(() => {
    if (notes && notes.length > 0) return notes;
    try {
      const saved = localStorage.getItem('learning_os_notes_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return [
      {
        id: 'n-sys-1',
        title: 'Инварианты согласованности и CAP-теорема',
        content: '# Инварианты распределенных систем\n\n1. **ACID против BASE**:\n   - В распределенных системах мы обязаны выбирать между Строгой Согласованностью (CP) и Высокой Доступностью (AP).\n   - Любая операция записи должна иметь четкую семантику идемпотентности.\n\n2. **Векторные часы и причинно-следственная связь**:\n   - Физические часы (NTP) подвержены дрейфу.\n   - Логические часы Лэмпорта и векторные часы гарантируют частичный порядок событий.\n\n```typescript\ninterface IdempotentCommand {\n  readonly idempotencyKey: string;\n  readonly payload: unknown;\n  readonly clientTimestamp: number;\n}\n```\n\n3. **Вывод**:\n   - Всегда проектируйте API с поддержкой идемпотентных повторов (at-least-once + deduplication).',
        tag: '#архитектура',
        createdAt: 'Вчера, 18:40',
      },
      {
        id: 'n-sys-2',
        title: 'React Fiber и правила мемоизации',
        content: '# Оптимизация рендеринга в React SPA\n\n- Рендеринг в React — это чистая функция от props и state.\n- `useMemo` и `useCallback` имеют накладные расходы на создание замыкания и сравнение массива зависимостей.\n- Применять мемоизацию нужно только для тяжелых вычислений (фильтрация больших массивов) или для стабилизации ссылок на функции, передаваемые в чистые дочерние компоненты с `React.memo`.\n\nКлючевой инвариант: **Не оптимизируйте преждевременно, профилируйте с React DevTools Profiler**.',
        tag: '#react',
        createdAt: '2 дня назад',
      },
      {
        id: 'n-sys-3',
        title: 'Тест чистого листа: обход графов (BFS/DFS)',
        content: '# Графовые алгоритмы и инварианты поиска\n\n- **BFS (Поиск в ширину)**:\n  - Использует FIFO очередь (Queue).\n  - Находит кратчайший путь во взвешенном графе с одинаковыми весами ребер.\n  - Временная сложность: O(V + E).\n\n- **DFS (Поиск в глубину)**:\n  - Использует стек вызовов (LIFO) или рекурсию.\n  - Применяется для поиска циклов, топологической сортировки и компонент связности.\n\n*Инвариант*: Множество `visited` должно обновляться в момент добавления в очередь/стек, чтобы предотвратить зацикливание.',
        tag: '#алгоритмы',
        createdAt: 'Сегодня, 11:15',
      },
    ];
  }, [notes]);

  // Active habits list from prop or localStorage
  const activeHabits: HabitItem[] = React.useMemo(() => {
    if (habits && habits.length > 0) return habits;
    try {
      const saved = localStorage.getItem('learning_os_habits_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return [
      { id: 'h-1', title: '30 минут осознанного кода', streak: 12, completedToday: true, bestStreak: 18, category: 'code' },
      { id: 'h-2', title: 'Разбор 1 фундаментального инварианта', streak: 5, completedToday: false, bestStreak: 9, category: 'focus' },
      { id: 'h-3', title: 'Тест чистого листа без подглядывания', streak: 8, completedToday: true, bestStreak: 14, category: 'practice' },
    ];
  }, [habits]);

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

  const handlePostTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNewPostText(val);

    const cursorPos = e.target.selectionStart || val.length;
    const textBefore = val.slice(0, cursorPos);
    const lastAt = textBefore.lastIndexOf('@');

    if (lastAt !== -1 && (lastAt === 0 || /\s/.test(textBefore[lastAt - 1]))) {
      const query = textBefore.slice(lastAt + 1).toLowerCase();
      if (!query.includes(' ') && query.length <= 15) {
        setMentionFilter(query);
        setShowMentionPopup(true);
        return;
      }
    }
    setShowMentionPopup(false);
  };

  const handleAttachNoteDirectly = (note: NoteItem) => {
    setSelectedNoteIds((prev) => (prev.includes(note.id) ? prev : [...prev, note.id].slice(0, 5)));
    setNewPostText((prev) => {
      const lastAt = prev.lastIndexOf('@');
      if (lastAt !== -1) {
        const before = prev.slice(0, lastAt);
        const after = prev.slice(lastAt);
        const spaceIdx = after.indexOf(' ');
        const rest = spaceIdx !== -1 ? after.slice(spaceIdx) : '';
        return `${before}${rest}`.trimEnd() + ' ';
      }
      return prev;
    });
    setShowMentionPopup(false);
    playChime('success');
  };

  const handleAttachHabitDirectly = (habit: HabitItem) => {
    setSelectedHabitIds((prev) => (prev.includes(habit.id) ? prev : [...prev, habit.id]));
    setNewPostText((prev) => {
      const lastAt = prev.lastIndexOf('@');
      if (lastAt !== -1) {
        const before = prev.slice(0, lastAt);
        const after = prev.slice(lastAt);
        const spaceIdx = after.indexOf(' ');
        const rest = spaceIdx !== -1 ? after.slice(spaceIdx) : '';
        return `${before}${rest}`.trimEnd() + ' ';
      }
      return prev;
    });
    setShowMentionPopup(false);
    playChime('success');
  };

  const handleAttachBlockDirectly = (nodeId?: string) => {
    const targetNode = nodeId
      ? nodes.find((n) => n.id === nodeId)
      : (nodes.find((n) => n.status === 'active') || nodes.find((n) => n.id === activeUnitId || n.unitId === activeUnitId) || nodes[0]);
    if (targetNode) {
      setSelectedCustomNodeId(targetNode.id);
      setAttachCurrentNode(true);
    }
    setNewPostText((prev) => {
      const lastAt = prev.lastIndexOf('@');
      if (lastAt !== -1) {
        const before = prev.slice(0, lastAt);
        const after = prev.slice(lastAt);
        const spaceIdx = after.indexOf(' ');
        const rest = spaceIdx !== -1 ? after.slice(spaceIdx) : '';
        return `${before}${rest}`.trimEnd() + ' ';
      }
      return prev;
    });
    setShowMentionPopup(false);
    playChime('success');
  };

  const handleAttachStreakDirectly = () => {
    setAttachedMetric({
      type: 'streak',
      label: 'Непрерывный стрик обучения',
      value: '14 дней подряд 🔥',
      subtext: '42 часа фокуса · 98% удержания инвариантов',
    });
    setNewPostText((prev) => {
      const lastAt = prev.lastIndexOf('@');
      if (lastAt !== -1) {
        const before = prev.slice(0, lastAt);
        const after = prev.slice(lastAt);
        const spaceIdx = after.indexOf(' ');
        const rest = spaceIdx !== -1 ? after.slice(spaceIdx) : '';
        return `${before}${rest}`.trimEnd() + ' ';
      }
      return prev;
    });
    setShowMentionPopup(false);
    playChime('success');
  };

  const handleAttachMindmapDirectly = () => {
    const activeNode = nodes.find((n) => n.status === 'active') || nodes[0];
    setAttachedMindmap({
      topic: activeNode?.title || 'Архитектура и фундаментальные инварианты',
      centralInvariant: 'Декомпозиция на неизменяемые ядра, строгие гарантии согласованности и чистые контракты',
      concepts: ['ACID инварианты', 'Векторные часы', 'Идемпотентный retry', 'CAP компромиссы', 'Graceful Degradation'],
      connections: ['ACID ➔ Векторные часы ➔ Идемпотентность ➔ Graceful Degradation'],
    });
    setNewPostText((prev) => {
      const lastAt = prev.lastIndexOf('@');
      if (lastAt !== -1) {
        const before = prev.slice(0, lastAt);
        const after = prev.slice(lastAt);
        const spaceIdx = after.indexOf(' ');
        const rest = spaceIdx !== -1 ? after.slice(spaceIdx) : '';
        return `${before}${rest}`.trimEnd() + ' ';
      }
      return prev;
    });
    setShowMentionPopup(false);
    playChime('success');
  };

  const handleAttachQuizDirectly = () => {
    const activeNode = nodes.find((n) => n.status === 'active') || nodes[0];
    setAttachedQuiz({
      question: `Какой ключевой компромисс возникает при обеспечении строгой согласованности (Linearizability) в распределенной среде?`,
      answer: `По теореме CAP и модели PACELC, при разделении сети (Partition) система со строгой согласованностью (CP) вынуждена жертвовать доступностью (Availability) для операций записи, возвращая ошибку или тайм-аут клиенту вместо устаревших данных.`,
      hint: `Вспомните теорему CAP и задержки консенсуса (Raft/Paxos).`,
      category: activeNode?.title || 'System Design',
    });
    setNewPostText((prev) => {
      const lastAt = prev.lastIndexOf('@');
      if (lastAt !== -1) {
        const before = prev.slice(0, lastAt);
        const after = prev.slice(lastAt);
        const spaceIdx = after.indexOf(' ');
        const rest = spaceIdx !== -1 ? after.slice(spaceIdx) : '';
        return `${before}${rest}`.trimEnd() + ' ';
      }
      return prev;
    });
    setShowMentionPopup(false);
    playChime('success');
  };

  const handleSelectMention = (type: 'notes' | 'habits' | 'block' | 'streak' | 'project' | 'mindmap' | 'quiz') => {
    setShowMentionPopup(false);
    if (type === 'block') {
      handleAttachBlockDirectly();
      return;
    }
    if (type === 'streak') {
      handleAttachStreakDirectly();
      return;
    }
    if (type === 'mindmap') {
      handleAttachMindmapDirectly();
      return;
    }
    if (type === 'quiz') {
      handleAttachQuizDirectly();
      return;
    }
    setActivePickerModal(type);
    playChime('click');
  };

  const handlePostToFeed = async () => {
    if (!selectedRoomDetails || !newPostText.trim() || isPosting) return;
    setIsPosting(true);
    setFeedError(null);
    try {
      const activeNode = nodes.find((node) => node.status === 'active') || nodes.find(
        (node) => node.id === activeUnitId || node.unitId === activeUnitId
      );
      const chosenNode = selectedCustomNodeId ? nodes.find((n) => n.id === selectedCustomNodeId) : activeNode;
      const attachedNode = attachCurrentNode && chosenNode ? {
        nodeId: chosenNode.id,
        title: chosenNode.title,
        subtitle: chosenNode.subtitle,
        unitId: chosenNode.unitId,
        status: chosenNode.status,
        category: chosenNode.category,
      } : undefined;

      const attachedNotes = effectiveNotes
        .filter((note) => selectedNoteIds.includes(note.id))
        .slice(0, 5)
        .map((note) => ({ ...note, content: note.content.slice(0, 5000) }));

      const attachedHabits = activeHabits
        .filter((h) => selectedHabitIds.includes(h.id))
        .map((h) => ({
          id: h.id,
          title: h.title,
          streak: h.streak,
          completedToday: h.completedToday,
          bestStreak: h.bestStreak,
          category: h.category,
          targetDaysPerWeek: h.targetDaysPerWeek,
        }));

      const res = await communityRoomService.postToFeed(selectedRoomDetails.id, {
        authorId: myUserId,
        authorName: myUserName,
        authorAvatar: myUserAvatar,
        text: newPostText.trim(),
        learningNode: attachedNode,
        attachedNotes,
        attachedHabits: attachedHabits.length > 0 ? attachedHabits : undefined,
        attachedMetric: attachedMetric || undefined,
        attachedProject: attachedProject || undefined,
        attachedMindmap: attachedMindmap || undefined,
        attachedQuiz: attachedQuiz || undefined,
      });

      if (res.success && res.feedPosts) {
        setSelectedRoomDetails({
          ...selectedRoomDetails,
          feedPosts: res.feedPosts,
        });
        setNewPostText('');
        setSelectedNoteIds([]);
        setSelectedHabitIds([]);
        setAttachCurrentNode(false);
        setSelectedCustomNodeId(null);
        setAttachedMetric(null);
        setAttachedProject(null);
        setAttachedMindmap(null);
        setAttachedQuiz(null);
        setShowMentionPopup(false);
        playChime('success');
      }
    } catch (e) {
      console.warn('Error posting to feed:', e);
      setFeedError(e instanceof Error ? e.message : 'Не удалось опубликовать запись.');
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
      <div ref={formTopRef} className="w-full min-h-full max-w-4xl mx-auto space-y-6 bg-white text-gray-900 font-sans select-text pb-28 pt-2">
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
            <button type="button" onClick={() => setSelectedRoomDetails(null)} title="Назад к комнатам" className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 transition cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h1 className="truncate text-base font-bold">Учебная лента · {selectedRoomDetails.name}</h1>
                {selectedRoomDetails.isPrivate && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                    <Lock className="w-2.5 h-2.5 text-amber-600" />
                    <span>Закрытая группа (лента открыта)</span>
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-gray-500">
                {selectedRoomDetails.isPrivate 
                  ? 'Открытая лента закрытого сообщества: записи и конспекты доступны всем для чтения' 
                  : 'Блоки графа, разборы и конспекты участников'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            {selectedRoomDetails.isPrivate && !isRoomMember ? (
              <button
                type="button"
                onClick={() => handleOpenPrivatePin(selectedRoomDetails)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs cursor-pointer transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Войти по PIN</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onEnterRoom?.(selectedRoomDetails);
                  peerCollabSync.setRoomId(selectedRoomDetails.id);
                  playChime('success');
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs cursor-pointer transition"
              >
                <BoardIcon className="w-3.5 h-3.5" />
                <span>Войти в комнату</span>
              </button>
            )}

            {!isRoomMember && !selectedRoomDetails.isPrivate && (
              <button
                type="button"
                onClick={handleJoinFromFeed}
                className="shrink-0 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 cursor-pointer"
              >
                Вступить
              </button>
            )}
          </div>
        </header>

        {feedError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{feedError}</p>}

        {!isRoomMember && selectedRoomDetails.isPrivate && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Лента открыта для свободного изучения. Публиковать записи и присоединяться к интерактивной доске могут участники с кодом доступа.</span>
            </div>
            <button
              type="button"
              onClick={() => handleOpenPrivatePin(selectedRoomDetails)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold text-xs transition cursor-pointer shrink-0"
            >
              Ввести PIN
            </button>
          </div>
        )}

        {isRoomMember ? (
          <section className="relative space-y-3 rounded-2xl border border-gray-200 bg-gray-50/80 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900 flex items-center space-x-1.5">
                  <span>Новая учебная запись</span>
                  <span className="text-[11px] font-normal text-gray-500">(введите <code className="bg-white border border-gray-200 px-1 py-0.5 rounded text-blue-600 font-mono text-[10px]">@</code> для интеграций)</span>
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">Прикрепляйте заметки (@notes), привычки (@habits), текущий блок (@block), стрик (@streak) или код (@project).</p>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={newPostText}
                onChange={handlePostTextChange}
                maxLength={5000}
                rows={3}
                placeholder="Что изучаете, какой инвариант разобрали или каким прогрессом хотите поделиться? Введите @ для интеграций..."
                className="w-full resize-y rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
              />

              {/* Floating @mention autocomplete popup */}
              {showMentionPopup && (
                <div className="absolute z-30 left-2 bottom-full mb-2 w-96 max-h-80 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2.5 shadow-2xl animate-fade-in text-xs space-y-1.5">
                  <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-1.5">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-blue-500" />
                      <span>Интеграции в публикацию</span>
                    </span>
                    <button type="button" onClick={() => setShowMentionPopup(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  {/* 1. @notes mention */}
                  {(mentionFilter === '' || /^(n|no|not|note|notes|зам|конс)/i.test(mentionFilter)) && (
                    <div className="space-y-1">
                      {mentionFilter !== '' && (
                        <div className="px-2 pt-1 pb-0.5 text-[10px] font-bold text-amber-800 uppercase">
                          📝 Выберите заметку для прикрепления (@notes):
                        </div>
                      )}
                      {mentionFilter === '' ? (
                        <button
                          type="button"
                          onClick={() => setMentionFilter('notes')}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-amber-50 text-left text-gray-800 hover:text-amber-900 transition cursor-pointer"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                              <BookOpen className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold block truncate">@notes · Заметки из блокнота</span>
                              <span className="text-[10px] text-gray-500 block truncate">Выбрать заметку с просмотром целиком ({effectiveNotes.length} конспектов)</span>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        </button>
                      ) : (
                        effectiveNotes.slice(0, 4).map((note) => (
                          <div
                            key={`mention-note-${note.id}`}
                            onClick={() => handleAttachNoteDirectly(note)}
                            className="p-2 rounded-xl border border-amber-200/80 bg-amber-50/60 hover:bg-amber-100/70 text-left cursor-pointer transition flex items-start space-x-2"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <h4 className="font-bold text-xs text-gray-900 truncate">{note.title}</h4>
                                {note.tag && (
                                  <span className="text-[9px] font-semibold bg-amber-200/70 text-amber-900 px-1 py-0.2 rounded shrink-0">
                                    {note.tag}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-600 line-clamp-1 mt-0.5">{note.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                      {mentionFilter !== '' && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowMentionPopup(false);
                            setActivePickerModal('notes');
                          }}
                          className="w-full text-center py-1 text-[10px] font-semibold text-amber-700 hover:text-amber-900 hover:underline cursor-pointer"
                        >
                          Все заметки блокнота ({effectiveNotes.length}) ↗
                        </button>
                      )}
                    </div>
                  )}

                  {/* 2. @habits mention */}
                  {(mentionFilter === '' || /^(h|ha|hab|habit|habits|прив|зад|дн)/i.test(mentionFilter)) && (
                    <div className="space-y-1">
                      {mentionFilter !== '' && (
                        <div className="px-2 pt-1 pb-0.5 text-[10px] font-bold text-orange-800 uppercase">
                          🔥 Выберите привычку со стриком (@habits):
                        </div>
                      )}
                      {mentionFilter === '' ? (
                        <button
                          type="button"
                          onClick={() => setMentionFilter('habits')}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-orange-50 text-left text-gray-800 hover:text-orange-900 transition cursor-pointer"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                              <Flame className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold block truncate">@habits · Трекер привычек</span>
                              <span className="text-[10px] text-gray-500 block truncate">Задача, стрик в днях 🔥 и статус на сегодня</span>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        </button>
                      ) : (
                        activeHabits.slice(0, 4).map((h) => (
                          <div
                            key={`mention-habit-${h.id}`}
                            onClick={() => handleAttachHabitDirectly(h)}
                            className="p-2 rounded-xl border border-orange-200/80 bg-orange-50/60 hover:bg-orange-100/70 text-left cursor-pointer transition flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-xs text-gray-900 truncate">{h.title}</h4>
                              <div className="flex items-center space-x-2 text-[10px] text-gray-500 mt-0.5">
                                <span className={h.completedToday ? 'text-emerald-700 font-semibold' : 'text-amber-700'}>
                                  {h.completedToday ? '✓ Выполнено сегодня' : '⏳ В процессе'}
                                </span>
                                <span>·</span>
                                <span>{h.targetDaysPerWeek || 7} дн/нед</span>
                              </div>
                            </div>
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500 text-white shrink-0 shadow-2xs">
                              <Flame className="w-3 h-3 fill-current" />
                              <span>{h.streak} дн.</span>
                            </span>
                          </div>
                        ))
                      )}
                      {mentionFilter !== '' && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowMentionPopup(false);
                            setActivePickerModal('habits');
                          }}
                          className="w-full text-center py-1 text-[10px] font-semibold text-orange-700 hover:text-orange-900 hover:underline cursor-pointer"
                        >
                          Все задачи и привычки ({activeHabits.length}) ↗
                        </button>
                      )}
                    </div>
                  )}

                  {/* 3. @block mention */}
                  {(mentionFilter === '' || /^(b|bl|blo|block|бло|урок|текущ)/i.test(mentionFilter)) && (
                    <div className="space-y-1">
                      {mentionFilter !== '' && (
                        <div className="px-2 pt-1 pb-0.5 text-[10px] font-bold text-blue-800 uppercase">
                          📘 Показать учебный блок (@block):
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleAttachBlockDirectly()}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-blue-50 text-left text-gray-800 hover:text-blue-900 transition cursor-pointer"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                            <Layers className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold block truncate">@block · Текущий активный блок</span>
                            <span className="text-[10px] text-gray-500 block truncate">
                              {nodes.find((n) => n.status === 'active')?.title || nodes[0]?.title || 'Изучаемый блок курса'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded shrink-0">
                          Прикрепить
                        </span>
                      </button>
                      {mentionFilter !== '' && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowMentionPopup(false);
                            setActivePickerModal('block');
                          }}
                          className="w-full text-center py-1 text-[10px] font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                        >
                          Выбрать другой блок из графа ({nodes.length}) ↗
                        </button>
                      )}
                    </div>
                  )}

                  {/* 4. @streak mention */}
                  {(mentionFilter === '' || /^(s|st|str|streak|стр|метрик)/i.test(mentionFilter)) && (
                    <button
                      type="button"
                      onClick={handleAttachStreakDirectly}
                      className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl hover:bg-emerald-50 text-left text-gray-800 hover:text-emerald-900 transition cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold block truncate">@streak · Стрик & Метрики фокуса</span>
                        <span className="text-[10px] text-gray-500 block truncate">14 дней непрерывного фокуса 🔥 · 42 часа</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                        Прикрепить
                      </span>
                    </button>
                  )}

                  {/* 5. @mindmap mention */}
                  {(mentionFilter === '' || /^(m|mi|mind|mindmap|майн|карт)/i.test(mentionFilter)) && (
                    <button
                      type="button"
                      onClick={handleAttachMindmapDirectly}
                      className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl hover:bg-violet-50 text-left text-gray-800 hover:text-violet-900 transition cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                        <Brain className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold block truncate">@mindmap · Интеллект-карта концептов</span>
                        <span className="text-[10px] text-gray-500 block truncate">Граф инвариантов и понятий темы</span>
                      </div>
                      <span className="text-[10px] font-bold text-violet-700 bg-violet-100 px-1.5 py-0.5 rounded shrink-0">
                        Прикрепить
                      </span>
                    </button>
                  )}

                  {/* 6. @quiz mention */}
                  {(mentionFilter === '' || /^(q|qu|qui|quiz|тест|вопрос)/i.test(mentionFilter)) && (
                    <button
                      type="button"
                      onClick={handleAttachQuizDirectly}
                      className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl hover:bg-teal-50 text-left text-gray-800 hover:text-teal-900 transition cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                        <HelpCircle className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold block truncate">@quiz · Вопрос взаимопроверки</span>
                        <span className="text-[10px] text-gray-500 block truncate">Интерактивный вопрос сообществу с разбором</span>
                      </div>
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded shrink-0">
                        Прикрепить
                      </span>
                    </button>
                  )}

                  {/* 7. @project mention */}
                  {(mentionFilter === '' || /^(p|pr|proj|project|код|code)/i.test(mentionFilter)) && (
                    <button
                      type="button"
                      onClick={() => handleSelectMention('project')}
                      className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl hover:bg-purple-50 text-left text-gray-800 hover:text-purple-900 transition cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                        <Code className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold block truncate">@project · Код & Проект</span>
                        <span className="text-[10px] text-gray-500 block truncate">Прикрепить решение или сниппет кода</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Quick Integration Action Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-200/80">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium text-gray-500 mr-1 flex items-center">
                  <Paperclip className="w-3 h-3 mr-1 text-gray-400" />
                  <span>Интеграции:</span>
                </span>

                {/* @notes */}
                <button
                  type="button"
                  onClick={() => setActivePickerModal('notes')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    selectedNoteIds.length > 0
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold shadow-2xs'
                      : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 shadow-2xs'
                  }`}
                  title="Прикрепить заметки из блокнота (@notes)"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                  <span>@notes</span>
                  {selectedNoteIds.length > 0 && (
                    <span className="bg-amber-600 text-white text-[10px] rounded-full px-1.5 font-bold">
                      {selectedNoteIds.length}
                    </span>
                  )}
                </button>

                {/* @habits */}
                <button
                  type="button"
                  onClick={() => setActivePickerModal('habits')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    selectedHabitIds.length > 0
                      ? 'bg-orange-100 text-orange-900 border border-orange-300 font-semibold shadow-2xs'
                      : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 shadow-2xs'
                  }`}
                  title="Прикрепить задачу или привычку со стриком (@habits)"
                >
                  <Flame className="w-3.5 h-3.5 text-orange-600" />
                  <span>@habits</span>
                  {selectedHabitIds.length > 0 && (
                    <span className="bg-orange-600 text-white text-[10px] rounded-full px-1.5 font-bold">
                      {selectedHabitIds.length}
                    </span>
                  )}
                </button>

                {/* @block */}
                <button
                  type="button"
                  onClick={() => {
                    if (attachCurrentNode) {
                      setAttachCurrentNode(false);
                      setSelectedCustomNodeId(null);
                    } else {
                      handleAttachBlockDirectly();
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    attachCurrentNode
                      ? 'bg-blue-100 text-blue-900 border border-blue-300 font-semibold shadow-2xs'
                      : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 shadow-2xs'
                  }`}
                  title="Показать текущий изучаемый блок (@block)"
                >
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>@block</span>
                  {attachCurrentNode && <span className="text-[10px] text-blue-700 font-bold">✓</span>}
                </button>

                {/* @streak */}
                <button
                  type="button"
                  onClick={() => {
                    if (attachedMetric) {
                      setAttachedMetric(null);
                    } else {
                      handleAttachStreakDirectly();
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    attachedMetric
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold shadow-2xs'
                      : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 shadow-2xs'
                  }`}
                  title="Прикрепить метрику обучения или стрик (@streak)"
                >
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  <span>@streak</span>
                  {attachedMetric && <span className="text-[10px] text-emerald-700 font-bold">✓</span>}
                </button>

                {/* @mindmap */}
                <button
                  type="button"
                  onClick={() => {
                    if (attachedMindmap) {
                      setAttachedMindmap(null);
                    } else {
                      handleAttachMindmapDirectly();
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    attachedMindmap
                      ? 'bg-violet-100 text-violet-900 border border-violet-300 font-semibold shadow-2xs'
                      : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 shadow-2xs'
                  }`}
                  title="Прикрепить интеллект-карту концептов (@mindmap)"
                >
                  <Brain className="w-3.5 h-3.5 text-violet-600" />
                  <span>@mindmap</span>
                  {attachedMindmap && <span className="text-[10px] text-violet-700 font-bold">✓</span>}
                </button>

                {/* @quiz */}
                <button
                  type="button"
                  onClick={() => {
                    if (attachedQuiz) {
                      setAttachedQuiz(null);
                    } else {
                      handleAttachQuizDirectly();
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    attachedQuiz
                      ? 'bg-teal-100 text-teal-900 border border-teal-300 font-semibold shadow-2xs'
                      : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 shadow-2xs'
                  }`}
                  title="Прикрепить вопрос самопроверки (@quiz)"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
                  <span>@quiz</span>
                  {attachedQuiz && <span className="text-[10px] text-teal-700 font-bold">✓</span>}
                </button>

                {/* @project */}
                <button
                  type="button"
                  onClick={() => setActivePickerModal('project')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    attachedProject
                      ? 'bg-purple-100 text-purple-900 border border-purple-300 font-semibold shadow-2xs'
                      : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 shadow-2xs'
                  }`}
                  title="Прикрепить сниппет кода или решение проекта (@project)"
                >
                  <Code className="w-3.5 h-3.5 text-purple-600" />
                  <span>@project</span>
                  {attachedProject && <span className="text-[10px] text-purple-700 font-bold">✓</span>}
                </button>
              </div>

              <button
                type="button"
                onClick={handlePostToFeed}
                disabled={!newPostText.trim() || isPosting}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isPosting ? 'Публикую…' : 'Опубликовать'}</span>
              </button>
            </div>

            {/* Currently Attached Items Chips Tray */}
            {(selectedNoteIds.length > 0 || selectedHabitIds.length > 0 || attachCurrentNode || attachedMetric || attachedProject || attachedMindmap || attachedQuiz) && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-200/60">
                <span className="text-[10px] uppercase font-bold text-gray-400 mr-1">Прикреплено:</span>
                
                {/* Attached Notes Chips with instant Preview button */}
                {effectiveNotes.filter((n) => selectedNoteIds.includes(n.id)).map((note) => (
                  <span
                    key={`chip-n-${note.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs"
                  >
                    <BookOpen className="w-3 h-3 text-amber-600 shrink-0" />
                    <span className="max-w-[140px] truncate font-medium">{note.title}</span>
                    <button
                      type="button"
                      onClick={() => setViewingFullNote(note)}
                      className="text-blue-700 hover:text-blue-900 text-[10px] font-semibold underline px-0.5 cursor-pointer"
                      title="Предпросмотр заметки полностью"
                    >
                      (глаз)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedNoteIds((prev) => prev.filter((id) => id !== note.id))}
                      className="text-amber-700 hover:text-amber-950 font-bold ml-0.5 cursor-pointer"
                      title="Удалить"
                    >
                      ×
                    </button>
                  </span>
                ))}

                {/* Attached Habits Chips */}
                {activeHabits.filter((h) => selectedHabitIds.includes(h.id)).map((habit) => (
                  <span
                    key={`chip-h-${habit.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-orange-50 text-orange-900 border border-orange-200 shadow-2xs"
                  >
                    <Flame className="w-3 h-3 text-orange-600 shrink-0" />
                    <span className="max-w-[140px] truncate font-medium">{habit.title} ({habit.streak} дн.)</span>
                    <button
                      type="button"
                      onClick={() => setSelectedHabitIds((prev) => prev.filter((id) => id !== habit.id))}
                      className="text-orange-700 hover:text-orange-950 font-bold ml-0.5 cursor-pointer"
                      title="Удалить"
                    >
                      ×
                    </button>
                  </span>
                ))}

                {/* Attached Node Chip */}
                {attachCurrentNode && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs">
                    <Layers className="w-3 h-3 text-blue-600 shrink-0" />
                    <span className="max-w-[150px] truncate font-medium">
                      Блок: {selectedCustomNodeId
                        ? nodes.find((n) => n.id === selectedCustomNodeId)?.title || 'Блок графа'
                        : nodes.find((n) => n.status === 'active')?.title || 'Текущий блок'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachCurrentNode(false);
                        setSelectedCustomNodeId(null);
                      }}
                      className="text-blue-700 hover:text-blue-950 font-bold ml-0.5 cursor-pointer"
                      title="Удалить"
                    >
                      ×
                    </button>
                  </span>
                )}

                {/* Attached Metric Chip */}
                {attachedMetric && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs">
                    <Zap className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="font-medium">{attachedMetric.label}: {attachedMetric.value}</span>
                    <button
                      type="button"
                      onClick={() => setAttachedMetric(null)}
                      className="text-emerald-700 hover:text-emerald-950 font-bold ml-0.5 cursor-pointer"
                      title="Удалить"
                    >
                      ×
                    </button>
                  </span>
                )}

                {/* Attached Mindmap Chip */}
                {attachedMindmap && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-violet-50 text-violet-900 border border-violet-200 shadow-2xs">
                    <Brain className="w-3 h-3 text-violet-600 shrink-0" />
                    <span className="max-w-[140px] truncate font-medium">Карта: {attachedMindmap.topic}</span>
                    <button
                      type="button"
                      onClick={() => setAttachedMindmap(null)}
                      className="text-violet-700 hover:text-violet-950 font-bold ml-0.5 cursor-pointer"
                      title="Удалить"
                    >
                      ×
                    </button>
                  </span>
                )}

                {/* Attached Quiz Chip */}
                {attachedQuiz && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-teal-50 text-teal-900 border border-teal-200 shadow-2xs">
                    <HelpCircle className="w-3 h-3 text-teal-600 shrink-0" />
                    <span className="max-w-[140px] truncate font-medium">Вопрос: {attachedQuiz.category || 'Самопроверка'}</span>
                    <button
                      type="button"
                      onClick={() => setAttachedQuiz(null)}
                      className="text-teal-700 hover:text-teal-950 font-bold ml-0.5 cursor-pointer"
                      title="Удалить"
                    >
                      ×
                    </button>
                  </span>
                )}

                {/* Attached Project Chip */}
                {attachedProject && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-purple-50 text-purple-900 border border-purple-200 shadow-2xs">
                    <Code className="w-3 h-3 text-purple-600 shrink-0" />
                    <span className="max-w-[140px] truncate font-medium">{attachedProject.filename || attachedProject.title}</span>
                    <button
                      type="button"
                      onClick={() => setAttachedProject(null)}
                      className="text-purple-700 hover:text-purple-950 font-bold ml-0.5 cursor-pointer"
                      title="Удалить"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            )}
          </section>
        ) : (
          <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 text-xs text-blue-800 flex items-center justify-between">
            <span>Чтобы публиковать в этой ленте и прикреплять заметки или привычки, сначала вступите в комнату.</span>
          </div>
        )}

        {/* FEED POSTS LIST */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
              <span>Записи сообщества</span>
              <span className="text-xs text-gray-400 font-normal font-mono">({posts.length})</span>
            </h2>
          </div>

          {posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500 bg-gray-50/40">
              Пока нет учебных записей. Будьте первым, кто опубликует вопрос или конспект!
            </div>
          ) : (
            posts.map((post) => (
              <article key={post.id} className="space-y-3.5 rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs hover:shadow-xs transition">
                <header className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    {post.authorAvatar ? (
                      <img src={post.authorAvatar} alt="" className="h-9 w-9 rounded-full object-cover border border-gray-200 shadow-2xs" />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-xs font-bold text-white shadow-2xs">
                        {post.authorName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-gray-900">{post.authorName}</div>
                      <time className="text-[10px] text-gray-400">
                        {Number.isNaN(new Date(post.createdAt).getTime())
                          ? post.createdAt
                          : new Date(post.createdAt).toLocaleString('ru-RU')}
                      </time>
                    </div>
                  </div>
                </header>

                {/* Post Main Text */}
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 select-text">
                  {post.text}
                </p>

                {/* 1. ATTACHED LEARNING BLOCK ("показать текущий блок") */}
                {post.learningNode && (
                  <div className="flex items-start justify-between gap-3 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-white p-4 shadow-2xs">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        <Layers className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center space-x-2 text-[10px] font-bold uppercase text-blue-700">
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Учебный блок программы</span>
                          <span>·</span>
                          <span className="font-semibold text-blue-600">{post.learningNode.status || 'В изучении'}</span>
                          {post.learningNode.category && (
                            <>
                              <span>·</span>
                              <span className="text-gray-500">{post.learningNode.category}</span>
                            </>
                          )}
                        </div>
                        <div className="text-sm font-bold text-gray-900 leading-snug">{post.learningNode.title}</div>
                        {post.learningNode.subtitle && (
                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{post.learningNode.subtitle}</p>
                        )}
                      </div>
                    </div>
                    {post.learningNode.unitId && onSelectUnit && (
                      <button
                        type="button"
                        onClick={() => {
                          const unitId = post.learningNode?.unitId;
                          if (!unitId) return;
                          onSelectUnit(unitId);
                          window.dispatchEvent(new CustomEvent('learning_launch_module_window', { detail: { unitId } }));
                          playChime('click');
                        }}
                        title="Открыть связанный блок в Focus Studio"
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-blue-300 bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition cursor-pointer"
                      >
                        <span>В Focus Studio</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* 2. ATTACHED HABITS (СТРИК, ДНИ, ЗАДАЧА) */}
                {post.attachedHabits && post.attachedHabits.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-orange-800/80 flex items-center space-x-1">
                      <Flame className="w-3.5 h-3.5 text-orange-600" />
                      <span>Прикрепленные задачи и привычки ({post.attachedHabits.length})</span>
                    </div>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {post.attachedHabits.map((h) => {
                        const cheerCount = (post.habitCheered?.[h.id] || 0) + (cheeredHabits[`${post.id}-${h.id}`] || 0);
                        return (
                          <div
                            key={`post-h-${post.id}-${h.id}`}
                            className="p-3.5 rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50/90 via-amber-50/60 to-white shadow-2xs space-y-2.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded">
                                  {h.category || 'Привычка & Задача'}
                                </span>
                                <h4 className="font-bold text-xs text-gray-900 leading-snug mt-1">{h.title}</h4>
                              </div>
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500 text-white shadow-xs shrink-0">
                                <Flame className="w-3.5 h-3.5 fill-current" />
                                <span>{h.streak} дн. стрик</span>
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600 border-t border-orange-100 pt-2">
                              {h.completedToday ? (
                                <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-semibold">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Выполнено сегодня</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-semibold">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>В процессе сегодня</span>
                                </span>
                              )}
                              <span>·</span>
                              <span>Рекорд: <strong>{h.bestStreak || h.streak} дней</strong></span>
                            </div>

                            {/* 7-day progress indicator and cheer button */}
                            <div className="flex items-center justify-between pt-1">
                              <div className="flex items-center space-x-1">
                                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((dayName, dayIdx) => {
                                  const isActive = dayIdx < Math.min(h.streak, 7);
                                  return (
                                    <span
                                      key={`dot-${dayIdx}`}
                                      title={`${dayName}: ${isActive ? 'Активен' : 'Ожидает'}`}
                                      className={`w-4 h-4 rounded text-[9px] flex items-center justify-center font-bold transition ${
                                        isActive ? 'bg-orange-500 text-white shadow-2xs' : 'bg-orange-100 text-orange-400'
                                      }`}
                                    >
                                      {dayName[0]}
                                    </span>
                                  );
                                })}
                                <span className="text-[10px] text-gray-500 ml-1 font-medium">{h.targetDaysPerWeek || 7} дн/нед</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  const key = `${post.id}-${h.id}`;
                                  setCheeredHabits((prev) => ({
                                    ...prev,
                                    [key]: (prev[key] || 0) + 1,
                                  }));
                                  playChime('success');
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-orange-200 text-orange-700 hover:bg-orange-100 text-[11px] font-semibold transition cursor-pointer shadow-2xs"
                                title="Поддержать непрерывный стрик"
                              >
                                <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                                <span>{cheerCount > 0 ? `+${cheerCount} 🔥` : 'Поддержать'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. ATTACHED METRIC / STREAK */}
                {post.attachedMetric && (
                  <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 shadow-2xs flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase text-emerald-800">{post.attachedMetric.label}</div>
                        <div className="text-sm font-bold text-gray-900">{post.attachedMetric.value}</div>
                        {post.attachedMetric.subtext && (
                          <div className="text-[10px] text-gray-500">{post.attachedMetric.subtext}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. ATTACHED PROJECT / CODE SNIPPET */}
                {post.attachedProject && (
                  <div className="rounded-xl border border-purple-200 bg-slate-950 text-white p-3.5 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                      <div className="flex items-center space-x-2">
                        <Code className="w-3.5 h-3.5 text-purple-400" />
                        <span className="font-bold text-slate-200">{post.attachedProject.title}</span>
                        {post.attachedProject.filename && (
                          <span className="text-[10px] text-slate-400 font-mono">({post.attachedProject.filename})</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(post.attachedProject?.codeSnippet || '');
                          setCopiedCodePostId(post.id);
                          setTimeout(() => setCopiedCodePostId(null), 2000);
                        }}
                        className="text-[11px] text-purple-300 hover:text-white flex items-center space-x-1 cursor-pointer transition"
                      >
                        {copiedCodePostId === post.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Скопировано!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Скопировать код</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="text-xs font-mono text-slate-300 overflow-x-auto p-2 bg-slate-900/80 rounded-lg max-h-48 leading-relaxed">
                      <code>{post.attachedProject.codeSnippet}</code>
                    </pre>
                  </div>
                )}

                {/* 5. ATTACHED NOTES WITH FULL MODAL VIEW ("и можно посмотреть заметку полностью") */}
                {post.attachedNotes && post.attachedNotes.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800/80 flex items-center space-x-1">
                      <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                      <span>Прикрепленные конспекты ({post.attachedNotes.length})</span>
                    </div>
                    {post.attachedNotes.map((note) => {
                      const isExpanded = Boolean(expandedNoteIds[`${post.id}-${note.id}`]);
                      return (
                        <div
                          key={`post-n-${post.id}-${note.id}`}
                          className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 shadow-2xs space-y-2 transition"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center space-x-2 min-w-0">
                              <FileText className="h-4 w-4 text-amber-700 shrink-0" />
                              <h4 className="text-xs font-bold text-gray-900 truncate">{note.title}</h4>
                              {note.tag && (
                                <span className="text-[10px] font-semibold bg-amber-200/60 text-amber-900 px-1.5 py-0.2 rounded shrink-0">
                                  {note.tag}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedNoteIds((prev) => ({
                                    ...prev,
                                    [`${post.id}-${note.id}`]: !isExpanded,
                                  }))
                                }
                                className="text-[11px] font-medium text-amber-900 hover:text-amber-950 px-2 py-1 rounded bg-amber-100/70 hover:bg-amber-200/70 transition cursor-pointer flex items-center space-x-1"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-3 h-3" />
                                    <span>Свернуть</span>
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3" />
                                    <span>Развернуть</span>
                                  </>
                                )}
                              </button>

                              {/* Кнопка посмотреть заметку полностью */}
                              <button
                                type="button"
                                onClick={() => setViewingFullNote(note)}
                                className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 px-2.5 py-1 rounded-md bg-white border border-blue-200 hover:bg-blue-50 shadow-2xs transition cursor-pointer flex items-center space-x-1"
                                title="Посмотреть заметку полностью во весь экран"
                              >
                                <Maximize2 className="w-3 h-3 text-blue-600" />
                                <span>Посмотреть полностью ↗</span>
                              </button>
                            </div>
                          </div>

                          {/* Content Preview or Expanded */}
                          <div className={`text-xs text-gray-800 whitespace-pre-wrap leading-relaxed border-t border-amber-200/60 pt-2 ${
                            isExpanded ? '' : 'line-clamp-2'
                          }`}>
                            {note.content}
                          </div>

                          {/* Action footer */}
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-gray-400">
                              {note.createdAt || 'Конспект студента'}
                            </span>
                            {onSaveNote && (
                              <button
                                type="button"
                                onClick={() => {
                                  onSaveNote(note.title, note.content, note.tag || '#конспект');
                                  playChime('success');
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 hover:text-amber-950 cursor-pointer"
                              >
                                <BookOpen className="w-3 h-3 text-amber-600" />
                                <span>Сохранить в мой блокнот</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 6. ATTACHED MINDMAP */}
                {post.attachedMindmap && (
                  <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50/90 to-purple-50/50 p-3.5 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between border-b border-violet-200/60 pb-2">
                      <div className="flex items-center space-x-2">
                        <Brain className="w-4 h-4 text-violet-700" />
                        <span className="text-xs font-bold text-violet-950">Интеллект-карта концептов: {post.attachedMindmap.topic}</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
                        @mindmap
                      </span>
                    </div>
                    {post.attachedMindmap.centralInvariant && (
                      <p className="text-xs text-violet-900 bg-white/80 p-2.5 rounded-lg border border-violet-100 italic">
                        «{post.attachedMindmap.centralInvariant}»
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {post.attachedMindmap.concepts.map((concept, idx) => (
                        <React.Fragment key={`mm-${idx}`}>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white border border-violet-200 text-xs font-medium text-violet-900 shadow-2xs">
                            {concept}
                          </span>
                          {idx < (post.attachedMindmap?.concepts.length || 0) - 1 && (
                            <ArrowRight className="w-3 h-3 text-violet-400 shrink-0" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {/* 7. ATTACHED QUIZ */}
                {post.attachedQuiz && (
                  <div className="rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50/90 to-emerald-50/50 p-3.5 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between border-b border-teal-200/60 pb-2">
                      <div className="flex items-center space-x-2">
                        <HelpCircle className="w-4 h-4 text-teal-700" />
                        <span className="text-xs font-bold text-teal-950">Вопрос самопроверки сообщества</span>
                        {post.attachedQuiz.category && (
                          <span className="text-[10px] text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded font-medium">
                            {post.attachedQuiz.category}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
                        @quiz
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-gray-900 leading-relaxed">
                      {post.attachedQuiz.question}
                    </p>
                    {post.attachedQuiz.hint && (
                      <p className="text-[11px] text-teal-800 bg-white/70 p-2 rounded-lg border border-teal-100">
                        💡 <strong>Подсказка:</strong> {post.attachedQuiz.hint}
                      </p>
                    )}
                    <div className="pt-1">
                      {revealedQuizIds[`${post.id}-quiz`] ? (
                        <div className="space-y-2 animate-fade-in">
                          <div className="p-3 bg-white rounded-xl border border-teal-200 text-xs text-gray-800 leading-relaxed shadow-2xs">
                            <span className="font-bold text-emerald-700 block mb-1">✓ Правильный ответ и академический разбор:</span>
                            {post.attachedQuiz.answer}
                          </div>
                          <button
                            type="button"
                            onClick={() => setRevealedQuizIds((prev) => ({ ...prev, [`${post.id}-quiz`]: false }))}
                            className="text-[11px] text-teal-700 hover:text-teal-900 font-semibold cursor-pointer underline"
                          >
                            Скрыть ответ
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setRevealedQuizIds((prev) => ({ ...prev, [`${post.id}-quiz`]: true }));
                            playChime('click');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Показать ответ и разбор</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </article>
            ))
          )}
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* MODAL 1: FULL NOTE VIEWER ("можно посмотреть заметку полностью") */}
        {/* ------------------------------------------------------------------ */}
        {viewingFullNote && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs p-4 flex items-center justify-center animate-fade-in">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden text-gray-900 flex flex-col max-h-[85vh]">
              <header className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50/40">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-900">{viewingFullNote.title}</h3>
                    <div className="flex items-center space-x-2 text-[11px] text-gray-500 mt-0.5">
                      {viewingFullNote.tag && (
                        <span className="font-semibold bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-full">
                          {viewingFullNote.tag}
                        </span>
                      )}
                      <span>·</span>
                      <span>{viewingFullNote.createdAt || 'Конспект студента'}</span>
                      <span>·</span>
                      <span>{viewingFullNote.content.split(/\s+/).filter(Boolean).length} слов</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(viewingFullNote.content);
                      setCopiedNoteId(viewingFullNote.id);
                      setTimeout(() => setCopiedNoteId(null), 2000);
                      playChime('click');
                    }}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition shadow-2xs"
                    title="Скопировать весь текст конспекта"
                  >
                    {copiedNoteId === viewingFullNote.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Скопировано!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-gray-500" />
                        <span>Копировать</span>
                      </>
                    )}
                  </button>

                  {onSaveNote && (
                    <button
                      type="button"
                      onClick={() => {
                        onSaveNote(viewingFullNote.title, viewingFullNote.content, viewingFullNote.tag || '#конспект');
                        playChime('success');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer flex items-center space-x-1.5"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>В мой блокнот</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setViewingFullNote(null)}
                    className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-6 whitespace-pre-wrap text-sm leading-relaxed text-gray-800 select-text font-sans bg-gray-50/40">
                <div className="max-w-none prose prose-slate">
                  {viewingFullNote.content}
                </div>
              </div>

              <footer className="p-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Полный просмотр конспекта · Интеграция @notes
                </span>
                <button
                  type="button"
                  onClick={() => setViewingFullNote(null)}
                  className="px-4 py-1.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold transition cursor-pointer"
                >
                  Закрыть
                </button>
              </footer>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MODAL 2: @notes PICKER MODAL */}
        {/* ------------------------------------------------------------------ */}
        {activePickerModal === 'notes' && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs p-4 flex items-center justify-center animate-fade-in">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden text-gray-900 flex flex-col max-h-[80vh]">
              <header className="flex items-center justify-between p-4 border-b border-gray-100 bg-amber-50/50">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-amber-700" />
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Прикрепить заметку к публикации (@notes)</h3>
                    <p className="text-[11px] text-gray-500">Выберите до 5 заметок из вашего блокнота с полным просмотром</p>
                  </div>
                </div>
                <button type="button" onClick={() => setActivePickerModal(null)} className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </header>

              <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={noteSearchQuery}
                    onChange={(e) => setNoteSearchQuery(e.target.value)}
                    placeholder="Поиск по названию или тексту заметки..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {effectiveNotes.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-500">
                    В вашем блокноте пока нет заметок. Вы можете сохранить любую теорию или цитату в блокнот прямо во время обучения!
                  </div>
                ) : (
                  effectiveNotes
                    .filter((n) =>
                      n.title.toLowerCase().includes(noteSearchQuery.toLowerCase()) ||
                      n.content.toLowerCase().includes(noteSearchQuery.toLowerCase())
                    )
                    .map((note) => {
                      const isSelected = selectedNoteIds.includes(note.id);
                      return (
                        <div
                          key={`picker-n-${note.id}`}
                          onClick={() => {
                            setSelectedNoteIds((prev) =>
                              prev.includes(note.id)
                                ? prev.filter((id) => id !== note.id)
                                : prev.length < 5
                                ? [...prev, note.id]
                                : prev
                            );
                            playChime('click');
                          }}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition flex items-start space-x-3 ${
                            isSelected
                              ? 'border-amber-400 bg-amber-50/80 shadow-2xs'
                              : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="mt-1 accent-amber-600 rounded"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-xs text-gray-900 truncate">{note.title}</h4>
                              {note.tag && (
                                <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-medium">
                                  {note.tag}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                              {note.content}
                            </p>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              <footer className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Выбрано: <strong>{selectedNoteIds.length}</strong> / 5
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActivePickerModal(null);
                    playChime('success');
                  }}
                  className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition cursor-pointer"
                >
                  Готово
                </button>
              </footer>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MODAL 3: @habits PICKER MODAL */}
        {/* ------------------------------------------------------------------ */}
        {activePickerModal === 'habits' && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs p-4 flex items-center justify-center animate-fade-in">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden text-gray-900 flex flex-col max-h-[80vh]">
              <header className="flex items-center justify-between p-4 border-b border-gray-100 bg-orange-50/50">
                <div className="flex items-center space-x-2">
                  <Flame className="w-5 h-5 text-orange-600" />
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Интеграция с привычками (@habits)</h3>
                    <p className="text-[11px] text-gray-500">Прикрепите регулярную задачу со стриком и днями непрерывности</p>
                  </div>
                </div>
                <button type="button" onClick={() => setActivePickerModal(null)} className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {activeHabits.map((habit) => {
                  const isSelected = selectedHabitIds.includes(habit.id);
                  return (
                    <div
                      key={`picker-h-${habit.id}`}
                      onClick={() => {
                        setSelectedHabitIds((prev) =>
                          prev.includes(habit.id)
                            ? prev.filter((id) => id !== habit.id)
                            : [...prev, habit.id]
                        );
                        playChime('click');
                      }}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition flex items-start space-x-3 ${
                        isSelected
                          ? 'border-orange-400 bg-orange-50/80 shadow-2xs'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="mt-1 accent-orange-600 rounded"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs text-gray-900">{habit.title}</h4>
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500 text-white shadow-2xs">
                            <Flame className="w-3 h-3 fill-current" />
                            <span>{habit.streak} дн.</span>
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 text-[11px] text-gray-500">
                          <span>
                            Статус сегодня:{' '}
                            <strong className={habit.completedToday ? 'text-emerald-700 font-bold' : 'text-amber-700'}>
                              {habit.completedToday ? '✓ Выполнено' : '⏳ В процессе'}
                            </strong>
                          </span>
                          <span>·</span>
                          <span>Рекорд: {habit.bestStreak || habit.streak} дн.</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <footer className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Выбрано привычек: <strong>{selectedHabitIds.length}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActivePickerModal(null);
                    playChime('success');
                  }}
                  className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold transition cursor-pointer"
                >
                  Готово
                </button>
              </footer>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MODAL 4: @block PICKER MODAL */}
        {/* ------------------------------------------------------------------ */}
        {activePickerModal === 'block' && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs p-4 flex items-center justify-center animate-fade-in">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden text-gray-900 flex flex-col max-h-[80vh]">
              <header className="flex items-center justify-between p-4 border-b border-gray-100 bg-blue-50/50">
                <div className="flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-blue-700" />
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Интеграция с блоком графа (@block)</h3>
                    <p className="text-[11px] text-gray-500">Выберите блок для прикрепления карточки к посту</p>
                  </div>
                </div>
                <button type="button" onClick={() => setActivePickerModal(null)} className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {/* Option 1: Current active node */}
                {(() => {
                  const activeNode = nodes.find((n) => n.status === 'active') || nodes[0];
                  if (!activeNode) return null;
                  const isCurrent = !selectedCustomNodeId || selectedCustomNodeId === activeNode.id;
                  return (
                    <div
                      onClick={() => {
                        setSelectedCustomNodeId(activeNode.id);
                        setAttachCurrentNode(true);
                        playChime('click');
                      }}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition flex items-start space-x-3 ${
                        isCurrent && attachCurrentNode
                          ? 'border-blue-500 bg-blue-50/80 shadow-2xs'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        checked={isCurrent && attachCurrentNode}
                        readOnly
                        className="mt-1 accent-blue-600"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                            Текущий активный
                          </span>
                          <span className="text-[10px] text-gray-400">{activeNode.phaseTitle || 'Фаза курса'}</span>
                        </div>
                        <h4 className="font-bold text-xs text-gray-900 mt-1">{activeNode.title}</h4>
                        {activeNode.subtitle && (
                          <p className="text-[11px] text-gray-500 mt-0.5">{activeNode.subtitle}</p>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Other nodes */}
                <div className="pt-2 text-[10px] font-bold uppercase text-gray-400 px-1">
                  Все блоки программы
                </div>
                {nodes.slice(0, 15).map((node) => {
                  const isSelected = selectedCustomNodeId === node.id && attachCurrentNode;
                  return (
                    <div
                      key={`picker-node-${node.id}`}
                      onClick={() => {
                        setSelectedCustomNodeId(node.id);
                        setAttachCurrentNode(true);
                        playChime('click');
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition flex items-start space-x-3 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/80 shadow-2xs'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        checked={isSelected}
                        readOnly
                        className="mt-1 accent-blue-600"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-gray-900">{node.title}</h4>
                        <span className="text-[10px] text-gray-500">{node.phaseTitle || node.category || 'Блок'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <footer className="p-3 border-t border-gray-100 bg-gray-50 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setActivePickerModal(null);
                    playChime('success');
                  }}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer"
                >
                  Готово
                </button>
              </footer>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MODAL 5: @streak PICKER MODAL */}
        {/* ------------------------------------------------------------------ */}
        {activePickerModal === 'streak' && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs p-4 flex items-center justify-center animate-fade-in">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden text-gray-900 flex flex-col">
              <header className="flex items-center justify-between p-4 border-b border-gray-100 bg-emerald-50/50">
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Интеграция со стриком (@streak)</h3>
                    <p className="text-[11px] text-gray-500">Прикрепите метрику дисциплины и фокуса</p>
                  </div>
                </div>
                <button type="button" onClick={() => setActivePickerModal(null)} className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </header>

              <div className="p-4 space-y-2.5">
                {[
                  {
                    type: 'streak' as const,
                    label: 'Стрик обучения',
                    value: '14 дней подряд',
                    subtext: 'Ежедневная отработка инвариантов',
                  },
                  {
                    type: 'focus_time' as const,
                    label: 'Глубокий фокус',
                    value: '28 часов в потоке',
                    subtext: 'Без отвлечений и с барьером чистого листа',
                  },
                  {
                    type: 'knowledge_retention' as const,
                    label: 'Индекс удержания сути',
                    value: '94% точности',
                    subtext: 'По результатам слепых проверок Anti-Fluency',
                  },
                  {
                    type: 'exam_score' as const,
                    label: 'Тест чистого листа',
                    value: '96 / 100 баллов',
                    subtext: 'Успешная защита инвариантов перед ИИ',
                  },
                ].map((metric, idx) => (
                  <div
                    key={`metric-opt-${idx}`}
                    onClick={() => {
                      setAttachedMetric(metric);
                      setActivePickerModal(null);
                      playChime('success');
                    }}
                    className="p-3 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-[10px] uppercase font-bold text-emerald-800">{metric.label}</div>
                      <div className="font-bold text-sm text-gray-900">{metric.value}</div>
                      <div className="text-[10px] text-gray-500">{metric.subtext}</div>
                    </div>
                    <span className="text-xs text-emerald-600 font-semibold group-hover:translate-x-0.5 transition">
                      Прикрепить →
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MODAL 6: @project PICKER MODAL */}
        {/* ------------------------------------------------------------------ */}
        {activePickerModal === 'project' && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs p-4 flex items-center justify-center animate-fade-in">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden text-gray-900 flex flex-col">
              <header className="flex items-center justify-between p-4 border-b border-gray-100 bg-purple-50/50">
                <div className="flex items-center space-x-2">
                  <Code className="w-5 h-5 text-purple-600" />
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Интеграция с проектом / кодом (@project)</h3>
                    <p className="text-[11px] text-gray-500">Прикрепите фрагмент решения или файл артефакта</p>
                  </div>
                </div>
                <button type="button" onClick={() => setActivePickerModal(null)} className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </header>

              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Название решения</label>
                    <input
                      type="text"
                      value={customProjectTitle}
                      onChange={(e) => setCustomProjectTitle(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Имя файла</label>
                    <input
                      type="text"
                      value={customProjectFilename}
                      onChange={(e) => setCustomProjectFilename(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white font-mono focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Код / Сниппет</label>
                  <textarea
                    rows={6}
                    value={customProjectCode}
                    onChange={(e) => setCustomProjectCode(e.target.value)}
                    className="w-full p-3 text-xs font-mono rounded-lg border border-gray-200 bg-slate-950 text-slate-100 focus:outline-none focus:border-purple-400 leading-relaxed"
                  />
                </div>
              </div>

              <footer className="p-3 border-t border-gray-100 bg-gray-50 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setActivePickerModal(null)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAttachedProject({
                      title: customProjectTitle.trim() || 'Практический проект',
                      filename: customProjectFilename.trim() || 'solution.ts',
                      codeSnippet: customProjectCode,
                    });
                    setActivePickerModal(null);
                    playChime('success');
                  }}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition cursor-pointer"
                >
                  Прикрепить к посту
                </button>
              </footer>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MODAL 6: @mindmap PICKER MODAL */}
        {/* ------------------------------------------------------------------ */}
        {activePickerModal === 'mindmap' && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs p-4 flex items-center justify-center animate-fade-in">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden text-gray-900 flex flex-col">
              <header className="flex items-center justify-between p-4 border-b border-gray-100 bg-violet-50/50">
                <div className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-violet-600" />
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Интеллект-карта концептов (@mindmap)</h3>
                    <p className="text-[11px] text-gray-500">Прикрепите концептуальный граф инвариантов темы</p>
                  </div>
                </div>
                <button type="button" onClick={() => setActivePickerModal(null)} className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </header>

              <div className="p-4 space-y-3">
                <div className="p-3 bg-violet-50/60 rounded-xl border border-violet-200 space-y-2 text-xs">
                  <div className="font-bold text-violet-900">Тема: {nodes.find((n) => n.status === 'active')?.title || 'Архитектура и инварианты'}</div>
                  <div className="text-gray-600 italic">
                    «Декомпозиция на неизменяемые ядра, строгие гарантии согласованности и чистые контракты»
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {['ACID инварианты', 'Векторные часы', 'Идемпотентный retry', 'CAP компромиссы', 'Graceful Degradation'].map((concept, idx) => (
                      <span key={`mm-sample-${idx}`} className="px-2 py-0.5 rounded-md bg-white border border-violet-200 text-[11px] font-medium text-violet-800">
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <footer className="p-3 border-t border-gray-100 bg-gray-50 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setActivePickerModal(null)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleAttachMindmapDirectly();
                    setActivePickerModal(null);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition cursor-pointer"
                >
                  Прикрепить к посту
                </button>
              </footer>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MODAL 7: @quiz PICKER MODAL */}
        {/* ------------------------------------------------------------------ */}
        {activePickerModal === 'quiz' && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs p-4 flex items-center justify-center animate-fade-in">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden text-gray-900 flex flex-col">
              <header className="flex items-center justify-between p-4 border-b border-gray-100 bg-teal-50/50">
                <div className="flex items-center space-x-2">
                  <HelpCircle className="w-5 h-5 text-teal-600" />
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Вопрос самопроверки сообщества (@quiz)</h3>
                    <p className="text-[11px] text-gray-500">Прикрепите интерактивный проверочный вопрос с ответом</p>
                  </div>
                </div>
                <button type="button" onClick={() => setActivePickerModal(null)} className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </header>

              <div className="p-4 space-y-3">
                <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200 space-y-2 text-xs">
                  <div className="font-bold text-teal-900">Вопрос:</div>
                  <p className="text-gray-800">
                    Какой ключевой компромисс возникает при обеспечении строгой согласованности (Linearizability) в распределенной среде?
                  </p>
                  <div className="text-[11px] text-teal-700 bg-white p-2 rounded border border-teal-100">
                    💡 Подсказка: Вспомните теорему CAP и задержки консенсуса.
                  </div>
                </div>
              </div>

              <footer className="p-3 border-t border-gray-100 bg-gray-50 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setActivePickerModal(null)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleAttachQuizDirectly();
                    setActivePickerModal(null);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition cursor-pointer"
                >
                  Прикрепить к посту
                </button>
              </footer>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: COMMUNITY ROOMS LIST & SEARCH
  // -------------------------------------------------------------
  return (
    <div className="w-full min-h-full flex flex-col space-y-6 bg-white text-gray-900 font-sans select-text pb-20">
      {/* 1. TOP HEADER & SEARCH & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Комнаты обучения & Комьюнити</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Пространства для совместной практики на доске и общий чат сообщества с синхронизацией в реальном времени.
          </p>
        </div>

        {/* View Switcher: Rooms vs General Chat */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center p-1 bg-gray-100 rounded-xl border border-gray-200">
            <button
              type="button"
              onClick={() => {
                setHubTab('rooms');
                playChime('click');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
                hubTab === 'rooms'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Комнаты</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setHubTab('general_chat');
                playChime('click');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
                hubTab === 'general_chat'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>Общий чат сообщества</span>
            </button>
          </div>

          {/* Create Room Button */}
          <button
            type="button"
            onClick={() => {
              setIsCreateModalOpen(true);
              playChime('click');
            }}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Создать комнату</span>
          </button>
        </div>
      </div>

      {hubTab === 'general_chat' ? (
        <div className="w-full h-[660px] rounded-2xl border border-gray-200 shadow-xs overflow-hidden bg-white">
          <RoomChatTab
            room={{
              id: 'community_general',
              name: 'Общий чат сообщества',
              category: 'Все темы & Направления',
              description: 'Единый открытый чат сообщества LearningOS',
              tags: ['Комьюнити', 'Обсуждения'],
              isPrivate: false,
              creatorId: 'system',
              creatorName: 'Платформа',
              createdAt: new Date().toISOString(),
              memberCount: 42,
              maxMembers: 500,
            }}
            defaultChannel="general"
            currentUser={currentUser}
            nodes={nodes}
            onSelectUnit={onSelectUnit}
          />
        </div>
      ) : (
        <>
          {/* Search bar & Refresh */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск комнат по названию, теме или тегам..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 py-2 text-xs rounded-xl bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-blue-500 focus:outline-hidden w-full transition text-gray-900"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={loadRooms}
              title="Обновить список"
              className="p-2 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition cursor-pointer border border-gray-200 self-end sm:self-auto shrink-0 flex items-center space-x-1.5 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Обновить</span>
            </button>
          </div>

          {/* 2. CATEGORIES FILTER BAR */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {dynamicCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  playChime('click');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
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
              <p className="text-xs text-gray-500">Загрузка комнат сообщества...</p>
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
                const isOwner = room.creatorId === myUserId;
                return (
                  <div
                    key={room.id}
                    className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between p-5 shadow-2xs hover:shadow-md ${
                      isCurrentActive ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Badges & Actions */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-3 min-w-0">
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
                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <h3 className="font-bold text-sm text-gray-900 leading-snug truncate" title={room.name}>
                                {room.name}
                              </h3>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                              <span className="truncate">{room.category}</span>
                              {isOwner && (
                                <>
                                  <span className="text-gray-300">·</span>
                                  <span className="text-blue-600 font-semibold shrink-0">Ваша</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          {room.isPrivate ? (
                            <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              <Lock className="w-3 h-3 text-amber-600" />
                              <span>PIN</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <Unlock className="w-3 h-3 text-emerald-600" />
                              <span>Открытая</span>
                            </span>
                          )}

                          {isOwner && (
                            <div className="flex items-center pl-1">
                              <button
                                type="button"
                                onClick={() => handleOpenRoomManagement(room)}
                                className="p-1 text-gray-400 hover:text-blue-600 rounded-md hover:bg-gray-100 cursor-pointer"
                                title="Настройки комнаты"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRoom(room.id)}
                                className="p-1 text-gray-400 hover:text-rose-600 rounded-md hover:bg-gray-100 cursor-pointer"
                                title="Удалить комнату"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                        {room.description}
                      </p>

                      {/* Active Topic */}
                      {room.activeTopic && (
                        <div className="p-2 rounded-xl bg-gray-50 border border-gray-100 flex items-start space-x-2 text-[11px] text-gray-700">
                          <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-1"><strong className="font-semibold text-gray-800">Тема:</strong> {room.activeTopic}</span>
                        </div>
                      )}

                      {/* Tags */}
                      {room.tags && room.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {room.tags.slice(0, 3).map((t, idx) => (
                            <span key={idx} className="text-[10px] text-gray-500 font-medium">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer: Member count & Clean Action buttons */}
                    <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5 text-xs text-gray-500 font-medium">
                        <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{room.memberCount || 1} / {room.maxMembers || 50}</span>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenFeed(room)}
                          className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition cursor-pointer flex items-center space-x-1"
                          title="Учебная лента записей (открыта для всех)"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
                          <span className="hidden sm:inline">Лента</span>
                          {room.feedPosts?.length ? <span className="text-[10px] text-gray-400">({room.feedPosts.length})</span> : null}
                        </button>

                        {room.isPrivate ? (
                          <button
                            type="button"
                            onClick={() => handleOpenPrivatePin(room)}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Войти по PIN</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleJoinPublicRoom(room)}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-xs"
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
        </>
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
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
