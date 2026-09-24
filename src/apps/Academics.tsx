import { academics } from '../content';
import { useInView } from './useCopy';

function Gauge({ value, max, animate }: { value: number; max: number; animate: boolean }) {
  const r = 58;
  const c = 2 * Math.PI * r;
  const arc = 0.75;
  const filled = (value / max) * arc;
  return (
    <svg className="gauge" viewBox="0 0 150 150" role="img" aria-label={`CGPA ${value} out of ${max}`}>
      <circle cx="75" cy="75" r={r} className="gauge-track" strokeDasharray={`${c * arc} ${c}`} transform="rotate(135 75 75)" />
      <circle
        cx="75"
        cy="75"
        r={r}
        className="gauge-fill"
        strokeDasharray={`${c * (animate ? filled : 0)} ${c}`}
        transform="rotate(135 75 75)"
      />
      <text x="75" y="80" textAnchor="middle" className="gauge-value">
        {value.toFixed(2)}
      </text>
      <text x="75" y="102" textAnchor="middle" className="gauge-label">
        out of {max}
      </text>
    </svg>
  );
}

export default function Academics() {
  const top = useInView<HTMLDivElement>({ threshold: 0.2 });
  const track = useInView<HTMLOListElement>({ threshold: 0.4 });
  const { currentSemester: cur, totalSemesters: total } = academics;
  const progress = (cur - 1) / (total - 1);

  return (
    <div className="app-scroll academics">
      <div ref={top.ref} className="ac-hero">
        <div className="ac-hero-text">
          <p className="ac-school">{academics.school}</p>
          <h1 className="ac-degree">{academics.degree}</h1>
          <p className="ac-meta">
            {academics.start} to {academics.end}, {academics.place}
          </p>
        </div>
        <div className="ac-gauge-wrap">
          <Gauge value={academics.cgpa} max={academics.cgpaScale} animate={top.inView} />
          <p className="ac-gauge-cap">Cumulative GPA</p>
        </div>
      </div>

      <section className="ac-section" aria-labelledby="ac-sem">
        <div className="ac-section-head">
          <h2 id="ac-sem">Semesters</h2>
          <p>
            Semester {cur} of {total}, in progress
          </p>
        </div>
        <ol
          ref={track.ref}
          className={`ac-track ${track.inView ? 'is-in' : ''}`}
          style={{ '--progress': progress, '--total': total } as React.CSSProperties}
        >
          {Array.from({ length: total }).map((_, i) => {
            const n = i + 1;
            const state = n < cur ? 'done' : n === cur ? 'current' : 'next';
            const gpa = academics.semesters.find((s) => s.sem === n)?.gpa;
            return (
              <li key={n} className={`ac-step is-${state}`} style={{ '--i': i } as React.CSSProperties}>
                <span className="ac-dot" aria-hidden="true" />
                <span className="ac-step-n">{n}</span>
                <span className="ac-step-sub">
                  {state === 'current' ? 'Now' : state === 'done' ? (gpa ? gpa.toFixed(2) : 'Done') : ''}
                </span>
                <span className="sr-only">
                  Semester {n}, {state === 'current' ? 'in progress' : state === 'done' ? 'completed' : 'upcoming'}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="ac-section" aria-labelledby="ac-edu">
        <div className="ac-section-head">
          <h2 id="ac-edu">Education</h2>
        </div>
        <ul className="ac-list">
          <li className="ac-item">
            <span className="ac-year">
              {academics.start} to {academics.end}
            </span>
            <div>
              <p className="ac-item-title">{academics.degree}</p>
              <p className="ac-item-sub">
                {academics.school}. CGPA {academics.cgpa} after two semesters.
              </p>
            </div>
          </li>
          {academics.schooling.map((s) => (
            <li key={s.title} className={`ac-item ${s.placeholder ? 'is-placeholder' : ''}`}>
              <span className="ac-year">{s.year}</span>
              <div>
                <p className="ac-item-title">
                  {s.title}
                  {s.placeholder && <span className="tag">To fill in</span>}
                </p>
                <p className="ac-item-sub">
                  {s.school}. {s.detail}.
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
