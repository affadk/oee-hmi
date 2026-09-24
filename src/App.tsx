// /src/App.tsx

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DiProvider } from './presentation/providers/DiProvider';
import { ThemeProvider } from './presentation/providers/ThemeProvider';
import { DashboardPage } from './presentation/pages/DashboardPage';
import { OverviewPage } from './presentation/pages/OverviewPage';
import { AuditPage } from './presentation/pages/AuditPage';

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
              <Route path="/overview" element={<OverviewPage />} />
              <Route path="/audit" element={<AuditPage />} />
              <Route path="*" element={<Navigate to="/overview" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </DiProvider>
  );
}
