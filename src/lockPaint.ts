// Shared by the 3D monitor texture and the DOM lock screen, so both clocks render identically.
export function paintLockText(g: CanvasRenderingContext2D, W: number, H: number, now = new Date()) {
  const date = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const font = '"Inter", system-ui, sans-serif';
  g.save();
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.shadowColor = 'rgba(0,0,0,0.18)';
  g.shadowBlur = H * 0.03;
  g.shadowOffsetY = H * 0.006;
  g.fillStyle = 'rgba(255,255,255,0.92)';
  g.font = `600 ${H * 0.042}px ${font}`;
  g.fillText(date, W / 2, H * 0.16);
  g.font = `700 ${H * 0.2}px ${font}`;
  g.fillStyle = 'rgba(255,255,255,0.86)';
  g.fillText(time, W / 2, H * 0.36);
  g.restore();
  return { date, time };
}
