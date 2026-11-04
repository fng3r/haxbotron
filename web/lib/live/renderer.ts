import type { LiveDisc, LiveFrame, LiveStadium } from './types';

export const INTERPOLATION_DELAY_MS = 80;

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
  private concrete: CanvasPattern | null;
  private concreteBorder: CanvasPattern | null;
  private dirty = true;

  constructor(private canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable');
    this.context = context;
    this.concrete = this.concreteTexture(109, 40, 8);
    this.concreteBorder = this.concreteTexture(87, 32, 5);
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

  push(frame: LiveFrame) {
    const latest = this.frames[this.frames.length - 1];
    if (frame.stadium) {
      this.stadium = frame.stadium;
      this.dirty = true;
    }
    if (
      latest &&
      (frame.sequence <= latest.sequence ||
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
  }

  private field(ctx: CanvasRenderingContext2D, stadium: LiveStadium) {
    const bg = stadium.bg;
    const w = bg?.width ?? stadium.width;
    const h = bg?.height ?? stadium.height;
    if (bg?.type === 'hockey') {
      // Native hockey backgrounds use concrete, independent of the HBS color.
      ctx.fillStyle = this.concreteBorder ?? '#575757';
      ctx.fillRect(-10000, -10000, 20000, 20000);
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(-w, -h, w * 2, h * 2, Math.min(bg.cornerRadius ?? 0, w, h));
      ctx.clip();
      ctx.fillStyle = this.concrete ?? '#6d6d6d';
      ctx.fillRect(-w, -h, w * 2, h * 2);
      ctx.restore();
    } else {
      ctx.fillStyle = color(bg?.color, '#718c5a');
      ctx.fillRect(-stadium.width, -stadium.height, stadium.width * 2, stadium.height * 2);
    }
    if (bg?.type === 'grass') {
      ctx.fillStyle = '#ffffff08';
      for (let x = -w; x < w; x += 100) ctx.fillRect(x, -h, 50, h * 2);
    }
    if (bg?.type === 'grass' || bg?.type === 'hockey') {
      ctx.strokeStyle = bg.type === 'hockey' ? '#8a9aa4' : '#c7dbb0';
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
      ctx.font = '600 11px sans-serif';
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
    const scale = Math.min(width / (stadium.width * 2 + 40), height / (stadium.height * 2 + 40));
    if (this.dirty) {
      this.background.width = width;
      this.background.height = height;
      const bg = this.background.getContext('2d')!;
      bg.translate(width / 2, height / 2);
      bg.scale(scale, scale);
      this.field(bg, stadium);
      this.dirty = false;
    }
    ctx.drawImage(this.background, 0, 0);
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);
    const latest = this.frames[this.frames.length - 1];
    if (!latest) return;
    const target =
      latest.timestamp - INTERPOLATION_DELAY_MS + Math.min(performance.now() - this.receivedAt, INTERPOLATION_DELAY_MS);
    while (this.frames.length > 2 && this.frames[1].timestamp <= target) this.frames.shift();
    const a = this.frames[0],
      b = this.frames[1] ?? a;
    const t =
      a.timestamp === b.timestamp ? 1 : Math.max(0, Math.min(1, (target - a.timestamp) / (b.timestamp - a.timestamp)));
    b.discs.forEach((disc, i) => {
      // getDiscCount includes player discs; those are rendered below with their labels.
      if (
        disc &&
        b.players.some((p) => p.disc && p.disc.x === disc.x && p.disc.y === disc.y && p.disc.radius === disc.radius)
      )
        return;
      const d = blendDisc(a.discs[i], disc, t);
      if (d) this.disc(d);
    });
    for (const player of b.players) {
      const d = blendDisc(a.players.find((p) => p.id === player.id && p.team === player.team)?.disc, player.disc, t);
      if (!d) continue;
      // Kick readiness is discrete: use the buffered state without blending it.
      const previous = a.players.find((p) => p.id === player.id && p.team === player.team);
      const kicking = (t < 1 ? previous : player)?.kicking ?? false;
      this.disc(d, String(player.id), player.team, kicking);
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
  };
}
