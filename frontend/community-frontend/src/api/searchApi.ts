import { API_BASE_URL, requestApi, requestJson } from './apiClient';

const SEARCH_BASE_URL = `${API_BASE_URL}/api/search`;
const POST_BASE_URL = `${API_BASE_URL}/api/posts`;

export interface NaverSearchItem {
  title: string;
  link: string;
  description: string;
  bloggername?: string;
  postdate?: string;
  pubDate?: string;
  originallink?: string;
}

export interface NaverSearchResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverSearchItem[];
}

export interface NaverImageSearchItem {
  title: string;
  link: string;
  thumbnail: string;
  sizeheight?: string;
  sizewidth?: string;
}

export interface NaverImageSearchResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverImageSearchItem[];
}

export interface PostSearchItem {
  id: number;
  title: string;
  content: string;
  nickname?: string;
  username?: string;
  createdAt?: string;
  viewCount?: number;
  likeCount?: number;
}

type SearchType = 'web' | 'news' | 'blog';
type SearchSort = 'date' | 'sim';

function requestSearch(
  type: SearchType,
  keyword: string,
  page = 1,
  display = 10,
  sort: SearchSort = 'date'
): Promise<NaverSearchResponse> {
  return requestJson<NaverSearchResponse>(
    `${SEARCH_BASE_URL}/${type}?keyword=${encodeURIComponent(keyword)}&page=${page}&display=${display}&sort=${sort}`,
    { cache: 'no-store' },
    '검색 결과를 불러오지 못했습니다.'
  );
}

export function searchPosts(
  keyword: string,
  sort: SearchSort = 'date'
): Promise<PostSearchItem[]> {
  return requestApi<PostSearchItem[]>(
    `${POST_BASE_URL}/search?keyword=${encodeURIComponent(keyword)}&sort=${sort}`,
    undefined,
    '게시글 검색 결과를 불러오지 못했습니다.'
  );
}

export function searchWeb(
  keyword: string,
  page = 1,
  display = 10,
  sort: SearchSort = 'date'
) {
  return requestSearch('web', keyword, page, display, sort);
}

export function searchNews(
  keyword: string,
  page = 1,
  display = 10,
  sort: SearchSort = 'date'
) {
  return requestSearch('news', keyword, page, display, sort);
}

export function searchBlog(
  keyword: string,
  page = 1,
  display = 10,
  sort: SearchSort = 'date'
) {
  return requestSearch('blog', keyword, page, display, sort);
}

export function searchImage(
  keyword: string,
  page = 1,
  display = 10,
  sort: SearchSort = 'sim'
) {
  return requestJson<NaverImageSearchResponse>(
    `${SEARCH_BASE_URL}/image?keyword=${encodeURIComponent(keyword)}&page=${page}&display=${display}&sort=${sort}`,
    { cache: 'no-store' },
    '이미지 검색 결과를 불러오지 못했습니다.'
  );
}
