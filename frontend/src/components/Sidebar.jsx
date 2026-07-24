import React from 'react';
import { LayoutDashboard, Users, Clock, Calendar, FolderGit2, DollarSign, Award, Bot } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, userRole, onLogout }) {
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'HR', 'Manager', 'Employee'] },
    { id: 'employees', label: 'Employees', icon: Users, roles: ['Admin', 'HR', 'Manager'] },
    { id: 'attendance', label: 'Attendance', icon: Clock, roles: ['Admin', 'HR', 'Manager', 'Employee'] },
    { id: 'leaves', label: 'Leaves', icon: Calendar, roles: ['Admin', 'HR', 'Manager', 'Employee'] },
    { id: 'projects', label: 'Projects', icon: FolderGit2, roles: ['Admin', 'HR', 'Manager', 'Employee'] },
    { id: 'salary', label: 'Salary & Payroll', icon: DollarSign, roles: ['Admin', 'HR', 'Manager'] },
    { id: 'performance', label: 'Performance ML', icon: Award, roles: ['Admin', 'HR', 'Manager', 'Employee'] },
    { id: 'ai', label: 'AI Assistant', icon: Bot, roles: ['Admin', 'HR', 'Manager', 'Employee'] },
  ];

  const role = userRole || 'Admin';
  const menu = allMenuItems.filter(item => item.roles.includes(role));

  return (
    <aside className="sidebar">
      <div className="logo-container">
        <div className="logo-icon" style={{ background: '#2563EB', color: '#FFFFFF' }}>⚡</div>
        <div className="logo-text">
          <h2 style={{ color: '#0F172A', fontSize: '1.15rem', fontWeight: '800', margin: 0, display: 'block' }}>
            HRMS Smart AI
          </h2>
          <span style={{ color: '#475569', fontSize: '0.75rem', fontWeight: '600', display: 'block' }}>
            Enterprise Portal
          </span>
        </div>
      </div>

      <ul className="nav-list">
        {menu.map((item) => {
          const Icon = item.icon;
          return (
            <li
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </li>
          );
        })}
      </ul>

      {onLogout && (
        <button
          onClick={onLogout}
          style={{
            margin: '0.75rem 0',
            width: '100%',
            padding: '0.65rem 1rem',
            background: '#EFF6FF',
            border: '1px solid #93C5FD',
            color: '#1D4ED8',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease'
          }}
        >
          <span>🔒 Sign Out / Switch Account</span>
        </button>
      )}
    </aside>
  );
}
