import React, { useState } from 'react';
import {
  Check,
  CircleDot,
  Clock,
  Coins,
  Copy,
  Disc,
  Layers,
  LogIn,
  Play,
  Sparkles,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  DECK_SIZES,
  DeckSkin,
  STAKE_OPTIONS,
  StakeOption,
  TableSkin,
  THIRTY_DECK_SKINS,
} from '../game/data';
import { formatCoins, formatCooldownHMS } from '../game/rules';
import { ADMOB_CONFIG, initNativeBannerAd } from '../utils/admob';
import { sound } from '../utils/sound';
import { Card3D } from './Card3D';
import { RoyalAvatar } from './RoyalAvatarSvg';

export type GameMode = 'online' | 'pass' | 'practice';
export type CustomizerTab = 'decks' | 'tables' | 'coins' | 'profile';
export type SocialTab = 'friends' | 'spin' | 'top100';

interface HomeScreenProps {
  coins: number;
  level: number;
  playerName: string;
  playerCode: string;
  selectedAvatarId: string;
  selectedDeck: DeckSkin;
  selectedTable: TableSkin;
  selectedStake: StakeOption;
  selectedDeckSize: number;
  adsRemaining: number;
  adCooldownSeconds: number;
  hourlyCooldownSeconds: number;
  customPhotoUrl: string | null;
  muted: boolean;
  onToggleMute: () => void;
  onSelectStake: (stake: StakeOption) => void;
  onSelectDeckSize: (size: number) => void;
  onStartMatch: (mode: GameMode) => void;
  onOpenCustomizer: (tab: CustomizerTab) => void;
  onOpenSocial: (tab: SocialTab) => void;
  onClaimHourly: () => void;
  onWatchAdDirect: () => void;
  onBackToLogin: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  coins,
  level,
  playerName,
  playerCode,
  selectedAvatarId,
  selectedDeck,
  selectedTable,
  selectedStake,
  selectedDeckSize,
  adsRemaining,
  adCooldownSeconds,
  hourlyCooldownSeconds,
  customPhotoUrl,
  muted,
  onToggleMute,
  onSelectStake,
  onSelectDeckSize,
  onStartMatch,
  onOpenCustomizer,
  onOpenSocial,
  onClaimHourly,
  onWatchAdDirect,
  onBackToLogin,
}) => {
  const [copiedId, setCopiedId] = useState(false);

  React.useEffect(() => {
    initNativeBannerAd();
  }, []);

  const handleCopyId = () => {
    sound.playClick(1.15);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(playerCode).catch(() => {});
    }
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1600);
  };

  const stakeButtonClasses = (stake: StakeOption, isSelected: boolean) => {
    const schemeMap: Record<StakeOption['colorScheme'], string> = {
      green: isSelected
        ? 'bg-gradient-to-b from-emerald-400 via-emerald-600 to-emerald-900 border-amber-300 text-white shadow-[0_0_12px_rgba(16,185,129,0.6)]'
        : 'bg-emerald-950/80 border-emerald-600/60 text-emerald-200',
      blue: isSelected
        ? 'bg-gradient-to-b from-blue-400 via-blue-600 to-blue-900 border-amber-300 text-white shadow-[0_0_12px_rgba(59,130,246,0.6)]'
        : 'bg-blue-950/80 border-blue-600/60 text-blue-200',
      purple: isSelected
        ? 'bg-gradient-to-b from-purple-400 via-purple-600 to-purple-900 border-amber-300 text-white shadow-[0_0_12px_rgba(168,85,247,0.6)]'
        : 'bg-purple-950/80 border-purple-600/60 text-purple-200',
      red: isSelected
        ? 'bg-gradient-to-b from-red-400 via-red-600 to-red-900 border-amber-300 text-white shadow-[0_0_12px_rgba(239,68,68,0.6)]'
        : 'bg-red-950/80 border-red-600/60 text-red-200',
      gold: isSelected
        ? 'bg-gradient-to-b from-amber-300 via-amber-500 to-amber-800 border-white text-amber-950 shadow-[0_0_12px_rgba(245,176,65,0.75)]'
        : 'bg-amber-950/80 border-amber-500/60 text-amber-200',
      emerald: isSelected
        ? 'bg-gradient-to-b from-teal-300 via-emerald-600 to-teal-950 border-amber-300 text-white shadow-[0_0_12px_rgba(20,184,166,0.7)]'
        : 'bg-teal-950/80 border-teal-500/60 text-teal-200',
    };
    return schemeMap[stake.colorScheme];
  };

  return (
    <div className="flex flex-col justify-between w-full h-full px-3 pt-2 pb-2 select-none overflow-hidden">
      {/* 1. TOP ROYAL HEADER */}
      <header className="relative z-20 flex flex-col gap-1.5 px-2.5 py-2 rounded-2xl bg-obsidian-panel border-gold-metallic">
        <div className="flex items-center justify-between gap-1.5">
          {/* Left: Golden [Spin] button + green [Hourly +1.5K] pill */}
          <div className="flex flex-col gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                sound.playClick(1.1);
                onOpenSocial('spin');
              }}
              className="px-2.5 py-1 rounded-lg btn-3d-gold text-[11px] font-extrabold tracking-wide flex items-center justify-center gap-1.5 active:scale-95 transition-transform whitespace-nowrap"
            >
              <Disc className="w-3.5 h-3.5 text-[#1c1102]" />
              <span>Spin</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playClick(1.05);
                onClaimHourly();
              }}
              className="px-2 py-1 rounded-lg bg-gradient-to-b from-emerald-500 via-emerald-700 to-emerald-950 border border-emerald-300/80 text-[#fef9e7] text-[10px] font-bold tracking-tight shadow flex items-center justify-center gap-1 active:scale-95 transition-transform whitespace-nowrap"
            >
              <Clock className="w-3 h-3 text-emerald-200" />
              <span>
                {hourlyCooldownSeconds > 0
                  ? formatCooldownHMS(hourlyCooldownSeconds).slice(3)
                  : 'Hourly +1.5K'}
              </span>
            </button>
          </div>

          {/* Center: Golden Lion Crown Avatar with Lv.1 badge, name "King Sovereign", Copyable ID & Login/Switch ID */}
          <div className="flex flex-col items-center min-w-0 px-1">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onOpenCustomizer('profile');
              }}
              aria-label={`Open Profile for ${playerName}`}
              className="group flex flex-col items-center focus:outline-none active:scale-95 transition-transform"
            >
              <RoyalAvatar avatarId={selectedAvatarId} size="md" levelBadge={level} />
              <span className="mt-1.5 text-xs font-display font-extrabold text-[#fde68a] tracking-wide truncate max-w-[125px] drop-shadow">
                {playerName}
              </span>
            </button>

            <div className="mt-0.5 flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopyId}
                className="px-1.5 py-0.5 rounded bg-black/60 border border-amber-500/40 text-[9px] font-mono-num text-amber-200/95 hover:border-amber-400 flex items-center gap-1 active:scale-95 transition-transform whitespace-nowrap"
              >
                {copiedId ? (
                  <>
                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                    <span>COPIED</span>
                  </>
                ) : (
                  <>
                    <span>ID: {playerCode}</span>
                    <Copy className="w-2.5 h-2.5 text-[#f5b041]" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick(1.1);
                  onBackToLogin();
                }}
                aria-label="Login or Switch ID"
                className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-[8px] font-display font-extrabold text-[#ffe082] hover:bg-amber-500/30 flex items-center gap-0.5 active:scale-95 transition-transform whitespace-nowrap"
              >
                <LogIn className="w-2.5 h-2.5 text-[#f5b041]" />
                <span>Switch ID</span>
              </button>
            </div>
          </div>

          {/* Right: Gold coin counter 8,500 (+) and [+500 Ad (4/4)] button */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onOpenCustomizer('coins');
                }}
                aria-label={`Coin balance ${formatCoins(coins)}, open Free Coins vault`}
                className="px-2 py-1 rounded-lg bg-black/75 border border-[#f5b041] flex items-center gap-1 shadow-inner active:scale-95 transition-transform whitespace-nowrap"
              >
                <span className="w-3.5 h-3.5 rounded-full bg-royal-gold text-[#1c1102] flex items-center justify-center shadow">
                  <Coins className="w-2.5 h-2.5 text-[#1c1102]" />
                </span>
                <span className="font-mono-num text-xs font-extrabold text-[#ffe082]">
                  {formatCoins(coins)}
                </span>
                <span className="ml-0.5 w-3.5 h-3.5 rounded bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center leading-none">
                  +
                </span>
              </button>

              <button
                type="button"
                onClick={onToggleMute}
                aria-label={muted ? 'Unmute audio' : 'Mute audio'}
                className="w-6 h-6 rounded-lg bg-black/60 border border-amber-500/40 text-amber-300 flex items-center justify-center active:scale-95"
              >
                {muted ? (
                  <VolumeX className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-[#f5b041]" />
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playClick(1.1);
                onWatchAdDirect();
              }}
              aria-label="FREE +500 COINS (WATCH AD)"
              className="px-2 py-1 rounded-lg btn-3d-gold text-[#1c1102] text-[9px] font-display font-black tracking-tight shadow-[0_0_14px_rgba(245,176,65,0.75)] flex items-center justify-center gap-1 active:scale-95 transition-transform whitespace-nowrap"
            >
              <Play className="w-2.5 h-2.5 fill-[#1c1102] text-[#1c1102] shrink-0" />
              <span>
                {adCooldownSeconds > 0
                  ? formatCooldownHMS(adCooldownSeconds)
                  : 'FREE +500 COINS (WATCH AD)'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. CENTER 3D CASINO TABLE SHOWCASE */}
      <section
        aria-label="3D Casino Table Showcase"
        className="relative my-1 flex items-center justify-center py-1.5 perspective-1000"
      >
        {/* Left & Right Brass Handles */}
        <div
          className="absolute left-0.5 w-3.5 h-14 rounded-l-lg z-0"
          style={{
            background: 'linear-gradient(180deg, #ffe082 0%, #b7791f 50%, #5c3b05 100%)',
            border: '1px solid #fff3c4',
            boxShadow: '0 4px 10px rgba(0,0,0,0.8)',
          }}
        />
        <div
          className="absolute right-0.5 w-3.5 h-14 rounded-r-lg z-0"
          style={{
            background: 'linear-gradient(180deg, #ffe082 0%, #b7791f 50%, #5c3b05 100%)',
            border: '1px solid #fff3c4',
            boxShadow: '0 4px 10px rgba(0,0,0,0.8)',
          }}
        />

        {/* Thick 3D Golden Rim Oval Table */}
        <div
          className="relative z-10 w-[95%] h-38 rounded-[999px] p-2.5 flex items-center justify-between transition-all duration-300"
          style={{
            background: selectedTable.rimGradient,
            boxShadow: `0 12px 26px rgba(0,0,0,0.9), 0 4px 0 #5c3b05, 0 0 24px ${selectedTable.glowRgba}, inset 0 2px 3px rgba(255,255,255,0.75)`,
          }}
        >
          {/* Inner Velvet Felt Surface */}
          <div
            className="relative w-full h-full rounded-[999px] px-4 flex items-center justify-between overflow-hidden"
            style={{
              background: selectedTable.feltGradient,
              border: '2px solid #3d2604',
              boxShadow: 'inset 0 6px 18px rgba(0, 0, 0, 0.75)',
            }}
          >
            {/* Subtle Inner Gold Casino Line */}
            <div
              className="absolute inset-2.5 rounded-[999px] pointer-events-none opacity-45"
              style={{
                border: `1.5px dashed ${selectedTable.innerRingHex}`,
              }}
            />

            {/* Left: 3D tilted white card 'A' */}
            <div className="relative z-10 -rotate-12 transform hover:scale-105 transition-transform">
              <Card3D
                letter="A"
                codeName="ALPHA"
                skin={selectedDeck}
                customPhotoUrl={customPhotoUrl}
                size="sm"
              />
            </div>

            {/* Center: Gold badge "2X WINNER POT - 4,000 COINS" */}
            <div className="relative z-20 flex flex-col items-center justify-center px-2.5 py-2 rounded-2xl bg-obsidian-panel border-gold-glow text-center shadow-2xl mx-1">
              <span className="text-[8px] font-extrabold uppercase tracking-widest text-amber-300/90">
                Alphabet Royale 3D
              </span>
              <div className="mt-0.5 px-2 py-0.5 rounded-md bg-royal-gold text-[#1c1102] font-display font-black text-[10px] tracking-wide whitespace-nowrap shadow">
                2X WINNER POT
              </div>
              <span className="mt-1 font-mono-num text-sm font-black text-[#ffe082] tracking-tight whitespace-nowrap drop-shadow">
                {selectedStake.potFormatted} COINS
              </span>
              <span className="text-[8px] text-emerald-300 font-semibold whitespace-nowrap">
                {selectedTable.name}
              </span>
            </div>

            {/* Right: 3D tilted black & gold card 'Z' */}
            <div className="relative z-10 rotate-12 transform hover:scale-105 transition-transform">
              <Card3D
                letter="Z"
                codeName="OMEGA"
                skin={THIRTY_DECK_SKINS[1]}
                customPhotoUrl={customPhotoUrl}
                size="sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. MAIN MODE BUTTONS */}
      <section aria-label="Game Modes" className="flex flex-col gap-2 my-0.5">
        {/* Full-width metallic gold button: PLAY ONLINE */}
        <button
          type="button"
          data-start="true"
          onClick={() => {
            sound.playClick(1.2);
            onStartMatch('online');
          }}
          className="w-full py-2.5 px-3 rounded-2xl btn-3d-gold flex flex-col items-center justify-center active:scale-95 transition-transform"
        >
          <span className="font-display font-black text-xs sm:text-[13px] tracking-wide text-[#180e01] whitespace-nowrap">
            PLAY ONLINE (P1 LIVE MATCHMAKING)
          </span>
          <span className="text-[10px] font-bold text-[#3b2304] whitespace-nowrap">
            Win {selectedStake.potFormatted} Coin Pot • 25s Turn Timer
          </span>
        </button>

        {/* Two side-by-side buttons below: Blue PASS & PLAY and Teal/Green PRACTICE MODE */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              sound.playClick(1.05);
              onStartMatch('pass');
            }}
            className="py-2 px-2.5 rounded-xl btn-3d-blue flex flex-col items-center justify-center text-white active:scale-95 transition-transform"
          >
            <span className="font-display font-extrabold text-[11px] tracking-wide whitespace-nowrap">
              PASS &amp; PLAY
            </span>
            <span className="text-[9px] text-blue-100 font-medium whitespace-nowrap">
              Offline 1v1 Friends
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick(1.05);
              onStartMatch('practice');
            }}
            className="py-2 px-2.5 rounded-xl btn-3d-teal flex flex-col items-center justify-center text-white active:scale-95 transition-transform"
          >
            <span className="font-display font-extrabold text-[11px] tracking-wide whitespace-nowrap">
              PRACTICE MODE
            </span>
            <span className="text-[9px] text-emerald-100 font-medium whitespace-nowrap">
              Free Entry • +XP
            </span>
          </button>
        </div>
      </section>

      {/* 4. HIGH-ROLLER STAKE & DECK SIZE BOX */}
      <section
        aria-label="High-Roller Stake and Deck Size"
        className="px-3 py-2 rounded-2xl bg-obsidian-panel border-gold-metallic flex flex-col gap-2 my-0.5"
      >
        {/* Title row */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-display font-extrabold tracking-wider text-[#f5b041] whitespace-nowrap">
            HIGH-ROLLER STAKE (SWIPE 2K - 5L)
          </span>
          <span className="font-mono-num text-[11px] font-extrabold text-emerald-300 whitespace-nowrap">
            Pot: {selectedStake.potFormatted}
          </span>
        </div>

        {/* Horizontal scrollable stake buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {STAKE_OPTIONS.map((stake) => {
            const isSelected = stake.id === selectedStake.id;
            return (
              <button
                key={stake.id}
                type="button"
                onClick={() => {
                  sound.playClick(1.1);
                  onSelectStake(stake);
                }}
                className={`px-2 py-1.5 rounded-xl border text-[10px] font-mono-num font-extrabold whitespace-nowrap shrink-0 active:scale-95 transition-all ${stakeButtonClasses(
                  stake,
                  isSelected
                )}`}
              >
                {stake.buttonText}
              </button>
            );
          })}
        </div>

        {/* Deck Size selector row */}
        <div className="flex items-center justify-between pt-1 border-t border-amber-500/20">
          <span className="text-[11px] font-bold text-amber-200/90 whitespace-nowrap">
            Deck Size:
          </span>
          <div className="flex items-center gap-1.5">
            {DECK_SIZES.map((size) => {
              const active = selectedDeckSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    sound.playClick(1.15);
                    onSelectDeckSize(size);
                  }}
                  aria-label={`Deck Size ${size}`}
                  className={`w-8 h-7 rounded-full font-mono-num text-[11px] font-extrabold flex items-center justify-center active:scale-95 transition-all ${
                    active
                      ? 'bg-royal-gold text-[#1c1102] border border-white shadow-[0_0_10px_rgba(245,176,65,0.8)]'
                      : 'bg-black/60 text-amber-200/80 border border-amber-500/35 hover:border-amber-400'
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. BOTTOM NAVIGATION BAR (PURE 3D GOLD SVG ICONS) */}
      <nav
        aria-label="Bottom Royal Navigation"
        className="grid grid-cols-4 gap-2 pt-0.5"
      >
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onOpenCustomizer('decks');
          }}
          className="py-2 px-1 rounded-xl bg-obsidian-panel border-gold-metallic flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
        >
          <span className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-400/50 flex items-center justify-center shadow">
            <Layers className="w-3.5 h-3.5 text-[#f5b041]" />
          </span>
          <span className="text-[10px] font-display font-extrabold text-[#fde68a] whitespace-nowrap">
            30 Decks
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onOpenCustomizer('tables');
          }}
          className="py-2 px-1 rounded-xl bg-obsidian-panel border-gold-metallic flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
        >
          <span className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center shadow">
            <CircleDot className="w-3.5 h-3.5 text-emerald-400" />
          </span>
          <span className="text-[10px] font-display font-extrabold text-[#fde68a] whitespace-nowrap">
            Tables
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onOpenSocial('friends');
          }}
          className="py-2 px-1 rounded-xl bg-obsidian-panel border-gold-metallic flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
        >
          <span className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-400/50 flex items-center justify-center shadow">
            <Users className="w-3.5 h-3.5 text-[#f5b041]" />
          </span>
          <span className="text-[10px] font-display font-extrabold text-[#fde68a] whitespace-nowrap">
            Friends
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onOpenCustomizer('coins');
          }}
          className="py-1.5 px-1 rounded-xl bg-obsidian-panel border-gold-metallic flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
        >
          <span className="w-5 h-5 rounded-lg bg-amber-500/15 border border-amber-400/50 flex items-center justify-center shadow">
            <Sparkles className="w-3 h-3 text-[#f5b041]" />
          </span>
          <span className="text-[10px] font-display font-extrabold text-[#fde68a] whitespace-nowrap">
            Free Coins
          </span>
        </button>
      </nav>

      {/* 6. DOCKED 320x50 GOOGLE ADMOB BOTTOM BANNER SLOT (TEST AD: 6300978111) */}
      <div
        aria-label="Lobby Bottom Banner Ad Slot"
        data-admob-app-id={ADMOB_CONFIG.APP_ID}
        data-ad-unit-id={ADMOB_CONFIG.BANNER_AD_UNIT}
        className="w-full flex items-center justify-center pt-1 shrink-0"
      >
        <div className="w-[320px] h-[44px] max-w-full rounded-xl bg-black/85 border border-amber-500/35 px-3 flex items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-[8px] font-mono-num font-black text-[#ffe082] uppercase tracking-wider shrink-0">
              TEST AD
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-display font-bold text-[#fef9e7] truncate">
                Google AdMob Test Banner • 320x50
              </p>
              <p className="text-[8px] font-mono-num text-emerald-300/90 truncate">
                {ADMOB_CONFIG.BANNER_AD_UNIT}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.playClick(1.1);
              onWatchAdDirect();
            }}
            className="px-2 py-1 rounded-lg btn-3d-gold text-[#1c1102] text-[8.5px] font-display font-black uppercase tracking-wider shrink-0 active:scale-95"
          >
            +500 Coins
          </button>
        </div>
      </div>
    </div>
  );
};
