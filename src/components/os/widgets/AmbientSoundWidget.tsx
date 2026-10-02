import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, CloudRain, Waves, Radio, Moon } from 'lucide-react';
import { ambientSound } from '../../../utils/audio.ts';

type AmbientSoundMode = 'rain' | 'brown' | 'binaural' | 'space';

export const AmbientSoundWidget: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState<AmbientSoundMode>('brown');
  const [volume, setVolume] = useState<number>(0.3);

  const MODES: { id: AmbientSoundMode; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'brown', label: 'Brown Noise', icon: <Waves className="w-3.5 h-3.5" />, desc: 'Теплый глубокий шум для блокировки шума' },
    { id: 'rain', label: 'Шум Дождя', icon: <CloudRain className="w-3.5 h-3.5" />, desc: 'Мягкий дождь для глубокого фокуса' },
    { id: 'binaural', label: 'Binaural 40Hz', icon: <Radio className="w-3.5 h-3.5" />, desc: 'Гамма-ритм для аналитического мышления' },
    { id: 'space', label: 'Space Drone', icon: <Moon className="w-3.5 h-3.5" />, desc: 'Гармонический космический дрон' },
  ];

  const handleTogglePlay = () => {
    if (isPlaying) {
      ambientSound.stop();
      setIsPlaying(false);
    } else {
      ambientSound.play(mode, volume);
      setIsPlaying(true);
    }
  };

  const handleSelectMode = (newMode: AmbientSoundMode) => {
    setMode(newMode);
    if (isPlaying) {
      ambientSound.play(newMode, volume);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    ambientSound.setVolume(newVol);
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      ambientSound.stop();
    };
  }, []);

  return (
    <div className="h-full flex flex-col justify-between p-3.5 text-slate-800 select-none text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-1.5 font-semibold text-slate-900 text-xs">
          <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
          <span>Звуковой фон концентрации</span>
        </div>
        {isPlaying && (
          <div className="flex items-center space-x-0.5 h-3">
            <span className="w-0.5 h-3 bg-indigo-500 rounded-full animate-pulse" />
            <span className="w-0.5 h-2 bg-indigo-400 rounded-full animate-pulse delay-75" />
            <span className="w-0.5 h-3.5 bg-indigo-600 rounded-full animate-pulse delay-150" />
            <span className="w-0.5 h-1.5 bg-indigo-300 rounded-full animate-pulse delay-100" />
          </div>
        )}
      </div>

      {/* Modes Grid */}
      <div className="grid grid-cols-2 gap-1.5 my-2">
        {MODES.map((m) => {
          const isSelected = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => handleSelectMode(m.id)}
              className={`p-2 rounded-lg text-left transition cursor-pointer border flex flex-col justify-between ${
                isSelected
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-950 font-semibold shadow-2xs'
                  : 'bg-slate-50/70 border-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center space-x-1.5 mb-1">
                {m.icon}
                <span className="text-[11px] truncate">{m.label}</span>
              </div>
              <span className="text-[9px] text-slate-400 font-normal leading-tight line-clamp-1">
                {m.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom Controls: Play/Pause and Volume Slider */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between space-x-3">
        <button
          type="button"
          onClick={handleTogglePlay}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs ${
            isPlaying
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span>Стоп</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Включить</span>
            </>
          )}
        </button>

        {/* Volume Slider */}
        <div className="flex items-center space-x-2 flex-1 justify-end">
          {volume === 0 ? (
            <VolumeX className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-slate-500" />
          )}
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-20 accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};
