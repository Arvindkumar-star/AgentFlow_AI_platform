import { useEffect, useRef, useState, useCallback } from 'react';
import { Bell, BellDot, Check, CheckCheck, Loader2, X, CreditCard, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import { getSocket } from '../services/socket';
import ApprovalModal from './ApprovalModal';

const TYPE_STYLES = {
  success:   { color: '#10b981', bg: 'rgba(16,185,129,.1)',  dot: '#10b981' },
  failure:   { color: '#ef4444', bg: 'rgba(239,68,68,.1)',   dot: '#ef4444' },
  warning:   { color: '#f59e0b', bg: 'rgba(245,158,11,.1)',  dot: '#f59e0b' },
  escalation:{ color: '#a78bfa', bg: 'rgba(167,139,250,.1)', dot: '#a78bfa' },
  info:      { color: 'var(--accent)', bg: 'var(--accent-bg)', dot: 'var(--accent)' },
};

export default function NotificationsDrawer() {
  const [open, setOpen]                   = useState(false);
  const [items, setItems]                 = useState([]);
  const [unread, setUnread]               = useState(0);
  const [pendingPayouts, setPendingPayouts] = useState([]);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [modalOpen, setModalOpen]         = useState(false);
  const [loading, setLoading]             = useState(false);
  const drawerRef                         = useRef(null);

  // ── Fetch notifications & pending payouts ─────────────────────
  const fetchPendingPayouts = useCallback(async () => {
    try {
      const { data } = await api.get('/payouts/pending');
      setPendingPayouts(data.payouts || []);
    } catch (_) {}
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications', { params: { limit: 30 } });
      setItems(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  const refreshAll = useCallback(() => {
    fetchNotifications();
    fetchPendingPayouts();
  }, [fetchNotifications, fetchPendingPayouts]);

  // Initial load + real-time push via Socket.IO
  useEffect(() => {
    refreshAll();

    const socket = getSocket();
    socket.connect();
    const handler = () => refreshAll();
    socket.on('execution:status', handler);
    socket.on('payout_pending', handler);
    socket.on('payout_created', handler);
    socket.on('payout_approved', handler);
    socket.on('payout_rejected', handler);

    // Also poll every 8 seconds for pending approvals
    const interval = setInterval(fetchPendingPayouts, 8000);

    return () => {
      socket.off('execution:status', handler);
      socket.off('payout_pending', handler);
      socket.off('payout_created', handler);
      socket.off('payout_approved', handler);
      socket.off('payout_rejected', handler);
      clearInterval(interval);
    };
  }, [refreshAll, fetchPendingPayouts]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // ── Mark one as read ─────────────────────────────────────────
  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setItems(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch (_) {}
  };

  // ── Mark all read ────────────────────────────────────────────
  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setItems(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnread(0);
    } catch (_) {}
  };

  const totalBadge = unread + pendingPayouts.length;

  return (
    <div style={{ position: 'relative' }} ref={drawerRef}>
      {/* Bell button */}
      <button
        id="notifications-btn"
        className="theme-toggle"
        onClick={() => { setOpen(o => !o); if (!open) refreshAll(); }}
        aria-label="Notifications"
        style={{ position: 'relative' }}
      >
        {totalBadge > 0 ? (
          <BellDot size={18} style={{ color: pendingPayouts.length > 0 ? 'var(--accent)' : 'var(--accent)' }} />
        ) : (
          <Bell size={18} />
        )}
        {totalBadge > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            minWidth: '18px', height: '18px',
            borderRadius: '999px',
            background: pendingPayouts.length > 0 ? 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)' : '#ef4444',
            boxShadow: pendingPayouts.length > 0 ? '0 0 10px rgba(56, 189, 248, 0.6)' : undefined,
            color: '#fff', fontSize: '0.6rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px',
          }}>
            {totalBadge > 99 ? '99+' : totalBadge}
          </span>
        )}
      </button>

      {/* Drawer panel */}
      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 0.75rem)', right: 0,
            width: '380px', maxHeight: '520px',
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: '1rem',
            boxShadow: 'var(--shadow)',
            zIndex: 100,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideDown 0.18s ease',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-panel)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Notifications</span>
              {totalBadge > 0 && (
                <span style={{
                  background: 'var(--accent-bg)',
                  color: 'var(--accent)',
                  border: '1px solid var(--border)',
                  borderRadius: '999px', padding: '0.1rem 0.5rem',
                  fontSize: '0.7rem', fontWeight: 700,
                }}>
                  {totalBadge} action{totalBadge === 1 ? '' : 's'}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  title="Mark all as read"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', borderRadius: '0.5rem', padding: '0.25rem',
                    display: 'flex',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <CheckCheck size={16} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', borderRadius: '0.5rem', padding: '0.25rem',
                  display: 'flex',
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={{ overflowY: 'auto', flex: 1, background: 'var(--bg-base)' }}>
            {/* Pending Financial Approvals (HITL) */}
            {pendingPayouts.length > 0 && (
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', background: 'var(--accent-bg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.04em' }}>
                    <CreditCard size={14} />
                    <span>FINANCIAL APPROVALS ({pendingPayouts.length})</span>
                  </div>
                  <span style={{ fontSize: '0.65rem', background: 'var(--bg-panel)', color: 'var(--accent)', border: '1px solid var(--border)', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                    HITL 2FA
                  </span>
                </div>
                {pendingPayouts.slice(0, 5).map((p) => (
                  <div
                    key={p.payoutId || p._id}
                    style={{
                      background: 'var(--bg-panel)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '0.75rem',
                      marginBottom: '0.5rem',
                      boxShadow: 'var(--shadow)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{p.vendor || 'Vendor'}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent)' }}>₹{Number(p.amount || 0).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 600 }}>
                        <ShieldCheck size={12} /> ZK Verified
                      </span>
                      <span>·</span>
                      <span style={{ fontFamily: 'monospace' }}>{p.accountNumber || '11214311215411'}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPayout(p);
                        setModalOpen(true);
                        setOpen(false);
                      }}
                      className="button"
                      style={{
                        marginTop: '0.6rem',
                        width: '100%',
                        padding: '0.45rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      <span>Authorize Payout (OTP 123456)</span>
                      <span>→</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <Loader2 size={20} style={{ color: 'var(--text-faint)', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : items.length === 0 ? (
              <div style={{ padding: '2.5rem 1.25rem', textAlign: 'center', color: 'var(--text-faint)', fontSize: '0.875rem' }}>
                <Bell size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3, display: 'block' }} />
                No notifications yet
              </div>
            ) : (
              items.map(n => {
                const style = TYPE_STYLES[n.type] || TYPE_STYLES.info;
                return (
                  <div
                    key={n._id}
                    style={{
                      display: 'flex', gap: '0.75rem',
                      padding: '0.875rem 1.25rem',
                      borderBottom: '1px solid var(--border)',
                      background: n.isRead ? 'var(--bg-panel)' : 'var(--accent-bg)',
                      transition: 'background 0.15s',
                      cursor: n.isRead ? 'default' : 'pointer',
                    }}
                    onClick={() => !n.isRead && markRead(n._id)}
                  >
                    {/* Dot */}
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: style.dot, flexShrink: 0, marginTop: '0.35rem',
                      opacity: n.isRead ? 0.35 : 1,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: n.isRead ? 400 : 700, color: 'var(--text-primary)' }}>{n.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', lineHeight: 1.4 }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-faint)', marginTop: '0.35rem' }}>
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {!n.isRead && (
                      <button
                        onClick={e => { e.stopPropagation(); markRead(n._id); }}
                        title="Mark as read"
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--text-faint)', flexShrink: 0, display: 'flex', alignSelf: 'flex-start',
                          marginTop: '0.1rem', padding: '0.1rem',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Approval Modal */}
      <ApprovalModal
        isOpen={modalOpen}
        payout={selectedPayout}
        onClose={() => setModalOpen(false)}
        onApproved={() => {
          refreshAll();
        }}
        onRejected={() => {
          refreshAll();
        }}
      />

      {/* Keyframe styles */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
