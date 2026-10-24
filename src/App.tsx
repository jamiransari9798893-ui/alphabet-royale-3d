import React, { useEffect, useState } from 'react';
import { AdSimulatorModal } from './components/AdSimulatorModal';
import { ArenaScreen } from './components/ArenaScreen';
import { ArrangeScreen } from './components/ArrangeScreen';
import { CustomizerModal } from './components/CustomizerModal';
import { MatchmakingModal } from './components/MatchmakingModal';
import {
  CustomizerTab,
  GameMode,
  HomeScreen,
  SocialTab,
} from './components/HomeScreen';
import { SocialSpinModal } from './components/SocialSpinModal';
import {
  AuthProviderType,
  LoginScreen,
  SplashLoadingScreen,
} from './components/SplashAndLoginScreen';
import {
  DeckSkin,
  FIVE_TABLES,
  FriendEntry,
  STAKE_OPTIONS,
  StakeOption,
  TableSkin,
  THIRTY_DECK_SKINS,
} from './game/data';
import {
  calculateLevelFromXp,
  canUploadCustomPhotoDeck,
  CardItem,
  consumeSpinQuota,
  createAlphabetDeck,
  createAndDealAlphabetDecks,
  formatCoins,
  MAX_DAILY_SPINS,
  riffleShuffleDeck,
} from './game/rules';
import {
  auth,
  fetchUserProfileFromFirestore,
  onAuthStateChanged,
  syncUserProfileToFirestore,
  type User,
} from './firebase';
import {
  pickRandomIndianOpponent,
  triggerNativeInterstitialAd,
} from './utils/admob';
import { sound } from './utils/sound';

type ScreenPhase = 'splash' | 'login' | 'home' | 'arrange' | 'arena';

interface PersistedState {
  coins: number;
  xp: number;
  playerName: string;
  player2Name: string;
  playerCode: string;
  facebookLinked: boolean;
  selectedAvatarId: string;
  selectedDeckId: string;
  selectedTableId: string;
  selectedStakeId: string;
  selectedDeckSize: number;
  unlockedDeckIds: string[];
  unlockedTableIds: string[];
  unlockedAvatarIds: string[];
  adsRemaining: number;
  adCooldownSeconds: number;
  hourlyCooldownSeconds: number;
  spinsRemaining: number;
  spinCooldownSeconds: number;
  customPhotoUrl: string | null;
}

const STORAGE_KEY = 'alphabet_royale_3d_state_v2';

const DEFAULT_STATE: PersistedState = {
  coins: 8500,
  xp: 0,
  playerName: 'King Sovereign',
  player2Name: 'Aarav Sharma',
  playerCode: 'AR-FNCJ5Y',
  facebookLinked: false,
  selectedAvatarId: 'king-sovereign',
  selectedDeckId: 'pearl-white',
  selectedTableId: 'casino-green-velvet',
  selectedStakeId: '2k',
  selectedDeckSize: 30,
  unlockedDeckIds: ['pearl-white', 'obsidian-black'],
  unlockedTableIds: ['casino-green-velvet'],
  unlockedAvatarIds: ['king-sovereign', 'king-aurelius'],
  adsRemaining: 4,
  adCooldownSeconds: 0,
  hourlyCooldownSeconds: 0,
  spinsRemaining: MAX_DAILY_SPINS,
  spinCooldownSeconds: 0,
  customPhotoUrl: null,
};

