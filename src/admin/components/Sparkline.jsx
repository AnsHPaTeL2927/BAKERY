import { ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function Sparkline({ data = [], dataKey = 'value', color = '#D94C7B', height = 40 }) {
  if (!data.length) return <div style={{ height }} />;

  const gradientId = `spark-${dataKey}-${color.replace('#', '')}`;

  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} isAnimationActive />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
