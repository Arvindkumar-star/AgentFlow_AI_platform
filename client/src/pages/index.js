import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  GitBranch,
  Radio,
  Workflow,
  Sparkles,
  Shield,
  RefreshCw,
  Zap,
  CheckCircle2,
  Terminal,
  Activity,
  Layers,
  ChevronDown,
  Cpu,
  Lock,
  Play,
  Share2,
  Sliders,
  Check,
  Mail,
  DollarSign,
  ExternalLink,
  Menu,
  X,
  HelpCircle
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

// ─── Preset Scenarios for Interactive Live Simulator ────────────────────────
const SCENARIOS = [
  {
    id: 'support',
    title: 'Customer Sentiment & Escalation',
    category: 'Support & Ops',
    icon: Mail,
    prompt: 'Monitor incoming support emails in Gmail. If sentiment is negative, analyze root cause with Gemini, notify #incidents on Slack, and log the ticket in Google Sheets.',
    nodes: [
      { id: '1', label: 'Gmail Trigger', type: 'Trigger', desc: 'New email with subject containing "Urgent"', status: 'success', time: '12ms' },
      { id: '2', label: 'Gemini 1.5 Flash', type: 'LLM Agent', desc: 'Sentiment scoring & key issue extraction', status: 'success', time: '145ms' },
      { id: '3', label: 'Slack Alert', type: 'Action', desc: 'Post rich embed to #incident-response', status: 'success', time: '68ms' },
      { id: '4', label: 'Google Sheets', type: 'Action', desc: 'Append ticket row with SLA timestamp', status: 'success', time: '42ms' },
    ],
    agentLogs: [
      { agent: 'PLANNER', time: '17:45:01.102', msg: 'Analyzed prompt: Synthesized 4-node DAG with 1 LLM reasoning branch.' },
      { agent: 'EXECUTOR', time: '17:45:01.114', msg: 'Gmail trigger matched: "Urgent: payment webhook failing for order #9821".' },
      { agent: 'AGENT_GUARD', time: '17:45:01.120', msg: 'PII Shield: Redacted customer email address from downstream logs.' },
      { agent: 'EXECUTOR', time: '17:45:01.265', msg: 'Gemini score: Negative (0.94). Extracted category: Billing/Webhook.' },
      { agent: 'VALIDATOR', time: '17:45:01.272', msg: 'Output schema validated against Slack BlockKit specs.' },
      { agent: 'EXECUTOR', time: '17:45:01.340', msg: 'Slack alert dispatched. Google Sheet row appended. Execution finished (267ms).' }
    ]
  },
  {
    id: 'payouts',
    title: 'Autonomous Invoice & Razorpay Payout',
    category: 'Finance & Payments',
    icon: DollarSign,
    prompt: 'Receive invoice webhook from vendor. Validate tax ID and amount. If amount > $500, request manager approval in Slack, then initiate Razorpay payout and archive PDF.',
    nodes: [
      { id: '1', label: 'Webhook Ingest', type: 'Trigger', desc: 'POST /v1/invoices from Stripe/Custom ERP', status: 'success', time: '8ms' },
      { id: '2', label: 'Validator Agent', type: 'AgentGuard', desc: 'Schema audit & Tax ID checksum check', status: 'success', time: '18ms' },
      { id: '3', label: 'Approval Gate', type: 'Human-in-Loop', desc: 'Slack interactive approval button', status: 'success', time: 'Waiting' },
      { id: '4', label: 'Razorpay Payout', type: 'Payment', desc: 'Execute instant bank transfer payout', status: 'success', time: '210ms' },
    ],
    agentLogs: [
      { agent: 'PLANNER', time: '17:46:12.004', msg: 'Parsed finance intent. Inserted mandatory Human-in-the-Loop approval gate.' },
      { agent: 'EXECUTOR', time: '17:46:12.012', msg: 'Ingested invoice payload: Vendor #AcmeCorp, Amount: $1,250.00.' },
      { agent: 'VALIDATOR', time: '17:46:12.030', msg: 'Vendor Tax ID confirmed against registry. Policy check passed.' },
      { agent: 'AGENT_GUARD', time: '17:46:12.035', msg: 'Compliance Rule: Triggered Slack approval modal to @finance-lead.' },
      { agent: 'RECOVERY', time: '17:46:12.245', msg: 'Health check OK. Ready for Razorpay fund transfer execution upon approval.' }
    ]
  },
  {
    id: 'devops',
    title: 'GitHub PR Triage & Code Reviewer',
    category: 'Engineering & DevOps',
    icon: GitBranch,
    prompt: 'When a new PR is opened in GitHub, summarize diff with Claude 3.5, verify security checks, assign labels, and post changelog to Discord #dev-updates.',
    nodes: [
      { id: '1', label: 'GitHub Webhook', type: 'Trigger', desc: 'pr.opened event on repository "core-backend"', status: 'success', time: '15ms' },
      { id: '2', label: 'Claude 3.5 Sonnet', type: 'LLM Agent', desc: 'Summarize AST diff & find potential race conditions', status: 'success', time: '380ms' },
      { id: '3', label: 'Security Guard', type: 'AgentGuard', desc: 'Check for hardcoded secrets & CVE vulnerabilities', status: 'success', time: '24ms' },
      { id: '4', label: 'Discord Bot', type: 'Action', desc: 'Send formatted review card with risk score', status: 'success', time: '55ms' },
    ],
    agentLogs: [
      { agent: 'PLANNER', time: '17:47:30.120', msg: 'Generated GitOps pipeline with AST diff parsing & multi-tier validation.' },
      { agent: 'EXECUTOR', time: '17:47:30.135', msg: 'Fetched 6 changed files (+240, -45 lines) from GitHub API.' },
      { agent: 'EXECUTOR', time: '17:47:30.515', msg: 'Claude reasoning complete: 0 high risks detected, 2 optimization tips.' },
      { agent: 'AGENT_GUARD', time: '17:47:30.539', msg: 'Secrets scanner: Clean. Zero API keys detected in diff.' },
      { agent: 'EXECUTOR', time: '17:47:30.594', msg: 'Discord notification delivered to #dev-updates with interactive links.' }
    ]
  },
  {
    id: 'growth',
    title: 'Multi-Source Lead Enrichment',
    category: 'Sales & Marketing',
    icon: Sparkles,
    prompt: 'New lead submitted via form. Look up company domain on Clearbit, extract tech stack, score ICP fit with OpenAI, and sync enriched profile to CRM.',
    nodes: [
      { id: '1', label: 'Typeform / Webhook', type: 'Trigger', desc: 'Lead submission from agentflow.ai/contact', status: 'success', time: '10ms' },
      { id: '2', label: 'Domain Search', type: 'Tool', desc: 'Extract company size, industry & DNS records', status: 'success', time: '92ms' },
      { id: '3', label: 'GPT-4o Mini', type: 'LLM Agent', desc: 'Calculate ICP score (A/B/C/D) & value prop', status: 'success', time: '180ms' },
      { id: '4', label: 'CRM / Slack Sync', type: 'Action', desc: 'Create CRM opportunity and notify account exec', status: 'success', time: '65ms' },
    ],
    agentLogs: [
      { agent: 'PLANNER', time: '17:48:45.002', msg: 'Synthesized lead qualification pipeline with enrich & score stages.' },
      { agent: 'EXECUTOR', time: '17:48:45.012', msg: 'Lead email: alex@datacorp.io. Extracted domain: datacorp.io.' },
      { agent: 'EXECUTOR', time: '17:48:45.104', msg: 'Domain lookup: Enterprise tier, 250+ employees, Tech: Next.js + MongoDB.' },
      { agent: 'VALIDATOR', time: '17:48:45.284', msg: 'ICP Scoring: Tier A (98/100). High purchase intent detected.' },
      { agent: 'EXECUTOR', time: '17:48:45.349', msg: 'Synced to CRM pipeline. Direct Slack ping sent to Tier-A Sales Rep.' }
    ]
  }
];

