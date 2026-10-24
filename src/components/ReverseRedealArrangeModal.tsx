import React, { useEffect, useRef, useState } from 'react';
import { Check, Clock, Crown, RotateCcw, Shuffle, Sparkles } from 'lucide-react';
import { DeckSkin } from '../game/data';
import {
  CardItem,
  finalizeCustomDeckOrder,
  fisherYatesShuffle,
  swapDeckCards,
} from '../game/rules';
import { sound } from '../utils/sound';
import { Card3D } from './Card3D';

interface ReverseRedealArrangeModalProps {
  roundNumber: number;
  playerName: string;
  opponentName: string;
  playerCards: CardItem[];
  opponentCardCount: number;
  deckSkin: DeckSkin;
  customPhotoUrl: string | null;
  isPassAndPlaySecondStage?: boolean;
  onConfirmOrder: (orderedDeck: CardItem[]) => void;
}

export const ReverseRedealArrangeModal: React.FC<
  ReverseRedealArrangeModalProps
> = ({
  roundNumber,
  playerName,
  opponentName,
  playerCards,
  opponentCardCount,
  deckSkin,
  customPhotoUrl,
  isPassAndPlaySecondStage = false,
  onConfirmOrder,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(20);
  const [workingPool, setWorkingPool] = useState<CardItem[]>(playerCards);
  // Sequential numbered slot selection (#1, #2, #3...)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // When all cards are numbered (e.g. after Random Shuffle or selecting all), allow 2-tap swap
  const [swapSourceIdx, setSwapSourceIdx] = useState<number | null>(null);
  const [statusHint, setStatusHint] = useState<string>(
    'Tap cards in sequence to assign #1 (First to throw), #2, #3...'
  );

  const confirmedRef = useRef<boolean>(false);
  const workingPoolRef = useRef<CardItem[]>(workingPool);
  workingPoolRef.current = workingPool;
  const selectedIdsRef = useRef<string[]>(selectedIds);
  selectedIdsRef.current = selectedIds;
  const onConfirmRef = useRef(onConfirmOrder);
  onConfirmRef.current = onConfirmOrder;

  // Reset state if player stage changes (e.g., Pass & Play P1 -> P2)
  useEffect(() => {
    confirmedRef.current = false;
    setSecondsLeft(20);
    setWorkingPool(playerCards);
    setSelectedIds([]);
    setSwapSourceIdx(null);
    setStatusHint(
      'Tap cards in sequence to assign #1 (First to throw), #2, #3...'
    );
  }, [playerCards, playerName]);

  const lockInAndStart = () => {
    if (confirmedRef.current) return;
    confirmedRef.current = true;
    const finalOrdered = finalizeCustomDeckOrder(
      workingPoolRef.current,
      selectedIdsRef.current
    );
    onConfirmRef.current(finalOrdered);
  };

  // 20-Second Countdown Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          lockInAndStart();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [playerCards, playerName]);

  // Compute each card's effective 1-based throw slot (#1, #2, #3...)
  // Explicitly selected cards get #1..#K; unselected cards show their auto-fill fallback #K+1..#N
  const previewFinalOrder = finalizeCustomDeckOrder(workingPool, selectedIds);
  const effectiveSlotById = new Map<string, number>();
  previewFinalOrder.forEach((card, idx) => {
    effectiveSlotById.set(card.id, idx + 1);
  });

  const allSlotsExplicitlyAssigned =
    selectedIds.length === workingPool.length && workingPool.length > 0;

  const handleCardTap = (card: CardItem, gridIndex: number) => {
    sound.playCardSlide();

    // If all slots are already assigned, tapping two cards swaps their positions
    if (allSlotsExplicitlyAssigned) {
      if (swapSourceIdx === null) {
        setSwapSourceIdx(gridIndex);
        const slotNum = effectiveSlotById.get(card.id) || gridIndex + 1;
        setStatusHint(
          `Selected #${slotNum} (${card.letter}) — Tap another card to swap positions!`
        );
      } else if (swapSourceIdx === gridIndex) {
        setSwapSourceIdx(null);
        setStatusHint('Tap any two cards to swap their throw positions.');
      } else {
        const cardA = workingPool[swapSourceIdx];
        const cardB = workingPool[gridIndex];
        sound.playCardSlap();
        const swappedPool = swapDeckCards(workingPool, swapSourceIdx, gridIndex);
        setWorkingPool(swappedPool);
        setSelectedIds(swappedPool.map((c) => c.id));
        setSwapSourceIdx(null);
        if (cardA && cardB) {
          setStatusHint(
            `Swapped '${cardA.letter}' <-> '${cardB.letter}'! Ready to lock.`
          );
        }
      }
      return;
    }

    // Sequential Numbered Slot Selection Mode (#1, #2, #3...)
    const existingIdx = selectedIds.indexOf(card.id);
    if (existingIdx !== -1) {
      // Unassign this card and shift subsequent numbers down
      const nextSelected = selectedIds.filter((id) => id !== card.id);
      setSelectedIds(nextSelected);
      setStatusHint(
        `Removed '${card.letter}' from slot #${existingIdx + 1}. Next tap assigns #${
          nextSelected.length + 1
        }.`
      );
    } else {
      const nextSlotNum = selectedIds.length + 1;
      const nextSelected = [...selectedIds, card.id];
      sound.playCardSlap();
      setSelectedIds(nextSelected);

      if (nextSelected.length === workingPool.length) {
        // Reorder workingPool to match the exact #1..#N sequence chosen
        const ordered = finalizeCustomDeckOrder(workingPool, nextSelected);
        setWorkingPool(ordered);
        setStatusHint(
          `All ${workingPool.length} positions assigned (#1 to #${workingPool.length})! Tap any 2 cards to swap or Confirm & Ready.`
        );
      } else {
        setStatusHint(
          `Assigned '${card.letter}' to Slot #${nextSlotNum}${
            nextSlotNum === 1 ? ' (First to throw)' : ''
          }! Tap next card for #${nextSlotNum + 1}.`
        );
      }
    }
  };

  const handleRandomShuffle = () => {
    sound.playShuffle();
    setSwapSourceIdx(null);
    const shuffled = fisherYatesShuffle(workingPool);
    setWorkingPool(shuffled);
    setSelectedIds(shuffled.map((c) => c.id));
    setStatusHint(
      `Randomly shuffled all ${shuffled.length} cards (#1: ${shuffled[0]?.letter}, #2: ${shuffled[1]?.letter})! Tap Confirm & Ready.`
    );
  };

  const handleResetSelection = () => {
    sound.playClick(1.1);
    setSwapSourceIdx(null);
    setSelectedIds([]);
    setStatusHint(
      'Slots cleared! Tap cards in sequence for #1 (First to throw), #2, #3...'
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="SET YOUR CARD ORDER (अपने पत्ते सेट करें)"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 backdrop-blur-md p-2.5 select-none animate-fadeIn"
    >
      <div className="w-full max-w-[420px] h-[94dvh] rounded-3xl bg-obsidian-panel border-gold-glow flex flex-col justify-between p-3 shadow-[0_0_50px_rgba(0,0,0,0.95)] overflow-hidden">
        {/* 1. TOP HEADER: TITLE + ROUND INFO + 20S COUNTDOWN TIMER */}
        <header className="px-3 py-2 rounded-2xl bg-black/75 border border-amber-500/45 flex items-center justify-between gap-2 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-[9px] font-mono-num font-extrabold text-[#ffe082] uppercase">
                ROUND {roundNumber} • REVERSE RE-DEAL
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-400/40 text-[8.5px] font-mono-num font-bold text-emerald-300">
                {playerName}: {workingPool.length} vs {opponentName}: {opponentCardCount}
              </span>
            </div>

            <h2 className="mt-1 font-display font-black text-xs sm:text-sm text-[#ffe082] tracking-wide truncate">
              SET YOUR CARD ORDER (अपने पत्ते सेट करें)
            </h2>
            <p className="text-[10px] text-emerald-300 font-semibold truncate">
              {statusHint}
            </p>
          </div>

          {/* 20-Second Countdown Clock */}
          <div
            aria-label={`Card arrangement timer ${secondsLeft} seconds left`}
            className={`px-2.5 py-1.5 rounded-xl border font-mono-num font-black text-sm flex flex-col items-center justify-center shrink-0 shadow-inner ${
              secondsLeft <= 5
                ? 'bg-red-950/90 border-red-400 text-red-200 animate-pulse'
                : 'bg-black/90 border-[#f5b041] text-[#ffe082]'
            }`}
          >
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#f5b041]" />
              <span>00:{String(secondsLeft).padStart(2, '0')}</span>
            </div>
            <span className="text-[8px] text-amber-200/80 uppercase tracking-wider">
              Auto-Start
            </span>
          </div>
        </header>

        {/* 2. THROW SEQUENCE PREVIEW BAR & SLOT COUNTER */}
        <div className="my-1.5 px-2.5 py-1.5 rounded-2xl bg-emerald-950/65 border border-amber-500/40 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto no-scrollbar">
            <span className="px-2 py-0.5 rounded-lg bg-royal-gold text-[#1c1102] font-mono-num font-black text-[10px] whitespace-nowrap shrink-0">
              #1 (First): {previewFinalOrder[0]?.letter || '-'}
            </span>
            <span className="text-[10px] font-mono-num font-bold text-amber-100/95 whitespace-nowrap">
              #2: {previewFinalOrder[1]?.letter || '-'} • #3:{' '}
              {previewFinalOrder[2]?.letter || '-'} • #4:{' '}
              {previewFinalOrder[3]?.letter || '-'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-2 py-0.5 rounded bg-black/70 border border-amber-400/40 font-mono-num text-[9.5px] font-extrabold text-[#ffe082]">
              {selectedIds.length}/{workingPool.length} Set
            </span>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={handleResetSelection}
                aria-label="Reset Numbered Slots"
                className="px-2 py-1 rounded-lg bg-black/80 hover:bg-black border border-amber-500/40 text-amber-200 text-[9px] font-bold flex items-center gap-1 active:scale-95"
              >
                <RotateCcw className="w-2.5 h-2.5 text-[#f5b041]" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. RETURNED CARDS GRID WITH NUMBERED SLOT BADGES (#1, #2, #3...) */}
        <div
          aria-label="Returned Cards Arrangement Grid"
          className="relative flex-1 overflow-y-auto rounded-2xl bg-black/60 border border-amber-500/30 p-2.5 grid grid-cols-4 gap-2 content-start perspective-1000"
        >
          {workingPool.map((card, idx) => {
            const explicitIdx = selectedIds.indexOf(card.id);
            const isExplicitlyAssigned = explicitIdx !== -1;
            const effectiveSlot = effectiveSlotById.get(card.id) || idx + 1;
            const isSwapSelected = swapSourceIdx === idx;

            return (
              <div
                key={card.id}
                style={{
                  willChange: 'transform',
                  transform:
                    isExplicitlyAssigned || isSwapSelected
                      ? 'translate3d(0, -3px, 6px) scale(1.03)'
                      : 'translate3d(0, 0, 0)',
                  transition: 'transform 0.18s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
                className="relative flex flex-col items-center"
              >
                <button
                  type="button"
                  onClick={() => handleCardTap(card, idx)}
                  aria-label={`Card ${card.letter} Slot #${effectiveSlot}`}
                  className="focus:outline-none relative group"
                >
                  <Card3D
                    letter={card.letter}
                    codeName={card.codeName}
                    skin={deckSkin}
                    customPhotoUrl={customPhotoUrl}
                    size="sm"
                    badgeIndex={effectiveSlot}
                    selected={isExplicitlyAssigned || isSwapSelected}
                    glowMatch={effectiveSlot === 1 || isSwapSelected}
                  />

                  {/* Prominent Corner Numbered Slot Badge (1, 2, 3...) */}
                  <span
                    className={`absolute -top-1.5 -left-1.5 z-30 min-w-[22px] h-[22px] px-1 rounded-full font-mono-num font-black text-[10px] flex items-center justify-center shadow-lg border ${
                      isExplicitlyAssigned
                        ? 'bg-royal-gold text-[#1c1102] border-white shadow-[0_0_10px_rgba(245,176,65,0.9)]'
                        : 'bg-black/90 text-amber-200/85 border-amber-400/50'
                    }`}
                  >
                    #{effectiveSlot}
                  </span>
                </button>

                <span
                  className={`mt-1 px-1.5 py-0.5 rounded text-[8.5px] font-mono-num font-extrabold whitespace-nowrap ${
                    effectiveSlot === 1
                      ? 'bg-royal-gold/25 border border-amber-400/60 text-[#ffe082]'
                      : isExplicitlyAssigned
                      ? 'text-emerald-300'
                      : 'text-amber-200/65'
                  }`}
                >
                  {effectiveSlot === 1
                    ? '#1 (FIRST)'
                    : isExplicitlyAssigned
                    ? `Slot #${effectiveSlot}`
                    : `Auto #${effectiveSlot}`}
                </span>
              </div>
            );
          })}
        </div>

        {/* 4. QUICK-ACTION BUTTONS: "Random Shuffle" & "Confirm & Ready" */}
        <footer className="pt-2 flex flex-col gap-1.5 shrink-0">
          <div className="flex items-center justify-between text-[10px] text-amber-200/85 px-1">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#f5b041]" />
              <span>
                Unassigned cards auto-fill remaining slots when timer hits 0s
              </span>
            </span>
            <span className="font-mono-num font-bold text-emerald-300">
              {workingPool.length} Cards
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Button 1: Random Shuffle */}
            <button
              type="button"
              onClick={handleRandomShuffle}
              className="py-3 px-3 rounded-2xl btn-3d-blue text-white font-display font-black text-xs tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-lg"
            >
              <Shuffle className="w-4 h-4" />
              <span>Random Shuffle</span>
            </button>

            {/* Button 2: Confirm & Ready */}
            <button
              type="button"
              onClick={() => {
                sound.playCoinChime(4);
                lockInAndStart();
              }}
              className="py-3 px-3 rounded-2xl btn-3d-gold text-[#1c1102] font-display font-black text-xs tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-lg"
            >
              <Check className="w-4 h-4 text-[#1c1102]" />
              <span>
                {isPassAndPlaySecondStage
                  ? 'Confirm & Start'
                  : 'Confirm & Ready'}
              </span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
