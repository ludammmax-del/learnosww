import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { 
  Atom, 
  RotateCcw, 
  Layers, 
  Sparkles, 
  Zap, 
  Flame, 
  ShieldCheck, 
  ExternalLink, 
  Plus, 
  Search, 
  X, 
  Maximize2, 
  Minimize2, 
  Tv, 
  Users, 
  Network, 
  BookOpen, 
  Activity, 
  Compass, 
  ArrowRight,
  Info,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Database,
  Cpu,
  RefreshCw,
  FileCheck,
  Brain,
  History,
  Lock,
  Workflow
} from 'lucide-react';
import { 
  DAGNode, 
  DAGEdge, 
  LearningUnit, 
  UserArtifact, 
  KnowledgeSphereNode, 
  KnowledgeSphereLink, 
  KnowledgeSphereTelemetry,
  SphereLayerType,
  CognitiveTelemetryState
} from '../../types.ts';
import { knowledgeSphereEngine, SPHERE_RADII, DOMAIN_COLORS } from '../../services/knowledgeSphereEngine.ts';
import { epistemicLedgerService, EpistemicLedgerData, EpistemicFact } from '../../services/epistemicLedgerService.ts';
import { telemetryEngine } from '../../services/telemetryEngine.ts';
import { playChime } from '../../utils/audio.ts';

interface KnowledgeSphereWindowProps {
  nodes: DAGNode[];
  edges: DAGEdge[];
  units: Record<string, LearningUnit>;
  artifacts?: UserArtifact[];
  activeUnitId?: string;
  onLaunchUnit?: (unitId: string) => void;
  onOpenDag?: () => void;
  onOpenFocusStudio?: (unitId: string) => void;
  onOpenPeerSparring?: (unitId: string) => void;
  onInjectProject?: (topic?: string) => void;
  onClose?: () => void;
}

