import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FolderGit2, Plus, Users, X } from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({ 
    name: '', 
    description: '', 
    client_name: '', 
    start_date: new Date().toISOString().split('T')[0], 
    end_date: '', 
    status: 'In-Progress' 
  });

  const fetchProjects = async () => {
    try {
      const res = await axios.get('/api/projects/');
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.name.trim()) {
      setErrorMsg('Project Name is required.');
      return;
    }

    if (form.end_date && new Date(form.end_date) < new Date(form.start_date)) {
      setErrorMsg('End Date must be on or after Start Date.');
      return;
    }

    try {
      await axios.post('/api/projects/', form);
      setShowModal(false);
      setForm({ 
        name: '', 
        description: '', 
        client_name: '', 
        start_date: new Date().toISOString().split('T')[0], 
        end_date: '', 
        status: 'In-Progress' 
      });
      fetchProjects();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to create project.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Project Assignment</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track company projects and employee assignments</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setErrorMsg(''); setShowModal(true); }}>
          <Plus size={16} /> Create Project
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {projects.map(proj => (
          <div key={proj.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#111827' }}>{proj.name}</h3>
                <span className="status-tag status-approved">{proj.status}</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: '1.4' }}>
                {proj.description || 'No description provided.'}
              </p>
            </div>
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <span>Client: <strong>{proj.client_name || 'Internal Tech Group'}</strong></span>
              <span>Started: {proj.start_date}</span>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
            No active projects found. Click "Create Project" to get started.
          </div>
        )}
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '480px', background: '#FFFFFF', border: '1px solid #CBD5E1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.3rem', color: '#111827' }}>Create New Project</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
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

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>Project Name *</label>
                <input type="text" placeholder="e.g. HRMS Agentic AI Platform" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>Client Name</label>
                <input type="text" placeholder="e.g. Enterprise Tech Group" value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>Start Date *</label>
                  <input type="date" required value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>Target End Date</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>Project Description</label>
                <textarea placeholder="Brief summary of project objectives and deliverables..." rows="3" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  style={{ width: '100%' }}
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

