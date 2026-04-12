import React from 'react';
import {
  ShieldCheck,
  FileText,
  BarChart3 as BarChart,
  History,
  Building2,
  LogIn,
  UserPlus,
  LogOut,
} from 'lucide-react';

const getInitials = (email = '') => {
  if (!email) return 'GU';
  const namePart = email.split('@')[0] || '';
  return namePart.slice(0, 2).toUpperCase();
};

export default function TopNav({
  activeTab,
  setActiveTab,
  isAuthenticated,
  userEmail,
  onLogout,
}) {
  const publicNavItems = [
    { key: 'home', icon: <ShieldCheck size={16} />, label: 'Start' },
    { key: 'affectedness', icon: <ShieldCheck size={16} />, label: 'Betroffenheits-Check' },
  ];

  const protectedNavItems = [
    { key: 'data', icon: <FileText size={16} />, label: 'Meine Unternehmensdaten' },
    { key: 'dashboard', icon: <BarChart size={16} />, label: 'Mein ESG-Ergebnis' },
    { key: 'competition', icon: <Building2 size={16} />, label: 'Konkurrenzvergleich' },
    { key: 'audit', icon: <History size={16} />, label: 'Verlaufsprotokoll' },
  ];

  const navItems = isAuthenticated ? [...publicNavItems, ...protectedNavItems] : publicNavItems;

  return (
    <div className="top-nav">
      <div className="top-nav-left">
        <div className="logo-section">
          <ShieldCheck className="text-primary" />
          <span>ESG Check</span>
        </div>
        <div className="nav-links">
          {navItems.map((item) => (
            <div
              key={item.key}
              className={`nav-item ${activeTab === item.key ? 'active' : ''}`}
              onClick={() => setActiveTab(item.key)}
            >
              {item.icon} {item.label}
            </div>
          ))}
        </div>
      </div>

      <div className="top-nav-right">
        <div className="action-buttons auth-nav-actions" style={{ alignItems: 'center' }}>
          {!isAuthenticated ? (
            <>
              <button className="btn btn-outline auth-nav-btn" onClick={() => setActiveTab('login')}>
                <LogIn size={15} /> Login
              </button>
              <button className="btn btn-primary auth-nav-btn" onClick={() => setActiveTab('register')}>
                <UserPlus size={15} /> Registrieren
              </button>
            </>
          ) : (
            <>
              <span className="auth-pill">Vollzugang aktiv</span>
              <button className="btn btn-outline auth-nav-btn" onClick={onLogout}>
                <LogOut size={15} /> Logout
              </button>
            </>
          )}

          <div className="user-avatar" title={isAuthenticated ? userEmail : 'Gastnutzer'}>
            {isAuthenticated ? getInitials(userEmail) : 'GU'}
          </div>
        </div>
      </div>
    </div>
  );
}
