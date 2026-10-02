import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Lock, 
  Play, 
  AlertCircle, 
  Zap, 
  Network,
  Atom,
  Sparkles,
  Flame,
  Users,
  PhoneCall,
  Bot,
  Brain,
  Snowflake,
  Activity,
  HelpCircle,
  Check,
  Copy
} from 'lucide-react';
import { DAGNode, DAGEdge } from '../../types.ts';
import { playChime } from '../../utils/audio.ts';
import { ProjectCadenceSettings, CADENCE_CONFIGS } from '../../services/cadenceController.ts';
import { normalizeDagLayout, getCanvasDimensions, getPhaseHeaders } from '../../utils/dagLayout.ts';
import { spacedRepetition, MemoryNodeRetention } from '../../services/spacedRepetitionService.ts';

interface DagGraphWindowProps {
  nodes: DAGNode[];
  edges: DAGEdge[];
  onSelectNode: (nodeId: string) => void;
  onLaunchUnit: (unitId: string) => void;
  onOptimizeTrajectory?: () => void;
  onStartCallWithPartner?: (partner: any) => void;
  onOpenPeerChat?: () => void;
  onInjectProject?: (topic?: string) => void;
  onOpenBlitzModal?: (nodeId?: string) => void;
  onOpenKnowledgeSphere?: () => void;
  cadenceSettings?: ProjectCadenceSettings;
}

