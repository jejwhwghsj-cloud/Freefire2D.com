import React, { useEffect, useState } from 'react';
import { ArrowRight, Clock, Megaphone } from 'lucide-react';
import { AdBanner } from './AdBanner';

interface InterstitialAdModalProps {
  matchNumber: number;
  onContinue: () => void;
}

export const InterstitialAdModal: React.FC<InterstitialAdModalProps> = ({
  matchNumber,
  onContinue,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const canContinue = secondsLeft <= 0;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/92 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-amber-400/50 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Megaphone className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <h3 className="font-display text-lg sm:text-xl font-bold text-white uppercase tracking-wide leading-tight">
                Sponsored Break
              </h3>
              <span className="text-[11px] text-slate-400">
                Match #{matchNumber} Complete
              </span>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-300">
            Ad
          </span>
        </div>

        <AdBanner placement="interstitial" />

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            {canContinue ? (
              <span className="text-emerald-300 font-semibold">
                Ready — view your match results.
              </span>
            ) : (
              <>
                <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>
                  Continue in <strong className="text-white">{secondsLeft}s</strong>...
                </span>
              </>
            )}
          </div>

          <button
            onClick={onContinue}
            disabled={!canContinue}
            className={`px-5 py-2.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              canContinue
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-400/20 active:scale-95 cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <span>{canContinue ? 'Continue' : `Wait ${secondsLeft}s`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
