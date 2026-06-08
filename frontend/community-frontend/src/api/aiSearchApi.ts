import { API_BASE_URL, requestApi } from './apiClient';

const AI_BASE_URL = `${API_BASE_URL}/api/ai`;

export interface AiSearchSourceItem {
  type: string;
  title: string;
  description: string;
  link: string;
}

export interface AiSearchSummaryRequest {
  keyword: string;
  sources: AiSearchSourceItem[];
}

export interface AiReferenceSource {
  type: string;
  title: string;
  link: string;
}

export interface AiRecommendedLink {
  type: string;
  title: string;
  link: string;
}

export interface AiEvidenceSource {
  type: string;
  title: string;
  link: string;
  reason: string;
}

export interface AiSearchSummaryResponse {
  summary: string;
  intent: string;
  followUpQuestions: string[];
  referenceSources: AiReferenceSource[];
  recommendedLinks: AiRecommendedLink[];
  evidenceSources: AiEvidenceSource[];
}

function isAiSearchSummaryResponse(
  data: unknown
): data is AiSearchSummaryResponse {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const candidate = data as AiSearchSummaryResponse;

  return (
    typeof candidate.summary === 'string' &&
    typeof candidate.intent === 'string' &&
    Array.isArray(candidate.followUpQuestions) &&
    Array.isArray(candidate.referenceSources) &&
    Array.isArray(candidate.recommendedLinks) &&
    Array.isArray(candidate.evidenceSources)
  );
}

export async function requestAiSearchSummary(
  request: AiSearchSummaryRequest
): Promise<AiSearchSummaryResponse> {
  const data = await requestApi<unknown>(
    `${AI_BASE_URL}/search-summary`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    },
    'AI 요약 요청에 실패했습니다.'
  );

  if (!isAiSearchSummaryResponse(data)) {
    throw new Error('AI 요약 응답 데이터 구조가 올바르지 않습니다.');
  }

  return data;
}
