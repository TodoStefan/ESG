import React, { useState } from 'react';
import { Info, Leaf, Users, Building } from 'lucide-react';
import { getIndustryLabel } from '../lib/industryLabels';

function FieldTooltip({ text }) {
  const [open, setOpen] = useState(false);

  return (
    <span className={`field-tooltip ${open ? 'open' : ''}`}>
      <button
        type="button"
        className="field-tooltip-trigger"
        aria-label="Feldbeschreibung anzeigen"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        onBlur={() => setOpen(false)}
      >
        <Info size={13} />
      </button>
      <span className="field-tooltip-content" role="tooltip">
        {text}
      </span>
    </span>
  );
}

function LabelWithInfo({ label, info }) {
  return (
    <span className="label-with-info">
      <span>{label}</span>
      <FieldTooltip text={info} />
    </span>
  );
}

export default function CompanyData({ formData, handleChange, onCalculate, isSaving, error, industryOptions = [] }) {
  const industryLabel = getIndustryLabel(formData?.company?.industry);
  const uniqueIndustries = [...new Set(industryOptions || [])].filter(Boolean);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', animation: 'fadeIn 0.3s ease-in-out' }}>
      <div className="page-header">
        <div>
          <h1>Meine Unternehmensdaten</h1>
          <p>Gib deine Unternehmensdaten ein. Der Vergleich erfolgt mit Branchenwerten aus dem Bereich <b>{industryLabel}</b>.</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={onCalculate} 
          disabled={isSaving}
          style={{ fontSize: '1rem', padding: '0.75rem 1.5rem', opacity: isSaving ? 0.7 : 1 }}
        >
          {isSaving ? 'Speichere & Berechne...' : 'ESG-Wert berechnen & speichern'}
        </button>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: '1rem', borderLeft: '4px solid var(--danger)' }}>
          <div className="card-body" style={{ color: 'var(--danger-text)', background: 'var(--danger-bg)' }}>
            {error}
          </div>
        </div>
      )}

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
                {industryOptions.map((industry) => (
                  <option key={industry} value={industry}>{getIndustryLabel(industry)}</option>
                ))}
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
              <label>
                <LabelWithInfo
                  label="CO2-Ausstoß (Tonnen/Jahr)"
                  info="Gesamte jährliche Emissionen des Unternehmens in Tonnen."
                />
              </label>
              <input type="number" className="form-control" value={formData.env.co2} onChange={e => handleChange('env', 'co2', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>
                <LabelWithInfo
                  label="Energieverbrauch (MWh/Jahr)"
                  info="Gesamtverbrauch pro Jahr in Megawattstunden (MWh)."
                />
              </label>
              <input type="number" className="form-control" value={formData.env.energy} onChange={e => handleChange('env', 'energy', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>
                <LabelWithInfo
                  label="Anteil Ökostrom / Erneuerbare Energie (%)"
                  info="Anteil erneuerbarer Energie am gesamten Energieverbrauch in Prozent."
                />
              </label>
              <input type="number" className="form-control" max="100" value={formData.env.renewable} onChange={e => handleChange('env', 'renewable', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>
                <LabelWithInfo
                  label="Recyclingquote (%)"
                  info="Anteil des Abfalls, der recycelt oder wiederverwendet wird."
                />
              </label>
              <input type="number" className="form-control" max="100" value={formData.env.recycling} onChange={e => handleChange('env', 'recycling', Number(e.target.value))} />
            </div>
          </div>
        </div>
      </div>

      <div className="card form-section">
        <div className="card-header"><Users size={16} style={{ color: 'var(--primary)', marginRight: '0.5rem' }} /> Soziales (S)</div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>
                <LabelWithInfo
                  label="Frauenanteil / Diversität (%)"
                  info="Anteil weiblicher bzw. diverser Mitarbeitender in Prozent."
                />
              </label>
              <input type="number" className="form-control" max="100" value={formData.soc.diversity} onChange={e => handleChange('soc', 'diversity', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>
                <LabelWithInfo
                  label="Mitarbeiterfluktuation (%)"
                  info="Anteil der Mitarbeitenden, die das Unternehmen pro Jahr verlassen."
                />
              </label>
              <input type="number" className="form-control" max="100" value={formData.soc.turnover} onChange={e => handleChange('soc', 'turnover', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>
                <LabelWithInfo
                  label="Mitarbeiterzufriedenheit (%)"
                  info="Subjektiver Score für Mitarbeitendenzufriedenheit auf einer Skala von 0 bis 100."
                />
              </label>
              <input type="number" className="form-control" max="100" value={formData.soc.satisfaction} onChange={e => handleChange('soc', 'satisfaction', Number(e.target.value))} />
            </div>
          </div>
        </div>
      </div>

      <div className="card form-section">
        <div className="card-header"><Building size={16} style={{ color: 'var(--warning)', marginRight: '0.5rem' }} /> Unternehmensführung (G)</div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>
                <LabelWithInfo
                  label="Unabhängige Aufsichtsräte (%)"
                  info="Anteil unabhängiger Kontrollorgane bzw. Aufsichtsräte in Prozent."
                />
              </label>
              <input type="number" className="form-control" max="100" value={formData.gov.boardIndependent} onChange={e => handleChange('gov', 'boardIndependent', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>
                <LabelWithInfo
                  label="Datenschutzbewertung (%)"
                  info="Interne Bewertung des Datenschutz- und Informationssicherheits-Programms."
                />
              </label>
              <input type="number" className="form-control" max="100" value={formData.gov.dataProtection} onChange={e => handleChange('gov', 'dataProtection', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>
                <LabelWithInfo
                  label="Rechtsverstöße / Bußgelder (Anzahl)"
                  info="Anzahl relevanter Regelkonformitäts- oder Rechtsfälle innerhalb des letzten Berichtszeitraums."
                />
              </label>
              <input type="number" className="form-control" value={formData.gov.incidents} onChange={e => handleChange('gov', 'incidents', Number(e.target.value))} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
