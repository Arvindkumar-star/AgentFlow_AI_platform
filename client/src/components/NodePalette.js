import { useState } from 'react';
export { default as AgentGuardPaletteItem } from './NodePalette/AgentGuardPaletteItem';
export { default as RazorpayPaletteItem } from './NodePalette/RazorpayPaletteItem';

// ── Node Palette — grouped, searchable ──────────────────────────────
const PALETTE_GROUPS = [
  {
    label: 'Core',
    items: [
      { type: 'trigger',       label: 'Trigger',       color: '#10b981', icon: '▶',  desc: 'Start the workflow' },
      { type: 'action',        label: 'Action',        color: '#38bdf8', icon: '⚡', desc: 'Perform an operation' },
      { type: 'condition',     label: 'Condition',     color: '#fbbf24', icon: '◆',  desc: 'Branch on a value' },
      { type: 'log',           label: 'Log',           color: '#94a3b8', icon: '📋', desc: 'Debug / record event' },
    ],
  },
  {
    label: 'Risk & Security',
    items: [
      { type: 'agentGuard',    label: 'AgentGuard ZK', color: '#22d3ee', icon: '🛡', desc: 'ZK spend & merchant guardrail', badge: 'ZK' },
    ],
  },
  {
    label: 'Razorpay Payment & Email',
    isPayment: true,
    items: [
      {
        type: 'razorpay',
        label: 'Razorpay Payout',
        color: '#38bdf8',
        icon: '💳',
        desc: 'Automated payout & OTP approval',
        badge: 'HITL',
      },
      {
        type: 'payment_link',
        label: 'Razorpay Link Generator',
        color: '#06b6d4',
        icon: '🔗',
        desc: 'Generate rzp.io payment link',
        badge: 'LINK',
      },
      {
        type: 'email_notification',
        label: 'Email Notification',
        color: '#f97316',
        icon: '📧',
        desc: 'Dispatch payment links & emails',
        badge: 'GUARDED',
      },
    ],
  },
  {
    label: 'Communication',
    items: [
      { type: 'email_notification', label: 'Email Notification', color: '#f97316', icon: '📧', desc: 'Dispatch payment links & emails', badge: 'GUARDED' },
      { type: 'gmail',         label: 'Gmail',         color: '#ef4444', icon: '✉',  desc: 'Send / read email' },
      { type: 'slack',         label: 'Slack',         color: '#4a154b', icon: '💬', desc: 'Post to channel' },
      { type: 'discord',       label: 'Discord',       color: '#5865f2', icon: '🎮', desc: 'Post bot message' },
    ],
  },
  {
    label: 'AI & Automations',
    items: [
      { type: 'ai',            label: 'AI / LLM',      color: '#c084fc', icon: '✦',  desc: 'LLM call / transform' },
      { type: 'notification',  label: 'Notify',        color: '#67e8f9', icon: '🔔', desc: 'Send notification' },
    ],
  },
  {
    label: 'Productivity',
    items: [
      { type: 'google-sheets', label: 'Google Sheets', color: '#34d399', icon: '📊', desc: 'Append / read rows' },
      { type: 'notion',        label: 'Notion',        color: '#aaaaaa', icon: '📝', desc: 'Read / write pages' },
      { type: 'airtable',      label: 'Airtable',      color: '#fbbf24', icon: '⬡',  desc: 'Query base records' },
    ],
  },
  {
    label: 'Social Media',
    items: [
      { type: 'twitter',       label: 'Twitter / X',   color: '#1d9bf0', icon: '🐦', desc: 'Post tweets' },
      { type: 'linkedin',      label: 'LinkedIn',      color: '#0077b5', icon: '💼', desc: 'Post to feed' },
      { type: 'facebook',      label: 'Facebook',      color: '#1877f2', icon: '👥', desc: 'Post to page' },
      { type: 'instagram',     label: 'Instagram',     color: '#e1306c', icon: '📸', desc: 'Post photo' },
    ],
  },
];

const ALL_ITEMS = PALETTE_GROUPS.flatMap(g => g.items);

