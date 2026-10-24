export const ADMOB_CONFIG = {
  APP_ID: 'ca-app-pub-4220750286370813~3760189051',
  BANNER_AD_UNIT: 'ca-app-pub-4220750286370813/8896965666',
  INTERSTITIAL_AD_UNIT: 'ca-app-pub-4220750286370813/4678344042',
  REWARDED_AD_UNIT: 'ca-app-pub-4220750286370813/6957023022',
} as const;

export const INDIAN_OPPONENT_PROFILES = [
  { name: 'Aarav Sharma', title: 'Mumbai Royal Club', winRate: '68%' },
  { name: 'Rohan Verma', title: 'Delhi High Roller', winRate: '71%' },
  { name: 'Priya Patel', title: 'Ahmedabad Grandmaster', winRate: '74%' },
  { name: 'Vikram Singh', title: 'Jaipur Palace League', winRate: '66%' },
  { name: 'Ananya Iyer', title: 'Bengaluru Elite', winRate: '72%' },
  { name: 'Kabir Malhotra', title: 'Chandigarh Aces', winRate: '69%' },
  { name: 'Devika Nair', title: 'Kochi Royal Table', winRate: '70%' },
  { name: 'Aditya Deshmukh', title: 'Pune Sovereign', winRate: '67%' },
] as const;

export function pickRandomIndianOpponent(excludeName?: string) {
  const pool = INDIAN_OPPONENT_PROFILES.filter(
    (p) => !excludeName || p.name.toLowerCase() !== excludeName.toLowerCase()
  );
  const index = Math.floor(Math.random() * pool.length);
  return pool[index] || INDIAN_OPPONENT_PROFILES[0];
}

declare global {
  interface Window {
    admob?: any;
    AdMob?: any;
    AdMobBridge?: {
      showBanner?: (adUnitId: string) => void;
      hideBanner?: () => void;
      showInterstitial?: (adUnitId: string) => Promise<boolean> | void;
      showRewarded?: (adUnitId: string) => Promise<boolean> | void;
    };
  }
}

export function isNativeAdMobAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.admob || window.AdMob || window.AdMobBridge);
}

export function initNativeBannerAd(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.AdMobBridge?.showBanner) {
      window.AdMobBridge.showBanner(ADMOB_CONFIG.BANNER_AD_UNIT);
      return true;
    }
    const bridge = window.admob || window.AdMob;
    if (bridge?.banner) {
      if (typeof bridge.banner.config === 'function') {
        bridge.banner.config({
          id: ADMOB_CONFIG.BANNER_AD_UNIT,
          isTesting: false,
          autoShow: true,
        });
        bridge.banner.prepare?.();
      } else if (typeof bridge.banner.show === 'function') {
        bridge.banner.show({ id: ADMOB_CONFIG.BANNER_AD_UNIT });
      }
      return true;
    }
    if (bridge?.showBanner) {
      bridge.showBanner({ adId: ADMOB_CONFIG.BANNER_AD_UNIT, autoShow: true });
      return true;
    }
  } catch {
    // Fallback cleanly to web banner slot
  }
  return false;
}

export async function triggerNativeInterstitialAd(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    if (window.AdMobBridge?.showInterstitial) {
      await window.AdMobBridge.showInterstitial(ADMOB_CONFIG.INTERSTITIAL_AD_UNIT);
      return true;
    }
    const bridge = window.admob || window.AdMob;
    if (bridge?.interstitial) {
      if (typeof bridge.interstitial.config === 'function') {
        bridge.interstitial.config({
          id: ADMOB_CONFIG.INTERSTITIAL_AD_UNIT,
          isTesting: false,
          autoShow: true,
        });
        bridge.interstitial.prepare?.();
      } else if (typeof bridge.interstitial.show === 'function') {
        await bridge.interstitial.show({ id: ADMOB_CONFIG.INTERSTITIAL_AD_UNIT });
      }
      return true;
    }
    if (bridge?.prepareInterstitial) {
      await bridge.prepareInterstitial({
        adId: ADMOB_CONFIG.INTERSTITIAL_AD_UNIT,
        autoShow: true,
      });
      return true;
    }
  } catch {
    // Fallback cleanly to web interstitial overlay
  }
  return false;
}

export async function triggerNativeRewardedAd(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    if (window.AdMobBridge?.showRewarded) {
      await window.AdMobBridge.showRewarded(ADMOB_CONFIG.REWARDED_AD_UNIT);
      return true;
    }
    const bridge = window.admob || window.AdMob;
    if (bridge?.rewardvideo) {
      if (typeof bridge.rewardvideo.config === 'function') {
        bridge.rewardvideo.config({
          id: ADMOB_CONFIG.REWARDED_AD_UNIT,
          isTesting: false,
          autoShow: true,
        });
        bridge.rewardvideo.prepare?.();
      } else if (typeof bridge.rewardvideo.show === 'function') {
        await bridge.rewardvideo.show({ id: ADMOB_CONFIG.REWARDED_AD_UNIT });
      }
      return true;
    }
    if (bridge?.prepareRewardVideoAd) {
      await bridge.prepareRewardVideoAd({
        adId: ADMOB_CONFIG.REWARDED_AD_UNIT,
        autoShow: true,
      });
      return true;
    }
  } catch {
    // Fallback cleanly to web rewarded video modal
  }
  return false;
}
