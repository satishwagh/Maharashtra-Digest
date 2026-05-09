/**
 * fetch-news.mjs — Maharashtra Digest daily fetcher
 * Node 20 built-in fetch (no node-fetch needed).
 * Primary: Google News RSS (reliable from GitHub Actions, never blocked).
 * Fallback: Traditional publication RSS feeds.
 */

import { XMLParser } from 'fast-xml-parser'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const FEEDS = [
  // ── Mumbai Politics
  { url: 'https://news.google.com/rss/search?q=Mumbai+Maharashtra+politics+government+when:1d&hl=en-IN&gl=IN&ceid=IN:en', source: 'Google News', city: 'mumbai', hint: 'politics' },
  { url: 'https://news.google.com/rss/search?q=Fadnavis+Maharashtra+cabinet+minister+BJP+when:1d&hl=en-IN&gl=IN&ceid=IN:en', source: 'Google News', city: 'mumbai', hint: 'politics' },
  // ── Mumbai Finance
  { url: 'https://news.google.com/rss/search?q=Sensex+Nifty+BSE+Mumbai+stock+when:1d&hl=en-IN&gl=IN&ceid=IN:en', source: 'Google News', city: 'mumbai', hint: 'finance' },
  { url: 'https://news.google.com/rss/search?q=Mumbai+startup+RBI+economy+investment+crore+when:1d&hl=en-IN&gl=IN&ceid=IN:en', source: 'Google News', city: 'mumbai', hint: 'finance' },
  // ── Mumbai Technology
  { url: 'https://news.google.com/rss/search?q=Mumbai+Maharashtra+technology+AI+digital+when:1d&hl=en-IN&gl=IN&ceid=IN:en', source: 'Google News', city: 'mumbai', hint: 'technology' },
  { url: 'https://news.google.com/rss/search?q=IIT+Bombay+Navi+Mumbai+tech+innovation+when:1d&hl=en-IN&gl=IN&ceid=IN:en', source: 'Google News', city: 'mumbai', hint: 'technology' },
  // ── Mumbai Sports
  { url: 'https://news.google.com/rss/search?q=Mumbai+Indians+IPL+cricket+when:1d&hl=en-IN&gl=IN&ceid=IN:en', source: 'Google News', city: 'mumbai', hint: 'sports' },
  { url: 'https://news.google.com/rss/search?q=Wankhede+Mumbai+sports+football+kabaddi+when:1d&hl=en-IN&gl=IN&ceid=IN:en', source: 'Google News', city: 'mumbai', hint: 'sports' },
  // ── Mumbai City
  { url: 'https://news.google.com/rss/search?q=Mumbai+BMC+metro+infrastructure+when:1d&hl=en-IN&gl=IN&ceid=IN:en', source: 'Google News', city: 'mumbai', hint: 'city' },
  { url: 'https://news.google.com/rss/search?q=Mumbai+monsoon+weather+traffic+development+when:1d&hl=en-IN&gl=IN&ceid=IN:en', source: 'Google News', city: 'mumbai', hint: 'city' },
  // ── Traditional RSS (bonus)
  { url: 'https://timesofindia.indiatimes.com/rssfeeds/7098551.cms', source: 'Times of India', city: 'mumbai', hint: 'general' },
  { url: 'https://economictimes.indiatimes.com/rssfeeds/1977021501.cms', source: 'Economic Times', city: 'mumbai', hint: 'finance' },
  { url: 'https://timesofindia.indiatimes.com/rssfeeds/4719148.cms', source: 'TOI Sports', city: 'mumbai', hint: 'sports' },
  { url: 'https://indianexpress.com/section/cities/mumbai/feed/', source: 'Indian Express', city: 'mumbai', hint: 'city' },
  // ── Chhatrapati Sambhajinagar
  { url: 'https://news.google.com/rss/search?q=%22Chhatrapati+Sambhajinagar%22+OR+%22Aurangabad%22+Maharashtra+when:1d&hl=en-IN&gl=IN&ceid=IN:en', source: 'Google News', city: 'aurangabad', hint: 'city' },
  { url: 'https://news.google.com/rss/search?q=Sambhajinagar+Marathwada+news+when:1d&hl=en-IN&gl=IN&ceid=IN:en', source: 'Google News', city: 'aurangabad', hint: 'city' },
  { url: 'https://maharashtratimes.com/rss/maharashtra/aurangabad.cms', source: 'Maharashtra Times', city: 'aurangabad', hint: 'city' },
]

