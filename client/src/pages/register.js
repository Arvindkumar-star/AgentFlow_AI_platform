import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import { AuthLayout } from './login';
import { useAuthStore } from '../store/authStore';

export default function Register() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await register(form);
      router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create account');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleBusy(true);
    setError('');

    const hasRealGoogleCreds =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID &&
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID !== 'demo_client_id';

    if (hasRealGoogleCreds) {
      try {
        await signIn('google', { callbackUrl: '/dashboard' });
      } catch (err) {
        setError('Google Sign-Up failed');
        setGoogleBusy(false);
      }
    } else {
      setTimeout(() => {
        const googleUser = {
          id: `usr_google_${Date.now().toString().slice(-6)}`,
          _id: `usr_google_${Date.now().toString().slice(-6)}`,
          name: form.name || 'Google Operator',
          email: form.email || 'operator@agentflow.ai',
          role: 'operator',
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'agentflow-auth',
            JSON.stringify({
              state: {
                token: `jwt_google_oauth_${Date.now()}`,
                user: googleUser,
                hydrated: true,
              },
              version: 0,
            })
          );
        }

        router.replace('/dashboard');
      }, 500);
    }
  };

  return (
    <AuthLayout title="Create your workspace" subtitle="Start automating operations with Agentflow AI.">
      {/* Google OAuth Button */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={googleBusy}
          className="button-secondary w-full py-2.5 px-4 flex items-center justify-center gap-3 font-semibold text-sm transition card-hover"
          style={{
            borderRadius: '0.75rem',
            background: 'var(--bg-panel-muted)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>{googleBusy ? 'Signing up with Google…' : 'Sign up with Google'}</span>
        </button>
      </div>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0', gap: '0.75rem' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-faint)' }}>or with email</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      </div>

      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm" style={{ color: 'var(--text-muted)' }}>
          Name
          <input required className="input mt-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="block text-sm" style={{ color: 'var(--text-muted)' }}>
          Email
          <input required type="email" className="input mt-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label className="block text-sm" style={{ color: 'var(--text-muted)' }}>
          Password
          <input required type="password" className="input mt-2" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button className="button w-full" disabled={busy}>
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-faint)' }}>
        Already have an account?{' '}
        <Link className="text-cyan-400 font-semibold" href="/login">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
