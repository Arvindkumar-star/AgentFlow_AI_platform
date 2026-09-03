import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import AppShell, { PageHeading } from '../components/AppShell';
import { useAuthStore } from '../store/authStore';

function ThemeCard() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';

  return (
    <section className="card" style={{ padding: '1.5rem' }}>
      <h3 style={{ fontWeight: 600, margin: '0 0 1.25rem' }}>Appearance</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {/* Light option */}
        <button
          onClick={() => setTheme('light')}
          style={{
            borderRadius: '0.875rem',
            border: `2px solid ${!isDark ? 'var(--accent)' : 'var(--border)'}`,
            padding: '1rem',
            background: !isDark ? 'var(--accent-bg)' : 'var(--bg-panel-muted)',
            cursor: 'pointer',
            transition: 'border-color 0.2s, background 0.2s',
            textAlign: 'left',
          }}
        >
          <div style={{
            width: '100%', height: '56px', borderRadius: '0.5rem',
            background: 'linear-gradient(135deg, #f0f4ff 0%, #ffffff 100%)',
            border: '1px solid #dde3f0', marginBottom: '0.75rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sun size={20} style={{ color: '#06b6d4' }} />
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: !isDark ? 700 : 500, color: !isDark ? 'var(--accent)' : 'var(--text-primary)' }}>
            Light mode
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: '0.2rem' }}>
            Clean &amp; bright console
          </div>
        </button>

        {/* Dark option */}
        <button
          onClick={() => setTheme('dark')}
          style={{
            borderRadius: '0.875rem',
            border: `2px solid ${isDark ? 'var(--accent)' : 'var(--border)'}`,
            padding: '1rem',
            background: isDark ? 'var(--accent-bg)' : 'var(--bg-panel-muted)',
            cursor: 'pointer',
            transition: 'border-color 0.2s, background 0.2s',
            textAlign: 'left',
          }}
        >
          <div style={{
            width: '100%', height: '56px', borderRadius: '0.5rem',
            background: 'linear-gradient(135deg, #080d1a 0%, #0e1628 100%)',
            border: '1px solid #1e2d47', marginBottom: '0.75rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Moon size={20} style={{ color: '#67e8f9' }} />
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: isDark ? 700 : 500, color: isDark ? 'var(--accent)' : 'var(--text-primary)' }}>
            Dark mode
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: '0.2rem' }}>
            Night-ops console
          </div>
        </button>
      </div>

      <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-faint)' }}>
        Your preference is saved locally and persists across sessions.
      </div>
    </section>
  );
}

export default function Settings() {
  const { user } = useAuthStore();

  return (
    <ProtectedRoute>
      <AppShell title="Workspace settings">
        <PageHeading
          eyebrow="Preferences"
          title="Settings"
          description="Manage your profile, security posture, and workspace appearance."
        />

        <div style={{ display: 'grid', maxWidth: '56rem', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {/* Profile card */}
          <section className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 600, margin: '0 0 1.25rem' }}>Profile</h3>

            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Name
              <input className="input" style={{ marginTop: '0.5rem' }} value={user?.name || ''} readOnly />
            </label>

            <label style={{ marginTop: '1rem', display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Email
              <input className="input" style={{ marginTop: '0.5rem' }} value={user?.email || ''} readOnly />
            </label>

            <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Role:{' '}
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{user?.role || 'operator'}</span>
            </div>
          </section>

          {/* Security card */}
          <section className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 600, margin: '0 0 1.25rem' }}>Security health</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', borderRadius: '0.75rem',
                padding: '1rem', background: 'rgba(16,185,129,.08)',
              }}>
                <span>Session authentication</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>Active</span>
              </div>

              <div style={{
                display: 'flex', justifyContent: 'space-between', borderRadius: '0.75rem',
                padding: '1rem', background: 'var(--bg-panel-muted)', border: '1px solid var(--border)',
              }}>
                <span>Credential encryption</span>
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>Server managed</span>
              </div>

              <div style={{
                display: 'flex', justifyContent: 'space-between', borderRadius: '0.75rem',
                padding: '1rem', background: 'var(--bg-panel-muted)', border: '1px solid var(--border)',
              }}>
                <span>API key health</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Env managed</span>
              </div>
            </div>
          </section>

          {/* Theme card — spans full width */}
          <div style={{ gridColumn: '1 / -1' }}>
            <ThemeCard />
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
