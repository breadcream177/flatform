import { Link } from 'react-router-dom';
import type {
  AiEvidenceSource,
  AiRecommendedLink,
  AiReferenceSource,
} from '../../api/aiSearchApi';
import type { AiErrorType } from './searchTypes';

const SOURCE_TYPE_LABELS: Record<string, string> = {
  post: '게시글',
  news: '뉴스',
  blog: '블로그',
  web: '웹문서',
};

const AI_INTENT_LABELS: Record<string, string> = {
  GENERAL: '일반 검색',
  QUESTION: '질문형 검색',
  COMPARE: '비교 검색',
  RECOMMEND: '추천 검색',
  NEWS: '뉴스 검색',
  HOW_TO: '방법 검색',
};

interface SearchAiOverviewProps {
  aiLoading: boolean;
  aiSummary: string;
  aiIntent: string;
  aiErrorType: AiErrorType;
  aiErrorGuide: string;
  evidenceSources: AiEvidenceSource[];
  visibleRecommendedLinks: AiRecommendedLink[];
  visibleReferenceSources: AiReferenceSource[];
  hasMoreAiContent: boolean;
  hiddenAiContentCount: number;
  aiExpanded: boolean;
  aiQuestion: string;
  onToggleExpanded: () => void;
  onQuestionChange: (value: string) => void;
  onQuestionSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

function getSourceTitle(title: string) {
  return title || '제목 없음';
}

function renderSourceLink(source: { title: string; link: string }) {
  const title = getSourceTitle(source.title);

  if (source.link.startsWith('/')) {
    return <Link to={source.link}>{title}</Link>;
  }

  if (source.link) {
    return (
      <a href={source.link} target="_blank" rel="noreferrer">
        {title}
      </a>
    );
  }

  return <span>{title}</span>;
}

function getAiErrorTitle(errorType: AiErrorType) {
  if (errorType === 'quota') {
    return '요청 제한 안내';
  }

  if (errorType === 'backend') {
    return '서버 연결 안내';
  }

  return 'AI 요약 안내';
}

function getAiIntentLabel(intent: string) {
  return AI_INTENT_LABELS[intent] ?? intent;
}

function SearchAiOverview({
  aiLoading,
  aiSummary,
  aiIntent,
  aiErrorType,
  aiErrorGuide,
  evidenceSources,
  visibleRecommendedLinks,
  visibleReferenceSources,
  hasMoreAiContent,
  hiddenAiContentCount,
  aiExpanded,
  aiQuestion,
  onToggleExpanded,
  onQuestionChange,
  onQuestionSubmit,
}: SearchAiOverviewProps) {
  return (
    <section className="ai-overview-card">
      <div className="ai-overview-label">✦ AI 개요</div>

      {aiLoading ? (
        <p>Gemini AI가 검색 결과를 분석 중입니다...</p>
      ) : (
        <>
          {aiIntent && !aiErrorType && (
            <div className="ai-intent-badge">의도: {getAiIntentLabel(aiIntent)}</div>
          )}

          <div className="ai-summary-content">
            {aiSummary.split('\n').map((line, index) => (
              <p key={`${line}-${index}`}>{line}</p>
            ))}
          </div>

          {aiErrorGuide && (
            <div className={`ai-error-guide ${aiErrorType}`}>
              <strong>{getAiErrorTitle(aiErrorType)}</strong>
              <p>{aiErrorGuide}</p>
            </div>
          )}

          {evidenceSources.length > 0 && (
            <div className="ai-evidence-section">
              <h3>요약 근거</h3>

              <div className="ai-evidence-list">
                {evidenceSources.map((source, index) => (
                  <div className="ai-evidence-item" key={`${source.link}-${index}`}>
                    <div className="ai-evidence-title-row">
                      <span className="ai-reference-type">
                        {SOURCE_TYPE_LABELS[source.type] ?? source.type}
                      </span>
                      {renderSourceLink(source)}
                    </div>
                    <p>{source.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {visibleRecommendedLinks.length > 0 && (
            <div className="ai-recommended-section">
              <h3>추천 자료</h3>

              <div className="ai-recommended-list">
                {visibleRecommendedLinks.map((link, index) => (
                  <div className="ai-recommended-item" key={`${link.link}-${index}`}>
                    <span className="ai-reference-type">
                      {SOURCE_TYPE_LABELS[link.type] ?? link.type}
                    </span>
                    {renderSourceLink(link)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {visibleReferenceSources.length > 0 && (
            <div className="ai-reference-section">
              <h3>AI 분석에 제공된 자료</h3>

              <ul className="ai-reference-list">
                {visibleReferenceSources.map((source, index) => (
                  <li key={`${source.link}-${index}`}>
                    <span className="ai-reference-type">
                      {SOURCE_TYPE_LABELS[source.type] ?? source.type}
                    </span>
                    {renderSourceLink(source)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasMoreAiContent && (
            <div className="ai-more-control">
              {!aiExpanded && (
                <p>추천 자료와 AI 참고 자료 {hiddenAiContentCount}개를 더 볼 수 있습니다.</p>
              )}
              <button type="button" className="ai-more-button" onClick={onToggleExpanded}>
                {aiExpanded ? '간단히 보기' : '더보기'}
              </button>
            </div>
          )}

          <form className="ai-question-form" onSubmit={onQuestionSubmit}>
            <input
              type="text"
              value={aiQuestion}
              onChange={(event) => onQuestionChange(event.target.value)}
              placeholder="무엇이든 추가로 물어보세요"
            />
            <button type="submit">질문</button>
          </form>
        </>
      )}
    </section>
  );
}

export default SearchAiOverview;
