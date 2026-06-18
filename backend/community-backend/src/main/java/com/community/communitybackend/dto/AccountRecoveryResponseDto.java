package com.community.communitybackend.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AccountRecoveryResponseDto {

    private String message;

    public static AccountRecoveryResponseDto of(String message) {
        return AccountRecoveryResponseDto.builder()
                .message(message)
                .build();
    }
}
