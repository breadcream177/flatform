package com.community.communitybackend.service;

import com.community.communitybackend.dto.CareerPortalResponseDto;
import com.community.communitybackend.dto.CareerPortalResponseDto.CareerRecordCardDto;
import com.community.communitybackend.dto.CareerPortalResponseDto.CertificationSiteDto;
import com.community.communitybackend.dto.CareerPortalResponseDto.ContestInfoDto;
import com.community.communitybackend.dto.CareerPortalResponseDto.JobPostingDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.StringReader;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.xml.parsers.DocumentBuilderFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

@Service
@RequiredArgsConstructor
public class CareerPortalService {

    private static final int WORKNET_TIMEOUT_MS = 3500;
    private static final int WORKNET_DISPLAY_COUNT = 20;
    private static final int JOB_LIMIT = 12;
    private static final int CONTEST_LIMIT = 20;
    private static final List<String> CONTEST_ALLOWED_HOSTS = List.of(
            "wevity.com",
            "linkareer.com",
            "thinkcontest.com",
            "contestkorea.com",
            "all-con.co.kr",
            "detizen.com",
            "k-startup.go.kr",
            "data.go.kr"
    );
    private static final String DEFAULT_JOB_KEYWORD = "IT 신입 개발자";
    private static final String CONTEST_SEARCH_KEYWORD = "IT 공모전 개발자 대외활동 공모전";
    private static final Pattern NUMBER_PATTERN = Pattern.compile("(\\d[\\d,]*)");
    private static final String Q_NET_SCHEDULE_URL = "https://www.q-net.or.kr/crf021.do?id=crf02101&gSite=Q&gId=";
    private static final String Q_NET_APPLY_URL = "https://www.q-net.or.kr/rcv001.do?id=rcv00101&gSite=Q&gId=";
    private static final String Q_NET_QUALIFICATION_URL = "https://www.q-net.or.kr/crf005.do?id=crf00501&gSite=Q&gId=";
    private static final String KORCHAM_EXAM_URL = "https://license.korcham.net/exam/examList.do";
    private static final String KORCHAM_APPLY_URL = "https://license.korcham.net/rcv/rcvList.do";
    private static final String KPC_EXAM_URL = "https://license.kpc.or.kr/kpc/qualfAthrz/index.do";
    private static final String DATAQ_EXAM_URL = "https://www.dataq.or.kr/www/sub/a_06.do";
    private static final String DATAQ_APPLY_URL = "https://www.dataq.or.kr/www/sub/a_07.do";

    private final SearchService searchService;

    @Value("${career.worknet.api-key:}")
    private String worknetApiKey;

    @Value("${career.worknet.api-url:https://openapi.work.go.kr/opi/opi/opia/wantedApi.do}")
    private String worknetApiUrl;

    public CareerPortalResponseDto getCareerPortal(
            String keyword,
            String region,
            Integer minSalary,
            Integer maxSalary
    ) {
        JobResult jobResult = loadWorknetJobs(keyword, region, minSalary, maxSalary);
        ContestResult contestResult = loadContestInfos();

        return new CareerPortalResponseDto(
                jobResult.jobs(),
                getCertificationSites(),
                contestResult.contests(),
                getCareerRecordCards(),
                jobResult.error(),
                "자격증 일정은 각 기관의 공식 일정 페이지로 연결합니다. 공개 일정 API가 확인되면 자동 수집 구조로 확장할 수 있습니다.",
                contestResult.error(),
                jobResult.sourceStatus()
        );
    }

    public List<JobPostingDto> getJobPostings(
            String keyword,
            String region,
            Integer minSalary,
            Integer maxSalary
    ) {
        return loadWorknetJobs(keyword, region, minSalary, maxSalary).jobs();
    }

