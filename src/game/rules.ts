import type {
  AchievementDef,
  AchievementId,
  AnimatorSkinDef,
  AnimatorSkinId,
  ChaosEventKind,
  DifficultyProfile,
  HighScoreEntry,
  InflatableKind,
  PlayerProgress,
  SeagullKind,
  WeatherConfig,
  WeatherEventDef,
  WeatherEventKind,
  WeatherEventModifiers,
  WeatherKind,
} from './types';

export const WORLD_WIDTH = 960;
export const WORLD_HEIGHT = 600;

export const SEA_SHORELINE_Y = 104;
export const FOREST_LINE_Y = 474;

export const MAX_HP = 4;
export const MAX_COMBO = 8;
export const COMBO_DURATION = 5.5;
export const DASH_COOLDOWN = 1.65;
export const DASH_DURATION = 0.22;
export const INVULN_AFTER_HIT = 1.35;

export const BASE_POINTS = {
  flamingo: 150,
  croc: 180,
  unicorn: 260,
  waffle: 100,
  goldenWaffle: 220,
  kid: 320,
} as const;

export function getInflatableBasePoints(kind: InflatableKind): number {
  return BASE_POINTS[kind];
}

export function calculatePickupScore(
  basePoints: number,
  combo: number,
  eventBonusMult = 1,
): number {
  const clampedCombo = Math.max(1, Math.min(MAX_COMBO, Math.floor(combo)));
  return Math.round(basePoints * clampedCombo * eventBonusMult);
}

export function advanceCombo(currentCombo: number): number {
  return Math.min(MAX_COMBO, Math.max(1, currentCombo + 1));
}

export function getDifficultyForTime(elapsedSeconds: number): DifficultyProfile {
  const t = Math.max(0, elapsedSeconds);
  const day = Math.floor(t / 25) + 1;

  // Friendly 12s opening ramp so players settle into controls before chaos peaks.
  const openingFactor = t < 12 ? 0.72 + (t / 12) * 0.28 : 1;
  const escalation = Math.min(2.2, 1 + (day - 1) * 0.16);

  const allowedSeagulls: SeagullKind[] = ['diver'];
  if (day >= 2 || t >= 20) {
    allowedSeagulls.push('flanker');
  }
  if (day >= 3 || t >= 48) {
    allowedSeagulls.push('queen');
  }

  return {
    day,
    inflatableSpeedMult: Number((openingFactor * (1 + (day - 1) * 0.12)).toFixed(3)),
    seagullSpeedMult: Number((openingFactor * (1 + (day - 1) * 0.11)).toFixed(3)),
    inflatableSpawnInterval: Math.max(1.35, 3.1 - (day - 1) * 0.22),
    seagullSpawnInterval: Math.max(1.8, 4.4 - (day - 1) * 0.35),
    waffleSpawnInterval: Math.max(2.2, 3.8 - (day - 1) * 0.12),
    kidSpawnInterval: Math.max(5.5, 9.2 - (day - 1) * 0.4),
    maxSeagulls: Math.min(7, 2 + Math.floor(day * 0.85)),
    maxAttackTokens: Math.min(3, day >= 4 ? 3 : 2),
    allowedSeagulls,
  };
}

export function applyPlayerDamage(params: {
  hp: number;
  invulnTimer: number;
  isDashing: boolean;
  damage?: number;
}): {
  hp: number;
  invulnTimer: number;
  tookDamage: boolean;
  isGameOver: boolean;
} {
  const { hp, invulnTimer, isDashing, damage = 1 } = params;
  if (hp <= 0 || invulnTimer > 0 || isDashing) {
    return {
      hp: Math.max(0, hp),
      invulnTimer,
      tookDamage: false,
      isGameOver: hp <= 0,
    };
  }
  const nextHp = Math.max(0, hp - damage);
  return {
    hp: nextHp,
    invulnTimer: INVULN_AFTER_HIT,
    tookDamage: true,
    isGameOver: nextHp <= 0,
  };
}

export function applyWaffleHeal(hp: number, isGolden: boolean, wafflesCollected: number): number {
  if (hp <= 0) return 0;
  if (isGolden || (wafflesCollected > 0 && wafflesCollected % 6 === 0)) {
    return Math.min(MAX_HP, hp + 1);
  }
  return hp;
}

