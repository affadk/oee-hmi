// /src/infrastructure/di/DiContext.tsx

import React, { createContext, useContext } from 'react';
import { AppContainer, defaultContainer } from './Container';

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
