import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Plus, 
  Check, 
  RotateCcw, 
  Trash2, 
  Clock, 
  Pin, 
  CheckSquare, 
  Activity, 
  Bot, 
  Flame, 
  Tv, 
  Award, 
  Volume2, 
  Calendar, 
  Calculator, 
  Bookmark, 
  Layers
} from 'lucide-react';
import { DesktopWidgetType, DesktopWidgetInstance } from '../../types.ts';
import { playChime } from '../../utils/audio.ts';

interface WidgetCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeWidgets: DesktopWidgetInstance[];
  onAddWidget: (type: DesktopWidgetType) => void;
  onResetToDefaults: () => void;
  onClearAll: () => void;
}

interface WidgetCatalogItem {
  type: DesktopWidgetType;
  title: string;
  category: 'productivity' | 'system' | 'learning' | 'media';
  categoryLabel: string;
  description: string;
  icon: React.ReactNode;
  defaultSize: string;
  accent: string;
  allowMultiple?: boolean;
}

const CATALOG_ITEMS: WidgetCatalogItem[] = [
  {
    type: 'pomodoro',
    title: 'Фокус-Таймер (Помодоро)',
    category: 'productivity',
    categoryLabel: 'Продуктивность',
    description: 'Интервальный таймер 25/50 минут с начислением +500 XP за глубокую концентрацию.',
    icon: <Clock className="w-5 h-5 text-sky-500" />,
    defaultSize: '280 × 200 px',
    accent: 'border-sky-200',
  },
  {
    type: 'sticky_note',
    title: 'Быстрая заметка (Стикер)',
    category: 'productivity',
    categoryLabel: 'Продуктивность',
    description: 'Цветной стикер прямо на рабочем столе с автосохранением и сменой палитры.',
    icon: <Pin className="w-5 h-5 text-amber-500" />,
    defaultSize: '270 × 190 px',
    accent: 'border-amber-200',
    allowMultiple: true,
  },
  {
    type: 'task_list',
    title: 'Оперативные задачи',
    category: 'productivity',
    categoryLabel: 'Продуктивность',
    description: 'Интерактивный список дел со счетчиком прогресса и быстрым вводом через Enter.',
    icon: <CheckSquare className="w-5 h-5 text-emerald-500" />,
    defaultSize: '290 × 220 px',
    accent: 'border-emerald-200',
  },
  {
    type: 'system_monitor',
    title: 'Системный монитор OS',
    category: 'system',
    categoryLabel: 'Система',
    description: 'Метрики CPU, памяти, статуса синхронизации Firestore, сетевого пинга и P2P пиров.',
    icon: <Activity className="w-5 h-5 text-emerald-500" />,
    defaultSize: '290 × 210 px',
    accent: 'border-emerald-200',
  },
  {
    type: 'ai_insight',
    title: 'ИИ-Совет по блоку',
    category: 'learning',
    categoryLabel: 'Обучение',
    description: 'Архитектурные советы и стратегические рекомендации ИИ на основе блока тем, который вы сейчас проходите.',
    icon: <Bot className="w-5 h-5 text-indigo-500" />,
    defaultSize: '305 × 220 px',
    accent: 'border-indigo-200',
  },
  {
    type: 'habits',
    title: 'Стрики & Привычки',
    category: 'productivity',
    categoryLabel: 'Продуктивность',
    description: 'Трекер ежедневных инженерных привычек: LeetCode, чтение RFC, профилирование памяти.',
    icon: <Flame className="w-5 h-5 text-amber-500" />,
    defaultSize: '280 × 210 px',
    accent: 'border-amber-200',
  },
  {
    type: 'current_unit',
    title: 'Текущий модуль DAG',
    category: 'learning',
    categoryLabel: 'Обучение',
    description: 'Быстрый доступ к активному уроку дорожной карты со статусом и таймингом.',
    icon: <Tv className="w-5 h-5 text-sky-500" />,
    defaultSize: '280 × 180 px',
    accent: 'border-sky-200',
  },
  {
    type: 'karma_progress',
    title: 'Карма & Инженерный Уровень',
    category: 'learning',
    categoryLabel: 'Обучение',
    description: 'Шкала опыта XP, ранг архитектора и визуализация прогресса до следующего уровня.',
    icon: <Award className="w-5 h-5 text-amber-500" />,
    defaultSize: '270 × 170 px',
    accent: 'border-amber-200',
  },
  {
    type: 'ambient_audio',
    title: 'Звуковой фон концентрации',
    category: 'media',
    categoryLabel: 'Медиа & Звук',
    description: 'Встроенный звуковой генератор (Шум дождя, Brown Noise, 40Hz Gamma Focus, Space Drone).',
    icon: <Volume2 className="w-5 h-5 text-indigo-500" />,
    defaultSize: '300 × 200 px',
    accent: 'border-indigo-200',
  },
  {
    type: 'clock_calendar',
    title: 'Время & Календарь',
    category: 'system',
    categoryLabel: 'Система',
    description: 'Секундные часы с датой и мини-календарной сеткой на текущий месяц.',
    icon: <Calendar className="w-5 h-5 text-sky-500" />,
    defaultSize: '270 × 190 px',
    accent: 'border-sky-200',
  },
  {
    type: 'byte_converter',
    title: 'Конвертер памяти & страниц',
    category: 'system',
    categoryLabel: 'Система',
    description: 'Инженерный расчет размеров байт, КБ, МБ, страниц PostgreSQL (8KB) и OS (4KB).',
    icon: <Calculator className="w-5 h-5 text-indigo-500" />,
    defaultSize: '280 × 210 px',
    accent: 'border-indigo-200',
  },
  {
    type: 'quick_links',
    title: 'Инженерная библиотека ссылок',
    category: 'learning',
    categoryLabel: 'Обучение',
    description: 'Закладки на внутренности PostgreSQL, System Design Primer и профилирование ядра Linux.',
    icon: <Bookmark className="w-5 h-5 text-sky-500" />,
    defaultSize: '290 × 210 px',
    accent: 'border-sky-200',
  },
  {
    type: 'memory_retention',
    title: 'Память Эббингауза & Блиц',
    category: 'learning',
    categoryLabel: 'Обучение',
    description: 'Мониторинг кривой забывания тем, тепловая шкала свежести знаний и 2-минутный экспресс-блиц.',
    icon: <Flame className="w-5 h-5 text-amber-500" />,
    defaultSize: '300 × 230 px',
    accent: 'border-amber-200',
  },
];

