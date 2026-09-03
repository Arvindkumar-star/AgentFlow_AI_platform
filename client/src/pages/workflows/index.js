import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Workflow } from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';
import AppShell, { PageHeading, StatusBadge } from '../../components/AppShell';
import { useWorkflowStore } from '../../store/workflowStore';

export default function Workflows() {
  const { workflows, fetchWorkflows, loading } = useWorkflowStore();
  const [search, setSearch] = useState('');

  useEffect(() => { fetchWorkflows(); }, [fetchWorkflows]);

  const filtered = workflows.filter(w => w.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <ProtectedRoute>
      <AppShell title="Workflow library">
        <PageHeading
          eyebrow="Automation estate"
          title="Workflows"
          description="Build, version, and operate your automation graphs."
          action={
            <Link className="button" href="/workflows/builder">
              <Plus size={17} style={{ marginRight: '0.5rem' }} /> Create workflow
            </Link>
          }
        />

        {/* Search */}
        <div style={{ marginBottom: '1.25rem', maxWidth: '28rem', position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} size={17} />
          <input
            className="input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search workflows"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {loading ? (
            <div style={{ color: 'var(--text-muted)' }}>Loading workflows…</div>
          ) : (
            filtered.map(w => (
              <Link
                href={`/workflows/${w._id}`}
                className="card"
                key={w._id}
                style={{ padding: '1.25rem', display: 'block', transition: 'transform 0.15s, border-color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <span style={{ borderRadius: '0.5rem', background: 'var(--accent-bg)', padding: '0.5rem', color: 'var(--accent)', display: 'flex' }}>
                    <Workflow size={18} />
                  </span>
                  <StatusBadge status={w.status} />
                </div>
                <h3 style={{ marginTop: '1.25rem', fontWeight: 600 }}>{w.name}</h3>
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {w.description || 'No description provided.'}
                </p>
                <div style={{ marginTop: '1.25rem', fontSize: '0.7rem', color: 'var(--text-faint)' }}>
                  {w.nodes?.length || 0} nodes · v{w.version || 1}
                </div>
              </Link>
            ))
          )}
          {!loading && !filtered.length && (
            <div className="card" style={{ padding: '2rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              No workflows found.
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
