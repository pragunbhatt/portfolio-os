import type { Rect } from './store';

const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// A genie-style funnel built from clip-path polygons plus a transform, sampled into keyframes.
export function genieKeyframes(win: Rect, icon: DOMRect): Keyframe[] {
  const frames: Keyframe[] = [];
  const iconCx = icon.left + icon.width / 2;
  const winCx = win.x + win.w / 2;
  const dx = iconCx - winCx;
  const dy = icon.top + icon.height * 0.5 - (win.y + win.h);
  const halfIconPct = Math.min(50, ((icon.width * 0.5) / win.w) * 100);
  const bendPct = (dx / win.w) * 100;
  const rows = 14;
  const steps = 16;

  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const pinch = smooth(Math.min(1, t / 0.55));
    const slide = smooth(Math.max(0, (t - 0.3) / 0.7));
    const left: string[] = [];
    const right: string[] = [];
    for (let r = 0; r <= rows; r++) {
      const v = r / rows;
      const p = Math.min(1, pinch * Math.pow(v, 1.6) + slide);
      const bend = bendPct * Math.pow(v, 2) * pinch * (1 - slide);
      const lx = lerp(0, 50 - halfIconPct, p) + bend;
      const rx = lerp(100, 50 + halfIconPct, p) + bend;
      left.push(`${lx.toFixed(2)}% ${(v * 100).toFixed(2)}%`);
      right.unshift(`${rx.toFixed(2)}% ${(v * 100).toFixed(2)}%`);
    }
    const tx = dx * slide;
    const ty = dy * slide;
    const sy = lerp(1, 0.04, slide);
    frames.push({
      offset: t,
      clipPath: `polygon(${[...left, ...right].join(',')})`,
      transform: `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scaleY(${sy.toFixed(3)})`,
      opacity: t > 0.9 ? lerp(1, 0, (t - 0.9) / 0.1) : 1,
    });
  }
  return frames;
}

export function scaleKeyframes(win: Rect, icon: DOMRect): Keyframe[] {
  const dx = icon.left + icon.width / 2 - (win.x + win.w / 2);
  const dy = icon.top + icon.height / 2 - (win.y + win.h / 2);
  const s = Math.max(0.05, icon.width / win.w);
  return [
    { transform: 'translate(0,0) scale(1)', opacity: 1 },
    { transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: 0.2 },
  ];
}

export function launchKeyframes(win: Rect, icon: DOMRect | null): Keyframe[] {
  if (!icon) {
    return [
      { transform: 'scale(0.94)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 },
    ];
  }
  const dx = icon.left + icon.width / 2 - (win.x + win.w / 2);
  const dy = icon.top + icon.height / 2 - (win.y + win.h / 2);
  const s = Math.max(0.06, icon.width / win.w);
  return [
    { transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: 0 },
    { transform: 'translate(0,0) scale(1)', opacity: 1 },
  ];
}
