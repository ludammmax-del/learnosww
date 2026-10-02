import React, { useState } from 'react';
import { ArrowRight, BookOpen, Check, Code2, Copy } from 'lucide-react';
import { BlockGraphicSnapshot } from '../../types.ts';
import { playChime } from '../../utils/audio.ts';

interface BlockGraphicSnapshotCardProps {
  snapshot: BlockGraphicSnapshot;
  onSelectUnit?: (unitId: string) => void;
  isCompact?: boolean;
}

export const BlockGraphicSnapshotCard: React.FC<BlockGraphicSnapshotCardProps> = ({
  snapshot,
  onSelectUnit,
  isCompact = false,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (snapshot.starterCode) {
      navigator.clipboard.writeText(snapshot.starterCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      playChime('click');
    }
  };

  const handleJumpToUnit = (e: React.MouseEvent) => {
    e.stopPropagation();
    playChime('success');
    onSelectUnit?.(snapshot.unitId);
  };

  const markdownPreview = (snapshot.summaryMarkdown || snapshot.summary || '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_`]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  const projectDescription = snapshot.projectDescription || snapshot.coreInvariant;
  const projectRequirements = snapshot.projectRequirements || snapshot.requirements;

  return (
    <article className={`w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm font-sans my-2 ${isCompact ? '' : 'group'}`}>
      <header className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          {snapshot.category && <span>{snapshot.category}</span>}
          {snapshot.category && snapshot.authorName && <span aria-hidden="true">·</span>}
          {snapshot.authorName && <span className="truncate">{snapshot.authorName}</span>}
          {snapshot.blockIndex != null && <span className="ml-auto shrink-0">Блок {snapshot.blockIndex}</span>}
          {snapshot.durationMin != null && <span className="shrink-0">· {snapshot.durationMin} мин</span>}
        </div>
        <h3 className="mt-1 text-sm font-bold leading-snug text-slate-900">{snapshot.title}</h3>
      </header>

      <div className="p-4 space-y-3">
        {markdownPreview && (
          <section>
            <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <BookOpen className="h-3.5 w-3.5 text-sky-600" />
              Конспект блока
            </h4>
            <p className="line-clamp-5 whitespace-pre-line text-xs leading-relaxed text-slate-600">{markdownPreview}</p>
          </section>
        )}

        {(snapshot.projectTitle || projectDescription || projectRequirements?.length) && (
          <section className="border-t border-slate-100 pt-3">
            <h4 className="text-xs font-semibold text-slate-800">
              {snapshot.projectTitle || 'Практическое задание'}
            </h4>
            {projectDescription && <p className="mt-1 text-xs leading-relaxed text-slate-600">{projectDescription}</p>}
            {projectRequirements && projectRequirements.length > 0 && (
              <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-600">
                {projectRequirements.slice(0, 3).map((requirement, index) => <li key={index}>{requirement}</li>)}
              </ul>
            )}
          </section>
        )}

        {snapshot.starterCode && (
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 text-[11px] text-slate-500">
              <span className="flex min-w-0 items-center gap-1.5 truncate">
                <Code2 className="h-3.5 w-3.5 shrink-0 text-sky-600" />
                {snapshot.projectFilename || 'Стартовый код'}
              </span>
              <button type="button" onClick={handleCopyCode} title="Копировать код" className="ml-2 shrink-0 p-1 text-slate-500 hover:text-slate-900">
                {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <pre className="max-h-24 overflow-auto whitespace-pre p-3 font-mono text-[11px] leading-relaxed text-slate-700">{snapshot.starterCode.trim()}</pre>
          </section>
        )}
      </div>

      {onSelectUnit && (
        <footer className="flex justify-end border-t border-slate-100 px-4 py-2">
          <button type="button" onClick={handleJumpToUnit} className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-900">
            Открыть блок <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </footer>
      )}
    </article>
  );
};
