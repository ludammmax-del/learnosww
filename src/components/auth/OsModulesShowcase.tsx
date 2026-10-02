import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  Monitor,
  Layers,
  Globe,
  Brain,
  Users,
  Zap,
  Calendar,
  Award,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Flame,
  Clock,
  Play,
  CheckCircle2,
  FileText,
  Activity,
  Maximize2,
  RotateCcw,
  BarChart3,
  Palette,
  Workflow,
  Compass,
  FileSpreadsheet
} from 'lucide-react';
import { playChime } from '../../utils/audio.ts';

interface OsModulesShowcaseProps {
  onComplete: () => void;
  onBack: () => void;
}

interface ModuleInfo {
  id: string;
  badge: string;
  title: string;
  shortDesc: string;
  fullDesc: string;
  icon: React.ComponentType<{ className?: string }>;
  tags: string[];
  metrics: { label: string; value: string }[];
}

export const MODULES_DATA: ModuleInfo[] = [
  {
    id: 'desktop',
    badge: 'Модуль 01 · Рабочее пространство',
    title: 'Рабочий стол OS и Плитка Окон',
    shortDesc: 'Полноценная многооконная среда с виджетами и таймером глубокого фокуса',
    fullDesc: 'Гибкий рабочий стол реальной операционной системы: свободно перемещайте окна, организуйте умную мозаику (50/50, 3 колонки, сетка 2×2), прикрепляйте стикеры заметок, запускайте таймер Помодоро и меняйте фоновые обои без потери контекста.',
    icon: Monitor,
    tags: ['Многооконность', 'Tiling-мозаика', 'Помодоро', 'Виджеты'],
    metrics: [
      { label: 'Режим сетки', value: 'Smart Tiling' },
      { label: 'Виджетов', value: '8 типов' },
      { label: 'Задержка', value: '< 16 ms' },
    ],
  },
  {
    id: 'dag',
    badge: 'Модуль 02 · Навигация мастерства',
    title: 'DAG-Граф Знаний',
    shortDesc: '200 взаимосвязанных практических квантов со строгой топологией зависимостей',
    fullDesc: 'Каждый навык декомпозирован в ориентированный ациклический граф (DAG). Никаких случайных тем: вы переходите к следующему кванту только после подтверждения реального понимания на предыдущем. Граф исключает пробелы в фундаменте.',
    icon: Layers,
    tags: ['200 квантов', 'Зависимости', 'Без пробелов', 'Топология'],
    metrics: [
      { label: 'Квантов в треке', value: '200' },
      { label: 'Проверка связей', value: 'Строгая' },
      { label: 'Ориентация', value: 'DAG-граф' },
    ],
  },
  {
    id: 'sphere',
    badge: 'Модуль 03 · 3D-Топология',
    title: 'Интерактивная Сфера Знаний',
    shortDesc: 'Пространственная трехмерная визуализация концептов и глубины связей',
    fullDesc: 'Панорамный 3D-обзор всей дисциплины на Three.js. Вращайте созвездия понятий в пространстве на 360°, переключайте 3 концентрических слоя (Ядро, Мантия, Орбита) и наблюдайте, как фундаментальные принципы и практические кванты образуют целостную ментальную модель.',
    icon: Globe,
    tags: ['WebGL / Three.js', '3D-созвездия', '360° вращение', 'Ядро · Мантия · Орбита'],
    metrics: [
      { label: 'Рендеринг', value: '60 FPS 3D' },
      { label: 'Вращение', value: '360° Arcball' },
      { label: 'Слои', value: '3 уровня' },
    ],
  },
  {
    id: 'focus',
    badge: 'Модуль 04 · Практика в реальных условиях',
    title: 'Фокус-Студия & Практика Артефактов',
    shortDesc: 'Создание осязаемых артефактов в любых дисциплинах: от бизнес-моделей до дизайна и текстов',
    fullDesc: 'Универсальная среда глубокого фокуса для любого навыка: разработка бизнес-моделей, дизайн-концептов, стратегических планов, аналитических сводок или практических решений. ИИ-эксперт моментально калибрует логику артефакта, находит скрытые допущения и указывает на слабые места без иллюзии понятности.',
    icon: Brain,
    tags: ['Любые навыки', 'Создание артефактов', 'AI-калибровка', 'Deep Work'],
    metrics: [
      { label: 'Спектр задач', value: 'Любые дисциплины' },
      { label: 'Анализ ошибок', value: 'Мгновенно' },
      { label: 'Результат', value: 'Осязаемый артефакт' },
    ],
  },
  {
    id: 'peer',
    badge: 'Модуль 05 · Коллективная синергия',
    title: 'Парный Спарринг & Buddy',
    shortDesc: 'Отработка ролевых сценариев, взаимная аргументация и общие курсоры',
    fullDesc: 'Учитесь в паре с реальным напарником вашего уровня: защищайте свои решения, устраивайте дебаты, разбирайте сложные кейсы и делитесь экраном с живыми курсорами в реальном времени. Публичная аргументация закрепляет материал на 90%.',
    icon: Users,
    tags: ['Спарринг-партнер', 'Live-курсоры', 'Защита решений', 'Peer-to-Peer'],
    metrics: [
      { label: 'Синхронизация', value: 'Real-time' },
      { label: 'Эффект закрепления', value: '+90%' },
      { label: 'Аудио/Видео', value: 'WebRTC' },
    ],
  },
  {
    id: 'blitz',
    badge: 'Модуль 06 · Долговременная память',
    title: 'Интервальное Повторение & Эббингауз',
    shortDesc: 'Умная защита от забывания по экспоненте памяти и 2-минутные блиц-сессии',
    fullDesc: 'Алгоритм интервальных повторений рассчитывает точный момент, когда материал начинает стираться из памяти (день 1, 3, 7, 21), и предлагает 2-минутный блиц-квиз. Результаты повторений вознаграждаются кармой и повышают рейтинг надежности знаний.',
    icon: Zap,
    tags: ['Кривая забывания', '2-мин блиц', 'XP и Карма', 'Spaced Repetition'],
    metrics: [
      { label: 'Интервалы', value: '1 / 3 / 7 / 21 д.' },
      { label: 'Время блица', value: '120 сек' },
      { label: 'Удержание', value: '> 85%' },
    ],
  },
  {
    id: 'calendar',
    badge: 'Модуль 07 · Дисциплина и ритм',
    title: 'Каденция Практики и Стрики',
    shortDesc: 'Регулярные учебные спринты без выгорания, трекинг привычек и серии дней',
    fullDesc: 'Успех в обучении определяется не разовым марафоном, а ритмом каденции. Задайте комфортное расписание (от 15 до 60 минут в день), отслеживайте непрерывные серии (стрики) и формируйте несгибаемую привычку ежедневной практики.',
    icon: Calendar,
    tags: ['Стрик дней', 'Каденция', 'Анти-выгорание', 'Микро-спринты'],
    metrics: [
      { label: 'Трекинг серии', value: 'Ежедневно' },
      { label: 'Ритм', value: '15–60 мин' },
      { label: 'Статистика', value: 'Heatmap-сетка' },
    ],
  },
  {
    id: 'vault',
    badge: 'Модуль 08 · Измеримый результат',
    title: 'Хранилище Артефактов и Портфолио',
    shortDesc: 'Подтвержденные проекты, сертификаты мастерства и реальные работы',
    fullDesc: 'Каждый завершенный блок пополняет ваш персональный Vault реальными результатами: расчетными таблицами, дизайн-макетами, аналитическими отчетами, презентациями и практическими решениями. Вы покидаете платформу не с «сертификатом о просмотре», а с портфолио.',
    icon: Award,
    tags: ['Реальное портфолио', 'Проекты', 'Верификация', 'Экспорт'],
    metrics: [
      { label: 'Типы артефактов', value: 'Все форматы' },
      { label: 'Хранение', value: 'Облако + Локально' },
      { label: 'Подтверждение', value: 'Криптографическое' },
    ],
  },
];

