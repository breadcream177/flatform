import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchCareerPortal,
  type CareerPortalParams,
  type CareerPortalResponse,
  type JobPosting,
} from '../../api/careerApi';
import {
  fetchMainNews,
  fetchMainShopping,
  fetchMainSummary,
  type MainExchangeRatePreview,
  type MainMarketStockPreview,
  type MainNewsPreview,
  type MainShoppingPreview,
  type MainWeatherPreview,
} from '../../api/mainApi';
import { getTodosByUserId, type TodoItem } from '../../api/todoApi';
import './MainPage.css';

interface LoginUser {
  userId: number;
  username: string;
  nickname: string;
  role: string;
}

interface MainSideData {
  weather: MainWeatherPreview | null;
  exchangeRate: MainExchangeRatePreview | null;
  marketStocks: MainMarketStockPreview[];
}

interface ProductTab {
  label: string;
  keyword: string;
  description: string;
  chips: string[];
}

interface JobFilterForm {
  keyword: string;
  region: string;
  minSalary: string;
  maxSalary: string;
}

const emptySideData: MainSideData = {
  weather: null,
  exchangeRate: null,
  marketStocks: [],
};

const emptyCareerPortal: CareerPortalResponse = {
  jobPostings: [],
  certificationSites: [],
  careerRecordCards: [],
  jobError: null,
  certificationNotice: null,
  sourceStatus: '',
};

const productTabs: ProductTab[] = [
  {
    label: '취업 준비',
    keyword: '이력서 세트 자기소개서 포트폴리오 파일',
    description: '이력서, 자기소개서, 포트폴리오 정리에 필요한 준비물입니다.',
    chips: ['이력서 세트', '자기소개서 책', '포트폴리오 파일', '면접 준비물'],
  },
  {
    label: '면접 복장',
    keyword: '면접 정장 구두 셔츠 블라우스',
    description: '첫인상과 실용성을 같이 챙기기 위한 면접 복장 추천 결과입니다.',
    chips: ['남성 면접 정장', '여성 면접 정장', '면접 구두', '셔츠 블라우스'],
  },
  {
    label: '노트북',
    keyword: '개발자 노트북 코딩 노트북',
    description: '코딩 공부와 포트폴리오 작업에 맞춘 노트북과 주변 장비입니다.',
    chips: ['개발자 노트북', '가벼운 노트북', '노트북 가방', '모니터'],
  },
  {
    label: '책상 정리',
    keyword: '책상 정리 데스크테리어 케이블 정리',
    description: '공부 루틴과 집중력을 위한 작업 공간 정리 아이템입니다.',
    chips: ['모니터 받침대', '케이블 정리', '노트북 거치대', '책상 정리함'],
  },
  {
    label: '자격증 교재',
    keyword: '정보처리기사 컴활 ITQ 자격증 교재',
    description: '취업 준비에 자주 쓰이는 자격증 교재와 문제집입니다.',
    chips: ['정보처리기사', '컴퓨터활용능력', 'ITQ', 'SQLD'],
  },
  {
    label: '출근 신발',
    keyword: '면접 구두 출근 신발 로퍼',
    description: '면접과 첫 출근에 무난하게 쓰기 좋은 신발 추천 결과입니다.',
    chips: ['면접 구두', '출근 로퍼', '정장 신발', '편한 구두'],
  },
];

const newsTopics = ['취업 실무', '청년 일자리', 'IT 신입 개발자', '직무 역량', '채용 트렌드'];

const careerServiceLinks = [
  { label: '사람인', url: 'https://www.saramin.co.kr' },
  { label: '잡코리아', url: 'https://www.jobkorea.co.kr' },
  { label: '워크넷', url: 'https://www.work.go.kr' },
  { label: '알바천국', url: 'https://www.alba.co.kr' },
  { label: 'Q-Net', url: 'https://www.q-net.or.kr' },
  { label: '대한상공회의소', url: 'https://license.korcham.net' },
];

const initialJobFilter: JobFilterForm = {
  keyword: 'IT 신입 개발자',
  region: '',
  minSalary: '',
  maxSalary: '',
};

