import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import './PostEditPage.css';
import { fetchPostDetail, updatePost } from '../../api/postApi';
import type { LoginUser } from '../../types/auth';
import { getStoredLoginUser } from '../../utils/auth';

function PostEditPage() {
  const { postId } = useParams();
  const navigate = useNavigate();

  const [loginUser, setLoginUser] = useState<LoginUser | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const parsedUser = getStoredLoginUser();

    if (!parsedUser) {
      navigate('/login');
      return;
    }

    setLoginUser(parsedUser);
  }, [navigate]);

  useEffect(() => {
    const loadPost = async () => {
      const numericPostId = Number(postId);

      if (!postId || Number.isNaN(numericPostId)) {
        setError('게시글 번호가 올바르지 않습니다.');
        setLoading(false);
        return;
      }

      try {
        const data = await fetchPostDetail(numericPostId);
        const parsedUser = getStoredLoginUser();

        if (!parsedUser) {
          navigate('/login');
          return;
        }

        const isOwner = parsedUser.userId === data.post.userId;
        const isAdmin = parsedUser.role === 'ADMIN';

        if (!isOwner && !isAdmin) {
          alert('본인 글 또는 관리자만 수정할 수 있습니다.');
          navigate(`/posts/${numericPostId}`);
          return;
        }

        setTitle(data.post.title);
        setContent(data.post.content);
        setError('');
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('게시글 정보를 불러오는 중 오류가 발생했습니다.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [postId, navigate]);

  const handleSubmit = async () => {
    const numericPostId = Number(postId);
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    setError('');

    if (!loginUser) {
      navigate('/login');
      return;
    }

    if (!postId || Number.isNaN(numericPostId)) {
      setError('게시글 번호가 올바르지 않습니다.');
      return;
    }

    if (!trimmedTitle) {
      setError('제목을 입력하세요.');
      return;
    }

    if (!trimmedContent) {
      setError('내용을 입력하세요.');
      return;
    }

    try {
      setSubmitting(true);

      const updatedPost = await updatePost(numericPostId, {
        userId: loginUser.userId,
        role: loginUser.role,
        title: trimmedTitle,
        content: trimmedContent,
      });

      navigate(`/posts/${updatedPost.id}`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('게시글 수정 중 오류가 발생했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="post-edit-page">
        <div className="post-edit-container">
          <div className="post-edit-box">불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="post-edit-page">
      <div className="post-edit-container">
        <div className="post-edit-nav">
          <Link to={postId ? `/posts/${postId}` : '/posts'} className="back-link">
            ← 상세로 돌아가기
          </Link>
        </div>

        <section className="post-edit-box">
          <h1 className="post-edit-title">글 수정</h1>
          <p className="post-edit-description">
            공유한 작업 기록의 제목과 내용을 수정합니다.
          </p>

          <div className="post-edit-form">
            <input
              className="post-edit-input"
              type="text"
              placeholder="제목을 입력하세요."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
            />

            <textarea
              className="post-edit-textarea"
              placeholder="내용을 입력하세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={submitting}
            />

            {error && <div className="post-edit-error">{error}</div>}

            <div className="post-edit-actions">
              <button
                type="button"
                className="post-edit-cancel-button"
                onClick={() => navigate(postId ? `/posts/${postId}` : '/posts')}
                disabled={submitting}
              >
                취소
              </button>
              <button
                type="button"
                className="post-edit-button"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? '수정 중...' : '글 수정'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default PostEditPage;