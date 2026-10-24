export interface DeckSkin {
  id: string;
  name: string;
  unlockLevel: number;
  priceCoins: number;
  bgGradient: string;
  borderHex: string;
  textHex: string;
  accentHex: string;
  badgeText: string;
  isDark: boolean;
  isCustomPhoto?: boolean;
  patternType: 'classic' | 'obsidian' | 'gold' | 'neon' | 'diamond' | 'ruby' | 'emerald' | 'imperial' | 'cyber' | 'custom';
}

export interface LetterRoyalTheme {
  name: string;
  bgGradient: string;
  borderHex: string;
  textHex: string;
  accentHex: string;
  glowRgba: string;
  pipHex: string;
}

export interface TableSkin {
  id: string;
  name: string;
  subtitle: string;
  unlockLevel: number;
  priceCoins: number;
  feltGradient: string;
  rimGradient: string;
  innerRingHex: string;
  glowRgba: string;
}

export interface StakeOption {
  id: string;
  shortLabel: string;
  entryCoins: number;
  potCoins: number;
  potFormatted: string;
  buttonText: string;
  colorScheme: 'green' | 'blue' | 'purple' | 'red' | 'gold' | 'emerald';
}

export interface AvatarItem {
  id: string;
  name: string;
  title: string;
  unlockLevel: number;
  bgGradient: string;
  borderHex: string;
  emblem: 'lion' | 'crown' | 'cleo' | 'ace' | 'baron' | 'dragon' | 'diamond' | 'phoenix' | 'knight' | 'emperor' | 'valkyrie' | 'sovereign';
}

export interface FriendEntry {
  id: string;
  playerCode: string;
  name: string;
  countryCode: string;
  countryName: string;
  level: number;
  online: boolean;
  statusText: string;
  avatarId: string;
  winningsFormatted: string;
}

export interface FriendRequestEntry {
  id: string;
  playerCode: string;
  name: string;
  level: number;
  avatarId: string;
  direction: 'incoming' | 'sent';
  timestampLabel: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  playerCode: string;
  countryCode: string;
  level: number;
  totalWinnings: number;
  winningsFormatted: string;
  avatarId: string;
}

export const LETTER_NAMES: Record<string, string> = {
  A: 'ALPHA',
  B: 'BRAVO',
  C: 'CHARLIE',
  D: 'DELTA',
  E: 'ECHO',
  F: 'FOXTROT',
  G: 'GOLF',
  H: 'HOTEL',
  I: 'INDIA',
  J: 'JULIET',
  K: 'KILO',
  L: 'LIMA',
  M: 'MIKE',
  N: 'NOVEMBER',
  O: 'OSCAR',
  P: 'PAPA',
  Q: 'QUEBEC',
  R: 'ROMEO',
  S: 'SIERRA',
  T: 'TANGO',
  U: 'UNIFORM',
  V: 'VICTOR',
  W: 'WHISKEY',
  X: 'X-RAY',
  Y: 'YANKEE',
  Z: 'ZULU',
};

const ROYAL_LETTER_PALETTES: LetterRoyalTheme[] = [
  {
    name: 'Imperial Ruby',
    bgGradient: 'linear-gradient(145deg, #7f1d1d 0%, #450a0a 60%, #1f0404 100%)',
    borderHex: '#f5b041',
    textHex: '#fef08a',
    accentHex: '#dc2626',
    glowRgba: 'rgba(220, 38, 38, 0.45)',
    pipHex: '#fca5a5',
  },
  {
    name: 'Royal Sapphire',
    bgGradient: 'linear-gradient(145deg, #1e3a8a 0%, #172554 60%, #091128 100%)',
    borderHex: '#f5b041',
    textHex: '#e0f2fe',
    accentHex: '#2563eb',
    glowRgba: 'rgba(37, 99, 235, 0.45)',
    pipHex: '#93c5fd',
  },
  {
    name: 'Crown Emerald',
    bgGradient: 'linear-gradient(145deg, #065f46 0%, #064e3b 60%, #022c22 100%)',
    borderHex: '#f5b041',
    textHex: '#ecfdf5',
    accentHex: '#059669',
    glowRgba: 'rgba(16, 185, 129, 0.45)',
    pipHex: '#6ee7b7',
  },
  {
    name: 'Sovereign Amethyst',
    bgGradient: 'linear-gradient(145deg, #581c87 0%, #3b0764 60%, #1a032e 100%)',
    borderHex: '#f5b041',
    textHex: '#fae8ff',
    accentHex: '#9333ea',
    glowRgba: 'rgba(147, 51, 234, 0.45)',
    pipHex: '#d8b4fe',
  },
  {
    name: 'Sunburst Bullion Gold',
    bgGradient: 'linear-gradient(145deg, #78350f 0%, #451a03 60%, #230c01 100%)',
    borderHex: '#ffe082',
    textHex: '#fef9c3',
    accentHex: '#d97706',
    glowRgba: 'rgba(245, 158, 11, 0.5)',
    pipHex: '#fde047',
  },
  {
    name: 'Midnight Turquoise',
    bgGradient: 'linear-gradient(145deg, #155e75 0%, #164e63 60%, #082f49 100%)',
    borderHex: '#f5b041',
    textHex: '#cffafe',
    accentHex: '#0891b2',
    glowRgba: 'rgba(6, 182, 212, 0.45)',
    pipHex: '#67e8f9',
  },
  {
    name: 'Crimson Rose Imperial',
    bgGradient: 'linear-gradient(145deg, #881337 0%, #4c0519 60%, #26020c 100%)',
    borderHex: '#f5b041',
    textHex: '#ffe4e6',
    accentHex: '#e11d48',
    glowRgba: 'rgba(225, 29, 72, 0.45)',
    pipHex: '#fda4af',
  },
];

