import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function AgentGuardPaletteItem({ onAdd }) {
  const onDragStart = (event) => {
    event.dataTransfer.setData('application/agentflow-node-type', 'agentGuard');
    event.dataTransfer.setData('application/agentflow-node-label', 'AgentGuard ZK Node');
    event.dataTransfer.effectAllowed = 'move';
  };

  const item = {
    type: 'agentGuard',
    label: 'AgentGuard ZK Node',
    color: '#22d3ee',
    desc: 'ZK mathematical spend guardrail',
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
        background: 'rgba(34, 211, 238, 0.06)',
        border: '1px solid rgba(34, 211, 238, 0.25)',
        transition: 'all 0.15s ease',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(34, 211, 238, 0.15)';
        e.currentTarget.style.borderColor = '#22d3ee';
        e.currentTarget.style.transform = 'translateX(2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(34, 211, 238, 0.06)';
        e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.25)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <span
        style={{
          width: '1.75rem',
          height: '1.75rem',
          borderRadius: '0.5rem',
          background: 'rgba(34, 211, 238, 0.15)',
          color: '#22d3ee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <ShieldCheck size={16} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
          AgentGuard ZK
          <span style={{ fontSize: 9, background: '#22d3ee22', color: '#22d3ee', padding: '1px 4px', borderRadius: 4, fontWeight: 800 }}>ZK</span>
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          Zero-Knowledge spend limit check
        </div>
      </div>
    </div>
  );
}
