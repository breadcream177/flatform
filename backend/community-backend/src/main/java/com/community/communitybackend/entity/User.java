package com.community.communitybackend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email", nullable = false, length = 100, unique = true)
    private String email;

    @Column(name = "password", length = 255)
    private String password;

    @Column(name = "username", nullable = false, length = 50, unique = true)
    private String username;

    @Column(name = "real_name", length = 50)
    private String realName;

    @Column(name = "nickname", nullable = false, length = 50, unique = true)
    private String nickname;

    @Column(name = "nickname_changed_at")
    private LocalDateTime nicknameChangedAt;

    @Column(name = "provider", nullable = false, length = 20)
    private String provider;

    @Column(name = "provider_id", length = 100)
    private String providerId;

    @Column(name = "profile_image_url", length = 255)
    private String profileImageUrl;

    @Column(name = "role", nullable = false, length = 20)
    private String role;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Builder
    public User(
            Long id,
            String email,
            String password,
            String username,
            String realName,
            String nickname,
            LocalDateTime nicknameChangedAt,
            String provider,
            String providerId,
            String profileImageUrl,
            String role,
            String status
    ) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.username = username;
        this.realName = realName;
        this.nickname = nickname;
        this.nicknameChangedAt = nicknameChangedAt;
        this.provider = provider;
        this.providerId = providerId;
        this.profileImageUrl = profileImageUrl;
        this.role = role;
        this.status = status;
    }

    public static User createLocalUser(
            String email,
            String password,
            String username,
            String realName,
            String nickname
    ) {
        return User.builder()
                .email(email)
                .password(password)
                .username(username)
                .realName(realName)
                .nickname(nickname)
                .provider("LOCAL")
                .role("USER")
                .status("ACTIVE")
                .build();
    }
    public void updateNickname(String nickname, LocalDateTime changedAt) {
        this.nickname = nickname;
        this.nicknameChangedAt = changedAt;
    }

    public void updatePassword(String password) {
        this.password = password;
    }
}
