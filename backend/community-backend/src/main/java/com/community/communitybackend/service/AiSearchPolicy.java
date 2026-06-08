package com.community.communitybackend.service;

import org.springframework.stereotype.Component;

@Component
public class AiSearchPolicy {

    public boolean isExplicitAdultQuery(String keyword) {
        String normalizedKeyword = normalize(keyword);

        return containsAny(normalizedKeyword,
                "야동", "포르노", "음란물", "성인영상", "성인 사진", "성인사진",
                "성기 사진", "성기사진", "성교 사진", "성교사진", "섹스 사진", "섹스사진",
                "누드 사진", "누드사진", "19금 영상", "19금영상", "av 배우", "av배우");
    }

    public boolean isCacheableSummary(String summary) {
        String normalizedSummary = normalize(summary);

        if (normalizedSummary.isBlank()) {
            return false;
        }

        return !containsAny(normalizedSummary,
                "오류", "실패", "초과", "한도", "제한", "timeout", "network",
                "gemini api", "gemini 응답 시간");
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
}
