import { createContext, useContext, type ReactNode } from 'react';

export type WindowCtxValue = {
  title: string;
  active: boolean;
  compact: boolean;
  maximized: boolean;
  onDragStart: (e: React.PointerEvent) => void;
  onTitleDoubleClick: (e: React.MouseEvent) => void;
  close: () => void;
  minimize: () => void;
  zoom: () => void;
};

export const WindowCtx = createContext<WindowCtxValue | null>(null);

export function useWindow() {
  const ctx = useContext(WindowCtx);
  if (!ctx) throw new Error('useWindow must be used inside a Window');
  return ctx;
}

export function TrafficLights() {
  const { close, minimize, zoom, title, compact, maximized } = useWindow();
  return (
    <div className="traffic" data-no-drag>
      <button type="button" className="tl tl-close" onClick={close} aria-label={`Close ${title}`}>
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="M3.5 3.5l5 5M8.5 3.5l-5 5" />
        </svg>
      </button>
      <button type="button" className="tl tl-min" onClick={minimize} aria-label={`Minimize ${title}`}>
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2.8 6h6.4" />
        </svg>
      </button>
      <button
        type="button"
        className="tl tl-zoom"
        onClick={zoom}
        disabled={compact}
        aria-label={maximized ? `Restore ${title} size` : `Zoom ${title}`}
      >
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path className="fill" d="M3.2 8.8V4.6l4.2 4.2zM8.8 3.2v4.2L4.6 3.2z" />
        </svg>
      </button>
    </div>
  );
}

// A draggable toolbar that hosts the traffic lights, for apps with unified title and toolbar areas.
export function Toolbar({
  children,
  className = '',
  title,
  lights = true,
}: {
  children?: ReactNode;
  className?: string;
  title?: ReactNode;
  lights?: boolean;
}) {
  const { onDragStart, onTitleDoubleClick } = useWindow();
  return (
    <div className={`win-toolbar ${className}`} onPointerDown={onDragStart} onDoubleClick={onTitleDoubleClick}>
      {lights && <TrafficLights />}
      {title !== undefined && <div className="win-toolbar-title">{title}</div>}
      {children}
    </div>
  );
}