/**
 * Deterministic Royal Color Theme per letter (A-Z).
 * Ensures that whenever the same letter (e.g. 'K' on 'K') is thrown by both players,
 * both matching cards share the exact same royal color theme!
 */
export function getLetterRoyalTheme(letter: string): LetterRoyalTheme {
  const clean = (letter || 'A').toUpperCase().charCodeAt(0) - 65;
  const idx = Math.abs(clean) % ROYAL_LETTER_PALETTES.length;
  return ROYAL_LETTER_PALETTES[idx];
}

export const STAKE_OPTIONS: StakeOption[] = [
  {
    id: '2k',
    shortLabel: '2K',
    entryCoins: 2000,
    potCoins: 4000,
    potFormatted: '4,000',
    buttonText: '2K (4,000)',
    colorScheme: 'green',
  },
  {
    id: '5k',
    shortLabel: '5K',
    entryCoins: 5000,
    potCoins: 10000,
    potFormatted: '10,000',
    buttonText: '5K (10,000)',
    colorScheme: 'blue',
  },
  {
    id: '20k',
    shortLabel: '20K',
    entryCoins: 20000,
    potCoins: 40000,
    potFormatted: '40,000',
    buttonText: '20K (40,000)',
    colorScheme: 'purple',
  },
  {
    id: '50k',
    shortLabel: '50K',
    entryCoins: 50000,
    potCoins: 100000,
    potFormatted: '1,00,000',
    buttonText: '50K (1,00,000)',
    colorScheme: 'red',
  },
  {
    id: '1l',
    shortLabel: '1L',
    entryCoins: 100000,
    potCoins: 200000,
    potFormatted: '2,00,000',
    buttonText: '1L (2,00,000)',
    colorScheme: 'gold',
  },
  {
    id: '5l',
    shortLabel: '5L',
    entryCoins: 500000,
    potCoins: 1000000,
    potFormatted: '10,00,000',
    buttonText: '5L (10,00,000)',
    colorScheme: 'emerald',
  },
];

export const DECK_SIZES = [20, 30, 40, 50, 60] as const;

