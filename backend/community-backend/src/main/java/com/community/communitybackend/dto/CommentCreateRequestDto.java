package com.community.communitybackend.dto;

import lombok.Getter;

@Getter
public class CommentCreateRequestDto {

    private Long postId;
    private Long userId;
    private String content;
}