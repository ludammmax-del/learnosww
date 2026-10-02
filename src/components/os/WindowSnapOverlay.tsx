import React from 'react';
import { 
  Maximize2, 
  Columns, 
  LayoutGrid, 
  Magnet, 
  Layers, 
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Scaling,
  Expand
} from 'lucide-react';

export interface AlignmentGuide {
  id: string;
  orientation: 'vertical' | 'horizontal';
  pos: number;
  start: number;
  end: number;
  label?: string;
  type: 'edge' | 'center' | 'gap' | 'screen' | 'empty-space';
}

export interface SnapZonePreview {
  id: string;
  type: 
    | 'maximize' 
    | 'left-half' 
    | 'right-half' 
    | 'top-half' 
    | 'bottom-half' 
    | 'top-left' 
    | 'top-right' 
    | 'bottom-left' 
    | 'bottom-right'
    | 'dock-left'
    | 'dock-right'
    | 'dock-top'
    | 'dock-bottom'
    | 'fill-empty-space'
    | 'dock-right-autofit'
    | 'dock-left-autofit'
    | 'dock-top-autofit'
    | 'dock-bottom-autofit'
    | 'smart-mosaic';
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  subtitle: string;
  targetWindowName?: string;
  badgeTag?: string;
}

interface WindowSnapOverlayProps {
  activeSnapZone: SnapZonePreview | null;
  alignmentGuides: AlignmentGuide[];
  isDraggingWindow: boolean;
  draggingWindowTitle?: string;
}

