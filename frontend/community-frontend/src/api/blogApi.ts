import { API_BASE_URL, requestJson, requestApiVoid } from './apiClient';

const BASE_URL = `${API_BASE_URL}/api/blog`;

export interface BlogPost {
  id: number;
  userId: number;
  title: string;
  content: string;
  category: string;
  thumbnailUrl: string | null;
  author: string;
  createdAt: string;
}

export interface BlogPostCreateRequest {
  title: string;
  content: string;
  category: string;
  thumbnailUrl: string;
  userId: number;
}

export interface BlogPostUpdateRequest {
  title: string;
  content: string;
  category: string;
  thumbnailUrl: string;
}

export function getBlogPosts(): Promise<BlogPost[]> {
  return requestJson<BlogPost[]>(
    BASE_URL,
    undefined,
    '블로그 목록 조회에 실패했습니다.'
  );
}

export function getBlogPost(id: number): Promise<BlogPost> {
  return requestJson<BlogPost>(
    `${BASE_URL}/${id}`,
    undefined,
    '블로그 상세 조회에 실패했습니다.'
  );
}

export function createBlogPost(
  request: BlogPostCreateRequest
): Promise<BlogPost> {
  return requestJson<BlogPost>(
    BASE_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    },
    '블로그 글 작성에 실패했습니다.'
  );
}

export function updateBlogPost(
  id: number,
  userId: number,
  request: BlogPostUpdateRequest
): Promise<BlogPost> {
  return requestJson<BlogPost>(
    `${BASE_URL}/${id}?userId=${userId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    },
    '블로그 글 수정에 실패했습니다.'
  );
}

export function deleteBlogPost(id: number, userId: number): Promise<void> {
  return requestApiVoid(
    `${BASE_URL}/${id}?userId=${userId}`,
    {
      method: 'DELETE',
    },
    '블로그 글 삭제에 실패했습니다.'
  );
}
