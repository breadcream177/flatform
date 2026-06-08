import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './PostCreatePage.css';
import { createPost } from '../../api/postApi';
import type { LoginUser } from '../../types/auth';
import { getStoredLoginUser } from '../../utils/auth';

function PostCreatePage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<LoginUser | null>(null);

  useEffect(() => {
    const parsedUser = getStoredLoginUser();

    if (!parsedUser) {
      alert('로그인 후 이용해주세요.');
      navigate('/login');
      return;
    }

    setUser(parsedUser);
  }, [navigate]);

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    setError('');

    if (!user) {
      alert('로그인 후 이용해주세요.');
      navigate('/login');
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

      const createdPost = await createPost({
        boardId: 1,
        userId: user.userId,
        title: trimmedTitle,
        content: trimmedContent,
      });

      navigate(`/posts/${createdPost.id}`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('게시글 작성 중 오류가 발생했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="post-create-page">
      <div className="post-create-container">
        <div className="post-create-nav">
          <Link to="/posts" className="back-link">
            ← 목록으로 돌아가기
          </Link>
        </div>

        <section className="post-create-box">
          <h1 className="post-create-title">글 작성</h1>
          <p className="post-create-description">
            자유게시판에 새 글을 작성합니다.
          </p>

          <div className="post-create-form">
            <input
              className="post-create-input"
              type="text"
              placeholder="제목을 입력하세요."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
            />

            <textarea
              className="post-create-textarea"
              placeholder="작업 내용, 고민, 진행 상황을 입력하세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={submitting}
            />

            {error && <div className="post-create-error">{error}</div>}

            <div className="post-create-actions">
              <button
                type="button"
                className="post-create-button"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? '작성 중...' : '글 작성'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default PostCreatePage;