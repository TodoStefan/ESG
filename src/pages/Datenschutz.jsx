import React from 'react';

export default function Datenschutz() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', animation: 'fadeIn 0.3s ease-in-out' }}>
      <div className="card">
        <div className="card-header" style={{ fontSize: '1.1rem' }}>Datenschutzerklärung (DSGVO)</div>
        <div className="card-body" style={{ lineHeight: 1.65 }}>
          <h3 style={{ marginBottom: '0.4rem' }}>1. Datenschutz auf einen Blick</h3>
          <p>
            Der Schutz Ihrer personenbezogenen und unternehmensbezogenen Daten ist uns wichtig. Wir verarbeiten Daten gemäß
            DSGVO und geltenden österreichischen Datenschutzbestimmungen.
          </p>

          <h3 style={{ marginTop: '1.25rem', marginBottom: '0.4rem' }}>2. Verantwortliche Stelle</h3>
          <p>
            ESG Check GmbH<br />
            Musterstraße 1, 1010 Wien<br />
            E-Mail: privacy@esg-check.at
          </p>

          <h3 style={{ marginTop: '1.25rem', marginBottom: '0.4rem' }}>3. Verarbeitete Daten</h3>
          <p>
            Bei Nutzung des ESG-Tools werden die von Ihnen eingegebenen Unternehmensdaten zur Berechnung,
            Historisierung und Auswertung verarbeitet.
          </p>

          <h3 style={{ marginTop: '1.25rem', marginBottom: '0.4rem' }}>4. Zweck und Rechtsgrundlage</h3>
          <p>
            Die Verarbeitung erfolgt zur Bereitstellung des Services und auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO.
          </p>

          <h3 style={{ marginTop: '1.25rem', marginBottom: '0.4rem' }}>5. Aggregierung und Anonymisierung</h3>
          <p>
            Für Branchenreferenzwerte können Daten in aggregierter und anonymisierter Form verwendet werden,
            sofern keine Rückschlüsse auf einzelne Unternehmen möglich sind.
          </p>

          <h3 style={{ marginTop: '1.25rem', marginBottom: '0.4rem' }}>6. Ihre Rechte</h3>
          <p>
            Ihnen stehen Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerruf und Widerspruch zu.
            Bei Fragen kontaktieren Sie bitte privacy@esg-check.at.
          </p>
        </div>
      </div>
    </div>
  );
}
