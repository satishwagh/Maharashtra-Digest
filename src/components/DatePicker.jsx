export default function DatePicker({ date, onDateChange, txt }) {
  const today = new Date().toISOString().split('T')[0]
  const isToday = date === today

  // Navigate prev/next day
  const shift = (days) => {
    const d = new Date(date + 'T00:00:00')
    d.setDate(d.getDate() + days)
    const next = d.toISOString().split('T')[0]
    if (next <= today) onDateChange(next)
  }

  const displayDate = (() => {
    const d = new Date(date + 'T00:00:00')
    return d.toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
    })
  })()

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      background: 'var(--paper-warm)',
      borderBottom: '1px solid var(--border)',
    }}>
      <button onClick={() => shift(-1)} style={navBtn}>‹</button>

      <div style={{ textAlign: 'center', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {isToday && (
            <span style={{
              background: 'var(--saffron)',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 20,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}>{txt.today}</span>
          )}
          <label style={{ position: 'relative', cursor: 'pointer' }}>
            <span style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--ink)',
              fontFamily: 'var(--font-body)',
            }}>
              {displayDate} 📅
            </span>
            <input
              type="date"
              value={date}
              max={today}
              onChange={e => onDateChange(e.target.value)}
              style={{
                position: 'absolute', opacity: 0,
                width: '100%', height: '100%',
                top: 0, left: 0, cursor: 'pointer',
              }}
            />
          </label>
        </div>
      </div>

      <button
        onClick={() => shift(1)}
        disabled={date >= today}
        style={{ ...navBtn, opacity: date >= today ? 0.3 : 1 }}
      >›</button>
    </div>
  )
}

const navBtn = {
  background: 'none',
  border: '1px solid var(--border)',
  borderRadius: 8,
  width: 34,
  height: 34,
  fontSize: 20,
  color: 'var(--ink-soft)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
  lineHeight: 1,
  padding: 0,
}
