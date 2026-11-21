import { audio } from './audio';
import {
  BASE_POINTS,
  CHAOS_EVENT_META,
  COMBO_DURATION,
  DASH_COOLDOWN,
  DASH_DURATION,
  FOREST_LINE_Y,
  MAX_HP,
  SEA_SHORELINE_Y,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  advanceCombo,
  applyPlayerDamage,
  applyWaffleHeal,
  calculatePickupScore,
  canAcquireAttackToken,
  evaluateNewAchievements,
  getAnimatorRank,
  getDifficultyForTime,
  getInflatableBasePoints,
  getNextWeather,
  getPostcardNote,
  getSkinDef,
  getWeatherConfig,
  getWeatherEventDef,
  getWeatherEventModifiers,
  isSkinUnlocked,
  lerpHexColor,
  pickRandomWeatherEvent,
  resolveCircleRectPush,
  updateLeaderboard,
} from './rules';
import {
  PixelParticlePool,
  drawPixelParticles,
  emitSeagullCollisionParticles,
  emitWaffleCollectParticles,
} from './particles';
import { getSpriteAtlas, type SpriteAtlas } from './sprites';
import { loadLeaderboard, loadProgress, saveLeaderboard, saveProgress } from './storage';
import type {
  AchievementToast,
  ActiveChaosEvent,
  ActiveWeatherEvent,
  AnimatorSkinId,
  BushSpot,
  ChaosEventKind,
  GamePhase,
  HighScoreEntry,
  HudSnapshot,
  InflatableKind,
  PlayerProgress,
  RectObstacle,
  RunStats,
  SeagullKind,
  WeatherEventKind,
  WeatherKind,
} from './types';

interface InflatableEntity {
  id: number;
  kind: InflatableKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  bobPhase: number;
  caught: boolean;
  koTimer: number;
}

interface WaffleEntity {
  id: number;
  x: number;
  y: number;
  isGolden: boolean;
  life: number;
  maxLife: number;
  bobPhase: number;
}

interface SeagullEntity {
  id: number;
  kind: SeagullKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: 'patrol' | 'telegraph' | 'dive' | 'recover' | 'leave';
  stateTimer: number;
  targetX: number;
  targetY: number;
  wingPhase: number;
  orbitAngle: number;
  hasToken: boolean;
  dropCooldown: number;
  hitPlayerThisDive?: boolean;
  dodgeAwarded?: boolean;
}

interface FryBombEntity {
  x: number;
  y: number;
  startY: number;
  timer: number;
  duration: number;
  radius: number;
}

interface RescuedKidEntity {
  x: number;
  y: number;
  vy: number;
  timer: number;
}

interface FloatingText {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
}

const GIGGLE_LINES = [
  'Hihi! Tu mnie nie ma!',
  'A kuku!',
  'Znalazłem szyszkę!',
  'Nie wracam na obiad!',
  'Szukaj dalej!',
];

const KID_RESCUE_LINES = [
  'Będą gofry?!',
  'Znalazł mnie!',
  'Na dyskotekę!',
  'Mamo, wygraliśmy!',
  'Ale super zabawa!',
];

const CATCH_LINES = [
  'MAM CIĘ!',
  'WRACAJ NA PLAŻĘ!',
  'DO SZWECJI NIE PŁYNIESZ!',
  'ZŁAPANY!',
  'HOP DO SIATKI!',
];

const HIT_LINES = [
  'MOJE FRYTKI!!',
  'KRA-KRA! ODDAJ!',
  'AUĆ, DZIÓB!',
  'ZŁODZIEJKA!',
  'NIE W CZAPKĘ!',
];

const CHAOS_ORDER: ChaosEventKind[] = [
  'waffle_rain',
  'hide_and_seek',
  'parawan_invasion',
  'seagull_raid',
];

const BASE_PARAWANY: RectObstacle[] = [
  { id: 'p1', x: 185, y: 228, w: 94, h: 18, stripeColorA: '#f25f5c', stripeColorB: '#fffdf7' },
  { id: 'p2', x: 676, y: 242, w: 98, h: 18, stripeColorA: '#16a3b8', stripeColorB: '#f4d35e' },
  { id: 'p3', x: 256, y: 368, w: 92, h: 18, stripeColorA: '#2d6a4f', stripeColorB: '#fffdf7' },
];

const EXTRA_PARAWANY: RectObstacle[] = [
  { id: 'ep1', x: 102, y: 324, w: 84, h: 18, stripeColorA: '#f97316', stripeColorB: '#fffdf7', temporary: true },
  { id: 'ep2', x: 744, y: 368, w: 86, h: 18, stripeColorA: '#a855f7', stripeColorB: '#f4d35e', temporary: true },
  { id: 'ep3', x: 545, y: 188, w: 90, h: 18, stripeColorA: '#0ea5e9', stripeColorB: '#fffdf7', temporary: true },
];

const TREE_POSITIONS: Array<{ x: number; y: number }> = [
  { x: 48, y: 492 },
  { x: 158, y: 525 },
  { x: 288, y: 500 },
  { x: 416, y: 530 },
  { x: 544, y: 502 },
  { x: 676, y: 528 },
  { x: 806, y: 496 },
  { x: 912, y: 522 },
  { x: 34, y: 562 },
  { x: 224, y: 572 },
  { x: 484, y: 572 },
  { x: 742, y: 570 },
  { x: 928, y: 568 },
];

const BUSH_COORDS: Array<{ x: number; y: number }> = [
  { x: 112, y: 504 },
  { x: 242, y: 526 },
  { x: 368, y: 496 },
  { x: 598, y: 500 },
  { x: 726, y: 524 },
  { x: 856, y: 506 },
];

const TOWEL_PROPS = [
  { x: 215, y: 258, w: 34, h: 20, a: '#ff7a59', b: '#fffdf7' },
  { x: 708, y: 272, w: 34, h: 20, a: '#38bdf8', b: '#fef08a' },
  { x: 284, y: 396, w: 34, h: 20, a: '#f472b6', b: '#fffdf7' },
];

const UMBRELLA_PROPS = [
  { x: 145, y: 182, c1: '#f25757', c2: '#fffef9', shade: '#b82d38' },
  { x: 820, y: 188, c1: '#18a8bd', c2: '#f7d459', shade: '#0d728a' },
];

const BEACH_DECOR = [
  { x: 96, y: 274, kind: 'starfish' as const },
  { x: 356, y: 174, kind: 'shell' as const },
  { x: 584, y: 344, kind: 'starfish' as const },
  { x: 866, y: 312, kind: 'shell' as const },
  { x: 172, y: 422, kind: 'shell' as const },
  { x: 642, y: 162, kind: 'shell' as const },
  { x: 758, y: 426, kind: 'starfish' as const },
];

