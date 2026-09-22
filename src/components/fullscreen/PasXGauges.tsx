// /src/components/fullscreen/PasXGauges.tsx

import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface PasXDonutGaugeProps {
  label: string; // e.g. "OEE", "AVA", "QUA", "PER"
  value: number; // e.g. 65, 98, 72
  size?: 'large' | 'medium';
  color?: string; // e.g. '#48a43f' (green) or '#eab308' (yellow)
  subtitle?: string; // e.g. "219m / 420m"
  rawLines?: string[]; // raw calculation numbers stacked vertically
  onClick?: () => void;
}

export const PasXDonutGauge: React.FC<PasXDonutGaugeProps> = ({
  label,
  value,
  size = 'medium',
  color = '#48a43f',
  subtitle,
  rawLines,
  onClick,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const isLarge = size === 'large';
  // Chart mengisi tinggi container aktual via flex-fill + aspect-ratio (relatif penuh,
  // bukan proxy vh) — muat di layar kecil maupun fullscreen. Font tetap vh-relatif
  // karena layout 100dvh sehingga vh proporsional terhadap container.
  const diameter = isLarge ? 210 : 176;
  const valueFontSize = isLarge ? 'clamp(24px, 4.6vh, 48px)' : 'clamp(16px, 2.8vh, 26px)';
  const labelFontSize = isLarge ? 'clamp(10px, 1.6vh, 16px)' : 'clamp(9px, 1.3vh, 12px)';
  const strokeWidth = isLarge ? 18 : 16;
  const radius = (diameter - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(100, Math.max(0, value));
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  const trackColor = isDark ? '#1e293b' : '#e2e8f0';

  return (
    <div
      onClick={onClick}
      className={`flex flex-col items-center justify-center cursor-pointer select-none transition-transform hover:scale-102 min-h-0 min-w-0 shrink-0 h-full max-h-full ${
        isLarge ? 'p-2' : 'p-0.5'
      }`}
      title={`${label}: ${value}% (Click for calculation formula)`}
    >
      <div className="relative flex items-center justify-center min-h-0 min-w-0" style={{ flex: '1 1 0', aspectRatio: '1 / 1', maxWidth: '100%', maxHeight: '100%' }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${diameter} ${diameter}`} preserveAspectRatio="xMidYMid meet" className="overflow-visible block">
          {/* Background circle track */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />

          {/* Value Progress Arc (starts from 12 o'clock, clockwise) */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${diameter / 2} ${diameter / 2})`}
            className="transition-all duration-700 ease-out"
          />

        </svg>

        {/* Center Text (Value % and Label) — font relatif terhadap tinggi container */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span
            className="font-sans font-extrabold leading-none tracking-tight"
            style={{ color, fontSize: valueFontSize }}
          >
            {Math.round(value)}%
          </span>
          <span
            className="font-sans font-bold uppercase tracking-wider mt-1"
            style={{ color, fontSize: labelFontSize }}
          >
            {label}
          </span>
        </div>
      </div>
      {rawLines && rawLines.length > 0 ? (
        <div className="flex flex-col items-center space-y-0 font-mono shrink-0" style={{ marginTop: '0.6vh', fontSize: 'clamp(11px, 1.7vh, 14px)', lineHeight: 1.35 }}>
          {rawLines.map((line, idx) => {
            const colonIndex = line.indexOf(':');
            if (colonIndex !== -1) {
              const key = line.slice(0, colonIndex).trim();
              const val = line.slice(colonIndex + 1).trim();
              return (
                <div key={idx} className="flex items-center gap-1 whitespace-nowrap">
                  <span className="font-bold font-mono text-slate-400 dark:text-slate-400">
                    {key}:
                  </span>
                  <span className={`font-semibold ${
                    isDark ? 'text-slate-200' : 'text-slate-700'
                  }`}>
                    {val}
                  </span>
                </div>
              );
            }
            return (
              <span
                key={idx}
                className={`whitespace-nowrap ${isDark ? 'text-slate-300 font-medium' : 'text-slate-600 font-medium'}`}
              >
                {line}
              </span>
            );
          })}
        </div>
      ) : subtitle ? (
        <span className={`text-xs font-mono font-medium mt-1 text-center whitespace-nowrap ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}>
          {subtitle}
        </span>
      ) : null}
    </div>
  );
};

interface PasXTachometerGaugeProps {
  currentRate: number; // e.g. 203
  targetRate: number;  // e.g. 400
  unit?: string;       // e.g. "pcs/h"
}

export const PasXTachometerGauge: React.FC<PasXTachometerGaugeProps> = ({
  currentRate,
  targetRate,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const width = 196;
  const height = 108;
  const strokeWidth = 18;
  const radius = 76;
  const cx = width / 2;
  const cy = height - 4;

  // Semi-circle arc length = PI * radius
  const arcLength = Math.PI * radius;
  const ratio = targetRate > 0 ? Math.min(1, Math.max(0, currentRate / targetRate)) : 0;
  const strokeDashoffset = arcLength - ratio * arcLength;

  const trackColor = isDark ? '#1e293b' : '#e2e8f0';
  const progressColor = '#eab308'; // Werum PAS-X yellow/amber tachometer arc
  const needleColor = isDark ? '#cbd5e1' : '#334155';
  const pivotFill = isDark ? '#e2e8f0' : '#1e293b';
  const pivotStroke = isDark ? '#0f172a' : '#ffffff';
  const needleAngle = ratio * 180 - 90;

  return (
    <div className="flex items-center justify-center select-none w-full h-full">
      <div className="relative w-full h-full" style={{ aspectRatio: `${width} / ${height}`, maxWidth: '100%', maxHeight: '100%' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="xMidYMax meet" className="overflow-visible block">
          {/* Background Semi-circle Arc (from 180 deg to 0 deg) */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
          />

          {/* Progress Arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke={progressColor}
            strokeWidth={strokeWidth}
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="butt"
            className="transition-all duration-700 ease-out"
          />

          {/* Needle Marker Indicator — SVG agar ikut skala container */}
          <g transform={`rotate(${needleAngle} ${cx} ${cy})`} className="transition-all duration-700">
            <line
              x1={cx}
              y1={cy}
              x2={cx}
              y2={cy - (radius + 6)}
              stroke={needleColor}
              strokeWidth={3}
              strokeLinecap="round"
            />
          </g>

          {/* Pivot circle */}
          <circle cx={cx} cy={cy} r={7} fill={pivotFill} stroke={pivotStroke} strokeWidth={2} />
        </svg>
      </div>
    </div>
  );
};
