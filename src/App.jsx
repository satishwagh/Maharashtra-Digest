import { useState, useEffect, useCallback } from 'react'
import Header from './components/Header.jsx'
import CityTabs from './components/CityTabs.jsx'
import CategoryBar from './components/CategoryBar.jsx'
import NewsFeed from './components/NewsFeed.jsx'
import DatePicker from './components/DatePicker.jsx'
import EmptyState from './components/EmptyState.jsx'
import { t } from './utils/i18n.js'
import { MUMBAI_CATEGORIES, AURANGABAD_CATEGORIES } from './utils/categories.js'

function formatDate(d) {
  return d.toISOString().split('T')[0]
}

export default function App() {
  const [lang, setLang] = useState('en')
  const [city, setCity] = useState('mumbai')
  const [category, setCategory] = useState('all')
  const [date, setDate] = useState(formatDate(new Date()))
  const [newsData, setNewsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const txt = t[lang]

  const loadNews = useCallback(async (d) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/news/${d}.json`)
      if (!res.ok) throw new Error('not_found')
      const data = await res.json()
      setNewsData(data)
    } catch {
      setNewsData(null)
      setError('not_found')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadNews(date) }, [date, loadNews])

  // Reset category when city changes
  useEffect(() => {
    if (city === 'aurangabad') setCategory('all')
  }, [city])

  const categories = city === 'aurangabad' ? AURANGABAD_CATEGORIES : MUMBAI_CATEGORIES

  const articles = (() => {
    if (!newsData) return []
    const cityData = newsData.cities?.[city]
    if (!cityData) return []
    if (category === 'all') {
      return Object.values(cityData).flat()
    }
    return cityData[category] || []
  })()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <Header
        lang={lang}
        onToggleLang={() => setLang(l => l === 'en' ? 'mr' : 'en')}
        txt={txt}
        lastUpdated={newsData?.generatedAt}
      />

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 0 80px' }}>
        <DatePicker date={date} onDateChange={setDate} txt={txt} />

        <CityTabs city={city} onCityChange={setCity} lang={lang} txt={txt} />

        <CategoryBar
          categories={categories}
          active={category}
          onSelect={setCategory}
          lang={lang}
          txt={txt}
        />

        {loading ? (
          <LoadingSkeleton />
        ) : error || articles.length === 0 ? (
          <EmptyState txt={txt} date={date} />
        ) : (
          <NewsFeed
            articles={articles}
            lang={lang}
            txt={txt}
            city={city}
            category={category}
          />
        )}
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ padding: '16px' }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{
          background: 'var(--paper-card)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          marginBottom: '12px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div className="skeleton" style={{ height: 12, width: '30%', marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 18, width: '90%', marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 18, width: '70%', marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 36, width: 120 }} />
        </div>
      ))}
    </div>
  )
}
