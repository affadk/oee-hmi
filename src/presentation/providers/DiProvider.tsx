// /src/presentation/providers/DiProvider.tsx
// Canonical DI provider (composition root surface for React).
// Re-exports the infrastructure container context so presentation is the
// only layer that touches React context wiring.

import React, { createContext, useContext } from 'react';
import { AppContainer, defaultContainer } from '../../infrastructure/di/Container';

const DiContext = createContext<AppContainer>(defaultContainer);

export interface DiProviderProps {
  container?: AppContainer;
  children: React.ReactNode;
}

export const DiProvider: React.FC<DiProviderProps> = ({ container = defaultContainer, children }) => {
  return <DiContext.Provider value={container}>{children}</DiContext.Provider>;
};

export const useDiContainer = (): AppContainer => {
  return useContext(DiContext);
};
