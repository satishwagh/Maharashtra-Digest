/**
 * fetch-news.mjs
 * Runs daily via GitHub Actions at 7am IST.
 * - Fetches RSS feeds from Indian news sources
 * - Classifies articles by city + category
 * - Runs extractive summarization (no API key needed)
 * - Writes public/news/YYYY-MM-DD.json
 */

import fetch from 'node-fetch'
import { XMLParser } from 'fast-xml-parser'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ─── RSS Feed Sources ────────────────────────────────────────────────────────
const FEEDS = [
  // Mumbai / Maharashtra
  { url: 'https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms',        source: 'Times of India',    city: 'mumbai', hint: 'general' },
  { url: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml',     source: 'Hindustan Times',   city: 'mumbai', hint: 'general' },
  { url: 'https://indianexpress.com/section/cities/mumbai/feed/',               source: 'Indian Express',    city: 'mumbai', hint: 'city' },
  { url: 'https://www.mid-day.com/rss/allnews',                                 source: 'Mid-Day',           city: 'mumbai', hint: 'city' },
  { url: 'https://www.business-standard.com/rss/markets-106.rss',              source: 'Business Standard', city: 'mumbai', hint: 'finance' },
  { url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',source: 'Economic Times',   city: 'mumbai', hint: 'finance' },
  { url: 'https://www.livemint.com/rss/technology',                             source: 'Mint',              city: 'mumbai', hint: 'technology' },
  { url: 'https://timesofindia.indiatimes.com/rssfeeds/4719148.cms',           source: 'TOI Sports',        city: 'mumbai', hint: 'sports' },
  // Aurangabad
  { url: 'https://www.lokmat.com/rss/aurangabad/',                              source: 'Lokmat',            city: 'aurangabad', hint: 'city' },
  { url: 'https://www.sakal.com/rss/aurangabad',                               source: 'Sakal',             city: 'aurangabad', hint: 'city' },
  { url: 'https://maharashtratimes.com/rss/maharashtra/aurangabad.cms',        source: 'Maharashtra Times', city: 'aurangabad', hint: 'city' },
]

// ─── Keyword classifiers ─────────────────────────────────────────────────────
const CATEGORY_KEYWORDS = {
  politics:   ['modi', 'bjp', 'congress', 'election', 'minister', 'parliament', 'mla', 'cm ', 'chief minister', 'fadnavis', 'shinde', 'pawar', 'political', 'government', 'party', 'vote', 'bmc', 'municipal', 'policy', 'opposition', 'cabinet', 'ordinance', 'governor'],
  finance:    ['sensex', 'nifty', 'market', 'stock', 'rbi', 'economy', 'gdp', 'inflation', 'rupee', 'budget', 'tax', 'gst', 'startup', 'fund', 'investment', 'crore', 'bank', 'sebi', 'ipo', 'revenue', 'profit', 'revenue', 'finance', 'fiscal'],
  technology: ['ai ', 'artificial intelligence', 'tech', 'startup', 'app', '5g', '6g', 'software', 'digital', 'electric', 'ev ', 'data centre', 'satellite', 'isro', 'iit', 'innovation', 'cybersecurity', 'blockchain', 'robot'],
  sports:     ['cricket', 'ipl', 'india vs', 'test match', 'wicket', 'football', 'kabaddi', 'badminton', 'marathon', 'athlete', 'champion', 'match', 'tournament', 'stadium', 'player', 'squad', 'score'],
}

function classify(title, description, hint) {
  const text = (title + ' ' + description).toLowerCase()
  // Trust explicit hint for non-general feeds
  if (hint !== 'general') {
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(k => text.includes(k))) return cat
    }
    return hint
  }
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(k => text.includes(k))) return cat
  }
  return 'city'
}

// ─── Extractive Summarizer ───────────────────────────────────────────────────
function splitSentences(text) {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z"'])/)
    .filter(s => s.trim().length > 20)
}