// ─── 5-Agent Engine Details ──────────────────────────────────────────────────
const AGENT_ROLES = [
  {
    icon: GitBranch,
    name: 'Planner Agent',
    tag: 'DAG Architect',
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.1)',
    desc: 'Translates natural language prompts into optimized Directed Acyclic Graphs (DAGs), resolving step dependencies and topological ordering automatically.',
    metric: '< 180ms synthesis'
  },
  {
    icon: Zap,
    name: 'Executor Agent',
    tag: 'Parallel Runner',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
    desc: 'Dispatches parallel tasks, interacts with OAuth integrations (Gmail, Slack, Razorpay), manages authentication tokens, and coordinates LLM tool calls.',
    metric: '100% Async BullMQ'
  },
  {
    icon: Shield,
    name: 'Validator Agent',
    tag: 'Contract Verifier',
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.1)',
    desc: 'Asserts input/output schema compliance against strict JSON contracts, verifies payload types, and enforces business invariants before execution proceeds.',
    metric: 'Zero schema drift'
  },
  {
    icon: RefreshCw,
    name: 'Recovery Agent',
    tag: 'Self-Healing AI',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    desc: 'Catches 4xx/5xx API failures, diagnoses root causes using LLM reasoning, mutates payload parameters dynamically, and re-executes with zero manual intervention.',
    metric: '99.9% Auto-Recovery'
  },
  {
    icon: Radio,
    name: 'Monitoring Agent',
    tag: 'Live Telemetry',
    color: '#ec4899',
    bg: 'rgba(236,72,153,0.1)',
    desc: 'Streams real-time agent execution events over WebSockets, captures audit logs in MongoDB, and monitors token costs, latency, and throughput.',
    metric: 'Sub-second Socket.IO'
  }
];

// ─── Platform Capabilities Grid ──────────────────────────────────────────────
const PLATFORM_FEATURES = [
  {
    icon: Workflow,
    title: 'Visual Drag & Drop Canvas',
    desc: 'Build workflows visually with full React Flow canvas support. Connect nodes, tweak configs, view live execution states, and zoom through infinite workflows.',
    tag: 'Visual Builder'
  },
  {
    icon: Lock,
    title: 'AgentGuard™ Enterprise Security',
    desc: 'Hardened security perimeter with automatic PII sanitization, token rate limiters, credential AES-256 vaults, and infinite-loop prevention algorithms.',
    tag: 'Zero-Trust'
  },
  {
    icon: RefreshCw,
    title: 'Autonomous Self-Healing Loops',
    desc: 'Never let broken 3rd-party APIs halt operations. The Recovery Agent automatically diagnoses errors, adjusts payloads, and retries seamlessly.',
    tag: 'Self-Healing'
  },
  {
    icon: Radio,
    title: 'Live WebSocket Streaming',
    desc: 'Experience real-time execution observability. Watch nodes illuminate as they run, and stream live agent thinking logs straight to your console.',
    tag: 'Real-time'
  },
  {
    icon: Sliders,
    title: 'Human-in-the-Loop Approvals',
    desc: 'Pause sensitive workflows (e.g. payouts, high-value emails) for one-click operator signoff via interactive modals or Slack before proceeding.',
    tag: 'Governance'
  },
  {
    icon: Activity,
    title: 'Analytics & Token Cost Tracking',
    desc: 'Track workflow latency, run success ratios, LLM token expenditures, and node execution bottlenecks with comprehensive interactive dashboards.',
    tag: 'Observability'
  }
];

