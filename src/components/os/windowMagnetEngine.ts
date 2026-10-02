/**
 * Window Magnet & Smart Space Snapping Engine for Learning OS
 * 
 * Provides:
 * 1. Screen edge snap zones (Maximize, Halves, Quarters, Thirds)
 * 2. Smart Empty Space Detection & Auto-Fit (Windows auto-size to fill unoccupied areas)
 * 3. Adjacent Window Docking & Auto-Sizing (Snapping next to a window auto-expands to fill the remaining screen space)
 * 4. Magnetic Laser Alignment with pixel gap indicators
 * 5. Magnetic Edge Resizing
 * 6. Non-overlapping Smart Mosaic / Bento auto-tiling
 */

import { WindowState } from '../../types.ts';
import { AlignmentGuide, SnapZonePreview } from './WindowSnapOverlay.tsx';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MagnetSnapResult {
  snappedPos: { x: number; y: number };
  activeSnapZone: SnapZonePreview | null;
  alignmentGuides: AlignmentGuide[];
}

export interface AutoFitResult {
  x: number;
  y: number;
  width: number;
  height: number;
  description: string;
}

/**
 * Checks if two rectangles overlap
 */
export function rectsIntersect(r1: Rect, r2: Rect): boolean {
  return !(
    r2.x >= r1.x + r1.width ||
    r2.x + r2.width <= r1.x ||
    r2.y >= r1.y + r1.height ||
    r2.y + r2.height <= r1.y
  );
}

/**
 * Calculates empty unoccupied rectangular areas on the screen
 */
export function findAvailableSpaces(
  screenWidth: number,
  screenHeight: number,
  topbarHeight: number = 44,
  margin: number = 12,
  gap: number = 10,
  otherWindows: WindowState[]
): Rect[] {
  const availW = screenWidth - margin * 2;
  const availH = screenHeight - topbarHeight - margin;

  if (otherWindows.length === 0) {
    return [{ x: margin, y: topbarHeight, width: availW, height: availH }];
  }

  // Get bounding boxes of all open non-minimized windows
  const occupied: Rect[] = otherWindows
    .filter((w) => w.isOpen && !w.isMinimized)
    .map((w) => {
      if (w.isMaximized) {
        return { x: margin, y: topbarHeight, width: availW, height: availH };
      }
      return {
        x: Math.max(margin, w.position.x),
        y: Math.max(topbarHeight, w.position.y),
        width: Math.min(w.size.width || 800, availW),
        height: Math.min(w.size.height || 560, availH),
      };
    });

  // Generate candidate rectangles from grid partition lines
  const xPoints = Array.from(
    new Set([
      margin,
      screenWidth - margin,
      ...occupied.flatMap((r) => [r.x, r.x + r.width, r.x - gap, r.x + r.width + gap]),
    ])
  )
    .filter((x) => x >= margin && x <= screenWidth - margin)
    .sort((a, b) => a - b);

  const yPoints = Array.from(
    new Set([
      topbarHeight,
      screenHeight - margin,
      ...occupied.flatMap((r) => [r.y, r.y + r.height, r.y - gap, r.y + r.height + gap]),
    ])
  )
    .filter((y) => y >= topbarHeight && y <= screenHeight - margin)
    .sort((a, b) => a - b);

  const freeSpaces: Rect[] = [];

  // Check column-based and row-based major free spaces
  // 1. Right of any window
  occupied.forEach((ow) => {
    const rightX = ow.x + ow.width + gap;
    const rightW = screenWidth - margin - rightX;
    if (rightW >= 320) {
      // Free right area
      const candidate: Rect = {
        x: rightX,
        y: topbarHeight,
        width: rightW,
        height: availH,
      };
      // Check if candidate intersects other windows significantly
      const hasMajorConflict = occupied.some((other) => other !== ow && rectsIntersect(candidate, other));
      if (!hasMajorConflict) {
        freeSpaces.push(candidate);
      }
    }

    // 2. Left of any window
    const leftW = ow.x - gap - margin;
    if (leftW >= 320) {
      const candidate: Rect = {
        x: margin,
        y: topbarHeight,
        width: leftW,
        height: availH,
      };
      const hasMajorConflict = occupied.some((other) => other !== ow && rectsIntersect(candidate, other));
      if (!hasMajorConflict) {
        freeSpaces.push(candidate);
      }
    }

    // 3. Below any window
    const belowY = ow.y + ow.height + gap;
    const belowH = screenHeight - margin - belowY;
    if (belowH >= 240) {
      const candidate: Rect = {
        x: ow.x,
        y: belowY,
        width: ow.width,
        height: belowH,
      };
      const hasMajorConflict = occupied.some((other) => other !== ow && rectsIntersect(candidate, other));
      if (!hasMajorConflict) {
        freeSpaces.push(candidate);
      }
    }

    // 4. Above any window
    const aboveH = ow.y - gap - topbarHeight;
    if (aboveH >= 240) {
      const candidate: Rect = {
        x: ow.x,
        y: topbarHeight,
        width: ow.width,
        height: aboveH,
      };
      const hasMajorConflict = occupied.some((other) => other !== ow && rectsIntersect(candidate, other));
      if (!hasMajorConflict) {
        freeSpaces.push(candidate);
      }
    }
  });

  return freeSpaces;
}

