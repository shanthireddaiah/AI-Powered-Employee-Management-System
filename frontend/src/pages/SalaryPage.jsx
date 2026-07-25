import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Download } from 'lucide-react';

export default function SalaryPage() {
  const [salaries, setSalaries] = useState([]);

  const fetchSalaries = async () => {
    try {
      const res = await axios.get('/api/salary/');
      setSalaries(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSalaries();
  }, []);

  const handleExportCSV = () => {
    window.open('/api/exports/payroll/', '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Salary & Payroll</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Monthly payslips, bonuses, and tax deduction breakdowns</p>
        </div>
        <button className="btn btn-primary" onClick={handleExportCSV}>
          <Download size={16} /> Export Payroll CSV
        </button>
      </div>


      <div className="card">
        <h3>Payroll Disbursement Records</h3>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Period</th>
                <th>Base Salary</th>
                <th>Bonuses</th>
                <th>Deductions</th>
                <th>Net Salary</th>
                <th>Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {salaries.map(sal => (
                <tr key={sal.id}>
                  <td><strong>{sal.employee_name || 'John Doe'}</strong></td>
                  <td>{sal.month} {sal.year}</td>
                  <td>${parseFloat(sal.base_salary).toLocaleString()}</td>
                  <td style={{ color: 'var(--accent-emerald)' }}>+${parseFloat(sal.bonuses).toLocaleString()}</td>
                  <td style={{ color: 'var(--accent-rose)' }}>-${parseFloat(sal.deductions).toLocaleString()}</td>
                  <td><strong style={{ color: 'var(--accent-cyan)', fontSize: '1.05rem' }}>${parseFloat(sal.net_salary).toLocaleString()}</strong></td>
                  <td>
                    <span className={`status-tag status-${sal.payment_status.toLowerCase()}`}>
                      {sal.payment_status}
                    </span>
                  </td>
                </tr>
              ))}
              {salaries.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    No payroll records generated yet. Click "Seed Demo HR Data" on Dashboard.
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