export class RusalkaGameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private atlas: SpriteAtlas;
  private onHudChange: (snapshot: HudSnapshot) => void;
  private onLeaderboardChange: (entries: HighScoreEntry[]) => void;
  private onProgressChange: (progress: PlayerProgress) => void;
  private onAchievementUnlocked: (toast: AchievementToast) => void;

  private rafId: number | null = null;
  private lastTimestamp = 0;
  private resizeObserver: ResizeObserver | null = null;
  private viewW = 1280;
  private viewH = 720;
  private dpr = 1;

  // Camera state
  private camX = WORLD_WIDTH / 2;
  private camY = WORLD_HEIGHT / 2;
  private camScale = 1;
  private trauma = 0;
  private worldTime = 0;

  // Game state
  private phase: GamePhase = 'title';
  private elapsedRun = 0;
  private score = 0;
  private bestScore = 0;
  private leaderboard: HighScoreEntry[] = [];
  private progress: PlayerProgress;
  private selectedSkin: AnimatorSkinId = 'boy';
  private hp = MAX_HP;
  private combo = 1;
  private maxCombo = 1;
  private comboTimer = 0;
  private day = 1;
  private inflatablesCaught = 0;
  private wafflesCollected = 0;
  private kidsFound = 0;
  private seagullsDodged = 0;
  private hitstopTimer = 0;
  private deathDelayTimer = 0;
  private pendingGameOver = false;
  private lastStats: RunStats | null = null;

  // Player state
  private player = {
    x: WORLD_WIDTH / 2,
    y: 312,
    vx: 0,
    vy: 0,
    facingX: 1,
    facingY: 0,
    radius: 17,
    walkDist: 0,
    dashTimer: 0,
    dashCooldown: 0,
    dashBuffer: 0,
    dashDirX: 1,
    dashDirY: 0,
    invulnTimer: 0,
    hitFlashTimer: 0,
    sugarRushTimer: 0,
    scaleX: 1,
    scaleY: 1,
  };

  // Input state
  private keysHeld = new Set<string>();
  private touchMoveX = 0;
  private touchMoveY = 0;
  private touchActive = false;

  // Entities
  private nextEntityId = 1;
  private inflatables: InflatableEntity[] = [];
  private waffles: WaffleEntity[] = [];
  private seagulls: SeagullEntity[] = [];
  private fryBombs: FryBombEntity[] = [];
  private rescuedKids: RescuedKidEntity[] = [];
  private obstacles: RectObstacle[] = [...BASE_PARAWANY];
  private bushes: BushSpot[] = [];

  // Spawn timers, chaos events & dynamic Baltic weather
  private inflatableSpawnTimer = 1.2;
  private waffleSpawnTimer = 2.0;
  private seagullSpawnTimer = 4.2;
  private kidSpawnTimer = 5.0;
  private nextEventTimer = 24;
  private eventCursor = 0;
  private activeEvent: ActiveChaosEvent | null = null;

  private activeWeatherEvent: ActiveWeatherEvent | null = null;
  private nextWeatherEventTimer = 13;
  private lastWeatherEventKind: WeatherEventKind | null = null;
  private lightningTimer = 0;
  private lightningFlash = 0;
  private lightningBolt: Array<{ x: number; y: number }> | null = null;
  private lightningBoltTimer = 0;

  private weather: WeatherKind = 'sunny';
  private prevWeather: WeatherKind = 'sunny';
  private weatherBlend = 1;
  private weatherTimer = 20;

  // Zero-GC 16-bit pixel-art particle & floating text pools
  private particlePool = new PixelParticlePool(320);
  private floatingTexts: FloatingText[] = [];
  private textIdx = 0;
  private demoParticlesKind: 'waffle' | 'seagull' | null = null;
  private demoParticlesTimer = 0;

  // Throttled HUD sync & pause static frame guard
  private hudSyncAccum = 0;
  private lastHudKey = '';
  private needsStaticRender = true;
  private playerBlinkFromHit = false;

  constructor(
    canvas: HTMLCanvasElement,
    onHudChange: (snapshot: HudSnapshot) => void,
    onLeaderboardChange: (entries: HighScoreEntry[]) => void,
    onProgressChange?: (progress: PlayerProgress) => void,
    onAchievementUnlocked?: (toast: AchievementToast) => void,
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.atlas = getSpriteAtlas();
    this.onHudChange = onHudChange;
    this.onLeaderboardChange = onLeaderboardChange;
    this.onProgressChange = onProgressChange ?? (() => {});
    this.onAchievementUnlocked = onAchievementUnlocked ?? (() => {});

    this.leaderboard = loadLeaderboard();
    this.bestScore = this.leaderboard.length > 0 ? this.leaderboard[0].score : 0;
    this.onLeaderboardChange(this.leaderboard);

    this.progress = loadProgress();
    this.selectedSkin = this.progress.selectedSkin;
    this.onProgressChange(this.progress);

    for (let i = 0; i < 28; i++) {
      this.floatingTexts.push({
        active: false,
        x: 0,
        y: 0,
        vy: -30,
        text: '',
        color: '#fff',
        life: 0,
        maxLife: 1,
        scale: 1,
      });
    }

    this.resetBushes();
    this.seedAmbientTitleWorld();
    this.bindEvents();
    this.handleResize();
    this.syncBodyState();
    this.pushHudSnapshot(true);
  }

  public startLoop(): void {
    if (this.rafId !== null) return;
    this.lastTimestamp = performance.now();
    const tick = (now: number) => {
      const rawDt = (now - this.lastTimestamp) / 1000;
      this.lastTimestamp = now;
      const dt = Math.min(Math.max(rawDt, 0), 0.05);
      if (this.phase === 'paused' || this.phase === 'gameover') {
        if (this.needsStaticRender) {
          this.render();
          this.needsStaticRender = false;
        }
      } else {
        this.update(dt);
        this.render();
      }
      this.rafId = window.requestAnimationFrame(tick);
    };
    this.rafId = window.requestAnimationFrame(tick);
  }

  public destroy(): void {
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    audio.stopMusic();
    this.unbindEvents();
  }

  public getPhase(): GamePhase {
    return this.phase;
  }

  public startGame(): void {
    this.phase = 'playing';
    this.elapsedRun = 0;
    this.score = 0;
    this.hp = MAX_HP;
    this.combo = 1;
    this.maxCombo = 1;
    this.comboTimer = 0;
    this.day = 1;
    this.inflatablesCaught = 0;
    this.wafflesCollected = 0;
    this.kidsFound = 0;
    this.seagullsDodged = 0;
    this.hitstopTimer = 0;
    this.deathDelayTimer = 0;
    this.pendingGameOver = false;
    this.lastStats = null;
    this.trauma = 0;
    this.activeEvent = null;
    this.nextEventTimer = 25;
    this.eventCursor = Math.floor(Math.random() * CHAOS_ORDER.length);
    this.activeWeatherEvent = null;
    this.nextWeatherEventTimer = 12 + Math.random() * 4;
    this.lastWeatherEventKind = null;
    this.lightningTimer = 0;
    this.lightningFlash = 0;
    this.lightningBolt = null;
    this.lightningBoltTimer = 0;
    this.weather = 'sunny';
    this.prevWeather = 'sunny';
    this.weatherBlend = 1;
    this.weatherTimer = 18;

    this.player.x = WORLD_WIDTH / 2;
    this.player.y = 316;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.facingX = 1;
    this.player.facingY = 0;
    this.player.walkDist = 0;
    this.player.dashTimer = 0;
    this.player.dashCooldown = 0;
    this.player.dashBuffer = 0;
    this.player.invulnTimer = 0.9; // Grace invuln right at spawn (no blink)
    this.playerBlinkFromHit = false;
    this.player.hitFlashTimer = 0;
    this.player.sugarRushTimer = 0;
    this.player.scaleX = 1;
    this.player.scaleY = 1;
    this.needsStaticRender = true;

    this.keysHeld.clear();
    this.touchActive = false;
    this.touchMoveX = 0;
    this.touchMoveY = 0;

    this.inflatables = [];
    this.waffles = [];
    this.seagulls = [];
    this.fryBombs = [];
    this.rescuedKids = [];
    this.obstacles = [...BASE_PARAWANY];
    this.resetBushes();
    this.clearPools();

    // Seed immediate welcoming targets so the first seconds feel lively and rewarding
    this.spawnInflatable('flamingo', 270, 210);
    this.spawnInflatable('croc', 700, 225);
    this.spawnWaffle(510, 240, false);
    this.inflatableSpawnTimer = 2.2;
    this.waffleSpawnTimer = 2.8;
    this.seagullSpawnTimer = 4.6; // Survive opening seconds safely without input
    this.kidSpawnTimer = 4.5;

    this.syncBodyState();
    audio.startMusic();
    audio.playWaffle(false);
    this.spawnFloatingText(this.player.x, this.player.y - 34, 'RATUJEMY WAKACJE!', '#f4d35e', 1.15);
    this.pushHudSnapshot(true);
  }

  public togglePause(): void {
    if (this.phase === 'playing') {
      this.phase = 'paused';
      this.needsStaticRender = true;
      this.keysHeld.clear();
      this.touchActive = false;
      audio.stopMusic();
      this.syncBodyState();
      this.pushHudSnapshot(true);
    } else if (this.phase === 'paused') {
      this.resumeGame();
    }
  }

  public resumeGame(): void {
    if (this.phase !== 'paused') return;
    this.phase = 'playing';
    this.needsStaticRender = true;
    this.keysHeld.clear();
    audio.startMusic();
    this.syncBodyState();
    this.pushHudSnapshot(true);
  }

  public returnToTitle(): void {
    this.phase = 'title';
    this.keysHeld.clear();
    this.touchActive = false;
    this.activeEvent = null;
    this.activeWeatherEvent = null;
    this.demoParticlesKind = null;
    this.lightningFlash = 0;
    this.lightningBolt = null;
    this.lightningBoltTimer = 0;
    audio.stopMusic();
    this.seedAmbientTitleWorld();
    this.syncBodyState();
    this.pushHudSnapshot(true);
  }

  public triggerDash(): void {
    if (this.phase !== 'playing' || this.pendingGameOver) return;
    this.player.dashBuffer = 0.13;
  }

  public setWeatherImmediate(kind: WeatherKind): void {
    this.weather = kind;
    this.prevWeather = kind;
    this.weatherBlend = 1;
    this.weatherTimer = 22;
    this.needsStaticRender = true;
    this.pushHudSnapshot(true);
  }

  public triggerWeatherEventImmediate(kind: WeatherEventKind): void {
    this.activeEvent = null;
    this.triggerWeatherEvent(kind, 1);
    if (kind === 'thunderstorm') {
      // Ensure at least 2 seagulls are on screen and a crisp lightning strike is visible
      if (this.seagulls.length < 2) {
        this.spawnSeagull('diver');
        this.spawnSeagull('flanker');
      }
      this.spawnLightningStrike(true);
    } else if (kind === 'strong_wind') {
      if (this.inflatables.length < 3) {
        this.spawnInflatable('unicorn', 340, 250);
      }
    }
    this.needsStaticRender = true;
    this.pushHudSnapshot(true);
  }

  public enableDemoParticles(kind: 'waffle' | 'seagull'): void {
    this.demoParticlesKind = kind;
    this.demoParticlesTimer = 0;
    if (kind === 'seagull' && this.seagulls.length === 0) {
      this.spawnSeagull('diver');
      this.seagulls[0].x = this.player.x + 56;
      this.seagulls[0].y = this.player.y - 38;
      this.seagulls[0].vx = -120;
      this.seagulls[0].state = 'recover';
      this.seagulls[0].stateTimer = 4;
    }
    this.fireDemoParticlesBurst();
    this.particlePool.update(0.11);
    this.needsStaticRender = true;
  }

  private fireDemoParticlesBurst(): void {
    if (this.demoParticlesKind === 'waffle') {
      emitWaffleCollectParticles(this.particlePool, this.player.x + 12, this.player.y - 12, {
        isGolden: true,
        healed: true,
      });
      this.spawnFloatingText(this.player.x + 12, this.player.y - 34, '+440 · +1 SERCE!', '#fef08a', 1.15);
    } else if (this.demoParticlesKind === 'seagull') {
      emitSeagullCollisionParticles(this.particlePool, this.player.x, this.player.y - 4, {
        knockDirX: -1,
        knockDirY: 0.25,
      });
      this.spawnFloatingText(this.player.x, this.player.y - 34, 'MOJE FRYTKI!!', '#ff948d', 1.15);
    }
  }

  public setSelectedSkin(skin: AnimatorSkinId): boolean {
    if (!isSkinUnlocked(skin, this.progress.unlockedAchievements, this.progress.bestScore)) {
      return false;
    }
    this.selectedSkin = skin;
    this.progress = {
      ...this.progress,
      selectedSkin: skin,
    };
    saveProgress(this.progress);
    this.onProgressChange(this.progress);
    this.needsStaticRender = true;
    this.pushHudSnapshot(true);
    return true;
  }

  private recordProgressUpdate(delta: {
    inflatables?: number;
    waffles?: number;
    kids?: number;
    seagullsDodged?: number;
    combo?: number;
    score?: number;
  }): void {
    const updated: PlayerProgress = {
      ...this.progress,
      totalInflatables: this.progress.totalInflatables + (delta.inflatables ?? 0),
      totalWaffles: this.progress.totalWaffles + (delta.waffles ?? 0),
      totalKids: this.progress.totalKids + (delta.kids ?? 0),
      totalSeagullsDodged: this.progress.totalSeagullsDodged + (delta.seagullsDodged ?? 0),
      bestCombo: Math.max(this.progress.bestCombo, delta.combo ?? 1),
      bestScore: Math.max(this.progress.bestScore, delta.score ?? 0),
    };

    const { newlyUnlocked, nextProgress } = evaluateNewAchievements(updated);
    this.progress = nextProgress;
    saveProgress(this.progress);
    this.onProgressChange(this.progress);

    if (newlyUnlocked.length > 0) {
      audio.playAchievement();
      this.spawnBurst(this.player.x, this.player.y - 12, ['#fff8b8', '#f7d459', '#6ce5f0', '#8ce08a'], 18, 155);
      for (const ach of newlyUnlocked) {
        const rewardSkinName = ach.rewardSkinId ? getSkinDef(ach.rewardSkinId).name : undefined;
        this.onAchievementUnlocked({
          id: ach.id,
          title: ach.title,
          description: ach.description,
          iconKind: ach.iconKind,
          rewardSkinName,
        });
      }
    }
  }

  private getCurrentWeatherSpeedMult(): number {
    const prev = getWeatherConfig(this.prevWeather).speedMult;
    const next = getWeatherConfig(this.weather).speedMult;
    return prev + (next - prev) * this.weatherBlend;
  }

  private getCurrentFogStrength(): number {
    const prev = getWeatherConfig(this.prevWeather).fogStrength;
    const next = getWeatherConfig(this.weather).fogStrength;
    return prev + (next - prev) * this.weatherBlend;
  }

  private getCurrentRainIntensity(): number {
    const prev = getWeatherConfig(this.prevWeather).rainIntensity;
    const next = getWeatherConfig(this.weather).rainIntensity;
    const baseRain = prev + (next - prev) * this.weatherBlend;
    const eventMods = getWeatherEventModifiers(this.activeWeatherEvent?.kind ?? null);
    return Math.min(1, Math.max(baseRain, eventMods.rainBoost));
  }

  private updateWeather(dt: number): void {
    if (this.weatherBlend < 1) {
      this.weatherBlend = Math.min(1, this.weatherBlend + dt / 2.2);
    }
    this.weatherTimer -= dt;
    if (this.weatherTimer <= 0) {
      this.prevWeather = this.weather;
      this.weather = getNextWeather(this.weather);
      this.weatherBlend = 0;
      this.weatherTimer = 19 + Math.random() * 5;
      const cfg = getWeatherConfig(this.weather);
      this.spawnFloatingText(
        WORLD_WIDTH / 2,
        142,
        cfg.announceText,
        this.weather === 'fog' ? '#e8eff5' : this.weather === 'rain' ? '#6ce5f0' : '#fff8b8',
        1.1,
      );
      this.pushHudSnapshot(true);
    }
  }

  private updateWeatherEvents(dt: number): void {
    if (this.lightningFlash > 0) {
      this.lightningFlash = Math.max(0, this.lightningFlash - dt * 2.8);
    }
    if (this.lightningBoltTimer > 0) {
      this.lightningBoltTimer = Math.max(0, this.lightningBoltTimer - dt);
      if (this.lightningBoltTimer <= 0) {
        this.lightningBolt = null;
      }
    }

    if (this.activeWeatherEvent) {
      this.activeWeatherEvent.remaining -= dt;

      if (this.activeWeatherEvent.kind === 'thunderstorm') {
        this.lightningTimer -= dt;
        if (this.lightningTimer <= 0) {
          this.spawnLightningStrike(false);
          this.lightningTimer = 2.1 + Math.random() * 1.9;
        }
      } else if (this.activeWeatherEvent.kind === 'strong_wind') {
        // Blowing golden Baltic sand particles across the beach
        const dir = this.activeWeatherEvent.windDir;
        if (Math.random() < dt * 16) {
          this.spawnParticle(
            dir > 0 ? 12 : WORLD_WIDTH - 12,
            SEA_SHORELINE_Y + 25 + Math.random() * (FOREST_LINE_Y - SEA_SHORELINE_Y - 35),
            dir * (260 + Math.random() * 140),
            -25 + (Math.random() - 0.5) * 40,
            Math.random() < 0.5 ? '#f7e4b2' : '#fffef9',
            3,
            0.7,
            10,
          );
        }
      }

      if (this.activeWeatherEvent.remaining <= 0) {
        this.activeWeatherEvent = null;
        this.nextWeatherEventTimer = 15 + Math.random() * 7;
        this.syncBodyState();
        this.pushHudSnapshot(true);
      }
      return;
    }

    this.nextWeatherEventTimer -= dt;
    if (this.nextWeatherEventTimer <= 0) {
      // Wait briefly if a chaos event banner is currently active so alerts never stack
      if (this.activeEvent) {
        this.nextWeatherEventTimer = 2.5;
        return;
      }
      const nextKind = pickRandomWeatherEvent(this.lastWeatherEventKind);
      this.triggerWeatherEvent(nextKind);
    }
  }

  private triggerWeatherEvent(kind: WeatherEventKind, forcedWindDir?: -1 | 1): void {
    const def = getWeatherEventDef(kind);
    const windDir: -1 | 1 = forcedWindDir ?? (Math.random() < 0.5 ? 1 : -1);
    this.lastWeatherEventKind = kind;
    this.activeWeatherEvent = {
      kind,
      title: def.title,
      subtitle: def.subtitle,
      effectBadge: def.effectBadge,
      remaining: def.duration,
      duration: def.duration,
      windDir,
    };

    if (kind === 'thunderstorm') {
      this.lightningTimer = 1.6;
      this.spawnLightningStrike(false);
      this.spawnFloatingText(WORLD_WIDTH / 2, 166, 'BURZA! MEWY SPOWOLNIONE!', '#6ce5f0', 1.15);
    } else if (kind === 'strong_wind') {
      audio.playWindGust();
      this.trauma = Math.min(1, this.trauma + 0.25);
      this.spawnInflatable('flamingo');
      this.spawnFloatingText(WORLD_WIDTH / 2, 166, 'SILNY WIATR! TRZYMAJ DMUCHAŃCE!', '#f7d459', 1.15);
    } else {
      audio.playChaosEvent();
      this.spawnFloatingText(WORLD_WIDTH / 2, 166, 'MORSKA BRYZA! SZYBSZY BIEG!', '#8ce08a', 1.12);
    }

    this.syncBodyState();
    this.pushHudSnapshot(true);
  }

  private spawnLightningStrike(keepLonger: boolean): void {
    const startX = 140 + Math.random() * (WORLD_WIDTH - 280);
    const points: Array<{ x: number; y: number }> = [{ x: startX, y: -12 }];
    let curX = startX;
    let curY = -12;
    const endY = 175 + Math.random() * 210;
    const segments = 7;
    for (let i = 1; i <= segments; i++) {
      curY = -12 + ((endY + 12) * i) / segments;
      curX += (Math.random() - 0.5) * 62;
      points.push({ x: Math.round(curX), y: Math.round(curY) });
    }
    this.lightningBolt = points;
    this.lightningBoltTimer = keepLonger ? 0.52 : 0.28;
    this.lightningFlash = keepLonger ? 0.48 : 0.42;
    this.trauma = Math.min(1, this.trauma + 0.34);
    audio.playThunder();
    const last = points[points.length - 1];
    this.spawnBurst(last.x, last.y, ['#fffef9', '#6ce5f0', '#f7d459'], 12, 145);
  }

  public setTouchMove(dx: number, dy: number, active: boolean): void {
    this.touchActive = active;
    const len = Math.hypot(dx, dy);
    if (!active || len < 0.08) {
      this.touchMoveX = 0;
      this.touchMoveY = 0;
      return;
    }
    const clamped = Math.min(1, len);
    this.touchMoveX = (dx / len) * clamped;
    this.touchMoveY = (dy / len) * clamped;
  }

  private resetBushes(): void {
    this.bushes = BUSH_COORDS.map((pos, idx) => ({
      id: idx,
      x: pos.x,
      y: pos.y,
      hasKid: false,
      kidTimer: 0,
      kidMaxTimer: 11,
      kidColor: '#f25f5c',
      gigglePhase: idx * 1.1,
      giggleText: GIGGLE_LINES[idx % GIGGLE_LINES.length],
      rescuedCooldown: 0,
    }));
  }

  private clearPools(): void {
    this.particlePool.clear();
    for (const t of this.floatingTexts) t.active = false;
  }

  private seedAmbientTitleWorld(): void {
    this.obstacles = [...BASE_PARAWANY];
    this.inflatables = [
      { id: 1, kind: 'flamingo', x: 220, y: 210, vx: 22, vy: 8, radius: 22, bobPhase: 0.3, caught: false, koTimer: 0 },
      { id: 2, kind: 'unicorn', x: 720, y: 190, vx: -26, vy: 6, radius: 22, bobPhase: 1.5, caught: false, koTimer: 0 },
      { id: 3, kind: 'croc', x: 560, y: 315, vx: 18, vy: -10, radius: 22, bobPhase: 2.7, caught: false, koTimer: 0 },
    ];
    this.waffles = [
      { id: 10, x: 355, y: 330, isGolden: false, life: 99, maxLife: 99, bobPhase: 0 },
      { id: 11, x: 600, y: 225, isGolden: true, life: 99, maxLife: 99, bobPhase: 1.2 },
    ];
    this.seagulls = [
      {
        id: 20,
        kind: 'diver',
        x: 190,
        y: 120,
        vx: 55,
        vy: 14,
        state: 'patrol',
        stateTimer: 5,
        targetX: 480,
        targetY: 200,
        wingPhase: 0,
        orbitAngle: 0,
        hasToken: false,
        dropCooldown: 4,
      },
      {
        id: 21,
        kind: 'flanker',
        x: 780,
        y: 150,
        vx: -48,
        vy: -10,
        state: 'patrol',
        stateTimer: 5,
        targetX: 300,
        targetY: 240,
        wingPhase: 1.8,
        orbitAngle: 2.2,
        hasToken: false,
        dropCooldown: 4,
      },
    ];
    this.fryBombs = [];
    this.rescuedKids = [];
    this.resetBushes();
    this.bushes[1].hasKid = true;
    this.bushes[1].kidTimer = 99;
    this.bushes[4].hasKid = true;
    this.bushes[4].kidTimer = 99;
    this.player.x = 480;
    this.player.y = 330;
  }

  private syncBodyState(): void {
    if (typeof document !== 'undefined') {
      document.body.dataset.state = this.phase;
      document.body.dataset.weatherEvent = this.activeWeatherEvent?.kind ?? 'none';
    }
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    audio.unlock();
    const code = e.code;
    if (
      code === 'ArrowUp' ||
      code === 'ArrowDown' ||
      code === 'ArrowLeft' ||
      code === 'ArrowRight' ||
      code === 'Space'
    ) {
      e.preventDefault();
    }

    if (this.phase === 'title') {
      if (
        (code === 'Enter' || code === 'Space') &&
        !document.querySelector('[role="dialog"]')
      ) {
        this.startGame();
      }
      return;
    }

    if (this.phase === 'gameover') {
      if (code === 'Enter' || code === 'Space' || code === 'KeyR') {
        this.startGame();
      }
      return;
    }

    if (code === 'Escape' || code === 'KeyP') {
      if (!e.repeat) {
        this.togglePause();
      }
      return;
    }

    if (this.phase === 'playing') {
      if (code === 'KeyR' && !e.repeat) {
        this.startGame();
        return;
      }
      if ((code === 'Space' || code === 'ShiftLeft' || code === 'ShiftRight') && !e.repeat) {
        this.player.dashBuffer = 0.13;
      }
      this.keysHeld.add(code);
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keysHeld.delete(e.code);
  };

  private handleFocusLoss = (): void => {
    this.keysHeld.clear();
    this.touchActive = false;
    this.touchMoveX = 0;
    this.touchMoveY = 0;
  };

  private handleResize = (): void => {
    const parent = this.canvas.parentElement;
    const width = parent ? parent.clientWidth : window.innerWidth;
    const height = parent ? parent.clientHeight : window.innerHeight;
    this.viewW = Math.max(320, width);
    this.viewH = Math.max(320, height);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = Math.round(this.viewW * this.dpr);
    this.canvas.height = Math.round(this.viewH * this.dpr);

    if (this.viewW < 640) {
      // Portrait mobile: comfortably zoomed in with camera following animator
      this.camScale = Math.max(this.viewW / 470, this.viewH / 650);
    } else {
      // Desktop & landscape tablet: keep entire 960x600 resort comfortably framed
      this.camScale = Math.min(this.viewW / WORLD_WIDTH, this.viewH / WORLD_HEIGHT);
    }
    this.needsStaticRender = true;
  };

  private bindEvents(): void {
    window.addEventListener('keydown', this.handleKeyDown, { passive: false });
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleFocusLoss);
    document.addEventListener('visibilitychange', this.handleFocusLoss);
    window.addEventListener('resize', this.handleResize);

    if (typeof ResizeObserver !== 'undefined' && this.canvas.parentElement) {
      this.resizeObserver = new ResizeObserver(() => this.handleResize());
      this.resizeObserver.observe(this.canvas.parentElement);
    }
  }

  private unbindEvents(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleFocusLoss);
    document.removeEventListener('visibilitychange', this.handleFocusLoss);
    window.removeEventListener('resize', this.handleResize);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  private spawnParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    color: string,
    size = 4,
    maxLife = 0.45,
    gravity = 160,
  ): void {
    this.particlePool.emit({
      kind: 'square',
      x,
      y,
      vx,
      vy,
      color,
      size,
      maxLife,
      gravity,
    });
  }

  private spawnBurst(x: number, y: number, colors: string[], count: number, speed = 130): void {
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.45;
      const spd = speed * (0.45 + Math.random() * 0.75);
      this.spawnParticle(
        x,
        y,
        Math.cos(ang) * spd,
        Math.sin(ang) * spd - 35,
        colors[i % colors.length],
        3 + Math.floor(Math.random() * 4),
        0.35 + Math.random() * 0.35,
        190,
      );
    }
  }

  private spawnFloatingText(x: number, y: number, text: string, color: string, scale = 1): void {
    const slot = this.floatingTexts[this.textIdx];
    this.textIdx = (this.textIdx + 1) % this.floatingTexts.length;
    slot.active = true;
    slot.x = Math.max(70, Math.min(WORLD_WIDTH - 70, x));
    slot.y = Math.max(60, y);
    slot.vy = -44;
    slot.text = text;
    slot.color = color;
    slot.life = 1.05;
    slot.maxLife = 1.05;
    slot.scale = scale;
  }

  private update(dt: number): void {
    this.worldTime += dt;

    // Trauma and hit flash always tick in real dt
    this.trauma = Math.max(0, this.trauma - dt * 1.9);
    if (this.player.hitFlashTimer > 0) {
      this.player.hitFlashTimer = Math.max(0, this.player.hitFlashTimer - dt);
    }

    if (this.phase === 'title') {
      this.updateAmbientTitle(dt);
      this.updateCamera(dt);
      return;
    }

    if (this.phase === 'paused' || this.phase === 'gameover') {
      this.updateParticles(dt * 0.35);
      return;
    }

    if (this.pendingGameOver) {
      this.deathDelayTimer -= dt;
      this.updateParticles(dt);
      this.updateFloatingTexts(dt);
      if (this.deathDelayTimer <= 0) {
        this.finalizeGameOver();
      }
      return;
    }

    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      this.updateParticles(dt * 0.5);
      this.updateFloatingTexts(dt * 0.5);
      return;
    }

    this.elapsedRun += dt;
    const diff = getDifficultyForTime(this.elapsedRun);
    if (diff.day > this.day) {
      this.day = diff.day;
      this.spawnFloatingText(
        WORLD_WIDTH / 2,
        175,
        `DZIEŃ ${this.day} W RUSAŁCE!`,
        '#f4d35e',
        1.25,
      );
      audio.playChaosEvent();
    }

    if (this.combo > 1) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 1;
        this.comboTimer = 0;
      }
    }

    this.updateWeather(dt);
    this.updateWeatherEvents(dt);
    this.updateChaosEvents(dt);
    this.updatePlayer(dt);
    this.updateSpawners(dt, diff);
    this.updateInflatables(dt, diff);
    this.updateWaffles(dt);
    this.updateBushes(dt);
    this.updateSeagulls(dt, diff);
    this.updateFryBombs(dt);
    this.updateRescuedKids(dt);
    if (this.demoParticlesKind) {
      this.demoParticlesTimer += dt;
      if (this.demoParticlesTimer >= 0.65) {
        this.demoParticlesTimer = 0;
        this.fireDemoParticlesBurst();
      }
    }
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);
    this.updateCamera(dt);

    this.hudSyncAccum += dt;
    if (this.hudSyncAccum >= 0.08) {
      this.hudSyncAccum = 0;
      this.pushHudSnapshot(false);
    }
  }

  private updateAmbientTitle(dt: number): void {
    // Gentle sunlit resort idle animation positioned cleanly below the title crest
    this.player.x = 480 + Math.sin(this.worldTime * 0.75) * 95;
    this.player.y = 358 + Math.cos(this.worldTime * 1.5) * 8;
    this.player.facingX = Math.cos(this.worldTime * 0.75) >= 0 ? 1 : -1;
    this.player.walkDist += dt * 75;

    for (const inf of this.inflatables) {
      inf.bobPhase += dt * 3.5;
      inf.x += inf.vx * dt;
      inf.y += inf.vy * dt;
      if (inf.x < 100 || inf.x > WORLD_WIDTH - 100) inf.vx *= -1;
      if (inf.y < 140 || inf.y > 410) inf.vy *= -1;
    }

    for (const g of this.seagulls) {
      g.wingPhase += dt * 9;
      g.x += g.vx * dt;
      g.y += Math.sin(this.worldTime * 2 + g.id) * 18 * dt;
      if (g.x < -50) g.x = WORLD_WIDTH + 50;
      if (g.x > WORLD_WIDTH + 50) g.x = -50;
    }

    for (const b of this.bushes) {
      b.gigglePhase += dt * 4.5;
    }
  }

  private updateCamera(dt: number): void {
    let targetX = WORLD_WIDTH / 2;
    let targetY = WORLD_HEIGHT / 2;

    if (this.viewW < 640 && this.phase === 'playing') {
      const halfVisW = this.viewW / (2 * this.camScale);
      const halfVisH = this.viewH / (2 * this.camScale);
      const minX = Math.min(WORLD_WIDTH / 2, halfVisW);
      const maxX = Math.max(WORLD_WIDTH / 2, WORLD_WIDTH - halfVisW);
      const minY = Math.min(WORLD_HEIGHT / 2, halfVisH);
      const maxY = Math.max(WORLD_HEIGHT / 2, WORLD_HEIGHT - halfVisH);
      targetX = Math.max(minX, Math.min(maxX, this.player.x));
      targetY = Math.max(minY, Math.min(maxY, this.player.y));
    }

    const damp = 1 - Math.exp(-8 * dt);
    this.camX += (targetX - this.camX) * damp;
    this.camY += (targetY - this.camY) * damp;
  }

  private updateChaosEvents(dt: number): void {
    if (this.activeEvent) {
      this.activeEvent.remaining -= dt;
      if (this.activeEvent.kind === 'waffle_rain' && Math.random() < dt * 3.8) {
        this.spawnWaffle(
          110 + Math.random() * (WORLD_WIDTH - 220),
          155 + Math.random() * 270,
          Math.random() < 0.28,
        );
      }
      if (this.activeEvent.remaining <= 0) {
        // Clean up temporary parawany
        if (this.activeEvent.kind === 'parawan_invasion') {
          this.obstacles = [...BASE_PARAWANY];
        }
        this.activeEvent = null;
        this.nextEventTimer = 19 + Math.random() * 6;
        this.pushHudSnapshot(true);
      }
      return;
    }

    this.nextEventTimer -= dt;
    if (this.nextEventTimer <= 0) {
      if (this.activeWeatherEvent) {
        this.nextEventTimer = 2.5;
        return;
      }
      const kind = CHAOS_ORDER[this.eventCursor % CHAOS_ORDER.length];
      this.eventCursor += 1;
      this.triggerChaosEvent(kind);
    }
  }

  private triggerChaosEvent(kind: ChaosEventKind): void {
    const meta = CHAOS_EVENT_META[kind];
    this.activeEvent = {
      kind,
      title: meta.title,
      subtitle: meta.subtitle,
      remaining: meta.duration,
      duration: meta.duration,
    };
    audio.playChaosEvent();
    this.trauma = Math.min(1, this.trauma + 0.35);

    if (kind === 'parawan_invasion') {
      this.obstacles = [...BASE_PARAWANY, ...EXTRA_PARAWANY];
      for (const obs of EXTRA_PARAWANY) {
        this.spawnBurst(obs.x + obs.w / 2, obs.y + obs.h / 2, ['#f4d35e', '#f25f5c', '#fffdf7'], 10, 95);
        this.spawnFloatingText(obs.x + obs.w / 2, obs.y - 8, 'REZERWACJA 5:00!', '#fffdf7', 0.85);
      }
    } else if (kind === 'seagull_raid') {
      this.spawnWaffle(260, 260, true);
      this.spawnWaffle(700, 260, true);
      this.spawnSeagull('diver');
      this.spawnSeagull('flanker');
    } else if (kind === 'baltic_gale') {
      this.spawnInflatable('unicorn');
      this.spawnInflatable('flamingo');
    } else if (kind === 'waffle_rain') {
      for (let i = 0; i < 4; i++) {
        this.spawnWaffle(180 + i * 200, 210 + (i % 2) * 110, i === 2);
      }
    } else if (kind === 'hide_and_seek') {
      let spawned = 0;
      for (const b of this.bushes) {
        if (!b.hasKid && spawned < 3) {
          this.hideKidInBush(b);
          spawned += 1;
        }
      }
    }

    this.pushHudSnapshot(true);
  }

  private updatePlayer(dt: number): void {
    const p = this.player;
    if (p.invulnTimer > 0) p.invulnTimer = Math.max(0, p.invulnTimer - dt);
    if (p.dashCooldown > 0) p.dashCooldown = Math.max(0, p.dashCooldown - dt);
    if (p.dashBuffer > 0) p.dashBuffer = Math.max(0, p.dashBuffer - dt);
    if (p.sugarRushTimer > 0) p.sugarRushTimer = Math.max(0, p.sugarRushTimer - dt);

    // Gather movement input
    let ix = 0;
    let iy = 0;
    if (this.keysHeld.has('KeyA') || this.keysHeld.has('ArrowLeft')) ix -= 1;
    if (this.keysHeld.has('KeyD') || this.keysHeld.has('ArrowRight')) ix += 1;
    if (this.keysHeld.has('KeyW') || this.keysHeld.has('ArrowUp')) iy -= 1;
    if (this.keysHeld.has('KeyS') || this.keysHeld.has('ArrowDown')) iy += 1;

    if (this.touchActive && (Math.abs(this.touchMoveX) > 0.05 || Math.abs(this.touchMoveY) > 0.05)) {
      ix = this.touchMoveX;
      iy = this.touchMoveY;
    }

    const mag = Math.hypot(ix, iy);
    if (mag > 0.01) {
      ix /= Math.max(1, mag);
      iy /= Math.max(1, mag);
      p.facingX = ix;
      p.facingY = iy;
    }

    const skinDef = getSkinDef(this.selectedSkin);
    const weatherEventMods = getWeatherEventModifiers(this.activeWeatherEvent?.kind ?? null);

    // Consume buffered dash if off cooldown
    if (p.dashBuffer > 0 && p.dashCooldown <= 0 && p.dashTimer <= 0) {
      p.dashBuffer = 0;
      p.dashTimer = DASH_DURATION;
      p.dashCooldown = DASH_COOLDOWN * skinDef.dashCooldownMult * weatherEventMods.dashCooldownMult;
      const dLen = Math.hypot(ix, iy);
      if (dLen > 0.1) {
        p.dashDirX = ix / dLen;
        p.dashDirY = iy / dLen;
      } else {
        const fLen = Math.hypot(p.facingX, p.facingY) || 1;
        p.dashDirX = p.facingX / fLen;
        p.dashDirY = p.facingY / fLen;
      }
      p.scaleX = 1.28;
      p.scaleY = 0.78;
      audio.playDash();
      this.spawnBurst(p.x, p.y + 10, ['#fffdf7', '#f4d35e', '#16a3b8'], 7, 110);
    }

    const weatherSpeed = this.getCurrentWeatherSpeedMult();
    const baseSpeed =
      (p.sugarRushTimer > 0 ? 315 : 246) *
      weatherSpeed *
      skinDef.moveSpeedMult *
      weatherEventMods.playerSpeedMult;
    if (p.dashTimer > 0) {
      p.dashTimer = Math.max(0, p.dashTimer - dt);
      const dashSpeed =
        540 *
        Math.max(0.92, weatherSpeed) *
        skinDef.moveSpeedMult *
        weatherEventMods.playerSpeedMult;
      p.vx = p.dashDirX * dashSpeed;
      p.vy = p.dashDirY * dashSpeed;
      if (Math.random() < 0.75) {
        this.spawnParticle(
          p.x - p.dashDirX * 14,
          p.y + 8,
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 40,
          '#fef08a',
          5,
          0.22,
          0,
        );
      }
    } else {
      const windDir = this.activeWeatherEvent?.windDir ?? 1;
      const windPushX = weatherEventMods.playerWindPushX * windDir;
      const targetVx = ix * baseSpeed + windPushX;
      const targetVy = iy * baseSpeed;
      const accel = mag > 0.05 ? 16 : 13;
      const blend = 1 - Math.exp(-accel * dt);
      p.vx += (targetVx - p.vx) * blend;
      p.vy += (targetVy - p.vy) * blend;
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // World bounds (sand + edge of sea + pine forest clearing)
    p.x = Math.max(30, Math.min(WORLD_WIDTH - 30, p.x));
    p.y = Math.max(SEA_SHORELINE_Y + 8, Math.min(WORLD_HEIGHT - 36, p.y));

    // Resolve parawan collisions
    for (const obs of this.obstacles) {
      const resolved = resolveCircleRectPush(p.x, p.y, p.radius, obs.x, obs.y, obs.w, obs.h);
      p.x = resolved.x;
      p.y = resolved.y;
    }

    // Gait-synced walk cycle & sand footsteps
    const moved = Math.hypot(p.vx, p.vy) * dt;
    p.walkDist += moved;
    if (moved > 1.2 && Math.random() < 0.18) {
      const dustColor = p.y > FOREST_LINE_Y ? '#52b788' : '#e4cfa0';
      this.spawnParticle(p.x, p.y + 18, -p.vx * 0.12, -18, dustColor, 3, 0.25, 45);
    }

    // Relax squash & stretch smoothly
    const spring = 1 - Math.exp(-14 * dt);
    p.scaleX += (1 - p.scaleX) * spring;
    p.scaleY += (1 - p.scaleY) * spring;
  }

  private updateSpawners(dt: number, diff: ReturnType<typeof getDifficultyForTime>): void {
    const galeActive =
      this.activeEvent?.kind === 'baltic_gale' ||
      this.activeWeatherEvent?.kind === 'strong_wind';
    this.inflatableSpawnTimer -= dt * (galeActive ? 1.4 : 1);
    if (this.inflatableSpawnTimer <= 0 && this.inflatables.length < 6) {
      this.spawnInflatable();
      this.inflatableSpawnTimer = diff.inflatableSpawnInterval;
    }

    this.waffleSpawnTimer -= dt;
    if (this.waffleSpawnTimer <= 0 && this.waffles.length < 5) {
      this.spawnWaffle();
      this.waffleSpawnTimer = diff.waffleSpawnInterval;
    }

    const raidActive = this.activeEvent?.kind === 'seagull_raid';
    this.seagullSpawnTimer -= dt * (raidActive ? 1.55 : 1);
    const maxGulls = raidActive ? diff.maxSeagulls + 2 : diff.maxSeagulls;
    if (this.seagullSpawnTimer <= 0 && this.seagulls.length < maxGulls) {
      const pool = diff.allowedSeagulls;
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      this.spawnSeagull(chosen);
      this.seagullSpawnTimer = diff.seagullSpawnInterval;
    }

    this.kidSpawnTimer -= dt;
    if (this.kidSpawnTimer <= 0) {
      const freeBushes = this.bushes.filter((b) => !b.hasKid && b.rescuedCooldown <= 0);
      if (freeBushes.length > 0) {
        const spot = freeBushes[Math.floor(Math.random() * freeBushes.length)];
        this.hideKidInBush(spot);
      }
      this.kidSpawnTimer = diff.kidSpawnInterval;
    }
  }

  private spawnInflatable(forcedKind?: InflatableKind, fx?: number, fy?: number): void {
    const roll = Math.random();
    const kind: InflatableKind =
      forcedKind ?? (roll < 0.48 ? 'flamingo' : roll < 0.8 ? 'croc' : 'unicorn');

    const fromLeft = Math.random() < 0.5;
    const x = fx ?? (fromLeft ? 56 : WORLD_WIDTH - 56);
    const y = fy ?? (215 + Math.random() * 195);
    const vx = (fromLeft ? 1 : -1) * (58 + Math.random() * 36);
    const vy = -(18 + Math.random() * 24); // Gently drifts toward the Baltic sea!

    this.inflatables.push({
      id: this.nextEntityId++,
      kind,
      x,
      y,
      vx,
      vy,
      radius: 23,
      bobPhase: Math.random() * Math.PI * 2,
      caught: false,
      koTimer: 0,
    });
  }

  private spawnWaffle(fx?: number, fy?: number, forcedGolden?: boolean): void {
    const x = fx ?? (110 + Math.random() * (WORLD_WIDTH - 220));
    const y = fy ?? (150 + Math.random() * 285);
    const isGolden = forcedGolden ?? Math.random() < 0.16;
    this.waffles.push({
      id: this.nextEntityId++,
      x,
      y,
      isGolden,
      life: isGolden ? 9.5 : 11,
      maxLife: isGolden ? 9.5 : 11,
      bobPhase: Math.random() * Math.PI * 2,
    });
  }

  private spawnSeagull(kind: SeagullKind): void {
    const fromLeft = Math.random() < 0.5;
    const x = fromLeft ? -36 : WORLD_WIDTH + 36;
    const y = 78 + Math.random() * 120;
    this.seagulls.push({
      id: this.nextEntityId++,
      kind,
      x,
      y,
      vx: fromLeft ? 105 : -105,
      vy: 0,
      state: 'patrol',
      stateTimer: 1.5 + Math.random() * 1.4,
      targetX: this.player.x,
      targetY: this.player.y,
      wingPhase: Math.random() * Math.PI * 2,
      orbitAngle: Math.random() * Math.PI * 2,
      hasToken: false,
      dropCooldown: 1.8,
    });
  }

  private hideKidInBush(bush: BushSpot): void {
    bush.hasKid = true;
    bush.kidMaxTimer = 13;
    bush.kidTimer = 13;
    bush.giggleText = GIGGLE_LINES[Math.floor(Math.random() * GIGGLE_LINES.length)];
    this.spawnBurst(bush.x, bush.y - 10, ['#52b788', '#2d6a4f', '#f4d35e'], 6, 70);
  }

  private updateInflatables(dt: number, diff: ReturnType<typeof getDifficultyForTime>): void {
    const gale = this.activeEvent?.kind === 'baltic_gale';
    const weatherEventMods = getWeatherEventModifiers(this.activeWeatherEvent?.kind ?? null);
    const windDir = this.activeWeatherEvent?.windDir ?? 1;
    const pickupMult = getSkinDef(this.selectedSkin).pickupRadiusMult;
    const catchRadius =
      (this.player.dashTimer > 0 ? 52 : 38) *
      pickupMult *
      weatherEventMods.inflatableCatchRadiusMult;

    for (let i = this.inflatables.length - 1; i >= 0; i--) {
      const inf = this.inflatables[i];
      inf.bobPhase += dt * (this.activeWeatherEvent?.kind === 'strong_wind' ? 8.5 : 5);

      if (inf.caught) {
        inf.koTimer -= dt;
        inf.y -= 65 * dt;
        if (inf.koTimer <= 0) {
          this.inflatables.splice(i, 1);
        }
        continue;
      }

      const distToPlayer = Math.hypot(inf.x - this.player.x, inf.y - this.player.y);

      // Distinct inflatable fleeing behaviors
      if (inf.kind === 'unicorn' && distToPlayer < 140) {
        const dx = (inf.x - this.player.x) / (distToPlayer || 1);
        const dy = (inf.y - this.player.y) / (distToPlayer || 1);
        inf.vx += dx * 260 * dt;
        inf.vy += dy * 220 * dt;
      } else if (inf.kind === 'flamingo') {
        inf.vx += Math.sin(this.worldTime * 3.2 + inf.id) * 110 * dt;
      }

      if (gale || this.weather === 'rain') {
        inf.vx += (gale ? 45 : 24) * dt;
        inf.vy -= (gale ? 42 : 16) * dt;
      }

      // Dynamic random weather event wind gusts push inflatables & add erratic turbulence!
      if (weatherEventMods.windForceX !== 0 || weatherEventMods.windForceY !== 0) {
        const gustWave = 0.75 + 0.5 * Math.sin(this.worldTime * 4.6 + inf.id);
        inf.vx += weatherEventMods.windForceX * windDir * gustWave * dt;
        inf.vy += weatherEventMods.windForceY * gustWave * dt;
      }

      // Cap velocity (scaled by difficulty, gale, ambient weather, and random weather events)
      const weatherSpeed = this.getCurrentWeatherSpeedMult();
      const maxSpd =
        (inf.kind === 'unicorn' ? 148 : 112) *
        diff.inflatableSpeedMult *
        weatherSpeed *
        weatherEventMods.inflatableSpeedMult *
        (gale ? 1.25 : 1);
      const spd = Math.hypot(inf.vx, inf.vy);
      if (spd > maxSpd) {
        inf.vx = (inf.vx / spd) * maxSpd;
        inf.vy = (inf.vy / spd) * maxSpd;
      }

      inf.x += inf.vx * dt;
      inf.y += inf.vy * dt;

      // Bounce off left/right edges and forest line
      if (inf.x < 34) {
        inf.x = 34;
        inf.vx = Math.abs(inf.vx);
      } else if (inf.x > WORLD_WIDTH - 34) {
        inf.x = WORLD_WIDTH - 34;
        inf.vx = -Math.abs(inf.vx);
      }
      if (inf.y > FOREST_LINE_Y - 18) {
        inf.y = FOREST_LINE_Y - 18;
        inf.vy = -Math.abs(inf.vy);
      }

      // Check player catch!
      if (distToPlayer < catchRadius) {
        inf.caught = true;
        inf.koTimer = 0.24;
        this.inflatablesCaught += 1;
        this.combo = advanceCombo(this.combo);
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.comboTimer = COMBO_DURATION;
        const weatherScoreMult = getWeatherConfig(this.weather).scoreMult;
        const pts = calculatePickupScore(
          getInflatableBasePoints(inf.kind),
          this.combo,
          (gale ? 2 : 1) * weatherScoreMult * weatherEventMods.inflatableScoreMult,
        );
        this.score += pts;
        this.player.scaleX = 1.2;
        this.player.scaleY = 0.84;
        this.hitstopTimer = 0.028;
        audio.playCatchInflatable(this.combo);

        const burstPalette =
          inf.kind === 'flamingo'
            ? ['#ff6eb4', '#fffdf7', '#f4d35e']
            : inf.kind === 'unicorn'
              ? ['#a855f7', '#93c5fd', '#fffdf7']
              : ['#40c969', '#f4d35e', '#fffdf7'];
        this.spawnBurst(inf.x, inf.y, burstPalette, 12, 145);
        const catchWord = CATCH_LINES[this.inflatablesCaught % CATCH_LINES.length];
        this.spawnFloatingText(inf.x, inf.y - 18, `+${pts} ${catchWord}`, '#fffdf7', 1.05);
        this.recordProgressUpdate({
          inflatables: 1,
          combo: this.combo,
          score: this.score,
        });
        this.pushHudSnapshot(true);
        continue;
      }

      // Escaped into deep Baltic sea!
      if (inf.y < SEA_SHORELINE_Y - 26) {
        this.spawnBurst(inf.x, SEA_SHORELINE_Y - 12, ['#fffdf7', '#7dd3fc', '#0ea5e9'], 10, 100);
        this.spawnFloatingText(inf.x, SEA_SHORELINE_Y + 6, 'ADIOS, DMUCHAŃCU!', '#bae6fd', 0.9);
        audio.playSplashEscape();
        if (this.combo > 1) {
          this.combo = Math.max(1, this.combo - 1);
        }
        this.inflatables.splice(i, 1);
      }
    }
  }

  private updateWaffles(dt: number): void {
    const pickupMult = getSkinDef(this.selectedSkin).pickupRadiusMult;
    const collectRadius = (this.player.dashTimer > 0 ? 44 : 34) * pickupMult;

    for (let i = this.waffles.length - 1; i >= 0; i--) {
      const w = this.waffles[i];
      w.life -= dt;
      w.bobPhase += dt * 4;
      if (w.life <= 0) {
        this.waffles.splice(i, 1);
        continue;
      }

      const dist = Math.hypot(w.x - this.player.x, w.y - this.player.y);
      if (dist < collectRadius) {
        this.wafflesCollected += 1;
        this.combo = advanceCombo(this.combo);
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.comboTimer = COMBO_DURATION;

        const base = w.isGolden ? BASE_POINTS.goldenWaffle : BASE_POINTS.waffle;
        const pts = calculatePickupScore(base, this.combo, getWeatherConfig(this.weather).scoreMult);
        this.score += pts;

        const prevHp = this.hp;
        this.hp = applyWaffleHeal(this.hp, w.isGolden, this.wafflesCollected);
        const healed = this.hp > prevHp;

        if (w.isGolden) {
          this.player.sugarRushTimer = 5.5;
        }

        audio.playWaffle(w.isGolden);
        this.player.scaleX = 1.18;
        this.player.scaleY = 0.85;
        this.hitstopTimer = Math.max(this.hitstopTimer, w.isGolden ? 0.032 : 0.018);
        emitWaffleCollectParticles(this.particlePool, w.x, w.y, {
          isGolden: w.isGolden,
          healed,
        });
        const msg = healed
          ? `+${pts} · +1 SERCE!`
          : w.isGolden
            ? `+${pts} CUKROWY SZAŁ!`
            : `+${pts} GOFR!`;
        this.spawnFloatingText(w.x, w.y - 16, msg, w.isGolden ? '#fef08a' : '#fffdf7', w.isGolden ? 1.15 : 0.95);
        this.waffles.splice(i, 1);
        this.recordProgressUpdate({
          waffles: 1,
          combo: this.combo,
          score: this.score,
        });
        this.pushHudSnapshot(true);
      }
    }
  }

  private updateBushes(dt: number): void {
    const pickupMult = getSkinDef(this.selectedSkin).pickupRadiusMult;
    const rescueRadius = (this.player.dashTimer > 0 ? 60 : 48) * pickupMult;

    for (const b of this.bushes) {
      b.gigglePhase += dt * 6;
      if (b.rescuedCooldown > 0) {
        b.rescuedCooldown = Math.max(0, b.rescuedCooldown - dt);
      }
      if (!b.hasKid) continue;

      b.kidTimer -= dt;
      if (b.kidTimer <= 0) {
        b.hasKid = false;
        b.rescuedCooldown = 3;
        this.spawnFloatingText(b.x, b.y - 24, 'Uciekł głębiej w las!', '#a7f3d0', 0.85);
        continue;
      }

      const dist = Math.hypot(b.x - this.player.x, b.y - this.player.y);
      if (dist < rescueRadius) {
        b.hasKid = false;
        b.rescuedCooldown = 5;
        this.kidsFound += 1;
        this.combo = advanceCombo(this.combo);
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.comboTimer = COMBO_DURATION;
        const pts = calculatePickupScore(
          BASE_POINTS.kid,
          this.combo,
          getWeatherConfig(this.weather).scoreMult,
        );
        this.score += pts;
        this.hitstopTimer = 0.035;
        audio.playKidFound();

        this.rescuedKids.push({ x: b.x, y: b.y - 8, vy: -120, timer: 1.05 });
        this.spawnBurst(b.x, b.y - 8, ['#f4d35e', '#f25f5c', '#52b788', '#38bdf8'], 18, 155);
        const line = KID_RESCUE_LINES[this.kidsFound % KID_RESCUE_LINES.length];
        this.spawnFloatingText(b.x, b.y - 30, `+${pts} ${line}`, '#fef08a', 1.1);
        this.recordProgressUpdate({
          kids: 1,
          combo: this.combo,
          score: this.score,
        });
        this.pushHudSnapshot(true);
      }
    }
  }

  private updateSeagulls(dt: number, diff: ReturnType<typeof getDifficultyForTime>): void {
    const activeTelegraphs = this.seagulls.filter(
      (g) => g.state === 'telegraph' || g.state === 'dive',
    ).length;
    let tokensInUse = activeTelegraphs;
    const weatherEventMods = getWeatherEventModifiers(this.activeWeatherEvent?.kind ?? null);
    const seagullSpeedMult = weatherEventMods.seagullSpeedMult;

    for (let i = this.seagulls.length - 1; i >= 0; i--) {
      const g = this.seagulls[i];
      g.wingPhase += dt * (g.state === 'dive' ? 18 : 10) * Math.max(0.55, seagullSpeedMult);
      g.stateTimer -= dt * seagullSpeedMult;

      const weatherDt = dt * this.getCurrentWeatherSpeedMult() * seagullSpeedMult;
      if (g.kind === 'diver') {
        this.updateDiverSeagull(g, weatherDt, diff, tokensInUse, () => {
          tokensInUse += 1;
        });
      } else if (g.kind === 'flanker') {
        this.updateFlankerSeagull(g, weatherDt, diff);
      } else {
        this.updateQueenSeagull(g, weatherDt, diff);
      }

      // Collision with animator during active attack / swoop
      const hitDist = g.kind === 'queen' ? 30 : 25;
      const dist = Math.hypot(g.x - this.player.x, g.y - this.player.y);
      const isDangerous =
        g.state === 'dive' || (g.kind === 'flanker' && g.state === 'patrol' && g.y > SEA_SHORELINE_Y + 25);

      if (isDangerous && dist < hitDist) {
        if (this.player.dashTimer > 0 && !g.dodgeAwarded) {
          g.dodgeAwarded = true;
          this.seagullsDodged += 1;
          for (let f = 0; f < 3; f++) {
            this.particlePool.emit({
              kind: 'feather',
              x: g.x,
              y: g.y,
              vx: (Math.random() - 0.5) * 95,
              vy: -55 - Math.random() * 45,
              color: '#fffef9',
              secondaryColor: '#94a3b8',
              maxLife: 0.75,
              gravity: 75,
              drag: 2.1,
              flutterAmp: 32,
              flutterFreq: 7,
              flutterPhase: f * 2,
              rotSpeed: 6,
            });
          }
          this.spawnFloatingText(this.player.x, this.player.y - 26, 'UNIK!', '#6ce5f0', 0.95);
          this.recordProgressUpdate({ seagullsDodged: 1 });
        } else {
          const hitApplied = this.tryHurtPlayer(g.x, g.y);
          if (hitApplied) {
            g.hitPlayerThisDive = true;
          }
        }
        if (g.state === 'dive') {
          g.state = 'recover';
          g.stateTimer = 1.4;
          g.vy = -150;
        }
      }

      // Remove gulls that flew far off-screen while leaving
      if (g.state === 'leave' && (g.x < -90 || g.x > WORLD_WIDTH + 90 || g.y < -90)) {
        this.seagulls.splice(i, 1);
      }
    }
  }

  private updateDiverSeagull(
    g: SeagullEntity,
    dt: number,
    diff: ReturnType<typeof getDifficultyForTime>,
    tokensInUse: number,
    onAcquireToken: () => void,
  ): void {
    if (g.state === 'patrol') {
      g.x += g.vx * diff.seagullSpeedMult * dt;
      g.y += Math.sin(this.worldTime * 3.5 + g.id) * 38 * dt;
      if (g.x < 50) g.vx = Math.abs(g.vx);
      if (g.x > WORLD_WIDTH - 50) g.vx = -Math.abs(g.vx);

      if (g.stateTimer <= 0 && canAcquireAttackToken(tokensInUse, diff.maxAttackTokens)) {
        onAcquireToken();
        g.state = 'telegraph';
        g.stateTimer = 0.62; // Clear readable windup!
        g.targetX = Math.max(55, Math.min(WORLD_WIDTH - 55, this.player.x + this.player.vx * 0.16));
        g.targetY = Math.max(SEA_SHORELINE_Y + 28, Math.min(WORLD_HEIGHT - 50, this.player.y + this.player.vy * 0.16));
        audio.playSeagullTelegraph();
      }
    } else if (g.state === 'telegraph') {
      // Hover & aim toward locked target
      const dx = g.targetX - g.x;
      const dy = g.targetY - g.y;
      g.x += dx * dt * 0.45;
      g.y += (Math.max(70, g.y - 25 * dt) - g.y);
      if (g.stateTimer <= 0) {
        g.state = 'dive';
        g.stateTimer = 0.72;
        g.hitPlayerThisDive = false;
        g.dodgeAwarded = false;
        const len = Math.hypot(dx, dy) || 1;
        const diveSpeed = 400 * diff.seagullSpeedMult;
        g.vx = (dx / len) * diveSpeed;
        g.vy = (dy / len) * diveSpeed;
      }
    } else if (g.state === 'dive') {
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      if (g.stateTimer <= 0 || g.y > WORLD_HEIGHT - 25 || g.x < 10 || g.x > WORLD_WIDTH - 10) {
        if (!g.hitPlayerThisDive && !g.dodgeAwarded && this.phase === 'playing') {
          g.dodgeAwarded = true;
          this.seagullsDodged += 1;
          this.recordProgressUpdate({ seagullsDodged: 1 });
        }
        g.state = 'recover';
        g.stateTimer = 1.6;
        g.vx = g.x < WORLD_WIDTH / 2 ? -135 : 135;
        g.vy = -120;
      }
    } else if (g.state === 'recover') {
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      if (g.y < 115 || g.stateTimer <= 0) {
        g.state = 'leave';
        g.vx = g.x < WORLD_WIDTH / 2 ? -185 : 185;
        g.vy = -45;
      }
    } else {
      g.x += g.vx * dt;
      g.y += g.vy * dt;
    }
  }

  private updateFlankerSeagull(
    g: SeagullEntity,
    dt: number,
    diff: ReturnType<typeof getDifficultyForTime>,
  ): void {
    // Sweeps in readable sinusoidal beach passes
    if (g.state === 'patrol') {
      g.orbitAngle += dt * 2.5 * diff.seagullSpeedMult;
      const dir = g.vx >= 0 ? 1 : -1;
      g.x += dir * 155 * diff.seagullSpeedMult * dt;
      g.y = 265 + Math.sin(g.orbitAngle) * 115;
      if ((dir > 0 && g.x > WORLD_WIDTH + 60) || (dir < 0 && g.x < -60)) {
        g.state = 'leave';
      }
    } else {
      g.x += g.vx * dt;
      g.y -= 40 * dt;
    }
  }

  private updateQueenSeagull(
    g: SeagullEntity,
    dt: number,
    diff: ReturnType<typeof getDifficultyForTime>,
  ): void {
    // Królowa Frytek cruises high along the shoreline and drops telegraphed fry-bombs!
    if (g.state === 'patrol') {
      g.x += g.vx * 0.9 * diff.seagullSpeedMult * dt;
      g.y = 95 + Math.sin(this.worldTime * 3 + g.id) * 18;
      if (g.x < 70) g.vx = Math.abs(g.vx);
      if (g.x > WORLD_WIDTH - 70) g.vx = -Math.abs(g.vx);

      g.dropCooldown -= dt;
      if (g.dropCooldown <= 0 && this.fryBombs.length < 4) {
        g.dropCooldown = Math.max(1.4, 2.5 - diff.day * 0.14);
        const tx = Math.max(70, Math.min(WORLD_WIDTH - 70, this.player.x + (Math.random() - 0.5) * 90));
        const ty = Math.max(155, Math.min(FOREST_LINE_Y - 10, this.player.y + (Math.random() - 0.5) * 60));
        this.fryBombs.push({
          x: tx,
          y: ty,
          startY: g.y,
          timer: 0,
          duration: 0.78, // Clear 0.78s ground target telegraph!
          radius: 30,
        });
        audio.playSeagullTelegraph();
      }

      if (g.stateTimer <= -7.5) {
        g.state = 'leave';
        g.vx = g.x < WORLD_WIDTH / 2 ? -180 : 180;
      }
    } else {
      g.x += g.vx * dt;
      g.y -= 50 * dt;
    }
  }

  private updateFryBombs(dt: number): void {
    for (let i = this.fryBombs.length - 1; i >= 0; i--) {
      const bomb = this.fryBombs[i];
      bomb.timer += dt;
      if (bomb.timer >= bomb.duration) {
        this.spawnBurst(bomb.x, bomb.y, ['#f4d35e', '#f25f5c', '#fffdf7'], 8, 115);
        for (let f = 0; f < 4; f++) {
          const ang = (Math.PI * 2 * f) / 4 + Math.random() * 0.5;
          this.particlePool.emit({
            kind: 'fry',
            x: bomb.x,
            y: bomb.y,
            vx: Math.cos(ang) * (80 + Math.random() * 60),
            vy: -95 - Math.random() * 50,
            color: '#f7d459',
            secondaryColor: '#d99b26',
            maxLife: 0.65,
            gravity: 420,
            groundY: bomb.y + 12,
            bounce: 0.4,
            rotSpeed: 10,
          });
        }
        const dist = Math.hypot(bomb.x - this.player.x, bomb.y - this.player.y);
        if (dist < bomb.radius + this.player.radius * 0.8) {
          this.tryHurtPlayer(bomb.x, bomb.y);
        } else if (dist < 145 && this.phase === 'playing') {
          this.seagullsDodged += 1;
          this.recordProgressUpdate({ seagullsDodged: 1 });
        }
        this.fryBombs.splice(i, 1);
      }
    }
  }

  private tryHurtPlayer(sourceX: number, sourceY: number): boolean {
    const res = applyPlayerDamage({
      hp: this.hp,
      invulnTimer: this.player.invulnTimer,
      isDashing: this.player.dashTimer > 0,
    });
    if (!res.tookDamage) return false;

    this.hp = res.hp;
    this.player.invulnTimer = res.invulnTimer;
    this.playerBlinkFromHit = true;
    this.player.hitFlashTimer = 0.08;
    this.combo = 1;
    this.comboTimer = 0;
    this.hitstopTimer = 0.055;
    this.trauma = Math.min(1, this.trauma + 0.68);

    // Knockback away from seagull
    const dx = this.player.x - sourceX;
    const dy = this.player.y - sourceY;
    const len = Math.hypot(dx, dy) || 1;
    this.player.vx = (dx / len) * 260;
    this.player.vy = (dy / len) * 260;
    this.player.scaleX = 1.3;
    this.player.scaleY = 0.72;

    audio.playHit();
    emitSeagullCollisionParticles(this.particlePool, this.player.x, this.player.y, {
      knockDirX: dx / len,
      knockDirY: dy / len,
    });
    const quote = HIT_LINES[Math.floor(Math.random() * HIT_LINES.length)];
    this.spawnFloatingText(this.player.x, this.player.y - 28, quote, '#ff948d', 1.15);

    if (res.isGameOver) {
      this.pendingGameOver = true;
      this.deathDelayTimer = 0.55;
      audio.stopMusic();
      audio.playGameOver();
    }
    this.pushHudSnapshot(true);
    return true;
  }

  private finalizeGameOver(): void {
    this.pendingGameOver = false;
    this.phase = 'gameover';
    this.needsStaticRender = true;
    this.keysHeld.clear();
    this.touchActive = false;

    const rankTitle = getAnimatorRank(this.score);
    const entry: HighScoreEntry = {
      score: this.score,
      day: this.day,
      rankTitle,
      date: new Date().toLocaleDateString('pl-PL'),
    };
    const updated = updateLeaderboard(this.leaderboard, entry);
    this.leaderboard = updated.entries;
    this.bestScore = updated.bestScore;
    saveLeaderboard(this.leaderboard);
    this.onLeaderboardChange(this.leaderboard);

    this.lastStats = {
      score: this.score,
      bestScore: this.bestScore,
      isNewRecord: updated.isNewRecord,
      day: this.day,
      combo: this.combo,
      maxCombo: this.maxCombo,
      inflatablesCaught: this.inflatablesCaught,
      wafflesCollected: this.wafflesCollected,
      kidsFound: this.kidsFound,
      seagullsDodged: this.seagullsDodged,
      survivedSeconds: Math.round(this.elapsedRun),
      rankTitle,
      postcardNote: getPostcardNote({
        inflatablesCaught: this.inflatablesCaught,
        wafflesCollected: this.wafflesCollected,
        kidsFound: this.kidsFound,
        day: this.day,
      }),
    };

    this.syncBodyState();
    this.pushHudSnapshot(true);
  }

  private updateRescuedKids(dt: number): void {
    for (let i = this.rescuedKids.length - 1; i >= 0; i--) {
      const k = this.rescuedKids[i];
      k.timer -= dt;
      k.y += k.vy * dt;
      k.vy += 260 * dt;
      if (k.timer <= 0) {
        this.rescuedKids.splice(i, 1);
      }
    }
  }

  private updateParticles(dt: number): void {
    this.particlePool.update(dt);
  }

  private updateFloatingTexts(dt: number): void {
    for (const t of this.floatingTexts) {
      if (!t.active) continue;
      t.life -= dt;
      if (t.life <= 0) {
        t.active = false;
        continue;
      }
      t.y += t.vy * dt;
    }
  }

  private pushHudSnapshot(force: boolean): void {
    const weatherEventMods = getWeatherEventModifiers(this.activeWeatherEvent?.kind ?? null);
    const maxDashCooldown =
      DASH_COOLDOWN *
      getSkinDef(this.selectedSkin).dashCooldownMult *
      weatherEventMods.dashCooldownMult;
    const dashRatio = Math.max(0, Math.min(1, 1 - this.player.dashCooldown / maxDashCooldown));
    const comboRatio = this.combo > 1 ? Math.max(0, Math.min(1, this.comboTimer / COMBO_DURATION)) : 0;
    const weatherCfg = getWeatherConfig(this.weather);
    const key = [
      this.phase,
      this.score,
      this.hp,
      this.combo,
      Math.round(comboRatio * 20),
      this.day,
      Math.round(dashRatio * 10),
      Math.ceil(this.player.sugarRushTimer),
      this.inflatablesCaught,
      this.wafflesCollected,
      this.kidsFound,
      this.seagullsDodged,
      this.selectedSkin,
      this.weather,
      this.activeEvent ? `${this.activeEvent.kind}:${Math.ceil(this.activeEvent.remaining)}` : 'none',
      this.activeWeatherEvent
        ? `${this.activeWeatherEvent.kind}:${Math.ceil(this.activeWeatherEvent.remaining)}`
        : 'none',
    ].join('|');

    if (!force && key === this.lastHudKey) return;
    this.lastHudKey = key;

    this.onHudChange({
      phase: this.phase,
      score: this.score,
      bestScore: Math.max(this.bestScore, this.score),
      hp: this.hp,
      maxHp: MAX_HP,
      combo: this.combo,
      comboTimerRatio: comboRatio,
      day: this.day,
      dashReadyRatio: dashRatio,
      sugarRushRemaining: this.player.sugarRushTimer,
      inflatablesCaught: this.inflatablesCaught,
      wafflesCollected: this.wafflesCollected,
      kidsFound: this.kidsFound,
      seagullsDodged: this.seagullsDodged,
      selectedSkin: this.selectedSkin,
      weather: this.weather,
      weatherLabel: weatherCfg.label,
      weatherEffectHint: weatherCfg.effectHint,
      activeEvent: this.activeEvent ? { ...this.activeEvent } : null,
      activeWeatherEvent: this.activeWeatherEvent ? { ...this.activeWeatherEvent } : null,
      lastStats: this.lastStats,
    });
  }

  // ==================== RENDERING ====================

  private getBlendedPalette() {
    const a = getWeatherConfig(this.prevWeather);
    const b = getWeatherConfig(this.weather);
    const t = this.weatherBlend;
    return {
      seaDeep: lerpHexColor(a.seaDeep, b.seaDeep, t),
      seaShallow: lerpHexColor(a.seaShallow, b.seaShallow, t),
      seaHighlight: lerpHexColor(a.seaHighlight, b.seaHighlight, t),
      sandWet: lerpHexColor(a.sandWet, b.sandWet, t),
      sandBase: lerpHexColor(a.sandBase, b.sandBase, t),
      sandSpeck: lerpHexColor(a.sandSpeck, b.sandSpeck, t),
      grassEdge: lerpHexColor(a.grassEdge, b.grassEdge, t),
      forestFloor: lerpHexColor(a.forestFloor, b.forestFloor, t),
      ambientOverlay: b.ambientOverlay,
    };
  }

  private render(): void {
    const ctx = this.ctx;
    const pal = this.getBlendedPalette();
    ctx.save();
    ctx.scale(this.dpr, this.dpr);
    ctx.imageSmoothingEnabled = false;

    // Full-bleed weather-reactive background fill so zero black bars ever appear
    ctx.fillStyle = pal.seaDeep;
    ctx.fillRect(0, 0, this.viewW, this.viewH * 0.35);
    ctx.fillStyle = pal.sandBase;
    ctx.fillRect(0, this.viewH * 0.35, this.viewW, this.viewH * 0.45);
    ctx.fillStyle = pal.forestFloor;
    ctx.fillRect(0, this.viewH * 0.8, this.viewW, this.viewH * 0.25);

    // Camera shake using trauma^2
    const shakeAmt = this.trauma * this.trauma * 13;
    const shakeX = shakeAmt > 0.1 ? (Math.random() - 0.5) * 2 * shakeAmt : 0;
    const shakeY = shakeAmt > 0.1 ? (Math.random() - 0.5) * 2 * shakeAmt : 0;

    ctx.translate(this.viewW / 2 + shakeX, this.viewH / 2 + shakeY);
    ctx.scale(this.camScale, this.camScale);
    ctx.translate(-this.camX, -this.camY);

    this.drawResortBackdrop(ctx, pal);
    this.drawTowelsAndBoardwalk(ctx);
    this.drawObstacles(ctx);
    this.drawWaffles(ctx);
    this.drawBushes(ctx);
    this.drawInflatables(ctx);
    this.drawFryBombs(ctx);
    this.drawPlayer(ctx);
    this.drawRescuedKids(ctx);
    this.drawForestForegroundTrees(ctx);
    this.drawSeagulls(ctx);
    this.drawParticles(ctx);
    this.drawWindEffects(ctx);
    this.drawWeatherAtmosphere(ctx, pal);
    this.drawFloatingTexts(ctx);

    ctx.restore();

    // Subtle peripheral red vignette when at 1 HP during active play
    if (this.phase === 'playing' && this.hp === 1) {
      const pulse = 0.22 + Math.sin(this.worldTime * 7) * 0.08;
      const grad = ctx.createRadialGradient(
        this.viewW * this.dpr * 0.5,
        this.viewH * this.dpr * 0.5,
        Math.min(this.viewW, this.viewH) * this.dpr * 0.32,
        this.viewW * this.dpr * 0.5,
        this.viewH * this.dpr * 0.5,
        Math.max(this.viewW, this.viewH) * this.dpr * 0.65,
      );
      grad.addColorStop(0, 'rgba(220, 38, 38, 0)');
      grad.addColorStop(1, `rgba(220, 38, 38, ${pulse})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.viewW * this.dpr, this.viewH * this.dpr);
    }
  }

  private drawResortBackdrop(
    ctx: CanvasRenderingContext2D,
    pal: ReturnType<RusalkaGameEngine['getBlendedPalette']>,
  ): void {
    const ext = 320;
    // 1. 16-bit Multi-Tone Baltic Sea with organic undulating depth bands
    ctx.fillStyle = pal.seaDeep;
    ctx.fillRect(-ext, -ext, WORLD_WIDTH + ext * 2, SEA_SHORELINE_Y + ext - 46);

    const seaMid = lerpHexColor(pal.seaDeep, pal.seaShallow, 0.52);
    ctx.fillStyle = seaMid;
    ctx.fillRect(-ext, SEA_SHORELINE_Y - 54, WORLD_WIDTH + ext * 2, 24);

    // Organic 16-bit stepped wave edge between deep & mid sea
    for (let dx = -ext; dx < WORLD_WIDTH + ext; dx += 24) {
      const step = Math.round(Math.sin(dx * 0.04 + this.worldTime * 1.4) * 3);
      ctx.fillStyle = seaMid;
      ctx.fillRect(dx, SEA_SHORELINE_Y - 58 + step, 14, 4);
      ctx.fillRect(dx + 4, SEA_SHORELINE_Y - 60 + step, 6, 2);
    }

    ctx.fillStyle = pal.seaShallow;
    ctx.fillRect(-ext, SEA_SHORELINE_Y - 32, WORLD_WIDTH + ext * 2, 34);

    // Organic 16-bit stepped wave edge between mid & shallow sea
    for (let dx = -ext; dx < WORLD_WIDTH + ext; dx += 28) {
      const step = Math.round(Math.cos(dx * 0.035 + this.worldTime * 1.8) * 3);
      ctx.fillStyle = pal.seaShallow;
      ctx.fillRect(dx, SEA_SHORELINE_Y - 36 + step, 16, 4);
    }

    // Animated 16-bit wave crests & shimmering sun/sunset specular glints
    const waveShift = Math.sin(this.worldTime * 2.2) * 8;
    for (let x = -ext; x < WORLD_WIDTH + ext; x += 48) {
      const yOff = Math.round(Math.sin(this.worldTime * 2.5 + x * 0.03) * 4);
      ctx.fillStyle = pal.seaHighlight;
      ctx.fillRect(x, 34 + yOff, 24, 4);
      ctx.fillRect(x + 6, 32 + yOff, 10, 2);
      ctx.fillRect(x + 18, 64 - yOff, 22, 4);

      // Sunlit / golden sunset diamond sparkles on the water
      if (this.weather === 'sunny' || this.weather === 'sunset') {
        const glint = Math.sin(this.worldTime * 5.2 + x * 0.09);
        if (glint > 0.55) {
          ctx.fillStyle = this.weather === 'sunset' ? '#ffe0a3' : '#fffef9';
          ctx.fillRect(x + 12, 48 + yOff, 6, 2);
          ctx.fillRect(x + 14, 46 + yOff, 2, 6);
        }
      }
    }

    // 2. 16-bit Wet Shoreline, Seafoam Lace & Textured Golden Sand
    ctx.fillStyle = pal.sandWet;
    ctx.fillRect(-ext, SEA_SHORELINE_Y - 2, WORLD_WIDTH + ext * 2, 26);

    ctx.fillStyle = pal.sandBase;
    ctx.fillRect(-ext, SEA_SHORELINE_Y + 22, WORLD_WIDTH + ext * 2, FOREST_LINE_Y - SEA_SHORELINE_Y - 20);

    // Gentle organic stepped wet-to-dry shoreline scallops
    const sandBlend = lerpHexColor(pal.sandWet, pal.sandBase, 0.5);
    for (let dx = -ext; dx < WORLD_WIDTH + ext; dx += 32) {
      const wave = Math.round(Math.sin(dx * 0.03) * 3);
      ctx.fillStyle = sandBlend;
      ctx.fillRect(dx, SEA_SHORELINE_Y + 18 + wave, 22, 4);
      ctx.fillStyle = pal.sandBase;
      ctx.fillRect(dx + 4, SEA_SHORELINE_Y + 20 + wave, 14, 4);
    }

    // Subtle 16-bit sunlit sand dune ripples & warm speckles
    const sandLight = lerpHexColor(pal.sandBase, '#fffef9', 0.38);
    for (let sx = 20; sx < WORLD_WIDTH - 20; sx += 64) {
      for (let sy = SEA_SHORELINE_Y + 38; sy < FOREST_LINE_Y - 16; sy += 46) {
        const jx = ((sx * 17 + sy * 13) % 28) - 14;
        const jy = ((sx * 7 + sy * 29) % 18) - 9;
        ctx.fillStyle = pal.sandSpeck;
        ctx.fillRect(sx + jx, sy + jy, 6, 3);
        ctx.fillStyle = sandLight;
        ctx.fillRect(sx + jx + 2, sy + jy - 2, 8, 2);
      }
    }

    // 16-bit starfish & seashells resting on the sand
    for (const d of BEACH_DECOR) {
      const sp = d.kind === 'starfish' ? this.atlas.starfish : this.atlas.shell;
      ctx.drawImage(sp, d.x, d.y);
    }

    // Two-tone 16-bit undulating seafoam edge (aqua under-shadow + crisp white crest)
    for (let x = -ext; x < WORLD_WIDTH + ext; x += 20) {
      const foamY = Math.round(
        SEA_SHORELINE_Y - 4 + Math.sin(x * 0.05 + this.worldTime * 3.1) * 4 + waveShift * 0.25,
      );
      ctx.fillStyle = pal.seaHighlight;
      ctx.fillRect(x - 2, foamY + 4, 18, 4);
      ctx.fillStyle = '#fffef9';
      ctx.fillRect(x, foamY, 16, 5);
    }

    // 16-bit Shaded Baltic Buoy with water reflection ripple
    const buoyY = 48 + Math.round(Math.sin(this.worldTime * 3.2) * 3);
    ctx.fillStyle = pal.seaHighlight;
    ctx.fillRect(686, buoyY + 15, 24, 3);
    ctx.fillStyle = '#132030';
    ctx.fillRect(690, buoyY - 2, 16, 18);
    ctx.fillStyle = '#f25757';
    ctx.fillRect(692, buoyY, 12, 8);
    ctx.fillStyle = '#ffa69e';
    ctx.fillRect(693, buoyY + 1, 4, 5);
    ctx.fillStyle = '#fffef9';
    ctx.fillRect(692, buoyY + 8, 12, 6);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(700, buoyY + 8, 4, 6);

    // 3. 16-bit Pine Forest Meadow Edge & Deep Pine Floor
    const grassHighlight = lerpHexColor(pal.grassEdge, '#d8f3dc', 0.32);
    ctx.fillStyle = pal.grassEdge;
    ctx.fillRect(-ext, FOREST_LINE_Y - 8, WORLD_WIDTH + ext * 2, 16);
    ctx.fillStyle = pal.forestFloor;
    ctx.fillRect(-ext, FOREST_LINE_Y + 6, WORLD_WIDTH + ext * 2, WORLD_HEIGHT - FOREST_LINE_Y + ext);

    // Layered 16-bit grass tufts & wildflowers along forest border
    for (let gx = -ext; gx < WORLD_WIDTH + ext; gx += 24) {
      const gy = FOREST_LINE_Y - 12 + ((gx * 3) % 6);
      ctx.fillStyle = pal.forestFloor;
      ctx.fillRect(gx, gy + 4, 14, 4);
      ctx.fillStyle = pal.grassEdge;
      ctx.fillRect(gx, gy, 12, 5);
      ctx.fillStyle = grassHighlight;
      ctx.fillRect(gx + 2, gy - 2, 6, 3);
    }

    // Subtle pine needle dither patches on the forest floor
    const forestDeep = lerpHexColor(pal.forestFloor, '#0b1c15', 0.42);
    ctx.fillStyle = forestDeep;
    for (let fx = 16; fx < WORLD_WIDTH - 16; fx += 44) {
      for (let fy = FOREST_LINE_Y + 18; fy < WORLD_HEIGHT - 12; fy += 34) {
        const ox = (fx * 11 + fy * 7) % 18;
        ctx.fillRect(fx + ox, fy, 8, 3);
        ctx.fillRect(fx + ox + 4, fy + 4, 6, 2);
      }
    }

    // Subtle amber sky tint during Seagull Raid
    if (this.activeEvent?.kind === 'seagull_raid') {
      ctx.fillStyle = 'rgba(249, 115, 22, 0.14)';
      ctx.fillRect(-ext, -ext, WORLD_WIDTH + ext * 2, WORLD_HEIGHT + ext * 2);
    }
  }

  private drawTowelsAndBoardwalk(ctx: CanvasRenderingContext2D): void {
    // 16-bit Shaded Wooden Boardwalk ("kładka do O.W. Rusałka") with grain, bevels & nails
    const bx = 458;
    // Soft sand shadow under boardwalk
    ctx.fillStyle = 'rgba(19, 32, 48, 0.16)';
    ctx.fillRect(bx + 4, 148, 46, 250);

    for (let y = 148; y < 396; y += 16) {
      ctx.fillStyle = '#132030';
      ctx.fillRect(bx - 1, y - 1, 48, 14);
      ctx.fillStyle = '#cfa06b'; // Sunlit top bevel
      ctx.fillRect(bx, y, 46, 3);
      ctx.fillStyle = '#9c6638'; // Mid wood plank
      ctx.fillRect(bx, y + 3, 46, 7);
      ctx.fillStyle = '#613a1c'; // Bottom edge shadow
      ctx.fillRect(bx, y + 10, 46, 2);
      // Nail heads & wood grain pixel
      ctx.fillStyle = '#475569';
      ctx.fillRect(bx + 4, y + 5, 2, 2);
      ctx.fillRect(bx + 40, y + 5, 2, 2);
      ctx.fillStyle = '#7c4c26';
      ctx.fillRect(bx + 14 + ((y * 3) % 14), y + 5, 8, 2);
    }

    // OW Rusałka Waffle Hut perched cleanly at the boardwalk entrance
    const hutX = 430;
    const hutY = 418;
    // Cast shadow beneath hut
    ctx.fillStyle = 'rgba(19, 32, 48, 0.28)';
    ctx.fillRect(hutX + 6, hutY + this.atlas.waffleHut.height - 4, this.atlas.waffleHut.width - 4, 8);
    ctx.drawImage(this.atlas.waffleHut, hutX, hutY);

    // 16-bit Beveled Wooden Sign above hut (preserving user's "O.W. RUSAŁKA" branding!)
    ctx.fillStyle = '#132030';
    ctx.fillRect(hutX + 10, hutY - 20, 84, 18);
    ctx.fillStyle = '#fff8b8';
    ctx.fillRect(hutX + 12, hutY - 18, 80, 3);
    ctx.fillStyle = '#f7d459';
    ctx.fillRect(hutX + 12, hutY - 15, 80, 9);
    ctx.fillStyle = '#d99b26';
    ctx.fillRect(hutX + 12, hutY - 6, 80, 2);
    ctx.fillStyle = '#132030';
    ctx.font = 'bold 10px "Pixelify Sans", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('O.W. RUSAŁKA', hutX + 52, hutY - 8);

    // 16-bit Shaded Beach Umbrellas with canopy highlight & cast shadow
    for (const u of UMBRELLA_PROPS) {
      ctx.fillStyle = 'rgba(19, 32, 48, 0.24)';
      ctx.beginPath();
      ctx.arc(u.x + 7, u.y + 9, 23, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#132030';
      ctx.beginPath();
      ctx.arc(u.x, u.y, 24, 0, Math.PI * 2);
      ctx.fill();

      for (let seg = 0; seg < 6; seg++) {
        const isBottomShade = seg === 1 || seg === 2;
        ctx.fillStyle = seg % 2 === 0 ? (isBottomShade ? u.shade : u.c1) : u.c2;
        ctx.beginPath();
        ctx.moveTo(u.x, u.y);
        ctx.arc(u.x, u.y, 21, (seg * Math.PI) / 3, ((seg + 1) * Math.PI) / 3);
        ctx.closePath();
        ctx.fill();
      }
      // Top specular sheen + brass finial
      ctx.fillStyle = 'rgba(255, 254, 249, 0.28)';
      ctx.beginPath();
      ctx.arc(u.x - 5, u.y - 6, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#132030';
      ctx.fillRect(u.x - 4, u.y - 4, 8, 8);
      ctx.fillStyle = '#f7d459';
      ctx.fillRect(u.x - 3, u.y - 3, 6, 6);
      ctx.fillStyle = '#fff8b8';
      ctx.fillRect(u.x - 3, u.y - 3, 3, 3);
    }

    // 16-bit Shaded Beach Towels with fringed ends
    for (const t of TOWEL_PROPS) {
      ctx.fillStyle = 'rgba(19, 32, 48, 0.16)';
      ctx.fillRect(t.x + 2, t.y + 2, t.w + 2, t.h + 2);
      ctx.fillStyle = '#132030';
      ctx.fillRect(t.x - 2, t.y - 2, t.w + 4, t.h + 4);
      ctx.fillStyle = t.a;
      ctx.fillRect(t.x, t.y, t.w, t.h);
      ctx.fillStyle = t.b;
      ctx.fillRect(t.x + 6, t.y, 6, t.h);
      ctx.fillRect(t.x + 20, t.y, 6, t.h);
      // Fabric highlight along top edge & shadow along bottom
      ctx.fillStyle = 'rgba(255, 254, 249, 0.35)';
      ctx.fillRect(t.x, t.y, t.w, 3);
      ctx.fillStyle = 'rgba(19, 32, 48, 0.2)';
      ctx.fillRect(t.x, t.y + t.h - 3, t.w, 3);
    }
  }

  private drawObstacles(ctx: CanvasRenderingContext2D): void {
    // 16-bit Iconic Polish Baltic Parawany with top bevel, fabric fold shading & wooden stakes
    for (const obs of this.obstacles) {
      // Soft ground shadow
      ctx.fillStyle = 'rgba(19, 32, 48, 0.24)';
      ctx.fillRect(obs.x + 5, obs.y + obs.h - 1, obs.w, 8);

      // Ink outline
      ctx.fillStyle = '#132030';
      ctx.fillRect(obs.x - 2, obs.y - 2, obs.w + 4, obs.h + 4);

      const stripeW = 12;
      for (let sx = 0; sx < obs.w; sx += stripeW) {
        const w = Math.min(stripeW, obs.w - sx);
        ctx.fillStyle = Math.floor(sx / stripeW) % 2 === 0 ? obs.stripeColorA : obs.stripeColorB;
        ctx.fillRect(obs.x + sx, obs.y, w, obs.h);
      }

      // 16-bit sunlit top edge & bottom fold shadow on fabric
      ctx.fillStyle = 'rgba(255, 254, 249, 0.32)';
      ctx.fillRect(obs.x, obs.y, obs.w, 3);
      ctx.fillStyle = 'rgba(19, 32, 48, 0.22)';
      ctx.fillRect(obs.x, obs.y + obs.h - 4, obs.w, 4);

      // Wooden stakes with sunlit highlights
      const poles = [obs.x - 1, obs.x + Math.floor(obs.w / 2) - 2, obs.x + obs.w - 3];
      for (const px of poles) {
        ctx.fillStyle = '#132030';
        ctx.fillRect(px - 1, obs.y - 7, 7, obs.h + 12);
        ctx.fillStyle = '#613a1c';
        ctx.fillRect(px, obs.y - 6, 5, obs.h + 10);
        ctx.fillStyle = '#cfa06b';
        ctx.fillRect(px + 1, obs.y - 5, 2, obs.h + 6);
        ctx.fillStyle = '#fff8b8';
        ctx.fillRect(px + 1, obs.y - 5, 2, 2);
      }
    }
  }

  private drawWaffles(ctx: CanvasRenderingContext2D): void {
    for (const w of this.waffles) {
      // Blink gently when about to expire
      if (w.life < 2.5 && Math.floor(w.life * 8) % 2 === 0) continue;

      const bob = Math.round(Math.sin(w.bobPhase) * 3);
      const sprite = w.isGolden ? this.atlas.goldenWaffle : this.atlas.waffle;

      // Ground shadow
      ctx.fillStyle = 'rgba(22, 38, 56, 0.25)';
      ctx.fillRect(Math.round(w.x - 14), Math.round(w.y + 10), 28, 6);

      // Golden glow ring
      if (w.isGolden) {
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(w.x, w.y + bob, 20 + Math.sin(this.worldTime * 8) * 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.drawImage(sprite, Math.round(w.x - sprite.width / 2), Math.round(w.y - sprite.height / 2 + bob));
    }
  }

  private drawBushes(ctx: CanvasRenderingContext2D): void {
    for (const b of this.bushes) {
      const shakeX = b.hasKid ? Math.round(Math.sin(b.gigglePhase * 2.4) * 3) : 0;
      const sprite = b.hasKid ? this.atlas.bushPeek : this.atlas.bushIdle;
      ctx.drawImage(
        sprite,
        Math.round(b.x - sprite.width / 2 + shakeX),
        Math.round(b.y - sprite.height / 2),
      );

      if (b.hasKid) {
        // Exclamation bubble & giggle text!
        const pulseY = Math.round(Math.sin(this.worldTime * 7 + b.id) * 3);
        const bx = Math.round(b.x);
        const by = Math.round(b.y - 36 + pulseY);

        ctx.fillStyle = '#162638';
        ctx.fillRect(bx - 52, by - 14, 104, 18);
        ctx.fillStyle = '#fffdf7';
        ctx.fillRect(bx - 50, by - 12, 100, 14);
        ctx.fillStyle = '#162638';
        ctx.font = 'bold 10px "Pixelify Sans", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(b.giggleText, bx, by - 1);

        // Kid timer bar (only during active play, strictly clamped [0..1])
        if (this.phase === 'playing') {
          const ratio = Math.max(0, Math.min(1, b.kidTimer / b.kidMaxTimer));
          ctx.fillStyle = '#162638';
          ctx.fillRect(bx - 22, Math.round(b.y + 18), 44, 6);
          ctx.fillStyle = ratio > 0.35 ? '#f4d35e' : '#f25f5c';
          ctx.fillRect(bx - 20, Math.round(b.y + 20), Math.round(40 * ratio), 2);
        }
      }
    }
  }

  private drawInflatables(ctx: CanvasRenderingContext2D): void {
    const isStrongWind = this.activeWeatherEvent?.kind === 'strong_wind';
    const windDir = this.activeWeatherEvent?.windDir ?? 1;
    for (const inf of this.inflatables) {
      const sprite =
        inf.kind === 'flamingo'
          ? this.atlas.flamingo
          : inf.kind === 'unicorn'
            ? this.atlas.unicorn
            : this.atlas.croc;

      const bob = Math.round(Math.sin(inf.bobPhase) * (isStrongWind ? 6 : 4));
      ctx.save();
      ctx.translate(Math.round(inf.x), Math.round(inf.y + bob));

      if (inf.caught) {
        const s = 1 + (0.24 - inf.koTimer) * 2.2;
        ctx.globalAlpha = Math.max(0, inf.koTimer / 0.24);
        ctx.scale(s, s);
      } else {
        // Ground shadow
        ctx.fillStyle = 'rgba(22, 38, 56, 0.22)';
        ctx.fillRect(-16, 16 - bob, 32, 6);

        // Wind-streak trail behind windswept inflatables during Silny Wiatr!
        if (isStrongWind) {
          const trailSide = windDir > 0 ? -1 : 1;
          ctx.fillStyle = 'rgba(255, 254, 249, 0.72)';
          ctx.fillRect(trailSide * 22 - (trailSide > 0 ? 0 : 14), -8, 14, 3);
          ctx.fillStyle = 'rgba(247, 212, 89, 0.65)';
          ctx.fillRect(trailSide * 24 - (trailSide > 0 ? 0 : 18), 2, 18, 2);
        }

        if (inf.vx < 0) {
          ctx.scale(-1, 1);
        }
      }

      ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
      ctx.restore();
    }
  }

  private drawFryBombs(ctx: CanvasRenderingContext2D): void {
    for (const bomb of this.fryBombs) {
      const t = Math.min(1, bomb.timer / bomb.duration);
      // Red/yellow dashed target ring telegraph on beach
      ctx.save();
      ctx.strokeStyle = t > 0.72 ? '#ef4444' : '#f97316';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(bomb.x, bomb.y, bomb.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = `rgba(239, 68, 68, ${0.12 + t * 0.24})`;
      ctx.beginPath();
      ctx.arc(bomb.x, bomb.y, bomb.radius * t, 0, Math.PI * 2);
      ctx.fill();

      // Falling fry carton
      const curY = bomb.startY + (bomb.y - bomb.startY) * (t * t);
      const sp = this.atlas.fryBomb;
      ctx.drawImage(sp, Math.round(bomb.x - sp.width / 2), Math.round(curY - sp.height / 2));
      ctx.restore();
    }
  }

  private drawPlayer(ctx: CanvasRenderingContext2D): void {
    const p = this.player;
    const isHitBlinking =
      this.playerBlinkFromHit && p.invulnTimer > 0 && Math.floor(this.worldTime * 16) % 2 === 0;
    if (p.invulnTimer <= 0) {
      this.playerBlinkFromHit = false;
    }

    // Sugar rush golden aura
    if (p.sugarRushTimer > 0) {
      ctx.save();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y + 4, 24 + Math.sin(this.worldTime * 14) * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Diegetic dash cooldown arc under animator's feet (gaze routing!)
    if (this.phase === 'playing' && p.dashCooldown > 0) {
      const weatherMods = getWeatherEventModifiers(this.activeWeatherEvent?.kind ?? null);
      const maxDashCd =
        DASH_COOLDOWN * getSkinDef(this.selectedSkin).dashCooldownMult * weatherMods.dashCooldownMult;
      const ratio = Math.max(0, Math.min(1, 1 - p.dashCooldown / maxDashCd));
      ctx.save();
      ctx.strokeStyle = 'rgba(22, 38, 56, 0.45)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y + 20, 18, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#f4d35e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y + 20, 18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
      ctx.stroke();
      ctx.restore();
    }

    // Shadow
    ctx.fillStyle = 'rgba(22, 38, 56, 0.28)';
    ctx.fillRect(Math.round(p.x - 14), Math.round(p.y + 18), 28, 7);

    const walkStep = Math.floor(p.walkDist / 16) % 2;
    const skinSprites = this.atlas.animatorSkins[this.selectedSkin] ?? this.atlas.animatorSkins.boy;
    const sprite =
      p.dashTimer > 0 ? skinSprites.dash : walkStep === 0 ? skinSprites.walkA : skinSprites.walkB;

    const bobY = Math.hypot(p.vx, p.vy) > 15 ? Math.round(Math.sin(p.walkDist * 0.25) * 2) : 0;

    ctx.save();
    ctx.translate(Math.round(p.x), Math.round(p.y + bobY));
    ctx.scale((p.facingX < 0 ? -1 : 1) * p.scaleX, p.scaleY);

    if (isHitBlinking) {
      ctx.globalAlpha = 0.45;
    }

    ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);

    // Lightweight crisp hit-flash ring without expensive software ctx.filter
    if (p.hitFlashTimer > 0) {
      ctx.fillStyle = 'rgba(255, 253, 247, 0.72)';
      ctx.fillRect(-16, -20, 32, 38);
    }
    ctx.restore();
  }

  private drawRescuedKids(ctx: CanvasRenderingContext2D): void {
    const sp = this.atlas.kidHappy;
    for (const k of this.rescuedKids) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, k.timer * 1.4);
      ctx.drawImage(sp, Math.round(k.x - sp.width / 2), Math.round(k.y - sp.height / 2));
      ctx.restore();
    }
  }

  private drawForestForegroundTrees(ctx: CanvasRenderingContext2D): void {
    const sp = this.atlas.pineTree;
    const heavyWind =
      this.activeEvent?.kind === 'baltic_gale' ||
      this.activeWeatherEvent?.kind === 'strong_wind';
    const windDir = this.activeWeatherEvent?.windDir ?? 1;
    for (const t of TREE_POSITIONS) {
      const freq = heavyWind ? 6.5 : 1.8;
      const amp = heavyWind ? 4.5 : 1;
      const bias = heavyWind ? windDir * 3 : 0;
      const sway = Math.round(Math.sin(this.worldTime * freq + t.x * 0.05) * amp + bias);
      ctx.drawImage(sp, Math.round(t.x - sp.width / 2 + sway), Math.round(t.y - sp.height / 2));
    }
  }

  private drawSeagulls(ctx: CanvasRenderingContext2D): void {
    const isStormSlowed = this.activeWeatherEvent?.kind === 'thunderstorm';
    for (const g of this.seagulls) {
      // Draw telegraph target ring and sight line BEFORE diving!
      if (g.state === 'telegraph') {
        const pulse = 0.5 + 0.5 * Math.sin(this.worldTime * 28);
        ctx.save();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(g.x, g.y);
        ctx.lineTo(g.targetX, g.targetY);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(g.targetX, g.targetY, 24 + pulse * 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
        ctx.beginPath();
        ctx.arc(g.targetX, g.targetY, 22, 0, Math.PI * 2);
        ctx.fill();

        // Warning exclamation
        ctx.fillStyle = '#fffdf7';
        ctx.font = 'bold 14px "Pixelify Sans", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('! KRA !', g.x, g.y - 22);
        ctx.restore();
      }

      // Ground shadow under flying seagull
      const altOffset = g.state === 'dive' ? 18 : 34;
      ctx.fillStyle = 'rgba(22, 38, 56, 0.22)';
      ctx.fillRect(Math.round(g.x - 14), Math.round(g.y + altOffset), 28, 6);

      const flapUp = Math.sin(g.wingPhase) >= 0;
      let sprite = flapUp ? this.atlas.seagullDiverUp : this.atlas.seagullDiverDown;
      if (g.kind === 'flanker') {
        sprite = flapUp ? this.atlas.seagullFlankerUp : this.atlas.seagullFlankerDown;
      } else if (g.kind === 'queen') {
        sprite = flapUp ? this.atlas.seagullQueenUp : this.atlas.seagullQueenDown;
      }

      ctx.save();
      ctx.translate(Math.round(g.x), Math.round(g.y));
      if (g.vx < 0) ctx.scale(-1, 1);
      if (g.kind === 'queen') ctx.scale(1.22, 1.22);
      ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);

      // During Thunderstorm, draw 16-bit electric static sparks around slowed seagulls!
      if (isStormSlowed) {
        const sparkOff = Math.round(Math.sin(this.worldTime * 16 + g.id) * 4);
        ctx.fillStyle = '#6ce5f0';
        ctx.fillRect(-16 + sparkOff, -16, 4, 4);
        ctx.fillRect(14 - sparkOff, -12, 4, 4);
        ctx.fillStyle = '#f7d459';
        ctx.fillRect(-10 - sparkOff, -20, 3, 6);
        ctx.fillRect(8 + sparkOff, -18, 3, 5);
      }
      ctx.restore();
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D): void {
    drawPixelParticles(ctx, this.particlePool);
  }

  private drawWindEffects(ctx: CanvasRenderingContext2D): void {
    const isStrongWind =
      this.activeWeatherEvent?.kind === 'strong_wind' ||
      this.activeEvent?.kind === 'baltic_gale';
    const isSeaBreeze = this.activeWeatherEvent?.kind === 'sea_breeze';
    if (!isStrongWind && !isSeaBreeze) return;

    ctx.save();
    if (isStrongWind) {
      const dir = this.activeWeatherEvent?.windDir ?? 1;
      for (let i = 0; i < 24; i++) {
        const speed = 460 + (i % 4) * 95;
        const rawX = (this.worldTime * speed * dir + i * 131) % (WORLD_WIDTH + 220);
        const wx = ((rawX + (WORLD_WIDTH + 220)) % (WORLD_WIDTH + 220)) - 110;
        const wy = ((i * 73 + this.worldTime * 42) % (WORLD_HEIGHT - 110)) + 75;
        const len = 36 + (i % 3) * 18;
        ctx.fillStyle = i % 3 === 0 ? 'rgba(247, 212, 89, 0.55)' : 'rgba(255, 254, 249, 0.62)';
        ctx.fillRect(Math.round(wx), Math.round(wy), len, 3);
        ctx.fillStyle = 'rgba(108, 229, 240, 0.42)';
        ctx.fillRect(Math.round(wx + (dir > 0 ? -12 : len)), Math.round(wy - 3), 16, 2);
      }
    } else if (isSeaBreeze) {
      for (let i = 0; i < 16; i++) {
        const bx = ((i * 97 + Math.sin(this.worldTime * 2 + i) * 36) % (WORLD_WIDTH - 40)) + 20;
        const by = ((this.worldTime * 150 + i * 67) % (WORLD_HEIGHT - 110)) + 70;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(108, 229, 240, 0.52)' : 'rgba(140, 224, 138, 0.48)';
        ctx.fillRect(Math.round(bx), Math.round(by), 4, 4);
        ctx.fillRect(Math.round(bx + 4), Math.round(by + 4), 2, 2);
      }
    }
    ctx.restore();
  }

  private drawWeatherAtmosphere(
    ctx: CanvasRenderingContext2D,
    pal: ReturnType<RusalkaGameEngine['getBlendedPalette']>,
  ): void {
    const ext = 320;
    const fogStrength = this.getCurrentFogStrength();
    const rainIntensity = this.getCurrentRainIntensity();

    ctx.save();

    // Subtle atmospheric color wash (sunny warmth, sunset glow, stormy cool)
    ctx.fillStyle = pal.ambientOverlay;
    ctx.fillRect(-ext, -ext, WORLD_WIDTH + ext * 2, WORLD_HEIGHT + ext * 2);

    // 1. Sunny Beach Warm Sunbeam Motes
    if (this.weather === 'sunny' && this.weatherBlend > 0.35) {
      ctx.fillStyle = 'rgba(255, 248, 184, 0.28)';
      for (let i = 0; i < 10; i++) {
        const mx = ((i * 113 + this.worldTime * 22) % (WORLD_WIDTH - 60)) + 30;
        const my = ((i * 71 + Math.sin(this.worldTime * 1.6 + i) * 28) % 360) + 110;
        ctx.fillRect(Math.round(mx), Math.round(my), 4, 4);
      }
    }

    // 2. Baltic Rain Squall — angled 16-bit rain streaks & puddle splash rings
    if (rainIntensity > 0.05) {
      ctx.fillStyle = `rgba(186, 230, 253, ${0.62 * rainIntensity})`;
      for (let i = 0; i < 32; i++) {
        const rx =
          (((i * 113 - this.worldTime * 210) % (WORLD_WIDTH + 220)) + (WORLD_WIDTH + 220)) %
            (WORLD_WIDTH + 220) -
          80;
        const ry = ((i * 71 + this.worldTime * 540) % (WORLD_HEIGHT + 120)) - 60;
        ctx.fillRect(Math.round(rx), Math.round(ry), 2, 12);
        ctx.fillRect(Math.round(rx - 2), Math.round(ry + 10), 2, 6);
      }

      // Batched 16-bit pixel rain splashes on the beach
      ctx.fillStyle = `rgba(224, 242, 254, ${0.52 * rainIntensity})`;
      for (let s = 0; s < 10; s++) {
        const phase = (this.worldTime * 2.6 + s * 0.43) % 1;
        const sx = ((s * 173 + 60) % (WORLD_WIDTH - 100)) + 50;
        const sy = ((s * 91 + 130) % (FOREST_LINE_Y - 140)) + 120;
        const rad = Math.round(3 + phase * 7);
        const ry = Math.round(rad * 0.5);
        // Crisp 4-edge pixel splash ring
        ctx.fillRect(sx - rad, sy - ry, rad * 2, 2);
        ctx.fillRect(sx - rad, sy + ry, rad * 2, 2);
        ctx.fillRect(sx - rad, sy - ry, 2, ry * 2 + 2);
        ctx.fillRect(sx + rad - 2, sy - ry, 2, ry * 2 + 2);
      }
    }

    // 3. Baltic Fog — fast 16-bit stepped drifting fog banks + visibility frame around animator!
    if (fogStrength > 0.04) {
      // Drifting layered pixel-stepped mist banks
      for (let i = 0; i < 14; i++) {
        const speed = i % 2 === 0 ? 28 : 19;
        const fx = ((this.worldTime * speed + i * 165) % (WORLD_WIDTH + 340)) - 200;
        const fy = 30 + (i * 49) % (WORLD_HEIGHT - 60);
        const fw = 160 + (i % 3) * 56;
        const fh = 34 + (i % 2) * 18;
        ctx.fillStyle = `rgba(224, 238, 244, ${0.26 * fogStrength})`;
        ctx.fillRect(Math.round(fx), Math.round(fy), fw, fh);
        ctx.fillStyle = `rgba(241, 248, 250, ${0.22 * fogStrength})`;
        ctx.fillRect(Math.round(fx + 20), Math.round(fy - 10), fw - 40, fh - 8);
      }

      // Lightweight 16-bit concentric stepped mist rings (zero expensive full-canvas gradient!)
      const focusX = this.phase === 'playing' ? this.player.x : WORLD_WIDTH / 2;
      const focusY = this.phase === 'playing' ? this.player.y : 310;
      const rings = [
        { r: 175, alpha: 0.24 },
        { r: 255, alpha: 0.34 },
        { r: 345, alpha: 0.32 },
      ];
      for (const ring of rings) {
        ctx.fillStyle = `rgba(194, 216, 224, ${ring.alpha * fogStrength})`;
        ctx.beginPath();
        ctx.rect(-ext, -ext, WORLD_WIDTH + ext * 2, WORLD_HEIGHT + ext * 2);
        ctx.arc(focusX, focusY, ring.r, 0, Math.PI * 2, true);
        ctx.fill('evenodd');
      }
    }

    // 4. Dynamic Weather Event: Thunderstorm dark indigo cast + 16-bit jagged lightning bolts!
    if (this.activeWeatherEvent?.kind === 'thunderstorm') {
      ctx.fillStyle = 'rgba(13, 24, 46, 0.34)';
      ctx.fillRect(-ext, -ext, WORLD_WIDTH + ext * 2, WORLD_HEIGHT + ext * 2);

      // Storm cloud bank rolling across top shoreline
      for (let c = 0; c < 8; c++) {
        const cx = ((c * 155 + this.worldTime * 18) % (WORLD_WIDTH + 220)) - 110;
        const cy = 6 + (c % 2) * 10;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(Math.round(cx), cy, 118, 22);
        ctx.fillStyle = '#334155';
        ctx.fillRect(Math.round(cx + 12), cy - 8, 86, 14);
      }

      if (this.lightningFlash > 0.02) {
        ctx.fillStyle = `rgba(219, 244, 255, ${this.lightningFlash * 0.5})`;
        ctx.fillRect(-ext, -ext, WORLD_WIDTH + ext * 2, WORLD_HEIGHT + ext * 2);
      }

      if (this.lightningBolt && this.lightningBolt.length > 1) {
        // Outer cyan glow stroke
        ctx.strokeStyle = '#6ce5f0';
        ctx.lineWidth = 8;
        ctx.lineJoin = 'miter';
        ctx.beginPath();
        ctx.moveTo(this.lightningBolt[0].x, this.lightningBolt[0].y);
        for (let i = 1; i < this.lightningBolt.length; i++) {
          ctx.lineTo(this.lightningBolt[i].x, this.lightningBolt[i].y);
        }
        ctx.stroke();

        // Crisp inner electric gold/white bolt core
        ctx.strokeStyle = '#fff8b8';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(this.lightningBolt[0].x, this.lightningBolt[0].y);
        for (let i = 1; i < this.lightningBolt.length; i++) {
          ctx.lineTo(this.lightningBolt[i].x, this.lightningBolt[i].y);
        }
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  private drawFloatingTexts(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.textAlign = 'center';
    for (const t of this.floatingTexts) {
      if (!t.active) continue;
      const alpha = Math.min(1, (t.life / t.maxLife) * 1.6);
      ctx.globalAlpha = alpha;
      const fontSize = Math.round(16 * t.scale);
      ctx.font = `700 ${fontSize}px "Pixelify Sans", monospace`;
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#162638';
      ctx.strokeText(t.text, Math.round(t.x), Math.round(t.y));
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, Math.round(t.x), Math.round(t.y));
    }
    ctx.restore();
  }
}
