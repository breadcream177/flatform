package com.community.communitybackend.dto;

import java.util.List;

public class AiSearchSummaryResponseDto {

    private final String summary;
    private final String intent;
    private final List<String> followUpQuestions;
    private final List<ReferenceSourceDto> referenceSources;
    private final List<RecommendedLinkDto> recommendedLinks;
    private final List<EvidenceSourceDto> evidenceSources;

    public AiSearchSummaryResponseDto(
            String summary,
            String intent,
            List<String> followUpQuestions,
            List<ReferenceSourceDto> referenceSources,
            List<RecommendedLinkDto> recommendedLinks,
            List<EvidenceSourceDto> evidenceSources
    ) {
        this.summary = summary;
        this.intent = intent;
        this.followUpQuestions = followUpQuestions;
        this.referenceSources = referenceSources;
        this.recommendedLinks = recommendedLinks;
        this.evidenceSources = evidenceSources;
    }

    public String getSummary() {
        return summary;
    }

    public String getIntent() {
        return intent;
    }

    public List<String> getFollowUpQuestions() {
        return followUpQuestions;
    }

    public List<ReferenceSourceDto> getReferenceSources() {
        return referenceSources;
    }

    public List<RecommendedLinkDto> getRecommendedLinks() {
        return recommendedLinks;
    }

    public List<EvidenceSourceDto> getEvidenceSources() {
        return evidenceSources;
    }

    public static class ReferenceSourceDto {
        private final String type;
        private final String title;
        private final String link;

        public ReferenceSourceDto(String type, String title, String link) {
            this.type = type;
            this.title = title;
            this.link = link;
        }

        public String getType() {
            return type;
        }

        public String getTitle() {
            return title;
        }

        public String getLink() {
            return link;
        }
    }

    public static class RecommendedLinkDto {
        private final String type;
        private final String title;
        private final String link;

        public RecommendedLinkDto(String type, String title, String link) {
            this.type = type;
            this.title = title;
            this.link = link;
        }

        public String getType() {
            return type;
        }

        public String getTitle() {
            return title;
        }

        public String getLink() {
            return link;
        }
    }

    public static class EvidenceSourceDto {
        private final String type;
        private final String title;
        private final String link;
        private final String reason;

        public EvidenceSourceDto(String type, String title, String link, String reason) {
            this.type = type;
            this.title = title;
            this.link = link;
            this.reason = reason;
        }

        public String getType() {
            return type;
        }

        public String getTitle() {
            return title;
        }

        public String getLink() {
            return link;
        }

        public String getReason() {
            return reason;
        }
    }
}
