import { useEffect, useState } from 'react';
import { academics } from '../content';
import { launchApp } from './Dock';

function useSecond() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

function Clock({ now }: { now: Date }) {
  const s = now.getSeconds();
  const m = now.getMinutes() + s / 60;
  const h = (now.getHours() % 12) + m / 60;
  const hand = (deg: number, len: number, w: number, cls: string, back = 0) => (
    <line
      className={`w-hand ${cls}`}
      x1="60"
      y1={60 + back}
      x2="60"
      y2={60 - len}
      strokeWidth={w}
      transform={`rotate(${deg} 60 60)`}
    />
  );
  return (
    <svg viewBox="0 0 120 120" role="img" aria-label={`Clock showing ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}>
      <circle className="w-clock-face" cx="60" cy="60" r="56" />
      {Array.from({ length: 60 }).map((_, i) => (
        <line
          key={i}
          className="w-clock-tick"
          x1="60"
          y1={i % 5 === 0 ? 8 : 7}
          x2="60"
          y2={i % 5 === 0 ? 13 : 10}
          strokeWidth={i % 5 === 0 ? 1.6 : 0.6}
          opacity={i % 5 === 0 ? 0.9 : 0.4}
          transform={`rotate(${i * 6} 60 60)`}
        />
      ))}
      {[12, 3, 6, 9].map((n) => {
        const a = (n / 12) * Math.PI * 2;
        return (
          <text key={n} className="w-clock-num" x={60 + Math.sin(a) * 40} y={60 - Math.cos(a) * 40 + 4} textAnchor="middle">
            {n}
          </text>
        );
      })}
      {hand(h * 30, 28, 3.6, 'w-hand-h')}
      {hand(m * 6, 40, 2.4, 'w-hand-m')}
      {hand(s * 6, 44, 1, 'w-hand-s', 10)}
      <circle cx="60" cy="60" r="2.6" fill="#ff9f0a" />
    </svg>
  );
}

export default function Widgets() {
  const now = useSecond();
  const { currentSemester: cur, totalSemesters: total, cgpa } = academics;
  return (
    <div className="widgets" aria-label="Widgets">
      <button type="button" className="widget glass" onClick={() => launchApp('academics')} aria-label="Calendar, open Academics">
        <span className="w-cal-day">{now.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase()}</span>
        <span className="w-cal-date">{now.getDate()}</span>
        <span className="w-cal-note">{now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
      </button>
      <div className="widget glass w-clock">
        <Clock now={now} />
      </div>
      <button type="button" className="widget glass widget-wide" onClick={() => launchApp('academics')}>
        <span className="w-now-head">
          <span className="w-now-title">Right now</span>
          <span className="w-now-title">CGPA {cgpa}</span>
        </span>
        <span className="w-now-big">Semester {cur} of {total}</span>
        <span className="w-now-meta">
          <span className="w-bar" aria-hidden="true">
            <span style={{ width: `${((cur - 0.5) / total) * 100}%` }} />
          </span>
          {Math.round(((cur - 0.5) / total) * 100)}% of the degree
        </span>
      </button>
    </div>
  );
}
