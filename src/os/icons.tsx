import type { AppId } from './store';

function squirclePath(size = 100, inset = 9, n = 5): string {
  const c = size / 2;
  const r = c - inset;
  const pts: string[] = [];
  const steps = 96;
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const ct = Math.cos(t);
    const st = Math.sin(t);
    const x = c + r * Math.sign(ct) * Math.pow(Math.abs(ct), 2 / n);
    const y = c + r * Math.sign(st) * Math.pow(Math.abs(st), 2 / n);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
}

export const SQUIRCLE = squirclePath();

export function FolderIcon({ tint = '#4aa8ff', glyph }: { tint?: string; glyph?: React.ReactNode }) {
  const id = `fold-${tint.replace('#', '')}`;
  return (
    <svg viewBox="0 0 100 80" className="app-icon-svg" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-back`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tint} stopOpacity="0.85" />
          <stop offset="1" stopColor={tint} />
        </linearGradient>
        <linearGradient id={`${id}-front`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.12" stopColor={tint} stopOpacity="0.95" />
          <stop offset="1" stopColor={tint} />
        </linearGradient>
      </defs>
      <path d="M8 14c0-4 3-7 7-7h20c2.4 0 4 1 5.4 2.6L45 14h40c4 0 7 3 7 7v44c0 4-3 7-7 7H15c-4 0-7-3-7-7z" fill={`url(#${id}-back)`} />
      <path d="M8 14c0-4 3-7 7-7h20c2.4 0 4 1 5.4 2.6L45 14h40c4 0 7 3 7 7v44c0 4-3 7-7 7H15c-4 0-7-3-7-7z" fill="#000" opacity="0.12" />
      <rect x="11" y="18" width="78" height="10" rx="3" fill="#fff" opacity="0.92" />
      <path d="M6 28c0-3 2.4-5 5-5h78c2.8 0 5 2.2 5 5v37c0 4-3 7-7 7H13c-4 0-7-3-7-7z" fill={`url(#${id}-front)`} />
      <path d="M6 28c0-3 2.4-5 5-5h78c2.8 0 5 2.2 5 5" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="0.8" />
      {glyph && (
        <g opacity="0.55" fill="none" stroke="#0b3f86" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
          {glyph}
        </g>
      )}
    </svg>
  );
}

export function DocIcon({ ext, tint = '#8e8e93' }: { ext: string; tint?: string }) {
  return (
    <svg viewBox="0 0 80 100" className="app-icon-svg" aria-hidden="true">
      <path d="M12 4h40l20 20v68c0 2.2-1.8 4-4 4H12c-2.2 0-4-1.8-4-4V8c0-2.2 1.8-4 4-4z" fill="#fff" />
      <path d="M12 4h40l20 20v68c0 2.2-1.8 4-4 4H12c-2.2 0-4-1.8-4-4V8c0-2.2 1.8-4 4-4z" fill="none" stroke="rgba(0,0,0,0.14)" strokeWidth="1" />
      <path d="M52 4v16c0 2.2 1.8 4 4 4h16" fill="#eceef2" stroke="rgba(0,0,0,0.14)" strokeWidth="1" />
      {[36, 44, 52, 60].map((y) => (
        <rect key={y} x="18" y={y} width={y === 60 ? 26 : 44} height="3" rx="1.5" fill="#c7cad1" />
      ))}
      <rect x="14" y="72" width="52" height="16" rx="4" fill={tint} />
      <text x="40" y="84" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff" fontFamily="-apple-system, Inter, system-ui, sans-serif">
        {ext}
      </text>
    </svg>
  );
}

function IconImage({ id }: { id: AppId | 'launchpad' }) {
  return <img className="app-icon-img" src={`/icons/${id}.png`} alt="" aria-hidden="true" draggable={false} />;
}

export function LaunchpadIcon() {
  return <IconImage id="launchpad" />;
}

export function AppIcon({ id }: { id: AppId }) {
  return <IconImage id={id} />;
}

type GlyphProps = { size?: number; className?: string };
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export const Glyph = {
  Monogram: ({ size = 15 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <rect x="1" y="1" width="14" height="14" rx="4.5" fill="currentColor" />
      <text x="8" y="11.2" textAnchor="middle" fontSize="7.6" fontWeight="800" fill="var(--menubar-bg-solid, #000)" fontFamily="system-ui, sans-serif">
        PB
      </text>
    </svg>
  ),
  Wifi: ({ size = 16 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M1.5 6.2a9.5 9.5 0 0 1 13 0" {...stroke} />
      <path d="M3.9 8.7a6 6 0 0 1 8.2 0" {...stroke} />
      <path d="M6.3 11.1a2.6 2.6 0 0 1 3.4 0" {...stroke} />
      <circle cx="8" cy="13.2" r="1" fill="currentColor" />
    </svg>
  ),
  Battery: ({ size = 22 }: GlyphProps) => (
    <svg width={size} height={size * 0.55} viewBox="0 0 24 13" aria-hidden="true">
      <rect x="0.7" y="0.7" width="20" height="11.6" rx="3.2" fill="none" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.2" />
      <rect x="2.4" y="2.4" width="13" height="8.2" rx="1.8" fill="currentColor" />
      <path d="M22.3 4.3v4.4c.9-.3 1.3-1.2 1.3-2.2s-.4-1.9-1.3-2.2z" fill="currentColor" fillOpacity="0.55" />
    </svg>
  ),
  Control: ({ size = 15 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <rect x="1" y="2" width="14" height="5" rx="2.5" {...stroke} strokeWidth={1.3} />
      <circle cx="12.5" cy="4.5" r="1.4" fill="currentColor" />
      <rect x="1" y="9" width="14" height="5" rx="2.5" {...stroke} strokeWidth={1.3} />
      <circle cx="3.5" cy="11.5" r="1.4" fill="currentColor" />
    </svg>
  ),
  Search: ({ size = 14 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="7" cy="7" r="4.8" {...stroke} />
      <path d="m10.6 10.6 3.6 3.6" {...stroke} />
    </svg>
  ),
  ChevronLeft: ({ size = 14 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M10 3 5 8l5 5" {...stroke} strokeWidth={2} />
    </svg>
  ),
  ChevronRight: ({ size = 14 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="m6 3 5 5-5 5" {...stroke} strokeWidth={2} />
    </svg>
  ),
  Reload: ({ size = 14 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M13 8a5 5 0 1 1-1.5-3.6" {...stroke} />
      <path d="M13 2.5v3h-3" {...stroke} />
    </svg>
  ),
  External: ({ size = 13 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M9 2.5h4.5V7M13.5 2.5 7 9" {...stroke} />
      <path d="M11.5 9.5v3a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3" {...stroke} />
    </svg>
  ),
  Copy: ({ size = 13 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <rect x="5" y="5" width="9" height="9" rx="2" {...stroke} />
      <path d="M11 3.5V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h.5" {...stroke} />
    </svg>
  ),
  Check: ({ size = 13 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="m3 8.5 3.2 3L13 4.5" {...stroke} strokeWidth={2} />
    </svg>
  ),
  Send: ({ size = 15 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M14.5 1.5 7 9M14.5 1.5 10 14.5 7 9 1.5 6z" {...stroke} />
    </svg>
  ),
  Github: ({ size = 15 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 .2a8 8 0 0 0-2.5 15.6c.4 0 .5-.2.5-.4v-1.5c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.3 1.9.9 2.4.7 0-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8a7.4 7.4 0 0 1 4 0c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.1 0 3.1-1.9 3.8-3.6 4 .3.3.5.8.5 1.5v2.2c0 .2.1.5.6.4A8 8 0 0 0 8 .2z"
      />
    </svg>
  ),
  Linkedin: ({ size = 15 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <rect x="0.5" y="0.5" width="15" height="15" rx="3" fill="currentColor" />
      <path fill="var(--glyph-knockout, #fff)" d="M3.6 6.3h1.9v6H3.6zM4.5 3.3a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2zM6.8 6.3h1.8v.8c.3-.5.9-1 1.9-1 2 0 2.3 1.3 2.3 3v3.2h-1.9V9.5c0-.7 0-1.6-1-1.6s-1.1.8-1.1 1.5v2.9H6.8z" />
    </svg>
  ),
  Mail: ({ size = 15 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <rect x="1.5" y="3" width="13" height="10" rx="2" {...stroke} />
      <path d="m2 4 6 5 6-5" {...stroke} />
    </svg>
  ),
  Pin: ({ size = 15 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 14.5s5-4.3 5-8.2A5 5 0 0 0 3 6.3c0 3.9 5 8.2 5 8.2z" {...stroke} />
      <circle cx="8" cy="6.3" r="1.8" {...stroke} />
    </svg>
  ),
  Sidebar: ({ size = 15 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <rect x="1.5" y="2.5" width="13" height="11" rx="2.2" {...stroke} strokeWidth={1.3} />
      <path d="M6 2.5v11" {...stroke} strokeWidth={1.3} />
    </svg>
  ),
  Plus: ({ size = 14 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 3v10M3 8h10" {...stroke} strokeWidth={1.8} />
    </svg>
  ),
  Lock: ({ size = 11 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7.5" rx="1.8" fill="currentColor" />
      <path d="M5.2 7V5a2.8 2.8 0 0 1 5.6 0v2" {...stroke} strokeWidth={1.8} />
    </svg>
  ),
  Arrow: ({ size = 16 }: GlyphProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.7" />
      <path d="M5 8h6M8.5 5.5 11 8l-2.5 2.5" {...stroke} strokeWidth={1.4} />
    </svg>
  ),
};
