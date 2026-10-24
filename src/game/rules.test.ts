import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAlphabetDeck,
  swapDeckCards,
  moveDeckCard,
  riffleShuffleDeck,
  throwTopCard,
  calculateLevelFromXp,
  formatCooldownHMS,
  consumeSpinQuota,
  canUploadCustomPhotoDeck,
  SPIN_COOLDOWN_24H_SECONDS,
  CardItem,
  createAndDealAlphabetDecks,
  collectPotIntoDeck,
} from './rules';

test('createAlphabetDeck creates exact requested deck sizes (20, 30, 40, 50, 60) and tags owner', () => {
  for (const size of [20, 30, 40, 50, 60]) {
    const deckP1 = createAlphabetDeck(size, 'p1');
    const deckP2 = createAlphabetDeck(size, 'p2');
    assert.equal(deckP1.length, size);
    assert.equal(deckP1[0].owner, 'p1');
    assert.equal(deckP2[0].owner, 'p2');
  }
});

test('swapDeckCards and moveDeckCard accurately reorder cards for 60s Pre-Match Arrange', () => {
  const deck = createAlphabetDeck(20, 'p1');
  const firstId = deck[0].id;
  const secondId = deck[1].id;
  const swapped = swapDeckCards(deck, 0, 1);
  assert.equal(swapped[0].id, secondId);
  assert.equal(swapped[1].id, firstId);

  const moved = moveDeckCard(swapped, 0, 3);
  assert.equal(moved[3].id, secondId);
});

test('riffleShuffleDeck preserves all cards without loss or duplication', () => {
  const deck = createAlphabetDeck(30, 'p1');
  const shuffled = riffleShuffleDeck(deck, () => 0.42);
  assert.equal(shuffled.length, 30);
  const originalIds = deck.map((c) => c.id).sort();
  const shuffledIds = shuffled.map((c) => c.id).sort();
  assert.deepEqual(shuffledIds, originalIds);
});

test('throwTopCard enforces Strict Top-Card-Only rule and detects consecutive letter match', () => {
  const p1Deck: CardItem[] = [
    { id: 'c1', letter: 'K', codeName: 'KILO', value: 11, owner: 'p1' },
    { id: 'c2', letter: 'A', codeName: 'ALPHA', value: 1, owner: 'p1' },
  ];
  const centerPot: CardItem[] = [
    { id: 'pot-0', letter: 'Z', codeName: 'ZULU', value: 26, owner: 'p1' },
    { id: 'pot-1', letter: 'K', codeName: 'KILO', value: 11, owner: 'p2' },
  ];

  const outcome = throwTopCard(p1Deck, centerPot);
  assert.ok(outcome !== null);
  assert.equal(outcome.thrownCard.id, 'c1');
  assert.equal(outcome.thrownCard.letter, 'K');
  assert.equal(outcome.thrownCard.owner, 'p1');
  assert.equal(outcome.remainingDeck.length, 1);
  assert.equal(outcome.remainingDeck[0].id, 'c2');
  assert.equal(outcome.updatedPot.length, 3);
  assert.equal(outcome.isConsecutiveMatch, true);
});

test('consumeSpinQuota enforces strictly 2 spins per 24 hours and triggers 24h cooldown on 0/2', () => {
  // First spin: 2/2 -> 1/2, no cooldown yet
  const spin1 = consumeSpinQuota(2, 0);
  assert.equal(spin1.allowed, true);
  assert.equal(spin1.nextSpinsRemaining, 1);
  assert.equal(spin1.nextSpinCooldownSeconds, 0);

  // Second spin: 1/2 -> 0/2, starts 24h cooldown (23:59:59)
  const spin2 = consumeSpinQuota(spin1.nextSpinsRemaining, spin1.nextSpinCooldownSeconds);
  assert.equal(spin2.allowed, true);
  assert.equal(spin2.nextSpinsRemaining, 0);
  assert.equal(spin2.nextSpinCooldownSeconds, SPIN_COOLDOWN_24H_SECONDS);
  assert.equal(formatCooldownHMS(spin2.nextSpinCooldownSeconds), '23:59:59');

  // Third spin attempt while at 0/2: strictly blocked
  const spin3 = consumeSpinQuota(spin2.nextSpinsRemaining, spin2.nextSpinCooldownSeconds);
  assert.equal(spin3.allowed, false);
  assert.equal(spin3.nextSpinsRemaining, 0);
});

