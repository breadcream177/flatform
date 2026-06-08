package com.community.communitybackend.controller;

import com.community.communitybackend.dto.ApiResponse;
import com.community.communitybackend.dto.PostCreateRequestDto;
import com.community.communitybackend.dto.PostResponseDto;
import com.community.communitybackend.dto.PostUpdateRequestDto;
import com.community.communitybackend.service.PostService;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping
    public ApiResponse<PostResponseDto> createPost(@RequestBody PostCreateRequestDto request) {
        return ApiResponse.success(postService.createPost(request));
    }

    @GetMapping
    public ApiResponse<List<PostResponseDto>> getPosts() {
        return ApiResponse.success(postService.getPosts());
    }

    @GetMapping("/{postId}")
    public ApiResponse<PostResponseDto> getPostById(@PathVariable Long postId) {
        return ApiResponse.success(postService.getPostById(postId));
    }

    @GetMapping("/board/{boardId}")
    public ApiResponse<List<PostResponseDto>> getPostsByBoardId(@PathVariable Long boardId) {
        return ApiResponse.success(postService.getPostsByBoardId(boardId));
    }

    @PutMapping("/{postId}")
    public ApiResponse<PostResponseDto> updatePost(
            @PathVariable Long postId,
            @RequestBody PostUpdateRequestDto request
    ) {
        return ApiResponse.success(postService.updatePost(postId, request));
    }

    @DeleteMapping("/{postId}")
    public ApiResponse<String> deletePost(
            @PathVariable Long postId,
            @RequestParam Long userId,
            @RequestParam String role
    ) {
        postService.deletePost(postId, userId, role);
        return ApiResponse.success("게시글을 삭제했습니다.");
    }

    @GetMapping("/{postId}/detail")
    public ApiResponse<Map<String, Object>> getPostDetail(@PathVariable Long postId) {
        return ApiResponse.success(postService.getPostDetail(postId));
    }

    @GetMapping("/user/{userId}")
    public ApiResponse<List<PostResponseDto>> getPostsByUserId(@PathVariable Long userId) {
        return ApiResponse.success(postService.getPostsByUserId(userId));
    }

    @GetMapping("/search")
    public ApiResponse<List<PostResponseDto>> searchPosts(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "date") String sort
    ) {
        return ApiResponse.success(postService.searchPosts(keyword, sort));
    }
}
