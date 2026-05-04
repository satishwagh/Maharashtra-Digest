import { CATEGORY_META } from '../utils/categories.js'

export default function CategoryBar({ categories, active, onSelect, lang, txt }) {
  return (
    <div style={{
      display: 'flex',
      gap: 6,
      padding: '10px 16px',
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
      background: 'var(--paper-card)',
      borderBottom: '1px solid var(--border)',
      scrollbarWidth: 'none',
    }}>
      {categories.map(cat => {
        const meta = CATEGORY_META[cat]
        const isActive = active === cat
        return (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: isActive ? `1.5px solid ${meta.color}` : '1.5px solid transparent',
              background: isActive ? meta.color : 'var(--paper-warm)',
              color: isActive ? '#fff' : 'var(--ink-soft)',
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontFamily: lang === 'mr' ? 'var(--font-marathi)' : 'var(--font-body)',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 14 }}>{meta.emoji}</span>
            <span>{txt.categories[cat]}</span>
          </button>
        )
      })}
    </div>
  )
}
