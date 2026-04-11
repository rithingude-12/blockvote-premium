import React, { useEffect, useState } from 'react';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import ElectionManager from './ElectionManager';
import VoterManager from './VoterManager';
import { Users, Vote, LogOut, LayoutDashboard } from 'lucide-react';

const AdminDashboard = () => {
    const [admin, setAdmin] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        authAPI.getMe()
            .then(res => setAdmin(res.data))
            .catch(() => { localStorage.removeItem('token'); navigate('/admin/login'); });
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/admin/login');
    };

    if (!admin) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: '32px', height: '32px', border: '2px solid var(--color-border)', borderTop: '2px solid var(--color-text-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Loading dashboard...</p>
            </div>
        </div>
    );

    const navItems = [
        { to: '/admin/dashboard/elections', icon: Vote, label: 'Elections' },
        { to: '/admin/dashboard/voters',    icon: Users, label: 'Voters' },
    ];

    return (
        <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start', minHeight: 'calc(100vh - 170px)' }}>

            {/* ── SIDEBAR ── */}
            <aside style={{
                width: '210px',
                flexShrink: 0,
                position: 'sticky',
                top: '80px',
                background: 'var(--color-secondary-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
            }}>
                {/* Identity */}
                <div style={{ padding: '10px 10px 16px', borderBottom: '1px solid var(--color-border)', marginBottom: '8px' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: 'var(--color-text-primary)',
                        color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '14px', fontWeight: '700',
                        marginBottom: '10px', letterSpacing: '-0.02em'
                    }}>
                        {admin.username?.charAt(0).toUpperCase()}
                    </div>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '2px' }}>
                        {admin.username}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Administrator
                    </p>
                </div>

                {/* Nav items */}
                {navItems.map(({ to, icon: Icon, label }) => {
                    const active = location.pathname.startsWith(to);
                    return (
                        <Link key={to} to={to} style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '13.5px',
                            fontWeight: active ? '600' : '450',
                            color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                            background: active ? 'var(--color-surface)' : 'transparent',
                            border: active ? '1px solid var(--color-border)' : '1px solid transparent',
                            boxShadow: active ? 'var(--shadow-xs)' : 'none',
                            transition: 'all 0.15s ease',
                            textDecoration: 'none',
                        }}>
                            <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
                            {label}
                        </Link>
                    );
                })}

                {/* Spacer */}
                <div style={{ flex: 1 }} />

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    style={{
                        marginTop: '16px',
                        display: 'flex', alignItems: 'center', gap: '9px',
                        padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                        fontSize: '13px', fontWeight: '500',
                        color: 'var(--color-danger)',
                        background: 'transparent',
                        border: '1px solid rgba(239,68,68,0.2)',
                        cursor: 'pointer', width: '100%',
                        transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                    <LogOut size={14} /> Log out
                </button>
            </aside>

            {/* ── MAIN ── */}
            <main style={{ flex: 1, minWidth: 0 }}>
                <Routes>
                    <Route path="elections" element={<ElectionManager />} />
                    <Route path="voters"    element={<VoterManager />} />
                    <Route path="*"         element={<ElectionManager />} />
                </Routes>
            </main>
        </div>
    );
};

export default AdminDashboard;
