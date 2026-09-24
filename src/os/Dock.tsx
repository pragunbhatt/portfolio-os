import { useCallback, useRef, useState } from 'react';
import { dockIconEls, useOS, type AppId } from './store';
import { apps, appById, initialRect } from './registry';
import { AppIcon, LaunchpadIcon } from './icons';

const MAIN: AppId[] = ['about', 'academics', 'projects', 'skills', 'browser', 'contact', 'terminal', 'settings'];

export function launchApp(id: AppId) {
  const s = useOS.getState();
  const def = appById[id];
  s.open(id, initialRect(def, s.settings.dockSize));
}

export default function Dock() {
  const windows = useOS((s) => s.windows);
  const bouncing = useOS((s) => s.bouncing);
  const size = useOS((s) => s.settings.dockSize);
  const magnify = useOS((s) => s.settings.magnify);
  const listRef = useRef<HTMLUListElement>(null);
  const [hover, setHover] = useState<AppId | 'launchpad' | null>(null);

  const applyScale = useCallback(
    (mouseX: number | null) => {
      const list = listRef.current;
      if (!list) return;
      const items = list.querySelectorAll<HTMLElement>('[data-dock-item]');
      const maxScale = magnify ? 1.55 : 1;
      const range = size * 3;
      items.forEach((item) => {
        let scale = 1;
        if (mouseX !== null && magnify) {
          const r = item.getBoundingClientRect();
          const center = r.left + r.width / 2;
          const d = Math.abs(mouseX - center);
          if (d < range) scale = 1 + (maxScale - 1) * Math.cos((d / range) * (Math.PI / 2)) ** 2;
        }
        item.style.setProperty('--s', scale.toFixed(3));
      });
    },
    [magnify, size],
  );

  const onClick = (id: AppId) => {
    const w = useOS.getState().windows[id];
    if (w && !w.minimized) {
      const top = Object.values(useOS.getState().windows).reduce((a, b) => (b && (!a || b.z > a.z) && !b.minimized ? b : a), undefined as typeof w | undefined);
      if (top?.id === id) {
        useOS.getState().minimize(id);
        return;
      }
    }
    launchApp(id);
  };

  const item = (id: AppId) => {
    const def = apps.find((a) => a.id === id)!;
    const running = Boolean(windows[id]);
    return (
      <li key={id} data-dock-item className="dock-item" style={{ '--base': `${size}px` } as React.CSSProperties}>
        <span className={`dock-tip ${hover === id ? 'is-shown' : ''}`} role="presentation">
          {def.dockLabel}
        </span>
        <button
          type="button"
          ref={(node) => {
            if (node) dockIconEls.set(id, node);
          }}
          className={`dock-btn ${bouncing === id ? 'is-bouncing' : ''}`}
          onClick={() => onClick(id)}
          onMouseEnter={() => setHover(id)}
          onMouseLeave={() => setHover((h) => (h === id ? null : h))}
          onFocus={() => setHover(id)}
          onBlur={() => setHover(null)}
          aria-label={`${def.dockLabel}${running ? ', open' : ''}`}
        >
          <AppIcon id={id} />
        </button>
        <span className={`dock-dot ${running ? 'is-on' : ''}`} aria-hidden="true" />
      </li>
    );
  };

  return (
    <nav className="dock-wrap" aria-label="Dock">
      <ul
        ref={listRef}
        className="dock glass"
        onMouseMove={(e) => applyScale(e.clientX)}
        onMouseLeave={() => applyScale(null)}
      >
        {item('finder')}
        <li data-dock-item className="dock-item" style={{ '--base': `${size}px` } as React.CSSProperties}>
          <span className={`dock-tip ${hover === 'launchpad' ? 'is-shown' : ''}`} role="presentation">
            Apps
          </span>
          <button
            type="button"
            className="dock-btn"
            onClick={() => useOS.getState().setLaunchpad(!useOS.getState().launchpad)}
            onMouseEnter={() => setHover('launchpad')}
            onMouseLeave={() => setHover((h) => (h === 'launchpad' ? null : h))}
            onFocus={() => setHover('launchpad')}
            onBlur={() => setHover(null)}
            aria-label="Apps"
          >
            <LaunchpadIcon />
          </button>
          <span className="dock-dot" aria-hidden="true" />
        </li>
        {MAIN.map(item)}
        <li className="dock-sep" aria-hidden="true" />
        {item('trash')}
      </ul>
    </nav>
  );
}
