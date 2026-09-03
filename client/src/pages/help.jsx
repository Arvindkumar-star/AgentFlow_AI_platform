import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  HelpCircle,
  Search,
  BookOpen,
  ShieldCheck,
  Workflow,
  Key,
  Users,
  AlertTriangle,
  Play,
  Flame,
  ChevronDown,
  ExternalLink,
  Github,
  Zap,
  Sliders,
  DollarSign,
  Radio,
  FileCode,
  CheckCircle2,
  X,
  Layers,
  ArrowRight,
  RefreshCw,
  Lock,
  Mail,
  MessageSquare
} from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import AppShell from '../components/AppShell';

// ─── Quick Start Guide Cards ────────────────────────────────────────────────
const GUIDE_STEPS = [
  {
    step: '01',
    title: 'Canvas Construction',
    subtitle: 'Build DAG Visual Graphs',
    icon: Workflow,
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.12)',
    desc: 'Drag & drop triggers, AI nodes, AgentGuard ZK guardrails, and Razorpay/Gmail action nodes onto the visual grid to construct your automation pipeline.',
    badge: 'Visual Builder',
    keywords: ['canvas', 'drag', 'drop', 'trigger', 'nodes', 'graph', 'dag']
  },
  {
    step: '02',
    title: 'Set Policy Limits',
    subtitle: 'Cryptographic Rules & DLP',
    icon: ShieldCheck,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    desc: 'Configure spending thresholds (e.g. maxLimit: 10000) and DLP rules (DLP-704) inside the AgentGuard ZK node settings to enforce strict mathematical caps.',
    badge: 'Groth16 ZK',
    keywords: ['policy', 'limits', 'maxlimit', 'spend', 'dlp', 'agentguard', 'zk', 'circom']
  },
  {
    step: '03',
    title: 'Run or Simulate Attack',
    subtitle: 'Execution & Firewall Tests',
    icon: Flame,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    desc: 'Execute normal workflow runs using [ Run workflow ] or stress-test system firewalls against prompt injections and budget overflows using Simulate Scam Attack.',
    badge: 'Firewall Test',
    keywords: ['run', 'simulate', 'attack', 'scam', 'firewall', 'test', 'execution']
  },
  {
    step: '04',
    title: 'Human-in-the-Loop (HITL)',
    subtitle: '2FA & OTP Governance',
    icon: Users,
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.12)',
    desc: 'Review verified sub-limit payouts via 2FA/OTP approval modals or interactive Slack cards to authorize automated downstream Razorpay execution.',
    badge: '2FA / Approval',
    keywords: ['hitl', 'human', 'approval', '2fa', 'otp', 'razorpay', 'slack', 'payout']
  }
];

// ─── FAQ Accordion Items ────────────────────────────────────────────────────
const FAQS = [
  {
    id: 'faq-1',
    category: 'AgentGuard ZK',
    q: 'What happens if an invoice exceeds maxLimit?',
    a: 'AgentGuard automatically fails the SnarkJS Groth16 circuit check, halts the downstream Razorpay payout node immediately, and bypasses OTP generation to prevent fraudulent transfers. The workflow execution is flagged with ZK_CONSTRAINT_VIOLATION and routed to the Recovery Agent.',
    keywords: ['invoice', 'maxlimit', 'exceed', 'snarkjs', 'groth16', 'fraud', 'halt', 'fail']
  },
  {
    id: 'faq-2',
    category: 'Security & DLP',
    q: 'How does PII and Data Leak prevention work?',
    a: 'Outbound text from LLMs or emails is scanned before dispatch against active DLP rules (such as DLP-704). If sensitive data (credit card numbers, private auth secrets, API keys) is detected, the transmission is blocked with a PII_LEAK_PREVENTED alert and logged in the immutable audit trail.',
    keywords: ['pii', 'data', 'leak', 'dlp', 'credit card', 'api key', 'sensitive', 'redaction']
  },
  {
    id: 'faq-3',
    category: 'Troubleshooting',
    q: 'How do I clear error states after simulating an attack?',
    a: 'Simply click the blue [ Run workflow ] button at the top right of the canvas or dashboard. This automatically purges error flags, resets node validation statuses, and executes a clean workflow run against the latest node parameters.',
    keywords: ['clear', 'error', 'reset', 'simulate', 'attack', 'status', 'run workflow']
  },
  {
    id: 'faq-4',
    category: 'Razorpay Payouts',
    q: 'How does the Razorpay payout rail process approvals?',
    a: 'When an AgentGuard Node passes cryptographic verification, it prepares the payout payload. If the amount requires operator signoff, a 2FA/OTP modal appears. Once authorized by the operator, the Razorpay Payout Node calls the RazorpayX API to transfer funds to the verified bank account or VPA.',
    keywords: ['razorpay', 'payout', 'bank', 'vpa', 'funds', 'transfer', 'approval', 'otp']
  },
  {
    id: 'faq-5',
    category: 'Self-Healing',
    q: 'How does the Recovery Agent handle transient API failures?',
    a: 'When downstream services (e.g. Gmail or Slack) return temporary 429 rate limits or 503 errors, the Recovery Agent diagnoses the failure trace, adjusts request headers/payloads, applies exponential backoff, and re-executes the node without failing the overall pipeline.',
    keywords: ['recovery', 'agent', 'retry', 'self-healing', '429', '503', 'backoff', 'resilient']
  }
];

