import type { AiSearchSourceItem } from '../../api/aiSearchApi';
import type { NaverSearchItem, PostSearchItem } from '../../api/searchApi';
import { cleanText } from './searchUtils';

interface BuildAiSearchSourcesParams {
  postResults: PostSearchItem[];
  newsResults: NaverSearchItem[];
  blogResults: NaverSearchItem[];
  webResults: NaverSearchItem[];
}

export function buildAiSearchSources({
  postResults,
  newsResults,
  blogResults,
  webResults,
}: BuildAiSearchSourcesParams): AiSearchSourceItem[] {
  return [
    ...postResults.slice(0, 2).map((item) => ({
      type: 'post',
      title: cleanText(item.title),
      description: cleanText(item.content),
      link: `/posts/${item.id}`,
    })),
    ...newsResults.slice(0, 2).map((item) => ({
      type: 'news',
      title: cleanText(item.title),
      description: cleanText(item.description),
      link: item.link,
    })),
    ...blogResults.slice(0, 2).map((item) => ({
      type: 'blog',
      title: cleanText(item.title),
      description: cleanText(item.description),
      link: item.link,
    })),
    ...webResults.slice(0, 2).map((item) => ({
      type: 'web',
      title: cleanText(item.title),
      description: cleanText(item.description),
      link: item.link,
    })),
  ].filter((item) => item.title || item.description);
}

