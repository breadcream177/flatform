package com.community.communitybackend.dto;

import java.time.LocalDate;

public class TodoUpdateRequestDto {

    private String title;
    private String description;
    private LocalDate dueDate;
    private String priority;
    private String status;

    public TodoUpdateRequestDto() {
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

    public String getStatus() {
        return status;
    }
}