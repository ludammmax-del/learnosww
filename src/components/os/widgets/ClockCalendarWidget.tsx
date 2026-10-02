import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

export const ClockCalendarWidget: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');

  const dateStr = time.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // Simple mini calendar for current month
  const year = time.getFullYear();
  const month = time.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); // 0 is Sun
  const totalDays = new Date(year, month + 1, 0).getDate();
  const todayDate = time.getDate();

  // Adjust so Monday is 0
  const adjustedFirstDay = (firstDay + 6) % 7;

  const handleOpenCalendar = () => {
    window.dispatchEvent(
      new CustomEvent('learning_open_window', { detail: { windowId: 'calendar' } })
    );
  };

  return (
    <div 
      onClick={handleOpenCalendar}
      className="h-full flex flex-col justify-between p-3.5 text-slate-800 select-none text-xs cursor-pointer group hover:bg-slate-50/50 transition"
      title="Нажмите, чтобы открыть календарь и расписание уроков"
    >
      {/* Header & Date */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
        <div className="flex items-center space-x-1.5 font-semibold text-slate-900 text-xs group-hover:text-sky-600 transition-colors">
          <CalendarIcon className="w-3.5 h-3.5 text-sky-500" />
          <span>Календарь</span>
        </div>
        <span className="capitalize text-[11px] text-slate-500 font-medium">
          {dateStr}
        </span>
      </div>

      {/* Clock display */}
      <div className="flex items-baseline justify-center space-x-1 py-1 bg-slate-50/70 rounded-xl border border-slate-100 my-1">
        <span className="text-3xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
          {hours}:{minutes}
        </span>
        <span className="text-base font-semibold font-mono text-sky-500 tabular-nums">
          :{seconds}
        </span>
      </div>

      {/* Mini Calendar Weekday Strip & Days */}
      <div className="pt-1">
        <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-semibold text-slate-400 mb-1">
          <span>Пн</span>
          <span>Вт</span>
          <span>Ср</span>
          <span>Чт</span>
          <span>Пт</span>
          <span>Сб</span>
          <span>Вс</span>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono">
          {Array.from({ length: adjustedFirstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="p-0.5" />
          ))}
          {Array.from({ length: totalDays }).map((_, i) => {
            const dayNum = i + 1;
            const isToday = dayNum === todayDate;
            return (
              <div
                key={`day-${dayNum}`}
                className={`py-0.5 rounded transition ${
                  isToday
                    ? 'bg-sky-500 text-white font-bold shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {dayNum}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
