package com.community.communitybackend.dto;

import lombok.Getter;

@Getter
public class CommentUpdateRequestDto {

    private Long userId;
    private String role;
    private String content;
}