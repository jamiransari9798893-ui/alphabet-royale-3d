import React, { useEffect, useState } from 'react';
import { Check, Coins, Sparkles, Trophy } from 'lucide-react';
import {
  ADMOB_CONFIG,
  triggerNativeInterstitialAd,
  triggerNativeRewardedAd,
} from '../utils/admob';
import { sound } from '../utils/sound';

interface AdSimulatorModalProps {
  mode?: 'rewarded' | 'interstitial';
  adsRemainingBeforeWatch: number;
  onCompleteAd: () => void;
  onClose: () => void;
}

export const AdSimulatorModal: React.FC<AdSimulatorModalProps> = ({
  mode = 'rewarded',
  adsRemainingBeforeWatch,
  onCompleteAd,
  onClose,
}) => {
  const [elapsedMs, setElapsedMs] = useState(0);
  const totalMs = mode === 'interstitial' ? 3000 : 5000;
  const isDone = elapsedMs >= totalMs;
  const adUnitId =
    mode === 'interstitial'
      ? ADMOB_CONFIG.INTERSTITIAL_AD_UNIT
      : ADMOB_CONFIG.REWARDED_AD_UNIT;

  useEffect(() => {
    if (mode === 'interstitial') {
      triggerNativeInterstitialAd().catch(() => {});
    } else {
      triggerNativeRewardedAd().catch(() => {});
    }

    const start = Date.now();
    const interval = setInterval(() => {
      const diff = Date.now() - start;
      if (diff >= totalMs) {
        setElapsedMs(totalMs);
        clearInterval(interval);
        sound.playCoinChime(6);
      } else {
        setElapsedMs(diff);
      }
    }, 80);

    return () => clearInterval(interval);
  }, [mode, totalMs]);

  const progressPct = Math.min(100, Math.round((elapsedMs / totalMs) * 100));
  const secondsRemaining = Math.max(0, Math.ceil((totalMs - elapsedMs) / 1000));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={
        mode === 'interstitial'
          ? 'Post-Match Sponsored Spotlight'
          : 'Rewarded Video Ad (+500 Coins)'
      }
      data-admob-app-id={ADMOB_CONFIG.APP_ID}
      data-ad-unit-id={adUnitId}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 select-none"
    >
      <div className="w-full max-w-[370px] p-5 rounded-3xl bg-obsidian-panel border-gold-glow text-center space-y-4 shadow-2xl">
        <div className="flex items-center justify-between text-[10px] font-mono-num text-amber-300">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#f5b041]" />
            <span>
              {mode === 'interstitial'
                ? 'ROYAL SALON SPONSORED SPOTLIGHT'
                : 'REWARDED VIDEO AD • +500 COINS'}
            </span>
          </span>
          <span>{isDone ? 'COMPLETE' : `00:0${secondsRemaining}s`}</span>
        </div>

        {/* 3D Casino Video Showcase */}
        <div className="relative h-36 rounded-2xl bg-emerald-velvet border border-amber-400/50 flex flex-col items-center justify-center p-3 overflow-hidden">
          <div className="card-foil-shine absolute inset-0 pointer-events-none" />
          <div className="w-12 h-12 rounded-full bg-royal-gold border-2 border-white flex items-center justify-center shadow-lg animate-bounce">
            {mode === 'interstitial' ? (
              <Trophy className="w-6 h-6 text-[#1c1102]" />
            ) : (
              <Coins className="w-6 h-6 text-[#1c1102]" />
            )}
          </div>
          <p className="mt-2 font-display font-black text-base text-[#ffe082]">
            ALPHABET ROYALE 3D VIP
          </p>
          <p className="text-[11px] text-emerald-200 font-semibold">
            {mode === 'interstitial'
              ? isDone
                ? 'Match Summary Verified — Ready to Enter Lobby'
                : 'Syncing Match Payout & Global Leaderboard...'
              : isDone
              ? '+500 Gold Coins Unlocked & Ready!'
              : 'Watch Video Broadcast to Unlock +500 Gold Coins...'}
          </p>
        </div>

        {/* Video Progress Bar */}
        <div className="space-y-1">
          <div className="w-full h-3 rounded-full bg-black/80 border border-amber-500/40 overflow-hidden">
            <div
              className="h-full bg-royal-gold transition-all duration-100"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-[10px] font-mono-num text-amber-200/80">
            {mode === 'interstitial'
              ? `Sponsored Interstitial • ${progressPct}%`
              : `Reward Progress: ${progressPct}% • Daily Bonus (${5 - adsRemainingBeforeWatch}/4)`}
          </p>
        </div>

        {isDone ? (
          <button
            type="button"
            onClick={() => {
              sound.playCoinChime(4);
              onCompleteAd();
            }}
            className="w-full py-3 rounded-2xl btn-3d-gold font-display font-black text-xs tracking-wider flex items-center justify-center gap-2 active:scale-95"
          >
            <Check className="w-4 h-4 text-[#1c1102]" />
            <span>
              {mode === 'interstitial'
                ? 'CONTINUE TO ROYAL LOBBY'
                : 'CLAIM +500 GOLD COINS NOW'}
            </span>
          </button>
        ) : mode === 'rewarded' ? (
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-black/60 border border-amber-500/30 text-amber-200/70 text-[11px] font-bold"
          >
            Close Video (Forfeit +500 Coins)
          </button>
        ) : (
          <div className="w-full py-2.5 rounded-xl bg-black/60 border border-amber-500/30 text-amber-200/80 text-[11px] font-mono-num font-bold">
            Returning to Lobby in {secondsRemaining}s...
          </div>
        )}
      </div>
    </div>
  );
};
