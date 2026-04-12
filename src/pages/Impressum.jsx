import React from 'react';

export default function Impressum() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', animation: 'fadeIn 0.3s ease-in-out' }}>
      <div className="card">
        <div className="card-header" style={{ fontSize: '1.1rem' }}>Impressum</div>
        <div className="card-body" style={{ lineHeight: 1.65 }}>
          <p>
            Informationspflicht laut § 5 ECG, § 14 UGB, § 63 GewO und Offenlegungspflicht laut § 25 MedienG.
          </p>

          <h3 style={{ marginTop: '1.25rem', marginBottom: '0.4rem' }}>Verantwortlich für den Inhalt</h3>
          <p>
            <strong>ESG Check GmbH</strong> (Musterunternehmen)<br />
            Musterstraße 1<br />
            1010 Wien, Österreich
          </p>

          <h3 style={{ marginTop: '1.25rem', marginBottom: '0.4rem' }}>Kontakt</h3>
          <p>
            Telefon: +43 1 234 567 89<br />
            E-Mail: office@esg-check.at<br />
            Website: www.esg-check.at
          </p>

          <h3 style={{ marginTop: '1.25rem', marginBottom: '0.4rem' }}>Registereinträge</h3>
          <p>
            Firmenbuchnummer: FN 123456x<br />
            Firmenbuchgericht: Handelsgericht Wien<br />
            UID-Nummer: ATU12345678
          </p>

          <h3 style={{ marginTop: '1.25rem', marginBottom: '0.4rem' }}>Haftungsausschluss</h3>
          <p>
            Alle Inhalte und Reports dienen der Orientierung und Selbstbewertung. Sie ersetzen keine
            rechtliche, steuerliche oder prüferische Beratung.
          </p>
        </div>
      </div>
    </div>
  );
}
