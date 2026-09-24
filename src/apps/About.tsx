import { useRef, useState } from 'react';
import { profile } from '../content';
import { Glyph } from '../os/icons';
import { launchApp } from '../os/Dock';
import { useCopy } from './useCopy';

export default function About() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(0);
  const { copied, copy } = useCopy();

  const onScroll = () => {
    const y = scrollRef.current?.scrollTop ?? 0;
    setCollapsed(Math.min(1, y / 140));
  };

  return (
    <div className="about" style={{ '--c': collapsed } as React.CSSProperties}>
      <div ref={scrollRef} className="about-scroll" onScroll={onScroll}>
        <header className="about-head">
          <div className="about-avatar-wrap" aria-hidden="true">
            <span className="about-aura" />
            <div className="about-avatar">{profile.initials}</div>
          </div>
          <h1 className="about-name">{profile.name}</h1>
          <p className="about-role">
            {profile.role}, {profile.school}
          </p>
          <div className="about-actions">
            <button type="button" className="about-action" onClick={() => launchApp('contact')}>
              <span className="about-action-icon">
                <Glyph.Mail size={17} />
              </span>
              Message
            </button>
            <a className="about-action" href={profile.github} target="_blank" rel="noreferrer">
              <span className="about-action-icon">
                <Glyph.Github size={17} />
              </span>
              GitHub
            </a>
            <a className="about-action" href={profile.linkedin} target="_blank" rel="noreferrer">
              <span className="about-action-icon">
                <Glyph.Linkedin size={16} />
              </span>
              LinkedIn
            </a>
          </div>
        </header>

        <section className="about-section about-bio" aria-label="Bio">
          {profile.bio.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </section>

        <section className="about-section" aria-labelledby="about-now">
          <h2 id="about-now" className="about-h2">
            Right now
          </h2>
          <ul className="about-now">
            {profile.now.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>

        <section className="about-section" aria-labelledby="about-details">
          <h2 id="about-details" className="about-h2">
            Details
          </h2>
          <dl className="about-card">
            <div className="about-row">
              <dt>email</dt>
              <dd>
                <a href={`mailto:${profile.email}`}>{profile.email}</a>
                <button type="button" className="icon-btn" onClick={() => copy(profile.email)} aria-label="Copy email address">
                  {copied ? <Glyph.Check /> : <Glyph.Copy />}
                </button>
              </dd>
            </div>
            <div className="about-row">
              <dt>GitHub</dt>
              <dd>
                <a href={profile.github} target="_blank" rel="noreferrer">
                  @{profile.githubHandle}
                </a>
              </dd>
            </div>
            <div className="about-row">
              <dt>LinkedIn</dt>
              <dd>
                <a href={profile.linkedin} target="_blank" rel="noreferrer">
                  {profile.linkedinHandle}
                </a>
              </dd>
            </div>
            <div className="about-row">
              <dt>studies</dt>
              <dd>
                <button type="button" className="link-btn" onClick={() => launchApp('academics')}>
                  B.Tech CSE, {profile.school}
                </button>
              </dd>
            </div>
            <div className="about-row">
              <dt>based in</dt>
              <dd>{profile.location}</dd>
            </div>
          </dl>
        </section>

        <section className="about-section about-next" aria-label="Keep exploring">
          <button type="button" className="about-next-btn" onClick={() => launchApp('projects')}>
            <span>See what I've built</span>
            <Glyph.ChevronRight />
          </button>
          <button type="button" className="about-next-btn" onClick={() => launchApp('skills')}>
            <span>Browse my skills</span>
            <Glyph.ChevronRight />
          </button>
        </section>
      </div>
    </div>
  );
}
