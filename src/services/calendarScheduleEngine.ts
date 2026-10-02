import { DAGNode, ScheduledLessonSlot, WeeklyResourceConfig, NodeType } from '../types.ts';

/**
 * Parses free-form text or presets for weekly time resource
 * Examples:
 * - "3 раза в неделю по 45 мин + суббота 2 часа" -> ~4.25 hrs/week, 4 sessions (Mon, Wed, Fri, Sat)
 * - "10 часов в неделю" -> 10 hrs/week, 5 sessions
 * - "каждый день по 1 часу" -> 7 hrs/week, 7 sessions
 */
export function parseWeeklyResource(rawInput?: string, totalCourseHours?: number): WeeklyResourceConfig {
  const text = (rawInput || '').toLowerCase().trim();

  let hoursPerWeek = 6;
  let sessionsPerWeek = 4;
  let preferredDays = [1, 3, 5, 6]; // Mon, Wed, Fri, Sat
  let preferredTimeOfDay: 'morning' | 'day' | 'evening' | 'flexible' = 'evening';
  let intensity: 'light' | 'standard' | 'accelerated' | 'hardcore' = 'standard';

  // Check composite patterns first before single regex match
  if (text.includes('каждый день') || text.includes('ежедневно') || text.includes('7 дней')) {
    preferredDays = [1, 2, 3, 4, 5, 6, 0];
    sessionsPerWeek = 7;
    hoursPerWeek = text.includes('2 час') ? 14 : text.includes('30 мин') ? 3.5 : 7;
  } else if (text.includes('5 раз') || text.includes('будни')) {
    preferredDays = [1, 2, 3, 4, 5];
    sessionsPerWeek = 5;
    hoursPerWeek = text.includes('2 час') ? 10 : 6;
  } else if (text.includes('3 раза') || text.includes('3 дня')) {
    preferredDays = [1, 3, 5];
    sessionsPerWeek = 3;
    if (text.includes('суббот')) {
      preferredDays.push(6);
      sessionsPerWeek = 4;
      hoursPerWeek = text.includes('45 мин') ? (3 * 0.75 + 2) : 5.5; // ~4.25h
    } else {
      hoursPerWeek = text.includes('45 мин') ? 2.25 : 4;
    }
  } else if (text.includes('2 раза') || text.includes('выходны')) {
    preferredDays = [6, 0];
    sessionsPerWeek = 2;
    hoursPerWeek = 4;
  } else {
    // Extract hours if explicitly specified, e.g. "15 часов", "10 ч", "20 hours"
    const hourMatch = text.match(/(\d+[\.,]?\d*)\s*(ч|час|hour|h)/i);
    if (hourMatch && hourMatch[1]) {
      const val = parseFloat(hourMatch[1].replace(',', '.'));
      if (!isNaN(val) && val > 0 && val <= 60) {
        hoursPerWeek = val;
      }
    }
  }

  // Intensity categorization
  if (hoursPerWeek <= 3.5) intensity = 'light';
  else if (hoursPerWeek <= 7) intensity = 'standard';
  else if (hoursPerWeek <= 14) intensity = 'accelerated';
  else intensity = 'hardcore';

  // Target weeks calculation based on real course hours or fallback
  const totalEstimatedHours = totalCourseHours && totalCourseHours > 0 ? totalCourseHours : 95;
  const targetWeeksCount = Math.max(1, Math.ceil(totalEstimatedHours / Math.max(1, hoursPerWeek)));

  const finishDate = new Date();
  finishDate.setDate(finishDate.getDate() + targetWeeksCount * 7);
  const targetCompletionDate = finishDate.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return {
    rawInput: rawInput || '3 раза в неделю по 45 мин + суббота 2 часа',
    hoursPerWeek,
    sessionsPerWeek,
    preferredDays,
    preferredTimeOfDay,
    intensity,
    targetWeeksCount,
    targetCompletionDate,
  };
}

/**
 * Format Date to YYYY-MM-DD
 */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Generate full Schedule for Curriculum Nodes
 */