export default function App() {
  const [state, setState] = useState<PersistedState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_STATE,
          ...parsed,
          spinsRemaining:
            typeof parsed.spinsRemaining === 'number' &&
            Number.isFinite(parsed.spinsRemaining)
              ? parsed.spinsRemaining
              : MAX_DAILY_SPINS,
          spinCooldownSeconds:
            typeof parsed.spinCooldownSeconds === 'number' &&
            Number.isFinite(parsed.spinCooldownSeconds)
              ? parsed.spinCooldownSeconds
              : 0,
        };
      }
    } catch {
      // Fallback to default state
    }
    return DEFAULT_STATE;
  });

  const [screenPhase, setScreenPhase] = useState<ScreenPhase>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        return 'arrange';
      }
      if (params.get('screen') === 'home') {
        return 'home';
      }
      if (params.get('screen') === 'arena') {
        return 'arena';
      }
      if (params.get('screen') === 'login') {
        return 'login';
      }
    }
    return 'splash';
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('online');
  const [customizerTab, setCustomizerTab] = useState<CustomizerTab | null>(null);
  const [socialTab, setSocialTab] = useState<SocialTab | null>(null);
  const [showAdSimulator, setShowAdSimulator] = useState<boolean>(false);
  const [showPostMatchInterstitial, setShowPostMatchInterstitial] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastIsSuccess, setToastIsSuccess] = useState<boolean>(false);

  // Active Match Decks
  const [matchP1Deck, setMatchP1Deck] = useState<CardItem[]>(() =>
    createAlphabetDeck(30, 'p1')
  );
  const [matchP2Deck, setMatchP2Deck] = useState<CardItem[]>(() =>
    riffleShuffleDeck(createAlphabetDeck(30, 'p2'))
  );
  const [opponentInfo, setOpponentInfo] = useState<{
    name: string;
    avatarId: string;
    level: number;
  }>({
    name: 'Aarav Sharma',
    avatarId: 'viktor-ace',
    level: 14,
  });

  // Real-Time Online Matchmaking State
  const [showMatchmaking, setShowMatchmaking] = useState<boolean>(false);
  const [isRealOnlineMatch, setIsRealOnlineMatch] = useState<boolean>(false);
  const [onlineMatchId, setOnlineMatchId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<'p1' | 'p2'>('p1');
  const [customOpponentDeckSkin, setCustomOpponentDeckSkin] = useState<DeckSkin | null>(null);

  // Listen for real Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        const cloudProfile = await fetchUserProfileFromFirestore(user.uid);
        if (cloudProfile) {
          setState((prev) => ({
            ...prev,
            coins:
              typeof cloudProfile.coins === 'number'
                ? cloudProfile.coins
                : prev.coins,
            xp: typeof cloudProfile.xp === 'number' ? cloudProfile.xp : prev.xp,
            selectedDeckId: cloudProfile.selectedDeckId || prev.selectedDeckId,
            playerName:
              cloudProfile.playerName || user.displayName || prev.playerName,
          }));
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Save state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  // Sync body data-state attribute for verification
  useEffect(() => {
    document.body.dataset.state =
      screenPhase === 'splash' || screenPhase === 'login' || screenPhase === 'home'
        ? 'title'
        : screenPhase === 'arrange'
        ? 'arrange'
        : 'playing';
  }, [screenPhase]);

  // Tick 1-second cooldown timers for 4-Hour Ad Cooldown, Hourly Vault & 24-Hour Spin Limit
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        if (
          prev.adCooldownSeconds <= 0 &&
          prev.hourlyCooldownSeconds <= 0 &&
          prev.spinCooldownSeconds <= 0
        ) {
          return prev;
        }
        const nextAdCooldown = Math.max(0, prev.adCooldownSeconds - 1);
        const nextHourly = Math.max(0, prev.hourlyCooldownSeconds - 1);
        const nextSpinCooldown = Math.max(0, prev.spinCooldownSeconds - 1);
        return {
          ...prev,
          adCooldownSeconds: nextAdCooldown,
          adsRemaining:
            prev.adCooldownSeconds > 0 && nextAdCooldown === 0
              ? 4
              : prev.adsRemaining,
          hourlyCooldownSeconds: nextHourly,
          spinCooldownSeconds: nextSpinCooldown,
          spinsRemaining:
            prev.spinCooldownSeconds > 0 && nextSpinCooldown === 0
              ? MAX_DAILY_SPINS
              : prev.spinsRemaining,
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string, isSuccess = false) => {
    setToastMessage(msg);
    setToastIsSuccess(isSuccess);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const levelInfo = calculateLevelFromXp(state.xp);
  const selectedDeck: DeckSkin =
    THIRTY_DECK_SKINS.find((d) => d.id === state.selectedDeckId) ||
    THIRTY_DECK_SKINS[0];
  // Opponent uses a distinct luxury deck skin so P1 and P2 cards are clearly differentiated
  const opponentDeck: DeckSkin =
    customOpponentDeckSkin || (
    selectedDeck.id === 'obsidian-black'
      ? THIRTY_DECK_SKINS.find((d) => d.id === 'cyber-neon') || THIRTY_DECK_SKINS[2]
      : THIRTY_DECK_SKINS.find((d) => d.id === 'obsidian-black') ||
        THIRTY_DECK_SKINS[1]);
  const selectedTable: TableSkin =
    FIVE_TABLES.find((t) => t.id === state.selectedTableId) || FIVE_TABLES[0];
  const selectedStake: StakeOption =
    STAKE_OPTIONS.find((s) => s.id === state.selectedStakeId) || STAKE_OPTIONS[0];

  const handleToggleMute = () => {
    const nextMuted = !muted;
    sound.muted = nextMuted;
    setMuted(nextMuted);
    if (!nextMuted) {
      sound.playClick(1.2);
    }
  };

  const handleSelectAuth = (
    user: User | null,
    provider: AuthProviderType
  ) => {
    // Transition immediately to home screen
    setScreenPhase('home');

    if (user) {
      setCurrentUserId(user.uid);
      if (provider === 'google') {
        showToast(
          `Signed in with Google! Welcome, ${user.displayName || 'King Sovereign'}`,
          true
        );
      } else {
        showToast('Signed in as Guest! Welcome to Royal Salon.', true);
      }

      // Background Firestore profile sync
      (async () => {
        try {
          const cloudProfile = await fetchUserProfileFromFirestore(user.uid);
          if (cloudProfile) {
            setState((prev) => ({
              ...prev,
              coins:
                typeof cloudProfile.coins === 'number'
                  ? cloudProfile.coins
                  : prev.coins,
              xp: typeof cloudProfile.xp === 'number' ? cloudProfile.xp : prev.xp,
              selectedDeckId: cloudProfile.equippedDeck || cloudProfile.selectedDeckId || prev.selectedDeckId,
              playerName:
                cloudProfile.playerName || user.displayName || prev.playerName,
            }));
          } else {
            await syncUserProfileToFirestore(user.uid, {
              coins: state.coins ?? 8500,
              xp: state.xp ?? 0,
              level: levelInfo.level || 1,
              equippedDeck: state.selectedDeckId || 'pearl-white',
              selectedDeckId: state.selectedDeckId || 'pearl-white',
              playerName:
                user.displayName ||
                (provider === 'guest' ? 'Royal Guest' : state.playerName),
              email: user.email,
              isAnonymous: user.isAnonymous,
            });
          }
        } catch (err) {
          console.warn('Initial Firestore sync error:', err);
        }
      })();
    } else {
      showToast('Signed in as Guest! Welcome to Royal Salon.', true);
    }
  };

  const handleLinkFacebook = () => {
    if (state.facebookLinked) {
      showToast('Facebook ID is already linked to AR-FNCJ5Y!');
      return;
    }
    setState((prev) => ({
      ...prev,
      facebookLinked: true,
      coins: prev.coins + 1000,
    }));
    showToast('Facebook ID Linked! +1,000 Bonus Coins credited!');
  };

  const syncCloudProfile = (changes: {
    coins?: number;
    xp?: number;
    level?: number;
    selectedDeckId?: string;
    equippedDeck?: string;
    selectedTableId?: string;
    selectedAvatarId?: string;
  }) => {
    if (currentUserId) {
      const payload = {
        ...changes,
        equippedDeck: changes.equippedDeck || changes.selectedDeckId,
      };
      syncUserProfileToFirestore(currentUserId, payload);
    }
  };

  const handleStartMatch = (
    mode: GameMode,
    customOpponent?: { name: string; avatarId: string; level: number }
  ) => {
    let activeStake = selectedStake;
    if (mode !== 'practice' && state.coins < selectedStake.entryCoins) {
      if (state.coins >= STAKE_OPTIONS[0].entryCoins) {
        activeStake = STAKE_OPTIONS[0];
        setState((prev) => ({ ...prev, selectedStakeId: STAKE_OPTIONS[0].id }));
      } else {
        setState((prev) => ({ ...prev, coins: prev.coins + 2000 }));
        syncCloudProfile({ coins: state.coins + 2000 });
        showToast('Royal Vault Bailout: +2,000 Coins credited for entry!');
      }
    }

    if (mode !== 'practice') {
      const nextCoins = Math.max(0, state.coins - activeStake.entryCoins);
      setState((prev) => ({
        ...prev,
        coins: nextCoins,
      }));
      syncCloudProfile({ coins: nextCoins });
    }

    // 100% True Random Fisher-Yates dealing from combined A-Z card pool
    const { p1Deck: freshP1, p2Deck: freshP2 } = createAndDealAlphabetDecks(state.selectedDeckSize);

    setMatchP1Deck(freshP1);
    setMatchP2Deck(freshP2);
    setGameMode(mode);
    setCustomizerTab(null);
    setSocialTab(null);

    if (customOpponent) {
      setOpponentInfo(customOpponent);
      setIsRealOnlineMatch(false);
      setOnlineMatchId(null);
      setMyRole('p1');
      setCustomOpponentDeckSkin(null);
      setScreenPhase('arrange');
    } else if (mode === 'online') {
      // 1. OPEN REAL-TIME FIRESTORE MATCHMAKING QUEUE (WITH 8S SMART AI FALLBACK)
      setShowMatchmaking(true);
    } else if (mode === 'pass') {
      setIsRealOnlineMatch(false);
      setOnlineMatchId(null);
      setMyRole('p1');
      setCustomOpponentDeckSkin(null);
      setOpponentInfo({
        name: state.player2Name,
        avatarId: 'empress-cleo',
        level: levelInfo.level,
      });
      setScreenPhase('arrange');
    } else if (mode === 'practice') {
      const challenger = pickRandomIndianOpponent(state.playerName);
      setIsRealOnlineMatch(false);
      setOnlineMatchId(null);
      setMyRole('p1');
      setCustomOpponentDeckSkin(null);
      setOpponentInfo({
        name: challenger.name,
        avatarId: 'viktor-ace',
        level: Math.max(1, levelInfo.level),
      });
      setScreenPhase('arrange');
    }
  };

  const handleOnlineMatchFound = (config: {
    isRealOnline: boolean;
    onlineMatchId: string | null;
    myRole: 'p1' | 'p2';
    opponent: {
      name: string;
      avatarId: string;
      level: number;
      deckSkin: DeckSkin;
    };
    initialDoc?: any;
  }) => {
    setIsRealOnlineMatch(config.isRealOnline);
    setOnlineMatchId(config.onlineMatchId);
    setMyRole(config.myRole);
    setOpponentInfo({
      name: config.opponent.name,
      avatarId: config.opponent.avatarId,
      level: config.opponent.level,
    });
    setCustomOpponentDeckSkin(config.opponent.deckSkin);
    setShowMatchmaking(false);

    if (config.initialDoc) {
      if (config.initialDoc.p1Deck && config.initialDoc.p1Deck.length > 0) {
        setMatchP1Deck(config.initialDoc.p1Deck);
      }
      if (config.initialDoc.p2Deck && config.initialDoc.p2Deck.length > 0) {
        setMatchP2Deck(config.initialDoc.p2Deck);
      }
    }

    setScreenPhase('arrange');
    showToast(
      config.isRealOnline
        ? `Real 1v1 Opponent Connected: ${config.opponent.name}!`
        : `Royal Challenger Matched: ${config.opponent.name}!`,
      true
    );
  };

  const handleCancelMatchmaking = () => {
    const refundedCoins = state.coins + selectedStake.entryCoins;
    setState((prev) => ({
      ...prev,
      coins: refundedCoins,
    }));
    syncCloudProfile({ coins: refundedCoins });
    setShowMatchmaking(false);
    showToast(`Matchmaking cancelled. ${formatCoins(selectedStake.entryCoins)} Coins refunded.`);
  };

  const handleLockAndStartArena = (
    p1Ordered: CardItem[],
    p2Ordered: CardItem[]
  ) => {
    // Strictly 100% blind top card throwing - no scripted or forced matches
    setMatchP1Deck(
      p1Ordered.map((c) => ({ ...c, owner: 'p1', thrownBy: 'player1' }))
    );
    setMatchP2Deck(
      p2Ordered.map((c) => ({ ...c, owner: 'p2', thrownBy: 'player2' }))
    );

    setScreenPhase('arena');
  };

  const handleOpponentTimeoutWin = () => {
    const potWon = gameMode === 'practice' ? 1000 : selectedStake.potCoins;
    const nextCoins = state.coins + potWon;
    const nextXp = state.xp + 120;
    const nextLevel = calculateLevelFromXp(nextXp).level;
    setState((prev) => ({
      ...prev,
      coins: nextCoins,
      xp: nextXp,
    }));
    syncCloudProfile({ coins: nextCoins, xp: nextXp, level: nextLevel });
    showToast(`Opponent 60s Timeout! You won +${formatCoins(potWon)} Coins!`);
    setScreenPhase('home');
  };

  const handleMatchComplete = (
    winner: 'p1' | 'p2',
    winningLetter: string,
    potWon: number,
    xpEarned: number
  ) => {
    const isLocalWinner = isRealOnlineMatch && myRole ? winner === myRole : winner === 'p1';
    const nextCoins = isLocalWinner ? state.coins + potWon : state.coins;
    const nextXp = state.xp + xpEarned;
    const nextLevel = calculateLevelFromXp(nextXp).level;
    setState((prev) => ({
      ...prev,
      coins: nextCoins,
      xp: nextXp,
    }));
    syncCloudProfile({ coins: nextCoins, xp: nextXp, level: nextLevel });
    if (isLocalWinner) {
      showToast(
        `Royal Snap '${winningLetter}'! +${formatCoins(potWon)} Coins & +${xpEarned} XP!`,
        true
      );
    } else {
      showToast(`Match Complete (+${xpEarned} XP). Better luck next time!`);
    }
    setScreenPhase('home');
    triggerNativeInterstitialAd().catch(() => {});
    setShowPostMatchInterstitial(true);
  };

  const handleClaimHourly = () => {
    if (state.hourlyCooldownSeconds > 0) {
      showToast('Hourly Vault is recharging! Check the countdown timer.');
      return;
    }
    sound.playCoinChime(6);
    const nextCoins = state.coins + 1500;
    setState((prev) => ({
      ...prev,
      coins: nextCoins,
      hourlyCooldownSeconds: 3600,
    }));
    syncCloudProfile({ coins: nextCoins });
    showToast('+1,500 Virtual Coins claimed from Hourly Royal Vault!', true);
  };

  const handleCompleteAdWatch = () => {
    setShowAdSimulator(false);
    const nextCoins = state.coins + 500;
    setState((prev) => {
      const nextRemaining = Math.max(0, prev.adsRemaining - 1);
      const nextCooldown = nextRemaining === 0 ? 14399 : 0;
      return {
        ...prev,
        coins: nextCoins,
        adsRemaining: nextRemaining,
        adCooldownSeconds: nextCooldown,
      };
    });
    syncCloudProfile({ coins: nextCoins });
    showToast('+500 Gold Coins credited from Royal Broadcast!', true);
  };

  const handleUnlockDeck = (deck: DeckSkin) => {
    if (state.coins < deck.priceCoins) {
      showToast(`Need ${formatCoins(deck.priceCoins)} Coins to unlock ${deck.name}!`);
      return;
    }
    sound.playCoinChime(4);
    const nextCoins = state.coins - deck.priceCoins;
    setState((prev) => ({
      ...prev,
      coins: nextCoins,
      unlockedDeckIds: [...prev.unlockedDeckIds, deck.id],
      selectedDeckId: deck.id,
    }));
    syncCloudProfile({ coins: nextCoins, selectedDeckId: deck.id });
    showToast(`Unlocked & Equipped ${deck.name}!`, true);
  };

  const handleUnlockTable = (table: TableSkin) => {
    if (state.coins < table.priceCoins) {
      showToast(`Need ${formatCoins(table.priceCoins)} Coins to unlock ${table.name}!`);
      return;
    }
    sound.playCoinChime(4);
    const nextCoins = state.coins - table.priceCoins;
    setState((prev) => ({
      ...prev,
      coins: nextCoins,
      unlockedTableIds: [...prev.unlockedTableIds, table.id],
      selectedTableId: table.id,
    }));
    syncCloudProfile({ coins: nextCoins, selectedTableId: table.id });
    showToast(`Unlocked & Equipped ${table.name}!`, true);
  };

  const handleFinishedLoading = React.useCallback(() => {
    setScreenPhase('login');
  }, []);

  return (
    <div
      className="w-screen h-[100dvh] overflow-hidden flex items-center justify-center relative"
      style={{
        background:
          'radial-gradient(circle at center, #0d3b24 0%, #071910 45%, #040806 100%)',
      }}
    >
      {/* Strict Mobile Portrait Locked Container (max-width: 430px, height: 100dvh, margin: 0 auto, overflow-x: hidden) */}
      <div
        className="relative w-full max-w-[430px] h-[100dvh] mx-auto overflow-x-hidden overflow-y-hidden flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.95)]"
        style={{
          background:
            'radial-gradient(ellipse at top, #0f4429 0%, #07170f 55%, #050a07 100%)',
          borderLeft: '1px solid rgba(212, 175, 55, 0.35)',
          borderRight: '1px solid rgba(212, 175, 55, 0.35)',
        }}
      >
        {/* Toast Feedback Banner (Gold or Emerald Success) */}
        {toastMessage && (
          <div
            role="status"
            className={`fixed top-16 left-1/2 -translate-x-1/2 z-[70] px-4 py-2 rounded-full ${
              toastIsSuccess
                ? 'bg-emerald-950/95 border-2 border-emerald-400 text-emerald-100 shadow-[0_0_24px_rgba(16,185,129,0.85)]'
                : 'bg-obsidian-panel border-gold-glow text-[#ffe082]'
            } text-xs font-display font-extrabold whitespace-nowrap shadow-2xl flex items-center gap-1.5`}
          >
            {toastIsSuccess ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ) : null}
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 0A. SPLASH CARD-DEALING LOADING SCREEN (0% TO 100%) */}
        {screenPhase === 'splash' && (
          <SplashLoadingScreen
            onFinishedLoading={handleFinishedLoading}
          />
        )}

        {/* 0B. ROYAL LOGIN SCREEN */}
        {screenPhase === 'login' && (
          <LoginScreen
            playerCode={state.playerCode}
            onSelectAuth={handleSelectAuth}
            onErrorToast={(msg) => showToast(msg, false)}
          />
        )}

        {/* 1. HOME SCREEN */}
        {screenPhase === 'home' && (
          <HomeScreen
            coins={state.coins}
            level={levelInfo.level}
            playerName={state.playerName}
            playerCode={state.playerCode}
            selectedAvatarId={state.selectedAvatarId}
            selectedDeck={selectedDeck}
            selectedTable={selectedTable}
            selectedStake={selectedStake}
            selectedDeckSize={state.selectedDeckSize}
            adsRemaining={state.adsRemaining}
            adCooldownSeconds={state.adCooldownSeconds}
            hourlyCooldownSeconds={state.hourlyCooldownSeconds}
            customPhotoUrl={state.customPhotoUrl}
            muted={muted}
            onToggleMute={handleToggleMute}
            onSelectStake={(stake) =>
              setState((prev) => ({ ...prev, selectedStakeId: stake.id }))
            }
            onSelectDeckSize={(size) =>
              setState((prev) => ({ ...prev, selectedDeckSize: size }))
            }
            onStartMatch={(mode) => handleStartMatch(mode)}
            onOpenCustomizer={(tab) => setCustomizerTab(tab)}
            onOpenSocial={(tab) => setSocialTab(tab)}
            onClaimHourly={handleClaimHourly}
            onWatchAdDirect={() => {
              if (state.adCooldownSeconds > 0) {
                showToast('Ad Vault is on 4-Hour Cooldown!');
              } else {
                setShowAdSimulator(true);
              }
            }}
            onBackToLogin={() => {
              setCustomizerTab(null);
              setSocialTab(null);
              setScreenPhase('login');
            }}
          />
        )}

        {/* 2. 60-SECOND PRE-MATCH CARD ARRANGE SCREEN */}
        {screenPhase === 'arrange' && (
          <ArrangeScreen
            mode={gameMode}
            stake={selectedStake}
            deckSize={state.selectedDeckSize}
            player1Name={state.playerName}
            player2Name={opponentInfo.name}
            selectedDeckSkin={selectedDeck}
            opponentDeckSkin={opponentDeck}
            customPhotoUrl={state.customPhotoUrl}
            initialP1Deck={matchP1Deck}
            initialP2Deck={matchP2Deck}
            myRole={myRole}
            onLockAndStartMatch={handleLockAndStartArena}
            onOpponentTimeoutWin={handleOpponentTimeoutWin}
            onCancelToHome={() => setScreenPhase('home')}
          />
        )}

        {/* 3. LIVE 3D VELVET TABLE ARENA */}
        {screenPhase === 'arena' && (
          <ArenaScreen
            mode={gameMode}
            stake={selectedStake}
            selectedTable={selectedTable}
            selectedDeckSkin={selectedDeck}
            opponentDeckSkin={opponentDeck}
            customPhotoUrl={state.customPhotoUrl}
            player1Name={state.playerName}
            player1AvatarId={state.selectedAvatarId}
            player1Level={levelInfo.level}
            player2Name={opponentInfo.name}
            player2AvatarId={opponentInfo.avatarId}
            player2Level={opponentInfo.level}
            initialP1Deck={matchP1Deck}
            initialP2Deck={matchP2Deck}
            isRealOnlineMatch={isRealOnlineMatch}
            onlineMatchId={onlineMatchId}
            myRole={myRole}
            onMatchComplete={handleMatchComplete}
            onExitArena={() => {
              setIsRealOnlineMatch(false);
              setOnlineMatchId(null);
              setScreenPhase('home');
              showToast('You left the match (forfeited entry bet).');
            }}
          />
        )}

        {/* Real-time 1v1 Online Matchmaking Queue Modal (with 8s Smart AI Fallback) */}
        {showMatchmaking && (
          <MatchmakingModal
            stake={selectedStake}
            deckSize={state.selectedDeckSize}
            playerName={state.playerName}
            playerAvatarId={state.selectedAvatarId}
            playerLevel={levelInfo.level}
            selectedDeckSkin={selectedDeck}
            onMatchFound={handleOnlineMatchFound}
            onCancel={handleCancelMatchmaking}
          />
        )}

        {/* Customizer Modal (30 Decks, Tables, Free Coins, Profile) */}
        {customizerTab !== null && (
          <CustomizerModal
            activeTab={customizerTab}
            onChangeTab={(tab) => setCustomizerTab(tab)}
            onClose={() => setCustomizerTab(null)}
            coins={state.coins}
            level={levelInfo.level}
            xpProgressPercent={levelInfo.progressPercent}
            playerName={state.playerName}
            player2Name={state.player2Name}
            playerCode={state.playerCode}
            facebookLinked={state.facebookLinked}
            selectedAvatarId={state.selectedAvatarId}
            selectedDeckId={state.selectedDeckId}
            selectedTableId={state.selectedTableId}
            unlockedDeckIds={state.unlockedDeckIds}
            unlockedTableIds={state.unlockedTableIds}
            unlockedAvatarIds={state.unlockedAvatarIds}
            customPhotoUrl={state.customPhotoUrl}
            adsRemaining={state.adsRemaining}
            adCooldownSeconds={state.adCooldownSeconds}
            hourlyCooldownSeconds={state.hourlyCooldownSeconds}
            onSelectDeck={(deck) => {
              setState((prev) => ({ ...prev, selectedDeckId: deck.id }));
              syncCloudProfile({ selectedDeckId: deck.id });
              showToast(`Equipped ${deck.name}!`);
            }}
            onUnlockDeck={handleUnlockDeck}
            onSelectTable={(table) => {
              setState((prev) => ({ ...prev, selectedTableId: table.id }));
              syncCloudProfile({ selectedTableId: table.id });
              showToast(`Selected ${table.name}!`);
            }}
            onUnlockTable={handleUnlockTable}
            onSelectAvatar={(avatarId) => {
              setState((prev) => ({
                ...prev,
                selectedAvatarId: avatarId,
                unlockedAvatarIds: prev.unlockedAvatarIds.includes(avatarId)
                  ? prev.unlockedAvatarIds
                  : [...prev.unlockedAvatarIds, avatarId],
              }));
              syncCloudProfile({ selectedAvatarId: avatarId });
              showToast('Royal 3D Avatar Equipped!');
            }}
            onUpdateNames={(p1, p2) => {
              setState((prev) => ({
                ...prev,
                playerName: p1,
                player2Name: p2,
              }));
              if (currentUserId) {
                syncUserProfileToFirestore(currentUserId, { playerName: p1 });
              }
            }}
            onUploadCustomPhoto={(dataUrl) => {
              if (!canUploadCustomPhotoDeck(levelInfo.level)) {
                showToast('Locked • Requires Level 100 to upload custom photo deck!');
                return;
              }
              setState((prev) => ({
                ...prev,
                customPhotoUrl: dataUrl,
                unlockedDeckIds: prev.unlockedDeckIds.includes('custom-photo-100')
                  ? prev.unlockedDeckIds
                  : [...prev.unlockedDeckIds, 'custom-photo-100'],
                selectedDeckId: 'custom-photo-100',
              }));
              syncCloudProfile({ selectedDeckId: 'custom-photo-100' });
              showToast('Custom Photo Deck Uploaded & Equipped!');
            }}
            onStartWatchAd={() => setShowAdSimulator(true)}
            onClaimHourly={handleClaimHourly}
            onLinkFacebook={handleLinkFacebook}
            onBackToLogin={() => {
              setCustomizerTab(null);
              setScreenPhase('login');
            }}
          />
        )}

        {/* Social & Spin Modal (Friends, Lucky Spin, Top 100) */}
        {socialTab !== null && (
          <SocialSpinModal
            activeTab={socialTab}
            onChangeTab={(tab) => setSocialTab(tab)}
            onClose={() => setSocialTab(null)}
            coins={state.coins}
            level={levelInfo.level}
            playerName={state.playerName}
            playerCode={state.playerCode}
            selectedAvatarId={state.selectedAvatarId}
            spinsRemaining={state.spinsRemaining}
            spinCooldownSeconds={state.spinCooldownSeconds}
            onConsumeSpin={() => {
              const check = consumeSpinQuota(
                state.spinsRemaining,
                state.spinCooldownSeconds
              );
              if (!check.allowed) {
                showToast('Daily Spins exhausted! Wait for the 24-hour timer.');
                return false;
              }
              setState((prev) => ({
                ...prev,
                spinsRemaining: check.nextSpinsRemaining,
                spinCooldownSeconds: check.nextSpinCooldownSeconds,
              }));
              return true;
            }}
            onAwardSpinCoins={(amount) => {
              const nextCoins = state.coins + amount;
              setState((prev) => ({ ...prev, coins: nextCoins }));
              syncCloudProfile({ coins: nextCoins });
              showToast(`Lucky Spin Won +${formatCoins(amount)} Coins!`, true);
            }}
            onInviteFriendMatch={(friend: FriendEntry) => {
              handleStartMatch('online', {
                name: friend.name,
                avatarId: friend.avatarId,
                level: friend.level,
              });
            }}
          />
        )}

        {/* 5-Second Rewarded Video Ad Modal (6957023022) */}
        {showAdSimulator && (
          <AdSimulatorModal
            mode="rewarded"
            adsRemainingBeforeWatch={state.adsRemaining}
            onCompleteAd={handleCompleteAdWatch}
            onClose={() => setShowAdSimulator(false)}
          />
        )}

        {/* Post-Match Interstitial Ad Modal (4678344042) */}
        {showPostMatchInterstitial && (
          <AdSimulatorModal
            mode="interstitial"
            adsRemainingBeforeWatch={state.adsRemaining}
            onCompleteAd={() => setShowPostMatchInterstitial(false)}
            onClose={() => setShowPostMatchInterstitial(false)}
          />
        )}
      </div>
    </div>
  );
}
