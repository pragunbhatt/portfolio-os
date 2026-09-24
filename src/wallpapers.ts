export type Blob = { x: number; y: number; r: number; color: string };
export type Wallpaper = {
  id: string;
  name: string;
  base: [string, string];
  blobs: Blob[];
  dark: boolean;
};

export const wallpapers: Wallpaper[] = [
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

export function wallpaperCss(w: Wallpaper): string {
  const blobs = w.blobs
    .map((b) => `radial-gradient(circle at ${b.x * 100}% ${b.y * 100}%, ${b.color} 0%, transparent ${b.r * 100}%)`)
    .join(', ');
  return `${blobs}, linear-gradient(160deg, ${w.base[0]}, ${w.base[1]})`;
}

export function paintWallpaper(ctx: CanvasRenderingContext2D, w: Wallpaper, width: number, height: number) {
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
