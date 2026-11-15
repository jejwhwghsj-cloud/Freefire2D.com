import React, { useEffect, useRef } from 'react';
import { ExternalLink, Megaphone } from 'lucide-react';
import { adsConfig, ensureAdSenseScriptLoaded } from '../config/ads';

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

interface AdBannerProps {
  slotId?: string;
  placement: 'top' | 'mid' | 'bottom' | 'reward' | 'interstitial';
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  slotId = '',
  placement,
  className = '',
}) => {
  const adRef = useRef<HTMLModElement | null>(null);
  const pushedRef = useRef(false);

  const resolvedSlotId =
    slotId ||
    (placement === 'top'
      ? adsConfig.topSlotId
      : placement === 'mid'
      ? adsConfig.midSlotId
      : placement === 'bottom'
      ? adsConfig.bottomSlotId
      : placement === 'interstitial'
      ? adsConfig.interstitialSlotId || adsConfig.midSlotId || adsConfig.rewardSlotId
      : adsConfig.rewardSlotId);

  const hasAdSense = Boolean(adsConfig.adsenseClientId && resolvedSlotId);
  const hasSponsorLink = Boolean(adsConfig.customSponsorLink);

  useEffect(() => {
    if (!hasAdSense || pushedRef.current) return;
    ensureAdSenseScriptLoaded();
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushedRef.current = true;
    } catch {
      // Ignore AdSense push timing errors if blocked by an ad blocker
    }
  }, [hasAdSense]);

  return (
    <div
      className={`w-full flex flex-col items-center justify-center ${className}`}
      aria-label="Advertisement"
    >
      <div className="w-full max-w-4xl rounded-2xl border border-slate-800/90 bg-slate-900/60 px-3 py-2.5 flex flex-col items-center gap-1.5">
        <span className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold self-start">
          Advertisement
        </span>

        {hasAdSense ? (
          <div
            className={`w-full flex items-center justify-center overflow-hidden ${
              placement === 'interstitial' ? 'min-h-[160px]' : 'min-h-[90px]'
            }`}
          >
            <ins
              ref={adRef}
              className="adsbygoogle block w-full"
              style={{
                display: 'block',
                minHeight: placement === 'interstitial' ? '160px' : '90px',
              }}
              data-ad-client={adsConfig.adsenseClientId}
              data-ad-slot={resolvedSlotId}
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          </div>
        ) : hasSponsorLink ? (
          <a
            href={adsConfig.customSponsorLink}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className={`w-full rounded-xl bg-gradient-to-r from-slate-900 via-amber-950/25 to-slate-900 border border-amber-400/30 hover:border-amber-400/70 px-4 py-3 flex items-center justify-between gap-4 transition-colors group ${
              placement === 'interstitial' ? 'min-h-[120px]' : 'min-h-[72px]'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
                <Megaphone className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0 text-left">
                <span className="font-display font-bold text-sm text-white truncate">
                  {adsConfig.customSponsorTitle}
                </span>
                <span className="text-[11px] text-slate-400 truncate">
                  Sponsored Partner · Support Free Fire 2D
                </span>
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-lg bg-amber-400 group-hover:bg-amber-300 text-slate-950 font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1 shrink-0">
              <span>{adsConfig.customSponsorCta}</span>
              <ExternalLink className="w-3 h-3" />
            </span>
          </a>
        ) : (
          <div
            className={`w-full rounded-xl border border-dashed border-slate-700/80 bg-slate-950/60 flex items-center justify-center px-4 py-3 text-center ${
              placement === 'interstitial' ? 'min-h-[140px]' : 'min-h-[76px]'
            }`}
          >
            <div className="flex items-center gap-2.5 text-slate-400 text-xs">
              <Megaphone className="w-4 h-4 text-amber-400/80 shrink-0" />
              <span>
                Sponsored Ad Slot ({placement.toUpperCase()}{' '}
                {placement === 'interstitial' ? 'Ad' : 'Banner'})
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
