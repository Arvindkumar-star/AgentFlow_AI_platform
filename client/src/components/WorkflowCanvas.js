import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  Handle,
  Position,
  applyNodeChanges,
  applyEdgeChanges,
  BackgroundVariant,
  ConnectionLineType,
  ConnectionMode,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import AgentGuardNode from './WorkflowCanvas/nodes/AgentGuardNode';
import RazorpayNode from './WorkflowCanvas/nodes/RazorpayNode';
import ProofInspectorDrawer from './Analytics/ProofInspectorDrawer';
import AttackSimulatorButton from './Testing/AttackSimulatorButton';
import AnimatedGlowEdge from './WorkflowCanvas/edges/AnimatedGlowEdge';
import { syncBranchStatesOnAction } from './WorkflowCanvas/CanvasContainer';
import {
  Mail,
  Hash,
  MessageSquare,
  Table,
  Play,
  GitBranch,
  Zap,
  Sparkles,
  Bell,
  FileText,
  Layers,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  Linkedin,
  Twitter,
  Video,
  Camera,
  Users,
} from 'lucide-react';

// ── Node type registry ────────────────────────────────────────────────────────
const NODE_TYPE_META = {
  // Razorpay Payment System
  razorpay:         { color: '#38bdf8', bg: '#081726', border: '#0284c7', icon: '💳', label: 'RAZORPAY' },
  razorpay_payout:  { color: '#38bdf8', bg: '#081726', border: '#0284c7', icon: '💳', label: 'RAZORPAY' },
  payout:           { color: '#38bdf8', bg: '#081726', border: '#0284c7', icon: '💳', label: 'RAZORPAY' },
  // Guardrails
  agentGuard:       { color: '#22d3ee', bg: '#081726', border: '#0e7490', icon: '🛡', label: 'ZK GUARD' },
  agent_guard:      { color: '#22d3ee', bg: '#081726', border: '#0e7490', icon: '🛡', label: 'ZK GUARD' },
  // Social Media
  linkedin:         { color: '#0077b5', bg: '#031a29', border: '#005582', icon: '💼', label: 'LINKEDIN' },
  twitter:          { color: '#1d9bf0', bg: '#02182b', border: '#0d6efd', icon: '🐦', label: 'TWITTER' },
  youtube:          { color: '#ef4444', bg: '#2b0909', border: '#991b1b', icon: '▶', label: 'YOUTUBE' },
  facebook:         { color: '#1877f2', bg: '#081735', border: '#1d4ed8', icon: '👥', label: 'FACEBOOK' },
  instagram:        { color: '#e1306c', bg: '#2b0518', border: '#be185d', icon: '📸', label: 'INSTAGRAM' },
  // Core types
  trigger:          { color: '#10b981', bg: '#022c1e', border: '#065f46', icon: '▶', label: 'TRIGGER' },
  manual:           { color: '#10b981', bg: '#022c1e', border: '#065f46', icon: '▶', label: 'TRIGGER' },
  start:            { color: '#10b981', bg: '#022c1e', border: '#065f46', icon: '▶', label: 'TRIGGER' },
  // Gmail
  gmail:            { color: '#f87171', bg: '#2d0a0a', border: '#7f1d1d', icon: '✉', label: 'GMAIL' },
  email:            { color: '#f87171', bg: '#2d0a0a', border: '#7f1d1d', icon: '✉', label: 'EMAIL' },
  send:             { color: '#f87171', bg: '#2d0a0a', border: '#7f1d1d', icon: '✉', label: 'GMAIL' },
  sendEmail:        { color: '#f87171', bg: '#2d0a0a', border: '#7f1d1d', icon: '✉', label: 'EMAIL' },
  // Slack
  slack:            { color: '#818cf8', bg: '#12103d', border: '#3730a3', icon: '#', label: 'SLACK' },
  // Discord
  discord:          { color: '#a78bfa', bg: '#1b0a3a', border: '#4c1d95', icon: '⊕', label: 'DISCORD' },
  // Google Sheets
  'google-sheets':  { color: '#34d399', bg: '#022c1e', border: '#065f46', icon: '⊞', label: 'SHEETS' },
  // Logic
  condition:        { color: '#fbbf24', bg: '#1c0e00', border: '#78350f', icon: '◆', label: 'CONDITION' },
  // Actions
  action:           { color: '#38bdf8', bg: '#0a1520', border: '#0c4a6e', icon: '⚡', label: 'ACTION' },
  // Notification / end
  notification:     { color: '#67e8f9', bg: '#031820', border: '#0e7490', icon: '🔔', label: 'NOTIFY' },
  end:              { color: '#67e8f9', bg: '#031820', border: '#0e7490', icon: '⏹', label: 'END' },
  complete:         { color: '#67e8f9', bg: '#031820', border: '#0e7490', icon: '✓', label: 'DONE' },
  // Log
  log:              { color: '#94a3b8', bg: '#0a0f1a', border: '#1e293b', icon: '📋', label: 'LOG' },
  // AI
  ai:               { color: '#c084fc', bg: '#1a0534', border: '#6b21a8', icon: '✦', label: 'AI' },
  // Default
  default:          { color: '#67e8f9', bg: '#0e1628', border: '#1e2d47', icon: '●', label: 'NODE' },
};

