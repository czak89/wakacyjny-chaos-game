export type PixelParticleKind =
  | 'square'
  | 'crumb'
  | 'cream'
  | 'berry'
  | 'sparkle'
  | 'heart'
  | 'feather'
  | 'fry'
  | 'star'
  | 'ring';

export interface PixelParticle {
  active: boolean;
  kind: PixelParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  secondaryColor: string;
  outlineColor: string;
  life: number;
  maxLife: number;
  gravity: number;
  drag: number;
  groundY: number | null;
  bounce: number;
  flutterAmp: number;
  flutterFreq: number;
  flutterPhase: number;
  rotPhase: number;
  rotSpeed: number;
  ringMaxRadius: number;
}

export interface ParticleEmitParams {
  kind: PixelParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  secondaryColor?: string;
  outlineColor?: string;
  size?: number;
  maxLife?: number;
  gravity?: number;
  drag?: number;
  groundY?: number | null;
  bounce?: number;
  flutterAmp?: number;
  flutterFreq?: number;
  flutterPhase?: number;
  rotSpeed?: number;
  ringMaxRadius?: number;
}

export class PixelParticlePool {
  public readonly items: PixelParticle[];
  private cursor = 0;

  constructor(capacity = 320) {
    this.items = Array.from({ length: capacity }, () => ({
      active: false,
      kind: 'square',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 4,
      color: '#fffef9',
      secondaryColor: '#f7d459',
      outlineColor: '#132030',
      life: 0,
      maxLife: 1,
      gravity: 0,
      drag: 0,
      groundY: null,
      bounce: 0,
      flutterAmp: 0,
      flutterFreq: 0,
      flutterPhase: 0,
      rotPhase: 0,
      rotSpeed: 0,
      ringMaxRadius: 32,
    }));
  }

  public clear(): void {
    for (const p of this.items) {
      p.active = false;
    }
    this.cursor = 0;
  }

  public getActiveCount(): number {
    let count = 0;
    for (const p of this.items) {
      if (p.active) count += 1;
    }
    return count;
  }

  public countByKind(kind: PixelParticleKind): number {
    let count = 0;
    for (const p of this.items) {
      if (p.active && p.kind === kind) count += 1;
    }
    return count;
  }

  public emit(params: ParticleEmitParams): void {
    const p = this.items[this.cursor];
    this.cursor = (this.cursor + 1) % this.items.length;

    p.active = true;
    p.kind = params.kind;
    p.x = params.x;
    p.y = params.y;
    p.vx = params.vx;
    p.vy = params.vy;
    p.size = params.size ?? 4;
    p.color = params.color;
    p.secondaryColor = params.secondaryColor ?? '#fffef9';
    p.outlineColor = params.outlineColor ?? '#132030';
    p.maxLife = Math.max(0.05, params.maxLife ?? 0.5);
    p.life = p.maxLife;
    p.gravity = params.gravity ?? 180;
    p.drag = params.drag ?? 0;
    p.groundY = params.groundY ?? null;
    p.bounce = params.bounce ?? 0;
    p.flutterAmp = params.flutterAmp ?? 0;
    p.flutterFreq = params.flutterFreq ?? 0;
    p.flutterPhase = params.flutterPhase ?? 0;
    p.rotPhase = 0;
    p.rotSpeed = params.rotSpeed ?? 0;
    p.ringMaxRadius = params.ringMaxRadius ?? 34;
  }

  public update(dt: number): void {
    for (const p of this.items) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }

      if (p.kind === 'ring') {
        continue;
      }

      if (p.drag > 0) {
        const damp = Math.exp(-p.drag * dt);
        p.vx *= damp;
        p.vy *= damp;
      }

      p.vy += p.gravity * dt;
      p.flutterPhase += p.flutterFreq * dt;
      p.rotPhase += p.rotSpeed * dt;

      const flutterVx = p.flutterAmp > 0 ? Math.cos(p.flutterPhase) * p.flutterAmp : 0;
      p.x += (p.vx + flutterVx) * dt;
      p.y += p.vy * dt;

      // Crisp sand-plane bounce for crumbs and flying fries
      if (p.groundY !== null && p.y >= p.groundY && p.vy > 0) {
        p.y = p.groundY;
        if (p.bounce > 0 && p.vy > 36) {
          p.vy = -p.vy * p.bounce;
          p.vx *= 0.68;
        } else {
          p.vy = 0;
          p.vx *= 0.55;
        }
      }
    }
  }
}

