import React, { useState } from 'react';
import { 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckSquare, 
  Plus, 
  Trash2, 
  FileText, 
  Flame, 
  Activity, 
  Award, 
  Layers 
} from 'lucide-react';
import { NoteItem, TaskItem, HabitItem } from '../../types.ts';
import { playChime } from '../../utils/audio.ts';

interface WidgetsWindowProps {
  notes: NoteItem[];
  tasks: TaskItem[];
  habits: HabitItem[];
  karma: number;
  onAddNote: (note: NoteItem) => void;
  onDeleteNote: (id: string) => void;
  onToggleTask: (id: string) => void;
  onAddTask: (title: string) => void;
  onToggleHabit: (id: string) => void;
  pomodoroMinutes: number;
  pomodoroSecondsLeft?: number;
  isPomodoroRunning: boolean;
  onTogglePomodoro: () => void;
  onResetPomodoro: () => void;
  onSetPomodoroMinutes: (mins: number) => void;
}

export const WidgetsWindow: React.FC<WidgetsWindowProps> = ({
  notes,
  tasks,
  habits,
  karma,
  onAddNote,
  onDeleteNote,
  onToggleTask,
  onAddTask,
  onToggleHabit,
  pomodoroMinutes,
  pomodoroSecondsLeft,
  isPomodoroRunning,
  onTogglePomodoro,
  onResetPomodoro,
  onSetPomodoroMinutes,
}) => {
  // New task input
  const [newTaskText, setNewTaskText] = useState('');

  // New note input
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTag, setNewNoteTag] = useState('#архитектура');
  const [showAddNote, setShowAddNote] = useState(false);

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;
    onAddNote({
      id: `note-${Date.now()}`,
      title: newNoteTitle,
      content: newNoteContent,
      tag: newNoteTag,
      createdAt: 'Только что',
    });
    setNewNoteTitle('');
    setNewNoteContent('');
    setShowAddNote(false);
    playChime('click');
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    onAddTask(newTaskText);
    setNewTaskText('');
    playChime('click');
  };

  return (
    <div className="h-full flex flex-col bg-[#F8F9FA] text-[#202124] text-xs select-none">
      {/* Top Banner */}
      <div className="h-11 border-b border-[#DADCE0] px-6 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center space-x-2.5">
          <Layers className="w-4 h-4 text-[#1A73E8]" />
          <h3 className="font-medium text-xs text-[#202124] tracking-tight">Рабочие инструменты & Задачи</h3>
        </div>
        <div className="flex items-center space-x-2 text-[11px] text-[#5F6368] font-medium">
          <span>Синхронизировано с Firestore</span>
        </div>
      </div>

      {/* Main Widgets Grid */}
      <div className="flex-1 overflow-y-auto p-6 select-text bg-[#F8F9FA]">
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5 max-w-7xl mx-auto">
          {/* WIDGET 1: POMODORO TIMER */}
          <div className="bg-white rounded-xl p-5 border border-[#DADCE0] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-[#1A73E8]" />
                <h4 className="font-medium text-[#202124] text-xs">Фокус-таймер</h4>
              </div>
              <div className="flex items-center space-x-1 bg-[#F1F3F4] p-0.5 rounded-full text-[11px]">
                <button
                  type="button"
                  onClick={() => onSetPomodoroMinutes(25)}
                  className={`px-3 py-1 rounded-full transition cursor-pointer font-medium ${
                    pomodoroMinutes === 25
                      ? 'bg-white text-[#1A73E8] shadow-xs'
                      : 'text-[#5F6368] hover:text-[#202124]'
                  }`}
                >
                  25 мин
                </button>
                <button
                  type="button"
                  onClick={() => onSetPomodoroMinutes(50)}
                  className={`px-3 py-1 rounded-full transition cursor-pointer font-medium ${
                    pomodoroMinutes === 50
                      ? 'bg-white text-[#1A73E8] shadow-xs'
                      : 'text-[#5F6368] hover:text-[#202124]'
                  }`}
                >
                  50 мин
                </button>
              </div>
            </div>

            {/* Timer Display */}
            <div className="text-center py-4 bg-[#F8F9FA] rounded-xl border border-[#DADCE0]">
              <div className="text-4xl font-normal font-mono tabular-nums tracking-tight text-[#202124]">
                {pomodoroSecondsLeft !== undefined
                  ? `${String(Math.floor(pomodoroSecondsLeft / 60)).padStart(2, '0')}:${String(
                      pomodoroSecondsLeft % 60
                    ).padStart(2, '0')}`
                  : `${String(pomodoroMinutes).padStart(2, '0')}:00`}
              </div>
              <span className="text-[11px] text-[#5F6368] mt-1 block font-medium">
                {isPomodoroRunning ? 'Сессия концентрации активна' : 'Готов к началу сессии'}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onTogglePomodoro}
                className="flex-1 py-2 rounded-full bg-[#1A73E8] hover:bg-[#1967D2] text-white font-medium flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-none"
              >
                {isPomodoroRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isPomodoroRunning ? 'Пауза' : 'Старт'}</span>
              </button>
              <button
                type="button"
                onClick={onResetPomodoro}
                className="p-2 rounded-full bg-[#F1F3F4] hover:bg-[#E8EAED] text-[#3C4043] transition cursor-pointer"
                title="Сбросить таймер"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* WIDGET 2: TASK TRACKER */}
          <div className="bg-white rounded-xl p-5 border border-[#DADCE0] shadow-xs space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-[#DADCE0]">
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-4 h-4 text-[#1E8E3E]" />
                <h4 className="font-medium text-[#202124] text-xs">Задачи спринта</h4>
              </div>
              <span className="text-[11px] text-[#5F6368] font-mono tabular-nums font-medium bg-[#F1F3F4] px-2.5 py-0.5 rounded-full">
                {tasks.filter((t) => t.done).length} / {tasks.length}
              </span>
            </div>

            <div className="space-y-1.5 overflow-y-auto max-h-48 pr-1 py-1">
              {tasks.length === 0 ? (
                <div className="text-center py-6 text-[#5F6368] text-xs">Нет активных задач</div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onToggleTask(task.id)}
                    className={`p-2.5 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                      task.done
                        ? 'bg-[#F8F9FA] border-[#DADCE0] text-[#80868B]'
                        : 'bg-white border-[#DADCE0] hover:border-[#BDC1C6] text-[#202124]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] transition ${
                          task.done
                            ? 'bg-[#1E8E3E] border-[#1E8E3E] text-white font-bold'
                            : 'border-[#BDC1C6] bg-white'
                        }`}
                      >
                        {task.done ? '✓' : ''}
                      </span>
                      <span className={`text-xs ${task.done ? 'line-through text-[#80868B]' : 'font-medium text-[#202124]'}`}>
                        {task.title}
                      </span>
                    </div>
                    {task.milestone && (
                      <span className="text-[10px] text-[#5F6368] font-medium shrink-0 ml-2">
                        {task.milestone}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleCreateTask} className="flex space-x-1.5 pt-2 border-t border-[#DADCE0]">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Новая задача..."
                className="flex-1 bg-[#F1F3F4] border border-transparent rounded-full px-3.5 py-1.5 text-xs text-[#202124] focus:outline-none focus:border-[#1A73E8] focus:bg-white transition"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-[#1A73E8] hover:bg-[#1967D2] text-white rounded-full transition cursor-pointer text-xs font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* WIDGET 3: NOTEPAD (GOOGLE KEEP STYLE) */}
          <div className="bg-white rounded-xl p-5 border border-[#DADCE0] shadow-xs space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-[#DADCE0]">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-[#F9AB00]" />
                <h4 className="font-medium text-[#202124] text-xs">Заметки и конспекты</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAddNote(!showAddNote)}
                className="text-[11px] text-[#1A73E8] hover:text-[#1967D2] font-medium transition cursor-pointer px-3 py-0.5 rounded-full bg-[#E8F0FE]"
              >
                {showAddNote ? 'Отмена' : '+ Заметка'}
              </button>
            </div>

            {showAddNote ? (
              <form onSubmit={handleCreateNote} className="space-y-2 bg-[#F8F9FA] p-3.5 rounded-xl border border-[#DADCE0]">
                <input
                  type="text"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Заголовок заметки..."
                  className="w-full bg-white border border-[#DADCE0] rounded-lg px-3 py-1.5 text-xs text-[#202124] focus:outline-none focus:border-[#1A73E8]"
                />
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Текст конспекта или вывода..."
                  rows={3}
                  className="w-full bg-white border border-[#DADCE0] rounded-lg px-3 py-1.5 text-xs text-[#202124] focus:outline-none focus:border-[#1A73E8] resize-none"
                />
                <div className="flex justify-between items-center pt-1">
                  <input
                    type="text"
                    value={newNoteTag}
                    onChange={(e) => setNewNoteTag(e.target.value)}
                    className="bg-transparent text-[11px] text-[#5F6368] w-28 focus:outline-none font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#1A73E8] hover:bg-[#1967D2] text-white font-medium rounded-full text-xs transition cursor-pointer"
                  >
                    Сохранить
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-48 pr-1 py-1">
                {notes.length === 0 ? (
                  <div className="text-center py-6 text-[#5F6368] text-xs">Заметок пока нет</div>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-[#FEF7E0]/60 p-3 rounded-xl border border-[#FEEFC3] space-y-1 group hover:border-[#F9AB00] transition"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-[#202124] text-xs">{note.title}</span>
                        <button
                          type="button"
                          onClick={() => onDeleteNote(note.id)}
                          className="text-[#5F6368] hover:text-[#D93025] opacity-0 group-hover:opacity-100 transition cursor-pointer p-0.5"
                          title="Удалить"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[#3C4043] text-[11px] line-clamp-2 leading-relaxed">{note.content}</p>
                      <div className="flex justify-between items-center pt-1 text-[10px] text-[#5F6368]">
                        <span className="font-mono">{note.tag}</span>
                        <span>{note.createdAt}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* WIDGET 4: HABIT TRACKER */}
          <div className="bg-white rounded-xl p-5 border border-[#DADCE0] shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#DADCE0]">
              <div className="flex items-center space-x-2">
                <Flame className="w-4 h-4 text-[#EA4335]" />
                <h4 className="font-medium text-[#202124] text-xs">Привычки практики</h4>
              </div>
              <span className="text-[11px] text-[#5F6368] bg-[#F1F3F4] px-2.5 py-0.5 rounded-full">Без штрафов</span>
            </div>
            <div className="space-y-1.5">
              {habits.map((h) => (
                <div
                  key={h.id}
                  onClick={() => onToggleHabit(h.id)}
                  className="p-2.5 rounded-lg bg-white border border-[#DADCE0] flex items-center justify-between cursor-pointer hover:border-[#BDC1C6] transition"
                >
                  <div className="flex items-center space-x-2.5">
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] transition ${
                        h.completedToday
                          ? 'bg-[#1E8E3E] border-[#1E8E3E] text-white font-bold'
                          : 'border-[#BDC1C6] bg-white'
                      }`}
                    >
                      {h.completedToday ? '✓' : ''}
                    </span>
                    <span className="text-xs font-medium text-[#202124]">{h.title}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-[#3C4043] font-medium text-xs font-mono tabular-nums bg-[#F1F3F4] px-2 py-0.5 rounded-full">
                    <span>{h.streak} дн</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WIDGET 5: SKILLS TREE / COMPETENCIES */}
          <div className="bg-white rounded-xl p-5 border border-[#DADCE0] shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#DADCE0]">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-[#1A73E8]" />
                <h4 className="font-medium text-[#202124] text-xs">Освоение компетенций</h4>
              </div>
              <span className="text-[11px] text-[#5F6368] bg-[#F1F3F4] px-2.5 py-0.5 rounded-full">Текущий срез</span>
            </div>
            <div className="space-y-3 text-xs pt-1">
              <div>
                <div className="flex justify-between text-[11px] mb-1 font-medium">
                  <span className="text-[#3C4043]">Структура B-Tree и индексы</span>
                  <span className="text-[#202124] font-mono tabular-nums">88%</span>
                </div>
                <div className="h-2 w-full bg-[#F1F3F4] rounded-full overflow-hidden">
                  <div className="h-full bg-[#1A73E8] rounded-full w-[88%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-1 font-medium">
                  <span className="text-[#3C4043]">Многопоточность и транзакции</span>
                  <span className="text-[#202124] font-mono tabular-nums">64%</span>
                </div>
                <div className="h-2 w-full bg-[#F1F3F4] rounded-full overflow-hidden">
                  <div className="h-full bg-[#1A73E8] rounded-full w-[64%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-1 font-medium">
                  <span className="text-[#3C4043]">Отказоустойчивое кэширование</span>
                  <span className="text-[#202124] font-mono tabular-nums">40%</span>
                </div>
                <div className="h-2 w-full bg-[#F1F3F4] rounded-full overflow-hidden">
                  <div className="h-full bg-[#1A73E8] rounded-full w-[40%]" />
                </div>
              </div>
            </div>
          </div>

          {/* WIDGET 6: KARMA & REPUTATION */}
          <div className="bg-white rounded-xl p-5 border border-[#DADCE0] shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#DADCE0]">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-[#F9AB00]" />
                <h4 className="font-medium text-[#202124] text-xs">Инженерная репутация</h4>
              </div>
              <span className="text-[11px] text-[#3C4043] font-medium bg-[#F1F3F4] px-2.5 py-0.5 rounded-full">Architect</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <div>
                <div className="text-3xl font-normal text-[#202124] font-mono tabular-nums">{karma}</div>
                <span className="text-[11px] text-[#5F6368] font-medium">Баллы за проверенный код</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-[#137333] bg-[#E6F4EA] px-3 py-1 rounded-full border border-[#CEEAD6]">
                  -15% Pro доступ
                </span>
              </div>
            </div>
            <p className="text-[11px] text-[#5F6368] leading-relaxed pt-2 border-t border-[#DADCE0]">
              Начисляется за сдачу практических проектов с первого раза (≥90%), помощь напарнику и взаимную верификацию решений.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
