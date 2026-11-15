import React, { useState, useEffect } from 'react';
import { GameEngine } from '../game/gameEngine';
import { Minimap } from './Minimap';
import { WEAPON_DEFS } from '../game/weapons';
import { sounds } from '../audio/soundEngine';
import { getRankByRP, getPlayerRP } from '../game/rankSystem';
import {
  Shield,
  Heart,
  Volume2,
  VolumeX,
  Music,
  Skull,
  Users,
  AlertTriangle,
  HelpCircle,
  X,
  Trophy,
} from 'lucide-react';

interface HUDProps {
  engine: GameEngine;
  onExitToLobby: () => void;
}

export const HUD: React.FC<HUDProps> = ({ engine, onExitToLobby }) => {
  const [soundEnabled, setSoundEnabled] = useState(sounds.enabled);
  const [musicEnabled, setMusicEnabled] = useState(sounds.musicEnabled);
  const [volume, setVolume] = useState(sounds.volume);
  const [showHelp, setShowHelp] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    let animId: number;
    let lastTime = 0;
    const loop = (time: number) => {
      if (time - lastTime > 60) {
        lastTime = time;
        setTick((t) => (t + 1) % 1000);
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    sounds.setEnabled(next);
    setSoundEnabled(next);
    if (next) sounds.playClick();
  };

  const toggleMusic = () => {
    const next = !musicEnabled;
    sounds.setMusicEnabled(next);
    setMusicEnabled(next);
    if (soundEnabled) sounds.playClick();
  };

  const handleVolumeChange = (nextVol: number) => {
    setVolume(nextVol);
    sounds.setVolume(nextVol);
  };

  const player = engine.player;
  if (!player) return null;

  const playerRP = getPlayerRP();
  const rankData = getRankByRP(playerRP);

  const aliveCount = engine.fighters.filter((f) => f.alive).length;
  const equippedWeapon = engine.getEquippedWeapon(player);

  // Zone status text & color
  const z = engine.zone;
  const zoneSeconds = Math.max(0, Math.ceil(z.timer));
  const isShrinking = z.phaseState === 'SHRINKING';

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30 flex flex-col justify-between p-2.5 sm:p-4 touch-none">
      {/* ── TOP MOBILE/TABLET HEADER BAR (TRANSLUCENT & SLEEK) ── */}
      <header className="flex items-start justify-between gap-2 w-full">
        {/* Left: Compact Health & Armor + Killfeed */}
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          {/* Compact Health & Armor Pill */}
          <div className="bg-slate-950/60 backdrop-blur-md p-2 rounded-xl border border-white/10 shadow-lg flex flex-col gap-1 w-44 sm:w-52">
            {/* Armor Bar */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between text-[10px] leading-tight">
                <span className="flex items-center gap-1 text-sky-300 font-bold">
                  <Shield className="w-2.5 h-2.5" /> ARMOR
                </span>
                <span className="font-mono-numbers text-sky-400 font-bold">
                  {Math.round(player.armor)}/{player.maxArmor}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-900/80 rounded-full overflow-hidden mt-0.5">
                <div
                  style={{ width: `${(player.armor / player.maxArmor) * 100}%` }}
                  className="h-full bg-sky-500 transition-all duration-150"
                />
              </div>
            </div>

            {/* Health Bar */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between text-[10px] leading-tight">
                <span className="flex items-center gap-1 text-emerald-300 font-bold">
                  <Heart className="w-2.5 h-2.5" /> HP
                </span>
                <span className="font-mono-numbers text-emerald-400 font-bold">
                  {Math.round(player.hp)}/{player.maxHp}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-900/80 rounded-full overflow-hidden mt-0.5">
                <div
                  style={{ width: `${(player.hp / player.maxHp) * 100}%` }}
                  className={`h-full transition-all duration-150 ${
                    player.hp > 50
                      ? 'bg-emerald-500'
                      : player.hp > 25
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Killfeed Notifications */}
          <div className="flex flex-col gap-1 w-44 sm:w-56">
            {engine.killfeed.slice(0, 3).map((kill) => (
              <div
                key={kill.id}
                className={`text-[9px] px-2 py-0.5 rounded backdrop-blur-md border ${
                  kill.isKillerPlayer
                    ? 'bg-amber-950/70 border-amber-500/60 text-amber-200'
                    : kill.isVictimPlayer
                    ? 'bg-red-950/70 border-red-500/60 text-red-200'
                    : 'bg-slate-950/50 border-white/10 text-slate-300'
                } flex items-center justify-between shadow-sm animate-fade-in`}
              >
                <span className="font-semibold truncate max-w-[55px]">
                  {kill.killerName}
                </span>
                <span className="text-[8px] text-slate-400 font-mono">
                  [{kill.weapon}]
                </span>
                <span className="truncate max-w-[55px]">{kill.victimName}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Alive, Kills, Rank Badge & Storm Status (Compact Pill) */}
        <div className="flex items-center gap-2 bg-slate-950/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-lg">
          {/* Alive Count */}
          <div className="flex items-center gap-1 pr-2 border-r border-slate-700/60">
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-mono-numbers text-sm font-bold text-white">
              {aliveCount}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-slate-400">
              ALIVE
            </span>
          </div>

          {/* Kills Count */}
          <div className="flex items-center gap-1 pr-2 border-r border-slate-700/60">
            <Skull className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono-numbers text-sm font-bold text-amber-400">
              {player.kills}
            </span>
          </div>

          {/* Player Free Fire Rank Badge */}
          <div className="hidden sm:flex items-center gap-1.5 pr-2 border-r border-slate-700/60">
            <span className="text-xs">{rankData.currentRank.icon}</span>
            <span
              style={{ color: rankData.currentRank.textColor }}
              className="font-display font-bold text-xs uppercase"
            >
              {rankData.currentRank.name}
            </span>
          </div>

          {/* Safe Zone Timer */}
          <div className="flex items-center gap-1.5">
            <AlertTriangle
              className={`w-3.5 h-3.5 ${
                isShrinking ? 'text-red-500 animate-pulse' : 'text-sky-400'
              }`}
            />
            <span
              className={`font-mono-numbers text-xs font-bold ${
                isShrinking ? 'text-red-400' : 'text-sky-300'
              }`}
            >
              {Math.floor(zoneSeconds / 60)}:
              {(zoneSeconds % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Right: Audio, Music, Help & Compact Minimap */}
        <div className="flex items-start gap-1.5 pointer-events-auto">
          <div className="flex flex-col gap-1">
            <button
              onClick={toggleSound}
              className="w-7 h-7 flex items-center justify-center bg-slate-950/60 hover:bg-slate-900 border border-white/10 rounded-lg text-slate-300 cursor-pointer"
              title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              )}
            </button>
            <button
              onClick={toggleMusic}
              className={`w-7 h-7 flex items-center justify-center bg-slate-950/60 hover:bg-slate-900 border rounded-lg cursor-pointer ${
                musicEnabled && soundEnabled
                  ? 'border-amber-400/50 text-amber-400'
                  : 'border-white/10 text-slate-500'
              }`}
              title={musicEnabled ? 'Mute Combat Music' : 'Enable Combat Music'}
            >
              <Music className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowHelp(true)}
              className="w-7 h-7 flex items-center justify-center bg-slate-950/60 hover:bg-slate-900 border border-white/10 rounded-lg text-slate-300 cursor-pointer"
              title="Audio & Controls"
            >
              <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
            </button>
          </div>

          <Minimap engine={engine} />
        </div>
      </header>

      {/* ── CENTER LOOT PROMPT (Small, Compact) ── */}
      {engine.nearbyLoot && (
        <div className="self-center pointer-events-auto flex items-center gap-2 px-3 py-1.5 bg-slate-950/80 backdrop-blur-md rounded-xl border border-amber-400/80 shadow-2xl animate-bounce">
          <span className="text-xs font-semibold text-white">
            {engine.nearbyLoot.name}
          </span>
          <button
            onClick={() => engine.pickupNearestLoot(player)}
            className="px-2.5 py-1 text-[11px] font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded shadow"
          >
            LOOT
          </button>
        </div>
      )}

      {/* ── CONTROLS MODAL ── */}
      {showHelp && (
        <div className="absolute inset-0 z-50 pointer-events-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg font-bold tracking-wide text-white uppercase flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Controls & Ranked System</span>
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Current Rank</span>
                <span
                  style={{ color: rankData.currentRank.textColor }}
                  className="font-bold flex items-center gap-1"
                >
                  {rankData.currentRank.icon} {rankData.currentRank.name} ({playerRP} RP)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Left Thumb</span>
                <span className="font-semibold text-white">Virtual Joystick (Move)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Right Thumb</span>
                <span className="font-semibold text-emerald-400">Hold to Fire Constantly (Auto)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Button Visibility</span>
                <span className="font-semibold text-amber-400">Tap "Buttons" toggle at bottom</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Medkit / Heal</span>
                <span className="font-semibold text-white">Tap MED button on right</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Master Volume ({Math.round(volume * 100)}%)</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  aria-label="Master Volume"
                  className="w-28 accent-amber-400 cursor-pointer"
                />
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">50 Match Bots</span>
                <span className="font-semibold text-sky-400">51 Players Free Fire Battle Royale</span>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={onExitToLobby}
                className="px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 rounded-lg border border-rose-800"
              >
                Quit to Lobby
              </button>
              <button
                onClick={() => setShowHelp(false)}
                className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg"
              >
                Resume Match
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