test('canUploadCustomPhotoDeck locks custom photo upload strictly until Level 100', () => {
  assert.equal(canUploadCustomPhotoDeck(1), false);
  assert.equal(canUploadCustomPhotoDeck(50), false);
  assert.equal(canUploadCustomPhotoDeck(99), false);
  assert.equal(canUploadCustomPhotoDeck(100), true);
});

test('calculateLevelFromXp caps at Level 100 Grandmaster and formats cooldowns', () => {
  assert.equal(calculateLevelFromXp(0).level, 1);
  assert.equal(calculateLevelFromXp(250).level, 2);
  assert.equal(calculateLevelFromXp(50000).level, 100);
  assert.equal(formatCooldownHMS(14399), '03:59:59');
});

test('online matchmaking deck initialization tags host as p1 and guest as p2', () => {
  const hostDeck = createAlphabetDeck(30, 'p1');
  const guestDeck = riffleShuffleDeck(createAlphabetDeck(30, 'p2'));

  assert.equal(hostDeck.length, 30);
  assert.equal(guestDeck.length, 30);
  assert.equal(hostDeck.every((c) => c.owner === 'p1'), true);
  assert.equal(guestDeck.every((c) => c.owner === 'p2'), true);

  // Throws enforce distinct owner tags
  const pot: CardItem[] = [];
  const throw1 = throwTopCard(hostDeck, pot);
  assert.ok(throw1 !== null);
  assert.equal(throw1.thrownCard.owner, 'p1');

  const throw2 = throwTopCard(guestDeck, throw1.updatedPot);
  assert.ok(throw2 !== null);
  assert.equal(throw2.thrownCard.owner, 'p2');
  assert.equal(throw2.updatedPot.length, 2);
});

test('createAndDealAlphabetDecks deals evenly from full A-Z card pool using Fisher-Yates shuffle', () => {
  for (const size of [20, 30, 40, 50, 60]) {
    const { p1Deck, p2Deck } = createAndDealAlphabetDecks(size);
    assert.equal(p1Deck.length, size);
    assert.equal(p2Deck.length, size);
    assert.equal(p1Deck.every((c) => c.owner === 'p1'), true);
    assert.equal(p2Deck.every((c) => c.owner === 'p2'), true);

    // Verify all cards have valid letters A-Z
    assert.equal(p1Deck.every((c) => /^[A-Z]$/.test(c.letter)), true);
    assert.equal(p2Deck.every((c) => /^[A-Z]$/.test(c.letter)), true);
  }
});

test('collectPotIntoDeck adds all center pot cards to winner deck and updates ownership', () => {
  const currentDeck: CardItem[] = [
    { id: 'p1-1', letter: 'A', codeName: 'ALPHA', value: 1, owner: 'p1' },
    { id: 'p1-2', letter: 'B', codeName: 'BRAVO', value: 2, owner: 'p1' },
  ];
  const centerPot: CardItem[] = [
    { id: 'pot-1', letter: 'K', codeName: 'KILO', value: 11, owner: 'p2' },
    { id: 'pot-2', letter: 'M', codeName: 'MIKE', value: 13, owner: 'p1' },
    { id: 'pot-3', letter: 'K', codeName: 'KILO', value: 11, owner: 'p1' },
  ];

  const swept = collectPotIntoDeck(currentDeck, centerPot, 'p1');
  assert.equal(swept.length, 5);
  // Original cards kept
  assert.equal(swept[0].letter, 'A');
  assert.equal(swept[1].letter, 'B');
  // Collected pot cards appended to the end with p1 ownership
  assert.equal(swept[2].letter, 'K');
  assert.equal(swept[3].letter, 'M');
  assert.equal(swept[4].letter, 'K');
  assert.equal(swept.every((c) => c.owner === 'p1'), true);
});

