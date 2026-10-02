import React, { useState, useEffect } from 'react';
import { LearningTopBar } from './components/learning/LearningTopBar.tsx';
import { LearningRightDock } from './components/learning/LearningRightDock.tsx';
import { LearningCreateNodeModal } from './components/learning/LearningCreateNodeModal.tsx';
import { LearningVideoCallModal } from './components/learning/LearningVideoCallModal.tsx';
import { SpotlightModal } from './components/os/SpotlightModal.tsx';
import { PeerCursorOverlay } from './components/collab/PeerCursorOverlay.tsx';
import { peerCollabSync } from './services/peerCollabSync.ts';

// Core Learning Windows
import { DagGraphWindow } from './components/windows/DagGraphWindow.tsx';
import { KnowledgeSphereWindow } from './components/windows/KnowledgeSphereWindow.tsx';
import { FocusStudioWindow } from './components/windows/FocusStudioWindow.tsx';
import { PeerCollabWindow } from './components/windows/PeerCollabWindow.tsx';
import { AiOperatorWindow } from './components/windows/AiOperatorWindow.tsx';
import { PortfolioWindow } from './components/windows/PortfolioWindow.tsx';
import { PublicPortfolioPage } from './components/windows/PublicPortfolioPage.tsx';
import { WidgetsWindow } from './components/windows/WidgetsWindow.tsx';
import { PartnerSearchWindow } from './components/windows/PartnerSearchWindow.tsx';
import { AdminConsoleWindow } from './components/windows/AdminConsoleWindow.tsx';
import { WhiteScreenWindow } from './components/windows/WhiteScreenWindow.tsx';
import { CalendarWindow } from './components/windows/CalendarWindow.tsx';
import { KnowledgeGitWindow } from './components/windows/KnowledgeGitWindow.tsx';
import { TextbookLibraryWindow } from './components/windows/TextbookLibraryWindow.tsx';
import { KeyboardShortcutsWindow } from './components/windows/KeyboardShortcutsWindow.tsx';
import { GoogleAuthModal } from './components/auth/GoogleAuthModal.tsx';
import { OsSetupAssistant } from './components/auth/OsSetupAssistant.tsx';
import { BitrixStyleLanding } from './components/landing/BitrixStyleLanding.tsx';
import { SessionWelcomeSplash } from './components/os/SessionWelcomeSplash.tsx';
import { DesktopWorkspace } from './components/os/DesktopWorkspace.tsx';
import { MobileAppLayout } from './components/mobile/MobileAppLayout.tsx';
import { WallpaperGalleryModal } from './components/os/WallpaperGalleryModal.tsx';
import { SystemLockScreenModal } from './components/os/SystemLockScreenModal.tsx';
import { FullScreenAppHeader } from './components/os/FullScreenAppHeader.tsx';
import { PersistentBottomDock } from './components/os/PersistentBottomDock.tsx';
import { useIdleLockScreen } from './hooks/useIdleLockScreen.ts';
import { GlobalWallpaperConfig, DEFAULT_WALLPAPER_CONFIG } from './types/wallpaper.ts';
import { loadWallpaperConfig, saveWallpaperConfig, getWallpaperCssBackground } from './services/wallpaperGallery.ts';

// Data & Types
import { 
  INITIAL_DAG_NODES, 
  INITIAL_DAG_EDGES, 
  LEARNING_UNITS, 
  INITIAL_ADMIN_UNITS, 
  INITIAL_ADMIN_MATERIALS
} from './data/initialData.ts';
import { 
  DAGNode, 
  DAGEdge, 
  LearningUnit, 
  UserArtifact, 
  NoteItem, 
  TaskItem, 
  HabitItem, 
  AdminUnitRow, 
  PeerPartner,
  AdminMaterial,
  ProfileNodeSnapshot
} from './types.ts';
import { playChime } from './utils/audio.ts';
import { firestoreSync, SyncStatus } from './services/firestoreSync.ts';
import { loginAsGuest } from './firebase.ts';
import { spacedRepetition } from './services/spacedRepetitionService.ts';
import { epistemicLedgerService } from './services/epistemicLedgerService.ts';
import { SpacedRepetitionModal } from './components/learning/SpacedRepetitionModal.tsx';
import { 
  ProjectCadenceSettings, 
  loadCadenceSettings, 
  saveCadenceSettings, 
  recordLessonCompletion, 
  recordProjectInjected, 
  CADENCE_CONFIGS 
} from './services/cadenceController.ts';
import { normalizeDagLayout } from './utils/dagLayout.ts';
import { socialProfileService } from './services/socialProfileService.ts';
import { isShortcutCaptureActive, keyboardEventToShortcut, loadKeyboardShortcuts, SHORTCUT_DEFINITIONS } from './services/keyboardShortcuts.ts';

export default function App() {
  const portfolioUid = new URLSearchParams(window.location.search).get('portfolio')?.trim();
  return portfolioUid ? <PublicPortfolioPage uid={portfolioUid} /> : <LearningOSApp />;
}

