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
  Grid,
  Sparkles,
  Layers,
  Database,
  Server,
  Monitor,
  GitBranch,
  Check,
  RotateCcw,
  Wifi,
  AlertCircle,
} from 'lucide-react';
import { playChime } from '../../utils/audio.ts';
import { peerCollabSync } from '../../services/peerCollabSync.ts';
import { peerService } from '../../services/peerService.ts';

export type WhiteboardTool =
  | 'pen'
  | 'highlighter'
  | 'line'
  | 'arrow'
  | 'rect'
  | 'circle'
  | 'text'
  | 'eraser';

export interface BoardElement {
  id: string;
  tool: WhiteboardTool;
  color: string;
  strokeWidth: number;
  points?: Array<{ x: number; y: number }>;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  text?: string;
  fill?: boolean;
}

const COLOR_PALETTE = [
  { label: 'Slate', value: '#0f172a' },
  { label: 'Sky', value: '#0284c7' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Rose', value: '#e11d48' },
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Amber', value: '#d97706' },
  { label: 'Muted', value: '#64748b' },
];

const STROKE_WIDTHS = [
  { label: '1.5px', value: 1.5 },
  { label: '3px', value: 3 },
  { label: '6px', value: 6 },
];

interface InteractiveWhiteboardProps {
  partnerName?: string;
  onSendToNotes?: (summaryText: string) => void;
  sessionId?: string;
}

export const InteractiveWhiteboard: React.FC<InteractiveWhiteboardProps> = ({
  partnerName,
  onSendToNotes,
  sessionId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Tools & Styling State
  const [tool, setTool] = useState<WhiteboardTool>('pen');
  const [color, setColor] = useState('#0f172a');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fillShape, setFillShape] = useState(false);
  const [bgStyle, setBgStyle] = useState<'dots' | 'grid' | 'plain'>('dots');

  // Active text input modal/popover
  const [textInputPos, setTextInputPos] = useState<{ x: number; y: number } | null>(null);
  const [textValue, setTextValue] = useState('');

  // Stored Elements & Undo/Redo stacks
  const [elements, setElements] = useState<BoardElement[]>(() => {
    // Initial universal mindmap diagram
    return [
      {
        id: 'init-root',
        tool: 'rect',
        color: '#0284c7',
        strokeWidth: 2,
        start: { x: 240, y: 30 },
        end: { x: 440, y: 75 },
        fill: true,
      },
      {
        id: 'init-root-text',
        tool: 'text',
        color: '#0284c7',
        strokeWidth: 14,
        start: { x: 255, y: 56 },
        text: 'Целевой навык: Мастерство',
      },
      {
        id: 'init-arrow-left',
        tool: 'arrow',
        color: '#64748b',
        strokeWidth: 2,
        start: { x: 290, y: 75 },
        end: { x: 180, y: 135 },
      },
      {
        id: 'init-arrow-right',
        tool: 'arrow',
        color: '#64748b',
        strokeWidth: 2,
        start: { x: 390, y: 75 },
        end: { x: 500, y: 135 },
      },
      {
        id: 'init-leaf-left',
        tool: 'rect',
        color: '#10b981',
        strokeWidth: 2,
        start: { x: 90, y: 135 },
        end: { x: 270, y: 175 },
        fill: true,
      },
      {
        id: 'init-leaf-left-text',
        tool: 'text',
        color: '#10b981',
        strokeWidth: 13,
        start: { x: 105, y: 158 },
        text: 'Фундамент 20% (Принципы)',
      },
      {
        id: 'init-leaf-right',
        tool: 'rect',
        color: '#8b5cf6',
        strokeWidth: 2,
        start: { x: 410, y: 135 },
        end: { x: 590, y: 175 },
        fill: true,
      },
      {
        id: 'init-leaf-right-text',
        tool: 'text',
        color: '#8b5cf6',
        strokeWidth: 13,
        start: { x: 425, y: 158 },
        text: 'Осознанная практика (70%)',
      },
    ];
  });

  const [redoStack, setRedoStack] = useState<BoardElement[]>([]);
  const [liveElement, setLiveElement] = useState<BoardElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showStencils, setShowStencils] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Resize & HiDPI scaling
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 500 });

  const updateCanvasDimensions = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = Math.max(300, Math.floor(rect.width));
    const height = Math.max(300, Math.floor(rect.height));

    const dpr = window.devicePixelRatio || 1;
    const canvas = canvasRef.current;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    setCanvasDimensions({ width, height });
  }, []);

  useEffect(() => {
    updateCanvasDimensions();
    const ro = new ResizeObserver(() => {
      updateCanvasDimensions();
    });
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }
    return () => ro.disconnect();
  }, [updateCanvasDimensions]);

  // Subscribe to partner remote strokes and actions
  useEffect(() => {
    // 1. Live stroke sync via BroadcastChannel / WebRTC
    const unsubStrokes = peerCollabSync.subscribeStrokes((stroke) => {
      const reconstructedPoints: Array<{ x: number; y: number }> = [];
      for (let i = 0; i < stroke.points.length; i += 2) {
        reconstructedPoints.push({ x: stroke.points[i], y: stroke.points[i + 1] });
      }
      const remoteEl: BoardElement = {
        id: stroke.id,
        tool: stroke.tool,
        color: stroke.color,
        strokeWidth: stroke.strokeWidth,
        points: reconstructedPoints,
      };
      setElements((prev) => {
        if (prev.some((e) => e.id === stroke.id)) return prev;
        return [...prev, remoteEl];
      });
    });

    // 2. Collaborative actions: board clear and element additions
    const unsubActions = peerCollabSync.subscribeActions((action) => {
      if (action.actionType === 'whiteboard_clear') {
        setElements([]);
        setRedoStack([]);
      } else if (action.actionType === 'whiteboard_element_add' && action.payload?.element) {
        const el = action.payload.element as BoardElement;
        setElements((prev) => {
          if (prev.some((e) => e.id === el.id)) return prev;
          return [...prev, el];
        });
      }
    });

    // 4. Firestore persistent session sync if connected to real session
    let unsubFirestore: (() => void) | null = null;
    if (sessionId) {
      unsubFirestore = peerService.subscribeToSession(sessionId, (sessionData) => {
        if (sessionData?.whiteboardStrokes) {
          if (sessionData.whiteboardStrokes.length === 0) {
            // Cleared remotely
            setElements((prev) => (prev.length > 0 ? [] : prev));
          } else {
            const mappedElements: BoardElement[] = sessionData.whiteboardStrokes.map((s) => {
              const pts: Array<{ x: number; y: number }> = [];
              for (let i = 0; i < s.points.length; i += 2) {
                pts.push({ x: s.points[i], y: s.points[i + 1] });
              }
              return {
                id: s.id,
                tool: (s.tool as any) || 'pen',
                color: s.color,
                strokeWidth: s.strokeWidth,
                points: pts,
              };
            });
            setElements((prev) => {
              const existingIds = new Set(prev.map((e) => e.id));
              const missing = mappedElements.filter((m) => !existingIds.has(m.id));
              if (missing.length === 0) return prev;
              return [...prev, ...missing];
            });
          }
        }
      });
    }

    return () => {
      unsubStrokes();
      unsubActions();
      if (unsubFirestore) unsubFirestore();
    };
  }, [sessionId]);

  // Helper: Draw Arrowhead
  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    lineWidthVal: number
  ) => {
    const headlen = Math.max(10, lineWidthVal * 3);
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headlen * Math.cos(angle - Math.PI / 6),
      toY - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headlen * Math.cos(angle + Math.PI / 6),
      toY - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  };

  // Helper: Draw Background Pattern
  const drawBackground = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    style: 'dots' | 'grid' | 'plain'
  ) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    if (style === 'dots') {
      ctx.fillStyle = '#cbd5e1';
      const gap = 24;
      for (let x = gap; x < width; x += gap) {
        for (let y = gap; y < height; y += gap) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (style === 'grid') {
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      const gap = 24;
      ctx.beginPath();
      for (let x = gap; x < width; x += gap) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = gap; y < height; y += gap) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    }
  };

  // Render element helper
  const renderElement = (ctx: CanvasRenderingContext2D, el: BoardElement) => {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (el.tool === 'highlighter') {
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = el.color;
      ctx.lineWidth = Math.max(12, el.strokeWidth * 3);
    } else if (el.tool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(20, el.strokeWidth * 4);
    } else {
      ctx.strokeStyle = el.color;
      ctx.fillStyle = el.color;
      ctx.lineWidth = el.strokeWidth;
    }

    if (el.tool === 'pen' || el.tool === 'highlighter' || el.tool === 'eraser') {
      if (el.points && el.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i].x, el.points[i].y);
        }
        ctx.stroke();
      }
    } else if (el.tool === 'line') {
      if (el.start && el.end) {
        ctx.beginPath();
        ctx.moveTo(el.start.x, el.start.y);
        ctx.lineTo(el.end.x, el.end.y);
        ctx.stroke();
      }
    } else if (el.tool === 'arrow') {
      if (el.start && el.end) {
        drawArrow(ctx, el.start.x, el.start.y, el.end.x, el.end.y, el.strokeWidth);
      }
    } else if (el.tool === 'rect') {
      if (el.start && el.end) {
        const x = Math.min(el.start.x, el.end.x);
        const y = Math.min(el.start.y, el.end.y);
        const w = Math.abs(el.end.x - el.start.x);
        const h = Math.abs(el.end.y - el.start.y);

        if (el.fill) {
          ctx.fillStyle = el.color + '15'; // 10% opacity fill
          ctx.fillRect(x, y, w, h);
        }
        ctx.strokeRect(x, y, w, h);
      }
    } else if (el.tool === 'circle') {
      if (el.start && el.end) {
        const rx = Math.abs(el.end.x - el.start.x) / 2;
        const ry = Math.abs(el.end.y - el.start.y) / 2;
        const cx = Math.min(el.start.x, el.end.x) + rx;
        const cy = Math.min(el.start.y, el.end.y) + ry;

        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
        if (el.fill) {
          ctx.fillStyle = el.color + '15';
          ctx.fill();
        }
        ctx.stroke();
      }
    } else if (el.tool === 'text') {
      if (el.start && el.text) {
        ctx.font = `bold ${Math.max(12, el.strokeWidth)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace`;
        ctx.fillStyle = el.color;
        ctx.fillText(el.text, el.start.x, el.start.y);
      }
    }

    ctx.restore();
  };

  // Re-draw Canvas on any state or dimensions change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. Draw Canvas Background
    drawBackground(ctx, canvasDimensions.width, canvasDimensions.height, bgStyle);

    // 2. Render All Saved Elements
    elements.forEach((el) => {
      renderElement(ctx, el);
    });

    // 3. Render Live In-Progress Element
    if (liveElement) {
      renderElement(ctx, liveElement);
    }

    ctx.restore();
  }, [elements, liveElement, canvasDimensions, bgStyle]);

  // Accurate Pointer Coordinates (scaled to CSS pixels)
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Pointer Down
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (textInputPos) return;

    // Capture pointer to track gestures smoothly even if moving outside canvas
    e.currentTarget.setPointerCapture(e.pointerId);

    const pos = getCoordinates(e);

    if (tool === 'text') {
      setTextInputPos(pos);
      setTextValue('');
      return;
    }

    setIsDrawing(true);

    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
      setLiveElement({
        id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tool,
        color: tool === 'eraser' ? '#ffffff' : color,
        strokeWidth,
        points: [pos],
      });
    } else {
      setLiveElement({
        id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tool,
        color,
        strokeWidth,
        start: pos,
        end: pos,
        fill: fillShape,
      });
    }
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !liveElement) return;

    const pos = getCoordinates(e);

    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
      setLiveElement((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          points: [...(prev.points || []), pos],
        };
      });
    } else {
      setLiveElement((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          end: pos,
        };
      });
    }
  };

  // Pointer Up
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !liveElement) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if not captured
    }

    setIsDrawing(false);

    // Commit live element if it has length or dimensions
    let shouldCommit = false;
    if (liveElement.tool === 'pen' || liveElement.tool === 'highlighter' || liveElement.tool === 'eraser') {
      if (liveElement.points && liveElement.points.length > 1) {
        shouldCommit = true;
      }
    } else if (liveElement.start && liveElement.end) {
      const dist = Math.hypot(
        liveElement.end.x - liveElement.start.x,
        liveElement.end.y - liveElement.start.y
      );
      if (dist > 4) {
        shouldCommit = true;
      }
    }

    if (shouldCommit) {
      setElements((prev) => [...prev, liveElement]);
      setRedoStack([]); // Reset redo stack on new action

      if (
        (liveElement.tool === 'pen' || liveElement.tool === 'highlighter' || liveElement.tool === 'eraser') &&
        liveElement.points &&
        liveElement.points.length > 1
      ) {
        const flatPoints: number[] = [];
        liveElement.points.forEach((p) => {
          flatPoints.push(Math.round(p.x), Math.round(p.y));
        });
        peerCollabSync.broadcastStroke({
          id: liveElement.id,
          points: flatPoints,
          color: liveElement.color,
          strokeWidth: liveElement.strokeWidth,
          tool: liveElement.tool as any,
        });
        if (sessionId) {
          peerService.addWhiteboardStroke(sessionId, {
            id: liveElement.id,
            points: flatPoints,
            color: liveElement.color,
            strokeWidth: liveElement.strokeWidth,
            tool: 'pen',
          }).catch(console.warn);
        }
      } else {
        // Broadcast shape or arrow to peers
        peerCollabSync.broadcastAction('whiteboard_element_add', { element: liveElement });
      }
    }

    setLiveElement(null);
  };

  // Text Submission
  const handleCommitText = () => {
    if (textInputPos && textValue.trim()) {
      const newTextEl: BoardElement = {
        id: `text-${Date.now()}`,
        tool: 'text',
        color,
        strokeWidth: strokeWidth === 1.5 ? 12 : strokeWidth === 3 ? 15 : 20,
        start: { x: textInputPos.x, y: textInputPos.y + 12 },
        text: textValue.trim(),
      };
      setElements((prev) => [...prev, newTextEl]);
      setRedoStack([]);
      peerCollabSync.broadcastAction('whiteboard_element_add', { element: newTextEl });
      playChime('click');
    }
    setTextInputPos(null);
    setTextValue('');
  };

  // Undo / Redo
  const handleUndo = () => {
    if (elements.length === 0) return;
    const last = elements[elements.length - 1];
    setElements((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, last]);
    playChime('click');
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setElements((prev) => [...prev, next]);
    playChime('click');
  };

  // Clear Board
  const handleClearBoard = () => {
    setElements([]);
    setRedoStack([]);
    setShowClearConfirm(false);
    peerCollabSync.broadcastAction('whiteboard_clear', {});
    if (sessionId) {
      peerService.updateWhiteboard(sessionId, []).catch(console.warn);
    }
    playChime('click');
  };

  // Quick Stencil Inserters (Architectural Components)
  const insertStencil = (stencilType: 'btree' | 'db' | 'server' | 'queue' | 'client' | 'concept' | 'action' | 'result' | 'feedback' | 'barrier') => {
    const cx = Math.floor(canvasDimensions.width / 2) - 80;
    const cy = Math.floor(canvasDimensions.height / 2) - 40;
    const idBase = Date.now().toString(36);

    let newItems: BoardElement[] = [];

    if (stencilType === 'btree' || stencilType === 'concept') {
      newItems = [
        {
          id: `stencil-rect-${idBase}`,
          tool: 'rect',
          color: '#0284c7',
          strokeWidth: 2,
          start: { x: cx, y: cy },
          end: { x: cx + 190, y: cy + 45 },
          fill: true,
        },
        {
          id: `stencil-text-${idBase}`,
          tool: 'text',
          color: '#0284c7',
          strokeWidth: 13,
          start: { x: cx + 15, y: cy + 28 },
          text: '💡 Главный тезис / Принцип',
        },
      ];
    } else if (stencilType === 'db' || stencilType === 'action') {
      newItems = [
        {
          id: `stencil-rect-${idBase}`,
          tool: 'rect',
          color: '#8b5cf6',
          strokeWidth: 2,
          start: { x: cx, y: cy },
          end: { x: cx + 190, y: cy + 45 },
          fill: true,
        },
        {
          id: `stencil-text-${idBase}`,
          tool: 'text',
          color: '#8b5cf6',
          strokeWidth: 13,
          start: { x: cx + 15, y: cy + 28 },
          text: '⚡ Практика / Кейс',
        },
      ];
    } else if (stencilType === 'server' || stencilType === 'result') {
      newItems = [
        {
          id: `stencil-rect-${idBase}`,
          tool: 'rect',
          color: '#10b981',
          strokeWidth: 2,
          start: { x: cx, y: cy },
          end: { x: cx + 190, y: cy + 45 },
          fill: true,
        },
        {
          id: `stencil-text-${idBase}`,
          tool: 'text',
          color: '#10b981',
          strokeWidth: 13,
          start: { x: cx + 15, y: cy + 28 },
          text: '🎯 Измеримый результат',
        },
      ];
    } else if (stencilType === 'queue' || stencilType === 'feedback') {
      newItems = [
        {
          id: `stencil-rect-${idBase}`,
          tool: 'rect',
          color: '#d97706',
          strokeWidth: 2,
          start: { x: cx, y: cy },
          end: { x: cx + 190, y: cy + 45 },
          fill: true,
        },
        {
          id: `stencil-text-${idBase}`,
          tool: 'text',
          color: '#d97706',
          strokeWidth: 13,
          start: { x: cx + 15, y: cy + 28 },
          text: '🔄 Обратная связь & Разбор',
        },
      ];
    } else if (stencilType === 'client' || stencilType === 'barrier') {
      newItems = [
        {
          id: `stencil-rect-${idBase}`,
          tool: 'rect',
          color: '#e11d48',
          strokeWidth: 2,
          start: { x: cx, y: cy },
          end: { x: cx + 190, y: cy + 45 },
          fill: true,
        },
        {
          id: `stencil-text-${idBase}`,
          tool: 'text',
          color: '#e11d48',
          strokeWidth: 13,
          start: { x: cx + 15, y: cy + 28 },
          text: '⚠️ Барьер / Ментальная ловушка',
        },
      ];
    }

    setElements((prev) => [...prev, ...newItems]);
    setRedoStack([]);
    setShowStencils(false);
    newItems.forEach((item) => {
      peerCollabSync.broadcastAction('whiteboard_element_add', { element: item });
    });
    playChime('success');
  };

  // Download Diagram as PNG
  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create high-res download
    const link = document.createElement('a');
    link.download = `architecture-whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    playChime('success');
  };

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (textInputPos) {
        if (e.key === 'Escape') {
          setTextInputPos(null);
          setTextValue('');
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [elements, redoStack, textInputPos]);

  return (
    <div className="h-full flex flex-col bg-slate-50 select-none overflow-hidden relative">
      {/* Top Main Toolbar */}
      <div className="px-4 py-2 bg-white border-b border-slate-200/90 flex flex-wrap items-center justify-between gap-2 shadow-2xs z-20">
        {/* Drawing Tools Group */}
        <div className="flex items-center space-x-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setTool('pen')}
            className={`p-1.5 rounded-lg text-xs transition-all ${
              tool === 'pen'
                ? 'bg-slate-900 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Карандаш (Перо)"
          >
            <PenTool className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setTool('highlighter')}
            className={`p-1.5 rounded-lg text-xs transition-all ${
              tool === 'highlighter'
                ? 'bg-slate-900 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Маркер / Хайлайтер"
          >
            <Highlighter className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setTool('line')}
            className={`p-1.5 rounded-lg text-xs transition-all ${
              tool === 'line'
                ? 'bg-slate-900 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Прямая линия"
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setTool('arrow')}
            className={`p-1.5 rounded-lg text-xs transition-all ${
              tool === 'arrow'
                ? 'bg-slate-900 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Стрелка архитектуры"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setTool('rect')}
            className={`p-1.5 rounded-lg text-xs transition-all ${
              tool === 'rect'
                ? 'bg-slate-900 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Прямоугольный блок"
          >
            <Square className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setTool('circle')}
            className={`p-1.5 rounded-lg text-xs transition-all ${
              tool === 'circle'
                ? 'bg-slate-900 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Круг / Овал"
          >
            <Circle className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setTool('text')}
            className={`p-1.5 rounded-lg text-xs transition-all ${
              tool === 'text'
                ? 'bg-slate-900 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Текстовая подпись (кликните на доску)"
          >
            <Type className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setTool('eraser')}
            className={`p-1.5 rounded-lg text-xs transition-all ${
              tool === 'eraser'
                ? 'bg-slate-900 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Ластик"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* Thickness & Fill */}
        <div className="flex items-center space-x-2 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
          <div className="flex items-center space-x-1">
            {STROKE_WIDTHS.map((sw) => (
              <button
                key={sw.value}
                type="button"
                onClick={() => setStrokeWidth(sw.value)}
                className={`px-2 py-1 text-[10px] rounded-lg transition-all ${
                  strokeWidth === sw.value
                    ? 'bg-white font-bold text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={`Толщина: ${sw.label}`}
              >
                {sw.label}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-slate-300 mx-0.5" />

          {/* Toggle Shape Fill */}
          <button
            type="button"
            onClick={() => setFillShape(!fillShape)}
            className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
              fillShape
                ? 'bg-sky-600 text-white shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Заливка фигур полупрозрачным фоном"
          >
            Заливка
          </button>
        </div>

        {/* Colors Group */}
        <div className="flex items-center space-x-1.5 bg-slate-100/90 px-2.5 py-1.5 rounded-xl border border-slate-200/80">
          {COLOR_PALETTE.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setColor(c.value)}
              className={`w-4 h-4 rounded-full transition-transform ${
                color === c.value
                  ? 'scale-125 ring-2 ring-slate-400 ring-offset-1 shadow-xs'
                  : 'opacity-85 hover:opacity-100 hover:scale-110'
              }`}
              style={{ backgroundColor: c.value }}
              title={c.label}
            />
          ))}
        </div>

        {/* Presets & Actions Group */}
        <div className="flex items-center space-x-1.5">
          {/* Architectural Presets Stencils */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowStencils(!showStencils)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-2xs"
              title="Готовые архитектурные блоки"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Стенсилы</span>
            </button>

            {showStencils && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Блоки мышления и практики
                </div>
                <button
                  type="button"
                  onClick={() => insertStencil('concept')}
                  className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-900 flex items-center space-x-2 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  <span>💡 Главный тезис / Принцип</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertStencil('action')}
                  className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-medium text-slate-700 hover:bg-purple-50 hover:text-purple-900 flex items-center space-x-2 transition cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span>⚡ Практика / Кейс</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertStencil('result')}
                  className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center space-x-2 transition cursor-pointer"
                >
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>🎯 Измеримый результат</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertStencil('feedback')}
                  className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-900 flex items-center space-x-2 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span>🔄 Обратная связь & Разбор</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertStencil('barrier')}
                  className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-900 flex items-center space-x-2 transition cursor-pointer"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>⚠️ Барьер / Затык</span>
                </button>
              </div>
            )}
          </div>

          {/* Background Style Toggle */}
          <button
            type="button"
            onClick={() => {
              setBgStyle((prev) =>
                prev === 'dots' ? 'grid' : prev === 'grid' ? 'plain' : 'dots'
              );
            }}
            className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs transition shadow-2xs"
            title={`Сетка: ${bgStyle}`}
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* Undo / Redo */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={elements.length === 0}
            className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none text-xs transition shadow-2xs"
            title="Отменить (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none text-xs transition shadow-2xs"
            title="Повторить (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          {/* Clear Board */}
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs transition shadow-2xs"
            title="Очистить доску"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Download Image */}
          <button
            type="button"
            onClick={handleDownloadImage}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs"
            title="Скачать схему в PNG"
          >
            {saveSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">PNG</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 w-full h-full relative overflow-hidden bg-white touch-none select-none cursor-crosshair"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="absolute inset-0 block w-full h-full touch-none"
        />

        {/* Text Insertion Floating Popover */}
        {textInputPos && (
          <div
            className="absolute z-30 bg-white p-2.5 rounded-xl border border-slate-300 shadow-2xl flex flex-col space-y-2 animate-in fade-in zoom-in-95 duration-100"
            style={{
              left: Math.min(canvasDimensions.width - 250, Math.max(10, textInputPos.x)),
              top: Math.min(canvasDimensions.height - 110, Math.max(10, textInputPos.y)),
            }}
          >
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Текстовая метка
            </div>
            <input
              type="text"
              autoFocus
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCommitText();
                if (e.key === 'Escape') setTextInputPos(null);
              }}
              placeholder="Введите текст метки..."
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 w-56"
            />
            <div className="flex items-center justify-end space-x-1.5">
              <button
                type="button"
                onClick={() => setTextInputPos(null)}
                className="px-2 py-1 rounded-lg text-[10px] font-medium text-slate-500 hover:bg-slate-100"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleCommitText}
                className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-bold hover:bg-black"
              >
                Поставить
              </button>
            </div>
          </div>
        )}

        {/* Clear Confirmation Modal */}
        {showClearConfirm && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-3 animate-in zoom-in-95">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg">
                ⚠️
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                Очистить интерактивную доску?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Все нарисованные узлы, архитектурные связи и пометки будут стерты.
                Вы сможете вернуть их через историю (Undo / Ctrl+Z).
              </p>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleClearBoard}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs"
                >
                  Очистить всё
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Helpful Info Overlay */}
        <div className="absolute bottom-2.5 left-3 pointer-events-none flex items-center space-x-2">
          <span className="text-[10px] bg-white/90 backdrop-blur-xs border border-slate-200/80 px-2.5 py-1 rounded-lg text-slate-500 font-medium shadow-2xs">
            {partnerName ? `Синхронизировано: ${partnerName}` : 'Интерактивная доска активна'} • Элементов: {elements.length}
          </span>
          <span className="text-[10px] hidden md:inline-block bg-white/90 backdrop-blur-xs border border-slate-200/80 px-2 py-1 rounded-lg text-slate-400 font-mono">
            Ctrl+Z: отмена • Ctrl+Y: повтор
          </span>
        </div>
      </div>
    </div>
  );
};
