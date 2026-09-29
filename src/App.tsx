// /src/App.tsx

import React, { Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DiProvider } from './presentation/providers/DiProvider';
import { ThemeProvider } from './presentation/providers/ThemeProvider';
import { DashboardPage } from './presentation/pages/DashboardPage';

const OverviewPage = React.lazy(() =>
  import('./presentation/pages/OverviewPage').then((m) => ({ default: m.OverviewPage })),
);
const AuditPage = React.lazy(() =>
  import('./presentation/pages/AuditPage').then((m) => ({ default: m.AuditPage })),
);

const RouteFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center font-mono text-sm bg-[#070d1a] text-slate-300">
    Loading view…
  </div>
);

/**
 * Root Application Entry Point
 * Wires the Dependency Injection Provider and Theme Provider, then mounts the
 * router. DashboardPage is the shared parent route (data shell + modals +
 * floating switcher); the two pages render as its child routes:
 * - /overview — OEE Shift Overview (TV/floor fullscreen view)
 * - /audit    — Detailed Audit Dashboard
 */
export default function App() {
  return (
    <DiProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<DashboardPage />}>
              <Route path="/" element={<Navigate to="/overview" replace />} />
              <Route path="/overview" element={<Suspense fallback={<RouteFallback />}><OverviewPage /></Suspense>} />
              <Route path="/audit" element={<Suspense fallback={<RouteFallback />}><AuditPage /></Suspense>} />
              <Route path="*" element={<Navigate to="/overview" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </DiProvider>
  );
}
