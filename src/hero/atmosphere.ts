import * as THREE from 'three';

/* ---------- Night city seen through a rainy window ---------- */

function cityCanvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#070b18');
  sky.addColorStop(0.55, '#101a33');
  sky.addColorStop(1, '#1d2440');
  g.fillStyle = sky;
  g.fillRect(0, 0, w, h);

  // Low clouds lit from the city below.
  const glow = g.createRadialGradient(w * 0.5, h * 1.05, 0, w * 0.5, h * 1.05, h * 0.9);
  glow.addColorStop(0, 'rgba(255,150,90,0.35)');
  glow.addColorStop(1, 'rgba(255,150,90,0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, w, h);

  // Buildings with lit windows.
  let x = -20;
  while (x < w) {
    const bw = 40 + Math.random() * 110;
    const bh = h * (0.18 + Math.random() * 0.42);
    const top = h - bh;
    g.fillStyle = `rgb(${10 + Math.random() * 8},${13 + Math.random() * 8},${24 + Math.random() * 10})`;
    g.fillRect(x, top, bw, bh);
    for (let wy = top + 10; wy < h - 8; wy += 13) {
      for (let wx = x + 6; wx < x + bw - 8; wx += 11) {
        if (Math.random() > 0.72) {
          const warm = Math.random() > 0.25;
          g.fillStyle = warm ? `rgba(255,${190 + Math.random() * 40},${120 + Math.random() * 40},${0.5 + Math.random() * 0.5})` : 'rgba(170,200,255,0.7)';
          g.fillRect(wx, wy, 5, 7);
        }
      }
    }
    x += bw + Math.random() * 12;
  }

  // Street lights and traffic as soft bokeh.
  const dot = (cx: number, cy: number, r: number, color: string, a: number) => {
    const rg = g.createRadialGradient(cx, cy, 0, cx, cy, r);
    rg.addColorStop(0, color.replace('A', String(a)));
    rg.addColorStop(0.6, color.replace('A', String(a * 0.5)));
    rg.addColorStop(1, color.replace('A', '0'));
    g.fillStyle = rg;
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.fill();
  };
  for (let i = 0; i < 70; i++) {
    const cy = h * (0.62 + Math.random() * 0.38);
    const palette = ['rgba(255,176,96,A)', 'rgba(255,230,190,A)', 'rgba(255,70,60,A)', 'rgba(150,200,255,A)', 'rgba(120,255,190,A)'];
    dot(Math.random() * w, cy, 10 + Math.random() * 34, palette[Math.floor(Math.random() * (i % 7 === 0 ? 5 : 3))], 0.35 + Math.random() * 0.5);
  }
  return c;
}

function blurred(src: HTMLCanvasElement, factor: number) {
  // Downscale then upscale: a cheap blur that works in every browser.
  const small = document.createElement('canvas');
  small.width = Math.max(2, Math.round(src.width / factor));
  small.height = Math.max(2, Math.round(src.height / factor));
  const sg = small.getContext('2d')!;
  sg.imageSmoothingQuality = 'high';
  sg.drawImage(src, 0, 0, small.width, small.height);
  const out = document.createElement('canvas');
  out.width = src.width;
  out.height = src.height;
  const og = out.getContext('2d')!;
  og.imageSmoothingQuality = 'high';
  og.drawImage(small, 0, 0, out.width, out.height);
  return out;
}