export const OsModulesShowcase: React.FC<OsModulesShowcaseProps> = ({
  onComplete,
  onBack,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const activeModule = MODULES_DATA[currentIndex];

  const goNext = () => {
    if (currentIndex < MODULES_DATA.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      playChime('click');
    } else {
      onComplete();
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      playChime('click');
    } else {
      onBack();
    }
  };

  // Keyboard navigation: Left/Right arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        goNext();
      } else if (e.key === 'ArrowLeft') {
        goPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col my-auto animate-fade-in select-none px-2 sm:px-4 font-sans text-stone-900">
      {/* Top Slide Meta Bar & Pager Dots */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-200/80 mb-6 text-xs text-stone-500">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-stone-900 tracking-tight text-sm">
            Возможности Learning OS
          </span>
          <span className="text-stone-300">·</span>
          <span className="font-mono text-stone-500">
            {currentIndex + 1} из {MODULES_DATA.length}
          </span>
        </div>

        {/* Pager Pill Dots */}
        <div className="flex items-center space-x-1.5">
          {MODULES_DATA.map((mod, idx) => (
            <button
              key={mod.id}
              type="button"
              onClick={() => {
                setCurrentIndex(idx);
                playChime('click');
              }}
              className={`h-2 transition-all rounded-full cursor-pointer ${
                idx === currentIndex
                  ? 'w-6 bg-stone-900 shadow-xs'
                  : 'w-2 bg-stone-200 hover:bg-stone-300'
              }`}
              title={mod.title}
            />
          ))}
        </div>
      </div>

      {/* Main Single-Module Slide Screen (2 Columns: Info & Miniature UI) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[420px]">
        {/* Left Column: Module Description & Key Benefits */}
        <div className="lg:col-span-6 space-y-5 text-left">
          <div className="space-y-2">
            <div className="text-xs uppercase font-bold tracking-wider text-amber-700">
              {activeModule.badge}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight leading-snug">
              {activeModule.title}
            </h2>
            <p className="text-sm font-medium text-stone-700 leading-relaxed">
              {activeModule.shortDesc}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
            {activeModule.fullDesc}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {activeModule.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-lg bg-white border border-stone-200/90 text-[11px] font-medium text-stone-700 shadow-2xs"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Metric Indicators */}
          <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-stone-200/80">
            {activeModule.metrics.map((m) => (
              <div key={m.label} className="bg-white/80 p-2.5 rounded-xl border border-stone-200/80 shadow-2xs">
                <div className="text-[10px] text-stone-500 font-medium uppercase truncate">
                  {m.label}
                </div>
                <div className="text-xs font-bold text-stone-900 mt-0.5 font-mono truncate">
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Miniature Animated UI Preview of this exact Module */}
        <div className="lg:col-span-6 w-full flex items-center justify-center">
          <div className="w-full aspect-[4/3] max-w-[440px] rounded-3xl bg-white/95 backdrop-blur-xl border border-stone-200/90 shadow-xl shadow-stone-900/5 p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden transition-all duration-500">
            {/* Ambient subtle warm glow background */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-50/60 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-stone-100/70 rounded-full blur-2xl pointer-events-none" />

            {/* Render Specific Miniature for this Module */}
            <div className="relative z-10 flex-1 flex flex-col justify-center">
              {activeModule.id === 'desktop' && <MiniatureDesktopPreview />}
              {activeModule.id === 'dag' && <MiniatureDagPreview />}
              {activeModule.id === 'sphere' && <MiniatureSpherePreview />}
              {activeModule.id === 'focus' && <MiniatureFocusPreview />}
              {activeModule.id === 'peer' && <MiniaturePeerPreview />}
              {activeModule.id === 'blitz' && <MiniatureBlitzPreview />}
              {activeModule.id === 'calendar' && <MiniatureCalendarPreview />}
              {activeModule.id === 'vault' && <MiniatureVaultPreview />}
            </div>

            {/* Miniature Footer Info */}
            <div className="relative z-10 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400 font-mono">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-stone-600 font-medium">Активный модуль OS</span>
              </span>
              <span>Модуль #{currentIndex + 1}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Navigation Footer: Prev / Next / Keyboard shortcuts */}
      <div className="flex items-center justify-between pt-6 border-t border-stone-200/80 mt-6">
        <button
          type="button"
          onClick={goPrev}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer flex items-center space-x-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{currentIndex === 0 ? 'Назад к настройкам' : 'Предыдущий модуль'}</span>
        </button>

        <div className="text-[11px] text-stone-400 font-mono hidden sm:inline">
          Используйте клавиши ← и → для перелистывания
        </div>

        <button
          type="button"
          onClick={goNext}
          className="px-7 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-[#FAF8F5] font-semibold text-xs tracking-wide shadow-md shadow-stone-950/10 transition cursor-pointer flex items-center space-x-2 active:scale-98"
        >
          <span>{currentIndex === MODULES_DATA.length - 1 ? 'Сгенерировать персональный курс' : 'Следующий модуль'}</span>
          {currentIndex === MODULES_DATA.length - 1 ? (
            <ArrowRight className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};

/* =========================================================================
   INDIVIDUAL HIGH-FIDELITY ANIMATED MINIATURES FOR EACH OF THE 8 MODULES
   ========================================================================= */

// 1. Desktop & Windows Miniature
function MiniatureDesktopPreview() {
  return (
    <div className="w-full h-full flex flex-col justify-between py-2 text-left">
      {/* Top Bar Miniature */}
      <div className="h-6 px-2.5 bg-slate-900 text-white rounded-lg flex items-center justify-between text-[10px] font-mono shadow-xs">
        <div className="flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="font-bold">Desktop OS</span>
        </div>
        <div className="flex items-center space-x-2 text-slate-300">
          <span>50/50</span>
          <span>·</span>
          <span>25:00</span>
        </div>
      </div>

      {/* Two Tiling Windows side by side */}
      <div className="grid grid-cols-2 gap-2 my-2 flex-1">
        {/* Window 1: Focus Pomodoro */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-1">
            <span className="text-[10px] font-bold text-slate-700">Таймер Помодоро</span>
            <div className="flex space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            </div>
          </div>
          <div className="py-2 text-center">
            <div className="text-xl font-black font-mono text-slate-900">23:45</div>
            <div className="text-[9px] text-emerald-600 font-semibold mt-0.5">● Сессия активна</div>
          </div>
          <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
            <div className="bg-slate-900 h-full w-2/3" />
          </div>
        </div>

        {/* Window 2: Sticky Note */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between border-b border-amber-200/60 pb-1">
            <span className="text-[10px] font-bold text-amber-900">Заметка спринта</span>
            <span className="text-[9px] text-amber-600 font-mono">#важно</span>
          </div>
          <p className="text-[10px] text-amber-950/80 leading-snug py-1">
            Разобрать 3 практических кванта до 18:00 и защитить артефакт в спарринге.
          </p>
          <div className="flex items-center justify-between text-[9px] text-amber-700">
            <span>Чек-лист: 2/3</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Dock Bar */}
      <div className="h-6 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center space-x-3 text-[10px]">
        <span className="w-2 h-2 rounded bg-slate-900" />
        <span className="w-2 h-2 rounded bg-sky-500" />
        <span className="w-2 h-2 rounded bg-emerald-500" />
        <span className="w-2 h-2 rounded bg-indigo-500" />
      </div>
    </div>
  );
}

// 2. DAG Graph Miniature
function MiniatureDagPreview() {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center relative py-2">
      <svg className="w-full h-44 overflow-visible" viewBox="0 0 320 160">
        {/* Connecting laser lines */}
        <path d="M 50 80 L 120 40" stroke="#0F172A" strokeWidth="2" strokeDasharray="3 3" />
        <path d="M 50 80 L 120 120" stroke="#0F172A" strokeWidth="2" />
        <path d="M 120 40 L 200 60" stroke="#CBD5E1" strokeWidth="2" />
        <path d="M 120 120 L 200 100" stroke="#0F172A" strokeWidth="2" />
        <path d="M 200 100 L 270 80" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="3 3" />

        {/* Node 1: Completed */}
        <g transform="translate(50, 80)">
          <circle r="18" fill="#0F172A" />
          <path d="M -5 0 L -1 4 L 6 -3" fill="none" stroke="#FFFFFF" strokeWidth="2" />
          <text y="28" textAnchor="middle" fontSize="9" fill="#0F172A" fontWeight="bold">Квант 1</text>
        </g>

        {/* Node 2: Completed */}
        <g transform="translate(120, 120)">
          <circle r="18" fill="#0F172A" />
          <path d="M -5 0 L -1 4 L 6 -3" fill="none" stroke="#FFFFFF" strokeWidth="2" />
          <text y="28" textAnchor="middle" fontSize="9" fill="#0F172A" fontWeight="bold">Квант 2</text>
        </g>

        {/* Node 3: Skipped/Alternative */}
        <g transform="translate(120, 40)">
          <circle r="14" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
          <text y="24" textAnchor="middle" fontSize="8" fill="#64748B">Ветвь B</text>
        </g>

        {/* Node 4: Active Current Focus (pulsing ring) */}
        <g transform="translate(200, 100)">
          <circle r="22" fill="rgba(15, 23, 42, 0.15)" className="animate-ping" />
          <circle r="18" fill="#38BDF8" stroke="#0284C7" strokeWidth="2" />
          <polygon points="-3,-5 6,0 -3,5" fill="#FFFFFF" />
          <text y="28" textAnchor="middle" fontSize="9" fill="#0369A1" fontWeight="bold">В фокусе</text>
        </g>

        {/* Node 5: Locked */}
        <g transform="translate(270, 80)">
          <circle r="16" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.5" />
          <circle r="3" fill="#94A3B8" />
          <text y="26" textAnchor="middle" fontSize="8" fill="#94A3B8">Квант 4</text>
        </g>
      </svg>
      <div className="text-[10px] text-slate-500 font-mono mt-1">
        Топологический порядок зависимостей: 200 квантов
      </div>
    </div>
  );
}

// 3. 3D Sphere Miniature (Real Three.js Interactive WebGL Sphere with 360° Drag Rotation & Layer Filters)
function MiniatureSpherePreview() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredNodeInfo, setHoveredNodeInfo] = useState<{ title: string; layer: string; domain: string; color: string } | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<'all' | 'core' | 'mantle' | 'orbit'>('all');
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const rotationRef = useRef<{ x: number; y: number }>({ x: 0.25, y: 0.45 });
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const selectedLayerRef = useRef<'all' | 'core' | 'mantle' | 'orbit'>('all');
  const nodeMeshesRef = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    selectedLayerRef.current = selectedLayer;
    // Update node visibility / opacity based on selected layer
    nodeMeshesRef.current.forEach((mesh) => {
      const nodeLayer = mesh.userData.cfg.layerKey as 'core' | 'mantle' | 'orbit';
      const isMatch = selectedLayer === 'all' || selectedLayer === nodeLayer;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.opacity = isMatch ? 0.95 : 0.18;
        mat.transparent = true;
      }
      mesh.scale.setScalar(isMatch ? 1 : 0.65);
    });
  }, [selectedLayer]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 240;

    // 1. Scene & Camera
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 12, 175);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    dirLight.position.set(60, 80, 70);
    scene.add(dirLight);

    const corePointLight = new THREE.PointLight(0x0ea5e9, 3.2, 180);
    corePointLight.position.set(0, 0, 0);
    scene.add(corePointLight);

    // 4. Central Pulsing Plasma Core
    const coreGeom = new THREE.SphereGeometry(12, 32, 32);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.85,
      roughness: 0.15,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85,
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    scene.add(coreMesh);

    // 5. Spherical Concentric Guide Wireframes matching Real OS Knowledge Sphere
    const createWireSphere = (radius: number, color: number, opacity: number) => {
      const geom = new THREE.SphereGeometry(radius, 20, 14);
      const mat = new THREE.MeshBasicMaterial({
        color,
        wireframe: true,
        transparent: true,
        opacity,
      });
      return new THREE.Mesh(geom, mat);
    };

    const coreShell = createWireSphere(30, 0x38bdf8, 0.14);
    const mantleShell = createWireSphere(52, 0xa855f7, 0.09);
    const orbitShell = createWireSphere(74, 0x10b981, 0.07);

    const sphereContainerGroup = new THREE.Group();
    sphereContainerGroup.add(coreShell);
    sphereContainerGroup.add(mantleShell);
    sphereContainerGroup.add(orbitShell);
    scene.add(sphereContainerGroup);

    // 6. 3D Multi-domain Nodes Data across 3 concentric layers (Universal Skills: Logic, Business, Design, Analysis, Capstone)
    const nodesConfig = [
      // Layer 1: Core (First Principles & Axioms) - radius 30
      { id: 'c1', title: 'Аксиома Шеннона', layer: 'Ядро', layerKey: 'core', domain: 'Логика и теория', r: 30, phi: 0.5, theta: 0.6, color: 0x38bdf8, size: 3.4 },
      { id: 'c2', title: 'Инварианты логики', layer: 'Ядро', layerKey: 'core', domain: 'Когнитивистика', r: 30, phi: 1.3, theta: 2.2, color: 0x38bdf8, size: 3.2 },
      { id: 'c3', title: 'Первые принципы', layer: 'Ядро', layerKey: 'core', domain: 'Мышление', r: 30, phi: 2.3, theta: 4.1, color: 0x0ea5e9, size: 3.5 },
      { id: 'c4', title: 'Системная динамика', layer: 'Ядро', layerKey: 'core', domain: 'Системы', r: 30, phi: 2.7, theta: 1.2, color: 0x38bdf8, size: 3.2 },

      // Layer 2: Mantle (Applied Disciplines & Skills) - radius 52
      { id: 'm1', title: 'Юнит-экономика и LTV', layer: 'Мантия', layerKey: 'mantle', domain: 'Бизнес и финансы', r: 52, phi: 0.7, theta: 1.4, color: 0xf59e0b, size: 3.8 },
      { id: 'm2', title: 'UI/UX сетки и интерфейсы', layer: 'Мантия', layerKey: 'mantle', domain: 'Дизайн и продукты', r: 52, phi: 1.6, theta: 0.4, color: 0xec4899, size: 3.6 },
      { id: 'm3', title: 'Аргументация и дебаты', layer: 'Мантия', layerKey: 'mantle', domain: 'Риторика', r: 52, phi: 2.4, theta: 2.9, color: 0xa855f7, size: 3.7 },
      { id: 'm4', title: 'Анализ данных и гипотезы', layer: 'Мантия', layerKey: 'mantle', domain: 'Аналитика', r: 52, phi: 0.8, theta: 3.7, color: 0x6366f1, size: 3.6 },
      { id: 'm5', title: 'Управление рисками', layer: 'Мантия', layerKey: 'mantle', domain: 'Менеджмент', r: 52, phi: 1.9, theta: 5.0, color: 0x8b5cf6, size: 3.5 },
      { id: 'm6', title: 'Архитектурные паттерны', layer: 'Мантия', layerKey: 'mantle', domain: 'Инженерия', r: 52, phi: 2.8, theta: 4.2, color: 0xa855f7, size: 3.6 },
      { id: 'm7', title: 'Психология восприятия', layer: 'Мантия', layerKey: 'mantle', domain: 'Нейробиология', r: 52, phi: 1.1, theta: 4.7, color: 0xec4899, size: 3.5 },

      // Layer 3: Orbit (Capstone Deliverables & Artifacts) - radius 74
      { id: 'o1', title: 'Финальный Capstone: Проект OS', layer: 'Орбита', layerKey: 'orbit', domain: 'Портфолио', r: 74, phi: 0.5, theta: 2.4, color: 0x10b981, size: 4.4 },
      { id: 'o2', title: 'Защита бизнес-стратегии', layer: 'Орбита', layerKey: 'orbit', domain: 'Спарринг', r: 74, phi: 1.8, theta: 1.6, color: 0x10b981, size: 4.1 },
      { id: 'o3', title: 'Аналитическая модель Q4', layer: 'Орбита', layerKey: 'orbit', domain: 'Артефакт', r: 74, phi: 2.6, theta: 3.5, color: 0x059669, size: 4.2 },
      { id: 'o4', title: 'Дизайн-система продукта', layer: 'Орбита', layerKey: 'orbit', domain: 'Дизайн', r: 74, phi: 1.2, theta: 5.7, color: 0x10b981, size: 4.0 },
      { id: 'o5', title: 'Верифицированный релиз', layer: 'Орбита', layerKey: 'orbit', domain: 'Сертификат', r: 74, phi: 2.3, theta: 0.9, color: 0x10b981, size: 4.1 },
    ];

    const nodeMeshes: THREE.Mesh[] = [];

    nodesConfig.forEach((cfg) => {
      // Spherical -> Cartesian 3D coordinates
      const x = cfg.r * Math.sin(cfg.phi) * Math.cos(cfg.theta);
      const y = cfg.r * Math.cos(cfg.phi);
      const z = cfg.r * Math.sin(cfg.phi) * Math.sin(cfg.theta);

      // Node Sphere Mesh
      const nodeGeom = new THREE.SphereGeometry(cfg.size, 16, 16);
      const nodeMat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        emissive: cfg.color,
        emissiveIntensity: 0.5,
        roughness: 0.25,
        metalness: 0.5,
        transparent: true,
        opacity: 0.95,
      });
      const mesh = new THREE.Mesh(nodeGeom, nodeMat);
      mesh.position.set(x, y, z);
      mesh.userData = { cfg };

      // Outer Halo Ring
      const haloGeom = new THREE.RingGeometry(cfg.size * 1.3, cfg.size * 1.65, 16);
      const haloMat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      });
      const halo = new THREE.Mesh(haloGeom, haloMat);
      halo.lookAt(0, 0, 0);
      mesh.add(halo);

      sphereContainerGroup.add(mesh);
      nodeMeshes.push(mesh);
    });

    nodeMeshesRef.current = nodeMeshes;

    // 7. Constellation Connections (Core -> Mantle -> Orbit)
    const linksData = [
      ['c1', 'm1'], ['c1', 'm4'], ['c2', 'm3'], ['c3', 'm2'], ['c3', 'm6'],
      ['c4', 'm5'], ['c4', 'm7'], ['m1', 'o2'], ['m2', 'o4'], ['m3', 'o2'],
      ['m4', 'o3'], ['m5', 'o1'], ['m6', 'o1'], ['m7', 'o4'], ['o1', 'o5']
    ];

    linksData.forEach(([srcId, tgtId]) => {
      const srcNode = nodeMeshes.find((m) => m.userData.cfg.id === srcId);
      const tgtNode = nodeMeshes.find((m) => m.userData.cfg.id === tgtId);
      if (srcNode && tgtNode) {
        const points = [srcNode.position, tgtNode.position];
        const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({
          color: 0x94a3b8,
          transparent: true,
          opacity: 0.25,
        });
        const line = new THREE.Line(lineGeom, lineMat);
        sphereContainerGroup.add(line);
      }
    });

    // 8. Pointer Drag & Arcball 360° Controls
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      setIsRotating(false);
      try {
        container.setPointerCapture(e.pointerId);
      } catch (_) {}
      container.style.cursor = 'grabbing';
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      mouse.x = (clientX / width) * 2 - 1;
      mouse.y = -(clientY / height) * 2 + 1;

      // Raycaster for hover
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes, false);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const cfg = hitMesh.userData.cfg;
        setHoveredNodeInfo({
          title: cfg.title,
          layer: cfg.layer,
          domain: cfg.domain,
          color: '#' + cfg.color.toString(16).padStart(6, '0'),
        });
        container.style.cursor = 'pointer';
      } else {
        setHoveredNodeInfo(null);
        container.style.cursor = isDraggingRef.current ? 'grabbing' : 'grab';
      }

      // Drag 360° Rotation calculation
      if (isDraggingRef.current) {
        const deltaX = e.clientX - lastMousePosRef.current.x;
        const deltaY = e.clientY - lastMousePosRef.current.y;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };

        rotationRef.current.y += deltaX * 0.009;
        rotationRef.current.x += deltaY * 0.009;
        rotationRef.current.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, rotationRef.current.x));
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      isDraggingRef.current = false;
      try {
        container.releasePointerCapture(e.pointerId);
      } catch (_) {}
      container.style.cursor = 'grab';
    };

    const handlePointerLeave = () => {
      isDraggingRef.current = false;
      setHoveredNodeInfo(null);
      container.style.cursor = 'default';
    };

    const handlePointerClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes, false);
      if (intersects.length > 0) {
        playChime('click');
        const hitMesh = intersects[0].object as THREE.Mesh;
        const cfg = hitMesh.userData.cfg;
        setHoveredNodeInfo({
          title: cfg.title,
          layer: cfg.layer,
          domain: cfg.domain,
          color: '#' + cfg.color.toString(16).padStart(6, '0'),
        });
      }
    };

    container.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('pointerleave', handlePointerLeave);
    container.addEventListener('click', handlePointerClick);

    // 9. Animation Render Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (!isDraggingRef.current && isRotating) {
        rotationRef.current.y += 0.004;
      }

      sphereContainerGroup.rotation.x = rotationRef.current.x;
      sphereContainerGroup.rotation.y = rotationRef.current.y;

      const time = performance.now() * 0.0015;
      coreMesh.scale.setScalar(1 + Math.sin(time * 2) * 0.05);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('pointerleave', handlePointerLeave);
      container.removeEventListener('click', handlePointerClick);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isRotating]);

  const handleReset = () => {
    rotationRef.current = { x: 0.25, y: 0.45 };
    setIsRotating(true);
    setSelectedLayer('all');
    setHoveredNodeInfo(null);
    playChime('click');
  };

  return (
    <div className="w-full h-full flex flex-col justify-between items-center relative py-1 text-left select-none">
      {/* Top Controls & Status Bar */}
      <div className="w-full flex items-center justify-between z-20 px-1">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
          <span className="text-[11px] font-bold text-slate-800 tracking-tight">
            3D Сфера Знаний (Knowledge Sphere)
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => setIsRotating((prev) => !prev)}
            className={`px-2 py-0.5 rounded-md text-[10px] font-mono border transition cursor-pointer ${
              isRotating
                ? 'bg-sky-50 text-sky-700 border-sky-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
            title="Авто-вращение сферы"
          >
            {isRotating ? 'Авто: ВКЛ' : 'Авто: ВЫКЛ'}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
            title="Сбросить ориентацию 3D"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Layer Filter Tabs */}
      <div className="w-full flex items-center justify-center space-x-1 my-1 z-20">
        {(
          [
            { id: 'all', label: 'Все слои (16)' },
            { id: 'core', label: '● Ядро' },
            { id: 'mantle', label: '● Мантия' },
            { id: 'orbit', label: '● Орбита' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setSelectedLayer(tab.id);
              playChime('click');
            }}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition cursor-pointer ${
              selectedLayer === tab.id
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white/80 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Interactive WebGL 3D Canvas Mounting Container */}
      <div className="relative w-full flex-1 min-h-[185px] flex items-center justify-center my-0.5">
        <div
          ref={mountRef}
          className="w-full h-full min-h-[185px] touch-none cursor-grab active:cursor-grabbing"
          title="Зажмите и тяните в любую сторону, чтобы вращать сферу на 360°"
        />

        {/* Floating Node Hover Card */}
        {hoveredNodeInfo && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 bg-slate-900/95 text-white backdrop-blur-md rounded-xl text-[10px] shadow-xl border border-white/20 flex flex-col space-y-0.5 animate-fade-in pointer-events-none">
            <div className="flex items-center space-x-2">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: hoveredNodeInfo.color }}
              />
              <span className="font-bold">{hoveredNodeInfo.title}</span>
            </div>
            <div className="text-slate-400 text-[9px] font-mono flex items-center space-x-1.5">
              <span>Слой: {hoveredNodeInfo.layer}</span>
              <span>·</span>
              <span>{hoveredNodeInfo.domain}</span>
            </div>
          </div>
        )}

        {/* Drag Hint Watermark on Idle */}
        {!hoveredNodeInfo && (
          <div className="absolute bottom-1 right-2 z-20 text-[9px] text-slate-400 font-mono bg-white/70 backdrop-blur-xs px-2 py-0.5 rounded border border-slate-200 pointer-events-none">
            360° Arcball вращение
          </div>
        )}
      </div>

      {/* Layer Badges Footer */}
      <div className="w-full flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
        <div className="flex items-center space-x-1.5">
          <span className="px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 font-medium border border-sky-200 text-[9px]">
            ● Аксиомы ядра
          </span>
          <span className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-medium border border-purple-200 text-[9px]">
            ● Прикладные навыки
          </span>
          <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-200 text-[9px]">
            ● Капстоун-проекты
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">WebGL · 60 FPS</span>
      </div>
    </div>
  );
}

// 4. Focus Studio Miniature (Universal Multi-Discipline Workbench for ALL Skills)
function MiniatureFocusPreview() {
  const [activeSkillTab, setActiveSkillTab] = useState<'business' | 'design' | 'strategy' | 'systems'>('business');

  const artifactSamples = {
    business: {
      file: 'unit_economics_q4.calc',
      icon: BarChart3,
      domain: 'Бизнес и Финансы',
      content: [
        '# Юнит-экономика: когортный анализ продукта',
        'CAC: $42.50 | LTV (12 мес): $186.00 | Ratio: 4.37x',
        'Gross Margin: 74.2% | Payback Period: 2.8 мес',
        'Retention Day 30: 41.5% (целевой бенчмарк > 35%)'
      ],
      aiFeedback: 'AI-Рецензия: Маржинальность и LTV/CAC рассчитаны корректно. Рекомендуется заложить стресс-тест оттока во 2-м квартале (+25 XP).'
    },
    design: {
      file: 'onboarding_flow_spec.fig',
      icon: Palette,
      domain: 'Продуктовый Дизайн & UX',
      content: [
        '# Спецификация интерфейса: нулевой экран онбординга',
        'Иерархия: Hero-заголовок -> Шаги калибровки -> Кнопка действия',
        'Сетка: 8pt Grid System | Контрастность текста: 7.8:1 (AAA)',
        'Микро-анимации: spring-physics 400ms без блокировки UI'
      ],
      aiFeedback: 'AI-Рецензия: Контрастность и визуальный фокус безупречны. Устранена когнитивная перегрузка на шаге выбора цели (+30 XP).'
    },
    strategy: {
      file: 'positioning_pitch.doc',
      icon: FileText,
      domain: 'Стратегия & Риторика',
      content: [
        '# Тезисы позиционирования и защиты решения',
        '1. Ключевая боль рынка: иллюзия понимания без практики',
        '2. Решение: DAG-топология + мгновенная AI-калибровка',
        '3. Ответ на критику: подтверждение артефактами в Vault'
      ],
      aiFeedback: 'AI-Рецензия: Аргументация структурирована по принципу пирамиды Минто. Убран канцелярит в основном тезисе (+25 XP).'
    },
    systems: {
      file: 'decision_matrix_v2.tree',
      icon: Workflow,
      domain: 'Системный Анализ',
      content: [
        '# Дерево решений: сценарии обработки сбоев',
        'IF (нагрузка > 10k rps) -> Auto-scale + Circuit Breaker',
        'Инвариант: нулевая потеря транзакций при сбое реплики',
        'Recovery Time Objective (RTO) < 30 секунд'
      ],
      aiFeedback: 'AI-Рецензия: Краевой случай сетевого разделения покрыт компенсаторной веткой логики (+30 XP).'
    }
  };

  const current = artifactSamples[activeSkillTab];
  const CurrentIcon = current.icon;

  return (
    <div className="w-full h-full flex flex-col justify-between py-1 text-left text-[10px]">
      {/* Skill Domain Tabs (Demonstrating ALL Skills) */}
      <div className="grid grid-cols-4 gap-1 border-b border-slate-200 pb-1.5">
        {(
          [
            { id: 'business', label: '📊 Бизнес' },
            { id: 'design', label: '🎨 Дизайн' },
            { id: 'strategy', label: '✍️ Тексты' },
            { id: 'systems', label: '🧠 Системы' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveSkillTab(tab.id);
              playChime('click');
            }}
            className={`py-1 px-1 rounded-md text-[9px] font-medium text-center truncate transition cursor-pointer ${
              activeSkillTab === tab.id
                ? 'bg-slate-900 text-white font-bold shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Editor Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center space-x-1.5 truncate">
          <CurrentIcon className="w-3.5 h-3.5 text-slate-800 shrink-0" />
          <span className="font-bold text-slate-900 font-mono truncate">{current.file}</span>
        </div>
        <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold shrink-0">
          AI Калибровка: ON
        </span>
      </div>

      {/* Artifact Workbench Canvas */}
      <div className="bg-slate-900 text-slate-200 p-2.5 rounded-xl my-1.5 space-y-1 text-[9px] font-mono shadow-sm">
        <div className="text-slate-400 text-[8px] uppercase tracking-wider">{current.domain}</div>
        {current.content.map((line, idx) => (
          <div
            key={idx}
            className={
              idx === 0
                ? 'text-sky-300 font-bold'
                : idx === 1
                ? 'text-emerald-300'
                : idx === 2
                ? 'text-amber-200'
                : 'text-slate-300'
            }
          >
            {line}
          </div>
        ))}
      </div>

      {/* AI Live Feedback Stream Box */}
      <div className="bg-sky-50 border border-sky-200/90 rounded-xl p-2 text-[9px] flex items-start space-x-2">
        <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
        <div className="text-sky-900 leading-snug">
          <strong className="font-bold">ИИ-Рецензия:</strong> {current.aiFeedback}
        </div>
      </div>
    </div>
  );
}

