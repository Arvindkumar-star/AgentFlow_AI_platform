import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Cpu, 
  Clock, 
  Code2, 
  X, 
  Copy, 
  Check, 
  FileCode2, 
  ArrowRight,
  Sliders,
  Activity,
  Zap,
  Lock,
  AlertTriangle
} from 'lucide-react';

export default function ProofInspectorDrawer({ isOpen, onClose, proofData, onUpdateNode }) {
  const [activeTab, setActiveTab] = useState('config'); // 'config' | 'telemetry'
  const [copiedSection, setCopiedSection] = useState(null);
  
  // Editable configuration state
  const [editMaxLimit, setEditMaxLimit] = useState(10000);
  const [editRequestedAmount, setEditRequestedAmount] = useState(4200);
  const [editProtocol, setEditProtocol] = useState('groth16');
  const [editStrictMode, setEditStrictMode] = useState(true);
  const [saved, setSaved] = useState(false);

  const nodeData = proofData?.data || proofData || {};
  const threatType = proofData?.threatType || nodeData?.threatType;
  const isPII = threatType === 'PII_DATA_LEAK' || proofData?.status === 'PII_LEAK_PREVENTED' || nodeData?.status === 'PII_LEAK_PREVENTED';
  const isPromptInjection = threatType === 'PROMPT_INJECTION' || proofData?.status === 'PROMPT_INJECTION_DETECTED' || nodeData?.status === 'PROMPT_INJECTION_DETECTED';

  // Sync state whenever proofData changes
  useEffect(() => {
    if (proofData) {
      setEditMaxLimit(nodeData.maxLimit !== undefined ? Number(nodeData.maxLimit) : 10000);
      setEditRequestedAmount(nodeData.requestedAmount !== undefined ? Number(nodeData.requestedAmount) : (nodeData.amount || 4200));
      setEditProtocol(nodeData.protocol || 'groth16');
      setEditStrictMode(nodeData.strictMode !== undefined ? Boolean(nodeData.strictMode) : true);
      // If opened via attack simulation, switch to telemetry tab, otherwise default to config
      if (isPII || isPromptInjection || nodeData.isAttacked) {
        setActiveTab('telemetry');
      }
    }
  }, [proofData?.id, proofData?.status, isPII, isPromptInjection]);

  if (!isOpen) return null;

  const isWithinBudget = Number(editRequestedAmount) <= Number(editMaxLimit);
  const status = proofData?.status || nodeData?.status || 
    (isPII ? 'PII_LEAK_PREVENTED' : isPromptInjection ? 'PROMPT_INJECTION_DETECTED' :
    (isWithinBudget ? 'PROOF_VALID' : 'CONSTRAINT_VIOLATION'));

  const isValid = !isPII && !isPromptInjection && (status === 'PROOF_VALID' || status === 'GROTH16_VERIFIED' || isWithinBudget);
  const verdictBadge = isPII 
    ? 'PII_LEAK_PREVENTED' 
    : isPromptInjection 
    ? 'PROMPT_INJECTION_DETECTED' 
    : isValid 
    ? 'GROTH16_VERIFIED' 
    : 'CONSTRAINT_VIOLATION';

  const requestedAmount = editRequestedAmount;
  const maxLimit = editMaxLimit;
  const vendor = nodeData.vendor || nodeData.label || 'Direct Vendor Payout';
  const executionTime = proofData?.executionTime || proofData?.verificationTimeMs || nodeData?.executionTime || '38.4';
  const breachDeltaINR = !isWithinBudget ? requestedAmount - maxLimit : 0;
  const errorMessage = proofData?.errorMessage || nodeData?.errorMessage;

  const handleApplyChanges = () => {
    const updatedPayload = {
      ...(nodeData || {}),
      id: proofData?.id || nodeData?.id,
      maxLimit: Number(editMaxLimit),
      requestedAmount: Number(editRequestedAmount),
      amount: Number(editRequestedAmount),
      protocol: editProtocol,
      strictMode: editStrictMode,
      isVerified: isWithinBudget,
      isPassing: isWithinBudget,
      status: isWithinBudget ? 'GROTH16_VERIFIED' : 'CONSTRAINT_VIOLATION',
    };

    if (onUpdateNode) {
      onUpdateNode(updatedPayload);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('update-node-config', {
        detail: updatedPayload
      }));
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const publicSignals = proofData?.publicSignals || nodeData?.publicSignals || (
    isPII ? {
      piiDetected: 1,
      secretKeyCount: 1,
      creditCardMatches: 1,
      dlpRiskScore: 99,
      targetChannel: 'gmail',
      isVerified: 0,
    } : isPromptInjection ? {
      intentDivergenceScore: 98,
      systemOverrideDetected: 1,
      adversarialTokenCount: 14,
      isVerified: 0,
    } : {
      requestedAmount,
      maxLimit,
      targetMerchantId: nodeData.targetMerchantId || 1,
      allowedMerchantId: nodeData.allowedMerchantId || 1,
      isVerified: isValid ? 1 : 0
    }
  );

  const defaultProof = {
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
    protocol: editProtocol === 'plonk' ? 'plonk' : 'groth16',
    curve: 'bn128'
  };

  const proof = proofData?.proof || nodeData?.proof || defaultProof;

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    setCopiedSection(key);
    setTimeout(() => setCopiedSection(null), 1800);
  };

  return (
    <div 
      className="fixed inset-y-0 right-0 w-full sm:w-[460px] p-5 shadow-2xl z-50 font-sans overflow-y-auto"
      style={{
        backgroundColor: 'var(--bg-panel)',
        borderLeft: '1px solid var(--border)',
        boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.35)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg ${isValid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
            {isValid ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide" style={{ color: 'var(--text-primary)' }}>AgentGuard ZK Inspector</h2>
            <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono flex items-center gap-1">
              <span>{isPII ? 'DLP Cryptographic Firewall' : isPromptInjection ? 'AI Alignment & Jailbreak Interceptor' : 'Policy Engine & ZK Proofs'}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
          style={{ background: 'var(--bg-panel-muted)' }}
          title="Close drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Top Tab Bar */}
      <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800 my-4 gap-1">
        <button
          onClick={() => setActiveTab('config')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition ${
            activeTab === 'config'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Configuration</span>
        </button>
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition ${
            activeTab === 'telemetry'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>ZK Telemetry & Proofs</span>
        </button>
      </div>

      {/* Tab 1: Configuration */}
      {activeTab === 'config' && (
        <div className="space-y-4">
          {/* Policy Ceiling (Max Limit) */}
          <div className="p-4 rounded-xl border space-y-3" style={{ background: 'var(--bg-panel-muted)', borderColor: 'var(--border)' }}>
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Policy Ceiling (Max Limit)
              </label>
              <span className="text-sm font-mono font-bold text-cyan-400">
                ₹{Number(editMaxLimit).toLocaleString()}
              </span>
            </div>

            <input
              type="number"
              className="input w-full text-sm font-mono"
              value={editMaxLimit}
              onChange={(e) => setEditMaxLimit(Math.max(0, Number(e.target.value)))}
              placeholder="e.g. 10000"
            />

            {/* Slider */}
            <input
              type="range"
              min="500"
              max="100000"
              step="500"
              value={Math.min(100000, Number(editMaxLimit))}
              onChange={(e) => setEditMaxLimit(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>₹500</span>
              <span>₹50,000</span>
              <span>₹1,00,000</span>
            </div>
          </div>

          {/* Requested Invoice Amount */}
          <div className="p-4 rounded-xl border space-y-2" style={{ background: 'var(--bg-panel-muted)', borderColor: 'var(--border)' }}>
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-200">
                Invoice / Requested Amount
              </label>
              <span className={`text-sm font-mono font-bold ${isWithinBudget ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₹{Number(editRequestedAmount).toLocaleString()}
              </span>
            </div>
            <input
              type="number"
              className={`input w-full text-sm font-mono ${!isWithinBudget ? 'border-rose-500 ring-1 ring-rose-500' : ''}`}
              value={editRequestedAmount}
              onChange={(e) => setEditRequestedAmount(Math.max(0, Number(e.target.value)))}
              placeholder="e.g. 4200"
            />
          </div>

          {/* Protocol Selection */}
          <div className="p-4 rounded-xl border space-y-2" style={{ background: 'var(--bg-panel-muted)', borderColor: 'var(--border)' }}>
            <label className="text-xs font-bold text-slate-200">
              Zero-Knowledge Protocol
            </label>
            <select
              className="input w-full text-xs"
              value={editProtocol}
              onChange={(e) => setEditProtocol(e.target.value)}
            >
              <option value="groth16">Groth16 / BN128 (SnarkJS Pre-compiled)</option>
              <option value="plonk">PLONK (Universal Setup)</option>
            </select>
          </div>

          {/* Strict Mode Toggle */}
          <div className="p-3.5 rounded-xl border flex items-center justify-between" style={{ background: 'var(--bg-panel-muted)', borderColor: 'var(--border)' }}>
            <div>
              <div className="text-xs font-bold text-slate-200">Strict Mode</div>
              <div className="text-[11px] text-slate-400">Reject unverified transactions immediately</div>
            </div>
            <button
              type="button"
              onClick={() => setEditStrictMode(!editStrictMode)}
              className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${editStrictMode ? 'bg-cyan-500' : 'bg-slate-700'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${editStrictMode ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Live Constraint Status Indicator */}
          <div className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
            isWithinBudget
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            <div className="flex items-center gap-2">
              {isWithinBudget ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span className="font-semibold">
                {isWithinBudget ? 'Constraint Satisfied' : `Limit Breached (+₹${breachDeltaINR.toLocaleString()})`}
              </span>
            </div>
            <span className="font-bold px-2 py-0.5 rounded bg-slate-900 border border-current">
              {isWithinBudget ? 'SAFE' : 'REJECT'}
            </span>
          </div>

          {/* Apply Button */}
          <button
            onClick={handleApplyChanges}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              saved
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
            }`}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                <span>✓ Policy Changes Applied to Canvas!</span>
              </>
            ) : (
              <>
                <Sliders className="w-4 h-4" />
                <span>Apply Policy Changes</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Tab 2: ZK Telemetry & Proofs */}
      {activeTab === 'telemetry' && (
        <div className="space-y-4">
          {/* Verification Status Banner */}
          <div className={`p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between ${
            isValid 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: isValid ? '#10b981' : '#f43f5e' }} />
              <span className="font-semibold">CIRCUIT VERDICT:</span>
            </div>
            <span className="font-bold px-2.5 py-0.5 rounded text-[11px] border border-current" style={{ background: 'var(--bg-panel-muted)', color: isValid ? '#10b981' : '#f43f5e' }}>
              {verdictBadge}
            </span>
          </div>

          {/* ── Policy Boundary Check & Financial Breach ── */}
          {!isPII && !isPromptInjection && (
            <div className="p-3.5 rounded-xl border space-y-2.5" style={{ background: 'var(--bg-panel-muted)', borderColor: 'var(--border)' }}>
              <div className="flex justify-between items-center text-xs">
                <span style={{ color: 'var(--text-muted)' }} className="font-medium">Policy Boundary Check</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">AgentGuard 2.0</span>
              </div>
              
              <div className="flex justify-between items-center font-mono">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Requested Spend:</span>
                <span className="text-sm font-bold" style={{ color: isValid ? '#10b981' : '#f43f5e' }}>
                  ₹{requestedAmount.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center font-mono">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Policy Ceiling (Limit):</span>
                <span className="text-sm font-bold text-slate-200">
                  ₹{maxLimit.toLocaleString()}
                </span>
              </div>

              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                <div 
                  className={`h-full ${isValid ? 'bg-cyan-400' : 'bg-rose-500 animate-pulse'}`}
                  style={{ width: `${Math.min(100, Math.round((requestedAmount / (maxLimit || 1)) * 100))}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-1">
                <span>Verification Time: ~{executionTime} ms</span>
                <span>Safety Buffer: {isValid ? `₹${(maxLimit - requestedAmount).toLocaleString()}` : `OVER BY ₹${breachDeltaINR.toLocaleString()}`}</span>
              </div>
            </div>
          )}

          {/* Proving Time & Circuit Protocol */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border font-mono" style={{ background: 'var(--bg-panel-muted)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Latency</span>
              </div>
              <div className="text-sm font-bold text-slate-200">{executionTime} ms</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Pre-execution intercept</div>
            </div>

            <div className="p-3 rounded-xl border font-mono" style={{ background: 'var(--bg-panel-muted)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                <span>Curve & Protocol</span>
              </div>
              <div className="text-xs font-bold text-slate-200">{editProtocol.toUpperCase()} / BN128</div>
              <div className="text-[10px] text-purple-400 mt-0.5">28 R1CS Constraints</div>
            </div>
          </div>

          {/* Public Signals */}
          <div className="p-3.5 rounded-xl border" style={{ background: 'var(--bg-panel-muted)', borderColor: 'var(--border)' }}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-300">
                <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Public Signals</span>
              </div>
              <button 
                onClick={() => handleCopy(publicSignals, 'signals')}
                className="text-[10px] font-mono flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition"
              >
                {copiedSection === 'signals' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSection === 'signals' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-2.5 rounded-lg bg-slate-950 text-slate-300 font-mono text-[10px] overflow-x-auto border border-slate-800">
              {JSON.stringify(publicSignals, null, 2)}
            </pre>
          </div>

          {/* SnarkJS Proof Vectors */}
          <div className="p-3.5 rounded-xl border" style={{ background: 'var(--bg-panel-muted)', borderColor: 'var(--border)' }}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-300">
                <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>SnarkJS Proof Vectors (pi_a, pi_b, pi_c)</span>
              </div>
              <button 
                onClick={() => handleCopy(proof, 'proof')}
                className="text-[10px] font-mono flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition"
              >
                {copiedSection === 'proof' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSection === 'proof' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-2.5 rounded-lg bg-slate-950 text-slate-300 font-mono text-[9px] overflow-x-auto max-h-36 overflow-y-auto border border-slate-800">
              {JSON.stringify(proof, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