export default function NodePalette({ onAdd }) {
  const [search, setSearch] = useState('');

  const onDragStart = (event, nodeType, nodeLabel) => {
    event.dataTransfer.setData('application/agentflow-node-type', nodeType);
    event.dataTransfer.setData('application/agentflow-node-label', nodeLabel);
    event.dataTransfer.effectAllowed = 'move';
  };

  const q = search.trim().toLowerCase();
  const groups = q
    ? [{ label: 'Results', items: ALL_ITEMS.filter(i => i.label.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q)) }]
    : PALETTE_GROUPS;

  return (
    <div style={{
      background: 'var(--bg-panel)',
      border: '1px solid var(--border)',
      borderRadius: '1rem',
      padding: '0.875rem',
      height: '580px',
      maxHeight: '580px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      boxSizing: 'border-box',
    }}>
      {/* Title */}
      <div style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>
        Node palette
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text-faint)', pointerEvents: 'none' }}>🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search nodes…"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'var(--bg-panel-muted)', border: '1px solid var(--border)',
            borderRadius: '0.5rem', padding: '0.4rem 0.5rem 0.4rem 1.75rem',
            fontSize: '0.75rem', color: 'var(--text-primary)', outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', fontSize: 11, lineHeight: 1, padding: 0 }}
          >✕</button>
        )}
      </div>

      <p style={{ fontSize: '0.68rem', color: 'var(--text-faint)', lineHeight: 1.4, margin: 0 }}>
        Drag onto canvas or click to add
      </p>

      {/* Groups */}
      {groups.map(group => {
        if (!group.items.length) return null;
        const isPay = group.isPayment || group.label.includes('Razorpay');

        return (
          <div
            key={group.label}
            style={isPay ? {
              background: 'linear-gradient(180deg, rgba(56, 189, 248, 0.08) 0%, rgba(9, 13, 22, 0.2) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '0.875rem',
              padding: '0.625rem 0.5rem',
              boxShadow: '0 0 16px rgba(56, 189, 248, 0.1)',
            } : {}}
          >
            {/* Group Header */}
            {isPay ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', padding: '0 2px' }}>
                <div style={{ fontSize: '0.62rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#38bdf8', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>💳</span> RAZORPAY
                </div>
                <span style={{
                  fontSize: '0.52rem', fontWeight: 800, padding: '1px 5px', borderRadius: 4,
                  background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)',
                }}>
                  PAYMENT
                </span>
              </div>
            ) : (
              <div style={{ fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: '0.375rem', fontWeight: 700 }}>
                {group.label}
              </div>
            )}

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {group.items.map(({ type, label, color, icon, desc, badge }) => (
                <div
                  key={type}
                  draggable
                  onDragStart={e => onDragStart(e, type, label)}
                  onClick={() => onAdd?.(type, label)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    borderRadius: '0.625rem',
                    border: isPay ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid var(--border)',
                    background: isPay ? 'rgba(8, 23, 38, 0.5)' : 'transparent',
                    padding: '0.45rem 0.5rem',
                    cursor: 'grab',
                    transition: 'border-color 0.15s, background 0.15s, transform 0.15s',
                    userSelect: 'none',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = color;
                    e.currentTarget.style.background = `${color}18`;
                    e.currentTarget.style.transform = 'translateX(2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = isPay ? 'rgba(56, 189, 248, 0.25)' : 'var(--border)';
                    e.currentTarget.style.background = isPay ? 'rgba(8, 23, 38, 0.5)' : 'transparent';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <span style={{
                    width: '26px', height: '26px',
                    borderRadius: '0.4rem',
                    background: `${color}20`,
                    border: `1px solid ${color}40`,
                    color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', flexShrink: 0,
                  }}>
                    {icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                      {badge && (
                        <span style={{
                          fontSize: '0.55rem',
                          fontWeight: 800,
                          padding: '1px 4px',
                          borderRadius: 3,
                          background: `${color}25`,
                          color: color,
                          border: `1px solid ${color}45`,
                          letterSpacing: '0.04em',
                          flexShrink: 0,
                        }}>
                          {badge}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
