import React, { useState, useEffect, useRef } from 'react';
import { Search, Monitor, Network, Atom, Tv, Bot, Users, LayoutGrid, ShieldCheck, FileText, ArrowRight, X, PenTool, Calendar as CalendarIcon, GraduationCap, BookOpen, GitBranch, Award } from 'lucide-react';
import { WindowId, LearningUnit, NoteItem } from '../../types.ts';

interface SpotlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWindow: (id: WindowId) => void;
  units: Record<string, LearningUnit>;
  notes: NoteItem[];
  onSelectUnit: (unitId: string) => void;
}

export const SpotlightModal: React.FC<SpotlightModalProps> = ({
  isOpen,
  onClose,
  onOpenWindow,
  units,
  notes,
  onSelectUnit,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Search Results
  const systemActions = [
    { title: 'Рабочий стол с виджетами Web OS', icon: <Monitor className="w-4 h-4 text-sky-500" />, action: () => onOpenWindow('desktop') },
    { title: 'Сфера знаний 3D (Holographic Knowledge Sphere)', icon: <Atom className="w-4 h-4 text-sky-400 animate-spin-slow" />, action: () => onOpenWindow('knowledge_sphere') },
    { title: 'Открыть план обучения (DAG граф)', icon: <Network className="w-4 h-4 text-slate-500" />, action: () => onOpenWindow('dag') },
    { title: 'Входная диагностика & Адаптивный план (200 блоков)', icon: <GraduationCap className="w-4 h-4 text-indigo-500" />, action: () => onOpenWindow('survey') },
    { title: 'Библиотека академических учебников & Квантов', icon: <BookOpen className="w-4 h-4 text-emerald-500" />, action: () => onOpenWindow('textbook_library') },
    { title: 'Git-Репозиторий Знаний & Инварианты', icon: <GitBranch className="w-4 h-4 text-purple-500" />, action: () => onOpenWindow('knowledge_git') },
    { title: 'Портфолио проверенных решений & Сданные артефакты', icon: <Award className="w-4 h-4 text-amber-500" />, action: () => onOpenWindow('portfolio') },
    { title: 'Календарь & Расписание уроков (на основе ресурса времени)', icon: <CalendarIcon className="w-4 h-4 text-sky-500" />, action: () => onOpenWindow('calendar') },
    { title: 'Перейти в Фокус-студию (Плеер 20/10/70)', icon: <Tv className="w-4 h-4 text-slate-500" />, action: () => onOpenWindow('focus') },
    { title: 'Запустить ИИ-Оператора системы', icon: <Bot className="w-4 h-4 text-slate-500" />, action: () => onOpenWindow('chat') },
    { title: 'Поиск напарника (P2P Matchmaking)', icon: <Users className="w-4 h-4 text-slate-500" />, action: () => onOpenWindow('partner_search') },
    { title: 'Открыть P2P Редактор & Whiteboard', icon: <Users className="w-4 h-4 text-slate-500" />, action: () => onOpenWindow('peer') },
    { title: 'Открыть Белый экран (White Screen • P2P)', icon: <PenTool className="w-4 h-4 text-slate-500" />, action: () => onOpenWindow('white_screen') },
    { title: 'Виджеты: Запустить таймер Помодоро', icon: <LayoutGrid className="w-4 h-4 text-slate-500" />, action: () => onOpenWindow('widgets') },
    { title: 'Открыть консоль модерации (Admin)', icon: <ShieldCheck className="w-4 h-4 text-slate-500" />, action: () => onOpenWindow('admin') },
  ].filter(a => !q || a.title.toLowerCase().includes(q));

  const filteredUnits = Object.values(units).filter(u => 
    !q || u.title.toLowerCase().includes(q) || u.category.toLowerCase().includes(q) || u.summaryMarkdown.toLowerCase().includes(q)
  );

  const filteredNotes = notes.filter(n =>
    !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tag.toLowerCase().includes(q)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in select-none">
      <div 
        id="spotlight-dialog"
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800"
      >
        {/* Search input */}
        <div className="p-4 border-b border-slate-100 flex items-center space-x-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по курсам, конспектам, модулям и командам ОС (Ctrl+K)..."
            className="w-full bg-transparent border-none text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results container */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4 text-xs select-text">
          {/* Quick Actions */}
          {systemActions.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                Команды системы
              </div>
              <div className="space-y-0.5">
                {systemActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => { action.action(); onClose(); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition flex items-center justify-between group cursor-pointer text-slate-700"
                  >
                    <div className="flex items-center space-x-3">
                      {action.icon}
                      <span className="font-medium text-xs text-slate-900">{action.title}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Units */}
          {filteredUnits.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                Образовательные кванты
              </div>
              <div className="space-y-0.5">
                {filteredUnits.map((unit) => (
                  <button
                    key={unit.id}
                    onClick={() => {
                      onSelectUnit(unit.id);
                      window.dispatchEvent(
                        new CustomEvent('learning_launch_module_window', { detail: { unitId: unit.id } })
                      );
                      onClose();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="text-slate-900 font-medium text-xs">{unit.title}</div>
                      <div className="text-slate-500 text-[11px] flex items-center space-x-2 mt-0.5">
                        <span className="text-slate-600 font-medium">{unit.category}</span>
                        <span>•</span>
                        <span>{unit.authorName}</span>
                        <span>•</span>
                        <span>Pass: {unit.passRate}%</span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      Открыть
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {filteredNotes.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                Личные заметки
              </div>
              <div className="space-y-0.5">
                {filteredNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => { onOpenWindow('widgets'); onClose(); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <div>
                        <div className="text-slate-900 font-medium text-xs">{note.title}</div>
                        <div className="text-slate-500 text-[11px] truncate max-w-md">{note.content}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {note.tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {systemActions.length === 0 && filteredUnits.length === 0 && filteredNotes.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              Ничего не найдено по запросу «{query}»
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