export const THIRTY_DECK_SKINS: DeckSkin[] = [
  {
    id: 'pearl-white',
    name: 'Pearl White Classic',
    unlockLevel: 1,
    priceCoins: 0,
    bgGradient: 'linear-gradient(145deg, #ffffff 0%, #f4efe6 60%, #e5dccb 100%)',
    borderHex: '#d4af37',
    textHex: '#121814',
    accentHex: '#b7791f',
    badgeText: 'ROYAL LV.1',
    isDark: false,
    patternType: 'classic',
  },
  {
    id: 'obsidian-black',
    name: 'Obsidian Pitch Black',
    unlockLevel: 1,
    priceCoins: 0,
    bgGradient: 'linear-gradient(145deg, #1b221e 0%, #0b110e 55%, #050806 100%)',
    borderHex: '#f5b041',
    textHex: '#f8c471',
    accentHex: '#d4af37',
    badgeText: 'NOIR LV.1',
    isDark: true,
    patternType: 'obsidian',
  },
  {
    id: 'royal-gold-foil',
    name: 'Royal Gold Foil Deck',
    unlockLevel: 2,
    priceCoins: 2500,
    bgGradient: 'linear-gradient(145deg, #ffe89e 0%, #f5b041 45%, #b7791f 85%, #7d520e 100%)',
    borderHex: '#fff3c4',
    textHex: '#1f1302',
    accentHex: '#5c3b05',
    badgeText: '24K FOIL',
    isDark: false,
    patternType: 'gold',
  },
  {
    id: 'cyber-neon-glow',
    name: 'Cyber Neon Glow Deck',
    unlockLevel: 4,
    priceCoins: 4000,
    bgGradient: 'linear-gradient(145deg, #0b192c 0%, #060b16 65%, #02050a 100%)',
    borderHex: '#00f5d4',
    textHex: '#00f5d4',
    accentHex: '#38bdf8',
    badgeText: 'NEON PULSE',
    isDark: true,
    patternType: 'neon',
  },
  {
    id: 'diamond-crystal',
    name: 'Diamond Crystal Deck',
    unlockLevel: 6,
    priceCoins: 6000,
    bgGradient: 'linear-gradient(145deg, #ecfeff 0%, #cffafe 50%, #a5f3fc 100%)',
    borderHex: '#38bdf8',
    textHex: '#0f172a',
    accentHex: '#0284c7',
    badgeText: 'DIAMOND ICE',
    isDark: false,
    patternType: 'diamond',
  },
  {
    id: 'ruby-red-imperial',
    name: 'Ruby Red Imperial',
    unlockLevel: 8,
    priceCoins: 8000,
    bgGradient: 'linear-gradient(145deg, #7f1d1d 0%, #450a0a 65%, #280505 100%)',
    borderHex: '#f5b041',
    textHex: '#fef08a',
    accentHex: '#ef4444',
    badgeText: 'IMPERIAL RUBY',
    isDark: true,
    patternType: 'ruby',
  },
  {
    id: 'emerald-sovereign',
    name: 'Emerald Sovereign Foil',
    unlockLevel: 10,
    priceCoins: 10000,
    bgGradient: 'linear-gradient(145deg, #065f46 0%, #064e3b 60%, #022c22 100%)',
    borderHex: '#fbbf24',
    textHex: '#fef3c7',
    accentHex: '#34d399',
    badgeText: 'SOVEREIGN',
    isDark: true,
    patternType: 'emerald',
  },
  {
    id: 'monte-carlo-platinum',
    name: 'Monte Carlo Platinum',
    unlockLevel: 12,
    priceCoins: 12000,
    bgGradient: 'linear-gradient(145deg, #f8fafc 0%, #cbd5e1 55%, #94a3b8 100%)',
    borderHex: '#e2e8f0',
    textHex: '#0f172a',
    accentHex: '#475569',
    badgeText: 'PLATINUM VIP',
    isDark: false,
    patternType: 'classic',
  },
  {
    id: 'sapphire-dynasty',
    name: 'Sapphire Dynasty Deck',
    unlockLevel: 15,
    priceCoins: 15000,
    bgGradient: 'linear-gradient(145deg, #1e3a8a 0%, #172554 65%, #091128 100%)',
    borderHex: '#f5b041',
    textHex: '#fde68a',
    accentHex: '#60a5fa',
    badgeText: 'DYNASTY',
    isDark: true,
    patternType: 'imperial',
  },
  {
    id: 'amethyst-crown',
    name: 'Amethyst Royal Crown',
    unlockLevel: 18,
    priceCoins: 18000,
    bgGradient: 'linear-gradient(145deg, #581c87 0%, #3b0764 65%, #1e0336 100%)',
    borderHex: '#f5b041',
    textHex: '#f3e8ff',
    accentHex: '#c084fc',
    badgeText: 'AMETHYST',
    isDark: true,
    patternType: 'imperial',
  },
  {
    id: 'rose-gold-velvet',
    name: 'Rose Gold Contessa',
    unlockLevel: 21,
    priceCoins: 20000,
    bgGradient: 'linear-gradient(145deg, #ffe4e6 0%, #fda4af 55%, #e11d48 100%)',
    borderHex: '#fff1f2',
    textHex: '#4c0519',
    accentHex: '#9f1239',
    badgeText: 'ROSE GOLD',
    isDark: false,
    patternType: 'gold',
  },
  {
    id: 'macau-dragon-gold',
    name: 'Macau Dragon Emblem',
    unlockLevel: 24,
    priceCoins: 24000,
    bgGradient: 'linear-gradient(145deg, #991b1b 0%, #7f1d1d 50%, #450a0a 100%)',
    borderHex: '#fbbf24',
    textHex: '#fde047',
    accentHex: '#f59e0b',
    badgeText: 'DRAGON VIP',
    isDark: true,
    patternType: 'ruby',
  },
  {
    id: 'carbon-titanium',
    name: 'Carbon Titanium Mesh',
    unlockLevel: 28,
    priceCoins: 28000,
    bgGradient: 'linear-gradient(145deg, #27272a 0%, #18181b 60%, #09090b 100%)',
    borderHex: '#a1a1aa',
    textHex: '#f4f4f5',
    accentHex: '#eab308',
    badgeText: 'TITANIUM',
    isDark: true,
    patternType: 'obsidian',
  },
  {
    id: 'venetian-ivory',
    name: 'Venetian Carved Ivory',
    unlockLevel: 32,
    priceCoins: 32000,
    bgGradient: 'linear-gradient(145deg, #fefce8 0%, #fef08a 45%, #eab308 100%)',
    borderHex: '#ca8a04',
    textHex: '#422006',
    accentHex: '#854d0e',
    badgeText: 'VENETIAN',
    isDark: false,
    patternType: 'classic',
  },
  {
    id: 'jade-emperor',
    name: 'Imperial Jade Palace',
    unlockLevel: 36,
    priceCoins: 36000,
    bgGradient: 'linear-gradient(145deg, #115e59 0%, #134e4a 60%, #042f2e 100%)',
    borderHex: '#f5b041',
    textHex: '#ccfbf1',
    accentHex: '#2dd4bf',
    badgeText: 'JADE PALACE',
    isDark: true,
    patternType: 'emerald',
  },
  {
    id: 'vegas-high-roller',
    name: 'Bellagio High Roller',
    unlockLevel: 40,
    priceCoins: 40000,
    bgGradient: 'linear-gradient(145deg, #1c1917 0%, #0c0a09 65%, #000000 100%)',
    borderHex: '#f59e0b',
    textHex: '#fbbf24',
    accentHex: '#d97706',
    badgeText: 'HIGH ROLLER',
    isDark: true,
    patternType: 'gold',
  },
  {
    id: 'arctic-aurora',
    name: 'Arctic Aurora Borealis',
    unlockLevel: 44,
    priceCoins: 44000,
    bgGradient: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 55%, #042f2e 100%)',
    borderHex: '#34d399',
    textHex: '#a7f3d0',
    accentHex: '#818cf8',
    badgeText: 'AURORA',
    isDark: true,
    patternType: 'neon',
  },
  {
    id: 'pharaoh-sun-gold',
    name: 'Pharaoh Sun Scarab',
    unlockLevel: 48,
    priceCoins: 48000,
    bgGradient: 'linear-gradient(145deg, #f59e0b 0%, #b45309 60%, #78350f 100%)',
    borderHex: '#fef08a',
    textHex: '#fffbeb',
    accentHex: '#fde047',
    badgeText: 'SUN PHARAOH',
    isDark: true,
    patternType: 'gold',
  },
  {
    id: 'crimson-velvet-ace',
    name: 'Crimson Velvet Ace',
    unlockLevel: 52,
    priceCoins: 52000,
    bgGradient: 'linear-gradient(145deg, #881337 0%, #4c0519 65%, #27020c 100%)',
    borderHex: '#f5b041',
    textHex: '#ffe4e6',
    accentHex: '#fb7185',
    badgeText: 'CRIMSON ACE',
    isDark: true,
    patternType: 'ruby',
  },
  {
    id: 'celestial-constellation',
    name: 'Celestial Starlight',
    unlockLevel: 56,
    priceCoins: 56000,
    bgGradient: 'linear-gradient(145deg, #172554 0%, #0f172a 60%, #020617 100%)',
    borderHex: '#fcd34d',
    textHex: '#fef3c7',
    accentHex: '#93c5fd',
    badgeText: 'ASTRAL',
    isDark: true,
    patternType: 'diamond',
  },
  {
    id: 'bronze-gladiator',
    name: 'Colosseum Bronze Foil',
    unlockLevel: 60,
    priceCoins: 60000,
    bgGradient: 'linear-gradient(145deg, #7c2d12 0%, #431407 65%, #270b03 100%)',
    borderHex: '#fdba74',
    textHex: '#ffedd5',
    accentHex: '#fb923c',
    badgeText: 'GLADIATOR',
    isDark: true,
    patternType: 'imperial',
  },
  {
    id: 'quantum-prism',
    name: 'Quantum Hologram Prism',
    unlockLevel: 65,
    priceCoins: 65000,
    bgGradient: 'linear-gradient(145deg, #ecfeff 0%, #e0e7ff 50%, #fae8ff 100%)',
    borderHex: '#a855f7',
    textHex: '#1e1b4b',
    accentHex: '#06b6d4',
    badgeText: 'HOLOGRAM',
    isDark: false,
    patternType: 'diamond',
  },
  {
    id: 'black-lotus-vip',
    name: 'Black Lotus Syndicate',
    unlockLevel: 70,
    priceCoins: 70000,
    bgGradient: 'linear-gradient(145deg, #090d0b 0%, #040705 65%, #000000 100%)',
    borderHex: '#10b981',
    textHex: '#6ee7b7',
    accentHex: '#f5b041',
    badgeText: 'BLACK LOTUS',
    isDark: true,
    patternType: 'obsidian',
  },
  {
    id: 'versailles-mirror',
    name: 'Versailles Gilded Mirror',
    unlockLevel: 75,
    priceCoins: 75000,
    bgGradient: 'linear-gradient(145deg, #fffbeb 0%, #fde68a 50%, #f59e0b 100%)',
    borderHex: '#b45309',
    textHex: '#451a03',
    accentHex: '#92400e',
    badgeText: 'VERSAILLES',
    isDark: false,
    patternType: 'gold',
  },
  {
    id: 'shadow-shogun',
    name: 'Shadow Shogun Lacquer',
    unlockLevel: 80,
    priceCoins: 80000,
    bgGradient: 'linear-gradient(145deg, #18181b 0%, #270909 60%, #09090b 100%)',
    borderHex: '#ef4444',
    textHex: '#fca5a5',
    accentHex: '#f5b041',
    badgeText: 'SHOGUN',
    isDark: true,
    patternType: 'ruby',
  },
  {
    id: 'solaris-supernova',
    name: 'Solaris Flare Crown',
    unlockLevel: 84,
    priceCoins: 85000,
    bgGradient: 'linear-gradient(145deg, #9a3412 0%, #7c2d12 55%, #431407 100%)',
    borderHex: '#fde047',
    textHex: '#fef9c3',
    accentHex: '#facc15',
    badgeText: 'SOLARIS',
    isDark: true,
    patternType: 'gold',
  },
  {
    id: 'valkyrie-winged-gold',
    name: 'Valkyrie Winged Gold',
    unlockLevel: 88,
    priceCoins: 90000,
    bgGradient: 'linear-gradient(145deg, #1e293b 0%, #0f172a 60%, #020617 100%)',
    borderHex: '#f5b041',
    textHex: '#f8fafc',
    accentHex: '#fbbf24',
    badgeText: 'VALKYRIE',
    isDark: true,
    patternType: 'imperial',
  },
  {
    id: 'billionaire-bullion',
    name: 'Geneva Gold Bullion',
    unlockLevel: 92,
    priceCoins: 95000,
    bgGradient: 'linear-gradient(145deg, #fef08a 0%, #eab308 45%, #a16207 90%)',
    borderHex: '#ffffff',
    textHex: '#1c1917',
    accentHex: '#713f12',
    badgeText: '999.9 FINE',
    isDark: false,
    patternType: 'gold',
  },
  {
    id: 'eternal-grandmaster',
    name: 'Grandmaster Sovereign 99',
    unlockLevel: 96,
    priceCoins: 100000,
    bgGradient: 'linear-gradient(145deg, #064e3b 0%, #022c22 50%, #060b08 100%)',
    borderHex: '#f5b041',
    textHex: '#fde68a',
    accentHex: '#10b981',
    badgeText: 'GRANDMASTER',
    isDark: true,
    patternType: 'emerald',
  },
  {
    id: 'custom-photo-100',
    name: 'Lv.100 Custom Photo Deck',
    unlockLevel: 100,
    priceCoins: 0,
    bgGradient: 'linear-gradient(145deg, #2e1065 0%, #0f172a 50%, #064e3b 100%)',
    borderHex: '#f5b041',
    textHex: '#ffffff',
    accentHex: '#f5b041',
    badgeText: 'CUSTOM GALLERY',
    isDark: true,
    isCustomPhoto: true,
    patternType: 'custom',
  },
];

