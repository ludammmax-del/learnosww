import React, { useState, useRef, useEffect, useMemo } from 'react';
import { BookOpen, ExternalLink, HelpCircle, Lightbulb, ArrowDown, X, Code2, Copy, Check, Sparkles } from 'lucide-react';
import { GlossaryTerm, GroundingSourceItem } from '../../types.ts';
import { playChime } from '../../utils/audio.ts';
import { RichVisualDiagramRenderer } from './RichVisualDiagramRenderer.tsx';

interface AnnotatedTheoryContentProps {
  markdownText: string;
  activeSources: GroundingSourceItem[];
  glossaryTerms?: GlossaryTerm[];
  onOpenSourceInspector: (src: GroundingSourceItem, num: number) => void;
  onTermSelected?: (term: string) => void;
  onRequestDiagramGen?: () => void;
}

type ParsedContentBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'quote'; text: string }
  | { type: 'list-item'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'spacer' }
  | { type: 'diagram'; language: string; code: string; title?: string }
  | { type: 'code'; language: string; code: string };

export const AnnotatedTheoryContent: React.FC<AnnotatedTheoryContentProps> = ({
  markdownText,
  activeSources,
  glossaryTerms = [],
  onOpenSourceInspector,
  onTermSelected,
  onRequestDiagramGen,
}) => {
  const [activeTooltip, setActiveTooltip] = useState<{
    term: GlossaryTerm;
    x: number;
    y: number;
  } | null>(null);
  const [copiedSnippetIdx, setCopiedSnippetIdx] = useState<number | null>(null);

  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setActiveTooltip(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToGlossaryTerm = (term: string) => {
    setActiveTooltip(null);
    if (onTermSelected) {
      onTermSelected(term);
    }
    const safeId = `glossary-term-${encodeURIComponent(term.toLowerCase().replace(/\s+/g, '-'))}`;
    const el = document.getElementById(safeId) || document.getElementById('theory-glossary-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      playChime('click');
    }
  };

  // Build a lookup map and pre-compiled regex for known glossary terms
  const { termsMap, termRegex } = useMemo(() => {
    const map = new Map<string, GlossaryTerm>();
    glossaryTerms.forEach(t => {
      map.set(t.term.toLowerCase().trim(), t);
    });

    const escapedTerms = glossaryTerms
      .map(t => t.term.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .filter(t => t.length > 2)
      .sort((a, b) => b.length - a.length); // longest terms first

    const regex = escapedTerms.length > 0 ? new RegExp(`(${escapedTerms.join('|')})`, 'gi') : null;
    return { termsMap: map, termRegex: regex };
  }, [glossaryTerms]);

  // Helper to render inline formatting (bold, italic, inline code)
  const renderFormattedInline = (raw: string, keyPrefix: string) => {
    // Regex matching inline code `...`, bold **...**, italic *...*
    const tokens = raw.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return tokens.map((token, tIdx) => {
      if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
        return (
          <code
            key={`${keyPrefix}-code-${tIdx}`}
            className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-100 dark:bg-slate-800 text-sky-700 dark:text-sky-300 font-mono text-[11px] border border-slate-200/80 dark:border-slate-700/80"
          >
            {token.slice(1, -1)}
          </code>
        );
      }
      if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
        return (
          <strong key={`${keyPrefix}-b-${tIdx}`} className="font-bold text-slate-900 dark:text-slate-100">
            {token.slice(2, -2)}
          </strong>
        );
      }
      if (token.startsWith('*') && token.endsWith('*') && token.length >= 2) {
        return (
          <em key={`${keyPrefix}-i-${tIdx}`} className="italic text-slate-800 dark:text-slate-200">
            {token.slice(1, -1)}
          </em>
        );
      }
      return <span key={`${keyPrefix}-txt-${tIdx}`}>{token}</span>;
    });
  };

  // Helper to render text with clickable citation badges [1], [2] and term badges
  const renderAnnotatedText = (text: string) => {
    // Check for citation brackets [1], [2]
    const parts = text.split(/(\[\d+\])/g);

    return parts.map((part, pIdx) => {
      const matchCitation = part.match(/\[(\d+)\]/);
      if (matchCitation) {
        const num = parseInt(matchCitation[1], 10);
        const src = activeSources[num - 1] || activeSources[0];
        return (
          <button
            key={`cit-${pIdx}`}
            type="button"
            onClick={() => {
              onOpenSourceInspector(src, num);
              playChime('click');
            }}
            className="inline-flex items-center px-1.5 py-0.2 mx-0.5 text-[10px] font-mono font-bold text-sky-700 bg-sky-100 hover:bg-sky-200 border border-sky-300 rounded cursor-pointer transition transform hover:scale-105 select-none"
            title={`Первоисточник [${num}]: ${src?.title || 'Академический первоисточник'}`}
          >
            <span>[{num}]</span>
          </button>
        );
      }

      // Check if this part contains any of our glossary terms
      if (termRegex) {
        const subSegments = part.split(termRegex);

        return (
          <React.Fragment key={`sub-${pIdx}`}>
            {subSegments.map((segment, sIdx) => {
              const matchedTerm = termsMap.get(segment.toLowerCase().trim());
              if (matchedTerm) {
                return (
                  <span
                    key={`term-${sIdx}`}
                    onClick={(e) => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      setActiveTooltip({
                        term: matchedTerm,
                        x: rect.left,
                        y: rect.bottom + 6,
                      });
                      playChime('click');
                    }}
                    className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 mx-0.5 rounded-md bg-amber-100/90 hover:bg-amber-200 text-slate-900 font-semibold border border-amber-300/80 cursor-pointer transition select-none group/term"
                    title={`Термин: ${matchedTerm.term} (нажмите для пояснения)`}
                  >
                    <span>{segment}</span>
                    <span className="text-[11px] text-amber-700 group-hover/term:scale-110 transition shrink-0">
                      📖
                    </span>
                  </span>
                );
              }
              return (
                <React.Fragment key={`txt-${sIdx}`}>
                  {renderFormattedInline(segment, `seg-${pIdx}-${sIdx}`)}
                </React.Fragment>
              );
            })}
          </React.Fragment>
        );
      }

      return (
        <React.Fragment key={`raw-${pIdx}`}>
          {renderFormattedInline(part, `raw-${pIdx}`)}
        </React.Fragment>
      );
    });
  };

  // Structured Markdown Parser that handles Codeblocks & Visual Diagrams
  const parsedBlocks: ParsedContentBlock[] = [];
  const lines = (markdownText || '').split('\n');
  let inCodeBlock = false;
  let currentCodeLang = '';
  let currentCodeLines: string[] = [];

  const diagramLanguages = new Set([
    'mermaid', 'chart', 'diagram', 'schema', 'process', 'pipeline',
    'mindmap', 'comparison', 'matrix', 'flowchart', 'graph', 'chart:bar',
    'chart:line', 'chart:pie', 'chart:metric', 'chart:comparison'
  ]);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      if (!inCodeBlock) {
        // Starting a code block
        inCodeBlock = true;
        currentCodeLang = trimmed.replace('```', '').trim().toLowerCase();
        currentCodeLines = [];
      } else {
        // Ending a code block
        inCodeBlock = false;
        const fullCode = currentCodeLines.join('\n');
        const isDiagram = diagramLanguages.has(currentCodeLang) ||
          currentCodeLang.startsWith('chart') ||
          currentCodeLang.startsWith('flow') ||
          currentCodeLang.startsWith('graph') ||
          fullCode.includes('graph TD') ||
          fullCode.includes('graph LR') ||
          fullCode.includes('flowchart') ||
          fullCode.startsWith('type:');

        if (isDiagram) {
          parsedBlocks.push({
            type: 'diagram',
            language: currentCodeLang || 'mermaid',
            code: fullCode,
          });
        } else {
          parsedBlocks.push({
            type: 'code',
            language: currentCodeLang || 'text',
            code: fullCode,
          });
        }
        currentCodeLines = [];
        currentCodeLang = '';
      }
      continue;
    }

    if (inCodeBlock) {
      currentCodeLines.push(line);
      continue;
    }

    if (line.startsWith('### ')) {
      parsedBlocks.push({ type: 'heading', level: 3, text: line.replace('### ', '') });
    } else if (line.startsWith('#### ')) {
      parsedBlocks.push({ type: 'heading', level: 4, text: line.replace('#### ', '') });
    } else if (line.startsWith('> ')) {
      parsedBlocks.push({ type: 'quote', text: line.replace('> ', '') });
    } else if (line.startsWith('* ') || line.startsWith('- ')) {
      parsedBlocks.push({ type: 'list-item', text: line.substring(2) });
    } else if (line.trim().length === 0) {
      parsedBlocks.push({ type: 'spacer' });
    } else {
      parsedBlocks.push({ type: 'paragraph', text: line });
    }
  }

  // If unclosed code block, flush it
  if (inCodeBlock && currentCodeLines.length > 0) {
    parsedBlocks.push({
      type: 'diagram',
      language: currentCodeLang || 'mermaid',
      code: currentCodeLines.join('\n'),
    });
  }

  return (
    <div className="relative">
      <div className="prose prose-slate prose-xs max-w-none text-slate-700 leading-relaxed space-y-3 font-normal">
        {parsedBlocks.map((block, idx) => {
          if (block.type === 'heading') {
            if (block.level === 3) {
              return (
                <h4 key={idx} className="text-sm font-bold text-slate-900 mt-4 mb-2 flex items-center space-x-2">
                  <span>{block.text}</span>
                </h4>
              );
            }
            return (
              <h5 key={idx} className="text-xs font-semibold text-sky-800 mt-3 mb-1">
                {block.text}
              </h5>
            );
          }

          if (block.type === 'quote') {
            return (
              <blockquote key={idx} className="p-3 my-2 bg-slate-50 border-l-3 border-sky-600 rounded-r-xl text-xs text-slate-700 italic">
                {renderAnnotatedText(block.text)}
              </blockquote>
            );
          }

          if (block.type === 'list-item') {
            return (
              <li key={idx} className="ml-4 list-disc text-slate-700 leading-relaxed my-1">
                {renderAnnotatedText(block.text)}
              </li>
            );
          }

          if (block.type === 'spacer') {
            return <div key={idx} className="h-1.5" />;
          }

          if (block.type === 'diagram') {
            return (
              <RichVisualDiagramRenderer
                key={idx}
                rawCode={block.code}
                language={block.language}
                title={block.title}
              />
            );
          }

          if (block.type === 'code') {
            const isSnippetCopied = copiedSnippetIdx === idx;
            return (
              <div key={idx} className="my-3 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden text-xs">
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
                  <span className="font-mono text-sky-400">{block.language}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(block.code);
                      setCopiedSnippetIdx(idx);
                      playChime('click');
                      setTimeout(() => setCopiedSnippetIdx(null), 2000);
                    }}
                    className="flex items-center space-x-1 hover:text-white transition cursor-pointer"
                  >
                    {isSnippetCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{isSnippetCopied ? 'Скопировано' : 'Копировать'}</span>
                  </button>
                </div>
                <pre className="p-3 font-mono text-slate-200 overflow-x-auto">
                  <code>{block.code}</code>
                </pre>
              </div>
            );
          }

          return (
            <p key={idx} className="leading-relaxed text-slate-700 my-1.5">
              {renderAnnotatedText(block.text)}
            </p>
          );
        })}
      </div>

      {/* Interactive Tooltip Popover for Clicked Term */}
      {activeTooltip && (
        <div
          ref={tooltipRef}
          className="fixed z-50 w-80 p-3.5 bg-slate-950 text-white rounded-2xl shadow-xl border border-slate-800 space-y-2.5 animate-scale-up text-xs"
          style={{
            left: Math.min(window.innerWidth - 340, Math.max(20, activeTooltip.x)),
            top: Math.min(window.innerHeight - 250, activeTooltip.y),
          }}
        >
          <div className="flex items-start justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <span className="text-amber-400 font-mono text-sm">📖</span>
              <span className="font-bold text-amber-300 text-xs truncate max-w-[200px]">
                {activeTooltip.term.term}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTooltip(null)}
              className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-slate-200 text-xs leading-relaxed">
            {activeTooltip.term.definition}
          </p>

          {activeTooltip.term.simpleAnalogy && (
            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 text-[11px] text-amber-200/90 space-y-0.5">
              <div className="flex items-center space-x-1 font-bold text-amber-400">
                <Lightbulb className="w-3 h-3" />
                <span>Аналогия:</span>
              </div>
              <p className="text-slate-300">{activeTooltip.term.simpleAnalogy}</p>
            </div>
          )}

          <div className="pt-1 flex items-center justify-between">
            <button
              type="button"
              onClick={() => scrollToGlossaryTerm(activeTooltip.term.term)}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-medium flex items-center space-x-1 cursor-pointer"
            >
              <span>Посмотреть в словаре блока</span>
              <ArrowDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
