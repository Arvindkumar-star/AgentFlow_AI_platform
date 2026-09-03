import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, Lock, AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function ApprovalModal({ isOpen, onClose, payout, onApproved, onRejected }) {
  const [mounted, setMounted] = useState(false);
  const [otp, setOtp] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setOtp('123456');
      setError('');
      setSuccess('');
      setLoading(false);
    }
  }, [isOpen, payout]);

  if (!mounted || !isOpen || !payout) return null;

  const handleApprove = async () => {
    if (otp.trim() !== '123456') {
      setError('Invalid OTP. Please enter the authorized 6-digit OTP (123456).');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/payouts/approve', {
        payoutId: payout.payoutId || payout.id,
        otp: otp.trim(),
        executionId: payout.executionId,
        nodeId: payout.nodeId,
      });

      setSuccess('✓ Payout Approved & Executed on Razorpay network!');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('payout-approved', {
          detail: {
            payoutId: payout.payoutId || payout.id,
            nodeId: payout.nodeId,
            status: 'PAID',
            amount: payout.amount,
            vendor: payout.vendor,
          }
        }));
      }
      setTimeout(() => {
        onApproved && onApproved(res.data?.payout || payout);
        onClose && onClose();
      }, 600);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Approval failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/payouts/reject', {
        payoutId: payout.payoutId || payout.id,
        executionId: payout.executionId,
        nodeId: payout.nodeId,
        reason: 'Operator rejected via HITL modal',
      });

      setSuccess('Payout rejected. Execution safely cancelled.');
      setTimeout(() => {
        onRejected && onRejected(res.data?.payout || payout);
        onClose && onClose();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Rejection failed');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(3, 7, 18, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out',
        boxSizing: 'border-box',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          maxHeight: 'calc(100vh - 2rem)',
          overflowY: 'auto',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6), 0 0 35px rgba(56, 189, 248, 0.15)',
          fontFamily: 'inherit',
          color: 'var(--text-primary)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            background: 'linear-gradient(180deg, rgba(56, 189, 248, 0.08) 0%, transparent 100%)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Lock size={20} color="#38bdf8" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Financial Execution Approval Required
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Human-in-the-Loop (HITL) authorization for Razorpay sandbox payout
            </p>
          </div>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {/* Security Context Box */}
          <div
            style={{
              background: 'var(--bg-panel-muted)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700 }}>
                TRANSACTION DETAILS
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#10b981',
                  borderRadius: '999px',
                  padding: '2px 8px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                }}
              >
                <ShieldCheck size={12} />
                AgentGuard ZK Proof: VERIFIED
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Vendor / Recipient</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {payout.vendor || payout.vendor_name || 'AWS India'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Amount Due</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0284c7', marginTop: '1px' }}>
                  ₹{payout.amount || 0}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Bank Account</div>
                <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {payout.accountNumber || '11214311215411'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Transfer Mode</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {payout.mode || 'NEFT'} · Instant Clearing
                </div>
              </div>
            </div>
          </div>

          {/* OTP Input Field */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Enter 6-Digit Authorization OTP
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value);
                  setError('');
                }}
                placeholder="123456"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'var(--bg-panel-muted)',
                  border: `1px solid ${error ? '#fb7185' : 'var(--border)'}`,
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  fontSize: '1.25rem',
                  fontFamily: 'monospace',
                  letterSpacing: '0.3em',
                  textAlign: 'center',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxShadow: error ? '0 0 10px rgba(251, 113, 133, 0.3)' : 'none',
                }}
              />
            </div>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Default mock authorization OTP is <strong style={{ color: 'var(--accent)' }}>123456</strong>
            </p>
          </div>

          {/* Error / Success Feedback */}
          {error && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.625rem 0.875rem',
                borderRadius: '8px',
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.35)',
                color: '#fb7185',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} flexShrink={0} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.625rem 0.875rem',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#34d399',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 size={16} flexShrink={0} />
              <span>{success}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              onClick={handleReject}
              disabled={loading || !!success}
              style={{
                padding: '0.625rem 1rem',
                borderRadius: '10px',
                background: 'transparent',
                border: '1px solid rgba(244, 63, 94, 0.5)',
                color: '#fb7185',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: loading || success ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!loading && !success) {
                  e.currentTarget.style.background = 'rgba(244, 63, 94, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <XCircle size={16} />
              Reject & Cancel
            </button>

            <button
              onClick={handleApprove}
              disabled={loading || !!success}
              style={{
                padding: '0.625rem 1rem',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: loading || success ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!loading && !success) {
                  e.currentTarget.style.filter = 'brightness(1.1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'none';
                e.currentTarget.style.transform = 'none';
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Approve & Execute
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
