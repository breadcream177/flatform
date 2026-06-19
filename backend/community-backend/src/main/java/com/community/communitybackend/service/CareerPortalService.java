package com.community.communitybackend.service;

import com.community.communitybackend.dto.CareerPortalResponseDto;
import com.community.communitybackend.dto.CareerPortalResponseDto.CareerRecordCardDto;
import com.community.communitybackend.dto.CareerPortalResponseDto.CertificationSiteDto;
import com.community.communitybackend.dto.CareerPortalResponseDto.JobPostingDto;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.StringReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.xml.parsers.DocumentBuilderFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

@Service
public class CareerPortalService {

    private static final int WORKNET_TIMEOUT_MS = 3500;
    private static final int WORKNET_DISPLAY_COUNT = 20;
    private static final int JOB_LIMIT = 12;
    private static final String DEFAULT_JOB_KEYWORD = "IT 신입 개발자";
    private static final Pattern NUMBER_PATTERN = Pattern.compile("(\\d[\\d,]*)");

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

        return new CareerPortalResponseDto(
                jobResult.jobs(),
                getCertificationSites(),
                getCareerRecordCards(),
                jobResult.error(),
                "자격증 일정은 각 기관의 공식 일정 페이지로 연결합니다. 공개 API가 확인되면 일정 데이터를 자동 수집하도록 확장할 수 있습니다.",
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

    private boolean matchesSalary(JobPostingDto job, Integer minSalary, Integer maxSalary) {
        if (minSalary == null && maxSalary == null) {
            return true;
        }

        Integer jobMinSalary = job.getMinSalary();
        Integer jobMaxSalary = job.getMaxSalary();

        if (jobMinSalary == null && jobMaxSalary == null) {
            return false;
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
                        "기사, 산업기사, 기능사 등 국가기술자격 시험 일정과 원서접수를 확인합니다.",
                        "https://www.q-net.or.kr/man001.do?gSite=Q",
                        "https://www.q-net.or.kr/rcv001.do?id=rcv00101&gSite=Q&gId=",
                        "공식 일정 확인",
                        List.of("IT", "국가기술자격", "기사")
                ),
                new CertificationSiteDto(
                        "컴퓨터활용능력",
                        "대한상공회의소",
                        "컴퓨터활용능력, 워드프로세서 등 상공회의소 자격 일정을 확인합니다.",
                        "https://license.korcham.net/",
                        "https://license.korcham.net/",
                        "공식 일정 확인",
                        List.of("사무", "OA", "상공회의소")
                ),
                new CertificationSiteDto(
                        "ITQ / GTQ",
                        "KPC 자격",
                        "ITQ, GTQ, ERP 정보관리사 등 KPC 주관 자격 일정을 확인합니다.",
                        "https://license.kpc.or.kr/",
                        "https://license.kpc.or.kr/",
                        "공식 일정 확인",
                        List.of("OA", "디자인", "KPC")
                )
        );
    }

    private List<CareerRecordCardDto> getCareerRecordCards() {
        return List.of(
                new CareerRecordCardDto(
                        "이력서 기록",
                        "학력, 경력, 프로젝트, 자격증을 한 곳에서 정리합니다.",
                        "/todos",
                        "resume"
                ),
                new CareerRecordCardDto(
                        "자기소개서 소재",
                        "경험, 문제 해결 과정, 협업 사례를 문장 재료로 모읍니다.",
                        "/todos",
                        "cover-letter"
                ),
                new CareerRecordCardDto(
                        "포트폴리오 정리",
                        "프로젝트 링크, 기능 설명, 회고를 취업용 포트폴리오로 정리합니다.",
                        "/mypage",
                        "portfolio"
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
        return value == null || value.isBlank();
    }

    private record JobResult(
            List<JobPostingDto> jobs,
            String error,
            String sourceStatus
    ) {
    }
}
