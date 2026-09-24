import { useId, useState } from 'react';
import { profile } from '../content';
import { Toolbar } from '../os/WindowChrome';
import { Glyph } from '../os/icons';
import { useCopy } from './useCopy';

export default function Contact() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [flying, setFlying] = useState(false);
  const { copied, copy } = useCopy();
  const bodyId = useId();
  const errId = useId();

  const send = () => {
    if (!body.trim()) {
      setError('Write a message before sending.');
      document.getElementById(bodyId)?.focus();
      return;
    }
    setError('');
    const url = `mailto:${profile.email}?subject=${encodeURIComponent(subject || 'Hello from your portfolio')}&body=${encodeURIComponent(body)}`;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setFlying(true);
    window.setTimeout(
      () => {
        window.location.href = url;
        setFlying(false);
        setSent(true);
      },
      reduce ? 0 : 950,
    );
  };

  return (
    <div className="mail">
      <Toolbar className="mail-toolbar" title={subject || 'New Message'}>
        <div className="tb-group" data-no-drag>
          <button type="button" className="tb-btn tb-send" onClick={send} aria-label="Send message">
            <Glyph.Send />
          </button>
        </div>
      </Toolbar>
      {sent ? (
        <div className="mail-sent">
          <div className="mail-sent-icon" aria-hidden="true">
            <Glyph.Send size={26} />
          </div>
          <h2>Your mail app has the message</h2>
          <p>
            Press send there and it reaches {profile.firstName}. If no mail app opened, copy the address and write from wherever you
            usually do.
          </p>
          <div className="mail-sent-actions">
            <button type="button" className="btn" onClick={() => copy(profile.email)}>
              {copied ? 'Copied' : `Copy ${profile.email}`}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setSent(false);
                setSubject('');
                setBody('');
              }}
            >
              Write another
            </button>
          </div>
        </div>
      ) : (
        <form
          className={`mail-form ${flying ? 'is-flying' : ''}`}
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <div className="mail-field">
            <span className="mail-label">To:</span>
            <span className="mail-to">
              {profile.name}
              <span className="muted">&lt;{profile.email}&gt;</span>
            </span>
            <button type="button" className="icon-btn" onClick={() => copy(profile.email)} aria-label="Copy email address">
              {copied ? <Glyph.Check /> : <Glyph.Copy />}
            </button>
          </div>
          <label className="mail-field">
            <span className="mail-label">Subject:</span>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Hello from your portfolio" />
          </label>
          <label htmlFor={bodyId} className="sr-only">
            Message
          </label>
          <textarea
            id={bodyId}
            className="mail-body"
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              if (error) setError('');
            }}
            placeholder={`Hi ${profile.firstName},`}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errId : undefined}
          />
          {flying && (
            <div className="mail-plane" aria-hidden="true">
              <Glyph.Send size={34} />
            </div>
          )}
          <div className="mail-foot">
            {error ? (
              <p id={errId} className="mail-error" role="alert">
                {error}
              </p>
            ) : (
              <p className="muted">Sending opens your mail app with this message filled in.</p>
            )}
            <div className="mail-links">
              <a href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub profile">
                <Glyph.Github />
              </a>
              <a href={profile.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn profile">
                <Glyph.Linkedin />
              </a>
              <button type="submit" className="btn btn-primary">
                Send
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