// ─── Node Cheat Sheet / Reference ───────────────────────────────────────────
const NODE_REFERENCE = [
  {
    name: 'Trigger Node',
    type: 'Ingest',
    color: '#38bdf8',
    icon: Zap,
    desc: 'Starts workflow on webhook POST, inbound Gmail message, or cron schedule.'
  },
  {
    name: 'LLM Agent Node',
    type: 'Reasoning',
    color: '#818cf8',
    icon: Workflow,
    desc: 'Executes generative reasoning, extraction, and classification using Gemini or Claude.'
  },
  {
    name: 'AgentGuard ZK',
    type: 'Security',
    color: '#10b981',
    icon: ShieldCheck,
    desc: 'Groth16 mathematical proof verification for spend caps and DLP rules.'
  },
  {
    name: 'Razorpay Payout',
    type: 'Finance',
    color: '#0284c7',
    icon: DollarSign,
    desc: 'Dispatches instant bank or UPI payouts with idempotency keys.'
  },
  {
    name: 'Approval Gate',
    type: 'Governance',
    color: '#a855f7',
    icon: Users,
    desc: 'Pauses execution for 2FA operator confirmation before critical actions.'
  },
  {
    name: 'Action Dispatcher',
    type: 'Integration',
    color: '#f59e0b',
    icon: Radio,
    desc: 'Sends Slack notifications, Discord cards, or logs rows in Google Sheets.'
  }
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [openFaqs, setOpenFaqs] = useState({ 'faq-1': true, 'faq-2': false });

  const toggleFaq = (id) => {
    setOpenFaqs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const categories = ['ALL', 'AgentGuard ZK', 'Security & DLP', 'Razorpay Payouts', 'Troubleshooting', 'Self-Healing'];

  // Filter guides and FAQs based on search and category
  const filteredFaqs = useMemo(() => {
    return FAQS.filter((faq) => {
      const matchesCategory = selectedCategory === 'ALL' || faq.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        faq.q.toLowerCase().includes(q) ||
        faq.a.toLowerCase().includes(q) ||
        faq.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedCategory]);

  const filteredGuides = useMemo(() => {
    if (!searchQuery.trim()) return GUIDE_STEPS;
    const q = searchQuery.toLowerCase();
    return GUIDE_STEPS.filter((g) => {
      return (
        g.title.toLowerCase().includes(q) ||
        g.subtitle.toLowerCase().includes(q) ||
        g.desc.toLowerCase().includes(q) ||
        g.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [searchQuery]);

  return (
    <ProtectedRoute>
      <AppShell title="Help & Documentation">
        <Head>
          <title>Help & Workflow Guides | Agentflow_AI</title>
        </Head>

        <div className="max-w-6xl mx-auto space-y-8 pb-12">
          {/* ─── Header & Interactive Search Bar ────────────────────────── */}
          <div
            className="card relative rounded-2xl p-6 md:p-8 border border-[var(--border)] overflow-hidden"
            style={{
              background: 'var(--bg-panel)',
              boxShadow: 'var(--shadow)',
            }}
          >
            {/* Ambient background glow */}
            <div
              className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-50 dark:opacity-30"
              style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.25), transparent 70%)' }}
            />

            <div className="relative z-10 max-w-3xl">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
                <BookOpen size={15} />
                <span>Documentation & Guides</span>
              </div>
              <h1
                className="text-2xl md:text-4xl font-extrabold tracking-tight"
                style={{ color: 'var(--text-primary)', letterSpacing: '-0.025em' }}
              >
                Help Center & <span className="gradient-text">Workflow Guides</span>
              </h1>
              <p
                className="mt-2 text-sm md:text-base leading-relaxed"
                style={{ color: 'var(--text-muted)' }}
              >
                Learn how to configure nodes, set up AgentGuard cryptographic policies, and manage HITL approvals.
              </p>

              {/* Functional Search Input */}
              <div className="mt-6 relative flex items-center">
                <Search
                  size={18}
                  className="absolute left-4 pointer-events-none"
                  style={{ color: 'var(--text-faint)' }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search guides, node configs, error codes, or FAQs..."
                  className="w-full rounded-xl py-3.5 pl-11 pr-10 text-sm font-medium outline-none transition"
                  style={{
                    background: 'var(--bg-panel-muted)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition text-slate-400"
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Filter Category Pills */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold transition"
                    style={{
                      background: selectedCategory === cat ? 'var(--accent)' : 'var(--bg-panel-muted)',
                      color: selectedCategory === cat ? '#0e1a30' : 'var(--text-muted)',
                      border: selectedCategory === cat ? '1px solid var(--accent)' : '1px solid var(--border)',
                      fontWeight: selectedCategory === cat ? 700 : 500,
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Quick Start Workflow Guide (4 Step Cards) ─────────────── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2
                  className="text-lg font-bold flex items-center gap-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Workflow size={20} style={{ color: 'var(--accent)' }} />
                  <span>Quick Start Workflow Guide</span>
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Master the 4 core steps to build and safely deploy autonomous agent pipelines.
                </p>
              </div>

              <Link
                href="/workflows/builder"
                className="button-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                style={{ borderRadius: '0.65rem' }}
              >
                <span>Launch Canvas</span>
                <ExternalLink size={12} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredGuides.map((guide) => {
                const Icon = guide.icon;
                return (
                  <div
                    key={guide.step}
                    className="card card-hover rounded-2xl p-5 border flex flex-col justify-between"
                    style={{
                      background: 'var(--bg-panel)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-black text-xs"
                          style={{
                            background: guide.bg,
                            color: guide.color,
                            border: `1px solid ${guide.color}30`,
                          }}
                        >
                          {guide.step}
                        </span>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: 'var(--bg-panel-muted)',
                            color: guide.color,
                            border: '1px solid var(--border)',
                          }}
                        >
                          {guide.badge}
                        </span>
                      </div>

                      <h3
                        className="text-sm font-bold mb-1"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {guide.title}
                      </h3>
                      <div
                        className="text-[11px] font-semibold mb-2"
                        style={{ color: guide.color }}
                      >
                        {guide.subtitle}
                      </div>

                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {guide.desc}
                      </p>
                    </div>

                    <div
                      className="mt-4 pt-3 flex items-center gap-1 text-[11px] font-semibold"
                      style={{ borderTop: '1px solid var(--border)', color: 'var(--accent)' }}
                    >
                      <CheckCircle2 size={13} style={{ color: '#10b981' }} />
                      <span>Standard Procedure</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── Node Reference & Cheat Sheet ─────────────────────────── */}
          <div
            className="card rounded-2xl p-6 md:p-8 border border-[var(--border)]"
            style={{
              background: 'var(--bg-panel)',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div className="flex items-center justify-between mb-5 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <Layers size={18} style={{ color: 'var(--accent)' }} />
                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  Node Palette Reference Guide
                </h3>
              </div>
              <span className="text-xs font-mono" style={{ color: 'var(--text-faint)' }}>
                6 Core Architecture Nodes
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {NODE_REFERENCE.map((node) => {
                const Icon = node.icon;
                return (
                  <div
                    key={node.name}
                    className="p-3.5 rounded-xl border flex items-start gap-3 transition card-hover"
                    style={{
                      background: 'var(--bg-panel-muted)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <div
                      className="p-2 rounded-lg shrink-0 mt-0.5"
                      style={{
                        background: `${node.color}15`,
                        color: node.color,
                        border: `1px solid ${node.color}30`,
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                          {node.name}
                        </span>
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.2 rounded"
                          style={{ background: 'var(--bg-base)', color: 'var(--text-faint)', border: '1px solid var(--border)' }}
                        >
                          {node.type}
                        </span>
                      </div>
                      <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        {node.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── Interactive Accordion FAQs ────────────────────────────── */}
          <div>
            <div className="mb-4">
              <h2
                className="text-lg font-bold flex items-center gap-2"
                style={{ color: 'var(--text-primary)' }}
              >
                <HelpCircle size={20} style={{ color: '#10b981' }} />
                <span>Frequently Asked Questions & Troubleshooting</span>
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Detailed answers to common policy enforcement, attack simulation, and integration questions.
              </p>
            </div>

            {filteredFaqs.length === 0 ? (
              <div
                className="card rounded-2xl p-8 text-center border border-[var(--border)]"
                style={{ background: 'var(--bg-panel)' }}
              >
                <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                  No guides or FAQs matched your search &ldquo;{searchQuery}&rdquo;.
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); }}
                  className="button-secondary text-xs mt-3 py-1.5 px-3 inline-flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  <span>Reset Filters</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredFaqs.map((faq) => {
                  const isOpen = !!openFaqs[faq.id];
                  return (
                    <div
                      key={faq.id}
                      className="card rounded-xl border overflow-hidden transition"
                      style={{
                        background: 'var(--bg-panel)',
                        borderColor: isOpen ? 'var(--accent)' : 'var(--border)',
                      }}
                    >
                      <button
                        onClick={() => toggleFaq(faq.id)}
                        className="w-full text-left p-4 md:p-5 flex items-center justify-between gap-4 font-bold text-sm md:text-base transition"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                            style={{
                              background: 'var(--accent-bg)',
                              color: 'var(--accent)',
                              border: '1px solid rgba(56,189,248,0.25)',
                            }}
                          >
                            {faq.category}
                          </span>
                          <span>{faq.q}</span>
                        </div>
                        <ChevronDown
                          size={18}
                          className="shrink-0 transition-transform duration-200"
                          style={{
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            color: 'var(--accent)',
                          }}
                        />
                      </button>

                      {isOpen && (
                        <div
                          className="px-4 md:px-5 pb-5 text-xs md:text-sm leading-relaxed"
                          style={{
                            color: 'var(--text-muted)',
                            borderTop: '1px solid var(--border)',
                            paddingTop: '0.85rem',
                          }}
                        >
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ─── Support Footer Card ────────────────────────────────────── */}
          <div
            className="card rounded-2xl p-6 md:p-8 border border-emerald-500/35 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, var(--bg-panel) 0%, var(--bg-panel-muted) 100%)',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
              <div className="flex items-start gap-4">
                <div
                  className="p-3 rounded-xl shrink-0"
                  style={{
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <Github size={24} />
                </div>
                <div>
                  <h3
                    className="text-base md:text-lg font-bold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Need additional technical support?
                  </h3>
                  <p
                    className="text-xs md:text-sm mt-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Reach out directly via GitHub:{' '}
                    <a
                      href="https://github.com/Arvindkumar-star"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold underline hover:text-[var(--accent)] transition"
                      style={{ color: '#10b981' }}
                    >
                      github.com/Arvindkumar-star
                    </a>
                  </p>
                </div>
              </div>

              <a
                href="https://github.com/Arvindkumar-star"
                target="_blank"
                rel="noopener noreferrer"
                className="button inline-flex items-center gap-2 shrink-0 text-xs font-bold"
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '0.75rem',
                  boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
                  background: '#10b981',
                  color: '#0e1a30',
                }}
              >
                <Github size={15} />
                <span>Open GitHub Profile</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
