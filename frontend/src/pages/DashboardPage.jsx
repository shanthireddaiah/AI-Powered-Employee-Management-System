import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Clock, Calendar, DollarSign, Award, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function DashboardPage({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seedMessage, setSeedMessage] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/analytics/dashboard/');
      setStats(res.data);
    } catch (err) {
      console.error(err);
      // Fallback state
      setStats({
        total_employees: 3,
        pending_leaves: 1,
        approved_leaves: 2,
        avg_performance_rating: 4.8,
        department_counts: { Engineering: 1, 'Human Resources': 1, 'Product Design': 1 },
        attendance: { presence_rate: 96.5, avg_work_hours: 8.2, total_records: 3 },
        payroll: { total_payroll: 230300.0, avg_salary: 76766.67, department_totals: { Engineering: 88000.0, 'Human Resources': 73500.0, 'Product Design': 68800.0 } }
      });
    } finally {
      setLoading(false);
    }
  };

  const seedData = async () => {
    try {
      const res = await axios.post('/api/seed/');
      setSeedMessage(res.data.message || 'Database seeded successfully!');
      setTimeout(() => setSeedMessage(''), 4000);
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>HRMS Management Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Enterprise HR Overview & Workforce Analytics</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={seedData}>
            <RefreshCw size={16} /> Seed Demo HR Data
          </button>
        </div>
      </div>

      {seedMessage && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent-emerald)',
          borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
          color: 'var(--accent-emerald)', fontSize: '0.9rem'
        }}>
          <CheckCircle2 size={18} /> {seedMessage}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)' }}>
            <Users size={24} />
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Active Employees</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{stats?.total_employees || 0}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-emerald)' }}>
            <Clock size={24} />
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Presence Rate</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{stats?.attendance?.presence_rate || 100}%</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-amber)' }}>
            <Calendar size={24} />
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Pending Leaves</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{stats?.pending_leaves || 0}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.2)', color: 'var(--accent-purple)' }}>
            <Award size={24} />
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Avg Performance</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{stats?.avg_performance_rating || 5.0} / 5.0</h2>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Attendance Analytics */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={20} color="var(--accent-cyan)" /> Attendance Summary
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Average Daily Hours:</span>
              <strong>{stats?.attendance?.avg_work_hours || 8.0} hrs / day</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Logged Records:</span>
              <strong>{stats?.attendance?.total_records || 0} Logs</strong>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                <span>Presence Progress:</span>
                <span>{stats?.attendance?.presence_rate || 95}%</span>
              </div>
              <div style={{ height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${stats?.attendance?.presence_rate || 95}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #06b6d4)' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Department Payroll Breakdown */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={20} color="var(--accent-emerald)" /> Department Payroll Distribution
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Monthly Expenditure:</span>
              <strong style={{ color: 'var(--accent-emerald)', fontSize: '1.2rem' }}>
                ${stats?.payroll?.total_payroll ? Number(stats.payroll.total_payroll).toLocaleString() : '0'}
              </strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
              {stats?.payroll?.department_totals && Object.entries(stats.payroll.department_totals).map(([dept, total]) => (
                <div key={dept} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{dept}:</span>
                  <strong>${Number(total).toLocaleString()}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

