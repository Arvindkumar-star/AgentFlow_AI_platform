import React from 'react';
import { CreditCard } from 'lucide-react';

export default function RazorpayPaletteItem({ onAdd }) {
  const onDragStart = (event) => {
    event.dataTransfer.setData('application/agentflow-node-type', 'razorpay');
    event.dataTransfer.setData('application/agentflow-node-label', 'Razorpay Vendor Payout');
    event.dataTransfer.effectAllowed = 'move';
  };

  const item = {
    type: 'razorpay',
    label: 'Razorpay Vendor Payout',
    color: '#38bdf8',
    desc: 'Automated payout & OTP authorization',
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={() => onAdd && onAdd(item.type, item.label)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        padding: '0.5rem 0.625rem',
        borderRadius: '0.625rem',
        cursor: 'grab',
        background: 'rgba(56, 189, 248, 0.06)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        transition: 'all 0.15s ease',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)';
        e.currentTarget.style.borderColor = '#38bdf8';
        e.currentTarget.style.transform = 'translateX(2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(56, 189, 248, 0.06)';
        e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.25)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <span
        style={{
          width: '1.75rem',
          height: '1.75rem',
          borderRadius: '0.5rem',
          background: 'rgba(56, 189, 248, 0.15)',
          color: '#38bdf8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <CreditCard size={16} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
          Razorpay Payout
          <span style={{ fontSize: 8, background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '1px 4px', borderRadius: 4, fontWeight: 800 }}>PAYMENT</span>
          <span style={{ fontSize: 8, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '1px 4px', borderRadius: 4, fontWeight: 800 }}>HITL</span>
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          Vendor payout & OTP authorization
        </div>
      </div>
    </div>
  );
}
