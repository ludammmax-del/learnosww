import React, { useEffect, useState, useRef } from 'react';
import { peerCollabSync, PeerCursor, ClickRipple } from '../../services/peerCollabSync.ts';
import { Users, MousePointer, Sparkles, EyeOff, Eye } from 'lucide-react';

interface PeerCursorOverlayProps {
  enabled?: boolean;
  hasPartner?: boolean;
  onToggleEnabled?: () => void;
}

function safeClosest(target: any, selector: string): HTMLElement | null {
  if (!target) return null;
  if (typeof target.closest === 'function') {
    return target.closest(selector);
  }
  if (target.parentElement && typeof target.parentElement.closest === 'function') {
    return target.parentElement.closest(selector);
  }
  return null;
}

export const PeerCursorOverlay: React.FC<PeerCursorOverlayProps> = ({
  enabled = true,
  hasPartner = false,
  onToggleEnabled,
}) => {
  const [cursors, setCursors] = useState<Record<string, PeerCursor>>({});
  const [ripples, setRipples] = useState<ClickRipple[]>([]);
  const [syncedActionNote, setSyncedActionNote] = useState<string | null>(null);
  const [showStatusToast, setShowStatusToast] = useState<boolean>(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(() => peerCollabSync.getRoomId());
  const myClientId = peerCollabSync.getClientId();
  const isExecutingRemoteClickRef = useRef<boolean>(false);
  const processedRippleIdsRef = useRef<Set<string>>(new Set());

  // Listen for room changes reactively
  useEffect(() => {
    const unsub = peerCollabSync.subscribeRoomId((rId) => {
      setActiveRoomId(rId);
    });
    return unsub;
  }, []);

  const isCollabActive = Boolean(
    activeRoomId || hasPartner || peerCollabSync.isDemoPartnerActive() || Object.keys(cursors).some((id) => id !== myClientId)
  );

  // Co-clicking execution on the local machine when remote partner clicks strictly inside lesson workspace
  const executeRemotePartnerClick = (ripple: ClickRipple) => {
    if (processedRippleIdsRef.current.has(ripple.id)) return;
    processedRippleIdsRef.current.add(ripple.id);
    if (processedRippleIdsRef.current.size > 200) {
      const arr = Array.from(processedRippleIdsRef.current);
      processedRippleIdsRef.current = new Set(arr.slice(-100));
    }

    try {
      isExecutingRemoteClickRef.current = true;

      let targetEl: HTMLElement | null = null;

      // 1. Try finding target by explicit CSS selector inside lesson area
      if (ripple.targetSelector) {
        try {
          targetEl = document.querySelector(ripple.targetSelector) as HTMLElement | null;
        } catch {}
      }

      // 2. Try finding target by aria-label
      if (!targetEl && ripple.targetAriaLabel) {
        try {
          targetEl = document.querySelector(`[aria-label="${CSS.escape(ripple.targetAriaLabel)}"]`) as HTMLElement | null;
        } catch {}
      }

      // 3. Try finding target by button or tab text content inside lesson container
      if (!targetEl && ripple.targetText) {
        const candidates = Array.from(
          document.querySelectorAll('.lesson-interactive-area button, .focus-studio-content button, .peer-collab-window button, .block-peer-studio button, button, a, [role="button"]')
        ) as HTMLElement[];
        targetEl =
          candidates.find(
            (c) => (c.textContent || '').trim().replace(/\s+/g, ' ') === ripple.targetText
          ) || null;
      }

      // 4. Fallback to viewport percentage coordinates
      const clientX = (ripple.x / 100) * window.innerWidth;
      const clientY = (ripple.y / 100) * window.innerHeight;

      if (!targetEl) {
        targetEl = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
      }

      if (!targetEl) return;

      // Ensure remote clicks ONLY execute inside the lesson/collab window, NEVER outside in OS or topbar
      const isInsideLesson = Boolean(
        safeClosest(targetEl, '.lesson-interactive-area, .focus-studio-window, .peer-collab-window, .block-peer-studio, .interactive-whiteboard, #window-focus, #window-peer')
      );
      if (!isInsideLesson) {
        return;
      }

      // Find nearest clickable container
      const clickable = (safeClosest(
        targetEl,
        'button, a, input, select, textarea, [role="button"], [data-clickable], [data-unit-id], [data-node-id], [data-action], label, .cursor-pointer'
      ) || targetEl) as HTMLElement;

      // Safety checks: do NOT trigger camera/microphone toggles, screen lock, or disconnect buttons
      if (
        safeClosest(clickable, '.peer-cursor-overlay-control') ||
        safeClosest(clickable, '.no-remote-click') ||
        (typeof clickable.getAttribute === 'function' && clickable.getAttribute('data-local-only') === 'true') ||
        clickable.id === 'system-lock-screen' ||
        clickable.id === 'btn-topbar-lock-screen'
      ) {
        return;
      }

      // Focus and dispatch full event chain
      clickable.focus?.();

      const eventInit: MouseEventInit = {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX,
        clientY,
      };

      clickable.dispatchEvent(new PointerEvent('pointerdown', eventInit));
      clickable.dispatchEvent(new MouseEvent('mousedown', eventInit));
      clickable.dispatchEvent(new PointerEvent('pointerup', eventInit));
      clickable.dispatchEvent(new MouseEvent('mouseup', eventInit));
      clickable.dispatchEvent(new MouseEvent('click', eventInit));

      if (typeof clickable.click === 'function') {
        clickable.click();
      }

      if (clickable instanceof HTMLInputElement && (clickable.type === 'checkbox' || clickable.type === 'radio')) {
        clickable.checked = !clickable.checked;
        clickable.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } catch (err) {
      console.warn('Remote click execution notice:', err);
    } finally {
      setTimeout(() => {
        isExecutingRemoteClickRef.current = false;
      }, 120);
    }
  };

  // 1. Pointer tracker (broadcasts position & clicks ONLY when interacting inside lesson / peer workspace)
  useEffect(() => {
    if (!enabled || !isCollabActive) return;

    let rafId: number | null = null;
    const handlePointerMove = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      // Check if mouse is inside the lesson or peer studio workspace
      const isInsideLesson = Boolean(
        safeClosest(target, '.lesson-interactive-area, .focus-studio-window, .peer-collab-window, .block-peer-studio, .interactive-whiteboard, #window-focus, #window-peer')
      );
      if (!isInsideLesson) return;

      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const xPct = (e.clientX / window.innerWidth) * 100;
        const yPct = (e.clientY / window.innerHeight) * 100;
        peerCollabSync.updateLocalCursor(xPct, yPct);
        rafId = null;
      });
    };

    const handleClick = (e: MouseEvent) => {
      if (isExecutingRemoteClickRef.current) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Only capture clicks inside the lesson window!
      const isInsideLesson = Boolean(
        safeClosest(target, '.lesson-interactive-area, .focus-studio-window, .peer-collab-window, .block-peer-studio, .interactive-whiteboard, #window-focus, #window-peer')
      );
      if (!isInsideLesson) return;

      if (
        safeClosest(target, '.peer-cursor-overlay-control') ||
        safeClosest(target, '.no-remote-click') ||
        (typeof target.getAttribute === 'function' && target.getAttribute('data-local-only') === 'true') ||
        target.id === 'system-lock-screen'
      ) {
        return;
      }

      const xPct = (e.clientX / window.innerWidth) * 100;
      const yPct = (e.clientY / window.innerHeight) * 100;

      const clickable = (safeClosest(
        target,
        'button, a, input, select, textarea, [role="button"], [data-clickable], [data-unit-id], [data-node-id], [data-action], label, .cursor-pointer'
      ) || target) as HTMLElement;

      const rawText = (clickable.textContent || '').trim().replace(/\s+/g, ' ');
      const targetText = rawText && rawText.length <= 40 ? rawText : undefined;
      const targetAriaLabel = typeof clickable.getAttribute === 'function' ? (clickable.getAttribute('aria-label') || undefined) : undefined;
      const label = targetAriaLabel || targetText || (clickable.tagName ? clickable.tagName.toLowerCase() : 'element');

      let targetSelector: string | undefined;
      if (clickable.id && !/^\d/.test(clickable.id)) {
        targetSelector = `#${CSS.escape(clickable.id)}`;
      } else {
        const dataUnit = safeClosest(clickable, '[data-unit-id]')?.getAttribute('data-unit-id');
        const dataNode = safeClosest(clickable, '[data-node-id]')?.getAttribute('data-node-id');
        const dataAction = safeClosest(clickable, '[data-action]')?.getAttribute('data-action');

        if (dataUnit) targetSelector = `[data-unit-id="${CSS.escape(dataUnit)}"]`;
        else if (dataNode) targetSelector = `[data-node-id="${CSS.escape(dataNode)}"]`;
        else if (dataAction) targetSelector = `[data-action="${CSS.escape(dataAction)}"]`;
      }

      peerCollabSync.broadcastClick(
        xPct,
        yPct,
        label,
        targetSelector,
        true,
        targetText,
        targetAriaLabel
      );
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('click', handleClick, { capture: true, passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('click', handleClick, { capture: true });
    };
  }, [enabled, isCollabActive]);

  // 2. Subscribe to remote cursors from peers
  useEffect(() => {
    const unsub = peerCollabSync.subscribeCursors((newCursors) => {
      setCursors(newCursors);
    });
    return () => unsub();
  }, []);

  // 3. Subscribe to clicks and action ripples
  useEffect(() => {
    const unsubClicks = peerCollabSync.subscribeClicks((ripple) => {
      const isSelf = ripple.userId === myClientId;
      setRipples((prev) => [...prev.slice(-15), ripple]);

      if (ripple.label && !isSelf) {
        setSyncedActionNote(`Напарник нажал: «${ripple.label}»`);
        setShowStatusToast(true);
      }

      if (!isSelf) {
        executeRemotePartnerClick(ripple);
      }
    });

    return () => unsubClicks();
  }, [myClientId]);

  // Auto-dismiss status toast and ripple animations
  useEffect(() => {
    if (showStatusToast) {
      const timer = setTimeout(() => setShowStatusToast(false), 2600);
      return () => clearTimeout(timer);
    }
  }, [showStatusToast]);

  useEffect(() => {
    if (ripples.length === 0) return;
    const timer = setTimeout(() => {
      setRipples((prev) => prev.filter((r) => Date.now() - r.timestamp < 1200));
    }, 1200);
    return () => clearTimeout(timer);
  }, [ripples]);

  if (!enabled || !isCollabActive) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden select-none">
      {/* Active Remote Cursors */}
      {Object.entries(cursors).map(([id, cursor]) => {
        if (id === myClientId) return null;
        if (Date.now() - cursor.lastActive > 8000) return null;

        const posX = `${cursor.x}%`;
        const posY = `${cursor.y}%`;

        return (
          <div
            key={id}
            className="absolute transition-all duration-75 ease-out flex flex-col items-start -translate-x-1 -translate-y-1 will-change-transform"
            style={{ left: posX, top: posY }}
          >
            {/* Smooth SVG Cursor Pointer */}
            <svg
              className="w-5 h-5 drop-shadow-md filter drop-shadow-sm"
              viewBox="0 0 24 24"
              fill={cursor.color || '#3b82f6'}
              stroke="white"
              strokeWidth="1.5"
            >
              <path d="M5.653 3.123A1.498 1.498 0 0 0 3.5 4.5v15a1.498 1.498 0 0 0 2.457 1.154l4.243-3.536 3.13 6.26a1.5 1.5 0 0 0 2.013.67l1.789-.894a1.5 1.5 0 0 0 .67-2.013l-3.13-6.26 5.18-.518A1.498 1.498 0 0 0 20.854 12L7.104 3.254a1.503 1.503 0 0 0-1.451-.131z" />
            </svg>

            {/* Name Badge */}
            <div
              className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-md flex items-center space-x-1 whitespace-nowrap ml-3 -mt-1 ring-1 ring-white/40"
              style={{ backgroundColor: cursor.color || '#3b82f6' }}
            >
              <span>{cursor.userName || 'Напарник'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>
        );
      })}

      {/* Click Visual Ripples */}
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${ripple.x}%`, top: `${ripple.y}%` }}
        >
          <div
            className="w-10 h-10 rounded-full border-2 animate-ping"
            style={{ borderColor: ripple.color || '#3b82f6' }}
          />
          <div
            className="w-4 h-4 rounded-full -mt-7 ml-3 opacity-75"
            style={{ backgroundColor: ripple.color || '#3b82f6' }}
          />
        </div>
      ))}

      {/* Notification Toast for Live Action Synchronization */}
      {showStatusToast && syncedActionNote && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white text-xs px-4 py-2 rounded-2xl shadow-xl border border-slate-700/60 flex items-center space-x-2 animate-bounce">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="font-medium">{syncedActionNote}</span>
        </div>
      )}
    </div>
  );
};
