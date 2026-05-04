export default function Header({ lang, onToggleLang, txt, lastUpdated }) {
  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit',
        timeZone: 'Asia/Kolkata',
      }) + ' IST'
    : null

  return (
    <header style={{
      background: 'linear-gradient(160deg, #1C1917 0%, #292524 100%)',
      padding: '0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 20px rgba(0,0,0,0.25)',
    }}>
      {/* Saffron accent line */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, #FF6B00, #FF8C35, #FFB347)' }} />

      <div style={{
        maxWidth: 680,
        margin: '0 auto',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        {/* Logo */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>🗞️</span>
            <h1 style={{
              fontFamily: lang === 'mr' ? 'var(--font-marathi)' : 'var(--font-display)',
              fontSize: lang === 'mr' ? '18px' : '20px',
              fontWeight: 900,
              color: '#FAFAF8',
              letterSpacing: lang === 'mr' ? 0 : '-0.5px',
              lineHeight: 1.1,
            }}>
              {txt.appName}
            </h1>
          </div>
          <p style={{
            fontSize: 11,
            color: '#A8A29E',
            marginTop: 2,
            fontFamily: lang === 'mr' ? 'var(--font-marathi)' : 'var(--font-body)',
          }}>
            {formattedTime ? `${txt.lastUpdated} ${formattedTime}` : txt.tagline}
          </p>
        </div>

        {/* Lang toggle */}
        <button
          onClick={onToggleLang}
          style={{
            background: 'rgba(255,107,0,0.15)',
            border: '1px solid rgba(255,107,0,0.35)',
            borderRadius: 8,
            padding: '6px 14px',
            color: '#FF8C35',
            fontSize: 13,
            fontWeight: 600,
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
            fontFamily: lang === 'mr' ? 'var(--font-marathi)' : 'var(--font-body)',
          }}
        >
          {txt.lang}
        </button>
      </div>
    </header>
  )
}
