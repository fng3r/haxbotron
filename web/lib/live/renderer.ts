import type { LiveDisc, LiveFrame, LiveStadium } from './types';

export const INTERPOLATION_DELAY_MS = 80;
export const ZOOM_LEVELS = [0, 1, 1.25, 1.5, 1.75, 2] as const;

export function color(value: string | number | undefined, fallback = '#c5cbb7') {
  if (typeof value === 'number') return value < 0 ? 'transparent' : `#${value.toString(16).padStart(6, '0')}`;
  return value && /^[\da-f]{6}$/i.test(value) ? `#${value}` : fallback;
}

export function blendDisc(a: LiveDisc | null | undefined, b: LiveDisc | null, t: number): LiveDisc | null {
  // Never sweep across the pitch after kickoffs, team changes or teleports.
  if (!a || !b || Math.hypot(a.x - b.x, a.y - b.y) > 100) return b;
  return { ...b, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export class BroadcastRenderer {
  private frames: LiveFrame[] = [];
  private stadium?: LiveStadium;
  private receivedAt = 0;
  private animation = 0;
  private context: CanvasRenderingContext2D;
  private background = document.createElement('canvas');
  private backgroundScale = 0;
  private concrete: CanvasPattern | null;
  private concreteBorder: CanvasPattern | null;
  private grass: CanvasPattern | null;
  private dirty = true;
  private canvas: HTMLCanvasElement;
  private logo = new Image();
  private logoLoaded = false;
  private zoom = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable');
    this.context = context;
    this.concrete = this.concreteTexture(109, 40, 8);
    this.concreteBorder = this.concreteTexture(87, 32, 5);
    this.grass = this.grassTexture();
    this.logo.onload = () => {
      this.logoLoaded = true;
      this.dirty = true;
    };
    this.logo.decoding = 'async';
    this.logo.src = '/images/cis-logo.png';
    this.animation = requestAnimationFrame(this.draw);
  }

  private concreteTexture(shade: number, tileWidth: number, grain: number): CanvasPattern | null {
    // Procedural tiles approximate the native concrete surfaces without external assets.
    const tile = document.createElement('canvas');
    tile.width = tileWidth * 2;
    tile.height = 80;
    const ctx = tile.getContext('2d');
    if (!ctx) return null;
    const pixels = ctx.createImageData(tile.width, tile.height);
    let seed = 12345;
    for (let y = 0; y < tile.height; y += 2) {
      for (let x = 0; x < tile.width; x += 2) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const value = shade + Math.round((seed / 0xffffffff - 0.5) * grain * 2) - (x === 0 ? 9 : 0);
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            const offset = ((y + dy) * tile.width + x + dx) * 4;
            pixels.data[offset] = pixels.data[offset + 1] = pixels.data[offset + 2] = value;
            pixels.data[offset + 3] = 255;
          }
        }
      }
    }
    ctx.putImageData(pixels, 0, 0);
    return this.context.createPattern(tile, 'repeat');
  }

  private grassTexture(): CanvasPattern | null {
    const tile = document.createElement('canvas');
    tile.width = tile.height = 256;
    const ctx = tile.getContext('2d');
    if (!ctx) return null;
    const pixels = ctx.createImageData(tile.width, tile.height);
    let seed = 24680;
    for (let y = 0; y < tile.height; y += 2) {
      for (let x = 0; x < tile.width; x += 2) {
        // Seamless diagonal mowing bands and deterministic grain, like the native grass.
        const base = (x + y) % 128 < 64 ? [125, 169, 109] : [115, 158, 99];
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const grain = Math.round((seed / 0xffffffff - 0.5) * 12);
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            const offset = ((y + dy) * tile.width + x + dx) * 4;
            pixels.data[offset] = base[0] + grain;
            pixels.data[offset + 1] = base[1] + grain;
            pixels.data[offset + 2] = base[2] + grain;
            pixels.data[offset + 3] = 255;
          }
        }
      }
    }
    ctx.putImageData(pixels, 0, 0);
    return this.context.createPattern(tile, 'repeat');
  }

  push(frame: LiveFrame) {
    const latest = this.frames[this.frames.length - 1];
    if (frame.stadium) {
      this.stadium = frame.stadium;
      this.dirty = true;
    }
    if (
      latest &&
      (frame.matchId !== latest.matchId ||
        frame.sequence <= latest.sequence ||
        frame.status !== latest.status ||
        frame.timestamp - latest.timestamp > 500 ||
        frame.stadium)
    )
      this.frames = [];
    this.frames.push(frame);
    if (this.frames.length > 120) this.frames.shift();
    this.receivedAt = performance.now();
  }

  destroy() {
    cancelAnimationFrame(this.animation);
    this.logo.onload = null;
  }

  setZoom(zoom: number) {
    if (!(ZOOM_LEVELS as readonly number[]).includes(zoom) || zoom === this.zoom) return;
    this.zoom = zoom;
    this.dirty = true;
  }

  private field(ctx: CanvasRenderingContext2D, stadium: LiveStadium, visibleWidth: number, visibleHeight: number) {
    const bg = stadium.bg;
    const w = bg?.width ?? stadium.width;
    const h = bg?.height ?? stadium.height;
    // Stadium bounds size the camera, not the background. Cover the whole view,
    // including aspect-ratio margins and fullscreen space outside those bounds.
    ctx.fillStyle = bg?.type === 'hockey' ? (this.concreteBorder ?? '#575757') : color(bg?.color, '#718c5a');
    ctx.fillRect(-visibleWidth / 2, -visibleHeight / 2, visibleWidth, visibleHeight);
    if (bg?.type === 'hockey' || bg?.type === 'grass') {
      // Built-in surfaces have their own textures. Grass still uses bg.color outside.
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(-w, -h, w * 2, h * 2, Math.min(bg.cornerRadius ?? 0, w, h));
      ctx.clip();
      ctx.fillStyle = bg.type === 'hockey' ? (this.concrete ?? '#6d6d6d') : (this.grass ?? '#78a367');
      ctx.fillRect(-w, -h, w * 2, h * 2);
      ctx.restore();
    }
    if (bg?.type === 'grass' || bg?.type === 'hockey') {
      ctx.strokeStyle = bg.type === 'hockey' ? '#8a9aa4' : '#c7e6bd';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-w, -h, w * 2, h * 2, Math.min(bg.cornerRadius ?? 0, w, h));
      ctx.moveTo(0, -h);
      ctx.lineTo(0, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, bg.kickOffRadius ?? 75, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (const segment of stadium.segments ?? []) {
      if (segment.vis === false) continue;
      const a = stadium.vertexes?.[segment.v0],
        b = stadium.vertexes?.[segment.v1];
      if (!a || !b) continue;
      ctx.strokeStyle = color(segment.color, '#000000');
      ctx.lineWidth = 2;
      ctx.beginPath();
      const angle =
        segment.curveF !== undefined ? 2 * Math.atan(1 / segment.curveF) : ((segment.curve ?? 0) * Math.PI) / 180;
      if (Math.abs(angle) > 0.001 && Math.abs(angle) < Math.PI * 2) {
        const factor = 1 / (2 * Math.tan(angle / 2));
        const cx = (a.x + b.x) / 2 - (b.y - a.y) * factor;
        const cy = (a.y + b.y) / 2 + (b.x - a.x) * factor;
        ctx.arc(
          cx,
          cy,
          Math.hypot(a.x - cx, a.y - cy),
          Math.atan2(a.y - cy, a.x - cx),
          Math.atan2(b.y - cy, b.x - cx),
          angle < 0,
        );
      } else {
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
      ctx.stroke();
    }
    // Overlay all stadium markings; moving discs and player labels are drawn later.
    if (this.logoLoaded) {
      const radius = bg?.kickOffRadius;
      const size = radius && radius > 0 ? radius * 2 : Math.min(stadium.width, stadium.height) * 0.5;
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.drawImage(this.logo, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
  }

  private disc(disc: LiveDisc, text?: string, team?: number, kicking = false) {
    const ctx = this.context;
    ctx.beginPath();
    ctx.arc(disc.x, disc.y, Math.max(0, disc.radius), 0, Math.PI * 2);
    ctx.fillStyle = team ? (team === 1 ? '#e66e55' : '#5a89e5') : color(disc.color, '#fff');
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = kicking ? '#ffffff' : '#17201ddd';
    ctx.stroke();
    if (text) {
      ctx.font = '700 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(text, disc.x, disc.y);
    }
  }

  private draw = () => {
    this.animation = requestAnimationFrame(this.draw);
    const ctx = this.context,
      canvas = this.canvas;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
    const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      this.dirty = true;
    }
    const stadium = this.stadium;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#18251f';
    ctx.fillRect(0, 0, width, height);
    if (!stadium) return;
    const latest = this.frames[this.frames.length - 1];
    if (!latest) return;
    const target =
      latest.timestamp - INTERPOLATION_DELAY_MS + Math.min(performance.now() - this.receivedAt, INTERPOLATION_DELAY_MS);
    while (this.frames.length > 2 && this.frames[1].timestamp <= target) this.frames.shift();
    const a = this.frames[0],
      b = this.frames[1] ?? a;
    const t =
      a.timestamp === b.timestamp ? 1 : Math.max(0, Math.min(1, (target - a.timestamp) / (b.timestamp - a.timestamp)));
    const ball = blendDisc(a.discs[0], b.discs[0] ?? null, t);
    // 0 fits the entire stadium; numbered zooms use native world scale.
    const scale =
      this.zoom === 0
        ? Math.min(width / (stadium.width * 2 + 40), height / (stadium.height * 2 + 40))
        : ratio * this.zoom;
    const cameraX = this.zoom === 0 ? 0 : this.cameraAxis(ball?.x ?? 0, stadium.width, width / scale);
    const cameraY = this.zoom === 0 ? 0 : this.cameraAxis(ball?.y ?? 0, stadium.height, height / scale);
    const worldWidth = Math.max(width / scale, stadium.width * 2 + 40);
    const worldHeight = Math.max(height / scale, stadium.height * 2 + 40);
    // Cache the stadium once, including space needed when following the ball.
    // Bound texture size for unusually large maps/high-DPI displays.
    const backgroundScale = Math.min(scale, 4096 / worldWidth, 4096 / worldHeight);
    if (this.dirty || backgroundScale !== this.backgroundScale) {
      this.background.width = Math.ceil(worldWidth * backgroundScale);
      this.background.height = Math.ceil(worldHeight * backgroundScale);
      const bg = this.background.getContext('2d')!;
      bg.translate(this.background.width / 2, this.background.height / 2);
      bg.scale(backgroundScale, backgroundScale);
      this.field(bg, stadium, this.background.width / backgroundScale, this.background.height / backgroundScale);
      this.dirty = false;
      this.backgroundScale = backgroundScale;
    }
    const cachedWidth = (this.background.width * scale) / backgroundScale;
    const cachedHeight = (this.background.height * scale) / backgroundScale;
    ctx.drawImage(
      this.background,
      (width - cachedWidth) / 2 - cameraX * scale,
      (height - cachedHeight) / 2 - cameraY * scale,
      cachedWidth,
      cachedHeight,
    );
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-cameraX, -cameraY);
    b.discs.forEach((disc, i) => {
      // Disc 0 is the game ball; draw it last so labels cannot cover it.
      if (i === 0) return;
      // getDiscCount includes player discs; those are rendered below with their labels.
      if (
        disc &&
        b.players.some((p) => p.disc && p.disc.x === disc.x && p.disc.y === disc.y && p.disc.radius === disc.radius)
      )
        return;
      const d = blendDisc(a.discs[i], disc, t);
      if (d) this.disc(d);
    });
    const players = b.players.flatMap((player) => {
      const previous = a.players.find((p) => p.id === player.id && p.team === player.team);
      const disc = blendDisc(previous?.disc, player.disc, t);
      if (!disc) return [];
      // Kick readiness is discrete: use the buffered state without blending it.
      const kicking = (t < 1 ? previous : player)?.kicking ?? false;
      return [{ player, disc, kicking }];
    });
    // Draw complete layers so a later player's nickname cannot cover another disc.
    for (const { player, disc: d } of players) {
      const nickname = Array.from(player.name).slice(0, 10).join('');
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#142219';
      ctx.strokeText(nickname, d.x, d.y + d.radius + 5);
      ctx.fillStyle = '#fff';
      ctx.fillText(nickname, d.x, d.y + d.radius + 5);
    }
    for (const { player, disc, kicking } of players) {
      this.disc(disc, String(player.avatarNumber ?? player.id), player.team, kicking);
    }
    if (ball) this.disc(ball);
  };

  private cameraAxis(position: number, halfExtent: number, visibleSize: number) {
    const limit = Math.max(0, halfExtent + 20 - visibleSize / 2);
    return Math.max(-limit, Math.min(limit, position));
  }
}
