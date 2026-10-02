import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  PenTool,
  Highlighter,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Type,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Hand,
  StickyNote,
  Check,
  Sparkles,
  Save,
  MousePointer2,
  CloudCheck,
  Layers,
  Palette
} from 'lucide-react';
import { playChime } from '../../utils/audio.ts';
import { peerCollabSync } from '../../services/peerCollabSync.ts';
import { communityRoomService } from '../../services/communityRoomService.ts';

export type WhiteboardTool =
  | 'select'
  | 'hand'
  | 'pen'
  | 'highlighter'
  | 'line'
  | 'arrow'
  | 'rect'
  | 'circle'
  | 'sticky'
  | 'text'
  | 'eraser';

export interface BoardSticky {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
  author?: string;
}

export interface BoardShape {
  id: string;
  tool: 'pen' | 'highlighter' | 'line' | 'arrow' | 'rect' | 'circle' | 'text';
  color: string;
  strokeWidth: number;
  fill?: boolean;
  points?: Array<{ x: number; y: number }>;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  text?: string;
  fontSize?: number;
}

const GOOGLE_COLORS = [
  { label: 'Черный', value: '#202124' },
  { label: 'Google Blue', value: '#1a73e8' },
  { label: 'Google Red', value: '#ea4335' },
  { label: 'Google Green', value: '#34a853' },
  { label: 'Google Yellow', value: '#f9ab00' },
  { label: 'Purple', value: '#9333ea' },
  { label: 'Slate', value: '#5f6368' },
];

const STICKY_COLORS = [
  { label: 'Желтый', value: '#fef08a' },
  { label: 'Синий', value: '#bfdbfe' },
  { label: 'Зеленый', value: '#bbf7d0' },
  { label: 'Розовый', value: '#fbcfe8' },
  { label: 'Фиолетовый', value: '#e9d5ff' },
  { label: 'Оранжевый', value: '#fed7aa' },
];

interface InfiniteWhiteboardProps {
  roomId?: string;
  roomName?: string;
  currentUser?: { uid: string; displayName: string; photoURL?: string } | null;
}

