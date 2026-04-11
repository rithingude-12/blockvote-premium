import React from 'react';
import Card from '../components/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const VoterDashboard = () => {
  const data = [
    { name: 'Alice Johnson', votes: 14502 },
    { name: 'Bob Smith', votes: 12930 },
    { name: 'Carol Williams', votes: 8421 },
  ];

  return (
    <div className="container">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600' }}>Live Election Results</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>Real-time tallies synchronized from the Ethereum Sepolia Testnet.</p>
      </div>

      <div className="grid-3 mb-8">
        {data.map((candidate, idx) => (
          <Card key={idx}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', fontWeight: '500', textTransform: 'uppercase', marginBottom: '4px' }}>Candidate</p>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>{candidate.name}</h3>
            <div style={{ fontSize: '32px', fontWeight: '700', letterSpacing: '-0.02em' }}>
              {candidate.votes.toLocaleString()}
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>verified votes</p>
          </Card>
        ))}
      </div>

      <Card style={{ height: '400px', padding: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>Voting Distribution</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: 'var(--color-text-secondary)' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: 'var(--color-text-secondary)' }} />
            <Tooltip 
              cursor={{ fill: 'var(--color-secondary-bg)' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} 
            />
            <Bar dataKey="votes" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default VoterDashboard;
