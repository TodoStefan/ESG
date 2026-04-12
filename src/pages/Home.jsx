import React from 'react';
import {
  AlertOctagon,
  Building2,
  Compass,
  FileText,
  Landmark,
  ShieldCheck,
} from 'lucide-react';

export default function Home({ startCheck }) {
  return (
    <div className="landing-page" style={{ maxWidth: '1240px', margin: '0 auto', animation: 'fadeIn 0.25s ease-in-out', padding: '1.15rem 0.65rem 1.55rem' }}>
      <div
        className="card landing-hero-card"
        style={{
          marginBottom: '1.1rem',
          background: 'linear-gradient(135deg, #f8fbff 0%, #eef7ff 52%, #edf9f3 100%)',
          border: '1px solid rgba(31, 143, 104, 0.18)',
          boxShadow: '0 18px 34px rgba(15, 23, 42, 0.08)',
          color: 'var(--text-main)',
        }}
      >
        <div className="card-body" style={{ padding: '1.35rem 1.45rem' }}>
          <div style={{ maxWidth: '980px' }}>
            <h1 style={{ fontSize: 'clamp(2.05rem, 3.35vw, 2.78rem)', fontWeight: 900, lineHeight: 1.12, marginBottom: '0.68rem', letterSpacing: '-0.018em' }}>
              ESG wird relevant – für Finanzierung, Kunden und Lieferketten.
            </h1>
            <p style={{ fontSize: '0.98rem', color: '#5f6b7a', lineHeight: 1.42, marginBottom: '0.95rem', maxWidth: '640px' }}>
              Kläre in Minuten, ob dein Unternehmen betroffen ist.
            </p>

            <button
              className="btn btn-primary landing-hero-cta"
              style={{ fontSize: '1rem', padding: '0.8rem 1.45rem', borderRadius: '10px' }}
              onClick={() => startCheck({})}
            >
              Jetzt ESG-Check starten
            </button>
            <p style={{ marginTop: '0.55rem', fontSize: '0.8rem', color: '#687586' }}>
              Kostenlos · Ohne Login · Ergebnis in Minuten
            </p>
          </div>
        </div>
      </div>

      <div className="landing-problem-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.95rem', marginBottom: '1rem' }}>
        <div
          className="card landing-problem-card"
          style={{ borderLeft: '4px solid var(--danger)', borderColor: 'rgba(208, 91, 89, 0.22)' }}
        >
          <div className="card-body" style={{ padding: '1.02rem 1.04rem' }}>
            <AlertOctagon size={24} style={{ color: 'var(--danger)', marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '0.35rem' }}>Bank fordert ESG-Daten</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.42, margin: 0 }}>
              ESG-Daten werden bei Finanzierungen oft vorausgesetzt.
            </p>
          </div>
        </div>

        <div
          className="card landing-problem-card"
          style={{ borderLeft: '4px solid var(--warning)', borderColor: 'rgba(184, 132, 31, 0.22)' }}
        >
          <div className="card-body" style={{ padding: '1.02rem 1.04rem' }}>
            <FileText size={24} style={{ color: 'var(--warning)', marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '0.35rem' }}>Großkunde verlangt Nachweise</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.42, margin: 0 }}>
              In Ausschreibungen werden ESG-Nachweise zunehmend verlangt.
            </p>
          </div>
        </div>

        <div
          className="card landing-problem-card"
          style={{ borderLeft: '4px solid var(--success)', borderColor: 'rgba(31, 143, 104, 0.24)' }}
        >
          <div className="card-body" style={{ padding: '1.02rem 1.04rem' }}>
            <ShieldCheck size={24} style={{ color: 'var(--success)', marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '0.35rem' }}>Bin ich überhaupt betroffen?</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.42, margin: 0 }}>
              Der Check zeigt sofort, ob Handlungsbedarf besteht.
            </p>
          </div>
        </div>
      </div>

      <div className="landing-benefits-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.05rem', padding: '0.32rem 0.1rem 0' }}>
        <div style={{ minWidth: 0, display: 'flex', gap: '0.52rem', alignItems: 'flex-start' }}>
          <Landmark size={17} style={{ color: 'var(--primary)', marginTop: '0.08rem', flexShrink: 0 }} />
          <div>
            <strong style={{ fontSize: '0.92rem', lineHeight: 1.2 }}>Finanzierung</strong>
            <p style={{ marginTop: '0.2rem', color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.35, marginBottom: 0 }}>
              ESG-Daten stärken die Finanzierungsfähigkeit.
            </p>
          </div>
        </div>
        <div style={{ minWidth: 0, display: 'flex', gap: '0.52rem', alignItems: 'flex-start' }}>
          <Building2 size={17} style={{ color: 'var(--primary)', marginTop: '0.08rem', flexShrink: 0 }} />
          <div>
            <strong style={{ fontSize: '0.92rem', lineHeight: 1.2 }}>Lieferkette</strong>
            <p style={{ marginTop: '0.2rem', color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.35, marginBottom: 0 }}>
              Großkunden erwarten ESG-Nachweise.
            </p>
          </div>
        </div>
        <div style={{ minWidth: 0, display: 'flex', gap: '0.52rem', alignItems: 'flex-start' }}>
          <Compass size={17} style={{ color: 'var(--primary)', marginTop: '0.08rem', flexShrink: 0 }} />
          <div>
            <strong style={{ fontSize: '0.92rem', lineHeight: 1.2 }}>Orientierung</strong>
            <p style={{ marginTop: '0.2rem', color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.35, marginBottom: 0 }}>
              Score, Vergleich und nächste Schritte auf einen Blick.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