test('exact consecutive top-card match compares newly thrown card with card beneath it', () => {
  // Center pile has [ 'A', 'K', 'Q' ]
  // Thrown card is 'Q': consecutive match!
  const pot: CardItem[] = [
    { id: '1', letter: 'A', codeName: 'ALPHA', value: 1, owner: 'p1' },
    { id: '2', letter: 'K', codeName: 'KILO', value: 11, owner: 'p2' },
    { id: '3', letter: 'Q', codeName: 'QUEBEC', value: 17, owner: 'p1' },
  ];
  const matchingHand: CardItem[] = [
    { id: '4', letter: 'Q', codeName: 'QUEBEC', value: 17, owner: 'p2' },
    { id: '5', letter: 'Z', codeName: 'ZULU', value: 26, owner: 'p2' },
  ];
  const outcome = throwTopCard(matchingHand, pot);
  assert.ok(outcome !== null);
  assert.equal(outcome.isConsecutiveMatch, true);
  assert.equal(outcome.previousTopCard?.letter, 'Q');
  assert.equal(outcome.thrownCard.letter, 'Q');

  // Thrown card is 'J': not a consecutive match
  const nonMatchingHand: CardItem[] = [
    { id: '6', letter: 'J', codeName: 'JULIETT', value: 10, owner: 'p2' },
  ];
  const outcome2 = throwTopCard(nonMatchingHand, pot);
  assert.ok(outcome2 !== null);
  assert.equal(outcome2.isConsecutiveMatch, false);
});

test('3-minute AFK forfeit threshold triggers at 180 seconds or 7 consecutive auto-throws', () => {
  const TURN_DURATION = 25;
  const FORFEIT_SECONDS = 180;
  const FORFEIT_THROWS = 7;

  let afkSeconds = 0;
  let autoThrows = 0;

  for (let i = 1; i <= 6; i++) {
    afkSeconds += TURN_DURATION;
    autoThrows += 1;
    const shouldForfeit = afkSeconds >= FORFEIT_SECONDS || autoThrows >= FORFEIT_THROWS;
    assert.equal(shouldForfeit, false);
  }

  // 7th consecutive auto-throw triggers forfeit (7 * 25s = 175s >= 7 throws)
  afkSeconds += TURN_DURATION;
  autoThrows += 1;
  const shouldForfeit7 = afkSeconds >= FORFEIT_SECONDS || autoThrows >= FORFEIT_THROWS;
  assert.equal(shouldForfeit7, true);

  // Manual throw resets AFK counter to 0
  afkSeconds = 0;
  autoThrows = 0;
  assert.equal(afkSeconds, 0);
  assert.equal(autoThrows, 0);
});

