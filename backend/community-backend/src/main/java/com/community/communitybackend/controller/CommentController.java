package com.community.communitybackend.controller;

import com.community.communitybackend.dto.ApiResponse;
import com.community.communitybackend.dto.CommentCreateRequestDto;
import com.community.communitybackend.dto.CommentResponseDto;
import com.community.communitybackend.dto.CommentUpdateRequestDto;
import com.community.communitybackend.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public ApiResponse<CommentResponseDto> createComment(@RequestBody CommentCreateRequestDto request) {
        return ApiResponse.success(commentService.createComment(request));
    }

    @GetMapping("/post/{postId}")
    public ApiResponse<List<CommentResponseDto>> getCommentsByPostId(@PathVariable Long postId) {
        return ApiResponse.success(commentService.getCommentsByPostId(postId));
    }

    @GetMapping("/user/{userId}")
    public ApiResponse<List<CommentResponseDto>> getCommentsByUserId(@PathVariable Long userId) {
        return ApiResponse.success(commentService.getCommentsByUserId(userId));
    }

    @DeleteMapping("/{commentId}")
    public ApiResponse<String> deleteComment(
            @PathVariable Long commentId,
            @RequestParam Long userId,
            @RequestParam String role) {
        commentService.deleteComment(commentId, userId, role);
        return ApiResponse.success("댓글이 삭제되었습니다.");
    }

    @PutMapping("/{commentId}")
    public ApiResponse<CommentResponseDto> updateComment(
            @PathVariable Long commentId,
            @RequestBody CommentUpdateRequestDto request) {
        return ApiResponse.success(commentService.updateComment(commentId, request));
    }
}