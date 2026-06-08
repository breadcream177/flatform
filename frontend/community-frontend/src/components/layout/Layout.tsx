import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import './Layout.css';

type LoginUser = {
  userId: number;
  username: string;
  nickname: string;
  role: string;
};

const RECENT_SEARCH_KEY = 'recentSearchKeywords';
const SEARCH_AUTO_SAVE_KEY = 'searchAutoSaveEnabled';

const DEFAULT_AUTOCOMPLETE_KEYWORDS = [
  '뉴스',
  '블로그',
  '웹문서',
  '맛집',
  '취업',
  '포트폴리오',
  '자바',
  '리액트',
  '스프링부트',
  '커뮤니티',
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  const [keyword, setKeyword] = useState('');
  const [loginUser, setLoginUser] = useState<LoginUser | null>(null);
  const [recentKeywords, setRecentKeywords] = useState<string[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    const savedUser = localStorage.getItem('loginUser');

    if (!savedUser) {
      setLoginUser(null);
      return;
    }

    try {
      setLoginUser(JSON.parse(savedUser));
    } catch (error) {
      console.error('loginUser 파싱 오류:', error);
      localStorage.removeItem('loginUser');
      setLoginUser(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    const savedKeywords = localStorage.getItem(RECENT_SEARCH_KEY);
    const savedAutoSave = localStorage.getItem(SEARCH_AUTO_SAVE_KEY);

    if (savedKeywords) {
      try {
        setRecentKeywords(JSON.parse(savedKeywords));
      } catch (error) {
        console.error('최근 검색어 파싱 오류:', error);
        localStorage.removeItem(RECENT_SEARCH_KEY);
      }
    }

    if (savedAutoSave !== null) {
      setAutoSaveEnabled(savedAutoSave === 'true');
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const currentKeyword = params.get('keyword') ?? '';

    if (location.pathname === '/search') {
      setKeyword(currentKeyword);
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(e.target as Node)
      ) {
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
      .filter((item) =>
        item.toLowerCase().includes(trimmedKeyword.toLowerCase())
      )
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSearchDropdown && e.key !== 'Enter') {
      setShowSearchDropdown(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();

      if (autocompleteKeywords.length === 0) return;

      setSelectedIndex((prev) =>
        prev >= autocompleteKeywords.length - 1 ? 0 : prev + 1
      );
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();

      if (autocompleteKeywords.length === 0) return;

      setSelectedIndex((prev) =>
        prev <= 0 ? autocompleteKeywords.length - 1 : prev - 1
      );
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();

      if (selectedIndex >= 0 && autocompleteKeywords[selectedIndex]) {
        handleSearch(autocompleteKeywords[selectedIndex]);
        return;
      }

      handleSearch();
      return;
    }

    if (e.key === 'Escape') {
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

  const handleLogout = () => {
    localStorage.removeItem('loginUser');
    setLoginUser(null);
    navigate('/');
  };

  return (
    <div className="layout">
      <header className="layout-header">
        <div className="layout-header-inner">
          <div className="layout-header-left">
            <Link to="/" className="layout-logo-link">
              <h1 className="layout-logo">Between Jobs</h1>
            </Link>
          </div>

          <div className="layout-search-area">
            <div className="layout-search-box-wrap" ref={searchBoxRef}>
              <div
                className={
                  showSearchDropdown
                    ? 'layout-search-box active'
                    : 'layout-search-box'
                }
              >
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setShowSearchDropdown(true)}
                />

                {keyword && (
                  <button
                    type="button"
                    className="layout-search-clear-button"
                    onClick={handleClearKeyword}
                  >
                    ×
                  </button>
                )}

                <button type="button" onClick={() => handleSearch()}>
                  🔍
                </button>
              </div>

              {showSearchDropdown && (
                <div className="search-dropdown">
                  <div className="search-dropdown-header">
                    <strong>{keyword.trim() ? '자동완성' : '최근 검색어'}</strong>

                    {recentKeywords.length > 0 && !keyword.trim() && (
                      <button type="button" onClick={handleDeleteAllRecentKeywords}>
                        전체삭제
                      </button>
                    )}
                  </div>

                  {!autoSaveEnabled ? (
                    <div className="search-dropdown-empty">
                      자동완성이 꺼져 있습니다.
                    </div>
                  ) : autocompleteKeywords.length === 0 ? (
                    <div className="search-dropdown-empty">
                      추천 검색어가 없습니다.
                    </div>
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
                                {isRecentKeyword ? '↺' : '⌕'}
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
                    <span>검색 이력 기반 추천 검색어</span>

                    <button
                      type="button"
                      className={
                        autoSaveEnabled ? 'search-toggle active' : 'search-toggle'
                      }
                      onClick={handleToggleAutoSave}
                    >
                      <span />
                    </button>
                  </div>

                  <div className="search-dropdown-footer">
                    <button type="button" onClick={handleToggleAutoSave}>
                      {autoSaveEnabled ? '자동저장 끄기' : '자동저장 켜기'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowSearchDropdown(false)}
                    >
                      닫기
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <nav className="layout-nav">
            <button type="button" onClick={() => navigate('/')}>
              홈
            </button>

            <button type="button" onClick={() => navigate('/posts')}>
              work
            </button>

            <button type="button" onClick={() => navigate('/blog')}>
              블로그
            </button>

            {!loginUser ? (
              <button type="button" onClick={() => navigate('/login')}>
                로그인
              </button>
            ) : (
              <div className="layout-user-menu">
                <span className="layout-user-name">{loginUser.nickname}님</span>

                <button type="button" onClick={() => navigate('/mypage')}>
                  마이페이지
                </button>

                <button type="button" onClick={handleLogout}>
                  로그아웃
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="layout-main">
        <div className="layout-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
