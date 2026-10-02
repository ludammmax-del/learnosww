import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Disc, 
  SkipForward, 
  SkipBack, 
  ListMusic, 
  Check, 
  Sparkles,
  ChevronDown,
  Music2
} from 'lucide-react';
import { lofiAudio, LOFI_PLAYLIST, LoFiTrack, LoFiEngineState } from '../../utils/lofiAudio.ts';
import { playChime } from '../../utils/audio.ts';

interface LoFiAudioWidgetProps {
  compact?: boolean;
  className?: string;
  theme?: 'dark' | 'light' | 'glass' | 'ivory';
}

export const LoFiAudioWidget: React.FC<LoFiAudioWidgetProps> = ({
  compact = false,
  className = '',
  theme = 'glass',
}) => {
  const [engineState, setEngineState] = useState<LoFiEngineState>(() => lofiAudio.getStatus());
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = lofiAudio.subscribe((state) => {
      setEngineState(state);
    });
    return () => unsubscribe();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowPlaylistMenu(false);
        setShowVolumeSlider(false);
      }
    };
    if (showPlaylistMenu || showVolumeSlider) {
      window.addEventListener('mousedown', handleOutsideClick);
    }
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [showPlaylistMenu, showVolumeSlider]);

  const handleToggle = () => {
    playChime('click');
    lofiAudio.toggle();
  };

  const handleNextTrack = (e: React.MouseEvent) => {
    e.stopPropagation();
    playChime('click');
    lofiAudio.nextTrack();
  };

  const handlePrevTrack = (e: React.MouseEvent) => {
    e.stopPropagation();
    playChime('click');
    lofiAudio.prevTrack();
  };

  const handleSelectTrack = (idx: number) => {
    playChime('click');
    lofiAudio.selectTrack(idx);
    setShowPlaylistMenu(false);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    lofiAudio.setVolume(val);
  };

  const isLight = theme === 'light';
  const isIvory = theme === 'ivory';
  const { isPlaying, volume, currentTrack, currentTrackIndex, totalTracks, currentChordName, trackProgressPercent } = engineState;

  const baseStyles = isLight
    ? 'bg-white text-[#202124] border-[#DADCE0] shadow-xs'
    : isIvory
    ? 'bg-[#FAF7F2] text-[#24211D] border-[#E5DCD0] shadow-xs'
    : theme === 'dark'
    ? 'bg-slate-900/90 text-slate-200 border-slate-700/60 shadow-md'
    : 'bg-slate-950/50 text-slate-100 border-white/10 backdrop-blur-md shadow-lg';

  if (compact) {
    return (
      <div 
        ref={menuRef}
        className={`relative flex items-center space-x-1.5 px-2.5 py-1 rounded-full border transition-all shrink-0 select-none ${baseStyles} ${className}`}
      >
        {/* Play/Pause & Vinyl Icon */}
        <button
          type="button"
          onClick={handleToggle}
          className="flex items-center space-x-1.5 cursor-pointer hover:opacity-80 transition"
          title={isPlaying ? 'Пауза (Lo-Fi фокус)' : 'Включить Lo-Fi плейлист'}
        >
          <div className="relative">
            <Disc 
              className={`w-4 h-4 ${isPlaying ? 'animate-spin' : ''}`}
              style={{ 
                color: currentTrack.color,
                animationDuration: `${Math.max(2, 60 / currentTrack.bpm * 4)}s` 
              }} 
            />
            {isPlaying && (
              <span 
                className="absolute inset-0 rounded-full animate-ping opacity-25"
                style={{ backgroundColor: currentTrack.color }}
              />
            )}
          </div>
        </button>

        {/* Previous Track */}
        <button
          type="button"
          onClick={handlePrevTrack}
          className={`p-1 rounded-full transition cursor-pointer ${
            isLight ? 'hover:bg-[#F1F3F4] text-[#5F6368] hover:text-[#202124]' : 'hover:bg-white/10 text-white/60 hover:text-white'
          }`}
          title="Предыдущий трек"
        >
          <SkipBack className="w-3 h-3" />
        </button>

        {/* Current Track Info & Playlist Dropdown Trigger */}
        <div 
          onClick={() => {
            setShowPlaylistMenu(!showPlaylistMenu);
            setShowVolumeSlider(false);
          }}
          className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-full cursor-pointer transition max-w-[150px] sm:max-w-[190px] ${
            isLight ? 'hover:bg-[#F1F3F4]' : 'hover:bg-white/10'
          }`}
          title="Выбрать трек из 5 Lo-Fi композиций"
        >
          <span className="text-[10px] font-mono font-bold opacity-60 shrink-0">
            {currentTrackIndex + 1}/{totalTracks}
          </span>
          <span className="text-xs font-medium tracking-tight truncate">
            {currentTrack.title}
          </span>
          {isPlaying && (
            <span 
              className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold shrink-0 hidden sm:inline"
              style={{ backgroundColor: `${currentTrack.color}25`, color: currentTrack.color }}
            >
              {currentChordName}
            </span>
          )}
          <ChevronDown className="w-2.5 h-2.5 opacity-40 shrink-0" />
        </div>

        {/* Next Track */}
        <button
          type="button"
          onClick={handleNextTrack}
          className={`p-1 rounded-full transition cursor-pointer ${
            isLight ? 'hover:bg-[#F1F3F4] text-[#5F6368] hover:text-[#202124]' : 'hover:bg-white/10 text-white/60 hover:text-white'
          }`}
          title="Следующий трек"
        >
          <SkipForward className="w-3 h-3" />
        </button>

        {/* Animated wave bars when playing */}
        {isPlaying && (
          <div className="flex items-end space-x-0.5 h-3 px-0.5 hidden xs:flex">
            <span className="w-0.5 rounded-full animate-pulse" style={{ height: '60%', animationDuration: '0.6s', backgroundColor: currentTrack.color }} />
            <span className="w-0.5 rounded-full animate-pulse" style={{ height: '100%', animationDuration: '0.9s', backgroundColor: currentTrack.color }} />
            <span className="w-0.5 rounded-full animate-pulse" style={{ height: '40%', animationDuration: '0.5s', backgroundColor: currentTrack.color }} />
          </div>
        )}

        {/* Volume toggle */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowVolumeSlider(!showVolumeSlider);
              setShowPlaylistMenu(false);
            }}
            className={`p-1 transition cursor-pointer rounded-full ${
              isLight ? 'hover:bg-[#F1F3F4] text-[#5F6368] hover:text-[#202124]' : isIvory ? 'text-[#7C746A] hover:text-[#24211D]' : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="Громкость"
          >
            {volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {showVolumeSlider && (
            <div className={`absolute top-full right-0 mt-2 p-2.5 rounded-xl border shadow-xl flex items-center space-x-2 z-50 animate-fade-in ${
              isLight ? 'bg-white border-[#DADCE0] text-[#202124]' : isIvory ? 'bg-[#FAF7F2] border-[#DDD3C4] text-[#24211D]' : 'bg-slate-900/95 border-white/15 text-slate-100 backdrop-blur-xl'
            }`}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 cursor-pointer h-1 rounded-lg appearance-none accent-[#1A73E8] bg-[#DADCE0]"
              />
              <span className="text-[10px] font-mono w-7 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Subtle Bottom Progress Bar for auto-cycling track progress */}
        {isPlaying && (
          <div className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full overflow-hidden pointer-events-none ${
            isLight ? 'bg-[#E8EAED]' : 'bg-white/10'
          }`}>
            <div 
              className="h-full transition-all duration-300 ease-linear"
              style={{ width: `${trackProgressPercent}%`, backgroundColor: currentTrack.color }}
            />
          </div>
        )}

        {/* 5-TRACK PLAYLIST DROPDOWN MENU */}
        {showPlaylistMenu && (
          <div className={`absolute top-full left-0 mt-2 w-72 border rounded-xl shadow-xl p-2 z-50 text-xs select-none animate-fade-in ${
            isLight ? 'bg-white border-[#DADCE0] text-[#202124]' : 'bg-slate-900/95 backdrop-blur-2xl border-white/15 text-white'
          }`}>
            <div className={`px-2.5 py-1.5 flex items-center justify-between border-b mb-1 ${
              isLight ? 'border-[#F1F3F4]' : 'border-white/10'
            }`}>
              <span className={`text-[11px] uppercase font-bold tracking-wider flex items-center space-x-1.5 ${
                isLight ? 'text-[#5F6368]' : 'text-slate-400'
              }`}>
                <ListMusic className="w-3.5 h-3.5 text-[#1A73E8]" />
                <span>Lo-Fi Плейлист (5 треков)</span>
              </span>
              <span className={`text-[10px] font-mono ${isLight ? 'text-[#80868B]' : 'text-slate-400'}`}>Авто-ротация</span>
            </div>

            <div className="space-y-1">
              {LOFI_PLAYLIST.map((track, idx) => {
                const isSelected = currentTrackIndex === idx;
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => handleSelectTrack(idx)}
                    className={`w-full text-left p-2 rounded-lg transition cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? isLight ? 'bg-[#E8F0FE] text-[#1A73E8] border border-[#1A73E8]/30 font-medium' : 'bg-white/15 border border-white/20 shadow-xs'
                        : isLight ? 'hover:bg-[#F1F3F4] text-[#202124] border border-transparent' : 'hover:bg-white/10 text-slate-300 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div 
                        className="w-6 h-6 rounded-md flex items-center justify-center font-mono text-[11px] font-bold shrink-0 shadow-2xs"
                        style={{ backgroundColor: `${track.color}25`, color: track.color }}
                      >
                        {isSelected && isPlaying ? (
                          <Disc className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <span>0{track.number}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className={`font-semibold text-xs truncate ${isSelected ? isLight ? 'text-[#1A73E8]' : 'text-white' : isLight ? 'text-[#202124]' : 'text-slate-200'}`}>
                          {track.title}
                        </div>
                        <div className={`text-[10px] truncate ${isLight ? 'text-[#5F6368]' : 'text-slate-400'}`}>
                          {track.genre} · {track.bpm} BPM
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex items-center space-x-1 shrink-0">
                        <span className={`text-[10px] font-mono ${isLight ? 'text-[#1A73E8]' : 'text-emerald-400'}`}>
                          {trackProgressPercent}%
                        </span>
                        <Check className={`w-3.5 h-3.5 ${isLight ? 'text-[#1A73E8]' : 'text-emerald-400'}`} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className={`pt-2 mt-1 border-t px-2 flex items-center justify-between text-[10px] ${
              isLight ? 'border-[#F1F3F4] text-[#5F6368]' : 'border-white/10 text-slate-400'
            }`}>
              <span>Синтез: Web Audio API</span>
              <span className={`font-medium ${isLight ? 'text-[#1E8E3E]' : 'text-emerald-400'}`}>Бесконечный цикл</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Standard Expanded Widget
  return (
    <div 
      ref={menuRef}
      className={`relative flex flex-col p-3.5 rounded-xl border transition-all shrink-0 select-none ${baseStyles} ${className}`}
    >
      {/* Header with Title & Playlist toggle */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Music2 className={`w-4 h-4 ${isLight ? 'text-[#1A73E8]' : 'text-emerald-400'}`} />
          <span className="text-xs font-semibold tracking-tight">Lo-Fi Радио фокуса</span>
        </div>
        <button
          type="button"
          onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
          className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono transition cursor-pointer flex items-center space-x-1 ${
            isLight ? 'bg-[#F1F3F4] hover:bg-[#E8EAED] text-[#3C4043]' : 'bg-white/10 hover:bg-white/20 text-slate-300'
          }`}
        >
          <span>Трек {currentTrackIndex + 1}/5</span>
          <ChevronDown className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* Main Track Card */}
      <div className={`flex items-center justify-between p-2.5 rounded-lg mb-2.5 ${
        isLight ? 'bg-[#F8F9FA] border border-[#DADCE0]' : 'bg-black/20 border border-white/10'
      }`}>
        <div className="flex items-center space-x-3 min-w-0">
          <div 
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-xs"
            style={{ backgroundColor: `${currentTrack.color}25`, color: currentTrack.color }}
          >
            <Disc className={`w-5 h-5 ${isPlaying ? 'animate-spin' : ''}`} />
          </div>
          <div className="min-w-0">
            <div className={`font-semibold text-xs truncate ${isLight ? 'text-[#202124]' : 'text-white'}`}>
              {currentTrack.title}
            </div>
            <div className={`text-[11px] truncate ${isLight ? 'text-[#5F6368]' : 'text-slate-400'}`}>
              {currentTrack.genre}
            </div>
          </div>
        </div>

        {isPlaying && (
          <span 
            className="text-[10px] px-2 py-0.5 rounded font-mono font-bold shrink-0"
            style={{ backgroundColor: `${currentTrack.color}25`, color: currentTrack.color }}
          >
            {currentChordName}
          </span>
        )}
      </div>

      {/* Progress Bar for Auto-Cycling */}
      <div className={`w-full h-1 rounded-full overflow-hidden mb-3 ${isLight ? 'bg-[#E8EAED]' : 'bg-white/10'}`}>
        <div 
          className="h-full transition-all duration-300 ease-linear rounded-full"
          style={{ width: `${trackProgressPercent}%`, backgroundColor: currentTrack.color }}
        />
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={handlePrevTrack}
            className={`p-1.5 rounded-full transition cursor-pointer ${
              isLight ? 'hover:bg-[#F1F3F4] text-[#5F6368] hover:text-[#202124]' : 'hover:bg-white/10 text-slate-300 hover:text-white'
            }`}
            title="Предыдущий трек"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleToggle}
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition shadow-xs cursor-pointer ${
              isLight ? 'bg-[#1A73E8] hover:bg-[#1765CC] text-white' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
            }`}
            title={isPlaying ? 'Пауза' : 'Воспроизведение'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={handleNextTrack}
            className={`p-1.5 rounded-full transition cursor-pointer ${
              isLight ? 'hover:bg-[#F1F3F4] text-[#5F6368] hover:text-[#202124]' : 'hover:bg-white/10 text-slate-300 hover:text-white'
            }`}
            title="Следующий трек"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => setShowVolumeSlider(!showVolumeSlider)}
            className={`p-1 rounded-full cursor-pointer ${
              isLight ? 'text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4]' : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className={`w-16 cursor-pointer h-1 rounded-lg appearance-none ${
              isLight ? 'accent-[#1A73E8] bg-[#DADCE0]' : 'accent-emerald-400 bg-white/20'
            }`}
          />
        </div>
      </div>

      {/* 5-Track Playlist Popup */}
      {showPlaylistMenu && (
        <div className={`absolute top-full left-0 right-0 mt-2 border rounded-xl shadow-xl p-2 z-50 text-xs animate-fade-in ${
          isLight ? 'bg-white border-[#DADCE0] text-[#202124]' : 'bg-slate-900/95 backdrop-blur-2xl border-white/15 text-white'
        }`}>
          <div className={`px-2 py-1 text-[11px] font-bold uppercase tracking-wider border-b mb-1 ${
            isLight ? 'border-[#F1F3F4] text-[#5F6368]' : 'border-white/10 text-slate-400'
          }`}>
            Плейлист (Автоматическое переключение)
          </div>
          <div className="space-y-1">
            {LOFI_PLAYLIST.map((track, idx) => (
              <button
                key={track.id}
                type="button"
                onClick={() => handleSelectTrack(idx)}
                className={`w-full text-left p-2 rounded-lg transition cursor-pointer flex items-center justify-between ${
                  currentTrackIndex === idx
                    ? isLight ? 'bg-[#E8F0FE] text-[#1A73E8] font-medium' : 'bg-white/15 text-white'
                    : isLight ? 'hover:bg-[#F1F3F4] text-[#202124]' : 'hover:bg-white/10 text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <span className="font-mono text-[10px] opacity-60">0{track.number}</span>
                  <span className="truncate">{track.title}</span>
                </div>
                {currentTrackIndex === idx && <Check className="w-3.5 h-3.5 text-[#1A73E8]" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
