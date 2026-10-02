import React from 'react';
import { 
  Monitor,
  Network, 
  Atom,
  GitBranch,
  BookOpen,
  GraduationCap,
  Calendar,
  Tv, 
  Bot, 
  Users, 
  PenTool,
  LayoutGrid, 
  Award, 
  ShieldCheck, 
  Sliders, 
  Sparkles 
} from 'lucide-react';
import { WindowId, WindowState } from '../../types.ts';

interface DockProps {
  windows: Record<WindowId, WindowState>;
  onToggleWindow: (id: WindowId) => void;
  activeWindowId: WindowId | null;
}

interface DockItem {
  id: WindowId;
  label: string;
  icon: React.ReactNode;
  accent: string;
}

export const Dock: React.FC<DockProps> = ({ windows, onToggleWindow, activeWindowId }) => {
  const items: DockItem[] = [
    {
      id: 'desktop',
      label: 'Рабочий стол с виджетами',
      icon: <Monitor className="w-5 h-5" />,
      accent: '',
    },
    {
      id: 'dag',
      label: 'План обучения (DAG Граф)',
      icon: <Network className="w-5 h-5" />,
      accent: '',
    },
    {
      id: 'knowledge_sphere',
      label: 'Сфера знаний 3D',
      icon: <Atom className="w-5 h-5 text-sky-500 animate-spin-slow" />,
      accent: '',
    },
    {
      id: 'knowledge_git',
      label: 'Git Репозиторий Знаний',
      icon: <GitBranch className="w-5 h-5 text-emerald-500" />,
      accent: '',
    },
    {
      id: 'textbook_library',
      label: 'Библиотека Учебников',
      icon: <BookOpen className="w-5 h-5 text-emerald-600" />,
      accent: '',
    },
    {
      id: 'survey',
      label: 'Входная диагностика & План',
      icon: <GraduationCap className="w-5 h-5 text-indigo-500" />,
      accent: '',
    },
    {
      id: 'calendar',
      label: 'Календарь & Расписание',
      icon: <Calendar className="w-5 h-5 text-sky-500" />,
      accent: '',
    },
    {
      id: 'focus',
      label: 'Активное окно фокуса (20/10/70)',
      icon: <Tv className="w-5 h-5" />,
      accent: '',
    },
    {
      id: 'chat',
      label: 'ИИ-Оператор системы',
      icon: <Bot className="w-5 h-5" />,
      accent: '',
    },
    {
      id: 'partner_search',
      label: 'Поиск напарника (P2P)',
      icon: <Users className="w-5 h-5" />,
      accent: '',
    },
    {
      id: 'peer',
      label: 'P2P Редактор & Whiteboard',
      icon: <Users className="w-5 h-5" />,
      accent: '',
    },
    {
      id: 'white_screen',
      label: 'Белый экран (White Screen)',
      icon: <PenTool className="w-5 h-5 text-rose-500" />,
      accent: '',
    },
    {
      id: 'widgets',
      label: 'Виджеты & Помодоро',
      icon: <LayoutGrid className="w-5 h-5" />,
      accent: '',
    },
    {
      id: 'portfolio',
      label: 'Портфолио артефактов',
      icon: <Award className="w-5 h-5" />,
      accent: '',
    },
    {
      id: 'admin',
      label: 'Админ-консоль и модерация',
      icon: <ShieldCheck className="w-5 h-5" />,
      accent: '',
    },
  ];

  return (
    <div 
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 select-none pt-6 pb-2.5 px-8 group flex flex-col items-center cursor-pointer"
      aria-label="Нижняя панель Dock (наведите для раскрытия)"
    >
      {/* Thin Collapsed Strip (Visible by default, fades out on hover) */}
      <div className="w-32 h-1.5 rounded-full bg-slate-900/60 dark:bg-white/60 backdrop-blur-xl border border-white/30 shadow-md transition-all duration-300 ease-out group-hover:opacity-0 group-hover:h-0 group-hover:scale-x-50 pointer-events-none" />

      {/* Full Expanded Dock (Slides up smoothly on mouse hover) */}
      <div className="transform translate-y-5 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-300 ease-out pointer-events-none group-hover:pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl px-2.5 py-1.5 flex items-center space-x-1.5 border border-slate-200/90 dark:border-white/15 shadow-2xl ring-1 ring-slate-900/5">
        {items.map((item) => {
          const win = windows[item.id];
          const isOpen = win && win.isOpen;
          const isActive = activeWindowId === item.id;
          const isMinimized = win && win.isMinimized;

          return (
            <div key={item.id} className="group/item relative flex flex-col items-center">
              {/* Tooltip */}
              <div className="absolute -top-9 scale-0 group-hover/item:scale-100 transition-transform origin-bottom duration-150 pointer-events-none z-50 whitespace-nowrap bg-slate-900 text-white text-[11px] font-medium px-2 py-0.5 rounded shadow-sm">
                {item.label}
              </div>

              <button
                id={`dock-item-${item.id}`}
                data-tab={item.id}
                data-window-id={item.id}
                onClick={() => onToggleWindow(item.id)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {item.icon}
              </button>

              {/* Status Dot */}
              <div className="h-1 flex items-center justify-center mt-0.5">
                {isOpen && (
                  <span
                    className={`w-1 h-1 rounded-full transition-all ${
                      isMinimized 
                        ? 'bg-amber-500' 
                        : isActive 
                        ? 'bg-slate-900' 
                        : 'bg-slate-400'
                    }`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
