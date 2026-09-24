import { Toolbar } from '../os/WindowChrome';
import { launchApp } from '../os/Dock';

export default function Trash() {
  return (
    <div className="trash">
      <Toolbar className="main-toolbar" title="Trash" />
      <div className="empty trash-empty">
        <p className="empty-title">Trash is empty</p>
        <p className="muted">Every project so far was worth keeping.</p>
        <button type="button" className="btn" onClick={() => launchApp('projects')}>
          Open Projects
        </button>
      </div>
    </div>
  );
}
