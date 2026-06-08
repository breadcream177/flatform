package com.community.communitybackend.dto;

import com.community.communitybackend.entity.Board;
import java.time.LocalDateTime;
import lombok.Getter;

@Getter
public class BoardResponseDto {

    private final Long id;
    private final String name;
    private final String code;
    private final String description;
    private final Integer sortOrder;
    private final Boolean active;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public BoardResponseDto(Board board) {
        this.id = board.getId();
        this.name = board.getName();
        this.code = board.getCode();
        this.description = board.getDescription();
        this.sortOrder = board.getSortOrder();
        this.active = board.getActive();
        this.createdAt = board.getCreatedAt();
        this.updatedAt = board.getUpdatedAt();
    }
}