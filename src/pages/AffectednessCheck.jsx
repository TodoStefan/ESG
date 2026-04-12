import React, { useState } from 'react';

const WIZARD_TOTAL = 5;

const wizardQuestions = [
  {
    step: 1,
    question: 'Wie viele Mitarbeitende hat euer Unternehmen?',
    field: 'employeeRange',
    options: [
      { label: 'Unter 50 Mitarbeitende', value: 'under50' },
      { label: '50 bis 249 Mitarbeitende', value: '50to249' },
      { label: '250 bis 999 Mitarbeitende', value: '250to999' },
      { label: 'Über 1.000 Mitarbeitende', value: 'over1000' },
    ]
  },
  {
    step: 2,
    question: 'Wie hoch ist euer Jahresumsatz?',
    field: 'revenueRange',
    options: [
      { label: 'Unter 10 Millionen Euro', value: 'under10m' },
      { label: '10 bis 50 Millionen Euro', value: '10to50m' },
      { label: '50 bis 450 Millionen Euro', value: '50to450m' },
      { label: 'Über 450 Millionen Euro', value: 'over450m' },
    ]
  },
  {
    step: 3,
    question: 'Habt ihr Großkunden mit über 450 Mio. Euro Jahresumsatz?',
    field: 'hatGrosskunden',
    options: [
      { label: 'Ja', value: 'yes' },
      { label: 'Nein', value: 'no' },
      { label: 'Weiß nicht', value: 'unknown' },
    ]
  },
  {
    step: 4,
    question: 'Hat eure Bank euch schon nach Nachhaltigkeit oder ESG gefragt?',
    field: 'bankHatGefragt',
    options: [
      { label: 'Ja', value: 'yes' },
      { label: 'Nein', value: 'no' },
      { label: 'Weiß nicht', value: 'unknown' },
    ]
  },
  {
    step: 5,
    question: 'Habt ihr EU-Förderungen, öffentliche Aufträge oder externe Investoren?',
    field: 'hatFoerderung',
    options: [
      { label: 'Ja', value: 'yes' },
      { label: 'Nein', value: 'no' },
      { label: 'Weiß nicht', value: 'unknown' },
    ]
  },
];

