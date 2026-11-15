import React, { useState, useRef, useEffect } from 'react';
import { CharacterSkin, WeaponType } from '../types/game';
import { CHARACTER_SKINS, WEAPON_DEFS } from '../game/weapons';
import { sounds } from '../audio/soundEngine';
import { getPlayerRP, getRankByRP } from '../game/rankSystem';
import { RankModal } from './RankModal';
import {
  Volume2,
  VolumeX,
  Music,
  Play,
  HelpCircle,
  X,
  Check,
  Eye,
  ChevronRight,
  Globe,
} from 'lucide-react';
import gameLogoImg from '../assets/images/free_fire_game_logo_1794720369654.jpg';

interface LobbyProps {
  onStartMatch: (config: {
    botCount: number;
    playerSkin: CharacterSkin;
    difficulty: 'recruit' | 'veteran' | 'apex';
    starterWeapon?: WeaponType | 'random';
  }) => void;
  onOpenWebsite?: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onStartMatch, onOpenWebsite }) => {
  const [selectedSkin, setSelectedSkin] = useState<CharacterSkin>(CHARACTER_SKINS[0]);
  const [botCount, setBotCount] = useState<number>(50);
  const [difficulty, setDifficulty] = useState<'recruit' | 'veteran' | 'apex'>('veteran');
  const [starterWeapon, setStarterWeapon] = useState<WeaponType | 'random'>('random');
  const [soundEnabled, setSoundEnabled] = useState(sounds.enabled);
  const [musicEnabled, setMusicEnabled] = useState(sounds.musicEnabled);
  const [volume, setVolume] = useState(sounds.volume);
  const [showHelp, setShowHelp] = useState(false);
  const [showRankModal, setShowRankModal] = useState(false);

  // Start tactical lobby music (automatically resumes after first tap if browser suspended audio)
  useEffect(() => {
    sounds.startMusic('lobby');
  }, []);

  // Button Visibility Preset (low 55% / medium 75% / high 90%)
  const [hudVisibility, setHudVisibility] = useState<'low' | 'medium' | 'high'>(() => {
    try {
      const saved = localStorage.getItem('freefire_hud_visibility_v2');
      if (saved === 'low' || saved === 'medium' || saved === 'high') return saved;
    } catch {
      // Ignore
    }
    return 'high';
  });

  const handleVisibilityChange = (preset: 'low' | 'medium' | 'high') => {
    setHudVisibility(preset);
    try {
      localStorage.setItem('freefire_hud_visibility_v2', preset);
    } catch {
      // Ignore
    }
    sounds.playPickup();
  };

  const currentRP = getPlayerRP();
  const rankData = getRankByRP(currentRP);

  const stagingCanvasRef = useRef<HTMLCanvasElement>(null);
  const mousePosRef = useRef({ x: 200, y: 150 });

  const toggleSound = () => {
    const next = !soundEnabled;
    sounds.setEnabled(next);
    setSoundEnabled(next);
    if (next) {
      sounds.playClick();
      sounds.startMusic('lobby');
    }
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

  // 2D Interactive Staging Ground Canvas
  useEffect(() => {
    const canvas = stagingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const render = () => {
      time += 0.03;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2 + 10;

      ctx.clearRect(0, 0, w, h);

      // 1. Ambient Hologram Pedestal
      const pedestalRadius = 65;
      const pulse = 1 + Math.sin(time * 2) * 0.05;

      // Outer glow
      const grad = ctx.createRadialGradient(cx, cy + 25, 10, cx, cy + 25, pedestalRadius * 1.4);
      grad.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
      grad.addColorStop(0.7, 'rgba(56, 189, 248, 0.1)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 25, pedestalRadius * 1.3, pedestalRadius * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pedestal Ring
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 25, pedestalRadius * pulse, (pedestalRadius * 0.35) * pulse, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Cyber lines on floor
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 25, pedestalRadius * 0.65, pedestalRadius * 0.22, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Rising spark particles
      for (let i = 0; i < 4; i++) {
        const sparkY = ((cy + 25) - ((time * 40 + i * 25) % 65));
        const sparkX = cx + Math.sin(time + i * 2) * 35;
        ctx.fillStyle = 'rgba(251, 191, 36, 0.7)';
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Character Aim Angle (tracks mouse cursor smoothly)
      const targetAngle = Math.atan2(
        mousePosRef.current.y - cy,
        mousePosRef.current.x - cx
      );

      // Character Breathing & idle float
      const breathY = Math.sin(time * 3) * 2;

      ctx.save();
      ctx.translate(cx, cy + breathY);

      // Character Direction
      ctx.rotate(targetAngle);

      // Weapon
      const previewWeapon: WeaponType = starterWeapon === 'random' ? 'rifle' : starterWeapon;
      const wepDef = WEAPON_DEFS[previewWeapon] || WEAPON_DEFS['pistol'];
      ctx.fillStyle = wepDef.color;

      if (starterWeapon === 'katana') {
        ctx.fillStyle = '#e11d48';
        ctx.fillRect(10, -2.5, 26, 4);
      } else if (starterWeapon === 'fists') {
        ctx.fillStyle = selectedSkin.bodyColor;
        ctx.beginPath();
        ctx.arc(16, -8, 5, 0, Math.PI * 2);
        ctx.arc(16, 8, 5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Gun barrel
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(10, -3, 20, 6);
        // Hands
        ctx.fillStyle = selectedSkin.bodyColor;
        ctx.beginPath();
        ctx.arc(12, -7, 4, 0, Math.PI * 2);
        ctx.arc(14, 6, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Shoulders / Arms
      ctx.fillStyle = selectedSkin.bodyColor;
      ctx.beginPath();
      ctx.arc(0, -12, 6, 0, Math.PI * 2);
      ctx.arc(0, 12, 6, 0, Math.PI * 2);
      ctx.fill();

      // Main Torso / Vest
      ctx.fillStyle = selectedSkin.vestColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, 13, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      // Armor Accent
      ctx.strokeStyle = selectedSkin.accentColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Head
      ctx.fillStyle = selectedSkin.hairColor;
      ctx.beginPath();
      ctx.arc(-2, 0, 8, 0, Math.PI * 2);
      ctx.fill();

      // Helmet / Face Visor
      ctx.fillStyle = selectedSkin.accentColor;
      ctx.fillRect(3, -4, 4, 8);

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [selectedSkin, starterWeapon]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = stagingCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mousePosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleStartMatchClick = () => {
    sounds.playPickup();
    onStartMatch({
      botCount,
      playerSkin: selectedSkin,
      difficulty,
      starterWeapon,
    });
  };

  return (
    <div className="relative w-full h-full bg-[#090d16] text-slate-100 flex flex-col selection:bg-amber-400 selection:text-slate-950 overflow-hidden">
      {/* ── TOP BAR (Medium Sized) ── */}
      <header className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-2.5 whitespace-nowrap">
          <img
            src={gameLogoImg}
            alt="Free Fire 2D Logo"
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-lg object-cover border border-amber-400/70 shadow-sm shrink-0 bg-slate-900"
          />
          <span className="font-display text-xl font-bold tracking-wider text-white uppercase">
            Free Fire 2D
          </span>
          <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider hidden sm:inline">
            · Bermuda Ranked
          </span>
        </div>

        {/* Free Fire Rank & Profile Button */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          {/* Interactive Rank Tier Card */}
          <button
            onClick={() => {
              sounds.playPickup();
              setShowRankModal(true);
            }}
            style={{
              backgroundColor: rankData.currentRank.badgeBg,
              borderColor: rankData.currentRank.badgeBorder,
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all hover:scale-105 active:scale-95 shadow-md shadow-amber-400/5 group"
            title="Inspect Free Fire Rank Ladder (Bronze I to Master)"
          >
            <span className="text-base group-hover:scale-110 transition-transform">
              {rankData.currentRank.icon}
            </span>
            <div className="flex flex-col text-left">
              <span className="text-[9px] text-slate-400 uppercase font-bold leading-none">
                Ranked Tier
              </span>
              <span
                style={{ color: rankData.currentRank.textColor }}
                className="font-display font-bold text-xs uppercase leading-tight"
              >
                {rankData.currentRank.name}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1 pl-1 border-l border-white/10 text-amber-300 font-mono-numbers font-bold text-[11px]">
              <span>{currentRP}</span>
              <span className="text-[9px] text-slate-400 font-sans">RP</span>
              <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* Official Website Portal Button */}
          {onOpenWebsite && (
            <button
              onClick={() => {
                sounds.playPickup();
                onOpenWebsite();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl border border-amber-400/40 text-xs font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95"
              title="Open Official Website Portal"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Website</span>
            </button>
          )}

          {/* Audio & Help Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleSound}
              className="w-8 h-8 flex items-center justify-center bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={soundEnabled ? 'Mute Game Audio' : 'Unmute Game Audio'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-rose-400" />
              )}
            </button>

            <button
              onClick={toggleMusic}
              className={`w-8 h-8 flex items-center justify-center bg-slate-900 hover:bg-slate-800 border rounded-lg transition-colors cursor-pointer ${
                musicEnabled && soundEnabled
                  ? 'border-amber-400/50 text-amber-400'
                  : 'border-slate-800 text-slate-500'
              }`}
              title={musicEnabled ? 'Mute Background Music' : 'Enable Background Music'}
            >
              <Music className="w-4 h-4" />
            </button>

            <div className="hidden md:flex items-center gap-1.5 px-2 h-8 bg-slate-900 border border-slate-800 rounded-lg">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Vol</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                aria-label="Master Volume"
                className="w-16 accent-amber-400 cursor-pointer h-1.5"
              />
            </div>

            <button
              onClick={() => setShowHelp(true)}
              className="w-8 h-8 flex items-center justify-center bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="How to Play"
            >
              <HelpCircle className="w-4 h-4 text-sky-400" />
            </button>
          </div>
        </div>
      </header>

      {/* ── 2D LOBBY MAIN STAGE ── */}
      <main className="flex-1 min-h-0 overflow-y-auto w-full">
        <div className="max-w-6xl w-full mx-auto p-3 sm:p-4 md:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Panel: Operator Selection (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-amber-400 font-bold">
                Select Operator
              </span>
              <span className="text-[11px] text-slate-400">
                {CHARACTER_SKINS.length} Available
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {CHARACTER_SKINS.map((skin) => {
                const isSelected = selectedSkin.id === skin.id;
                return (
                  <button
                    key={skin.id}
                    onClick={() => {
                      setSelectedSkin(skin);
                      sounds.playPickup();
                    }}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 border-amber-400 shadow-md shadow-amber-400/10'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="relative">
                      <div
                        style={{ backgroundColor: skin.bodyColor }}
                        className="w-9 h-9 rounded-full border border-slate-700 flex items-center justify-center shrink-0 shadow-sm"
                      >
                        <div
                          style={{ backgroundColor: skin.accentColor }}
                          className="w-4 h-4 rounded-full"
                        />
                      </div>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="font-display font-bold text-sm text-white truncate leading-tight">
                        {skin.name}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate">
                        {skin.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center Stage: Interactive 2D Canvas (6 cols) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center py-2">
            <div className="relative flex flex-col items-center">
              {/* Interactive Canvas */}
              <canvas
                ref={stagingCanvasRef}
                width={380}
                height={250}
                onMouseMove={handleMouseMove}
                onTouchMove={(e) => {
                  const canvas = stagingCanvasRef.current;
                  if (!canvas || !e.touches[0]) return;
                  const rect = canvas.getBoundingClientRect();
                  mousePosRef.current = {
                    x: e.touches[0].clientX - rect.left,
                    y: e.touches[0].clientY - rect.top,
                  };
                }}
                className="rounded-2xl cursor-crosshair border border-slate-800/80 bg-slate-950/40 shadow-inner max-w-full touch-none"
              />

              {/* Mode Card under staging */}
              <div
                onClick={() => setShowRankModal(true)}
                className="mt-3 flex items-center gap-3 px-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg cursor-pointer hover:border-amber-400/60 transition-colors"
              >
                <div className="text-xl">{rankData.currentRank.icon}</div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-sm text-white leading-tight flex items-center gap-2">
                    <span>BERMUDA RANKED · 51 PLAYERS</span>
                    <span
                      style={{ color: rankData.currentRank.textColor }}
                      className="text-xs uppercase font-extrabold"
                    >
                      [{rankData.currentRank.name}]
                    </span>
                  </span>
                  <span className="text-[11px] text-amber-400 font-semibold">
                    ⚡ Auto-Fire · ♾️ Infinite Ammo · 50 Bots · Tap to View Ladder
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Match Configuration (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between">
              <span>Match Rules & Drop</span>
              <span className="text-[10px] text-emerald-400 font-bold">50 BOTS READY</span>
            </span>

            {/* In-Game Button Visibility Setting */}
            <div>
              <label className="text-xs text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-amber-400" /> Buttons Visibility
                </span>
                <span className="text-[10px] text-amber-400 font-bold uppercase">
                  {hudVisibility === 'low' ? 'Medium 55%' : hudVisibility === 'medium' ? 'Bright 75%' : 'High 90%'}
                </span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'low', label: 'Medium' },
                  { id: 'medium', label: 'Bright' },
                  { id: 'high', label: 'High (90%)' },
                ].map((vis) => (
                  <button
                    key={vis.id}
                    onClick={() => handleVisibilityChange(vis.id as typeof hudVisibility)}
                    className={`h-8 px-1.5 text-[11px] font-semibold rounded-lg border transition-colors ${
                      hudVisibility === vis.id
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {vis.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bot Count */}
            <div>
              <label className="text-xs text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
                <span>Opponents</span>
                <span className="text-[10px] text-amber-400 font-bold">{botCount} Bots</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: '25 Bots', val: 25 },
                  { label: '35 Bots', val: 35 },
                  { label: '50 Bots (Max)', val: 50 },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => setBotCount(opt.val)}
                    className={`h-9 px-2 text-xs font-semibold rounded-lg border transition-colors ${
                      botCount === opt.val
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="text-xs text-slate-300 font-semibold mb-1.5 block">
                Bot Difficulty
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'recruit', label: 'Recruit' },
                  { id: 'veteran', label: 'Veteran' },
                  { id: 'apex', label: 'Apex' },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDifficulty(d.id as typeof difficulty)}
                    className={`h-9 px-2 text-xs font-semibold rounded-lg border transition-colors ${
                      difficulty === d.id
                        ? 'bg-slate-700 text-white border-sky-400 shadow-sm font-bold'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Starter Weapon */}
            <div>
              <label className="text-xs text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
                <span>Drop Weapon</span>
                <span className="text-[10px] text-emerald-400 font-bold">UNLIMITED</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'random', label: '🎲 Random' },
                  { id: 'groza', label: 'Groza AR' },
                  { id: 'vector', label: 'Dual Vector' },
                  { id: 'scar', label: 'SCAR-L' },
                  { id: 'm1887', label: 'M1887 SG' },
                  { id: 'm82b', label: 'M82B Sniper' },
                  { id: 'rifle', label: 'AK-47' },
                  { id: 'smg', label: 'MP40' },
                  { id: 'katana', label: 'Katana' },
                ].map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setStarterWeapon(w.id as WeaponType | 'random')}
                    className={`h-8 px-1.5 text-[11px] font-semibold rounded-lg border transition-colors ${
                      starterWeapon === w.id
                        ? 'bg-slate-700 text-white border-amber-400 shadow-sm font-bold'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        </div>
      </main>

      {/* ── PINNED BOTTOM MATCH START BAR (ALWAYS VISIBLE) ── */}
      <div className="shrink-0 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="text-[11px] text-slate-400 flex flex-wrap items-center justify-center gap-2">
          <span>Rank: <strong style={{ color: rankData.currentRank.textColor }}>{rankData.currentRank.name}</strong></span>
          <span>·</span>
          <span>Hold <strong className="text-white">Fire</strong> for Constant Fire</span>
          <span>·</span>
          <span><strong className="text-emerald-400">Unlimited Ammo</strong></span>
          <span>·</span>
          <span><strong className="text-amber-400">{botCount} Bots</strong></span>
        </div>

        {/* Sleek Match Start Button */}
        <button
          onClick={handleStartMatchClick}
          className="w-full sm:w-auto h-10 px-7 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-display text-sm font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-amber-400/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>START MATCH</span>
        </button>
      </div>

      {/* ── HOW TO PLAY MODAL ── */}
      {showHelp && (
        <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-2xl font-bold tracking-wide text-white uppercase">
                Survival Guide
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                <strong className="text-amber-400 block mb-1">1. Rank Progression (Bronze 1 to Master)</strong>
                Every match earns RP. Climb from Bronze I, Silver, Gold, Platinum, Diamond, Heroic up to Master rank!
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                <strong className="text-emerald-400 block mb-1">2. Constant Auto-Fire & Unlimited Ammo</strong>
                Hold down the right Fire knob or touch screen to stream continuous fire with zero reload delays.
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                <strong className="text-sky-400 block mb-1">3. High In-Game Button Visibility</strong>
                Touch buttons default to High Visibility (90%) with clear borders so every control is effortless to spot and tap.
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="w-full mt-5 h-10 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* ── FREE FIRE RANK LADDER MODAL ── */}
      {showRankModal && (
        <RankModal onClose={() => setShowRankModal(false)} />
      )}
    </div>
  );
};
