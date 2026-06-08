package com.community.communitybackend.controller;

import com.community.communitybackend.dto.ApiResponse;
import com.community.communitybackend.dto.AuthResponseDto;
import com.community.communitybackend.dto.LoginRequestDto;
import com.community.communitybackend.dto.SignupRequestDto;
import com.community.communitybackend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import com.community.communitybackend.dto.UpdateNicknameRequestDto;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ApiResponse<AuthResponseDto> signup(@RequestBody SignupRequestDto request) {
        return ApiResponse.success(authService.signup(request));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponseDto> login(@RequestBody LoginRequestDto request) {
        return ApiResponse.success(authService.login(request));
    }

    @PutMapping("/nickname")
    public ApiResponse<AuthResponseDto> updateNickname(@RequestBody UpdateNicknameRequestDto request) {
        return ApiResponse.success(authService.updateNickname(request));
    }
}