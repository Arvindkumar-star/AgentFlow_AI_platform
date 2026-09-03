import { useEffect, useState, useCallback } from 'react';

const TYPE_META = {
  trigger:        { color: '#10b981', label: 'Trigger' },
  gmail:          { color: '#ef4444', label: 'Gmail' },
  slack:          { color: '#818cf8', label: 'Slack' },
  discord:        { color: '#a78bfa', label: 'Discord' },
  'google-sheets':{ color: '#34d399', label: 'Google Sheets' },
  condition:      { color: '#fbbf24', label: 'Condition' },
  action:         { color: '#38bdf8', label: 'Action' },
  notification:   { color: '#67e8f9', label: 'Notification' },
  log:            { color: '#94a3b8', label: 'Log' },
  ai:             { color: '#c084fc', label: 'AI' },
  agentGuard:     { color: '#22d3ee', label: 'AgentGuard ZK Guardrail' },
  agent_guard:    { color: '#22d3ee', label: 'AgentGuard ZK Guardrail' },
  razorpay:       { color: '#38bdf8', label: 'Razorpay Payment System (HITL Payout)' },
  razorpay_payout:{ color: '#38bdf8', label: 'Razorpay Payment System (HITL Payout)' },
  payout:         { color: '#38bdf8', label: 'Razorpay Payment System (HITL Payout)' },
};

