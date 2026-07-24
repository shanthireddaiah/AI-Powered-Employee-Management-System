import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Search, UserCheck, Trash2, X, Download } from 'lucide-react';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleExportCSV = () => {
    window.open('/api/exports/employees/', '_blank');
  };

  const initialFormState = {
    employee_code: '',
    first_name: '',
    last_name: '',
    email: '',
    country_code: '+91',
    phone: '',
    department: '',
    designation: '',
    role: 'Employee',
    date_of_joining: '',
    salary_amount: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('/api/employees/');
      setEmployees(res.data);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const openAddModal = () => {
    // Generate next unique employee code (EMP001, EMP002, etc.)
    const nextNum = employees.length + 1;
    const autoCode = `EMP${String(nextNum).padStart(3, '0')}`;
    
    setFormData({
      ...initialFormState,
      employee_code: autoCode,
      date_of_joining: ''
    });
    setErrorMessage('');
    setShowModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Client-side field validations
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!formData.first_name.trim() || !nameRegex.test(formData.first_name.trim())) {
      setErrorMessage('First Name must contain letters and spaces only.');
      return;
    }

    if (!formData.last_name.trim() || !nameRegex.test(formData.last_name.trim())) {
      setErrorMessage('Last Name must contain letters and spaces only.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (formData.phone && !/^\d+$/.test(formData.phone.trim())) {
      setErrorMessage('Phone number must contain numbers only.');
      return;
    }

    if (!formData.date_of_joining) {
      setErrorMessage('Please select a valid Date of Joining.');
      return;
    }

    const salaryStr = formData.salary_amount ? formData.salary_amount.toString().trim() : '';
    const salaryVal = parseInt(salaryStr, 10);
    if (!salaryStr || isNaN(salaryVal) || salaryVal <= 0 || !/^\d+$/.test(salaryStr)) {
      setErrorMessage('Please enter a valid salary amount.');
      return;
    }

    try {
      await axios.post('/api/employees/', {
        ...formData,
        salary_amount: salaryVal
      });
      setShowModal(false);
      setFormData(initialFormState);
      fetchEmployees();
    } catch (err) {
      console.error("Error creating employee:", err);
      if (err.response && err.response.data) {
        const data = err.response.data;
        const messages = Object.keys(data).map(key => `${key}: ${Array.isArray(data[key]) ? data[key].join(', ') : data[key]}`);
        setErrorMessage(messages.join(' | '));
      } else {
        setErrorMessage('Failed to connect to backend server. Please try again.');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee record?')) {
      try {
        await axios.delete(`/api/employees/${id}/`);
        fetchEmployees();
      } catch (err) {
        console.error("Failed to delete employee:", err);
        alert("Failed to delete employee record.");
      }
    }
  };

  const filtered = employees.filter(e => 
    (e.first_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.last_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.department || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.employee_code || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Employee Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>View, add, and manage company staff records</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn" style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#111827' }} onClick={handleExportCSV}>
            <Download size={16} /> Export CSV Directory
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input 
              type="text" 
              placeholder="Search by code, name, or department..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.6rem 0.6rem 2.5rem'
              }}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Role</th>
                <th>Base Salary (₹)</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => (
                <tr key={emp.id}>
                  <td><strong>{emp.employee_code}</strong></td>
                  <td>{emp.first_name} {emp.last_name}</td>
                  <td>{emp.email}</td>
                  <td>{emp.country_code || '+91'} {emp.phone || 'N/A'}</td>
                  <td>{emp.department}</td>
                  <td>{emp.designation}</td>
                  <td><span className="status-tag status-present">{emp.role}</span></td>
                  <td><strong>₹{parseInt(emp.salary_amount || 0, 10).toLocaleString('en-IN')}</strong></td>
                  <td>
                    <span className={`status-tag ${emp.is_active ? 'status-present' : 'status-absent'}`}>
                      {emp.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => handleDelete(emp.id)} 
                      style={{ background: 'transparent', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '0.3rem' }}
                      title="Delete Employee"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    No employee records found. Click "Add Employee" above to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '560px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', background: '#FFFFFF', border: '1px solid #CBD5E1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', color: '#111827' }}>Add New Employee</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {errorMessage && (
              <div style={{
                background: '#FEE2E2',
                border: '1px solid #FCA5A5',
                color: '#B91C1C',
                padding: '0.75rem',
                borderRadius: '6px',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                fontWeight: '500'
              }}>
                ⚠️ {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem', display: 'block' }}>
                    Employee Code (Auto-Generated)
                  </label>
                  <input 
                    type="text" 
                    readOnly 
                    placeholder="EMP007"
                    value={formData.employee_code}
                    style={{ width: '100%', background: '#F1F5F9', color: '#111827', fontWeight: '700', cursor: 'not-allowed' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem', display: 'block' }}>Role *</label>
                  <select 
                    value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                    style={{ width: '100%' }}
                  >
                    <option value="Employee">Employee</option>
                    <option value="Manager">Project Manager</option>
                    <option value="HR">HR Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem', display: 'block' }}>First Name (Letters only) *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Shanthi" 
                    required
                    value={formData.first_name} 
                    onChange={e => setFormData({...formData, first_name: e.target.value.replace(/[^A-Za-z\s]/g, '')})}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem', display: 'block' }}>Last Name (Letters only) *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Reddaiah" 
                    required
                    value={formData.last_name} 
                    onChange={e => setFormData({...formData, last_name: e.target.value.replace(/[^A-Za-z\s]/g, '')})}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem', display: 'block' }}>Email Address *</label>
                  <input 
                    type="email" 
                    placeholder="e.g. shanthi@example.com" 
                    required
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem', display: 'block' }}>Phone Number (Digits only)</label>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <select 
                      value={formData.country_code} onChange={e => setFormData({...formData, country_code: e.target.value})}
                      style={{ width: '90px' }}
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+971">🇦🇪 +971</option>
                    </select>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      placeholder="e.g. 9876543210"
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem', display: 'block' }}>Department *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Engineering" 
                    required
                    value={formData.department} 
                    onChange={e => setFormData({...formData, department: e.target.value})}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem', display: 'block' }}>Designation *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Software Engineer" 
                    required
                    value={formData.designation} 
                    onChange={e => setFormData({...formData, designation: e.target.value})}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem', display: 'block' }}>Date of Joining *</label>
                  <input 
                    type="date" 
                    placeholder="Select Date"
                    required
                    value={formData.date_of_joining} 
                    onChange={e => setFormData({...formData, date_of_joining: e.target.value})}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem', display: 'block' }}>Base Salary (₹ INR) *</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '12px', color: '#64748B', fontWeight: '600', fontSize: '0.9rem', pointerEvents: 'none', zIndex: 1 }}>₹</span>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      placeholder="e.g. 85000" 
                      required
                      value={formData.salary_amount} 
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        setFormData({...formData, salary_amount: val});
                      }}
                      onKeyDown={e => {
                        if (['.', ',', '-', '+', 'e', 'E'].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      style={{ width: '100%', paddingLeft: '2.2rem' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



