const CITY_EMOJIS = { mumbai: '🏙️', aurangabad: '🕌' }

export default function CityTabs({ city, onCityChange, lang, txt }) {
  return (
    <div style={{
      display: 'flex',
      padding: '12px 16px 0',
      gap: 8,
      background: 'var(--paper-card)',
      borderBottom: '1px solid var(--border)',
    }}>
      {['mumbai', 'aurangabad'].map(c => {
        const active = city === c
        return (
          <button
            key={c}
            onClick={() => onCityChange(c)}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderBottom: active ? '3px solid var(--saffron)' : '3px solid transparent',
              background: 'none',
              color: active ? 'var(--saffron)' : 'var(--ink-muted)',
              fontSize: 14,
              fontWeight: active ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: lang === 'mr' ? 'var(--font-marathi)' : 'var(--font-body)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: -1,
            }}
          >
            <span>{CITY_EMOJIS[c]}</span>
            <span>{txt.cities[c]}</span>
          </button>
        )
      })}
    </div>
  )
}
