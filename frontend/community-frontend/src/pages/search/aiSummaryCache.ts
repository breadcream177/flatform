import type { AiSearchSummaryResponse } from '../../api/aiSearchApi';

const AI_SUMMARY_CACHE_LIMIT = 20;
const aiSummaryCache = new Map<string, AiSearchSummaryResponse>();

export function getCachedAiSummary(cacheKey: string) {
  return aiSummaryCache.get(cacheKey);
}

export function setCachedAiSummary(cacheKey: string, result: AiSearchSummaryResponse) {
  if (aiSummaryCache.size >= AI_SUMMARY_CACHE_LIMIT) {
    const oldestKey = aiSummaryCache.keys().next().value;

    if (oldestKey) {
      aiSummaryCache.delete(oldestKey);
    }
  }

  aiSummaryCache.set(cacheKey, result);
}

