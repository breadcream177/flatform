package com.community.communitybackend.dto;

import com.community.communitybackend.entity.User;
import java.time.LocalDateTime;
import lombok.Getter;

@Getter
public class UserResponseDto {

    private final Long id;
    private final String email;
    private final String username;
    private final String realName;
    private final String nickname;
    private final LocalDateTime nicknameChangedAt;
    private final String provider;
    private final String providerId;
    private final String profileImageUrl;
    private final String role;
    private final String status;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public UserResponseDto(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.username = user.getUsername();
        this.realName = user.getRealName();
        this.nickname = user.getNickname();
        this.nicknameChangedAt = user.getNicknameChangedAt();
        this.provider = user.getProvider();
        this.providerId = user.getProviderId();
        this.profileImageUrl = user.getProfileImageUrl();
        this.role = user.getRole();
        this.status = user.getStatus();
        this.createdAt = user.getCreatedAt();
        this.updatedAt = user.getUpdatedAt();
    }
}