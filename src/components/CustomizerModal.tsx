import React, { useRef, useState } from 'react';
import {
  Camera,
  Check,
  Copy,
  Link2,
  Lock,
  LogOut,
  X,
} from 'lucide-react';
import {
  AVATAR_LIST,
  DeckSkin,
  FIVE_TABLES,
  TableSkin,
  THIRTY_DECK_SKINS,
} from '../game/data';
import {
  canUploadCustomPhotoDeck,
  formatCoins,
  formatCooldownHMS,
} from '../game/rules';
import { sound } from '../utils/sound';
import { Card3D } from './Card3D';
import { CustomizerTab } from './HomeScreen';
import { RoyalAvatar } from './RoyalAvatarSvg';

interface CustomizerModalProps {
  activeTab: CustomizerTab;
  onChangeTab: (tab: CustomizerTab) => void;
  onClose: () => void;
  coins: number;
  level: number;
  xpProgressPercent: number;
  playerName: string;
  player2Name: string;
  playerCode: string;
  facebookLinked: boolean;
  selectedAvatarId: string;
  selectedDeckId: string;
  selectedTableId: string;
  unlockedDeckIds: string[];
  unlockedTableIds: string[];
  unlockedAvatarIds: string[];
  customPhotoUrl: string | null;
  adsRemaining: number;
  adCooldownSeconds: number;
  hourlyCooldownSeconds: number;
  onSelectDeck: (deck: DeckSkin) => void;
  onUnlockDeck: (deck: DeckSkin) => void;
  onSelectTable: (table: TableSkin) => void;
  onUnlockTable: (table: TableSkin) => void;
  onSelectAvatar: (avatarId: string) => void;
  onUpdateNames: (p1: string, p2: string) => void;
  onUploadCustomPhoto: (dataUrl: string) => void;
  onStartWatchAd: () => void;
  onClaimHourly: () => void;
  onLinkFacebook: () => void;
  onBackToLogin: () => void;
}

