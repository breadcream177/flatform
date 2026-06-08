package com.community.communitybackend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "posts")
@Getter
@NoArgsConstructor
public class Post {

    public Post(Board board, User user, String title, String content,
                String visibility, Integer viewCount, Integer commentCount, Boolean deleted) {

        this.board = board;
        this.user = user;
        this.title = title;
        this.content = content;
        this.visibility = visibility;
        this.viewCount = viewCount;
        this.commentCount = commentCount;
        this.deleted = deleted;
    }

    public void update(String title, String content) {
        this.title = title;
        this.content = content;
    }

    public void increaseCommentCount() {
        this.commentCount++;
    }

    public void decreaseCommentCount() {
        if (this.commentCount > 0) {
            this.commentCount--;
        }
    }

    public void delete() {
        this.deleted = true;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "visibility", nullable = false, length = 20)
    private String visibility;

    @Column(name = "view_count", nullable = false)
    private Integer viewCount;

    @Column(name = "comment_count", nullable = false)
    private Integer commentCount;

    @Column(name = "is_deleted", nullable = false)
    private Boolean deleted;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

}