export const WindowSnapOverlay: React.FC<WindowSnapOverlayProps> = ({
  activeSnapZone,
  alignmentGuides,
  isDraggingWindow,
  draggingWindowTitle,
}) => {
  if (!isDraggingWindow && !activeSnapZone && alignmentGuides.length === 0) {
    return null;
  }

  const getZoneIcon = (type: SnapZonePreview['type']) => {
    switch (type) {
      case 'fill-empty-space':
        return <Scaling className="w-9 h-9 text-emerald-400 animate-pulse" />;
      case 'dock-right-autofit':
        return <ArrowRight className="w-8 h-8 text-emerald-400 animate-bounce" />;
      case 'dock-left-autofit':
        return <ArrowLeft className="w-8 h-8 text-emerald-400 animate-bounce" />;
      case 'dock-top-autofit':
        return <ArrowUp className="w-8 h-8 text-emerald-400 animate-bounce" />;
      case 'dock-bottom-autofit':
        return <ArrowDown className="w-8 h-8 text-emerald-400 animate-bounce" />;
      case 'smart-mosaic':
        return <Expand className="w-8 h-8 text-amber-400 animate-pulse" />;
      case 'maximize':
        return <Maximize2 className="w-8 h-8 text-sky-400 animate-pulse" />;
      case 'left-half':
        return <Columns className="w-8 h-8 text-indigo-400 animate-pulse" />;
      case 'right-half':
        return <Columns className="w-8 h-8 text-indigo-400 rotate-180 animate-pulse" />;
      case 'top-half':
        return <Layers className="w-8 h-8 text-cyan-400 animate-pulse" />;
      case 'bottom-half':
        return <Layers className="w-8 h-8 text-cyan-400 rotate-180 animate-pulse" />;
      case 'top-left':
      case 'top-right':
      case 'bottom-left':
      case 'bottom-right':
        return <LayoutGrid className="w-8 h-8 text-violet-400 animate-pulse" />;
      case 'dock-left':
        return <ArrowLeft className="w-7 h-7 text-emerald-400 animate-bounce" />;
      case 'dock-right':
        return <ArrowRight className="w-7 h-7 text-emerald-400 animate-bounce" />;
      case 'dock-top':
        return <ArrowUp className="w-7 h-7 text-emerald-400 animate-bounce" />;
      case 'dock-bottom':
        return <ArrowDown className="w-7 h-7 text-emerald-400 animate-bounce" />;
      default:
        return <Magnet className="w-8 h-8 text-sky-400" />;
    }
  };

  const isFillEmptySpace = activeSnapZone?.type === 'fill-empty-space' || activeSnapZone?.type?.includes('autofit');

  return (
    <div className="fixed inset-0 pointer-events-none z-[80] overflow-hidden select-none">
      {/* 1. LINUX/KDE SNAP ZONE PREVIEW (GHOST HIGHLIGHT) */}
      {activeSnapZone && (
        <div
          style={{
            left: activeSnapZone.x,
            top: activeSnapZone.y,
            width: activeSnapZone.width,
            height: activeSnapZone.height,
          }}
          className={`absolute transition-all duration-150 ease-out rounded-2xl border-2 ${
            isFillEmptySpace 
              ? 'border-emerald-400/90 bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-sky-600/20 shadow-[0_0_40px_rgba(52,211,153,0.45),inset_0_0_30px_rgba(52,211,153,0.2)]'
              : 'border-sky-400/90 bg-gradient-to-br from-sky-500/20 via-indigo-500/15 to-purple-600/20 shadow-[0_0_40px_rgba(56,189,248,0.4),inset_0_0_30px_rgba(56,189,248,0.2)]'
          } backdrop-blur-[4px] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Glowing Animated Outer Border Effect */}
          <div className={`absolute inset-0 rounded-2xl border border-white/40 ring-4 ${
            isFillEmptySpace ? 'ring-emerald-400/25' : 'ring-sky-400/20'
          } animate-pulse`} />

          {/* Corner Guides (Linux-style crosshairs) */}
          <div className={`absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 ${isFillEmptySpace ? 'border-emerald-300' : 'border-sky-300'}`} />
          <div className={`absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 ${isFillEmptySpace ? 'border-emerald-300' : 'border-sky-300'}`} />
          <div className={`absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 ${isFillEmptySpace ? 'border-emerald-300' : 'border-sky-300'}`} />
          <div className={`absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 ${isFillEmptySpace ? 'border-emerald-300' : 'border-sky-300'}`} />

          {/* Center Badge with Icon & Text */}
          <div className={`relative z-10 px-5 py-3.5 rounded-2xl bg-slate-900/90 border ${
            isFillEmptySpace ? 'border-emerald-400/50 shadow-emerald-950/50' : 'border-sky-400/50'
          } shadow-2xl backdrop-blur-xl flex flex-col items-center space-y-2 max-w-sm`}>
            <div className={`p-3 rounded-xl ${
              isFillEmptySpace ? 'bg-emerald-500/15 border border-emerald-400/30' : 'bg-sky-500/15 border border-sky-400/30'
            }`}>
              {getZoneIcon(activeSnapZone.type)}
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center justify-center space-x-1.5">
                <Sparkles className={`w-3.5 h-3.5 ${isFillEmptySpace ? 'text-emerald-400' : 'text-sky-400'}`} />
                <span>{activeSnapZone.title}</span>
              </div>
              <div className={`text-[11px] mt-0.5 font-medium ${isFillEmptySpace ? 'text-emerald-200/80' : 'text-sky-200/80'}`}>
                {activeSnapZone.subtitle}
              </div>
              <div className="flex items-center justify-center space-x-1.5 mt-1.5 flex-wrap gap-1">
                {activeSnapZone.targetWindowName && (
                  <span className="text-[10px] text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 px-2 py-0.5 rounded-md font-mono">
                    Рядом с «{activeSnapZone.targetWindowName}»
                  </span>
                )}
                {/* Computed Auto-Fit Dimensions Tag */}
                <span className="text-[10px] text-white/90 bg-white/10 border border-white/15 px-2 py-0.5 rounded-md font-mono">
                  {Math.round(activeSnapZone.width)} × {Math.round(activeSnapZone.height)} px
                </span>
                {isFillEmptySpace && (
                  <span className="text-[10px] text-amber-300 bg-amber-500/15 border border-amber-400/30 px-2 py-0.5 rounded-md font-mono">
                    Авто-размер
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAGNETIC ALIGNMENT LASER GUIDELINES */}
      {alignmentGuides.map((guide) => {
        if (guide.orientation === 'vertical') {
          return (
            <div
              key={guide.id}
              style={{
                left: guide.pos,
                top: Math.max(0, guide.start),
                height: Math.max(20, guide.end - guide.start),
              }}
              className="absolute w-0.5 bg-sky-400 shadow-[0_0_12px_#38bdf8,0_0_24px_#0284c7] animate-pulse"
            >
              {/* Laser glow trail */}
              <div className="absolute -inset-x-1 inset-y-0 bg-sky-400/20 blur-[2px]" />

              {/* Start & End Crosshair Pins */}
              <div className="absolute -top-1.5 -left-1 w-2.5 h-2.5 rounded-full bg-sky-300 border border-white shadow-md" />
              <div className="absolute -bottom-1.5 -left-1 w-2.5 h-2.5 rounded-full bg-sky-300 border border-white shadow-md" />

              {/* Alignment Badge */}
              {guide.label && (
                <div
                  style={{
                    top: (guide.end - guide.start) / 2 - 12,
                  }}
                  className="absolute left-3 whitespace-nowrap bg-slate-900/95 border border-sky-400/60 text-sky-300 text-[10px] font-semibold font-mono px-2 py-0.5 rounded-md shadow-xl backdrop-blur-md flex items-center space-x-1"
                >
                  <Magnet className="w-2.5 h-2.5 text-sky-400" />
                  <span>{guide.label}</span>
                </div>
              )}
            </div>
          );
        }

        // Horizontal Guide
        return (
          <div
            key={guide.id}
            style={{
              top: guide.pos,
              left: Math.max(0, guide.start),
              width: Math.max(20, guide.end - guide.start),
            }}
            className="absolute h-0.5 bg-sky-400 shadow-[0_0_12px_#38bdf8,0_0_24px_#0284c7] animate-pulse"
          >
            {/* Laser glow trail */}
            <div className="absolute -inset-y-1 inset-x-0 bg-sky-400/20 blur-[2px]" />

            {/* Start & End Crosshair Pins */}
            <div className="absolute -left-1.5 -top-1 w-2.5 h-2.5 rounded-full bg-sky-300 border border-white shadow-md" />
            <div className="absolute -right-1.5 -top-1 w-2.5 h-2.5 rounded-full bg-sky-300 border border-white shadow-md" />

            {/* Alignment Badge */}
            {guide.label && (
              <div
                style={{
                  left: (guide.end - guide.start) / 2 - 40,
                }}
                className="absolute top-2 whitespace-nowrap bg-slate-900/95 border border-sky-400/60 text-sky-300 text-[10px] font-semibold font-mono px-2 py-0.5 rounded-md shadow-xl backdrop-blur-md flex items-center space-x-1"
              >
                <Magnet className="w-2.5 h-2.5 text-sky-400" />
                <span>{guide.label}</span>
              </div>
            )}
          </div>
        );
      })}

      {/* 3. ACTIVE DRAGGING STATUS PILL (TOP-CENTER) */}
      {isDraggingWindow && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-sky-500/40 text-slate-200 px-3.5 py-1 rounded-full text-xs font-medium backdrop-blur-xl shadow-lg flex items-center space-x-2.5 animate-fade-in">
          <div className={`w-2 h-2 rounded-full ${isFillEmptySpace ? 'bg-emerald-400' : 'bg-sky-400'} animate-ping`} />
          <Magnet className={`w-3.5 h-3.5 ${isFillEmptySpace ? 'text-emerald-400' : 'text-sky-400'}`} />
          <span className="font-semibold">
            {activeSnapZone ? activeSnapZone.title : `Перемещение: ${draggingWindowTitle || 'Окно'}`}
          </span>
          <span className="text-[10px] text-slate-400 border-l border-white/10 pl-2">
            Авто-подгонка под пустое место: <strong className="text-emerald-300">ВКЛ</strong>
          </span>
        </div>
      )}
    </div>
  );
};
