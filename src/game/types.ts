export type GamePhase = 'title' | 'playing' | 'paused' | 'gameover';

export type WeatherKind = 'sunny' | 'fog' | 'rain' | 'sunset';

export interface WeatherConfig {
  kind: WeatherKind;
  label: string;
  effectHint: string;
  announceText: string;
  speedMult: number;
  scoreMult: number;
  fogStrength: number; // 0 = clear, 0.8 = dense Baltic fog
  rainIntensity: number; // 0..1
  seaDeep: string;
  seaShallow: string;
  seaHighlight: string;
  sandWet: string;
  sandBase: string;
  sandSpeck: string;
  grassEdge: string;
  forestFloor: string;
  ambientOverlay: string;
}

export type WeatherEventKind = 'thunderstorm' | 'strong_wind' | 'sea_breeze';

export interface WeatherEventModifiers {
  seagullSpeedMult: number;
  inflatableSpeedMult: number;
  inflatableCatchRadiusMult: number;
  inflatableScoreMult: number;
  windForceX: number;
  windForceY: number;
  playerWindPushX: number;
  playerSpeedMult: number;
  dashCooldownMult: number;
  rainBoost: number;
  lightningEnabled: boolean;
}

export interface WeatherEventDef {
  kind: WeatherEventKind;
  title: string;
  subtitle: string;
  effectBadge: string;
  duration: number;
  accentColor: string;
  modifiers: WeatherEventModifiers;
}

export interface ActiveWeatherEvent {
  kind: WeatherEventKind;
  title: string;
  subtitle: string;
  effectBadge: string;
  remaining: number;
  duration: number;
  windDir: -1 | 1;
}

export type InflatableKind = 'flamingo' | 'unicorn' | 'croc';

export type SeagullKind = 'diver' | 'flanker' | 'queen';

export type ChaosEventKind =
  | 'parawan_invasion'
  | 'seagull_raid'
  | 'baltic_gale'
  | 'waffle_rain'
  | 'hide_and_seek';

export interface ActiveChaosEvent {
  kind: ChaosEventKind;
  title: string;
  subtitle: string;
  remaining: number;
  duration: number;
}

export type AnimatorSkinId = 'boy' | 'girl' | 'lifeguard' | 'waffle_chef' | 'captain';

export interface AnimatorSkinDef {
  id: AnimatorSkinId;
  name: string;
  tagline: string;
  bonusLabel: string;
  moveSpeedMult: number;
  pickupRadiusMult: number;
  dashCooldownMult: number;
  starter: boolean;
  requiredAchievementId?: AchievementId;
  requiredRunScore?: number;
  unlockHint: string;
}

export type AchievementId =
  | 'first_catch'
  | 'score_5000'
  | 'waffle_master'
  | 'seagull_slayer'
  | 'inflatable_hunter'
  | 'forest_scout'
  | 'combo_king';

export type AchievementIconKind = 'flamingo' | 'lifeguard' | 'waffle' | 'seagull' | 'kid' | 'trophy';

export interface AchievementDef {
  id: AchievementId;
  title: string;
  description: string;
  target: number;
  statKey:
    | 'totalInflatables'
    | 'totalWaffles'
    | 'totalSeagullsDodged'
    | 'totalKids'
    | 'bestCombo'
    | 'bestScore';
  iconKind: AchievementIconKind;
  rewardSkinId?: AnimatorSkinId;
}

export interface PlayerProgress {
  selectedSkin: AnimatorSkinId;
  unlockedAchievements: AchievementId[];
  totalInflatables: number;
  totalWaffles: number;
  totalKids: number;
  totalSeagullsDodged: number;
  bestCombo: number;
  bestScore: number;
}

export interface AchievementToast {
  id: AchievementId;
  title: string;
  description: string;
  iconKind: AchievementIconKind;
  rewardSkinName?: string;
}

export interface RunStats {
  score: number;
  bestScore: number;
  isNewRecord: boolean;
  day: number;
  combo: number;
  maxCombo: number;
  inflatablesCaught: number;
  wafflesCollected: number;
  kidsFound: number;
  seagullsDodged: number;
  survivedSeconds: number;
  rankTitle: string;
  postcardNote: string;
}

export interface HudSnapshot {
  phase: GamePhase;
  score: number;
  bestScore: number;
  hp: number;
  maxHp: number;
  combo: number;
  comboTimerRatio: number;
  day: number;
  dashReadyRatio: number;
  sugarRushRemaining: number;
  inflatablesCaught: number;
  wafflesCollected: number;
  kidsFound: number;
  seagullsDodged: number;
  selectedSkin: AnimatorSkinId;
  weather: WeatherKind;
  weatherLabel: string;
  weatherEffectHint: string;
  activeEvent: ActiveChaosEvent | null;
  activeWeatherEvent: ActiveWeatherEvent | null;
  lastStats: RunStats | null;
}

export interface HighScoreEntry {
  score: number;
  day: number;
  rankTitle: string;
  date: string;
}

export interface DifficultyProfile {
  day: number;
  inflatableSpeedMult: number;
  seagullSpeedMult: number;
  inflatableSpawnInterval: number;
  seagullSpawnInterval: number;
  waffleSpawnInterval: number;
  kidSpawnInterval: number;
  maxSeagulls: number;
  maxAttackTokens: number;
  allowedSeagulls: SeagullKind[];
}

export interface RectObstacle {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  stripeColorA: string;
  stripeColorB: string;
  temporary?: boolean;
  ttl?: number;
}

export interface BushSpot {
  id: number;
  x: number;
  y: number;
  hasKid: boolean;
  kidTimer: number;
  kidMaxTimer: number;
  kidColor: string;
  gigglePhase: number;
  giggleText: string;
  rescuedCooldown: number;
}