export function emitWaffleCollectParticles(
  pool: PixelParticlePool,
  x: number,
  y: number,
  options: { isGolden: boolean; healed: boolean },
  rng: () => number = Math.random,
): void {
  const { isGolden, healed } = options;
  const sandFloorY = y + 18;

  // 1. Crisp expanding pixel-stepped collect ring
  pool.emit({
    kind: 'ring',
    x,
    y,
    vx: 0,
    vy: 0,
    color: isGolden ? '#fef08a' : '#fffef9',
    secondaryColor: isGolden ? '#f7d459' : '#f25757',
    size: isGolden ? 3 : 2,
    maxLife: isGolden ? 0.42 : 0.32,
    gravity: 0,
    ringMaxRadius: isGolden ? 48 : 34,
  });

  // 2. Crispy golden waffle crumbs with sand-bounce physics
  const crumbCount = isGolden ? 10 : 7;
  for (let i = 0; i < crumbCount; i++) {
    const ang = (Math.PI * 2 * i) / crumbCount + (rng() - 0.5) * 0.45;
    const speed = (isGolden ? 115 : 88) + rng() * 75;
    pool.emit({
      kind: 'crumb',
      x: x + (rng() - 0.5) * 10,
      y: y + (rng() - 0.5) * 8,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed - 85 - rng() * 45,
      color: isGolden ? '#f7d459' : '#d4a32c',
      secondaryColor: isGolden ? '#fff8b8' : '#8d5b32',
      outlineColor: '#132030',
      size: 5 + Math.floor(rng() * 3),
      maxLife: 0.58 + rng() * 0.28,
      gravity: 420,
      drag: 0.4,
      groundY: sandFloorY + (rng() - 0.5) * 10,
      bounce: 0.42,
    });
  }

  // 3. Fluffy whipped-cream dollops popping upward
  const creamCount = isGolden ? 6 : 5;
  for (let i = 0; i < creamCount; i++) {
    const spread = (i / Math.max(1, creamCount - 1) - 0.5) * 1.9 + (rng() - 0.5) * 0.35;
    const speed = 75 + rng() * 65;
    pool.emit({
      kind: 'cream',
      x: x + (rng() - 0.5) * 12,
      y: y - 4,
      vx: Math.sin(spread) * speed,
      vy: -105 - rng() * 65,
      color: '#fffef9',
      secondaryColor: '#dbeafe',
      outlineColor: '#132030',
      size: 6 + Math.floor(rng() * 2),
      maxLife: 0.52 + rng() * 0.24,
      gravity: 310,
      drag: 0.9,
      groundY: sandFloorY + 4,
      bounce: 0.2,
    });
  }

  // 4. Ruby strawberry / fruit jam droplets
  const berryCount = isGolden ? 5 : 4;
  for (let i = 0; i < berryCount; i++) {
    const ang = -Math.PI * (0.18 + (i / berryCount) * 0.64) + (rng() - 0.5) * 0.28;
    const speed = 95 + rng() * 65;
    pool.emit({
      kind: 'berry',
      x: x + (rng() - 0.5) * 8,
      y: y - 6,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed - 35,
      color: '#f25757',
      secondaryColor: '#ffa69e',
      outlineColor: '#132030',
      size: 5,
      maxLife: 0.48 + rng() * 0.24,
      gravity: 380,
      groundY: sandFloorY + 2,
      bounce: 0.28,
    });
  }

  // 5. 16-bit diamond star sparkles (extra dazzling on Golden Waffle!)
  const sparkleCount = isGolden ? 11 : 5;
  for (let i = 0; i < sparkleCount; i++) {
    const ang = (Math.PI * 2 * i) / sparkleCount + (rng() - 0.5) * 0.3;
    const speed = (isGolden ? 95 : 65) + rng() * 85;
    pool.emit({
      kind: 'sparkle',
      x: x + Math.cos(ang) * 8,
      y: y + Math.sin(ang) * 8,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed - 35,
      color: i % 3 === 0 && isGolden ? '#6ce5f0' : '#fef08a',
      secondaryColor: '#fffef9',
      outlineColor: '#132030',
      size: isGolden ? 8 : 6,
      maxLife: 0.48 + rng() * 0.34,
      gravity: -18,
      drag: 2.2,
    });
  }

  // 6. Rising pixel hearts when a waffle heals HP!
  if (healed) {
    for (let i = 0; i < 3; i++) {
      pool.emit({
        kind: 'heart',
        x: x + (i - 1) * 14,
        y: y - 10 - i * 4,
        vx: (i - 1) * 18,
        vy: -78 - rng() * 24,
        color: '#f25757',
        secondaryColor: '#ffa69e',
        outlineColor: '#132030',
        size: 7,
        maxLife: 0.78 + rng() * 0.18,
        gravity: -22,
        drag: 1.2,
        flutterAmp: 16,
        flutterFreq: 8,
        flutterPhase: i * 1.4,
      });
    }
  }
}

