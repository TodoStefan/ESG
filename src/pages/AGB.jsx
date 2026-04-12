import React from 'react';

export default function AGB() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', animation: 'fadeIn 0.3s ease-in-out' }}>
      <div className="card">
        <div className="card-header" style={{ fontSize: '1.1rem' }}>Allgemeine Geschäftsbedingungen (AGB)</div>
        <div className="card-body" style={{ lineHeight: 1.65 }}>
          <h3 style={{ marginBottom: '0.4rem' }}>1. Geltungsbereich</h3>
          <p>
            Diese AGB gelten für die Nutzung der Plattform „ESG Check“.
          </p>

          <h3 style={{ marginTop: '1.25rem', marginBottom: '0.4rem' }}>2. Leistung</h3>
          <p>
            Das Tool stellt ESG-Selbstbewertung, Scoring, Historie und Auswertungen bereit.
          </p>

          <h3 style={{ marginTop: '1.25rem', marginBottom: '0.4rem' }}>3. Haftungsausschluss</h3>
          <p>
            Ergebnisse dienen der Orientierung. Eine Gewähr für Vollständigkeit, Richtigkeit und rechtliche Verwendbarkeit
            für externe Prüfungen wird nicht übernommen.
          </p>

          <h3 style={{ marginTop: '1.25rem', marginBottom: '0.4rem' }}>4. Verantwortung für Eingaben</h3>
          <p>
            Nutzende sind für die Wahrheitsgemäßheit und Aktualität der eingegebenen Daten verantwortlich.
          </p>

          <h3 style={{ marginTop: '1.25rem', marginBottom: '0.4rem' }}>5. Anonymisierte Datennutzung</h3>
          <p>
            Aggregierte und anonymisierte Daten können zur Verbesserung von Branchenreferenzwerten und Modellen verwendet werden.
          </p>

          <h3 style={{ marginTop: '1.25rem', marginBottom: '0.4rem' }}>6. Schlussbestimmungen</h3>
          <p>
            Es gilt österreichisches Recht. Gerichtsstand ist Wien, soweit gesetzlich zulässig.
          </p>
        </div>
      </div>
    </div>
  );
}
