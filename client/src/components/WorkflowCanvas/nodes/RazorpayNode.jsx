import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { CreditCard, CheckCircle2, Clock, XCircle } from 'lucide-react';
import ApprovalModal from '../../ApprovalModal';

export default function RazorpayNode({ data, selected, id }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [statusOverride, setStatusOverride] = useState(null);

  React.useEffect(() => {
    const handleApprovedEvent = (e) => {
      const d = e.detail || e;
      if (!d) return;
      // Only set status to PAID if this specific node or payout was approved!
      const matchesNode = Boolean(d.nodeId && d.nodeId === id);
      const matchesPayout = Boolean(d.payoutId && data?.payoutId && d.payoutId === data?.payoutId);
      if (matchesNode || matchesPayout || (!d.nodeId && !d.payoutId)) {
        setStatusOverride('PAID');
      }
    };
    const handleResetEvent = () => {
      setStatusOverride(null);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('payout-approved', handleApprovedEvent);
      window.addEventListener('workflow-run-start', handleResetEvent);
      return () => {
        window.removeEventListener('payout-approved', handleApprovedEvent);
        window.removeEventListener('workflow-run-start', handleResetEvent);
      };
    }
  }, [id, data?.payoutId]);

  const rawStatus = (statusOverride || data?.payoutStatus || data?.status || 'READY').toUpperCase();
  const status = rawStatus;
  const vendor = data?.vendor || 'AWS India';
  const amount = data?.amount !== undefined ? data.amount : (data?.requestedAmount || 4200);

  const isPaid = status === 'PAID' || status === 'PROCESSED';
  const isRejected = status === 'REJECTED' || status === 'CANCELLED' || status === 'BLOCKED';
  const isPending = status === 'PENDING_APPROVAL';

  const borderColor = selected
    ? '#38bdf8'
    : isPaid
    ? '#10b981'
    : isRejected
    ? '#f43f5e'
    : isPending
    ? '#f59e0b'
    : 'rgba(56, 189, 248, 0.3)';

  const badgeBg = isPaid
    ? 'rgba(16, 185, 129, 0.15)'
    : isRejected
    ? 'rgba(244, 63, 94, 0.15)'
    : isPending
    ? 'rgba(245, 158, 11, 0.15)'
    : 'var(--bg-panel-muted)';

  const badgeColor = isPaid
    ? '#10b981'
    : isRejected
    ? '#fb7185'
    : isPending
    ? '#fbbf24'
    : '#38bdf8';

  return (
    <>
      <style>{`
        @keyframes paidGlow {
          0%, 100% {
            box-shadow: 0 0 25px rgba(16, 185, 129, 0.65), 0 0 50px rgba(16, 185, 129, 0.25);
            border-color: #10b981;
          }
          50% {
            box-shadow: 0 0 40px rgba(16, 185, 129, 0.95), 0 0 70px rgba(16, 185, 129, 0.45);
            border-color: #34d399;
          }
        }
      `}</style>
      <div
        style={{
          minWidth: 210,
          padding: '12px 16px',
          borderRadius: 14,
          background: isPaid ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-panel)',
          border: `2px solid ${borderColor}`,
          boxShadow: isPaid
            ? '0 0 30px rgba(16, 185, 129, 0.7)'
            : selected
            ? '0 0 20px rgba(56, 189, 248, 0.3)'
            : 'var(--shadow)',
          animation: isPaid ? 'paidGlow 1.8s ease-in-out infinite' : 'none',
          fontFamily: 'inherit',
          color: 'var(--text-primary)',
          position: 'relative',
          transition: 'all 0.25s ease',
        }}
        className={`razorpay-payout-node shadow-md ${selected ? 'ring-2 ring-blue-400' : ''}`}
      >
      {/* Target Handles (Left for horizontal flow, Top for vertical flow) */}
      <Handle
        type="target"
        position={Position.Left}
        id="in-left"
        style={{
          width: 10,
          height: 10,
          background: '#38bdf8',
          border: '2px solid var(--bg-panel)',
        }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="in-top"
        style={{
          width: 10,
          height: 10,
          background: '#38bdf8',
          border: '2px solid var(--bg-panel)',
        }}
      />

      {/* Top category label */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 8,
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#38bdf8',
        background: 'rgba(56, 189, 248, 0.12)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: 4,
        padding: '1px 6px',
        marginBottom: 8,
      }}>
        <span>💳 RAZORPAY PAYMENT SYSTEM</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: isPaid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <CreditCard size={20} color={isPaid ? '#34d399' : '#38bdf8'} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
            {data?.label || 'Razorpay Vendor Payout'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>
            Vendor: {vendor} | ₹{amount}
          </div>
        </div>
      </div>

      <div
        onClick={(e) => {
          if (isPending) {
            e.stopPropagation();
            setModalOpen(true);
          }
        }}
        style={{
          marginTop: 10,
          fontSize: 9,
          fontFamily: 'monospace',
          fontWeight: 700,
          letterSpacing: '0.05em',
          padding: '3px 8px',
          borderRadius: 6,
          background: badgeBg,
          border: `1px solid ${badgeColor}40`,
          color: badgeColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: isPending ? 'pointer' : 'default',
        }}
        title={isPending ? 'Click to enter OTP and approve payout' : undefined}
      >
        <span style={{ color: '#93c5fd' }}>HITL APPROVAL</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isPaid ? (
            <>
              <CheckCircle2 size={12} color="#34d399" /> PAID
            </>
          ) : isRejected ? (
            <>
              <XCircle size={12} color="#fb7185" /> REJECTED
            </>
          ) : (
            <>
              <Clock size={12} color="#fbbf24" style={isPending ? { animation: 'spin 3s linear infinite' } : {}} /> {status}
            </>
          )}
        </span>
      </div>

      {isPending && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setModalOpen(true);
          }}
          style={{
            marginTop: 8,
            width: '100%',
            padding: '5px 8px',
            borderRadius: 6,
            background: '#38bdf8',
            color: '#090d16',
            border: 'none',
            fontSize: 10,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <span>Authorize (Enter OTP) →</span>
        </button>
      )}

      {modalOpen && (
        <ApprovalModal
          isOpen={modalOpen}
          payout={{
            nodeId: id,
            payoutId: data?.payoutId || `pout_${id}`,
            vendor: vendor,
            amount: amount,
            accountNumber: data?.accountNumber || '11214311215411',
            mode: data?.mode || 'NEFT',
          }}
          onClose={() => setModalOpen(false)}
          onApproved={(p) => {
            setStatusOverride('PAID');
            setModalOpen(false);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('payout-approved', {
                detail: {
                  nodeId: id,
                  payoutId: p?.payoutId || data?.payoutId,
                  status: 'PAID',
                }
              }));
            }
          }}
          onRejected={() => {
            setStatusOverride('REJECTED');
            setModalOpen(false);
          }}
        />
      )}

      {/* Source Handles (Right for horizontal flow, Bottom for vertical flow) */}
      <Handle
        type="source"
        position={Position.Right}
        id="out-right"
        style={{
          width: 10,
          height: 10,
          background: '#38bdf8',
          border: '2px solid var(--bg-panel)',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="out-bottom"
        style={{
          width: 10,
          height: 10,
          background: '#38bdf8',
          border: '2px solid var(--bg-panel)',
        }}
      />
    </div>
    </>
  );
}