export const DagGraphWindow: React.FC<DagGraphWindowProps> = ({
  nodes,
  edges,
  onSelectNode,
  onLaunchUnit,
  onOptimizeTrajectory,
  onInjectProject,
  onOpenBlitzModal,
  onOpenKnowledgeSphere,
  cadenceSettings,
  onStartCallWithPartner,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 30 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isHeatmapMode, setIsHeatmapMode] = useState<boolean>(false);
  const [nodeTypeFilter, setNodeTypeFilter] = useState<'all' | 'pair' | 'project' | 'injection'>('all');
  const [selectedRoleTab, setSelectedRoleTab] = useState<'roleA' | 'roleB'>('roleA');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [retentionsMap, setRetentionsMap] = useState<Map<string, MemoryNodeRetention>>(() => spacedRepetition.getAllNodeRetentions());
  const containerRef = useRef<HTMLDivElement>(null);

  const refreshRetentions = () => {
    setRetentionsMap(spacedRepetition.getAllNodeRetentions());
  };

  useEffect(() => {
    refreshRetentions();
    const interval = setInterval(refreshRetentions, 3000);
    return () => clearInterval(interval);
  }, []);

  // Normalize layout so nodes never overlap and directional lines always exist
  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(() => {
    return normalizeDagLayout(nodes, edges);
  }, [nodes, edges]);

  const canvasDims = useMemo(() => getCanvasDimensions(layoutNodes), [layoutNodes]);
  const phaseHeaders = useMemo(() => getPhaseHeaders(layoutNodes), [layoutNodes]);

  const effectiveSelectedId = selectedNodeId || layoutNodes[0]?.id || null;
  const selectedNode = layoutNodes.find((n) => n.id === effectiveSelectedId) || layoutNodes[0];

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (target && typeof target.closest === 'function' && target.closest('.dag-node-card')) return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 40, y: 30 });
    playChime('click');
  };

  return (
    <div className="h-full flex flex-col select-none bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* Top Minimal Toolbar */}
      <div className="h-11 border-b border-slate-200 px-4 flex items-center justify-between bg-white shrink-0 shadow-2xs">
        {/* Left section: Title & View Mode Selector */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Network className="w-4 h-4 text-slate-700" />
            <span className="font-semibold text-xs text-slate-900 tracking-tight">
              Траектория обучения
            </span>
          </div>

          {/* Mode Switcher: Standard vs Spaced Repetition Heatmap */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => {
                setIsHeatmapMode(false);
                playChime('click');
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center space-x-1.5 ${
                !isHeatmapMode
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Network className="w-3 h-3" />
              <span>Траектория</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsHeatmapMode(true);
                playChime('click');
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center space-x-1.5 ${
                isHeatmapMode
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Brain className="w-3 h-3" />
              <span>Карта памяти Эббингауза</span>
            </button>
            {onOpenKnowledgeSphere && (
              <button
                type="button"
                onClick={() => {
                  playChime('click');
                  onOpenKnowledgeSphere();
                }}
                className="px-2.5 py-1 rounded-md font-semibold transition-all flex items-center space-x-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-2xs hover:opacity-95"
                title="Переключиться в режим 3D Сферы Знаний (Holographic Knowledge Sphere)"
              >
                <Atom className="w-3.5 h-3.5 text-sky-200 animate-spin-slow" />
                <span>3D Сфера Знаний</span>
              </button>
            )}
          </div>

          {/* Node Type Filter Selector */}
          {!isHeatmapMode && (
            <div className="hidden lg:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => {
                  setNodeTypeFilter('all');
                  playChime('click');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  nodeTypeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Все
              </button>
              <button
                type="button"
                onClick={() => {
                  setNodeTypeFilter('pair');
                  playChime('click');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition flex items-center space-x-1 ${
                  nodeTypeFilter === 'pair' ? 'bg-emerald-600 text-white shadow-2xs font-bold' : 'text-emerald-700 hover:text-emerald-900'
                }`}
              >
                <Users className="w-3 h-3" />
                <span>Парные спарринги</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setNodeTypeFilter('project');
                  playChime('click');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition flex items-center space-x-1 ${
                  nodeTypeFilter === 'project' ? 'bg-purple-600 text-white shadow-2xs font-bold' : 'text-purple-700 hover:text-purple-900'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Проекты</span>
              </button>
            </div>
          )}

          {/* Clean Legend (Adapts to Mode) */}
          {!isHeatmapMode ? (
            <div className="hidden xl:flex items-center space-x-3 text-xs text-slate-500 pl-3 border-l border-slate-200">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Освоено</span>
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span className="text-slate-800 font-medium">В фокусе</span>
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>ИИ-инъекция</span>
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-300" />
                <span className="text-slate-400">Заблокировано</span>
              </span>
            </div>
          ) : (
            <div className="hidden xl:flex items-center space-x-2 text-[11px] text-slate-600 pl-3 border-l border-slate-200">
              <span className="flex items-center space-x-1 font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                <Flame className="w-3 h-3 text-emerald-500" />
                <span>85–100% Свежо</span>
              </span>
              <span className="flex items-center space-x-1 font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                <Zap className="w-3 h-3 text-sky-500" />
                <span>65–84% Тепло</span>
              </span>
              <span className="flex items-center space-x-1 font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                <span>⏳ 40–64% Остывает</span>
              </span>
              <span className="flex items-center space-x-1 font-semibold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                <Snowflake className="w-3 h-3 text-rose-500" />
                <span>&lt;40% Забывание</span>
              </span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Cadence Status indicator */}
          {cadenceSettings && (
            <div
              className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200"
              title={`Каденция ИИ: ${CADENCE_CONFIGS[cadenceSettings.mode].description}`}
            >
              <Flame className="w-3.5 h-3.5 text-slate-500" />
              <span>Каденция: <strong className="text-slate-900">{CADENCE_CONFIGS[cadenceSettings.mode].badge}</strong></span>
              <span className="font-mono text-[10px] text-slate-500 tabular-nums">
                ({cadenceSettings.unitsCompletedSinceLastProject}/{cadenceSettings.threshold})
              </span>
            </div>
          )}

          {onInjectProject && (
            <button
              id="btn-inject-project-dag"
              type="button"
              onClick={() => {
                playChime('click');
                onInjectProject(selectedNode?.title);
              }}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition cursor-pointer"
              title="ИИ сгенерирует и встроит боевой инженерный кейс из продакшена по этой теме"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Встроить боевой проект</span>
            </button>
          )}

          {onOptimizeTrajectory && (
            <button
              id="btn-optimize-trajectory"
              type="button"
              onClick={() => {
                playChime('click');
                onOptimizeTrajectory();
              }}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition cursor-pointer"
              title="Пересчитать оптимальный граф на основе реального прогресса"
            >
              <Zap className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Оптимизировать</span>
            </button>
          )}

          {/* Zoom and Scale Controls */}
          <div className="flex items-center bg-slate-100 rounded-md p-0.5 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => {
                setZoom((z) => Math.min(1.5, z + 0.1));
                playChime('click');
              }}
              className="p-1 hover:bg-white rounded transition text-slate-600 hover:text-slate-900 cursor-pointer"
              title="Приблизить"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono tabular-nums text-[11px] text-slate-700">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => {
                setZoom((z) => Math.max(0.5, z - 0.1));
                playChime('click');
              }}
              className="p-1 hover:bg-white rounded transition text-slate-600 hover:text-slate-900 cursor-pointer"
              title="Отдалить"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={resetView}
              className="p-1 hover:bg-white rounded transition text-slate-600 hover:text-slate-900 cursor-pointer ml-0.5"
              title="Сброс масштаба"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas + Side Inspector Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Interactive SVG & Node Canvas */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing dag-grid-bg bg-white/40 backdrop-blur-md"
        >
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              transition: isPanning ? 'none' : 'transform 0.05s ease-out',
              width: canvasDims.width,
              height: canvasDims.height,
            }}
            className="absolute inset-0"
          >
            {/* Dynamic Academic Phase Headers */}
            <div className="absolute top-4 left-0 w-full pointer-events-none">
              {phaseHeaders.map((ph) => (
                <div
                  key={ph.phase}
                  style={{ left: ph.left }}
                  className="absolute top-0 flex items-center space-x-2 text-xs font-bold text-slate-800 bg-white/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/90 shadow-2xs"
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ph.color }} />
                  <span className="tracking-wide whitespace-nowrap">{ph.title}</span>
                </div>
              ))}
            </div>

            {/* SVG Connector Edges */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#0284c7" floodOpacity="0.3" />
                </filter>
                <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#d97706" floodOpacity="0.3" />
                </filter>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#0284c7" />
                </marker>
                <marker
                  id="arrow-alt"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#d97706" />
                </marker>
              </defs>

              {layoutEdges.map((edge) => {
                const fromNode = layoutNodes.find((n) => n.id === edge.from);
                const toNode = layoutNodes.find((n) => n.id === edge.to);
                if (!fromNode || !toNode) return null;

                const CARD_WIDTH = 260;
                const CARD_HEIGHT = 160;

                const isBranchDown = Math.abs(toNode.x - fromNode.x) < 80 && toNode.y > fromNode.y;
                const isHorizontalForward = toNode.x >= fromNode.x + 200;

                let startX: number;
                let startY: number;
                let endX: number;
                let endY: number;
                let pathData: string;

                if (isBranchDown) {
                  // Clean vertical connector from bottom center to top center
                  startX = fromNode.x + CARD_WIDTH / 2;
                  startY = fromNode.y + CARD_HEIGHT;
                  endX = toNode.x + CARD_WIDTH / 2;
                  endY = toNode.y;
                  const dy = Math.max(30, (endY - startY) * 0.5);
                  pathData = `M ${startX} ${startY} C ${startX} ${startY + dy}, ${endX} ${endY - dy}, ${endX} ${endY}`;
                } else if (isHorizontalForward) {
                  // Forward horizontal connector from right edge to left edge
                  startX = fromNode.x + CARD_WIDTH;
                  startY = fromNode.y + 68;
                  endX = toNode.x;
                  endY = toNode.y + 68;
                  const dx = Math.max(30, (endX - startX) * 0.5);
                  pathData = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;
                } else if (toNode.y > fromNode.y && toNode.x < fromNode.x) {
                  // Elegant wrap-around connector from end of row to start of next row
                  startX = fromNode.x + CARD_WIDTH;
                  startY = fromNode.y + 68;
                  endX = toNode.x;
                  endY = toNode.y + 68;
                  const loopX = startX + 90;
                  const entryX = Math.max(30, endX - 70);
                  const midY = (startY + endY) / 2;
                  pathData = `M ${startX} ${startY} C ${loopX} ${startY}, ${loopX} ${midY}, ${(loopX + entryX) / 2} ${midY} S ${entryX} ${endY}, ${endX} ${endY}`;
                } else {
                  // Diagonal or alternate routing
                  startX = fromNode.x + CARD_WIDTH;
                  startY = fromNode.y + 68;
                  endX = toNode.x;
                  endY = toNode.y + 68;
                  const dx = Math.max(30, Math.abs(endX - startX) * 0.5);
                  pathData = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;
                }

                return (
                  <path
                    key={edge.id}
                    d={pathData}
                    fill="none"
                    stroke={edge.isAlternate ? '#d97706' : '#0284c7'}
                    strokeWidth={edge.isAlternate ? 2 : 2}
                    strokeDasharray={edge.isAlternate ? '6 4' : undefined}
                    filter={edge.isAlternate ? 'url(#glow-amber)' : 'url(#glow-cyan)'}
                    opacity={edge.isAlternate ? 0.9 : 0.85}
                    markerEnd={edge.isAlternate ? 'url(#arrow-alt)' : 'url(#arrow)'}
                  />
                );
              })}
            </svg>

            {/* Render Dynamic Learning Nodes (White Minimalist Cards / Heatmap Mode) */}
            {layoutNodes.map((node) => {
              const isSelected = effectiveSelectedId === node.id;
              const isCompleted = node.status === 'completed';
              const isActive = node.status === 'active';
              const isInjection = node.status === 'stuck_injected';
              const isLocked = node.status === 'locked';
              const isProject = node.type === 'project';
              const isPair = node.type === 'pair' || Boolean((node as any).isPairWork || (node as any).pairTask);

              // Filtering opacity
              const isFilteredOut = !isHeatmapMode && (
                (nodeTypeFilter === 'pair' && !isPair) ||
                (nodeTypeFilter === 'project' && !isProject) ||
                (nodeTypeFilter === 'injection' && !isInjection)
              );

              // Heatmap retention data for this node
              const retention = retentionsMap.get(node.id);
              const retentionPct = retention?.retentionPercentage ?? (isCompleted ? 100 : 0);
              const retentionState = retention?.retentionState ?? 'hot';
              const isDue = retention?.isDueForReview || (isCompleted && retentionPct < 75);

              // Heat-specific styling
              let heatBorderClass = 'border-slate-200';
              let heatBgClass = 'bg-white';
              let heatGlowClass = '';

              if (isHeatmapMode && isCompleted) {
                if (retentionPct >= 85) {
                  heatBorderClass = 'border-2 border-emerald-500 ring-2 ring-emerald-500/20 shadow-emerald-500/10';
                  heatBgClass = 'bg-gradient-to-br from-white via-white to-emerald-50/40';
                  heatGlowClass = 'shadow-md shadow-emerald-500/15';
                } else if (retentionPct >= 65) {
                  heatBorderClass = 'border-2 border-sky-500 ring-2 ring-sky-500/20 shadow-sky-500/10';
                  heatBgClass = 'bg-gradient-to-br from-white via-white to-sky-50/40';
                  heatGlowClass = 'shadow-md shadow-sky-500/15';
                } else if (retentionPct >= 40) {
                  heatBorderClass = 'border-2 border-amber-500 ring-2 ring-amber-500/30 shadow-amber-500/15 animate-pulse';
                  heatBgClass = 'bg-gradient-to-br from-white via-white to-amber-50/60';
                  heatGlowClass = 'shadow-md shadow-amber-500/20';
                } else {
                  heatBorderClass = 'border-2 border-rose-500 ring-2 ring-rose-500/40 shadow-rose-500/20';
                  heatBgClass = 'bg-gradient-to-br from-white via-rose-50/30 to-rose-100/40';
                  heatGlowClass = 'shadow-lg shadow-rose-500/25 ring-2 ring-rose-400';
                }
              }

              return (
                <div
                  key={node.id}
                  id={`dag-node-${node.id}`}
                  data-node-id={node.id}
                  data-unit-id={node.unitId}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNodeId(node.id);
                    onSelectNode(node.id);
                    playChime('click');
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    onLaunchUnit(node.unitId);
                    playChime(isLocked ? 'click' : 'success');
                  }}
                  title={isLocked ? `Модуль «${node.title}» (предшествующие блоки не завершены)` : isHeatmapMode && isCompleted ? `Удержание памяти: ${retentionPct}%. Кликните для подробностей или блица.` : "Клик: изучить требования. Двойной клик: запустить в Фокус-Студии"}
                  style={{
                    left: node.x,
                    top: node.y,
                    width: 270,
                    opacity: isFilteredOut ? 0.25 : 1,
                  }}
                  className={`dag-node-card absolute rounded-xl p-4 transition-all duration-150 cursor-pointer text-left select-none ${heatBgClass} ${heatGlowClass} ${
                    isSelected
                      ? 'ring-2 ring-sky-500 shadow-xl z-20 scale-[1.02]'
                      : 'shadow-sm hover:shadow-md'
                  } ${
                    isHeatmapMode && isCompleted
                      ? heatBorderClass
                      : isPair
                      ? 'border-2 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md shadow-emerald-500/10 bg-gradient-to-br from-white via-white to-emerald-50/30'
                      : isProject
                      ? 'border-2 border-purple-500 ring-2 ring-purple-500/20 shadow-purple-500/10'
                      : isActive
                      ? 'border-2 border-sky-500 ring-2 ring-sky-500/20'
                      : isCompleted
                      ? 'border-emerald-400/80'
                      : isInjection
                      ? 'border-2 border-amber-400 ring-2 ring-amber-400/20'
                      : isLocked
                      ? 'bg-slate-50/90 border-slate-200/60 opacity-60 text-slate-400'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Status header with clean unboxed metadata */}
                  <div className="flex items-center justify-between mb-2 text-xs">
                    <span className="text-[11px] font-medium text-slate-500">{node.sprint}</span>
                    <div className="flex items-center space-x-1.5">
                      {isHeatmapMode && isCompleted ? (
                        /* Heatmap Retention Badge */
                        <span
                          className={`flex items-center space-x-1 font-bold text-[10px] px-1.5 py-0.5 rounded border ${
                            retentionPct >= 85
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : retentionPct >= 65
                              ? 'bg-sky-50 text-sky-700 border-sky-300'
                              : retentionPct >= 40
                              ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                              : 'bg-rose-100 text-rose-800 border-rose-400 font-extrabold'
                          }`}
                        >
                          {retentionPct >= 85 ? (
                            <Flame className="w-3 h-3 text-emerald-500" />
                          ) : retentionPct < 40 ? (
                            <Snowflake className="w-3 h-3 text-rose-600 animate-spin" />
                          ) : (
                            <Zap className="w-3 h-3 text-sky-500" />
                          )}
                          <span>{retentionPct}% {retentionPct < 40 ? 'Забыто!' : retentionPct < 65 ? 'Остывает' : 'Свежо'}</span>
                        </span>
                      ) : (
                        <>
                          {isPair && (
                            <span className="flex items-center space-x-1 text-emerald-800 font-bold text-[10px] bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300 shadow-2xs">
                              <Users className="w-3 h-3 text-emerald-700" />
                              <span>P2P Спарринг 98%</span>
                            </span>
                          )}
                          {isProject && !isPair && (
                            <span className="flex items-center space-x-1 text-purple-700 font-bold text-[10px] bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                              <Sparkles className="w-3 h-3 text-purple-600" />
                              <span>Боевой кейс</span>
                            </span>
                          )}
                          {isCompleted && (
                            <span className="flex items-center space-x-1 text-emerald-600 font-semibold text-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Освоено</span>
                            </span>
                          )}
                          {isActive && !isProject && !isPair && (
                            <span className="flex items-center space-x-1 text-sky-600 font-semibold text-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                              <span>В фокусе</span>
                            </span>
                          )}
                          {isInjection && (
                            <span className="flex items-center space-x-1 text-amber-600 font-semibold text-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              <span>ИИ-Инъекция</span>
                            </span>
                          )}
                          {isLocked && (
                            <span className="text-slate-400">
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <div className={`font-semibold text-xs leading-snug mb-1 ${isLocked ? 'text-slate-400' : 'text-slate-900'}`}>
                    {node.title}
                  </div>
                  <div className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {node.subtitle}
                  </div>

                  {/* Pair Roles mini pills */}
                  {isPair && !isHeatmapMode && (
                    <div className="mt-2.5 pt-2 border-t border-emerald-100 flex items-center justify-between text-[10px] text-emerald-800">
                      <span className="font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                        Роли: Архитектор ↔ Аудитор
                      </span>
                      <span className="text-slate-400 font-mono">5+5 мин</span>
                    </div>
                  )}

                  {/* Heatmap Quick Blitz Bar on Node Card */}
                  {isHeatmapMode && isCompleted && (
                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                      <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            retentionPct >= 85
                              ? 'bg-emerald-500'
                              : retentionPct >= 65
                              ? 'bg-sky-500'
                              : retentionPct >= 40
                              ? 'bg-amber-400'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${retentionPct}%` }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playChime('click');
                          onOpenBlitzModal?.(node.id);
                        }}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                          retentionPct < 65
                            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        ⚡ Блиц-повтор
                      </button>
                    </div>
                  )}

                  {/* Footer metadata */}
                  {!isHeatmapMode && !isPair && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-mono tabular-nums text-slate-600 font-medium">{node.estimatedTimeMin} мин</span>
                      <span className="text-slate-700 font-medium">
                        {node.authorName}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Node Inspector Drawer on the Right */}
        <div className="w-80 border-l border-slate-200/80 bg-white/85 backdrop-blur-2xl p-5 flex flex-col justify-between overflow-y-auto shrink-0 shadow-2xs">
          {selectedNode ? (
            <div className="space-y-4 text-xs">
              <div className="bg-white/80 p-4 rounded-2xl border border-white/90 shadow-2xs">
                <div className="text-[11px] text-slate-500 mb-1 font-semibold">
                  {selectedNode.phaseTitle} · {selectedNode.sprint}
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {selectedNode.title}
                </h3>
                <p className="text-slate-600 mt-1.5 text-xs leading-relaxed font-normal">
                  {selectedNode.subtitle}
                </p>
              </div>

              {selectedNode.stuckReason && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-900">
                  <div className="font-medium text-[11px] flex items-center space-x-1.5 text-amber-800 mb-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Причина инъекции:</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">{selectedNode.stuckReason}</p>
                </div>
              )}

              {/* Pair Work Scenario & AI Agent Negotiation */}
              {(selectedNode.type === 'pair' || (selectedNode as any).pairTask) && (
                <div className="bg-gradient-to-b from-emerald-50/90 to-teal-50/70 border border-emerald-300/80 rounded-xl p-3.5 text-emerald-950 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-200/80">
                    <span className="font-bold text-xs flex items-center space-x-1.5 text-emerald-900">
                      <Users className="w-4 h-4 text-emerald-700" />
                      <span>Парное досье спарринга</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold shadow-2xs">
                      Match: 98%
                    </span>
                  </div>

                  {/* Partner mini profile */}
                  <div className="flex items-center space-x-2.5 bg-white/90 p-2.5 rounded-lg border border-emerald-200/70 text-slate-800">
                    <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                      АЛ
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-slate-900 truncate flex items-center justify-between">
                        <span>{(selectedNode as any).pairTask?.aiAgentsNegotiationSummary?.partnerName || 'Алексей (Senior Lead)'}</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Онлайн" />
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        Цель: {(selectedNode as any).pairTask?.aiAgentsNegotiationSummary?.partnerGoal || 'Защита архитектурных инвариантов'}
                      </div>
                    </div>
                  </div>

                  {/* Role Selector & Card */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-700">
                      <span>Ролевая матрица раунда:</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 p-0.5 bg-emerald-100/70 rounded-lg border border-emerald-200 text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRoleTab('roleA');
                          playChime('click');
                        }}
                        className={`py-1 px-2 rounded-md font-medium transition ${
                          selectedRoleTab === 'roleA'
                            ? 'bg-white text-emerald-950 font-bold shadow-2xs'
                            : 'text-emerald-800 hover:text-emerald-950'
                        }`}
                      >
                        Роль А: Архитектор
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRoleTab('roleB');
                          playChime('click');
                        }}
                        className={`py-1 px-2 rounded-md font-medium transition ${
                          selectedRoleTab === 'roleB'
                            ? 'bg-white text-emerald-950 font-bold shadow-2xs'
                            : 'text-emerald-800 hover:text-emerald-950'
                        }`}
                      >
                        Роль Б: Аудитор
                      </button>
                    </div>

                    {/* Active Role Details */}
                    {selectedRoleTab === 'roleA' ? (
                      <div className="bg-white/95 p-3 rounded-lg border border-emerald-200/80 space-y-2 text-[11px]">
                        <div className="font-bold text-slate-900 flex items-center justify-between">
                          <span>{(selectedNode as any).pairTask?.roleA?.title || 'Главный Архитектор (Driver)'}</span>
                          <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-bold">5 мин</span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {(selectedNode as any).pairTask?.roleA?.description || 'Отвечает за обоснование выбранных инвариантов, декомпозицию и защиту компромиссов (Trade-offs).'}
                        </p>
                        
                        {/* Starter Prompt with Copy */}
                        {(selectedNode as any).pairTask?.roleA?.starterPrompt && (
                          <div className="bg-slate-50 p-2 rounded border border-slate-200">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mb-1">
                              <span>Стартовый тезис для эфира:</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText((selectedNode as any).pairTask.roleA.starterPrompt);
                                  setCopiedPrompt(true);
                                  setTimeout(() => setCopiedPrompt(false), 2000);
                                  playChime('click');
                                }}
                                className="text-emerald-700 hover:text-emerald-900 flex items-center space-x-1"
                              >
                                {copiedPrompt ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedPrompt ? 'Скопировано' : 'Копировать'}</span>
                              </button>
                            </div>
                            <div className="text-[11px] text-slate-800 italic font-mono">
                              {(selectedNode as any).pairTask.roleA.starterPrompt}
                            </div>
                          </div>
                        )}

                        {/* Talking Points */}
                        {(selectedNode as any).pairTask?.roleA?.talkingPoints && (
                          <div className="space-y-1 pt-1">
                            <span className="text-[10px] font-bold text-slate-700">Опорные тезисы спикера:</span>
                            <ul className="space-y-0.5 text-[10px] text-slate-600 list-disc list-inside">
                              {(selectedNode as any).pairTask.roleA.talkingPoints.map((pt: string, i: number) => (
                                <li key={i}>{pt}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-white/95 p-3 rounded-lg border border-emerald-200/80 space-y-2 text-[11px]">
                        <div className="font-bold text-slate-900 flex items-center justify-between">
                          <span>{(selectedNode as any).pairTask?.roleB?.title || 'Аудитор безопасности (Navigator)'}</span>
                          <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold">5 мин</span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {(selectedNode as any).pairTask?.roleB?.description || 'Проводит аудит на прочность, моделирует 3 нештатных инцидента и задает провокационные вопросы по протоколу SBI.'}
                        </p>

                        {/* Starter Prompt with Copy */}
                        {(selectedNode as any).pairTask?.roleB?.starterPrompt && (
                          <div className="bg-slate-50 p-2 rounded border border-slate-200">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mb-1">
                              <span>Провокационный вопрос:</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText((selectedNode as any).pairTask.roleB.starterPrompt);
                                  setCopiedPrompt(true);
                                  setTimeout(() => setCopiedPrompt(false), 2000);
                                  playChime('click');
                                }}
                                className="text-emerald-700 hover:text-emerald-900 flex items-center space-x-1"
                              >
                                {copiedPrompt ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedPrompt ? 'Скопировано' : 'Копировать'}</span>
                              </button>
                            </div>
                            <div className="text-[11px] text-slate-800 italic font-mono">
                              {(selectedNode as any).pairTask.roleB.starterPrompt}
                            </div>
                          </div>
                        )}

                        {/* Talking Points */}
                        {(selectedNode as any).pairTask?.roleB?.talkingPoints && (
                          <div className="space-y-1 pt-1">
                            <span className="text-[10px] font-bold text-slate-700">Линии атаки и стресс-теста:</span>
                            <ul className="space-y-0.5 text-[10px] text-slate-600 list-disc list-inside">
                              {(selectedNode as any).pairTask.roleB.talkingPoints.map((pt: string, i: number) => (
                                <li key={i}>{pt}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* AI Agent Matchmaking Negotiation Log */}
                  <div className="bg-emerald-100/60 p-2 rounded-lg border border-emerald-200 text-[10px] text-emerald-900">
                    <div className="font-bold flex items-center space-x-1 mb-0.5 text-emerald-950">
                      <Bot className="w-3 h-3 text-emerald-700" />
                      <span>Лог ИИ-согласования агентов:</span>
                    </div>
                    <div className="font-mono text-emerald-800 leading-tight">
                      {(selectedNode as any).pairTask?.aiAgentsNegotiationSummary?.negotiationLog || 
                        'Автономные ИИ-агенты выровняли уровень сложности, распределили роли Архитектор ↔ Аудитор и зафиксировали регламент защиты.'}
                    </div>
                  </div>
                </div>
              )}

              {/* Memory Retention & Ebbinghaus Status if completed */}
              {selectedNode.status === 'completed' && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 text-[11px] flex items-center space-x-1">
                      <Brain className="w-3.5 h-3.5 text-sky-600" />
                      <span>Память Эббингауза:</span>
                    </span>
                    {(() => {
                      const ret = retentionsMap.get(selectedNode.id);
                      const pct = ret?.retentionPercentage ?? 100;
                      return (
                        <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          pct >= 85
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : pct >= 65
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : pct >= 40
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {pct}% {pct >= 85 ? '🔥 Свежо' : pct >= 65 ? '⚡ Тепло' : pct >= 40 ? '⏳ Остывает' : '❄️ Забыто'}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        (retentionsMap.get(selectedNode.id)?.retentionPercentage ?? 100) >= 85
                          ? 'bg-emerald-500'
                          : (retentionsMap.get(selectedNode.id)?.retentionPercentage ?? 100) >= 65
                          ? 'bg-sky-500'
                          : (retentionsMap.get(selectedNode.id)?.retentionPercentage ?? 100) >= 40
                          ? 'bg-amber-400'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${retentionsMap.get(selectedNode.id)?.retentionPercentage ?? 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Повторений: {retentionsMap.get(selectedNode.id)?.repetitionCount ?? 1}</span>
                    <span>Интервал: {retentionsMap.get(selectedNode.id)?.stabilityDays ?? 2} дн.</span>
                  </div>

                  {onOpenBlitzModal && (
                    <button
                      type="button"
                      onClick={() => {
                        playChime('click');
                        onOpenBlitzModal(selectedNode.id);
                      }}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-[11px] flex items-center justify-center space-x-1.5 transition-all shadow-2xs cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>Экспресс-блиц памяти (1 мин)</span>
                    </button>
                  )}
                </div>
              )}

              {/* Clean structured specs */}
              <div className="space-y-2 py-3 border-y border-slate-100 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Автор:</span>
                  <span className="text-slate-800 font-medium">{selectedNode.authorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Длительность:</span>
                  <span className="font-mono tabular-nums text-slate-800 font-medium">{selectedNode.estimatedTimeMin} мин</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Формат:</span>
                  <span className="text-slate-700">20% Теория · 10% Тест · 70% Практика</span>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium text-slate-700 mb-1.5">
                  Требуемый артефакт в портфолио:
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800 text-[11px] font-mono leading-relaxed">
                  {selectedNode.artifactRequirement}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium text-slate-700 mb-1">
                  Пререквизиты:
                </div>
                <div className="text-[11px] text-slate-500">
                  {selectedNode.dependencies.length > 0 
                    ? selectedNode.dependencies.join(', ') 
                    : 'Вводный квант (нет пререквизитов)'}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Выберите модуль на графе для просмотра
            </div>
          )}

          {selectedNode && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              {(selectedNode.type === 'pair' || (selectedNode as any).pairTask) && onStartCallWithPartner && (
                <button
                  id="btn-start-pair-call"
                  type="button"
                  onClick={() => {
                    playChime('success');
                    onStartCallWithPartner({
                      name: (selectedNode as any).pairTask?.partnerName || 'Напарник P2P',
                      role: 'Напарник по спаррингу',
                      pairTask: (selectedNode as any).pairTask,
                    });
                  }}
                  className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-2xs"
                >
                  <PhoneCall className="w-3.5 h-3.5 fill-current" />
                  <span>Созвониться и начать спарринг</span>
                </button>
              )}

              <button
                id="btn-launch-unit"
                type="button"
                onClick={() => onLaunchUnit(selectedNode.unitId)}
                className="w-full py-2.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-2xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Запустить в Фокус-Студии</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
