import React, { useState } from 'react';
import { Camera, CheckCircle2 } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';

const VotingBooth = () => {
  const [step, setStep] = useState('auth'); // auth, vote, success

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      
      {step === 'auth' && (
        <Card className="text-center" style={{ width: '480px', padding: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>Biometric Verification</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '32px' }}>
            Please position your face clearly in the frame to authorize your ballot securely.
          </p>

          <div style={{ 
            width: '100%', 
            height: '240px', 
            backgroundColor: '#000000', 
            borderRadius: 'var(--radius-md)',
            marginBottom: '32px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              position: 'absolute',
              width: '200px',
              height: '240px',
              border: '2px dashed rgba(255,255,255,0.4)',
              borderRadius: '50% 50% 0 0',
              top: '20px'
            }}></div>
            <Camera color="rgba(255,255,255,0.8)" size={32} />
          </div>

          <Button variant="primary" style={{ width: '100%', padding: '14px' }} onClick={() => setStep('vote')}>
            Scan & Authenticate
          </Button>
        </Card>
      )}

      {step === 'vote' && (
        <Card style={{ width: '600px', padding: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>Cast Your Ballot</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '32px' }}>
            Select one candidate. This action is immutable and will be recorded on the blockchain.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
            {['Alice Johnson (Progressive Alliance)', 'Bob Smith (Conservative Front)', 'Carol Williams (Independent)'].map((candidate, idx) => (
              <label key={idx} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                padding: '20px', 
                border: '1px solid var(--color-border)', 
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'background-color var(--transition-fast)'
              }}>
                <input type="radio" name="candidate" style={{ width: '18px', height: '18px', accentColor: 'var(--color-text-primary)' }} />
                <span style={{ fontWeight: '500' }}>{candidate}</span>
              </label>
            ))}
          </div>

          <Button variant="primary" style={{ width: '100%', padding: '14px' }} onClick={() => setStep('success')}>
            Sign & Submit to Blockchain
          </Button>
        </Card>
      )}

      {step === 'success' && (
        <Card className="text-center" style={{ width: '400px', padding: '48px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <CheckCircle2 size={64} color="var(--color-text-primary)" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>Vote Confirmed</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '32px' }}>
            Your encrypted ballot has been successfully tallied on the network.
          </p>
          <Button variant="secondary" style={{ width: '100%' }} onClick={() => window.location.href = '/dashboard'}>
            Return to Dashboard
          </Button>
        </Card>
      )}

    </div>
  );
};

export default VotingBooth;
