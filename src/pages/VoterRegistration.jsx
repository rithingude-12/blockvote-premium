import React, { useState, useEffect } from 'react';
import WebcamCapture from '../components/WebcamCapture';
import { voterAPI, electionAPI } from '../services/api';
import { UserPlus, Save, CheckCircle } from 'lucide-react';

const VoterRegistration = () => {
    const [voterData, setVoterData] = useState({ voter_id: '', full_name: '', address: '', age: '', constituency_id: '' });
    const [faceImage, setFaceImage] = useState(null);
    const [fingerprintImage, setFingerprintImage] = useState(null);
    const [constituencies, setConstituencies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchConstituencies = async () => {
            try {
                const electionsRes = await electionAPI.getAll();
                const allConstituencies = [];
                for (const election of electionsRes.data) {
                    try {
                        const constRes = await electionAPI.getConstituencies(election.id);
                        const mapped = constRes.data.map(c => ({ ...c, electionName: election.name }));
                        allConstituencies.push(...mapped);
                    } catch (err) { console.error(`Failed constituencies for ${election.id}`, err); }
                }
                setConstituencies(allConstituencies);
            } catch (err) { console.error('Failed elections', err); }
        };
        fetchConstituencies();
    }, []);

    const handleCapture = (imgSrc) => setFaceImage(imgSrc);

    const handleFingerprintUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setFingerprintImage(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!faceImage) { setError('Please capture a face image first.'); return; }
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await voterAPI.register({ ...voterData, face_image_base64: faceImage, fingerprint_image_base64: fingerprintImage || null });
            setSuccess(`Voter ${voterData.full_name} successfully registered.`);
            setVoterData({ voter_id: '', full_name: '', address: '', age: '', constituency_id: '' });
            setFaceImage(null);
            setFingerprintImage(null);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to register voter.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-card animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <UserPlus size={28} color="var(--color-text-primary)" />
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '600' }}>Voter Registration Portal</h2>
            </div>

            {success && (
                <div style={{ background: 'rgba(16,185,129,0.08)', color: 'var(--color-success)', padding: '14px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(16,185,129,0.2)', fontSize: '14px' }}>
                    <CheckCircle size={18} /> {success}
                </div>
            )}
            {error && <div style={{ color: 'var(--color-danger)', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

            <div className="responsive-grid responsive-grid-1-1">
                {/* Biometric Capture */}
                <div>
                    <h3 style={{ marginBottom: '16px', fontSize: '15px', fontWeight: '600' }}>1. Biometric Capture</h3>
                    <div style={{ background: 'var(--color-secondary-bg)', border: '1px solid var(--color-border)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                        {faceImage ? (
                            <div>
                                <img src={faceImage} alt="Captured Face" style={{ width: '100%', borderRadius: '8px', marginBottom: '12px', border: '1px solid var(--color-border)' }} />
                                <button className="btn-secondary" onClick={() => setFaceImage(null)}>Recapture</button>
                            </div>
                        ) : (
                            <WebcamCapture onCapture={handleCapture} isScanning={false} />
                        )}

                        <div style={{ marginTop: '20px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
                            <h4 style={{ color: 'var(--color-text-primary)', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Fingerprint Fallback (Optional)</h4>
                            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                                Upload a fingerprint image for 2FA fallback casting.
                            </p>
                            <input type="file" accept="image/*" onChange={handleFingerprintUpload} className="input-glass" style={{ fontSize: '13px' }} />
                            {fingerprintImage && (
                                <p style={{ fontSize: '13px', color: 'var(--color-success)', marginTop: '8px' }}>✓ Fingerprint loaded</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Voter Details */}
                <div>
                    <h3 style={{ marginBottom: '16px', fontSize: '15px', fontWeight: '600' }}>2. Voter Details</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <input type="text" className="input-glass" placeholder="Unique Voter ID (e.g. V-12345)" value={voterData.voter_id} onChange={e => setVoterData({ ...voterData, voter_id: e.target.value })} required />
                        <input type="text" className="input-glass" placeholder="Full Legal Name" value={voterData.full_name} onChange={e => setVoterData({ ...voterData, full_name: e.target.value })} required />
                        <input type="number" className="input-glass" placeholder="Age" min="18" value={voterData.age} onChange={e => setVoterData({ ...voterData, age: e.target.value })} required />
                        <textarea className="input-glass" placeholder="Registered Address" rows="3" value={voterData.address} onChange={e => setVoterData({ ...voterData, address: e.target.value })} required />
                        <select className="input-glass" value={voterData.constituency_id} onChange={e => setVoterData({ ...voterData, constituency_id: e.target.value })} required>
                            <option value="">Select Constituency...</option>
                            {constituencies.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.code}) — {c.electionName}</option>
                            ))}
                        </select>
                        <button type="submit" className="btn-primary" disabled={loading || !faceImage} style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <Save size={16} />
                            {loading ? 'Registering...' : 'Securely Register Voter'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VoterRegistration;
