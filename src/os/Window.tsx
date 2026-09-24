import { Component, memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, type ComponentType, type ReactNode } from 'react';
import { dockIconEls, topWindowId, useOS, type AppId, type Rect } from './store';
import { appById, isCompact, MENUBAR_H, workArea } from './registry';
import { genieKeyframes, launchKeyframes, scaleKeyframes } from './genie';
import { TrafficLights, WindowCtx, type WindowCtxValue } from './WindowChrome';
import { prefersReducedMotion, SPRING, SPRING_SOFT } from './motion';

type Dir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
const DIRS: Dir[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

class AppBoundary extends Component<{ title: string; onQuit: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="empty">
        <p className="empty-title">{this.props.title} quit unexpectedly</p>
        <p className="muted">Reopen it from the Dock to try again.</p>
        <button type="button" className="btn" onClick={this.props.onQuit}>
          Close window
        </button>
      </div>
    );
  }
}

const AppBody = memo(function AppBody({ Component: App }: { Component: ComponentType }) {
  return <App />;
});

function applyRect(el: HTMLElement, r: Rect) {
  el.style.left = `${r.x}px`;
  el.style.top = `${r.y}px`;
  el.style.width = `${r.w}px`;
  el.style.height = `${r.h}px`;
}

export default function Window({ id }: { id: AppId }) {
  const win = useOS((s) => s.windows[id])!;
  const active = useOS((s) => topWindowId(s.windows) === id);
  const dockSize = useOS((s) => s.settings.dockSize);
  const effect = useOS((s) => s.settings.minimizeEffect);
  const def = appById[id];
  const el = useRef<HTMLDivElement>(null);
  const liveRect = useRef<Rect>(win.rect);
  const flipFrom = useRef<Rect | null>(null);
  const wasMinimized = useRef(win.minimized);
  const closing = useRef(false);
  const compact = isCompact();

  liveRect.current = win.rect;

  // Launch animation from the dock icon.
  useLayoutEffect(() => {
    const node = el.current;
    if (!node) return;
    if (win.minimized) {
      node.style.visibility = 'hidden';
      return;
    }
    const icon = dockIconEls.get(id)?.getBoundingClientRect() ?? null;
    const reduce = prefersReducedMotion();
    node.animate(reduce ? [{ opacity: 0 }, { opacity: 1 }] : launchKeyframes(win.rect, compact ? null : icon), {
      duration: reduce ? 150 : 560,
      easing: SPRING,
    });
    node.focus({ preventScroll: true });
    // Mount-only animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Minimize and restore.
  useLayoutEffect(() => {
    const node = el.current;
    if (!node || wasMinimized.current === win.minimized) return;
    wasMinimized.current = win.minimized;
    const icon = dockIconEls.get(id)?.getBoundingClientRect();
    const reduce = prefersReducedMotion();
    const frames = reduce || !icon
      ? [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.9)' }]
      : effect === 'genie' && !compact
        ? genieKeyframes(liveRect.current, icon)
        : scaleKeyframes(liveRect.current, icon);
    node.style.transformOrigin = effect === 'genie' ? '50% 100%' : '50% 50%';
    if (win.minimized) {
      const anim = node.animate(frames, { duration: reduce ? 150 : 560, easing: 'cubic-bezier(0.45, 0, 0.55, 1)', fill: 'forwards' });
      anim.onfinish = () => {
        node.style.visibility = 'hidden';
        anim.cancel();
      };
    } else {
      node.style.visibility = '';
      const anim = node.animate(frames, {
        duration: reduce ? 150 : 480,
        easing: 'cubic-bezier(0.45, 0, 0.55, 1)',
        direction: 'reverse',
      });
      anim.onfinish = () => {
        node.style.transformOrigin = '';
        node.focus({ preventScroll: true });
      };
    }
  }, [win.minimized, id, effect, compact]);

  // Zoom animation: animate from the previous rect to the new one.
  useLayoutEffect(() => {
    const node = el.current;
    const from = flipFrom.current;
    if (!node || !from) return;
    flipFrom.current = null;
    const to = win.rect;
    if (prefersReducedMotion()) return;
    node.style.transformOrigin = '0 0';
    const anim = node.animate(
      [
        { transform: `translate(${from.x - to.x}px, ${from.y - to.y}px) scale(${from.w / to.w}, ${from.h / to.h})` },
        { transform: 'none' },
      ],
      { duration: 520, easing: SPRING_SOFT },
    );
    anim.onfinish = () => (node.style.transformOrigin = '');
  }, [win.rect]);

  const focus = useOS((s) => s.focus);

  const close = useCallback(() => {
    const node = el.current;
    if (!node || closing.current) return;
    closing.current = true;
    const anim = node.animate(
      [
        { opacity: 1, transform: 'scale(1)' },
        { opacity: 0, transform: 'scale(0.95)' },
      ],
      { duration: prefersReducedMotion() ? 80 : 170, easing: 'ease-in', fill: 'forwards' },
    );
    anim.onfinish = () => useOS.getState().close(id);
  }, [id]);

  const minimize = useCallback(() => useOS.getState().minimize(id), [id]);

  const zoom = useCallback(() => {
    if (compact) return;
    const s = useOS.getState();
    const area = workArea(s.settings.dockSize);
    flipFrom.current = s.windows[id]?.rect ?? null;
    s.toggleMaximize(id, { x: area.x + 4, y: area.y + 4, w: area.w - 8, h: area.h - 6 });
  }, [id, compact]);

  const onDragStart = useCallback(
    (e: React.PointerEvent) => {
      if (compact || e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest('button, input, textarea, select, a, [data-no-drag]')) return;
      const node = el.current;
      if (!node) return;
      e.preventDefault();
      const s = useOS.getState();
      const current = s.windows[id];
      if (!current) return;
      let start = { ...current.rect };
      if (current.maximized && current.restoreRect) {
        const rr = current.restoreRect;
        const ratio = (e.clientX - start.x) / start.w;
        start = { x: e.clientX - rr.w * ratio, y: start.y, w: rr.w, h: rr.h };
        applyRect(node, start);
      }
      const ox = e.clientX;
      const oy = e.clientY;
      let next = start;
      let moved = false;
      const move = (ev: PointerEvent) => {
        const dx = ev.clientX - ox;
        const dy = ev.clientY - oy;
        if (!moved && Math.abs(dx) + Math.abs(dy) < 3) return;
        moved = true;
        const maxX = window.innerWidth - 80;
        next = {
          ...start,
          x: Math.min(maxX, Math.max(80 - start.w, start.x + dx)),
          y: Math.min(window.innerHeight - 60, Math.max(MENUBAR_H, start.y + dy)),
        };
        node.style.left = `${next.x}px`;
        node.style.top = `${next.y}px`;
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        document.body.classList.remove('is-dragging');
        if (moved) useOS.getState().setRect(id, next);
      };
      document.body.classList.add('is-dragging');
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    },
    [id, compact],
  );

  const onResizeStart = (dir: Dir) => (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const node = el.current;
    const current = useOS.getState().windows[id];
    if (!node || !current) return;
    const start = { ...current.rect };
    const ox = e.clientX;
    const oy = e.clientY;
    const { min } = def;
    let next = start;
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - ox;
      const dy = ev.clientY - oy;
      let { x, y, w, h } = start;
      if (dir.includes('e')) w = Math.max(min.w, start.w + dx);
      if (dir.includes('s')) h = Math.max(min.h, start.h + dy);
      if (dir.includes('w')) {
        w = Math.max(min.w, start.w - dx);
        x = start.x + start.w - w;
      }
      if (dir.includes('n')) {
        const maxH = start.y + start.h - MENUBAR_H;
        h = Math.min(maxH, Math.max(min.h, start.h - dy));
        y = start.y + start.h - h;
      }
      next = { x, y, w, h };
      applyRect(node, next);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      document.body.classList.remove('is-resizing', `resize-${dir}`);
      useOS.getState().setRect(id, next);
    };
    document.body.classList.add('is-resizing', `resize-${dir}`);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const onTitleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('button, input, a, [data-no-drag]')) return;
      zoom();
    },
    [zoom],
  );

  const ctx = useMemo<WindowCtxValue>(
    () => ({
      title: def.title,
      active,
      compact,
      maximized: win.maximized,
      onDragStart,
      onTitleDoubleClick,
      close,
      minimize,
      zoom,
    }),
    [def.title, active, compact, win.maximized, onDragStart, onTitleDoubleClick, close, minimize, zoom],
  );

  useEffect(() => {
    if (!win.maximized) return;
    const onResize = () => {
      const area = workArea(dockSize);
      useOS.setState((s) => {
        const w = s.windows[id];
        if (!w) return s;
        return { windows: { ...s.windows, [id]: { ...w, rect: { x: area.x + 4, y: area.y + 4, w: area.w - 8, h: area.h - 6 } } } };
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [win.maximized, dockSize, id]);

  const style: React.CSSProperties = compact
    ? { zIndex: win.z }
    : { left: win.rect.x, top: win.rect.y, width: win.rect.w, height: win.rect.h, zIndex: win.z };

  return (
    <WindowCtx.Provider value={ctx}>
      <div
        ref={el}
        className={`window app-${id} ${active ? 'is-active' : 'is-inactive'} ${win.maximized ? 'is-max' : ''} ${compact ? 'is-compact' : ''}`}
        style={style}
        role="dialog"
        aria-label={def.title}
        aria-hidden={win.minimized || undefined}
        tabIndex={-1}
        onPointerDownCapture={() => focus(id)}
        onFocusCapture={() => focus(id)}
      >
        {def.chrome === 'plain' && (
          <div className="win-titlebar" onPointerDown={onDragStart} onDoubleClick={onTitleDoubleClick}>
            <TrafficLights />
            <div className="win-title">{def.title}</div>
          </div>
        )}
        <div className="win-body">
          <AppBoundary title={def.title} onQuit={close}>
            <AppBody Component={def.Component} />
          </AppBoundary>
        </div>
        {!compact && !win.maximized &&
          DIRS.map((d) => <div key={d} className={`rz rz-${d}`} onPointerDown={onResizeStart(d)} aria-hidden="true" />)}
      </div>
    </WindowCtx.Provider>
  );
}
