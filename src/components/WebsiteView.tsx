import React, { useState } from 'react';
import {
  Play,
  Trophy,
  Zap,
  Share2,
  Copy,
  Check,
  Users,
  Eye,
  Maximize2,
  Minimize2,
  Film,
  Target,
  Compass,
} from 'lucide-react';
import { GameState } from '../types/game';
import { getPlayerRP, getRankByRP } from '../game/rankSystem';
import { WEAPON_DEFS } from '../game/weapons';
import { AdBanner } from './AdBanner';
import { TrailerPlayer } from './TrailerPlayer';
import gameLogoImg from '../assets/images/free_fire_game_logo_1794720369654.jpg';

interface WebsiteViewProps {
  gameState: GameState;
  onQuickStartMatch: () => void;
  onOpenRankModal: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  children: React.ReactNode;
}

export const WebsiteView: React.FC<WebsiteViewProps> = ({
  gameState,
  onQuickStartMatch,
  onOpenRankModal,
  isFullscreen,
  onToggleFullscreen,
  children,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showOwnerTrailer, setShowOwnerTrailer] = useState(false);

  // Only show the private Promo Trailer Studio to the owner on the Developer link (hidden from public players)
  const isOwnerWorkspace =
    typeof window !== 'undefined' &&
    (!window.location.hostname.startsWith('ais-pre-') ||
      window.location.search.includes('trailer=1'));

  const currentRP = getPlayerRP();
  const rankData = getRankByRP(currentRP);

  const websiteUrl =
    typeof window !== 'undefined' && window.location.href
      ? window.location.href.split('?')[0].split('#')[0]
      : '';

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleStartFromWebpage = () => {
    const arenaEl = document.getElementById('game-arena');
    if (arenaEl && !isFullscreen) {
      arenaEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    onQuickStartMatch();
  };

  const featuredWeapons = [
    WEAPON_DEFS['groza'],
    WEAPON_DEFS['vector'],
    WEAPON_DEFS['m1887'],
    WEAPON_DEFS['m82b'],
    WEAPON_DEFS['scar'],
    WEAPON_DEFS['minigun'],
  ];

  return (
    <div className="relative w-full min-h-screen bg-[#070a12] text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* ── TOP WEBSITE NAVIGATION ── */}
      <nav className="sticky top-0 z-40 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
        {/* Custom Game Logo & Brand */}
        <a href="#game-arena" className="flex items-center gap-3 min-w-0 shrink-0">
          <img
            src={gameLogoImg}
            alt="Free Fire 2D Official Logo"
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-xl object-cover border border-amber-400/70 shadow-md shadow-amber-400/15 shrink-0 bg-slate-900"
          />
          <span className="font-display text-xl font-extrabold tracking-wider text-white uppercase leading-none whitespace-nowrap">
            Free Fire 2D
          </span>
        </a>

        {/* Quick Nav Links */}
        <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <a href="#game-arena" className="hover:text-amber-400 transition-colors flex items-center gap-1 text-amber-400 font-bold whitespace-nowrap shrink-0">
            <Play className="w-3.5 h-3.5 fill-current" />
            Play Game
          </a>
          <a href="#features" className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0">
            Features
          </a>
          <a href="#rank-system" className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0">
            Rank System
          </a>
          <a href="#armory" className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0">
            Arsenal
          </a>
          <a href="#controls" className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0">
            Controls
          </a>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Current Rank */}
          <button
            onClick={onOpenRankModal}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-amber-400/50 text-xs transition-colors whitespace-nowrap cursor-pointer"
            title="View Ranked Ladder"
          >
            <span className="text-sm">{rankData.currentRank.icon}</span>
            <span style={{ color: rankData.currentRank.textColor }} className="font-display font-bold uppercase">
              {rankData.currentRank.name}
            </span>
            <span className="text-amber-400 font-mono text-[11px] font-bold">
              {currentRP} RP
            </span>
          </button>

          {/* Share Game Link Button */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-all active:scale-95 shadow-sm whitespace-nowrap cursor-pointer"
            title="Copy Game Link"
          >
            {copiedLink ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="hidden sm:inline">
              {copiedLink ? 'Link Copied!' : 'Share Game'}
            </span>
            <span className="sm:hidden">{copiedLink ? 'Copied' : 'Share'}</span>
          </button>

          {/* Start Match Button in Top Nav (when in Lobby) */}
          {gameState === 'LOBBY' && (
            <button
              onClick={handleStartFromWebpage}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display text-xs font-bold uppercase tracking-wider shadow-md transition-all active:scale-95 whitespace-nowrap cursor-pointer"
              title="Start 51-Player Match Immediately"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Match</span>
            </button>
          )}

          {/* Fullscreen Game Button */}
          <button
            onClick={onToggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display text-xs font-bold uppercase tracking-wider shadow-md transition-all active:scale-95 whitespace-nowrap cursor-pointer"
            title="Play Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fullscreen</span>
          </button>
        </div>
      </nav>

      {/* ── EMBEDDED GAME ARENA HERO SECTION ── */}
      <section
        id="game-arena"
        className="relative px-3 sm:px-6 md:px-8 pt-6 pb-12 max-w-7xl w-full mx-auto flex flex-col items-center gap-5"
      >
        {/* Glow backdrop */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Section Header with Attached Custom Game Logo */}
        <div className="flex flex-col items-center text-center gap-3 z-10">
          <div className="relative">
            <img
              src={gameLogoImg}
              alt="Free Fire 2D Emblem"
              referrerPolicy="no-referrer"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-2 border-amber-400/80 shadow-2xl shadow-amber-500/20 bg-slate-900"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-amber-400 text-xs font-semibold">
            <span>51-Player Ranked</span>
            <span aria-hidden="true">·</span>
            <span>Continuous Auto-Fire</span>
            <span aria-hidden="true">·</span>
            <span>Unlimited Ammo</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-wider uppercase text-white leading-tight">
            Play <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">Free Fire 2D</span> Online
          </h1>

          <p className="max-w-xl text-slate-300 text-xs sm:text-sm">
            Play directly inside this webpage or expand to Fullscreen. Climb from <strong>Bronze I to Master</strong> against 50 tactical bots.
          </p>

          {/* Public Start Match & Trailer CTA Row */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
            {gameState === 'LOBBY' && (
              <button
                onClick={handleStartFromWebpage}
                className="px-7 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-display text-base font-extrabold uppercase tracking-wider shadow-xl shadow-amber-400/25 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Start Match Now (50 Bots)</span>
              </button>
            )}
            {isOwnerWorkspace && (
              <button
                onClick={() => setShowOwnerTrailer(true)}
                className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-400/50 font-display text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
                title="Open Owner-Only 15s HD Trailer Studio"
              >
                <Film className="w-4 h-4 text-amber-400" />
                <span>My 15s HD Trailer</span>
              </button>
            )}
            <button
              onClick={onOpenRankModal}
              className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 font-display text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>{rankData.currentRank.name} · {currentRP} RP</span>
            </button>
          </div>
        </div>

        {/* ── THE EMBEDDED GAME CANVAS CONTAINER (Canvas NEVER unmounts on Fullscreen toggle) ── */}
        <div
          className={
            isFullscreen
              ? 'w-full max-w-5xl'
              : 'relative w-full max-w-5xl rounded-3xl overflow-hidden border-2 border-amber-400/40 shadow-2xl shadow-amber-500/10 bg-slate-950 z-20 flex flex-col'
          }
        >
          {/* Game Top Frame Bar */}
          {!isFullscreen && (
            <div className="bg-[#0b101c] border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs text-slate-300 select-none">
              <div className="flex items-center gap-2.5">
                <img
                  src={gameLogoImg}
                  alt="Free Fire 2D"
                  referrerPolicy="no-referrer"
                  className="w-5 h-5 rounded-md object-cover border border-amber-400/50 bg-slate-900"
                />
                <span className="font-display font-bold uppercase tracking-wider text-white text-[13px]">
                  Bermuda Island Arena
                </span>
                <span className="hidden sm:inline text-slate-500">|</span>
                <span className="hidden sm:inline text-slate-400 text-[11px]">
                  51 Combatants · Unlimited Ammo
                </span>
              </div>

              <div className="flex items-center gap-2">
                {gameState === 'LOBBY' && (
                  <button
                    onClick={handleStartFromWebpage}
                    className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-bold uppercase flex items-center gap-1.5 transition-all active:scale-95 shadow-sm whitespace-nowrap cursor-pointer"
                    title="Start Match Now"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Start Match</span>
                  </button>
                )}

                <button
                  onClick={onOpenRankModal}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 text-[11px] font-bold uppercase border border-slate-700/80 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                  title="View Rank Ladder"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Rank Ladder</span>
                </button>

                <button
                  onClick={onToggleFullscreen}
                  className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-bold uppercase flex items-center gap-1.5 transition-all active:scale-95 shadow-sm whitespace-nowrap cursor-pointer"
                  title="Expand to Fullscreen"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Fullscreen</span>
                </button>
              </div>
            </div>
          )}

          {/* Persistent Game Screen Viewport — stays mounted across Fullscreen & Webpage modes */}
          <div
            className={
              isFullscreen
                ? 'fixed inset-0 z-50 w-screen h-screen bg-black overflow-hidden'
                : 'relative w-full h-[560px] sm:h-[620px] md:h-[660px] bg-[#090d16] overflow-hidden'
            }
          >
            {children}

            {isFullscreen && (
              <div className="absolute top-28 right-3 z-40 flex items-center gap-2">
                <button
                  onClick={onToggleFullscreen}
                  className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-display text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg backdrop-blur-md cursor-pointer"
                  title="Return to Webpage"
                >
                  <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Webpage View</span>
                </button>
              </div>
            )}
          </div>

          {/* Game Bottom Frame Bar */}
          {!isFullscreen && (
            <div className="bg-[#0b101c] border-t border-slate-800 px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 select-none">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <span><strong>Move:</strong> WASD / Touch Joystick</span>
                <span>·</span>
                <span><strong>Shoot:</strong> Mouse Left / Fire Knob (Hold for Auto-Fire)</span>
              </div>
              <div className="flex items-center gap-2 text-amber-400 font-semibold">
                <Eye className="w-3.5 h-3.5" />
                <span>High Button Visibility Enabled (90%)</span>
              </div>
            </div>
          )}
        </div>
      </section>

      <AdBanner placement="top" className="px-4 sm:px-8 pt-2 pb-4" />

      {/* ── HIGHLIGHT FEATURE GRID ── */}
      <section id="features" className="px-4 sm:px-8 py-10 max-w-6xl w-full mx-auto">
        <div className="text-center mb-8">
          <span className="text-xs text-amber-400 font-bold uppercase tracking-widest block mb-1">
            Game Engine Features
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white uppercase">
            Built for Fast-Paced Battle Royale
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-white uppercase">
              Continuous Auto-Fire
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hold the Fire knob to spray non-stop at max fire rate. Zero pauses, zero trigger fatigue.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-white uppercase">
              50 Bot Opponents
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              51-player battle royale with 60 tactical bot personalities (Rushers, Snipers, Campers, Looters).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col gap-2">
            <div className="w-10 h-10 rounded-xl bg-purple-400/10 border border-purple-400/30 flex items-center justify-center text-purple-400">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-white uppercase">
              Bronze to Master Rank
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Earn RP from Booyah placement, kills, and survival to climb up through 7 tiers to Master.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col gap-2">
            <div className="w-10 h-10 rounded-xl bg-sky-400/10 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-white uppercase">
              High Button Visibility
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bright, easy-to-tap touch controls (High 90%, Bright 75%, Medium 55%) built for instant reaction.
            </p>
          </div>
        </div>
      </section>

      {/* ── FREE FIRE RANK LADDER SHOWCASE ── */}
      <section
        id="rank-system"
        className="px-4 sm:px-8 py-12 bg-slate-950/60 border-y border-slate-800/80"
      >
        <div className="max-w-6xl w-full mx-auto flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs text-amber-400 font-bold uppercase tracking-widest block mb-1">
                Competitive Ranked Season
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white uppercase">
                Rank Progression: Bronze 1 to Master
              </h2>
            </div>
            <button
              onClick={onOpenRankModal}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-xs uppercase cursor-pointer"
            >
              Open Full Rank Ladder
            </button>
          </div>

          {/* Rank Tier Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { name: 'Bronze', rp: '1000 - 1299', icon: '🛡️', color: '#cd7f32' },
              { name: 'Silver', rp: '1300 - 1599', icon: '⚔️', color: '#cbd5e1' },
              { name: 'Gold', rp: '1600 - 2099', icon: '🦅', color: '#fbbf24' },
              { name: 'Platinum', rp: '2100 - 2599', icon: '💠', color: '#2dd4bf' },
              { name: 'Diamond', rp: '2600 - 3199', icon: '💎', color: '#818cf8' },
              { name: 'Heroic', rp: '3200 - 5999', icon: '🔥', color: '#ef4444' },
              { name: 'Master', rp: '6000+ RP', icon: '👑', color: '#f59e0b' },
            ].map((tier) => (
              <div
                key={tier.name}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center text-center gap-2 shadow-sm"
              >
                <div className="text-3xl mb-1">{tier.icon}</div>
                <span
                  style={{ color: tier.color }}
                  className="font-display font-bold text-sm uppercase"
                >
                  {tier.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono-numbers">
                  {tier.rp}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ARSENAL & WEAPONS SHOWCASE ── */}
      <section id="armory" className="px-4 sm:px-8 py-12 max-w-6xl w-full mx-auto">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-amber-400 font-bold uppercase tracking-widest">
              Tactical Firepower
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white uppercase">
              Featured Guns & Airdrop Weapons
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredWeapons.map((wep) => (
              <div
                key={wep.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between gap-3 shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span
                      style={{ color: wep.color }}
                      className="font-display font-bold text-base"
                    >
                      {wep.name}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      {wep.category} · {wep.auto ? 'Full Auto' : 'Semi Auto'}
                    </span>
                  </div>
                  <span className="text-xs text-amber-300 font-mono font-bold">
                    {Math.round(1 / wep.fireRate)} rps
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {wep.description}
                </p>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center font-mono-numbers text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 block">DAMAGE</span>
                    <span className="font-bold text-white">{wep.damage}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">SPEED</span>
                    <span className="font-bold text-sky-400">{wep.bulletSpeed}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">MAG</span>
                    <span className="font-bold text-amber-400">{wep.magSize}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AdBanner placement="mid" className="px-4 sm:px-8 pb-8" />

      {/* ── CONTROLS & HOW TO PLAY SECTION ── */}
      <section
        id="controls"
        className="px-4 sm:px-8 py-12 bg-slate-950/60 border-t border-slate-800/80"
      >
        <div className="max-w-4xl w-full mx-auto flex flex-col gap-6">
          <div className="text-center">
            <span className="text-xs text-amber-400 font-bold uppercase tracking-widest block mb-1">
              Field Tactics
            </span>
            <h2 className="font-display text-3xl font-extrabold text-white uppercase">
              Touchscreen & Keyboard Controls
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
              <h3 className="font-display font-bold text-base text-amber-400 uppercase flex items-center gap-2">
                <Target className="w-4 h-4" /> Touchscreen Controls (Mobile / Tablet)
              </h3>
              <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <li>• <strong>Left Virtual Joystick:</strong> Drag anywhere on the left half to sprint & maneuver.</li>
                <li>• <strong>Right Aim & Fire Knob:</strong> Drag to aim. Hold down for continuous auto-firing!</li>
                <li>• <strong>Weapon Slots:</strong> Tap Slot 1 / Slot 2 to swap guns in an instant.</li>
                <li>• <strong>Medkit & Repair:</strong> Tap the green medkit to heal 50 HP or repair vest.</li>
                <li>• <strong>Button Visibility:</strong> Tap the bottom toggle to switch between High (90%), Bright (75%), and Medium (55%) opacity.</li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
              <h3 className="font-display font-bold text-base text-amber-400 uppercase flex items-center gap-2">
                <Compass className="w-4 h-4" /> Keyboard & Mouse Controls (PC)
              </h3>
              <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <li>• <strong>WASD / Arrow Keys:</strong> Move character in 8 directions.</li>
                <li>• <strong>Mouse Cursor:</strong> Aim crosshair in 360 degrees.</li>
                <li>• <strong>Left Mouse Button:</strong> Hold to fire continuously at max rate.</li>
                <li>• <strong>1, 2, 3 Keys:</strong> Swap between primary, secondary, and airdrop weapons.</li>
                <li>• <strong>E Key / Spacebar:</strong> Pick up loot crates and airdrops.</li>
                <li>• <strong>F Key:</strong> Use medkit to restore health.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <AdBanner placement="bottom" className="px-4 sm:px-8 py-6 bg-[#070a12]" />

      {/* ── WEBSITE FOOTER ── */}
      <footer className="border-t border-slate-800/80 px-4 sm:px-8 py-6 bg-[#06080e] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2.5">
          <img
            src={gameLogoImg}
            alt="Free Fire 2D"
            referrerPolicy="no-referrer"
            className="w-6 h-6 rounded-md object-cover border border-amber-400/60 bg-slate-900"
          />
          <span className="font-bold text-white">Free Fire 2D Battle Royale</span>
          <span>·</span>
          <span>Bermuda Island Ranked</span>
        </div>

        <div className="flex items-center gap-4">
          {websiteUrl && (
            <button
              onClick={handleCopyLink}
              className="hover:text-amber-400 transition-colors flex items-center gap-1 font-mono cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedLink ? 'Link Copied!' : 'Share Game'}</span>
            </button>
          )}
          <a href="#game-arena" className="text-amber-400 font-bold hover:underline">
            Back to Game Arena ↑
          </a>
        </div>
      </footer>

      {/* Owner-Only Private 15s HD Promo Trailer Modal */}
      {isOwnerWorkspace && showOwnerTrailer && (
        <div className="fixed inset-0 z-[70] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <TrailerPlayer onClose={() => setShowOwnerTrailer(false)} />
        </div>
      )}
    </div>
  );
};
