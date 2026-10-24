import React, { useEffect, useRef, useState } from 'react';
import {
  Clock,
  Coins,
  Crown,
  Loader2,
  Radio,
  ShieldCheck,
  Sparkles,
  Swords,
  Users,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { DeckSkin, StakeOption, THIRTY_DECK_SKINS } from '../game/data';
import {
  cancelOnlineMatch,
  findOrCreateOnlineMatch,
  getMatchmakingUid,
  OnlineMatchDoc,
  subscribeToOnlineMatch,
} from '../game/matchmaking';
import { formatCoins } from '../game/rules';
import { sound } from '../utils/sound';
import { RoyalAvatar } from './RoyalAvatarSvg';

interface MatchmakingModalProps {
  stake: StakeOption;
  deckSize: number;
  playerName: string;
  playerAvatarId: string;
  playerLevel: number;
  selectedDeckSkin: DeckSkin;
  onMatchFound: (matchConfig: {
    isRealOnline: boolean;
    onlineMatchId: string | null;
    myRole: 'p1' | 'p2';
    opponent: {
      name: string;
      avatarId: string;
      level: number;
      deckSkin: DeckSkin;
    };
    initialDoc?: OnlineMatchDoc;
  }) => void;
  onCancel: () => void;
}

const LIVE_CLUB_CHALLENGERS = [
  { name: 'Aarav Sharma', avatarId: 'viktor-ace', level: 16, skinId: 'obsidian-black' },
  { name: 'Priya Patel', avatarId: 'empress-cleo', level: 24, skinId: 'cyber-neon-glow' },
  { name: 'Rohan Verma', avatarId: 'baron-sterling', level: 19, skinId: 'ruby-red-imperial' },
  { name: 'Vikram Singh', avatarId: 'king-aurelius', level: 22, skinId: 'diamond-crystal' },
  { name: 'Ananya Iyer', avatarId: 'duchess-celeste', level: 27, skinId: 'royal-gold-foil' },
  { name: 'Kabir Malhotra', avatarId: 'duke-draco', level: 31, skinId: 'emerald-sovereign' },
];

export const MatchmakingModal: React.FC<MatchmakingModalProps> = ({
  stake,
  deckSize,
  playerName,
  playerAvatarId,
  playerLevel,
  selectedDeckSkin,
  onMatchFound,
  onCancel,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(8);
  const [matchStatus, setMatchStatus] = useState<'searching' | 'matched' | 'fallback'>('searching');
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [matchedOpponent, setMatchedOpponent] = useState<{
    name: string;
    avatarId: string;
    level: number;
    deckSkin: DeckSkin;
  } | null>(null);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const matchResolvedRef = useRef<boolean>(false);
  const activeMatchIdRef = useRef<string | null>(null);
  activeMatchIdRef.current = activeMatchId;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (activeMatchIdRef.current && !matchResolvedRef.current) {
        cancelOnlineMatch(activeMatchIdRef.current).catch(() => {});
      }
    };
  }, []);

  // 1. Kick off Firestore Matchmaking Query
  useEffect(() => {
    let isCancelled = false;
    const clientUid = getMatchmakingUid();

    const startSearch = async () => {
      try {
        const result = await findOrCreateOnlineMatch(
          {
            uid: clientUid,
            name: playerName,
            avatarId: playerAvatarId,
            level: playerLevel,
            deckSkinId: selectedDeckSkin.id,
          },
          stake.entryCoins,
          stake.potCoins,
          deckSize
        );

        if (isCancelled) {
          if (result.matchId) cancelOnlineMatch(result.matchId).catch(() => {});
          return;
        }

        setActiveMatchId(result.matchId);

        // Case A: Immediately joined an existing open room
        if (result.matchedImmediately && result.initialDoc) {
          matchResolvedRef.current = true;
          setMatchStatus('matched');
          sound.playCoinChime(4);

          const hostSkin =
            THIRTY_DECK_SKINS.find((d) => d.id === result.initialDoc?.hostDeckSkinId) ||
            THIRTY_DECK_SKINS[1];

          const opponentData = {
            name: result.initialDoc.hostName,
            avatarId: result.initialDoc.hostAvatarId,
            level: result.initialDoc.hostLevel,
            deckSkin: hostSkin,
          };

          setMatchedOpponent(opponentData);

          setTimeout(() => {
            onMatchFound({
              isRealOnline: true,
              onlineMatchId: result.matchId,
              myRole: 'p2',
              opponent: opponentData,
              initialDoc: result.initialDoc,
            });
          }, 950);
          return;
        }

        // Case B: Created a room as Host. Listen for guest player to join.
        const unsub = subscribeToOnlineMatch(
          result.matchId,
          (updatedDoc) => {
            if (matchResolvedRef.current) return;
            // A real online player joined!
            if (updatedDoc.status === 'playing' && updatedDoc.guestUid) {
              matchResolvedRef.current = true;
              setMatchStatus('matched');
              sound.playCoinChime(4);

              const guestSkin =
                THIRTY_DECK_SKINS.find((d) => d.id === updatedDoc.guestDeckSkinId) ||
                THIRTY_DECK_SKINS[2];

              const opponentData = {
                name: updatedDoc.guestName || 'VIP Challenger',
                avatarId: updatedDoc.guestAvatarId || 'viktor-ace',
                level: updatedDoc.guestLevel || 12,
                deckSkin: guestSkin,
              };

              setMatchedOpponent(opponentData);

              setTimeout(() => {
                onMatchFound({
                  isRealOnline: true,
                  onlineMatchId: result.matchId,
                  myRole: 'p1',
                  opponent: opponentData,
                  initialDoc: updatedDoc,
                });
              }, 950);
            }
          },
          (err) => {
            console.warn('Realtime listener error:', err);
          }
        );

        unsubscribeRef.current = unsub;
      } catch (err) {
        console.warn('Matchmaking initiation error:', err);
      }
    };

    startSearch();

    return () => {
      isCancelled = true;
    };
  }, [stake.entryCoins, stake.potCoins, deckSize, playerName, playerAvatarId, playerLevel, selectedDeckSkin.id, onMatchFound]);

  // 2. 8-Second Countdown Timer with Smart AI Fallback
  useEffect(() => {
    if (matchStatus === 'matched') return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          triggerSmartAiFallback();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [matchStatus]);

  const triggerSmartAiFallback = () => {
    if (matchResolvedRef.current) return;
    matchResolvedRef.current = true;
    setMatchStatus('fallback');

    // Clean up Firestore room
    if (activeMatchId) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      cancelOnlineMatch(activeMatchId).catch(() => {});
    }

    sound.playClick(1.2);

    const randomChallenger =
      LIVE_CLUB_CHALLENGERS[Math.floor(Math.random() * LIVE_CLUB_CHALLENGERS.length)];
    const challengerSkin =
      THIRTY_DECK_SKINS.find((d) => d.id === randomChallenger.skinId) || THIRTY_DECK_SKINS[1];

    const fallbackOpponent = {
      name: randomChallenger.name,
      avatarId: randomChallenger.avatarId,
      level: Math.max(playerLevel + 1, randomChallenger.level),
      deckSkin: challengerSkin,
    };

    setMatchedOpponent(fallbackOpponent);

    setTimeout(() => {
      onMatchFound({
        isRealOnline: false,
        onlineMatchId: null,
        myRole: 'p1',
        opponent: fallbackOpponent,
      });
    }, 900);
  };

  const handleManualCancel = () => {
    sound.playClick(1.1);
    if (activeMatchId && !matchResolvedRef.current) {
      cancelOnlineMatch(activeMatchId).catch(() => {});
    }
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    onCancel();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Online Matchmaking"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none"
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-obsidian-card border-gold-glow p-5 flex flex-col items-center text-center relative shadow-[0_0_50px_rgba(0,0,0,0.95)] overflow-hidden"
        style={{
          background: 'radial-gradient(circle at 50% 20%, #16241b 0%, #08110b 60%, #030604 100%)',
          border: '2px solid rgba(245, 176, 65, 0.65)',
        }}
      >
        {/* Close / Cancel Button */}
        <button
          type="button"
          onClick={handleManualCancel}
          aria-label="Cancel Matchmaking"
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 border border-amber-500/40 text-amber-200 flex items-center justify-center active:scale-95 transition-transform"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/70 border border-amber-500/40 mb-3">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-[10px] font-display font-extrabold tracking-widest text-amber-200 uppercase">
            Live 1v1 Matchmaking Queue
          </span>
        </div>

        <h2 className="font-display font-black text-xl text-[#ffe082] tracking-wider mb-1">
          {matchStatus === 'matched'
            ? 'REAL OPPONENT FOUND!'
            : matchStatus === 'fallback'
            ? 'ROYAL CHALLENGER READY!'
            : 'SEARCHING ROYAL SALON...'}
        </h2>

        <p className="text-xs text-amber-100/80 mb-5">
          {matchStatus === 'matched'
            ? 'Establishing real-time 1v1 Firestore synchronization...'
            : matchStatus === 'fallback'
            ? 'Pairing with active Royal Club contender!'
            : `Scanning online high-rollers on ${stake.buttonText} Stake (8s window)`}
        </p>

        {/* Center Animated Radar & Avatar Pulse */}
        <div className="relative w-44 h-44 flex items-center justify-center my-2">
          {/* Concentric Radar Rings */}
          <div className="absolute inset-0 rounded-full border border-emerald-500/25 animate-ping opacity-30" />
          <div className="absolute inset-4 rounded-full border border-amber-500/35 animate-pulse" />
          <div className="absolute inset-8 rounded-full border border-emerald-400/20" />

          {/* Left Player (You) & Right Opponent Radar Nodes */}
          {matchedOpponent ? (
            <div className="flex items-center justify-center gap-5 z-10 animate-fade-in">
              {/* You */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-2 border-emerald-400 p-0.5 bg-black/80 shadow-[0_0_16px_rgba(16,185,129,0.7)]">
                  <RoyalAvatar
                    avatarId={playerAvatarId}
                    levelBadge={playerLevel}
                    size="md"
                    className="w-full h-full"
                  />
                </div>
                <span className="text-[10px] font-bold text-emerald-300 mt-1 max-w-[70px] truncate">
                  You (Lv.{playerLevel})
                </span>
              </div>

              {/* VS Swords */}
              <div className="w-9 h-9 rounded-full bg-royal-gold flex items-center justify-center shadow-lg border border-white">
                <Swords className="w-4 h-4 text-[#1c1102]" />
              </div>

              {/* Opponent */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-2 border-amber-400 p-0.5 bg-black/80 shadow-[0_0_16px_rgba(245,176,65,0.7)] animate-bounce">
                  <RoyalAvatar
                    avatarId={matchedOpponent.avatarId}
                    levelBadge={matchedOpponent.level}
                    size="md"
                    className="w-full h-full"
                  />
                </div>
                <span className="text-[10px] font-bold text-amber-200 mt-1 max-w-[70px] truncate">
                  {matchedOpponent.name}
                </span>
              </div>
            </div>
          ) : (
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative w-20 h-20 rounded-full border-2 border-amber-400 p-1 bg-black/70 shadow-[0_0_24px_rgba(245,176,65,0.6)] flex items-center justify-center">
                <RoyalAvatar
                  avatarId={playerAvatarId}
                  levelBadge={playerLevel}
                  size="md"
                  className="w-full h-full"
                />
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border border-white flex items-center justify-center shadow">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                </span>
              </div>

              {/* Big 8s Countdown Badge */}
              <div className="mt-3 px-3 py-1 rounded-full bg-black/90 border border-amber-400/50 flex items-center gap-1.5 shadow">
                <Clock className="w-3.5 h-3.5 text-[#f5b041]" />
                <span className="text-xs font-mono-num font-extrabold text-[#ffe082]">
                  {secondsLeft}s
                </span>
                <span className="text-[10px] text-amber-200/70 font-semibold">Remaining</span>
              </div>
            </div>
          )}
        </div>

        {/* Stake & Pot Details Card */}
        <div className="w-full mt-4 p-3 rounded-2xl bg-black/60 border border-amber-500/30 flex items-center justify-between text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
              <Coins className="w-4 h-4 text-[#f5b041]" />
            </div>
            <div>
              <div className="text-[10px] text-amber-300 font-semibold uppercase tracking-wider">
                {stake.buttonText} Arena Tier
              </div>
              <div className="text-xs font-mono-num font-bold text-white">
                Entry: {formatCoins(stake.entryCoins)} Coins
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[9px] text-emerald-400 font-semibold uppercase tracking-wider">
              Winner Pot
            </div>
            <div className="text-sm font-mono-num font-extrabold text-[#ffe082]">
              {stake.potFormatted}
            </div>
          </div>
        </div>

        {/* Bottom Action / Status */}
        <div className="w-full mt-4 flex items-center justify-between gap-3">
          <span className="text-[11px] text-amber-200/80 font-mono-num flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>
              {matchStatus === 'matched'
                ? 'Connecting match...'
                : matchStatus === 'fallback'
                ? 'Entering Royal Arena...'
                : 'Pinging Firestore queue...'}
            </span>
          </span>

          <button
            type="button"
            onClick={handleManualCancel}
            className="px-3 py-1.5 rounded-xl bg-red-950/70 hover:bg-red-900/90 border border-red-500/50 text-red-200 hover:text-white text-xs font-extrabold active:scale-95 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
