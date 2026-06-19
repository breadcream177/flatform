package com.community.communitybackend.dto;

import java.util.List;
import lombok.Getter;

@Getter
public class CareerPortalResponseDto {

    private final List<JobPostingDto> jobPostings;
    private final List<CertificationSiteDto> certificationSites;
    private final List<CareerRecordCardDto> careerRecordCards;
    private final String jobError;
    private final String certificationNotice;
    private final String sourceStatus;

    public CareerPortalResponseDto(
            List<JobPostingDto> jobPostings,
            List<CertificationSiteDto> certificationSites,
            List<CareerRecordCardDto> careerRecordCards,
            String jobError,
            String certificationNotice,
            String sourceStatus
    ) {
        this.jobPostings = jobPostings;
        this.certificationSites = certificationSites;
        this.careerRecordCards = careerRecordCards;
        this.jobError = jobError;
        this.certificationNotice = certificationNotice;
        this.sourceStatus = sourceStatus;
    }

    @Getter
    public static class JobPostingDto {
        private final String title;
        private final String company;
        private final String region;
        private final String salary;
        private final Integer minSalary;
        private final Integer maxSalary;
        private final String career;
        private final String education;
        private final String employmentType;
        private final String closeDate;
        private final String sourceName;
        private final String originalUrl;
        private final String jobType;

        public JobPostingDto(
                String title,
                String company,
                String region,
                String salary,
                Integer minSalary,
                Integer maxSalary,
                String career,
                String education,
                String employmentType,
                String closeDate,
                String sourceName,
                String originalUrl,
                String jobType
        ) {
            this.title = title;
            this.company = company;
            this.region = region;
            this.salary = salary;
            this.minSalary = minSalary;
            this.maxSalary = maxSalary;
            this.career = career;
            this.education = education;
            this.employmentType = employmentType;
            this.closeDate = closeDate;
            this.sourceName = sourceName;
            this.originalUrl = originalUrl;
            this.jobType = jobType;
        }
    }

    @Getter
    public static class CertificationSiteDto {
        private final String name;
        private final String organization;
        private final String description;
        private final String scheduleUrl;
        private final String applyUrl;
        private final String status;
        private final List<String> tags;

        public CertificationSiteDto(
                String name,
                String organization,
                String description,
                String scheduleUrl,
                String applyUrl,
                String status,
                List<String> tags
        ) {
            this.name = name;
            this.organization = organization;
            this.description = description;
            this.scheduleUrl = scheduleUrl;
            this.applyUrl = applyUrl;
            this.status = status;
            this.tags = tags;
        }
    }

    @Getter
    public static class CareerRecordCardDto {
        private final String title;
        private final String description;
        private final String path;
        private final String tag;

        public CareerRecordCardDto(String title, String description, String path, String tag) {
            this.title = title;
            this.description = description;
            this.path = path;
            this.tag = tag;
        }
    }
}
