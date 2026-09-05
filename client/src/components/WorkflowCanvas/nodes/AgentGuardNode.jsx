import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { ShieldCheck, ShieldAlert, Search, Cpu } from 'lucide-react';

export default function AgentGuardNode({ data, selected, id }) {
  const maxLimit = data?.maxLimit !== undefined ? Number(data.maxLimit) : 10000;
  const requestedAmount = data?.requestedAmount !== undefined ? Number(data.requestedAmount) : 4200;

  // Node is clean ONLY if amount is within ceiling AND no active threat is present
  const isWithinBudget = requestedAmount <= maxLimit;
  const isExplicitlyClean = Boolean(
    isWithinBudget &&
    !data?.threatType &&
    !data?.isAttacked &&
    (
      data?.status === 'GROTH16_VERIFIED' ||
      data?.status === 'PROOF_VALID' ||
      data?.status === 'SUCCESS' ||
      data?.isVerified ||
      data?.isPassing ||
      data?.payoutApproved
    )
  );

  const threatType = data?.threatType;
  const isPII = Boolean(
    !isExplicitlyClean && (
      threatType === 'PII_DATA_LEAK' ||
      data?.status === 'PII_LEAK_PREVENTED' ||
      data?.badge === 'PII_LEAK_PREVENTED' ||
      Boolean(data?.payload?.detectedEntities?.length > 0)
    )
  );
  const isPromptInjection = Boolean(
    !isExplicitlyClean && (
      threatType === 'PROMPT_INJECTION' ||
      data?.status === 'PROMPT_INJECTION_DETECTED' ||
      data?.badge === 'PROMPT_INJECTION_DETECTED' ||
      Boolean(data?.payload?.injectedPrompt)
    )
  );
  const isFinancialBreach = Boolean(
    !isWithinBudget || data?.status === 'CONSTRAINT_VIOLATION'
  );
  const isAttacked = Boolean(
    !isExplicitlyClean && (data?.isAttacked || isPII || isPromptInjection || isFinancialBreach)
  );
  const isVerified = Boolean(!isAttacked && isWithinBudget);
  const isPassing = isVerified;
  const breachDelta = data?.breachDeltaINR || (requestedAmount > maxLimit ? requestedAmount - maxLimit : 0);

  const handleInspectClick = (e) => {
    e.stopPropagation();
    const inspectorPayload = {
      id,
      ...data,
      requestedAmount,
      maxLimit,
      breachDeltaINR: breachDelta,
      status: isPII ? 'PII_LEAK_PREVENTED' : isPromptInjection ? 'PROMPT_INJECTION_DETECTED' : isPassing ? 'PROOF_VALID' : 'CONSTRAINT_VIOLATION'
    };
    if (data?.onInspect) {
      data.onInspect(inspectorPayload);
    }
    // Also dispatch global event for canvas drawer listener
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-agentguard-inspector', {
        detail: inspectorPayload
      }));
    }
  };

  return (
    <>
      <style>{`
        @keyframes attackPulse {
          0%, 100% {
            box-shadow: 0 0 25px rgba(244, 63, 94, 0.65), 0 0 50px rgba(244, 63, 94, 0.25);
            border-color: #f43f5e;
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 45px rgba(244, 63, 94, 0.95), 0 0 70px rgba(244, 63, 94, 0.4);
            border-color: #fb7185;
            transform: scale(1.025);
          }
        }
        @keyframes emeraldGlow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.45), 0 0 40px rgba(16, 185, 129, 0.15);
            border-color: #10b981;
          }
          50% {
            box-shadow: 0 0 32px rgba(16, 185, 129, 0.75), 0 0 55px rgba(16, 185, 129, 0.3);
            border-color: #34d399;
          }
        }
      `}</style>
      <div
        style={{
          minWidth: 240,
          padding: '12px 16px',
          borderRadius: 14,
          background: isAttacked ? 'rgba(244, 63, 94, 0.07)' : isPassing ? 'rgba(16, 185, 129, 0.04)' : 'var(--bg-panel)',
          border: `2px solid ${isAttacked ? '#f43f5e' : isPassing ? '#10b981' : selected ? '#22d3ee' : 'rgba(34, 211, 238, 0.4)'}`,
          boxShadow: isAttacked
            ? '0 0 35px rgba(244, 63, 94, 0.7)'
            : isPassing
            ? '0 0 22px rgba(16, 185, 129, 0.45)'
            : selected
            ? '0 0 25px rgba(34, 211, 238, 0.35)'
            : 'var(--shadow)',
          fontFamily: 'inherit',
          color: 'var(--text-primary)',
          position: 'relative',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          animation: isAttacked ? 'attackPulse 1s ease-in-out infinite' : isPassing ? 'emeraldGlow 2.5s ease-in-out infinite' : 'none',
        }}
        className={`agentguard-node shadow-md ${selected ? 'ring-2 ring-cyan-400' : ''}`}
      >
        {/* Target Handles (Left for horizontal flow, Top for vertical flow) */}
        <Handle
          type="target"
          position={Position.Left}
          id="in-left"
          style={{
            width: 10,
            height: 10,
            background: isAttacked ? '#f43f5e' : isPassing ? '#10b981' : '#22d3ee',
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
            background: isAttacked ? '#f43f5e' : isPassing ? '#10b981' : '#22d3ee',
            border: '2px solid var(--bg-panel)',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: isAttacked ? 'rgba(244, 63, 94, 0.2)' : isPassing ? 'rgba(16, 185, 129, 0.18)' : 'rgba(34, 211, 238, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: `1px solid ${isAttacked ? 'rgba(244, 63, 94, 0.5)' : isPassing ? 'rgba(16, 185, 129, 0.4)' : 'rgba(34, 211, 238, 0.3)'}`,
            }}
          >
            {isAttacked ? (
              <ShieldAlert size={22} color="#f43f5e" style={{ animation: 'bounce 0.8s infinite' }} />
            ) : isPassing ? (
              <ShieldCheck size={22} color="#10b981" />
            ) : (
              <ShieldCheck size={22} color="#22d3ee" />
            )}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: isAttacked ? '#f43f5e' : isPassing ? '#10b981' : 'var(--text-primary)', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              <span>{data?.label || 'AgentGuard ZK Node'}</span>
              {isPII && (
                <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(244,63,94,0.25)', color: '#f43f5e', fontWeight: 800, border: '1px solid rgba(244,63,94,0.4)', letterSpacing: '0.04em' }}>
                  PII_LEAK_PREVENTED
                </span>
              )}
              {isPromptInjection && (
                <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(244,63,94,0.25)', color: '#f43f5e', fontWeight: 800, border: '1px solid rgba(244,63,94,0.4)', letterSpacing: '0.04em' }}>
                  PROMPT_INJECTION_DETECTED
                </span>
              )}
              {!isPII && !isPromptInjection && isAttacked && (
                <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: 'rgba(244,63,94,0.2)', color: '#f43f5e', fontWeight: 800 }}>
                  ATTACK DETECTED
                </span>
              )}
              {!isAttacked && isPassing && (
                <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 800 }}>
                  VERIFIED
                </span>
              )}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>
              {isPII ? (
                <span style={{ color: '#fb7185' }}>DLP-704: Credit Card & Secret Key Intercept</span>
              ) : isPromptInjection ? (
                <span style={{ color: '#fb7185' }}>LLM-GUARD-101: System Prompt Hijack Intercept</span>
              ) : (
                <>Max: ₹{(maxLimit || 0).toLocaleString('en-IN')} | Req: <span style={{ color: isAttacked ? '#f43f5e' : isPassing ? '#10b981' : undefined, fontWeight: isAttacked || isPassing ? 700 : undefined }}>₹{(requestedAmount || 0).toLocaleString('en-IN')}</span></>
              )}
            </div>
          </div>
        </div>

        {/* Threat Banner */}
        {isPII && (
          <div
            style={{
              marginTop: 8,
              padding: '4px 6px',
              borderRadius: 6,
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              color: '#f43f5e',
              fontSize: 9,
              fontFamily: 'monospace',
              fontWeight: 800,
              textAlign: 'center',
            }}
          >
            🛡️ OUTBOUND PII & SECRET KEY LEAK INTERCEPTED
          </div>
        )}
        {isPromptInjection && (
          <div
            style={{
              marginTop: 8,
              padding: '4px 6px',
              borderRadius: 6,
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              color: '#f43f5e',
              fontSize: 9,
              fontFamily: 'monospace',
              fontWeight: 800,
              textAlign: 'center',
            }}
          >
            🛡️ MALICIOUS PROMPT INJECTION HIJACK BLOCKED
          </div>
        )}
        {!isPII && !isPromptInjection && isAttacked && breachDelta > 0 && (
          <div
            style={{
              marginTop: 8,
              padding: '3px 6px',
              borderRadius: 6,
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              color: '#f43f5e',
              fontSize: 9,
              fontFamily: 'monospace',
              fontWeight: 800,
              textAlign: 'center',
            }}
          >
            🚨 CEILING BREACH DELTA: +₹{(breachDelta || 0).toLocaleString('en-IN')}
          </div>
        )}

        <div
          style={{
            marginTop: 8,
            fontSize: 9,
            fontFamily: 'monospace',
            fontWeight: 700,
            letterSpacing: '0.05em',
            padding: '4px 8px',
            borderRadius: 6,
            background: isAttacked ? 'rgba(244, 63, 94, 0.12)' : isPassing ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-panel-muted)',
            border: `1px solid ${isAttacked ? 'rgba(244, 63, 94, 0.5)' : isPassing ? 'rgba(16, 185, 129, 0.35)' : 'rgba(34, 211, 238, 0.25)'}`,
            color: isAttacked ? '#f43f5e' : isPassing ? '#10b981' : '#22d3ee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>
            {isPII 
              ? 'STATUS: PII_LEAK_PREVENTED' 
              : isPromptInjection 
              ? 'STATUS: PROMPT_INJECTION_DETECTED' 
              : isAttacked 
              ? 'STATUS: CONSTRAINT_VIOLATION' 
              : isPassing 
              ? 'STATUS: GROTH16_VERIFIED' 
              : 'STATUS: ARMED / READY'}
          </span>
          <span style={{ fontSize: 8, opacity: 0.9, color: isAttacked ? '#f43f5e' : isPassing ? '#10b981' : '#c084fc', fontWeight: 800 }}>
            {isPII ? 'DLP_HALT' : isPromptInjection ? 'AI_FIREWALL_HALT' : isAttacked ? 'ZK_FIREWALL_BLOCKED' : isPassing ? 'BN128 / GROTH16' : 'ZK FIREWALL'}
          </span>
        </div>

      {/* Inspect Trigger Button */}
      <button
        onClick={handleInspectClick}
        style={{
          marginTop: 8,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          padding: '4px 6px',
          background: 'rgba(34, 211, 238, 0.1)',
          border: '1px solid rgba(34, 211, 238, 0.25)',
          borderRadius: 6,
          color: '#38bdf8',
          fontSize: 10,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(34, 211, 238, 0.2)';
          e.currentTarget.style.borderColor = '#38bdf8';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(34, 211, 238, 0.1)';
          e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.25)';
        }}
      >
        <Search size={11} />
        <span>Inspect ZK Proof</span>
      </button>

      {/* Source Handles (Right for horizontal flow, Bottom for vertical flow) */}
      <Handle
        type="source"
        position={Position.Right}
        id="out-right"
        style={{
          width: 10,
          height: 10,
          background: '#22d3ee',
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
          background: '#22d3ee',
          border: '2px solid var(--bg-panel)',
        }}
      />
    </div>
    </>
  );
}