export function emitSeagullCollisionParticles(
  pool: PixelParticlePool,
  x: number,
  y: number,
  options: { knockDirX?: number; knockDirY?: number } = {},
  rng: () => number = Math.random,
): void {
  const kdx = options.knockDirX ?? 1;
  const kdy = options.knockDirY ?? 0;
  const sandFloorY = y + 20;

  // 1. Crisp comic-book impact shockwave ring
  pool.emit({
    kind: 'ring',
    x,
    y,
    vx: 0,
    vy: 0,
    color: '#fffef9',
    secondaryColor: '#ef4444',
    size: 3,
    maxLife: 0.34,
    gravity: 0,
    ringMaxRadius: 52,
  });

  // 2. Fluttering seagull feathers drifting softly to the Baltic sand
  const featherCount = 10;
  for (let i = 0; i < featherCount; i++) {
    const ang = (Math.PI * 2 * i) / featherCount + (rng() - 0.5) * 0.4;
    const speed = 75 + rng() * 95;
    pool.emit({
      kind: 'feather',
      x: x + (rng() - 0.5) * 14,
      y: y - 6 + (rng() - 0.5) * 12,
      vx: Math.cos(ang) * speed - kdx * 25,
      vy: Math.sin(ang) * speed - 65 - rng() * 45,
      color: i % 3 === 0 ? '#cbd5e1' : '#fffef9',
      secondaryColor: '#64748b',
      outlineColor: '#132030',
      size: 7 + Math.floor(rng() * 3),
      maxLife: 0.95 + rng() * 0.45,
      gravity: 78,
      drag: 2.3,
      flutterAmp: 38 + rng() * 24,
      flutterFreq: 6.5 + rng() * 4,
      flutterPhase: rng() * Math.PI * 2,
      rotSpeed: (rng() < 0.5 ? -1 : 1) * (5 + rng() * 5),
      groundY: sandFloorY + 6,
      bounce: 0,
    });
  }

  // 3. Flying stolen golden French fries tumbling & bouncing on the sand!
  const fryCount = 7;
  for (let i = 0; i < fryCount; i++) {
    const ang = (Math.PI * 2 * i) / fryCount + (rng() - 0.5) * 0.5;
    const speed = 115 + rng() * 95;
    pool.emit({
      kind: 'fry',
      x: x + (rng() - 0.5) * 10,
      y: y + (rng() - 0.5) * 8,
      vx: Math.cos(ang) * speed + kdx * 45,
      vy: Math.sin(ang) * speed - 110 - rng() * 55,
      color: '#f7d459',
      secondaryColor: '#d99b26',
      outlineColor: '#132030',
      size: 7,
      maxLife: 0.72 + rng() * 0.3,
      gravity: 460,
      drag: 0.35,
      rotSpeed: (rng() < 0.5 ? -1 : 1) * (9 + rng() * 6),
      groundY: sandFloorY + (rng() - 0.5) * 10,
      bounce: 0.46,
    });
  }

  // 4. Comic-book 16-bit daze impact stars bursting around the hit
  const starCount = 6;
  for (let i = 0; i < starCount; i++) {
    const ang = (Math.PI * 2 * i) / starCount + (rng() - 0.5) * 0.25;
    const speed = 105 + rng() * 75;
    pool.emit({
      kind: 'star',
      x: x + Math.cos(ang) * 6,
      y: y - 4 + Math.sin(ang) * 6,
      vx: Math.cos(ang) * speed + kdx * 30,
      vy: Math.sin(ang) * speed + kdy * 25 - 35,
      color: i % 2 === 0 ? '#f7d459' : '#ff948d',
      secondaryColor: '#fff8b8',
      outlineColor: '#132030',
      size: 7,
      maxLife: 0.48 + rng() * 0.24,
      gravity: 110,
      drag: 2.0,
    });
  }

  // 5. Crisp directional impact sparks along knockback
  for (let i = 0; i < 6; i++) {
    const spread = (rng() - 0.5) * 1.2;
    const baseAng = Math.atan2(kdy, kdx) + spread;
    const speed = 135 + rng() * 95;
    pool.emit({
      kind: 'square',
      x,
      y,
      vx: Math.cos(baseAng) * speed,
      vy: Math.sin(baseAng) * speed - 30,
      color: i % 2 === 0 ? '#ef4444' : '#fffef9',
      size: 4 + Math.floor(rng() * 3),
      maxLife: 0.32 + rng() * 0.18,
      gravity: 220,
      drag: 1.4,
    });
  }
}

