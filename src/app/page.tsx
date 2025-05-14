import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./api/auth/authOptions";
import { SignInButton } from "./sign-in-button";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/simulator");
  }
  return (
    <div style={{ minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)' }}>
      <header style={{ marginTop: 48, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontSize: '4rem', fontWeight: 700, margin: 0,  }}>💬</span>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0, color: '#22223b' }}>SMS Journal</h1>
        <p style={{ fontSize: '1.25rem', color: '#4a4e69', marginTop: 16, maxWidth: 480, textAlign: 'center' }}>
          Welcome to SMS Journal – your private, secure, and convenient way to keep a daily journal via text message. Sign up to receive daily prompts and log your thoughts by simply replying to our texts. Your entries are always safe and accessible only to you.
        </p>
      </header>
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ background: '#fff', padding: 32, borderRadius: 16, boxShadow: '0 4px 24px rgba(34,34,59,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#22223b', marginBottom: 16 }}>Get Started</h2>
          <p style={{ fontSize: '1rem', color: '#22223b', marginBottom: 24, textAlign: 'center', maxWidth: 340 }}>
            Opt in to receive SMS messages from SMS Journal. You can opt out at any time by replying STOP. Message and data rates may apply.
          </p>
          <SignInButton />
          <p style={{ fontSize: '0.9rem', color: '#6c757d', marginTop: 16, textAlign: 'center', maxWidth: 320 }}>
            By signing up, you consent to receive SMS messages from SMS Journal for journaling purposes. See our <a href="/privacy" style={{ color: '#4a4e69', textDecoration: 'underline' }}>Privacy Policy</a> and <a href="/terms" style={{ color: '#4a4e69', textDecoration: 'underline' }}>Terms of Service</a>.
          </p>
        </div>
      </main>
      <footer style={{ marginBottom: 32, color: '#6c757d', fontSize: '0.95rem', textAlign: 'center' }}>
        &copy; {new Date().getFullYear()} SMS Journal. All rights reserved.
      </footer>
    </div>
  );
}
