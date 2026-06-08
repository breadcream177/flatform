import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './PostListPage.css';
import { fetchPosts, searchPosts, type PostItem } from '../../api/postApi';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `오늘 ${hh}:${mm}`;
  }

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

function PostListPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const data = await fetchPosts();
      setPosts(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '게시글 목록을 불러오는 중 오류가 발생했습니다.'
      );
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const runSearch = useCallback(
    async (searchKeyword: string) => {
      const trimmedKeyword = searchKeyword.trim();

      if (!trimmedKeyword) {
        await loadPosts();
        return;
      }

      try {
        setLoading(true);
        setError('');

        const data = await searchPosts(trimmedKeyword);
        setPosts(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : '게시글 검색 중 오류가 발생했습니다.'
        );
        setPosts([]);
      } finally {
        setLoading(false);
      }
    },
    [loadPosts]
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryKeyword = params.get('keyword') ?? '';

    setKeyword(queryKeyword);

    if (queryKeyword.trim()) {
      void runSearch(queryKeyword);
    } else {
      void loadPosts();
    }
  }, [loadPosts, location.search, runSearch]);

  const handleWriteClick = () => {
    const loginUser = localStorage.getItem('loginUser');

    if (!loginUser) {
      alert('로그인 후 게시글을 작성할 수 있습니다.');
      navigate('/login');
      return;
    }

    navigate('/posts/create');
  };

  const handleSearch = () => {
    const trimmedKeyword = keyword.trim();

    if (!trimmedKeyword) {
      navigate('/posts');
      return;
    }

    navigate(`/posts?keyword=${encodeURIComponent(trimmedKeyword)}`);
  };

  return (
    <div className="post-list-page">
      <div className="post-list-container">
        <section className="works-hero">
          <div>
            <p className="works-label">Between Jobs Works</p>
            <h1>작업과 생각을 공유하는 공간</h1>
            <p>
              기록, 진행 상황, 질문과 의견을 남기고 댓글로 소통하는 게시판
              공간입니다.
            </p>
          </div>

          <button
            type="button"
            className="works-write-button"
            onClick={handleWriteClick}
          >
            Works 작성
          </button>
        </section>

        <section className="works-toolbar">
          <div className="works-search-box">
            <input
              type="text"
              placeholder="Works 검색"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleSearch();
              }}
            />
            <button type="button" onClick={handleSearch}>
              검색
            </button>
          </div>

          <button
            type="button"
            className="works-home-button"
            onClick={() => navigate('/')}
          >
            메인으로
          </button>
        </section>

        {loading && <div className="post-list-status">불러오는 중...</div>}
        {error && <div className="post-list-status error">{error}</div>}

        {!loading && !error && (
          <section className="works-feed">
            {posts.length === 0 ? (
              <div className="works-empty">
                <h3>아직 등록된 Works가 없습니다.</h3>
                <p>첫 번째 작업 기록을 남겨보세요.</p>
              </div>
            ) : (
              posts.map((post) => (
                <article
                  key={post.id}
                  className="works-card"
                  onClick={() => navigate(`/posts/${post.id}`)}
                >
                  <div className="works-card-header">
                    <div className="works-avatar">
                      {post.nickname?.slice(0, 1)}
                    </div>

                    <div className="works-author">
                      <strong>{post.nickname}</strong>
                      <span>
                        {post.boardName} · {formatDate(post.createdAt)}
                      </span>
                    </div>

                    <span className="works-id">#{post.id}</span>
                  </div>

                  <div className="works-card-body">
                    <h2>{post.title}</h2>
                    <p>
                      {post.content.length > 140
                        ? `${post.content.slice(0, 140)}...`
                        : post.content}
                    </p>
                  </div>

                  <div className="works-card-footer">
                    <span>댓글 {post.commentCount}</span>
                    <span>조회 {post.viewCount}</span>
                  </div>
                </article>
              ))
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default PostListPage;
