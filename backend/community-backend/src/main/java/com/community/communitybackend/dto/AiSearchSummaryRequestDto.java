package com.community.communitybackend.dto;

import java.util.List;

public class AiSearchSummaryRequestDto {

    private String keyword;
    private List<AiSearchSourceDto> sources;

    public String getKeyword() {
        return keyword;
    }

    public List<AiSearchSourceDto> getSources() {
        return sources;
    }

    public static class AiSearchSourceDto {
        private String type;
        private String title;
        private String description;
        private String link;

        public String getType() {
            return type;
        }

        public String getTitle() {
            return title;
        }

        public String getDescription() {
            return description;
        }

        public String getLink() {
            return link;
        }
    }
}