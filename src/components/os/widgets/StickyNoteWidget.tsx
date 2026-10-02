import React, { useState, useEffect, useRef } from 'react';
import { 
  Palette, 
  Trash2, 
  Pin, 
  Copy, 
  Check, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  CheckCircle2, 
  X,
  ExternalLink,
  Sparkles,
  Search,
  BookOpen
} from 'lucide-react';
import { NoteItem } from '../../../types.ts';
import { playChime } from '../../../utils/audio.ts';

interface StickyNoteWidgetProps {
  id: string;
  initialText?: string;
  initialTitle?: string;
  initialColor?: string;
  notes?: NoteItem[];
  onAddNote?: (n: NoteItem) => void;
  onDeleteNote?: (id: string) => void;
  onUpdateText?: (id: string, text: string) => void;
  onUpdateColor?: (id: string, color: string) => void;
  onDelete?: () => void;
  onSpawnNewSticky?: () => void;
}

interface LocalStickyNote {
  id: string;
  title: string;
  content: string;
  tag: string;
  createdAt: string;
}

const COLOR_MAP: Record<string, { bg: string; border: string; header: string; text: string; btn: string }> = {
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    header: 'bg-amber-100/80 border-amber-200',
    text: 'text-amber-950',
    btn: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    header: 'bg-emerald-100/80 border-emerald-200',
    text: 'text-emerald-950',
    btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  sky: {
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    header: 'bg-sky-100/80 border-sky-200',
    text: 'text-sky-950',
    btn: 'bg-sky-500 hover:bg-sky-600 text-white',
  },
  rose: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    header: 'bg-rose-100/80 border-rose-200',
    text: 'text-rose-950',
    btn: 'bg-rose-500 hover:bg-rose-600 text-white',
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    header: 'bg-purple-100/80 border-purple-200',
    text: 'text-purple-950',
    btn: 'bg-purple-600 hover:bg-purple-700 text-white',
  },
};

const TAG_PRESETS = ['#конспект', '#ии_совет', '#архитектура', '#бэкенд', '#задачи', '#идеи', '#баги'];

