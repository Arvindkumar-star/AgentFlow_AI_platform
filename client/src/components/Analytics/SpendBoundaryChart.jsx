import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';

export default function SpendBoundaryChart({ auditLogs = [] }) {
  const [hoveredLog, setHoveredLog] = useState(null);

  // Take the most recent 6 logs for clear visual rendering
  const displayLogs = Array.isArray(auditLogs) ? auditLogs.slice(0, 6) : [];

  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow)',
      }}
      className="p-6 rounded-2xl font-sans"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-500" />
            <h3 className="text-base font-bold tracking-wide" style={{ color: 'var(--text-primary)' }}>Spend Boundary & Firewall Horizon</h3>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Cryptographic comparison of requested payout vs policy allowance threshold.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span style={{ color: 'var(--text-muted)' }}>Within Boundary</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-rose-500 font-semibold">Ceiling Exceeded</span>
          </div>
        </div>
      </div>

      {/* Chart Rows */}
      <div className="mt-5 space-y-4">
        {displayLogs.length === 0 ? (
          <div className="text-center py-6 text-xs" style={{ color: 'var(--text-muted)' }}>
            No recent audit records available.
          </div>
        ) : (
          displayLogs.map((log, index) => {
            const req = Number(log?.requestedAmount ?? log?.amount ?? 0);
            const max = Number(log?.maxLimit ?? 10000);
            const isPassing = req <= max;
            // Scale visual width safely (cap scale at 100%)
            const ceilingMax = Math.max(req, max, 10000) || 10000;
            const reqWidth = Math.min(100, Math.max(8, (req / ceilingMax) * 100));
            const maxWidth = Math.min(100, Math.max(15, (max / ceilingMax) * 100));
            const vendorName = String(log?.vendor || 'Direct Vendor Payout');
            const logId = String(log?.id || `audit_${index + 1}`);
            const proofType = String(log?.proofType || 'Groth16 / BN128');
            const verificationTimeMs = Number(log?.verificationTimeMs ?? 38);

            return (
              <div
                key={logId}
                style={{
                  background: 'var(--bg-panel-muted)',
                  border: '1px solid var(--border)',
                }}
                className="p-3.5 rounded-xl transition hover:opacity-90"
                onMouseEnter={() => setHoveredLog(log)}
                onMouseLeave={() => setHoveredLog(null)}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2">
                    {isPassing ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    )}
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{vendorName}</span>
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{
                        background: 'var(--bg-panel)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {logId}
                    </span>
                  </div>

                  <div className="text-right font-mono">
                    <span className={`font-bold ${isPassing ? 'text-emerald-500' : 'text-rose-500'}`}>
                      ₹{(req || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] ml-1" style={{ color: 'var(--text-muted)' }}>
                      / Max ₹{(max || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Progress bar representing requested vs policy max */}
                <div
                  className="relative w-full h-3 rounded-full overflow-hidden"
                  style={{
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {/* Max limit boundary line indicator */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                    style={{ left: `${maxWidth}%` }}
                    title={`Policy Threshold: ₹${max}`}
                  />
                  
                  {/* Requested amount filled bar */}
                  <div
                    className={`h-full transition-all duration-700 rounded-full ${
                      isPassing 
                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' 
                        : 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                    }`}
                    style={{ width: `${reqWidth}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono mt-1.5 px-0.5" style={{ color: 'var(--text-muted)' }}>
                  <span>Verification: {proofType} ({verificationTimeMs} ms)</span>
                  <span className={isPassing ? 'text-cyan-600 dark:text-cyan-300 font-semibold' : 'text-rose-500 font-semibold'}>
                    {isPassing
                      ? `✓ Safe margin: ₹${Math.max(0, max - req).toLocaleString('en-IN')}`
                      : `⚠️ Breach detected: +₹${Math.max(0, req - max).toLocaleString('en-IN')}`}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
