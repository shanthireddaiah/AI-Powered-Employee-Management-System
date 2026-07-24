import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, LogOut, Bell, X, CheckCircle, AlertCircle, Info, ExternalLink } from 'lucide-react';


export default function Header({ user, onLogout, onNavigate }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications/');
      const currentRole = user?.role || 'Admin';
      const currentUserId = user?.id;
      const currentFirstName = user?.first_name?.toLowerCase() || '';
      const currentEmpCode = user?.employee_code?.toLowerCase() || '';

      let list = Array.isArray(res.data) ? res.data : [];

      // Strict Role-Based Privacy Filter
      if (currentRole === 'Employee') {
        list = list.filter(n => {
          // If targeted directly to this user ID or employee ID
          if (n.user && n.user === currentUserId) return true;
          if (n.employee && user && n.employee === user.id) return true;

          const text = `${n.title} ${n.message}`.toLowerCase();

          // Must be personal to this employee
          if (n.recipient_role === 'Employee' || !n.recipient_role) {
            if (currentFirstName && text.includes(currentFirstName)) return true;
            if (currentEmpCode && text.includes(currentEmpCode)) return true;
            if (text.startsWith('your ') || text.includes(' you ') || text.includes('you have')) return true;
          }

          return false;
        });
      }

      setNotifications(list);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotificationClick = async (notif) => {
    try {
      await axios.post(`/api/notifications/${notif.id}/mark-read/`);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
    setShowNotifications(false);
    
    if (onNavigate && notif.link) {
      // Map route links to activeTab IDs
      const tabMap = {
        '/leaves': 'leaves',
        '/attendance': 'attendance',
        '/payroll': 'salary',
        '/projects': 'projects',
        '/performance': 'performance'
      };
      const targetTab = tabMap[notif.link] || notif.link.replace('/', '');
      onNavigate(targetTab);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.post('/api/notifications/mark-all-read/');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const currentRole = user?.role || 'Admin';

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#111827' }}>
          HRMS Smart AI
        </h3>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', position: 'relative' }}>
        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
            style={{
              background: '#FFFFFF', border: '1px solid #CBD5E1',
              color: '#64748B', padding: '0.55rem', borderRadius: '50%', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <Bell size={18} color="#64748B" />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-3px', right: '-3px', background: '#DC2626',
                color: 'white', borderRadius: '50%', width: '18px', height: '18px',
                fontSize: '0.7rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(220, 38, 38, 0.4)'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute', right: 0, top: '48px', width: '340px',
              background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 1000, padding: '1rem',
              color: '#111827'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
                <strong style={{ fontSize: '0.9rem', color: '#111827' }}>Notifications ({unreadCount} unread)</strong>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}>
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => handleNotificationClick(n)}
                    style={{
                      background: n.is_read ? '#F8FAFC' : '#EFF6FF',
                      border: n.is_read ? '1px solid #E2E8F0' : '1px solid #BFDBFE',
                      borderRadius: '8px', padding: '0.7rem 0.75rem',
                      cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: n.is_read ? '#475569' : '#2563EB', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {!n.is_read && <span style={{ width: '6px', height: '6px', background: '#2563EB', borderRadius: '50%', display: 'inline-block' }}></span>}
                        {n.title}
                      </div>
                      <div style={{ color: '#334155', fontSize: '0.78rem', marginTop: '0.2rem', lineHeight: '1.3' }}>{n.message}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span>Click to view details</span> <ExternalLink size={10} />
                      </div>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#64748B', fontSize: '0.85rem', padding: '1rem' }}>
                    No new notifications.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          backgroundColor: '#FFFFFF', padding: '0.4rem 1rem', borderRadius: '20px',
          border: '2px solid #2563EB', fontSize: '0.85rem', color: '#111827',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <Shield size={16} color="#64748B" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#111827' }}>
              {user ? `${user.first_name} ${user.last_name}` : 'Shanthi Reddaiah'}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '500' }}>
              {currentRole} ({user?.employee_code || 'EMP001'})
            </span>
          </div>
        </div>

        {/* Logout Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            title="Sign Out"
            style={{
              background: 'rgba(220, 38, 38, 0.08)',
              border: '1px solid rgba(220, 38, 38, 0.25)',
              color: '#DC2626',
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: '600',
              fontSize: '0.8rem',
              transition: 'background 0.2s ease'
            }}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        )}
      </div>
    </header>
  );
}