// 5. Peer Collaboration Miniature
function MiniaturePeerPreview() {
  return (
    <div className="w-full h-full flex flex-col justify-between py-1 text-left">
      {/* Status Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1 text-[10px]">
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-slate-900">Спарринг-сессия активна</span>
        </div>
        <span className="text-slate-400 font-mono">08:42</span>
      </div>

      {/* Two Buddy Cards */}
      <div className="grid grid-cols-2 gap-2 my-2">
        {/* User Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center space-x-2">
          <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
            Я
          </div>
          <div className="truncate">
            <div className="text-[11px] font-bold text-slate-900 truncate">Вы (Спикер)</div>
            <div className="text-[9px] text-emerald-600 font-medium">Защита тезиса</div>
          </div>
        </div>

        {/* Partner Card */}
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-2.5 flex items-center space-x-2">
          <div className="w-7 h-7 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
            M
          </div>
          <div className="truncate">
            <div className="text-[11px] font-bold text-slate-900 truncate">Михаил (Buddy)</div>
            <div className="text-[9px] text-sky-600 font-medium">Оппонент / Критик</div>
          </div>
        </div>
      </div>

      {/* Live Shared Workspace Simulation with Partner Cursor */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 relative overflow-hidden text-[10px]">
        <div className="text-slate-500 text-[9px] uppercase font-mono mb-1">
          Совместный экран задачи:
        </div>
        <div className="text-slate-800 font-medium">
          «Какая архитектура минимизирует задержку в данном сценарии?»
        </div>

        {/* Simulated Peer Cursor */}
        <div className="absolute top-4 right-8 flex items-center space-x-1 pointer-events-none animate-bounce">
          <svg className="w-3.5 h-3.5 text-sky-500 fill-sky-500" viewBox="0 0 24 24">
            <path d="M3 3l7 18 3-7 7-3L3 3z" />
          </svg>
          <span className="bg-sky-500 text-white text-[8px] font-mono px-1 rounded shadow-xs">
            Михаил
          </span>
        </div>
      </div>
    </div>
  );
}

// 6. Interval Repetition & Blitz Miniature
function MiniatureBlitzPreview() {
  return (
    <div className="w-full h-full flex flex-col justify-between py-1 text-left">
      {/* Forgetting Curve Graph */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
        <div className="flex items-center justify-between text-[10px] mb-1 font-mono">
          <span className="font-bold text-slate-700">Кривая Эббингауза</span>
          <span className="text-emerald-600 font-bold">92% Удержание</span>
        </div>
        {/* Mini SVG Curve */}
        <svg className="w-full h-10" viewBox="0 0 200 40">
          <path d="M 0 5 Q 50 35 100 20 T 200 12" fill="none" stroke="#0F172A" strokeWidth="2" />
          <circle cx="100" cy="20" r="3" fill="#38BDF8" />
          <circle cx="200" cy="12" r="3" fill="#10B981" />
        </svg>
      </div>

      {/* 2-Min Blitz Question Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 my-1.5 space-y-1.5 shadow-2xs">
        <div className="flex items-center justify-between text-[9px]">
          <span className="uppercase font-bold text-slate-400">2-Мин Блиц-повторение</span>
          <span className="font-mono text-amber-600 font-bold">1:42</span>
        </div>
        <p className="text-[11px] font-semibold text-slate-900 leading-snug">
          В чем фундаментальное отличие синхронного спарринга от соло-практики?
        </p>
        <div className="grid grid-cols-2 gap-1.5 pt-0.5 text-[9px]">
          <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 font-medium flex items-center justify-between">
            <span>Защита аргументов</span>
            <Check className="w-3 h-3 text-emerald-600" />
          </div>
          <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600">
            Только скорость
          </div>
        </div>
      </div>

      <div className="text-[9px] text-slate-400 font-mono text-center">
        +50 XP за интервальное закрепление материала
      </div>
    </div>
  );
}

// 7. Cadence & Calendar Miniature
function MiniatureCalendarPreview() {
  return (
    <div className="w-full h-full flex flex-col justify-between py-1 text-left">
      {/* Streak Badge Header */}
      <div className="flex items-center justify-between bg-amber-50/70 border border-amber-200 rounded-xl p-2.5">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-amber-950">Стрик: 19 дней</div>
            <div className="text-[9px] text-amber-700 font-medium">Серия непрерывной практики</div>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-amber-900">+350 XP</span>
      </div>

      {/* GitHub-style Heatmap Grid */}
      <div className="my-2 bg-white border border-slate-200 rounded-xl p-2.5">
        <div className="text-[9px] font-mono text-slate-400 mb-1.5 uppercase">
          Активность за последние 4 недели:
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 28 }).map((_, i) => {
            const intensity = i > 23 ? 3 : i > 15 ? 2 : i % 3 === 0 ? 1 : i % 5 === 0 ? 0 : 2;
            const bgClass =
              intensity === 3
                ? 'bg-slate-900'
                : intensity === 2
                ? 'bg-slate-700'
                : intensity === 1
                ? 'bg-slate-300'
                : 'bg-slate-100';
            return <div key={i} className={`h-3 rounded-xs ${bgClass}`} />;
          })}
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono px-1">
        <span>Цель: 30 мин/день</span>
        <span className="text-emerald-600 font-bold">Выполнено 100%</span>
      </div>
    </div>
  );
}