export function drawPixelParticles(
  ctx: CanvasRenderingContext2D,
  pool: PixelParticlePool,
): void {
  for (const p of pool.items) {
    if (!p.active) continue;
    const progress = 1 - p.life / p.maxLife;
    const alpha = Math.min(1, (p.life / p.maxLife) * 1.75);
    const px = Math.round(p.x);
    const py = Math.round(p.y);

    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);

    if (p.kind === 'ring') {
      const r = Math.round(8 + (p.ringMaxRadius - 8) * (1 - Math.pow(1 - progress, 2)));
      const thickness = Math.max(2, Math.round(p.size * (1 - progress * 0.4)));
      // Pixelated stepped octant ring for crisp 16-bit aesthetic
      ctx.fillStyle = progress < 0.35 ? p.color : p.secondaryColor;
      const segs = 16;
      for (let i = 0; i < segs; i++) {
        const a = (Math.PI * 2 * i) / segs;
        const rx = px + Math.round(Math.cos(a) * r);
        const ry = py + Math.round(Math.sin(a) * r);
        ctx.fillRect(rx - Math.floor(thickness / 2), ry - Math.floor(thickness / 2), thickness + 1, thickness + 1);
      }
      ctx.restore();
      continue;
    }

    if (p.kind === 'crumb') {
      const s = p.size;
      const hs = Math.floor(s / 2);
      // Dark 16-bit outline + waffle batter + waffle grid dimple
      ctx.fillStyle = p.outlineColor;
      ctx.fillRect(px - hs - 1, py - hs - 1, s + 2, s + 2);
      ctx.fillStyle = p.color;
      ctx.fillRect(px - hs, py - hs, s, s);
      ctx.fillStyle = p.secondaryColor;
      ctx.fillRect(px - hs + 1, py - hs + 1, Math.max(2, s - 3), Math.max(2, s - 3));
      ctx.restore();
      continue;
    }

    if (p.kind === 'cream') {
      const s = p.size;
      const hs = Math.floor(s / 2);
      // 16-bit rounded cream puff (+ silhouette with ink outline)
      ctx.fillStyle = p.outlineColor;
      ctx.fillRect(px - hs - 1, py - hs, s + 2, s);
      ctx.fillRect(px - hs, py - hs - 1, s, s + 2);
      ctx.fillStyle = p.color;
      ctx.fillRect(px - hs, py - hs, s, s);
      ctx.fillStyle = p.secondaryColor;
      ctx.fillRect(px - hs, py + hs - 2, s, 2);
      ctx.restore();
      continue;
    }

    if (p.kind === 'berry') {
      ctx.fillStyle = p.outlineColor;
      ctx.fillRect(px - 3, py - 3, 6, 6);
      ctx.fillStyle = p.color;
      ctx.fillRect(px - 2, py - 2, 4, 4);
      ctx.fillStyle = p.secondaryColor;
      ctx.fillRect(px - 2, py - 2, 2, 2);
      ctx.restore();
      continue;
    }

    if (p.kind === 'sparkle') {
      const arm = Math.max(2, Math.round((p.size / 2) * (1 - progress * 0.45)));
      ctx.fillStyle = p.outlineColor;
      ctx.fillRect(px - arm - 1, py - 2, (arm + 1) * 2 + 1, 5);
      ctx.fillRect(px - 2, py - arm - 1, 5, (arm + 1) * 2 + 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(px - arm, py - 1, arm * 2 + 1, 3);
      ctx.fillRect(px - 1, py - arm, 3, arm * 2 + 1);
      ctx.fillStyle = p.secondaryColor;
      ctx.fillRect(px - 1, py - 1, 3, 3);
      ctx.restore();
      continue;
    }

    if (p.kind === 'heart') {
      // Crisp 7x6 outlined 16-bit pixel heart
      ctx.fillStyle = p.outlineColor;
      ctx.fillRect(px - 4, py - 3, 8, 5);
      ctx.fillRect(px - 2, py + 2, 4, 2);
      ctx.fillStyle = p.color;
      ctx.fillRect(px - 3, py - 2, 2, 3);
      ctx.fillRect(px + 1, py - 2, 2, 3);
      ctx.fillRect(px - 2, py - 1, 4, 3);
      ctx.fillRect(px - 1, py + 2, 2, 1);
      ctx.fillStyle = p.secondaryColor;
      ctx.fillRect(px - 3, py - 2, 1, 1);
      ctx.restore();
      continue;
    }

    if (p.kind === 'feather') {
      // Fluttering 16-bit seagull feather alternating horizontal/tilted pixel poses
      const pose = Math.floor(Math.abs(p.rotPhase)) % 2;
      if (pose === 0) {
        ctx.fillStyle = p.outlineColor;
        ctx.fillRect(px - 5, py - 2, 10, 5);
        ctx.fillStyle = p.color;
        ctx.fillRect(px - 4, py - 1, 8, 3);
        ctx.fillStyle = p.secondaryColor;
        ctx.fillRect(px - 4, py, 3, 2);
      } else {
        ctx.fillStyle = p.outlineColor;
        ctx.fillRect(px - 4, py - 4, 6, 4);
        ctx.fillRect(px - 1, py - 1, 6, 4);
        ctx.fillStyle = p.color;
        ctx.fillRect(px - 3, py - 3, 4, 3);
        ctx.fillRect(px, py, 4, 2);
        ctx.fillStyle = p.secondaryColor;
        ctx.fillRect(px - 3, py - 1, 2, 1);
      }
      ctx.restore();
      continue;
    }

    if (p.kind === 'fry') {
      // Tumbling 16-bit golden French fry stick (alternating vertical/horizontal/diagonal)
      const step = Math.floor(Math.abs(p.rotPhase)) % 3;
      if (step === 0) {
        ctx.fillStyle = p.outlineColor;
        ctx.fillRect(px - 2, py - 5, 5, 10);
        ctx.fillStyle = p.color;
        ctx.fillRect(px - 1, py - 4, 3, 8);
        ctx.fillStyle = p.secondaryColor;
        ctx.fillRect(px + 1, py - 4, 1, 8);
      } else if (step === 1) {
        ctx.fillStyle = p.outlineColor;
        ctx.fillRect(px - 5, py - 2, 10, 5);
        ctx.fillStyle = p.color;
        ctx.fillRect(px - 4, py - 1, 8, 3);
        ctx.fillStyle = p.secondaryColor;
        ctx.fillRect(px - 4, py + 1, 8, 1);
      } else {
        ctx.fillStyle = p.outlineColor;
        ctx.fillRect(px - 4, py - 4, 5, 5);
        ctx.fillRect(px, py, 5, 5);
        ctx.fillStyle = p.color;
        ctx.fillRect(px - 3, py - 3, 3, 3);
        ctx.fillRect(px + 1, py + 1, 3, 3);
      }
      ctx.restore();
      continue;
    }

    if (p.kind === 'star') {
      // Bold comic-book 16-bit impact star
      ctx.fillStyle = p.outlineColor;
      ctx.fillRect(px - 4, py - 2, 9, 5);
      ctx.fillRect(px - 2, py - 4, 5, 9);
      ctx.fillStyle = p.color;
      ctx.fillRect(px - 3, py - 1, 7, 3);
      ctx.fillRect(px - 1, py - 3, 3, 7);
      ctx.fillStyle = p.secondaryColor;
      ctx.fillRect(px - 1, py - 1, 3, 3);
      ctx.restore();
      continue;
    }

    // Default crisp pixel square
    const s = p.size;
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(px - s / 2), Math.round(py - s / 2), s, s);
    ctx.restore();
  }
}
