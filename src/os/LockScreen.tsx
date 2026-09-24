import { useEffect, useRef, useState } from 'react';
import { profile } from '../content';
import { prefersReducedMotion } from './motion';
import { Glyph } from './icons';
import { paintLockText } from '../lockPaint';

const DOTS = 8;

export default function LockScreen({
  armed,
  interactive,
  onUnlocked,
}: {
  armed: boolean;
  interactive: boolean;
  onUnlocked: () => void;
}) {
  const [now, setNow] = useState(() => new Date());
  const [typed, setTyped] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const done = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const t = window.setInterval(() => {
      const d = new Date();
      setNow((prev) => (prev.getMinutes() === d.getMinutes() ? prev : d));
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  const unlock = () => {
    if (done.current) return;
    done.current = true;
    setTyped(DOTS);
    setLeaving(true);
    window.setTimeout(onUnlocked, prefersReducedMotion() ? 50 : 650);
  };

  useEffect(() => {
    if (!armed) return;
    if (prefersReducedMotion()) {
      unlock();
      return;
    }
    let n = 0;
    const start = window.setTimeout(function tick() {
      n += 1;
      setTyped(n);
      if (n < DOTS) window.setTimeout(tick, 55 + Math.random() * 45);
      else window.setTimeout(unlock, 260);
    }, 450);
    return () => window.clearTimeout(start);
    // unlock is stable for this component's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [armed]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const paint = () => {
      const r = c.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio, 2);
      c.width = Math.round(r.width * dpr);
      c.height = Math.round(r.height * dpr);
      const g = c.getContext('2d')!;
      g.clearRect(0, 0, c.width, c.height);
      paintLockText(g, c.width, c.height, now);
    };
    paint();
    document.fonts?.ready.then(paint);
    window.addEventListener('resize', paint);
    return () => window.removeEventListener('resize', paint);
  }, [now]);

  const date = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`lock ${leaving ? 'is-leaving' : ''}`} onClick={interactive ? unlock : undefined}>
      <div className="lock-screen">
      <div className="lock-top">
        <canvas ref={canvasRef} className="lock-canvas" aria-hidden="true" />
        <p className="sr-only">
          {date}, {time}
        </p>
      </div>
      <div className="lock-user">
        <div className="lock-avatar" aria-hidden="true">
          {profile.initials}
        </div>
        <p className="lock-name">{profile.name}</p>
        <button type="button" className="lock-field" onClick={unlock} aria-label={`Log in as ${profile.name}`}>
          <span className="lock-dots" aria-hidden="true">
            {Array.from({ length: DOTS }).map((_, i) => (
              <span key={i} className={i < typed ? 'is-on' : ''} />
            ))}
          </span>
          <span className="lock-go" aria-hidden="true">
            <Glyph.Arrow />
          </span>
        </button>
        <p className="lock-hint">{typed === 0 ? 'Click to log in' : typed < DOTS ? 'Logging in' : 'Welcome back'}</p>
      </div>
      </div>
    </div>
  );
}
