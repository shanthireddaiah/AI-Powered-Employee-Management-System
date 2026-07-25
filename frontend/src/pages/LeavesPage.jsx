import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Check, X } from 'lucide-react';

export default function LeavesPage({ user }) {
  const [leaves, setLeaves] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({
    employee: user?.id || 1, 
    leave_type: 'Casual', 
    start_date: new Date().toISOString().split('T')[0], 
    end_date: new Date().toISOString().split('T')[0], 
    reason: ''
  });

  const currentRole = user?.role || 'Admin';

  const fetchLeaves = async () => {
    try {
      const res = await axios.get('/api/leaves/');
      setLeaves(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // Filter leaves for Employee Privacy
  const displayedLeaves = currentRole === 'Employee'
    ? leaves.filter(item => item.employee === user?.id || (item.employee_name && user && item.employee_name.toLowerCase().includes(`${user.first_name} ${user.last_name}`.toLowerCase())))
    : leaves;

  const handleApply = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.reason.trim()) {
      setErrorMsg('Leave description is required.');
      return;
    }

    if (new Date(form.end_date) < new Date(form.start_date)) {
      setErrorMsg('End Date must be on or after Start Date.');
      return;
    }

    try {
      await axios.post('/api/leaves/', { ...form, employee: user?.id || form.employee });
      setShowForm(false);
      setForm({
        employee: user?.id || 1,
        leave_type: 'General Leave (GL)',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        reason: ''
      });
      fetchLeaves();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to submit leave application.');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      if (status === 'Approved') {
        await axios.post(`/api/leaves/${id}/approve/`);
      } else if (status === 'Rejected') {
        await axios.post(`/api/leaves/${id}/reject/`);
      } else {
        await axios.patch(`/api/leaves/${id}/`, { status });
      }
      fetchLeaves();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Leave Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {currentRole === 'Employee' ? 'Apply for leaves and track your approval status' : 'Apply for leaves and manage HR approvals'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setErrorMsg(''); setShowForm(true); }}>
          <Plus size={16} /> Apply for Leave
        </button>
      </div>

      <div className="card">
        <h3>{currentRole === 'Employee' ? 'My Leave Requests & History' : 'Leave Requests & History'}</h3>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                {currentRole !== 'Employee' && <th>Employee</th>}
                <th>Type</th>
                <th>Dates</th>
                <th>Reason</th>
                <th>Status</th>
                {currentRole !== 'Employee' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {displayedLeaves.map(item => (
                <tr key={item.id}>
                  {currentRole !== 'Employee' && <td><strong>{item.employee_name || 'Shanthi Reddaiah'}</strong></td>}
                  <td>{item.leave_type}</td>
                  <td>{item.start_date} to {item.end_date}</td>
                  <td>{item.reason}</td>
                  <td>
                    <span className={`status-tag status-${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                  {currentRole !== 'Employee' && (
                    <td>
                      {item.status === 'Pending' ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-success" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleUpdateStatus(item.id, 'Approved')}>
                            <Check size={14} /> Approve
                          </button>
                          <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleUpdateStatus(item.id, 'Rejected')}>
                            <X size={14} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Processed</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {displayedLeaves.length === 0 && (
                <tr>
                  <td colSpan={currentRole === 'Employee' ? 4 : 6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    No leave requests found. Click "Apply for Leave" to submit a request.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '480px', background: '#FFFFFF', border: '1px solid #CBD5E1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.3rem', color: '#111827' }}>Apply for Leave</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div style={{
                background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C',
                padding: '0.65rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem'
              }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
                  Leave Type *
                </label>
                <select 
                  value={form.leave_type} 
                  onChange={e => setForm({...form, leave_type: e.target.value})}
                  style={{ width: '100%' }}
                >
                  <option value="Casual">Casual Leave (GL)</option>
                  <option value="Earned">Earned Leave (EL)</option>
                  <option value="Festival">Festival Leave (FL)</option>
                  <option value="Medical">Medical Leave (SL)</option>
                  <option value="Paid">Paid Leave</option>
                  <option value="Unpaid">Unpaid Leave</option>
                  <option value="Maternity">Maternity Leave</option>
                  <option value="Paternity">Paternity Leave</option>
                  <option value="WFH">Work From Home</option>
                  <option value="HalfDay">Half Day Leave</option>
                </select>
              </div>


              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>Start Date *</label>
                  <input type="date" required value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>End Date *</label>
                  <input type="date" required value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>Reason / Description *</label>
                <textarea placeholder="Describe the reason for your leave request..." required rows="3" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}
                  style={{ width: '100%' }}
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

