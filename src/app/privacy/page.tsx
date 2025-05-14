export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: 700, margin: '48px auto', padding: 32, background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px rgba(34,34,59,0.06)' }}>
      <h1 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: 24 }}>Privacy Policy</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>
      <p>
        SMS Journal (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our SMS journaling service.
      </p>
      <h2 style={{ marginTop: 32, fontSize: '1.3rem' }}>Information We Collect</h2>
      <ul>
        <li><strong>Personal Information:</strong> When you sign up, we may collect your phone number, email address, and basic profile information.</li>
        <li><strong>Journal Entries:</strong> The content you send via SMS is stored securely and is accessible only to you.</li>
        <li><strong>Usage Data:</strong> We may collect information about how you use our service to improve your experience.</li>
      </ul>
      <h2 style={{ marginTop: 32, fontSize: '1.3rem' }}>How We Use Your Information</h2>
      <ul>
        <li>To provide and maintain the SMS journaling service</li>
        <li>To communicate with you about your account and service updates</li>
        <li>To improve our service and develop new features</li>
        <li>To comply with legal obligations</li>
      </ul>
      <h2 style={{ marginTop: 32, fontSize: '1.3rem' }}>How We Protect Your Information</h2>
      <p>
        We use industry-standard security measures to protect your data. Your journal entries and personal information are encrypted and stored securely. Access is restricted to authorized personnel only.
      </p>
      <h2 style={{ marginTop: 32, fontSize: '1.3rem' }}>Sharing Your Information</h2>
      <p>
        We do not sell or share your personal information with third parties except as required by law or to provide our service (e.g., SMS delivery providers).
      </p>
      <h2 style={{ marginTop: 32, fontSize: '1.3rem' }}>Your Choices</h2>
      <ul>
        <li>You may opt out of SMS messages at any time by replying STOP.</li>
        <li>You may request deletion of your data by contacting us at andrewliebchen@gmail.com.</li>
      </ul>
      <h2 style={{ marginTop: 32, fontSize: '1.3rem' }}>Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy, please contact us at <a href="mailto:andrewliebchen@gmail.com">andrewliebchen@gmail.com</a>.
      </p>
    </div>
  );
} 