'use client';

import { useEffect } from 'react';

const TILT_SELECTOR = '.gas-metric-card, .stat-card, .cam-box, .env-chip, .status-chip';
const TILT_MAX_DEG = 5;

const FLASH_IDS = [
  'val-gas-co',
  'val-gas-ch4',
  'val-gas-co2',
  'val-gas-h2s',
  'val-gas-o2',
  'val-env-temp',
  'val-env-hum',
  'stat-survivors-count',
  'stat-hazards-count',
  'stat-area-explored',
  'stat-dist-traveled',
  'val-battery-pct',
  'val-mesh-latency',
];

/**
 * Pure side-effect component: pointer-based 3D tilt on cards, a brief
 * "value flash" glow whenever a watched telemetry reading updates, and
 * rotation binding for the yaw compass needle. Renders nothing.
 */
export default function MotionFX() {
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    // 1. Pointer-based 3D tilt
    const tiltEls = Array.from(document.querySelectorAll(TILT_SELECTOR));
    tiltEls.forEach((el) => {
      let raf = null;
      el.addEventListener(
        'pointermove',
        (e) => {
          if (raf) return;
          raf = requestAnimationFrame(() => {
            const rect = el.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width - 0.5;
            const py = (e.clientY - rect.top) / rect.height - 0.5;
            el.style.transform = `perspective(700px) rotateX(${(-py * TILT_MAX_DEG).toFixed(2)}deg) rotateY(${(px * TILT_MAX_DEG).toFixed(2)}deg) translateZ(2px)`;
            raf = null;
          });
        },
        { signal }
      );
      el.addEventListener(
        'pointerleave',
        () => {
          el.style.transform = '';
        },
        { signal }
      );
    });

    // 2. Value-flash on telemetry updates (MutationObserver, decoupled from telemetry engine)
    const flashObservers = [];
    FLASH_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      let lastText = el.textContent;
      const obs = new MutationObserver(() => {
        if (el.textContent !== lastText) {
          lastText = el.textContent;
          el.classList.remove('value-flash');
          // eslint-disable-next-line no-void
          void el.offsetWidth; // restart animation
          el.classList.add('value-flash');
        }
      });
      obs.observe(el, { characterData: true, childList: true, subtree: true });
      flashObservers.push(obs);
    });

    // 3. Yaw compass needle rotation, bound to the existing #hud-drone-yaw text
    const yawEl = document.getElementById('hud-drone-yaw');
    const needle = document.getElementById('yaw-compass-needle');
    let yawObserver = null;
    if (yawEl && needle) {
      const applyRotation = () => {
        const match = yawEl.textContent.match(/(-?\d+(?:\.\d+)?)/);
        if (match) {
          const deg = parseFloat(match[1]);
          needle.style.transform = `rotate(${deg}deg)`;
        }
      };
      applyRotation();
      yawObserver = new MutationObserver(applyRotation);
      yawObserver.observe(yawEl, { characterData: true, childList: true, subtree: true });
    }

    // 4. Per-panel "expand to full screen" toggle
    let backdrop = null;
    const triggerRedraw = () => {
      window.dispatchEvent(new Event('resize'));
      if (window.telemetry && typeof window.telemetry.renderTrendSparkline === 'function') {
        window.telemetry.renderTrendSparkline();
      }
    };

    const closeMaximized = () => {
      const el = document.querySelector('.hud-panel.panel-maximized');
      if (el) el.classList.remove('panel-maximized');
      if (backdrop) {
        backdrop.remove();
        backdrop = null;
      }
      setTimeout(triggerRedraw, 50);
    };

    document.querySelectorAll('.panel-maximize-btn').forEach((btn) => {
      btn.addEventListener(
        'click',
        (e) => {
          e.stopPropagation();
          const panel = btn.closest('.hud-panel');
          if (!panel) return;
          const alreadyMax = panel.classList.contains('panel-maximized');
          closeMaximized();
          if (!alreadyMax) {
            panel.classList.add('panel-maximized');
            backdrop = document.createElement('div');
            backdrop.className = 'panel-maximized-backdrop';
            backdrop.addEventListener('click', closeMaximized, { signal });
            document.body.appendChild(backdrop);
            setTimeout(triggerRedraw, 50);
          }
        },
        { signal }
      );
    });

    document.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'Escape') closeMaximized();
      },
      { signal }
    );

    return () => {
      controller.abort();
      flashObservers.forEach((o) => o.disconnect());
      if (yawObserver) yawObserver.disconnect();
      closeMaximized();
    };
  }, []);

  return null;
}
