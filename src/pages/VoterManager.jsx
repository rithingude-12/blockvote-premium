import React, { useState, useEffect } from 'react';
import { voterAPI } from '../services/api';
import VoterRegistration from './VoterRegistration';
import { Trash2, Edit, Plus, X, Users } from 'lucide-react';

const VoterManager = () => {
    const [voters, setVoters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showRegistration, setShowRegistration] = useState(false);
    const [editingVoter, setEditingVoter] = useState(null);
    const [editFormData, setEditFormData] = useState({ full_name: '', address: '', age: '', constituency_id: '' });

    const loadVoters = async () => {
        try {
            setLoading(true);
            const res = await voterAPI.getAll();
            setVoters(res.data);
            setError(null);
        } catch (err) {
            setError('Failed to load voters: ' + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadVoters(); }, [showRegistration]);

    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to erase voter: ${name}?`)) {
            try {
                await voterAPI.delete(id);
                setVoters(voters.filter(v => v.id !== id));
            } catch (err) {
                alert('Failed to delete: ' + (err.response?.data?.detail || err.message));
            }
        }
    };

    const startEdit = (voter) => {
        setEditingVoter(voter);
        setEditFormData({ full_name: voter.full_name, address: voter.address || '', age: voter.age, constituency_id: voter.constituency_id });
    };

    const handleEditChange = (e) => setEditFormData({ ...editFormData, [e.target.name]: e.target.value });

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await voterAPI.update(editingVoter.id, editFormData);
            setVoters(voters.map(v => v.id === editingVoter.id ? res.data : v));
            setEditingVoter(null);
        } catch (err) {
            alert('Failed to update: ' + (err.response?.data?.detail || err.message));
        }
    };

    if (showRegistration) {
        return (
            <div className="animate-fade-in">
                <button className="btn-secondary" onClick={() => setShowRegistration(false)} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <X size={16} /> Back to Directory
                </button>
                <VoterRegistration />
            </div>
        );
    }

    return (
        <div className="glass-card animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Users size={24} color="var(--color-text-primary)" />
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '600' }}>Voter Directory</h2>
                </div>
                <button className="btn-primary" onClick={() => setShowRegistration(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={16} /> Register Voter
                </button>
            </div>

            {error && <div style={{ color: 'var(--color-danger)', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>Loading records...</div>
            ) : voters.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', background: 'var(--color-secondary-bg)', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
                    <p style={{ color: 'var(--color-text-secondary)' }}>No voters registered yet.</p>
                </div>
            ) : (
                <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Voter ID</th>
                                <th>Full Name</th>
                                <th>Age</th>
                                <th>Constituency</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {voters.map(voter => (
                                <tr key={voter.id}>
                                    <td style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: '500' }}>{voter.voter_id}</td>
                                    <td style={{ fontWeight: '500' }}>{voter.full_name}</td>
                                    <td>{voter.age}</td>
                                    <td style={{ color: 'var(--color-text-secondary)' }}>{voter.constituency_id}</td>
                                    <td>
                                        {voter.has_voted ? (
                                            <span style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '600', border: '1px solid rgba(16,185,129,0.2)' }}>Voted</span>
                                        ) : (
                                            <span style={{ background: 'var(--color-secondary-bg)', color: 'var(--color-text-secondary)', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', border: '1px solid var(--color-border)' }}>Pending</span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button className="btn-secondary" style={{ padding: '6px' }} onClick={() => startEdit(voter)} title="Edit">
                                                <Edit size={14} />
                                            </button>
                                            <button className="btn-secondary" style={{ padding: '6px', color: 'var(--color-danger)', borderColor: 'rgba(239,68,68,0.3)' }} onClick={() => handleDelete(voter.id, voter.full_name)} title="Delete">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit Modal */}
            {editingVoter && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                    <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
                        <h3 style={{ marginBottom: '4px', fontWeight: '600' }}>Edit Voter</h3>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>ID: {editingVoter.voter_id}</p>

                        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Full Name</label>
                                <input type="text" name="full_name" value={editFormData.full_name} onChange={handleEditChange} className="input-glass" required />
                            </div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Age</label>
                                    <input type="number" name="age" value={editFormData.age} onChange={handleEditChange} className="input-glass" required />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Constituency ID</label>
                                    <input type="text" name="constituency_id" value={editFormData.constituency_id} onChange={handleEditChange} className="input-glass" required />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Address</label>
                                <input type="text" name="address" value={editFormData.address} onChange={handleEditChange} className="input-glass" />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn-secondary" onClick={() => setEditingVoter(null)}>Cancel</button>
                                <button type="submit" className="btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VoterManager;
