import React from 'react';
import { Building2, Medal, TrendingUp } from 'lucide-react';
import { getIndustryLabel } from '../lib/industryLabels';

export default function CompetitionBenchmark({ dashboardData, scores, analytics, goToDataTab }) {
  const industry = getIndustryLabel(dashboardData?.company?.industry);

  const sampleCompetitors = [
    { name: 'Vergleichsunternehmen A', total: Math.max(35, (analytics?.industryAverage || 55) - 8), note: 'Typischer Branchenwert' },
    { name: 'Vergleichsunternehmen B', total: Math.max(40, (analytics?.industryAverage || 55) - 2), note: 'Oberes Mittelfeld' },
    { name: 'Ihr Unternehmen', total: scores?.total || 0, note: 'Aktueller ESG-Wert' },
    { name: 'Vergleichsunternehmen C', total: Math.min(92, (analytics?.industryAverage || 55) + 9), note: 'Referenzniveau der Spitzenreiter' },
  ].sort((a, b) => b.total - a.total);

  const companyRank = sampleCompetitors.findIndex((entry) => entry.name === 'Ihr Unternehmen') + 1;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
      <div className="page-header">
        <div>
          <h1>Konkurrenzvergleich</h1>
          <p>
            Vergleich des ESG-Profils mit typischen Unternehmen aus dem Bereich <b>{industry}</b>.
          </p>
        </div>
      </div>

      <div className="kpi-row" style={{ marginBottom: '1.25rem' }}>
        <div className="kpi-card esg-accent-card">
          <div className="kpi-title">Deine Position im Branchenvergleich</div>
          <div className="kpi-value">#{companyRank}</div>
          <div className="kpi-trend trend-neutral">Von {sampleCompetitors.length} Vergleichsunternehmen</div>
        </div>
        <div className="kpi-card esg-accent-card">
          <div className="kpi-title">Branchen-Ø ESG-Wert</div>
          <div className="kpi-value">{analytics?.industryAverage || 0}</div>
          <div className="kpi-trend trend-neutral">Aktueller E/S/G-Mittelwert</div>
        </div>
        <div className="kpi-card esg-accent-card">
          <div className="kpi-title">Referenzniveau führender Unternehmen</div>
          <div className="kpi-value">{Math.max(...sampleCompetitors.map((c) => c.total))}</div>
          <div className="kpi-trend trend-up"><TrendingUp size={14} /> Zielniveau der Branchen-Spitzenreiter</div>
        </div>
      </div>

      <div className="grid-container dashboard-grid">
        <div className="dashboard-column">
          <div className="card">
            <div className="card-header"><Building2 size={16} /> Branchen-Rangliste</div>
            <div className="card-body card-body-tight">
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Position</th>
                      <th>Unternehmen</th>
                      <th>ESG-Wert</th>
                      <th>Einordnung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleCompetitors.map((entry, index) => (
                      <tr key={entry.name} style={entry.name === 'Ihr Unternehmen' ? { background: 'var(--success-bg)' } : undefined}>
                        <td style={{ fontWeight: 700 }}>#{index + 1}</td>
                        <td style={{ fontWeight: entry.name === 'Ihr Unternehmen' ? 700 : 500 }}>{entry.name}</td>
                        <td>{entry.total}</td>
                        <td>{entry.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><Medal size={16} /> Wie nutzt du den Vergleich?</div>
            <div className="card-body">
              <ul style={{ paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                <li>Setze kurzfristig das Ziel: mindestens Branchen-Ø erreichen.</li>
                <li>Priorisiere zuerst den schwächsten ESG-Teilbereich für eine zügige ESG-Wertsteigerung.</li>
                <li>Nutze den Vergleich als Argumentationsgrundlage für Bank, Einkauf und Management-Berichterstattung.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="dashboard-column">
          <div className="card">
            <div className="card-header">Teilbereichsvergleich zum Branchenschnitt</div>
            <div className="card-body card-body-tight">
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Bereich</th>
                      <th>Dein Wert</th>
                      <th>Branchen-Ø</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>E (Umwelt)</td>
                      <td>{scores?.eScore ?? 0}</td>
                      <td>{analytics?.industryAverages?.e ?? 0}</td>
                    </tr>
                    <tr>
                      <td>S (Soziales)</td>
                      <td>{scores?.sScore ?? 0}</td>
                      <td>{analytics?.industryAverages?.s ?? 0}</td>
                    </tr>
                    <tr>
                      <td>G (Unternehmensführung)</td>
                      <td>{scores?.gScore ?? 0}</td>
                      <td>{analytics?.industryAverages?.g ?? 0}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card esg-accent-card">
            <div className="card-header">Nächster Schritt</div>
            <div className="card-body">
              <p style={{ marginBottom: '0.85rem' }}>
                Für einen fairen Konkurrenzvergleich sollten die zugrundeliegenden Unternehmensdaten aktuell sein.
              </p>
              <button className="btn btn-primary" onClick={goToDataTab}>
                Unternehmensdaten aktualisieren
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
