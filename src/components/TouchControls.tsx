import React, { useRef, useState, useEffect } from 'react';
import { GameEngine } from '../game/gameEngine';
import { RotateCcw, Hand, Heart, Bomb, Eye, EyeOff } from 'lucide-react';
import { WEAPON_DEFS } from '../game/weapons';

interface TouchControlsProps {
  engine: GameEngine;
}

export type VisibilityPreset = 'low' | 'medium' | 'high';

export const TouchControls: React.FC<TouchControlsProps> = ({ engine }) => {
  // Left Stick (Movement)
  const leftStickRef = useRef<HTMLDivElement>(null);
  const [leftKnob, setLeftKnob] = useState({ x: 0, y: 0, active: false });

  // Right Stick / Fire Area (Aim & Fire)
  const rightStickRef = useRef<HTMLDivElement>(null);
  const [rightKnob, setRightKnob] = useState({ x: 0, y: 0, active: false });

  // Sync weapon ammo, medkit counts, reload state & loot prompt live
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => (t + 1) % 1000);
    }, 80);
    return () => clearInterval(id);
  }, []);

  // High button visibility (+20% brighter & larger touch controls by default)
  const [visibility, setVisibility] = useState<VisibilityPreset>(() => {
    try {
      const saved = localStorage.getItem('freefire_hud_visibility_v2');
      if (saved === 'low' || saved === 'medium' || saved === 'high') return saved;
    } catch {
      // Fallback
    }
    return 'high';
  });

  const cycleVisibility = () => {
    const next: VisibilityPreset =
      visibility === 'high' ? 'medium' : visibility === 'medium' ? 'low' : 'high';
    setVisibility(next);
    try {
      localStorage.setItem('freefire_hud_visibility_v2', next);
    } catch {
      // Ignore
    }
  };

  // Boosted +20% opacity presets across every tier
  const baseOpacityClass =
    visibility === 'low'
      ? 'opacity-55 hover:opacity-95 focus-within:opacity-100'
      : visibility === 'medium'
      ? 'opacity-75 hover:opacity-100 focus-within:opacity-100'
      : 'opacity-90 hover:opacity-100 focus-within:opacity-100';

  // Handle Left Stick (Movement)
  const handleLeftTouchMove = (e: React.TouchEvent) => {
    if (!leftStickRef.current) return;
    const touch = e.targetTouches[0];
    if (!touch) return;
    const rect = leftStickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const maxRadius = rect.width / 2;

    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    setLeftKnob({ x: knobX, y: knobY, active: true });
    engine.touchMove.x = knobX / maxRadius;
    engine.touchMove.y = knobY / maxRadius;
    engine.touchMove.active = true;
  };

  const handleLeftTouchEnd = () => {
    setLeftKnob({ x: 0, y: 0, active: false });
    engine.touchMove.x = 0;
    engine.touchMove.y = 0;
    engine.touchMove.active = false;
  };

  // Handle Right Stick (Aim & Fire)
  const handleRightTouchMove = (e: React.TouchEvent) => {
    if (!rightStickRef.current) return;
    const touch = e.targetTouches[0];
    if (!touch) return;
    const rect = rightStickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const maxRadius = rect.width / 2;

    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    setRightKnob({ x: knobX, y: knobY, active: true });
    engine.touchAim.x = knobX;
    engine.touchAim.y = knobY;
    engine.touchAim.active = true;
    engine.touchAim.shooting = true;
  };

  const handleRightTouchEnd = () => {
    setRightKnob({ x: 0, y: 0, active: false });
    engine.touchAim.active = false;
    engine.touchAim.shooting = false;
  };

  const player = engine.player;
  if (!player) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 select-none touch-none">
      {/* ── BUTTON VISIBILITY TOGGLE ── */}
      <div className="pointer-events-auto absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/75 backdrop-blur-sm border border-white/25 text-[10px] text-slate-200 hover:text-white transition-opacity opacity-80 hover:opacity-100 shadow-md">
        <button
          onClick={cycleVisibility}
          className="flex items-center gap-1.5 focus:outline-none cursor-pointer"
          title="Toggle In-Game Button Visibility"
        >
          {visibility === 'low' ? (
            <EyeOff className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Eye className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="font-bold uppercase tracking-wider text-[10px]">
            Buttons: {visibility === 'low' ? 'Medium (55%)' : visibility === 'medium' ? 'Bright (75%)' : 'High (90%)'}
          </span>
        </button>
      </div>

      {/* ── LEFT THUMB: HIGH-VISIBILITY JOYSTICK (+20% size & clarity) ── */}
      <div
        ref={leftStickRef}
        onTouchStart={handleLeftTouchMove}
        onTouchMove={handleLeftTouchMove}
        onTouchEnd={handleLeftTouchEnd}
        onTouchCancel={handleLeftTouchEnd}
        className={`pointer-events-auto absolute bottom-5 left-5 w-28 h-28 rounded-full border-2 border-white/30 bg-slate-950/55 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-200 shadow-lg ${
          leftKnob.active ? 'opacity-100' : baseOpacityClass
        }`}
      >
        <div
          style={{ transform: `translate(${leftKnob.x}px, ${leftKnob.y}px)` }}
          className="w-12 h-12 rounded-full bg-amber-400/75 border-2 border-amber-200 shadow-md transition-transform duration-75 flex items-center justify-center text-[10px] font-extrabold text-slate-950 uppercase tracking-wider"
        >
          MOVE
        </div>
      </div>

      {/* ── RIGHT THUMB: HIGH-VISIBILITY ACTION CLUSTER (+20%) ── */}
      <div
        className={`pointer-events-auto absolute bottom-5 right-5 flex flex-col items-end gap-2 transition-opacity duration-200 ${
          rightKnob.active ? 'opacity-100' : baseOpacityClass
        }`}
      >
        {/* Quick Weapon Switch Row */}
        <div className="flex items-center gap-1.5 bg-slate-950/70 backdrop-blur-sm p-1.5 rounded-xl border border-white/25 shadow-md">
          {/* Primary */}
          <button
            onClick={() => engine.switchSlot('primary')}
            disabled={!player.weapons.primary}
            className={`h-9 px-2.5 rounded-lg border text-left flex flex-col justify-center transition-all ${
              player.activeSlot === 'primary'
                ? 'bg-amber-400/80 text-slate-950 border-amber-200 font-bold shadow'
                : player.weapons.primary
                ? 'bg-slate-900/80 text-white border-white/25'
                : 'bg-transparent text-slate-500 border-transparent cursor-not-allowed'
            }`}
          >
            <span className="text-[10px] truncate max-w-[70px] leading-tight font-bold">
              {player.weapons.primary ? WEAPON_DEFS[player.weapons.primary.type].name : 'Empty'}
            </span>
            {player.weapons.primary && (
              <span
                className={`text-[9px] leading-none font-bold font-mono-numbers ${
                  player.activeSlot === 'primary' ? 'text-slate-900' : 'text-emerald-300'
                }`}
              >
                {player.weapons.primary.ammoInMag}/∞
              </span>
            )}
          </button>

          {/* Secondary */}
          <button
            onClick={() => engine.switchSlot('secondary')}
            disabled={!player.weapons.secondary}
            className={`h-9 px-2.5 rounded-lg border text-left flex flex-col justify-center transition-all ${
              player.activeSlot === 'secondary'
                ? 'bg-amber-400/80 text-slate-950 border-amber-200 font-bold shadow'
                : player.weapons.secondary
                ? 'bg-slate-900/80 text-white border-white/25'
                : 'bg-transparent text-slate-500 border-transparent cursor-not-allowed'
            }`}
          >
            <span className="text-[10px] truncate max-w-[60px] leading-tight font-bold">
              {player.weapons.secondary ? WEAPON_DEFS[player.weapons.secondary.type].name : 'Empty'}
            </span>
            {player.weapons.secondary && (
              <span
                className={`text-[9px] leading-none font-bold font-mono-numbers ${
                  player.activeSlot === 'secondary' ? 'text-slate-900' : 'text-emerald-300'
                }`}
              >
                {player.weapons.secondary.ammoInMag}/∞
              </span>
            )}
          </button>

          {/* Melee */}
          <button
            onClick={() => engine.switchSlot('melee')}
            className={`h-9 px-2 rounded-lg border flex items-center justify-center transition-all ${
              player.activeSlot === 'melee'
                ? 'bg-amber-400/80 text-slate-950 border-amber-200 font-bold shadow'
                : 'bg-slate-900/80 text-white border-white/25'
            }`}
          >
            <span className="text-[10px] font-bold">MELEE</span>
          </button>
        </div>

        {/* Action Buttons Row: MEDKIT, RELOAD, PICKUP, GRENADE */}
        <div className="flex items-center gap-2">
          {/* DEDICATED USE MEDIKIT BUTTON */}
          <button
            onClick={() => engine.startHealing(player, 'medkit')}
            disabled={player.medkits <= 0 || player.hp >= player.maxHp}
            className={`w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center relative shadow-md active:scale-95 transition-all ${
              player.medkits > 0
                ? 'bg-emerald-600/75 border-emerald-300 text-white'
                : 'bg-slate-900/55 border-white/15 text-slate-400 cursor-not-allowed'
            }`}
            title="Use Medkit"
          >
            <Heart className="w-4 h-4 fill-current text-white" />
            <span className="text-[8px] font-extrabold uppercase leading-none mt-0.5">MED</span>
            <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-emerald-400 text-slate-950 text-[9px] font-extrabold rounded-full shadow">
              {player.medkits}
            </span>
          </button>

          {/* DEDICATED RELOAD BUTTON */}
          <button
            onClick={() => engine.startReload(player)}
            disabled={player.isReloading}
            className={`w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center shadow-md active:scale-95 transition-all ${
              player.isReloading
                ? 'bg-amber-500/75 border-amber-300 text-slate-950 animate-pulse'
                : 'bg-slate-900/75 border-white/30 text-amber-400'
            }`}
            title="Reload Gun"
          >
            <RotateCcw className={`w-4 h-4 ${player.isReloading ? 'animate-spin' : ''}`} />
            <span className="text-[8px] font-extrabold uppercase leading-none mt-0.5 text-white">RELOAD</span>
          </button>

          {/* DEDICATED LOOT PICKUP BUTTON */}
          <button
            onClick={() => engine.pickupNearestLoot(player)}
            className={`w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center shadow-md active:scale-95 transition-all ${
              engine.nearbyLoot
                ? 'bg-sky-500/90 border-sky-200 text-white animate-bounce'
                : 'bg-slate-900/75 border-white/30 text-sky-300'
            }`}
            title="Loot / Pick up"
          >
            <Hand className="w-4 h-4" />
            <span className="text-[8px] font-extrabold uppercase leading-none mt-0.5 text-white">LOOT</span>
          </button>

          {/* GRENADE BUTTON */}
          <button
            onClick={() => engine.throwGrenade(player)}
            disabled={player.grenades <= 0}
            className={`w-11 h-11 rounded-xl border-2 flex flex-col items-center justify-center shadow-md active:scale-95 transition-all ${
              player.grenades > 0
                ? 'bg-orange-600/75 border-orange-300 text-white'
                : 'bg-slate-900/55 border-white/15 text-slate-400 cursor-not-allowed'
            }`}
            title="Throw Grenade"
          >
            <Bomb className="w-3.5 h-3.5" />
            <span className="text-[8px] font-extrabold leading-none mt-0.5">BOMB</span>
          </button>
        </div>

        {/* UNLIMITED AMMO COUNTER BADGE */}
        {player.weapons[player.activeSlot] && WEAPON_DEFS[player.weapons[player.activeSlot]!.type].category !== 'melee' && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-950/70 border border-white/25 rounded-lg shadow-sm">
            <span className="text-[10px] text-amber-300 font-bold">UNLIMITED</span>
            <span className="font-mono-numbers text-xs font-bold text-emerald-300">
              {player.weapons[player.activeSlot]?.ammoInMag || 0} / ∞
            </span>
          </div>
        )}

        {/* FIRE BUTTON / AIM STICK (+20% visibility & size) */}
        <div
          ref={rightStickRef}
          onTouchStart={handleRightTouchMove}
          onTouchMove={handleRightTouchMove}
          onTouchEnd={handleRightTouchEnd}
          onTouchCancel={handleRightTouchEnd}
          className="w-26 h-26 rounded-full border-2 border-red-400/70 bg-red-950/45 backdrop-blur-[2px] flex items-center justify-center shadow-xl touch-none"
        >
          <div
            style={{ transform: `translate(${rightKnob.x}px, ${rightKnob.y}px)` }}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 shadow-lg border-2 border-red-200 flex items-center justify-center text-[10px] font-extrabold text-white uppercase tracking-wider"
          >
            FIRE
          </div>
        </div>
      </div>
    </div>
  );
};
