import type { NaverSearchItem } from '../../api/searchApi';

export function cleanText(text?: string) {
  return (text ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function normalizeResultLink(link?: string) {
  const normalizedLink = (link ?? '').trim().toLowerCase();

  if (!normalizedLink) {
    return '';
  }

  try {
    const url = new URL(normalizedLink);
    const host = url.hostname.replace(/^www\./, '');
    const path = url.pathname.replace(/\/$/, '');

    return `${host}${path}`;
  } catch {
    return normalizedLink.replace(/[?#].*$/, '').replace(/\/$/, '');
  }
}

function normalizeResultTitle(title?: string) {
  return cleanText(title)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ');
}

function createNaverResultKey(item: NaverSearchItem) {
  const linkKey = normalizeResultLink(item.originallink || item.link);

  if (linkKey) {
    return `link:${linkKey}`;
  }

  return `title:${normalizeResultTitle(item.title)}`;
}

function removeDuplicateNaverResults(items: NaverSearchItem[]) {
  const seenKeys = new Set<string>();

  return items.filter((item) => {
    const key = createNaverResultKey(item);

    if (!key || seenKeys.has(key)) {
      return false;
    }

    seenKeys.add(key);
    return true;
  });
}

function normalizeSearchText(text?: string) {
  return cleanText(text)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ');
}

function getKeywordTokens(keyword: string) {
  const normalizedKeyword = normalizeSearchText(keyword);

  if (!normalizedKeyword) {
    return [];
  }

  return normalizedKeyword.split(' ').filter(Boolean);
}

function getNaverResultRelevanceScore(item: NaverSearchItem, keyword: string) {
  const tokens = getKeywordTokens(keyword);

  if (tokens.length === 0) {
    return 0;
  }

  const title = normalizeSearchText(item.title);
  const description = normalizeSearchText(item.description);
  let score = 0;

  for (const token of tokens) {
    if (title === token) {
      score += 12;
    } else if (title.includes(token)) {
      score += 8;
    }

    if (description.includes(token)) {
      score += 3;
    }
  }

  if (tokens.every((token) => title.includes(token))) {
    score += 10;
  }

  return score;
}

export function refineNaverResults(items: NaverSearchItem[], keyword: string) {
  return removeDuplicateNaverResults(items)
    .map((item, index) => ({
      item,
      index,
      score: getNaverResultRelevanceScore(item, keyword),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ item }) => item);
}

export function createAiSummaryCacheKey(
  keyword: string,
  sources: Array<{ type: string; title: string; link: string }>
) {
  const sourceKey = sources
    .map((source) => `${source.type}:${source.link || source.title}`)
    .join('|');

  return `${keyword.trim().toLowerCase()}::${sourceKey}`;
}

