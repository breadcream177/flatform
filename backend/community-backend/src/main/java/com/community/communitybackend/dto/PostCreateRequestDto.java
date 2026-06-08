package com.community.communitybackend.dto;

import lombok.Getter;

@Getter
public class PostCreateRequestDto {

    private Long boardId;
    private Long userId;
    private String title;
    private String content;
}