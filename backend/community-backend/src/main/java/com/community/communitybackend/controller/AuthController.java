package com.community.communitybackend.controller;

import com.community.communitybackend.dto.ApiResponse;
import com.community.communitybackend.dto.AccountRecoveryResponseDto;
import com.community.communitybackend.dto.AuthResponseDto;
import com.community.communitybackend.dto.FindUsernameRequestDto;
import com.community.communitybackend.dto.LoginRequestDto;
import com.community.communitybackend.dto.PasswordResetConfirmRequestDto;
import com.community.communitybackend.dto.PasswordResetRequestDto;
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

    @PostMapping("/find-username")
    public ApiResponse<AccountRecoveryResponseDto> findUsername(@RequestBody FindUsernameRequestDto request) {
        return ApiResponse.success(authService.findUsername(request));
    }

    @PostMapping("/password-reset/request")
    public ApiResponse<AccountRecoveryResponseDto> requestPasswordReset(@RequestBody PasswordResetRequestDto request) {
        return ApiResponse.success(authService.requestPasswordReset(request));
    }

    @PostMapping("/password-reset/confirm")
    public ApiResponse<AccountRecoveryResponseDto> confirmPasswordReset(@RequestBody PasswordResetConfirmRequestDto request) {
        return ApiResponse.success(authService.confirmPasswordReset(request));
    }

    @PutMapping("/nickname")
    public ApiResponse<AuthResponseDto> updateNickname(@RequestBody UpdateNicknameRequestDto request) {
        return ApiResponse.success(authService.updateNickname(request));
    }
}
