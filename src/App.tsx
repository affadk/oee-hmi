// /src/App.tsx

import { DiProvider } from './presentation/providers/DiProvider';
import { ThemeProvider } from './presentation/providers/ThemeProvider';
import { DashboardPage } from './presentation/pages/DashboardPage';

/**
 * Root Application Entry Point
 * Wires the Dependency Injection Provider, Theme Provider, and mounts the Presentation Dashboard Page.
 */
export default function App() {
  return (
    <DiProvider>
      <ThemeProvider>
        <DashboardPage />
      </ThemeProvider>
    </DiProvider>
  );
}
