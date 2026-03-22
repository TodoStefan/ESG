import React, { useState, useEffect } from 'react';
import {
  BarChart3 as BarChart,
  FileText,
  History,
  Download,
  Building,
  Leaf,
  Users,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertOctagon,
  CheckCircle2,
  Info,
  Sun,
  Moon,
  ListChecks
} from 'lucide-react';
import './index.css';

// --- ESG Scoring Engine ---
// Industry specific benchmarks for relative scoring
// Intensities are per 1M USD Revenue
const benchmarks = {
  Manufacturing: { co2Int: 150, energyInt: 500, renewable: 20, diversity: 30, turnover: 12, boardInd: 60 },
  Technology: { co2Int: 15, energyInt: 100, renewable: 60, diversity: 35, turnover: 18, boardInd: 75 },
  Finance: { co2Int: 5, energyInt: 50, renewable: 80, diversity: 45, turnover: 10, boardInd: 85 },
  Healthcare: { co2Int: 60, energyInt: 300, renewable: 30, diversity: 50, turnover: 15, boardInd: 70 },
  Energy: { co2Int: 600, energyInt: 900, renewable: 35, diversity: 25, turnover: 8, boardInd: 65 },
  Retail: { co2Int: 40, energyInt: 200, renewable: 40, diversity: 45, turnover: 25, boardInd: 60 }
};

