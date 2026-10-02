import React, { useEffect, useState } from 'react';
import { Award, BadgeCheck, Code2, FileText, ShieldCheck } from 'lucide-react';
import { PublicPortfolio, socialProfileService } from '../../services/socialProfileService.ts';

interface PublicPortfolioPageProps {
  uid: string;
}

export const PublicPortfolioPage: React.FC<PublicPortfolioPageProps> = ({ uid }) => {
  const [portfolio, setPortfolio] = useState<PublicPortfolio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    document.title = 'Публичное портфолио';
    return socialProfileService.subscribePublishedPortfolio(
      uid,
      (publishedPortfolio) => {
        setPortfolio(publishedPortfolio);
        setIsLoading(false);
        setLoadError(false);
      },
      () => {
        setLoadError(true);
        setIsLoading(false);
      }
    );
  }, [uid]);

  return (
    <main className="min-h-screen bg-[#f3f6f4] text-slate-900">
      <header className="border-b border-slate-200 bg-white px-5 py-4 sm:px-10">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <Award className="h-5 w-5 text-emerald-700" />
          <span className="text-sm font-semibold">Learning OS</span>
          <span className="ml-auto flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4" /> Публичная версия
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-10 sm:py-12">
        {isLoading ? (
          <p className="py-20 text-center text-sm text-slate-500">Загружаю портфолио…</p>
        ) : loadError ? (
          <section className="mx-auto max-w-xl border-y border-slate-200 py-12 text-center">
            <h1 className="text-xl font-semibold">Не удалось загрузить портфолио</h1>
            <p className="mt-2 text-sm text-slate-600">Проверьте подключение и попробуйте открыть ссылку ещё раз.</p>
          </section>
        ) : !portfolio ? (
          <section className="mx-auto max-w-xl border-y border-slate-200 py-12 text-center">
            <h1 className="text-xl font-semibold">Портфолио недоступно</h1>
            <p className="mt-2 text-sm text-slate-600">Владелец снял публикацию или ссылка указана неверно.</p>
          </section>
        ) : (
          <>
            <section className="flex flex-col gap-6 border-b border-slate-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-4">
                {portfolio.avatar ? (
                  <img src={portfolio.avatar} alt="" className="h-16 w-16 rounded-full border border-slate-200 object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-xl font-semibold text-emerald-900">
                    {(portfolio.displayName || 'С').slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold uppercase text-emerald-800">Учебное портфолио</p>
                  <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{portfolio.displayName}</h1>
                  <p className="mt-1 text-sm text-slate-600">Проверенные проекты и решения</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <BadgeCheck className="h-4 w-4 text-emerald-700" />
                {portfolio.artifacts.length} {portfolio.artifacts.length === 1 ? 'артефакт' : 'артефактов'}
              </div>
            </section>

            <section className="pt-8" aria-labelledby="portfolio-items-heading">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 id="portfolio-items-heading" className="text-base font-semibold">Проверенные работы</h2>
                <span className="text-xs text-slate-500">Оценка не ниже 70%</span>
              </div>
              <div className="space-y-3">
                {portfolio.artifacts.map((artifact) => (
                  <details key={artifact.id} className="group border border-slate-200 bg-white open:border-slate-300">
                    <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 sm:px-5">
                      <FileText className="h-4 w-4 shrink-0 text-slate-500" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{artifact.unitTitle}</span>
                        <span className="mt-1 block text-xs text-slate-500">{artifact.filename} · {artifact.submittedAt}</span>
                      </span>
                      <span className="font-mono text-sm font-semibold text-emerald-800">{artifact.score}%</span>
                    </summary>
                    <div className="border-t border-slate-200 px-4 py-5 sm:px-5">
                      {artifact.strongPoints.length > 0 && (
                        <div className="mb-4">
                          <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">Сильные стороны</h3>
                          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                            {artifact.strongPoints.map((point, index) => <li key={`${artifact.id}-point-${index}`}>{point}</li>)}
                          </ul>
                        </div>
                      )}
                      {artifact.productionAdvice && (
                        <p className="mb-4 border-l-2 border-emerald-700 pl-3 text-sm leading-relaxed text-slate-700">{artifact.productionAdvice}</p>
                      )}
                      <div className="overflow-hidden border border-slate-800 bg-slate-950">
                        <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2 text-xs text-slate-300">
                          <Code2 className="h-3.5 w-3.5" /> {artifact.filename}
                        </div>
                        <pre className="max-h-[34rem] overflow-auto p-4 text-xs leading-relaxed text-slate-100"><code>{artifact.fileContent || 'Исходный код не приложен.'}</code></pre>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
};
