/**
 * ai_camera.js - Dual-Spectrum Vision Engine: RGB Camera (YOLO26) & FLIR LWIR Thermal Camera
 * Detects surface survivors (RGB) and survivors trapped under debris via thermal body heat (36.8°C)
 */

class DualCameraVision {
  constructor() {
    // RGB Canvas
    this.rgbCanvas = document.getElementById('camera-rgb-canvas');
    this.rgbCtx = this.rgbCanvas ? this.rgbCanvas.getContext('2d') : null;

    // Thermal Canvas
    this.thermalCanvas = document.getElementById('camera-thermal-canvas');
    this.thermalCtx = this.thermalCanvas ? this.thermalCanvas.getContext('2d') : null;

    // Dimensions
    this.w = 480;
    this.h = 240;

    // Current State
    this.scenario = 'SURVIVOR'; // 'SURVIVOR', 'DEBRIS', 'DRIFT'
    this.thermalPalette = 'IRONBOW'; // 'IRONBOW', 'WHITE_HOT', 'RAINBOW', 'LAVA'
    this.viewMode = 'DUAL'; // 'DUAL', 'RGB', 'THERMAL'

    // Telemetry
    this.tick = 0;
    this.dustParticles = [];
    this.initDustParticles();

    this.initEventListeners();
    this.resizeCanvases();
    window.addEventListener('resize', () => this.resizeCanvases());
    this.startVisionLoop();
  }

