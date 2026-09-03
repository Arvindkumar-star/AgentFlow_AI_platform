import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import AppShell from '../../components/AppShell';
import api from '../../services/api';
import { subscribeToExecution, getSocket } from '../../services/socket';
import ApprovalModal from '../../components/ApprovalModal';

// ── Agent meta ────────────────────────────────────────────────────────────────
const AGENT_META = {
  planner:    { color: '#818cf8', icon: '🧠', label: 'Planner' },
  execution:  { color: '#34d399', icon: '⚡', label: 'Execution' },
  validation: { color: '#fbbf24', icon: '✔',  label: 'Validation' },
  recovery:   { color: '#f87171', icon: '🔄', label: 'Recovery' },
  monitoring: { color: '#67e8f9', icon: '📡', label: 'Monitoring' },
};
const LEVEL_COLORS = { info: '#67e8f9', success: '#34d399', warning: '#fbbf24', error: '#f87171' };

function getAgentMeta(agent) {
  return AGENT_META[agent?.toLowerCase()] || { color: '#67e8f9', icon: '●', label: agent || 'Agent' };
}
function formatDuration(ms) {
  if (!ms) return null;
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}
function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const map = {
    RUNNING:   { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  pulse: true,  label: 'Running' },
    COMPLETED: { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  pulse: false, label: 'Completed' },
    FAILED:    { color: '#f87171', bg: 'rgba(248,113,113,0.12)', pulse: false, label: 'Failed' },
    PAUSED:    { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  pulse: false, label: 'Paused' },
    CANCELLED: { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', pulse: false, label: 'Cancelled' },
    PENDING:   { color: '#818cf8', bg: 'rgba(129,140,248,0.12)', pulse: true,  label: 'Pending' },
  };
  const m = map[status] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', pulse: false, label: status };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: m.bg, color: m.color, border: `1px solid ${m.color}40`,
      borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: m.color, flexShrink: 0,
        animation: m.pulse ? 'statusPulse 1.4s ease-in-out infinite' : 'none' }} />
      {m.label}
    </span>
  );
}

