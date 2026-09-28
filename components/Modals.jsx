'use client';

export default function Modals() {
  return (
    <>
      {/* Emergency E-Stop Confirmation Modal */}
      <div className="modal-backdrop" id="modal-estop" style={{ display: 'none' }}>
        <div className="modal-dialog estop-dialog">
          <div className="modal-alert-icon">⚠️</div>
          <h3 className="modal-title">Confirm hard motor cutoff (E-Stop)</h3>
          <p className="modal-desc">
            Executing Emergency Stop will{' '}
            <strong>immediately cut motor PWM signals</strong> on the Pixhawk 2.4.8 flight
            controller. The drone will execute an unpowered failsafe landing.
          </p>
          <div className="modal-actions">
            <button className="btn-cancel" id="btn-cancel-estop">
              Cancel / Resume
            </button>
            <button className="btn-danger-confirm" id="btn-confirm-estop">
              Confirm hard E-Stop
            </button>
          </div>
        </div>
      </div>

      {/* Mark Location / Tactical POI Modal */}
      <div className="modal-backdrop" id="modal-mark-poi" style={{ display: 'none' }}>
        <div className="modal-dialog">
          <h3 className="modal-title">Mark tactical POI in mine map</h3>
          <p className="modal-desc">
            Drop a labeled waypoint at drone coordinates (X: <span id="mark-x">0.0</span>, Y:{' '}
            <span id="mark-y">0.0</span>).
          </p>
          <div className="input-group">
            <label htmlFor="input-poi-type">Marker type / classification</label>
            <select id="input-poi-type" className="hud-select" defaultValue="SURVIVOR">
              <option value="SURVIVOR">Survivor Detected (Surface RGB)</option>
              <option value="SURVIVOR_DEBRIS">Survivor Trapped Under Debris (FLIR 36.8°C)</option>
              <option value="GAS_SPIKE">Hazardous Gas Pocket (CH₄ / CO)</option>
              <option value="STRUCTURAL">Structural Cave-in / Blockage</option>
              <option value="REFUGE">Mine Refuge Chamber</option>
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="input-poi-notes">Operational notes</label>
            <input
              type="text"
              id="input-poi-notes"
              className="hud-input"
              placeholder="e.g. Thermal heat signature detected under rock rubble"
              defaultValue="FLIR 3.5 radiometric body heat confirmed"
            />
          </div>
          <div className="modal-actions">
            <button className="btn-cancel" id="btn-cancel-poi">
              Cancel
            </button>
            <button className="btn-primary-confirm" id="btn-save-poi">
              Save marker
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
