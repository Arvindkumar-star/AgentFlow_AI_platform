import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus, Radio, Sparkles, Zap } from 'lucide-react';
import api from '../services/api';
import ProtectedRoute from '../components/ProtectedRoute';
import AppShell, { PageHeading, StatusBadge } from '../components/AppShell';
import MetricGrid from '../components/MetricGrid';
import { getSocket } from '../services/socket';
import { useAuthStore } from '../store/authStore';

const AGENT_COLORS = {
  planner:    { color: '#818cf8', bg: 'rgba(129,140,248,.12)' },
  execution:  { color: '#34d399', bg: 'rgba(52,211,153,.12)' },
  validation: { color: '#fbbf24', bg: 'rgba(251,191,36,.12)' },
  recovery:   { color: '#f87171', bg: 'rgba(248,113,113,.12)' },
  monitoring: { color: 'var(--accent)', bg: 'var(--accent-bg)' },
};

function getGreeting(user) {
  const hour = new Date().getHours();
  const name = user?.name?.split(' ')[0] || 'operator';
  if (hour >= 5 && hour < 12)  return `Good morning, ${name}.`;
  if (hour >= 12 && hour < 17) return `Good afternoon, ${name}.`;
  if (hour >= 17 && hour < 21) return `Good evening, ${name}.`;
  return `Working late, ${name}.`;
}

