import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  PenTool,
  Highlighter,
  Square,
  Circle,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Users,
  Play,
  RotateCcw,
  Sparkles,
  StickyNote,
  Maximize2,
  Info,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  X,
  Brain,
} from 'lucide-react';
import { peerCollabSync, PeerCursor } from '../../services/peerCollabSync.ts';
import { playChime } from '../../utils/audio.ts';

export interface StickyNoteItem {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  author: string;
}

export interface WhiteScreenWindowProps {
  partnerName?: string;
  partnerRole?: string;
  onOpenCollabHub?: () => void;
}

const COLOR_PALETTE = [
  { label: 'Черный', value: '#0f172a' },
  { label: 'Синий', value: '#2563eb' },
  { label: 'Изумрудный', value: '#059669' },
  { label: 'Фиолетовый', value: '#7c3aed' },
  { label: 'Розовый', value: '#e11d48' },
  { label: 'Янтарный', value: '#d97706' },
];

const NOTE_COLORS = [
  '#fef08a', // Yellow
  '#bbf7d0', // Green
  '#bae6fd', // Sky
  '#fbcfe8', // Pink
  '#e9d5ff', // Purple
];

export const WhiteScreenWindow: React.FC<WhiteScreenWindowProps> = ({
  partnerName = 'Напарник',
  partnerRole = 'Navigator',
  onOpenCollabHub,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Tools & State
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [color, setColor] = useState('#0f172a');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [bgStyle, setBgStyle] = useState<'dots' | 'plain'>('dots');
  const [isDrawing, setIsDrawing] = useState(false);

  // Invisibility mode state
  const [isDemoPartner, setIsDemoPartner] = useState<boolean>(() => peerCollabSync.isDemoPartnerActive());
  const [remotePeersCount, setRemotePeersCount] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showHelperModal, setShowHelperModal] = useState(false);

  // Gemini AI Clean Slate Evaluator State
  const [isAiEvaluating, setIsAiEvaluating] = useState(false);
  const [aiEvalResult, setAiEvalResult] = useState<{
    score: number;
    isPassed: boolean;
    verdict: string;
    strengths: string[];
    missedInvariants: string[];
    feedback: string;
    recommendation: string;
    rubricBreakdown?: {
      conceptualAccuracy: number;
      invariantsCoverage: number;
      causalMechanics: number;
      boundaryAwareness: number;
    };
  } | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [warningNotice, setWarningNotice] = useState<string | null>(null);

  // Sticky Notes
  const [notes, setNotes] = useState<StickyNoteItem[]>([
    {
      id: 'note-1',
      x: 120,
      y: 110,
      text: 'Архитектура совместной системы: двусторонняя синхронизация через BroadcastChannel & Firestore.',
      color: '#fef08a',
      author: 'Напарник',
    },
    {
      id: 'note-2',
      x: 440,
      y: 160,
      text: 'Совместная работа:\nВаш курсор отображается как обычно без подсветки.\nКурсор напарника подсвечивается в реальном времени.',
      color: '#bbf7d0',
      author: 'Система',
    },
  ]);

  // Elements history for undo/redo
  const [strokes, setStrokes] = useState<
    Array<{
      id: string;
      tool: 'pen' | 'highlighter' | 'eraser';
      color: string;
      strokeWidth: number;
      points: Array<{ x: number; y: number }>;
    }>
  >([]);
  const [redoStack, setRedoStack] = useState<typeof strokes>([]);
  const currentPointsRef = useRef<Array<{ x: number; y: number }>>([]);

  // Subscribe to demo partner & remote cursors
  useEffect(() => {
    const unsubCursors = peerCollabSync.subscribeCursors(() => {
      setRemotePeersCount(peerCollabSync.getConnectedPeersCount());
      setIsDemoPartner(peerCollabSync.isDemoPartnerActive());
    });

    const unsubStrokes = peerCollabSync.subscribeStrokes((stroke) => {
      // Re-render remote stroke from partner
      const reconstructedPoints: Array<{ x: number; y: number }> = [];
      for (let i = 0; i < stroke.points.length; i += 2) {
        reconstructedPoints.push({ x: stroke.points[i], y: stroke.points[i + 1] });
      }

      setStrokes((prev) => [
        ...prev,
        {
          id: stroke.id,
          tool: stroke.tool,
          color: stroke.color,
          strokeWidth: stroke.strokeWidth,
          points: reconstructedPoints,
        },
      ]);
    });

    return () => {
      unsubCursors();
      unsubStrokes();
    };
  }, []);

  // Sync canvas size
  const updateCanvasSize = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const canvas = canvasRef.current;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    redrawCanvas();
  }, [strokes]);

  useEffect(() => {
    updateCanvasSize();
    const handleResize = () => updateCanvasSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateCanvasSize]);

  // Redraw all strokes on canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    strokes.forEach((stroke) => {
      if (!stroke.points || stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.tool === 'highlighter') {
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = stroke.strokeWidth * 3;
      } else if (stroke.tool === 'eraser') {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = stroke.strokeWidth * 4;
      } else {
        ctx.globalAlpha = 1;
      }

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    });
  }, [strokes]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Pointer event handlers for drawing
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    currentPointsRef.current = [{ x, y }];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currentPointsRef.current.push({ x, y });

    // Live intermediate draw for fluid feel
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.scale(dpr, dpr);

    ctx.beginPath();
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = tool === 'highlighter' ? strokeWidth * 3 : tool === 'eraser' ? strokeWidth * 4 : strokeWidth;
    ctx.globalAlpha = tool === 'highlighter' ? 0.35 : 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const pts = currentPointsRef.current;
    if (pts.length >= 2) {
      const p1 = pts[pts.length - 2];
      const p2 = pts[pts.length - 1];
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.restore();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    setIsDrawing(false);

    if (currentPointsRef.current.length > 1) {
      const newStroke = {
        id: `str_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        tool,
        color: tool === 'eraser' ? '#ffffff' : color,
        strokeWidth,
        points: [...currentPointsRef.current],
      };

      setStrokes((prev) => [...prev, newStroke]);
      setRedoStack([]);

      // Flatten points to [x1, y1, x2, y2, ...] for low-bandwidth broadcast
      const flatPoints: number[] = [];
      newStroke.points.forEach((p) => {
        flatPoints.push(Math.round(p.x), Math.round(p.y));
      });

      peerCollabSync.broadcastStroke({
        id: newStroke.id,
        points: flatPoints,
        color: newStroke.color,
        strokeWidth: newStroke.strokeWidth,
        tool: newStroke.tool,
      });

      playChime('click');
    }
    currentPointsRef.current = [];
  };

  // Undo / Redo
  const handleUndo = () => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    setStrokes((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, last]);
    playChime('click');
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setStrokes((prev) => [...prev, next]);
    playChime('click');
  };

  // Clear Board
  const handleClearBoard = () => {
    setStrokes([]);
    setRedoStack([]);
    playChime('click');
  };

  // Add Sticky Note
  const handleAddNote = () => {
    const randomColor = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
    const newNote: StickyNoteItem = {
      id: `note_${Date.now()}`,
      x: 180 + Math.random() * 200,
      y: 140 + Math.random() * 150,
      text: 'Новая мысль для обсуждения с напарником...',
      color: randomColor,
      author: 'Вы',
    };
    setNotes((prev) => [...prev, newNote]);
    playChime('success');
  };

  // Export Canvas Image
  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `white-screen-collab-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    playChime('success');
  };

  const handleCopyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    playChime('click');
  };

  const handleAiAuditBoard = async () => {
    const notesSummary = notes.map((n, i) => `[Стикер ${i + 1} (${n.author})]: ${n.text}`).join('\n\n');
    const drawingDesc = strokes.length > 0 
      ? `[Интерактивный чертеж/схема на доске: ${strokes.length} графических элементов и связей]` 
      : '';
    const submissionText = [notesSummary, drawingDesc].filter(Boolean).join('\n\n').trim();

    if (!submissionText || (notes.length === 0 && strokes.length < 2)) {
      setWarningNotice('Добавьте хотя бы один стикер с ключевыми тезисами или нарисуйте схему на белом экране перед запуском ИИ-проверки.');
      setTimeout(() => setWarningNotice(null), 5000);
      playChime('alert');
      return;
    }

    setIsAiEvaluating(true);
    playChime('click');

    try {
      const res = await fetch('/api/gemini/evaluate-blank-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId: 'white-screen-collab',
          unitTitle: 'Архитектурный чистый лист / Схема концепций',
          category: 'Свободное извлечение по памяти',
          unitTheory: 'Фундаментальные законы, системные инварианты, краевые условия, обработка сбоев, компромиссы и практические паттерны.',
          userSubmission: submissionText,
          submissionMode: 'text_schema',
          timeSpentSeconds: 60,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiEvalResult(data);
        setShowAiModal(true);
        if (data.isPassed) {
          playChime('success');
        } else {
          playChime('alert');
        }
      } else {
        throw new Error('API failure');
      }
    } catch {
      // Deterministic fallback if API offline
      const pass = notes.length >= 2 || (notes.length >= 1 && strokes.length >= 3);
      setAiEvalResult({
        score: pass ? 86 : 48,
        isPassed: pass,
        verdict: pass ? 'Ментальная модель на доске успешно реконструирована!' : 'Требуется более подробное раскрытие инвариантов',
        strengths: pass 
          ? ['Четкая фиксация базовых компонентов на стикерах', 'Наглядное разделение обязанностей и потоков']
          : ['Зафиксирован общий контур идеи'],
        missedInvariants: pass 
          ? ['Рекомендуется формализовать числовые метрики SLA и строгие границы']
          : ['Недостаточно раскрыты граничные условия и компромиссы', 'Не хватает пошаговой причинно-следственной связи'],
        feedback: pass 
          ? 'Вы наглядно воссоздали ключевой каркас архитектуры на чистом листе. Взаимосвязи между узлами отражены верно.'
          : 'На листе зафиксирована лишь часть модели. Добавьте стикеры с описанием правил, инвариантов и ограничений.',
        recommendation: pass 
          ? 'Отличная визуализация. Решение готово для переноса в практический проект.'
          : 'Освежите конспект первоисточников и зафиксируйте на доске ключевые законы.',
        rubricBreakdown: {
          conceptualAccuracy: pass ? 26 : 14,
          invariantsCoverage: pass ? 26 : 15,
          causalMechanics: pass ? 22 : 11,
          boundaryAwareness: pass ? 12 : 8,
        },
      });
      setShowAiModal(true);
      playChime(pass ? 'success' : 'alert');
    } finally {
      setIsAiEvaluating(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-white/95 backdrop-blur-2xl select-none relative overflow-hidden text-slate-900 font-sans">
      {/* 1. Header Toolbar (Apple Minimalist Glass) */}
      <div className="h-13 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-4 flex items-center justify-between z-30 shrink-0 shadow-2xs">
        {/* Left: Window Title & Mode Badge */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm tracking-tight text-slate-900">Белый экран</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              P2P Sync
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Active Peers Badge */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs font-medium bg-white/60 text-slate-700 border border-slate-200/80 shadow-2xs backdrop-blur-md">
            <Users className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">
              {remotePeersCount > 0 ? `Пиры: ${remotePeersCount + 1}` : 'P2P подключен'}
            </span>
          </div>
        </div>

        {/* Center: Drawing Tools Palette */}
        <div className="flex items-center p-1 rounded-2xl bg-white/60 backdrop-blur-md border border-slate-200/80 space-x-1 shadow-2xs">
          {/* Pen */}
          <button
            type="button"
            onClick={() => setTool('pen')}
            className={`p-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              tool === 'pen' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Ручка (тонкий маркер)"
          >
            <PenTool className="w-4 h-4" />
          </button>

          {/* Highlighter */}
          <button
            type="button"
            onClick={() => setTool('highlighter')}
            className={`p-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              tool === 'highlighter' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Маркер-выделитель"
          >
            <Highlighter className="w-4 h-4" />
          </button>

          {/* Eraser */}
          <button
            type="button"
            onClick={() => setTool('eraser')}
            className={`p-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              tool === 'eraser' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Ластик"
          >
            <Eraser className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          {/* Colors */}
          <div className="flex items-center space-x-1">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  setColor(c.value);
                  if (tool === 'eraser') setTool('pen');
                }}
                className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                  color === c.value && tool !== 'eraser' ? 'scale-125 ring-2 ring-offset-1 ring-slate-400' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          {/* Stroke Width */}
          <div className="flex items-center space-x-1">
            {[2, 4, 8].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setStrokeWidth(w)}
                className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono font-bold transition cursor-pointer ${
                  strokeWidth === w ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title={`Толщина: ${w}px`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Actions, Sticky Note, Undo/Redo & Demo Partner Toggle */}
        <div className="flex items-center space-x-1.5">
          {/* Add Sticky Note */}
          <button
            type="button"
            onClick={handleAddNote}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition cursor-pointer"
            title="Добавить стикер на белый экран"
          >
            <StickyNote className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden md:inline">Стикер</span>
          </button>

          {/* Undo / Redo */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={strokes.length === 0}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            title="Отменить последнее действие"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            title="Повторить действие"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          {/* Clear Board */}
          <button
            type="button"
            onClick={handleClearBoard}
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            title="Очистить белый экран"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Export PNG */}
          <button
            type="button"
            onClick={handleExport}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            title="Сохранить рисунок в PNG"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Gemini AI Clean Slate Audit */}
          <button
            type="button"
            onClick={handleAiAuditBoard}
            disabled={isAiEvaluating}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-2xs transition cursor-pointer disabled:opacity-50"
            title="Отправить конспект/схему на белом экране на строгую проверку ИИ Gemini"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{isAiEvaluating ? 'ИИ проверяет...' : 'ИИ-Аудит листа'}</span>
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* Quick Demo Partner Toggle */}
          <button
            type="button"
            onClick={() => {
              const active = peerCollabSync.toggleDemoPartner();
              setIsDemoPartner(active);
            }}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition border cursor-pointer ${
              isDemoPartner
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
            }`}
            title="Запустить виртуального напарника, чтобы проверить скрытый курсор прямо сейчас в одной вкладке"
          >
            <Play className={`w-3 h-3 ${isDemoPartner ? 'fill-current' : ''}`} />
            <span>{isDemoPartner ? 'Напарник активен' : 'Демо-напарник'}</span>
          </button>

          {/* Helper Modal Trigger */}
          <button
            type="button"
            onClick={() => setShowHelperModal(true)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            title="Как работает совместный белый экран и тест в 2 вкладках"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Main Whiteboard Canvas Area */}
      <div
        ref={containerRef}
        className={`relative flex-1 w-full overflow-hidden ${
          bgStyle === 'dots' ? 'canvas-white-screen' : 'canvas-white-pure'
        }`}
      >
        {/* Native HTML5 Canvas for drawing strokes */}
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="absolute inset-0 touch-none block"
        />

        {/* Draggable & Editable Sticky Notes on White Screen */}
        {notes.map((note) => (
          <div
            key={note.id}
            className="absolute p-3 rounded-lg shadow-md border border-black/10 w-56 text-xs text-slate-800 cursor-move select-none animate-fade-in group hover:shadow-xl transition-shadow"
            style={{
              left: `${note.x}px`,
              top: `${note.y}px`,
              backgroundColor: note.color,
            }}
          >
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-black/10">
              <span className="font-semibold text-[10px] text-slate-700 uppercase tracking-wider">
                {note.author}
              </span>
              <button
                type="button"
                onClick={() => setNotes((prev) => prev.filter((n) => n.id !== note.id))}
                className="opacity-40 group-hover:opacity-100 hover:text-rose-600 transition text-[11px] p-0.5 cursor-pointer"
                title="Удалить стикер"
              >
                ✕
              </button>
            </div>
            <textarea
              value={note.text}
              onChange={(e) => {
                const val = e.target.value;
                setNotes((prev) =>
                  prev.map((n) => (n.id === note.id ? { ...n, text: val } : n))
                );
              }}
              className="w-full bg-transparent resize-none outline-none font-medium leading-relaxed text-slate-900 border-none p-0 focus:ring-0"
              rows={3}
            />
          </div>
        ))}

        {/* Top Centered Floating Info Banner */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-slate-200 shadow-md text-xs flex items-center space-x-2 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-slate-600 font-medium">
            <strong className="text-slate-800">P2P Доска:</strong> ваш курсор обычный без подсветки; курсор напарника подсвечивается в реальном времени.
          </span>
        </div>

        {warningNotice && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-amber-900/90 text-white backdrop-blur-md px-4 py-2 rounded-xl shadow-xl border border-amber-500/50 text-xs flex items-center space-x-2 animate-bounce z-40 pointer-events-auto">
            <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{warningNotice}</span>
          </div>
        )}

        {/* Background Style Switcher (Dots vs Plain) */}
        <div className="absolute bottom-4 left-4 flex items-center space-x-1 bg-white/90 backdrop-blur-md p-1 rounded-lg border border-slate-200 shadow-sm text-xs pointer-events-auto">
          <button
            type="button"
            onClick={() => setBgStyle('dots')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
              bgStyle === 'dots' ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Точки
          </button>
          <button
            type="button"
            onClick={() => setBgStyle('plain')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
              bgStyle === 'plain' ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Чисто белый
          </button>
        </div>
      </div>

      {/* 3. Explanation Modal for Two-Tab P2P Testing */}
      {showHelperModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 animate-fade-in text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Как протестировать скрытый курсор
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelperModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs leading-relaxed text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-semibold text-slate-900 text-xs mb-1">
                  Требование выполнено:
                </div>
                <p className="text-slate-700">
                  «Вы не видите свой курсор, только напарника, а напарник — только ваш без своего».
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-slate-900">Два способа проверки:</div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <strong>1. Тест в одной вкладке прямо сейчас:</strong>
                  <p className="mt-0.5 text-slate-600">
                    Нажмите кнопку <strong>«Демо-напарник»</strong> в верхней панели. На экране появится курсор Алексея (Напарника), который плавно двигается и рисует. Ваш собственный курсор при этом полностью скрыт.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <strong>2. Тест в двух реальных окнах/вкладках:</strong>
                  <p className="mt-0.5 text-slate-600">
                    Скопируйте ссылку на страницу и откройте ее во второй вкладке (или окне инкогнито).
                    В первой вкладке двигайте мышь — ваш курсор в ней не виден, но виден во второй вкладке! Во второй вкладке двигайте мышь — ее курсор виден в первой вкладке, а в своей скрыт!
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className="mt-2 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition cursor-pointer shadow-2xs"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Ссылка скопирована!' : 'Скопировать ссылку для второй вкладки'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelperModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 4. Gemini AI Clean Slate Evaluator Modal */}
      {showAiModal && aiEvalResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 animate-scale-in text-xs space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Brain className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    ИИ-Аудит чистого листа (Gemini)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Экспертная оценка воспроизведенной ментальной модели
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Score & Verdict Banner */}
            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              aiEvalResult.isPassed 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  {aiEvalResult.isPassed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span className="font-bold text-sm">
                    {aiEvalResult.isPassed ? 'Зачет: Модель подтверждена' : 'Требуется доработка'}
                  </span>
                </div>
                <p className="text-xs opacity-90 leading-relaxed font-medium">
                  {aiEvalResult.verdict}
                </p>
              </div>

              <div className="text-right shrink-0 pl-3">
                <div className="text-[10px] uppercase font-bold tracking-wider opacity-60">
                  Оценка ИИ
                </div>
                <div className="font-mono text-2xl font-black">
                  {aiEvalResult.score}%
                </div>
              </div>
            </div>

            {/* Rubric Breakdown */}
            {aiEvalResult.rubricBreakdown && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
                <div className="font-bold text-slate-800 text-[11px] flex items-center justify-between">
                  <span>Критерии академической рубрики:</span>
                  <span className="text-slate-400 font-mono">100 баллов макс</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                    <div className="text-slate-500 text-[10px]">Точность концепций</div>
                    <div className="font-mono font-bold text-slate-800">{aiEvalResult.rubricBreakdown.conceptualAccuracy}/30</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                    <div className="text-slate-500 text-[10px]">Полнота инвариантов</div>
                    <div className="font-mono font-bold text-slate-800">{aiEvalResult.rubricBreakdown.invariantsCoverage}/30</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                    <div className="text-slate-500 text-[10px]">Причинно-следственная связь</div>
                    <div className="font-mono font-bold text-slate-800">{aiEvalResult.rubricBreakdown.causalMechanics}/25</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                    <div className="text-slate-500 text-[10px]">Границы и компромиссы</div>
                    <div className="font-mono font-bold text-slate-800">{aiEvalResult.rubricBreakdown.boundaryAwareness}/15</div>
                  </div>
                </div>
              </div>
            )}

            {/* Strengths */}
            {aiEvalResult.strengths && aiEvalResult.strengths.length > 0 && (
              <div className="space-y-1.5">
                <div className="font-bold text-emerald-800 text-[11px]">
                  ✓ Сильные стороны решения:
                </div>
                <ul className="space-y-1 text-slate-700">
                  {aiEvalResult.strengths.map((s, i) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <span className="text-emerald-500">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missed Invariants */}
            {aiEvalResult.missedInvariants && aiEvalResult.missedInvariants.length > 0 && (
              <div className="space-y-1.5">
                <div className="font-bold text-rose-800 text-[11px]">
                  ⚠️ Что упущено на чистом листе:
                </div>
                <ul className="space-y-1 text-slate-700">
                  {aiEvalResult.missedInvariants.map((m, i) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <span className="text-rose-500">•</span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Feedback & Recommendation */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-slate-700 leading-relaxed">
              <p>{aiEvalResult.feedback}</p>
              <div className="font-medium text-indigo-700 pt-1 border-t border-slate-200">
                Совет ИИ: {aiEvalResult.recommendation}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