/**
 * Calculates optimal Auto-Fit for a window into the empty space on desktop
 */
export function calculateSmartAutoFit(
  currentWinId: string,
  screenWidth: number,
  screenHeight: number,
  topbarHeight: number = 44,
  margin: number = 12,
  gap: number = 10,
  allWindows: Record<string, WindowState>
): AutoFitResult {
  const availW = screenWidth - margin * 2;
  const availH = screenHeight - topbarHeight - margin;
  const otherWins = Object.values(allWindows).filter(
    (w) => w.id !== currentWinId && w.isOpen && !w.isMinimized
  );

  if (otherWins.length === 0) {
    return {
      x: margin,
      y: topbarHeight,
      width: Math.min(1060, availW),
      height: Math.min(680, availH),
      description: 'Оптимальный центрированный размер на пустом экране',
    };
  }

  // If 1 other window is open, place side-by-side or fill remaining space
  if (otherWins.length === 1) {
    const ow = otherWins[0];
    const owX = ow.position.x;
    const owW = ow.size.width || 800;

    // Is it on the left?
    if (owX <= margin + 120) {
      const newX = owX + owW + gap;
      const newW = screenWidth - margin - newX;
      if (newW >= 360) {
        return {
          x: newX,
          y: topbarHeight,
          width: newW,
          height: availH,
          description: `Заполнение свободного пространства справа от «${ow.title}»`,
        };
      }
    }

    // Is it on the right?
    if (owX + owW >= screenWidth - margin - 120) {
      const newW = owX - gap - margin;
      if (newW >= 360) {
        return {
          x: margin,
          y: topbarHeight,
          width: newW,
          height: availH,
          description: `Заполнение свободного пространства слева от «${ow.title}»`,
        };
      }
    }

    // Default 50/50 split
    const halfW = Math.floor(availW / 2) - 4;
    return {
      x: margin + halfW + 8,
      y: topbarHeight,
      width: halfW,
      height: availH,
      description: `Свободная правая половина экрана (1/2)`,
    };
  }

  // If multiple windows, find the largest free bounding rectangle
  const spaces = findAvailableSpaces(screenWidth, screenHeight, topbarHeight, margin, gap, otherWins);
  if (spaces.length > 0) {
    // Sort by largest area
    spaces.sort((a, b) => b.width * b.height - a.width * a.height);
    const best = spaces[0];
    return {
      x: best.x,
      y: best.y,
      width: best.width,
      height: best.height,
      description: `Авто-заполнение свободной зоны (${Math.round(best.width)}×${Math.round(best.height)} px)`,
    };
  }

  // Fallback: Smart quadrant or tiled slice
  const halfW = Math.floor(availW / 2) - 4;
  const halfH = Math.floor(availH / 2) - 4;
  return {
    x: margin + halfW + 8,
    y: topbarHeight,
    width: halfW,
    height: halfH,
    description: 'Свободный квадрант',
  };
}

