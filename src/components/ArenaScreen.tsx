import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  Clock,
  Coins,
  Crown,
  Flame,
  Gem,
  Layers,
  LogOut,
  MessageSquare,
  Send,
  Shuffle,
  Sparkles,
  ThumbsUp,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  DeckSkin,
  StakeOption,
  TableSkin,
  THIRTY_DECK_SKINS,
} from '../game/data';
import {
  CardItem,
  collectPotIntoDeck,
  computeReverseRedeal,
  formatCoins,
  getPlayerTotalCardCount,
  shouldTriggerNoMatchRedeal,
  throwTopCard,
} from '../game/rules';
import { sound } from '../utils/sound';
import { Card3D } from './Card3D';
import { GameMode } from './HomeScreen';
import { ReverseRedealArrangeModal } from './ReverseRedealArrangeModal';
import { RoyalAvatar } from './RoyalAvatarSvg';

import {
  forfeitOnlineMatch,
  pushOnlineCardThrow,
  pushOnlineRedealDeckOrder,
  pushOnlineSocialAction,
  subscribeToOnlineMatch,
} from '../game/matchmaking';

interface ArenaScreenProps {
  mode: GameMode;
  stake: StakeOption;
  selectedTable: TableSkin;
  selectedDeckSkin: DeckSkin;
  opponentDeckSkin?: DeckSkin;
  customPhotoUrl: string | null;
  player1Name: string;
  player1AvatarId: string;
  player1Level: number;
  player2Name: string;
  player2AvatarId: string;
  player2Level: number;
  initialP1Deck: CardItem[];
  initialP2Deck: CardItem[];
  isRealOnlineMatch?: boolean;
  onlineMatchId?: string | null;
  myRole?: 'p1' | 'p2';
  onMatchComplete: (
    winner: 'p1' | 'p2',
    winningLetter: string,
    potWon: number,
    xpEarned: number
  ) => void;
  onExitArena: () => void;
}

type ReactionType = 'crown' | 'flame' | 'sparkles' | 'gem' | 'thumbs' | 'zap';

const REACTION_ITEMS: { id: ReactionType; label: string }[] = [
  { id: 'crown', label: 'Crown' },
  { id: 'flame', label: 'Fire' },
  { id: 'sparkles', label: 'Royal' },
  { id: 'gem', label: 'Diamond' },
  { id: 'thumbs', label: 'Bravo' },
  { id: 'zap', label: 'Snap' },
];

const QUICK_CHAT_PHRASES = [
  'Well played!',
  'Your turn, hurry!',
  'Good luck!',
  'Nice deck!',
];

const BOT_CHAT_REPLIES = [
  'Royal salute! Good luck!',
  'Watch this top card throw!',
  'Nice deck skin!',
  'High-roller match!',
];

const SHUFFLE_PREVIEW_CARDS = Array.from({ length: 10 }, (_, idx) => ({
  idx,
  isLeftPacket: idx < 5,
  packetIdx: idx % 5,
}));

/**
 * 60FPS Pure GPU-Accelerated Riffle Shuffle Overlay (Match Start & Reverse/Re-deal)
 * Uses strictly 10 lightweight DOM card elements with translate3d() + rotateZ() + will-change: transform
 * and cubic-bezier(0.22, 1, 0.36, 1) transitions so shuffling is 100% butter-smooth on mobile.
 */
