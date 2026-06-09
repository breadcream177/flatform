import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchMainNews,
  fetchMainShopping,
  fetchMainSummary,
  fetchMainWebtoons,
  type MainExchangeRatePreview,
  type MainMarketStockPreview,
  type MainNewsPreview,
  type MainPostPreview,
  type MainShoppingPreview,
  type MainWeatherPreview,
  type MainWebtoonPreview,
} from '../../api/mainApi';
import { searchImage, type NaverImageSearchItem } from '../../api/searchApi';
import { getTodosByUserId, type TodoItem } from '../../api/todoApi';
import './MainPage.css';

interface LoginUser {
  userId: number;
  username: string;
  nickname: string;
  role: string;
}

interface MainDataState {
  posts: MainPostPreview[];
  news: MainNewsPreview[];
  weather: MainWeatherPreview | null;
  exchangeRate: MainExchangeRatePreview | null;
  marketStocks: MainMarketStockPreview[];
  shoppingItems: MainShoppingPreview[];
  webtoonItems: MainWebtoonPreview[];
}

interface MainErrorState {
  summary: string;
  news: string;
  weather: string;
  exchange: string;
  market: string;
  shopping: string;
  webtoon: string;
  content: string;
}

const emptyMainData: MainDataState = {
  posts: [],
  news: [],
  weather: null,
  exchangeRate: null,
  marketStocks: [],
  shoppingItems: [],
  webtoonItems: [],
};

const emptyMainErrors: MainErrorState = {
  summary: '',
  news: '',
  weather: '',
  exchange: '',
  market: '',
  shopping: '',
  webtoon: '',
  content: '',
};

const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
const shoppingThemes = [
  { label: '취업 준비', keyword: '취업 준비 아이템' },
  { label: '면접 복장', keyword: '면접 복장' },
  { label: '노트북', keyword: '노트북' },
  { label: '책상 정리', keyword: '책상 정리' },
  { label: '자격증 교재', keyword: '자격증 교재' },
];
const newsTabs = [
  { label: '뉴스스탠드', keyword: '취업 실무', subLabel: '전체언론사' },
  { label: '언론사편집', keyword: '언론사 주요 뉴스', subLabel: '분야별 뉴스' },
  { label: '엔터', keyword: '엔터 뉴스', subLabel: '드라마 · 영화 · 뮤직' },
  { label: '스포츠', keyword: '스포츠 뉴스', subLabel: '월드컵 · 야구 · 축구' },
  { label: 'LIVE', keyword: '라이브 뉴스', subLabel: '실시간 이슈', live: true },
  { label: '게임', keyword: '게임 뉴스', subLabel: '게임라운지 · e스포츠' },
  { label: '경제', keyword: '경제 뉴스', subLabel: '증시 · 산업 · 금융' },
  { label: '쇼핑투데이', keyword: '쇼핑 뉴스', subLabel: '쇼핑 트렌드' },
];
const shoppingTabs = [
  { label: '쇼핑', keyword: '쇼핑' },
  { label: '맨즈', keyword: '남성 패션' },
  { label: '브랜드샵', keyword: '브랜드 상품' },
  { label: 'MY추천', keyword: '취업 준비 아이템' },
  { label: '추천핫딜', keyword: '핫딜 상품' },
  { label: '쇼핑라이브', keyword: '쇼핑 라이브' },
];
const shoppingMallLinks = [
  { label: '쿠팡', keyword: '쿠팡 취업 준비' },
  { label: 'G마켓', keyword: 'G마켓 취업 준비' },
  { label: '옥션', keyword: '옥션 취업 준비' },
  { label: '11번가', keyword: '11번가 취업 준비' },
  { label: '올리브영', keyword: '올리브영 면접' },
  { label: 'SSG닷컴', keyword: 'SSG 취업 준비' },
  { label: '하프클럽', keyword: '하프클럽 면접 복장' },
  { label: '이마트몰', keyword: '이마트몰 사무용품' },
  { label: 'GS SHOP', keyword: 'GS SHOP 노트북 가방' },
  { label: '패션플러스', keyword: '패션플러스 면접 복장' },
];
const webtoonWeeks = [
  { label: '월요웹툰', value: 'mon' },
  { label: '화요웹툰', value: 'tue' },
  { label: '수요웹툰', value: 'wed' },
  { label: '목요웹툰', value: 'thu' },
  { label: '금요웹툰', value: 'fri' },
  { label: '토요웹툰', value: 'sat' },
  { label: '일요웹툰', value: 'sun' },
];
const contentCategories = [
  { label: '추천', keyword: '추천 콘텐츠', type: 'image' },
  { label: '카테크', keyword: '카테크', type: 'image' },
  { label: '웹툰', keyword: '인기 웹툰', type: 'webtoon' },
  { label: '패션뷰티', keyword: '패션 뷰티', type: 'image' },
  { label: '리빙푸드', keyword: '리빙 푸드', type: 'image' },
  { label: '책방', keyword: '책 추천', type: 'image' },
  { label: '지식', keyword: '지식 콘텐츠', type: 'image' },
  { label: '건강', keyword: '건강 정보', type: 'image' },
];

