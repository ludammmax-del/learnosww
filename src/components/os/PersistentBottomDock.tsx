import React from 'react';
import { 
  Monitor, 
  Network, 
  Atom, 
  GitBranch,
  Calendar, 
  Tv, 
  Users, 
  Bot, 
  PenTool, 
  Award, 
  LayoutGrid, 
  ShieldCheck,
  BookOpen,
  GraduationCap,
  X
} from 'lucide-react';
import { playChime } from '../../utils/audio.ts';

interface PersistentBottomDockProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onCloseToDesktop: () => void;
}

const DOCK_APPS = [
  { id: 'desktop', label: 'Рабочий стол', icon: Monitor },
  { id: 'dag', label: 'DAG-Граф', icon: Network },
  { id: 'knowledge_sphere', label: 'Сфера знаний 3D', icon: Atom },
  { id: 'knowledge_git', label: 'Git Знаний', icon: GitBranch },
  { id: 'textbook_library', label: 'Учебники & Кванты', icon: BookOpen },
  { id: 'survey', label: 'Диагностика & План', icon: GraduationCap },
  { id: 'calendar', label: 'Календарь', icon: Calendar },
  { id: 'focus', label: 'Фокус-Студия', icon: Tv },
  { id: 'peer', label: 'P2P Напарник', icon: Users },
  { id: 'chat', label: 'ИИ-Оператор', icon: Bot },
  { id: 'white_screen', label: 'Белый экран', icon: PenTool },
  { id: 'portfolio', label: 'Портфолио', icon: Award },
  { id: 'widgets', label: 'Виджеты & Задачи', icon: LayoutGrid },
  { id: 'admin', label: 'Модерация & Магазин', icon: ShieldCheck },
];

export const PersistentBottomDock: React.FC<PersistentBottomDockProps> = ({
  activeTab,
  onSelectTab,
  onCloseToDesktop,
}) => {
  return (
    <div 
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 select-none pt-4 pb-2 px-6 group flex flex-col items-center cursor-pointer"
      aria-label="Нижняя панель приложений Google OS (наведите для раскрытия)"
    >
      {/* Google-style subtle collapsed handle */}
      <div className="w-24 h-1 rounded-full bg-[#BDC1C6] transition-all duration-200 ease-out group-hover:opacity-0 group-hover:h-0 group-hover:scale-x-50 pointer-events-none" />

      {/* Google Material 3 / ChromeOS Shelf Navigation Bar */}
      <nav 
        className="transform translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-200 ease-out pointer-events-none group-hover:pointer-events-auto px-2.5 py-1.5 rounded-2xl bg-white border border-[#DADCE0] shadow-[0_2px_6px_2px_rgba(60,64,67,0.15)] flex items-center space-x-1"
        aria-label="Панель приложений"
      >
        {DOCK_APPS.map((app) => {
          const isSelected = activeTab === app.id;
          const Icon = app.icon;

          return (
            <button
              key={app.id}
              type="button"
              id={`fullscreen-dock-${app.id}`}
              onClick={() => {
                playChime('click');
                if (app.id === 'desktop') {
                  onCloseToDesktop();
                } else {
                  onSelectTab(app.id);
                }
              }}
              className={`desktop-dock-item relative p-2 rounded-xl flex items-center justify-center transition cursor-pointer group/item ${
                isSelected
                  ? 'bg-[#E8F0FE] text-[#1A73E8]'
                  : 'text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4]'
              }`}
              title={`${app.label} ${app.id === 'desktop' ? '(Вернуться на рабочий стол)' : ''}`}
            >
              <Icon className="w-4 h-4" />
              {isSelected && (
                <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[#1A73E8]" />
              )}
            </button>
          );
        })}

        <div className="h-4 w-px bg-[#DADCE0] mx-1" />

        {/* Quick Close to Desktop Button */}
        <button
          type="button"
          id="dock-quick-close-btn"
          onClick={() => {
            playChime('click');
            onCloseToDesktop();
          }}
          className="p-1.5 rounded-xl text-[#5F6368] hover:text-[#D93025] hover:bg-[#FCE8E6] transition cursor-pointer flex items-center space-x-1"
          title="Закрыть полноэкранный режим и вернуться на рабочий стол (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
};
