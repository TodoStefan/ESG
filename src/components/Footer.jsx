import React from 'react';

export default function Footer({ setActiveTab }) {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-subtle)',
      background: 'var(--bg-card)',
      padding: '1.5rem 2rem',
      marginTop: 'auto',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
          ESG Check
          <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.5rem' }}>
            · Aktuelle Rechtslage: Omnibus-Paket März 2026 (EU)
          </span>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Dieses Tool dient der Orientierung und ersetzt keine Rechts- oder Steuerberatung.
        </div>
        <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.85rem' }}>
          <a href="https://www.wko.at" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>WKO ESG-Beratung ↗</a>
          <a href="https://www.oekb.at" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>OeKB ESG Data Hub ↗</a>
        </div>
      </div>
      <div style={{ maxWidth: '1400px', margin: '0.75rem auto 0', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        Für verbindliche Auskünfte wende dich an eine zuständige Wirtschaftskammer oder einen ESG-zertifizierten Berater.
        <div style={{ marginTop: '0.65rem', display: 'flex', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            style={{ background: 'none', border: 'none', color: 'var(--primary)', textDecoration: 'underline', cursor: 'pointer' }}
            onClick={() => setActiveTab?.('impressum')}
          >
            Impressum
          </button>
          <button
            type="button"
            style={{ background: 'none', border: 'none', color: 'var(--primary)', textDecoration: 'underline', cursor: 'pointer' }}
            onClick={() => setActiveTab?.('datenschutz')}
          >
            Datenschutz
          </button>
          <button
            type="button"
            style={{ background: 'none', border: 'none', color: 'var(--primary)', textDecoration: 'underline', cursor: 'pointer' }}
            onClick={() => setActiveTab?.('agb')}
          >
            AGB
          </button>
        </div>
      </div>
    </footer>
  );
}
