package com.community.communitybackend.dto;

import java.time.LocalDate;

public class TodoCreateRequestDto {

    private Long userId;
    private String title;
    private String description;
    private LocalDate dueDate;
    private String priority;

    public TodoCreateRequestDto() {
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

    public String getPriority() {
        return priority;
    }
}