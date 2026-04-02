import { useMemo } from 'react';

export default function SparkLine({ data = [], color = '#00d4ff', width = 80, height = 28 }) {
  const path = useMemo(() => {
    if (data.length < 2) return '';
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);

    const points = data.map((val, i) => ({
      x: i * stepX,
      y: height - ((val - min) / range) * (height - 4) - 2,
    }));

    // Smooth curve using cubic bezier
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      d += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  }, [data, width, height]);

  const gradientId = useMemo(() => `spark-${Math.random().toString(36).slice(2, 8)}`, []);

  if (data.length < 2) return null;

  // Fill area path
  const areaPath = path + ` L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      {/* End dot */}
      <circle
        cx={width}
        cy={(() => {
          const max = Math.max(...data, 1);
          const min = Math.min(...data, 0);
          const range = max - min || 1;
          return height - ((data[data.length - 1] - min) / range) * (height - 4) - 2;
        })()}
        r={2.5}
        fill={color}
      />
    </svg>
  );
}
