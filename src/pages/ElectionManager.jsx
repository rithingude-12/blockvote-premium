import React, { useState } from 'react';
import { electionAPI } from '../services/api';
import { Vote, Plus, Settings, PlayCircle, StopCircle, Edit, Trash2, PieChart } from 'lucide-react';
import AuditViewer from './AuditViewer';
import ConstituencyManager from './ConstituencyManager';

const statusConfig = {
    active:     { label: 'Active',     bg: 'rgba(16,185,129,0.10)',  color: '#059669', border: 'rgba(16,185,129,0.25)' },
    ended:      { label: 'Ended',      bg: 'rgba(107,114,128,0.08)', color: '#6B7280', border: 'var(--color-border)' },
    draft:      { label: 'Draft',      bg: 'rgba(245,158,11,0.10)',  color: '#D97706', border: 'rgba(245,158,11,0.25)' },
    configured: { label: 'Configured', bg: 'rgba(245,158,11,0.10)',  color: '#D97706', border: 'rgba(245,158,11,0.25)' },
};

const StatusBadge = ({ status }) => {
    const s = statusConfig[status] || statusConfig.draft;
    return (
        <span style={{
            padding: '3px 10px', borderRadius: '5px',
            fontSize: '11px', fontWeight: '600',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            background: s.bg, color: s.color, border: `1px solid ${s.border}`,
        }}>{s.label}</span>
    );
};

