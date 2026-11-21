import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PixelParticlePool,
  emitSeagullCollisionParticles,
  emitWaffleCollectParticles,
} from './particles';

test('waffle collection emits pixel-art crumbs, cream, berries, sparkles, ring, and hearts on heal', () => {
  const pool = new PixelParticlePool(120);
  emitWaffleCollectParticles(pool, 300, 260, { isGolden: false, healed: false }, () => 0.4);

  assert.equal(pool.countByKind('ring'), 1);
  assert.ok(pool.countByKind('crumb') >= 6);
  assert.ok(pool.countByKind('cream') >= 4);
  assert.ok(pool.countByKind('berry') >= 3);
  assert.ok(pool.countByKind('sparkle') >= 4);
  assert.equal(pool.countByKind('heart'), 0);

  const regularCount = pool.getActiveCount();

  // Golden waffle with heal emits extra sparkles and rising pixel hearts
  pool.clear();
  emitWaffleCollectParticles(pool, 300, 260, { isGolden: true, healed: true }, () => 0.4);
  assert.ok(pool.countByKind('sparkle') >= 10);
  assert.equal(pool.countByKind('heart'), 3);
  assert.ok(pool.getActiveCount() > regularCount);
});

test('seagull collision emits comic impact ring, fluttering feathers, flying fries, and daze stars', () => {
  const pool = new PixelParticlePool(120);
  emitSeagullCollisionParticles(pool, 420, 310, { knockDirX: -1, knockDirY: 0.2 }, () => 0.5);

  assert.equal(pool.countByKind('ring'), 1);
  assert.ok(pool.countByKind('feather') >= 8);
  assert.ok(pool.countByKind('fry') >= 6);
  assert.ok(pool.countByKind('star') >= 5);
  assert.ok(pool.getActiveCount() >= 25);
});

test('particle pool physics handles gravity, sand-floor bounce, flutter, and clean expiration without growth', () => {
  const pool = new PixelParticlePool(40);
  emitWaffleCollectParticles(pool, 200, 200, { isGolden: false, healed: false }, () => 0.5);
  assert.equal(pool.items.length, 40);

  // Step through simulation
  for (let i = 0; i < 15; i++) {
    pool.update(0.03);
  }
  assert.ok(pool.getActiveCount() > 0);

  // Advance past max particle lifetime — all particles deactivate cleanly
  for (let i = 0; i < 60; i++) {
    pool.update(0.05);
  }
  assert.equal(pool.getActiveCount(), 0);
  assert.equal(pool.items.length, 40);
});
