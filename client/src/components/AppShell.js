import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { Boxes, LayoutDashboard, LogOut, Menu, PlayCircle, Settings, Workflow, X, ShieldCheck, ChevronUp, User, Info, HelpCircle, Zap } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import NotificationsDrawer from './NotificationsDrawer';
import ThemeToggle from './ThemeToggle';

const NAV_GROUPS = [
  {
    title: 'Platform',
    links: [
      { href: '/dashboard',    label: 'Overview',        icon: LayoutDashboard, color: '#38bdf8' },
      { href: '/workflows',    label: 'Workflows',       icon: Workflow,        color: '#818cf8', badge: 'v2.5' },
      { href: '/payouts',      label: 'Fast Payouts',    icon: Zap,             color: '#f59e0b', badge: 'ZK Rail' },
      { href: '/executions',   label: 'Executions',      icon: PlayCircle,      color: '#06b6d4' },
    ]
  },
  {
    title: 'Governance & Rails',
    links: [
      { href: '/analytics',    label: 'Security & Risk', icon: ShieldCheck,     color: '#10b981', badge: 'ZK Guard' },
      { href: '/integrations', label: 'Integrations',    icon: Boxes,           color: '#a855f7' },
    ]
  },
  {
    title: 'Resources',
    links: [
      { href: '/about',        label: 'About',           icon: Info,            color: '#38bdf8' },
      { href: '/help',         label: 'Help & Guides',   icon: HelpCircle,      color: '#14b8a6' },
      { href: '/settings',     label: 'Settings',        icon: Settings,        color: '#94a3b8' },
    ]
  }
];

const SIDEBAR_W = 256;

