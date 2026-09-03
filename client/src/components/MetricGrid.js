export default function MetricGrid({ metrics = [] }) {
  return (
    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
      {metrics.map((metric) => (
        <div className="card" key={metric.label} style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{metric.label}</div>
          <div style={{ marginTop: '0.75rem', fontSize: '1.875rem', fontWeight: 700 }}>{metric.value ?? '—'}</div>
          {metric.detail && (
            <div style={{ marginTop: '0.4rem', fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 500 }}>
              {metric.detail}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
