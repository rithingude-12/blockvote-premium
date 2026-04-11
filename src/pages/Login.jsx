import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Shield, Lock, AlertCircle, Loader2 } from 'lucide-react';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';

const SLOW_THRESHOLD_MS = 4000; // Show "warming up" message after 4 seconds

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSlowServer, setIsSlowServer] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const navigate = useNavigate();
    const timerRef = useRef(null);
    const slowTimerRef = useRef(null);

    // Clean up timers on unmount
    useEffect(() => {
        return () => {
            clearInterval(timerRef.current);
            clearTimeout(slowTimerRef.current);
        };
    }, []);

    const startTimers = () => {
        setElapsed(0);
        setIsSlowServer(false);

        // Elapsed seconds counter
        timerRef.current = setInterval(() => {
            setElapsed(prev => prev + 1);
        }, 1000);

        // Trigger "warming up" message after 4 seconds
        slowTimerRef.current = setTimeout(() => {
            setIsSlowServer(true);
        }, SLOW_THRESHOLD_MS);
    };

    const stopTimers = () => {
        clearInterval(timerRef.current);
        clearTimeout(slowTimerRef.current);
        setIsSlowServer(false);
        setElapsed(0);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        startTimers();

        try {
            const res = await authAPI.login({ username, password });
            localStorage.setItem('token', res.data.access_token);
            navigate('/admin/dashboard');
        } catch (err) {
            if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
                setError('The server is still warming up. Please wait 30–60 seconds and try again.');
            } else if (err.response?.status === 401) {
                setError('Invalid credentials. Please check your username and password.');
            } else if (!err.response) {
                setError('Cannot reach the server. Please check your internet connection and try again.');
            } else {
                setError(err.response?.data?.detail || 'Authentication failed. Please try again.');
            }
        } finally {
            setLoading(false);
            stopTimers();
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <Card style={{ width: '400px', padding: '40px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                    <Shield size={48} color="var(--color-text-primary)" />
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>Admin Portal</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '32px' }}>
                    Secure access to the BlockVote control centre.
                </p>

                {/* Error Banner */}
                {error && (
                    <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                        background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: '8px', padding: '12px 14px', marginBottom: '20px', textAlign: 'left'
                    }}>
                        <AlertCircle size={16} color="#EF4444" style={{ flexShrink: 0, marginTop: '1px' }} />
                        <span style={{ fontSize: '13px', color: '#EF4444', lineHeight: '1.5' }}>{error}</span>
                    </div>
                )}

                {/* Server warming banner — only shown when request is slow */}
                {isSlowServer && loading && (
                    <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                        background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
                        borderRadius: '8px', padding: '12px 14px', marginBottom: '20px', textAlign: 'left'
                    }}>
                        <Loader2 size={16} color="#F59E0B" style={{ flexShrink: 0, marginTop: '1px', animation: 'spin 1s linear infinite' }} />
                        <div>
                            <p style={{ fontSize: '13px', color: '#B45309', fontWeight: '600', margin: '0 0 2px' }}>Server is warming up ({elapsed}s)</p>
                            <p style={{ fontSize: '12px', color: '#92400E', margin: 0, lineHeight: '1.5' }}>
                                The backend starts from sleep on first use. This takes up to 60 seconds — please wait.
                            </p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <Input
                        label="Username"
                        type="text"
                        placeholder="Admin username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                        disabled={loading}
                    />
                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={loading}
                        style={{ width: '100%', marginTop: '16px', padding: '13px', fontSize: '15px', opacity: loading ? 0.8 : 1 }}
                    >
                        <Lock size={15} />
                        {loading
                            ? elapsed > 0 ? `Authenticating... (${elapsed}s)` : 'Authenticating...'
                            : 'Secure Login'}
                    </Button>
                </form>

                <p style={{ marginTop: '24px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    First login of the day may take up to 60 seconds to connect.
                </p>
            </Card>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default Login;
