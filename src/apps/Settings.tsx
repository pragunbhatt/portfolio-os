import { useRef, useState } from 'react';
import { Toolbar } from '../os/WindowChrome';
import { useOS, type Appearance } from '../os/store';
import { wallpaperCss, wallpapers } from '../wallpapers';
import { useWallpaperStyle } from '../os/Desktop';
import { profile } from '../content';

type Pane = 'wallpaper' | 'appearance' | 'dock' | 'about';

const PANES: { id: Pane; label: string; color: string; glyph: React.ReactNode }[] = [
  {
    id: 'wallpaper',
    label: 'Wallpaper',
    color: '#34aadc',
    glyph: (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M2 12l3.5-4 2.5 3 2-2.5L14 12z" fill="#fff" />
        <circle cx="11" cy="5" r="1.6" fill="#fff" />
      </svg>
    ),
  },
  {
    id: 'appearance',
    label: 'Appearance',
    color: '#1c1c1e',
    glyph: (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="5" fill="none" stroke="#fff" strokeWidth="1.5" />
        <path d="M8 3a5 5 0 0 1 0 10z" fill="#fff" />
      </svg>
    ),
  },
  {
    id: 'dock',
    label: 'Desktop and Dock',
    color: '#8e8e93',
    glyph: (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <rect x="2" y="3" width="12" height="10" rx="1.6" fill="none" stroke="#fff" strokeWidth="1.4" />
        <rect x="4.5" y="10" width="7" height="1.6" rx="0.8" fill="#fff" />
      </svg>
    ),
  },
  {
    id: 'about',
    label: 'About',
    color: '#8e8e93',
    glyph: (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="5.5" fill="none" stroke="#fff" strokeWidth="1.4" />
        <path d="M8 7v4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="8" cy="5" r="0.9" fill="#fff" />
      </svg>
    ),
  },
];

const ACCENTS = [
  { name: 'Blue', value: '#0a84ff' },
  { name: 'Purple', value: '#a550a7' },
  { name: 'Pink', value: '#f74f9e' },
  { name: 'Red', value: '#ff5257' },
  { name: 'Orange', value: '#f7821b' },
  { name: 'Yellow', value: '#e8b500' },
  { name: 'Green', value: '#62ba46' },
  { name: 'Graphite', value: '#8c8c8c' },
];

function downscale(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 2200;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('unreadable'));
    };
    img.src = url;
  });
}

function WallpaperPane() {
  const choice = useOS((s) => s.settings.wallpaper);
  const update = useOS((s) => s.updateSettings);
  const current = useWallpaperStyle();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const currentName =
    choice.kind === 'custom' ? 'Your photo' : wallpapers.find((w) => w.id === choice.id)?.name ?? wallpapers[0].name;

  return (
    <div className="set-pane">
      <div className="set-card set-current">
        <div className="set-preview" style={current} aria-hidden="true" />
        <div>
          <p className="set-strong">{currentName}</p>
          <p className="muted">Changes the desktop and the lock screen.</p>
        </div>
      </div>
      <h3 className="set-h">Dynamic wallpapers</h3>
      <div className="set-walls" role="radiogroup" aria-label="Wallpapers">
        {wallpapers.map((w) => {
          const on = choice.kind === 'preset' && choice.id === w.id;
          return (
            <button
              key={w.id}
              type="button"
              role="radio"
              aria-checked={on}
              className={`set-wall ${on ? 'is-on' : ''}`}
              onClick={() => update({ wallpaper: { kind: 'preset', id: w.id } })}
            >
              <span className="set-wall-img" style={{ background: wallpaperCss(w) }} />
              <span className="set-wall-name">{w.name}</span>
            </button>
          );
        })}
        <button type="button" className={`set-wall set-add ${choice.kind === 'custom' ? 'is-on' : ''}`} onClick={() => fileRef.current?.click()}>
          <span className="set-wall-img set-add-img" style={choice.kind === 'custom' ? { backgroundImage: `url(${choice.dataUrl})` } : undefined}>
            {choice.kind !== 'custom' && '+'}
          </span>
          <span className="set-wall-name">{choice.kind === 'custom' ? 'Your photo' : 'Add photo'}</span>
        </button>
      </div>
      {error && (
        <p className="mail-error" role="alert">
          {error}
        </p>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          try {
            const dataUrl = await downscale(f);
            setError('');
            update({ wallpaper: { kind: 'custom', dataUrl } });
          } catch {
            setError("That file couldn't be read as an image. Try a JPG or PNG.");
          }
        }}
      />
    </div>
  );
}