export function canAcquireAttackToken(activeTelegraphs: number, maxTokens: number): boolean {
  return activeTelegraphs < Math.max(1, maxTokens);
}

export function getAnimatorRank(score: number): string {
  if (score >= 9000) return 'Legendarny Animator Rusałki';
  if (score >= 5000) return 'Pogromca Mew Bałtyckich';
  if (score >= 2500) return 'Mistrz Gofrów z Łazów';
  if (score >= 1000) return 'Łapacz Flamingów';
  return 'Praktykant od Parawanów';
}

export function getPostcardNote(stats: {
  inflatablesCaught: number;
  wafflesCollected: number;
  kidsFound: number;
  day: number;
}): string {
  if (stats.kidsFound >= 6) {
    return 'Wszystkie dzieciaki wróciły z sosnowego lasu prosto na dyskotekę w Rusałce!';
  }
  if (stats.wafflesCollected >= 12) {
    return 'Budka z goframi w Łazach ogłosiła rekord bitej śmietany na metr kwadratowy.';
  }
  if (stats.inflatablesCaught >= 12) {
    return 'Ani jeden różowy flaming nie dopłynął dziś do Szwecji. Dobra robota!';
  }
  if (stats.day >= 4) {
    return 'Mewy złożyły oficjalną skargę do kierownika ośrodka — frytki były zbyt szybkie.';
  }
  return 'Pozdrowienia z OW Rusałka w Łazach! Bałtyk ma 18 stopni, ale animacje grzeją na 100%.';
}

export function updateLeaderboard(
  existing: HighScoreEntry[],
  candidate: HighScoreEntry,
  maxEntries = 5,
): { entries: HighScoreEntry[]; isNewRecord: boolean; bestScore: number } {
  const prevBest = existing.length > 0 ? Math.max(...existing.map((e) => e.score)) : 0;
  const isNewRecord = candidate.score > 0 && candidate.score > prevBest;
  const merged = candidate.score > 0 ? [...existing, candidate] : [...existing];
  merged.sort((a, b) => b.score - a.score || b.day - a.day);
  const trimmed = merged.slice(0, maxEntries);
  const bestScore = trimmed.length > 0 ? trimmed[0].score : 0;
  return { entries: trimmed, isNewRecord, bestScore };
}

export const CHAOS_EVENT_META: Record<
  ChaosEventKind,
  { title: string; subtitle: string; duration: number }
> = {
  parawan_invasion: {
    title: 'INWAZJA PARAWANÓW!',
    subtitle: 'Wczasowicze o 5:00 rano obstawili całą plażę!',
    duration: 11,
  },
  seagull_raid: {
    title: 'NALOT GŁODNYCH MEW!',
    subtitle: 'Chroń frytki — lecą złote gofry!',
    duration: 10,
  },
  baltic_gale: {
    title: 'HALNY NAD BAŁTYKIEM!',
    subtitle: 'Dmuchańce uciekają szybciej, ale dają ×2 pkt!',
    duration: 11,
  },
  waffle_rain: {
    title: 'EKSPLOZJA BUDKI Z GOFRAMI!',
    subtitle: 'Deszcz bitej śmietany na terenie Rusałki!',
    duration: 9,
  },
  hide_and_seek: {
    title: 'WIELKIE CHOWANE W LESIE!',
    subtitle: 'Dzieciaki rozpierzchły się po sosnach — szukaj!',
    duration: 12,
  },
};

export function circleIntersectsRect(
  cx: number,
  cy: number,
  radius: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
): boolean {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < radius * radius;
}

export function resolveCircleRectPush(
  cx: number,
  cy: number,
  radius: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
): { x: number; y: number } {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  const distSq = dx * dx + dy * dy;

  if (distSq >= radius * radius) {
    return { x: cx, y: cy };
  }

  if (distSq > 0.0001) {
    const dist = Math.sqrt(distSq);
    const push = radius - dist;
    return {
      x: cx + (dx / dist) * push,
      y: cy + (dy / dist) * push,
    };
  }

  // Circle center is inside the rect — push out along shallowest axis
  const leftPen = Math.abs(cx - rx);
  const rightPen = Math.abs(rx + rw - cx);
  const topPen = Math.abs(cy - ry);
  const bottomPen = Math.abs(ry + rh - cy);
  const minPen = Math.min(leftPen, rightPen, topPen, bottomPen);

  if (minPen === leftPen) return { x: rx - radius, y: cy };
  if (minPen === rightPen) return { x: rx + rw + radius, y: cy };
  if (minPen === topPen) return { x: cx, y: ry - radius };
  return { x: cx, y: ry + rh + radius };
}