export default function AffectednessCheck({
  prefillData,
  setAffectedResult,
  goToDataTab,
  onWizardCompleteAnswers,
  isAuthenticated,
  onLogin,
  onRegister,
  onLearnMore,
}) {
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardAnswers, setWizardAnswers] = useState(prefillData || {});
  const [wizardDone, setWizardDone] = useState(false);
  const [localResult, setLocalResult] = useState(null);

  const handleWizardAnswer = (field, value) => {
    const newAnswers = { ...wizardAnswers, [field]: value };
    setWizardAnswers(newAnswers);

    if (wizardStep < WIZARD_TOTAL) {
      setWizardStep(s => s + 1);
    } else {
      // Evaluate
      const isOver1000 = newAnswers.employeeRange === 'over1000';
      const isOver450m = newAnswers.revenueRange === 'over450m';
      const grosskundeJa = newAnswers.hatGrosskunden === 'yes';
      const grosskundeUnklar = newAnswers.hatGrosskunden === 'unknown';
      const bankJa = newAnswers.bankHatGefragt === 'yes';
      const bankUnklar = newAnswers.bankHatGefragt === 'unknown';
      const foerderungWert = newAnswers.hatFoerderung || value;
      const foerderungJa = foerderungWert === 'yes';
      const foerderungUnklar = foerderungWert === 'unknown';
      const indirectTrigger = grosskundeJa || bankJa || foerderungJa || grosskundeUnklar || bankUnklar || foerderungUnklar;

      let result;
      if (isOver1000 && isOver450m) {
        result = {
          type: 'red',
          badgeClass: 'badge-danger',
          titel: 'Du bist direkt berichtspflichtig',
          text: 'Dein Unternehmen fällt unter die CSRD-Pflicht ab Geschäftsjahr 2027. Bericht muss 2028 vorliegen.',
          frist: 'Bericht fällig: 2028 (für GJ 2027)',
          status: 'Direkt berichtspflichtig (CSRD)',
          regulation: 'CSRD – Große Kapitalgesellschaften',
          description: 'Sofortige Handlungspflicht. Dein Unternehmen unterliegt der CSRD-Berichtspflicht.',
          deadline: 'Bericht fällig: 2028 (für GJ 2027)',
          bullets: [
            'Nachhaltigkeitsbericht nach ESRS-Standards (Pflicht)',
            'Externe Prüfpflicht (limited assurance)',
            'CSDDD Lieferkettenpflichten ab 2029'
          ]
        };
      } else if (indirectTrigger) {
        result = {
          type: 'yellow',
          badgeClass: 'badge-warning',
          titel: 'Du bist indirekt betroffen',
          text: 'Keine gesetzliche Berichtspflicht – aber dein Großkunde, deine Bank oder Förderanträge verlangen bereits heute ESG-Daten von dir.',
          frist: null,
          status: 'Indirekt betroffen',
          regulation: 'CSRD (Lieferkette) / EZB-Regulierung / EU-Taxonomie',
          description: 'Kein direktes Gesetz, aber Marktdruck durch Großkunden, Banken und Förderanforderungen.',
          deadline: 'Ab 2027 – Großkunden fragen aktiv',
          bullets: [
            'Großkunde fragt ab 2027 nach deinen ESG-Daten',
            'Bank (Erste, Raiffeisen, usw.) bewertet Kreditrisiko mit ESG-Score',
            'EU-Förderungen setzen zunehmend ESG-Nachweis voraus'
          ]
        };
        if (grosskundeUnklar || bankUnklar || foerderungUnklar) {
          result.bullets.push('Tipp: Prüfe ob deine größten Kunden über 450 Mio. € Umsatz haben – dann bist du über die Lieferkette betroffen');
        }
      } else {
        result = {
          type: 'green',
          badgeClass: 'badge-success',
          titel: 'Aktuell nicht direkt betroffen',
          text: 'Das Omnibus-Paket 2026 hat die Pflichten für KMU stark reduziert. Derzeit keine gesetzliche Berichtspflicht.',
          frist: null,
          status: 'Nicht direkt betroffen',
          regulation: 'Freiwillige Berichterstattung empfohlen',
          description: 'Aktuell keine gesetzliche Pflicht. Freiwillige Vorbereitung trotzdem sinnvoll.',
          deadline: 'Aktuell keine Pflicht',
          bullets: [
            'Omnibus 2026 hat Schwellenwert auf 1.000 MA angehoben',
            'Freiwillige Vorbereitung trotzdem empfohlen',
            '2031 prüft die EU ob Schwellenwerte wieder sinken'
          ]
        };
      }
      setLocalResult(result);
      setAffectedResult(result);
      if (onWizardCompleteAnswers) onWizardCompleteAnswers(newAnswers);
      setWizardDone(true);
    }
  };

  const resetWizard = () => {
    setWizardStep(1);
    setWizardAnswers({});
    setWizardDone(false);
    setLocalResult(null);
    setAffectedResult(null);
    if (onWizardCompleteAnswers) onWizardCompleteAnswers({});
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', animation: 'fadeIn 0.3s ease-in-out' }}>
      <div className="page-header">
        <div>
          <h1>Betroffenheits-Check (CSRD & LkSG)</h1>
          <p>Finde in 2 Minuten heraus, ob dich die ESG-Pflicht betrifft.</p>
        </div>
      </div>

      {!wizardDone ? (
        <div className="card">
          <div style={{ padding: '1.5rem 1.5rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Frage {wizardStep} von {WIZARD_TOTAL}</span>
              <span>{Math.round((wizardStep / WIZARD_TOTAL) * 100)}%</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${(wizardStep / WIZARD_TOTAL) * 100}%`, backgroundColor: 'var(--primary)', transition: 'width 0.4s ease' }}></div>
            </div>
          </div>

          <div className="card-body" style={{ paddingTop: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', lineHeight: 1.4 }}>
              {wizardQuestions[wizardStep - 1].question}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {wizardQuestions[wizardStep - 1].options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleWizardAnswer(wizardQuestions[wizardStep - 1].field, opt.value)}
                  style={{
                    width: '100%',
                    padding: '1rem 1.25rem',
                    textAlign: 'left',
                    background: 'var(--bg-hover)',
                    border: '2px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: 'var(--text-main)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'rgba(37,99,235,0.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {wizardStep > 1 && (
              <button
                onClick={() => setWizardStep(s => s - 1)}
                style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.875rem' }}
              >
                ← Zurück
              </button>
            )}
          </div>
        </div>
      ) : localResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{
            borderLeft: `4px solid ${localResult.type === 'red' ? 'var(--danger)' : localResult.type === 'yellow' ? 'var(--warning)' : 'var(--success)'}`,
          }}>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <span className={`badge ${localResult.badgeClass}`} style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>
                  {localResult.titel}
                </span>
              </div>
              <p style={{ fontSize: '1rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>{localResult.text}</p>
              {localResult.frist && (
                <div style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.95rem' }}>
                  ⏰ {localResult.frist}
                </div>
              )}
              <div style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
                <p style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Das bedeutet für dich konkret:</p>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {localResult.bullets.map((b, i) => (
                    <li key={i} style={{ fontSize: '0.9rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <span style={{ color: localResult.type === 'red' ? 'var(--danger)' : localResult.type === 'yellow' ? 'var(--warning)' : 'var(--success)', flexShrink: 0 }}>
                        {localResult.type === 'red' ? '🔴' : localResult.type === 'yellow' ? '🟡' : '🟢'}
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {isAuthenticated ? (
                  <button className="btn btn-primary" style={{ fontSize: '1rem', padding: '0.75rem 1.5rem' }} onClick={goToDataTab}>
                    Jetzt meinen ESG-Score berechnen →
                  </button>
                ) : (
                  <button className="btn btn-primary" style={{ fontSize: '1rem', padding: '0.75rem 1.5rem' }} onClick={onRegister}>
                    Vollanalyse freischalten →
                  </button>
                )}
                <button className="btn btn-outline" onClick={resetWizard}>
                  Erneut prüfen
                </button>
              </div>
            </div>
          </div>

          {!isAuthenticated && (localResult.type === 'red' || localResult.type === 'yellow') && (
            <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
              <div className="card-body">
                <h3 style={{ marginBottom: '0.55rem', fontSize: '1.1rem' }}>
                  Dein Unternehmen könnte betroffen sein. Schalte die vollständige ESG-Analyse frei.
                </h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Mit Konto erhältst du Zugriff auf Unternehmensdaten, ESG-Ergebnis, Konkurrenzvergleich, Verlaufsprotokoll und PDF-Exportstatus.
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={onRegister}>Registrieren</button>
                  <button className="btn btn-outline" onClick={onLogin}>Login</button>
                  <button className="btn btn-outline" onClick={onLearnMore}>Mehr erfahren</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
