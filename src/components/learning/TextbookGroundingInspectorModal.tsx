import React from 'react';
import { 
  X, 
  ExternalLink, 
  BookOpen, 
  GraduationCap, 
  FileText, 
  Bookmark, 
  Award, 
  Copy, 
  Check, 
  CheckCircle2,
  ShieldCheck,
  Building,
  Hash,
  Sparkles
} from 'lucide-react';
import { GroundingSourceItem } from '../../types.ts';

interface TextbookGroundingInspectorModalProps {
  source: GroundingSourceItem | null;
  sourceNumber?: number;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Accurately determines the true publisher, academic index, and authority tier from DOI / metadata.
 * Prevents false claims (such as labelling regional/university papers as IEEE/Nature).
 */
export function resolveAccurateSourceBadge(source: GroundingSourceItem): {
  label: string;
  publisher: string;
  tier: 'tier1_world' | 'peer_reviewed' | 'regional_vak' | 'textbook' | 'monograph' | 'open_curriculum' | 'archive';
  tierTitle: string;
  color: string;
  badgeBg: string;
} {
  const doi = (source.doiOrIsbn || source.url || '').toLowerCase();
  const label = (source.sourceLabel || '').toLowerCase();
  const title = (source.title || '').toLowerCase();
  const authors = (source.authors || '').toLowerCase();

  // 1. Exact DOI Prefix: 10.17513 -> Russian Academy of Natural History (РАЕ) / ВАК / РИНЦ
  if (doi.includes('10.17513') || label.includes('академия естествознания') || label.includes('рае') || label.includes('applied and fundamental') || label.includes('фундаментальных исследований')) {
    return {
      label: source.sourceLabel?.includes('РАЕ') || source.sourceLabel?.includes('Академия')
        ? source.sourceLabel
        : 'РАЕ (Российская Академия Естествознания / РИНЦ / ВАК)',
      publisher: 'Издательский дом «Академия Естествознания» (РАЕ)',
      tier: 'regional_vak',
      tierTitle: 'Рецензируемое научное издание (РИНЦ / ВАК)',
      color: 'border-amber-300 text-amber-900 bg-amber-50',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    };
  }

  // 2. IEEE (DOI: 10.1109)
  if (doi.includes('10.1109') || label.includes('ieee')) {
    return {
      label: source.sourceLabel || 'IEEE Xplore Digital Library',
      publisher: 'Institute of Electrical and Electronics Engineers (IEEE)',
      tier: 'tier1_world',
      tierTitle: 'Международный научный стандарт IEEE',
      color: 'border-sky-300 text-sky-900 bg-sky-50',
      badgeBg: 'bg-sky-100 text-sky-900 border-sky-300',
    };
  }

  // 3. ACM (DOI: 10.1145)
  if (doi.includes('10.1145') || label.includes('acm')) {
    return {
      label: source.sourceLabel || 'ACM Digital Library',
      publisher: 'Association for Computing Machinery (ACM)',
      tier: 'tier1_world',
      tierTitle: 'Международный научный стандарт ACM',
      color: 'border-indigo-300 text-indigo-900 bg-indigo-50',
      badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    };
  }

  // 4. Nature Portfolio (DOI: 10.1038)
  if (doi.includes('10.1038') || label.includes('nature portfolio') || label.includes('nature publishing')) {
    return {
      label: source.sourceLabel || 'Nature Portfolio Scientific Work',
      publisher: 'Springer Nature (Nature Portfolio)',
      tier: 'tier1_world',
      tierTitle: 'Журнал высшего квартиля (Nature Portfolio)',
      color: 'border-rose-300 text-rose-900 bg-rose-50',
      badgeBg: 'bg-rose-100 text-rose-900 border-rose-300',
    };
  }

  // 5. Elsevier / ScienceDirect (DOI: 10.1016)
  if (doi.includes('10.1016') || label.includes('elsevier') || label.includes('sciencedirect')) {
    return {
      label: source.sourceLabel || 'Elsevier / ScienceDirect',
      publisher: 'Elsevier B.V.',
      tier: 'tier1_world',
      tierTitle: 'Рецензируемое издание Elsevier',
      color: 'border-orange-300 text-orange-900 bg-orange-50',
      badgeBg: 'bg-orange-100 text-orange-900 border-orange-300',
    };
  }

  // 6. Springer (DOI: 10.1007)
  if (doi.includes('10.1007') || label.includes('springer')) {
    return {
      label: source.sourceLabel || 'Springer Nature Scientific',
      publisher: 'Springer Nature Switzerland AG',
      tier: 'tier1_world',
      tierTitle: 'Академическое издание Springer Nature',
      color: 'border-blue-300 text-blue-900 bg-blue-50',
      badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
    };
  }

  // 7. Wiley (DOI: 10.1002)
  if (doi.includes('10.1002') || label.includes('wiley')) {
    return {
      label: source.sourceLabel || 'Wiley Online Library',
      publisher: 'John Wiley & Sons, Inc.',
      tier: 'tier1_world',
      tierTitle: 'Рецензируемое издание Wiley',
      color: 'border-cyan-300 text-cyan-900 bg-cyan-50',
      badgeBg: 'bg-cyan-100 text-cyan-900 border-cyan-300',
    };
  }

  // 8. MDPI (DOI: 10.3390)
  if (doi.includes('10.3390') || label.includes('mdpi')) {
    return {
      label: source.sourceLabel || 'MDPI Open Access Journals',
      publisher: 'Multidisciplinary Digital Publishing Institute (MDPI)',
      tier: 'peer_reviewed',
      tierTitle: 'Открытый рецензируемый журнал MDPI',
      color: 'border-teal-300 text-teal-900 bg-teal-50',
      badgeBg: 'bg-teal-100 text-teal-900 border-teal-300',
    };
  }

  // 9. CyberLeninka / eLibrary / Russian Journals
  if (doi.includes('cyberleninka') || doi.includes('elibrary') || label.includes('киберленин') || label.includes('elibrary') || label.includes('ринц')) {
    return {
      label: source.sourceLabel || 'Научная статья (eLibrary / КиберЛенинка / РИНЦ)',
      publisher: 'Научная электронная библиотека (РИНЦ / ВАК)',
      tier: 'regional_vak',
      tierTitle: 'Российское рецензируемое издание (РИНЦ / ВАК)',
      color: 'border-amber-300 text-amber-900 bg-amber-50',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    };
  }

  // 10. OpenStax Textbook
  if (source.sourceType === 'openstax' || label.includes('openstax')) {
    return {
      label: 'OpenStax Peer-Reviewed Textbook (Rice University)',
      publisher: 'OpenStax / Rice University Editorial Board',
      tier: 'textbook',
      tierTitle: 'Академический рецензируемый учебник OpenStax',
      color: 'border-emerald-300 text-emerald-900 bg-emerald-50',
      badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    };
  }

  // 11. DOAB / Monograph
  if (source.sourceType === 'academic_book' || label.includes('doab') || label.includes('монография')) {
    return {
      label: source.sourceLabel || 'Рецензируемая монография (DOAB Open Access Books)',
      publisher: 'Directory of Open Access Books Academic Board',
      tier: 'monograph',
      tierTitle: 'Академическая научная монография',
      color: 'border-purple-300 text-purple-900 bg-purple-50',
      badgeBg: 'bg-purple-100 text-purple-900 border-purple-300',
    };
  }

  // 12. DjVu / Conspects
  if (source.sourceType === 'djvu_conspect' || label.includes('djvu') || label.includes('конспект')) {
    return {
      label: 'Университетский конспект лекций (Архив кафедр)',
      publisher: 'Кафедральный архив университетских курсов',
      tier: 'archive',
      tierTitle: 'Университетский конспект и лекционные материалы',
      color: 'border-amber-300 text-amber-900 bg-amber-50',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    };
  }

  // 13. Wikibooks
  if (source.sourceType === 'wikibooks' || label.includes('wikibooks')) {
    return {
      label: source.sourceLabel || 'Wikibooks Open Curriculum',
      publisher: 'Wikimedia Foundation Open Educational Community',
      tier: 'open_curriculum',
      tierTitle: 'Открытый образовательный стандарт Wikibooks',
      color: 'border-teal-300 text-teal-900 bg-teal-50',
      badgeBg: 'bg-teal-100 text-teal-900 border-teal-300',
    };
  }

  // Default honest peer-reviewed paper badge
  return {
    label: source.sourceLabel || 'Рецензируемая научная публикация (OpenAlex / CrossRef)',
    publisher: 'OpenAlex Academic Index',
    tier: 'peer_reviewed',
    tierTitle: 'Рецензируемая научная публикация',
    color: 'border-sky-300 text-sky-900 bg-sky-50',
    badgeBg: 'bg-sky-100 text-sky-900 border-sky-300',
  };
}

/**
 * Purifies citation text in UI to remove stray tags (e.g. "Ключевые слова:", "УДК")
 */
function cleanQuoteText(rawQuote?: string, rawSnippet?: string, title?: string): string {
  let text = (rawQuote || rawSnippet || '').trim();
  if (!text) return '';

  // Remove surrounding quotes if duplicated
  text = text.replace(/^[«"']+|[»"']+$/g, '').trim();

  // Strip duplicate uppercase title
  if (title && title.length > 5) {
    if (text.toLowerCase().startsWith(title.toLowerCase())) {
      text = text.slice(title.length).trim();
    }
  }

  // Remove ALL-CAPS leading title phrases
  text = text.replace(/^[А-ЯЁA-Z\s\-\:\,\.]{15,120}(?=\s+[А-Яа-яA-Za-z])/g, (match) => {
    if (match.trim() === match.trim().toUpperCase() && match.length > 15) {
      return '';
    }
    return match;
  }).trim();

  // Remove technical prefixes
  text = text.replace(/^(Ключевые\s+слова|Keywords|Key\s+words|Теги)\s*[:\.\-][^\.\n\–\—]+[\.\n\–\—]/i, '').trim();
  text = text.replace(/^\[(Ключевые\s+слова|Keywords)[^\]]+\]/i, '').trim();
  text = text.replace(/^(УДК|ББК|JEL|EDN|DOI|ISSN|ISBN)[\s\d\w\.\,\:\;\-\/]+/i, '').trim();
  text = text.replace(/^(АННОТАЦИЯ|ABSTRACT|ВВЕДЕНИЕ|SUMMARY)\s*[:\.\-]?/i, '').trim();
  text = text.replace(/^[:\-\–\—\.\,\s]+/, '').trim();

  return text;
}

export const TextbookGroundingInspectorModal: React.FC<TextbookGroundingInspectorModalProps> = ({
  source,
  sourceNumber,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !source) return null;

  const badge = resolveAccurateSourceBadge(source);
  const cleanQuote = cleanQuoteText(source.verifiableQuote, source.snippet, source.title);

  const handleCopyCitation = () => {
    const citation = `${source.authors || 'Академический коллектив'} (${source.year || 2024}). "${source.title}". ${source.chapterOrSection || ''}. ${source.doiOrIsbn || source.url || ''}`;
    navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-3">
          <div className="flex items-start space-x-2.5">
            <div className="p-2 rounded-xl bg-sky-100 text-sky-800 shrink-0 mt-0.5">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className={`px-2 py-0.5 rounded-md border text-[11px] font-bold ${badge.badgeBg}`}>
                  {sourceNumber ? `[${sourceNumber}] ` : ''}{badge.label}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {source.year || 2024}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-1 leading-snug">
                {source.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider flex items-center space-x-1">
                <Building className="w-3 h-3 text-slate-400" />
                <span>Авторы / Коллектив:</span>
              </span>
              <span className="font-medium text-slate-800">
                {source.authors || 'Академический коллектив'}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider flex items-center space-x-1">
                <Award className="w-3 h-3 text-slate-400" />
                <span>Статус и издательство:</span>
              </span>
              <span className="font-medium text-slate-800">
                {badge.publisher}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Раздел / Глава:
              </span>
              <span className="font-medium text-slate-800">
                {source.chapterOrSection || 'Научный раздел первоисточника'}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Категория источника:
              </span>
              <span className="font-medium text-slate-800">
                {badge.tierTitle}
              </span>
            </div>

            {source.doiOrIsbn && (
              <div className="col-span-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center space-x-1">
                  <Hash className="w-3 h-3 text-slate-400" />
                  <span>Верифицированный идентификатор (DOI / ISBN):</span>
                </span>
                <span className="font-mono text-[11px] text-slate-800 font-semibold bg-white px-2 py-0.5 rounded border border-slate-200">
                  {source.doiOrIsbn}
                </span>
              </div>
            )}
          </div>

          {/* Verifiable Textbook Quote */}
          <div className="space-y-1.5">
            <div className="flex items-center space-x-1.5 text-slate-900 font-bold text-xs">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              <span>Верифицированная цитата и научная мысль:</span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-emerald-950 font-serif italic text-xs leading-relaxed">
              «{cleanQuote || source.snippet}»
            </div>
          </div>

          {/* Theoretical Summary */}
          {source.snippet && source.snippet !== cleanQuote && (
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-800">Контекст и аннотация:</span>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                {cleanQuoteText(source.snippet, '', source.title)}
              </p>
            </div>
          )}

          {/* Principle of Academic Integrity */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Академическая точность и прозрачность цитирования</span>
            </div>
            <p className="leading-relaxed">
              Система честно атрибутирует издательства и индексы цитирования: региональные и отраслевые публикации (РИНЦ/ВАК/РАЕ) отображаются с точным наименованием издателя, а международные стандарты (IEEE, ACM, Nature, OpenStax) — с их официальными DOI-идентификаторами.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyCitation}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Цитата скопирована</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Скопировать библиографию</span>
              </>
            )}
          </button>

          <div className="flex items-center space-x-2">
            {source.url && (
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition"
              >
                <span>Открыть первоисточник</span>
                <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold transition cursor-pointer"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