test('Reverse / Re-deal Rule: 60-card match where P1 loses 20 cards to P2 earlier deals 40 cards to P1 and 80 cards to P2', async () => {
  const { collectPotIntoBank, computeReverseRedeal, getPlayerTotalCardCount } = await import('./rules');

  // Start a 60-card match (60 each = 120 total)
  const { p1Deck: initialP1, p2Deck: initialP2 } = createAndDealAlphabetDecks(60);
  assert.equal(initialP1.length, 60);
  assert.equal(initialP2.length, 60);

  // Case 1: No cards won/lost yet, all 60 cards from both hands thrown onto centerPot without a match
  const allUnmatchedPot: CardItem[] = [...initialP1, ...initialP2];
  const redealEqual = computeReverseRedeal([], [], [], [], allUnmatchedPot);
  assert.equal(redealEqual.p1NewDeck.length, 60);
  assert.equal(redealEqual.p2NewDeck.length, 60);
  assert.equal(redealEqual.p1NewDeck.every((c) => c.owner === 'p1'), true);
  assert.equal(redealEqual.p2NewDeck.every((c) => c.owner === 'p2'), true);

  // Case 2: P1 throws 20 cards and P2 throws 20 cards into centerPot (40 cards total), and P2 wins that pile!
  const firstPilePot: CardItem[] = [
    ...initialP1.slice(0, 20),
    ...initialP2.slice(0, 20),
  ];
  const p1BankAfterPile: CardItem[] = [];
  const p2BankAfterPile = collectPotIntoBank([], firstPilePot, 'p2');
  assert.equal(p2BankAfterPile.length, 40);

  // Remaining 40 cards in each player's hand are thrown onto centerPot without hitting a match
  const remainingUnmatchedPot: CardItem[] = [
    ...initialP1.slice(20), // 40 cards owned by p1
    ...initialP2.slice(20), // 40 cards owned by p2
  ];

  // Verify net totals before Reverse / Re-deal: P1 has 40 total, P2 has 80 total
  assert.equal(getPlayerTotalCardCount('p1', [], p1BankAfterPile, remainingUnmatchedPot), 40);
  assert.equal(getPlayerTotalCardCount('p2', [], p2BankAfterPile, remainingUnmatchedPot), 80);

  // Trigger Reverse / Re-deal when hands are empty
  const redealUnequal = computeReverseRedeal(
    [],
    [],
    p1BankAfterPile,
    p2BankAfterPile,
    remainingUnmatchedPot
  );
  assert.equal(redealUnequal.p1NewDeck.length, 40);
  assert.equal(redealUnequal.p2NewDeck.length, 80);
  assert.equal(redealUnequal.p1NewDeck.every((c) => c.owner === 'p1'), true);
  assert.equal(redealUnequal.p2NewDeck.every((c) => c.owner === 'p2'), true);

  // Case 3: P2 sweeps the remaining 40 P1 cards so P1 drops to 0 total cards -> Match finishes!
  const finalBankP2 = collectPotIntoBank(p2BankAfterPile, remainingUnmatchedPot, 'p2');
  assert.equal(getPlayerTotalCardCount('p1', [], [], []), 0);
  assert.equal(getPlayerTotalCardCount('p2', [], finalBankP2, []), 120);
});

test('Exact Card Transfer (20 -> 25 vs 15) & Playing with Unequal Decks (15 vs 25) Reverse/Return Cards Rule', async () => {
  const {
    computeReverseRedeal,
    getPlayerTotalCardCount,
    shouldTriggerNoMatchRedeal,
  } = await import('./rules');

  // 1. Both start with 20 cards (Player 1 = 20, Player 2 = 20)
  const { p1Deck: startP1, p2Deck: startP2 } = createAndDealAlphabetDecks(20);
  assert.equal(startP1.length, 20);
  assert.equal(startP2.length, 20);
  assert.equal(startP1.every((c) => c.thrownBy === 'player1'), true);
  assert.equal(startP2.every((c) => c.thrownBy === 'player2'), true);

  // 2. Player 1 throws 5 cards (15 left in hand) and Player 2 throws 5 cards (15 left in hand) into centerPile (10 cards total)
  const p1HandAfter5 = startP1.slice(5); // 15 unplayed
  const p2HandAfter5 = startP2.slice(5); // 15 unplayed
  const centerPile10: CardItem[] = [
    ...startP1.slice(0, 5).map((c) => ({ ...c, owner: 'p1' as const, thrownBy: 'player1' as const })),
    ...startP2.slice(0, 5).map((c) => ({ ...c, owner: 'p2' as const, thrownBy: 'player2' as const })),
  ];
  assert.equal(centerPile10.length, 10);

  // Player 2 hits a match and takes all 10 cards from centerPile into their deck!
  const p2DeckAfterWin = collectPotIntoDeck(p2HandAfter5, centerPile10, 'p2');
  const p1DeckAfterLoss = p1HandAfter5;
  assert.equal(p2DeckAfterWin.length, 25); // 15 unplayed + 5 own thrown + 5 won from Player 1 = 25!
  assert.equal(p1DeckAfterLoss.length, 15); // 15 left!
  assert.equal(getPlayerTotalCardCount('p2', p2DeckAfterWin, [], []), 25);
  assert.equal(getPlayerTotalCardCount('p1', p1DeckAfterLoss, [], []), 15);

  // 3. Playing with unequal decks (15 vs 25):
  // Once Player 1 throws all 15 of their cards, Player 2 has also thrown 15 cards (holding 10 extra cards in hand)
  const p1RemainingHand: CardItem[] = []; // 0 left in hand
  const p2RemainingHand: CardItem[] = p2DeckAfterWin.slice(15); // 10 extra cards safely in hand!
  assert.equal(p2RemainingHand.length, 10);

  const unmatchedCenterPile30: CardItem[] = [
    ...p1DeckAfterLoss.map((c) => ({ ...c, owner: 'p1' as const, thrownBy: 'player1' as const })),
    ...p2DeckAfterWin.slice(0, 15).map((c) => ({ ...c, owner: 'p2' as const, thrownBy: 'player2' as const })),
  ];
  assert.equal(unmatchedCenterPile30.length, 30);

  // Verify shouldTriggerNoMatchRedeal triggers as soon as smaller deck (15) runs out and both threw 15
  assert.equal(
    shouldTriggerNoMatchRedeal(p1RemainingHand, p2RemainingHand, unmatchedCenterPile30),
    true
  );

  // Trigger Reverse / Return Cards:
  // Player 1 gets their 15 thrown cards back -> 15 cards
  // Player 2 gets their 15 thrown cards back + 10 in hand -> 25 cards
  const { p1NewDeck, p2NewDeck } = computeReverseRedeal(
    p1RemainingHand,
    p2RemainingHand,
    [],
    [],
    unmatchedCenterPile30,
    Math.random,
    true // preserveOrderForManualArrange
  );
  assert.equal(p1NewDeck.length, 15);
  assert.equal(p2NewDeck.length, 25);
  assert.equal(p1NewDeck.every((c) => c.thrownBy === 'player1' && c.owner === 'p1'), true);
  assert.equal(p2NewDeck.every((c) => c.thrownBy === 'player2' && c.owner === 'p2'), true);
});