function LearningOSApp() {
  // 1. Main Navigation State
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const hasCompleted = localStorage.getItem('learning_os_survey_completed');
      const hasPersonalized = localStorage.getItem('learning_os_personalized');
      if (hasCompleted || hasPersonalized) {
        return 'desktop';
      }
    } catch (e) {
      console.warn('Error checking survey status:', e);
    }
    return 'desktop';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [wallpaperTheme, setWallpaperTheme] = useState<'bitrix_flora' | 'studio_slate'>('bitrix_flora');
  const [wallpaperConfig, setWallpaperConfig] = useState<GlobalWallpaperConfig>(() => loadWallpaperConfig());
  const [isWallpaperGalleryOpen, setIsWallpaperGalleryOpen] = useState(false);
  const [isCollabCursorsEnabled, setIsCollabCursorsEnabled] = useState<boolean>(true);

  // 5-minute Idle & Inactive Tab Lock Screen ("черное окно с временем и войти в систему")
  const { isLocked, lock, unlock } = useIdleLockScreen({
    timeoutMs: 5 * 60 * 1000, // 5 minutes of inactive tab or mouse
    onLock: () => {
      playChime('alert');
    },
    onUnlock: () => {
      showNotification('Сеанс успешно возобновлен', 'info');
    },
  });

  const handleUpdateWallpaperConfig = (newConfig: GlobalWallpaperConfig) => {
    setWallpaperConfig(newConfig);
    saveWallpaperConfig(newConfig);
    showNotification(
      newConfig.applyEverywhere
        ? 'Обои установлены фоном везде в системе'
        : 'Обои установлены (только рабочий стол)',
      'info'
    );
  };

  const handleSelectTab = (tab: string) => {
    setActiveTab(tab);
  };

  const handleSelectUnit = (unitId: string) => {
    setActiveUnitId(unitId);
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const handleToggleHabit = (id: string) => {
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id
          ? { ...h, completedToday: !h.completedToday, streak: h.completedToday ? Math.max(0, h.streak - 1) : h.streak + 1 }
          : h
      )
    );
  };

  // 2. Educational Core State (DAG Nodes, Edges, Units, Artifacts)
  const [activeUnitId, setActiveUnitId] = useState<string>('unit-1');
  const [chatPrefillPrompt, setChatPrefillPrompt] = useState<string>('');
  const [nodes, setNodes] = useState<DAGNode[]>(() => {
    try {
      const saved = localStorage.getItem('learning_os_dag_nodes_v3');
      const savedEdges = localStorage.getItem('learning_os_dag_edges_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        const parsedEdges = savedEdges ? JSON.parse(savedEdges) : [];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = normalizeDagLayout(parsed, Array.isArray(parsedEdges) ? parsedEdges : []);
          return normalized.nodes;
        }
      }
    } catch (e) {
      console.warn('Error reading stored dag nodes:', e);
    }
    return INITIAL_DAG_NODES;
  });

  const [edges, setEdges] = useState<DAGEdge[]>(() => {
    try {
      const saved = localStorage.getItem('learning_os_dag_nodes_v3');
      const savedEdges = localStorage.getItem('learning_os_dag_edges_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        const parsedEdges = savedEdges ? JSON.parse(savedEdges) : [];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = normalizeDagLayout(parsed, Array.isArray(parsedEdges) ? parsedEdges : []);
          return normalized.edges;
        }
      }
    } catch (e) {
      console.warn('Error reading stored dag edges:', e);
    }
    return INITIAL_DAG_EDGES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('learning_os_dag_nodes_v3', JSON.stringify(nodes));
      localStorage.setItem('learning_os_dag_edges_v3', JSON.stringify(edges));
    } catch (e) {
      console.warn('Error saving dag nodes/edges:', e);
    }
  }, [nodes, edges]);

  const [units, setUnits] = useState<Record<string, LearningUnit>>(() => {
    try {
      const saved = localStorage.getItem('learning_os_custom_units_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...LEARNING_UNITS, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Error reading stored units:', e);
    }
    return LEARNING_UNITS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('learning_os_custom_units_v2', JSON.stringify(units));
    } catch (e) {
      console.warn('Error saving units to localStorage:', e);
    }
  }, [units]);

  const [artifacts, setArtifacts] = useState<UserArtifact[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [adminUnits, setAdminUnits] = useState<AdminUnitRow[]>(INITIAL_ADMIN_UNITS);

  // Cadence of AI real-world projects ("давай такие адачи часто но не слишком")
  const [cadenceSettings, setCadenceSettings] = useState<ProjectCadenceSettings>(() => loadCadenceSettings());
  const [isInjectingProject, setIsInjectingProject] = useState(false);

  // Auth state - Mandatory Google / Demo Login
  const [currentUser, setCurrentUser] = useState<{
    uid: string;
    displayName: string;
    email: string;
    photoURL?: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('learning_os_auth_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading saved user:', e);
    }
    return null;
  });

  // User Personalization State ("Давай персонализируем")
  const [isPersonalized, setIsPersonalized] = useState<boolean>(() => {
    try {
      return localStorage.getItem('learning_os_personalized') === 'true';
    } catch {
      return false;
    }
  });

  // Bitrix24-style Front Landing Page at the beginning of the journey ("сделай на начале всего пути лендинг в стиле битрикса 34")
  const [showLanding, setShowLanding] = useState<boolean>(() => {
    try {
      const savedUser = localStorage.getItem('learning_os_auth_user');
      const savedPersonalized = localStorage.getItem('learning_os_personalized');
      // If user has not personalized yet, start with the Bitrix-style landing page
      return !(savedUser && savedPersonalized === 'true');
    } catch {
      return true;
    }
  });

  // White Session Welcome Splash on new tab opening
  const [showSessionSplash, setShowSessionSplash] = useState<boolean>(false);

  // Mobile classic blocks layout mode ("сделай интерфейс для мобиок но в мобилках не кнцепция веб ос а просто блоки так скаать кароче класика ебмоб приложений")
  const [isMobileMode, setIsMobileMode] = useState<boolean>(() => {
    try {
      const explicit = localStorage.getItem('learning_os_mobile_mode');
      if (explicit !== null) return explicit === 'true';
      return typeof window !== 'undefined' && window.innerWidth < 768;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleResize = () => {
      try {
        const explicit = localStorage.getItem('learning_os_mobile_mode');
        if (explicit === null && typeof window !== 'undefined') {
          setIsMobileMode(window.innerWidth < 768);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleMobileMode = (val?: boolean) => {
    const next = typeof val === 'boolean' ? val : !isMobileMode;
    setIsMobileMode(next);
    try {
      localStorage.setItem('learning_os_mobile_mode', String(next));
    } catch (e) {
      console.warn('Failed to save mobile mode:', e);
    }
  };

  // Admin Materials for Store & AI Practice Compiler
  const [materials, setMaterials] = useState<AdminMaterial[]>(() => {
    try {
      const saved = localStorage.getItem('learning_os_admin_materials');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((p: any) => p.id));
          const merged = [...parsed];
          for (const initMat of INITIAL_ADMIN_MATERIALS) {
            if (!existingIds.has(initMat.id)) {
              merged.push(initMat);
            }
          }
          return merged;
        }
      }
    } catch (e) {
      console.warn('Error reading stored admin materials:', e);
    }
    return INITIAL_ADMIN_MATERIALS;
  });

  const [highlightedStoreMaterialId, setHighlightedStoreMaterialId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('learning_os_admin_materials', JSON.stringify(materials));
    } catch (e) {
      console.warn('Error saving admin materials:', e);
    }
  }, [materials]);

  // 3. Student Karma & Pomodoro Focus Timer
  const [karma, setKarma] = useState<number>(0);
  const [pomodoroMinutes, setPomodoroMinutes] = useState<number>(25);
  const [pomodoroSecondsLeft, setPomodoroSecondsLeft] = useState<number>(25 * 60);
  const [isPomodoroRunning, setIsPomodoroRunning] = useState<boolean>(false);

  // 4. P2P Collaboration & Buddy Match
  const [isSearchingBuddy, setIsSearchingBuddy] = useState<boolean>(false);
  const [partner, setPartner] = useState<PeerPartner | null>(null);
  const [peerInitialTab, setPeerInitialTab] = useState<'workspace' | 'video' | 'whiteboard' | 'notes'>('workspace');

  const handlePartnerMatched = (p: PeerPartner) => {
    const safePartner: PeerPartner = {
      ...p,
      name: p?.name || 'Напарник',
    };
    setPartner(safePartner);
    const roomCode = safePartner.roomCode || safePartner.id;
    sessionStorage.setItem('learning_os_peer_session_id', roomCode);
    peerCollabSync.setRoomId(roomCode);
    showNotification(`Напарник подключен: ${safePartner.name}`, 'success');
  };

  const handleDisconnectPartner = () => {
    setPartner(null);
    peerCollabSync.leaveRoom();
    sessionStorage.removeItem('learning_os_peer_session_id');
    showNotification('Напарник отключен', 'info');
  };

  // URL query parameter check for shared room link (e.g. ?room=OS-1234)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const roomParam = urlParams.get('room');
      if (roomParam && roomParam.trim()) {
        setActiveTab('partner_search');
      }
    } catch {}
  }, []);

  // Auto-connect when a peer is discovered via SSE / BroadcastChannel
  useEffect(() => {
    const unsub = peerCollabSync.subscribePartnerJoined((p) => {
      const safePartner: PeerPartner = {
        ...p,
        name: p?.name || 'Напарник',
      };
      setPartner((current) => {
        if (!current || current.id !== safePartner.id) {
          showNotification(`Напарник на связи: ${safePartner.name}`, 'success');
          return safePartner;
        }
        return current;
      });
    });
    return unsub;
  }, []);

  // Shared team actions synchronization (tab switching, unit selection, task/habit toggles, pomodoro)
  useEffect(() => {
    const unsub = peerCollabSync.subscribeActions((action) => {
      if (action.actionType === 'tab_change') {
        const roomId = peerCollabSync.getRoomId();
        if (!roomId || roomId === 'team_workspace') return;
        const nextTab = (action.payload?.tab || action.payload?.tabId) as string;
        if (nextTab && nextTab !== activeTab) {
          setActiveTab(nextTab);
          const tabNames: Record<string, string> = {
            desktop: 'Рабочий стол',
            dag: 'DAG-Граф Знаний',
            focus: 'Фокус-Студия',
            calendar: 'Календарь',
            peer: 'P2P Коллаборация',
            chat: 'ИИ-Оператор',
            admin: 'Модерация',
            portfolio: 'Портфолио',
            widgets: 'Виджеты',
            white_screen: 'Белый экран',
            partner_search: 'Поиск напарника',
          };
          showNotification(`Командный переход: ${tabNames[nextTab] || nextTab}`, 'info');
        }
      } else if (action.actionType === 'unit_select') {
        const nextUnitId = action.payload?.unitId;
        if (nextUnitId && nextUnitId !== activeUnitId) {
          setActiveUnitId(nextUnitId);
          showNotification(`Тема синхронизирована: ${units[nextUnitId]?.title || nextUnitId}`, 'info');
        }
      } else if (action.actionType === 'task_toggle') {
        const taskId = action.payload?.taskId;
        if (taskId) {
          setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t))
          );
        }
      } else if (action.actionType === 'habit_toggle') {
        const habitId = action.payload?.habitId;
        if (habitId) {
          setHabits((prev) =>
            prev.map((h) =>
              h.id === habitId
                ? { ...h, completedToday: !h.completedToday, streak: h.completedToday ? Math.max(0, h.streak - 1) : h.streak + 1 }
                : h
            )
          );
        }
      } else if (action.actionType === 'pomodoro_toggle') {
        const { isRunning, secondsLeft } = action.payload || {};
        if (typeof isRunning === 'boolean') {
          setIsPomodoroRunning(isRunning);
          if (typeof secondsLeft === 'number') {
            setPomodoroSecondsLeft(secondsLeft);
          }
          showNotification(isRunning ? 'Команда: таймер фокуса запущен' : 'Команда: таймер на паузе', 'info');
        }
      } else if (action.actionType === 'pomodoro_reset') {
        const { minutes } = action.payload || {};
        setIsPomodoroRunning(false);
        const mins = minutes || pomodoroMinutes;
        setPomodoroSecondsLeft(mins * 60);
        showNotification('Команда: таймер фокуса сброшен', 'info');
      }
    });

    return unsub;
  }, [activeTab, activeUnitId, units, pomodoroMinutes]);

  // 5. Modals State
  const [isCreateNodeOpen, setIsCreateNodeOpen] = useState(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [isBlitzModalOpen, setIsBlitzModalOpen] = useState(false);
  const [blitzTargetNodeId, setBlitzTargetNodeId] = useState<string | null>(null);

  const handleOpenBlitzModal = (nodeId?: string) => {
    setBlitzTargetNodeId(nodeId || null);
    setIsBlitzModalOpen(true);
  };

  const [callPartnerModal, setCallPartnerModal] = useState<{
    isOpen: boolean;
    partner: { name: string; avatar?: string; role: string; pairTask?: any } | null;
  }>({
    isOpen: false,
    partner: null,
  });

  // 6. Toast Notification Banner
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'warn' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' | 'warn' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // 7. Firestore Cloud Sync Status & Subscription
  const [firestoreSyncStatus, setFirestoreSyncStatus] = useState<SyncStatus>('synced');
  const [lastFirestoreSyncTime, setLastFirestoreSyncTime] = useState<Date | null>(new Date());

  useEffect(() => {
    const unsub = firestoreSync.subscribeStatus((status, time) => {
      setFirestoreSyncStatus(status);
      if (time) setLastFirestoreSyncTime(time);
    });
    return unsub;
  }, []);

  // Initial load from Firestore when currentUser changes
  useEffect(() => {
    if (!currentUser?.uid) return;
    let isCancelled = false;

    async function loadCloudData() {
      try {
        const cloudData = await firestoreSync.loadUserData(currentUser!.uid);
        if (isCancelled || !cloudData) return;

        if (cloudData.nodes && cloudData.nodes.length > 0) setNodes(cloudData.nodes);
        if (cloudData.edges && cloudData.edges.length > 0) setEdges(cloudData.edges);
        if (cloudData.activeUnitId) setActiveUnitId(cloudData.activeUnitId);
        if (typeof cloudData.karma === 'number') setKarma(cloudData.karma);
        if (cloudData.notes && cloudData.notes.length > 0) setNotes(cloudData.notes);
        if (cloudData.tasks && cloudData.tasks.length > 0) setTasks(cloudData.tasks);
        if (cloudData.habits && cloudData.habits.length > 0) setHabits(cloudData.habits);
        if (cloudData.artifacts && cloudData.artifacts.length > 0) setArtifacts(cloudData.artifacts);
        if (cloudData.materials && cloudData.materials.length > 0) setMaterials(cloudData.materials);
        if (cloudData.units && Object.keys(cloudData.units).length > 0) {
          setUnits((prev) => ({ ...prev, ...cloudData.units }));
        }
      } catch (err) {
        console.warn('Initial cloud load error:', err);
      }
    }

    loadCloudData();

    return () => {
      isCancelled = true;
    };
  }, [currentUser?.uid]);

  // Sync Learning Path to Firestore
  useEffect(() => {
    if (currentUser?.uid) {
      firestoreSync.syncLearningPath(currentUser.uid, nodes, edges, activeUnitId);
    }
  }, [nodes, edges, activeUnitId, currentUser?.uid]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const activeNodes = nodes.filter((node) => node.status === 'active');
    const completedCount = nodes.filter((node) => node.status === 'completed').length;
    const ringProgress = nodes.length > 0 ? Math.round((completedCount / nodes.length) * 100) : 0;
    socialProfileService.publishIdentity({
      uid: currentUser.uid,
      displayName: currentUser.displayName || 'Студент',
      avatar: currentUser.photoURL,
    }).catch((error) => console.warn('Public profile identity sync failed:', error));
    socialProfileService.syncLearningSnapshot(currentUser.uid, {
      currentNodeIds: activeNodes.map((node) => node.id),
      currentNodes: activeNodes.map((node): ProfileNodeSnapshot => ({
        nodeId: node.id,
        title: node.title,
        subtitle: node.subtitle,
        unitId: node.unitId,
        category: units[node.unitId]?.category,
        summaryMarkdown: units[node.unitId]?.summaryMarkdown?.slice(0, 2500),
      })),
      ringProgress,
      status: isPomodoroRunning ? 'focus' : 'idle',
    }).catch((error) => console.warn('Public learning profile sync failed:', error));
  }, [nodes, units, isPomodoroRunning, currentUser?.uid, currentUser?.displayName, currentUser?.photoURL]);

  // Sync User Profile (karma, notes, tasks, habits) to Firestore
  useEffect(() => {
    if (currentUser?.uid) {
      firestoreSync.syncUserProfile(currentUser.uid, {
        karma,
        notes,
        tasks,
        habits,
        displayName: currentUser.displayName,
        email: currentUser.email,
      });
    }
  }, [karma, notes, tasks, habits, currentUser?.uid, currentUser?.displayName, currentUser?.email]);

  // Pomodoro Interval Ticker (Smooth per-second countdown)
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPomodoroRunning) {
      timer = setInterval(() => {
        setPomodoroSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsPomodoroRunning(false);
            playChime('pomodoro');
            setKarma((k) => k + 500);
            showNotification('Помодоро-сессия завершена! +500 XP начислено', 'success');
            return pomodoroMinutes * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPomodoroRunning, pomodoroMinutes]);

  const handleTogglePomodoro = (broadcast = true) => {
    setIsPomodoroRunning((prev) => {
      const next = !prev;
      if (broadcast) {
        peerCollabSync.broadcastAction('pomodoro_toggle', { isRunning: next, secondsLeft: pomodoroSecondsLeft });
      }
      return next;
    });
    playChime('click');
  };

  const handleResetPomodoro = (broadcast = true) => {
    setIsPomodoroRunning(false);
    const secs = pomodoroMinutes * 60;
    setPomodoroSecondsLeft(secs);
    if (broadcast) {
      peerCollabSync.broadcastAction('pomodoro_reset', { minutes: pomodoroMinutes });
    }
    playChime('click');
  };

  const handleSetPomodoroMinutes = (mins: number) => {
    setPomodoroMinutes(mins);
    setPomodoroSecondsLeft(mins * 60);
    playChime('click');
  };

  const handleUpdateUnit = (updated: LearningUnit) => {
    setUnits((prev) => ({
      ...prev,
      [updated.id]: updated,
    }));
    if (currentUser?.uid) {
      firestoreSync.saveLearningUnit(updated, currentUser.uid);
    }
    showNotification(`Модуль «${updated.title}» обновлен`, 'info');
  };

  // Global, user-configurable keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isShortcutCaptureActive()) return;
      const shortcut = keyboardEventToShortcut(e);
      if (!shortcut) return;
      const target = e.target as HTMLElement | null;
      const isEditing = Boolean(target?.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]'));
      const action = SHORTCUT_DEFINITIONS.find((definition) => loadKeyboardShortcuts()[definition.id] === shortcut);
      if (!action || (isEditing && action.id !== 'spotlight')) return;
      e.preventDefault();
      if (action.id === 'spotlight') {
        setIsSpotlightOpen((prev) => !prev);
      } else if (action.windowId) {
        window.dispatchEvent(new CustomEvent('learning_open_window', { detail: { windowId: action.windowId } }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreateNode = (newNode: DAGNode) => {
    setNodes((prev) => [...prev, newNode]);
    showNotification(`Тема «${newNode.title}» добавлена в DAG-Граф!`, 'success');
  };

  const handleAdoptProfileNode = (snapshot: ProfileNodeSnapshot) => {
    const newUnitId = `unit-peer-${Date.now()}`;
    const newNodeId = `node-peer-${Date.now()}`;
    const category = snapshot.category || 'Совместная практика';
    const summaryMarkdown = snapshot.summaryMarkdown || `### ${snapshot.title}\n\n${snapshot.subtitle || 'Учебный узел, которым поделился напарник.'}`;
    const newUnit: LearningUnit = {
      id: newUnitId,
      title: snapshot.title,
      category,
      durationSec: 30 * 60,
      videoUrl: '',
      authorName: 'Профиль напарника',
      viewsCount: 0,
      retentionRate: 0,
      passRate: 0,
      summaryMarkdown,
      quiz: [],
      projectTask: {
        title: `Практика: ${snapshot.title}`,
        role: 'Учащийся',
        description: snapshot.subtitle || `Разберите и примените узел «${snapshot.title}».`,
        requirements: [],
        starterCode: '',
        defaultFilename: 'practice.md',
      },
    };
    const maxX = nodes.reduce((max, node) => Math.max(max, node.x), 0);
    const newNode: DAGNode = {
      id: newNodeId,
      title: snapshot.title,
      subtitle: snapshot.subtitle || 'Узел, добавленный из профиля напарника',
      phase: 1,
      phaseTitle: 'Добавлено из профиля напарника',
      sprint: 'Совместная практика',
      type: 'practice',
      status: 'active',
      x: maxX + 360,
      y: 180,
      dependencies: [],
      unitId: newUnitId,
      estimatedTimeMin: 30,
      authorName: 'Напарник',
    };

    setUnits((previous) => ({ ...previous, [newUnitId]: newUnit }));
    setNodes((previous) => [...previous, newNode]);
    setActiveUnitId(newUnitId);
    if (currentUser?.uid) firestoreSync.saveLearningUnit(newUnit, currentUser.uid);
    showNotification(`Узел «${snapshot.title}» добавлен в ваш учебный граф`, 'success');
    playChime('success');
  };

  const handleLaunchUnit = (unitId: string, broadcast = true) => {
    setActiveUnitId(unitId);
    setActiveTab('desktop');
    if (broadcast) {
      peerCollabSync.broadcastAction('tab_change', { tab: 'desktop' });
      peerCollabSync.broadcastAction('unit_select', { unitId });
    }
    window.dispatchEvent(
      new CustomEvent('learning_launch_module_window', { detail: { unitId } })
    );
    playChime('success');
    showNotification(`Модуль запущен как окно на рабочем столе`, 'info');
  };

  const handleStartCall = (targetPartner: { name: string; avatar?: string; role: string }) => {
    setCallPartnerModal({
      isOpen: true,
      partner: targetPartner,
    });
    playChime('ring');
  };

  const handleSaveArtifact = (art: UserArtifact) => {
    setArtifacts((prev) => [art, ...prev]);
    if (currentUser?.uid) {
      firestoreSync.saveArtifact(currentUser.uid, art);
    }
    // Automatically crystallize completed artifact into Epistemic Ledger and Knowledge Sphere
    epistemicLedgerService.recordCompletedUnit({
      id: art.id,
      title: `Артефакт: ${art.filename}`,
      category: art.unitTitle || 'Практический артефакт',
      summaryMarkdown: art.fileContent,
      score: art.score,
    });
    showNotification(`Артефакт «${art.filename}» сохранен в портфолио и зафиксирован в Сфере Знаний`, 'success');
  };

  // Unit completion inside Focus Studio or DiagnosticSurveyWindow
  const handleLessonCompleted = (
    unitId: string,
    performance?: { totalCorrect?: number; totalQuestions?: number; score?: number }
  ) => {
    const completedNodeBeforeUpdate = nodes.find((n) => n.unitId === unitId || n.id === unitId);
    const requiredPassingScore = completedNodeBeforeUpdate?.passingScore ?? 70;
    const computedScore = typeof performance?.score === 'number'
      ? performance.score
      : (typeof performance?.totalCorrect === 'number' && typeof performance?.totalQuestions === 'number' && performance.totalQuestions > 0)
        ? Math.round((performance.totalCorrect / performance.totalQuestions) * 100)
        : 100;

    if (
      !completedNodeBeforeUpdate ||
      completedNodeBeforeUpdate.status === 'completed' ||
      computedScore < requiredPassingScore
    ) {
      if (computedScore < requiredPassingScore) {
        showNotification(`Зачёт не подтвержден: получено ${computedScore}%, требуется не менее ${requiredPassingScore}%.`, 'warn');
      }
      return;
    }

    playChime('success');
    const xpBonus = 3500;
    setKarma((prev) => prev + xpBonus);
    showNotification(`Урок успешно завершен! +${xpBonus} XP начислено в портфолио`, 'success');

    // Automatically mark the node completed in DAG graph and unlock downstream dependent nodes
    setNodes((prev) => {
      const updatedNodes = prev.map((n) =>
        n.unitId === unitId || n.id === unitId ? { ...n, status: 'completed' as const } : n
      );
      const completedNode = updatedNodes.find((n) => n.unitId === unitId || n.id === unitId);
      if (!completedNode) return updatedNodes;

      // Find all downstream nodes connected from completedNode in DAG edges
      const outgoingEdges = edges.filter((e) => e.from === completedNode.id);
      const downstreamNodeIds = outgoingEdges.map((e) => e.to);

      let unlockedCount = 0;
      const finalNodes = updatedNodes.map((n) => {
        if (downstreamNodeIds.includes(n.id) && (n.status === 'locked' || n.status === 'stuck_injected')) {
          // Check if all prerequisite incoming edges are satisfied (or non-alternate dependencies)
          const incomingEdges = edges.filter((e) => e.to === n.id && !e.isAlternate);
          const allPrereqsDone = incomingEdges.length === 0 || incomingEdges.every((edge) => {
            const prereqNode = updatedNodes.find((pn) => pn.id === edge.from);
            return prereqNode && prereqNode.status === 'completed';
          });
          if (allPrereqsDone) {
            unlockedCount++;
            return { ...n, status: 'active' as const };
          }
        }
        return n;
      });

      if (unlockedCount > 0) {
        setTimeout(() => {
          showNotification(`🔓 Открыт следующий модуль в графе обучения!`, 'info');
        }, 1200);
      }

      return finalNodes;
    });

    // 1. Automatically crystallize completed unit into Epistemic Ledger and Knowledge Sphere
    const completedUnitObj = units[unitId];
    if (completedUnitObj) {
      epistemicLedgerService.recordCompletedUnit({
        id: unitId,
        title: completedUnitObj.title,
        category: completedUnitObj.category,
        summaryMarkdown: completedUnitObj.summaryMarkdown,
        score: computedScore,
      });
    }

    // 2. Spaced Repetition tracking (Ebbinghaus forgetting curve initiation)
    const completedNode = nodes.find((n) => n.unitId === unitId || n.id === unitId);
    if (completedNode) {
      spacedRepetition.recordNodeCompletion(
        completedNode.id,
        unitId,
        completedNode.title || completedUnitObj?.title || 'Освоенный квант',
        completedUnitObj?.category || 'Прикладные навыки'
      );
    }

    // If high score or 100% correct answers, notify user of adaptive boost
    if (performance && (performance.score === undefined || performance.score >= 70)) {
      showNotification(`🔥 Отличный результат (${performance.totalCorrect || 0} верных ответов)! Сложность последующих блоков адаптирована ИИ.`, 'success');
    }

    // Cadence check: "давай такие задачи часто но не слишком"
    const { updatedSettings, shouldTrigger } = recordLessonCompletion(cadenceSettings);
    setCadenceSettings(updatedSettings);

    if (shouldTrigger) {
      const completedUnit = units[unitId];
      showNotification(
        `🎯 Каденция ИИ: Пора закрепить тему «${completedUnit?.title || 'Архитектура'}» боевым кейсом! Проект генерируется...`,
        'info'
      );
      handleInjectProject(completedUnit?.title);
    }
  };

  // Handle Project Injection by AI agent ("дай возможность ии агнету встраивать в курс проекты по теме чтоб были интересными похожими на реальную жизнь и подробна рассписана суть что делать и тд и там загрузка файла любого и ии проверяет")
  const handleInjectProject = async (topicOrContext?: string, customProjectData?: any) => {
    if (isInjectingProject) return;
    setIsInjectingProject(true);
    playChime('click');
    showNotification('ИИ-Агент проектирует реалистичный боевой кейс из продакшена...', 'info');

    try {
      let project = customProjectData;
      const effectiveTopic = topicOrContext || units[activeUnitId]?.title || 'Практическая задача';

      if (!project || !project.title || !project.description) {
        const res = await fetch('/api/gemini/generate-realworld-project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: effectiveTopic,
            context: {
              currentUnitTitle: units[activeUnitId]?.title,
              domain: units[activeUnitId]?.category || 'Универсальное мастерство & Прикладные навыки',
              level: 'intermediate',
            },
          }),
        });
        if (res.ok) {
          project = await res.json();
        }
      }

      if (!project || !project.title) {
        const sourceUnit = units[activeUnitId];
        const sourceTask = sourceUnit?.projectTask;
        if (!sourceTask?.description) {
          throw new Error('No subject-specific task is available for offline project fallback');
        }
        project = {
          title: `Практика: ${sourceTask.title}`,
          role: sourceTask.role || 'Практик',
          businessScenario: sourceTask.businessScenario || sourceTask.description,
          description: sourceTask.description,
          checklist: sourceTask.checklist || sourceTask.requirements,
          requirements: sourceTask.requirements,
          acceptedFileTypes: sourceTask.acceptedFileTypes || 'Текстовый файл (.md, .txt)',
          defaultFilename: sourceTask.defaultFilename,
          starterCode: sourceTask.starterCode,
          estimatedTimeMin: sourceTask.estimatedTimeMin || 45,
        };
      }

      const newUnitId = `unit-project-${Date.now()}`;
      const newUnit: LearningUnit = {
        id: newUnitId,
        title: project.title,
        category: units[activeUnitId]?.category || 'Практическое задание',
        durationSec: (project.estimatedTimeMin || 45) * 60,
        videoUrl: units[activeUnitId]?.videoUrl || '',
        authorName: project.role || 'Staff Systems Architect',
        viewsCount: 0,
        retentionRate: 0,
        passRate: 0,
        summaryMarkdown: project.summaryMarkdown || `### ${project.title}\n\n**Роль в команде:** ${project.role}\n\n#### Практический сценарий:\n${project.businessScenario}\n\n#### Суть практической задачи:\n${project.description}`,
        quiz: project.quiz || units[activeUnitId]?.quiz || [],
        projectTask: {
          role: project.role || 'Staff Systems Architect',
          title: project.title,
          businessScenario: project.businessScenario,
          description: project.description,
          checklist: project.checklist || [
            'Шаг 1: Анализ краевых условий',
            'Шаг 2: Реализация защищенной архитектуры',
            'Шаг 3: Тестирование отказоустойчивости'
          ],
          requirements: project.requirements || [
            'Строгая обработка ошибок',
            'Отсутствие утечек ресурсов'
          ],
          acceptedFileTypes: project.acceptedFileTypes || 'Любой файл (.py, .ts, .go, .rs, .sql, .yaml, .json, .md, .zip)',
          defaultFilename: project.defaultFilename || 'solution.ts',
          starterCode: project.starterCode || '// Starter code...',
          estimatedTimeMin: project.estimatedTimeMin || 45
        }
      };

      // Find current node to link to
      const baseNode = nodes.find(n => n.id === activeUnitId || n.unitId === activeUnitId) || nodes[nodes.length - 1];
      const newX = baseNode ? baseNode.x : 480;
      const newY = 440; // Clean branch track below main pipeline

      const newNode: DAGNode = {
        id: newUnitId,
        title: `⚡ ${project.title}`,
        subtitle: `${project.role} · Боевой кейс`,
        phase: baseNode?.phase || 2,
        phaseTitle: 'Боевая практика',
        sprint: 'Boost Sprint',
        type: 'injection',
        status: 'stuck_injected',
        x: newX,
        y: newY,
        dependencies: baseNode ? [baseNode.id] : [],
        unitId: newUnitId,
        estimatedTimeMin: project.estimatedTimeMin || 45,
        score: 0,
        authorName: project.role || 'Staff Architect',
        artifactRequirement: 'Любой проверенный файл решения'
      };

      setUnits(prev => ({ ...prev, [newUnitId]: newUnit }));
      if (currentUser?.uid) {
        firestoreSync.saveLearningUnit(newUnit, currentUser.uid);
      }

      const candidateEdges = baseNode 
        ? [...edges, { id: `e-${baseNode.id}-${newUnitId}`, from: baseNode.id, to: newUnitId, isAlternate: true }]
        : edges;
      const normalized = normalizeDagLayout([...nodes, newNode], candidateEdges);
      setNodes(normalized.nodes);
      setEdges(normalized.edges);

      // Update cadence state
      const updatedCadence = recordProjectInjected(cadenceSettings, project.title);
      setCadenceSettings(updatedCadence);

      setActiveUnitId(newUnitId);
      setActiveTab('focus');
      playChime('success');
      showNotification(`⚡ Боевой кейс «${project.title}» встроен в траекторию курса! Открыт в Фокус-Студии.`, 'success');
    } catch (err) {
      console.error('Project injection error:', err);
      showNotification('Не удалось сгенерировать проект. Попробуйте еще раз.', 'warn');
    } finally {
      setIsInjectingProject(false);
    }
  };

  const handleUpdateCadenceSettings = (newSettings: ProjectCadenceSettings) => {
    setCadenceSettings(newSettings);
    saveCadenceSettings(newSettings);
    showNotification(`Периодичность проектов: ${CADENCE_CONFIGS[newSettings.mode].label}`, 'info');
  };

  // AI Graph Mutation handler
  const handleMutateGraph = (nodeTitle: string, reason: string) => {
    playChime('alert');
    const injectionNodeId = `node-ai-${Date.now()}`;
    const baseNode = nodes.find(n => n.id === activeUnitId || n.unitId === activeUnitId) || nodes[0];
    const newX = baseNode ? baseNode.x : 480;
    const newY = baseNode ? baseNode.y + 260 : 440;

    const newNode: DAGNode = {
      id: injectionNodeId,
      title: `ИИ-Инъекция: ${nodeTitle}`,
      subtitle: reason,
      phase: baseNode?.phase || 1,
      phaseTitle: 'Спринт: Устранение затыка',
      sprint: 'Boost Sprint',
      type: 'injection',
      status: 'stuck_injected',
      x: newX,
      y: newY,
      dependencies: baseNode ? [baseNode.id] : ['node-1'],
      unitId: 'unit-3',
      estimatedTimeMin: 15,
      authorName: '@algo_master',
      artifactRequirement: 'Трассировка и тест граничных условий',
    };

    setNodes((prev) => [...prev, newNode]);
    if (baseNode) {
      setEdges((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, from: baseNode.id, to: injectionNodeId, isAlternate: true },
      ]);
    }

    showNotification(`ИИ-Оператор встроил модуль в DAG-Граф для устранения пробела: ${nodeTitle}`, 'warn');
  };

  const handleMatchBuddy = () => {
    setIsSearchingBuddy(true);
    playChime('click');
    setActiveTab('partner_search');
    showNotification('Открыт поиск напарника в реальной сети...', 'info');
  };

  const handleCompletePersonalization = (settings: {
    targetDomain: string;
    goalTitle: string;
    buddyMode: string;
    buddyLevel: string;
    autoMatch: boolean;
  }) => {
    setIsPersonalized(true);
    localStorage.setItem('learning_os_personalized', 'true');
    localStorage.setItem('learning_os_target_domain', settings.targetDomain);
    localStorage.setItem('learning_os_buddy_settings', JSON.stringify({
      mode: settings.buddyMode,
      level: settings.buddyLevel,
      autoMatch: settings.autoMatch,
    }));

    if (settings.autoMatch) {
      handleMatchBuddy();
    } else {
      setActiveTab('desktop');
    }

    // Trigger elegant white screen "Привет, (имя)" animation fading into OS desktop
    setShowSessionSplash(true);

    showNotification(`Персонализация завершена! Добро пожаловать, ${currentUser?.displayName || 'Студент'}!`, 'success');
    playChime('success');
  };

  // Deploy Admin Material with AI-compiled Practice to DAG Roadmap
  const handleDeployMaterialToCourse = (material: AdminMaterial, compiled?: any) => {
    const newUnitId = `unit-${material.id}`;
    const newUnit: LearningUnit = {
      id: newUnitId,
      title: material.title,
      category: material.domain,
      durationSec: (material.durationMin || 45) * 60,
      videoUrl: material.contentUrl || 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      authorName: material.author,
      viewsCount: material.viewsCount || 342,
      retentionRate: 94,
      passRate: 88,
      originMaterialId: material.id,
      materialType: material.type,
      aiEssence: material.aiEssence,
      aiPracticeGuidelines: material.aiPracticeGuidelines,
      summaryMarkdown: material.textContent
        ? material.textContent
        : `### ${material.title}\n\n${material.aiEssence}\n\n* **Автор:** ${material.author}\n* **Тип ресурса:** ${material.type}\n* **Ссылка:** ${material.contentUrl || 'Локальный файл платформы'}\n\n#### Ключевые тезисы:\n* Фундаментальное понимание внутренних структур и принципов.\n* Оценка практической применимости и эффективности.\n* Осознанный контроль над качеством решения.`,
      quiz: compiled?.quiz || [
        {
          id: `q-${Date.now()}-1`,
          type: 'logic',
          question: `Какой ключевой принцип заложен в материале «${material.title}»?`,
          options: [
            {
              id: 'opt-1',
              text: `Осознанная практика и глубокое понимание принципов`,
              isCorrect: true,
              explanation: `Верно. Материал ориентирован на фундаментальный контроль.`
            },
            {
              id: 'opt-2',
              text: `Использование шаблонных решений без понимания сути`,
              isCorrect: false,
              explanation: `Неверно. Шаблоны без понимания создают скрытые ошибки.`
            },
            {
              id: 'opt-3',
              text: `Игнорирование обратной связи ради скорости`,
              isCorrect: false,
              explanation: `Неверно. Обратная связь критична.`
            }
          ],
          explanation: `Материал делает упор на фундаментальное устройство компонентов и контроль над качеством.`
        }
      ],
      projectTask: compiled?.projectTask || {
        role: 'Практик навыка',
        title: `Практическая реализация: ${material.title}`,
        description: material.aiPracticeGuidelines || `Разработайте практический артефакт, реализующий ключевые тезисы материала «${material.title}». Подготовьте решение с разбором граничных условий.`,
        starterCode: `// Практика по материалу: ${material.title}\n// Автор: ${material.author}\n\nexport function solvePractice() {\n  const keyIdea = '${material.title}';\n  const notes = [\n    'Ключевой инвариант',\n    'Граничные случаи',\n    'Проверка на реальной нагрузке'\n  ];\n\n  return { keyIdea, notes };\n}\n`,
        defaultFilename: 'solution.md',
        requirements: [
          'Покрытие граничных условий и проверка надежности',
          'Практическая ценность для реального применения',
          'Ясная структура без лишней воды'
        ]
      }
    };

    setUnits(prev => ({ ...prev, [newUnitId]: newUnit }));
    if (currentUser?.uid) {
      firestoreSync.saveLearningUnit(newUnit, currentUser.uid);
    }

    const exists = nodes.some(n => n.id === newUnitId);
    if (!exists) {
      const lastNode = nodes[nodes.length - 1];
      const newNode: DAGNode = {
        id: newUnitId,
        title: material.title,
        subtitle: material.aiEssence.slice(0, 48) + '...',
        phase: (lastNode?.phase || 2),
        phaseTitle: lastNode?.phaseTitle || 'Практическая специализация',
        sprint: `Спринт ${nodes.length + 1}`,
        type: 'project',
        status: 'active',
        x: (lastNode ? lastNode.x : 80) + 400,
        y: 180,
        dependencies: lastNode ? [lastNode.id] : [],
        unitId: newUnitId,
        estimatedTimeMin: 45,
        score: 0
      };

      const candidateEdges = lastNode 
        ? [...edges, { id: `e-${lastNode.id}-${newUnitId}`, from: lastNode.id, to: newUnitId }]
        : edges;
      const normalized = normalizeDagLayout([...nodes, newNode], candidateEdges);
      setNodes(normalized.nodes);
      setEdges(normalized.edges);
    }

    showNotification(`Материал «${material.title}» и ИИ-практика встроены в курс!`, 'success');
    playChime('success');
  };

  return (
    <div 
      className={`h-screen w-screen overflow-hidden flex flex-col font-sans select-none relative z-10 ${
        wallpaperConfig.applyEverywhere
          ? 'wallpaper-active-app bg-transparent'
          : wallpaperTheme === 'bitrix_flora'
          ? 'studio-light-bg'
          : 'studio-slate-bg'
      }`}
    >
      {/* 0. GLOBAL WALLPAPER BACKGROUND LAYER (Visible on Desktop and everywhere across the app) */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 transition-all duration-500 ease-out"
        style={{
          backgroundImage: getWallpaperCssBackground(wallpaperConfig),
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* Global Wallpaper Dimming / Contrast Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-300"
        style={{
          backgroundColor: '#F8F9FA',
          opacity: wallpaperConfig.wallpaperId === 'default' || !wallpaperConfig.customUrl ? 0.98 : 0.4,
        }}
      />

      {isMobileMode ? (
        <MobileAppLayout
          currentUser={currentUser}
          nodes={nodes}
          units={units}
          activeUnitId={activeUnitId}
          onSelectUnit={(unitId) => handleSelectUnit(unitId)}
          onUpdateUnit={handleUpdateUnit}
          tasks={tasks}
          onToggleTask={(id) => handleToggleTask(id)}
          onAddTask={(title) =>
            setTasks((prev) => [
              ...prev,
              { id: `task-${Date.now()}`, title, done: false, priority: 'medium', milestone: 'Спринт' },
            ])
          }
          habits={habits}
          onToggleHabit={(id) => handleToggleHabit(id)}
          notes={notes}
          onAddNote={(n) => {
            setNotes((prev) => [n, ...prev]);
            window.dispatchEvent(new CustomEvent('learning_note_added', { detail: n }));
          }}
          onDeleteNote={(id) => setNotes((prev) => prev.filter((x) => x.id !== id))}
          artifacts={artifacts}
          pomodoroMinutes={pomodoroMinutes}
          pomodoroSecondsLeft={pomodoroSecondsLeft}
          isPomodoroRunning={isPomodoroRunning}
          onTogglePomodoro={handleTogglePomodoro}
          onResetPomodoro={handleResetPomodoro}
          onSetPomodoroMinutes={handleSetPomodoroMinutes}
          partner={partner}
          onPartnerMatched={handlePartnerMatched}
          onDisconnectPartner={handleDisconnectPartner}
          onStartCallWithPartner={(p) => handleStartCall({ name: p.name, avatar: p.avatar, role: p.skillDomain || 'P2P' })}
          onSwitchToDesktop={() => handleToggleMobileMode(false)}
          onLessonCompleted={handleLessonCompleted}
          onOpenBlitzModal={handleOpenBlitzModal}
          onMatchBuddy={handleMatchBuddy}
        />
      ) : (
        <>
          {/* 1. TOP EXECUTIVE APP BAR */}
          <LearningTopBar
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenCreateNode={() => setIsCreateNodeOpen(true)}
            onOpenSpotlight={() => setIsSpotlightOpen(true)}
            wallpaperTheme={wallpaperTheme}
            onToggleWallpaperTheme={() =>
              setWallpaperTheme((th) => (th === 'bitrix_flora' ? 'studio_slate' : 'bitrix_flora'))
            }
            onOpenWallpaperGallery={() => setIsWallpaperGalleryOpen(true)}
            isMobileMode={isMobileMode}
            onToggleMobileMode={() => handleToggleMobileMode(true)}
        karma={karma}
        pomodoroMinutes={pomodoroMinutes}
        pomodoroSecondsLeft={pomodoroSecondsLeft}
        isPomodoroRunning={isPomodoroRunning}
        onTogglePomodoro={handleTogglePomodoro}
        user={currentUser}
        syncStatus={firestoreSyncStatus}
        lastSyncTime={lastFirestoreSyncTime}
        isCollabCursorsEnabled={isCollabCursorsEnabled}
        onToggleCollabCursors={() => {
          if (!partner && !peerCollabSync.isDemoPartnerActive()) {
            setActiveTab('partner_search');
            showNotification('Подключите напарника по коду, через очередь или нажмите «Демо-напарник (тест)»', 'info');
          } else {
            setIsCollabCursorsEnabled((prev) => {
              const next = !prev;
              showNotification(next ? 'Курсоры и клики напарника включены' : 'Синхронизация отключена', 'info');
              return next;
            });
          }
        }}
        activeCallPartner={callPartnerModal.isOpen ? callPartnerModal.partner : null}
        onOpenCall={() => setCallPartnerModal((prev) => ({ ...prev, isOpen: true }))}
        onOpenPartnerSearch={() => setActiveTab('partner_search')}
        onTriggerSessionSplash={() => setShowSessionSplash(true)}
        onOpenPersonalization={() => setIsPersonalized(false)}
        onLockScreen={lock}
        onOpenLanding={() => setShowLanding(true)}
        onLogout={() => {
          localStorage.removeItem('learning_os_auth_user');
          setCurrentUser(null);
          setShowLanding(true);
          setActiveTab('desktop');
          showNotification('Вы вышли из учетной записи', 'info');
        }}
      />

      {/* 2. MAIN HORIZONTAL VIEWPORT (Center Canvas + Right Dock) */}
      <div className="flex-1 flex pt-11 overflow-hidden relative">
        {/* Center Workspace Canvas */}
        <main className="flex-1 h-full overflow-hidden relative flex flex-col">
          {/* Full-screen window header with Close, Windowed mode, and Esc shortcut */}
          {activeTab !== 'desktop' && (
            <FullScreenAppHeader
              activeTab={activeTab}
              onClose={() => handleSelectTab('desktop')}
              onRestoreToWindow={() => {
                handleSelectTab('desktop');
                window.dispatchEvent(
                  new CustomEvent('learning_open_window', { detail: { windowId: activeTab } })
                );
              }}
            />
          )}

          {/* Active View Router */}
          {activeTab === 'desktop' && (
            <div className="h-full flex flex-col overflow-hidden">
              <DesktopWorkspace
                onOpenAppTab={(tabId) => handleSelectTab(tabId)}
                onOpenChatWithPrompt={(prompt) => {
                  setChatPrefillPrompt(prompt);
                  handleSelectTab('chat');
                }}
                nodes={nodes}
                edges={edges}
                units={units}
                activeUnitId={activeUnitId}
                onSelectUnit={(unitId) => handleSelectUnit(unitId)}
                onAdoptProfileNode={handleAdoptProfileNode}
                onLaunchUnit={handleLaunchUnit}
                pomodoroMinutes={pomodoroMinutes}
                pomodoroSecondsLeft={pomodoroSecondsLeft}
                isPomodoroRunning={isPomodoroRunning}
                onTogglePomodoro={handleTogglePomodoro}
                onResetPomodoro={handleResetPomodoro}
                onSetPomodoroMinutes={handleSetPomodoroMinutes}
                notes={notes}
                tasks={tasks}
                habits={habits}
                karma={karma}
                onAddNote={(n) => {
                  setNotes((prev) => [n, ...prev]);
                  window.dispatchEvent(new CustomEvent('learning_note_added', { detail: n }));
                }}
                onDeleteNote={(id) => setNotes((prev) => prev.filter((x) => x.id !== id))}
                onToggleTask={(id) => handleToggleTask(id)}
                onAddTask={(title) =>
                  setTasks((prev) => [
                    ...prev,
                    { id: `task-${Date.now()}`, title, done: false, priority: 'medium', milestone: 'Спринт' },
                  ])
                }
                onDeleteTask={(id) => setTasks((prev) => prev.filter((t) => t.id !== id))}
                onToggleHabit={(id) => handleToggleHabit(id)}
                onAddHabit={(newHabit) => setHabits((prev) => [newHabit, ...prev])}
                onDeleteHabit={(id) => setHabits((prev) => prev.filter((h) => h.id !== id))}
                onUpdateHabit={(updatedHabit) =>
                  setHabits((prev) =>
                    prev.map((h) => (h.id === updatedHabit.id ? updatedHabit : h))
                  )
                }
                partner={partner}
                onPartnerMatched={handlePartnerMatched}
                onDisconnectPartner={handleDisconnectPartner}
                onStartCallWithPartner={(p) => handleStartCall({ name: p.name, avatar: p.avatar, role: p.skillDomain || 'P2P' })}
                currentUser={currentUser}
                syncStatus={firestoreSyncStatus}
                onMutateGraph={handleMutateGraph}
                onInjectProject={handleInjectProject}
                onMatchBuddy={handleMatchBuddy}
                artifacts={artifacts}
                adminUnits={adminUnits}
                onUpdateAdminUnits={setAdminUnits}
                materials={materials}
                onUpdateMaterials={setMaterials}
                onDeployMaterialToCourse={handleDeployMaterialToCourse}
                cadenceSettings={cadenceSettings}
                onUpdateCadenceSettings={handleUpdateCadenceSettings}
                wallpaperConfig={wallpaperConfig}
                onUpdateWallpaperConfig={handleUpdateWallpaperConfig}
                onOpenWallpaperGallery={() => setIsWallpaperGalleryOpen(true)}
                onOpenPersonalization={() => setIsPersonalized(false)}
                onLockScreen={lock}
                onOpenBlitzModal={handleOpenBlitzModal}
                onLessonCompleted={handleLessonCompleted}
                onSaveArtifact={handleSaveArtifact}
                onUpdateUnit={handleUpdateUnit}
              />
            </div>
          )}

          {activeTab === 'dag' && (
            <div className="h-full flex flex-col overflow-hidden">
              <DagGraphWindow
                nodes={nodes}
                edges={edges}
                onSelectNode={(nodeId: string) => {
                  const targetNode = nodes.find(n => n.id === nodeId);
                  if (targetNode) {
                    setActiveUnitId(targetNode.unitId);
                  }
                }}
                onLaunchUnit={handleLaunchUnit}
                onOptimizeTrajectory={() => {
                  showNotification('Анализ пробелов и оптимизация траектории...', 'info');
                  handleMutateGraph('B-Tree: Оптимизация страниц', 'Оптимизация траектории по результатам тестов');
                }}
                onStartCallWithPartner={handleStartCall}
                onOpenPeerChat={() => setActiveTab('peer')}
                onInjectProject={handleInjectProject}
                onOpenBlitzModal={handleOpenBlitzModal}
                onOpenKnowledgeSphere={() => setActiveTab('knowledge_sphere')}
                cadenceSettings={cadenceSettings}
              />
            </div>
          )}

          {activeTab === 'knowledge_sphere' && (
            <div className="h-full flex flex-col overflow-hidden">
              <KnowledgeSphereWindow
                nodes={nodes}
                edges={edges}
                units={units}
                artifacts={artifacts}
                activeUnitId={activeUnitId}
                onLaunchUnit={handleLaunchUnit}
                onOpenDag={() => setActiveTab('dag')}
                onOpenFocusStudio={(unitId) => handleLaunchUnit(unitId)}
                onOpenPeerSparring={() => setActiveTab('peer')}
                onInjectProject={handleInjectProject}
                onClose={() => setActiveTab('desktop')}
              />
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="h-full flex flex-col overflow-hidden">
              <CalendarWindow
                nodes={nodes}
                onLaunchUnit={handleLaunchUnit}
                onStartCallWithPartner={handleStartCall}
                partner={partner}
                skillDomain={localStorage.getItem('learning_os_target_domain') || 'Универсальные навыки'}
                onMarkLessonCompleted={handleLessonCompleted}
              />
            </div>
          )}

          {activeTab === 'focus' && (() => {
            const activeNodeIdx = nodes.findIndex((n) => n.unitId === activeUnitId || n.id === activeUnitId);
            const blockNumber = activeNodeIdx >= 0 ? activeNodeIdx + 1 : 1;
            const precedingTopics = nodes.slice(0, activeNodeIdx >= 0 ? activeNodeIdx + 1 : 1).map((n) => n.title);

            return (
              <div className="h-full flex flex-col overflow-hidden">
                <FocusStudioWindow
                  unit={units[activeUnitId] || units['unit-1']}
                  partner={partner}
                  blockNumber={blockNumber}
                  totalBlocksCount={nodes.length}
                  precedingTopics={precedingTopics}
                  onSaveNote={(title: string, content: string, tag: string) => {
                    const newNote: NoteItem = {
                      id: `note-${Date.now()}`,
                      title,
                      content,
                      tag,
                      unitId: activeUnitId,
                      createdAt: 'Только что',
                    };
                    setNotes((prev) => [newNote, ...prev]);
                    showNotification(`Заметка «${title}» сохранена`, 'info');
                  }}
                  onSaveArtifact={handleSaveArtifact}
                  onStuckDetected={() => {
                    handleMutateGraph('B-Tree: Разбор граничных условий', 'Зафиксирован затык на тесте');
                  }}
                  onLaunchBuddyWhiteboard={() => {
                    setPeerInitialTab('whiteboard');
                    setActiveTab('peer');
                    showNotification('Открытие интерактивной доски архитектуры', 'info');
                  }}
                  onLessonCompleted={handleLessonCompleted}
                  onUpdateUnit={handleUpdateUnit}
                  onInjectProject={handleInjectProject}
                  onPartnerMatched={handlePartnerMatched}
                  onStartCallWithPartner={(p) => handleStartCall({ name: p.name, avatar: p.avatar, role: p.skillDomain || 'P2P' })}
                  onMatchBuddy={handleMatchBuddy}
                  onInjectGapClosureNode={(gapBlock) => {
                    handleMutateGraph(gapBlock.targetSubtopic, gapBlock.triggerReason);
                    showNotification(`Заплатка «${gapBlock.targetSubtopic}» добавлена в граф`, 'info');
                  }}
                  cadenceSettings={cadenceSettings}
                  onUpdateCadenceSettings={handleUpdateCadenceSettings}
                />
              </div>
            );
          })()}

          {activeTab === 'peer' && (
            <div className="h-full flex flex-col overflow-hidden">
              <PeerCollabWindow
                partner={partner}
                isSearchingBuddy={isSearchingBuddy}
                onStartMatchmaking={handleMatchBuddy}
                onDisconnectPartner={() => {
                  setPartner(null);
                  showNotification('Соединение с напарником завершено', 'info');
                }}
                onSyncWithMainPlayer={() => setActiveTab('focus')}
                initialTab={peerInitialTab}
                nodes={nodes}
                activeUnitId={activeUnitId}
                activeUnit={units[activeUnitId] || units['unit-1']}
                onSelectUnit={(unitId) => {
                  setActiveUnitId(unitId);
                  showNotification(`Синхронизирован модуль: ${units[unitId]?.title || unitId}`, 'info');
                }}
                onStartSolo={() => {
                  setActiveTab('focus');
                  showNotification('Переключено на индивидуальное прохождение без напарника', 'info');
                }}
                onSaveNote={(title: string, content: string, tag: string) => {
                  const newNote: NoteItem = {
                    id: `note-${Date.now()}`,
                    title,
                    content,
                    tag,
                    unitId: activeUnitId,
                    createdAt: 'Только что',
                  };
                  setNotes((prev) => [newNote, ...prev]);
                  showNotification(`Заметка «${title}» сохранена`, 'info');
                }}
                onSaveArtifact={handleSaveArtifact}
                onLessonCompleted={handleLessonCompleted}
                currentUser={currentUser}
              />
            </div>
          )}

          {activeTab === 'white_screen' && (
            <div className="h-full flex flex-col overflow-hidden">
              <WhiteScreenWindow
                partnerName={partner?.name || 'Напарник'}
                partnerRole="Navigator"
                onOpenCollabHub={() => setActiveTab('peer')}
              />
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="h-full flex flex-col overflow-hidden">
              <AiOperatorWindow
                activeNodeTitle={units[activeUnitId]?.title || 'Архитектура и структуры данных'}
                karma={karma}
                pomodoroMinutes={Math.ceil(pomodoroSecondsLeft / 60)}
                targetRole={localStorage.getItem('learning_os_target_domain') || "Практик навыка"}
                initialPrompt={chatPrefillPrompt}
                onClearInitialPrompt={() => setChatPrefillPrompt('')}
                materials={materials}
                onOpenStore={(matId) => {
                  if (matId) setHighlightedStoreMaterialId(matId);
                  setActiveTab('admin');
                  showNotification('Открыт Магазин материалов', 'info');
                }}
                onDeployMaterial={handleDeployMaterialToCourse}
                onMutateGraph={handleMutateGraph}
                onInjectProject={handleInjectProject}
                onSetPomodoro={(mins, start) => {
                  handleSetPomodoroMinutes(mins);
                  if (start) setIsPomodoroRunning(true);
                  showNotification(`Таймер фокуса установлен на ${mins} минут`, 'info');
                }}
                onCreateNote={(title, content, tag) => {
                  const newNote: NoteItem = {
                    id: `note-${Date.now()}`,
                    title,
                    content,
                    tag,
                    createdAt: 'Только что',
                  };
                  setNotes((prev) => [newNote, ...prev]);
                  showNotification(`Заметка создана: ${title}`, 'success');
                }}
                onAddTask={(title) => {
                  const newTask: TaskItem = {
                    id: `task-${Date.now()}`,
                    title,
                    done: false,
                    priority: 'high',
                    milestone: 'Активный спринт',
                  };
                  setTasks((prev) => [newTask, ...prev]);
                  showNotification(`Задача создана: ${title}`, 'success');
                }}
                onMatchBuddy={handleMatchBuddy}
              />
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="h-full flex flex-col overflow-hidden">
              <PortfolioWindow
                artifacts={artifacts}
                ownerUid={currentUser?.uid}
                ownerName={currentUser?.displayName}
                ownerAvatar={currentUser?.photoURL}
              />
            </div>
          )}

          {activeTab === 'widgets' && (
            <div className="h-full flex flex-col overflow-hidden">
              <WidgetsWindow
                notes={notes}
                tasks={tasks}
                habits={habits}
                karma={karma}
                onAddNote={(n) => setNotes((prev) => [n, ...prev])}
                onDeleteNote={(id) => setNotes((prev) => prev.filter((x) => x.id !== id))}
                onToggleTask={(id) =>
                  setTasks((prev) =>
                    prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
                  )
                }
                onAddTask={(title) =>
                  setTasks((prev) => [
                    ...prev,
                    { id: `task-${Date.now()}`, title, done: false, priority: 'medium', milestone: 'Спринт' },
                  ])
                }
                onToggleHabit={(id) =>
                  setHabits((prev) =>
                    prev.map((h) =>
                      h.id === id
                        ? { ...h, completedToday: !h.completedToday, streak: h.completedToday ? Math.max(0, h.streak - 1) : h.streak + 1 }
                        : h
                    )
                  )
                }
                pomodoroMinutes={pomodoroMinutes}
                pomodoroSecondsLeft={pomodoroSecondsLeft}
                isPomodoroRunning={isPomodoroRunning}
                onTogglePomodoro={handleTogglePomodoro}
                onResetPomodoro={handleResetPomodoro}
                onSetPomodoroMinutes={handleSetPomodoroMinutes}
              />
            </div>
          )}

          {activeTab === 'knowledge_git' && (
            <div className="h-full flex flex-col overflow-hidden">
              <KnowledgeGitWindow
                nodes={nodes}
                notes={notes}
                artifacts={artifacts}
                units={units}
                onLaunchUnit={handleLaunchUnit}
              />
            </div>
          )}

          {activeTab === 'textbook_library' && (
            <div className="h-full flex flex-col overflow-hidden">
              <TextbookLibraryWindow
                nodes={nodes}
                activeUnitId={activeUnitId}
                units={units}
                onLaunchUnit={handleLaunchUnit}
                onUpdateUnit={(updatedUnit) => setUnits((prev) => ({ ...prev, [updatedUnit.id]: updatedUnit }))}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="h-full flex flex-col overflow-hidden">
              <KeyboardShortcutsWindow />
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="h-full flex flex-col overflow-hidden">
              <WidgetsWindow
                notes={notes}
                tasks={tasks}
                habits={habits}
                karma={karma}
                onAddNote={(n) => setNotes((prev) => [n, ...prev])}
                onDeleteNote={(id) => setNotes((prev) => prev.filter((x) => x.id !== id))}
                onToggleTask={handleToggleTask}
                onAddTask={(title) =>
                  setTasks((prev) => [
                    ...prev,
                    { id: `task-${Date.now()}`, title, done: false, priority: 'medium', milestone: 'Спринт' },
                  ])
                }
                onToggleHabit={handleToggleHabit}
                pomodoroMinutes={pomodoroMinutes}
                pomodoroSecondsLeft={pomodoroSecondsLeft}
                isPomodoroRunning={isPomodoroRunning}
                onTogglePomodoro={handleTogglePomodoro}
                onResetPomodoro={handleResetPomodoro}
                onSetPomodoroMinutes={handleSetPomodoroMinutes}
              />
            </div>
          )}

          {activeTab === 'partner_search' && (
            <div className="h-full flex flex-col overflow-hidden">
              <PartnerSearchWindow
                partner={partner}
                onPartnerMatched={handlePartnerMatched}
                onDisconnectPartner={handleDisconnectPartner}
                onOpenPeerWindow={() => handleSelectTab('peer')}
                onStartCallWithPartner={(p) => handleStartCall({ name: p.name, avatar: p.avatar, role: p.skillDomain || 'P2P' })}
                currentUser={currentUser}
                skillDomain={localStorage.getItem('learning_os_target_domain') || 'Иностранные языки'}
                targetGoal="Свободная речь и практика спарринга"
                onClose={() => handleSelectTab('desktop')}
              />
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="h-full flex flex-col overflow-hidden">
              <AdminConsoleWindow
                units={adminUnits}
                onUpdateUnit={setAdminUnits}
                materials={materials}
                onUpdateMaterials={setMaterials}
                onDeployMaterialToCourse={handleDeployMaterialToCourse}
                initialTab="store"
                highlightMaterialId={highlightedStoreMaterialId}
              />
            </div>
          )}

          {/* Persistent OS App Dock when in full-screen application view */}
          {activeTab !== 'desktop' && (
            <PersistentBottomDock
              activeTab={activeTab}
              onSelectTab={(tabId) => handleSelectTab(tabId)}
              onCloseToDesktop={() => handleSelectTab('desktop')}
            />
          )}
        </main>

        {/* Right Study Dock (Online Peer & AI Operator Shortcuts) */}
        <LearningRightDock
          partner={partner}
          onStartCall={handleStartCall}
          onOpenPeer={() => {
            if (partner) {
              setPeerInitialTab('video');
              handleSelectTab('peer');
            } else {
              handleSelectTab('partner_search');
            }
          }}
          onOpenWhiteboard={() => {
            setPeerInitialTab('whiteboard');
            handleSelectTab('peer');
            showNotification('Интерактивная доска открыта', 'info');
          }}
          onOpenChat={() => handleSelectTab('chat')}
          onOpenTasks={() => handleSelectTab('widgets')}
        />
      </div>
      </>
      )}

      {/* 3. MODALS */}

      {/* Create Topic Node in DAG Graph Modal */}
      {isCreateNodeOpen && (
        <LearningCreateNodeModal
          onClose={() => setIsCreateNodeOpen(false)}
          onCreate={handleCreateNode}
          existingNodesCount={nodes.length}
        />
      )}

      {/* Video Call Modal (Daily.co WebRTC) */}
      {callPartnerModal.isOpen && callPartnerModal.partner && (
        <LearningVideoCallModal
          isOpen={callPartnerModal.isOpen}
          partner={callPartnerModal.partner}
          pairTask={callPartnerModal.partner.pairTask}
          currentTopic={callPartnerModal.partner.pairTask?.topic}
          onClose={() => setCallPartnerModal({ isOpen: false, partner: null })}
          onOpenPeerCollab={() => {
            setCallPartnerModal({ isOpen: false, partner: null });
            setActiveTab('peer');
          }}
          onFinishedAssessment={(assessment) => {
            const userScore = assessment?.userGrade?.score;
            if (assessment?.evaluationStatus !== 'verified' || typeof userScore !== 'number' || !Number.isFinite(userScore)) return;
            const passed = userScore >= 70;
            const karmaBonus = passed ? Math.round(userScore * 1.5) : 0;
            if (karmaBonus > 0) setKarma((prev) => prev + karmaBonus);

            const fileContent = JSON.stringify(assessment, null, 2);
            const newArtifact = {
              id: `artifact-sparring-${Date.now()}`,
              unitId: activeUnitId,
              unitTitle: `[👥 Спарринг] ${callPartnerModal.partner?.pairTask?.topic || 'Парный созвон'}`,
              filename: 'p2p_sparring_verification.json',
              fileContent,
              fileSize: `${new TextEncoder().encode(fileContent).length} B`,
              fileFormat: 'json',
              score: userScore,
              passed,
              strongPoints: assessment.userGrade.strengths || [],
              vulnerabilities: assessment?.userGrade?.recommendations || [],
              productionAdvice: assessment?.userGrade?.coachAdvice || '',
              submittedAt: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            };

            setArtifacts((prev) => [newArtifact, ...prev]);
            if (currentUser?.uid) firestoreSync.saveArtifact(currentUser.uid, newArtifact);

            if (passed) {
              setNodes((prev) =>
                prev.map((n) =>
                  n.id === activeUnitId || n.unitId === activeUnitId
                    ? { ...n, status: 'completed' as const }
                    : n
                )
              );
            }

            showNotification(
              passed
                ? `🤝 Спарринг проверен: ${userScore}/100. +${karmaBonus} XP`
                : `Спарринг проверен: ${userScore}/100. Зачёт не получен, доработайте ответ.`,
              passed ? 'success' : 'info'
            );
          }}
        />
      )}

      {/* Spotlight Global Search Modal (⌘K) */}
      <SpotlightModal
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        onOpenWindow={(winId) => {
          setIsSpotlightOpen(false);
          setActiveTab(winId);
        }}
        units={units}
        notes={notes}
        onSelectUnit={(unitId) => {
          setIsSpotlightOpen(false);
          handleLaunchUnit(unitId);
        }}
      />

      {/* Toast Notification Alert (Removed as requested) */}

      {/* 0. BITRIX24-STYLE HIGH-FIDELITY LANDING PAGE AT THE BEGINNING OF JOURNEY */}
      {showLanding && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#FAF8F5]">
          <BitrixStyleLanding
            onStartFree={() => {
              setShowLanding(false);
            }}
            onLogin={() => {
              setShowLanding(false);
            }}
            onEnterDemoDesktop={async () => {
              let firebaseUser;
              try {
                firebaseUser = await loginAsGuest();
              } catch (error) {
                console.warn('Demo Firebase login failed:', error);
                showNotification('Не удалось создать гостевую учётную запись Firebase', 'info');
                return;
              }
              const demoUser = {
                uid: firebaseUser.uid,
                displayName: 'Александр (Демо)',
                email: 'alexander.demo@learning-os.internal',
                photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
              };
              setCurrentUser(demoUser);
              setIsPersonalized(true);
              try {
                localStorage.setItem('learning_os_auth_user', JSON.stringify(demoUser));
                localStorage.setItem('learning_os_personalized', 'true');
              } catch (e) {
                console.warn(e);
              }
              setShowLanding(false);
              showNotification('Вход в демо-режим Learning OS выполнен!', 'success');
            }}
          />
        </div>
      )}

      {/* 1. AUTHENTIC MINIMALIST OS SETUP ASSISTANT (OOBE) / LOCK SCREEN */}
      {!showLanding && (!currentUser || !isPersonalized) && (
        <OsSetupAssistant
          currentUser={currentUser}
          isPersonalized={isPersonalized}
          onLoginUser={(userObj) => {
            setCurrentUser(userObj);
            localStorage.setItem('learning_os_auth_user', JSON.stringify(userObj));
          }}
          onLogout={() => {
            localStorage.removeItem('learning_os_auth_user');
            setCurrentUser(null);
            showNotification('Вы вышли из учетной записи', 'info');
          }}
          currentWallpaperConfig={wallpaperConfig}
          onSelectWallpaper={handleUpdateWallpaperConfig}
          onComplete={handleCompletePersonalization}
          onApplyGeneratedPath={(newNodes, newEdges, summary, generatedUnits) => {
            const normalized = normalizeDagLayout(newNodes, newEdges);
            setNodes(normalized.nodes);
            setEdges(normalized.edges);
            if (generatedUnits) {
              setUnits((prev) => ({ ...prev, ...generatedUnits }));
              if (currentUser?.uid) {
                firestoreSync.saveLearningUnits(generatedUnits, currentUser.uid);
              }
            }
            try {
              localStorage.setItem('learning_os_survey_completed', 'true');
            } catch (e) {
              console.warn('Error saving survey status:', e);
            }
            showNotification('Персональный план на 200 блоков успешно сформирован!', 'success');
          }}
          adminUnits={adminUnits}
          onCancelReconfigure={() => {
            if (currentUser) {
              setIsPersonalized(true);
            }
          }}
        />
      )}

      {/* 3. WHITE SESSION SPLASH ON NEW TAB / LAUNCH: "Привет, {имя}" fading into OS desktop */}
      {currentUser && isPersonalized && showSessionSplash && (
        <SessionWelcomeSplash
          userName={currentUser.displayName}
          onFinished={() => setShowSessionSplash(false)}
        />
      )}

      {/* Real-time Multi-User Cursor & Shared Actions Overlay (Active strictly within the lesson / peer sparring window, not across the whole desktop) */}
      {(activeTab === 'focus' || activeTab === 'peer') && (
        <PeerCursorOverlay 
          enabled={isCollabCursorsEnabled} 
          hasPartner={Boolean(partner)} 
        />
      )}

      {/* Global Wallpaper Gallery & Customization Modal */}
      <WallpaperGalleryModal
        isOpen={isWallpaperGalleryOpen}
        onClose={() => setIsWallpaperGalleryOpen(false)}
        config={wallpaperConfig}
        onUpdateConfig={handleUpdateWallpaperConfig}
      />

      {/* 4. BLACK SCREEN WITH TIME & SIGN IN ("черное окно с временем и войти в систему") */}
      <SystemLockScreenModal
        isOpen={isLocked}
        onUnlock={unlock}
        userName={currentUser?.displayName || 'Студент'}
        userEmail={currentUser?.email}
        userPhoto={currentUser?.photoURL}
      />

      {/* 5. SPACED REPETITION & EBBINGHAUS 2-MIN BLITZ MODAL */}
      <SpacedRepetitionModal
        isOpen={isBlitzModalOpen}
        units={units}
        onClose={() => {
          setIsBlitzModalOpen(false);
          setBlitzTargetNodeId(null);
        }}
        targetNodeId={blitzTargetNodeId}
        onRefreshCompleted={(nodeId, newPct) => {
          showNotification(`Память по теме успешно обновлена: ${newPct}%!`, 'success');
        }}
        onAddKarma={(earnedXp) => {
          setKarma((prev) => prev + earnedXp);
          showNotification(`+${earnedXp} XP за интервальное повторение начислено!`, 'success');
        }}
      />
    </div>
  );
}
