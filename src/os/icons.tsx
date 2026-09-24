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

type BaseProps = { id: string; bg: [string, string]; children: React.ReactNode; bgAngle?: 'v' | 'd' };

// Tahoe icon anatomy: a lit squircle, a glyph that casts a soft shadow, a specular band and a glass rim.
function Base({ id, bg, children, bgAngle = 'v' }: BaseProps) {
  return (
    <svg viewBox="0 0 100 100" className="app-icon-svg" aria-hidden="true">
      <defs>
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2={bgAngle === 'd' ? '1' : '0'} y2="1">
          <stop offset="0" stopColor={bg[0]} />
          <stop offset="1" stopColor={bg[1]} />
        </linearGradient>
        <linearGradient id={`sheen-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`rim-${id}`} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="0.3" stopColor="#fff" stopOpacity="0.15" />
          <stop offset="0.72" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.6" />
        </linearGradient>
        <radialGradient id={`shade-${id}`} cx="0.5" cy="1.1" r="0.8">
          <stop offset="0" stopColor="#000" stopOpacity="0.2" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`clip-${id}`}>
          <path d={SQUIRCLE} />
        </clipPath>
      </defs>
      <path d={SQUIRCLE} fill={`url(#g-${id})`} />
      <g clipPath={`url(#clip-${id})`}>
        <path d={SQUIRCLE} fill={`url(#shade-${id})`} />
        <g filter="drop-shadow(0 2px 2.4px rgba(0,0,0,0.2))">{children}</g>
        <path d="M0 0h100v40C76 49 24 49 0 40z" fill={`url(#sheen-${id})`} opacity="0.7" />
      </g>
      <path d={SQUIRCLE} fill="none" stroke={`url(#rim-${id})`} strokeWidth="1.2" />
      <path d={SQUIRCLE} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="0.5" />
    </svg>
  );
}

function Grad({ id, stops, x2 = 0, y2 = 1 }: { id: string; stops: [number, string, number?][]; x2?: number; y2?: number }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
      {stops.map(([o, c, a], i) => (
        <stop key={i} offset={o} stopColor={c} stopOpacity={a ?? 1} />
      ))}
    </linearGradient>
  );
}

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

export function LaunchpadIcon() {
  const colors = ['#ff5f57', '#febc2e', '#28c840', '#0a84ff', '#bf5af2', '#ff9f0a', '#64d2ff', '#ff375f', '#30d158'];
  return (
    <Base id="launchpad" bg={['#fbfbfd', '#dfe1e7']}>
      <rect x="22" y="18" width="56" height="10" rx="5" fill="#d7dae1" />
      <circle cx="29" cy="23" r="2.4" fill="none" stroke="#8e8e93" strokeWidth="1.2" />
      {colors.map((c, i) => (
        <rect key={i} x={24 + (i % 3) * 18} y={36 + Math.floor(i / 3) * 16} width="13" height="11" rx="3.4" fill={c} />
      ))}
    </Base>
  );
}

const icons: Record<AppId, () => React.ReactElement> = {
  finder: () => (
    <Base id="finder" bg={['#7cc8ff', '#1478f0']}>
      <defs>
        <Grad id="finder-win" stops={[[0, '#ffffff'], [1, '#e3f0ff']]} />
      </defs>
      <rect x="19" y="24" width="62" height="50" rx="7" fill="url(#finder-win)" />
      <rect x="19" y="24" width="20" height="50" rx="7" fill="#cfe4ff" />
      <rect x="32" y="24" width="7" height="50" fill="#cfe4ff" />
      <circle cx="25" cy="30" r="1.8" fill="#ff5f57" />
      <circle cx="30.5" cy="30" r="1.8" fill="#febc2e" />
      <circle cx="36" cy="30" r="1.8" fill="#28c840" />
      {[40, 47, 54].map((y) => (
        <rect key={y} x="23" y={y} width="11" height="3" rx="1.5" fill="#7fb4f5" />
      ))}
      <path d="M46 42c0-2 1.6-3.4 3.4-3.4h7.6l2.4 2.6h12c1.9 0 3.4 1.5 3.4 3.4v14c0 1.9-1.5 3.4-3.4 3.4H49.4C47.6 62 46 60.5 46 58.6z" fill="#3b99ff" />
      <path d="M45 46.5c0-1.4 1.1-2.5 2.5-2.5h26c1.4 0 2.5 1.1 2.5 2.5V59c0 1.7-1.3 3-3 3H48c-1.7 0-3-1.3-3-3z" fill="#5aafff" />
    </Base>
  ),
  about: () => (
    <Base id="about" bg={['#e9d8c4', '#b7936c']}>
      <defs>
        <Grad id="about-card" stops={[[0, '#ffffff'], [1, '#f1ebe3']]} />
        <Grad id="about-person" stops={[[0, '#b7a896'], [1, '#8b7a66']]} />
      </defs>
      <rect x="22" y="18" width="52" height="64" rx="8" fill="url(#about-card)" />
      <rect x="72" y="26" width="7" height="11" rx="2.5" fill="#ff9f0a" />
      <rect x="72" y="40" width="7" height="11" rx="2.5" fill="#30d158" />
      <rect x="72" y="54" width="7" height="11" rx="2.5" fill="#0a84ff" />
      <circle cx="48" cy="42" r="11" fill="url(#about-person)" />
      <path d="M29 73c2.5-11 10.5-17 19-17s16.5 6 19 17z" fill="url(#about-person)" />
    </Base>
  ),
  academics: () => (
    <Base id="academics" bg={['#5263e8', '#1b2272']}>
      <defs>
        <Grad id="ac-cap" stops={[[0, '#ffe39a'], [1, '#f2b53a']]} />
        <Grad id="ac-base" stops={[[0, '#f0b43d'], [1, '#c98a1c']]} />
      </defs>
      <path d="M50 58 29 49v15c0 6.5 9.4 11.5 21 11.5S71 70.5 71 64V49z" fill="url(#ac-base)" />
      <path d="M50 24 88 41 50 58 12 41z" fill="url(#ac-cap)" />
      <path d="M50 24 88 41 50 58 12 41z" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="0.8" />
      <path d="M79 45v19" stroke="#ffe39a" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M75.5 64h7l-1.5 9h-4z" fill="#ffd36b" />
    </Base>
  ),
  projects: () => (
    <Base id="projects" bg={['#2f3542', '#10131a']}>
      <defs>
        <Grad id="pj-hammer" stops={[[0, '#9fd3ff'], [1, '#2b82f6']]} />
      </defs>
      <rect x="18" y="20" width="64" height="48" rx="7" fill="#1c212c" stroke="#3a4252" strokeWidth="1" />
      <rect x="18" y="20" width="64" height="9" rx="4" fill="#262c38" />
      <circle cx="24" cy="24.5" r="1.7" fill="#ff5f57" />
      <circle cx="29.5" cy="24.5" r="1.7" fill="#febc2e" />
      <circle cx="35" cy="24.5" r="1.7" fill="#28c840" />
      <path d="M33 40 25 47l8 7" stroke="#ff7ab6" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M44 40h18M44 47h26M44 54h12" stroke="#7ab8ff" strokeWidth="3" strokeLinecap="round" />
      <rect x="30" y="72" width="40" height="9" rx="4.5" fill="url(#pj-hammer)" />
    </Base>
  ),
  skills: () => (
    <Base id="skills" bg={['#3a404e', '#15181f']}>
      <defs>
        <Grad id="sk-1" stops={[[0, '#9cc8ff'], [1, '#3d8bff']]} />
        <Grad id="sk-2" stops={[[0, '#8df0cc'], [1, '#22b787']]} />
        <Grad id="sk-3" stops={[[0, '#ffd08a'], [1, '#ff9a2e']]} />
      </defs>
      <path d="M50 70 18 57l32-13 32 13z" fill="url(#sk-3)" />
      <path d="M50 58 18 45l32-13 32 13z" fill="url(#sk-2)" />
      <path d="M50 46 18 33l32-13 32 13z" fill="url(#sk-1)" />
      <path d="M18 33l32 13 32-13" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="0.8" />
    </Base>
  ),
  contact: () => (
    <Base id="contact" bg={['#5ec6ff', '#1567f0']}>
      <defs>
        <Grad id="mail-env" stops={[[0, '#ffffff'], [1, '#e6eefb']]} />
        <Grad id="mail-flap" stops={[[0, '#f4f7fd'], [1, '#d4e0f5']]} />
      </defs>
      <rect x="16" y="28" width="68" height="46" rx="6" fill="url(#mail-env)" />
      <path d="M16 70 44 49c3.5-2.6 8.5-2.6 12 0l28 21" fill="none" stroke="#c9d6ee" strokeWidth="1.6" />
      <path d="M17 31l28.5 22c2.7 2 6.3 2 9 0L83 31c-.9-1.8-2.8-3-5-3H22c-2.2 0-4.1 1.2-5 3z" fill="url(#mail-flap)" />
    </Base>
  ),
  browser: () => (
    <Base id="browser" bg={['#ffffff', '#e2e5ec']}>
      <defs>
        <radialGradient id="br-disc" cx="0.42" cy="0.32" r="0.78">
          <stop offset="0" stopColor="#7fd0ff" />
          <stop offset="0.6" stopColor="#1f8cf5" />
          <stop offset="1" stopColor="#0b5ad6" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="33" fill="url(#br-disc)" />
      {Array.from({ length: 36 }).map((_, i) => {
        const a = (i / 36) * Math.PI * 2;
        const long = i % 3 === 0;
        return (
          <line
            key={i}
            x1={50 + Math.cos(a) * (long ? 25.5 : 27.5)}
            y1={50 + Math.sin(a) * (long ? 25.5 : 27.5)}
            x2={50 + Math.cos(a) * 30.5}
            y2={50 + Math.sin(a) * 30.5}
            stroke="#fff"
            strokeOpacity={long ? 0.95 : 0.6}
            strokeWidth={long ? 1.3 : 0.8}
          />
        );
      })}
      <path d="M50 50 71 29 54.5 54.5z" fill="#ff453a" />
      <path d="M50 50 29 71 45.5 45.5z" fill="#f2f4f8" />
      <circle cx="50" cy="50" r="2.2" fill="#fff" />
    </Base>
  ),
  terminal: () => (
    <Base id="terminal" bg={['#e4e6ea', '#a4a8b1']}>
      <rect x="16" y="21" width="68" height="58" rx="8" fill="#101216" />
      <rect x="16" y="21" width="68" height="58" rx="8" fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="0.8" />
      <path d="M27 38l10 8-10 8" stroke="#f2f2f2" strokeWidth="4.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M42 57h15" stroke="#f2f2f2" strokeWidth="4.2" strokeLinecap="round" />
    </Base>
  ),
  settings: () => (
    <Base id="settings" bg={['#e9eaee', '#aeb2bb']}>
      <defs>
        <radialGradient id="set-gear" cx="0.5" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#8a8f99" />
          <stop offset="1" stopColor="#4a4f58" />
        </radialGradient>
      </defs>
      <g transform="translate(50 50)">
        {Array.from({ length: 24 }).map((_, i) => (
          <rect key={i} x="-2.4" y="-34" width="4.8" height="8" rx="1.4" fill="url(#set-gear)" transform={`rotate(${i * 15})`} />
        ))}
        <circle r="27" fill="url(#set-gear)" />
        <circle r="22" fill="#d7d9de" />
        <circle r="22" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="0.8" />
        {[0, 120, 240].map((r) => (
          <rect key={r} x="-2.8" y="-20" width="5.6" height="20" rx="2.8" fill="#6c717b" transform={`rotate(${r})`} />
        ))}
        <circle r="7" fill="#5a5f69" />
        <circle r="3.4" fill="#c7cad1" />
      </g>
    </Base>
  ),
  trash: () => (
    <svg viewBox="0 0 100 100" className="app-icon-svg" aria-hidden="true">
      <defs>
        <linearGradient id="g-trash" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d6dbe2" stopOpacity="0.7" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#bcc3cd" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="g-trash-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d0d5dc" />
        </linearGradient>
        <clipPath id="trash-body">
          <path d="M22 24h56l-5.5 62c-.4 3.4-3.2 6-6.6 6H34.1c-3.4 0-6.2-2.6-6.6-6z" />
        </clipPath>
      </defs>
      <path d="M22 24h56l-5.5 62c-.4 3.4-3.2 6-6.6 6H34.1c-3.4 0-6.2-2.6-6.6-6z" fill="url(#g-trash)" />
      <g clipPath="url(#trash-body)" stroke="#9aa3ae" strokeOpacity="0.55" strokeWidth="0.8">
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`v${i}`} x1={24 + i * 5} y1="26" x2={27 + i * 4.4} y2="92" />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`h${i}`} x1="20" y1={30 + i * 5.5} x2="80" y2={30 + i * 5.5} strokeOpacity="0.25" />
        ))}
      </g>
      <path d="M22 24h56l-5.5 62c-.4 3.4-3.2 6-6.6 6H34.1c-3.4 0-6.2-2.6-6.6-6z" fill="none" stroke="#8b949f" strokeWidth="1" />
      <ellipse cx="50" cy="24" rx="29" ry="5.5" fill="url(#g-trash-rim)" stroke="#8b949f" strokeWidth="1" />
      <ellipse cx="50" cy="24.5" rx="24" ry="3.5" fill="#6d7581" opacity="0.35" />
    </svg>
  ),
};

export function AppIcon({ id }: { id: AppId }) {
  const Icon = icons[id];
  return <Icon />;
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
