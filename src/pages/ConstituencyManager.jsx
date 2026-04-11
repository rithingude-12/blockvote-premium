import React, { useState, useEffect, useCallback } from 'react';
import { electionAPI, candidateAPI } from '../services/api';
import { Plus, ArrowLeft, Users, MapPin } from 'lucide-react';

const ConstituencyManager = ({ electionId, onBack }) => {
    const [constituencies, setConstituencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedConstituency, setSelectedConstituency] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [loadingCandidates, setLoadingCandidates] = useState(false);
    const [newConstituency, setNewConstituency] = useState({ name: '', code: '' });
    const [newCandidate, setNewCandidate] = useState({ name: '', party: '', bio: '' });

    const loadConstituencies = useCallback(async () => {
        try {
            setLoading(true);
            const res = await electionAPI.getConstituencies(electionId);
            setConstituencies(res.data);
            setError(null);
        } catch (err) {
            setError('Failed to load constituencies.');
        } finally {
            setLoading(false);
        }
    }, [electionId]);

    useEffect(() => { loadConstituencies(); }, [loadConstituencies]);

    const handleCreateConstituency = async (e) => {
        e.preventDefault();
        try {
            const res = await electionAPI.createConstituency({ ...newConstituency, election_id: electionId });
            setConstituencies([...constituencies, res.data]);
            setNewConstituency({ name: '', code: '' });
        } catch (err) {
            alert('Failed to add constituency: ' + (err.response?.data?.detail || err.message));
        }
    };

    const loadCandidates = async (constituencyId) => {
        setSelectedConstituency(constituencyId);
        try {
            setLoadingCandidates(true);
            const res = await candidateAPI.getByConstituency(constituencyId);
            setCandidates(res.data);
        } catch (err) {
            setCandidates([]);
        } finally {
            setLoadingCandidates(false);
        }
    };

    const handleCreateCandidate = async (e) => {
        e.preventDefault();
        try {
            const res = await candidateAPI.create({ ...newCandidate, election_id: electionId, constituency_id: selectedConstituency });
            setCandidates([...candidates, res.data]);
            setNewCandidate({ name: '', party: '', bio: '' });
        } catch (err) {
            alert('Failed to add candidate: ' + (err.response?.data?.detail || err.message));
        }
    };

    return (
        <div className="animate-fade-in" style={{ padding: '0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <button className="btn-secondary" onClick={onBack} style={{ padding: '8px' }}>
                    <ArrowLeft size={18} />
                </button>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '600' }}>Constituencies &amp; Candidates</h2>
            </div>

            {error && <div style={{ color: 'var(--color-danger)', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

            <div className="responsive-grid responsive-grid-1-1">
                {/* Constituencies Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="glass-card">
                        <h3 style={{ marginBottom: '16px', fontWeight: '600', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MapPin size={18} color="var(--color-text-primary)" /> Add Constituency
                        </h3>
                        <form onSubmit={handleCreateConstituency} style={{ display: 'flex', gap: '8px' }}>
                            <input type="text" placeholder="Name (e.g. North District)" className="input-glass" style={{ flex: 2 }} value={newConstituency.name} onChange={e => setNewConstituency({ ...newConstituency, name: e.target.value })} required />
                            <input type="text" placeholder="Code (ND01)" className="input-glass" style={{ flex: 1 }} value={newConstituency.code} onChange={e => setNewConstituency({ ...newConstituency, code: e.target.value })} required />
                            <button type="submit" className="btn-primary" style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                                <Plus size={16} /> Add
                            </button>
                        </form>
                    </div>

                    <div className="glass-card">
                        <h3 style={{ marginBottom: '16px', fontWeight: '600', fontSize: '15px' }}>Constituency List</h3>
                        {loading ? (
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Loading...</p>
                        ) : constituencies.length === 0 ? (
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>No constituencies added yet.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {constituencies.map(c => (
                                    <div
                                        key={c.id}
                                        onClick={() => loadCandidates(c.id)}
                                        style={{
                                            padding: '14px 16px',
                                            background: selectedConstituency === c.id ? 'var(--color-secondary-bg)' : 'var(--color-surface)',
                                            border: `1px solid ${selectedConstituency === c.id ? 'var(--color-text-primary)' : 'var(--color-border)'}`,
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <span style={{ fontWeight: '500', fontSize: '14px' }}>{c.name}</span>
                                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px', background: 'var(--color-secondary-bg)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>{c.code}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Candidates Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {selectedConstituency ? (
                        <>
                            <div className="glass-card">
                                <h3 style={{ marginBottom: '16px', fontWeight: '600', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Users size={18} color="var(--color-text-primary)" /> Add Candidate
                                </h3>
                                <form onSubmit={handleCreateCandidate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <input type="text" placeholder="Full Name" className="input-glass" value={newCandidate.name} onChange={e => setNewCandidate({ ...newCandidate, name: e.target.value })} required />
                                    <input type="text" placeholder="Party (optional)" className="input-glass" value={newCandidate.party} onChange={e => setNewCandidate({ ...newCandidate, party: e.target.value })} />
                                    <textarea placeholder="Bio (optional)" className="input-glass" rows="2" value={newCandidate.bio} onChange={e => setNewCandidate({ ...newCandidate, bio: e.target.value })} />
                                    <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Plus size={16} /> Add Candidate
                                    </button>
                                </form>
                            </div>

                            <div className="glass-card">
                                <h3 style={{ marginBottom: '16px', fontWeight: '600', fontSize: '15px' }}>Candidate List</h3>
                                {loadingCandidates ? (
                                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Loading candidates...</p>
                                ) : candidates.length === 0 ? (
                                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>No candidates in this constituency yet.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {candidates.map(cand => (
                                            <div key={cand.id} style={{ padding: '16px', background: 'var(--color-secondary-bg)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: cand.bio ? '8px' : 0 }}>
                                                    <strong style={{ fontSize: '14px' }}>{cand.name}</strong>
                                                    {cand.party && <span style={{ padding: '2px 8px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>{cand.party}</span>}
                                                </div>
                                                {cand.bio && <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>{cand.bio}</p>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Select a constituency to manage its candidates.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConstituencyManager;
