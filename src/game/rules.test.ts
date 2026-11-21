import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACHIEVEMENTS,
  ANIMATOR_SKINS,
  MAX_COMBO,
  MAX_HP,
  WEATHER_CYCLE,
  advanceCombo,
  applyPlayerDamage,
  applyWaffleHeal,
  calculatePickupScore,
  canAcquireAttackToken,
  circleIntersectsRect,
  createDefaultProgress,
  evaluateNewAchievements,
  getAnimatorRank,
  getDifficultyForTime,
  getNextWeather,
  getSkinDef,
  getUnlockedSkinIds,
  getWeatherConfig,
  getWeatherEventDef,
  getWeatherEventModifiers,
  isSkinUnlocked,
  lerpHexColor,
  parseSkinParam,
  parseWeatherEventParam,
  parseWeatherParam,
  pickRandomWeatherEvent,
  resolveCircleRectPush,
  resolveSelectedSkin,
  updateLeaderboard,
} from './rules';

test('scoring applies combo multiplier and event bonus cleanly', () => {
  assert.equal(calculatePickupScore(150, 1), 150);
  assert.equal(calculatePickupScore(150, 3), 450);
  assert.equal(calculatePickupScore(150, 4, 2), 1200);
  // Clamps above MAX_COMBO
  assert.equal(calculatePickupScore(100, 99), 100 * MAX_COMBO);
});

test('advanceCombo increments up to MAX_COMBO', () => {
  assert.equal(advanceCombo(1), 2);
  assert.equal(advanceCombo(MAX_COMBO), MAX_COMBO);
});

test('difficulty ramp starts approachable and escalates across multiple knobs', () => {
  const early = getDifficultyForTime(3);
  const mid = getDifficultyForTime(30);
  const late = getDifficultyForTime(80);

  assert.equal(early.day, 1);
  assert.deepEqual(early.allowedSeagulls, ['diver']);
  assert.ok(early.seagullSpeedMult < 1);

  assert.equal(mid.day, 2);
  assert.ok(mid.allowedSeagulls.includes('flanker'));
  assert.ok(mid.inflatableSpawnInterval < early.inflatableSpawnInterval);

  assert.ok(late.day >= 4);
  assert.ok(late.allowedSeagulls.includes('queen'));
  assert.ok(late.maxSeagulls > early.maxSeagulls);
  assert.ok(late.seagullSpeedMult > mid.seagullSpeedMult);
});

test('player damage respects invulnerability, dash i-frames, and reachable game over', () => {
  const dashProtected = applyPlayerDamage({ hp: 4, invulnTimer: 0, isDashing: true });
  assert.equal(dashProtected.tookDamage, false);
  assert.equal(dashProtected.hp, 4);

  const invulnProtected = applyPlayerDamage({ hp: 3, invulnTimer: 0.5, isDashing: false });
  assert.equal(invulnProtected.tookDamage, false);
  assert.equal(invulnProtected.hp, 3);

  const hit = applyPlayerDamage({ hp: 2, invulnTimer: 0, isDashing: false });
  assert.equal(hit.tookDamage, true);
  assert.equal(hit.hp, 1);
  assert.equal(hit.isGameOver, false);
  assert.ok(hit.invulnTimer > 0);

  const lethal = applyPlayerDamage({ hp: 1, invulnTimer: 0, isDashing: false });
  assert.equal(lethal.tookDamage, true);
  assert.equal(lethal.hp, 0);
  assert.equal(lethal.isGameOver, true);
});

test('waffle healing restores HP on golden waffles or every 6th waffle without exceeding MAX_HP', () => {
  assert.equal(applyWaffleHeal(2, true, 1), 3);
  assert.equal(applyWaffleHeal(MAX_HP, true, 1), MAX_HP);
  assert.equal(applyWaffleHeal(2, false, 6), 3);
  assert.equal(applyWaffleHeal(2, false, 5), 2);
});

test('attack token pool caps simultaneous telegraphing seagulls', () => {
  assert.equal(canAcquireAttackToken(0, 2), true);
  assert.equal(canAcquireAttackToken(1, 2), true);
  assert.equal(canAcquireAttackToken(2, 2), false);
});

