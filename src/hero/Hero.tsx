import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DeskScene } from './DeskScene';
import { useOS } from '../os/store';
import { wallpapers } from '../wallpapers';
import { profile } from '../content';
import { prefersReducedMotion } from '../os/motion';

gsap.registerPlugin(ScrollTrigger);

type Props = {
  paused: boolean;
  onProgress: (p: number) => void;
};

export default function Hero({ paused, onProgress }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<DeskScene | null>(null);
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  const wallpaper = useOS((s) => s.settings.wallpaper);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const choice = useOS.getState().settings.wallpaper;
    const w = wallpapers.find((x) => choice.kind === 'preset' && x.id === choice.id) ?? wallpapers[0];
    const scene = new DeskScene(canvas, w);
    sceneRef.current = scene;
    scene.start();

    const onResize = () => {
      scene.resize();
      ScrollTrigger.refresh();
    };
    const onMove = (e: PointerEvent) => {
      scene.setPointer((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onMove);

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
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

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

  const skip = () => {
    const el = sectionRef.current;
    if (!el) return;
    window.scrollTo({ top: el.offsetTop + el.offsetHeight - window.innerHeight, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  return (
    <section ref={sectionRef} className="hero" aria-label="Intro">
      <div className="hero-stage">
        <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />
        <div className="hero-vignette" aria-hidden="true" />
        <div ref={copyRef} className="hero-copy">
          <h1 className="hero-name">
            <span>{profile.firstName}</span>
            <span>{profile.name.split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className="hero-sub">
            Computer science undergrad at {profile.school}. This is my desk, and the portfolio is on the screen.
          </p>
        </div>
        <div ref={cueRef} className="hero-cue">
          <span className="hero-cue-line" aria-hidden="true" />
          <span>Scroll to log in</span>
          <button type="button" className="hero-skip" onClick={skip}>
            Skip to desktop
          </button>
        </div>
      </div>
    </section>
  );
}
