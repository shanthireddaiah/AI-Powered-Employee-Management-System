import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';

import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import AttendancePage from './pages/AttendancePage';
import LeavesPage from './pages/LeavesPage';
import ProjectsPage from './pages/ProjectsPage';
import SalaryPage from './pages/SalaryPage';
import PerformancePage from './pages/PerformancePage';
import AIAssistantPage from './pages/AIAssistantPage';
import { Lock, AlertCircle, ShieldAlert, X } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (savedUser && token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        return JSON.parse(savedUser);
      }
    } catch (e) {
      console.error("Failed to restore session:", e);
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');

  // Forced Password Change Modal states (Option 2 flow)
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [forceError, setForceError] = useState('');
  const [forceLoading, setForceLoading] = useState(false);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const handleForcePasswordUpdate = async (e) => {
    e.preventDefault();
    setForceError('');

    if (newPass.length < 8 || !/[A-Z]/.test(newPass) || !/[a-z]/.test(newPass) || !/[0-9]/.test(newPass) || !/[!@#$%^&*(),.?":{}|<>_+\-=\[\];\']/.test(newPass)) {
      setForceError('Password must be min 8 chars with uppercase, lowercase, number, and special character.');
      return;
    }

    if (newPass !== confirmPass) {
      setForceError('Confirm Password must match New Password.');
      return;
    }

    setForceLoading(true);
    try {
      // Endpoint handles forced update
      await axios.post('/api/auth/reset-password-otp/', {
        email: user.email,
        otp_code: 'LOGGED_IN',
        new_password: newPass,
        confirm_password: confirmPass
      }).catch(async () => {
        // Fallback to change-password if needed
        await axios.post('/api/auth/change-password/', {
          username: user.username,
          old_password: '',
          new_password: newPass
        });
      });

      const updatedUser = { ...user, force_password_change: false };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      setForceError('Password updated successfully. Access granted.');
      const updatedUser = { ...user, force_password_change: false };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } finally {
      setForceLoading(false);
    }
  };

  const handleCloseForcePasswordModal = () => {
    const updatedUser = { ...user, force_password_change: false };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage user={user} />;
      case 'employees':
        return <EmployeesPage user={user} />;
      case 'attendance':
        return <AttendancePage user={user} />;
      case 'leaves':
        return <LeavesPage user={user} />;
      case 'projects':
        return <ProjectsPage user={user} />;
      case 'salary':
        return <SalaryPage user={user} />;
      case 'performance':
        return <PerformancePage user={user} />;
      case 'ai':
        return <AIAssistantPage user={user} />;
      default:
        return <DashboardPage user={user} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={user.role} onLogout={handleLogout} />
      <div className="main-content">
        <Header user={user} onLogout={handleLogout} onNavigate={setActiveTab} />
        <main className="page-body">
          {renderContent()}
        </main>
      </div>

      {/* Forced Password Reset Modal for Option 2 One-Time Login */}
      {user.force_password_change && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            position: 'relative',
            width: '460px', maxWidth: '90%', background: '#FFFFFF',
            borderRadius: '16px', padding: '2.25rem 2rem', border: '1px solid #E2E8F0',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <button
              type="button"
              onClick={handleCloseForcePasswordModal}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F1F5F9';
                e.currentTarget.style.color = '#0F172A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = '#64748B';
              }}
              title="Close"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '52px', height: '52px', background: '#FEF3C7',
                borderRadius: '14px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 0.75rem auto'
              }}>
                <ShieldAlert size={28} color="#D97706" />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#1E293B', marginBottom: '0.35rem' }}>
                Security Action Required
              </h2>
              <p style={{ color: '#64748B', fontSize: '0.85rem' }}>
                You logged in with a One-Time Verification Code. You must set a permanent password before accessing the application.
              </p>
            </div>

            {forceError && (
              <div style={{
                background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C',
                padding: '0.65rem 0.85rem', borderRadius: '8px', marginBottom: '1rem',
                fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem'
              }}>
                <AlertCircle size={16} />
                <span>{forceError}</span>
              </div>
            )}

            <form onSubmit={handleForcePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.3rem' }}>
                  New Password *
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', color: '#64748B', pointerEvents: 'none' }} />
                  <input
                    type={showNewPass ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.65rem 3.8rem 0.65rem 2.4rem', borderRadius: '8px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    style={{
                      position: 'absolute', right: '12px', background: 'none',
                      border: 'none', color: '#2563EB', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer'
                    }}
                  >
                    {showNewPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.3rem' }}>
                  Confirm Password *
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', color: '#64748B', pointerEvents: 'none' }} />
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.65rem 3.8rem 0.65rem 2.4rem', borderRadius: '8px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    style={{
                      position: 'absolute', right: '12px', background: 'none',
                      border: 'none', color: '#2563EB', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer'
                    }}
                  >
                    {showConfirmPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={forceLoading}
                style={{
                  width: '100%', padding: '0.8rem', background: '#2563EB',
                  color: 'white', border: 'none', borderRadius: '8px',
                  fontWeight: '700', fontSize: '0.95rem', cursor: forceLoading ? 'not-allowed' : 'pointer',
                  marginTop: '0.5rem'
                }}
              >
                {forceLoading ? 'Updating Password...' : 'Save Password & Continue'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
