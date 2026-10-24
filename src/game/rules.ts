import { LETTER_NAMES } from './data';

export interface CardItem {
  id: string;
  letter: string;
  codeName: string;
  value: number; // 1 for A .. 26 for Z
  owner?: 'p1' | 'p2';
  thrownBy?: 'player1' | 'player2';
}

export interface ThrowOutcome {
  thrownCard: CardItem;
  remainingDeck: CardItem[];
  updatedPot: CardItem[];
  isConsecutiveMatch: boolean;
  previousTopCard: CardItem | null;
}

export const MAX_DAILY_SPINS = 2;
export const SPIN_COOLDOWN_24H_SECONDS = 86399; // 23:59:59

/**
 * Enforces strictly 2 Free Lucky Spins every 24 hours.
 * When the 2nd spin is used (0/2 left), starts the 24-hour cooldown timer.
 */
export function consumeSpinQuota(
  spinsRemaining: number,
  spinCooldownSeconds: number
): {
  allowed: boolean;
  nextSpinsRemaining: number;
  nextSpinCooldownSeconds: number;
} {
  if (spinCooldownSeconds > 0 || spinsRemaining <= 0) {
    return {
      allowed: false,
      nextSpinsRemaining: 0,
      nextSpinCooldownSeconds:
        spinCooldownSeconds > 0 ? spinCooldownSeconds : SPIN_COOLDOWN_24H_SECONDS,
    };
  }
  const nextSpins = Math.max(0, spinsRemaining - 1);
  const nextCooldown = nextSpins === 0 ? SPIN_COOLDOWN_24H_SECONDS : 0;
  return {
    allowed: true,
    nextSpinsRemaining: nextSpins,
    nextSpinCooldownSeconds: nextCooldown,
  };
}

/**
 * Enforces that Custom Photo Deck upload is strictly locked until Level 100.
 */
