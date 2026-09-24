import { useState } from 'react';
import { skillGroups } from '../content';
import { Toolbar } from '../os/WindowChrome';
import { Glyph } from '../os/icons';

export default function Skills() {
  const [group, setGroup] = useState<string>('all');
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const groups = skillGroups
    .filter((g) => group === 'all' || g.id === group)
    .map((g) => ({ ...g, skills: g.skills.filter((s) => !q || `${s.name} ${s.usedFor}`.toLowerCase().includes(q)) }))
    .filter((g) => g.skills.length);
  const count = groups.reduce((n, g) => n + g.skills.length, 0);

  return (
    <div className="sysinfo">
      <aside className="finder-side">
        <Toolbar className="side-toolbar" />
        <nav aria-label="Skill categories">
          <p className="side-h">Skills</p>
          <button type="button" className={`side-item ${group === 'all' ? 'is-active' : ''}`} onClick={() => setGroup('all')}>
            Everything
          </button>
          {skillGroups.map((g) => (
            <button key={g.id} type="button" className={`side-item ${group === g.id ? 'is-active' : ''}`} onClick={() => setGroup(g.id)}>
              {g.label}
              <span className="side-count">{g.skills.length}</span>
            </button>
          ))}
        </nav>
      </aside>
      <div className="finder-main">
        <Toolbar lights={false} className="main-toolbar" title={group === 'all' ? 'Everything' : skillGroups.find((g) => g.id === group)?.label}>
          <label className="tb-search" data-no-drag>
            <Glyph.Search />
            <input type="search" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search skills" />
          </label>
        </Toolbar>
        <div className="app-scroll si-scroll">
          {groups.length === 0 && (
            <div className="empty">
              <p className="empty-title">Nothing matches "{query}"</p>
              <button type="button" className="btn" onClick={() => setQuery('')}>
                Clear search
              </button>
            </div>
          )}
          {groups.map((g) => (
            <section key={g.id} className="si-group" aria-labelledby={`si-${g.id}`}>
              <h2 id={`si-${g.id}`} className="si-head">
                {g.label}
              </h2>
              <table className="si-table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Used for</th>
                    <th scope="col" className="si-num">
                      Since
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {g.skills.map((s) => (
                    <tr key={s.name}>
                      <td className="si-name">{s.name}</td>
                      <td>{s.usedFor}</td>
                      <td className="si-num">{s.since}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
        <footer className="finder-status">
          {count} {count === 1 ? 'skill' : 'skills'}
        </footer>
      </div>
    </div>
  );
}
