import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { motion } from 'motion/react';
import { 
  Globe, 
  Compass, 
  BookOpen, 
  Users, 
  Award, 
  Sparkles, 
  ArrowRight, 
  RotateCcw, 
  Layers, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Brain, 
  Terminal, 
  MessageSquare, 
  FileCode2, 
  ExternalLink,
  Lock,
  GitFork,
  ArrowUpRight,
  Workflow,
  Check,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { playChime } from '../../utils/audio.ts';

interface FeatureInteractiveShowcaseProps {
  onCtaClick: () => void;
}

interface SphereTopicItem {
  id: string;
  title: string;
  domain: string;
  badge: string;
  whyNeeded: string;
  unlocksNext: string[];
  prerequisites: string[];
  realWorldUsage: string;
  sourceCitation: string;
  color: string;
  coords: { x: number; y: number; z: number };
}

const SPHERE_DEMO_TOPICS: SphereTopicItem[] = [
  {
    id: 't-deconstruct',
    title: 'Правило 80/20: самое главное без лишней воды',
    domain: 'Быстрый старт',
    badge: 'Главная основа',
    whyNeeded: 'Помогает выделить 20% ключевых правил, на которых держится 80% всей практики. Вы не тонете в бесконечных инструкциях, а сразу беретесь за суть.',
    unlocksNext: ['Быстрый поиск в базах данных', 'Параллельная работа', 'Асинхронные очереди'],
    prerequisites: ['Понимание цели', 'Критерии готового результата'],
    realWorldUsage: 'Быстрое освоение любой новой технологии или языка за 2–3 недели вместо месяцев зубрежки.',
    sourceCitation: 'Учебное пособие по методике осознанной практики (OpenStax)',
    color: '#38bdf8', // Neon Sky
    coords: { x: 0, y: 15, z: 54 },
  },
  {
    id: 't-btree',
    title: 'Быстрый поиск в базах данных (B-Tree)',
    domain: 'Базы данных',
    badge: 'Ключевой навык',
    whyNeeded: 'Объясняет, как базы данных мгновенно находят нужные записи среди миллионов строк без зависания диска и сервера.',
    unlocksNext: ['Синхронизация серверов', 'Разделение баз данных (Шардирование)'],
    prerequisites: ['Базовые структуры данных', 'Работа с файлами в системе'],
    realWorldUsage: 'Ускорение медленных SQL-запросов в 100+ раз и правильная настройка индексов в PostgreSQL и MySQL.',
    sourceCitation: 'Руководство по внутреннему устройству СУБД (IEEE)',
    color: '#a855f7', // Neon Violet
    coords: { x: -45, y: -18, z: 28 },
  },
  {
    id: 't-raft',
    title: 'Синхронизация серверов без сбоев (Raft)',
    domain: 'Серверы & Сети',
    badge: 'Надежность систем',
    whyNeeded: 'Учит, как группа из нескольких серверов договаривается между собой и сохраняет данные, даже если один из компьютеров внезапно отключился.',
    unlocksNext: ['Проверка систем на прочность', 'Событийная архитектура'],
    prerequisites: ['Быстрый поиск в базах данных', 'Сетевые подключения TCP/IP'],
    realWorldUsage: 'Понимание работы Kubernetes, кластеров Kafka и создание сервисов, которые никогда не падают.',
    sourceCitation: 'Алгоритм надежного консенсуса (USENIX ATC)',
    color: '#60a5fa', // Neon Blue
    coords: { x: 55, y: 35, z: -68 },
  },
  {
    id: 't-zerocopy',
    title: 'Ускорение передачи данных по сети (Zero-Copy)',
    domain: 'Высокие нагрузки',
    badge: 'Максимальная скорость',
    whyNeeded: 'Убирает лишнее копирование файлов в оперативной памяти, позволяя серверу обрабатывать гигантские объемы данных без тормозов.',
    unlocksNext: ['Быстрые сетевые шлюзы', 'Видеостриминг высокой четкости'],
    prerequisites: ['Оперативная память', 'Системные вызовы ОС'],
    realWorldUsage: 'Создание сверхбыстрых сетевых шлюзов и обработка сотен тысяч запросов в секунду.',
    sourceCitation: 'Принципы высокоскоростного сетевого обмена (ACM)',
    color: '#34d399', // Neon Emerald
    coords: { x: -68, y: 52, z: -52 },
  },
  {
    id: 't-chaos',
    title: 'Проверка систем на надежность (Chaos Testing)',
    domain: 'Тестирование',
    badge: 'Защита от сбоев',
    whyNeeded: 'Показывает, как специально отключать отдельные части системы во время тестов, чтобы найти слабые места до того, как они сломаются у пользователей.',
    unlocksNext: ['Финальный проект в портфолио', 'Проверка готовности к запуску'],
    prerequisites: ['Синхронизация серверов', 'Шаблоны защиты от перегрузок'],
    realWorldUsage: 'Защита сервисов от массовых аварий в дни пиковых распродаж и нагрузок.',
    sourceCitation: 'Инженерия надежности и поиск сбоев (ACM Queue)',
    color: '#fbbf24', // Neon Amber
    coords: { x: 92, y: -70, z: 75 },
  },
  {
    id: 't-memory',
    title: 'Параллельная работа без блокировок (Lock-Free)',
    domain: 'Производительность',
    badge: 'Многопоточность',
    whyNeeded: 'Учит запускать десятки задач одновременно так, чтобы программы не блокировали друг друга и не создавали очередей ожидания.',
    unlocksNext: ['Сверхбыстрые очереди сообщений', 'Торговые и финансовые движки'],
    prerequisites: ['Кэш процессора', 'Основы многопоточности'],
    realWorldUsage: 'Создание игровых серверов, торговых систем и сервисов с мгновенным откликом.',
    sourceCitation: 'Многопоточное программирование на практике (MIT Press)',
    color: '#f472b6', // Neon Pink
    coords: { x: -78, y: -42, z: 85 },
  },
];

export const FeatureInteractiveShowcase: React.FC<FeatureInteractiveShowcaseProps> = ({ onCtaClick }) => {
  const [activeTab, setActiveTab] = useState<'sphere' | 'dag' | 'focus' | 'peer' | 'portfolio'>('sphere');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('t-deconstruct');
  const [isRotating, setIsRotating] = useState<boolean>(true);

  const selectedTopic = useMemo(() => {
    return SPHERE_DEMO_TOPICS.find(t => t.id === selectedTopicId) || SPHERE_DEMO_TOPICS[0];
  }, [selectedTopicId]);

  // Three.js Canvas Reference for Dark Neon 3D Knowledge Network (Google AI / Gemini style)
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sphereGroupRef = useRef<THREE.Group | null>(null);
  const nodesMeshMapRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const rotationRef = useRef<{ x: number; y: number }>({ x: 0.15, y: 0.35 });
  const isDraggingRef = useRef<boolean>(false);
  const prevMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Neon Dark Three.js 3D Neural Sphere Setup
  useEffect(() => {
    if (activeTab !== 'sphere' || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.z = 240;

    // 2. Renderer with deep dark background
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Main Rotating Group
    const sphereGroup = new THREE.Group();
    sphereGroup.rotation.x = rotationRef.current.x;
    sphereGroup.rotation.y = rotationRef.current.y;
    sphereGroupRef.current = sphereGroup;
    scene.add(sphereGroup);

    // 4. Studio Lighting for Neon Aesthetics
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x818cf8, 2.5, 400);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.6);
    dirLight1.position.set(120, 150, 180);
    scene.add(dirLight1);

    // 5. Subtle Neon Concentric Orbital Rings
    const radii = [54, 105, 155];
    radii.forEach((r, idx) => {
      const ringGeo = new THREE.RingGeometry(r - 0.5, r + 0.5, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0x38bdf8 : idx === 1 ? 0x818cf8 : 0x64748b,
        transparent: true,
        opacity: idx === 0 ? 0.35 : idx === 1 ? 0.22 : 0.12,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / (2 + idx * 0.4);
      ringMesh.rotation.y = Math.PI / (3 + idx * 0.3);
      sphereGroup.add(ringMesh);
    });

    // 6. Interactive Glowing Solid Nodes
    const nodesMeshMap = new Map<string, THREE.Mesh>();
    nodesMeshMapRef.current = nodesMeshMap;

    SPHERE_DEMO_TOPICS.forEach((topic) => {
      const isSelected = topic.id === selectedTopicId;
      const nodeGeo = new THREE.SphereGeometry(isSelected ? 7.2 : 5.4, 32, 32);
      
      const nodeMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(topic.color),
        emissive: new THREE.Color(topic.color),
        emissiveIntensity: isSelected ? 0.8 : 0.4,
        roughness: 0.2,
        metalness: 0.6,
      });

      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.set(topic.coords.x, topic.coords.y, topic.coords.z);
      nodeMesh.userData = { topicId: topic.id };

      // Glowing selection halo
      if (isSelected) {
        const glowGeo = new THREE.SphereGeometry(10.5, 24, 24);
        const glowMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(topic.color),
          transparent: true,
          opacity: 0.25,
          wireframe: true,
        });
        const glowMesh = new THREE.Mesh(glowGeo, glowMat);
        nodeMesh.add(glowMesh);
      }

      sphereGroup.add(nodeMesh);
      nodesMeshMap.set(topic.id, nodeMesh);
    });

    // 7. Prerequisite & Dependency Connection Arcs with Pulsing Glow
    const linkPairs = [
      ['t-deconstruct', 't-btree'],
      ['t-btree', 't-raft'],
      ['t-raft', 't-zerocopy'],
      ['t-raft', 't-chaos'],
      ['t-btree', 't-memory'],
      ['t-zerocopy', 't-chaos'],
    ];

    linkPairs.forEach(([fromId, toId]) => {
      const from = SPHERE_DEMO_TOPICS.find(t => t.id === fromId);
      const to = SPHERE_DEMO_TOPICS.find(t => t.id === toId);
      if (!from || !to) return;

      const points = [
        new THREE.Vector3(from.coords.x, from.coords.y, from.coords.z),
        new THREE.Vector3(
          (from.coords.x + to.coords.x) * 0.68,
          (from.coords.y + to.coords.y) * 0.68,
          (from.coords.z + to.coords.z) * 0.68
        ),
        new THREE.Vector3(to.coords.x, to.coords.y, to.coords.z),
      ];

      const curve = new THREE.QuadraticBezierCurve3(points[0], points[1], points[2]);
      const curvePoints = curve.getPoints(32);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
      const isRelated = fromId === selectedTopicId || toId === selectedTopicId;

      const lineMat = new THREE.LineBasicMaterial({
        color: isRelated ? 0x38bdf8 : 0x475569,
        transparent: true,
        opacity: isRelated ? 0.95 : 0.35,
      });

      const line = new THREE.Line(lineGeo, lineMat);
      sphereGroup.add(line);
    });

    // 8. Raycaster for Interactive Selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      isDraggingRef.current = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      prevMousePosRef.current = { x: clientX, y: clientY };
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      if (isDraggingRef.current && sphereGroupRef.current) {
        const deltaX = clientX - prevMousePosRef.current.x;
        const deltaY = clientY - prevMousePosRef.current.y;

        rotationRef.current.y += deltaX * 0.007;
        rotationRef.current.x += deltaY * 0.007;

        sphereGroupRef.current.rotation.y = rotationRef.current.y;
        sphereGroupRef.current.rotation.x = rotationRef.current.x;

        prevMousePosRef.current = { x: clientX, y: clientY };
      }
    };

    const handlePointerUp = (e: MouseEvent | TouchEvent) => {
      isDraggingRef.current = false;

      const rect = container.getBoundingClientRect();
      const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : (e as MouseEvent).clientY;

      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = Array.from(nodesMeshMap.values());
      const intersects = raycaster.intersectObjects(meshes, false);

      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object as THREE.Mesh;
        const topicId = clickedMesh.userData.topicId;
        if (topicId) {
          setSelectedTopicId(topicId);
          playChime('click');
        }
      }
    };

    container.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    container.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);

    // 9. Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    // 10. Animation Render Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (sphereGroupRef.current && isRotating && !isDraggingRef.current) {
        rotationRef.current.y += 0.0022;
        sphereGroupRef.current.rotation.y = rotationRef.current.y;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      container.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [activeTab, selectedTopicId, isRotating]);

  const modulesNav = [
    { id: 'sphere', label: '01. Сфера Знаний', sub: 'Инварианты & 3D связи', icon: Globe },
    { id: 'dag', label: '02. Пошаговый план', sub: '200 квантов по 30 мин', icon: Compass },
    { id: 'focus', label: '03. Студия & Код', sub: 'Чистая теория и тесты', icon: BookOpen },
    { id: 'peer', label: '04. Практика в парах', sub: 'Спарринг со сменой ролей', icon: Users },
    { id: 'portfolio', label: '05. Портфолио', sub: 'Проверенные артефакты', icon: Award },
  ];

  return (
    <section id="features" className="py-20 md:py-28 relative z-10 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Editorial Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/90 text-slate-700 text-[11px] font-mono font-medium tracking-wide border border-slate-200/90 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ИНТЕРАКТИВНАЯ ОПЕРАЦИОННАЯ СРЕДА ОБУЧЕНИЯ</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-semibold text-slate-900 tracking-tight leading-tight">
            Зачем нужна каждая тема — видно с первого взгляда
          </h2>
          <p className="text-sm sm:text-base text-[#6E6E73] max-w-2xl mx-auto leading-relaxed font-normal">
            Интерактивный 3D-граф знаний связывает фундамент теории с боевыми проектами, исключая эффект заучивания без понимания.
          </p>
        </div>

        {/* Google Workspace Style Segmented Tab Controller */}
        <div className="flex justify-center overflow-x-auto pb-1">
          <div className="inline-flex p-1.5 rounded-full bg-[#F1F3F4] border border-[#DADCE0] shadow-2xs gap-1 relative">
            {modulesNav.map((m) => {
              const Icon = m.icon;
              const isActive = activeTab === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(m.id as any);
                    playChime('click');
                  }}
                  className={`relative px-4 py-2 rounded-full text-xs font-medium transition cursor-pointer select-none z-10 flex items-center space-x-2 ${
                    isActive ? 'text-[#1A73E8] font-semibold' : 'text-[#5F6368] hover:text-[#202124]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeShowcaseTab"
                      className="absolute inset-0 bg-white rounded-full shadow-xs -z-10"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#1A73E8]' : 'text-slate-400'}`} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* PRODUCT SHOWCASE: REAL GOOGLE WORKSPACE WEB APP WINDOW */}
        <div className="rounded-[28px] border border-[#DADCE0] bg-[#090D16] shadow-[0_20px_60px_rgba(0,0,0,0.18)] overflow-hidden ring-1 ring-slate-900/10 text-white">
          
          {/* Google Chrome / Workspace Window Titlebar */}
          <div className="px-5 py-3 border-b border-white/10 bg-[#161B26] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-[#EA4335] inline-block shadow-2xs" />
                <span className="w-3 h-3 rounded-full bg-[#FBBC04] inline-block shadow-2xs" />
                <span className="w-3 h-3 rounded-full bg-[#34A853] inline-block shadow-2xs" />
              </div>
              
              <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/10 text-[11px] font-mono text-slate-300">
                <span className="text-[#34A853] font-bold">🔒</span>
                <span>workspace.learning-os.cloud</span>
                <span className="text-slate-500">/</span>
                <span className="text-[#8AB4F8] font-medium">{activeTab}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-[#34A853] animate-pulse" />
              <span className="hidden sm:inline text-slate-300 font-sans text-[11px]">Google Workspace Sync</span>
            </div>
          </div>

          {/* ========================================================
              TAB 1: 3D KNOWLEDGE SPHERE BENTO GRID (Material 3)
             ======================================================== */}
          {activeTab === 'sphere' && (
            <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* Main Card (2/3 Width): Interactive 3D Knowledge Network Canvas */}
              <div className="lg:col-span-2 rounded-2xl bg-[#090D16] border border-white/10 p-5 relative overflow-hidden flex flex-col justify-between min-h-[460px]">
                {/* Top Overlay Badge & Topic Quick Switcher */}
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-full bg-white/10 text-sky-300 border border-sky-500/30 text-[11px] font-mono font-medium">
                      {selectedTopic.domain} · {selectedTopic.badge}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsRotating(!isRotating)}
                    className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 text-[10px] font-mono transition cursor-pointer flex items-center space-x-1 border border-white/10"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{isRotating ? 'Авто-вращение: Вкл' : 'Вращение: Пауза'}</span>
                  </button>
                </div>

                {/* 3D WebGL Canvas Mount Container */}
                <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing z-0" />

                {/* Bottom Overlay Bar with Active Node Title & Switcher */}
                <div className="z-10 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-white/10 bg-black/40 backdrop-blur-md -mx-5 -mb-5 p-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400">Выбранный узел знаний:</span>
                    <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <span>{selectedTopic.title}</span>
                      <span className="text-sky-400 font-mono text-[10px]">({selectedTopic.coords.x}, {selectedTopic.coords.y})</span>
                    </div>
                  </div>

                  {/* Horizontal Mini Topic Chips */}
                  <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
                    {SPHERE_DEMO_TOPICS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSelectedTopicId(t.id);
                          playChime('click');
                        }}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition cursor-pointer shrink-0 border ${
                          selectedTopicId === t.id
                            ? 'bg-sky-500 text-white border-sky-400 font-bold shadow-xs'
                            : 'bg-white/5 hover:bg-white/15 text-slate-300 border-white/10'
                        }`}
                      >
                        {t.domain}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Side Column (1/3 Width): 2 Clean Bento Cards */}
              <div className="flex flex-col space-y-4">
                
                {/* Top Bento Card: Pareto 80/20 Metric with Pastel Tonal Surface */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3 flex-1 backdrop-blur-sm">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-bold text-purple-300 flex items-center space-x-1.5">
                      <Zap className="w-3.5 h-3.5 text-purple-400" />
                      <span>Принцип Парето 80/20</span>
                    </span>
                    <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                      Инвариант
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    {selectedTopic.whyNeeded}
                  </p>

                  <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/20 text-[11px] text-purple-200 space-y-1">
                    <span className="font-bold block text-purple-300">Применение в бою:</span>
                    <span>{selectedTopic.realWorldUsage}</span>
                  </div>
                </div>

                {/* Bottom Bento Card: Impact Radar & Unlocked Projects */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3 flex-1 backdrop-blur-sm">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-bold text-sky-300 flex items-center space-x-1.5">
                      <Workflow className="w-3.5 h-3.5 text-sky-400" />
                      <span>Карта связей и проекты</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Impact Rays</span>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Базовые пререквизиты:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedTopic.prerequisites.map((p, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-white/10 text-slate-300 text-[10px] border border-white/10">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-1">
                      <span className="text-sky-300 block text-[10px] uppercase font-mono">Открывает доступ к темам:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedTopic.unlocksNext.map((u, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-200 text-[10px] border border-sky-500/30">
                            {u}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-white/10 font-mono">
                    <span>{selectedTopic.sourceCitation}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ========================================================
              TAB 2: DAG GRAPH (200 Quanta Syllabus)
             ======================================================== */}
          {activeTab === 'dag' && (
            <div className="p-6 sm:p-8 space-y-5 bg-[#090D16]">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Модульный план: 200 квантов по 30 минут</h3>
                  <p className="text-xs text-slate-400">Каждый шаг дает готовый практический артефакт в портфолио</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-mono border border-emerald-500/30">
                  DAG Directed Graph
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { num: 'Квант 1.1', title: 'Декомпозиция целей и критерии готовности', type: 'Фундамент', xp: '+50 XP' },
                  { num: 'Квант 1.2', title: 'Изоляция точек отказа и инварианты', type: 'Архитектура', xp: '+65 XP' },
                  { num: 'Квант 1.3', title: 'Парный спарринг со сменой ролей', type: 'Спарринг', xp: '+100 XP' },
                  { num: 'Квант 1.4', title: 'Боевой кейс продакшена в портфолио', type: 'Проект', xp: '+150 XP' },
                ].map((q, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 hover:bg-white/10 transition">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">{q.num}</span>
                      <span className="text-emerald-400 font-bold">{q.xp}</span>
                    </div>
                    <div className="font-bold text-xs text-white leading-snug">{q.title}</div>
                    <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                      {q.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 3: FOCUS STUDIO & CODE SANDBOX
             ======================================================== */}
          {activeTab === 'focus' && (
            <div className="p-6 sm:p-8 space-y-4 bg-[#090D16]">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white">Интерактивная IDE & Песочница</span>
                </div>
                <span className="text-xs text-emerald-400 font-mono">Live Runtime · 0ms Latency</span>
              </div>

              <div className="rounded-2xl bg-black border border-white/10 p-4 font-mono text-xs text-emerald-400 leading-relaxed overflow-x-auto">
                <pre>{`// Практический модуль: Инварианты распределенной отказоустойчивости
export function verifyCoreInvariant(state: SystemState): boolean {
  // 1. Проверяем изоляцию критического контура
  const isIsolated = state.circuitBreaker.status === 'ISOLATED';
  
  // 2. Идемпотентная обработка повторных попыток
  const isIdempotent = state.transactionLog.hasQuorum();
  
  return isIsolated && isIdempotent;
}

console.log("Status:", verifyCoreInvariant(mockClusterState)); // Output: PASS`}</pre>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 4: P2P SPARRING WORKBENCH
             ======================================================== */}
          {activeTab === 'peer' && (
            <div className="p-6 sm:p-8 space-y-4 bg-[#090D16]">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white">Синхронный спарринг 1-на-1 со сменой ролей</span>
                </div>
                <span className="text-xs text-emerald-400 font-mono">P2P WebRTC Synced</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="font-bold text-slate-200">🎤 Роль А: Спикер / Архитектор (Вы)</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Защищает архитектурную схему, обосновывает компромиссы и доказывает сохранение инвариантов перед напарником.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="font-bold text-purple-300">🛡 Роль Б: Аудитор надежности (Напарник)</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Проводит стресс-аудит, ищет краевые случаи при 10x нагрузке и формулирует конструктивную критику.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 5: PORTFOLIO & PROVEN ARTIFACTS
             ======================================================== */}
          {activeTab === 'portfolio' && (
            <div className="p-6 sm:p-8 space-y-4 bg-[#090D16]">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">Проверенное портфолио артефактов</span>
                </div>
                <span className="text-xs text-amber-300 font-mono">100% Верифицировано</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {[
                  { title: 'Архитектурный аудит СУБД', format: '.sql + .md', score: '98/100' },
                  { title: 'Реализация Raft-консенсуса', format: '.ts + .json', score: '96/100' },
                  { title: 'Стресс-тест Circuit Breaker', format: '.py + report', score: '95/100' },
                ].map((art, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="font-bold text-white text-xs">{art.title}</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>{art.format}</span>
                      <span className="text-emerald-400 font-bold">{art.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  );
};