export const StickyNoteWidget: React.FC<StickyNoteWidgetProps> = ({
  id,
  initialText = '• Проверить индексы WAL в PostgreSQL\n• Разобрать сценарий split page в B-Tree\n• Согласовать архитектуру с напарником',
  initialTitle = 'Памятка инженера',
  initialColor = 'amber',
  notes: globalNotes = [],
  onAddNote,
  onDeleteNote,
  onUpdateText,
  onUpdateColor,
  onDelete,
  onSpawnNewSticky,
}) => {
  // 1. Color State
  const [color, setColor] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`learning_os_sticky_color_${id}`);
      if (saved && COLOR_MAP[saved]) return saved;
    } catch {}
    return initialColor;
  });

  // 2. Local Notes List State
  const [widgetNotes, setWidgetNotes] = useState<LocalStickyNote[]>(() => {
    // If global notes passed, prioritize them
    if (globalNotes && globalNotes.length > 0) {
      return globalNotes.map((gn) => ({
        id: gn.id,
        title: gn.title || 'Заметка',
        content: gn.content || '',
        tag: gn.tag || '#конспект',
        createdAt: gn.createdAt || 'Недавно',
      }));
    }

    try {
      const savedList = localStorage.getItem(`learning_os_sticky_items_${id}`);
      if (savedList) {
        const parsed = JSON.parse(savedList);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const oldText = localStorage.getItem(`learning_os_sticky_${id}`);
      return [
        {
          id: `note-${id}-1`,
          title: initialTitle,
          content: oldText !== null ? oldText : initialText,
          tag: '#конспект',
          createdAt: 'Сегодня',
        },
      ];
    } catch {}
    return [
      {
        id: `note-${id}-1`,
        title: initialTitle,
        content: initialText,
        tag: '#конспект',
        createdAt: 'Сегодня',
      },
    ];
  });

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showNotesDropdown, setShowNotesDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Note Form State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTag, setNewTag] = useState('#конспект');
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Synchronize when global notes change (e.g. added by AI operator or Notes Window)
  useEffect(() => {
    if (!globalNotes || globalNotes.length === 0) return;

    setWidgetNotes((prev) => {
      // Map global notes
      const globalFormatted: LocalStickyNote[] = globalNotes.map((gn) => ({
        id: gn.id,
        title: gn.title || 'Заметка',
        content: gn.content || '',
        tag: gn.tag || '#конспект',
        createdAt: gn.createdAt || 'Недавно',
      }));

      // Check if there are newly added global notes not in widgetNotes
      const existingIds = new Set(prev.map((n) => n.id));
      const hasNew = globalFormatted.some((n) => !existingIds.has(n.id));

      if (hasNew) {
        // If a new note arrived from AI operator or window, make it active
        setActiveIndex(0);
        triggerToast('Конспект обновлен из ИИ-Оператора');
        return globalFormatted;
      }

      // If lengths or ids differ, sync
      if (globalFormatted.length !== prev.length) {
        return globalFormatted;
      }
      return prev;
    });
  }, [globalNotes]);

  // Listen for custom event 'learning_note_added' dispatched across components
  useEffect(() => {
    const handleGlobalNoteAdded = (e: Event) => {
      const customEvent = e as CustomEvent<NoteItem>;
      if (customEvent.detail) {
        const added = customEvent.detail;
        const newLocal: LocalStickyNote = {
          id: added.id || `note-${Date.now()}`,
          title: added.title || 'Новый конспект',
          content: added.content || '',
          tag: added.tag || '#конспект',
          createdAt: added.createdAt || 'Только что',
        };

        setWidgetNotes((prev) => {
          const filtered = prev.filter((n) => n.id !== newLocal.id);
          return [newLocal, ...filtered];
        });
        setActiveIndex(0);
        setIsCreating(false);
        playChime('success');
        triggerToast(`Сохранено в конспект: «${newLocal.title.slice(0, 20)}...»`);
      }
    };

    window.addEventListener('learning_note_added', handleGlobalNoteAdded as EventListener);
    return () => {
      window.removeEventListener('learning_note_added', handleGlobalNoteAdded as EventListener);
    };
  }, []);

  // Ensure activeIndex is valid
  const currentNote: LocalStickyNote = widgetNotes[activeIndex] || widgetNotes[0] || {
    id: `note-${id}-fallback`,
    title: 'Заметка',
    content: '',
    tag: '#конспект',
    createdAt: 'Только что',
  };

  // Sync widgetNotes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`learning_os_sticky_items_${id}`, JSON.stringify(widgetNotes));
      if (currentNote) {
        localStorage.setItem(`learning_os_sticky_${id}`, currentNote.content);
      }
    } catch (e) {
      console.warn('Error saving sticky notes:', e);
    }
  }, [widgetNotes, id, currentNote]);

  // Focus title input when entering creation mode
  useEffect(() => {
    if (isCreating) {
      setTimeout(() => titleInputRef.current?.focus(), 60);
    }
  }, [isCreating]);

  // Show temporary toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!showNotesDropdown) return;
    const handleOutsideClick = () => setShowNotesDropdown(false);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [showNotesDropdown]);

  // Handle Text change for current note
  const handleCurrentNoteContentChange = (content: string) => {
    setWidgetNotes((prev) =>
      prev.map((n, idx) => (idx === activeIndex ? { ...n, content } : n))
    );
    if (onUpdateText) onUpdateText(currentNote.id || id, content);
  };

  // Handle Title change for current note
  const handleCurrentNoteTitleChange = (title: string) => {
    setWidgetNotes((prev) =>
      prev.map((n, idx) => (idx === activeIndex ? { ...n, title } : n))
    );
  };

  // Handle Tag change for current note
  const handleCurrentNoteTagChange = (tag: string) => {
    setWidgetNotes((prev) =>
      prev.map((n, idx) => (idx === activeIndex ? { ...n, tag } : n))
    );
  };

  // Create New Note
  const handleCreateNoteSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const title = newTitle.trim() || `Заметка ${widgetNotes.length + 1}`;
    const content = newContent.trim();
    const tag = newTag || '#конспект';
    const createdAt = 'Только что';

    const newNoteObj: LocalStickyNote = {
      id: `sticky-note-${Date.now()}`,
      title,
      content,
      tag,
      createdAt,
    };

    // 1. Add to local notes in this widget
    const updated = [newNoteObj, ...widgetNotes];
    setWidgetNotes(updated);
    setActiveIndex(0);

    // 2. Add to global app notes (syncs to Firestore & other windows)
    if (onAddNote) {
      onAddNote({
        id: newNoteObj.id,
        title: newNoteObj.title,
        content: newNoteObj.content,
        tag: newNoteObj.tag,
        createdAt: newNoteObj.createdAt,
      });
    }

    // Broadcast event for all components
    window.dispatchEvent(
      new CustomEvent('learning_note_added', { detail: newNoteObj })
    );

    // 3. Reset form and exit creation view
    setNewTitle('');
    setNewContent('');
    setNewTag('#конспект');
    setIsCreating(false);

    playChime('success');
    triggerToast('Заметка успешно создана!');
  };

  // Quick Direct Note Creation
  const handleStartCreateNote = () => {
    setIsCreating(true);
    setNewTitle('');
    setNewContent('');
    setNewTag('#конспект');
    playChime('click');
  };

  // Cycle Color
  const handleCycleColor = () => {
    const keys = Object.keys(COLOR_MAP);
    const nextIdx = (keys.indexOf(color) + 1) % keys.length;
    const nextColor = keys[nextIdx];
    setColor(nextColor);
    try {
      localStorage.setItem(`learning_os_sticky_color_${id}`, nextColor);
    } catch {}
    if (onUpdateColor) onUpdateColor(id, nextColor);
    playChime('click');
  };

  // Copy Note Text
  const handleCopy = () => {
    const fullText = `${currentNote.title}\n${currentNote.tag}\n\n${currentNote.content}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    playChime('click');
    triggerToast('Текст скопирован');
  };

  // Delete Current Note
  const handleDeleteCurrentNote = () => {
    if (widgetNotes.length <= 1) {
      setWidgetNotes([
        {
          id: `note-${id}-${Date.now()}`,
          title: 'Новый конспект',
          content: '',
          tag: '#конспект',
          createdAt: 'Только что',
        },
      ]);
      setActiveIndex(0);
      triggerToast('Заметка очищена');
      return;
    }

    const noteToDelete = widgetNotes[activeIndex];
    const updated = widgetNotes.filter((_, idx) => idx !== activeIndex);
    setWidgetNotes(updated);
    setActiveIndex(Math.max(0, activeIndex - 1));

    if (noteToDelete && onDeleteNote) {
      onDeleteNote(noteToDelete.id);
    }

    playChime('click');
    triggerToast('Заметка удалена');
  };

  const theme = COLOR_MAP[color] || COLOR_MAP.amber;

  // Filter notes by search
  const filteredNotes = widgetNotes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`h-full flex flex-col rounded-xl overflow-hidden border ${theme.bg} ${theme.border} shadow-sm select-text relative`}>
      {/* Toast feedback pill */}
      {toastMessage && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 px-3 py-1 bg-slate-900/95 text-white text-[11px] font-medium rounded-full shadow-xl flex items-center space-x-1.5 animate-fade-in pointer-events-none backdrop-blur-md">
          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="truncate max-w-[200px]">{toastMessage}</span>
        </div>
      )}

      {/* 1. STICKY NOTE HEADER */}
      <div className={`px-2.5 py-1.5 flex items-center justify-between border-b ${theme.header} select-none shrink-0 gap-1.5 min-w-0`}>
        {/* Left: Pin + Title / Notes Selector */}
        <div className="flex items-center space-x-1 min-w-0 flex-1">
          <Pin className="w-3 h-3 text-slate-700 rotate-45 shrink-0" />
          {isCreating ? (
            <span className="text-[11px] font-bold text-slate-900 truncate block min-w-0 flex-1">
              Создание заметки
            </span>
          ) : (
            <div className="relative min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setShowNotesDropdown((prev) => !prev)}
                className="flex items-center space-x-1 text-[11px] font-bold text-slate-800 hover:text-slate-950 px-1 py-0.5 rounded hover:bg-black/5 transition cursor-pointer w-full min-w-0 overflow-hidden text-left"
                title="Переключить заметку / Список всех заметок"
              >
                <span className="truncate block min-w-0 flex-1">{currentNote.title || 'Конспект / Заметка'}</span>
                <span className="text-[9px] font-mono text-slate-500 font-normal shrink-0">
                  ({activeIndex + 1}/{widgetNotes.length})
                </span>
              </button>

              {/* Notes Dropdown List */}
              {showNotesDropdown && (
                <div 
                  className="absolute left-0 top-7 w-60 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-50 text-xs animate-fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-1 py-1 text-[10px] font-semibold uppercase text-slate-400 flex items-center justify-between">
                    <span>Все конспекты ({widgetNotes.length})</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotesDropdown(false);
                        handleStartCreateNote();
                      }}
                      className="text-sky-600 hover:text-sky-700 font-semibold cursor-pointer"
                    >
                      + Новый
                    </button>
                  </div>

                  {/* Search bar inside dropdown */}
                  <div className="my-1 relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Поиск по конспектам..."
                      className="w-full pl-6 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                    <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-0.5 py-1">
                    {filteredNotes.length === 0 ? (
                      <div className="text-center py-2 text-[10px] text-slate-400">
                        Ничего не найдено
                      </div>
                    ) : (
                      filteredNotes.map((note) => {
                        const originalIdx = widgetNotes.findIndex((n) => n.id === note.id);
                        const isCur = originalIdx === activeIndex;
                        return (
                          <button
                            key={note.id}
                            type="button"
                            onClick={() => {
                              setActiveIndex(originalIdx >= 0 ? originalIdx : 0);
                              setShowNotesDropdown(false);
                              playChime('click');
                            }}
                            className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between text-xs transition cursor-pointer ${
                              isCur
                                ? 'bg-amber-100/90 text-amber-950 font-semibold shadow-2xs'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span className="truncate pr-2">{note.title}</span>
                            <span className="text-[9px] text-slate-400 shrink-0 font-mono">{note.tag}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Actions Bar */}
        <div className="flex items-center space-x-0.5 shrink-0">
          {/* PRIMARY: Create Note Button */}
          {!isCreating ? (
            <button
              type="button"
              onClick={handleStartCreateNote}
              className="flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-amber-500/25 hover:bg-amber-500/40 text-amber-950 text-[10px] font-semibold transition cursor-pointer border border-amber-500/40 shadow-2xs shrink-0 whitespace-nowrap"
              title="Создать новую заметку"
            >
              <Plus className="w-3 h-3 text-amber-900 shrink-0" />
              <span>Создать</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-black/5 transition cursor-pointer shrink-0"
              title="Отмена"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Palette Color Button */}
          <button
            type="button"
            onClick={handleCycleColor}
            className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-black/5 transition cursor-pointer shrink-0"
            title="Сменить цвет стикера"
          >
            <Palette className="w-3 h-3" />
          </button>

          {/* Copy Button */}
          {!isCreating && (
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-black/5 transition cursor-pointer shrink-0"
              title="Копировать текст заметки"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
          )}

          {/* Spawn another sticky on desktop */}
          {onSpawnNewSticky && (
            <button
              type="button"
              onClick={() => {
                onSpawnNewSticky();
                playChime('success');
              }}
              className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-black/5 transition cursor-pointer shrink-0"
              title="Создать отдельный стикер на рабочем столе"
            >
              <ExternalLink className="w-3 h-3 text-slate-600" />
            </button>
          )}

          {/* Delete Note Button */}
          {!isCreating && (
            <button
              type="button"
              onClick={handleDeleteCurrentNote}
              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-100/50 transition cursor-pointer shrink-0"
              title="Удалить эту заметку"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 2. BODY CONTENT: CREATION FORM vs NOTE VIEWER */}
      {isCreating ? (
        /* CREATION MODE VIEW */
        <form onSubmit={handleCreateNoteSubmit} className="flex-1 p-2.5 flex flex-col justify-between space-y-2 bg-white/70">
          <div className="space-y-2 flex-1 flex flex-col">
            {/* Title Input */}
            <input
              ref={titleInputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Заголовок заметки (напр. Памятка по B-Tree)..."
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400/80 shadow-2xs placeholder:text-slate-400"
            />

            {/* Tag Selection Chips */}
            <div className="flex items-center space-x-1 overflow-x-auto py-0.5 text-[10px]">
              {TAG_PRESETS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setNewTag(tag)}
                  className={`px-2 py-0.5 rounded-md font-mono transition cursor-pointer shrink-0 ${
                    newTag === tag
                      ? 'bg-amber-500 text-white font-semibold shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Note Content Textarea */}
            <div className="flex-1 relative min-h-[70px]">
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Напишите мысль, сниппет, чек-лист или конспект (поддерживается Markdown)..."
                className="w-full h-full p-2 bg-white border border-slate-200 rounded-lg text-xs leading-relaxed font-sans text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/80"
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    handleCreateNoteSubmit();
                  }
                }}
              />
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 shrink-0">
            <span className="text-[10px] text-slate-400 font-mono">
              Ctrl+Enter для сохранения
            </span>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-800 hover:bg-slate-100 text-xs transition cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                className={`px-3 py-1 rounded-md font-semibold text-xs shadow-xs transition cursor-pointer flex items-center space-x-1 ${theme.btn}`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Создать заметку</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* NORMAL NOTE EDITING & BROWSING VIEW */
        <div className="flex-1 flex flex-col p-2.5 justify-between">
          {/* Title Row + Tag Badge */}
          <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-black/[0.06] shrink-0 gap-2">
            <input
              type="text"
              value={currentNote.title}
              onChange={(e) => handleCurrentNoteTitleChange(e.target.value)}
              placeholder="Заголовок заметки..."
              className={`font-semibold text-xs bg-transparent border-none outline-none flex-1 truncate ${theme.text} placeholder:text-slate-400 hover:bg-black/5 px-1 py-0.5 rounded transition`}
            />

            {/* Clickable Tag Chip to cycle tags */}
            <button
              type="button"
              onClick={() => {
                const curIdx = TAG_PRESETS.indexOf(currentNote.tag);
                const nextTag = TAG_PRESETS[(curIdx + 1) % TAG_PRESETS.length];
                handleCurrentNoteTagChange(nextTag);
                playChime('click');
              }}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/5 hover:bg-black/10 text-slate-700 transition cursor-pointer shrink-0"
              title="Нажмите, чтобы сменить тег"
            >
              {currentNote.tag}
            </button>
          </div>

          {/* Editable Content Area */}
          <div className="flex-1 relative min-h-[85px]">
            <textarea
              value={currentNote.content}
              onChange={(e) => handleCurrentNoteContentChange(e.target.value)}
              placeholder="Напишите мысль, сниппет или заметку..."
              className={`w-full h-full bg-transparent resize-none border-none outline-none text-xs leading-relaxed font-sans ${theme.text} placeholder:text-slate-400`}
            />
          </div>

          {/* Footer Bar: Paging + Create Button + Autosave Info */}
          <div className="pt-1.5 mt-1 border-t border-black/[0.06] flex items-center justify-between text-[10px] text-slate-500 select-none shrink-0 gap-1.5">
            {/* Left: Notes Pager */}
            <div className="flex items-center space-x-1 min-w-0">
              {widgetNotes.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveIndex((prev) => (prev > 0 ? prev - 1 : widgetNotes.length - 1));
                      playChime('click');
                    }}
                    className="p-0.5 rounded hover:bg-black/5 text-slate-600 transition cursor-pointer shrink-0"
                    title="Предыдущая заметка"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-slate-600 shrink-0">
                    {activeIndex + 1}/{widgetNotes.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveIndex((prev) => (prev < widgetNotes.length - 1 ? prev + 1 : 0));
                      playChime('click');
                    }}
                    className="p-0.5 rounded hover:bg-black/5 text-slate-600 transition cursor-pointer shrink-0"
                    title="Следующая заметка"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </>
              )}
              <span className="italic pl-1 truncate">
                {currentNote.content.length} симв.
              </span>
            </div>

            {/* Right: "+ Создать заметку" Quick Action */}
            <button
              type="button"
              onClick={handleStartCreateNote}
              className="flex items-center space-x-1 font-semibold text-slate-800 hover:text-black bg-black/5 hover:bg-black/10 px-2 py-0.5 rounded transition cursor-pointer shrink-0"
              title="Создать еще одну заметку"
            >
              <Plus className="w-3 h-3 text-slate-700 shrink-0" />
              <span>Создать</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
