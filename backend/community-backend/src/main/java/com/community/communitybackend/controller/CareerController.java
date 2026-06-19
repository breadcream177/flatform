package com.community.communitybackend.controller;

import com.community.communitybackend.dto.ApiResponse;
import com.community.communitybackend.dto.CareerPortalResponseDto;
import com.community.communitybackend.dto.CareerPortalResponseDto.JobPostingDto;
import com.community.communitybackend.service.CareerPortalService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/career")
@RequiredArgsConstructor
public class CareerController {

    private final CareerPortalService careerPortalService;

    @GetMapping("/portal")
    public ApiResponse<CareerPortalResponseDto> getCareerPortal(
            @RequestParam(defaultValue = "IT 신입 개발자") String keyword,
            @RequestParam(defaultValue = "") String region,
            @RequestParam(required = false) Integer minSalary,
            @RequestParam(required = false) Integer maxSalary
    ) {
        return ApiResponse.success(careerPortalService.getCareerPortal(keyword, region, minSalary, maxSalary));
    }

    @GetMapping("/jobs")
    public ApiResponse<List<JobPostingDto>> getJobPostings(
            @RequestParam(defaultValue = "IT 신입 개발자") String keyword,
            @RequestParam(defaultValue = "") String region,
            @RequestParam(required = false) Integer minSalary,
            @RequestParam(required = false) Integer maxSalary
    ) {
        return ApiResponse.success(careerPortalService.getJobPostings(keyword, region, minSalary, maxSalary));
    }
}
