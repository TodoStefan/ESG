import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';

export default function Register({ onRegister, onGoLogin, authUnavailable = false, configHint = '' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email || !password || !confirmPassword) {
      setError('Bitte alle Felder ausfüllen.');
      return;
    }

    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwort und Passwortbestätigung stimmen nicht überein.');
      return;
    }

    setError('');
    setInfo('');
    setIsSubmitting(true);

    try {
      const result = await onRegister?.({ email, password });
      if (!result?.success) {
        setError(result?.error || 'Registrierung fehlgeschlagen.');
        return;
      }

      if (result?.needsEmailConfirmation) {
        setInfo('Bitte bestätige deine E-Mail-Adresse. Danach kannst du dich einloggen.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', animation: 'fadeIn 0.3s ease-in-out' }}>
      <div className="page-header">
        <div>
          <h1>Registrieren</h1>
          <p>Erstelle dein Konto und erhalte Zugriff auf Analyse, Vergleich, Verlauf und PDF.</p>
        </div>
      </div>

      <div className="card auth-card">
        <div className="card-header"><UserPlus size={16} /> Zugang zur Vollanalyse freischalten</div>
        <form className="card-body auth-form" onSubmit={handleSubmit}>
          {authUnavailable && (
            <div className="auth-alert auth-alert-warning">
              Registrierung ist aktuell nicht verfügbar. Bitte prüfe die Supabase-Konfiguration.
              {configHint ? <div style={{ marginTop: '0.25rem' }}>{configHint}</div> : null}
            </div>
          )}

          {error && <div className="auth-alert auth-alert-error">{error}</div>}
          {info && <div className="auth-alert auth-alert-info">{info}</div>}

          <div className="form-group">
            <label htmlFor="register-email">E-Mail</label>
            <input
              id="register-email"
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
            <label htmlFor="register-password">Passwort</label>
            <input
              id="register-password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Mindestens 8 Zeichen"
              disabled={authUnavailable || isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-password-repeat">Passwort bestätigen</label>
            <input
              id="register-password-repeat"
              type="password"
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Passwort wiederholen"
              disabled={authUnavailable || isSubmitting}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={authUnavailable || isSubmitting}
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem 1rem' }}
          >
            {isSubmitting ? 'Registrierung läuft …' : 'Konto erstellen'}
          </button>

          <p className="auth-switch-text">
            Bereits registriert?{' '}
            <button type="button" className="auth-switch-link" onClick={onGoLogin} disabled={isSubmitting}>
              Zum Login
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
