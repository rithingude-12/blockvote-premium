import React, { useState } from 'react';
import WebcamCapture from '../components/WebcamCapture';
import { votingAPI, candidateAPI } from '../services/api';
import { Fingerprint, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';

const Step = ({ n, label, active, done }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
            width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: '700',
            background: done ? 'var(--color-text-primary)' : active ? 'var(--color-text-primary)' : 'transparent',
            color: done || active ? '#fff' : 'var(--color-text-tertiary)',
            border: done || active ? 'none' : '1.5px solid var(--color-border)',
            transition: 'all 0.2s ease',
        }}>{done ? '✓' : n}</div>
        <span style={{ fontSize: '12.5px', fontWeight: active ? '600' : '400', color: active ? 'var(--color-text-primary)' : done ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)' }}>{label}</span>
    </div>
);

const PollingBooth = () => {
    const [step, setStep] = useState(1);
    const [authMethod, setAuthMethod] = useState('face');
    const [isScanning, setIsScanning] = useState(false);
    const [authData, setAuthData] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [receipt, setReceipt] = useState(null);
    const [fingerprintBase64, setFingerprintBase64] = useState(null);
    const [manualVoterId, setManualVoterId] = useState('');

    const handleFaceCapture = async (imageSrc) => {
        setIsScanning(true); setError(null);
        try {
            const res = await votingAPI.authenticateFace({ face_image_base64: imageSrc, polling_station: "Web Client" });
            setAuthData(res.data); setStep(3);
        } catch (err) { setError(err.response?.data?.detail || "Face not recognised. Please try again."); }
        finally { setIsScanning(false); }
    };

    const handleFingerprintAuth = async () => {
        if (!manualVoterId || !fingerprintBase64) { setError("Both Voter ID and fingerprint are required."); return; }
        setIsScanning(true); setError(null);
        try {
            const res = await votingAPI.authenticateFingerprint({ voter_id: manualVoterId, fingerprint_image_base64: fingerprintBase64, polling_station: "Web Client" });
            setAuthData(res.data); setStep(3);
        } catch (err) { setError(err.response?.data?.detail || "Authentication failed."); }
        finally { setIsScanning(false); }
    };

    const handleFingerprintUpload = (e) => {
        const file = e.target.files[0];
        if (file) { const r = new FileReader(); r.onloadend = () => setFingerprintBase64(r.result); r.readAsDataURL(file); }
    };

    const confirmIdentity = async () => {
        try { const res = await candidateAPI.getByConstituency(authData.voter_details.constituency_id); setCandidates(res.data); setStep(4); }
        catch { setError("Failed to load candidates. Please try again."); }
    };

    const castVote = async () => {
        if (!selectedCandidate) return;
        setIsSubmitting(true); setError(null);
        try {
            const res = await votingAPI.castVote({ voter_id: authData.voter_details.id, election_id: selectedCandidate.election_id, candidate_id: selectedCandidate.id, constituency_id: authData.voter_details.constituency_id, session_id: authData.session_id });
            setReceipt(res.data.transaction_hash); setStep(5);
        } catch (err) { setError(err.response?.data?.detail || "Failed to cast vote."); }
        finally { setIsSubmitting(false); }
    };

    const steps = [
        { n: 1, label: 'Welcome' },
        { n: 2, label: 'Authenticate' },
        { n: 3, label: 'Confirm' },
        { n: 4, label: 'Vote' },
        { n: 5, label: 'Complete' },
    ];

    return (
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            {/* Progress strip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '4px' }}>
                {steps.map((s, i) => (
                    <React.Fragment key={s.n}>
                        <Step n={s.n} label={s.label} active={step === s.n} done={step > s.n} />
                        {i < steps.length - 1 && <div style={{ flex: 1, height: '1px', background: step > s.n ? 'var(--color-text-primary)' : 'var(--color-border)', minWidth: '16px', transition: 'background 0.3s ease' }} />}
                    </React.Fragment>
                ))}
            </div>

            {/* Card */}
            <div className="glass-card animate-fade-in" style={{ padding: '40px', textAlign: 'center' }}>

                {/* STEP 1 */}
                {step === 1 && (
                    <div>
                        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--color-secondary-bg)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <Fingerprint size={36} color="var(--color-text-primary)" />
                        </div>
                        <h2 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '10px' }}>Welcome to BlockVote</h2>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '36px', maxWidth: '420px', margin: '0 auto 36px', lineHeight: '1.7' }}>
                            Secure, anonymous, and immutable blockchain voting with biometric identity verification.
                        </p>
                        <button className="btn-primary" onClick={() => setStep(2)} style={{ padding: '13px 32px', fontSize: '15px', gap: '8px' }}>
                            Begin Authentication <ArrowRight size={15} />
                        </button>
                    </div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                    <div>
                        <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>Identity Verification</h2>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', fontSize: '14px' }}>Choose your authentication method</p>

                        <div style={{ display: 'inline-flex', background: 'var(--color-secondary-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '4px', gap: '4px', marginBottom: '28px' }}>
                            {['face', 'fingerprint'].map(m => (
                                <button key={m} onClick={() => { setAuthMethod(m); setError(null); }} style={{
                                    padding: '8px 18px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: '500',
                                    background: authMethod === m ? 'var(--color-surface)' : 'transparent',
                                    border: authMethod === m ? '1px solid var(--color-border)' : '1px solid transparent',
                                    boxShadow: authMethod === m ? 'var(--shadow-xs)' : 'none',
                                    color: 'var(--color-text-primary)', cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                }}>
                                    {m === 'face' ? '1:N Facial Scan' : '2FA Fingerprint'}
                                </button>
                            ))}
                        </div>

                        {authMethod === 'face' ? (
                            <WebcamCapture onCapture={handleFaceCapture} isScanning={isScanning} />
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '380px', margin: '0 auto', textAlign: 'left' }}>
                                <div>
                                    <label className="apple-label">National Voter ID</label>
                                    <input type="text" placeholder="e.g. V-12345" className="input-glass" value={manualVoterId} onChange={e => setManualVoterId(e.target.value)} />
                                </div>
                                <div>
                                    <label className="apple-label">Fingerprint Image</label>
                                    <input type="file" accept="image/*" className="input-glass" onChange={handleFingerprintUpload} />
                                    {fingerprintBase64 && <p style={{ color: 'var(--color-success)', fontSize: '12px', marginTop: '5px' }}>✓ Template loaded</p>}
                                </div>
                                <button className="btn-primary" onClick={handleFingerprintAuth} disabled={isScanning || !fingerprintBase64 || !manualVoterId} style={{ width: '100%', marginTop: '4px' }}>
                                    {isScanning ? 'Verifying...' : 'Authenticate'}
                                </button>
                            </div>
                        )}

                        {error && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', marginTop: '16px', color: 'var(--color-danger)', fontSize: '13px' }}>
                                <ShieldAlert size={15} /> {error}
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 3 */}
                {step === 3 && authData && (
                    <div>
                        <CheckCircle2 size={52} color="var(--color-success)" style={{ marginBottom: '16px' }} />
                        <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>Identity Confirmed</h2>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '28px', fontSize: '14px' }}>Please verify the details below before proceeding</p>

                        <div style={{ background: 'var(--color-secondary-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '20px', textAlign: 'left', marginBottom: '28px', maxWidth: '380px', margin: '0 auto 28px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Full Name</span>
                                <span style={{ fontSize: '13px', fontWeight: '600' }}>{authData.voter_details.full_name}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Blockchain ID</span>
                                <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>{authData.voter_details.blockchain_voter_id?.substring(0, 18)}...</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button className="btn-secondary" onClick={() => setStep(1)}>Not you?</button>
                            <button className="btn-primary" onClick={confirmIdentity} style={{ gap: '7px' }}>Confirm &amp; View Ballot <ArrowRight size={14} /></button>
                        </div>
                    </div>
                )}

                {/* STEP 4 */}
                {step === 4 && (
                    <div style={{ textAlign: 'left' }}>
                        <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px', textAlign: 'center' }}>Official Ballot</h2>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '24px', textAlign: 'center' }}>Select one candidate. Votes are immutable once cast on the blockchain.</p>

                        {error && <p style={{ color: 'var(--color-danger)', fontSize: '13px', marginBottom: '14px', textAlign: 'center' }}>{error}</p>}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                            {candidates.map(c => {
                                const selected = selectedCandidate?.id === c.id;
                                return (
                                    <label key={c.id} htmlFor={`cand-${c.id}`} style={{
                                        display: 'flex', alignItems: 'center', gap: '14px', padding: '18px 20px',
                                        border: `1.5px solid ${selected ? 'var(--color-text-primary)' : 'var(--color-border)'}`,
                                        borderRadius: 'var(--radius-md)',
                                        background: selected ? 'var(--color-secondary-bg)' : 'var(--color-surface)',
                                        cursor: 'pointer', transition: 'all 0.15s ease',
                                    }}>
                                        <input id={`cand-${c.id}`} type="radio" name="candidate" onChange={() => setSelectedCandidate(c)} checked={selected} style={{ width: '16px', height: '16px', accentColor: 'var(--color-text-primary)' }} />
                                        <div>
                                            <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '2px' }}>{c.name}</div>
                                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '12.5px' }}>{c.party}</div>
                                            {c.bio && <div style={{ color: 'var(--color-text-tertiary)', fontSize: '12px', marginTop: '4px' }}>{c.bio}</div>}
                                        </div>
                                    </label>
                                );
                            })}
                            {candidates.length === 0 && <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '24px', fontSize: '14px' }}>No candidates available for your constituency.</p>}
                        </div>

                        <button className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '15px' }} onClick={castVote} disabled={!selectedCandidate || isSubmitting}>
                            {isSubmitting ? 'Recording on Blockchain...' : 'Cast Vote Securely'}
                        </button>
                    </div>
                )}

                {/* STEP 5 */}
                {step === 5 && (
                    <div>
                        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <CheckCircle2 size={40} color="var(--color-success)" />
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Vote Recorded</h2>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '28px', fontSize: '14px', maxWidth: '380px', margin: '0 auto 28px' }}>
                            Your anonymous vote has been immutably written to the Ethereum network.
                        </p>

                        <div style={{ background: 'var(--color-secondary-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '16px', textAlign: 'left', marginBottom: '28px' }}>
                            <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Transaction Hash</p>
                            <p style={{ fontFamily: 'monospace', fontSize: '11.5px', color: 'var(--color-text-primary)', wordBreak: 'break-all', lineHeight: '1.6' }}>{receipt}</p>
                        </div>

                        <button className="btn-secondary" onClick={() => window.location.reload()}>Done</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PollingBooth;
