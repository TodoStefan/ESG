import React from 'react';
import {
  AlertOctagon,
  BarChart3 as BarChart,
  CheckCircle2,
  Download,
  Info,
  Minus,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import RecommendationTable from '../components/RecommendationTable';
import ScoreTrendChart from '../components/ScoreTrendChart';
import ESGMixBars from '../components/ESGMixBars';
import BenchmarkComparisonTable from '../components/BenchmarkComparisonTable';
import InfoTooltip from '../components/InfoTooltip';
import { getGrade } from '../lib/esgEngine';
import { getIndustryLabel } from '../lib/industryLabels';

export default function Dashboard({
  scores,
  dashboardData,
  affectedResult,
  wizardAnswers = {},
  recs,
  esgRecords,
  analytics,
  benchmarkComparisons,
  riskStatus,
  loading,
  error,
  goToDataTab,
}) {
  if (loading) {
    return (
      <div className="empty-state">
        <BarChart size={48} />
        <h2>Daten werden geladen …</h2>
      </div>
    );
  }

  if (error && scores.total === 0) {
    return (
      <div className="empty-state">
        <AlertOctagon size={48} style={{ color: 'var(--danger)' }} />
        <h2>Dashboard konnte nicht geladen werden</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (scores.total === 0) {
    return (
      <div className="empty-state">
        <BarChart size={48} />
        <h2>Noch keine Daten vorhanden</h2>
        <p>Bitte gib zuerst deine Unternehmensdaten ein und berechne deinen Score.</p>
        <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={goToDataTab}>
          Zu meinen Unternehmensdaten
        </button>
      </div>
    );
  }

  const grade = getGrade(scores.total);
  const trendDiff = scores.total - (scores.prevTotal || scores.total);
  const benchmarkDiff = scores.total - (analytics?.industryAverage || 0);
  const isCsrdDirect = wizardAnswers.employeeRange === 'over1000' && wizardAnswers.revenueRange === 'over450m';
  const csdddHit = wizardAnswers.hatGrosskunden === 'yes';
  const topRecs = (recs || []).slice(0, 3);
  const industryLabel = getIndustryLabel(dashboardData?.company?.industry);

  return (
    <div className="dashboard-page" style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
      <div className="page-header">
        <div>
          <h1>Mein ESG-Ergebnis</h1>
          <p>
            Branchenvergleich für den Bereich: <b>{industryLabel}</b>
          </p>
        </div>
        <div className="action-buttons dashboard-actions">
          <button className="btn btn-primary" onClick={() => window.print()}>
            <Download size={16} /> Bericht drucken
          </button>
          {affectedResult && (
            <div className={`badge ${affectedResult.badgeClass}`} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
              <ShieldCheck size={14} style={{ marginRight: '6px' }} />
              {affectedResult.status}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <ShieldCheck size={16} /> Regulatorischer Navigator – Betroffenheitsstatus
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Regulierung</th>
                <th>Status</th>
                <th>Was bedeutet das?</th>
                <th>Was tun?</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>CSRD Berichtspflicht</td>
                <td>
                  <span className={`badge ${isCsrdDirect ? 'badge-danger' : 'badge-success'}`}>
                    {isCsrdDirect ? 'Direkt betroffen' : 'Nicht betroffen'}
                  </span>
                </td>
                <td style={{ fontSize: '0.875rem' }}>
                  {isCsrdDirect
                    ? 'Berichtspflicht ab GJ 2027 – Bericht bis 2028 fällig'
                    : 'Aktuell nicht betroffen – Omnibus hat Schwellenwert angehoben'}
                </td>
                <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  {isCsrdDirect ? 'ESRS-Standards prüfen, externe Prüfung beauftragen' : 'Freiwillige Vorbereitung empfohlen'}
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>CSDDD Lieferkette</td>
                <td>
                  <span className={`badge ${csdddHit ? 'badge-warning' : 'badge-success'}`}>
                    {csdddHit ? 'Indirekt betroffen' : 'Kein Druck erkannt'}
                  </span>
                </td>
                <td style={{ fontSize: '0.875rem' }}>
                  {csdddHit
                    ? 'Dein Großkunde muss ab 2027 entlang der Lieferkette berichten – dafür braucht er deine Daten'
                    : 'Kein direkter Lieferkettendruck erkannt'}
                </td>
                <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  {csdddHit
                    ? 'ESG-Basisdaten für Lieferantenanfragen bereithalten'
                    : 'Beobachten – bei neuen Großkunden prüfen'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi-card score-kpi">
          <div className="kpi-title with-info">
            Aktueller ESG-Score
            <InfoTooltip text="Gesamtbewertung des Unternehmens in den Bereichen Umwelt (E), Soziales (S) und Governance (G) auf einer Skala von 0 bis 100." label="Info zu Aktueller ESG-Score" />
          </div>
          <div className="kpi-value">
            {scores.total} <span className="kpi-sub">/ 100</span>
          </div>
          <div className={`kpi-trend ${trendDiff > 0 ? 'trend-up' : trendDiff < 0 ? 'trend-down' : 'trend-neutral'}`}>
            {trendDiff > 0 ? <TrendingUp size={14} /> : trendDiff < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
            {trendDiff >= 0 ? '+' : ''}{trendDiff} zur letzten Berechnung
          </div>
          <div className="esg-kpi-note">Aggregierter Wert aus E (40%), S (30%) und G (30%).</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title with-info">
            Differenz zum Branchenmittel
            <InfoTooltip text="Zeigt die Differenz zwischen dem ESG-Score des Unternehmens und dem durchschnittlichen Branchenwert." label="Info zu Differenz zum Branchenmittel" />
          </div>
          <div className="kpi-value">{benchmarkDiff >= 0 ? '+' : ''}{benchmarkDiff}</div>
          <div className="kpi-trend trend-neutral">Ø Branche: {analytics?.industryAverage || 0}</div>
          <div className="esg-kpi-note">Zeigt, wie weit du aktuell über oder unter dem Branchenniveau liegst.</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title with-info">
            Risikostatus
            <InfoTooltip text="Einordnung potenzieller Risiken im Hinblick auf Finanzierung, Kundenanforderungen und regulatorische Erwartungen." label="Info zu Risikostatus" />
          </div>
          <div className="kpi-value">
            <span className={`badge ${riskStatus === 'Niedrig' ? 'badge-success' : riskStatus === 'Mittel' ? 'badge-warning' : 'badge-danger'}`}>
              {riskStatus}
            </span>
          </div>
          <div className="kpi-trend trend-neutral">{dashboardData?.gov?.incidents || 0} offene Regelkonformitätsvorfälle</div>
          <div className="esg-kpi-note">Abgeleitet aus ESG-Wert-Niveau und Governance-Risiken.</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title with-info">
            Anzahl gespeicherter Berichte
            <InfoTooltip text="Anzahl der bislang gespeicherten ESG-Auswertungen als Grundlage für Verlaufsanalysen und Vergleichsbetrachtungen." label="Info zu Anzahl gespeicherter Berichte" />
          </div>
          <div className="kpi-value">{analytics?.reportCount || esgRecords?.length || 0}</div>
          <div className="kpi-trend trend-neutral">Bewertungsstufe: {grade}</div>
          <div className="esg-kpi-note">Mehr Historie erhöht Aussagekraft für Trends und Management-Reporting.</div>
        </div>
      </div>

      <div className="card esg-accent-card">
        <div className="card-header"><Info size={16} /> Wie entsteht dein ESG-Score?</div>
        <div className="card-body esg-score-method">
          <p>
            Der Gesamtscore kombiniert drei Teilbereiche: <b>Umwelt</b>, <b>Soziales</b> und <b>Unternehmensführung</b>.
            Jeder Teilbereich vergleicht deine Kennzahlen gegen Branchenziele und wird auf 0–100 normalisiert.
          </p>
          <p style={{ marginTop: '0.55rem' }}>
            Formel (vereinfacht): Gesamt = <b>0.40 × E</b> + <b>0.30 × S</b> + <b>0.30 × G</b>.
            Zusätzlich fließen für Governance Regelkonformitätsvorfälle als Malus ein.
          </p>
        </div>
      </div>

      <div className="grid-container dashboard-grid">
        <div className="dashboard-column">
          <div className="card">
            <div className="card-header with-info">
              Entwicklung ESG-Gesamtscore
              <InfoTooltip text="Stellt die Entwicklung des ESG-Gesamtscores über mehrere Berechnungszeitpunkte dar." label="Info zu Entwicklung ESG-Gesamtscore" />
            </div>
            <div className="card-body">
              <ScoreTrendChart trend={analytics?.trend || []} />
            </div>
          </div>

          <BenchmarkComparisonTable comparisons={benchmarkComparisons} />

          <div className="card">
            <div className="card-header with-info">
              Top 3 Handlungsempfehlungen
              <InfoTooltip text="Priorisierte Maßnahmen mit dem höchsten erwarteten Beitrag zur Verbesserung des ESG-Profils." label="Info zu Top 3 Handlungsempfehlungen" />
            </div>
            <div className="card-body card-body-tight">
              <div className="table-responsive">
                <table className="data-table">
                <thead>
                  <tr>
                    <th>Priorität</th>
                    <th>Empfehlung</th>
                    <th>Erwarteter Effekt</th>
                  </tr>
                </thead>
                <tbody>
                  {topRecs.length > 0 ? (
                    topRecs.map((rec, index) => (
                      <tr key={`${rec.priority}-${index}`}>
                        <td><span className={`badge ${rec.class}`}>{rec.priority}</span></td>
                        <td style={{ fontWeight: 600 }}>{rec.action}</td>
                        <td>{rec.impact}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ color: 'var(--text-muted)' }}>Aktuell keine priorisierten Maßnahmen vorhanden.</td>
                    </tr>
                  )}
                </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-column">
          <div className="card">
            <div className="card-header with-info">
              Statistik & Analyse
              <InfoTooltip text="Verdichtete Darstellung der Einzelwerte in den Bereichen Umwelt, Soziales und Governance." label="Info zu Statistik und Analyse" />
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <ESGMixBars items={analytics?.esgMix || []} />
              <div style={{ fontSize: '0.9rem' }}>
                <div className="breakdown-item">
                  <span className="breakdown-label">Branchen-Ø ESG</span>
                  <span className="breakdown-value">{analytics?.industryAverage || 0}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Bester Teilbereich</span>
                  <span className="breakdown-value">{analytics?.bestArea?.key || '-'} ({analytics?.bestArea?.value || 0})</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Schwächster Teilbereich</span>
                  <span className="breakdown-value">{analytics?.worstArea?.key || '-'} ({analytics?.worstArea?.value || 0})</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Unternehmen im Branchenvergleich</span>
                  <span className="breakdown-value">{analytics?.industryCompanyCount || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <Info size={18} /> Was bedeutet dein Score konkret?
            </div>
            <div className="card-body card-body-tight">
              <div className="table-responsive">
                <table className="data-table">
                <thead>
                  <tr>
                    <th>Für was?</th>
                    <th>Bewertung</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>🏦 Bankgespräch</td>
                    <td style={{ fontSize: '0.9rem' }}>
                      {scores.total > 70 ? <span>✅ Gute Ausgangslage</span> : scores.total >= 50 ? <span>⚠️ Verbesserungspotenzial</span> : <span>❌ Hohes Risiko</span>}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>📦 Großkundenanfrage</td>
                    <td style={{ fontSize: '0.9rem' }}>
                      {scores.total > 70 ? <span>✅ Sehr gut für Lieferantenfragebögen</span> : scores.total >= 50 ? <span>⚠️ Lücken vorhanden</span> : <span>❌ Nicht ausreichend</span>}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>⚖️ Regelkonformität</td>
                    <td style={{ fontSize: '0.9rem' }}>
                      {dashboardData?.gov?.incidents === 0 ? (
                        <span className="badge badge-success">
                          <CheckCircle2 size={14} style={{ marginRight: '4px' }} /> Regelkonform
                        </span>
                      ) : (
                        <span className="badge badge-danger">
                          <AlertOctagon size={14} style={{ marginRight: '4px' }} /> Risiko erkannt
                        </span>
                      )}
                    </td>
                  </tr>
                </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card esg-accent-card">
            <div className="card-header with-info">
              PDF-Statusbericht
              <InfoTooltip text="Gibt an, ob ein exportfähiger Bericht mit den aktuellen Ergebnissen verfügbar ist." label="Info zu PDF-Statusbericht" />
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div className="breakdown-item">
                <span className="breakdown-label">Status</span>
                <span className="breakdown-value"><span className="badge badge-success">Bereit zur Ausgabe</span></span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Enthaltene Inhalte</span>
                <span className="breakdown-value">ESG-Bewertung, KPI-Trends, Maßnahmen, Branchenvergleich</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Qualitätshinweis</span>
                <span className="breakdown-value">Basis: {analytics?.reportCount || 1} gespeicherte Berechnungen</span>
              </div>
              <p style={{ marginTop: '0.45rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Für externe Stakeholder empfiehlt sich vor Versand eine kurze inhaltliche Prüfung der Eingabedaten.
              </p>
            </div>
          </div>

          <RecommendationTable
            recs={recs}
            headerTooltip="Automatisch priorisierte Empfehlungen auf Grundlage der erfassten Eingaben und identifizierten Schwachstellen."
          />
        </div>
      </div>
    </div>
  );
}