export const FIVE_TABLES: TableSkin[] = [
  {
    id: 'casino-green-velvet',
    name: 'Casino Green Velvet',
    subtitle: 'Classic Royal Felt • Brass Handles',
    unlockLevel: 1,
    priceCoins: 0,
    feltGradient: 'radial-gradient(ellipse at center, #157347 0%, #0f5132 55%, #072b1a 100%)',
    rimGradient: 'linear-gradient(180deg, #ffe082 0%, #d4af37 45%, #8f5e0c 100%)',
    innerRingHex: '#34d399',
    glowRgba: 'rgba(16, 185, 129, 0.28)',
  },
  {
    id: 'vip-monte-carlo-red',
    name: 'VIP Monte Carlo Red Velvet',
    subtitle: 'Crimson Imperial Felt • 24K Trim',
    unlockLevel: 5,
    priceCoins: 5000,
    feltGradient: 'radial-gradient(ellipse at center, #991b1b 0%, #6b1111 55%, #380606 100%)',
    rimGradient: 'linear-gradient(180deg, #ffe082 0%, #f5b041 45%, #9a6b13 100%)',
    innerRingHex: '#f87171',
    glowRgba: 'rgba(239, 68, 68, 0.28)',
  },
  {
    id: 'emerald-royal-casino',
    name: 'Emerald Royal Casino',
    subtitle: 'Deep Crown Jewel Velvet • Gold Inlay',
    unlockLevel: 12,
    priceCoins: 15000,
    feltGradient: 'radial-gradient(ellipse at center, #059669 0%, #064e3b 58%, #022c22 100%)',
    rimGradient: 'linear-gradient(180deg, #fff3c4 0%, #f5b041 45%, #b7791f 100%)',
    innerRingHex: '#fbbf24',
    glowRgba: 'rgba(245, 176, 65, 0.32)',
  },
  {
    id: 'royal-mahogany-red',
    name: 'Royal Mahogany Red',
    subtitle: 'Aged Bourbon Wood & Wine Felt',
    unlockLevel: 25,
    priceCoins: 35000,
    feltGradient: 'radial-gradient(ellipse at center, #7c2d12 0%, #431407 60%, #1f0802 100%)',
    rimGradient: 'linear-gradient(180deg, #fde68a 0%, #d97706 50%, #78350f 100%)',
    innerRingHex: '#fb923c',
    glowRgba: 'rgba(249, 115, 22, 0.28)',
  },
  {
    id: 'midnight-vip-blue',
    name: 'Midnight VIP Blue',
    subtitle: 'Starlight Sapphire High-Roller Salon',
    unlockLevel: 40,
    priceCoins: 60000,
    feltGradient: 'radial-gradient(ellipse at center, #1e3a8a 0%, #172554 58%, #090f24 100%)',
    rimGradient: 'linear-gradient(180deg, #e0f2fe 0%, #f5b041 50%, #9a6b13 100%)',
    innerRingHex: '#60a5fa',
    glowRgba: 'rgba(59, 130, 246, 0.3)',
  },
];

