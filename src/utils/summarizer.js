/**
 * Extractive summarizer — no API key needed.
 * Uses TF-IDF scoring + sentence position weighting
 * to pull the 3 most important sentences from an article.
 */

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
}

const STOP_WORDS = new Set([
  'the','and','for','are','but','not','you','all','can','had','her','was','one',
  'our','out','day','get','has','him','his','how','its','may','new','now','old',
  'see','two','way','who','boy','did','its','let','put','say','she','too','use',
  'that','this','with','have','from','they','will','been','said','each','which',
  'their','there','were','about','after','could','other','these','those','would',
  'into','than','then','some','more','also','when','what','your','very','just',
]);

function tfIdf(sentences) {
  const docTokens = sentences.map(s => tokenize(s));
  const df = {};
  docTokens.forEach(tokens => {
    const unique = new Set(tokens);
    unique.forEach(t => { df[t] = (df[t] || 0) + 1; });
  });
  const N = sentences.length;

  return sentences.map((sentence, i) => {
    const tokens = docTokens[i].filter(t => !STOP_WORDS.has(t));
    if (!tokens.length) return { sentence, score: 0 };

    const tf = {};
    tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });

    let score = 0;
    Object.entries(tf).forEach(([term, freq]) => {
      const idf = Math.log((N + 1) / ((df[term] || 0) + 1));
      score += (freq / tokens.length) * idf;
    });

    // Boost first and last sentences slightly (usually have key info)
    if (i === 0) score *= 1.3;
    if (i === sentences.length - 1) score *= 1.1;

    // Prefer medium-length sentences (not too short, not too long)
    const words = sentence.split(/\s+/).length;
    if (words < 8 || words > 45) score *= 0.7;

    return { sentence: sentence.trim(), score, index: i };
  });
}

function splitIntoSentences(text) {
  // Split on period/! /? followed by space+capital
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z"'])/)
    .filter(s => s.trim().length > 20);
}

export function summarize(text, numPoints = 3) {
  if (!text || text.length < 100) {
    return {
      bullets: [text || 'No content available.'],
      tldr: text?.slice(0, 60) || 'No content.',
    };
  }

  const sentences = splitIntoSentences(text);
  if (sentences.length <= numPoints) {
    return {
      bullets: sentences,
      tldr: sentences[0]?.slice(0, 80) || text.slice(0, 80),
    };
  }

  const scored = tfIdf(sentences);
  const top = [...scored]
    .sort((a, b) => b.score - a.score)
    .slice(0, numPoints)
    .sort((a, b) => a.index - b.index) // restore original order
    .map(item => {
      let s = item.sentence;
      // Trim to ~25 words max for bullet display
      const words = s.split(/\s+/);
      if (words.length > 28) s = words.slice(0, 28).join(' ') + '…';
      return s;
    });

  // TL;DR = first top sentence truncated to ~12 words
  const tldrWords = top[0].split(/\s+/);
  const tldr = tldrWords.slice(0, 12).join(' ') + (tldrWords.length > 12 ? '…' : '');

  return { bullets: top, tldr };
}
