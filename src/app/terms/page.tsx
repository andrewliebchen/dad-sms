export default function TermsOfService() {
  return (
    <div style={{ maxWidth: 700, margin: '48px auto', padding: 32, background: "#FFF", borderRadius: 12, boxShadow: '0 2px 16px rgba(34,34,59,0.06)' }}>
      <h1 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: 24 }}>Terms of Service</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>
      <p>
        Welcome to SMS Journal. By using our SMS journaling service (the &quot;Service&quot;), you agree to the following terms and conditions. Please read them carefully.
      </p>
      <h2 style={{ marginTop: 32, fontSize: '1.3rem' }}>1. Use of Service</h2>
      <ul>
        <li>You must be at least 18 years old or have parental consent to use this Service.</li>
        <li>You agree to use the Service only for lawful purposes and in accordance with these Terms.</li>
        <li>You are responsible for maintaining the confidentiality of your account information.</li>
      </ul>
      <h2 style={{ marginTop: 32, fontSize: '1.3rem' }}>2. SMS Messaging</h2>
      <ul>
        <li>By signing up, you consent to receive SMS messages from SMS Journal for journaling purposes.</li>
        <li>You may opt out at any time by replying STOP to any message.</li>
        <li>Message and data rates may apply depending on your carrier and plan.</li>
      </ul>
      <h2 style={{ marginTop: 32, fontSize: '1.3rem' }}>3. Privacy</h2>
      <p>
        Your privacy is important to us. Please review our <a href="/privacy">Privacy Policy</a> to understand how we collect, use, and protect your information.
      </p>
      <h2 style={{ marginTop: 32, fontSize: '1.3rem' }}>4. Prohibited Conduct</h2>
      <ul>
        <li>You may not use the Service to send unlawful, abusive, or harassing content.</li>
        <li>You may not attempt to interfere with the operation of the Service.</li>
      </ul>
      <h2 style={{ marginTop: 32, fontSize: '1.3rem' }}>5. Termination</h2>
      <p>
        We reserve the right to suspend or terminate your access to the Service at our discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users or the Service.
      </p>
      <h2 style={{ marginTop: 32, fontSize: '1.3rem' }}>6. Changes to Terms</h2>
      <p>
        We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the new Terms.
      </p>
      <h2 style={{ marginTop: 32, fontSize: '1.3rem' }}>7. Contact Us</h2>
      <p>
        If you have any questions about these Terms, please contact us at <a href="mailto:support@smsjournal.com">support@smsjournal.com</a>.
      </p>
    </div>
  );
} 