  resizeCanvases() {
    if (this.rgbCanvas && this.rgbCanvas.parentElement) {
      const rect = this.rgbCanvas.parentElement.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        this.rgbCanvas.width = Math.round(rect.width);
        this.rgbCanvas.height = Math.round(rect.height);
        this.w = this.rgbCanvas.width;
        this.h = this.rgbCanvas.height;
      }
    }
    if (this.thermalCanvas && this.thermalCanvas.parentElement) {
      const rect = this.thermalCanvas.parentElement.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        this.thermalCanvas.width = Math.round(rect.width);
        this.thermalCanvas.height = Math.round(rect.height);
      }
    }
  }

  initDustParticles() {
    this.dustParticles = [];
    for (let i = 0; i < 35; i++) {
      this.dustParticles.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        size: Math.random() * 2.0 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: Math.random() * 0.5 + 0.15,
        opacity: Math.random() * 0.6 + 0.2
      });
    }
  }

  initEventListeners() {
    // View Mode Tabs (Dual / RGB / Thermal)
    const tabDual = document.getElementById('tab-vision-dual');
    const tabRgb = document.getElementById('tab-vision-rgb');
    const tabThermal = document.getElementById('tab-vision-thermal');
    const wrapper = document.getElementById('dual-camera-wrapper');

    if (tabDual && tabRgb && tabThermal && wrapper) {
      tabDual.addEventListener('click', () => {
        this.viewMode = 'DUAL';
        wrapper.className = 'dual-camera-grid';
        this.setTabActive(tabDual, [tabRgb, tabThermal]);
        setTimeout(() => this.resizeCanvases(), 50);
      });

      tabRgb.addEventListener('click', () => {
        this.viewMode = 'RGB';
        wrapper.className = 'dual-camera-grid mode-rgb-only';
        this.setTabActive(tabRgb, [tabDual, tabThermal]);
        setTimeout(() => this.resizeCanvases(), 50);
      });

      tabThermal.addEventListener('click', () => {
        this.viewMode = 'THERMAL';
        wrapper.className = 'dual-camera-grid mode-thermal-only';
        this.setTabActive(tabThermal, [tabDual, tabRgb]);
        setTimeout(() => this.resizeCanvases(), 50);
      });
    }

    // Scenarios
    const btnSurv = document.getElementById('btn-cam-survivor');
    const btnDebris = document.getElementById('btn-cam-debris');
    const btnDrift = document.getElementById('btn-cam-drift');

    if (btnSurv) {
      btnSurv.addEventListener('click', () => {
        this.setScenario('SURVIVOR');
        this.setBtnActive(btnSurv, [btnDebris, btnDrift]);
      });
    }

    if (btnDebris) {
      btnDebris.addEventListener('click', () => {
        this.setScenario('DEBRIS');
        this.setBtnActive(btnDebris, [btnSurv, btnDrift]);
      });
    }

    if (btnDrift) {
      btnDrift.addEventListener('click', () => {
        this.setScenario('DRIFT');
        this.setBtnActive(btnDrift, [btnSurv, btnDebris]);
      });
    }

    // Thermal Palette Switcher
    const btnPalette = document.getElementById('btn-thermal-palette');
    const lblPalette = document.getElementById('val-thermal-palette');
    if (btnPalette) {
      btnPalette.addEventListener('click', () => {
        const palettes = ['IRONBOW', 'WHITE_HOT', 'RAINBOW', 'LAVA'];
        const nextIdx = (palettes.indexOf(this.thermalPalette) + 1) % palettes.length;
        this.thermalPalette = palettes[nextIdx];
        const paletteLabels = { IRONBOW: 'Ironbow', WHITE_HOT: 'White Hot', RAINBOW: 'Rainbow', LAVA: 'Lava' };
        if (lblPalette) lblPalette.textContent = paletteLabels[this.thermalPalette] || this.thermalPalette;
        if (window.logEvent) window.logEvent('Info', `Thermal camera palette changed to ${paletteLabels[this.thermalPalette] || this.thermalPalette}.`);
      });
    }
  }

  setTabActive(activeTab, otherTabs) {
    activeTab.classList.add('active');
    otherTabs.forEach(t => t.classList.remove('active'));
  }

  setBtnActive(activeBtn, otherBtns) {
    activeBtn.classList.add('active');
    otherBtns.forEach(b => b.classList.remove('active'));
  }

  setScenario(scen) {
    this.scenario = scen;
    if (window.logEvent) {
      if (scen === 'SURVIVOR') {
        window.logEvent('Info', 'AI vision: visual & thermal lock on Survivor #01 in Drift North-2.');
      } else if (scen === 'DEBRIS') {
        window.logEvent('Critical', 'FLIR thermal alert: 36.8°C body heat detected radiating through Crosscut #4 rock rubble (trapped survivor)!');
        if (window.playSynthSound) window.playSynthSound('alert');
      } else {
        window.logEvent('Info', 'AI vision: clear drift corridor exploration.');
      }
    }
  }

  startVisionLoop() {
    const loop = () => {
      this.tick++;
      if (this.viewMode !== 'THERMAL') this.renderRGB();
      if (this.viewMode !== 'RGB') this.renderThermal();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* -------------------------------------------------------------------------
     1. RGB CAMERA RENDERER (Optical Sensor Standby Mode)
     ------------------------------------------------------------------------- */
  renderRGB() {
    if (!this.rgbCtx || !this.rgbCanvas) return;
    const ctx = this.rgbCtx;
    const w = Math.max(this.rgbCanvas.width || this.w, 320);
    const h = Math.max(this.rgbCanvas.height || this.h, 160);

    // Dark tactical background
    ctx.fillStyle = '#060911';
    ctx.fillRect(0, 0, w, h);

    // Subtle tactical grid
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
    ctx.lineWidth = 1;
    const gridSize = 32;
    ctx.beginPath();
    for (let x = 0; x < w; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // Subtle moving scanline
    const scanY = (this.tick * 1.2) % h;
    const scanGrad = ctx.createLinearGradient(0, scanY - 12, 0, scanY + 12);
    scanGrad.addColorStop(0, 'rgba(0, 240, 255, 0)');
    scanGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.12)');
    scanGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = scanGrad;
    ctx.fillRect(0, scanY - 12, w, 24);

    // Corner targeting reticles [ ]
    this.drawReticleCorners(ctx, w, h, 'rgba(0, 240, 255, 0.35)', 16);

    // Center targeting crosshair
    this.drawCrosshair(ctx, w, h, 'rgba(0, 240, 255, 0.25)');

    // Tactical frame metadata
    ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
    ctx.font = '8px "JetBrains Mono"';
    ctx.fillText('CAM-01 [1080p 60FPS]', 10, 16);
    ctx.fillText('RTSP://PAYLOAD.OPTICAL', 10, h - 10);
    ctx.fillText('SIGNAL: NONE', w - 75, h - 10);
  }

  /* -------------------------------------------------------------------------
     2. FLIR THERMAL CAMERA RENDERER (LWIR Sensor Standby Mode)
     ------------------------------------------------------------------------- */
  renderThermal() {
    if (!this.thermalCtx || !this.thermalCanvas) return;
    const ctx = this.thermalCtx;
    const w = Math.max(this.thermalCanvas.width || this.w, 320);
    const h = Math.max(this.thermalCanvas.height || this.h, 160);

    // Thermal False-Color Dark Background
    if (this.thermalPalette === 'WHITE_HOT') {
      ctx.fillStyle = '#111318';
    } else if (this.thermalPalette === 'RAINBOW') {
      ctx.fillStyle = '#060620';
    } else if (this.thermalPalette === 'LAVA') {
      ctx.fillStyle = '#160808';
    } else { // IRONBOW Default
      ctx.fillStyle = '#0d041a'; // Deep thermal purple
    }
    ctx.fillRect(0, 0, w, h);

    // Subtle thermal sensor calibration grid
    ctx.strokeStyle = this.thermalPalette === 'WHITE_HOT' ? 'rgba(60, 65, 80, 0.4)' : 'rgba(126, 34, 206, 0.28)';
    ctx.lineWidth = 1;
    const gridSize = 32;
    ctx.beginPath();
    for (let x = 0; x < w; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // Subtle moving thermal calibration scanline
    const scanY = (this.tick * 0.9) % h;
    const scanGrad = ctx.createLinearGradient(0, scanY - 14, 0, scanY + 14);
    scanGrad.addColorStop(0, 'rgba(249, 115, 22, 0)');
    scanGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.1)');
    scanGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = scanGrad;
    ctx.fillRect(0, scanY - 14, w, 28);

    // Corner targeting reticles [ ]
    this.drawReticleCorners(ctx, w, h, 'rgba(249, 115, 22, 0.4)', 16);

    // Center targeting crosshair
    this.drawCrosshair(ctx, w, h, 'rgba(249, 115, 22, 0.3)');

    // Thermal Color Bar / Calibration Scale on the right
    this.drawThermalColorBar(ctx, w, h);

    // Tactical frame metadata
    ctx.fillStyle = 'rgba(253, 186, 116, 0.6)';
    ctx.font = '8px "JetBrains Mono"';
    ctx.fillText('CAM-02 [FLIR 640x512 9Hz]', 10, 16);
    ctx.fillText('CAL: RADIOMETRIC LWIR', 10, h - 10);
    ctx.fillText('STANDBY', w - 85, h - 10);
  }

  drawReticleCorners(ctx, w, h, color, len = 14) {
    const pad = 12;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    // Top-Left
    ctx.moveTo(pad, pad + len); ctx.lineTo(pad, pad); ctx.lineTo(pad + len, pad);
    // Top-Right
    ctx.moveTo(w - pad - len, pad); ctx.lineTo(w - pad, pad); ctx.lineTo(w - pad, pad + len);
    // Bottom-Left
    ctx.moveTo(pad, h - pad - len); ctx.lineTo(pad, h - pad); ctx.lineTo(pad + len, h - pad);
    // Bottom-Right
    ctx.moveTo(w - pad - len, h - pad); ctx.lineTo(w - pad, h - pad); ctx.lineTo(w - pad, h - pad - len);
    ctx.stroke();
  }

  drawDust(ctx, w, h) {
    ctx.fillStyle = 'rgba(230, 245, 255, 0.5)';
    for (const p of this.dustParticles) {
      p.x += p.speedX; p.y += p.speedY;
      if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
      if (p.y > h) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawCrosshair(ctx, w, h, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 12, 0, Math.PI * 2);
    ctx.moveTo(w / 2 - 16, h / 2); ctx.lineTo(w / 2 + 16, h / 2);
    ctx.moveTo(w / 2, h / 2 - 16); ctx.lineTo(w / 2, h / 2 + 16);
    ctx.stroke();
  }
}

// Global hook
window.DualCameraVision = DualCameraVision;
