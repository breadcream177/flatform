import { API_BASE_URL, requestApi } from './apiClient';

export interface PostItem {
  id: number;
  boardId: number;
  boardName: string;
  userId: number;
  username: string;
  nickname: string;
  title: string;
  content: string;
  visibility: string;
  viewCount: number;
  commentCount: number;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentItem {
  id: number;
  postId: number;
  userId: number;
  content: string;
  deleted: boolean;
  createdAt: string;
}

export interface PostDetailData {
  post: PostItem;
  comments: CommentItem[];
}

export interface CreateCommentRequest {
  postId: number;
  userId: number;
  content: string;
}

export interface CreatePostRequest {
  boardId: number;
  userId: number;
  title: string;
  content: string;
}

export interface UpdatePostRequest {
  userId: number;
  role: string;
  title: string;
  content: string;
}

export function fetchPosts(): Promise<PostItem[]> {
  return requestApi<PostItem[]>(
    `${API_BASE_URL}/api/posts`,
    undefined,
    '게시글 목록 조회에 실패했습니다.'
  );
}

export function searchPosts(keyword: string): Promise<PostItem[]> {
  return requestApi<PostItem[]>(
    `${API_BASE_URL}/api/posts/search?keyword=${encodeURIComponent(keyword)}`,
    undefined,
    '게시글 검색에 실패했습니다.'
  );
}

export function fetchPostDetail(postId: number): Promise<PostDetailData> {
  return requestApi<PostDetailData>(
    `${API_BASE_URL}/api/posts/${postId}/detail`,
    undefined,
    '게시글 상세 조회에 실패했습니다.'
  );
}

export function createComment(
  request: CreateCommentRequest
): Promise<CommentItem> {
  return requestApi<CommentItem>(
    `${API_BASE_URL}/api/comments`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    },
    '댓글 작성에 실패했습니다.'
  );
}

export function createPost(request: CreatePostRequest): Promise<PostItem> {
  return requestApi<PostItem>(
    `${API_BASE_URL}/api/posts`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    },
    '게시글 작성에 실패했습니다.'
  );
}

export function updatePost(
  postId: number,
  request: UpdatePostRequest
): Promise<PostItem> {
  return requestApi<PostItem>(
    `${API_BASE_URL}/api/posts/${postId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    },
    '게시글 수정에 실패했습니다.'
  );
}

export function deletePost(
  postId: number,
  userId: number,
  role: string
): Promise<string> {
  return requestApi<string>(
    `${API_BASE_URL}/api/posts/${postId}?userId=${encodeURIComponent(String(userId))}&role=${encodeURIComponent(role)}`,
    {
      method: 'DELETE',
    },
    '게시글 삭제에 실패했습니다.'
  );
}

export function deleteComment(
  commentId: number,
  userId: number,
  role: string
): Promise<string> {
  return requestApi<string>(
    `${API_BASE_URL}/api/comments/${commentId}?userId=${encodeURIComponent(String(userId))}&role=${encodeURIComponent(role)}`,
    {
      method: 'DELETE',
    },
    '댓글 삭제에 실패했습니다.'
  );
}

export function fetchPostsByUserId(userId: number): Promise<PostItem[]> {
  return requestApi<PostItem[]>(
    `${API_BASE_URL}/api/posts/user/${userId}`,
    undefined,
    '내 게시글 목록 조회에 실패했습니다.'
  );
}

export function fetchCommentsByUserId(
  userId: number
): Promise<CommentItem[]> {
  return requestApi<CommentItem[]>(
    `${API_BASE_URL}/api/comments/user/${userId}`,
    undefined,
    '내 댓글 목록 조회에 실패했습니다.'
  );
}