export function canUploadCustomPhotoDeck(level: number): boolean {
  return level >= 100;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/**
 * 100% True Random Fisher-Yates shuffle algorithm.
 */
export function fisherYatesShuffle<T>(array: T[], rng: () => number = Math.random): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

/**
 * Helper to check if a card in centerPile belongs to / was thrown by a given player.
 */
export function isCardOwnedByPlayer(card: CardItem, player: 'p1' | 'p2'): boolean {
  const expectedThrownBy = player === 'p1' ? 'player1' : 'player2';
  if (card.thrownBy) {
    return card.thrownBy === expectedThrownBy;
  }
  return card.owner === player;
}

/**
 * Generates a deck of `size` cards (20, 30, 40, 50, 60) with A-Z letters using 100% true random Fisher-Yates shuffle.
 */
export function createAlphabetDeck(size: number, seedPrefix = 'p1', rng: () => number = Math.random): CardItem[] {
  const validSize = Math.max(4, Math.min(100, size));
  const owner: 'p1' | 'p2' = seedPrefix.startsWith('p2') ? 'p2' : 'p1';
  const thrownBy: 'player1' | 'player2' = owner === 'p1' ? 'player1' : 'player2';
  const pool: CardItem[] = [];
  const numSets = Math.ceil(validSize / 26) + 1;
  let count = 0;

  for (let s = 0; s < numSets && count < validSize; s++) {
    for (let i = 0; i < 26 && count < validSize; i++) {
      const letter = ALPHABET[i];
      pool.push({
        id: `${seedPrefix}-card-${count + 1}-${letter}-${Math.random().toString(36).substring(2, 6)}`,
        letter,
        codeName: LETTER_NAMES[letter] || 'ALPHA',
        value: i + 1,
        owner,
        thrownBy,
      });
      count++;
    }
  }

  return fisherYatesShuffle(pool, rng);
}

/**
 * Creates a combined card pool from full A-Z sets, executes a 100% true random Fisher-Yates shuffle,
 * and deals cards evenly to Player 1 and Player 2 blindly.
 */
export function createAndDealAlphabetDecks(deckSize: number, rng: () => number = Math.random): {
  p1Deck: CardItem[];
  p2Deck: CardItem[];
} {
  const validSize = Math.max(4, Math.min(100, deckSize));
  const totalCards = validSize * 2;
  const pool: CardItem[] = [];
  const numSets = Math.ceil(totalCards / 26) + 1;
  let count = 0;

  for (let s = 0; s < numSets && count < totalCards; s++) {
    for (let i = 0; i < 26 && count < totalCards; i++) {
      const letter = ALPHABET[i];
      pool.push({
        id: `card-${count + 1}-${letter}-${Math.random().toString(36).substring(2, 6)}`,
        letter,
        codeName: LETTER_NAMES[letter] || 'ALPHA',
        value: i + 1,
        owner: 'p1',
        thrownBy: 'player1',
      });
      count++;
    }
  }

  // 100% True Random Fisher-Yates shuffle on the entire combined pool
  const shuffledPool = fisherYatesShuffle(pool, rng);

  // Deal evenly to Player 1 and Player 2
  const p1Deck = shuffledPool.slice(0, validSize).map((card, idx) => ({
    ...card,
    id: `p1-card-${idx + 1}-${card.letter}`,
    owner: 'p1' as const,
    thrownBy: 'player1' as const,
  }));

  const p2Deck = shuffledPool.slice(validSize, totalCards).map((card, idx) => ({
    ...card,
    id: `p2-card-${idx + 1}-${card.letter}`,
    owner: 'p2' as const,
    thrownBy: 'player2' as const,
  }));

  return { p1Deck, p2Deck };
}

/**
 * Exact Card Transfer when a Pile is Won (e.g., 20 -> 25 vs 15 Rule):
 * Appends all cards in the center pile to the winning player's deck,
 * transferring ownership of every card in `centerPot` to the winner.
 */
export function collectPotIntoDeck(
  currentDeck: CardItem[],
  centerPot: CardItem[],
  winner: 'p1' | 'p2'
): CardItem[] {
  const winnerThrownBy: 'player1' | 'player2' = winner === 'p1' ? 'player1' : 'player2';
  const taggedPot = centerPot.map((card, idx) => ({
    ...card,
    id: `${winner}-pot-${Date.now()}-${idx}-${card.letter}-${Math.random().toString(36).substring(2, 5)}`,
    owner: winner,
    thrownBy: winnerThrownBy,
  }));
  return [...currentDeck, ...taggedPot];
}

/**
 * Banks all cards currently in the center pile into the winning player's won card bank,
 * re-tagging every collected card with the winner's ownership.
 */
export function collectPotIntoBank(
  currentBank: CardItem[],
  centerPot: CardItem[],
  winner: 'p1' | 'p2'
): CardItem[] {
  const winnerThrownBy: 'player1' | 'player2' = winner === 'p1' ? 'player1' : 'player2';
  const taggedPot = centerPot.map((card, idx) => ({
    ...card,
    id: `${winner}-bank-${Date.now()}-${idx}-${card.letter}-${Math.random().toString(36).substring(2, 5)}`,
    owner: winner,
    thrownBy: winnerThrownBy,
  }));
  return [...currentBank, ...taggedPot];
}

/**
 * Calculates a player's total net remaining cards across their hand/deck, won bank,
 * and their own unmatched cards currently sitting on the center pile.
 */
export function getPlayerTotalCardCount(
  player: 'p1' | 'p2',
  hand: CardItem[],
  bank: CardItem[],
  centerPot: CardItem[]
): number {
  const potOwnedCount = centerPot.filter((c) => isCardOwnedByPlayer(c, player)).length;
  return hand.length + bank.length + potOwnedCount;
}

/**
 * Determines whether a No-Match Reverse / Return Cards round should trigger:
 * When the smaller deck runs out on the table (e.g., Player 1 throws all 15 of their cards
 * and Player 2 has also thrown 15 cards while still holding 10 extra cards in hand),
 * return the unmatched centerPile cards back to whoever threw them!
 */
export function shouldTriggerNoMatchRedeal(
  p1Hand: CardItem[],
  p2Hand: CardItem[],
  centerPot: CardItem[]
): boolean {
  if (centerPot.length === 0) return false;
  if (p1Hand.length === 0 && p2Hand.length === 0) return true;
  const p1ThrownInPot = centerPot.filter((c) => isCardOwnedByPlayer(c, 'p1')).length;
  const p2ThrownInPot = centerPot.filter((c) => isCardOwnedByPlayer(c, 'p2')).length;
  if (p1Hand.length === 0 && p2ThrownInPot >= p1ThrownInPot) return true;
  if (p2Hand.length === 0 && p1ThrownInPot >= p2ThrownInPot) return true;
  return false;
}

/**
 * Reverse / Return Cards Rule:
 * Returns unmatched `centerPot` cards back to whoever threw them (`thrownBy: 'player1' | 'player2'`),
 * combines them with any remaining cards still held in each player's hand/reserve (e.g., 15 for P1, 15 + 10 = 25 for P2),
 * and shuffles each player's respective deck using 100% true random Fisher-Yates shuffle.
 */
export function computeReverseRedeal(
  p1Hand: CardItem[],
  p2Hand: CardItem[],
  p1Bank: CardItem[],
  p2Bank: CardItem[],
  centerPot: CardItem[],
  rng: () => number = Math.random,
  preserveOrderForManualArrange: boolean = false
): {
  p1NewDeck: CardItem[];
  p2NewDeck: CardItem[];
} {
  const p1Pool = [
    ...p1Hand,
    ...p1Bank,
    ...centerPot.filter((c) => isCardOwnedByPlayer(c, 'p1')),
  ];
  const p2Pool = [
    ...p2Hand,
    ...p2Bank,
    ...centerPot.filter((c) => isCardOwnedByPlayer(c, 'p2')),
  ];

  const stamp = Date.now();
  const orderedP1 = preserveOrderForManualArrange ? p1Pool : fisherYatesShuffle(p1Pool, rng);
  const orderedP2 = preserveOrderForManualArrange ? p2Pool : fisherYatesShuffle(p2Pool, rng);

  const p1NewDeck = orderedP1.map((card, idx) => ({
    ...card,
    id: `p1-redeal-${stamp}-${idx + 1}-${card.letter}`,
    owner: 'p1' as const,
    thrownBy: 'player1' as const,
  }));

  const p2NewDeck = orderedP2.map((card, idx) => ({
    ...card,
    id: `p2-redeal-${stamp}-${idx + 1}-${card.letter}`,
    owner: 'p2' as const,
    thrownBy: 'player2' as const,
  }));

  return { p1NewDeck, p2NewDeck };
}

/**
 * Finalizes a player's custom deck order after the 20-second "SET YOUR CARD ORDER" Reverse/Re-deal phase.
 * Places all cards explicitly selected by the player (`selectedIdsInOrder`) in exact #1, #2, #3... sequence,
 * and automatically fills any remaining unassigned slots with the remaining cards from `deckPool`
 * so the game never gets stuck and cards are thrown strictly in the arranged #1, #2, #3... order.
 */
export function finalizeCustomDeckOrder(
  deckPool: CardItem[],
  selectedIdsInOrder: string[]
): CardItem[] {
  if (!selectedIdsInOrder || selectedIdsInOrder.length === 0) {
    return [...deckPool];
  }
  const cardById = new Map<string, CardItem>();
  for (const card of deckPool) {
    cardById.set(card.id, card);
  }

  const usedIds = new Set<string>();
  const ordered: CardItem[] = [];

  for (const id of selectedIdsInOrder) {
    const found = cardById.get(id);
    if (found && !usedIds.has(id)) {
      ordered.push(found);
      usedIds.add(id);
    }
  }

  for (const card of deckPool) {
    if (!usedIds.has(card.id)) {
      ordered.push(card);
      usedIds.add(card.id);
    }
  }

  return ordered;
}


/**
 * Swaps two cards in the player's deck during the 60-Second Pre-Match Arrange phase.
 * Returns a new array preserving immutability.
 */
export function swapDeckCards(deck: CardItem[], indexA: number, indexB: number): CardItem[] {
  if (
    indexA < 0 ||
    indexB < 0 ||
    indexA >= deck.length ||
    indexB >= deck.length ||
    indexA === indexB
  ) {
    return [...deck];
  }
  const next = [...deck];
  const temp = next[indexA];
  next[indexA] = next[indexB];
  next[indexB] = temp;
  return next;
}

/**
 * Moves a card from `fromIndex` to `toIndex` (for drag-and-drop / swipe ordering).
 */
export function moveDeckCard(deck: CardItem[], fromIndex: number, toIndex: number): CardItem[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= deck.length ||
    toIndex >= deck.length ||
    fromIndex === toIndex
  ) {
    return [...deck];
  }
  const next = [...deck];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

/**
 * Performs an authentic casino riffle shuffle on the deck.
 */
export function riffleShuffleDeck(deck: CardItem[], rng: () => number = Math.random): CardItem[] {
  const copy = [...deck];
  // Fisher-Yates + interleaved riffle pass
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  const mid = Math.floor(copy.length / 2);
  const left = copy.slice(0, mid);
  const right = copy.slice(mid);
  const interleaved: CardItem[] = [];
  const maxLen = Math.max(left.length, right.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < right.length) interleaved.push(right[i]);
    if (i < left.length) interleaved.push(left[i]);
  }
  return interleaved;
}