function cleanText(text?: string | null) {
  return (text ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function formatDate(value?: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatNumber(value?: number | null, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-';
  }

  return value.toLocaleString('ko-KR', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function formatPrice(value: number | null) {
  if (value === null) {
    return '가격 정보 확인 필요';
  }

  return `${formatNumber(value)}원`;
}

function formatSigned(value: number) {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${formatNumber(value, 2)}`;
}

function stockChangeClass(stock: MainMarketStockPreview) {
  if (stock.change > 0) return 'up';
  if (stock.change < 0) return 'down';
  return '';
}

function getCurrentUser(): LoginUser | null {
  const rawUser = localStorage.getItem('loginUser') || localStorage.getItem('user');

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as LoginUser;
  } catch {
    return null;
  }
}

function toCareerParams(form: JobFilterForm): CareerPortalParams {
  return {
    keyword: form.keyword,
    region: form.region,
    minSalary: form.minSalary,
    maxSalary: form.maxSalary,
  };
}

function MainPage() {
  const navigate = useNavigate();

  const [loginUser, setLoginUser] = useState<LoginUser | null>(() => getCurrentUser());
  const [newsTopic, setNewsTopic] = useState(newsTopics[2]);
  const [careerNews, setCareerNews] = useState<MainNewsPreview[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState('');

  const [activeProductTab, setActiveProductTab] = useState(productTabs[0]);
  const [shoppingItems, setShoppingItems] = useState<MainShoppingPreview[]>([]);
  const [shoppingLoading, setShoppingLoading] = useState(false);
  const [shoppingError, setShoppingError] = useState('');

  const [sideData, setSideData] = useState<MainSideData>(emptySideData);
  const [mainError, setMainError] = useState('');

  const [careerPortal, setCareerPortal] = useState<CareerPortalResponse>(emptyCareerPortal);
  const [jobFilter, setJobFilter] = useState<JobFilterForm>(initialJobFilter);
  const [jobLoading, setJobLoading] = useState(false);

  const [todos, setTodos] = useState<TodoItem[]>([]);

  const displayName = useMemo(() => {
    if (!loginUser) {
      return '';
    }

    return loginUser.nickname || loginUser.username;
  }, [loginUser]);

  const loadMainSummary = useCallback(async () => {
    try {
      setMainError('');
      const summary = await fetchMainSummary();
      setSideData({
        weather: summary.weather,
        exchangeRate: summary.exchangeRate,
        marketStocks: summary.marketStocks,
      });

      if (summary.news.length > 0) {
        setCareerNews(summary.news);
      }

      if (summary.shoppingItems.length > 0) {
        setShoppingItems(summary.shoppingItems);
      }
    } catch (error) {
      console.error(error);
      setMainError(error instanceof Error ? error.message : '메인 정보를 불러오지 못했습니다.');
    }
  }, []);

  const loadCareerNews = useCallback(async (keyword: string) => {
    try {
      setNewsLoading(true);
      setNewsError('');
      const news = await fetchMainNews(keyword);
      setCareerNews(news);
    } catch (error) {
      console.error(error);
      setNewsError(error instanceof Error ? error.message : '뉴스 정보를 불러오지 못했습니다.');
      setCareerNews([]);
    } finally {
      setNewsLoading(false);
    }
  }, []);

  const loadShoppingItems = useCallback(async (tab: ProductTab) => {
    try {
      setShoppingLoading(true);
      setShoppingError('');
      const items = await fetchMainShopping(tab.keyword);
      setShoppingItems(items);
    } catch (error) {
      console.error(error);
      setShoppingError(error instanceof Error ? error.message : '쇼핑 정보를 불러오지 못했습니다.');
      setShoppingItems([]);
    } finally {
      setShoppingLoading(false);
    }
  }, []);

  const loadCareerPortal = useCallback(async (params: CareerPortalParams) => {
    try {
      setJobLoading(true);
      const data = await fetchCareerPortal(params);
      setCareerPortal(data);
    } catch (error) {
      console.error(error);
      setCareerPortal({
        ...emptyCareerPortal,
        jobError: error instanceof Error ? error.message : '커리어 정보를 불러오지 못했습니다.',
        sourceStatus: 'CAREER_ERROR',
      });
    } finally {
      setJobLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMainSummary();
    loadCareerPortal(toCareerParams(initialJobFilter));
  }, [loadCareerPortal, loadMainSummary]);

  useEffect(() => {
    loadCareerNews(newsTopic);
  }, [loadCareerNews, newsTopic]);

  useEffect(() => {
    loadShoppingItems(activeProductTab);
  }, [activeProductTab, loadShoppingItems]);

  useEffect(() => {
    if (!loginUser?.userId) {
      setTodos([]);
      return;
    }

    getTodosByUserId(loginUser.userId)
      .then((items) => setTodos(items.slice(0, 3)))
      .catch((error) => {
        console.error(error);
        setTodos([]);
      });
  }, [loginUser]);

  const openExternal = (url: string) => {
    if (!url) {
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleProductTabClick = (tab: ProductTab) => {
    setActiveProductTab(tab);
  };

  const handleJobFormChange = (key: keyof JobFilterForm, value: string) => {
    setJobFilter((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleJobSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loadCareerPortal(toCareerParams(jobFilter));
  };

  const handleLogout = () => {
    localStorage.removeItem('loginUser');
    localStorage.removeItem('user');
    setLoginUser(null);
    navigate('/');
  };

  const renderNewsCard = (item: MainNewsPreview) => (
    <article key={`${item.link}-${item.title}`} className="career-news-card">
      {item.imageUrl ? (
        <button type="button" className="news-thumb" onClick={() => openExternal(item.originallink || item.link)}>
          <img src={item.imageUrl} alt="" />
        </button>
      ) : (
        <button type="button" className="news-thumb empty" onClick={() => openExternal(item.originallink || item.link)}>
          NEWS
        </button>
      )}

      <div>
        <span className="content-source">뉴스</span>
        <button type="button" className="content-title-button" onClick={() => openExternal(item.originallink || item.link)}>
          {cleanText(item.title)}
        </button>
        <p>{cleanText(item.description)}</p>
        <time>{formatDate(item.pubDate)}</time>
      </div>
    </article>
  );

  const renderProductCard = (item: MainShoppingPreview) => (
    <article key={`${item.link}-${item.title}`} className="product-card">
      <button type="button" className="product-image" onClick={() => openExternal(item.link)}>
        {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <span>이미지 없음</span>}
      </button>
      <span>{cleanText(item.mallName)}</span>
      <button type="button" onClick={() => openExternal(item.link)}>
        {cleanText(item.title)}
      </button>
      <strong>{formatPrice(item.price)}</strong>
    </article>
  );

  const renderJobCard = (job: JobPosting) => (
    <article key={`${job.originalUrl}-${job.title}`} className="job-card">
      <div>
        <span>{job.sourceName}</span>
        <button type="button" onClick={() => openExternal(job.originalUrl)}>
          {cleanText(job.title)}
        </button>
        <p>{cleanText(job.company)}</p>
      </div>
      <dl>
        <div>
          <dt>지역</dt>
          <dd>{job.region || '확인 필요'}</dd>
        </div>
        <div>
          <dt>연봉</dt>
          <dd>{job.salary || '공고 확인'}</dd>
        </div>
        <div>
          <dt>마감</dt>
          <dd>{job.closeDate || '공고 확인'}</dd>
        </div>
      </dl>
    </article>
  );

  return (
    <div className="career-main-page">
      <main className="career-main-inner">
        <div className="career-main-content">
          <section className="career-hero-card">
            <span>BETWEEN JOBS</span>
            <h1>취업 준비, 검색, 기록을 한 화면에서 이어가는 커리어 포털</h1>
            <p>
              취업 뉴스, IT 채용 공고, 자격증 일정, 면접 준비용 상품, 이력서 기록을 실제 데이터와
              공식 링크 중심으로 확인합니다.
            </p>
            <div className="hero-actions">
              <button type="button" onClick={() => navigate('/search?keyword=IT 신입 개발자')}>
                통합 검색 시작
              </button>
              <button type="button" onClick={() => navigate('/posts')}>
                게시글 보기
              </button>
            </div>
          </section>

          <section className="portal-section news-section">
            <div className="section-heading">
              <div>
                <span>CAREER NEWS</span>
                <h2>취업 뉴스 브리핑</h2>
              </div>
              <button type="button" onClick={() => navigate(`/search?keyword=${encodeURIComponent(newsTopic)}`)}>
                더 검색하기
              </button>
            </div>

            <div className="topic-tabs">
              {newsTopics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  className={newsTopic === topic ? 'active' : ''}
                  onClick={() => setNewsTopic(topic)}
                >
                  {topic}
                </button>
              ))}
            </div>

            {newsLoading && <p className="state-message">뉴스 정보를 불러오는 중입니다.</p>}
            {!newsLoading && newsError && <p className="state-message error">{newsError}</p>}
            {!newsLoading && !newsError && careerNews.length === 0 && (
              <p className="state-message">표시할 뉴스가 없습니다. 네이버 API 키와 백엔드 상태를 확인해주세요.</p>
            )}

            {!newsLoading && careerNews.length > 0 && (
              <div className="career-news-grid">
                {careerNews.slice(0, 6).map(renderNewsCard)}
              </div>
            )}
          </section>

          <section className="portal-section product-section">
            <div className="section-heading">
              <div>
                <span>JOB PREP SHOPPING</span>
                <h2>취업 준비 체크리스트</h2>
              </div>
              <strong>{shoppingItems.length}</strong>
            </div>

            <div className="product-filter-panel">
              <div className="mall-links">
                {['쿠팡', 'G마켓', '옥션', '11번가', '올리브영', 'SSG닷컴', '하프클럽', '이마트몰'].map((mall) => (
                  <button key={mall} type="button" onClick={() => navigate(`/search?keyword=${encodeURIComponent(mall)}`)}>
                    {mall}
                  </button>
                ))}
              </div>

              <div className="product-tabs">
                {productTabs.map((tab) => (
                  <button
                    key={tab.label}
                    type="button"
                    className={activeProductTab.label === tab.label ? 'active' : ''}
                    onClick={() => handleProductTabClick(tab)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="section-guide">{activeProductTab.description}</p>

            <div className="chip-row">
              {activeProductTab.chips.map((chip) => (
                <button key={chip} type="button" onClick={() => navigate(`/search?keyword=${encodeURIComponent(chip)}`)}>
                  {chip}
                </button>
              ))}
            </div>

            {shoppingLoading && <p className="state-message">쇼핑 정보를 불러오는 중입니다.</p>}
            {!shoppingLoading && shoppingError && <p className="state-message error">{shoppingError}</p>}
            {!shoppingLoading && !shoppingError && shoppingItems.length === 0 && (
              <p className="state-message">표시할 상품이 없습니다. 네이버 쇼핑 API 키와 백엔드 상태를 확인해주세요.</p>
            )}

            {!shoppingLoading && shoppingItems.length > 0 && (
              <div className="product-grid">
                {shoppingItems.slice(0, 8).map(renderProductCard)}
              </div>
            )}
          </section>

          <section className="portal-section job-section">
            <div className="section-heading">
              <div>
                <span>IT JOBS</span>
                <h2>IT 채용 공고</h2>
              </div>
              <button type="button" onClick={() => openExternal('https://www.work.go.kr')}>
                워크넷 바로가기
              </button>
            </div>

            <form className="job-filter-form" onSubmit={handleJobSearch}>
              <label>
                키워드
                <input
                  value={jobFilter.keyword}
                  onChange={(event) => handleJobFormChange('keyword', event.target.value)}
                  placeholder="IT 신입 개발자"
                />
              </label>
              <label>
                지역
                <input
                  value={jobFilter.region}
                  onChange={(event) => handleJobFormChange('region', event.target.value)}
                  placeholder="서울, 경기 등"
                />
              </label>
              <label>
                최소 연봉
                <input
                  value={jobFilter.minSalary}
                  onChange={(event) => handleJobFormChange('minSalary', event.target.value)}
                  inputMode="numeric"
                  placeholder="3000"
                />
              </label>
              <label>
                최대 연봉
                <input
                  value={jobFilter.maxSalary}
                  onChange={(event) => handleJobFormChange('maxSalary', event.target.value)}
                  inputMode="numeric"
                  placeholder="5000"
                />
              </label>
              <button type="submit">공고 필터링</button>
            </form>

            {jobLoading && <p className="state-message">채용 공고를 불러오는 중입니다.</p>}
            {!jobLoading && careerPortal.jobError && <p className="state-message error">{careerPortal.jobError}</p>}
            {!jobLoading && !careerPortal.jobError && careerPortal.jobPostings.length === 0 && (
              <p className="state-message">조건에 맞는 채용 공고가 없습니다.</p>
            )}

            {!jobLoading && careerPortal.jobPostings.length > 0 && (
              <div className="job-grid">
                {careerPortal.jobPostings.map(renderJobCard)}
              </div>
            )}
          </section>

          <section className="portal-section certification-section">
            <div className="section-heading">
              <div>
                <span>CERTIFICATION</span>
                <h2>자격증 일정 허브</h2>
              </div>
            </div>
            {careerPortal.certificationNotice && (
              <p className="section-guide">{careerPortal.certificationNotice}</p>
            )}
            <div className="certification-grid">
              {careerPortal.certificationSites.map((site) => (
                <article key={site.name} className="cert-card">
                  <span>{site.organization}</span>
                  <h3>{site.name}</h3>
                  <p>{site.description}</p>
                  <div className="chip-row">
                    {site.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <div className="cert-actions">
                    <button type="button" onClick={() => openExternal(site.scheduleUrl)}>
                      일정 보기
                    </button>
                    <button type="button" onClick={() => openExternal(site.applyUrl)}>
                      접수 페이지
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="portal-section record-section">
            <div className="section-heading">
              <div>
                <span>CAREER RECORD</span>
                <h2>이력서 · 자기소개서 · 포트폴리오 기록</h2>
              </div>
              <button type="button" onClick={() => navigate('/todos')}>
                기록하러 가기
              </button>
            </div>
            <div className="record-grid">
              {careerPortal.careerRecordCards.map((card) => (
                <article key={card.title} className="record-card">
                  <span>{card.tag}</span>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                  <button type="button" onClick={() => navigate(card.path)}>
                    열기
                  </button>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="career-sidebar">
          <section className="side-card login-card">
            {loginUser ? (
              <>
                <p>{displayName}님, 환영합니다.</p>
                <button type="button" className="primary-side-button" onClick={() => navigate('/mypage')}>
                  마이페이지
                </button>
                <div className="side-link-row">
                  <button type="button" onClick={() => navigate('/todos')}>
                    지원 일정
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
                <p>로그인하면 Todo와 내 활동 정보를 확인할 수 있습니다.</p>
                <button type="button" className="primary-side-button" onClick={() => navigate('/login')}>
                  Between Jobs 로그인
                </button>
                <div className="side-link-row">
                  <button type="button" onClick={() => navigate('/find-account')}>
                    아이디 찾기
                  </button>
                  <button type="button" onClick={() => navigate('/reset-password')}>
                    비밀번호 찾기
                  </button>
                  <button type="button" onClick={() => navigate('/signup')}>
                    회원가입
                  </button>
                </div>
              </>
            )}
          </section>

          <section className="side-card link-card">
            <div className="side-card-header">
              <h3>구직 사이트</h3>
              <span>공식 링크</span>
            </div>
            <div className="career-service-links">
              {careerServiceLinks.map((link) => (
                <button key={link.label} type="button" onClick={() => openExternal(link.url)}>
                  {link.label}
                </button>
              ))}
            </div>
          </section>

          <section className="side-card weather-card">
            <div className="side-card-header">
              <h3>날씨</h3>
              <span>{sideData.weather?.location || '순천'}</span>
            </div>
            {sideData.weather ? (
              <div className="weather-body">
                <strong>{formatNumber(sideData.weather.temperature, 1)}°</strong>
                <div>
                  <b>{sideData.weather.weatherText}</b>
                  <span>
                    최고 {formatNumber(sideData.weather.highTemperature, 1)}° / 최저{' '}
                    {formatNumber(sideData.weather.lowTemperature, 1)}°
                  </span>
                </div>
                <p>
                  습도 {formatNumber(sideData.weather.humidity)}% · 풍속{' '}
                  {formatNumber(sideData.weather.windSpeed, 1)}km/h
                </p>
              </div>
            ) : (
              <p className="state-message">{mainError || '날씨 정보를 확인 중입니다.'}</p>
            )}
          </section>

          <section className="side-card market-card">
            <div className="side-card-header">
              <h3>증시 · 환율</h3>
              <span>{sideData.exchangeRate?.date || '최신'}</span>
            </div>

            {sideData.exchangeRate ? (
              <div className="exchange-box">
                <span>USD / KRW</span>
                <strong>{formatNumber(sideData.exchangeRate.rate, 2)}</strong>
                <p>Frankfurter 기준 최신 고시 환율입니다.</p>
              </div>
            ) : (
              <p className="state-message">{mainError || '환율 정보를 확인 중입니다.'}</p>
            )}

            <div className="stock-list">
              {sideData.marketStocks.length === 0 ? (
                <p className="state-message">증시 정보를 확인 중입니다.</p>
              ) : (
                sideData.marketStocks.map((stock) => (
                  <div key={stock.symbol} className="stock-row">
                    <div>
                      <strong>{stock.name}</strong>
                      <span>{stock.symbol}</span>
                    </div>
                    <div className={stockChangeClass(stock)}>
                      <strong>{formatNumber(stock.price)}</strong>
                      <span>
                        {formatSigned(stock.change)} / {formatSigned(stock.changePercent)}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="side-card todo-card">
            <div className="side-card-header">
              <h3>오늘의 Todo</h3>
              <button type="button" onClick={() => navigate('/todos')}>
                더보기
              </button>
            </div>
            {loginUser ? (
              todos.length === 0 ? (
                <p className="state-message">아직 등록된 Todo가 없습니다.</p>
              ) : (
                <ul className="todo-preview-list">
                  {todos.map((todo) => (
                    <li key={todo.id}>{todo.title}</li>
                  ))}
                </ul>
              )
            ) : (
              <p className="state-message">로그인하면 개인 Todo를 확인할 수 있습니다.</p>
            )}
          </section>
        </aside>
      </main>
    </div>
  );
}

export default MainPage;