const CATEGORY_KEYWORDS = {
  politics:   ['modi','bjp','congress','election','minister','parliament','mla','cm ','chief minister','fadnavis','shinde','pawar','political','government','party','vote','bmc','municipal','policy','opposition','cabinet','ordinance','governor','assembly'],
  finance:    ['sensex','nifty','market','stock','rbi','economy','gdp','inflation','rupee','budget','tax','gst','fund','investment','crore','bank','sebi','ipo','revenue','profit','finance','fiscal','trading','shares','bse','nse'],
  technology: ['ai ','artificial intelligence','tech','software','digital','electric','ev ','data centre','satellite','isro','iit','innovation','cybersecurity','startup','5g','6g','blockchain','robot','app launch'],
  sports:     ['cricket','ipl','india vs','test match','wicket','football','kabaddi','badminton','marathon','athlete','champion','match','tournament','stadium','player','squad','score','trophy','league'],
}

function classify(title, desc, hint) {
  title = String(title || "")
  desc = String(desc || "")
  const text = (title + ' ' + desc).toLowerCase()
  for (const [cat, kw] of Object.entries(CATEGORY_KEYWORDS)) {
    if (kw.some(k => text.includes(k))) return cat
  }
  return hint === 'general' ? 'city' : hint
}

const STOP = new Set(['the','and','for','are','but','not','you','all','can','had','her','was','one','our','out','day','get','has','him','his','how','its','may','new','now','old','see','two','way','who','did','let','put','say','she','too','use','that','this','with','have','from','they','will','been','said','each','which','their','there','were','about','after','could','other','these','those','would','into','than','then','some','more','also','when','what','your','very','just'])

function splitSentences(text) {
  return text.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+(?=[A-Z"'])/).filter(s => s.trim().length > 20)
}

function summarize(text, n = 3) {
  if (!text || text.length < 60) return { bullets: [text || 'No content.'], tldr: (text || '').slice(0, 60) }
  const sentences = splitSentences(text)
  if (sentences.length <= n) return { bullets: sentences, tldr: sentences[0]?.slice(0, 80) || '' }
  const docTokens = sentences.map(s => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w)))
  const df = {}
  docTokens.forEach(tokens => new Set(tokens).forEach(t => { df[t] = (df[t] || 0) + 1 }))
  const scored = sentences.map((sent, i) => {
    const tokens = docTokens[i]
    if (!tokens.length) return { sent, score: 0, i }
    const tf = {}
    tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1 })
    let score = Object.entries(tf).reduce((s, [term, freq]) => s + (freq / tokens.length) * Math.log((sentences.length + 1) / ((df[term] || 0) + 1)), 0)
    if (i === 0) score *= 1.3
    if (i === sentences.length - 1) score *= 1.1
    const wc = sent.split(/\s+/).length
    if (wc < 8 || wc > 45) score *= 0.7
    return { sent, score, i }
  })
  const top = [...scored].sort((a, b) => b.score - a.score).slice(0, n).sort((a, b) => a.i - b.i)
  const bullets = top.map(x => { const w = x.sent.split(/\s+/); return w.length > 28 ? w.slice(0, 28).join(' ') + '…' : x.sent })
  const tldrWords = bullets[0].split(/\s+/)
  return { bullets, tldr: tldrWords.slice(0, 12).join(' ') + (tldrWords.length > 12 ? '…' : '') }
}

function stripHtml(str) {
  // Force to string — RSS fields sometimes come as objects/numbers/booleans
  if (str === null || str === undefined) return ""
  str = String(str)
  return (str || '').replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, '').replace(/&quot;/g, '"').trim()
}

function timeAgo(dateStr) {
  try {
    const h = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000)
    if (h < 1) return 'Just now'
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  } catch { return 'Today' }
}