function SidebarInner({ router, user, logout, onClose }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Operator');
  const displayEmail = user?.email || '';
  const displayRole = user?.role || 'operator';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'O';

  // Close user menu on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      {/* Brand Header */}
      <Link
        href="/dashboard"
        onClick={onClose}
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          textDecoration: 'none',
          padding: '0.25rem 0.25rem 0.5rem',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '0.75rem',
            background: 'linear-gradient(135deg, #0284c7 0%, #10b981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0e1a30',
            boxShadow: '0 4px 14px rgba(56,189,248,0.35)',
            flexShrink: 0,
          }}
        >
          <Workflow size={20} strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.02em', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>Agentflow</span>
            <span style={{ color: 'var(--accent)' }}>_AI</span>
          </div>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#10b981', letterSpacing: '0.05em' }}>
            AGENTGUARD ZK ENGINE
          </div>
        </div>
      </Link>

      {/* Categorized Nav Groups */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            {/* Section Header */}
            <div
              style={{
                fontSize: '0.625rem',
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--text-faint)',
                marginBottom: '0.35rem',
                paddingLeft: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span>{group.title}</span>
            </div>

            {/* Links in Group */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {group.links.map(({ href, label, icon: Icon, color, badge }) => {
                const active = router.pathname === href
                  || (href !== '/dashboard' && router.pathname.startsWith(href + '/'))
                  || (href === '/dashboard' && router.pathname === '/dashboard');

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderRadius: '0.75rem',
                      padding: '0.55rem 0.75rem',
                      fontSize: '0.84rem',
                      fontWeight: active ? 700 : 500,
                      background: active
                        ? 'linear-gradient(90deg, var(--accent-bg) 0%, transparent 100%)'
                        : 'transparent',
                      color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                      border: active ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid transparent',
                      textDecoration: 'none',
                      transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'var(--bg-panel-muted)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                        e.currentTarget.style.transform = 'translateX(3px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-muted)';
                        e.currentTarget.style.transform = 'translateX(0px)';
                      }
                    }}
                  >
                    {/* Active Left Glow Indicator Pill */}
                    {active && (
                      <span
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '20%',
                          bottom: '20%',
                          width: '3.5px',
                          borderRadius: '0 4px 4px 0',
                          background: 'var(--accent)',
                          boxShadow: '0 0 10px var(--accent)',
                        }}
                      />
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: active ? `${color}20` : 'var(--bg-panel-muted)',
                          color: active ? color : 'var(--text-faint)',
                          border: active ? `1px solid ${color}40` : '1px solid var(--border)',
                          transition: 'all 0.18s ease',
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={15} strokeWidth={active ? 2.3 : 1.8} />
                      </div>
                      <span>{label}</span>
                    </div>

                    {/* Optional Accent Pill Badge */}
                    {badge && (
                      <span
                        style={{
                          fontSize: '0.625rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '9999px',
                          background: active ? `${color}22` : 'var(--bg-panel-muted)',
                          color: active ? color : 'var(--text-faint)',
                          border: `1px solid ${color}30`,
                          letterSpacing: '0.02em',
                        }}
                      >
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Interactive User Profile Card & Popover */}
      <div ref={menuRef} style={{ position: 'relative', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
        {/* Floating User Menu Popover */}
        {userMenuOpen && (
          <div
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 0.5rem)',
              left: 0,
              right: 0,
              zIndex: 60,
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
              borderRadius: '1rem',
              padding: '0.75rem',
              boxShadow: 'var(--shadow)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              animation: 'float 0.2s ease-out',
            }}
          >
            {/* Popover Header */}
            <div style={{ padding: '0.4rem 0.5rem 0.6rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </div>
              {displayEmail && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.1rem' }}>
                  {displayEmail}
                </div>
              )}
            </div>

            {/* Quick Menu Links */}
            <Link
              href="/settings"
              onClick={() => { setUserMenuOpen(false); onClose?.(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.5rem 0.6rem',
                borderRadius: '0.5rem',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                fontWeight: 500,
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-panel-muted)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <Settings size={15} style={{ color: 'var(--accent)' }} />
              <span>Workspace Settings</span>
            </Link>

            <Link
              href="/analytics"
              onClick={() => { setUserMenuOpen(false); onClose?.(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.5rem 0.6rem',
                borderRadius: '0.5rem',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                fontWeight: 500,
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-panel-muted)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <ShieldCheck size={15} style={{ color: '#10b981' }} />
              <span>Security & Risk</span>
            </Link>

            <div style={{ borderTop: '1px solid var(--border)', margin: '0.2rem 0' }} />

            {/* Sign Out Action in Popover */}
            <button
              onClick={() => { logout(); setUserMenuOpen(false); onClose?.(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.5rem 0.6rem',
                borderRadius: '0.5rem',
                fontSize: '0.8rem',
                color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.06)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.15)'; }}
            >
              <LogOut size={15} />
              <span>Sign out</span>
            </button>
          </div>
        )}

        {/* User Card Trigger */}
        <div
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setUserMenuOpen(!userMenuOpen); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.6rem',
            padding: '0.5rem',
            borderRadius: '0.85rem',
            background: userMenuOpen ? 'var(--bg-panel-muted)' : 'transparent',
            border: userMenuOpen ? '1px solid var(--accent)' : '1px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            userSelect: 'none',
          }}
          onMouseEnter={e => {
            if (!userMenuOpen) {
              e.currentTarget.style.background = 'var(--bg-panel-muted)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }
          }}
          onMouseLeave={e => {
            if (!userMenuOpen) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }
          }}
        >
          {/* Avatar with Initial + Online Dot */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #0284c7 0%, #6366f1 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.05rem',
                boxShadow: '0 2px 10px rgba(2, 132, 199, 0.35)',
                letterSpacing: '-0.02em',
              }}
            >
              {initial}
            </div>
            {/* Live Green Status Pulse Dot */}
            <span
              style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#10b981',
                border: '2px solid var(--bg-panel)',
                boxShadow: '0 0 6px #10b981',
              }}
            />
          </div>

          {/* User Name & Role Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                lineHeight: 1.2,
              }}
            >
              {displayName}
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-faint)',
                textTransform: 'capitalize',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginTop: '0.15rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '999px',
                  background: 'var(--accent-bg)',
                  color: 'var(--accent)',
                  fontWeight: 600,
                  fontSize: '0.65rem',
                }}
              >
                {displayRole}
              </span>
            </div>
          </div>

          {/* Quick Menu Toggle Indicator */}
          <div
            style={{
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s',
              transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <ChevronUp size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AppShell({ children, title = 'Operations overview' }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarBase = {
    position: 'fixed',
    top: 0, bottom: 0, left: 0,
    width: SIDEBAR_W,
    zIndex: 40,
    background: 'var(--bg-panel)',
    borderRight: '1px solid var(--border)',
    padding: '1.5rem 1.25rem',
    overflowY: 'auto',
    transition: 'background 0.25s, border-color 0.25s',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', transition: 'background 0.25s, color 0.25s' }}>

      {/* ── Desktop sidebar — Tailwind hidden md:block controls visibility ── */}
      <aside style={sidebarBase} className="sidebar-desktop">
        <SidebarInner router={router} user={user} logout={logout} onClose={null} />
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 39 }}
          />
          <aside style={{ ...sidebarBase, display: 'block', zIndex: 40 }}>
            <button
              onClick={() => setMobileOpen(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}
            >
              <X size={20} />
            </button>
            <SidebarInner router={router} user={user} logout={logout} onClose={() => setMobileOpen(false)} />
          </aside>
        </>
      )}

      {/* ── Main content area ── */}
      <main style={{ minHeight: '100vh' }} className="app-main">
        {/* Header */}
        <header
          style={{
            position: 'sticky', top: 0, zIndex: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-panel)',
            padding: '0.875rem 1.25rem',
            transition: 'background 0.25s, border-color 0.25s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}
              className="md:hidden"
            >
              <Menu size={22} />
            </button>
            <div>
              <div style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', lineHeight: 1 }}>
                Agent operations
              </div>
              <h1 style={{ marginTop: '0.2rem', fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.2 }}>{title}</h1>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <ThemeToggle />
            <NotificationsDrawer />
          </div>
        </header>

        {/* Page content */}
        <div style={{ padding: '1.5rem' }} className="md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem' }}>
      <div>
        <div style={{ fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)' }}>{eyebrow}</div>
        <h2 style={{ marginTop: '0.5rem', fontSize: '1.875rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</h2>
        {description && <p style={{ marginTop: '0.5rem', maxWidth: '42rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ status }) {
  const toneMap = {
    COMPLETED: { color: '#059669', bg: 'rgba(16,185,129,.1)' },
    RUNNING:   { color: '#10b981', bg: 'rgba(16,185,129,.12)' },
    active:    { color: '#10b981', bg: 'rgba(16,185,129,.12)' },
    draft:     { color: '#f59e0b', bg: 'rgba(245,158,11,.1)' },
    FAILED:    { color: '#ef4444', bg: 'rgba(239,68,68,.1)' },
    error:     { color: '#ef4444', bg: 'rgba(239,68,68,.1)' },
    PENDING:   { color: '#94a3b8', bg: 'rgba(148,163,184,.1)' },
    CANCELLED: { color: '#94a3b8', bg: 'rgba(148,163,184,.1)' },
    RETRYING:  { color: '#f59e0b', bg: 'rgba(245,158,11,.1)' },
    PAUSED:    { color: '#818cf8', bg: 'rgba(129,140,248,.1)' },
  };
  const tone = toneMap[status] || { color: '#f59e0b', bg: 'rgba(245,158,11,.1)' };
  return (
    <span
      style={{
        borderRadius: '999px',
        padding: '0.2rem 0.625rem',
        fontSize: '0.7rem',
        fontWeight: 600,
        color: tone.color,
        background: tone.bg,
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
      }}
    >
      {status || 'PENDING'}
    </span>
  );
}