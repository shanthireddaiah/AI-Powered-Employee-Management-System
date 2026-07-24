import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Clock, LogIn, LogOut, CheckCircle, Download } from 'lucide-react';

export default function AttendancePage() {
  const [logs, setLogs] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');

  const handleExportCSV = () => {
    window.open('/api/exports/attendance/', '_blank');
  };

  const fetchAttendance = async () => {
    try {
      const res = await axios.get('/api/attendance/');
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handlePunchIn = async () => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const dateStr = now.toISOString().split('T')[0];

    try {
      await axios.post('/api/attendance/', {
        employee: 1, // Default test employee
        date: dateStr,
        check_in: timeStr,
        status: 'Present',
        work_hours: 8.0
      });
      setStatusMsg(`Checked IN at ${timeStr}`);
      fetchAttendance();
    } catch (err) {
      setStatusMsg('Already checked in for today or server error');
    }
  };

  const handlePunchOut = async () => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    setStatusMsg(`Checked OUT at ${timeStr}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Attendance System</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Daily login/logout clocking and presence logs</p>
        </div>
        <button className="btn" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-color)', color: 'white' }} onClick={handleExportCSV}>
          <Download size={16} /> Export Attendance CSV
        </button>
      </div>


      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(139, 92, 246, 0.1))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3>Daily Clocking Terminal</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Today: {new Date().toDateString()}
            </p>
            {statusMsg && (
              <div style={{ marginTop: '0.75rem', color: 'var(--accent-emerald)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle size={16} /> {statusMsg}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-success" onClick={handlePunchIn}>
              <LogIn size={18} /> Clock In / Login
            </button>
            <button className="btn btn-danger" onClick={handlePunchOut}>
              <LogOut size={18} /> Clock Out / Logout
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Attendance Logs</h3>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Work Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td><strong>{log.employee_name || 'EMP001'}</strong></td>
                  <td>{log.date}</td>
                  <td>{log.check_in || '--'}</td>
                  <td>{log.check_out || '--'}</td>
                  <td>{log.work_hours} hrs</td>
                  <td>
                    <span className={`status-tag status-${log.status.toLowerCase()}`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    No attendance logs recorded yet. Click "Clock In / Login" to record your presence.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
