package com.community.communitybackend.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SignupRequestDto {

    private String username;
    private String email;
    private String password;
    private String nickname;
    private String realName;
}