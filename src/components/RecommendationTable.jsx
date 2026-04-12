import React from 'react';
import { AlertOctagon } from 'lucide-react';
import InfoTooltip from './InfoTooltip';

export default function RecommendationTable({ recs, headerTooltip = '' }) {
  if (!recs || recs.length === 0) return null;

  return (
    <div className="card">
      <div className="card-header">
        <AlertOctagon size={18} /> Maßnahmen-Priorisierung (To-Do Generator)
        {headerTooltip ? (
          <InfoTooltip
            text={headerTooltip}
            label="Info zu Maßnahmen-Priorisierung"
          />
        ) : null}
      </div>
      <div className="card-body card-body-tight">
        <div className="table-responsive">
          <table className="data-table recommendation-table">
            <colgroup>
              <col className="col-priority" />
              <col className="col-context" />
              <col className="col-action" />
              <col className="col-effort" />
              <col className="col-impact" />
            </colgroup>
            <thead>
              <tr>
                <th>Priorität</th>
                <th>Was bedeutet das?</th>
                <th>Empfohlene Maßnahme</th>
                <th>Aufwand</th>
                <th>Wirkung</th>
              </tr>
            </thead>
            <tbody>
              {recs.map((r, idx) => (
                <tr key={idx}>
                  <td>
                    <span className={`badge ${r.class}`}>{r.priority}</span>
                  </td>
                  <td className="rec-context">{r.text}</td>
                  <td className="rec-action">{r.action}</td>
                  <td className="rec-effort">{r.effort}</td>
                  <td className={r.class === 'badge-priority-risiko' ? 'rec-impact rec-impact-risk' : 'rec-impact rec-impact-positive'}>{r.impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
