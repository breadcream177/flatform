package com.community.communitybackend.dto;

import lombok.Getter;

@Getter
public class PostUpdateRequestDto {

    private Long userId;
    private String role;
    private String title;
    private String content;
}