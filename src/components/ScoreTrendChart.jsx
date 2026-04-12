import React from 'react';

export default function ScoreTrendChart({ trend = [] }) {
  if (!trend.length) {
    return <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Noch keine Verlaufspunkte vorhanden.</p>;
  }

  const width = 520;
  const height = 140;
  const padding = 16;
  const maxY = 100;

  const points = trend
    .map((item, idx) => {
      const x = padding + (idx * (width - padding * 2)) / Math.max(1, trend.length - 1);
      const y = height - padding - (Math.max(0, Math.min(maxY, item.total)) / maxY) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="140" role="img" aria-label="ESG Score Trend">
        <polyline
          fill="none"
          stroke="var(--primary)"
          strokeWidth="3"
          points={points}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="trend-labels">
        {trend.map((item, idx) => (
          <span key={`${item.date}-${idx}`}>{item.label}</span>
        ))}
      </div>
    </div>
  );
}