/**
 * Intelligent Drag & Snapping Engine with:
 * - Empty Space Autofit detection
 * - Adjacent Window Docking & Auto-resizing
 * - Screen Edge Zones (halves, quarters, maximize)
 * - Magnetic alignment guides with distance/labels
 */
export function computeWindowMagnetDrag(
  winId: string,
  rawPos: { x: number; y: number },
  mouse: { clientX: number; clientY: number },
  winSize: { width: number; height: number },
  screenWidth: number,
  screenHeight: number,
  allWindows: Record<string, WindowState>,
  isSmartSnappingEnabled: boolean = true
): MagnetSnapResult {
  if (!isSmartSnappingEnabled) {
    return {
      snappedPos: rawPos,
      activeSnapZone: null,
      alignmentGuides: [],
    };
  }

  const topbarHeight = 44;
  const margin = 12;
  const gap = 10;
  const availW = screenWidth - margin * 2;
  const availH = screenHeight - topbarHeight - margin;
  const halfW = Math.floor(availW / 2) - 4;
  const halfH = Math.floor(availH / 2) - 4;
  const oneThirdW = Math.floor(availW / 3) - 6;
  const twoThirdsW = Math.floor((availW * 2) / 3) - 4;

  const w = Math.min(winSize.width || 850, availW);
  const h = Math.min(winSize.height || 580, availH);

  const otherOpenWins = Object.values(allWindows).filter(
    (ow) => ow.id !== winId && ow.isOpen && !ow.isMinimized
  );

  let detectedSnapZone: SnapZonePreview | null = null;
  const guides: AlignmentGuide[] = [];

  // ==========================================
  // 1. SCREEN EDGES & CORNERS SNAP ZONES
  // ==========================================
  // A. Top Edge -> Maximize
  if (mouse.clientY <= topbarHeight + 12) {
    detectedSnapZone = {
      id: 'snap-maximize',
      type: 'maximize',
      x: margin,
      y: topbarHeight,
      width: availW,
      height: availH,
      title: 'Развернуть во весь экран',
      subtitle: 'Отпустите для максимизации на всю рабочую область',
    };
  }
  // B. Top-Left Corner -> Quarter 1/4 (or 1/3 top left)
  else if (mouse.clientX <= 30 && mouse.clientY <= topbarHeight + 80) {
    detectedSnapZone = {
      id: 'snap-top-left',
      type: 'top-left',
      x: margin,
      y: topbarHeight,
      width: halfW,
      height: halfH,
      title: 'Левая верхняя четверть (1/4)',
      subtitle: 'Авто-подгонка под левый верхний угол',
    };
  }
  // C. Top-Right Corner -> Quarter 1/4
  else if (mouse.clientX >= screenWidth - 30 && mouse.clientY <= topbarHeight + 80) {
    detectedSnapZone = {
      id: 'snap-top-right',
      type: 'top-right',
      x: margin + halfW + 8,
      y: topbarHeight,
      width: halfW,
      height: halfH,
      title: 'Правая верхняя четверть (1/4)',
      subtitle: 'Авто-подгонка под правый верхний угол',
    };
  }
  // D. Bottom-Left Corner -> Quarter 1/4
  else if (mouse.clientX <= 30 && mouse.clientY >= screenHeight - 80) {
    detectedSnapZone = {
      id: 'snap-bottom-left',
      type: 'bottom-left',
      x: margin,
      y: topbarHeight + halfH + 8,
      width: halfW,
      height: halfH,
      title: 'Левая нижняя четверть (1/4)',
      subtitle: 'Авто-подгонка под левый нижний угол',
    };
  }
  // E. Bottom-Right Corner -> Quarter 1/4
  else if (mouse.clientX >= screenWidth - 30 && mouse.clientY >= screenHeight - 80) {
    detectedSnapZone = {
      id: 'snap-bottom-right',
      type: 'bottom-right',
      x: margin + halfW + 8,
      y: topbarHeight + halfH + 8,
      width: halfW,
      height: halfH,
      title: 'Правая нижняя четверть (1/4)',
      subtitle: 'Авто-подгонка под правый нижний угол',
    };
  }
  // F. Left Edge -> Left Half (or 1/3 if other window exists on right)
  else if (mouse.clientX <= 26) {
    detectedSnapZone = {
      id: 'snap-left-half',
      type: 'left-half',
      x: margin,
      y: topbarHeight,
      width: halfW,
      height: availH,
      title: 'Левая половина экрана (1/2)',
      subtitle: 'Авто-подгонка высоты и ширины слева',
    };
  }
  // G. Right Edge -> Right Half (or fills remaining width next to left window)
  else if (mouse.clientX >= screenWidth - 26) {
    // If there is an open window occupying the left side, adapt right half to fill remaining space!
    const leftOccupier = otherOpenWins.find(
      (ow) => ow.position.x <= margin + 30 && ow.size.width && ow.size.width < availW - 300
    );

    if (leftOccupier) {
      const leftW = (leftOccupier.size.width || halfW);
      const remainingW = screenWidth - margin - (margin + leftW + gap);
      detectedSnapZone = {
        id: 'snap-right-autofit',
        type: 'dock-right-autofit',
        x: margin + leftW + gap,
        y: topbarHeight,
        width: Math.max(340, remainingW),
        height: availH,
        title: 'Заполнить свободную правую часть',
        subtitle: `Стыковка с «${leftOccupier.title}» и подгонка под пустое место`,
        targetWindowName: leftOccupier.title,
      };
    } else {
      detectedSnapZone = {
        id: 'snap-right-half',
        type: 'right-half',
        x: margin + halfW + 8,
        y: topbarHeight,
        width: halfW,
        height: availH,
        title: 'Правая половина экрана (1/2)',
        subtitle: 'Авто-подгонка высоты и ширины справа',
      };
    }
  }

  // =========================================================================
  // 2. ADJACENT WINDOW PROXIMITY SNAP & AUTO-FIT (Стыковка к окну с авто-подгонкой)
  // =========================================================================
  if (!detectedSnapZone && otherOpenWins.length > 0) {
    for (const ow of otherOpenWins) {
      const owLeft = ow.position.x;
      const owRight = ow.position.x + (ow.size.width || 800);
      const owTop = ow.position.y;
      const owBottom = ow.position.y + (ow.size.height || 560);
      const owW = ow.size.width || 800;
      const owH = ow.size.height || 560;

      // Proximity to Right side of 'ow'
      const mouseNearOwRight =
        mouse.clientX >= owRight - 15 &&
        mouse.clientX <= owRight + 75 &&
        mouse.clientY >= owTop - 20 &&
        mouse.clientY <= owBottom + 20;

      if (mouseNearOwRight) {
        const startX = owRight + gap;
        const fillW = screenWidth - margin - startX;
        if (fillW >= 320) {
          detectedSnapZone = {
            id: `snap-dock-right-${ow.id}`,
            type: 'dock-right-autofit',
            x: startX,
            y: topbarHeight,
            width: fillW,
            height: availH,
            title: `Стыковка справа к «${ow.title}»`,
            subtitle: 'Автоматически занять всё оставшееся свободное пространство',
            targetWindowName: ow.title,
          };
          break;
        }
      }

      // Proximity to Left side of 'ow'
      const mouseNearOwLeft =
        mouse.clientX <= owLeft + 15 &&
        mouse.clientX >= owLeft - 75 &&
        mouse.clientY >= owTop - 20 &&
        mouse.clientY <= owBottom + 20;

      if (mouseNearOwLeft) {
        const fillW = owLeft - gap - margin;
        if (fillW >= 320) {
          detectedSnapZone = {
            id: `snap-dock-left-${ow.id}`,
            type: 'dock-left-autofit',
            x: margin,
            y: topbarHeight,
            width: fillW,
            height: availH,
            title: `Стыковка слева к «${ow.title}»`,
            subtitle: 'Автоматически занять всё свободное пространство слева',
            targetWindowName: ow.title,
          };
          break;
        }
      }

      // Proximity Below 'ow'
      const mouseNearOwBottom =
        mouse.clientY >= owBottom - 15 &&
        mouse.clientY <= owBottom + 70 &&
        mouse.clientX >= owLeft - 20 &&
        mouse.clientX <= owRight + 20;

      if (mouseNearOwBottom) {
        const startY = owBottom + gap;
        const fillH = screenHeight - margin - startY;
        if (fillH >= 220) {
          detectedSnapZone = {
            id: `snap-dock-bottom-${ow.id}`,
            type: 'dock-bottom-autofit',
            x: owLeft,
            y: startY,
            width: owW,
            height: fillH,
            title: `Стыковка снизу под «${ow.title}»`,
            subtitle: 'Автоматически подогнать высоту под оставшийся зазор',
            targetWindowName: ow.title,
          };
          break;
        }
      }
    }
  }

  // =========================================================================
  // 3. MAGNETIC ALIGNMENT & LASER GUIDES (Микро-привязка при перетаскивании)
  // =========================================================================
  let snappedX = rawPos.x;
  let snappedY = rawPos.y;
  const threshold = 16;

  const currLeft = rawPos.x;
  const currRight = rawPos.x + w;
  const currCenterX = rawPos.x + w / 2;
  const currTop = rawPos.y;
  const currBottom = rawPos.y + h;
  const currCenterY = rawPos.y + h / 2;

  // Align to Screen Edges
  if (Math.abs(currLeft - margin) < threshold) {
    snappedX = margin;
    guides.push({
      id: 'guide-screen-left',
      orientation: 'vertical',
      pos: margin,
      start: topbarHeight,
      end: screenHeight - margin,
      label: 'Левый край экрана',
      type: 'screen',
    });
  } else if (Math.abs(currRight - (screenWidth - margin)) < threshold) {
    snappedX = screenWidth - margin - w;
    guides.push({
      id: 'guide-screen-right',
      orientation: 'vertical',
      pos: screenWidth - margin,
      start: topbarHeight,
      end: screenHeight - margin,
      label: 'Правый край экрана',
      type: 'screen',
    });
  } else if (Math.abs(currCenterX - screenWidth / 2) < threshold) {
    snappedX = Math.round(screenWidth / 2 - w / 2);
    guides.push({
      id: 'guide-screen-center-x',
      orientation: 'vertical',
      pos: Math.round(screenWidth / 2),
      start: topbarHeight,
      end: screenHeight - margin,
      label: 'Центр экрана',
      type: 'center',
    });
  }

  if (Math.abs(currTop - topbarHeight) < threshold) {
    snappedY = topbarHeight;
    guides.push({
      id: 'guide-screen-top',
      orientation: 'horizontal',
      pos: topbarHeight,
      start: margin,
      end: screenWidth - margin,
      label: 'Верхняя панель',
      type: 'screen',
    });
  } else if (Math.abs(currBottom - (screenHeight - margin)) < threshold) {
    snappedY = screenHeight - margin - h;
    guides.push({
      id: 'guide-screen-bottom',
      orientation: 'horizontal',
      pos: screenHeight - margin,
      start: margin,
      end: screenWidth - margin,
      label: 'Нижний край экрана',
      type: 'screen',
    });
  }

  // Align with other windows
  let matchedX = false;
  let matchedY = false;

  for (const ow of otherOpenWins) {
    const owW = ow.size.width || 850;
    const owH = ow.size.height || 580;
    const owLeft = ow.position.x;
    const owRight = ow.position.x + owW;
    const owCenterX = owLeft + owW / 2;
    const owTop = ow.position.y;
    const owBottom = ow.position.y + owH;
    const owCenterY = owTop + owH / 2;

    if (!matchedX) {
      if (Math.abs(currLeft - owLeft) < threshold) {
        snappedX = owLeft;
        matchedX = true;
        guides.push({
          id: `guide-left-${ow.id}`,
          orientation: 'vertical',
          pos: owLeft,
          start: Math.min(currTop, owTop) - 20,
          end: Math.max(currBottom, owBottom) + 20,
          label: `По левому краю: ${ow.title}`,
          type: 'edge',
        });
      } else if (Math.abs(currRight - owRight) < threshold) {
        snappedX = owRight - w;
        matchedX = true;
        guides.push({
          id: `guide-right-${ow.id}`,
          orientation: 'vertical',
          pos: owRight,
          start: Math.min(currTop, owTop) - 20,
          end: Math.max(currBottom, owBottom) + 20,
          label: `По правому краю: ${ow.title}`,
          type: 'edge',
        });
      } else if (Math.abs(currLeft - (owRight + gap)) < threshold) {
        snappedX = owRight + gap;
        matchedX = true;
        guides.push({
          id: `guide-dock-right-${ow.id}`,
          orientation: 'vertical',
          pos: owRight + gap,
          start: Math.min(currTop, owTop) - 20,
          end: Math.max(currBottom, owBottom) + 20,
          label: `Стыковка справа к «${ow.title}»`,
          type: 'gap',
        });
      } else if (Math.abs(currRight - (owLeft - gap)) < threshold) {
        snappedX = owLeft - gap - w;
        matchedX = true;
        guides.push({
          id: `guide-dock-left-${ow.id}`,
          orientation: 'vertical',
          pos: owLeft - gap,
          start: Math.min(currTop, owTop) - 20,
          end: Math.max(currBottom, owBottom) + 20,
          label: `Стыковка слева к «${ow.title}»`,
          type: 'gap',
        });
      } else if (Math.abs(currCenterX - owCenterX) < threshold) {
        snappedX = Math.round(owCenterX - w / 2);
        matchedX = true;
        guides.push({
          id: `guide-center-x-${ow.id}`,
          orientation: 'vertical',
          pos: Math.round(owCenterX),
          start: Math.min(currTop, owTop) - 20,
          end: Math.max(currBottom, owBottom) + 20,
          label: `По центру: ${ow.title}`,
          type: 'center',
        });
      }
    }

    if (!matchedY) {
      if (Math.abs(currTop - owTop) < threshold) {
        snappedY = owTop;
        matchedY = true;
        guides.push({
          id: `guide-top-${ow.id}`,
          orientation: 'horizontal',
          pos: owTop,
          start: Math.min(currLeft, owLeft) - 20,
          end: Math.max(currRight, owRight) + 20,
          label: `По верху: ${ow.title}`,
          type: 'edge',
        });
      } else if (Math.abs(currBottom - owBottom) < threshold) {
        snappedY = owBottom - h;
        matchedY = true;
        guides.push({
          id: `guide-bottom-${ow.id}`,
          orientation: 'horizontal',
          pos: owBottom,
          start: Math.min(currLeft, owLeft) - 20,
          end: Math.max(currRight, owRight) + 20,
          label: `По низу: ${ow.title}`,
          type: 'edge',
        });
      } else if (Math.abs(currTop - (owBottom + gap)) < threshold) {
        snappedY = owBottom + gap;
        matchedY = true;
        guides.push({
          id: `guide-dock-below-${ow.id}`,
          orientation: 'horizontal',
          pos: owBottom + gap,
          start: Math.min(currLeft, owLeft) - 20,
          end: Math.max(currRight, owRight) + 20,
          label: `Стыковка под «${ow.title}»`,
          type: 'gap',
        });
      } else if (Math.abs(currBottom - (owTop - gap)) < threshold) {
        snappedY = owTop - gap - h;
        matchedY = true;
        guides.push({
          id: `guide-dock-above-${ow.id}`,
          orientation: 'horizontal',
          pos: owTop - gap,
          start: Math.min(currLeft, owLeft) - 20,
          end: Math.max(currRight, owRight) + 20,
          label: `Стыковка над «${ow.title}»`,
          type: 'gap',
        });
      } else if (Math.abs(currCenterY - owCenterY) < threshold) {
        snappedY = Math.round(owCenterY - h / 2);
        matchedY = true;
        guides.push({
          id: `guide-center-y-${ow.id}`,
          orientation: 'horizontal',
          pos: Math.round(owCenterY),
          start: Math.min(currLeft, owLeft) - 20,
          end: Math.max(currRight, owRight) + 20,
          label: `По центру: ${ow.title}`,
          type: 'center',
        });
      }
    }
  }

  const safeX = Math.max(margin, Math.min(screenWidth - 100, snappedX));
  const safeY = Math.max(topbarHeight, Math.min(screenHeight - 80, snappedY));

  return {
    snappedPos: { x: safeX, y: safeY },
    activeSnapZone: detectedSnapZone,
    alignmentGuides: guides,
  };
}