export const InfiniteWhiteboard: React.FC<InfiniteWhiteboardProps> = ({
  roomId = 'default-room',
  roomName = 'Учебная комната',
  currentUser
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Active Tool & Styles
  const [activeTool, setActiveTool] = useState<WhiteboardTool>('pen');
  const [activeColor, setActiveColor] = useState<string>('#1a73e8');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [fillShape, setFillShape] = useState<boolean>(false);
  const [stickyBg, setStickyBg] = useState<string>('#fef08a');

  // Infinite Canvas Viewport (Pan & Zoom)
  const [viewTransform, setViewTransform] = useState<{ x: number; y: number; scale: number }>({
    x: 0,
    y: 0,
    scale: 1.0,
  });

  // Stored Elements: Shapes & Freehand Drawings isolated by roomId
  const [shapes, setShapes] = useState<BoardShape[]>([]);
  const [stickies, setStickies] = useState<BoardSticky[]>([]);
  const [redoStack, setRedoStack] = useState<{ shapes: BoardShape[]; stickies: BoardSticky[] }[]>([]);
  const [undoStack, setUndoStack] = useState<{ shapes: BoardShape[]; stickies: BoardSticky[] }[]>([]);

  const [liveDrawing, setLiveDrawing] = useState<BoardShape | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [editingStickyId, setEditingStickyId] = useState<string | null>(null);
  const [activeTextInput, setActiveTextInput] = useState<{ x: number; y: number; text: string } | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Синхронизировано');
  const [showClearModal, setShowClearModal] = useState(false);
  const [isLoadingBoard, setIsLoadingBoard] = useState(true);

  // 1. Load whiteboard data for current roomId
  useEffect(() => {
    let isMounted = true;
    setIsLoadingBoard(true);

    const loadRoomData = async () => {
      // 1. Try local storage cache for instant rendering
      let localShapes: BoardShape[] | null = null;
      let localStickies: BoardSticky[] | null = null;
      try {
        const savedS = localStorage.getItem(`whiteboard_shapes_${roomId}`);
        const savedSt = localStorage.getItem(`whiteboard_stickies_${roomId}`);
        if (savedS) localShapes = JSON.parse(savedS);
        if (savedSt) localStickies = JSON.parse(savedSt);
      } catch (e) {
        console.warn('Local read err', e);
      }

      if (localShapes && localStickies) {
        if (isMounted) {
          setShapes(localShapes);
          setStickies(localStickies);
          setIsLoadingBoard(false);
        }
      }

      // 2. Fetch from server per-room store
      try {
        const res = await communityRoomService.getRoomWhiteboard(roomId, currentUser?.uid);
        if (isMounted && res.success && res.whiteboard) {
          setShapes(res.whiteboard.shapes || []);
          setStickies(res.whiteboard.stickies || []);
          localStorage.setItem(`whiteboard_shapes_${roomId}`, JSON.stringify(res.whiteboard.shapes || []));
          localStorage.setItem(`whiteboard_stickies_${roomId}`, JSON.stringify(res.whiteboard.stickies || []));
          setLastSavedTime('Синхронизировано');
        } else if (!localShapes) {
          // Fallback initial template for new room
          const defaultShapes: BoardShape[] = [
            {
              id: `box-${roomId}-1`,
              tool: 'rect',
              color: '#1a73e8',
              strokeWidth: 2,
              start: { x: 100, y: 100 },
              end: { x: 380, y: 180 },
              fill: false,
            },
            {
              id: `txt-${roomId}-1`,
              tool: 'text',
              color: '#202124',
              strokeWidth: 15,
              start: { x: 120, y: 145 },
              text: `🎯 Пространство: ${roomName.slice(0, 30)}`,
              fontSize: 14,
            },
            {
              id: `arr-${roomId}-1`,
              tool: 'arrow',
              color: '#5f6368',
              strokeWidth: 2,
              start: { x: 240, y: 180 },
              end: { x: 240, y: 260 },
            },
            {
              id: `circ-${roomId}-1`,
              tool: 'circle',
              color: '#34a853',
              strokeWidth: 2,
              start: { x: 140, y: 260 },
              end: { x: 340, y: 350 },
              fill: false,
            },
            {
              id: `txt-${roomId}-2`,
              tool: 'text',
              color: '#202124',
              strokeWidth: 14,
              start: { x: 165, y: 310 },
              text: '⚡ Общие инварианты',
              fontSize: 13,
            }
          ];
          const defaultStickies: BoardSticky[] = [
            {
              id: `st-${roomId}-1`,
              x: 430,
              y: 100,
              width: 210,
              height: 140,
              text: `📌 Доска комнаты «${roomName.slice(0, 24)}»:\nЗдесь сохраняются схемы и заметки участников.`,
              color: '#fef08a',
              author: currentUser?.displayName || 'Организатор',
            }
          ];
          if (isMounted) {
            setShapes(defaultShapes);
            setStickies(defaultStickies);
          }
        }
      } catch (e) {
        console.warn('Error syncing room whiteboard:', e);
      } finally {
        if (isMounted) setIsLoadingBoard(false);
      }
    };

    loadRoomData();

    return () => {
      isMounted = false;
    };
  }, [roomId, roomName]);

  // 2. Debounced save per roomId
  useEffect(() => {
    if (isLoadingBoard) return;
    try {
      localStorage.setItem(`whiteboard_shapes_${roomId}`, JSON.stringify(shapes));
      localStorage.setItem(`whiteboard_stickies_${roomId}`, JSON.stringify(stickies));
    } catch (e) {
      console.warn('Local save err', e);
    }

    const timer = setTimeout(() => {
      communityRoomService.saveRoomWhiteboard(roomId, { shapes, stickies }, currentUser?.uid)
        .then((result) => {
          setLastSavedTime(result.success
            ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            : 'Нет синхронизации');
        })
        .catch(() => {});
    }, 1200);

    return () => clearTimeout(timer);
  }, [shapes, stickies, roomId, isLoadingBoard, currentUser?.uid]);

  // 3. Subscriptions to peer sync
  useEffect(() => {
    const unsubStrokes = peerCollabSync.subscribeStrokes((stroke) => {
      const pts: Array<{ x: number; y: number }> = [];
      for (let i = 0; i < stroke.points.length; i += 2) {
        pts.push({ x: stroke.points[i], y: stroke.points[i + 1] });
      }
      const newShape: BoardShape = {
        id: stroke.id,
        tool: (stroke.tool as any) || 'pen',
        color: stroke.color,
        strokeWidth: stroke.strokeWidth,
        points: pts,
      };
      setShapes((prev) => (prev.some((s) => s.id === stroke.id) ? prev : [...prev, newShape]));
    });

    const unsubActions = peerCollabSync.subscribeActions((action) => {
      if (action.actionType === 'whiteboard_clear') {
        setShapes([]);
        setStickies([]);
      } else if (action.actionType === 'whiteboard_sticky_add' && action.payload?.sticky) {
        const s = action.payload.sticky as BoardSticky;
        setStickies((prev) => (prev.some((item) => item.id === s.id) ? prev : [...prev, s]));
      }
    });

    return () => {
      unsubStrokes();
      unsubActions();
    };
  }, []);

  // Screen Coordinates to Board Virtual Coordinates
  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      const { x, y, scale } = viewTransform;
      return {
        x: (screenX - x) / scale,
        y: (screenY - y) / scale,
      };
    },
    [viewTransform]
  );

  // Redraw Canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    // Apply Infinite Viewport Transform
    ctx.translate(viewTransform.x, viewTransform.y);
    ctx.scale(viewTransform.scale, viewTransform.scale);

    // Google Minimalist Dot Grid
    const gridSize = 32;
    const startX = Math.floor((-viewTransform.x / viewTransform.scale) / gridSize) * gridSize - gridSize;
    const startY = Math.floor((-viewTransform.y / viewTransform.scale) / gridSize) * gridSize - gridSize;
    const endX = startX + (width / viewTransform.scale) + gridSize * 2;
    const endY = startY + (height / viewTransform.scale) + gridSize * 2;

    ctx.fillStyle = '#dadce0';
    for (let gx = startX; gx < endX; gx += gridSize) {
      for (let gy = startY; gy < endY; gy += gridSize) {
        ctx.beginPath();
        ctx.arc(gx, gy, 1.1 / Math.max(0.5, viewTransform.scale), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw Shape Helper
    const drawShape = (s: BoardShape) => {
      ctx.strokeStyle = s.color;
      ctx.fillStyle = s.color;
      ctx.lineWidth = s.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (s.tool === 'pen' || s.tool === 'highlighter') {
        if (!s.points || s.points.length === 0) return;
        ctx.save();
        if (s.tool === 'highlighter') {
          ctx.globalAlpha = 0.35;
          ctx.lineWidth = s.strokeWidth * 3.5;
        }
        ctx.beginPath();
        ctx.moveTo(s.points[0].x, s.points[0].y);
        for (let i = 1; i < s.points.length; i++) {
          ctx.lineTo(s.points[i].x, s.points[i].y);
        }
        ctx.stroke();
        ctx.restore();
      } else if (s.tool === 'line') {
        if (!s.start || !s.end) return;
        ctx.beginPath();
        ctx.moveTo(s.start.x, s.start.y);
        ctx.lineTo(s.end.x, s.end.y);
        ctx.stroke();
      } else if (s.tool === 'arrow') {
        if (!s.start || !s.end) return;
        const fromX = s.start.x;
        const fromY = s.start.y;
        const toX = s.end.x;
        const toY = s.end.y;
        const headlen = Math.max(12, s.strokeWidth * 3);
        const angle = Math.atan2(toY - fromY, toX - fromX);

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      } else if (s.tool === 'rect') {
        if (!s.start || !s.end) return;
        const rx = Math.min(s.start.x, s.end.x);
        const ry = Math.min(s.start.y, s.end.y);
        const rw = Math.abs(s.end.x - s.start.x);
        const rh = Math.abs(s.end.y - s.start.y);

        if (s.fill) {
          ctx.save();
          ctx.globalAlpha = 0.12;
          ctx.fillRect(rx, ry, rw, rh);
          ctx.restore();
        }
        ctx.strokeRect(rx, ry, rw, rh);
      } else if (s.tool === 'circle') {
        if (!s.start || !s.end) return;
        const cx = (s.start.x + s.end.x) / 2;
        const cy = (s.start.y + s.end.y) / 2;
        const radiusX = Math.abs(s.end.x - s.start.x) / 2;
        const radiusY = Math.abs(s.end.y - s.start.y) / 2;

        ctx.beginPath();
        ctx.ellipse(cx, cy, radiusX, radiusY, 0, 0, Math.PI * 2);
        if (s.fill) {
          ctx.save();
          ctx.globalAlpha = 0.12;
          ctx.fill();
          ctx.restore();
        }
        ctx.stroke();
      } else if (s.tool === 'text') {
        if (!s.start || !s.text) return;
        ctx.font = `600 ${s.fontSize || 14}px system-ui, -apple-system, sans-serif`;
        ctx.fillText(s.text, s.start.x, s.start.y);
      }
    };

    // Render all saved shapes
    shapes.forEach(drawShape);

    // Render live drawing in progress
    if (liveDrawing) {
      drawShape(liveDrawing);
    }

    ctx.restore();
  }, [shapes, liveDrawing, viewTransform]);

  // Resize canvas
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      redrawCanvas();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redrawCanvas]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const saveHistorySnapshot = () => {
    setUndoStack((prev) => [...prev.slice(-20), { shapes: [...shapes], stickies: [...stickies] }]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, { shapes: [...shapes], stickies: [...stickies] }]);
    setShapes(last.shapes);
    setStickies(last.stickies);
    playChime('click');
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setUndoStack((prev) => [...prev, { shapes: [...shapes], stickies: [...stickies] }]);
    setShapes(next.shapes);
    setStickies(next.stickies);
    playChime('click');
  };

  // Pointer down
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    if (e.button === 1 || activeTool === 'hand') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewTransform.x, y: e.clientY - viewTransform.y });
      return;
    }

    if (e.button !== 0) return;

    const world = screenToWorld(screenX, screenY);
    setIsInteracting(true);
    setDragStartPos(world);

    if (activeTool === 'sticky') {
      saveHistorySnapshot();
      const newSticky: BoardSticky = {
        id: `sticky-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        x: world.x,
        y: world.y,
        width: 190,
        height: 140,
        text: 'Новая заметка...',
        color: stickyBg,
        author: currentUser?.displayName || 'Участник',
      };
      setStickies((prev) => [...prev, newSticky]);
      setEditingStickyId(newSticky.id);
      setActiveTool('select');
      playChime('click');
      return;
    }

    if (activeTool === 'text') {
      saveHistorySnapshot();
      setActiveTextInput({ x: world.x, y: world.y, text: '' });
      return;
    }

    if (activeTool === 'eraser') {
      saveHistorySnapshot();
      // Erase nearby shapes
      const threshold = 20 / viewTransform.scale;
      setShapes((prev) =>
        prev.filter((s) => {
          if (s.points) {
            return !s.points.some((p) => Math.hypot(p.x - world.x, p.y - world.y) < threshold);
          }
          if (s.start && s.end) {
            const minX = Math.min(s.start.x, s.end.x) - threshold;
            const maxX = Math.max(s.start.x, s.end.x) + threshold;
            const minY = Math.min(s.start.y, s.end.y) - threshold;
            const maxY = Math.max(s.start.y, s.end.y) + threshold;
            return !(world.x >= minX && world.x <= maxX && world.y >= minY && world.y <= maxY);
          }
          return true;
        })
      );
      playChime('click');
      return;
    }

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      saveHistorySnapshot();
      setLiveDrawing({
        id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        tool: activeTool,
        color: activeColor,
        strokeWidth: strokeWidth,
        points: [{ x: world.x, y: world.y }],
      });
    } else if (activeTool === 'line' || activeTool === 'arrow' || activeTool === 'rect' || activeTool === 'circle') {
      saveHistorySnapshot();
      setLiveDrawing({
        id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        tool: activeTool,
        color: activeColor,
        strokeWidth: strokeWidth,
        fill: fillShape,
        start: { x: world.x, y: world.y },
        end: { x: world.x, y: world.y },
      });
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setViewTransform((prev) => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
      return;
    }

    if (!isInteracting) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      setLiveDrawing((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          points: [...(prev.points || []), { x: world.x, y: world.y }],
        };
      });
    } else if (activeTool === 'line' || activeTool === 'arrow' || activeTool === 'rect' || activeTool === 'circle') {
      setLiveDrawing((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          end: { x: world.x, y: world.y },
        };
      });
    }
  };

  const handlePointerUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isInteracting && liveDrawing) {
      setShapes((prev) => [...prev, liveDrawing]);
      setLiveDrawing(null);
    }
    setIsInteracting(false);
    setDragStartPos(null);
  };

  // Zoom
  const handleZoom = (delta: number) => {
    setViewTransform((prev) => {
      const newScale = Math.min(3.0, Math.max(0.3, prev.scale + delta));
      return { ...prev, scale: newScale };
    });
    playChime('click');
  };

  const handleResetZoom = () => {
    setViewTransform({ x: 0, y: 0, scale: 1.0 });
    playChime('click');
  };

  const handleClearAll = () => {
    saveHistorySnapshot();
    setShapes([]);
    setStickies([]);
    setShowClearModal(false);
    peerCollabSync.broadcastAction('whiteboard_clear', {});
    playChime('click');
  };

  const handleExportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `whiteboard-${roomId}.png`;
    link.href = image;
    link.click();
    playChime('success');
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-white overflow-hidden select-none font-sans"
    >
      {/* 1. TOP-LEFT ROOM BADGE & CLOUD STATUS (Google Minimalist) */}
      <div className="absolute top-3 left-4 z-20 flex items-center space-x-2 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-gray-200 shadow-xs">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-bold text-gray-900 truncate max-w-[200px]">
          {roomName}
        </span>
        <span className="text-gray-300">|</span>
        <span className="text-[11px] text-gray-500 flex items-center space-x-1">
          <CloudCheck className="w-3.5 h-3.5 text-blue-600 inline" />
          <span>{lastSavedTime}</span>
        </span>
      </div>

      {/* 2. FLOATING CENTER TOOLBAR (Google Minimalist Style) */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-1 bg-white px-2 py-1.5 rounded-2xl border border-gray-200 shadow-md">
        {/* Select / Hand */}
        <button
          type="button"
          onClick={() => setActiveTool('select')}
          title="Выделение (V)"
          className={`p-2 rounded-xl transition cursor-pointer ${
            activeTool === 'select' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <MousePointer2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTool('hand')}
          title="Перемещение холста (H / Space)"
          className={`p-2 rounded-xl transition cursor-pointer ${
            activeTool === 'hand' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Hand className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Pen & Highlighter */}
        <button
          type="button"
          onClick={() => setActiveTool('pen')}
          title="Перо для рисования (P)"
          className={`p-2 rounded-xl transition cursor-pointer ${
            activeTool === 'pen' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <PenTool className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTool('highlighter')}
          title="Маркер-выделитель"
          className={`p-2 rounded-xl transition cursor-pointer ${
            activeTool === 'highlighter' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Highlighter className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Shapes: Rect, Circle, Arrow, Line */}
        <button
          type="button"
          onClick={() => setActiveTool('rect')}
          title="Прямоугольник (R)"
          className={`p-2 rounded-xl transition cursor-pointer ${
            activeTool === 'rect' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Square className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTool('circle')}
          title="Круг / Овал (O)"
          className={`p-2 rounded-xl transition cursor-pointer ${
            activeTool === 'circle' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Circle className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTool('arrow')}
          title="Стрелка связи (A)"
          className={`p-2 rounded-xl transition cursor-pointer ${
            activeTool === 'arrow' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTool('line')}
          title="Прямая линия (L)"
          className={`p-2 rounded-xl transition cursor-pointer ${
            activeTool === 'line' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Text & Sticky */}
        <button
          type="button"
          onClick={() => setActiveTool('text')}
          title="Текстовый блок (T)"
          className={`p-2 rounded-xl transition cursor-pointer ${
            activeTool === 'text' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Type className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTool('sticky')}
          title="Стикер с заметкой (S)"
          className={`p-2 rounded-xl transition cursor-pointer ${
            activeTool === 'sticky' ? 'bg-amber-100 text-amber-800' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <StickyNote className="w-4 h-4 text-amber-500" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTool('eraser')}
          title="Ластик (E)"
          className={`p-2 rounded-xl transition cursor-pointer ${
            activeTool === 'eraser' ? 'bg-rose-50 text-rose-600' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Eraser className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Color Swatches */}
        <div className="flex items-center space-x-1 px-1">
          {GOOGLE_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => {
                setActiveColor(c.value);
                playChime('click');
              }}
              title={c.label}
              style={{ backgroundColor: c.value }}
              className={`w-5 h-5 rounded-full transition cursor-pointer ${
                activeColor === c.value ? 'ring-2 ring-blue-500 ring-offset-2 scale-110' : 'opacity-80 hover:opacity-100'
              }`}
            />
          ))}
        </div>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Undo / Redo */}
        <button
          type="button"
          onClick={handleUndo}
          disabled={undoStack.length === 0}
          title="Отменить (Ctrl+Z)"
          className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleRedo}
          disabled={redoStack.length === 0}
          title="Повторить (Ctrl+Y)"
          className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* 3. BOTTOM-RIGHT CONTROLS (Zoom, Reset, Export, Clear) */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-2xl border border-gray-200 shadow-md">
        <button
          type="button"
          onClick={() => handleZoom(-0.15)}
          title="Уменьшить масштаб"
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-700 cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleResetZoom}
          title="Сбросить масштаб к 100%"
          className="px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
        >
          {Math.round(viewTransform.scale * 100)}%
        </button>

        <button
          type="button"
          onClick={() => handleZoom(0.15)}
          title="Увеличить масштаб"
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-700 cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-gray-200 mx-1" />

        <button
          type="button"
          onClick={handleExportPng}
          title="Экспортировать как PNG"
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-700 cursor-pointer flex items-center space-x-1 text-xs font-medium"
        >
          <Download className="w-4 h-4 text-blue-600" />
          <span>PNG</span>
        </button>

        <button
          type="button"
          onClick={() => setShowClearModal(true)}
          title="Очистить доску комнаты"
          className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* 4. CANVAS ELEMENT */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`w-full h-full block ${
          activeTool === 'hand' || isPanning ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
        }`}
      />

      {/* 5. STICKY NOTES OVERLAY (Synchronized with Viewport) */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{
          transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})`,
          transformOrigin: 'top left',
        }}
      >
        {stickies.map((st) => (
          <div
            key={st.id}
            style={{
              transform: `translate(${st.x}px, ${st.y}px)`,
              width: `${st.width}px`,
              minHeight: `${st.height}px`,
              backgroundColor: st.color,
            }}
            className="absolute pointer-events-auto rounded-xl p-3 shadow-md border border-black/10 flex flex-col justify-between group transition-shadow hover:shadow-lg"
          >
            {editingStickyId === st.id ? (
              <textarea
                autoFocus
                defaultValue={st.text}
                onBlur={(e) => {
                  setStickies((prev) =>
                    prev.map((item) => (item.id === st.id ? { ...item, text: e.target.value } : item))
                  );
                  setEditingStickyId(null);
                }}
                className="w-full h-24 bg-transparent resize-none focus:outline-none text-xs text-gray-900 font-sans leading-relaxed"
              />
            ) : (
              <div
                onDoubleClick={() => setEditingStickyId(st.id)}
                className="w-full text-xs text-gray-900 font-sans leading-relaxed whitespace-pre-wrap cursor-text"
              >
                {st.text}
              </div>
            )}

            <div className="pt-2 flex items-center justify-between border-t border-black/5 text-[10px] text-gray-700">
              <span className="font-semibold truncate max-w-[110px]">{st.author || 'Участник'}</span>
              <button
                type="button"
                onClick={() => {
                  saveHistorySnapshot();
                  setStickies((prev) => prev.filter((item) => item.id !== st.id));
                  playChime('click');
                }}
                className="opacity-0 group-hover:opacity-100 text-rose-600 hover:text-rose-800 p-0.5 rounded cursor-pointer"
                title="Удалить стикер"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}

        {/* Inline Text Input */}
        {activeTextInput && (
          <div
            style={{
              transform: `translate(${activeTextInput.x}px, ${activeTextInput.y}px)`,
            }}
            className="absolute pointer-events-auto"
          >
            <input
              autoFocus
              type="text"
              placeholder="Введите текст..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (e.currentTarget.value.trim()) {
                    setShapes((prev) => [
                      ...prev,
                      {
                        id: `txt-${Date.now()}`,
                        tool: 'text',
                        color: activeColor,
                        strokeWidth: 15,
                        start: { x: activeTextInput.x, y: activeTextInput.y + 15 },
                        text: e.currentTarget.value.trim(),
                        fontSize: 15,
                      }
                    ]);
                  }
                  setActiveTextInput(null);
                  setActiveTool('select');
                } else if (e.key === 'Escape') {
                  setActiveTextInput(null);
                }
              }}
              onBlur={(e) => {
                if (e.target.value.trim()) {
                  setShapes((prev) => [
                    ...prev,
                    {
                      id: `txt-${Date.now()}`,
                      tool: 'text',
                      color: activeColor,
                      strokeWidth: 15,
                      start: { x: activeTextInput.x, y: activeTextInput.y + 15 },
                      text: e.target.value.trim(),
                      fontSize: 15,
                    }
                  ]);
                }
                setActiveTextInput(null);
                setActiveTool('select');
              }}
              className="px-2 py-1 rounded bg-white/90 border border-blue-400 text-sm font-semibold text-gray-900 focus:outline-none shadow-md"
            />
          </div>
        )}
      </div>

      {/* 6. CLEAR BOARD CONFIRMATION MODAL */}
      {showClearModal && (
        <div className="absolute inset-0 z-50 bg-black/30 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-gray-900">Очистить доску комнаты?</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Все схемы, рисунки и стикеры в комнате «{roomName}» будут безвозвратно удалены для всех участников.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                Очистить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
