import React, { useEffect, useState } from 'react';
import { ArrowUpDown, Clock, Crown, Lock, Shuffle, Sparkles, X } from 'lucide-react';
import { motion } from 'motion/react';
import { DeckSkin, StakeOption, THIRTY_DECK_SKINS } from '../game/data';
import {
  CardItem,
  moveDeckCard,
  riffleShuffleDeck,
  swapDeckCards,
} from '../game/rules';
import { sound } from '../utils/sound';
import { Card3D } from './Card3D';
import { GameMode } from './HomeScreen';

const SHUFFLE_STACK_LETTERS = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5'];

/**
 * Ultra-smooth 60FPS GPU-accelerated Casino Riffle Shuffle Theater Overlay.
 * Limits the animated shuffle stack to 10 lightweight DOM card elements with
 * pure translate3d/rotateZ transforms and staggered cubic-bezier(0.22, 1, 0.36, 1) transitions.
 */
const RiffleShuffleOverlay: React.FC<{
  activeDeckSkin: DeckSkin;
  phase: 'split' | 'riffle' | 'bridge' | 'gather';
}> = ({ activeDeckSkin, phase }) => {
  return (
    <div
      role="status"
      aria-label="Casino 3D Riffle Shuffle in progress"
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto select-none perspective-1000 animate-fadeIn"
    >
      <div className="relative w-72 h-56 flex items-center justify-center perspective-1000">
        {SHUFFLE_STACK_LETTERS.map((letter, i) => {
          const isLeft = i % 2 === 0;
          const pairIdx = Math.floor(i / 2);

          let transform = 'translate3d(0, 0, 0) rotateZ(0deg)';
          if (phase === 'split') {
            transform = isLeft
              ? `translate3d(-54px, ${(pairIdx - 2) * 5}px, ${i * 3}px) rotateZ(-12deg) rotateY(16deg)`
              : `translate3d(54px, ${(pairIdx - 2) * 5}px, ${i * 3}px) rotateZ(12deg) rotateY(-16deg)`;
          } else if (phase === 'riffle') {
            const xOffset = isLeft ? -10 : 10;
            const yOffset = -18 + i * 4;
            const zOffset = i * 5;
            const zRot = isLeft ? -4 : 4;
            transform = `translate3d(${xOffset}px, ${yOffset}px, ${zOffset}px) rotateZ(${zRot}deg) rotateX(14deg)`;
          } else if (phase === 'bridge') {
            const yArch = -Math.sin((i / 9) * Math.PI) * 16;
            transform = `translate3d(0, ${yArch}px, ${i * 4}px) rotateZ(${(i - 4.5) * 1.5}deg) scale(1.02)`;
          } else if (phase === 'gather') {
            transform = `translate3d(0, ${(i - 5) * 1.5}px, ${i * 3}px) rotateZ(0deg)`;
          }

          return (
            <div
              key={i}
              className="absolute w-20 h-32 rounded-xl border-2 shadow-[0_8px_20px_rgba(0,0,0,0.85)] flex flex-col justify-between p-2 pointer-events-none"
              style={{
                background: activeDeckSkin.bgGradient,
                borderColor: activeDeckSkin.borderHex,
                boxShadow: `0 8px 24px rgba(0,0,0,0.7), ${activeDeckSkin.accentHex} 0px 0px 14px`,
                transform,
                transition:
                  phase === 'riffle'
                    ? `transform 0.32s cubic-bezier(0.22, 1, 0.36, 1) ${i * 22}ms`
                    : 'transform 0.26s cubic-bezier(0.22, 1, 0.36, 1)',
                willChange: 'transform',
                zIndex: i + 10,
              }}
            >
              <div className="flex justify-between items-center text-[10px] font-mono-num font-black text-[#ffe082]">
                <span>{letter}</span>
                <Crown className="w-3 h-3 text-[#f5b041]" />
              </div>
              <div className="flex items-center justify-center font-display font-black text-2xl text-[#ffe082] drop-shadow-md">
                {letter}
              </div>
              <div className="flex justify-between items-center text-[8px] font-mono-num text-amber-200/80">
                <span>#{i + 1}</span>
                <span className="truncate max-w-[48px] text-[7.5px] font-bold">
                  {activeDeckSkin.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 px-4 py-1.5 rounded-full bg-black/85 border border-[#f5b041] flex items-center gap-2 shadow-lg">
        <Sparkles className="w-4 h-4 text-[#f5b041] animate-spin" />
        <span className="text-[11px] font-display font-black tracking-wider text-[#ffe082] uppercase">
          {phase === 'split' && 'Splitting Royal Pack...'}
          {phase === 'riffle' && 'Interleaving 10-Card Riffle...'}
          {phase === 'bridge' && 'Bridging Casino Cascade...'}
          {phase === 'gather' && 'Deck Squared & Ready!'}
        </span>
      </div>
    </div>
  );
};

interface ArrangeScreenProps {
  mode: GameMode;
  stake: StakeOption;
  deckSize: number;
  player1Name: string;
  player2Name: string;
  selectedDeckSkin: DeckSkin;
  opponentDeckSkin?: DeckSkin;
  customPhotoUrl: string | null;
  initialP1Deck: CardItem[];
  initialP2Deck: CardItem[];
  myRole?: 'p1' | 'p2';
  onLockAndStartMatch: (
    p1OrderedDeck: CardItem[],
    p2OrderedDeck: CardItem[]
  ) => void;
  onOpponentTimeoutWin: () => void;
  onCancelToHome: () => void;
}

export const ArrangeScreen: React.FC<ArrangeScreenProps> = ({
  mode,
  stake,
  deckSize,
  player1Name,
  player2Name,
  selectedDeckSkin,
  opponentDeckSkin = THIRTY_DECK_SKINS[1],
  customPhotoUrl,
  initialP1Deck,
  initialP2Deck,
  myRole = 'p1',
  onLockAndStartMatch,
  onOpponentTimeoutWin,
  onCancelToHome,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [activePlayerStage, setActivePlayerStage] = useState<'p1' | 'p2'>(myRole || 'p1');
  const [p1Deck, setP1Deck] = useState<CardItem[]>(initialP1Deck);
  const [p2Deck, setP2Deck] = useState<CardItem[]>(initialP2Deck);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // 3D Riffle Shuffle & Flying Card Swap animation states
  const [isShuffling, setIsShuffling] = useState(false);
  const [shufflePhase, setShufflePhase] = useState<'split' | 'riffle' | 'bridge' | 'gather'>('split');
  const [shuffleCount, setShuffleCount] = useState(0);
  const [recentSwappedIds, setRecentSwappedIds] = useState<string[]>([]);
  const [swapBannerText, setSwapBannerText] = useState<string | null>(null);

  const currentDeck = activePlayerStage === 'p1' ? p1Deck : p2Deck;
  const setCurrentDeck = activePlayerStage === 'p1' ? setP1Deck : setP2Deck;
  const activePlayerLabel =
    activePlayerStage === 'p1' ? player1Name : player2Name;
  const activeDeckSkin =
    activePlayerStage === 'p1' ? selectedDeckSkin : opponentDeckSkin;

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (secondsLeft === 0) {
      if (mode === 'online') {
        sound.playWinFanfare();
        onOpponentTimeoutWin();
      } else {
        onLockAndStartMatch(p1Deck, p2Deck);
      }
    }
  }, [
    secondsLeft,
    mode,
    onOpponentTimeoutWin,
    onLockAndStartMatch,
    p1Deck,
    p2Deck,
  ]);

  const handleCardTap = (idx: number) => {
    if (isShuffling) return;
    sound.playCardSlide();
    if (selectedSlotIdx === null) {
      setSelectedSlotIdx(idx);
      setSwapBannerText(
        `Slot #${idx + 1} (${currentDeck[idx]?.letter}) lifted — Tap target slot to fly & swap!`
      );
    } else if (selectedSlotIdx === idx) {
      setSelectedSlotIdx(null);
      setSwapBannerText(null);
    } else {
      const cardA = currentDeck[selectedSlotIdx];
      const cardB = currentDeck[idx];
      const fromSlot = selectedSlotIdx + 1;
      const toSlot = idx + 1;

      sound.playCardSlap();
      const updated = swapDeckCards(currentDeck, selectedSlotIdx, idx);
      setCurrentDeck(updated);
      setSelectedSlotIdx(null);

      if (cardA && cardB) {
        setRecentSwappedIds([cardA.id, cardB.id]);
        setSwapBannerText(
          `Swapped Slot #${fromSlot} (${cardA.letter}) <-> Slot #${toSlot} (${cardB.letter})!`
        );
        setTimeout(() => {
          setRecentSwappedIds([]);
        }, 700);
      }
    }
  };

  const handleRiffleShuffle = () => {
    if (isShuffling) return;
    sound.playShuffle();
    setSelectedSlotIdx(null);
    setIsShuffling(true);
    setShufflePhase('split');
    setShuffleCount((c) => c + 1);
    setSwapBannerText('3D Casino Riffle Shuffle: Interleaving & bridging deck...');

    setTimeout(() => {
      setShufflePhase('riffle');
    }, 140);

    setTimeout(() => {
      setShufflePhase('bridge');
    }, 380);

    setTimeout(() => {
      setShufflePhase('gather');
      sound.playCardSlap();
    }, 580);

    setTimeout(() => {
      setCurrentDeck((prev) => riffleShuffleDeck(prev));
      setIsShuffling(false);
      setSwapBannerText('Deck Riffle Shuffled! Ready to lock or swap slots.');
    }, 760);
  };

  const handleReverseOrder = () => {
    if (isShuffling) return;
    sound.playCardSlide();
    setSelectedSlotIdx(null);
    setCurrentDeck((prev) => [...prev].reverse());
    setSwapBannerText('Deck Order Reversed (#1 <-> #' + deckSize + ')!');
  };

  const handleConfirmDeck = () => {
    sound.playClick(1.2);
    if (mode === 'pass' && activePlayerStage === 'p1') {
      setActivePlayerStage('p2');
      setSelectedSlotIdx(null);
      setSwapBannerText(null);
      setSecondsLeft(60);
      return;
    }
    onLockAndStartMatch(p1Deck, p2Deck);
  };

  return (
    <div className="flex flex-col justify-between w-full h-full px-3 py-2.5 select-none overflow-hidden">
      {/* Top Countdown & Phase Header */}
      <header className="px-3 py-2 rounded-2xl bg-obsidian-panel border-gold-metallic flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-[9px] font-mono-num font-extrabold text-[#ffe082]">
              PHASE 1 • PRE-MATCH ARRANGE
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-400/40 text-[8.5px] font-mono-num font-bold text-emerald-300 truncate max-w-[120px]">
              {activeDeckSkin.name}
            </span>
          </div>
          <h1 className="mt-1 font-display font-black text-xs sm:text-sm text-[#fef9e7] truncate">
            {activePlayerLabel}&apos;s {deckSize}-Card Strategy
          </h1>
          <p className="text-[10px] text-emerald-300 font-medium truncate">
            {swapBannerText ||
              `Tap any 2 cards (or drag) to swap positions #1 to #${deckSize}`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* 60-Second Countdown Clock */}
          <div
            aria-label={`Arrange timer ${secondsLeft} seconds left`}
            className={`px-2.5 py-1.5 rounded-xl border font-mono-num font-black text-sm flex items-center gap-1.5 shadow-inner ${
              secondsLeft <= 10
                ? 'bg-red-950/90 border-red-400 text-red-200 animate-pulse'
                : 'bg-black/80 border-[#f5b041] text-[#ffe082]'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#f5b041]" />
            <span>00:{String(secondsLeft).padStart(2, '0')}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onCancelToHome();
            }}
            aria-label="Back to Home Screen"
            className="w-8 h-8 rounded-xl bg-black/70 border border-amber-500/40 text-amber-200 flex items-center justify-center active:scale-95"
          >
            <X className="w-4 h-4 text-[#f5b041]" />
          </button>
        </div>
      </header>

      {/* Top-Card Preview & Quick Controls Bar */}
      <div className="my-1.5 px-2.5 py-2 rounded-2xl bg-emerald-950/60 border border-amber-500/40 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="px-2 py-1 rounded-lg bg-royal-gold text-[#1c1102] font-mono-num font-black text-[10px] whitespace-nowrap shrink-0">
            TOP #1: {currentDeck[0]?.letter}
          </div>
          <span className="text-[10px] font-mono-num text-amber-100/90 truncate">
            {selectedSlotIdx !== null
              ? `Swap #${selectedSlotIdx + 1}`
              : `#2:${currentDeck[1]?.letter} • #3:${currentDeck[2]?.letter}`}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            disabled={isShuffling}
            onClick={handleRiffleShuffle}
            className="px-2.5 py-1.5 rounded-xl btn-3d-blue text-white text-[10px] font-extrabold whitespace-nowrap flex items-center gap-1 active:scale-95 disabled:opacity-70"
          >
            <Shuffle
              className={`w-3 h-3 ${isShuffling ? 'animate-spin' : ''}`}
            />
            <span>{isShuffling ? 'Shuffling...' : 'Riffle Shuffle'}</span>
          </button>
          <button
            type="button"
            disabled={isShuffling}
            onClick={handleReverseOrder}
            aria-label="Reverse Deck Order"
            className="px-2 py-1.5 rounded-xl bg-black/70 border border-amber-500/40 text-amber-200 text-[10px] font-bold whitespace-nowrap flex items-center gap-1 active:scale-95"
          >
            <ArrowUpDown className="w-3 h-3 text-[#f5b041]" />
            <span>Flip</span>
          </button>
        </div>
      </div>

      {/* Scrollable 1 to N Card Grid (Strictly Equipped Deck Skin + GPU-Accelerated 60FPS Swap Physics) */}
      <div
        aria-label="Deck Arrangement Grid"
        className="relative flex-1 overflow-y-auto rounded-2xl bg-black/55 border border-amber-500/30 p-2.5 grid grid-cols-4 gap-2 content-start perspective-1000"
      >
        {/* 60FPS GPU-Accelerated Casino Riffle Shuffle Theater Overlay */}
        {isShuffling && (
          <RiffleShuffleOverlay
            activeDeckSkin={activeDeckSkin}
            phase={shufflePhase}
          />
        )}

        {currentDeck.map((card, index) => {
          const isSelected = selectedSlotIdx === index;
          const isRecentlySwapped = recentSwappedIds.includes(card.id);

          return (
            <div
              key={card.id}
              draggable
              onDragStart={() => setDraggedIdx(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggedIdx !== null && draggedIdx !== index) {
                  const draggedCard = currentDeck[draggedIdx];
                  const targetCard = currentDeck[index];
                  sound.playCardSlap();
                  setCurrentDeck(moveDeckCard(currentDeck, draggedIdx, index));
                  if (draggedCard && targetCard) {
                    setRecentSwappedIds([draggedCard.id, targetCard.id]);
                    setTimeout(() => setRecentSwappedIds([]), 700);
                  }
                }
                setDraggedIdx(null);
              }}
              style={{
                willChange: 'transform',
                transform: isSelected
                  ? 'translate3d(0, -6px, 12px) scale(1.06)'
                  : isRecentlySwapped
                  ? 'translate3d(0, -4px, 8px) scale(1.08)'
                  : 'translate3d(0, 0, 0)',
                transition: 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
              className={`relative flex flex-col items-center ${
                isSelected || isRecentlySwapped ? 'z-30' : 'z-10'
              }`}
            >
              <button
                type="button"
                onClick={() => handleCardTap(index)}
                aria-label={`Position ${index + 1} Card ${card.letter} ${card.codeName}`}
                className="focus:outline-none relative"
              >
                <Card3D
                  letter={card.letter}
                  codeName={card.codeName}
                  skin={activeDeckSkin}
                  customPhotoUrl={customPhotoUrl}
                  size="sm"
                  badgeIndex={index + 1}
                  selected={isSelected}
                  glowMatch={isRecentlySwapped}
                />
                {isRecentlySwapped && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 z-30 px-1.5 py-0.5 rounded-full bg-royal-gold text-[#1c1102] text-[8px] font-display font-black uppercase shadow-lg whitespace-nowrap">
                    SWAPPED!
                  </span>
                )}
              </button>
              <span
                className={`mt-1 text-[9px] font-mono-num font-bold ${
                  isSelected || isRecentlySwapped
                    ? 'text-[#ffe082]'
                    : 'text-amber-200/80'
                }`}
              >
                {index === 0 ? 'TOP #1' : `Slot #${index + 1}`}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bottom Action Bar: Lock Deck & Start Match */}
      <div className="pt-2 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[10px] text-amber-200/80 px-1">
          <span>
            Mode:{' '}
            <strong className="text-[#ffe082] uppercase">
              {mode === 'online'
                ? 'Live 1v1 Matchmaking'
                : mode === 'pass'
                ? 'Pass & Play 1v1'
                : 'Practice Arena (+XP)'}
            </strong>
          </span>
          <span className="font-mono-num text-emerald-300 font-bold">
            2X Pot: {mode === 'practice' ? 'Free (+120 XP)' : `${stake.potFormatted} Coins`}
          </span>
        </div>

        <button
          type="button"
          onClick={handleConfirmDeck}
          className="w-full py-3 rounded-2xl btn-3d-gold font-display font-black text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Lock className="w-4 h-4 text-[#1c1102]" />
          <span>
            {mode === 'pass' && activePlayerStage === 'p1'
              ? `Lock ${player1Name}'s Deck -> Pass to ${player2Name}`
              : 'Lock Deck & Start Match'}
          </span>
        </button>
      </div>
    </div>
  );
};