const rainFrag = /* glsl */ `
uniform float uTime;
uniform float uFlash;
uniform float uAspect;
uniform sampler2D uSharp;
uniform sampler2D uBlur;
varying vec2 vUv;

vec3 N13(float p) {
  vec3 p3 = fract(vec3(p) * vec3(.1031, .11369, .13787));
  p3 += dot(p3, p3.yzx + 19.19);
  return fract(vec3((p3.x + p3.y) * p3.z, (p3.x + p3.z) * p3.y, (p3.y + p3.z) * p3.x));
}
float N(float t) { return fract(sin(t * 12345.564) * 7658.76); }

float pathX(float y, vec3 n) {
  return 0.5 + (n.y - 0.5) * 0.45 + sin(y * 9.0 + n.z * 20.0) * 0.07 + sin(y * 23.0 + n.x * 7.0) * 0.025;
}

// xy: refraction normal, z: drop coverage, w: wet trail that clears the fog.
vec4 slideLayer(vec2 uv, float t, float cells) {
  vec2 cell = vec2(1.0, 3.2) / cells;
  vec2 g = uv / cell;
  g.y += N(floor(g.x)) * 7.0;
  vec2 id = floor(g);
  vec3 n = N13(id.x * 35.2 + id.y * 2376.1);
  if (n.x < 0.4) return vec4(0.0);
  vec2 st = fract(g);
  float ti = fract(t * (0.07 + n.z * 0.12) + n.y);
  // Drops hesitate, then slip: ease the fall so it isn't a constant slide.
  float fall = ti + sin(ti * 18.0) * 0.012;
  float y = 0.95 - fall * 0.9;
  vec2 dp = (st - vec2(pathX(y, n), y)) * cell;
  float r = 0.0085 + n.z * 0.006;
  float drop = smoothstep(r, r * 0.45, length(dp * vec2(1.0, 0.82)));
  vec2 dn = dp / r * drop;

  float above = st.y - y;
  float along = smoothstep(-0.005, 0.03, above) * smoothstep(0.5, 0.0, above);
  float trailW = abs(st.x - pathX(st.y, n)) * cell.x;
  float trail = smoothstep(r * 0.8, r * 0.2, trailW) * along;

  float seg = fract(st.y * 14.0 + n.x * 3.0);
  vec2 tp = vec2((st.x - pathX(st.y, n)) * cell.x, (seg - 0.5) * cell.y / 14.0);
  float tr = r * 0.32 * along;
  float tdrop = smoothstep(tr, tr * 0.35, length(tp)) * step(0.01, above) * step(0.35, N(floor(st.y * 14.0) + n.z * 91.0));
  vec2 tn = tp / max(tr, 1e-4) * tdrop;
  return vec4(dn + tn, max(drop, tdrop), trail);
}

vec3 staticLayer(vec2 uv, float t) {
  vec2 g = uv * 70.0;
  vec2 id = floor(g);
  vec3 n = N13(id.x * 107.45 + id.y * 3543.654);
  vec2 st = fract(g) - 0.5;
  vec2 p = st - (n.xy - 0.5) * 0.6;
  float r = 0.08 + n.z * 0.2;
  float life = fract(t * 0.025 + n.z * 10.0);
  float fade = smoothstep(0.0, 0.04, life) * smoothstep(1.0, 0.6, life);
  float m = smoothstep(r, r * 0.45, length(p)) * fade * step(0.5, n.y);
  return vec3(p / r * m, m);
}

void main() {
  vec2 uv = vUv;
  vec2 s = vec2(uv.x * uAspect, uv.y);
  float t = uTime;

  vec3 st1 = staticLayer(s, t);
  vec4 l1 = slideLayer(s, t, 16.0);
  vec4 l2 = slideLayer(s * 1.45 + vec2(3.7, 1.3), t * 1.15, 16.0);
  vec2 nrm = st1.xy * 0.7 + l1.xy + l2.xy * 0.8;
  float drops = clamp(st1.z + l1.z + l2.z, 0.0, 1.0);
  float clear = clamp(drops + (l1.w + l2.w) * 0.85, 0.0, 1.0);

  // Behind the glass: faint streaks of rain falling past.
  vec2 su = vec2(uv.x * 140.0, uv.y * 2.2 + t * 2.6);
  float h = N(floor(su.x));
  float fy = fract(su.y + h * 13.0);
  float streak = smoothstep(0.18, 0.0, abs(fract(su.x) - 0.5)) * smoothstep(0.0, 0.25, fy) * smoothstep(0.5, 0.25, fy) * step(0.82, h);

  vec3 sharp = texture2D(uSharp, uv - nrm * 0.055).rgb;
  vec3 blur = texture2D(uBlur, uv).rgb;
  vec3 fog = blur * 0.82 + vec3(0.018, 0.024, 0.036);
  vec3 col = mix(fog, sharp, clear);
  col += streak * 0.05 * (1.0 - clear * 0.6);

  float ln = length(nrm);
  float edge = smoothstep(0.55, 1.0, ln) * drops;
  col *= 1.0 - edge * 0.4;
  vec2 dir = nrm / max(ln, 1e-4);
  float spec = pow(max(0.0, dot(dir, normalize(vec2(-0.55, 0.85)))), 8.0) * smoothstep(0.35, 0.85, ln) * drops;
  col += spec * vec3(0.9, 0.85, 0.75) * 0.35;

  col += uFlash * vec3(0.5, 0.56, 0.72) * (0.55 + 0.45 * clear);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const basicVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export function createRainGlass(width: number, height: number) {
  const city = cityCanvas(1024, Math.round((1024 * height) / width));
  const sharpTex = new THREE.CanvasTexture(blurred(city, 2));
  const blurTex = new THREE.CanvasTexture(blurred(city, 18));
  for (const t of [sharpTex, blurTex]) {
    t.colorSpace = THREE.SRGBColorSpace;
    t.generateMipmaps = false;
    t.minFilter = THREE.LinearFilter;
  }
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uFlash: { value: 0 },
      uAspect: { value: width / height },
      uSharp: { value: sharpTex },
      uBlur: { value: blurTex },
    },
    vertexShader: basicVert,
    fragmentShader: rainFrag,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  return {
    mesh,
    material,
    dispose() {
      mesh.geometry.dispose();
      material.dispose();
      sharpTex.dispose();
      blurTex.dispose();
    },
  };
}

/* ---------- Dust drifting through the lamp beam ---------- */

const dustVert = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
attribute float aSeed;
varying float vAlpha;
void main() {
  vec3 p = position;
  float s = aSeed * 6.2831;
  p += vec3(sin(uTime * 0.21 + s) * 0.012, sin(uTime * 0.13 + s * 1.7) * 0.01, cos(uTime * 0.17 + s * 0.6) * 0.012);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = max(1.0, (0.0012 + aSeed * 0.0018) * uPixelRatio / -mv.z);
  vAlpha = 0.25 + 0.75 * (0.5 + 0.5 * sin(uTime * (0.6 + aSeed) + s));
}
`;

