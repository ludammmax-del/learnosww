import React, { useState, useRef, useEffect } from 'react';
import { Minus, Square, X, Maximize2, Minimize2, Scaling, Sparkles } from 'lucide-react';
import { WindowState } from '../../types.ts';

interface WindowFrameProps {
  window: WindowState;
  isActive: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximizeToggle: () => void;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onSizeChange?: (size: { width: number; height: number }) => void;
  onAutoFitEmptySpace?: (winId: string) => void;
  onExpandDirection?: (winId: string, dir: 'n' | 's' | 'e' | 'w') => void;
  onDragMoveWithSnapping?: (
    winId: string,
    rawPos: { x: number; y: number },
    mouse: { clientX: number; clientY: number },
    winSize: { width: number; height: number }
  ) => { snappedPos: { x: number; y: number } };
  onDragEndWithSnapping?: (winId: string) => void;
  remoteDragUser?: string | null;
  children: React.ReactNode;
  headerControls?: React.ReactNode;
}

type ResizeDirection = 'se' | 's' | 'e' | 'sw' | 'w' | 'ne' | 'nw' | 'n' | null;

export const WindowFrame: React.FC<WindowFrameProps> = ({
  window: win,
  isActive,
  onFocus,
  onClose,
  onMinimize,
  onMaximizeToggle,
  onPositionChange,
  onSizeChange,
  onAutoFitEmptySpace,
  onExpandDirection,
  onDragMoveWithSnapping,
  onDragEndWithSnapping,
  remoteDragUser,
  children,
  headerControls,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection>(null);

  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
  });

  const resizeStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
  });

  const availableWidth = Math.max(1, window.innerWidth - 24);
  const availableHeight = Math.max(1, window.innerHeight - 56);
  const windowSize = {
    width: Math.min(Number.isFinite(win.size?.width) && win.size.width > 0 ? win.size.width : 850, availableWidth),
    height: Math.min(Number.isFinite(win.size?.height) && win.size.height > 0 ? win.size.height : 580, availableHeight),
  };
  const windowPosition = {
    x: Math.max(12, Math.min(Number.isFinite(win.position?.x) ? win.position.x : 80, window.innerWidth - windowSize.width - 12)),
    y: Math.max(44, Math.min(Number.isFinite(win.position?.y) ? win.position.y : 60, window.innerHeight - windowSize.height - 12)),
  };

  // Start Window Dragging
  const handleTitleMouseDown = (e: React.MouseEvent) => {
    if (win.isMaximized) return;
    onFocus();
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: windowPosition.x,
      startY: windowPosition.y,
    };
  };

  // Start Window Resizing
  const handleResizeMouseDown = (e: React.MouseEvent, dir: ResizeDirection) => {
    e.stopPropagation();
    e.preventDefault();
    if (win.isMaximized) return;
    onFocus();
    setResizeDirection(dir);
    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: windowPosition.x,
      startY: windowPosition.y,
      startWidth: windowSize.width,
      startHeight: windowSize.height,
    };
  };

  // Global mouse move and up listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // 1. Handle Dragging with Linux/KDE-style edge snapping and guidelines
      if (isDragging) {
        const dx = e.clientX - dragStartRef.current.mouseX;
        const dy = e.clientY - dragStartRef.current.mouseY;
        const rawX = dragStartRef.current.startX + dx;
        const rawY = dragStartRef.current.startY + dy;

        if (onDragMoveWithSnapping) {
          const result = onDragMoveWithSnapping(
            win.id,
            { x: rawX, y: rawY },
            { clientX: e.clientX, clientY: e.clientY },
            { width: win.size.width || 850, height: win.size.height || 580 }
          );
          onPositionChange(result.snappedPos);
        } else {
          const newX = Math.max(10, Math.min(window.innerWidth - 180, rawX));
          const newY = Math.max(36, Math.min(window.innerHeight - 80, rawY));
          onPositionChange({ x: newX, y: newY });
        }
      }

      // 2. Handle Resizing
      if (resizeDirection) {
        const dx = e.clientX - resizeStartRef.current.mouseX;
        const dy = e.clientY - resizeStartRef.current.mouseY;
        const minW = 400;
        const minH = 280;
        const maxW = window.innerWidth - 40;
        const maxH = window.innerHeight - 50;

        let newW = resizeStartRef.current.startWidth;
        let newH = resizeStartRef.current.startHeight;
        let newX = resizeStartRef.current.startX;
        let newY = resizeStartRef.current.startY;

        if (resizeDirection.includes('e')) {
          newW = Math.max(minW, Math.min(maxW, resizeStartRef.current.startWidth + dx));
        }
        if (resizeDirection.includes('s')) {
          newH = Math.max(minH, Math.min(maxH, resizeStartRef.current.startHeight + dy));
        }
        if (resizeDirection.includes('w')) {
          const possibleW = resizeStartRef.current.startWidth - dx;
          if (possibleW >= minW && possibleW <= maxW) {
            newW = possibleW;
            newX = resizeStartRef.current.startX + dx;
          }
        }
        if (resizeDirection.includes('n')) {
          const possibleH = resizeStartRef.current.startHeight - dy;
          if (possibleH >= minH && possibleH <= maxH) {
            newH = possibleH;
            newY = resizeStartRef.current.startY + dy;
          }
        }

        if (onSizeChange) {
          onSizeChange({ width: newW, height: newH });
        }
        if ((resizeDirection.includes('w') || resizeDirection.includes('n')) && (newX !== win.position.x || newY !== win.position.y)) {
          onPositionChange({ x: newX, y: newY });
        }
      }
    };

    const handleMouseUp = () => {
      if (isDragging && onDragEndWithSnapping) {
        onDragEndWithSnapping(win.id);
      }
      setIsDragging(false);
      setResizeDirection(null);
    };

    if (isDragging || resizeDirection) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, resizeDirection, onPositionChange, onSizeChange, onDragMoveWithSnapping, onDragEndWithSnapping, win.position, win.size, win.id]);

  // Handle Escape key to restore maximized window or close
  useEffect(() => {
    if (!isActive || !win.isOpen || win.isMinimized) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (e.key === 'Escape' && !isInput) {
        if (win.isMaximized) {
          e.preventDefault();
          onMaximizeToggle();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, win.isOpen, win.isMinimized, win.isMaximized, onMaximizeToggle]);

  if (!win.isOpen || win.isMinimized) {
    return null;
  }

  const maximizedStyle = win.isMaximized
    ? {
        top: 44,
        left: 12,
        right: 12,
        bottom: 12,
        width: 'calc(100% - 24px)',
        height: 'calc(100vh - 56px)',
      }
    : {
        top: windowPosition.y,
        left: windowPosition.x,
        width: windowSize.width,
        height: windowSize.height,
      };

  return (
    <div
      id={`window-${win.id}`}
      data-window-id={win.id}
      onClick={onFocus}
      style={{
        ...maximizedStyle,
        zIndex: win.zIndex,
        position: 'fixed',
        transition: isDragging
          ? 'none'
          : remoteDragUser
          ? 'top 35ms linear, left 35ms linear'
          : 'top 75ms ease-out, left 75ms ease-out, width 120ms ease-out, height 120ms ease-out',
      }}
      className={`rounded-xl flex flex-col overflow-hidden transition-all duration-150 select-none bg-white ${
        remoteDragUser
          ? 'shadow-lg border-2 border-[#1A73E8]'
          : isActive 
          ? 'shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] border border-[#1A73E8] ring-1 ring-[#1A73E8]/20' 
          : 'shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)] border border-[#DADCE0]'
      }`}
    >
      {/* 1. Google ChromeOS Minimalist Title Bar */}
      <div
        onMouseDown={handleTitleMouseDown}
        onDoubleClick={onMaximizeToggle}
        className={`h-10 px-3.5 flex items-center justify-between border-b select-none cursor-move transition-colors shrink-0 ${
          remoteDragUser
            ? 'bg-[#E8F0FE] text-[#1A73E8] border-[#D2E3FC]'
            : isActive 
            ? 'bg-[#F8F9FA] text-[#202124] border-[#DADCE0]' 
            : 'bg-[#FFFFFF] text-[#5F6368] border-[#DADCE0]'
        }`}
      >
        {/* Left: Window Title with Google Blue Accent Dot */}
        <div className="flex items-center space-x-2 truncate max-w-[65%]">
          <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-[#1A73E8]' : 'bg-[#BDC1C6]'}`} />
          <span className="font-medium text-xs text-[#202124] tracking-tight truncate">
            {win.title}
          </span>
          {remoteDragUser && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC] shrink-0">
              {remoteDragUser} перемещает
            </span>
          )}
        </div>

        {/* Right: Clean Google Window Controls */}
        <div className="flex items-center space-x-1 shrink-0">
          {onAutoFitEmptySpace && !win.isMaximized && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAutoFitEmptySpace(win.id);
              }}
              className="px-2 py-1 rounded-full text-[10px] bg-[#F1F3F4] hover:bg-[#E8EAED] text-[#3C4043] font-medium transition cursor-pointer flex items-center space-x-1"
              title="Авто-подгонка под свободное место"
            >
              <Scaling className="w-3 h-3 text-[#5F6368]" />
              <span className="hidden sm:inline">Авто</span>
            </button>
          )}

          {headerControls}

          {/* Minimize Button */}
          <button
            id={`btn-minimize-${win.id}`}
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#5F6368] hover:text-[#202124] hover:bg-[#E8EAED] transition cursor-pointer"
            title="Свернуть окно"
            aria-label="Свернуть"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Maximize / Restore Button */}
          <button
            id={`btn-maximize-${win.id}`}
            onClick={(e) => { e.stopPropagation(); onMaximizeToggle(); }}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#5F6368] hover:text-[#202124] hover:bg-[#E8EAED] transition cursor-pointer"
            title={win.isMaximized ? 'Восстановить' : 'Развернуть'}
            aria-label={win.isMaximized ? 'Восстановить' : 'Развернуть'}
          >
            {win.isMaximized ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Square className="w-3 h-3" />
            )}
          </button>

          {/* Close Button */}
          <button
            id={`btn-close-${win.id}`}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#5F6368] hover:text-[#D93025] hover:bg-[#FCE8E6] transition cursor-pointer"
            title="Закрыть окно"
            aria-label="Закрыть окно"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Window Body */}
      <div className="flex-1 overflow-auto bg-white select-text relative">
        {children}
      </div>

      {/* 3. RESIZE HANDLES (8 directions with double-click expand) */}
      {!win.isMaximized && (
        <>
          {/* East Edge */}
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onExpandDirection?.(win.id, 'e');
            }}
            className="absolute top-3 bottom-3 right-0 w-2 cursor-e-resize hover:bg-sky-500/20 z-50 transition"
            title="Изменить ширину (двойной клик — растянуть вправо)"
          />
          {/* South Edge */}
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 's')}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onExpandDirection?.(win.id, 's');
            }}
            className="absolute left-3 right-3 bottom-0 h-2 cursor-s-resize hover:bg-sky-500/20 z-50 transition"
            title="Изменить высоту (двойной клик — растянуть вниз)"
          />
          {/* West Edge */}
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onExpandDirection?.(win.id, 'w');
            }}
            className="absolute top-3 bottom-3 left-0 w-2 cursor-w-resize hover:bg-sky-500/20 z-50 transition"
            title="Изменить ширину (двойной клик — растянуть влево)"
          />
          {/* North Edge */}
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onExpandDirection?.(win.id, 'n');
            }}
            className="absolute left-3 right-3 top-0 h-1.5 cursor-n-resize hover:bg-sky-500/20 z-50 transition"
            title="Изменить высоту (двойной клик — растянуть вверх)"
          />
          {/* South-East Corner Handle */}
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50 flex items-end justify-end p-0.5 hover:bg-sky-500/20 rounded-br-2xl transition"
            title="Изменить размер окна"
          >
            <div className="w-2 h-2 border-r-2 border-b-2 border-slate-400/80 rounded-br" />
          </div>
          {/* South-West Corner Handle */}
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
            className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize z-50 rounded-bl-2xl hover:bg-sky-500/20 transition"
            title="Изменить размер окна"
          />
        </>
      )}
    </div>
  );
};
