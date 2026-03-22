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
  Moon
} from 'lucide-react';
import './index.css';

// --- ESG Scoring Engine ---
// Industry specific benchmarks for relative scoring
// Intensities are per 1M USD Revenue
const benchmarks = {
  Manufacturing: { co2Int: 150, energyInt: 500, renewable: 20, diversity: 30, turnover: 12, boardInd: 60 },
  Technology:    { co2Int: 15,  energyInt: 100, renewable: 60, diversity: 35, turnover: 18, boardInd: 75 },
  Finance:       { co2Int: 5,   energyInt: 50,  renewable: 80, diversity: 45, turnover: 10, boardInd: 85 },
  Healthcare:    { co2Int: 60,  energyInt: 300, renewable: 30, diversity: 50, turnover: 15, boardInd: 70 },
  Energy:        { co2Int: 600, energyInt: 900, renewable: 35, diversity: 25, turnover: 8,  boardInd: 65 },
  Retail:        { co2Int: 40,  energyInt: 200, renewable: 40, diversity: 45, turnover: 25, boardInd: 60 }
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
  const [activeTab, setActiveTab] = useState('data'); 
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
    { date: '2026-03-21 14:30', user: 'System (Auto-Sync)', action: 'Baseline Calculation', impact: 'N/A', status: 'Verified', badge: 'badge-success' }
  ]);

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
    let impactText = scoreDiff === 0 ? 'Initial Calc' : (scoreDiff > 0 ? `+${scoreDiff} Pts` : `${scoreDiff} Pts`);
    let impactClass = scoreDiff > 0 ? 'text-success' : (scoreDiff < 0 ? 'text-danger' : 'text-muted');

    const newLogEntry = {
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      user: 'Current User',
      action: 'ESG Recalculation',
      impact: <span className={impactClass}>{impactText}</span>,
      status: 'Verified',
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

  // Dynamic ESG Strategy Recommendations
  const getRecommendations = () => {
    const recs = [];
    const calcVar = (act, bm) => Math.abs(((act - bm) / (bm || 1)) * 100).toFixed(1);

    if (dashboardData.actualCo2Int > bm.co2Int) {
      recs.push({ priority: 'High', class: 'badge-warning', category: 'Environment', text: `Scope 1 & 2 emissions intensity exceeds the sector median by ${calcVar(dashboardData.actualCo2Int, bm.co2Int)}%. Recommend comprehensive energy audit to mitigate impending regulatory carbon costs.`, impact: '+15% Operational Efficiency' });
    }
    if (dashboardData.env.renewable < bm.renewable) {
      recs.push({ priority: 'Medium', class: 'badge-neutral', category: 'Environment', text: `Renewable energy procurement is ${calcVar(dashboardData.env.renewable, bm.renewable)}% below sector average. Execute Power Purchase Agreements (PPAs) to hedge against grid volatility.`, impact: 'Reduced Carbon Tax Liability' });
    }
    if (dashboardData.soc.diversity < bm.diversity) {
      recs.push({ priority: 'High', class: 'badge-warning', category: 'Social', text: `Diversity representation trails sector benchmarks by ${calcVar(dashboardData.soc.diversity, bm.diversity)}%. Strategic inclusive hiring initiatives advised.`, impact: 'Enhanced Talent Retention' });
    }
    if (dashboardData.soc.turnover > bm.turnover) {
      recs.push({ priority: 'Medium', class: 'badge-neutral', category: 'Social', text: `Employee turnover variance of ${calcVar(dashboardData.soc.turnover, bm.turnover)}% vs industry baseline. Comprehensive compensation & culture review required.`, impact: '-5% Recruitment Overhead' });
    }
    if (dashboardData.gov.boardIndependent < bm.boardInd) {
      recs.push({ priority: 'High', class: 'badge-warning', category: 'Governance', text: `Board independence deficit of ${calcVar(dashboardData.gov.boardIndependent, bm.boardInd)}%. Restructuring board composition recommended to mitigate proxy risks.`, impact: 'Improved Shareholder Align.' });
    }
    if (dashboardData.gov.incidents > 0) {
      recs.push({ priority: 'Critical', class: 'badge-danger', category: 'Governance', text: `${dashboardData.gov.incidents} active compliance incident(s) registered. Immediate remediation required to avoid material regulatory fines.`, impact: 'Avoidance of Regulatory Fines' });
    }
    
    if (recs.length === 0) {
      recs.push({ priority: 'Low', class: 'badge-success', category: 'General', text: 'All tracked metrics outperform the designated sector benchmarks. Recommend maintaining current strategic policies and expanding Scope 3 tracking.', impact: 'Sustained Sector Leadership' });
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
            <span>ESG Engine Pro</span>
          </div>
          <div className="nav-links">
            <div className={`nav-item ${activeTab === 'data' ? 'active' : ''}`} onClick={() => setActiveTab('data')}>
              <FileText size={16} /> Data Entry
            </div>
            <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
              <BarChart size={16} /> Dashboard
            </div>
            <div className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>
              <History size={16} /> Audit Trail
            </div>
          </div>
        </div>

        <div className="top-nav-right">
          <div className="company-context">
            Company: <span>{dashboardData.company.name}</span> | {dashboardData.company.industry}
          </div>
          <div className="action-buttons" style={{ alignItems: 'center' }}>
            <button className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)} title="Toggle Dark Mode">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="btn btn-outline" onClick={() => window.print()}>
              <Download size={16} /> Print CSRD Report
            </button>
            <div className="user-avatar">SC</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="dashboard-container">
          {activeTab === 'data' && (
            <div style={{ maxWidth: '900px', margin: '0 auto', animation: 'fadeIn 0.3s ease-in-out' }}>
              <div className="page-header">
                <div>
                  <h1>Data Entry Module</h1>
                  <p>Input corporate metrics. Will be benchmarked against <b>{formData.company.industry}</b> industry standards.</p>
                </div>
                <button className="btn btn-primary" onClick={handleCalculate} style={{ fontSize: '1rem', padding: '0.75rem 1.5rem' }}>
                  Calculate & View Dashboard
                </button>
              </div>

              <div className="card form-section">
                <div className="card-header">Company Context & Basics</div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Company Name</label>
                      <input type="text" className="form-control" value={formData.company.name} onChange={e => handleChange('company', 'name', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Industry</label>
                      <select className="form-control" value={formData.company.industry} onChange={e => handleChange('company', 'industry', e.target.value)}>
                        <option>Manufacturing</option>
                        <option>Technology</option>
                        <option>Finance</option>
                        <option>Healthcare</option>
                        <option>Energy</option>
                        <option>Retail</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Total Employees</label>
                      <input type="number" className="form-control" value={formData.company.employees} onChange={e => handleChange('company', 'employees', Number(e.target.value))} />
                    </div>
                    <div className="form-group">
                      <label>Annual Revenue (USD)</label>
                      <input type="number" className="form-control" value={formData.company.revenue} onChange={e => handleChange('company', 'revenue', Number(e.target.value))} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card form-section">
                <div className="card-header"><Leaf size={16} style={{color:'var(--success)', marginRight:'0.5rem'}}/> Environment (E)</div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>CO2 Emissions (Metric Tons)</label>
                      <input type="number" className="form-control" value={formData.env.co2} onChange={e => handleChange('env', 'co2', Number(e.target.value))} />
                    </div>
                    <div className="form-group">
                      <label>Energy Consumption (MWh)</label>
                      <input type="number" className="form-control" value={formData.env.energy} onChange={e => handleChange('env', 'energy', Number(e.target.value))} />
                    </div>
                    <div className="form-group">
                      <label>Renewable Energy Ratio (%)</label>
                      <input type="number" className="form-control" max="100" value={formData.env.renewable} onChange={e => handleChange('env', 'renewable', Number(e.target.value))} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card form-section">
                <div className="card-header"><Users size={16} style={{color:'var(--primary)', marginRight:'0.5rem'}}/> Social (S)</div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Diversity Ratio (%)</label>
                      <input type="number" className="form-control" max="100" value={formData.soc.diversity} onChange={e => handleChange('soc', 'diversity', Number(e.target.value))} />
                    </div>
                    <div className="form-group">
                      <label>Employee Turnover Rate (%)</label>
                      <input type="number" className="form-control" max="100" value={formData.soc.turnover} onChange={e => handleChange('soc', 'turnover', Number(e.target.value))} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card form-section">
                <div className="card-header"><Building size={16} style={{color:'var(--warning)', marginRight:'0.5rem'}}/> Governance (G)</div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Independent Board Members (%)</label>
                      <input type="number" className="form-control" max="100" value={formData.gov.boardIndependent} onChange={e => handleChange('gov', 'boardIndependent', Number(e.target.value))} />
                    </div>
                    <div className="form-group">
                      <label>Compliance Incidents (Count)</label>
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
              <h2>No Dashboard Data</h2>
              <p>Please go to Data Entry and calculate your score first.</p>
              <button className="btn btn-primary" style={{marginTop:'1.5rem'}} onClick={() => setActiveTab('data')}>Go to Data Entry</button>
            </div>
          )}

          {activeTab === 'dashboard' && scores.total > 0 && (
            <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
              <div className="page-header">
                <div>
                  <h1>ESG Performance Dashboard</h1>
                  <p>Real-time corporate analysis benchmarked against the <b>{dashboardData.company.industry}</b> sector.</p>
                </div>
              </div>

              {/* Top KPIs */}
              <div className="kpi-row">
                <div className="kpi-card score-kpi">
                  <div className="kpi-title">Overall ESG Score</div>
                  <div className="kpi-value">
                    {scores.total} <span className="kpi-sub">/ 100</span>
                  </div>
                  <div className={`kpi-trend ${trendDiff > 0 ? 'trend-up' : (trendDiff < 0 ? 'trend-down' : 'trend-neutral')}`}>
                    {trendDiff > 0 ? <TrendingUp size={14} /> : (trendDiff < 0 ? <TrendingDown size={14}/> : <Minus size={14} />)} 
                    {trendDiff > 0 ? `+${trendDiff}` : trendDiff} pts vs Previous Calculation
                  </div>
                </div>
                
                <div className="kpi-card">
                  <div className="kpi-title">Rating Grade</div>
                  <div className="kpi-value" style={{ color: scores.total >= 70 ? 'var(--success)' : (scores.total >= 55 ? 'var(--warning)' : 'var(--danger)') }}>
                    {grade}
                  </div>
                  <div className="kpi-trend trend-neutral">
                    <Minus size={14} /> Sector Median: C
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-title">Compliance Status</div>
                  <div className="kpi-value">
                    {dashboardData.gov.incidents === 0 
                      ? <span className="badge badge-success"><CheckCircle2 size={14} style={{marginRight:'4px'}}/> Fully Compliant</span> 
                      : <span className="badge badge-danger"><AlertOctagon size={14} style={{marginRight:'4px'}}/> Risk Detected</span>}
                  </div>
                  <div className="kpi-trend trend-neutral">
                    {dashboardData.gov.incidents} unresolved incidents
                  </div>
                </div>
              </div>

              <div className="grid-container">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* Environmental Card */}
                  <div className="card">
                    <div className="card-header">
                      <Leaf size={18} style={{ color: 'var(--success)' }}/> Environmental Performance
                    </div>
                    <div className="card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '1.5rem' }}>{scores.eScore}</span>
                        <span className="badge badge-neutral">Weight: 40%</span>
                      </div>
                      <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${scores.eScore}%`, backgroundColor: 'var(--success)' }}></div>
                      </div>
                      <div style={{ marginTop: '1rem' }}>
                        <div className="breakdown-item">
                          <span className="breakdown-label">CO2 Intensity (t/M$)</span>
                          <span className="breakdown-value">
                            {dashboardData.actualCo2Int?.toFixed(1)} <span style={{fontSize:'12px', color:'var(--text-muted)'}}>(vs {bm.co2Int})</span>
                          </span>
                        </div>
                        <div className="breakdown-item">
                          <span className="breakdown-label">Energy Int. (MWh/M$)</span>
                          <span className="breakdown-value">
                             {dashboardData.actualEnergyInt?.toFixed(1)} <span style={{fontSize:'12px', color:'var(--text-muted)'}}>(vs {bm.energyInt})</span>
                          </span>
                        </div>
                        <div className="breakdown-item">
                          <span className="breakdown-label">Renewables (%)</span>
                          <span className="breakdown-value">
                            {dashboardData.env.renewable}% <span style={{fontSize:'12px', color:'var(--text-muted)'}}>(vs {bm.renewable}%)</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Social Card */}
                  <div className="card">
                    <div className="card-header">
                      <Users size={18} style={{ color: 'var(--primary)' }}/> Social & Workforce
                    </div>
                    <div className="card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '1.5rem' }}>{scores.sScore}</span>
                        <span className="badge badge-neutral">Weight: 30%</span>
                      </div>
                      <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${scores.sScore}%`, backgroundColor: 'var(--primary)' }}></div>
                      </div>
                      <div style={{ marginTop: '1rem' }}>
                        <div className="breakdown-item">
                          <span className="breakdown-label">Diversity Ratio (%)</span>
                          <span className="breakdown-value">
                            {dashboardData.soc.diversity}% <span style={{fontSize:'12px', color:'var(--text-muted)'}}>(vs {bm.diversity}%)</span>
                          </span>
                        </div>
                        <div className="breakdown-item">
                          <span className="breakdown-label">Turnover Rate (%)</span>
                          <span className="breakdown-value">
                            {dashboardData.soc.turnover}% <span style={{fontSize:'12px', color:'var(--text-muted)'}}>(vs {bm.turnover}%)</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Governance Card */}
                  <div className="card">
                    <div className="card-header">
                      <Building size={18} style={{ color: 'var(--warning)' }}/> Corporate Governance
                    </div>
                    <div className="card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '1.5rem' }}>{scores.gScore}</span>
                        <span className="badge badge-neutral">Weight: 30%</span>
                      </div>
                      <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${scores.gScore}%`, backgroundColor: 'var(--warning)' }}></div>
                      </div>
                      <div style={{ marginTop: '1rem' }}>
                        <div className="breakdown-item">
                          <span className="breakdown-label">Independent Board (%)</span>
                          <span className="breakdown-value">
                            {dashboardData.gov.boardIndependent}% <span style={{fontSize:'12px', color:'var(--text-muted)'}}>(vs {bm.boardInd}%)</span>
                          </span>
                        </div>
                        <div className="breakdown-item">
                          <span className="breakdown-label">Compliance Incidents</span>
                          <span className="breakdown-value">{dashboardData.gov.incidents} <span style={{fontSize:'12px', color:'var(--text-muted)'}}>(vs 0)</span></span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  <div className="card">
                    <div className="card-header">
                      <Info size={18} /> Scoring Methodology
                    </div>
                    <div className="card-body">
                      <p style={{ color: 'var(--text-muted)', marginBottoom: '1rem' }}>
                        Methodology evaluates actual corporate metrics against <b>{dashboardData.company.industry}</b> sector medians. Scores denote standard deviation from the baseline.
                      </p>
                      
                      <div style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
                         <ul style={{ listStylePosition: 'inside', color: 'var(--text-muted)' }}>
                          <li style={{ marginBottom: '0.25rem' }}><b>Environment (40%):</b> Evaluates Scope 1 & 2 carbon intensity per million USD revenue and renewable energy procurement against sector medians.</li>
                          <li style={{ marginBottom: '0.25rem' }}><b>Social (30%):</b> Assesses workforce diversity representation and retention stability metrics.</li>
                          <li style={{ marginBottom: '0.25rem' }}><b>Governance (30%):</b> Measures board independence ratios and applies severe non-compliance penalties (-40pts per active incident).</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <AlertOctagon size={18} /> Key Risk & Mitigation Summary
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Priority</th>
                            <th>Category</th>
                            <th>Strategic Recommendation</th>
                            <th>Business Impact</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recs.map((r, idx) => (
                            <tr key={idx}>
                              <td><span className={`badge ${r.class}`}>{r.priority}</span></td>
                              <td style={{ fontWeight: 500 }}>{r.category}</td>
                              <td>{r.text}</td>
                              <td className={r.impact.includes('Penalty') ? 'text-danger' : 'text-success'} style={{ fontWeight: 600 }}>{r.impact}</td>
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
              <div className="card-header">Audit Trail & Historical Logs</div>
              <div className="card-body" style={{ padding: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>User / Source</th>
                      <th>Event Action</th>
                      <th>Score Impact</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLog.map((log, idx) => (
                      <tr key={idx}>
                        <td style={{ color: 'var(--text-muted)'}}>{log.date}</td>
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
    </div>
  );
}
