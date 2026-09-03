import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  ShieldCheck,
  Cpu,
  Lock,
  Workflow,
  Sparkles,
  Award,
  Zap,
  CheckCircle2,
  ExternalLink,
  Github,
  Linkedin,
  Key,
  Database,
  Radio,
  RefreshCw,
  Sliders,
  Layers,
  ArrowRight,
  Code2,
  FileCode,
  Users,
  Terminal,
  Activity,
  Check,
  Flame,
  Shield,
  Bot
} from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import AppShell from '../components/AppShell';

export default function AboutPage() {
  return (
    <ProtectedRoute>
      <AppShell title="About Agentflow & Architecture">
        <Head>
          <title>About & Architecture | Agentflow_AI</title>
        </Head>

        <div className="max-w-6xl mx-auto space-y-8 pb-12">
          {/* ─── Hero Header & Prominent Badges ────────────────────────── */}
          <div
            className="card relative rounded-2xl p-6 md:p-8 border border-[var(--border)] overflow-hidden"
            style={{
              background: 'var(--bg-panel)',
              boxShadow: 'var(--shadow)',
            }}
          >
            {/* Ambient background glow blurs */}
            <div
              className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-60 dark:opacity-40"
              style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.25), transparent 70%)' }}
            />
            <div
              className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-60 dark:opacity-40"
              style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.25), transparent 70%)' }}
            />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide"
                    style={{
                      background: 'rgba(245, 158, 11, 0.12)',
                      color: '#f59e0b',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                    }}
                  >
                    <Award size={13} />
                    Built for Razorpay AI Buildathon
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide"
                    style={{
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: '#10b981',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    <ShieldCheck size={13} />
                    Powered by Groth16 ZK
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide"
                    style={{
                      background: 'var(--accent-bg)',
                      color: 'var(--accent)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                    }}
                  >
                    <Zap size={13} />
                    Next.js 14
                  </span>
                </div>

                <h1
                  className="text-2xl md:text-4xl font-extrabold tracking-tight"
                  style={{ color: 'var(--text-primary)', letterSpacing: '-0.025em' }}
                >
                  About Agentflow_AI & <span className="gradient-text">AgentGuard ZK</span>
                </h1>
                <p
                  className="mt-2 text-sm md:text-base max-w-2xl leading-relaxed"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Autonomous multi-agent execution engine with zero-knowledge cryptographic spend guardrails, deterministic multi-rail automation, and human-in-the-loop oversight.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href="/workflows/builder"
                  className="button"
                  style={{
                    padding: '0.65rem 1.25rem',
                    fontSize: '0.85rem',
                    gap: '0.4rem',
                    boxShadow: '0 4px 14px rgba(56,189,248,0.35)',
                    borderRadius: '0.75rem',
                  }}
                >
                  <Workflow size={16} />
                  <span>Open Builder</span>
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href="/analytics"
                  className="button-secondary"
                  style={{
                    padding: '0.65rem 1.15rem',
                    fontSize: '0.85rem',
                    gap: '0.4rem',
                    borderRadius: '0.75rem',
                  }}
                >
                  <ShieldCheck size={16} style={{ color: '#10b981' }} />
                  <span>Risk Analytics</span>
                </Link>
              </div>
            </div>
          </div>

          {/* ─── Mission Statement Quote Banner ────────────────────────── */}
          <div
            className="card relative rounded-2xl p-6 md:p-8 border border-cyan-500/30 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, var(--bg-panel) 0%, var(--bg-panel-muted) 100%)',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div className="flex items-start gap-4 relative z-10">
              <div
                className="p-3 rounded-xl shrink-0"
                style={{
                  background: 'var(--accent-bg)',
                  color: 'var(--accent)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                <Sparkles size={24} />
              </div>
              <div>
                <div
                  className="text-xs uppercase font-bold tracking-widest mb-1.5"
                  style={{ color: 'var(--accent)' }}
                >
                  Core Mission & Architectural Thesis
                </div>
                <blockquote
                  className="text-base md:text-xl font-bold italic leading-relaxed"
                  style={{ color: 'var(--text-primary)' }}
                >
                  &ldquo;Empowering autonomous AI workflows with zero-knowledge cryptographic guardrails, human-in-the-loop oversight, and multi-rail action automation.&rdquo;
                </blockquote>
                <p
                  className="text-xs md:text-sm mt-2.5 leading-relaxed"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Bridging the critical enterprise gap between non-deterministic LLM agent reasoning and deterministic financial safety through mathematical zero-knowledge proofs and automatic self-healing recovery circuits.
                </p>
              </div>
            </div>
          </div>

          {/* ─── Core Security Pillar Grid (3 Columns) ─────────────────── */}
          <div>
            <div className="mb-4">
              <h2
                className="text-lg font-bold flex items-center gap-2"
                style={{ color: 'var(--text-primary)' }}
              >
                <ShieldCheck size={20} style={{ color: '#10b981' }} />
                <span>Core Architectural Pillars</span>
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Three interlocking layers engineered for absolute reliability, zero data leakage, and deterministic payouts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Pillar 1: Cryptographic Safety */}
              <div
                className="card card-hover rounded-2xl p-6 border flex flex-col justify-between"
                style={{
                  background: 'var(--bg-panel)',
                  borderColor: 'rgba(16, 185, 129, 0.35)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        background: 'rgba(16, 185, 129, 0.12)',
                        color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                      }}
                    >
                      <Key size={22} />
                    </div>
                    <span
                      className="text-[11px] font-mono px-2.5 py-0.5 rounded-full font-bold"
                      style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                      }}
                    >
                      Groth16 ZK
                    </span>
                  </div>

                  <h3
                    className="text-base font-bold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Cryptographic Safety
                  </h3>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Groth16 Zero-Knowledge spend & policy verification via{' '}
                    <code
                      className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold"
                      style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}
                    >
                      spend_guard.circom
                    </code>
                    . Mathematical proofs verify transaction authorization and spending caps without exposing private master credentials or secret balances.
                  </p>
                </div>

                <div
                  className="mt-5 pt-4 space-y-2 text-xs"
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--text-faint)' }}>Circuit Prover</span>
                    <span className="font-mono font-bold" style={{ color: '#10b981' }}>SnarkJS WASM</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--text-faint)' }}>Constraint Violation</span>
                    <span className="font-mono font-bold" style={{ color: '#f59e0b' }}>Auto-Intercept</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--text-faint)' }}>Proof Latency</span>
                    <span className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>&lt; 14ms Verified</span>
                  </div>
                </div>
              </div>

              {/* Pillar 2: Deterministic Execution */}
              <div
                className="card card-hover rounded-2xl p-6 border flex flex-col justify-between"
                style={{
                  background: 'var(--bg-panel)',
                  borderColor: 'rgba(56, 189, 248, 0.35)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        background: 'var(--accent-bg)',
                        color: 'var(--accent)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                      }}
                    >
                      <Workflow size={22} />
                    </div>
                    <span
                      className="text-[11px] font-mono px-2.5 py-0.5 rounded-full font-bold"
                      style={{
                        background: 'var(--accent-bg)',
                        color: 'var(--accent)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                      }}
                    >
                      Multi-Rail DAG
                    </span>
                  </div>

                  <h3
                    className="text-base font-bold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Deterministic Execution
                  </h3>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Multi-channel API automation across Razorpay payouts, Gmail messaging, Slack interactive blocks, Discord bots, and Google Sheets — orchestrated with automatic schema validation and self-healing retries.
                  </p>
                </div>

                <div
                  className="mt-5 pt-4 space-y-2 text-xs"
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--text-faint)' }}>Job Orchestrator</span>
                    <span className="font-mono font-bold" style={{ color: 'var(--accent)' }}>BullMQ + Redis</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--text-faint)' }}>Live Streaming</span>
                    <span className="font-mono font-bold" style={{ color: 'var(--accent-light)' }}>Socket.IO Stream</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--text-faint)' }}>Audit Logs</span>
                    <span className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>MongoDB Timeline</span>
                  </div>
                </div>
              </div>

              {/* Pillar 3: Human-in-the-Loop */}
              <div
                className="card card-hover rounded-2xl p-6 border flex flex-col justify-between"
                style={{
                  background: 'var(--bg-panel)',
                  borderColor: 'rgba(168, 85, 247, 0.35)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        background: 'rgba(168, 85, 247, 0.12)',
                        color: '#a855f7',
                        border: '1px solid rgba(168, 85, 247, 0.25)',
                      }}
                    >
                      <Users size={22} />
                    </div>
                    <span
                      className="text-[11px] font-mono px-2.5 py-0.5 rounded-full font-bold"
                      style={{
                        background: 'rgba(168, 85, 247, 0.1)',
                        color: '#a855f7',
                        border: '1px solid rgba(168, 85, 247, 0.25)',
                      }}
                    >
                      2FA & HITL
                    </span>
                  </div>

                  <h3
                    className="text-base font-bold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Human-in-the-Loop
                  </h3>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Policy escalation gates and 2FA approval controls. Workflows automatically pause before high-value payouts or risk deviations, notifying operators via interactive modals and Slack approvals before financial commitment.
                  </p>
                </div>

                <div
                  className="mt-5 pt-4 space-y-2 text-xs"
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--text-faint)' }}>Approval Rails</span>
                    <span className="font-mono font-bold" style={{ color: '#a855f7' }}>Web & Slack Modal</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--text-faint)' }}>Rejection Action</span>
                    <span className="font-mono font-bold" style={{ color: '#ef4444' }}>Instant Rollback</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--text-faint)' }}>Timeout Policy</span>
                    <span className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>Auto-Expire Escalate</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Architectural Pipeline Breakdown ─────────────────────── */}
          <div
            className="card rounded-2xl p-6 md:p-8 border border-[var(--border)]"
            style={{
              background: 'var(--bg-panel)',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div
              className="flex items-center justify-between mb-6 pb-4"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <Layers size={20} style={{ color: 'var(--accent)' }} />
                <h3
                  className="text-lg font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  End-to-End System Architecture
                </h3>
              </div>
              <span
                className="text-xs font-mono px-2.5 py-1 rounded-lg border font-semibold"
                style={{
                  background: 'var(--bg-panel-muted)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                Agentflow v2.5 Flow Lifecycle
              </span>
            </div>

            {/* Architecture Steps Horizontal Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
              <div
                className="p-4 rounded-xl border flex flex-col justify-between transition card-hover"
                style={{
                  background: 'var(--bg-panel-muted)',
                  borderColor: 'var(--border)',
                }}
              >
                <div>
                  <span className="text-xs font-bold font-mono" style={{ color: 'var(--accent)' }}>01. INGEST</span>
                  <div className="text-sm font-bold mt-1" style={{ color: 'var(--text-primary)' }}>Natural Intent</div>
                  <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    Plain English prompt or inbound Webhook (Stripe/Gmail).
                  </p>
                </div>
                <div className="mt-3 text-[10px] font-mono font-semibold" style={{ color: 'var(--text-faint)' }}>Planner Agent</div>
              </div>

              <div
                className="p-4 rounded-xl border flex flex-col justify-between transition card-hover"
                style={{
                  background: 'var(--bg-panel-muted)',
                  borderColor: 'rgba(16, 185, 129, 0.3)',
                }}
              >
                <div>
                  <span className="text-xs font-bold font-mono" style={{ color: '#10b981' }}>02. ZK GUARD</span>
                  <div className="text-sm font-bold mt-1" style={{ color: 'var(--text-primary)' }}>AgentGuard ZK</div>
                  <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    Groth16 mathematical proof verification for spend & limits.
                  </p>
                </div>
                <div className="mt-3 text-[10px] font-mono font-semibold" style={{ color: '#10b981' }}>Circom SnarkJS</div>
              </div>

              <div
                className="p-4 rounded-xl border flex flex-col justify-between transition card-hover"
                style={{
                  background: 'var(--bg-panel-muted)',
                  borderColor: 'rgba(168, 85, 247, 0.3)',
                }}
              >
                <div>
                  <span className="text-xs font-bold font-mono" style={{ color: '#a855f7' }}>03. GOVERN</span>
                  <div className="text-sm font-bold mt-1" style={{ color: 'var(--text-primary)' }}>Human-in-Loop</div>
                  <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    Pause execution for interactive 2FA approval if amount &gt; cap.
                  </p>
                </div>
                <div className="mt-3 text-[10px] font-mono font-semibold" style={{ color: '#a855f7' }}>Slack/Web Modal</div>
              </div>

              <div
                className="p-4 rounded-xl border flex flex-col justify-between transition card-hover"
                style={{
                  background: 'var(--bg-panel-muted)',
                  borderColor: 'rgba(56, 189, 248, 0.3)',
                }}
              >
                <div>
                  <span className="text-xs font-bold font-mono" style={{ color: 'var(--accent)' }}>04. DISPATCH</span>
                  <div className="text-sm font-bold mt-1" style={{ color: 'var(--text-primary)' }}>Razorpay Payout</div>
                  <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    Execute instant bank transfer payout & send notifications.
                  </p>
                </div>
                <div className="mt-3 text-[10px] font-mono font-semibold" style={{ color: 'var(--accent)' }}>Executor Agent</div>
              </div>

              <div
                className="p-4 rounded-xl border flex flex-col justify-between transition card-hover"
                style={{
                  background: 'var(--bg-panel-muted)',
                  borderColor: 'rgba(245, 158, 11, 0.3)',
                }}
              >
                <div>
                  <span className="text-xs font-bold font-mono" style={{ color: '#f59e0b' }}>05. OBSERVE</span>
                  <div className="text-sm font-bold mt-1" style={{ color: 'var(--text-primary)' }}>Live Telemetry</div>
                  <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    Socket.IO live stream logs + Recovery Agent auto-healing.
                  </p>
                </div>
                <div className="mt-3 text-[10px] font-mono font-semibold" style={{ color: '#f59e0b' }}>Recovery Agent</div>
              </div>
            </div>

            {/* Technical Stack Pills */}
            <div
              className="mt-6 pt-5 flex flex-wrap items-center gap-2 text-xs"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <span className="font-semibold mr-2" style={{ color: 'var(--text-primary)' }}>Core Tech Stack:</span>
              <span className="px-2.5 py-1 rounded-md font-mono font-semibold" style={{ background: 'var(--bg-panel-muted)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>Next.js 14 (Pages Router)</span>
              <span className="px-2.5 py-1 rounded-md font-mono font-semibold" style={{ background: 'var(--bg-panel-muted)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>@xyflow/react (React Flow)</span>
              <span className="px-2.5 py-1 rounded-md font-mono font-semibold" style={{ background: 'var(--bg-panel-muted)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>Circom 2.1 & SnarkJS</span>
              <span className="px-2.5 py-1 rounded-md font-mono font-semibold" style={{ background: 'var(--bg-panel-muted)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>Node.js Express</span>
              <span className="px-2.5 py-1 rounded-md font-mono font-semibold" style={{ background: 'var(--bg-panel-muted)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>Razorpay Payouts API</span>
              <span className="px-2.5 py-1 rounded-md font-mono font-semibold" style={{ background: 'var(--bg-panel-muted)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>BullMQ & Redis</span>
              <span className="px-2.5 py-1 rounded-md font-mono font-semibold" style={{ background: 'var(--bg-panel-muted)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>MongoDB Timeline Logs</span>
              <span className="px-2.5 py-1 rounded-md font-mono font-semibold" style={{ background: 'var(--bg-panel-muted)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>Socket.IO</span>
            </div>
          </div>

          {/* ─── Solo Creator Profile Card ──────────────────────────────── */}
          <div
            className="card rounded-2xl p-6 md:p-8 border border-emerald-500/35 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, var(--bg-panel) 0%, var(--bg-panel-muted) 100%)',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Code2 size={160} style={{ color: '#10b981' }} />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Creator Avatar Insignia */}
              <div className="relative shrink-0">
                <div
                  className="w-24 h-24 rounded-2xl p-0.5 shadow-xl"
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #10b981 50%, #6366f1 100%)',
                    boxShadow: '0 8px 24px -4px rgba(16,185,129,0.3)',
                  }}
                >
                  <div
                    className="w-full h-full rounded-2xl flex flex-col items-center justify-center"
                    style={{ background: 'var(--bg-panel)' }}
                  >
                    <span className="text-3xl font-black gradient-text font-mono">AK</span>
                    <span className="text-[10px] font-bold tracking-wider" style={{ color: '#10b981' }}>CREATOR</span>
                  </div>
                </div>
                <span
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md"
                  style={{
                    background: '#10b981',
                    color: '#0e1a30',
                    border: '2px solid var(--bg-panel)',
                  }}
                >
                  <Check size={12} strokeWidth={3} />
                </span>
              </div>

              {/* Creator Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3
                    className="text-xl md:text-2xl font-black"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Arvind Kumar
                  </h3>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                    style={{
                      background: 'var(--accent-bg)',
                      color: 'var(--accent)',
                      border: '1px solid rgba(56,189,248,0.3)',
                    }}
                  >
                    Solo Developer
                  </span>
                </div>

                <div
                  className="text-sm font-semibold flex items-center gap-2 mb-3"
                  style={{ color: '#10b981' }}
                >
                  <span>Lead Architect & Full-Stack AI Developer</span>
                </div>

                <p
                  className="text-xs md:text-sm leading-relaxed max-w-3xl"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Designed and implemented the complete architecture of <strong>Agentflow_AI</strong> and the <strong>AgentGuard Zero-Knowledge Guardrail Engine</strong> for the Razorpay AI Buildathon. Engineered to provide developers and operations teams with deterministic, cryptographically verified financial agent orchestration.
                </p>

                {/* Direct Social Links */}
                <div
                  className="mt-4 flex flex-wrap items-center gap-3 pt-3"
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  <a
                    href="https://github.com/Arvindkumar-star"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm card-hover"
                    style={{
                      background: 'var(--bg-panel-muted)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <Github size={16} style={{ color: 'var(--text-primary)' }} />
                    <span>github.com/Arvindkumar-star</span>
                    <ExternalLink size={12} style={{ color: 'var(--text-muted)' }} />
                  </a>

                  <a
                    href="https://linkedin.com/in/arvind-kumar-4364a0338"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm card-hover"
                    style={{
                      background: 'rgba(2, 132, 199, 0.08)',
                      border: '1px solid rgba(2, 132, 199, 0.3)',
                      color: 'var(--accent)',
                    }}
                  >
                    <Linkedin size={16} style={{ color: 'var(--accent)' }} />
                    <span>linkedin.com/in/arvind-kumar-4364a0338</span>
                    <ExternalLink size={12} style={{ color: 'var(--accent)' }} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
