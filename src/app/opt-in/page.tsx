"use client";

import React, { useState } from 'react';

export default function OptInPage() {
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!consent) {
      setError('You must consent to receive SMS messages.');
      return;
    }
    const res = await fetch('/api/opt-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    if (res.ok) {
      setSubmitted(true);
    } else {
      setError('There was an error submitting your request.');
    }
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: 500, margin: '2rem auto', fontFamily: 'sans-serif', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: '2rem' }}>
        <h2>Thank you!</h2>
        <p>We have sent you a text message to confirm your subscription. Please reply YES to complete your opt-in.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', fontFamily: 'sans-serif', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>Opt in to Dad Bot SMS</h1>
      <p style={{ color: '#444', marginBottom: 24 }}><b>What to expect:</b> Occasional SMS messages from Dad Bot. Msg & data rates may apply. Reply STOP to unsubscribe, HELP for help. No purchase necessary. Message frequency: occasional.</p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="phone" style={{ fontWeight: 500 }}>Phone number:</label><br />
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          required
          pattern="^\+?[1-9]\d{1,14}$"
          placeholder="e.g. +12345556789"
          style={{
            width: '100%',
            marginBottom: 16,
            padding: '10px 12px',
            border: '1.5px solid #bbb',
            borderRadius: 8,
            outline: 'none',
            fontSize: 16,
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => (e.target.style.borderColor = '#0070f3')}
          onBlur={e => (e.target.style.borderColor = '#bbb')}
        /><br />
        <label style={{ display: 'block', marginBottom: 16 }}>
          <input
            type="checkbox"
            checked={consent}
            onChange={e => setConsent(e.target.checked)}
            required
            style={{ marginRight: 8 }}
          />
          I consent to receive SMS messages from Dad Bot at the phone number above. I understand that message & data rates may apply, and I can reply STOP to unsubscribe or HELP for help at any time.
        </label>
        <button
          type="submit"
          style={{
            background: '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '12px 28px',
            fontSize: 18,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            transition: 'background 0.2s',
          }}
          onMouseOver={e => (e.currentTarget.style.background = '#0059c1')}
          onMouseOut={e => (e.currentTarget.style.background = '#0070f3')}
        >
          Opt In
        </button>
        {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
      </form>
    </div>
  );
} 