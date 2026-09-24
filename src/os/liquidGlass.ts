// Builds SVG displacement maps that bend the backdrop near a shape's edges, like a thick glass lens.
// Chromium is the only engine that renders url() filters inside backdrop-filter, so it's opt-in there.

type Spec = { id: string; w: number; h: number; radius: number; band: number; scale: number };

const SPECS: Spec[] = [
  { id: 'lg-dock', w: 720, h: 76, radius: 32, band: 22, scale: 46 },
  { id: 'lg-panel', w: 360, h: 260, radius: 22, band: 20, scale: 34 },
  { id: 'lg-pill', w: 220, h: 36, radius: 18, band: 14, scale: 26 },
  { id: 'lg-round', w: 120, h: 120, radius: 60, band: 22, scale: 30 },
];

function displacementMap({ w, h, radius, band }: Spec): string {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  const hw = w / 2;
  const hh = h / 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5 - hw;
      const py = y + 0.5 - hh;
      const qx = Math.abs(px) - (hw - radius);
      const qy = Math.abs(py) - (hh - radius);
      const ox = Math.max(qx, 0);
      const oy = Math.max(qy, 0);
      const inside = -(Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - radius);
      let nx = 0;
      let ny = 0;
      if (qx > 0 && qy > 0) {
        const l = Math.hypot(ox, oy) || 1;
        nx = (ox / l) * Math.sign(px);
        ny = (oy / l) * Math.sign(py);
      } else if (qx > qy) nx = Math.sign(px);
      else ny = Math.sign(py);
      const t = Math.min(1, Math.max(0, 1 - inside / band));
      const k = t * t * t;
      const i = (y * w + x) * 4;
      img.data[i] = 128 - nx * k * 127;
      img.data[i + 1] = 128 - ny * k * 127;
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
}

function isChromium() {
  const brands = (navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData?.brands;
  return Boolean(brands?.some((b) => /Chromium/i.test(b.brand)));
}

export function installLiquidGlass() {
  if (!isChromium() || document.getElementById('lg-defs')) return;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.id = 'lg-defs';
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  const defs = document.createElementNS(ns, 'defs');
  for (const s of SPECS) {
    const f = document.createElementNS(ns, 'filter');
    f.id = s.id;
    f.setAttribute('x', '0');
    f.setAttribute('y', '0');
    f.setAttribute('width', '100%');
    f.setAttribute('height', '100%');
    f.setAttribute('color-interpolation-filters', 'sRGB');
    const fi = document.createElementNS(ns, 'feImage');
    fi.setAttribute('href', displacementMap(s));
    fi.setAttribute('x', '0');
    fi.setAttribute('y', '0');
    fi.setAttribute('width', '100%');
    fi.setAttribute('height', '100%');
    fi.setAttribute('preserveAspectRatio', 'none');
    fi.setAttribute('result', 'map');
    const fd = document.createElementNS(ns, 'feDisplacementMap');
    fd.setAttribute('in', 'SourceGraphic');
    fd.setAttribute('in2', 'map');
    fd.setAttribute('scale', String(s.scale));
    fd.setAttribute('xChannelSelector', 'R');
    fd.setAttribute('yChannelSelector', 'G');
    f.append(fi, fd);
    defs.append(f);
  }
  svg.append(defs);
  document.body.prepend(svg);
  document.documentElement.classList.add('lg-refract');
}

// Glass highlights follow the pointer, the way Tahoe's material catches light as things move.
export function trackGlassLight() {
  let raf = 0;
  const root = document.documentElement;
  const onMove = (e: PointerEvent) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const dx = e.clientX / window.innerWidth - 0.5;
      const dy = e.clientY / window.innerHeight - 0.5;
      const angle = 135 + dx * 70 - dy * 40;
      root.style.setProperty('--lg-angle', `${angle.toFixed(1)}deg`);
      root.style.setProperty('--lg-x', `${(50 + dx * 60).toFixed(1)}%`);
    });
  };
  window.addEventListener('pointermove', onMove, { passive: true });
}
