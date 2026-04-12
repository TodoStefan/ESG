import React from 'react';

export default function AuditLog({ auditLog, loading, error }) {
  if (loading) {
    return (
      <div className="card" style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
        <div className="card-header">Verlaufsprotokoll</div>
        <div className="card-body">Lade Verlaufsdaten …</div>
      </div>
    );
  }

  return (
    <div className="card" style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
      <div className="card-header">Verlaufsprotokoll</div>
      {error && (
        <div style={{ padding: '0.75rem 1rem', color: 'var(--danger-text)', background: 'var(--danger-bg)', borderBottom: '1px solid var(--border-subtle)' }}>
          {error}
        </div>
      )}
      <div className="card-body card-body-tight">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Zeitpunkt</th>
                <th>Benutzer / Quelle</th>
                <th>Aktion</th>
                <th>ESG-Wert-Änderung</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {auditLog && auditLog.length > 0 ? (
                auditLog.map((log) => (
                  <tr key={log.id || `${log.created_at}-${log.action}`}>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(log.created_at).toLocaleString('de-AT', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td style={{ fontWeight: 500 }}>{log.actor || log.user}</td>
                    <td>{log.action}</td>
                    <td>
                      {/* Fallback if old format logic exists */}
                      {log.impact && log.impact.props ? log.impact : (
                        <span className={String(log.impact).includes('-') ? 'text-danger' : (String(log.impact).includes('+') ? 'text-success' : 'text-muted')}>
                          {log.impact}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${log.status === 'Geprüft' ? 'badge-success' : 'badge-warning'}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Keine Einträge vorhanden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