export const CustomizerModal: React.FC<CustomizerModalProps> = ({
  activeTab,
  onChangeTab,
  onClose,
  coins,
  level,
  xpProgressPercent,
  playerName,
  player2Name,
  playerCode,
  facebookLinked,
  selectedAvatarId,
  selectedDeckId,
  selectedTableId,
  unlockedDeckIds,
  unlockedTableIds,
  unlockedAvatarIds,
  customPhotoUrl,
  adsRemaining,
  adCooldownSeconds,
  hourlyCooldownSeconds,
  onSelectDeck,
  onUnlockDeck,
  onSelectTable,
  onUnlockTable,
  onSelectAvatar,
  onUpdateNames,
  onUploadCustomPhoto,
  onStartWatchAd,
  onClaimHourly,
  onLinkFacebook,
  onBackToLogin,
}) => {
  const [p1Input, setP1Input] = useState(playerName);
  const [p2Input, setP2Input] = useState(player2Name);
  const [copiedCode, setCopiedCode] = useState(false);
  const [nameSavedBanner, setNameSavedBanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canUploadCustomPhotoDeck(level)) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        sound.playCoinChime(4);
        onUploadCustomPhoto(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveNames = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanP1 = p1Input.trim() || 'King Sovereign';
    const cleanP2 = p2Input.trim() || 'Empress Cleo';
    sound.playCoinChime(2);
    onUpdateNames(cleanP1, cleanP2);
    setNameSavedBanner(true);
    setTimeout(() => setNameSavedBanner(false), 1800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Royal Casino Customizer"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3"
    >
      <div className="w-full max-w-[412px] h-[90dvh] rounded-3xl bg-obsidian-panel border-gold-glow flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-4 py-3 border-b border-amber-500/30 flex items-center justify-between bg-black/50">
          <div>
            <h2 className="font-display font-black text-sm text-[#fde68a] tracking-wider uppercase">
              Royal Casino Vault &amp; Skins
            </h2>
            <p className="text-[10px] text-amber-200/75 font-mono-num">
              Balance: {formatCoins(coins)} Coins • Lv.{level} Sovereign
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            aria-label="Close Customizer Modal"
            className="w-8 h-8 rounded-full btn-3d-gold font-black text-xs flex items-center justify-center active:scale-95"
          >
            <X className="w-4 h-4 text-[#1c1102]" />
          </button>
        </div>

        {/* 4 Tab Selector Bar */}
        <div className="grid grid-cols-4 gap-1.5 p-2.5 bg-black/40 border-b border-amber-500/20">
          {(
            [
              { id: 'decks', label: '30 Decks' },
              { id: 'tables', label: 'Tables' },
              { id: 'coins', label: 'Free Coins' },
              { id: 'profile', label: 'Profile' },
            ] as { id: CustomizerTab; label: string }[]
          ).map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  sound.playClick(1.1);
                  onChangeTab(tab.id);
                }}
                className={`py-2 px-1 rounded-xl text-[11px] font-display font-extrabold whitespace-nowrap active:scale-95 transition-all ${
                  active
                    ? 'btn-3d-gold text-[#1c1102]'
                    : 'bg-black/60 text-amber-200/80 border border-amber-500/30 hover:border-amber-400'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Hidden File Input for Level 100 Custom Photo Deck */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          disabled={!canUploadCustomPhotoDeck(level)}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* TAB 1: 30 DECKS */}
          {activeTab === 'decks' && (
            <div className="space-y-3">
              <div className="px-3 py-2 rounded-xl bg-emerald-950/60 border border-amber-500/40 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-display font-bold text-[#fde68a]">
                    30 Luxury 3D Decks (Lv. 1 – Lv. 100)
                  </p>
                  <p className="text-[10px] text-emerald-200/90">
                    Every card in your hand &amp; throws uses your equipped Deck Skin!
                  </p>
                </div>
                <span className="px-2 py-1 rounded-lg bg-amber-500/20 border border-amber-400/50 text-[9px] font-mono-num font-bold text-[#ffe082] whitespace-nowrap">
                  Lv.{level} / 100
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {THIRTY_DECK_SKINS.map((deck, idx) => {
                  const canUseCustomPhoto = canUploadCustomPhotoDeck(level);
                  const isUnlocked = deck.isCustomPhoto
                    ? canUseCustomPhoto
                    : level >= deck.unlockLevel || unlockedDeckIds.includes(deck.id);
                  const isSelected = selectedDeckId === deck.id;

                  return (
                    <div
                      key={deck.id}
                      className={`p-2.5 rounded-2xl border flex flex-col items-center justify-between gap-2 transition-all ${
                        isSelected
                          ? 'bg-emerald-950/80 border-[#ffe082] shadow-[0_0_16px_rgba(245,176,65,0.45)]'
                          : 'bg-black/60 border-amber-500/30'
                      }`}
                    >
                      <div className="w-full flex items-center justify-between text-[9px] font-mono-num text-amber-300/90">
                        <span>#{idx + 1}</span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 font-bold">
                          Lv.{deck.unlockLevel}
                        </span>
                      </div>

                      <Card3D
                        letter="A"
                        codeName="ALPHA"
                        skin={deck}
                        customPhotoUrl={canUseCustomPhoto ? customPhotoUrl : null}
                        size="sm"
                      />

                      <div className="text-center w-full">
                        <p className="font-display font-extrabold text-[11px] text-[#fef9e7] truncate">
                          {deck.name}
                        </p>
                        <p className="text-[9px] text-amber-300/80 uppercase tracking-wider">
                          {deck.badgeText}
                        </p>
                      </div>

                      {deck.isCustomPhoto ? (
                        canUseCustomPhoto ? (
                          <div className="w-full flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 border border-amber-300 text-white text-[10px] font-extrabold flex items-center justify-center gap-1 active:scale-95"
                            >
                              <Camera className="w-3 h-3" />
                              <span>
                                {customPhotoUrl ? 'Change Photo' : 'Upload Gallery Photo'}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                sound.playClick(1.15);
                                onSelectDeck(deck);
                              }}
                              className={`w-full py-1.5 rounded-lg text-[10px] font-extrabold active:scale-95 ${
                                isSelected
                                  ? 'bg-emerald-600 text-white border border-emerald-300'
                                  : 'btn-3d-gold'
                              }`}
                            >
                              {isSelected ? 'EQUIPPED' : 'Equip Custom Deck'}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled
                            aria-label="Locked Requires Level 100"
                            className="w-full py-2 px-1.5 rounded-lg bg-zinc-900/95 border border-amber-500/35 text-amber-200/75 text-[9.5px] font-mono-num font-extrabold flex items-center justify-center gap-1 cursor-not-allowed opacity-90"
                          >
                            <Lock className="w-3 h-3 text-[#f5b041] shrink-0" />
                            <span>Locked • Requires Level 100</span>
                          </button>
                        )
                      ) : isUnlocked ? (
                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick(1.15);
                            onSelectDeck(deck);
                          }}
                          className={`w-full py-1.5 rounded-lg text-[10px] font-extrabold active:scale-95 ${
                            isSelected
                              ? 'bg-emerald-600 text-white border border-emerald-300'
                              : 'btn-3d-gold'
                          }`}
                        >
                          {isSelected ? 'EQUIPPED' : 'Select Deck'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            onUnlockDeck(deck);
                          }}
                          className="w-full py-1.5 rounded-lg bg-amber-950/90 border border-amber-400/60 text-amber-200 text-[10px] font-mono-num font-bold flex items-center justify-center gap-1 active:scale-95"
                        >
                          <Lock className="w-3 h-3 text-[#f5b041]" />
                          <span>Unlock ({formatCoins(deck.priceCoins)})</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: TABLES */}
          {activeTab === 'tables' && (
            <div className="space-y-2.5">
              {FIVE_TABLES.map((table) => {
                const isUnlocked =
                  level >= table.unlockLevel || unlockedTableIds.includes(table.id);
                const isSelected = selectedTableId === table.id;
                return (
                  <div
                    key={table.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-950/75 border-[#ffe082] shadow-[0_0_15px_rgba(245,176,65,0.4)]'
                        : 'bg-black/60 border-amber-500/30'
                    }`}
                  >
                    {/* 3D Mini-Table Preview */}
                    <div
                      className="w-24 h-14 rounded-full p-1.5 shrink-0 flex items-center justify-center shadow-lg"
                      style={{
                        background: table.rimGradient,
                        boxShadow: '0 4px 10px rgba(0,0,0,0.8)',
                      }}
                    >
                      <div
                        className="w-full h-full rounded-full flex items-center justify-center"
                        style={{
                          background: table.feltGradient,
                          border: '1px solid #3d2604',
                        }}
                      >
                        <span className="text-[8px] font-display font-black text-[#fde68a] tracking-widest">
                          VIP 3D
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-display font-extrabold text-xs text-[#fef9e7] truncate">
                        {table.name}
                      </p>
                      <p className="text-[10px] text-amber-200/80 truncate">
                        {table.subtitle}
                      </p>
                      <p className="text-[9px] font-mono-num text-emerald-300 mt-0.5">
                        Unlocks at Lv.{table.unlockLevel}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {isUnlocked ? (
                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick(1.15);
                            onSelectTable(table);
                          }}
                          className={`px-3 py-2 rounded-xl text-[10px] font-extrabold whitespace-nowrap active:scale-95 ${
                            isSelected
                              ? 'bg-emerald-600 text-white border border-emerald-300'
                              : 'btn-3d-gold'
                          }`}
                        >
                          {isSelected ? 'ACTIVE' : 'Select'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            onUnlockTable(table);
                          }}
                          className="px-2.5 py-2 rounded-xl bg-amber-950/90 border border-amber-400/60 text-amber-200 text-[10px] font-mono-num font-bold whitespace-nowrap flex items-center gap-1 active:scale-95"
                        >
                          <Lock className="w-3 h-3 text-[#f5b041]" />
                          <span>{formatCoins(table.priceCoins)}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: FREE COINS (4-Ad Limit & 4-Hour Cooldown + Hourly Vault) */}
          {activeTab === 'coins' && (
            <div className="space-y-3">
              {/* Watch Ad Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-950/70 to-black/90 border-gold-metallic space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-[10px] font-mono-num font-bold text-amber-300">
                    DAILY AD REWARDS ({adsRemaining}/4 LEFT)
                  </span>
                  <span className="font-mono-num text-xs font-extrabold text-[#ffe082]">
                    +500 COINS
                  </span>
                </div>
                <h3 className="font-display font-black text-sm text-[#fef9e7]">
                  Royal Sponsored Broadcast
                </h3>
                <p className="text-xs text-amber-100/80 leading-relaxed">
                  Watch a short 5-second Royal Casino spotlight to earn +500 instant Gold Coins. After 4 watches, a 4-hour vault cooldown resets your limit.
                </p>

                <button
                  type="button"
                  disabled={adCooldownSeconds > 0}
                  onClick={() => {
                    sound.playClick(1.15);
                    onStartWatchAd();
                  }}
                  className={`w-full py-3 rounded-xl font-display font-black text-xs tracking-wide active:scale-95 transition-all ${
                    adCooldownSeconds > 0
                      ? 'bg-zinc-800 border border-zinc-600 text-zinc-400 cursor-not-allowed'
                      : 'btn-3d-gold'
                  }`}
                >
                  {adCooldownSeconds > 0
                    ? `Cooldown Active (${formatCooldownHMS(adCooldownSeconds)})`
                    : `Free 500 Coins (Watch Ad - ${adsRemaining}/4 Left)`}
                </button>
              </div>

              {/* Hourly Vault Bonus Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-950/75 to-black/90 border-gold-metallic space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/50 text-[10px] font-mono-num font-bold text-emerald-300">
                    HOURLY ROYAL TREASURY
                  </span>
                  <span className="font-mono-num text-xs font-extrabold text-emerald-300">
                    +1,500 COINS
                  </span>
                </div>
                <h3 className="font-display font-black text-sm text-[#fef9e7]">
                  Hourly Sovereign Vault Drop
                </h3>
                <p className="text-xs text-emerald-100/80 leading-relaxed">
                  Collect +1,500 Virtual Coins every hour directly into your high-roller bankroll.
                </p>

                <button
                  type="button"
                  disabled={hourlyCooldownSeconds > 0}
                  onClick={() => {
                    sound.playClick(1.15);
                    onClaimHourly();
                  }}
                  className={`w-full py-3 rounded-xl font-display font-black text-xs tracking-wide active:scale-95 transition-all ${
                    hourlyCooldownSeconds > 0
                      ? 'bg-zinc-800 border border-zinc-600 text-zinc-400 cursor-not-allowed'
                      : 'btn-3d-teal text-white'
                  }`}
                >
                  {hourlyCooldownSeconds > 0
                    ? `Next Vault Drop in ${formatCooldownHMS(hourlyCooldownSeconds)}`
                    : 'Free Hourly Vault Bonus (+1,500 Virtual Coins)'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: PROFILE, ACCOUNT SWITCH & 100-LEVEL AVATARS */}
          {activeTab === 'profile' && (
            <div className="space-y-3">
              {/* Player ID Copy, Facebook Link & Back to Login */}
              <div className="p-3 rounded-2xl bg-black/65 border-gold-metallic space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <RoyalAvatar avatarId={selectedAvatarId} size="md" levelBadge={level} />
                    <div>
                      <p className="font-display font-black text-xs text-[#fde68a]">
                        {playerName}
                      </p>
                      <p className="text-[10px] font-mono-num text-amber-200/80">
                        Player ID: {playerCode}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick(1.1);
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(playerCode).catch(() => {});
                      }
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 1500);
                    }}
                    className="px-2.5 py-1.5 rounded-lg btn-3d-gold text-[10px] font-extrabold whitespace-nowrap flex items-center gap-1 active:scale-95"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3 h-3 text-[#1c1102]" />
                        <span>Copied ID</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-[#1c1102]" />
                        <span>Copy ID</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-0.5">
                  <div className="flex justify-between text-[10px] font-mono-num text-amber-200/80 mb-1">
                    <span>Level {level} Progress</span>
                    <span>{xpProgressPercent}% to Lv.{Math.min(100, level + 1)}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/80 border border-amber-500/30 overflow-hidden">
                    <div
                      className="h-full bg-royal-gold transition-all duration-300"
                      style={{ width: `${xpProgressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Account Actions: Firebase Cloud Save + Logout / Back to Login Screen */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="py-2 px-2.5 rounded-xl bg-emerald-950/80 border border-emerald-400/60 text-emerald-200 text-[10px] font-display font-extrabold flex items-center justify-center gap-1.5 whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Firebase Cloud Save</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick(1.1);
                      onBackToLogin();
                    }}
                    className="py-2 px-2.5 rounded-xl bg-red-950/90 border border-red-400/70 text-red-100 text-[10px] font-display font-extrabold flex items-center justify-center gap-1.5 active:scale-95 whitespace-nowrap"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-300" />
                    <span>Back to Login Screen</span>
                  </button>
                </div>
              </div>

              {/* Player 1 & Player 2 Name Editor */}
              <form
                onSubmit={handleSaveNames}
                className="p-3 rounded-2xl bg-black/60 border border-amber-500/30 space-y-2.5"
              >
                <p className="font-display font-extrabold text-xs text-[#fde68a]">
                  Player 1 &amp; Pass-and-Play Name Editor
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="text-[10px] text-amber-200/80 font-bold">
                      Player 1 Name
                    </span>
                    <input
                      type="text"
                      value={p1Input}
                      onChange={(e) => setP1Input(e.target.value)}
                      maxLength={18}
                      className="mt-1 w-full px-2.5 py-1.5 rounded-lg bg-black/80 border border-amber-500/40 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] text-amber-200/80 font-bold">
                      Player 2 (Pass &amp; Play)
                    </span>
                    <input
                      type="text"
                      value={p2Input}
                      onChange={(e) => setP2Input(e.target.value)}
                      maxLength={18}
                      className="mt-1 w-full px-2.5 py-1.5 rounded-lg bg-black/80 border border-amber-500/40 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl btn-3d-gold text-[11px] font-display font-black active:scale-95"
                >
                  {nameSavedBanner ? 'Royal Names Saved!' : 'Save Player Names'}
                </button>
              </form>

              {/* 3D Avatars Grid (Lv. 1 to Lv. 100 Grandmaster) */}
              <div className="space-y-2">
                <p className="font-display font-extrabold text-xs text-[#fde68a]">
                  3D Avatars (Lv. 1 to Lv. 100 Grandmaster)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {AVATAR_LIST.map((av) => {
                    const unlocked =
                      level >= av.unlockLevel || unlockedAvatarIds.includes(av.id);
                    const active = selectedAvatarId === av.id;
                    return (
                      <div
                        key={av.id}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                          active
                            ? 'bg-emerald-950/80 border-[#ffe082]'
                            : 'bg-black/60 border-amber-500/30'
                        }`}
                      >
                        <RoyalAvatar
                          avatarId={av.id}
                          size="md"
                          levelBadge={av.unlockLevel}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-display font-bold text-[11px] text-[#fef9e7] truncate">
                            {av.name}
                          </p>
                          <p className="text-[9px] text-amber-200/75 truncate">
                            {av.title}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              sound.playClick(1.1);
                              onSelectAvatar(av.id);
                            }}
                            className={`mt-1.5 w-full py-1 rounded-lg text-[9px] font-extrabold active:scale-95 ${
                              active
                                ? 'bg-emerald-600 text-white'
                                : unlocked
                                ? 'btn-3d-gold'
                                : 'bg-amber-950/90 border border-amber-400/50 text-amber-200'
                            }`}
                          >
                            {active
                              ? 'EQUIPPED'
                              : unlocked
                              ? 'Equip Avatar'
                              : `Equip (Lv.${av.unlockLevel})`}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
