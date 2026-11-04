import React from 'react';

export default function MetricSparkline({
  data = [10, 12, 11, 14, 13, 16, 15],
  status = 'safe',
  width = 110,
  height = 36,
  className = '',
}) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  const padding = 4;
  const graphHeight = height - padding * 2;
  const graphWidth = width - padding * 2;

  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * graphWidth;
    const y = height - padding - ((val - min) / range) * graphHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const linePath = `M ${points.join(' L ')}`;
  const areaPath = `M ${padding},${height} L ${points.join(' L ')} L ${width - padding},${height} Z`;

  const colorMap = {
    safe: { stroke: '#10B981', fill: 'rgba(16, 185, 129, 0.15)' },
    moderate: { stroke: '#F59E0B', fill: 'rgba(245, 158, 11, 0.15)' },
    unsafe: { stroke: '#EF4444', fill: 'rgba(239, 68, 68, 0.15)' },
    cyan: { stroke: '#00F5FF', fill: 'rgba(0, 245, 255, 0.15)' },
  };

  const colors = colorMap[status] || colorMap.safe;
  const gradId = `sparkGrad-${Math.random().toString(36).substr(2, 6)}`;

  return (
    <div className={`inline-block ${className}`} style={{ width, height }}>
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.stroke} stopOpacity="0.35" />
            <stop offset="100%" stopColor={colors.stroke} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={colors.stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* End pulse dot */}
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].split(',')[0]}
            cy={points[points.length - 1].split(',')[1]}
            r="3"
            fill={colors.stroke}
          />
        )}
      </svg>
    </div>
  );
}