/**
 * Strict Top-Card-Only Rule:
 * Players CANNOT pull cards from the middle or bottom of their deck.
 * Only `deck[0]` (the top card at Position #1) can be thrown into the center pot.
 * If the newly thrown card's letter equals the previous top card's letter in the center pot,
 * `isConsecutiveMatch` is true!
 */
export function throwTopCard(playerDeck: CardItem[], centerPot: CardItem[]): ThrowOutcome | null {
  if (playerDeck.length === 0) {
    return null;
  }

  const thrownCard = playerDeck[0];
  const remainingDeck = playerDeck.slice(1);
  const previousTopCard = centerPot.length > 0 ? centerPot[centerPot.length - 1] : null;
  const updatedPot = [...centerPot, thrownCard];
  const isConsecutiveMatch =
    previousTopCard !== null && previousTopCard.letter === thrownCard.letter;

  return {
    thrownCard,
    remainingDeck,
    updatedPot,
    isConsecutiveMatch,
    previousTopCard,
  };
}

/**
 * Calculates new player level and XP progress (Levels 1 to 100).
 */
export function calculateLevelFromXp(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
} {
  const safeXp = Math.max(0, Math.floor(xp));
  const xpPerLevel = 250;
  const rawLevel = Math.floor(safeXp / xpPerLevel) + 1;
  const level = Math.min(100, rawLevel);
  const currentLevelXp = level === 100 ? xpPerLevel : safeXp % xpPerLevel;
  const progressPercent = level === 100 ? 100 : Math.min(100, Math.round((currentLevelXp / xpPerLevel) * 100));

  return {
    level,
    currentLevelXp,
    nextLevelXp: xpPerLevel,
    progressPercent,
  };
}

/**
 * Formats coin balances cleanly (e.g. 8,500 or Indian lakh style for large pots).
 */
export function formatCoins(amount: number): string {
  return Math.max(0, Math.round(amount)).toLocaleString('en-US');
}

/**
 * Formats seconds into MM:SS or HH:MM:SS for cooldowns.
 */
export function formatCooldownHMS(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds) ? totalSeconds : 0;
  const clamped = Math.max(0, Math.floor(safeSeconds));
  const hrs = Math.floor(clamped / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;
  return [
    String(hrs).padStart(2, '0'),
    String(mins).padStart(2, '0'),
    String(secs).padStart(2, '0'),
  ].join(':');
}
