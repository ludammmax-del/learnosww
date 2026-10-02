import React from 'react';
import { Bookmark, ExternalLink, Brain, BookOpen, Sparkles, Compass } from 'lucide-react';

export const QuickLinksWidget: React.FC = () => {
  const links = [
    { title: 'Техника Фейнмана', desc: 'Простое объяснение сложных концепций', icon: <Brain className="w-3 h-3 text-sky-500" />, url: 'https://fs.blog/feynman-technique/' },
    { title: 'Принцип 80/20 & Первые 20 часов', desc: 'Деконструкция и быстрый старт в любом навыке', icon: <Sparkles className="w-3 h-3 text-amber-500" />, url: 'https://jamesclear.com/deliberate-practice-theory' },
    { title: 'Осознанная практика (Peak)', desc: 'Работа на границе возможностей и ментальные модели', icon: <Compass className="w-3 h-3 text-purple-500" />, url: 'https://en.wikipedia.org/wiki/Practice_(learning_method)' },
    { title: 'Интервальное повторение & Память', desc: 'Кривая Эббингауза и активное воспроизведение', icon: <BookOpen className="w-3 h-3 text-emerald-500" />, url: 'https://fs.blog/spaced-repetition/' },
  ];

  return (
    <div className="h-full flex flex-col justify-between p-3.5 text-slate-800 select-none text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
        <div className="flex items-center space-x-1.5 font-semibold text-slate-900 text-xs">
          <Bookmark className="w-3.5 h-3.5 text-sky-500" />
          <span>Библиотека методологий & Ссылки</span>
        </div>
        <span className="text-[10px] text-slate-400">Mastery Hub</span>
      </div>

      {/* Links List */}
      <div className="space-y-1.5 my-1.5 flex-1 overflow-y-auto">
        {links.map((l, i) => (
          <a
            key={i}
            href={l.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 hover:bg-slate-100 border border-slate-100 transition group"
          >
            <div className="flex items-center space-x-2 truncate">
              {l.icon}
              <div className="truncate">
                <div className="font-semibold text-slate-800 group-hover:text-sky-600 transition truncate text-[11px]">
                  {l.title}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {l.desc}
                </div>
              </div>
            </div>
            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-slate-700 shrink-0 ml-1.5" />
          </a>
        ))}
      </div>
    </div>
  );
};

