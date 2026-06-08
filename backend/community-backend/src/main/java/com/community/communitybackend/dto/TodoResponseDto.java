package com.community.communitybackend.dto;

import com.community.communitybackend.entity.Todo;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class TodoResponseDto {

    private Long id;
    private Long userId;
    private String title;
    private String description;
    private LocalDate dueDate;
    private String status;
    private String priority;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public TodoResponseDto(Todo todo) {
        this.id = todo.getId();
        this.userId = todo.getUser().getId();
        this.title = todo.getTitle();
        this.description = todo.getDescription();
        this.dueDate = todo.getDueDate();
        this.status = todo.getStatus();
        this.priority = todo.getPriority();
        this.createdAt = todo.getCreatedAt();
        this.updatedAt = todo.getUpdatedAt();
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public String getStatus() {
        return status;
    }

    public String getPriority() {
        return priority;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}