export type Blob = { x: number; y: number; r: number; color: string };
export type Wallpaper = {
  id: string;
  name: string;
  base: [string, string];
  blobs: Blob[];
  dark: boolean;
  // Dynamic wallpapers switch artwork with Light and Dark appearance, like macOS.
  svg?: { dark: string; light: string };
};

type WavePalette = { bg: [string, string, string]; far: [string, string]; ribbon: [string, string, string]; mid: [string, string]; near: [string, string]; glow: string; sheen: number };

function waves(p: WavePalette) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1200" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="${p.bg[0]}"/><stop offset="0.55" stop-color="${p.bg[1]}"/><stop offset="1" stop-color="${p.bg[2]}"/></linearGradient>
<radialGradient id="glow" cx="0.72" cy="0.18" r="0.55"><stop offset="0" stop-color="${p.glow}" stop-opacity="0.75"/><stop offset="1" stop-color="${p.glow}" stop-opacity="0"/></radialGradient>
<linearGradient id="far" x1="0" y1="0" x2="1" y2="0.4"><stop offset="0" stop-color="${p.far[0]}"/><stop offset="1" stop-color="${p.far[1]}"/></linearGradient>
<linearGradient id="rib" x1="0" y1="0" x2="1" y2="0.2"><stop offset="0" stop-color="${p.ribbon[0]}"/><stop offset="0.5" stop-color="${p.ribbon[1]}"/><stop offset="1" stop-color="${p.ribbon[2]}"/></linearGradient>
<linearGradient id="mid" x1="0" y1="0" x2="1" y2="0.6"><stop offset="0" stop-color="${p.mid[0]}"/><stop offset="1" stop-color="${p.mid[1]}"/></linearGradient>
<linearGradient id="near" x1="0" y1="0" x2="0.8" y2="1"><stop offset="0" stop-color="${p.near[0]}"/><stop offset="1" stop-color="${p.near[1]}"/></linearGradient>
<linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${p.sheen}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<filter id="soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="26"/></filter>
<filter id="haze" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="6"/></filter>
</defs>
<rect width="1920" height="1200" fill="url(#bg)"/>
<rect width="1920" height="1200" fill="url(#glow)"/>
<path filter="url(#soft)" d="M-80 700C300 560 620 880 980 730S1640 560 2000 690V1260H-80Z" fill="url(#far)" opacity="0.85"/>
<path filter="url(#haze)" d="M-80 430C420 280 860 640 1380 470S1860 330 2000 400V540C1840 490 1560 610 1380 620 880 780 440 440-80 600Z" fill="url(#rib)" opacity="0.9"/>
<path filter="url(#haze)" d="M-80 430C420 280 860 640 1380 470S1860 330 2000 400V430C1840 380 1560 500 1380 510 880 670 440 330-80 470Z" fill="url(#sheen)"/>
<path d="M-80 840C360 720 720 990 1100 850S1720 720 2000 850V1260H-80Z" fill="url(#mid)"/>
<path filter="url(#haze)" d="M-80 840C360 720 720 990 1100 850S1720 720 2000 850V880C1720 760 1420 880 1100 890 720 1030 360 760-80 880Z" fill="url(#sheen)"/>
<path d="M-80 1000C420 910 780 1110 1160 990S1760 900 2000 990V1260H-80Z" fill="url(#near)"/>
<path filter="url(#haze)" d="M-80 1000C420 910 780 1110 1160 990S1760 900 2000 990V1016C1760 930 1460 1024 1160 1030 780 1150 420 950-80 1030Z" fill="url(#sheen)" opacity="0.7"/>
</svg>`;
}

const wavesDark = waves({
  bg: ['#030716', '#081a44', '#0d2d73'],
  glow: '#4a7dff',
  far: ['#1c3f9a', '#3b6cff'],
  ribbon: ['#6b4dff', '#3aa0ff', '#57e1ff'],
  mid: ['#2759e0', '#7d5cff'],
  near: ['#0b2466', '#1a4fd0'],
  sheen: 0.45,
});

const wavesLight = waves({
  bg: ['#d8e6ff', '#c3d5ff', '#e9ddff'],
  glow: '#ffffff',
  far: ['#9dbbff', '#c9b6ff'],
  ribbon: ['#a58bff', '#6fb6ff', '#8ff0ff'],
  mid: ['#6f9bff', '#b39cff'],
  near: ['#4d7df2', '#8a8cff'],
  sheen: 0.7,
});

export const wallpapers: Wallpaper[] = [
  {
    id: 'krishna-waves',
    name: 'Krishna Waves',
    base: ['#081a44', '#030716'],
    dark: true,
    blobs: [],
    svg: { dark: wavesDark, light: wavesLight },
  },
  {
    id: 'krishna-dusk',
    name: 'Krishna Dusk',
    base: ['#1a2a6c', '#0d1330'],
    dark: true,
    blobs: [
      { x: 0.18, y: 0.92, r: 0.75, color: 'rgba(255,138,76,0.95)' },
      { x: 0.62, y: 1.05, r: 0.6, color: 'rgba(236,72,120,0.85)' },
      { x: 0.88, y: 0.35, r: 0.55, color: 'rgba(111,76,255,0.8)' },
      { x: 0.3, y: 0.2, r: 0.5, color: 'rgba(40,110,255,0.7)' },
    ],
  },
  {
    id: 'amaravati-dawn',
    name: 'Amaravati Dawn',
    base: ['#f7d9c4', '#9fb8ff'],
    dark: false,
    blobs: [
      { x: 0.8, y: 0.85, r: 0.7, color: 'rgba(255,184,120,0.95)' },
      { x: 0.15, y: 0.3, r: 0.6, color: 'rgba(160,190,255,0.9)' },
      { x: 0.55, y: 0.05, r: 0.5, color: 'rgba(255,214,236,0.9)' },
      { x: 0.35, y: 0.9, r: 0.45, color: 'rgba(255,150,170,0.7)' },
    ],
  },
  {
    id: 'monsoon',
    name: 'Monsoon',
    base: ['#0f3d3e', '#06181c'],
    dark: true,
    blobs: [
      { x: 0.2, y: 0.8, r: 0.65, color: 'rgba(28,170,150,0.85)' },
      { x: 0.8, y: 0.2, r: 0.6, color: 'rgba(60,120,200,0.75)' },
      { x: 0.6, y: 0.9, r: 0.45, color: 'rgba(150,220,120,0.55)' },
    ],
  },
  {
    id: 'lamp-light',
    name: 'Lamp Light',
    base: ['#2b1a12', '#120b08'],
    dark: true,
    blobs: [
      { x: 0.25, y: 0.3, r: 0.7, color: 'rgba(255,170,90,0.85)' },
      { x: 0.85, y: 0.85, r: 0.55, color: 'rgba(200,80,40,0.7)' },
      { x: 0.7, y: 0.15, r: 0.4, color: 'rgba(255,220,160,0.5)' },
    ],
  },
  {
    id: 'graphite',
    name: 'Graphite',
    base: ['#3a3d44', '#15161a'],
    dark: true,
    blobs: [
      { x: 0.3, y: 0.25, r: 0.6, color: 'rgba(120,130,150,0.6)' },
      { x: 0.8, y: 0.9, r: 0.6, color: 'rgba(80,90,110,0.7)' },
    ],
  },
];

export const defaultWallpaper = wallpapers[0];

const svgUrl = (svg: string) => `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;