// ─── Integrations Showcase List ──────────────────────────────────────────────
const INTEGRATIONS = [
  { name: 'Gmail', type: 'OAuth 2.0', icon: '✉️', desc: 'Read threads, send emails, trigger on labels' },
  { name: 'Slack', type: 'Bot & OAuth', icon: '💬', desc: 'Post rich block cards, approval modals, listen to channels' },
  { name: 'Discord', type: 'Bot Webhook', icon: '🎮', desc: 'Post incident cards, dev alerts, community messages' },
  { name: 'Google Sheets', type: 'OAuth 2.0', icon: '📊', desc: 'Read/write spreadsheet rows, append logs dynamically' },
  { name: 'Razorpay', type: 'Payments API', icon: '💳', desc: 'Instant payouts, customer refunds, transaction audits' },
  { name: 'OpenRouter & Gemini', type: 'LLMs', icon: '🤖', desc: 'OpenAI, Gemini, Claude, Llama 3, DeepSeek models' },
  { name: 'GitHub', type: 'Webhooks', icon: '🐙', desc: 'Trigger on PRs, issues, commits, repo events' },
  { name: 'Custom Webhooks', type: 'REST / JSON', icon: '⚡', desc: 'Accept any inbound HTTP POST, sign HMAC payloads' }
];

// ─── FAQ Accordion Data ──────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'How does Agentflow_AI differ from traditional tools like Zapier or n8n?',
    a: 'Traditional automation tools follow rigid, brittle static if-this-then-that recipes that break on the slightest unexpected data format. Agentflow_AI introduces an autonomous multi-agent chain (Planner, Executor, Validator, Recovery) that can reason, self-heal failed API requests, sanitize PII, and synthesize full visual graphs from plain English prompts.'
  },
  {
    q: 'What happens when a 3rd-party API fails during a live execution?',
    a: 'Unlike static pipelines that immediately throw hard errors, Agentflow invokes its Recovery Agent. The Recovery Agent diagnoses the response (e.g., 429 rate limit, schema mismatch, or missing field), adjusts request parameters or switches to a fallback LLM/endpoint, and safely retries without manual human intervention.'
  },
  {
    q: 'Can I bring my own LLM API keys (OpenAI, Gemini, OpenRouter)?',
    a: 'Yes! Agentflow supports direct BYOK (Bring Your Own Key) for OpenRouter, Google Gemini, Anthropic, and OpenAI. Keys are encrypted at rest with AES-256 GCM encryption and never exposed to the client browser.'
  },
  {
    q: 'Can I run human approval checkpoints before executing sensitive actions?',
    a: 'Absolutely. With Human-in-the-Loop (HITL) nodes, workflows can pause at critical checkpoints (such as Razorpay payouts or database writes) and dispatch interactive approval requests to your operator dashboard or Slack channel.'
  },
  {
    q: 'Is Agentflow compatible with both Dark and Light themes?',
    a: 'Yes! The entire interface is built with adaptive CSS custom properties and full next-themes support, providing an ultra-crisp, high-contrast visual experience in both dark and light modes.'
  }
];

