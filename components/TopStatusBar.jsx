'use client';

export default function TopStatusBar() {
  return (
    <header id="top-status-bar" className="hud-panel top-bar">
      {/* 1. Left: Team Upthrust Branding */}
      <div className="top-branding">
        <div className="team-brand-badge">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/upthrust_logo.png" alt="Team Upthrust Logo" className="team-logo-img" />
        </div>
        <div className="branding-text">
          <div className="brand-title-row">
            <span className="team-name">UPTHRUST</span>
            <span className="brand-divider">/</span>
            <span className="system-title">Mine Rescue GCS</span>
            <span className="badge-ros">ROS 2 Jazzy</span>
            <span className="badge-drone-id">UAV-01 · Hex</span>
          </div>
          <div className="sub-title">
            <span>Sector Delta-7 (−240m)</span>
            <span className="sub-sep">•</span>
            <span>RPLiDAR SLAM</span>
            <span className="sub-sep">•</span>
            <span>ArduPilot 4.5.1</span>
          </div>
        </div>
      </div>

      {/* 2. Middle: Spread Out Flight Telemetry Status Boxes */}
      <div className="status-group flight-status-group">
        {/* State Box (Green) */}
        <div className="status-chip chip-state" id="badge-drone-state">
          <span className="status-dot pulsing"></span>
          <span className="chip-label">State</span>
          <span className="chip-val highlight-green" id="val-drone-state">
            Armed • Auto
          </span>
        </div>

        {/* Nav Box (Orange / Amber) */}
        <div
          className="status-chip chip-nav"
          id="badge-gps-denied"
          title="GPS-Denied Mine: RPLiDAR 2D SLAM + Optical Flow Fusion"
        >
          <span className="chip-icon">⚡</span>
          <span className="chip-label">Nav</span>
          <span className="chip-val highlight-amber" id="val-gps-mode">
            GPS-denied · SLAM
          </span>
        </div>

        {/* Mode Box (Cyan / Blue) */}
        <div className="status-chip chip-mode">
          <span className="chip-label">Mode</span>
          <span className="chip-val highlight-cyan" id="val-flight-mode">
            Guided
          </span>
        </div>

        {/* Battery Box (Green / Slate) */}
        <div className="status-chip battery-chip" id="block-battery" title="6S LiPo Telemetry">
          <span className="chip-label">Battery</span>
          <div className="mini-batt-track">
            <div className="mini-batt-fill" id="battery-fill" style={{ width: '82%' }}></div>
          </div>
          <span className="chip-val highlight-green" id="val-battery-pct">
            82%
          </span>
          <span className="batt-v-text" id="val-battery-volts">
            22.8V
          </span>
        </div>

        {/* Comms Box (Cyan / Slate) */}
        <div
          className="status-chip comms-chip"
          title="Ubiquiti 5.8GHz Mesh Video & Data Link"
        >
          <span className="signal-bars">
            <i className="bar b1 active"></i>
            <i className="bar b2 active"></i>
            <i className="bar b3 active"></i>
            <i className="bar b4 active"></i>
          </span>
          <span className="chip-label">Comms</span>
          <span className="chip-val highlight-cyan" id="val-mesh-latency">
            Mesh 24ms
          </span>
        </div>
      </div>

      {/* 3. Right: Mission Clock & Action Buttons */}
      <div className="status-group utility-group">
        <div className="clock-display">
          <span className="mission-clock-label">T+</span>
          <span className="mission-timer-val" id="val-mission-timer">
            00:14:38
          </span>
        </div>

        <div className="header-action-btns">
          <button
            id="btn-audio-toggle"
            className="hud-btn-icon"
            title="Toggle Tactical Audio Feedback"
          >
            <svg
              viewBox="0 0 24 24"
              className="icon-svg"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"></path>
            </svg>
          </button>
          <button
            id="btn-fullscreen-toggle"
            className="hud-btn-icon"
            title="Toggle Fullscreen 16:9 View"
          >
            <svg
              viewBox="0 0 24 24"
              className="icon-svg"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