/**
 * Intelligent Smart Mosaic (Non-overlapping Bento tiling for all open windows)
 */
export function generateSmartMosaicLayout(
  openWindows: WindowState[],
  screenWidth: number,
  screenHeight: number,
  topbarHeight: number = 44,
  margin: number = 12,
  gap: number = 10
): Record<string, { position: { x: number; y: number }; size: { width: number; height: number } }> {
  const result: Record<string, { position: { x: number; y: number }; size: { width: number; height: number } }> = {};
  const count = openWindows.length;
  if (count === 0) return result;

  const availW = screenWidth - margin * 2;
  const availH = screenHeight - topbarHeight - margin;

  if (count === 1) {
    result[openWindows[0].id] = {
      position: { x: margin, y: topbarHeight },
      size: { width: availW, height: availH },
    };
    return result;
  }

  if (count === 2) {
    const halfW = Math.floor((availW - gap) / 2);
    result[openWindows[0].id] = {
      position: { x: margin, y: topbarHeight },
      size: { width: halfW, height: availH },
    };
    result[openWindows[1].id] = {
      position: { x: margin + halfW + gap, y: topbarHeight },
      size: { width: halfW, height: availH },
    };
    return result;
  }

  if (count === 3) {
    // 1 Major on left (50%), 2 stacked on right (50% each)
    const halfW = Math.floor((availW - gap) / 2);
    const halfH = Math.floor((availH - gap) / 2);

    result[openWindows[0].id] = {
      position: { x: margin, y: topbarHeight },
      size: { width: halfW, height: availH },
    };
    result[openWindows[1].id] = {
      position: { x: margin + halfW + gap, y: topbarHeight },
      size: { width: halfW, height: halfH },
    };
    result[openWindows[2].id] = {
      position: { x: margin + halfW + gap, y: topbarHeight + halfH + gap },
      size: { width: halfW, height: halfH },
    };
    return result;
  }

  if (count === 4) {
    // 2x2 Grid
    const halfW = Math.floor((availW - gap) / 2);
    const halfH = Math.floor((availH - gap) / 2);

    openWindows.slice(0, 4).forEach((w, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      result[w.id] = {
        position: { x: margin + col * (halfW + gap), y: topbarHeight + row * (halfH + gap) },
        size: { width: halfW, height: halfH },
      };
    });
    return result;
  }

  // 5+ Windows: 3 columns or dynamic grid
  const cols = count <= 6 ? 3 : 4;
  const rows = Math.ceil(count / cols);
  const colW = Math.floor((availW - (cols - 1) * gap) / cols);
  const rowH = Math.floor((availH - (rows - 1) * gap) / rows);

  openWindows.forEach((w, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    result[w.id] = {
      position: { x: margin + col * (colW + gap), y: topbarHeight + row * (rowH + gap) },
      size: { width: colW, height: rowH },
    };
  });

  return result;
}
