import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import './PostDetailPage.css';
import {
  createComment,
  deleteComment,
  deletePost,
  fetchPostDetail,
  type PostDetailData,
} from '../../api/postApi';
import type { LoginUser } from '../../types/auth';
import { getStoredLoginUser } from '../../utils/auth';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
}

function PostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();

  const [loginUser, setLoginUser] = useState<LoginUser | null>(null);
  const [detail, setDetail] = useState<PostDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [commentContent, setCommentContent] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState('');

  const [deleting, setDeleting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(
    null
  );

  const loadDetail = useCallback(async () => {
    const numericPostId = Number(postId);

    if (!postId || Number.isNaN(numericPostId)) {
      setError('게시글 번호가 올바르지 않습니다.');
      setLoading(false);
      return;
    }

    try {
      setError('');

      const data = await fetchPostDetail(numericPostId);
      setDetail(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '게시글 상세 정보를 불러오는 중 오류가 발생했습니다.'
      );
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    setLoginUser(getStoredLoginUser());
  }, []);

  useEffect(() => {
    setLoading(true);
    void loadDetail();
  }, [loadDetail]);

  const handleCommentSubmit = async () => {
    const numericPostId = Number(postId);

    if (commentSubmitting) return;

    if (!loginUser) {
      setCommentError('로그인 후 댓글을 작성할 수 있습니다.');
      navigate('/login');
      return;
    }

    if (!postId || Number.isNaN(numericPostId) || !detail) {
      setCommentError('게시글 정보를 확인할 수 없습니다.');
      return;
    }

    const trimmedContent = commentContent.trim();

    if (!trimmedContent) {
      setCommentError('댓글 내용을 입력해주세요.');
      return;
    }

    try {
      setCommentSubmitting(true);
      setCommentError('');

      await createComment({
        postId: numericPostId,
        userId: loginUser.userId,
        content: trimmedContent,
      });

      setCommentContent('');
      await loadDetail();
    } catch (err) {
      setCommentError(
        err instanceof Error
          ? err.message
          : '댓글 작성 중 오류가 발생했습니다.'
      );
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const numericPostId = Number(postId);

    if (deleting) return;

    if (!loginUser) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    if (!detail) {
      alert('게시글 정보를 확인할 수 없습니다.');
      return;
    }

    const isAdmin = loginUser.role === 'ADMIN';
    const isOwner = loginUser.userId === detail.post.userId;

    if (!isOwner && !isAdmin) {
      alert('본인 글 또는 관리자만 삭제할 수 있습니다.');
      return;
    }

    const confirmed = window.confirm('이 게시글을 삭제하시겠습니까?');
    if (!confirmed) return;

    try {
      setDeleting(true);
      await deletePost(numericPostId, loginUser.userId, loginUser.role);
      navigate('/posts');
    } catch (err) {
      alert(err instanceof Error ? err.message : '게시글 삭제 중 오류 발생');
    } finally {
      setDeleting(false);
    }
  };

  const handleCommentDelete = async (
    commentId: number,
    commentUserId: number
  ) => {
    if (deletingCommentId !== null) return;

    if (!loginUser) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    const isAdmin = loginUser.role === 'ADMIN';
    const isOwner = loginUser.userId === commentUserId;

    if (!isOwner && !isAdmin) {
      alert('본인 댓글 또는 관리자만 삭제할 수 있습니다.');
      return;
    }

    const confirmed = window.confirm('이 댓글을 삭제하시겠습니까?');
    if (!confirmed) return;

    try {
      setDeletingCommentId(commentId);
      await deleteComment(commentId, loginUser.userId, loginUser.role);
      await loadDetail();
    } catch (err) {
      alert(err instanceof Error ? err.message : '댓글 삭제 중 오류 발생');
    } finally {
      setDeletingCommentId(null);
    }
  };

  if (loading) {
    return (
      <div className="detail-page">
        <div className="detail-box">불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-page">
        <div className="detail-box error">{error}</div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="detail-page">
        <div className="detail-box">게시글이 없습니다.</div>
      </div>
    );
  }

  const { post, comments } = detail;
  const isAdmin = loginUser?.role === 'ADMIN';
  const isPostOwner = loginUser?.userId === post.userId;
  const canManagePost = !!loginUser && (isPostOwner || isAdmin);

  return (
    <div className="detail-page">
      <div className="detail-container">
        <Link to="/posts" className="back-link">
          목록으로 돌아가기
        </Link>

        <article className="detail-post">
          <div className="detail-top">
            <span className="detail-board">{post.boardName}</span>
            <span className="detail-id">글번호 #{post.id}</span>
          </div>

          <div className="detail-title-row">
            <h1 className="detail-title">{post.title}</h1>
            {canManagePost && (
              <div className="detail-action-buttons">
                <button
                  type="button"
                  className="detail-edit-button"
                  onClick={() => navigate(`/posts/${post.id}/edit`)}
                >
                  수정
                </button>
                <button
                  type="button"
                  className="detail-delete-button"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? '삭제중' : '삭제'}
                </button>
              </div>
            )}
          </div>

          <div className="detail-meta">
            <span>{post.nickname}</span>
            <span>조회 {post.viewCount}</span>
            <span>{formatDate(post.createdAt)}</span>
          </div>

          <div className="detail-content">{post.content}</div>
        </article>

        <section className="comment-section">
          <h2>
            댓글 <span className="comment-count-badge">{comments.length}</span>
          </h2>

          <div className="comment-form">
            <textarea
              className="comment-textarea"
              placeholder={
                loginUser
                  ? '댓글을 입력하세요.'
                  : '로그인 후 댓글을 작성할 수 있습니다.'
              }
              value={commentContent}
              onChange={(event) => setCommentContent(event.target.value)}
              disabled={!loginUser}
            />
            {commentError && (
              <span className="comment-form-error">{commentError}</span>
            )}
            <button
              type="button"
              className="comment-submit-button"
              onClick={handleCommentSubmit}
              disabled={commentSubmitting || !loginUser}
            >
              {commentSubmitting ? '작성중...' : '작성'}
            </button>
          </div>

          {comments.length === 0 ? (
            <p className="comment-empty">
              아직 댓글이 없습니다. 첫 댓글을 남겨보세요.
            </p>
          ) : (
            <div className="comment-list">
              {comments.map((comment) => {
                const canDeleteComment =
                  !!loginUser &&
                  (loginUser.userId === comment.userId ||
                    loginUser.role === 'ADMIN');

                return (
                  <div key={comment.id} className="comment-card">
                    <div className="comment-card-top">
                      <div className="comment-content">{comment.content}</div>
                      {canDeleteComment && (
                        <button
                          type="button"
                          className="comment-delete-button"
                          onClick={() =>
                            handleCommentDelete(comment.id, comment.userId)
                          }
                          disabled={deletingCommentId === comment.id}
                        >
                          {deletingCommentId === comment.id ? '삭제중' : '삭제'}
                        </button>
                      )}
                    </div>
                    <div className="comment-meta">
                      <span>{formatDate(comment.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default PostDetailPage;
