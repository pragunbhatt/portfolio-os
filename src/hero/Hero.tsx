import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DeskScene, type DeskObject } from './DeskScene';
import { useOS } from '../os/store';
import { wallpapers } from '../wallpapers';
import { profile } from '../content';
import { prefersReducedMotion } from '../os/motion';
import { keyClick, rainEnabled, setRain, thunder } from '../os/rainSound';
import { useRainOn } from '../os/useRain';

gsap.registerPlugin(ScrollTrigger);

const FIRST = profile.firstName;
const LAST = profile.name.split(' ').slice(1).join(' ');
const SUB = `Computer science undergrad at ${profile.school}. This is my desk, and the portfolio is on the screen.`;

type Line = 'first' | 'last' | 'sub';
type Typed = { first: number; last: number; sub: number; caret: Line; typing: boolean };
type Step = { key: string; apply: (t: Typed) => Typed; wait: number };

const FULL: Typed = { first: FIRST.length, last: LAST.length, sub: SUB.length, caret: 'sub', typing: false };

// One loop: type the name and line, rest, backspace it all away, then start over.
function cycle(): Step[] {
  const steps: Step[] = [];
  const human = (base: number, spread: number) => base + Math.random() * spread;
  [...FIRST].forEach((ch, i) => steps.push({ key: ch, apply: (t) => ({ ...t, first: i + 1, caret: 'first', typing: true }), wait: human(115, 95) }));
  steps.push({ key: '\n', apply: (t) => ({ ...t, caret: 'last' }), wait: 300 });
  [...LAST].forEach((ch, i) => steps.push({ key: ch, apply: (t) => ({ ...t, last: i + 1, caret: 'last', typing: true }), wait: human(115, 95) }));
  steps.push({ key: '\n', apply: (t) => ({ ...t, caret: 'sub' }), wait: 520 });
  [...SUB].forEach((ch, i) =>
    steps.push({
      key: ch,
      apply: (t) => ({ ...t, sub: i + 1, caret: 'sub', typing: true }),
      wait: /[.,]/.test(ch) ? human(200, 80) : ch === ' ' ? human(60, 40) : human(30, 32),
    }),
  );
  steps.push({ key: '', apply: (t) => ({ ...t, typing: false }), wait: 5200 });
  for (let i = SUB.length - 1; i >= 0; i--) {
    steps.push({ key: 'backspace', apply: (t) => ({ ...t, sub: i, caret: 'sub', typing: true }), wait: 14 });
  }
  steps.push({ key: '', apply: (t) => ({ ...t, caret: 'last' }), wait: 260 });
  for (let i = LAST.length - 1; i >= 0; i--) {
    steps.push({ key: 'backspace', apply: (t) => ({ ...t, last: i, caret: 'last' }), wait: 70 });
  }
  steps.push({ key: '', apply: (t) => ({ ...t, caret: 'first' }), wait: 200 });
  for (let i = FIRST.length - 1; i >= 0; i--) {
    steps.push({ key: 'backspace', apply: (t) => ({ ...t, first: i, caret: 'first' }), wait: 70 });
  }
  steps.push({ key: '', apply: (t) => ({ ...t, typing: false }), wait: 1100 });
  return steps;
}

function Typing({ text, count, caret, typing }: { text: string; count: number; caret: boolean; typing: boolean }) {
  return (
    <span className="ty" aria-hidden="true">
      <span className="ty-ghost">{text}</span>
      <span className="ty-live">
        {text.slice(0, count)}
        {caret && <i className={`ty-caret ${typing ? 'is-typing' : ''}`} />}
      </span>
    </span>
  );
}

const DESK_CONTROLS: { id: DeskObject; label: string }[] = [
  { id: 'lamp', label: 'Toggle the lamp' },
  { id: 'headphones', label: 'Toggle rain sounds' },
  { id: 'window', label: 'Show lightning' },
  { id: 'note', label: 'Next sticky note' },
  { id: 'mug', label: 'Take a sip' },
  { id: 'monitor', label: 'Log in' },
];

type Props = {
  paused: boolean;
  onProgress: (p: number) => void;
};

