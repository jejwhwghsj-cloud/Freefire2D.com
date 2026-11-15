import React, { useEffect, useState, useRef } from 'react';
import { MatchStats } from '../types/game';
import {
  Trophy,
  Skull,
  Crosshair,
  Clock,
  Award,
  Eye,
  RotateCcw,
  Home,
  TrendingUp,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  calculateMatchRP,
  getPlayerRP,
  savePlayerRP,
  updateSeasonStats,
  getRankByRP,
  MatchRPBreakdown,
} from '../game/rankSystem';
import { RewardedAdModal } from './RewardedAdModal';

interface GameOverModalProps {
  stats: MatchStats | null;
  onPlayAgain: () => void;
  onSpectate: () => void;
  onReturnToLobby: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  onPlayAgain,
  onSpectate,
  onReturnToLobby,
}) => {
  const [rpBreakdown, setRpBreakdown] = useState<MatchRPBreakdown | null>(null);
  const [showRewardAd, setShowRewardAd] = useState(false);
  const [bonusClaimed, setBonusClaimed] = useState(false);
  const processedStatsRef = useRef<MatchStats | null>(null);

  useEffect(() => {
    if (!stats) return;

    const currentRP = getPlayerRP();
    const isAlreadyCommitted = processedStatsRef.current === stats;

    if (!isAlreadyCommitted) {
      setBonusClaimed(false);
      setShowRewardAd(false);
    }

    const breakdown = calculateMatchRP({
      rank: stats.rank,
      totalPlayers: stats.totalPlayers,
      kills: stats.kills,
      damageDealt: stats.damageDealt,
      timeSurvivedSeconds: stats.timeSurvivedSeconds,
      currentRP: isAlreadyCommitted && rpBreakdown ? rpBreakdown.oldRP : currentRP,
    });

    setRpBreakdown(breakdown);

    if (!isAlreadyCommitted) {
      processedStatsRef.current = stats;
      savePlayerRP(breakdown.newRP);
      updateSeasonStats({
        isWinner: stats.isWinner,
        kills: stats.kills,
        rankName: breakdown.newRank.name,
      });
    }
  }, [stats]);

  if (!stats || !rpBreakdown) return null;

  const handleClaimBonusRP = () => {
    if (bonusClaimed) return;
    const bonus = 15;
    const updatedNewRP = rpBreakdown.newRP + bonus;
    const updatedRankData = getRankByRP(updatedNewRP);
    const oldRankData = getRankByRP(rpBreakdown.oldRP);
    savePlayerRP(updatedNewRP);
    setRpBreakdown({
      ...rpBreakdown,
      newRP: updatedNewRP,
      totalRPGain: rpBreakdown.totalRPGain + bonus,
      newRank: updatedRankData.currentRank,
      isRankUp: updatedRankData.currentRank.minRP > oldRankData.currentRank.minRP,
    });
    setBonusClaimed(true);
    setShowRewardAd(false);
  };

  const isWinner = stats.isWinner;
  const minutes = Math.floor(stats.timeSurvivedSeconds / 60);
  const seconds = stats.timeSurvivedSeconds % 60;
  const newRankData = getRankByRP(rpBreakdown.newRP);

  return (
    <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl flex flex-col items-center text-center animate-scale-up my-auto">
        {/* Banner Title */}
        {isWinner ? (
          <div className="flex flex-col items-center mb-3">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center mb-2 shadow-lg shadow-amber-500/10">
              <Trophy className="w-9 h-9 text-amber-400" />
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 uppercase">
              BOOYAH!
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Champion of Bermuda Island · Rank #1 of {stats.totalPlayers}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-400 flex items-center justify-center mb-2 shadow-lg shadow-rose-500/10">
              <Skull className="w-8 h-8 text-rose-400" />
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-wider text-rose-500 uppercase">
              ELIMINATED
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Placement #{stats.rank} of {stats.totalPlayers} Players
            </p>
          </div>
        )}

        {/* ── FREE FIRE RANK SCORE & RP REWARD CARD ── */}
        <div className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 sm:p-4 mb-3 flex flex-col gap-2.5">
          {/* Rank Up Announcement Banner */}
          {rpBreakdown.isRankUp && (
            <div className="py-1 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-400/30 to-amber-500/20 border border-amber-400/80 text-amber-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 animate-bounce">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>TIER PROMOTED: {rpBreakdown.newRank.name}!</span>
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            </div>
          )}

          {/* Current Rank & Total RP Delta */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-left">
              <div
                style={{
                  backgroundColor: rpBreakdown.newRank.badgeBg,
                  borderColor: rpBreakdown.newRank.badgeBorder,
                }}
                className="w-11 h-11 rounded-xl border flex items-center justify-center text-xl shadow-sm shrink-0"
              >
                {rpBreakdown.newRank.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Ranked Tier
                </span>
                <span
                  style={{ color: rpBreakdown.newRank.textColor }}
                  className="font-display font-bold text-base leading-tight"
                >
                  {rpBreakdown.newRank.name}
                </span>
                <span className="text-[11px] font-mono-numbers text-slate-300">
                  {rpBreakdown.newRP} RP
                </span>
              </div>
            </div>

            {/* RP Gain Pill */}
            <div className="flex flex-col items-end">
              <div
                className={`flex items-center gap-1 px-3 py-1 rounded-xl font-mono-numbers text-base font-bold ${
                  rpBreakdown.totalRPGain >= 0
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>
                  {rpBreakdown.totalRPGain >= 0 ? `+${rpBreakdown.totalRPGain}` : rpBreakdown.totalRPGain} RP
                </span>
              </div>
              <span className="text-[9px] text-slate-400 uppercase mt-0.5">
                Match Gain
              </span>
            </div>
          </div>

          {/* RP Point Breakdown Badges */}
          <div className="grid grid-cols-4 gap-1.5 pt-1 text-center">
            <div className="bg-slate-900/90 rounded-lg py-1 px-1.5 border border-slate-800">
              <span className="text-[9px] text-slate-400 block font-semibold truncate">RANK</span>
              <span className="font-mono-numbers font-bold text-amber-400 text-xs">
                +{rpBreakdown.placementPoints}
              </span>
            </div>
            <div className="bg-slate-900/90 rounded-lg py-1 px-1.5 border border-slate-800">
              <span className="text-[9px] text-slate-400 block font-semibold truncate">KILLS</span>
              <span className="font-mono-numbers font-bold text-sky-400 text-xs">
                +{rpBreakdown.killPoints}
              </span>
            </div>
            <div className="bg-slate-900/90 rounded-lg py-1 px-1.5 border border-slate-800">
              <span className="text-[9px] text-slate-400 block font-semibold truncate">DAMAGE</span>
              <span className="font-mono-numbers font-bold text-purple-400 text-xs">
                +{rpBreakdown.damageBonus}
              </span>
            </div>
            <div className="bg-slate-900/90 rounded-lg py-1 px-1.5 border border-slate-800">
              <span className="text-[9px] text-slate-400 block font-semibold truncate">SURVIVAL</span>
              <span className="font-mono-numbers font-bold text-emerald-400 text-xs">
                +{rpBreakdown.survivalBonus}
              </span>
            </div>
          </div>

          {/* Tier Progress Bar */}
          <div className="flex flex-col gap-1 mt-1 text-left">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>{rpBreakdown.newRank.name}</span>
              <span className="font-mono-numbers">
                {newRankData.nextRank ? `Next: ${newRankData.nextRank.name}` : 'MAX MASTER RANK'}
              </span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
              <div
                style={{ width: `${newRankData.progressPercent}%` }}
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-500"
              />
            </div>
          </div>
        </div>

        {/* Tactical Performance Cards */}
        <div className="grid grid-cols-4 gap-2 w-full mb-4">
          {/* Kills */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2 flex flex-col items-center">
            <span className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-semibold">
              <Skull className="w-3 h-3 text-amber-400" /> Kills
            </span>
            <span className="font-mono-numbers text-lg font-bold text-white mt-0.5">
              {stats.kills}
            </span>
          </div>

          {/* Damage Dealt */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2 flex flex-col items-center">
            <span className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-semibold">
              <Award className="w-3 h-3 text-sky-400" /> Damage
            </span>
            <span className="font-mono-numbers text-lg font-bold text-white mt-0.5">
              {stats.damageDealt}
            </span>
          </div>

          {/* Time Survived */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2 flex flex-col items-center">
            <span className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-semibold">
              <Clock className="w-3 h-3 text-emerald-400" /> Time
            </span>
            <span className="font-mono-numbers text-lg font-bold text-white mt-0.5">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
          </div>

          {/* Accuracy */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2 flex flex-col items-center">
            <span className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-semibold">
              <Crosshair className="w-3 h-3 text-purple-400" /> Acc
            </span>
            <span className="font-mono-numbers text-lg font-bold text-white mt-0.5">
              {stats.accuracy}%
            </span>
          </div>
        </div>

        {/* Rewarded Ad Bonus RP Button */}
        <div className="w-full mb-3">
          {!bonusClaimed ? (
            <button
              onClick={() => setShowRewardAd(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500/20 via-amber-500/20 to-emerald-500/20 border border-emerald-400/50 hover:border-emerald-400 text-emerald-300 font-display text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-400 fill-current" />
              <span>Watch Ad for +15 Bonus RP</span>
            </button>
          ) : (
            <div className="w-full py-2 px-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>+15 Bonus RP Claimed</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
          {!isWinner && (
            <button
              onClick={onSpectate}
              className="w-full sm:w-1/3 py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700/80 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              Spectate
            </button>
          )}

          <button
            onClick={onPlayAgain}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display text-base font-bold uppercase tracking-wider shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </button>

          <button
            onClick={onReturnToLobby}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold"
            title="Return to Lobby"
          >
            <Home className="w-4 h-4" />
            <span>Lobby</span>
          </button>
        </div>
      </div>

      {showRewardAd && (
        <RewardedAdModal
          bonusRP={15}
          onClaimReward={handleClaimBonusRP}
          onClose={() => setShowRewardAd(false)}
        />
      )}
    </div>
  );
};
