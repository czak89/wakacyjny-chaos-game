import React, { useCallback, useEffect, useRef, useState } from 'react';
import { audio } from './game/audio';
import { RusalkaGameEngine } from './game/engine';
import {
  MAX_HP,
  createDefaultProgress,
  parseSkinParam,
  parseWeatherEventParam,
  parseWeatherParam,
} from './game/rules';
import { loadProgress } from './game/storage';
import type {
  AchievementToast,
  AnimatorSkinId,
  HighScoreEntry,
  HudSnapshot,
  PlayerProgress,
} from './game/types';
import { AchievementToastBanner } from './components/AchievementToastBanner';
import { GameHud } from './components/GameHud';
import { MobileControls } from './components/MobileControls';
import { StatusModal } from './components/StatusModal';
import { TitleOverlay } from './components/TitleOverlay';

const INITIAL_HUD: HudSnapshot = {
  phase: 'title',
  score: 0,
  bestScore: 0,
  hp: MAX_HP,
  maxHp: MAX_HP,
  combo: 1,
  comboTimerRatio: 0,
  day: 1,
  dashReadyRatio: 1,
  sugarRushRemaining: 0,
  inflatablesCaught: 0,
  wafflesCollected: 0,
  kidsFound: 0,
  seagullsDodged: 0,
  selectedSkin: 'boy',
  weather: 'sunny',
  weatherLabel: 'Słoneczna Plaża',
  weatherEffectHint: 'Tempo +18%',
  activeEvent: null,
  activeWeatherEvent: null,
  lastStats: null,
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<RusalkaGameEngine | null>(null);

  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [leaderboard, setLeaderboard] = useState<HighScoreEntry[]>([]);
  const [progress, setProgress] = useState<PlayerProgress>(() =>
    typeof window !== 'undefined' ? loadProgress() : createDefaultProgress(),
  );
  const [toastQueue, setToastQueue] = useState<AchievementToast[]>([]);
  const [muted, setMuted] = useState<boolean>(() => audio.isMuted());

  const activeToast = toastQueue.length > 0 ? toastQueue[0] : null;

  useEffect(() => {
    if (!activeToast) return;
    const timer = window.setTimeout(() => {
      setToastQueue((prev) => prev.slice(1));
    }, 4200);
    return () => window.clearTimeout(timer);
  }, [activeToast]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new RusalkaGameEngine(
      canvas,
      (snapshot) => setHud(snapshot),
      (entries) => setLeaderboard(entries),
      (nextProgress) => setProgress(nextProgress),
      (toast) => setToastQueue((prev) => [...prev, toast]),
    );
    engineRef.current = engine;
    engine.startLoop();

    // Support ?autostart=1, optional ?weather=sunny|fog|rain|sunset, and ?skin=boy|girl
    const params = new URLSearchParams(window.location.search);
    const forcedSkin = parseSkinParam(params.get('skin'));
    if (forcedSkin) {
      engine.setSelectedSkin(forcedSkin);
    }
    const forcedWeather = parseWeatherParam(params.get('weather'));
    if (forcedWeather) {
      engine.setWeatherImmediate(forcedWeather);
    }
    const forcedWeatherEvent = parseWeatherEventParam(params.get('weatherEvent'));
    const demoParticlesParam = params.get('demoParticles');
    const demoParticles =
      demoParticlesParam === 'waffle' || demoParticlesParam === 'seagull'
        ? demoParticlesParam
        : null;
    if (params.get('autostart') === '1') {
      engine.startGame();
      if (forcedWeather) {
        engine.setWeatherImmediate(forcedWeather);
      }
      if (forcedWeatherEvent) {
        engine.triggerWeatherEventImmediate(forcedWeatherEvent);
      }
      if (demoParticles) {
        engine.enableDemoParticles(demoParticles);
      }
    }

    const onKeyMute = (e: KeyboardEvent) => {
      if (e.code === 'KeyM' && !e.repeat) {
        const nextMuted = audio.toggleMute();
        setMuted(nextMuted);
        if (!nextMuted && engine.getPhase() === 'playing') {
          audio.startMusic();
        }
      }
    };
    window.addEventListener('keydown', onKeyMute);

    return () => {
      window.removeEventListener('keydown', onKeyMute);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const handleStart = useCallback(() => {
    audio.unlock();
    engineRef.current?.startGame();
  }, []);

  const handleSelectSkin = useCallback((skin: AnimatorSkinId) => {
    audio.unlock();
    const ok = engineRef.current?.setSelectedSkin(skin);
    if (ok) {
      audio.playWaffle(false);
    }
  }, []);

  const handleTogglePause = useCallback(() => {
    engineRef.current?.togglePause();
  }, []);

  const handleResume = useCallback(() => {
    audio.unlock();
    engineRef.current?.resumeGame();
  }, []);

  const handleReturnTitle = useCallback(() => {
    engineRef.current?.returnToTitle();
  }, []);

  const handleToggleMute = useCallback(() => {
    const nextMuted = audio.toggleMute();
    setMuted(nextMuted);
    if (!nextMuted && engineRef.current?.getPhase() === 'playing') {
      audio.startMusic();
    }
  }, []);

  const handleTouchMove = useCallback((dx: number, dy: number, active: boolean) => {
    engineRef.current?.setTouchMove(dx, dy, active);
  }, []);

  const handleDash = useCallback(() => {
    audio.unlock();
    engineRef.current?.triggerDash();
  }, []);

  return (
    <main className="relative w-full h-full overflow-hidden bg-[#0b3c5d]">
      {/* Isolated Canvas Mount — never unmounted or recreated on HUD state changes */}
      <div className="fixed inset-0 w-full h-full">
        <canvas
          ref={canvasRef}
          data-testid="game-canvas"
          className="block w-full h-full pixel-canvas"
          aria-label="Plansza gry Rusałka: Wakacyjny Chaos"
        />
      </div>

      {hud.phase === 'title' && (
        <TitleOverlay
          bestScore={hud.bestScore}
          leaderboard={leaderboard}
          progress={progress}
          muted={muted}
          onStart={handleStart}
          onSelectSkin={handleSelectSkin}
          onToggleMute={handleToggleMute}
        />
      )}

      {hud.phase === 'playing' && (
        <>
          <GameHud
            hud={hud}
            muted={muted}
            onTogglePause={handleTogglePause}
            onToggleMute={handleToggleMute}
          />
          <MobileControls
            dashReadyRatio={hud.dashReadyRatio}
            onMove={handleTouchMove}
            onDash={handleDash}
          />
        </>
      )}

      <AchievementToastBanner toast={activeToast} />

      <StatusModal
        phase={hud.phase}
        stats={hud.lastStats}
        leaderboard={leaderboard}
        onResume={handleResume}
        onRestart={handleStart}
        onReturnTitle={handleReturnTitle}
      />
    </main>
  );
}
