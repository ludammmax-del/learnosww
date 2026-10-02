import React, { useState, useMemo } from 'react';
import { 
  Maximize2, 
  Minimize2, 
  Code, 
  Eye, 
  Copy, 
  Check, 
  BarChart3, 
  TrendingUp, 
  PieChart as PieIcon, 
  Layers, 
  GitCommit, 
  Sparkles, 
  ArrowRight,
  Database,
  Shield,
  Zap,
  Info
} from 'lucide-react';
import { playChime } from '../../utils/audio.ts';

export interface VisualBlockData {
  rawCode: string;
  type: 'mermaid' | 'chart' | 'schema' | 'process' | 'mindmap' | 'comparison' | 'matrix';
  chartSubtype?: 'bar' | 'line' | 'pie' | 'metric' | 'tradeoff' | 'comparison';
  title?: string;
}

interface RichVisualDiagramRendererProps {
  rawCode: string;
  language?: string;
  title?: string;
}

export const RichVisualDiagramRenderer: React.FC<RichVisualDiagramRendererProps> = ({
  rawCode,
  language = 'mermaid',
  title,
}) => {
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Determine diagram category
  const blockType = useMemo<'mermaid' | 'chart' | 'process' | 'schema' | 'mindmap' | 'comparison'>(() => {
    const lang = (language || '').toLowerCase().trim();
    if (lang.includes('chart') || lang.includes('bar') || lang.includes('line') || lang.includes('pie')) return 'chart';
    if (lang.includes('process') || lang.includes('pipeline') || lang.includes('step')) return 'process';
    if (lang.includes('schema') || lang.includes('arch') || lang.includes('system')) return 'schema';
    if (lang.includes('mindmap') || lang.includes('tree')) return 'mindmap';
    if (lang.includes('comparison') || lang.includes('tradeoff') || lang.includes('matrix')) return 'comparison';
    return 'mermaid';
  }, [language]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(rawCode);
    setCopied(true);
    playChime('click');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className={`my-5 rounded-2xl border transition-all duration-300 overflow-hidden shadow-md ${
        isExpanded 
          ? 'fixed inset-4 z-50 bg-slate-900/98 backdrop-blur-xl border-sky-500/50 shadow-2xl flex flex-col p-4' 
          : 'bg-gradient-to-b from-slate-900/90 to-slate-950/95 border-slate-700/70 text-slate-100'
      }`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/80 border-b border-slate-700/60 select-none">
        <div className="flex items-center space-x-2.5">
          <span className="p-1 rounded-md bg-sky-500/20 text-sky-400 border border-sky-500/30">
            {blockType === 'chart' && <BarChart3 className="w-4 h-4" />}
            {blockType === 'mermaid' && <GitCommit className="w-4 h-4" />}
            {blockType === 'process' && <Zap className="w-4 h-4" />}
            {blockType === 'schema' && <Layers className="w-4 h-4" />}
            {blockType === 'mindmap' && <Sparkles className="w-4 h-4" />}
            {blockType === 'comparison' && <TrendingUp className="w-4 h-4" />}
          </span>
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center space-x-2">
              <span>{title || getAutoTitle(blockType, rawCode)}</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-700/80 text-sky-300 font-semibold">
                {language}
              </span>
            </h4>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Toggle Visual / Code */}
          <button
            type="button"
            onClick={() => {
              setViewMode(v => v === 'visual' ? 'code' : 'visual');
              playChime('click');
            }}
            className={`px-2 py-1 rounded text-[11px] font-medium flex items-center space-x-1 transition cursor-pointer ${
              viewMode === 'visual'
                ? 'bg-sky-600/30 text-sky-300 border border-sky-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Переключить вид: Визуальная схема / Код"
          >
            {viewMode === 'visual' ? <Code className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{viewMode === 'visual' ? 'Исходный код' : 'Визуализация'}</span>
          </button>

          {/* Copy code button */}
          <button
            type="button"
            onClick={handleCopyCode}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            title="Скопировать описание схемы"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Expand / Minimize button */}
          <button
            type="button"
            onClick={() => {
              setIsExpanded(e => !e);
              playChime('click');
            }}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            title={isExpanded ? 'Свернуть' : 'Развернуть на весь экран'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className={`p-4 overflow-auto ${isExpanded ? 'flex-1 max-h-[85vh]' : 'max-h-[520px]'}`}>
        {viewMode === 'code' ? (
          <pre className="p-3.5 rounded-xl bg-black/60 border border-slate-800 text-xs font-mono text-sky-200 overflow-x-auto leading-relaxed">
            <code>{rawCode}</code>
          </pre>
        ) : (
          <div className="w-full flex flex-col items-center justify-center">
            {blockType === 'chart' && (
              <RenderChartVisual rawCode={rawCode} />
            )}
            {blockType === 'process' && (
              <RenderProcessVisual rawCode={rawCode} />
            )}
            {blockType === 'schema' && (
              <RenderArchitectureVisual rawCode={rawCode} />
            )}
            {blockType === 'mindmap' && (
              <RenderMindmapVisual rawCode={rawCode} />
            )}
            {blockType === 'comparison' && (
              <RenderComparisonVisual rawCode={rawCode} />
            )}
            {blockType === 'mermaid' && (
              <RenderMermaidFlowchart 
                rawCode={rawCode} 
                selectedNode={selectedNode}
                onSelectNode={(id) => setSelectedNode(id === selectedNode ? null : id)}
              />
            )}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-1.5 bg-slate-950/70 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 select-none">
        <span className="flex items-center space-x-1">
          <Info className="w-3 h-3 text-sky-400" />
          <span>Интерактивная визуализация: кликайте по узлам для подсветки связей</span>
        </span>
        <span className="text-slate-500 font-mono">
          Интегрировано ИИ-методистом
        </span>
      </div>
    </div>
  );
};

function getAutoTitle(type: string, code: string): string {
  // Check if first line has title comment like %% Title or title:
  const firstLines = code.split('\n').slice(0, 3);
  for (const l of firstLines) {
    const clean = l.trim();
    if (clean.toLowerCase().startsWith('title:')) {
      return clean.replace(/title:/i, '').trim();
    }
    if (clean.startsWith('%%') && clean.length > 3) {
      return clean.replace(/^%%+\s*/, '').trim();
    }
  }

  switch (type) {
    case 'chart': return 'График и распределение метрик';
    case 'process': return 'Пошаговый процесс и алгоритм';
    case 'schema': return 'Архитектурная схема компонентов';
    case 'mindmap': return 'Ментальная карта концепций';
    case 'comparison': return 'Сравнительная матрица и компромиссы';
    default: return 'Интерактивная блок-схема и связи';
  }
}

/* =========================================================================
   1. MERMAID / FLOWCHART SVG RENDERER
   ========================================================================= */

interface FlowNode {
  id: string;
  label: string;
  shape: 'rect' | 'round' | 'diamond' | 'cylinder' | 'circle' | 'pill';
  subtext?: string;
  level?: number;
  highlightColor?: string;
}

interface FlowEdge {
  from: string;
  to: string;
  label?: string;
  style: 'solid' | 'dashed' | 'thick';
}

function parseMermaidGraph(code: string): { nodes: FlowNode[]; edges: FlowEdge[]; direction: 'TD' | 'LR' } {
  const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%'));
  const nodesMap = new Map<string, FlowNode>();
  const edges: FlowEdge[] = [];
  let direction: 'TD' | 'LR' = 'TD';

  for (const line of lines) {
    if (line.includes('graph LR') || line.includes('flowchart LR')) {
      direction = 'LR';
      continue;
    }
    if (line.includes('graph TD') || line.includes('graph TB') || line.includes('flowchart TD')) {
      direction = 'TD';
      continue;
    }

    // Match edge like A[Label A] -->|Text| B[Label B] or A --> B or A -.-> B or A ==> B
    // Regex matches left node, edge type, optional label, right node
    const edgeMatch = line.match(/^([A-Za-z0-9_\-\.\/]+(?:\[.*?\]|\(.*?\)|<.*?>|\{.*?\}|\(\[.*?\]\)|\[\(.*?\)\])?)\s*(-->|-.->|==>|---|---\|.*?\|--->|-->\|.*?\||--\s*.*?\s*-->)\s*([A-Za-z0-9_\-\.\/]+(?:\[.*?\]|\(.*?\)|<.*?>|\{.*?\}|\(\[.*?\]\)|\[\(.*?\)\])?)/);

    if (edgeMatch) {
      const rawLeft = edgeMatch[1];
      const rawConn = edgeMatch[2];
      const rawRight = edgeMatch[3];

      const leftNode = parseNodeDef(rawLeft);
      const rightNode = parseNodeDef(rawRight);

      if (!nodesMap.has(leftNode.id)) nodesMap.set(leftNode.id, leftNode);
      if (!nodesMap.has(rightNode.id)) nodesMap.set(rightNode.id, rightNode);

      // Extract edge label
      let edgeLabel = '';
      const labelMatch = rawConn.match(/\|(.*?)\|/);
      if (labelMatch) {
        edgeLabel = labelMatch[1];
      }

      let edgeStyle: 'solid' | 'dashed' | 'thick' = 'solid';
      if (rawConn.includes('-.->')) edgeStyle = 'dashed';
      else if (rawConn.includes('==>')) edgeStyle = 'thick';

      edges.push({
        from: leftNode.id,
        to: rightNode.id,
        label: edgeLabel,
        style: edgeStyle,
      });
    } else {
      // Standalone node definition
      const nodeDef = parseNodeDef(line);
      if (nodeDef.label && !nodesMap.has(nodeDef.id)) {
        nodesMap.set(nodeDef.id, nodeDef);
      }
    }
  }

  // If no nodes found, create fallback structure
  if (nodesMap.size === 0) {
    return {
      direction: 'TD',
      nodes: [
        { id: 'start', label: '1. Входные условия и постановка задачи', shape: 'pill' },
        { id: 'process', label: '2. Обработка и проверка инвариантов', shape: 'rect' },
        { id: 'decision', label: '3. Проверка критериев качества?', shape: 'diamond' },
        { id: 'success', label: '4. Успешная фиксация артефакта', shape: 'pill' },
      ],
      edges: [
        { from: 'start', to: 'process', style: 'solid' },
        { from: 'process', to: 'decision', style: 'solid' },
        { from: 'decision', to: 'success', label: 'Да / Соответствует', style: 'thick' },
      ],
    };
  }

  return {
    direction,
    nodes: Array.from(nodesMap.values()),
    edges,
  };
}

function parseNodeDef(raw: string): FlowNode {
  let clean = raw.trim();
  let shape: FlowNode['shape'] = 'rect';

  // Cylinder: id[(Label)]
  if (clean.includes('[(') && clean.includes(')]')) {
    const id = clean.substring(0, clean.indexOf('[(')).trim();
    const label = clean.substring(clean.indexOf('[(') + 2, clean.indexOf(')]')).trim();
    return { id: id || label, label, shape: 'cylinder' };
  }

  // Pill / Stadium: id([Label])
  if (clean.includes('([') && clean.includes('])')) {
    const id = clean.substring(0, clean.indexOf('([')).trim();
    const label = clean.substring(clean.indexOf('([') + 2, clean.indexOf('])')).trim();
    return { id: id || label, label, shape: 'pill' };
  }

  // Diamond: id{Label}
  if (clean.includes('{') && clean.includes('}')) {
    const id = clean.substring(0, clean.indexOf('{')).trim();
    const label = clean.substring(clean.indexOf('{') + 1, clean.indexOf('}')).trim();
    return { id: id || label, label, shape: 'diamond' };
  }

  // Round / Circle: id((Label)) or id(Label)
  if (clean.includes('((') && clean.includes('))')) {
    const id = clean.substring(0, clean.indexOf('((')).trim();
    const label = clean.substring(clean.indexOf('((') + 2, clean.indexOf('))')).trim();
    return { id: id || label, label, shape: 'circle' };
  }
  if (clean.includes('(') && clean.includes(')')) {
    const id = clean.substring(0, clean.indexOf('(')).trim();
    const label = clean.substring(clean.indexOf('(') + 1, clean.indexOf(')')).trim();
    return { id: id || label, label, shape: 'round' };
  }

  // Rect: id[Label]
  if (clean.includes('[') && clean.includes(']')) {
    const id = clean.substring(0, clean.indexOf('[')).trim();
    const label = clean.substring(clean.indexOf('[') + 1, clean.indexOf(']')).trim();
    return { id: id || label, label, shape: 'rect' };
  }

  return { id: clean, label: clean, shape: 'rect' };
}

const RenderMermaidFlowchart: React.FC<{
  rawCode: string;
  selectedNode: string | null;
  onSelectNode: (id: string) => void;
}> = ({ rawCode, selectedNode, onSelectNode }) => {
  const { nodes, edges, direction } = useMemo(() => parseMermaidGraph(rawCode), [rawCode]);

  // Layout calculation: Assign ranks / levels to nodes
  const nodeLayout = useMemo(() => {
    const inDegrees = new Map<string, number>();
    const adj = new Map<string, string[]>();
    nodes.forEach(n => {
      inDegrees.set(n.id, 0);
      adj.set(n.id, []);
    });

    edges.forEach(e => {
      adj.get(e.from)?.push(e.to);
      inDegrees.set(e.to, (inDegrees.get(e.to) || 0) + 1);
    });

    // Compute levels with strict cycle prevention and bounded iteration queue
    const levels = new Map<string, number>();
    const visited = new Set<string>();
    const queue: Array<{ id: string; level: number }> = [];

    nodes.forEach(n => {
      if ((inDegrees.get(n.id) || 0) === 0) {
        levels.set(n.id, 0);
        visited.add(n.id);
        queue.push({ id: n.id, level: 0 });
      }
    });

    // Fallback if cyclic or missing roots
    if (queue.length === 0 && nodes.length > 0) {
      levels.set(nodes[0].id, 0);
      visited.add(nodes[0].id);
      queue.push({ id: nodes[0].id, level: 0 });
    }

    let iterations = 0;
    const maxIterations = nodes.length * 4 + 20;

    while (queue.length > 0 && iterations < maxIterations) {
      iterations++;
      const item = queue.shift()!;
      const u = item.id;
      const uLevel = item.level;
      const neighbors = adj.get(u) || [];

      for (const v of neighbors) {
        if (!visited.has(v)) {
          const nextLevel = Math.min(uLevel + 1, 8);
          visited.add(v);
          levels.set(v, nextLevel);
          queue.push({ id: v, level: nextLevel });
        }
      }
    }

    // Default remaining unvisited nodes
    nodes.forEach((n, idx) => {
      if (!levels.has(n.id)) levels.set(n.id, idx % 3);
    });

    // Group nodes by level
    const levelGroups = new Map<number, FlowNode[]>();
    nodes.forEach(n => {
      const lvl = levels.get(n.id) || 0;
      if (!levelGroups.has(lvl)) levelGroups.set(lvl, []);
      levelGroups.get(lvl)!.push(n);
    });

    const maxLevel = Math.max(...Array.from(levelGroups.keys()), 0);

    return { levels, levelGroups, maxLevel };
  }, [nodes, edges]);

  const isLR = direction === 'LR';

  return (
    <div className="w-full flex flex-col items-center justify-center p-3 space-y-6">
      {/* Node flow visual grid */}
      <div className={`flex ${isLR ? 'flex-row items-center justify-center space-x-6' : 'flex-col items-center justify-center space-y-4'} w-full max-w-2xl`}>
        {Array.from(nodeLayout.levelGroups.entries())
          .sort(([a], [b]) => a - b)
          .map(([levelNum, levelNodes]) => (
            <div key={levelNum} className="flex flex-col items-center w-full">
              {/* Level Nodes */}
              <div className="flex flex-wrap items-center justify-center gap-4 w-full">
                {levelNodes.map(node => {
                  const isSelected = selectedNode === node.id;
                  const isConnected = selectedNode && edges.some(e => 
                    (e.from === selectedNode && e.to === node.id) || 
                    (e.to === selectedNode && e.from === node.id)
                  );

                  return (
                    <div
                      key={node.id}
                      onClick={() => onSelectNode(node.id)}
                      className={`group relative px-4 py-3 min-w-[160px] max-w-[240px] text-center cursor-pointer transition-all duration-200 transform hover:-translate-y-0.5 select-none ${
                        node.shape === 'pill' ? 'rounded-full' :
                        node.shape === 'round' ? 'rounded-2xl' :
                        node.shape === 'diamond' ? 'rounded-xl rotate-1 group-hover:rotate-0' :
                        node.shape === 'cylinder' ? 'rounded-t-lg rounded-b-xl border-t-4' :
                        'rounded-xl'
                      } ${
                        isSelected
                          ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white ring-4 ring-sky-400/40 shadow-lg shadow-sky-500/20 scale-105'
                          : isConnected
                          ? 'bg-slate-800 text-sky-200 ring-2 ring-sky-500/50 border border-sky-400'
                          : 'bg-slate-900/90 text-slate-200 hover:bg-slate-800 border border-slate-700/80 hover:border-sky-500/50 shadow'
                      }`}
                    >
                      {/* Shape icon hint */}
                      <div className="flex items-center justify-center space-x-1 mb-1 opacity-70 group-hover:opacity-100">
                        {node.shape === 'cylinder' && <Database className="w-3 h-3 text-amber-400" />}
                        {node.shape === 'diamond' && <Zap className="w-3 h-3 text-purple-400" />}
                        {node.shape === 'pill' && <Shield className="w-3 h-3 text-emerald-400" />}
                        <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 group-hover:text-sky-300">
                          {node.id}
                        </span>
                      </div>

                      <div className="text-xs font-semibold leading-snug">
                        {node.label}
                      </div>

                      {/* Active glow pulse */}
                      {isSelected && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Edge connectors to next level */}
              {levelNum < nodeLayout.maxLevel && (
                <div className="my-2 flex flex-col items-center justify-center">
                  {edges
                    .filter(e => levelNodes.some(n => n.id === e.from))
                    .map((edge, eIdx) => (
                      <div key={eIdx} className="flex flex-col items-center py-1">
                        {edge.label && (
                          <span className="px-2 py-0.5 mb-1 rounded-full text-[10px] font-mono font-medium bg-slate-800 border border-slate-700 text-amber-300 shadow-sm">
                            {edge.label}
                          </span>
                        )}
                        <div className={`w-0.5 h-5 ${edge.style === 'dashed' ? 'border-r-2 border-dashed border-sky-400' : edge.style === 'thick' ? 'w-1 bg-sky-400' : 'bg-slate-600'}`} />
                        <ArrowRight className={`w-3.5 h-3.5 ${isLR ? '' : 'rotate-90'} ${edge.style === 'thick' ? 'text-sky-400' : 'text-slate-500'}`} />
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

/* =========================================================================
   2. CHARTS & DATA VISUALIZATIONS RENDERER (Bar, Line, Pie, Metric)
   ========================================================================= */

interface ChartDataPoint {
  label: string;
  value: number;
  value2?: number;
  secondaryLabel?: string;
  color?: string;
  highlight?: boolean;
}

function parseChartData(code: string): {
  type: 'bar' | 'line' | 'pie' | 'comparison' | 'metric';
  title?: string;
  data: ChartDataPoint[];
  unit?: string;
} {
  try {
    // Check if JSON
    const trimmed = code.trim();
    if (trimmed.startsWith('{')) {
      const parsed = JSON.parse(trimmed);
      return {
        type: parsed.type || 'bar',
        title: parsed.title,
        data: Array.isArray(parsed.data) ? parsed.data : [],
        unit: parsed.unit || '',
      };
    }
  } catch {}

  // Parse simple line format: "Label: 85" or "Label | 85 | Secondary"
  const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%') && !l.startsWith('#'));
  let type: 'bar' | 'line' | 'pie' | 'comparison' | 'metric' = 'bar';
  let title = '';
  let unit = '';
  const data: ChartDataPoint[] = [];

  for (const line of lines) {
    if (line.toLowerCase().startsWith('type:')) {
      const val = line.split(':')[1]?.trim().toLowerCase();
      if (['bar', 'line', 'pie', 'comparison', 'metric'].includes(val)) {
        type = val as any;
      }
      continue;
    }
    if (line.toLowerCase().startsWith('title:')) {
      title = line.split(':')[1]?.trim();
      continue;
    }
    if (line.toLowerCase().startsWith('unit:')) {
      unit = line.split(':')[1]?.trim();
      continue;
    }

    // Split by ':' or '|' or '\t'
    const parts = line.split(/[:|]/);
    if (parts.length >= 2) {
      const label = parts[0].trim();
      const numMatch = parts[1].match(/-?\d+(\.\d+)?/);
      if (numMatch) {
        const val = parseFloat(numMatch[0]);
        let val2: number | undefined;
        if (parts[2]) {
          const num2Match = parts[2].match(/-?\d+(\.\d+)?/);
          if (num2Match) val2 = parseFloat(num2Match[0]);
        }
        data.push({ label, value: val, value2: val2 });
      }
    }
  }

  if (data.length === 0) {
    // Default sample data
    return {
      type: 'bar',
      title: 'Сравнение ключевых показателей',
      unit: '%',
      data: [
        { label: 'Пассивное чтение (без практики)', value: 15, color: '#f43f5e' },
        { label: 'Механическое заучивание', value: 35, color: '#f59e0b' },
        { label: 'Осознанная практика (Deliberate)', value: 82, color: '#0ea5e9' },
        { label: 'Тест чистого листа + Спарринг', value: 95, color: '#10b981' },
      ],
    };
  }

  return { type, title, data, unit };
}

const RenderChartVisual: React.FC<{ rawCode: string }> = ({ rawCode }) => {
  const { type, title, data, unit } = useMemo(() => parseChartData(rawCode), [rawCode]);
  const maxValue = Math.max(...data.map(d => Math.max(d.value, d.value2 || 0)), 100);

  const colors = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f43f5e', '#06b6d4'];

  return (
    <div className="w-full max-w-2xl py-2 space-y-4">
      {title && (
        <div className="text-xs font-bold text-slate-200 text-center border-b border-slate-800 pb-2">
          {title}
        </div>
      )}

      {/* Bar Chart Mode */}
      {(type === 'bar' || type === 'metric') && (
        <div className="space-y-3">
          {data.map((item, idx) => {
            const pct = Math.min(100, Math.max(5, (item.value / maxValue) * 100));
            const barColor = item.color || colors[idx % colors.length];

            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-300">{item.label}</span>
                  <span className="font-mono font-bold text-sky-400">
                    {item.value} {unit}
                  </span>
                </div>
                <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
                  <div
                    className="h-full rounded-full transition-all duration-500 relative flex items-center justify-end pr-2"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: barColor,
                    }}
                  >
                    <span className="text-[10px] font-mono text-white font-bold drop-shadow">
                      {item.value}{unit ? ` ${unit}` : ''}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comparison Dual Bar Mode */}
      {type === 'comparison' && (
        <div className="space-y-3.5">
          {data.map((item, idx) => {
            const v1 = item.value;
            const v2 = item.value2 ?? 0;
            return (
              <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-200">{item.label}</div>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Вариант А</span>
                      <span className="font-mono text-rose-400 font-bold">{v1}</span>
                    </div>
                    <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(v1 / maxValue) * 100}%` }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Вариант Б (Оптимальный)</span>
                      <span className="font-mono text-emerald-400 font-bold">{v2}</span>
                    </div>
                    <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(v2 / maxValue) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Donut / Pie mode */}
      {type === 'pie' && (
        <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
          {/* SVG Pie */}
          <div className="relative w-36 h-36">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {(() => {
                const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
                let cumulativeAngle = 0;
                return data.map((d, i) => {
                  const fraction = d.value / total;
                  const dashArray = `${fraction * 283} 283`;
                  const dashOffset = -cumulativeAngle * 283;
                  cumulativeAngle += fraction;
                  return (
                    <circle
                      key={i}
                      cx="50"
                      cy="50"
                      r="45"
                      fill="transparent"
                      stroke={d.color || colors[i % colors.length]}
                      strokeWidth="10"
                      strokeDasharray={dashArray}
                      strokeDashoffset={dashOffset}
                      className="transition-all duration-300 hover:stroke-[12] cursor-pointer"
                    />
                  );
                });
              })()}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] text-slate-400">Всего</span>
              <span className="text-xs font-bold text-white font-mono">100%</span>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-1.5 flex-1 max-w-xs">
            {data.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color || colors[i % colors.length] }} />
                  <span className="text-slate-300 truncate max-w-[160px]">{d.label}</span>
                </div>
                <span className="font-mono font-bold text-slate-100">{d.value}{unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Line trend SVG mode */}
      {type === 'line' && (
        <div className="space-y-2">
          <div className="relative h-44 w-full bg-slate-950 p-2 rounded-xl border border-slate-800">
            <svg viewBox="0 0 400 140" className="w-full h-full overflow-visible">
              {/* Grid lines */}
              <line x1="20" y1="20" x2="380" y2="20" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.5" />
              <line x1="20" y1="70" x2="380" y2="70" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.5" />
              <line x1="20" y1="120" x2="380" y2="120" stroke="#334155" strokeWidth="0.5" />

              {/* Data points and curve */}
              {(() => {
                if (data.length < 2) return null;
                const step = 360 / (data.length - 1);
                const points = data.map((d, i) => {
                  const x = 20 + i * step;
                  const y = 120 - (d.value / maxValue) * 100;
                  return { x, y, ...d };
                });

                const pathString = points.reduce((acc, p, i) => 
                  i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, ''
                );

                return (
                  <>
                    <path
                      d={pathString}
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {points.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r="4" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                        <text x={p.x} y={p.y - 8} textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">
                          {p.value}
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono px-2">
            {data.map((d, i) => (
              <span key={i}>{d.label}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   3. PROCESS & PIPELINE VISUAL RENDERER
   ========================================================================= */

const RenderProcessVisual: React.FC<{ rawCode: string }> = ({ rawCode }) => {
  const lines = rawCode.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%'));
  const steps = lines.map((l, idx) => {
    const clean = l.replace(/^\d+[\.\)]\s*/, '').replace(/^[-*]\s*/, '');
    const parts = clean.split(/[:\->]/);
    const title = parts[0]?.trim() || `Шаг ${idx + 1}`;
    const desc = parts.slice(1).join(' - ').trim();
    return { stepNum: idx + 1, title, desc };
  });

  return (
    <div className="w-full max-w-2xl py-2 space-y-3">
      {steps.map((step, idx) => (
        <div key={idx} className="relative flex items-start space-x-3.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-sky-500/50 transition-all">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow">
            {step.stepNum}
          </div>
          <div className="flex-1 space-y-0.5">
            <h5 className="text-xs font-bold text-slate-200">{step.title}</h5>
            {step.desc && <p className="text-[11px] text-slate-400 leading-relaxed">{step.desc}</p>}
          </div>
          {idx < steps.length - 1 && (
            <div className="hidden sm:flex items-center text-slate-600">
              <ArrowRight className="w-4 h-4" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/* =========================================================================
   4. ARCHITECTURE / SYSTEM BOX RENDERER
   ========================================================================= */

const RenderArchitectureVisual: React.FC<{ rawCode: string }> = ({ rawCode }) => {
  const lines = rawCode.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%'));
  return (
    <div className="w-full max-w-2xl py-2 space-y-3">
      <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
        <div className="text-xs font-bold text-sky-400 flex items-center space-x-2 border-b border-slate-800 pb-2">
          <Layers className="w-4 h-4" />
          <span>Архитектурные слои и поток данных</span>
        </div>
        <div className="space-y-2.5">
          {lines.map((l, idx) => {
            const clean = l.replace(/^[-*#]\s*/, '').trim();
            return (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">{clean}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-300">
                  Уровень {idx + 1}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   5. MINDMAP CONCEPT TREE RENDERER
   ========================================================================= */

const RenderMindmapVisual: React.FC<{ rawCode: string }> = ({ rawCode }) => {
  const lines = rawCode.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%'));
  const root = lines[0]?.replace(/^[-*#]\s*/, '').trim() || 'Центральная концепция';
  const branches = lines.slice(1).map(l => l.replace(/^[-*#\t]\s*/, '').trim()).filter(Boolean);

  return (
    <div className="w-full max-w-2xl py-3 flex flex-col items-center space-y-4">
      {/* Root card */}
      <div className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white font-bold text-sm shadow-xl border border-sky-400/40 text-center">
        {root}
      </div>

      <div className="w-0.5 h-4 bg-sky-500/60" />

      {/* Branches grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
        {branches.map((b, idx) => (
          <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition-all flex items-start space-x-2.5">
            <span className="text-amber-400 font-mono text-sm">✦</span>
            <span className="text-xs text-slate-200 leading-snug">{b}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* =========================================================================
   6. COMPARISON / TRADEOFF MATRIX RENDERER
   ========================================================================= */

const RenderComparisonVisual: React.FC<{ rawCode: string }> = ({ rawCode }) => {
  const lines = rawCode.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%'));
  return (
    <div className="w-full max-w-2xl py-2 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-800/40 space-y-2">
          <h5 className="text-xs font-bold text-rose-300 flex items-center space-x-1.5">
            <span>✗ Антипаттерн / Уязвимость</span>
          </h5>
          <div className="text-xs text-slate-300 space-y-1">
            {lines.slice(0, Math.ceil(lines.length / 2)).map((l, i) => (
              <div key={i} className="flex items-start space-x-1.5">
                <span className="text-rose-400 text-xs">•</span>
                <span>{l.replace(/^[-*]\s*/, '')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-2">
          <h5 className="text-xs font-bold text-emerald-300 flex items-center space-x-1.5">
            <span>✓ Проверенный стандарт / Решение</span>
          </h5>
          <div className="text-xs text-slate-300 space-y-1">
            {lines.slice(Math.ceil(lines.length / 2)).map((l, i) => (
              <div key={i} className="flex items-start space-x-1.5">
                <span className="text-emerald-400 text-xs">•</span>
                <span>{l.replace(/^[-*]\s*/, '')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
