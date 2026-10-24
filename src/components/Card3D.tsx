import React from 'react';
import {
  DeckSkin,
  LETTER_NAMES,
  THIRTY_DECK_SKINS,
} from '../game/data';

interface Card3DProps {
  letter?: string;
  codeName?: string;
  skin?: DeckSkin;
  useLetterColorTheme?: boolean;
  faceDown?: boolean;
  customPhotoUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  tiltClass?: string;
  badgeIndex?: number;
  selected?: boolean;
  glowMatch?: boolean;
  onClick?: () => void;
  className?: string;
}

export const Card3D: React.FC<Card3DProps> = ({
  letter = 'A',
  codeName,
  skin = THIRTY_DECK_SKINS[0],
  faceDown = false,
  customPhotoUrl,
  size = 'md',
  tiltClass = '',
  badgeIndex,
  selected = false,
  glowMatch = false,
  onClick,
  className = '',
}) => {
  const resolvedCode =
    codeName || (letter === 'Z' ? 'OMEGA' : LETTER_NAMES[letter] || 'ALPHA');

  const sizeStyles = {
    xs: 'w-12 h-[68px] rounded-lg',
    sm: 'w-16 h-[92px] rounded-xl',
    md: 'w-20 h-[114px] rounded-xl',
    lg: 'w-28 h-[156px] rounded-2xl',
  }[size];

  const letterSize = {
    xs: 'text-xl',
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-5xl',
  }[size];

  const cornerSize = {
    xs: 'text-[9px]',
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  }[size];

  const hasCustomImage = Boolean(skin.isCustomPhoto && customPhotoUrl);

  if (faceDown) {
    return (
      <div
        onClick={onClick}
        className={`relative select-none transition-transform duration-200 preserve-3d ${sizeStyles} ${tiltClass} ${
          onClick ? 'cursor-pointer active:scale-95' : ''
        } ${className}`}
        style={{
          background: skin.isDark
            ? skin.bgGradient
            : 'linear-gradient(145deg, #1b2820 0%, #09130d 55%, #040806 100%)',
          border: `2px solid ${skin.borderHex || '#f5b041'}`,
          boxShadow:
            '0 8px 18px rgba(0, 0, 0, 0.85), 0 3px 0 #78500d, inset 0 0 10px rgba(245, 176, 65, 0.35)',
        }}
      >
        {hasCustomImage && (
          <img
            src={customPhotoUrl!}
            alt="Custom card back"
            referrerPolicy="no-referrer"
            className="absolute inset-1 w-[calc(100%-8px)] h-[calc(100%-8px)] object-cover rounded-lg opacity-45"
          />
        )}
        {/* Ornate Royal Filigree Inner Frame */}
        <div
          className="absolute inset-1.5 rounded-lg flex flex-col items-center justify-center overflow-hidden"
          style={{
            border: `1px solid ${skin.borderHex || 'rgba(245, 176, 65, 0.55)'}`,
            background:
              'radial-gradient(circle at center, rgba(245, 176, 65, 0.18) 0%, rgba(6, 11, 8, 0.9) 75%)',
          }}
        >
          <div className="card-foil-shine absolute inset-0 pointer-events-none" />
          <svg viewBox="0 0 60 80" className="w-4/5 h-4/5 opacity-90">
            <rect
              x="4"
              y="4"
              width="52"
              height="72"
              rx="4"
              fill="none"
              stroke={skin.borderHex || '#f5b041'}
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <polygon
              points="30,12 46,40 30,68 14,40"
              fill="rgba(245, 176, 65, 0.16)"
              stroke={skin.borderHex || '#f5b041'}
              strokeWidth="1.5"
            />
            <circle cx="30" cy="40" r="9" fill={skin.borderHex || '#f5b041'} opacity="0.9" />
            <path d="M23 39 L26 32 L30 36 L34 32 L37 39 Z" fill="#060b08" />
          </svg>
        </div>
      </div>
    );
  }

  // Strictly use the equipped Deck Skin's exact palette
  const effectiveBg = skin.bgGradient;
  const effectiveBorder = skin.borderHex;
  const effectiveText = skin.textHex;
  const effectiveAccent = skin.accentHex;

  return (
    <div
      onClick={onClick}
      className={`relative select-none transition-all duration-200 preserve-3d overflow-hidden ${sizeStyles} ${tiltClass} ${
        onClick ? 'cursor-pointer active:scale-95' : ''
      } ${
        selected ? 'ring-2 ring-[#ffe082] -translate-y-1.5 scale-105' : ''
      } ${className}`}
      style={{
        background: effectiveBg,
        border: `2px solid ${
          selected || glowMatch ? '#ffe082' : effectiveBorder
        }`,
        boxShadow: glowMatch
          ? '0 0 28px rgba(255, 224, 130, 0.95), 0 10px 24px rgba(0,0,0,0.9)'
          : selected
          ? '0 0 20px rgba(255, 224, 130, 0.8), 0 10px 20px rgba(0,0,0,0.85)'
          : `0 8px 18px rgba(0, 0, 0, 0.8), 0 3px 0 rgba(140, 98, 20, 0.85), inset 0 1px 2px rgba(255, 255, 255, 0.55)`,
      }}
    >
      {/* Optional Lv.100 Custom Photo Backdrop */}
      {hasCustomImage && (
        <div className="absolute inset-0">
          <img
            src={customPhotoUrl!}
            alt="Custom card skin"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-65"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/55" />
        </div>
      )}

      {/* Metallic Foil Shimmer */}
      <div className="card-foil-shine absolute inset-0 pointer-events-none" />

      {/* Intricate Inner Bevel Border */}
      <div
        className="absolute inset-1 rounded-lg pointer-events-none"
        style={{
          border: `1px solid ${effectiveAccent}`,
          opacity: 0.65,
        }}
      />

      {/* Optional Position Order Badge (#1, #2, etc. for Pre-Match Arrange) */}
      {typeof badgeIndex === 'number' && (
        <div
          className="absolute top-1 right-1 z-20 px-1.5 py-0.5 rounded text-[9px] font-mono-num font-extrabold leading-none shadow"
          style={{
            background: badgeIndex === 1 ? '#10b981' : 'rgba(6, 11, 8, 0.9)',
            color: badgeIndex === 1 ? '#042f2e' : '#f5b041',
            border: '1px solid #f5b041',
          }}
        >
          #{badgeIndex}
        </div>
      )}

      {/* Top-Left Corner Pip */}
      <div
        className={`absolute ${
          size === 'xs' ? 'top-1 left-1.5' : 'top-1.5 left-2'
        } z-10 flex flex-col items-center leading-none`}
        style={{ color: effectiveText }}
      >
        <span className={`font-display font-black ${cornerSize}`}>{letter}</span>
        {size !== 'xs' && (
          <svg
            viewBox="0 0 10 10"
            className="w-2 h-2 mt-0.5"
            fill={effectiveAccent}
          >
            <polygon points="5,0 10,5 5,10 0,5" />
          </svg>
        )}
      </div>

      {/* Center Royal Letter & Code Name */}
      <div
        className={`relative z-10 w-full h-full flex flex-col items-center justify-center px-1 ${
          size === 'xs' ? 'pt-2' : ''
        }`}
      >
        <span
          className={`font-display font-black tracking-tight drop-shadow leading-none ${letterSize}`}
          style={{
            color: effectiveText,
            textShadow: skin.isDark
              ? '0 2px 8px rgba(245, 176, 65, 0.55)'
              : '0 1px 2px rgba(0, 0, 0, 0.25)',
          }}
        >
          {letter}
        </span>
        <span
          className="mt-1 px-1 py-0.5 rounded text-[6.5px] font-extrabold tracking-wider uppercase whitespace-nowrap shadow-sm leading-none"
          style={{
            color: skin.isDark ? '#fef08a' : '#1c1917',
            backgroundColor: skin.isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(255, 255, 255, 0.85)',
            border: `1px solid ${effectiveBorder}`,
          }}
        >
          {resolvedCode}
        </span>
      </div>

      {/* Bottom-Right Inverted Corner Pip (sm, md, lg) */}
      {size !== 'xs' && (
        <div
          className="absolute bottom-1 right-1.5 z-10 flex flex-col items-center leading-none rotate-180"
          style={{ color: effectiveText }}
        >
          <span className={`font-display font-black ${cornerSize}`}>{letter}</span>
          {(size === 'md' || size === 'lg') && (
            <svg
              viewBox="0 0 10 10"
              className="w-2 h-2 mt-0.5"
              fill={effectiveAccent}
            >
              <polygon points="5,0 10,5 5,10 0,5" />
            </svg>
          )}
        </div>
      )}
    </div>
  );
};