function summarize(text, n = 3) {
  if (!text || text.length < 60) return { bullets: [text], tldr: text }
  const STOP = new Set(['the','and','for','are','but','not','you','all','can','had','her','was','one','our','out','day','get','has','him','his','how','its','may','new','now','old','see','two','way','who','boy','did','let','put','say','she','too','use','that','this','with','have','from','they','will','been','said','each','which','their','there','were','about','after','could','other','these','those','would','into','than','then','some','more','also','when','what','your','very','just'])

  const sentences = splitSentences(text)
  if (sentences.length <= n) return { bullets: sentences, tldr: sentences[0]?.slice(0, 80) }

  const df = {}
  const docTokens = sentences.map(s =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w))
  )
  docTokens.forEach(tokens => { new Set(tokens).forEach(t => { df[t] = (df[t] || 0) + 1 }) })

  const scored = sentences.map((sent, i) => {
    const tokens = docTokens[i]
    if (!tokens.length) return { sent, score: 0, i }
    const tf = {}
    tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1 })
    let score = Object.entries(tf).reduce((s, [term, freq]) => {
      return s + (freq / tokens.length) * Math.log((sentences.length + 1) / ((df[term] || 0) + 1))
    }, 0)
    if (i === 0) score *= 1.3
    if (i === sentences.length - 1) score *= 1.1
    const wc = sent.split(/\s+/).length
    if (wc < 8 || wc > 45) score *= 0.7
    return { sent, score, i }
  })

  const top = [...scored].sort((a, b) => b.score - a.score).slice(0, n).sort((a, b) => a.i - b.i)
  const bullets = top.map(x => {
    const words = x.sent.split(/\s+/)
    return (words.length > 28 ? words.slice(0, 28).join(' ') + '…' : x.sent)
  })
  const tldrWords = bullets[0].split(/\s+/)
  return {
    bullets,
    tldr: tldrWords.slice(0, 12).join(' ') + (tldrWords.length > 12 ? '…' : ''),
  }
}

// ─── Clean HTML from RSS descriptions ───────────────────────────────────────
function stripHtml(str) {
  return (str || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, '').trim()
}

function timeAgo(dateStr) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime()
    const h = Math.floor(diff / 3600000)
    if (h < 1) return 'Just now'
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  } catch { return '' }
}

// ─── Fetch one RSS feed ───────────────────────────────────────────────────────
async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'Maharashtra-Digest-Bot/1.0' },
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const xml = await res.text()
    const parser = new XMLParser({ ignoreAttributes: false, parseAttributeValue: true })
    const parsed = parser.parse(xml)
    const items = parsed?.rss?.channel?.item || parsed?.feed?.entry || []
    const arr = Array.isArray(items) ? items : [items]
    return arr.slice(0, 10).map((item, idx) => {
      const title = stripHtml(item.title || item['title'] || '')
      const desc = stripHtml(item.description || item.summary || item.content || '')
      const link = item.link?.['#text'] || item.link || item.guid?.['#text'] || item.guid || ''
      const pubDate = item.pubDate || item.published || item.updated || ''
      const body = desc.length > title.length ? desc : title + '. ' + desc
      const { bullets, tldr } = summarize(body)
      return {
        id: `${feed.city}-${feed.hint}-${idx}-${Date.now()}`,
        title,
        source: feed.source,
        sourceUrl: typeof link === 'string' ? link : '',
        time: timeAgo(pubDate),
        body,
        category: classify(title, desc, feed.hint),
        summary: { bullets, tldr },
      }
    }).filter(a => a.title.length > 10)
  } catch (err) {
    console.warn(`⚠️  Feed failed: ${feed.url} — ${err.message}`)
    return []
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const today = new Date().toISOString().split('T')[0]
  console.log(`📰 Fetching news for ${today}…`)

  const allArticles = (await Promise.all(FEEDS.map(fetchFeed))).flat()
  console.log(`✅ Fetched ${allArticles.length} total articles`)

  // Group by city → category, keep top 8 per bucket
  const output = {
    date: today,
    generatedAt: new Date().toISOString(),
    cities: { mumbai: {}, aurangabad: { city: [] } },
  }

  const MUMBAI_CATS = ['politics', 'finance', 'technology', 'sports', 'city']
  MUMBAI_CATS.forEach(cat => { output.cities.mumbai[cat] = [] })

  const seen = new Set()
  for (const article of allArticles) {
    const key = article.title.slice(0, 50)
    if (seen.has(key)) continue
    seen.add(key)

    const { city, category } = article
    if (city === 'mumbai') {
      const cat = MUMBAI_CATS.includes(category) ? category : 'city'
      if (output.cities.mumbai[cat].length < 8) {
        output.cities.mumbai[cat].push(article)
      }
    } else if (city === 'aurangabad') {
      if (output.cities.aurangabad.city.length < 8) {
        output.cities.aurangabad.city.push(article)
      }
    }
  }

  const outPath = join(ROOT, 'public', 'news', `${today}.json`)
  mkdirSync(join(ROOT, 'public', 'news'), { recursive: true })
  writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8')
  console.log(`💾 Saved → ${outPath}`)

  // Stats
  Object.entries(output.cities).forEach(([city, cats]) => {
    const total = Object.values(cats).flat().length
    console.log(`   ${city}: ${total} articles`)
  })
}

main().catch(err => { console.error(err); process.exit(1) })
