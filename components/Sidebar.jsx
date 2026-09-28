const NAV_ITEMS = [
  {
    id: 'panel-gas-readings',
    label: 'Atmospheric gases',
    icon: (
      <>
        <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
        <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
        <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
      </>
    ),
  },
  {
    id: 'panel-slam-hero',
    label: 'SLAM map',
    icon: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
  },
  {
    id: 'panel-ai-vision',
    label: 'Dual-spectrum vision',
    icon: (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
  },
  {
    id: 'panel-mission-stats',
    label: 'Mission telemetry',
    icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
  },
  {
    id: 'panel-alerts-feed',
    label: 'Mission event log',
    icon: (
      <>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </>
    ),
  },
];

export default function Sidebar() {
  const focusPanel = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('panel-focus-pulse');
    // eslint-disable-next-line no-void
    void el.offsetWidth;
    el.classList.add('panel-focus-pulse');

    document.querySelectorAll('.sidebar-nav-btn').forEach((b) => b.classList.remove('active'));
    const btn = document.getElementById(`nav-${id}`);
    if (btn) btn.classList.add('active');
  };

  return (
    <nav className="app-sidebar" aria-label="Panel navigation">
      <div className="sidebar-logo">
        <svg viewBox="0 0 24 24" className="sidebar-logo-icon" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M12 2 3 7v6c0 5 4 8.5 9 9 5-.5 9-4 9-9V7l-9-5z" />
        </svg>
      </div>

      <div className="sidebar-nav-group">
        {NAV_ITEMS.map((item, i) => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            className={`sidebar-nav-btn${i === 1 ? ' active' : ''}`}
            title={item.label}
            onClick={() => focusPanel(item.id)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {item.icon}
            </svg>
          </button>
        ))}
      </div>

      <div className="sidebar-nav-group sidebar-nav-bottom">
        <button className="sidebar-nav-btn" title="Settings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </nav>
  );
}
