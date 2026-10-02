import React, { useState } from 'react';
import { CheckSquare, Square, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { TaskItem } from '../../../types.ts';
import { playChime } from '../../../utils/audio.ts';

interface TaskListWidgetProps {
  tasks: TaskItem[];
  onToggleTask: (id: string) => void;
  onAddTask: (title: string) => void;
  onDeleteTask?: (id: string) => void;
}

export const TaskListWidget: React.FC<TaskListWidgetProps> = ({
  tasks,
  onToggleTask,
  onAddTask,
  onDeleteTask,
}) => {
  const [inputText, setInputText] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onAddTask(inputText.trim());
    setInputText('');
    playChime('click');
  };

  const completedCount = tasks.filter((t) => t.done).length;

  return (
    <div className="h-full flex flex-col p-3 text-slate-800 select-none text-xs">
      {/* Header with Stats */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
        <div className="flex items-center space-x-1.5 font-semibold text-slate-900 text-xs">
          <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
          <span>Оперативные задачи</span>
        </div>
        <span className="text-[11px] font-mono text-slate-500 font-medium">
          {completedCount}/{tasks.length}
        </span>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 select-text">
        {tasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-4">
            <CheckCircle2 className="w-6 h-6 mb-1 text-slate-300" />
            <span className="text-[11px]">Все задачи выполнены!</span>
          </div>
        ) : (
          tasks.slice(0, 8).map((t) => (
            <div
              key={t.id}
              className={`flex items-center justify-between p-1.5 rounded-lg group transition-colors ${
                t.done ? 'bg-slate-50 text-slate-400' : 'bg-slate-50/70 hover:bg-slate-100/70 text-slate-800'
              }`}
            >
              <button
                type="button"
                id={`task-item-${t.id}`}
                data-task-id={t.id}
                onClick={() => {
                  onToggleTask(t.id);
                  playChime('click');
                }}
                className="flex items-center space-x-2 text-left truncate flex-1 cursor-pointer"
              >
                {t.done ? (
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
                )}
                <span className={`truncate text-xs ${t.done ? 'line-through text-slate-400' : 'font-medium'}`}>
                  {t.title}
                </span>
              </button>

              {onDeleteTask && (
                <button
                  type="button"
                  onClick={() => onDeleteTask(t.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                  title="Удалить"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Quick Add Bar */}
      <form onSubmit={handleCreate} className="pt-2 border-t border-slate-100 mt-1 flex items-center space-x-1.5">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="+ Добавить задачу и Enter..."
          className="flex-1 bg-slate-50 border border-slate-200/80 rounded-md px-2 py-1 text-xs outline-hidden focus:border-sky-400 text-slate-800 placeholder:text-slate-400"
        />
        <button
          type="submit"
          className="p-1 rounded-md bg-slate-900 hover:bg-slate-800 text-white cursor-pointer transition"
          title="Добавить"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
