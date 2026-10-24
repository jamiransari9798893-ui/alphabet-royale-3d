import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  limit,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { CardItem, createAlphabetDeck, createAndDealAlphabetDecks, riffleShuffleDeck } from './rules';

export interface OnlineMatchDoc {
  id?: string;
  status: 'waiting' | 'playing' | 'completed' | 'cancelled';
  betAmount: number;
  potCoins: number;
  deckSize: number;
  hostUid: string;
  hostName: string;
  hostAvatarId: string;
  hostLevel: number;
  hostDeckSkinId: string;
  guestUid?: string | null;
  guestName?: string | null;
  guestAvatarId?: string | null;
  guestLevel?: number | null;
  guestDeckSkinId?: string | null;
  p1Deck: CardItem[];
  p2Deck: CardItem[];
  p1Bank?: CardItem[];
  p2Bank?: CardItem[];
  centerPot: CardItem[];
  turn: 'p1' | 'p2';
  roundNumber?: number;
  p1Score?: number;
  p2Score?: number;
  lastThrownCard?: CardItem | null;
  lastAction?: {
    type: 'throw' | 'chat' | 'reaction' | 'forfeit';
    actor: 'p1' | 'p2';
    card?: CardItem;
    text?: string;
    reaction?: string;
    isConsecutiveMatch?: boolean;
    isRedeal?: boolean;
    timestamp: number;
  } | null;
  winner?: 'p1' | 'p2' | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface MatchmakingPlayerProfile {
  uid: string;
  name: string;
  avatarId: string;
  level: number;
  deckSkinId: string;
}

/**
 * Generate or retrieve a persistent client ID for matchmaking across tabs
 */
export function getMatchmakingUid(): string {
  if (auth.currentUser?.uid) {
    return auth.currentUser.uid;
  }
  const storageKey = 'alphabet_royale_client_uid';
  let stored = localStorage.getItem(storageKey);
  if (!stored) {
    stored = 'guest_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem(storageKey, stored);
  }
  return stored;
}

/**
 * 1. Find an open room or create a new waiting room in `matches` collection
 */
export async function findOrCreateOnlineMatch(
  player: MatchmakingPlayerProfile,
  betAmount: number,
  potCoins: number,
  deckSize: number
): Promise<{
  matchId: string;
  role: 'host' | 'guest';
  matchedImmediately: boolean;
  initialDoc?: OnlineMatchDoc;
}> {
  try {
    const matchesRef = collection(db, 'matches');

    // Query for an open room with the same bet tier that is waiting for a guest
    const q = query(
      matchesRef,
      where('status', '==', 'waiting'),
      where('betAmount', '==', betAmount),
      limit(5)
    );

    const snapshot = await getDocs(q);
    let openDocId: string | null = null;
    let openDocData: OnlineMatchDoc | null = null;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as OnlineMatchDoc;
      // Do not join our own room if re-searching
      if (data.hostUid !== player.uid && data.status === 'waiting') {
        openDocId = docSnap.id;
        openDocData = data;
        break;
      }
    }

    // IF AN OPEN ROOM IS FOUND: Join as guestUid and set status = 'playing'
    if (openDocId && openDocData) {
      const matchDocRef = doc(db, 'matches', openDocId);
      const guestDeck = (openDocData.p2Deck && openDocData.p2Deck.length > 0)
        ? openDocData.p2Deck
        : createAlphabetDeck(deckSize, 'p2');

      await updateDoc(matchDocRef, {
        guestUid: player.uid,
        guestName: player.name,
        guestAvatarId: player.avatarId,
        guestLevel: player.level,
        guestDeckSkinId: player.deckSkinId,
        p2Deck: guestDeck,
        status: 'playing',
        updatedAt: serverTimestamp(),
      });

      return {
        matchId: openDocId,
        role: 'guest',
        matchedImmediately: true,
        initialDoc: {
          ...openDocData,
          id: openDocId,
          guestUid: player.uid,
          guestName: player.name,
          guestAvatarId: player.avatarId,
          guestLevel: player.level,
          guestDeckSkinId: player.deckSkinId,
          p2Deck: guestDeck,
          status: 'playing',
        },
      };
    }

    // IF NO OPEN ROOM EXISTS: Create a new match document with status = 'waiting'
    // Uses 100% true random Fisher-Yates shuffle on full A-Z card pool dealt evenly
    const { p1Deck: hostDeck, p2Deck: preDealtGuestDeck } = createAndDealAlphabetDecks(deckSize);
    const newDocData: Omit<OnlineMatchDoc, 'id'> = {
      status: 'waiting',
      betAmount,
      potCoins,
      deckSize,
      hostUid: player.uid,
      hostName: player.name,
      hostAvatarId: player.avatarId,
      hostLevel: player.level,
      hostDeckSkinId: player.deckSkinId,
      guestUid: null,
      guestName: null,
      guestAvatarId: null,
      guestLevel: null,
      guestDeckSkinId: null,
      p1Deck: hostDeck,
      p2Deck: preDealtGuestDeck,
      centerPot: [],
      turn: 'p1',
      lastThrownCard: null,
      lastAction: null,
      winner: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const createdRef = await addDoc(matchesRef, newDocData);
    return {
      matchId: createdRef.id,
      role: 'host',
      matchedImmediately: false,
    };
  } catch (err) {
    console.warn('Matchmaking Firestore error (using local match):', err);
    // Return simulated match ID if Firestore is unreachable/offline
    return {
      matchId: 'local_' + Date.now(),
      role: 'host',
      matchedImmediately: false,
    };
  }
}

/**
 * Cancel and remove a waiting match document
 */
export async function cancelOnlineMatch(matchId: string): Promise<void> {
  if (!matchId || matchId.startsWith('local_')) return;
  try {
    const matchDocRef = doc(db, 'matches', matchId);
    await updateDoc(matchDocRef, {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
    // Attempt delete after short delay
    setTimeout(() => {
      deleteDoc(matchDocRef).catch(() => {});
    }, 1000);
  } catch (err) {
    console.warn('Error cancelling match:', err);
  }
}

/**
 * Real-time listener for live match updates using onSnapshot
 */
export function subscribeToOnlineMatch(
  matchId: string,
  onUpdate: (data: OnlineMatchDoc) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  if (!matchId || matchId.startsWith('local_')) {
    return () => {};
  }
  try {
    const matchDocRef = doc(db, 'matches', matchId);
    return onSnapshot(
      matchDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = { id: snapshot.id, ...snapshot.data() } as OnlineMatchDoc;
          onUpdate(data);
        }
      },
      (err) => {
        console.warn('onSnapshot error:', err);
        onError?.(err);
      }
    );
  } catch (err) {
    console.warn('subscribeToOnlineMatch error:', err);
    onError?.(err);
    return () => {};
  }
}

/**
 * Execute real-time player card throw in Firestore
 */
export async function pushOnlineCardThrow(
  matchId: string,
  actor: 'p1' | 'p2',
  remainingDeck: CardItem[],
  updatedCenterPot: CardItem[],
  thrownCard: CardItem,
  isConsecutiveMatch: boolean,
  winner: 'p1' | 'p2' | null,
  extraState?: {
    p1Score?: number;
    p2Score?: number;
    p1Bank?: CardItem[];
    p2Bank?: CardItem[];
    fullP1Deck?: CardItem[];
    fullP2Deck?: CardItem[];
    isRedeal?: boolean;
    nextTurn?: 'p1' | 'p2';
    roundNumber?: number;
  }
): Promise<void> {
  if (!matchId || matchId.startsWith('local_')) return;
  try {
    const matchDocRef = doc(db, 'matches', matchId);
    const defaultNextTurn: 'p1' | 'p2' = actor === 'p1' ? 'p2' : 'p1';
    const updates: Partial<OnlineMatchDoc> = {
      centerPot: updatedCenterPot,
      lastThrownCard: thrownCard,
      turn: extraState?.nextTurn || defaultNextTurn,
      lastAction: {
        type: 'throw',
        actor,
        card: thrownCard,
        isConsecutiveMatch,
        isRedeal: extraState?.isRedeal || false,
        timestamp: Date.now(),
      },
      winner,
      status: winner ? 'completed' : 'playing',
      updatedAt: serverTimestamp(),
    };

    if (extraState?.p1Score !== undefined) updates.p1Score = extraState.p1Score;
    if (extraState?.p2Score !== undefined) updates.p2Score = extraState.p2Score;
    if (extraState?.p1Bank !== undefined) updates.p1Bank = extraState.p1Bank;
    if (extraState?.p2Bank !== undefined) updates.p2Bank = extraState.p2Bank;
    if (extraState?.roundNumber !== undefined) updates.roundNumber = extraState.roundNumber;

    if (extraState?.fullP1Deck && extraState?.fullP2Deck) {
      updates.p1Deck = extraState.fullP1Deck;
      updates.p2Deck = extraState.fullP2Deck;
    } else if (actor === 'p1') {
      updates.p1Deck = remainingDeck;
    } else {
      updates.p2Deck = remainingDeck;
    }

    await updateDoc(matchDocRef, updates);
  } catch (err) {
    console.warn('pushOnlineCardThrow error:', err);
  }
}

/**
 * Push in-game chat message or reaction to Firestore in real-time
 */
export async function pushOnlineSocialAction(
  matchId: string,
  actor: 'p1' | 'p2',
  actionType: 'chat' | 'reaction',
  content: string
): Promise<void> {
  if (!matchId || matchId.startsWith('local_')) return;
  try {
    const matchDocRef = doc(db, 'matches', matchId);
    await updateDoc(matchDocRef, {
      lastAction: {
        type: actionType,
        actor,
        text: actionType === 'chat' ? content : undefined,
        reaction: actionType === 'reaction' ? content : undefined,
        timestamp: Date.now(),
      },
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('pushOnlineSocialAction error:', err);
  }
}

/**
 * Forfeit an active online match when a player confirms "Leave Match"
 * Awards victory and the 2x pot to the remaining opponent in Firestore.
 */
export async function forfeitOnlineMatch(
  matchId: string,
  forfeitingActor: 'p1' | 'p2',
  winnerActor: 'p1' | 'p2'
): Promise<void> {
  if (!matchId || matchId.startsWith('local_')) return;
  try {
    const matchDocRef = doc(db, 'matches', matchId);
    await updateDoc(matchDocRef, {
      status: 'completed',
      winner: winnerActor,
      lastAction: {
        type: 'forfeit',
        actor: forfeitingActor,
        timestamp: Date.now(),
      },
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('forfeitOnlineMatch error:', err);
  }
}

/**
 * Syncs a player's custom arranged deck order after a Reverse / Return Cards re-deal phase in an online match.
 */
export async function pushOnlineRedealDeckOrder(
  matchId: string,
  actor: 'p1' | 'p2',
  orderedDeck: CardItem[]
): Promise<void> {
  if (!matchId || matchId.startsWith('local_')) return;
  try {
    const matchDocRef = doc(db, 'matches', matchId);
    const updates: Partial<OnlineMatchDoc> = {
      updatedAt: serverTimestamp(),
    };
    if (actor === 'p1') {
      updates.p1Deck = orderedDeck;
    } else {
      updates.p2Deck = orderedDeck;
    }
    await updateDoc(matchDocRef, updates);
  } catch (err) {
    console.warn('pushOnlineRedealDeckOrder error:', err);
  }
}

