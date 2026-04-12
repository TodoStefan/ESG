import React, { useState } from 'react';
import { Check, ShieldCheck } from 'lucide-react';

const STORAGE_KEY = 'esg_cookie_consent';

export default function CookieConsent({ onOpenDatenschutz }) {
  const [show, setShow] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return !saved;
  });
  const [showOptions, setShowOptions] = useState(false);
  const [consent, setConsent] = useState({
    essential: true,
    analytics: false,
    marketing: false,
  });

  const save = (value) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border-subtle)',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.1)',
        zIndex: 9999,
        padding: '1rem 1.25rem',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
          <ShieldCheck size={18} />
          <h3 style={{ margin: 0, fontSize: '1rem' }}>Cookie-Einstellungen</h3>
        </div>

        <p style={{ fontSize: '0.9rem', marginBottom: '0.9rem' }}>
          Wir verwenden essenzielle Cookies für die Grundfunktionalität. Optionale Cookies helfen uns,
          die Anwendung zu verbessern. Weitere Informationen findest du in der Datenschutzerklärung.
        </p>

        {showOptions && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.8rem', marginBottom: '0.9rem', padding: '0.9rem', border: '1px solid var(--border-subtle)', borderRadius: '8px', background: 'var(--bg-hover)' }}>
            <label style={{ display: 'flex', gap: '8px', opacity: 0.75 }}>
              <input type="checkbox" checked disabled />
              <span><strong>Essenziell</strong><br />Erforderlich für Grundfunktionen.</span>
            </label>
            <label style={{ display: 'flex', gap: '8px' }}>
              <input type="checkbox" checked={consent.analytics} onChange={(e) => setConsent((prev) => ({ ...prev, analytics: e.target.checked }))} />
              <span><strong>Analyse</strong><br />Anonyme Nutzungsstatistiken.</span>
            </label>
            <label style={{ display: 'flex', gap: '8px' }}>
              <input type="checkbox" checked={consent.marketing} onChange={(e) => setConsent((prev) => ({ ...prev, marketing: e.target.checked }))} />
              <span><strong>Marketing</strong><br />Optionale Drittanbieter-Inhalte.</span>
            </label>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-outline" onClick={() => setShowOptions((prev) => !prev)}>
              {showOptions ? 'Optionen ausblenden' : 'Optionen anpassen'}
            </button>
            <button className="btn btn-outline" onClick={onOpenDatenschutz}>Datenschutz öffnen</button>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-outline" onClick={() => save({ essential: true, analytics: false, marketing: false })}>
              Nur essenzielle
            </button>
            {showOptions && (
              <button className="btn btn-outline" onClick={() => save(consent)}>Auswahl speichern</button>
            )}
            <button className="btn btn-primary" onClick={() => save({ essential: true, analytics: true, marketing: true })}>
              <Check size={14} /> Alle akzeptieren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
