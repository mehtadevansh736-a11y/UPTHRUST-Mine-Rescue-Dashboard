/**
 * lib/slam_map.js - High-Performance 2D RPLiDAR SLAM Video & Map Viewport Engine
 * Plays the authentic Upthrust LiDAR video stream with interactive pan, multi-level zoom,
 * auto-centering, reset-view, tactical reticle overlays, and synchronized telemetry HUD.
 */

export class SlamMapEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.container = this.canvas.parentElement;

    // Lifecycle
    this.destroyed = false;
    this.abortCtrl = new AbortController();
    this.signal = this.abortCtrl.signal;

    // Viewport Transform & Camera State
    this.camera = {
      x: 0,
      y: 0,
      zoom: 1.0,
      minZoom: 0.4,
      maxZoom: 4.5,
      isDragging: false,
      dragStart: { x: 0, y: 0 },
      autoCenter: true
    };

    // Mission & Target State
    this.isCustomGoal = false;
    this.isRtl = false;

    // Drone Telemetry State (synchronized with flight in video)
    this.drone = {
      x: 37.0,
      y: 0.5,
      yaw: 357.0 * (Math.PI / 180),
      altitude: 1.66,
      velocity: 0.85,
      targetWaypointIndex: 1
    };

    // Subterranean Survivors
    this.survivors = [
      {
        id: 'SURVIVOR #01',
        tag: 'SURV-01',
        x: 36.0,
        y: 14.0,
        status: 'Unconscious / Stable',
        type: 'SURFACE_RGB',
        confidence: '96.4%',
        vitals: 'Breathing: 14 bpm | Pulse: 78 bpm',
        locationName: 'North Drift #2 (Sector Delta)',
        discoveredTime: '21:14:10',
        confirmed: true
      },
      {
        id: 'SURVIVOR #02 [TRAPPED]',
        tag: 'SURV-02',
        x: 10.0,
        y: 42.0,
        status: 'Trapped Under Rock Collapse Debris',
        type: 'THERMAL_DEBRIS',
        confidence: '95.2% (FLIR Thermal: 36.8°C)',
        vitals: 'Heat Signature: 36.8°C | Depth: ~0.8m Rubble',
        locationName: 'Crosscut #1 (Collapse Zone)',
        discoveredTime: '21:18:22',
        confirmed: true
      },
      {
        id: 'SURVIVOR #03',
        tag: 'SURV-03',
        x: 65.0,
        y: -16.0,
        status: 'Conscious / Helmet Lamp Signalling',
        type: 'SURFACE_RGB',
        confidence: '91.8%',
        vitals: 'Responsive | Oxygen Level: Low',
        locationName: 'Refuge Chamber Bay B',
        discoveredTime: '21:17:42',
        confirmed: true
      }
    ];

    // Hazardous Gas Plumes
    this.gasZones = [
      {
        id: 'GAS-01',
        type: 'CH4',
        name: 'METHANE ACCUMULATION POCKET',
        x: 36.0,
        y: 28.0,
        radius: 12.0,
        level: 'CRITICAL',
        peakVal: '3.8% LEL'
      },
      {
        id: 'GAS-02',
        type: 'CO',
        name: 'CARBON MONOXIDE FUMES',
        x: 12.0,
        y: -36.0,
        radius: 10.0,
        level: 'WARNING',
        peakVal: '48 PPM'
      },
      {
        id: 'GAS-03',
        type: 'H2S',
        name: 'HYDROGEN SULPHIDE SEEPAGE',
        x: -25.0,
        y: 25.0,
        radius: 9.0,
        level: 'WARNING',
        peakVal: '14 PPM'
      }
    ];

    // Initialize Video Stream Player
    this.initVideoPlayer();

    // Bind Interaction Events (Pan, Zoom, Reticle, Centering)
    this.initEventListeners();
    this.resizeCanvas();
    this.startRenderLoop();
  }

  /* -------------------------------------------------------------------------
     1. VIDEO STREAM INITIALIZATION
     ------------------------------------------------------------------------- */
  initVideoPlayer() {
    this.video = document.createElement('video');
    this.video.autoplay = true;
    this.video.loop = true;
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.setAttribute('playsinline', '');
    this.video.setAttribute('webkit-playsinline', '');
    this.video.setAttribute('muted', '');
    this.video.preload = 'auto';

    // Set video source with primary and fallback paths
    const videoSrc = 'upthrust_lidar.mp4';
    this.video.src = videoSrc;

    this.video.addEventListener('error', () => {
      if (this.video.src.indexOf('/upthrust_lidar.mp4') === -1) {
        this.video.src = '/upthrust_lidar.mp4';
        this.video.load();
        this.video.play().catch(() => {});
      }
    });

    const startPlay = () => {
      if (this.video && this.video.paused && window.missionState !== 'PAUSED' && window.missionState !== 'ESTOP') {
        this.video.play().catch(() => {});
      }
    };

    this.video.load();
    startPlay();

    // Ensure playback begins on user interaction if browser autoplay blocked
    window.addEventListener('click', startPlay, { once: true, signal: this.signal });
    window.addEventListener('keydown', startPlay, { once: true, signal: this.signal });
  }

  /* -------------------------------------------------------------------------
     2. EVENT LISTENERS (PAN, ZOOM, DRAG, CONTROLS)
     ------------------------------------------------------------------------- */
  initEventListeners() {
    if (!this.canvas) return;

    // A. Pointer Drag / Pan
    this.canvas.addEventListener(
      'mousedown',
      (e) => {
        if (e.button !== 0) return;
        this.camera.isDragging = true;
        this.camera.dragStart = {
          x: e.clientX - this.camera.x,
          y: e.clientY - this.camera.y
        };
        this.camera.autoCenter = false;
        this.canvas.style.cursor = 'grabbing';
      },
      { signal: this.signal }
    );

    window.addEventListener(
      'mousemove',
      (e) => {
        if (!this.camera.isDragging) return;
        this.camera.x = e.clientX - this.camera.dragStart.x;
        this.camera.y = e.clientY - this.camera.dragStart.y;
      },
      { signal: this.signal }
    );

    window.addEventListener(
      'mouseup',
      () => {
        if (this.camera.isDragging) {
          this.camera.isDragging = false;
          if (this.canvas) this.canvas.style.cursor = 'crosshair';
        }
      },
      { signal: this.signal }
    );

    // B. Mouse Wheel Zoom (centered at mouse pointer)
    this.canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - this.canvas.width / 2;
        const mouseY = e.clientY - rect.top - this.canvas.height / 2;

        const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
        const oldZoom = this.camera.zoom;
        const newZoom = Math.min(
          this.camera.maxZoom,
          Math.max(this.camera.minZoom, oldZoom * zoomFactor)
        );

        // Adjust camera translation so zoom centers around cursor
        this.camera.x -= (mouseX - this.camera.x) * (newZoom / oldZoom - 1);
        this.camera.y -= (mouseY - this.camera.y) * (newZoom / oldZoom - 1);
        this.camera.zoom = newZoom;
        this.camera.autoCenter = false;
      },
      { passive: false, signal: this.signal }
    );

    // C. Touch Pan & Pinch-to-Zoom
    let lastTouchDist = 0;
    this.canvas.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length === 1) {
          this.camera.isDragging = true;
          this.camera.dragStart = {
            x: e.touches[0].clientX - this.camera.x,
            y: e.touches[0].clientY - this.camera.y
          };
          this.camera.autoCenter = false;
        } else if (e.touches.length === 2) {
          this.camera.isDragging = false;
          lastTouchDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
        }
      },
      { passive: true, signal: this.signal }
    );

    this.canvas.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches.length === 1 && this.camera.isDragging) {
          this.camera.x = e.touches[0].clientX - this.camera.dragStart.x;
          this.camera.y = e.touches[0].clientY - this.camera.dragStart.y;
        } else if (e.touches.length === 2) {
          const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          if (lastTouchDist > 0) {
            const factor = dist / lastTouchDist;
            this.camera.zoom = Math.min(
              this.camera.maxZoom,
              Math.max(this.camera.minZoom, this.camera.zoom * factor)
            );
          }
          lastTouchDist = dist;
        }
      },
      { passive: true, signal: this.signal }
    );

    this.canvas.addEventListener(
      'touchend',
      () => {
        this.camera.isDragging = false;
        lastTouchDist = 0;
      },
      { signal: this.signal }
    );

    // D. Viewport Buttons
    const btnZoomIn = document.getElementById('btn-map-zoomin');
    const btnZoomOut = document.getElementById('btn-map-zoomout');
    const btnCenter = document.getElementById('btn-map-center');
    const btnReset = document.getElementById('btn-map-reset');

    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', () => this.zoomIn(), { signal: this.signal });
    }
    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', () => this.zoomOut(), { signal: this.signal });
    }
    if (btnCenter) {
      btnCenter.addEventListener('click', () => this.centerDrone(), { signal: this.signal });
    }
    if (btnReset) {
      btnReset.addEventListener('click', () => this.resetView(), { signal: this.signal });
    }

    // E. Window Resize
    window.addEventListener('resize', () => this.resizeCanvas(), { signal: this.signal });
  }

  /* -------------------------------------------------------------------------
     3. INTERACTIVE OPERATIONS (ZOOM, CENTER, RESET, PATROL)
     ------------------------------------------------------------------------- */
  zoomIn() {
    this.camera.zoom = Math.min(this.camera.maxZoom, +(this.camera.zoom * 1.25).toFixed(2));
    this.triggerFeedback();
  }

  zoomOut() {
    this.camera.zoom = Math.max(this.camera.minZoom, +(this.camera.zoom / 1.25).toFixed(2));
    this.triggerFeedback();
  }

  centerDrone() {
    this.camera.x = 0;
    this.camera.y = 0;
    this.camera.autoCenter = true;
    this.triggerFeedback();
    if (window.logEvent) {
      window.logEvent('Slam', 'LiDAR viewport centered on UAV tracking frame.');
    }
  }

  resetView() {
    this.camera.zoom = 1.0;
    this.camera.x = 0;
    this.camera.y = 0;
    this.camera.autoCenter = true;
    this.triggerFeedback();
    if (window.logEvent) {
      window.logEvent('Info', 'LiDAR viewport transform reset to default (1.0x).');
    }
  }

  triggerFeedback() {
    if (window.playSynthSound) window.playSynthSound('click');
  }

  resumePatrol() {
    window.missionState = 'EXPLORING';
    if (this.video && this.video.paused) {
      this.video.play().catch(() => {});
    }
  }

  pause() {
    window.missionState = 'PAUSED';
    if (this.video && !this.video.paused) {
      this.video.pause();
    }
  }

  returnToBase() {
    window.missionState = 'RTL';
    this.isRtl = true;
    if (this.video && this.video.paused) {
      this.video.play().catch(() => {});
    }
    if (window.logEvent) {
      window.logEvent('Info', 'Autonomous Return to Base (RTL) commanded along explored SLAM path.');
    }
  }

  estop() {
    window.missionState = 'ESTOP';
    if (this.video) {
      this.video.pause();
    }
  }

  /* -------------------------------------------------------------------------
     4. RESIZE & RENDER LOOP
     ------------------------------------------------------------------------- */
  resizeCanvas() {
    if (!this.canvas || !this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w > 0 && h > 0) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  startRenderLoop() {
    const render = () => {
      if (this.destroyed) return;
      this.renderFrame();
      this.animId = requestAnimationFrame(render);
    };
    this.animId = requestAnimationFrame(render);
  }

  renderFrame() {
    const ctx = this.ctx;
    const canvas = this.canvas;
    if (!ctx || !canvas) return;

    const cw = canvas.width;
    const ch = canvas.height;

    // Clear with dark technical canvas surface
    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, cw, ch);

    // Apply Camera Transform
    ctx.save();
    ctx.translate(cw / 2 + this.camera.x, ch / 2 + this.camera.y);
    ctx.scale(this.camera.zoom, this.camera.zoom);

    // Render Video Frame
    if (this.video && (this.video.readyState >= 2 || this.video.videoWidth > 0)) {
      const vw = this.video.videoWidth || 1280;
      const vh = this.video.videoHeight || 720;

      // Fit video to fill the viewport maintaining aspect ratio
      const scale = Math.min(cw / vw, ch / vh);
      const dw = vw * scale;
      const dh = vh * scale;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(this.video, -dw / 2, -dh / 2, dw, dh);
    } else {
      // Stream buffer placeholder
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 13px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('RPLiDAR 2D SLAM Stream Synchronizing...', 0, 0);
    }

    ctx.restore();

    // Update HUD telemetry overlay card
    this.updateDroneHud();
  }

  /* -------------------------------------------------------------------------
     5. TELEMETRY HUD UPDATER (COORDINATES, ALTITUDE, YAW, VELOCITY)
     ------------------------------------------------------------------------- */
  updateDroneHud() {
    const totalDuration = 45.0;
    const t = (this.video && !isNaN(this.video.currentTime) && this.video.currentTime > 0)
      ? (this.video.currentTime % totalDuration)
      : ((Date.now() * 0.001) % totalDuration);

    // Synchronized flight trajectory matching the 2D SLAM exploration video
    const waypoints = [
      { t: 0.0, x: -24.5, y: +0.0, yaw: 0.0, vel: 0.85, alt: 1.65 },
      { t: 4.0, x: -14.5, y: +0.0, yaw: 0.0, vel: 0.92, alt: 1.68 },
      { t: 7.5, x: -3.5, y: +0.0, yaw: 0.0, vel: 0.88, alt: 1.65 },
      { t: 10.5, x: +0.5, y: -4.0, yaw: 315.0, vel: 0.75, alt: 1.62 },
      { t: 13.5, x: +3.8, y: -12.5, yaw: 270.0, vel: 0.82, alt: 1.64 },
      { t: 17.0, x: -4.2, y: -18.2, yaw: 180.0, vel: 0.65, alt: 1.60 }, // Surv-01
      { t: 20.5, x: +8.5, y: -18.2, yaw: 0.0, vel: 0.72, alt: 1.66 },
      { t: 23.5, x: +6.5, y: -11.0, yaw: 135.0, vel: 0.78, alt: 1.64 },
      { t: 26.5, x: +6.8, y: -3.0, yaw: 90.0, vel: 0.84, alt: 1.65 },
      { t: 29.5, x: +14.2, y: +0.0, yaw: 0.0, vel: 0.90, alt: 1.67 },
      { t: 32.5, x: +21.5, y: -8.0, yaw: 330.0, vel: 0.78, alt: 1.63 },
      { t: 35.5, x: +28.5, y: -7.5, yaw: 0.0, vel: 0.68, alt: 1.62 }, // Surv-03
      { t: 38.5, x: +29.0, y: +6.5, yaw: 90.0, vel: 0.70, alt: 1.64 },
      { t: 40.5, x: +16.5, y: +16.0, yaw: 215.0, vel: 0.85, alt: 1.66 },
      { t: 42.5, x: -2.0, y: +7.5, yaw: 225.0, vel: 0.80, alt: 1.65 }, // Loop closure
      { t: 44.0, x: -12.5, y: +13.5, yaw: 225.0, vel: 0.60, alt: 1.60 }, // Surv-02
      { t: 45.0, x: -9.5, y: +9.5, yaw: 225.0, vel: 0.45, alt: 1.62 }
    ];

    let p0 = waypoints[0];
    let p1 = waypoints[waypoints.length - 1];
    for (let i = 0; i < waypoints.length - 1; i++) {
      if (t >= waypoints[i].t && t <= waypoints[i + 1].t) {
        p0 = waypoints[i];
        p1 = waypoints[i + 1];
        break;
      }
    }

    const dt = p1.t - p0.t;
    const alpha = dt > 0 ? (t - p0.t) / dt : 0;
    
    this.drone.x = +(p0.x + (p1.x - p0.x) * alpha).toFixed(1);
    this.drone.y = +(p0.y + (p1.y - p0.y) * alpha).toFixed(1);
    this.drone.altitude = +(p0.alt + (p1.alt - p0.alt) * alpha + Math.sin(t * 2.0) * 0.02).toFixed(2);
    this.drone.velocity = +(p0.vel + (p1.vel - p0.vel) * alpha).toFixed(2);

    let diffYaw = p1.yaw - p0.yaw;
    if (diffYaw > 180) diffYaw -= 360;
    if (diffYaw < -180) diffYaw += 360;
    const deg = (p0.yaw + diffYaw * alpha + 360) % 360;
    this.drone.yaw = deg * (Math.PI / 180);

    const elXy = document.getElementById('hud-drone-xy');
    const elAlt = document.getElementById('hud-drone-alt');
    const elYaw = document.getElementById('hud-drone-yaw');
    const elVel = document.getElementById('hud-drone-vel');
    const elNeedle = document.getElementById('yaw-compass-needle');

    if (elXy) {
      elXy.textContent = `X: ${this.drone.x >= 0 ? '+' : ''}${this.drone.x}m, Y: ${this.drone.y >= 0 ? '+' : ''}${this.drone.y}m`;
    }
    if (elAlt) {
      elAlt.textContent = `${this.drone.altitude} m AGL`;
    }
    if (elYaw) {
      elYaw.textContent = `${deg.toFixed(1)}° (${this.getYawHeading(deg)})`;
    }
    if (elVel) {
      elVel.textContent = `${this.drone.velocity} m/s`;
    }
    if (elNeedle) {
      elNeedle.setAttribute('transform', `rotate(${deg} 12 12)`);
    }
  }

  getYawHeading(deg) {
    if (deg >= 337.5 || deg < 22.5) return 'N';
    if (deg >= 22.5 && deg < 67.5) return 'NE';
    if (deg >= 67.5 && deg < 112.5) return 'E';
    if (deg >= 112.5 && deg < 157.5) return 'SE';
    if (deg >= 157.5 && deg < 202.5) return 'S';
    if (deg >= 202.5 && deg < 247.5) return 'SW';
    if (deg >= 247.5 && deg < 292.5) return 'W';
    return 'NW';
  }

  destroy() {
    this.destroyed = true;
    if (this.animId) cancelAnimationFrame(this.animId);
    this.abortCtrl.abort();
    if (this.video) {
      this.video.pause();
      this.video.removeAttribute('src');
      this.video.load();
    }
  }
}