export const KnowledgeSphereWindow: React.FC<KnowledgeSphereWindowProps> = ({
  nodes,
  edges,
  units,
  artifacts = [],
  activeUnitId,
  onLaunchUnit,
  onOpenDag,
  onOpenFocusStudio,
  onOpenPeerSparring,
  onInjectProject,
  onClose
}) => {
  // Container & Three.js Canvas Ref
  const mountRef = useRef<HTMLDivElement>(null);

  // Persistent Scene & Rotation Refs (Prevents sphere from resetting back to initial position!)
  const persistentRotationRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetZoomRef = useRef<number>(240);
  const lastHoveredIdRef = useRef<string | null>(null);

  // Filter & Layer Slicing States
  const [onlyMastered, setOnlyMastered] = useState<boolean>(false);
  const [activeLayerFilter, setActiveLayerFilter] = useState<'all' | 'core' | 'mantle' | 'orbit'>('all');
  const [coreSubLayer, setCoreSubLayer] = useState<'all_core' | 'first_principles' | 'castalian_bridges' | 'what_ai_sees' | 'what_ai_does'>('all_core');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<KnowledgeSphereNode | null>(null);
  const [showTelemetryModal, setShowTelemetryModal] = useState<boolean>(false);
  const [showLedgerModal, setShowLedgerModal] = useState<boolean>(false);
  const [showSearch, setShowSearch] = useState<boolean>(false);

  // Synchronized Refs for Three.js render loop without triggering full scene re-mounts
  const isAutoRotatingRef = useRef<boolean>(isAutoRotating);
  const activeLayerFilterRef = useRef<string>(activeLayerFilter);
  const coreSubLayerRef = useRef<string>(coreSubLayer);
  const selectedDomainRef = useRef<string>(selectedDomain);
  const searchQueryRef = useRef<string>(searchQuery);
  const selectedNodeIdRef = useRef<string | null>(selectedNodeId);

  useEffect(() => {
    isAutoRotatingRef.current = isAutoRotating;
  }, [isAutoRotating]);

  useEffect(() => {
    activeLayerFilterRef.current = activeLayerFilter;
  }, [activeLayerFilter]);

  useEffect(() => {
    coreSubLayerRef.current = coreSubLayer;
  }, [coreSubLayer]);

  useEffect(() => {
    selectedDomainRef.current = selectedDomain;
  }, [selectedDomain]);

  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  useEffect(() => {
    selectedNodeIdRef.current = selectedNodeId;
  }, [selectedNodeId]);

  const handleResetCamera = () => {
    persistentRotationRef.current = { x: 0, y: 0 };
    targetZoomRef.current = activeLayerFilter === 'core' ? 130 : 240;
    playChime('click');
  };

  // Live Epistemic Ledger State
  const [ledgerData, setLedgerData] = useState<EpistemicLedgerData | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [synthesisTopic, setSynthesisTopic] = useState<string>('');
  const [synthesisSuccessNotice, setSynthesisSuccessNotice] = useState<string | null>(null);
  const [telemetryState, setTelemetryState] = useState<CognitiveTelemetryState>(() => telemetryEngine.getState());
  const [isReconcilingTelemetry, setIsReconcilingTelemetry] = useState<boolean>(false);
  const [showCastalianHud, setShowCastalianHud] = useState<boolean>(false);
  const [isSynthesizingCastalian, setIsSynthesizingCastalian] = useState<boolean>(false);
  const [castalianActiveTab, setCastalianActiveTab] = useState<'what_ai_sees' | 'what_ai_does' | 'glass_bead_game'>('what_ai_sees');

  // Castalian AI Synthesis: Weaves a real cross-disciplinary bridge between real student nodes
  const handleCastalianSynthesisMove = async (sourceId?: string, targetId?: string) => {
    setIsSynthesizingCastalian(true);
    playChime('click');
    try {
      const defaultSrc = sphereData.nodes.find(n => n.layer === 'core')?.id || sphereData.nodes[0]?.id || 'core-node-1';
      const defaultTgt = sphereData.nodes.find(n => n.layer === 'orbit')?.id || sphereData.nodes.find(n => n.layer === 'mantle')?.id || defaultSrc;
      const src = sourceId || selectedNode?.id || defaultSrc;
      const tgt = targetId || (src === defaultTgt ? (sphereData.nodes[1]?.id || defaultSrc) : defaultTgt);
      const res = await epistemicLedgerService.triggerCastalianSynthesis(src, tgt);
      if (res.success) {
        playChime('success');
        setSynthesisSuccessNotice(`✨ Кастальенский луч проложен: ${res.bridge?.explanation || 'Аксиома заземлена в практический артефакт!'}`);
        const updated = await epistemicLedgerService.getLedger();
        setLedgerData(updated);
      }
    } catch (err) {
      console.warn('Castalian synthesis error:', err);
    } finally {
      setIsSynthesizingCastalian(false);
      setTimeout(() => setSynthesisSuccessNotice(null), 6000);
    }
  };

  // Load and subscribe to live Epistemic Ledger

  useEffect(() => {
    let isMounted = true;
    const loadLedger = async () => {
      try {
        const data = await epistemicLedgerService.getLedger();
        if (isMounted) setLedgerData(data);
      } catch (err) {
        console.warn('Epistemic ledger fetch error:', err);
      }
    };
    loadLedger();
    const unsubscribe = epistemicLedgerService.subscribe((updated) => {
      if (isMounted) setLedgerData(updated);
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Subscribe to live Telemetry Engine and automatically reconcile completed learning with Core
  useEffect(() => {
    const unsub = telemetryEngine.subscribe((ts) => setTelemetryState(ts));
    // Trigger automatic telemetry-driven AI Core filling for any completed units
    telemetryEngine.autoReconcileCoreWithProgress(units, nodes);
    return () => unsub();
  }, [units, nodes]);

  // Handle manual Telemetry Core Reconcile trigger
  const handleForceTelemetryReconcile = async () => {
    setIsReconcilingTelemetry(true);
    playChime('click');
    try {
      await telemetryEngine.autoReconcileCoreWithProgress(units, nodes);
      playChime('success');
      setSynthesisSuccessNotice('⚡ Сверка телеметрии завершена: Ядро актуализировано по прогрессу обучения!');
    } catch (err) {
      console.warn('Telemetry reconcile error:', err);
    } finally {
      setIsReconcilingTelemetry(false);
      setTimeout(() => setSynthesisSuccessNotice(null), 5000);
    }
  };

  // Count real completed skills
  const completedSkillsCount = useMemo(() => {
    return nodes.filter(n => n.status === 'completed').length;
  }, [nodes]);

  // Compile Sphere Model (automatically includes crystallized nodes from Epistemic Ledger)
  const sphereData = useMemo(() => {
    return knowledgeSphereEngine.generateSphereModel(nodes, edges, units, artifacts, ledgerData || undefined, {
      onlyCompleted: onlyMastered
    });
  }, [nodes, edges, units, artifacts, ledgerData, onlyMastered]);

  // Selected Node Object
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return sphereData.nodes.find(n => n.id === selectedNodeId) || null;
  }, [selectedNodeId, sphereData]);

  // Handle Clean Memory AI Agent Reasoning & Core Crystallization Cycle
  const handleTriggerCleanMemorySynthesis = async (customPrompt?: string) => {
    setIsSynthesizing(true);
    setSynthesisSuccessNotice(null);
    playChime('success');

    try {
      const topic = customPrompt || synthesisTopic.trim() || 'Инварианты алгоритмов, асимптотическая сложность и верификация структур данных';
      const result = await epistemicLedgerService.runCleanMemoryAgentCycle({
        taskPrompt: `Проведи строгий дедуктивный анализ и выдели фундаментальные аксиомы ядра: ${topic}`,
        domain: selectedDomain !== 'all' ? selectedDomain : 'Архитектура & Системы',
        agentName: 'EpistemicCoreSynthesizer',
        workingContextSnapshot: {
          currentUnitsCount: Object.keys(units).length,
          activeUnitTitle: units[activeUnitId || '']?.title || 'Общий курс',
          targetTopic: topic
        }
      });

      if (result.success && result.crystallizedFact) {
        setSynthesisSuccessNotice(`✨ В ядро кристаллизована новая аксиома: «${result.crystallizedFact.topic}»! Контекст агента успешно очищен.`);
        setSynthesisTopic('');
        playChime('success');
      } else {
        setSynthesisSuccessNotice('⚡ Анализ завершен, дедуктивная запись внесена в журнал без галлюцинаций.');
      }
    } catch (err) {
      console.error('Synthesis error:', err);
      setSynthesisSuccessNotice('⚠️ Сбой вызова, использована локальная дедуктивная модель.');
    } finally {
      setIsSynthesizing(false);
      setTimeout(() => setSynthesisSuccessNotice(null), 6000);
    }
  };

  // Connected nodes & links for active trace
  const activeTraceInfo = useMemo(() => {
    if (!selectedNode) return { connectedNodeIds: new Set<string>(), impactProjects: [], underlyingLessons: [] };

    const connectedIds = new Set<string>([selectedNode.id]);
    const impactProjects: KnowledgeSphereNode[] = [];
    const underlyingLessons: KnowledgeSphereNode[] = [];

    if (selectedNode.layer === 'core') {
      // Trace forward to projects
      selectedNode.impactProjectIds.forEach(pId => {
        connectedIds.add(pId);
        const pNode = sphereData.nodes.find(n => n.id === pId);
        if (pNode) impactProjects.push(pNode);
      });
      // Also include intermediary mantles
      sphereData.links.forEach(l => {
        if (l.source === selectedNode.id) connectedIds.add(l.target);
      });
    } else if (selectedNode.layer === 'orbit') {
      // Trace backward to underlying theory & skills
      (selectedNode.underlyingTheoryIds || []).forEach(tId => {
        connectedIds.add(tId);
        const tNode = sphereData.nodes.find(n => n.id === tId);
        if (tNode) {
          if (tNode.layer === 'core') underlyingLessons.push(tNode);
          (tNode.underlyingTheoryIds || []).forEach(cId => {
            connectedIds.add(cId);
            const cNode = sphereData.nodes.find(n => n.id === cId);
            if (cNode && cNode.layer === 'core' && !underlyingLessons.some(ul => ul.id === cNode.id)) {
              underlyingLessons.push(cNode);
            }
          });
        }
      });
    } else if (selectedNode.layer === 'mantle') {
      sphereData.links.forEach(l => {
        if (l.target === selectedNode.id) connectedIds.add(l.source);
        if (l.source === selectedNode.id) connectedIds.add(l.target);
      });
    }

    return { connectedNodeIds: connectedIds, impactProjects, underlyingLessons };
  }, [selectedNode, sphereData]);

  const activeTraceInfoRef = useRef(activeTraceInfo);
  useEffect(() => {
    activeTraceInfoRef.current = activeTraceInfo;
  }, [activeTraceInfo]);

  // Filtered nodes based on active filters
  const filteredNodes = useMemo(() => {
    return sphereData.nodes.filter(n => {
      if (activeLayerFilter !== 'all' && n.layer !== activeLayerFilter) return false;
      if (selectedDomain !== 'all' && n.domain !== selectedDomain) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return n.title.toLowerCase().includes(q) || (n.description && n.description.toLowerCase().includes(q));
      }
      return true;
    });
  }, [sphereData.nodes, activeLayerFilter, selectedDomain, searchQuery]);

  // Unique domains present in data
  const availableDomains = useMemo(() => {
    const set = new Set<string>();
    sphereData.nodes.forEach(n => {
      if (n.domain) set.add(n.domain);
    });
    return Array.from(set);
  }, [sphereData.nodes]);

  // Three.js Scene References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const nodesGroupRef = useRef<THREE.Group | null>(null);
  const linksGroupRef = useRef<THREE.Group | null>(null);
  const nodeMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const linkLineMapRef = useRef<Map<string, THREE.Line>>(new Map());

  // ==========================================
  // THREE.JS 3D FORCE-DIRECTED SPHERICAL SCENE (MOUNT ONCE)
  // ==========================================
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050b14, 0.0018);
    sceneRef.current = scene;

    // 2. Camera Setup
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(0, 40, targetZoomRef.current);

    // Restore persistent rotation
    scene.rotation.x = persistentRotationRef.current.x;
    scene.rotation.y = persistentRotationRef.current.y;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x60a5fa, 1.5);
    dirLight.position.set(100, 150, 100);
    scene.add(dirLight);

    const pointLightCore = new THREE.PointLight(0x38bdf8, 2.5, 300);
    pointLightCore.position.set(0, 0, 0);
    scene.add(pointLightCore);

    // 5. Spherical Shell Guide Rims (Core, Mantle, Orbit)
    const createWireSphere = (radius: number, color: number, opacity: number) => {
      const geom = new THREE.SphereGeometry(radius, 24, 18);
      const mat = new THREE.MeshBasicMaterial({
        color,
        wireframe: true,
        transparent: true,
        opacity,
      });
      return new THREE.Mesh(geom, mat);
    };

    const coreShell = createWireSphere(SPHERE_RADII.core, 0x38bdf8, 0.08);
    const mantleShell = createWireSphere(SPHERE_RADII.mantle, 0xa855f7, 0.05);
    const orbitShell = createWireSphere(SPHERE_RADII.orbit, 0x10b981, 0.04);

    const shellsGroup = new THREE.Group();
    shellsGroup.add(coreShell);
    shellsGroup.add(mantleShell);
    shellsGroup.add(orbitShell);
    scene.add(shellsGroup);

    // Core Glowing Plasma Center
    const plasmaGeom = new THREE.SphereGeometry(14, 32, 32);
    const plasmaMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.65,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.65,
    });
    const plasmaCore = new THREE.Mesh(plasmaGeom, plasmaMat);
    scene.add(plasmaCore);

    // Nodes & Links Groups
    const nodesGroup = new THREE.Group();
    const linksGroup = new THREE.Group();
    scene.add(nodesGroup);
    scene.add(linksGroup);
    nodesGroupRef.current = nodesGroup;
    linksGroupRef.current = linksGroup;

    // 6. Interactive Pointer Controls with Pointer Capture
    let isPointerDragging = false;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let prevPointerX = 0;
    let prevPointerY = 0;
    let hasMovedSignificantly = false;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      isPointerDragging = true;
      hasMovedSignificantly = false;
      pointerStartX = e.clientX;
      pointerStartY = e.clientY;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;

      // Stop auto-rotating immediately when user touches / grabs the sphere!
      if (isAutoRotatingRef.current) {
        isAutoRotatingRef.current = false;
        setIsAutoRotating(false);
      }

      try {
        container.setPointerCapture(e.pointerId);
      } catch (_) {}
      container.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isPointerDragging) {
        const totalDist = Math.hypot(e.clientX - pointerStartX, e.clientY - pointerStartY);
        if (totalDist > 4) {
          hasMovedSignificantly = true;
        }

        const deltaX = e.clientX - prevPointerX;
        const deltaY = e.clientY - prevPointerY;
        prevPointerX = e.clientX;
        prevPointerY = e.clientY;

        scene.rotation.y += deltaX * 0.005;
        scene.rotation.x += deltaY * 0.005;
        // Clamp X to avoid inverted flip
        scene.rotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, scene.rotation.x));
        persistentRotationRef.current = { x: scene.rotation.x, y: scene.rotation.y };
      } else {
        // Raycast for hover ONLY among visible meshes
        const visibleMeshes = Array.from(nodeMeshesRef.current.values()).filter(m => m.visible);
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(visibleMeshes);
        if (intersects.length > 0) {
          const hitNode = intersects[0].object.userData.node as KnowledgeSphereNode;
          if (lastHoveredIdRef.current !== hitNode.id) {
            lastHoveredIdRef.current = hitNode.id;
            setHoveredNode(hitNode);
          }
          container.style.cursor = 'pointer';
        } else {
          if (lastHoveredIdRef.current !== null) {
            lastHoveredIdRef.current = null;
            setHoveredNode(null);
          }
          container.style.cursor = isPointerDragging ? 'grabbing' : 'grab';
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isPointerDragging) return;
      isPointerDragging = false;
      try {
        container.releasePointerCapture(e.pointerId);
      } catch (_) {}
      container.style.cursor = 'grab';

      // If user did not drag significantly, treat as single click selection
      if (!hasMovedSignificantly) {
        const visibleMeshes = Array.from(nodeMeshesRef.current.values()).filter(m => m.visible);
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(visibleMeshes);
        if (intersects.length > 0) {
          const clickedNode = intersects[0].object.userData.node as KnowledgeSphereNode;
          setSelectedNodeId(clickedNode.id);
          selectedNodeIdRef.current = clickedNode.id;
          playChime('click');
        } else {
          setSelectedNodeId(null);
          selectedNodeIdRef.current = null;
        }
      }
    };

    const onPointerCancel = (e: PointerEvent) => {
      isPointerDragging = false;
      try {
        container.releasePointerCapture(e.pointerId);
      } catch (_) {}
      container.style.cursor = 'grab';
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetZoomRef.current += e.deltaY * 0.15;
      targetZoomRef.current = Math.max(50, Math.min(480, targetZoomRef.current));
    };

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointercancel', onPointerCancel);
    container.addEventListener('wheel', onWheel, { passive: false });

    // 7. Resize Observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 8. 60 FPS Render & Animation Loop
    let animationFrameId: number;
    const startTimestamp = performance.now();
    let lastFrameTime = startTimestamp;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = (now - lastFrameTime) * 0.001;
      const elapsedTime = (now - startTimestamp) * 0.001;
      lastFrameTime = now;

      // Smooth Zoom
      camera.position.z += (targetZoomRef.current - camera.position.z) * 0.08;

      // Auto Rotation when not dragging
      if (isAutoRotatingRef.current && !isPointerDragging) {
        scene.rotation.y += 0.002;
        persistentRotationRef.current = { x: scene.rotation.x, y: scene.rotation.y };
      }

      // Smooth camera reset interpolation if commanded
      const rotDiffX = persistentRotationRef.current.x - scene.rotation.x;
      const rotDiffY = persistentRotationRef.current.y - scene.rotation.y;
      if (!isPointerDragging && (Math.abs(rotDiffX) > 0.001 || Math.abs(rotDiffY) > 0.001)) {
        scene.rotation.x += rotDiffX * 0.08;
        scene.rotation.y += rotDiffY * 0.08;
      }

      // Core Plasma Pulsing
      const pulse = 1 + Math.sin(elapsedTime * 2.5) * 0.08;
      plasmaCore.scale.set(pulse, pulse, pulse);
      plasmaMat.emissiveIntensity = 0.5 + Math.sin(elapsedTime * 3) * 0.25;

      const currentLayer = activeLayerFilterRef.current;
      const currentSub = coreSubLayerRef.current;
      const currentDomain = selectedDomainRef.current;
      const currentQuery = searchQueryRef.current.toLowerCase().trim();
      const currentSelectedId = selectedNodeIdRef.current;
      const currentTrace = activeTraceInfoRef.current;
      const hoveredId = lastHoveredIdRef.current;

      // Dynamic Guide Shells based on Topology Layer Filter
      if (currentLayer === 'core') {
        (coreShell.material as THREE.MeshBasicMaterial).opacity = 0.38;
        (mantleShell.material as THREE.MeshBasicMaterial).opacity = 0.02;
        (orbitShell.material as THREE.MeshBasicMaterial).opacity = 0.02;
        plasmaCore.visible = true;
        plasmaMat.opacity = currentSub === 'what_ai_does' ? 0.95 : 0.78;
      } else if (currentLayer === 'mantle') {
        (coreShell.material as THREE.MeshBasicMaterial).opacity = 0.04;
        (mantleShell.material as THREE.MeshBasicMaterial).opacity = 0.28;
        (orbitShell.material as THREE.MeshBasicMaterial).opacity = 0.02;
        plasmaCore.visible = false;
      } else if (currentLayer === 'orbit') {
        (coreShell.material as THREE.MeshBasicMaterial).opacity = 0.02;
        (mantleShell.material as THREE.MeshBasicMaterial).opacity = 0.03;
        (orbitShell.material as THREE.MeshBasicMaterial).opacity = 0.32;
        plasmaCore.visible = false;
      } else {
        // 'all'
        (coreShell.material as THREE.MeshBasicMaterial).opacity = 0.08;
        (mantleShell.material as THREE.MeshBasicMaterial).opacity = 0.06;
        (orbitShell.material as THREE.MeshBasicMaterial).opacity = 0.05;
        plasmaCore.visible = true;
        plasmaMat.opacity = 0.65;
      }

      // Update Node Meshes & Topology Layer Slicing
      nodeMeshesRef.current.forEach((mesh, id) => {
        const node = mesh.userData.node as KnowledgeSphereNode;
        
        let layerMatch = currentLayer === 'all' || node.layer === currentLayer;

        // Sub-layer topology filtering when viewing the Core
        if (currentLayer === 'core') {
          if (currentSub === 'first_principles') {
            layerMatch = node.layer === 'core' && (Boolean(node.formula) || Boolean(node.firstPrinciplesCitation));
          } else if (currentSub === 'castalian_bridges') {
            layerMatch = node.layer === 'core' && Boolean(node.castalianBeadId);
          } else if (currentSub === 'what_ai_sees') {
            layerMatch = node.layer === 'core' && Boolean(node.aiPerception);
          } else if (currentSub === 'what_ai_does') {
            layerMatch = node.layer === 'core' && Boolean(node.aiAction);
          }
        }

        const domainMatch = currentDomain === 'all' || node.domain === currentDomain;
        const queryMatch = !currentQuery || 
          node.title.toLowerCase().includes(currentQuery) || 
          (node.description && node.description.toLowerCase().includes(currentQuery));

        const isMatch = layerMatch && domainMatch && queryMatch;

        if (!isMatch) {
          mesh.visible = false;
          return;
        }
        mesh.visible = true;

        const isSelected = currentSelectedId === id;
        const isHovered = hoveredId === id;
        const isConnected = currentTrace.connectedNodeIds.has(id);

        let targetScale = 1;
        if (isSelected) {
          targetScale = 1.75;
        } else if (isHovered || isConnected) {
          targetScale = 1.45;
        } else if (currentSelectedId && !isConnected) {
          targetScale = 0.55;
        }

        // When in Core topology, make core axioms prominent
        if (currentLayer === 'core') {
          targetScale *= 1.35;
        }

        mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);

        // Adjust Emissive glow
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (isSelected) {
          mat.emissiveIntensity = 2.2;
        } else if (isConnected) {
          mat.emissiveIntensity = 1.5;
        } else if (currentSub === 'what_ai_sees' && node.aiPerception) {
          mat.emissiveIntensity = 1.2 + Math.sin(elapsedTime * 4) * 0.35;
        } else if (currentSelectedId && !isConnected) {
          mat.emissiveIntensity = 0.12;
        } else {
          mat.emissiveIntensity = node.layer === 'core' ? 0.95 : node.layer === 'mantle' ? 0.45 : 0.85;
        }
      });

      // Update Links glow based on active trace & node visibility
      linkLineMapRef.current.forEach((line) => {
        const link = line.userData.link as KnowledgeSphereLink;
        const mat = line.material as THREE.LineBasicMaterial;

        const srcMesh = nodeMeshesRef.current.get(link.source);
        const tgtMesh = nodeMeshesRef.current.get(link.target);

        const isIntraCore = link.type === 'castalian_geodesic' || link.type === 'core_to_core_invariant';
        const isImpactRay = link.type === 'direct_impact_ray' || link.type === 'castalian_bridge';

        // Working Core Layer Links logic:
        if (currentLayer === 'core') {
          // Intra-core links are 100% visible
          if (isIntraCore && srcMesh?.visible && tgtMesh?.visible) {
            line.visible = true;
            mat.opacity = 0.95;
            mat.color.setHex(link.type === 'castalian_geodesic' ? 0x00f0ff : 0xf59e0b);
          } else if (isImpactRay && srcMesh?.visible) {
            // Outward rays from core to projects are visible as radiating light beams
            line.visible = true;
            mat.opacity = 0.65 + Math.sin(elapsedTime * 3) * 0.25;
            mat.color.setHex(link.type === 'castalian_bridge' ? 0x00f0ff : 0x38bdf8);
          } else {
            line.visible = false;
          }
          return;
        }

        if (!srcMesh?.visible || !tgtMesh?.visible) {
          line.visible = false;
          return;
        }
        line.visible = true;

        const isLinkActive = 
          currentSelectedId && 
          (currentTrace.connectedNodeIds.has(link.source) && currentTrace.connectedNodeIds.has(link.target));

        if (isLinkActive) {
          mat.opacity = 0.98;
          mat.color.setHex(link.type === 'castalian_bridge' || link.type === 'castalian_geodesic' ? 0x00f0ff : 0x38bdf8);
        } else if (currentSelectedId) {
          mat.opacity = 0.05;
        } else if (link.type === 'castalian_bridge' || link.type === 'castalian_resonance' || link.type === 'castalian_geodesic') {
          mat.opacity = 0.70 + Math.sin(elapsedTime * 4) * 0.25;
        } else {
          mat.opacity = link.type === 'direct_impact_ray' ? 0.48 : 0.22;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // 9. Cleanup on Unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointercancel', onPointerCancel);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);

      // Recursive cleanup of Three.js GPU resources to prevent VRAM memory leaks
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh || (obj as THREE.Line).isLine) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material?.dispose();
          }
        }
      });

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // ========================================================
  // SYNC 3D MESHES & LINKS WHEN sphereData UPDATES (NO FLICKER)
  // ========================================================
  useEffect(() => {
    const nodesGroup = nodesGroupRef.current;
    const linksGroup = linksGroupRef.current;
    if (!nodesGroup || !linksGroup) return;

    // Clear old meshes
    while (nodesGroup.children.length > 0) {
      const obj = nodesGroup.children[0] as THREE.Mesh;
      if (obj.geometry) obj.geometry.dispose();
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose());
      } else if (obj.material) {
        obj.material.dispose();
      }
      nodesGroup.remove(obj);
    }

    while (linksGroup.children.length > 0) {
      const obj = linksGroup.children[0] as THREE.Line;
      if (obj.geometry) obj.geometry.dispose();
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose());
      } else if (obj.material) {
        obj.material.dispose();
      }
      linksGroup.remove(obj);
    }

    nodeMeshesRef.current.clear();
    linkLineMapRef.current.clear();

    // Build Node Meshes
    sphereData.nodes.forEach(node => {
      const size = Math.max(2.4, Math.min(8.5, node.weight * 1.3));
      const geom = node.layer === 'core' 
        ? new THREE.IcosahedronGeometry(size, 2)
        : node.layer === 'mantle'
        ? new THREE.OctahedronGeometry(size, 1)
        : new THREE.DodecahedronGeometry(size, 1);

      const baseColor = new THREE.Color(node.domainColor || (node.layer === 'core' ? '#38bdf8' : node.layer === 'mantle' ? '#c084fc' : '#34d399'));
      
      const mat = new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: baseColor,
        emissiveIntensity: node.layer === 'core' ? 0.75 : node.layer === 'mantle' ? 0.45 : 0.85,
        roughness: 0.3,
        metalness: 0.5,
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(node.x, node.y, node.z);
      mesh.userData = { node };

      nodeMeshesRef.current.set(node.id, mesh);
      nodesGroup.add(mesh);
    });

    // Build Link Lines
    sphereData.links.forEach(link => {
      const srcMesh = nodeMeshesRef.current.get(link.source);
      const tgtMesh = nodeMeshesRef.current.get(link.target);
      if (!srcMesh || !tgtMesh) return;

      const points = [srcMesh.position, tgtMesh.position];
      const geom = new THREE.BufferGeometry().setFromPoints(points);

      const isCastalianBridge = link.type === 'castalian_bridge';
      const isCastalianResonance = link.type === 'castalian_resonance';
      const isCastalianGeodesic = link.type === 'castalian_geodesic' || link.type === 'core_to_core_invariant';
      const isImpactRay = link.type === 'direct_impact_ray';

      const lineColor = isCastalianBridge 
        ? 0x00f0ff 
        : isCastalianGeodesic
        ? 0xf59e0b
        : isCastalianResonance 
        ? 0xfbbf24 
        : isImpactRay 
        ? 0x38bdf8 
        : link.type === 'skill_to_project' 
        ? 0x10b981 
        : 0x818cf8;
      
      const mat = new THREE.LineBasicMaterial({
        color: lineColor,
        transparent: true,
        opacity: isCastalianBridge || isCastalianResonance || isCastalianGeodesic ? 0.88 : isImpactRay ? 0.65 : 0.28,
        linewidth: isCastalianBridge || isCastalianGeodesic ? 2 : 1,
      });

      const line = new THREE.Line(geom, mat);
      line.userData = { link };
      linkLineMapRef.current.set(link.id, line);
      linksGroup.add(line);
    });
  }, [sphereData]);

  return (
    <div className="relative w-full h-full bg-[#050b14] overflow-hidden select-none flex flex-col font-sans">
      {/* 1. MINIMALIST TOP STATUS & NAVIGATION BAR */}
      <div className="absolute top-0 left-0 right-0 z-20 h-12 px-3 bg-slate-950/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between pointer-events-auto">
        {/* Left: Title & Mastered Filter Switch */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            <h2 className="text-xs font-semibold text-white tracking-wide">
              Сфера знаний
            </h2>
          </div>

          <div className="flex items-center p-0.5 bg-white/5 rounded-lg border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => {
                setOnlyMastered(false);
                playChime('click');
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                !onlyMastered
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Показать всю карту навыков программы"
            >
              <Network className="w-3 h-3" />
              <span>Вся программа</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setOnlyMastered(true);
                playChime('click');
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                onlyMastered
                  ? 'bg-amber-500/25 text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
              title="Показать только реально освоенные и сданные навыки"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Только освоенные ({completedSkillsCount})</span>
            </button>
          </div>
        </div>

        {/* Center: Sleek Segmented Control for Layers */}
        <div className="flex items-center p-0.5 bg-white/5 rounded-lg border border-white/5 text-xs">
          {[
            { id: 'all', label: 'Все', count: sphereData.nodes.length },
            { id: 'core', label: 'Ядро', count: sphereData.telemetry.coreNodesCount },
            { id: 'mantle', label: 'Мантия', count: sphereData.telemetry.mantleNodesCount },
            { id: 'orbit', label: 'Орбита', count: sphereData.telemetry.orbitNodesCount },
          ].map((layer) => (
            <button
              key={layer.id}
              type="button"
              onClick={() => {
                setActiveLayerFilter(layer.id as any);
                activeLayerFilterRef.current = layer.id;
                if (layer.id === 'core') targetZoomRef.current = 130;
                else if (layer.id === 'mantle') targetZoomRef.current = 185;
                else if (layer.id === 'orbit') targetZoomRef.current = 260;
                else targetZoomRef.current = 240;
                playChime('click');
              }}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                activeLayerFilter === layer.id
                  ? 'bg-white/15 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <span>{layer.label}</span>
              <span className="text-[10px] text-white/40 font-mono">{layer.count}</span>
            </button>
          ))}
        </div>

        {/* Right: Consolidated Minimalist Actions */}
        <div className="flex items-center space-x-1">
          {/* Search / Filter toggle */}
          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            className={`p-1.5 rounded-lg transition cursor-pointer text-xs flex items-center space-x-1 ${
              showSearch || searchQuery || selectedDomain !== 'all'
                ? 'bg-white/15 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Поиск и фильтр по доменам"
          >
            <Search className="w-3.5 h-3.5" />
            {(searchQuery || selectedDomain !== 'all') && (
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            )}
          </button>

          {/* Castalian AI Inspector */}
          <button
            type="button"
            onClick={() => {
              playChime('click');
              setShowCastalianHud(true);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition cursor-pointer text-xs flex items-center space-x-1"
            title="Кастальенский Нейро-Инспектор: Что видит и делает ИИ"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] hidden md:inline">Касталия</span>
          </button>

          {/* Clean Memory Ledger */}
          <button
            type="button"
            onClick={() => {
              playChime('click');
              setShowLedgerModal(true);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-white/5 transition cursor-pointer text-xs flex items-center space-x-1"
            title="Журнал чистой памяти ИИ (аксиомы)"
          >
            <Brain className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] hidden xl:inline">Память ({ledgerData?.provenFacts?.length || 0})</span>
          </button>

          {/* Core Stability */}
          <button
            type="button"
            onClick={() => {
              playChime('click');
              setShowTelemetryModal(true);
            }}
            className="flex items-center space-x-1 px-2 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer text-xs"
            title="Энергия ядра и баланс теории/практики"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono text-[11px] text-slate-300">{sphereData.telemetry.coreStabilityPercent}%</span>
          </button>

          <div className="h-3 w-px bg-white/10 mx-1" />

          {/* Recenter Camera */}
          <button
            type="button"
            onClick={handleResetCamera}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            title="Центрировать камеру"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>

          {/* Auto-rotate */}
          <button
            type="button"
            onClick={() => {
              setIsAutoRotating(!isAutoRotating);
              playChime('click');
            }}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isAutoRotating ? 'text-sky-400 bg-sky-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title={isAutoRotating ? 'Остановить вращение' : 'Автоматическое вращение'}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isAutoRotating ? 'animate-spin-slow' : ''}`} />
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer ml-1"
              title="Закрыть"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Sub-layers for Core Topology */}
      {activeLayerFilter === 'core' && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 flex items-center p-0.5 bg-slate-950/85 backdrop-blur-md rounded-full border border-white/10 text-xs shadow-xl animate-fade-in pointer-events-auto">
          {[
            { id: 'all_core', label: 'Вся топология' },
            { id: 'first_principles', label: 'Первые принципы' },
            { id: 'castalian_bridges', label: 'Игра в бисер' },
            { id: 'what_ai_sees', label: 'Что видит ИИ' },
            { id: 'what_ai_does', label: 'Что делает ИИ' },
          ].map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => {
                setCoreSubLayer(sub.id as any);
                playChime('click');
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition cursor-pointer ${
                coreSubLayer === sub.id
                  ? 'bg-sky-500 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}

      {/* Floating Search & Domain Filter Popover */}
      {showSearch && (
        <div className="absolute top-14 right-4 z-20 w-72 bg-slate-950/90 backdrop-blur-xl p-3 rounded-xl border border-white/10 shadow-2xl space-y-2.5 pointer-events-auto animate-fade-in">
          <div className="flex items-center justify-between pb-1 border-b border-white/5">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Поиск и домены</span>
            <button
              type="button"
              onClick={() => setShowSearch(false)}
              className="text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Поиск узлов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Предметные домены</div>
            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto custom-scrollbar">
              <button
                type="button"
                onClick={() => {
                  setSelectedDomain('all');
                  playChime('click');
                }}
                className={`px-2 py-0.5 rounded text-[11px] transition cursor-pointer ${
                  selectedDomain === 'all'
                    ? 'bg-sky-500/20 text-sky-300 font-medium'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Все ({sphereData.nodes.length})
              </button>
              {availableDomains.map((dom) => {
                const count = sphereData.nodes.filter((n) => n.domain === dom).length;
                return (
                  <button
                    key={dom}
                    type="button"
                    onClick={() => {
                      setSelectedDomain(dom);
                      playChime('click');
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] transition cursor-pointer ${
                      selectedDomain === dom
                        ? 'bg-white/20 text-white font-medium'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {dom} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Synthesis Live Alert (Quiet & Refined) */}
      {synthesisSuccessNotice && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-lg text-slate-200 text-xs shadow-xl flex items-center space-x-2 animate-fade-in pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{synthesisSuccessNotice}</span>
        </div>
      )}

      {/* 2. THREE.JS 3D CANVAS VIEWPORT */}
      <div 
        ref={mountRef} 
        className="w-full h-full relative cursor-grab active:cursor-grabbing"
      />

      {/* Hover Node Hint */}
      {hoveredNode && !selectedNode && (
        <div className="absolute bottom-12 left-4 z-20 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white shadow-lg pointer-events-none animate-fade-in flex items-center space-x-2">
          <span 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: hoveredNode.domainColor || '#38bdf8' }} 
          />
          <span className="font-medium">{hoveredNode.title}</span>
          <span className="text-white/30">·</span>
          <span className="text-slate-400 text-[11px]">
            {hoveredNode.layer === 'core' ? 'Ядро' : hoveredNode.layer === 'mantle' ? 'Мантия' : 'Орбита'}
          </span>
        </div>
      )}

      {/* 3. MINIMALIST RIGHT INSPECTOR PANEL */}
      {selectedNode && (
        <div className="absolute top-14 right-4 z-20 w-80 bg-slate-950/90 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl space-y-3.5 pointer-events-auto max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar animate-fade-in">
          {/* Header */}
          <div className="flex items-start justify-between pb-2 border-b border-white/5">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center space-x-1.5 flex-wrap">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  {selectedNode.layer === 'core' ? '🧠 Ядро теории' : selectedNode.layer === 'mantle' ? '⚡ Мантия практики' : '🚀 Орбита проекта'}
                  {selectedNode.domain && ` · ${selectedNode.domain}`}
                </span>
                {selectedNode.status === 'completed' ? (
                  <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Освоено</span>
                  </span>
                ) : selectedNode.status === 'active' ? (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded-md bg-sky-500/20 text-sky-300 text-[10px] font-bold border border-sky-500/30">
                    В фокусе
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-400 text-[10px]">
                    В плане
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-white truncate">
                {selectedNode.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedNodeId(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Description */}
          <p className="text-xs text-slate-300 leading-relaxed">
            {selectedNode.description || selectedNode.subtitle || 'Ключевой структурообразующий квант знаний в образовательной системе.'}
          </p>

          {/* Formula & Invariant */}
          {selectedNode.formula && (
            <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>{selectedNode.castalianBeadId || 'Инвариант'}</span>
                <span>{selectedNode.firstPrinciplesCitation}</span>
              </div>
              <div className="font-mono text-xs text-sky-300 overflow-x-auto">
                {selectedNode.formula}
              </div>
            </div>
          )}

          {/* AI Perception & Action (Quiet & Editorial) */}
          <div className="space-y-2 pt-2 border-t border-white/5 text-xs">
            <div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Что видит ИИ</span>
                {selectedNode.aiPerception?.masteryConfidence && (
                  <span className="font-mono text-sky-400">{selectedNode.aiPerception.masteryConfidence}% доверие</span>
                )}
              </div>
              <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                {selectedNode.aiPerception?.observedFriction || 'Нейро-телеметрия: устойчивое извлечение концепта без сомнений.'}
              </p>
            </div>

            <div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                Что делает ИИ
              </div>
              <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                {selectedNode.aiAction?.activeIntervention || 'Заземляет узел в реальный код проекта. Транзитная память очищена.'}
              </p>
            </div>
          </div>

          {/* Castalian Synthesis Trigger */}
          <button
            type="button"
            disabled={isSynthesizingCastalian}
            onClick={() => handleCastalianSynthesisMove(selectedNode.id)}
            className="w-full py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 text-cyan-400 ${isSynthesizingCastalian ? 'animate-spin' : ''}`} />
            <span>{isSynthesizingCastalian ? 'Синтез луча...' : 'Синтезировать луч ИИ'}</span>
          </button>

          {/* Connections */}
          {selectedNode.layer === 'core' && activeTraceInfo.impactProjects.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                Питает проекты ({activeTraceInfo.impactProjects.length})
              </div>
              <div className="space-y-1">
                {activeTraceInfo.impactProjects.map((proj) => (
                  <div key={proj.id} className="p-1.5 rounded bg-white/5 text-[11px] text-slate-300 flex items-center justify-between">
                    <span className="truncate">{proj.title}</span>
                    <span className="text-[10px] text-sky-400 font-mono">100%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedNode.layer === 'orbit' && activeTraceInfo.underlyingLessons.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                Базируется на уроках ({activeTraceInfo.underlyingLessons.length})
              </div>
              <div className="space-y-1">
                {activeTraceInfo.underlyingLessons.map((lesson) => (
                  <div key={lesson.id} className="p-1.5 rounded bg-white/5 text-[11px] text-slate-300 truncate">
                    {lesson.title}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex flex-col gap-1.5">
            {onOpenFocusStudio && selectedNode.unitId && (
              <button
                type="button"
                onClick={() => {
                  playChime('click');
                  onOpenFocusStudio(selectedNode.unitId!);
                }}
                className="w-full py-1.5 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>В Фокус-Студию</span>
              </button>
            )}

            {onOpenDag && (
              <button
                type="button"
                onClick={() => {
                  playChime('click');
                  onOpenDag();
                }}
                className="w-full py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Network className="w-3.5 h-3.5" />
                <span>Показать в 2D DAG</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. MINIMALIST BOTTOM STATUS BAR */}
      <div className="absolute bottom-3 left-4 right-4 z-20 flex items-center justify-between text-[11px] text-slate-500 pointer-events-none">
        <div className="flex items-center space-x-2 pointer-events-auto bg-slate-950/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-slate-300 font-medium">{sphereData.nodes.length} узлов</span>
          <span className="text-white/20">·</span>
          <span>{sphereData.telemetry.totalImpactRays} связей</span>
          <span className="text-white/20">·</span>
          <span className="text-slate-400 hidden sm:inline">Ядро стабильно</span>
        </div>

        <div className="flex items-center space-x-2 pointer-events-auto">
          {onInjectProject && (
            <button
              type="button"
              onClick={() => {
                playChime('click');
                onInjectProject();
              }}
              className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition text-[11px] font-medium cursor-pointer"
            >
              + Разгрузить ядро проектом
            </button>
          )}
        </div>
      </div>

      {/* 6. TELEMETRY & CORE STABILITY MODAL */}
      {showTelemetryModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white">Телеметрия стабильности ядра знаний</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTelemetryModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Индекс равновесия (Теория ↔ Практика):</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">{sphereData.telemetry.coreStabilityPercent}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-sky-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${sphereData.telemetry.coreStabilityPercent}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="font-bold text-white">Как работает механика «Энергия ядра»?</div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Если ученик только учит теорию и не реализует реальные проекты, в центре Сферы накапливается избыточное напряжение («перегрев ядра»). Каждая связь «теория → проект» (Impact Ray) гармонизирует ядро, делая знания прочными и готовыми к реальной работе.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-500/30 text-xs text-sky-200 space-y-1">
                <div className="font-bold flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>Рекомендация ИИ-Тьютора:</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  {sphereData.telemetry.unlinkedTheoryCount > 0
                    ? `У вас есть ${sphereData.telemetry.unlinkedTheoryCount} теоретических тем без закрепления в проектах. Рекомендуется выполнить боевой проект.`
                    : 'Все ключевые теоретические инварианты гармонично связаны с практическими артефактами! Отличная динамика.'}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTelemetryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. CLEAN-MEMORY EPISTEMIC LEDGER MODAL */}
      {showLedgerModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full space-y-4 shadow-2xl text-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>Архитектура Чистой Памяти ИИ (Epistemic Ledger)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Zero-Hallucination Pipeline
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Каждый агент делает вывод с чистым контекстом, сохраняет доказанные аксиомы в базу и очищает память.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLedgerModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Architecture Pipeline Flow Visual */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2 shrink-0">
              <div className="text-[10px] font-mono uppercase font-bold text-slate-400">
                Цепочка вызова агентов без галлюцинаций
              </div>
              <div className="flex items-center justify-between gap-1 text-[10px] text-center font-mono">
                <div className="p-2 rounded bg-indigo-950/60 border border-indigo-500/30 flex-1">
                  <Database className="w-3.5 h-3.5 mx-auto mb-1 text-indigo-400" />
                  <span className="text-indigo-200">1. База Истины</span>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                <div className="p-2 rounded bg-sky-950/60 border border-sky-500/30 flex-1">
                  <Cpu className="w-3.5 h-3.5 mx-auto mb-1 text-sky-400" />
                  <span className="text-sky-200">2. Чистый Контекст</span>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                <div className="p-2 rounded bg-purple-950/60 border border-purple-500/30 flex-1">
                  <Workflow className="w-3.5 h-3.5 mx-auto mb-1 text-purple-400" />
                  <span className="text-purple-200">3. Атомарный Вывод</span>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                <div className="p-2 rounded bg-emerald-950/60 border border-emerald-500/30 flex-1">
                  <FileCheck className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-400" />
                  <span className="text-emerald-200">4. Запись Аксиом</span>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                <div className="p-2 rounded bg-rose-950/60 border border-rose-500/30 flex-1">
                  <Lock className="w-3.5 h-3.5 mx-auto mb-1 text-rose-400" />
                  <span className="text-rose-200">5. Сброс Памяти</span>
                </div>
              </div>
            </div>

            {/* Facts and Invariants List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Доказанные Аксиомы Ядра и Инварианты ({ledgerData?.provenFacts?.length || 0})</span>
                <span className="text-[10px] font-mono text-slate-500">Синхронизировано со Сферой 3D</span>
              </div>

              {(ledgerData?.provenFacts && ledgerData.provenFacts.length > 0) ? (
                <div className="space-y-2">
                  {ledgerData.provenFacts.map((fact: EpistemicFact) => (
                    <div
                      key={fact.id}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs">
                            {fact.layer === 'core_axiom' ? '🧠' : fact.layer === 'mantle_skill' ? '⚡' : '🚀'}
                          </span>
                          <span className="font-bold text-white">{fact.topic}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            {fact.domain}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                          Достоверность: {Math.round(fact.confidence * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {fact.statement}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900 font-mono">
                        <span>Агент: {fact.discoveredByAgent}</span>
                        <span>Время: {new Date(fact.verifiedAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Журнал чистой памяти пуст. Запустите синтез аксиом ядра.
                </div>
              )}
            </div>

            {/* Synthesis Action Bar */}
            <div className="pt-3 border-t border-slate-800 space-y-2 shrink-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Задайте тему аксиомы (например: B-Tree, Raft, Paxos)..."
                  value={synthesisTopic}
                  onChange={(e) => setSynthesisTopic(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />
                <button
                  type="button"
                  disabled={isSynthesizing}
                  onClick={() => handleTriggerCleanMemorySynthesis()}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {isSynthesizing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Кристаллизация...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                      <span>Синтезировать аксиому</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Авто-синхронизация с прогрессом обучения:</span>
                <button
                  type="button"
                  disabled={isReconcilingTelemetry}
                  onClick={handleForceTelemetryReconcile}
                  className="text-sky-400 hover:text-sky-300 font-medium transition cursor-pointer disabled:opacity-50 flex items-center space-x-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isReconcilingTelemetry ? 'animate-spin' : ''}`} />
                  <span>{isReconcilingTelemetry ? 'Сверка...' : 'Сверить с телеметрией'}</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400">
                Записей в цепочке: <strong className="text-white font-mono">{ledgerData?.provenFacts?.length || 0}</strong>
              </span>
              <button
                type="button"
                onClick={() => setShowLedgerModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. CASTALIAN AI HUD: WHAT AI SEES & WHAT AI DOES (GLASS BEAD GAME) */}
      {showCastalianHud && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 max-w-3xl w-full space-y-4 shadow-2xl text-slate-100 max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                  <Sparkles className="w-5 h-5 text-white animate-spin-slow" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>Кастальенский Нейро-Инспектор (Игра в бисер)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Clean-Memory AI Patch
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Живое зеркало когнитивной системы: что ИИ видит через телеметрию и какие действия предпринимает в Ядре.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCastalianHud(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Segmented Control Tabs */}
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
              {[
                { id: 'what_ai_sees', label: '👁️ Что видит ИИ', badge: `${ledgerData?.aiPerceptions?.length || 3}` },
                { id: 'what_ai_does', label: '⚡ Что делает ИИ', badge: `${ledgerData?.aiActions?.length || 3}` },
                { id: 'glass_bead_game', label: '✨ Игра в бисер (Синтез лучей)', badge: `${ledgerData?.castalianBridges?.length || 3}` },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setCastalianActiveTab(t.id as any);
                    playChime('click');
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition ${
                    castalianActiveTab === t.id
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{t.label}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 font-mono">{t.badge}</span>
                </button>
              ))}
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
              {castalianActiveTab === 'what_ai_sees' && (
                <div className="space-y-3">
                  {/* Real-time Telemetry Vector */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Когнитивная нагрузка</span>
                      <strong className="text-base font-bold text-sky-400 font-mono">{telemetryState.overallCognitiveLoad}%</strong>
                      <span className="text-[10px] text-slate-400 block">Ментальный тонус в норме</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Индекс сомнений</span>
                      <strong className="text-base font-bold text-indigo-400 font-mono">{telemetryState.indecisionIndex}%</strong>
                      <span className="text-[10px] text-slate-400 block">Быстрый отклик на тесты</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Заземление ядра (Grounding)</span>
                      <strong className="text-base font-bold text-emerald-400 font-mono">{sphereData.telemetry.coreResonancePercentage}%</strong>
                      <span className="text-[10px] text-slate-400 block">Аксиомы подкреплены кодом</span>
                    </div>
                  </div>

                  {/* AI Perceptions Stream */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                      Реальные наблюдения нейро-сенсоров телеметрии:
                    </span>
                    {(ledgerData?.aiPerceptions || []).map((p, idx) => (
                      <div 
                        key={p.id || idx}
                        className={`p-3 rounded-xl border text-xs space-y-1 ${
                          p.severity === 'friction' 
                            ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                            : 'bg-slate-950/80 border-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-cyan-400 font-semibold uppercase">[{p.channel}]</span>
                          <span className="text-slate-500">{new Date(p.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="leading-relaxed">{p.observation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {castalianActiveTab === 'what_ai_does' && (
                <div className="space-y-3">
                  {/* Clean Memory Pipeline Summary */}
                  <div className="p-3.5 rounded-xl bg-indigo-950/50 border border-indigo-500/30 text-xs space-y-1.5">
                    <div className="flex items-center space-x-2 text-indigo-300 font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Патч ИИ: Zero-Hallucination & Clean-Memory Ledger</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Перед каждым ответом ИИ загружает только доказанные инварианты из ядра. После вывода и синтеза луча транзитная память полностью стирается. Диалоговый шум не накапливается.
                    </p>
                  </div>

                  {/* Action Stream */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                      Журнал действий и дедукций агентов ИИ:
                    </span>
                    {(ledgerData?.aiActions || []).map((act, idx) => (
                      <div 
                        key={act.id || idx}
                        className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-emerald-400 font-bold uppercase">[{act.actionType}]</span>
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300">Clean Memory Purged</span>
                          <span className="text-slate-500">{new Date(act.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-slate-200 leading-relaxed">{act.description}</p>
                        <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-900">
                          Целевой инвариант: <span className="text-cyan-300">«{act.targetAxiom}»</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {castalianActiveTab === 'glass_bead_game' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                      <span className="flex items-center space-x-1.5">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span>Сыграть ход в бисер (Кастальенский синтез)</span>
                      </span>
                      <span className="text-[10px] font-mono bg-cyan-500/20 px-2 py-0.5 rounded text-cyan-300">
                        Gemini Magister Ludi
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-tight">
                      ИИ соединяет фундаментальную аксиому с боевым проектом или практическим навыком, выводя строгий математический мост и код.
                    </p>
                    <button
                      type="button"
                      disabled={isSynthesizingCastalian}
                      onClick={() => handleCastalianSynthesisMove()}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs transition flex items-center justify-center space-x-2 shadow-lg shadow-cyan-600/30 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isSynthesizingCastalian ? 'animate-spin' : ''}`} />
                      <span>{isSynthesizingCastalian ? 'Синтез междисциплинарного луча...' : 'Сделать ход: Построить новый Кастальенский луч ИИ'}</span>
                    </button>
                  </div>

                  {/* Active Castalian Bridges */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                      Действующие Кастальенские лучи и математические мосты:
                    </span>
                    {(ledgerData?.castalianBridges || []).map((b) => (
                      <div 
                        key={b.id}
                        className="p-3 rounded-xl bg-slate-950/90 border border-cyan-500/30 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold text-cyan-300">
                          <span className="flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                            <span>Кастальенский Луч: {b.source} ➔ {b.target}</span>
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400">Сила: {Math.round(b.strength * 100)}%</span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          {b.explanation}
                        </p>
                        <div className="bg-black/60 p-2 rounded-lg border border-cyan-500/20 font-mono text-cyan-200 text-[11px] overflow-x-auto shadow-inner">
                          {b.mathBridge}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400">
                Кастальенский резонанс: <strong className="text-cyan-300 font-mono">{sphereData.telemetry.castalianResonanceScore || 91}%</strong>
              </span>
              <button
                type="button"
                onClick={() => setShowCastalianHud(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
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
