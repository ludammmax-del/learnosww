import React, { useState } from 'react';
import { 
  Network, 
  BookOpen, 
  Brain, 
  Sparkles, 
  Users, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Clock, 
  Video, 
  Award,
} from 'lucide-react';

interface OsFeatureTourProps {
  onNext: () => void;
  onSkip?: () => void;
}

export const OsFeatureTour: React.FC<OsFeatureTourProps> = ({ onNext, onSkip }) => {
  const [activeSlide, setActiveSlide] = useState<number>(0);

  const slides = [
    {
      id: 'dag_graph',
      category: 'Блок 1 · Архитектура обучения',
      title: 'Динамический DAG-граф знаний',
      subtitle: '200 практических микро-квантов вместо линейных скучных видеокурсов',
      description: 'Ваша траектория обучения формируется как направленный ациклический граф (DAG). Каждая тема — это конкретный прикладной квант на 25–45 минут со строгими зависимостями. Вы всегда видите карту навыка целиком, открывая новые ветки мастерства по мере закрепления базы.',
      highlights: [
        '200 взаимосвязанных квантов в 10 глубоких фазах',
        'Индивидуальные ветки под ваш темп и уровень',
        'Ликвидация пробелов и упреждающая калибровка'
      ],
      icon: Network,
      visual: (
        <div className="w-full h-full bg-[#FAF8F5] rounded-2xl p-5 border border-stone-200/90 flex flex-col justify-between relative overflow-hidden shadow-sm">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#78716c_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none" />
          
          <div className="flex items-center justify-between z-10 border-b border-stone-200/80 pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-stone-900" />
              <span className="text-xs font-mono text-stone-700">DAG Navigator · Phase 01–10</span>
            </div>
            <span className="text-[11px] font-mono text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
              200 квантов
            </span>
          </div>

          {/* Interactive DAG node diagram */}
          <div className="relative py-6 flex items-center justify-center space-x-5 z-10">
            {/* Node 1: Completed */}
            <div className="flex flex-col items-center space-y-1.5">
              <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-300 flex items-center justify-center text-stone-800 shadow-xs">
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-[10px] text-stone-800 font-medium">Квант 1.1</span>
              <span className="text-[9px] text-emerald-700 font-mono">Освоено</span>
            </div>

            <div className="w-7 h-0.5 bg-stone-300" />

            {/* Node 2: Active */}
            <div className="flex flex-col items-center space-y-1.5 relative">
              <div className="w-13 h-13 rounded-xl bg-stone-900 text-stone-50 border-2 border-stone-800 flex items-center justify-center shadow-md">
                <Brain className="w-5 h-5" />
              </div>
              <span className="text-[10px] text-stone-900 font-semibold">Квант 1.2</span>
              <span className="text-[9px] text-stone-600 font-mono">В фокусе</span>
            </div>

            <div className="w-7 h-0.5 bg-stone-200" />

            {/* Node 3: Practice */}
            <div className="flex flex-col items-center space-y-1.5 opacity-60">
              <div className="w-11 h-11 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-500">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-stone-600">Квант 1.3</span>
              <span className="text-[9px] text-stone-400 font-mono">Практика</span>
            </div>

            <div className="w-7 h-0.5 bg-stone-200" />

            {/* Node 4: Capstone */}
            <div className="flex flex-col items-center space-y-1.5 opacity-40">
              <div className="w-11 h-11 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-400">
                <Award className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-stone-500">Проект 1</span>
              <span className="text-[9px] text-stone-400 font-mono">Синтез</span>
            </div>
          </div>

          <div className="z-10 bg-white/90 rounded-xl p-3 border border-stone-200/80 flex items-center justify-between text-xs text-stone-700">
            <span className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-800" />
              <span>Автоматическая топологическая сортировка тем</span>
            </span>
            <span className="font-mono text-stone-900 font-medium">100% без повторов</span>
          </div>
        </div>
      ),
    },
    {
      id: 'focus_studio',
      category: 'Блок 2 · Погружение и ритм',
      title: 'Фокус-Студия & Теория без воды',
      subtitle: 'Интерактивные конспекты, живые диаграммы и помодоро-фокус',
      description: 'Вместо многочасовых лекций с водой — структурированная академическая теория с наглядными схемами, формулами, бытовыми аналогиями и таблицами компромиссов. Встроенный Pomodoro-таймер создает рабочий импульс без выгорания.',
      highlights: [
        'Интерактивные блок-схемы процессов и ментальные карты',
        'Проверка концепций через калибровочные микро-тесты',
        'Фокус-таймер с генеративным звуковым сопровождением'
      ],
      icon: BookOpen,
      visual: (
        <div className="w-full h-full bg-[#FAF8F5] rounded-2xl p-5 border border-stone-200/90 flex flex-col justify-between relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-stone-700" />
              <span className="text-xs font-mono text-stone-800">Focus Session · 25:00</span>
            </div>
            <span className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-200 font-mono">
              Pomodoro Flow
            </span>
          </div>

          <div className="bg-white rounded-xl p-4 border border-stone-200/80 space-y-2.5 font-sans shadow-xs">
            <div className="flex items-center space-x-2 text-[11px] text-stone-800 font-medium">
              <span>§ 1.2 Фундаментальный принцип баланса</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              «Любое сложное явление раскладывается на 3 базовых инварианта: устойчивая структура, регулярный импульс и обратная связь без задержки...»
            </p>
            <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-between text-[11px] text-stone-700 font-mono">
              <span>Инвариант 1</span>
              <span className="text-stone-400">→</span>
              <span>Прикладное действие</span>
              <span className="text-stone-400">→</span>
              <span className="text-stone-900 font-semibold">Артефакт</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
            <span>Читаемость: 100%</span>
            <span className="text-stone-800 font-mono">Нулевая когнитивная перегрузка</span>
          </div>
        </div>
      ),
    },
    {
      id: 'blank_page',
      category: 'Блок 3 · Преодоление ступора',
      title: 'Слепой тест чистого листа & Проекты',
      subtitle: 'Воспроизведение сути с нуля без иллюзии знания',
      description: 'Самая частая проблема обучения — иллюзия понимания («пока читал, всё было ясно, а сам сделать не могу»). Слепой вызов чистого листа просит за 3 минуты воспроизвести ключевой инвариант темы своими словами или схемой, надежно закрепляя навык в памяти.',
      highlights: [
        'Преодоление барьера «чистого листа» и страха ошибки',
        'Проверка понимания своими словами до просмотра подсказок',
        'Практические артефакты в портфолио вместо тестов-угадываний'
      ],
      icon: Brain,
      visual: (
        <div className="w-full h-full bg-[#FAF8F5] rounded-2xl p-5 border border-stone-200/90 flex flex-col justify-between relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-stone-900" />
              <span className="text-xs font-mono text-stone-800">Blank Page Challenge · 03:00</span>
            </div>
            <span className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-200 font-mono">
              Слепой вызов
            </span>
          </div>

          <div className="space-y-2 py-1">
            <div className="text-xs text-stone-700 font-medium">
              Задача: Сформулируйте ключевое правило на практике своими словами
            </div>
            <div className="h-24 bg-white rounded-xl p-3 border border-stone-200 text-xs font-mono text-stone-700 flex flex-col justify-between shadow-xs">
              <span className="leading-relaxed">
                1. Зафиксировать входные ограничения...<br />
                2. Проверить граничные условия...<br />
                3. Получить подтвержденный результат.
              </span>
              <span className="text-[10px] text-emerald-700 font-sans font-medium self-end">
                ✓ Смысловые инварианты подтверждены (98%)
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-2.5 border border-stone-200 text-[11px] text-stone-700 flex items-center justify-between">
            <span>Итог: Готовность к реальному проекту</span>
            <span className="font-semibold text-stone-900">+150 XP</span>
          </div>
        </div>
      ),
    },
    {
      id: 'peer_collab',
      category: 'Блок 4 · Социальное мастерство',
      title: 'Парный P2P-спарринг & Видеозвонки',
      subtitle: 'Смена ролей (спикер / оппонент) и голосовой ИИ-арбитр',
      description: 'Learning OS автоматически находит вам реального напарника с тем же прогрессом и назначает 15-минутный ролевой спарринг со сменой ролей (Презентер и Рецензент), а ИИ-Арбитр оценивает уверенность, аргументы и чистоту речи.',
      highlights: [
        'Мгновенный матч с единомышленником на той же теме',
        'Двухраундовый спарринг: раунд в роли спикера, раунд в роли критика',
        'Синхронный сертификат парной защиты темы'
      ],
      icon: Users,
      visual: (
        <div className="w-full h-full bg-[#FAF8F5] rounded-2xl p-5 border border-stone-200/90 flex flex-col justify-between relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
            <div className="flex items-center space-x-2">
              <Video className="w-4 h-4 text-stone-700" />
              <span className="text-xs font-mono text-stone-800">P2P Live Sparring · Round 1/2</span>
            </div>
            <span className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-200 font-mono">
              Match 98%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 py-1">
            <div className="bg-white rounded-xl p-3 border border-stone-300 flex flex-col justify-between h-28 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-stone-800 font-medium">Вы (Спикер)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              </div>
              <div className="text-center font-mono text-xs text-stone-900 font-semibold">Презентация идеи</div>
              <div className="flex items-center space-x-1 h-1.5">
                <span className="w-1 bg-stone-800 h-full rounded-full animate-pulse" />
                <span className="w-1 bg-stone-800 h-2/3 rounded-full animate-pulse" />
                <span className="w-1 bg-stone-800 h-4/5 rounded-full animate-pulse" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-3 border border-stone-200 flex flex-col justify-between h-28 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-stone-500 font-medium">@alex_partner</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              </div>
              <div className="text-center font-mono text-xs text-stone-600">Оппонент & Аудит</div>
              <span className="text-[9px] text-stone-400 text-right">Слушает и задает вопрос</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-2.5 border border-stone-200 text-[11px] text-stone-700 flex items-center justify-between">
            <span>ИИ-Арбитр: Речь чистая, без слов-паразитов</span>
            <span className="font-mono text-stone-900 font-bold">95 / 100</span>
          </div>
        </div>
      ),
    },
    {
      id: 'clean_memory',
      category: 'Блок 5 · Надежность без галлюцинаций',
      title: 'ИИ-Оператор чистого контекста',
      subtitle: 'Epistemic Ledger, ноль инфоцыганства и фактологическая честность',
      description: 'Learning OS построена на Конституции абсолютной честности. Никаких пустых обещаний и никаких галлюцинаций нейросетей. Все проверенные аксиомы записываются в постоянный реестр Epistemic Ledger, а рабочий контекст очищается от шума после каждого вызова.',
      highlights: [
        'Изоляция памяти (Clean Memory Pipeline) без накопления бреда',
        'Строгая адаптация под выбранную сферу (ноль IT-жаргона в языках/дизайне)',
        'Учет возраста, реального темпа и практической ценности'
      ],
      icon: ShieldCheck,
      visual: (
        <div className="w-full h-full bg-[#FAF8F5] rounded-2xl p-5 border border-stone-200/90 flex flex-col justify-between relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-stone-700" />
              <span className="text-xs font-mono text-stone-800">Epistemic Ledger Integrity</span>
            </div>
            <span className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-200 font-mono">
              0 Hallucinations
            </span>
          </div>

          <div className="space-y-2 py-1">
            <div className="p-3 rounded-xl bg-white border border-stone-200 text-xs font-mono space-y-1 shadow-xs">
              <div className="text-stone-900 font-semibold">[АКСИОМА ЗАФИКСИРОВАНА]</div>
              <div className="text-stone-600">
                «Факты верифицированы по фундаментальным академическим источникам.»
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-stone-200 text-xs font-mono text-stone-600 flex items-center justify-between">
              <span>Транзитный шум: Очищен (Purged)</span>
              <span className="text-stone-900 font-medium">✓ Изолирован</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-2.5 border border-stone-200 text-[11px] text-stone-700 flex items-center justify-between">
            <span>Статус модерации: Анти-инфоцыганский контур</span>
            <span className="font-semibold text-stone-900">Активен</span>
          </div>
        </div>
      ),
    },
  ];

  const current = slides[activeSlide];
  const isLast = activeSlide === slides.length - 1;

  return (
    <div className="flex flex-col h-full justify-between">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-200/80">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-stone-500">
            {current.category}
          </span>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight mt-0.5">
            {current.title}
          </h2>
        </div>

        {/* Minimalist Apple-like pagination dots */}
        <div className="flex items-center space-x-2">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveSlide(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === activeSlide ? 'w-6 bg-stone-900' : 'w-2 bg-stone-300 hover:bg-stone-400'
              }`}
              title={s.title}
            />
          ))}
        </div>
      </div>

      {/* Main Slide Content: 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto py-4 items-center">
        {/* Left: Description & Points */}
        <div className="lg:col-span-6 space-y-3.5">
          <p className="text-sm font-medium text-stone-900">
            {current.subtitle}
          </p>
          <p className="text-xs text-stone-600 leading-relaxed">
            {current.description}
          </p>

          <div className="space-y-2 pt-1">
            {current.highlights.map((pt, i) => (
              <div key={i} className="flex items-start space-x-2 text-xs text-stone-700">
                <div className="w-4 h-4 rounded-full bg-stone-100 border border-stone-300 flex items-center justify-center shrink-0 mt-0.5 text-stone-800">
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span>{pt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Visual Illustration */}
        <div className="lg:col-span-6 h-64 lg:h-72">
          {current.visual}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-stone-200/80">
        <div className="flex items-center space-x-2">
          {activeSlide > 0 && (
            <button
              type="button"
              onClick={() => setActiveSlide((prev) => Math.max(0, prev - 1))}
              className="px-3.5 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs text-stone-700 flex items-center space-x-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Назад</span>
            </button>
          )}
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-800 transition cursor-pointer"
            >
              Пропустить
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            if (isLast) {
              onNext();
            } else {
              setActiveSlide((prev) => prev + 1);
            }
          }}
          className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-[#FAF8F5] font-semibold text-xs flex items-center space-x-2 shadow-sm transition cursor-pointer"
        >
          <span>{isLast ? 'Перейти к профилю' : 'Следующая возможность'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