// Math Helper: Score = 50 + ((target - actual) / target) * 50 (Lower is Better)
// Math Helper: Score = 50 + ((actual - target) / target) * 50 (Higher is Better)
const calcScore = (actual, target, lowerIsBetter) => {
  if (target === 0) return 50; // Guard against / 0
  let diff = lowerIsBetter ? (target - actual) : (actual - target);
  let score = 50 + (diff / target) * 50;
  return Math.min(100, Math.max(0, score)); // Cap between 0 and 100
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Toggle dark mode class on body
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Draft Form State
  const [formData, setFormData] = useState({
    company: { name: 'Acme Corporation', industry: 'Manufacturing', employees: 1500, revenue: 150000000 },
    env: { co2: 12000, energy: 45000, renewable: 35 },
    soc: { diversity: 32, turnover: 8 },
    gov: { incidents: 0, boardIndependent: 75 }
  });

  // Committed Dashboard State (calculates dynamically on "Calculate")
  const [dashboardData, setDashboardData] = useState(formData);
  const [scores, setScores] = useState({ eScore: 0, sScore: 0, gScore: 0, total: 0, prevTotal: 0 });
  const [bm, setBm] = useState(benchmarks['Manufacturing']); // Current applied Benchmark

  // Audit Trail
  const [auditLog, setAuditLog] = useState([
    { date: '2026-03-21 14:30', user: 'System (Auto)', action: 'Erstberechnung', impact: '–', status: 'Geprüft', badge: 'badge-success' }
  ]);

  // Affectedness Check – Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardAnswers, setWizardAnswers] = useState({});
  const [wizardDone, setWizardDone] = useState(false);

  const [affectedData, setAffectedData] = useState({
    employees: 1500,
    revenue: 150000000,
    hatGrosskunden: false,
    bankHatGefragt: false,
    hatFoerderung: false,
    oeffentlicheAuftraege: false
  });

  const [affectedResult, setAffectedResult] = useState(null);

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

  const handleWizardAnswer = (field, value) => {
    const newAnswers = { ...wizardAnswers, [field]: value };
    setWizardAnswers(newAnswers);

    if (wizardStep < WIZARD_TOTAL) {
      setWizardStep(s => s + 1);
    } else {
      // All steps done – evaluate
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
          text: 'Dein Unternehmen fällt unter die CSRD-Pflicht ab Geschäftsjahr 2027. Bericht muss 2028 vorliegen. In Österreich betrifft das nur ca. 120 Unternehmen.',
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
            'Bank (Erste, Raiffeisen, etc.) bewertet Kreditrisiko mit ESG-Score',
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
      setAffectedResult(result);
      setAffectedData(prev => ({
        ...prev,
        hatGrosskunden: newAnswers.hatGrosskunden === 'yes',
        bankHatGefragt: newAnswers.bankHatGefragt === 'yes',
        hatFoerderung: (newAnswers.hatFoerderung || value) === 'yes',
        oeffentlicheAuftraege: (newAnswers.hatFoerderung || value) === 'yes',
      }));
      setWizardDone(true);
    }
  };

  const resetWizard = () => {
    setWizardStep(1);
    setWizardAnswers({});
    setWizardDone(false);
    setAffectedResult(null);
  };


  const handleChange = (category, field, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleCalculate = () => {
    // 1. Determine the correct industry benchmark
    const industryBM = benchmarks[formData.company.industry] || benchmarks['Manufacturing'];
    const revM = formData.company.revenue / 1000000 || 1;

    // 2. Compute Intensities
    const actualCo2Int = formData.env.co2 / revM;
    const actualEnergyInt = formData.env.energy / revM;

    // 3. Environment (E) Score
    const co2Score = calcScore(actualCo2Int, industryBM.co2Int, true); // lower CO2 = better
    const energyScore = calcScore(actualEnergyInt, industryBM.energyInt, true); // lower energy = better
    const renewableScore = calcScore(formData.env.renewable, industryBM.renewable, false); // higher renewable = better
    const eScore = (co2Score + energyScore + renewableScore) / 3;

    // 4. Social (S) Score
    const diversityScore = calcScore(formData.soc.diversity, industryBM.diversity, false); // higher div = better
    const turnoverScore = calcScore(formData.soc.turnover, industryBM.turnover, true); // lower turnover = better
    const sScore = (diversityScore + turnoverScore) / 2;

    // 5. Governance (G) Score
    const boardScore = calcScore(formData.gov.boardIndependent, industryBM.boardInd, false); // higher ind = better
    // Incidents aren't benchmarked, they are absolute penalties: 0 = 100pts, 1 = 60pts, 2 = 20pts, >2 = 0pts
    let incidentScore = 100 - (formData.gov.incidents * 40);
    incidentScore = Math.max(0, incidentScore);
    const gScore = (boardScore + incidentScore) / 2;

    // 6. Overall Weighted Score
    const total = Math.round((eScore * 0.40) + (sScore * 0.30) + (gScore * 0.30));

    const newScores = {
      eScore: Math.round(eScore),
      sScore: Math.round(sScore),
      gScore: Math.round(gScore),
      total: total,
      prevTotal: scores.total === 0 ? total : scores.total
    };

    // 7. Audit Log
    const scoreDiff = total - newScores.prevTotal;
    let impactText = scoreDiff === 0 ? 'Erstberechnung' : (scoreDiff > 0 ? `+${scoreDiff} Pts` : `${scoreDiff} Pts`);
    let impactClass = scoreDiff > 0 ? 'text-success' : (scoreDiff < 0 ? 'text-danger' : 'text-muted');

    const newLogEntry = {
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      user: 'Aktueller Benutzer',
      action: 'ESG Neuberechnung',
      impact: <span className={impactClass}>{impactText}</span>,
      status: 'Geprüft',
      badge: 'badge-success'
    };

    setScores(newScores);
    setBm(industryBM);
    setDashboardData({ ...formData, actualCo2Int, actualEnergyInt });
    setAuditLog([newLogEntry, ...auditLog]);
    setActiveTab('dashboard');
  };

  const getGrade = (score) => {
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  };

  const grade = getGrade(scores.total);

  // Dynamic ESG Strategy Recommendations (To-Do Generator)
  const getRecommendations = () => {
    const recs = [];
    const calcVar = (act, bm) => Math.abs(((act - bm) / (bm || 1)) * 100).toFixed(1);

    // Environment Rules
    if (dashboardData.actualCo2Int > bm.co2Int) {
      recs.push({
        priority: 'High',
        class: 'badge-danger',
        category: 'Environment',
        text: `Deine CO2-Intensität ist ${calcVar(dashboardData.actualCo2Int, bm.co2Int)}% höher als der Branchendurchschnitt.`,
        action: 'Implementiere ein Energiemanagementsystem (ISO 50001) zur Identifikation von Einsparpotenzialen.',
        impact: 'High Impact',
        effort: 'Medium Effort'
      });
    }
    if (dashboardData.env.renewable < bm.renewable) {
      recs.push({
        priority: 'Medium',
        class: 'badge-warning',
        category: 'Environment',
        text: `Der Anteil erneuerbarer Energien liegt ${calcVar(dashboardData.env.renewable, bm.renewable)}% unter dem Benchmark.`,
        action: 'Umstellung auf Ökostrom-Tarife oder Installation von PV-Anlagen auf Betriebsdächern.',
        impact: 'Medium Impact',
        effort: 'Low Effort'
      });
    }

    // Social Rules
    if (dashboardData.soc.diversity < bm.diversity) {
      recs.push({
        priority: 'Medium',
        class: 'badge-warning',
        category: 'Social',
        text: `Die Diversitätsquote liegt ${calcVar(dashboardData.soc.diversity, bm.diversity)}% unter dem Zielwert.`,
        action: 'Einführung von Richtlinien für inklusives Recruiting und Diversity-Schulungen für Führungskräfte.',
        impact: 'Long-term High',
        effort: 'Medium Effort'
      });
    }
    if (dashboardData.soc.turnover > bm.turnover) {
      recs.push({
        priority: 'High',
        class: 'badge-danger',
        category: 'Social',
        text: `Fluktuationsrate liegt ${calcVar(dashboardData.soc.turnover, bm.turnover)}% über dem Benchmark.`,
        action: 'Mitarbeiterbefragungen durchführen, um Austrittsgründe zu identifizieren und Teambuilding fördern.',
        impact: 'High Impact',
        effort: 'Medium Effort'
      });
    }

    // Governance Rules
    if (dashboardData.gov.boardIndependent < bm.boardInd) {
      recs.push({
        priority: 'Medium',
        class: 'badge-warning',
        category: 'Governance',
        text: `Vorstandsunabhängigkeit ist ${calcVar(dashboardData.gov.boardIndependent, bm.boardInd)}% geringer als empfohlen.`,
        action: 'Sukzessive Neubesetzung von Aufsichtsratsmandaten mit unabhängigen Experten.',
        impact: 'Governance Risk Red.',
        effort: 'High Effort'
      });
    }
    if (dashboardData.gov.incidents > 0) {
      recs.push({
        priority: 'Critical',
        class: 'badge-danger',
        category: 'Governance',
        text: `${dashboardData.gov.incidents} aktive Compliance-Vorfälle gefährden deine Reputation.`,
        action: 'Sofortige externe Untersuchung einleiten und Whistleblowing-System implementieren.',
        impact: 'Legal Safety',
        effort: 'High Effort'
      });
    }

    if (recs.length === 0) {
      recs.push({
        priority: 'Low',
        class: 'badge-success',
        category: 'General',
        text: 'Alle Metriken liegen im grünen Bereich.',
        action: 'Weiterführung der aktuellen Strategie und Vorbereitung auf Scope-3 Berichterstattung.',
        impact: 'Leadership',
        effort: 'Maintenance'
      });
    }
    return recs;
  };

  const recs = scores.total > 0 ? getRecommendations() : [];
  const trendDiff = scores.total - scores.prevTotal;

  return (
    <div className="app-layout">
      {/* Top Navigation Bar */}
      <div className="top-nav">
        <div className="top-nav-left">
          <div className="logo-section">
            <ShieldCheck className="text-primary" />
            <span>ESG Check Austria</span>
          </div>
          <div className="nav-links">
            <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
              <ShieldCheck size={16} /> Start
            </div>
            <div className={`nav-item ${activeTab === 'affectedness' ? 'active' : ''}`} onClick={() => setActiveTab('affectedness')}>
              <ShieldCheck size={16} /> Betroffenheits-Check
            </div>
            <div className={`nav-item ${activeTab === 'data' ? 'active' : ''}`} onClick={() => setActiveTab('data')}>
              <FileText size={16} /> Meine Unternehmensdaten
            </div>
            <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
              <BarChart size={16} /> Mein ESG-Ergebnis
            </div>
            <div className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>
              <History size={16} /> Verlaufsprotokoll
            </div>
          </div>
        </div>

        <div className="top-nav-right">
          <div className="action-buttons" style={{ alignItems: 'center' }}>
            <button className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)} title="Toggle Dark Mode">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="user-avatar">SC</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="dashboard-container">
          {activeTab === 'home' && (
            <div style={{ maxWidth: '860px', margin: '0 auto', animation: 'fadeIn 0.3s ease-in-out', padding: '2rem 0' }}>
              {/* Hero Headline */}
              <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '1rem' }}>
                  ESG betrifft dich –<br />auch wenn du es noch nicht weißt.
                </h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '560px', margin: '0 auto' }}>
                  Finde in 2 Minuten heraus ob deine Bank, dein Großkunde oder eine Förderung bereits ESG-Daten von dir erwartet.
                </p>
              </div>

              {/* 3 Entry Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {/* Card 1 – Bank */}
                <div className="card" style={{ borderLeft: '4px solid var(--danger)', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                  onClick={() => {
                    setAffectedData(prev => ({ ...prev, bankHatGefragt: true }));
                    setWizardStep(1); setWizardAnswers({}); setWizardDone(false); setAffectedResult(null);
                    setActiveTab('affectedness');
                  }}>
                  <div className="card-body">
                    <AlertOctagon size={28} style={{ color: 'var(--danger)', marginBottom: '0.75rem' }} />
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>Meine Bank hat gefragt</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                      Deine Bank hat nach Nachhaltigkeit oder ESG gefragt und du wusstest nicht was du antworten sollst.
                    </p>
                    <span style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '0.9rem' }}>Check starten →</span>
                  </div>
                </div>

                {/* Card 2 – Großkunde */}
                <div className="card" style={{ borderLeft: '4px solid var(--warning)', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                  onClick={() => {
                    setAffectedData(prev => ({ ...prev, hatGrosskunden: true }));
                    setWizardStep(1); setWizardAnswers({}); setWizardDone(false); setAffectedResult(null);
                    setActiveTab('affectedness');
                  }}>
                  <div className="card-body">
                    <FileText size={28} style={{ color: 'var(--warning)', marginBottom: '0.75rem' }} />
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>Mein Großkunde fragt mich</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                      Du bekommst ESG-Fragebögen von Auftraggebern und weißt nicht was du zurückschicken sollst.
                    </p>
                    <span style={{ color: 'var(--warning)', fontWeight: 600, fontSize: '0.9rem' }}>Check starten →</span>
                  </div>
                </div>

                {/* Card 3 – Allgemein */}
                <div className="card" style={{ borderLeft: '4px solid var(--success)', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                  onClick={() => {
                    setWizardStep(1); setWizardAnswers({}); setWizardDone(false); setAffectedResult(null);
                    setActiveTab('affectedness');
                  }}>
                  <div className="card-body">
                    <ShieldCheck size={28} style={{ color: 'var(--success)', marginBottom: '0.75rem' }} />
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>Bin ich überhaupt betroffen?</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                      Du weißt nicht ob und wie ESG dein Unternehmen betrifft. Finde es in 2 Minuten heraus.
                    </p>
                    <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem' }}>Check starten →</span>
                  </div>
                </div>
              </div>

              {/* Main CTA */}
              <div style={{ textAlign: 'center' }}>
                <button className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem', borderRadius: 'var(--radius-md)' }}
                  onClick={() => { setWizardStep(1); setWizardAnswers({}); setWizardDone(false); setAffectedResult(null); setActiveTab('affectedness'); }}>
                  Jetzt kostenlos prüfen – dauert 2 Minuten
                </button>
                <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Für österreichische KMU · Kostenlos · Kein Login erforderlich · Aktuelle Rechtslage (Omnibus 2026)
                </p>
              </div>
            </div>
          )}

          {activeTab === 'affectedness' && (
            <div style={{ maxWidth: '700px', margin: '0 auto', animation: 'fadeIn 0.3s ease-in-out' }}>
              <div className="page-header">
                <div>
                  <h1>Betroffenheits-Check (CSRD & LkSG)</h1>
                  <p>Finde in 2 Minuten heraus, ob dich die ESG-Pflicht betrifft.</p>
                </div>
              </div>

              {!wizardDone ? (
                <div className="card">
                  {/* Progress Bar */}
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
              ) : affectedResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Result Card */}
                  <div className="card" style={{
                    borderLeft: `4px solid ${affectedResult.type === 'red' ? 'var(--danger)' : affectedResult.type === 'yellow' ? 'var(--warning)' : 'var(--success)'}`,
                  }}>
                    <div className="card-body">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <span className={`badge ${affectedResult.badgeClass}`} style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>
                          {affectedResult.titel}
                        </span>
                      </div>
                      <p style={{ fontSize: '1rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>{affectedResult.text}</p>
                      {affectedResult.frist && (
                        <div style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.95rem' }}>
                          ⏰ {affectedResult.frist}
                        </div>
                      )}
                      <div style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
                        <p style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Das bedeutet für dich konkret:</p>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          {affectedResult.bullets.map((b, i) => (
                            <li key={i} style={{ fontSize: '0.9rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                              <span style={{ color: affectedResult.type === 'red' ? 'var(--danger)' : affectedResult.type === 'yellow' ? 'var(--warning)' : 'var(--success)', flexShrink: 0 }}>
                                {affectedResult.type === 'red' ? '🔴' : affectedResult.type === 'yellow' ? '🟡' : '🟢'}
                              </span>
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <button className="btn btn-primary" style={{ fontSize: '1rem', padding: '0.75rem 1.5rem' }} onClick={() => setActiveTab('data')}>
                          Jetzt meinen ESG-Score berechnen →
                        </button>
                        <button className="btn btn-outline" onClick={resetWizard}>
                          Erneut prüfen
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'data' && (
            <div style={{ maxWidth: '900px', margin: '0 auto', animation: 'fadeIn 0.3s ease-in-out' }}>
              <div className="page-header">
                <div>
                  <h1>Meine Unternehmensdaten</h1>
                  <p>Gib deine Unternehmensdaten ein. Wird gegen <b>{formData.company.industry}</b> Branchenwerte gemessen.</p>
                </div>
                <button className="btn btn-primary" onClick={handleCalculate} style={{ fontSize: '1rem', padding: '0.75rem 1.5rem' }}>
                  Score berechnen & Ergebnis anzeigen
                </button>
              </div>

              <div className="card form-section">
                <div className="card-header">Unternehmen & Basisangaben</div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Unternehmensname</label>
                      <input type="text" className="form-control" value={formData.company.name} onChange={e => handleChange('company', 'name', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Branche</label>
                      <select className="form-control" value={formData.company.industry} onChange={e => handleChange('company', 'industry', e.target.value)}>
                        <option value="Manufacturing">Produktion / Industrie</option>
                        <option value="Technology">IT / Technologie</option>
                        <option value="Finance">Finanzen / Banken</option>
                        <option value="Healthcare">Gesundheit / Soziales</option>
                        <option value="Energy">Energie / Versorgung</option>
                        <option value="Retail">Handel / Einzelhandel</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Anzahl Mitarbeitende</label>
                      <input type="number" className="form-control" value={formData.company.employees} onChange={e => handleChange('company', 'employees', Number(e.target.value))} />
                    </div>
                    <div className="form-group">
                      <label>Jahresumsatz (€)</label>
                      <input type="number" className="form-control" value={formData.company.revenue} onChange={e => handleChange('company', 'revenue', Number(e.target.value))} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card form-section">
                <div className="card-header"><Leaf size={16} style={{ color: 'var(--success)', marginRight: '0.5rem' }} /> Umwelt (E)</div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>CO2-Ausstoß (Tonnen/Jahr)</label>
                      <input type="number" className="form-control" value={formData.env.co2} onChange={e => handleChange('env', 'co2', Number(e.target.value))} />
                    </div>
                    <div className="form-group">
                      <label>Energieverbrauch (MWh/Jahr)</label>
                      <input type="number" className="form-control" value={formData.env.energy} onChange={e => handleChange('env', 'energy', Number(e.target.value))} />
                    </div>
                    <div className="form-group">
                      <label>Anteil Ökostrom / Erneuerbare Energie (%)</label>
                      <input type="number" className="form-control" max="100" value={formData.env.renewable} onChange={e => handleChange('env', 'renewable', Number(e.target.value))} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card form-section">
                <div className="card-header"><Users size={16} style={{ color: 'var(--primary)', marginRight: '0.5rem' }} /> Soziales (S)</div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Frauenanteil / Diversität (%)</label>
                      <input type="number" className="form-control" max="100" value={formData.soc.diversity} onChange={e => handleChange('soc', 'diversity', Number(e.target.value))} />
                    </div>
                    <div className="form-group">
                      <label>Mitarbeiterfluktuation (%)</label>
                      <input type="number" className="form-control" max="100" value={formData.soc.turnover} onChange={e => handleChange('soc', 'turnover', Number(e.target.value))} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card form-section">
                <div className="card-header"><Building size={16} style={{ color: 'var(--warning)', marginRight: '0.5rem' }} /> Unternehmensführung (G)</div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Unabhängige Aufsichtsräte (%)</label>
                      <input type="number" className="form-control" max="100" value={formData.gov.boardIndependent} onChange={e => handleChange('gov', 'boardIndependent', Number(e.target.value))} />
                    </div>
                    <div className="form-group">
                      <label>Rechtsverstöße / Bußgelder (Anzahl)</label>
                      <input type="number" className="form-control" value={formData.gov.incidents} onChange={e => handleChange('gov', 'incidents', Number(e.target.value))} />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'dashboard' && scores.total === 0 && (
            <div className="empty-state">
              <BarChart size={48} />
              <h2>Noch keine Daten vorhanden</h2>
              <p>Bitte gib zuerst deine Unternehmensdaten ein und berechne deinen Score.</p>
              <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => setActiveTab('data')}>Zu meinen Unternehmensdaten</button>
            </div>
          )}

          {activeTab === 'dashboard' && scores.total > 0 && (
            <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
              <div className="page-header">
                <div>
                  <h1>Mein ESG-Ergebnis</h1>
                  <p>Branchenvergleich für die Branche: <b>{dashboardData.company.industry}</b></p>
                </div>
                <div className="action-buttons" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button className="btn btn-primary" onClick={() => window.print()}>
                    <Download size={16} /> Report drucken
                  </button>
                  {affectedResult && (
                    <div className={`badge ${affectedResult.badgeClass}`} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                      <ShieldCheck size={14} style={{ marginRight: '6px' }} />
                      {affectedResult.status}
                    </div>
                  )}
                </div>
              </div>

              {/* Regulatory Navigator – 5-Zeilen Tabelle */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header"><ShieldCheck size={16} /> Regulatory Navigator – Deine Betroffenheit
                </div>
                <div style={{ overflowX: 'auto' }}>
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
                      {/* Zeile 1 – CSRD */}
                      {(() => {
                        const isCsrdDirect = wizardAnswers.employeeRange === 'over1000' && wizardAnswers.revenueRange === 'over450m';
                        return (
                          <tr>
                            <td style={{ fontWeight: 600 }}>CSRD Berichtspflicht</td>
                            <td><span className={`badge ${isCsrdDirect ? 'badge-danger' : 'badge-success'}`}>{isCsrdDirect ? 'Direkt betroffen' : 'Nicht betroffen'}</span></td>
                            <td style={{ fontSize: '0.875rem' }}>{isCsrdDirect ? 'Berichtspflicht ab GJ 2027 – Bericht bis 2028 fällig' : 'Aktuell nicht betroffen – Omnibus hat Schwellenwert angehoben'}</td>
                            <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{isCsrdDirect ? 'ESRS-Standards prüfen, externe Prüfung beauftragen' : 'Freiwillige Vorbereitung empfohlen'}</td>
                          </tr>
                        );
                      })()}
                      {/* Zeile 2 – CSDDD */}
                      {(() => {
                        const csdddHit = wizardAnswers.hatGrosskunden === 'yes';
                        return (
                          <tr>
                            <td style={{ fontWeight: 600 }}>CSDDD Lieferkette</td>
                            <td><span className={`badge ${csdddHit ? 'badge-warning' : 'badge-success'}`}>{csdddHit ? 'Indirekt betroffen' : 'Kein Druck erkannt'}</span></td>
                            <td style={{ fontSize: '0.875rem' }}>{csdddHit ? 'Dein Großkunde muss ab 2027 Lieferkette reporten – braucht deine Daten' : 'Kein direkter Lieferkettendruck erkannt'}</td>
                            <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{csdddHit ? 'ESG-Basisdaten für Lieferantenanfragen bereithalten' : 'Beobachten – bei neuen Großkunden prüfen'}</td>
                          </tr>
                        );
                      })()}
                      {/* Zeile 3 – EZB */}
                      <tr>
                        <td style={{ fontWeight: 600 }}>EZB / Bankenregulierung</td>
                        <td><span className="badge badge-warning">Alle betroffen</span></td>
                        <td style={{ fontSize: '0.875rem' }}>Banken bewerten Kreditrisiko mit ESG-Score – unabhängig vom Gesetz</td>
                        <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>ESG-Score vor nächstem Bankgespräch optimieren</td>
                      </tr>
                      {/* Zeile 4 – EU-Taxonomie */}
                      {(() => {
                        const taxHit = wizardAnswers.hatFoerderung === 'yes';
                        return (
                          <tr>
                            <td style={{ fontWeight: 600 }}>EU-Taxonomie</td>
                            <td><span className={`badge ${taxHit ? 'badge-warning' : 'badge-success'}`}>{taxHit ? 'Relevant' : 'Aktuell nicht relevant'}</span></td>
                            <td style={{ fontSize: '0.875rem' }}>{taxHit ? 'Grüne Kredite und EU-Förderungen setzen Taxonomie-Konformität voraus' : 'Aktuell nicht relevant'}</td>
                            <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{taxHit ? 'Taxonomie-Kriterien bei nächstem Förderantrag prüfen' : 'Bei Förderantrag neu prüfen'}</td>
                          </tr>
                        );
                      })()}
                      {/* Zeile 5 – Öffentliche Vergabe */}
                      {(() => {
                        const vergabeHit = wizardAnswers.hatFoerderung === 'yes';
                        return (
                          <tr>
                            <td style={{ fontWeight: 600 }}>Öffentliche Vergabe</td>
                            <td><span className={`badge ${vergabeHit ? 'badge-warning' : 'badge-success'}`}>{vergabeHit ? 'Relevant' : 'Kein Druck'}</span></td>
                            <td style={{ fontSize: '0.875rem' }}>{vergabeHit ? 'Öffentliche Auftraggeber verlangen zunehmend ESG-Nachweise' : 'Aktuell kein öffentlicher Auftragsdruck'}</td>
                            <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{vergabeHit ? 'ESG-Dokumentation für Ausschreibungen aufbereiten' : 'Bei Ausschreibungen neu prüfen'}</td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top KPIs */}
              <div className="kpi-row">
                <div className="kpi-card score-kpi">
                  <div className="kpi-title">Gesamt ESG-Score</div>
                  <div className="kpi-value">
                    {scores.total} <span className="kpi-sub">/ 100</span>
                  </div>
                  <div className={`kpi-trend ${trendDiff > 0 ? 'trend-up' : (trendDiff < 0 ? 'trend-down' : 'trend-neutral')}`}>
                    {trendDiff > 0 ? <TrendingUp size={14} /> : (trendDiff < 0 ? <TrendingDown size={14} /> : <Minus size={14} />)}
                    {trendDiff > 0 ? `+${trendDiff}` : trendDiff} Punkte vs. vorherige Berechnung
                  </div>
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <b>Explainability Layer:</b> Dieser Score gewichtet Umwelt (40%), Soziales (30%) und Governance (30%) gegen Branchen-Benchmarks.
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-title">Rating Grade</div>
                  <div className="kpi-value" style={{ color: scores.total >= 70 ? 'var(--success)' : (scores.total >= 55 ? 'var(--warning)' : 'var(--danger)') }}>
                    {grade}
                  </div>
                  <div className="kpi-trend trend-neutral">
                    <Minus size={14} /> Branchendurchschnitt: C
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-title">Compliance Status</div>
                  <div className="kpi-value">
                    {dashboardData.gov.incidents === 0
                      ? <span className="badge badge-success"><CheckCircle2 size={14} style={{ marginRight: '4px' }} /> Regelkonform</span>
                      : <span className="badge badge-danger"><AlertOctagon size={14} style={{ marginRight: '4px' }} /> Risiko erkannt</span>}
                  </div>
                  <div className="kpi-trend trend-neutral">
                    {dashboardData.gov.incidents} offene Vorfälle
                  </div>
                </div>
              </div>

              {/* Score Kontext */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header"><Info size={16} /> Was bedeutet dein Score konkret?</div>
                <div className="card-body" style={{ padding: '0' }}>
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
                          {scores.total > 70
                            ? <span>✅ Gute Ausgangslage – du kannst ESG-Score vorweisen</span>
                            : scores.total >= 50
                              ? <span>⚠️ Verbesserungspotenzial vor dem nächsten Kreditgespräch</span>
                              : <span>❌ Hohes Risiko – schlechtere Kreditkonditionen möglich</span>}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>📦 Großkundenanfrage</td>
                        <td style={{ fontSize: '0.9rem' }}>
                          {scores.total > 70
                            ? <span>✅ Du kannst Lieferantenfragebögen beantworten</span>
                            : scores.total >= 50
                              ? <span>⚠️ Einige Lücken in der Dokumentation</span>
                              : <span>❌ Nicht ausreichend für Lieferantenanfragen</span>}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>🇪🇺 EU-Förderung</td>
                        <td style={{ fontSize: '0.9rem' }}>
                          {scores.total > 70
                            ? <span>✅ Grundvoraussetzungen weitgehend erfüllt</span>
                            : scores.total >= 50
                              ? <span>⚠️ 2–3 Kriterien noch nicht erfüllt</span>
                              : <span>❌ Zu viele Kriterien fehlen noch</span>}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>📋 Öffentliche Ausschreibung</td>
                        <td style={{ fontSize: '0.9rem' }}>
                          {scores.total > 70
                            ? <span>✅ ESG-Nachweis vorbereitet</span>
                            : scores.total >= 50
                              ? <span>⚠️ Teilweise vorbereitet</span>
                              : <span>❌ Aktuell nicht ausreichend</span>}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid-container">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                  {/* Environmental Card */}
                  <div className="card">
                    <div className="card-header">
                      <Leaf size={18} style={{ color: 'var(--success)' }} /> Umwelt (E)
                    </div>
                    <div className="card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '1.5rem' }}>{scores.eScore}</span>
                        <span className="badge badge-neutral">Gewichtung: 40%</span>
                      </div>
                      <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${scores.eScore}%`, backgroundColor: 'var(--success)' }}></div>
                      </div>
                      {/* Explainability Insight */}
                      <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                        <Info size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span>
                          {scores.eScore < 50 ? 'Score niedrig, da CO2- oder Energie-Intensität deutlich über dem Branchen-Durchschnitt liegen.' : 'Überdurchschnittliche Performance bei Emissions-Reduktion und Erneuerbaren.'}
                        </span>
                      </div>
                      <div style={{ marginTop: '1rem' }}>
                        <div className="breakdown-item">
                          <span className="breakdown-label">CO2-Intensität (t/Mio. €)</span>
                          <span className="breakdown-value">
                            {dashboardData.actualCo2Int?.toFixed(1)} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>(vs {bm.co2Int})</span>
                          </span>
                        </div>
                        <div className="breakdown-item">
                          <span className="breakdown-label">Energieintensität (MWh/Mio. €)</span>
                          <span className="breakdown-value">
                            {dashboardData.actualEnergyInt?.toFixed(1)} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>(vs {bm.energyInt})</span>
                          </span>
                        </div>
                        <div className="breakdown-item">
                          <span className="breakdown-label">Erneuerbare Energie (%)</span>
                          <span className="breakdown-value">
                            {dashboardData.env.renewable}% <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>(vs {bm.renewable}%)</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Social Card */}
                  <div className="card">
                    <div className="card-header">
                      <Users size={18} style={{ color: 'var(--primary)' }} /> Soziales & Mitarbeitende (S)
                    </div>
                    <div className="card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '1.5rem' }}>{scores.sScore}</span>
                        <span className="badge badge-neutral">Gewichtung: 30%</span>
                      </div>
                      <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${scores.sScore}%`, backgroundColor: 'var(--primary)' }}></div>
                      </div>
                      {/* Explainability Insight */}
                      <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                        <Info size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span>
                          {scores.sScore < 50 ? 'Personalrisiken durch erhöhte Fluktuation oder mangelnde Diversität im Vergleich zum Sektor.' : 'Starke soziale Bindung und diverse Belegschaft heben den Score auf.'}
                        </span>
                      </div>
                      <div style={{ marginTop: '1rem' }}>
                        <div className="breakdown-item">
                          <span className="breakdown-label">Diversität / Frauenanteil (%)</span>
                          <span className="breakdown-value">
                            {dashboardData.soc.diversity}% <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>(vs {bm.diversity}%)</span>
                          </span>
                        </div>
                        <div className="breakdown-item">
                          <span className="breakdown-label">Fluktuation (%)</span>
                          <span className="breakdown-value">
                            {dashboardData.soc.turnover}% <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>(vs {bm.turnover}%)</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Governance Card */}
                  <div className="card">
                    <div className="card-header">
                      <Building size={18} style={{ color: 'var(--warning)' }} /> Unternehmensführung (G)
                    </div>
                    <div className="card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '1.5rem' }}>{scores.gScore}</span>
                        <span className="badge badge-neutral">Gewichtung: 30%</span>
                      </div>
                      <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${scores.gScore}%`, backgroundColor: 'var(--warning)' }}></div>
                      </div>
                      {/* Explainability Insight */}
                      <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                        <Info size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span>
                          {dashboardData.gov.incidents > 0 ? 'Kritischer Abzug durch Compliance-Vorfälle.' : (scores.gScore < 50 ? 'Geringe Vorstands-Unabhängigkeit mindert die Governance-Einstufung.' : 'Hohe Governance-Standards und saubere Compliance-Historie.')}
                        </span>
                      </div>
                      <div style={{ marginTop: '1rem' }}>
                        <div className="breakdown-item">
                          <span className="breakdown-label">Unabhängige Aufsichtsräte (%)</span>
                          <span className="breakdown-value">
                            {dashboardData.gov.boardIndependent}% <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>(vs {bm.boardInd}%)</span>
                          </span>
                        </div>
                        <div className="breakdown-item">
                          <span className="breakdown-label">Rechtsverstöße / Bußgelder</span>
                          <span className="breakdown-value">{dashboardData.gov.incidents} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>(vs 0)</span></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ESG Compliance Timeline – Horizontal */}
                  <div className="card" style={{ background: 'linear-gradient(to right, var(--bg-hover), transparent)' }}>
                    <div className="card-header"><History size={16} /> ESG Compliance Roadmap für Österreich</div>
                    <div className="card-body">
                      {/* Timeline Track */}
                      <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0', minWidth: '560px', position: 'relative', paddingTop: '1.5rem' }}>
                          {/* Horizontal line */}
                          <div style={{ position: 'absolute', top: '1.875rem', left: '2%', right: '2%', height: '3px', background: 'linear-gradient(to right, #94a3b8, #22c55e, #eab308, #f97316, #ef4444, #94a3b8)', zIndex: 0 }} />
                          {[
                            { year: '2024', label: 'NaDiVeG', text: 'Österreich hatte eigenes Nachhaltigkeitsgesetz (NaDiVeG) für große börsennotierte Unternehmen', color: '#94a3b8', active: false, dashed: false },
                            { year: '2026', label: 'JETZT', text: 'NaBeG in Kraft (Feb. 2026). Omnibus-Paket (März 2026): KMU von direkter Pflicht befreit. Banken fragen aktiv nach ESG.', color: '#22c55e', active: true, dashed: false },
                            { year: '2027', label: 'Bald', text: 'Große Firmen berichtspflichtig. Lieferkette wird abgefragt.', color: '#eab308', active: false, dashed: false },
                            { year: '2029', label: 'Zukunft', text: 'CSDDD tritt in Kraft – Lieferkettenpflichten steigen', color: '#f97316', active: false, dashed: false },
                            { year: '2031', label: 'Review', text: 'EU prüft ob Schwellenwerte für KMU wieder sinken', color: '#ef4444', active: false, dashed: false },
                            { year: '2033', label: 'Möglich', text: 'Evtl. neue KMU-Pflichten falls Review positiv', color: '#94a3b8', active: false, dashed: true },
                          ].map((point, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                              {/* Dot */}
                              <div style={{
                                width: point.active ? '20px' : '14px',
                                height: point.active ? '20px' : '14px',
                                borderRadius: '50%',
                                background: point.color,
                                border: point.active ? `3px solid ${point.color}` : '2px solid ' + point.color,
                                boxShadow: point.active ? `0 0 0 4px ${point.color}33` : 'none',
                                outline: point.dashed ? '2px dashed ' + point.color : 'none',
                                outlineOffset: '3px',
                                flexShrink: 0,
                                marginBottom: '0.5rem',
                              }} />
                              {/* Year + Label */}
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontWeight: point.active ? 800 : 600, fontSize: point.active ? '1rem' : '0.85rem', color: point.active ? point.color : 'var(--text-main)' }}>
                                  {point.year}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: point.active ? point.color : 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                                  {point.label}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.35, maxWidth: '90px', textAlign: 'center' }}>
                                  {point.text}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Dynamic text */}
                      <div style={{
                        marginTop: '1.25rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-hover)', fontSize: '0.875rem', color: 'var(--text-muted)', borderLeft: `3px solid ${affectedResult?.type === 'red' ? 'var(--danger)' :
                          affectedResult?.type === 'yellow' ? 'var(--warning)' : 'var(--success)'
                          }`
                      }}>
                        {affectedResult?.type === 'red'
                          ? '⏰ Du bist bereits betroffen. Starte jetzt mit der Vorbereitung – 2028 ist der erste Stichtag.'
                          : affectedResult?.type === 'yellow'
                            ? '📅 2027 wird dein Großkunde dich nach ESG-Daten fragen. Je früher du anfängst, desto besser.'
                            : '✅ Du hast Zeit – aber 2031 könnte sich das durch die EU Review-Klausel ändern. Gut vorbereitet zu sein schadet nie.'}
                      </div>
                    </div>
                  </div>


                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                  <div className="card">
                    <div className="card-header">
                      <Info size={18} /> Wie wird der Score berechnet?
                    </div>
                    <div className="card-body">
                      <p style={{ color: 'var(--text-muted)', marginBottoom: '1rem' }}>
                        Der Score vergleicht deine Unternehmensdaten mit dem <b>{dashboardData.company.industry}</b> Branchendurchschnitt. Je näher an 100, desto besser.
                      </p>

                      <div style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
                        <ul style={{ listStylePosition: 'inside', color: 'var(--text-muted)' }}>
                          <li style={{ marginBottom: '0.25rem' }}><b>Environment (40%):</b> Bewertet CO2-Intensität und Energieverbrauch pro Million Euro Umsatz sowie den Anteil erneuerbarer Energien.</li>
                          <li style={{ marginBottom: '0.25rem' }}><b>Social (30%):</b> Bewertet Diversität und Mitarbeiterfluktuation im Branchenvergleich.</li>
                          <li style={{ marginBottom: '0.25rem' }}><b>Governance (30%):</b> Bewertet Aufsichtsrats-Unabhängigkeit und zieht Punkte für Compliance-Vorfälle ab.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <AlertOctagon size={18} /> Maßnahmen-Priorisierung (To-Do Generator)
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Priorität</th>
                            <th>Was bedeutet das?</th>
                            <th>Empfohlene Maßnahme</th>
                            <th>Effort</th>
                            <th>Impact</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recs.map((r, idx) => (
                            <tr key={idx}>
                              <td><span className={`badge ${r.class}`}>{r.priority}</span></td>
                              <td style={{ fontSize: '0.85rem' }}>{r.text}</td>
                              <td style={{ fontWeight: 500 }}>{r.action}</td>
                              <td><span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{r.effort}</span></td>
                              <td className={r.impact.includes('Penalty') || r.impact.includes('Risk') ? 'text-danger' : 'text-success'} style={{ fontWeight: 600 }}>{r.impact}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="card" style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
              <div className="card-header">Verlaufsprotokoll</div>
              <div className="card-body" style={{ padding: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Zeitpunkt</th>
                      <th>Benutzer / Quelle</th>
                      <th>Aktion</th>
                      <th>Score-Änderung</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLog.map((log, idx) => (
                      <tr key={idx}>
                        <td style={{ color: 'var(--text-muted)' }}>{log.date}</td>
                        <td style={{ fontWeight: 500 }}>{log.user}</td>
                        <td>{log.action}</td>
                        <td>{log.impact}</td>
                        <td><span className={`badge ${log.badge}`}>{log.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-card)',
        padding: '1.5rem 2rem',
        marginTop: 'auto',
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
            ESG Check Austria
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.5rem' }}>
              · Aktuelle Rechtslage: Omnibus-Paket März 2026
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
          Für verbindliche Auskünfte wende dich an die WKO Österreich oder einen ESG-zertifizierten Berater.
        </div>
      </footer>
    </div>
  );
}
