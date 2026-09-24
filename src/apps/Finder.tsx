import { useState } from 'react';
import { Toolbar } from '../os/WindowChrome';
import { AppIcon, DocIcon, FolderIcon, Glyph } from '../os/icons';
import { launchApp } from '../os/Dock';
import { isCompact } from '../os/registry';
import type { AppId } from '../os/store';
import { profile, projects } from '../content';

type Place = 'portfolio' | 'applications' | 'desktop';
type Item = { key: string; name: string; kind: string; icon: React.ReactNode; open: AppId };

const APP_ITEMS: { id: AppId; name: string }[] = [
  { id: 'about', name: 'About Me' },
  { id: 'academics', name: 'Academics' },
  { id: 'projects', name: 'Projects' },
  { id: 'skills', name: 'Skills' },
  { id: 'contact', name: 'Mail' },
  { id: 'browser', name: 'Browser' },
  { id: 'terminal', name: 'Terminal' },
  { id: 'settings', name: 'System Settings' },
];

function itemsFor(place: Place): Item[] {
  if (place === 'applications') {
    return APP_ITEMS.map((a) => ({ key: a.id, name: a.name, kind: 'Application', icon: <AppIcon id={a.id} />, open: a.id }));
  }
  if (place === 'desktop') return [];
  return [
    { key: 'about', name: 'About Me.txt', kind: 'Plain text', icon: <DocIcon ext="TXT" />, open: 'about' },
    { key: 'academics', name: 'Academics', kind: 'Folder', icon: <FolderIcon glyph={<path d="M34 50 50 43l16 7-16 7z" />} />, open: 'academics' },
    { key: 'projects', name: 'Projects', kind: `Folder, ${projects.length} items`, icon: <FolderIcon glyph={<path d="M42 44l-7 7 7 7M58 44l7 7-7 7" />} />, open: 'projects' },
    { key: 'skills', name: 'Skills.csv', kind: 'Spreadsheet', icon: <DocIcon ext="CSV" tint="#30b35a" />, open: 'skills' },
    { key: 'contact', name: 'Say hello.eml', kind: 'Email message', icon: <DocIcon ext="EML" tint="#0a84ff" />, open: 'contact' },
  ];
}

const PLACES: { id: Place; label: string; glyph: React.ReactNode }[] = [
  { id: 'portfolio', label: 'Portfolio', glyph: <span className="side-folder" aria-hidden="true" /> },
  {
    id: 'applications',
    label: 'Applications',
    glyph: (
      <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" className="side-glyph">
        <path d="M8 2 3 13h2.3l1-2.4h3.4l1 2.4H13zM7 8.6 8 6l1 2.6z" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'desktop',
    label: 'Desktop',
    glyph: (
      <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" className="side-glyph">
        <rect x="1.5" y="2.5" width="13" height="9" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5.5 14h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function Finder() {
  const [place, setPlace] = useState<Place>('portfolio');
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<'icons' | 'list'>('icons');
  const items = itemsFor(place);
  const label = PLACES.find((p) => p.id === place)!.label;

  const activate = (it: Item) => {
    setSelected(it.key);
    launchApp(it.open);
  };

  return (
    <div className="finder finder-app">
      <aside className="finder-side">
        <Toolbar className="side-toolbar" />
        <nav aria-label="Finder sidebar">
          <p className="side-h">Favorites</p>
          {PLACES.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`side-item ${place === p.id ? 'is-active' : ''}`}
              onClick={() => {
                setPlace(p.id);
                setSelected(null);
              }}
            >
              {p.glyph}
              {p.label}
            </button>
          ))}
          <p className="side-h">Locations</p>
          <button type="button" className="side-item" onClick={() => setPlace('portfolio')}>
            <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" className="side-glyph">
              <rect x="1.5" y="3" width="13" height="8.5" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.3" />
              <path d="M0.5 13h15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            {profile.firstName}'s MacBook
          </button>
        </nav>
      </aside>
      <div className="finder-main">
        <Toolbar lights={false} className="main-toolbar" title={label}>
          <div className="tb-group" data-no-drag role="radiogroup" aria-label="View">
            <button type="button" role="radio" aria-checked={view === 'icons'} className={`tb-btn ${view === 'icons' ? 'is-on' : ''}`} onClick={() => setView('icons')} aria-label="Icons">
              <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
                <rect x="2" y="2" width="5" height="5" rx="1.2" />
                <rect x="9" y="2" width="5" height="5" rx="1.2" />
                <rect x="2" y="9" width="5" height="5" rx="1.2" />
                <rect x="9" y="9" width="5" height="5" rx="1.2" />
              </svg>
            </button>
            <button type="button" role="radio" aria-checked={view === 'list'} className={`tb-btn ${view === 'list' ? 'is-on' : ''}`} onClick={() => setView('list')} aria-label="List">
              <Glyph.Sidebar />
            </button>
          </div>
        </Toolbar>
        <div
          className={`fd-items app-scroll is-${view}`}
          role="listbox"
          aria-label={label}
          onClick={(e) => e.target === e.currentTarget && setSelected(null)}
        >
          {items.length === 0 && (
            <div className="empty">
              <p className="empty-title">Nothing on the desktop</p>
              <p className="muted">Everything lives in Portfolio.</p>
              <button type="button" className="btn" onClick={() => setPlace('portfolio')}>
                Open Portfolio
              </button>
            </div>
          )}
          {view === 'list' && items.length > 0 && (
            <div className="fd-list-head" aria-hidden="true">
              <span>Name</span>
              <span>Kind</span>
            </div>
          )}
          {items.map((it) => (
            <button
              key={it.key}
              type="button"
              role="option"
              aria-selected={selected === it.key}
              className={`fd-item ${selected === it.key ? 'is-selected' : ''}`}
              onClick={() => (isCompact() ? activate(it) : setSelected(it.key))}
              onDoubleClick={() => activate(it)}
              onKeyDown={(e) => e.key === 'Enter' && activate(it)}
            >
              <span className="fd-icon">{it.icon}</span>
              <span className="fd-name">{it.name}</span>
              {view === 'list' && <span className="fd-kind">{it.kind}</span>}
            </button>
          ))}
        </div>
        <footer className="finder-status">
          {items.length} {items.length === 1 ? 'item' : 'items'}
          {selected && ', double-click to open'}
        </footer>
      </div>
    </div>
  );
}
