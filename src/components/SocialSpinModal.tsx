import React, { useState } from 'react';
import {
  Check,
  Clock,
  Copy,
  Crown,
  Disc,
  Globe,
  Lock,
  Send,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  FriendEntry,
  FriendRequestEntry,
  INITIAL_FRIEND_REQUESTS,
  INITIAL_FRIENDS,
  TOP_100_LEADERBOARD,
  WHEEL_SEGMENTS,
} from '../game/data';
import { formatCoins, formatCooldownHMS, MAX_DAILY_SPINS } from '../game/rules';
import { sound } from '../utils/sound';
import { SocialTab } from './HomeScreen';
import { RoyalAvatar } from './RoyalAvatarSvg';

interface SocialSpinModalProps {
  activeTab: SocialTab;
  onChangeTab: (tab: SocialTab) => void;
  onClose: () => void;
  coins: number;
  level: number;
  playerName: string;
  playerCode: string;
  selectedAvatarId: string;
  spinsRemaining: number;
  spinCooldownSeconds: number;
  onConsumeSpin: () => boolean;
  onAwardSpinCoins: (amount: number) => void;
  onInviteFriendMatch: (friend: FriendEntry) => void;
}

export const SocialSpinModal: React.FC<SocialSpinModalProps> = ({
  activeTab,
  onChangeTab,
  onClose,
  coins,
  level,
  playerName,
  playerCode,
  selectedAvatarId,
  spinsRemaining,
  spinCooldownSeconds,
  onConsumeSpin,
  onAwardSpinCoins,
  onInviteFriendMatch,
}) => {
  const [pastedFriendId, setPastedFriendId] = useState('');
  const [copiedMyId, setCopiedMyId] = useState(false);
  const [sentConfirmation, setSentConfirmation] = useState<string | null>(null);
  const [requests, setRequests] = useState<FriendRequestEntry[]>(
    INITIAL_FRIEND_REQUESTS
  );
  const [friends, setFriends] = useState<FriendEntry[]>(INITIAL_FRIENDS);
  const [invitedIds, setInvitedIds] = useState<string[]>([]);

  // Lucky Spin Wheel state
  const [spinning, setSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [lastSpinReward, setLastSpinReward] = useState<number | null>(null);

  const isSpinLocked = spinsRemaining <= 0 || spinCooldownSeconds > 0;

  const handleCopyMyId = () => {
    sound.playClick(1.15);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(playerCode).catch(() => {});
    }
    setCopiedMyId(true);
    setTimeout(() => setCopiedMyId(false), 1600);
  };

  const handleSendFriendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = pastedFriendId.trim().toUpperCase();
    if (!raw) return;

    sound.playCoinChime(3);
    const formattedCode = raw.startsWith('AR-') ? raw : `AR-${raw.slice(0, 6)}`;
    const newReq: FriendRequestEntry = {
      id: `req-${Date.now()}`,
      playerCode: formattedCode,
      name: `Royal Challenger ${formattedCode.slice(-4)}`,
      level: Math.max(5, level + 3),
      avatarId: 'king-aurelius',
      direction: 'sent',
      timestampLabel: 'Just now',
    };

    setRequests((prev) => [newReq, ...prev]);
    setPastedFriendId('');
    setSentConfirmation(`Friend Request Sent to ${formattedCode}!`);
    setTimeout(() => setSentConfirmation(null), 2600);
  };

  const handleAcceptRequest = (req: FriendRequestEntry) => {
    sound.playCoinChime(4);
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
    const newFriend: FriendEntry = {
      id: `fr-${Date.now()}`,
      playerCode: req.playerCode,
      name: req.name,
      countryCode: 'VIP',
      countryName: 'Royal Salon',
      level: req.level,
      online: true,
      statusText: 'Online • Ready for 1v1 Table',
      avatarId: req.avatarId,
      winningsFormatted: '18,50,000',
    };
    setFriends((prev) => [newFriend, ...prev]);
  };

  const handleSpinWheel = () => {
    if (spinning || isSpinLocked) return;
    const allowed = onConsumeSpin();
    if (!allowed) return;

    setSpinning(true);
    setLastSpinReward(null);

    const chosenIndex = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
    const segmentAngle = 360 / WHEEL_SEGMENTS.length;
    const extraSpins = 5 * 360;
    const targetRotation =
      wheelRotation +
      extraSpins +
      (360 - chosenIndex * segmentAngle - segmentAngle / 2);

    setWheelRotation(targetRotation);

    const tickOffsets = [
      60, 130, 210, 300, 410, 530, 670, 830, 1010, 1210,
    ];
    tickOffsets.forEach((ms, i) => {
      setTimeout(() => {
        sound.playWheelTick(1.15 - i * 0.025);
      }, ms);
    });

    setTimeout(() => {
      const reward = WHEEL_SEGMENTS[chosenIndex].coins;
      sound.playWinFanfare();
      setLastSpinReward(reward);
      onAwardSpinCoins(reward);
      setSpinning(false);
    }, 1450);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Friends, Lucky Spin and Top 100 Leaderboard"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3"
    >
      <div className="w-full max-w-[412px] h-[90dvh] rounded-3xl bg-obsidian-panel border-gold-glow flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-4 py-3 border-b border-amber-500/30 flex items-center justify-between bg-black/50">
          <div>
            <h2 className="font-display font-black text-sm text-[#fde68a] tracking-wider uppercase">
              Royal Club, Spin &amp; Top 100
            </h2>
            <p className="text-[10px] text-amber-200/75 font-mono-num">
              Balance: {formatCoins(coins)} Coins • ID: {playerCode}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            aria-label="Close Social & Spin Modal"
            className="w-8 h-8 rounded-full btn-3d-gold font-black text-xs flex items-center justify-center active:scale-95"
          >
            <X className="w-4 h-4 text-[#1c1102]" />
          </button>
        </div>

        {/* 3 Tab Selector (Pure Lucide SVG Icons) */}
        <div className="grid grid-cols-3 gap-2 p-2.5 bg-black/40 border-b border-amber-500/20">
          <button
            type="button"
            onClick={() => {
              sound.playClick(1.1);
              onChangeTab('friends');
            }}
            className={`py-2 px-2 rounded-xl text-[11px] font-display font-extrabold whitespace-nowrap flex items-center justify-center gap-1.5 active:scale-95 transition-all ${
              activeTab === 'friends'
                ? 'btn-3d-gold text-[#1c1102]'
                : 'bg-black/60 text-amber-200/80 border border-amber-500/30 hover:border-amber-400'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Friends</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick(1.1);
              onChangeTab('spin');
            }}
            className={`py-2 px-2 rounded-xl text-[11px] font-display font-extrabold whitespace-nowrap flex items-center justify-center gap-1.5 active:scale-95 transition-all ${
              activeTab === 'spin'
                ? 'btn-3d-gold text-[#1c1102]'
                : 'bg-black/60 text-amber-200/80 border border-amber-500/30 hover:border-amber-400'
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            <span>Lucky Spin</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick(1.1);
              onChangeTab('top100');
            }}
            className={`py-2 px-2 rounded-xl text-[11px] font-display font-extrabold whitespace-nowrap flex items-center justify-center gap-1.5 active:scale-95 transition-all ${
              activeTab === 'top100'
                ? 'btn-3d-gold text-[#1c1102]'
                : 'bg-black/60 text-amber-200/80 border border-amber-500/30 hover:border-amber-400'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Top 100</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-3">
          {/* TAB 1: CARROM POOL STYLE FRIEND REQUEST SYSTEM */}
          {activeTab === 'friends' && (
            <div className="space-y-3">
              {/* 1. User's Unique ID Box with [Copy ID] */}
              <div className="p-3 rounded-2xl bg-emerald-950/75 border-gold-metallic flex items-center justify-between gap-2">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300 block">
                    Your Unique Royal Player ID
                  </span>
                  <span className="font-mono-num font-black text-sm text-[#ffe082] tracking-wider">
                    {playerCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyMyId}
                  className="px-3 py-2 rounded-xl btn-3d-gold text-[10px] font-display font-black flex items-center gap-1.5 active:scale-95 whitespace-nowrap"
                >
                  {copiedMyId ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#1c1102]" />
                      <span>Copied ID!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#1c1102]" />
                      <span>Copy ID</span>
                    </>
                  )}
                </button>
              </div>

              {/* 2. Paste Friend's Player ID + [Send Friend Request] */}
              <form
                onSubmit={handleSendFriendRequest}
                className="p-3 rounded-2xl bg-black/70 border border-amber-500/40 space-y-2"
              >
                <label className="block text-[10px] font-display font-extrabold text-[#fde68a] uppercase tracking-wider">
                  Add Friend via Unique ID (Carrom Pool Style)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={pastedFriendId}
                    onChange={(e) => setPastedFriendId(e.target.value)}
                    placeholder="Paste Friend's Player ID"
                    aria-label="Paste Friend's Player ID"
                    className="flex-1 min-w-0 px-2.5 py-2 rounded-xl bg-black/85 border border-amber-500/40 text-xs text-white placeholder:text-amber-200/40 focus:outline-none focus:border-amber-400 font-mono-num"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-2 rounded-xl btn-3d-gold text-[10px] font-display font-black flex items-center gap-1 whitespace-nowrap shrink-0 active:scale-95"
                  >
                    <Send className="w-3 h-3 text-[#1c1102]" />
                    <span>Send Friend Request</span>
                  </button>
                </div>

                {sentConfirmation && (
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-900/90 border border-emerald-400 text-emerald-100 text-[11px] font-bold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                    <span>{sentConfirmation}</span>
                  </div>
                )}
              </form>

              {/* 3. Incoming / Sent Friend Requests List */}
              {requests.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-display font-extrabold text-[#f5b041] uppercase tracking-wider flex items-center gap-1">
                      <UserPlus className="w-3 h-3" />
                      <span>Incoming / Sent Requests ({requests.length})</span>
                    </span>
                  </div>
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      className="p-2.5 rounded-xl bg-amber-950/35 border border-amber-400/40 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <RoyalAvatar
                          avatarId={req.avatarId}
                          size="sm"
                          levelBadge={req.level}
                        />
                        <div className="min-w-0">
                          <p className="font-display font-bold text-xs text-[#fef9e7] truncate">
                            {req.name}
                          </p>
                          <p className="text-[9px] font-mono-num text-amber-300/85">
                            ID: {req.playerCode} •{' '}
                            {req.direction === 'incoming'
                              ? 'Incoming Request'
                              : 'Request Sent'}{' '}
                            ({req.timestampLabel})
                          </p>
                        </div>
                      </div>

                      {req.direction === 'incoming' ? (
                        <button
                          type="button"
                          onClick={() => handleAcceptRequest(req)}
                          className="px-2.5 py-1.5 rounded-lg btn-3d-teal text-white text-[10px] font-extrabold whitespace-nowrap active:scale-95"
                        >
                          Accept
                        </button>
                      ) : (
                        <span className="px-2 py-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-[9px] font-mono-num font-bold text-amber-200 whitespace-nowrap">
                          Pending
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 4. Global Friends List */}
              <div className="space-y-2">
                <span className="px-1 text-[10px] font-display font-extrabold text-emerald-300 uppercase tracking-wider block">
                  Royal Club Friends ({friends.length})
                </span>
                {friends.map((friend) => {
                  const isInvited = invitedIds.includes(friend.id);
                  return (
                    <div
                      key={friend.id}
                      className="p-2.5 rounded-2xl bg-black/65 border border-amber-500/30 flex items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <RoyalAvatar
                          avatarId={friend.avatarId}
                          size="md"
                          levelBadge={friend.level}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1 py-0.2 rounded bg-amber-500/20 border border-amber-400/40 text-[8px] font-mono-num font-bold text-amber-200 flex items-center gap-0.5">
                              <Globe className="w-2.5 h-2.5 text-[#f5b041]" />
                              {friend.countryCode}
                            </span>
                            <span className="font-display font-bold text-xs text-[#fef9e7] truncate">
                              {friend.name}
                            </span>
                          </div>
                          <p className="text-[9px] font-mono-num text-amber-300/80">
                            ID: {friend.playerCode} • Won: {friend.winningsFormatted}
                          </p>
                          <p
                            className={`text-[9px] font-semibold ${
                              friend.online ? 'text-emerald-400' : 'text-zinc-400'
                            }`}
                          >
                            {friend.statusText}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick(1.15);
                            if (!isInvited) {
                              setInvitedIds([...invitedIds, friend.id]);
                            } else {
                              onInviteFriendMatch(friend);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold whitespace-nowrap active:scale-95 ${
                            isInvited
                              ? 'btn-3d-teal text-white'
                              : 'btn-3d-gold text-[#1c1102]'
                          }`}
                        >
                          {isInvited ? 'Play 1v1' : 'Invite'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: 3D METALLIC LUCKY SPIN WHEEL WITH GOLDEN RIM STUDS */}
          {activeTab === 'spin' && (
            <div className="flex flex-col items-center justify-between py-1.5 space-y-3">
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-[10px] font-mono-num font-bold text-amber-300 inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#f5b041]" />
                    <span>3D FORTUNE WHEEL</span>
                  </span>

                  <span
                    className={`px-2.5 py-0.5 rounded-full border text-[10px] font-mono-num font-extrabold inline-flex items-center gap-1 ${
                      isSpinLocked
                        ? 'bg-red-950/90 border-red-400 text-red-200'
                        : 'bg-emerald-950/90 border-emerald-400 text-emerald-300'
                    }`}
                  >
                    <Disc className="w-3 h-3" />
                    <span>
                      Spins Left: {spinsRemaining}/{MAX_DAILY_SPINS}
                    </span>
                  </span>
                </div>

                <h3 className="font-display font-black text-base text-[#ffe082]">
                  Spin &amp; Win Up To 25,000 Coins
                </h3>
                <p className="text-[10px] text-amber-200/80 font-mono-num">
                  {isSpinLocked
                    ? `Daily Spin Limit Reached (0/2) • Next Spin in ${formatCooldownHMS(
                        spinCooldownSeconds
                      )}`
                    : '2 Free Spins Every 24 Hours • Guaranteed Royal Payout'}
                </p>
              </div>

              {/* 3D Golden Wheel Container */}
              <div className="relative w-60 h-60 flex items-center justify-center">
                {/* Top Golden Pointer */}
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 w-8 h-9 flex items-start justify-center drop-shadow-xl"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 32 36" className="w-8 h-9">
                    <polygon
                      points="16,34 3,4 29,4"
                      fill="#f5b041"
                      stroke="#fff3c4"
                      strokeWidth="2.5"
                    />
                    <circle cx="16" cy="10" r="3.5" fill="#78350f" />
                  </svg>
                </div>

                {/* Outer Metallic Rim with 16 Golden Studs/Pegs */}
                <div
                  className="w-56 h-56 rounded-full p-3 shadow-2xl flex items-center justify-center relative"
                  style={{
                    background:
                      'linear-gradient(135deg, #fff3c4 0%, #f5b041 32%, #b7791f 68%, #451a03 100%)',
                    boxShadow:
                      '0 14px 32px rgba(0,0,0,0.95), 0 0 28px rgba(245,176,65,0.5), inset 0 2px 4px rgba(255,255,255,0.8)',
                  }}
                >
                  {/* 16 Golden Studs around Rim */}
                  {Array.from({ length: 16 }).map((_, idx) => {
                    const deg = idx * 22.5;
                    const rad = (deg * Math.PI) / 180;
                    const r = 105;
                    const cx = 112 + r * Math.cos(rad);
                    const cy = 112 + r * Math.sin(rad);
                    return (
                      <span
                        key={idx}
                        className="absolute w-2.5 h-2.5 rounded-full pointer-events-none z-20"
                        style={{
                          left: `${cx - 5}px`,
                          top: `${cy - 5}px`,
                          background:
                            'radial-gradient(circle at 35% 35%, #ffffff 0%, #ffe082 45%, #9a6b13 100%)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.9)',
                        }}
                      />
                    );
                  })}

                  {/* Rotating 3D Gradient SVG Wheel */}
                  <div
                    className="w-full h-full rounded-full overflow-hidden relative border-2 border-[#451a03]"
                    style={{
                      transform: `rotate(${wheelRotation}deg)`,
                      transition: spinning
                        ? 'transform 1.4s cubic-bezier(0.14, 0.85, 0.22, 1)'
                        : 'none',
                    }}
                  >
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      <defs>
                        {WHEEL_SEGMENTS.map((seg) => (
                          <linearGradient
                            key={`grad-${seg.id}`}
                            id={`sliceGrad-${seg.id}`}
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                          >
                            <stop offset="0%" stopColor={seg.colorStart} />
                            <stop offset="100%" stopColor={seg.colorEnd} />
                          </linearGradient>
                        ))}
                      </defs>
                      {WHEEL_SEGMENTS.map((seg, i) => {
                        const startAngle = i * 45 - 90;
                        const endAngle = (i + 1) * 45 - 90;
                        const rad1 = (startAngle * Math.PI) / 180;
                        const rad2 = (endAngle * Math.PI) / 180;
                        const x1 = 100 + 100 * Math.cos(rad1);
                        const y1 = 100 + 100 * Math.sin(rad1);
                        const x2 = 100 + 100 * Math.cos(rad2);
                        const y2 = 100 + 100 * Math.sin(rad2);
                        const midAngle = startAngle + 22.5;
                        const textRad = (midAngle * Math.PI) / 180;
                        const tx = 100 + 64 * Math.cos(textRad);
                        const ty = 100 + 64 * Math.sin(textRad);

                        return (
                          <g key={seg.id}>
                            <path
                              d={`M100,100 L${x1},${y1} A100,100 0 0,1 ${x2},${y2} Z`}
                              fill={`url(#sliceGrad-${seg.id})`}
                              stroke="#f5b041"
                              strokeWidth="2"
                            />
                            <text
                              x={tx}
                              y={ty}
                              fill="#fef08a"
                              fontSize="10"
                              fontWeight="900"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              transform={`rotate(${midAngle + 90}, ${tx}, ${ty})`}
                            >
                              {seg.label}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Center 3D Royal Hub */}
                  <div className="absolute w-14 h-14 rounded-full bg-royal-gold border-2 border-[#fff3c4] flex flex-col items-center justify-center shadow-2xl z-20">
                    <Crown className="w-4 h-4 text-[#1c1102]" />
                    <span className="font-display font-black text-[8px] text-[#1c1102] tracking-wider">
                      ROYAL
                    </span>
                  </div>
                </div>
              </div>

              {/* Reward Banner */}
              {lastSpinReward !== null && (
                <div className="px-4 py-1.5 rounded-2xl bg-emerald-950/90 border border-amber-300 text-center shadow-lg flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#ffe082]" />
                  <p className="text-xs font-display font-black text-[#ffe082]">
                    JACKPOT REWARD: +{formatCoins(lastSpinReward)} COINS!
                  </p>
                </div>
              )}

              <button
                type="button"
                disabled={spinning || isSpinLocked}
                onClick={handleSpinWheel}
                className={`w-full py-3 rounded-2xl font-display font-black text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 transition-transform ${
                  isSpinLocked
                    ? 'bg-zinc-900 border-2 border-red-400/60 text-amber-200 cursor-not-allowed opacity-90'
                    : 'btn-3d-gold active:scale-95 disabled:opacity-60'
                }`}
              >
                {isSpinLocked ? (
                  <>
                    <Clock className="w-4 h-4 text-red-400" />
                    <span className="font-mono-num">
                      Next Spin in {formatCooldownHMS(spinCooldownSeconds)} (0/2 Left)
                    </span>
                  </>
                ) : (
                  <>
                    <Disc className="w-4 h-4 text-[#1c1102]" />
                    <span>
                      {spinning
                        ? 'SPINNING GOLDEN WHEEL...'
                        : `SPIN FORTUNE WHEEL (${spinsRemaining}/2 LEFT)`}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 3: TOP 100 GLOBAL LEADERBOARD */}
          {activeTab === 'top100' && (
            <div className="space-y-2">
              {/* Player's Own Rank Highlight */}
              <div className="p-2.5 rounded-2xl bg-emerald-950/80 border-gold-metallic flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-royal-gold text-[#1c1102] font-mono-num font-black text-xs flex items-center justify-center">
                    #48
                  </span>
                  <RoyalAvatar
                    avatarId={selectedAvatarId}
                    size="sm"
                    levelBadge={level}
                  />
                  <div>
                    <p className="font-display font-black text-xs text-[#fde68a]">
                      {playerName} (You)
                    </p>
                    <p className="text-[9px] font-mono-num text-emerald-300">
                      ID: {playerCode}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono-num text-xs font-extrabold text-[#ffe082]">
                    {formatCoins(coins)} Coins
                  </p>
                  <p className="text-[9px] text-amber-200/75">Active Bankroll</p>
                </div>
              </div>

              {/* Top 100 List */}
              {TOP_100_LEADERBOARD.map((entry) => {
                const isTop3 = entry.rank <= 3;
                return (
                  <div
                    key={entry.rank}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                      isTop3
                        ? 'bg-gradient-to-r from-amber-950/70 via-black/80 to-amber-950/50 border-amber-400/60'
                        : 'bg-black/60 border-amber-500/25'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-lg font-mono-num font-black text-xs flex items-center justify-center shrink-0 ${
                          isTop3
                            ? 'bg-royal-gold text-[#1c1102]'
                            : 'bg-black/80 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {isTop3 ? (
                          <Crown className="w-3.5 h-3.5 text-[#1c1102]" />
                        ) : (
                          `#${entry.rank}`
                        )}
                      </span>
                      <RoyalAvatar
                        avatarId={entry.avatarId}
                        size="sm"
                        levelBadge={entry.level}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1 py-0.2 rounded bg-amber-500/20 border border-amber-400/40 text-[8px] font-mono-num font-bold text-amber-200">
                            {entry.countryCode}
                          </span>
                          <span className="font-display font-bold text-xs text-[#fef9e7] truncate">
                            {entry.name}
                          </span>
                        </div>
                        <p className="text-[9px] font-mono-num text-amber-200/70">
                          ID: {entry.playerCode}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-mono-num text-xs font-extrabold text-[#ffe082]">
                        {entry.winningsFormatted} Coins
                      </p>
                      <p className="text-[9px] text-emerald-300 font-semibold">
                        Career Pot
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
