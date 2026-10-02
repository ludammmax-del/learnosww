import React, { useState } from 'react';
import { UserCheck, ShieldCheck, ArrowRight } from 'lucide-react';
import { loginWithGoogle, User } from '../../firebase.ts';
import { playChime } from '../../utils/audio.ts';

interface OsWelcomeLoginProps {
  onSuccess: (user: User | { uid: string; displayName: string; email: string; photoURL?: string }) => void;
  onContinueAsGuest: () => void;
}

export const OsWelcomeLogin: React.FC<OsWelcomeLoginProps> = ({
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [customName, setCustomName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    playChime('click');
    try {
      const user = await loginWithGoogle();
      if (user) {
        playChime('success');
        onSuccess(user);
      }
    } catch (err: any) {
      console.warn('Google sign-in interrupted in iframe:', err);
      setErrorMsg('Окно входа заблокировано браузером. Введите имя ниже для мгновенного входа в 1 клик.');
    } finally {
      setLoading(false);
    }
  };

  const handleNamedSignIn = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = customName.trim() || 'Студент';
    playChime('success');
    onSuccess({
      uid: 'user-' + Date.now().toString(36),
      displayName: clean,
      email: `${clean.toLowerCase()}@learning-os.internal`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#FAF8F5] text-stone-900 select-none overflow-hidden transition-all duration-700 font-sans">
      {/* Subtle ambient warm light in background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] bg-gradient-to-tr from-amber-100/40 via-stone-100/40 to-sky-100/30 rounded-full blur-3xl opacity-70" />
      </div>

      {/* Top minimal OS bar */}
      <div className="w-full px-8 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-xl bg-stone-900 text-white flex items-center justify-center font-black text-xs shadow-xs">
            OS
          </div>
          <span className="text-xs font-semibold tracking-tight text-stone-900">
            Learning OS
          </span>
        </div>

        <div className="text-[11px] font-mono text-stone-400">
          v4.2 · Minimal Boot
        </div>
      </div>

      {/* Center: Iconic Minimalist "Привет" */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10 max-w-xl">
        <h1
          className="text-6xl sm:text-7xl md:text-8xl font-light tracking-tight text-stone-900 transition-all duration-700 transform animate-fade-in"
          style={{
            letterSpacing: '-0.03em',
          }}
        >
          Привет
        </h1>

        <p className="mt-5 text-xs sm:text-sm text-stone-600 font-normal tracking-wide max-w-sm leading-relaxed">
          Персональная операционная система для глубокого освоения любых навыков, дисциплин и совместной практики.
        </p>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 max-w-md text-left leading-relaxed animate-fade-in">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Bottom Minimal Action Dock */}
      <div className="w-full max-w-md px-6 pb-12 flex flex-col items-center space-y-3.5 relative z-10">
        {/* Google Sign-in Button */}
        <button
          id="btn-os-google-login"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-stone-50 active:scale-[0.99] text-stone-900 font-medium text-xs sm:text-sm border border-stone-200/90 shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center space-x-3 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span className="font-semibold">Войти через Google</span>
        </button>

        {/* Name Input for seamless instant entry without popup restriction */}
        <form onSubmit={handleNamedSignIn} className="w-full flex items-center space-x-2">
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="или введите имя (например: Егор)"
            className="flex-1 py-2.5 px-3.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 text-xs text-stone-900 placeholder:text-stone-400 transition"
          />
          <button
            type="submit"
            className="py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-[#FAF8F5] text-xs font-semibold shadow-xs transition flex items-center space-x-1 cursor-pointer shrink-0"
          >
            <span>Войти</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </form>

        {/* Fast 1-click fallback */}
        <button
          id="btn-os-demo-login"
          type="button"
          onClick={() => handleNamedSignIn()}
          className="text-xs text-slate-400 hover:text-slate-800 transition flex items-center space-x-1.5 py-1 px-3 rounded-lg hover:bg-slate-50 cursor-pointer"
        >
          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Быстрый вход без пароля (Демо)</span>
        </button>

        <div className="pt-1 text-[10px] text-slate-400 flex items-center space-x-1.5">
          <ShieldCheck className="w-3 h-3 text-slate-400" />
          <span>Защищенная аутентификация Learning OS</span>
        </div>
      </div>
    </div>
  );
};