    private JobResult loadWorknetJobs(
            String keyword,
            String region,
            Integer minSalary,
            Integer maxSalary
    ) {
        if (isMissingConfig(worknetApiKey)) {
            return new JobResult(
                    List.of(),
                    "워크넷 Open API 키가 설정되지 않아 채용 공고 연동을 대기 중입니다.",
                    "WORKNET_API_KEY_REQUIRED"
            );
        }

        try {
            String responseBody = requestExternalText(buildWorknetUrl(keyword, region));
            List<JobPostingDto> jobs = parseWorknetJobs(responseBody)
                    .stream()
                    .filter(job -> matchesSalary(job, minSalary, maxSalary))
                    .limit(JOB_LIMIT)
                    .toList();

            return new JobResult(jobs, null, "WORKNET_CONNECTED");
        } catch (Exception e) {
            System.out.println("WorkNet API error: " + e.getMessage());
            return new JobResult(
                    List.of(),
                    "워크넷 채용 공고를 불러오지 못했습니다. API 키, 응답 형식, 네트워크 상태를 확인해주세요.",
                    "WORKNET_ERROR"
            );
        }
    }

    private ContestResult loadContestInfos() {
        try {
            String responseBody = searchService.searchWeb(CONTEST_SEARCH_KEYWORD, 1, CONTEST_LIMIT, "date");
            List<ContestInfoDto> parsedContests = parseContestSearch(responseBody);
            List<ContestInfoDto> contests = mergeContestInfos(parsedContests, getContestOfficialLinks());

            if (parsedContests.isEmpty()) {
                return new ContestResult(
                        contests,
                        "공모전 검색 결과가 없어 공식 공모전/대외활동 사이트 링크를 우선 표시합니다."
                );
            }

            return new ContestResult(contests, null);
        } catch (Exception e) {
            System.out.println("Contest search error: " + e.getMessage());
            return new ContestResult(
                    getContestOfficialLinks(),
                    "공모전 검색 결과를 불러오지 못해 공식 공모전/대외활동 사이트 링크를 우선 표시합니다."
            );
        }
    }

    private List<ContestInfoDto> mergeContestInfos(
            List<ContestInfoDto> primary,
            List<ContestInfoDto> secondary
    ) {
        List<ContestInfoDto> merged = new ArrayList<>();
        List<String> keys = new ArrayList<>();

        addContestInfos(merged, keys, primary);
        addContestInfos(merged, keys, secondary);

        return merged;
    }

    private void addContestInfos(
            List<ContestInfoDto> merged,
            List<String> keys,
            List<ContestInfoDto> contests
    ) {
        for (ContestInfoDto contest : contests) {
            String key = getContestDedupeKey(contest);

            if (key.isBlank() || keys.contains(key)) {
                continue;
            }

            keys.add(key);
            merged.add(contest);
        }
    }

    private String buildWorknetUrl(String keyword, String region) {
        StringBuilder url = new StringBuilder(worknetApiUrl)
                .append("?authKey=").append(encode(worknetApiKey))
                .append("&callTp=L")
                .append("&returnType=XML")
                .append("&startPage=1")
                .append("&display=").append(WORKNET_DISPLAY_COUNT)
                .append("&keyword=").append(encode(normalizeKeyword(keyword)));

        String trimmedRegion = trim(region);

        if (!trimmedRegion.isBlank()) {
            url.append("&region=").append(encode(trimmedRegion));
        }

        return url.toString();
    }

    private String requestExternalText(String requestUrl) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(requestUrl).openConnection();
        connection.setRequestMethod("GET");
        connection.setConnectTimeout(WORKNET_TIMEOUT_MS);
        connection.setReadTimeout(WORKNET_TIMEOUT_MS);

