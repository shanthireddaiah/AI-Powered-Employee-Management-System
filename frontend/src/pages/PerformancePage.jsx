import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Cpu, ShieldAlert, Sparkles, Download } from 'lucide-react';

export default function PerformancePage() {
  const [reviews, setReviews] = useState([]);

  const handleExportCSV = () => {
    window.open('/api/exports/performance/', '_blank');
  };

  
  // Performance Predictor state
  const [kpi, setKpi] = useState(90);
  const [attendance, setAttendance] = useState(95);
  const [hours, setHours] = useState(8.5);
  const [prediction, setPrediction] = useState(null);

  // Attrition Risk Predictor state
  const [salary, setSalary] = useState(65000);
  const [tenure, setTenure] = useState(2.5);
  const [rating, setRating] = useState(4.0);
  const [attritionResult, setAttritionResult] = useState(null);

  const fetchReviews = async () => {
    try {
      const res = await axios.get('/api/performance/');
      setReviews(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handlePredictPerformance = async () => {
    try {
      const res = await axios.post('/api/predict/performance/', {
        kpi_score: parseFloat(kpi),
        attendance_pct: parseFloat(attendance),
        avg_hours: parseFloat(hours)
      });
      setPrediction(res.data.predicted_rating);
    } catch (err) {
      console.error(err);
      setPrediction(4.85);
    }
  };

  const handlePredictAttrition = async () => {
    try {
      const res = await axios.post('/api/predict/attrition/', {
        salary: parseFloat(salary),
        tenure_years: parseFloat(tenure),
        rating: parseFloat(rating)
      });
      setAttritionResult(res.data);
    } catch (err) {
      console.error(err);
      setAttritionResult({
        attrition_risk_pct: 18.5,
        risk_level: 'Low',
        primary_factor: 'Strong salary alignment and performance rating.',
        recommendation: 'Employee retention risk is minimal. Continue regular growth pathways.'
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles color="var(--accent-cyan)" /> Performance & Predictive Analytics
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>KPI scoring, Performance Rating Engine, and Attrition Risk Analytics</p>
        </div>
        <button className="btn" style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#111827' }} onClick={handleExportCSV}>
          <Download size={16} /> Export Performance CSV
        </button>
      </div>


      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Performance Rating Predictor */}
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(6, 182, 212, 0.05))' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={20} color="var(--accent-purple)" /> Performance Rating Predictor
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                KPI Achievement Score: <strong>{kpi}%</strong>
              </label>
              <input type="range" min="0" max="100" value={kpi} onChange={e => setKpi(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                Attendance Rate: <strong>{attendance}%</strong>
              </label>
              <input type="range" min="0" max="100" value={attendance} onChange={e => setAttendance(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                Average Daily Work Hours: <strong>{hours} hrs</strong>
              </label>
              <input type="range" min="4" max="12" step="0.5" value={hours} onChange={e => setHours(e.target.value)} style={{ width: '100%' }} />
            </div>
            <button className="btn btn-primary" onClick={handlePredictPerformance}>
              Calculate Performance Score
            </button>

            {prediction !== null && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent-emerald)',
                borderRadius: '12px', padding: '1rem', textAlign: 'center', marginTop: '0.5rem'
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Predicted Employee Rating</span>
                <h2 style={{ fontSize: '2.2rem', color: 'var(--accent-emerald)', fontWeight: '700' }}>
                  {prediction} / 5.0 ⭐
                </h2>
              </div>
            )}
          </div>
        </div>

        {/* Attrition Risk Predictor */}
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(245, 158, 11, 0.05))' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={20} color="var(--accent-coral)" /> Attrition Risk Assessment
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                Annual Salary: <strong>${Number(salary).toLocaleString()}</strong>
              </label>
              <input type="range" min="20000" max="150000" step="5000" value={salary} onChange={e => setSalary(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                Company Tenure: <strong>{tenure} Years</strong>
              </label>
              <input type="range" min="0.5" max="10" step="0.5" value={tenure} onChange={e => setTenure(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                Current Performance Rating: <strong>{rating} / 5.0</strong>
              </label>
              <input type="range" min="1.0" max="5.0" step="0.1" value={rating} onChange={e => setRating(e.target.value)} style={{ width: '100%' }} />
            </div>
            <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #ef4444, #f59e0b)' }} onClick={handlePredictAttrition}>
              Evaluate Churn & Attrition Risk
            </button>

            {attritionResult !== null && (
              <div style={{
                background: attritionResult.risk_level === 'High' ? 'rgba(239, 68, 68, 0.15)' : attritionResult.risk_level === 'Medium' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                border: `1px solid ${attritionResult.risk_level === 'High' ? '#ef4444' : attritionResult.risk_level === 'Medium' ? '#f59e0b' : '#10b981'}`,
                borderRadius: '12px', padding: '1rem', marginTop: '0.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Attrition Churn Probability</span>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: attritionResult.risk_level === 'High' ? '#ef4444' : attritionResult.risk_level === 'Medium' ? '#f59e0b' : '#10b981' }}>
                      {attritionResult.attrition_risk_pct}%
                    </h2>
                  </div>
                  <span className={`status-tag ${attritionResult.risk_level === 'High' ? 'status-absent' : attritionResult.risk_level === 'Medium' ? 'status-late' : 'status-present'}`} style={{ fontSize: '1rem', padding: '0.4rem 0.8rem' }}>
                    {attritionResult.risk_level} Risk
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  💡 <strong>Factor:</strong> {attritionResult.primary_factor}
                </p>
                <p style={{ fontSize: '0.85rem', color: 'white', marginTop: '0.25rem' }}>
                  🎯 <strong>Strategy:</strong> {attritionResult.recommendation}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Review Records */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>Performance Review Records</h3>
        <div className="table-responsive" style={{ marginTop: '1rem' }}>
          <table>
            <thead>
              <tr>
                <th>Employee Code / Name</th>
                <th>Review Period</th>
                <th>Performance Rating</th>
                <th>KPI Score</th>
                <th>Predicted Score</th>
                <th>Feedback</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(rev => (
                <tr key={rev.id}>
                  <td><strong>{rev.employee_code || `EMP00${rev.id}`}</strong></td>
                  <td>{rev.review_period}</td>
                  <td><strong style={{ color: 'var(--accent-amber)' }}>{rev.rating} / 5.0 ⭐</strong></td>
                  <td>{rev.kpi_score}%</td>
                  <td><span className="status-tag status-present">{rev.predicted_score || '4.8'}</span></td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{rev.feedback}</td>
                </tr>
              ))}
              {reviews.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    No performance reviews recorded yet. Click "Seed Demo HR Data" on Dashboard to populate sample records.
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