test('leaderboard sorts descending, flags new record, and keeps top 5', () => {
  const existing = [
    { score: 2400, day: 3, rankTitle: getAnimatorRank(2400), date: '2026-07-01' },
    { score: 1200, day: 2, rankTitle: getAnimatorRank(1200), date: '2026-07-01' },
  ];
  const res = updateLeaderboard(existing, {
    score: 5200,
    day: 5,
    rankTitle: getAnimatorRank(5200),
    date: '2026-07-02',
  });
  assert.equal(res.isNewRecord, true);
  assert.equal(res.bestScore, 5200);
  assert.equal(res.entries[0].score, 5200);
  assert.equal(res.entries[0].rankTitle, 'Pogromca Mew Bałtyckich');
});

test('circle-rect obstacle collision and resolution push cleanly outside parawan', () => {
  assert.equal(circleIntersectsRect(105, 110, 12, 100, 100, 40, 20), true);
  const pushed = resolveCircleRectPush(105, 95, 12, 100, 100, 40, 20);
  assert.ok(pushed.y <= 88.01);
  assert.equal(circleIntersectsRect(pushed.x, pushed.y, 11.9, 100, 100, 40, 20), false);
});

test('weather system configures distinct speed, fog, rain, and cycles cleanly', () => {
  const sunny = getWeatherConfig('sunny');
  const fog = getWeatherConfig('fog');
  const rain = getWeatherConfig('rain');
  const sunset = getWeatherConfig('sunset');

  assert.ok(sunny.speedMult > 1.1);
  assert.equal(sunny.fogStrength, 0);

  assert.ok(fog.speedMult < 1);
  assert.ok(fog.fogStrength >= 0.7);

  assert.ok(rain.rainIntensity > 0.5);
  assert.ok(rain.speedMult > 1);

  assert.ok(sunset.speedMult > 1);
  assert.ok(sunset.scoreMult > 1);

  // Full cycle returns to start
  let cur = WEATHER_CYCLE[0];
  for (let i = 0; i < WEATHER_CYCLE.length; i++) {
    cur = getNextWeather(cur);
  }
  assert.equal(cur, WEATHER_CYCLE[0]);

  assert.equal(parseWeatherParam('fog'), 'fog');
  assert.equal(parseWeatherParam('invalid'), null);
});

test('lerpHexColor smoothly blends 16-bit palette endpoints', () => {
  assert.equal(lerpHexColor('#000000', '#ffffff', 0), '#000000');
  assert.equal(lerpHexColor('#000000', '#ffffff', 1), '#ffffff');
  assert.equal(lerpHexColor('#000000', '#ffffff', 0.5), '#808080');
});

test('starter animator skins boy and girl are unlocked immediately while milestone skins stay locked', () => {
  assert.ok(ANIMATOR_SKINS.length >= 5);
  assert.deepEqual(getUnlockedSkinIds([]), ['boy', 'girl']);
  assert.equal(isSkinUnlocked('boy', []), true);
  assert.equal(isSkinUnlocked('girl', []), true);
  assert.equal(isSkinUnlocked('lifeguard', []), false);
  assert.equal(isSkinUnlocked('waffle_chef', []), false);
  assert.equal(isSkinUnlocked('captain', []), false);

  assert.equal(resolveSelectedSkin('girl', []), 'girl');
  assert.equal(resolveSelectedSkin('captain', []), 'boy');
  assert.equal(parseSkinParam('girl'), 'girl');
  assert.equal(parseSkinParam('unknown'), null);
});

test('achievement evaluation unlocks Mistrz Gofrowy, Pogromca Mew, and linked skins without duplicates', () => {
  assert.ok(ACHIEVEMENTS.some((a) => a.title === 'Mistrz Gofrowy'));
  assert.ok(ACHIEVEMENTS.some((a) => a.title === 'Pogromca Mew'));

  const base = createDefaultProgress();
  const afterRun = {
    ...base,
    totalInflatables: 1,
    totalWaffles: 15,
    totalSeagullsDodged: 8,
  };

  const firstEval = evaluateNewAchievements(afterRun);
  const unlockedIds = firstEval.newlyUnlocked.map((a) => a.id);
  assert.ok(unlockedIds.includes('first_catch'));
  assert.ok(unlockedIds.includes('waffle_master'));
  assert.ok(unlockedIds.includes('seagull_slayer'));

  assert.equal(isSkinUnlocked('waffle_chef', firstEval.nextProgress.unlockedAchievements), true);
  assert.equal(isSkinUnlocked('captain', firstEval.nextProgress.unlockedAchievements), true);
  assert.equal(isSkinUnlocked('lifeguard', firstEval.nextProgress.unlockedAchievements), false);
  assert.equal(resolveSelectedSkin('captain', firstEval.nextProgress.unlockedAchievements), 'captain');

  // Re-evaluating the same progress yields zero duplicate unlocks
  const secondEval = evaluateNewAchievements(firstEval.nextProgress);
  assert.equal(secondEval.newlyUnlocked.length, 0);
});

