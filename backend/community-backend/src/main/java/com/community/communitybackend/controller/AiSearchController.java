package com.community.communitybackend.controller;

import com.community.communitybackend.dto.AiSearchSummaryRequestDto;
import com.community.communitybackend.dto.AiSearchSummaryResponseDto;
import com.community.communitybackend.dto.ApiResponse;
import com.community.communitybackend.service.AiSearchService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiSearchController {

    private final AiSearchService aiSearchService;

    public AiSearchController(AiSearchService aiSearchService) {
        this.aiSearchService = aiSearchService;
    }

    @PostMapping("/search-summary")
    public ApiResponse<AiSearchSummaryResponseDto> createSearchSummary(
            @RequestBody AiSearchSummaryRequestDto request
    ) {
        return ApiResponse.success(aiSearchService.createSearchSummary(request));
    }
}
