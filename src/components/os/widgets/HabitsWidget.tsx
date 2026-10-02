import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, 
  CheckSquare, 
  Square, 
  Award, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Sparkles, 
  X, 
  Calendar,
  Zap,
  Tag,
  Clock,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { HabitItem } from '../../../types.ts';
import { playChime } from '../../../utils/audio.ts';

interface HabitsWidgetProps {
  habits?: HabitItem[];
  onToggleHabit: (id: string) => void;
  onAddHabit?: (habit: HabitItem) => void;
  onDeleteHabit?: (id: string) => void;
  onUpdateHabit?: (habit: HabitItem) => void;
}

const HABIT_TEMPLATES = [
  { title: '30 мин глубокого фокуса (Deep Work)', category: 'focus', color: 'amber' },
  { title: 'Решить 1 практическую задачу / код', category: 'code', color: 'emerald' },
  { title: 'Повторение терминов (Active Recall)', category: 'practice', color: 'purple' },
  { title: 'Чтение технической документации', category: 'reading', color: 'sky' },
  { title: 'Синхронизация / ревью с напарником', category: 'review', color: 'rose' },
];

const CATEGORY_LABELS: Record<string, { label: string; color: string; badge: string }> = {
  focus: { label: 'Фокус', color: 'text-amber-600', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  code: { label: 'Код', color: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  practice: { label: 'Практика', color: 'text-purple-600', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  reading: { label: 'Чтение', color: 'text-sky-600', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  review: { label: 'Ревью', color: 'text-rose-600', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  custom: { label: 'Привычка', color: 'text-slate-600', badge: 'bg-slate-50 text-slate-700 border-slate-200' },
};

const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const HabitsWidget: React.FC<HabitsWidgetProps> = ({
  habits: propHabits = [],
  onToggleHabit,
  onAddHabit,
  onDeleteHabit,
  onUpdateHabit,
}) => {
  // Local state for immediate responsiveness
  const [habitsList, setHabitsList] = useState<HabitItem[]>(() => {
    try {
      const saved = localStorage.getItem('learning_os_habits_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    if (propHabits && propHabits.length > 0) return propHabits;
    return [
      {
        id: 'h-1',
        title: '30 мин глубокого фокуса без телефона',
        streak: 5,
        bestStreak: 12,
        completedToday: false,
        category: 'focus',
        color: 'amber',
        targetDaysPerWeek: 7,
      },
      {
        id: 'h-2',
        title: 'Решить 1 архитектурный кейс / тест',
        streak: 3,
        bestStreak: 7,
        completedToday: true,
        category: 'code',
        color: 'emerald',
        targetDaysPerWeek: 5,
      },
      {
        id: 'h-3',
        title: 'Конспектирование ключевых концепций',
        streak: 2,
        bestStreak: 4,
        completedToday: false,
        category: 'reading',
        color: 'sky',
        targetDaysPerWeek: 5,
      },
    ];
  });

  const [isCreating, setIsCreating] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<string>('focus');
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'completed'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync propHabits when provided from parent
  useEffect(() => {
    if (propHabits && propHabits.length > 0) {
      setHabitsList((prev) => {
        // Merge without losing extra metadata like categories/bestStreak
        const merged = propHabits.map((ph) => {
          const existing = prev.find((x) => x.id === ph.id);
          return {
            ...ph,
            category: ph.category || existing?.category || 'custom',
            bestStreak: ph.bestStreak || existing?.bestStreak || ph.streak,
            color: ph.color || existing?.color || 'amber',
          };
        });
        return merged;
      });
    }
  }, [propHabits]);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('learning_os_habits_v2', JSON.stringify(habitsList));
    } catch (e) {
      console.warn('Error saving habits to storage:', e);
    }
  }, [habitsList]);

  // Focus input on create
  useEffect(() => {
    if (isCreating) {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isCreating]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const completedTodayCount = habitsList.filter((h) => h.completedToday).length;
  const totalCount = habitsList.length;
  const progressPercent = totalCount > 0 ? Math.round((completedTodayCount / totalCount) * 100) : 0;
  const maxStreak = habitsList.reduce((max, h) => Math.max(max, h.streak), 0);

  // Toggle habit check-off
  const handleToggle = (id: string) => {
    const target = habitsList.find((h) => h.id === id);
    if (!target) return;

    const willBeCompleted = !target.completedToday;
    const newStreak = willBeCompleted ? target.streak + 1 : Math.max(0, target.streak - 1);
    const newBest = Math.max(target.bestStreak || 0, newStreak);

    const updatedList = habitsList.map((h) =>
      h.id === id
        ? {
            ...h,
            completedToday: willBeCompleted,
            streak: newStreak,
            bestStreak: newBest,
          }
        : h
    );

    setHabitsList(updatedList);
    onToggleHabit(id);

    if (willBeCompleted) {
      playChime('success');
      const allDone = updatedList.every((h) => h.completedToday);
      if (allDone && updatedList.length > 1) {
        triggerToast('🔥 Все привычки на сегодня закрыты! +150 XP');
      } else {
        triggerToast(`Привычка выполнена! Стрик: ${newStreak} дн 🔥`);
      }
    } else {
      playChime('click');
      triggerToast('Привычка отменена');
    }
  };

  // Add custom habit
  const handleAddSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    const newHabit: HabitItem = {
      id: `h-custom-${Date.now()}`,
      title,
      streak: 1,
      bestStreak: 1,
      completedToday: true,
      category: newCategory,
      color: 'amber',
      targetDaysPerWeek: 7,
      createdAt: new Date().toISOString(),
    };

    const updated = [newHabit, ...habitsList];
    setHabitsList(updated);
    if (onAddHabit) onAddHabit(newHabit);

    setNewTitle('');
    setIsCreating(false);
    setShowTemplates(false);
    playChime('success');
    triggerToast(`Привычка «${title.slice(0, 20)}...» добавлена!`);
  };

  // Add from template
  const handleAddFromTemplate = (template: typeof HABIT_TEMPLATES[0]) => {
    const newHabit: HabitItem = {
      id: `h-tpl-${Date.now()}`,
      title: template.title,
      streak: 0,
      bestStreak: 0,
      completedToday: false,
      category: template.category,
      color: template.color,
      targetDaysPerWeek: 7,
      createdAt: new Date().toISOString(),
    };

    const updated = [...habitsList, newHabit];
    setHabitsList(updated);
    if (onAddHabit) onAddHabit(newHabit);

    setShowTemplates(false);
    setIsCreating(false);
    playChime('success');
    triggerToast(`Шаблон «${template.title.slice(0, 20)}...» добавлен!`);
  };

  // Delete habit
  const handleDeleteHabit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = habitsList.filter((h) => h.id !== id);
    setHabitsList(updated);
    if (onDeleteHabit) onDeleteHabit(id);
    playChime('click');
    triggerToast('Привычка удалена');
  };

  // Filtered list
  const visibleHabits = habitsList.filter((h) => {
    if (filterMode === 'pending') return !h.completedToday;
    if (filterMode === 'completed') return h.completedToday;
    return true;
  });

  // Current day index for 7-day strip (0 = Mon, 6 = Sun)
  const todayDayIdx = (new Date().getDay() + 6) % 7;

  return (
    <div className="h-full flex flex-col justify-between p-3 text-slate-800 select-none text-xs bg-gradient-to-b from-white to-amber-50/20 relative">
      {/* Toast feedback pill */}
      {toastMessage && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 px-3 py-1 bg-slate-900/95 text-white text-[10px] font-medium rounded-full shadow-xl flex items-center space-x-1.5 animate-fade-in pointer-events-none backdrop-blur-md">
          <CheckCircle2 className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="truncate max-w-[200px]">{toastMessage}</span>
        </div>
      )}

      {/* 1. Header with Stats & Add Button */}
      <div className="flex items-center justify-between pb-1.5 border-b border-amber-100 gap-1.5 shrink-0">
        <div className="flex items-center space-x-1.5 font-bold text-slate-900 text-xs">
          <div className="w-5 h-5 rounded-md bg-amber-500/15 flex items-center justify-center text-amber-600">
            <Flame className="w-3.5 h-3.5 fill-current" />
          </div>
          <span>Стрики & Привычки</span>
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          {/* Streak Champion Badge */}
          {maxStreak > 0 && (
            <span
              className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-mono text-[10px] font-bold"
              title="Максимальный текущий стрик"
            >
              <Flame className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
              <span>{maxStreak}дн</span>
            </span>
          )}

          {/* Add Habit Button */}
          {!isCreating ? (
            <button
              type="button"
              onClick={() => {
                setIsCreating(true);
                playChime('click');
              }}
              className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[10px] transition cursor-pointer shadow-2xs"
              title="Добавить новую привычку"
            >
              <Plus className="w-3 h-3" />
              <span>+ Привычка</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setShowTemplates(false);
              }}
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Закрыть создание"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Progress Bar & 7-Day Mini Heatmap */}
      <div className="pt-1.5 pb-1 space-y-1.5 shrink-0">
        {/* Progress row */}
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-500 font-medium">
            Прогресс дня: <strong className="text-slate-800">{completedTodayCount}/{totalCount}</strong>
          </span>
          <span className="font-mono font-semibold text-amber-600">
            {progressPercent}%
          </span>
        </div>

        {/* Progress bar line */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-emerald-500 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* 7-Day Strip */}
        <div className="flex items-center justify-between pt-0.5 px-1 bg-amber-50/50 rounded-lg py-1 border border-amber-100/60 text-[9px] font-mono">
          {DAYS_SHORT.map((day, idx) => {
            const isToday = idx === todayDayIdx;
            const isPastOrToday = idx <= todayDayIdx;
            const isFullDay = isPastOrToday && progressPercent >= 100;
            return (
              <div key={day} className="flex flex-col items-center space-y-0.5">
                <span className={`${isToday ? 'font-bold text-amber-900' : 'text-slate-400'}`}>
                  {day}
                </span>
                <div
                  className={`w-2.5 h-2.5 rounded-full flex items-center justify-center transition ${
                    isToday
                      ? completedTodayCount > 0
                        ? 'bg-emerald-500 ring-2 ring-emerald-200'
                        : 'bg-amber-400 animate-pulse'
                      : isPastOrToday
                      ? 'bg-amber-300'
                      : 'bg-slate-200'
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. CREATION DRAWER vs HABITS LIST */}
      {isCreating ? (
        <div className="my-1 p-2 bg-white rounded-xl border border-amber-200 shadow-sm flex-1 flex flex-col justify-between overflow-y-auto">
          <form onSubmit={handleAddSubmit} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wide">
                Новая привычка
              </span>
              <button
                type="button"
                onClick={() => setShowTemplates((prev) => !prev)}
                className="text-[10px] font-semibold text-amber-600 hover:text-amber-700 transition cursor-pointer"
              >
                {showTemplates ? 'Своя формулировка' : '⚡ Из шаблонов'}
              </button>
            </div>

            {showTemplates ? (
              <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                {HABIT_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.title}
                    type="button"
                    onClick={() => handleAddFromTemplate(tpl)}
                    className="w-full text-left p-1.5 rounded-lg bg-amber-50/60 hover:bg-amber-100/80 border border-amber-200/60 text-[11px] font-medium text-slate-800 transition cursor-pointer truncate flex items-center justify-between"
                  >
                    <span className="truncate pr-1">{tpl.title}</span>
                    <Plus className="w-3 h-3 text-amber-600 shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <>
                <input
                  ref={inputRef}
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Название (напр. 20 мин практики кода)..."
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />

                {/* Category Selector */}
                <div className="flex items-center space-x-1 overflow-x-auto py-0.5 text-[10px]">
                  {Object.entries(CATEGORY_LABELS).map(([catKey, catObj]) => (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setNewCategory(catKey)}
                      className={`px-2 py-0.5 rounded-md transition cursor-pointer shrink-0 font-medium ${
                        newCategory === catKey
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {catObj.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="flex items-center justify-end space-x-1.5 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-2 py-1 rounded text-slate-500 hover:bg-slate-100 text-[11px] transition cursor-pointer"
              >
                Отмена
              </button>
              {!showTemplates && (
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold text-[11px] transition cursor-pointer shadow-2xs"
                >
                  Добавить
                </button>
              )}
            </div>
          </form>
        </div>
      ) : (
        /* HABITS LIST */
        <div className="space-y-1.5 my-1.5 flex-1 overflow-y-auto pr-1 max-h-[140px]">
          {visibleHabits.length === 0 ? (
            <div className="text-center py-4 text-[11px] text-slate-400">
              {filterMode === 'completed'
                ? 'Пока нет выполненных привычек'
                : 'Список привычек пуст. Нажмите «+ Привычка»!'}
            </div>
          ) : (
            visibleHabits.map((h) => {
              const catInfo = CATEGORY_LABELS[h.category || 'custom'] || CATEGORY_LABELS.custom;
              return (
                <div
                  key={h.id}
                  onClick={() => handleToggle(h.id)}
                  className={`group flex items-center justify-between p-2 rounded-xl border transition-all duration-150 cursor-pointer ${
                    h.completedToday
                      ? 'bg-amber-50/90 border-amber-200/80 shadow-2xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200/80'
                  }`}
                >
                  {/* Left: Checkbox + Title + Category Badge */}
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(h.id);
                      }}
                      className="text-slate-400 hover:text-amber-600 transition shrink-0 cursor-pointer"
                    >
                      {h.completedToday ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 fill-emerald-50" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <span
                        className={`text-xs block truncate ${
                          h.completedToday
                            ? 'font-semibold text-slate-900 line-through opacity-85'
                            : 'font-medium text-slate-800'
                        }`}
                      >
                        {h.title}
                      </span>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className={`text-[9px] px-1 py-0.2 rounded border font-mono ${catInfo.badge}`}>
                          {catInfo.label}
                        </span>
                        {h.bestStreak && h.bestStreak > h.streak && (
                          <span className="text-[9px] text-slate-400 font-mono">
                            Рекорд: {h.bestStreak}дн
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Streak Flame Counter & Delete */}
                  <div className="flex items-center space-x-1.5 pl-2 shrink-0">
                    <div
                      className={`flex items-center space-x-0.5 font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                        h.completedToday
                          ? 'bg-amber-100 text-amber-950 font-extrabold'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                      title={`Стрик: ${h.streak} дней подряд`}
                    >
                      <Flame
                        className={`w-3 h-3 ${
                          h.streak > 0 ? 'fill-amber-500 text-amber-600' : 'text-slate-400'
                        }`}
                      />
                      <span>{h.streak}дн</span>
                    </div>

                    {/* Delete button visible on hover */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteHabit(h.id, e)}
                      className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Удалить привычку"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 4. Footer Motivation & Filter */}
      <div className="pt-1 border-t border-amber-100/80 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-1.5 py-0.5 rounded cursor-pointer transition ${
              filterMode === 'all' ? 'bg-amber-500/20 text-amber-950 font-bold' : 'hover:bg-slate-100'
            }`}
          >
            Все ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('pending')}
            className={`px-1.5 py-0.5 rounded cursor-pointer transition ${
              filterMode === 'pending' ? 'bg-amber-500/20 text-amber-950 font-bold' : 'hover:bg-slate-100'
            }`}
          >
            К выполнению ({totalCount - completedTodayCount})
          </button>
        </div>

        <div className="flex items-center space-x-1 text-amber-700 font-semibold font-mono">
          <Zap className="w-3 h-3 text-amber-500 fill-current" />
          <span>+{completedTodayCount * 50} XP</span>
        </div>
      </div>
    </div>
  );
};