export const WEATHER_CYCLE: WeatherKind[] = ['sunny', 'fog', 'sunset', 'rain'];

export const WEATHER_CONFIGS: Record<WeatherKind, WeatherConfig> = {
  sunny: {
    kind: 'sunny',
    label: 'Słoneczna Plaża',
    effectHint: 'Tempo +18%',
    announceText: 'SŁONECZNY UPAŁ! TEMPO +18%',
    speedMult: 1.18,
    scoreMult: 1,
    fogStrength: 0,
    rainIntensity: 0,
    seaDeep: '#0a5e82',
    seaShallow: '#1497bc',
    seaHighlight: '#72e3f0',
    sandWet: '#dfb86d',
    sandBase: '#f7e4b2',
    sandSpeck: '#e2c179',
    grassEdge: '#52b788',
    forestFloor: '#245c44',
    ambientOverlay: 'rgba(255, 240, 170, 0.06)',
  },
  fog: {
    kind: 'fog',
    label: 'Mgła na Bałtyku',
    effectHint: 'Tempo -14% · Mgła',
    announceText: 'MGŁA NAD BAŁTYKIEM! OGRANICZONA WIDOCZNOŚĆ',
    speedMult: 0.86,
    scoreMult: 1.1,
    fogStrength: 0.78,
    rainIntensity: 0,
    seaDeep: '#335968',
    seaShallow: '#588291',
    seaHighlight: '#b7d4dc',
    sandWet: '#b7b6a1',
    sandBase: '#d6d4c1',
    sandSpeck: '#b8b6a3',
    grassEdge: '#5c8c78',
    forestFloor: '#2d4d42',
    ambientOverlay: 'rgba(205, 228, 236, 0.22)',
  },
  rain: {
    kind: 'rain',
    label: 'Letni Szkwał',
    effectHint: 'Tempo +8% · Deszcz',
    announceText: 'BAŁTYCKI SZKWAŁ! ŚLISKI PIASEK +8%',
    speedMult: 1.08,
    scoreMult: 1.15,
    fogStrength: 0.22,
    rainIntensity: 1,
    seaDeep: '#133c59',
    seaShallow: '#216184',
    seaHighlight: '#79b2cc',
    sandWet: '#a98c5b',
    sandBase: '#cbb07c',
    sandSpeck: '#a88c5c',
    grassEdge: '#397d60',
    forestFloor: '#1a4232',
    ambientOverlay: 'rgba(25, 62, 92, 0.2)',
  },
  sunset: {
    kind: 'sunset',
    label: 'Złoty Zachód',
    effectHint: 'Tempo +12% · +10% pkt',
    announceText: 'ZŁOTY ZACHÓD SŁOŃCA! TEMPO +12%',
    speedMult: 1.12,
    scoreMult: 1.1,
    fogStrength: 0,
    rainIntensity: 0,
    seaDeep: '#3b376e',
    seaShallow: '#8a4c70',
    seaHighlight: '#ffad70',
    sandWet: '#c9885b',
    sandBase: '#f0bc84',
    sandSpeck: '#d49563',
    grassEdge: '#4d7c59',
    forestFloor: '#243c35',
    ambientOverlay: 'rgba(255, 138, 76, 0.14)',
  },
};

export function getWeatherConfig(kind: WeatherKind): WeatherConfig {
  return WEATHER_CONFIGS[kind];
}

export function getNextWeather(current: WeatherKind): WeatherKind {
  const idx = WEATHER_CYCLE.indexOf(current);
  return WEATHER_CYCLE[(idx + 1) % WEATHER_CYCLE.length];
}

export function parseWeatherParam(raw: string | null): WeatherKind | null {
  if (raw === 'sunny' || raw === 'fog' || raw === 'rain' || raw === 'sunset') {
    return raw;
  }
  return null;
}

