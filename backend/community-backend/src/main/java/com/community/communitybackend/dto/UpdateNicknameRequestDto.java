package com.community.communitybackend.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UpdateNicknameRequestDto {

    private Long userId;
    private String nickname;
}