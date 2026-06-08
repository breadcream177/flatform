package com.community.communitybackend.controller;

import com.community.communitybackend.dto.ApiResponse;
import com.community.communitybackend.dto.MainSummaryResponseDto;
import com.community.communitybackend.dto.MainSummaryResponseDto.NewsPreviewDto;
import com.community.communitybackend.dto.MainSummaryResponseDto.ShoppingPreviewDto;
import com.community.communitybackend.dto.MainSummaryResponseDto.WebtoonPreviewDto;
import com.community.communitybackend.service.MainSummaryService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/main")
@RequiredArgsConstructor
public class MainController {

    private final MainSummaryService mainSummaryService;

    @GetMapping("/summary")
    public ApiResponse<MainSummaryResponseDto> getMainSummary() {
        return ApiResponse.success(mainSummaryService.getMainSummary());
    }

    @GetMapping("/news")
    public ApiResponse<List<NewsPreviewDto>> getNewsItems(
            @RequestParam(defaultValue = "취업 실무") String keyword
    ) {
        try {
            return ApiResponse.success(mainSummaryService.getNewsItems(keyword));
        } catch (Exception e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @GetMapping("/shopping")
    public ApiResponse<List<ShoppingPreviewDto>> getShoppingItems(
            @RequestParam(defaultValue = "취업 준비 아이템") String keyword
    ) {
        try {
            return ApiResponse.success(mainSummaryService.getShoppingItems(keyword));
        } catch (Exception e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @GetMapping("/webtoons")
    public ApiResponse<List<WebtoonPreviewDto>> getWebtoonItems(
            @RequestParam(defaultValue = "") String week
    ) {
        try {
            return ApiResponse.success(mainSummaryService.getWebtoonItems(week));
        } catch (Exception e) {
            return ApiResponse.fail(e.getMessage());
        }
    }
}
