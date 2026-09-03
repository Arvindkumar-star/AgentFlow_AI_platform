import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';
import AppShell, { PageHeading, StatusBadge } from '../../components/AppShell';
import api from '../../services/api';

function formatDuration(ms) {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

const PAGE_SIZE = 15;

export default function Executions() {
  const [runs, setRuns]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [status, setStatus]   = useState('');
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (status) params.status = status;
      const { data } = await api.get('/executions', { params });
      setRuns(data.executions || []);
      setTotal(data.total || 0);
    } catch (_) {}
    finally { setLoading(false); }
  }, [page, status]);

  useEffect(() => { fetchRuns(); }, [fetchRuns]);

  // Reset to page 1 when filter changes
  const handleStatusChange = (e) => {
    setStatus(e.target.value);
    setPage(1);
  };

  return (
    <ProtectedRoute>
      <AppShell title="Execution history">
        <PageHeading
          eyebrow="Run center"
          title="Executions"
          description="Audit every workflow run and inspect the agent timeline."
          action={
            <select
              className="input"
              style={{ width: 'auto' }}
              value={status}
              onChange={handleStatusChange}
            >
              <option value="">All statuses</option>
              {['RUNNING', 'COMPLETED', 'FAILED', 'PAUSED', 'CANCELLED'].map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
          }
        />

        {/* Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {/* Header row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 140px 120px 160px',
            gap: '1rem',
            borderBottom: '1px solid var(--border)',
            padding: '0.75rem 1.25rem',
            fontSize: '0.65rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--text-faint)',
          }}>
            <span>Execution</span>
            <span>Status</span>
            <span>Duration</span>
            <span>Started</span>
          </div>

          {/* Skeleton / rows */}
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 140px 120px 160px',
                gap: '1rem',
                borderBottom: '1px solid var(--border)',
                padding: '1rem 1.25rem',
              }}>
                {[...Array(4)].map((_, j) => (
                  <div key={j} style={{
                    height: '14px', borderRadius: '6px',
                    background: 'var(--bg-panel-muted)',
                    animation: 'pulse 1.5s ease-in-out infinite',
                    width: j === 0 ? '70%' : '80%',
                  }} />
                ))}
              </div>
            ))
          ) : (
            runs.map(run => (
              <Link
                href={`/executions/${run._id}`}
                key={run._id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 140px 120px 160px',
                  gap: '1rem',
                  alignItems: 'center',
                  borderBottom: '1px solid var(--border)',
                  padding: '1rem 1.25rem',
                  fontSize: '0.875rem',
                  color: 'var(--text-primary)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-panel-muted)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                  {run.workflowId?.name || run.workflowSnapshot?.name || run._id}
                </span>
                <StatusBadge status={run.status} />
                <span style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                  {formatDuration(run.duration)}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {run.startTime ? new Date(run.startTime).toLocaleString() : '—'}
                </span>
              </Link>
            ))
          )}

          {!loading && !runs.length && (
            <div style={{ padding: '2.5rem 1.25rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              No executions match this filter.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                className="button-secondary"
                style={{ padding: '0.5rem 0.75rem' }}
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      minWidth: '2.25rem', height: '2.25rem',
                      borderRadius: '0.5rem', fontSize: '0.8rem',
                      border: '1px solid var(--border)',
                      background: p === page ? 'var(--accent)' : 'transparent',
                      color: p === page ? '#0e1a30' : 'var(--text-primary)',
                      fontWeight: p === page ? 700 : 400,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                className="button-secondary"
                style={{ padding: '0.5rem 0.75rem' }}
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
        `}</style>
      </AppShell>
    </ProtectedRoute>
  );
}