function getMeta(type) {
  return NODE_TYPE_META[type] || NODE_TYPE_META.default;
}

// ── Per-type preview text ──────────────────────────────────────────────────────
function getNodePreview(data, type) {
  if (!data) return null;
  const t = type || data?.type || '';

  // AgentGuard ZK
  if (['agentGuard', 'agent_guard', 'zk_guard'].includes(t)) {
    const max = data.maxLimit !== undefined ? data.maxLimit : 1000;
    const req = data.requestedAmount !== undefined ? data.requestedAmount : 0;
    return `Max: ₹${max} · Req: ₹${req}`;
  }

  // Razorpay Payout
  if (['razorpay', 'razorpay_payout', 'payout'].includes(t)) {
    const amt = data.amount !== undefined ? data.amount : (data.requestedAmount || 4200);
    const vendor = data.vendor || 'AWS India';
    return `Vendor: ${vendor} · ₹${amt}`;
  }

  // Gmail / email
  if (['gmail', 'email', 'send', 'sendEmail'].includes(t)) {
    const parts = [];
    if (data.to)      parts.push(`To: ${data.to}`);
    if (data.subject) parts.push(data.subject);
    if (data.subtitle && !parts.length) parts.push(data.subtitle);
    if ((data.message || data.body) && parts.length <= 1) parts.push((data.message || data.body).slice(0, 35));
    return parts.join(' · ') || 'Send email';
  }
  // Trigger
  if (['trigger', 'manual', 'start'].includes(t)) {
    return data.description || data.event || 'Starts the workflow';
  }
  // Slack
  if (t === 'slack') {
    return data.channel
      ? `${data.channel}${data.message ? ' · ' + data.message.slice(0, 30) : ''}`
      : (data.message?.slice(0, 40) || 'Post message');
  }
  // Discord
  if (t === 'discord') return data.message?.slice(0, 40) || 'Post to Discord';
  // Sheets
  if (t === 'google-sheets') return data.action === 'appendRow' ? 'Append row' : (data.action || 'Sheets action');
  // Condition
  if (t === 'condition') {
    if (data.field && data.operator) return `${data.field} ${data.operator} ${data.value ?? ''}`;
    return data.expression || 'Evaluate condition';
  }
  // Notification / end
  if (['notification', 'end', 'complete'].includes(t)) {
    return data.subtitle || data.message?.slice(0, 40) || null;
  }
  // AI
  if (t === 'ai') return data.model || data.prompt?.slice(0, 40) || 'AI step';
  // Action
  if (t === 'action') return data.description?.slice(0, 45) || data.action || null;
  // Log
  if (t === 'log') return data.message?.slice(0, 40) || 'Log output';

  // Social Media
  if (t === 'linkedin') return data.text ? data.text.slice(0, 45) : (data.content ? data.content.slice(0, 45) : 'Post to LinkedIn feed');
  if (t === 'twitter') return data.text ? data.text.slice(0, 45) : 'Post tweet to X';
  if (t === 'youtube') return data.query ? `Search: ${data.query}` : 'Search videos';
  if (t === 'facebook') return data.message ? data.message.slice(0, 45) : 'Post to Facebook page';
  if (t === 'instagram') return data.caption ? data.caption.slice(0, 45) : 'Post photo';

  return data.subtitle || data.description?.slice(0, 45) || null;
}

const NODE_ICONS = {
  gmail: Mail, email: Mail, send: Mail, sendEmail: Mail,
  slack: Hash,
  discord: MessageSquare,
  'google-sheets': Table,
  trigger: Play, manual: Play, start: Play,
  condition: GitBranch,
  action: Zap,
  notification: Bell, end: Bell, complete: CheckCircle2,
  log: FileText,
  ai: Sparkles,
  razorpay: CreditCard, razorpay_payout: CreditCard, payout: CreditCard,
  agentGuard: ShieldCheck, agent_guard: ShieldCheck, zk_guard: ShieldCheck,
  linkedin: Linkedin,
  twitter: Twitter,
  youtube: Video,
  facebook: Users,
  instagram: Camera,
  default: Layers,
};

