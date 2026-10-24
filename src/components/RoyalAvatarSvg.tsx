import React from 'react';
import { AvatarItem, AVATAR_LIST } from '../game/data';

interface RoyalAvatarProps {
  avatarId: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  levelBadge?: number;
  className?: string;
}

export const RoyalAvatar: React.FC<RoyalAvatarProps> = ({
  avatarId,
  size = 'md',
  levelBadge,
  className = '',
}) => {
  const avatar: AvatarItem =
    AVATAR_LIST.find((a) => a.id === avatarId) || AVATAR_LIST[0];

  const effectiveLevel = levelBadge ?? avatar.unlockLevel ?? 1;

  // Prestige tier aura based on Level (Lv.1-9 Royal Gold, Lv.10-49 Cyber Diamond, Lv.50-99 Crimson Fire, Lv.100 Grandmaster Sovereign)
  const tierConfig =
    effectiveLevel >= 100
      ? {
          conicRing:
            'conic-gradient(from 0deg, #ffe082, #a855f7, #38bdf8, #f5b041, #ef4444, #ffe082)',
          glowColor: 'rgba(168, 85, 247, 0.75)',
          wingFill: '#fde047',
          shieldBg: 'linear-gradient(180deg, #f3e8ff 0%, #9333ea 50%, #3b0764 100%)',
          shieldText: '#fef08a',
          shieldBorder: '#ffe082',
        }
      : effectiveLevel >= 50
      ? {
          conicRing:
            'conic-gradient(from 0deg, #f5b041, #ef4444, #fde047, #b91c1c, #f5b041)',
          glowColor: 'rgba(239, 68, 68, 0.7)',
          wingFill: '#fbbf24',
          shieldBg: 'linear-gradient(180deg, #fecaca 0%, #dc2626 50%, #450a0a 100%)',
          shieldText: '#fef08a',
          shieldBorder: '#fde047',
        }
      : effectiveLevel >= 10
      ? {
          conicRing:
            'conic-gradient(from 0deg, #38bdf8, #ffe082, #0284c7, #f5b041, #38bdf8)',
          glowColor: 'rgba(56, 189, 248, 0.65)',
          wingFill: '#fcd34d',
          shieldBg: 'linear-gradient(180deg, #bae6fd 0%, #0284c7 50%, #082f49 100%)',
          shieldText: '#fef08a',
          shieldBorder: '#fde047',
        }
      : {
          conicRing:
            'conic-gradient(from 0deg, #fff3c4, #f5b041, #10b981, #b7791f, #fff3c4)',
          glowColor: 'rgba(245, 176, 65, 0.6)',
          wingFill: '#f5b041',
          shieldBg: 'linear-gradient(180deg, #ffe082 0%, #f5b041 50%, #78350f 100%)',
          shieldText: '#180f02',
          shieldBorder: '#fff3c4',
        };

  const dims = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
    xl: 'w-16 h-16',
  }[size];

  const wingScale = {
    sm: 'w-12 h-8',
    md: 'w-16 h-11',
    lg: 'w-20 h-14',
    xl: 'w-24 h-16',
  }[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${
        size !== 'sm' ? 'px-1.5' : ''
      } ${className}`}
    >
      {/* Animated Golden Prestige Wings (Flanking Banner) */}
      {size !== 'sm' && (
        <svg
          viewBox="0 0 96 56"
          aria-hidden="true"
          className={`absolute ${wingScale} pointer-events-none z-0 animate-pulse drop-shadow-[0_2px_6px_rgba(245,176,65,0.65)]`}
        >
          {/* Left Royal Wing */}
          <path
            d="M24 28 C14 24 5 16 2 6 C10 10 18 14 25 20 C16 18 8 15 4 12 C11 17 18 22 25 25 C17 25 10 23 6 20 C12 25 19 28 26 30 Z"
            fill={tierConfig.wingFill}
            stroke="#fff3c4"
            strokeWidth="0.8"
          />
          {/* Right Royal Wing */}
          <path
            d="M72 28 C82 24 91 16 94 6 C86 10 78 14 71 20 C80 18 88 15 92 12 C85 17 78 22 71 25 C79 25 86 23 90 20 C84 25 77 28 70 30 Z"
            fill={tierConfig.wingFill}
            stroke="#fff3c4"
            strokeWidth="0.8"
          />
        </svg>
      )}

      {/* Rotating Diamond / Fire / Sovereign Aura Frame */}
      <div
        className={`relative z-10 ${dims} rounded-full p-[2.5px] flex items-center justify-center`}
        style={{
          boxShadow: `0 0 14px ${tierConfig.glowColor}`,
        }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full animate-[spin_5s_linear_infinite]"
          style={{
            background: tierConfig.conicRing,
          }}
        />

        {/* Corner Diamond Studs on Frame */}
        <span
          aria-hidden="true"
          className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 bg-[#fff3c4] border border-amber-700 z-20"
        />

        {/* Inner Avatar Medallion */}
        <div
          className="relative z-10 w-full h-full rounded-full flex items-center justify-center overflow-hidden shadow-inner"
          style={{
            background: avatar.bgGradient,
            border: `1.5px solid ${avatar.borderHex}`,
          }}
        >
          {/* Subtle inner radial sheen */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.32) 0%, transparent 60%)',
            }}
          />
          <EmblemSvg type={avatar.emblem} />
        </div>
      </div>

      {/* Metallic 3D Level Shield Banner */}
      {typeof levelBadge === 'number' && (
        <span
          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 z-20 px-1.5 py-0.2 rounded-md text-[8.5px] font-mono-num font-black tracking-tight whitespace-nowrap shadow-lg flex items-center gap-0.5"
          style={{
            background: tierConfig.shieldBg,
            color: tierConfig.shieldText,
            border: `1px solid ${tierConfig.shieldBorder}`,
            boxShadow: '0 2px 6px rgba(0,0,0,0.9)',
          }}
        >
          <span>Lv.{levelBadge}</span>
        </span>
      )}
    </div>
  );
};

const EmblemSvg: React.FC<{ type: AvatarItem['emblem'] }> = ({ type }) => {
  switch (type) {
    case 'lion':
    case 'sovereign':
      return (
        <svg viewBox="0 0 36 36" className="w-4/5 h-4/5 drop-shadow">
          {/* Crown */}
          <path
            d="M8 13 L12 7 L18 11 L24 7 L28 13 Z"
            fill="#f5b041"
            stroke="#fff3c4"
            strokeWidth="1"
          />
          {/* Lion Mane & Crest */}
          <circle cx="18" cy="21" r="8.5" fill="#d97706" stroke="#fde68a" strokeWidth="1.2" />
          <path
            d="M14 19 L16 19 M20 19 L22 19 M15 24 Q18 26.5 21 24"
            stroke="#1c1917"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="18" cy="9" r="1.3" fill="#ef4444" />
        </svg>
      );
    case 'cleo':
      return (
        <svg viewBox="0 0 36 36" className="w-4/5 h-4/5 drop-shadow">
          <path
            d="M9 14 L18 6 L27 14 L24 27 L12 27 Z"
            fill="#f5b041"
            stroke="#fef08a"
            strokeWidth="1.2"
          />
          <circle cx="18" cy="14" r="3" fill="#06b6d4" />
          <path d="M14 21 L22 21" stroke="#451a03" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'ace':
      return (
        <svg viewBox="0 0 36 36" className="w-4/5 h-4/5 drop-shadow">
          <rect
            x="9"
            y="6"
            width="18"
            height="24"
            rx="3"
            fill="#f8fafc"
            stroke="#f5b041"
            strokeWidth="1.5"
          />
          <path
            d="M18 12 C18 12 13 17 13 20 C13 22 15 23 17 21.5 L16 25 L20 25 L19 21.5 C21 23 23 22 23 20 C23 17 18 12 18 12 Z"
            fill="#0f172a"
          />
        </svg>
      );
    case 'diamond':
      return (
        <svg viewBox="0 0 36 36" className="w-4/5 h-4/5 drop-shadow">
          <polygon
            points="18,5 29,16 18,31 7,16"
            fill="#38bdf8"
            stroke="#e0f2fe"
            strokeWidth="1.5"
          />
          <polygon points="18,9 24,16 18,26 12,16" fill="#bae6fd" opacity="0.65" />
        </svg>
      );
    case 'dragon':
    case 'phoenix':
      return (
        <svg viewBox="0 0 36 36" className="w-4/5 h-4/5 drop-shadow">
          <path
            d="M18 6 C25 10 29 17 24 26 C21 22 19 25 18 30 C17 25 15 22 12 26 C7 17 11 10 18 6 Z"
            fill="#f59e0b"
            stroke="#fef08a"
            strokeWidth="1.2"
          />
          <circle cx="18" cy="16" r="2.5" fill="#fef9c3" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 36 36" className="w-4/5 h-4/5 drop-shadow">
          <path
            d="M6 25 L9 12 L15 18 L18 9 L21 18 L27 12 L30 25 Z"
            fill="#f5b041"
            stroke="#fef08a"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <rect x="8" y="26" width="20" height="3" rx="1.5" fill="#d97706" />
        </svg>
      );
  }
};
