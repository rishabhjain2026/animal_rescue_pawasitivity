export default function FirstAidGuide({ guide }) {
  if (!guide) return null;

  const { title, urgent, severityNote, steps } = guide;

  return (
    <div style={{
      border: `1.5px solid ${urgent ? 'var(--coral)' : 'var(--green)'}`,
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        background: urgent ? 'var(--coral-light)' : 'var(--green-light)',
        padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 22 }}>{urgent ? '🚨' : '🩺'}</span>
        <div>
          <p style={{ fontWeight: 600, fontSize: 14, color: urgent ? 'var(--coral)' : 'var(--green-mid)' }}>
            {title}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{severityNote}</p>
        </div>
      </div>

      {/* Steps */}
      <div style={{ padding: '16px 18px', background: 'var(--surface)' }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom: 12 }}>
          What to do right now
        </p>
        <ol style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {steps.map((step, i) => (
            <li key={i} style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.55 }}>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}