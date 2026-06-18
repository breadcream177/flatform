package com.community.communitybackend.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PasswordResetConfirmRequestDto {

    private String token;
    private String newPassword;
}
