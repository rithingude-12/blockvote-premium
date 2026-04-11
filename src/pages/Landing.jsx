import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, Fingerprint } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';

const Landing = () => {
  return (
    <div className="container" style={{ marginTop: '60px' }}>
      <div className="text-center" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '56px', fontWeight: '700', letterSpacing: '-0.03em', lineHeight: '1.1', marginBottom: '24px' }}>
          The Future of Immutable Elections.
        </h1>
        <p style={{ fontSize: '20px', color: 'var(--color-text-secondary)', marginBottom: '40px' }}>
          BlockVote replaces traditional ballot systems with a decentralized, transparent, and tamper-proof architecture. Secured by biometric authentication and Ethereum smart contracts.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link to="/vote">
            <Button variant="primary" style={{ padding: '14px 28px', fontSize: '16px' }}>Cast Ballot</Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="secondary" style={{ padding: '14px 28px', fontSize: '16px' }}>View Live Results</Button>
          </Link>
        </div>
      </div>

      <div className="grid-3 mt-12" style={{ marginTop: '100px' }}>
        <Card className="text-center">
          <ShieldCheck size={32} color="var(--color-text-primary)" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Tamper-Proof Ledger</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Every vote is cryptographically verified and stored on the Ethereum blockchain, guaranteeing transparency.</p>
        </Card>
        <Card className="text-center">
          <Fingerprint size={32} color="var(--color-text-primary)" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Biometric Identity</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Advanced facial recognition and fingerprint fallback ensure one person strictly means one vote.</p>
        </Card>
        <Card className="text-center">
          <Zap size={32} color="var(--color-text-primary)" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Real-Time Tallies</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Monitor the election exactly as it happens. Live updates fed directly from the smart contract.</p>
        </Card>
      </div>
    </div>
  );
};

export default Landing;
