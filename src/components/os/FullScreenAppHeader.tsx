import React, { useEffect } from 'react';
import { 
  X, 
  Minus, 
  Minimize2, 
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
  Search, 
  Monitor,
  ExternalLink
} from 'lucide-react';
import { playChime } from '../../utils/audio.ts';

interface FullScreenAppHeaderProps {
  activeTab: string;
  onClose: () => void;
  onRestoreToWindow?: () => void;
}

const APP_METADATA: Record<string, { label: string; icon: any; color: string }> = {
  dag: { label: 'DAG-Граф Знаний', icon: Network, color: 'text-[#1A73E8]' },
  knowledge_sphere: { label: 'Сфера знаний 3D', icon: Atom, color: 'text-[#1A73E8]' },
  knowledge_git: { label: 'Git Репозиторий Знаний', icon: GitBranch, color: 'text-[#1E8E3E]' },
  calendar: { label: 'Календарь & Расписание уроков', icon: Calendar, color: 'text-[#1A73E8]' },
  focus: { label: 'Фокус-Студия обучения', icon: Tv, color: 'text-[#EA4335]' },
  peer: { label: 'P2P Напарник & Whiteboard', icon: Users, color: 'text-[#1E8E3E]' },
  chat: { label: 'ИИ-Оператор курса', icon: Bot, color: 'text-[#F9AB00]' },
  white_screen: { label: 'Белый экран (White Screen)', icon: PenTool, color: 'text-[#1A73E8]' },
  portfolio: { label: 'Портфолио артефактов', icon: Award, color: 'text-[#F9AB00]' },
  widgets: { label: 'Виджеты & Оперативные задачи', icon: LayoutGrid, color: 'text-[#1A73E8]' },
  partner_search: { label: 'Поиск напарника (P2P Matchmaking)', icon: Search, color: 'text-[#1A73E8]' },
  admin: { label: 'Контроль качества & Модерация', icon: ShieldCheck, color: 'text-[#1A73E8]' },
};

export const FullScreenAppHeader: React.FC<FullScreenAppHeaderProps> = ({
  activeTab,
  onClose,
  onRestoreToWindow,
}) => {
  const meta = APP_METADATA[activeTab] || { label: 'Приложение', icon: Monitor, color: 'text-[#1A73E8]' };
  const Icon = meta.icon;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      
      if (e.key === 'Escape' && !isInput) {
        e.preventDefault();
        playChime('click');
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleClose = () => {
    playChime('click');
    onClose();
  };

  const handleRestore = () => {
    playChime('click');
    if (onRestoreToWindow) {
      onRestoreToWindow();
    } else {
      onClose();
    }
  };

  return (
    <div className="h-11 px-4 bg-white text-[#202124] border-b border-[#DADCE0] flex items-center justify-between shrink-0 select-none z-30 shadow-none">
      {/* Left: Google App Info */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <Icon className={`w-4 h-4 ${meta.color}`} />
          <span className="font-medium text-xs text-[#202124] tracking-tight">{meta.label}</span>
          <span className="text-[#BDC1C6]">·</span>
          <span className="text-[11px] text-[#5F6368]">
            Полноэкранный режим
          </span>
        </div>
      </div>

      {/* Right: Minimal Google Action Controls */}
      <div className="flex items-center space-x-2">
        <span className="text-[11px] text-[#5F6368] hidden sm:inline-flex items-center space-x-1">
          <span>Нажмите</span>
          <kbd className="px-1.5 py-0.5 rounded bg-[#F1F3F4] text-[#3C4043] font-mono text-[10px] border border-[#DADCE0]">Esc</kbd>
          <span>для выхода</span>
        </span>

        {onRestoreToWindow && (
          <button
            type="button"
            id="fullscreen-restore-window-btn"
            onClick={handleRestore}
            className="px-3 py-1 rounded-full text-xs font-medium text-[#3C4043] hover:text-[#202124] hover:bg-[#F1F3F4] border border-[#DADCE0] transition flex items-center space-x-1.5 cursor-pointer"
            title="Свернуть в плавающее окно на рабочем столе"
          >
            <Minimize2 className="w-3.5 h-3.5 text-[#5F6368]" />
            <span className="hidden md:inline">Оконный режим</span>
          </button>
        )}

        <button
          type="button"
          id="fullscreen-close-btn"
          onClick={handleClose}
          className="px-3 py-1 rounded-full text-xs font-medium text-[#D93025] hover:bg-[#FCE8E6] transition flex items-center space-x-1.5 cursor-pointer"
          title="Закрыть приложение и вернуться на рабочий стол (Esc)"
        >
          <X className="w-3.5 h-3.5" />
          <span>Закрыть</span>
        </button>
      </div>
    </div>
  );
};
