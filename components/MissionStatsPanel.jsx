'use client';

export default function MissionStatsPanel() {
  return (
    <section className="hud-panel card-mission-stats" id="panel-mission-stats">
      <div className="panel-header compact">
        <div className="header-title-wrap">
          <svg
            viewBox="0 0 24 24"
            className="panel-icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <h2>Mission Telemetry</h2>
        </div>
        <div className="header-actions-inline">
          <span className="stats-subtag">Delta-7</span>
          <button className="panel-maximize-btn" title="Expand to full screen">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>
        </div>
      </div>

      <div className="stats-grid-2x2">
        {/* Survivors Located */}
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-icon-chip chip-magenta">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <div className="stat-head">
              <span className="stat-name">Survivors</span>
              <span className="stat-sub">RGB + FLIR</span>
            </div>
          </div>
          <div className="stat-val-group">
            <span className="stat-number highlight-magenta" id="stat-survivors-count">
              2
            </span>
            <span className="stat-suffix">/ 3 est</span>
          </div>
          <div className="stat-foot-note">1 under debris</div>
        </div>

        {/* Hazards Flagged */}
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-icon-chip chip-amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span>
            <div className="stat-head">
              <span className="stat-name">Hazards</span>
              <span className="stat-sub">Gas + Collapse</span>
            </div>
          </div>
          <div className="stat-val-group">
            <span className="stat-number highlight-amber" id="stat-hazards-count">
              3
            </span>
            <span className="stat-suffix">zones</span>
          </div>
          <div className="stat-foot-note">1 critical CH₄</div>
        </div>

        {/* Area Explored */}
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-icon-chip chip-cyan">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </span>
            <div className="stat-head">
              <span className="stat-name">Explored</span>
              <span className="stat-sub">2D Occupancy</span>
            </div>
          </div>
          <div className="stat-val-group">
            <span className="stat-number highlight-cyan" id="stat-area-explored">
              68.4
            </span>
            <span className="stat-suffix">%</span>
          </div>
          <div className="stat-foot-note" id="stat-area-meters">
            1,420 m² mapped
          </div>
        </div>

        {/* Odometry Distance */}
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-icon-chip chip-green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </span>
            <div className="stat-head">
              <span className="stat-name">Distance</span>
              <span className="stat-sub">Nav2 Odom</span>
            </div>
          </div>
          <div className="stat-val-group">
            <span className="stat-number highlight-green" id="stat-dist-traveled">
              384
            </span>
            <span className="stat-suffix">m</span>
          </div>
          <div className="stat-foot-note">Avg 0.68 m/s</div>
        </div>
      </div>
    </section>
  );
}
