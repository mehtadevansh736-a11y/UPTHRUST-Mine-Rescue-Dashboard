# 🚁 UPTHRUST | Subterranean Mine Safety, Monitoring & Autonomous Rescue System

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![ROS 2](https://img.shields.io/badge/ROS_2-Jazzy-22314E?style=for-the-badge&logo=ros)](https://docs.ros.org/)
[![Live Demo](https://img.shields.io/badge/Live_Demo-upthrustmissionmonitor.vercel.app-00C7B7?style=for-the-badge&logo=vercel)](https://upthrustmissionmonitor.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> **Team Upthrust Ground Control Station (GCS)**: A mission-critical, high-performance web console engineered for autonomous drone exploration, real-time RPLiDAR 2D SLAM mapping, dual-spectrum thermal computer vision, multi-gas atmospheric sensing, and subterranean search-and-rescue operations.
>
> 🌐 **Live Website**: [https://upthrustmissionmonitor.vercel.app](https://upthrustmissionmonitor.vercel.app)

---

## 🌟 Key Features & Subsystems

### 1. 🗺️ 2D RPLiDAR SLAM Video & Map Viewport Engine
- **Authentic LiDAR Stream Playback**: Synchronized LiDAR scan video overlay with interactive 60 FPS canvas rendering.
- **Interactive Viewport Controls**: Smooth panning, multi-level continuous zoom ($0.4\times$ to $4.5\times$), tactical crosshair reticle, drone auto-centering, and reset view.
- **Subterranean Target & Hazard Overlays**: Real-time POI tracking of detected survivors, high-risk methane/CO hotspots, and waypoint flight paths.

### 2. 👁️ Dual-Spectrum AI Vision Engine
- **Thermal FLIR & Surface RGB**: Instant switching between Thermal IR pseudo-coloring and RGB optical camera feeds.
- **AI YOLOv8 Detection HUD**: Real-time bounding box tracking for trapped miners, thermal signatures ($36.8^\circ\text{C}$), vitals estimation (breathing & pulse rates), and structural cave-in obstacles.

### 3. 💨 Multi-Gas Atmospheric Telemetry & Trend Analytics
- **Live Gas Monitoring Cards**: High-precision telemetry for Carbon Monoxide ($\text{CO}$), Methane ($\text{CH}_4$), Carbon Dioxide ($\text{CO}_2$), Hydrogen Sulphide ($\text{H}_2\text{S}$), and Oxygen ($\text{O}_2$).
- **Environmental Strip**: Live SHT31 ambient temperature and relative humidity tracking with threshold status indicators.
- **Multi-Gas 30s Concentration Sparkline**: Real-time gradient-filled area trend visualization with dynamic high-DPI canvas auto-sizing.
- **Adaptive Fullscreen Layout**: Proportional flex distribution eliminating dead space across any screen resolution.

### 4. 🎮 Nav2 Autonomous Command & Mission Controls
- **Tactical Flight Modes**: Seamless switching between Autonomous Search (`NAV2_ACTIVE`), Assisted Manual, Waypoint Patrolling, and Return-to-Launch (`RTL`).
- **Emergency Stop (`E-STOP`)**: Immediate flight motor disarm and system freeze override with visual and audible hazard warnings.
- **Real-time Mission Clock**: Elapsed mission timer ($T+$) with sub-second synchronization.

### 5. ⚡ Link Health & System Vitals HUD
- **LiPo Battery Telemetry**: 6S LiPo percentage gauge, cell voltage monitoring ($22.8\text{V}$), and remaining flight time ETA calculation.
- **Ubiquiti 5.8GHz Mesh RF Link**: Live latency tracking with realistic RF signal jitter and link quality indicators.
- **RPi Compute Telemetry**: Quad-core CPU load percentage, RAM utilization, and SoC thermal telemetry.

### 6. 🔊 Synthetic Tactical Audio Engine
- **Web Audio API Sound Synthesis**: Zero-dependency procedural sound effects for sonar pings, hazard alert sirens, and command execution acknowledgments.

---

## 🏗️ Architecture & Technology Stack

| Component | Technology / Framework |
| :--- | :--- |
| **Frontend Framework** | [Next.js 15.5](https://nextjs.org/) (App Router) + [React 19.1](https://react.dev/) |
| **Styling & Design System** | Custom Vanilla CSS (Modern Industrial Dark/Light Aerospace Theme) |
| **Typography** | Inter (UI Controls) + JetBrains Mono (Telemetry & Sensor Readouts) |
| **Rendering Engines** | HTML5 Canvas 2D / WebGL 60 FPS Real-time Loops |
| **Audio Engine** | Native Web Audio API Procedural Oscillator Synthesizer |
| **Deployment Platform** | [Vercel](https://vercel.com/) Edge Network |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.17 or later recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

### Installation
```bash
# Clone the repository
git clone https://github.com/mehtadevansh736-a11y/mine-rescue-dashboard.git

# Navigate into project directory
cd mine-rescue-dashboard

# Install dependencies
npm install
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the live dashboard.

### Production Build
```bash
npm run build
npm run start
```

---

## 🌐 Deployment on Vercel

This repository is optimized for one-click deployment on **Vercel**:

1. Push your changes to GitHub.
2. Import the project in [Vercel Dashboard](https://vercel.com/new).
3. Framework preset will automatically be detected as **Next.js**.
4. Click **Deploy**!

---

## 👥 Team Upthrust

- **Project**: Autonomous Subterranean Mine Search, Rescue & Environmental Monitoring Drone System
- **Focus Area**: Autonomous Robotics, Subterranean SLAM, Computer Vision & Edge AI

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
