import { useEffect, useRef, useState } from 'react';
import { useOS, type AppId } from './store';
import { apps } from './registry';
import { AppIcon, Glyph } from './icons';
import { launchApp } from './Dock';

export default function Launchpad() {
  const open = useOS((s) => s.launchpad);
  const setOpen = useOS((s) => s.setLaunchpad);
  const [query, setQuery] = useState('');
  const [leaving, setLeaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = (then?: () => void) => {
    setLeaving(true);
    window.setTimeout(() => {
      setLeaving(false);
      setOpen(false);
      setQuery('');
      then?.();
    }, 220);
  };

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // close is stable enough for a keydown listener.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;
  const q = query.trim().toLowerCase();
  const list = apps.filter((a) => a.id !== 'trash' && (!q || a.dockLabel.toLowerCase().includes(q)));

  return (
    <div
      className={`launchpad ${leaving ? 'is-leaving' : ''}`}
      role="dialog"
      aria-label="Apps"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <label className="lp-search">
        <Glyph.Search />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search apps"
          aria-label="Search apps"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && list[0]) close(() => launchApp(list[0].id as AppId));
          }}
        />
      </label>
      <div className="lp-grid" onClick={(e) => e.target === e.currentTarget && close()}>
        {list.map((a, i) => (
          <button
            key={a.id}
            type="button"
            className="lp-app"
            style={{ '--i': i } as React.CSSProperties}
            onClick={() => close(() => launchApp(a.id))}
          >
            <span className="lp-icon">
              <AppIcon id={a.id} />
            </span>
            <span className="lp-label">{a.dockLabel}</span>
          </button>
        ))}
        {list.length === 0 && <p className="lp-empty">No apps match "{query}"</p>}
      </div>
    </div>
  );
}
