import assert from 'node:assert/strict';
import { test } from 'node:test';

import { stadiumText as bff } from '../../../core/src/lib/stadium/bff_4v4.hbs.ts';
import { stadiumText as classic } from '../../../core/src/lib/stadium/classic.hbs.ts';
import { stadiumText as futsal1v1 } from '../../../core/src/lib/stadium/futsal_1v1.hbs.ts';
import { stadiumText as futsal4v4 } from '../../../core/src/lib/stadium/futsal_4v4.hbs.ts';
import { BroadcastRenderer } from './renderer.ts';

function setup(t, width, height) {
  const original = new Map(
    ['document', 'window', 'Image', 'requestAnimationFrame', 'cancelAnimationFrame'].map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  const queued = [];
  const created = [];
  let logo;
  Object.defineProperty(globalThis, 'Image', {
    configurable: true,
    value: class {
      constructor() { logo = this; }
    },
  });
  function canvas() {
    const context = {
      fills: [],
      clips: [],
      images: [],
      drawImage(image, ...bounds) {
        this.images.push({ image, bounds, alpha: this.globalAlpha });
      },
      roundRect(...rect) {
        this.rect = rect;
      },
      clip() {
        this.clips.push(this.rect);
      },
      fillRect(x, y, width, height) {
        this.fills.push({ x, y, width, height, style: this.fillStyle });
      },
      createPattern: () => ({ texture: true }),
      createImageData: (width, height) => ({ data: new Uint8ClampedArray(width * height * 4) }),
    };
    for (const method of [
      'putImageData',
      'setTransform',
      'translate',
      'scale',
      'save',
      'restore',
      'beginPath',
      'stroke',
      'moveTo',
      'lineTo',
      'arc',
    ])
      context[method] = () => {};
    return { width: 0, height: 0, clientWidth: width, clientHeight: height, getContext: () => context, context };
  }
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      createElement: () => {
        const element = canvas();
        created.push(element);
        return element;
      },
    },
  });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { devicePixelRatio: 1 } });
  Object.defineProperty(globalThis, 'requestAnimationFrame', {
    configurable: true,
    value: (callback) => {
      queued.push(callback);
      return queued.length;
    },
  });
  Object.defineProperty(globalThis, 'cancelAnimationFrame', { configurable: true, value: () => {} });
  const target = canvas();
  const renderer = new BroadcastRenderer(target);
  t.after(() => {
    renderer.destroy();
    for (const [key, descriptor] of original) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  return { renderer, target, logo, background: created[0].context, draw: () => queued.shift()() };
}

test('center watermark loads asynchronously, stays cached and scales with the stadium', (t) => {
  const { renderer, background, logo, draw } = setup(t, 1000, 600);
  const stadium = { name: 'Circle', width: 420, height: 200, bg: { type: 'grass', kickOffRadius: 75 } };
  renderer.push(frame(stadium));
  draw();
  assert.equal(background.images.length, 0);
  assert.equal(logo.src, '/images/cis-logo.png');
  logo.onload();
  draw();
  assert.deepEqual(background.images[0], { image: logo, bounds: [-75, -75, 150, 150], alpha: 0.35 });
  draw();
  assert.equal(background.images.length, 1, 'watermark is cached between frames');
  renderer.push(frame({ name: 'No circle', width: 600, height: 300 }, 2));
  draw();
  assert.deepEqual(background.images[1].bounds, [-75, -75, 150, 150]);
  renderer.destroy();
  assert.equal(logo.onload, null);
});

function frame(stadium, sequence = 1) {
  return {
    stadium,
    sequence,
    timestamp: sequence * 16,
    matchId: 'match',
    status: 'playing',
    scores: null,
    discs: [],
    players: [],
  };
}

function assertCoverage(fill, stadium, width, height) {
  const scale = Math.min(width / (stadium.width * 2 + 40), height / (stadium.height * 2 + 40));
  const epsilon = 0.000001;
  assert.ok(Math.abs(width / 2 + fill.x * scale) < epsilon, 'background reaches left edge');
  assert.ok(Math.abs(height / 2 + fill.y * scale) < epsilon, 'background reaches top edge');
  assert.ok(Math.abs((fill.x + fill.width) * scale - width / 2) < epsilon, 'background reaches right edge');
  assert.ok(Math.abs((fill.y + fill.height) * scale - height / 2) < epsilon, 'background reaches bottom edge');
}

test('all background types cover the viewport for bundled and arbitrary maps', (t) => {
  const { renderer, background, draw } = setup(t, 1280, 720);
  for (const stadium of [
    JSON.parse(bff),
    JSON.parse(classic),
    JSON.parse(futsal1v1),
    JSON.parse(futsal4v4),
    { name: 'Custom grass', width: 500, height: 180, bg: { type: 'grass', color: '125634' } },
    { name: 'Custom plain', width: 100, height: 500, bg: { type: 'none', color: 0x234567 } },
    { name: 'Missing background', width: 500, height: 180 },
  ]) {
    renderer.push(frame(stadium));
    background.fills.length = 0;
    draw();
    const fill = background.fills[0];
    assertCoverage(fill, stadium, 1280, 720);
    if (stadium.bg?.type === 'hockey') assert.deepEqual(fill.style, { texture: true });
    else if (stadium.bg?.color === '34414B') assert.equal(fill.style, '#34414B');
    else if (stadium.bg?.color === '125634') assert.equal(fill.style, '#125634');
    else if (stadium.bg?.color === 0x234567) assert.equal(fill.style, '#234567');
    else assert.equal(fill.style, '#718c5a');
  }
});

test('grass uses a textured pitch inside its rounded bounds and preserves the surrounding map color', (t) => {
  const { renderer, background, draw } = setup(t, 1280, 720);
  for (const stadium of [
    JSON.parse(classic),
    {
      name: 'Custom grass',
      width: 600,
      height: 300,
      bg: { type: 'grass', width: 500, height: 200, cornerRadius: 30, color: '125634' },
    },
  ]) {
    renderer.push(frame(stadium));
    background.fills.length = 0;
    background.clips.length = 0;
    draw();
    assertCoverage(background.fills[0], stadium, 1280, 720);
    assert.equal(background.fills[0].style, stadium.bg.color ? '#125634' : '#718c5a');
    const { width, height, cornerRadius } = stadium.bg;
    assert.deepEqual(background.fills[1], {
      x: -width,
      y: -height,
      width: width * 2,
      height: height * 2,
      style: { texture: true },
    });
    assert.deepEqual(background.clips, [[-width, -height, width * 2, height * 2, cornerRadius]]);
    assert.equal(background.fills.length, 2, 'texture replaces the old vertical stripe overlay');
  }
});

test('background coverage updates on resize/fullscreen without changing game coordinates', (t) => {
  const { renderer, target, background, draw } = setup(t, 1280, 720);
  const stadium = JSON.parse(bff);
  renderer.push(frame(stadium));
  for (const [width, height] of [
    [1280, 720],
    [900, 1600],
    [2560, 720],
    [500, 500],
  ]) {
    target.clientWidth = width;
    target.clientHeight = height;
    background.fills.length = 0;
    draw();
    assertCoverage(background.fills[0], stadium, width, height);
  }
});
