package com.community.communitybackend.service;

import com.community.communitybackend.exception.AiSearchException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

@Service
public class GeminiClient {

    private static final int GEMINI_MAX_ATTEMPTS = 2;
    private static final Duration GEMINI_CONNECT_TIMEOUT = Duration.ofSeconds(3);
    private static final Duration GEMINI_READ_TIMEOUT = Duration.ofSeconds(15);

    private final ObjectMapper objectMapper;

    @Value("${gemini.api-key}")
    private String geminiApiKey;

    @Value("${gemini.model}")
    private String geminiModel;

    public GeminiClient() {
        this.objectMapper = new ObjectMapper();
    }

    public String requestSummary(String prompt) {
        validateGeminiConfig();

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                    + geminiModel
                    + ":generateContent?key="
                    + geminiApiKey;

            Map<String, Object> body = new HashMap<>();
            body.put("contents", List.of(
                    Map.of("parts", List.of(
                            Map.of("text", prompt)
                    ))
            ));

            RestTemplate restTemplate = createGeminiRestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<String> responseEntity = exchangeGemini(
                    restTemplate,
                    url,
                    entity,
                    String.class
            );

            String response = responseEntity.getBody();

            if (response == null || response.isBlank()) {
                throw new AiSearchException("Gemini 응답 본문이 비어 있습니다.", HttpStatus.BAD_GATEWAY);
            }

            JsonNode root = objectMapper.readTree(response);

            JsonNode textNode = root
                    .path("candidates")
                    .path(0)
                    .path("content")
                    .path("parts")
                    .path(0)
                    .path("text");

            if (textNode.isMissingNode() || textNode.asText().isBlank()) {
                throw new AiSearchException("Gemini 응답에서 요약 텍스트를 찾지 못했습니다.", HttpStatus.BAD_GATEWAY);
            }

            return cleanSummary(textNode.asText());

        } catch (HttpStatusCodeException e) {
            System.out.println("Gemini HTTP Error: " + e.getStatusCode());
            System.out.println("Gemini Response Body: " + e.getResponseBodyAsString());

            if (isGeminiQuotaExceeded(e)) {
                throw new AiSearchException(
                        "Gemini API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
                        HttpStatus.TOO_MANY_REQUESTS
                );
            }

            throw new AiSearchException(
                    "Gemini API 요청에 실패했습니다. 백엔드 로그를 확인해주세요.",
                    HttpStatus.BAD_GATEWAY
            );
        } catch (ResourceAccessException e) {
            System.out.println("Gemini Timeout or Network Error: " + e.getMessage());

            throw new AiSearchException(
                    "Gemini 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.",
                    HttpStatus.GATEWAY_TIMEOUT
            );
        } catch (AiSearchException e) {
            throw e;
        } catch (Exception e) {
            System.out.println("Gemini Response Error: " + e.getMessage());

            throw new AiSearchException(
                    "AI 요약 생성 중 오류가 발생했습니다. 백엔드 로그를 확인해주세요.",
                    HttpStatus.BAD_GATEWAY
            );
        }
    }

    private void validateGeminiConfig() {
        if (isMissingConfig(geminiApiKey)) {
            throw new AiSearchException("Gemini API 키가 설정되지 않았습니다.", HttpStatus.BAD_GATEWAY);
        }

        if (isMissingConfig(geminiModel)) {
            throw new AiSearchException("Gemini 모델명이 설정되지 않았습니다.", HttpStatus.BAD_GATEWAY);
        }
    }

    private boolean isMissingConfig(String value) {
        return value == null || value.isBlank() || "change-me".equals(value);
    }

    private RestTemplate createGeminiRestTemplate() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(GEMINI_CONNECT_TIMEOUT);
        requestFactory.setReadTimeout(GEMINI_READ_TIMEOUT);

        return new RestTemplate(requestFactory);
    }

    private ResponseEntity<String> exchangeGemini(
            RestTemplate restTemplate,
            String url,
            HttpEntity<Map<String, Object>> entity,
            Class<String> responseType
    ) {
        RuntimeException lastException = null;

        for (int attempt = 1; attempt <= GEMINI_MAX_ATTEMPTS; attempt++) {
            try {
                return restTemplate.exchange(
                        url,
                        HttpMethod.POST,
                        entity,
                        responseType
                );
            } catch (HttpStatusCodeException e) {
                if (!shouldRetryGemini(e, attempt)) {
                    throw e;
                }

                lastException = e;
                System.out.println("Gemini retry after HTTP error. attempt=" + attempt
                        + ", status=" + e.getStatusCode());
            } catch (ResourceAccessException e) {
                if (attempt >= GEMINI_MAX_ATTEMPTS) {
                    throw e;
                }

                lastException = e;
                System.out.println("Gemini retry after network or timeout error. attempt=" + attempt
                        + ", message=" + e.getMessage());
            }
        }

        throw lastException == null
                ? new IllegalStateException("Gemini request failed.")
                : lastException;
    }

    private boolean shouldRetryGemini(HttpStatusCodeException e, int attempt) {
        if (attempt >= GEMINI_MAX_ATTEMPTS) {
            return false;
        }

        int statusCode = e.getStatusCode().value();

        return statusCode >= 500 && statusCode < 600;
    }

    private boolean isGeminiQuotaExceeded(HttpStatusCodeException e) {
        return e.getStatusCode().value() == 429
                || e.getResponseBodyAsString().contains("RESOURCE_EXHAUSTED")
                || e.getResponseBodyAsString().contains("Quota exceeded");
    }

    private String cleanSummary(String summary) {
        if (summary == null || summary.isBlank()) {
            throw new AiSearchException("Gemini 요약 텍스트가 비어 있습니다.", HttpStatus.BAD_GATEWAY);
        }

        String normalized = summary
                .replace("\r\n", "\n")
                .replace("\r", "\n")
                .replace("**", "")
                .replace("__", "")
                .replace("`", "")
                .replaceAll("(?m)^#{1,6}\\s*", "")
                .replaceAll("\\[(.*?)]\\((.*?)\\)", "$1")
                .replaceAll("https?://\\S+", "")
                .trim();

        List<String> cleanedLines = new ArrayList<>();

        for (String line : normalized.split("\\n")) {
            String cleanedLine = line.trim();

            if (cleanedLine.isBlank()) {
                continue;
            }

            cleanedLine = cleanedLine
                    .replaceAll("^[-*]\\s+", "- ")
                    .replaceAll("^\\d+[.)]\\s+", "- ");

            cleanedLines.add(limitText(cleanedLine, 220));

            if (cleanedLines.size() >= 7) {
                break;
            }
        }

        if (cleanedLines.isEmpty()) {
            throw new AiSearchException("Gemini 요약 텍스트를 정리한 결과가 비어 있습니다.", HttpStatus.BAD_GATEWAY);
        }

        return String.join("\n", cleanedLines);
    }

    private String limitText(String text, int maxLength) {
        if (text == null || text.isBlank()) {
            return "";
        }

        if (text.length() <= maxLength) {
            return text;
        }

        return text.substring(0, maxLength) + "...";
    }
}
