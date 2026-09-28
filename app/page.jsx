'use client';

import { useEffect } from 'react';
import TopStatusBar from '@/components/TopStatusBar';
import GasPanel from '@/components/GasPanel';
import SlamPanel from '@/components/SlamPanel';
import VisionPanel from '@/components/VisionPanel';
import MissionStatsPanel from '@/components/MissionStatsPanel';
import AlertLogPanel from '@/components/AlertLogPanel';
import Modals from '@/components/Modals';
import MotionFX from '@/components/MotionFX';
import { MineRescueApp } from '@/lib/app_controller';

export default function DashboardPage() {
  useEffect(() => {
    const app = new MineRescueApp();
    window.app = app;

    return () => {
      if (app) app.destroy();
    };
  }, []);

  return (
    <div id="app-root" className="dashboard-grid-container">
      <div className="dashboard-main">
        <TopStatusBar />

        <main className="dashboard-body">
          {/* LEFT COLUMN: ATMOSPHERIC GAS MONITOR */}
          <aside className="side-column left-column">
            <GasPanel />
          </aside>

          {/* CENTER HERO WORKSPACE: 2D SLAM MAP + DUAL-SPECTRUM VISION */}
          <div className="center-column center-split-column">
            <SlamPanel />
            <VisionPanel />
          </div>

          {/* RIGHT COLUMN: MISSION TELEMETRY & EVENT LOG */}
          <aside className="side-column right-column">
            <MissionStatsPanel />
            <AlertLogPanel />
          </aside>
        </main>
      </div>

      {/* MODALS: E-STOP & TACTICAL POI */}
      <Modals />

      {/* Pointer-tilt, value-flash & compass motion bindings (no visual output) */}
      <MotionFX />
    </div>
  );
}
