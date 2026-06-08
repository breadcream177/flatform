import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  requestAiSearchSummary,
  type AiEvidenceSource,
  type AiRecommendedLink,
  type AiReferenceSource,
} from '../../api/aiSearchApi';
import {
  searchBlog,
  searchNews,
  searchPosts,
  searchWeb,
  type NaverSearchItem,
  type PostSearchItem,
} from '../../api/searchApi';
import { getCachedAiSummary, setCachedAiSummary } from './aiSummaryCache';
import NaverResultSection from './NaverResultSection';
import PostResultSection from './PostResultSection';
import { buildAiSearchSources } from './searchAiSources';
import SearchAiOverview from './SearchAiOverview';
import SearchControls from './SearchControls';
import SearchPagination from './SearchPagination';
import {
  getAiErrorGuide,
  getAiErrorMessage,
  getAiErrorType,
  getSearchErrorMessage,
} from './searchMessages';
import type { AiErrorType, SearchSort, SearchTab } from './searchTypes';
import { createAiSummaryCacheKey, refineNaverResults } from './searchUtils';
import './SearchPage.css';

function SearchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const aiRequestKeyRef = useRef('');

  const keyword = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('keyword')?.trim() ?? '';
  }, [location.search]);

  const [activeTab, setActiveTab] = useState<SearchTab>('all');

  const [postResults, setPostResults] = useState<PostSearchItem[]>([]);
  const [newsResults, setNewsResults] = useState<NaverSearchItem[]>([]);
  const [blogResults, setBlogResults] = useState<NaverSearchItem[]>([]);
  const [webResults, setWebResults] = useState<NaverSearchItem[]>([]);

  const [newsTotal, setNewsTotal] = useState(0);
  const [blogTotal, setBlogTotal] = useState(0);
  const [webTotal, setWebTotal] = useState(0);
  const [resultKeyword, setResultKeyword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [aiSummary, setAiSummary] = useState('');
  const [aiErrorType, setAiErrorType] = useState<AiErrorType>('');
  const [aiIntent, setAiIntent] = useState('');
  const [referenceSources, setReferenceSources] = useState<AiReferenceSource[]>([]);
  const [recommendedLinks, setRecommendedLinks] = useState<AiRecommendedLink[]>([]);
  const [evidenceSources, setEvidenceSources] = useState<AiEvidenceSource[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExpanded, setAiExpanded] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');

  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SearchSort>('date');
  const display = 10;


  useEffect(() => {
    setPage(1);
  }, [keyword, activeTab, sort]);

  useEffect(() => {
    setAiExpanded(false);
    setAiQuestion('');
  }, [keyword]);

  useEffect(() => {
    let isActive = true;

    const loadSearchResults = async () => {
      if (!keyword) {
        setPostResults([]);
        setNewsResults([]);
        setBlogResults([]);
        setWebResults([]);
        setResultKeyword('');
        setAiSummary('');
        setAiErrorType('');
        setAiIntent('');
        setReferenceSources([]);
        setRecommendedLinks([]);
        setEvidenceSources([]);
        return;
      }

      try {
        setLoading(true);
        setError('');
        setResultKeyword('');
        setAiSummary('');
        setAiErrorType('');
        setAiIntent('');
        setReferenceSources([]);
        setRecommendedLinks([]);
        setEvidenceSources([]);

        const [posts, news, blog, web] = await Promise.all([
          searchPosts(keyword, sort),
          searchNews(keyword, page, display, sort),
          searchBlog(keyword, page, display, sort),
          searchWeb(keyword, page, display, sort),
        ]);

        if (!isActive) {
          return;
        }

        setPostResults(posts);
        setNewsResults(refineNaverResults(news.items, keyword));
        setBlogResults(refineNaverResults(blog.items, keyword));
        setWebResults(refineNaverResults(web.items, keyword));

        setNewsTotal(news.total);
        setBlogTotal(blog.total);
        setWebTotal(web.total);
        setResultKeyword(keyword);
      } catch (err) {
        if (!isActive) {
          return;
        }

        console.error(err);
        setError(getSearchErrorMessage(err));
        setResultKeyword('');
        setAiSummary('');
        setAiErrorType('');
        setAiIntent('');
        setReferenceSources([]);
        setRecommendedLinks([]);
        setEvidenceSources([]);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadSearchResults();

    return () => {
      isActive = false;
    };
  }, [keyword, page, sort]);

  useEffect(() => {
    let isActive = true;

    const generateAiSummary = async () => {
      if (!keyword) {
        setAiSummary('');
        setAiErrorType('');
        setAiIntent('');
        setReferenceSources([]);
        setRecommendedLinks([]);
        setEvidenceSources([]);
        return;
      }

      const sources = buildAiSearchSources({
        postResults,
        newsResults,
        blogResults,
        webResults,
      });

      if (sources.length === 0) {
        setAiSummary('');
        setAiErrorType('');
        setAiIntent('');
        setReferenceSources([]);
        setRecommendedLinks([]);
        setEvidenceSources([]);
        return;
      }

      if (loading || resultKeyword !== keyword) {
        return;
      }

      const cacheKey = createAiSummaryCacheKey(keyword, sources);
      const cachedResult = getCachedAiSummary(cacheKey);

      if (cachedResult) {
        setAiSummary(cachedResult.summary);
        setAiErrorType('');
        setAiIntent(cachedResult.intent);
        setReferenceSources(cachedResult.referenceSources ?? []);
        setRecommendedLinks(cachedResult.recommendedLinks ?? []);
        setEvidenceSources(cachedResult.evidenceSources ?? []);
        return;
      }

      if (aiRequestKeyRef.current === cacheKey) {
        return;
      }

      try {
        aiRequestKeyRef.current = cacheKey;
        setAiLoading(true);

        const aiResult = await requestAiSearchSummary({
          keyword,
          sources,
        });

        if (!isActive) {
          return;
        }

        setCachedAiSummary(cacheKey, aiResult);
        setAiSummary(aiResult.summary);
        setAiErrorType('');
        setAiIntent(aiResult.intent);
        setReferenceSources(aiResult.referenceSources ?? []);
        setRecommendedLinks(aiResult.recommendedLinks ?? []);
        setEvidenceSources(aiResult.evidenceSources ?? []);
      } catch (err) {
        if (!isActive) {
          return;
        }

        console.error(err);
        setAiSummary(getAiErrorMessage(err));
        setAiErrorType(getAiErrorType(err));
        setAiIntent('');
        setReferenceSources([]);
        setRecommendedLinks([]);
        setEvidenceSources([]);
      } finally {
        if (isActive) {
          setAiLoading(false);
        }

        if (aiRequestKeyRef.current === cacheKey) {
          aiRequestKeyRef.current = '';
        }
      }
    };

    generateAiSummary();

    return () => {
      isActive = false;
    };
  }, [keyword, loading, resultKeyword, postResults, newsResults, blogResults, webResults]);

  const showPost = activeTab === 'all' || activeTab === 'post';
  const showNews = activeTab === 'all' || activeTab === 'news';
  const showBlog = activeTab === 'all' || activeTab === 'blog';
  const showWeb = activeTab === 'all' || activeTab === 'web';

  const handleFollowUpSearch = (question: string) => {
    const nextKeyword = question.trim();

    if (!nextKeyword) {
      return;
    }

    setActiveTab('all');
    navigate(`/search?keyword=${encodeURIComponent(nextKeyword)}`);
  };

  const handleAiQuestionSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleFollowUpSearch(aiQuestion);
  };

  const pageNumbers = Array.from({ length: 10 }, (_, index) => index + 1);
  const visibleRecommendedLinks = aiExpanded
    ? recommendedLinks.slice(0, 4)
    : [];
  const visibleReferenceSources = aiExpanded
    ? referenceSources.slice(0, 6)
    : [];
  const hasMoreAiContent = recommendedLinks.length > 0 || referenceSources.length > 0;
  const hiddenAiContentCount = recommendedLinks.length + referenceSources.length;
  const visibleSearchResultCount =
    postResults.length + newsResults.length + blogResults.length + webResults.length;
  const isSearchResultSparse = visibleSearchResultCount > 0 && visibleSearchResultCount < 4;
  const aiErrorGuide = getAiErrorGuide(aiErrorType);

  return (
    <div className="search-page">
      <SearchControls
        activeTab={activeTab}
        sort={sort}
        onTabChange={setActiveTab}
        onSortChange={setSort}
      />

      {loading && <div className="search-status">검색 중...</div>}
      {!loading && !keyword && <div className="search-status">검색어를 입력해주세요.</div>}
      {!loading && error && <div className="search-status error">{error}</div>}

      {!loading && keyword && !error && (
        <div className="search-result-layout">
          {isSearchResultSparse && (
            <div className="search-quality-notice">
              검색 결과가 적어 AI 요약과 추천 자료의 정확도가 제한될 수 있습니다. 검색어를 더 구체적으로
              입력하거나 다른 표현으로 다시 검색해보세요.
            </div>
          )}

          {(aiLoading || aiSummary) && (
            <SearchAiOverview
              aiLoading={aiLoading}
              aiSummary={aiSummary}
              aiIntent={aiIntent}
              aiErrorType={aiErrorType}
              aiErrorGuide={aiErrorGuide}
              evidenceSources={evidenceSources}
              visibleRecommendedLinks={visibleRecommendedLinks}
              visibleReferenceSources={visibleReferenceSources}
              hasMoreAiContent={hasMoreAiContent}
              hiddenAiContentCount={hiddenAiContentCount}
              aiExpanded={aiExpanded}
              aiQuestion={aiQuestion}
              onToggleExpanded={() => setAiExpanded((prev) => !prev)}
              onQuestionChange={setAiQuestion}
              onQuestionSubmit={handleAiQuestionSubmit}
            />
          )}
          {showPost && (activeTab === 'post' || postResults.length > 0) && (
            <PostResultSection results={postResults} />
          )}

          {showNews && (
            <NaverResultSection type="news" total={newsTotal} results={newsResults} />
          )}

          {showBlog && (
            <NaverResultSection type="blog" total={blogTotal} results={blogResults} />
          )}

          {showWeb && (
            <NaverResultSection type="web" total={webTotal} results={webResults} />
          )}
          {activeTab !== 'post' && (
            <SearchPagination page={page} pageNumbers={pageNumbers} onPageChange={setPage} />
          )}
        </div>
      )}
    </div>
  );
}

export default SearchPage;