export const AVATAR_LIST: AvatarItem[] = [
  {
    id: 'king-sovereign',
    name: 'King Sovereign',
    title: 'Golden Lion Monarch',
    unlockLevel: 1,
    bgGradient: 'linear-gradient(135deg, #78350f 0%, #451a03 100%)',
    borderHex: '#f5b041',
    emblem: 'lion',
  },
  {
    id: 'king-aurelius',
    name: 'King Aurelius',
    title: 'Sun Crown Emperor',
    unlockLevel: 1,
    bgGradient: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
    borderHex: '#f5b041',
    emblem: 'crown',
  },
  {
    id: 'empress-cleo',
    name: 'Empress Cleo',
    title: 'Queen of the Nile VIP',
    unlockLevel: 5,
    bgGradient: 'linear-gradient(135deg, #581c87 0%, #2e1065 100%)',
    borderHex: '#fbbf24',
    emblem: 'cleo',
  },
  {
    id: 'viktor-ace',
    name: 'Viktor Ace',
    title: 'Monte Carlo Card Shark',
    unlockLevel: 10,
    bgGradient: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
    borderHex: '#60a5fa',
    emblem: 'ace',
  },
  {
    id: 'baron-sterling',
    name: 'Baron Sterling',
    title: 'High Stakes Syndicate',
    unlockLevel: 20,
    bgGradient: 'linear-gradient(135deg, #334155 0%, #0f172a 100%)',
    borderHex: '#e2e8f0',
    emblem: 'baron',
  },
  {
    id: 'duke-draco',
    name: 'Duke Draco',
    title: 'Macau Dragon Sovereign',
    unlockLevel: 30,
    bgGradient: 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)',
    borderHex: '#f59e0b',
    emblem: 'dragon',
  },
  {
    id: 'duchess-celeste',
    name: 'Duchess Celeste',
    title: 'Diamond Salon Heiress',
    unlockLevel: 45,
    bgGradient: 'linear-gradient(135deg, #0e7490 0%, #164e63 100%)',
    borderHex: '#67e8f9',
    emblem: 'diamond',
  },
  {
    id: 'lord-ignis',
    name: 'Lord Ignis',
    title: 'Imperial Phoenix Tactician',
    unlockLevel: 60,
    bgGradient: 'linear-gradient(135deg, #9a3412 0%, #431407 100%)',
    borderHex: '#fde047',
    emblem: 'phoenix',
  },
  {
    id: 'sir-lancelot',
    name: 'Sir Lancelot',
    title: 'Royal Guard Grand Knight',
    unlockLevel: 75,
    bgGradient: 'linear-gradient(135deg, #115e59 0%, #042f2e 100%)',
    borderHex: '#34d399',
    emblem: 'knight',
  },
  {
    id: 'lady-valkyrie',
    name: 'Lady Valkyrie',
    title: 'Immortal Golden Wing',
    unlockLevel: 90,
    bgGradient: 'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)',
    borderHex: '#f5b041',
    emblem: 'valkyrie',
  },
  {
    id: 'grandmaster-apex',
    name: 'Grandmaster Apex',
    title: 'Lv. 100 Immortal Legend',
    unlockLevel: 100,
    bgGradient: 'linear-gradient(135deg, #b45309 0%, #064e3b 50%, #000000 100%)',
    borderHex: '#fef08a',
    emblem: 'sovereign',
  },
];