export default function Hero({ paused, onProgress }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<DeskScene | null>(null);
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  const wallpaper = useOS((s) => s.settings.wallpaper);
  const rainOn = useRainOn();
  const [typed, setTyped] = useState<Typed>(() =>
    prefersReducedMotion() ? FULL : { first: 0, last: 0, sub: 0, caret: 'first', typing: false },
  );

  const skip = () => {
    const el = sectionRef.current;
    if (!el) return;
    window.scrollTo({ top: el.offsetTop + el.offsetHeight - window.innerHeight, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };
  const skipRef = useRef(skip);
  skipRef.current = skip;

  // Type on the 3D keyboard in a loop; each character presses its keycap.
  useEffect(() => {
    if (prefersReducedMotion() || paused) return;
    let steps = cycle();
    let i = 0;
    let timer = window.setTimeout(function tick() {
      if (i >= steps.length) {
        steps = cycle();
        i = 0;
      }
      const step = steps[i++];
      setTyped(step.apply);
      if (step.key) {
        sceneRef.current?.pressKey(step.key);
        keyClick();
      }
      timer = window.setTimeout(tick, step.wait);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const choice = useOS.getState().settings.wallpaper;
    const w = wallpapers.find((x) => choice.kind === 'preset' && x.id === choice.id) ?? wallpapers[0];
    const scene = new DeskScene(canvas, w);
    sceneRef.current = scene;
    scene.setRainOn(rainEnabled());
    scene.onDeskEvent = (e) => {
      if (e.type === 'login') skipRef.current();
      else if (e.type === 'rain') setRain(!rainEnabled());
      else keyClick();
    };
    window.__boot?.progress(0.7);
    scene.onFirstFrame = () => {
      window.__boot?.progress(0.9);
      (document.fonts?.ready ?? Promise.resolve()).then(() => window.__boot?.done());
    };
    scene.start();

    const onResize = () => {
      scene.resize();
      ScrollTrigger.refresh();
    };
    const onMove = (e: PointerEvent) => {
      scene.setPointer((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    };
    // Hovering the canvas shows what each desk object does.
    let raf = 0;
    const onCanvasMove = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const label = e.pointerType === 'touch' ? null : scene.hover(e.clientX, e.clientY);
        canvas.style.cursor = label ? 'pointer' : '';
        const tip = tipRef.current;
        if (!tip) return;
        if (label) {
          tip.textContent = label;
          tip.style.transform = `translate(${e.clientX + 16}px, ${e.clientY + 18}px)`;
          tip.classList.add('is-shown');
        } else tip.classList.remove('is-shown');
      });
    };
    const onCanvasLeave = () => tipRef.current?.classList.remove('is-shown');
    const onCanvasClick = (e: MouseEvent) => {
      if (scene.click(e.clientX, e.clientY)) {
        const label = scene.hover(e.clientX, e.clientY);
        if (tipRef.current && label) tipRef.current.textContent = label;
      }
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('desk-lightning', thunder);
    canvas.addEventListener('pointermove', onCanvasMove);
    canvas.addEventListener('pointerleave', onCanvasLeave);
    canvas.addEventListener('click', onCanvasClick);

    const proxy = { p: 0 };
    const tween = gsap.to(proxy, {
      p: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: prefersReducedMotion() ? true : 0.9,
      },
      onUpdate: () => {
        const p = proxy.p;
        scene.setProgress(p);
        onProgressRef.current(p);
        const fade = Math.max(0, 1 - p / 0.18);
        if (copyRef.current) {
          copyRef.current.style.opacity = String(fade);
          copyRef.current.style.transform = `translateY(${(1 - fade) * -24}px)`;
        }
        if (cueRef.current) cueRef.current.style.opacity = String(Math.max(0, 1 - p / 0.06));
        if (p > 0.2) tipRef.current?.classList.remove('is-shown');
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('desk-lightning', thunder);
      canvas.removeEventListener('pointermove', onCanvasMove);
      canvas.removeEventListener('pointerleave', onCanvasLeave);
      canvas.removeEventListener('click', onCanvasClick);
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.setRainOn(rainOn);
  }, [rainOn]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (paused) scene.stop();
    else scene.start();
  }, [paused]);

  useEffect(() => {
    if (wallpaper.kind !== 'preset') return;
    const w = wallpapers.find((x) => x.id === wallpaper.id);
    if (w) sceneRef.current?.setWallpaper(w);
  }, [wallpaper]);

  return (
    <section ref={sectionRef} className="hero" aria-label="Intro">
      <div className="hero-stage">
        <canvas ref={canvasRef} className="hero-canvas" aria-label="A desk at night. Objects on it can be clicked." role="img" />
        <div className="hero-vignette" aria-hidden="true" />
        <button type="button" className={`hero-sound ${rainOn ? 'is-on' : ''}`} aria-pressed={rainOn} onClick={() => setRain(!rainOn)}>
          <span className="hero-sound-bars" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          {rainOn ? 'Rain sounds on' : 'Play rain sounds'}
        </button>
        <div ref={copyRef} className="hero-copy">
          <h1 className="hero-name" aria-label={profile.name}>
            <Typing text={FIRST} count={typed.first} caret={typed.caret === 'first'} typing={typed.typing} />
            <Typing text={LAST} count={typed.last} caret={typed.caret === 'last'} typing={typed.typing} />
          </h1>
          <p className="hero-sub">
            <span className="sr-only">{SUB}</span>
            <Typing text={SUB} count={typed.sub} caret={typed.caret === 'sub'} typing={typed.typing} />
          </p>
        </div>
        <div className="desk-controls" role="group" aria-label="Desk objects">
          {DESK_CONTROLS.map((c) => (
            <button key={c.id} type="button" onClick={() => sceneRef.current?.activate(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
        <div ref={tipRef} className="desk-tip" aria-hidden="true" />
        <div ref={cueRef} className="hero-cue">
          <span className="hero-cue-line" aria-hidden="true" />
          <span>Scroll to log in, or play with the desk</span>
          <button type="button" className="hero-skip" onClick={skip}>
            Skip to desktop
          </button>
        </div>
      </div>
    </section>
  );
}
