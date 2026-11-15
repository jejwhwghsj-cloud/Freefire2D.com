import React, { useRef, useEffect, useState } from 'react';
import { GameEngine } from '../game/gameEngine';
import { Maximize2, X } from 'lucide-react';

interface MinimapProps {
  engine: GameEngine;
}

export const Minimap: React.FC<MinimapProps> = ({ engine }) => {
  const miniCanvasRef = useRef<HTMLCanvasElement>(null);
  const fullCanvasRef = useRef<HTMLCanvasElement>(null);
  const [showFullMap, setShowFullMap] = useState(false);

  // Render Minimap Radar
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = miniCanvasRef.current;
      if (canvas && engine.player) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          // Radar circle clip
          ctx.save();
          ctx.beginPath();
          ctx.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2);
          ctx.clip();

          // Radar background
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, w, h);

          // Minimap zoom: centered on player
          const scale = 0.16; // 1 pixel on minimap = ~6 world pixels
          const px = engine.player.x;
          const py = engine.player.y;

          ctx.translate(w / 2, h / 2);

          // Draw Safe Zone
          const z = engine.zone;
          const zx = (z.currentCenter.x - px) * scale;
          const zy = (z.currentCenter.y - py) * scale;
          const zr = z.currentRadius * scale;

          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(zx, zy, Math.max(1, zr), 0, Math.PI * 2);
          ctx.stroke();

          // Next zone (white dotted)
          const nzx = (z.targetCenter.x - px) * scale;
          const nzy = (z.targetCenter.y - py) * scale;
          const nzr = z.targetRadius * scale;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(nzx, nzy, Math.max(1, nzr), 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw Airdrops on radar
          engine.airdrops.forEach((drop) => {
            const dx = (drop.x - px) * scale;
            const dy = (drop.y - py) * scale;
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(dx, dy, 4, 0, Math.PI * 2);
            ctx.fill();
          });

          // Draw Player Icon (Center)
          ctx.save();
          ctx.rotate(engine.player.angle);
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.moveTo(8, 0);
          ctx.lineTo(-6, -5);
          ctx.lineTo(-3, 0);
          ctx.lineTo(-6, 5);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          // Subtle concentric radar rings
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(0, 0, w * 0.25, 0, Math.PI * 2);
          ctx.arc(0, 0, w * 0.45, 0, Math.PI * 2);
          ctx.stroke();

          ctx.restore();

          // Radar outer bezel border
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [engine]);

  // Render Full Tactical Map when opened
  useEffect(() => {
    if (!showFullMap) return;
    const canvas = fullCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const worldSize = engine.mapData.worldSize;
    const scale = w / worldSize;

    ctx.clearRect(0, 0, w, h);

    // Map background
    ctx.fillStyle = '#1e3a5f';
    ctx.fillRect(0, 0, w, h);

    // Island landmass representation
    ctx.fillStyle = '#2d5a27';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, (worldSize * 0.44) * scale, 0, Math.PI * 2);
    ctx.fill();

    // Safe Zone
    const z = engine.zone;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(z.currentCenter.x * scale, z.currentCenter.y * scale, z.currentRadius * scale, 0, Math.PI * 2);
    ctx.stroke();

    // Next safe circle
    ctx.strokeStyle = '#ffffff';
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(z.targetCenter.x * scale, z.targetCenter.y * scale, z.targetRadius * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Named Locations
    engine.mapData.namedLocations.forEach((loc) => {
      const lx = loc.x * scale;
      const ly = loc.y * scale;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Barlow Condensed, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(loc.name, lx, ly);

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(lx, ly - 12, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Player marker
    if (engine.player) {
      const px = engine.player.x * scale;
      const py = engine.player.y * scale;

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.fillText('YOU', px, py + 16);
    }
  }, [showFullMap, engine]);

  return (
    <>
      {/* Top-Right Circular Radar Minimap (Compact for Mobile) */}
      <div className="relative group">
        <canvas
          ref={miniCanvasRef}
          width={96}
          height={96}
          onClick={() => setShowFullMap(true)}
          className="rounded-full shadow-lg border border-slate-700/80 cursor-pointer active:scale-95 transition-transform"
        />
        <button
          onClick={() => setShowFullMap(true)}
          className="absolute bottom-0 right-0 p-1 bg-slate-900/90 text-slate-300 hover:text-white rounded-full border border-slate-700 shadow"
          title="Open Map"
        >
          <Maximize2 className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* Fullscreen Tactical Island Map Modal */}
      {showFullMap && (
        <div className="absolute inset-0 z-50 pointer-events-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-xl w-full flex flex-col items-center shadow-2xl">
            <div className="w-full flex items-center justify-between mb-4">
              <h3 className="font-display text-2xl font-bold tracking-wide text-white uppercase">
                Bermuda Island Tactical Map
              </h3>
              <button
                onClick={() => setShowFullMap(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <canvas
              ref={fullCanvasRef}
              width={460}
              height={460}
              className="rounded-xl border border-slate-700/90 shadow-inner max-w-full"
            />

            <div className="w-full flex items-center justify-between text-xs text-slate-400 mt-4 px-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Player Location
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border border-sky-400 bg-sky-400/20" />
                Active Blue Safe Zone
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border border-dashed border-white" />
                Next Zone Target
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