// 8. Artifact Vault Miniature
function MiniatureVaultPreview() {
  return (
    <div className="w-full h-full flex flex-col justify-between py-1 text-left">
      <div className="flex items-center justify-between border-b border-slate-200 pb-1 text-[10px]">
        <span className="font-bold text-slate-900">Портфолио артефактов</span>
        <span className="font-mono text-slate-400">4 проекта готово</span>
      </div>

      {/* Project Card 1 */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 my-1 flex items-center justify-between shadow-2xs">
        <div className="flex items-center space-x-2 truncate">
          <FileText className="w-4 h-4 text-sky-600 shrink-0" />
          <div className="truncate">
            <div className="text-[10px] font-bold text-slate-900 truncate">
              Financial_Model_Q3.xlsx
            </div>
            <div className="text-[8px] text-slate-500">Сводные таблицы + XLOOKUP</div>
          </div>
        </div>
        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
          Сдано
        </span>
      </div>

      {/* Project Card 2 */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 my-1 flex items-center justify-between shadow-2xs">
        <div className="flex items-center space-x-2 truncate">
          <Palette className="w-4 h-4 text-purple-600 shrink-0" />
          <div className="truncate">
            <div className="text-[10px] font-bold text-slate-900 truncate">
              Design_System_Spec.fig
            </div>
            <div className="text-[8px] text-slate-500">Компоненты + UI Kit 8pt</div>
          </div>
        </div>
        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
          Сдано
        </span>
      </div>

      {/* Verification Stamp */}
      <div className="bg-slate-900 text-white rounded-xl p-1.5 flex items-center justify-center space-x-1.5 text-[9px] font-mono">
        <Award className="w-3 h-3 text-amber-400" />
        <span>Верифицировано криптографической подписью OS</span>
      </div>
    </div>
  );
}