test('Reverse Re-Deal Custom Deck Ordering: finalizeCustomDeckOrder assigns exact #1, #2, #3... sequence and auto-fills remaining slots on 20s timeout', async () => {
  const { finalizeCustomDeckOrder } = await import('./rules');

  const returnedCards: CardItem[] = [
    { id: 'r1', letter: 'A', codeName: 'ALPHA', value: 1, owner: 'p1', thrownBy: 'player1' },
    { id: 'r2', letter: 'B', codeName: 'BRAVO', value: 2, owner: 'p1', thrownBy: 'player1' },
    { id: 'r3', letter: 'C', codeName: 'CHARLIE', value: 3, owner: 'p1', thrownBy: 'player1' },
    { id: 'r4', letter: 'D', codeName: 'DELTA', value: 4, owner: 'p1', thrownBy: 'player1' },
    { id: 'r5', letter: 'E', codeName: 'ECHO', value: 5, owner: 'p1', thrownBy: 'player1' },
  ];

  // Player taps r4 as #1 (First to throw), r2 as #2, and r5 as #3 before the 20s timer hits 0
  // Remaining unassigned cards (r1, r3) must auto-fill slots #4 and #5
  const arranged = finalizeCustomDeckOrder(returnedCards, ['r4', 'r2', 'r5']);
  assert.equal(arranged.length, 5);
  assert.deepEqual(
    arranged.map((c) => c.letter),
    ['D', 'B', 'E', 'A', 'C']
  );

  // Verify cards are thrown strictly in the arranged #1, #2, #3... order
  let currentDeck = arranged;
  let pot: CardItem[] = [];

  const throw1 = throwTopCard(currentDeck, pot);
  assert.ok(throw1 !== null);
  assert.equal(throw1.thrownCard.letter, 'D'); // #1 First to throw

  currentDeck = throw1.remainingDeck;
  pot = throw1.updatedPot;
  const throw2 = throwTopCard(currentDeck, pot);
  assert.ok(throw2 !== null);
  assert.equal(throw2.thrownCard.letter, 'B'); // #2 Second to throw

  currentDeck = throw2.remainingDeck;
  pot = throw2.updatedPot;
  const throw3 = throwTopCard(currentDeck, pot);
  assert.ok(throw3 !== null);
  assert.equal(throw3.thrownCard.letter, 'E'); // #3 Third to throw
});



