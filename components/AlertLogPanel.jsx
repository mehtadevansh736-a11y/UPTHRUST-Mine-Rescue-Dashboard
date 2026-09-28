'use client';

export default function AlertLogPanel() {
  return (
    <section className="hud-panel card-alerts-feed" id="panel-alerts-feed">
      <div className="panel-header compact">
        <div className="header-title-wrap">
          <svg
            viewBox="0 0 24 24"
            className="panel-icon highlight-red"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <h2>Mission Event Log</h2>
        </div>
        <div className="header-actions-inline">
          <button className="clear-log-btn" id="btn-clear-alerts" title="Acknowledge all alerts">
            Ack all
          </button>
          <button className="panel-maximize-btn" title="Expand to full screen">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>
        </div>
      </div>

      <form className="log-quick-note" id="log-quick-note-form">
        <input
          type="text"
          id="log-quick-note-input"
          className="log-quick-note-input"
          placeholder="Add a manual note to the mission log…"
          autoComplete="off"
        />
        <button type="submit" className="log-quick-note-submit" title="Add note to mission log">
          +
        </button>
      </form>

      {/* Populated by the mission controller (imperative DOM feed) */}
      <div className="alerts-log-scroll" id="alerts-log-container"></div>
    </section>
  );
}
