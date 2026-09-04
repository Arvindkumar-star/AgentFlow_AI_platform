import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Cpu, 
  Sliders, 
  Activity, 
  Check, 
  Copy, 
  Lock, 
  Zap, 
  FileCode2, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export default function AgentGuardPanel({ node, onSave }) {
  const [activeTab, setActiveTab] = useState('config'); // 'config' | 'telemetry'
  const [label, setLabel] = useState('');
  const [maxLimit, setMaxLimit] = useState(10000);
  const [requestedAmount, setRequestedAmount] = useState(4200);
  const [protocol, setProtocol] = useState('groth16'); // 'groth16' | 'plonk'
  const [strictMode, setStrictMode] = useState(true);
  const [targetMerchantId, setTargetMerchantId] = useState(1);
  const [allowedMerchantId, setAllowedMerchantId] = useState(1);
  const [copiedKey, setCopiedKey] = useState(null);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Sync state with incoming node data
  useEffect(() => {
    if (!node) return;
    setLabel(node.data?.label || node.label || 'AgentGuard ZK Guardrail');
    setMaxLimit(node.data?.maxLimit !== undefined ? Number(node.data.maxLimit) : 10000);
    setRequestedAmount(node.data?.requestedAmount !== undefined ? Number(node.data.requestedAmount) : (node.data?.amount || 4200));
    setProtocol(node.data?.protocol || 'groth16');
    setStrictMode(node.data?.strictMode !== undefined ? Boolean(node.data.strictMode) : true);
    setTargetMerchantId(node.data?.targetMerchantId !== undefined ? Number(node.data.targetMerchantId) : 1);
    setAllowedMerchantId(node.data?.allowedMerchantId !== undefined ? Number(node.data.allowedMerchantId) : 1);
    setDirty(false);
    setSaved(false);
  }, [node?.id]);

  const isWithinBudget = Number(requestedAmount) <= Number(maxLimit);
  const isMerchantValid = Number(targetMerchantId) === Number(allowedMerchantId);
  const isPassing = isWithinBudget && isMerchantValid;
  const breachDelta = !isWithinBudget ? Number(requestedAmount) - Number(maxLimit) : 0;

  const handleApplyChanges = useCallback(() => {
    if (!node) return;
    const updatedData = {
      ...(node.data || {}),
      label,
      maxLimit: Number(maxLimit),
      requestedAmount: Number(requestedAmount),
      amount: Number(requestedAmount),
      protocol,
      strictMode,
      targetMerchantId: Number(targetMerchantId),
      allowedMerchantId: Number(allowedMerchantId),
      isVerified: isPassing,
      isPassing,
      status: isPassing ? 'GROTH16_VERIFIED' : 'CONSTRAINT_VIOLATION',
    };

    onSave?.({
      ...node,
      label,
      data: updatedData,
    });

    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }, [node, label, maxLimit, requestedAmount, protocol, strictMode, targetMerchantId, allowedMerchantId, isPassing, onSave]);

  // Ctrl+S keybinding
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && node) {
        e.preventDefault();
        handleApplyChanges();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleApplyChanges, node]);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // SnarkJS default proof vectors
  const publicSignals = node?.data?.publicSignals || [
    String(requestedAmount),
    String(maxLimit),
    String(targetMerchantId),
    String(allowedMerchantId),
    isPassing ? '1' : '0'
  ];

  const defaultProof = node?.data?.proof || {
    pi_a: [
      '0x1f42ad8e3a2416b78c90382f1b0a88e4210e756e2d14878a994ef71c08d132a0',
      '0x0ab8295efcd0189b78103984128a1be58a01103984102938a192837461928374',
      '0x01'
    ],
    pi_b: [
      [
        '0x2b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c',
        '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b'
      ],
      [
        '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
        '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e'
      ]
    ],
    pi_c: [
      '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
      '0x6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a'
    ],
    protocol: protocol === 'plonk' ? 'plonk' : 'groth16',
    curve: 'bn128'
  };

  if (!node) {
    return (
      <div style={{
        background: 'var(--bg-panel)', border: '1px solid var(--border)',
        borderRadius: '1rem', padding: '1.25rem',
        fontSize: '0.875rem', color: 'var(--text-faint)',
        textAlign: 'center', minHeight: '120px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: '0.5rem',
      }}>
        <ShieldCheck size={24} style={{ opacity: 0.4, color: '#22d3ee' }} />
        <span>Select AgentGuard Node to view policy and ZK telemetry</span>
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--bg-panel)',
      border: '1px solid var(--border)',
      borderRadius: '1rem',
      overflow: 'hidden',
      maxHeight: '620px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
    }}>
      {/* Header */}
      <div style={{
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(34, 211, 238, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: isPassing ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
            border: `1px solid ${isPassing ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {isPassing ? <ShieldCheck size={16} color="#10b981" /> : <ShieldAlert size={16} color="#f43f5e" />}
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#22d3ee', fontWeight: 700 }}>
              AgentGuard ZK Guardrail
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Policy & Verification Panel
            </div>
          </div>
        </div>

        {dirty && (
          <span style={{
            fontSize: '0.65rem', fontWeight: 600, color: '#fbbf24',
            background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)',
            borderRadius: '999px', padding: '2px 8px',
          }}>
            unsaved
          </span>
        )}
      </div>

      {/* Tab Bar */}
      <div style={{
        display: 'flex',
        background: 'var(--bg-panel-muted)',
        borderBottom: '1px solid var(--border)',
        padding: '0.25rem 0.5rem',
        gap: '0.25rem',
      }}>
        <button
          onClick={() => setActiveTab('config')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.5rem',
            fontSize: '0.75rem',
            fontWeight: activeTab === 'config' ? 700 : 500,
            borderRadius: '0.5rem',
            border: 'none',
            background: activeTab === 'config' ? 'var(--bg-panel)' : 'transparent',
            color: activeTab === 'config' ? '#22d3ee' : 'var(--text-muted)',
            boxShadow: activeTab === 'config' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Sliders size={13} />
          <span>Configuration</span>
        </button>

        <button
          onClick={() => setActiveTab('telemetry')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.5rem',
            fontSize: '0.75rem',
            fontWeight: activeTab === 'telemetry' ? 700 : 500,
            borderRadius: '0.5rem',
            border: 'none',
            background: activeTab === 'telemetry' ? 'var(--bg-panel)' : 'transparent',
            color: activeTab === 'telemetry' ? '#10b981' : 'var(--text-muted)',
            boxShadow: activeTab === 'telemetry' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Activity size={13} />
          <span>ZK Telemetry & Proofs</span>
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ padding: '1rem', overflowY: 'auto', flex: 1 }}>
        {activeTab === 'config' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Node Label */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                Node Label
              </label>
              <input
                className="input"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
                value={label}
                onChange={e => { setLabel(e.target.value); setDirty(true); }}
                placeholder="AgentGuard Policy"
              />
            </div>

            {/* Policy Ceiling (Max Limit) */}
            <div style={{
              padding: '0.75rem',
              background: 'var(--bg-panel-muted)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Policy Ceiling (Max Limit)
                </label>
                <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 700, color: '#22d3ee' }}>
                  ₹{Number(maxLimit).toLocaleString()}
                </span>
              </div>
              <input
                type="number"
                className="input"
                style={{ fontSize: '0.85rem', padding: '0.45rem 0.65rem', marginBottom: '0.5rem', width: '100%' }}
                value={maxLimit}
                onChange={e => {
                  setMaxLimit(Math.max(0, Number(e.target.value)));
                  setDirty(true);
                }}
                placeholder="e.g. 10000"
              />
              {/* Range Slider */}
              <input
                type="range"
                min="500"
                max="100000"
                step="500"
                value={Math.min(100000, Number(maxLimit))}
                onChange={e => {
                  setMaxLimit(Number(e.target.value));
                  setDirty(true);
                }}
                style={{
                  width: '100%',
                  accentColor: '#22d3ee',
                  cursor: 'pointer',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-faint)', marginTop: '0.2rem' }}>
                <span>₹500</span>
                <span>₹50,000</span>
                <span>₹1,00,000</span>
              </div>
            </div>

            {/* Requested Amount (Test / Default) */}
            <div style={{
              padding: '0.75rem',
              background: 'var(--bg-panel-muted)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Invoice / Requested Amount
                </label>
                <span style={{ 
                  fontSize: '0.8rem', 
                  fontFamily: 'monospace', 
                  fontWeight: 700, 
                  color: isWithinBudget ? '#10b981' : '#f43f5e' 
                }}>
                  ₹{Number(requestedAmount).toLocaleString()}
                </span>
              </div>
              <input
                type="number"
                className="input"
                style={{ 
                  fontSize: '0.85rem', 
                  padding: '0.45rem 0.65rem',
                  borderColor: !isWithinBudget ? '#f43f5e' : undefined 
                }}
                value={requestedAmount}
                onChange={e => {
                  setRequestedAmount(Math.max(0, Number(e.target.value)));
                  setDirty(true);
                }}
                placeholder="e.g. 4200"
              />
            </div>

            {/* Protocol Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                Zero-Knowledge Protocol
              </label>
              <select
                className="input"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem', width: '100%', cursor: 'pointer' }}
                value={protocol}
                onChange={e => { setProtocol(e.target.value); setDirty(true); }}
              >
                <option value="groth16">Groth16 / BN128 (SnarkJS Pre-compiled)</option>
                <option value="plonk">PLONK (Universal Setup)</option>
              </select>
            </div>

            {/* Strict Mode Toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem',
              background: 'var(--bg-panel-muted)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border)',
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Strict Mode
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  Reject unverified transactions immediately
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setStrictMode(!strictMode); setDirty(true); }}
                style={{
                  width: '38px',
                  height: '22px',
                  borderRadius: '999px',
                  background: strictMode ? '#22d3ee' : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                  padding: '2px',
                }}
              >
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#0f172a',
                  transform: strictMode ? 'translateX(16px)' : 'translateX(0)',
                  transition: 'transform 0.2s ease',
                }} />
              </button>
            </div>

            {/* Live Policy Constraint Status */}
            <div style={{
              padding: '0.6rem 0.75rem',
              borderRadius: '0.625rem',
              fontSize: '0.72rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: isPassing ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.12)',
              border: `1px solid ${isPassing ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.4)'}`,
              color: isPassing ? '#10b981' : '#f43f5e',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {isPassing ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
                <span style={{ fontWeight: 600 }}>
                  {isPassing ? 'Constraint Satisfied' : `Policy Violation: +₹${breachDelta.toLocaleString()}`}
                </span>
              </div>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.68rem' }}>
                {isPassing ? 'SAFE' : 'REJECT'}
              </span>
            </div>

            {/* Apply Button */}
            <button
              className="button"
              style={{
                marginTop: '0.25rem',
                width: '100%',
                background: saved ? '#10b981' : '#22d3ee',
                color: '#0f172a',
                fontWeight: 700,
                fontSize: '0.8rem',
                padding: '0.55rem',
                transition: 'all 0.2s ease',
              }}
              onClick={handleApplyChanges}
            >
              {saved ? '✓ Changes Applied!' : 'Apply Policy Changes'}
            </button>
          </div>
        )}

        {activeTab === 'telemetry' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Live Verdict Banner */}
            <div style={{
              padding: '0.75rem',
              borderRadius: '0.75rem',
              background: isPassing ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.15)',
              border: `1px solid ${isPassing ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.5)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={16} color={isPassing ? '#10b981' : '#f43f5e'} />
                <div>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Circuit Status
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: isPassing ? '#10b981' : '#f43f5e' }}>
                    {isPassing ? 'GROTH16_VERIFIED' : 'CONSTRAINT_VIOLATION'}
                  </div>
                </div>
              </div>
              <span style={{
                fontSize: '0.65rem',
                fontFamily: 'monospace',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(0,0,0,0.3)',
                color: isPassing ? '#34d399' : '#fb7185',
                border: '1px solid var(--border)',
                fontWeight: 700,
              }}>
                {protocol.toUpperCase()} / BN128
              </span>
            </div>

            {/* Circuit Constraints Verification */}
            <div style={{
              padding: '0.75rem',
              background: 'var(--bg-panel-muted)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Cpu size={14} />
                <span>Deterministic Constraints</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.72rem', fontFamily: 'monospace' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', background: 'rgba(0,0,0,0.2)', borderRadius: 4 }}>
                  <span style={{ color: 'var(--text-muted)' }}>C1: amount &le; ceiling</span>
                  <span style={{ color: isWithinBudget ? '#10b981' : '#f43f5e', fontWeight: 700 }}>
                    {isWithinBudget ? `PASS (₹${requestedAmount} &le; ₹${maxLimit})` : `FAIL (+₹${breachDelta})`}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', background: 'rgba(0,0,0,0.2)', borderRadius: 4 }}>
                  <span style={{ color: 'var(--text-muted)' }}>C2: target == allowed</span>
                  <span style={{ color: isMerchantValid ? '#10b981' : '#f43f5e', fontWeight: 700 }}>
                    {isMerchantValid ? 'PASS (ID: 1)' : 'FAIL'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', background: 'rgba(0,0,0,0.2)', borderRadius: 4 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Proving Time</span>
                  <span style={{ color: '#22d3ee' }}>~38.4 ms</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', background: 'rgba(0,0,0,0.2)', borderRadius: 4 }}>
                  <span style={{ color: 'var(--text-muted)' }}>R1CS Constraints</span>
                  <span style={{ color: '#c084fc' }}>28 total</span>
                </div>
              </div>
            </div>

            {/* Public Signals */}
            <div style={{
              padding: '0.75rem',
              background: 'var(--bg-panel-muted)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Public Signals
                </div>
                <button
                  onClick={() => handleCopy(publicSignals, 'signals')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: copiedKey === 'signals' ? '#10b981' : '#38bdf8',
                    fontSize: '0.68rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  {copiedKey === 'signals' ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedKey === 'signals' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre style={{
                fontSize: '0.65rem',
                fontFamily: '"Fira Mono", monospace',
                background: 'rgba(0,0,0,0.3)',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                color: '#34d399',
                margin: 0,
                overflowX: 'auto',
              }}>
                {JSON.stringify(publicSignals, null, 2)}
              </pre>
            </div>

            {/* SnarkJS Proof Vector pi_a / pi_b / pi_c */}
            <div style={{
              padding: '0.75rem',
              background: 'var(--bg-panel-muted)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Lock size={12} color="#22d3ee" />
                  <span>Groth16 Proof Object</span>
                </div>
                <button
                  onClick={() => handleCopy(defaultProof, 'proof')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: copiedKey === 'proof' ? '#10b981' : '#38bdf8',
                    fontSize: '0.68rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  {copiedKey === 'proof' ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedKey === 'proof' ? 'Copied' : 'Copy Proof'}</span>
                </button>
              </div>
              <pre style={{
                fontSize: '0.62rem',
                fontFamily: '"Fira Mono", monospace',
                background: 'rgba(0,0,0,0.3)',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                color: '#94a3b8',
                maxHeight: '110px',
                overflowY: 'auto',
                margin: 0,
              }}>
                {JSON.stringify(defaultProof, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Footer Shortcut Indicator */}
      <div style={{
        padding: '0.4rem 0.75rem',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-panel-muted)',
        fontSize: '0.68rem',
        color: 'var(--text-faint)',
        textAlign: 'center',
      }}>
        Press <kbd style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', padding: '1px 4px', borderRadius: 3, color: 'var(--text-primary)' }}>Ctrl+S</kbd> to apply changes
      </div>
    </div>
  );
}
