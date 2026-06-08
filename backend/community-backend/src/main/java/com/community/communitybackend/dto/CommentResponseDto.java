package com.community.communitybackend.dto;

import com.community.communitybackend.entity.Comment;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class CommentResponseDto {

    private Long id;
    private Long postId;
    private Long userId;
    private String content;
    private Boolean deleted;
    private LocalDateTime createdAt;

    public CommentResponseDto(Comment comment) {
        this.id = comment.getId();
        this.postId = comment.getPost().getId();
        this.userId = comment.getUser().getId();
        this.content = comment.getContent();
        this.deleted = comment.getDeleted();
        this.createdAt = comment.getCreatedAt();
    }
}