const ElectionManager = () => {
    const [elections, setElections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newElection, setNewElection] = useState({ name: '', description: '' });
    const [editingElection, setEditingElection] = useState(null);
    const [editFormData, setEditFormData] = useState({ name: '', description: '' });
    const [viewingResults, setViewingResults] = useState(null);
    const [managingElection, setManagingElection] = useState(null);

    React.useEffect(() => { loadElections(); }, []);

    const loadElections = async () => {
        try {
            setLoading(true);
            const res = await electionAPI.getAll();
            setElections(res.data);
            setError(null);
        } catch { setError('Failed to load elections.'); }
        finally { setLoading(false); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await electionAPI.create(newElection);
            setElections(prev => [...prev, res.data]);
            setNewElection({ name: '', description: '' });
        } catch (err) { alert('Failed to create: ' + (err.response?.data?.detail || err.message)); }
    };

    const toggleStatus = async (id, status) => {
        try {
            if (status === 'draft' || status === 'configured') {
                await electionAPI.start(id);
                setElections(prev => prev.map(e => e.id === id ? { ...e, status: 'active' } : e));
            } else if (status === 'active') {
                await electionAPI.close(id);
                setElections(prev => prev.map(e => e.id === id ? { ...e, status: 'ended' } : e));
            }
        } catch (err) { alert('Status update failed: ' + (err.response?.data?.detail || err.message)); }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
        try {
            await electionAPI.delete(id);
            setElections(prev => prev.filter(e => e.id !== id));
        } catch (err) { alert('Failed: ' + (err.response?.data?.detail || err.message)); }
    };

    const startEdit = (el) => { setEditingElection(el); setEditFormData({ name: el.name, description: el.description || '' }); };
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await electionAPI.update(editingElection.id, editFormData);
            setElections(prev => prev.map(el => el.id === editingElection.id ? res.data : el));
            setEditingElection(null);
        } catch (err) { alert('Failed: ' + (err.response?.data?.detail || err.message)); }
    };

    if (viewingResults) return <AuditViewer electionId={viewingResults} onBack={() => setViewingResults(null)} />;
    if (managingElection) return <ConstituencyManager electionId={managingElection} onBack={() => setManagingElection(null)} />;

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <div style={{ width: '40px', height: '40px', background: 'var(--color-secondary-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Vote size={20} color="var(--color-text-primary)" />
                </div>
                <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '1px' }}>Election Management</h2>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Create and manage blockchain elections</p>
                </div>
            </div>

            {error && <div style={{ color: 'var(--color-danger)', marginBottom: '16px', fontSize: '13px', padding: '10px 14px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 'var(--radius-sm)' }}>{error}</div>}

            <div className="responsive-grid responsive-grid-2-1" style={{ alignItems: 'start' }}>
                {/* Elections list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>All Elections</p>

                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>Loading...</div>
                    ) : elections.length === 0 ? (
                        <div style={{ padding: '48px', textAlign: 'center', background: 'var(--color-secondary-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                            <Vote size={28} color="var(--color-text-tertiary)" style={{ marginBottom: '12px' }} />
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>No elections yet. Create one to get started.</p>
                        </div>
                    ) : elections.map(el => (
                        <div key={el.id} className="glass-card" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <div style={{ flex: 1, paddingRight: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px', flexWrap: 'wrap' }}>
                                        <h4 style={{ fontSize: '15px', fontWeight: '600' }}>{el.name}</h4>
                                        <StatusBadge status={el.status} />
                                    </div>
                                    {el.description && <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', lineHeight: '1.5' }}>{el.description}</p>}
                                </div>
                                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                    <button className="btn-secondary" style={{ padding: '6px 8px' }} onClick={() => startEdit(el)} title="Edit"><Edit size={13} /></button>
                                    <button className="btn-secondary" style={{ padding: '6px 8px', color: 'var(--color-danger)', borderColor: 'rgba(239,68,68,0.25)' }} onClick={() => handleDelete(el.id, el.name)} title="Delete"><Trash2 size={13} /></button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '14px', borderTop: '1px solid var(--color-border)' }}>
                                {(el.status === 'draft' || el.status === 'configured') && (
                                    <button className="btn-primary" onClick={() => toggleStatus(el.id, el.status)} style={{ padding: '7px 14px', fontSize: '12.5px', gap: '6px', background: 'var(--color-success)' }}>
                                        <PlayCircle size={13} /> Start
                                    </button>
                                )}
                                {el.status === 'active' && (
                                    <button className="btn-secondary" onClick={() => toggleStatus(el.id, el.status)} style={{ padding: '7px 14px', fontSize: '12.5px', gap: '6px', color: 'var(--color-danger)', borderColor: 'rgba(239,68,68,0.25)' }}>
                                        <StopCircle size={13} /> Close
                                    </button>
                                )}
                                <button className="btn-secondary" onClick={() => setViewingResults(el.id)} style={{ padding: '7px 14px', fontSize: '12.5px', gap: '6px' }}>
                                    <PieChart size={13} /> Results
                                </button>
                                <button className="btn-secondary" onClick={() => setManagingElection(el.id)} style={{ padding: '7px 14px', fontSize: '12.5px', gap: '6px' }}>
                                    <Settings size={13} /> Configure
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Create form */}
                <div>
                    <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>New Election</p>
                    <div className="glass-card">
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label className="apple-label">Election Name</label>
                                <input type="text" className="input-glass" placeholder="e.g. 2026 Presidential Election" value={newElection.name} onChange={e => setNewElection(p => ({ ...p, name: e.target.value }))} required />
                            </div>
                            <div>
                                <label className="apple-label">Description</label>
                                <textarea className="input-glass" placeholder="Brief description..." rows="4" value={newElection.description} onChange={e => setNewElection(p => ({ ...p, description: e.target.value }))} />
                            </div>
                            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '11px', gap: '7px' }}>
                                <Plus size={15} /> Create Election
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Edit modal */}
            {editingElection && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', padding: '24px' }}>
                    <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '460px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>Edit Election</h3>
                        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label className="apple-label">Name</label>
                                <input type="text" className="input-glass" value={editFormData.name} onChange={e => setEditFormData(p => ({ ...p, name: e.target.value }))} required />
                            </div>
                            <div>
                                <label className="apple-label">Description</label>
                                <textarea rows="4" className="input-glass" value={editFormData.description} onChange={e => setEditFormData(p => ({ ...p, description: e.target.value }))} />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                                <button type="button" className="btn-secondary" onClick={() => setEditingElection(null)}>Cancel</button>
                                <button type="submit" className="btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ElectionManager;
