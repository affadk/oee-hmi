// /src/presentation/components/charts/PasXTachometerGauge.tsx
// Tachometer / semi-circle needle gauge.
// Extracted from PasXGauges.tsx for single-responsibility.

import React from 'react';
import { useTheme } from '../../providers/ThemeProvider';

export interface PasXTachometerGaugeProps {
  currentRate: number; // e.g. 203
  targetRate: number;  // e.g. 400
  unit?: string;       // e.g. "pcs/h"
  width?: number;      // viewBox width, default 196
  height?: number;     // viewBox height, default 108
  onClick?: () => void;
}

export const PasXTachometerGauge: React.FC<PasXTachometerGaugeProps> = ({
  currentRate,
  targetRate,
  width = 196,
  height = 108,
  onClick,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const strokeWidth = Math.round(width * 0.092);
  const radius = Math.round(width * 0.39); // was 76 for width=196
  const cx = Math.round(width / 2);
  const cy = Math.round(height - 4);

  // Semi-circle arc length = PI * radius
  const arcLength = Math.PI * radius;
  const ratio = targetRate > 0 ? Math.min(1, Math.max(0, currentRate / targetRate)) : 0;
  const strokeDashoffset = arcLength - ratio * arcLength;

  const trackColor = isDark ? '#1e293b' : '#cbd5e1';
  const progressColor = '#eab308'; // PasX amber/yellow
  const needleColor = isDark ? '#cbd5e1' : '#334155';
  const pivotFill = isDark ? '#e2e8f0' : '#1e293b';
  const pivotStroke = isDark ? '#0f172a' : '#ffffff';
  const needleAngle = ratio * 180 - 90;

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-center select-none w-full h-full"
      title={`${currentRate} / ${targetRate} pcs/h`}
    >
      <div
        className="relative w-full h-full"
        style={{ aspectRatio: `${width} / ${height}`, maxWidth: '100%', maxHeight: '100%' }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMax meet"
          className="overflow-visible block"
        >
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

          {/* Needle Marker Indicator */}
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
