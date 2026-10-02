import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, 
  Layers, 
  Image, 
  Grid, 
  RotateCcw, 
  Trash2, 
  Minus, 
  X, 
  Maximize2, 
  Sparkles,
  Network,
  Tv,
  Bot,
  Users,
  PenTool,
  GitBranch,
  Award,
  ShieldCheck,
  ClipboardList,
  CheckSquare,
  Clock,
  Pin,
  Activity,
  Volume2,
  Calendar,
  Calculator,
  Bookmark,
  ExternalLink,
  BookOpen,
  ChevronDown,
  Upload,
  Columns,
  LayoutGrid,
  Magnet,
  Lock,
  Monitor,
  Atom,
  Settings2,
} from 'lucide-react';
import { 
  DesktopWidgetInstance, 
  DesktopWidgetType, 
  WindowId, 
  WindowState,
  LearningUnit, 
  NoteItem, 
  TaskItem, 
  HabitItem,
  UserArtifact,
  PeerPartner,
  ProfileNodeSnapshot
} from '../../types.ts';
import { playChime } from '../../utils/audio.ts';
import { SyncStatus } from '../../services/firestoreSync.ts';
import { GlobalWallpaperConfig, DEFAULT_WALLPAPER_CONFIG } from '../../types/wallpaper.ts';
import { 
  CURATED_WALLPAPERS, 
  getCustomWallpapers,
  processImageFileToWallpaper,
  resolveWallpaperItem, 
  getWallpaperCssBackground 
} from '../../services/wallpaperGallery.ts';
import { WindowSnapOverlay, SnapZonePreview, AlignmentGuide } from './WindowSnapOverlay.tsx';
import { 
  computeWindowMagnetDrag, 
  calculateSmartAutoFit, 
  generateSmartMosaicLayout 
} from './windowMagnetEngine.ts';
import { peerCollabSync } from '../../services/peerCollabSync.ts';

// Widgets
import { PomodoroWidget } from './widgets/PomodoroWidget.tsx';
import { StickyNoteWidget } from './widgets/StickyNoteWidget.tsx';
import { TaskListWidget } from './widgets/TaskListWidget.tsx';
import { SystemMonitorWidget } from './widgets/SystemMonitorWidget.tsx';
import { AiInsightWidget } from './widgets/AiInsightWidget.tsx';
import { HabitsWidget } from './widgets/HabitsWidget.tsx';
import { CurrentUnitWidget } from './widgets/CurrentUnitWidget.tsx';
import { KarmaWidget } from './widgets/KarmaWidget.tsx';
import { AmbientSoundWidget } from './widgets/AmbientSoundWidget.tsx';
import { ClockCalendarWidget } from './widgets/ClockCalendarWidget.tsx';
import { ByteConverterWidget } from './widgets/ByteConverterWidget.tsx';
import { QuickLinksWidget } from './widgets/QuickLinksWidget.tsx';
import { MemoryRetentionWidget } from './widgets/MemoryRetentionWidget.tsx';
import { WidgetCatalogModal } from './WidgetCatalogModal.tsx';
import { WindowFrame } from './WindowFrame.tsx';

// Windows Content
import { DagGraphWindow } from '../windows/DagGraphWindow.tsx';
import { KnowledgeSphereWindow } from '../windows/KnowledgeSphereWindow.tsx';
import { KnowledgeGitWindow } from '../windows/KnowledgeGitWindow.tsx';
import { FocusStudioWindow } from '../windows/FocusStudioWindow.tsx';
import { PeerCollabWindow } from '../windows/PeerCollabWindow.tsx';
import { AiOperatorWindow } from '../windows/AiOperatorWindow.tsx';
import { PortfolioWindow } from '../windows/PortfolioWindow.tsx';
import { AdminConsoleWindow } from '../windows/AdminConsoleWindow.tsx';
import { PartnerSearchWindow } from '../windows/PartnerSearchWindow.tsx';
import { WhiteScreenWindow } from '../windows/WhiteScreenWindow.tsx';
import { CalendarWindow } from '../windows/CalendarWindow.tsx';
import { WidgetsWindow } from '../windows/WidgetsWindow.tsx';
import { KeyboardShortcutsWindow } from '../windows/KeyboardShortcutsWindow.tsx';
import { TextbookLibraryWindow } from '../windows/TextbookLibraryWindow.tsx';
import { DiagnosticSurveyWindow } from '../windows/DiagnosticSurveyWindow.tsx';

export type DesktopWallpaper = 'sequoia' | 'aurora' | 'studio_slate' | 'cyber_dark' | 'bitrix_flora';

interface DesktopWorkspaceProps {
  onOpenAppTab: (tabId: string) => void;
  onOpenChatWithPrompt?: (prompt: string) => void;
  // Learning Data
  nodes: any[];
  edges: any[];
  units: Record<string, LearningUnit>;
  activeUnitId: string;
  onSelectUnit: (unitId: string) => void;
  onAdoptProfileNode?: (snapshot: ProfileNodeSnapshot) => void;
  onLaunchUnit: (unitId: string) => void;
  // Pomodoro
  pomodoroMinutes: number;
  pomodoroSecondsLeft?: number;
  isPomodoroRunning: boolean;
  onTogglePomodoro: () => void;
  onResetPomodoro: () => void;
  onSetPomodoroMinutes: (mins: number) => void;
  // Data
  notes: NoteItem[];
  tasks: TaskItem[];
  habits: HabitItem[];
  karma: number;
  onAddNote: (n: NoteItem) => void;
  onDeleteNote: (id: string) => void;
  onToggleTask: (id: string) => void;
  onAddTask: (title: string) => void;
  onDeleteTask?: (id: string) => void;
  onToggleHabit: (id: string) => void;
  onAddHabit?: (habit: HabitItem) => void;
  onDeleteHabit?: (id: string) => void;
  onUpdateHabit?: (habit: HabitItem) => void;
  partner: PeerPartner | null;
  onPartnerMatched?: (partner: PeerPartner) => void;
  onDisconnectPartner?: () => void;
  onStartCallWithPartner?: (partner: PeerPartner) => void;
  currentUser: any;
  syncStatus?: SyncStatus;
  // AI Actions
  onMutateGraph: (title: string, reason: string) => void;
  onInjectProject: (topic?: string) => void;
  onMatchBuddy: () => void;
  artifacts: UserArtifact[];
  adminUnits: any[];
  onUpdateAdminUnits: (units: any[]) => void;
  materials: any[];
  onUpdateMaterials: (mats: any[]) => void;
  onDeployMaterialToCourse: (mat: any) => void;
  cadenceSettings: any;
  onUpdateCadenceSettings?: (settings: any) => void;
  // Global Wallpaper & Gallery
  wallpaperConfig?: GlobalWallpaperConfig;
  onUpdateWallpaperConfig?: (config: GlobalWallpaperConfig) => void;
  onOpenWallpaperGallery?: () => void;
  onOpenPersonalization?: () => void;
  onLockScreen?: () => void;
  onOpenBlitzModal?: (nodeId?: string) => void;
  onLessonCompleted?: (unitId: string) => void;
  onSaveArtifact?: (artifact: UserArtifact) => void;
  onUpdateUnit?: (unit: LearningUnit) => void;
  onApplyGeneratedPath?: (nodes: any[], edges: any[], summary: any, generatedUnits?: Record<string, LearningUnit>) => void;
}

const DEFAULT_WIDGETS: DesktopWidgetInstance[] = [
  { id: 'w-clock', type: 'clock_calendar', title: 'Время & Календарь', x: 28, y: 24, width: 285, height: 210 },
  { id: 'w-pomodoro', type: 'pomodoro', title: 'Фокус-Таймер', x: 330, y: 24, width: 285, height: 210 },
  { id: 'w-tasks', type: 'task_list', title: 'Оперативные задачи', x: 632, y: 24, width: 295, height: 220 },
  { id: 'w-insight', type: 'ai_insight', title: 'ИИ-Совет по блоку', x: 944, y: 24, width: 305, height: 220 },
  { id: 'w-sys', type: 'system_monitor', title: 'Системный монитор OS', x: 28, y: 254, width: 285, height: 220 },
  { id: 'w-sticky', type: 'sticky_note', title: 'Быстрая заметка', x: 330, y: 254, width: 300, height: 220, color: 'amber' },
  { id: 'w-habits', type: 'habits', title: 'Стрики & Привычки', x: 632, y: 254, width: 295, height: 220 },
  { id: 'w-audio', type: 'ambient_audio', title: 'Звуковой фон концентрации', x: 944, y: 254, width: 305, height: 210 },
];

