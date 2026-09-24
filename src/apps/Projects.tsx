import { useEffect, useMemo, useRef, useState } from 'react';
import { projects, type Project } from '../content';
import { Toolbar } from '../os/WindowChrome';
import { Glyph } from '../os/icons';
import { useOS } from '../os/store';
import { launchApp } from '../os/Dock';
import { isCompact } from '../os/registry';

type Filter = { kind: 'all' } | { kind: 'status'; value: Project['status'] } | { kind: 'tag'; value: string };

function Cover({ p, large = false }: { p: Project; large?: boolean }) {
  return (
    <div
      className={`pj-cover ${large ? 'is-large' : ''}`}
      style={{ '--h': p.hue } as React.CSSProperties}
      aria-hidden="true"
    >
      <div className="pj-cover-window">
        <span />
        <span />
        <span />
      </div>
      <span className="pj-cover-mark">{p.name.slice(0, 1)}</span>
      <span className="pj-cover-glint" />
    </div>
  );
}

function openLink(url: string) {
  useOS.getState().openUrl(url);
  launchApp('browser');
}

export default function Projects() {
  const [filter, setFilter] = useState<Filter>({ kind: 'all' });
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const tags = useMemo(() => Array.from(new Set(projects.flatMap((p) => p.stack))).sort(), []);

  const visible = projects.filter((p) => {
    if (filter.kind === 'status' && p.status !== filter.value) return false;
    if (filter.kind === 'tag' && !p.stack.includes(filter.value)) return false;
    const q = query.trim().toLowerCase();
    if (q && !`${p.name} ${p.summary} ${p.stack.join(' ')}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const previewed = projects.find((p) => p.id === preview) ?? null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inGrid = gridRef.current?.contains(document.activeElement);
      if (!inGrid) return;
      if (e.key === ' ' && selected) {
        e.preventDefault();
        setPreview((p) => (p ? null : selected));
      }
      if (e.key === 'Escape') setPreview(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  const label =
    filter.kind === 'all' ? 'All projects' : filter.kind === 'status' ? filter.value : filter.value;
  const isActive = (f: Filter) => JSON.stringify(f) === JSON.stringify(filter);

  return (
    <div className="finder">
      <aside className="finder-side">
        <Toolbar className="side-toolbar" />
        <nav aria-label="Project filters">
          <p className="side-h">Projects</p>
          {[
            { f: { kind: 'all' } as Filter, l: 'All projects' },
            { f: { kind: 'status', value: 'Shipped' } as Filter, l: 'Shipped' },
            { f: { kind: 'status', value: 'In progress' } as Filter, l: 'In progress' },
            { f: { kind: 'status', value: 'Prototype' } as Filter, l: 'Prototypes' },
          ].map(({ f, l }) => (
            <button key={l} type="button" className={`side-item ${isActive(f) ? 'is-active' : ''}`} onClick={() => setFilter(f)}>
              <span className="side-folder" aria-hidden="true" />
              {l}
            </button>
          ))}
          <p className="side-h">Built with</p>
          {tags.map((t) => {
            const f: Filter = { kind: 'tag', value: t };
            return (
              <button key={t} type="button" className={`side-item ${isActive(f) ? 'is-active' : ''}`} onClick={() => setFilter(f)}>
                <span className="side-tag" style={{ '--h': (t.length * 47) % 360 } as React.CSSProperties} aria-hidden="true" />
                {t}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="finder-main">
        <Toolbar lights={false} className="main-toolbar" title={label}>
          <label className="tb-search" data-no-drag>
            <Glyph.Search />
            <input type="search" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search projects" />
          </label>
        </Toolbar>
        <div
          ref={gridRef}
          className="pj-grid app-scroll"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          {visible.length === 0 && (
            <div className="empty">
              <p className="empty-title">No projects match "{query}"</p>
              <button type="button" className="btn" onClick={() => { setQuery(''); setFilter({ kind: 'all' }); }}>
                Show all projects
              </button>
            </div>
          )}
          {visible.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`pj-item ${selected === p.id ? 'is-selected' : ''}`}
              onClick={() => {
                setSelected(p.id);
                if (isCompact()) setPreview(p.id);
              }}
              onDoubleClick={() => setPreview(p.id)}
              onFocus={() => setSelected(p.id)}
              onPointerMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty('--rx', `${((e.clientY - r.top) / r.height - 0.5) * -10}deg`);
                e.currentTarget.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 12}deg`);
                e.currentTarget.style.setProperty('--gx', `${((e.clientX - r.left) / r.width) * 100}%`);
              }}
              onPointerLeave={(e) => {
                e.currentTarget.style.setProperty('--rx', '0deg');
                e.currentTarget.style.setProperty('--ry', '0deg');
              }}
              aria-label={`${p.name}. ${p.summary} Double-click or press Space to preview.`}
            >
              <Cover p={p} />
              <span className="pj-name">{p.name}</span>
              <span className="pj-sub">
                {p.placeholder ? 'Sample' : p.status}, {p.year}
              </span>
            </button>
          ))}
        </div>
        <footer className="finder-status">
          {visible.length} {visible.length === 1 ? 'item' : 'items'}
          {selected && ', 1 selected. Press Space to preview'}
        </footer>

        {previewed && (
          <div className="ql-scrim" onClick={() => setPreview(null)}>
            <div className="ql" role="dialog" aria-label={`Preview of ${previewed.name}`} onClick={(e) => e.stopPropagation()}>
              <div className="ql-bar">
                <button type="button" className="icon-btn" onClick={() => setPreview(null)} aria-label="Close preview">
                  <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true">
                    <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </button>
                <span className="ql-title">{previewed.name}</span>
              </div>
              <div className="ql-body app-scroll">
                <Cover p={previewed} large />
                <div className="ql-text">
                  <div className="ql-heading">
                    <h2>{previewed.name}</h2>
                    <span className={`status status-${previewed.status.replace(' ', '-').toLowerCase()}`}>{previewed.status}</span>
                    {previewed.placeholder && <span className="tag">Sample</span>}
                  </div>
                  <p className="ql-desc">{previewed.description}</p>
                  <ul className="chips" aria-label="Built with">
                    {previewed.stack.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                  <div className="ql-actions">
                    {previewed.repo && (
                      <button type="button" className="btn btn-primary" onClick={() => openLink(previewed.repo!)}>
                        View code
                      </button>
                    )}
                    {previewed.live && (
                      <button type="button" className="btn" onClick={() => openLink(previewed.live!)}>
                        Open live demo
                      </button>
                    )}
                    {!previewed.repo && !previewed.live && <p className="muted">Links will appear here once added.</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
