import React from 'react';
import type { BackendHealth } from '../../../domain/ports/IOeeBackend';

interface HealthFooterProps {
  health: BackendHealth | null;
  useBackend?: boolean;
  isDark: boolean;
}

export const HealthFooter: React.FC<HealthFooterProps> = ({ health, useBackend = false, isDark }) => {
  if (!useBackend || !health) return null;
  const formatUptime = (sec: number | null): string => {
    if (sec === null) return '—';
    const hours = Math.floor(sec / 3600);
    if (hours < 48) return `${Math.floor(sec / 60)}m`;
    return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  };
  return (
    <span className={`hidden md:inline-flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
      <span>Backend: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{health.status}</strong></span>
      <span>WS: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{health.wsClients ?? '—'}</strong></span>
      <span>Buffer: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{health.bufferPending ?? '—'}</strong></span>
      <span>Uptime: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{formatUptime(health.uptimeSec)}</strong></span>
    </span>
  );
};