function extractLink(item) {
  if (!item) return ''
  if (typeof item.link === 'string' && item.link.startsWith('http')) return item.link
  if (item.link?.['#text']) return item.link['#text']
  if (typeof item.guid === 'string' && item.guid.startsWith('http')) return item.guid
  if (item.guid?.['#text']) return item.guid['#text']
  return ''
}

async function fetchFeed(feed) {
  try {
    console.log(`  → ${feed.source}: ${feed.url.slice(0, 90)}`)
    const res = await fetch(feed.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MaharashtraDigestBot/1.0; +https://github.com)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'en-IN,en;q=0.9',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) { console.warn(`  ✗ HTTP ${res.status}`); return [] }

    const xml = await res.text()
    if (!xml || xml.trim().length < 100) { console.warn(`  ✗ Empty/tiny response`); return [] }

    const parser = new XMLParser({ ignoreAttributes: false, parseAttributeValue: true, cdataPropName: '__cdata', allowBooleanAttributes: true })
    const parsed = parser.parse(xml)

    let items = parsed?.rss?.channel?.item || parsed?.feed?.entry || []
    if (!Array.isArray(items)) items = items ? [items] : []
    if (!items.length) { console.warn(`  ✗ No items parsed`); return [] }

    console.log(`  ✓ ${items.length} items`)
    return items.slice(0, 12).map((item, idx) => {
      const title = stripHtml(item.title?.__cdata || item.title || '')
      const desc = stripHtml(item.description?.__cdata || item.description || item.summary?.__cdata || item.summary || item['content:encoded']?.__cdata || '')
      const link = extractLink(item)
      const pubDate = item.pubDate || item.published || item.updated || ''
      const body = desc.length > 40 ? desc : `${title}. ${desc}`
      if (title.length < 10) return null
      const { bullets, tldr } = summarize(body)
      return {
        id: `${feed.city}-${feed.hint}-${idx}-${Date.now()}`,
        title, source: feed.source, sourceUrl: link,
        time: timeAgo(pubDate), body,
        category: classify(title, desc, feed.hint),
        city: feed.city,   // ← this was missing
        category: classify(title, desc, feed.hint),
        summary: { bullets, tldr },
      }
    }).filter(Boolean)
  } catch (err) {
    console.warn(`  ✗ Error: ${err.message}`)
    return []
  }
}

async function main() {
  const istDate = new Date(Date.now() + 5.5 * 3600000)
  const today = istDate.toISOString().split('T')[0]
  console.log(`\n📰 Maharashtra Digest — ${today} IST\n`)

  const results = []
  for (let i = 0; i < FEEDS.length; i += 4) {
    const batch = FEEDS.slice(i, i + 4)
    const br = await Promise.all(batch.map(fetchFeed))
    results.push(...br.flat())
    if (i + 4 < FEEDS.length) await new Promise(r => setTimeout(r, 1000))
  }
  console.log(`\n✅ Total: ${results.length} articles`)

  const seen = new Set()
  const unique = results.filter(a => {
    const key = a.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  console.log(`🔍 After dedup: ${unique.length}`)

  const MUMBAI_CATS = ['politics', 'finance', 'technology', 'sports', 'city']
  const output = {
    date: today,
    generatedAt: new Date().toISOString(),
    cities: {
      mumbai: Object.fromEntries(MUMBAI_CATS.map(c => [c, []])),
      aurangabad: { city: [] },
    },
  }

  for (const article of unique) {
    if (article.city === 'mumbai') {
      const cat = MUMBAI_CATS.includes(article.category) ? article.category : 'city'
      if (output.cities.mumbai[cat].length < 8) output.cities.mumbai[cat].push(article)
    } else if (article.city === 'aurangabad') {
      if (output.cities.aurangabad.city.length < 8) output.cities.aurangabad.city.push(article)
    }
  }

  console.log('\n📊 Final counts:')
  Object.entries(output.cities).forEach(([city, cats]) =>
    Object.entries(cats).forEach(([cat, arts]) => console.log(`   ${city} › ${cat}: ${arts.length}`))
  )

  mkdirSync(join(ROOT, 'public', 'news'), { recursive: true })
  const outPath = join(ROOT, 'public', 'news', `${today}.json`)
  writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8')
  console.log(`\n💾 Saved → ${outPath}`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
