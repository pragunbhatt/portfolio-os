import { useCallback, useEffect, useRef, useState } from 'react';
import Hero from './hero/Hero';
import Desktop from './os/Desktop';
import { useOS } from './os/store';

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export default function App() {
  const phase = useOS((s) => s.phase);
  const osRef = useRef<HTMLDivElement>(null);
  const [autoUnlock, setAutoUnlock] = useState(true);

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('is-in-os', phase === 'desktop');
    if (osRef.current && phase !== 'desk') osRef.current.style.opacity = '1';
  }, [phase]);

  const onProgress = useCallback((p: number) => {
    const s = useOS.getState();
    if (s.phase === 'desktop') return;
    if (osRef.current) osRef.current.style.opacity = String(smoothstep(0.84, 0.965, p));
    if (s.phase === 'desk' && p >= 0.985) {
      setAutoUnlock(true);
      s.setPhase('lock');
    } else if (s.phase === 'lock' && p < 0.95) {
      s.setPhase('desk');
    }
  }, []);

  const onLock = useCallback(() => {
    setAutoUnlock(false);
    useOS.getState().setPhase('lock');
  }, []);

  return (
    <>
      <Hero paused={phase === 'desktop'} onProgress={onProgress} />
      <div ref={osRef} className={`os-wrap phase-${phase}`} style={{ opacity: 0 }}>
        <Desktop visible={phase !== 'desk'} autoUnlock={autoUnlock} onLock={onLock} />
      </div>
    </>
  );
}
