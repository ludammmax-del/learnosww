import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Globe, 
  Play, 
  BookOpen, 
  Users, 
  Brain, 
  ShieldCheck, 
  Award, 
  Zap, 
  Layers, 
  FileText, 
  Compass, 
  Star, 
  Check, 
  Clock, 
  Code2, 
  Lock, 
  ChevronRight, 
  BarChart3, 
  Search,
  Command,
  Flame,
  CheckCircle,
  FolderGit2,
  Terminal,
  Cpu,
  GitBranch,
  Volume2,
  Activity,
  Boxes,
  Database,
  Share2,
  ArrowUpRight,
  TrendingUp,
  Sliders,
  Maximize2
} from 'lucide-react';
import { playChime } from '../../utils/audio.ts';
import { FeatureInteractiveShowcase } from './FeatureInteractiveShowcase.tsx';

interface BitrixStyleLandingProps {
  onStartFree: () => void;
  onLogin: () => void;
  onEnterDemoDesktop?: () => void;
}

export const BitrixStyleLanding: React.FC<BitrixStyleLandingProps> = ({
  onStartFree,
  onLogin,
  onEnterDemoDesktop
}) => {
  const [calculatorDomain, setCalculatorDomain] = useState<string>('tech');
  const [calculatorHours, setCalculatorHours] = useState<number>(6);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [liveTestPassed, setLiveTestPassed] = useState(true);
  const [livePeerSpeaking, setLivePeerSpeaking] = useState(true);

  // Simulated live audio wave for sparring card
  useEffect(() => {
    const interval = setInterval(() => {
      setLivePeerSpeaking((prev) => !prev);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const handleCtaClick = () => {
    playChime('success');
    onStartFree();
  };

  const handleLoginClick = () => {
    playChime('click');
    onLogin();
  };

  const sampleSearchQueries = [
    '3D-граф инвариантов',
    'Алгоритм Raft и консенсус',
    'Парный спарринг 1-на-1',
    'B-Tree индексы баз данных',
    'Кривая забывания Эббингауза',
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFD] text-slate-900 font-sans selection:bg-[#1A73E8] selection:text-white relative overflow-x-hidden">
      
      {/* 1. Google Workspace Subtle Ambient Tonal Glows (Clean White/Pastel Canvas) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Soft Google Blue Glow */}
        <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[1100px] h-[520px] bg-gradient-to-b from-[#E8F0FE]/80 via-[#F3E8FD]/30 to-transparent rounded-full blur-[140px] opacity-70" />
        {/* Soft Google Green Glow */}
        <div className="absolute top-[40%] right-[-5%] w-[600px] h-[600px] bg-[#E6F4EA]/60 rounded-full blur-[150px] opacity-60" />
        {/* Soft Google Yellow/Amber Glow */}
        <div className="absolute top-[70%] left-[-5%] w-[550px] h-[550px] bg-[#FEF7E0]/50 rounded-full blur-[140px] opacity-50" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.35]" />
      </div>

      {/* 2. GOOGLE WORKSPACE STYLE FLOATING NAVBAR */}
      <div className="sticky top-3.5 z-50 px-4 sm:px-6 max-w-6xl mx-auto">
        <header className="rounded-full bg-white/90 backdrop-blur-2xl border border-slate-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] px-4 sm:px-6 h-15 flex items-center justify-between transition-all">
          
          {/* Brand Logo with Google 4-Color Quad Emblem */}
          <div className="flex items-center space-x-5">
            <button 
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center space-x-2.5 text-left cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform relative overflow-hidden">
                <span className="relative z-10">OS</span>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#1A73E8] rounded-full blur-[1px]" />
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-[#34A853] rounded-full blur-[1px]" />
                <div className="absolute top-0 right-0 w-2 h-2 bg-[#EA4335] rounded-full blur-[1px]" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold tracking-tight text-slate-900">
                  Learning<span className="text-[#1A73E8]">OS</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#1A73E8] border border-blue-200/80 text-[10px] font-semibold tracking-wide flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1A73E8] animate-pulse" />
                  <span>Workspace</span>
                </span>
              </div>
            </button>

            {/* Google Omnibar Search */}
            <div className="relative hidden md:block">
              <div 
                className={`flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full bg-[#F0F4F9] hover:bg-[#E9EEF6] text-slate-600 text-xs cursor-pointer border transition-all w-72 lg:w-80 ${
                  searchFocused ? 'ring-2 ring-blue-500/30 border-[#1A73E8] bg-white' : 'border-slate-200/80'
                }`}
                onClick={() => setSearchFocused(true)}
              >
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input 
                  type="text"
                  placeholder="Поиск по 200 темам программы..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 250)}
                  className="bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 text-xs w-full font-normal"
                />
                <kbd className="font-mono text-[10px] bg-white text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
                  ⌘K
                </kbd>
              </div>

              {/* Omnibar Dropdown Suggestion Layer */}
              {searchFocused && (
                <div className="absolute top-11 left-0 w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                    Популярные темы
                  </div>
                  {sampleSearchQueries.map((q, idx) => (
                    <div 
                      key={idx}
                      onClick={() => {
                        setSearchQuery(q);
                        setSearchFocused(false);
                        handleCtaClick();
                      }}
                      className="px-2.5 py-1.5 rounded-xl hover:bg-slate-100 text-xs text-slate-700 flex items-center justify-between cursor-pointer transition"
                    >
                      <span className="flex items-center space-x-2">
                        <Sparkles className="w-3 h-3 text-[#1A73E8]" />
                        <span>{q}</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Перейти →</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Center Links in Google Workspace style */}
          <nav className="hidden lg:flex items-center space-x-6 text-xs font-medium text-slate-600">
            <a href="#features" className="hover:text-[#1A73E8] transition">Возможности</a>
            <a href="#bento" className="hover:text-[#1A73E8] transition">Архитектура</a>
            <a href="#philosophy" className="hover:text-[#1A73E8] transition">Принципы</a>
            <a href="#calculator" className="hover:text-[#1A73E8] transition">Калькулятор</a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={handleLoginClick}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              Войти
            </button>

            <button
              type="button"
              onClick={handleCtaClick}
              className="px-4.5 py-1.5 rounded-full bg-[#1A73E8] hover:bg-[#1557B0] text-white font-medium text-xs shadow-xs hover:shadow transition active:scale-[0.98] cursor-pointer flex items-center space-x-1.5"
            >
              <span>Запустить среду</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </header>
      </div>

      {/* 3. HERO SECTION (Google Workspace Clean Single Canvas) */}
      <section className="relative pt-12 pb-14 md:pt-20 md:pb-20 overflow-hidden z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-7">
          
          {/* Надзаголовок (Пилюля-бейджик) */}
          <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-white/95 border border-slate-200/90 text-slate-800 text-xs font-medium shadow-2xs backdrop-blur-md">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1A73E8] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1A73E8]"></span>
            </span>
            <span className="font-semibold text-slate-900">Learning OS</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600">Интеллектуальная среда обучения</span>
          </div>

          {/* Главный заголовок (H1) */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-medium text-slate-900 tracking-tight leading-[1.14] max-w-3xl mx-auto">
              Единая система для освоения сложных навыков.
            </h1>
          </div>

          {/* Подзаголовок */}
          <p className="text-base sm:text-lg text-[#5F6368] font-normal max-w-2xl mx-auto leading-relaxed">
            Интерактивный 3D-граф знаний, практические задания в изолированной песочнице и совместный фокус с напарником. Всё необходимое для глубокой учебы — в одной операционной среде.
          </p>

          {/* Кнопки действий (CTA) in Google Workspace standard */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={handleCtaClick}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#1A73E8] hover:bg-[#1557B0] text-white font-medium text-sm shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center space-x-2 group"
            >
              <span>Запустить среду</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              type="button"
              onClick={onEnterDemoDesktop || handleCtaClick}
              className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium text-sm transition cursor-pointer flex items-center justify-center space-x-1.5 border border-slate-300 shadow-2xs"
            >
              <span>Интерактивное демо</span>
              <span className="text-slate-400">→</span>
            </button>
          </div>

          {/* Чипсы-факты внизу (Material You Filter Chips with Google Color Accents) */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2.5 max-w-3xl mx-auto">
            <div className="h-9 px-4 rounded-full bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition text-xs font-medium text-slate-700 flex items-center space-x-2 shadow-2xs">
              <Globe className="w-3.5 h-3.5 text-[#1A73E8]" />
              <span>3D-граф программы</span>
            </div>

            <div className="h-9 px-4 rounded-full bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 transition text-xs font-medium text-slate-700 flex items-center space-x-2 shadow-2xs">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>200 квантов практики</span>
            </div>

            <div className="h-9 px-4 rounded-full bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition text-xs font-medium text-slate-700 flex items-center space-x-2 shadow-2xs">
              <Users className="w-3.5 h-3.5 text-[#34A853]" />
              <span>Парный фокус</span>
            </div>

            <div className="h-9 px-4 rounded-full bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50/40 transition text-xs font-medium text-slate-700 flex items-center space-x-2 shadow-2xs">
              <Award className="w-3.5 h-3.5 text-[#FBBC04]" />
              <span>Портфолио артефактов</span>
            </div>
          </div>

          {/* Subtle Live Metrics Tonal Strip */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-[11px] text-slate-500">
            <span className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34A853]" />
              <span>98% средний балл удержания</span>
            </span>
            <span className="text-slate-300">•</span>
            <span>0% лишней «воды»</span>
            <span className="text-slate-300">•</span>
            <span>&lt;15 мс отклик P2P сети</span>
            <span className="text-slate-300">•</span>
            <span>0% выдумок ИИ</span>
          </div>

        </div>
      </section>

      {/* 4. GOOGLE WORKSPACE INTERACTIVE PRODUCT SHOWCASE CANVAS */}
      <FeatureInteractiveShowcase onCtaClick={handleCtaClick} />

      {/* 5. GOOGLE MATERIAL 3 BENTO GRID: INTEGRATED CAPABILITIES */}
      <section id="bento" className="py-20 md:py-24 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 shadow-2xs">
              <Boxes className="w-3.5 h-3.5 text-[#1A73E8]" />
              <span>АРХИТЕКТУРА И ФИШКИ СРЕДЫ</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-medium text-slate-900 tracking-tight">
              Все инструменты для глубокого фокуса
            </h2>
            <p className="text-sm text-[#5F6368] leading-relaxed">
              Инструменты, созданные для непрерывной концентрации и кристального понимания фундаментальных правил.
            </p>
          </div>

          {/* Rich Google Material 3 Bento Grid Container */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* SPECIAL CARD: How We Eliminated AI Hallucinations (Minimalist Google Surface Style) */}
            <div className="md:col-span-3 p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1A73E8] border border-blue-200/80 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    <ShieldCheck className="w-4.5 h-4.5 text-[#1A73E8]" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                        0% выдумок: как мы убрали галлюцинации ИИ
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-semibold flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Grounded AI</span>
                      </span>
                    </div>
                    <p className="text-xs text-[#5F6368] mt-0.5">
                      Простыми словами о том, почему ИИ-наставник отвечает строго по делу и не выдумывает несуществующие правила
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-600 text-[11px] font-medium border border-slate-200">
                    Академическая строгость
                  </span>
                </div>
              </div>

              {/* 3 Clean Minimalist Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-1.5 hover:bg-slate-50 hover:border-slate-300 transition">
                  <div className="flex items-center space-x-2 text-slate-900 font-semibold text-xs">
                    <BookOpen className="w-3.5 h-3.5 text-[#1A73E8]" />
                    <span>1. Жесткий барьер книг</span>
                  </div>
                  <p className="text-[#5F6368] leading-relaxed text-[11px]">
                    Обычные чат-боты берут ответы из случайных постов в сети. Наш ИИ отвечает <strong className="text-slate-800 font-medium">только по проверенным учебникам и стандартам</strong> курса.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-1.5 hover:bg-slate-50 hover:border-slate-300 transition">
                  <div className="flex items-center space-x-2 text-slate-900 font-semibold text-xs">
                    <Terminal className="w-3.5 h-3.5 text-purple-600" />
                    <span>2. Проверка тестами в песочнице</span>
                  </div>
                  <p className="text-[#5F6368] leading-relaxed text-[11px]">
                    ИИ не судит «на глаз». Перед вердиктом он <strong className="text-slate-800 font-medium">прогоняет код через юнит-тесты</strong> в изолированной песочнице и сверяет инварианты.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-1.5 hover:bg-slate-50 hover:border-slate-300 transition">
                  <div className="flex items-center space-x-2 text-slate-900 font-semibold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#34A853]" />
                    <span>3. Честное незнание вместо сказок</span>
                  </div>
                  <p className="text-[#5F6368] leading-relaxed text-[11px]">
                    Если ответа нет в базе курса, ИИ <strong className="text-slate-800 font-medium">прямо говорит об этом</strong> и дает ссылку на главу книги, а не придумывает ответ на ходу.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 1: 2/3 Width - Live Isolated Interactive Sandbox with Tests */}
            <div className="md:col-span-2 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-6 relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#1A73E8] border border-blue-200/80 text-[11px] font-semibold">
                    Изолированная песочница
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900 pt-2">
                    Встроенная IDE с мгновенной верификацией тестов
                  </h3>
                  <p className="text-xs text-[#5F6368] max-w-md">
                    Пишите код, нажимайте «Проверить» и получайте мгновенный аудит синтаксиса и инвариантов за доли секунды.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1A73E8] border border-blue-200/80 flex items-center justify-center shrink-0">
                  <Terminal className="w-5 h-5" />
                </div>
              </div>

              {/* Interactive Code Preview Window Inside Bento Card */}
              <div className="rounded-2xl bg-[#090D16] border border-slate-800 p-4 font-mono text-xs text-slate-200 space-y-3 shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[11px] text-slate-400">
                  <span className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-[#34A853]" />
                    <span>solution_invariant.ts</span>
                  </span>
                  <span className="text-[#34A853] font-semibold text-[10px]">100% Tests Passing</span>
                </div>
                <div className="text-[12px] leading-relaxed text-slate-300">
                  <span className="text-purple-400">export async function</span> <span className="text-blue-400">verifyIdempotency</span>(event: TransactionEvent) &#123;<br />
                  &nbsp;&nbsp;<span className="text-slate-500">// 1. Atomic compare-and-swap check</span><br />
                  &nbsp;&nbsp;<span className="text-purple-400">const</span> state = <span className="text-purple-400">await</span> memoryStore.acquireLock(event.key);<br />
                  &nbsp;&nbsp;<span className="text-emerald-400">return</span> state.isApplied ? <span className="text-amber-300">&#123; status: 'cached' &#125;</span> : <span className="text-blue-300">apply(event)</span>;<br />
                  &#125;
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Сложность: O(1) Memory · O(1) Time</span>
                  <button
                    type="button"
                    onClick={() => {
                      setLiveTestPassed(!liveTestPassed);
                      playChime('success');
                    }}
                    className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] transition cursor-pointer flex items-center space-x-1"
                  >
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <span>Запустить тесты (5/5)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: 1/3 Width - Realtime P2P Sparring Live Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-6 relative overflow-hidden">
              <div className="space-y-1">
                <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200/80 text-[11px] font-semibold">
                  Парный спарринг
                </span>
                <h3 className="text-lg font-semibold text-slate-900 pt-2">
                  1-на-1 с реальным напарником
                </h3>
                <p className="text-xs text-[#5F6368]">
                  Ролевая защита решений: один студент спикер, второй — аудитор.
                </p>
              </div>

              {/* Live Audio & Role Switcher Mockup */}
              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200/60 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      ДА
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">Дмитрий А.</div>
                      <div className="text-[10px] text-purple-700 font-medium truncate">Роль: Аудитор тезисов</div>
                    </div>
                  </div>
                  <span className="flex h-2.5 w-2.5 relative shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34A853] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#34A853]"></span>
                  </span>
                </div>

                {/* Animated Voice Waveform */}
                <div className="h-8 px-3 rounded-xl bg-purple-100/60 border border-purple-200/50 flex items-center justify-center space-x-1 overflow-hidden">
                  {[28, 65, 85, 30, 80, 95, 45, 60, 90, 50, 75, 35].map((h, i) => {
                    const scaledHeight = livePeerSpeaking ? Math.round((h / 100) * 20 + 3) : 3;
                    return (
                      <div 
                        key={i} 
                        className="w-1 bg-purple-600 rounded-full transition-all duration-300"
                        style={{ 
                          height: `${scaledHeight}px`,
                          opacity: livePeerSpeaking ? 0.85 : 0.3
                        }}
                      />
                    );
                  })}
                </div>

                <div className="text-[10px] text-slate-500 text-center font-mono">
                  Канал: WebRTC P2P Direct Stream
                </div>
              </div>
            </div>

            {/* Card 3: 1/3 Width - Spaced Repetition Heatmap */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-6">
              <div className="space-y-1">
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-semibold">
                  Интервальные повторения
                </span>
                <h3 className="text-lg font-semibold text-slate-900 pt-2">
                  Кривая памяти SuperMemo
                </h3>
                <p className="text-xs text-[#5F6368]">
                  Система сама напомнит освежить инвариант за день до того, как он сотрется из памяти.
                </p>
              </div>

              {/* Heatmap Matrix Mini-Grid */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Индекс удержания</span>
                  <span className="font-bold text-[#34A853] font-mono">98.4%</span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: 28 }).map((_, idx) => (
                    <div 
                      key={idx}
                      className={`h-4 rounded-sm transition-colors ${
                        idx > 24 ? 'bg-emerald-500 animate-pulse' :
                        idx % 3 === 0 ? 'bg-emerald-400' :
                        idx % 2 === 0 ? 'bg-emerald-300' : 'bg-emerald-200/80'
                      }`}
                      title={`День ${idx + 1}: 100% повторено`}
                    />
                  ))}
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between font-mono">
                  <span>4 недели назад</span>
                  <span>Сегодня</span>
                </div>
              </div>
            </div>

            {/* Card 4: 2/3 Width - Verified Artifacts & Cryptographic Proof */}
            <div className="md:col-span-2 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-6 relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-[11px] font-semibold">
                    Портфолио артефактов
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900 pt-2">
                    Боевые артефакты вместо пустых бумажных дипломов
                  </h3>
                  <p className="text-xs text-[#5F6368] max-w-lg">
                    Каждый сданный квант программы формирует осязаемый артефакт: проверенный код, архитектурную схему, видеозапись защиты и SHA-256 хэш.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shrink-0">
                  <FolderGit2 className="w-5 h-5" />
                </div>
              </div>

              {/* Artifacts Shelf Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 hover:border-slate-300 transition">
                  <div className="text-[11px] font-bold text-slate-900 flex items-center justify-between">
                    <span>Распределенный консенсус</span>
                    <span className="w-2 h-2 rounded-full bg-[#34A853]" />
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">SHA: e8f2a9...3b1c</div>
                  <div className="text-[10px] text-emerald-700 font-semibold">✓ Аудит пройден</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 hover:border-slate-300 transition">
                  <div className="text-[11px] font-bold text-slate-900 flex items-center justify-between">
                    <span>Zero-Copy I/O Драйвер</span>
                    <span className="w-2 h-2 rounded-full bg-[#34A853]" />
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">SHA: 71bc04...99ad</div>
                  <div className="text-[10px] text-emerald-700 font-semibold">✓ Аудит пройден</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 hover:border-slate-300 transition">
                  <div className="text-[11px] font-bold text-slate-900 flex items-center justify-between">
                    <span>Lock-Free Очередь</span>
                    <span className="w-2 h-2 rounded-full bg-[#34A853]" />
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">SHA: 44f912...cc01</div>
                  <div className="text-[10px] text-emerald-700 font-semibold">✓ Аудит пройден</div>
                </div>
              </div>
            </div>

            {/* Card 5: 1/3 Width - Dynamic DAG Auto-Patching (Targeted Gap Closure) */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-6">
              <div className="space-y-1">
                <span className="px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80 text-[11px] font-semibold">
                  Адаптивный DAG-граф
                </span>
                <h3 className="text-lg font-semibold text-slate-900 pt-2">
                  Авто-заплатки пробелов
                </h3>
                <p className="text-xs text-[#5F6368]">
                  Если на спарринге выявлен дефицит понимания — система сама встроит точечный микро-квант в ваш граф.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200/80 space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-sky-900 font-bold text-[11px]">
                  <GitBranch className="w-4 h-4 text-sky-600" />
                  <span>Targeted Gap Closure Node</span>
                </div>
                <div className="text-[11px] text-slate-600">
                  Инъекция узла «Изоляция каскадных сбоев» при неполном ответе. Граф подстраивается под вас.
                </div>
                <div className="text-[10px] text-sky-700 font-mono font-semibold">
                  +50 Karma · 100% ликвидация пробела
                </div>
              </div>
            </div>

            {/* Card 6: 2/3 Width - 200 Short 30-Minute Quants & Zero Water */}
            <div className="md:col-span-2 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 text-[11px] font-semibold">
                    Методология микро-квантов
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900 pt-2">
                    200 коротких шагов по 30 минут без многочасовых нудных лекций
                  </h3>
                  <p className="text-xs text-[#5F6368] max-w-lg">
                    Каждый шаг решает одну конкретную проблему: 10 минут выверенной теории, 15 минут практики в песочнице и 5 минут на закрепление инварианта.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/80 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              {/* 3 Step Quantum Timeline Pill */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="font-bold text-slate-900 text-xs">01. Суть (10 мин)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Только формулировка инварианта из первоисточника</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="font-bold text-slate-900 text-xs">02. Код (15 мин)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Решение задачи в изолированной среде с авто-тестами</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="font-bold text-slate-900 text-xs">03. Защита (5 мин)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Разбор с напарником или ИИ-аудит без воды</div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 6. GOOGLE WORKSPACE CORE PRINCIPLES */}
      <section id="philosophy" className="py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          
          <div className="text-center space-y-2 max-w-lg mx-auto">
            <div className="text-xs font-semibold text-[#1A73E8] uppercase tracking-wider">Принципы системы</div>
            <h2 className="text-2xl sm:text-3xl font-medium text-slate-900 tracking-tight">
              Фундамент без компромиссов
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            
            <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition space-y-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1A73E8] border border-blue-200/80 flex items-center justify-center font-bold text-xs">
                01
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Надежные первоисточники
              </h3>
              <p className="text-xs text-[#5F6368] leading-relaxed">
                Никаких догадок и поверхностных пересказов. Вся теория опирается на признанные академические учебники и стандарты индустрии.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition space-y-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/80 flex items-center justify-center font-bold text-xs">
                02
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                ИИ-наставник без «воды»
              </h3>
              <p className="text-xs text-[#5F6368] leading-relaxed">
                Искусственный интеллект обучен на программе курса, не выдумывает несуществующие факты и помогает закрыть точечные пробелы.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition space-y-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center font-bold text-xs">
                03
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Практика с напарником
              </h3>
              <p className="text-xs text-[#5F6368] leading-relaxed">
                Объясняйте решения реальному человеку, тренируйтесь отвечать на вопросы и получайте объективную оценку без стресса.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 7. TRAJECTORY CALCULATOR (Google Workspace Surface Container) */}
      <section id="calculator" className="py-20 relative z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
          
          <div className="text-center space-y-2">
            <div className="text-xs font-semibold text-[#1A73E8] uppercase tracking-wider">Калькулятор времени</div>
            <h2 className="text-2xl sm:text-3xl font-medium text-slate-900 tracking-tight">
              Рассчитайте срок вашего обучения
            </h2>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-6">
            
            {/* Domain buttons */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-700">Направление:</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'tech', label: 'Программирование & IT' },
                  { id: 'languages', label: 'Иностранные языки' },
                  { id: 'accounting', label: 'Бухучет & Финансы' },
                  { id: 'design', label: 'Дизайн & Интерфейсы' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setCalculatorDomain(item.id);
                      playChime('click');
                    }}
                    className={`p-2.5 rounded-2xl border font-medium transition cursor-pointer text-center ${
                      calculatorDomain === item.id
                        ? 'bg-[#1A73E8] text-white border-[#1A73E8] shadow-2xs'
                        : 'bg-slate-50/80 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-700 font-medium">
                <span>Сколько часов в неделю готовы уделять:</span>
                <span className="font-mono text-slate-900 font-bold">{calculatorHours} ч/нед</span>
              </div>
              <input 
                type="range" 
                min="2" 
                max="20" 
                value={calculatorHours}
                onChange={(e) => setCalculatorHours(Number(e.target.value))}
                className="w-full accent-[#1A73E8] cursor-pointer"
              />
            </div>

            {/* Result box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <div className="text-slate-500 text-[11px] font-medium uppercase">Итоговый срок обучения</div>
                <div className="text-lg font-semibold text-slate-900 mt-0.5">
                  {Math.max(4, Math.round(90 / Math.max(1, calculatorHours)))} недель · 200 практических шагов
                </div>
              </div>
              <button
                type="button"
                onClick={handleCtaClick}
                className="px-5 py-2.5 rounded-full bg-[#1A73E8] hover:bg-[#1557B0] text-white font-medium transition cursor-pointer shadow-xs"
              >
                Составить план бесплатно
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* 8. GOOGLE WORKSPACE BOTTOM CTA */}
      <section className="py-20 relative z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#1E1B4B] text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl shadow-slate-950/10">
            
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-4xl font-medium tracking-tight">
                Готовы учиться с пониманием каждого шага?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                Пройдите короткий опрос за 2 минуты и получите персональную программу из 200 практических уроков.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCtaClick}
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white text-slate-900 hover:bg-slate-100 font-medium text-xs shadow-sm transition active:scale-[0.98] cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Запустить среду</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleLoginClick}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition cursor-pointer"
              >
                Войти в систему
              </button>
            </div>

            <div className="pt-2 text-[11px] text-slate-400">
              Бесплатно • Без привязки карты • 200 уроков
            </div>

          </div>
        </div>
      </section>

      {/* 9. GOOGLE WORKSPACE FOOTER */}
      <footer className="relative z-10 bg-white/80 backdrop-blur-md text-slate-500 py-6 border-t border-slate-200/90 text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center space-x-2">
            <span className="font-semibold text-slate-900">LearningOS</span>
            <span>·</span>
            <span>Интеллектуальная среда обучения в стиле Google Workspace</span>
            <span>·</span>
            <span className="text-slate-600">
              Бета-тест. Нашли баги? Напишите в Telegram:{' '}
              <a 
                href="https://t.me/pinkinauceo" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-medium text-[#1A73E8] hover:underline"
              >
                @pinkinauceo
              </a>
            </span>
          </div>

          <button 
            type="button" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
            className="hover:text-slate-900 transition cursor-pointer font-medium"
          >
            Наверх ↑
          </button>
        </div>
      </footer>

    </div>
  );
};



