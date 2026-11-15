import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, Clock, Sparkles, X } from 'lucide-react';
import { AdBanner } from './AdBanner';

interface RewardedAdModalProps {
  bonusRP: number;
  onClaimReward: () => void;
  onClose: () => void;
}

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({
  bonusRP,
  onClaimReward,
  onClose,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const canClaim = secondsLeft <= 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-amber-400/50 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-display text-xl font-bold text-white uppercase tracking-wide">
              Sponsored Reward (+{bonusRP} Bonus RP)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <AdBanner placement="reward" />

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            {canClaim ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 font-semibold">
                  Reward unlocked! Claim your +{bonusRP} RP now.
                </span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>
                  Reward unlocks in <strong className="text-white">{secondsLeft}s</strong>...
                </span>
              </>
            )}
          </div>

          <button
            onClick={onClaimReward}
            disabled={!canClaim}
            className={`px-5 py-2.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              canClaim
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-400/20 active:scale-95 cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>{canClaim ? `Claim +${bonusRP} RP` : `Wait ${secondsLeft}s`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
