const STEPS = [
  { key: 'reported',           label: 'Reported',        icon: '📍' },
  { key: 'accepted',           label: 'Accepted',        icon: '🤝' },
  { key: 'completed',          label: 'Completed',       icon: '📄' },
];

const normalizeStatus = (status) => {
  if (status === 'reported') return 'reported';
  if (status === 'completed') return 'completed';
  return 'accepted';
};

export default function StatusBar({ status, timeline = [] }) {
  const normalizedCurrent = normalizeStatus(status);
  const currentIdx = STEPS.findIndex((s) => s.key === normalizedCurrent);
  const normalizedTimeline = timeline.map((entry) => ({
    ...entry,
    status: normalizeStatus(entry.status),
  }));

  return (
    <div style={{ padding: '20px 0' }}>
      {/* Step dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {STEPS.map((step, i) => {
          const done    = i < currentIdx;
          const active  = i === currentIdx;
          const pending = i > currentIdx;

          return (
            <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width:  active ? 38 : 30,
                  height: active ? 38 : 30,
                  borderRadius: '50%',
                  background: done   ? 'var(--green)'
                            : active ? 'var(--green)'
                            :          'var(--border-md)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: active ? 18 : 14,
                  boxShadow: active ? '0 0 0 5px var(--green-light)' : 'none',
                  transition: 'all 0.4s ease',
                  position: 'relative',
                }}>
                  {done
                    ? <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 7l4 4 6-6" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
                    : <span style={{ filter: pending ? 'grayscale(1) opacity(0.4)' : 'none' }}>{step.icon}</span>
                  }
                  {active && (
                    <div style={{
                      position: 'absolute', inset: -5,
                      borderRadius: '50%',
                      border: '2px solid var(--green)',
                      opacity: 0.4,
                      animation: 'pulseRing 1.5s ease-out infinite',
                    }} />
                  )}
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 500,
                  color: done || active ? 'var(--green)' : 'var(--text-hint)',
                  whiteSpace: 'nowrap',
                  maxWidth: 64,
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}>{step.label}</span>
              </div>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div style={{
                  flex: 1, height: 2, marginBottom: 22,
                  background: done ? 'var(--green)' : 'var(--border-md)',
                  transition: 'background 0.4s ease',
                  minWidth: 12,
                }} />
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes pulseRing {
          0%   { transform: scale(1);   opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>

      {/* Timeline log */}
      {timeline.length > 0 && (
        <div style={{ marginTop: 28, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom: 14 }}>
            Timeline
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...normalizedTimeline].reverse().map((entry, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                  background: i === 0 ? 'var(--green)' : 'var(--border-md)',
                }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', textTransform: 'capitalize' }}>
                    {entry.status?.replace(/-/g, ' ')}
                  </p>
                  {entry.note && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{entry.note}</p>
                  )}
                  <p style={{ fontSize: 11, color: 'var(--text-hint)' }}>
                    {new Date(entry.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}