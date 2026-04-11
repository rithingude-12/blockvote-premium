import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PollingBooth from './pages/PollingBooth';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';
import { pingServer } from './services/api';

const App = () => {
    useEffect(() => {
        pingServer(); // Warm Render.com backend on first load
    }, []);

    return (
        <BrowserRouter>
            <div className="app-container">
                <Navbar />
                <div className="page-wrapper animate-fade-in">
                    <main className="main-content">
                        <Routes>
                            <Route path="/" element={<PollingBooth />} />
                            <Route path="/admin/login" element={<Login />} />
                            <Route path="/admin/dashboard/*" element={<AdminDashboard />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </main>
                </div>
                <footer style={{
                    borderTop: '1px solid var(--color-border)',
                    padding: '20px 40px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--color-secondary-bg)',
                }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        &copy; 2026 BlockVote Inc.
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                        Ethereum Blockchain · Security Level: Maximum
                    </span>
                </footer>
            </div>
        </BrowserRouter>
    );
};

export default App;