// ── Stats bar ─────────────────────────────────────────────────────────────────
function StatsBar({ logs, run }) {
  const steps    = logs.filter(l => l.agent === 'execution' && l.level === 'success' && l.message?.startsWith('Step')).length;
  const errors   = logs.filter(l => l.level === 'error').length;
  const warnings = logs.filter(l => l.level === 'warning').length;
  const dur      = formatDuration(run?.duration);
  const stats = [
    { label: 'Total Events', value: logs.length, color: '#67e8f9', icon: '📋' },
    { label: 'Steps Done',   value: steps,        color: '#34d399', icon: '✅' },
    { label: 'Warnings',     value: warnings,      color: '#fbbf24', icon: '⚠️' },
    { label: 'Errors',       value: errors,        color: '#f87171', icon: '❌' },
    { label: 'Duration',     value: dur || '—',    color: '#818cf8', icon: '⏱' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
      {stats.map(s => (
        <div key={s.label} style={{
          background: 'var(--bg-panel)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '16px 18px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, ${s.color}cc, transparent)` }} />
          <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, letterSpacing: '0.04em' }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Group logs by execution phase ─────────────────────────────────────────────
function groupLogs(logs) {
  const groups = [];
  let current = null;
  for (const log of logs) {
    const isNewStep   = log.agent === 'execution' && log.message?.startsWith('Executing step');
    const isPlanner   = log.agent === 'planner';
    const isMonitor   = log.agent === 'monitoring';
    if (isPlanner) {
      if (!current || current.phase !== 'planner') {
        current = { phase: 'planner', label: 'Planning', icon: '🧠', color: '#818cf8', logs: [] };
        groups.push(current);
      }
      current.logs.push(log);
    } else if (isNewStep) {
      const match = log.message.match(/Executing step (\d+)\/(\d+):\s*(.+)/);
      current = {
        phase: 'step', stepNum: match?.[1] || '?', total: match?.[2] || '?',
        nodeLabel: match?.[3] || 'Step', icon: '⚡', color: '#34d399', logs: [log],
        nodeId: log.nodeId,
      };
      groups.push(current);
    } else if (isMonitor) {
      if (!current || current.phase !== 'monitoring') {
        current = { phase: 'monitoring', label: 'Monitoring', icon: '📡', color: '#67e8f9', logs: [] };
        groups.push(current);
      }
      current.logs.push(log);
    } else {
      if (!current) { current = { phase: 'other', label: 'Agent', icon: '●', color: '#67e8f9', logs: [] }; groups.push(current); }
      current.logs.push(log);
    }
  }
  return groups;
}

// ── Single log line ───────────────────────────────────────────────────────────
function LogLine({ log }) {
  const meta = getAgentMeta(log.agent);
  const lc   = LEVEL_COLORS[log.level] || '#67e8f9';
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0',
      borderBottom: '1px solid var(--border)', animation: 'fadeUp 0.25s ease',
    }}>
      <div style={{
        flexShrink: 0, marginTop: 1, display: 'inline-flex', alignItems: 'center', gap: 4,
        background: `${meta.color}18`, border: `1px solid ${meta.color}30`,
        borderRadius: 6, padding: '2px 7px', fontSize: 9, fontWeight: 800,
        letterSpacing: '0.1em', color: meta.color, whiteSpace: 'nowrap',
        minWidth: 82, justifyContent: 'center',
      }}>{meta.icon} {meta.label.toUpperCase()}</div>
      <div style={{ flexShrink: 0, marginTop: 5, width: 6, height: 6, borderRadius: '50%',
        background: lc, boxShadow: `0 0 4px ${lc}88` }} />
      <div style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{log.message}</div>
      <div style={{ flexShrink: 0, fontSize: 10, color: 'var(--text-faint)', fontVariantNumeric: 'tabular-nums' }}>
        {formatTime(log.timestamp || log.createdAt)}
      </div>
    </div>
  );
}

// ── Node Output Viewer ────────────────────────────────────────────────────────
function NodeOutputViewer({ output, validation }) {
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [payoutApproved, setPayoutApproved] = useState(
    output?.payoutStatus === 'PAID' || output?.status === 'PAID' || output?.approved === true
  );

  useEffect(() => {
    if (!output?.payoutId) return;
    if (output.payoutStatus === 'PAID' || output.status === 'PAID' || output.approved === true) {
      setPayoutApproved(true);
      return;
    }
    // Fetch live status from MongoDB Payout collection
    api.get(`/payouts/${output.payoutId}`)
      .then((res) => {
        if (res.data?.status === 'PAID') {
          setPayoutApproved(true);
        }
      })
      .catch(() => {});

    // Listen to real-time socket approval
    const socket = getSocket();
    socket.connect();
    const handleApproved = (evt) => {
      if (evt?.payoutId === output.payoutId) {
        setPayoutApproved(true);
      }
    };
    socket.on('payout_approved', handleApproved);
    return () => socket.off('payout_approved', handleApproved);
  }, [output?.payoutId, output?.payoutStatus, output?.status, output?.approved]);

  if (!output) return null;

  const copy = () => {
    navigator.clipboard.writeText(JSON.stringify(output, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const email = output.email || output.emailAddress || output.upstream?.email;
  const isReconnect = output.needsReconnect || output.status === 'NEEDS_RECONNECTION' || output.upstream?.status === 'NEEDS_RECONNECTION';

  return (
    <div style={{
      marginTop: 12, marginBottom: 8,
      background: 'var(--bg-panel)',
      border: `1px solid ${isReconnect ? 'rgba(245,158,11,0.35)' : email ? 'rgba(16,185,129,0.35)' : 'var(--border)'}`,
      boxShadow: 'var(--shadow)',
      borderRadius: 12, padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.08em' }}>⚡ NODE OUTPUT</span>
          {output.status && (
            <span style={{
              fontSize: 10, fontWeight: 800, borderRadius: 999, padding: '2px 8px',
              background: output.status === 'AUTHENTICATED' ? 'rgba(16,185,129,0.15)' : isReconnect ? 'rgba(245,158,11,0.15)' : 'var(--bg-panel-muted)',
              color: output.status === 'AUTHENTICATED' ? '#10b981' : isReconnect ? '#f59e0b' : 'var(--text-muted)',
              border: `1px solid ${output.status === 'AUTHENTICATED' ? 'rgba(16,185,129,0.3)' : isReconnect ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
            }}>{output.status}</span>
          )}
          {validation?.valid && (
            <span style={{ fontSize: 10, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 6, padding: '2px 7px' }}>
              ✔ Validated
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setShowRaw(r => !r)}
            style={{
              background: 'var(--bg-panel-muted)', border: '1px solid var(--border)', borderRadius: 6,
              padding: '3px 8px', fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer',
            }}
          >
            {showRaw ? 'Hide JSON' : 'View JSON'}
          </button>
          <button
            onClick={copy}
            style={{
              background: copied ? 'rgba(16,185,129,0.15)' : 'var(--bg-panel-muted)',
              border: `1px solid ${copied ? '#10b981' : 'var(--border)'}`,
              borderRadius: 6, padding: '3px 10px', fontSize: 11,
              color: copied ? '#10b981' : 'var(--text-primary)', cursor: 'pointer',
            }}
          >
            {copied ? '✓ Copied!' : 'Copy JSON'}
          </button>
        </div>
      </div>

      {/* Highlighted Email Card */}
      {email && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10,
        }}>
          <span style={{ fontSize: 20 }}>✉</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: '#10b981', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Authenticated Email Address
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace', marginTop: 2 }}>
              {email}
            </div>
          </div>
          <span style={{ fontSize: 11, background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '3px 9px', borderRadius: 999, fontWeight: 700, border: '1px solid rgba(16,185,129,0.25)' }}>
            Connected
          </span>
        </div>
      )}

      {/* Warning if needs reconnection */}
      {isReconnect && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10,
        }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Gmail Reconnection Required
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 2 }}>
              {output.message || output.error || 'Token expired or revoked. Please reconnect your Gmail account in Integrations.'}
            </div>
          </div>
          <Link href="/integrations" style={{
            background: '#f59e0b', color: '#ffffff', padding: '4px 12px',
            borderRadius: 6, fontSize: 11, fontWeight: 700, textDecoration: 'none',
          }}>
            Reconnect Gmail
          </Link>
        </div>
      )}

      {/* AgentGuard ZK Card */}
      {(output.status === 'PROOF_VALID' || output.status === 'ZK_REJECTED' || output.errorCode === 'ZK_CONSTRAINT_VIOLATION' || output.verified !== undefined) && (
        <div style={{
          background: (output.verified || output.status === 'PROOF_VALID') ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
          border: `1px solid ${(output.verified || output.status === 'PROOF_VALID') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
          borderRadius: 10, padding: '12px 14px', marginBottom: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: (output.verified || output.status === 'PROOF_VALID') ? '#10b981' : '#f43f5e',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span>{(output.verified || output.status === 'PROOF_VALID') ? '🛡️ ZK PROOF VERIFIED' : '🚨 ZK CONSTRAINT VIOLATION'}</span>
              <span style={{ fontSize: 9, opacity: 0.9, padding: '1px 6px', borderRadius: 4, background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>Groth16 BN128</span>
            </div>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
              Req: ₹{output.requestedAmount ?? 0} | Max: ₹{output.maxLimit ?? 0}
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 2, fontWeight: 500 }}>
            {output.message || output.reason}
          </div>
        </div>
      )}

      {/* Razorpay Payout HITL Card */}
      {(output.payoutId || output.payoutStatus || output.requiresApproval || output.status === 'BLOCKED') && (
        <div style={{
          background: output.status === 'BLOCKED' ? 'rgba(244, 63, 94, 0.08)' : 'rgba(2, 132, 199, 0.08)',
          border: `1px solid ${output.status === 'BLOCKED' ? 'rgba(244, 63, 94, 0.3)' : 'rgba(2, 132, 199, 0.3)'}`,
          borderRadius: 10, padding: '12px 14px', marginBottom: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
            <div style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: output.status === 'BLOCKED' ? '#f43f5e' : 'var(--accent)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span>{output.status === 'BLOCKED' ? '🚫 PAYOUT ABORTED' : '💳 RAZORPAY DRAFT PAYOUT'}</span>
              <span style={{ fontSize: 9, opacity: 0.9, padding: '1px 6px', borderRadius: 4, background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>SANDBOX</span>
            </div>
            <div
              onClick={() => {
                if (!payoutApproved && output.status !== 'BLOCKED') setShowModal(true);
              }}
              style={{
                fontSize: 10, fontWeight: 800, borderRadius: 999, padding: '2px 8px',
                background: payoutApproved ? 'rgba(16,185,129,0.15)' : output.status === 'BLOCKED' ? 'rgba(244,63,94,0.15)' : 'rgba(245,158,11,0.15)',
                color: payoutApproved ? '#10b981' : output.status === 'BLOCKED' ? '#f43f5e' : '#f59e0b',
                border: `1px solid ${payoutApproved ? 'rgba(16,185,129,0.3)' : output.status === 'BLOCKED' ? 'rgba(244,63,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
                cursor: !payoutApproved && output.status !== 'BLOCKED' ? 'pointer' : 'default',
              }}
              title={!payoutApproved ? 'Click to enter OTP and authorize payout' : undefined}
            >
              {payoutApproved ? 'PAID' : (output.payoutStatus || output.status || 'PENDING_APPROVAL')}
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            Vendor: {output.vendor && !output.vendor.includes('{{') ? output.vendor : 'AWS India'} · ₹{output.amount || 0}
          </div>

          <div style={{ fontSize: 12, color: output.status === 'BLOCKED' ? '#f43f5e' : 'var(--text-muted)', marginBottom: 8 }}>
            {payoutApproved ? '✓ Human approval confirmed (OTP 123456). Payout successfully executed on Razorpay.' : (output.message || output.reason)}
          </div>

          {output.requiresApproval && !payoutApproved && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  background: 'var(--accent)', color: '#ffffff', border: 'none',
                  borderRadius: 6, padding: '6px 14px', fontSize: 11, fontWeight: 800,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <span>Authorize & Pay (Enter OTP) →</span>
              </button>
              <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>ID: {output.payoutId}</span>
            </div>
          )}

          {showModal && (
            <ApprovalModal
              isOpen={showModal}
              payout={{
                payoutId: output.payoutId,
                vendor: output.vendor && !output.vendor.includes('{{') ? output.vendor : 'AWS India',
                amount: output.amount || 4200,
                accountNumber: output.accountNumber || output.payoutDetails?.account_number || '11214311215411',
                mode: output.mode || output.payoutDetails?.mode || 'NEFT',
                executionId: output.executionId,
                nodeId: output.nodeId,
              }}
              onClose={() => setShowModal(false)}
              onApproved={() => {
                setPayoutApproved(true);
                setShowModal(false);
              }}
              onRejected={() => {
                setShowModal(false);
              }}
            />
          )}
        </div>
      )}

      {output.message && !email && !isReconnect && !output.status?.includes('PROOF') && !output.status?.includes('ZK') && !output.payoutId && (
        <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.4 }}>
          {output.message}
        </div>
      )}

      {/* JSON Viewer */}
      {showRaw && (
        <pre style={{
          margin: 0, padding: '10px 12px', borderRadius: 8,
          background: 'var(--bg-panel-muted)', border: '1px solid var(--border)',
          fontSize: 11, fontFamily: '"Fira Code", monospace', color: 'var(--text-primary)',
          overflowX: 'auto', maxHeight: 220,
        }}>
          {JSON.stringify(
            payoutApproved
              ? {
                  ...output,
                  status: 'PAID',
                  payoutStatus: 'PAID',
                  approved: true,
                  requiresApproval: false,
                  message: `Draft payout of ₹${output.amount || 4200} for ${output.vendor && !output.vendor.includes('{{') ? output.vendor : 'AWS India'} approved and executed on Razorpay network.`,
                }
              : output,
            null,
            2
          )}
        </pre>
      )}
    </div>
  );
}

