'use client';

export default function GasPanel() {
  return (
    <section className="hud-panel card-gas-telemetry" id="panel-gas-readings">
      <div className="panel-header">
        <div className="header-title-wrap">
          <svg
            viewBox="0 0 24 24"
            className="panel-icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"></path>
            <path d="M9.6 4.6A2 2 0 1 1 11 8H2"></path>
            <path d="M12.6 19.4A2 2 0 1 0 14 16H2"></path>
          </svg>
          <h2>Atmospheric Gases</h2>
        </div>
        <div className="header-actions-inline">
          <span className="header-tag-pill safe-state" id="gas-overall-badge">
            Stable
          </span>
          <button className="panel-maximize-btn" title="Expand to full screen">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>
        </div>
      </div>

      <div className="gas-cards-container">
        {/* Carbon Monoxide (CO - MQ-7 Sensor) */}
        <div className="gas-metric-card" id="card-gas-co">
          <div className="gas-card-top-row">
            <div className="gas-title-group">
              <span className="gas-icon-chip icon-co">CO</span>
              <div className="gas-name-group">
                <span className="gas-full">Carbon Monoxide</span>
                <span className="gas-sensor-tag">MQ-7 sensor</span>
              </div>
            </div>
            <span className="gas-status-badge badge-safe" id="badge-co">
              Safe
            </span>
          </div>
          <div className="gas-card-mid-row">
            <div className="gas-threshold-info">NIOSH REL 35 ppm · PEL 50 ppm</div>
            <div className="gas-val-wrap">
              <span className="gas-value" id="val-gas-co">
                18
              </span>
              <span className="gas-unit">ppm</span>
            </div>
          </div>
          <div className="gas-level-bar-track">
            <div
              className="gas-level-bar-fill bar-safe"
              id="bar-gas-co"
              style={{ width: '25%' }}
            ></div>
          </div>
        </div>

        {/* Methane (CH4 - MQ-4 Sensor) */}
        <div className="gas-metric-card" id="card-gas-ch4">
          <div className="gas-card-top-row">
            <div className="gas-title-group">
              <span className="gas-icon-chip icon-ch4">CH₄</span>
              <div className="gas-name-group">
                <span className="gas-full">Methane Gas</span>
                <span className="gas-sensor-tag">MQ-4 sensor</span>
              </div>
            </div>
            <span className="gas-status-badge badge-warning" id="badge-ch4">
              Warning
            </span>
          </div>
          <div className="gas-card-mid-row">
            <div className="gas-threshold-info">MSHA action 1.0% · Evac 2.0%</div>
            <div className="gas-val-wrap">
              <span className="gas-value" id="val-gas-ch4">
                1.75
              </span>
              <span className="gas-unit">% LEL</span>
            </div>
          </div>
          <div className="gas-level-bar-track">
            <div
              className="gas-level-bar-fill bar-warning"
              id="bar-gas-ch4"
              style={{ width: '58%' }}
            ></div>
          </div>
        </div>

        {/* Carbon Dioxide (CO2 - SCD40 NDIR Sensor) */}
        <div className="gas-metric-card" id="card-gas-co2">
          <div className="gas-card-top-row">
            <div className="gas-title-group">
              <span className="gas-icon-chip icon-co2">CO₂</span>
              <div className="gas-name-group">
                <span className="gas-full">Carbon Dioxide</span>
                <span className="gas-sensor-tag">SCD40 sensor</span>
              </div>
            </div>
            <span className="gas-status-badge badge-safe" id="badge-co2">
              Safe
            </span>
          </div>
          <div className="gas-card-mid-row">
            <div className="gas-threshold-info">Threshold &lt;5000 ppm (0.5% vol)</div>
            <div className="gas-val-wrap">
              <span className="gas-value" id="val-gas-co2">
                840
              </span>
              <span className="gas-unit">ppm</span>
            </div>
          </div>
          <div className="gas-level-bar-track">
            <div
              className="gas-level-bar-fill bar-safe"
              id="bar-gas-co2"
              style={{ width: '17%' }}
            ></div>
          </div>
        </div>

        {/* Hydrogen Sulphide (H2S - MQ-136 Sensor) */}
        <div className="gas-metric-card" id="card-gas-h2s">
          <div className="gas-card-top-row">
            <div className="gas-title-group">
              <span className="gas-icon-chip icon-h2s">H₂S</span>
              <div className="gas-name-group">
                <span className="gas-full">Hydrogen Sulphide</span>
                <span className="gas-sensor-tag">MQ-136 sensor</span>
              </div>
            </div>
            <span className="gas-status-badge badge-safe" id="badge-h2s">
              Safe
            </span>
          </div>
          <div className="gas-card-mid-row">
            <div className="gas-threshold-info">NIOSH REL 10 ppm · PEL 20 ppm</div>
            <div className="gas-val-wrap">
              <span className="gas-value" id="val-gas-h2s">
                2.4
              </span>
              <span className="gas-unit">ppm</span>
            </div>
          </div>
          <div className="gas-level-bar-track">
            <div
              className="gas-level-bar-fill bar-safe"
              id="bar-gas-h2s"
              style={{ width: '12%' }}
            ></div>
          </div>
        </div>

        {/* Oxygen (O2 - ME2-O2 Sensor) */}
        <div className="gas-metric-card" id="card-gas-o2">
          <div className="gas-card-top-row">
            <div className="gas-title-group">
              <span className="gas-icon-chip icon-o2">O₂</span>
              <div className="gas-name-group">
                <span className="gas-full">Oxygen Level</span>
                <span className="gas-sensor-tag">ME2-O2 sensor</span>
              </div>
            </div>
            <span className="gas-status-badge badge-safe" id="badge-o2">
              Safe
            </span>
          </div>
          <div className="gas-card-mid-row">
            <div className="gas-threshold-info">OSHA Min 19.5% · Ambient 20.9%</div>
            <div className="gas-val-wrap">
              <span className="gas-value" id="val-gas-o2">
                20.9
              </span>
              <span className="gas-unit">% vol</span>
            </div>
          </div>
          <div className="gas-level-bar-track">
            <div
              className="gas-level-bar-fill bar-safe"
              id="bar-gas-o2"
              style={{ width: '84%' }}
            ></div>
          </div>
        </div>

        {/* Temp & Humidity Dual Strip (SHT31 Sensor) */}
        <div className="env-compact-row">
          <div className="env-chip" id="card-env-temp">
            <div className="env-chip-header">
              <span className="env-chip-lbl">Temp · SHT31</span>
              <span className="env-chip-state ok">Normal</span>
            </div>
            <span className="env-chip-val" id="val-env-temp">
              28.4 °C
            </span>
          </div>
          <div className="env-chip" id="card-env-hum">
            <div className="env-chip-header">
              <span className="env-chip-lbl">Humidity</span>
              <span className="env-chip-state warn">High</span>
            </div>
            <span className="env-chip-val" id="val-env-hum">
              84.2 %
            </span>
          </div>
        </div>

        {/* Real-Time Gas Trend Sparkline */}
        <div className="gas-trend-box">
          <div className="trend-head">
            <span className="trend-title">Concentration (30s)</span>
            <div className="trend-legend">
              <span className="legend-tag ch4">
                <i className="dot-ch4"></i> CH₄
              </span>
              <span className="legend-tag co">
                <i className="dot-co"></i> CO
              </span>
              <span className="legend-tag co2">
                <i className="dot-co2"></i> CO₂
              </span>
              <span className="legend-tag h2s">
                <i className="dot-h2s"></i> H₂S
              </span>
              <span className="legend-tag o2">
                <i className="dot-o2"></i> O₂
              </span>
            </div>
          </div>
          <canvas id="gas-trend-canvas" width="280" height="42"></canvas>
        </div>
      </div>
    </section>
  );
}