export default function Home() {
  const [activeScenario, setActiveScenario] = useState(SCENARIOS[0]);
  const [customPrompt, setCustomPrompt] = useState(SCENARIOS[0].prompt);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedLogs, setSimulatedLogs] = useState(SCENARIOS[0].agentLogs);
  const [activeFaq, setActiveFaq] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [recoverySimActive, setRecoverySimActive] = useState(false);

  useEffect(() => {
    setCustomPrompt(activeScenario.prompt);
    setSimulatedLogs(activeScenario.agentLogs);
    setRecoverySimActive(false);
  }, [activeScenario]);

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setSimulatedLogs([
      { agent: 'PLANNER', time: '17:50:00.012', msg: `Synthesizing workflow for: "${customPrompt.slice(0, 60)}..."` },
      { agent: 'PLANNER', time: '17:50:00.045', msg: 'Generated 4 execution nodes with topological dependency graph.' },
      { agent: 'AGENT_GUARD', time: '17:50:00.052', msg: 'Security Perimeter: Enforced rate limits (100 req/min) & PII inspection.' },
      { agent: 'EXECUTOR', time: '17:50:00.120', msg: 'Dispatched node 1 (Trigger) -> Node 2 (AI Reasoning Engine).' },
      { agent: 'VALIDATOR', time: '17:50:00.210', msg: 'Schema verified. 0 constraint violations detected.' },
      { agent: 'EXECUTOR', time: '17:50:00.267', msg: 'Dispatched node 3 & 4. Pipeline executed in 242ms (Success).' }
    ]);
    setTimeout(() => {
      setIsSimulating(false);
    }, 800);
  };

  const handleToggleRecoverySim = () => {
    const nextState = !recoverySimActive;
    setRecoverySimActive(nextState);
    if (nextState) {
      setSimulatedLogs((prev) => [
        ...prev,
        { agent: 'WARNING', time: '17:50:01.300', msg: '⚠️ Injected Error: Upstream service returned 422 Unprocessable Entity.' },
        { agent: 'RECOVERY', time: '17:50:01.312', msg: '🩺 Recovery Agent engaged: Analyzing error traceback & schema definition...' },
        { agent: 'RECOVERY', time: '17:50:01.440', msg: '✨ Auto-Healed: Adjusted payload schema & applied exponential backoff.' },
        { agent: 'EXECUTOR', time: '17:50:01.490', msg: '✅ Retry succeeded with status 200 OK. Zero pipeline downtime.' }
      ]);
    } else {
      setSimulatedLogs(activeScenario.agentLogs);
    }
  };

  return (
    <main className="grid-bg" style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Ambient Glow Blobs */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '75vw',
          maxWidth: '1100px',
          height: '480px',
          background: 'radial-gradient(ellipse at center, rgba(56,189,248,0.12), rgba(129,140,248,0.05) 45%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Sticky Glassmorphism Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-panel-muted)',
          opacity: 0.96
        }}
      >
        <div
          style={{
            maxWidth: '84rem',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.5rem',
          }}
        >
          {/* Brand Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
            <span
              style={{
                borderRadius: '0.85rem',
                background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                padding: '0.55rem',
                color: '#ffffff',
                display: 'flex',
                boxShadow: '0 0 20px -3px rgba(56,189,248,0.45)',
              }}
            >
              <Workflow size={22} strokeWidth={2.4} />
            </span>
            <span>
              Agentflow<span className="gradient-text font-black">_AI</span>
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '0.2rem 0.5rem',
                borderRadius: '999px',
                border: '1px solid var(--border)',
                background: 'var(--accent-bg)',
                color: 'var(--accent)',
                letterSpacing: '0.05em'
              }}
            >
              v2.5
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            <a href="#simulator" className="hover:text-[var(--accent)] transition">Live Demo</a>
            <a href="#architecture" className="hover:text-[var(--accent)] transition">5-Agent Engine</a>
            <a href="#features" className="hover:text-[var(--accent)] transition">Platform Pillars</a>
            <a href="#integrations" className="hover:text-[var(--accent)] transition">Integrations</a>
            <a href="#security" className="hover:text-[var(--accent)] transition">Security</a>
            <a href="#faq" className="hover:text-[var(--accent)] transition">FAQ</a>
          </nav>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ThemeToggle />
            <Link href="/login" className="button-secondary hidden sm:inline-flex" style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem' }}>
              Sign in
            </Link>
            <Link href="/register" className="button" style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem', gap: '0.4rem', boxShadow: '0 4px 14px rgba(56,189,248,0.3)' }}>
              <span>Start Free</span>
              <ArrowRight size={15} />
            </Link>
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden p-2 rounded-xl border border-[var(--border)] text-[var(--text-muted)]"
              aria-label="Toggle menu"
            >
              {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileNavOpen && (
          <div className="md:hidden px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-panel)] flex flex-col gap-3 text-sm font-medium">
            <a href="#simulator" onClick={() => setMobileNavOpen(false)} className="py-2">Live Demo</a>
            <a href="#architecture" onClick={() => setMobileNavOpen(false)} className="py-2">5-Agent Engine</a>
            <a href="#features" onClick={() => setMobileNavOpen(false)} className="py-2">Platform Pillars</a>
            <a href="#integrations" onClick={() => setMobileNavOpen(false)} className="py-2">Integrations</a>
            <a href="#security" onClick={() => setMobileNavOpen(false)} className="py-2">Security</a>
            <a href="#faq" onClick={() => setMobileNavOpen(false)} className="py-2">FAQ</a>
            <div className="pt-2 border-t border-[var(--border)] flex gap-3">
              <Link href="/login" className="button-secondary flex-1 text-center py-2">Sign in</Link>
              <Link href="/workflows/builder" className="button flex-1 text-center py-2">Visual Canvas</Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section style={{ maxWidth: '84rem', margin: '0 auto', padding: '4.5rem 1.5rem 3rem', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', maxWidth: '56rem', margin: '0 auto' }}>
          {/* High-Impact Announcement Pill */}
          <div
            className="animate-pulse-slow"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              borderRadius: '999px',
              border: '1px solid rgba(56,189,248,.35)',
              background: 'var(--accent-bg)',
              padding: '0.45rem 1.1rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--accent)',
              marginBottom: '2rem',
              boxShadow: '0 0 25px -4px rgba(56,189,248,0.25)',
            }}
          >
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
            <span>Next-Gen Agentic Workflow Automation</span>
            <span style={{ opacity: 0.6 }}>•</span>
            <span className="hidden sm:inline">Self-Healing DAG Execution</span>
          </div>

          {/* Hero Headline */}
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 5.5vw, 4.4rem)',
              fontWeight: 900,
              lineHeight: 1.08,
              letterSpacing: '-0.035em',
              margin: '0 auto',
              color: 'var(--text-primary)',
            }}
          >
            Turn Natural Intent into{' '}
            <span className="gradient-text">Autonomous Action.</span>
          </h1>

          {/* Hero Subhead */}
          <p
            style={{
              marginTop: '1.75rem',
              fontSize: 'clamp(1.05rem, 1.8vw, 1.25rem)',
              lineHeight: 1.7,
              color: 'var(--text-muted)',
              maxWidth: '44rem',
              margin: '1.75rem auto 0',
              fontWeight: 450,
            }}
          >
            Describe complex operations in plain English. Agentflow synthesizes production-ready visual DAGs that plan, execute, validate, and self-heal automatically across your tools.
          </p>

          {/* Primary Action Buttons */}
          <div
            style={{
              marginTop: '2.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <Link
              href="/register"
              className="button"
              style={{
                padding: '0.85rem 1.85rem',
                fontSize: '1rem',
                fontWeight: 700,
                boxShadow: '0 6px 24px -4px rgba(56,189,248,0.4)',
                borderRadius: '0.85rem'
              }}
            >
              <span>Build a Workflow Free</span>
              <ArrowRight className="ml-2" size={18} />
            </Link>

            <Link
              href="/workflows/builder"
              className="button-secondary"
              style={{
                padding: '0.85rem 1.75rem',
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Workflow size={18} style={{ color: 'var(--accent)' }} />
              <span>Explore Visual Canvas</span>
            </Link>

            <Link
              href="/dashboard"
              className="button-secondary"
              style={{
                padding: '0.85rem 1.5rem',
                fontSize: '0.95rem',
                borderRadius: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Activity size={17} style={{ color: '#10b981' }} />
              <span>Live Console</span>
            </Link>
          </div>

          {/* Value Badges */}
          <div
            style={{
              marginTop: '3rem',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '1.5rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
            }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} style={{ color: '#10b981' }} />
              <span>100% Visual DAG Graph</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={16} style={{ color: '#38bdf8' }} />
              <span>AgentGuard™ Enterprise Security</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw size={16} style={{ color: '#f59e0b' }} />
              <span>Zero-Config Self-Healing</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={16} style={{ color: '#ec4899' }} />
              <span>Sub-Second Live Streaming</span>
            </div>
          </div>
        </div>

        {/* Interactive Hero Simulator */}
        <div id="simulator" style={{ marginTop: '4rem', scrollMarginTop: '5rem' }}>
          <div
            className="card"
            style={{
              padding: '0',
              overflow: 'hidden',
              borderRadius: '1.5rem',
              border: '1px solid var(--border)',
              boxShadow: '0 20px 50px -15px rgba(0,0,0,0.2), 0 0 35px -5px rgba(56,189,248,0.12)',
            }}
          >
            {/* Simulator Header Bar */}
            <div
              style={{
                background: 'var(--bg-panel-muted)',
                padding: '1rem 1.5rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="text-xs font-bold tracking-wide flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Terminal size={14} style={{ color: 'var(--accent)' }} />
                  <span>INTERACTIVE WORKFLOW SYNTHESIS & EXECUTION SANDBOX</span>
                </div>
              </div>

              {/* Recovery Simulation Toggle */}
              <button
                onClick={handleToggleRecoverySim}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition flex items-center gap-2"
                style={{
                  background: recoverySimActive ? 'rgba(245,158,11,0.15)' : 'transparent',
                  borderColor: recoverySimActive ? '#f59e0b' : 'var(--border)',
                  color: recoverySimActive ? '#f59e0b' : 'var(--text-muted)'
                }}
              >
                <RefreshCw size={13} className={recoverySimActive ? 'animate-spin' : ''} />
                <span>{recoverySimActive ? 'Self-Healing Active (Simulated)' : 'Simulate API Failure & Healing'}</span>
              </button>
            </div>

            {/* Scenario Selector Pills */}
            <div
              style={{
                padding: '1.25rem 1.5rem 0.5rem',
                display: 'flex',
                gap: '0.6rem',
                overflowX: 'auto',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-panel)',
              }}
            >
              {SCENARIOS.map((scenario) => {
                const Icon = scenario.icon;
                const isSelected = activeScenario.id === scenario.id;
                return (
                  <button
                    key={scenario.id}
                    onClick={() => setActiveScenario(scenario)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition"
                    style={{
                      background: isSelected ? 'var(--accent)' : 'var(--bg-panel-muted)',
                      color: isSelected ? '#0e1a30' : 'var(--text-muted)',
                      border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                      boxShadow: isSelected ? '0 2px 10px rgba(56,189,248,0.3)' : 'none'
                    }}
                  >
                    <Icon size={14} />
                    <span>{scenario.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Prompt Input & Synthesize Bar */}
            <div style={{ padding: '1.25rem 1.5rem', background: 'var(--bg-panel)' }}>
              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'center',
                  background: 'var(--bg-panel-muted)',
                  border: '1px solid var(--border)',
                  borderRadius: '1rem',
                  padding: '0.5rem 0.75rem 0.5rem 1rem',
                }}
              >
                <Sparkles size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Describe your workflow in plain English..."
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit'
                  }}
                />
                <button
                  onClick={handleRunSimulation}
                  disabled={isSimulating}
                  className="button"
                  style={{
                    padding: '0.55rem 1.15rem',
                    fontSize: '0.82rem',
                    borderRadius: '0.75rem',
                    flexShrink: 0,
                    gap: '0.4rem'
                  }}
                >
                  <Play size={14} />
                  <span>{isSimulating ? 'Synthesizing...' : 'Run Pipeline'}</span>
                </button>
              </div>
            </div>

            {/* Sandbox Split View: Visual Graph on Left, Agent Telemetry on Right */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                borderTop: '1px solid var(--border)',
                background: 'var(--bg-panel)',
              }}
            >
              {/* Left Column: Visual Pipeline Nodes */}
              <div style={{ padding: '1.5rem', borderRight: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                    <Workflow size={14} style={{ color: 'var(--accent)' }} />
                    <span>Synthesized Directed Acyclic Graph (DAG)</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Validated & Live
                  </span>
                </div>

                {/* Nodes Stack */}
                <div className="flex flex-col gap-3 relative">
                  {activeScenario.nodes.map((node, index) => (
                    <div
                      key={node.id}
                      className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-panel-muted)] transition relative card-hover"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                            style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
                          >
                            0{index + 1}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-[var(--text-primary)]">{node.label}</div>
                            <div className="text-[11px] text-[var(--text-muted)]">{node.desc}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-base)] border border-[var(--border)] text-[var(--accent)]">
                            {node.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span>DAG Resolution: 4 steps • 0 cycles</span>
                  <Link href="/workflows/builder" className="text-[var(--accent)] font-semibold flex items-center gap-1 hover:underline">
                    <span>Open in Full Canvas</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              </div>

              {/* Right Column: Live Multi-Agent Streaming Console */}
              <div style={{ padding: '1.5rem', background: 'var(--bg-base)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                    <Terminal size={14} style={{ color: '#10b981' }} />
                    <span>Live Multi-Agent Event Stream</span>
                  </div>
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">Socket.IO 2.4ms</span>
                </div>

                {/* Terminal Log Container */}
                <div
                  className="terminal-window rounded-xl p-3.5 font-mono text-xs flex flex-col gap-2.5 shadow-inner"
                  style={{ minHeight: '260px', maxHeight: '310px', overflowY: 'auto' }}
                >
                  {simulatedLogs.map((log, i) => {
                    let badgeColor = '#38bdf8';
                    let badgeBg = 'rgba(56,189,248,0.15)';
                    if (log.agent === 'EXECUTOR') { badgeColor = '#10b981'; badgeBg = 'rgba(16,185,129,0.15)'; }
                    if (log.agent === 'VALIDATOR') { badgeColor = '#a855f7'; badgeBg = 'rgba(168,85,247,0.15)'; }
                    if (log.agent === 'AGENT_GUARD') { badgeColor = '#ec4899'; badgeBg = 'rgba(236,72,153,0.15)'; }
                    if (log.agent === 'RECOVERY') { badgeColor = '#f59e0b'; badgeBg = 'rgba(245,158,11,0.2)'; }
                    if (log.agent === 'WARNING') { badgeColor = '#ef4444'; badgeBg = 'rgba(239,68,68,0.2)'; }

                    return (
                      <div key={i} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-[10px] text-slate-500 select-none pt-0.5">{log.time}</span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0"
                          style={{ color: badgeColor, background: badgeBg }}
                        >
                          [{log.agent}]
                        </span>
                        <span className="text-slate-200">{log.msg}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Agent Stream Connected</span>
                  </div>
                  <span className="font-mono text-[11px]">Audit ID: #run_9921e4</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5-Agent Autonomous Chain Architecture Section */}
      <section id="architecture" style={{ maxWidth: '84rem', margin: '0 auto', padding: '6rem 1.5rem', scrollMarginTop: '4rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '44rem', margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderRadius: '999px',
              padding: '0.35rem 0.95rem',
              background: 'rgba(56,189,248,0.1)',
              border: '1px solid rgba(56,189,248,0.25)',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '1rem',
            }}
          >
            <Cpu size={14} /> Autonomous Core Engine
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 850, letterSpacing: '-0.025em', margin: 0 }}>
            Five Specialized Agents.{' '}
            <span className="gradient-text">One Unified Chain.</span>
          </h2>
          <p style={{ marginTop: '1rem', fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--text-muted)' }}>
            Static scripts break when real-world inputs deviate. Agentflow combines 5 purpose-built autonomous agents that plan, execute, validate, self-heal, and monitor every execution.
          </p>
        </div>

        {/* 5 Agent Cards Grid */}
        <div
          style={{
            marginTop: '3.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {AGENT_ROLES.map((agent) => {
            const Icon = agent.icon;
            return (
              <div
                key={agent.name}
                className="card card-hover"
                style={{
                  padding: '1.75rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '1.25rem',
                  border: '1px solid var(--border)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '0.85rem',
                        background: agent.bg,
                        color: agent.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={22} />
                    </div>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        background: 'var(--bg-panel-muted)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-muted)'
                      }}
                    >
                      {agent.tag}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
                    {agent.name}
                  </h3>

                  <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-muted)', margin: 0 }}>
                    {agent.desc}
                  </p>
                </div>

                <div
                  style={{
                    marginTop: '1.5rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: agent.color,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Activity size={13} />
                  <span>{agent.metric}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Platform Pillars / Core Features */}
      <section id="features" style={{ maxWidth: '84rem', margin: '0 auto', padding: '5rem 1.5rem 6rem', scrollMarginTop: '4rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '44rem', margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderRadius: '999px',
              padding: '0.35rem 0.95rem',
              background: 'var(--accent-bg)',
              border: '1px solid rgba(56,189,248,0.25)',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '1rem',
            }}
          >
            <Layers size={14} /> Full Operational Suite
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 850, letterSpacing: '-0.025em', margin: 0 }}>
            Engineered for <span className="gradient-text">Resilience & Scale.</span>
          </h2>
          <p style={{ marginTop: '1rem', fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--text-muted)' }}>
            Everything you need to run mission-critical AI operations in production with strict controls, real-time observability, and guaranteed uptime.
          </p>
        </div>

        <div
          style={{
            marginTop: '3.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {PLATFORM_FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="card card-hover"
                style={{
                  padding: '2rem',
                  borderRadius: '1.25rem',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      style={{
                        borderRadius: '0.75rem',
                        background: 'var(--accent-bg)',
                        padding: '0.65rem',
                        color: 'var(--accent)',
                        display: 'inline-flex',
                      }}
                    >
                      <Icon size={22} />
                    </div>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.25rem 0.65rem',
                        borderRadius: '999px',
                        background: 'var(--bg-panel-muted)',
                        border: '1px solid var(--border)',
                        color: 'var(--accent)',
                      }}
                    >
                      {feat.tag}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.75rem', color: 'var(--text-primary)' }}>
                    {feat.title}
                  </h3>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--text-muted)', margin: 0 }}>
                    {feat.desc}
                  </p>
                </div>

                <div style={{ marginTop: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent)' }}>
                  <span>Explore capability</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works (3 Simple Steps) */}
      <section style={{ maxWidth: '84rem', margin: '0 auto', padding: '4rem 1.5rem 6rem' }}>
        <div
          className="card"
          style={{
            padding: '3.5rem 2.5rem',
            borderRadius: '1.75rem',
            border: '1px solid var(--border)',
            background: 'var(--bg-panel)',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '40rem', margin: '0 auto 3rem' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, margin: 0 }}>
              From Prompt to Production in <span className="gradient-text">3 Steps</span>
            </h2>
            <p style={{ marginTop: '0.75rem', fontSize: '1rem', color: 'var(--text-muted)' }}>
              No complicated DSLs or tedious manual node plumbing required.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '2rem',
              position: 'relative',
            }}
          >
            <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-panel-muted)]">
              <span className="text-3xl font-black gradient-text font-mono">01</span>
              <h3 className="text-base font-bold mt-2 text-[var(--text-primary)]">Prompt in English</h3>
              <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed">
                Describe your automation goals naturally. The Planner Agent resolves dependencies, handles branches, and synthesizes clean DAG nodes.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-panel-muted)]">
              <span className="text-3xl font-black gradient-text font-mono">02</span>
              <h3 className="text-base font-bold mt-2 text-[var(--text-primary)]">Fine-Tune on Canvas</h3>
              <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed">
                Tweak parameters in the visual node inspector, plug in OAuth credentials, and set conditional approval rules visually.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-panel-muted)]">
              <span className="text-3xl font-black gradient-text font-mono">03</span>
              <h3 className="text-base font-bold mt-2 text-[var(--text-primary)]">Deploy & Stream</h3>
              <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed">
                Execute with full BullMQ queue scalability. Stream live telemetry, catch errors with Recovery Agent, and audit every step.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Ecosystem Showcase */}
      <section id="integrations" style={{ maxWidth: '84rem', margin: '0 auto', padding: '4rem 1.5rem 6rem', scrollMarginTop: '4rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '44rem', margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderRadius: '999px',
              padding: '0.35rem 0.95rem',
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.25)',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#10b981',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '1rem',
            }}
          >
            <Share2 size={14} /> Ecosystem
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 850, letterSpacing: '-0.025em', margin: 0 }}>
            Connect Your <span className="gradient-text">Entire Toolchain.</span>
          </h2>
          <p style={{ marginTop: '1rem', fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--text-muted)' }}>
            Plug into your daily applications seamlessly with native OAuth 2.0 authentication, webhooks, and secure API key vaults.
          </p>
        </div>

        <div
          style={{
            marginTop: '3.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {INTEGRATIONS.map((tool) => (
            <div
              key={tool.name}
              className="card card-hover"
              style={{
                padding: '1.5rem',
                borderRadius: '1.25rem',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  fontSize: '1.75rem',
                  padding: '0.5rem',
                  background: 'var(--bg-panel-muted)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border)',
                  lineHeight: 1,
                }}
              >
                {tool.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div className="flex items-center justify-between">
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{tool.name}</h4>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-bg)', padding: '0.15rem 0.5rem', borderRadius: '999px' }}>
                    {tool.type}
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.4rem', lineHeight: 1.5, margin: '0.4rem 0 0' }}>
                  {tool.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <Link href="/integrations" className="button-secondary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}>
            <span>View All Supported Connectors & OAuth Specs</span>
            <ArrowRight size={15} className="ml-2" />
          </Link>
        </div>
      </section>

      {/* Enterprise Security & Trust */}
      <section id="security" style={{ maxWidth: '84rem', margin: '0 auto', padding: '3rem 1.5rem 6rem', scrollMarginTop: '4rem' }}>
        <div
          className="card"
          style={{
            padding: '3.5rem 2.5rem',
            borderRadius: '1.75rem',
            border: '1px solid var(--border)',
            background: 'linear-gradient(180deg, var(--bg-panel) 0%, var(--bg-panel-muted) 100%)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'center' }}>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  borderRadius: '999px',
                  padding: '0.35rem 0.95rem',
                  background: 'rgba(56,189,248,0.1)',
                  border: '1px solid rgba(56,189,248,0.25)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '1rem',
                }}
              >
                <Shield size={14} /> Enterprise Hardened
              </div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 850, letterSpacing: '-0.02em', margin: 0 }}>
                Security is our <span className="gradient-text">Core Foundation.</span>
              </h2>
              <p style={{ marginTop: '1rem', fontSize: '1rem', lineHeight: 1.7, color: 'var(--text-muted)' }}>
                Your API keys, user data, and automated workflows are guarded by industry-grade encryption, role-based controls, and proactive runtime inspections.
              </p>

              <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-500 mt-0.5"><Check size={14} /></div>
                  <div>
                    <strong className="text-sm text-[var(--text-primary)]">256-bit AES GCM Credential Encryption</strong>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">All OAuth refresh tokens and LLM API keys are encrypted at rest with hardware-grade secrets.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-500 mt-0.5"><Check size={14} /></div>
                  <div>
                    <strong className="text-sm text-[var(--text-primary)]">PII Sanitization & Redaction</strong>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Sensitive customer info is scrubbed before passing into model prompts or telemetry logs.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-500 mt-0.5"><Check size={14} /></div>
                  <div>
                    <strong className="text-sm text-[var(--text-primary)]">Immutable Audit Trail</strong>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Every step execution, payload hash, and operator action is immutably timestamped in MongoDB.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Security Box */}
            <div
              className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-base)] flex flex-col gap-4 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                  <Lock size={15} style={{ color: 'var(--accent)' }} />
                  <span>AgentGuard™ Policy Inspector</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Perimeter Active
                </span>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[var(--bg-panel)] border border-[var(--border)] flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Rate Limiting</span>
                  <span className="text-emerald-500 font-bold">100 req/min (Enforced)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--bg-panel)] border border-[var(--border)] flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Max Execution Depth</span>
                  <span className="text-emerald-500 font-bold">12 Steps (Anti-Loop)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--bg-panel)] border border-[var(--border)] flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Credential Storage</span>
                  <span className="text-emerald-500 font-bold">AES-256 GCM</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--bg-panel)] border border-[var(--border)] flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Human-in-Loop</span>
                  <span className="text-emerald-500 font-bold">1-Click Signoff Ready</span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                <span>SOC2 Compliance Baseline</span>
                <span className="text-[var(--accent)] font-semibold">100% Policy Pass Rate</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (Accordion) */}
      <section id="faq" style={{ maxWidth: '64rem', margin: '0 auto', padding: '2rem 1.5rem 6rem', scrollMarginTop: '4rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderRadius: '999px',
              padding: '0.35rem 0.95rem',
              background: 'var(--accent-bg)',
              border: '1px solid rgba(56,189,248,0.25)',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '1rem',
            }}
          >
            <HelpCircle size={14} /> Clear Answers
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: 850, margin: 0 }}>
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {FAQS.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="card overflow-hidden"
                style={{
                  borderRadius: '1rem',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-panel)',
                }}
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-[var(--text-primary)] hover:text-[var(--accent)] transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className="shrink-0 transition-transform duration-200"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--accent)' }}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-0 text-sm text-[var(--text-muted)] leading-relaxed border-t border-[var(--border)] mt-1 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom High-Conversion Banner */}
      <section style={{ maxWidth: '84rem', margin: '0 auto', padding: '0 1.5rem 6rem' }}>
        <div
          className="card"
          style={{
            padding: '4rem 2rem',
            borderRadius: '2rem',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(2,132,199,0.18) 0%, rgba(56,189,248,0.12) 50%, rgba(129,140,248,0.15) 100%)',
            border: '1px solid rgba(56,189,248,0.3)',
            boxShadow: '0 20px 60px -15px rgba(56,189,248,0.2)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ maxWidth: '44rem', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.03em', margin: 0 }}>
              Ready to automate operations with{' '}
              <span className="gradient-text">autonomous intelligence?</span>
            </h2>
            <p style={{ marginTop: '1.25rem', fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Join forward-thinking operators designing resilient, self-healing agent pipelines in seconds.
            </p>

            <div style={{ marginTop: '2.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
              <Link
                href="/register"
                className="button"
                style={{
                  padding: '0.9rem 2rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: '0.85rem',
                  boxShadow: '0 8px 24px -4px rgba(56,189,248,0.45)'
                }}
              >
                <span>Create Free Workspace</span>
                <ArrowRight className="ml-2" size={18} />
              </Link>

              <Link
                href="/workflows/builder"
                className="button-secondary"
                style={{
                  padding: '0.9rem 1.8rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: '0.85rem'
                }}
              >
                <span>Launch Visual Canvas</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-panel-muted)',
          padding: '4rem 1.5rem 2.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '84rem',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2.5rem',
          }}
        >
          {/* Brand Col */}
          <div style={{ maxWidth: '20rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800, fontSize: '1.15rem' }}>
              <span style={{ borderRadius: '0.6rem', background: 'var(--accent)', padding: '0.45rem', color: '#0e1a30', display: 'flex' }}>
                <Workflow size={18} />
              </span>
              <span>Agentflow<span className="text-[var(--accent)]">_AI</span></span>
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
              Next-generation autonomous multi-agent automation platform with self-healing DAG workflows and live telemetry.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational (99.98% SLA)</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)', margin: '0 0 1rem' }}>
              Platform
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <Link href="/workflows/builder" className="hover:text-[var(--accent)] transition">Visual Canvas Builder</Link>
              <Link href="/dashboard" className="hover:text-[var(--accent)] transition">Live Dashboard</Link>
              <Link href="/integrations" className="hover:text-[var(--accent)] transition">Integrations Hub</Link>
              <Link href="/analytics" className="hover:text-[var(--accent)] transition">Analytics & Observability</Link>
            </div>
          </div>

          {/* Architecture Links */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)', margin: '0 0 1rem' }}>
              Agents & Security
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <a href="#architecture" className="hover:text-[var(--accent)] transition">Planner & Executor Chain</a>
              <a href="#architecture" className="hover:text-[var(--accent)] transition">Self-Healing Recovery Agent</a>
              <a href="#security" className="hover:text-[var(--accent)] transition">AgentGuard™ Perimeter</a>
              <a href="#security" className="hover:text-[var(--accent)] transition">AES-256 Vault Encryption</a>
            </div>
          </div>

          {/* Account Links */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)', margin: '0 0 1rem' }}>
              Get Started
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <Link href="/register" className="hover:text-[var(--accent)] transition">Create Free Workspace</Link>
              <Link href="/login" className="hover:text-[var(--accent)] transition">Operator Sign In</Link>
              <Link href="/settings" className="hover:text-[var(--accent)] transition">API & Key Management</Link>
            </div>
          </div>
        </div>

        <div
          style={{
            maxWidth: '84rem',
            margin: '3rem auto 0',
            paddingTop: '2rem',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
          }}
        >
          <div>
            © 2026 Agentflow_AI. All rights reserved.
          </div>
          <div className="flex gap-4">
            <span className="hover:text-[var(--accent)] cursor-pointer">Privacy Policy</span>
            <span className="hover:text-[var(--accent)] cursor-pointer">Terms of Service</span>
            <span className="hover:text-[var(--accent)] cursor-pointer">Security Whitepaper</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