export function generateCurriculumSchedule(
  nodes: DAGNode[],
  weeklyResourceInput?: string,
  startDateInput?: Date
): ScheduledLessonSlot[] {
  // Calculate total course load in hours from actual nodes
  const totalCourseHours = Math.round(
    nodes.reduce((acc, n) => acc + (n.estimatedTimeMin || 28), 0) / 60
  );

  const config = parseWeeklyResource(weeklyResourceInput, totalCourseHours);
  const schedule: ScheduledLessonSlot[] = [];

  // Start from current week's Monday or provided date
  const startDate = startDateInput ? new Date(startDateInput) : new Date();
  startDate.setHours(0, 0, 0, 0);

  const daysPattern = config.preferredDays.length > 0 ? config.preferredDays : [1, 3, 5, 6];
  let currentDate = new Date(startDate);
  let nodeIndex = 0;

  // Typical slot time templates
  const timeSlotsByDay: Record<number, Array<{ start: string; end: string; duration: number }>> = {
    1: [{ start: '09:00', end: '09:45', duration: 45 }, { start: '19:00', end: '19:45', duration: 45 }], // Mon
    2: [{ start: '19:00', end: '19:45', duration: 45 }], // Tue
    3: [{ start: '09:00', end: '09:45', duration: 45 }, { start: '19:00', end: '19:45', duration: 45 }], // Wed
    4: [{ start: '19:00', end: '19:45', duration: 45 }], // Thu
    5: [{ start: '09:00', end: '09:45', duration: 45 }, { start: '18:30', end: '19:30', duration: 60 }], // Fri
    6: [{ start: '11:00', end: '12:30', duration: 90 }, { start: '14:00', end: '15:30', duration: 90 }], // Sat
    0: [{ start: '12:00', end: '13:30', duration: 90 }], // Sun
  };

  const partnerNames = ['@alex_dev', '@sofia_arch', '@max_lead', '@elena_qa', '@danil_ml'];

  let sessionsScheduledThisWeek = 0;
  let lastEvaluatedWeek = -1;

  // Safety limit: max 400 days
  let safetyLoop = 0;
  while (nodeIndex < nodes.length && safetyLoop < 400) {
    safetyLoop++;
    const dayOfWeek = currentDate.getDay();

    // Reset weekly sessions counter on Monday (1)
    if (dayOfWeek === 1 && lastEvaluatedWeek !== safetyLoop) {
      sessionsScheduledThisWeek = 0;
      lastEvaluatedWeek = safetyLoop;
    }

    if (daysPattern.includes(dayOfWeek) && sessionsScheduledThisWeek < config.sessionsPerWeek) {
      const availableSlots = timeSlotsByDay[dayOfWeek] || [{ start: '19:00', end: '19:45', duration: 45 }];

      for (let s = 0; s < availableSlots.length && nodeIndex < nodes.length && sessionsScheduledThisWeek < config.sessionsPerWeek; s++) {
        const node = nodes[nodeIndex];
        const slotTpl = availableSlots[s];
        const dateKey = formatDateKey(currentDate);

        const isPair = node.type === 'pair' || Boolean((node as any).isPairWork);
        const isProject = node.type === 'project';
        const isCompleted = node.status === 'completed';

        let location: ScheduledLessonSlot['location'] = 'Фокус-Студия';
        if (isPair) location = 'P2P Видеокомната';
        else if (isProject) location = 'IDE Практика';

        const partnerName = isPair 
          ? (node as any).pairTask?.partnerName || partnerNames[nodeIndex % partnerNames.length]
          : undefined;

        const aiRecommendation = isPair
          ? `ИИ-Агенты запланировали парный спарринг со сменой ролей с ${partnerName}.`
          : isProject
          ? `Боевой инженерный проект. Рекомендуется выделить непрерывный блок фокуса.`
          : `Теория и экспресс-тест. Оптимально пройти в утренний слот.`;

        // Calculate dynamic endTime based on startTime + actual lesson duration
        const durationMin = node.estimatedTimeMin || slotTpl.duration;
        const [startHour, startMin] = slotTpl.start.split(':').map(Number);
        const totalMinutes = startHour * 60 + startMin + durationMin;
        const endHour = Math.min(23, Math.floor(totalMinutes / 60));
        const endMinutes = totalMinutes % 60;
        const calculatedEndTime = `${String(endHour).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

        schedule.push({
          id: `slot-${node.id}-${dateKey}-${s}`,
          unitId: node.unitId || node.id,
          nodeId: node.id,
          title: node.title,
          subtitle: node.subtitle,
          type: node.type,
          sprint: node.sprint,
          phase: node.phase,
          phaseTitle: node.phaseTitle,
          date: dateKey,
          dayOfWeek,
          startTime: slotTpl.start,
          endTime: calculatedEndTime,
          durationMin,
          status: isCompleted ? 'completed' : 'scheduled',
          isPairWork: isPair,
          pairPartnerName: partnerName,
          aiRecommendation,
          location,
          completedAt: isCompleted ? 'Завершено' : undefined,
        });

        nodeIndex++;
        sessionsScheduledThisWeek++;
      }
    }

    // Advance to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return schedule;
}

/**
 * Escapes characters per RFC 5545 iCalendar specification
 */
function escapeIcsText(str: string = ''): string {
  return str
    .replace(/[\\;,]/g, (match) => '\\' + match)
    .replace(/\r?\n/g, '\\n');
}

/**
 * Generate iCalendar .ics text for export to Apple Calendar / Google Calendar
 */
export function exportScheduleToIcs(slots: ScheduledLessonSlot[], skillDomain: string): string {
  const pad = (n: number) => String(n).padStart(2, '0');

  // RFC 5545 DTSTAMP must be in UTC Zulu time format
  const nowUtc = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Learning OS//Schedule Generator//RU',
    `X-WR-CALNAME:${escapeIcsText(`План обучения: ${skillDomain}`)}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  slots.forEach((slot) => {
    const [y, m, d] = slot.date.split('-').map(Number);
    const [startH, startM] = slot.startTime.split(':').map(Number);
    const [endH, endM] = slot.endTime.split(':').map(Number);

    const dtStart = `${y}${pad(m)}${pad(d)}T${pad(startH)}${pad(startM)}00`;
    const dtEnd = `${y}${pad(m)}${pad(d)}T${pad(endH)}${pad(endM)}00`;

    const summary = escapeIcsText(slot.title);
    const description = escapeIcsText(`${slot.subtitle || ''} | Локация: ${slot.location} | Рекомендация ИИ: ${slot.aiRecommendation || ''}`);
    const location = escapeIcsText(slot.location);

    ics.push(
      'BEGIN:VEVENT',
      `UID:${slot.id}@learning-os.internal`,
      `DTSTAMP:${nowUtc}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}
