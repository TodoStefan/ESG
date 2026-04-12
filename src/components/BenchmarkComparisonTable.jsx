import React from 'react';

const formatDelta = (value) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

const badgeClassByDirection = {
  up: 'badge-success',
  down: 'badge-danger',
  near: 'badge-neutral',
};

export default function BenchmarkComparisonTable({ comparisons = [] }) {
  if (!comparisons.length) return null;

  return (
    <div className="card">
      <div className="card-header">Branchenvergleich nach Referenzwerten</div>
      <div className="card-body card-body-tight">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Kennzahl</th>
                <th>Ist-Wert</th>
                <th>Branchenreferenz</th>
                <th>Abweichung</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((item) => (
                <tr key={item.key}>
                  <td style={{ fontWeight: 600 }}>{item.label}</td>
                  <td>{item.actual}</td>
                  <td>{item.target}</td>
                  <td className={item.status.direction === 'down' ? 'text-danger' : 'text-success'}>
                    {formatDelta(item.status.deltaPercent)}
                  </td>
                  <td>
                    <span className={`badge ${badgeClassByDirection[item.status.direction] || 'badge-neutral'}`}>
                      {item.status.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
