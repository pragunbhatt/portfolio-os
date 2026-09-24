import type { ComponentType } from 'react';
import type { AppId, Rect } from './store';
import About from '../apps/About';
import Academics from '../apps/Academics';
import Projects from '../apps/Projects';
import Skills from '../apps/Skills';
import Contact from '../apps/Contact';
import Browser from '../apps/Browser';
import Terminal from '../apps/Terminal';
import Settings from '../apps/Settings';
import Trash from '../apps/Trash';

export type AppDef = {
  id: AppId;
  title: string;
  dockLabel: string;
  size: { w: number; h: number };
  min: { w: number; h: number };
  Component: ComponentType;
  // Apps that draw their own toolbar integrate the traffic lights into it.
  chrome: 'toolbar' | 'plain';
};

export const apps: AppDef[] = [
  { id: 'about', title: 'About Me', dockLabel: 'About Me', size: { w: 720, h: 560 }, min: { w: 420, h: 360 }, Component: About, chrome: 'plain' },
  { id: 'academics', title: 'Academics', dockLabel: 'Academics', size: { w: 760, h: 580 }, min: { w: 440, h: 380 }, Component: Academics, chrome: 'plain' },
  { id: 'projects', title: 'Projects', dockLabel: 'Projects', size: { w: 900, h: 580 }, min: { w: 560, h: 380 }, Component: Projects, chrome: 'toolbar' },
  { id: 'skills', title: 'Skills', dockLabel: 'Skills', size: { w: 820, h: 540 }, min: { w: 520, h: 360 }, Component: Skills, chrome: 'toolbar' },
  { id: 'contact', title: 'New Message', dockLabel: 'Contact', size: { w: 640, h: 560 }, min: { w: 420, h: 400 }, Component: Contact, chrome: 'toolbar' },
  { id: 'browser', title: 'Browser', dockLabel: 'Browser', size: { w: 1000, h: 660 }, min: { w: 480, h: 360 }, Component: Browser, chrome: 'toolbar' },
  { id: 'terminal', title: 'Terminal', dockLabel: 'Terminal', size: { w: 640, h: 420 }, min: { w: 380, h: 240 }, Component: Terminal, chrome: 'plain' },
  { id: 'settings', title: 'System Settings', dockLabel: 'System Settings', size: { w: 780, h: 560 }, min: { w: 560, h: 420 }, Component: Settings, chrome: 'toolbar' },
  { id: 'trash', title: 'Trash', dockLabel: 'Trash', size: { w: 560, h: 380 }, min: { w: 360, h: 260 }, Component: Trash, chrome: 'toolbar' },
];

export const appById = Object.fromEntries(apps.map((a) => [a.id, a])) as Record<AppId, AppDef>;

export const MENUBAR_H = 26;

export function workArea(dockSize: number) {
  const dockReserve = dockSize + 22;
  return {
    x: 0,
    y: MENUBAR_H,
    w: window.innerWidth,
    h: window.innerHeight - MENUBAR_H - dockReserve,
  };
}

let cascade = 0;

export function initialRect(def: AppDef, dockSize: number): Rect {
  const area = workArea(dockSize);
  const w = Math.min(def.size.w, area.w - 40);
  const h = Math.min(def.size.h, area.h - 30);
  const offset = (cascade++ % 6) * 28;
  const x = Math.max(12, Math.round((area.w - w) / 2 - 80 + offset));
  const y = Math.max(area.y + 10, Math.round(area.y + (area.h - h) / 2 - 20 + offset));
  return { x, y, w, h };
}

export function isCompact() {
  return window.matchMedia('(max-width: 767px)').matches;
}