test('Ratownik unlocks at 5000 points in a single run and grants unique collection-speed bonuses', () => {
  const boy = getSkinDef('boy');
  const lifeguard = getSkinDef('lifeguard');
  assert.equal(lifeguard.name, 'Ratownik');
  assert.ok(lifeguard.moveSpeedMult > boy.moveSpeedMult);
  assert.ok(lifeguard.pickupRadiusMult > boy.pickupRadiusMult);
  assert.ok(lifeguard.dashCooldownMult < boy.dashCooldownMult);

  // Still locked at 4999 points
  assert.equal(isSkinUnlocked('lifeguard', [], 4999), false);
  const underEval = evaluateNewAchievements({ ...createDefaultProgress(), bestScore: 4999 });
  assert.equal(underEval.newlyUnlocked.some((a) => a.id === 'score_5000'), false);

  // Unlocks at 5000 points in a single run
  const overEval = evaluateNewAchievements({ ...createDefaultProgress(), bestScore: 5000 });
  assert.equal(overEval.newlyUnlocked.some((a) => a.id === 'score_5000'), true);
  assert.equal(isSkinUnlocked('lifeguard', overEval.nextProgress.unlockedAchievements, 5000), true);
  assert.equal(resolveSelectedSkin('lifeguard', overEval.nextProgress.unlockedAchievements, 5000), 'lifeguard');
});

test('dynamic weather events: Burza z piorunami slows seagulls and Silny wiatr makes inflatables harder to catch', () => {
  const neutral = getWeatherEventModifiers(null);
  assert.equal(neutral.seagullSpeedMult, 1);
  assert.equal(neutral.inflatableSpeedMult, 1);
  assert.equal(neutral.inflatableCatchRadiusMult, 1);

  const stormDef = getWeatherEventDef('thunderstorm');
  assert.match(stormDef.title, /BURZA Z PIORUNAMI/i);
  assert.ok(stormDef.modifiers.seagullSpeedMult <= 0.6);
  assert.equal(stormDef.modifiers.lightningEnabled, true);
  assert.ok(stormDef.modifiers.rainBoost > 0.5);

  const windDef = getWeatherEventDef('strong_wind');
  assert.match(windDef.title, /SILNY WIATR/i);
  assert.ok(windDef.modifiers.inflatableSpeedMult >= 1.4);
  assert.ok(windDef.modifiers.inflatableCatchRadiusMult <= 0.8);
  assert.ok(windDef.modifiers.windForceX > 80);
  assert.ok(windDef.modifiers.inflatableScoreMult > 1);

  const breezeDef = getWeatherEventDef('sea_breeze');
  assert.ok(breezeDef.modifiers.playerSpeedMult > 1.1);
  assert.ok(breezeDef.modifiers.dashCooldownMult < 0.9);

  // Random picker never repeats the exact same event back-to-back
  for (let i = 0; i < 10; i++) {
    const pickedAfterStorm = pickRandomWeatherEvent('thunderstorm', () => i / 10);
    assert.notEqual(pickedAfterStorm, 'thunderstorm');
    const pickedAfterWind = pickRandomWeatherEvent('strong_wind', () => i / 10);
    assert.notEqual(pickedAfterWind, 'strong_wind');
  }

  assert.equal(parseWeatherEventParam('thunderstorm'), 'thunderstorm');
  assert.equal(parseWeatherEventParam('strong_wind'), 'strong_wind');
  assert.equal(parseWeatherEventParam('sea_breeze'), 'sea_breeze');
  assert.equal(parseWeatherEventParam('invalid'), null);
});




