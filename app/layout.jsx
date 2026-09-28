import './globals.css';

export const metadata = {
  title: 'UPTHRUST | Subterranean Mine Safety, Monitoring & Autonomous Rescue System',
  description:
    'Team Upthrust - AI-Powered Underground Mine Safety, Monitoring & Autonomous Rescue System | RPLiDAR SLAM, FLIR Thermal, ROS 2 Jazzy & Nav2 Command Console',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const themeInitScript = `(function () {
  try {
    localStorage.removeItem('upthrust-theme');
    document.documentElement.removeAttribute('data-theme');
  } catch (e) {}
})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Untitled UI Typography: Inter (UI) + JetBrains Mono (data/telemetry) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Apply persisted theme before first paint to avoid a flash */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