        int statusCode = connection.getResponseCode();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                statusCode >= 400 ? connection.getErrorStream() : connection.getInputStream(),
                StandardCharsets.UTF_8
        ))) {
            StringBuilder body = new StringBuilder();
            String line;

            while ((line = reader.readLine()) != null) {
                body.append(line);
            }

            if (statusCode >= 400) {
                throw new IllegalStateException("WorkNet HTTP status " + statusCode + ": " + body);
            }

            return body.toString();
        } finally {
            connection.disconnect();
        }
    }

    private List<JobPostingDto> parseWorknetJobs(String xml) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
        factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
        factory.setXIncludeAware(false);
        factory.setExpandEntityReferences(false);

        Document document = factory.newDocumentBuilder().parse(new InputSource(new StringReader(xml)));
        NodeList nodes = document.getElementsByTagName("wanted");

        List<JobPostingDto> jobs = new ArrayList<>();

        for (int i = 0; i < nodes.getLength(); i += 1) {
            Element element = (Element) nodes.item(i);
            String salary = text(element, "sal");

            jobs.add(new JobPostingDto(
                    firstNonBlank(text(element, "title"), text(element, "wantedTitle")),
                    firstNonBlank(text(element, "company"), text(element, "corpNm")),
                    firstNonBlank(text(element, "region"), text(element, "regionNm")),
                    salary,
                    parseSalaryMin(salary),
                    parseSalaryMax(salary),
                    firstNonBlank(text(element, "career"), text(element, "careerNm")),
                    firstNonBlank(text(element, "education"), text(element, "eduNm")),
                    firstNonBlank(text(element, "employmentType"), text(element, "empTpNm")),
                    firstNonBlank(text(element, "closeDt"), text(element, "regDt")),
                    "워크넷",
                    firstNonBlank(text(element, "wantedInfoUrl"), text(element, "wantedMobileInfoUrl")),
                    firstNonBlank(text(element, "jobCd"), text(element, "jobsCd"))
            ));
        }

        return jobs.stream()
                .filter(job -> !job.getTitle().isBlank())
                .filter(job -> !job.getOriginalUrl().isBlank())
                .toList();
    }

    private List<ContestInfoDto> parseContestSearch(String responseBody) throws Exception {
        ObjectMapper objectMapper = new ObjectMapper();
        JsonNode items = objectMapper.readTree(responseBody).path("items");
        List<ContestInfoDto> contests = new ArrayList<>();

        if (!items.isArray()) {
            return contests;
        }

        for (JsonNode item : items) {
            String title = cleanHtml(item.path("title").asText(""));
            String description = cleanHtml(item.path("description").asText(""));
            String link = item.path("link").asText("");

            if (trim(title).isBlank() || trim(link).isBlank()) {
                continue;
            }

            if (!isContestOfficialSource(link)) {
                continue;
            }

            String sourceName = sourceNameFromUrl(link);

            contests.add(new ContestInfoDto(
                    title,
                    sourceName,
                    description,
                    "공모전/대외활동",
                    "공식 페이지 확인",
                    "",
                    link,
                    sourceName,
                    List.of("IT", "공모전", "대외활동")
            ));
        }

        return contests;
    }

    private boolean matchesSalary(JobPostingDto job, Integer minSalary, Integer maxSalary) {
        if (minSalary == null && maxSalary == null) {
            return true;
        }

        Integer jobMinSalary = job.getMinSalary();
        Integer jobMaxSalary = job.getMaxSalary();

        if (jobMinSalary == null && jobMaxSalary == null) {
            return true;
        }

        int comparableMin = jobMinSalary != null ? jobMinSalary : jobMaxSalary;
        int comparableMax = jobMaxSalary != null ? jobMaxSalary : jobMinSalary;

        if (minSalary != null && comparableMax < minSalary) {
            return false;
        }

        return maxSalary == null || comparableMin <= maxSalary;
    }

    private List<CertificationSiteDto> getCertificationSites() {
        return List.of(
                new CertificationSiteDto(
                        "정보처리기사",
                        "Q-Net",
                        "국가기술자격 정보처리기사 시험 일정과 원서접수 정보를 확인합니다.",
                        Q_NET_SCHEDULE_URL,
                        Q_NET_APPLY_URL,
                        "",
                        Q_NET_QUALIFICATION_URL,
                        "공식 일정 확인",
                        List.of("IT", "Q-Net", "국가기술자격", "기사")
                ),
                new CertificationSiteDto(
                        "정보처리산업기사",
                        "Q-Net",
                        "소프트웨어 개발 직무 준비에 많이 활용되는 국가기술자격 일정입니다.",
                        Q_NET_SCHEDULE_URL,
                        Q_NET_APPLY_URL,
                        "",
                        Q_NET_QUALIFICATION_URL,
                        "공식 일정 확인",
                        List.of("IT", "Q-Net", "국가기술자격", "산업기사")
                ),
                new CertificationSiteDto(
                        "정보보안기사",
                        "Q-Net",
                        "보안 직무 준비자가 확인할 만한 국가기술자격 시험 정보입니다.",
                        Q_NET_SCHEDULE_URL,
                        Q_NET_APPLY_URL,
                        "",
                        Q_NET_QUALIFICATION_URL,
                        "공식 일정 확인",
                        List.of("IT", "보안", "Q-Net", "국가기술자격")
                ),
                new CertificationSiteDto(
                        "컴퓨터활용능력",
                        "대한상공회의소",
                        "스프레드시트와 데이터 처리 역량을 확인하는 OA 자격 일정입니다.",
                        KORCHAM_EXAM_URL,
                        KORCHAM_APPLY_URL,
                        "",
                        KORCHAM_EXAM_URL,
                        "공식 일정 확인",
                        List.of("사무", "OA", "대한상공회의소", "korcham")
                ),
                new CertificationSiteDto(
                        "워드프로세서",
                        "대한상공회의소",
                        "문서 작성 실무 역량을 확인할 수 있는 상공회의소 자격입니다.",
                        KORCHAM_EXAM_URL,
                        KORCHAM_APPLY_URL,
                        "",
                        KORCHAM_EXAM_URL,
                        "공식 일정 확인",
                        List.of("사무", "OA", "대한상공회의소", "korcham")
                ),
                new CertificationSiteDto(
                        "ITQ / GTQ",
                        "KPC 자격",
                        "ITQ, GTQ 등 KPC 주요 자격 일정을 확인합니다.",
                        KPC_EXAM_URL,
                        KPC_EXAM_URL,
                        "",
                        KPC_EXAM_URL,
                        "공식 일정 확인",
                        List.of("OA", "디자인", "KPC")
                ),
                new CertificationSiteDto(
                        "ERP 정보관리사",
                        "KPC 자격",
                        "회계, 인사, 물류 등 ERP 실무 역량을 확인하는 KPC 자격입니다.",
                        KPC_EXAM_URL,
                        KPC_EXAM_URL,
                        "",
                        KPC_EXAM_URL,
                        "공식 일정 확인",
                        List.of("ERP", "회계", "KPC")
                ),
                new CertificationSiteDto(
                        "SQLD / 데이터 자격",
                        "데이터자격검정",
                        "SQLD, ADsP 등 데이터 분석과 SQL 관련 자격 정보를 확인합니다.",
                        DATAQ_EXAM_URL,
                        DATAQ_APPLY_URL,
                        "",
                        DATAQ_EXAM_URL,
                        "공식 일정 확인",
                        List.of("SQL", "데이터", "분석", "dataq")
                ),
                new CertificationSiteDto(
                        "ADsP / 빅데이터분석기사",
                        "데이터자격검정",
                        "데이터 분석 직무 준비자가 함께 확인할 만한 시험 정보입니다.",
                        DATAQ_EXAM_URL,
                        DATAQ_APPLY_URL,
                        "",
                        DATAQ_EXAM_URL,
                        "공식 일정 확인",
                        List.of("데이터", "분석", "dataq")
                )
        );
    }

    private List<ContestInfoDto> getContestOfficialLinks() {
        return List.of(
                new ContestInfoDto(
                        "위비티 IT/개발 공모전 모아보기",
                        "WEVITY.COM",
                        "대학생 공모전, 대외활동, 개발·기획·아이디어 공모 정보를 확인합니다.",
                        "공모전/대외활동",
                        "공식 페이지 확인",
                        "",
                        "https://www.wevity.com/?c=find&s=1&gbn=list&sp=contents&sw=IT",
                        "WEVITY.COM",
                        List.of("wevity", "공모전", "대외활동", "IT")
                ),
                new ContestInfoDto(
                        "링커리어 대외활동·공모전",
                        "LINKAREER",
                        "대학생, 취준생 대상 대외활동과 공모전, 인턴 정보를 함께 확인합니다.",
                        "대외활동",
                        "공식 페이지 확인",
                        "",
                        "https://linkareer.com/list/contest",
                        "LINKAREER",
                        List.of("linkareer", "대외활동", "공모전", "인턴")
                ),
                new ContestInfoDto(
                        "씽굿 공모전 전문 검색",
                        "THINKCONTEST",
                        "분야별 공모전과 주최기관 정보를 확인할 수 있는 공모전 전문 사이트입니다.",
                        "공모전",
                        "공식 페이지 확인",
                        "",
                        "https://www.thinkcontest.com/Contest/CateField.html",
                        "THINKCONTEST",
                        List.of("thinkcontest", "씽굿", "공모전", "기획")
                ),
                new ContestInfoDto(
                        "콘테스트코리아 공모전 일정",
                        "CONTESTKOREA",
                        "공모전, 대회, 지원사업 정보를 분야별로 확인합니다.",
                        "공모전",
                        "공식 페이지 확인",
                        "",
                        "https://www.contestkorea.com/sub/list.php",
                        "CONTESTKOREA",
                        List.of("contestkorea", "콘테스트코리아", "공모전", "대회")
                ),
                new ContestInfoDto(
                        "K-Startup 창업경진대회와 지원사업",
                        "K-STARTUP",
                        "창업, 서비스 기획, 기술 사업화 관련 경진대회와 지원사업을 확인합니다.",
                        "창업/지원사업",
                        "공식 페이지 확인",
                        "",
                        "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do",
                        "K-STARTUP",
                        List.of("k-startup", "창업", "지원사업", "공모전")
                ),
                new ContestInfoDto(
                        "공공데이터 활용 공모전",
                        "DATA.GO.KR",
                        "공공데이터를 활용한 서비스, 분석, 아이디어 공모 정보를 확인합니다.",
                        "데이터/개발",
                        "공식 페이지 확인",
                        "",
                        "https://www.data.go.kr/tcs/eds/contestDataList.do",
                        "DATA.GO.KR",
                        List.of("data.go.kr", "공공데이터", "데이터", "개발")
                ),
                new ContestInfoDto(
                        "올콘 공모전 정보",
                        "ALL-CON",
                        "대학생과 취준생이 확인할 만한 공모전 정보를 모아봅니다.",
                        "공모전",
                        "공식 페이지 확인",
                        "",
                        "https://www.all-con.co.kr/uni_contest/contest/list",
                        "ALL-CON",
                        List.of("all-con", "공모전", "대외활동")
                ),
                new ContestInfoDto(
                        "데티즌 IT 공모전",
                        "DETIZEN",
                        "IT, 디자인, 아이디어 중심의 공모전 정보를 확인합니다.",
                        "IT/디자인",
                        "공식 페이지 확인",
                        "",
                        "https://www.detizen.com/contest",
                        "DETIZEN",
                        List.of("detizen", "IT", "디자인", "공모전")
                )
        );
    }
    private List<CareerRecordCardDto> getCareerRecordCards() {
        return List.of(
                new CareerRecordCardDto(
                        "이력서 버전 관리",
                        "지원 포지션별 이력서 수정 내역과 링크를 기록합니다.",
                        "/todos",
                        "resume"
                ),
                new CareerRecordCardDto(
                        "자기소개서 소재",
                        "경험, 문제 해결 과정, 작업 회고를 자기소개서 문장 재료로 모읍니다.",
                        "/todos",
                        "cover-letter"
                ),
                new CareerRecordCardDto(
                        "포트폴리오 작업 노트",
                        "프로젝트 기능, 기술 선택, 트러블슈팅 기록을 정리합니다.",
                        "/todos",
                        "portfolio"
                ),
                new CareerRecordCardDto(
                        "지원 일정 관리",
                        "서류, 코딩테스트, 면접 일정을 한 화면에서 체크합니다.",
                        "/todos",
                        "schedule"
                )
        );
    }

    private String text(Element element, String tagName) {
        NodeList nodes = element.getElementsByTagName(tagName);

        if (nodes.getLength() == 0 || nodes.item(0) == null) {
            return "";
        }

        return trim(nodes.item(0).getTextContent());
    }

    private Integer parseSalaryMin(String salary) {
        List<Integer> numbers = extractNumbers(salary);

        if (numbers.isEmpty()) {
            return null;
        }

        return numbers.get(0);
    }

    private Integer parseSalaryMax(String salary) {
        List<Integer> numbers = extractNumbers(salary);

        if (numbers.isEmpty()) {
            return null;
        }

        return numbers.get(numbers.size() - 1);
    }

    private List<Integer> extractNumbers(String text) {
        Matcher matcher = NUMBER_PATTERN.matcher(trim(text));
        List<Integer> numbers = new ArrayList<>();

        while (matcher.find()) {
            try {
                numbers.add(Integer.parseInt(matcher.group(1).replace(",", "")));
            } catch (NumberFormatException ignored) {
            }
        }

        return numbers;
    }

    private String normalizeKeyword(String keyword) {
        String trimmedKeyword = trim(keyword);

        if (trimmedKeyword.isBlank()) {
            return DEFAULT_JOB_KEYWORD;
        }

        return trimmedKeyword;
    }

    private String sourceNameFromUrl(String link) {
        String trimmedLink = trim(link);

        if (trimmedLink.isBlank()) {
            return "공식 사이트";
        }

        try {
            String host = URI.create(trimmedLink).getHost();

            if (host == null || host.isBlank()) {
                return "공식 사이트";
            }

            return host.replaceFirst("^www\\.", "");
        } catch (Exception e) {
            return "공식 사이트";
        }
    }

    private boolean isContestOfficialSource(String link) {
        String host = hostFromUrl(link);

        if (host.isBlank()) {
            return false;
        }

        return CONTEST_ALLOWED_HOSTS.stream().anyMatch(host::endsWith);
    }

    private String getContestDedupeKey(ContestInfoDto contest) {
        String source = firstNonBlank(contest.getSourceName(), sourceNameFromUrl(contest.getDetailUrl()));
        String title = cleanHtml(contest.getTitle())
                .toLowerCase()
                .replaceAll("[^0-9a-z가-힣]", "");

        if (!source.isBlank() && !title.isBlank()) {
            return source.toLowerCase() + ":" + title;
        }

        return firstNonBlank(contest.getDetailUrl(), contest.getTitle()).toLowerCase();
    }

    private String hostFromUrl(String link) {
        String trimmedLink = trim(link);

        if (trimmedLink.isBlank()) {
            return "";
        }

        try {
            String host = URI.create(trimmedLink).getHost();

            if (host == null || host.isBlank()) {
                return "";
            }

            return host.toLowerCase().replaceFirst("^www\\.", "");
        } catch (Exception e) {
            return "";
        }
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            String trimmedValue = trim(value);

            if (!trimmedValue.isBlank()) {
                return trimmedValue;
            }
        }

        return "";
    }

    private String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private boolean isMissingConfig(String value) {
        return value == null || value.isBlank() || "change-me".equals(value);
    }

    private String cleanHtml(String value) {
        return trim(value)
                .replaceAll("<[^>]*>", "")
                .replace("&quot;", "\"")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">");
    }

    private record JobResult(
            List<JobPostingDto> jobs,
            String error,
            String sourceStatus
    ) {
    }

    private record ContestResult(
            List<ContestInfoDto> contests,
            String error
    ) {
    }
}

