import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import './Layout.css';

const RECENT_SEARCH_KEY = 'recentSearchKeywords';
const SEARCH_AUTO_SAVE_KEY = 'searchAutoSaveEnabled';

const DEFAULT_AUTOCOMPLETE_KEYWORDS = [
  'IT 신입 개발자',
  '이력서',
  '자기소개서',
  '포트폴리오',
  '면접',
  '정보처리기사',
  '컴퓨터활용능력',
  '청년 일자리',
  '개발자 노트북',
  '면접 복장',
];

interface LayoutLoginUser {
  username: string;
  nickname?: string;
}

function readLoginUser() {
  const storedUser = localStorage.getItem('loginUser');

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as LayoutLoginUser;
  } catch (error) {
    console.error('로그인 사용자 정보를 읽지 못했습니다.', error);
    localStorage.removeItem('loginUser');
    return null;
  }
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  const [keyword, setKeyword] = useState('');
  const [recentKeywords, setRecentKeywords] = useState<string[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loginUser, setLoginUser] = useState<LayoutLoginUser | null>(null);

  useEffect(() => {
    const savedKeywords = localStorage.getItem(RECENT_SEARCH_KEY);
    const savedAutoSave = localStorage.getItem(SEARCH_AUTO_SAVE_KEY);

    if (savedKeywords) {
      try {
        setRecentKeywords(JSON.parse(savedKeywords));
      } catch (error) {
        console.error('최근 검색어를 읽지 못했습니다.', error);
        localStorage.removeItem(RECENT_SEARCH_KEY);
      }
    }

    if (savedAutoSave !== null) {
      setAutoSaveEnabled(savedAutoSave === 'true');
    }

    setLoginUser(readLoginUser());
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const currentKeyword = params.get('keyword') ?? '';

    if (location.pathname === '/search') {
      setKeyword(currentKeyword);
    }

    setLoginUser(readLoginUser());
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'loginUser') {
        setLoginUser(readLoginUser());
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const autocompleteKeywords = useMemo(() => {
    if (!autoSaveEnabled) return [];

    const trimmedKeyword = keyword.trim();
    const mergedKeywords = Array.from(
      new Set([...recentKeywords, ...DEFAULT_AUTOCOMPLETE_KEYWORDS])
    );

    if (!trimmedKeyword) {
      return recentKeywords.slice(0, 10);
    }

    return mergedKeywords
      .filter((item) => item.toLowerCase().includes(trimmedKeyword.toLowerCase()))
      .slice(0, 10);
  }, [keyword, recentKeywords, autoSaveEnabled]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [keyword]);

  const saveRecentKeyword = (searchKeyword: string) => {
    if (!autoSaveEnabled) return;

    const nextKeywords = [
      searchKeyword,
      ...recentKeywords.filter((item) => item !== searchKeyword),
    ].slice(0, 10);

    setRecentKeywords(nextKeywords);
    localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(nextKeywords));
  };

  const handleSearch = (searchKeyword?: string) => {
    const targetKeyword = (searchKeyword ?? keyword).trim();

    if (!targetKeyword) {
      navigate('/search');
      return;
    }

    saveRecentKeyword(targetKeyword);
    setKeyword(targetKeyword);
    setShowSearchDropdown(false);
    setSelectedIndex(-1);
    navigate(`/search?keyword=${encodeURIComponent(targetKeyword)}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSearchDropdown && event.key !== 'Enter') {
      setShowSearchDropdown(true);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (autocompleteKeywords.length === 0) return;
      setSelectedIndex((prev) => (prev >= autocompleteKeywords.length - 1 ? 0 : prev + 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (autocompleteKeywords.length === 0) return;
      setSelectedIndex((prev) => (prev <= 0 ? autocompleteKeywords.length - 1 : prev - 1));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();

      if (selectedIndex >= 0 && autocompleteKeywords[selectedIndex]) {
        handleSearch(autocompleteKeywords[selectedIndex]);
        return;
      }

      handleSearch();
      return;
    }

    if (event.key === 'Escape') {
      setShowSearchDropdown(false);
      setSelectedIndex(-1);
    }
  };

  const handleClearKeyword = () => {
    setKeyword('');
    setShowSearchDropdown(true);
    setSelectedIndex(-1);
  };

  const handleDeleteRecentKeyword = (targetKeyword: string) => {
    const nextKeywords = recentKeywords.filter((item) => item !== targetKeyword);
    setRecentKeywords(nextKeywords);
    localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(nextKeywords));
  };

  const handleDeleteAllRecentKeywords = () => {
    setRecentKeywords([]);
    localStorage.removeItem(RECENT_SEARCH_KEY);
  };

  const handleToggleAutoSave = () => {
    const nextValue = !autoSaveEnabled;
    setAutoSaveEnabled(nextValue);
    localStorage.setItem(SEARCH_AUTO_SAVE_KEY, String(nextValue));

    if (!nextValue) {
      setRecentKeywords([]);
      localStorage.removeItem(RECENT_SEARCH_KEY);
    }
  };

  const handleMobileLogout = () => {
    localStorage.removeItem('loginUser');
    setLoginUser(null);
    navigate('/');
  };

  return (
    <div className="layout">
      <header className="layout-header">
        <div className="layout-header-inner">
          <Link to="/" className="layout-logo-link" aria-label="Between Jobs 홈">
            <h1 className="layout-logo">Between Jobs</h1>
          </Link>

          <div className="layout-search-area">
            <div className="layout-search-box-wrap" ref={searchBoxRef}>
              <div className={showSearchDropdown ? 'layout-search-box active' : 'layout-search-box'}>
                <input
                  type="text"
                  value={keyword}
                  onChange={(event) => {
                    setKeyword(event.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setShowSearchDropdown(true)}
                  placeholder="검색어를 입력해주세요"
                />

                {keyword && (
                  <button
                    type="button"
                    className="layout-search-clear-button"
                    onClick={handleClearKeyword}
                    aria-label="검색어 지우기"
                  >
                    ×
                  </button>
                )}

                <button
                  type="button"
                  className="layout-search-submit-button"
                  onClick={() => handleSearch()}
                  aria-label="검색"
                >
                  🔍
                </button>
              </div>

              {showSearchDropdown && (
                <div className="search-dropdown">
                  <div className="search-dropdown-header">
                    <strong>{keyword.trim() ? '추천 검색어' : '최근 검색어'}</strong>

                    {recentKeywords.length > 0 && !keyword.trim() && (
                      <button type="button" onClick={handleDeleteAllRecentKeywords}>
                        전체삭제
                      </button>
                    )}
                  </div>

                  {!autoSaveEnabled ? (
                    <div className="search-dropdown-empty">검색어 저장이 꺼져 있습니다.</div>
                  ) : autocompleteKeywords.length === 0 ? (
                    <div className="search-dropdown-empty">표시할 검색어가 없습니다.</div>
                  ) : (
                    <ul className="recent-search-list">
                      {autocompleteKeywords.map((item, index) => {
                        const isRecentKeyword = recentKeywords.includes(item);

                        return (
                          <li
                            key={item}
                            className={
                              selectedIndex === index
                                ? 'recent-search-item active'
                                : 'recent-search-item'
                            }
                          >
                            <button
                              type="button"
                              className="recent-search-keyword"
                              onMouseEnter={() => setSelectedIndex(index)}
                              onClick={() => handleSearch(item)}
                            >
                              <span className="recent-search-icon">
                                {isRecentKeyword ? '최근' : '추천'}
                              </span>
                              <span>{item}</span>
                            </button>

                            {isRecentKeyword && (
                              <button
                                type="button"
                                className="recent-search-delete"
                                onClick={() => handleDeleteRecentKeyword(item)}
                              >
                                ×
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  <div className="search-dropdown-option">
                    <span>검색 이력 기반 추천</span>
                    <button
                      type="button"
                      className={autoSaveEnabled ? 'search-toggle active' : 'search-toggle'}
                      onClick={handleToggleAutoSave}
                    >
                      <span />
                    </button>
                  </div>

                  <div className="search-dropdown-footer">
                    <button type="button" onClick={handleToggleAutoSave}>
                      {autoSaveEnabled ? '자동저장 끄기' : '자동저장 켜기'}
                    </button>
                    <button type="button" onClick={() => setShowSearchDropdown(false)}>
                      닫기
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="layout-main">
        <div className="layout-content">
          <Outlet />
        </div>
      </main>

      <nav className="mobile-bottom-nav" aria-label="모바일 주요 메뉴">
        <button type="button" onClick={() => navigate('/')}>
          <span className="mobile-bottom-nav-icon">홈</span>
          홈
        </button>
        <button type="button" onClick={() => navigate('/posts')}>
          <span className="mobile-bottom-nav-icon">글</span>
          게시글
        </button>
        <button type="button" onClick={() => navigate('/blog')}>
          <span className="mobile-bottom-nav-icon">B</span>
          블로그
        </button>

        {loginUser ? (
          <>
            <button type="button" onClick={() => navigate('/mypage')}>
              <span className="mobile-bottom-nav-icon">M</span>
              마이
            </button>
            <button type="button" onClick={handleMobileLogout}>
              <span className="mobile-bottom-nav-icon">OUT</span>
              로그아웃
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => navigate('/login')}>
              <span className="mobile-bottom-nav-icon">IN</span>
              로그인
            </button>
            <button type="button" onClick={() => navigate('/signup')}>
              <span className="mobile-bottom-nav-icon">+</span>
              가입
            </button>
          </>
        )}
      </nav>
    </div>
  );
}