export default function NodeConfigPanel({ node, onSave }) {
  const [label,   setLabel]   = useState('');
  const [config,  setConfig]  = useState('{}');
  const [error,   setError]   = useState('');
  const [saved,   setSaved]   = useState(false);   // ← success flash
  const [dirty,   setDirty]   = useState(false);   // ← unsaved changes indicator

  const nodeType = node?.data?.type || node?.type || 'default';
  const rawType = String(node?.data?.type || node?.type || '').toLowerCase();
  const rawLabel = String(node?.data?.label || node?.label || '').toLowerCase();
  const rawId = String(node?.id || '').toLowerCase();

  const isAgentGuard = rawType.includes('agentguard') || rawType.includes('zk') || rawType.includes('guard') || rawLabel.includes('agentguard') || rawLabel.includes('zk') || rawId.includes('agentguard');
  const isRazorpay = rawType.includes('razorpay') || rawType.includes('payout') || rawLabel.includes('razorpay') || rawLabel.includes('payout') || rawId.includes('razorpay');

  const meta = TYPE_META[nodeType] || { color: '#67e8f9', label: nodeType };

  useEffect(() => {
    if (!node) return;
    setLabel(node.data?.label || node.label || '');
    const configData = { ...(node.data || {}) };
    delete configData.label;
    delete configData.type;

    // Prepopulate AgentGuard defaults if not set
    if (isAgentGuard) {
      if (configData.maxLimit === undefined) configData.maxLimit = 10000;
      if (configData.requestedAmount === undefined) configData.requestedAmount = 4200;
      if (configData.targetMerchantId === undefined) configData.targetMerchantId = 1;
      if (configData.allowedMerchantId === undefined) configData.allowedMerchantId = 1;
    }

    // Prepopulate Razorpay Payout defaults if not set
    if (isRazorpay) {
      if (configData.amount === undefined) configData.amount = 4200;
      if (configData.requestedAmount === undefined) configData.requestedAmount = configData.amount || 4200;
      if (configData.vendor === undefined) configData.vendor = 'AWS India';
      if (configData.accountNumber === undefined) configData.accountNumber = '11214311215411';
      if (configData.mode === undefined) configData.mode = 'NEFT';
    }

    setConfig(JSON.stringify(configData, null, 2));
    setError('');
    setDirty(false);
    setSaved(false);
  }, [node?.id, isAgentGuard, isRazorpay]); // only reset when a DIFFERENT node is selected

  const handleSave = useCallback(() => {
    try {
      const parsed = JSON.parse(config || '{}');
      onSave?.({
        ...node,
        label,
        data: {
          ...parsed,
          label,
          type: nodeType,
        },
      });
      setError('');
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('⚠ Configuration must be valid JSON');
    }
  }, [config, label, node, nodeType, onSave]);

  // Ctrl+S shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && node) {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave, node]);

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
        <span style={{ fontSize: '1.5rem', opacity: 0.4 }}>⬡</span>
        <span>Select a node to configure it</span>
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--bg-panel)', border: '1px solid var(--border)',
      borderRadius: '1rem', overflow: 'hidden',
      maxHeight: '580px', overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)',
        background: `${meta.color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: meta.color, fontWeight: 700 }}>
            {meta.label}
          </div>
          <div style={{ marginTop: '0.2rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Configure node
          </div>
        </div>
        {/* Unsaved indicator */}
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

      <div style={{ padding: '1rem' }}>
        {/* Label */}
        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
          Label
        </label>
        <input
          className="input"
          style={{ marginBottom: '1rem' }}
          value={label}
          onChange={e => { setLabel(e.target.value); setDirty(true); setSaved(false); }}
          placeholder="Node label"
        />

        {/* Dedicated Dynamic Inputs for AgentGuard and Razorpay */}
        {isAgentGuard && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-panel-muted)', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#22d3ee', marginBottom: '0.5rem' }}>
              🛡️ Dynamic Policy Guardrails
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                Invoice / Requested Amount (₹)
              </label>
              <input
                type="number"
                className="input"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                value={(() => {
                  try {
                    const p = JSON.parse(config);
                    return p.requestedAmount ?? node.data?.requestedAmount ?? 4200;
                  } catch {
                    return node.data?.requestedAmount ?? 4200;
                  }
                })()}
                onChange={e => {
                  try {
                    const parsed = JSON.parse(config || '{}');
                    const val = Number(e.target.value);
                    parsed.requestedAmount = val;
                    parsed.amount = val;
                    setConfig(JSON.stringify(parsed, null, 2));
                    setDirty(true);
                  } catch {}
                }}
                placeholder="e.g. 50000"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                Maximum Policy Ceiling (₹)
              </label>
              <input
                type="number"
                className="input"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                value={(() => {
                  try {
                    const p = JSON.parse(config);
                    return p.maxLimit ?? node.data?.maxLimit ?? 10000;
                  } catch {
                    return node.data?.maxLimit ?? 10000;
                  }
                })()}
                onChange={e => {
                  try {
                    const parsed = JSON.parse(config || '{}');
                    parsed.maxLimit = Number(e.target.value);
                    setConfig(JSON.stringify(parsed, null, 2));
                    setDirty(true);
                  } catch {}
                }}
                placeholder="e.g. 10000"
              />
            </div>
          </div>
        )}

        {isRazorpay && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-panel-muted)', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.5rem' }}>
              💳 Dynamic Payout Settings
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                Invoice Payout Amount (₹)
              </label>
              <input
                type="number"
                className="input"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                value={(() => {
                  try {
                    const p = JSON.parse(config);
                    return p.amount ?? p.requestedAmount ?? node.data?.amount ?? 4200;
                  } catch {
                    return node.data?.amount ?? 4200;
                  }
                })()}
                onChange={e => {
                  try {
                    const parsed = JSON.parse(config || '{}');
                    const val = Number(e.target.value);
                    parsed.amount = val;
                    parsed.requestedAmount = val;
                    setConfig(JSON.stringify(parsed, null, 2));
                    setDirty(true);
                  } catch {}
                }}
                placeholder="e.g. 50000"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                Vendor / Recipient
              </label>
              <input
                type="text"
                className="input"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                value={(() => {
                  try {
                    const p = JSON.parse(config);
                    return p.vendor ?? node.data?.vendor ?? 'AWS India';
                  } catch {
                    return node.data?.vendor ?? 'AWS India';
                  }
                })()}
                onChange={e => {
                  try {
                    const parsed = JSON.parse(config || '{}');
                    parsed.vendor = e.target.value;
                    setConfig(JSON.stringify(parsed, null, 2));
                    setDirty(true);
                  } catch {}
                }}
                placeholder="e.g. AWS India"
              />
            </div>
          </div>
        )}

        {/* Config JSON */}
        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
          Configuration
          <span style={{ fontSize: '0.65rem', color: 'var(--text-faint)', marginLeft: '0.5rem' }}>JSON</span>
        </label>
        <textarea
          className="input"
          style={{
            minHeight: '140px',
            fontFamily: '"Fira Mono", "Consolas", monospace',
            fontSize: '0.72rem',
            resize: 'vertical',
            borderColor: error ? '#ef4444' : undefined,
          }}
          value={config}
          onChange={e => { setConfig(e.target.value); setError(''); setDirty(true); setSaved(false); }}
        />

        {/* Error */}
        {error && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#ef4444' }}>
            {error}
          </div>
        )}

        {/* Apply button */}
        <button
          className="button"
          style={{
            marginTop: '0.875rem', width: '100%',
            background: saved ? '#10b981' : undefined,
            transition: 'background 0.3s',
          }}
          onClick={handleSave}
        >
          {saved ? '✓ Changes applied!' : 'Apply changes'}
        </button>

        {/* Hint */}
        <p style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-faint)', textAlign: 'center' }}>
          Tip: Press <kbd style={{ background: 'var(--bg-panel-muted)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '3px', padding: '1px 4px', fontSize: '0.65rem' }}>Ctrl+S</kbd> to apply · Then <strong>Save draft</strong> to persist
        </p>
      </div>
    </div>
  );
}
