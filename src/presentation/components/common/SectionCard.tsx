// Canonical shared section primitives for audit + fullscreen cards.

import React from 'react';
import { useTheme } from '../../providers/ThemeProvider';

export const sectionCardClass = (isDark: boolean): string =>
  `min-w-0 max-w-full rounded-xl border p-[clamp(8px,1vh,14px)] shadow-sm transition-colors ${
    isDark ? 'bg-[#0f1b2e] border-slate-800' : 'bg-white border-[#c9d3df]'
  }`;

export const innerTileClass = (isDark: boolean): string =>
  `rounded-lg border p-3 min-w-0 overflow-hidden ${
    isDark ? 'bg-[#132238] border-slate-800' : 'bg-[#eef2f7] border-[#c9d3df]'
  }`;

export const SectionCard: React.FC<{
  id?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ id, className = '', children }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <section id={id} className={`${sectionCardClass(isDark)} ${className}`}>
      {children}
    </section>
  );
};

export const SectionHeader: React.FC<{
  title: string;
  right?: React.ReactNode;
}> = ({ title, right }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pb-[1vh] mb-[0.6vh] border-b border-slate-200 dark:border-slate-800">
      <h2 className={`text-sm font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
        {title}
      </h2>
      {right}
    </div>
  );
};
