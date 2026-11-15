import React from 'react';
import { RANK_TIERS, getRankByRP, getPlayerRP, getSeasonStats } from '../game/rankSystem';
import { X, Trophy, Award, Shield, CheckCircle2, ChevronRight, Zap, Target } from 'lucide-react';

interface RankModalProps {
  onClose: () => void;
}

export const RankModal: React.FC<RankModalProps> = ({ onClose }) => {
  const currentRP = getPlayerRP();
  const rankData = getRankByRP(currentRP);
  const seasonStats = getSeasonStats();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/90 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header Banner */}
        <div className="relative px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400 flex items-center justify-center text-xl shadow-lg shadow-amber-400/10">
              {rankData.currentRank.icon}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-amber-400 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                <Trophy className="w-3 h-3" /> FREE FIRE RANKED SEASON
              </span>
              <h2 className="font-display text-xl font-bold text-white tracking-wide flex items-center gap-2">
                <span>{rankData.currentRank.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono-numbers border border-slate-700">
                  {currentRP} RP
                </span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Tier Progress Bar & Season Stats */}
        <div className="px-6 py-4 bg-slate-950/50 border-b border-slate-800 flex flex-col gap-3">
          {/* Progress bar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <span>Next Tier:</span>
                <span className="text-amber-400 font-bold">
                  {rankData.nextRank ? rankData.nextRank.name : 'MAX RANK (MASTER)'}
                </span>
              </span>
              <span className="text-slate-400 font-mono-numbers text-[11px]">
                {rankData.nextRank
                  ? `${rankData.rpInCurrentTier} / ${rankData.tierRange} RP (${rankData.progressPercent}%)`
                  : 'Apex Champion'}
              </span>
            </div>

            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/80">
              <div
                style={{ width: `${rankData.progressPercent}%` }}
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 shadow-md transition-all duration-500"
              />
            </div>
          </div>

          {/* Quick Season Stats Bar */}
          <div className="grid grid-cols-4 gap-2 pt-1 text-center">
            <div className="bg-slate-900/90 rounded-xl p-2 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-semibold">MATCHES</span>
              <span className="font-mono-numbers font-bold text-white text-sm">
                {seasonStats.matchesPlayed}
              </span>
            </div>
            <div className="bg-slate-900/90 rounded-xl p-2 border border-slate-800">
              <span className="text-[10px] text-amber-400 block font-semibold">BOOYAH!</span>
              <span className="font-mono-numbers font-bold text-amber-400 text-sm">
                {seasonStats.victories}
              </span>
            </div>
            <div className="bg-slate-900/90 rounded-xl p-2 border border-slate-800">
              <span className="text-[10px] text-sky-400 block font-semibold">TOTAL KILLS</span>
              <span className="font-mono-numbers font-bold text-sky-300 text-sm">
                {seasonStats.totalKills}
              </span>
            </div>
            <div className="bg-slate-900/90 rounded-xl p-2 border border-slate-800">
              <span className="text-[10px] text-purple-400 block font-semibold">BEST RANK</span>
              <span className="font-display font-bold text-purple-300 text-xs truncate block">
                {seasonStats.highestRank}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Rank Tier Ladder */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2.5 custom-scrollbar">
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">
            <span>Rank Tiers (Bronze I → Master)</span>
            <span>Required RP & Season Rewards</span>
          </div>

          {RANK_TIERS.map((tier, idx) => {
            const isCurrent = tier.name === rankData.currentRank.name;
            const isUnlocked = currentRP >= tier.minRP;

            return (
              <div
                key={tier.name}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  isCurrent
                    ? 'bg-amber-500/10 border-amber-400 shadow-md shadow-amber-400/5'
                    : isUnlocked
                    ? 'bg-slate-800/40 border-slate-700/60 opacity-90'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-50'
                }`}
              >
                {/* Left badge & name */}
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      backgroundColor: tier.badgeBg,
                      borderColor: tier.badgeBorder,
                    }}
                    className="w-10 h-10 rounded-xl border flex items-center justify-center text-lg shrink-0 shadow-sm"
                  >
                    {tier.icon}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span
                        style={{ color: tier.textColor }}
                        className="font-display font-bold text-sm tracking-wide"
                      >
                        {tier.name}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold uppercase">
                          Current
                        </span>
                      )}
                      {isUnlocked && !isCurrent && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono-numbers">
                      {tier.minRP} {tier.maxRP === 99999 ? 'RP+' : `- ${tier.maxRP} RP`}
                    </span>
                  </div>
                </div>

                {/* Right Rewards */}
                <div className="flex flex-col items-end text-right max-w-[210px]">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                    <Award className="w-3 h-3 text-amber-400" /> Tier Reward
                  </span>
                  <span className="text-[11px] text-slate-200 truncate leading-tight font-medium">
                    {tier.rewards}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Earn RP by winning matches, getting kills, and placing high!</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-xs uppercase"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