export function wallpaperCss(w: Wallpaper, theme: 'dark' | 'light' = 'dark'): string {
  if (w.svg) return `${svgUrl(w.svg[theme])} center / cover no-repeat, ${w.base[1]}`;
  const blobs = w.blobs
    .map((b) => `radial-gradient(circle at ${b.x * 100}% ${b.y * 100}%, ${b.color} 0%, transparent ${b.r * 100}%)`)
    .join(', ');
  return `${blobs}, linear-gradient(160deg, ${w.base[0]}, ${w.base[1]})`;
}

const images = new Map<string, HTMLImageElement>();

// Resolves once a dynamic wallpaper's artwork is decoded, so canvases can repaint with it.
export function loadWallpaper(w: Wallpaper): Promise<void> {
  if (!w.svg) return Promise.resolve();
  let img = images.get(w.id);
  if (!img) {
    img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(w.svg.dark)}`;
    images.set(w.id, img);
  }
  return img.decode().catch(() => undefined);
}

export function paintWallpaper(ctx: CanvasRenderingContext2D, w: Wallpaper, width: number, height: number) {
  const img = images.get(w.id);
  if (w.svg && img?.complete && img.naturalWidth) {
    const scale = Math.max(width / 1920, height / 1200);
    const dw = 1920 * scale;
    const dh = 1200 * scale;
    ctx.drawImage(img, (width - dw) / 2, (height - dh) / 2, dw, dh);
    return;
  }
  const lin = ctx.createLinearGradient(0, 0, width * 0.35, height);
  lin.addColorStop(0, w.base[0]);
  lin.addColorStop(1, w.base[1]);
  ctx.fillStyle = lin;
  ctx.fillRect(0, 0, width, height);
  const diag = Math.hypot(width, height) * 0.71;
  for (const b of w.blobs) {
    const g = ctx.createRadialGradient(b.x * width, b.y * height, 0, b.x * width, b.y * height, b.r * diag);
    g.addColorStop(0, b.color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }
}
