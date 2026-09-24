import { useEffect, useRef, useState, type ReactNode } from 'react';
import { academics, profile, projects, skillGroups } from '../content';
import { launchApp } from '../os/Dock';
import type { AppId } from '../os/store';
import { rainEnabled, setRain } from '../os/rainSound';

type Line = { id: number; kind: 'in' | 'out' | 'err'; text: ReactNode };

const PROMPT = `${profile.githubHandle}@portfolio ~ %`;
const APP_NAMES: Record<string, AppId> = {
  finder: 'finder',
  about: 'about',
  academics: 'academics',
  projects: 'projects',
  skills: 'skills',
  contact: 'contact',
  mail: 'contact',
  browser: 'browser',
  settings: 'settings',
  trash: 'trash',
};

const HELP = [
  ['whoami', 'who this desktop belongs to'],
  ['about', 'a short bio'],
  ['academics', 'degree and CGPA'],
  ['skills', 'what I work with'],
  ['projects', 'what I have built'],
  ['contact', 'how to reach me'],
  ['open <app>', 'open an app, e.g. open projects'],
  ['neofetch', 'system summary'],
  ['rain', 'turn the rain sounds on or off'],
  ['ls', 'list files'],
  ['clear', 'clear the screen'],
];

let nextId = 0;

function run(raw: string): { out: ReactNode[]; clear?: boolean; err?: boolean } {
  const [cmd, ...args] = raw.trim().split(/\s+/);
  const arg = args.join(' ');
  switch ((cmd ?? '').toLowerCase()) {
    case '':
      return { out: [] };
    case 'help':
      return {
        out: [
          'Commands:',
          ...HELP.map(([c, d]) => (
            <span key={c}>
              <span className="t-accent">{c.padEnd(14, ' ')}</span>
              {d}
            </span>
          )),
        ],
      };
    case 'whoami':
      return { out: [`${profile.name}, ${profile.role.toLowerCase()} at ${profile.school}`] };
    case 'about':
      return { out: profile.bio };
    case 'academics':
      return {
        out: [
          `${academics.degree}`,
          `${academics.school}, ${academics.start} to ${academics.end}`,
          `CGPA ${academics.cgpa} / ${academics.cgpaScale}, semester ${academics.currentSemester} of ${academics.totalSemesters}`,
        ],
      };
    case 'skills':
      return { out: skillGroups.map((g) => `${g.label.padEnd(14, ' ')}${g.skills.map((s) => s.name).join(', ')}`) };
    case 'projects':
      return { out: projects.map((p) => `${p.name.padEnd(22, ' ')}${p.placeholder ? '(sample) ' : ''}${p.summary}`) };
    case 'contact':
      return { out: [`email     ${profile.email}`, `github    ${profile.github}`, `linkedin  ${profile.linkedin}`] };
    case 'ls':
      return { out: ['about.txt  academics.txt  projects/  skills.txt  contact.txt'] };
    case 'cat': {
      const map: Record<string, string> = {
        'about.txt': 'about',
        'academics.txt': 'academics',
        'skills.txt': 'skills',
        'contact.txt': 'contact',
      };
      if (!arg) return { out: ['cat: name a file, e.g. cat about.txt'], err: true };
      if (map[arg]) return run(map[arg]);
      if (arg.startsWith('projects')) return { out: [`cat: ${arg}: Is a directory. Try: projects`], err: true };
      return { out: [`cat: ${arg}: No such file. Try: ls`], err: true };
    }
    case 'cd':
      return { out: arg && arg !== '~' ? [`cd: ${arg}: Nowhere to go. Everything is right here.`] : [] };
    case 'open': {
      const id = APP_NAMES[arg.toLowerCase()];
      if (!id) return { out: [`open: unknown app "${arg}". Apps: ${Object.keys(APP_NAMES).join(', ')}`], err: true };
      window.setTimeout(() => launchApp(id), 120);
      return { out: [`Opening ${arg}…`] };
    }
    case 'neofetch':
      return {
        out: [
          <span key="n" className="t-neo">
            <span className="t-neo-art">{`   ████████
  ██  ██  ██
  ██  PB  ██
  ██  ██  ██
   ████████`}</span>
            <span className="t-neo-info">
              <span className="t-accent">{profile.githubHandle}@portfolio</span>
              {'\n'}OS: Portfolio OS 1.0
              {'\n'}Host: {profile.school}
              {'\n'}Degree: B.Tech CSE, year 2
              {'\n'}CGPA: {academics.cgpa}
              {'\n'}Shell: zsh, sort of
              {'\n'}Uptime: since {academics.start}
            </span>
          </span>,
        ],
      };
    case 'rain': {
      const on = !rainEnabled();
      setRain(on);
      return { out: [on ? 'Rain sounds on. It is raining outside the window too.' : 'Rain sounds off.'] };
    }
    case 'date':
      return { out: [new Date().toString()] };
    case 'echo':
      return { out: [arg] };
    case 'sudo':
      return { out: ['Nice try. This desktop runs on read-only charm.'], err: true };
    case 'exit':
      return { out: ['Close the window with the red button to quit Terminal.'] };
    case 'clear':
      return { out: [], clear: true };
    default:
      return { out: [`zsh: command not found: ${cmd}. Type help for a list.`], err: true };
  }
}

export default function Terminal() {
  const [lines, setLines] = useState<Line[]>(() => [
    { id: nextId++, kind: 'out', text: `Last login: ${new Date().toDateString()} on ttys000` },
    { id: nextId++, kind: 'out', text: 'Type help to see what you can do here.' },
  ]);
  const [value, setValue] = useState('');
  const [past, setPast] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [lines]);

  const submit = () => {
    const res = run(value);
    const entry: Line = { id: nextId++, kind: 'in', text: value };
    if (res.clear) setLines([]);
    else
      setLines((l) => [
        ...l,
        entry,
        ...res.out.map((t) => ({ id: nextId++, kind: res.err ? ('err' as const) : ('out' as const), text: t })),
      ]);
    if (value.trim()) setPast((p) => [value, ...p]);
    setCursor(-1);
    setValue('');
  };

  return (
    <div className="term app-scroll" onClick={() => inputRef.current?.focus()}>
      <div className="term-lines" role="log" aria-live="polite">
        {lines.map((l) =>
          l.kind === 'in' ? (
            <div key={l.id} className="t-line">
              <span className="t-prompt">{PROMPT}</span> {l.text}
            </div>
          ) : (
            <div key={l.id} className={`t-line ${l.kind === 'err' ? 't-err' : ''}`}>
              {l.text}
            </div>
          ),
        )}
      </div>
      <form
        className="t-input"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="term-in" className="t-prompt">
          {PROMPT}
        </label>
        <input
          id="term-in"
          ref={inputRef}
          value={value}
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="off"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              const c = Math.min(past.length - 1, cursor + 1);
              if (c >= 0) {
                setCursor(c);
                setValue(past[c]);
              }
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              const c = cursor - 1;
              setCursor(Math.max(-1, c));
              setValue(c >= 0 ? past[c] : '');
            } else if (e.key === 'l' && e.ctrlKey) {
              e.preventDefault();
              setLines([]);
            }
          }}
          autoFocus
        />
      </form>
      <div ref={endRef} />
    </div>
  );
}
