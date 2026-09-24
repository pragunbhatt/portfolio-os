import { create } from 'zustand';
import { defaultWallpaper } from '../wallpapers';

export type AppId =
  | 'finder'
  | 'about'
  | 'academics'
  | 'projects'
  | 'skills'
  | 'contact'
  | 'browser'
  | 'terminal'
  | 'settings'
  | 'trash';

export type Rect = { x: number; y: number; w: number; h: number };

export type Win = {
  id: AppId;
  rect: Rect;
  z: number;
  minimized: boolean;
  maximized: boolean;
  restoreRect?: Rect;
  openedAt: number;
};

export type Phase = 'desk' | 'lock' | 'desktop';
export type Appearance = 'light' | 'dark' | 'auto';
export type MinimizeEffect = 'genie' | 'scale';
export type GlassStyle = 'clear' | 'tinted';
export type WallpaperChoice = { kind: 'preset'; id: string } | { kind: 'custom'; dataUrl: string };

export type Settings = {
  wallpaper: WallpaperChoice;
  appearance: Appearance;
  accent: string;
  dockSize: number;
  magnify: boolean;
  minimizeEffect: MinimizeEffect;
  glass: GlassStyle;
  brightness: number;
  widgets: boolean;
};

const SETTINGS_KEY = 'pb-os-settings';

const defaultSettings: Settings = {
  wallpaper: { kind: 'preset', id: defaultWallpaper.id },
  appearance: 'auto',
  accent: '#0a84ff',
  dockSize: 54,
  magnify: true,
  minimizeEffect: 'genie',
  glass: 'clear',
  brightness: 1,
  widgets: true,
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    /* storage unavailable */
  }
  return defaultSettings;
}

function saveSettings(s: Settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable or full (large custom wallpaper) */
  }
}

type OSState = {
  phase: Phase;
  windows: Partial<Record<AppId, Win>>;
  zTop: number;
  bouncing: AppId | null;
  settings: Settings;
  pendingUrl: string | null;
  launchpad: boolean;
  setLaunchpad: (open: boolean) => void;
  setPhase: (p: Phase) => void;
  open: (id: AppId, rect: Rect) => void;
  close: (id: AppId) => void;
  focus: (id: AppId) => void;
  minimize: (id: AppId) => void;
  restore: (id: AppId) => void;
  setRect: (id: AppId, rect: Rect) => void;
  toggleMaximize: (id: AppId, full: Rect) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  openUrl: (url: string) => void;
  clearPendingUrl: () => void;
};

export const useOS = create<OSState>((set, get) => ({
  phase: 'desk',
  windows: {},
  zTop: 10,
  bouncing: null,
  settings: loadSettings(),
  pendingUrl: null,
  launchpad: false,
  setLaunchpad: (launchpad) => set({ launchpad }),

  setPhase: (phase) => set({ phase }),

  open: (id, rect) => {
    const { windows, zTop } = get();
    const existing = windows[id];
    if (existing) {
      if (existing.minimized) get().restore(id);
      else get().focus(id);
      return;
    }
    const z = zTop + 1;
    set({
      zTop: z,
      bouncing: id,
      windows: { ...windows, [id]: { id, rect, z, minimized: false, maximized: false, openedAt: Date.now() } },
    });
    window.setTimeout(() => {
      if (get().bouncing === id) set({ bouncing: null });
    }, 900);
  },

  close: (id) => {
    const windows = { ...get().windows };
    delete windows[id];
    set({ windows });
  },

  focus: (id) => {
    const { windows, zTop } = get();
    const w = windows[id];
    if (!w || w.z === zTop) return;
    set({ zTop: zTop + 1, windows: { ...windows, [id]: { ...w, z: zTop + 1 } } });
  },

  minimize: (id) => {
    const { windows } = get();
    const w = windows[id];
    if (!w) return;
    set({ windows: { ...windows, [id]: { ...w, minimized: true } } });
  },

  restore: (id) => {
    const { windows, zTop } = get();
    const w = windows[id];
    if (!w) return;
    set({ zTop: zTop + 1, windows: { ...windows, [id]: { ...w, minimized: false, z: zTop + 1 } } });
  },

  setRect: (id, rect) => {
    const { windows } = get();
    const w = windows[id];
    if (!w) return;
    set({ windows: { ...windows, [id]: { ...w, rect, maximized: false } } });
  },

  toggleMaximize: (id, full) => {
    const { windows } = get();
    const w = windows[id];
    if (!w) return;
    const next: Win = w.maximized
      ? { ...w, maximized: false, rect: w.restoreRect ?? w.rect }
      : { ...w, maximized: true, restoreRect: w.rect, rect: full };
    set({ windows: { ...windows, [id]: next } });
  },

  updateSettings: (patch) => {
    const settings = { ...get().settings, ...patch };
    saveSettings(settings);
    set({ settings });
  },

  openUrl: (url) => set({ pendingUrl: url }),
  clearPendingUrl: () => set({ pendingUrl: null }),
}));

export function topWindowId(windows: Partial<Record<AppId, Win>>): AppId | null {
  let top: Win | null = null;
  for (const w of Object.values(windows)) {
    if (!w || w.minimized) continue;
    if (!top || w.z > top.z) top = w;
  }
  return top ? top.id : null;
}

// Dock icon elements, used as the target for genie and open animations.
export const dockIconEls = new Map<AppId, HTMLElement>();
