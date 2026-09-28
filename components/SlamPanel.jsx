'use client';

export default function SlamPanel() {
  return (
    <section className="hud-panel hero-map-panel" id="panel-slam-hero">
      {/* Map Overlay Top Header HUD */}
      <div className="map-hud-header">
        <div className="map-title-block">
          <div className="map-type-tag">
            <span className="live-blink"></span>
            <span>RPLiDAR 2D SLAM</span>
          </div>
        </div>

        <button className="panel-maximize-btn" title="Expand to full screen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        </button>
      </div>

      {/* The Canvas 2D RPLiDAR & SLAM Engine */}
      <div className="canvas-viewport-wrapper" id="slam-canvas-container">
        <canvas id="slam-map-canvas"></canvas>

        {/* Map Inset HUD Overlays */}
        {/* 1. Coordinate & Pose Telemetry HUD */}
        <div className="map-inset-hud top-left-hud">
          <div className="hud-row">
            <span className="hud-k">UAV</span>{' '}
            <span className="hud-v highlight-cyan" id="hud-drone-xy">
              +38.4m, +14.2m
            </span>
          </div>
          <div className="hud-row">
            <span className="hud-k">Alt</span>{' '}
            <span className="hud-v" id="hud-drone-alt">
              1.65m AGL
            </span>
          </div>
          <div className="hud-row">
            <span className="hud-k">Yaw</span>{' '}
            <span className="hud-v" id="hud-drone-yaw">
              148.5° SE
            </span>
            <svg className="yaw-compass" viewBox="0 0 24 24" width="14" height="14">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />
              <line
                id="yaw-compass-needle"
                x1="12"
                y1="12"
                x2="12"
                y2="4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                style={{ transformOrigin: '12px 12px' }}
              />
            </svg>
          </div>
          <div className="hud-row">
            <span className="hud-k">Vel</span>{' '}
            <span className="hud-v highlight-green" id="hud-drone-vel">
              0.72 m/s
            </span>
          </div>
        </div>

        {/* 2. SLAM Legend & Interactive Navigation Hint */}
        <div className="map-inset-hud bottom-left-hud">
          <div className="map-legend">
            <div className="legend-item">
              <span className="leg-box leg-occupied"></span> Rock
            </div>
            <div className="legend-item">
              <span className="leg-box leg-free"></span> Free
            </div>
            <div className="legend-item">
              <span className="leg-box leg-lidar"></span> LiDAR
            </div>
            <div className="legend-item">
              <span className="leg-box leg-path"></span> Path
            </div>
            <div className="legend-item">
              <span className="leg-box leg-survivor"></span> Survivor
            </div>
            <div className="legend-item">
              <span className="leg-box leg-gas"></span> Gas
            </div>
          </div>
        </div>

        {/* 3. Floating Zoom / View Controls (Google-Maps style, always in view) */}
        <div className="map-zoom-actions">
          <button className="map-tool-btn" id="btn-map-zoomin" title="Zoom In (+)">
            +
          </button>
          <button className="map-tool-btn" id="btn-map-zoomout" title="Zoom Out (−)">
            −
          </button>
          <button className="map-tool-btn" id="btn-map-center" title="Center on Drone Position">
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              className="map-center-reticle-svg"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="2.2" />
              <line x1="12" y1="1.5" x2="12" y2="6.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="12" y1="17.5" x2="12" y2="22.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="1.5" y1="12" x2="6.5" y2="12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="17.5" y1="12" x2="22.5" y2="12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <circle cx="12" cy="12" r="2.2" fill="#3898ec" />
            </svg>
          </button>
          <button className="map-tool-btn" id="btn-map-reset" title="Reset View">
            ⟲
          </button>
        </div>

        {/* 4. Target Inspector Popover (dynamic when clicking survivor pins) */}
        <div className="map-target-popover" id="map-target-card" style={{ display: 'none' }}>
          <div className="popover-header">
            <span className="popover-title" id="popover-title">
              SURVIVOR #02
            </span>
            <button className="popover-close" id="btn-popover-close">
              ✕
            </button>
          </div>
          <div className="popover-content" id="popover-content">
            {/* Injected via JS */}
          </div>
        </div>
      </div>

      {/* Bottom Action & Control Bar Dock */}
      <div className="map-bottom-controls">
        <div className="control-actions-group">
          <button
            className="ctrl-btn btn-mission-start"
            id="btn-ctrl-start"
            title="Launch Autonomous SLAM Exploration"
          >
            <svg viewBox="0 0 24 24" className="ctrl-icon" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <span>Start</span>
          </button>

          <button
            className="ctrl-btn btn-mission-pause"
            id="btn-ctrl-pause"
            title="Hold Drone Hover"
          >
            <svg viewBox="0 0 24 24" className="ctrl-icon" fill="currentColor">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
            <span>Hold</span>
          </button>

          <button className="ctrl-btn btn-mission-rtl" id="btn-ctrl-rtl" title="Return to Base">
            <svg
              viewBox="0 0 24 24"
              className="ctrl-icon"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>RTL</span>
          </button>

          <button
            className="ctrl-btn btn-mission-mark"
            id="btn-ctrl-mark"
            title="Mark Location"
          >
            <svg
              viewBox="0 0 24 24"
              className="ctrl-icon"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>Mark</span>
          </button>
        </div>

        {/* Emergency Stop Trigger */}
        <div className="emergency-estop-wrap">
          <button
            className="ctrl-btn btn-emergency-estop"
            id="btn-ctrl-estop"
            title="IMMEDIATE MOTOR CUTOFF & FAILSAFE LANDING"
          >
            <span className="estop-glow"></span>
            <svg
              viewBox="0 0 24 24"
              className="ctrl-icon"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <span>E-Stop</span>
          </button>
        </div>
      </div>
    </section>
  );
}