export const INITIAL_FRIENDS: FriendEntry[] = [
  {
    id: 'fr-1',
    playerCode: 'AR-99K2LM',
    name: 'Empress Cleo',
    countryCode: 'UK',
    countryName: 'United Kingdom',
    level: 42,
    online: true,
    statusText: 'Online • Ready for 2K/5K Table',
    avatarId: 'empress-cleo',
    winningsFormatted: '14,80,000',
  },
  {
    id: 'fr-2',
    playerCode: 'AR-77VX8P',
    name: 'Viktor Ace',
    countryCode: 'MC',
    countryName: 'Monaco',
    level: 68,
    online: true,
    statusText: 'Online • High-Roller Lobby',
    avatarId: 'viktor-ace',
    winningsFormatted: '52,40,000',
  },
  {
    id: 'fr-3',
    playerCode: 'AR-31Z9QW',
    name: 'Maharaja Kabir',
    countryCode: 'IN',
    countryName: 'India',
    level: 85,
    online: true,
    statusText: 'In Match • 1L Pot Table',
    avatarId: 'king-aurelius',
    winningsFormatted: '1,28,00,000',
  },
  {
    id: 'fr-4',
    playerCode: 'AR-54BN2T',
    name: 'Baron Sterling',
    countryCode: 'US',
    countryName: 'United States',
    level: 29,
    online: false,
    statusText: 'Last seen 14m ago',
    avatarId: 'baron-sterling',
    winningsFormatted: '6,90,000',
  },
  {
    id: 'fr-5',
    playerCode: 'AR-88DR4K',
    name: 'Duke Draco',
    countryCode: 'SG',
    countryName: 'Singapore',
    level: 94,
    online: true,
    statusText: 'Online • VIP Emerald Salon',
    avatarId: 'duke-draco',
    winningsFormatted: '3,45,00,000',
  },
  {
    id: 'fr-6',
    playerCode: 'AR-19CL6H',
    name: 'Duchess Celeste',
    countryCode: 'FR',
    countryName: 'France',
    level: 51,
    online: true,
    statusText: 'Online • 30-Card Deck Room',
    avatarId: 'duchess-celeste',
    winningsFormatted: '21,10,000',
  },
];