export const WidgetCatalogModal: React.FC<WidgetCatalogModalProps> = ({
  isOpen,
  onClose,
  activeWidgets,
  onAddWidget,
  onResetToDefaults,
  onClearAll,
}) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'Все виджеты' },
    { id: 'productivity', label: 'Продуктивность' },
    { id: 'system', label: 'Системные' },
    { id: 'learning', label: 'Обучение' },
    { id: 'media', label: 'Звук & Медиа' },
  ];

  const filtered = CATALOG_ITEMS.filter((item) => {
    const matchesCategory = category === 'all' || item.category === category;
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getWidgetCount = (type: DesktopWidgetType) => {
    return activeWidgets.filter((w) => w.type === type).length;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 select-none animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-lg border border-[#DADCE0] overflow-hidden text-[#202124]">
        {/* Modal Header */}
        <div className="h-14 px-6 border-b border-[#DADCE0] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#E8F0FE] text-[#1A73E8] rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium text-sm text-[#202124] leading-tight">Каталог виджетов</h3>
              <p className="text-[11px] text-[#5F6368] leading-tight">
                Выберите и разместите виджеты на рабочем столе
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                onResetToDefaults();
                playChime('click');
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-[#DADCE0] text-[#3C4043] hover:text-[#202124] hover:bg-[#F1F3F4] transition text-xs font-medium cursor-pointer"
              title="Восстановить стандартный набор виджетов"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>По умолчанию</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClearAll();
                playChime('click');
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[#D93025] hover:bg-[#FCE8E6] transition text-xs font-medium cursor-pointer"
              title="Убрать все виджеты с рабочего стола"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Очистить стол</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] transition cursor-pointer"
              title="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="px-6 py-3 border-b border-[#DADCE0] bg-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
          {/* Category Tabs */}
          <div className="flex items-center p-1 bg-[#F1F3F4] rounded-full space-x-1 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                  category === cat.id
                    ? 'bg-white text-[#1A73E8] shadow-xs'
                    : 'text-[#5F6368] hover:text-[#202124]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box (Google Search Style) */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-[#5F6368] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск виджетов..."
              className="w-full bg-[#F1F3F4] border border-transparent rounded-full pl-9 pr-3 py-1.5 text-xs outline-hidden focus:border-[#1A73E8] focus:bg-white text-[#202124] placeholder:text-[#5F6368] transition"
            />
          </div>
        </div>

        {/* Widgets Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F8F9FA]">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => {
              const count = getWidgetCount(item.type);
              const isAdded = count > 0;

              return (
                <div
                  key={item.type}
                  className="bg-white rounded-xl p-4 border border-[#DADCE0] shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between mb-2.5">
                      <div className="p-2 rounded-xl bg-[#F8F9FA] border border-[#DADCE0]">
                        {item.icon}
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#5F6368] font-mono block">
                          {item.defaultSize}
                        </span>
                        {isAdded && (
                          <span className="text-[10px] text-[#1E8E3E] font-medium flex items-center justify-end space-x-1 mt-0.5">
                            <Check className="w-3 h-3" />
                            <span>На столе ({count})</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="font-medium text-[#202124] text-xs mb-1 group-hover:text-[#1A73E8] transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-[#5F6368] leading-relaxed mb-3">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#DADCE0] flex items-center justify-between">
                    <span className="text-[10px] text-[#5F6368] font-medium">
                      {item.categoryLabel}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        onAddWidget(item.type);
                        playChime('click');
                      }}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer shadow-none ${
                        isAdded && !item.allowMultiple
                          ? 'bg-[#F1F3F4] hover:bg-[#E8EAED] text-[#3C4043]'
                          : 'bg-[#1A73E8] hover:bg-[#1967D2] text-white'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAdded && item.allowMultiple ? '+ Еще один' : isAdded ? 'Добавить еще' : 'На стол'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="h-12 px-6 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            Виджетов на рабочем столе: <strong className="text-slate-900">{activeWidgets.length}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition cursor-pointer text-xs"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
