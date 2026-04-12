import React, { useState } from 'react';
import { LogIn } from 'lucide-react';

export default function Login({ onLogin, onGoRegister, authUnavailable = false, configHint = '' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      setError('Bitte E-Mail und Passwort eingeben.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const result = await onLogin?.({ email, password });
      if (!result?.success) {
        setError(result?.error || 'Login fehlgeschlagen. Bitte erneut versuchen.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', animation: 'fadeIn 0.3s ease-in-out' }}>
      <div className="page-header">
        <div>
          <h1>Anmelden</h1>
          <p>Schalte die vollständige ESG-Analyse für dein Unternehmen frei.</p>
        </div>
      </div>

      <div className="card auth-card">
        <div className="card-header"><LogIn size={16} /> Login zum ESG-Workspace</div>
        <form className="card-body auth-form" onSubmit={handleSubmit}>
          {authUnavailable && (
            <div className="auth-alert auth-alert-warning">
              Die Anmeldung ist aktuell nicht verfügbar. Bitte prüfe die Supabase-Konfiguration.
              {configHint ? <div style={{ marginTop: '0.25rem' }}>{configHint}</div> : null}
            </div>
          )}

          {error && <div className="auth-alert auth-alert-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="login-email">E-Mail</label>
            <input
              id="login-email"
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="name@unternehmen.at"
              disabled={authUnavailable || isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Passwort</label>
            <input
              id="login-password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              disabled={authUnavailable || isSubmitting}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={authUnavailable || isSubmitting}
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem 1rem' }}
          >
            {isSubmitting ? 'Anmeldung läuft …' : 'Jetzt anmelden'}
          </button>

          <p className="auth-switch-text">
            Noch kein Konto?{' '}
            <button type="button" className="auth-switch-link" onClick={onGoRegister} disabled={isSubmitting}>
              Registrieren
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