export const INITIAL_FRIEND_REQUESTS: FriendRequestEntry[] = [
  {
    id: 'req-1',
    playerCode: 'AR-702VIP',
    name: 'Sultan Al-Rashid',
    level: 99,
    avatarId: 'king-sovereign',
    direction: 'incoming',
    timestampLabel: '2m ago',
  },
  {
    id: 'req-2',
    playerCode: 'AR-408ACE',
    name: 'Lady Valkyrie',
    level: 91,
    avatarId: 'lady-valkyrie',
    direction: 'incoming',
    timestampLabel: '15m ago',
  },
];

export const TOP_100_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'Grandmaster Apex', playerCode: 'AR-01APEX', countryCode: 'MC', level: 100, totalWinnings: 98500000, winningsFormatted: '9,85,00,000', avatarId: 'grandmaster-apex' },
  { rank: 2, name: 'Sultan Al-Rashid', playerCode: 'AR-02GOLD', countryCode: 'AE', level: 99, totalWinnings: 84200000, winningsFormatted: '8,42,00,000', avatarId: 'king-sovereign' },
  { rank: 3, name: 'Duke Draco', playerCode: 'AR-88DR4K', countryCode: 'SG', level: 94, totalWinnings: 34500000, winningsFormatted: '3,45,00,000', avatarId: 'duke-draco' },
  { rank: 4, name: 'Lady Valkyrie', playerCode: 'AR-04VALK', countryCode: 'SE', level: 91, totalWinnings: 29100000, winningsFormatted: '2,91,00,000', avatarId: 'lady-valkyrie' },
  { rank: 5, name: 'Maharaja Kabir', playerCode: 'AR-31Z9QW', countryCode: 'IN', level: 85, totalWinnings: 12800000, winningsFormatted: '1,28,00,000', avatarId: 'king-aurelius' },
  { rank: 6, name: 'Sir Lancelot', playerCode: 'AR-06KNIG', countryCode: 'UK', level: 79, totalWinnings: 9400000, winningsFormatted: '94,00,000', avatarId: 'sir-lancelot' },
  { rank: 7, name: 'Viktor Ace', playerCode: 'AR-77VX8P', countryCode: 'MC', level: 68, totalWinnings: 5240000, winningsFormatted: '52,40,000', avatarId: 'viktor-ace' },
  { rank: 8, name: 'Lord Ignis', playerCode: 'AR-08PHNX', countryCode: 'JP', level: 63, totalWinnings: 4180000, winningsFormatted: '41,80,000', avatarId: 'lord-ignis' },
  { rank: 9, name: 'Duchess Celeste', playerCode: 'AR-19CL6H', countryCode: 'FR', level: 51, totalWinnings: 2110000, winningsFormatted: '21,10,000', avatarId: 'duchess-celeste' },
  { rank: 10, name: 'Empress Cleo', playerCode: 'AR-99K2LM', countryCode: 'UK', level: 42, totalWinnings: 1480000, winningsFormatted: '14,80,000', avatarId: 'empress-cleo' },
  { rank: 11, name: 'Baron Sterling', playerCode: 'AR-54BN2T', countryCode: 'US', level: 29, totalWinnings: 690000, winningsFormatted: '6,90,000', avatarId: 'baron-sterling' },
  { rank: 12, name: 'Lorenzo Medici', playerCode: 'AR-12MEDI', countryCode: 'IT', level: 24, totalWinnings: 420000, winningsFormatted: '4,20,000', avatarId: 'king-aurelius' },
];

export const WHEEL_SEGMENTS = [
  { id: 0, label: '500', coins: 500, colorStart: '#146c43', colorEnd: '#062e1b' },
  { id: 1, label: '1,500', coins: 1500, colorStart: '#b45309', colorEnd: '#451a03' },
  { id: 2, label: '1,000', coins: 1000, colorStart: '#1d4ed8', colorEnd: '#0f172a' },
  { id: 3, label: '5,000', coins: 5000, colorStart: '#7e22ce', colorEnd: '#2e1065' },
  { id: 4, label: '750', coins: 750, colorStart: '#047857', colorEnd: '#022c22' },
  { id: 5, label: '10,000', coins: 10000, colorStart: '#b91c1c', colorEnd: '#450a0a' },
  { id: 6, label: '2,000', coins: 2000, colorStart: '#1e40af', colorEnd: '#091128' },
  { id: 7, label: '25,000', coins: 25000, colorStart: '#f59e0b', colorEnd: '#78350f' },
];
