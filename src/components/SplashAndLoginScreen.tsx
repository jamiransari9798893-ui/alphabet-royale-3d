import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Crown,
  Loader2,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { THIRTY_DECK_SKINS } from '../game/data';
import { sound } from '../utils/sound';
import { Card3D } from './Card3D';
import {
  auth,
  googleProvider,
  signInAnonymously,
  signInWithPopup,
  type User,
} from '../firebase';

export type AuthProviderType = 'google' | 'guest';

interface SplashLoadingScreenProps {
  onFinishedLoading: () => void;
}

export const SplashLoadingScreen: React.FC<SplashLoadingScreenProps> = ({
  onFinishedLoading,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const onFinishedRef = useRef(onFinishedLoading);
  onFinishedRef.current = onFinishedLoading;
  const completedRef = useRef<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const finishLoading = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setProgress(100);
    // Immediately unmount loading screen and transition to Login Screen
    onFinishedRef.current();
  };

  useEffect(() => {
    const startTime = Date.now();
    const durationMs = 2000; // Smoothly hits 100% in 2 seconds

    const tick = () => {
      if (completedRef.current) return;
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.max(0, Math.floor((elapsed / durationMs) * 100)));
      setProgress(pct);

      if (pct >= 100 || elapsed >= durationMs) {
        finishLoading();
      }
    };

    // Run tick immediately on mount
    tick();

    const timer = setInterval(tick, 20);
    timerRef.current = timer;

    // Bulletproof fallback to guarantee completion
    const fallbackTimeout = setTimeout(() => {
      finishLoading();
    }, 2050);

    return () => {
      clearInterval(timer);
      clearTimeout(fallbackTimeout);
    };
  }, []);

  const dealingCards = [
    { letter: 'A', code: 'ALPHA', threshold: 10, tilt: '-rotate-12', skin: THIRTY_DECK_SKINS[0] },
    { letter: 'K', code: 'KILO', threshold: 28, tilt: '-rotate-6', skin: THIRTY_DECK_SKINS[1] },
    { letter: 'Q', code: 'QUEBEC', threshold: 46, tilt: 'rotate-0', skin: THIRTY_DECK_SKINS[2] },
    { letter: 'J', code: 'JULIET', threshold: 66, tilt: 'rotate-6', skin: THIRTY_DECK_SKINS[3] },
    { letter: 'Z', code: 'OMEGA', threshold: 84, tilt: 'rotate-12', skin: THIRTY_DECK_SKINS[5] },
  ];

  return (
    <div
      aria-label="Splash Loading Screen"
      className="flex flex-col items-center justify-between w-full h-full px-5 py-6 select-none overflow-hidden relative"
    >
      {/* Top VIP Crest */}
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian-panel border border-amber-500/40">
        <Sparkles className="w-3.5 h-3.5 text-[#f5b041]" />
        <span className="text-[10px] font-display font-extrabold tracking-widest text-[#fde68a] uppercase">
          Royal Casino 3D Edition
        </span>
      </div>

      {/* Center Royal Crown Logo & Emblem */}
      <div className="flex flex-col items-center text-center my-auto">
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center relative shadow-2xl mb-4"
          style={{
            background:
              'radial-gradient(circle at 30% 25%, #ffe082 0%, #d4af37 45%, #78350f 90%)',
            border: '3px solid #fff3c4',
            boxShadow:
              '0 0 36px rgba(245, 176, 65, 0.55), 0 12px 24px rgba(0, 0, 0, 0.9)',
          }}
        >
          <svg viewBox="0 0 64 64" className="w-20 h-20 drop-shadow-lg">
            <path
              d="M8 46 L14 20 L26 32 L32 14 L38 32 L50 20 L56 46 Z"
              fill="#1c1102"
              stroke="#fff3c4"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <rect
              x="12"
              y="48"
              width="40"
              height="6"
              rx="3"
              fill="#1c1102"
              stroke="#fff3c4"
              strokeWidth="1.5"
            />
            <circle cx="32" cy="11" r="3.5" fill="#ef4444" stroke="#fff" strokeWidth="1" />
            <circle cx="14" cy="17" r="2.5" fill="#10b981" />
            <circle cx="50" cy="17" r="2.5" fill="#3b82f6" />
          </svg>
        </div>

        <h1 className="font-display font-black text-2xl tracking-wider text-[#ffe082] drop-shadow">
          ALPHABET ROYALE 3D
        </h1>
        <p className="mt-1 text-xs text-emerald-300 font-semibold tracking-wide">
          High-Roller 1v1 Card Arena &amp; Velvet Salon
        </p>
      </div>

      {/* Bottom Animated 3D Dealing Cards + 0% to 100% Progress Bar + Skip Button */}
      <div className="w-full space-y-3">
        {/* Animated Row of 3D Playing Cards Dealing Across Bottom */}
        <div className="flex items-center justify-center gap-1.5 h-28 perspective-1000">
          {dealingCards.map((item, idx) => {
            const dealt = progress >= item.threshold;
            return (
              <div
                key={item.letter}
                className={`transition-all duration-300 ${item.tilt} ${
                  dealt
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-20 translate-y-6 scale-75'
                }`}
                style={{ transitionDelay: `${idx * 25}ms` }}
              >
                <Card3D
                  letter={item.letter}
                  codeName={item.code}
                  skin={item.skin}
                  size="xs"
                />
              </div>
            );
          })}
        </div>

        {/* 0% to 100% Metallic Gold Progress Bar */}
        <div className="p-3 rounded-2xl bg-obsidian-panel border-gold-metallic space-y-2">
          <div className="flex items-center justify-between text-xs font-mono-num font-extrabold">
            <span className="text-amber-200 uppercase tracking-wider">
              Dealing Royal Deck...
            </span>
            <span className="text-[#ffe082] text-sm">{progress}%</span>
          </div>
          <div className="w-full h-3.5 rounded-full bg-black/90 border border-amber-500/50 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-royal-gold transition-all duration-75 shadow-[0_0_12px_rgba(245,176,65,0.85)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Bottom Bar: Loading Status */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-emerald-300 font-mono-num font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{progress >= 100 ? 'Entering Royal Salon...' : 'Initializing 3D Cards...'}</span>
            </span>
            <span className="text-[10px] text-amber-200/80 font-mono-num font-bold uppercase tracking-wider">
              60FPS 3D Engine
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface LoginScreenProps {
  playerCode: string;
  onSelectAuth: (user: User | null, provider: AuthProviderType) => void;
  onErrorToast?: (message: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  playerCode,
  onSelectAuth,
  onErrorToast,
}) => {
  const [loadingProvider, setLoadingProvider] = useState<AuthProviderType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    if (loadingProvider) return;
    setLoadingProvider('google');
    setErrorMessage(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      sound.playCoinChime(4);
      onSelectAuth(result.user, 'google');
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.warn('Google sign-in exception:', error);
      if (
        error.code === 'auth/unauthorized-domain' ||
        error.code === 'auth/operation-not-allowed'
      ) {
        // Automatic fallback for preview iframe without blocking red error box!
        sound.playCoinChime(2);
        onErrorToast?.('Preview domain not authorized in Firebase Console — entering as VIP Guest!');
        onSelectAuth(null, 'guest');
      } else if (
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request'
      ) {
        setErrorMessage('Sign-in popup closed. Please try again or Play as Guest.');
      } else if (error.code === 'auth/popup-blocked') {
        const msg = 'Popup was blocked by your browser. Entering as VIP Guest.';
        onErrorToast?.(msg);
        sound.playCoinChime(2);
        onSelectAuth(null, 'guest');
      } else {
        // Safe fallback so player is never blocked from playing the game
        onErrorToast?.('Connecting as VIP Guest...');
        sound.playCoinChime(2);
        onSelectAuth(null, 'guest');
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleGuestSignIn = async () => {
    if (loadingProvider) return;
    setLoadingProvider('guest');
    setErrorMessage(null);
    try {
      const result = await signInAnonymously(auth);
      sound.playClick(1.2);
      onSelectAuth(result.user, 'guest');
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.warn('Anonymous sign-in error:', error);
      // Graceful fallback to local guest session so user is never locked out
      sound.playClick(1.1);
      if (
        error?.code === 'auth/operation-not-allowed' ||
        error?.code === 'auth/unauthorized-domain'
      ) {
        onErrorToast?.('Entering as VIP Guest!');
      }
      onSelectAuth(null, 'guest');
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div
      aria-label="Royal Casino Login Screen"
      className="flex flex-col items-center justify-between w-full h-full px-5 py-6 select-none overflow-hidden"
    >
      {/* Top Security Badge */}
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-obsidian-panel border border-amber-500/40">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span className="text-[10px] font-mono-num font-bold text-amber-200 tracking-wider uppercase">
          VIP Encrypted Cloud Save • ID: {playerCode}
        </span>
      </div>

      {/* Center Crown & 3D Card Showcase */}
      <div className="flex flex-col items-center text-center space-y-3 my-auto">
        <div className="relative flex items-center justify-center py-2">
          <div className="-rotate-12 -mr-3 z-10">
            <Card3D letter="A" codeName="ALPHA" skin={THIRTY_DECK_SKINS[0]} size="sm" />
          </div>
          <div className="z-20 -translate-y-2">
            <Card3D letter="K" codeName="KILO" skin={THIRTY_DECK_SKINS[2]} size="md" glowMatch />
          </div>
          <div className="rotate-12 -ml-3 z-10">
            <Card3D letter="Z" codeName="OMEGA" skin={THIRTY_DECK_SKINS[1]} size="sm" />
          </div>
        </div>

        <h1 className="font-display font-black text-2xl tracking-wider text-[#ffe082] drop-shadow">
          ALPHABET ROYALE 3D
        </h1>
        <p className="text-xs text-amber-100/85 max-w-[300px] leading-relaxed">
          Sign in to sync your 30 Luxury Decks, Royal Velvet Tables, High-Roller Bankroll, and Firestore Profile across matches.
        </p>

        {/* Error Notice if Auth Failed */}
        {errorMessage && (
          <div className="px-3 py-1.5 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 text-[11px] font-semibold flex items-center gap-1.5 max-w-[320px]">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="truncate">{errorMessage}</span>
          </div>
        )}
      </div>

      {/* 2 Real Firebase Auth Buttons: Google & Guest ONLY */}
      <div className="w-full space-y-3">
        {/* 1. Sign in with Google (Real Firebase Auth) */}
        <button
          type="button"
          disabled={loadingProvider !== null}
          onClick={handleGoogleSignIn}
          className="w-full py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-xl disabled:opacity-60 cursor-pointer"
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 60%, #cbd5e1 100%)',
            border: '2px solid #f5b041',
            boxShadow: '0 4px 0 #64748b, 0 8px 16px rgba(0,0,0,0.75)',
            color: '#0f172a',
          }}
        >
          <span className="w-7 h-7 rounded-lg bg-slate-900/10 border border-slate-300 flex items-center justify-center shrink-0">
            {loadingProvider === 'google' ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-800" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-4 h-4">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.9C3.5 21.4 7.4 24 12 24z"
                />
              </svg>
            )}
          </span>
          <div className="text-left flex-1">
            <div className="font-display font-extrabold text-xs sm:text-sm tracking-wide text-slate-900">
              {loadingProvider === 'google' ? 'Connecting Google Cloud...' : 'Sign in with Google'}
            </div>
            <div className="text-[10px] text-slate-600 font-semibold">
              Real Cloud Save &amp; Global Top 100 Sync
            </div>
          </div>
        </button>

        {/* 2. Play as Guest (Real Firebase Anonymous Auth) */}
        <button
          type="button"
          data-start="true"
          disabled={loadingProvider !== null}
          onClick={handleGuestSignIn}
          className="w-full py-3.5 px-4 rounded-2xl btn-3d-gold flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-60 cursor-pointer"
        >
          <span className="w-7 h-7 rounded-lg bg-black/20 border border-black/30 flex items-center justify-center shrink-0">
            {loadingProvider === 'guest' ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#1c1102]" />
            ) : (
              <Crown className="w-4 h-4 text-[#1c1102]" />
            )}
          </span>
          <div className="text-left flex-1">
            <div className="font-display font-black text-xs sm:text-sm tracking-wide text-[#1c1102]">
              {loadingProvider === 'guest' ? 'Entering As Royal Guest...' : 'Play as Guest'}
            </div>
            <div className="text-[10px] text-[#3b2304] font-bold">
              Instant Access • 8,500 Starting Coins
            </div>
          </div>
          <UserCheck className="w-4 h-4 text-[#1c1102] shrink-0" />
        </button>
      </div>
    </div>
  );
};
