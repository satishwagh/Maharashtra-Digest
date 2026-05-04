import NewsCard from './NewsCard.jsx'

export default function NewsFeed({ articles, lang, txt, city, category }) {
  return (
    <div style={{ padding: '14px 16px' }}>
      <p style={{
        fontSize: 12,
        color: 'var(--ink-faint)',
        marginBottom: 14,
        fontFamily: lang === 'mr' ? 'var(--font-marathi)' : 'var(--font-body)',
      }}>
        {articles.length} {txt.stories} · {txt.tapHint}
      </p>
      {articles.map((article, i) => (
        <div
          key={article.id}
          className={`fade-up fade-up-${Math.min(i + 1, 4)}`}
        >
          <NewsCard article={article} lang={lang} txt={txt} />
        </div>
      ))}
    </div>
  )
}