// ── Phase card ────────────────────────────────────────────────────────────────
function PhaseCard({ group, index, isLast, outputs = [] }) {
  const [expanded, setExpanded] = useState(true);
  const hasError   = group.logs.some(l => l.level === 'error');
  const hasWarning = group.logs.some(l => l.level === 'warning');
  const hasSuccess = group.logs.some(l => l.level === 'success');
  const sc = hasError ? '#f87171' : hasWarning ? '#fbbf24' : hasSuccess ? '#34d399' : group.color;

  // Match step output
  const stepOutputObj = outputs.find(o =>
    (group.nodeId && String(o.nodeId) === String(group.nodeId)) ||
    (group.nodeLabel && o.label === group.nodeLabel) ||
    (group.stepNum && String(o.nodeId) === String(group.stepNum))
  );
  const outputData = stepOutputObj?.output || group.logs.find(l => l.metadata?.output)?.metadata?.output;
  const validation = stepOutputObj?.validation;

  return (
    <div style={{ display: 'flex', position: 'relative' }}>
      {/* Connector column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 48, flexShrink: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0, zIndex: 1,
          background: `${sc}18`, border: `2px solid ${sc}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, boxShadow: `0 0 12px ${sc}44`,
        }}>{hasError ? '✕' : group.icon}</div>
        {!isLast && (
          <div style={{ flex: 1, width: 2, minHeight: 24, margin: '4px 0',
            background: `linear-gradient(to bottom, ${sc}60, transparent)` }} />
        )}
      </div>

      {/* Card */}
      <div style={{
        flex: 1, marginLeft: 12, marginBottom: isLast ? 0 : 20,
        background: 'var(--bg-panel)',
        border: `1px solid ${hasError ? 'rgba(248,113,113,0.5)' : hasWarning ? 'rgba(251,191,36,0.4)' : 'var(--border)'}`,
        borderRadius: 14, overflow: 'hidden',
        animation: `slideIn 0.3s ease ${index * 0.05}s both`,
        boxShadow: hasError ? '0 4px 20px rgba(248,113,113,0.08)' : hasSuccess ? '0 4px 20px rgba(52,211,153,0.05)' : 'var(--shadow)',
      }}>
        {/* Header */}
        <button onClick={() => setExpanded(e => !e)} style={{
          width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer',
          padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10,
          borderBottom: expanded ? '1px solid var(--border)' : 'none',
        }}>
          {group.phase === 'step' && (
            <div style={{
              background: `${sc}20`, border: `1px solid ${sc}40`, borderRadius: 8,
              padding: '2px 10px', fontSize: 11, fontWeight: 800, color: sc, letterSpacing: '0.06em',
            }}>STEP {group.stepNum}/{group.total}</div>
          )}
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', flex: 1 }}>
            {group.nodeLabel || group.label}
          </span>
          {outputData && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: '#38bdf8',
              background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)',
              borderRadius: 6, padding: '2px 8px', letterSpacing: '0.04em',
            }}>OUTPUT AVAILABLE</span>
          )}
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: sc,
            background: `${sc}15`, border: `1px solid ${sc}30`, borderRadius: 6, padding: '2px 8px',
          }}>{hasError ? 'FAILED' : hasWarning ? 'WARNING' : hasSuccess ? 'DONE' : 'INFO'}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{group.logs.length} event{group.logs.length !== 1 ? 's' : ''}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 14, transition: 'transform 0.2s',
            transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)', display: 'inline-block' }}>▾</span>
        </button>

        {expanded && (
          <div style={{ padding: '8px 18px 14px', background: 'var(--bg-panel-muted)' }}>
            {group.logs.map((log, i) => (
              <LogLine key={log._id || `${log.timestamp}-${i}`} log={log} />
            ))}
            {outputData && (
              <NodeOutputViewer output={outputData} validation={validation} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ExecutionDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [run, setRun]     = useState(null);
  const [logs, setLogs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get(`/executions/${id}`),
      api.get(`/executions/${id}/timeline`),
    ]).then(([a, b]) => {
      setRun(a.data.execution);
      setLogs(b.data.logs || []);
    }).finally(() => setLoading(false));
    return subscribeToExecution(id, {
      event:  e => {
        setLogs(prev => [...prev, e]);
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        // If event carries step output, update run outputs live
        if (e.metadata?.output && e.nodeId) {
          setRun(prev => {
            if (!prev) return prev;
            const existing = prev.outputs || [];
            const idx = existing.findIndex(o => String(o.nodeId) === String(e.nodeId));
            const updatedItem = {
              nodeId: e.nodeId,
              label: e.message?.replace(/^Step \d+ completed: /, '') || `Node ${e.nodeId}`,
              output: e.metadata.output,
            };
            const nextOutputs = idx >= 0
              ? existing.map((o, i) => i === idx ? { ...o, ...updatedItem } : o)
              : [...existing, updatedItem];
            return { ...prev, outputs: nextOutputs };
          });
        }
      },
      status: e => setRun(prev => prev ? {
        ...prev,
        status: e.status,
        outputs: e.outputs || prev.outputs,
        duration: e.duration || prev.duration,
      } : prev),
    });
  }, [id]);

  const action = async (type) => {
    try {
      const res = await api.post(`/executions/${id}/${type}`);
      if (res.data?.status) {
        setRun(prev => prev ? { ...prev, status: res.data.status } : prev);
      } else {
        setRun(prev => prev ? {
          ...prev, status: type === 'cancel' ? 'CANCELLED' : type === 'pause' ? 'PAUSED' : 'RUNNING',
        } : prev);
      }
    } catch (err) {
      console.warn(`Execution action ${type} failed:`, err.response?.data?.message || err.message);
    }
  };

  const groups  = groupLogs(logs);
  const wfName  = run?.workflowSnapshot?.name || 'Workflow Execution';

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell title="Execution Detail">
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading execution…</span>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell title={`Execution · ${wfName}`}>
        <style>{`
          @keyframes fadeUp   { from { opacity:0; transform:translateY(8px);   } to { opacity:1; transform:translateY(0); } }
          @keyframes slideIn  { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }
          @keyframes spin     { to { transform: rotate(360deg); } }
          @keyframes statusPulse { 0%,100% { opacity:1; } 50% { opacity:.5; } }
        `}</style>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              <Link href="/executions" style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color='var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>
                Executions
              </Link>
              <span>›</span>
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Detail</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{wfName}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
              <StatusPill status={run?.status || 'PENDING'} />
              {run?.startTime && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Started {new Date(run.startTime).toLocaleString()}</span>}
              <span style={{ fontSize: 12, color: 'var(--text-faint)', fontFamily: 'monospace' }}>#{id?.slice(-8)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {run?.status === 'RUNNING' && (<>
              <button className="button-secondary" style={{ fontSize: 13, padding: '8px 16px' }} onClick={() => action('pause')}>⏸ Pause</button>
              <button className="button-secondary" style={{ fontSize: 13, padding: '8px 16px', color: '#f87171', borderColor: '#7f1d1d' }} onClick={() => action('cancel')}>✕ Cancel</button>
            </>)}
            {run?.status === 'PAUSED' && (
              <button className="button" style={{ fontSize: 13, padding: '8px 16px' }} onClick={() => action('resume')}>▶ Resume</button>
            )}
          </div>
        </div>

        {/* ── Stats ── */}
        {logs.length > 0 && <StatsBar logs={logs} run={run} />}

        {/* ── Flow canvas ── */}
        <div style={{
          background: 'var(--bg-panel-muted)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '32px 28px', minHeight: 400,
        }}>
          {/* Canvas header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🔁</div>
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Execution Flow</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-faint)' }}>{logs.length} events · {groups.length} phases</span>
          </div>

          {/* Empty */}
          {!logs.length && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-faint)' }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>⏳</div>
              <p style={{ fontSize: 14 }}>Waiting for agent events…</p>
            </div>
          )}

          {/* Phase cards */}
          {groups.map((group, i) => (
            <PhaseCard key={i} group={group} index={i} isLast={i === groups.length - 1} outputs={run?.outputs || []} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* ── Workflow Outputs & Results Summary ── */}
        {run?.outputs && run.outputs.length > 0 && (
          <div style={{
            marginTop: 24, background: 'var(--bg-panel)', border: '1px solid var(--border)',
            borderRadius: 20, padding: '24px 28px', animation: 'fadeUp 0.3s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>📋</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>Workflow Outputs & Node Results</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Outputs captured across all completed nodes</div>
                </div>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {run.outputs.length} node output{run.outputs.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {run.outputs.map((stepOut, idx) => (
                <div key={idx} style={{
                  background: 'var(--bg-panel-muted)', border: '1px solid var(--border)',
                  borderRadius: 14, padding: '14px 18px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8',
                        padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800,
                      }}>
                        NODE #{stepOut.nodeId}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                        {stepOut.label || `Node ${stepOut.nodeId}`}
                      </span>
                    </div>
                    {stepOut.validation?.valid && (
                      <span style={{ fontSize: 10, color: '#34d399', fontWeight: 600 }}>✔ Validated</span>
                    )}
                  </div>
                  <NodeOutputViewer output={stepOut.output} validation={stepOut.validation} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Final result ── */}
        {(run?.status === 'COMPLETED' || run?.status === 'FAILED') && (
          <div style={{
            marginTop: 20, animation: 'fadeUp 0.4s ease',
            background: run.status === 'COMPLETED' ? 'rgba(52,211,153,0.06)' : 'rgba(248,113,113,0.06)',
            border: `1px solid ${run.status === 'COMPLETED' ? '#065f46' : '#7f1d1d'}`,
            borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{ fontSize: 28 }}>{run.status === 'COMPLETED' ? '✅' : '❌'}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: run.status === 'COMPLETED' ? '#34d399' : '#f87171' }}>
                {run.status === 'COMPLETED' ? 'Workflow completed successfully' : 'Workflow failed'}
              </div>
              {run.duration && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Finished in {formatDuration(run.duration)}
                  {run.endTime && ` · Ended at ${new Date(run.endTime).toLocaleTimeString()}`}
                </div>
              )}
              {run.error && (
                <div style={{ fontSize: 12, color: '#f87171', marginTop: 6, fontFamily: 'monospace' }}>{run.error}</div>
              )}
            </div>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
