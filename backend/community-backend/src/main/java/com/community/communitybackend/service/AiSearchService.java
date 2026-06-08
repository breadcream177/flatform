package com.community.communitybackend.service;

import com.community.communitybackend.dto.AiSearchSummaryRequestDto;
import com.community.communitybackend.dto.AiSearchSummaryResponseDto;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class AiSearchService {

    private static final int AI_CACHE_LIMIT = 50;

    private final Map<String, AiSearchSummaryResponseDto> summaryCache = new ConcurrentHashMap<>();
    private final GeminiClient geminiClient;
    private final AiSearchPolicy aiSearchPolicy;
    private final AiSearchSourceSelector sourceSelector;

    public AiSearchService(
            GeminiClient geminiClient,
            AiSearchPolicy aiSearchPolicy,
            AiSearchSourceSelector sourceSelector
    ) {
        this.geminiClient = geminiClient;
        this.aiSearchPolicy = aiSearchPolicy;
        this.sourceSelector = sourceSelector;
    }

    public AiSearchSummaryResponseDto createSearchSummary(AiSearchSummaryRequestDto request) {
        if (request == null || isBlank(request.getKeyword())) {
            throw new IllegalArgumentException("검색어가 올바르지 않습니다.");
        }

        long startedAt = System.nanoTime();
        String cacheKey = createSummaryCacheKey(request);
        SearchIntent intent = detectIntent(request);
        List<String> followUpQuestions = createFollowUpQuestions(request, intent);
        List<AiSearchSummaryResponseDto.ReferenceSourceDto> referenceSources = createReferenceSources(request);
        List<AiSearchSummaryResponseDto.RecommendedLinkDto> recommendedLinks = createRecommendedLinks(request);
        List<AiSearchSummaryResponseDto.EvidenceSourceDto> evidenceSources = createEvidenceSources(request);

        AiSearchSummaryResponseDto cachedResponse = summaryCache.get(cacheKey);
        if (cachedResponse != null) {
            logAiSearch(request, intent, "CACHE_HIT", startedAt);
            return cachedResponse;
        }

        String summary;

        if (aiSearchPolicy.isExplicitAdultQuery(request.getKeyword())) {
            summary = "이 검색어는 AI 요약을 제공하지 않습니다. 검색 결과 목록에서 필요한 정보를 직접 확인해주세요.";
            logAiSearch(request, intent, "RESTRICTED_QUERY", startedAt);
        } else {
            String prompt = buildPrompt(request, intent);
            summary = geminiClient.requestSummary(prompt);
        }

        AiSearchSummaryResponseDto response = new AiSearchSummaryResponseDto(
                summary,
                intent.name(),
                followUpQuestions,
                referenceSources,
                recommendedLinks,
                evidenceSources
        );

        if (aiSearchPolicy.isCacheableSummary(summary)) {
            putSummaryCache(cacheKey, response);
        }

        logAiSearch(request, intent, "CREATED", startedAt);

        return response;
    }

    private String createSummaryCacheKey(AiSearchSummaryRequestDto request) {
        StringBuilder keyBuilder = new StringBuilder(normalize(request.getKeyword()));

        for (AiSearchSummaryRequestDto.AiSearchSourceDto source : sourceSelector.getPromptSources(request)) {
            keyBuilder
                    .append("|")
                    .append(normalize(source.getType()))
                    .append(":")
                    .append(sourceSelector.createSourceKey(source));
        }

        return keyBuilder.toString();
    }

    private void putSummaryCache(String cacheKey, AiSearchSummaryResponseDto response) {
        if (summaryCache.size() >= AI_CACHE_LIMIT) {
            summaryCache.keySet().stream()
                    .findFirst()
                    .ifPresent(summaryCache::remove);
        }

        summaryCache.put(cacheKey, response);
    }

    private void logAiSearch(
            AiSearchSummaryRequestDto request,
            SearchIntent intent,
            String status,
            long startedAt
    ) {
        long elapsedMillis = (System.nanoTime() - startedAt) / 1_000_000;
        int sourceCount = request.getSources() == null ? 0 : request.getSources().size();

        System.out.println("[AI_SEARCH] status=" + status
                + ", intent=" + intent
                + ", keyword=" + request.getKeyword()
                + ", sources=" + sourceCount
                + ", elapsedMs=" + elapsedMillis);
    }

    private String buildPrompt(AiSearchSummaryRequestDto request, SearchIntent intent) {
        return switch (intent) {
            case NEWS -> buildNewsPrompt(request);
            case COMPARE -> buildComparePrompt(request);
            case RECOMMEND -> buildRecommendPrompt(request);
            case HOW_TO -> buildHowToPrompt(request);
            case QUESTION -> buildQuestionPrompt(request);
            case GENERAL -> buildGeneralPrompt(request);
        };
    }

    private String buildGeneralPrompt(AiSearchSummaryRequestDto request) {
        StringBuilder sb = new StringBuilder();

        appendBaseRole(sb);
        sb.append("사용자의 검색어를 일반 정보 탐색 의도로 보고 간결하게 요약해라.\n");
        sb.append("검색 결과들이 공통적으로 말하는 흐름과 주의할 점을 정리해라.\n\n");

        appendCommonRules(sb);
        appendOutputFormat(sb);
        appendKeyword(sb, request);
        appendSourceGuide(sb);
        appendSources(sb, request);

        return sb.toString();
    }

    private String buildQuestionPrompt(AiSearchSummaryRequestDto request) {
        StringBuilder sb = new StringBuilder();

        appendBaseRole(sb);
        sb.append("사용자의 검색어는 질문 의도에 가깝다.\n");
        sb.append("검색 결과 기준 답을 먼저 짧게 제시해라.\n");
        sb.append("답이 부족하면 부족하다고 한 문장으로 말해라.\n\n");

        appendCommonRules(sb);
        appendOutputFormat(sb);
        appendKeyword(sb, request);
        appendSourceGuide(sb);
        appendSources(sb, request);

        return sb.toString();
    }

    private String buildComparePrompt(AiSearchSummaryRequestDto request) {
        StringBuilder sb = new StringBuilder();

        appendBaseRole(sb);
        sb.append("사용자의 검색어는 비교 의도에 가깝다.\n");
        sb.append("비교 대상의 핵심 차이와 선택 기준만 짧게 정리해라.\n");
        sb.append("한쪽 정보가 부족하면 균형이 부족하다고 말해라.\n\n");

        appendCommonRules(sb);
        appendOutputFormat(sb);
        appendKeyword(sb, request);
        appendSourceGuide(sb);
        appendSources(sb, request);

        return sb.toString();
    }

    private String buildRecommendPrompt(AiSearchSummaryRequestDto request) {
        StringBuilder sb = new StringBuilder();

        appendBaseRole(sb);
        sb.append("사용자의 검색어는 추천 또는 선택 의도에 가깝다.\n");
        sb.append("검색 결과 기준 추천 방향과 주의점만 짧게 정리해라.\n");
        sb.append("광고처럼 단정하지 말고 추천 근거가 부족하면 부족하다고 말해라.\n\n");

        appendCommonRules(sb);
        appendOutputFormat(sb);
        appendKeyword(sb, request);
        appendSourceGuide(sb);
        appendSources(sb, request);

        return sb.toString();
    }

    private String buildNewsPrompt(AiSearchSummaryRequestDto request) {
        StringBuilder sb = new StringBuilder();

        appendBaseRole(sb);
        sb.append("사용자의 검색어는 뉴스, 이슈, 최신 동향 확인 의도에 가깝다.\n");
        sb.append("현재 이슈와 핵심 쟁점만 짧게 정리해라.\n");
        sb.append("날짜나 최신성이 불명확하면 최신 사실처럼 단정하지 마라.\n\n");

        appendCommonRules(sb);
        appendOutputFormat(sb);
        appendKeyword(sb, request);
        appendSourceGuide(sb);
        appendSources(sb, request);

        return sb.toString();
    }

    private String buildHowToPrompt(AiSearchSummaryRequestDto request) {
        StringBuilder sb = new StringBuilder();

        appendBaseRole(sb);
        sb.append("사용자의 검색어는 방법, 해결, 절차 안내 의도에 가깝다.\n");
        sb.append("실행 순서와 확인할 점을 짧게 정리해라.\n");
        sb.append("검색 결과만으로 해결 절차가 부족하면 추측하지 말고 부족하다고 말해라.\n\n");

        appendCommonRules(sb);
        appendOutputFormat(sb);
        appendKeyword(sb, request);
        appendSourceGuide(sb);
        appendSources(sb, request);

        return sb.toString();
    }

    private void appendBaseRole(StringBuilder sb) {
        sb.append("너는 포털 사이트의 검색 AI 개요 작성자다.\n");
        sb.append("사용자가 검색한 키워드와 검색 결과 목록을 바탕으로 한국어로 간결하게 답해라.\n\n");
    }

    private void appendCommonRules(StringBuilder sb) {
        sb.append("[중요 규칙]\n");
        sb.append("- 반드시 제공된 검색 결과를 근거로만 요약해라.\n");
        sb.append("- 검색 결과에 없는 사실은 단정하지 마라.\n");
        sb.append("- 확실하지 않은 내용은 '검색 결과 기준으로는', '확인이 필요합니다'처럼 표현해라.\n");
        sb.append("- 제목만 보고 내용을 과장하지 마라.\n");
        sb.append("- 서로 다른 검색 결과가 충돌하면 단정하지 말고 관점 차이로 정리해라.\n");
        sb.append("- 링크 목록은 별도 UI에서 제공되므로 본문에 URL을 쓰지 마라.\n");
        sb.append("- markdown 문법을 쓰지 마라. 별표, 굵게 표시, 제목 마크다운을 쓰지 마라.\n");
        sb.append("- 전체 답변은 7줄 이내로 작성해라.\n");
        sb.append("- 사용자가 바로 이해할 수 있게 간결하게 작성해라.\n\n");
    }

    private void appendOutputFormat(StringBuilder sb) {
        sb.append("[출력 형식]\n");
        sb.append("첫 문장: 검색 결과 기준 핵심 답변 1문장\n");
        sb.append("다음 줄: 핵심 포인트 2~3개를 '- '로 시작하는 짧은 bullet로 작성\n");
        sb.append("마지막 줄: 더 확인하면 좋은 방향 1문장\n");
        sb.append("번호 목록, 긴 문단, markdown 굵게 표시를 사용하지 마라.\n\n");
    }

    private void appendKeyword(StringBuilder sb, AiSearchSummaryRequestDto request) {
        sb.append("[검색어]\n");
        sb.append(request.getKeyword()).append("\n\n");
    }

    private void appendSourceGuide(StringBuilder sb) {
        sb.append("[검색 결과 유형 해석 기준]\n");
        sb.append("- news: 최신 이슈와 사건 흐름 파악에 유리하지만 단일 기사만으로 단정하지 말 것\n");
        sb.append("- blog: 사용 후기, 경험담, 해설에 유리하지만 개인 의견일 수 있음을 감안할 것\n");
        sb.append("- web: 공식 문서, 일반 웹문서, 기관/기업 페이지일 수 있어 기본 정보 확인에 유리\n");
        sb.append("- post: 사이트 내부 게시글이며 사용자 관점 파악에 유리하지만 공식 정보는 아닐 수 있음\n\n");
    }

    private void appendSources(StringBuilder sb, AiSearchSummaryRequestDto request) {
        sb.append("[검색 결과]\n");

        List<AiSearchSummaryRequestDto.AiSearchSourceDto> promptSources = sourceSelector.getPromptSources(request);

        if (promptSources.isEmpty()) {
            sb.append("검색 결과가 없습니다.\n");
            sb.append("검색 결과가 없으므로 답변에서 정보 부족을 명확히 말해라.\n");
            return;
        }

        int index = 1;

        for (AiSearchSummaryRequestDto.AiSearchSourceDto source : promptSources) {
            sb.append(index++).append(". ");
            sb.append("유형: ").append(nullToEmpty(source.getType())).append("\n");
            sb.append("제목: ").append(limitText(nullToEmpty(source.getTitle()), 150)).append("\n");
            sb.append("내용: ").append(limitText(nullToEmpty(source.getDescription()), 280)).append("\n");
            sb.append("링크: ").append(nullToEmpty(source.getLink())).append("\n\n");
        }
    }

    private List<AiSearchSummaryResponseDto.ReferenceSourceDto> createReferenceSources(
            AiSearchSummaryRequestDto request
    ) {
        return sourceSelector.getPromptSources(request).stream()
                .map(source -> new AiSearchSummaryResponseDto.ReferenceSourceDto(
                        nullToEmpty(source.getType()),
                        limitText(nullToEmpty(source.getTitle()), 150),
                        nullToEmpty(source.getLink())
                ))
                .toList();
    }

    private List<AiSearchSummaryResponseDto.RecommendedLinkDto> createRecommendedLinks(
            AiSearchSummaryRequestDto request
    ) {
        return sourceSelector.getPromptSources(request).stream()
                .filter(source -> !isBlank(source.getLink()))
                .limit(5)
                .map(source -> new AiSearchSummaryResponseDto.RecommendedLinkDto(
                        nullToEmpty(source.getType()),
                        limitText(nullToEmpty(source.getTitle()), 120),
                        nullToEmpty(source.getLink())
                ))
                .toList();
    }

    private List<AiSearchSummaryResponseDto.EvidenceSourceDto> createEvidenceSources(
            AiSearchSummaryRequestDto request
    ) {
        return sourceSelector.getPromptSources(request).stream()
                .filter(source -> !isBlank(source.getLink()))
                .limit(3)
                .map(source -> new AiSearchSummaryResponseDto.EvidenceSourceDto(
                        nullToEmpty(source.getType()),
                        limitText(nullToEmpty(source.getTitle()), 120),
                        nullToEmpty(source.getLink()),
                        createEvidenceReason(source)
                ))
                .toList();
    }

    private String createEvidenceReason(AiSearchSummaryRequestDto.AiSearchSourceDto source) {
        String type = normalize(source.getType());

        return switch (type) {
            case "web" -> "기본 개념이나 배경 정보를 확인하는 데 참고한 자료입니다.";
            case "news" -> "최근 이슈와 사건 흐름을 확인하는 데 참고한 자료입니다.";
            case "blog" -> "사용자 경험이나 해설을 보완하는 데 참고한 자료입니다.";
            case "post" -> "커뮤니티 안의 사용자 관점을 확인하는 데 참고한 자료입니다.";
            default -> "검색 요약을 보완하는 데 참고한 자료입니다.";
        };
    }

    private SearchIntent detectIntent(AiSearchSummaryRequestDto request) {
        String keyword = normalize(request.getKeyword());

        if (containsAny(keyword,
                "뉴스", "속보", "이슈", "논란", "사건", "사고", "최신", "근황",
                "news", "latest", "recent", "issue")) {
            return SearchIntent.NEWS;
        }

        if (containsAny(keyword,
                "비교", "차이", "다른점", "장단점", "vs", "versus", "compare", "difference")) {
            return SearchIntent.COMPARE;
        }

        if (containsAny(keyword,
                "추천", "순위", "베스트", "best", "recommend", "ranking", "top")) {
            return SearchIntent.RECOMMEND;
        }

        if (containsAny(keyword,
                "방법", "하는법", "사용법", "해결", "설정", "고치는법", "오류", "에러",
                "how to", "guide", "tutorial", "fix", "error")) {
            return SearchIntent.HOW_TO;
        }

        if (keyword.contains("?") || containsAny(keyword,
                "뭐", "무엇", "왜", "언제", "어디", "누구", "가능", "하나", "될까",
                "인가", "인가요", "what", "why", "when", "where", "who", "can", "is ")) {
            return SearchIntent.QUESTION;
        }

        if (isMostlyNewsSources(request)) {
            return SearchIntent.NEWS;
        }

        return SearchIntent.GENERAL;
    }

    private List<String> createFollowUpQuestions(AiSearchSummaryRequestDto request, SearchIntent intent) {
        String keyword = request.getKeyword();

        return switch (intent) {
            case NEWS -> List.of(
                    keyword + " 최신 이슈는 무엇인가?",
                    keyword + " 관련 주요 쟁점은 무엇인가?",
                    keyword + " 이후 전망은 어떻게 되는가?"
            );
            case COMPARE -> List.of(
                    keyword + "의 핵심 차이는 무엇인가?",
                    keyword + " 중 어떤 선택이 더 적합한가?",
                    keyword + " 장단점은 무엇인가?"
            );
            case RECOMMEND -> List.of(
                    keyword + " 추천 기준은 무엇인가?",
                    keyword + " 선택할 때 주의할 점은 무엇인가?",
                    keyword + " 대안은 무엇이 있는가?"
            );
            case HOW_TO -> List.of(
                    keyword + " 해결 순서는 어떻게 되는가?",
                    keyword + " 실패할 때 확인할 점은 무엇인가?",
                    keyword + " 주의해야 할 설정은 무엇인가?"
            );
            case QUESTION -> List.of(
                    keyword + "에 대한 근거는 무엇인가?",
                    keyword + " 관련해서 더 확인할 점은 무엇인가?",
                    keyword + "와 관련된 다른 관점은 무엇인가?"
            );
            case GENERAL -> List.of(
                    keyword + " 핵심 정보는 무엇인가?",
                    keyword + " 관련 최신 정보는 무엇인가?",
                    keyword + " 더 자세히 볼 만한 자료는 무엇인가?"
            );
        };
    }

    private boolean isMostlyNewsSources(AiSearchSummaryRequestDto request) {
        if (request.getSources() == null || request.getSources().isEmpty()) {
            return false;
        }

        int total = 0;
        int newsCount = 0;

        for (AiSearchSummaryRequestDto.AiSearchSourceDto source : request.getSources()) {
            if (source == null) {
                continue;
            }

            total++;

            String type = normalize(source.getType());
            if ("news".equals(type) || type.contains("news") || type.contains("뉴스")) {
                newsCount++;
            }
        }

        return total > 0 && newsCount >= Math.ceil(total / 2.0);
    }

    private boolean containsAny(String text, String... keywords) {
        if (text == null) {
            return false;
        }

        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }

        return false;
    }

    private String normalize(String text) {
        if (text == null) {
            return "";
        }

        return text.trim().toLowerCase();
    }

    private boolean isBlank(String text) {
        return text == null || text.trim().isEmpty();
    }

    private String nullToEmpty(String text) {
        return text == null ? "" : text.trim();
    }

    private String limitText(String text, int maxLength) {
        if (text == null) {
            return "";
        }

        if (text.length() <= maxLength) {
            return text;
        }

        return text.substring(0, maxLength) + "...";
    }

    private enum SearchIntent {
        GENERAL,
        QUESTION,
        COMPARE,
        RECOMMEND,
        NEWS,
        HOW_TO
    }
}
