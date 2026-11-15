import React, { useRef, useState, useEffect } from 'react';
import { GameEngine } from './game/gameEngine';
import { GameState, MatchStats } from './types/game';
import { Lobby } from './components/Lobby';
import { HUD } from './components/HUD';
import { GameOverModal } from './components/GameOverModal';
import { TouchControls } from './components/TouchControls';
import { WebsiteView } from './components/WebsiteView';
import { RankModal } from './components/RankModal';
import { InterstitialAdModal } from './components/InterstitialAdModal';
import { recordCompletedMatch } from './config/ads';
import { sounds } from './audio/soundEngine';
import { Eye, ArrowRight, ArrowLeft, Home, RotateCcw } from 'lucide-react';

import { CHARACTER_SKINS } from './game/weapons';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('LOBBY');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRankModal, setShowRankModal] = useState(false);
  const [interstitialMatchCount, setInterstitialMatchCount] = useState<number | null>(null);
  const lastProcessedStatsRef = useRef<MatchStats | null>(null);

  // Initialize Game Engine on Canvas Mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current);
    engine.onStateChange = (nextState) => {
      if (nextState === 'GAMEOVER' || nextState === 'VICTORY') {
        const stats = engine.matchStats;
        if (stats && lastProcessedStatsRef.current !== stats) {
          lastProcessedStatsRef.current = stats;
          const { totalCompleted, shouldShowInterstitial } = recordCompletedMatch();
          if (shouldShowInterstitial) {
            setInterstitialMatchCount(totalCompleted);
          }
        }
      }
      setGameState(nextState);
    };

    engineRef.current = engine;
    setGameState('LOBBY');

    return () => {
      engine.destroy();
    };
  }, []);

  // Handle Resize whenever fullscreen state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      engineRef.current?.handleResize();
    }, 60);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  const handleStartMatch = (config: Parameters<GameEngine['startMatch']>[0]) => {
    if (engineRef.current) {
      setShowRankModal(false);
      setInterstitialMatchCount(null);
      engineRef.current.startMatch(config);
      setGameState('PLAYING');
    }
  };

  const handleQuickStartMatch = () => {
    if (engineRef.current) {
      setShowRankModal(false);
      setInterstitialMatchCount(null);
      engineRef.current.startMatch({
        botCount: 50,
        playerSkin: CHARACTER_SKINS[0],
        difficulty: 'veteran',
        starterWeapon: 'random',
      });
      setGameState('PLAYING');
    }
  };

  const handlePlayAgain = () => {
    if (engineRef.current) {
      setShowRankModal(false);
      setInterstitialMatchCount(null);
      engineRef.current.startMatch({
        botCount: engineRef.current.totalMatchPlayers - 1,
        playerSkin: engineRef.current.player?.skin || CHARACTER_SKINS[0],
        difficulty: engineRef.current.matchDifficulty,
        starterWeapon: engineRef.current.lastStarterWeapon,
      });
      setGameState('PLAYING');
    }
  };

  const handleSpectate = () => {
    setInterstitialMatchCount(null);
    setGameState('SPECTATING');
    if (engineRef.current) {
      engineRef.current.state = 'SPECTATING';
    }
  };

  const handleNextSpectate = (dir: number) => {
    if (!engineRef.current) return;
    const aliveBots = engineRef.current.fighters.filter((f) => f.alive);
    if (aliveBots.length === 0) return;
    engineRef.current.spectateIndex =
      (engineRef.current.spectateIndex + dir + aliveBots.length) % aliveBots.length;
  };

  const handleReturnToLobby = () => {
    setInterstitialMatchCount(null);
    if (engineRef.current) {
      engineRef.current.state = 'LOBBY';
      if (engineRef.current.animFrameId) {
        cancelAnimationFrame(engineRef.current.animFrameId);
        engineRef.current.animFrameId = null;
      }
    }
    sounds.startMusic('lobby');
    setGameState('LOBBY');
  };

  const spectatedBot =
    engineRef.current &&
    engineRef.current.fighters.filter((f) => f.alive)[engineRef.current.spectateIndex];

  // The Game Viewport (Canvas + Active Overlays)
  const gameComponent = (
    <div className="relative w-full h-full bg-[#090d16] select-none overflow-hidden">
      {/* 2D Game Canvas */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full block ${
          gameState === 'PLAYING' ? 'game-cursor-crosshair' : 'cursor-default'
        }`}
      />

      {/* Lobby Menu Overlay */}
      {gameState === 'LOBBY' && (
        <div className="absolute inset-0 z-30">
          <Lobby onStartMatch={handleStartMatch} />
        </div>
      )}

      {/* Playing Active HUD & Touch Controls */}
      {gameState === 'PLAYING' && engineRef.current && (
        <>
          <HUD
            engine={engineRef.current}
            onExitToLobby={handleReturnToLobby}
          />
          <TouchControls engine={engineRef.current} />
        </>
      )}

      {/* Spectator Overlay */}
      {gameState === 'SPECTATING' && engineRef.current && (
        <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-4 sm:p-6">
          <div className="self-center pointer-events-auto bg-slate-900/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-sky-400/80 shadow-2xl flex items-center gap-4">
            <Eye className="w-5 h-5 text-sky-400 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">
                Spectating Opponent
              </span>
              <span className="font-display text-lg font-bold text-white">
                {spectatedBot ? spectatedBot.name : 'Unknown Fighter'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 ml-4">
              <button
                onClick={() => handleNextSpectate(-1)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                title="Previous Player"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleNextSpectate(1)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                title="Next Player"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="self-center pointer-events-auto flex items-center gap-3 bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-slate-700">
            <button
              onClick={handlePlayAgain}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-sm uppercase tracking-wider flex items-center gap-2 shadow"
            >
              <RotateCcw className="w-4 h-4" />
              Play Again
            </button>
            <button
              onClick={handleReturnToLobby}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-2 border border-slate-700"
            >
              <Home className="w-4 h-4" />
              Lobby
            </button>
          </div>
        </div>
      )}

      {/* Game Over / Victory Modal (and Every-2-Matches Interstitial Ad) */}
      {(gameState === 'GAMEOVER' || gameState === 'VICTORY') &&
        (interstitialMatchCount !== null ? (
          <InterstitialAdModal
            matchNumber={interstitialMatchCount}
            onContinue={() => setInterstitialMatchCount(null)}
          />
        ) : (
          <GameOverModal
            stats={engineRef.current?.matchStats || null}
            onPlayAgain={handlePlayAgain}
            onSpectate={handleSpectate}
            onReturnToLobby={handleReturnToLobby}
          />
        ))}
    </div>
  );

  return (
    <div className={`w-screen h-screen bg-[#070a12] ${isFullscreen ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden'}`}>
      {/* Always keep WebsiteView + gameComponent mounted so toggling Fullscreen never detaches the canvas */}
      <WebsiteView
        gameState={gameState}
        onQuickStartMatch={handleQuickStartMatch}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen((prev) => !prev)}
        onOpenRankModal={() => setShowRankModal(true)}
      >
        {gameComponent}
      </WebsiteView>

      {/* Global Rank Ladder Modal */}
      {showRankModal && (
        <RankModal onClose={() => setShowRankModal(false)} />
      )}
    </div>
  );
}
