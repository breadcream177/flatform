package com.community.communitybackend.dto;

import com.community.communitybackend.entity.Post;
import java.time.LocalDateTime;
import lombok.Getter;

@Getter
public class PostResponseDto {

    private final Long id;
    private final Long boardId;
    private final String boardName;
    private final Long userId;
    private final String username;
    private final String nickname;
    private final String title;
    private final String content;
    private final String visibility;
    private final Integer viewCount;
    private final Integer commentCount;
    private final Boolean deleted;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public PostResponseDto(Post post) {
        this.id = post.getId();
        this.boardId = post.getBoard().getId();
        this.boardName = post.getBoard().getName();
        this.userId = post.getUser().getId();
        this.username = post.getUser().getUsername();
        this.nickname = post.getUser().getNickname();
        this.title = post.getTitle();
        this.content = post.getContent();
        this.visibility = post.getVisibility();
        this.viewCount = post.getViewCount();
        this.commentCount = post.getCommentCount();
        this.deleted = post.getDeleted();
        this.createdAt = post.getCreatedAt();
        this.updatedAt = post.getUpdatedAt();
    }

    public static PostResponseDto fromEntity(Post post) {
        return new PostResponseDto(post);
    }
}