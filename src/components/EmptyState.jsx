export default function EmptyState({ txt, date }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '60px 24px',
      color: 'var(--ink-faint)',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📰</div>
      <p style={{
        fontSize: 15,
        color: 'var(--ink-muted)',
        fontFamily: 'var(--font-body)',
        lineHeight: 1.6,
      }}>
        {txt.noNews}
      </p>
      <p style={{ fontSize: 12, marginTop: 8, color: 'var(--ink-faint)' }}>
        {date}
      </p>
    </div>
  )
}