export const NEUTRAL_WEATHER_EVENT_MODIFIERS: WeatherEventModifiers = {
  seagullSpeedMult: 1,
  inflatableSpeedMult: 1,
  inflatableCatchRadiusMult: 1,
  inflatableScoreMult: 1,
  windForceX: 0,
  windForceY: 0,
  playerWindPushX: 0,
  playerSpeedMult: 1,
  dashCooldownMult: 1,
  rainBoost: 0,
  lightningEnabled: false,
};

export const WEATHER_EVENT_KINDS: WeatherEventKind[] = [
  'thunderstorm',
  'strong_wind',
  'sea_breeze',
];

export const WEATHER_EVENT_DEFS: Record<WeatherEventKind, WeatherEventDef> = {
  thunderstorm: {
    kind: 'thunderstorm',
    title: 'BURZA Z PIORUNAMI!',
    subtitle: 'Błyskawice płoszą stado — mewy spowolnione o 45%!',
    effectBadge: 'MEWY -45% PRĘDKOŚCI',
    duration: 11,
    accentColor: '#6ce5f0',
    modifiers: {
      seagullSpeedMult: 0.55,
      inflatableSpeedMult: 1,
      inflatableCatchRadiusMult: 1,
      inflatableScoreMult: 1.15,
      windForceX: 16,
      windForceY: -10,
      playerWindPushX: 0,
      playerSpeedMult: 1,
      dashCooldownMult: 1,
      rainBoost: 0.9,
      lightningEnabled: true,
    },
  },
  strong_wind: {
    kind: 'strong_wind',
    title: 'SILNY WIATR!',
    subtitle: 'Porywisty sztorm znosi dmuchańce — trudniej je złapać!',
    effectBadge: 'DMUCHAŃCE +48% · MNIEJSZY ZASIĘG · ×1.5 PKT',
    duration: 11,
    accentColor: '#f7d459',
    modifiers: {
      seagullSpeedMult: 1.05,
      inflatableSpeedMult: 1.48,
      inflatableCatchRadiusMult: 0.78,
      inflatableScoreMult: 1.5,
      windForceX: 118,
      windForceY: -66,
      playerWindPushX: 44,
      playerSpeedMult: 0.96,
      dashCooldownMult: 1,
      rainBoost: 0.15,
      lightningEnabled: false,
    },
  },
  sea_breeze: {
    kind: 'sea_breeze',
    title: 'ORZEŹWIAJĄCA BRYZA!',
    subtitle: 'Rześki wiatr znad Bałtyku dodaje skrzydeł animatorowi!',
    effectBadge: 'BIEG +18% · SZYBSZY ZRYW',
    duration: 10,
    accentColor: '#52b788',
    modifiers: {
      seagullSpeedMult: 0.95,
      inflatableSpeedMult: 0.92,
      inflatableCatchRadiusMult: 1.08,
      inflatableScoreMult: 1.1,
      windForceX: 0,
      windForceY: 12,
      playerWindPushX: 0,
      playerSpeedMult: 1.18,
      dashCooldownMult: 0.8,
      rainBoost: 0,
      lightningEnabled: false,
    },
  },
};

export function getWeatherEventDef(kind: WeatherEventKind): WeatherEventDef {
  return WEATHER_EVENT_DEFS[kind];
}

export function getWeatherEventModifiers(
  kind: WeatherEventKind | null,
): WeatherEventModifiers {
  if (!kind) return NEUTRAL_WEATHER_EVENT_MODIFIERS;
  return WEATHER_EVENT_DEFS[kind].modifiers;
}

export function pickRandomWeatherEvent(
  lastKind: WeatherEventKind | null,
  rng: () => number = Math.random,
): WeatherEventKind {
  // Weight thunderstorm & strong_wind highest so players frequently feel both signature events
  const weightedPool: WeatherEventKind[] = [
    'thunderstorm',
    'thunderstorm',
    'strong_wind',
    'strong_wind',
    'sea_breeze',
  ];
  const candidates = lastKind
    ? weightedPool.filter((k) => k !== lastKind)
    : weightedPool;
  const idx = Math.min(candidates.length - 1, Math.max(0, Math.floor(rng() * candidates.length)));
  return candidates[idx];
}

