import React, { useState } from 'react';
import { 
  Tv, 
  Play, 
  BookOpen, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Layers, 
  Award, 
  Sparkles, 
  FileText, 
  ExternalLink,
  Target,
  ArrowRight,
  Flame
} from 'lucide-react';
import { LearningUnit, DAGNode } from '../../../types.ts';
import { playChime } from '../../../utils/audio.ts';

interface CurrentUnitWidgetProps {
  unit?: LearningUnit | null;
  activeNode?: DAGNode | any;
  nodes?: (DAGNode | any)[];
  onLaunchUnit: (unitId: string) => void;
  onSelectUnit?: (unitId: string) => void;
  onOpenDag?: () => void;
  onSaveNote?: (title: string, content: string, tag: string) => void;
}

export const CurrentUnitWidget: React.FC<CurrentUnitWidgetProps> = ({ 
  unit, 
  activeNode,
  nodes = [],
  onLaunchUnit,
  onSelectUnit,
  onOpenDag,
  onSaveNote
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Safe fallback resolution of unit information
  const title = activeNode?.title || unit?.title || 'Фундаментальный квант знаний';
  const category = activeNode?.phaseTitle || activeNode?.sprint || unit?.category || 'Обучение';
  const durationMins = Math.round((unit?.durationSec || 1800) / 60);
  const authorName = unit?.authorName || 'AI Mentor & Staff Architect';
  const artifactName = activeNode?.targetArtifact || unit?.projectTask?.title || unit?.title || 'Практический артефакт';
  const unitId = unit?.id || activeNode?.unitId || activeNode?.id || 'unit-1';

  // Determine current node index in nodes list
  const currentIndex = nodes.findIndex((n) => n.id === activeNode?.id || n.unitId === unitId);
  const totalNodes = Math.max(nodes.length, 1);
  const displayIndex = currentIndex >= 0 ? currentIndex + 1 : 1;

  // Status computation
  const isCompleted = activeNode?.status === 'completed';
  const isInProgress = activeNode?.status === 'active' || activeNode?.status === 'in_progress';
  const isStuck = activeNode?.status === 'stuck_injected';

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleNextUnit = () => {
    if (nodes.length <= 1) return;
    const nextIdx = (currentIndex + 1) % nodes.length;
    const nextNode = nodes[nextIdx];
    if (nextNode && onSelectUnit) {
      onSelectUnit(nextNode.unitId || nextNode.id);
      playChime('click');
      triggerToast(`Переключено: «${nextNode.title.slice(0, 18)}...»`);
    }
  };

  const handlePrevUnit = () => {
    if (nodes.length <= 1) return;
    const prevIdx = (currentIndex - 1 + nodes.length) % nodes.length;
    const prevNode = nodes[prevIdx];
    if (prevNode && onSelectUnit) {
      onSelectUnit(prevNode.unitId || prevNode.id);
      playChime('click');
      triggerToast(`Переключено: «${prevNode.title.slice(0, 18)}...»`);
    }
  };

  const handleLaunch = () => {
    playChime('success');
    onLaunchUnit(unitId);
  };

  const handleSaveToNotes = () => {
    const noteTitle = `Конспект модуля: ${title}`;
    const noteContent = `### ${title}\n**Направление:** ${category}\n**Артефакт:** ${artifactName}\n**Время:** ~${durationMins} мин\n\n${unit?.summaryMarkdown || 'Ключевой образовательный квант траектории обучения.'}`;
    const noteTag = '#модуль';

    if (onSaveNote) {
      onSaveNote(noteTitle, noteContent, noteTag);
    }

    // Broadcast event for sticky notes & notes window
    window.dispatchEvent(
      new CustomEvent('learning_note_added', {
        detail: {
          id: `note-unit-${Date.now()}`,
          title: noteTitle,
          content: noteContent,
          tag: noteTag,
          createdAt: 'Только что',
        },
      })
    );

    playChime('success');
    triggerToast('Модуль сохранен в конспект!');
  };

  return (
    <div className="h-full flex flex-col justify-between p-3 text-slate-800 select-none text-xs bg-gradient-to-b from-white to-sky-50/25 relative">
      {/* Toast feedback pill */}
      {toastMessage && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 px-3 py-1 bg-slate-900/95 text-white text-[10px] font-medium rounded-full shadow-xl flex items-center space-x-1.5 animate-fade-in pointer-events-none backdrop-blur-md">
          <CheckCircle2 className="w-3 h-3 text-sky-400 shrink-0" />
          <span className="truncate max-w-[200px]">{toastMessage}</span>
        </div>
      )}

      {/* 1. Header with Unit Index & Category Badge */}
      <div className="flex items-center justify-between pb-1.5 border-b border-sky-100 gap-1.5 shrink-0 min-w-0">
        <div className="flex items-center space-x-1.5 font-bold text-slate-900 text-xs min-w-0 truncate">
          <div className="w-5 h-5 rounded-md bg-sky-500/15 flex items-center justify-center text-sky-600 shrink-0">
            <Tv className="w-3.5 h-3.5" />
          </div>
          <span className="truncate">Текущий модуль</span>
        </div>

        {/* Status Chip */}
        <div className="flex items-center space-x-1 shrink-0">
          {isCompleted ? (
            <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
              <span>Освоен</span>
            </span>
          ) : isStuck ? (
            <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-semibold animate-pulse">
              <span>Затык</span>
            </span>
          ) : isInProgress ? (
            <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-semibold">
              <Flame className="w-2.5 h-2.5 fill-sky-500 text-sky-600" />
              <span>В процессе</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
              <span>К изучению</span>
            </span>
          )}

          {/* Unit pager buttons if trajectory has multiple nodes */}
          {nodes.length > 1 && (
            <div className="flex items-center space-x-0.5 pl-1 border-l border-slate-200">
              <button
                type="button"
                onClick={handlePrevUnit}
                className="p-1 rounded hover:bg-slate-100 text-slate-500 transition cursor-pointer"
                title="Предыдущий модуль"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="text-[10px] font-mono text-slate-500 min-w-[24px] text-center">
                {displayIndex}/{totalNodes}
              </span>
              <button
                type="button"
                onClick={handleNextUnit}
                className="p-1 rounded hover:bg-slate-100 text-slate-500 transition cursor-pointer"
                title="Следующий модуль"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Unit Card */}
      <div className="my-1.5 p-2.5 bg-sky-50/70 hover:bg-sky-50/90 rounded-xl border border-sky-100/90 select-text transition flex-1 flex flex-col justify-between shadow-2xs">
        <div>
          {/* Category Chip + Save Action */}
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="inline-flex items-center text-[10px] font-semibold text-sky-700 uppercase tracking-wider bg-white/90 px-1.5 py-0.5 rounded border border-sky-200/60 shadow-2xs truncate max-w-[170px]">
              {category}
            </span>
            <button
              type="button"
              onClick={handleSaveToNotes}
              className="p-1 rounded text-slate-400 hover:text-amber-700 hover:bg-amber-100/50 transition cursor-pointer shrink-0"
              title="Сохранить конспект модуля"
            >
              <FileText className="w-3 h-3" />
            </button>
          </div>

          {/* Unit Title */}
          <h4 className="font-bold text-slate-900 text-xs line-clamp-2 leading-snug mb-1.5">
            {title}
          </h4>

          {/* Artifact pill */}
          <div className="p-1.5 bg-white/90 rounded-lg border border-sky-100 text-[10px] text-slate-700 flex items-center space-x-1.5 mb-1.5">
            <Target className="w-3 h-3 text-sky-600 shrink-0" />
            <span className="truncate">
              Артефакт: <strong className="text-slate-900">{artifactName}</strong>
            </span>
          </div>
        </div>

        {/* Metadata Footer (Duration & Author) */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-sky-100/70">
          <span className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>~{durationMins} мин</span>
          </span>
          <span className="flex items-center space-x-1 truncate max-w-[140px]">
            <BookOpen className="w-3 h-3 text-slate-400" />
            <span className="truncate">{authorName}</span>
          </span>
        </div>
      </div>

      {/* 3. Action Buttons Bar */}
      <div className="pt-1 flex items-center space-x-1.5 shrink-0">
        {onOpenDag && (
          <button
            type="button"
            onClick={() => {
              playChime('click');
              onOpenDag();
            }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition cursor-pointer flex items-center space-x-1 shrink-0"
            title="Посмотреть на DAG-графе"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Граф</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleLaunch}
          className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition cursor-pointer shadow-xs active:scale-98"
          title="Запустить практический урок в Фокус-Студии"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Запустить урок</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
