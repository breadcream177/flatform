import type { NaverSearchItem } from '../../api/searchApi';
import { cleanText } from './searchUtils';
import type { NaverResultType } from './searchTypes';

const NAVER_RESULT_LABELS: Record<NaverResultType, string> = {
  news: '뉴스',
  blog: '블로그',
  web: '웹문서',
};

interface NaverResultSectionProps {
  type: NaverResultType;
  total: number;
  results: NaverSearchItem[];
}

function getResultMeta(type: NaverResultType, item: NaverSearchItem) {
  if (type === 'news') {
    return item.pubDate || item.originallink || item.link;
  }

  if (type === 'blog') {
    return item.bloggername || item.postdate || item.link;
  }

  return item.link;
}

function NaverResultSection({ type, total, results }: NaverResultSectionProps) {
  const label = NAVER_RESULT_LABELS[type];

  return (
    <section className="search-result-section">
      <div className="search-section-title">
        <h2>{label}</h2>
        <span>총 {total.toLocaleString()}개</span>
      </div>

      {results.length === 0 ? (
        <p className="search-empty">{label} 검색 결과가 없습니다.</p>
      ) : (
        <div className="portal-result-list">
          {results.map((item) => (
            <article key={item.link} className="portal-result-item">
              <a href={item.link} target="_blank" rel="noreferrer">
                <h3>{cleanText(item.title)}</h3>
              </a>
              <p>{cleanText(item.description)}</p>
              <span>{getResultMeta(type, item)}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default NaverResultSection;