type ContentCategory = (typeof contentCategories)[number];

const CONTENT_IMAGE_PREVIEW_LIMIT = 12;

function cleanText(text?: string) {
  return (text ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function getPreviewText(text?: string, maxLength = 90) {
  const clean = cleanText(text);

  if (clean.length <= maxLength) {
    return clean;
  }

  return `${clean.slice(0, maxLength)}...`;
}

function formatDate(dateText?: string) {
  if (!dateText) {
    return '날짜 없음';
  }

  const date = new Date(dateText);

  if (Number.isNaN(date.getTime())) {
    return dateText;
  }

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatNumber(value?: number | null, fractionDigits = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-';
  }

  return value.toLocaleString('ko-KR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

function formatPrice(price?: number | null) {
  if (price === null || price === undefined) {
    return '가격 정보 없음';
  }

  return `${price.toLocaleString('ko-KR')}원`;
}

function formatShortDate(dateText?: string) {
  if (!dateText) {
    return '';
  }

  const date = new Date(dateText);

  if (Number.isNaN(date.getTime())) {
    return dateText;
  }

  return date.toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  });
}

function getNewsTargetLink(news?: MainNewsPreview) {
  return news?.originallink || news?.link || '';
}

function getNewsSourceName(news?: MainNewsPreview) {
  const targetLink = getNewsTargetLink(news);

  if (!targetLink) {
    return '언론사';
  }

  try {
    const hostname = new URL(targetLink).hostname.replace(/^www\./, '');
    const sourceMap: Record<string, string> = {
      'yna.co.kr': '연합뉴스',
      'yonhapnewstv.co.kr': '연합뉴스TV',
      'newsis.com': '뉴시스',
      'news.naver.com': '네이버뉴스',
      'chosun.com': '조선일보',
      'joongang.co.kr': '중앙일보',
      'donga.com': '동아일보',
      'hankyung.com': '한국경제',
      'mk.co.kr': '매일경제',
      'khan.co.kr': '경향신문',
      'hani.co.kr': '한겨레',
      'ytn.co.kr': 'YTN',
      'kbs.co.kr': 'KBS',
      'imbc.com': 'MBC',
      'sbs.co.kr': 'SBS',
    };

    return sourceMap[hostname] ?? hostname.split('.')[0].toUpperCase();
  } catch {
    return '언론사';
  }
}

function getNaverSearchUrl(keyword: string, where = 'nexearch') {
  return `https://search.naver.com/search.naver?where=${where}&query=${encodeURIComponent(
    keyword
  )}`;
}

function extractCommunityKeywords(posts: MainPostPreview[]) {
  const stopWords = new Set([
    '그리고',
    '하지만',
    '입니다',
    '합니다',
    '게시글',
    '커뮤니티',
  ]);
  const keywordCount = new Map<string, number>();

  posts.forEach((post) => {
    `${post.title} ${post.boardName}`
      .split(/[\s,./|()[\]{}'"“”‘’!?]+/)
      .map((word) => cleanText(word))
      .filter((word) => word.length >= 2 && !stopWords.has(word))
      .forEach((word) => {
        keywordCount.set(word, (keywordCount.get(word) ?? 0) + 1);
      });
  });

  return [...keywordCount.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko-KR'))
    .slice(0, 8)
    .map(([keyword]) => keyword);
}

function MainPage() {
  const navigate = useNavigate();
  const [loginUser, setLoginUser] = useState<LoginUser | null>(null);
  const [todoPreviewItems, setTodoPreviewItems] = useState<TodoItem[]>([]);
  const [todoPreviewError, setTodoPreviewError] = useState('');
  const [mainData, setMainData] = useState<MainDataState>(emptyMainData);
  const [mainErrors, setMainErrors] =
    useState<MainErrorState>(emptyMainErrors);
  const [mainLoading, setMainLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(false);
  const [shoppingLoading, setShoppingLoading] = useState(false);
  const [webtoonLoading, setWebtoonLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentItems, setContentItems] = useState<NaverImageSearchItem[]>([]);
  const [activeNewsTab, setActiveNewsTab] = useState(newsTabs[0].label);
  const [activeShoppingTheme, setActiveShoppingTheme] = useState(
    shoppingThemes[0].keyword
  );
  const [activeContentCategory, setActiveContentCategory] = useState(
    contentCategories[0].label
  );
  const [activeWebtoonWeek, setActiveWebtoonWeek] = useState(() => {
    const todayIndex = new Date().getDay();
    const weekMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

    return weekMap[todayIndex];
  });

  const today = useMemo(() => new Date(), []);
  const currentMonth = today.getMonth() + 1;
  const currentDate = today.getDate();
  const currentDayLabel = weekDays[today.getDay()];
  const lastDate = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  ).getDate();
  const calendarStartOffset = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  ).getDay();
  const calendarDates = Array.from({ length: 35 }, (_, index) => index);

  const latestNews = useMemo(
    () => mainData.news.slice(0, 4),
    [mainData.news]
  );
  const activeNewsTabInfo = useMemo(
    () => newsTabs.find((tab) => tab.label === activeNewsTab) ?? newsTabs[0],
    [activeNewsTab]
  );
  const activeContentCategoryInfo = useMemo(
    () =>
      contentCategories.find(
        (category) => category.label === activeContentCategory
      ) ?? contentCategories[0],
    [activeContentCategory]
  );
  const headlineNews = latestNews[0];
  const communityKeywords = useMemo(
    () => extractCommunityKeywords(mainData.posts),
    [mainData.posts]
  );

  const loadTodoPreview = useCallback(async (userId: number) => {
    try {
      setTodoPreviewError('');

      const todoList = await getTodosByUserId(userId);
      const previewList = todoList
        .filter((todo) => todo.status !== 'DONE')
        .slice(0, 3);

      setTodoPreviewItems(previewList);
    } catch (error) {
      console.error('Todo 미리보기 조회 실패:', error);
      setTodoPreviewItems([]);
      setTodoPreviewError('Todo 목록을 불러오지 못했습니다.');
    }
  }, []);

  const loadMainData = useCallback(async () => {
    try {
      setMainLoading(true);
      setMainErrors(emptyMainErrors);

      const summary = await fetchMainSummary();

      setMainData({
        posts: summary.posts ?? [],
        news: summary.news ?? [],
        weather: summary.weather,
        exchangeRate: summary.exchangeRate,
        marketStocks: summary.marketStocks ?? [],
        shoppingItems: summary.shoppingItems ?? [],
        webtoonItems: summary.webtoonItems ?? [],
      });

      setMainErrors({
        summary: '',
        news: summary.newsError ?? '',
        weather: summary.weatherError ?? '',
        exchange: summary.exchangeError ?? '',
        market: summary.marketError ?? '',
        shopping: summary.shoppingError ?? '',
        webtoon: summary.webtoonError ?? '',
        content: '',
      });
    } catch (error) {
      console.error('메인 요약 조회 실패:', error);
      setMainData(emptyMainData);
      setMainErrors({
        ...emptyMainErrors,
        summary:
          error instanceof Error
            ? error.message
            : '메인 요약 정보를 불러오지 못했습니다.',
        news: '',
      });
    } finally {
      setMainLoading(false);
    }
  }, []);

  const syncLoginUser = useCallback(() => {
    const storedUser = localStorage.getItem('loginUser');

    if (!storedUser) {
      setLoginUser(null);
      setTodoPreviewItems([]);
      setTodoPreviewError('');
      return;
    }

    try {
      const parsedUser: LoginUser = JSON.parse(storedUser);
      setLoginUser(parsedUser);
      void loadTodoPreview(parsedUser.userId);
    } catch (error) {
      console.error('로그인 사용자 정보 파싱 실패:', error);
      localStorage.removeItem('loginUser');
      setLoginUser(null);
      setTodoPreviewItems([]);
      setTodoPreviewError('');
    }
  }, [loadTodoPreview]);

  useEffect(() => {
    void loadMainData();
  }, [loadMainData]);

  useEffect(() => {
    syncLoginUser();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'loginUser') {
        syncLoginUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [syncLoginUser]);

  const handleLogout = () => {
    localStorage.removeItem('loginUser');
    setLoginUser(null);
    setTodoPreviewItems([]);
    setTodoPreviewError('');
    navigate('/');
  };

  const handleMyPageClick = () => {
    if (!loginUser) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    navigate('/mypage');
  };

  const handleNavigateTodos = () => {
    if (!loginUser) {
      navigate('/login');
      return;
    }

    navigate('/todos');
  };

  const handleSearchKeyword = (keyword: string) => {
    navigate(`/search?keyword=${encodeURIComponent(keyword)}`);
  };

  const loadContentCategory = useCallback(async (category: ContentCategory) => {
    setActiveContentCategory(category.label);

    if (category.type === 'webtoon') {
      setContentItems([]);
      setMainErrors((prev) => ({ ...prev, content: '' }));
      return;
    }

    try {
      setContentLoading(true);
      setMainErrors((prev) => ({ ...prev, content: '' }));

      const imageResult = await searchImage(
        category.keyword,
        1,
        CONTENT_IMAGE_PREVIEW_LIMIT,
        'sim'
      );

      setContentItems(
        (imageResult.items ?? [])
          .filter((item) => item.link && item.thumbnail)
          .slice(0, CONTENT_IMAGE_PREVIEW_LIMIT)
      );
    } catch (error) {
      console.error('콘텐츠 카테고리 조회 실패:', error);
      setContentItems([]);
      setMainErrors((prev) => ({
        ...prev,
        content:
          error instanceof Error
            ? error.message
            : '콘텐츠 정보를 불러오지 못했습니다.',
      }));
    } finally {
      setContentLoading(false);
    }
  }, []);

  useEffect(() => {
    if (
      mainLoading ||
      activeContentCategory !== contentCategories[0].label ||
      contentItems.length > 0 ||
      mainErrors.content
    ) {
      return;
    }

    void loadContentCategory(contentCategories[0]);
  }, [
    activeContentCategory,
    contentItems.length,
    loadContentCategory,
    mainErrors.content,
    mainLoading,
  ]);

  const handleNewsTabClick = async (tab: (typeof newsTabs)[number]) => {
    if (newsLoading || mainLoading) {
      return;
    }

    try {
      setActiveNewsTab(tab.label);
      setNewsLoading(true);
      setMainErrors((prev) => ({ ...prev, news: '' }));

      const newsItems = await fetchMainNews(tab.keyword);

      setMainData((prev) => ({ ...prev, news: newsItems ?? [] }));
    } catch (error) {
      console.error('뉴스 탭 조회 실패:', error);
      setMainData((prev) => ({ ...prev, news: [] }));
      setMainErrors((prev) => ({
        ...prev,
        news:
          error instanceof Error
            ? error.message
            : '뉴스 정보를 불러오지 못했습니다.',
      }));
    } finally {
      setNewsLoading(false);
    }
  };

  const handleShoppingThemeClick = async (keyword: string) => {
    if (shoppingLoading || mainLoading) {
      return;
    }

    try {
      setActiveShoppingTheme(keyword);
      setShoppingLoading(true);
      setMainErrors((prev) => ({ ...prev, shopping: '' }));

      const shoppingItems = await fetchMainShopping(keyword);

      setMainData((prev) => ({ ...prev, shoppingItems: shoppingItems ?? [] }));
    } catch (error) {
      console.error('쇼핑 테마 조회 실패:', error);
      setMainData((prev) => ({ ...prev, shoppingItems: [] }));
      setMainErrors((prev) => ({
        ...prev,
        shopping:
          error instanceof Error
            ? error.message
            : '쇼핑 정보를 불러오지 못했습니다.',
      }));
    } finally {
      setShoppingLoading(false);
    }
  };

  const handleWebtoonWeekClick = async (week: string) => {
    if (webtoonLoading || mainLoading) {
      return;
    }

    try {
      setActiveWebtoonWeek(week);
      setWebtoonLoading(true);
      setMainErrors((prev) => ({ ...prev, webtoon: '' }));

      const webtoonItems = await fetchMainWebtoons(week);

      setMainData((prev) => ({ ...prev, webtoonItems: webtoonItems ?? [] }));
    } catch (error) {
      console.error('웹툰 요일 조회 실패:', error);
      setMainData((prev) => ({ ...prev, webtoonItems: [] }));
      setMainErrors((prev) => ({
        ...prev,
        webtoon:
          error instanceof Error
            ? error.message
            : '웹툰 정보를 불러오지 못했습니다.',
      }));
    } finally {
      setWebtoonLoading(false);
    }
  };

  const handleContentCategoryClick = async (category: ContentCategory) => {
    if (contentLoading || mainLoading) {
      return;
    }

    await loadContentCategory(category);
  };

  const handleContentHomeClick = () => {
    if (activeContentCategoryInfo.type === 'webtoon') {
      handleOpenExternalLink('https://comic.naver.com');
      return;
    }

    handleOpenExternalLink(
      getNaverSearchUrl(activeContentCategoryInfo.keyword, 'image')
    );
  };

  const handleOpenExternalLink = (link: string) => {
    if (!link) {
      return;
    }

    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const handleCardKeyDown = (
    event: KeyboardEvent<HTMLElement>,
    action: () => void
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  const getMainSectionError = (sectionError: string) =>
    sectionError || mainErrors.summary;

  return (
    <div className="main-page">
      <main className="portal-main">
        <div className="portal-main-inner">
          <section className="portal-left-column">
            <article className="hero-banner-card">
              <div className="hero-banner-content">
                <span className="hero-badge">BETWEEN JOBS</span>
                <h2>검색, 커뮤니티, AI 개요를 한 화면에서 이어가는 포털</h2>
                <p>
                  게시글, 블로그, 뉴스 검색 결과를 실제 데이터로 연결하고 필요한
                  정보는 통합 검색과 AI 개요에서 바로 확인할 수 있습니다.
                </p>

                <div className="hero-button-group">
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => handleSearchKeyword('취업 실무')}
                  >
                    통합 검색 시작
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => navigate('/posts')}
                  >
                    게시글 보기
                  </button>
                </div>
              </div>
            </article>

            <section className="content-card news-section-card">
              <div className="naver-like-tab-row">
                {newsTabs.map((tab) => (
                  <button
                    key={tab.label}
                    type="button"
                    disabled={mainLoading || newsLoading}
                    className={[
                      activeNewsTab === tab.label ? 'is-active' : '',
                      tab.live ? 'is-live' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => void handleNewsTabClick(tab)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="news-headline-strip">
                <button
                  type="button"
                  onClick={() =>
                    handleOpenExternalLink('https://news.naver.com')
                  }
                >
                  {activeNewsTabInfo.subLabel} ▾
                </button>
                {headlineNews ? (
                  <>
                    <span className="news-strip-divider">|</span>
                    <button
                      type="button"
                      className="news-source-strip-link"
                      onClick={() =>
                        handleOpenExternalLink(getNewsTargetLink(headlineNews))
                      }
                    >
                      {getNewsSourceName(headlineNews)}
                    </button>
                    <button
                      type="button"
                      className="news-headline-link"
                      onClick={() =>
                        handleOpenExternalLink(getNewsTargetLink(headlineNews))
                      }
                    >
                      {cleanText(headlineNews.title)}
                    </button>
                  </>
                ) : (
                  <p>{activeNewsTab} 탭의 뉴스를 불러오면 이곳에 주요 제목이 표시됩니다.</p>
                )}
                <button
                  type="button"
                  className="header-text-button"
                  onClick={() =>
                    handleOpenExternalLink('https://news.naver.com')
                  }
                >
                  뉴스홈
                </button>
              </div>

              {mainLoading || newsLoading ? (
                <p className="empty-message">뉴스를 불러오는 중입니다.</p>
              ) : getMainSectionError(mainErrors.news) ? (
                <p className="empty-message">
                  {getMainSectionError(mainErrors.news)}
                </p>
              ) : latestNews.length === 0 ? (
                <p className="empty-message">표시할 뉴스가 없습니다.</p>
              ) : (
                <div className="news-grid">
                  {latestNews.map((news) => (
                    <article
                      key={news.link}
                      className={
                        news.imageUrl
                          ? 'news-item-card has-thumbnail'
                          : 'news-item-card'
                      }
                    >
                      {news.imageUrl && (
                        <button
                          type="button"
                          className="news-thumbnail"
                          onClick={() =>
                            handleOpenExternalLink(getNewsTargetLink(news))
                          }
                        >
                          <img src={news.imageUrl} alt="" loading="lazy" />
                        </button>
                      )}
                      <div className="news-item-content">
                        <button
                          type="button"
                          className="news-source-link"
                          onClick={() =>
                            handleOpenExternalLink(getNewsTargetLink(news))
                          }
                        >
                          {getNewsSourceName(news)}
                        </button>
                        <button
                          type="button"
                          className="news-title-link"
                          onClick={() =>
                            handleOpenExternalLink(getNewsTargetLink(news))
                          }
                        >
                          {cleanText(news.title)}
                        </button>
                        <p>{getPreviewText(news.description)}</p>
                        <span className="news-time">
                          {news.pubDate
                            ? formatDate(news.pubDate)
                            : news.originallink || news.link}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="content-card shopping-section-card">
              <div className="shopping-top-row">
                <div className="naver-like-tab-row shopping-tabs">
                  {shoppingTabs.map((tab) => (
                    <button
                      key={tab.label}
                      type="button"
                      disabled={mainLoading || shoppingLoading}
                      className={
                        activeShoppingTheme === tab.keyword ? 'is-active' : ''
                      }
                      onClick={() => void handleShoppingThemeClick(tab.keyword)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="section-count-box">
                  <span>{mainData.shoppingItems.length}</span>
                </div>
              </div>

              <div className="shopping-content-layout">
                <div className="shopping-side-panel">
                  <div className="shopping-mall-panel">
                    {shoppingMallLinks.map((mall) => (
                      <button
                        key={mall.label}
                        type="button"
                        disabled={mainLoading || shoppingLoading}
                        className={
                          activeShoppingTheme === mall.keyword ? 'is-active' : ''
                        }
                        onClick={() =>
                          void handleShoppingThemeClick(mall.keyword)
                        }
                      >
                        {mall.label}
                      </button>
                    ))}
                  </div>

                  <div className="shopping-theme-buttons">
                    {shoppingThemes.map((theme) => (
                      <button
                        key={theme.keyword}
                        type="button"
                        disabled={mainLoading || shoppingLoading}
                        className={
                          activeShoppingTheme === theme.keyword ? 'is-active' : ''
                        }
                        onClick={() =>
                          void handleShoppingThemeClick(theme.keyword)
                        }
                      >
                        {theme.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="shopping-result-area">
                  {mainLoading || shoppingLoading ? (
                    <p className="empty-message">쇼핑 테마를 불러오는 중입니다.</p>
                  ) : getMainSectionError(mainErrors.shopping) ? (
                    <p className="empty-message">
                      {getMainSectionError(mainErrors.shopping)}
                    </p>
                  ) : mainData.shoppingItems.length === 0 ? (
                    <p className="empty-message">표시할 쇼핑 상품이 없습니다.</p>
                  ) : (
                    <div className="shopping-product-grid">
                      {mainData.shoppingItems.map((item) => (
                        <article
                          key={item.link}
                          className="shopping-product-card"
                          onClick={() => handleOpenExternalLink(item.link)}
                          onKeyDown={(event) =>
                            handleCardKeyDown(event, () =>
                              handleOpenExternalLink(item.link)
                            )
                          }
                          role="button"
                          tabIndex={0}
                        >
                          {item.imageUrl && (
                            <div className="shopping-product-thumbnail">
                              <img src={item.imageUrl} alt="" loading="lazy" />
                            </div>
                          )}
                          <div className="shopping-product-text">
                            <span className="shopping-product-badge">
                              {item.mallName || '쇼핑'}
                            </span>
                            <h4>{cleanText(item.title)}</h4>
                            <p>{formatPrice(item.price)}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  <div className="shopping-benefit-strip">
                    <strong>오늘의 선택</strong>
                    <span>
                      테마 버튼을 누르면 실제 네이버 쇼핑 결과를 다시 불러옵니다.
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="content-card webtoon-section-card">
              <div className="section-header">
                <div className="section-title-row">
                  <span className="section-tab-label is-active">
                    {activeContentCategoryInfo.label}
                  </span>
                  <span className="section-tab-label">
                    {activeContentCategoryInfo.type === 'webtoon'
                      ? '네이버 웹툰'
                      : '이미지 검색'}
                  </span>
                  <span className="section-tab-label">실제 데이터</span>
                </div>

                <button
                  type="button"
                  className="header-text-button"
                  onClick={handleContentHomeClick}
                >
                  {activeContentCategoryInfo.type === 'webtoon'
                    ? '웹툰홈'
                    : '더 보기'}{' '}
                  &gt;
                </button>
              </div>

              <div className="content-category-tabs">
                {contentCategories.map((category) => (
                  <button
                    key={category.label}
                    type="button"
                    disabled={mainLoading || contentLoading}
                    className={
                      activeContentCategory === category.label ? 'is-active' : ''
                    }
                    onClick={() => void handleContentCategoryClick(category)}
                  >
                    {category.label}
                  </button>
                ))}
              </div>

              {activeContentCategory === '웹툰' ? (
                <>
                  <div className="webtoon-theme-bar">
                    {webtoonWeeks.map((week) => (
                      <button
                        key={week.value}
                        type="button"
                        disabled={mainLoading || webtoonLoading}
                        className={
                          activeWebtoonWeek === week.value ? 'is-active' : ''
                        }
                        onClick={() => void handleWebtoonWeekClick(week.value)}
                      >
                        {week.label}
                      </button>
                    ))}
                  </div>

                  {mainLoading || webtoonLoading ? (
                    <p className="empty-message">
                      웹툰 콘텐츠를 불러오는 중입니다.
                    </p>
                  ) : getMainSectionError(mainErrors.webtoon) ? (
                    <p className="empty-message">
                      {getMainSectionError(mainErrors.webtoon)}
                    </p>
                  ) : mainData.webtoonItems.length === 0 ? (
                    <p className="empty-message">표시할 웹툰 콘텐츠가 없습니다.</p>
                  ) : (
                    <div className="webtoon-grid">
                      {mainData.webtoonItems.map((item) => (
                        <article
                          key={`${item.link}-${item.imageUrl}`}
                          className="webtoon-card"
                          onClick={() => handleOpenExternalLink(item.link)}
                          onKeyDown={(event) =>
                            handleCardKeyDown(event, () =>
                              handleOpenExternalLink(item.link)
                            )
                          }
                          role="button"
                          tabIndex={0}
                        >
                          {item.imageUrl && (
                            <div className="webtoon-thumbnail">
                              <img src={item.imageUrl} alt="" loading="lazy" />
                            </div>
                          )}
                          <h4>{cleanText(item.title)}</h4>
                        </article>
                      ))}
                    </div>
                  )}
                </>
              ) : contentLoading ? (
                <p className="empty-message">콘텐츠를 불러오는 중입니다.</p>
              ) : getMainSectionError(mainErrors.content) ? (
                <p className="empty-message">
                  {getMainSectionError(mainErrors.content)}
                </p>
              ) : contentItems.length === 0 ? (
                <p className="empty-message">표시할 콘텐츠가 없습니다.</p>
              ) : (
                <div className="content-image-grid">
                  {contentItems.map((item) => (
                    <article
                      key={`${item.link}-${item.thumbnail}`}
                      className="content-image-card"
                      onClick={() => handleOpenExternalLink(item.link)}
                      onKeyDown={(event) =>
                        handleCardKeyDown(event, () =>
                          handleOpenExternalLink(item.link)
                        )
                      }
                      role="button"
                      tabIndex={0}
                    >
                      <div className="content-image-thumbnail">
                        <img src={item.thumbnail} alt="" loading="lazy" />
                      </div>
                      <h4>{cleanText(item.title)}</h4>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="content-card community-data-card">
              <div className="section-header">
                <div>
                  <p className="section-eyebrow">COMMUNITY DATA</p>
                  <h3>우리 커뮤니티 데이터</h3>
                </div>
                <button
                  type="button"
                  className="header-text-button"
                  onClick={() => navigate('/posts')}
                >
                  게시글 보기
                </button>
              </div>

              {mainLoading ? (
                <p className="empty-message">커뮤니티 데이터를 불러오는 중입니다.</p>
              ) : getMainSectionError('') ? (
                <p className="empty-message">{getMainSectionError('')}</p>
              ) : communityKeywords.length === 0 ? (
                <p className="empty-message">
                  게시글 데이터가 쌓이면 자주 등장하는 키워드가 표시됩니다.
                </p>
              ) : (
                <div className="community-keyword-list">
                  {communityKeywords.map((keyword) => (
                    <button
                      key={keyword}
                      type="button"
                      onClick={() => handleSearchKeyword(keyword)}
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
              )}
            </section>

          </section>

          <aside className="portal-right-column">
            <section className="side-card login-card">
              {loginUser ? (
                <>
                  <p className="side-card-label">
                    {loginUser.nickname || loginUser.username}님, 환영합니다.
                  </p>
                  <button
                    className="login-main-button"
                    type="button"
                    onClick={handleMyPageClick}
                  >
                    마이페이지
                  </button>
                  <div className="login-sub-links">
                    <button type="button" onClick={handleMyPageClick}>
                      회원정보
                    </button>
                    <button type="button" onClick={() => navigate('/blog')}>
                      블로그
                    </button>
                    <button type="button" onClick={handleLogout}>
                      로그아웃
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="side-card-label">
                    로그인하면 Todo와 내 활동 정보를 확인할 수 있습니다.
                  </p>
                  <button
                    className="login-main-button"
                    type="button"
                    onClick={() => navigate('/login')}
                  >
                    Between Jobs 로그인
                  </button>
                  <div className="login-sub-links">
                    <button type="button" onClick={() => navigate('/signup')}>
                      회원가입
                    </button>
                  </div>
                </>
              )}
            </section>

            <section className="side-card mini-widget-card">
              <div className="side-card-header">
                <h3>오늘의 Todo</h3>
                <button
                  type="button"
                  className="header-text-button"
                  onClick={handleNavigateTodos}
                >
                  더보기
                </button>
              </div>

              {!loginUser ? (
                <p className="empty-message">
                  로그인하면 개인 Todo 목록을 확인할 수 있습니다.
                </p>
              ) : todoPreviewError ? (
                <p className="empty-message">{todoPreviewError}</p>
              ) : todoPreviewItems.length === 0 ? (
                <p className="empty-message">진행 중인 Todo가 없습니다.</p>
              ) : (
                <ul className="todo-preview-list">
                  {todoPreviewItems.map((todo) => (
                    <li key={todo.id}>
                      {todo.title}
                      {todo.dueDate ? ` (${todo.dueDate})` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="side-card weather-card">
              <div className="side-card-header">
                <h3>날씨</h3>
                <span className="weather-location">
                  {mainData.weather?.location ?? '위치 정보 없음'}
                </span>
              </div>

              {mainLoading ? (
                <p className="empty-message">날씨를 불러오는 중입니다.</p>
              ) : getMainSectionError(mainErrors.weather) ? (
                <p className="empty-message">
                  {getMainSectionError(mainErrors.weather)}
                </p>
              ) : !mainData.weather ? (
                <p className="empty-message">표시할 날씨 정보가 없습니다.</p>
              ) : (
                <>
                  <div className="weather-main">
                    <div className="weather-icon" aria-hidden="true">
                      {mainData.weather.weatherText}
                    </div>

                    <div className="weather-summary">
                      <strong>
                        {formatNumber(mainData.weather.temperature, 1)}°
                      </strong>
                      <p>{mainData.weather.weatherText}</p>
                      <span>
                        최고 {formatNumber(mainData.weather.highTemperature, 0)}° /
                        최저 {formatNumber(mainData.weather.lowTemperature, 0)}°
                      </span>
                    </div>
                  </div>

                  <div className="weather-meta">
                    <span>습도 {formatNumber(mainData.weather.humidity)}%</span>
                    <span>풍속 {formatNumber(mainData.weather.windSpeed, 1)}km/h</span>
                  </div>
                </>
              )}
            </section>

            <section className="side-card market-card">
              <div className="side-card-header">
                <h3>증시 · 환율</h3>
                <span className="weather-location">
                  {formatShortDate(mainData.exchangeRate?.date)}
                </span>
              </div>

              {mainLoading ? (
                <p className="empty-message">환율을 불러오는 중입니다.</p>
              ) : getMainSectionError(mainErrors.exchange) ? (
                <p className="empty-message">
                  {getMainSectionError(mainErrors.exchange)}
                </p>
              ) : !mainData.exchangeRate ? (
                <p className="empty-message">표시할 환율 정보가 없습니다.</p>
              ) : (
                <div className="exchange-widget">
                  <span>
                    {mainData.exchangeRate.baseCurrency} /{' '}
                    {mainData.exchangeRate.targetCurrency}
                  </span>
                  <strong>{formatNumber(mainData.exchangeRate.rate, 2)}</strong>
                  <p>Frankfurter 기준 최신 고시 환율입니다.</p>
                </div>
              )}

              {mainLoading ? null : getMainSectionError(mainErrors.market) ? (
                <p className="empty-message">
                  {getMainSectionError(mainErrors.market)}
                </p>
              ) : mainData.marketStocks.length > 0 ? (
                <div className="stock-list">
                  {mainData.marketStocks.map((stock) => (
                    <div key={stock.symbol} className="stock-item">
                      <div>
                        <strong>{stock.name}</strong>
                        <span>{stock.symbol}</span>
                      </div>
                      <div className="stock-price">
                        <strong>{formatNumber(stock.price)}</strong>
                        <span className={stock.change >= 0 ? 'is-up' : 'is-down'}>
                          {stock.change >= 0 ? '+' : ''}
                          {formatNumber(stock.change)} /{' '}
                          {stock.changePercent >= 0 ? '+' : ''}
                          {formatNumber(stock.changePercent, 2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-message">표시할 증시 정보가 없습니다.</p>
              )}
            </section>

            <section className="side-card widget-board-card">
              <div className="side-card-header">
                <h3>일정 보드</h3>
              </div>

              <div className="calendar-widget">
                <div className="calendar-widget-left">
                  <p className="calendar-widget-label">캘린더</p>

                  <div className="calendar-widget-date">
                    <strong>{currentDate}</strong>
                    <span>{currentDayLabel}</span>
                  </div>

                  <button
                    type="button"
                    className="calendar-login-link"
                    onClick={
                      loginUser
                        ? () => navigate('/todos')
                        : () => navigate('/login')
                    }
                  >
                    {loginUser ? 'Todo 보러가기' : '로그인하기'}
                  </button>
                </div>

                <div className="calendar-widget-right">
                  <div className="calendar-widget-month">{currentMonth}월</div>

                  <div className="calendar-week-header">
                    {weekDays.map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>

                  <div className="calendar-grid">
                    {calendarDates.map((index) => {
                      const dateNumber = index - calendarStartOffset + 1;
                      const isMuted = dateNumber <= 0 || dateNumber > lastDate;
                      const isToday = dateNumber === currentDate;

                      return (
                        <span
                          key={`calendar-${index}`}
                          className={[
                            'calendar-day',
                            isMuted ? 'is-muted' : '',
                            isToday ? 'is-today' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          {isMuted ? '' : dateNumber}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default MainPage;
