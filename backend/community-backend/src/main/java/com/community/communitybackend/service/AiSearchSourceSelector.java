package com.community.communitybackend.service;

import com.community.communitybackend.dto.AiSearchSummaryRequestDto;
import java.net.URI;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class AiSearchSourceSelector {

    public List<AiSearchSummaryRequestDto.AiSearchSourceDto> getPromptSources(
            AiSearchSummaryRequestDto request
    ) {
        if (request.getSources() == null) {
            return List.of();
        }

        Set<String> seenSourceKeys = new LinkedHashSet<>();
        Map<String, Integer> typeCounts = new HashMap<>();
        List<AiSearchSummaryRequestDto.AiSearchSourceDto> promptSources = new ArrayList<>();

        List<AiSearchSummaryRequestDto.AiSearchSourceDto> sortedSources = request.getSources().stream()
                .filter(Objects::nonNull)
                .filter(source -> hasText(source.getTitle()) || hasText(source.getDescription()))
                .sorted(Comparator.comparingInt(this::sourceTypeRank))
                .toList();

        for (AiSearchSummaryRequestDto.AiSearchSourceDto source : sortedSources) {
            String sourceKey = createSourceKey(source);

            if (!seenSourceKeys.add(sourceKey)) {
                continue;
            }

            String type = normalize(source.getType());
            int currentTypeCount = typeCounts.getOrDefault(type, 0);

            if (currentTypeCount >= sourceTypeLimit(type)) {
                continue;
            }

            promptSources.add(source);
            typeCounts.put(type, currentTypeCount + 1);

            if (promptSources.size() >= 6) {
                break;
            }
        }

        return promptSources;
    }

    public String createSourceKey(AiSearchSummaryRequestDto.AiSearchSourceDto source) {
        String link = normalizeSourceLink(source.getLink());

        if (!link.isBlank()) {
            return "link:" + link;
        }

        return "title:" + normalize(source.getTitle());
    }

    private String normalizeSourceLink(String link) {
        String normalizedLink = normalize(link);

        if (normalizedLink.isBlank()) {
            return "";
        }

        try {
            URI uri = URI.create(normalizedLink);
            String host = uri.getHost() == null ? "" : uri.getHost().replaceFirst("^www\\.", "");
            String path = uri.getPath() == null ? "" : uri.getPath();

            if (path.endsWith("/") && path.length() > 1) {
                path = path.substring(0, path.length() - 1);
            }

            return host + path;
        } catch (IllegalArgumentException e) {
            return normalizedLink
                    .replaceAll("[?#].*$", "")
                    .replaceAll("/$", "");
        }
    }

    private int sourceTypeRank(AiSearchSummaryRequestDto.AiSearchSourceDto source) {
        String type = normalize(source.getType());

        return switch (type) {
            case "web" -> 1;
            case "news" -> 2;
            case "blog" -> 3;
            case "post" -> 4;
            default -> 5;
        };
    }

    private int sourceTypeLimit(String type) {
        return switch (type) {
            case "web", "news" -> 2;
            case "blog", "post" -> 1;
            default -> 1;
        };
    }

    private boolean hasText(String text) {
        return text != null && !text.trim().isEmpty();
    }

    private String normalize(String text) {
        if (text == null) {
            return "";
        }

        return text.trim().toLowerCase();
    }
}
