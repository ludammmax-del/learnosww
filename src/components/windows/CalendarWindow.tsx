import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Sliders, 
  Sparkles, 
  CheckCircle2, 
  Play, 
  Users, 
  PhoneCall, 
  ArrowRight, 
  Download, 
  Timer, 
  Check, 
  Bot,
  GripVertical
} from 'lucide-react';
import { DAGNode, ScheduledLessonSlot, WeeklyResourceConfig, PeerPartner } from '../../types.ts';
import { playChime } from '../../utils/audio.ts';
import { 
  parseWeeklyResource, 
  generateCurriculumSchedule, 
  formatDateKey, 
  exportScheduleToIcs 
} from '../../services/calendarScheduleEngine.ts';

interface CalendarWindowProps {
  nodes: DAGNode[];
  onLaunchUnit: (unitId: string) => void;
  onStartCallWithPartner?: (partnerData: any) => void;
  partner?: PeerPartner | null;
  weeklyResourceInput?: string;
  onUpdateWeeklyResource?: (resource: string) => void;
  onMarkLessonCompleted?: (unitId: string) => void;
  skillDomain?: string;
}

type CalendarViewMode = 'week' | 'month' | 'day' | 'agenda';

export const CalendarWindow: React.FC<CalendarWindowProps> = ({
  nodes,
  onLaunchUnit,
  onStartCallWithPartner,
  partner,
  weeklyResourceInput: initialWeeklyResource,
  onUpdateWeeklyResource,
  onMarkLessonCompleted,
  skillDomain = 'Универсальные навыки',
}) => {
  // 1. Weekly Resource State
  const [weeklyResourceText, setWeeklyResourceText] = useState<string>(() => {
    return initialWeeklyResource || localStorage.getItem('learning_os_time_resource') || '3 раза в неделю по 45 мин + суббота 2 часа';
  });

  const resourceConfig: WeeklyResourceConfig = useMemo(() => {
    return parseWeeklyResource(weeklyResourceText);
  }, [weeklyResourceText]);

  // 2. Schedule Generation & Local Modifications
  const [scheduleSlots, setScheduleSlots] = useState<ScheduledLessonSlot[]>(() => {
    const cached = localStorage.getItem('learning_os_cached_schedule');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return generateCurriculumSchedule(nodes, weeklyResourceText);
  });

  // Drag & Drop State
  const [draggedSlotId, setDraggedSlotId] = useState<string | null>(null);
  const [dragOverDateKey, setDragOverDateKey] = useState<string | null>(null);
  const [dragToast, setDragToast] = useState<string | null>(null);

  // Re-generate if nodes or resource changed significantly
  const handleRegenerateSchedule = (customText?: string) => {
    const textToUse = customText || weeklyResourceText;
    const newSlots = generateCurriculumSchedule(nodes, textToUse);
    setScheduleSlots(newSlots);
    try {
      localStorage.setItem('learning_os_cached_schedule', JSON.stringify(newSlots));
      localStorage.setItem('learning_os_time_resource', textToUse);
    } catch {}
    if (onUpdateWeeklyResource) onUpdateWeeklyResource(textToUse);
    playChime('success');
  };

  // 3. Calendar View & Current Date Navigation
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [isResourceModalOpen, setIsResourceModalOpen] = useState<boolean>(false);
  const [tempResourceInput, setTempResourceInput] = useState<string>(weeklyResourceText);
  const [icsExportSuccess, setIcsExportSuccess] = useState<boolean>(false);

  // Helper: Get start of current viewed week (Monday)
  const currentWeekMonday = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff));
    mon.setHours(0, 0, 0, 0);
    return mon;
  }, [currentDate]);

  // Days of the viewed week (Mon-Sun)
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekMonday);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentWeekMonday]);

  // Filtered Slots
  const filteredSlots = useMemo(() => {
    if (filterType === 'all') return scheduleSlots;
    if (filterType === 'pair') return scheduleSlots.filter((s) => s.isPairWork || s.type === 'pair');
    if (filterType === 'project') return scheduleSlots.filter((s) => s.type === 'project');
    if (filterType === 'theory') return scheduleSlots.filter((s) => s.type === 'theory');
    if (filterType === 'completed') return scheduleSlots.filter((s) => s.status === 'completed');
    return scheduleSlots;
  }, [scheduleSlots, filterType]);

  // Map slots by date key for rapid calendar lookup
  const slotsByDate = useMemo(() => {
    const map: Record<string, ScheduledLessonSlot[]> = {};
    filteredSlots.forEach((slot) => {
      if (!map[slot.date]) map[slot.date] = [];
      map[slot.date].push(slot);
    });
    return map;
  }, [filteredSlots]);

  // Statistics for this week
  const weekStats = useMemo(() => {
    let countThisWeek = 0;
    let completedThisWeek = 0;
    let minutesThisWeek = 0;

    weekDays.forEach((d) => {
      const key = formatDateKey(d);
      const daySlots = slotsByDate[key] || [];
      daySlots.forEach((s) => {
        countThisWeek++;
        minutesThisWeek += s.durationMin;
        if (s.status === 'completed') completedThisWeek++;
      });
    });

    const hoursThisWeek = (minutesThisWeek / 60).toFixed(1);
    const totalCompleted = scheduleSlots.filter((s) => s.status === 'completed').length;
    return {
      countThisWeek,
      completedThisWeek,
      hoursThisWeek,
      totalCompleted,
      totalCount: scheduleSlots.length,
    };
  }, [weekDays, slotsByDate, scheduleSlots]);

  const selectedSlot = useMemo(() => {
    return scheduleSlots.find((s) => s.id === selectedSlotId) || scheduleSlots[0] || null;
  }, [scheduleSlots, selectedSlotId]);

  // Move Slot to Target Date via Drag & Drop or Reschedule
  const handleMoveSlotToDate = (slotId: string, targetDateKey: string, targetDayOfWeek?: number) => {
    let movedSlotTitle = '';
    const updated = scheduleSlots.map((slot) => {
      if (slot.id === slotId) {
        movedSlotTitle = slot.title;
        const [y, m, d] = targetDateKey.split('-').map(Number);
        const dayIdx = typeof targetDayOfWeek === 'number' ? targetDayOfWeek : new Date(y, m - 1, d).getDay();
        return {
          ...slot,
          date: targetDateKey,
          dayOfWeek: dayIdx,
          status: 'rescheduled' as const,
        };
      }
      return slot;
    });

    setScheduleSlots(updated);
    try {
      localStorage.setItem('learning_os_cached_schedule', JSON.stringify(updated));
    } catch {}

    playChime('success');
    setDragToast(`Урок перенесен на ${targetDateKey}`);
    setTimeout(() => setDragToast(null), 3000);
  };

  // Navigation handlers
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'day') next.setDate(next.getDate() - 1);
    else if (viewMode === 'month') next.setMonth(next.getMonth() - 1);
    else next.setDate(next.getDate() - 7);
    setCurrentDate(next);
    playChime('click');
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'day') next.setDate(next.getDate() + 1);
    else if (viewMode === 'month') next.setMonth(next.getMonth() + 1);
    else next.setDate(next.getDate() + 7);
    setCurrentDate(next);
    playChime('click');
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    playChime('click');
  };

  // Reschedule slot by 1 day
  const handlePostponeSlot = (slotId: string, daysDelta: number = 1) => {
    const slot = scheduleSlots.find((s) => s.id === slotId);
    if (!slot) return;
    const d = new Date(slot.date);
    d.setDate(d.getDate() + daysDelta);
    handleMoveSlotToDate(slotId, formatDateKey(d), d.getDay());
  };

  // Toggle slot completion status
  const handleToggleComplete = (slotId: string) => {
    setScheduleSlots((prev) =>
      prev.map((s) => {
        if (s.id === slotId) {
          const nextStatus = s.status === 'completed' ? 'scheduled' : 'completed';
          if (nextStatus === 'completed' && onMarkLessonCompleted) {
            onMarkLessonCompleted(s.unitId);
          }
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );
    playChime('success');
  };

  // Export iCalendar .ics file
  const handleExportIcs = () => {
    const icsContent = exportScheduleToIcs(scheduleSlots, skillDomain);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `schedule-${skillDomain.toLowerCase().replace(/[^a-z0-9]/g, '-')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIcsExportSuccess(true);
    playChime('success');
    setTimeout(() => setIcsExportSuccess(false), 3000);
  };

  return (
    <div className="h-full flex flex-col select-none bg-white/95 backdrop-blur-2xl text-slate-800 overflow-hidden font-sans relative">
      
      {/* Drag Notification Toast */}
      {dragToast && (
        <div className="absolute top-15 left-1/2 -translate-x-1/2 z-40 px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-medium shadow-xl flex items-center space-x-1.5 animate-fade-in">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{dragToast}</span>
        </div>
      )}

      {/* 1. MINIMALIST CLEAN TOP BAR */}
      <div className="h-13 border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between bg-white/80 backdrop-blur-xl shrink-0">
        
        {/* Left: View Switcher & Title */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-xs text-slate-900">
              Календарь
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              · 200 уроков
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Minimalist View Switcher */}
          <div className="flex items-center bg-white/60 backdrop-blur-md p-1 rounded-2xl border border-slate-200/80 text-xs shadow-2xs gap-1">
            {(['week', 'month', 'day', 'agenda'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => { setViewMode(mode); playChime('click'); }}
                className={`px-3 py-1 rounded-xl text-[11px] font-medium transition cursor-pointer ${
                  viewMode === mode ? 'bg-slate-900 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                {mode === 'week' ? 'Неделя' : mode === 'month' ? 'Месяц' : mode === 'day' ? 'День' : 'Список'}
              </button>
            ))}
          </div>
        </div>

        {/* Center / Right: Minimalist Date Navigation & Actions */}
        <div className="flex items-center space-x-2">
          
          {/* Month / Week Nav */}
          <div className="flex items-center space-x-1 text-xs text-slate-700 bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-lg">
            <button
              type="button"
              onClick={handlePrev}
              className="p-0.5 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition cursor-pointer"
              title="Назад"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-1.5 font-medium hover:text-sky-600 transition cursor-pointer text-[11px]"
            >
              Сегодня
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-0.5 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition cursor-pointer"
              title="Вперед"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-slate-300">|</span>
            <span className="font-medium text-[11px] text-slate-800 px-1">
              {currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
            </span>
          </div>

          {/* Minimalist Filter */}
          <div className="hidden lg:flex items-center space-x-1 bg-slate-100/70 p-0.5 rounded-lg text-[11px]">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-2 py-0.5 rounded font-medium ${filterType === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
            >
              Все
            </button>
            <button
              type="button"
              onClick={() => setFilterType('pair')}
              className={`px-2 py-0.5 rounded font-medium flex items-center space-x-1 ${filterType === 'pair' ? 'bg-white text-emerald-700 font-semibold shadow-2xs' : 'text-slate-500'}`}
            >
              <Users className="w-2.5 h-2.5 text-emerald-600" />
              <span>Спарринги</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('project')}
              className={`px-2 py-0.5 rounded font-medium ${filterType === 'project' ? 'bg-white text-purple-700 font-semibold shadow-2xs' : 'text-slate-500'}`}
            >
              Проекты
            </button>
          </div>

          {/* Export to .ICS */}
          <button
            type="button"
            onClick={handleExportIcs}
            className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 border border-slate-200/80 text-slate-600 text-xs font-medium transition cursor-pointer"
            title="Экспортировать расписание в Apple Calendar / Google Calendar (.ics)"
          >
            {icsExportSuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Download className="w-3.5 h-3.5 text-slate-400" />}
            <span className="text-[11px]">{icsExportSuccess ? 'Скачано' : 'Экспорт'}</span>
          </button>

          {/* Resource Setting Button */}
          <button
            type="button"
            onClick={() => {
              setTempResourceInput(weeklyResourceText);
              setIsResourceModalOpen(true);
              playChime('click');
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition cursor-pointer shadow-2xs"
          >
            <Sliders className="w-3 h-3 text-sky-400" />
            <span className="text-[11px]">Ресурс времени</span>
          </button>
        </div>
      </div>

      {/* 2. SUBTLE MINIMALIST INFO STRIP */}
      <div className="px-6 py-2 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center space-x-2.5 text-[11px]">
          <div className="flex items-center space-x-1.5 text-slate-800 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{resourceConfig.hoursPerWeek} ч / неделю</span>
          </div>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500 truncate max-w-xs">
            {resourceConfig.rawInput}
          </span>
          <span className="text-slate-300 hidden md:inline">·</span>
          <div className="hidden md:flex items-center space-x-1 text-slate-600 text-[11px]">
            <Sparkles className="w-3 h-3 text-sky-500" />
            <span>Финиш: {resourceConfig.targetCompletionDate} ({resourceConfig.targetWeeksCount} нед)</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-[11px] text-slate-500 font-mono">
          <span>На неделе: <strong className="text-slate-900 font-semibold">{weekStats.completedThisWeek}/{weekStats.countThisWeek}</strong></span>
          <span className="text-slate-300">|</span>
          <span>Всего пройдено: <strong className="text-slate-900 font-semibold">{weekStats.totalCompleted}/{weekStats.totalCount}</strong></span>
        </div>
      </div>

      {/* 3. MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* VIEW 1: WEEK COLUMN GRID WITH DRAG & DROP */}
        {viewMode === 'week' && (
          <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
            {/* Week Header Row */}
            <div className="grid grid-cols-7 border-b border-slate-100 bg-white shrink-0 sticky top-0 z-10">
              {weekDays.map((day, idx) => {
                const isToday = formatDateKey(day) === formatDateKey(new Date());
                const dayName = day.toLocaleDateString('ru-RU', { weekday: 'short' });
                const dayNum = day.getDate();
                const key = formatDateKey(day);
                const daySlots = slotsByDate[key] || [];

                return (
                  <div
                    key={idx}
                    className={`py-2 px-2 text-center border-r border-slate-100 last:border-r-0 ${
                      isToday ? 'bg-sky-50/40' : 'bg-white'
                    }`}
                  >
                    <div className="text-[10px] font-medium uppercase text-slate-400">
                      {dayName}
                    </div>
                    <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold mt-0.5 ${
                      isToday ? 'bg-sky-600 text-white' : 'text-slate-800'
                    }`}>
                      {dayNum}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {daySlots.length > 0 ? `${daySlots.length}` : '—'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Week Columns (Drop Targets) */}
            <div className="grid grid-cols-7 flex-1 min-h-[500px] divide-x divide-slate-100 bg-slate-50/30 p-2 gap-1.5">
              {weekDays.map((day, idx) => {
                const dateKey = formatDateKey(day);
                const daySlots = slotsByDate[dateKey] || [];
                const isDragOverThisColumn = dragOverDateKey === dateKey;

                return (
                  <div
                    key={idx}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverDateKey !== dateKey) setDragOverDateKey(dateKey);
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setDragOverDateKey(dateKey);
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setDragOverDateKey(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const slotId = e.dataTransfer.getData('text/plain') || draggedSlotId;
                      if (slotId) {
                        handleMoveSlotToDate(slotId, dateKey, day.getDay());
                      }
                      setDraggedSlotId(null);
                      setDragOverDateKey(null);
                    }}
                    className={`flex flex-col space-y-1.5 min-h-full rounded-xl transition-colors duration-150 p-1 ${
                      isDragOverThisColumn ? 'bg-sky-100/60 ring-2 ring-sky-400 ring-inset' : ''
                    }`}
                  >
                    {isDragOverThisColumn && (
                      <div className="py-2.5 px-2 border-2 border-dashed border-sky-400 bg-sky-50 rounded-lg text-center text-[10px] font-semibold text-sky-700 animate-pulse">
                        + Перенести сюда
                      </div>
                    )}

                    {daySlots.length === 0 && !isDragOverThisColumn ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-8 text-slate-300 text-[10px] border border-dashed border-slate-200/60 rounded-lg">
                        <span>—</span>
                      </div>
                    ) : (
                      daySlots.map((slot) => {
                        const isSelected = selectedSlot?.id === slot.id;
                        const isCompleted = slot.status === 'completed';
                        const isPair = slot.isPairWork || slot.type === 'pair';
                        const isProject = slot.type === 'project';
                        const isBeingDragged = draggedSlotId === slot.id;

                        return (
                          <div
                            key={slot.id}
                            draggable={true}
                            onDragStart={(e) => {
                              setDraggedSlotId(slot.id);
                              e.dataTransfer.setData('text/plain', slot.id);
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragEnd={() => {
                              setDraggedSlotId(null);
                              setDragOverDateKey(null);
                            }}
                            onClick={() => {
                              setSelectedSlotId(slot.id);
                              playChime('click');
                            }}
                            className={`p-2.5 rounded-lg transition cursor-grab active:cursor-grabbing text-left border relative group select-none ${
                              isBeingDragged ? 'opacity-35 scale-95 border-dashed border-sky-400' : ''
                            } ${
                              isSelected
                                ? 'ring-1 ring-sky-500 shadow-xs bg-white border-sky-300'
                                : 'bg-white hover:bg-slate-50/80 border-slate-200/70 hover:shadow-2xs'
                            } ${
                              isCompleted
                                ? 'opacity-80 bg-emerald-50/20 border-emerald-200/60'
                                : isPair
                                ? 'border-emerald-300/80 bg-emerald-50/30'
                                : isProject
                                ? 'border-purple-200/80 bg-purple-50/20'
                                : ''
                            }`}
                            title="Потяните, чтобы перенести урок на другой день"
                          >
                            {/* Time, Grip Icon & Type Tag */}
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                              <div className="flex items-center space-x-1">
                                <GripVertical className="w-2.5 h-2.5 text-slate-300 group-hover:text-slate-500" />
                                <span className="font-medium text-slate-600">
                                  {slot.startTime}
                                </span>
                              </div>

                              {isCompleted ? (
                                <span className="text-emerald-600 font-semibold flex items-center space-x-0.5">
                                  <Check className="w-3 h-3" />
                                </span>
                              ) : isPair ? (
                                <span className="text-emerald-700 font-semibold text-[9px]">
                                  Спарринг
                                </span>
                              ) : isProject ? (
                                <span className="text-purple-700 font-semibold text-[9px]">
                                  Проект
                                </span>
                              ) : (
                                <span>{slot.durationMin}м</span>
                              )}
                            </div>

                            {/* Title */}
                            <h4 className="text-xs font-medium text-slate-900 line-clamp-2 leading-snug">
                              {slot.title}
                            </h4>

                            {/* Partner badge if pair */}
                            {isPair && slot.pairPartnerName && (
                              <div className="mt-1 text-[10px] text-emerald-700 truncate">
                                с {slot.pairPartnerName}
                              </div>
                            )}

                            {/* Quick Action footer */}
                            <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleComplete(slot.id);
                                }}
                                className={`text-[10px] transition cursor-pointer ${
                                  isCompleted ? 'text-emerald-600 font-medium' : 'text-slate-400 hover:text-slate-700'
                                }`}
                              >
                                {isCompleted ? 'Сдано ✓' : 'Сдать'}
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onLaunchUnit(slot.unitId);
                                  playChime('success');
                                }}
                                className="text-slate-600 hover:text-sky-600 font-medium flex items-center space-x-0.5 cursor-pointer"
                              >
                                <span>Открыть</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: LIST VIEW */}
        {viewMode === 'agenda' && (
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-white">
            <div className="max-w-3xl mx-auto space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                  Список уроков курса
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {filteredSlots.length} слотов
                </span>
              </div>

              <div className="space-y-1.5">
                {filteredSlots.slice(0, 50).map((slot) => {
                  const isCompleted = slot.status === 'completed';
                  const isPair = slot.isPairWork || slot.type === 'pair';

                  return (
                    <div
                      key={slot.id}
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={`p-3 rounded-lg border transition flex items-center justify-between gap-3 cursor-pointer ${
                        selectedSlot?.id === slot.id ? 'border-sky-400 bg-sky-50/20' : 'hover:bg-slate-50/80 bg-white border-slate-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleComplete(slot.id);
                          }}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                            isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          {isCompleted && <Check className="w-3 h-3" />}
                        </button>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-xs text-slate-900">
                              {slot.title}
                            </span>
                            {isPair && (
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 font-medium px-1.5 py-0.5 rounded">
                                Спарринг
                              </span>
                            )}
                            {slot.type === 'project' && (
                              <span className="text-[10px] text-purple-700 bg-purple-50 font-medium px-1.5 py-0.5 rounded">
                                Проект
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {slot.location} · {slot.durationMin} мин
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 text-right font-mono text-xs text-slate-500">
                        <span>{slot.date} {slot.startTime}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onLaunchUnit(slot.unitId);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition cursor-pointer"
                        >
                          Открыть
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3 & 4: MONTH / DAY VIEWS */}
        {(viewMode === 'month' || viewMode === 'day') && (
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-50/40">
            <div className="max-w-3xl mx-auto space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {filteredSlots.slice(0, 16).map((slot) => (
                  <div
                    key={slot.id}
                    onClick={() => { setSelectedSlotId(slot.id); playChime('click'); }}
                    className="p-3.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs hover:border-slate-300 transition cursor-pointer space-y-1.5"
                  >
                    <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                      <span>{slot.date} ({slot.startTime})</span>
                      <span className="font-medium text-slate-600">{slot.durationMin} мин</span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-900">{slot.title}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{slot.subtitle}</p>
                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                      <span className="text-[11px] text-slate-500">{slot.location}</span>
                      <button
                        type="button"
                        onClick={() => onLaunchUnit(slot.unitId)}
                        className="text-slate-900 hover:text-sky-600 font-medium text-xs"
                      >
                        Запустить →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RIGHT MINIMALIST INSPECTOR DRAWER */}
        <div className="w-76 border-l border-slate-100 bg-white p-4 flex flex-col justify-between overflow-y-auto shrink-0">
          {selectedSlot ? (
            <div className="space-y-3.5 text-xs">
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase font-medium mb-0.5">
                  Урок · {selectedSlot.sprint}
                </div>
                <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                  {selectedSlot.title}
                </h3>
                <p className="text-slate-500 mt-1 text-[11px] leading-relaxed">
                  {selectedSlot.subtitle}
                </p>
              </div>

              {/* Metadata Card */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Время:</span>
                  <span className="font-mono text-slate-800 font-medium">
                    {selectedSlot.date}, {selectedSlot.startTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Длительность:</span>
                  <span className="font-mono text-slate-800">{selectedSlot.durationMin} мин</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Локация:</span>
                  <span className="text-slate-800 font-medium">{selectedSlot.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Статус:</span>
                  <span className={`font-medium ${selectedSlot.status === 'completed' ? 'text-emerald-600' : 'text-slate-700'}`}>
                    {selectedSlot.status === 'completed' ? 'Освоено ✓' : 'Запланировано'}
                  </span>
                </div>
              </div>

              {/* AI Advice */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 text-indigo-950 space-y-1">
                <div className="flex items-center space-x-1 font-medium text-[11px] text-indigo-900">
                  <Bot className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Совет ИИ:</span>
                </div>
                <p className="text-[11px] text-indigo-900/80 leading-relaxed">
                  {selectedSlot.aiRecommendation || 'Изучите теоретический блок и выполните практическое задание в Фокус-Студии.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-1.5 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePostponeSlot(selectedSlot.id, 1)}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium text-[11px] transition text-center cursor-pointer border border-slate-200/60"
                  >
                    +1 день
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(selectedSlot.id)}
                    className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium text-[11px] transition text-center cursor-pointer border border-emerald-200/60"
                  >
                    {selectedSlot.status === 'completed' ? 'Снять отметку' : 'Сдать урок ✓'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-300 text-xs">
              Выберите урок для просмотра деталей
            </div>
          )}

          {/* Launch Buttons */}
          {selectedSlot && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              {selectedSlot.isPairWork && onStartCallWithPartner && (
                <button
                  type="button"
                  onClick={() => {
                    playChime('success');
                    onStartCallWithPartner({
                      name: selectedSlot.pairPartnerName || partner?.name || 'Напарник P2P',
                      role: 'Напарник по спаррингу',
                      pairTask: {
                        topic: selectedSlot.title,
                        domain: skillDomain,
                      } as any,
                    });
                  }}
                  className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-2xs"
                >
                  <PhoneCall className="w-3.5 h-3.5 fill-current" />
                  <span>Начать парный созвон</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onLaunchUnit(selectedSlot.unitId)}
                className="w-full py-2.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-2xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Запустить в Фокус-Студии</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. MINIMALIST MODAL: TIME RESOURCE */}
      {isResourceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 border border-slate-200 shadow-xl space-y-4 text-left text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-semibold text-slate-900">
                  Недельный ресурс времени
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsResourceModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Укажите доступное время в неделю. Расписание всех 200 модулей курса автоматически пересчитается.
            </p>

            {/* Presets */}
            <div className="space-y-1">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                Готовые варианты:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: '3 раза в неделю по 45 мин + сб 2ч', hours: '4.25 ч/нед' },
                  { label: '5 дней в неделю по 1 часу', hours: '5 ч/нед' },
                  { label: '10 часов в неделю', hours: '10 ч/нед' },
                  { label: 'Выходные: сб и вс по 3 часа', hours: '6 ч/нед' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTempResourceInput(item.label);
                      playChime('click');
                    }}
                    className={`p-2 rounded-lg border text-left text-xs transition cursor-pointer ${
                      tempResourceInput === item.label
                        ? 'border-sky-500 bg-sky-50/50 text-slate-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-medium text-xs leading-tight">{item.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{item.hours}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600 block">
                Свой график:
              </label>
              <input
                type="text"
                value={tempResourceInput}
                onChange={(e) => setTempResourceInput(e.target.value)}
                placeholder="например: Пн, Ср по 1.5 часа, суббота 3 часа"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-slate-900"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsResourceModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  setWeeklyResourceText(tempResourceInput);
                  handleRegenerateSchedule(tempResourceInput);
                  setIsResourceModalOpen(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition cursor-pointer shadow-xs"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
