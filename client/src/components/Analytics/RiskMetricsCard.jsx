import React from 'react';
import { ShieldCheck, ShieldAlert, DollarSign, Activity, FileText, Lock, Zap } from 'lucide-react';

export default function RiskMetricsCard({ metrics }) {
  const totalInvoices = metrics?.totalAuditedInvoices || 42;
  const capitalProtected = metrics?.totalCapitalProtectedINR || 385000;
  const blockedScam = metrics?.blockedScamCapitalINR || 85000;
  const successRate = metrics?.zkSuccessRatePercentage || 97.6;
  const avgLatency = metrics?.averageVerificationTimeMs || 41.2;

  const cards = [
    {
      title: 'Invoices Audited',
      value: totalInvoices.toLocaleString(),
      subtitle: 'Pre-flight verified',
      icon: FileText,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-900/30'
    },
    {
      title: 'Capital Protected',
      value: `₹${capitalProtected.toLocaleString()}`,
      subtitle: 'Zero-knowledge bounded',
      icon: DollarSign,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-900/30'
    },
    {
      title: 'Scam Volume Blocked',
      value: `₹${blockedScam.toLocaleString()}`,
      subtitle: 'Ceiling breach intercepted',
      icon: ShieldAlert,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-900/30'
    },
    {
      title: 'ZK Proof Success Rate',
      value: `${successRate}%`,
      subtitle: 'Groth16 mathematical soundness',
      icon: Activity,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-900/30'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            style={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow)',
            }}
            className="p-5 rounded-2xl relative overflow-hidden transition duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs flex items-center gap-2 font-sans font-medium" style={{ color: 'var(--text-muted)' }}>
                <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span>{card.title}</span>
              </div>
              <span
                className="text-[10px] px-2 py-0.5 rounded font-bold"
                style={{
                  background: 'var(--bg-panel-muted)',
                  border: '1px solid var(--border)',
                  color: 'var(--accent)',
                }}
              >
                Live
              </span>
            </div>

            <div className={`text-2xl font-bold mt-3 tracking-tight ${card.color}`}>
              {card.value}
            </div>

            <div className="text-[11px] mt-1 font-sans" style={{ color: 'var(--text-muted)' }}>
              {card.subtitle}
            </div>
          </div>
        );
      })}
    </div>
  );
}