const ArenaShuffleOverlay: React.FC<{
  skin: DeckSkin;
  title: string;
  subtitle: string;
}> = React.memo(({ skin, title, subtitle }) => {
  const [phase, setPhase] = useState<'split' | 'interleave' | 'square'>('split');

  useEffect(() => {
    const t1 = requestAnimationFrame(() => {
      setPhase('split');
    });
    const t2 = setTimeout(() => {
      setPhase('interleave');
    }, 240);
    const t3 = setTimeout(() => {
      setPhase('square');
    }, 520);
    return () => {
      cancelAnimationFrame(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div
      aria-label="60FPS GPU Riffle Shuffle Overlay"
      className="absolute inset-0 z-40 rounded-[36px] bg-black/80 flex flex-col items-center justify-center pointer-events-none overflow-hidden"
    >
      <div className="relative w-56 h-36 flex items-center justify-center">
        {SHUFFLE_PREVIEW_CARDS.map(({ idx, isLeftPacket, packetIdx }) => {
          let tx = 0;
          let ty = 0;
          let rz = 0;

          if (phase === 'split') {
            tx = isLeftPacket ? -54 - packetIdx * 3 : 54 + packetIdx * 3;
            ty = (packetIdx - 2) * 3;
            rz = isLeftPacket ? -12 - packetIdx * 1.5 : 12 + packetIdx * 1.5;
          } else if (phase === 'interleave') {
            tx = isLeftPacket ? -8 + packetIdx * 1.5 : 8 - packetIdx * 1.5;
            ty = (idx - 5) * -2.2;
            rz = isLeftPacket ? -3 : 3;
          } else {
            tx = 0;
            ty = -idx * 1.1;
            rz = 0;
          }

          return (
            <div
              key={idx}
              style={{
                background: skin.bgGradient,
                borderColor: skin.borderHex,
                color: skin.textHex,
                zIndex: 10 + idx,
                willChange: 'transform',
                backfaceVisibility: 'hidden',
                transform: `translate3d(${tx}px, ${ty}px, 0px) rotateZ(${rz}deg)`,
                transition: `transform 260ms cubic-bezier(0.22, 1, 0.36, 1) ${
                  packetIdx * 16
                }ms`,
              }}
              className="absolute w-16 h-24 rounded-xl border-2 shadow-xl flex flex-col items-center justify-center select-none"
            >
              <div
                style={{ borderColor: skin.borderHex }}
                className="w-12 h-20 rounded-lg border border-dashed flex flex-col items-center justify-center opacity-85"
              >
                <Crown className="w-4 h-4 opacity-80" />
                <span className="mt-1 font-display font-black text-[8px] tracking-widest uppercase opacity-90">
                  ROYAL
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl bg-black/90 border border-[#f5b041] shadow-lg text-center">
        <div className="flex items-center gap-1.5 text-[#ffe082]">
          <Shuffle className="w-3.5 h-3.5 text-[#f5b041] animate-spin" />
          <span className="font-display font-black text-[10px] tracking-wider uppercase">
            {title}
          </span>
        </div>
        <span className="font-mono-num font-bold text-[9px] text-emerald-300">
          {subtitle}
        </span>
      </div>
    </div>
  );
});

const ReactionBadgeIcon: React.FC<{ type: ReactionType; className?: string }> = ({
  type,
  className = 'w-3.5 h-3.5 text-[#f5b041]',
}) => {
  switch (type) {
    case 'crown':
      return <Crown className={className} />;
    case 'flame':
      return <Flame className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'gem':
      return <Gem className={className} />;
    case 'thumbs':
      return <ThumbsUp className={className} />;
    case 'zap':
      return <Zap className={className} />;
  }
};

export const ArenaScreen: React.FC<ArenaScreenProps> = ({
  mode,
  stake,
  selectedTable,
  selectedDeckSkin,
  opponentDeckSkin = THIRTY_DECK_SKINS[1],
  customPhotoUrl,
  player1Name,
  player1AvatarId,
  player1Level,
  player2Name,
  player2AvatarId,
  player2Level,
  initialP1Deck,
  initialP2Deck,
  isRealOnlineMatch = false,
  onlineMatchId = null,
  myRole = 'p1',
  onMatchComplete,
  onExitArena,
}) => {
  const initialHandCount = initialP1Deck.length;
  const totalMatchCards = initialP1Deck.length + initialP2Deck.length;
  const [p1Deck, setP1Deck] = useState<CardItem[]>(initialP1Deck);
  const [p2Deck, setP2Deck] = useState<CardItem[]>(initialP2Deck);
  const [p1Bank, setP1Bank] = useState<CardItem[]>([]);
  const [p2Bank, setP2Bank] = useState<CardItem[]>([]);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [centerPot, setCenterPot] = useState<CardItem[]>([]);
  const [turn, setTurn] = useState<'p1' | 'p2'>('p1');
  const [turnTimer, setTurnTimer] = useState<number>(25);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isThrowing, setIsThrowing] = useState<boolean>(false);
  const [pileBounce, setPileBounce] = useState<boolean>(false);

  // 60FPS Shuffle Theater state (runs at Match Start & on Reverse / Re-deal)
  const [shuffleOverlayState, setShuffleOverlayState] = useState<{
    title: string;
    subtitle: string;
  } | null>({
    title: 'FISHER-YATES TRUE SHUFFLE • ROUND 1',
    subtitle: `${initialP1Deck.length} vs ${initialP2Deck.length} Cards Dealt`,
  });

  // AFK & Auto-Throw Tracking (3-Minute Continuous Inactivity Forfeit Rule)
  const [p1AfkSeconds, setP1AfkSeconds] = useState<number>(0);
  const [p1ConsecutiveAutoThrows, setP1ConsecutiveAutoThrows] = useState<number>(0);
  const [p2AfkSeconds, setP2AfkSeconds] = useState<number>(0);
  const [p2ConsecutiveAutoThrows, setP2ConsecutiveAutoThrows] = useState<number>(0);

  // Net remaining card totals across hand + bank + center pile
  const p1TotalCards = getPlayerTotalCardCount('p1', p1Deck, p1Bank, centerPot);
  const p2TotalCards = getPlayerTotalCardCount('p2', p2Deck, p2Bank, centerPot);

  // Perspective mapping: local actor is bottom, remote actor is top
  const localActor: 'p1' | 'p2' = isRealOnlineMatch && myRole ? myRole : 'p1';
  const remoteActor: 'p1' | 'p2' = localActor === 'p1' ? 'p2' : 'p1';

  const localName = localActor === 'p1' ? player1Name : player2Name;
  const localAvatarId = localActor === 'p1' ? player1AvatarId : player2AvatarId;
  const localLevel = localActor === 'p1' ? player1Level : player2Level;
  const localSkin = localActor === 'p1' ? selectedDeckSkin : opponentDeckSkin;
  const localDeck = localActor === 'p1' ? p1Deck : p2Deck;
  const localBank = localActor === 'p1' ? p1Bank : p2Bank;
  const localTotalCards = localActor === 'p1' ? p1TotalCards : p2TotalCards;
  const localAfkThrows = localActor === 'p1' ? p1ConsecutiveAutoThrows : p2ConsecutiveAutoThrows;

  const remoteName = localActor === 'p1' ? player2Name : player1Name;
  const remoteAvatarId = localActor === 'p1' ? player2AvatarId : player1AvatarId;
  const remoteLevel = localActor === 'p1' ? player2Level : player1Level;
  const remoteSkin = localActor === 'p1' ? opponentDeckSkin : selectedDeckSkin;
  const remoteDeck = localActor === 'p1' ? p2Deck : p1Deck;
  const remoteBank = localActor === 'p1' ? p2Bank : p1Bank;
  const remoteTotalCards = localActor === 'p1' ? p2TotalCards : p1TotalCards;
  const remoteAfkThrows = localActor === 'p1' ? p2ConsecutiveAutoThrows : p1ConsecutiveAutoThrows;

  const isMyTurn = turn === localActor;

  // 3D Flying Card Throw state (animates card from deck stack across table to center pile)
  const [flyingCard, setFlyingCard] = useState<{
    card: CardItem;
    actor: 'p1' | 'p2';
    skin: DeckSkin;
  } | null>(null);

  // Reactions & Live In-Game Chat states
  const [p1Reaction, setP1Reaction] = useState<ReactionType | null>(null);
  const [p2Reaction, setP2Reaction] = useState<ReactionType | null>('crown');
  const [p1ChatBubble, setP1ChatBubble] = useState<string | null>(null);
  const [p2ChatBubble, setP2ChatBubble] = useState<string | null>(
    'Good luck! Ready for 1v1!'
  );
  const [chatDrawerOpen, setChatDrawerOpen] = useState<boolean>(false);
  const [customChatInput, setCustomChatInput] = useState<string>('');

  const [ruleBanner, setRuleBanner] = useState<string>(
    'Tap or Swipe Up on your 3D Deck Stack to fling Top Card (#1)!'
  );
  const [matchVictoryState, setMatchVictoryState] = useState<{
    winner: 'p1' | 'p2';
    letter: string;
    potWon: number;
    xpEarned: number;
  } | null>(null);

  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState<boolean>(false);

  // 20-Second "SET YOUR CARD ORDER (अपने पत्ते सेट करें)" state on Reverse / Return Cards
  const [redealArrangeState, setRedealArrangeState] = useState<{
    roundNumber: number;
    nextTurnActor: 'p1' | 'p2';
    p1Pool: CardItem[];
    p2Pool: CardItem[];
    activeStage: 'p1' | 'p2';
  } | null>(null);

  const touchStartYRef = useRef<number | null>(null);
  const lastProcessedActionTimestampRef = useRef<number>(0);

  // Trigger initial 60FPS shuffle overlay at match start
  useEffect(() => {
    sound.playShuffle();
    const timer = setTimeout(() => {
      setShuffleOverlayState(null);
    }, 820);
    return () => clearTimeout(timer);
  }, []);

  // Clear initial bot greeting bubble after 3.2s
  useEffect(() => {
    const t = setTimeout(() => {
      setP2ChatBubble((prev) =>
        prev === 'Good luck! Ready for 1v1!' ? null : prev
      );
    }, 3200);
    return () => clearTimeout(t);
  }, []);

  // 25s Turn Countdown Timer (paused during card flight, shuffle overlay, leave modal, redeal arrange, or victory)
  useEffect(() => {
    if (
      matchVictoryState ||
      isThrowing ||
      shuffleOverlayState !== null ||
      showLeaveConfirmModal ||
      redealArrangeState !== null
    )
      return;
    const interval = setInterval(() => {
      setTurnTimer((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [
    turn,
    matchVictoryState,
    isThrowing,
    shuffleOverlayState,
    showLeaveConfirmModal,
    redealArrangeState,
  ]);

  // Elapsed Match Clock (counts up; match never ends prematurely on timer!)
  useEffect(() => {
    if (matchVictoryState) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [matchVictoryState]);

  // Open 20-Second "SET YOUR CARD ORDER (अपने पत्ते सेट करें)" Modal on Reverse / Return Cards
  const triggerReverseRedealArrange = (
    p1NewPool: CardItem[],
    p2NewPool: CardItem[],
    nextRoundNum: number,
    nextTurnActor: 'p1' | 'p2'
  ) => {
    sound.playCardSlide();
    setIsThrowing(false);
    setShuffleOverlayState(null);
    setRuleBanner(
      `🔄 REVERSE / RETURN CARDS (Round ${nextRoundNum})! Set your card order (#1, #2, #3...) in 20s!`
    );
    setRedealArrangeState({
      roundNumber: nextRoundNum,
      nextTurnActor,
      p1Pool: p1NewPool,
      p2Pool: p2NewPool,
      activeStage: mode === 'pass' ? 'p1' : localActor,
    });
  };

  const handleConfirmRedealArrange = (orderedDeck: CardItem[]) => {
    if (!redealArrangeState) return;

    // Pass & Play: Player 1 locks in first, then Player 2 gets 20s to arrange their returned cards
    if (mode === 'pass' && redealArrangeState.activeStage === 'p1') {
      const taggedP1 = orderedDeck.map((c) => ({
        ...c,
        owner: 'p1' as const,
        thrownBy: 'player1' as const,
      }));
      setP1Deck(taggedP1);
      setRedealArrangeState({
        ...redealArrangeState,
        p1Pool: taggedP1,
        activeStage: 'p2',
      });
      return;
    }

    const stageActor = redealArrangeState.activeStage;
    const taggedOrdered = orderedDeck.map((c) => ({
      ...c,
      owner: stageActor,
      thrownBy: stageActor === 'p1' ? ('player1' as const) : ('player2' as const),
    }));

    if (stageActor === 'p1') {
      setP1Deck(taggedOrdered);
    } else {
      setP2Deck(taggedOrdered);
    }

    if (isRealOnlineMatch && onlineMatchId) {
      pushOnlineRedealDeckOrder(onlineMatchId, localActor, taggedOrdered);
    }

    const nextR = redealArrangeState.roundNumber;
    const nextT = redealArrangeState.nextTurnActor;
    setRedealArrangeState(null);
    setTurn(nextT);
    setTurnTimer(25);
    setIsThrowing(false);
    setRuleBanner(
      `✅ ROUND ${nextR} STARTED! Cards locked in your custom #1, #2, #3... throw order!`
    );
  };

  // Real-time Firestore Live Match Sync (onSnapshot)
  useEffect(() => {
    if (!isRealOnlineMatch || !onlineMatchId) return;

    const unsub = subscribeToOnlineMatch(onlineMatchId, (doc) => {
      if (doc.lastAction && doc.lastAction.timestamp > lastProcessedActionTimestampRef.current) {
        lastProcessedActionTimestampRef.current = doc.lastAction.timestamp;

        // If the action was performed by the remote opponent
        if (doc.lastAction.actor === remoteActor) {
          if (doc.lastAction.type === 'forfeit') {
            setIsThrowing(false);
            setRuleBanner(
              `🏳️ ${remoteName} forfeited and left the match! You win the full 2X Pot!`
            );
            triggerVictory(localActor, 'OPPONENT_FORFEIT');
            return;
          }

          if (doc.lastAction.type === 'throw' && doc.lastAction.card) {
            const opponentCard = doc.lastAction.card;
            setIsThrowing(true);
            sound.playCardSlide();

            if (!doc.lastAction.isRedeal && !doc.lastAction.isConsecutiveMatch) {
              if (remoteActor === 'p1') {
                setP1Deck(doc.p1Deck || []);
              } else {
                setP2Deck(doc.p2Deck || []);
              }
            }

            setFlyingCard({
              card: opponentCard,
              actor: remoteActor,
              skin: remoteSkin,
            });

            setTimeout(() => {
              sound.playCardSlap();
              setFlyingCard(null);
              setPileBounce(true);
              setTimeout(() => setPileBounce(false), 240);

              if (doc.p1Bank !== undefined) setP1Bank(doc.p1Bank);
              if (doc.p2Bank !== undefined) setP2Bank(doc.p2Bank);
              if (doc.roundNumber !== undefined) setRoundNumber(doc.roundNumber);

              if (doc.lastAction?.isRedeal) {
                const nextP1 = doc.p1Deck || [];
                const nextP2 = doc.p2Deck || [];
                setP1Deck(nextP1);
                setP2Deck(nextP2);
                setP1Bank([]);
                setP2Bank([]);
                setCenterPot([]);
                const nextR = doc.roundNumber || roundNumber + 1;
                const nextT = doc.turn || (remoteActor === 'p1' ? 'p2' : 'p1');
                triggerReverseRedealArrange(nextP1, nextP2, nextR, nextT);
                return;
              }

              if (doc.p1Deck) setP1Deck(doc.p1Deck);
              if (doc.p2Deck) setP2Deck(doc.p2Deck);
              setCenterPot(doc.centerPot || []);

              if (doc.lastAction?.isConsecutiveMatch) {
                if (doc.winner) {
                  setIsThrowing(false);
                  setRuleBanner(
                    `🏆 MATCH WON! '${opponentCard.letter}' by ${remoteName} (0 cards left)!`
                  );
                  triggerVictory(doc.winner, opponentCard.letter);
                } else {
                  sound.playCoinChime(4);
                  setCenterPot([]);
                  const p1Len = (doc.p1Deck || []).length;
                  const p2Len = (doc.p2Deck || []).length;
                  setRuleBanner(
                    `⚡ SNAP MATCH! '${opponentCard.letter}' — ${remoteName} won the pile! [${player1Name}: ${p1Len} vs ${player2Name}: ${p2Len}]`
                  );
                  setTurn(doc.turn || (remoteActor === 'p1' ? 'p2' : 'p1'));
                  setTurnTimer(25);
                  setIsThrowing(false);
                }
              } else if (doc.winner) {
                setIsThrowing(false);
                triggerVictory(doc.winner, opponentCard.letter);
              } else {
                setTurn(doc.turn || (remoteActor === 'p1' ? 'p2' : 'p1'));
                setTurnTimer(25);
                setIsThrowing(false);
              }
            }, 360);
          } else if (doc.lastAction.type === 'chat' && doc.lastAction.text) {
            sound.playChatPing();
            setP2ChatBubble(doc.lastAction.text);
            setTimeout(() => setP2ChatBubble(null), 3600);
          } else if (doc.lastAction.type === 'reaction' && doc.lastAction.reaction) {
            sound.playClick(1.2);
            setP2Reaction(doc.lastAction.reaction as ReactionType);
            setTimeout(() => setP2Reaction(null), 2400);
          }
        }
      } else {
        // Sync remote player's custom arranged deck order after Reverse/Re-deal
        if (remoteActor === 'p1' && doc.p1Deck && doc.p1Deck.length > 0) {
          setP1Deck(doc.p1Deck);
        } else if (remoteActor === 'p2' && doc.p2Deck && doc.p2Deck.length > 0) {
          setP2Deck(doc.p2Deck);
        }
      }
    });

    return () => unsub();
  }, [isRealOnlineMatch, onlineMatchId, remoteActor, localActor, remoteName, player1Name, player2Name, remoteSkin, roundNumber]);

  // 4. 25-SECOND TURN TIMER WITH AUTO-THROW:
  // When active player does not manually throw within 25s, automatically throw their top card
  useEffect(() => {
    if (
      turnTimer === 0 &&
      !isThrowing &&
      !matchVictoryState &&
      shuffleOverlayState === null &&
      !showLeaveConfirmModal &&
      redealArrangeState === null
    ) {
      if (isRealOnlineMatch && turn !== localActor) return;
      executeTopCardThrow(turn, true /* isAutoThrow */);
    }
  }, [
    turnTimer,
    turn,
    isThrowing,
    matchVictoryState,
    shuffleOverlayState,
    showLeaveConfirmModal,
    redealArrangeState,
    isRealOnlineMatch,
    localActor,
  ]);

  // Bot turn handler for Offline & Practice modes (disabled during real online matches)
  useEffect(() => {
    if (
      matchVictoryState ||
      isThrowing ||
      isRealOnlineMatch ||
      shuffleOverlayState !== null ||
      showLeaveConfirmModal ||
      redealArrangeState !== null
    )
      return;
    if (turn === 'p2' && mode !== 'pass') {
      const botDelay = setTimeout(() => {
        executeTopCardThrow('p2', false);
      }, 820);
      return () => clearTimeout(botDelay);
    }
  }, [
    turn,
    mode,
    matchVictoryState,
    isThrowing,
    isRealOnlineMatch,
    shuffleOverlayState,
    showLeaveConfirmModal,
    redealArrangeState,
  ]);

  const triggerVictory = (winner: 'p1' | 'p2', letter: string) => {
    const potWon = mode === 'practice' ? 1000 : stake.potCoins;
    const isLocalWinner = winner === localActor;
    const xpEarned = isLocalWinner ? 150 : 40;
    if (isLocalWinner || mode === 'pass') {
      sound.playWinFanfare();
    } else {
      sound.playLoseSting();
    }
    setMatchVictoryState({
      winner,
      letter,
      potWon,
      xpEarned,
    });
  };

  const handleConfirmLeaveMatch = () => {
    sound.playClick(0.95);
    setShowLeaveConfirmModal(false);
    setIsThrowing(false);
    if (isRealOnlineMatch && onlineMatchId) {
      forfeitOnlineMatch(onlineMatchId, localActor, remoteActor);
    }
    onExitArena();
  };

  const executeTopCardThrow = (
    actor: 'p1' | 'p2',
    isAutoThrow: boolean = false
  ) => {
    if (
      isThrowing ||
      matchVictoryState ||
      shuffleOverlayState !== null ||
      showLeaveConfirmModal ||
      redealArrangeState !== null
    )
      return;
    if (isRealOnlineMatch && actor !== localActor) return;

    // 5. 3-MINUTE CONTINUOUS AFK / AUTO-THROW FORFEIT RULE:
    // Reset AFK timer to 0 immediately on any manual interaction; forfeit if purely auto-throwing for >= 3 mins (~7 throws)
    if (!isAutoThrow) {
      if (actor === 'p1') {
        setP1AfkSeconds(0);
        setP1ConsecutiveAutoThrows(0);
      } else {
        setP2AfkSeconds(0);
        setP2ConsecutiveAutoThrows(0);
      }
    } else {
      if (actor === 'p1') {
        const nextAfk = p1AfkSeconds + 25;
        const nextCount = p1ConsecutiveAutoThrows + 1;
        setP1AfkSeconds(nextAfk);
        setP1ConsecutiveAutoThrows(nextCount);

        if (nextAfk >= 180 || nextCount >= 7) {
          setIsThrowing(false);
          setRuleBanner(
            `⚠️ FORFEIT: ${player1Name} inactive for 3 minutes (7 auto-throws)! ${player2Name} wins with full payout!`
          );
          triggerVictory('p2', 'AFK_FORFEIT');
          if (isRealOnlineMatch && onlineMatchId) {
            pushOnlineCardThrow(
              onlineMatchId,
              'p1',
              p1Deck,
              centerPot,
              p1Deck[0] || { id: 'afk-1', letter: 'A', codeName: 'ALPHA', value: 1, owner: 'p1', thrownBy: 'player1' },
              false,
              'p2',
              { p1Bank, p2Bank }
            );
          }
          return;
        }
      } else {
        const nextAfk = p2AfkSeconds + 25;
        const nextCount = p2ConsecutiveAutoThrows + 1;
        setP2AfkSeconds(nextAfk);
        setP2ConsecutiveAutoThrows(nextCount);

        if (nextAfk >= 180 || nextCount >= 7) {
          setIsThrowing(false);
          setRuleBanner(
            `⚠️ FORFEIT: ${player2Name} inactive for 3 minutes (7 auto-throws)! ${player1Name} wins with full payout!`
          );
          triggerVictory('p1', 'AFK_FORFEIT');
          if (isRealOnlineMatch && onlineMatchId) {
            pushOnlineCardThrow(
              onlineMatchId,
              'p2',
              p2Deck,
              centerPot,
              p2Deck[0] || { id: 'afk-2', letter: 'A', codeName: 'ALPHA', value: 1, owner: 'p2', thrownBy: 'player2' },
              false,
              'p1',
              { p1Bank, p2Bank }
            );
          }
          return;
        }
      }
    }

    const activeDeck = actor === 'p1' ? p1Deck : p2Deck;
    if (activeDeck.length === 0) {
      const otherActor: 'p1' | 'p2' = actor === 'p1' ? 'p2' : 'p1';
      if (shouldTriggerNoMatchRedeal(p1Deck, p2Deck, centerPot)) {
        const { p1NewDeck, p2NewDeck } = computeReverseRedeal(
          p1Deck,
          p2Deck,
          p1Bank,
          p2Bank,
          centerPot,
          Math.random,
          true /* preserveOrderForManualArrange */
        );
        const nextR = roundNumber + 1;
        setP1Deck(p1NewDeck);
        setP2Deck(p2NewDeck);
        setP1Bank([]);
        setP2Bank([]);
        setCenterPot([]);
        setRoundNumber(nextR);
        triggerReverseRedealArrange(p1NewDeck, p2NewDeck, nextR, otherActor);
      } else {
        setTurn(otherActor);
        setTurnTimer(25);
      }
      return;
    }

    const rawOutcome = throwTopCard(activeDeck, centerPot);
    if (!rawOutcome) return;

    // 1. TRACK EACH PLAYER'S OWNERSHIP IN THE CENTER PILE (`thrownBy: 'player1' | 'player2'`)
    const taggedThrownCard: CardItem = {
      ...rawOutcome.thrownCard,
      owner: actor,
      thrownBy: actor === 'p1' ? 'player1' : 'player2',
    };
    const updatedPotWithOwner = [...centerPot, taggedThrownCard];

    setIsThrowing(true);
    sound.playCardSlide();

    // Hand card decrements as it is thrown
    if (actor === 'p1') {
      setP1Deck(rawOutcome.remainingDeck);
    } else {
      setP2Deck(rawOutcome.remainingDeck);
    }

    setFlyingCard({
      card: taggedThrownCard,
      actor,
      skin: actor === 'p1' ? selectedDeckSkin : opponentDeckSkin,
    });

    const now = Date.now();
    lastProcessedActionTimestampRef.current = now;

    setTimeout(() => {
      sound.playCardSlap();
      setFlyingCard(null);
      setPileBounce(true);
      setTimeout(() => setPileBounce(false), 240);

      const remP1 = actor === 'p1' ? rawOutcome.remainingDeck : p1Deck;
      const remP2 = actor === 'p2' ? rawOutcome.remainingDeck : p2Deck;
      const nextTurn: 'p1' | 'p2' = actor === 'p1' ? 'p2' : 'p1';

      if (rawOutcome.isConsecutiveMatch) {
        // 2. EXACT CARD TRANSFER WHEN A PILE IS WON (25 vs 15 RULE):
        // Winner takes ALL cards currently in `centerPile` and adds them directly to their deck!
        // Every card in `centerPile` that belonged to the loser is now transferred to the winner.
        // Example: Start 20 vs 20 -> P1 throws 5, P2 throws 5 & matches -> P2 gets 15 + 10 = 25 cards, P1 has 15 cards left!
        const actorName = actor === 'p1' ? player1Name : player2Name;
        const sweptCount = updatedPotWithOwner.length;
        const nextP1Deck =
          actor === 'p1'
            ? collectPotIntoDeck(remP1, updatedPotWithOwner, 'p1')
            : remP1;
        const nextP2Deck =
          actor === 'p2'
            ? collectPotIntoDeck(remP2, updatedPotWithOwner, 'p2')
            : remP2;

        setP1Deck(nextP1Deck);
        setP2Deck(nextP2Deck);
        setCenterPot([]);
        sound.playCoinChime(4);

        const nextP1Total = getPlayerTotalCardCount('p1', nextP1Deck, p1Bank, []);
        const nextP2Total = getPlayerTotalCardCount('p2', nextP2Deck, p2Bank, []);

        // 5. TRUE GAME OVER CONDITION:
        // The match ONLY ends when one player loses ALL their cards (Total Card Count reaches 0, and winner holds all cards)!
        if (nextP2Total === 0 || nextP1Total === 0) {
          const finalWinner: 'p1' | 'p2' = nextP2Total === 0 ? 'p1' : 'p2';
          const winnerName = finalWinner === 'p1' ? player1Name : player2Name;
          const loserName = finalWinner === 'p1' ? player2Name : player1Name;
          setIsThrowing(false);
          setRuleBanner(
            `🏆 ALL ${totalMatchCards} CARDS WON! ${loserName} has 0 cards left — ${winnerName} wins the Match!`
          );
          triggerVictory(finalWinner, taggedThrownCard.letter);

          if (isRealOnlineMatch && onlineMatchId) {
            pushOnlineCardThrow(
              onlineMatchId,
              actor,
              actor === 'p1' ? nextP1Deck : nextP2Deck,
              [],
              taggedThrownCard,
              true,
              finalWinner,
              {
                fullP1Deck: nextP1Deck,
                fullP2Deck: nextP2Deck,
                p1Score: nextP1Total,
                p2Score: nextP2Total,
              }
            );
          }
          return;
        }

        let activeNextTurn: 'p1' | 'p2' = nextTurn;
        if (nextP1Deck.length === 0) activeNextTurn = 'p2';
        else if (nextP2Deck.length === 0) activeNextTurn = 'p1';

        setRuleBanner(
          `⚡ SNAP MATCH! '${taggedThrownCard.letter}' on '${rawOutcome.previousTopCard?.letter}'! ${actorName} won +${sweptCount} pile cards! [${player1Name}: ${nextP1Total} vs ${player2Name}: ${nextP2Total}]`
        );
        setTurn(activeNextTurn);
        setTurnTimer(25);
        setIsThrowing(false);

        if (isRealOnlineMatch && onlineMatchId) {
          pushOnlineCardThrow(
            onlineMatchId,
            actor,
            actor === 'p1' ? nextP1Deck : nextP2Deck,
            [],
            taggedThrownCard,
            true,
            null,
            {
              fullP1Deck: nextP1Deck,
              fullP2Deck: nextP2Deck,
              nextTurn: activeNextTurn,
              roundNumber,
            }
          );
        }
      } else {
        // No match: card remains on the center pile
        const nextP1Total = getPlayerTotalCardCount(
          'p1',
          remP1,
          p1Bank,
          updatedPotWithOwner
        );
        const nextP2Total = getPlayerTotalCardCount(
          'p2',
          remP2,
          p2Bank,
          updatedPotWithOwner
        );

        // 3. PLAYING WITH UNEQUAL DECKS (15 vs 25) & NO-MATCH REVERSE / RE-DEAL:
        // If no match happens by the time the smaller deck (e.g., P1's 15 cards) runs out on the table
        // (and P2 has also thrown 15 cards while holding 10 extra cards in hand),
        // return the unmatched `centerPile` cards back to whoever threw them and shuffle each player's respective deck!
        if (shouldTriggerNoMatchRedeal(remP1, remP2, updatedPotWithOwner)) {
          if (nextP2Total === 0 || nextP1Total === 0) {
            const finalWinner: 'p1' | 'p2' = nextP2Total === 0 ? 'p1' : 'p2';
            setIsThrowing(false);
            triggerVictory(finalWinner, taggedThrownCard.letter);
            return;
          }

          const { p1NewDeck, p2NewDeck } = computeReverseRedeal(
            remP1,
            remP2,
            p1Bank,
            p2Bank,
            updatedPotWithOwner,
            Math.random,
            true /* preserveOrderForManualArrange */
          );
          const nextR = roundNumber + 1;
          setP1Deck(p1NewDeck);
          setP2Deck(p2NewDeck);
          setP1Bank([]);
          setP2Bank([]);
          setCenterPot([]);
          setRoundNumber(nextR);

          if (isRealOnlineMatch && onlineMatchId) {
            pushOnlineCardThrow(
              onlineMatchId,
              actor,
              rawOutcome.remainingDeck,
              [],
              taggedThrownCard,
              false,
              null,
              {
                p1Bank: [],
                p2Bank: [],
                fullP1Deck: p1NewDeck,
                fullP2Deck: p2NewDeck,
                isRedeal: true,
                nextTurn,
                roundNumber: nextR,
              }
            );
          }

          triggerReverseRedealArrange(p1NewDeck, p2NewDeck, nextR, nextTurn);
          return;
        }

        setCenterPot(updatedPotWithOwner);

        let activeNextTurn: 'p1' | 'p2' = nextTurn;
        if (remP1.length === 0) activeNextTurn = 'p2';
        else if (remP2.length === 0) activeNextTurn = 'p1';

        setTurn(activeNextTurn);
        setTurnTimer(25);
        setIsThrowing(false);

        if (isRealOnlineMatch && onlineMatchId) {
          pushOnlineCardThrow(
            onlineMatchId,
            actor,
            rawOutcome.remainingDeck,
            updatedPotWithOwner,
            taggedThrownCard,
            false,
            null,
            {
              p1Bank,
              p2Bank,
              nextTurn: activeNextTurn,
              roundNumber,
            }
          );
        } else if (actor === 'p2' && Math.random() > 0.5) {
          const botReactions: ReactionType[] = [
            'crown',
            'flame',
            'gem',
            'sparkles',
          ];
          setP2Reaction(
            botReactions[Math.floor(Math.random() * botReactions.length)]
          );
        }
      }
    }, 360);
  };

  const handleSendReaction = (reaction: ReactionType) => {
    sound.playClick(1.25);
    setP1Reaction(reaction);
    setTimeout(() => setP1Reaction(null), 2400);

    if (isRealOnlineMatch && onlineMatchId) {
      pushOnlineSocialAction(onlineMatchId, localActor, 'reaction', reaction);
    }
  };

  const handleSendChatMessage = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    sound.playChatPing();
    setP1ChatBubble(clean);
    setCustomChatInput('');
    setChatDrawerOpen(false);

    setTimeout(() => {
      setP1ChatBubble((prev) => (prev === clean ? null : prev));
    }, 3600);

    if (isRealOnlineMatch && onlineMatchId) {
      pushOnlineSocialAction(onlineMatchId, localActor, 'chat', clean);
    } else if (mode !== 'pass') {
      setTimeout(() => {
        const reply =
          BOT_CHAT_REPLIES[Math.floor(Math.random() * BOT_CHAT_REPLIES.length)];
        sound.playChatPing();
        setP2ChatBubble(reply);
        setTimeout(() => {
          setP2ChatBubble((prev) => (prev === reply ? null : prev));
        }, 3400);
      }, 950);
    }
  };

  const topPotCard =
    centerPot.length > 0 ? centerPot[centerPot.length - 1] : null;
  const previousPotCard =
    centerPot.length > 1 ? centerPot[centerPot.length - 2] : null;
  const nextLocalTopCard = localDeck[0] || null;
  const isSnapReady =
    isMyTurn &&
    topPotCard !== null &&
    nextLocalTopCard !== null &&
    topPotCard.letter === nextLocalTopCard.letter;

  // Natural rotation angles for the single 3D Center Pile
  const pileAngles = [
    '-rotate-6',
    'rotate-3',
    '-rotate-2',
    'rotate-6',
    '-rotate-3',
  ];
  const visiblePileCards = centerPot.slice(-3);

  return (
    <div className="relative flex flex-col justify-between w-full h-full px-3 py-2 select-none overflow-hidden">
      {/* 1. TOP BAR: TOP-LEFT EXIT / LEAVE MATCH BUTTON + OPPONENT AVATAR + ADJACENT 3D FACE-DOWN STACK */}
      <header className="relative z-30 px-2.5 py-2 rounded-2xl bg-obsidian-panel border-gold-metallic flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* 4. TOP-LEFT EXIT / LEAVE MATCH BUTTON (DOOR / BACK ICON) */}
          <button
            type="button"
            onClick={() => {
              sound.playClick(1.1);
              setShowLeaveConfirmModal(true);
            }}
            aria-label="Exit / Leave Match"
            className="px-2 py-1.5 rounded-xl bg-red-950/85 hover:bg-red-900/90 border border-red-500/60 text-red-100 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform shrink-0 shadow"
          >
            <LogOut className="w-3.5 h-3.5 text-red-300 rotate-180" />
            <span className="font-display font-black text-[8px] uppercase tracking-wider leading-none">
              Exit
            </span>
          </button>

          <div className="relative shrink-0">
            <RoyalAvatar
              avatarId={remoteAvatarId}
              size="md"
              levelBadge={remoteLevel}
            />
            {p2Reaction && (
              <span
                aria-label="Opponent Reaction"
                className="absolute -right-1 -top-1 z-30 w-5 h-5 rounded-full bg-black/95 border border-amber-400 flex items-center justify-center shadow-lg animate-bounce"
              >
                <ReactionBadgeIcon type={p2Reaction} className="w-3 h-3 text-[#f5b041]" />
              </span>
            )}
          </div>

          {/* Opponent 3D Face-Down Stack right near Avatar (Uses Opponent's Equipped Skin) */}
          <button
            type="button"
            disabled={!(mode === 'pass' && turn === 'p2') || isThrowing}
            onClick={() => {
              if (mode === 'pass' && turn === 'p2') {
                executeTopCardThrow('p2');
              }
            }}
            aria-label={`Opponent 3D Deck Stack (${remoteDeck.length} cards)`}
            className={`relative shrink-0 transition-transform ${
              mode === 'pass' && turn === 'p2'
                ? 'cursor-pointer ring-2 ring-amber-300 rounded-lg active:scale-95'
                : 'cursor-default'
            }`}
          >
            <div className="absolute -bottom-1.5 -right-1.5 w-12 h-[68px] rounded-lg bg-amber-950 border border-amber-500/40" />
            <div className="absolute -bottom-0.5 -right-0.5 w-12 h-[68px] rounded-lg bg-amber-900/80 border border-amber-400/50" />
            <Card3D faceDown skin={remoteSkin} size="xs" />
            <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/85 border border-amber-400/60 font-mono-num text-[9px] font-black text-[#ffe082]">
              {remoteDeck.length}
            </span>
          </button>

          {/* Opponent Name, Skin Badge & Turn Indicator */}
          <div className="min-w-0">
            <span className="font-display font-extrabold text-xs text-[#fde68a] truncate block">
              {remoteName}
            </span>
            <span className="text-[8.5px] font-mono-num text-amber-200/75 truncate block">
              Deck: {remoteSkin.name}
            </span>
            <div className="mt-0.5 flex items-center gap-1 flex-wrap">
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono-num font-bold whitespace-nowrap ${
                  turn === remoteActor
                    ? 'bg-amber-500/25 border border-amber-400 text-amber-200 animate-pulse'
                    : 'bg-black/60 border border-amber-500/25 text-emerald-300'
                }`}
              >
                {turn === remoteActor
                  ? `OPPONENT TURN • ${turnTimer}s`
                  : `Deck: ${remoteDeck.length}`}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-num font-extrabold bg-amber-500/20 border border-amber-400/40 text-[#ffe082]">
                Total: {remoteTotalCards} Cards
              </span>
              {remoteAfkThrows > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-mono-num font-bold bg-red-950/80 border border-red-500/50 text-red-200 animate-pulse">
                  ⚠️ AFK: {remoteAfkThrows}/7
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Opponent Animated Speech Bubble */}
        <AnimatePresence>
          {p2ChatBubble && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.85 }}
              role="status"
              aria-label={`Opponent message: ${p2ChatBubble}`}
              className="absolute -bottom-7 left-16 z-40 px-3 py-1 rounded-2xl rounded-tl-none bg-gradient-to-r from-amber-950 via-black to-amber-950 border border-[#f5b041] text-[#ffe082] text-[10px] font-bold shadow-[0_6px_16px_rgba(0,0,0,0.9)] flex items-center gap-1.5 whitespace-nowrap"
            >
              <MessageSquare className="w-3 h-3 text-[#f5b041] shrink-0" />
              <span>{p2ChatBubble}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Live Status Bar */}
      <div className="my-1 px-3 py-1 rounded-xl bg-black/65 border border-amber-500/30 flex items-center justify-between text-[10px]">
        <span className="text-amber-200/90 font-medium truncate flex-1 mr-2">
          {ruleBanner}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-mono-num font-bold text-emerald-300 bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-400/35">
            R{roundNumber}
          </span>
          <span className="font-mono-num font-bold text-[#ffe082] flex items-center gap-1">
            <Layers className="w-3 h-3 text-[#f5b041]" />
            <span>Pile: {centerPot.length}</span>
          </span>
          <span className="font-mono-num font-bold text-amber-200/95 flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded border border-amber-500/25">
            <Clock className="w-3 h-3 text-[#f5b041]" />
            <span>
              {Math.floor(elapsedSeconds / 60)}:
              {(elapsedSeconds % 60).toString().padStart(2, '0')}
            </span>
          </span>
        </div>
      </div>

      {/* 2. CENTER 3D VELVET TABLE ARENA (SINGLE REALISTIC 3D CENTER PILE + 3D FLYING THROW + 60FPS SHUFFLE) */}
      <main
        aria-label="3D Velvet Casino Arena"
        className="relative flex-1 my-1 flex items-center justify-center perspective-1000"
      >
        {/* Left & Right Brass Handles */}
        <div
          className="absolute left-0 w-3.5 h-20 rounded-l-lg z-0"
          style={{
            background:
              'linear-gradient(180deg, #ffe082 0%, #b7791f 50%, #5c3b05 100%)',
            border: '1px solid #fff3c4',
          }}
        />
        <div
          className="absolute right-0 w-3.5 h-20 rounded-r-lg z-0"
          style={{
            background:
              'linear-gradient(180deg, #ffe082 0%, #b7791f 50%, #5c3b05 100%)',
            border: '1px solid #fff3c4',
          }}
        />

        {/* 3D Golden Rim Oval Arena Table */}
        <div
          className="relative z-10 w-[96%] h-full max-h-[275px] rounded-[46px] p-3 flex flex-col items-center justify-between"
          style={{
            background: selectedTable.rimGradient,
            boxShadow: `0 16px 34px rgba(0,0,0,0.92), 0 5px 0 #5c3b05, 0 0 28px ${selectedTable.glowRgba}, inset 0 2px 3px rgba(255,255,255,0.75)`,
          }}
        >
          <div
            className="relative w-full h-full rounded-[38px] p-3 flex flex-col items-center justify-between overflow-hidden"
            style={{
              background: selectedTable.feltGradient,
              border: '2px solid #3d2604',
              boxShadow: 'inset 0 8px 24px rgba(0, 0, 0, 0.8)',
            }}
          >
            {/* 60FPS GPU-Accelerated Shuffle Overlay (Match Start & Reverse/Re-deal) */}
            {shuffleOverlayState && (
              <ArenaShuffleOverlay
                skin={localSkin}
                title={shuffleOverlayState.title}
                subtitle={shuffleOverlayState.subtitle}
              />
            )}

            {/* Inner Gold Dashed Ring */}
            <div
              className="absolute inset-3 rounded-[30px] pointer-events-none opacity-40"
              style={{
                border: `1.5px dashed ${selectedTable.innerRingHex}`,
              }}
            />

            {/* Top Pot Header Inside Table */}
            <div className="relative z-10 px-3 py-1 rounded-full bg-black/70 border border-[#f5b041] flex items-center gap-2 shadow">
              <Coins className="w-3.5 h-3.5 text-[#f5b041]" />
              <span className="font-display font-black text-[10px] text-[#f5b041] tracking-wider">
                2X WINNER POT
              </span>
              <span className="font-mono-num text-xs font-extrabold text-[#ffe082]">
                {mode === 'practice'
                  ? '1,000 (+XP)'
                  : `${stake.potFormatted} COINS`}
              </span>
            </div>

            {/* ONE SINGLE REALISTIC 3D CENTER PILE */}
            <div className="relative z-20 flex flex-col items-center justify-center my-auto">
              {/* Tiny Badge Showing Previous Card Underneath */}
              {previousPotCard && (
                <div className="mb-1.5 px-2.5 py-0.5 rounded-full bg-black/80 border border-amber-400/60 text-[9px] font-mono-num font-bold text-amber-200 shadow-md flex items-center gap-1">
                  <span>Underneath:</span>
                  <strong className="text-[#ffe082]">
                    {previousPotCard.letter} ({previousPotCard.codeName})
                  </strong>
                </div>
              )}

              {/* Single 3D Stacked Center Pile */}
              <div
                className={`relative w-24 h-32 flex items-center justify-center transition-transform duration-200 ${
                  pileBounce ? 'scale-110' : 'scale-100'
                }`}
              >
                {visiblePileCards.length > 0 ? (
                  visiblePileCards.map((card, idx) => {
                    const isTop = idx === visiblePileCards.length - 1;
                    const angleClass =
                      pileAngles[
                        (centerPot.length - visiblePileCards.length + idx) %
                          pileAngles.length
                      ];
                    const isMatchingUnderneath =
                      isTop &&
                      previousPotCard !== null &&
                      previousPotCard.letter === card.letter;

                    // Strictly render each thrown card using its owner's equipped Deck Skin!
                    const cardSkin =
                      card.owner === 'p2' ? opponentDeckSkin : selectedDeckSkin;

                    return (
                      <div
                        key={`${card.id}-${idx}`}
                        className={`absolute transition-all duration-200 ${angleClass}`}
                        style={{
                          zIndex: 10 + idx,
                        }}
                      >
                        <Card3D
                          letter={card.letter}
                          codeName={card.codeName}
                          skin={cardSkin}
                          customPhotoUrl={
                            card.owner === 'p1' ? customPhotoUrl : null
                          }
                          size="md"
                          glowMatch={isMatchingUnderneath}
                        />
                      </div>
                    );
                  })
                ) : (
                  <div className="w-20 h-[114px] rounded-xl border-2 border-dashed border-amber-400/55 bg-black/35 flex flex-col items-center justify-center text-center p-2">
                    <Layers className="w-6 h-6 text-[#f5b041] opacity-80" />
                    <span className="mt-1 text-[9px] font-display font-bold text-amber-200/80">
                      Center Pot Pile
                    </span>
                  </div>
                )}

                {/* 3D FLYING CARD THROW ANIMATION (Mid-air 3D flip + motion trail from Deck Stack to Center Pile) */}
                <AnimatePresence>
                  {flyingCard && (
                    <motion.div
                      key={`flying-${flyingCard.card.id}`}
                      initial={{
                        x: flyingCard.actor === 'p1' ? 88 : -72,
                        y: flyingCard.actor === 'p1' ? 175 : -175,
                        scale: 0.52,
                        rotateX: flyingCard.actor === 'p1' ? 55 : -55,
                        rotateY: 180,
                        rotateZ: flyingCard.actor === 'p1' ? -22 : 22,
                      }}
                      animate={{
                        x: 0,
                        y: 0,
                        scale: [0.52, 1.24, 1.04],
                        rotateX: 0,
                        rotateY: 0,
                        rotateZ: flyingCard.actor === 'p1' ? -4 : 4,
                      }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: 0.35,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="absolute z-50 pointer-events-none"
                      style={{
                        filter:
                          'drop-shadow(0 18px 24px rgba(0,0,0,0.9)) drop-shadow(0 0 22px rgba(245,176,65,0.85))',
                      }}
                    >
                      <Card3D
                        letter={flyingCard.card.letter}
                        codeName={flyingCard.card.codeName}
                        skin={flyingCard.skin}
                        customPhotoUrl={
                          flyingCard.actor === 'p1' ? customPhotoUrl : null
                        }
                        size="md"
                        glowMatch
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Bottom Match Rule Hint Inside Table */}
            <div className="relative z-10 text-center">
              {isSnapReady ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-black font-mono-num font-black text-[10px] shadow inline-flex items-center gap-1 animate-pulse">
                  <Zap className="w-3 h-3 fill-black text-black" />
                  <span>
                    SNAP MATCH READY! Throw Top Card ({nextLocalTopCard?.letter}) to BANK PILE!
                  </span>
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-amber-100/85">
                  Match consecutive letters ({topPotCard?.letter || 'K'} on{' '}
                  {topPotCard?.letter || 'K'}) to bank pile • Win all {totalMatchCards} cards!
                </span>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 3. BOTTOM ZONE: PLAYER AVATAR + SPEECH BUBBLE + 3D STACK THROW + LIVE IN-GAME CHAT */}
      <footer className="relative z-30 px-3 py-2 rounded-2xl bg-obsidian-panel border-gold-metallic flex flex-col gap-1.5">
        {/* Player 1 Animated Speech Bubble */}
        <AnimatePresence>
          {p1ChatBubble && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.85 }}
              role="status"
              aria-label={`Player message: ${p1ChatBubble}`}
              className="absolute -top-8 left-14 z-40 px-3 py-1 rounded-2xl rounded-bl-none bg-gradient-to-r from-emerald-950 via-black to-emerald-950 border border-emerald-400 text-[#ffe082] text-[10px] font-bold shadow-[0_6px_16px_rgba(0,0,0,0.9)] flex items-center gap-1.5 whitespace-nowrap"
            >
              <MessageSquare className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>{p1ChatBubble}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Slide-Up Live Chat Drawer */}
        <AnimatePresence>
          {chatDrawerOpen && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="p-2.5 rounded-2xl bg-black/95 border border-[#f5b041] space-y-2 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-display font-extrabold text-[#ffe082] uppercase tracking-wider flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-[#f5b041]" />
                  <span>Live Match Chat with {player2Name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setChatDrawerOpen(false)}
                  aria-label="Close Chat Drawer"
                  className="text-amber-300 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Phrase Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {QUICK_CHAT_PHRASES.map((phrase) => (
                  <button
                    key={phrase}
                    type="button"
                    onClick={() => handleSendChatMessage(phrase)}
                    className="px-2 py-1 rounded-lg bg-emerald-950/90 border border-emerald-400/50 text-emerald-100 text-[9.5px] font-bold whitespace-nowrap shrink-0 active:scale-95"
                  >
                    {phrase}
                  </button>
                ))}
              </div>

              {/* Custom Message Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChatMessage(customChatInput);
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={customChatInput}
                  onChange={(e) => setCustomChatInput(e.target.value)}
                  placeholder="Type message to opponent..."
                  aria-label="Type message to opponent"
                  maxLength={48}
                  className="flex-1 min-w-0 px-2.5 py-1.5 rounded-xl bg-black border border-amber-500/40 text-xs text-white placeholder:text-amber-200/40 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl btn-3d-gold text-[10px] font-display font-black flex items-center gap-1 shrink-0 active:scale-95"
                >
                  <Send className="w-3 h-3 text-[#1c1102]" />
                  <span>Send</span>
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between gap-2">
          {/* Left: Player Avatar & Stacked Name + Equipped Skin + Turn Timer */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative shrink-0">
              <RoyalAvatar
                avatarId={localAvatarId}
                size="md"
                levelBadge={localLevel}
              />
              {p1Reaction && (
                <span
                  aria-label="Player Reaction"
                  className="absolute -right-1 -top-1 z-30 w-5 h-5 rounded-full bg-black/95 border border-amber-400 flex items-center justify-center shadow-lg animate-bounce"
                >
                  <ReactionBadgeIcon type={p1Reaction} className="w-3 h-3 text-[#f5b041]" />
                </span>
              )}
            </div>

            <div className="min-w-0 flex flex-col items-start">
              <span className="font-display font-extrabold text-xs text-[#fde68a] truncate max-w-[125px]">
                {localName}
              </span>
              <span className="text-[8.5px] font-mono-num text-emerald-300/90 truncate max-w-[125px]">
                {localSkin.name}
              </span>
              <div className="mt-0.5 flex items-center gap-1 flex-wrap">
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono-num font-bold whitespace-nowrap ${
                    isMyTurn
                      ? 'bg-emerald-500/25 border border-emerald-400 text-emerald-300 animate-pulse'
                      : 'bg-black/60 border border-amber-500/25 text-amber-200/80'
                  }`}
                >
                  {isMyTurn
                    ? `YOUR TURN • ${turnTimer}s`
                    : `Deck: ${localDeck.length}`}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-num font-extrabold bg-royal-gold/20 border border-amber-400/40 text-[#ffe082]">
                  Total: {localTotalCards} Cards
                </span>
                {localAfkThrows > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-mono-num font-bold bg-red-950/80 border border-red-500/50 text-red-200 animate-pulse">
                    ⚠️ AFK: {localAfkThrows}/7
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Interactive 3D Face-Down Card Deck Stack + Tap/Swipe Throw Action */}
          <button
            type="button"
            disabled={
              !isMyTurn ||
              isThrowing ||
              localDeck.length === 0 ||
              shuffleOverlayState !== null ||
              redealArrangeState !== null
            }
            onTouchStart={(e) => {
              touchStartYRef.current = e.touches[0]?.clientY ?? null;
            }}
            onTouchEnd={(e) => {
              const endY = e.changedTouches[0]?.clientY ?? null;
              if (
                touchStartYRef.current !== null &&
                endY !== null &&
                touchStartYRef.current - endY > 20 &&
                isMyTurn
              ) {
                executeTopCardThrow(localActor);
              }
              touchStartYRef.current = null;
            }}
            onClick={() => executeTopCardThrow(localActor)}
            className={`px-2.5 py-1.5 rounded-2xl flex items-center gap-2 active:scale-95 transition-all shrink-0 ${
              isMyTurn && shuffleOverlayState === null && redealArrangeState === null
                ? 'btn-3d-gold shadow-[0_0_20px_rgba(245,176,65,0.5)]'
                : 'bg-zinc-900/90 border border-zinc-700 text-zinc-400 cursor-not-allowed'
            }`}
          >
            {/* 3D Layered Face-Down Deck Stack Graphic */}
            <div className="relative w-9 h-12 shrink-0">
              <div className="absolute -bottom-1 -right-1 w-9 h-12 rounded-md bg-amber-950 border border-amber-400/60" />
              <div className="absolute -bottom-0.5 -right-0.5 w-9 h-12 rounded-md bg-amber-900 border border-amber-400/70" />
              <div
                className="absolute inset-0 rounded-md border flex flex-col items-center justify-center"
                style={{
                  background: localSkin.bgGradient,
                  borderColor: localSkin.borderHex,
                  color: localSkin.textHex,
                }}
              >
                <span className="text-[7px] font-bold opacity-80 leading-none">
                  DECK
                </span>
                <span className="font-mono-num text-[10px] font-black leading-tight">
                  {localDeck.length}
                </span>
              </div>
            </div>

            <div className="text-left leading-tight pr-0.5">
              <div className="flex items-center gap-1 font-display font-black text-[11px]">
                <ArrowUp className="w-3.5 h-3.5" />
                <span>THROW TOP CARD</span>
              </div>
              <div className="text-[9px] font-mono-num font-bold opacity-90">
                Top #1: {nextLocalTopCard?.letter || '-'} ({nextLocalTopCard?.codeName || 'READY'})
              </div>
            </div>
          </button>
        </div>

        {/* Bottom Live Chat Button + Pure SVG Reaction Bar */}
        <div className="flex items-center justify-between pt-1 border-t border-amber-500/20 gap-1.5">
          <button
            type="button"
            onClick={() => {
              sound.playClick(1.15);
              setChatDrawerOpen((prev) => !prev);
            }}
            aria-label="Toggle Live Match Chat"
            className={`px-2.5 py-1 rounded-lg border text-[10px] font-display font-extrabold flex items-center gap-1 active:scale-95 transition-all shrink-0 ${
              chatDrawerOpen
                ? 'btn-3d-gold text-[#1c1102]'
                : 'bg-emerald-950/85 border-emerald-400/60 text-emerald-200'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>Live Chat</span>
          </button>

          <div className="flex items-center gap-1">
            {REACTION_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSendReaction(item.id)}
                aria-label={`Send reaction ${item.label}`}
                className="w-7 h-6 rounded-lg bg-black/65 border border-amber-500/35 hover:border-amber-400 flex items-center justify-center active:scale-95 transition-transform"
              >
                <ReactionBadgeIcon type={item.id} />
              </button>
            ))}
          </div>
        </div>
      </footer>

      {/* 4. 20-SECOND "SET YOUR CARD ORDER (अपने पत्ते सेट करें)" REVERSE RE-DEAL MODAL */}
      {redealArrangeState && !matchVictoryState && (
        <ReverseRedealArrangeModal
          roundNumber={redealArrangeState.roundNumber}
          playerName={
            redealArrangeState.activeStage === 'p1' ? player1Name : player2Name
          }
          opponentName={
            redealArrangeState.activeStage === 'p1' ? player2Name : player1Name
          }
          playerCards={
            redealArrangeState.activeStage === 'p1'
              ? redealArrangeState.p1Pool
              : redealArrangeState.p2Pool
          }
          opponentCardCount={
            redealArrangeState.activeStage === 'p1'
              ? redealArrangeState.p2Pool.length
              : redealArrangeState.p1Pool.length
          }
          deckSkin={
            redealArrangeState.activeStage === 'p1'
              ? selectedDeckSkin
              : opponentDeckSkin
          }
          customPhotoUrl={
            redealArrangeState.activeStage === 'p1' ? customPhotoUrl : null
          }
          isPassAndPlaySecondStage={
            mode === 'pass' && redealArrangeState.activeStage === 'p2'
          }
          onConfirmOrder={handleConfirmRedealArrange}
        />
      )}

      {/* 4A. LEAVE / FORFEIT MATCH CONFIRMATION MODAL */}
      {showLeaveConfirmModal && !matchVictoryState && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Leave Match Confirmation"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-[360px] p-5 rounded-3xl bg-obsidian-panel border-gold-glow text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-red-950/90 border border-red-500/60 flex items-center justify-center shadow-lg">
              <LogOut className="w-6 h-6 text-red-300 rotate-180" />
            </div>

            <div className="space-y-1.5">
              <h2 className="font-display font-black text-xl text-[#ffe082]">
                Leave Match?
              </h2>
              <p className="text-xs text-amber-100/90 leading-relaxed">
                If you leave now, you will forfeit the match and lose your entry bet.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  sound.playClick(1.1);
                  setShowLeaveConfirmModal(false);
                }}
                className="py-2.5 px-3 rounded-2xl btn-3d-emerald font-display font-black text-xs tracking-wider uppercase active:scale-95 transition-transform"
              >
                Stay &amp; Play
              </button>
              <button
                type="button"
                onClick={handleConfirmLeaveMatch}
                className="py-2.5 px-3 rounded-2xl bg-gradient-to-b from-red-600 to-red-800 border border-red-400 text-white font-display font-black text-xs tracking-wider uppercase shadow-lg active:scale-95 transition-transform"
              >
                Leave Match
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4B. 3D GOLD COIN EXPLOSION & VICTORY / PAYOUT MODAL */}
      {matchVictoryState && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Match Victory Result"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
        >
          {/* Floating 3D Gold Coins Burst */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
            {Array.from({ length: 18 }).map((_, idx) => {
              const angle = (idx / 18) * 360;
              const dist = 90 + (idx % 3) * 45;
              const tx = Math.cos((angle * Math.PI) / 180) * dist;
              const ty = Math.sin((angle * Math.PI) / 180) * dist;
              return (
                <div
                  key={idx}
                  className="absolute w-7 h-7 rounded-full bg-royal-gold border-2 border-white flex items-center justify-center shadow-[0_0_16px_rgba(245,176,65,0.95)] transition-transform duration-700"
                  style={{
                    transform: `translate(${tx}px, ${ty}px) rotate(${idx * 25}deg)`,
                  }}
                >
                  <Coins className="w-3.5 h-3.5 text-[#1c1102]" />
                </div>
              );
            })}
          </div>

          <div className="relative z-10 w-full max-w-[380px] p-5 rounded-3xl bg-obsidian-panel border-gold-glow text-center space-y-4 shadow-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-royal-gold text-[#1c1102] font-display font-black text-[11px] tracking-widest uppercase shadow">
              <Crown className="w-3.5 h-3.5 text-[#1c1102]" />
              <span>
                {matchVictoryState.letter === 'AFK_FORFEIT'
                  ? '3-MINUTE AFK FORFEIT VICTORY'
                  : matchVictoryState.letter === 'OPPONENT_FORFEIT'
                  ? 'OPPONENT FORFEITED MATCH'
                  : matchVictoryState.winner === localActor
                  ? 'ALL CARDS WON • MATCH VICTORY!'
                  : mode === 'pass'
                  ? `${player2Name.toUpperCase()} WINS ALL CARDS!`
                  : 'OPPONENT WON ALL CARDS'}
              </span>
            </div>

            <h2 className="font-display font-black text-xl text-[#ffe082] drop-shadow">
              {matchVictoryState.letter === 'AFK_FORFEIT'
                ? 'Opponent Inactive for 3 Minutes (Forfeit)'
                : matchVictoryState.letter === 'OPPONENT_FORFEIT'
                ? 'Opponent Left the Match (Full Payout)'
                : `Total Deck Sweep (${totalMatchCards} Total Cards • ${roundNumber} Round${roundNumber > 1 ? 's' : ''})`}
            </h2>

            {/* Card Bank Summary Box */}
            <div className="py-2 px-3 rounded-2xl bg-black/60 border border-amber-500/30 flex items-center justify-around text-xs font-mono-num font-bold">
              <div className="text-center">
                <span className="text-[10px] text-amber-200/80 block uppercase truncate max-w-[120px]">
                  {player1Name}
                </span>
                <span className="text-base text-[#ffe082] font-black">
                  {p1TotalCards} Cards
                </span>
              </div>
              <span className="text-amber-500/60 font-black text-sm">VS</span>
              <div className="text-center">
                <span className="text-[10px] text-amber-200/80 block uppercase truncate max-w-[120px]">
                  {player2Name}
                </span>
                <span className="text-base text-[#ffe082] font-black">
                  {p2TotalCards} Cards
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-2xl bg-black/70 border border-amber-500/40">
                <p className="text-[10px] text-amber-200/80 font-bold uppercase">
                  2X Coin Pot Payout
                </p>
                <p className="mt-0.5 font-mono-num font-black text-base text-[#ffe082]">
                  {matchVictoryState.winner === localActor
                    ? `+${formatCoins(matchVictoryState.potWon)} Coins`
                    : '0 Coins'}
                </p>
              </div>
              <div className="p-2.5 rounded-2xl bg-black/70 border border-emerald-500/40">
                <p className="text-[10px] text-emerald-200/80 font-bold uppercase">
                  Royal Level XP
                </p>
                <p className="mt-0.5 font-mono-num font-black text-base text-emerald-300">
                  +{matchVictoryState.xpEarned} XP
                </p>
              </div>
            </div>

            <button
              type="button"
              data-start="true"
              onClick={() => {
                sound.playCoinChime(6);
                onMatchComplete(
                  matchVictoryState.winner,
                  matchVictoryState.letter,
                  matchVictoryState.potWon,
                  matchVictoryState.xpEarned
                );
              }}
              className="w-full py-3 rounded-2xl btn-3d-gold font-display font-black text-sm tracking-wider flex items-center justify-center gap-2 active:scale-95"
            >
              <Trophy className="w-4 h-4 text-[#1c1102]" />
              <span>RETURN TO LOBBY &amp; COLLECT POT</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