function AppearancePane() {
  const { appearance, accent } = useOS((s) => s.settings);
  const update = useOS((s) => s.updateSettings);
  const modes: { id: Appearance; label: string }[] = [
    { id: 'auto', label: 'Auto' },
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
  ];
  return (
    <div className="set-pane">
      <div className="set-card">
        <p className="set-row-label">Appearance</p>
        <div className="set-modes" role="radiogroup" aria-label="Appearance">
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={appearance === m.id}
              className={`set-mode ${appearance === m.id ? 'is-on' : ''}`}
              onClick={() => update({ appearance: m.id })}
            >
              <span className={`set-mode-img mode-${m.id}`} aria-hidden="true">
                <span />
              </span>
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="set-card">
        <div className="set-row">
          <p className="set-row-label">Accent color</p>
          <div className="set-accents" role="radiogroup" aria-label="Accent color">
            {ACCENTS.map((a) => (
              <button
                key={a.value}
                type="button"
                role="radio"
                aria-checked={accent === a.value}
                aria-label={a.name}
                title={a.name}
                className={`set-accent ${accent === a.value ? 'is-on' : ''}`}
                style={{ '--sw': a.value } as React.CSSProperties}
                onClick={() => update({ accent: a.value })}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DockPane() {
  const { dockSize, magnify, minimizeEffect } = useOS((s) => s.settings);
  const update = useOS((s) => s.updateSettings);
  return (
    <div className="set-pane">
      <div className="set-card set-list">
        <label className="set-row">
          <span className="set-row-label">Size</span>
          <span className="set-slider">
            <span className="muted">Small</span>
            <input type="range" min={40} max={72} value={dockSize} onChange={(e) => update({ dockSize: Number(e.target.value) })} />
            <span className="muted">Large</span>
          </span>
        </label>
        <div className="set-row">
          <span className="set-row-label" id="mag-label">
            Magnification
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={magnify}
            aria-labelledby="mag-label"
            className={`switch ${magnify ? 'is-on' : ''}`}
            onClick={() => update({ magnify: !magnify })}
          >
            <span />
          </button>
        </div>
        <label className="set-row">
          <span className="set-row-label">Minimize windows using</span>
          <select value={minimizeEffect} onChange={(e) => update({ minimizeEffect: e.target.value as 'genie' | 'scale' })}>
            <option value="genie">Genie effect</option>
            <option value="scale">Scale effect</option>
          </select>
        </label>
      </div>
    </div>
  );
}

function AboutPane() {
  return (
    <div className="set-pane set-about">
      <div className="set-about-mark" aria-hidden="true">
        {profile.initials}
      </div>
      <h3 className="set-about-name">Portfolio OS</h3>
      <p className="muted">Version 1.0</p>
      <dl className="set-card set-list set-dl">
        <div className="set-row">
          <dt>Owner</dt>
          <dd>{profile.name}</dd>
        </div>
        <div className="set-row">
          <dt>Built with</dt>
          <dd>React, TypeScript, Three.js, GSAP</dd>
        </div>
        <div className="set-row">
          <dt>Storage</dt>
          <dd>Your settings stay in this browser</dd>
        </div>
      </dl>
    </div>
  );
}

export default function Settings() {
  const [pane, setPane] = useState<Pane>('wallpaper');
  const active = PANES.find((p) => p.id === pane)!;
  return (
    <div className="settings">
      <aside className="finder-side set-side">
        <Toolbar className="side-toolbar" />
        <div className="set-user">
          <span className="set-user-avatar" aria-hidden="true">
            {profile.initials}
          </span>
          <span>
            <span className="set-strong">{profile.name}</span>
            <span className="muted set-user-sub">Portfolio account</span>
          </span>
        </div>
        <nav aria-label="Settings sections">
          {PANES.map((p) => (
            <button key={p.id} type="button" className={`side-item ${pane === p.id ? 'is-active' : ''}`} onClick={() => setPane(p.id)}>
              <span className="set-icon" style={{ background: p.color }}>
                {p.glyph}
              </span>
              {p.label}
            </button>
          ))}
        </nav>
      </aside>
      <div className="finder-main">
        <Toolbar lights={false} className="main-toolbar" title={active.label} />
        <div className="app-scroll set-scroll">
          {pane === 'wallpaper' && <WallpaperPane />}
          {pane === 'appearance' && <AppearancePane />}
          {pane === 'dock' && <DockPane />}
          {pane === 'about' && <AboutPane />}
        </div>
      </div>
    </div>
  );
}
