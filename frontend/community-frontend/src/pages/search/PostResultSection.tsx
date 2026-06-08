import { Link } from 'react-router-dom';
import type { PostSearchItem } from '../../api/searchApi';
import { cleanText } from './searchUtils';

interface PostResultSectionProps {
  results: PostSearchItem[];
}

function PostResultSection({ results }: PostResultSectionProps) {
  return (
    <section className="search-result-section">
      <div className="search-section-title">
        <h2>게시글</h2>
        <span>총 {results.length.toLocaleString()}개</span>
      </div>

      {results.length === 0 ? (
        <p className="search-empty">게시글 검색 결과가 없습니다.</p>
      ) : (
        <div className="portal-result-list">
          {results.map((item) => (
            <article key={item.id} className="portal-result-item">
              <Link to={`/posts/${item.id}`}>
                <h3>{cleanText(item.title)}</h3>
              </Link>
              <p>{cleanText(item.content)}</p>
              <span>
                {item.nickname || item.username || '작성자'} · {item.createdAt || ''}
              </span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default PostResultSection;

