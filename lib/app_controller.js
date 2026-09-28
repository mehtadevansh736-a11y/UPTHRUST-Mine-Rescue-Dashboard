/**
 * lib/app_controller.js - Master Controller, Mission State Machine, Alert System & Audio Synthesizer
 * AI-Powered Underground Mine Safety, Monitoring & Rescue System
 */

import { SlamMapEngine } from './slam_map';
import { DualCameraVision } from './ai_camera';
import { TelemetryEngine } from './telemetry';

// Global Mission State: 'EXPLORING', 'PAUSED', 'RTL', 'ESTOP', 'MANUAL'
export class MineRescueApp {
  constructor() {
    window.missionState = 'EXPLORING';
    window.audioMuted = false;

    this.missionStartTime = Date.now() - (14 * 60 + 38) * 1000; // default 14m 38s
    this.totalDistanceMeters = 384;
    this.audioContext = null;
    this.abortCtrl = new AbortController();
    this.signal = this.abortCtrl.signal;

    // Ensure persistent light mode clean state
    try {
      localStorage.removeItem('upthrust-theme');
      document.documentElement.removeAttribute('data-theme');
    } catch (e) {}

    // Initialize Event Feed & Audio early so logging and sounds are globally available
    try { this.initAudioContext(); } catch (e) { console.error('initAudioContext error:', e); }
    try { this.initEventFeed(); } catch (e) { console.error('initEventFeed error:', e); }

    // Initialize Core Engines
    try { this.initSlamMap(); } catch (e) { console.error('initSlamMap error:', e); }
    try { this.initAICamera(); } catch (e) { console.error('initAICamera error:', e); }
    try { this.initTelemetry(); } catch (e) { console.error('initTelemetry error:', e); }

    // Initialize UI Controls & Timers
    try { this.initControlButtons(); } catch (e) { console.error('initControlButtons error:', e); }
    try { this.initModals(); } catch (e) { console.error('initModals error:', e); }
    try { this.initKeyboardShortcuts(); } catch (e) { console.error('initKeyboardShortcuts error:', e); }
    try { this.initMissionClock(); } catch (e) { console.error('initMissionClock error:', e); }

    // Multi-stage resize trigger to sync canvas buffer dimensions with CSS grid reflow
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 60);
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 250);
  }

  on(target, type, handler, opts) {
    if (!target) return;
    target.addEventListener(type, handler, { ...opts, signal: this.signal });
  }

  destroy() {
    this.abortCtrl.abort();
    clearInterval(this.clockHandle);
    window.slamMap?.destroy();
    window.aiCamera?.destroy();
    window.telemetry?.destroy();
    window.slamMap = undefined;
    window.aiCamera = undefined;
    window.telemetry = undefined;
    window.logEvent = undefined;
    window.playSynthSound = undefined;
    window.dispatchRescueTeam = undefined;
    if (this.audioContext) this.audioContext.close().catch(() => {});
  }

  /* -------------------------------------------------------------------------
     AUDIO SYNTHESIZER (Web Audio API - Clicks, Sonar, Alert Sirens)
     ------------------------------------------------------------------------- */
  initAudioContext() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    } catch (e) {
      console.warn('AudioContext not supported or blocked:', e);
    }

    const btnAudio = document.getElementById('btn-audio-toggle');
    if (btnAudio) {
      this.on(btnAudio, 'click', () => {
        window.audioMuted = !window.audioMuted;
        btnAudio.style.color = window.audioMuted ? 'var(--text-muted)' : 'var(--cyan-primary)';
        btnAudio.style.borderColor = window.audioMuted ? 'var(--border-card)' : 'var(--cyan-border)';
        this.logEvent('Info', window.audioMuted ? 'Tactical audio muted' : 'Tactical audio active');
      });
    }

    // Global sound trigger hook
    window.playSynthSound = (type) => this.playSound(type);
  }

  playSound(type) {
    if (window.audioMuted || !this.audioContext) return;
    try {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      const ctx = this.audioContext;
      const now = ctx.currentTime;

      if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'alert') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'estop') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.4);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (e) {
      // Audio errors should not affect dashboard visuals
    }
  }

  /* -------------------------------------------------------------------------
     INITIALIZATION OF SUBSYSTEMS
     ------------------------------------------------------------------------- */
  initSlamMap() {
    window.slamMap = new SlamMapEngine('slam-map-canvas');
  }

  initAICamera() {
    window.aiCamera = new DualCameraVision();
  }

  initTelemetry() {
    window.telemetry = new TelemetryEngine();
  }

  /* -------------------------------------------------------------------------
     EVENT & ALERT LOG FEED SYSTEM
     ------------------------------------------------------------------------- */
  initEventFeed() {
    this.logContainer = document.getElementById('alerts-log-container');
    window.logEvent = (level, message) => this.logEvent(level, message);

    // Initial Historical Events
    this.logEvent('Critical', 'FLIR thermal: 36.8°C body heat detected under Crosscut #4 rubble (trapped survivor)');
    this.logEvent('Warn', 'Methane gas spike detected in Drift North-3 (peak 3.8% LEL)');
    this.logEvent('Info', 'Survivor #01 verified via YOLO26 RGB vision at X 34.2m, Y 12.8m (96.4% conf)');
    this.logEvent('Slam', 'SLAM Toolbox: RPLiDAR 2D occupancy grid updated (sub-map #04 loop closed)');
    this.logEvent('Info', 'GPS-denied subterranean EKF3 optical flow & LiDAR fusion stable');

    const btnClear = document.getElementById('btn-clear-alerts');
    if (btnClear) {
      this.on(btnClear, 'click', () => {
        if (this.logContainer) {
          this.logContainer.innerHTML = '';
          this.logEvent('Info', 'All alert feeds acknowledged by mission commander.');
        }
      });
    }

    // Writable quick-note: operator can type a manual entry straight into the mission log
    const noteForm = document.getElementById('log-quick-note-form');
    const noteInput = document.getElementById('log-quick-note-input');
    if (noteForm && noteInput) {
      this.on(noteForm, 'submit', (e) => {
        e.preventDefault();
        const text = noteInput.value.trim();
        if (!text) return;
        this.logEvent('Manual', text);
        noteInput.value = '';
        this.playSound('click');
      });
    }
  }

  logEvent(level, message) {
    if (!this.logContainer) {
      this.logContainer = document.getElementById('alerts-log-container');
      if (!this.logContainer) return;
    }

    const timeStr = new Date().toTimeString().split(' ')[0];
    const logItem = document.createElement('div');
    logItem.className = `log-item ${(level || 'info').toLowerCase()}`;

    logItem.innerHTML = `
      <div class="log-header-row">
        <span class="log-tag">${level}</span>
        <span class="log-time">${timeStr}</span>
      </div>
      <div class="log-msg">${message}</div>
    `;

    this.logContainer.prepend(logItem);

    if (this.logContainer.children.length > 25) {
      this.logContainer.removeChild(this.logContainer.lastChild);
    }
  }

  /* -------------------------------------------------------------------------
     MISSION CONTROL BUTTON ACTIONS
     ------------------------------------------------------------------------- */
  initControlButtons() {
    const btnStart = document.getElementById('btn-ctrl-start');
    const btnPause = document.getElementById('btn-ctrl-pause');
    const btnRtl = document.getElementById('btn-ctrl-rtl');
    const btnMark = document.getElementById('btn-ctrl-mark');
    const btnEstop = document.getElementById('btn-ctrl-estop');

    // 1. START / RESUME MISSION
    if (btnStart) {
      this.on(btnStart, 'click', () => {
        window.missionState = 'EXPLORING';
        if (window.slamMap) {
          if (window.slamMap.isRtl || window.slamMap.isCustomGoal) {
            window.slamMap.resumePatrol();
          }
        }
        this.updateMissionStateUI('Armed • Flight', 'GUIDED_NOGPS', 'highlight-green');
        this.logEvent('Info', 'Autonomous RPLiDAR SLAM exploration mission active along Nav2 path.');
        this.playSound('click');
      });
    }

    // 2. PAUSE / HOVER
    if (btnPause) {
      this.on(btnPause, 'click', () => {
        window.missionState = 'PAUSED';
        if (window.slamMap) {
          window.slamMap.pause();
        }
        this.updateMissionStateUI('Hovering', 'LOITER_NOGPS', 'highlight-amber');
        this.logEvent('Warn', 'Drone hold hover commanded. Maintaining position via TF-Luna & Optical Flow.');
        this.playSound('click');
      });
    }

    // 3. RETURN TO BASE (RTL)
    if (btnRtl) {
      this.on(btnRtl, 'click', () => {
        if (window.slamMap) {
          window.slamMap.returnToBase();
        } else {
          window.missionState = 'RTL';
          this.updateMissionStateUI('Returning', 'RTL_SLAM', 'highlight-cyan');
          this.logEvent('Info', 'Autonomous Return to Base (RTL) commanded via explored SLAM trajectory.');
          this.playSound('click');
        }
      });
    }

    // 4. MARK LOCATION POI
    if (btnMark) {
      this.on(btnMark, 'click', () => {
        const modal = document.getElementById('modal-mark-poi');
        const markX = document.getElementById('mark-x');
        const markY = document.getElementById('mark-y');
        if (modal && window.slamMap) {
          if (markX) markX.textContent = window.slamMap.drone.x.toFixed(1);
          if (markY) markY.textContent = window.slamMap.drone.y.toFixed(1);
          modal.style.display = 'flex';
        }
        this.playSound('click');
      });
    }

    // 5. EMERGENCY STOP (E-STOP)
    if (btnEstop) {
      this.on(btnEstop, 'click', () => {
        const modal = document.getElementById('modal-estop');
        if (modal) modal.style.display = 'flex';
        this.playSound('alert');
      });
    }

    // Fullscreen Toggle
    const btnFullscreen = document.getElementById('btn-fullscreen-toggle');
    if (btnFullscreen) {
      this.on(btnFullscreen, 'click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    // Global rescue dispatch hook
    window.dispatchRescueTeam = (survId) => {
      this.logEvent('Critical', `Rapid extraction team dispatched to coordinates for ${survId}. Heavy shoring equipment en route.`);
      this.playSound('alert');
      const pop = document.getElementById('map-target-card');
      if (pop) pop.style.display = 'none';
    };
  }

  updateMissionStateUI(droneText, flightModeText, colorClass) {
    const elDrone = document.getElementById('val-drone-state');
    const elFlight = document.getElementById('val-flight-mode');

    if (elDrone) {
      elDrone.textContent = droneText;
      elDrone.className = `chip-val ${colorClass}`;
    }
    if (elFlight) elFlight.textContent = flightModeText;
  }

  /* -------------------------------------------------------------------------
     MODALS (E-STOP CONFIRMATION & MARK LOCATION)
     ------------------------------------------------------------------------- */
  initModals() {
    // E-Stop Confirmation
    const btnCancelEstop = document.getElementById('btn-cancel-estop');
    const btnConfirmEstop = document.getElementById('btn-confirm-estop');
    const modalEstop = document.getElementById('modal-estop');

    if (btnCancelEstop && modalEstop) {
      this.on(btnCancelEstop, 'click', () => {
        modalEstop.style.display = 'none';
      });
    }

    if (btnConfirmEstop && modalEstop) {
      this.on(btnConfirmEstop, 'click', () => {
        modalEstop.style.display = 'none';
        window.missionState = 'ESTOP';
        if (window.slamMap) {
          window.slamMap.estop();
        }
        this.updateMissionStateUI('Motor disarmed (E-Stop)', 'MOTOR_CUTOFF', 'highlight-red');
        this.logEvent('Critical', 'Hard E-Stop executed: Pixhawk motor signals terminated immediately.');
        this.playSound('estop');
      });
    }

    // Mark POI Confirmation
    const btnCancelPoi = document.getElementById('btn-cancel-poi');
    const btnSavePoi = document.getElementById('btn-save-poi');
    const modalPoi = document.getElementById('modal-mark-poi');

    if (btnCancelPoi && modalPoi) {
      this.on(btnCancelPoi, 'click', () => {
        modalPoi.style.display = 'none';
      });
    }

    if (btnSavePoi && modalPoi) {
      this.on(btnSavePoi, 'click', () => {
        const poiTypeEl = document.getElementById('input-poi-type');
        const poiNotesEl = document.getElementById('input-poi-notes');
        const poiType = poiTypeEl ? poiTypeEl.value : 'SURVIVOR_SURFACE';
        const poiNotes = poiNotesEl ? poiNotesEl.value : 'Visual survivor sighting';

        if (window.slamMap) {
          const dx = window.slamMap.drone.x;
          const dy = window.slamMap.drone.y;

          const isThermal = poiType === 'SURVIVOR_DEBRIS';

          window.slamMap.survivors.push({
            id: `POI-${window.slamMap.survivors.length + 1}`,
            tag: `POI-${window.slamMap.survivors.length + 1}`,
            x: dx,
            y: dy,
            status: poiNotes,
            type: isThermal ? 'THERMAL_DEBRIS' : 'SURFACE_RGB',
            confidence: isThermal ? 'FLIR 36.8°C' : 'Manual Pin',
            vitals: isThermal ? 'Thermal Body Heat Confirmed' : 'Pending Physical Check',
            locationName: `Marked at X:${dx.toFixed(1)}, Y:${dy.toFixed(1)}`,
            discoveredTime: new Date().toTimeString().split(' ')[0],
            confirmed: false
          });

          const elSurvCount = document.getElementById('stat-survivors-count');
          if (elSurvCount) elSurvCount.textContent = window.slamMap.survivors.length;

          this.logEvent('Info', `Tactical POI marked: [${poiType}] at X ${dx.toFixed(1)}m, Y ${dy.toFixed(1)}m ("${poiNotes}")`);
        }

        modalPoi.style.display = 'none';
        this.playSound('click');
      });
    }
  }

  /* -------------------------------------------------------------------------
     KEYBOARD SHORTCUTS
     ------------------------------------------------------------------------- */
  initKeyboardShortcuts() {
    this.on(window, 'keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        const btn = window.missionState === 'PAUSED' ? document.getElementById('btn-ctrl-start') : document.getElementById('btn-ctrl-pause');
        if (btn) btn.click();
      } else if (e.key === 'r' || e.key === 'R') {
        const btnRtl = document.getElementById('btn-ctrl-rtl');
        if (btnRtl) btnRtl.click();
      } else if (e.key === 'm' || e.key === 'M') {
        const btnMark = document.getElementById('btn-ctrl-mark');
        if (btnMark) btnMark.click();
      } else if (e.key === 'Escape') {
        const btnEstop = document.getElementById('btn-ctrl-estop');
        if (btnEstop) btnEstop.click();
      }
    });
  }

  /* -------------------------------------------------------------------------
     MISSION CLOCK & TELEMETRY INCREMENT
     ------------------------------------------------------------------------- */
  initMissionClock() {
    const elClock = document.getElementById('val-mission-timer');
    const elDist = document.getElementById('stat-dist-traveled');

    this.clockHandle = setInterval(() => {
      try {
        const elapsed = Date.now() - this.missionStartTime;
        const hours = Math.floor(elapsed / (1000 * 60 * 60));
        const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);

        const timeFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        if (elClock) elClock.textContent = timeFormatted;

        if (window.missionState === 'EXPLORING' || window.missionState === 'RTL') {
          this.totalDistanceMeters += 0.7;
          if (elDist) elDist.textContent = Math.floor(this.totalDistanceMeters);
        }
      } catch (e) {
        console.error('Mission clock tick error:', e);
      }
    }, 1000);
  }
}

