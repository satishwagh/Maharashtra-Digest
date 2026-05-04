import { useState } from 'react'
import { summarize } from '../utils/summarizer.js'
import { CATEGORY_META } from '../utils/categories.js'

export default function NewsCard({ article, lang, txt }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const meta = CATEGORY_META[article.category] || CATEGORY_META.city

  const handleEssence = () => {
    if (summary) { setOpen(o => !o); return }
    setLoading(true)
    // Slight delay to show loading state, then run summarizer
    setTimeout(() => {
      const result = summarize(article.body)
      setSummary(result)
      setOpen(true)
      setLoading(false)
    }, 400)
  }

  return (
    <div style={{
      background: 'var(--paper-card)',
      borderRadius: 'var(--radius-md)',
      marginBottom: 12,
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
      border: '1px solid var(--border)',
      transition: 'box-shadow 0.2s, transform 0.2s',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Category stripe */}
      <div style={{ height: 3, background: meta.color }} />

      <div style={{ padding: '16px 18px 14px' }}>
        {/* Meta row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 10,
          flexWrap: 'wrap',
        }}>
          <span style={{
            background: meta.bg,
            color: meta.color,
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 9px',
            borderRadius: 20,
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
          }}>
            {meta.emoji} {article.category}
          </span>
          <span style={{ color: 'var(--ink-muted)', fontSize: 12, fontWeight: 500 }}>
            {article.source}
          </span>
          <span style={{ color: 'var(--ink-faint)', fontSize: 11, marginLeft: 'auto' }}>
            {article.time}
          </span>
        </div>

        {/* Headline */}
        <h3 style={{
          fontFamily: lang === 'mr' ? 'var(--font-marathi)' : 'var(--font-display)',
          fontSize: lang === 'mr' ? '15px' : '16px',
          fontWeight: 700,
          lineHeight: 1.4,
          color: 'var(--ink)',
          marginBottom: 14,
        }}>
          {article.title}
        </h3>

        {/* Summary panel */}
        {open && summary && (
          <div style={{
            background: `${meta.bg}`,
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 14,
            borderLeft: `3px solid ${meta.color}`,
            animation: 'fadeUp 0.3s ease both',
          }}>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              color: meta.color,
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}>
              ⚡ {txt.tldr} — <span style={{ fontStyle: 'italic', textTransform: 'none', letterSpacing: 0 }}>
                {summary.tldr}
              </span>
            </div>
            <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
              {summary.bullets.map((b, i) => (
                <li key={i} style={{
                  fontSize: 13,
                  lineHeight: 1.65,
                  color: 'var(--ink-soft)',
                  marginBottom: i < summary.bullets.length - 1 ? 5 : 0,
                  fontFamily: lang === 'mr' ? 'var(--font-marathi)' : 'var(--font-body)',
                }}>{b}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={handleEssence}
            disabled={loading}
            style={{
              background: loading ? 'var(--paper-warm)' : open && summary ? 'var(--ink)' : meta.color,
              color: loading ? 'var(--ink-faint)' : '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s',
              fontFamily: lang === 'mr' ? 'var(--font-marathi)' : 'var(--font-body)',
            }}
          >
            {loading ? (
              <><span style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block' }}>◌</span>
              {txt.summarising}</>
            ) : open && summary ? (
              `▲ ${txt.hideEssence}`
            ) : (
              `⚡ ${txt.getEssence}`
            )}
          </button>

          {article.sourceUrl && (
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12,
                color: 'var(--ink-muted)',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '8px 0',
                fontFamily: lang === 'mr' ? 'var(--font-marathi)' : 'var(--font-body)',
              }}
            >
              {txt.readMore}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
