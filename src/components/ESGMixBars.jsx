import React from 'react';

export default function ESGMixBars({ items = [] }) {
  if (!items.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {items.map((item) => (
        <div key={item.key}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 600 }}>{item.label}</span>
            <span>{item.value} / 100</span>
          </div>
          <div className="progress-bar-container" style={{ marginTop: 0 }}>
            <div className="progress-bar" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}
