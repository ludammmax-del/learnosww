import React, { useState } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  Lightbulb, 
  Sparkles, 
  Copy, 
  Check, 
  Search, 
  ArrowDown, 
  Info, 
  ChevronRight,
  Bookmark
} from 'lucide-react';
import { GlossaryTerm } from '../../types.ts';
import { playChime } from '../../utils/audio.ts';

interface TheoryGlossarySectionProps {
  terms: GlossaryTerm[];
  unitTitle: string;
  onTermClick?: (term: GlossaryTerm) => void;
  activeTermId?: string | null;
}

export const TheoryGlossarySection: React.FC<TheoryGlossarySectionProps> = ({
  terms,
  unitTitle,
  onTermClick,
  activeTermId
}) => {
  const [copiedTerm, setCopiedTerm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'key' | 'analogies'>('all');

  if (!terms || terms.length === 0) {
    return null;
  }

  const filteredTerms = terms.filter(t => {
    const matchesSearch = 
      t.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.simpleAnalogy && t.simpleAnalogy.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedCategory === 'analogies') {
      return matchesSearch && Boolean(t.simpleAnalogy);
    }
    return matchesSearch;
  });

  const handleCopy = (term: GlossaryTerm) => {
    const textToCopy = `📖 ${term.term}\nОпределение: ${term.definition}\n${term.simpleAnalogy ? `💡 Аналогия: ${term.simpleAnalogy}\n` : ''}${term.whyItMatters ? `🎯 Зачем нужно: ${term.whyItMatters}` : ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedTerm(term.term);
    playChime('click');
    setTimeout(() => setCopiedTerm(null), 2000);
  };

  return (
    <section 
      id="theory-glossary-section"
      className="mt-8 pt-6 border-t-2 border-slate-200/80 space-y-4 scroll-mt-6 animate-fade-in"
    >
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-sky-50 to-indigo-50 border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-sm text-slate-900">
                📖 Разъяснение сложных терминов и понятий
              </h3>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-200/90 text-amber-950 px-2 py-0.5 rounded-full border border-amber-300">
                {terms.length} {terms.length === 1 ? 'термин' : terms.length < 5 ? 'термина' : 'терминов'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              ИИ выделил специализированные термины из первоисточников и объяснил их простыми словами без заумного жаргона.
            </p>
          </div>
        </div>

        {/* Quick Search */}
        {terms.length > 3 && (
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по терминам..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
            />
          </div>
        )}
      </div>

      {/* Term Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredTerms.map((item, idx) => {
          const isHighlighted = activeTermId === item.term || activeTermId === item.id;
          const termAnchorId = `glossary-term-${encodeURIComponent(item.term.toLowerCase().replace(/\s+/g, '-'))}`;

          return (
            <div
              key={item.id || idx}
              id={termAnchorId}
              className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3 ${
                isHighlighted
                  ? 'bg-amber-50/90 border-amber-400 shadow-md ring-2 ring-amber-300'
                  : 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-2xs'
              }`}
            >
              <div className="space-y-2">
                {/* Term title and copy button */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      📖
                    </span>
                    <h4 className="font-bold text-xs text-slate-900 tracking-tight">
                      {item.term}
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(item)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
                    title="Скопировать объяснение"
                  >
                    {copiedTerm === item.term ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Plain Definition */}
                <div className="text-xs text-slate-700 leading-relaxed">
                  <span className="font-semibold text-slate-900 block mb-0.5">Определение:</span>
                  <p className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60 text-slate-800">
                    {item.definition}
                  </p>
                </div>

                {/* Simple Real-life Analogy */}
                {item.simpleAnalogy && (
                  <div className="text-xs text-amber-950 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/70 space-y-1">
                    <div className="flex items-center space-x-1.5 font-bold text-amber-900 text-[11px]">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Бытовая аналогия (как понять на пальцах):</span>
                    </div>
                    <p className="leading-relaxed opacity-95 text-[11px] text-slate-800">
                      {item.simpleAnalogy}
                    </p>
                  </div>
                )}

                {/* Why It Matters / Real Utility */}
                {item.whyItMatters && (
                  <div className="text-[11px] text-slate-600 flex items-start space-x-1.5 pt-1">
                    <Info className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                    <span><strong>Где применяется:</strong> {item.whyItMatters}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredTerms.length === 0 && (
        <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
          Термины по запросу «{searchQuery}» не найдены.
        </div>
      )}
    </section>
  );
};
