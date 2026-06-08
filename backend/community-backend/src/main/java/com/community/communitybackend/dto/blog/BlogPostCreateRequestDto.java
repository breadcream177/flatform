package com.community.communitybackend.dto.blog;

import lombok.Getter;

@Getter
public class BlogPostCreateRequestDto {
    private String title;
    private String content;
    private String category;
    private String thumbnailUrl;
    private Long userId;
}