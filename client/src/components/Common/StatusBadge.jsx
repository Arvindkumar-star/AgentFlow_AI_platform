import React from 'react';

export default function StatusBadge({ status = 'READY', label, className = '' }) {
  const s = String(status || '').toUpperCase();

  const getStyle = () => {
    switch (s) {
      case 'GROTH16_VERIFIED':
      case 'PROOF_VALID':
      case 'PAID':
      case 'COMPLETED':
      case 'SUCCESS':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          color: '#10B981',
          border: 'rgba(16, 185, 129, 0.4)',
          glow: '0 0 14px rgba(16, 185, 129, 0.3)',
          dot: '#10B981',
        };
      case 'PENDING_APPROVAL':
      case 'HITL_PENDING':
      case 'PENDING':
      case 'ARMED':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          color: '#F59E0B',
          border: 'rgba(245, 158, 11, 0.4)',
          glow: '0 0 14px rgba(245, 158, 11, 0.3)',
          dot: '#F59E0B',
          animate: 'pulse 1.5s infinite',
        };
      case 'CONSTRAINT_VIOLATION':
      case 'BLOCKED':
      case 'FAILED':
      case 'REJECTED':
        return {
          bg: 'rgba(244, 63, 94, 0.15)',
          color: '#F43F5E',
          border: 'rgba(244, 63, 94, 0.4)',
          glow: '0 0 18px rgba(244, 63, 94, 0.4)',
          dot: '#F43F5E',
        };
      default:
        return {
          bg: 'rgba(56, 189, 248, 0.12)',
          color: '#38BDF8',
          border: 'rgba(56, 189, 248, 0.3)',
          glow: 'none',
          dot: '#38BDF8',
        };
    }
  };

  const current = getStyle();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${className}`}
      style={{
        background: current.bg,
        color: current.color,
        border: `1px solid ${current.border}`,
        boxShadow: current.glow,
        fontFamily: "'JetBrains Mono', monospace",
        textTransform: 'uppercase',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: current.dot,
          animation: current.animate || 'none',
        }}
      />
      {label || s.replace(/_/g, ' ')}
    </span>
  );
}
