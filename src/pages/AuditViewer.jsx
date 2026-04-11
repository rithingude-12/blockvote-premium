import React, { useState, useEffect } from 'react';
import { electionAPI, candidateAPI } from '../services/api';
import { ArrowLeft, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CHART_COLORS = ['#0A0A0A', '#6B7280', '#9CA3AF', '#D1D5DB'];

const AuditViewer = ({ electionId, onBack }) => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                setLoading(true);
                const [resultsRes, candidatesRes] = await Promise.all([
                    electionAPI.getResults(electionId),
                    candidateAPI.getByElection(electionId)
                ]);
                const candidateMap = {};
                candidatesRes.data.forEach(c => { candidateMap[c.id] = c.name; });
                const mappedResults = resultsRes.data.map(r => ({
                    ...r,
                    candidate_name: candidateMap[r.candidate_id] || r.candidate_id
                }));
                setResults(mappedResults);
                setError(null);
            } catch (err) {
                setError('Failed to securely fetch election tallies.');
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [electionId]);

    const totalVotes = results.reduce((sum, item) => sum + item.vote_count, 0);

    return (
        <div className="animate-fade-in" style={{ padding: '0' }}>
            <button className="btn-secondary" onClick={onBack} style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowLeft size={16} /> Return to Elections
            </button>

            <div className="glass-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <BarChart2 size={28} color="var(--color-text-primary)" />
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '600' }}>Decentralized Tally Analytics</h2>
                </div>

                {error && <div style={{ color: 'var(--color-danger)', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Decrypting network ledgers...</div>
                ) : results.length === 0 ? (
                    <div style={{ padding: '64px', textAlign: 'center', background: 'var(--color-secondary-bg)', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
                        <p style={{ color: 'var(--color-text-secondary)' }}>No votes have been registered yet.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ padding: '24px', background: 'var(--color-secondary-bg)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                            <h4 style={{ color: 'var(--color-text-secondary)', marginBottom: '8px', fontWeight: '500', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Verified Participants</h4>
                            <p style={{ fontSize: '36px', fontWeight: '700', margin: 0, letterSpacing: '-0.02em' }}>{totalVotes}</p>
                        </div>

                        <div style={{ width: '100%', height: 360, padding: '8px 0', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-secondary-bg)' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={results.map(r => ({ name: r.candidate_name, votes: r.vote_count })).sort((a, b) => b.votes - a.votes)}
                                    layout="vertical"
                                    margin={{ top: 16, right: 32, left: 48, bottom: 16 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                                    <XAxis type="number" stroke="var(--color-border)" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis dataKey="name" type="category" width={110} stroke="var(--color-border)" tick={{ fill: 'var(--color-text-primary)', fontSize: 13 }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', color: 'var(--color-text-primary)' }}
                                        itemStyle={{ color: 'var(--color-text-primary)', fontWeight: '600' }}
                                        cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                                        formatter={(value) => [`${value} votes`, 'Tally']}
                                    />
                                    <Bar dataKey="votes" radius={[0, 4, 4, 0]} animationDuration={1200}>
                                        {results.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Stats table */}
                        <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Candidate</th>
                                        <th>Votes</th>
                                        <th>Share</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.sort((a, b) => b.vote_count - a.vote_count).map((r, i) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: i === 0 ? '600' : '400' }}>{r.candidate_name}</td>
                                            <td>{r.vote_count.toLocaleString()}</td>
                                            <td style={{ color: 'var(--color-text-secondary)' }}>
                                                {totalVotes > 0 ? ((r.vote_count / totalVotes) * 100).toFixed(1) : 0}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditViewer;
