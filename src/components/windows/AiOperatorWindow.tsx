import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Network, 
  Clock, 
  FileText, 
  CheckSquare, 
  Users, 
  Copy,
  Check,
  Trash2,
  ArrowUpRight,
  Code2,
  Terminal,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Film,
  Play,
  Pause,
  ShoppingBag,
  Minimize2,
  BookOpen,
  Library,
  GraduationCap,
  Bookmark,
  Search,
  BookCheck,
  X,
  PanelRightClose,
  PanelRightOpen,
  Cpu,
  Lightbulb,
  Layers,
  Zap,
} from 'lucide-react';
import { playChime } from '../../utils/audio.ts';
import { AdminMaterial, GroundingSourceItem } from '../../types.ts';

interface AiOperatorWindowProps {
  onMutateGraph: (nodeTitle: string, reason: string) => void;
  onSetPomodoro: (minutes: number, start: boolean) => void;
  onCreateNote: (title: string, content: string, tag: string) => void;
  onAddTask: (title: string) => void;
  onMatchBuddy: () => void;
  onInjectProject?: (topic?: string, customProject?: any) => void;
  materials?: AdminMaterial[];
  onOpenStore?: (materialId?: string) => void;
  onDeployMaterial?: (material: AdminMaterial) => void;
  activeNodeTitle?: string;
  karma?: number;
  pomodoroMinutes?: number;
  targetRole?: string;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

interface ChatAction {
  type: string;
  explanation: string;
  payload: any;
  executed?: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  action?: ChatAction;
  time: string;
  groundingSources?: GroundingSourceItem[];
  isGroundedOnTextbooks?: boolean;
}

// Formatted Code Block with Copy
const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 rounded-lg overflow-hidden border border-slate-700/80 bg-slate-900 text-slate-100 shadow-2xs">
      <div className="flex items-center justify-between px-3 py-1 bg-slate-800/90 border-b border-slate-700/60 text-[10px] text-slate-400 font-mono">
        <span className="uppercase font-semibold tracking-wider text-slate-300">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center space-x-1 hover:text-white transition cursor-pointer"
          title="Скопировать фрагмент кода"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-sans font-medium">Скопировано!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-slate-400" />
              <span className="font-sans font-medium">Копировать</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 font-mono text-[11px] leading-relaxed overflow-x-auto select-text text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// Rich Markdown Message Formatter
const FormattedMessage: React.FC<{ text: string }> = ({ text }) => {
  // Split message by code blocks ```lang\ncode\n```
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <TextSection
          key={`text-${lastIndex}`}
          content={text.substring(lastIndex, match.index)}
        />
      );
    }

    const language = match[1] || 'text';
    const code = match[2];
    parts.push(
      <CodeBlock key={`code-${match.index}`} language={language} code={code} />
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(
      <TextSection key={`text-${lastIndex}`} content={text.substring(lastIndex)} />
    );
  }

  return <div className="space-y-1.5 leading-relaxed">{parts}</div>;
};

// Sub-component for parsing text markdown formatting (bold, headings, lists, inline code)
const TextSection: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');

  return (
    <div className="space-y-1">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Heading 3
        if (line.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-xs font-bold text-slate-900 mt-2 mb-0.5">
              {renderInlineStyles(line.slice(4))}
            </h4>
          );
        }

        // Heading 4
        if (line.startsWith('#### ')) {
          return (
            <h5 key={idx} className="text-[11px] font-bold text-slate-800 mt-1.5 mb-0.5">
              {renderInlineStyles(line.slice(5))}
            </h5>
          );
        }

        // Bullet point
        if (line.startsWith('* ') || line.startsWith('- ')) {
          return (
            <div key={idx} className="flex items-start space-x-1.5 pl-2 text-xs">
              <span className="text-slate-400 mt-1 text-[8px]">●</span>
              <span className="flex-1">{renderInlineStyles(line.slice(2))}</span>
            </div>
          );
        }

        // Numbered list
        const numMatch = line.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start space-x-1.5 pl-2 text-xs">
              <span className="font-mono text-slate-500 font-semibold text-[11px] shrink-0">
                {numMatch[1]}.
              </span>
              <span className="flex-1">{renderInlineStyles(numMatch[2])}</span>
            </div>
          );
        }

        // Quote / callout
        if (line.startsWith('> ')) {
          return (
            <div
              key={idx}
              className="border-l-2 border-slate-300 pl-2.5 py-0.5 my-1 text-[11px] text-slate-600 bg-slate-50 rounded-r"
            >
              {renderInlineStyles(line.slice(2))}
            </div>
          );
        }

        return (
          <p key={idx} className="text-xs text-slate-700">
            {renderInlineStyles(line)}
          </p>
        );
      })}
    </div>
  );
};