export default function Dashboard() {
  const { user }                    = useAuthStore();
  const [data, setData]             = useState({});
  const [loading, setLoading]       = useState(true);
  const [liveEvents, setLiveEvents] = useState([]);
  const [activeRuns, setActiveRuns] = useState([]);
  const feedRef                     = useRef(null);

  // ── Initial data load ──────────────────────────────────────────
  const fetchDashboard = () =>
    api.get('/workflows/dashboard')
      .then(r => {
        setData(r.data);
        if (r.data.recentLogs?.length) {
          setLiveEvents(prev => {
            if (prev.length === 0) {
              return r.data.recentLogs.map(log => ({
                agent: log.agent,
                message: log.message,
                level: log.level,
                timestamp: log.createdAt,
                _ts: new Date(log.createdAt).getTime(),
              }));
            }
            return prev;
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => {
    fetchDashboard();

    // Fetch any currently RUNNING executions to subscribe to
    api.get('/executions', { params: { status: 'RUNNING', limit: 5 } })
      .then(r => setActiveRuns(r.data.executions || []))
      .catch(() => {});
  }, []);

  // ── Socket.IO — subscribe to live execution events ─────────────
  useEffect(() => {
    const socket = getSocket();
    socket.connect();

    const onAgentEvent = (e) => {
      setLiveEvents(prev => [{ ...e, _ts: Date.now() }, ...prev].slice(0, 50));
    };

    const onStatus = (e) => {
      fetchDashboard();
      if (e.status === 'RUNNING') {
        setActiveRuns(prev => prev.some(r => r._id === e.executionId) ? prev : [...prev, { _id: e.executionId }]);
      } else if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(e.status)) {
        setActiveRuns(prev => prev.filter(r => r._id !== e.executionId));
      }
    };

    socket.on('agent:event', onAgentEvent);
    socket.on('execution:status', onStatus);

    // Join rooms for all active runs
    activeRuns.forEach(r => socket.emit('join:execution', r._id));

    return () => {
      socket.off('agent:event', onAgentEvent);
      socket.off('execution:status', onStatus);
      activeRuns.forEach(r => socket.emit('leave:execution', r._id));
    };
  }, [activeRuns]);

  // Auto-scroll AI feed to top when new events arrive
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0;
  }, [liveEvents]);

  // Normalize backend field names — backend returns { total, active, executions, successRate }
  const raw   = data.stats || data;
  const stats = {
    totalWorkflows:  raw.totalWorkflows  ?? raw.total      ?? null,
    activeWorkflows: raw.activeWorkflows ?? raw.active     ?? null,
    totalExecutions: raw.totalExecutions ?? raw.executions ?? null,
    successRate:     raw.successRate     ?? null,
  };

  return (
    <ProtectedRoute>
      <AppShell title="Operations overview">
        <PageHeading
          eyebrow="Command center"
          title={getGreeting(user)}
          description="Monitor your automation estate and move work forward with confidence."
          action={
            <Link className="button" href="/workflows/builder">
              <Plus size={17} style={{ marginRight: '0.5rem' }} /> New workflow
            </Link>
          }
        />

        <MetricGrid metrics={[
          { label: 'Total workflows',  value: stats.totalWorkflows  !== null ? stats.totalWorkflows  : '—', detail: 'Across your workspace' },
          { label: 'Active workflows', value: stats.activeWorkflows !== null ? stats.activeWorkflows : '—', detail: 'Ready to execute' },
          { label: 'Total executions', value: stats.totalExecutions !== null ? stats.totalExecutions : '—', detail: 'All time' },
          { label: 'Success rate',     value: stats.successRate     !== null ? `${stats.successRate}%` : '—', detail: 'Execution health' },
        ]} />

        {/* ── Main 3-column grid ───────────────────────────────── */}
        <div style={{ marginTop: '2rem', display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>

          {/* Recent executions — spans 2 cols */}
          <div className="card" style={{ padding: '1.5rem', gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontWeight: 600, margin: 0 }}>Recent executions</h3>
              <Link href="/executions" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: 'var(--accent)' }}>
                View all <ArrowRight size={15} />
              </Link>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ height: '56px', borderRadius: '0.75rem', background: 'var(--bg-panel-muted)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {(data.recentExecutions || []).slice(0, 5).map(run => (
                  <Link
                    href={`/executions/${run._id}`}
                    key={run._id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      borderRadius: '0.75rem', border: '1px solid var(--border)',
                      padding: '0.875rem 1rem', background: 'var(--bg-panel-muted)',
                      transition: 'border-color 0.15s', color: 'var(--text-primary)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                        {run.workflowId?.name || 'Workflow execution'}
                      </div>
                      <div style={{ marginTop: '0.2rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {run.startTime ? new Date(run.startTime).toLocaleString() : 'Recently'}
                      </div>
                    </div>
                    <StatusBadge status={run.status} />
                  </Link>
                ))}
                {!data.recentExecutions?.length && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>
                    No executions yet. Launch your first workflow.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* AI Builder promo */}
          <div className="card" style={{
            padding: '1.5rem', display: 'flex', flexDirection: 'column',
            background: 'linear-gradient(135deg, var(--accent-bg) 0%, var(--bg-panel) 100%)',
            borderColor: 'rgba(103,232,249,.3)',
          }}>
            <Sparkles style={{ color: 'var(--accent)' }} />
            <h3 style={{ marginTop: '1.25rem', fontSize: '1.05rem', fontWeight: 600 }}>Describe it. We'll build it.</h3>
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-muted)', flex: 1 }}>
              Use natural language to turn an operational idea into a runnable graph.
            </p>
            <Link href="/workflows/builder" style={{ marginTop: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent)' }}>
              Open AI builder <ArrowRight size={15} />
            </Link>
          </div>

          {/* ── AI Activity Feed — spans full width ──────────────── */}
          <div className="card" style={{ padding: '1.5rem', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <Radio size={16} style={{ color: 'var(--accent)' }} />
                <h3 style={{ fontWeight: 600, margin: 0 }}>Live AI activity feed</h3>
                {activeRuns.length > 0 && (
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    fontSize: '0.7rem', color: '#10b981', fontWeight: 600,
                    background: 'rgba(16,185,129,.1)', borderRadius: '999px', padding: '0.2rem 0.5rem',
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', animation: 'livePulse 1.2s ease-in-out infinite', display: 'inline-block' }} />
                    {activeRuns.length} running
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>Real-time · Socket.IO</span>
            </div>

            <div ref={feedRef} style={{ maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {liveEvents.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <Zap size={28} style={{ color: 'var(--text-faint)', margin: '0 auto 0.5rem', display: 'block', opacity: 0.4 }} />
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-faint)', margin: 0 }}>
                    Agent events will stream here when a workflow is executing.
                  </p>
                </div>
              ) : (
                liveEvents.map((ev, i) => {
                  const style = AGENT_COLORS[ev.agent] || AGENT_COLORS.monitoring;
                  return (
                    <div key={`${ev._ts}-${i}`} style={{
                      display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                      borderRadius: '0.625rem', padding: '0.625rem 0.875rem',
                      background: i === 0 ? style.bg : 'var(--bg-panel-muted)',
                      border: `1px solid ${i === 0 ? style.color + '40' : 'var(--border)'}`,
                      transition: 'background 0.3s',
                    }}>
                      <span style={{
                        flexShrink: 0, borderRadius: '999px', padding: '0.15rem 0.5rem',
                        fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.06em', color: style.color, background: style.bg,
                      }}>
                        {ev.agent || 'system'}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', flex: 1 }}>{ev.message}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-faint)', flexShrink: 0, marginTop: '0.1rem' }}>
                        {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : 'now'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <style>{`
          @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
          @keyframes livePulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(1.4); } }
        `}</style>
      </AppShell>
    </ProtectedRoute>
  );
}
