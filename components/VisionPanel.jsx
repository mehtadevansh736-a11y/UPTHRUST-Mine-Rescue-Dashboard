'use client';

export default function VisionPanel() {
  return (
    <section className="hud-panel card-ai-vision" id="panel-ai-vision">
      <div className="panel-header">
        <div className="header-title-wrap">
          <svg
            viewBox="0 0 24 24"
            className="panel-icon highlight-magenta"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          <h2>Dual-Spectrum Vision</h2>
        </div>

        <div className="header-actions-inline">
          <div className="vision-tab-group">
            <button className="vision-tab active" id="tab-vision-dual" title="View Both Feeds">
              Dual
            </button>
            <button className="vision-tab" id="tab-vision-rgb" title="RGB Optical">
              RGB
            </button>
            <button className="vision-tab" id="tab-vision-thermal" title="FLIR Thermal">
              Thermal
            </button>
          </div>
          <button className="panel-maximize-btn" title="Expand to full screen">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>
        </div>
      </div>

      <div className="dual-camera-grid" id="dual-camera-wrapper">
        {/* A. RGB Optical Camera (Awaiting Video Stream) */}
        <div className="cam-box cam-rgb-box" id="box-cam-rgb">
          <div className="cam-header-tag">
            <span className="cam-rec-dot cam-offline-dot"></span>
            <span>Cam-01 · RGB Optical</span>
            <span className="cam-offline-badge">NO FEED</span>
          </div>
          <canvas id="camera-rgb-canvas" width="480" height="240"></canvas>

          {/* Centered Camera Off / No Video Signal Symbol Overlay */}
          <div className="cam-no-signal-overlay">
            <div className="cam-no-signal-icon-wrap">
              <svg viewBox="0 0 64 64" fill="none" className="cam-off-svg" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M21 14H43L48 21H56C58.76 21 61 23.24 61 26V52C61 54.76 58.76 57 56 57H8C5.24 57 3 54.76 3 52V26C3 23.24 5.24 21 8 21H16L21 14Z"
                  stroke="currentColor"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect x="9" y="27" width="6" height="6" rx="1" fill="currentColor" />
                <circle cx="32" cy="39" r="11" stroke="currentColor" strokeWidth="4.5" />
                <line x1="4" y1="4" x2="60" y2="60" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="cam-no-signal-title">NO CAMERA FEED</span>
            <span className="cam-no-signal-sub">RGB Payload Video Not Integrated</span>
          </div>

          <div className="cam-box-hud">
            <span className="cam-hud-badge">Standby · V4L2 / RTSP</span>
            <span className="cam-hud-sub">Awaiting Camera Stream</span>
          </div>
        </div>

        {/* B. Thermal LWIR Camera (Awaiting Thermal Stream) */}
        <div className="cam-box cam-thermal-box" id="box-cam-thermal">
          <div className="cam-header-tag thermal-tag">
            <span className="cam-rec-dot cam-offline-dot thermal-dot"></span>
            <span>Cam-02 · FLIR LWIR</span>
            <span className="cam-offline-badge thermal-badge">NO FEED</span>
          </div>
          <canvas id="camera-thermal-canvas" width="480" height="240"></canvas>

          {/* Centered Camera Off / No Video Signal Symbol Overlay */}
          <div className="cam-no-signal-overlay">
            <div className="cam-no-signal-icon-wrap">
              <svg viewBox="0 0 64 64" fill="none" className="cam-off-svg" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M21 14H43L48 21H56C58.76 21 61 23.24 61 26V52C61 54.76 58.76 57 56 57H8C5.24 57 3 54.76 3 52V26C3 23.24 5.24 21 8 21H16L21 14Z"
                  stroke="currentColor"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect x="9" y="27" width="6" height="6" rx="1" fill="currentColor" />
                <circle cx="32" cy="39" r="11" stroke="currentColor" strokeWidth="4.5" />
                <line x1="4" y1="4" x2="60" y2="60" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="cam-no-signal-title">NO THERMAL FEED</span>
            <span className="cam-no-signal-sub">FLIR Radiometric Stream Not Integrated</span>
          </div>

          <div className="cam-box-hud thermal-hud">
            <span className="cam-hud-badge thermal-badge">Standby · Radiometric LWIR</span>
            <span className="cam-hud-sub highlight-amber">Awaiting Thermal Stream</span>
          </div>
        </div>
      </div>

      <div className="camera-footer-controls">
        <div className="feed-btn-group">
          <button
            className="cam-btn active"
            id="btn-cam-survivor"
            title="Surface Survivor In Line of Sight"
          >
            Survivor Sight
          </button>
          <button
            className="cam-btn"
            id="btn-cam-debris"
            title="Survivor Trapped Under Rock Rubble"
          >
            Trapped Debris
          </button>
          <button
            className="cam-btn"
            id="btn-cam-drift"
            title="Open Mine Tunnel Exploration"
          >
            Clear Drift
          </button>
        </div>
        <button className="thermal-palette-btn" id="btn-thermal-palette" title="Cycle Thermal Palette">
          🎨 Palette
        </button>
      </div>
    </section>
  );
}
