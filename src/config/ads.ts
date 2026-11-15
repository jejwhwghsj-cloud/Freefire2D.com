export interface AdsConfig {
  adsenseClientId: string;
  topSlotId: string;
  midSlotId: string;
  bottomSlotId: string;
  rewardSlotId: string;
  interstitialSlotId: string;
  customSponsorLink: string;
  customSponsorTitle: string;
  customSponsorCta: string;
}

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};

export const adsConfig: AdsConfig = {
  adsenseClientId: (env.VITE_ADSENSE_CLIENT_ID || '').trim(),
  topSlotId: (env.VITE_ADSENSE_TOP_SLOT || '').trim(),
  midSlotId: (env.VITE_ADSENSE_MID_SLOT || '').trim(),
  bottomSlotId: (env.VITE_ADSENSE_BOTTOM_SLOT || '').trim(),
  rewardSlotId: (env.VITE_ADSENSE_REWARD_SLOT || '').trim(),
  interstitialSlotId: (env.VITE_ADSENSE_INTERSTITIAL_SLOT || '').trim(),
  customSponsorLink: (env.VITE_CUSTOM_AD_LINK || '').trim(),
  customSponsorTitle: (env.VITE_CUSTOM_AD_TITLE || '').trim() || 'Featured Gaming Sponsor',
  customSponsorCta: (env.VITE_CUSTOM_AD_CTA || '').trim() || 'Visit Sponsor',
};

let adsenseScriptInjected = false;

export function ensureAdSenseScriptLoaded(): void {
  if (adsenseScriptInjected || !adsConfig.adsenseClientId || typeof document === 'undefined') {
    return;
  }
  const existing = document.querySelector(
    `script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]`
  );
  if (existing) {
    adsenseScriptInjected = true;
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
    adsConfig.adsenseClientId
  )}`;
  document.head.appendChild(script);
  adsenseScriptInjected = true;
}

const MATCHES_COMPLETED_STORAGE_KEY = 'ff2d_matches_completed';
let memoryCompletedMatches = 0;

export function getCompletedMatchCount(): number {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(MATCHES_COMPLETED_STORAGE_KEY);
      const parsed = raw ? parseInt(raw, 10) : 0;
      if (!Number.isNaN(parsed) && parsed >= 0) {
        memoryCompletedMatches = parsed;
        return parsed;
      }
    }
  } catch {
    // Fallback to memory counter if storage is unavailable
  }
  return memoryCompletedMatches;
}

export function recordCompletedMatch(): {
  totalCompleted: number;
  shouldShowInterstitial: boolean;
} {
  const nextCount = getCompletedMatchCount() + 1;
  memoryCompletedMatches = nextCount;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(MATCHES_COMPLETED_STORAGE_KEY, String(nextCount));
    }
  } catch {
    // Ignore storage quota / privacy mode errors
  }

  return {
    totalCompleted: nextCount,
    shouldShowInterstitial: nextCount > 0 && nextCount % 2 === 0,
  };
}
