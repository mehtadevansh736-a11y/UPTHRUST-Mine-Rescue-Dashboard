/**
 * telemetry.js - Real-Time Mine Environmental & Subsystem Telemetry Module
 * Handles Gas Readings (CO, CH4, CO2, H2S, O2, Temp, Humidity), Sparkline Graphs, and Comms Health
 */

class TelemetryEngine {
  constructor() {
    // Current Sensor Values
    this.sensors = {
      co: 18.0,       // PPM (Safe < 35, Warn > 35, Crit > 50)
      ch4: 1.75,      // % LEL (Safe < 1.0, Warn 1.0-2.5, Crit > 2.5)
      co2: 840,       // PPM (Safe < 1000, Warn 1000-5000, Crit > 5000)
      h2s: 2.4,       // PPM (Safe < 10, Warn 10-20, Crit > 20)
      o2: 20.9,       // % vol (Safe 19.5-23.0, Warn 18.0-19.5 | 23.0-23.5, Crit < 18.0 | > 23.5)
      temp: 28.4,     // °C (Normal 20-30, Elevated > 30, Crit > 38)
      humidity: 84.2, // % RH
      batteryPct: 82, // %
      batteryVolts: 22.8, // 6S LiPo
      batterySecsRem: 1120, // 18m 40s
      meshLatency: 24, // ms
      cpuUsage: 38,
      rpiTemp: 54
    };

    // Trend Sparkline History Buffers (30 samples)
    this.trendHistory = {
      ch4: Array(30).fill(1.5),
      co: Array(30).fill(18.0),
      co2: Array(30).fill(840),
      h2s: Array(30).fill(2.4),
      o2: Array(30).fill(20.9)
    };

    // DOM Elements Cache
    this.initDomElements();

    // Gas Trend Canvas
    this.trendCanvas = document.getElementById('gas-trend-canvas');
    this.trendCtx = this.trendCanvas ? this.trendCanvas.getContext('2d') : null;

    // Window resize handler for instantaneous full-screen adaptation
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.renderTrendSparkline();
      });
    }

    // Start 1 Hz Telemetry Simulation Tick
    this.startTelemetryLoop();
  }

  initDomElements() {
    this.dom = {
      // Top Bar
      droneState: document.getElementById('val-drone-state'),
      gpsMode: document.getElementById('val-gps-mode'),
      flightMode: document.getElementById('val-flight-mode'),
      batteryPct: document.getElementById('val-battery-pct'),
      batteryVolts: document.getElementById('val-battery-volts'),
      batteryEta: document.getElementById('val-battery-eta'),
      batteryFill: document.getElementById('battery-fill'),
      meshLatency: document.getElementById('val-mesh-latency'),
      missionStatus: document.getElementById('val-mission-status'),
      missionTimer: document.getElementById('val-mission-timer'),

      // Atmosphere Overall Badge
      gasOverallBadge: document.getElementById('gas-overall-badge'),

      // CO
      valCo: document.getElementById('val-gas-co'),
      badgeCo: document.getElementById('badge-co'),
      barCo: document.getElementById('bar-gas-co'),

      // CH4
      valCh4: document.getElementById('val-gas-ch4'),
      badgeCh4: document.getElementById('badge-ch4'),
      barCh4: document.getElementById('bar-gas-ch4'),

      // CO2
      valCo2: document.getElementById('val-gas-co2'),
      badgeCo2: document.getElementById('badge-co2'),
      barCo2: document.getElementById('bar-gas-co2'),

      // H2S
      valH2s: document.getElementById('val-gas-h2s'),
      badgeH2s: document.getElementById('badge-h2s'),
      barH2s: document.getElementById('bar-gas-h2s'),

      // O2
      valO2: document.getElementById('val-gas-o2'),
      badgeO2: document.getElementById('badge-o2'),
      barO2: document.getElementById('bar-gas-o2'),

      // Temp & Humidity
      valTemp: document.getElementById('val-env-temp'),
      badgeTemp: document.getElementById('badge-temp'),
      barTemp: document.getElementById('bar-env-temp'),
      valHum: document.getElementById('val-env-hum'),
      badgeHum: document.getElementById('badge-hum'),
      barHum: document.getElementById('bar-env-hum'),

      // RPi Meta
      rpiMeta: document.getElementById('rpi-meta')
    };
  }

  startTelemetryLoop() {
    setInterval(() => {
      this.updateTelemetry();
    }, 1000);
  }

  updateTelemetry() {
    // 1. Calculate gas proximity to hazardous zones if map is loaded
    if (window.slamMap && window.slamMap.drone) {
      const drone = window.slamMap.drone;
      
      // Proximity to Methane Zone (X: 36, Y: 28)
      const distCh4 = Math.hypot(drone.x - 36, drone.y - 28);
      if (distCh4 < 20) {
        // High Methane density
        const intensity = 1 - (distCh4 / 20);
        this.sensors.ch4 = +(1.2 + intensity * 2.6 + (Math.random() * 0.15 - 0.07)).toFixed(2);
      } else {
        // Baseline Methane
        this.sensors.ch4 = +(0.85 + Math.random() * 0.3).toFixed(2);
      }

      // Proximity to CO Zone (X: 12, Y: -36)
      const distCo = Math.hypot(drone.x - 12, drone.y - (-36));
      if (distCo < 16) {
        const intensity = 1 - (distCo / 16);
        this.sensors.co = Math.round(15 + intensity * 38 + (Math.random() * 4 - 2));
      } else {
        this.sensors.co = Math.round(16 + Math.random() * 4);
      }

      // Proximity to H2S Seepage Zone (X: -25, Y: 25)
      const distH2s = Math.hypot(drone.x - (-25), drone.y - 25);
      if (distH2s < 18) {
        const intensity = 1 - (distH2s / 18);
        this.sensors.h2s = +(1.8 + intensity * 14.5 + (Math.random() * 0.6 - 0.3)).toFixed(1);
      } else {
        this.sensors.h2s = +(2.0 + Math.random() * 0.8).toFixed(1);
      }

      // Oxygen Depletion in low-ventilation / high-combustion zones
      if (distCh4 < 20 || distCo < 16) {
        const intensity = Math.max(distCh4 < 20 ? (1 - distCh4 / 20) : 0, distCo < 16 ? (1 - distCo / 16) : 0);
        this.sensors.o2 = +(20.9 - intensity * 2.6 + (Math.random() * 0.2 - 0.1)).toFixed(1);
      } else {
        this.sensors.o2 = +(20.8 + (Math.random() * 0.2 - 0.1)).toFixed(1);
      }
    } else {
      // Ambient fluctuations
      this.sensors.ch4 = +(1.6 + Math.random() * 0.3).toFixed(2);
      this.sensors.co = Math.round(18 + Math.random() * 3);
      this.sensors.h2s = +(2.4 + (Math.random() * 0.6 - 0.3)).toFixed(1);
      this.sensors.o2 = +(20.8 + (Math.random() * 0.2 - 0.1)).toFixed(1);
    }

    // Secondary Sensors
    this.sensors.co2 = Math.round(820 + Math.random() * 40);
    this.sensors.temp = +(28.2 + Math.random() * 0.5).toFixed(1);
    this.sensors.humidity = +(83.8 + Math.random() * 0.8).toFixed(1);

    // Battery Drain (slow realistic decrement)
    if (window.missionState !== 'ESTOP') {
      this.sensors.batterySecsRem = Math.max(0, this.sensors.batterySecsRem - 1);
      const minutes = Math.floor(this.sensors.batterySecsRem / 60);
      const seconds = this.sensors.batterySecsRem % 60;
      this.batteryEtaStr = `${minutes}m ${seconds.toString().padStart(2, '0')}s REM`;
    }

    // Mesh RF Latency jitter (21 - 28 ms)
    this.sensors.meshLatency = Math.floor(22 + Math.random() * 7);

    // RPi Compute load
    this.sensors.cpuUsage = Math.floor(36 + Math.random() * 12);
    this.sensors.rpiTemp = Math.floor(53 + Math.random() * 4);

    // Update Trend History Buffers
    this.trendHistory.ch4.shift();
    this.trendHistory.ch4.push(this.sensors.ch4);

    this.trendHistory.co.shift();
    this.trendHistory.co.push(this.sensors.co);

    this.trendHistory.co2.shift();
    this.trendHistory.co2.push(this.sensors.co2);

    this.trendHistory.h2s.shift();
    this.trendHistory.h2s.push(this.sensors.h2s);

    this.trendHistory.o2.shift();
    this.trendHistory.o2.push(this.sensors.o2);

    // Render DOM & Sparkline
    this.renderDom();
    this.renderTrendSparkline();
  }

  renderDom() {
    const d = this.dom;

    // --- CO (Carbon Monoxide) ---
    if (d.valCo) d.valCo.textContent = this.sensors.co;
    if (d.badgeCo && d.barCo) {
      if (this.sensors.co < 35) {
        d.badgeCo.textContent = 'Safe';
        d.badgeCo.className = 'gas-status-badge badge-safe';
        d.barCo.className = 'gas-level-bar-fill bar-safe';
      } else if (this.sensors.co < 50) {
        d.badgeCo.textContent = 'Warning';
        d.badgeCo.className = 'gas-status-badge badge-warning';
        d.barCo.className = 'gas-level-bar-fill bar-warning';
      } else {
        d.badgeCo.textContent = 'Critical';
        d.badgeCo.className = 'gas-status-badge badge-critical';
        d.barCo.className = 'gas-level-bar-fill bar-critical';
      }
      d.barCo.style.width = `${Math.min(100, (this.sensors.co / 60) * 100)}%`;
    }

    // --- CH4 (Methane % LEL) ---
    if (d.valCh4) d.valCh4.textContent = this.sensors.ch4.toFixed(2);
    if (d.badgeCh4 && d.barCh4) {
      if (this.sensors.ch4 < 1.0) {
        d.badgeCh4.textContent = 'Safe';
        d.badgeCh4.className = 'gas-status-badge badge-safe';
        d.barCh4.className = 'gas-level-bar-fill bar-safe';
      } else if (this.sensors.ch4 < 2.5) {
        d.badgeCh4.textContent = 'Warning';
        d.badgeCh4.className = 'gas-status-badge badge-warning';
        d.barCh4.className = 'gas-level-bar-fill bar-warning';
      } else {
        d.badgeCh4.textContent = 'Critical';
        d.badgeCh4.className = 'gas-status-badge badge-critical';
        d.barCh4.className = 'gas-level-bar-fill bar-critical';
      }
      d.barCh4.style.width = `${Math.min(100, (this.sensors.ch4 / 4.0) * 100)}%`;
    }

    // --- CO2 ---
    if (d.valCo2) d.valCo2.textContent = this.sensors.co2;
    if (d.barCo2) d.barCo2.style.width = `${Math.min(100, (this.sensors.co2 / 3000) * 100)}%`;

    // --- H2S (Hydrogen Sulphide) ---
    if (d.valH2s) d.valH2s.textContent = this.sensors.h2s.toFixed(1);
    if (d.badgeH2s && d.barH2s) {
      if (this.sensors.h2s < 10) {
        d.badgeH2s.textContent = 'Safe';
        d.badgeH2s.className = 'gas-status-badge badge-safe';
        d.barH2s.className = 'gas-level-bar-fill bar-safe';
      } else if (this.sensors.h2s < 20) {
        d.badgeH2s.textContent = 'Warning';
        d.badgeH2s.className = 'gas-status-badge badge-warning';
        d.barH2s.className = 'gas-level-bar-fill bar-warning';
      } else {
        d.badgeH2s.textContent = 'Critical';
        d.badgeH2s.className = 'gas-status-badge badge-critical';
        d.barH2s.className = 'gas-level-bar-fill bar-critical';
      }
      d.barH2s.style.width = `${Math.min(100, (this.sensors.h2s / 25.0) * 100)}%`;
    }

    // --- O2 (Oxygen Level) ---
    if (d.valO2) d.valO2.textContent = this.sensors.o2.toFixed(1);
    if (d.badgeO2 && d.barO2) {
      if (this.sensors.o2 >= 19.5 && this.sensors.o2 <= 23.0) {
        d.badgeO2.textContent = 'Safe';
        d.badgeO2.className = 'gas-status-badge badge-safe';
        d.barO2.className = 'gas-level-bar-fill bar-safe';
      } else if ((this.sensors.o2 >= 18.0 && this.sensors.o2 < 19.5) || (this.sensors.o2 > 23.0 && this.sensors.o2 <= 23.5)) {
        d.badgeO2.textContent = 'Warning';
        d.badgeO2.className = 'gas-status-badge badge-warning';
        d.barO2.className = 'gas-level-bar-fill bar-warning';
      } else {
        d.badgeO2.textContent = 'Critical';
        d.badgeO2.className = 'gas-status-badge badge-critical';
        d.barO2.className = 'gas-level-bar-fill bar-critical';
      }
      d.barO2.style.width = `${Math.min(100, (this.sensors.o2 / 25.0) * 100)}%`;
    }

    // --- Overall Atmosphere Status ---
    if (d.gasOverallBadge) {
      if (
        this.sensors.ch4 >= 2.5 ||
        this.sensors.co >= 50 ||
        this.sensors.h2s >= 20 ||
        this.sensors.o2 < 18.0 ||
        this.sensors.o2 > 23.5
      ) {
        d.gasOverallBadge.textContent = 'Critical spike';
        d.gasOverallBadge.className = 'header-tag-pill crit-state';
      } else if (
        this.sensors.ch4 >= 1.0 ||
        this.sensors.co >= 35 ||
        this.sensors.h2s >= 10 ||
        this.sensors.o2 < 19.5 ||
        this.sensors.o2 > 23.0
      ) {
        d.gasOverallBadge.textContent = 'Hazard detected';
        d.gasOverallBadge.className = 'header-tag-pill warn-state';
      } else {
        d.gasOverallBadge.textContent = 'Stable';
        d.gasOverallBadge.className = 'header-tag-pill safe-state';
      }
    }

    // --- Temp & Humidity ---
    if (d.valTemp) d.valTemp.textContent = `${this.sensors.temp.toFixed(1)} °C`;
    if (d.barTemp) d.barTemp.style.width = `${(this.sensors.temp / 45) * 100}%`;
    if (d.valHum) d.valHum.textContent = `${this.sensors.humidity.toFixed(1)} %`;
    if (d.barHum) d.barHum.style.width = `${this.sensors.humidity}%`;

    // --- Battery & Comms Top Bar ---
    if (d.batteryPct) d.batteryPct.textContent = `${this.sensors.batteryPct}%`;
    if (d.batteryVolts) d.batteryVolts.textContent = `${this.sensors.batteryVolts}V`;
    if (d.batteryEta && this.batteryEtaStr) d.batteryEta.textContent = this.batteryEtaStr;
    if (d.batteryFill) d.batteryFill.style.width = `${this.sensors.batteryPct}%`;
    if (d.meshLatency) d.meshLatency.textContent = `Mesh ${this.sensors.meshLatency}ms`;

    // --- RPi Meta ---
    if (d.rpiMeta) {
      d.rpiMeta.textContent = `CPU: ${this.sensors.cpuUsage}% • RAM: 3.2GB • ${this.sensors.rpiTemp}°C`;
    }
  }

  renderTrendSparkline() {
    if (!this.trendCtx || !this.trendCanvas) return;
    
    // Auto-fit canvas to container's dynamic width and height
    if (this.trendCanvas.parentElement) {
      const parentW = Math.max(this.trendCanvas.parentElement.clientWidth - 20, 180);
      const headEl = this.trendCanvas.parentElement.querySelector('.trend-head');
      const headH = headEl ? headEl.offsetHeight : 18;
      const parentH = Math.max(this.trendCanvas.parentElement.clientHeight - headH - 14, 38);

      if (this.trendCanvas.width !== parentW || this.trendCanvas.height !== parentH) {
        this.trendCanvas.width = parentW;
        this.trendCanvas.height = parentH;
      }
    }

    const ctx = this.trendCtx;
    const w = Math.max(this.trendCanvas.width, 180);
    const h = Math.max(this.trendCanvas.height, 38);

    ctx.clearRect(0, 0, w, h);

    // Clean subtle grid baseline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    const gasSeries = [
      { key: 'ch4', max: 4.0, color: '#ff9800', fill: 'rgba(255, 152, 0, 0.22)' },
      { key: 'co', max: 60, color: '#00a8ff', fill: 'rgba(0, 168, 255, 0.22)' },
      { key: 'co2', max: 3000, color: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.20)' },
      { key: 'h2s', max: 25.0, color: '#f59e0b', fill: 'rgba(245, 158, 11, 0.20)' },
      { key: 'o2', max: 25.0, color: '#38bdf8', fill: 'rgba(56, 189, 248, 0.18)' }
    ];

    gasSeries.forEach(({ key, max, color, fill }) => {
      const data = this.trendHistory[key];
      if (!data || data.length === 0) return;

      // Smooth area gradient
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, fill);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let i = 0; i < data.length; i++) {
        const x = (i / (data.length - 1)) * w;
        const normalized = Math.min(1, Math.max(0, data[i] / max));
        const y = h - normalized * (h - 8) - 4;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Line stroke
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < data.length; i++) {
        const x = (i / (data.length - 1)) * w;
        const normalized = Math.min(1, Math.max(0, data[i] / max));
        const y = h - normalized * (h - 8) - 4;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
  }
}

// Global hook
window.TelemetryEngine = TelemetryEngine;
