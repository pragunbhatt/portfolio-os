import { useEffect, useRef, useState } from 'react';
import { topWindowId, useOS, type AppId } from './store';
import { appById } from './registry';
import { Glyph } from './icons';
import { launchApp } from './Dock';
import { profile } from '../content';

type Item = { label: string; action?: () => void; disabled?: boolean; shortcut?: string } | 'sep';
type Menu = { id: string; label: React.ReactNode; aria: string; bold?: boolean; items: Item[] };

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => {
      const d = new Date();
      setNow((prev) => (prev.getMinutes() === d.getMinutes() ? prev : d));
    }, 1000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

export default function MenuBar({ onLock }: { onLock: () => void }) {
  const windows = useOS((s) => s.windows);
  const [open, setOpen] = useState<string | null>(null);
  const barRef = useRef<HTMLElement>(null);
  const now = useClock();
  const top = topWindowId(windows);
  const appName = top ? appById[top].dockLabel : 'Finder';

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const s = useOS.getState;
  const openIds = Object.keys(windows) as AppId[];

  const menus: Menu[] = [
    {
      id: 'system',
      label: <Glyph.Monogram />,
      aria: 'Pragun menu',
      items: [
        { label: 'About this portfolio', action: () => launchApp('about') },
        'sep',
        { label: 'System Settings…', action: () => launchApp('settings') },
        'sep',
        { label: 'Lock Screen', action: onLock, shortcut: '⌃⌘Q' },
      ],
    },
    {
      id: 'app',
      label: appName,
      aria: `${appName} menu`,
      bold: true,
      items: top
        ? [
            { label: `About ${appName}`, action: () => launchApp('about') },
            'sep',
            { label: `Hide ${appName}`, action: () => s().minimize(top) },
            { label: `Quit ${appName}`, action: () => s().close(top) },
          ]
        : [{ label: 'About this portfolio', action: () => launchApp('about') }],
    },
    {
      id: 'file',
      label: 'File',
      aria: 'File menu',
      items: [
        { label: 'New Message', action: () => launchApp('contact') },
        { label: 'Open Terminal', action: () => launchApp('terminal') },
        'sep',
        { label: 'Close Window', action: () => top && s().close(top), disabled: !top },
      ],
    },
    {
      id: 'window',
      label: 'Window',
      aria: 'Window menu',
      items: [
        { label: 'Minimize', action: () => top && s().minimize(top), disabled: !top },
        'sep',
        ...(openIds.length
          ? openIds.map((id) => ({ label: appById[id].title, action: () => launchApp(id) }))
          : [{ label: 'No open windows', disabled: true }]),
      ],
    },
    {
      id: 'help',
      label: 'Help',
      aria: 'Help menu',
      items: [
        { label: 'Open an app from the Dock', disabled: true },
        { label: 'Type "help" in Terminal', action: () => launchApp('terminal') },
        'sep',
        { label: `Email ${profile.firstName}`, action: () => launchApp('contact') },
      ],
    },
  ];

  const date = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <header ref={barRef} className="menubar" role="menubar" aria-label="Menu bar">
      <div className="mb-left">
        {menus.map((m) => (
          <div key={m.id} className="mb-menu">
            <button
              type="button"
              className={`mb-item ${m.bold ? 'is-bold' : ''} ${open === m.id ? 'is-open' : ''}`}
              aria-haspopup="menu"
              aria-expanded={open === m.id}
              aria-label={m.aria}
              onClick={() => setOpen((o) => (o === m.id ? null : m.id))}
              onMouseEnter={() => open && setOpen(m.id)}
            >
              {m.label}
            </button>
            {open === m.id && (
              <div className="mb-dropdown glass-menu" role="menu">
                {m.items.map((it, i) =>
                  it === 'sep' ? (
                    <div key={i} className="mb-sep" role="separator" />
                  ) : (
                    <button
                      key={i}
                      type="button"
                      role="menuitem"
                      className="mb-option"
                      disabled={it.disabled}
                      onClick={() => {
                        setOpen(null);
                        it.action?.();
                      }}
                    >
                      <span>{it.label}</span>
                      {it.shortcut && <span className="mb-shortcut">{it.shortcut}</span>}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mb-right" aria-label="Status">
        <span className="mb-status" aria-label="Battery 82%">
          <Glyph.Battery />
        </span>
        <span className="mb-status" aria-label="Wi-Fi connected">
          <Glyph.Wifi />
        </span>
        <span className="mb-status" aria-hidden="true">
          <Glyph.Search />
        </span>
        <span className="mb-status" aria-hidden="true">
          <Glyph.Control />
        </span>
        <time className="mb-clock" dateTime={now.toISOString()}>
          <span>{date}</span>
          <span>{time}</span>
        </time>
      </div>
    </header>
  );
}