export function parseWeatherEventParam(raw: string | null): WeatherEventKind | null {
  if (raw === 'thunderstorm' || raw === 'strong_wind' || raw === 'sea_breeze') {
    return raw;
  }
  return null;
}

export function lerpHexColor(hexA: string, hexB: string, t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const a = parseInt(hexA.slice(1), 16);
  const b = parseInt(hexB.slice(1), 16);
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;

  const rr = Math.round(ar + (br - ar) * clamped);
  const rg = Math.round(ag + (bg - ag) * clamped);
  const rb = Math.round(ab + (bb - ab) * clamped);
  return `#${((1 << 24) + (rr << 16) + (rg << 8) + rb).toString(16).slice(1)}`;
}

export const ANIMATOR_SKINS: AnimatorSkinDef[] = [
  {
    id: 'boy',
    name: 'Chłopak',
    tagline: 'Klasyczny animator Rusałki w żółtej czapce i turkusowym polo.',
    bonusLabel: 'Zbalansowane tempo plażowe',
    moveSpeedMult: 1,
    pickupRadiusMult: 1,
    dashCooldownMult: 1,
    starter: true,
    unlockHint: 'Dostępna na start',
  },
  {
    id: 'girl',
    name: 'Dziewczyna',
    tagline: 'Energiczna animatorka plażowa z kokardką i koralowymi szortami.',
    bonusLabel: 'Zbalansowane tempo plażowe',
    moveSpeedMult: 1,
    pickupRadiusMult: 1,
    dashCooldownMult: 1,
    starter: true,
    unlockHint: 'Dostępna na start',
  },
  {
    id: 'lifeguard',
    name: 'Ratownik',
    tagline: 'Elitarny ratownik z Łazów — błyskawicznie zgarnia dmuchańce i gofry.',
    bonusLabel: 'Bonus: +15% prędkości zbierania · +28% zasięgu · szybszy zryw',
    moveSpeedMult: 1.15,
    pickupRadiusMult: 1.28,
    dashCooldownMult: 0.82,
    starter: false,
    requiredAchievementId: 'score_5000',
    requiredRunScore: 5000,
    unlockHint: 'Zdobądź 5 000 pkt w jednym podejściu',
  },
  {
    id: 'waffle_chef',
    name: 'Mistrz Gofrownicy',
    tagline: 'Czapka kucharska i złoty fartuch prosto z budki O.W. Rusałka.',
    bonusLabel: 'Bonus: +12% zasięgu zbierania gofrów i dmuchańców',
    moveSpeedMult: 1.03,
    pickupRadiusMult: 1.12,
    dashCooldownMult: 0.96,
    starter: false,
    requiredAchievementId: 'waffle_master',
    unlockHint: 'Odblokuj osiągnięcie „Mistrz Gofrowy” (15 gofrów)',
  },
  {
    id: 'captain',
    name: 'Kapitan Bałtyku',
    tagline: 'Czapka kapitańska ze złotą kotwicą i marynarski sweter w paski.',
    bonusLabel: 'Bonus: +8% prędkości ruchu i -12% odnowienia zrywu',
    moveSpeedMult: 1.08,
    pickupRadiusMult: 1.05,
    dashCooldownMult: 0.88,
    starter: false,
    requiredAchievementId: 'seagull_slayer',
    unlockHint: 'Odblokuj osiągnięcie „Pogromca Mew” (8 uników przed mewami)',
  },
];

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_catch',
    title: 'Pierwszy Flaming!',
    description: 'Złap swojego pierwszego uciekającego dmuchańca.',
    target: 1,
    statKey: 'totalInflatables',
    iconKind: 'flamingo',
  },
  {
    id: 'score_5000',
    title: 'Ratownik Roku!',
    description: 'Zdobądź 5 000 punktów w jednym podejściu na plaży Rusałki.',
    target: 5000,
    statKey: 'bestScore',
    iconKind: 'lifeguard',
    rewardSkinId: 'lifeguard',
  },
  {
    id: 'waffle_master',
    title: 'Mistrz Gofrowy',
    description: 'Zbierz łącznie 15 bałtyckich gofrów z bitą śmietaną.',
    target: 15,
    statKey: 'totalWaffles',
    iconKind: 'waffle',
    rewardSkinId: 'waffle_chef',
  },
  {
    id: 'seagull_slayer',
    title: 'Pogromca Mew',
    description: 'Uniknij 8 ataków pikujących mew lub bomb frytkowych.',
    target: 8,
    statKey: 'totalSeagullsDodged',
    iconKind: 'seagull',
    rewardSkinId: 'captain',
  },
  {
    id: 'inflatable_hunter',
    title: 'Łowca Dmuchańców',
    description: 'Złap łącznie 10 uciekających dmuchańców zanim odpłyną do Szwecji.',
    target: 10,
    statKey: 'totalInflatables',
    iconKind: 'flamingo',
  },
  {
    id: 'forest_scout',
    title: 'Harcerz Sosnowy',
    description: 'Odnajdź łącznie 5 dzieciaków ukrytych w sosnowym lesie.',
    target: 5,
    statKey: 'totalKids',
    iconKind: 'kid',
  },
  {
    id: 'combo_king',
    title: 'Król Wakacyjnego Chaosu',
    description: 'Osiągnij kombo ×5 podczas jednego turnusu w Rusałce.',
    target: 5,
    statKey: 'bestCombo',
    iconKind: 'trophy',
  },
];

