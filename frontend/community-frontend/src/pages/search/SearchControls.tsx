import type { SearchSort, SearchTab } from './searchTypes';

interface SearchControlsProps {
  activeTab: SearchTab;
  sort: SearchSort;
  onTabChange: (tab: SearchTab) => void;
  onSortChange: (sort: SearchSort) => void;
}

function SearchControls({
  activeTab,
  sort,
  onTabChange,
  onSortChange,
}: SearchControlsProps) {
  return (
    <nav className="search-tabs">
      <div className="search-filter-bar">
        <span>정렬</span>

        <button
          type="button"
          className={sort === 'date' ? 'active' : ''}
          onClick={() => onSortChange('date')}
        >
          최신순
        </button>

        <button
          type="button"
          className={sort === 'sim' ? 'active' : ''}
          onClick={() => onSortChange('sim')}
        >
          관련도순
        </button>
      </div>

      <button className={activeTab === 'all' ? 'active' : ''} onClick={() => onTabChange('all')}>
        전체
      </button>
      <button className={activeTab === 'post' ? 'active' : ''} onClick={() => onTabChange('post')}>
        게시글
      </button>
      <button className={activeTab === 'news' ? 'active' : ''} onClick={() => onTabChange('news')}>
        뉴스
      </button>
      <button className={activeTab === 'blog' ? 'active' : ''} onClick={() => onTabChange('blog')}>
        블로그
      </button>
      <button className={activeTab === 'web' ? 'active' : ''} onClick={() => onTabChange('web')}>
        웹문서
      </button>
    </nav>
  );
}

export default SearchControls;