export const DesktopWorkspace: React.FC<DesktopWorkspaceProps> = ({
  onOpenAppTab,
  onOpenChatWithPrompt,
  nodes,
  edges,
  units,
  activeUnitId,
  onSelectUnit,
  onAdoptProfileNode,
  onLaunchUnit,
  pomodoroMinutes,
  pomodoroSecondsLeft,
  isPomodoroRunning,
  onTogglePomodoro,
  onResetPomodoro,
  onSetPomodoroMinutes,
  notes,
  tasks,
  habits,
  karma,
  onAddNote,
  onDeleteNote,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onToggleHabit,
  onAddHabit,
  onDeleteHabit,
  onUpdateHabit,
  partner,
  onPartnerMatched,
  onDisconnectPartner,
  onStartCallWithPartner,
  currentUser,
  syncStatus = 'synced',
  onMutateGraph,
  onInjectProject,
  onMatchBuddy,
  artifacts,
  adminUnits,
  onUpdateAdminUnits,
  materials,
  onUpdateMaterials,
  onDeployMaterialToCourse,
  cadenceSettings,
  onUpdateCadenceSettings,
  wallpaperConfig,
  onUpdateWallpaperConfig,
  onOpenWallpaperGallery,
  onOpenPersonalization,
  onLockScreen,
  onOpenBlitzModal,
  onLessonCompleted,
  onSaveArtifact,
  onUpdateUnit,
  onApplyGeneratedPath,
}) => {
  // 1. Wallpaper State (Unified with Global Wallpaper)
  const effectiveConfig = wallpaperConfig || DEFAULT_WALLPAPER_CONFIG;
  const currentWallpaperItem = resolveWallpaperItem(effectiveConfig);

  const [showWallpaperMenu, setShowWallpaperMenu] = useState(false);
  const [isDraggingOverDesktop, setIsDraggingOverDesktop] = useState(false);
  const [wallpaperNotice, setWallpaperNotice] = useState<string | null>(null);
  const [wallpaperError, setWallpaperError] = useState<string | null>(null);
  const desktopFileInputRef = useRef<HTMLInputElement>(null);

  const handleDesktopFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setWallpaperError('Пожалуйста, выберите файл изображения (PNG, JPG, WebP, GIF, SVG)');
      setTimeout(() => setWallpaperError(null), 4500);
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setWallpaperError('Файл изображения слишком большой (макс. 15 МБ)');
      setTimeout(() => setWallpaperError(null), 4500);
      return;
    }

    setWallpaperError(null);
    try {
      const item = await processImageFileToWallpaper(file);
      if (onUpdateWallpaperConfig) {
        onUpdateWallpaperConfig({
          ...effectiveConfig,
          wallpaperId: item.id,
          customUrl: item.url,
          applyEverywhere: true,
        });
      }
      playChime('success');
      setWallpaperNotice(`Обои «${item.title}» установлены фоном на рабочем столе и везде в системе!`);
      setTimeout(() => setWallpaperNotice(null), 4000);
    } catch (err: any) {
      setWallpaperError(err?.message || 'Не удалось применить файл как обои');
      setTimeout(() => setWallpaperError(null), 4500);
    } finally {
      if (desktopFileInputRef.current) desktopFileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingOverDesktop(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingOverDesktop(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverDesktop(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleDesktopFileSelect(file);
    }
  };

  const handleSelectQuickWallpaper = (wpId: string) => {
    if (onUpdateWallpaperConfig) {
      onUpdateWallpaperConfig({
        ...effectiveConfig,
        wallpaperId: wpId,
        customUrl: undefined,
      });
    }
    setShowWallpaperMenu(false);
    playChime('click');
  };

  // 2. Desktop Widgets State (Pure widgets desktop, no icons)
  const [widgets, setWidgets] = useState<DesktopWidgetInstance[]>(() => {
    try {
      const savedV3 = localStorage.getItem('learning_os_desktop_widgets_v3');
      if (savedV3) {
        const parsed = JSON.parse(savedV3);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((w: any) =>
            w.type === 'sticky_note' && (!w.width || w.width < 300)
              ? { ...w, width: 300, height: Math.max(w.height || 210, 220) }
              : w
          );
        }
      }
      const savedV2 = localStorage.getItem('learning_os_desktop_widgets_v2');
      if (savedV2) {
        const parsed = JSON.parse(savedV2);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const minX = Math.min(...parsed.map((p: any) => p.x ?? 0));
          if (minX >= 240) {
            return parsed.map((p: any) => ({
              ...p,
              x: Math.max(28, (p.x ?? 0) - 220),
            }));
          }
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_WIDGETS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('learning_os_desktop_widgets_v3', JSON.stringify(widgets));
    } catch {}
  }, [widgets]);

  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [focusedWidgetId, setFocusedWidgetId] = useState<string | null>(null);
  const [chatPrefillPrompt, setChatPrefillPrompt] = useState<string>('');
  const [desktopLayoutMode, setDesktopLayoutMode] = useState<'responsive_grid' | 'freeform'>(() => {
    try {
      const saved = localStorage.getItem('learning_os_desktop_layout_mode_v2');
      if (saved === 'responsive_grid' || saved === 'freeform') return saved;
    } catch {}
    return 'responsive_grid';
  });

  const handleToggleLayoutMode = () => {
    setDesktopLayoutMode((prev) => {
      const next = prev === 'responsive_grid' ? 'freeform' : 'responsive_grid';
      try {
        localStorage.setItem('learning_os_desktop_layout_mode_v2', next);
      } catch {}
      playChime('click');
      return next;
    });
  };

  // Active node and educational block calculation for context-aware widgets (e.g. AiInsightWidget)
  const activeNode = useMemo(() => {
    return (
      nodes.find((n) => n.unitId === activeUnitId || n.id === activeUnitId) ||
      nodes.find((n) => n.status === 'active') ||
      nodes.find((n) => n.status === 'stuck_injected') ||
      nodes[0]
    );
  }, [nodes, activeUnitId]);

  const currentBlockInfo = useMemo(() => {
    const currentUnit = units[activeUnitId] || units[activeNode?.unitId || ''] || Object.values(units)[0];
    const phase = activeNode?.phase || 1;
    const title = activeNode?.phaseTitle || `Блок ${phase}: ${activeNode?.sprint || 'Обучение'}`;
    
    // Topics in the same block/phase
    const samePhaseNodes = nodes.filter(
      (n) => n.phase === phase || (activeNode?.phaseTitle && n.phaseTitle === activeNode.phaseTitle)
    );
    const topics = samePhaseNodes.map((n) => n.title);

    const savedDomain = typeof window !== 'undefined' ? localStorage.getItem('learning_os_target_domain') || 'Универсальное мастерство' : 'Универсальное мастерство';
    return {
      phase,
      title,
      topics: topics.length > 0 ? topics : [activeNode?.title || `Освоение дисциплины: ${savedDomain}`],
      currentTopic: activeNode?.title || currentUnit?.title || `Базовый квант: ${savedDomain}`,
      domain: currentUnit?.category || activeNode?.phaseTitle || savedDomain,
    };
  }, [nodes, activeNode, activeUnitId, units]);

  // Dragging State for Widgets
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ offsetX: number; offsetY: number }>({ offsetX: 0, offsetY: 0 });
  const lastWidgetMoveBroadcastRef = useRef<Record<string, number>>({});

  const handleWidgetMouseDown = (e: React.MouseEvent, widgetId: string) => {
    // Only drag from header handle
    setFocusedWidgetId(widgetId);
    setDraggedWidgetId(widgetId);
    const widget = widgets.find((w) => w.id === widgetId);
    if (widget) {
      dragOffsetRef.current = {
        offsetX: e.clientX - widget.x,
        offsetY: e.clientY - widget.y,
      };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggedWidgetId) return;
      const targetWidget = widgets.find((w) => w.id === draggedWidgetId);
      if (!targetWidget) return;

      const newX = Math.max(10, Math.min(window.innerWidth - 100, e.clientX - dragOffsetRef.current.offsetX));
      const newY = Math.max(10, Math.min(window.innerHeight - 80, e.clientY - dragOffsetRef.current.offsetY));

      setWidgets((prev) =>
        prev.map((w) => (w.id === draggedWidgetId ? { ...w, x: newX, y: newY } : w))
      );

      const now = Date.now();
      const last = lastWidgetMoveBroadcastRef.current[draggedWidgetId] || 0;
      if (now - last > 30) {
        lastWidgetMoveBroadcastRef.current[draggedWidgetId] = now;
        peerCollabSync.broadcastWidgetAction('widget_move', {
          widgetId: draggedWidgetId,
          x: newX,
          y: newY,
        });
      }
    };

    const handleMouseUp = () => {
      if (draggedWidgetId) {
        const w = widgets.find((item) => item.id === draggedWidgetId);
        if (w) {
          peerCollabSync.broadcastWidgetAction('widget_move', {
            widgetId: draggedWidgetId,
            x: w.x,
            y: w.y,
          });
        }
      }
      setDraggedWidgetId(null);
    };

    if (draggedWidgetId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedWidgetId, widgets]);

  // Widget Actions
  const handleAddWidget = (type: DesktopWidgetType) => {
    const newId = `w-${type}-${Date.now()}`;
    const titles: Record<DesktopWidgetType, string> = {
      pomodoro: 'Фокус-Таймер',
      sticky_note: 'Быстрая заметка',
      task_list: 'Оперативные задачи',
      system_monitor: 'Системный монитор OS',
      ai_insight: 'ИИ-Совет по блоку',
      habits: 'Стрики & Привычки',
      current_unit: 'Текущий модуль DAG',
      karma_progress: 'Карма & Уровень',
      ambient_audio: 'Звуковой фон концентрации',
      clock_calendar: 'Время & Календарь',
      byte_converter: 'Конвертер памяти',
      quick_links: 'Инженерная библиотека',
      memory_retention: 'Память Эббингауза & Блиц',
    };

    // Stagger positions neatly across the entire desktop width
    const count = widgets.length;
    const cols = Math.max(1, Math.floor((window.innerWidth - 60) / 310));
    const col = count % cols;
    const row = Math.floor(count / cols);
    const spawnX = Math.min(Math.max(20, window.innerWidth - 320), 28 + col * 310);
    const spawnY = Math.min(Math.max(20, window.innerHeight - 260), 24 + (row % 3) * 230);

    const newWidget: DesktopWidgetInstance = {
      id: newId,
      type,
      title: titles[type] || 'Виджет',
      x: spawnX,
      y: spawnY,
      width: type === 'sticky_note' ? 300 : 280,
      height: type === 'sticky_note' ? 220 : 210,
      color: type === 'sticky_note' ? 'amber' : undefined,
    };

    setWidgets((prev) => [newWidget, ...prev]);
    setFocusedWidgetId(newId);
    peerCollabSync.broadcastWidgetAction('widget_add', { widget: newWidget });
    playChime('success');
  };

  const handleRemoveWidget = (widgetId: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
    peerCollabSync.broadcastWidgetAction('widget_remove', { widgetId });
    playChime('click');
  };

  const handleToggleCollapseWidget = (widgetId: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === widgetId ? { ...w, isCollapsed: !w.isCollapsed } : w))
    );
    peerCollabSync.broadcastWidgetAction('widget_collapse', { widgetId });
    playChime('click');
  };

  const handleAutoArrange = () => {
    const cardWidth = 300;
    const cardHeight = 270;
    const gapX = 20;
    const gapY = 20;
    const startX = 24;
    const startY = 18;

    const availableWidth = Math.max(cardWidth, window.innerWidth - startX - 24);
    const cols = Math.max(1, Math.floor((availableWidth + gapX) / (cardWidth + gapX)));

    const arranged = widgets.map((w, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      return {
        ...w,
        width: cardWidth,
        height: cardHeight,
        x: startX + col * (cardWidth + gapX),
        y: startY + row * (cardHeight + gapY),
        isCollapsed: false,
      };
    });

    setWidgets(arranged);
    peerCollabSync.broadcastWidgetAction('widget_arrange', { widgets: arranged });
    playChime('click');
  };

  const handleResetToDefaults = () => {
    setWidgets(DEFAULT_WIDGETS);
    peerCollabSync.broadcastWidgetAction('widget_arrange', { widgets: DEFAULT_WIDGETS });
    playChime('success');
  };

  const handleClearAll = () => {
    setWidgets([]);
    peerCollabSync.broadcastWidgetAction('widget_arrange', { widgets: [] });
    playChime('click');
  };

  // 3. Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; isOpen: boolean }>({
    x: 0,
    y: 0,
    isOpen: false,
  });

  const handleContextMenu = (e: React.MouseEvent) => {
    // Only trigger if clicking directly on desktop surface
    const target = e.target as HTMLElement | null;
    if (target && typeof target.closest === 'function') {
      if (target.closest('.desktop-widget') || target.closest('.window-frame')) {
        return;
      }
    }
    e.preventDefault();
    setContextMenu({
      x: Math.min(window.innerWidth - 220, e.clientX),
      y: Math.min(window.innerHeight - 260, e.clientY),
      isOpen: true,
    });
  };

  const handleCloseContextMenu = () => {
    if (contextMenu.isOpen) {
      setContextMenu((prev) => ({ ...prev, isOpen: false }));
    }
  };

  // 4. Floating Windows State on Desktop
  const [floatingWindows, setFloatingWindows] = useState<Record<string, WindowState>>({
    desktop: { id: 'desktop', title: 'Рабочий стол', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 10, position: { x: 80, y: 60 }, size: { width: 900, height: 600 } },
    dag: { id: 'dag', title: 'DAG-Граф Знаний', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 10, position: { x: 80, y: 60 }, size: { width: 960, height: 620 } },
    knowledge_sphere: { id: 'knowledge_sphere', title: 'Сфера знаний 3D (Knowledge Sphere)', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 11, position: { x: 85, y: 55 }, size: { width: 1020, height: 660 } },
    knowledge_git: { id: 'knowledge_git', title: 'Git Репозиторий Знаний', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 11, position: { x: 95, y: 60 }, size: { width: 1060, height: 700 } },
    calendar: { id: 'calendar', title: 'Календарь & Расписание уроков', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 11, position: { x: 90, y: 55 }, size: { width: 980, height: 640 } },
    focus: { id: 'focus', title: 'Фокус-Студия', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 11, position: { x: 120, y: 70 }, size: { width: 980, height: 640 } },
    chat: { id: 'chat', title: 'ИИ-Оператор', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 12, position: { x: 160, y: 80 }, size: { width: 880, height: 600 } },
    peer: { id: 'peer', title: 'P2P Напарник & Whiteboard', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 13, position: { x: 140, y: 75 }, size: { width: 940, height: 620 } },
    white_screen: { id: 'white_screen', title: 'Белый экран (White Screen)', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 14, position: { x: 100, y: 65 }, size: { width: 920, height: 600 } },
    portfolio: { id: 'portfolio', title: 'Портфолио артефактов', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 15, position: { x: 130, y: 70 }, size: { width: 880, height: 580 } },
    widgets: { id: 'widgets', title: 'Виджеты & Задачи', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 16, position: { x: 150, y: 85 }, size: { width: 860, height: 580 } },
    admin: { id: 'admin', title: 'Контроль качества & Модерация', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 17, position: { x: 110, y: 65 }, size: { width: 960, height: 620 } },
    partner_search: { id: 'partner_search', title: 'Поиск напарника (P2P Matchmaking)', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 18, position: { x: 130, y: 70 }, size: { width: 860, height: 600 } },
    textbook_library: { id: 'textbook_library', title: 'Библиотека учебника', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 19, position: { x: 110, y: 60 }, size: { width: 1100, height: 720 } },
    survey: { id: 'survey', title: 'Входная диагностика & Адаптивный план', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 20, position: { x: 90, y: 50 }, size: { width: 1040, height: 680 } },
    notes: { id: 'notes', title: 'Заметки', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 21, position: { x: 100, y: 60 }, size: { width: 800, height: 500 } },
    settings: { id: 'settings', title: 'Настройки', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 22, position: { x: 100, y: 60 }, size: { width: 800, height: 500 } },
  });

  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const maxZRef = useRef(30);
  const nextWindowZIndex = () => {
    const currentMax = Object.values(floatingWindows).reduce(
      (highest, win) => Math.max(highest, win.zIndex || 0),
      maxZRef.current
    );
    maxZRef.current = currentMax + 1;
    return maxZRef.current;
  };
  const [highlightedStoreMaterialId, setHighlightedStoreMaterialId] = useState<string | null>(null);
  const [showWindowManagerMenu, setShowWindowManagerMenu] = useState(false);
  const [remoteDraggingWindows, setRemoteDraggingWindows] = useState<
    Record<string, { senderName: string; isDragging: boolean }>
  >({});

  useEffect(() => {
    const clampWindowsToViewport = () => {
      setFloatingWindows((prev) => {
        let changed = false;
        const next = { ...prev };
        Object.entries(prev).forEach(([id, win]) => {
          const width = Math.min(win.size?.width || 850, Math.max(1, window.innerWidth - 24));
          const height = Math.min(win.size?.height || 580, Math.max(1, window.innerHeight - 56));
          const x = Math.max(12, Math.min(Number.isFinite(win.position?.x) ? win.position.x : 80, window.innerWidth - width - 12));
          const y = Math.max(44, Math.min(Number.isFinite(win.position?.y) ? win.position.y : 60, window.innerHeight - height - 12));
          if (x !== win.position?.x || y !== win.position?.y) {
            next[id] = { ...win, position: { x, y } };
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    };

    window.addEventListener('resize', clampWindowsToViewport);
    clampWindowsToViewport();
    return () => window.removeEventListener('resize', clampWindowsToViewport);
  }, []);

  // Independent window layouts per user: remote window manipulation disabled to prevent hijacking partner OS desktop
  useEffect(() => {
    // Only listen for explicit shared lesson unit selection if applicable
    const unsub = peerCollabSync.subscribeActions((action) => {
      const { actionType, payload } = action;
      if (actionType === 'unit_select' && payload?.unitId) {
        onSelectUnit?.(payload.unitId);
      }
    });

    return unsub;
  }, [onSelectUnit]);

  // 5. Smart Snap Zones & Laser Alignment Guidelines (Linux / KDE Plasma style)
  const [activeSnapZone, setActiveSnapZone] = useState<SnapZonePreview | null>(null);
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([]);
  const [draggingWindowId, setDraggingWindowId] = useState<string | null>(null);
  const [isSmartSnappingEnabled, setIsSmartSnappingEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('learning_os_smart_snapping');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  const handleToggleSmartSnapping = () => {
    setIsSmartSnappingEnabled((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('learning_os_smart_snapping', String(next));
      }
      return next;
    });
    playChime('click');
  };

  const lastDragSnapBroadcastRef = useRef<Record<string, number>>({});
  const handleDragMoveWithSnapping = (
    winId: string,
    rawPos: { x: number; y: number },
    mouse: { clientX: number; clientY: number },
    winSize: { width: number; height: number }
  ) => {
    setDraggingWindowId(winId);

    const result = computeWindowMagnetDrag(
      winId,
      rawPos,
      mouse,
      winSize,
      window.innerWidth,
      window.innerHeight,
      floatingWindows,
      isSmartSnappingEnabled
    );

    setActiveSnapZone(result.activeSnapZone);
    setAlignmentGuides(result.alignmentGuides);

    const now = Date.now();
    const last = lastDragSnapBroadcastRef.current[winId] || 0;
    if (now - last > 25) {
      lastDragSnapBroadcastRef.current[winId] = now;
      peerCollabSync.broadcastWindowAction('window_move', {
        windowId: winId,
        position: result.snappedPos,
        isDragging: true,
      });
    }

    return { snappedPos: result.snappedPos };
  };

  const handleDragEndWithSnapping = (winId: string) => {
    let finalPos = floatingWindows[winId]?.position || { x: 80, y: 60 };
    let finalSize = floatingWindows[winId]?.size || { width: 880, height: 580 };

    if (activeSnapZone) {
      if (activeSnapZone.type === 'maximize') {
        setFloatingWindows((prev) => ({
          ...prev,
          [winId]: {
            ...prev[winId],
            isMaximized: true,
          },
        }));
        peerCollabSync.broadcastWindowAction('window_maximize', {
          windowId: winId,
          isMaximized: true,
        });
      } else {
        finalPos = { x: activeSnapZone.x, y: activeSnapZone.y };
        finalSize = { width: activeSnapZone.width, height: activeSnapZone.height };
        setFloatingWindows((prev) => ({
          ...prev,
          [winId]: {
            ...prev[winId],
            isMaximized: false,
            position: finalPos,
            size: finalSize,
          },
        }));
        peerCollabSync.broadcastWindowAction('window_resize', {
          windowId: winId,
          position: finalPos,
          size: finalSize,
        });
      }
      playChime('success');
    }

    setActiveSnapZone(null);
    setAlignmentGuides([]);
    setDraggingWindowId(null);

    // Final broadcast for release of window drag
    peerCollabSync.broadcastWindowAction('window_move', {
      windowId: winId,
      position: finalPos,
      isDragging: false,
    });
  };

  // Auto-fit a specific window to occupy the largest unoccupied space without overlapping others
  const handleAutoFitEmptySpace = (winId: string) => {
    const fit = calculateSmartAutoFit(
      winId,
      window.innerWidth,
      window.innerHeight,
      44,
      12,
      10,
      floatingWindows
    );

    setFloatingWindows((prev) => ({
      ...prev,
      [winId]: {
        ...prev[winId],
        isMaximized: false,
        position: { x: fit.x, y: fit.y },
        size: { width: fit.width, height: fit.height },
      },
    }));
    playChime('success');
  };

  // Expand window in a specific direction (double clicking resize handle)
  const handleExpandDirection = (winId: string, dir: 'n' | 's' | 'e' | 'w') => {
    const win = floatingWindows[winId];
    if (!win) return;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const topbarHeight = 44;
    const margin = 12;
    const gap = 10;

    let { x, y } = win.position;
    let { width, height } = win.size;

    const otherWins = Object.values(floatingWindows).filter(
      (ow) => ow.id !== winId && ow.isOpen && !ow.isMinimized
    );

    if (dir === 'e') {
      // Find closest obstacle to the right
      const rightObstacles = otherWins.filter(
        (ow) => ow.position.x > x + width / 2 && Math.max(y, ow.position.y) < Math.min(y + height, ow.position.y + ow.size.height)
      );
      if (rightObstacles.length > 0) {
        const minObsX = Math.min(...rightObstacles.map((o) => o.position.x));
        width = Math.max(300, minObsX - gap - x);
      } else {
        width = screenWidth - margin - x;
      }
    } else if (dir === 'w') {
      // Find closest obstacle to the left
      const leftObstacles = otherWins.filter(
        (ow) => ow.position.x + ow.size.width < x + width / 2 && Math.max(y, ow.position.y) < Math.min(y + height, ow.position.y + ow.size.height)
      );
      if (leftObstacles.length > 0) {
        const maxObsRight = Math.max(...leftObstacles.map((o) => o.position.x + o.size.width));
        const newX = maxObsRight + gap;
        width = x + width - newX;
        x = newX;
      } else {
        width = x + width - margin;
        x = margin;
      }
    } else if (dir === 's') {
      // Find closest obstacle below
      const bottomObstacles = otherWins.filter(
        (ow) => ow.position.y > y + height / 2 && Math.max(x, ow.position.x) < Math.min(x + width, ow.position.x + ow.size.width)
      );
      if (bottomObstacles.length > 0) {
        const minObsY = Math.min(...bottomObstacles.map((o) => o.position.y));
        height = Math.max(220, minObsY - gap - y);
      } else {
        height = screenHeight - margin - y;
      }
    } else if (dir === 'n') {
      // Find closest obstacle above
      const topObstacles = otherWins.filter(
        (ow) => ow.position.y + ow.size.height < y + height / 2 && Math.max(x, ow.position.x) < Math.min(x + width, ow.position.x + ow.size.width)
      );
      if (topObstacles.length > 0) {
        const maxObsBottom = Math.max(...topObstacles.map((o) => o.position.y + o.size.height));
        const newY = maxObsBottom + gap;
        height = y + height - newY;
        y = newY;
      } else {
        height = y + height - topbarHeight;
        y = topbarHeight;
      }
    }

    setFloatingWindows((prev) => ({
      ...prev,
      [winId]: {
        ...prev[winId],
        isMaximized: false,
        position: { x, y },
        size: { width, height },
      },
    }));
    playChime('click');
  };

  // Smart Mosaic: Distribute all open windows into a seamless non-overlapping bento layout
  const handleSmartMosaic = () => {
    const openWins = Object.values(floatingWindows).filter((w) => w.isOpen && !w.isMinimized);
    if (openWins.length === 0) return;

    const mosaic = generateSmartMosaicLayout(
      openWins,
      window.innerWidth,
      window.innerHeight,
      44,
      12,
      10
    );

    const layout: Record<string, { position: { x: number; y: number }; size: { width: number; height: number } }> = {};

    setFloatingWindows((prev) => {
      const next = { ...prev };
      Object.keys(mosaic).forEach((id) => {
        if (next[id]) {
          layout[id] = { position: mosaic[id].position, size: mosaic[id].size };
          next[id] = {
            ...next[id],
            isMaximized: false,
            position: mosaic[id].position,
            size: mosaic[id].size,
          };
        }
      });
      return next;
    });

    peerCollabSync.broadcastWindowAction('window_tile', { layout });
    setShowWindowManagerMenu(false);
    playChime('success');
  };

  // Launch any module as its own floating window
  const handleLaunchModuleWindow = (unitId: string, broadcast = true) => {
    const winId = `focus_${unitId}`;
    const targetUnit = units[unitId] || units[activeNode?.unitId || ''] || Object.values(units)[0];
    const targetTitle = targetUnit?.title || `Модуль: ${unitId}`;
    const nextZ = nextWindowZIndex();
    setActiveWindowId(winId);

    const openWinsCount = Object.values(floatingWindows).filter((w) => w.isOpen).length;
    const staggerX = 50 + (openWinsCount % 6) * 36;
    const staggerY = 45 + (openWinsCount % 6) * 32;

    const winState = {
      id: winId,
      title: `Урок: ${targetTitle}`,
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: nextZ,
      position: floatingWindows[winId]?.position || { x: staggerX, y: staggerY },
      size: floatingWindows[winId]?.size || { width: 960, height: 620 },
    };

    setFloatingWindows((prev) => ({
      ...prev,
      [winId]: winState,
    }));
    onSelectUnit(unitId);
    if (broadcast) {
      peerCollabSync.broadcastWindowAction('window_open', { windowId: winId, state: winState });
      peerCollabSync.broadcastAction('unit_select', { unitId });
    }
    playChime('success');
  };

  // Listen for global launch module events across the OS
  useEffect(() => {
    const handleLaunchEvent = (e: Event) => {
      const custom = e as CustomEvent<{ unitId: string }>;
      if (custom.detail?.unitId) {
        handleLaunchModuleWindow(custom.detail.unitId);
      }
    };
    const handleOpenWindowEvent = (e: Event) => {
      const custom = e as CustomEvent<{ windowId: string }>;
      if (custom.detail?.windowId) {
        if (custom.detail.windowId.startsWith('focus_')) {
          handleLaunchModuleWindow(custom.detail.windowId.replace('focus_', ''));
        } else {
          handleOpenFloatingWindow(custom.detail.windowId);
        }
      }
    };
    window.addEventListener('learning_launch_module_window', handleLaunchEvent as EventListener);
    window.addEventListener('learning_open_window', handleOpenWindowEvent as EventListener);
    return () => {
      window.removeEventListener('learning_launch_module_window', handleLaunchEvent as EventListener);
      window.removeEventListener('learning_open_window', handleOpenWindowEvent as EventListener);
    };
  }, [units, activeNode, floatingWindows]);

  const handleOpenFloatingWindow = (id: string, broadcast = true) => {
    const nextZ = nextWindowZIndex();
    setActiveWindowId(id);
    const winState = {
      id: floatingWindows[id]?.id || id,
      title: floatingWindows[id]?.title || id,
      size: floatingWindows[id]?.size || { width: 880, height: 580 },
      position: floatingWindows[id]?.position || { x: 80, y: 60 },
      isOpen: true,
      isMinimized: false,
      zIndex: nextZ,
    };
    setFloatingWindows((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...winState,
      },
    }));
    if (broadcast) {
      peerCollabSync.broadcastWindowAction('window_open', { windowId: id, state: winState });
    }
    playChime('click');
  };

  const handleOpenStoreFromChat = (materialId?: string) => {
    if (materialId) {
      setHighlightedStoreMaterialId(materialId);
    }
    handleOpenFloatingWindow('admin');
  };

  const handleFocusWindow = (id: string, broadcast = true) => {
    const nextZ = nextWindowZIndex();
    setActiveWindowId(id);
    setFloatingWindows((prev) => ({
      ...prev,
      [id]: { ...prev[id], zIndex: nextZ, isMinimized: false },
    }));
    if (broadcast) {
      peerCollabSync.broadcastWindowAction('window_focus', { windowId: id });
    }
  };

  const handleCloseWindow = (id: string, broadcast = true) => {
    setFloatingWindows((prev) => ({
      ...prev,
      [id]: { ...prev[id], isOpen: false },
    }));
    if (activeWindowId === id) setActiveWindowId(null);
    if (broadcast) {
      peerCollabSync.broadcastWindowAction('window_close', { windowId: id });
    }
    playChime('click');
  };

  const handleMinimizeWindow = (id: string, broadcast = true) => {
    setFloatingWindows((prev) => ({
      ...prev,
      [id]: { ...prev[id], isMinimized: true },
    }));
    if (broadcast) {
      peerCollabSync.broadcastWindowAction('window_minimize', { windowId: id, isMinimized: true });
    }
    playChime('click');
  };

  const handleMaximizeToggle = (id: string, broadcast = true) => {
    const nextMax = !floatingWindows[id]?.isMaximized;
    setFloatingWindows((prev) => ({
      ...prev,
      [id]: { ...prev[id], isMaximized: nextMax },
    }));
    if (broadcast) {
      peerCollabSync.broadcastWindowAction('window_maximize', { windowId: id, isMaximized: nextMax });
    }
    playChime('click');
  };

  const lastWinPosBroadcastRef = useRef<Record<string, number>>({});
  const handleWindowPositionChange = (id: string, pos: { x: number; y: number }, isDragging = true) => {
    setFloatingWindows((prev) => ({
      ...prev,
      [id]: { ...prev[id], position: pos },
    }));
    const now = Date.now();
    const last = lastWinPosBroadcastRef.current[id] || 0;
    if (!isDragging || now - last > 25) {
      lastWinPosBroadcastRef.current[id] = now;
      peerCollabSync.broadcastWindowAction('window_move', {
        windowId: id,
        position: pos,
        isDragging,
      });
    }
  };

  const handleWindowSizeChange = (id: string, size: { width: number; height: number }, pos?: { x: number; y: number }) => {
    setFloatingWindows((prev) => ({
      ...prev,
      [id]: { ...prev[id], size, position: pos || prev[id]?.position },
    }));
    peerCollabSync.broadcastWindowAction('window_resize', {
      windowId: id,
      size,
      position: pos || floatingWindows[id]?.position,
    });
  };

  // MULTI-WINDOW TILING & MULTITASKING ARRANGEMENTS
  const handleTileSideBySide = () => {
    const openWins = Object.values(floatingWindows).filter((w) => w.isOpen && !w.isMinimized);
    if (openWins.length === 0) return;

    const availableW = window.innerWidth - 32;
    const availableH = window.innerHeight - 108;
    const halfW = Math.floor(availableW / 2);

    const layout: Record<string, { position: { x: number; y: number }; size: { width: number; height: number } }> = {};

    setFloatingWindows((prev) => {
      const next = { ...prev };
      openWins.slice(0, 2).forEach((w, idx) => {
        const position = { x: 16 + idx * (halfW + 8), y: 46 };
        const size = { width: halfW - 8, height: availableH };
        layout[w.id] = { position, size };
        next[w.id] = {
          ...w,
          isMaximized: false,
          position,
          size,
        };
      });
      return next;
    });
    peerCollabSync.broadcastWindowAction('window_tile', { layout });
    setShowWindowManagerMenu(false);
    playChime('click');
  };

  const handleTileThreeColumns = () => {
    const openWins = Object.values(floatingWindows).filter((w) => w.isOpen && !w.isMinimized);
    if (openWins.length === 0) return;

    const availableW = window.innerWidth - 32;
    const availableH = window.innerHeight - 108;
    const thirdW = Math.floor(availableW / 3);

    const layout: Record<string, { position: { x: number; y: number }; size: { width: number; height: number } }> = {};

    setFloatingWindows((prev) => {
      const next = { ...prev };
      openWins.slice(0, 3).forEach((w, idx) => {
        const position = { x: 16 + idx * (thirdW + 6), y: 46 };
        const size = { width: thirdW - 6, height: availableH };
        layout[w.id] = { position, size };
        next[w.id] = {
          ...w,
          isMaximized: false,
          position,
          size,
        };
      });
      return next;
    });
    peerCollabSync.broadcastWindowAction('window_tile', { layout });
    setShowWindowManagerMenu(false);
    playChime('click');
  };

  const handleTileMasterDetail = () => {
    const openWins = Object.values(floatingWindows).filter((w) => w.isOpen && !w.isMinimized);
    if (openWins.length === 0) return;

    const availableW = window.innerWidth - 32;
    const availableH = window.innerHeight - 108;
    const masterW = Math.floor(availableW * 0.65);
    const detailW = availableW - masterW - 8;

    const layout: Record<string, { position: { x: number; y: number }; size: { width: number; height: number } }> = {};

    setFloatingWindows((prev) => {
      const next = { ...prev };
      if (openWins[0]) {
        const position = { x: 16, y: 46 };
        const size = { width: masterW, height: availableH };
        layout[openWins[0].id] = { position, size };
        next[openWins[0].id] = { ...openWins[0], isMaximized: false, position, size };
      }
      if (openWins[1]) {
        const position = { x: 16 + masterW + 8, y: 46 };
        const size = { width: detailW, height: availableH };
        layout[openWins[1].id] = { position, size };
        next[openWins[1].id] = { ...openWins[1], isMaximized: false, position, size };
      }
      return next;
    });
    peerCollabSync.broadcastWindowAction('window_tile', { layout });
    setShowWindowManagerMenu(false);
    playChime('click');
  };

  const handleTileGrid = () => {
    const openWins = Object.values(floatingWindows).filter((w) => w.isOpen && !w.isMinimized);
    if (openWins.length === 0) return;

    const availableW = window.innerWidth - 32;
    const availableH = window.innerHeight - 108;
    const halfW = Math.floor(availableW / 2);
    const halfH = Math.floor(availableH / 2);

    const layout: Record<string, { position: { x: number; y: number }; size: { width: number; height: number } }> = {};

    setFloatingWindows((prev) => {
      const next = { ...prev };
      openWins.slice(0, 4).forEach((w, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const position = { x: 16 + col * (halfW + 8), y: 46 + row * (halfH + 6) };
        const size = { width: halfW - 8, height: halfH - 6 };
        layout[w.id] = { position, size };
        next[w.id] = {
          ...w,
          isMaximized: false,
          position,
          size,
        };
      });
      return next;
    });
    peerCollabSync.broadcastWindowAction('window_tile', { layout });
    setShowWindowManagerMenu(false);
    playChime('click');
  };

  const handleCascadeWindows = () => {
    const openWins = Object.values(floatingWindows).filter((w) => w.isOpen && !w.isMinimized);
    if (openWins.length === 0) return;

    const layout: Record<string, { position: { x: number; y: number }; size: { width: number; height: number } }> = {};

    setFloatingWindows((prev) => {
      const next = { ...prev };
      openWins.forEach((w, idx) => {
        const position = { x: 40 + idx * 36, y: 48 + idx * 32 };
        const size = { width: Math.min(920, window.innerWidth - 120), height: Math.min(600, window.innerHeight - 120) };
        layout[w.id] = { position, size };
        next[w.id] = {
          ...w,
          isMaximized: false,
          position,
          size,
        };
      });
      return next;
    });
    peerCollabSync.broadcastWindowAction('window_tile', { layout });
    setShowWindowManagerMenu(false);
    playChime('click');
  };

  const handleMinimizeAllWindows = () => {
    setFloatingWindows((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        if (next[id].isOpen) {
          next[id] = { ...next[id], isMinimized: true };
          peerCollabSync.broadcastWindowAction('window_minimize', { windowId: id, isMinimized: true });
        }
      });
      return next;
    });
    setActiveWindowId(null);
    setShowWindowManagerMenu(false);
    playChime('click');
  };

  const handleRestoreAllWindows = () => {
    setFloatingWindows((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        if (next[id].isOpen) {
          next[id] = { ...next[id], isMinimized: false };
          peerCollabSync.broadcastWindowAction('window_minimize', { windowId: id, isMinimized: false });
        }
      });
      return next;
    });
    setShowWindowManagerMenu(false);
    playChime('click');
  };

  return (
    <div
      onContextMenu={handleContextMenu}
      onClick={handleCloseContextMenu}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={
        !effectiveConfig.applyEverywhere
          ? {
              backgroundImage: getWallpaperCssBackground(effectiveConfig),
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
      className={`h-full w-full relative overflow-hidden select-none flex flex-col ${
        effectiveConfig.applyEverywhere ? 'bg-transparent desktop-surface-clean' : ''
      }`}
    >
      {/* Hidden File Input for Setting Wallpapers from Local Device */}
      <input
        ref={desktopFileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleDesktopFileSelect(file);
        }}
        className="hidden"
      />

      {/* 1. TOP DESKTOP STATUS & ACTION BAR (Google Workspace Minimalism) */}
      <div className="h-10 px-4 bg-white border-b border-[#DADCE0] flex items-center justify-between z-30 shrink-0 text-[#202124] text-xs shadow-none">
        {/* Left: Quick Desktop Info & Running Windows Taskbar */}
        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
          <span className="font-medium text-xs text-[#202124] tracking-tight flex items-center space-x-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#1E8E3E]" />
            <span>Рабочий стол</span>
          </span>
          <span className="text-[#DADCE0] shrink-0">·</span>
          <span className="text-[#5F6368] text-[11px] shrink-0">
            Виджетов: <strong className="text-[#202124] font-medium">{widgets.length}</strong>
          </span>

          {/* Running Windows Taskbar Chips */}
          {Object.values(floatingWindows).filter((w) => w.isOpen).length > 0 && (
            <div className="flex items-center space-x-1 overflow-x-auto max-w-[450px] px-2 py-0.5 bg-[#F1F3F4] rounded-full border border-[#DADCE0] ml-2">
              <span className="text-[10px] text-[#5F6368] uppercase font-medium mr-1 shrink-0">
                Окна:
              </span>
              {Object.values(floatingWindows)
                .filter((w) => w.isOpen)
                .map((w) => {
                  const isFocused = activeWindowId === w.id && !w.isMinimized;
                  return (
                    <button
                      key={w.id}
                      id={`taskbar-chip-${w.id}`}
                      data-window-id={w.id}
                      data-action="focus-window"
                      type="button"
                      onClick={() => {
                        if (w.isMinimized) {
                          handleFocusWindow(w.id);
                        } else if (activeWindowId === w.id) {
                          handleMinimizeWindow(w.id);
                        } else {
                          handleFocusWindow(w.id);
                        }
                        playChime('click');
                      }}
                      className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition cursor-pointer truncate max-w-[130px] shrink-0 ${
                        isFocused
                          ? 'bg-white text-[#1A73E8] shadow-xs'
                          : w.isMinimized
                          ? 'bg-transparent text-[#5F6368] hover:bg-[#E8EAED]'
                          : 'bg-transparent text-[#3C4043] hover:bg-[#E8EAED]'
                      }`}
                      title={`Окно: ${w.title} (${w.isMinimized ? 'Свернуто' : isFocused ? 'Активно' : 'На фоне'})`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isFocused ? 'bg-[#1A73E8]' : w.isMinimized ? 'bg-[#F9AB00]' : 'bg-[#BDC1C6]'
                        }`}
                      />
                      <span className="truncate">{w.title}</span>
                    </button>
                  );
                })}
            </div>
          )}
        </div>

        {/* Center / Right: Desktop Actions & Window Manager */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* PC Desktop Mode Switcher */}
          <button
            type="button"
            onClick={handleToggleLayoutMode}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
              desktopLayoutMode === 'responsive_grid'
                ? 'bg-[#E8F0FE] text-[#1A73E8]'
                : 'bg-[#F1F3F4] hover:bg-[#E8EAED] text-[#3C4043]'
            }`}
            title={
              desktopLayoutMode === 'responsive_grid'
                ? 'Включен режим адаптивной сетки. Нажмите для перехода в свободное перетаскивание.'
                : 'Включен свободный рабочий стол. Нажмите для сетки.'
            }
          >
            {desktopLayoutMode === 'responsive_grid' ? (
              <LayoutGrid className="w-3.5 h-3.5 text-[#1A73E8]" />
            ) : (
              <Grid className="w-3.5 h-3.5 text-[#5F6368]" />
            )}
            <span className="hidden sm:inline">
              {desktopLayoutMode === 'responsive_grid' ? 'Сетка' : 'Свободный'}
            </span>
          </button>

          {/* Quick 1-Click Window Tiling Presets */}
          <div className="hidden lg:flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-[#F1F3F4] border border-[#DADCE0]">
            <button
              type="button"
              onClick={handleTileSideBySide}
              className="px-2 py-0.5 rounded-full text-[11px] font-medium text-[#5F6368] hover:text-[#202124] hover:bg-white transition cursor-pointer"
              title="2 окна рядом: 50% / 50%"
            >
              50/50
            </button>
            <button
              type="button"
              onClick={handleTileThreeColumns}
              className="px-2 py-0.5 rounded-full text-[11px] font-medium text-[#5F6368] hover:text-[#202124] hover:bg-white transition cursor-pointer"
              title="3 окна колонками: 33% / 33% / 33%"
            >
              3 Колонки
            </button>
            <button
              type="button"
              onClick={handleTileGrid}
              className="px-2 py-0.5 rounded-full text-[11px] font-medium text-[#5F6368] hover:text-[#202124] hover:bg-white transition cursor-pointer"
              title="4 окна сеткой 2×2"
            >
              2×2
            </button>
            <button
              type="button"
              onClick={handleSmartMosaic}
              className="px-2 py-0.5 rounded-full text-[11px] font-medium text-[#1E8E3E] hover:bg-[#E6F4EA] transition cursor-pointer flex items-center space-x-1"
              title="Умная мозаика (распределить окна на весь экран)"
            >
              <Sparkles className="w-3 h-3 text-[#1E8E3E]" />
              <span>Мозаика</span>
            </button>
          </div>

          {/* Window Layout & Multitasking Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowWindowManagerMenu((prev) => !prev);
              }}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-[#3C4043] hover:text-[#202124] bg-[#F1F3F4] hover:bg-[#E8EAED] transition cursor-pointer text-xs font-medium"
              title="Управление окнами (многозадачность, плитка, каскад)"
            >
              <Columns className="w-3.5 h-3.5 text-[#5F6368]" />
              <span className="hidden sm:inline">Окна OS</span>
              <ChevronDown className="w-3 h-3 text-[#5F6368]" />
            </button>

            {showWindowManagerMenu && (
              <div
                className="absolute right-0 top-8 w-56 bg-white border border-[#DADCE0] rounded-xl shadow-[0_2px_6px_2px_rgba(60,64,67,0.15)] p-1.5 z-50 text-xs text-[#202124] select-none animate-fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2.5 py-1 text-[10px] uppercase font-medium text-[#5F6368]">
                  Многооконность & Плитка
                </div>
                <button
                  type="button"
                  onClick={handleSmartMosaic}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center space-x-2 text-[#1E8E3E] hover:bg-[#E6F4EA] transition cursor-pointer font-medium mb-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#1E8E3E]" />
                  <span>Умная мозаика (заполнить экран)</span>
                </button>
                <button
                  type="button"
                  onClick={handleTileSideBySide}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center space-x-2 hover:bg-[#F1F3F4] transition cursor-pointer text-[#3C4043] hover:text-[#202124]"
                >
                  <Columns className="w-3.5 h-3.5 text-[#1A73E8]" />
                  <span>2 окна рядом (50 / 50)</span>
                </button>
                <button
                  type="button"
                  onClick={handleTileThreeColumns}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center space-x-2 hover:bg-[#F1F3F4] transition cursor-pointer text-[#3C4043] hover:text-[#202124]"
                >
                  <Columns className="w-3.5 h-3.5 text-[#1A73E8]" />
                  <span>3 колонки (33 / 33 / 33)</span>
                </button>
                <button
                  type="button"
                  onClick={handleTileMasterDetail}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center space-x-2 hover:bg-[#F1F3F4] transition cursor-pointer text-[#3C4043] hover:text-[#202124]"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-[#F9AB00]" />
                  <span>Мастер + Детали (65 / 35)</span>
                </button>
                <button
                  type="button"
                  onClick={handleTileGrid}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center space-x-2 hover:bg-[#F1F3F4] transition cursor-pointer text-[#3C4043] hover:text-[#202124]"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-[#1E8E3E]" />
                  <span>4 окна по сетке (2×2)</span>
                </button>
                <button
                  type="button"
                  onClick={handleCascadeWindows}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center space-x-2 hover:bg-[#F1F3F4] transition cursor-pointer text-[#3C4043] hover:text-[#202124]"
                >
                  <Layers className="w-3.5 h-3.5 text-[#5F6368]" />
                  <span>Каскад окон</span>
                </button>

                <div className="my-1 border-t border-[#DADCE0]" />

                <div className="px-2.5 py-1 text-[10px] uppercase font-medium text-[#5F6368] flex items-center justify-between">
                  <span>Магнитная привязка</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${isSmartSnappingEnabled ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'bg-[#F1F3F4] text-[#5F6368]'}`}>
                    {isSmartSnappingEnabled ? 'ВКЛ' : 'ВЫКЛ'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleToggleSmartSnapping}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-[#F1F3F4] transition cursor-pointer text-[#3C4043] hover:text-[#202124]"
                >
                  <span className="flex items-center space-x-2">
                    <Magnet className="w-3.5 h-3.5 text-[#1A73E8]" />
                    <span>Подсветка зон и лазеры</span>
                  </span>
                  <span className={`text-[10px] font-mono ${isSmartSnappingEnabled ? 'text-[#1E8E3E]' : 'text-[#5F6368]'}`}>
                    {isSmartSnappingEnabled ? 'Активна' : 'Откл'}
                  </span>
                </button>

                <div className="my-1 border-t border-[#DADCE0]" />

                <button
                  type="button"
                  onClick={handleMinimizeAllWindows}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center space-x-2 hover:bg-[#F1F3F4] transition cursor-pointer text-[#3C4043] hover:text-[#202124]"
                >
                  <Minus className="w-3.5 h-3.5 text-[#5F6368]" />
                  <span>Свернуть все окна</span>
                </button>
                <button
                  type="button"
                  onClick={handleRestoreAllWindows}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center space-x-2 hover:bg-[#F1F3F4] transition cursor-pointer text-[#3C4043] hover:text-[#202124]"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-[#5F6368]" />
                  <span>Развернуть все окна</span>
                </button>
              </div>
            )}
          </div>

          {/* Direct File Wallpaper Upload Button */}
          <button
            id="btn-desktop-upload-file"
            type="button"
            onClick={() => desktopFileInputRef.current?.click()}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#F1F3F4] hover:bg-[#E8EAED] text-[#3C4043] hover:text-[#202124] transition cursor-pointer text-xs font-medium"
            title="Установить обои из файла с вашего устройства"
          >
            <Upload className="w-3.5 h-3.5 text-[#5F6368]" />
            <span>Обои из файла</span>
          </button>

          {/* Add Widget Button (Google Blue Primary) */}
          <button
            type="button"
            onClick={() => {
              setIsCatalogOpen(true);
              playChime('click');
            }}
            className="flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-[#1A73E8] hover:bg-[#1967D2] text-white font-medium text-xs transition cursor-pointer shadow-none"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>Добавить виджет</span>
          </button>

          {/* Quick Create Note / Sticky Note Button */}
          <button
            type="button"
            id="btn-desktop-create-note"
            onClick={() => handleAddWidget('sticky_note')}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#F1F3F4] hover:bg-[#E8EAED] text-[#3C4043] hover:text-[#202124] transition cursor-pointer text-xs font-medium"
            title="Создать новую заметку на рабочем столе"
          >
            <Plus className="w-3.5 h-3.5 text-[#F9AB00]" />
            <Pin className="w-3 h-3 text-[#F9AB00]" />
            <span>Заметка</span>
          </button>

          {/* Auto Arrange */}
          <button
            type="button"
            onClick={handleAutoArrange}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] transition cursor-pointer text-xs"
            title="Авторасстановка виджетов по сетке"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Сетка</span>
          </button>

          {/* Wallpaper Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowWallpaperMenu((prev) => !prev);
              }}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-[#3C4043] hover:text-[#202124] bg-[#F1F3F4] hover:bg-[#E8EAED] transition cursor-pointer text-xs font-medium"
              title="Сменить обои"
            >
              <Image className="w-3.5 h-3.5 text-[#5F6368]" />
              <span className="hidden sm:inline">Обои</span>
              <ChevronDown className="w-3 h-3 text-[#5F6368]" />
            </button>

            {/* Lock Screen Button */}
            {onLockScreen && (
              <button
                type="button"
                id="btn-desktop-lock-screen"
                onClick={onLockScreen}
                className="flex items-center space-x-1 px-3 py-1 rounded-full text-[#3C4043] hover:text-[#202124] bg-[#F1F3F4] hover:bg-[#E8EAED] transition cursor-pointer text-xs font-medium ml-1.5"
                title="Заблокировать экран"
              >
                <Lock className="w-3.5 h-3.5 text-[#5F6368]" />
                <span className="hidden md:inline">Заблокировать</span>
              </button>
            )}

            {showWallpaperMenu && (
              <div 
                className="absolute right-0 top-8 w-64 bg-white border border-[#DADCE0] rounded-xl shadow-[0_2px_6px_2px_rgba(60,64,67,0.15)] p-2 z-50 text-xs text-[#202124] select-none animate-fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Action 1: Upload from local file directly */}
                <button
                  type="button"
                  onClick={() => {
                    setShowWallpaperMenu(false);
                    desktopFileInputRef.current?.click();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg flex items-center justify-between bg-[#E8F0FE] text-[#1A73E8] hover:bg-[#D2E3FC] transition cursor-pointer font-medium mb-1 border border-[#D2E3FC]"
                >
                  <span className="flex items-center space-x-2">
                    <Upload className="w-4 h-4 text-[#1A73E8]" />
                    <span>Загрузить фото из файла...</span>
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white text-[#1A73E8]">
                    Файл
                  </span>
                </button>

                {/* Action 2: Open Full Gallery */}
                <button
                  type="button"
                  onClick={() => {
                    setShowWallpaperMenu(false);
                    if (onOpenWallpaperGallery) onOpenWallpaperGallery();
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between text-[#3C4043] hover:bg-[#F1F3F4] transition cursor-pointer font-medium mb-2"
                >
                  <span className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-[#F9AB00]" />
                    <span>Открыть всю галерею...</span>
                  </span>
                </button>

                {/* Custom wallpapers uploaded by user */}
                {getCustomWallpapers().length > 0 && (
                  <div className="mb-2 pb-2 border-b border-[#DADCE0]">
                    <div className="px-2 py-1 text-[10px] text-[#5F6368] uppercase font-medium flex items-center justify-between">
                      <span>Загружено из файлов</span>
                      <span className="text-[9px] text-[#5F6368]">{getCustomWallpapers().length} шт.</span>
                    </div>
                    <div className="space-y-0.5 max-h-28 overflow-y-auto pr-1">
                      {getCustomWallpapers().map((cw) => {
                        const isSelected = effectiveConfig.wallpaperId === cw.id || effectiveConfig.customUrl === cw.url;
                        return (
                          <button
                            key={cw.id}
                            type="button"
                            onClick={() => {
                              if (onUpdateWallpaperConfig) {
                                onUpdateWallpaperConfig({
                                  ...effectiveConfig,
                                  wallpaperId: cw.id,
                                  customUrl: cw.url,
                                });
                              }
                              setShowWallpaperMenu(false);
                              playChime('click');
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer ${
                              isSelected ? 'bg-[#E8F0FE] text-[#1A73E8] font-medium' : 'text-[#3C4043] hover:bg-[#F1F3F4]'
                            }`}
                          >
                            <span className="truncate pr-2">{cw.title}</span>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#1A73E8] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="px-2 py-1 text-[10px] text-[#5F6368] uppercase font-medium flex items-center justify-between">
                  <span>Быстрый выбор</span>
                  <span className="text-[9px] text-[#1A73E8]">Фоном везде</span>
                </div>

                {/* Curated list */}
                <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
                  {[
                    { id: 'mountain-dawn', label: 'Альпийские вершины', tag: 'Горы' },
                    { id: 'nordic-forest', label: 'Туманный лес', tag: 'Природа' },
                    { id: 'aurora-fjord', label: 'Северное сияние', tag: 'Норвегия' },
                    { id: 'orion-nebula', label: 'Туманность Ориона', tag: 'Космос' },
                    { id: 'shinjuku-neon', label: 'Синдзюку Неон', tag: 'Токио' },
                    { id: 'sequoia', label: 'macOS Sequoia', tag: 'Dark' },
                    { id: 'studio_slate', label: 'Studio Graphite', tag: 'Dark' },
                    { id: 'bitrix_flora', label: 'Pure Minimal', tag: 'Light' },
                  ].map((preset) => {
                    const isSelected = effectiveConfig.wallpaperId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectQuickWallpaper(preset.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer ${
                          isSelected ? 'bg-[#E8F0FE] text-[#1A73E8] font-medium' : 'text-[#3C4043] hover:bg-[#F1F3F4]'
                        }`}
                      >
                        <span className="truncate pr-2">{preset.label}</span>
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <span className="text-[9px] text-[#5F6368] font-mono">{preset.tag}</span>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#1A73E8]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Status footer in menu */}
                <div className="mt-2 pt-2 border-t border-[#DADCE0] px-2 flex items-center justify-between text-[11px] text-[#5F6368]">
                  <span>Фон везде:</span>
                  <span className={effectiveConfig.applyEverywhere ? 'text-[#1E8E3E] font-medium' : 'text-[#5F6368]'}>
                    {effectiveConfig.applyEverywhere ? 'Включен на всех экранах' : 'Только рабочий стол'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. DESKTOP CANVAS (Only Draggable Widgets, No Shortcuts) */}
      <div className="flex-1 relative overflow-hidden p-4">
        {/* Drag & Drop Visual File Overlay (Google Drive style) */}
        {isDraggingOverDesktop && (
          <div className="absolute inset-4 z-50 bg-[#E8F0FE]/95 border-2 border-dashed border-[#1A73E8] rounded-2xl flex flex-col items-center justify-center text-[#1A73E8] p-6 animate-fade-in pointer-events-none select-none shadow-md">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-3 text-[#1A73E8] shadow-sm">
              <Upload className="w-8 h-8 animate-bounce" />
            </div>
            <h3 className="text-lg font-medium text-[#202124] mb-1">
              Установить фото как обои
            </h3>
            <p className="text-xs text-[#5F6368] max-w-md text-center leading-relaxed">
              Отпустите файл изображения здесь — оно сразу станет фоном на рабочем столе и везде в системе
            </p>
            <span className="mt-2 text-[11px] text-[#5F6368] font-mono">
              PNG, JPG, JPEG, WebP, GIF, SVG
            </span>
          </div>
        )}

        {/* Wallpaper Notification Toast (Material Snackbar) */}
        {wallpaperNotice && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-[#323232] text-white rounded-lg text-xs shadow-lg flex items-center space-x-2 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-[#81C995] shrink-0" />
            <span>{wallpaperNotice}</span>
          </div>
        )}

        {/* Wallpaper Error Toast (Material Snackbar) */}
        {wallpaperError && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-[#323232] text-white rounded-lg text-xs shadow-lg flex items-center space-x-2 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-[#F28B82] shrink-0" />
            <span>{wallpaperError}</span>
          </div>
        )}

        {/* Empty Widgets Message (Google Clean Card) */}
        {widgets.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none p-4">
            <div className="bg-white border border-[#DADCE0] rounded-2xl p-6 max-w-md w-full shadow-sm flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#F1F3F4] flex items-center justify-center text-[#5F6368] mb-3">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-medium text-[#202124] mb-1">Рабочий стол свободен</h3>
              <p className="text-xs text-[#5F6368] leading-relaxed mb-4">
                Нажмите кнопку ниже, чтобы разместить таймер фокуса, список задач, стикеры или системный монитор
              </p>
              <button
                type="button"
                onClick={() => setIsCatalogOpen(true)}
                className="pointer-events-auto px-4 py-2 rounded-full bg-[#1A73E8] hover:bg-[#1967D2] text-white font-medium text-xs transition cursor-pointer shadow-none"
              >
                + Добавить виджет
              </button>
            </div>
          </div>
        )}

        {/* 3. DESKTOP WIDGETS (Adaptive Responsive PC Grid or Freeform Drag) */}
        {(() => {
          const renderWidgetContent = (widget: DesktopWidgetInstance) => {
            switch (widget.type) {
              case 'pomodoro':
                return (
                  <PomodoroWidget
                    pomodoroMinutes={pomodoroMinutes}
                    pomodoroSecondsLeft={pomodoroSecondsLeft}
                    isPomodoroRunning={isPomodoroRunning}
                    onTogglePomodoro={onTogglePomodoro}
                    onResetPomodoro={onResetPomodoro}
                    onSetPomodoroMinutes={onSetPomodoroMinutes}
                  />
                );
              case 'sticky_note':
                return (
                  <StickyNoteWidget
                    id={widget.id}
                    initialColor={widget.color || 'amber'}
                    notes={notes}
                    onAddNote={onAddNote}
                    onDeleteNote={onDeleteNote}
                    onDelete={() => handleRemoveWidget(widget.id)}
                    onSpawnNewSticky={() => handleAddWidget('sticky_note')}
                  />
                );
              case 'task_list':
                return (
                  <TaskListWidget
                    tasks={tasks}
                    onToggleTask={onToggleTask}
                    onAddTask={onAddTask}
                    onDeleteTask={onDeleteTask}
                  />
                );
              case 'system_monitor':
                return (
                  <SystemMonitorWidget syncStatus={syncStatus} onlinePeersCount={partner ? 2 : 1} />
                );
              case 'ai_insight':
                return (
                  <AiInsightWidget
                    blockTitle={currentBlockInfo.title}
                    blockPhase={currentBlockInfo.phase}
                    blockTopics={currentBlockInfo.topics}
                    currentTopicTitle={currentBlockInfo.currentTopic}
                    domain={currentBlockInfo.domain}
                    studentLevel={currentUser?.userLevel || currentUser?.level || 'intermediate'}
                    onOpenChatWithPrompt={(prompt) => {
                      setChatPrefillPrompt(prompt);
                      if (onOpenChatWithPrompt) {
                        onOpenChatWithPrompt(prompt);
                      } else {
                        setFloatingWindows((prev) => ({
                          ...prev,
                          chat: {
                            ...prev.chat,
                            isOpen: true,
                            isMinimized: false,
                            zIndex: Math.max(...Object.values(prev).map((w) => w.zIndex), 10) + 1,
                          },
                        }));
                        setActiveWindowId('chat');
                        onOpenAppTab('chat');
                      }
                    }}
                    onSaveNote={(title, content, tag) => {
                      onAddNote({
                        id: `note-${Date.now()}`,
                        title,
                        content,
                        tag,
                        createdAt: 'Только что',
                      });
                    }}
                  />
                );
              case 'habits':
                return (
                  <HabitsWidget
                    habits={habits}
                    onToggleHabit={onToggleHabit}
                    onAddHabit={onAddHabit}
                    onDeleteHabit={onDeleteHabit}
                    onUpdateHabit={onUpdateHabit}
                  />
                );
              case 'current_unit':
                return (
                  <CurrentUnitWidget
                    unit={units[activeUnitId] || units[activeNode?.unitId || ''] || Object.values(units)[0]}
                    activeNode={activeNode}
                    nodes={nodes}
                    onLaunchUnit={(uid) => handleLaunchModuleWindow(uid)}
                    onSelectUnit={(uid) => onSelectUnit(uid)}
                    onOpenDag={() => handleOpenFloatingWindow('dag')}
                    onSaveNote={(title, content, tag) => {
                      onAddNote({
                        id: `note-${Date.now()}`,
                        title,
                        content,
                        tag,
                        createdAt: 'Только что',
                      });
                    }}
                  />
                );
              case 'karma_progress':
                return <KarmaWidget karma={karma} />;
              case 'ambient_audio':
                return <AmbientSoundWidget />;
              case 'clock_calendar':
                return <ClockCalendarWidget />;
              case 'byte_converter':
                return <ByteConverterWidget />;
              case 'quick_links':
                return <QuickLinksWidget />;
              case 'memory_retention':
                return (
                  <MemoryRetentionWidget
                    onOpenBlitzModal={onOpenBlitzModal}
                    onOpenDagHeatmap={() => handleOpenFloatingWindow('dag')}
                  />
                );
              default:
                return null;
            }
          };

          const renderWidget = (widget: DesktopWidgetInstance, isGridMode: boolean) => {
            const isFocused = focusedWidgetId === widget.id;
            const isDragging = draggedWidgetId === widget.id;

            return (
              <div
                key={widget.id}
                id={`desktop-widget-${widget.id}`}
                onClick={() => setFocusedWidgetId(widget.id)}
                style={
                  isGridMode
                    ? undefined
                    : {
                        left: widget.x,
                        top: widget.y,
                        width: widget.width || 280,
                        zIndex: isFocused ? 25 : 15,
                      }
                }
                className={`desktop-widget bg-white rounded-xl border border-[#DADCE0] shadow-[0_1px_2px_0_rgba(60,64,67,0.15)] hover:shadow-[0_2px_6px_rgba(60,64,67,0.15)] overflow-hidden transition-all flex flex-col select-none ${
                  isGridMode ? 'relative w-full' : 'absolute'
                } ${isFocused ? 'border-[#1A73E8] ring-1 ring-[#1A73E8]/30 shadow-[0_2px_6px_2px_rgba(60,64,67,0.15)]' : ''} ${
                  isDragging ? 'opacity-90 scale-[1.01] cursor-grabbing shadow-lg' : ''
                }`}
              >
                {/* Widget Header with Drag Handle & Actions */}
                <div
                  onMouseDown={!isGridMode ? (e) => handleWidgetMouseDown(e, widget.id) : undefined}
                  className={`h-8 px-3 bg-[#F8F9FA] border-b border-[#DADCE0] flex items-center justify-between select-none shrink-0 ${
                    !isGridMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 truncate">
                    <span className={`w-1.5 h-1.5 rounded-full ${isFocused ? 'bg-[#1A73E8]' : 'bg-[#BDC1C6]'}`} />
                    <span className="text-[11px] font-medium text-[#202124] tracking-tight truncate">
                      {widget.title}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleCollapseWidget(widget.id);
                      }}
                      className="p-1 rounded-full text-[#5F6368] hover:text-[#202124] hover:bg-[#E8EAED] transition cursor-pointer"
                      title={widget.isCollapsed ? 'Развернуть' : 'Свернуть'}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveWidget(widget.id);
                      }}
                      className="p-1 rounded-full text-[#5F6368] hover:text-[#D93025] hover:bg-[#FCE8E6] transition cursor-pointer"
                      title="Удалить виджет с рабочего стола"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Widget Content Body */}
                {!widget.isCollapsed && (
                  <div className="flex-1 overflow-auto bg-white min-h-[160px] select-text">
                    {renderWidgetContent(widget)}
                  </div>
                )}
              </div>
            );
          };

          if (desktopLayoutMode === 'responsive_grid') {
            return (
              <div className="h-full overflow-y-auto px-4 py-3 pb-24 select-text">
                <div className="pc-adaptive-grid max-w-[2400px] mx-auto">
                  {widgets.map((widget) => renderWidget(widget, true))}
                </div>
              </div>
            );
          }

          return widgets.map((widget) => renderWidget(widget, false));
        })()}

        {/* 4. FLOATING WINDOWS ON THE DESKTOP */}
        {Object.values(floatingWindows).map((win) => {
          if (!win.isOpen) return null;

          return (
            <WindowFrame
              key={win.id}
              window={win}
              isActive={activeWindowId === win.id}
              onFocus={() => handleFocusWindow(win.id)}
              onClose={() => handleCloseWindow(win.id)}
              onMinimize={() => handleMinimizeWindow(win.id)}
              onMaximizeToggle={() => handleMaximizeToggle(win.id)}
              onPositionChange={(pos) => handleWindowPositionChange(win.id, pos)}
              onSizeChange={(size) => handleWindowSizeChange(win.id, size)}
              onAutoFitEmptySpace={handleAutoFitEmptySpace}
              onExpandDirection={handleExpandDirection}
              onDragMoveWithSnapping={handleDragMoveWithSnapping}
              onDragEndWithSnapping={handleDragEndWithSnapping}
              remoteDragUser={remoteDraggingWindows[win.id]?.senderName}
              headerControls={
                <button
                  type="button"
                  onClick={() => onOpenAppTab(win.id.startsWith('focus_') ? 'focus' : win.id)}
                  className="px-2 py-0.5 rounded text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition cursor-pointer flex items-center space-x-1"
                  title="Развернуть во весь экран вкладки"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Во весь экран</span>
                </button>
              }
            >
              {win.id === 'dag' && (
                <DagGraphWindow
                  nodes={nodes}
                  edges={edges}
                  onSelectNode={(nodeId) => {
                    const targetNode = nodes.find((n) => n.id === nodeId);
                    if (targetNode) {
                      onSelectUnit(targetNode.unitId);
                      handleLaunchModuleWindow(targetNode.unitId || targetNode.id);
                    }
                  }}
                  onLaunchUnit={handleLaunchModuleWindow}
                  onOptimizeTrajectory={() => {
                    onMutateGraph('B-Tree: Оптимизация страниц', 'Оптимизация траектории');
                  }}
                  onStartCallWithPartner={(partnerData: any) => {
                    if (onStartCallWithPartner) {
                      onStartCallWithPartner(partnerData);
                    } else {
                      onOpenAppTab('peer');
                    }
                  }}
                  onOpenPeerChat={() => onOpenAppTab('peer')}
                  onInjectProject={onInjectProject}
                  onOpenBlitzModal={onOpenBlitzModal}
                  onOpenKnowledgeSphere={() => handleOpenFloatingWindow('knowledge_sphere')}
                  cadenceSettings={cadenceSettings}
                />
              )}

              {win.id === 'knowledge_sphere' && (
                <KnowledgeSphereWindow
                  nodes={nodes}
                  edges={edges}
                  units={units}
                  artifacts={artifacts}
                  activeUnitId={activeUnitId}
                  onLaunchUnit={handleLaunchModuleWindow}
                  onOpenDag={() => handleOpenFloatingWindow('dag')}
                  onOpenFocusStudio={(unitId) => handleLaunchModuleWindow(unitId)}
                  onOpenPeerSparring={() => handleOpenFloatingWindow('peer')}
                  onInjectProject={onInjectProject}
                />
              )}

              {win.id === 'knowledge_git' && (
                <KnowledgeGitWindow
                  nodes={nodes}
                  notes={notes}
                  artifacts={artifacts}
                  units={units}
                  onLaunchUnit={handleLaunchModuleWindow}
                />
              )}

              {win.id === 'textbook_library' && (
                <TextbookLibraryWindow
                  nodes={nodes}
                  activeUnitId={activeUnitId}
                  units={units}
                  onLaunchUnit={handleLaunchModuleWindow}
                  onUpdateUnit={onUpdateUnit}
                />
              )}

              {win.id === 'calendar' && (
                <CalendarWindow
                  nodes={nodes}
                  onLaunchUnit={handleLaunchModuleWindow}
                  onStartCallWithPartner={(partnerData: any) => {
                    if (onStartCallWithPartner) {
                      onStartCallWithPartner(partnerData);
                    } else {
                      onOpenAppTab('peer');
                    }
                  }}
                  partner={partner}
                  skillDomain={localStorage.getItem('learning_os_target_domain') || 'Универсальные навыки'}
                  onMarkLessonCompleted={onLessonCompleted || (() => {})}
                />
              )}

              {(win.id.startsWith('focus_') || win.id.startsWith('module_') || win.id === 'focus') && (() => {
                const targetUnitId = win.id.replace(/^(focus_|module_)/, '') || activeUnitId;
                const activeUnitObj = units[targetUnitId] || units[activeNode?.unitId || ''] || Object.values(units)[0];
                const activeNodeIdx = nodes.findIndex((n) => n.unitId === targetUnitId || n.id === targetUnitId);
                const blockNumber = activeNodeIdx >= 0 ? activeNodeIdx + 1 : 1;
                const precedingTopics = nodes.slice(0, activeNodeIdx >= 0 ? activeNodeIdx + 1 : 1).map((n) => n.title);
                return (
                  <FocusStudioWindow
                    unit={activeUnitObj}
                    minimumPassingScore={nodes.find((node) => node.unitId === targetUnitId || node.id === targetUnitId)?.passingScore ?? 70}
                    partner={partner}
                    blockNumber={blockNumber}
                    totalBlocksCount={nodes.length}
                    precedingTopics={precedingTopics}
                    onSaveNote={(title, content, tag) => {
                      onAddNote({
                        id: `note-${Date.now()}`,
                        title,
                        content,
                        tag,
                        unitId: targetUnitId,
                        createdAt: 'Только что',
                      });
                    }}
                    onSaveArtifact={onSaveArtifact || (() => {})}
                    onStuckDetected={() => {
                      onMutateGraph('B-Tree: Граничные условия', 'Зафиксирован затык на тесте');
                    }}
                    onLaunchBuddyWhiteboard={() => onOpenAppTab('peer')}
                    onLessonCompleted={onLessonCompleted}
                    onUpdateUnit={onUpdateUnit || (() => {})}
                    onInjectProject={onInjectProject}
                    onPartnerMatched={onPartnerMatched}
                    onStartCallWithPartner={onStartCallWithPartner}
                    onMatchBuddy={() => handleOpenFloatingWindow('partner_search')}
                    onInjectGapClosureNode={(gapBlock) => {
                      onMutateGraph(gapBlock.targetSubtopic, gapBlock.triggerReason);
                    }}
                    cadenceSettings={cadenceSettings}
                    onUpdateCadenceSettings={onUpdateCadenceSettings}
                  />
                );
              })()}

              {win.id === 'chat' && (
                <AiOperatorWindow
                  activeNodeTitle={units[activeUnitId]?.title || 'Фундамент и деконструкция навыка'}
                  karma={karma}
                  pomodoroMinutes={pomodoroMinutes}
                  targetRole="Практик & Ученик"
                  initialPrompt={chatPrefillPrompt}
                  onClearInitialPrompt={() => setChatPrefillPrompt('')}
                  materials={materials}
                  onOpenStore={handleOpenStoreFromChat}
                  onDeployMaterial={onDeployMaterialToCourse}
                  onMutateGraph={onMutateGraph}
                  onInjectProject={onInjectProject}
                  onSetPomodoro={(mins, start) => {
                    onSetPomodoroMinutes(mins);
                    if (start) onTogglePomodoro();
                  }}
                  onCreateNote={(title, content, tag) => {
                    onAddNote({
                      id: `note-${Date.now()}`,
                      title,
                      content,
                      tag,
                      createdAt: 'Только что',
                    });
                  }}
                  onAddTask={onAddTask}
                  onMatchBuddy={() => handleOpenFloatingWindow('partner_search')}
                />
              )}

              {win.id === 'peer' && (
                <PeerCollabWindow
                  partner={partner}
                  onPartnerMatched={onPartnerMatched}
                  isSearchingBuddy={false}
                  onStartMatchmaking={() => handleOpenFloatingWindow('partner_search')}
                  onDisconnectPartner={onDisconnectPartner}
                  onSyncWithMainPlayer={() => onOpenAppTab('focus')}
                  initialTab="workspace"
                  nodes={nodes}
                  notes={notes}
                  habits={habits}
                  activeUnitId={activeUnitId}
                  activeUnit={units[activeUnitId] || units['unit-1']}
                  onSelectUnit={onSelectUnit}
                  onAdoptProfileNode={onAdoptProfileNode}
                  onStartSolo={() => onOpenAppTab('focus')}
                  onSaveNote={(title, content, tag) => {
                    onAddNote({
                      id: `note-${Date.now()}`,
                      title,
                      content,
                      tag,
                      createdAt: 'Только что',
                    });
                  }}
                  onSaveArtifact={onSaveArtifact || (() => {})}
                  onLessonCompleted={onLessonCompleted}
                  currentUser={currentUser}
                />
              )}

              {win.id === 'white_screen' && (
                <WhiteScreenWindow
                  partnerName={partner?.name || 'Напарник'}
                  partnerRole="Navigator"
                  onOpenCollabHub={() => onOpenAppTab('peer')}
                />
              )}

              {win.id === 'portfolio' && (
                <PortfolioWindow
                  artifacts={artifacts}
                  ownerUid={currentUser?.uid}
                  ownerName={currentUser?.displayName}
                  ownerAvatar={currentUser?.photoURL}
                />
              )}

              {(win.id === 'widgets' || win.id === 'notes') && (
                <WidgetsWindow
                  notes={notes}
                  tasks={tasks}
                  habits={habits}
                  karma={karma}
                  onAddNote={onAddNote}
                  onDeleteNote={onDeleteNote}
                  onToggleTask={onToggleTask}
                  onAddTask={onAddTask}
                  onToggleHabit={onToggleHabit}
                  pomodoroMinutes={pomodoroMinutes}
                  pomodoroSecondsLeft={pomodoroSecondsLeft}
                  isPomodoroRunning={isPomodoroRunning}
                  onTogglePomodoro={onTogglePomodoro}
                  onResetPomodoro={onResetPomodoro}
                  onSetPomodoroMinutes={onSetPomodoroMinutes}
                />
              )}

              {win.id === 'settings' && <KeyboardShortcutsWindow />}

              {win.id === 'survey' && (
                <DiagnosticSurveyWindow
                  onApplyGeneratedPath={(newNodes, newEdges, summary, genUnits) => {
                    if (onApplyGeneratedPath) {
                      onApplyGeneratedPath(newNodes, newEdges, summary, genUnits);
                    }
                    handleCloseWindow('survey');
                  }}
                  onClose={() => handleCloseWindow('survey')}
                  onLaunchUnit={handleLaunchModuleWindow}
                  onNavigateToDag={() => {
                    handleCloseWindow('survey');
                    handleOpenFloatingWindow('dag');
                  }}
                  adminUnits={adminUnits}
                  matchedPartner={partner}
                  onPartnerMatched={onPartnerMatched}
                  onOpenPeerWindow={() => {
                    handleCloseWindow('survey');
                    handleOpenFloatingWindow('peer');
                  }}
                  onStartCallWithPartner={onStartCallWithPartner}
                  currentUser={currentUser}
                  existingNodes={nodes}
                  existingEdges={edges}
                  existingUnits={units}
                  onLessonCompleted={onLessonCompleted}
                />
              )}

              {win.id === 'admin' && (
                <AdminConsoleWindow
                  units={adminUnits}
                  onUpdateUnit={onUpdateAdminUnits}
                  materials={materials}
                  onUpdateMaterials={onUpdateMaterials}
                  onDeployMaterialToCourse={onDeployMaterialToCourse}
                  initialTab="store"
                  highlightMaterialId={highlightedStoreMaterialId}
                />
              )}

              {win.id === 'partner_search' && (
                <PartnerSearchWindow
                  partner={partner}
                  onPartnerMatched={onPartnerMatched}
                  onDisconnectPartner={onDisconnectPartner}
                  onOpenPeerWindow={() => {
                    handleCloseWindow('partner_search');
                    handleOpenFloatingWindow('peer');
                  }}
                  onStartCallWithPartner={onStartCallWithPartner}
                  currentUser={currentUser}
                  nodes={nodes}
                  notes={notes}
                  habits={habits}
                  activeUnitId={activeUnitId}
                  onSelectUnit={onSelectUnit}
                  onSaveNote={(title, content, tag) => {
                    onAddNote({
                      id: `shared-note-${Date.now()}`,
                      title,
                      content,
                      tag,
                      createdAt: new Date().toISOString(),
                    });
                  }}
                  skillDomain={localStorage.getItem('learning_os_target_domain') || 'Универсальные навыки'}
                  targetGoal="Свободная практика и спарринг"
                  onClose={() => handleCloseWindow('partner_search')}
                />
              )}
            </WindowFrame>
          );
        })}

        {/* 5. LINUX/KDE-STYLE SMART SNAP ZONE PREVIEW & LASER ALIGNMENT GUIDELINES */}
        <WindowSnapOverlay
          activeSnapZone={activeSnapZone}
          alignmentGuides={alignmentGuides}
          isDraggingWindow={Boolean(draggingWindowId)}
          draggingWindowTitle={
            draggingWindowId ? (floatingWindows[draggingWindowId]?.title || 'Окно') : undefined
          }
        />
      </div>

      {/* 6. RIGHT CLICK CONTEXT MENU (Google Style) */}
      {contextMenu.isOpen && (
        <div
          style={{ left: contextMenu.x, top: contextMenu.y }}
          className="fixed z-50 w-60 bg-white border border-[#DADCE0] rounded-xl shadow-[0_2px_6px_2px_rgba(60,64,67,0.15)] p-1.5 text-xs text-[#202124] select-none animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2.5 py-1 text-[10px] text-[#5F6368] uppercase font-medium">
            Рабочий стол
          </div>

          <button
            type="button"
            onClick={() => {
              handleCloseContextMenu();
              setIsCatalogOpen(true);
              playChime('click');
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center space-x-2 text-[#3C4043] hover:text-[#202124] hover:bg-[#F1F3F4] transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#1A73E8]" />
            <span>+ Добавить виджет...</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleCloseContextMenu();
              handleAddWidget('sticky_note');
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center space-x-2 text-[#3C4043] hover:text-[#202124] hover:bg-[#F1F3F4] transition cursor-pointer"
          >
            <Pin className="w-3.5 h-3.5 text-[#F9AB00]" />
            <span>Новый стикер-заметка</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleCloseContextMenu();
              handleSmartMosaic();
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center space-x-2 text-[#1E8E3E] hover:bg-[#E6F4EA] transition cursor-pointer font-medium"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#1E8E3E]" />
            <span>Умная мозаика (все окна)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleCloseContextMenu();
              handleAutoArrange();
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center space-x-2 text-[#3C4043] hover:text-[#202124] hover:bg-[#F1F3F4] transition cursor-pointer"
          >
            <Grid className="w-3.5 h-3.5 text-[#1A73E8]" />
            <span>Упорядочить виджеты по сетке</span>
          </button>

          {/* Magnetic Snapping and Drop Zone Highlighting */}
          <button
            type="button"
            onClick={() => {
              handleCloseContextMenu();
              handleToggleSmartSnapping();
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-[#3C4043] hover:text-[#202124] hover:bg-[#F1F3F4] transition cursor-pointer"
          >
            <span className="flex items-center space-x-2">
              <Magnet className="w-3.5 h-3.5 text-[#1A73E8]" />
              <span>Магнитные зоны и направляющие</span>
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
              isSmartSnappingEnabled ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'bg-[#F1F3F4] text-[#5F6368]'
            }`}>
              {isSmartSnappingEnabled ? 'Вкл' : 'Выкл'}
            </span>
          </button>

          <div className="h-px bg-[#DADCE0] my-1" />

          {/* Direct File Upload from Context Menu */}
          <button
            type="button"
            onClick={() => {
              handleCloseContextMenu();
              desktopFileInputRef.current?.click();
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center space-x-2 text-[#1A73E8] hover:bg-[#E8F0FE] transition cursor-pointer font-medium"
          >
            <Upload className="w-3.5 h-3.5 text-[#1A73E8]" />
            <span>Установить обои из файла...</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleCloseContextMenu();
              if (onOpenWallpaperGallery) {
                onOpenWallpaperGallery();
              } else {
                setShowWallpaperMenu(true);
              }
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center space-x-2 text-[#3C4043] hover:text-[#202124] hover:bg-[#F1F3F4] transition cursor-pointer"
          >
            <Image className="w-3.5 h-3.5 text-[#5F6368]" />
            <span>Галерея обоев (настроить)...</span>
          </button>

          {onOpenPersonalization && (
            <button
              type="button"
              onClick={() => {
                handleCloseContextMenu();
                onOpenPersonalization();
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center space-x-2 text-[#F9AB00] hover:bg-[#FEF7E0] transition cursor-pointer font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#F9AB00]" />
              <span>Персонализировать систему...</span>
            </button>
          )}

          {/* Toggle Apply Everywhere */}
          <button
            type="button"
            onClick={() => {
              handleCloseContextMenu();
              if (onUpdateWallpaperConfig) {
                onUpdateWallpaperConfig({
                  ...effectiveConfig,
                  applyEverywhere: !effectiveConfig.applyEverywhere,
                });
                playChime('click');
              }
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-[#3C4043] hover:text-[#202124] hover:bg-[#F1F3F4] transition cursor-pointer"
          >
            <span className="flex items-center space-x-2">
              <Layers className="w-3.5 h-3.5 text-[#5F6368]" />
              <span>Фон везде в системе</span>
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
              effectiveConfig.applyEverywhere ? 'bg-[#E6F4EA] text-[#1E8E3E]' : 'bg-[#F1F3F4] text-[#5F6368]'
            }`}>
              {effectiveConfig.applyEverywhere ? 'Вкл' : 'Выкл'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleCloseContextMenu();
              handleResetToDefaults();
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center space-x-2 text-[#3C4043] hover:text-[#202124] hover:bg-[#F1F3F4] transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#5F6368]" />
            <span>Сбросить виджеты к стандарту</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleCloseContextMenu();
              handleClearAll();
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center space-x-2 text-[#D93025] hover:bg-[#FCE8E6] transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Очистить рабочий стол</span>
          </button>
        </div>
      )}

      {/* 5. BOTTOM ADAPTIVE OS APP DOCK (Google Material 3 Shelf) */}
      <nav 
        className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 px-2.5 py-1.5 rounded-2xl bg-white border border-[#DADCE0] shadow-[0_2px_6px_2px_rgba(60,64,67,0.15)] flex items-center space-x-1 select-none animate-fade-in"
        aria-label="Панель приложений рабочего стола"
      >
        {[
          { id: 'desktop', label: 'Рабочий стол', icon: Monitor },
          { id: 'dag', label: 'DAG-Граф', icon: Network },
          { id: 'knowledge_sphere', label: 'Сфера знаний 3D', icon: Atom },
          { id: 'knowledge_git', label: 'Git Знаний', icon: GitBranch },
          { id: 'textbook_library', label: 'Учебник', icon: BookOpen },
          { id: 'calendar', label: 'Календарь', icon: Calendar },
          { id: 'focus', label: 'Фокус-Студия', icon: Tv },
          { id: 'peer', label: 'P2P Напарник', icon: Users },
          { id: 'chat', label: 'ИИ-Оператор', icon: Bot },
          { id: 'white_screen', label: 'Белый экран', icon: PenTool },
          { id: 'portfolio', label: 'Портфолио', icon: Award },
          { id: 'settings', label: 'Настройки клавиш', icon: Settings2 },
          { id: 'widgets', label: 'Виджеты & Задачи', icon: LayoutGrid },
          { id: 'admin', label: 'Модерация & Магазин', icon: ShieldCheck },
        ].map((app) => {
          const isOpen = floatingWindows[app.id]?.isOpen;
          const isFocused = activeWindowId === app.id && !floatingWindows[app.id]?.isMinimized;
          const Icon = app.icon;

          return (
            <button
              key={app.id}
              type="button"
              id={`dock-app-${app.id}`}
              onClick={() => {
                if (app.id === 'desktop') {
                  onOpenAppTab('desktop');
                } else if (isOpen) {
                  if (isFocused) {
                    handleMinimizeWindow(app.id);
                  } else {
                    handleFocusWindow(app.id);
                  }
                } else {
                  handleOpenFloatingWindow(app.id);
                }
                playChime('click');
              }}
              className={`desktop-dock-item relative p-2 rounded-xl flex items-center justify-center transition cursor-pointer group ${
                isFocused
                  ? 'bg-[#E8F0FE] text-[#1A73E8]'
                  : isOpen
                  ? 'bg-[#F1F3F4] text-[#202124]'
                  : 'text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4]'
              }`}
              title={`${app.label} (${isOpen ? (isFocused ? 'Активно · Свернуть' : 'Развернуть') : 'Запустить окно'})`}
            >
              <Icon className="w-4 h-4" />
              {isOpen && (
                <span 
                  className={`absolute -bottom-0.5 w-1 h-1 rounded-full ${
                    isFocused ? 'bg-[#1A73E8]' : 'bg-[#BDC1C6]'
                  }`} 
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* 6. WIDGET CATALOG MODAL */}
      <WidgetCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        activeWidgets={widgets}
        onAddWidget={(type) => {
          handleAddWidget(type);
          setIsCatalogOpen(false);
        }}
        onResetToDefaults={() => {
          handleResetToDefaults();
          setIsCatalogOpen(false);
        }}
        onClearAll={() => {
          handleClearAll();
          setIsCatalogOpen(false);
        }}
      />
    </div>
  );
};