const dustFrag = /* glsl */ `
varying float vAlpha;
uniform float uLevel;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d) * vAlpha * 0.32 * uLevel;
  gl_FragColor = vec4(1.0, 0.82, 0.58, a);
}
`;

export function createDust(apex: THREE.Vector3, target: THREE.Vector3, angle: number, count = 170) {
  const axis = target.clone().sub(apex);
  const len = axis.length();
  axis.normalize();
  const u = new THREE.Vector3(1, 0, 0).cross(axis).normalize();
  const v = axis.clone().cross(u).normalize();
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const s = 0.12 + Math.pow(Math.random(), 0.8) * 0.8;
    const rad = Math.tan(angle * 0.7) * len * s * Math.sqrt(Math.random());
    const a = Math.random() * Math.PI * 2;
    const p = apex
      .clone()
      .addScaledVector(axis, len * s)
      .addScaledVector(u, Math.cos(a) * rad)
      .addScaledVector(v, Math.sin(a) * rad);
    positions.set([p.x, p.y, p.z], i * 3);
    seeds[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 }, uLevel: { value: 1 } },
    vertexShader: dustVert,
    fragmentShader: dustFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, material);
  return {
    points,
    material,
    dispose() {
      geo.dispose();
      material.dispose();
    },
  };
}

/* ---------- Steam curling off the mug ---------- */

function wispTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d')!;
  for (let i = 0; i < 14; i++) {
    const x = 64 + (Math.random() - 0.5) * 40;
    const y = 64 + (Math.random() - 0.5) * 60;
    const r = 14 + Math.random() * 26;
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, 'rgba(255,255,255,0.22)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, 128, 128);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createSteam(origin: THREE.Vector3, count = 6) {
  const tex = wispTexture();
  const group = new THREE.Group();
  const sprites: { s: THREE.Sprite; m: THREE.SpriteMaterial; phase: number; drift: number }[] = [];
  for (let i = 0; i < count; i++) {
    const m = new THREE.SpriteMaterial({ map: tex, color: '#fff3e6', transparent: true, depthWrite: false, opacity: 0 });
    const s = new THREE.Sprite(m);
    group.add(s);
    sprites.push({ s, m, phase: i / count, drift: Math.random() * Math.PI * 2 });
  }
  return {
    group,
    update(t: number, boost = 1) {
      for (const p of sprites) {
        const life = (t * 0.16 + p.phase) % 1;
        const rise = life * 0.17;
        p.s.position.set(
          origin.x + Math.sin(life * 5 + p.drift) * 0.012 * (0.4 + life),
          origin.y + rise,
          origin.z + Math.cos(life * 4 + p.drift) * 0.008,
        );
        const scale = 0.03 + life * 0.075;
        p.s.scale.set(scale, scale * 1.4, 1);
        p.m.opacity = Math.sin(life * Math.PI) * 0.16 * boost;
        p.m.rotation = p.drift + life * 1.4;
      }
    },
    dispose() {
      tex.dispose();
      sprites.forEach((p) => p.m.dispose());
    },
  };
}

/* ---------- A sticky note on the monitor ---------- */

export function stickyNote(initial: string[]) {
  let lines = initial;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const paint = () => {
    const g = c.getContext('2d')!;
    const bg = g.createLinearGradient(0, 0, 0, 256);
    bg.addColorStop(0, '#fbe68a');
    bg.addColorStop(1, '#f1d766');
    g.fillStyle = bg;
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = 'rgba(0,0,0,0.05)';
    g.fillRect(0, 0, 256, 34);
    g.fillStyle = '#23304d';
    g.font = '500 44px Caveat, "Segoe Print", "Bradley Hand", cursive';
    g.textBaseline = 'middle';
    lines.forEach((l, i) => {
      g.save();
      g.translate(22, 92 + i * 52);
      g.rotate(-0.04 + i * 0.015);
      g.fillText(l, 0, 0);
      g.restore();
    });
  };
  paint();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  document.fonts?.load('500 44px Caveat').then(() => {
    paint();
    tex.needsUpdate = true;
  });
  return {
    tex,
    setLines(next: string[]) {
      lines = next;
      paint();
      tex.needsUpdate = true;
    },
  };
}

/* ---------- Film grain and a soft vignette, applied last ---------- */

export const GrainShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uAmount: { value: 0.035 },
  },
  vertexShader: basicVert,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uAmount;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + uTime) * 43758.5453); }
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      float n = hash(vUv * 1000.0) - 0.5;
      c.rgb += n * uAmount;
      float v = smoothstep(1.15, 0.35, length(vUv - 0.5) * 1.35);
      c.rgb *= mix(0.78, 1.0, v);
      gl_FragColor = c;
    }
  `,
};
