package com.community.communitybackend.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthResponseDto {

    private boolean success;
    private String message;
    private Long userId;
    private String username;
    private String nickname;
    private String role;

    public static AuthResponseDto success(
            String message,
            Long userId,
            String username,
            String nickname,
            String role
    ) {
        return AuthResponseDto.builder()
                .success(true)
                .message(message)
                .userId(userId)
                .username(username)
                .nickname(nickname)
                .role(role)
                .build();
    }

    public static AuthResponseDto fail(String message) {
        return AuthResponseDto.builder()
                .success(false)
                .message(message)
                .build();
    }
}