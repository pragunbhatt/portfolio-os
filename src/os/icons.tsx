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

function Base({ id, from, to, children }: { id: string; from: string; to: string; children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 100 100" className="app-icon-svg" aria-hidden="true">
      <defs>
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
        <linearGradient id={`sheen-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`clip-${id}`}>
          <path d={SQUIRCLE} />
        </clipPath>
      </defs>
      <path d={SQUIRCLE} fill={`url(#g-${id})`} />
      <g clipPath={`url(#clip-${id})`}>{children}</g>
      <path d={SQUIRCLE} fill={`url(#sheen-${id})`} opacity="0.6" />
      <path d={SQUIRCLE} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.8" />
    </svg>
  );
}

const icons: Record<AppId, () => React.ReactElement> = {
  about: () => (
    <Base id="about" from="#f7c46c" to="#d9763d">
      <rect x="24" y="22" width="52" height="58" rx="7" fill="#fffaf2" />
      <rect x="24" y="22" width="52" height="16" rx="7" fill="#f3e3cc" />
      <circle cx="50" cy="47" r="10" fill="#c8733f" />
      <path d="M32 74c2-10 10-15 18-15s16 5 18 15z" fill="#c8733f" />
      <rect x="19" y="30" width="6" height="8" rx="2" fill="#8a4a24" />
      <rect x="19" y="46" width="6" height="8" rx="2" fill="#8a4a24" />
      <rect x="19" y="62" width="6" height="8" rx="2" fill="#8a4a24" />
    </Base>
  ),
  academics: () => (
    <Base id="academics" from="#4c5bd9" to="#1c2470">
      <path d="M50 26 86 42 50 58 14 42z" fill="#ffd36b" />
      <path d="M50 58 30 49v14c0 6 9 11 20 11s20-5 20-11V49z" fill="#f2b940" />
      <path d="M78 45v20" stroke="#ffd36b" strokeWidth="3" strokeLinecap="round" />
      <circle cx="78" cy="68" r="4" fill="#ffd36b" />
      <path d="M50 26 86 42 50 58 14 42z" fill="#fff" opacity="0.18" />
    </Base>
  ),
  projects: () => (
    <Base id="projects" from="#7fd0ff" to="#1f7fe6">
      <path d="M18 34c0-4 3-7 7-7h16l6 6h28c4 0 7 3 7 7v32c0 4-3 7-7 7H25c-4 0-7-3-7-7z" fill="#e6f5ff" />
      <path d="M18 42h64v30c0 4-3 7-7 7H25c-4 0-7-3-7-7z" fill="#fff" />
      <path d="M42 51 34 59l8 8M58 51l8 8-8 8" stroke="#1f7fe6" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Base>
  ),
  skills: () => (
    <Base id="skills" from="#3c4250" to="#15181f">
      <path d="M50 62 20 50l30-12 30 12z" fill="#ffb454" />
      <path d="M50 52 20 40l30-12 30 12z" fill="#4fd1a5" />
      <path d="M50 42 20 30l30-12 30 12z" fill="#6aa8ff" />
      <path d="M20 58l30 12 30-12" stroke="#fff" strokeOpacity="0.5" strokeWidth="3" fill="none" strokeLinejoin="round" />
      <path d="M20 66l30 12 30-12" stroke="#fff" strokeOpacity="0.3" strokeWidth="3" fill="none" strokeLinejoin="round" />
    </Base>
  ),
  contact: () => (
    <Base id="contact" from="#6fd3ff" to="#1b7cf2">
      <rect x="18" y="29" width="64" height="44" rx="6" fill="#fff" />
      <path d="M20 33l30 22 30-22" stroke="#1b7cf2" strokeWidth="3.5" fill="none" strokeLinejoin="round" />
      <path d="M20 71l22-18M80 71 58 53" stroke="#b9d9ff" strokeWidth="2.5" />
    </Base>
  ),
  browser: () => (
    <Base id="browser" from="#fdfdfd" to="#dcdfe6">
      <circle cx="50" cy="50" r="33" fill="#1e7df0" />
      <circle cx="50" cy="50" r="33" fill="url(#g-browser-inner)" />
      <defs>
        <radialGradient id="g-browser-inner" cx="0.4" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#8fd1ff" />
          <stop offset="1" stopColor="#1463d8" />
        </radialGradient>
      </defs>
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i / 24) * Math.PI * 2;
        const r1 = i % 2 ? 29 : 27;
        return (
          <line
            key={i}
            x1={50 + Math.cos(a) * r1}
            y1={50 + Math.sin(a) * r1}
            x2={50 + Math.cos(a) * 31}
            y2={50 + Math.sin(a) * 31}
            stroke="#fff"
            strokeOpacity="0.8"
            strokeWidth="1"
          />
        );
      })}
      <path d="M50 50 70 30 55 55z" fill="#ff4b4b" />
      <path d="M50 50 30 70 45 45z" fill="#fff" />
      <circle cx="50" cy="50" r="2.4" fill="#fff" />
    </Base>
  ),
  terminal: () => (
    <Base id="terminal" from="#d7d9de" to="#9ea2ab">
      <rect x="17" y="22" width="66" height="56" rx="6" fill="#16181d" />
      <path d="M27 38l9 7-9 7" stroke="#e8e8e8" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M41 55h14" stroke="#e8e8e8" strokeWidth="4" strokeLinecap="round" />
    </Base>
  ),
  settings: () => (
    <Base id="settings" from="#b7bcc5" to="#6c717b">
      <g transform="translate(50 50)">
        {Array.from({ length: 12 }).map((_, i) => (
          <rect key={i} x="-4" y="-33" width="8" height="12" rx="2" fill="#3f434b" transform={`rotate(${i * 30})`} />
        ))}
        <circle r="24" fill="#3f434b" />
        <circle r="20" fill="#c9cdd4" />
        <circle r="9" fill="#3f434b" />
        <circle r="5" fill="#9aa0a9" />
      </g>
    </Base>
  ),
  trash: () => (
    <svg viewBox="0 0 100 100" className="app-icon-svg" aria-hidden="true">
      <defs>
        <linearGradient id="g-trash" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#dfe4ea" stopOpacity="0.75" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#c7ced8" stopOpacity="0.75" />
        </linearGradient>
      </defs>
      <path d="M24 26h52l-5 60c-.4 3-3 5-6 5H35c-3 0-5.6-2-6-5z" fill="url(#g-trash)" stroke="#9aa3ae" strokeWidth="1.2" />
      <ellipse cx="50" cy="26" rx="27" ry="5" fill="#eef1f5" stroke="#9aa3ae" strokeWidth="1.2" />
      {[34, 42, 50, 58, 66].map((x) => (
        <path key={x} d={`M${x} 34l${(x - 50) * 0.08} 50`} stroke="#9aa3ae" strokeOpacity="0.7" strokeWidth="1.4" />
      ))}
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