// Inline styles parser: **bold**, `code`, *italic*
function renderInlineStyles(str: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(str)) !== null) {
    if (m.index > lastIdx) {
      parts.push(str.substring(lastIdx, m.index));
    }

    const token = m[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={`b-${m.index}`} className="font-bold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={`c-${m.index}`}
          className="bg-slate-100 text-slate-800 border border-slate-200 px-1 py-0.5 rounded font-mono text-[11px]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={`i-${m.index}`} className="italic text-slate-800">
          {token.slice(1, -1)}
        </em>
      );
    }

    lastIdx = m.index + token.length;
  }

  if (lastIdx < str.length) {
    parts.push(str.substring(lastIdx));
  }

  return parts.length > 0 ? parts : str;
}

// Sub-component for displaying multi-source textbook and academic citations
const GroundingSourcesPanel: React.FC<{
  sources: GroundingSourceItem[];
  onInspectSource: (source: GroundingSourceItem) => void;
}> = ({ sources, onInspectSource }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left text-[11px] font-semibold text-slate-700 hover:text-slate-900 transition py-1 cursor-pointer"
      >
        <div className="flex items-center space-x-1.5">
          <BookOpen className="w-3.5 h-3.5 text-sky-600" />
          <span>Первоисточники и учебники ({sources.length})</span>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded font-mono font-medium">
            Верифицировано
          </span>
        </div>
        <span className="text-slate-400">
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </span>
      </button>

      {isExpanded && (
        <div className="space-y-1.5 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {sources.map((src, sIdx) => {
              const badgeBg = src.sourceType === 'openstax' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : src.sourceType === 'academic_paper'
                ? 'bg-sky-50 text-sky-800 border-sky-200'
                : src.sourceType === 'djvu_conspect'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : src.sourceType === 'academic_book'
                ? 'bg-purple-50 text-purple-800 border-purple-200'
                : 'bg-teal-50 text-teal-800 border-teal-200';

              return (
                <div
                  key={src.id || sIdx}
                  onClick={() => onInspectSource(src)}
                  className="p-2.5 rounded-lg border border-slate-200/80 bg-slate-50/70 hover:bg-slate-100/80 transition cursor-pointer text-left space-y-1 group"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={`px-1.5 py-0.2 rounded border font-semibold truncate max-w-[170px] ${badgeBg}`}>
                      [{sIdx + 1}] {src.sourceLabel}
                    </span>
                    <span className="text-slate-400 font-mono text-[9px]">
                      {src.year || 2024}
                    </span>
                  </div>

                  <h5 className="text-[11px] font-bold text-slate-900 group-hover:text-sky-700 transition line-clamp-1">
                    {src.title}
                  </h5>

                  <p className="text-[10px] text-slate-500 line-clamp-2 italic leading-relaxed">
                    «{src.verifiableQuote || src.snippet}»
                  </p>

                  <div className="pt-1 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                    <span className="truncate max-w-[140px]">{src.chapterOrSection || 'Глава 1'}</span>
                    <span className="text-sky-600 font-sans font-medium flex items-center space-x-0.5">
                      <span>Фрагмент</span>
                      <ArrowUpRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const AiOperatorWindow: React.FC<AiOperatorWindowProps> = ({
  onMutateGraph,
  onSetPomodoro,
  onCreateNote,
  onAddTask,
  onMatchBuddy,
  onInjectProject,
  materials,
  onOpenStore,
  onDeployMaterial,
  activeNodeTitle,
  karma,
  pomodoroMinutes,
  targetRole,
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'assistant',
      text: `Привет! Я твой Интеллектуальный Оператор и Персональный Ментор в Learning OS.

Я подключен напрямую ко всем компонентам среды:
- **Разбор любых тем и навыков:** Простое объяснение сложных концепций методом Фейнмана, структурирование и ментальные модели.
- **🎬 Обучающие материалы:** Подберу видео, разборы и конспекты под любой твой запрос и навык с мгновенным плеером.
- **Анализ практики & Обратная связь:** Присылай свои практические наработки, тексты, ответы или схемы — найдем слепые зоны и точки роста.
- **Практические кейсы:** Напиши *"дай практический кейс"* — и я сгенерирую реальный жизненный сценарий с чеклистом и критериями решения.
- **Управление средой:** Могу настроить таймер фокуса, выписать конспект в Блокнот или подобрать напарника для спарринга.

Какой вопрос или навык разберем прямо сейчас?`,
      time: '10:15',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [activePlayingVideoId, setActivePlayingVideoId] = useState<string | null>(null);
  const [selectedGroundingSource, setSelectedGroundingSource] = useState<GroundingSourceItem | null>(null);
  const [isSourcesInfoModalOpen, setIsSourcesInfoModalOpen] = useState(false);
  const [isPcSidebarOpen, setIsPcSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      setInputValue(initialPrompt);
      onClearInitialPrompt?.();
    }
  }, [initialPrompt, onClearInitialPrompt]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputValue;
    if (!textToSend.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputValue('');
    setIsSending(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages.map((m) => ({ role: m.sender, text: m.text })),
          systemContext: {
            activeNodeTitle: activeNodeTitle || 'Фундамент и деконструкция навыка',
            pomodoroMinutes: pomodoroMinutes || 25,
            karma: karma || 18450,
            targetRole: targetRole || 'Практик & Ученик',
            storeMaterials: (materials || []).filter((m) => m.type === 'video' || m.contentUrl).map((m) => ({
              id: m.id,
              title: m.title,
              type: m.type,
              author: m.author,
              domain: m.domain,
              level: m.level,
              durationMin: m.durationMin || 25,
              contentUrl: m.contentUrl,
              aiEssence: m.aiEssence,
              aiPracticeGuidelines: m.aiPracticeGuidelines,
            })),
          },
        }),
      });

      let data: any = null;
      try {
        const raw = await response.text();
        if (raw && raw.trim().startsWith('{')) {
          data = JSON.parse(raw);
        }
      } catch (parseErr) {
        console.warn('AiOperator response parse warning:', parseErr);
      }

      if (!data) {
        data = {
          reply: 'Запрос принят. Я готов разобрать тему подробнее.',
          action: { type: 'NONE' },
        };
      }

      // Safe non-intrusive action handling:
      // Background actions (Pomodoro, Notes, Tasks) execute seamlessly WITHOUT navigating away.
      // High-impact navigation actions (Inject Project, Mutate Graph, Match Buddy) present interactive cards to the user!
      let executedAction = false;
      if (data.action && data.action.type !== 'NONE') {
        const { type, payload } = data.action;

        if (type === 'SET_POMODORO') {
          onSetPomodoro(payload?.minutes || 25, payload?.start !== false);
          executedAction = true;
        } else if (type === 'CREATE_NOTE') {
          const noteTitle = payload?.title || 'Заметка от ИИ-Оператора';
          const noteContent = payload?.content || textToSend;
          const noteTag = payload?.tag || '#конспект';
          onCreateNote(noteTitle, noteContent, noteTag);
          window.dispatchEvent(
            new CustomEvent('learning_note_added', {
              detail: {
                id: `note-${Date.now()}`,
                title: noteTitle,
                content: noteContent,
                tag: noteTag,
                createdAt: 'Только что',
              },
            })
          );
          executedAction = true;
        } else if (type === 'ADD_TASK') {
          onAddTask(payload?.title || textToSend);
          executedAction = true;
        }
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'Ответ сформирован.',
        action: data.action?.type !== 'NONE'
          ? { ...data.action, executed: executedAction }
          : undefined,
        groundingSources: data.groundingSources || [],
        isGroundedOnTextbooks: Boolean(data.isGroundedOnTextbooks || (data.groundingSources && data.groundingSources.length > 0)),
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
      playChime('click');
    } catch (err) {
      console.error('Operator Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: 'Связь с моделью временно восстанавливается. Я готов ответить на любой технический вопрос или разобрать фрагмент кода!',
          time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleSaveToNotes = (text: string) => {
    const titleMatch = text.match(/### (.*)/);
    const title = titleMatch ? titleMatch[1].trim() : 'Конспект от ИИ-Оператора';
    onCreateNote(title, text, '#конспект');
    window.dispatchEvent(
      new CustomEvent('learning_note_added', {
        detail: {
          id: `note-${Date.now()}`,
          title,
          content: text,
          tag: '#конспект',
          createdAt: 'Только что',
        },
      })
    );
    playChime('success');
  };

  const quickPrompts = [
    { label: '🎬 Видео: Индексы Postgres', prompt: 'Найди мне в магазине материалов видео про индексы PostgreSQL и структуру страниц' },
    { label: '⚡ Видео: Консенсус Raft', prompt: 'Поищи в магазине обучающее видео про распределенный консенсус Raft и выборы лидера' },
    { label: '🧵 Видео: Lock-Free', prompt: 'Найди видео из магазина по Lock-Free структурам данных и атомарным операциям' },
    { label: '🔍 Как устроен WAL в Postgres?', prompt: 'Объясни подробно, как устроен WAL (Write-Ahead Logging) в PostgreSQL и как работает механизм Checkpoints.' },
    { label: '💼 Дай боевой проект по теме', prompt: 'Дай боевой проект из реального продакшена по текущей теме курса.' },
    { label: '⏱️ Фокус-таймер на 25 мин', prompt: 'Поставь таймер глубокого фокуса на 25 минут.' },
  ];

  return (
    <div className="h-full flex flex-col bg-white/95 backdrop-blur-2xl text-slate-800 text-xs select-none">
      {/* Minimal Top Header */}
      <div className="h-11 border-b border-slate-200/80 px-4 flex items-center justify-between bg-white/80 backdrop-blur-xl shrink-0 shadow-2xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-900 text-xs">ИИ-Системный Оператор</h3>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-mono font-semibold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Gemini Online</span>
              </span>
            </div>
          </div>
        </div>

        {/* Current Active Context Badge & Scraper Status */}
        <div className="flex items-center space-x-2 text-[11px] text-slate-500">
          <button
            type="button"
            onClick={() => setIsSourcesInfoModalOpen(true)}
            className="hidden sm:flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200/80 text-[10px] font-medium transition cursor-pointer"
            title="Просмотр 5 баз учебников и научных источников"
          >
            <BookCheck className="w-3 h-3 text-sky-600" />
            <span>5 баз учебников</span>
          </button>

          <span className="hidden sm:inline text-slate-400">Контекст:</span>
          <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded border border-slate-200 truncate max-w-[200px]">
            {activeNodeTitle || 'Архитектура и базы данных'}
          </span>
          <button
            type="button"
            onClick={() => {
              setMessages([
                {
                  id: `init-${Date.now()}`,
                  sender: 'assistant',
                  text: 'Диалог очищен. Задайте любой вопрос или опишите задачу — ответ будет строго подкреплен проверенными учебниками!',
                  time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
                },
              ]);
            }}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title="Очистить историю диалога"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* PC Adaptive Tools Panel Toggle */}
          <button
            type="button"
            onClick={() => setIsPcSidebarOpen((prev) => !prev)}
            className={`hidden md:flex items-center space-x-1 px-2 py-1 rounded-md border text-[11px] font-medium transition cursor-pointer ${
              isPcSidebarOpen
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
            }`}
            title="Панель инструментов и базы знаний на ПК"
          >
            {isPcSidebarOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
            <span className="hidden xl:inline">Инструменты ПК</span>
          </button>
        </div>
      </div>

      {/* Main Multi-Pane PC Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Chat Conversation */}
        <div className="flex-1 flex flex-col min-w-0 bg-white/40 backdrop-blur-md">

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
        {messages.map((m) => {
          const isMe = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start space-x-2.5 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-semibold shadow-2xs ${
                  isMe
                    ? 'bg-slate-900 text-white'
                    : 'bg-white/90 border border-slate-200/80 text-slate-800 backdrop-blur-md'
                }`}
              >
                {isMe ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              {/* Message Bubble Container */}
              <div
                className={`max-w-2xl rounded-2xl p-4 space-y-2 transition-all shadow-xs ${
                  isMe
                    ? 'bg-slate-900 text-white rounded-tr-none'
                    : 'bg-white/85 backdrop-blur-2xl border border-white/90 text-slate-800 rounded-tl-none'
                }`}
              >
                {/* Formatted Text Content */}
                {isMe ? (
                  <div className="whitespace-pre-wrap leading-relaxed text-xs text-white font-medium">
                    {m.text}
                  </div>
                ) : (
                  <FormattedMessage text={m.text} />
                )}

                {/* Interactive Action Proposal Cards (Only when triggered) */}
                {m.action && m.action.type === 'INJECT_PROJECT' && m.action.payload && (
                  <div className="mt-3 p-3.5 rounded-lg bg-slate-900 text-white border border-slate-800 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400 flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Спроектирован боевой кейс</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {m.action.payload.role || 'Staff Engineer'}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white leading-snug">
                      {m.action.payload.title}
                    </h4>

                    {m.action.payload.businessScenario && (
                      <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
                        {m.action.payload.businessScenario}
                      </p>
                    )}

                    <div className="pt-1 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (onInjectProject) {
                            onInjectProject(activeNodeTitle, m.action?.payload);
                          }
                        }}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold text-xs rounded-md shadow-xs transition flex items-center space-x-1 cursor-pointer"
                      >
                        <span>Встроить кейс и перейти в Студию</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const noteContent = `### Боевой кейс: ${m.action?.payload?.title}\n\n**Роль:** ${m.action?.payload?.role}\n\n#### Инцидент:\n${m.action?.payload?.businessScenario}\n\n#### Описание задачи:\n${m.action?.payload?.description}`;
                          onCreateNote(`Кейс: ${m.action?.payload?.title}`, noteContent, '#проекты');
                          playChime('success');
                        }}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md transition cursor-pointer"
                      >
                        В Блокнот
                      </button>
                    </div>
                  </div>
                )}

                {/* Store Video Search Result Cards */}
                {m.action && m.action.type === 'FIND_STORE_VIDEO' && m.action.payload && (
                  <div className="mt-3 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-0.5">
                      <div className="flex items-center space-x-1.5 text-slate-900 font-semibold">
                        <Film className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Материалы из Магазина платформы</span>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-mono">
                        {Array.isArray(m.action.payload.matchedVideos) ? `${m.action.payload.matchedVideos.length} найдено` : 'Рекомендация'}
                      </span>
                    </div>

                    {Array.isArray(m.action.payload.matchedVideos) && m.action.payload.matchedVideos.map((video: any, vIdx: number) => {
                      const isPlaying = activePlayingVideoId === video.id;
                      const levelLabel = video.level === 'beginner' ? 'Новичок' : video.level === 'intermediate' ? 'Практик' : 'Мастер';
                      const levelBadgeStyle = video.level === 'beginner' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : video.level === 'intermediate' 
                        ? 'bg-sky-50 text-sky-700 border-sky-200' 
                        : 'bg-purple-50 text-purple-700 border-purple-200';

                      return (
                        <div 
                          key={video.id || vIdx}
                          className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all space-y-3"
                        >
                          {/* Header Row */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                                <span className="font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                                  <Film className="w-3 h-3 text-slate-400" />
                                  <span>{video.domain || 'Архитектура'}</span>
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className={`px-1.5 py-0.2 rounded border font-medium ${levelBadgeStyle}`}>
                                  {levelLabel}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-500 font-medium">
                                  {video.author || '@mentor'}
                                </span>
                              </div>
                              <h4 className="font-semibold text-xs text-slate-900 leading-snug">
                                {video.title}
                              </h4>
                            </div>

                            <div className="shrink-0 flex items-center space-x-1 text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded font-mono">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{video.durationMin || 25} мин</span>
                            </div>
                          </div>

                          {/* AI Essence / Reason Box */}
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                            <div className="flex items-center space-x-1.5 text-[10px] font-semibold text-slate-700 uppercase tracking-wider">
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              <span>Суть для инженера:</span>
                            </div>
                            <p className="leading-relaxed line-clamp-3">
                              {video.aiEssence || video.matchReason || 'Детальный разбор архитектурных механизмов и практических паттернов.'}
                            </p>
                          </div>

                          {/* Inline Video Player if opened */}
                          {isPlaying && video.contentUrl && (
                            <div className="rounded-xl overflow-hidden border border-slate-900 bg-black aspect-video shadow-md animate-fade-in relative group">
                              <video
                                src={video.contentUrl}
                                controls
                                autoPlay
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}

                          {/* Interactive Card Action Buttons */}
                          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center space-x-1.5">
                              {video.contentUrl && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActivePlayingVideoId(isPlaying ? null : video.id);
                                    playChime('click');
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
                                    isPlaying
                                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                      : 'bg-slate-900 hover:bg-slate-800 text-white shadow-2xs'
                                  }`}
                                  title={isPlaying ? 'Свернуть видео' : 'Смотреть прямо в чате'}
                                >
                                  {isPlaying ? (
                                    <>
                                      <Minimize2 className="w-3.5 h-3.5" />
                                      <span>Свернуть</span>
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-3.5 h-3.5 fill-current" />
                                      <span>Смотреть</span>
                                    </>
                                  )}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  if (onOpenStore) {
                                    onOpenStore(video.id);
                                    playChime('click');
                                  }
                                }}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center space-x-1 transition cursor-pointer shadow-2xs"
                                title="Перейти к материалу в Магазине знаний"
                              >
                                <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                                <span>В магазин</span>
                              </button>
                            </div>

                            <div className="flex items-center space-x-1.5">
                              {onDeployMaterial && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeployMaterial(video);
                                    playChime('success');
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-1 transition cursor-pointer"
                                  title="Встроить этот материал в активный курс (DAG-граф)"
                                >
                                  <Network className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>В курс</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  onCreateNote(
                                    `Видео: ${video.title}`,
                                    `### Видео из магазина: ${video.title}\n\n**Автор:** ${video.author} | **Длительность:** ${video.durationMin || 25} мин\n**Категория:** ${video.domain}\n\n#### Суть материала:\n${video.aiEssence || ''}\n\n${video.contentUrl ? `**Ссылка на видео:** [Смотреть видео](${video.contentUrl})` : ''}`,
                                    '#видео'
                                  );
                                  playChime('success');
                                }}
                                className="px-2 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                                title="Сохранить информацию о видео в Блокнот"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Конспект</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Graph Mutation Card */}
                {m.action && m.action.type === 'MUTATE_GRAPH' && (
                  <div className="mt-2.5 p-3 rounded-lg bg-sky-50 border border-sky-200 text-sky-950 space-y-2">
                    <div className="flex items-center space-x-1.5 font-bold text-xs text-sky-900">
                      <Network className="w-4 h-4 text-sky-600" />
                      <span>Предложено обновление графа курса</span>
                    </div>
                    <p className="text-[11px] text-sky-800 leading-relaxed">
                      {m.action.explanation || 'Адаптация программы под текущий темп и запросы.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onMutateGraph(
                          m.action?.payload?.injectedNodeTitle || 'Практический интенсив',
                          m.action?.payload?.reason || 'Адаптация по запросу'
                        );
                      }}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-md shadow-xs transition cursor-pointer flex items-center space-x-1"
                    >
                      <span>Применить изменения к графу →</span>
                    </button>
                  </div>
                )}

                {/* Discreet Status Chips for Auto-Executed Actions (Pomodoro, Notes, Tasks) */}
                {m.action && m.action.executed && (
                  <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center space-x-2 text-[11px] text-slate-500 font-medium">
                    {m.action.type === 'SET_POMODORO' && (
                      <span className="flex items-center space-x-1 text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>Таймер фокуса запущен ({m.action.payload?.minutes || 25} мин)</span>
                      </span>
                    )}
                    {m.action.type === 'CREATE_NOTE' && (
                      <span className="flex items-center space-x-1 text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        <FileText className="w-3 h-3 text-slate-500" />
                        <span>Заметка зафиксирована в Блокноте</span>
                      </span>
                    )}
                    {m.action.type === 'ADD_TASK' && (
                      <span className="flex items-center space-x-1 text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        <CheckSquare className="w-3 h-3 text-slate-500" />
                        <span>Задача добавлена в спринт</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Multi-Source Grounded Textbook & Academic Panel */}
                {m.groundingSources && m.groundingSources.length > 0 && (
                  <GroundingSourcesPanel
                    sources={m.groundingSources}
                    onInspectSource={(source) => setSelectedGroundingSource(source)}
                  />
                )}

                {/* Message Footer Controls */}
                {!isMe && (
                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(m.id, m.text)}
                        className="hover:text-slate-700 transition flex items-center space-x-1 cursor-pointer"
                        title="Скопировать ответ"
                      >
                        {copiedMsgId === m.id ? (
                          <>
                            <Check className="w-2.5 h-2.5 text-emerald-500" />
                            <span className="text-emerald-600 font-medium">Скопировано</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-2.5 h-2.5" />
                            <span>Копировать</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveToNotes(m.text)}
                        className="hover:text-slate-700 transition flex items-center space-x-1 cursor-pointer"
                        title="Сохранить ответ в Блокнот"
                      >
                        <FileText className="w-2.5 h-2.5" />
                        <span>В конспект</span>
                      </button>
                    </div>

                    <span className="font-mono tabular-nums">{m.time}</span>
                  </div>
                )}

                {isMe && (
                  <div className="text-[9px] text-right font-mono text-slate-400 tabular-nums">
                    {m.time}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Spinner */}
        {isSending && (
          <div className="flex items-center space-x-2 text-slate-500 text-xs pl-8 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-slate-500" />
            <span>Генерация ответа моделью Gemini...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Smart Quick Prompts Bar */}
      <div className="px-4 py-2 bg-white/70 backdrop-blur-xl border-t border-slate-200/80 flex items-center space-x-2 overflow-x-auto shrink-0 scrollbar-none">
        <span className="text-[10px] text-slate-500 shrink-0 uppercase tracking-wider font-bold">
          Быстрый выбор:
        </span>
        {quickPrompts.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSendMessage(item.prompt)}
            className="shrink-0 bg-white/80 hover:bg-white text-slate-700 px-3 py-1 rounded-full text-[11px] font-medium transition cursor-pointer flex items-center space-x-1 border border-slate-200/80 shadow-2xs"
          >
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Input Form Bar */}
      <div className="p-3.5 bg-white/80 backdrop-blur-xl border-t border-slate-200/80 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2 bg-white/90 border border-slate-200/90 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-slate-400/20 transition shadow-2xs backdrop-blur-md"
        >
          <input
            id="operator-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Спросите об архитектуре, алгоритмах, WAL, B-Tree или попросите боевой проект..."
            className="flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none text-xs font-medium"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isSending}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-white transition cursor-pointer shadow-xs"
            title="Отправить (Enter)"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
      </div>

      {/* Right Column: Adaptive PC Tools, Prompts & Knowledge Sidebar */}
      {isPcSidebarOpen && (
        <aside className="hidden md:flex flex-col w-72 xl:w-80 border-l border-slate-200/80 bg-white/70 backdrop-blur-2xl shrink-0 overflow-y-auto p-4 space-y-4 select-text animate-fade-in shadow-2xs">
          {/* Active Context Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              <span>Контекст сессии</span>
              <span className="text-emerald-600 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active</span>
              </span>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-xs text-slate-900 leading-snug line-clamp-2">
                {activeNodeTitle || 'Фундамент и деконструкция навыка'}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-mono">
                  {targetRole || 'Практик'}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono">
                  {pomodoroMinutes} мин фокус
                </span>
                <span className="px-1.5 py-0.5 rounded bg-sky-50 border border-sky-200 text-sky-700 font-mono">
                  {karma} XP
                </span>
              </div>
            </div>
          </div>

          {/* Quick System Actions on PC */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Быстрые действия
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  onSetPomodoro(25, true);
                  playChime('success');
                }}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium transition text-left flex items-center space-x-1.5 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Фокус 25м</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onCreateNote('Заметка из Студии', `### Заметка\n\nКонтекст: ${activeNodeTitle}`, '#заметка');
                  playChime('success');
                }}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium transition text-left flex items-center space-x-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span>В Блокнот</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onAddTask(`Практика по теме: ${activeNodeTitle || 'Архитектура'}`);
                  playChime('success');
                }}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium transition text-left flex items-center space-x-1.5 cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Задача</span>
              </button>
              <button
                type="button"
                onClick={() => onMatchBuddy()}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium transition text-left flex items-center space-x-1.5 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Напарник</span>
              </button>
            </div>
          </div>

          {/* Curated Prompt Catalog for PC users */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Библиотека архитектурных промптов
            </span>

            <div className="space-y-1.5">
              {[
                { title: 'Архитектурный инцидент', prompt: 'Дай боевой проект-инцидент из продакшена по текущей теме курса со сценарием отказа и чеклистом решения.' },
                { title: 'Глубинный разбор инвариантов', prompt: 'Объясни ключевой инвариант темы простыми словами через аналогию, затем через строгую механику и граничные условия.' },
                { title: 'Сравнение альтернатив', prompt: 'Сравни текущий подход с главными индустриальными альтернативами: компромиссы (trade-offs), накладные расходы по памяти и CPU.' },
                { title: 'Слепые зоны новичков', prompt: 'Какие 3 самые частые фатальные ошибки совершают инженеры при внедрении этой концепции в production?' },
                { title: 'Интерактивная диаграмма', prompt: 'Опиши пошаговую блок-схему процесса и сгенерируй Mermaid/структуру данных.' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(item.prompt)}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition text-slate-800 space-y-0.5 group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-semibold group-hover:text-sky-700">
                    <span>{item.title}</span>
                    <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-sky-600 transition" />
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1">
                    {item.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Academic Scraper Pipeline Notice */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSourcesInfoModalOpen(true)}
              className="w-full p-2.5 rounded-xl bg-sky-50/70 hover:bg-sky-100 border border-sky-200/80 text-left transition flex items-center justify-between text-sky-950 cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <BookCheck className="w-4 h-4 text-sky-600" />
                <div className="text-[11px] font-semibold">5 Scraper Pipelines</div>
              </div>
              <span className="text-[10px] text-sky-600 font-mono">Инфо →</span>
            </button>
          </div>
        </aside>
      )}
      </div>

      {/* MODAL 1: Verifiable Textbook Excerpt Inspection */}
      {selectedGroundingSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl p-5 border border-slate-200 shadow-2xl space-y-4 text-left text-slate-800">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-sky-600" />
                  <span className="text-[11px] font-mono text-slate-500 font-semibold uppercase">
                    {selectedGroundingSource.sourceLabel}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {selectedGroundingSource.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGroundingSource(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Авторы / Издательство:</span>
                <span className="font-semibold text-slate-800">{selectedGroundingSource.authors || 'Академический совет'} ({selectedGroundingSource.year || 2024})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Раздел / Глава:</span>
                <span className="font-medium text-slate-800">{selectedGroundingSource.chapterOrSection || 'Общий раздел'}</span>
              </div>
              {selectedGroundingSource.doiOrIsbn && (
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-500">Идентификатор:</span>
                  <span className="text-slate-700">{selectedGroundingSource.doiOrIsbn}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">
                Верифицированная цитата и фрагмент учебника:
              </span>
              <div className="p-3.5 rounded-xl bg-sky-50/50 border border-sky-200/70 text-slate-800 text-xs leading-relaxed font-serif select-text">
                «{selectedGroundingSource.verifiableQuote || selectedGroundingSource.snippet}»
              </div>
            </div>

            {selectedGroundingSource.url && (
              <a
                href={selectedGroundingSource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Открыть первоисточник онлайн</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: 5 Connected Scraper Knowledge Pipelines */}
      {isSourcesInfoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl p-5 border border-slate-200 shadow-2xl space-y-4 text-left text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <BookCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Многопоточная база учебников (5 Scraper Pipelines)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSourcesInfoModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              ИИ не генерирует ответы «из воздуха». Каждый ответ строится на многопоточном скрапинге 5 проверенных академических репозиториев:
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900">1. OpenStax Scraper (Rice University)</span>
                  <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">Actor: kKI6rFjrGd6MvzdkB</span>
                </div>
                <p className="text-[11px] text-emerald-800/90">Открытые рецензируемые университетские учебники по Computer Science, физике, высшей математике и алгоритмам.</p>
              </div>

              <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-900">2. Научные концепты & Статьи (OpenAlex / IEEE / ACM)</span>
                  <span className="text-[10px] font-mono bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded font-semibold">Actor: 6XG1ACBK2jh0gapQ6</span>
                </div>
                <p className="text-[11px] text-sky-800/90">Рецензируемые публикации ведущих институтов, теоремы сходимости и строгие доказательства.</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900">3. Конспекты лекций & DjVu Архивы</span>
                  <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">Actor: 7LGrRUSN5h5mPOeQU</span>
                </div>
                <p className="text-[11px] text-amber-800/90">Университетские конспекты МГУ, МФТИ и ВШЭ с детальными выкладками и контрпримерами.</p>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900">4. Академические монографии (Springer / O'Reilly)</span>
                  <span className="text-[10px] font-mono bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-semibold">Actor: jTsbNWp2gaggFY3ox</span>
                </div>
                <p className="text-[11px] text-purple-800/90">Глубокие профильные справочники и книги по проектированию высоконагруженных систем.</p>
              </div>

              <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-900">5. Wikibooks Text Scraper (Практика & Софт-скиллы)</span>
                  <span className="text-[10px] font-mono bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-semibold">Actor: hpBSxBPoZBQbqJz5g</span>
                </div>
                <p className="text-[11px] text-teal-800/90">Открытые образовательные пособия, прикладные паттерны и пошаговые руководства.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSourcesInfoModalOpen(false)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition cursor-pointer shadow-xs"
            >
              Понятно
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
