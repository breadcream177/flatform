package com.community.communitybackend.dto.blog;

import com.community.communitybackend.entity.BlogPost;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class BlogPostResponseDto {

    private Long id;
    private String title;
    private String content;
    private String category;
    private String thumbnailUrl;
    private String author;
    private LocalDateTime createdAt;
    private Long userId;

    public BlogPostResponseDto(BlogPost post) {
        this.id = post.getId();
        this.title = post.getTitle();
        this.content = post.getContent();
        this.category = post.getCategory();
        this.thumbnailUrl = post.getThumbnailUrl();
        this.author = post.getUser().getNickname();
        this.createdAt = post.getCreatedAt();
        this.userId = post.getUser().getId();
    }
}