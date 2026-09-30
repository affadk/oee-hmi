// /src/presentation/pages/shared/MachineIdentity.tsx
// Blok identitas mesin bersama: nama + line (bila ada) + device id (bila ada).
// Dipakai HeaderZone (audit) dan FullscreenSubHeader (overview) agar tidak duplikat.

import React from 'react';

export interface MachineIdentityProps {
  machineName: string;
  machineLine?: string | null;
  deviceId?: string | null;
  /** Ukuran judul: sub-header audit memakai class audit, fullscreen memakai skala besar. */
  titleClassName?: string;
  isDark: boolean;
}

export const MachineIdentity: React.FC<MachineIdentityProps> = ({
  machineName,
  machineLine,
  deviceId,
  titleClassName,
  isDark,
}) => (
  <div className="flex flex-col">
    <h1 className={titleClassName ?? `audit-name font-black tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
      {machineName}
    </h1>
    {machineLine ? (
      <span className={`text-sm sm:text-base font-bold mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
        {machineLine}
      </span>
    ) : null}
    {deviceId ? (
      <span
        className={`font-mono text-sm sm:text-base font-bold mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
        title="Device ID edge controller"
      >
        {deviceId}
      </span>
    ) : null}
  </div>
);
