import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <nav className="apple-navbar">
      <div className="container nav-content">
        {/* Logo */}
        <Link to="/" className="nav-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          BlockVote
        </Link>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isAdmin ? (
            <Link to="/" className="nav-login-btn secondary">← Polling Booth</Link>
          ) : (
            <Link to="/admin/login" className="nav-login-btn">Admin Portal</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