// ── Uniform Cyberpunk / Operations Node Component ─────────────────────────────
function FlowNode({ data, selected, type }) {
  const resolvedType = data?.type || type || 'default';
  const meta = getMeta(resolvedType);
  const preview = getNodePreview(data, resolvedType);
  const IconComponent = NODE_ICONS[resolvedType] || NODE_ICONS[data?.type] || NODE_ICONS.default;

  const hasThreat = Boolean(data?.threatBadge || data?.isBlocked || data?.status === 'HALTED' || data?.status === 'BLOCKED');
  const isSuccess = Boolean(!hasThreat && (data?.status === 'SUCCESS' || data?.status === 'VERIFIED' || data?.status === 'PAID' || data?.status === 'SENT'));
  const threatBadgeText = data?.threatBadge || (data?.status === 'HALTED' ? 'PII_LEAK_PREVENTED' : 'PROMPT_INJECTION_DETECTED');

  return (
    <div
      style={{
        minWidth: 220,
        padding: '12px 16px',
        borderRadius: 14,
        background: hasThreat ? 'rgba(244, 63, 94, 0.08)' : isSuccess ? 'rgba(16, 185, 129, 0.06)' : 'var(--bg-panel)',
        border: hasThreat ? '2px solid #f43f5e' : isSuccess ? '2px solid #10b981' : `2px solid ${selected ? meta.color : 'var(--border)'}`,
        boxShadow: hasThreat
          ? '0 0 28px rgba(244, 63, 94, 0.65)'
          : isSuccess
          ? '0 0 28px rgba(16, 185, 129, 0.65)'
          : selected
          ? `0 0 22px ${meta.color}44`
          : 'var(--shadow)',
        fontFamily: 'inherit',
        color: 'var(--text-primary)',
        position: 'relative',
        transition: 'all 0.2s ease',
        animation: hasThreat ? 'attackPulse 1s ease-in-out infinite' : isSuccess ? 'emeraldGlow 2.5s ease-in-out infinite' : 'none',
      }}
      className={`flow-node shadow-md ${selected ? 'ring-2' : ''}`}
    >
      {/* Target Handles (Left for horizontal flow, Top for vertical flow) */}
      <Handle
        type="target"
        position={Position.Left}
        id="in-left"
        style={{
          width: 10,
          height: 10,
          background: hasThreat ? '#f43f5e' : isSuccess ? '#10b981' : meta.color,
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
          background: hasThreat ? '#f43f5e' : isSuccess ? '#10b981' : meta.color,
          border: '2px solid var(--bg-panel)',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: hasThreat ? 'rgba(244, 63, 94, 0.2)' : isSuccess ? 'rgba(16, 185, 129, 0.18)' : `${meta.color}18`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: `1px solid ${hasThreat ? 'rgba(244, 63, 94, 0.5)' : isSuccess ? 'rgba(16, 185, 129, 0.4)' : `${meta.color}33`}`,
          }}
        >
          <IconComponent size={20} color={hasThreat ? '#f43f5e' : isSuccess ? '#10b981' : meta.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: hasThreat ? '#f43f5e' : isSuccess ? '#10b981' : 'var(--text-primary)',
              letterSpacing: '0.02em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {data?.label || data?.name || meta.label}
          </div>
          <div
            style={{
              fontSize: 10,
              color: hasThreat ? '#fb7185' : isSuccess ? '#34d399' : 'var(--text-muted)',
              fontFamily: 'monospace',
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {hasThreat
              ? (data?.threatMessage || 'Intercepted by AgentGuard')
              : isSuccess
              ? 'Execution verified & completed'
              : (preview || meta.label)}
          </div>
        </div>
      </div>

      {hasThreat ? (
        <div
          style={{
            marginTop: 10,
            fontSize: 9,
            fontFamily: 'monospace',
            fontWeight: 800,
            letterSpacing: '0.05em',
            padding: '4px 8px',
            borderRadius: 6,
            background: 'rgba(244, 63, 94, 0.18)',
            border: '1px solid rgba(244, 63, 94, 0.55)',
            color: '#f43f5e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>🛑 {data.status === 'HALTED' ? 'HALTED' : 'BLOCKED'}</span>
          <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 4, background: 'rgba(244,63,94,0.25)', border: '1px solid rgba(244,63,94,0.4)' }}>{threatBadgeText}</span>
        </div>
      ) : isSuccess ? (
        <div
          style={{
            marginTop: 10,
            fontSize: 9,
            fontFamily: 'monospace',
            fontWeight: 800,
            letterSpacing: '0.05em',
            padding: '4px 8px',
            borderRadius: 6,
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.45)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✓ {data.status || 'VERIFIED'}</span>
          <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 4, background: 'rgba(16,185,129,0.25)', border: '1px solid rgba(16,185,129,0.4)' }}>VERIFIED</span>
        </div>
      ) : (
        <div
          style={{
            marginTop: 10,
            fontSize: 9,
            fontFamily: 'monospace',
            fontWeight: 700,
            letterSpacing: '0.05em',
            padding: '3px 8px',
            borderRadius: 6,
            background: 'var(--bg-panel-muted)',
            border: `1px solid ${meta.color}33`,
            color: meta.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{meta.label}</span>
          <span style={{ fontSize: 8, opacity: 0.7 }}>ACTIVE</span>
        </div>
      )}

      {/* Source Handles (Right for horizontal flow, Bottom for vertical flow) */}
      <Handle
        type="source"
        position={Position.Right}
        id="out-right"
        style={{
          width: 10,
          height: 10,
          background: meta.color,
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
          background: meta.color,
          border: '2px solid var(--bg-panel)',
        }}
      />
    </div>
  );
}

// ── Default edge options ───────────────────────────────────────────────────────
const defaultEdgeOptions = {
  animated: true,
  type: 'animatedGlow',
  markerEnd: { type: MarkerType.ArrowClosed, color: '#38bdf8', width: 18, height: 18 },
  style: { stroke: '#38bdf8', strokeWidth: 2 },
  labelStyle: { fill: '#94a3b8', fontSize: 11 },
  labelBgStyle: { fill: '#0b0f17', fillOpacity: 0.9 },
};

const nodeTypes = {
  // Payouts & Actions (all casing variants)
  razorpay: RazorpayNode,
  razorpay_payout: RazorpayNode,
  'razorpay-payout': RazorpayNode,
  razorpaypayout: RazorpayNode,
  payout: RazorpayNode,
  payment: RazorpayNode,
  // Guardrails (all casing variants)
  agentGuard: AgentGuardNode,
  agent_guard: AgentGuardNode,
  agentguard: AgentGuardNode,
  'agent-guard': AgentGuardNode,
  zk_guard: AgentGuardNode,
  zkguard: AgentGuardNode,
  zk: AgentGuardNode,
  // Core
  default: FlowNode,
  customNode: FlowNode,
  trigger: FlowNode,
  manual: FlowNode,
  start: FlowNode,
  // Communication
  gmail: FlowNode,
  email: FlowNode,
  send: FlowNode,
  sendEmail: FlowNode,
  slack: FlowNode,
  discord: FlowNode,
  // Data
  'google-sheets': FlowNode,
  // Logic
  condition: FlowNode,
  // Actions & output
  action: FlowNode,
  notification: FlowNode,
  end: FlowNode,
  complete: FlowNode,
  log: FlowNode,
  ai: FlowNode,
};

const edgeTypes = {
  animatedGlow: AnimatedGlowEdge,
  default: AnimatedGlowEdge,
};

// ── Context Menu ──────────────────────────────────────────────────────────────
function ContextMenu({ x, y, label, onDelete, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: x, top: y,
        zIndex: 1000,
        background: '#0e1628',
        border: '1px solid #1e3a5f',
        borderRadius: '10px',
        padding: '6px',
        minWidth: '160px',
        boxShadow: '0 8px 32px rgba(0,0,0,.6)',
        backdropFilter: 'blur(8px)',
        animation: 'contextIn 0.12s ease',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header */}
      <div style={{
        padding: '4px 10px 8px',
        fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
        color: '#475569', borderBottom: '1px solid #1e2d47', marginBottom: '4px',
      }}>
        {label}
      </div>

      {/* Delete action */}
      <button
        onClick={onDelete}
        style={{
          width: '100%', textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'transparent', border: 'none', borderRadius: '7px',
          padding: '7px 10px', cursor: 'pointer',
          fontSize: '13px', color: '#f87171',
          transition: 'background 0.12s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <span style={{ fontSize: '15px' }}>🗑</span>
        Delete
        <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#475569' }}>Del</span>
      </button>
    </div>
  );
}

// ── Floating delete button (shown when a node/edge is selected) ───────────────
function FloatingDeleteBar({ selectedNodes, selectedEdges, onDeleteSelected }) {
  const total = selectedNodes.length + selectedEdges.length;
  if (total === 0) return null;

  return (
    <div style={{
      position: 'absolute', bottom: '16px', left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 20, display: 'flex', alignItems: 'center', gap: '10px',
      background: 'rgba(14,22,40,0.94)', border: '1px solid #1e3a5f',
      borderRadius: '10px', padding: '8px 14px',
      boxShadow: '0 4px 24px rgba(0,0,0,.5)',
      backdropFilter: 'blur(8px)',
      fontSize: '13px', color: '#94a3b8',
      animation: 'contextIn 0.15s ease',
    }}>
      <span>
        {total} item{total > 1 ? 's' : ''} selected
      </span>
      <button
        onClick={onDeleteSelected}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '7px', padding: '5px 12px',
          cursor: 'pointer', fontSize: '12px', color: '#f87171',
          transition: 'background 0.12s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.28)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
      >
        🗑 Delete selected
      </button>
      <span style={{ fontSize: '10px', color: '#334155' }}>or press Delete</span>
    </div>
  );
}

// ── Connection hint banner ─────────────────────────────────────────────────────
function ConnectionHint({ show }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 20, background: 'rgba(14,22,40,0.92)', border: '1px solid #1e3a5f',
      borderRadius: '8px', padding: '7px 16px',
      display: 'flex', alignItems: 'center', gap: '8px',
      fontSize: '12px', color: '#67e8f9', pointerEvents: 'none',
      backdropFilter: 'blur(6px)', whiteSpace: 'nowrap',
      boxShadow: '0 4px 24px rgba(0,0,0,.5)',
    }}>
      <span style={{ fontSize: '16px' }}>⟶</span>
      Drag from the <strong style={{ color: '#34d399', margin: '0 4px' }}>●</strong>
      right handle to connect · Right-click any node or edge to delete
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function WorkflowCanvas({
  nodes = [],
  edges = [],
  onChange,
  onSelect,
  onDrop,
}) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [contextMenu, setContextMenu]   = useState(null); // { x, y, type:'node'|'edge', id, label }
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [selectedEdges, setSelectedEdges] = useState([]);
  const [proofInspectorNode, setProofInspectorNode] = useState(null);
  const wrapperRef = useRef(null);

  const handleAttackTriggered = useCallback((attackData) => {
    // 1. Immediately open the proof inspector drawer showing the violation
    setProofInspectorNode(attackData);

    const threatType = attackData?.threatType;

    // 2. In-Place Simulation Handling: Strictly modify existing canvas nodes in-place (No dynamic spawning)
    const updatedNodes = nodes.map(n => {
      const rawType = String(n.type || n.data?.type || '').toLowerCase();
      const label = String(n.data?.label || n.label || '').toLowerCase();

      // AgentGuard Node Update
      if (rawType.includes('agentguard') || rawType.includes('zk_guard') || rawType === 'zk') {
        const guardStatus = threatType === 'PII_DATA_LEAK'
          ? 'PII_LEAK_PREVENTED'
          : threatType === 'PROMPT_INJECTION'
          ? 'PROMPT_INJECTION_DETECTED'
          : 'CONSTRAINT_VIOLATION';

        return {
          ...n,
          data: {
            ...n.data,
            ...attackData,
            isAttacked: true,
            status: guardStatus,
            threatType,
          }
        };
      }

      // Scenario 1: PII Data Leak -> Halt downstream Gmail Action Node in-place
      if (threatType === 'PII_DATA_LEAK') {
        if (rawType.includes('gmail') || rawType.includes('email') || rawType.includes('send') || label.includes('gmail') || label.includes('email')) {
          return {
            ...n,
            data: {
              ...n.data,
              status: 'HALTED',
              threatBadge: 'PII_LEAK_PREVENTED',
              isBlocked: true,
              threatMessage: 'Halted: Outbound payload contains unredacted credit card data and secret API keys',
            }
          };
        }
      }

      // Scenario 2: Prompt Injection -> Block downstream AI / LLM Node in-place
      if (threatType === 'PROMPT_INJECTION') {
        if (rawType.includes('ai') || rawType.includes('llm') || rawType.includes('gpt') || label.includes('ai') || label.includes('llm') || label.includes('prompt')) {
          return {
            ...n,
            data: {
              ...n.data,
              status: 'BLOCKED',
              threatBadge: 'PROMPT_INJECTION_DETECTED',
              isBlocked: true,
              threatMessage: 'Blocked: System prompt overwrite and jailbreak attempt intercepted',
            }
          };
        }
      }

      // Scenario 3 & 4: Financial Over-limit / Offshore Fraud -> Block downstream Razorpay Node in-place
      if (!threatType || threatType === 'POLICY_BREACH' || threatType === 'SUSPICIOUS_REGISTRAR') {
        if (rawType.includes('razorpay') || rawType.includes('payout') || label.includes('razorpay') || label.includes('payout')) {
          return {
            ...n,
            data: {
              ...n.data,
              status: 'BLOCKED',
              payoutStatus: 'BLOCKED',
              threatBadge: 'BUDGET_CEILING_BREACH',
            }
          };
        }
      }

      return n;
    });

    onChange?.({ nodes: updatedNodes, edges });
  }, [nodes, edges, onChange]);

  // ── Global event listeners for ZK Threat simulation, approval, and inspector ──
  useEffect(() => {
    const handleOpenInspector = (e) => {
      if (e.detail) {
        setProofInspectorNode(e.detail);
      }
    };
    const handleAttackEvent = (e) => {
      if (e.detail) {
        handleAttackTriggered(e.detail);
      }
    };
    const handlePayoutApproved = (e) => {
      const d = e.detail || e;
      // Trigger a state pass across the active branch:
      // When action succeeds (PAID), clear all upstream error/halt badges on parent nodes and set them to VERIFIED / SUCCESS (Emerald Green)
      const updatedNodes = syncBranchStatesOnAction({
        nodes,
        edges,
        activeNodeId: d?.nodeId,
        actionStatus: 'PAID',
      });
      onChange?.({ nodes: updatedNodes, edges });
    };

    const handleSimulationReset = () => {
      setProofInspectorNode(null);
    };

    window.addEventListener('open-agentguard-inspector', handleOpenInspector);
    window.addEventListener('zk-attack-simulated', handleAttackEvent);
    window.addEventListener('payout-approved', handlePayoutApproved);
    window.addEventListener('zk-simulation-reset', handleSimulationReset);
    window.addEventListener('workflow-run-start', handleSimulationReset);
    return () => {
      window.removeEventListener('open-agentguard-inspector', handleOpenInspector);
      window.removeEventListener('zk-attack-simulated', handleAttackEvent);
      window.removeEventListener('payout-approved', handlePayoutApproved);
      window.removeEventListener('zk-simulation-reset', handleSimulationReset);
      window.removeEventListener('workflow-run-start', handleSimulationReset);
    };
  }, [nodes, edges, onChange, handleAttackTriggered]);

  // ── connection ──────────────────────────────────────────────────────────────
  const onConnect = useCallback(
    (connection) =>
      onChange?.({
        nodes,
        edges: addEdge({
          ...connection,
          animated: true,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed, color: '#67e8f9', width: 18, height: 18 },
          style: { stroke: '#67e8f9', strokeWidth: 2 },
        }, edges),
      }),
    [nodes, edges, onChange]
  );

  // ── node / edge changes (move, select, remove) ──────────────────────────────
  const onNodesChange = useCallback(
    (changes) => {
      const next = applyNodeChanges(changes, nodes);
      onChange?.({ nodes: next, edges });
      // track selection
      const sel = next.filter(n => n.selected);
      setSelectedNodes(sel);
    },
    [nodes, edges, onChange]
  );

  const onEdgesChange = useCallback(
    (changes) => {
      const next = applyEdgeChanges(changes, edges);
      onChange?.({ nodes, edges: next });
      const sel = next.filter(e => e.selected);
      setSelectedEdges(sel);
    },
    [nodes, edges, onChange]
  );

  // ── delete helpers ──────────────────────────────────────────────────────────
  const deleteNode = useCallback((nodeId) => {
    const newNodes = nodes.filter(n => n.id !== nodeId);
    const newEdges = edges.filter(e => e.source !== nodeId && e.target !== nodeId);
    onChange?.({ nodes: newNodes, edges: newEdges });
    setContextMenu(null);
    setSelectedNodes([]);
    onSelect?.(null);
  }, [nodes, edges, onChange, onSelect]);

  const deleteEdge = useCallback((edgeId) => {
    const newEdges = edges.filter(e => e.id !== edgeId);
    onChange?.({ nodes, edges: newEdges });
    setContextMenu(null);
    setSelectedEdges([]);
  }, [nodes, edges, onChange]);

  const deleteSelected = useCallback(() => {
    const nodeIds = new Set(selectedNodes.map(n => n.id));
    const edgeIds = new Set(selectedEdges.map(e => e.id));
    const newNodes = nodes.filter(n => !nodeIds.has(n.id));
    const newEdges = edges.filter(e =>
      !edgeIds.has(e.id) &&
      !nodeIds.has(e.source) &&
      !nodeIds.has(e.target)
    );
    onChange?.({ nodes: newNodes, edges: newEdges });
    setSelectedNodes([]);
    setSelectedEdges([]);
    onSelect?.(null);
  }, [selectedNodes, selectedEdges, nodes, edges, onChange, onSelect]);

  // ── keyboard delete ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // don't fire when typing in an input/textarea
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          e.preventDefault();
          deleteSelected();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedNodes, selectedEdges, deleteSelected]);

  // ── right-click handlers ────────────────────────────────────────────────────
  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    const bounds = wrapperRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    const meta = getMeta(node.data?.type || node.type);
    setContextMenu({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
      type: 'node',
      id: node.id,
      label: `${meta.label} · ${node.data?.label || node.data?.name || node.id}`,
    });
  }, []);

  const onEdgeContextMenu = useCallback((event, edge) => {
    event.preventDefault();
    const bounds = wrapperRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    setContextMenu({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
      type: 'edge',
      id: edge.id,
      label: `Connection · ${edge.source} → ${edge.target}`,
    });
  }, []);

  // ── normalise nodes & edges ─────────────────────────────────────────────────
  const normalizedNodes = useMemo(
    () => nodes.map((n) => {
      let rawType = n.type || n.data?.type || 'default';
      const lowerType = String(rawType).toLowerCase();
      const lowerLabel = String(n.label || n.data?.label || '').toLowerCase();
      const lowerDesc = String(n.data?.description || '').toLowerCase();

      // Intelligent auto-detection of AgentGuard and Razorpay
      if (
        lowerType.includes('agentguard') ||
        lowerType.includes('zk_guard') ||
        lowerType === 'zk' ||
        lowerLabel.includes('agentguard') ||
        lowerLabel.includes('zk guard') ||
        lowerDesc.includes('agentguard')
      ) {
        rawType = 'agentGuard';
      } else if (
        lowerType.includes('razorpay') ||
        lowerType.includes('payout') ||
        lowerLabel.includes('razorpay') ||
        lowerLabel.includes('payout') ||
        lowerDesc.includes('razorpay')
      ) {
        rawType = 'razorpay';
      }

      const resolvedType = nodeTypes[rawType] ? rawType : (nodeTypes[lowerType] ? lowerType : 'customNode');

      // Resolve human-readable, meaningful label instead of "Step"
      const existingLabel = (n.label || n.data?.label || n.data?.name || '').trim();
      const isGeneric = !existingLabel || /^(step|node|task|action|item)(\s*\d+)?$/i.test(existingLabel);
      
      const defaultMeaningfulLabels = {
        trigger: 'Start Workflow',
        manual: 'Manual Trigger',
        start: 'Start Workflow',
        linkedin: 'Post to LinkedIn',
        twitter: 'Post Tweet to Twitter',
        youtube: 'Search YouTube',
        facebook: 'Post to Facebook',
        instagram: 'Post to Instagram',
        gmail: 'Send / Read Gmail',
        slack: 'Post to Slack',
        discord: 'Post to Discord',
        'google-sheets': 'Append Row to Sheet',
        agentGuard: 'AgentGuard ZK Guard',
        razorpay: 'Razorpay Vendor Payout',
        ai: 'AI Content Generator',
        condition: 'Check Condition',
        notification: 'Send Notification',
        log: 'Log Event',
        action: 'Execute Action',
      };

      const finalLabel = isGeneric ? (defaultMeaningfulLabels[rawType] || defaultMeaningfulLabels[lowerType] || 'Workflow Action') : existingLabel;

      return {
        ...n,
        type: resolvedType,
        data: {
          ...n.data,
          // Always preserve the original type so FlowNode can style correctly
          type: rawType,
          label: finalLabel,
        },
      };
    }),
    [nodes]
  );


  const styledEdges = useMemo(
    () => edges.map((e) => ({
      ...e,
      animated: true,
      type: e.type || 'animatedGlow',
      markerEnd: e.markerEnd || { type: MarkerType.ArrowClosed, color: '#38bdf8', width: 18, height: 18 },
      style: e.style || { stroke: '#38bdf8', strokeWidth: 2 },
    })),
    [edges]
  );

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    onDrop?.(event);
  }, [onDrop]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const showHint = normalizedNodes.length >= 2 && styledEdges.length === 0 && !isConnecting;

  return (
    <div
      ref={wrapperRef}
      style={{
        height: '580px', borderRadius: '1rem',
        border: '1px solid #1e293b', background: '#0b0f17',
        overflow: 'hidden', position: 'relative',
      }}
      onDrop={handleDrop}
      onDragOver={onDragOver}
    >
      {/* Interactive ZK Stress Test & Attack Simulator Trigger */}
      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 30 }}>
        <AttackSimulatorButton onAttackTriggered={handleAttackTriggered} />
      </div>

      <ConnectionHint show={showHint} />

      <ReactFlow
        nodes={normalizedNodes}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onConnect={onConnect}
        onConnectStart={() => setIsConnecting(true)}
        onConnectEnd={() => setIsConnecting(false)}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => {
          onSelect?.(node);
          setContextMenu(null);
          const type = node.data?.type || node.type;
          if (type === 'agentGuard' || type === 'agent_guard' || type === 'zk_guard') {
            setProofInspectorNode(node);
          }
        }}
        onEdgeClick={() => setContextMenu(null)}
        onPaneClick={() => { onSelect?.(null); setContextMenu(null); setSelectedNodes([]); setSelectedEdges([]); }}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: '#38bdf8', strokeWidth: 2, strokeDasharray: '6 3' }}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={null}  /* we handle delete ourselves */
        multiSelectionKeyCode="Shift"
        selectionKeyCode="Shift"
      >
        <Background color="#334155" gap={24} size={1.5} variant="dots" />
        <Controls className="glass-panel !border-slate-800 !bg-slate-900/80 !text-slate-200 rounded-xl" />
        <MiniMap
          nodeColor={(n) => getMeta(n.data?.type || n.type).color}
          maskColor="rgba(0,0,0,0.3)"
          className="glass-panel !border-slate-800 rounded-xl"
        />
      </ReactFlow>

      {/* Proof Inspector Drawer for AgentGuard ZK Node */}
      <ProofInspectorDrawer
        isOpen={Boolean(proofInspectorNode)}
        onClose={() => setProofInspectorNode(null)}
        proofData={proofInspectorNode}
      />

      {/* Right-click context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          label={contextMenu.label}
          onClose={() => setContextMenu(null)}
          onDelete={() =>
            contextMenu.type === 'node'
              ? deleteNode(contextMenu.id)
              : deleteEdge(contextMenu.id)
          }
        />
      )}

      {/* Floating delete bar */}
      <FloatingDeleteBar
        selectedNodes={selectedNodes}
        selectedEdges={selectedEdges}
        onDeleteSelected={deleteSelected}
      />

      {/* Empty state */}
      {normalizedNodes.length === 0 && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem', opacity: 0.3 }}>⬡</div>
          <p style={{ fontSize: '0.875rem', color: '#3d4f68', textAlign: 'center' }}>
            Generate a workflow or drag nodes from the palette
          </p>
        </div>
      )}

      {/* Global styles */}
      <style>{`
        @keyframes contextIn {
          from { opacity: 0; transform: scale(0.93) translateY(-4px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        .react-flow__handle {
          opacity: 1 !important;
          transition: transform 0.15s, box-shadow 0.15s !important;
        }
        .react-flow__handle:hover,
        .react-flow__handle-connecting {
          transform: translateY(-50%) scale(1.45) !important;
          box-shadow: 0 0 0 4px rgba(103,232,249,0.35) !important;
        }
        .react-flow__handle-valid {
          background: #34d399 !important;
          box-shadow: 0 0 0 4px rgba(52,211,153,0.4) !important;
        }
        .react-flow__connection-line {
          stroke: #67e8f9 !important;
          stroke-width: 2px !important;
          stroke-dasharray: 6 3 !important;
        }
        .react-flow__edge-path { stroke-width: 2px !important; }
        .react-flow__edge.selected .react-flow__edge-path {
          stroke: #f87171 !important;
          stroke-width: 2.5px !important;
        }
        .react-flow__edge:hover .react-flow__edge-path {
          stroke: #fbbf24 !important;
          cursor: pointer;
        }
        .react-flow__node,
        .react-flow__node-default,
        .react-flow__node-input,
        .react-flow__node-output,
        .react-flow__node-group {
          background: transparent !important;
          background-color: transparent !important;
          border: none !important;
          padding: 0 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          color: inherit !important;
          width: auto !important;
          text-align: left !important;
        }
        .react-flow__node.selected > div {
          outline: 2px solid rgba(34, 211, 238, 0.5) !important;
        }
      `}</style>
    </div>
  );
}
