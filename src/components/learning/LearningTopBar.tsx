import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Clock, 
  LogOut, 
  Cloud, 
  Sun, 
  Moon, 
  Plus, 
  Users, 
  Video,
  PenTool,
  Image as ImageIcon,
  Sparkles,
  Sliders,
  Lock,
  X,
  Smartphone,
} from 'lucide-react';
import { peerCollabSync } from '../../services/peerCollabSync.ts';
import { telemetryEngine } from '../../services/telemetryEngine.ts';
import { LoFiAudioWidget } from '../os/LoFiAudioWidget.tsx';

interface LearningTopBarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCreateNode: () => void;
  onOpenSpotlight: () => void;
  wallpaperTheme: 'bitrix_flora' | 'studio_slate';
  onToggleWallpaperTheme: () => void;
  onOpenWallpaperGallery?: () => void;
  karma: number;
  pomodoroMinutes: number;
  pomodoroSecondsLeft?: number;
  isPomodoroRunning: boolean;
  onTogglePomodoro: () => void;
  user?: { displayName: string; email: string; photoURL?: string } | null;
  onLogout?: () => void;
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncTime?: Date | null;
  isCollabCursorsEnabled?: boolean;
  onToggleCollabCursors?: () => void;
  activeCallPartner?: { name: string } | null;
  onOpenCall?: () => void;
  onOpenPartnerSearch?: () => void;
  onTriggerSessionSplash?: () => void;
  onOpenPersonalization?: () => void;
  onLockScreen?: () => void;
  onOpenLanding?: () => void;
  isMobileMode?: boolean;
  onToggleMobileMode?: () => void;
}

