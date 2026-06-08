import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyPage.css';
import { updateNickname } from '../../api/authApi';
import { getTodosByUserId } from '../../api/todoApi';
import type { TodoItem } from '../../api/todoApi';
import {
  fetchCommentsByUserId,
  fetchPostsByUserId,
  type CommentItem,
  type PostItem,
} from '../../api/postApi';

interface LoginUser {
  userId: number;
  username: string;
  nickname: string;
  role: string;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : '요청 처리 중 오류가 발생했습니다.';
}

function getTodoStatusLabel(status: string) {
  return status === 'DONE' ? '완료' : '진행중';
}

function MyPage() {
  const navigate = useNavigate();

  const [loginUser, setLoginUser] = useState<LoginUser | null>(null);
  const [editNickname, setEditNickname] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [myPosts, setMyPosts] = useState<PostItem[]>([]);
  const [myComments, setMyComments] = useState<CommentItem[]>([]);
  const [myTodos, setMyTodos] = useState<TodoItem[]>([]);

  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isLoadingTodos, setIsLoadingTodos] = useState(false);

  const loadMyPosts = useCallback(async (userId: number) => {
    try {
      setIsLoadingPosts(true);
      const posts = await fetchPostsByUserId(userId);
      setMyPosts(posts);
    } catch (error: unknown) {
      console.error('내 게시글 조회 실패:', error);
      alert(getErrorMessage(error));
    } finally {
      setIsLoadingPosts(false);
    }
  }, []);

  const loadMyComments = useCallback(async (userId: number) => {
    try {
      setIsLoadingComments(true);
      const comments = await fetchCommentsByUserId(userId);
      setMyComments(comments);
    } catch (error: unknown) {
      console.error('내 댓글 조회 실패:', error);
      alert(getErrorMessage(error));
    } finally {
      setIsLoadingComments(false);
    }
  }, []);

  const loadMyTodos = useCallback(async (userId: number) => {
    try {
      setIsLoadingTodos(true);
      const todos = await getTodosByUserId(userId);
      setMyTodos(todos);
    } catch (error: unknown) {
      console.error('내 할 일 조회 실패:', error);
      alert(getErrorMessage(error));
    } finally {
      setIsLoadingTodos(false);
    }
  }, []);

  const loadInitialData = useCallback(
    async (userId: number) => {
      await Promise.all([
        loadMyPosts(userId),
        loadMyComments(userId),
        loadMyTodos(userId),
      ]);
    },
    [loadMyComments, loadMyPosts, loadMyTodos]
  );

  useEffect(() => {
    const storedUser = localStorage.getItem('loginUser');

    if (!storedUser) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    try {
      const parsedUser: LoginUser = JSON.parse(storedUser);
      setLoginUser(parsedUser);
      setEditNickname(parsedUser.nickname);
      void loadInitialData(parsedUser.userId);
    } catch (error) {
      console.error('로그인 사용자 정보 파싱 실패:', error);
      localStorage.removeItem('loginUser');
      alert('로그인 정보가 올바르지 않습니다. 다시 로그인해주세요.');
      navigate('/login');
    }
  }, [loadInitialData, navigate]);

  const todoSummary = useMemo(() => {
    const total = myTodos.length;
    const completed = myTodos.filter((todo) => todo.status === 'DONE').length;
    const pending = myTodos.filter((todo) => todo.status !== 'DONE').length;
    const completionRate =
      total === 0 ? 0 : Math.round((completed / total) * 100);

    return {
      total,
      completed,
      pending,
      completionRate,
    };
  }, [myTodos]);

  const handleLogout = () => {
    localStorage.removeItem('loginUser');
    alert('로그아웃되었습니다.');
    navigate('/');
  };

  const handleNicknameUpdate = async () => {
    if (!loginUser) return;

    const trimmedNickname = editNickname.trim();

    if (!trimmedNickname) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    try {
      const result = await updateNickname({
        userId: loginUser.userId,
        nickname: trimmedNickname,
      });

      const updatedUser = {
        userId: result.userId,
        username: result.username,
        nickname: result.nickname,
        role: result.role,
      };

      localStorage.setItem('loginUser', JSON.stringify(updatedUser));
      setLoginUser(updatedUser);
      setEditNickname(updatedUser.nickname);
      setIsEditing(false);
      alert('닉네임이 변경되었습니다.');
    } catch (error: unknown) {
      alert(getErrorMessage(error));
    }
  };

  const handleCancelEdit = () => {
    if (!loginUser) return;
    setEditNickname(loginUser.nickname);
    setIsEditing(false);
  };

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    section?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!loginUser) {
    return <div className="mypage-page">로딩 중...</div>;
  }

  return (
    <div className="mypage-page">
      <div className="mypage-container">
        <section className="mypage-top-card">
          <div className="mypage-top-profile">
            <div className="mypage-avatar">{loginUser.nickname.charAt(0)}</div>

            <div className="mypage-top-text">
              <span className="mypage-badge">MY PROFILE</span>
              <h1>{loginUser.nickname}님</h1>
              <p>
                Between Jobs에서 내 정보, 작성한 게시글, 댓글, 할 일을 한
                번에 확인하고 관리할 수 있는 공간입니다.
              </p>

              <div className="mypage-top-meta">
                <span>아이디 {loginUser.username}</span>
                <span>권한 {loginUser.role}</span>
              </div>
            </div>
          </div>

          <div className="mypage-top-actions">
            <button
              type="button"
              className="mypage-primary-button"
              onClick={() => navigate('/posts')}
            >
              게시판 가기
            </button>
            <button
              type="button"
              className="mypage-secondary-button"
              onClick={() => navigate('/')}
            >
              메인으로
            </button>
            <button
              type="button"
              className="mypage-secondary-button"
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </div>
        </section>

        <div className="mypage-content-layout">
          <aside className="mypage-sidebar">
            <section className="mypage-sidebar-card">
              <h2 className="mypage-sidebar-title">내 프로필</h2>

              <div className="mypage-sidebar-profile">
                <div className="mypage-sidebar-avatar">
                  {loginUser.nickname.charAt(0)}
                </div>

                <div className="mypage-sidebar-userinfo">
                  <strong>{loginUser.nickname}</strong>
                  <span>{loginUser.username}</span>
                </div>
              </div>

              <div className="mypage-sidebar-status">
                <div className="mypage-status-item">
                  <span className="mypage-status-label">회원 번호</span>
                  <strong>{loginUser.userId}</strong>
                </div>
                <div className="mypage-status-item">
                  <span className="mypage-status-label">권한</span>
                  <strong>{loginUser.role}</strong>
                </div>
              </div>
            </section>

            <section className="mypage-sidebar-card">
              <h2 className="mypage-sidebar-title">바로가기</h2>

              <div className="mypage-sidebar-menu">
                <button
                  type="button"
                  onClick={() => {
                    scrollToSection('my-basic-info-section');
                    setEditNickname(loginUser.nickname);
                    setIsEditing(true);
                  }}
                >
                  회원정보
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('my-activity-section')}
                >
                  내 활동
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('my-todo-section')}
                >
                  할 일
                </button>
              </div>
            </section>
          </aside>

          <main className="mypage-main-content">
            <section className="mypage-panel" id="my-basic-info-section">
              <div className="mypage-panel-header">
                <h2>기본 정보</h2>
                <button
                  type="button"
                  className="mypage-text-button"
                  onClick={() => {
                    setEditNickname(loginUser.nickname);
                    setIsEditing(true);
                  }}
                >
                  수정
                </button>
              </div>

              <div className="mypage-info-grid">
                <div className="mypage-info-card">
                  <span className="mypage-info-label">회원 번호</span>
                  <strong>{loginUser.userId}</strong>
                </div>
                <div className="mypage-info-card">
                  <span className="mypage-info-label">아이디</span>
                  <strong>{loginUser.username}</strong>
                </div>
                <div className="mypage-info-card">
                  <span className="mypage-info-label">닉네임</span>
                  {isEditing ? (
                    <div className="mypage-inline-edit">
                      <input
                        type="text"
                        value={editNickname}
                        onChange={(event) =>
                          setEditNickname(event.target.value)
                        }
                        className="mypage-edit-input"
                        maxLength={50}
                      />
                      <div className="mypage-inline-edit-buttons">
                        <button
                          type="button"
                          className="mypage-primary-button"
                          onClick={handleNicknameUpdate}
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          className="mypage-secondary-button"
                          onClick={handleCancelEdit}
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <strong>{loginUser.nickname}</strong>
                  )}
                </div>
                <div className="mypage-info-card">
                  <span className="mypage-info-label">권한</span>
                  <strong>{loginUser.role}</strong>
                </div>
              </div>
            </section>

            <section className="mypage-small-panel" id="my-activity-section">
              <div className="mypage-panel-header">
                <h2>내 활동</h2>
              </div>

              <div className="mypage-list-box">
                <div className="mypage-list-row">
                  <div>
                    <strong>내 게시글</strong>
                    <p>최근 작성한 게시글 5개를 확인할 수 있습니다.</p>
                  </div>
                </div>

                {isLoadingPosts ? (
                  <p>작성한 게시글을 불러오는 중입니다...</p>
                ) : myPosts.length === 0 ? (
                  <div className="mypage-list-row">
                    <div>
                      <strong>게시글 없음</strong>
                      <p>아직 작성한 게시글이 없습니다.</p>
                    </div>
                    <button
                      type="button"
                      className="mypage-primary-button"
                      onClick={() => navigate('/posts/create')}
                    >
                      첫 게시글 작성
                    </button>
                  </div>
                ) : (
                  <div className="mypage-activity-list">
                    {myPosts.slice(0, 5).map((post) => (
                      <button
                        key={post.id}
                        type="button"
                        className="mypage-activity-item"
                        onClick={() => navigate(`/posts/${post.id}`)}
                      >
                        <strong>{post.title}</strong>
                        <span>
                          {post.boardName} · 댓글 {post.commentCount} · 조회{' '}
                          {post.viewCount}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="mypage-list-row">
                  <div>
                    <strong>내 댓글</strong>
                    <p>최근 작성한 댓글 5개를 확인할 수 있습니다.</p>
                  </div>
                </div>

                {isLoadingComments ? (
                  <p>작성한 댓글을 불러오는 중입니다...</p>
                ) : myComments.length === 0 ? (
                  <div className="mypage-list-row">
                    <div>
                      <strong>댓글 없음</strong>
                      <p>아직 작성한 댓글이 없습니다.</p>
                    </div>
                  </div>
                ) : (
                  <div className="mypage-activity-list">
                    {myComments.slice(0, 5).map((comment) => (
                      <button
                        key={comment.id}
                        type="button"
                        className="mypage-activity-item"
                        onClick={() => navigate(`/posts/${comment.postId}`)}
                      >
                        <strong>게시글 #{comment.postId}에 작성한 댓글</strong>
                        <span>{comment.content}</span>
                      </button>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  className="mypage-primary-button"
                  onClick={() => navigate('/posts')}
                >
                  게시판 더보기
                </button>
              </div>
            </section>

            <section className="mypage-small-panel" id="my-todo-section">
              <div className="mypage-panel-header">
                <h2>할 일</h2>
                <button
                  type="button"
                  className="mypage-text-button"
                  onClick={() => navigate('/todos')}
                >
                  더보기
                </button>
              </div>

              <div className="mypage-info-grid">
                <div className="mypage-info-card">
                  <span className="mypage-info-label">전체</span>
                  <strong>{todoSummary.total}</strong>
                </div>
                <div className="mypage-info-card">
                  <span className="mypage-info-label">진행중</span>
                  <strong>{todoSummary.pending}</strong>
                </div>
                <div className="mypage-info-card">
                  <span className="mypage-info-label">완료</span>
                  <strong>{todoSummary.completed}</strong>
                </div>
                <div className="mypage-info-card">
                  <span className="mypage-info-label">완료율</span>
                  <strong>{todoSummary.completionRate}%</strong>
                </div>
              </div>

              <div className="mypage-list-box">
                {isLoadingTodos ? (
                  <p>할 일을 불러오는 중입니다...</p>
                ) : myTodos.length === 0 ? (
                  <div className="mypage-list-row">
                    <div>
                      <strong>할 일 없음</strong>
                      <p>아직 등록한 할 일이 없습니다.</p>
                    </div>
                    <button
                      type="button"
                      className="mypage-primary-button"
                      onClick={() => navigate('/todos')}
                    >
                      할 일 추가
                    </button>
                  </div>
                ) : (
                  <div className="mypage-activity-list">
                    {myTodos.slice(0, 5).map((todo) => (
                      <button
                        key={todo.id}
                        type="button"
                        className="mypage-activity-item"
                        onClick={() => navigate('/todos')}
                      >
                        <strong>{todo.title}</strong>
                        <span>
                          상태 {getTodoStatusLabel(todo.status)}
                          {todo.dueDate ? ` · 마감일 ${todo.dueDate}` : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

export default MyPage;
