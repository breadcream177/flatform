package com.community.communitybackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class SearchService {

    @Value("${naver.search.client-id}")
    private String clientId;

    @Value("${naver.search.client-secret}")
    private String clientSecret;

    public String searchWeb(String query, int page, int display, String sort) {
        return requestNaverSearch("webkr", query, page, display, normalizeSort(sort));
    }

    public String searchNews(String query, int page, int display, String sort) {
        return requestNaverSearch("news", query, page, display, normalizeSort(sort));
    }

    public String searchBlog(String query, int page, int display, String sort) {
        return requestNaverSearch("blog", query, page, display, normalizeSort(sort));
    }

    public String searchShopping(String query, int page, int display, String sort) {
        return requestNaverSearch("shop", query, page, display, normalizeSort(sort));
    }

    public String searchImage(String query, int page, int display, String sort) {
        return requestNaverSearch("image", query, page, display, normalizeSort(sort));
    }

    private String requestNaverSearch(String type, String query, int page, int display, String sort) {
        validateNaverConfig();

        try {
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);

            int safeDisplay = Math.max(1, Math.min(display, 100));
            int safePage = Math.max(1, page);
            int start = ((safePage - 1) * safeDisplay) + 1;
            int safeStart = Math.min(start, 1000);

            String apiURL = "https://openapi.naver.com/v1/search/"
                    + type
                    + ".json?query="
                    + encodedQuery
                    + "&display="
                    + safeDisplay
                    + "&start="
                    + safeStart
                    + "&sort="
                    + sort;

            URL url = new URL(apiURL);
            HttpURLConnection con = (HttpURLConnection) url.openConnection();

            con.setRequestMethod("GET");
            con.setRequestProperty("X-Naver-Client-Id", clientId);
            con.setRequestProperty("X-Naver-Client-Secret", clientSecret);

            int responseCode = con.getResponseCode();

            BufferedReader br = new BufferedReader(
                    new InputStreamReader(
                            responseCode == 200 ? con.getInputStream() : con.getErrorStream(),
                            StandardCharsets.UTF_8
                    )
            );

            StringBuilder response = new StringBuilder();
            String inputLine;

            while ((inputLine = br.readLine()) != null) {
                response.append(inputLine);
            }

            br.close();

            if (responseCode != 200) {
                throw new RuntimeException("네이버 검색 API 오류: " + response);
            }

            return response.toString();

        } catch (Exception e) {
            throw new RuntimeException("네이버 검색 요청에 실패했습니다.", e);
        }
    }

    private void validateNaverConfig() {
        if (isMissingConfig(clientId) || isMissingConfig(clientSecret)) {
            throw new IllegalStateException("네이버 검색 API 환경변수가 설정되지 않았습니다.");
        }
    }

    private boolean isMissingConfig(String value) {
        return value == null || value.isBlank() || "change-me".equals(value);
    }

    private String normalizeSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return "date";
        }

        if ("sim".equalsIgnoreCase(sort)) {
            return "sim";
        }

        return "date";
    }
}