export const LearningTopBar: React.FC<LearningTopBarProps> = ({
  activeTab,
  onSelectTab,
  onOpenCreateNode,
  onOpenSpotlight,
  wallpaperTheme,
  onToggleWallpaperTheme,
  onOpenWallpaperGallery,
  isMobileMode,
  onToggleMobileMode,
  pomodoroMinutes,
  pomodoroSecondsLeft,
  isPomodoroRunning,
  onTogglePomodoro,
  user,
  onLogout,
  syncStatus = 'synced',
  lastSyncTime,
  isCollabCursorsEnabled = true,
  onToggleCollabCursors,
  activeCallPartner,
  onOpenCall,
  onOpenPartnerSearch,
  onTriggerSessionSplash,
  onOpenPersonalization,
  onLockScreen,
  onOpenLanding,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [onlinePeersCount, setOnlinePeersCount] = useState<number>(() => peerCollabSync.getConnectedPeersCount());
  const [telemetry, setTelemetry] = useState(() => telemetryEngine.getState());

  useEffect(() => {
    return telemetryEngine.subscribe((s) => setTelemetry(s));
  }, []);

  useEffect(() => {
    const unsub = peerCollabSync.subscribeCursors(() => {
      setOnlinePeersCount(peerCollabSync.getConnectedPeersCount());
    });
    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  const formattedPomodoro = pomodoroSecondsLeft !== undefined
    ? `${String(Math.floor(pomodoroSecondsLeft / 60)).padStart(2, '0')}:${String(
        pomodoroSecondsLeft % 60
      ).padStart(2, '0')}`
    : `${pomodoroMinutes}:00`;

  return (
    <header className="fixed top-0 left-0 right-0 h-12 z-50 flex items-center justify-between px-4 text-xs select-none bg-white border-b border-[#DADCE0] text-[#202124] transition-colors shadow-[0_1px_2px_0_rgba(60,64,67,0.08)]">
      {/* Zone 1: Wordmark Brand */}
      <div className="flex items-center space-x-3 shrink-0">
        <button
          type="button"
          id="topbar-brand-home"
          data-tab="desktop"
          onClick={() => onSelectTab('desktop')}
          className="flex items-center space-x-2 text-[#202124] hover:text-[#1A73E8] transition cursor-pointer group"
          title="Вернуться на рабочий стол"
        >
          <span className="font-semibold text-[15px] tracking-tight text-[#202124]">
            Learning<span className="text-[#1A73E8] font-bold ml-0.5">OS</span>
          </span>
          <span
            className={`w-2 h-2 rounded-full transition-colors ${
              syncStatus === 'syncing'
                ? 'bg-[#F9AB00] animate-pulse'
                : syncStatus === 'error'
                ? 'bg-[#D93025]'
                : 'bg-[#1E8E3E]'
            }`}
            title={
              syncStatus === 'syncing'
                ? 'Синхронизация Firestore...'
                : syncStatus === 'error'
                ? 'Офлайн (сохранено локально)'
                : `Firestore синхронизирована${lastSyncTime ? ': ' + lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}`
            }
          />
        </button>

        {activeTab !== 'desktop' && (
          <button
            type="button"
            id="topbar-exit-fullscreen-btn"
            onClick={() => onSelectTab('desktop')}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FCE8E6] hover:bg-[#FAD2CF] text-[#C5221F] border border-[#F5C2C7] text-[11px] font-medium transition cursor-pointer"
            title="Закрыть полноэкранный режим и вернуться на рабочий стол (Esc)"
          >
            <X className="w-3.5 h-3.5 text-[#C5221F]" />
            <span>На рабочий стол</span>
          </button>
        )}
      </div>

      {/* Zone 3: Essential Controls (Pomodoro + Search + User) */}
      <div className="flex items-center space-x-2 shrink-0">
        {/* Quick Add Topic */}
        <button
          type="button"
          onClick={onOpenCreateNode}
          className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[#3C4043] hover:text-[#202124] bg-[#F1F3F4] hover:bg-[#E8EAED] transition cursor-pointer"
          title="Добавить модуль в граф"
        >
          <Plus className="w-3.5 h-3.5 text-[#1A73E8]" />
          <span>Создать модуль</span>
        </button>

        {/* Global Spotlight Search (⌘K) */}
        <button
          type="button"
          onClick={onOpenSpotlight}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium text-[#5F6368] hover:text-[#202124] bg-[#F1F3F4] hover:bg-[#E8EAED] transition cursor-pointer"
          title="Быстрый поиск (⌘K)"
        >
          <Search className="w-3.5 h-3.5 text-[#5F6368]" />
          <span className="hidden sm:inline text-xs text-[#5F6368]">Поиск</span>
          <kbd className="text-[10px] text-[#80868B] font-mono px-1 py-0.5 rounded bg-white border border-[#DADCE0]">⌘K</kbd>
        </button>

        {/* Minimalist Pomodoro Focus Timer */}
        <button
          type="button"
          onClick={onTogglePomodoro}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
            isPomodoroRunning
              ? 'bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]'
              : 'bg-[#F1F3F4] hover:bg-[#E8EAED] text-[#3C4043]'
          }`}
          title="Таймер фокуса (старт/пауза)"
        >
          <Clock className={`w-3.5 h-3.5 ${isPomodoroRunning ? 'text-[#1E8E3E] animate-spin-slow' : 'text-[#5F6368]'}`} />
          <span className="font-mono tabular-nums text-xs font-semibold">{formattedPomodoro}</span>
        </button>

        {/* Real-time Multi-user Cursors & Shared Actions Toggle */}
        {onToggleCollabCursors && (
          <button
            type="button"
            onClick={onToggleCollabCursors}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
              isCollabCursorsEnabled
                ? 'bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC]'
                : 'bg-[#F1F3F4] hover:bg-[#E8EAED] text-[#5F6368]'
            }`}
            title="Синхронизация совместных кликов, действий и курсоров напарников"
          >
            <Users className={`w-3.5 h-3.5 ${isCollabCursorsEnabled ? 'text-[#1A73E8]' : 'text-[#5F6368]'}`} />
            <span className="hidden sm:inline">
              {isCollabCursorsEnabled
                ? onlinePeersCount > 0
                  ? `Команда: ${onlinePeersCount + 1}`
                  : 'Синхронизация'
                : 'Офлайн'}
            </span>
          </button>
        )}

        {/* Lo-Fi Background Music Controller */}
        <LoFiAudioWidget compact={true} theme="light" />

        {/* P2P Real Partner Search Button */}
        {onOpenPartnerSearch && (
          <button
            type="button"
            onClick={onOpenPartnerSearch}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#F1F3F4] hover:bg-[#E8EAED] text-[#3C4043] hover:text-[#202124] transition cursor-pointer"
            title="Открыть окно поиска напарника в реальной сети"
          >
            <Users className="w-3.5 h-3.5 text-[#5F6368]" />
            <span className="hidden lg:inline">Поиск напарника</span>
          </button>
        )}

        {/* Active Call Quick Expand Badge */}
        {activeCallPartner && onOpenCall && (
          <button
            type="button"
            onClick={onOpenCall}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6] hover:bg-[#CEEAD6] transition cursor-pointer"
            title="Открыть активный звонок"
          >
            <Video className="w-3.5 h-3.5 text-[#1E8E3E]" />
            <span className="hidden md:inline font-mono">Звонок ({activeCallPartner.name})</span>
          </button>
        )}

        {/* Test Welcome Splash Button */}
        {onTriggerSessionSplash && (
          <button
            type="button"
            onClick={onTriggerSessionSplash}
            className="p-1.5 rounded-full text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] transition cursor-pointer"
            title="Показать экран «Привет» (анимация входа)"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Re-run Personalization Button */}
        {onOpenPersonalization && (
          <button
            type="button"
            onClick={onOpenPersonalization}
            className="p-1.5 rounded-full text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] transition cursor-pointer"
            title="Давай персонализируем (фон, направления, напарник)"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Wallpaper Gallery Button */}
        {onOpenWallpaperGallery && (
          <button
            type="button"
            onClick={onOpenWallpaperGallery}
            className="p-1.5 rounded-full text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] transition cursor-pointer"
            title="Галерея обоев (установить фоном везде)"
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Lock Screen Button */}
        {onLockScreen && (
          <button
            type="button"
            id="btn-topbar-lock-screen"
            onClick={onLockScreen}
            className="p-1.5 rounded-full text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] transition cursor-pointer"
            title="Заблокировать экран (окно со временем и входом в систему)"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Mobile View Toggle (Classic blocks without Web OS windows) */}
        {onToggleMobileMode && (
          <button
            type="button"
            onClick={onToggleMobileMode}
            className={`p-1.5 rounded-full transition cursor-pointer ${
              isMobileMode
                ? 'text-[#1A73E8] bg-[#E8F0FE]'
                : 'text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4]'
            }`}
            title="Переключить на мобильный вид (классические блоки без окон Web OS)"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Presentation Landing Link */}
        {onOpenLanding && (
          <button
            type="button"
            onClick={onOpenLanding}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[#1A73E8] bg-[#E8F0FE] hover:bg-[#D2E3FC] transition cursor-pointer"
            title="Открыть презентацию платформы"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#1A73E8]" />
            <span className="hidden xl:inline">О платформе</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={onToggleWallpaperTheme}
          className="p-1.5 rounded-full text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] transition cursor-pointer"
          title="Сменить тему оформления"
        >
          {wallpaperTheme === 'studio_slate' ? (
            <Sun className="w-3.5 h-3.5" />
          ) : (
            <Moon className="w-3.5 h-3.5" />
          )}
        </button>

        {/* User Profile in Google Account style */}
        <div className="flex items-center space-x-2 pl-2 border-l border-[#DADCE0]">
          <div
            className="flex items-center space-x-2 p-1 rounded-full hover:bg-[#F1F3F4] transition cursor-pointer"
            title={user ? `${user.displayName} (${user.email})` : 'Аккаунт студента'}
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Пользователь'}
                className="w-6 h-6 rounded-full object-cover ring-1 ring-[#DADCE0]"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#1A73E8] text-white font-medium flex items-center justify-center text-[11px]">
                {user?.displayName ? user.displayName.substring(0, 1).toUpperCase() : 'U'}
              </div>
            )}

            {user && (
              <span className="text-xs text-[#202124] font-medium max-w-[80px] truncate hidden sm:inline">
                {(user.displayName || user.email || 'Студент').split(' ')[0]}
              </span>
            )}

            {onLogout && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLogout();
                }}
                className="text-[#5F6368] hover:text-[#D93025] transition cursor-pointer p-0.5"
                title="Выйти"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
