import { DAGNode, DAGEdge } from '../types.ts';

/**
 * Normalizes DAG nodes coordinates and edges so that:
 * 1. Blocks never overlap ("не один на один").
 * 2. Visual spacing between cards is comfortable (card width 260px + 140px gap = 400px step).
 * 3. Connecting directional lines ("линии") always exist and are clearly visible.
 * 4. Injected / boost branch modules are positioned below their base node.
 */
export function normalizeDagLayout(
  nodes: DAGNode[],
  edges: DAGEdge[] = []
): { nodes: DAGNode[]; edges: DAGEdge[] } {
  if (!nodes || nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  // 1. Detect if re-layout is needed:
  // - Are any coordinates missing, NaN, zero or negative?
  // - Do any two nodes collide? (distance < 280px horizontally while on same row)
  let needsRelayout = false;
  for (let i = 0; i < nodes.length; i++) {
    const ni = nodes[i];
    if (typeof ni.x !== 'number' || typeof ni.y !== 'number' || isNaN(ni.x) || isNaN(ni.y)) {
      needsRelayout = true;
      break;
    }
  }

  if (!needsRelayout) {
    // Check for collisions between nodes
    for (let i = 0; i < nodes.length; i++) {
      const ni = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const nj = nodes[j];
        const dx = Math.abs(ni.x - nj.x);
        const dy = Math.abs(ni.y - nj.y);
        // Card width is 260, height is ~160. If horizontal gap < 280 and vertical gap < 180, they collide.
        if (dx < 280 && dy < 180) {
          needsRelayout = true;
          break;
        }
      }
      if (needsRelayout) break;
    }
  }

  let finalNodes = [...nodes];

  if (needsRelayout) {
    // Check if this is a large multi-phase / 200 blocks curriculum
    const isMultiModule = nodes.length > 25;

    if (isMultiModule) {
      // Group nodes by phase (or chunks of 20)
      const phaseGroups = new Map<number, DAGNode[]>();
      nodes.forEach((node, idx) => {
        const phase = node.phase || Math.floor(idx / 20) + 1;
        if (!phaseGroups.has(phase)) phaseGroups.set(phase, []);
        phaseGroups.get(phase)!.push(node);
      });

      const sortedPhaseKeys = Array.from(phaseGroups.keys()).sort((a, b) => a - b);
      const positioned: DAGNode[] = [];

      sortedPhaseKeys.forEach((phaseKey, rowIdx) => {
        const groupNodes = phaseGroups.get(phaseKey) || [];
        const rowY = 160 + rowIdx * 280;
        groupNodes.forEach((node, colIdx) => {
          positioned.push({
            ...node,
            phase: phaseKey,
            x: 100 + colIdx * 380,
            y: rowY,
          });
        });
      });

      finalNodes = positioned;
    } else {
      // Standard linear + branch layout for standard courses (3-20 nodes)
      const mainNodes: DAGNode[] = [];
      const branchNodes: DAGNode[] = [];

      const sorted = [...nodes].sort((a, b) => {
        const pDiff = (a.phase || 1) - (b.phase || 1);
        if (pDiff !== 0) return pDiff;
        return 0;
      });

      sorted.forEach((node) => {
        if (node.type === 'injection' || node.status === 'stuck_injected' || node.sprint?.includes('Boost')) {
          branchNodes.push(node);
        } else {
          mainNodes.push(node);
        }
      });

      if (mainNodes.length === 0 && branchNodes.length > 0) {
        mainNodes.push(branchNodes.shift()!);
      }

      const START_X = 80;
      const STEP_X = 400; // 260px card width + 140px gap between cards
      const MAIN_Y = 180;
      const BRANCH_Y = 460; // below main track

      const positionedMain: DAGNode[] = mainNodes.map((node, idx) => ({
        ...node,
        x: START_X + idx * STEP_X,
        y: MAIN_Y,
      }));

      const positionedBranch: DAGNode[] = branchNodes.map((node) => {
        const depId = node.dependencies && node.dependencies.length > 0 ? node.dependencies[0] : null;
        const parent = positionedMain.find((m) => m.id === depId) || positionedMain[0];
        const parentX = parent ? parent.x : START_X;
        return {
          ...node,
          x: parentX,
          y: BRANCH_Y,
        };
      });

      finalNodes = [...positionedMain, ...positionedBranch];
    }
  }

  // 2. Normalize and ensure edges ("линии между блоками") without circular dependencies
  const nodeIds = new Set(finalNodes.map((n) => n.id));
  const rawEdges: DAGEdge[] = (edges || []).filter(
    (e) => e && nodeIds.has(e.from) && nodeIds.has(e.to) && e.from !== e.to
  );

  // Filter out any back-edges that introduce cycles to guarantee Directed Acyclic Graph property
  const validEdges = sanitizeDagEdges(finalNodes, rawEdges);
  const edgeSet = new Set(validEdges.map((e) => `${e.from}->${e.to}`));

  // Sort nodes in logical learning sequence (phase, then y, then x)
  const orderedNodes = [...finalNodes].sort((a, b) => {
    if ((a.phase || 1) !== (b.phase || 1)) return (a.phase || 1) - (b.phase || 1);
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  for (let i = 0; i < orderedNodes.length - 1; i++) {
    const fromId = orderedNodes[i].id;
    const toId = orderedNodes[i + 1].id;
    const key = `${fromId}->${toId}`;
    const reverseKey = `${toId}->${fromId}`;
    // Only connect forward sequentially if reverse doesn't already exist
    if (!edgeSet.has(key) && !edgeSet.has(reverseKey)) {
      validEdges.push({
        id: `e-${fromId}-${toId}`,
        from: fromId,
        to: toId,
      });
      edgeSet.add(key);
    }
  }

  return {
    nodes: finalNodes,
    edges: sanitizeDagEdges(finalNodes, validEdges),
  };
}

/**
 * Checks for directed cycles using DFS with recursion stack tracking (3-color algorithm).
 */
export function hasDirectedCycle(nodeIds: string[], edges: DAGEdge[]): boolean {
  const adj = new Map<string, string[]>();
  nodeIds.forEach((id) => adj.set(id, []));
  edges.forEach((e) => {
    if (adj.has(e.from)) adj.get(e.from)!.push(e.to);
  });

  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(curr: string): boolean {
    visited.add(curr);
    inStack.add(curr);

    const neighbors = adj.get(curr) || [];
    for (const next of neighbors) {
      if (!visited.has(next)) {
        if (dfs(next)) return true;
      } else if (inStack.has(next)) {
        return true; // Cycle detected
      }
    }

    inStack.delete(curr);
    return false;
  }

  for (const id of nodeIds) {
    if (!visited.has(id)) {
      if (dfs(id)) return true;
    }
  }
  return false;
}

/**
 * Sanitizes edges by removing any edge that introduces a circular dependency.
 */
export function sanitizeDagEdges(nodes: DAGNode[], edges: DAGEdge[]): DAGEdge[] {
  const nodeIds = nodes.map((n) => n.id);
  const safeEdges: DAGEdge[] = [];

  edges.forEach((edge) => {
    if (edge.from === edge.to) return;
    const candidate = [...safeEdges, edge];
    if (!hasDirectedCycle(nodeIds, candidate)) {
      safeEdges.push(edge);
    }
  });

  return safeEdges;
}

/**
 * Checks whether a node is unlocked based on all of its incoming prerequisite parents being completed.
 */
export function isDagNodeUnlocked(
  nodeId: string,
  edges: DAGEdge[],
  completedNodeIds: Set<string>
): boolean {
  const prerequisites = edges.filter((e) => e.to === nodeId).map((e) => e.from);
  if (prerequisites.length === 0) return true; // Root node
  return prerequisites.every((parentId) => completedNodeIds.has(parentId));
}

/**
 * Calculates dynamic canvas bounds to comfortably fit all nodes with margins.
 */
export function getCanvasDimensions(nodes: DAGNode[]): { width: number; height: number } {
  if (!nodes || nodes.length === 0) {
    return { width: 3200, height: 850 };
  }
  const maxX = Math.max(...nodes.map((n) => n.x || 0));
  const maxY = Math.max(...nodes.map((n) => n.y || 0));
  return {
    width: Math.max(3200, maxX + 600),
    height: Math.max(850, maxY + 400),
  };
}

/**
 * Computes dynamic Phase zone indicators aligned above the node columns.
 */
export function getPhaseHeaders(nodes: DAGNode[]): Array<{
  phase: number;
  title: string;
  left: number;
  color: string;
}> {
  const phaseMap = new Map<number, { minX: number; title: string }>();

  nodes.forEach((n) => {
    const p = n.phase || 1;
    const existing = phaseMap.get(p);
    const title = n.phaseTitle || `Месяц ${p}`;
    if (!existing) {
      phaseMap.set(p, { minX: n.x, title });
    } else {
      if (n.x < existing.minX) {
        existing.minX = n.x;
      }
    }
  });

  const colorPalette = [
    '#38bdf8', // Sky
    '#818cf8', // Indigo
    '#34d399', // Emerald
    '#fbbf24', // Amber
  ];

  return Array.from(phaseMap.entries())
    .sort(([pA], [pB]) => pA - pB)
    .map(([phase, data], idx) => ({
      phase,
      title: `${String(phase).padStart(2, '0')}. ${data.title.replace(/^Месяц \d+:\s*/i, '')}`,
      left: Math.max(40, data.minX),
      color: colorPalette[idx % colorPalette.length],
    }));
}