export function createDefaultProgress(): PlayerProgress {
  return {
    selectedSkin: 'boy',
    unlockedAchievements: [],
    totalInflatables: 0,
    totalWaffles: 0,
    totalKids: 0,
    totalSeagullsDodged: 0,
    bestCombo: 1,
    bestScore: 0,
  };
}

export function getSkinDef(id: AnimatorSkinId): AnimatorSkinDef {
  return ANIMATOR_SKINS.find((s) => s.id === id) ?? ANIMATOR_SKINS[0];
}

export function parseSkinParam(raw: string | null): AnimatorSkinId | null {
  if (
    raw === 'boy' ||
    raw === 'girl' ||
    raw === 'lifeguard' ||
    raw === 'waffle_chef' ||
    raw === 'captain'
  ) {
    return raw;
  }
  return null;
}

export function isSkinUnlocked(
  id: AnimatorSkinId,
  unlockedAchievements: AchievementId[],
  bestRunScore = 0,
): boolean {
  const def = getSkinDef(id);
  if (def.starter) return true;
  if (def.requiredRunScore !== undefined && bestRunScore >= def.requiredRunScore) {
    return true;
  }
  if (def.requiredAchievementId && unlockedAchievements.includes(def.requiredAchievementId)) {
    return true;
  }
  return !def.requiredAchievementId && def.requiredRunScore === undefined;
}

export function getUnlockedSkinIds(
  unlockedAchievements: AchievementId[],
  bestRunScore = 0,
): AnimatorSkinId[] {
  return ANIMATOR_SKINS.filter((s) =>
    isSkinUnlocked(s.id, unlockedAchievements, bestRunScore),
  ).map((s) => s.id);
}

export function resolveSelectedSkin(
  desired: AnimatorSkinId,
  unlockedAchievements: AchievementId[],
  bestRunScore = 0,
): AnimatorSkinId {
  return isSkinUnlocked(desired, unlockedAchievements, bestRunScore) ? desired : 'boy';
}

export function getAchievementProgressValue(
  def: AchievementDef,
  progress: PlayerProgress,
): number {
  return Math.max(0, progress[def.statKey]);
}

export function evaluateNewAchievements(progress: PlayerProgress): {
  newlyUnlocked: AchievementDef[];
  nextProgress: PlayerProgress;
} {
  const already = new Set<AchievementId>(progress.unlockedAchievements);
  const newlyUnlocked: AchievementDef[] = [];

  for (const def of ACHIEVEMENTS) {
    if (already.has(def.id)) continue;
    if (getAchievementProgressValue(def, progress) >= def.target) {
      already.add(def.id);
      newlyUnlocked.push(def);
    }
  }

  if (newlyUnlocked.length === 0) {
    return { newlyUnlocked, nextProgress: progress };
  }

  return {
    newlyUnlocked,
    nextProgress: {
      ...progress,
      unlockedAchievements: Array.from(already),
    },
  };
}


