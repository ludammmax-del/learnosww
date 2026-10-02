import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Layers,
  Database,
  Lock,
  UserCheck
} from 'lucide-react';
import { loginAsGuest, loginWithGoogle, User } from '../../firebase.ts';

interface GoogleAuthModalProps {
  onSuccess: (user: User | { uid: string; displayName: string; email: string; photoURL?: string }) => void;
  onContinueAsGuest: () => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  onSuccess,
  onContinueAsGuest,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const user = await loginWithGoogle();
      if (user) {
        onSuccess(user);
      }
    } catch (err: any) {
      console.warn('Google sign in interrupted, offering guest mode fallback:', err);
      setErrorMsg('Окно входа было закрыто или заблокировано браузером. Вы можете войти в один клик через Демо-режим.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const user = await loginAsGuest();
      onSuccess({
        uid: user.uid,
        displayName: 'Студент',
        email: user.email || 'student@learning-os.internal',
        photoURL: user.photoURL || undefined,
      });
    } catch (err) {
      console.warn('Anonymous demo login failed:', err);
      setErrorMsg('Не удалось создать гостевую учётную запись Firebase. Проверьте, включён ли анонимный вход.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-white/95 rounded-3xl border border-slate-200/90 shadow-2xl p-7 text-slate-800 space-y-6">
        {/* Top OS Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-sm">
              OS
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 tracking-tight">
                Learning OS
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                Персональная инженерная платформа
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80 flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Шаг 1 из 2: Регистрация</span>
          </span>
        </div>

        {/* Hero Title */}
        <div className="space-y-1.5 text-left">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
            Регистрация в Learning OS
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Сразу после регистрации откроется <strong>входная анкета</strong> и <strong>построение персонального плана обучения</strong> на базе ИИ.
          </p>
        </div>

        {/* Key Features Pill Group */}
        <div className="space-y-2 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 text-xs text-slate-700">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Первый шаг: анкета целей, стека и входная диагностика</span>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Автоматическое построение личной траектории обучения (DAG)</span>
          </div>
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-sky-600 shrink-0" />
            <span>План опирается на проверенные практические модули библиотеки</span>
          </div>
        </div>

        {/* Error notice if popup was closed */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-relaxed">
            {errorMsg}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {/* Main Google Sign In Button */}
          <button
            id="btn-google-signin"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-semibold text-xs border border-slate-300 shadow-sm hover:shadow transition-all flex items-center justify-center space-x-3 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
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
            <span>Войти / Зарегистрироваться через Google</span>
          </button>

          {/* Quick Demo Access */}
          <button
            id="btn-demo-signin"
            onClick={handleDemoLogin}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-900 hover:bg-black text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Быстрый старт (Демо-регистрация в 1 клик)</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 text-slate-300" />
          </button>
        </div>

        {/* Footer disclaimer */}
        <div className="pt-2 text-center text-[11px] text-slate-400 flex items-center justify-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Безопасное соединение через Google Cloud & Firebase</span>
        </div>
      </div>
    </div>
  );
};
