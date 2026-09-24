import { useEffect, useRef, useState } from 'react';
import { bookmarks } from '../content';
import { Toolbar } from '../os/WindowChrome';
import { Glyph } from '../os/icons';
import { useOS } from '../os/store';

const START = 'start:';

// Sites known to refuse being shown inside another page.
const BLOCKED = [
  'google.', 'github.com', 'linkedin.com', 'youtube.com', 'x.com', 'twitter.com', 'facebook.com', 'instagram.com',
  'reddit.com', 'amazon.', 'stackoverflow.com', 'netflix.com', 'apple.com', 'microsoft.com', 'bing.com', 'chatgpt.com',
  'openai.com', 'medium.com', 'notion.so', 'figma.com', 'discord.com', 'whatsapp.com', 'vercel.com', 'spotify.com',
  'claude.ai', 'anthropic.com', 'duckduckgo.com', 'yahoo.com', 'developer.mozilla.org', 'npmjs.com',
];

function normalize(input: string): string {
  const v = input.trim();
  if (!v) return START;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(v)) return `https://${v}`;
  return `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(v)}`;
}

function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function isBlocked(url: string) {
  const h = host(url);
  if (url.includes('openstreetmap.org/export/embed')) return false;
  return BLOCKED.some((b) => (b.endsWith('.') ? h.startsWith(b) || h.includes(`.${b}`) : h === b || h.endsWith(`.${b}`)));
}

export default function Browser() {
  const [nav, setNav] = useState<{ history: string[]; index: number }>({ history: [START], index: 0 });
  const { history, index } = nav;
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const addressRef = useRef<HTMLInputElement>(null);
  const pendingUrl = useOS((s) => s.pendingUrl);
  const current = history[index];

  const go = (url: string) => {
    const next = normalize(url);
    setNav((n) =>
      n.history[n.index] === next ? n : { history: [...n.history.slice(0, n.index + 1), next], index: n.index + 1 },
    );
    setAddress(next === START ? '' : next);
    setLoading(next !== START && !isBlocked(next));
  };

  useEffect(() => {
    if (!pendingUrl) return;
    go(pendingUrl);
    useOS.getState().clearPendingUrl();
  }, [pendingUrl]);

  const step = (d: number) => {
    const i = index + d;
    if (i < 0 || i >= history.length) return;
    setNav((n) => ({ ...n, index: i }));
    const url = history[i];
    setAddress(url === START ? '' : url);
    setLoading(url !== START && !isBlocked(url));
  };

  const blocked = current !== START && isBlocked(current);

  return (
    <div className="browser">
      <Toolbar className="br-toolbar">
        <div className="br-nav tb-group" data-no-drag>
          <button type="button" className="tb-btn" onClick={() => step(-1)} disabled={index === 0} aria-label="Back">
            <Glyph.ChevronLeft />
          </button>
          <button type="button" className="tb-btn" onClick={() => step(1)} disabled={index >= history.length - 1} aria-label="Forward">
            <Glyph.ChevronRight />
          </button>
        </div>
        <form
          className="br-address"
          data-no-drag
          onSubmit={(e) => {
            e.preventDefault();
            go(address);
            addressRef.current?.blur();
          }}
        >
          {current !== START && !blocked && (
            <span className="br-lock" aria-hidden="true">
              <Glyph.Lock />
            </span>
          )}
          <input
            ref={addressRef}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            placeholder="Search Wikipedia or enter website name"
            aria-label="Address"
            spellCheck={false}
          />
          {loading && <span className="br-progress" aria-hidden="true" />}
        </form>
        <div className="br-nav tb-group" data-no-drag>
          <button type="button" className="tb-btn" onClick={() => setReloadKey((k) => k + 1)} disabled={current === START} aria-label="Reload page">
            <Glyph.Reload />
          </button>
          <a
            className="tb-btn"
            href={current === START ? undefined : current}
            target="_blank"
            rel="noreferrer"
            aria-label="Open in a new tab"
            aria-disabled={current === START}
          >
            <Glyph.External />
          </a>
        </div>
      </Toolbar>

      <div className="br-view">
        {current === START ? (
          <div className="br-start app-scroll">
            <h2 className="br-start-h">Favorites</h2>
            <div className="br-favs">
              {bookmarks.map((b) => (
                <button key={b.url} type="button" className="br-fav" onClick={() => go(b.url)}>
                  <span className="br-fav-tile" style={{ '--h': b.hue } as React.CSSProperties}>
                    {b.glyph}
                  </span>
                  <span className="br-fav-name">{b.title}</span>
                </button>
              ))}
            </div>
            <p className="br-start-note">
              Type any address above. Sites that don't allow being embedded, like GitHub and LinkedIn, get a button to open them in a
              new tab instead.
            </p>
          </div>
        ) : blocked ? (
          <div className="br-blocked">
            <div className="br-blocked-icon" aria-hidden="true">
              <Glyph.External size={28} />
            </div>
            <h2>{host(current)} can't open inside this window</h2>
            <p>The site doesn't allow other pages to embed it. Open it in a new tab to keep browsing.</p>
            <a className="btn btn-primary" href={current} target="_blank" rel="noreferrer">
              Open {host(current)} in a new tab
            </a>
          </div>
        ) : (
          <>
            <iframe
              key={`${current}-${reloadKey}`}
              src={current}
              title={`Web page: ${host(current)}`}
              className="br-frame"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              referrerPolicy="no-referrer"
              onLoad={() => setLoading(false)}
            />
            <div className="br-status">
              <span>Page blank? {host(current)} may not allow embedding.</span>
              <a href={current} target="_blank" rel="noreferrer">
                Open in a new tab
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
