import { useState } from 'react';
import { useOS } from './store';
import { rainVolume, setRain, setRainVolume } from './rainSound';
import { useRainOn } from './useRain';
import { launchApp } from './Dock';

const I = {
  wifi: (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <path d="M1.5 6.2a9.5 9.5 0 0 1 13 0M3.9 8.7a6 6 0 0 1 8.2 0M6.3 11.1a2.6 2.6 0 0 1 3.4 0" />
      <circle cx="8" cy="13.2" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  bt: (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="m4.5 5 7 6-3.5 3V2l3.5 3-7 6" />
    </svg>
  ),
  rain: (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M4.5 9.5a3 3 0 0 1 .4-6 4 4 0 0 1 7.4 1.2 2.4 2.4 0 0 1-.3 4.8z" />
      <path d="M5.5 12l-.7 1.8M8.5 12l-.7 1.8M11.5 12l-.7 1.8" />
    </svg>
  ),
  moon: (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
      <path d="M13.5 10.2A6 6 0 0 1 5.8 2.5a6 6 0 1 0 7.7 7.7z" />
    </svg>
  ),
  sun: (
    <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
      <circle cx="8" cy="8" r="3.2" />
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x="7.3" y="0.6" width="1.4" height="2.6" rx="0.7" transform={`rotate(${i * 45} 8 8)`} />
      ))}
    </svg>
  ),
  speaker: (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
      <path d="M2 6h2.5L8 3v10L4.5 10H2z" />
      <path d="M10.5 5.5a3.5 3.5 0 0 1 0 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  focus: (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
      <path d="M3 2.5h10v11.5l-5-3-5 3z" />
    </svg>
  ),
};

function Slider({ label, value, onChange, icon }: { label: string; value: number; onChange: (v: number) => void; icon: React.ReactNode }) {
  return (
    <div className="cc-tile cc-wide">
      <p className="cc-label">{label}</p>
      <div className="cc-slider">
        <div className="cc-slider-fill" style={{ width: `${Math.max(10, value * 100)}%` }} />
        <span className="cc-slider-icon">{icon}</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(value * 100)}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          aria-label={label}
        />
      </div>
    </div>
  );
}

export default function ControlCenter() {
  const { appearance, brightness } = useOS((s) => s.settings);
  const update = useOS((s) => s.updateSettings);
  const rainOn = useRainOn();
  const [wifi, setWifi] = useState(true);
  const [bt, setBt] = useState(true);
  const [vol, setVol] = useState(rainVolume);
  const dark = appearance === 'dark' || (appearance === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const Toggle = ({ on, onClick, icon, title, sub }: { on: boolean; onClick: () => void; icon: React.ReactNode; title: string; sub: string }) => (
    <button type="button" className={`cc-toggle ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={onClick}>
      <span className="cc-toggle-icon">{icon}</span>
      <span className="cc-toggle-text">
        <b>{title}</b>
        <span>{sub}</span>
      </span>
    </button>
  );

  return (
    <div className="cc glass-menu" role="dialog" aria-label="Control Center">
      <div className="cc-tile cc-toggles">
        <Toggle on={wifi} onClick={() => setWifi(!wifi)} icon={I.wifi} title="Wi-Fi" sub={wifi ? 'VIT-AP Campus' : 'Off'} />
        <Toggle on={bt} onClick={() => setBt(!bt)} icon={I.bt} title="Bluetooth" sub={bt ? 'Headphones' : 'Off'} />
      </div>
      <div className="cc-tile cc-toggles">
        <Toggle
          on={dark}
          onClick={() => update({ appearance: dark ? 'light' : 'dark' })}
          icon={I.moon}
          title="Dark Mode"
          sub={dark ? 'On' : 'Off'}
        />
        <Toggle on={rainOn} onClick={() => setRain(!rainOn)} icon={I.rain} title="Rain sounds" sub={rainOn ? 'Playing' : 'Off'} />
      </div>
      <div className="cc-tile cc-wide cc-focus">
        <span className="cc-focus-icon">{I.focus}</span>
        <span className="cc-toggle-text">
          <b>Focus: Studying</b>
          <span>Semester 3 is in progress</span>
        </span>
      </div>
      <Slider label="Display" value={brightness} onChange={(v) => update({ brightness: Math.max(0.3, v) })} icon={I.sun} />
      <Slider
        label="Sound"
        value={vol}
        onChange={(v) => {
          setVol(v);
          setRainVolume(v);
          if (!rainOn && v > 0) setRain(true);
        }}
        icon={I.speaker}
      />
      <button type="button" className="cc-tile cc-wide cc-more" onClick={() => launchApp('settings')}>
        Open System Settings
      </button>
    </div>
  );
}
