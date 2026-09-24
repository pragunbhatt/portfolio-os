// Synthesized rain: filtered noise for the wash, short noise bursts for drops, low rumbles for thunder.

type Engine = { ctx: AudioContext; master: GainNode; dropTimer: number };

let engine: Engine | null = null;
let volume = 0.6;
let enabled = false;
const listeners = new Set<(on: boolean) => void>();

function noiseBuffer(ctx: AudioContext, seconds: number, brown = false) {
  const len = ctx.sampleRate * seconds;
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      } else d[i] = w;
    }
  }
  return buf;
}

function start(): Engine {
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  const wash = ctx.createBufferSource();
  wash.buffer = noiseBuffer(ctx, 4);
  wash.loop = true;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 500;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 5200;
  const washGain = ctx.createGain();
  washGain.gain.value = 0.16;
  wash.connect(hp).connect(lp).connect(washGain).connect(master);
  wash.start();

  const body = ctx.createBufferSource();
  body.buffer = noiseBuffer(ctx, 4, true);
  body.loop = true;
  const bodyGain = ctx.createGain();
  bodyGain.gain.value = 0.35;
  body.connect(bodyGain).connect(master);
  body.start();

  const dropBuf = noiseBuffer(ctx, 0.05);
  const drop = () => {
    const src = ctx.createBufferSource();
    src.buffer = dropBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800 + Math.random() * 4200;
    bp.Q.value = 6;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    const peak = 0.05 + Math.random() * 0.12;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 2 - 1;
    src.connect(bp).connect(g).connect(pan).connect(master);
    src.start(t);
  };
  const dropTimer = window.setInterval(() => {
    const n = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) window.setTimeout(drop, Math.random() * 90);
  }, 90);

  return { ctx, master, dropTimer };
}

export function thunder() {
  if (!engine || !enabled) return;
  const { ctx, master } = engine;
  const delay = 0.8 + Math.random() * 2.2;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, 5, true);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 160;
  const g = ctx.createGain();
  const t = ctx.currentTime + delay;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.9, t + 0.25);
  g.gain.exponentialRampToValueAtTime(0.001, t + 4.5);
  src.connect(lp).connect(g).connect(master);
  src.start(t);
}

// A soft mechanical switch click, only when sound is already on.
export function keyClick() {
  if (!engine || !enabled) return;
  const { ctx, master } = engine;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, 0.03);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2600 + Math.random() * 900;
  bp.Q.value = 1.4;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.22, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
  src.connect(bp).connect(g).connect(master);
  src.start(t);
}

export function setRain(on: boolean) {
  enabled = on;
  if (on && !engine) engine = start();
  if (engine) {
    const { ctx, master } = engine;
    if (on && ctx.state === 'suspended') void ctx.resume();
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(on ? volume : 0, ctx.currentTime, 0.4);
  }
  listeners.forEach((l) => l(on));
}

export function setRainVolume(v: number) {
  volume = v;
  if (engine && enabled) engine.master.gain.setTargetAtTime(v, engine.ctx.currentTime, 0.2);
}

export function rainEnabled() {
  return enabled;
}

export function rainVolume() {
  return volume;
}

export function onRainChange(fn: (on: boolean) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
