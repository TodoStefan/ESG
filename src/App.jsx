import React, { useEffect, useState } from 'react';
import './index.css';

// Components
import TopNav from './components/TopNav';
import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';

// Pages
import Home from './pages/Home';
import AffectednessCheck from './pages/AffectednessCheck';
import CompanyData from './pages/CompanyData';
import Dashboard from './pages/Dashboard';
import AuditLog from './pages/AuditLog';
import CompetitionBenchmark from './pages/CompetitionBenchmark';
import Login from './pages/Login';
import Register from './pages/Register';
import Impressum from './pages/Impressum';
import Datenschutz from './pages/Datenschutz';
import AGB from './pages/AGB';

// Engine & Services
import { useEsgData } from './hooks/useEsgData';
import { supabase, hasSupabaseConfig, supabaseConfigInfo } from './lib/supabaseClient';

const PROTECTED_TABS = ['data', 'dashboard', 'competition', 'audit'];
const LEGAL_TABS = ['impressum', 'datenschutz', 'agb'];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(hasSupabaseConfig);
  const [authError, setAuthError] = useState('');
  const [pendingTabAfterLogin, setPendingTabAfterLogin] = useState('data');

  // Global Context State
  const [affectedResult, setAffectedResult] = useState(null);
  const [wizardAnswers, setWizardAnswers] = useState({});
  const isAuthenticated = Boolean(session?.user);

  const {
    formData,
    handleFormChange,
    calculateAndSave,
    dashboardData,
    scores,
    benchmark,
    benchmarkComparisons,
    recommendations,
    esgRecords,
    auditLog,
    analytics,
    riskStatus,
    isSaving,
    isBootstrapping,
    error,
  } = useEsgData({
    userId: session?.user?.id || null,
    isAuthenticated,
    userLabel: session?.user?.email || 'Aktueller Benutzer',
  });

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setAuthLoading(false);
      return;
    }

    let isMounted = true;

    const loadSession = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (isMounted) {
          setSession(data?.session || null);
        }
      } catch (err) {
        console.error('Session konnte nicht geladen werden:', err);
        if (isMounted) {
          setAuthError('Session konnte nicht geladen werden. Bitte erneut anmelden.');
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    };

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
      setAuthError('');
      setAuthLoading(false);
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated && (activeTab === 'login' || activeTab === 'register')) {
      const nextTab = pendingTabAfterLogin || 'data';
      setActiveTab(nextTab);
      return;
    }

    if (!isAuthenticated && PROTECTED_TABS.includes(activeTab)) {
      setPendingTabAfterLogin(activeTab);
      setActiveTab('affectedness');
    }
  }, [activeTab, isAuthenticated, pendingTabAfterLogin]);

  const handleStartCheck = (prefill) => {
    setWizardAnswers(prefill);
    setAffectedResult(null);
    setActiveTab('affectedness');
  };

  const navigateToTab = (tab) => {
    if (LEGAL_TABS.includes(tab) || tab === 'home' || tab === 'affectedness' || tab === 'login' || tab === 'register') {
      setActiveTab(tab);
      return;
    }

    if (PROTECTED_TABS.includes(tab) && !isAuthenticated) {
      setPendingTabAfterLogin(tab);
      setActiveTab('login');
      return;
    }

    setActiveTab(tab);
  };

  const handleLogin = async ({ email, password }) => {
    if (!hasSupabaseConfig || !supabase) {
      return { success: false, error: 'Supabase ist nicht konfiguriert.' };
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) {
      return { success: false, error: loginError.message };
    }

    return { success: true };
  };

  const handleRegister = async ({ email, password }) => {
    if (!hasSupabaseConfig || !supabase) {
      return { success: false, error: 'Supabase ist nicht konfiguriert.' };
    }

    const { data, error: registerError } = await supabase.auth.signUp({ email, password });
    if (registerError) {
      return { success: false, error: registerError.message };
    }

    const needsEmailConfirmation = !data?.session;

    if (!needsEmailConfirmation) {
      setActiveTab(pendingTabAfterLogin || 'data');
    }

    return { success: true, needsEmailConfirmation };
  };

  const handleLogout = async () => {
    if (!hasSupabaseConfig || !supabase) {
      setSession(null);
      setActiveTab('home');
      return;
    }

    const { error: logoutError } = await supabase.auth.signOut();
    if (logoutError) {
      setAuthError(logoutError.message || 'Logout fehlgeschlagen.');
      return;
    }

    setSession(null);
    setActiveTab('home');
  };

  const handleCalculateAndSave = async () => {
    const result = await calculateAndSave();
    if (result?.success) {
      setActiveTab('dashboard');
    }
  };

  const authUnavailable = !supabaseConfigInfo.hasConfig;
  const authMissingVarsText = supabaseConfigInfo.missingVars.join(', ');
  const authConfigHint = authUnavailable
    ? `Fehlende ENV-Werte: ${authMissingVarsText || 'VITE_SUPABASE_URL und Key'}. Nach Änderung bitte Dev-Server neu starten.`
    : '';

  return (
    <div className="app-layout">
      <TopNav 
        activeTab={activeTab}
        setActiveTab={navigateToTab}
        isAuthenticated={isAuthenticated}
        userEmail={session?.user?.email || ''}
        onLogout={handleLogout}
      />

      <div className="main-content">
        <div className="dashboard-container">
          {authLoading ? (
            <div className="card auth-status-card">
              <div className="card-body">
                <h2>Authentifizierung wird geladen …</h2>
                <p>Bitte einen kurzen Moment warten, wir prüfen deine Session.</p>
              </div>
            </div>
          ) : null}

          {!authLoading && authError ? (
            <div className="card auth-status-card" style={{ borderLeft: '4px solid var(--danger)' }}>
              <div className="card-body">
                <h2>Anmeldung derzeit nicht verfügbar</h2>
                <p>{authError}</p>
              </div>
            </div>
          ) : null}

          {!authLoading && activeTab === 'home' && (
            <Home startCheck={handleStartCheck} />
          )}

          {!authLoading && activeTab === 'affectedness' && (
            <AffectednessCheck 
              prefillData={wizardAnswers}
              setAffectedResult={setAffectedResult}
              onWizardCompleteAnswers={setWizardAnswers}
              goToDataTab={() => navigateToTab('data')}
              isAuthenticated={isAuthenticated}
              onLogin={() => navigateToTab('login')}
              onRegister={() => navigateToTab('register')}
              onLearnMore={() => navigateToTab('home')}
            />
          )}

          {!authLoading && activeTab === 'login' && (
            <Login
              onLogin={handleLogin}
              onGoRegister={() => navigateToTab('register')}
              authUnavailable={authUnavailable}
              configHint={authConfigHint}
            />
          )}

          {!authLoading && activeTab === 'register' && (
            <Register
              onRegister={handleRegister}
              onGoLogin={() => navigateToTab('login')}
              authUnavailable={authUnavailable}
              configHint={authConfigHint}
            />
          )}

          {!authLoading && isAuthenticated && activeTab === 'data' && (
            <CompanyData 
              formData={formData}
              handleChange={handleFormChange}
              onCalculate={handleCalculateAndSave}
              isSaving={isSaving}
              error={error}
            />
          )}

          {!authLoading && isAuthenticated && activeTab === 'dashboard' && (
            <Dashboard 
              scores={scores}
              dashboardData={dashboardData}
              bm={benchmark}
              affectedResult={affectedResult}
              wizardAnswers={wizardAnswers}
              recs={recommendations}
              esgRecords={esgRecords}
              analytics={analytics}
              benchmarkComparisons={benchmarkComparisons}
              riskStatus={riskStatus}
              loading={isBootstrapping}
              error={error}
              goToDataTab={() => navigateToTab('data')}
            />
          )}

          {!authLoading && isAuthenticated && activeTab === 'audit' && (
            <AuditLog auditLog={auditLog} loading={isBootstrapping} error={error} />
          )}

          {!authLoading && isAuthenticated && activeTab === 'competition' && (
            <CompetitionBenchmark
              dashboardData={dashboardData}
              scores={scores}
              analytics={analytics}
              goToDataTab={() => navigateToTab('data')}
            />
          )}

          {activeTab === 'impressum' && <Impressum />}
          {activeTab === 'datenschutz' && <Datenschutz />}
          {activeTab === 'agb' && <AGB />}
        </div>
      </div>

      <Footer setActiveTab={navigateToTab} />
      <CookieConsent onOpenDatenschutz={() => navigateToTab('datenschutz')} />
    </div>
  );
}
