package com.community.communitybackend.controller;

import com.community.communitybackend.dto.UserResponseDto;
import com.community.communitybackend.service.UserService;
import com.community.communitybackend.dto.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/api/users/{userId}")
    public ApiResponse<UserResponseDto> getUserById(@PathVariable Long userId) {
        return ApiResponse.success(userService.getUserById(userId));
    }
}