import { useEffect, useState } from 'react';
import { useOS, type AppId } from './store';
import { apps } from './registry';
import { wallpaperCss, wallpapers } from '../wallpapers';
import MenuBar from './MenuBar';
import Dock, { launchApp } from './Dock';
import Window from './Window';
import LockScreen from './LockScreen';
import { AppIcon } from './icons';
import { profile } from '../content';
import Widgets from './Widgets';
import Launchpad from './Launchpad';

function useCompact() {
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const on = () => setCompact(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return compact;
}

function useDarkMode() {
  const appearance = useOS((s) => s.settings.appearance);
  const [sysDark, setSysDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const on = () => setSysDark(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return appearance === 'auto' ? sysDark : appearance === 'dark';
}

export function useWallpaperStyle(theme: 'dark' | 'light' = 'dark'): React.CSSProperties {
  const choice = useOS((s) => s.settings.wallpaper);
  if (choice.kind === 'custom') {
    return { backgroundImage: `url(${choice.dataUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  }
  const w = wallpapers.find((x) => x.id === choice.id) ?? wallpapers[0];
  return { background: wallpaperCss(w, theme) };
}

function Welcome({ onOpen }: { onOpen: () => void }) {
  const [shown, setShown] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setShown(false), 9000);
    return () => window.clearTimeout(t);
  }, []);
  if (!shown) return null;
  return (
    <div className="notif glass-menu" role="status">
      <div className="notif-icon">
        <AppIcon id="about" />
      </div>
      <div className="notif-text">
        <p className="notif-title">Welcome to {profile.firstName}'s desktop</p>
        <p className="notif-body">Everything here is an app. Start with About Me, or open any icon in the Dock.</p>
      </div>
      <div className="notif-actions">
        <button
          type="button"
          onClick={() => {
            setShown(false);
            onOpen();
          }}
        >
          Open
        </button>
        <button type="button" onClick={() => setShown(false)}>
          Close
        </button>
      </div>
    </div>
  );
}

function HomeGrid() {
  const ids: AppId[] = apps.filter((a) => a.id !== 'trash').map((a) => a.id);
  return (
    <div className="home-grid">
      {ids.map((id) => {
        const def = apps.find((a) => a.id === id)!;
        return (
          <button key={id} type="button" className="home-app" onClick={() => launchApp(id)}>
            <span className="home-icon">
              <AppIcon id={id} />
            </span>
            <span className="home-label">{def.dockLabel}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function Desktop({ visible, autoUnlock, onLock }: { visible: boolean; autoUnlock: boolean; onLock: () => void }) {
  const phase = useOS((s) => s.phase);
  const windows = useOS((s) => s.windows);
  const accent = useOS((s) => s.settings.accent);
  const dockSize = useOS((s) => s.settings.dockSize);
  const glass = useOS((s) => s.settings.glass);
  const brightness = useOS((s) => s.settings.brightness);
  const showWidgets = useOS((s) => s.settings.widgets);
  const compact = useCompact();
  const dark = useDarkMode();
  const bg = useWallpaperStyle(dark ? 'dark' : 'light');
  const wallChoice = useOS((s) => s.settings.wallpaper);
  const wallDef = wallChoice.kind === 'preset' ? wallpapers.find((w) => w.id === wallChoice.id) : undefined;
  const wallDark = wallChoice.kind === 'custom' || (wallDef?.svg ? dark : (wallDef?.dark ?? true));
  const [welcomed, setWelcomed] = useState(false);
  const unlocked = phase === 'desktop';

  return (
    <div
      className={`os ${unlocked ? 'is-unlocked' : 'is-locked'} ${compact ? 'is-compact' : ''}`}
      data-theme={dark ? 'dark' : 'light'}
      data-wall={wallDark ? 'dark' : 'light'}
      data-glass={glass}
      style={{ '--accent': accent, '--dock-size': `${dockSize}px` } as React.CSSProperties}
      aria-hidden={!visible || undefined}
      inert={!visible || undefined}
    >
      <div className="wallpaper" style={bg} />
      {unlocked && (
        <>
          <MenuBar onLock={onLock} />
          {compact ? <HomeGrid /> : showWidgets && <Widgets />}
          <main className="win-layer" aria-label="Open windows">
            {(Object.keys(windows) as AppId[]).map((id) => (
              <Window key={id} id={id} />
            ))}
          </main>
          {!compact && <Dock />}
          <Launchpad />
          {!welcomed && <Welcome onOpen={() => { setWelcomed(true); launchApp('about'); }} />}
        </>
      )}
      <div className="brightness" style={{ opacity: (1 - brightness) * 0.75 }} aria-hidden="true" />
      {phase !== 'desktop' && (
        <LockScreen
          interactive={phase === 'lock'}
          armed={phase === 'lock' && autoUnlock}
          onUnlocked={() => useOS.getState().setPhase('desktop')}
        />
      )}
    </div>
  );
}
